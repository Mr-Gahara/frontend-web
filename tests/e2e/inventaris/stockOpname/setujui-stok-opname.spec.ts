import { test, expect, type Page, type Response } from "@playwright/test";
import { masuk } from "../../../helpers/masuk-uji";

/**
 * Jalur berhasil Setujui & Sesuaikan Stok (utang pengujian "approve stock
 * opname yang berhasil"; pemilik proyek, 20 November 2026: diuji sungguhan
 * dan data yang menumpuk diterima). Hitungan fisik diisi sama dengan stok
 * sistem, sehingga stok tidak bergeser, tetapi dokumen APPROVED tertinggal
 * permanen satu per run.
 */

const URL_BUAT_OUTLET = "/dashboard/outlet/inventaris/stockOpname/buatStockOpname";

type ItemMentah = { itemId: string; namaSnapshot: string; qtySystemSnapshot: number; qtyPhysical: number | null };
type DetailMentah = { id: string; nomorOpname: string; status: string; items: ItemMentah[] };

const patchAksi = (aksi: string) => (r: Response) =>
  r.request().method() === "PATCH" && new RegExp(`/api/stockopname/[^/]+/${aksi}(\\?|$)`).test(r.url());
const getDetail = (id: string) => (r: Response) =>
  r.request().method() === "GET" && new RegExp(`/api/stockopname/${id}(\\?|$)`).test(r.url());

async function bacaDetail(page: Page, id: string): Promise<DetailMentah> {
  const res = await page.waitForResponse(getDetail(id));
  expect(res.status()).toBe(200);
  return ((await res.json()) as { data: DetailMentah }).data;
}

test("opname outlet disetujui dan stok disesuaikan", async ({ page }) => {
  test.setTimeout(120_000);
  await masuk(page);
  let id = "";

  await test.step("buat draft", async () => {
    await page.goto(URL_BUAT_OUTLET);
    const tombol = page.getByRole("button", { name: /buat draft & mulai opname/i });
    await expect(tombol).toBeEnabled({ timeout: 15_000 });
    await page.getByPlaceholder("Misal: Audit rutin akhir bulan...").fill(`Uji e2e setujui opname ${Date.now()}`);
    const tBuat = page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/stockopname(\?|$)/.test(r.url()));
    await tombol.click();
    const res = await tBuat;
    if (!res.ok()) {
      const pesan = JSON.stringify(await res.json().catch(() => ({})));
      test.skip(/opname aktif/i.test(pesan), "Lokasi aktif masih punya opname DRAFT atau SUBMITTED");
      throw new Error("Pembuatan opname gagal: " + pesan);
    }
    await page.waitForURL(/\/stockOpname\/(?!buatStockOpname)[^/]+$/);
    id = page.url().split("/").pop()!;
  });

  await test.step("isi hitungan sama dengan stok sistem, simpan, dan ajukan", async () => {
    await page.reload({ waitUntil: "commit" });
    const detail = await bacaDetail(page, id);
    const baris = page.locator("table tbody tr");
    for (const [i, item] of detail.items.entries()) {
      await baris.nth(i).getByPlaceholder("0").fill(String(item.qtySystemSnapshot));
    }
    const tSimpan = page.waitForResponse(patchAksi("items"));
    await page.getByRole("button", { name: "Simpan Angka Sementara" }).click();
    expect((await tSimpan).status()).toBe(200);

    await page.getByRole("button", { name: "Ajukan Pengajuan Opname" }).click();
    const tSubmit = page.waitForResponse(patchAksi("submit"));
    await page.getByRole("alertdialog").getByRole("button", { name: "Ya, Kirim Pengajuan" }).click();
    expect((await tSubmit).status()).toBe(200);
  });

  await test.step("setujui: dokumen APPROVED dan tombol tinjau hilang", async () => {
    await page.getByRole("button", { name: "Setujui & Sesuaikan Stok" }).click();
    const tSetujui = page.waitForResponse(patchAksi("approve"));
    await page.getByRole("alertdialog").getByRole("button", { name: "Eksekusi Penyesuaian Stok" }).click();
    expect((await tSetujui).status()).toBe(200);
    await expect(page.getByText("Opname Disetujui")).toBeVisible();
    await expect(page.getByRole("button", { name: "Setujui & Sesuaikan Stok" })).toHaveCount(0);

    await page.reload({ waitUntil: "commit" });
    const detail = await bacaDetail(page, id);
    expect(detail.status).toBe("APPROVED");
    for (const item of detail.items) expect(item.qtyPhysical).toBe(item.qtySystemSnapshot);
  });
});
