export type StatusTransfer = "AKTIF" | "VOID";

/**
 * Asal jurnal (B386, R29, backend c4aae0d): "buka-kasir" bila dicatat sesi kasir
 * saat laci dikosongkan (tidak dapat di-VOID, B371), selain itu "manual".
 * Dihitung backend saat baca, sehingga jurnal lama ikut benar.
 */
export type AsalTransfer = "buka-kasir" | "manual";

/**
 * Akun kas di respons jurnal transfer (mappers/jurnalTransferMapper.js backend
 * yoga 50eede7). namaAkun berasal dari salinan saat transfer dicatat, sehingga
 * tidak ikut berubah bila akunnya diganti nama.
 */
export interface AkunTransfer {
  id: string | null;
  namaAkun: string | null;
  nomorAkun: string | null;
}

/** Satu transfer saldo antar akun kas (GET /jurnaltransfer), setelah dinormalkan. */
export interface JurnalTransfer {
  id: string;
  tenantID: string;
  tanggal: string;
  kasSumber: AkunTransfer | null;
  kasTujuan: AkunTransfer | null;
  jumlah: number;
  keterangan: string;
  status: StatusTransfer;
  catatan: string | null;
  asal: AsalTransfer;
  /** Sesi kasir yang mencatatnya saat buka; null untuk asal manual. */
  sesiKasirID: string | null;
  dicatatOleh: { id: string; nama: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Body POST /jurnaltransfer (FIELD_CREATE validator backend). tanggal tidak
 * dikirim: waktu transfer adalah waktu server (keputusan DN3a).
 */
export interface PayloadBuatTransfer {
  kasSumberID: string;
  kasTujuanID: string;
  jumlah: number;
  keterangan: string;
}

/** Body PUT /jurnaltransfer/:id untuk pembatalan; catatan adalah alasannya. */
export interface PayloadBatalTransfer {
  status: "VOID";
  catatan?: string;
}