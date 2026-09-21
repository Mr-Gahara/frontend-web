import type { PengajuanStok } from "@/types/pengajuanStok";
import type { NilaiFormPengajuan } from "./schema";

export interface ItemIsian {
  bahanBakuID: string;
  jumlah: string;
  satuan: string;
}

export interface PayloadPengajuan {
  /** Gudang asal barang (arah.ts). */
  dariLocationID: string;
  /** Outlet peminta (arah.ts). */
  keLocationID: string;
  catatan: string;
  tanggalKebutuhan?: string;
  items: { bahanBakuID: string; jumlah: number; satuan: string }[];
}

export const BARIS_KOSONG: ItemIsian = { bahanBakuID: "", jumlah: "", satuan: "" };

/**
 * Baris yang ikut dikirim: barang terpilih dan jumlah lebih dari 0. Baris
 * lain diabaikan tanpa pesan, sama seperti halaman sebelum migrasi.
 */
export function itemValid(item: ItemIsian): boolean {
  return item.bahanBakuID !== "" && Number(item.jumlah) > 0;
}

export function susunPayloadPengajuan(nilai: NilaiFormPengajuan): PayloadPengajuan {
  return {
    dariLocationID: nilai.dariLocationID,
    keLocationID: nilai.keLocationID,
    catatan: nilai.catatan,
    tanggalKebutuhan: nilai.tanggalKebutuhan ? nilai.tanggalKebutuhan.toISOString() : undefined,
    items: nilai.items.filter(itemValid).map((item) => ({
      bahanBakuID: item.bahanBakuID,
      jumlah: Number(item.jumlah),
      satuan: item.satuan || "pcs",
    })),
  };
}

/** Nilai awal form: kosong untuk buat, dari dokumen untuk edit. */
export function nilaiAwalPengajuan(pengajuan?: PengajuanStok): NilaiFormPengajuan {
  if (!pengajuan) {
    return { keLocationID: "", dariLocationID: "", tanggalKebutuhan: undefined, catatan: "", items: [{ ...BARIS_KOSONG }] };
  }
  const items = pengajuan.items.map((item) => ({
    bahanBakuID: item.bahanBaku?.id ?? "",
    jumlah: String(item.jumlah),
    satuan: item.satuan ?? "",
  }));
  return {
    keLocationID: pengajuan.keLokasi?.id ?? "",
    dariLocationID: pengajuan.dariLokasi?.id ?? "",
    tanggalKebutuhan: pengajuan.tanggalKebutuhan ? new Date(pengajuan.tanggalKebutuhan) : undefined,
    catatan: pengajuan.catatan ?? "",
    items: items.length ? items : [{ ...BARIS_KOSONG }],
  };
}