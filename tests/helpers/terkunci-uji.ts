import { expect, type Page } from "@playwright/test";
import { IZIN, IZIN_LINTAS_OUTLET } from "../../lib/auth/permissions";
import { loginSebagai } from "./profil-uji";
import { api, BASIS, bukaDenganAuth } from "./transfer-uji";

/*
 * Pengguna uji berperan terbatas, untuk jalur yang menuntut ketiadaan sebuah
 * izin; akun uji Ridho berperan Owner dan memegang seluruh izin. Setiap peran
 * uji menurunkan izinnya dari izin role Owner tenant uji lewat penyaring
 * nama, agar tetap mengikuti seed. Peran dan pengguna dibuat sekali oleh
 * Ridho lewat API (data milik modul role dan pengguna), dan izin peran
 * diselaraskan ulang setiap kali, karena izin Owner bertambah setiap seed
 * berubah. Backend membatasi permissions peran 120 item, sedangkan Owner
 * memegang lebih dari itu. Level 90 di bawah Owner, karena backend menolak
 * mengubah role yang levelnya setara peminta (B186).
 */

interface PeranUji {
  /** Nama peran sekaligus nama pengguna uji. */
  nama: string;
  pin: string;
  deskripsi: string;
  /** Penyaring nama izin dari daftar izin role Owner. */
  izin: (nama: string) => boolean;
  /** Tipe lokasi kerja pengguna uji (LK3a); tanpa ini tidak dibatasi. */
  lokasiKerja?: "Outlet" | "Gudang";
}

const LEVEL_UJI = 90;

/**
 * Jalur terkunci lintas outlet: seluruh izin baca Owner ditambah form buat
 * pengajuan stok, tanpa izin lintas outlet, agar halaman yang diuji tetap
 * terbuka dan hanya cakupan outletnya yang berbeda.
 */
const PERAN_TERKUNCI: PeranUji = {
  nama: "E2E Tanpa Lintas Outlet",
  pin: "864213",
  deskripsi: "Peran uji e2e: izin Owner tanpa izin lintas outlet",
  izin: (n) => n !== IZIN_LINTAS_OUTLET && (n.startsWith("read-") || n === "create-pengajuan-stok"),
};

/**
 * Pengguna baca-saja: seluruh izin baca Owner, tanpa izin tulis apa pun,
 * untuk tombol dan form tulis yang disembunyikan menurut izin (keputusan
 * pemilik proyek, 7 November 2026). Sengaja terpisah dari PERAN_TERKUNCI,
 * agar masing-masing tetap satu makna.
 */
const PERAN_BACA_SAJA: PeranUji = {
  nama: "E2E Baca Saja",
  pin: "864214",
  deskripsi: "Peran uji e2e: seluruh izin baca Owner tanpa izin tulis",
  izin: (n) => n.startsWith("read-"),
};

/**
 * Pemegang izin pembelian stok ruang outlet saja (B116, kontrak/temuan.md
 * butir 158), tanpa izin umum maupun ruang gudang. Izin baca lain hanya
 * yang dituntut halaman pembelian outlet (bahan baku, akun kas, dan lokasi)
 * serta penjaga layout kedua ruang (read-dashboard-outlet dan
 * read-dashboard-gudang), agar penolakan di ruang gudang datang dari gerbang
 * rute pembelian, bukan dari layout ruangnya (pemilik proyek, 7 November
 * 2026).
 */
const PERAN_PEMBELIAN_OUTLET: PeranUji = {
  nama: "E2E Pembelian Outlet",
  pin: "864215",
  deskripsi: "Peran uji e2e: izin pembelian stok ruang outlet saja",
  izin: (n) =>
    ([
      IZIN.pembelianStokOutlet,
      IZIN.buatPembelianStokOutlet,
      IZIN.ubahPembelianStokOutlet,
      IZIN.hapusPembelianStokOutlet,
      IZIN.bahan,
      IZIN.akunKas,
      IZIN.location,
      IZIN.dashboardOutlet,
      IZIN.dashboardGudang,
    ] as string[]).includes(n),
};

/**
 * Staf berlokasi kerja Gudang tanpa izin lintas outlet (LK3a; pemilik
 * proyek, 10 November 2026): seluruh izin baca Owner, sehingga ruang outlet
 * hanya tertutup karena lokasi kerjanya, bukan karena izin.
 */
const PERAN_LOKASI_GUDANG: PeranUji = {
  nama: "E2E Lokasi Gudang",
  pin: "864216",
  deskripsi: "Peran uji e2e: izin baca Owner, berlokasi kerja Gudang",
  izin: (n) => n !== IZIN_LINTAS_OUTLET && n.startsWith("read-"),
  lokasiKerja: "Gudang",
};

type Mentah = { id?: string; _id?: string };
/**
 * Pemegang update-akun yang bukan Owner (level 90): Akun Toko tetap tertolak,
 * karena bolehKelolaAkunToko menuntut level Owner (OA3a).
 */
const PERAN_AKUN_BUKAN_OWNER: PeranUji = {
  nama: "E2E Akun Bukan Owner",
  pin: "864217",
  deskripsi: "Peran uji e2e: izin baca Owner ditambah update-akun, bukan Owner",
  izin: (n) => n.startsWith("read-") || n === IZIN.ubahAkun,
};

/** Pencatat beban bukan Owner: tanggal beban terkunci hari ini (BO5a). */
const PERAN_PENCATAT_BEBAN: PeranUji = {
  nama: "E2E Pencatat Beban",
  pin: "864218",
  deskripsi: "Peran uji e2e: izin baca Owner ditambah catat beban, bukan Owner",
  izin: (n) => n.startsWith("read-") || n === IZIN.buatBebanOperasional,
};

/** Izin baca Owner tanpa read-location (K11b, b69d39a, PO lokasi). */
const PERAN_TANPA_LOKASI: PeranUji = {
  nama: "E2E Tanpa Lokasi",
  pin: "864219",
  deskripsi: "Peran uji e2e: izin baca Owner tanpa read-location",
  izin: (n) => n.startsWith("read-") && n !== IZIN.location,
};

/** Izin baca Owner tanpa izin baca shift, pola roster, dan jadwal (B139, B140). */
const PERAN_TANPA_SDM: PeranUji = {
  nama: "E2E Tanpa SDM",
  pin: "864220",
  deskripsi: "Peran uji e2e: izin baca Owner tanpa shift, pola roster, dan jadwal",
  izin: (n) => n.startsWith("read-") && !([IZIN.shift, IZIN.polaRoster, IZIN.jadwalShift] as string[]).includes(n),
};

type PeranMentah = Mentah & { namaRole?: string; level?: number; permissions?: (Mentah & { nama?: string })[] };
type PenggunaMentah = Mentah & { nama?: string; roleID?: unknown; locationID?: string | null };
type LokasiMentah = Mentah & { tipe?: string };

const idMilik = (x: Mentah | undefined) => String(x?.id ?? x?._id ?? "");

async function pastikanPeran(page: Page, auth: () => string, peranUji: PeranUji): Promise<string> {
  const daftar = await api<PeranMentah[]>(page, auth, "GET", "/role");
  expect(daftar.status, `GET /role: ${daftar.pesan}`).toBe(200);
  const peran = daftar.data ?? [];
  const owner = peran.find((r) => /^owner$/i.test(r.namaRole ?? ""));
  expect(owner, "role Owner tenant uji").toBeTruthy();
  const izin = (owner!.permissions ?? []).filter((p) => peranUji.izin(p.nama ?? "")).map(idMilik);
  expect(izin.length, `izin peran uji ${peranUji.nama}`).toBeGreaterThan(0);

  const ada = peran.find((r) => r.namaRole === peranUji.nama);
  if (!ada) {
    const buat = await api<PeranMentah>(page, auth, "POST", "/role", {
      namaRole: peranUji.nama,
      deskripsi: peranUji.deskripsi,
      level: LEVEL_UJI,
      permissions: izin,
    });
    expect(buat.status, `buat peran uji ${peranUji.nama}: ${buat.pesan}`).toBeLessThan(300);
    return idMilik(buat.data);
  }
  const sekarang = new Set((ada.permissions ?? []).map(idMilik));
  if (sekarang.size !== izin.length || izin.some((id) => !sekarang.has(id))) {
    const ubah = await api(page, auth, "PUT", "/role/" + idMilik(ada), { permissions: izin });
    expect(ubah.status, `selaraskan izin peran uji ${peranUji.nama}: ${ubah.pesan}`).toBe(200);
  }
  return idMilik(ada);
}

/** Id lokasi pertama bertipe itu di tenant uji, untuk lokasi kerja pengguna uji. */
async function idLokasiBertipe(page: Page, auth: () => string, tipe: string): Promise<string> {
  const daftar = await api<LokasiMentah[]>(page, auth, "GET", "/location");
  expect(daftar.status, `GET /location: ${daftar.pesan}`).toBe(200);
  const lokasi = (daftar.data ?? []).find((l) => l.tipe === tipe);
  expect(lokasi, `lokasi ${tipe} tenant uji`).toBeTruthy();
  return idMilik(lokasi);
}

async function pastikanPengguna(page: Page, auth: () => string, peranUji: PeranUji, idPeran: string) {
  const cari = async () => {
    const daftar = await api<PenggunaMentah[]>(page, auth, "GET", "/pengguna");
    expect(daftar.status, `GET /pengguna: ${daftar.pesan}`).toBe(200);
    return (daftar.data ?? []).find((p) => p.nama === peranUji.nama);
  };
  const lokasiKerja = peranUji.lokasiKerja ? await idLokasiBertipe(page, auth, peranUji.lokasiKerja) : undefined;
  const ada = await cari();
  if (ada) {
    // Lokasi kerja diselaraskan ulang, seperti izin peran.
    if (lokasiKerja && ada.locationID !== lokasiKerja) {
      const ubah = await api(page, auth, "PUT", "/pengguna/" + idMilik(ada), { locationID: lokasiKerja });
      expect(ubah.status, `selaraskan lokasi kerja ${peranUji.nama}: ${ubah.pesan}`).toBe(200);
    }
    return;
  }
  const buat = await api(page, auth, "POST", "/pengguna/register-pengguna", {
    nama: peranUji.nama,
    pin: peranUji.pin,
    roleID: idPeran,
    aksesType: ["web"],
    ...(lokasiKerja ? { locationID: lokasiKerja } : {}),
  });
  expect(buat.status, `buat pengguna uji ${peranUji.nama}: ${buat.pesan}`).toBeLessThan(300);
  expect(await cari(), `pengguna uji ${peranUji.nama} terbaca setelah dibuat`).toBeTruthy();
}

/**
 * Dari halaman yang sudah login sebagai Ridho: memastikan peran dan pengguna
 * uji, lalu login ulang sebagai pengguna itu di halaman yang sama.
 */
async function masukSebagai(page: Page, peranUji: PeranUji) {
  const auth = await bukaDenganAuth(page, BASIS + "/dashboard");
  const idPeran = await pastikanPeran(page, auth, peranUji);
  await pastikanPengguna(page, auth, peranUji, idPeran);
  // Cookie sesi Ridho dibuang dulu: tanpa itu /login memulihkan sesi Ridho
  // (refreshtoken lalu pin-refresh) bersamaan dengan login akun di bawah, dan
  // bila pin-refresh selesai belakangan, login pengguna mengalihkan ke
  // dashboard sebagai Ridho sehingga isian PIN terlepas dari DOM (suite
  // 12 November 2026, daftar-penjualan RG4a). localStorage tetap, karena
  // penanda tur dari storageState ada di sana.
  await page.goto("about:blank");
  await page.context().clearCookies();
  await loginSebagai(page, peranUji.nama, peranUji.pin);
  // /dashboard mengalihkan sendiri menurut izin (app/dashboard/page.tsx); tanpa
  // menunggu, pengalihan ke /dashboard/profil dapat menyalip goto spec berikutnya.
  await page.waitForURL((u) => u.pathname !== "/dashboard");
}

export const NAMA_TERKUNCI = PERAN_TERKUNCI.nama;
export const NAMA_BACA_SAJA = PERAN_BACA_SAJA.nama;

export const masukTanpaIzinLintas = (page: Page) => masukSebagai(page, PERAN_TERKUNCI);
export const masukBacaSaja = (page: Page) => masukSebagai(page, PERAN_BACA_SAJA);
export const masukPembelianOutlet = (page: Page) => masukSebagai(page, PERAN_PEMBELIAN_OUTLET);
export const masukLokasiGudang = (page: Page) => masukSebagai(page, PERAN_LOKASI_GUDANG);
export const masukAkunBukanOwner = (page: Page) => masukSebagai(page, PERAN_AKUN_BUKAN_OWNER);
export const masukPencatatBeban = (page: Page) => masukSebagai(page, PERAN_PENCATAT_BEBAN);
export const masukTanpaLokasi = (page: Page) => masukSebagai(page, PERAN_TANPA_LOKASI);
export const masukTanpaSdm = (page: Page) => masukSebagai(page, PERAN_TANPA_SDM);
