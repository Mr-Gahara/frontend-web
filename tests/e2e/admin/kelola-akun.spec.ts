import { test, expect, request, type Page, type Response } from "@playwright/test";
import {
  ALASAN_TANPA_ADMIN,
  PASSWORD_AKUN_UJI,
  buatAkunKlienLewatUi,
  bukaDaftarAkun,
  bukaDetailAkun,
  hapusAkunDariDetail,
  hapusAkunKlienUji,
  kredensialAdmin,
  wajibAdmin,
  type AkunUji,
} from "../../helpers/admin-uji";

/*
 * Ubah dan hapus akun klien (keputusan PA12a sampai PA14a). Akun uji dibuat,
 * diubah, dibekukan, dan dihapus lewat UI; payload ubah dibandingkan utuh
 * (hanya field yang berubah), password baru dibuktikan dengan login, dan
 * penolakan backend dibaca dari respons nyata. Hapus lewat API hanya
 * cadangan di finally.
 */

const POLA_SATU_AKUN = /\/api\/akun\/admin\/users\/[0-9a-f]{24}(\?|$)/i;

const kotak = (page: Page) => page.getByRole("dialog");
const tungguAkun = (page: Page, method: "PUT" | "DELETE"): Promise<Response> =>
  page.waitForResponse((r) => POLA_SATU_AKUN.test(r.url()) && r.request().method() === method);

async function bukaFormUbah(page: Page, akun: Pick<AkunUji, "id">) {
  await page.getByRole("button", { name: "Ubah Akun" }).click();
  await page.waitForURL("**/admin/akun/" + akun.id + "/ubah");
  await expect(page.getByRole("heading", { name: "Ubah Akun" })).toBeVisible();
}

async function simpanUbah(page: Page): Promise<Response> {
  const tunggu = tungguAkun(page, "PUT");
  await page.getByRole("button", { name: "Simpan Perubahan" }).click();
  return tunggu;
}

async function statusLogin(email: string, password: string): Promise<number> {
  const ctx = await request.newContext({ baseURL: "http://localhost:3000" });
  try {
    return (await ctx.post("/api/akun/auth/login", { data: { email, password } })).status();
  } finally {
    await ctx.dispose();
  }
}

test.describe("Kelola akun klien", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("ubah: hanya field yang berubah terkirim, dan password baru dapat dipakai login", async ({ page }) => {
    test.setTimeout(120_000);
    const admin = wajibAdmin();
    const unik = Date.now().toString(36);
    const emailAwal = `e2e.ubah.${unik}@tachyon-uji.com`;
    const emailBaru = `e2e.ubah.baru.${unik}@tachyon-uji.com`;
    const username = `e2e-${unik}`.slice(0, 25);
    const passwordBaru = "UjiBaru4567";
    let akun: AkunUji | null = null;
    let emailKini = emailAwal;
    let terhapus = false;

    try {
      const daftar = await bukaDaftarAkun(page);
      const klienLain = daftar.find((a) => a.role === "client");
      akun = await buatAkunKlienLewatUi(page, emailAwal);
      const uji: AkunUji = akun;
      await bukaDetailAkun(page, uji);

      await test.step("simpan tanpa perubahan tidak mengirim permintaan", async () => {
        await bukaFormUbah(page, uji);
        let terkirim = 0;
        const catat = (r: { url(): string; method(): string }) => {
          if (POLA_SATU_AKUN.test(r.url()) && r.method() === "PUT") terkirim += 1;
        };
        page.on("request", catat);
        await page.getByRole("button", { name: "Simpan Perubahan" }).click();
        await expect(page.getByRole("main").getByRole("alert")).toContainText("Tidak ada perubahan untuk disimpan.");
        page.off("request", catat);
        expect(terkirim).toBe(0);
      });

      await test.step("username diisi: payload hanya username", async () => {
        await page.getByLabel("Username").fill(username);
        const respons = await simpanUbah(page);
        expect(respons.status()).toBe(200);
        expect(respons.request().postDataJSON()).toEqual({ username });
        await page.waitForURL("**/admin/akun/" + uji.id);
        await expect(page.getByText(username, { exact: true })).toBeVisible({ timeout: 15_000 });
      });

      await test.step("email milik akun lain ditolak backend dan pesannya tampil", async () => {
        test.skip(!klienLain, "Tidak ada akun klien lain di data uji");
        if (!klienLain) return;
        await bukaFormUbah(page, uji);
        await page.getByLabel("Email", { exact: true }).fill(klienLain.email);
        const respons = await simpanUbah(page);
        expect([400, 409], "email kembar ditolak sebagai galat klien").toContain(respons.status());
        const pesan = ((await respons.json()) as { message?: string }).message ?? "";
        expect(pesan, "backend memberi pesan penolakan").not.toBe("");
        await expect(page.getByRole("main").getByRole("alert")).toContainText(pesan);
        await expect(page).toHaveURL(/\/ubah$/);
        await page.getByRole("link", { name: "Kembali ke Detail Akun" }).click();
        await page.waitForURL("**/admin/akun/" + uji.id);
      });

      await test.step("email diganti dan username dikosongkan: payload email dan username null", async () => {
        await bukaFormUbah(page, uji);
        await page.getByLabel("Email", { exact: true }).fill(emailBaru);
        await page.getByLabel("Username").fill("");
        const respons = await simpanUbah(page);
        expect(respons.status()).toBe(200);
        expect(respons.request().postDataJSON()).toEqual({ email: emailBaru, username: null });
        emailKini = emailBaru;
        await page.waitForURL("**/admin/akun/" + uji.id);
        await expect(page.getByText(emailBaru, { exact: true })).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Tanpa username")).toBeVisible();
      });

      await test.step("password lemah ditolak form, password baru tersimpan dan dipakai login", async () => {
        await bukaFormUbah(page, uji);
        await page.getByLabel("Password baru").fill("lemah");
        await page.getByRole("button", { name: "Simpan Perubahan" }).click();
        await expect(page.getByText(/Password baru minimal 8 karakter/)).toBeVisible();

        await page.getByLabel("Password baru").fill(passwordBaru);
        const respons = await simpanUbah(page);
        expect(respons.status()).toBe(200);
        expect(respons.request().postDataJSON()).toEqual({ password: passwordBaru });
        await page.waitForURL("**/admin/akun/" + uji.id);

        expect(await statusLogin(emailBaru, passwordBaru), "login dengan password baru").toBe(200);
        expect(await statusLogin(emailBaru, PASSWORD_AKUN_UJI), "password lama ditolak").toBe(400);
      });

      await test.step("hapus akun uji lewat UI", async () => {
        await hapusAkunDariDetail(page, emailKini, admin);
        terhapus = true;
      });
    } finally {
      const tersisa = akun as AkunUji | null;
      if (tersisa && !terhapus) await hapusAkunKlienUji(tersisa.id, admin);
    }
  });

  test("hapus: nonaktif selama akun aktif, password admin salah ditolak, lalu terhapus", async ({ page }) => {
    test.setTimeout(90_000);
    const admin = wajibAdmin();
    const email = `e2e.hapus.${Date.now().toString(36)}@tachyon-uji.com`;
    let akun: AkunUji | null = null;
    let terhapus = false;

    try {
      await bukaDaftarAkun(page);
      akun = await buatAkunKlienLewatUi(page, email);
      const uji: AkunUji = akun;
      await bukaDetailAkun(page, uji);

      await expect(page.getByRole("button", { name: "Hapus Akun" })).toBeDisabled();
      await expect(page.getByText("Akun aktif tidak dapat dihapus. Bekukan akun lebih dulu.")).toBeVisible();

      await page.getByRole("button", { name: "Bekukan Akun" }).click();
      await kotak(page).getByRole("button", { name: "Bekukan", exact: true }).click();
      await expect(kotak(page)).toBeHidden({ timeout: 15_000 });
      await expect(page.getByRole("button", { name: "Hapus Akun" })).toBeEnabled();

      await page.getByRole("button", { name: "Hapus Akun" }).click();
      let terkirim = 0;
      const catat = (r: { url(): string; method(): string }) => {
        if (POLA_SATU_AKUN.test(r.url()) && r.method() === "DELETE") terkirim += 1;
      };
      page.on("request", catat);
      await kotak(page).getByRole("button", { name: "Hapus Permanen" }).click();
      await expect(kotak(page).getByRole("alert")).toContainText("Password admin wajib diisi.");
      page.off("request", catat);
      expect(terkirim, "tanpa password tidak ada permintaan").toBe(0);

      await kotak(page).getByLabel("Password admin").fill("BukanPasswordAdmin9");
      const tungguSalah = tungguAkun(page, "DELETE");
      await kotak(page).getByRole("button", { name: "Hapus Permanen" }).click();
      const salah = await tungguSalah;
      expect(salah.status()).toBe(401);
      const pesan = ((await salah.json()) as { message: string }).message;
      await expect(kotak(page).getByRole("alert")).toContainText(pesan, { timeout: 15_000 });
      await expect(kotak(page)).toBeVisible();
      await kotak(page).getByRole("button", { name: "Batal" }).click();
      await expect(kotak(page)).toBeHidden();

      await hapusAkunDariDetail(page, email, admin);
      terhapus = true;
    } finally {
      const tersisa = akun as AkunUji | null;
      if (tersisa && !terhapus) await hapusAkunKlienUji(tersisa.id, admin);
    }
  });

  test("akun admin: tanpa tombol ubah dan hapus, dan halaman ubahnya menolak", async ({ page }) => {
    const daftar = await bukaDaftarAkun(page);
    const akunAdmin = daftar.find((a) => a.role === "admin");
    expect(akunAdmin, "daftar memuat akun admin").toBeTruthy();
    if (!akunAdmin) return;

    await page.goto("/admin/akun/" + akunAdmin.id);
    await expect(
      page.getByText("Akun admin tidak berlangganan dan tidak dapat dibekukan."),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Ubah Akun" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hapus Akun" })).toHaveCount(0);

    await page.goto("/admin/akun/" + akunAdmin.id + "/ubah");
    await expect(
      page.getByRole("alert").filter({ hasText: "Akun admin tidak dapat diubah dari panel ini." }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Simpan Perubahan" })).toHaveCount(0);
  });
});