import { test, expect, Page } from "@playwright/test";
import { masuk } from "../../../helpers/masuk-uji";

const URL_BAHAN_BAKU = "http://localhost:3000/dashboard/outlet/inventaris/bahanBaku";

async function login(page: Page) {
  await masuk(page);
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

    await page.locator("tbody tr").first().getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: /ya, hapus data master/i }).click();

    await expect(page.getByText("Gagal Menghapus")).toBeVisible();
    await expect(dialog).toBeVisible();
    await page.unroute(pola);
  });
});