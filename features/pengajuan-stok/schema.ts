import { z } from "zod";
import { itemValid } from "./payload";

/**
 * Skema form buat dan edit pengajuan. Jumlah disimpan sebagai teks agar
 * isian kosong tetap tampil kosong; konversi ke angka ada di payload.ts.
 * Lokasi disimpan per sisi (outlet dan gudang); arah menentukan sisi mana
 * yang menjadi asal barang (lokasiMenurutArah, P8).
 */
export const skemaPengajuan = z
  .object({
    arah: z.enum(["GUDANG_KE_OUTLET", "OUTLET_KE_GUDANG"]),
    outletID: z.string().min(1, "Outlet wajib dipilih."),
    gudangID: z.string().min(1, "Gudang wajib dipilih."),
    tanggalKebutuhan: z.date().optional(),
    catatan: z.string(),
    items: z
      .array(z.object({ bahanBakuID: z.string(), jumlah: z.string(), satuan: z.string() }))
      .min(1),
  })
  .refine((nilai) => nilai.items.some(itemValid), {
    message: "Minimal harus ada 1 barang dengan jumlah valid.",
    path: ["items"],
  });

export type NilaiFormPengajuan = z.infer<typeof skemaPengajuan>;