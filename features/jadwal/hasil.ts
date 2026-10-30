import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { isApiError } from "@/lib/api/error";
import { uraiTanggalLokal } from "./rentang";
import type { DitolakJadwal, HasilJadwal } from "./tipe";

/**
 * Pesan untuk jadwal yang ditolak backend (keputusan J2a), atau null bila
 * tidak ada yang ditolak. Menyebut paling banyak tiga penolakan beserta nama
 * karyawan dan tanggalnya bila backend menyertakannya.
 */
export function pesanDitolak(hasil: HasilJadwal, namaKaryawan: (id: string) => string | undefined): string | null {
  if (hasil.ditolak === 0) return null;
  const rincian = hasil.detailDitolak.slice(0, 3).map((d) => {
    const bagian = [
      d.penggunaID ? namaKaryawan(d.penggunaID) : undefined,
      d.tanggalKerja ? format(uraiTanggalLokal(d.tanggalKerja.slice(0, 10)), "d MMM yyyy", { locale: localeID }) : undefined,
      d.reason ?? "ditolak backend",
    ].filter(Boolean);
    return bagian.join(", ");
  });
  const sisa = hasil.detailDitolak.length > 3 ? `; dan ${hasil.detailDitolak.length - 3} lainnya` : "";
  return `${hasil.ditolak} jadwal ditolak: ${rincian.join("; ")}${sisa}`;
}

/** Menjumlahkan hasil beberapa permintaan menjadi satu ringkasan (JD6a). */
export function gabungHasil(daftar: HasilJadwal[]): HasilJadwal {
  return {
    message: daftar.at(-1)?.message ?? "",
    berhasilDiproses: daftar.reduce((n, h) => n + h.berhasilDiproses, 0),
    ditolak: daftar.reduce((n, h) => n + h.ditolak, 0),
    detailDitolak: daftar.flatMap((h) => h.detailDitolak),
  };
}
const teks = (nilai: unknown) => (typeof nilai === "string" ? nilai : undefined);

/**
 * Hasil jadwal dari galat 409 "Seluruh jadwal ditolak." (B147, R22). Sejak
 * backend ridho b699939 buat manual dan generate yang tidak menyimpan satu
 * jadwal pun dijawab 409 dengan errors berisi detailDitolak, bukan sukses.
 * Dibentuk ulang agar halaman tetap menampilkan penolakan lewat pesanDitolak
 * (keputusan J2a). Galat lain menghasilkan null dan dilempar ulang pemanggil.
 */
export function hasilDariPenolakanSeluruh(err: unknown): HasilJadwal | null {
  if (!isApiError(err) || err.status !== 409) return null;
  const detailDitolak: DitolakJadwal[] = err.rincian
    .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null)
    .map((d) => ({ reason: teks(d.reason), penggunaID: teks(d.penggunaID), tanggalKerja: teks(d.tanggalKerja) }));
  if (detailDitolak.length === 0) return null;
  return { message: err.message, berhasilDiproses: 0, ditolak: detailDitolak.length, detailDitolak };
}
