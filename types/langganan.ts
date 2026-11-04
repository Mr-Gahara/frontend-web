/** Plan akun toko (B212); akun lama dibaca basic. */
export type KunciPlan = "basic" | "advanced" | "pro";

/** Aksi riwayat langganan (AKSI_LANGGANAN backend, termasuk ubah-plan dari B213). */
export type AksiLangganan = "buat" | "perpanjang" | "freeze" | "unfreeze" | "kedaluwarsa" | "ubah-plan";

/** GET /akun/langganan (B229). aksesBerakhirPada null berarti tidak dibatasi. */
export interface LanggananToko {
  plan: KunciPlan;
  status: "aktif" | "non-aktif";
  aksesBerakhirPada: string | null;
  masaTenggangHari: number | null;
}

/** Item GET /akun/langganan/riwayat: tanpa identitas admin dan alasan (B229). */
export interface RiwayatLanggananToko {
  id: string;
  aksi: AksiLangganan;
  durasiBulan: number | null;
  berakhirSebelum: string | null;
  berakhirSesudah: string | null;
  planSebelum: KunciPlan | null;
  planSesudah: KunciPlan | null;
  createdAt: string;
}

export interface HalamanRiwayatToko {
  data: RiwayatLanggananToko[];
  cursorBerikutnya: string | null;
  total: number;
}
