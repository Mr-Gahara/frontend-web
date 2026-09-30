import type {
  MetodePembayaran,
  MetodePembayaranBaru,
  PerubahanMetodePembayaran,
} from "@/types/metodePembayaran";
import type { NilaiMetodePembayaran } from "./schema";

/** Nilai awal form buat, sama dengan halaman lama: non-tunai dan aktif. */
export const NILAI_AWAL_METODE: NilaiMetodePembayaran = {
  namaPembayaran: "",
  kategori: "non-tunai",
  akunKasID: "",
  isActive: true,
};

/** Nilai awal form ubah dari detail; akun kas dibaca dari objek akunKas mapper backend. */
export function nilaiAwalMetode(m: MetodePembayaran): NilaiMetodePembayaran {
  return {
    namaPembayaran: m.namaPembayaran,
    kategori: m.kategori,
    akunKasID: m.akunKas?.id ?? "",
    isActive: m.isActive,
  };
}

/**
 * Payload buat: keempat field allowlist backend saja. Halaman lama ikut
 * mengirim isAutomated dan xenditChannelCode, sehingga setiap pembuatan
 * ditolak 400 (kontrak/temuan.md butir 84).
 */
export function payloadBuatMetode(n: NilaiMetodePembayaran): MetodePembayaranBaru {
  return {
    namaPembayaran: n.namaPembayaran.trim(),
    kategori: n.kategori,
    akunKasID: n.akunKasID,
    isActive: n.isActive,
  };
}

/**
 * Payload ubah: hanya field yang berbeda dari data server (keputusan
 * rancangan butir 15). Akun yang tidak berubah tidak dikirim, karena backend
 * memeriksa akun aktif setiap kali akunKasID dikirim; metode yang akunnya
 * sudah nonaktif tetap dapat diganti nama atau dinonaktifkan. Payload kosong
 * berarti tidak ada perubahan, dan backend menolaknya 400.
 */
export function payloadUbahMetode(
  n: NilaiMetodePembayaran,
  asal: MetodePembayaran,
): PerubahanMetodePembayaran {
  const p: PerubahanMetodePembayaran = {};
  const nama = n.namaPembayaran.trim();
  if (nama !== asal.namaPembayaran) p.namaPembayaran = nama;
  if (n.kategori !== asal.kategori) p.kategori = n.kategori;
  if (n.akunKasID !== (asal.akunKas?.id ?? "")) p.akunKasID = n.akunKasID;
  if (n.isActive !== asal.isActive) p.isActive = n.isActive;
  return p;
}