import { isApiError } from "@/lib/api/error";
import { formatTanggalPendek } from "@/lib/format";
import type { AkunRole } from "@/types/auth";
import type { AkunAdmin } from "@/types/adminAkun";
import { namaPlan } from "@/features/langganan/data";

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

/**
 * Lencana status gaya A (pemilik proyek, 24 November 2026): Aktif atau
 * Non-aktif, dengan keterangan alasan non-aktif di bawahnya. Nada dipakai
 * komponen untuk memilih warna token.
 */
export interface StatusLencana {
  label: "Aktif" | "Non-aktif";
  keterangan: "Kedaluwarsa" | "Dibekukan admin" | null;
  nada: "aktif" | "kedaluwarsa" | "beku";
}

export function statusLencana(akun: AkunAdmin): StatusLencana {
  if (akun.status === "aktif") return { label: "Aktif", keterangan: null, nada: "aktif" };
  if (akun.langganan.alasanNonAktif === "kedaluwarsa") {
    return { label: "Non-aktif", keterangan: "Kedaluwarsa", nada: "kedaluwarsa" };
  }
  if (akun.langganan.alasanNonAktif === "manual") {
    return { label: "Non-aktif", keterangan: "Dibekukan admin", nada: "beku" };
  }
  return { label: "Non-aktif", keterangan: null, nada: "beku" };
}

/** Dua huruf awal avatar dari username, atau dari bagian lokal email. */
export function inisialAkun(akun: Pick<AkunAdmin, "email" | "username">): string {
  const sumber = (akun.username || akun.email.split("@")[0] || "").trim();
  const kata = sumber.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const huruf = kata.length >= 2 ? kata[0][0] + kata[1][0] : sumber.slice(0, 2);
  return huruf.toUpperCase() || "?";
}

/**
 * Susunan kolom daftar akun desain A menurut lebar wadahnya (pemilik
 * proyek, 24 November 2026): enam kolom di lebar meja, empat kolom (toko
 * di bawah email, tanpa Dibuat) di lebar tablet, dan enam field berlabel di
 * kartu HP. Wadah yang belum terukur memakai susunan penuh.
 */
export const BATAS_KOLOM_RINGKAS = { bawah: 600, atas: 960 } as const;

export function kolomRingkas(lebarWadah: number | null): boolean {
  return lebarWadah !== null && lebarWadah >= BATAS_KOLOM_RINGKAS.bawah && lebarWadah < BATAS_KOLOM_RINGKAS.atas;
}

/**
 * Dialog aksi akun desain B (pemilik proyek, 24 November 2026): di bawah
 * 640 px menjadi panel dari bawah selebar layar, mulai 640 px dialog di
 * tengah. Tinggi dibatasi layar dan isinya bergulir.
 */
export const KELAS_DIALOG_ADMIN =
  "max-h-[90dvh] overflow-y-auto sm:max-w-md max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl";

/** Tombol utama panel admin berwarna navy seperti kanvas desain B, bukan primary bawaan yang hitam. */
export const KELAS_TOMBOL_UTAMA = "bg-navy text-gading hover:bg-navy-terang";

/** Tinggi tombol kaki form dan Kelola Akun: 40 px di HP, 44 px mulai 640 px (kanvas desain B). */
export const KELAS_TINGGI_TOMBOL = "h-10 font-bold sm:h-11";

/** Query hitungan kartu ringkas: halaman pertama berukuran 1, tanpa pencarian. */
export function paramJumlahAkun(status: FilterStatusAkun): Record<string, string> {
  return paramDaftarAkun("", status, 1, 1);
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

/** Akun admin tidak berplan; namaPlan(null) berarti Basic, sehingga admin ditangani lebih dulu. */
export function teksPlan(akun: AkunAdmin): string {
  return akun.role === "admin" || !akun.plan ? "-" : namaPlan(akun.plan);
}

/** Kolom toko: akun admin tidak punya toko, akun klien bisa belum men-setup toko. */
export function teksToko(akun: AkunAdmin): string {
  if (akun.role === "admin") return "-";
  return namaToko(akun) ?? "Belum punya toko";
}