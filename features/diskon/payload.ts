import type { BuatDiskonPayload, Diskon, PerbaruiDiskonPayload } from "@/types/diskon";
import type { NilaiFormDiskon } from "./schema";

export const NILAI_AWAL_DISKON: NilaiFormDiskon = {
  namaDiskon: "",
  cakupan: "Global",
  tipe: "persen",
  nilai: "",
  bisaDigabung: false,
  status: "Aktif",
};

/** Nilai awal form ubah dari data tersimpan. */
export function nilaiAwalDiskon(diskon: Diskon): NilaiFormDiskon {
  return {
    namaDiskon: diskon.namaDiskon,
    cakupan: diskon.cakupan,
    tipe: diskon.tipe,
    nilai: String(diskon.nilai),
    bisaDigabung: diskon.bisaDigabung,
    status: diskon.status,
  };
}

/** Payload POST /diskon: keenam field dasar, dengan nilai sebagai angka. */
export function payloadBuatDiskon(nilai: NilaiFormDiskon): BuatDiskonPayload {
  return {
    namaDiskon: nilai.namaDiskon,
    cakupan: nilai.cakupan,
    tipe: nilai.tipe,
    nilai: Number(nilai.nilai),
    bisaDigabung: nilai.bisaDigabung,
    status: nilai.status,
  };
}

/**
 * Payload PUT /diskon/:id: hanya field yang berbeda dari data server
 * (keputusan rancangan butir 15). Backend memeriksa gabungan nilai baru
 * dengan nilai tersimpan, sehingga field yang tidak berubah tidak perlu
 * dikirim. Hasil kosong berarti tidak ada perubahan.
 */
export function payloadPerbaruiDiskon(
  nilai: NilaiFormDiskon,
  tersimpan: Diskon,
): PerbaruiDiskonPayload {
  const baru = payloadBuatDiskon(nilai);
  const payload: PerbaruiDiskonPayload = {};
  if (baru.namaDiskon !== tersimpan.namaDiskon) payload.namaDiskon = baru.namaDiskon;
  if (baru.cakupan !== tersimpan.cakupan) payload.cakupan = baru.cakupan;
  if (baru.tipe !== tersimpan.tipe) payload.tipe = baru.tipe;
  if (baru.nilai !== tersimpan.nilai) payload.nilai = baru.nilai;
  if (baru.bisaDigabung !== tersimpan.bisaDigabung) payload.bisaDigabung = baru.bisaDigabung;
  if (baru.status !== tersimpan.status) payload.status = baru.status;
  return payload;
}