import { describe, expect, it } from "vitest";
import {
  arahBersih,
  barisPeriode,
  filterAwalArusKas,
  labelBarisArusKas,
  masukKeluar,
  parameterArusKas,
  rincianArusKas,
  type FilterArusKas,
} from "@/features/laporan/arus-kas";
import { namaBerkasDari } from "@/lib/apiClient";
import type { AngkaArusKas, BarisArusKas } from "@/types/laporan";

const nol: AngkaArusKas = {
  penjualanMasuk: 0,
  penjualanVoid: 0,
  bebanKeluar: 0,
  bebanPembalik: 0,
  pembelianKeluar: 0,
  pembelianPembalik: 0,
  selisihKasMasuk: 0,
  selisihKasKeluar: 0,
  transferMasuk: 0,
  transferMasukVoid: 0,
  transferKeluar: 0,
  transferKeluarVoid: 0,
  saldoAwalAkun: 0,
  arusKasBersih: 0,
};

const contoh: AngkaArusKas = {
  ...nol,
  penjualanMasuk: 9_820_000,
  penjualanVoid: 145_000,
  bebanKeluar: 2_850_000,
  bebanPembalik: 75_000,
  pembelianKeluar: 3_900_000,
  selisihKasMasuk: 12_500,
  selisihKasKeluar: 25_000,
  saldoAwalAkun: 300_000,
  transferMasuk: 500_000,
  transferKeluar: 200_000,
  arusKasBersih: 3_287_500,
};

const filterNov = (kelompok: FilterArusKas["kelompok"]): FilterArusKas => ({
  akunKasID: "",
  dari: new Date(2026, 10, 1),
  sampai: new Date(2026, 10, 12),
  kelompok,
});

describe("filterAwalArusKas dan parameterArusKas", () => {
  it("bulan berjalan sampai hari ini, seluruh akun, per hari", () => {
    const f = filterAwalArusKas(new Date(2026, 10, 12, 21, 30));
    expect(parameterArusKas(f)).toEqual({ startDate: "2026-11-01", endDate: "2026-11-12", kelompok: "hari" });
  });
  it("akun kas dan format hanya dikirim bila ada; periode tidak pernah dikirim", () => {
    const p = parameterArusKas({ ...filterNov("minggu"), akunKasID: "akun1" }, "xlsx");
    expect(p).toEqual({ startDate: "2026-11-01", endDate: "2026-11-12", kelompok: "minggu", akunKasID: "akun1", format: "xlsx" });
  });
});

describe("rincianArusKas", () => {
  it("seluruh akun: tanpa transfer, total panel cocok dengan arus kas bersih, urut dari terbesar", () => {
    const [masuk, keluar] = rincianArusKas(contoh, false);
    expect(masuk.judul).toBe("Uang masuk");
    expect(masuk.total).toBe(10_207_500);
    expect(keluar.total).toBe(6_920_000);
    expect(masuk.total - keluar.total).toBe(contoh.arusKasBersih);
    expect(masuk.baris.map((b) => b.label)).toEqual([
      "Penjualan",
      "Saldo awal akun baru",
      "Beban",
      "Selisih kas lebih",
      "Pembelian stok",
    ]);
    expect(masuk.baris[0].persen).toBe(100);
    expect([...masuk.baris, ...keluar.baris].some((b) => b.label.startsWith("Transfer"))).toBe(false);
  });
  it("pembatalan masuk ke panel arah uangnya dan ditandai", () => {
    const [masuk, keluar] = rincianArusKas(contoh, false);
    expect(masuk.baris.find((b) => b.label === "Beban")).toMatchObject({ nilai: 75_000, pembatalan: true });
    expect(keluar.baris.find((b) => b.label === "Penjualan")).toMatchObject({ nilai: 145_000, pembatalan: true });
    expect(keluar.baris.find((b) => b.label === "Beban")).toMatchObject({ nilai: 2_850_000, pembatalan: false });
  });
  it("satu akun kas: transfer ikut di kedua panel", () => {
    const [masuk, keluar] = rincianArusKas(contoh, true);
    expect(masuk.baris.find((b) => b.label === "Transfer masuk" && !b.pembatalan)?.nilai).toBe(500_000);
    expect(keluar.baris.find((b) => b.label === "Transfer keluar" && !b.pembatalan)?.nilai).toBe(200_000);
  });
  it("tanpa mutasi: semua batang 0", () => {
    const panel = rincianArusKas(nol, false);
    expect(panel.flatMap((p) => p.baris).every((b) => b.persen === 0)).toBe(true);
  });
});

describe("labelBarisArusKas dan barisPeriode", () => {
  it("per hari, per minggu yang dipangkas ke rentang, dan per bulan", () => {
    expect(labelBarisArusKas("2026-11-12", "hari", filterNov("hari"))).toBe("Kam, 12 Nov");
    expect(labelBarisArusKas("2026-10-26", "minggu", filterNov("minggu"))).toBe("1 Nov");
    expect(labelBarisArusKas("2026-11-02", "minggu", filterNov("minggu"))).toBe("2 sampai 8 Nov");
    expect(labelBarisArusKas("2026-11-09", "minggu", filterNov("minggu"))).toBe("9 sampai 12 Nov");
    const lintasBulan = { ...filterNov("minggu"), sampai: new Date(2026, 11, 31) };
    expect(labelBarisArusKas("2026-11-30", "minggu", lintasBulan)).toBe("30 Nov sampai 6 Des");
    expect(labelBarisArusKas("2026-11", "bulan", filterNov("bulan"))).toBe("November 2026");
  });
  it("terbaru lebih dulu, dengan masuk dan keluar termasuk pembatalan", () => {
    const baris: BarisArusKas[] = [
      { ...nol, tanggal: "2026-11-01", penjualanMasuk: 100, arusKasBersih: 100 },
      { ...nol, tanggal: "2026-11-02", penjualanMasuk: 50, penjualanVoid: 20, bebanKeluar: 80, arusKasBersih: -50 },
    ];
    expect(barisPeriode(baris, filterNov("hari"))).toEqual([
      { kunci: "2026-11-02", label: "Sen, 2 Nov", masuk: 50, keluar: 100, bersih: -50 },
      { kunci: "2026-11-01", label: "Min, 1 Nov", masuk: 100, keluar: 0, bersih: 100 },
    ]);
  });
  it("masukKeluar menjumlah transfer bila ada", () => {
    expect(masukKeluar(contoh)).toEqual({ masuk: 10_707_500, keluar: 7_120_000 });
  });
});

describe("arahBersih dan namaBerkasDari", () => {
  it("naik, turun, tetap", () => {
    expect([arahBersih(1), arahBersih(-1), arahBersih(0)]).toEqual(["naik", "turun", "tetap"]);
  });
  it("nama berkas dari Content-Disposition, atau cadangan", () => {
    expect(namaBerkasDari('attachment; filename="arus-kas_2026-11-01_2026-11-12.pdf"', "x.pdf")).toBe(
      "arus-kas_2026-11-01_2026-11-12.pdf",
    );
    expect(namaBerkasDari(null, "cadangan.csv")).toBe("cadangan.csv");
  });
});
