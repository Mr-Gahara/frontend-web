import * as z from "zod";
import type { PaketMembership, PaketMembershipPayload } from "@/types/membership";

/**
 * Form paket membership (dialog Tambah dan Ubah, desain B). Aturan sama
 * dengan validators/paketMembershipValidator.js backend: nama wajib, harga
 * angka tidak negatif, durasi bilangan bulat minimal 1 hari. Keunikan nama
 * per toko diperiksa backend.
 */
export const skemaPaket = z
  .object({
    namaPaket: z.string().trim().min(1, "Nama paket wajib diisi.").max(100, "Nama paket maksimal 100 karakter."),
    harga: z.string().trim(),
    durasiHari: z.string().trim(),
    deskripsi: z.string().trim().max(500, "Deskripsi maksimal 500 karakter."),
    aktif: z.boolean(),
  })
  .superRefine((nilai, ctx) => {
    const harga = Number(nilai.harga);
    if (nilai.harga === "" || !Number.isFinite(harga) || harga < 0) {
      ctx.addIssue({ code: "custom", path: ["harga"], message: "Harga wajib berupa angka, boleh 0." });
    }
    const durasi = Number(nilai.durasiHari);
    if (nilai.durasiHari === "" || !Number.isInteger(durasi) || durasi < 1) {
      ctx.addIssue({ code: "custom", path: ["durasiHari"], message: "Durasi wajib bilangan bulat, minimal 1 hari." });
    }
  });

export type IsianPaket = z.infer<typeof skemaPaket>;

export function nilaiAwalPaket(paket: PaketMembership | null): IsianPaket {
  return {
    namaPaket: paket?.namaPaket ?? "",
    harga: paket ? String(paket.harga) : "",
    durasiHari: paket ? String(paket.durasiHari) : "",
    deskripsi: paket?.deskripsi ?? "",
    aktif: paket ? paket.status === "Aktif" : true,
  };
}

/** POST: seluruh field; deskripsi kosong tidak dikirim. */
export function payloadBuatPaket(isian: IsianPaket): PaketMembershipPayload {
  return {
    namaPaket: isian.namaPaket,
    harga: Number(isian.harga),
    durasiHari: Number(isian.durasiHari),
    ...(isian.deskripsi ? { deskripsi: isian.deskripsi } : {}),
    status: isian.aktif ? "Aktif" : "Non-Aktif",
  };
}

/**
 * PUT: hanya field yang berubah dibanding data server (keputusan rancangan
 * butir 15); deskripsi yang dikosongkan dikirim null. Hasil kosong berarti
 * tidak ada perubahan.
 */
export function payloadUbahPaket(isian: IsianPaket, tersimpan: PaketMembership): PaketMembershipPayload {
  const p: PaketMembershipPayload = {};
  if (isian.namaPaket !== tersimpan.namaPaket) p.namaPaket = isian.namaPaket;
  if (Number(isian.harga) !== tersimpan.harga) p.harga = Number(isian.harga);
  if (Number(isian.durasiHari) !== tersimpan.durasiHari) p.durasiHari = Number(isian.durasiHari);
  const deskripsi = isian.deskripsi || null;
  if (deskripsi !== (tersimpan.deskripsi ?? null)) p.deskripsi = deskripsi;
  const status = isian.aktif ? "Aktif" : "Non-Aktif";
  if (status !== tersimpan.status) p.status = status;
  return p;
}
