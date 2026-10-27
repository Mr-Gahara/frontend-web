import { describe, expect, it } from "vitest";
import {
  AKUN_TIDAK_DIKENAL,
  LOKASI_TIDAK_DIKENAL,
  NAMA_LAINNYA,
  bagianRingkasan,
  petakanRingkasan,
  ruangLokasi,
  teksAriaBagian,
  teksPeriode,
  type BarisRingkasan,
} from "@/features/pembelian-stok/ringkasan";
import type { Lokasi } from "@/types/location";

const baris = (nama: string, total: number, jumlah = 1): BarisRingkasan => ({ kunci: nama, nama, total, jumlah });

describe("petakanRingkasan", () => {
  it("memetakan respons GET /pembelianstok/ringkasan (B117) ke baris kartu dalam urutan backend", () => {
    const hasil = petakanRingkasan({
      total: 4700,
      jumlahPembelian: 4,
      perLokasi: [
        { locationID: "g1", nama: "Gudang A", tipe: "Gudang", total: 3000, jumlah: 1 },
        { locationID: "o1", nama: "Outlet Pontianak", tipe: "Outlet", total: 1500, jumlah: 2 },
        { locationID: null, nama: null, tipe: null, total: 200, jumlah: 1 },
      ],
      perAkunKas: [
        { akunKasID: "a2", namaAkun: "Rekening BCA", total: 3000, jumlah: 1 },
        { akunKasID: "a1", namaAkun: "Kas Laci", total: 1500, jumlah: 2 },
        { akunKasID: null, namaAkun: null, total: 200, jumlah: 1 },
      ],
      supplier: [
        { nama: "CV Manis", total: 4000, jumlah: 2 },
        { nama: "Toko Susu", total: 500, jumlah: 1 },
      ],
    });
    expect(hasil).toEqual({
      total: 4700,
      jumlahPembelian: 4,
      perLokasi: [
        { kunci: "g1", nama: "Gudang A", total: 3000, jumlah: 1 },
        { kunci: "o1", nama: "Outlet Pontianak", total: 1500, jumlah: 2 },
        { kunci: "", nama: LOKASI_TIDAK_DIKENAL, total: 200, jumlah: 1 },
      ],
      perAkun: [
        { kunci: "a2", nama: "Rekening BCA", total: 3000, jumlah: 1 },
        { kunci: "a1", nama: "Kas Laci", total: 1500, jumlah: 2 },
        { kunci: "", nama: AKUN_TIDAK_DIKENAL, total: 200, jumlah: 1 },
      ],
      supplier: [
        { kunci: "CV Manis", nama: "CV Manis", total: 4000, jumlah: 2 },
        { kunci: "Toko Susu", nama: "Toko Susu", total: 500, jumlah: 1 },
      ],
    });
  });

  it("ringkasan kosong menghasilkan kartu tanpa baris", () => {
    expect(
      petakanRingkasan({ total: 0, jumlahPembelian: 0, perLokasi: [], perAkunKas: [], supplier: [] }),
    ).toEqual({ total: 0, jumlahPembelian: 0, perLokasi: [], perAkun: [], supplier: [] });
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
