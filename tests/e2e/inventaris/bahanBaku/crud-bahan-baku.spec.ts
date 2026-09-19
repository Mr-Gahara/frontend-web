import { expect, test, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const DAFTAR = "/dashboard/outlet/inventaris/bahanBaku";

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /masuk|login/i }).click();

  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL("**/dashboard/**", { timeout: 15_000 });
}

async function bukaDaftar(page: Page) {
  await page.goto(`${BASE}${DAFTAR}`);
  await expect(page.getByRole("heading", { name: /bahan baku/i })).toBeVisible({
    timeout: 15_000,
  });
}

function barisBahan(page: Page, nama: string) {
  return page.locator("tbody tr").filter({ hasText: nama });
}

async function cari(page: Page, nama: string) {
  const input = page.getByPlaceholder(/cari/i).first();
  await input.clear();
  await input.fill(nama);
}

test.describe("E2E - Bahan Baku (CRUD)", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
    await bukaDaftar(page);
  });

  test("happy path: tambah dengan stok awal → cari → edit → hapus", async ({
    page,
  }) => {
    const nama = `Bahan E2E ${Date.now()}`;
    const namaEdit = `${nama} Edited`;

    await test.step("Tambah bahan baku dengan stok dan batas minimum", async () => {
      await page.getByRole("button", { name: /tambah bahan baru/i }).click();
      await page.waitForURL("**/buatBahanBaku");

      await page.getByLabel(/nama bahan baku/i).fill(nama);

      // Satuan dipilih lebih dulu: perubahan Select memicu render ulang
      // yang mengembalikan input angka ke nilai awal.
      await page.getByRole("combobox").first().click();
      await page.getByRole("option", { name: "gram", exact: true }).click();

      // Stok awal dan batas minimum diinjeksi backend ke entri inventory.
      await page.getByLabel(/stok awal/i).fill("50");
      await page.getByLabel(/batas stok minimum/i).fill("10");
      await expect(page.getByLabel(/stok awal/i)).toHaveValue("50");

      await page.getByRole("button", { name: /simpan/i }).click();
      await page.waitForURL(`**${DAFTAR}`, { timeout: 15_000 });
    });

    await test.step("Bahan baku tampil di tabel stok", async () => {
      await cari(page, nama);
      const baris = barisBahan(page, nama);
      await expect(baris).toBeVisible({ timeout: 15_000 });
      await expect(baris).toContainText("50");
    });

    await test.step("Batas stok minimum tersimpan, tidak lagi selalu 0", async () => {
      // Regresi: form sebelumnya mengirim minimalStok sedangkan backend
      // membaca stokMinimum, sehingga nilainya tidak pernah tersimpan.
      await expect(barisBahan(page, nama)).toContainText("10");
    });

    await test.step("Edit nama bahan baku", async () => {
      await barisBahan(page, nama).getByRole("button", { name: /edit master/i }).click();
      await page.waitForURL("**/edit", { timeout: 15_000 });

      const inputNama = page.getByLabel(/nama bahan baku/i);
      await expect(inputNama).toHaveValue(nama, { timeout: 15_000 });
      await inputNama.fill(namaEdit);

      await page.getByRole("button", { name: /simpan/i }).click();
      await page.waitForURL(`**${DAFTAR}`, { timeout: 15_000 });

      await cari(page, namaEdit);
      await expect(barisBahan(page, namaEdit)).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Hapus bahan baku", async () => {
      await barisBahan(page, namaEdit)
        .getByRole("button", { name: /hapus bahan baku/i })
        .click();

      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: /hapus/i }).click();

      // Toast Sonner menutup sendiri setelah beberapa detik, sehingga bukti
      // keberhasilan diambil dari hilangnya baris di tabel.
      await expect(barisBahan(page, namaEdit)).toHaveCount(0, { timeout: 15_000 });
    });
  });

  test("unhappy: nama kosong ditolak sebelum dikirim ke backend", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /tambah bahan baru/i }).click();
    await page.waitForURL("**/buatBahanBaku");

    await page.getByRole("button", { name: /simpan/i }).click();

    await expect(page.getByText(/nama bahan baku wajib diisi/i)).toBeVisible();
    await expect(page).toHaveURL(/buatBahanBaku/);
  });

  test("pencarian: nama yang tidak ada menghasilkan tabel kosong", async ({
    page,
  }) => {
    await cari(page, `Tidak Ada ${Date.now()}`);
    await expect(page.locator("tbody tr")).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator("tbody")).toContainText(/tidak ada|kosong|belum ada/i);
  });
});
