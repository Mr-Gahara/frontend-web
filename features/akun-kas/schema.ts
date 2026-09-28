import * as z from "zod";

/**
 * Skema buat akun kas. z.coerce dipertahankan dengan tipe masukan dan
 * keluaran eksplisit (keputusan KU3a, sejalan dengan T2a). .default()
 * dibuang karena nilai awal sudah ada di defaultValues: Controller saldo
 * selalu menyerahkan angka (0 untuk isian kosong) dan status selalu diisi
 * Select, sehingga keduanya tidak pernah undefined. tipeAkun wajib karena
 * validator backend mewajibkannya saat create. Nama dan nomor dipangkas,
 * sehingga isian berisi spasi saja ditolak form (keputusan KU7a).
 */
export const skemaAkunKas = z.object({
  tipeAkun: z.enum(["Kas Fisik", "Rekening Bank"], {
    message: "Tipe akun wajib dipilih.",
  }),
  namaAkun: z.string().trim().min(1, "Nama Akun wajib diisi."),
  nomorAkun: z.string().trim().min(1, "Nomor Akun wajib diisi."),
  keterangan: z.string().optional(),
  saldo: z.coerce.number().min(0, "Saldo tidak boleh negatif."),
  status: z.enum(["aktif", "non-aktif"]),
});

export type MasukanAkunKas = z.input<typeof skemaAkunKas>;
export type KeluaranAkunKas = z.output<typeof skemaAkunKas>;