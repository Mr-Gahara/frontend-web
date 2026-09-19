import { expect, test, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const DAFTAR = "/dashboard/outlet/pengaturan/roles";

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
  await expect(page.getByRole("heading", { name: /posisi|role/i }).first()).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Kartu role pada daftar: div terluar yang memuat nama sekaligus tombol
 * aksinya. Memfilter div terdalam tidak cukup, karena nama dan tombol
 * berada di cabang yang berbeda.
 */
function kartuRole(page: Page, nama: string) {
  return page
    .locator("div")
    .filter({ hasText: nama })
    .filter({ has: page.getByRole("button", { name: /edit/i }) })
    .last();
}

/** Menghapus role bila masih ada, agar pengulangan test tidak menumpuk data. */
async function bersihkanRole(page: Page, nama: string) {
  await bukaDaftar(page);
  const tombolHapus = kartuRole(page, nama)
    .getByRole("button", { name: /hapus/i })
    .first();

  // Tombol hapus sempat disabled sampai daftar role selesai dimuat, karena
  // level pengguna aktif diturunkan dari daftar itu. Melewatinya saat belum
  // terlihat membuat penghapusan tidak pernah terkirim.
  await expect(tombolHapus).toBeEnabled({ timeout: 15_000 });
  await tombolHapus.click();

  // Dialog konfirmasi perlu ditunggu; memeriksa isVisible tanpa menunggu
  // membuat kliknya kadang terlewat dan role tidak jadi terhapus.
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole("button", { name: /hapus/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

test.describe("E2E - Role (CRUD)", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
    await bukaDaftar(page);
  });

  test("form kustom membuka dengan wewenang dasar sudah terpilih", async ({
    page,
  }) => {
    await page.goto(`${BASE}${DAFTAR}/buatRole/kostum`);

    // IZIN_DASAR (read-akun dan read-tenant) wajib terpilih sejak awal,
    // agar posisi baru selalu dapat membuka aplikasi.
    const kotakTerpilih = page.getByRole("checkbox", { checked: true });
    await expect(kotakTerpilih.first()).toBeVisible({ timeout: 15_000 });
    expect(await kotakTerpilih.count()).toBeGreaterThanOrEqual(2);
  });

  test("melepas wewenang dasar memunculkan peringatan", async ({ page }) => {
    await page.goto(`${BASE}${DAFTAR}/buatRole/kostum`);
    await expect(page.getByRole("checkbox").first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("checkbox", { checked: true }).first().click();

    // Wewenang dasar tidak boleh dilepas tanpa konfirmasi.
    await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 10_000 });
  });

  test("happy path: buat posisi kustom, edit namanya, lalu hapus", async ({
    page,
  }) => {
    const nama = `Posisi E2E ${Date.now()}`;
    const namaEdit = `${nama} Edited`;

    await test.step("Buat posisi kustom", async () => {
      await page.goto(`${BASE}${DAFTAR}/buatRole/kostum`);

      await page.getByLabel(/nama posisi|nama role/i).fill(nama);
      await page.getByLabel(/level/i).fill("1");

      await page.getByRole("button", { name: /simpan/i }).click();
      // Halaman form berada di bawah path daftar, sehingga kembalinya
      // diperiksa lewat URL yang berakhir tepat di daftar.
      await expect(page).toHaveURL(new RegExp(`${DAFTAR}$`), { timeout: 15_000 });
    });

    await test.step("Posisi tampil di daftar", async () => {
      await expect(page.getByText(nama).first()).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Edit nama posisi", async () => {
      await kartuRole(page, nama).getByRole("button", { name: /edit/i }).first().click();
      await page.waitForURL("**/edit", { timeout: 15_000 });

      const inputNama = page.getByLabel(/nama posisi|nama role/i);
      await expect(inputNama).toHaveValue(nama, { timeout: 15_000 });
      await inputNama.fill(namaEdit);

      await page.getByRole("button", { name: /simpan/i }).click();
      // Halaman form berada di bawah path daftar, sehingga kembalinya
      // diperiksa lewat URL yang berakhir tepat di daftar.
      await expect(page).toHaveURL(new RegExp(`${DAFTAR}$`), { timeout: 15_000 });

      await expect(page.getByText(namaEdit).first()).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Hapus posisi", async () => {
      await bersihkanRole(page, namaEdit);
      await expect(page.getByText(namaEdit)).toHaveCount(0, { timeout: 15_000 });
    });
  });
});
