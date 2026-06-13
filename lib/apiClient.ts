const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

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
  /**
   * Override manual jika diperlukan
   */
  if (explicitTokenType) {
    return explicitTokenType === "pengguna" ? "penggunaToken" : "accessToken";
  }

  /**
   * LOGIN PENGGUNA WEB
   *
   * Flow:
   * Token A -> /pengguna/pin-login -> dapat Token C
   *
   * Jadi endpoint ini memakai Token A
   */
  if (endpoint.includes("/pengguna/pin-login")) {
    return "accessToken";
  }

  /**
   * Setup awal owner
   * juga memakai token level akun/setup
   */
  if (endpoint.includes("/pengguna/register-owner")) {
    return "accessToken";
  }

  /**
   * Endpoint operasional
   * wajib Token C
   */
  if (
    endpoint.includes("/pengguna/") ||
    endpoint.includes("/device/") ||
    endpoint.includes("/role") ||
    endpoint.includes("/permission")
  ) {
    return "penggunaToken";
  }

  /**
   * Default fallback:
   * Token A
   */
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

  /**
   * Failsafe
   * cegah string "undefined"/"null"
   */
  if (token === "undefined" || token === "null") {
    token = null;
  }

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

/**
 * Queue refresh token
 * agar multiple request 401
 * tidak trigger refresh bersamaan
 */
let isRefreshing = false;

let refreshQueue: Array<(token: string) => void> = [];

/**
 * Queue refresh token pengguna
 * agar multiple request 401
 * tidak trigger refresh bersamaan
 */
let isRefreshingPengguna = false;

let refreshPenggunaQueue: Array<(token: string) => void> = [];

/**
 * Refresh Token C (pengguna/web)
 * Refresh token dikirim otomatis via cookie HttpOnly
 */
async function tryRefreshPenggunaToken(): Promise<string | null> {
  if (isRefreshingPengguna) {
    return new Promise((resolve) => {
      refreshPenggunaQueue.push((token) => {
        resolve(token);
      });
    });
  }

  isRefreshingPengguna = true;

  try {
    const res = await fetch(`${BASE_URL}/pengguna/pin-refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Refresh token pengguna invalid");
    }

    const data = await res.json();

    const newToken = data.data.accessToken;

    /**
     * Simpan Token C baru
     */
    sessionStorage.setItem("penggunaToken", newToken);

    /**
     * Jalankan queue request tertahan
     */
    refreshPenggunaQueue.forEach((cb) => cb(newToken));

    refreshPenggunaQueue = [];

    return newToken;
  } catch {
    /**
     * Jika refresh gagal:
     * clear token pengguna saja, jangan sentuh token akun
     */
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
      refreshQueue.push((token) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${BASE_URL}/akun/auth/refreshtoken`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Refresh token invalid");
    }

    const data = await res.json();

    const newToken = data.accessToken;

    /**
     * Simpan Token A baru
     */
    sessionStorage.setItem("accessToken", newToken);

    /**
     * Jalankan queue request tertahan
     */
    refreshQueue.forEach((cb) => cb(newToken));

    refreshQueue = [];

    return newToken;
  } catch {
    /**
     * Jika refresh gagal:
     * logout total
     */
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

  /**
   * Tentukan token aktif
   */
  const activeKey = determineTokenKey(endpoint, explicitTokenType);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",

      ...getAuthHeaders(activeKey),

      ...extraHeaders,
    },

    ...restOptions,
  });

  /**
   * Token C expired
   *
   * Jangan refresh Token A.
   * Langsung lempar ke login pengguna.
   */
  if (
    res.status === 401 &&
    retry &&
    activeKey === "penggunaToken" &&
    !endpoint.includes("/pengguna/pin-refresh")
  ) {
    const newToken = await tryRefreshPenggunaToken();

    if (newToken) {
      return request<T>(endpoint, options, false, explicitTokenType);
    }

    throw new Error("Sesi pengguna telah berakhir.");
  }

  /**
   * Token A expired
   */
  if (
    res.status === 401 &&
    retry &&
    activeKey === "accessToken" &&
    !endpoint.includes("/auth/refreshtoken")
  ) {
    const newToken = await tryRefreshToken();

    if (newToken) {
      return request<T>(endpoint, options, false, explicitTokenType);
    }

    throw new Error("Sesi akun telah berakhir.");
  }

  /**
   * Error handling backend
   */
  if (!res.ok) {
    let errorMessage = "Terjadi kesalahan server.";

    try {
      const error = await res.json();

      // Tangkap format error array (biasanya dari express-validator)
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors
          .map((e: any) => e.msg || e.message || JSON.stringify(e))
          .join(", ");
      }
      // Tangkap format error object (biasanya dari Mongoose ValidationError)
      else if (error.errors && typeof error.errors === "object") {
        errorMessage = Object.values(error.errors)
          .map((e: any) => e.message || e)
          .join(", ");
      }
      // Tangkap format standar
      else {
        errorMessage = error.message || error.error || errorMessage;
      }
    } catch {
      /**
       * ignore parse error
       */
    }

    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit, tokenType?: TokenType) =>
    request<T>(
      endpoint,
      {
        method: "GET",
        ...options,
      },
      true,
      tokenType,
    ),

  post: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestInit,
    tokenType?: TokenType,
  ) =>
    request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
        ...options,
      },
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
      {
        method: "PUT",
        body: JSON.stringify(body),
        ...options,
      },
      true,
      tokenType,
    ),

  delete: <T>(endpoint: string, options?: RequestInit, tokenType?: TokenType) =>
    request<T>(
      endpoint,
      {
        method: "DELETE",
        ...options,
      },
      true,
      tokenType,
    ),
};
