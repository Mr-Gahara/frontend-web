import { z } from "zod";

const BILANGAN_BULAT = /^\d+$/;

/**
 * Skema form role, mengikuti validators/roleValidator.js dan
 * roleService._validateLevel backend: nama 3 sampai 50 karakter setelah
 * dipangkas, deskripsi paling panjang 255, level bilangan bulat minimal 1,
 * dan minimal satu wewenang.
 *
 * Batas atas level hanya diperiksa bila level pengguna aktif diketahui
 * (lebih dari 0). Bila tidak diketahui, backend yang menolak level setara
 * atau melebihi level pengguna (keputusan RL3a).
 */
export function buatSkemaRole(levelPengguna: number) {
  return z.object({
    namaRole: z
      .string()
      .trim()
      .min(1, "Nama posisi wajib diisi.")
      .min(3, "Nama posisi minimal 3 karakter.")
      .max(50, "Nama posisi maksimal 50 karakter."),
    deskripsi: z.string().trim().max(255, "Deskripsi maksimal 255 karakter."),
    level: z
      .string()
      .trim()
      .min(1, "Level wajib diisi.")
      .refine(
        (v): boolean => BILANGAN_BULAT.test(v) && Number(v) >= 1,
        "Level harus berupa bilangan bulat lebih besar dari 0.",
      )
      .refine(
        (v): boolean =>
          levelPengguna <= 0 || BILANGAN_BULAT.test(v) === false || Number(v) < levelPengguna,
        `Level harus lebih rendah dari level Anda saat ini (${levelPengguna}).`,
      ),
    izin: z.array(z.string()).min(1, "Silakan pilih minimal 1 hak akses untuk posisi ini."),
  });
}

export type NilaiFormRole = z.infer<ReturnType<typeof buatSkemaRole>>;