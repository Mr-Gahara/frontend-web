import { expect, type Page } from "@playwright/test";
import { IZIN_LINTAS_OUTLET } from "../../lib/auth/permissions";
import { loginSebagai } from "./profil-uji";
import { api, BASIS, bukaDenganAuth } from "./transfer-uji";

/*
 * Pengguna uji jalur terkunci lintas outlet. Sejak IZIN_LINTAS_OUTLET terisi
 * (B142, `2eb668a`) Ridho memegang izin itu, sehingga skenario "tanpa izin
 * lintas outlet" butuh pengguna lain. Peran ujinya memegang seluruh izin
 * baca milik Owner ditambah IZIN_TULIS_TERKUNCI, tanpa izin lintas outlet,
 * agar halaman yang diuji tetap terbuka dan hanya cakupan outletnya yang
 * berbeda; backend membatasi permissions peran 120 item, sedangkan Owner
 * memegang lebih dari itu. Peran dan pengguna dibuat sekali
 * oleh Ridho lewat API (data milik modul role dan pengguna), dan izin peran
 * diselaraskan ulang setiap kali, karena izin Owner bertambah setiap seed
 * berubah. Level 90 di bawah Owner, karena backend menolak mengubah role
 * yang levelnya setara peminta (B186).
 */
export const NAMA_TERKUNCI = "E2E Tanpa Lintas Outlet";
const PIN_TERKUNCI = "864213";
const PERAN_TERKUNCI = "E2E Tanpa Lintas Outlet";
const LEVEL_TERKUNCI = 90;
/** Izin tulis yang dibutuhkan skenario terkunci: form buat pengajuan stok. */
const IZIN_TULIS_TERKUNCI = ["create-pengajuan-stok"];

type Mentah = { id?: string; _id?: string };
type PeranMentah = Mentah & { namaRole?: string; level?: number; permissions?: (Mentah & { nama?: string })[] };
type PenggunaMentah = Mentah & { nama?: string; roleID?: unknown };

const idMilik = (x: Mentah | undefined) => String(x?.id ?? x?._id ?? "");

async function pastikanPeran(page: Page, auth: () => string): Promise<string> {
  const daftar = await api<PeranMentah[]>(page, auth, "GET", "/role");
  expect(daftar.status, `GET /role: ${daftar.pesan}`).toBe(200);
  const peran = daftar.data ?? [];
  const owner = peran.find((r) => /^owner$/i.test(r.namaRole ?? ""));
  expect(owner, "role Owner tenant uji").toBeTruthy();
  const izin = (owner!.permissions ?? [])
    .filter((p) => p.nama !== IZIN_LINTAS_OUTLET)
    .filter((p) => (p.nama ?? "").startsWith("read-") || IZIN_TULIS_TERKUNCI.includes(p.nama ?? ""))
    .map(idMilik);
  expect(izin.length, "izin baca Owner tanpa lintas outlet").toBeGreaterThan(0);

  const ada = peran.find((r) => r.namaRole === PERAN_TERKUNCI);
  if (!ada) {
    const buat = await api<PeranMentah>(page, auth, "POST", "/role", {
      namaRole: PERAN_TERKUNCI,
      deskripsi: "Peran uji e2e: izin Owner tanpa izin lintas outlet",
      level: LEVEL_TERKUNCI,
      permissions: izin,
    });
    expect(buat.status, `buat peran uji terkunci: ${buat.pesan}`).toBeLessThan(300);
    return idMilik(buat.data);
  }
  const sekarang = new Set((ada.permissions ?? []).map(idMilik));
  if (sekarang.size !== izin.length || izin.some((id) => !sekarang.has(id))) {
    const ubah = await api(page, auth, "PUT", "/role/" + idMilik(ada), { permissions: izin });
    expect(ubah.status, `selaraskan izin peran uji terkunci: ${ubah.pesan}`).toBe(200);
  }
  return idMilik(ada);
}

async function pastikanPengguna(page: Page, auth: () => string, idPeran: string) {
  const cari = async () => {
    const daftar = await api<PenggunaMentah[]>(page, auth, "GET", "/pengguna");
    expect(daftar.status, `GET /pengguna: ${daftar.pesan}`).toBe(200);
    return (daftar.data ?? []).find((p) => p.nama === NAMA_TERKUNCI);
  };
  if (await cari()) return;
  const buat = await api(page, auth, "POST", "/pengguna/register-pengguna", {
    nama: NAMA_TERKUNCI,
    pin: PIN_TERKUNCI,
    roleID: idPeran,
    aksesType: ["web"],
  });
  expect(buat.status, `buat pengguna uji terkunci: ${buat.pesan}`).toBeLessThan(300);
  expect(await cari(), "pengguna uji terkunci terbaca setelah dibuat").toBeTruthy();
}

/**
 * Dari halaman yang sudah login sebagai Ridho: memastikan peran dan pengguna
 * uji terkunci, lalu login ulang sebagai pengguna itu di halaman yang sama.
 */
export async function masukTanpaIzinLintas(page: Page) {
  const auth = await bukaDenganAuth(page, BASIS + "/dashboard");
  const idPeran = await pastikanPeran(page, auth);
  await pastikanPengguna(page, auth, idPeran);
  await loginSebagai(page, NAMA_TERKUNCI, PIN_TERKUNCI);
}
