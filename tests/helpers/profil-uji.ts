import { expect, request, type Browser, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login, type Auth } from "./transfer-uji";

/*
 * Pengguna uji halaman profil (keputusan PF5a). Nama dan PIN diubah
 * sungguhan lewat UI, sehingga tidak boleh memakai Ridho: login seluruh
 * suite bergantung pada nama dan PIN-nya. Pengguna ini dibuat sekali oleh
 * Ridho lewat API (data milik modul pengguna), dengan peran tanpa
 * read-pengguna dan update-pengguna, agar jalur "diri sendiri" di backend
 * (checkPermissionOrSelf) ikut terbukti dari web. Setiap test diawali
 * pemulihan nama, PIN, dan nomor HP oleh Ridho, sehingga run yang berhenti
 * di tengah tidak mengunci run berikutnya.
 */
export const NAMA_PROFIL = "E2E Profil";
export const NAMA_PROFIL_UBAH = "E2E Profil Ubah";
export const PIN_PROFIL = "246813";
export const PIN_PROFIL_BARU = "975310";
export const HP_PROFIL = "081377700001";
export const HP_PROFIL_UBAH = "081377700002";
export const URL_PROFIL = BASIS + "/dashboard/profil";
export const POLA_PENGGUNA = /\/api\/pengguna\/[0-9a-f]{24}$/i;

export type PenggunaMentah = {
  id?: string;
  _id?: string;
  nama?: string;
  nomorHp?: string | null;
  status?: string;
  aksesType?: string[];
};
type PeranMentah = { id?: string; _id?: string; namaRole?: string; permissions?: unknown[] };

const idMilik = (x: { id?: string; _id?: string } | undefined) => String(x?.id ?? x?._id ?? "");
const namaIzin = (x: unknown) => (typeof x === "string" ? x : (x as { nama?: string } | null)?.nama);

async function cariPenggunaProfil(page: Page, auth: Auth) {
  const daftar = await api<PenggunaMentah[]>(page, auth, "GET", "/pengguna");
  expect(daftar.status, `GET /pengguna: ${daftar.pesan}`).toBe(200);
  return (daftar.data ?? []).find((p) => (p.nama ?? "").startsWith(NAMA_PROFIL));
}

/** Mengembalikan nama, PIN, dan nomor HP pengguna uji lewat Ridho (Owner). */
export async function pulihkanPenggunaProfil(page: Page, auth: Auth, id: string) {
  return api<PenggunaMentah>(page, auth, "PUT", "/pengguna/" + id, {
    nama: NAMA_PROFIL,
    pin: PIN_PROFIL,
    nomorHp: HP_PROFIL,
  });
}

/**
 * Login sebagai Ridho di `page`, lalu memastikan pengguna uji ada dan
 * berada di keadaan awal. Mengembalikan pembaca token Ridho dan id
 * pengguna uji, untuk membaca bukti lewat API.
 */
export async function siapkanPenggunaProfil(page: Page): Promise<{ auth: Auth; id: string }> {
  await login(page);
  const auth = await bukaDenganAuth(page, BASIS + "/dashboard");
  const ada = await cariPenggunaProfil(page, auth);
  if (ada) {
    const id = idMilik(ada);
    const pulih = await pulihkanPenggunaProfil(page, auth, id);
    expect(pulih.status, `pulihkan pengguna uji profil: ${pulih.pesan}`).toBe(200);
    return { auth, id };
  }
  const peran = await api<PeranMentah[]>(page, auth, "GET", "/role");
  expect(peran.status, `GET /role: ${peran.pesan}`).toBe(200);
  const cocok = (peran.data ?? []).find((r) => {
    if (/owner/i.test(r.namaRole ?? "")) return false;
    const izin = (r.permissions ?? []).map(namaIzin);
    return !izin.includes("read-pengguna") && !izin.includes("update-pengguna");
  });
  expect(
    cocok,
    "perlu peran selain Owner tanpa read-pengguna dan update-pengguna untuk pengguna uji profil",
  ).toBeTruthy();
  const buat = await api(page, auth, "POST", "/pengguna/register-pengguna", {
    nama: NAMA_PROFIL,
    pin: PIN_PROFIL,
    roleID: idMilik(cocok),
    aksesType: ["web"],
    nomorHp: HP_PROFIL,
  });
  expect(buat.status, `buat pengguna uji profil: ${buat.pesan}`).toBeLessThan(300);
  const baru = await cariPenggunaProfil(page, auth);
  expect(baru, "pengguna uji profil terbaca setelah dibuat").toBeTruthy();
  return { auth, id: idMilik(baru) };
}

export async function bacaPenggunaProfil(page: Page, auth: Auth, id: string) {
  const res = await api<PenggunaMentah>(page, auth, "GET", "/pengguna/" + id);
  expect(res.status, `GET /pengguna/:id: ${res.pesan}`).toBe(200);
  return res.data;
}

/** Login akun lalu login PIN lewat UI, dengan nama dan PIN yang diberikan. */
export async function loginSebagai(page: Page, nama: string, pin: string) {
  await page.goto(BASIS + "/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill(nama);
  await page.getByLabel(/pin/i).fill(pin);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");
}

/**
 * Membuka halaman profil sebagai pengguna uji di konteks browser terpisah,
 * agar cookie sesi Ridho di `page` tidak tertimpa. Menunggu isian nama
 * terisi dari server sebelum dikembalikan.
 */
export async function bukaProfil(browser: Browser, nama = NAMA_PROFIL, pin = PIN_PROFIL) {
  const ctx = await browser.newContext();
  const hal = await ctx.newPage();
  await loginSebagai(hal, nama, pin);
  await hal.goto(URL_PROFIL);
  await expect(hal.getByLabel(/Nama Lengkap/)).toHaveValue(nama, { timeout: 20_000 });
  return { ctx, hal };
}

/** Status login PIN lewat API, di konteks permintaan terpisah. */
export async function statusLoginPin(nama: string, pin: string): Promise<number> {
  const ctx = await request.newContext({ baseURL: BASIS });
  try {
    const akun = await ctx.post("/api/akun/auth/login", {
      data: { email: "toko@gmail.com", password: "Toko1234" },
    });
    const isi = await akun.json().catch(() => ({}));
    expect(akun.status(), `login akun: ${isi.message ?? ""}`).toBe(200);
    const res = await ctx.post("/api/pengguna/pin-login", {
      data: { nama, pin, loginType: "web" },
      headers: { Authorization: "Bearer " + isi.accessToken },
    });
    return res.status();
  } finally {
    await ctx.dispose();
  }
}