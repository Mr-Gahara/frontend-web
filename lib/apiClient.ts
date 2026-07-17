const BASE_URL =
  typeof window !== "undefined"
    ? "/api" // browser: pakai path relatif, otomatis ikut domain apapun (localhost/ngrok)
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"; // SSR fallback

/**
 * Header tambahan untuk bypass ngrok interstitial page.
 * Aman diabaikan saat pakai localhost — tidak ada efek samping.
 */
const COMMON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

type TokenType = "akun" | "pengguna";

/**
 * Menentukan token apa yang harus dipakai
 * berdasarkan endpoint yang diakses.
 *
 * accessToken  = Token A (akun SaaS)
 * penggunaToken = Token C (owner/kasir/operator)
 */
function determineTokenKey(
  endpoint: string,
  explicitTokenType?: TokenType,
): "accessToken" | "penggunaToken" {
  if (explicitTokenType) {
    return explicitTokenType === "pengguna" ? "penggunaToken" : "accessToken";
  }

  if (endpoint.includes("/pengguna/pin-login")) {
    return "accessToken";
  }

  if (endpoint.includes("/pengguna/register-owner")) {
    return "accessToken";
  }

  if (
    endpoint.includes("/pengguna/") ||
    endpoint.includes("/device/") ||
    endpoint.includes("/role") ||
    endpoint.includes("/permission")
  ) {
    return "penggunaToken";
  }

  return "accessToken";
}

/**
 * Ambil Authorization header
 */
function getAuthHeaders(
  key: "accessToken" | "penggunaToken",
): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  let token = sessionStorage.getItem(key);

  if (token === "undefined" || token === "null") {
    token = null;
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

let isRefreshingPengguna = false;
let refreshPenggunaQueue: Array<(token: string) => void> = [];

/**
 * Refresh Token C (pengguna/web)
 */
async function tryRefreshPenggunaToken(): Promise<string | null> {
  if (isRefreshingPengguna) {
    return new Promise((resolve) => {
      refreshPenggunaQueue.push((token) => resolve(token));
    });
  }

  isRefreshingPengguna = true;

  try {
    const res = await fetch(`${BASE_URL}/pengguna/pin-refresh`, {
      method: "POST",
      credentials: "include",
      headers: { ...COMMON_HEADERS },
    });

    if (!res.ok) throw new Error("Refresh token pengguna invalid");

    const data = await res.json();
    const newToken = data.data.accessToken;

    sessionStorage.setItem("penggunaToken", newToken);
    refreshPenggunaQueue.forEach((cb) => cb(newToken));
    refreshPenggunaQueue = [];

    return newToken;
  } catch {
    sessionStorage.removeItem("penggunaToken");
    if (typeof window !== "undefined") {
      window.location.href = "/login/pengguna";
    }
    return null;
  } finally {
    isRefreshingPengguna = false;
  }
}

/**
 * Refresh Token A
 */
async function tryRefreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push((token) => resolve(token));
    });
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${BASE_URL}/akun/auth/refreshtoken`, {
      method: "POST",
      credentials: "include",
      headers: { ...COMMON_HEADERS },
    });

    if (!res.ok) throw new Error("Refresh token invalid");

    const data = await res.json();
    const newToken = data.accessToken;

    sessionStorage.setItem("accessToken", newToken);
    refreshQueue.forEach((cb) => cb(newToken));
    refreshQueue = [];

    return newToken;
  } catch {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("penggunaToken");
    localStorage.removeItem("akun");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Core request wrapper
 */
async function request<T>(
  endpoint: string,
  options?: RequestInit,
  retry = true,
  explicitTokenType?: TokenType,
): Promise<T> {
  const { headers: extraHeaders, ...restOptions } = options || {};

  const activeKey = determineTokenKey(endpoint, explicitTokenType);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      ...COMMON_HEADERS,
      ...getAuthHeaders(activeKey),
      ...(extraHeaders as Record<string, string>),
    },
    ...restOptions,
  });

  // Token C expired
  if (
    res.status === 401 &&
    retry &&
    activeKey === "penggunaToken" &&
    !endpoint.includes("/pengguna/pin-refresh")
  ) {
    const newToken = await tryRefreshPenggunaToken();
    if (newToken) return request<T>(endpoint, options, false, explicitTokenType);
    throw new Error("Sesi pengguna telah berakhir.");
  }

  // Token A expired
  if (
    res.status === 401 &&
    retry &&
    activeKey === "accessToken" &&
    !endpoint.includes("/auth/refreshtoken")
  ) {
    const newToken = await tryRefreshToken();
    if (newToken) return request<T>(endpoint, options, false, explicitTokenType);
    throw new Error("Sesi akun telah berakhir.");
  }

  if (!res.ok) {
    let errorMessage = "Terjadi kesalahan server.";

    try {
      const error = await res.json();

      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors
          .map((e: any) => e.msg || e.message || JSON.stringify(e))
          .join(", ");
      } else if (error.errors && typeof error.errors === "object") {
        errorMessage = Object.values(error.errors)
          .map((e: any) => e.message || e)
          .join(", ");
      } else {
        errorMessage = error.message || error.error || errorMessage;
      }
    } catch {
      // ignore parse error
    }

    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit, tokenType?: TokenType) =>
    request<T>(endpoint, { method: "GET", ...options }, true, tokenType),
  post: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestInit,
    tokenType?: TokenType,
  ) =>
    request<T>(
      endpoint,
      { method: "POST", body: JSON.stringify(body), ...options },
      true,
      tokenType,
    ),
  put: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestInit,
    tokenType?: TokenType,
  ) =>
    request<T>(
      endpoint,
      { method: "PUT", body: JSON.stringify(body), ...options },
      true,
      tokenType,
    ),
  patch: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestInit,
    tokenType?: TokenType,
  ) =>
    request<T>(
      endpoint,
      { method: "PATCH", body: JSON.stringify(body), ...options },
      true,
      tokenType,
    ),
  delete: <T>(endpoint: string, options?: RequestInit, tokenType?: TokenType) =>
    request<T>(endpoint, { method: "DELETE", ...options }, true, tokenType),
};