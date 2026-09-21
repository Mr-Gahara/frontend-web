import { z } from "zod";
import { itemValid } from "./payload";

/**
 * Skema form buat dan edit pengajuan. Jumlah disimpan sebagai teks agar
 * isian kosong tetap tampil kosong; konversi ke angka ada di payload.ts.
 */
export const skemaPengajuan = z
  .object({
    keLocationID: z.string().min(1, "Outlet peminta wajib dipilih."),
    dariLocationID: z.string().min(1, "Gudang asal wajib dipilih."),
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