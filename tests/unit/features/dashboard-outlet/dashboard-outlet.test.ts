import { describe, expect, it } from "vitest";

import {
  hariMundur,
  labelTanggalPendek,
  paramTransaksiLunas,
  titikOmzet,
} from "@/features/dashboard-outlet/kartu";
import { gabungStatusStaf, izinBerlaku } from "@/features/dashboard-outlet/staf";
import { bookingBerjalan, petakVenue } from "@/features/dashboard-outlet/venue";
import type { MonitoringStaf } from "@/types/absensi";
import type { IzinCuti } from "@/types/izinCuti";
import type { LaporanLabaRugiData } from "@/types/laporan";
import type { SesiBookingResponse } from "@/types/sesiBooking";

const HARI = new Date(2026, 9, 11, 10, 0, 0);

function izin(ubah: Partial<IzinCuti> = {}): IzinCuti {
  return {
    id: "i1",
    tenantID: "t1",
    pengguna: { id: "p1", nama: "Staf Satu", email: null },
    tanggalMulai: new Date(2026, 9, 10).toISOString(),
    tanggalSelesai: new Date(2026, 9, 12).toISOString(),
    tipe: "sakit",
    status: "disetujui",
    keterangan: "uji",
    dicatatOleh: null,
    catatan: null,
    createdAt: "",
    updatedAt: "",
    ...ubah,
  };
}

function staf(penggunaID: string, status: MonitoringStaf["status"]): MonitoringStaf {
  return { penggunaID, nama: `Staf ${penggunaID}`, status, jumlahSesi: 0, sesiTerakhir: null, totalJamKerja: 0 };
}

function booking(ubah: Partial<SesiBookingResponse> = {}): SesiBookingResponse {
  return {
    id: "b1",
    tenantID: "t1",
    dataPengguna: null,
    dataPelanggan: { id: "c1", namaPelanggan: "Julius", tipePelanggan: "member" },
    dataAset: { id: "a1", namaAset: "A1", status: "digunakan" },
    dataTarif: null,
    waktuMulai: new Date(2026, 9, 11, 9, 0).toISOString(),
    waktuSelesai: new Date(2026, 9, 11, 10, 43).toISOString(),
    durasiMenit: 103,
    totalBiaya: 0,
    status: "Aktif",
    sudahDibayar: true,
    dataPenjualan: null,
    ...ubah,
  };
}

describe("izinBerlaku", () => {
  it("menerima izin disetujui di dalam rentang, termasuk hari pertama dan terakhir", () => {
    expect(izinBerlaku(izin(), HARI)).toBe(true);
    expect(izinBerlaku(izin(), new Date(2026, 9, 10, 0, 5))).toBe(true);
    expect(izinBerlaku(izin(), new Date(2026, 9, 12, 23, 55))).toBe(true);
  });

  it("menolak izin yang masih diajukan atau ditolak", () => {
    expect(izinBerlaku(izin({ status: "diajukan" }), HARI)).toBe(false);
    expect(izinBerlaku(izin({ status: "ditolak" }), HARI)).toBe(false);
  });

  it("menolak hari di luar rentang", () => {
    expect(izinBerlaku(izin(), new Date(2026, 9, 9, 12))).toBe(false);
    expect(izinBerlaku(izin(), new Date(2026, 9, 13, 12))).toBe(false);
  });
});

describe("gabungStatusStaf", () => {
  it("mempertahankan status absensi bagi staf yang sudah absen walau punya izin", () => {
    const hasil = gabungStatusStaf([staf("p1", "sedang_bekerja")], [izin()], HARI);
    expect(hasil).toEqual([{ penggunaID: "p1", nama: "Staf p1", status: "sedang_bekerja" }]);
  });

  it("memetakan sakit, izin, dan cuti tahunan bagi staf yang belum absen", () => {
    const daftar = [staf("p1", "belum_absen"), staf("p2", "belum_absen"), staf("p3", "belum_absen")];
    const izinCuti = [
      izin(),
      izin({ id: "i2", pengguna: { id: "p2", nama: null, email: null }, tipe: "izin" }),
      izin({ id: "i3", pengguna: { id: "p3", nama: null, email: null }, tipe: "cuti tahunan" }),
    ];
    expect(gabungStatusStaf(daftar, izinCuti, HARI).map((b) => b.status)).toEqual(["sakit", "izin", "cuti"]);
  });

  it("membiarkan belum absen bila tidak ada izin yang berlaku untuk staf itu", () => {
    const izinCuti = [
      izin({ pengguna: { id: "lain", nama: null, email: null } }),
      izin({ id: "i2", status: "diajukan" }),
    ];
    expect(gabungStatusStaf([staf("p1", "belum_absen")], izinCuti, HARI)[0].status).toBe("belum_absen");
  });
});

describe("petak venue", () => {
  it("bookingBerjalan hanya untuk booking Aktif yang jamnya mencakup saat ini", () => {
    expect(bookingBerjalan(booking(), HARI)).toBe(true);
    expect(bookingBerjalan(booking({ status: "VOID" }), HARI)).toBe(false);
    expect(bookingBerjalan(booking({ waktuMulai: new Date(2026, 9, 11, 10, 30).toISOString() }), HARI)).toBe(false);
    expect(bookingBerjalan(booking({ waktuSelesai: new Date(2026, 9, 11, 10, 0).toISOString() }), HARI)).toBe(false);
  });

  it("aset digunakan memuat pelanggan, tipe, dan sisa menit dari booking berjalan", () => {
    const hasil = petakVenue([{ id: "a1", namaAset: "A1", status: "digunakan" }], [booking()], HARI);
    expect(hasil).toEqual([
      { id: "a1", nama: "A1", status: "digunakan", pelanggan: "Julius", tipePelanggan: "member", sisaMenit: 43 },
    ]);
  });

  it("aset tersedia tanpa rincian walau ada booking, dan petak urut numerik menurut nama", () => {
    const aset = [
      { id: "a10", namaAset: "A10", status: "tersedia" as const },
      { id: "a1", namaAset: "A1", status: "tersedia" as const },
      { id: "a5", namaAset: "A5", status: "perbaikan" as const },
    ];
    const hasil = petakVenue(aset, [booking()], HARI);
    expect(hasil.map((p) => p.nama)).toEqual(["A1", "A5", "A10"]);
    expect(hasil[0]).toMatchObject({ pelanggan: null, tipePelanggan: null, sisaMenit: null });
  });
});

describe("kartu dashboard", () => {
  it("hariMundur menggeser tanggal tanpa mengubah masukan", () => {
    const awalBulan = new Date(2026, 9, 1, 8);
    expect(hariMundur(awalBulan, 2).getDate()).toBe(29);
    expect(hariMundur(awalBulan, 2).getMonth()).toBe(8);
    expect(awalBulan.getDate()).toBe(1);
  });

  it("paramTransaksiLunas menyaring PAID dengan batas hari lokal sebagai ISO utuh", () => {
    const params = paramTransaksiLunas(HARI);
    expect(params).toEqual({
      statusPenjualan: "PAID",
      startDate: new Date(2026, 9, 11, 0, 0, 0, 0).toISOString(),
      endDate: new Date(2026, 9, 11, 23, 59, 59, 999).toISOString(),
      page: "1",
      limit: "10",
    });
  });

  it("labelTanggalPendek memendekkan tanggal dan membiarkan teks lain", () => {
    expect(labelTanggalPendek("2026-10-06")).toBe("6 Okt");
    expect(labelTanggalPendek("2026-01-31T00:00:00.000Z")).toBe("31 Jan");
    expect(labelTanggalPendek("08:00")).toBe("08:00");
    expect(labelTanggalPendek("")).toBe("-");
    expect(labelTanggalPendek(null)).toBe("-");
  });

  it("titikOmzet memetakan tanggal dan omzet, dengan nilai bukan angka sebagai 0", () => {
    const baris = { tanggal: "2026-10-11", totalOmzet: 150000 } as LaporanLabaRugiData;
    const rusak = { tanggal: "", totalOmzet: Number.NaN } as LaporanLabaRugiData;
    expect(titikOmzet([baris, rusak])).toEqual([
      { label: "11 Okt", nilai: 150000 },
      { label: "-", nilai: 0 },
    ]);
  });
});