import { test, expect, Page } from "@playwright/test";

// ============================================================
// HELPER: Login (dipakai ulang di tiap test)
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
// HELPER: Buat invoice baru (dipakai di happy path & fase bayar)
// Mengembalikan nomor referensi invoice yang baru dibuat.
// ============================================================
async function buatInvoiceBaru(page: Page): Promise<string> {
  await page.goto(
    "http://localhost:3000/dashboard/outlet/penjualan/buatPenjualan",
  );
  await expect(
    page.getByRole("heading", { name: /buat penjualan/i }),
  ).toBeVisible();

  // Pilih pelanggan
  const pelangganCombobox = page
    .getByRole("combobox")
    .filter({ hasText: /pilih pelanggan/i });
  await pelangganCombobox.click();
  await page.getByPlaceholder(/cari pelanggan/i).fill("a");
  await page.getByRole("option").first().click();

  // Pilih produk
  const produkCombobox = page
    .getByRole("combobox")
    .filter({ hasText: /pilih produk/i });
  await produkCombobox.click();
  await page.getByRole("option").first().click();

  // Isi jumlah
  const inputJumlah = page.getByLabel(/jumlah/i).first();
  await inputJumlah.clear();
  await inputJumlah.fill("2");
  await inputJumlah.blur();

  // Submit
  const inputKeterangan = page.getByLabel(/keterangan/i);
  await inputKeterangan.fill("Transaksi E2E Test via Playwright");
  await inputKeterangan.press("Enter");

  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: /ya, lanjutkan/i }).click();
  await expect(page.getByText(/berhasil/i).first()).toBeVisible();

  await page.waitForURL("**/dashboard/outlet/penjualan");

  // Ambil nomor referensi dari baris pertama (invoice yang baru dibuat)
  const firstRow = page.getByRole("row").nth(1);
  const refCell = firstRow.getByRole("cell").first();
  const noReferensi = (await refCell.textContent()) ?? "";
  return noReferensi.trim();
}

// ============================================================
// HELPER: Klik tombol aksi (ikon tanpa accessible name) di baris tabel
// Root cause error Step 5: tombol hanya berisi <img>, tanpa aria-label/text,
// sehingga getByRole("button", { name: /buka menu/i }) tidak bisa match.
// Solusi: ambil cell terakhir dari baris, lalu klik button di dalamnya.
// ============================================================
async function klikTombolAksiOnRow(row: ReturnType<Page["getByRole"]>) {
  const aksiCell = row.getByRole("cell").last();
  await aksiCell.getByRole("button").click();
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe("E2E - Alur Penerbitan Faktur Penjualan (Invoice)", () => {
  test.setTimeout(90000);

  // ----------------------------------------------------------
  // [1] HAPPY PATH: Buat invoice → bayar lunas
  // ----------------------------------------------------------
  test("happy path: buat invoice baru lalu bayar lunas dengan uang pas", async ({
    page,
  }) => {
    await test.step("Login", async () => {
      await login(page);
    });

    await test.step("Buat invoice baru", async () => {
      await buatInvoiceBaru(page);
    });

    await test.step("Bayar invoice dari tabel penjualan", async () => {
      // Tunggu tabel ter-render
      await page.waitForSelector("tbody tr", { state: "visible" });

      const firstRow = page.getByRole("row").nth(1);

      // FIX: klik tombol aksi via cell terakhir (tombol tidak punya accessible name)
      await klikTombolAksiOnRow(firstRow);

      // Pilih menu "Bayar"
      await page.getByRole("menuitem", { name: /terima penjualan/i }).click();

      await expect(
        page.getByRole("heading", { name: /terima pembayaran/i }),
      ).toBeVisible();

      // Pilih akun kas
      const kasCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih akun kas/i });
      await kasCombobox.click();
      await page.getByRole("option").first().click();

      // Pilih metode pembayaran
      const metodeCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih metode/i });
      await metodeCombobox.click();
      await page.getByRole("option").first().click();

      // Klik "Bayar Uang Pas" lalu verifikasi input tidak kosong
      await page.getByRole("button", { name: /bayar uang pas/i }).click();
      const inputJumlahBayar = page.getByLabel(/jumlah diterima/i);
      const nilaiSetelahUangPas = await inputJumlahBayar.inputValue();
      expect(nilaiSetelahUangPas).not.toBe("");
      expect(nilaiSetelahUangPas).not.toBe("0");

      // Verifikasi panel simulasi muncul setelah nominal diisi
      await expect(
        page.getByText(/simulasi setelah pembayaran/i),
      ).toBeVisible();

      // Isi catatan dan submit
      const inputCatatan = page.getByLabel(/catatan pembayaran/i);
      await inputCatatan.fill("Lunas by E2E Bot");
      await inputCatatan.press("Enter");

      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.getByRole("button", { name: /ya, catat/i }).click();

      await expect(page.getByText(/berhasil/i).first()).toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [2] VALIDASI FORM PEMBAYARAN: Akun kas tidak dipilih
  // ----------------------------------------------------------
  test("unhappy: submit pembayaran tanpa pilih akun kas → tampil pesan error", async ({
    page,
  }) => {
    await test.step("Login dan buat invoice", async () => {
      await login(page);
      await buatInvoiceBaru(page);
    });

    await test.step("Buka halaman pembayaran", async () => {
      await page.waitForSelector("tbody tr", { state: "visible" });
      const firstRow = page.getByRole("row").nth(1);
      await klikTombolAksiOnRow(firstRow);
      await page.getByRole("menuitem", { name: /terima penjualan/i }).click();
      await expect(
        page.getByRole("heading", { name: /terima pembayaran/i }),
      ).toBeVisible();
    });

    await test.step("Submit tanpa pilih akun kas → error", async () => {
      // Langsung klik submit tanpa isi apapun
      await page.getByRole("button", { name: /proses pembayaran/i }).click();

      await expect(page.getByText(/silakan pilih akun kas/i)).toBeVisible();

      // AlertDialog tidak boleh muncul
      await expect(page.getByRole("alertdialog")).not.toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [3] VALIDASI FORM PEMBAYARAN: Metode pembayaran tidak dipilih
  // ----------------------------------------------------------
  test("unhappy: submit pembayaran tanpa pilih metode → tampil pesan error", async ({
    page,
  }) => {
    await test.step("Login dan buat invoice", async () => {
      await login(page);
      await buatInvoiceBaru(page);
    });

    await test.step("Buka halaman pembayaran", async () => {
      await page.waitForSelector("tbody tr", { state: "visible" });
      const firstRow = page.getByRole("row").nth(1);
      await klikTombolAksiOnRow(firstRow);
      await page.getByRole("menuitem", { name: /terima penjualan/i }).click();
      await expect(
        page.getByRole("heading", { name: /terima pembayaran/i }),
      ).toBeVisible();
    });

    await test.step("Isi akun kas, skip metode, submit → error", async () => {
      const kasCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih akun kas/i });
      await kasCombobox.click();
      await page.getByRole("option").first().click();

      // Langsung submit tanpa pilih metode
      await page.getByRole("button", { name: /proses pembayaran/i }).click();

      await expect(
        page.getByText(/silakan pilih metode pembayaran/i),
      ).toBeVisible();
      await expect(page.getByRole("alertdialog")).not.toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [4] VALIDASI FORM PEMBAYARAN: Jumlah bayar 0 / kosong
  // ----------------------------------------------------------
  test("unhappy: submit dengan jumlah bayar kosong → tampil pesan error", async ({
    page,
  }) => {
    await test.step("Login dan buat invoice", async () => {
      await login(page);
      await buatInvoiceBaru(page);
    });

    await test.step("Buka halaman pembayaran", async () => {
      await page.waitForSelector("tbody tr", { state: "visible" });
      const firstRow = page.getByRole("row").nth(1);
      await klikTombolAksiOnRow(firstRow);
      await page.getByRole("menuitem", { name: /terima penjualan/i }).click();
      await expect(
        page.getByRole("heading", { name: /terima pembayaran/i }),
      ).toBeVisible();
    });

    await test.step("Isi akun kas + metode, jumlah dikosongkan, submit → error", async () => {
      const kasCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih akun kas/i });
      await kasCombobox.click();
      await page.getByRole("option").first().click();

      const metodeCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih metode/i });
      await metodeCombobox.click();
      await page.getByRole("option").first().click();

      // Pastikan input jumlah kosong (tidak klik uang pas)
      const inputJumlah = page.getByLabel(/jumlah diterima/i);
      await inputJumlah.clear();

      await page.getByRole("button", { name: /proses pembayaran/i }).click();

      await expect(
        page.getByText(/jumlah pembayaran tidak valid/i),
      ).toBeVisible();
      await expect(page.getByRole("alertdialog")).not.toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [5] VALIDASI FORM PEMBAYARAN: Jumlah bayar melebihi sisa tagihan
  // ----------------------------------------------------------
  test("unhappy: jumlah bayar melebihi sisa tagihan → tampil pesan error", async ({
    page,
  }) => {
    await test.step("Login dan buat invoice", async () => {
      await login(page);
      await buatInvoiceBaru(page);
    });

    await test.step("Buka halaman pembayaran", async () => {
      await page.waitForSelector("tbody tr", { state: "visible" });
      const firstRow = page.getByRole("row").nth(1);
      await klikTombolAksiOnRow(firstRow);
      await page.getByRole("menuitem", { name: /terima penjualan/i }).click();
      await expect(
        page.getByRole("heading", { name: /terima pembayaran/i }),
      ).toBeVisible();
    });

    await test.step("Input jumlah bayar melebihi sisa → error", async () => {
      const kasCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih akun kas/i });
      await kasCombobox.click();
      await page.getByRole("option").first().click();

      const metodeCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih metode/i });
      await metodeCombobox.click();
      await page.getByRole("option").first().click();

      // Input angka yang pasti jauh melebihi sisa tagihan manapun
      const inputJumlah = page.getByLabel(/jumlah diterima/i);
      await inputJumlah.fill("999999999999");
      await inputJumlah.blur();

      await page.getByRole("button", { name: /proses pembayaran/i }).click();

      await expect(
        page.getByText(/jumlah bayar tidak boleh melebihi/i),
      ).toBeVisible();
      await expect(page.getByRole("alertdialog")).not.toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [6] DIALOG KONFIRMASI: Tombol "Batal" tidak eksekusi mutasi
  // ----------------------------------------------------------
  test("dialog konfirmasi: klik batal → dialog tutup, tidak ada perubahan data", async ({
    page,
  }) => {
    await test.step("Login dan buat invoice", async () => {
      await login(page);
      await buatInvoiceBaru(page);
    });

    await test.step("Buka halaman pembayaran", async () => {
      await page.waitForSelector("tbody tr", { state: "visible" });
      const firstRow = page.getByRole("row").nth(1);
      await klikTombolAksiOnRow(firstRow);
      await page.getByRole("menuitem", { name: /terima penjualan/i }).click();
      await expect(
        page.getByRole("heading", { name: /terima pembayaran/i }),
      ).toBeVisible();
    });

    await test.step("Isi form lengkap → buka dialog → klik Batal", async () => {
      // Tunggu toast "berhasil buat invoice" dari step sebelumnya hilang dulu
      await expect(page.getByText(/berhasil/i).first()).not.toBeVisible({
        timeout: 10000,
      });

      const kasCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih akun kas/i });
      await kasCombobox.click();
      await page.getByRole("option").first().click();

      const metodeCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /pilih metode/i });
      await metodeCombobox.click();
      await page.getByRole("option").first().click();

      await page.getByRole("button", { name: /bayar uang pas/i }).click();
      await page.getByRole("button", { name: /proses pembayaran/i }).click();

      // Dialog harus muncul
      await expect(page.getByRole("alertdialog")).toBeVisible();

      // Klik Batal
      await page.getByRole("button", { name: /batal/i }).click();

      // Dialog harus hilang
      await expect(page.getByRole("alertdialog")).not.toBeVisible();

      // Halaman tidak berpindah, form masih ada
      await expect(
        page.getByRole("heading", { name: /terima pembayaran/i }),
      ).toBeVisible();

      // Tidak ada toast "berhasil"
      await expect(page.getByText(/berhasil/i).first()).not.toBeVisible();
    });
  });

  // ----------------------------------------------------------
  // [7] TOMBOL "BAYAR UANG PAS": Verifikasi nilai yang terisi
  // ----------------------------------------------------------
  test("tombol bayar uang pas mengisi input dengan nilai sisa tagihan dari API", async ({
    page,
  }) => {
    await test.step("Login dan buat invoice", async () => {
      await login(page);
      await buatInvoiceBaru(page);
    });

    await test.step("Buka halaman pembayaran", async () => {
      await page.waitForSelector("tbody tr", { state: "visible" });
      const firstRow = page.getByRole("row").nth(1);
      await klikTombolAksiOnRow(firstRow);
      await page.getByRole("menuitem", { name: /terima penjualan/i }).click();
      await expect(
        page.getByRole("heading", { name: /terima pembayaran/i }),
      ).toBeVisible();
    });

    await test.step("Klik uang pas → nilai input sesuai sisa tagihan di panel", async () => {
      // Ambil nilai sisa tagihan dari panel ringkasan (teks setelah label "Sisa Tagihan")
      // Panel menampilkan nilai dalam format "Rp 39.600" — kita bandingkan secara tekstual
      const sisaTagihanEl = page.getByText(/sisa tagihan/i).first();
      // Baris berikutnya adalah nilai rupiahnya; kita ambil via region terdekat
      // Cara paling robust: baca input setelah klik uang pas dan pastikan > 0
      await page.getByRole("button", { name: /bayar uang pas/i }).click();

      const inputJumlah = page.getByLabel(/jumlah diterima/i);
      const nilai = await inputJumlah.inputValue();

      // Nilai harus berupa angka dengan format ribuan (mengandung digit)
      expect(nilai).toMatch(/\d/);
      // Nilai yang ter-parse harus > 0
      const parsed = parseInt(nilai.replace(/\D/g, ""), 10);
      expect(parsed).toBeGreaterThan(0);

      // Panel simulasi harus muncul (nominalInput > 0)
      await expect(
        page.getByText(/simulasi setelah pembayaran/i),
      ).toBeVisible();

      // "Sisa Hutang Baru" harus Rp 0 ketika uang pas
      await expect(page.getByText(/sisa hutang baru/i)).toBeVisible();
      // Nilai sisa hutang baru = 0
      const containerSimulasi = page
        .getByText(/simulasi setelah pembayaran/i)
        .locator("..");
      await expect(containerSimulasi.getByText(/rp\s*0/i)).toBeVisible();
    });
  });
});
