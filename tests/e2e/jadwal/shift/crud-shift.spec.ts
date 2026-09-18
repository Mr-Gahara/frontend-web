import { test, expect, type Page } from "@playwright/test";

// ============================================================
// CONFIG & CONSTANTS
// ============================================================
const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
const SHIFT_PATH = "/dashboard/outlet/shift";

// ============================================================
// HELPER: Login
// ============================================================
async function login(page: Page) {
  await page.goto(`${BASE}/login`);

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
// HELPER: Navigasi & Tabel
// ============================================================
async function bukaHalamanShift(page: Page) {
  await page.goto(`${BASE}${SHIFT_PATH}`);
  await expect(
    page.getByRole("heading", { name: /master shift outlet/i }),
  ).toBeVisible({ timeout: 15_000 });
}

function getShiftRow(page: Page, namaShift: string) {
  return page.locator("tbody tr").filter({ hasText: namaShift });
}

// ============================================================
// HELPER: Form Actions
// ============================================================
async function bukaTambahShift(page: Page) {
  await page.getByRole("button", { name: /tambah master shift/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function isiWaktuShift(
  dialog: ReturnType<Page["getByRole"]>,
  waktu: { inJam: string; inMnt: string; outJam: string; outMnt: string },
) {
  const timeInputs = dialog.locator('input[type="text"]');
  await timeInputs.nth(0).fill(waktu.inJam);
  await timeInputs.nth(1).fill(waktu.inMnt);
  await timeInputs.nth(2).fill(waktu.outJam);
  await timeInputs.nth(3).fill(waktu.outMnt);
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe("E2E - Manajemen Master Shift (CRUD)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await bukaHalamanShift(page);
  });

  // ----------------------------------------------------------
  // [0] KONTRAK DIALOG: simpan gagal, dialog tetap terbuka
  // Sebelumnya dialog ditutup tanpa menunggu API sehingga isian hilang
  // saat backend menolak. Kini dialog hanya ditutup bila simpan sukses.
  // ----------------------------------------------------------
  test("simpan gagal: dialog tetap terbuka dan toast Gagal Menyimpan tampil", async ({
    page,
  }) => {
    await page.route("**/api/shift", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          message: "Simulasi kegagalan server dari E2E.",
        }),
      });
    });

    await bukaTambahShift(page);
    const dialog = page.getByRole("dialog");

    await dialog.getByPlaceholder(/contoh: shift pagi/i).fill(`Shift Gagal E2E ${Date.now()}`);
    await isiWaktuShift(dialog, {
      inJam: "08",
      inMnt: "00",
      outJam: "16",
      outMnt: "00",
    });
    await dialog.locator('input[type="number"]').fill("15");
    await dialog.getByRole("button", { name: /simpan master shift/i }).click();

    await expect(page.getByText("Gagal Menyimpan")).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder(/contoh: shift pagi/i)).not.toHaveValue("");
  });

  // ----------------------------------------------------------
  // [1] HAPPY PATH: Full CRUD Lifecycle
  // ----------------------------------------------------------
  test("happy path: siklus lengkap tambah → cari → edit → nonaktifkan (soft delete)", async ({
    page,
  }) => {
    const ts = Date.now();
    const namaBaru = `Shift Pagi E2E ${ts}`;
    const namaEdit = `Shift Pagi E2E ${ts} Edited`;

    await test.step("Tambah Master Shift Baru", async () => {
      await bukaTambahShift(page);
      const dialog = page.getByRole("dialog");

      await dialog.getByPlaceholder(/contoh: shift pagi/i).fill(namaBaru);
      await isiWaktuShift(dialog, {
        inJam: "08",
        inMnt: "00",
        outJam: "16",
        outMnt: "00",
      });
      await dialog.locator('input[type="number"]').fill("15");

      await dialog
        .getByRole("button", { name: /simpan master shift/i })
        .click();
      await expect(dialog).toBeHidden({ timeout: 10_000 });

      const row = getShiftRow(page, namaBaru);
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row).toContainText("08:00 - 16:00");
      await expect(row).toContainText("15 Menit");
      await expect(row).toContainText("Aktif");
    });

    await test.step("Cari Shift", async () => {
      const searchInput = page.getByPlaceholder(/cari nama shift/i);
      await searchInput.fill(namaBaru);
      await expect(getShiftRow(page, namaBaru)).toBeVisible();
    });

    await test.step("Edit Master Shift", async () => {
      const row = getShiftRow(page, namaBaru);
      await row
        .getByRole("button", { name: /buka menu/i })
        .first()
        .click();
      await page.getByRole("menuitem", { name: /edit shift/i }).click();

      const dialog = page.getByRole("dialog");
      await dialog.getByPlaceholder(/contoh: shift pagi/i).fill(namaEdit);
      await isiWaktuShift(dialog, {
        inJam: "09",
        inMnt: "00",
        outJam: "17",
        outMnt: "00",
      });
      await dialog.locator('input[type="number"]').fill("10");

      await dialog
        .getByRole("button", { name: /simpan master shift/i })
        .click();
      await expect(dialog).toBeHidden({ timeout: 10_000 });

      // Clear pencarian untuk melihat data terbaru
      await page.getByPlaceholder(/cari nama shift/i).clear();

      const editedRow = getShiftRow(page, namaEdit);
      await expect(editedRow).toBeVisible({ timeout: 10_000 });
      await expect(editedRow).toContainText("09:00 - 17:00");
      await expect(editedRow).toContainText("10 Menit");
    });

    await test.step("Non-Aktifkan Shift (Soft Delete)", async () => {
      const row = getShiftRow(page, namaEdit);
      await row
        .getByRole("button", { name: /buka menu/i })
        .first()
        .click();
      await page.getByRole("menuitem", { name: /non-aktifkan/i }).click();

      const alertDialog = page.getByRole("alertdialog");
      await expect(alertDialog).toBeVisible();
      await alertDialog
        .getByRole("button", { name: /ya, non-aktifkan/i })
        .click();

      await expect(
        page.getByText(/shift berhasil dinonaktifkan dan diarsipkan/i),
      ).toBeVisible({ timeout: 10_000 });
    });

    await test.step("Verifikasi Soft Delete di Tab Non-Aktif", async () => {
      await page.getByRole("combobox").click();
      await page.getByRole("option", { name: /^non-aktif$/i }).click();

      const inactiveRow = getShiftRow(page, namaEdit);
      await expect(inactiveRow).toBeVisible({ timeout: 10_000 });
      await expect(inactiveRow).toContainText("Non-Aktif");

      // Pastikan opsi non-aktifkan tidak muncul lagi di menu
      await inactiveRow
        .getByRole("button", { name: /buka menu/i })
        .first()
        .click();
      await expect(
        page.getByRole("menuitem", { name: /non-aktifkan/i }),
      ).not.toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [2] UI & READ STATE
  // ----------------------------------------------------------
  test("read: elemen antarmuka halaman master shift dapat dimuat dengan sempurna", async ({
    page,
  }) => {
    await expect(
      page.getByText(/kelola jam operasional, toleransi keterlambatan/i),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/cari nama shift/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /tambah master shift/i }),
    ).toBeVisible();

    // Verifikasi header tabel
    const headers = ["Nama Shift", "Jam Kerja", "Toleransi", "Status", "Aksi"];
    for (const header of headers) {
      await expect(
        page.getByRole("columnheader", { name: new RegExp(header, "i") }),
      ).toBeVisible();
    }
  });

  // ----------------------------------------------------------
  // [3] UNHAPPY PATH: Form Validation
  // ----------------------------------------------------------
  test("unhappy: validasi Zod aktif jika form disubmit dalam keadaan tidak valid", async ({
    page,
  }) => {
    await test.step("Submit tanpa nama", async () => {
      await bukaTambahShift(page);
      const dialog = page.getByRole("dialog");

      await isiWaktuShift(dialog, {
        inJam: "08",
        inMnt: "00",
        outJam: "16",
        outMnt: "00",
      });

      // [PERBAIKAN] Hapus atribut 'required' bawaan HTML5 agar event submit
      // bisa lolos ke fungsi handleSubmit milik React/Zod.
      const inputNama = dialog.getByPlaceholder(/contoh: shift pagi/i);
      await inputNama.evaluate((el) => el.removeAttribute("required"));

      await dialog
        .getByRole("button", { name: /simpan master shift/i })
        .click();

      await expect(dialog.getByText(/nama shift wajib diisi/i)).toBeVisible();
    });

    await test.step("Submit jam masuk tidak lengkap", async () => {
      const dialog = page.getByRole("dialog");
      await dialog
        .getByPlaceholder(/contoh: shift pagi/i)
        .fill("Test Validation");

      // Kosongkan menit masuk
      const timeInputs = dialog.locator('input[type="text"]');
      await timeInputs.nth(1).clear();

      await dialog
        .getByRole("button", { name: /simpan master shift/i })
        .click();
      await expect(
        dialog.getByText(/isi jam masuk dengan lengkap/i),
      ).toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [4] BUSINESS LOGIC: Manipulasi Waktu
  // ----------------------------------------------------------
  test("business logic: format input waktu membatasi logika jam dan abjad", async ({
    page,
  }) => {
    await bukaTambahShift(page);
    const dialog = page.getByRole("dialog");
    const timeInputs = dialog.locator('input[type="text"]');

    await test.step("Maksimal nilai jam adalah 23", async () => {
      await timeInputs.nth(0).fill("99");
      await expect(timeInputs.nth(0)).toHaveValue("23");
    });

    await test.step("Maksimal nilai menit adalah 59", async () => {
      await timeInputs.nth(1).fill("99");
      await expect(timeInputs.nth(1)).toHaveValue("59");
    });

    await test.step("Input abjad diabaikan/dibersihkan", async () => {
      await timeInputs.nth(0).clear();

      // [PERBAIKAN] Sesuaikan input dengan batasan fisik elemen DOM (maxLength=2).
      // Mengirimkan kombinasi huruf dan angka maksimal 2 karakter.
      await timeInputs.nth(0).fill("a1");

      // DOM menerima "a1", fungsi onChange membuang "a", menyisakan "1".
      await expect(timeInputs.nth(0)).toHaveValue("1");
    });
  });

  // ----------------------------------------------------------
  // [5] BUSINESS LOGIC: Auto Lintas Hari
  // ----------------------------------------------------------
  test("business logic: deteksi otomatis lintas hari aktif jika jam pulang <= jam masuk", async ({
    page,
  }) => {
    await bukaTambahShift(page);
    const dialog = page.getByRole("dialog");
    const checkbox = dialog.locator("#lintas-hari");

    await test.step("Lintas hari aktif saat shift malam (22:00 -> 06:00)", async () => {
      await isiWaktuShift(dialog, {
        inJam: "22",
        inMnt: "00",
        outJam: "06",
        outMnt: "00",
      });
      await expect(checkbox).toBeChecked();
    });

    await test.step("Lintas hari aktif saat siklus 24 jam penuh (08:00 -> 08:00)", async () => {
      await isiWaktuShift(dialog, {
        inJam: "08",
        inMnt: "00",
        outJam: "08",
        outMnt: "00",
      });
      await expect(checkbox).toBeChecked();
    });

    await test.step("Lintas hari non-aktif saat shift normal (08:00 -> 16:00)", async () => {
      await isiWaktuShift(dialog, {
        inJam: "08",
        inMnt: "00",
        outJam: "16",
        outMnt: "00",
      });
      await expect(checkbox).not.toBeChecked();
    });
  });

  // ----------------------------------------------------------
  // [6] FILTERING
  // ----------------------------------------------------------
  test("filter: memilah data berdasarkan status shift", async ({ page }) => {
    await test.step("Filter Aktif", async () => {
      await page.getByRole("combobox").click();
      await page.getByRole("option", { name: /^aktif$/i }).click();

      // Seluruh row yang memiliki data harus memiliki teks "Aktif"
      const rows = page.locator("tbody tr");
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        if (
          (await rows
            .nth(i)
            .getByText(/tidak ada data shift/i)
            .count()) === 0
        ) {
          await expect(rows.nth(i)).toContainText("Aktif");
        }
      }
    });

    await test.step("Kembali ke filter Semua Status", async () => {
      const select = page.getByRole("combobox");
      await select.click();
      await page.getByRole("option", { name: /semua status/i }).click();
      await expect(select).toContainText("Semua Status");
    });
  });

  // ----------------------------------------------------------
  // [7] DIALOG BATAL
  // ----------------------------------------------------------
  test("dialog hapus: klik batal mencegah proses nonaktif berjalan", async ({
    page,
  }) => {
    const namaShift = `Shift Batal Hapus ${Date.now()}`;

    // Setup: Buat data
    await bukaTambahShift(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/contoh: shift pagi/i).fill(namaShift);
    await isiWaktuShift(dialog, {
      inJam: "08",
      inMnt: "00",
      outJam: "16",
      outMnt: "00",
    });
    await dialog.getByRole("button", { name: /simpan master shift/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });

    const row = getShiftRow(page, namaShift);
    await row
      .getByRole("button", { name: /buka menu/i })
      .first()
      .click();
    await page.getByRole("menuitem", { name: /non-aktifkan/i }).click();

    const alertDialog = page.getByRole("alertdialog");
    await alertDialog.getByRole("button", { name: /batal/i }).click();

    await expect(alertDialog).toBeHidden();
    await expect(row).toBeVisible();
    await expect(row).toContainText("Aktif");
  });

  // ----------------------------------------------------------
  // [8] UNHAPPY PATH: Toleransi Negatif
  // ----------------------------------------------------------
  test("unhappy: input toleransi negatif akan memunculkan pesan error", async ({
    page,
  }) => {
    await bukaTambahShift(page);
    const dialog = page.getByRole("dialog");

    await dialog.getByPlaceholder(/contoh: shift pagi/i).fill("Shift Minus");
    await isiWaktuShift(dialog, {
      inJam: "08",
      inMnt: "00",
      outJam: "16",
      outMnt: "00",
    });

    // [PERBAIKAN] Lepas atribut min="0" bawaan HTML5 agar event
    // submit bisa lolos ke validasi handleSubmit React.
    const inputToleransi = dialog.locator('input[type="number"]');
    await inputToleransi.evaluate((el) => el.removeAttribute("min"));

    // Paksa masukkan angka negatif
    await inputToleransi.fill("-15");
    await dialog.getByRole("button", { name: /simpan master shift/i }).click();

    await expect(
      dialog.getByText(/toleransi tidak boleh negatif/i),
    ).toBeVisible();
  });

  // ----------------------------------------------------------
  // [9] EDIT PRE-FILL VALIDATION
  // ----------------------------------------------------------
  test("edit: form dialog memuat data lama (pre-fill) dengan benar sebelum diedit", async ({
    page,
  }) => {
    const namaShift = `Shift Prefill ${Date.now()}`;

    // 1. Buat data
    await bukaTambahShift(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/contoh: shift pagi/i).fill(namaShift);
    await isiWaktuShift(dialog, {
      inJam: "10",
      inMnt: "30",
      outJam: "18",
      outMnt: "45",
    });
    await dialog.locator('input[type="number"]').fill("20");
    await dialog.getByRole("button", { name: /simpan master shift/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });

    // 2. Buka Edit dan verifikasi isinya
    const row = getShiftRow(page, namaShift);
    await row.getByRole("cell").last().getByRole("button").click();
    await page.getByRole("menuitem", { name: /edit shift/i }).click();

    // Pastikan data lama tertampil dengan tepat
    await expect(dialog.getByPlaceholder(/contoh: shift pagi/i)).toHaveValue(
      namaShift,
    );
    const timeInputs = dialog.locator('input[type="text"]');
    await expect(timeInputs.nth(0)).toHaveValue("10");
    await expect(timeInputs.nth(1)).toHaveValue("30");
    await expect(timeInputs.nth(2)).toHaveValue("18");
    await expect(timeInputs.nth(3)).toHaveValue("45");
    await expect(dialog.locator('input[type="number"]')).toHaveValue("20");

    // Cleanup agar tabel bersih
    await dialog.getByRole("button", { name: /batal|x/i }).click();
  });

  // ----------------------------------------------------------
  // [10] UBAH STATUS VIA FORM
  // ----------------------------------------------------------
  test("edit: status shift dapat dinonaktifkan langsung melalui dropdown form edit", async ({
    page,
  }) => {
    const namaShift = `Shift Dropdown ${Date.now()}`;

    // 1. Buat data
    await bukaTambahShift(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/contoh: shift pagi/i).fill(namaShift);
    await isiWaktuShift(dialog, {
      inJam: "08",
      inMnt: "00",
      outJam: "16",
      outMnt: "00",
    });
    await dialog.getByRole("button", { name: /simpan master shift/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });

    // 2. Edit dan ubah status
    const row = getShiftRow(page, namaShift);
    await row.getByRole("cell").last().getByRole("button").click();
    await page.getByRole("menuitem", { name: /edit shift/i }).click();

    await dialog.getByRole("combobox").click();
    await page
      .getByRole("option", { name: /non-aktif \(diarsipkan\)/i })
      .click();
    await dialog.getByRole("button", { name: /simpan master shift/i }).click();

    // 3. Verifikasi pindah ke tab non-aktif
    await page.getByRole("combobox").first().click(); // Dropdown filter di luar
    await page.getByRole("option", { name: /^non-aktif$/i }).click();

    const inactiveRow = getShiftRow(page, namaShift);
    await expect(inactiveRow).toBeVisible({ timeout: 10_000 });
    await expect(inactiveRow).toContainText("Non-Aktif");
  });
});
