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

/** Payload POST /diskon dari form web (enam field dasar). */
export interface BuatDiskonPayload {
  namaDiskon: string;
  cakupan: DiskonCakupan;
  tipe: DiskonTipe;
  nilai: number;
  bisaDigabung: boolean;
  status: DiskonStatus;
}

/** Payload PUT /diskon/:id: hanya field yang berubah. */
export type PerbaruiDiskonPayload = Partial<BuatDiskonPayload>;
