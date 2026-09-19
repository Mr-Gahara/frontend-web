import { test, expect, Page } from "@playwright/test";

const URL_KATEGORI =
  "http://localhost:3000/dashboard/outlet/inventaris/kategori";

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
// HELPER: Navigasi dan data uji
// ============================================================
async function bukaHalamanKategori(page: Page) {
  await page.goto(URL_KATEGORI);
  await expect(
    page.getByRole("heading", { name: /kelola kategori/i }),
  ).toBeVisible();
}

/** Nama dan kode kategori unik per tenant; akhiran mencegah bentrok dengan sisa run sebelumnya. */
function akhiranUnik() {
  return Date.now().toString().slice(-6);
}

// ============================================================
// HELPER: Form dan aksi baris
// ============================================================
async function isiFormKategori(
  page: Page,
  data: { nama: string; kode: string; keterangan?: string },
) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/nama kategori/i).fill(data.nama);
  await dialog.getByLabel(/kode kategori/i).fill(data.kode);
  if (data.keterangan) {
    await dialog.getByLabel(/keterangan/i).fill(data.keterangan);
  }
}

async function tambahKategori(
  page: Page,
  data: { nama: string; kode: string; keterangan?: string },
) {
  await page.getByRole("button", { name: /tambah kategori/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await isiFormKategori(page, data);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^simpan$/i })
    .click();
  await expect(page.getByText(/kategori berhasil ditambahkan/i)).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
}

function barisKategori(page: Page, nama: string) {
  return page.getByRole("row", { name: new RegExp(nama, "i") });
}

async function cariKategori(page: Page, nama: string) {
  await page.getByPlaceholder(/cari nama kategori/i).fill(nama);
}

async function bukaAksiKategori(page: Page, nama: string, aksi: RegExp) {
  await cariKategori(page, nama);
  await barisKategori(page, nama).getByRole("button").click();
  await page.getByRole("menuitem", { name: aksi }).click();
}

async function hapusKategori(page: Page, nama: string) {
  await bukaAksiKategori(page, nama, /^hapus$/i);
  await page.getByRole("button", { name: /lanjutkan/i }).click();
  await expect(page.getByText(/kategori berhasil dihapus/i)).toBeVisible();
}

// ============================================================
// HELPER: Produk yang memakai kategori tertentu
// ============================================================
async function tambahProdukDenganKategori(
  page: Page,
  namaProduk: string,
  namaKategori: string,
) {
  await page.goto(
    "http://localhost:3000/dashboard/outlet/inventaris/produk/buatProduk",
  );
  await expect(
    page.getByRole("heading", { name: /tambah produk/i }),
  ).toBeVisible();
  await page.getByLabel(/nama produk/i).fill(namaProduk);

  await page.getByRole("combobox").first().click();
  await page.getByPlaceholder(/cari kategori/i).fill(namaKategori);
  await page
    .getByRole("option", { name: new RegExp(namaKategori, "i") })
    .click();

  const inputDasar = page.getByLabel(/harga dasar/i);
  await inputDasar.click();
  await inputDasar.fill("10000");
  await inputDasar.blur();
  const inputJual = page.getByLabel(/harga jual/i);
  await inputJual.click();
  await inputJual.fill("15000");
  await inputJual.blur();

  await page.getByRole("button", { name: /simpan produk baru/i }).click();
  await expect(
    page.getByText(/produk baru berhasil ditambahkan/i),
  ).toBeVisible();
  await page.waitForURL("**/inventaris/produk");
}

async function hapusProduk(page: Page, namaProduk: string) {
  await page.goto("http://localhost:3000/dashboard/outlet/inventaris/produk");
  await page.getByPlaceholder(/cari nama produk/i).fill(namaProduk);
  await page
    .getByRole("row", { name: new RegExp(namaProduk, "i") })
    .getByRole("button")
    .last()
    .click();
  await page.getByRole("menuitem", { name: /hapus produk/i }).click();
  await page.getByRole("button", { name: /^hapus$/i }).click();
  await expect(page.getByText(/produk berhasil dihapus/i)).toBeVisible();
}

// ============================================================
// TEST
// ============================================================
test.describe("E2E - Manajemen Kategori", () => {
  test("tambah kategori → muncul di tabel", async ({ page }) => {
    const akhiran = akhiranUnik();
    const nama = `Kategori E2E Tambah ${akhiran}`;

    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanKategori(page);
    });

    await test.step("Tambah kategori", async () => {
      await tambahKategori(page, { nama, kode: `TMB${akhiran}` });
    });

    await test.step("Verifikasi muncul di tabel", async () => {
      await cariKategori(page, nama);
      await expect(barisKategori(page, nama)).toBeVisible();
    });

    await test.step("Cleanup", async () => {
      await hapusKategori(page, nama);
    });
  });

  test("edit kategori: form terisi data lama, perubahan tersimpan", async ({
    page,
  }) => {
    const akhiran = akhiranUnik();
    const namaAwal = `Kategori E2E Pre-Edit ${akhiran}`;
    const namaUpdate = `Kategori E2E Post-Edit ${akhiran}`;

    await test.step("Login, navigasi, dan tambah kategori", async () => {
      await login(page);
      await bukaHalamanKategori(page);
      await tambahKategori(page, { nama: namaAwal, kode: `EDT${akhiran}` });
    });

    await test.step("Buka edit dan periksa isian awal", async () => {
      await bukaAksiKategori(page, namaAwal, /^edit$/i);
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByLabel(/nama kategori/i)).toHaveValue(namaAwal);
      await expect(dialog.getByLabel(/kode kategori/i)).toHaveValue(
        `EDT${akhiran}`,
      );
    });

    await test.step("Ubah nama lalu simpan", async () => {
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel(/nama kategori/i).fill(namaUpdate);
      await dialog.getByRole("button", { name: /^simpan$/i }).click();
      await expect(
        page.getByText(/kategori berhasil diperbarui/i),
      ).toBeVisible();
      await expect(dialog).toBeHidden();
    });

    await test.step("Verifikasi nama baru di tabel", async () => {
      await cariKategori(page, namaUpdate);
      await expect(barisKategori(page, namaUpdate)).toBeVisible();
    });

    await test.step("Cleanup", async () => {
      await hapusKategori(page, namaUpdate);
    });
  });

  test("hapus kategori → baris hilang dari tabel", async ({ page }) => {
    const akhiran = akhiranUnik();
    const nama = `Kategori E2E Hapus ${akhiran}`;

    await test.step("Login, navigasi, dan tambah kategori", async () => {
      await login(page);
      await bukaHalamanKategori(page);
      await tambahKategori(page, { nama, kode: `HPS${akhiran}` });
    });

    await test.step("Hapus lewat dialog konfirmasi", async () => {
      await hapusKategori(page, nama);
    });

    await test.step("Verifikasi baris hilang", async () => {
      await cariKategori(page, nama);
      await expect(barisKategori(page, nama)).toHaveCount(0);
      await expect(page.getByText(/belum ada kategori/i)).toBeVisible();
    });
  });

  test("batal hapus → dialog tutup, kategori tetap ada", async ({ page }) => {
    const akhiran = akhiranUnik();
    const nama = `Kategori E2E Batal ${akhiran}`;

    await test.step("Login, navigasi, dan tambah kategori", async () => {
      await login(page);
      await bukaHalamanKategori(page);
      await tambahKategori(page, { nama, kode: `BTL${akhiran}` });
    });

    await test.step("Buka dialog hapus lalu klik Batal", async () => {
      await bukaAksiKategori(page, nama, /^hapus$/i);
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.getByRole("button", { name: /^batal$/i }).click();
      await expect(page.getByRole("alertdialog")).toBeHidden();
      await expect(barisKategori(page, nama)).toBeVisible();
    });

    await test.step("Cleanup", async () => {
      await hapusKategori(page, nama);
    });
  });

  test("validasi: nama berisi spasi saja → pesan wajib diisi", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanKategori(page);
    });

    await test.step("Isi nama dengan spasi lalu simpan", async () => {
      await page.getByRole("button", { name: /tambah kategori/i }).click();
      await isiFormKategori(page, { nama: "   ", kode: "SPASI" });
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^simpan$/i })
        .click();
      await expect(page.getByText(/nama kategori wajib diisi/i)).toBeVisible();
      await expect(page.getByRole("dialog")).toBeVisible();
    });
  });

  test("duplikat kode → pesan kode sudah dipakai, dialog tetap terbuka", async ({
    page,
  }) => {
    const akhiran = akhiranUnik();
    const nama = `Kategori E2E Asli ${akhiran}`;
    const kode = `DUP${akhiran}`;

    await test.step("Login, navigasi, dan tambah kategori", async () => {
      await login(page);
      await bukaHalamanKategori(page);
      await tambahKategori(page, { nama, kode });
    });

    await test.step("Tambah kategori lain dengan kode yang sama", async () => {
      await page.getByRole("button", { name: /tambah kategori/i }).click();
      await isiFormKategori(page, {
        nama: `Kategori E2E Kembar ${akhiran}`,
        kode,
      });
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: /^simpan$/i }).click();
      await expect(dialog.getByText(/kode kategori sudah dipakai/i)).toBeVisible();
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: /^batal$/i }).click();
    });

    await test.step("Cleanup", async () => {
      await hapusKategori(page, nama);
    });
  });

  test("hapus dicegah bila kategori masih dipakai produk", async ({
    page,
  }) => {
    const akhiran = akhiranUnik();
    const namaKategori = `Kategori E2E Dipakai ${akhiran}`;
    const namaProduk = `Produk E2E Berkategori ${akhiran}`;

    await test.step("Login, navigasi, dan tambah kategori", async () => {
      await login(page);
      await bukaHalamanKategori(page);
      await tambahKategori(page, { nama: namaKategori, kode: `DPK${akhiran}` });
    });

    await test.step("Buat produk yang memakai kategori itu", async () => {
      await tambahProdukDenganKategori(page, namaProduk, namaKategori);
    });

    await test.step("Dialog hapus menolak dan menyebut jumlah produk", async () => {
      await bukaHalamanKategori(page);
      await bukaAksiKategori(page, namaKategori, /^hapus$/i);
      const dialog = page.getByRole("alertdialog");
      await expect(dialog.getByText(/masih dipakai 1 produk/i)).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /lanjutkan/i }),
      ).toBeDisabled();
      await dialog.getByRole("button", { name: /^batal$/i }).click();
    });

    await test.step("Setelah produk dihapus, kategori dapat dihapus", async () => {
      await hapusProduk(page, namaProduk);
      await bukaHalamanKategori(page);
      await hapusKategori(page, namaKategori);
    });
  });

  test("hapus gagal → dialog tetap terbuka, berhasil saat diulang", async ({
    page,
  }) => {
    const akhiran = akhiranUnik();
    const nama = `Kategori E2E Gagal ${akhiran}`;

    await test.step("Login, navigasi, dan tambah kategori", async () => {
      await login(page);
      await bukaHalamanKategori(page);
      await tambahKategori(page, { nama, kode: `GGL${akhiran}` });
    });

    await test.step("Hapus pertama gagal, dialog tetap terbuka", async () => {
      await page.route("**/api/kategori/*", async (route) => {
        if (route.request().method() === "DELETE") {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              status: "error",
              message: "Kegagalan simulasi",
            }),
          });
          return;
        }
        await route.continue();
      });
      await bukaAksiKategori(page, nama, /^hapus$/i);
      await page.getByRole("button", { name: /lanjutkan/i }).click();
      await expect(page.getByText(/kegagalan simulasi/i)).toBeVisible();
      await expect(page.getByRole("alertdialog")).toBeVisible();
    });

    await test.step("Hapus ulang ke backend sungguhan berhasil", async () => {
      await page.unroute("**/api/kategori/*");
      await page.getByRole("button", { name: /lanjutkan/i }).click();
      await expect(page.getByText(/kategori berhasil dihapus/i)).toBeVisible();
      await expect(page.getByRole("alertdialog")).toBeHidden();
      await cariKategori(page, nama);
      await expect(barisKategori(page, nama)).toHaveCount(0);
    });
  });

  test("cari nama yang tidak ada → pesan kosong", async ({ page }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanKategori(page);
    });

    await test.step("Cari nama yang tidak ada", async () => {
      await cariKategori(page, "XYZXYZ_KATEGORI_TIDAK_ADA_999");
      await expect(page.getByText(/belum ada kategori/i)).toBeVisible();
    });
  });
});
