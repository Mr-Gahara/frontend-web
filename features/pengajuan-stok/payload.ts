import type { PengajuanStok } from "@/types/pengajuanStok";
import { arahLokasi, type ArahPengajuan } from "./arah";
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

/** Lokasi per sisi form, terlepas dari arah: form selalu menampilkan outlet di atas dan gudang di bawah. */
export interface SisiPengajuan {
  outletID: string;
  gudangID: string;
}

/** Asal dan tujuan yang dikirim ke backend menurut arah (P8): asal barang di dariLocationID. */
export function lokasiMenurutArah(
  arah: ArahPengajuan,
  sisi: SisiPengajuan,
): Pick<PayloadPengajuan, "dariLocationID" | "keLocationID"> {
  return arah === "GUDANG_KE_OUTLET"
    ? { dariLocationID: sisi.gudangID, keLocationID: sisi.outletID }
    : { dariLocationID: sisi.outletID, keLocationID: sisi.gudangID };
}

/** Kebalikan lokasiMenurutArah: arah dan sisi sebuah dokumen; null bila arahnya tidak sah. */
export function sisiMenurutDokumen(
  p: Pick<PengajuanStok, "dariLokasi" | "keLokasi">,
): ({ arah: ArahPengajuan } & SisiPengajuan) | null {
  const arah = arahLokasi(p.dariLokasi, p.keLokasi);
  if (!arah) return null;
  const dari = p.dariLokasi?.id ?? "";
  const ke = p.keLokasi?.id ?? "";
  return arah === "GUDANG_KE_OUTLET"
    ? { arah, outletID: ke, gudangID: dari }
    : { arah, outletID: dari, gudangID: ke };
}