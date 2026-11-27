import { describe, expect, it } from "vitest";
import type { AksesTautan } from "@/features/notifikasi/akses";
import { keadaanKesiapan, langkahKesiapan, pemberitahuanKesiapan } from "@/features/notifikasi/kesiapan";
import { IZIN_HALAMAN } from "@/lib/auth/permissions";

const SEMUA_IZIN = [...new Set(Object.values(IZIN_HALAMAN).flatMap((s) => s.flat()))];
const akses = (permissions: string[] = SEMUA_IZIN): AksesTautan => ({ permissions, plan: "pro", fiturSiap: {} });
const kartu = (data: Parameters<typeof langkahKesiapan>[0], a = akses()) =>
  pemberitahuanKesiapan(keadaanKesiapan(langkahKesiapan(data)), a);

describe("langkahKesiapan (PW19, KS1a dan KS5a)", () => {
  it("urut produk lalu fitur plan; langkah produk cukup toko punya produk", () => {
    const daftar = langkahKesiapan({
      produk: { total: 3, dapatDijual: 0 },
      fitur: [
        { fitur: "sesi-booking", selesai: true },
        { fitur: "wms", selesai: false },
      ],
    });
    expect(daftar.map((l) => [l.kunci, l.selesai])).toEqual([
      ["produk", true],
      ["sesi-booking", true],
      ["wms", false],
    ]);
  });

  it("langkah yang datanya belum diketahui tidak dihitung", () => {
    expect(langkahKesiapan({ produk: null, fitur: [] })).toEqual([]);
    expect(keadaanKesiapan([])).toBeNull();
  });
});

describe("pemberitahuanKesiapan (KS3a, KS6a, KS7a)", () => {
  it("toko tanpa produk: satu kartu utama, tingkat penting, langkah 1 dari N dan langkah sesudahnya", () => {
    const p = kartu({ produk: { total: 0, dapatDijual: 0 }, fitur: [{ fitur: "sesi-booking", selesai: false }] });
    expect(p).toMatchObject({
      id: "kesiapan-toko",
      tingkat: "penting",
      utama: true,
      judul: "Siapkan toko (langkah 1 dari 2)",
      isi:
        "Buat produk. Toko belum punya produk. Buat produk lebih dulu agar kasir dapat mencatat penjualan. " +
        "Sesudahnya: Setup Sesi Booking.",
    });
    expect(p?.tautan).toEqual([{ href: "/dashboard/outlet/inventaris/produk/buatProduk", label: "Buat Produk" }]);
  });

  it("produk sudah ada: langkah fitur plan bertingkat info dan bertaut ke /setup, menggantikan kartu setup fitur", () => {
    const p = kartu({
      produk: { total: 1, dapatDijual: 1 },
      fitur: [
        { fitur: "sesi-booking", selesai: false },
        { fitur: "wms", selesai: false },
      ],
    });
    expect(p).toMatchObject({
      tingkat: "info",
      judul: "Siapkan toko (langkah 2 dari 3)",
      isi: "Setup Sesi Booking. Setup Sesi Booking belum selesai, sehingga fiturnya masih terkunci. Sesudahnya: Setup Gudang.",
    });
    expect(p?.tautan).toEqual([{ href: "/setup", label: "Lengkapi setup" }]);
  });

  it("kehabisan stok bukan langkah kesiapan: toko yang punya produk dan fiturnya selesai tidak berkartu", () => {
    expect(kartu({ produk: { total: 4, dapatDijual: 0 }, fitur: [{ fitur: "wms", selesai: true }] })).toBeNull();
  });

  it("tautan Buat Produk hanya bagi pemegang izinnya; kartu tetap tampil", () => {
    const p = kartu({ produk: { total: 0, dapatDijual: 0 }, fitur: [] }, akses([]));
    expect(p).toMatchObject({ judul: "Siapkan toko (langkah 1 dari 1)", tautan: [] });
  });
});
