import { describe, expect, it } from "vitest";
import type { AksesTautan } from "@/features/notifikasi/akses";
import {
  URL_MESIN_KASIR,
  pemberitahuanBookingBelumLunas,
  pemberitahuanKasirLupa,
  pemberitahuanSetupFitur,
} from "@/features/notifikasi/sumber-operasional";
import type { SesiBookingResponse } from "@/types/sesiBooking";
import type { SesiKasir } from "@/types/sesiKasir";

const kini = new Date(2026, 10, 25, 10, 0); // 25 November 2026 10.00 lokal
const akses = (permissions: string[] = ["read-sesi-kasir", "read-penjualan", "read-pembayaran"]): AksesTautan => ({
  permissions,
  plan: "pro",
  fiturSiap: { wms: true, "sesi-booking": true },
});

const sesi = (dibukaPada: Date, ubah: Partial<SesiKasir> = {}): SesiKasir =>
  ({ id: "s", status: "BUKA", namaPerangkat: "Kasir Depan", dibukaPada: dibukaPada.toISOString(), ...ubah }) as SesiKasir;

describe("pemberitahuanKasirLupa (LN4a, penting)", () => {
  it("hanya sesi BUKA yang dibuka sebelum hari ini", () => {
    expect(pemberitahuanKasirLupa([sesi(new Date(2026, 10, 25, 7, 0))], kini, akses())).toBeNull();
    expect(pemberitahuanKasirLupa([sesi(new Date(2026, 10, 24, 22, 0), { status: "TUTUP" })], kini, akses())).toBeNull();
    const p = pemberitahuanKasirLupa([sesi(new Date(2026, 10, 24, 22, 0)), sesi(new Date(2026, 10, 25, 8, 0))], kini, akses());
    expect(p).toMatchObject({ id: "kasir-lupa", tingkat: "penting", judul: "Kasir lupa ditutup" });
    expect(p?.isi).toContain("1 sesi kasir masih terbuka sejak hari sebelumnya: Kasir Depan");
    expect(p?.tautan).toEqual([{ href: URL_MESIN_KASIR, label: "Buka Mesin Kasir" }]);
  });

  it("tanpa tautan bagi yang tidak boleh membuka Mesin Kasir; null selama belum termuat", () => {
    expect(pemberitahuanKasirLupa([sesi(new Date(2026, 10, 20))], kini, akses([]))?.tautan).toEqual([]);
    expect(pemberitahuanKasirLupa(null, kini, akses())).toBeNull();
  });
});

describe("pemberitahuanSetupFitur (LN4a, info)", () => {
  it("menyebut fitur yang belum disetup, tautan ke /setup", () => {
    expect(pemberitahuanSetupFitur([])).toBeNull();
    const p = pemberitahuanSetupFitur(["wms", "sesi-booking"]);
    expect(p).toMatchObject({ tingkat: "info", isi: "Setup Gudang dan Sesi Booking belum selesai, sehingga fiturnya masih terkunci." });
    expect(p?.tautan).toEqual([{ href: "/setup", label: "Lengkapi setup" }]);
  });
});

const booking = (id: string, selesai: Date, ubah: Partial<SesiBookingResponse> = {}, bayar = "UNPAID"): SesiBookingResponse =>
  ({
    id,
    status: "Aktif",
    waktuSelesai: selesai.toISOString(),
    dataAset: { id: "a" + id, namaAset: `Meja ${id}`, status: null },
    dataPenjualan: { id: "p" + id, noReferensi: "INV-" + id, statusPenjualan: bayar, statusBayar: bayar, totalTagihan: 1, sisaTagihan: 1 },
    ...ubah,
  }) as SesiBookingResponse;

describe("pemberitahuanBookingBelumLunas (LN4a, perlu tindakan)", () => {
  const lewat = new Date(2026, 10, 25, 9, 0);
  it("hanya booking lewat jam yang penjualannya belum lunas dan tidak VOID", () => {
    expect(pemberitahuanBookingBelumLunas([booking("1", new Date(2026, 10, 25, 11, 0))], kini, akses())).toBeNull();
    expect(pemberitahuanBookingBelumLunas([booking("1", lewat, {}, "PAID")], kini, akses())).toBeNull();
    expect(pemberitahuanBookingBelumLunas([booking("1", lewat, { status: "VOID" })], kini, akses())).toBeNull();
    const p = pemberitahuanBookingBelumLunas([booking("1", lewat), booking("2", lewat, {}, "PARTIAL")], kini, akses());
    expect(p?.isi).toBe("2 booking hari ini sudah lewat jamnya, tetapi penjualannya belum lunas.");
    expect(p?.tautan).toEqual([
      { href: "/dashboard/outlet/penjualan/p1", label: "Meja 1" },
      { href: "/dashboard/outlet/penjualan/p2", label: "Meja 2" },
    ]);
  });

  it("lebih dari tiga: tiga tautan dan sisanya disebut", () => {
    const daftar = ["1", "2", "3", "4", "5"].map((id) => booking(id, lewat));
    const p = pemberitahuanBookingBelumLunas(daftar, kini, akses());
    expect(p?.tautan).toHaveLength(3);
    expect(p?.isi).toContain("2 lainnya ada di daftar penjualan.");
  });
});
