/**
 * Klien API dengan error bertipe dan respons ternormalisasi.
 *
 * Dibangun di atas lib/apiClient.ts agar halaman lama tetap berjalan
 * selama migrasi bertahap. Perbedaannya:
 *   - mengembalikan data yang sudah dinormalkan, bukan envelope mentah
 *   - meneruskan ApiError lengkap dengan status dan daftar errors
 *   - token pengguna menjadi default, karena seluruh endpoint bisnis
 *     memakainya (docs/kontrak/README.md bagian 2.2)
 *
 * Penanganan sesi (refresh 401, pengalihan ke login) masih di apiClient
 * dan akan dipindahkan pada tahap sesi.
 */

import { apiClient } from "@/lib/apiClient";
import { ApiError } from "./error";
import { unwrap, type HasilApi } from "./normalize";

type TokenType = "akun" | "pengguna";

/** apiClient sudah melempar ApiError; sisanya kegagalan jaringan. */
function keApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError(
    0,
    e instanceof Error ? e.message : "Terjadi kesalahan jaringan.",
  );
}

async function jalankan<T>(fn: () => Promise<unknown>): Promise<HasilApi<T>> {
  try {
    return unwrap<T>(await fn());
  } catch (e) {
    throw keApiError(e);
  }
}

export const api = {
  get: <T>(
    endpoint: string,
    params?: Record<string, unknown>,
    tokenType: TokenType = "pengguna",
  ) => jalankan<T>(() => apiClient.get(endpoint, params, tokenType)),

  post: <T>(endpoint: string, body: unknown, tokenType: TokenType = "pengguna") =>
    jalankan<T>(() => apiClient.post(endpoint, body, undefined, tokenType)),

  put: <T>(endpoint: string, body: unknown, tokenType: TokenType = "pengguna") =>
    jalankan<T>(() => apiClient.put(endpoint, body, undefined, tokenType)),

  patch: <T>(endpoint: string, body: unknown, tokenType: TokenType = "pengguna") =>
    jalankan<T>(() => apiClient.patch(endpoint, body, undefined, tokenType)),

  delete: <T>(endpoint: string, tokenType: TokenType = "pengguna") =>
    jalankan<T>(() => apiClient.delete(endpoint, undefined, tokenType)),
};

/** Varian yang langsung mengembalikan isi, untuk pemakaian paling umum. */
export const apiData = {
  get: async <T>(endpoint: string, params?: Record<string, unknown>, tokenType?: TokenType) =>
    (await api.get<T>(endpoint, params, tokenType)).data,
  post: async <T>(endpoint: string, body: unknown, tokenType?: TokenType) =>
    (await api.post<T>(endpoint, body, tokenType)).data,
  put: async <T>(endpoint: string, body: unknown, tokenType?: TokenType) =>
    (await api.put<T>(endpoint, body, tokenType)).data,
  patch: async <T>(endpoint: string, body: unknown, tokenType?: TokenType) =>
    (await api.patch<T>(endpoint, body, tokenType)).data,
  delete: async <T>(endpoint: string, tokenType?: TokenType) =>
    (await api.delete<T>(endpoint, tokenType)).data,
};