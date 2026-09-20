import { test, expect, Page, Response } from "@playwright/test";

const URL_BUAT_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/stockOpname/buatStockOpname";

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

async function ajukan(page: Page) {
  await page.getByRole("button", { name: "Ajukan Pengajuan Opname" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText("Kirim Pengajuan Opname?")).toBeVisible();
  const tSubmit = page.waitForResponse(patchAksi("submit"));
  await dialog.getByRole("button", { name: "Ya, Kirim Pengajuan" }).click();
  expect((await tSubmit).status()).toBe(200);
  await expect(page.getByRole("button", { name: "Setujui & Sesuaikan Stok" })).toBeVisible();
}

// ============================================================
// SKENARIO
// ============================================================
test.describe("Alur stock opname outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("buat, simpan, ajukan, gagal setujui, tolak, ajukan ulang, batalkan", async ({ page }) => {
    test.setTimeout(120_000);
    const catatan = `Uji e2e alur opname ${Date.now()}`;
    let id = "";
    let detail: DetailMentah;

    await test.step("buat draft dari lokasi aktif", async () => {
      await page.goto(URL_BUAT_OUTLET);
      await expect(page.getByRole("heading", { name: "Buat Draft Opname" })).toBeVisible();
      const tombol = page.getByRole("button", { name: /buat draft & mulai opname/i });
      await expect(tombol).toBeEnabled({ timeout: 15_000 });
      await page.getByPlaceholder("Misal: Audit rutin akhir bulan...").fill(catatan);

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

    await test.step("isi seluruh hitungan sama dengan stok sistem, lalu simpan", async () => {
      // Penunggu dipasang setelah dokumen baru ter-commit: respons detail
      // sebelum muat ulang sudah dibuang isinya (bagian 7, catatan Playwright).
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
      const resSimpan = await tSimpan;
      expect(resSimpan.status()).toBe(200);
      const body = resSimpan.request().postDataJSON() as {
        items: { itemId: string; qtyPhysical: number | null }[];
      };
      expect(body.items).toHaveLength(detail.items.length);
      for (const item of detail.items) {
        expect(body.items.find((b) => b.itemId === item.itemId)?.qtyPhysical).toBe(
          item.qtySystemSnapshot,
        );
      }
    });

    await test.step("ajukan", async () => {
      await ajukan(page);
    });

    await test.step("setujui yang gagal menampilkan pesan dan stok tidak berubah", async () => {
      const pola = "**/api/stockopname/*/approve";
      await page.route(pola, (route) =>
        route.request().method() === "PATCH"
          ? route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ status: "error", message: "uji gagal setujui" }),
            })
          : route.continue(),
      );
      await page.getByRole("button", { name: "Setujui & Sesuaikan Stok" }).click();
      const dialog = page.getByRole("alertdialog");
      await dialog.getByRole("button", { name: "Eksekusi Penyesuaian Stok" }).click();

      await expect(page.getByText("Gagal menyetujui")).toBeVisible();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.unroute(pola);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("alertdialog")).toBeHidden();
    });

    await test.step("tolak dengan alasan", async () => {
      await page.getByRole("button", { name: "Tolak (Revisi)" }).click();
      const dialog = page.getByRole("alertdialog");
      await dialog.getByPlaceholder("Misal: Harap hitung ulang bagian rak belakang.").fill("Uji e2e tolak");
      const tTolak = page.waitForResponse(patchAksi("reject"));
      await dialog.getByRole("button", { name: "Tolak Pengajuan" }).click();
      const resTolak = await tTolak;
      expect(resTolak.status()).toBe(200);
      expect(resTolak.request().postDataJSON()).toEqual({ catatanReview: "Uji e2e tolak" });
      await expect(page.getByRole("button", { name: "Simpan Angka Sementara" })).toBeVisible();
    });

    await test.step("ajukan ulang", async () => {
      await ajukan(page);
    });

    await test.step("batalkan permanen", async () => {
      await page.getByRole("button", { name: "Batalkan Sesi Opname" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog.getByText("Batalkan Sesi Opname?")).toBeVisible();
      const tBatal = page.waitForResponse(patchAksi("cancel"));
      await dialog.getByRole("button", { name: "Ya, Batalkan Permanen" }).click();
      expect((await tBatal).status()).toBe(200);

      await expect(page.getByRole("button", { name: "Setujui & Sesuaikan Stok" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Simpan Angka Sementara" })).toHaveCount(0);
    });
  });
});