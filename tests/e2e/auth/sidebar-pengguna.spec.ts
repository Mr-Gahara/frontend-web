import { test, expect } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, login } from "../../helpers/transfer-uji";
import { PENGGUNA_UJI, isiLoginPengguna } from "../../helpers/masuk-uji";
import {
  NAMA_PROFIL,
  NAMA_PROFIL_UBAH,
  POLA_PENGGUNA,
  bukaProfil,
  pulihkanPenggunaProfil,
  siapkanPenggunaProfil,
} from "../../helpers/profil-uji";

/*
 * Kaki sidebar setelah dipecah (keputusan PF4a dan PF9a): nama pengguna
 * dari server, avatar tanpa gambar eksternal, tautan profil, logout yang
 * memutus sesi di backend, dan nama yang ikut berubah setelah profil
 * disimpan karena berbagi cache dengan halaman profil.
 */
const POLA_LOGOUT_PENGGUNA = /\/api\/pengguna\/pin-logout(\?|$)/i;
const POLA_LOGOUT_AKUN = /\/api\/akun\/auth\/logout(\?|$)/i;

test.describe("Kaki sidebar", () => {
  test.setTimeout(120_000);

  test("nama dari server, avatar tanpa gambar eksternal, dan menu Profil membuka halaman profil", async ({
    page,
  }) => {
    await login(page);
    const pemicu = page.getByRole("button", { name: /Ridho/ });
    await expect(pemicu).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('img[src*="github.com"]')).toHaveCount(0);

    await pemicu.click();
    await page.getByRole("menuitem", { name: "Profil Saya" }).click();
    await page.waitForURL("**/dashboard/profil");
    await expect(page.getByLabel(/Nama Lengkap/)).toHaveValue("Ridho", { timeout: 20_000 });
  });

  test("logout memutus sesi pengguna dan akun, dan sesi tidak dapat dipulihkan", async ({
    page,
  }) => {
    await login(page);
    const pemicu = page.getByRole("button", { name: /Ridho/ });
    await expect(pemicu).toBeVisible({ timeout: 15_000 });
    await pemicu.click();

    const tPengguna = page.waitForResponse((r) => POLA_LOGOUT_PENGGUNA.test(r.url()));
    const tAkun = page.waitForResponse((r) => POLA_LOGOUT_AKUN.test(r.url()));
    await page.getByRole("menuitem", { name: "Keluar dari toko" }).click();
    expect((await tPengguna).status(), "pin-logout").toBeLessThan(400);
    expect((await tAkun).status(), "logout akun").toBeLessThan(400);
    await page.waitForURL(/\/login$/);

    // Cookie refresh sudah tidak berlaku: membuka dashboard kembali ke login.
    await page.goto(BASIS + "/dashboard");
    await page.waitForURL(/\/login$/);
  });

  test("logout pengguna yang gagal tetap memutus sesi akun dan pengguna, dan sesi tidak dapat dipulihkan", async ({
    page,
  }) => {
    await login(page);
    const pemicu = page.getByRole("button", { name: /Ridho/ });
    await expect(pemicu).toBeVisible({ timeout: 15_000 });
    // Jalur gagal yang tidak dapat dibuat backend secara deterministik (keputusan rancangan butir 21).
    await page.route(POLA_LOGOUT_PENGGUNA, (route) => route.fulfill(JAWAB_GAGAL));
    await pemicu.click();

    const tPengguna = page.waitForResponse((r) => POLA_LOGOUT_PENGGUNA.test(r.url()));
    const tAkun = page.waitForResponse((r) => POLA_LOGOUT_AKUN.test(r.url()));
    await page.getByRole("menuitem", { name: "Keluar dari toko" }).click();
    expect((await tPengguna).status(), "pin-logout").toBe(500);
    expect((await tAkun).status(), "logout akun tetap dikirim").toBeLessThan(400);
    await page.waitForURL(/\/login$/);
    await page.unroute(POLA_LOGOUT_PENGGUNA);
    // Sejak backend 4a19be8 (P82, B343) logout akun ikut memutus sesi pengguna
    // web di browser yang sama, sehingga sesi tidak pulih walau pin-logout
    // gagal (kontrak/temuan.md butir 177).
    await page.goto(BASIS + "/dashboard");
    await page.waitForURL(/\/login$/);
  });

  test("popup desain C: identitas, selebar pemicunya, tiga pilihan, dan teks pemicu tetap terang (PU2a)", async ({
    page,
  }) => {
    for (const lebar of [1280, 768, 390]) {
      await page.setViewportSize({ width: lebar, height: 844 });
      await login(page);
      if (lebar < 1025) await page.locator('[data-sidebar="trigger"]').first().click();
      const pemicu = page.getByRole("button", { name: /Ridho/ });
      await expect(pemicu).toBeVisible({ timeout: 15_000 });
      await pemicu.click();
      const menu = page.getByRole("menu");
      await expect(menu.getByRole("menuitem")).toHaveText([
        "Profil Saya",
        "Ganti penggunaKembali ke Siapa yang bertugas?",
        "Keluar dari toko",
      ]);
      await expect(menu.getByRole("menuitem", { name: /Akun Toko|Langganan/ })).toHaveCount(0);
      const ukuran = await page.evaluate(() => {
        const t = document.querySelector<HTMLElement>('[data-sidebar="footer"] button')!;
        const m = document.querySelector<HTMLElement>('[role="menu"]')!;
        const nama = t.querySelector<HTMLElement>("span.truncate")!;
        return { pemicu: t.getBoundingClientRect().width, menu: m.getBoundingClientRect().width, warna: getComputedStyle(nama).color };
      });
      expect(Math.round(ukuran.menu), `lebar popup di ${lebar} px`).toBe(Math.round(ukuran.pemicu));
      // Teks pemicu tetap gading saat menu terbuka, bukan gelap di atas navy.
      expect(ukuran.warna, `warna nama pemicu di ${lebar} px`).toBe("rgb(255, 250, 243)");
      await page.keyboard.press("Escape");
    }
  });

  test("sidebar mode ikon di desktop: popup tetap selebar minimal 224 px dan seluruhnya di dalam layar (PU2a)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await page.locator('[data-sidebar="trigger"]').first().click();
    await expect(page.locator('[data-sidebar="sidebar"]').first().locator("xpath=ancestor::*[@data-state][1]")).toHaveAttribute(
      "data-state",
      "collapsed",
    );
    // Tombol Next.js Dev Tools (hanya di dev server) menutupi pemicu di sudut
    // kiri bawah pada mode ikon; pemicu dibuka lewat keyboard.
    await page.locator('[data-sidebar="footer"] button').first().focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Profil Saya" })).toBeVisible();
    const kotak = (await menu.boundingBox())!;
    expect(kotak.width, "lebar minimal popup").toBeGreaterThanOrEqual(224);
    expect(kotak.x >= 0 && kotak.y >= 0, "popup di dalam layar (kiri atas)").toBe(true);
    expect(kotak.x + kotak.width <= 1280 && kotak.y + kotak.height <= 800, "popup di dalam layar (kanan bawah)").toBe(true);
    await page.keyboard.press("Escape");
  });

  test("ganti pengguna: hanya sesi PIN yang berakhir, akun toko tetap masuk (PU2a)", async ({ page }) => {
    await login(page);
    const pemicu = page.getByRole("button", { name: /Ridho/ });
    await expect(pemicu).toBeVisible({ timeout: 15_000 });
    await pemicu.click();
    let logoutAkun = 0;
    page.on("request", (r) => {
      if (POLA_LOGOUT_AKUN.test(r.url())) logoutAkun++;
    });
    const tPengguna = page.waitForResponse((r) => POLA_LOGOUT_PENGGUNA.test(r.url()));
    await page.getByRole("menuitem", { name: /Ganti pengguna/ }).click();
    expect((await tPengguna).status(), "pin-logout").toBeLessThan(400);
    await page.waitForURL("**/login/pengguna");
    await expect(page.getByRole("heading", { name: "Siapa yang bertugas?" })).toBeVisible();
    expect(logoutAkun, "akun toko tidak dikeluarkan").toBe(0);
    // Pengguna berikutnya masuk di tab yang sama tanpa login akun ulang.
    await isiLoginPengguna(page, PENGGUNA_UJI.nama, PENGGUNA_UJI.pin);
    await page.waitForURL("**/dashboard");
  });

  test("ganti pengguna lalu muat ulang, buka dashboard, dan tab baru: akun toko tetap masuk (butir 190)", async ({
    page,
  }) => {
    await login(page);
    const pemicu = page.getByRole("button", { name: /Ridho/ });
    await expect(pemicu).toBeVisible({ timeout: 15_000 });
    await pemicu.click();
    const tPengguna = page.waitForResponse((r) => POLA_LOGOUT_PENGGUNA.test(r.url()));
    await page.getByRole("menuitem", { name: /Ganti pengguna/ }).click();
    expect((await tPengguna).status(), "pin-logout").toBeLessThan(400);
    await page.waitForURL("**/login/pengguna");

    // Backend B378: pin-logout tidak lagi menghapus cookie akun (path /api/akun/auth),
    // sehingga sesi akun pulih dari cookie dan halaman tidak jatuh ke login email.
    const judul = page.getByRole("heading", { name: "Siapa yang bertugas?" });
    await page.reload();
    await expect(judul).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login\/pengguna/);

    await page.goto(BASIS + "/dashboard");
    await page.waitForURL(/\/login\/pengguna/, { timeout: 15_000 });
    await expect(judul).toBeVisible();

    const tabBaru = await page.context().newPage();
    try {
      await tabBaru.goto(BASIS + "/dashboard");
      await tabBaru.waitForURL(/\/login\/pengguna/, { timeout: 15_000 });
      await expect(tabBaru.getByRole("heading", { name: "Siapa yang bertugas?" })).toBeVisible();
    } finally {
      await tabBaru.close();
    }

    // Pengguna berikutnya masuk dari keadaan pulih itu tanpa login akun ulang.
    await isiLoginPengguna(page, PENGGUNA_UJI.nama, PENGGUNA_UJI.pin);
    await page.waitForURL("**/dashboard");
  });

  test("ganti pengguna yang gagal: pesan tampil dan tetap di halaman (PU2a)", async ({ page }) => {
    await login(page);
    const pemicu = page.getByRole("button", { name: /Ridho/ });
    await expect(pemicu).toBeVisible({ timeout: 15_000 });
    // Jalur gagal yang tidak dapat dibuat backend secara deterministik (keputusan rancangan butir 21).
    await page.route(POLA_LOGOUT_PENGGUNA, (route) => route.fulfill(JAWAB_GAGAL));
    try {
      await pemicu.click();
      const tPengguna = page.waitForResponse((r) => POLA_LOGOUT_PENGGUNA.test(r.url()));
      await page.getByRole("menuitem", { name: /Ganti pengguna/ }).click();
      expect((await tPengguna).status()).toBe(500);
      await expect(page.getByText("Gagal ganti pengguna")).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      await page.unroute(POLA_LOGOUT_PENGGUNA);
    }
  });

  test("nama di sidebar ikut berubah setelah profil disimpan", async ({ page, browser }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await expect(hal.getByRole("button", { name: new RegExp(NAMA_PROFIL) })).toBeVisible();
      await hal.getByLabel(/Nama Lengkap/).fill(NAMA_PROFIL_UBAH);
      const tunggu = hal.waitForResponse(
        (r) => r.request().method() === "PUT" && POLA_PENGGUNA.test(r.url()),
      );
      await hal.getByRole("button", { name: "Simpan Data Diri" }).click();
      expect((await tunggu).status()).toBe(200);
      await expect(hal.getByRole("button", { name: new RegExp(NAMA_PROFIL_UBAH) })).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await ctx.close();
      const pulih = await pulihkanPenggunaProfil(page, auth, id);
      expect.soft(pulih.status, `pulihkan: ${pulih.pesan}`).toBe(200);
    }
  });
});