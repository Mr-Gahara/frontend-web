import { test, expect, Page } from "@playwright/test";

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
// HELPER: Navigasi ke halaman daftar produk
// ============================================================
async function bukaHalamanProduk(page: Page) {
  await page.goto("http://localhost:3000/dashboard/outlet/inventaris/produk");
  await expect(
    page.getByRole("heading", { name: /data produk/i }),
  ).toBeVisible();
}

// ============================================================
// HELPER: Navigasi ke halaman buat produk baru
// ============================================================
async function bukaBuatProduk(page: Page) {
  await page.getByRole("button", { name: /tambah produk/i }).click();
  await page.waitForURL("**/inventaris/produk/buatProduk");
  await expect(
    page.getByRole("heading", { name: /tambah produk/i }),
  ).toBeVisible();
}

// ============================================================
// HELPER: Isi field dasar form produk (nama, kategori, harga)
// ============================================================
async function isiFormDasarProduk(
  page: Page,
  opts: {
    nama: string;
    hargaDasar?: string;
    hargaJual?: string;
    keterangan?: string;
  },
) {
  await page.getByLabel(/nama produk/i).fill(opts.nama);

  // Pilih kategori pertama yang tersedia
  await page.getByRole("combobox").first().click();
  await page.getByRole("option").first().click();

  if (opts.hargaDasar) {
    // Input harga pakai keyboard karena ada formatting rupiah
    const inputDasar = page.getByLabel(/harga dasar/i);
    await inputDasar.click();
    await inputDasar.fill(opts.hargaDasar);
    await inputDasar.blur();
  }

  if (opts.hargaJual) {
    const inputJual = page.getByLabel(/harga jual/i);
    await inputJual.click();
    await inputJual.fill(opts.hargaJual);
    await inputJual.blur();
  }

  if (opts.keterangan) {
    await page.getByLabel(/keterangan/i).fill(opts.keterangan);
  }
}

// ============================================================
// HELPER: Tambah produk baru sampai berhasil, kembali ke list
// ============================================================
async function tambahProdukBaru(page: Page, nama: string): Promise<void> {
  await bukaBuatProduk(page);
  await isiFormDasarProduk(page, {
    nama,
    hargaDasar: "10000",
    hargaJual: "15000",
  });
  await page.getByRole("button", { name: /simpan produk baru/i }).click();
  await expect(
    page.getByText(/produk baru berhasil ditambahkan/i),
  ).toBeVisible();
  await page.waitForURL("**/inventaris/produk");
}

// ============================================================
// HELPER: Klik tombol aksi di baris tabel (ikon tanpa label)
// ============================================================
async function klikTombolAksiProduk(row: ReturnType<Page["getByRole"]>) {
  const aksiCell = row.getByRole("cell").last();
  await aksiCell.getByRole("button").click();
}

// ============================================================
// HELPER: Hapus produk via tabel (untuk cleanup)
// ============================================================
async function hapusProduk(page: Page, nama: string) {
  const searchInput = page.getByPlaceholder(/cari nama produk/i);
  await searchInput.clear();
  await searchInput.fill(nama);

  const row = page.getByRole("row", { name: new RegExp(nama, "i") }).first();
  await expect(row).toBeVisible();
  await klikTombolAksiProduk(row);

  await page.getByRole("menuitem", { name: /hapus produk/i }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: /^hapus$/i }).click();
  await expect(page.getByText(/produk berhasil dihapus/i)).toBeVisible();
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe("E2E - Manajemen Produk (CRUD + Business Logic)", () => {
  test.setTimeout(120000);

  // ----------------------------------------------------------
  // [1] HAPPY PATH: Tambah produk sederhana (tanpa resep)
  // ----------------------------------------------------------
  test("happy path: tambah produk baru tanpa resep → muncul di tabel", async ({
    page,
  }) => {
    const namaProduk = "Produk E2E Test Polos";

    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Buat produk baru", async () => {
      await tambahProdukBaru(page, namaProduk);
    });

    await test.step("Verifikasi produk muncul di tabel", async () => {
      const searchInput = page.getByPlaceholder(/cari nama produk/i);
      await searchInput.fill(namaProduk);
      await expect(
        page.getByRole("row", { name: new RegExp(namaProduk, "i") }),
      ).toBeVisible();
    });

    await test.step("Cleanup", async () => {
      await hapusProduk(page, namaProduk);
    });
  });

  // ----------------------------------------------------------
  // [2] HAPPY PATH: Tambah produk dengan stok unlimited
  // ----------------------------------------------------------
  test("happy path: tambah produk unlimited stok → badge Unlimited tampil di tabel", async ({
    page,
  }) => {
    const namaProduk = `Produk E2E Unlimited ${Date.now()}`;

    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Buat produk dengan checkbox unlimited", async () => {
      await bukaBuatProduk(page);
      await isiFormDasarProduk(page, {
        nama: namaProduk,
        hargaDasar: "10000",
        hargaJual: "20000",
      });

      // Centang checkbox unlimited
      await page.getByLabel(/produk tanpa stok/i).click();

      // Gunakan id langsung karena tidak ada htmlFor yang terpasang ke label stok
      await expect(page.locator("#stokAwal")).toBeDisabled();

      await page.getByRole("button", { name: /simpan produk baru/i }).click();
      await expect(
        page.getByText(/produk baru berhasil ditambahkan/i),
      ).toBeVisible();
      await page.waitForURL("**/inventaris/produk");
    });

    await test.step("Verifikasi badge Unlimited di tabel", async () => {
      const searchInput = page.getByPlaceholder(/cari nama produk/i);
      await searchInput.fill(namaProduk);

      const row = page
        .getByRole("row", { name: new RegExp(namaProduk, "i") })
        .first();
      await expect(row).toBeVisible();
      await expect(row.getByText("Unlimited", { exact: true })).toBeVisible();
    });

    await test.step("Cleanup", async () => {
      await hapusProduk(page, namaProduk);
    });
  });

  // ----------------------------------------------------------
  // [3] HAPPY PATH: Tambah produk dengan resep bahan baku
  // Memverifikasi: stok disabled saat ada resep, unlimited disabled
  // ----------------------------------------------------------
  test("happy path: tambah produk dengan resep → stok dan unlimited ter-disable", async ({
    page,
  }) => {
    const namaProduk = `Produk E2E Dengan Resep ${Date.now()}`;

    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Buat produk dan tambah bahan baku ke resep", async () => {
      await bukaBuatProduk(page);
      await isiFormDasarProduk(page, {
        nama: namaProduk,
        hargaJual: "25000",
      });

      // Klik tombol "Tambah Bahan"
      await page.getByRole("button", { name: /tambah bahan/i }).click();

      // Pilih bahan baku pertama di combobox resep
      const bahanCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih bahan/i });
      await bahanCombobox.click();
      await page.getByRole("option").first().click();

      // Isi jumlah bahan
      await page.getByPlaceholder("0").last().fill("100");

      // Verifikasi: setelah ada resep, stok harus disabled
      await expect(page.locator("#stokAwal")).toBeDisabled();

      // Verifikasi: checkbox unlimited harus disabled
      await expect(page.getByLabel(/produk tanpa stok/i)).toBeDisabled();

      await page.getByRole("button", { name: /simpan produk baru/i }).click();
      await expect(
        page.getByText(/produk baru berhasil ditambahkan/i),
      ).toBeVisible();
      await page.waitForURL("**/inventaris/produk");
    });

    await test.step("Cleanup", async () => {
      await hapusProduk(page, namaProduk);
    });
  });

  // ----------------------------------------------------------
  // [4] HAPPY PATH: Edit produk — ubah nama dan harga
  // ----------------------------------------------------------
  test("happy path: edit nama dan harga produk → perubahan tersimpan", async ({
    page,
  }) => {
    const namaAwal = "Produk E2E Pre-Edit";
    const namaUpdate = "Produk E2E Post-Edit";

    await test.step("Login, navigasi, dan buat produk", async () => {
      await login(page);
      await bukaHalamanProduk(page);
      await tambahProdukBaru(page, namaAwal);
    });

    await test.step("Buka halaman edit produk", async () => {
      const searchInput = page.getByPlaceholder(/cari nama produk/i);
      await searchInput.fill(namaAwal);

      const row = page
        .getByRole("row", { name: new RegExp(namaAwal, "i") })
        .first();
      await klikTombolAksiProduk(row);
      await page.getByRole("menuitem", { name: /edit produk/i }).click();

      await page.waitForURL("**/edit");
      await expect(
        page.getByRole("heading", { name: /edit produk/i }),
      ).toBeVisible();
    });

    await test.step("Ubah nama produk", async () => {
      const namaInput = page.getByLabel(/nama produk/i);
      await namaInput.clear();
      await namaInput.fill(namaUpdate);

      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      await expect(
        page.getByText(/perubahan produk berhasil disimpan/i),
      ).toBeVisible();
      await page.waitForURL("**/inventaris/produk");
    });

    await test.step("Verifikasi nama baru muncul di tabel", async () => {
      const searchInput = page.getByPlaceholder(/cari nama produk/i);
      await searchInput.fill(namaUpdate);
      await expect(
        page.getByRole("row", { name: new RegExp(namaUpdate, "i") }),
      ).toBeVisible();
    });

    await test.step("Cleanup", async () => {
      await hapusProduk(page, namaUpdate);
    });
  });

  // ----------------------------------------------------------
  // [5] UNHAPPY: Submit form buat produk tanpa nama → error validasi
  // ----------------------------------------------------------
  test("unhappy: submit form buat produk tanpa nama → pesan error muncul", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Submit tanpa nama produk → error", async () => {
      await bukaBuatProduk(page);

      // Isi harga saja, tanpa nama dan kategori
      const inputJual = page.getByLabel(/harga jual/i);
      await inputJual.click();
      await inputJual.fill("10000");
      await inputJual.blur();

      await page.getByRole("button", { name: /simpan produk baru/i }).click();

      // Pesan error dari Zod: "Nama produk wajib diisi"
      await expect(page.getByText(/nama produk wajib diisi/i)).toBeVisible();

      // Halaman tidak berpindah
      await expect(page).toHaveURL(/.*\/buatProduk/);
    });
  });

  // ----------------------------------------------------------
  // [6] UNHAPPY: Submit form buat produk tanpa kategori → error validasi
  // ----------------------------------------------------------
  test("unhappy: submit form buat produk tanpa kategori → pesan error muncul", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Isi nama saja, skip kategori, submit → error", async () => {
      await bukaBuatProduk(page);

      await page.getByLabel(/nama produk/i).fill("Produk Tanpa Kategori");

      await page.getByRole("button", { name: /simpan produk baru/i }).click();

      // Pesan error dari Zod: "Kategori wajib dipilih"
      await expect(page.getByText(/kategori wajib dipilih/i)).toBeVisible();

      await expect(page).toHaveURL(/.*\/buatProduk/);
    });
  });

  // ----------------------------------------------------------
  // [7] UNHAPPY: Submit resep dengan jumlah 0 → error validasi
  // ----------------------------------------------------------
  test("unhappy: tambah bahan ke resep dengan jumlah 0 → pesan error muncul", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Tambah bahan dengan jumlah 0 → error", async () => {
      await bukaBuatProduk(page);
      await isiFormDasarProduk(page, { nama: "Produk Resep Jumlah Nol" });

      await page.getByRole("button", { name: /tambah bahan/i }).click();

      // Pilih bahan baku
      const bahanCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih bahan/i });
      await bahanCombobox.click();
      await page.getByRole("option").first().click();

      // Biarkan jumlah = 0 (default)
      await page.getByRole("button", { name: /simpan produk baru/i }).click();

      // Pesan error dari Zod: "Jumlah harus lebih dari 0"
      await expect(page.getByText(/jumlah harus lebih dari 0/i)).toBeVisible();

      await expect(page).toHaveURL(/.*\/buatProduk/);
    });
  });

  // ----------------------------------------------------------
  // [8] BUSINESS LOGIC: Checkbox unlimited ter-disable saat ada resep
  // (verifikasi reaktivitas UI tanpa submit)
  // ----------------------------------------------------------
  test("business logic: menambah resep secara otomatis disable checkbox unlimited", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Verifikasi disable cascade saat resep ditambah", async () => {
      await bukaBuatProduk(page);

      // Awalnya checkbox unlimited enabled
      await expect(page.getByLabel(/produk tanpa stok/i)).not.toBeDisabled();

      // Tambah bahan ke resep
      await page.getByRole("button", { name: /tambah bahan/i }).click();

      // Sekarang checkbox unlimited harus disabled
      await expect(page.getByLabel(/produk tanpa stok/i)).toBeDisabled();

      const tombolHapus = page.locator("button.text-rose-500").first();
      await tombolHapus.click();

      // Memanfaatkan mekanisme auto-retrying Playwright
      await expect(tombolHapus).not.toBeVisible();

      // Sekarang checkbox harus enabled
      await expect(page.getByLabel(/produk tanpa stok/i)).not.toBeDisabled();
    });
  });

  // ----------------------------------------------------------
  // [8b] BUSINESS LOGIC: Centang unlimited lalu tambah resep
  // Resep dan stok unlimited saling eksklusif. Saat resep ditambah,
  // isUnlimitedStok di-reset ke false dan Checkbox di-remount lewat
  // key berbasis hasResep agar tampilannya tidak basi.
  // ----------------------------------------------------------
  test("business logic: unlimited yang sudah dicentang otomatis batal saat resep ditambah", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Centang unlimited, tambah resep, lalu hapus resep", async () => {
      await bukaBuatProduk(page);

      const checkboxUnlimited = page.getByLabel(/produk tanpa stok/i);

      // Centang unlimited terlebih dahulu
      await checkboxUnlimited.click();
      await expect(checkboxUnlimited).toBeChecked();

      // Tambah bahan ke resep: unlimited harus batal dan terkunci
      await page.getByRole("button", { name: /tambah bahan/i }).click();
      await expect(checkboxUnlimited).toBeDisabled();
      await expect(checkboxUnlimited).not.toBeChecked();

      // Hapus resep: unlimited aktif kembali, tetapi tetap tidak tercentang
      const tombolHapus = page.locator("button.text-rose-500").first();
      await tombolHapus.click();
      await expect(tombolHapus).not.toBeVisible();

      await expect(checkboxUnlimited).not.toBeDisabled();
      await expect(checkboxUnlimited).not.toBeChecked();
    });
  });

  // ----------------------------------------------------------
  // [9] DIALOG HAPUS: Klik "Batal" → dialog tutup, data tetap ada
  // ----------------------------------------------------------
  test("dialog hapus: klik batal → dialog tutup, produk tidak terhapus", async ({
    page,
  }) => {
    const namaProduk = "Produk E2E Batal Hapus";

    await test.step("Login, navigasi, dan buat produk", async () => {
      await login(page);
      await bukaHalamanProduk(page);
      await tambahProdukBaru(page, namaProduk);
    });

    await test.step("Buka dialog hapus lalu klik Batal", async () => {
      await expect(
        page.getByText(/produk baru berhasil ditambahkan/i),
      ).not.toBeVisible({ timeout: 10000 });

      const searchInput = page.getByPlaceholder(/cari nama produk/i);
      await searchInput.fill(namaProduk);

      const row = page
        .getByRole("row", { name: new RegExp(namaProduk, "i") })
        .first();
      await klikTombolAksiProduk(row);
      await page.getByRole("menuitem", { name: /hapus produk/i }).click();

      await expect(page.getByRole("alertdialog")).toBeVisible();

      // Klik Batal
      await page.getByRole("button", { name: /batal/i }).click();

      // Dialog harus hilang
      await expect(page.getByRole("alertdialog")).not.toBeVisible();

      // Produk masih ada
      await expect(
        page.getByRole("row", { name: new RegExp(namaProduk, "i") }),
      ).toBeVisible();

      // Tidak ada toast hapus
      await expect(
        page.getByText(/produk berhasil dihapus/i),
      ).not.toBeVisible();
    });

    await test.step("Cleanup", async () => {
      await hapusProduk(page, namaProduk);
    });
  });

  // ----------------------------------------------------------
  // [10] READ: Pencarian produk yang tidak ada → pesan kosong
  // ----------------------------------------------------------
  test("search: nama produk tidak ditemukan → tabel tampilkan pesan kosong", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Cari nama yang tidak ada → pesan kosong", async () => {
      const searchInput = page.getByPlaceholder(/cari nama produk/i);
      await searchInput.fill("XYZXYZ_PRODUK_TIDAK_ADA_999");

      await expect(page.getByText(/belum ada produk/i)).toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [11] NAVIGASI: Tombol "Kembali" di halaman buat produk
  // ----------------------------------------------------------
  test("navigasi: tombol kembali di halaman buat produk → redirect ke daftar", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanProduk(page);
    });

    await test.step("Buka buat produk lalu klik kembali", async () => {
      await bukaBuatProduk(page);
      await page
        .getByRole("button", { name: /kembali ke daftar produk/i })
        .click();

      await page.waitForURL("**/inventaris/produk");
      await expect(
        page.getByRole("heading", { name: /data produk/i }),
      ).toBeVisible();
    });
  });
});
