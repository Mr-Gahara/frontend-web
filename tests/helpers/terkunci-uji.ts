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
 * yang dituntut halaman pembelian outlet: bahan baku, akun kas, dan lokasi.
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
    ] as string[]).includes(n),
};

type Mentah = { id?: string; _id?: string };
type PeranMentah = Mentah & { namaRole?: string; level?: number; permissions?: (Mentah & { nama?: string })[] };
type PenggunaMentah = Mentah & { nama?: string; roleID?: unknown };

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

async function pastikanPengguna(page: Page, auth: () => string, peranUji: PeranUji, idPeran: string) {
  const cari = async () => {
    const daftar = await api<PenggunaMentah[]>(page, auth, "GET", "/pengguna");
    expect(daftar.status, `GET /pengguna: ${daftar.pesan}`).toBe(200);
    return (daftar.data ?? []).find((p) => p.nama === peranUji.nama);
  };
  if (await cari()) return;
  const buat = await api(page, auth, "POST", "/pengguna/register-pengguna", {
    nama: peranUji.nama,
    pin: peranUji.pin,
    roleID: idPeran,
    aksesType: ["web"],
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
  await loginSebagai(page, peranUji.nama, peranUji.pin);
}

export const NAMA_TERKUNCI = PERAN_TERKUNCI.nama;

export const masukTanpaIzinLintas = (page: Page) => masukSebagai(page, PERAN_TERKUNCI);
export const masukBacaSaja = (page: Page) => masukSebagai(page, PERAN_BACA_SAJA);
export const masukPembelianOutlet = (page: Page) => masukSebagai(page, PERAN_PEMBELIAN_OUTLET);
