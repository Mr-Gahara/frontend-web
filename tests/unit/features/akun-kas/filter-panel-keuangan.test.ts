import { describe, it, expect, vi } from "vitest";
import { filterAwalMutasi, jumlahFilterMutasi, pilFilterMutasi } from "@/features/akun-kas/mutasi";
import { FILTER_AWAL_BEBAN, jumlahFilterBeban, pilFilterBeban } from "@/features/beban-operasional/payload";
import { FILTER_AWAL_TRANSFER, jumlahFilterTransfer, pilFilterTransfer } from "@/features/jurnal-transfer/payload";
import { filterAwalArusKas, jumlahFilterArusKas, pilFilterArusKas } from "@/features/laporan/arus-kas";
import { jumlahFilterPembelian, pilFilterPembelian } from "@/features/pembelian-stok/payload";
import { SEMUA_MESIN, filterAwalRiwayat, jumlahFilterRiwayat, pilFilterRiwayat } from "@/features/sesi-kasir/filter";

/** Pil dan lencana filter seragam halaman Keuangan (FL1a, FL4a, FL11a). */
const HARI_INI = new Date(2026, 10, 19);
const t = (d: number) => new Date(2026, 10, d);

describe("mutasi kas", () => {
  const bawaan = filterAwalMutasi(HARI_INI);

  it("periode bawaan bulan ini tidak dihitung dan tidak menjadi pil", () => {
    expect(jumlahFilterMutasi(bawaan, bawaan)).toBe(0);
    expect(pilFilterMutasi(bawaan, bawaan, [], HARI_INI, () => {})).toEqual([]);
  });

  it("periode yang diubah menjadi pil, dan menghapusnya kembali ke bawaan", () => {
    const terapkan = vi.fn();
    const f = { ...bawaan, dari: t(15), sampai: t(18), arah: "KELUAR" as const };
    expect(jumlahFilterMutasi(f, bawaan)).toBe(2);
    const pil = pilFilterMutasi(f, bawaan, [], HARI_INI, terapkan);
    expect(pil.map((p) => p.label)).toEqual(["Arah: Uang keluar", "15 – 18 Nov 2026"]);
    pil[1].onHapus();
    expect(terapkan).toHaveBeenCalledWith({ ...f, dari: bawaan.dari, sampai: bawaan.sampai });
  });
});

describe("pengeluaran dan riwayat transfer", () => {
  it("tanpa periode bawaan: periode apa pun dihitung", () => {
    expect(jumlahFilterBeban(FILTER_AWAL_BEBAN)).toBe(0);
    expect(jumlahFilterBeban({ ...FILTER_AWAL_BEBAN, status: "VOID", sampai: t(19) })).toBe(2);
    expect(jumlahFilterTransfer({ ...FILTER_AWAL_TRANSFER, akunKasID: "a1" })).toBe(1);
  });

  it("nama akun dan kategori dari daftar yang dimuat halaman", () => {
    const pil = pilFilterBeban(
      { ...FILTER_AWAL_BEBAN, akunKasID: "a1", kategoriBebanID: "k1" },
      { akun: () => "Kas Kecil", kategori: () => "Listrik" },
      HARI_INI,
      () => {},
    );
    expect(pil.map((p) => p.label)).toEqual(["Akun: Kas Kecil", "Kategori: Listrik"]);
    const pilTransfer = pilFilterTransfer(
      { ...FILTER_AWAL_TRANSFER, status: "VOID" },
      [],
      HARI_INI,
      () => {},
    );
    expect(pilTransfer.map((p) => p.label)).toEqual(["Status: Dibatalkan"]);
  });
});

describe("arus kas", () => {
  const bawaan = filterAwalArusKas(HARI_INI);

  it("Kelompokkan per bukan filter (FL8a), dan periode bawaan tidak dihitung", () => {
    expect(jumlahFilterArusKas({ ...bawaan, kelompok: "minggu" }, bawaan)).toBe(0);
    expect(pilFilterArusKas({ ...bawaan, kelompok: "bulan" }, bawaan, [], HARI_INI, () => {})).toEqual([]);
  });

  it("akun dan periode yang diubah dihitung", () => {
    const f = { ...bawaan, akunKasID: "a1", dari: t(10) };
    expect(jumlahFilterArusKas(f, bawaan)).toBe(2);
    expect(pilFilterArusKas(f, bawaan, [{ id: "a1", namaAkun: "Bank" }], HARI_INI, () => {}).map((p) => p.label)).toEqual([
      "Akun: Bank",
      "10 – 19 Nov 2026",
    ]);
  });
});

describe("pembelian stok dan belanja stok", () => {
  const bawaan = { akunKasID: "", bahanBakuID: "", lokasiID: "", dari: t(1), sampai: HARI_INI };
  const nama = { akun: () => "Kas", bahan: () => "Gula", lokasi: () => "Gudang Pusat" };

  it("periode bawaan tidak dihitung; lokasi, akun, dan bahan dihitung", () => {
    expect(jumlahFilterPembelian(bawaan, bawaan)).toBe(0);
    const f = { ...bawaan, lokasiID: "l1", bahanBakuID: "b1" };
    expect(jumlahFilterPembelian(f, bawaan)).toBe(2);
    expect(pilFilterPembelian(f, bawaan, nama, HARI_INI, () => {}).map((p) => p.label)).toEqual([
      "Lokasi: Gudang Pusat",
      "Bahan: Gula",
    ]);
  });
});

describe("riwayat mesin kasir", () => {
  const bawaan = filterAwalRiwayat(HARI_INI);

  it("bawaan tujuh hari tidak dihitung; mesin terpilih dihitung", () => {
    expect(jumlahFilterRiwayat(bawaan, bawaan)).toBe(0);
    const f = { ...bawaan, mesin: "inst-1" };
    expect(jumlahFilterRiwayat(f, bawaan)).toBe(1);
    const terapkan = vi.fn();
    const pil = pilFilterRiwayat(f, bawaan, () => "Kasir Depan", HARI_INI, terapkan);
    expect(pil.map((p) => p.label)).toEqual(["Mesin: Kasir Depan"]);
    pil[0].onHapus();
    expect(terapkan).toHaveBeenCalledWith({ ...f, mesin: SEMUA_MESIN });
  });
});
