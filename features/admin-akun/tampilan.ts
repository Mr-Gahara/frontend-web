import { formatTanggalPendek } from "@/lib/format";
import type { AkunRole } from "@/types/auth";
import type { AkunAdmin } from "@/types/adminAkun";

export const URL_DAFTAR_AKUN = "/admin";
export const URL_BUAT_AKUN = "/admin/akun/buat";
export const urlDetailAkun = (id: string) => `/admin/akun/${id}`;

export type FilterStatusAkun = "semua" | "aktif" | "non-aktif";

export const LABEL_ROLE: Record<AkunRole, string> = { admin: "Admin", client: "Klien" };

/** Nama toko akun; null bila akun belum terikat toko. */
export function namaToko(akun: AkunAdmin): string | null {
  return akun.daftarTenant[0]?.namaToko ?? null;
}

/** Pencarian email, username, dan nama toko tanpa membedakan huruf, serta filter status. */
export function saringAkun(daftar: AkunAdmin[], kata: string, status: FilterStatusAkun): AkunAdmin[] {
  const kunci = kata.trim().toLowerCase();
  return daftar.filter((akun) => {
    if (status !== "semua" && akun.status !== status) return false;
    if (!kunci) return true;
    return [akun.email, akun.username ?? "", namaToko(akun) ?? ""].some((teks) =>
      teks.toLowerCase().includes(kunci),
    );
  });
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