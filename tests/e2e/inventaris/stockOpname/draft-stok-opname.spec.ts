import { test, expect, Page, Request, Response } from "@playwright/test";

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

function patchAksi(aksi: string) {
  return (r: Response) =>
    r.request().method() === "PATCH" &&
    new RegExp(`/api/stockopname/[^/]+/${aksi}(\\?|$)`).test(r.url());
}

test.describe("Draft stock opname outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("simpan sebagian hitungan, tahan pengosongan, lalu batalkan langsung dari DRAFT", async ({ page }) => {
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

    await test.step("pengosongan hitungan tersimpan ditahan dengan pesan", async () => {
      const responsDetail = (r: Response) =>
        r.request().method() === "GET" && r.url().split("?")[0].endsWith("/api/stockopname/" + id);
      const pertama = detail.items[0];
      const baris = page.locator("table tbody tr").nth(0);
      const tombolSimpan = page.getByRole("button", { name: "Simpan Angka Sementara" });

      await page.reload({ waitUntil: "commit" });
      const tersimpan = await page
        .waitForResponse(responsDetail)
        .then(async (r) => ((await r.json()) as { data: DetailMentah }).data.items[0]);
      expect(tersimpan.qtyPhysical).toBe(pertama.qtySystemSnapshot);
      await expect(baris.getByPlaceholder("0")).toHaveValue(String(pertama.qtySystemSnapshot));

      let patchTerkirim = 0;
      const catatPatch = (req: Request) => {
        if (req.method() === "PATCH" && req.url().includes("/api/stockopname/")) patchTerkirim++;
      };
      page.on("request", catatPatch);
      await baris.getByPlaceholder("0").fill("");
      await tombolSimpan.click();
      await expect(page.getByText("Sebagian perubahan tidak disimpan")).toBeVisible();
      await baris.getByPlaceholder("0").fill(String(pertama.qtySystemSnapshot));
      await tombolSimpan.click();
      await expect(page.getByText("Tidak ada perubahan untuk disimpan.")).toBeVisible();
      page.off("request", catatPatch);
      expect(patchTerkirim).toBe(0);
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

  // Menunggu backend: stockOpnameService.updateItems menjalankan validateUpdateItems
  // yang menolak qtyPhysical null maupun tidak dikirim (kontrak/temuan.md butir 22).
  // Setelah diperbaiki: ubah SERVER_TERIMA_HITUNGAN_KOSONG di
  // features/stock-opname/payload.ts menjadi true, lalu tulis skenario di sini:
  // simpan satu hitungan, kosongkan, pastikan PATCH mengirim qtyPhysical null dan
  // dijawab 200, muat ulang dan pastikan isiannya tetap kosong, lalu batalkan draft.
  test.fixme("hitungan tersimpan dapat dikosongkan kembali", async () => {});

  test("dokumen yang tidak ada menampilkan pesan dan kembali ke daftar outlet", async ({ page }) => {
    await page.goto(`${URL_DAFTAR_OUTLET}/000000000000000000000000`);
    await expect(page.getByText("Dokumen stok opname tidak ditemukan.")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Kembali ke Daftar" }).click();
    await page.waitForURL(/\/dashboard\/outlet\/inventaris\/stockOpname$/);
  });
});