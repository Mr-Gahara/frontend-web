import { describe, expect, it } from "vitest";
import type { AksesTautan } from "@/features/notifikasi/akses";
import { keadaanKesiapan, langkahKesiapan, pemberitahuanKesiapan, rentangJadwalKesiapan } from "@/features/notifikasi/kesiapan";
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

describe("langkah karyawan dan absensi (PW18, KS10a dan KS11a)", () => {
  const dasar = { produk: { total: 2, dapatDijual: 2 }, fitur: [{ fitur: "sesi-booking" as const, selesai: false }] };
  const absensi = { shiftAktif: false, pola: false, jadwal: false };

  it("toko hanya Owner: Buat posisi (info, bertombol Toko ini hanya saya), lalu Tambah karyawan, sebelum fitur plan", () => {
    const daftar = langkahKesiapan({ ...dasar, karyawan: { posisi: false, staf: false, hanyaOwner: false }, absensi });
    expect(daftar.map((l) => l.kunci)).toEqual(["produk", "posisi", "karyawan", "sesi-booking"]);
    const p = kartu({ ...dasar, karyawan: { posisi: false, staf: false, hanyaOwner: false }, absensi });
    expect(p).toMatchObject({
      tingkat: "info",
      judul: "Siapkan toko (langkah 2 dari 4)",
      tombol: { aksi: "hanya-owner", label: "Toko ini hanya saya" },
    });
    expect(p?.isi).toContain("Sesudahnya: Tambah karyawan.");
    expect(p?.tautan).toEqual([{ href: "/dashboard/outlet/pengaturan/roles", label: "Buat posisi" }]);
  });

  it("langkah absensi hanya bila ada staf: shift, pola roster, jadwal, bertingkat perlu tindakan tanpa tombol", () => {
    const data = { ...dasar, karyawan: { posisi: true, staf: true, hanyaOwner: false }, absensi };
    expect(langkahKesiapan(data).map((l) => l.kunci)).toEqual([
      "produk", "posisi", "karyawan", "shift", "pola", "jadwal", "sesi-booking",
    ]);
    const p = kartu(data);
    expect(p).toMatchObject({ tingkat: "tindakan", judul: "Siapkan toko (langkah 4 dari 7)" });
    expect(p?.tombol).toBeUndefined();
    expect(p?.tautan).toEqual([{ href: "/dashboard/outlet/shift", label: "Buat shift" }]);
    const jadwal = kartu({ ...data, absensi: { shiftAktif: true, pola: true, jadwal: false } });
    expect(jadwal?.tautan).toEqual([{ href: "/dashboard/outlet/jadwal/generate", label: "Generate jadwal" }]);
  });

  it("Toko ini hanya saya melewati karyawan dan absensi selama tanpa staf; begitu ada staf, absensi muncul", () => {
    const solo = { ...dasar, karyawan: { posisi: false, staf: false, hanyaOwner: true }, absensi };
    expect(langkahKesiapan(solo).map((l) => l.kunci)).toEqual(["produk", "sesi-booking"]);
    const adaStaf = { ...dasar, karyawan: { posisi: true, staf: true, hanyaOwner: true }, absensi };
    expect(langkahKesiapan(adaStaf).map((l) => l.kunci)).toContain("shift");
  });

  it("data karyawan atau absensi yang belum diketahui tidak dihitung", () => {
    expect(langkahKesiapan({ ...dasar, karyawan: { posisi: null, staf: null, hanyaOwner: false }, absensi }).map((l) => l.kunci))
      .toEqual(["produk", "sesi-booking"]);
    const sebagian = { shiftAktif: true, pola: null, jadwal: null };
    expect(
      langkahKesiapan({ ...dasar, karyawan: { posisi: null, staf: true, hanyaOwner: false }, absensi: sebagian }).map((l) => l.kunci),
    ).toEqual(["produk", "karyawan", "shift", "sesi-booking"]);
  });
});

describe("rentangJadwalKesiapan (KS11a)", () => {
  it("62 hari yang berakhir di akhir minggu depan, lintas bulan dan tahun", () => {
    expect(rentangJadwalKesiapan("2026-12-06")).toEqual({ startDate: "2026-10-06", endDate: "2026-12-06" });
    expect(rentangJadwalKesiapan("2027-01-03")).toEqual({ startDate: "2026-11-03", endDate: "2027-01-03" });
  });
});
