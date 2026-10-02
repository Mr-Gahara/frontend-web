import { dariTanggalLokal, keTanggalLokal } from "@/lib/waktu";
import type { BuatDiskonPayload, Diskon, PerbaruiDiskonPayload } from "@/types/diskon";
import type { NilaiFormDiskon } from "./schema";

export const NILAI_AWAL_DISKON: NilaiFormDiskon = {
  namaDiskon: "",
  cakupan: "Global",
  tipe: "persen",
  nilai: "",
  bisaDigabung: false,
  status: "Aktif",
  tanggalMulai: "",
  tanggalBerakhir: "",
  jamMulai: "",
  jamSelesai: "",
  hariAktif: [],
  minimalBelanja: "",
  kuota: "",
  kuotaPerPelanggan: "",
  produkIDs: [],
  hitungPerBarang: false,
};

const teksTanggal = (iso: string | null) => (iso ? keTanggalLokal(new Date(iso)) : "");
const teksAngka = (angka: number | null) => (angka === null ? "" : String(angka));
const angkaAtauNull = (teks: string) => (teks === "" ? null : Number(teks));
const urutAngka = (daftar: number[]) => [...daftar].sort((a, b) => a - b);
const samaIsi = (a: (string | number)[], b: (string | number)[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** Awal (PD6a: 00.00) atau akhir (23.59.59) hari lokal sebagai ISO; null bila kosong. */
function isoHari(teks: string, akhir: boolean): string | null {
  const tanggal = dariTanggalLokal(teks);
  if (!tanggal) return null;
  const hasil = new Date(tanggal);
  if (akhir) hasil.setHours(23, 59, 59, 999);
  else hasil.setHours(0, 0, 0, 0);
  return hasil.toISOString();
}

/** Produk tertentu hanya berlaku untuk cakupan Item; backend menolaknya pada Global. */
const produkEfektif = (nilai: NilaiFormDiskon) =>
  nilai.cakupan === "Item" ? [...nilai.produkIDs].sort() : [];

/** Hitung per barang hanya untuk diskon Item bertipe nominal. */
const perBarangEfektif = (nilai: NilaiFormDiskon) =>
  nilai.cakupan === "Item" && nilai.tipe === "nominal" && nilai.hitungPerBarang;

/** Nilai awal form ubah dari data tersimpan. */
export function nilaiAwalDiskon(diskon: Diskon): NilaiFormDiskon {
  return {
    namaDiskon: diskon.namaDiskon,
    cakupan: diskon.cakupan,
    tipe: diskon.tipe,
    nilai: String(diskon.nilai),
    bisaDigabung: diskon.bisaDigabung,
    status: diskon.status,
    tanggalMulai: teksTanggal(diskon.tanggalMulai),
    tanggalBerakhir: teksTanggal(diskon.tanggalBerakhir),
    jamMulai: diskon.jamMulai ?? "",
    jamSelesai: diskon.jamSelesai ?? "",
    hariAktif: urutAngka(diskon.hariAktif),
    minimalBelanja: diskon.minimalBelanja > 0 ? String(diskon.minimalBelanja) : "",
    kuota: teksAngka(diskon.kuota),
    kuotaPerPelanggan: teksAngka(diskon.kuotaPerPelanggan),
    produkIDs: [...diskon.produkIDs],
    hitungPerBarang: diskon.hitungPerBarang,
  };
}

/**
 * Payload POST /diskon: keenam field dasar, ditambah hanya aturan yang
 * diisi (keputusan PD3a), sehingga diskon tanpa aturan tetap mengirim enam
 * field.
 */
export function payloadBuatDiskon(nilai: NilaiFormDiskon): BuatDiskonPayload {
  const payload: BuatDiskonPayload = {
    namaDiskon: nilai.namaDiskon,
    cakupan: nilai.cakupan,
    tipe: nilai.tipe,
    nilai: Number(nilai.nilai),
    bisaDigabung: nilai.bisaDigabung,
    status: nilai.status,
  };
  const mulai = isoHari(nilai.tanggalMulai, false);
  const berakhir = isoHari(nilai.tanggalBerakhir, true);
  if (mulai) payload.tanggalMulai = mulai;
  if (berakhir) payload.tanggalBerakhir = berakhir;
  if (nilai.jamMulai !== "" && nilai.jamSelesai !== "") {
    payload.jamMulai = nilai.jamMulai;
    payload.jamSelesai = nilai.jamSelesai;
  }
  if (nilai.hariAktif.length > 0) payload.hariAktif = urutAngka(nilai.hariAktif);
  if (nilai.minimalBelanja !== "" && Number(nilai.minimalBelanja) > 0) {
    payload.minimalBelanja = Number(nilai.minimalBelanja);
  }
  if (nilai.kuota !== "") payload.kuota = Number(nilai.kuota);
  if (nilai.kuotaPerPelanggan !== "") payload.kuotaPerPelanggan = Number(nilai.kuotaPerPelanggan);
  const produk = produkEfektif(nilai);
  if (produk.length > 0) payload.produkIDs = produk;
  if (perBarangEfektif(nilai)) payload.hitungPerBarang = true;
  return payload;
}

/**
 * Payload PUT /diskon/:id: hanya field yang berbeda dari data server
 * (keputusan rancangan butir 15). Backend memeriksa gabungan nilai baru
 * dengan nilai tersimpan, sehingga field yang tidak berubah tidak perlu
 * dikirim. Aturan yang dikosongkan dikirim sebagai null (tanggal, kuota,
 * jam), 0 (minimal belanja), atau array kosong (hari, produk). Jam selalu
 * dikirim berpasangan. Hasil kosong berarti tidak ada perubahan.
 */
export function payloadPerbaruiDiskon(
  nilai: NilaiFormDiskon,
  tersimpan: Diskon,
): PerbaruiDiskonPayload {
  const awal = nilaiAwalDiskon(tersimpan);
  const payload: PerbaruiDiskonPayload = {};

  if (nilai.namaDiskon !== tersimpan.namaDiskon) payload.namaDiskon = nilai.namaDiskon;
  if (nilai.cakupan !== tersimpan.cakupan) payload.cakupan = nilai.cakupan;
  if (nilai.tipe !== tersimpan.tipe) payload.tipe = nilai.tipe;
  if (Number(nilai.nilai) !== tersimpan.nilai) payload.nilai = Number(nilai.nilai);
  if (nilai.bisaDigabung !== tersimpan.bisaDigabung) payload.bisaDigabung = nilai.bisaDigabung;
  if (nilai.status !== tersimpan.status) payload.status = nilai.status;

  if (nilai.tanggalMulai !== awal.tanggalMulai) {
    payload.tanggalMulai = isoHari(nilai.tanggalMulai, false);
  }
  if (nilai.tanggalBerakhir !== awal.tanggalBerakhir) {
    payload.tanggalBerakhir = isoHari(nilai.tanggalBerakhir, true);
  }
  if (nilai.jamMulai !== awal.jamMulai || nilai.jamSelesai !== awal.jamSelesai) {
    const terisi = nilai.jamMulai !== "" && nilai.jamSelesai !== "";
    payload.jamMulai = terisi ? nilai.jamMulai : null;
    payload.jamSelesai = terisi ? nilai.jamSelesai : null;
  }
  const hari = urutAngka(nilai.hariAktif);
  if (!samaIsi(hari, awal.hariAktif)) payload.hariAktif = hari;

  const minimal = nilai.minimalBelanja === "" ? 0 : Number(nilai.minimalBelanja);
  if (minimal !== tersimpan.minimalBelanja) payload.minimalBelanja = minimal;
  if (angkaAtauNull(nilai.kuota) !== tersimpan.kuota) payload.kuota = angkaAtauNull(nilai.kuota);
  if (angkaAtauNull(nilai.kuotaPerPelanggan) !== tersimpan.kuotaPerPelanggan) {
    payload.kuotaPerPelanggan = angkaAtauNull(nilai.kuotaPerPelanggan);
  }

  const produk = produkEfektif(nilai);
  if (!samaIsi(produk, [...tersimpan.produkIDs].sort())) payload.produkIDs = produk;
  const perBarang = perBarangEfektif(nilai);
  if (perBarang !== tersimpan.hitungPerBarang) payload.hitungPerBarang = perBarang;

  return payload;
}
