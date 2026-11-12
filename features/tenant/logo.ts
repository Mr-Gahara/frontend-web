/**
 * Aturan logo toko (B203 sampai B205): diperiksa di klien dengan aturan
 * yang sama dengan backend, agar berkas yang pasti ditolak tidak dikirim.
 */

export const JENIS_LOGO = ["image/jpeg", "image/png", "image/webp"] as const;
export const BATAS_LOGO_BYTE = 2 * 1024 * 1024;
export const TERIMA_LOGO = JENIS_LOGO.join(",");

/** Pesan galat yang sama dengan backend, atau null bila berkas boleh dikirim. */
export function periksaBerkasLogo(berkas: Pick<File, "type" | "size">): string | null {
  if (!(JENIS_LOGO as readonly string[]).includes(berkas.type)) {
    return "Format logo tidak valid. Gunakan JPEG, PNG, atau WebP.";
  }
  if (berkas.size > BATAS_LOGO_BYTE) return "Ukuran logo maksimal 2MB.";
  return null;
}

/**
 * logoUrl backend berupa "/api/tenant/<id>/logo/<nama>.webp". apiClient sudah
 * berawalan /api, sehingga awalan itu dibuang sebelum diminta.
 */
export function jalurLogo(logoUrl: string): string {
  return logoUrl.replace(/^\/api(?=\/)/, "");
}
