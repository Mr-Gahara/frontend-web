import { z } from "zod";

export const skemaKategori = z.object({
  namaKategori: z.string().trim().min(1, "Nama kategori wajib diisi."),
  kodeKategori: z.string().trim().min(1, "Kode kategori wajib diisi."),
  keterangan: z.string().trim(),
});

export type NilaiFormKategori = z.infer<typeof skemaKategori>;