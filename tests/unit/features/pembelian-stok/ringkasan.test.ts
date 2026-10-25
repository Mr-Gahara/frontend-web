import { describe, expect, it, vi } from "vitest";
import type { HalamanPembelianStok } from "@/features/pembelian-stok/api";
import {
  AKUN_TIDAK_DIKENAL,
  LOKASI_TIDAK_DIKENAL,
  NAMA_LAINNYA,
  bagianRingkasan,
  kumpulkanPembelian,
  ringkasBelanja,
  ringkasanLengkap,
  ruangLokasi,
  teksAriaBagian,
  teksPeriode,
  teksRingkasanTidakLengkap,
  type BarisRingkasan,
} from "@/features/pembelian-stok/ringkasan";
import type { Lokasi } from "@/types/location";
import type { PembelianStok } from "@/types/pembelianStok";

function pembelian(id: string, sebagian: Partial<PembelianStok> = {}): PembelianStok {
  return {
    id,
    tanggal: "2026-10-10T03:00:00.000Z",
    akunKasID: { id: "a1", namaAkun: "Kas Laci", nomorAkun: "101" },
    supplier: "CV Manis",
    keterangan: "uji",
    items: [],
    totalBiaya: 1000,
    locationID: "o1",
    nomorFaktur: "F-" + id,
    dicatatOleh: { id: "u1", nama: "Owner" },
    stokDitambahkan: true,
    tenantID: "t1",
    createdAt: "2026-10-10T03:00:00.000Z",
    updatedAt: "2026-10-10T03:00:00.000Z",
    ...sebagian,
  };
}

const LOKASI = [
  { id: "o1", nama: "Outlet Pontianak", tipe: "Outlet" },
  { id: "g1", nama: "Gudang A", tipe: "Gudang" },
] as unknown as Lokasi[];

const halaman = (data: PembelianStok[], page: number, totalPages: number, total: number): HalamanPembelianStok => ({
  data,
  pagination: { page, limit: 100, total, totalPages },
});

const baris = (nama: string, total: number, jumlah = 1): BarisRingkasan => ({ kunci: nama, nama, total, jumlah });

describe("kumpulkanPembelian", () => {
  it("satu halaman: diambil sekali dan lengkap", async () => {
    const ambil = vi.fn(async () => halaman([pembelian("p1"), pembelian("p2")], 1, 1, 2));
    const hasil = await kumpulkanPembelian(ambil);
    expect(ambil.mock.calls).toEqual([[1]]);
    expect(hasil.daftar.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(hasil).toMatchObject({ total: 2, terpotong: false });
    expect(ringkasanLengkap(hasil)).toBe(true);
  });

  it("tanpa pagination: total mengikuti panjang daftar", async () => {
    const ambil = vi.fn(async () => ({ data: [pembelian("p1")], pagination: null }));
    const hasil = await kumpulkanPembelian(ambil);
    expect(ambil).toHaveBeenCalledTimes(1);
    expect(hasil.total).toBe(1);
    expect(ringkasanLengkap(hasil)).toBe(true);
  });

  it("beberapa halaman diambil berurutan sampai halaman terakhir", async () => {
    const ambil = vi.fn(async (h: number) => halaman([pembelian("p" + h)], h, 3, 3));
    const hasil = await kumpulkanPembelian(ambil);
    expect(ambil.mock.calls).toEqual([[1], [2], [3]]);
    expect(hasil.daftar.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    expect(ringkasanLengkap(hasil)).toBe(true);
  });

  it("baris yang muncul di dua halaman dihitung sekali, dan ringkasan ditandai tidak lengkap", async () => {
    const isi: Record<number, PembelianStok[]> = { 1: [pembelian("p1"), pembelian("p2")], 2: [pembelian("p2")] };
    const hasil = await kumpulkanPembelian(async (h) => halaman(isi[h], h, 2, 3));
    expect(hasil.daftar.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(ringkasanLengkap(hasil)).toBe(false);
    expect(teksRingkasanTidakLengkap(hasil)).toBe(
      "Pembelian berubah selama ringkasan dihitung (2 dari 3 pembelian). Muat ulang halaman untuk angka terbaru.",
    );
  });

  it("berhenti di batas halaman dan menandai hasilnya terpotong", async () => {
    const ambil = vi.fn(async (h: number) => halaman([pembelian("p" + h)], h, 5, 5));
    const hasil = await kumpulkanPembelian(ambil, 2);
    expect(ambil.mock.calls).toEqual([[1], [2]]);
    expect(hasil).toMatchObject({ total: 5, terpotong: true });
    expect(ringkasanLengkap(hasil)).toBe(false);
  });
});

describe("teksRingkasanTidakLengkap", () => {
  it("terpotong menyebut jumlah yang dihitung, total, dan batas", () => {
    const teks = teksRingkasanTidakLengkap({
      daftar: [pembelian("p1"), pembelian("p2")],
      total: 2500,
      terpotong: true,
    });
    expect(teks).toBe(
      "Ringkasan dihitung dari 2 dari 2.500 pembelian, karena pembelian pada filter ini melebihi 2.000. Persempit periode atau filter untuk angka lengkap.",
    );
  });
});

describe("ringkasBelanja", () => {
  const daftar = [
    pembelian("p1", { totalBiaya: 1000 }),
    pembelian("p2", {
      totalBiaya: 3000,
      locationID: "g1",
      akunKasID: { id: "a2", namaAkun: "Rekening BCA", nomorAkun: "102" },
      supplier: "  cv manis ",
    }),
    pembelian("p3", { totalBiaya: 500, supplier: "Toko Susu" }),
    pembelian("p4", { totalBiaya: 200, locationID: "x9", akunKasID: null, supplier: "UD Jaya" }),
  ];

  it("menjumlahkan total serta mengelompokkan per lokasi, akun kas, dan supplier", () => {
    const hasil = ringkasBelanja(daftar, LOKASI);
    expect(hasil.total).toBe(4700);
    expect(hasil.jumlahPembelian).toBe(4);
    expect(hasil.perLokasi).toEqual([
      { kunci: "g1", nama: "Gudang A", total: 3000, jumlah: 1 },
      { kunci: "o1", nama: "Outlet Pontianak", total: 1500, jumlah: 2 },
      { kunci: "", nama: LOKASI_TIDAK_DIKENAL, total: 200, jumlah: 1 },
    ]);
    expect(hasil.perAkun).toEqual([
      { kunci: "a2", nama: "Rekening BCA", total: 3000, jumlah: 1 },
      { kunci: "a1", nama: "Kas Laci", total: 1500, jumlah: 2 },
      { kunci: "", nama: AKUN_TIDAK_DIKENAL, total: 200, jumlah: 1 },
    ]);
    expect(hasil.supplier).toEqual([
      { kunci: "cv manis", nama: "CV Manis", total: 4000, jumlah: 2 },
      { kunci: "toko susu", nama: "Toko Susu", total: 500, jumlah: 1 },
      { kunci: "ud jaya", nama: "UD Jaya", total: 200, jumlah: 1 },
    ]);
  });

  it("supplier dibatasi sebanyak batasSupplier", () => {
    expect(ringkasBelanja(daftar, LOKASI, 2).supplier.map((s) => s.nama)).toEqual(["CV Manis", "Toko Susu"]);
  });

  it("tanpa daftar lokasi, seluruh lokasi digabung sebagai lokasi tidak dikenal", () => {
    expect(ringkasBelanja(daftar, undefined).perLokasi).toEqual([
      { kunci: "", nama: LOKASI_TIDAK_DIKENAL, total: 4700, jumlah: 4 },
    ]);
  });
});

describe("bagianRingkasan", () => {
  it("lebih dari maks + 1 baris: sisanya digabung menjadi Lainnya", () => {
    const hasil = bagianRingkasan(
      [baris("A", 50), baris("B", 20), baris("C", 10), baris("D", 10), baris("E", 5, 2), baris("F", 5, 3)],
      4,
    );
    expect(hasil.map((b) => b.nama)).toEqual(["A", "B", "C", "D", NAMA_LAINNYA]);
    expect(hasil[4]).toMatchObject({ total: 10, jumlah: 5, persen: 10 });
    expect(hasil[0].persen).toBe(50);
  });

  it("tepat maks + 1 baris tidak digabung", () => {
    const hasil = bagianRingkasan([baris("A", 1), baris("B", 1), baris("C", 1), baris("D", 1), baris("E", 1)], 4);
    expect(hasil.map((b) => b.nama)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("tanpa baris kosong, dan total 0 berporsi 0", () => {
    expect(bagianRingkasan([])).toEqual([]);
    expect(bagianRingkasan([baris("A", 0)])[0].persen).toBe(0);
  });
});

describe("teksAriaBagian", () => {
  it("membulatkan porsi tiap bagian", () => {
    expect(
      teksAriaBagian([
        { nama: "Gudang A", persen: 71.43 },
        { nama: "Outlet", persen: 28.57 },
      ]),
    ).toBe("Gudang A 71 persen, Outlet 29 persen");
  });
});

describe("ruangLokasi", () => {
  const tipe = (t: string) => ({ tipe: t }) as unknown as Pick<Lokasi, "tipe">;
  it("memetakan tipe lokasi ke ruang asal pembelian", () => {
    expect(ruangLokasi(tipe("Outlet"))).toBe("outlet");
    expect(ruangLokasi(tipe("Gudang"))).toBe("gudang");
    expect(ruangLokasi(tipe("Kios"))).toBeNull();
    expect(ruangLokasi(null)).toBeNull();
  });
});

describe("teksPeriode", () => {
  it("menyesuaikan teks dengan batas periode yang diisi", () => {
    const dari = new Date(2026, 9, 1);
    const sampai = new Date(2026, 9, 31);
    expect(teksPeriode(dari, sampai)).toBe("1 Okt 2026 sampai 31 Okt 2026");
    expect(teksPeriode(dari)).toBe("sejak 1 Okt 2026");
    expect(teksPeriode(undefined, sampai)).toBe("sampai 31 Okt 2026");
    expect(teksPeriode()).toBe("seluruh waktu");
  });
});