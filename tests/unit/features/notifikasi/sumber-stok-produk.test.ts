import { describe, expect, it } from "vitest";
import type { AksesTautan } from "@/features/notifikasi/akses";
import {
  URL_BUAT_PENGAJUAN,
  URL_BUAT_PRODUK,
  URL_CATAT_PEMBELIAN,
  URL_PRODUK,
  pemberitahuanProdukMinimum,
  pemberitahuanStokProduk,
  pemicuStokProduk,
} from "@/features/notifikasi/sumber-stok-produk";
import type { Produk } from "@/types/produk";

const produk = (id: string, ubah: Partial<Produk> = {}): Produk => ({
  id,
  namaProduk: `Produk ${id}`,
  hargaJual: 10_000,
  hargaDasar: 5_000,
  stok: 0,
  kategoriID: "k1",
  resep: [],
  pajakList: [],
  ...ubah,
});
const resep = [{ bahanBakuID: "b1", jumlah: 1, satuan: "gram" }];

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

describe("pemicuStokProduk (LN1a)", () => {
  it("toko tanpa produk", () => {
    expect(pemicuStokProduk([])).toEqual({ jenis: "tanpa-produk" });
  });

  it("tidak memicu bila ada satu produk yang dapat dijual: berstok, unlimited, atau beresep berstok terhitung", () => {
    expect(pemicuStokProduk([produk("a"), produk("b", { stok: 3 })])).toBeNull();
    expect(pemicuStokProduk([produk("a"), produk("u", { isUnlimitedStok: true })])).toBeNull();
    expect(pemicuStokProduk([produk("a"), produk("r", { resep, stok: 2 })])).toBeNull();
  });

  it("memicu bila setiap produk stoknya 0, dipisah berstok langsung dan beresep", () => {
    const hasil = pemicuStokProduk([produk("a"), produk("r", { resep })]);
    expect(hasil?.jenis).toBe("tak-terjual");
    if (hasil?.jenis !== "tak-terjual") return;
    expect(hasil.langsung.map((p) => p.id)).toEqual(["a"]);
    expect(hasil.beresep.map((p) => p.id)).toEqual(["r"]);
  });
});

describe("pemberitahuanStokProduk (LN2a, LN14a)", () => {
  it("tanpa produk: penting, ke Buat Produk", () => {
    const p = pemberitahuanStokProduk({ jenis: "tanpa-produk" }, akses());
    expect(p?.tingkat).toBe("penting");
    expect(p?.judul).toBe("Toko belum punya produk");
    expect(p?.tautan).toEqual([{ href: URL_BUAT_PRODUK, label: "Buat Produk" }]);
  });

  it("satu produk berstok langsung: Ubah Produk langsung ke halaman ubahnya", () => {
    const p = pemberitahuanStokProduk(pemicuStokProduk([produk("a")]), akses());
    expect(p?.judul).toBe("Tidak ada produk yang dapat dijual");
    expect(p?.isi).toContain("Produk a");
    expect(p?.tautan).toEqual([{ href: `${URL_PRODUK}/a/edit`, label: "Ubah Produk" }]);
  });

  it("lebih dari satu berstok langsung: ke daftar Produk, menyebut tiga nama dan sisanya", () => {
    const daftar = ["a", "b", "c", "d", "e"].map((id) => produk(id));
    const p = pemberitahuanStokProduk(pemicuStokProduk(daftar), akses());
    expect(p?.isi).toContain("5 produk berstok langsung");
    expect(p?.isi).toContain("Produk a, Produk b, Produk c, dan 2 lainnya");
    expect(p?.tautan).toEqual([{ href: URL_PRODUK, label: "Lihat produk" }]);
  });

  it("beresep: Pembelian Stok, dan Pengajuan ke Gudang hanya bila gudang aktif", () => {
    const pemicu = pemicuStokProduk([produk("r", { resep })]);
    expect(pemberitahuanStokProduk(pemicu, akses())?.tautan.map((t) => t.href)).toEqual([
      URL_CATAT_PEMBELIAN,
      URL_BUAT_PENGAJUAN,
    ]);
    const tanpaGudang = pemberitahuanStokProduk(pemicu, akses({ plan: "advanced", fiturSiap: {} }));
    expect(tanpaGudang?.tautan.map((t) => t.href)).toEqual([URL_CATAT_PEMBELIAN]);
    expect(tanpaGudang?.isi).not.toContain("Pengajuan ke Gudang");
    // Plan Pro yang setup gudangnya belum selesai: gudang belum aktif.
    const belumSetup = pemberitahuanStokProduk(pemicu, akses({ fiturSiap: { wms: false } }));
    expect(belumSetup?.tautan.map((t) => t.href)).toEqual([URL_CATAT_PEMBELIAN]);
  });

  it("tautan hanya bagi pemegang izinnya; kartu tetap tampil tanpa tautan", () => {
    const p = pemberitahuanStokProduk({ jenis: "tanpa-produk" }, akses({ permissions: ["akses-pos"] }));
    expect(p?.judul).toBe("Toko belum punya produk");
    expect(p?.tautan).toEqual([]);
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
