import type { ModelPerhitungan, Pajak, PajakBaru, PerubahanPajak, PrioritasPajak } from "@/types/pajak";
import type { NilaiPajak } from "./schema";

/** Nilai awal form buat, sama dengan halaman lama: per produk, Add-on, prioritas 1, aktif, dan tarif kosong. */
export const NILAI_AWAL_PAJAK: NilaiPajak = {
  namaPajak: "",
  tarifPajak: "",
  tipePajak: true,
  modelPerhitungan: "2",
  prioritas: "1",
  statusPajak: true,
};

/**
 * Nilai awal form ubah dari GET /pajak. Prioritas di luar 1 atau 2 menjadi
 * isian kosong agar dipilih ulang, karena backend hanya menerimanya
 * (VALID_PRIORITAS); per 1 Oktober 2026 data development hanya berisi 1 dan 2.
 */
export function nilaiAwalPajak(p: Pajak): NilaiPajak {
  return {
    namaPajak: p.namaPajak,
    tarifPajak: String(p.tarifPajak),
    tipePajak: p.tipePajak,
    modelPerhitungan: String(p.modelPerhitungan) as NilaiPajak["modelPerhitungan"],
    prioritas: p.prioritas === 1 || p.prioritas === 2 ? String(p.prioritas) : "",
    statusPajak: p.statusPajak,
  };
}

/** Isian yang sudah lolos skemaPajak menjadi field backend. */
function keFieldBackend(n: NilaiPajak): PajakBaru {
  return {
    namaPajak: n.namaPajak.trim(),
    tarifPajak: Number(n.tarifPajak.trim()),
    tipePajak: n.tipePajak,
    modelPerhitungan: Number(n.modelPerhitungan) as ModelPerhitungan,
    prioritas: Number(n.prioritas) as PrioritasPajak,
    statusPajak: n.statusPajak,
  };
}

/** Payload buat: keenam field form, dengan nama dipangkas dan tarif serta prioritas sebagai angka. */
export const payloadBuatPajak = (n: NilaiPajak): PajakBaru => keFieldBackend(n);

/**
 * Payload ubah: field yang berbeda dari data server (keputusan rancangan
 * butir 15), ditambah tipePajak yang selalu dikirim, karena
 * validatePajakPayload menolak "tipePajak wajib diisi" juga pada mode update
 * (backend 465b438). Nama yang hanya berbeda spasi di ujung tidak dikirim.
 */
export function payloadUbahPajak(n: NilaiPajak, asal: Pajak): PerubahanPajak {
  const baru = keFieldBackend(n);
  const payload: PerubahanPajak = { tipePajak: baru.tipePajak };
  if (baru.namaPajak !== asal.namaPajak) payload.namaPajak = baru.namaPajak;
  if (baru.tarifPajak !== asal.tarifPajak) payload.tarifPajak = baru.tarifPajak;
  if (baru.modelPerhitungan !== asal.modelPerhitungan) payload.modelPerhitungan = baru.modelPerhitungan;
  if (baru.prioritas !== asal.prioritas) payload.prioritas = baru.prioritas;
  if (baru.statusPajak !== asal.statusPajak) payload.statusPajak = baru.statusPajak;
  return payload;
}