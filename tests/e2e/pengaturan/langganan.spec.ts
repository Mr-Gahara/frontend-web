import { test, expect, type Page } from "@playwright/test";
import { masuk } from "../../helpers/masuk-uji";

/*
 * Halaman Langganan (desain F), hanya Owner, pratinjau dengan data contoh.
 * Pengguna uji Ridho berperan Owner. Jalur non-Owner diuji di unit
 * (bolehLihatLangganan) dan memakai PesanTanpaIzin yang sama dengan gerbang.
 */
const URL_LANGGANAN = "/dashboard/outlet/pengaturan/langganan";
const kartuPlan = (page: Page, nama: string) => page.getByRole("article", { name: `Plan ${nama}` });

test.describe("Langganan", () => {
  test.beforeEach(async ({ page }) => {
    await masuk(page);
  });

  test("Owner membuka Langganan dari kartu di Pengaturan", async ({ page }) => {
    await page.goto("/dashboard/outlet/pengaturan");
    await page.getByRole("link", { name: /Langganan/ }).click();
    await page.waitForURL("**" + URL_LANGGANAN);
    await expect(page.getByRole("heading", { level: 1, name: "Langganan" })).toBeVisible();
    await expect(page.getByRole("note").filter({ hasText: "Pratinjau tampilan" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Plan Basic" })).toBeVisible();
    await expect(page.getByText("Masa percobaan", { exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Masa berlaku terpakai" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("perbandingan tiga plan dengan fitur sesuai plan, plan aktif ditandai", async ({ page }) => {
    await page.goto(URL_LANGGANAN);
    await expect(kartuPlan(page, "Basic")).toContainText("Plan Anda");
    await expect(kartuPlan(page, "Advanced")).not.toContainText("Plan Anda");
    await expect(kartuPlan(page, "Basic").getByRole("img", { name: "Tidak termasuk" })).toHaveCount(2);
    await expect(kartuPlan(page, "Advanced").getByRole("img", { name: "Tidak termasuk" })).toHaveCount(1);
    await expect(kartuPlan(page, "Pro").getByRole("img", { name: "Tidak termasuk" })).toHaveCount(0);
  });

  test("tanpa nomor WhatsApp admin, kontak tampil sebagai teks tanpa tautan", async ({ page }) => {
    await page.goto(URL_LANGGANAN);
    await expect(page.getByText("Hubungi admin Tachyon untuk naik plan atau perpanjang.")).toBeVisible();
    await expect(page.locator('a[href^="https://wa.me"]')).toHaveCount(0);
  });

  test("di layar HP halaman tidak melebar; riwayat tampil sebagai daftar, bukan tabel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(URL_LANGGANAN);
    await expect(page.getByRole("heading", { level: 2, name: "Riwayat" })).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();
    await expect(page.getByRole("listitem").filter({ hasText: "berlaku sampai" })).toHaveCount(1);
    const lebar = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(lebar).toBeLessThanOrEqual(390);
  });
});