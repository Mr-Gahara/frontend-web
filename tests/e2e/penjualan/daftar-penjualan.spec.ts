import { expect, test, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Daftar penjualan per halaman (keputusan PB6a). Backend 465b438 menjawab
 * GET /penjualan per halaman, sehingga footer tabel memakai angka dan aksi
 * server, kolom tidak diurutkan per halaman, dan pilihan jumlah baris
 * terkirim sebagai limit. Harapan dihitung dari respons yang dibaca halaman
 * itu sendiri; tidak ada data yang ditulis.
 */

const URL_DAFTAR = "/dashboard/outlet/penjualan";
const POLA_DAFTAR = /\/api\/penjualan\?/i;

type ResponsDaftar = {
  data: { noReferensi: string }[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function tungguDaftar(page: Page, halaman: number, limit: number) {
  return page.waitForResponse((r) => {
    if (r.request().method() !== "GET" || !POLA_DAFTAR.test(r.url())) return false;
    const q = new URL(r.url()).searchParams;
    return q.get("page") === String(halaman) && q.get("limit") === String(limit);
  });
}

function teksHalaman(respons: ResponsDaftar, halaman: number) {
  return `Halaman ${halaman} dari ${Math.max(1, respons.pagination.totalPages)}`;
}

async function bukaDaftar(page: Page) {
  await page.goto(URL_DAFTAR, { waitUntil: "commit" });
  const tAwal = tungguDaftar(page, 1, 10);
  return (await (await tAwal).json()) as ResponsDaftar;
}

test.describe("E2E — Daftar penjualan per halaman", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("satu footer halaman berangka server, tanpa tombol urutkan kolom (PB6a)", async ({ page }) => {
    const awal = await bukaDaftar(page);
    expect(awal.pagination.limit).toBe(10);
    await expect(page.getByText(`${awal.pagination.total} total data`, { exact: true })).toBeVisible();
    await expect(page.getByText(teksHalaman(awal, 1), { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Next", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^(No\. Referensi|Tanggal|Total)$/ })).toHaveCount(0);
    await expect(page.locator("tbody tr")).toHaveCount(awal.data.length);
  });

  test("Previous kembali ke halaman 1, dan jumlah baris terkirim sebagai limit", async ({ page }) => {
    const awal = await bukaDaftar(page);
    expect(awal.pagination.total, "data uji perlu lebih dari 20 penjualan").toBeGreaterThan(20);

    const tHalaman2 = tungguDaftar(page, 2, 10);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await tHalaman2;
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeEnabled();

    // Halaman 1 masih segar di cache (staleTime 5 menit di
    // components/providers/query-provider.tsx), sehingga kembali ke sana tidak
    // mengirim permintaan; buktinya dari tampilan.
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page.getByText(teksHalaman(awal, 1), { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await expect(page.locator("tbody tr").first()).toContainText(awal.data[0].noReferensi);

    const t20 = tungguDaftar(page, 1, 20);
    await page.getByRole("combobox", { name: "Jumlah baris per halaman" }).click();
    await page.getByRole("option", { name: "20", exact: true }).click();
    const r20 = (await (await t20).json()) as ResponsDaftar;
    expect(r20.pagination).toMatchObject({ page: 1, limit: 20 });
    await expect(page.getByText(`${r20.pagination.total} total data`, { exact: true })).toBeVisible();
    await expect(page.getByText(teksHalaman(r20, 1), { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(r20.data.length);
  });
});