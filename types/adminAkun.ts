import type { AkunRole, TenantEntry } from "./auth";

export type StatusAkun = "aktif" | "non-aktif";
export type AlasanNonAktif = "manual" | "kedaluwarsa";
export type DurasiLangganan = 1 | 3 | 6 | 12;

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
}
export type AksiLangganan = "buat" | "perpanjang" | "freeze" | "unfreeze" | "kedaluwarsa";

/** Catatan GET /akun/admin/users/:id/langganan, setelah _id dinormalkan menjadi id. */
export interface RiwayatLangganan {
  id: string;
  akunID: string;
  aksi: AksiLangganan;
  durasiBulan: number | null;
  berakhirSebelum: string | null;
  berakhirSesudah: string | null;
  /** null berarti dilakukan sistem (job pembeku), bukan admin. */
  olehAkunID: string | null;
  alasan: string | null;
  createdAt: string;
}

/** Satu halaman riwayat; cursorBerikutnya null berarti tidak ada lagi. */
export interface HalamanRiwayat {
  data: RiwayatLangganan[];
  cursorBerikutnya: string | null;
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
