import { describe, expect, it } from "vitest";
import { kelompokRincian, teksIzinCuti, teksTerlambat, totalRekap } from "@/features/absensi/rekap";
import type { RekapAbsensiStaf } from "@/types/absensi";

const staf = (ubah: Partial<RekapAbsensiStaf> = {}): RekapAbsensiStaf => ({
  penggunaID: "p1",
  nama: "Ani",
  shiftDijadwalkan: 22,
  hariHadir: 20,
  sesiHadir: 20,
  tepatWaktu: 17,
  terlambat: 3,
  menitTerlambat: 42,
  luarJadwal: 1,
  menitPulangAwal: 10,
  jamKerja: 158.5,
  hariSakit: 1,
  hariIzin: 0,
  hariCuti: 0,
  shiftTidakHadir: 1,
  ...ubah,
});

describe("rekap absensi (B358, desain D)", () => {
  it("baris TOTAL dari ringkasan backend, dijumlah sendiri bila field tidak ada", () => {
    const data = [staf(), staf({ penggunaID: "p2", nama: "Budi", jamKerja: 176, shiftTidakHadir: 0 })];
    const total = totalRekap({ data, ringkasan: { totalStaf: 2, shiftDijadwalkan: 44, jamKerja: 334.5, shiftTidakHadir: 1 } });
    expect(total.nama).toBe("TOTAL · 2 staf");
    expect(total.shiftDijadwalkan).toBe(44);
    expect(total.jamKerja).toBe(334.5);
    expect(total.hariHadir).toBe(40);
    expect(total.menitTerlambat).toBe(84);
  });

  it("teks terlambat dan izin cuti", () => {
    expect(teksTerlambat(staf())).toBe("3 terlambat · 42 mnt");
    expect(teksTerlambat(staf({ terlambat: 0, menitTerlambat: 0 }))).toBe("Tidak pernah terlambat");
    expect(teksIzinCuti(staf({ hariIzin: 2 }))).toBe("Sakit 1, Izin 2");
    expect(teksIzinCuti(staf({ hariSakit: 0 }))).toBe("-");
  });

  it("rincian berurutan seperti berkas unduhan, empat kelompok", () => {
    const kelompok = kelompokRincian(staf());
    expect(kelompok.map((g) => g.judul)).toEqual(["Kehadiran", "Ketepatan", "Izin dan cuti (hari)", "Jam kerja"]);
    expect(kelompok[3].isi).toEqual([{ label: "Total", nilai: "158,5 jam" }]);
  });
});
