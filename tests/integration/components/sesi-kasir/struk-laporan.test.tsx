import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { StrukLaporan } from "@/features/sesi-kasir/struk-laporan";
import type { LaporanPeriodeKasir } from "@/types/sesiKasir";

const LAPORAN: LaporanPeriodeKasir = {
  toko: { namaToko: "Kopi Senja", alamat: "Alamat toko", logoUrl: null },
  outlet: { id: "o1", nama: "Outlet Gajah Mada", alamat: "Jl. Gajah Mada No. 12, Pontianak" },
  kasir: ["Budi", "Rina"],
  dibukaPada: new Date(2026, 10, 24, 8, 0).toISOString(),
  ditutupPada: new Date(2026, 10, 24, 16, 5).toISOString(),
  jumlahSesi: 2,
  modalAwal: 200000,
  penerimaanPerMetode: [
    { namaMetodePembayaran: "QRIS", jumlah: 430000 },
    { namaMetodePembayaran: "Tunai", jumlah: 1250000 },
  ],
  totalPenerimaanKasir: 1680000,
  totalPenerimaanInvoice: 0,
  totalPenerimaan: 1680000,
  jendelaInvoice: { dari: "", sampai: "" },
  saldoAkhir: 1450000,
  transaksiSelesai: 42,
  transaksiBelumTerbayar: 2,
  totalSistem: 1450000,
  tunaiAktual: 1448000,
  selisih: -2000,
  produkTerjual: [
    { produkID: "p1", namaProduk: "Es Kopi Susu", jumlah: 18 },
    { produkID: "p2", namaProduk: "Teh Tarik", jumlah: 12 },
  ],
  totalProdukTerjual: 30,
};

/** Pasangan label dan nilai dari baris struk berurutan. */
const baris = (el: HTMLElement) =>
  Array.from(el.querySelectorAll("dl > div")).map((d) => [d.querySelector("dt")?.textContent, d.querySelector("dd")?.textContent]);

describe("Integration - StrukLaporan (PW10, Susunan struk)", () => {
  it("sembilan section berurutan dengan angka laporan apa adanya", () => {
    render(<StrukLaporan laporan={LAPORAN} />);
    const struk = screen.getByRole("article", { name: "Struk laporan tutup kasir" });
    expect(struk).toHaveTextContent("Kopi Senja");
    expect(struk).toHaveTextContent("Outlet Gajah Mada");
    // Alamat outlet didahulukan dari alamat toko.
    expect(struk).toHaveTextContent("Jl. Gajah Mada No. 12, Pontianak");
    expect(struk).not.toHaveTextContent("Alamat toko");

    const transaksi = [
      ["Kasir", "Budi, Rina"],
      ["Buka", "24/11/2026 08.00"],
      ["Tutup", "24/11/2026 16.05"],
      ["Modal awal", "200.000"],
      ["QRIS", "430.000"],
      ["Tunai", "1.250.000"],
      ["Total penerimaan kasir", "1.680.000"],
      // Keputusan 11: tampil walau 0.
      ["Total penerimaan invoice", "0"],
    ];
    expect(baris(struk)).toEqual([
      ...transaksi,
      ["Total penerimaan", "1.680.000"],
      ["Saldo akhir", "1.450.000"],
      ["Transaksi selesai", "42"],
      ["Belum terbayar", "2"],
      ["Total sistem", "1.450.000"],
      ["Tunai aktual", "1.448.000"],
      ["Selisih", "-2.000"],
      // Section 7 mengulang isi section 2.
      ...transaksi,
      ["Es Kopi Susu", "18"],
      ["Teh Tarik", "12"],
      ["Total produk terjual", "30"],
    ]);
    expect(within(struk).getByRole("region", { name: "Transaksi penjualan" })).toHaveTextContent(
      "LAPORAN TUTUP KASIRTRANSAKSI PENJUALAN",
    );
    expect(within(struk).getByRole("region", { name: "Penjualan menu" })).toHaveTextContent("PRODUK TERJUAL");
  });

  it("pemisah: satu garis per section, dua garis antara section 6 dan 7", () => {
    render(<StrukLaporan laporan={LAPORAN} />);
    const struk = screen.getByRole("article", { name: "Struk laporan tutup kasir" });
    // Delapan batas antarsection, satu di antaranya ganda: sembilan garis.
    expect(struk.querySelectorAll("hr")).toHaveLength(9);
    expect(struk.querySelector("[data-garis-ganda]")?.querySelectorAll("hr")).toHaveLength(2);
  });

  it("tanpa produk dan tanpa metode: section tetap ada dengan total 0", () => {
    render(<StrukLaporan laporan={{ ...LAPORAN, penerimaanPerMetode: [], produkTerjual: [], totalProdukTerjual: 0 }} />);
    const struk = screen.getByRole("article", { name: "Struk laporan tutup kasir" });
    expect(baris(struk).slice(-1)).toEqual([["Total produk terjual", "0"]]);
    expect(baris(struk).map(([l]) => l)).not.toContain("Tunai");
  });
});
