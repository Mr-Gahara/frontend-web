import { isApiError } from "@/lib/api/error";
import { formatTanggalPendek } from "@/lib/format";
import type { AkunRole } from "@/types/auth";
import type { AkunAdmin } from "@/types/adminAkun";

export const URL_DAFTAR_AKUN = "/admin";
export const URL_BUAT_AKUN = "/admin/akun/buat";
export const urlDetailAkun = (id: string) => `/admin/akun/${id}`;
export const urlUbahAkun = (id: string) => `/admin/akun/${id}/ubah`;

/** Id rusak (400) dan akun yang tidak ada (404) sama-sama berarti akun tidak ditemukan (B176). */
export const akunTidakAda = (err: unknown): boolean =>
  isApiError(err) && (err.status === 404 || err.status === 400);

export type FilterStatusAkun = "semua" | "aktif" | "non-aktif";

export const LABEL_ROLE: Record<AkunRole, string> = { admin: "Admin", client: "Klien" };

/** Nama toko akun; null bila akun belum terikat toko. */
export function namaToko(akun: AkunAdmin): string | null {
  return akun.daftarTenant[0]?.namaToko ?? null;
}

/** Batas cari GET /akun/admin/all, sama dengan daftar lain yang disaring server. */
export const PANJANG_CARI_AKUN = 100;

/**
 * Query satu halaman GET /akun/admin/all (B177). Server mencocokkan email,
 * username, dan nama toko tanpa membedakan huruf, serta status, sehingga
 * pagination.total benar (keputusan rancangan butir 27).
 */
export function paramDaftarAkun(
  kata: string,
  status: FilterStatusAkun,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  const params: Record<string, string> = { page: String(halaman), limit: String(ukuran) };
  const cari = kata.trim().slice(0, PANJANG_CARI_AKUN);
  if (cari) params.cari = cari;
  if (status !== "semua") params.status = status;
  return params;
}

/** Status beserta alasan non-aktif, agar pembekuan manual terbedakan dari kedaluwarsa. */
export function teksStatus(akun: AkunAdmin): string {
  if (akun.status === "aktif") return "Aktif";
  if (akun.langganan.alasanNonAktif === "kedaluwarsa") return "Non-aktif (kedaluwarsa)";
  if (akun.langganan.alasanNonAktif === "manual") return "Non-aktif (dibekukan admin)";
  return "Non-aktif";
}

/** Akun admin tidak berlangganan; akun klien tanpa tanggal tidak dibatasi masa aksesnya. */
export function teksMasaAkses(akun: AkunAdmin): string {
  if (akun.role === "admin") return "-";
  const berakhir = akun.langganan.aksesBerakhirPada;
  return berakhir ? formatTanggalPendek(berakhir) : "Tidak dibatasi";
}

/** Kolom toko: akun admin tidak punya toko, akun klien bisa belum men-setup toko. */
export function teksToko(akun: AkunAdmin): string {
  if (akun.role === "admin") return "-";
  return namaToko(akun) ?? "Belum punya toko";
}