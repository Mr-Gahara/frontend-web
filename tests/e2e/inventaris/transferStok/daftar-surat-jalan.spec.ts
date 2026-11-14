import { test, expect, type Page, type Response } from "@playwright/test";
import { BASIS, login } from "../../../helpers/transfer-uji";
import { LABEL_STATUS_TRANSFER } from "../../../../features/transfer-stok/tampilan";
import { LABEL_TAHAP_PENGAJUAN } from "../../../../features/pengajuan-stok/tampilan";
import type { StatusTransfer } from "../../../../types/transferStok";

/*
 * Daftar surat jalan gudang berhalaman di server (B105, B108, B109): tab
 * dikirim sebagai status, ruang pengirim sebagai dariTipeLokasi (P8),
 * pencarian sebagai cari, dan total di bawah tabel dari pagination.total.
 */

const URL_GUDANG = BASIS + "/dashboard/gudang/transferStok";
const POLA = /\/api\/transferstok(\?|$)/i;

type SuratJalanMentah = { id?: string; nomorTransfer: string; status: string; dariLokasi?: { tipe?: string } | null };

const daftarSuratJalan = (syarat: (q: URLSearchParams) => boolean) => (r: Response) =>
  r.request().method() === "GET" && POLA.test(r.url()) && syarat(new URL(r.url()).searchParams);

/** Penunggu dipasang setelah dokumen baru ter-commit (lihat spec stok). */
async function buka(page: Page) {
  await page.goto(URL_GUDANG, { waitUntil: "commit" });
  const res = await page.waitForResponse(daftarSuratJalan((q) => q.get("page") === "1" && !q.has("status")));
  expect(res.status()).toBe(200);
  return res;
}

test.describe("Daftar surat jalan gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("tipe asal, halaman, dan ukuran dikirim ke server; total dari pagination", async ({ page }) => {
    const res = await buka(page);
    const q = new URL(res.url()).searchParams;
    expect(q.get("dariTipeLokasi"), "surat jalan yang dikirim gudang (P8, B109)").toBe("Gudang");
    expect(q.get("limit")).toBe("10");
    const body = (await res.json()) as { data: SuratJalanMentah[]; pagination?: { total: number } };
    expect(body.data.every((s) => s.dariLokasi?.tipe === "Gudang"), "server hanya mengirim surat jalan gudang").toBe(true);
    expect(body.pagination, "respons memuat pagination").toBeTruthy();
    await expect(page.getByText(body.pagination!.total + " total data", { exact: true })).toBeVisible();
  });

  test("badge status daftar memakai label status", async ({ page }) => {
    const res = await buka(page);
    const body = (await res.json()) as { data: SuratJalanMentah[] };
    test.skip(body.data.length === 0, "belum ada surat jalan");
    for (const sj of body.data.slice(0, 5)) {
      const baris = page.getByRole("row").filter({ hasText: sj.nomorTransfer });
      await expect(baris, sj.nomorTransfer).toContainText(LABEL_STATUS_TRANSFER[sj.status as StatusTransfer]);
    }
  });

  test("dialog batal surat jalan Belum Dikirim menjelaskan akibatnya, dan Tutup tidak mengirim", async ({ page }) => {
    await buka(page);
    const tPending = page.waitForResponse(daftarSuratJalan((q) => q.get("status") === "PENDING" && q.get("page") === "1"));
    await page.getByRole("button", { name: "Belum Dikirim", exact: true }).click();
    const pending = ((await (await tPending).json()) as { data: SuratJalanMentah[] }).data;
    test.skip(pending.length === 0, "tidak ada surat jalan Belum Dikirim untuk membuka dialog batal");
    const sj = pending[0];
    let terkirim = 0;
    page.on("request", (r) => {
      if (r.method() === "PUT" && /\/api\/transferstok\/[a-f0-9]{24}/i.test(r.url())) terkirim++;
    });
    await page.goto(`${URL_GUDANG}/${sj.id}`);
    await expect(page.getByText(LABEL_STATUS_TRANSFER.PENDING).first(), "badge detail").toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Batalkan Pengiriman" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText("Batalkan Surat Jalan?")).toBeVisible();
    await expect(dialog).toContainText(`kembali menjadi "${LABEL_TAHAP_PENGAJUAN.gudang.PERLU_SURAT_JALAN}"`);
    await dialog.getByRole("button", { name: "Tutup" }).click();
    await expect(dialog).toBeHidden();
    expect(terkirim, "Tutup tidak membatalkan").toBe(0);
  });

  test("tab mengirim status ke server dan kembali ke halaman 1", async ({ page }) => {
    await buka(page);
    const tTab = page.waitForResponse(daftarSuratJalan((q) => q.get("status") === "PENDING" && q.get("page") === "1"));
    await page.getByRole("button", { name: "Belum Dikirim", exact: true }).click();
    const body = (await (await tTab).json()) as { data: SuratJalanMentah[] };
    expect(body.data.every((s) => s.status === "PENDING")).toBe(true);
  });

  test("pencarian nomor dikirim ke server (B108)", async ({ page }) => {
    const res = await buka(page);
    const daftar = ((await res.json()) as { data: SuratJalanMentah[] }).data;
    test.skip(daftar.length < 2, "Butuh minimal dua surat jalan gudang");
    const [a, b] = daftar;

    const tCari = page.waitForResponse(
      daftarSuratJalan((q) => q.get("cari") === a.nomorTransfer && q.get("page") === "1"),
    );
    await page.getByPlaceholder(/^Cari No\. Transfer/).fill(a.nomorTransfer);
    const hasil = ((await (await tCari).json()) as { data: SuratJalanMentah[] }).data;

    expect(hasil.map((s) => s.nomorTransfer)).toContain(a.nomorTransfer);
    const baris = page.locator("table tbody tr");
    await expect(baris.filter({ hasText: a.nomorTransfer })).toHaveCount(1);
    await expect(baris.filter({ hasText: b.nomorTransfer })).toHaveCount(0);
  });
});