import type { ResponsLoginPengguna } from "@/types/auth";

export type HasilLoginPengguna = { token: string } | { galat: string };

/**
 * Menafsirkan respons login pengguna. Token berada di accessToken tingkat
 * atas. Backend dapat menjawab 200 dengan success false (perangkat menunggu
 * persetujuan, hanya login aplikasi); itu ditampilkan sebagai pesan, bukan
 * dianggap berhasil. Respons tanpa token juga gagal, agar sesi tidak
 * dimulai tanpa token.
 */
export function hasilLoginPengguna(
  res: ResponsLoginPengguna | null | undefined,
): HasilLoginPengguna {
  if (res?.success === false) {
    return { galat: res.message || "Login belum dapat dilanjutkan." };
  }
  const token = res?.accessToken;
  if (typeof token !== "string" || token === "") {
    return { galat: "Token pengguna gagal diterbitkan." };
  }
  return { token };
}