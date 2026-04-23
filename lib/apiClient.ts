const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

function getAuthHeaders(tokenType: "akun" | "pengguna" = "akun"): Record<string, string> {
  if (typeof window === "undefined") return {};
  const key = tokenType === "pengguna" ? "penggunaToken" : "accessToken";
  const token = sessionStorage.getItem(key);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

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
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Refresh failed");

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
    window.location.href = "/login";
    return null;
  } finally {
    isRefreshing = false;
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
  retry = true,
  tokenType: "akun" | "pengguna" = "akun"
): Promise<T> {
  const { headers: extraHeaders, ...restOptions } = options || {};

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(tokenType),
      ...extraHeaders,
    },
    ...restOptions,
  });

  if (res.status === 401 && retry && !endpoint.includes("auth/refreshtoken")) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return request<T>(endpoint, options, false, tokenType);
    }
    throw new Error("Sesi berakhir. Silakan login ulang.");
  }

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Request failed");
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit, tokenType: "akun" | "pengguna" = "akun") =>
    request<T>(endpoint, { method: "GET", ...options }, true, tokenType),

  post: <T>(endpoint: string, body: unknown, options?: RequestInit, tokenType: "akun" | "pengguna" = "akun") =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body), ...options }, true, tokenType),

  put: <T>(endpoint: string, body: unknown, options?: RequestInit, tokenType: "akun" | "pengguna" = "akun") =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body), ...options }, true, tokenType),

  delete: <T>(endpoint: string, options?: RequestInit, tokenType: "akun" | "pengguna" = "akun") =>
    request<T>(endpoint, { method: "DELETE", ...options }, true, tokenType),
};