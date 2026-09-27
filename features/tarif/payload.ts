import type { NilaiFormTarif, NilaiMasukTarif } from "./schema";
import type { Tarif, TarifPayload } from "@/types/tarif";

/**
 * Payload buat dan ubah tarif. Field disebut satu per satu agar hanya isian
 * form yang terkirim. tipeAsetID dikirim apa adanya walau backend
 * menggabungkannya ke tipe aset lama saat ubah (kontrak/temuan.md butir 54).
 */
export function payloadTarif(nilai: NilaiFormTarif): TarifPayload {
  return {
    namaTarif: nilai.namaTarif.trim(),
    basisPerhitungan: nilai.basisPerhitungan,
    harga: nilai.harga,
    durasiMinimum: nilai.durasiMinimum,
    isActive: nilai.isActive,
    hariAktif: nilai.hariAktif,
    jamMulai: nilai.jamMulai,
    jamSelesai: nilai.jamSelesai,
    prioritas: nilai.prioritas,
    tipeAsetID: nilai.tipeAsetID,
  };
}

/** Nilai awal form edit dari data tarif, dengan bawaan yang sama seperti sebelum migrasi. */
export function nilaiAwalTarif(tarif: Tarif): NilaiMasukTarif {
  return {
    namaTarif: tarif.namaTarif || "",
    basisPerhitungan: tarif.basisPerhitungan || "per jam",
    harga: tarif.harga ?? 0,
    durasiMinimum: tarif.durasiMinimum ?? 1,
    isActive: tarif.isActive ?? true,
    hariAktif: tarif.hariAktif || [],
    jamMulai: tarif.jamMulai || "00:00",
    jamSelesai: tarif.jamSelesai || "23:59",
    prioritas: tarif.prioritas ?? 1,
    tipeAsetID: (tarif.dataAset ?? []).map((t) => String(t.id || "")).filter(Boolean),
  };
}