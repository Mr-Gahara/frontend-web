import type { AkunRole, TenantEntry } from "./auth";
import type { AksiLangganan, KunciPlan } from "./langganan";

export type { AksiLangganan };

export type StatusAkun = "aktif" | "non-aktif";
export type AlasanNonAktif = "manual" | "kedaluwarsa";
export type DurasiLangganan = 1 | 3 | 6 | 12 | 24;

export interface LanggananAkun {
  /** null berarti masa akses tidak dibatasi (akun lama, atau akun admin). */
  aksesBerakhirPada: string | null;
  alasanNonAktif: AlasanNonAktif | null;
  dibekukanPada: string | null;
  masaTenggangHari: number | null;
}

/**
 * Item GET /akun/admin/all dan respons POST /akun/admin/users
 * (mappers/akunMapper.js backend dengan sertakanLangganan).
 */
export interface AkunAdmin {
  id: string;
  username: string | null;
  email: string;
  role: AkunRole;
  status: StatusAkun;
  /** Plan akun klien (B212); null untuk akun admin. */
  plan: KunciPlan | null;
  daftarTenant: TenantEntry[];
  createdAt: string;
  updatedAt: string;
  langganan: LanggananAkun;
}

/** Allowlist validateBuatAkunKlien: tanpa durasiBulan berarti masa percobaan. */
export interface BuatAkunKlienPayload {
  email: string;
  password: string;
  username?: string;
  durasiBulan?: DurasiLangganan;
  /** Tanpa plan berarti Basic; Advanced dan Pro wajib durasiBulan (B213). */
  plan?: KunciPlan;
}

/** Catatan GET /akun/admin/users/:id/langganan, setelah _id dinormalkan menjadi id. */
export interface RiwayatLangganan {
  id: string;
  akunID: string;
  aksi: AksiLangganan;
  durasiBulan: number | null;
  berakhirSebelum: string | null;
  berakhirSesudah: string | null;
  /** Plan sebelum dan sesudah catatan (B213); null pada catatan lama. */
  planSebelum: KunciPlan | null;
  planSesudah: KunciPlan | null;
  /** null berarti dilakukan sistem (job pembeku), bukan admin. */
  olehAkunID: string | null;
  /** Akun pelaku (B155); null untuk tindakan sistem dan akun pelaku yang sudah dihapus. */
  oleh: { id: string; username: string | null; email: string } | null;
  alasan: string | null;
  createdAt: string;
}

/** Satu halaman riwayat; cursorBerikutnya null berarti tidak ada lagi. */
export interface HalamanRiwayat {
  data: RiwayatLangganan[];
  cursorBerikutnya: string | null;
  /** Seluruh riwayat akun, tidak terpengaruh kursor (B155). */
  total: number;
}

export interface BekukanPayload {
  alasan?: string;
}

export interface AktifkanPayload {
  durasiBulan?: DurasiLangganan;
  alasan?: string;
}

export interface PerpanjangPayload {
  durasiBulan: DurasiLangganan;
  /** Naik atau turun plan sekaligus (B213); tidak dikirim bila plan tetap. */
  plan?: KunciPlan;
  alasan?: string;
}

/** PUT /akun/admin/users/:id/plan (B213): masa akses tidak berubah; plan yang sama 409. */
export interface UbahPlanPayload {
  plan: KunciPlan;
  alasan?: string;
}

/**
 * Field PUT /akun/admin/users/:id yang ditawarkan web (keputusan PA3a).
 * username null mengosongkan username; role dan tenantID tidak dikirim.
 */
export interface PerbaruiAkunPayload {
  username?: string | null;
  email?: string;
  password?: string;
}
