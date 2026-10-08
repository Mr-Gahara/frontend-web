export type ModelPerhitungan = 1 | 2 | 3;

/**
 * Bentuk respons GET /pajak setelah dinormalkan lib/api/client.ts. Backend
 * mengirim _id mentah tanpa mapper; normalisasi mengubahnya menjadi id.
 */
export interface Pajak {
  id: string;
  namaPajak: string;
  tarifPajak: number;
  /** true = per produk, false = per transaksi */
  tipePajak: boolean;
  /** 1 = inclusive, 2 = exclusive, 3 = compound */
  modelPerhitungan: ModelPerhitungan;
  prioritas: number;
  statusPajak: boolean;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}

/** Prioritas yang diterima validator backend (VALID_PRIORITAS, pajakValidator.js). */
export type PrioritasPajak = 1 | 2;

/** Payload POST /pajak dari form pengaturan pajak. */
export interface PajakBaru {
  namaPajak: string;
  tarifPajak: number;
  tipePajak: boolean;
  modelPerhitungan: ModelPerhitungan;
  prioritas: PrioritasPajak;
  statusPajak: boolean;
}

/**
 * Payload PUT /pajak/:id: field yang berubah saja (keputusan rancangan butir
 * 15), ditambah tipePajak yang selalu dikirim, karena validatePajakPayload
 * menolak "tipePajak wajib diisi" juga pada mode update (backend 465b438).
 */
export type PerubahanPajak = Partial<PajakBaru>;

export interface ProdukPajakRequest {
  produkID: string;
  pajakID: string;
}

/**
 * Bentuk respons GET /produkpajak/:targetID setelah dinormalkan
 * (produkPajakService.getPajakByTarget, backend 465b438). Nama field pajak
 * berbeda dari GET /pajak, model berupa teks, dan statusPajak tidak dikirim
 * karena relasi ke pajak nonaktif sudah disaring backend.
 */
export interface RelasiPajakProduk {
  id: string;
  produkID?: string;
  assetID?: string;
  pajak: {
    id: string;
    nama: string;
    tarif: number;
    tipe: boolean;
    prioritas: number;
    model: "Inclusive" | "Exclusive" | "Compound";
  };
}
