/**
 * Error API bertipe.
 *
 * apiClient lama melempar Error biasa berisi pesan gabungan saja, sehingga
 * status HTTP dan daftar errors hilang. Akibatnya pemanggil tidak dapat
 * membedakan 403 izin ditolak dari 403 akun dibekukan, dan 429 tidak dapat
 * ditangani khusus.
 *
 * Bentuk error backend: { status: "error", message, errors? }
 * Sumber: docs/kontrak/README.md bagian 2.3.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly errors: string[];
  readonly code?: string;

  constructor(
    status: number,
    message: string,
    errors: string[] = [],
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }

  /** Pesan siap tampil: daftar errors bila ada, selain itu message. */
  get pesan(): string {
    return this.errors.length ? this.errors.join(", ") : this.message;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

const berstatus = (e: unknown, status: number) =>
  isApiError(e) && e.status === status;

/** 401: sesi berakhir atau diambil alih. Boleh dicoba refresh sekali. */
export const isUnauthorized = (e: unknown) => berstatus(e, 401);

/** 403: izin ditolak, pengguna nonaktif, atau tenant dibekukan. Jangan refresh. */
export const isForbidden = (e: unknown) => berstatus(e, 403);

/** 404: data tidak ada, atau id tidak valid (backend menjawab 404 untuk CastError). */
export const isNotFound = (e: unknown) => berstatus(e, 404);

/** 409: duplikat, atau data masih dipakai entitas lain. */
export const isConflict = (e: unknown) => berstatus(e, 409);

/** 429: terlalu banyak percobaan login. */
export const isRateLimited = (e: unknown) => berstatus(e, 429);

/**
 * Menyarikan pesan dari error apa pun untuk ditampilkan ke pengguna.
 * Dipakai di onError mutation yang masih menerima Error biasa.
 */
export function pesanError(e: unknown, fallback = "Terjadi kesalahan."): string {
  if (isApiError(e)) return e.pesan;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}