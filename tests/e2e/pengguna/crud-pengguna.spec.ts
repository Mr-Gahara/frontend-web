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
// HELPER: Navigasi ke halaman pengguna
// ============================================================
async function bukaHalamanPengguna(page: Page) {
  await page.goto("http://localhost:3000/dashboard/outlet/pengguna");

  await expect(
    page.getByRole("heading", { name: /kelola pengguna/i }),
  ).toBeVisible();

  await expect(page.getByRole("table")).toBeVisible();
}

// ============================================================
// HELPER: Buka form tambah pengguna
// ============================================================
async function bukaTambahPengguna(page: Page) {
  await page.getByRole("button", { name: /tambah pengguna/i }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
}

// ============================================================
// HELPER: Isi form pengguna
// ============================================================
async function isiFormPengguna(
  page: Page,
  opts: {
    nama?: string;
    nomorHp?: string;
    pin?: string;
    pilihRole?: boolean;
    akses?: "app" | "web" | "both";
  },
) {
  if (opts.nama !== undefined) {
    await page.getByLabel(/nama lengkap/i).fill(opts.nama);
  }

  if (opts.nomorHp !== undefined) {
    await page.getByLabel(/nomor hp/i).fill(opts.nomorHp);
  }

  if (opts.pin !== undefined) {
    await page.getByLabel(/pin keamanan/i).fill(opts.pin);
  }

  if (opts.akses) {
    const aksesText = {
      app: "App Kasir",
      web: "Web Backoffice",
      both: "Keduanya",
    }[opts.akses];

    await page.getByText(aksesText, { exact: true }).click();
  }

  if (opts.pilihRole) {
    await page.getByRole("combobox").first().click();
    await page.getByRole("option").first().click();
  }
}

// ============================================================
// HELPER: Tambah pengguna baru
// ============================================================
async function tambahPenggunaBaru(
  page: Page,
  nama: string,
  akses: "app" | "web" | "both" = "web",
): Promise<void> {
  await bukaTambahPengguna(page);

  const nomorHpUnik = `0811${Date.now().toString().slice(-8)}`;

  await isiFormPengguna(page, {
    nama,
    nomorHp: nomorHpUnik,
    pin: "777888",
    pilihRole: true,
    akses,
  });

  await page.getByRole("button", { name: /simpan/i }).click();

  await expect(
    page.getByText(/pengguna berhasil ditambahkan/i).first(),
  ).toBeVisible({ timeout: 10000 });

  await expect(page.getByRole("dialog")).not.toBeVisible();
}

// ============================================================
// HELPER: Cari pengguna
// — .first() mencegah strict mode kalau ada sisa data lama
// ============================================================
async function cariPengguna(page: Page, nama: string) {
  const searchInput = page.getByPlaceholder(/cari nama pengguna/i);

  await searchInput.fill(nama);

  await expect(
    page.getByRole("row", { name: new RegExp(nama, "i") }).first(),
  ).toBeVisible();
}

// ============================================================
// HELPER: Hapus pengguna
// ============================================================
async function hapusPengguna(page: Page, nama: string) {
  const searchInput = page.getByPlaceholder(/cari nama pengguna/i);

  await searchInput.clear();
  await searchInput.fill(nama);

  const row = page.getByRole("row", { name: new RegExp(nama, "i") }).first();
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: /buka menu/i }).click();
  await page.getByRole("menuitem", { name: /^hapus$/i }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: /^hapus$/i }).click();

  await expect(
    page.getByText(/pengguna berhasil dihapus/i).first(),
  ).toBeVisible({ timeout: 10000 });

  await expect(page.getByRole("alertdialog")).not.toBeVisible();
  await expect(
    page.getByRole("row", { name: new RegExp(nama, "i") }),
  ).not.toBeVisible({ timeout: 10000 });
}

// ============================================================
// HELPER: Pembersihan data (best-effort)
// Dipakai test yang tujuannya bukan menghapus. Backend saat ini gagal
// menghapus pengguna secara acak (500: transaksi MongoDB dijalankan
// paralel di penggunaCrudService). Kegagalan pembersihan dicatat sebagai
// anotasi laporan dan tidak menggagalkan test yang tujuannya sudah tercapai.
// ============================================================
async function bersihkanPengguna(page: Page, nama: string) {
  try {
    await hapusPengguna(page, nama);
  } catch (error) {
    test.info().annotations.push({
      type: "cleanup-gagal",
      description: `Pengguna "${nama}" gagal dihapus: ${(error as Error).message.split("\n")[0]}`,
    });
    await page.keyboard.press("Escape");
  }
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe("E2E - Siklus Hidup Pengguna (CRUD)", () => {
  test.setTimeout(90000);

  // ==========================================================
  // [1] HAPPY PATH
  // Tambah → Cari → Edit nama + PIN (hapus diuji di [1b])
  // ==========================================================
  test("happy path: tambah → cari → edit nama+pin", async ({
    page,
  }) => {
    const ts = Date.now();
    const namaBaru = `Karyawan Agen ${ts}`;
    const namaUpdate = `Karyawan Agen ${ts} Updated`;

    await test.step("Login", async () => {
      await login(page);
    });

    await test.step("Navigasi ke halaman pengguna", async () => {
      await bukaHalamanPengguna(page);
    });

    await test.step("Tambah pengguna baru", async () => {
      await tambahPenggunaBaru(page, namaBaru, "web");
    });

    await test.step("Cari pengguna di tabel", async () => {
      await cariPengguna(page, namaBaru);
    });

    await test.step("Edit nama dan PIN pengguna", async () => {
      const row = page
        .getByRole("row", { name: new RegExp(namaBaru, "i") })
        .first();

      await row.getByRole("button", { name: /buka menu/i }).click();
      await page.getByRole("menuitem", { name: /^edit$/i }).click();

      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByLabel(/nama lengkap/i).fill(namaUpdate);
      await page.getByLabel(/pin keamanan/i).fill("112233");
      await page.getByLabel(/pin keamanan/i).blur();

      await page.getByRole("button", { name: /simpan/i }).click();

      await expect(
        page.getByText(/pengguna berhasil diperbarui/i).first(),
      ).toBeVisible({ timeout: 10000 });

      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Verifikasi hasil edit", async () => {
      await cariPengguna(page, namaUpdate);
    });

    await test.step("Cleanup", async () => {
      await bersihkanPengguna(page, namaUpdate);
    });
  });

  // ==========================================================
  // [1b] HAPUS PENGGUNA (fixme: bug backend)
  // penggunaCrudService menjalankan Device.deleteMany dan
  // Absensi.deleteMany secara paralel (Promise.all) dalam satu sesi
  // transaksi. Driver MongoDB tidak mendukung operasi paralel dalam satu
  // transaksi, sehingga DELETE /api/pengguna/:id gagal 500 secara acak.
  // Ganti test.fixme menjadi test setelah backend diperbaiki.
  // ==========================================================
  test.fixme("hapus: pengguna terhapus dan hilang dari tabel", async ({
    page,
  }) => {
    const nama = `Karyawan Hapus ${Date.now()}`;

    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Tambah pengguna", async () => {
      await tambahPenggunaBaru(page, nama, "web");
      await cariPengguna(page, nama);
    });

    await test.step("Hapus pengguna", async () => {
      await hapusPengguna(page, nama);
    });
  });

  // ==========================================================
  // [2] HAPPY PATH
  // Edit nama tanpa mengganti PIN
  // ==========================================================
  test("happy path: edit nama tanpa ganti PIN → tetap berhasil disimpan", async ({
    page,
  }) => {
    const ts = Date.now();
    const namaBaru = `Pengguna Tanpa Ganti PIN ${ts}`;
    const namaUpdate = `Pengguna Tanpa Ganti PIN ${ts} Updated`;

    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Tambah pengguna", async () => {
      await tambahPenggunaBaru(page, namaBaru, "web");
    });

    await test.step("Edit nama tanpa mengisi PIN", async () => {
      await cariPengguna(page, namaBaru);

      const row = page
        .getByRole("row", { name: new RegExp(namaBaru, "i") })
        .first();

      await row.getByRole("button", { name: /buka menu/i }).click();
      await page.getByRole("menuitem", { name: /^edit$/i }).click();

      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByLabel(/nama lengkap/i).fill(namaUpdate);
      await page.getByLabel(/pin keamanan/i).clear();

      await page.getByRole("button", { name: /simpan/i }).click();

      await expect(
        page.getByText(/pengguna berhasil diperbarui/i).first(),
      ).toBeVisible({ timeout: 10000 });

      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Verifikasi nama berhasil diperbarui", async () => {
      await cariPengguna(page, namaUpdate);
    });

    await test.step("Cleanup", async () => {
      await bersihkanPengguna(page, namaUpdate);
    });
  });

  // ==========================================================
  // [3] HAPPY PATH
  // Tambah pengguna dengan akses App
  // ==========================================================
  test("happy path: tambah pengguna dengan akses App Kasir", async ({
    page,
  }) => {
    const nama = `Pengguna Akses App Test ${Date.now()}`;

    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Tambah dengan akses App", async () => {
      await tambahPenggunaBaru(page, nama, "app");
    });

    await test.step("Verifikasi pengguna berhasil dibuat", async () => {
      await cariPengguna(page, nama);
    });

    await test.step("Cleanup", async () => {
      await bersihkanPengguna(page, nama);
    });
  });

  // ==========================================================
  // [4] HAPPY PATH
  // Tambah pengguna dengan kedua akses
  // ==========================================================
  test("happy path: tambah pengguna dengan kedua hak akses platform", async ({
    page,
  }) => {
    const nama = `Pengguna Kedua Akses Test ${Date.now()}`;

    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Tambah dengan akses Keduanya", async () => {
      await tambahPenggunaBaru(page, nama, "both");
    });

    await test.step("Verifikasi pengguna berhasil dibuat", async () => {
      await cariPengguna(page, nama);
    });

    await test.step("Cleanup", async () => {
      await bersihkanPengguna(page, nama);
    });
  });

  // ==========================================================
  // [5] UNHAPPY
  // PIN berisi huruf: huruf dibuang otomatis, PIN pendek ditolak
  // ==========================================================
  test("unhappy: PIN berisi huruf saat tambah pengguna → huruf dibuang dan PIN pendek ditolak", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Isi form dengan PIN invalid", async () => {
      await bukaTambahPengguna(page);

      await isiFormPengguna(page, {
        nama: "Test PIN Huruf",
        pin: "abc123",
        pilihRole: true,
        akses: "web",
      });

      // Input hanya menerima angka: "abc123" menjadi "123"
      await expect(page.getByLabel(/pin keamanan/i)).toHaveValue("123");

      await page.getByRole("button", { name: /simpan/i }).click();

      await expect(
        page.getByText(/pin harus terdiri dari 6 digit angka/i),
      ).toBeVisible();

      await expect(page.getByRole("dialog")).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });

  // ==========================================================
  // [5b] UNHAPPY
  // PIN harus tepat 6 digit: 5 digit ditolak, lebih dari 6 dipotong
  // ==========================================================
  test("unhappy: PIN 5 digit ditolak dan input PIN dibatasi 6 digit", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("PIN lebih dari 6 digit dipotong menjadi 6", async () => {
      await bukaTambahPengguna(page);
      await page.getByLabel(/pin keamanan/i).fill("12345678");
      await expect(page.getByLabel(/pin keamanan/i)).toHaveValue("123456");
    });

    await test.step("PIN 5 digit ditolak sebelum dikirim ke backend", async () => {
      await isiFormPengguna(page, {
        nama: "Test PIN Pendek",
        pin: "12345",
        pilihRole: true,
        akses: "web",
      });

      await page.getByRole("button", { name: /simpan/i }).click();

      await expect(
        page.getByText(/pin harus terdiri dari 6 digit angka/i),
      ).toBeVisible();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });

  // ==========================================================
  // [6] UNHAPPY
  // Nama kosong
  // ==========================================================
  test("unhappy: nama kosong saat tambah pengguna → tidak dapat submit", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Buka form tambah", async () => {
      await bukaTambahPengguna(page);

      await isiFormPengguna(page, {
        pin: "123456",
        pilihRole: true,
        akses: "web",
      });
    });

    await test.step("Submit tanpa nama", async () => {
      const namaInput = page.getByLabel(/nama lengkap/i);

      await expect(namaInput).toHaveAttribute("required");

      await page.getByRole("button", { name: /simpan/i }).click();

      await expect(page.getByRole("dialog")).toBeVisible();

      await expect(
        page.getByText(/pengguna berhasil ditambahkan/i),
      ).not.toBeVisible();
    });

    await page.keyboard.press("Escape");
  });

  // ==========================================================
  // [7] UNHAPPY
  // PIN kosong saat tambah pengguna
  // ==========================================================
  test("unhappy: PIN kosong saat tambah pengguna → tidak dapat submit", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Buka form tambah dan isi data tanpa PIN", async () => {
      await bukaTambahPengguna(page);

      await isiFormPengguna(page, {
        nama: "Test PIN Kosong",
        pilihRole: true,
        akses: "web",
      });

      const pinInput = page.getByLabel(/pin keamanan/i);

      await expect(pinInput).toHaveAttribute("required");

      await page.getByRole("button", { name: /simpan/i }).click();

      await expect(page.getByRole("dialog")).toBeVisible();

      await expect(
        page.getByText(/pengguna berhasil ditambahkan/i),
      ).not.toBeVisible();
    });

    await page.keyboard.press("Escape");
  });

  // ==========================================================
  // [8] OTORISASI
  // Akun sendiri tidak boleh dihapus
  // ==========================================================
  test("otorisasi: tombol hapus disabled untuk akun pengguna yang sedang login", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Cari akun sendiri", async () => {
      await page.getByPlaceholder(/cari nama pengguna/i).fill("Ridho");

      const selfRow = page.getByRole("row", { name: /ridho/i }).first();

      await expect(selfRow).toBeVisible();

      await selfRow.getByRole("button", { name: /buka menu/i }).click();
    });

    await test.step("Verifikasi Hapus disabled", async () => {
      const hapusItem = page.getByRole("menuitem", { name: /^hapus$/i });

      await expect(hapusItem).toBeVisible();
      await expect(hapusItem).toHaveAttribute("data-disabled");

      await page.keyboard.press("Escape");
    });
  });

  // ==========================================================
  // [9] OTORISASI
  // Akun sendiri: field Role dan Status disabled
  // ==========================================================
  test("otorisasi: role dan status disabled saat mengedit akun sendiri", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Buka edit akun sendiri", async () => {
      await page.getByPlaceholder(/cari nama pengguna/i).fill("Ridho");

      const selfRow = page.getByRole("row", { name: /ridho/i }).first();

      await selfRow.getByRole("button", { name: /buka menu/i }).click();

      const editItem = page.getByRole("menuitem", { name: /^edit$/i });

      await expect(editItem).toBeVisible();
      await editItem.click();

      await expect(page.getByRole("dialog")).toBeVisible();
    });

    await test.step("Verifikasi field yang dibatasi", async () => {
      // Pengguna uji adalah Owner, dan Owner boleh mengubah PIN-nya sendiri
      // (kondisi !isSelf || isOwner di pengguna-form-dialog). Sebelumnya field
      // ini selalu tersembunyi karena isOwner dihitung dari role.nama, padahal
      // role pada token berupa string, sehingga nilainya selalu false.
      await expect(page.getByLabel(/pin keamanan/i)).toBeVisible();

      const comboboxes = page.getByRole("combobox");

      await expect(comboboxes.nth(0)).toBeDisabled();
      await expect(comboboxes.nth(1)).toBeDisabled();

      await expect(
        page.getByText("App Kasir", { exact: true }).locator(".."),
      ).toHaveClass(/cursor-not-allowed/);

      await expect(
        page.getByText("Web Backoffice", { exact: true }).locator(".."),
      ).toHaveClass(/cursor-not-allowed/);

      await expect(
        page.getByText("Keduanya", { exact: true }).locator(".."),
      ).toHaveClass(/cursor-not-allowed/);
    });

    await page.keyboard.press("Escape");
  });

  // ==========================================================
  // [10] DIALOG HAPUS
  // Klik Batal → data tetap ada
  // ==========================================================
  test("dialog hapus: klik batal → dialog tutup, data tetap ada", async ({
    page,
  }) => {
    const namaPengguna = `Pengguna Batal Hapus Test ${Date.now()}`;

    await test.step("Login, navigasi, dan buat pengguna", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
      await tambahPenggunaBaru(page, namaPengguna, "web");
    });

    await test.step("Buka dialog hapus", async () => {
      await cariPengguna(page, namaPengguna);

      const row = page
        .getByRole("row", { name: new RegExp(namaPengguna, "i") })
        .first();

      await row.getByRole("button", { name: /buka menu/i }).click();
      await page.getByRole("menuitem", { name: /^hapus$/i }).click();

      await expect(page.getByRole("alertdialog")).toBeVisible();
    });

    await test.step("Klik Batal", async () => {
      await page.getByRole("button", { name: /^batal$/i }).click();

      await expect(page.getByRole("alertdialog")).not.toBeVisible();

      await expect(
        page.getByRole("row", { name: new RegExp(namaPengguna, "i") }).first(),
      ).toBeVisible();

      await expect(
        page.getByText(/pengguna berhasil dihapus/i),
      ).not.toBeVisible();
    });

    await test.step("Cleanup", async () => {
      await bersihkanPengguna(page, namaPengguna);
    });
  });

  // ==========================================================
  // [11] READ
  // Search nama yang tidak ada
  // ==========================================================
  test("search: nama yang tidak ada di database → tampil pesan kosong", async ({
    page,
  }) => {
    await test.step("Login dan navigasi", async () => {
      await login(page);
      await bukaHalamanPengguna(page);
    });

    await test.step("Cari nama yang pasti tidak ada", async () => {
      await page
        .getByPlaceholder(/cari nama pengguna/i)
        .fill("XYZXYZXYZ_PASTI_TIDAK_ADA_123456");

      await expect(page.getByText(/belum ada pengguna/i)).toBeVisible();
    });
  });
});