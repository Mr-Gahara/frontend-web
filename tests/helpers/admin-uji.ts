import fs from "node:fs";
import path from "node:path";
import { expect, request, type Page, type Response } from "@playwright/test";

/*
 * Akun admin uji untuk spec panel admin (keputusan PA4a dan PA5a).
 * Kredensialnya tidak pernah ditulis di repo: dibaca dari variabel
 * lingkungan atau dari .env.e2e di akar repo, yang diabaikan git.
 * Tanpa keduanya, spec admin dilewati dengan alasan yang terlihat.
 */

export interface KredensialAdmin {
  email: string;
  password: string;
}

export const ALASAN_TANPA_ADMIN =
  "Kredensial admin uji tidak tersedia: isi E2E_ADMIN_EMAIL dan E2E_ADMIN_PASSWORD di .env.e2e";

const POLA_LOGIN_AKUN = /\/api\/akun\/auth\/login(\?|$)/i;

function bacaBerkasEnv(): Record<string, string> {
  const berkas = path.resolve(process.cwd(), ".env.e2e");
  const nilai: Record<string, string> = {};
  if (!fs.existsSync(berkas)) return nilai;
  for (const baris of fs.readFileSync(berkas, "utf8").split("\n")) {
    const cocok = baris.match(/^([A-Z0-9_]+)=(.*)$/);
    if (cocok) nilai[cocok[1]] = cocok[2].trim().replace(/^["']|["']$/g, "");
  }
  return nilai;
}

/** Kredensial admin uji, atau null bila tidak tersedia. */
export function kredensialAdmin(): KredensialAdmin | null {
  const berkas = bacaBerkasEnv();
  const email = process.env.E2E_ADMIN_EMAIL ?? berkas.E2E_ADMIN_EMAIL ?? "";
  const password = process.env.E2E_ADMIN_PASSWORD ?? berkas.E2E_ADMIN_PASSWORD ?? "";
  return email && password ? { email, password } : null;
}

/** Login akun admin lewat UI sampai panel admin; mengembalikan respons login. */
export async function loginAdmin(page: Page, admin: KredensialAdmin): Promise<Response> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(admin.email);
  await page.getByLabel(/password/i).fill(admin.password);
  const tunggu = page.waitForResponse(
    (r) => POLA_LOGIN_AKUN.test(r.url()) && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /login/i }).click();
  const respons = await tunggu;
  await page.waitForURL("**/admin");
  return respons;
}
/** Kredensial admin uji; melempar bila tidak tersedia (spec-nya sudah dilewati test.skip). */
export function wajibAdmin(): KredensialAdmin {
  const admin = kredensialAdmin();
  if (!admin) throw new Error(ALASAN_TANPA_ADMIN);
  return admin;
}

/**
 * Membersihkan akun klien uji lewat API (keputusan PA9a): dibekukan lalu
 * dihapus, karena backend hanya menghapus akun non-aktif. Login di konteks
 * terpisah memutar tokenVersion admin, jadi dipanggil setelah halaman tidak
 * dipakai lagi. Jawabannya diperiksa lunak agar kegagalan asli test tetap
 * terlihat.
 */
export async function hapusAkunKlienUji(id: string, admin: KredensialAdmin) {
  const ctx = await request.newContext({ baseURL: "http://localhost:3000" });
  try {
    const masuk = await ctx.post("/api/akun/auth/login", {
      data: { email: admin.email, password: admin.password },
    });
    const kepala = { Authorization: "Bearer " + (await masuk.json()).accessToken };
    const beku = await ctx.post("/api/akun/admin/users/" + id + "/freeze", {
      headers: kepala,
      data: { alasan: "Pembersihan akun uji e2e" },
    });
    expect.soft([200, 409], "bekukan akun uji (409: sudah non-aktif)").toContain(beku.status());
    const hapus = await ctx.delete("/api/akun/admin/users/" + id, {
      headers: kepala,
      data: { password: admin.password },
    });
    expect.soft(hapus.status(), "hapus akun uji").toBe(200);
  } finally {
    await ctx.dispose();
  }
}

export interface AkunUji {
  id: string;
  email: string;
  role: "client" | "admin";
  status: string;
}

export const PASSWORD_AKUN_UJI = "UjiKlien123";

const POLA_DAFTAR_AKUN = /\/api\/akun\/admin\/all(\?|$)/i;
const POLA_BUAT_AKUN = /\/api\/akun\/admin\/users(\?|$)/i;
const POLA_BEKUKAN_AKUN = /\/api\/akun\/admin\/users\/[^/]+\/freeze(\?|$)/i;
const POLA_SATU_AKUN = /\/api\/akun\/admin\/users\/[0-9a-f]{24}(\?|$)/i;

/** Menunggu GET /akun/admin/all berikutnya yang query-nya memenuhi syarat. */
export function tungguDaftarAkun(page: Page, syarat: (q: URLSearchParams) => boolean = () => true) {
  return page.waitForResponse(
    (r) =>
      POLA_DAFTAR_AKUN.test(r.url()) &&
      r.request().method() === "GET" &&
      syarat(new URL(r.url()).searchParams),
  );
}

/** Total dari pagination respons daftar, dan footer tabel yang menampilkannya. */
export async function periksaTotalDaftar(page: Page, respons: Response): Promise<number> {
  expect(respons.status(), respons.url()).toBe(200);
  const isi = (await respons.json()) as { pagination: { total: number } };
  await expect(page.getByText(`${isi.pagination.total} total data`, { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  return isi.pagination.total;
}

/**
 * Login admin, lalu muat ulang agar respons halaman pertama daftar milik
 * halaman ini tertangkap (B177: page 1, limit 10). Seluruh akun dibaca
 * lewat API sebagai bukti, dengan token permintaan halaman itu sendiri,
 * karena login di konteks lain memutar tokenVersion admin.
 */
export async function bukaDaftarAkun<T = AkunUji>(page: Page): Promise<T[]> {
  await loginAdmin(page, wajibAdmin());
  await page.reload({ waitUntil: "commit" });
  const respons = await tungguDaftarAkun(page);
  const q = new URL(respons.url()).searchParams;
  expect([q.get("page"), q.get("limit")]).toEqual(["1", "10"]);
  const total = await periksaTotalDaftar(page, respons);

  const semua = await page.request.get("/api/akun/admin/all", {
    headers: { authorization: respons.request().headers()["authorization"] ?? "" },
  });
  expect(semua.status(), "baca seluruh akun").toBe(200);
  const data = ((await semua.json()) as { data: T[] }).data;
  expect(data.length, "total pagination sama dengan seluruh akun").toBe(total);
  return data;
}

/** Dari halaman daftar: cari lewat email, lalu buka detailnya. */
export async function bukaDetailAkun(page: Page, akun: Pick<AkunUji, "id" | "email">) {
  await page.getByLabel("Cari akun").fill(akun.email);
  await page.getByRole("link", { name: akun.email }).click();
  await page.waitForURL("**/admin/akun/" + akun.id);
  await expect(page.getByRole("heading", { name: "Detail Akun" })).toBeVisible();
}

/** Dari halaman daftar: buat akun klien uji bermasa percobaan lewat form, sampai kembali ke daftar. */
export async function buatAkunKlienLewatUi(page: Page, email: string): Promise<AkunUji> {
  await page.getByRole("button", { name: "Buat Akun Klien" }).click();
  await page.waitForURL("**/admin/akun/buat");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password awal").fill(PASSWORD_AKUN_UJI);
  const tunggu = page.waitForResponse(
    (r) => POLA_BUAT_AKUN.test(r.url()) && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Simpan Akun" }).click();
  const respons = await tunggu;
  expect(respons.status(), "buat akun uji").toBe(201);
  const akun = ((await respons.json()) as { data: AkunUji }).data;
  await page.waitForURL("**/admin");
  return akun;
}

/**
 * Dari halaman detail: bekukan bila masih aktif, lalu hapus dengan password
 * admin, seluruhnya lewat UI (keputusan rancangan butir 23), dan pastikan
 * akun hilang dari daftar.
 */
export async function hapusAkunDariDetail(page: Page, email: string, admin: KredensialAdmin) {
  const kotak = page.getByRole("dialog");
  const hapus = page.getByRole("button", { name: "Hapus Akun" });
  const bekukan = page.getByRole("button", { name: "Bekukan Akun" });
  await expect(hapus).toBeVisible({ timeout: 15_000 });

  if (await bekukan.isVisible()) {
    await bekukan.click();
    const tungguBeku = page.waitForResponse(
      (r) => POLA_BEKUKAN_AKUN.test(r.url()) && r.request().method() === "POST",
    );
    await kotak.getByRole("button", { name: "Bekukan", exact: true }).click();
    expect((await tungguBeku).status(), "bekukan sebelum hapus").toBe(200);
    await expect(kotak).toBeHidden({ timeout: 15_000 });
  }

  await expect(hapus).toBeEnabled();
  await hapus.click();
  await kotak.getByLabel("Password admin").fill(admin.password);
  const tungguHapus = page.waitForResponse(
    (r) => POLA_SATU_AKUN.test(r.url()) && r.request().method() === "DELETE",
  );
  await kotak.getByRole("button", { name: "Hapus Permanen" }).click();
  expect((await tungguHapus).status(), "hapus akun uji lewat UI").toBe(200);
  await page.waitForURL("**/admin");
  await page.getByLabel("Cari akun").fill(email);
  await expect(page.getByRole("link", { name: email })).toHaveCount(0);
}
