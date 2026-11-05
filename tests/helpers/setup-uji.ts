import { expect, type Page, type Response } from "@playwright/test";
import { PASSWORD_AKUN_UJI, buatAkunKlienUji, wajibAdmin } from "./admin-uji";
import { isiLoginAkun } from "./masuk-uji";

/**
 * Bantuan spec wizard setup dan fitur per plan: akun klien baru dari API
 * admin, login akun sampai /setup, lalu nama toko dan Owner lewat UI.
 */

export const PIN_OWNER = "123456";

export const lanjut = (page: Page) => page.getByRole("button", { name: "Simpan dan lanjut" });
export const daftarLangkah = (page: Page) => page.getByRole("list", { name: "Langkah setup toko" });
export const langkahAktif = (page: Page) => daftarLangkah(page).locator('[aria-current="step"]');
export const tunggu = (page: Page, metode: string, pola: RegExp): Promise<Response> =>
  page.waitForResponse((r) => r.request().method() === metode && pola.test(r.url()));

/** Akun klien baru, login akun lewat UI sampai wizard (requireSetup, B223). */
export async function akunBaru(page: Page, nama: string, langganan: Parameters<typeof buatAkunKlienUji>[2] = {}) {
  const email = `e2e.setup.${nama}.${Date.now().toString(36)}@tachyon-uji.com`;
  const id = await buatAkunKlienUji(email, wajibAdmin(), langganan);
  await page.goto("/login");
  await isiLoginAkun(page, email, PASSWORD_AKUN_UJI);
  await page.waitForURL("**/setup");
  await expect(langkahAktif(page)).toHaveText("1Nama toko", { timeout: 15_000 });
  return { id, email };
}

export async function isiTokoDanOwner(page: Page) {
  await page.getByLabel("Nama toko").fill("Kopi Senja E2E");
  const tToko = tunggu(page, "POST", /\/api\/tenant$/);
  await lanjut(page).click();
  expect((await tToko).status(), "POST /tenant").toBe(201);
  await page.getByLabel("Nama Owner").fill("Rina E2E");
  await page.getByLabel("PIN", { exact: true }).fill(PIN_OWNER);
  await page.getByLabel("Ulangi PIN").fill(PIN_OWNER);
  const tOwner = tunggu(page, "POST", /\/api\/pengguna\/register-owner$/);
  await lanjut(page).click();
  const owner = await tOwner;
  expect(owner.status(), "register-owner").toBe(201);
  expect(owner.request().postDataJSON(), "Owner web tanpa installationId (B219)").toEqual({
    nama: "Rina E2E",
    pin: PIN_OWNER,
  });
  await expect(langkahAktif(page)).toContainText("Lokasi outlet");
}

