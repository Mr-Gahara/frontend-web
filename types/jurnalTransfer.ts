export type StatusTransfer = "AKTIF" | "VOID";

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