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

  test("happy path: tambah dengan stok awal → cari → edit", async ({
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
      await barisBahan(page, nama).getByRole("button", { name: "Buka menu" }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await page.waitForURL("**/edit", { timeout: 15_000 });

      const inputNama = page.getByLabel(/nama bahan baku/i);
      await expect(inputNama).toHaveValue(nama, { timeout: 15_000 });
      await inputNama.fill(namaEdit);

      await page.getByRole("button", { name: /simpan/i }).click();
      await page.waitForURL(`**${DAFTAR}`, { timeout: 15_000 });

      await cari(page, namaEdit);
      await expect(barisBahan(page, namaEdit)).toBeVisible({ timeout: 15_000 });
    });
  });

  // Menunggu backend: entri stok yang dibuat otomatis saat bahan dibuat
  // dihitung sebagai keterkaitan (label "stok lokasi" di bahanBakuService,
  // backend yoga 3b2417d), sehingga bahan yang baru dibuat pun ditolak 409.
  // Aturan pemilik proyek: bahan yang belum punya riwayat (resep, opname,
  // transfer, pengajuan, pembelian, jurnal) dapat dihapus walau diisi stok
  // awal dan batas minimum. Bukti diambil dari respons DELETE dan dari daftar
  // yang dibaca ulang, bukan dari baris yang sesaat tidak ada di tabel.
  test.fixme("bahan yang baru dibuat dapat dihapus walau diisi stok awal dan batas minimum", async ({ page }) => {
    const nama = `Bahan E2E Hapus ${Date.now()}`;

    await page.getByRole("button", { name: /tambah bahan baru/i }).click();
    await page.waitForURL("**/buatBahanBaku");
    await page.getByLabel(/nama bahan baku/i).fill(nama);
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "gram", exact: true }).click();
    await page.getByLabel(/stok awal/i).fill("50");
    await page.getByLabel(/batas stok minimum/i).fill("10");
    await page.getByRole("button", { name: /simpan/i }).click();
    await page.waitForURL(`**${DAFTAR}`, { timeout: 15_000 });

    await cari(page, nama);
    await expect(barisBahan(page, nama)).toBeVisible({ timeout: 15_000 });
    await barisBahan(page, nama).getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    const tHapus = page.waitForResponse(
      (r) => r.request().method() === "DELETE" && /\/api\/bahanbaku\/[a-f0-9]{24}$/i.test(r.url()),
    );
    await dialog.getByRole("button", { name: /hapus/i }).click();
    const hapus = await tHapus;
    expect(hapus.status(), `DELETE /bahanbaku: ${(await hapus.text()).slice(0, 200)}`).toBe(200);
    await expect(dialog).toBeHidden();

    await page.reload();
    const tDaftar = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/inventory\?/i.test(r.url()) && r.url().includes("search="),
    );
    await cari(page, nama);
    const daftar = (await (await tDaftar).json()) as { data?: unknown[] };
    expect(daftar.data ?? [], "entri stok bahan ikut terhapus").toHaveLength(0);
    await expect(barisBahan(page, nama)).toHaveCount(0);
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
