import { describe, expect, it } from "vitest";
import {
  SEMUA_MESIN,
  filterAwalRiwayat,
  paramsRiwayat,
  teksRentangRiwayat,
} from "@/features/sesi-kasir/filter";
import { bolehKelolaMesinKasir } from "@/features/sesi-kasir/izin";
import {
  PESAN_CATATAN_WAJIB,
  pesanHapusMesin,
  pesanSimpanMesin,
  pesanTutupKasir,
} from "@/features/sesi-kasir/pesan";
import { ApiError } from "@/lib/api/error";

describe("bolehKelolaMesinKasir (keputusan pemilik proyek, 7 November 2026)", () => {
  const KETIGA = ["kelola-perangkat-kasir", "read-pengguna", "read-akunkas"];

  it("true hanya bila ketiga izin dipegang", () => {
    expect(bolehKelolaMesinKasir(KETIGA)).toBe(true);
    for (const kurang of KETIGA) {
      expect(bolehKelolaMesinKasir(KETIGA.filter((p) => p !== kurang))).toBe(false);
    }
  });

  it("read-sesi-kasir saja tidak cukup untuk kelola", () => {
    expect(bolehKelolaMesinKasir(["read-sesi-kasir"])).toBe(false);
  });
});

describe("pesan Mesin Kasir (sesiKasirService backend ridho 1584222)", () => {
  it("catatan wajib saat tutup diterjemahkan tanpa angka sistem", () => {
    const err = new ApiError(400, "catatan wajib diisi karena hitungan berbeda dengan catatan sistem.");
    expect(pesanTutupKasir(err)).toBe(PESAN_CATATAN_WAJIB);
  });

  it("400 lain saat tutup diteruskan apa adanya", () => {
    const err = new ApiError(400, "Akun Kas tersebut sudah nonaktif.");
    expect(pesanTutupKasir(err)).toBe("Akun Kas tersebut sudah nonaktif.");
  });

  it("409 sesi terbuka, laci dipakai, dan 404 perangkat saat simpan", () => {
    expect(pesanSimpanMesin(new ApiError(409, "Perangkat atau akun kas ini masih punya sesi kasir terbuka."))).toMatch(
      /masih buka/,
    );
    expect(pesanSimpanMesin(new ApiError(409, "Akun Kas ini sudah dipakai perangkat lain."))).toBe(
      "Laci ini sudah dipakai mesin kasir lain. Pilih laci lain.",
    );
    expect(pesanSimpanMesin(new ApiError(404, "Perangkat tidak ditemukan di toko ini."))).toMatch(/tidak terdaftar/);
  });

  it("409 sesi terbuka saat lepas mesin", () => {
    expect(pesanHapusMesin(new ApiError(409, "Perangkat ini masih punya sesi kasir terbuka."))).toBe(
      "Kasir di mesin ini masih buka. Tutup kasirnya dulu, lalu lepas lagi.",
    );
  });

  it("status yang sama dengan teks lain tidak diterjemahkan", () => {
    expect(pesanHapusMesin(new ApiError(404, "Perangkat kasir tidak ditemukan."))).toBe(
      "Perangkat kasir tidak ditemukan.",
    );
    expect(pesanSimpanMesin(new Error("putus"))).toBe("putus");
    expect(pesanSimpanMesin(null)).toBe("Mesin kasir gagal disimpan.");
  });
});

describe("filter riwayat", () => {
  it("nilai awal tujuh hari sampai hari ini, semua mesin", () => {
    const awal = filterAwalRiwayat(new Date(2026, 10, 7, 23, 50));
    expect(awal.mesin).toBe(SEMUA_MESIN);
    expect(awal.dari?.getDate()).toBe(1);
    expect(awal.sampai?.getDate()).toBe(7);
  });

  it("parameter hanya sesi tutup, tanggal lokal YYYY-MM-DD, tanpa installationId untuk semua mesin", () => {
    // 00.30 lokal: toISOString akan memberi tanggal sebelumnya di WIB.
    const nilai = { mesin: SEMUA_MESIN, dari: new Date(2026, 10, 1, 0, 30), sampai: new Date(2026, 10, 7, 0, 30) };
    expect(paramsRiwayat(nilai)).toEqual({ status: "TUTUP", dari: "2026-11-01", sampai: "2026-11-07" });
  });

  it("mesin terpilih dikirim sebagai installationId, tanggal kosong tidak dikirim", () => {
    expect(paramsRiwayat({ mesin: "HP-1", dari: undefined, sampai: undefined })).toEqual({
      status: "TUTUP",
      installationId: "HP-1",
    });
  });

  it("teks rentang", () => {
    expect(teksRentangRiwayat({ mesin: SEMUA_MESIN, dari: new Date(2026, 10, 1), sampai: new Date(2026, 10, 7) })).toBe(
      "1 Nov 2026 sampai 7 Nov 2026",
    );
    expect(teksRentangRiwayat({ mesin: SEMUA_MESIN, dari: undefined, sampai: new Date(2026, 10, 7) })).toBe(
      "rentang ini",
    );
  });
});
