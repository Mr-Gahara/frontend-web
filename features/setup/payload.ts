import type { NilaiFormLokasi } from "@/features/inventaris/schema-lokasi";
import type { BahanBaku, BahanBakuRequest } from "@/types/bahanBaku";
import type { Kategori, KategoriRequest } from "@/types/kategori";
import type { Produk, ProdukRequest } from "@/types/produk";
import type { TarifPayload } from "@/types/tarif";
import { formatRupiah } from "@/lib/format";
import type { NilaiBahanSetup, NilaiBookingSetup, NilaiProdukSetup } from "./schema";

/**
 * Payload langkah wizard dari isian teks yang sudah lolos skema setup
 * (features/setup/schema.ts). Isian angka berbentuk teks diubah di sini.
 */

const angka = (teks: string) => Number(teks.trim());

export function payloadKategoriSetup(n: { namaKategori: string; kodeKategori: string }): KategoriRequest {
  return { namaKategori: n.namaKategori.trim(), kodeKategori: n.kodeKategori.trim() };
}

/** Tanpa locationID: backend memakai Outlet toko untuk stok awal. */
export function payloadBahanSetup(n: NilaiBahanSetup): BahanBakuRequest {
  return {
    namaBahan: n.namaBahan.trim(),
    satuan: n.satuan,
    stok: angka(n.stok),
    stokMinimum: angka(n.stokMinimum),
  };
}

/**
 * Produk beresep stoknya dihitung dari bahan baku, sehingga stok dan stok
 * minimal hanya dikirim untuk produk berstok langsung (B237, B238). Produk
 * tanpa stok dan tanpa resep menjadi Stok Tak Terbatas.
 */
export function payloadProdukSetup(n: NilaiProdukSetup): ProdukRequest {
  const dasar = {
    namaProduk: n.namaProduk.trim(),
    kategoriID: n.kategoriID,
    hargaDasar: angka(n.hargaDasar),
    hargaJual: angka(n.hargaJual),
  };
  if (n.pakaiResep) {
    return {
      ...dasar,
      isUnlimitedStok: false,
      stok: 0,
      resep: n.resep.map((r) => ({ bahanBakuID: r.bahan, jumlah: angka(r.jumlah), satuan: r.satuan })),
    };
  }
  if (n.pakaiStok) {
    return { ...dasar, isUnlimitedStok: false, stok: angka(n.stok), stokMinimum: angka(n.stokMinimal) };
  }
  return { ...dasar, isUnlimitedStok: true, stok: 0 };
}

/** Tarif pertama untuk tipe aset setup: bawaan form tarif (setiap hari, 00.00 sampai 23.59, aktif). */
export function payloadTarifSetup(n: NilaiBookingSetup, tipeAsetID: string): TarifPayload {
  return {
    namaTarif: n.namaTarif.trim(),
    basisPerhitungan: n.basisPerhitungan,
    harga: angka(n.harga),
    durasiMinimum: angka(n.durasiMinimum),
    isActive: true,
    hariAktif: [0, 1, 2, 3, 4, 5, 6],
    jamMulai: "00:00",
    jamSelesai: "23:59",
    prioritas: 1,
    tipeAsetID: [tipeAsetID],
  };
}

/** Lokasi yang tampil di ringkasan langkah tersimpan. */
export function teksLokasi(nilai: Pick<NilaiFormLokasi, "nama"> | { nama: string }): string {
  return `${nilai.nama}, titik absen terpasang`;
}

export const butirKategori = (k: Kategori) => ({ id: k.id, label: k.namaKategori, keterangan: "Kode " + k.kodeKategori });

export const butirBahan = (b: BahanBaku) => ({ id: b.id, label: b.namaBahan, keterangan: "Satuan " + b.satuan });

/** Ringkasan satu produk tersimpan: kategori, harga jual, resep, dan stok. */
export function butirProduk(p: Produk, kategori: readonly Kategori[]) {
  const namaKategori = kategori.find((k) => k.id === p.kategoriID)?.namaKategori;
  const resep = p.resep.length > 0 ? "pakai resep" : "tanpa resep";
  const stok =
    p.resep.length > 0 ? "stok dari bahan baku" : p.isUnlimitedStok ? "stok tidak terbatas" : `stok ${p.stok}`;
  return {
    id: p.id,
    label: p.namaProduk,
    keterangan: [namaKategori, formatRupiah(p.hargaJual), resep, stok].filter(Boolean).join(", "),
  };
}
