import { test, expect, Page, Response } from "@playwright/test";
import { masuk } from "../../../helpers/masuk-uji";

const URL_DAFTAR_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/stockOpname";
const URL_BUAT_OUTLET = `${URL_DAFTAR_OUTLET}/buatStockOpname`;

type ItemMentah = {
  itemId: string;
  namaSnapshot: string;
  qtySystemSnapshot: number;
  qtyPhysical: number | null;
};
type DetailMentah = { id: string; status: string; items: ItemMentah[] };

async function login(page: Page) {
  await masuk(page);
}

function patchAksi(aksi: string) {
  return (r: Response) =>
    r.request().method() === "PATCH" &&
    new RegExp(`/api/stockopname/[^/]+/${aksi}(\\?|$)`).test(r.url());
}

test.describe("Draft stock opname outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("simpan sebagian hitungan, kosongkan kembali, lalu batalkan langsung dari DRAFT", async ({ page }) => {
    test.setTimeout(120_000);
    let id = "";
    let detail: DetailMentah;

    await test.step("buat draft dari lokasi aktif", async () => {
      await page.goto(URL_BUAT_OUTLET);
      const tombol = page.getByRole("button", { name: /buat draft & mulai opname/i });
      await expect(tombol).toBeEnabled({ timeout: 15_000 });
      await page.getByPlaceholder("Misal: Audit rutin akhir bulan...").fill(`Uji e2e draft ${Date.now()}`);

      const tBuat = page.waitForResponse(
        (r) => r.request().method() === "POST" && /\/api\/stockopname(\?|$)/.test(r.url()),
      );
      await tombol.click();
      const resBuat = await tBuat;
      if (!resBuat.ok()) {
        const pesan = JSON.stringify(await resBuat.json().catch(() => ({})));
        test.skip(/opname aktif/i.test(pesan), "Lokasi aktif masih punya opname DRAFT atau SUBMITTED");
        throw new Error("Pembuatan opname gagal: " + pesan);
      }
      await page.waitForURL(/\/stockOpname\/(?!buatStockOpname)[^/]+$/);
      id = page.url().split("/").pop()!;
    });

    await test.step("simpan hanya hitungan item pertama", async () => {
      await page.reload({ waitUntil: "commit" });
      detail = await page
        .waitForResponse(
          (r) =>
            r.request().method() === "GET" && new RegExp(`/api/stockopname/${id}(\\?|$)`).test(r.url()),
        )
        .then(async (r) => ((await r.json()) as { data: DetailMentah }).data);
      expect(detail.status).toBe("DRAFT");

      const pertama = detail.items[0];
      const baris = page.locator("table tbody tr").nth(0);
      await expect(baris).toContainText(pertama.namaSnapshot);
      await baris.getByPlaceholder("0").fill(String(pertama.qtySystemSnapshot));

      const tSimpan = page.waitForResponse(patchAksi("items"));
      await page.getByRole("button", { name: "Simpan Angka Sementara" }).click();
      const resSimpan = await tSimpan;
      expect(resSimpan.status()).toBe(200);
      expect(resSimpan.request().postDataJSON()).toEqual({
        items: [{ itemId: pertama.itemId, qtyPhysical: pertama.qtySystemSnapshot }],
      });
    });

    await test.step("hitungan tersimpan dapat dikosongkan kembali (butir 22, B98)", async () => {
      const responsDetail = (r: Response) =>
        r.request().method() === "GET" && r.url().split("?")[0].endsWith("/api/stockopname/" + id);
      const bacaItemPertama = async (r: Response) =>
        ((await r.json()) as { data: DetailMentah }).data.items[0];
      const pertama = detail.items[0];
      const baris = page.locator("table tbody tr").nth(0);

      await page.reload({ waitUntil: "commit" });
      const tersimpan = await page.waitForResponse(responsDetail).then(bacaItemPertama);
      expect(tersimpan.qtyPhysical).toBe(pertama.qtySystemSnapshot);
      await expect(baris.getByPlaceholder("0")).toHaveValue(String(pertama.qtySystemSnapshot));

      await baris.getByPlaceholder("0").fill("");
      const tKosong = page.waitForResponse(patchAksi("items"));
      await page.getByRole("button", { name: "Simpan Angka Sementara" }).click();
      const resKosong = await tKosong;
      expect(resKosong.status()).toBe(200);
      expect(resKosong.request().postDataJSON()).toEqual({
        items: [{ itemId: pertama.itemId, qtyPhysical: null }],
      });

      await page.reload({ waitUntil: "commit" });
      const setelah = await page.waitForResponse(responsDetail).then(bacaItemPertama);
      expect(setelah.qtyPhysical).toBeNull();
      await expect(baris.getByPlaceholder("0")).toHaveValue("");
    });

    await test.step("hitung per kemasan: 1 kaleng + 10 ml dikirim sebagai rincianFisik (B366)", async () => {
      // Bahan fixture "E2E Bahan Kaleng" (ml, kaleng = 290) dari spec konversi satuan.
      const kaleng = detail.items.find((i) => i.namaSnapshot === "E2E Bahan Kaleng");
      test.skip(!kaleng, "Bahan fixture E2E Bahan Kaleng belum ada di lokasi aktif");
      const baris = page.locator("table tbody tr").filter({ hasText: "E2E Bahan Kaleng" });
      await baris.getByLabel("Jumlah 1 stok fisik E2E Bahan Kaleng").fill("1");
      await baris.getByLabel("Satuan 1 stok fisik E2E Bahan Kaleng").click();
      await page.getByRole("option", { name: "kaleng (290 ml)" }).click();
      await baris.getByRole("button", { name: "+ Tambah satuan" }).click();
      await baris.getByLabel("Jumlah 2 stok fisik E2E Bahan Kaleng").fill("10");
      await expect(baris).toContainText("= 300 ml");
      const tSimpan = page.waitForResponse(patchAksi("items"));
      await page.getByRole("button", { name: "Simpan Angka Sementara" }).click();
      const res = await tSimpan;
      expect(res.status()).toBe(200);
      expect(res.request().postDataJSON()).toEqual({
        items: [
          {
            itemId: kaleng!.itemId,
            rincianFisik: [
              { satuan: "kaleng", jumlah: 1 },
              { satuan: "ml", jumlah: 10 },
            ],
          },
        ],
      });
      const item = ((await res.json()) as { data: { items: (ItemMentah & { rincianFisik?: unknown[] })[] } }).data.items.find(
        (i) => i.itemId === kaleng!.itemId,
      );
      expect(item?.qtyPhysical, "dijumlah server ke satuan dasar").toBe(300);
    });

    await test.step("batalkan dari DRAFT", async () => {
      await page.getByRole("button", { name: "Batalkan Sesi Opname" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog.getByText("Batalkan Sesi Opname?")).toBeVisible();
      const tBatal = page.waitForResponse(patchAksi("cancel"));
      await dialog.getByRole("button", { name: "Ya, Batalkan Permanen" }).click();
      expect((await tBatal).status()).toBe(200);
      await expect(dialog).toBeHidden();
      await expect(page.getByRole("button", { name: "Simpan Angka Sementara" })).toHaveCount(0);
    });
  });

  test("dokumen yang tidak ada menampilkan pesan dan kembali ke daftar outlet", async ({ page }) => {
    await page.goto(`${URL_DAFTAR_OUTLET}/000000000000000000000000`);
    await expect(page.getByText("Dokumen stok opname tidak ditemukan.")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Kembali ke Daftar" }).click();
    await page.waitForURL(/\/dashboard\/outlet\/inventaris\/stockOpname$/);
  });
});