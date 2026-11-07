import { test, expect, Page } from "@playwright/test";
import { masuk } from "../../../helpers/masuk-uji";
import { BAHAN_FIXTURE } from "../../../helpers/pembelian-uji";

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

  test("bahan yang punya riwayat ditolak 409 dengan rujukannya, dan bahannya tetap ada (P18)", async ({ page }) => {
    // Bahan fixture permanen "E2E Bahan Pak" sudah punya riwayat jurnal stok
    // dari spec pembelian dan Belanja Stok, sehingga backend menolaknya
    // (RUJUKAN_BAHAN di bahanBakuService); tidak ada data yang berubah.
    const tunggu = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/inventory(\?|$)/.test(r.url()),
    );
    await page.goto(URL_BAHAN_BAKU);
    const daftar = (await (await tunggu).json()).data as { item?: { nama?: string | null } | null }[];
    test.skip(
      !daftar.some((d) => d.item?.nama === BAHAN_FIXTURE),
      `Bahan fixture ${BAHAN_FIXTURE} belum ada di outlet (dibuat spec produk)`,
    );

    await page.getByPlaceholder(/cari/i).first().fill(BAHAN_FIXTURE);
    const baris = page.locator("tbody tr").filter({ hasText: BAHAN_FIXTURE });
    await expect(baris).toHaveCount(1);
    await baris.getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    const dialog = page.getByRole("alertdialog");
    const tHapus = page.waitForResponse(
      (r) => r.request().method() === "DELETE" && /\/api\/bahanbaku\/[a-f0-9]{24}$/i.test(r.url()),
    );
    await dialog.getByRole("button", { name: /ya, hapus data master/i }).click();
    expect((await tHapus).status()).toBe(409);
    await expect(page.getByText("Gagal Menghapus")).toBeVisible();
    await expect(page.getByText(new RegExp(`${BAHAN_FIXTURE} tidak dapat dihapus karena masih terkait dengan`))).toBeVisible();
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /batal/i }).click();
    await expect(baris).toHaveCount(1);
  });
});