import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IZIN, IZIN_HALAMAN, bolehBukaRute, syaratRute } from "@/lib/auth/permissions";

const OUTLET = "/dashboard/outlet";

/** Seluruh rute halaman di bawah app/dashboard, dibaca dari disk. */
function ruteHalaman(dir: string, hasil: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) ruteHalaman(join(dir, e.name), hasil);
    else if (e.name === "page.tsx") hasil.push("/" + dir.replace(/^app\//, ""));
  }
  return hasil;
}

describe("syaratRute", () => {
  it("mengembalikan syarat rute yang terdaftar persis", () => {
    expect(syaratRute(`${OUTLET}/penjualan`)).toEqual([IZIN.penjualan]);
  });

  it("mencocokkan rute berparameter dengan pola [id]", () => {
    expect(syaratRute(`${OUTLET}/penjualan/abc123`)).toEqual([IZIN.penjualan]);
    expect(syaratRute(`${OUTLET}/penjualan/abc123/pembayaran`)).toEqual([
      IZIN.penjualan,
      IZIN.buatPembayaran,
    ]);
  });

  it("mendahulukan rute statis dari pola [id]", () => {
    expect(syaratRute(`${OUTLET}/penjualan/buatPenjualan`)).toContain(IZIN.buatPenjualan);
    expect(syaratRute(`${OUTLET}/pengaturan/metodePembayaran/buatMetodePembayaran`)).toContain(
      IZIN.buatMetodePembayaran,
    );
  });

  it("tidak mencocokkan rute yang jumlah segmennya berbeda atau tidak dikenal", () => {
    expect(syaratRute(`${OUTLET}/penjualan/abc123/lain`)).toBeUndefined();
    expect(syaratRute("/dashboard/tidak-ada")).toBeUndefined();
  });
});

describe("bolehBukaRute", () => {
  it("halaman detail hanya menuntut izin baca (GR5a)", () => {
    const rute = `${OUTLET}/inventaris/stockOpname/abc123`;
    expect(bolehBukaRute(rute, [IZIN.stockOpname])).toBe(true);
    expect(bolehBukaRute(rute, [])).toBe(false);
  });

  it("halaman form menuntut izin baca dan izin tulisnya (GR5a)", () => {
    const rute = `${OUTLET}/inventaris/bahanBaku/abc123/edit`;
    expect(bolehBukaRute(rute, [IZIN.bahan])).toBe(false);
    expect(bolehBukaRute(rute, [IZIN.ubahBahan])).toBe(false);
    expect(bolehBukaRute(rute, [IZIN.bahan, IZIN.ubahBahan])).toBe(true);
  });

  it("buat penjualan menerima read-produk atau akses-pos, ditambah izin buat", () => {
    const rute = `${OUTLET}/penjualan/buatPenjualan`;
    expect(bolehBukaRute(rute, [IZIN.aksesPos, IZIN.pelanggan, IZIN.buatPenjualan])).toBe(true);
    expect(bolehBukaRute(rute, [IZIN.produk, IZIN.pelanggan, IZIN.buatPenjualan])).toBe(true);
    expect(bolehBukaRute(rute, [IZIN.pelanggan, IZIN.buatPenjualan])).toBe(false);
    expect(bolehBukaRute(rute, [IZIN.aksesPos, IZIN.buatPenjualan])).toBe(false);
    const reservasi = `${OUTLET}/reservasi/buatReservasi`;
    expect(bolehBukaRute(reservasi, [IZIN.booking, IZIN.pelanggan, IZIN.buatBooking])).toBe(true);
    expect(bolehBukaRute(reservasi, [IZIN.booking, IZIN.buatBooking])).toBe(false);
    expect(bolehBukaRute(rute, [IZIN.aksesPos])).toBe(false);
  });

  it("halaman berizin per bagian dan master reservasi terbuka tanpa izin (PO14a, DN1a, GR6a)", () => {
    for (const rute of [
      "/dashboard",
      "/dashboard/profil",
      `${OUTLET}/pengaturan/toko`,
      `${OUTLET}/keuangan/akunkas/pindahDana`,
      `${OUTLET}/reservasi/aset`,
      `${OUTLET}/reservasi/tarif`,
      `${OUTLET}/reservasi/tipeAset`,
    ]) {
      expect(bolehBukaRute(rute, []), rute).toBe(true);
    }
  });

  it("pemilik seluruh izin membuka setiap rute terpetakan", () => {
    const semua = Object.values(IZIN);
    for (const kunci of Object.keys(IZIN_HALAMAN)) {
      expect(bolehBukaRute(kunci.replaceAll("[id]", "abc123"), semua), kunci).toBe(true);
    }
  });
});

describe("kelengkapan IZIN_HALAMAN", () => {
  it("setiap halaman di bawah app/dashboard punya entri (GR3a)", () => {
    const tanpaEntri = ruteHalaman("app/dashboard").filter((rute) => !(rute in IZIN_HALAMAN));
    expect(tanpaEntri).toEqual([]);
  });
});