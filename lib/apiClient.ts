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

import {
  setTokenAkun,
  setTokenPengguna,
  akhiriSesi,
  tokenAkun,
  tokenPengguna,
} from "@/lib/auth/session";
import { refreshTerkoordinasi } from "@/lib/auth/sessionChannel";
import { ApiError } from "@/lib/api/error";

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
  const token = key === "accessToken" ? tokenAkun() : tokenPengguna();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

let isRefreshingPengguna = false;
let refreshPenggunaQueue: Array<(token: string | null) => void> = [];

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
      // Body kosong wajib: backend menjawab 500 bila req.body undefined.
      body: "{}",
    });

    if (!res.ok) throw new Error("Refresh token pengguna invalid");

    const data = await res.json();
    const newToken = data.data.accessToken;

    setTokenPengguna(newToken);
    refreshPenggunaQueue.forEach((cb) => cb(newToken));
    refreshPenggunaQueue = [];

    return newToken;
  } catch {
    setTokenPengguna(null);
    // Penunggu di antrean di-resolve dengan null agar request mereka
    // tidak menggantung selamanya saat refresh gagal.
    refreshPenggunaQueue.forEach((cb) => cb(null));
    refreshPenggunaQueue = [];
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

    setTokenAkun(newToken);
    refreshQueue.forEach((cb) => cb(newToken));
    refreshQueue = [];

    return newToken;
  } catch {
    akhiriSesi();
    refreshQueue.forEach((cb) => cb(null));
    refreshQueue = [];
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
    !endpoint.includes("/pengguna/pin-refresh") &&
    !endpoint.includes("/pengguna/pin-login")
  ) {
    const newToken = await refreshTerkoordinasi("pengguna", tryRefreshPenggunaToken);
    if (newToken) return request<T>(endpoint, options, false, explicitTokenType);
    throw new ApiError(401, "Sesi pengguna telah berakhir.");
  }

  // Token A expired
  if (
    res.status === 401 &&
    retry &&
    activeKey === "accessToken" &&
    !endpoint.includes("/auth/refreshtoken") &&
    !endpoint.includes("/akun/auth/login") &&
    !endpoint.includes("/pengguna/pin-login")
  ) {
    const newToken = await refreshTerkoordinasi("akun", tryRefreshToken);
    if (newToken) return request<T>(endpoint, options, false, explicitTokenType);
    throw new ApiError(401, "Sesi akun telah berakhir.");
  }

  if (!res.ok) {
    let pesan = "Terjadi kesalahan server.";
    let daftarError: string[] = [];
    let kode: string | undefined;

    try {
      const error = await res.json();

      if (error.errors && Array.isArray(error.errors)) {
        daftarError = error.errors.map((e: any) =>
          typeof e === "string" ? e : e.msg || e.message || JSON.stringify(e),
        );
      } else if (error.errors && typeof error.errors === "object") {
        daftarError = Object.values(error.errors).map((e: any) =>
          typeof e === "string" ? e : e.message || String(e),
        );
      }

      pesan = error.message || error.error || pesan;
      kode = typeof error.code === "string" ? error.code : undefined;
    } catch {
      // Respons tanpa JSON: pertahankan pesan umum.
    }

    // Akun atau toko yang dibekukan, dan pengguna yang dinonaktifkan, tidak
    // dapat dipulihkan dengan mencoba ulang. Sesi diakhiri agar pengguna
    // tidak terjebak pada halaman yang seluruh datanya ditolak.
    if (res.status === 403 && /dinonaktifkan|dibekukan|tidak aktif/i.test(pesan)) {
      akhiriSesi();
      if (typeof window !== "undefined") window.location.href = "/login";
    }

    throw new ApiError(res.status, pesan, daftarError, kode);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  // UPGRADE: Fungsi GET kini otomatis mengubah parameter object menjadi Query String URL
  get: <T>(
    endpoint: string,
    params?: Record<string, any>,
    tokenType?: TokenType,
    options?: RequestInit
  ) => {
    let url = endpoint;

    // Jika ada parameter yang dikirim (bukan undefined/null)
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        // Abaikan nilai kosong agar URL tetap bersih
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        // Cek apakah endpoint sudah punya tanda tanya sebelumnya
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    return request<T>(url, { method: "GET", ...options }, true, tokenType);
  },

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
    
  delete: <T>(
    endpoint: string,
    options?: RequestInit,
    tokenType?: TokenType
  ) => request<T>(endpoint, { method: "DELETE", ...options }, true, tokenType),
};