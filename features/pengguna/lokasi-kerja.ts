import type { Lokasi } from "@/types/location";
import type { Role } from "@/types/role";

/*
 * Lokasi kerja pengguna (backend P46 dan P61, B269; pemilik proyek,
 * 8 November 2026). null berarti tidak dibatasi. Staf non-owner tanpa
 * akses-lintas-outlet yang lokasinya terisi hanya dapat mengelola stok,
 * opname, jurnal, pengajuan, dan surat jalan lokasi itu (B270 sampai
 * B274). Owner tidak pernah dibatasi, sehingga isiannya tidak ditampilkan
 * untuk pengguna berperan Owner.
 */

/** Nilai Select untuk "Tidak dibatasi"; Select tidak menerima nilai kosong. */
export const TANPA_LOKASI_KERJA = "tanpa-lokasi-kerja";

/** Level role Owner (backend OWNER_LEVEL); sama dengan useLevelPenggunaAktif. */
const LEVEL_OWNER = 100;

/** Pilihan lokasi kerja: Outlet lalu Gudang, masing-masing menurut nama. */
export function pilihanLokasiKerja(lokasi: readonly Lokasi[]): Lokasi[] {
  const urutan = { Outlet: 0, Gudang: 1 } as const;
  return lokasi
    .filter((l) => l.tipe === "Outlet" || l.tipe === "Gudang")
    .sort((a, b) => urutan[a.tipe] - urutan[b.tipe] || a.nama.localeCompare(b.nama, "id"));
}

/** Role terpilih adalah Owner, yang tidak dibatasi lokasi kerja. */
export function roleOwner(roleList: readonly Role[], roleID: string): boolean {
  const role = roleList.find((r) => r.id === roleID);
  return (role?.level ?? 0) >= LEVEL_OWNER;
}

/**
 * Isian lokasi kerja ditampilkan bila pengelola memegang read-location
 * (pilihannya dibaca dari GET /location) dan pengguna yang diisi bukan
 * Owner. Tanpa read-location isiannya disembunyikan dan tidak dikirim, agar
 * lokasi kerja tersimpan tidak berubah (pemilik proyek, 8 November 2026).
 */
export function tampilkanLokasiKerja(bolehBacaLokasi: boolean, owner: boolean): boolean {
  return bolehBacaLokasi && !owner;
}

/**
 * locationID yang dikirim, atau undefined bila tidak perlu dikirim: sama
 * dengan nilai tersimpan (keputusan rancangan butir 15), termasuk pengguna
 * baru tanpa lokasi kerja, karena bawaan backend null.
 */
export function lokasiKerjaDikirim(pilihan: string | null, tersimpan: string | null): string | null | undefined {
  return pilihan === tersimpan ? undefined : pilihan;
}

/*
 * Ruang mengikuti lokasi kerja (LK3a; pemilik proyek, 10 November 2026).
 * Staf berlokasi kerja tanpa akses-lintas-outlet hanya membuka ruang
 * lokasinya; ruang lain ditolak seluruhnya, termasuk halaman tingkat toko.
 * Tipe lokasi dibaca dari GET /location (read-location), karena detail
 * pengguna hanya mengirim id-nya. Bila tipe tidak dapat dibaca, ruang tidak
 * dibatasi dan pesan 403 backend tetap tampil seperti sebelumnya
 * (kontrak/temuan.md butir 182).
 */

export type RuangKerja = "outlet" | "gudang";

const RUANG_DARI_TIPE: Record<Lokasi["tipe"], RuangKerja> = { Outlet: "outlet", Gudang: "gudang" };

/** Ruang satu-satunya bagi pengguna, atau null bila tidak dibatasi. */
export function ruangLokasiKerja(
  lokasiKerjaId: string | null | undefined,
  lintasOutlet: boolean,
  lokasi: readonly Lokasi[] | undefined,
): RuangKerja | null {
  if (lintasOutlet || !lokasiKerjaId) return null;
  const tipe = lokasi?.find((l) => l.id === lokasiKerjaId)?.tipe;
  return tipe ? RUANG_DARI_TIPE[tipe] : null;
}

/** Ruang sebuah path dashboard, atau null untuk path di luar kedua ruang (misalnya profil). */
export function ruangDariPath(pathname: string): RuangKerja | null {
  if (/^\/dashboard\/outlet(\/|$)/.test(pathname)) return "outlet";
  if (/^\/dashboard\/gudang(\/|$)/.test(pathname)) return "gudang";
  return null;
}

/** True bila path berada di ruang lain dari ruang lokasi kerja pengguna. */
export function ruangDitolak(pathname: string, ruang: RuangKerja | null): boolean {
  const ruangPath = ruangDariPath(pathname);
  return ruang !== null && ruangPath !== null && ruangPath !== ruang;
}
