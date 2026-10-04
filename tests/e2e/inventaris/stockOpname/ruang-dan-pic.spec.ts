import { test, expect, type Response } from "@playwright/test";
import { login, BASIS } from "../../../helpers/transfer-uji";

/*
 * Penjaga ruang di detail stock opname dan nama PIC di form buat, terhadap
 * backend sungguhan dan tanpa menulis data. Harapan dihitung dari respons
 * yang dibaca halaman itu sendiri.
 */

const URL_OUTLET = BASIS + "/dashboard/outlet/inventaris/stockOpname";
const URL_GUDANG = BASIS + "/dashboard/gudang/stockOpname";

type OpnameMentah = {
  id: string;
  nomorOpname: string;
  lokasi: { tipe?: string | null } | null;
};

const daftarOpname = (r: Response) =>
  r.request().method() === "GET" && /\/api\/stockopname(\?|$)/i.test(r.url());

/** Membuka daftar sebuah ruang dan mengembalikan dokumen bertipe lokasi itu. */
async function dokumenBertipe(
  page: import("@playwright/test").Page,
  urlDaftar: string,
  tipe: "Outlet" | "Gudang",
) {
  await page.goto(urlDaftar, { waitUntil: "commit" });
  const res = await page.waitForResponse(daftarOpname, { timeout: 20_000 });
  expect(res.status()).toBe(200);
  const daftar = ((await res.json()) as { data: OpnameMentah[] }).data;
  return daftar.find((o) => o.lokasi?.tipe === tipe);
}

test.describe("Stock opname: penjaga ruang dan PIC", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("detail: dokumen gudang yang dibuka di ruang outlet ditolak", async ({ page }) => {
    const dok = await dokumenBertipe(page, URL_GUDANG, "Gudang");
    test.skip(!dok, "Belum ada stock opname gudang di database");

    await page.goto(`${URL_OUTLET}/${dok!.id}`);
    await expect(page.getByText(/milik lokasi gudang/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(dok!.nomorOpname)).toHaveCount(0);
    await page.getByRole("button", { name: /kembali ke daftar/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/outlet\/inventaris\/stockOpname$/);
  });

  test("detail: dokumen outlet yang dibuka di ruang gudang ditolak", async ({ page }) => {
    const dok = await dokumenBertipe(page, URL_OUTLET, "Outlet");
    test.skip(!dok, "Belum ada stock opname outlet di database");

    await page.goto(`${URL_GUDANG}/${dok!.id}`);
    await expect(page.getByText(/milik lokasi outlet/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(dok!.nomorOpname)).toHaveCount(0);
    await page.getByRole("button", { name: /kembali ke daftar/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/gudang\/stockOpname$/);
  });

  test("form buat: PIC menampilkan nama pengguna dari server", async ({ page }) => {
    await page.goto(`${URL_OUTLET}/buatStockOpname`, { waitUntil: "commit" });
    const res = await page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/pengguna\/[^/?]+$/i.test(r.url()),
      { timeout: 20_000 },
    );
    expect(res.status()).toBe(200);
    const nama = ((await res.json()) as { data: { nama: string } }).data.nama;
    expect(nama, "respons pengguna harus membawa nama").toBeTruthy();

    const main = page.getByRole("main");
    await expect(main.getByText("Penanggung Jawab (PIC)")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText(nama, { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Anda (Pengguna Saat Ini)")).toHaveCount(0);
  });
});