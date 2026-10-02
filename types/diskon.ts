export type DiskonCakupan = "Global" | "Item";
export type DiskonTipe = "persen" | "nominal";
export type DiskonStatus = "Aktif" | "Non-Aktif";

/**
 * Bentuk respons GET /diskon setelah dinormalkan lib/api/client.ts
 * (kontrak/endpoint.md bagian 3.3).
 */
export interface Diskon {
  id: string;
  namaDiskon: string;
  cakupan: DiskonCakupan;
  tipe: DiskonTipe;
  nilai: number;
  bisaDigabung: boolean;
  status: DiskonStatus;
  /** Produk yang terkena diskon Item; kosong berarti seluruh produk. */
  produkIDs: string[];
  tanggalMulai: string | null;
  tanggalBerakhir: string | null;
  hitungPerBarang: boolean;
  minimalBelanja: number;
  kuota: number | null;
  terpakai: number;
  /** Dihitung backend dari kuota dan terpakai; null bila tanpa kuota. */
  sisaKuota: number | null;
  khususMember: boolean;
  kuotaPerPelanggan: number | null;
  /** Jam berlaku "HH:mm" berpasangan; keduanya null berarti sepanjang hari. */
  jamMulai: string | null;
  jamSelesai: string | null;
  /** Hari berlaku, 0 (Minggu) sampai 6 (Sabtu); kosong berarti setiap hari. */
  hariAktif: number[];
  /** Dihitung backend saat respons dibuat: status, masa, jam, hari, dan kuota. */
  sedangBerlaku: boolean;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Field aturan diskon yang dikelola form web (keputusan PD3a). khususMember
 * tidak termasuk (PD8a). Saat membuat, hanya aturan yang diisi yang dikirim.
 * null menghapus batasnya di backend.
 */
export interface AturanDiskonPayload {
  produkIDs?: string[];
  tanggalMulai?: string | null;
  tanggalBerakhir?: string | null;
  hitungPerBarang?: boolean;
  minimalBelanja?: number;
  kuota?: number | null;
  kuotaPerPelanggan?: number | null;
  jamMulai?: string | null;
  jamSelesai?: string | null;
  hariAktif?: number[];
}

/** Payload POST /diskon dari form web: enam field dasar dan aturan yang diisi. */
export interface BuatDiskonPayload extends AturanDiskonPayload {
  namaDiskon: string;
  cakupan: DiskonCakupan;
  tipe: DiskonTipe;
  nilai: number;
  bisaDigabung: boolean;
  status: DiskonStatus;
}

/** Payload PUT /diskon/:id: hanya field yang berubah. */
export type PerbaruiDiskonPayload = Partial<BuatDiskonPayload>;
