import { describe, expect, it } from "vitest";
import type { AksesTautan } from "@/features/notifikasi/akses";
import {
  URL_BUAT_PRODUK,
  URL_CATAT_PEMBELIAN,
  URL_PRODUK,
  pemberitahuanProdukMinimum,
  pemberitahuanStokProduk,
  pemicuStokProduk,
} from "@/features/notifikasi/sumber-stok-produk";

const IZIN_PENUH = [
  "read-produk",
  "create-produk",
  "update-produk",
  "read-kategori",
  "read-pembelian-stok-outlet",
  "create-pembelian-stok-outlet",
  "read-pengajuan-stok",
  "create-pengajuan-stok",
  "read-bahan",
  "read-akunkas",
  "read-location",
  "read-inventory",
];
const akses = (ubah: Partial<AksesTautan> = {}): AksesTautan => ({
  permissions: IZIN_PENUH,
  plan: "pro",
  fiturSiap: { wms: true },
  ...ubah,
});

describe("pemicuStokProduk dari ringkasan (LN1a, B380, PW07)", () => {
  it("toko tanpa produk: total 0", () => {
    expect(pemicuStokProduk({ total: 0, dapatDijual: 0 })).toEqual({ jenis: "tanpa-produk" });
  });

  it("tidak memicu bila ada produk yang dapat dijual", () => {
    expect(pemicuStokProduk({ total: 12, dapatDijual: 1 })).toBeNull();
    expect(pemicuStokProduk({ total: 3, dapatDijual: 3 })).toBeNull();
  });

  it("memicu dengan jumlah produk bila tidak ada satu pun yang dapat dijual", () => {
    expect(pemicuStokProduk({ total: 12, dapatDijual: 0 })).toEqual({ jenis: "tak-terjual", jumlah: 12 });
  });

  it("ringkasan belum termuat atau tidak dimuat: tidak ada pemicu", () => {
    expect(pemicuStokProduk(undefined)).toBeNull();
    expect(pemicuStokProduk(null)).toBeNull();
  });
});

describe("pemberitahuanStokProduk (LN2a, PW07)", () => {
  it("tanpa produk: penting, ke Buat Produk", () => {
    const p = pemberitahuanStokProduk({ jenis: "tanpa-produk" }, akses());
    expect(p?.tingkat).toBe("penting");
    expect(p?.judul).toBe("Toko belum punya produk");
    expect(p?.tautan).toEqual([{ href: URL_BUAT_PRODUK, label: "Buat Produk" }]);
  });

  it("tidak ada yang dapat dijual: kartu angka tanpa nama produk, ke Lihat produk dan Pembelian Stok", () => {
    const p = pemberitahuanStokProduk({ jenis: "tak-terjual", jumlah: 10 }, akses());
    expect(p?.tingkat).toBe("penting");
    expect(p?.judul).toBe("Tidak ada produk yang dapat dijual");
    expect(p?.isi).toBe("10 produk stoknya habis.");
    expect(p?.tautan).toEqual([
      { href: URL_PRODUK, label: "Lihat produk" },
      { href: URL_CATAT_PEMBELIAN, label: "Pembelian Stok" },
    ]);
  });

  it("tautan hanya bagi pemegang izinnya; kartu tetap tampil tanpa tautan", () => {
    const p = pemberitahuanStokProduk({ jenis: "tanpa-produk" }, akses({ permissions: ["akses-pos"] }));
    expect(p?.judul).toBe("Toko belum punya produk");
    expect(p?.tautan).toEqual([]);
    const habis = pemberitahuanStokProduk({ jenis: "tak-terjual", jumlah: 4 }, akses({ permissions: ["read-produk", "read-kategori"] }));
    expect(habis?.tautan.map((t) => t.label)).toEqual(["Lihat produk"]);
  });

  it("tanpa pemicu: null", () => {
    expect(pemberitahuanStokProduk(null, akses())).toBeNull();
  });
});

describe("pemberitahuanProdukMinimum (LN1a tingkat sedang)", () => {
  it("perlu tindakan dengan jumlah dari ringkasan; tidak ada bila 0 atau belum termuat", () => {
    const p = pemberitahuanProdukMinimum(2, akses());
    expect(p?.tingkat).toBe("tindakan");
    expect(p?.isi).toBe("2 produk mencapai stok minimum.");
    expect(p?.tautan).toEqual([{ href: `${URL_PRODUK}?tab=stok-kritis`, label: "Lihat produk" }]);
    expect(pemberitahuanProdukMinimum(0, akses())).toBeNull();
    expect(pemberitahuanProdukMinimum(undefined, akses())).toBeNull();
  });
});
