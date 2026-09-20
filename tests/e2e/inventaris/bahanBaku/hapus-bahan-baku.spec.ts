import { test, expect, Page } from "@playwright/test";

const URL_BAHAN_BAKU = "http://localhost:3000/dashboard/outlet/inventaris/bahanBaku";

async function login(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/dashboard");
}

test.describe("Hapus bahan baku", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("gagal hapus: dialog tetap terbuka dan pesan gagal tampil", async ({ page }) => {
    const tunggu = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/inventory(\?|$)/.test(r.url()),
    );
    await page.goto(URL_BAHAN_BAKU);
    const daftar = (await (await tunggu).json()).data as unknown[];
    test.skip(daftar.length === 0, "Belum ada bahan baku di lokasi outlet");

    const pola = "**/api/bahanbaku/*";
    await page.route(pola, (route) =>
      route.request().method() === "DELETE"
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ status: "error", message: "uji gagal hapus" }),
          })
        : route.continue(),
    );

    await page.getByRole("button", { name: /hapus bahan baku/i }).first().click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: /ya, hapus data master/i }).click();

    await expect(page.getByText("Gagal Menghapus")).toBeVisible();
    await expect(dialog).toBeVisible();
    await page.unroute(pola);
  });
});