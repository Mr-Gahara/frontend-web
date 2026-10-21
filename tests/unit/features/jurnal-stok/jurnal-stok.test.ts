import { describe, expect, it } from "vitest";
import {
  lokasiJurnalOutlet,
  paramHalamanJurnal,
  periodeAwalJurnal,
} from "@/features/jurnal-stok/filter";
import { SEMUA_OUTLET, type CakupanLokasiOutlet } from "@/features/inventaris/cakupan";
import { formatWaktuJurnal } from "@/features/jurnal-stok/tampilan";
import { lokasiTunggal } from "@/features/inventaris/lokasi";
import type { Lokasi } from "@/types/location";

const outletA = { id: "outlet-1", nama: "Outlet Pontianak Kota", tipe: "Outlet" } as Lokasi;
const outletB = { id: "outlet-2", nama: "Outlet Sungai Raya", tipe: "Outlet" } as Lokasi;

describe("lokasiJurnalOutlet", () => {
  it("jalur terkunci memakai lokasi aktif, dan null bila lokasi aktif kosong", () => {
    const terkunci: CakupanLokasiOutlet = { status: "terkunci", lokasi: outletA, lokasiId: "outlet-1" };
    expect(lokasiJurnalOutlet(terkunci, SEMUA_OUTLET)).toEqual({ lokasiID: "outlet-1" });
    expect(lokasiJurnalOutlet({ status: "terkunci", lokasi: null, lokasiId: "" }, SEMUA_OUTLET)).toBeNull();
  });

  it("cakupan yang memuat atau gagal belum punya lokasi", () => {
    expect(lokasiJurnalOutlet({ status: "memuat" }, SEMUA_OUTLET)).toBeNull();
    expect(lokasiJurnalOutlet({ status: "gagal" }, SEMUA_OUTLET)).toBeNull();
  });

  it("lintas outlet: satu outlet terpilih dikirim apa adanya", () => {
    const lintas: CakupanLokasiOutlet = { status: "lintas", lokasiOutlet: [outletA, outletB] };
    expect(lokasiJurnalOutlet(lintas, "outlet-2")).toEqual({ lokasiID: "outlet-2" });
  });

  it("lintas outlet: Semua Outlet memakai satu-satunya outlet, dan meminta pilihan bila lebih dari satu", () => {
    expect(lokasiJurnalOutlet({ status: "lintas", lokasiOutlet: [outletA] }, SEMUA_OUTLET)).toEqual({
      lokasiID: "outlet-1",
    });
    expect(lokasiJurnalOutlet({ status: "lintas", lokasiOutlet: [outletA, outletB] }, SEMUA_OUTLET)).toEqual({
      pilihSatuOutlet: true,
    });
  });
});

describe("periodeAwalJurnal", () => {
  it("tanggal 1 bulan berjalan sampai hari ini, pukul 00.00 waktu lokal", () => {
    const { dari, sampai } = periodeAwalJurnal(new Date(2026, 9, 21, 15, 30));
    expect(dari).toEqual(new Date(2026, 9, 1));
    expect(sampai).toEqual(new Date(2026, 9, 21));
  });
});

describe("formatWaktuJurnal", () => {
  it("memisahkan tanggal dan jam, dan memberi strip untuk nilai kosong", () => {
    expect(formatWaktuJurnal(null)).toEqual({ tanggal: "-", jam: "-" });
    const waktu = formatWaktuJurnal("2026-09-10T06:45:25.678Z");
    expect(waktu.tanggal).toMatch(/^\d{2} \S+ 2026$/);
    expect(waktu.jam).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("lokasiTunggal", () => {
  it("menerima objek atau array dan menolak bentuk tanpa id", () => {
    const lokasi = { id: "outlet-1", nama: "Outlet Pontianak Kota", tipe: "Outlet" };
    expect(lokasiTunggal(lokasi)).toBe(lokasi);
    expect(lokasiTunggal([lokasi])).toBe(lokasi);
    expect(lokasiTunggal([])).toBeNull();
    expect(lokasiTunggal(null)).toBeNull();
    expect(lokasiTunggal({ nama: "tanpa id" })).toBeNull();
  });
});
describe("paramHalamanJurnal", () => {
  it("mengirim lokasi, halaman, dan ukuran; pilihan ALL dan periode kosong tidak dikirim", () => {
    expect(paramHalamanJurnal({ lokasiID: "l1", arah: "ALL", alasan: "ALL" }, 1, 20)).toEqual({
      locationID: "l1",
      page: "1",
      limit: "20",
    });
  });

  it("mengirim periode sebagai tanggal lokal, arah sebagai tipeKoreksi, dan alasan", () => {
    expect(
      paramHalamanJurnal(
        {
          lokasiID: "l1",
          arah: "Keluar",
          alasan: "Stok Opname",
          dari: new Date(2026, 9, 1),
          sampai: new Date(2026, 9, 21, 15, 30),
        },
        3,
        10,
      ),
    ).toEqual({
      locationID: "l1",
      dari: "2026-10-01",
      sampai: "2026-10-21",
      tipeKoreksi: "Keluar",
      alasan: "Stok Opname",
      page: "3",
      limit: "10",
    });
  });
});
