import { describe, expect, it } from "vitest";
import { entriBulkJadwal, pesanMasalahSimulasi, simulasiGenerate } from "@/features/jadwal/generate";
import { gabungHasil, pesanDitolak } from "@/features/jadwal/hasil";
import { itemJadwal, keKaryawanRuang, petakanJadwalKaryawan } from "@/features/jadwal/pemetaan";
import { rencanaSimpanJadwal } from "@/features/jadwal/rencana";
import { daftarTanggal, rentangBulan } from "@/features/jadwal/rentang";
import { buatSkemaJadwalManual, skemaGenerate } from "@/features/jadwal/schema";
import type { JadwalItem, PayloadJadwalManual } from "@/features/jadwal/tipe";
import type { ShiftItem as SelShift } from "@/types/jadwal";
import type { PolaRosterItem } from "@/types/pola-roster";
import type { ShiftItem } from "@/types/shift";

const SHIFT = (id: string, namaShift: string, status: ShiftItem["status"], jamMasuk = "08:00"): ShiftItem => ({
  id,
  namaShift,
  jamMasuk,
  jamPulang: "16:00",
  isLintasHari: false,
  toleransiTerlambat: 0,
  status,
  dibuatPada: null,
});

const JADWAL = (id: string, karyawanId: string, tanggalKerja: string, isi: Partial<JadwalItem> = {}): JadwalItem => ({
  id,
  tanggalKerja,
  isLibur: false,
  catatan: null,
  karyawan: { id: karyawanId },
  shift: { id: "s1", namaShift: "Pagi", jamMasuk: "08:00", jamPulang: "16:00", isLintasHari: false, status: "Aktif" },
  ...isi,
});

const MANUAL: PayloadJadwalManual = { penggunaId: "p1", tanggal: "2026-11-10", isLibur: false, shiftIds: ["s1"], catatan: "" };

const SEL = (id: string): SelShift => ({ id, type: "pagi", name: "Pagi", label: "08:00 - 16:00" });

describe("rentangBulan dan daftarTanggal (keputusan J1a)", () => {
  it("awal dan akhir bulan memakai tanggal lokal", () => {
    expect(rentangBulan(new Date(2026, 8, 17))).toEqual({ startDate: "2026-09-01", endDate: "2026-09-30" });
  });

  it("daftar tanggal mencakup kedua ujung dan melewati pergantian bulan", () => {
    expect(daftarTanggal("2026-09-29", "2026-10-02")).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
  });
});

describe("pemetaan jadwal ke sel", () => {
  it("libur tampil LIBUR dan catatan ikut dibawa (JD4 dan JD5a)", () => {
    expect(itemJadwal(JADWAL("j1", "p1", "2026-11-10", { isLibur: true, shift: null, catatan: "cuti" }))).toMatchObject({
      id: "j1",
      type: "off",
      name: "LIBUR",
      isLibur: true,
      catatan: "cuti",
    });
  });

  it("shift nonaktif ditandai dan jam membentuk label", () => {
    const shift = { id: "s9", namaShift: "Malam", jamMasuk: "22:00", jamPulang: "06:00", isLintasHari: true, status: "Non-Aktif" as const };
    expect(itemJadwal(JADWAL("j2", "p1", "2026-11-10", { shift }))).toMatchObject({
      masterShiftId: "s9",
      type: "malam",
      label: "22:00 - 06:00",
      shiftNonaktif: true,
    });
  });

  it("jadwal masuk ke hari tanggalKerja karyawannya, dan karyawan lain diabaikan", () => {
    const hasil = petakanJadwalKaryawan(
      [{ id: "p1", nama: "Ridho", role: "Admin" }],
      [JADWAL("j1", "p1", "2026-11-10"), JADWAL("j2", "p1", "2026-11-10"), JADWAL("j3", "lain", "2026-11-11")],
    );
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jadwalMap[10].map((s) => s.id)).toEqual(["j1", "j2"]);
    expect(hasil[0].jadwalMap[11]).toBeUndefined();
  });
});

describe("keKaryawanRuang (keputusan rancangan butir 12)", () => {
  it("memetakan pengguna: peran dari role lalu roleID.namaRole, dan tanda hubung untuk yang kosong (JD14a)", () => {
    // Data uji hanya memuat field yang dibaca keKaryawanRuang.
    const pengguna = [
      { id: "p1", nama: "Ridho", role: "Owner", roleID: "r0" },
      { id: "p2", nama: "", role: "", roleID: "r9" },
      { id: "p3", nama: "Sari", roleID: { id: "r1", namaRole: "Kasir" } },
    ] as unknown as Parameters<typeof keKaryawanRuang>[0];
    expect(keKaryawanRuang(pengguna)).toEqual([
      { id: "p1", nama: "Ridho", role: "Owner" },
      { id: "p2", nama: "-", role: "-" },
      { id: "p3", nama: "Sari", role: "Kasir" },
    ]);
  });
});

describe("rencanaSimpanJadwal (keputusan JD6a)", () => {
  it("tanpa jadwal lama: satu POST", () => {
    expect(rencanaSimpanJadwal([{ ...SEL("off"), type: "off" }], MANUAL)).toEqual([{ jenis: "buat", payload: MANUAL }]);
  });

  it("menjadi libur: jadwal pertama diubah dan sisanya dihapus", () => {
    expect(rencanaSimpanJadwal([SEL("a"), SEL("b")], { ...MANUAL, isLibur: true, shiftIds: [] })).toEqual([
      { jenis: "ubah", id: "a", payload: { isLibur: true, shiftID: null, catatan: "" } },
      { jenis: "hapus", id: "b" },
    ]);
  });

  it("kerja: diubah berurutan, dan shift tambahan dibuat dalam satu POST", () => {
    expect(rencanaSimpanJadwal([SEL("a")], { ...MANUAL, shiftIds: ["s1", "s2", "s3"] })).toEqual([
      { jenis: "ubah", id: "a", payload: { isLibur: false, shiftID: "s1", catatan: "" } },
      { jenis: "buat", payload: { ...MANUAL, shiftIds: ["s2", "s3"] } },
    ]);
  });
});

describe("hasil jadwal (keputusan J2a)", () => {
  it("pesan menyebut jumlah, nama, tanggal, dan alasan penolakan", () => {
    const pesan = pesanDitolak(
      { message: "", berhasilDiproses: 0, ditolak: 1, detailDitolak: [{ penggunaID: "p1", tanggalKerja: "2026-11-10", reason: "Bentrokan jam dengan jadwal yang sudah ada." }] },
      (id) => (id === "p1" ? "Ridho" : undefined),
    );
    expect(pesan).toBe("1 jadwal ditolak: Ridho, 10 Nov 2026, Bentrokan jam dengan jadwal yang sudah ada.");
  });

  it("tanpa penolakan tidak ada pesan, dan hasil beberapa langkah dijumlahkan", () => {
    const hasil = gabungHasil([
      { message: "a", berhasilDiproses: 1, ditolak: 0, detailDitolak: [] },
      { message: "b", berhasilDiproses: 2, ditolak: 0, detailDitolak: [] },
    ]);
    expect(hasil).toEqual({ message: "b", berhasilDiproses: 3, ditolak: 0, detailDitolak: [] });
    expect(pesanDitolak(hasil, () => undefined)).toBeNull();
  });
});

describe("simulasiGenerate (keputusan GN2a)", () => {
  const POLA: PolaRosterItem = {
    id: "pola",
    namaPola: "Pola",
    siklusHari: 2,
    detailSiklus: [
      { hariKe: 1, isLibur: false, shiftID: "s1" },
      { hariKe: 2, isLibur: true, shiftID: null },
    ],
  };
  const KARYAWAN = [{ id: "p1", nama: "Ridho", role: "Admin" }];

  it("mengikuti siklus pola dan menghasilkan satu entri per tanggal seperti kode lama", () => {
    const baris = simulasiGenerate(["2026-11-20", "2026-11-21", "2026-11-22"], POLA, [SHIFT("s1", "Pagi Uji", "Aktif")], KARYAWAN);
    expect(baris[0].jadwal.map((j) => [j.label, j.jam])).toEqual([["PAGI", "08:00 - 16:00"], ["OFF", ""], ["PAGI", "08:00 - 16:00"]]);
    expect(pesanMasalahSimulasi(baris)).toBeNull();
    expect(entriBulkJadwal(baris)).toEqual([
      { penggunaID: "p1", tanggalKerja: "2026-11-20", isLibur: false, shiftID: "s1" },
      { penggunaID: "p1", tanggalKerja: "2026-11-21", isLibur: true, shiftID: undefined },
      { penggunaID: "p1", tanggalKerja: "2026-11-22", isLibur: false, shiftID: "s1" },
    ]);
  });

  it("shift nonaktif ditandai dan menahan simpan, bukan menjadi libur", () => {
    const baris = simulasiGenerate(["2026-11-20"], POLA, [SHIFT("s1", "Pagi Lama", "Non-Aktif")], KARYAWAN);
    expect(baris[0].jadwal[0]).toMatchObject({ isLibur: false, masalah: "nonaktif" });
    expect(baris[0].jadwal[0].shiftID).toBeUndefined();
    expect(pesanMasalahSimulasi(baris)).toBe(
      'Shift "Pagi Lama" pada pola ini sudah nonaktif. Perbaiki pola roster sebelum menyimpan jadwal.',
    );
  });
});

describe("skema form jadwal", () => {
  const skema = buatSkemaJadwalManual(new Set(["s1"]));
  const pesan = (nilai: Parameters<typeof skema.safeParse>[0]) => {
    const hasil = skema.safeParse(nilai);
    return hasil.success ? [] : hasil.error.issues.map((i) => i.message);
  };

  it("hari kerja tanpa shift dan shift nonaktif ditolak; libur tidak butuh shift", () => {
    const dasar = { penggunaId: "p1", tanggal: new Date(2026, 10, 10), catatan: "" };
    expect(pesan({ ...dasar, status: "kerja", shiftIds: [""] })).toEqual(["Pilih minimal satu shift."]);
    expect(pesan({ ...dasar, status: "kerja", shiftIds: ["s9"] })).toEqual([
      "Ada shift yang sudah nonaktif; pilih shift lain atau Libur.",
    ]);
    expect(pesan({ ...dasar, status: "libur", shiftIds: [""] })).toEqual([]);
  });

  it("langkah 1 generate menolak tanggal mulai setelah tanggal selesai (GN4a)", () => {
    const hasil = skemaGenerate.safeParse({
      polaId: "pola",
      mulai: new Date(2026, 10, 23),
      sampai: new Date(2026, 10, 20),
      karyawanIds: ["p1"],
    });
    expect(hasil.success ? null : hasil.error.issues[0].message).toBe(
      "Tanggal mulai tidak boleh lebih besar dari tanggal selesai.",
    );
  });
});