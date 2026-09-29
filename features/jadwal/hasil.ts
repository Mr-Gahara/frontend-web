import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { uraiTanggalLokal } from "./rentang";
import type { HasilJadwal } from "./tipe";

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