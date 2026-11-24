import { test, expect, type Page } from "@playwright/test";
import {
  ALASAN_TANPA_ADMIN,
  bukaDaftarAkun,
  buatAkunKlienUji,
  hapusAkunKlienUji,
  kredensialAdmin,
  wajibAdmin,
} from "../../helpers/admin-uji";
import { tanpaGulirSamping } from "../../helpers/tata-letak-uji";

/*
 * Rombak panel admin (pemilik proyek, 24 November 2026): kerangka desain B
 * (topbar navy dengan identitas admin, kartu ringkas), tabel dan filter
 * desain A, detail dua kolom dengan riwayat gaya A, serta dialog yang
 * menjadi panel bawah di HP. Angka dan identitas dibandingkan dengan
 * respons nyata; tata letak diperiksa di HP 390, tablet 768, dan laptop
 * 1280 px. Tidak ada data yang diubah.
 */

interface AkunRespons {
  id: string;
  email: string;
  role: "client" | "admin";
  status: "aktif" | "non-aktif";
  daftarTenant: { namaToko: string }[];
}

const POLA_DAFTAR = /\/api\/akun\/admin\/all(\?|$)/i;

const kartu = (page: Page, judul: string) => page.getByRole("region", { name: judul, exact: true });
const kepalaKolom = (page: Page) => page.getByRole("columnheader");

test.describe("Tampilan panel admin", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("laptop 1280: identitas admin, kartu ringkas sesuai respons, dan enam kolom", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const semua = await bukaDaftarAkun<AkunRespons>(page);
    // Email admin uji sama dengan email yang dibaca topbar dari GET /akun/me.
    const email = wajibAdmin().email;

    await expect(page.getByRole("banner").getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("button", { name: "Keluar" })).toBeVisible();

    const aktif = semua.filter((a) => a.status === "aktif").length;
    await expect(kartu(page, "Semua akun")).toContainText(String(semua.length));
    await expect(kartu(page, "Aktif")).toContainText(String(aktif));
    await expect(kartu(page, "Non-aktif")).toContainText(String(semua.length - aktif));

    await expect(kepalaKolom(page)).toHaveText(["Akun", "Toko", "Plan", "Status", "Masa Akses", "Dibuat"]);
    await tanpaGulirSamping(page, "daftar akun laptop");
  });

  test("tablet 768: empat kolom, toko di bawah email, tanpa gulir samping", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const semua = await bukaDaftarAkun<AkunRespons>(page);

    await expect(kepalaKolom(page)).toHaveText(["Akun dan toko", "Plan", "Status", "Masa Akses"]);
    const bertoko = semua.find((a) => a.role === "client" && a.daftarTenant.length > 0);
    if (bertoko) {
      const baris = page.getByRole("row").filter({ hasText: bertoko.email });
      if (await baris.count()) await expect(baris.first()).toContainText(bertoko.daftarTenant[0].namaToko);
    }
    await tanpaGulirSamping(page, "daftar akun tablet");
    // Identitas pindah ke menu avatar di bawah 768 px; 768 tepat masih memakai topbar penuh.
    await expect(page.getByRole("banner").getByRole("button", { name: "Keluar" })).toBeVisible();
  });

  test("HP 390: kartu, menu avatar, detail bertumpuk, dan dialog sebagai panel bawah", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const semua = await bukaDaftarAkun<AkunRespons>(page);
    // Email admin uji sama dengan email yang dibaca topbar dari GET /akun/me.
    const email = wajibAdmin().email;

    await expect(kepalaKolom(page).first()).toBeHidden();
    await tanpaGulirSamping(page, "daftar akun HP");

    await page.getByRole("button", { name: "Menu akun admin" }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByText(email, { exact: true })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Keluar" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    const klien = semua.find((a) => a.role === "client");
    test.skip(!klien, "Tidak ada akun klien di data uji");
    if (!klien) return;
    await page.goto(`/admin/akun/${klien.id}`);
    const profil = page.getByRole("region", { name: "Profil akun" });
    const riwayat = page.getByRole("region", { name: "Riwayat Langganan" });
    await expect(profil).toContainText(klien.email);
    await expect(riwayat).toBeVisible({ timeout: 15_000 });
    const atas = await profil.boundingBox();
    const bawah = await riwayat.boundingBox();
    expect(atas && bawah && bawah.y > atas.y + atas.height, "riwayat di bawah profil").toBe(true);
    await tanpaGulirSamping(page, "detail akun HP");

    await page.getByRole("button", { name: "Perpanjang Langganan" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
    const kotak = await dialog.boundingBox();
    expect(kotak, "kotak dialog").not.toBeNull();
    expect(Math.round(kotak!.width), "panel selebar layar").toBe(390);
    expect(Math.round(kotak!.y + kotak!.height), "panel menempel di bawah layar").toBe(844);
    await expect(dialog.getByRole("radiogroup", { name: "Durasi" }).getByRole("radio")).toHaveCount(5);
    await dialog.getByRole("button", { name: "Batal" }).click();
    await expect(dialog).toBeHidden();
  });

  test("laptop kecil 1024: empat kolom, tanpa gulir samping", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await bukaDaftarAkun<AkunRespons>(page);
    await expect(kepalaKolom(page)).toHaveText(["Akun dan toko", "Plan", "Status", "Masa Akses"]);
    await tanpaGulirSamping(page, "daftar akun 1024");
  });

  test("640: kartu per akun tanpa kepala kolom, tanpa gulir samping", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await bukaDaftarAkun<AkunRespons>(page);
    await expect(kepalaKolom(page).first()).toBeHidden();
    await expect(page.locator("[data-kartu]").first()).toBeVisible();
    await tanpaGulirSamping(page, "daftar akun 640");
  });

  test("HP 390: dialog Ubah Plan, Aktifkan, Bekukan, dan Hapus juga panel bawah selebar layar", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    const admin = wajibAdmin();
    // Akun klien sekali pakai: dibekukan lewat UI agar Aktifkan dan Hapus
    // tersedia, lalu dihapus lewat API di akhir.
    const email = `e2e.panel.${Date.now().toString(36)}@tachyon-uji.com`;
    const id = await buatAkunKlienUji(email, admin);
    try {
      await bukaDaftarAkun<AkunRespons>(page);
      await page.goto(`/admin/akun/${id}`);
      await expect(page.getByRole("region", { name: "Profil akun" })).toContainText(email, { timeout: 15_000 });
      const periksa = async (tombol: string) => {
        await page.getByRole("button", { name: tombol }).click();
        const dialog = page.getByRole("dialog").or(page.getByRole("alertdialog"));
        await expect(dialog).toBeVisible();
        await dialog.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
        const kotak = (await dialog.boundingBox())!;
        expect(Math.round(kotak.width), `${tombol}: selebar layar`).toBe(390);
        expect(Math.round(kotak.y + kotak.height), `${tombol}: menempel di bawah`).toBe(844);
        return dialog;
      };
      await periksa("Ubah Plan");
      await page.keyboard.press("Escape");
      const bekukan = await periksa("Bekukan Akun");
      await bekukan.getByRole("button", { name: "Bekukan", exact: true }).click();
      await expect(bekukan).toBeHidden({ timeout: 15_000 });
      await periksa("Aktifkan Akun");
      await page.keyboard.press("Escape");
      await periksa("Hapus Akun");
      await page.keyboard.press("Escape");
    } finally {
      await hapusAkunKlienUji(id, admin);
    }
  });

  test("HP 390: Keluar dari menu avatar mengakhiri sesi admin", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bukaDaftarAkun<AkunRespons>(page);
    await page.getByRole("button", { name: "Menu akun admin" }).click();
    const tKeluar = page.waitForResponse((r) => /\/api\/akun\/auth\/logout(\?|$)/i.test(r.url()));
    await page.getByRole("menu").getByRole("menuitem", { name: "Keluar" }).click();
    expect((await tKeluar).status()).toBe(200);
    await page.waitForURL("**/login", { timeout: 15_000 });
    await page.goto("/admin");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
  });

  test("kartu ringkas yang gagal dimuat menampilkan tanda hubung, tabel tetap tampil", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Gagal tidak dapat dibuat backend secara pasti (keputusan rancangan butir 21).
    await page.route(POLA_DAFTAR, (route) =>
      new URL(route.request().url()).searchParams.get("limit") === "1"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "uji" }) })
        : route.continue(),
    );
    await bukaDaftarAkun<AkunRespons>(page);
    for (const judul of ["Semua akun", "Aktif", "Non-aktif"]) {
      await expect(kartu(page, judul).getByText("-", { exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(kartu(page, judul)).toContainText("Gagal memuat jumlah");
    }
    await expect(page.getByRole("row").nth(1)).toBeVisible();
  });
});
