import { test, expect, Page, Response } from "@playwright/test";

const URL_BUAT_GUDANG = "http://localhost:3000/dashboard/gudang/stockOpname/buatStockOpname";

type ItemMentah = {
  itemId: string;
  namaSnapshot: string;
  qtySystemSnapshot: number;
  qtyPhysical: number | null;
};
type DetailMentah = { id: string; nomorOpname: string; status: string; items: ItemMentah[] };

// ============================================================
// HELPER: Login
// ============================================================
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

// ============================================================
// HELPER: Respons server
// ============================================================
function patchAksi(aksi: string) {
  return (r: Response) =>
    r.request().method() === "PATCH" &&
    new RegExp(`/api/stockopname/[^/]+/${aksi}(\\?|$)`).test(r.url());
}

function getDetail(id: string) {
  return (r: Response) =>
    r.request().method() === "GET" && new RegExp(`/api/stockopname/${id}(\\?|$)`).test(r.url());
}

// ============================================================
// SKENARIO
// ============================================================
test.describe("Alur stock opname gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("buat dari halaman gudang, simpan, ajukan, batalkan", async ({ page }) => {
    test.setTimeout(120_000);
    const catatan = `Uji e2e alur opname gudang ${Date.now()}`;
    let id = "";
    let detail: DetailMentah;

    await test.step("buat draft dengan memilih gudang", async () => {
      await page.goto(URL_BUAT_GUDANG);
      await expect(page.getByRole("heading", { name: "Buat Draft Opname Gudang" })).toBeVisible();
      await expect(page.getByText("Memuat gudang...")).toHaveCount(0, { timeout: 15_000 });
      test.skip(
        await page.getByText("Gudang Belum Didaftarkan").isVisible(),
        "Akun uji belum punya gudang",
      );

      // Satu gudang terpilih otomatis; lebih dari satu dipilih lewat Select.
      const pemicu = page.getByText("Pilih Gudang...", { exact: true });
      if (await pemicu.isVisible()) {
        await pemicu.click();
        await page.getByRole("option").first().click();
      }

      const tombol = page.getByRole("button", { name: /buat draft & mulai opname/i });
      await expect(tombol).toBeEnabled({ timeout: 15_000 });
      await page.getByPlaceholder("Misal: Audit rutin bulanan Gudang Utama...").fill(catatan);

      const tBuat = page.waitForResponse(
        (r) => r.request().method() === "POST" && /\/api\/stockopname(\?|$)/.test(r.url()),
      );
      await tombol.click();
      const resBuat = await tBuat;
      if (!resBuat.ok()) {
        const pesan = JSON.stringify(await resBuat.json().catch(() => ({})));
        test.skip(/opname aktif/i.test(pesan), "Gudang terpilih masih punya opname DRAFT atau SUBMITTED");
        throw new Error("Pembuatan opname gagal: " + pesan);
      }

      await page.waitForURL(/\/gudang\/stockOpname\/(?!buatStockOpname)[^/]+$/);
      id = page.url().split("/").pop()!;
    });

    await test.step("isi seluruh hitungan sama dengan stok sistem, lalu simpan", async () => {
      // Penunggu dipasang setelah dokumen baru ter-commit (bagian 7, catatan Playwright).
      await page.reload({ waitUntil: "commit" });
      detail = await page.waitForResponse(getDetail(id)).then(async (r) => {
        expect(r.status()).toBe(200);
        return ((await r.json()) as { data: DetailMentah }).data;
      });
      expect(detail.status).toBe("DRAFT");
      expect(detail.items.length).toBeGreaterThan(0);

      const baris = page.locator("table tbody tr");
      for (const [i, item] of detail.items.entries()) {
        await expect(baris.nth(i)).toContainText(item.namaSnapshot);
        await baris.nth(i).getByPlaceholder("0").fill(String(item.qtySystemSnapshot));
      }

      const tSimpan = page.waitForResponse(patchAksi("items"));
      await page.getByRole("button", { name: "Simpan Angka Sementara" }).click();
      expect((await tSimpan).status()).toBe(200);
    });

    await test.step("ajukan", async () => {
      await page.getByRole("button", { name: "Ajukan Pengajuan Opname" }).click();
      const dialog = page.getByRole("alertdialog");
      const tSubmit = page.waitForResponse(patchAksi("submit"));
      await dialog.getByRole("button", { name: "Ya, Kirim Pengajuan" }).click();
      expect((await tSubmit).status()).toBe(200);
      await expect(page.getByRole("button", { name: "Setujui & Sesuaikan Stok" })).toBeVisible();
    });

    await test.step("batalkan permanen", async () => {
      await page.getByRole("button", { name: "Batalkan Sesi Opname" }).click();
      const dialog = page.getByRole("alertdialog");
      const tBatal = page.waitForResponse(patchAksi("cancel"));
      await dialog.getByRole("button", { name: "Ya, Batalkan Permanen" }).click();
      expect((await tBatal).status()).toBe(200);
      await expect(page.getByRole("button", { name: "Setujui & Sesuaikan Stok" })).toHaveCount(0);
    });
  });
});