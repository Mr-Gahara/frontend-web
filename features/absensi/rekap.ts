import { formatAngka } from "@/lib/format";
import type { RekapAbsensiResponse, RekapAbsensiStaf } from "@/types/absensi";

/**
 * Tampilan Rekap Absensi (desain D kanvas "Rekap Absensi"; pemilik proyek,
 * 23 November 2026) sebagai fungsi murni: teks tabel ringkas di desktop dan
 * kelompok rincian daftar di tablet dan HP.
 */

const KOLOM_ANGKA = [
  "shiftDijadwalkan",
  "hariHadir",
  "sesiHadir",
  "tepatWaktu",
  "terlambat",
  "menitTerlambat",
  "luarJadwal",
  "menitPulangAwal",
  "jamKerja",
  "hariSakit",
  "hariIzin",
  "hariCuti",
  "shiftTidakHadir",
] as const satisfies readonly (keyof RekapAbsensiStaf)[];

/** Baris TOTAL: dari ringkasan backend, dan dijumlah sendiri bila field-nya tidak ada. */
export function totalRekap(rekap: Pick<RekapAbsensiResponse, "ringkasan" | "data">): RekapAbsensiStaf {
  const total = { penggunaID: "TOTAL", nama: `TOTAL · ${rekap.ringkasan.totalStaf ?? rekap.data.length} staf` } as RekapAbsensiStaf;
  for (const kolom of KOLOM_ANGKA) {
    const dariRingkasan = rekap.ringkasan[kolom];
    total[kolom] =
      typeof dariRingkasan === "number"
        ? dariRingkasan
        : Math.round(rekap.data.reduce((jumlah, s) => jumlah + (s[kolom] ?? 0), 0) * 100) / 100;
  }
  return total;
}

export const teksKehadiran = (s: RekapAbsensiStaf) => `${s.hariHadir} dari ${s.shiftDijadwalkan} shift`;
export const teksTepatWaktu = (s: RekapAbsensiStaf) => `${s.tepatWaktu} tepat waktu`;
export const teksTerlambat = (s: RekapAbsensiStaf) =>
  s.terlambat > 0 ? `${s.terlambat} terlambat · ${formatAngka(s.menitTerlambat)} mnt` : "Tidak pernah terlambat";
export const teksPulangAwal = (s: RekapAbsensiStaf) => (s.menitPulangAwal > 0 ? `${formatAngka(s.menitPulangAwal)} mnt` : "-");
export const teksJamKerja = (s: RekapAbsensiStaf) => `${formatAngka(s.jamKerja)} jam`;

/** "Sakit 1, Izin 2"; tanda hubung bila tidak ada. */
export function teksIzinCuti(s: RekapAbsensiStaf): string {
  const bagian = [
    s.hariSakit ? `Sakit ${s.hariSakit}` : null,
    s.hariIzin ? `Izin ${s.hariIzin}` : null,
    s.hariCuti ? `Cuti ${s.hariCuti}` : null,
  ].filter(Boolean);
  return bagian.length ? bagian.join(", ") : "-";
}

/** Kelompok rincian baris yang dibuka di tablet dan HP, urut seperti berkas unduhan. */
export function kelompokRincian(s: RekapAbsensiStaf): { judul: string; isi: { label: string; nilai: string }[] }[] {
  const n = (v: number) => formatAngka(v);
  return [
    {
      judul: "Kehadiran",
      isi: [
        { label: "Jadwal shift", nilai: n(s.shiftDijadwalkan) },
        { label: "Hari hadir", nilai: n(s.hariHadir) },
        { label: "Sesi hadir", nilai: n(s.sesiHadir) },
        { label: "Tidak hadir", nilai: n(s.shiftTidakHadir) },
      ],
    },
    {
      judul: "Ketepatan",
      isi: [
        { label: "Tepat waktu", nilai: n(s.tepatWaktu) },
        { label: "Telat", nilai: n(s.terlambat) },
        { label: "Menit telat", nilai: n(s.menitTerlambat) },
        { label: "Luar jadwal", nilai: n(s.luarJadwal) },
        { label: "Menit pulang awal", nilai: n(s.menitPulangAwal) },
      ],
    },
    {
      judul: "Izin dan cuti (hari)",
      isi: [
        { label: "Sakit", nilai: n(s.hariSakit) },
        { label: "Izin", nilai: n(s.hariIzin) },
        { label: "Cuti", nilai: n(s.hariCuti) },
      ],
    },
    { judul: "Jam kerja", isi: [{ label: "Total", nilai: teksJamKerja(s) }] },
  ];
}
