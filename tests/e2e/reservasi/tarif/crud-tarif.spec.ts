import { test, expect, type Page, type Route } from "@playwright/test";

// =============================================================================
// HELPERS & AUTH SETUP
// =============================================================================

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

// -----------------------------------------------------------------------------
// BUTLER UTILITY: API GUARD
// Mencegah Playwright mencegat request HTML agar halaman SSR Next.js bisa render
// -----------------------------------------------------------------------------
function withApiGuard(handler: (route: Route) => any) {
  return (route: Route) => {
    const type = route.request().resourceType();
    if (type === "fetch" || type === "xhr") {
      return handler(route);
    }
    return route.continue();
  };
}

// =============================================================================
// MOCK DATA FIXTURES
// =============================================================================

const MOCK_TIPE_ASET = [
  { id: "tipe-001", namaTipeAset: "Meja Billiard VIP" },
  { id: "tipe-002", namaTipeAset: "Lapangan Futsal" },
];

const MOCK_TARIF_LIST = [
  {
    _id: "tarif-001",
    namaTarif: "Tarif Reguler Siang",
    basisPerhitungan: "per jam",
    harga: 35000,
    durasiMinimum: 1,
    isActive: true,
    hariAktif: [1, 2, 3, 4, 5],
    jamMulai: "08:00",
    jamSelesai: "17:00",
    prioritas: 1,
    tipeAsetID: [MOCK_TIPE_ASET[0]], // Terhubung ke Meja Billiard
  },
  {
    _id: "tarif-002",
    namaTarif: "Tarif Promo Weekend",
    basisPerhitungan: "per sesi",
    harga: 150000,
    durasiMinimum: 1,
    isActive: false, // Nonaktif
    hariAktif: [0, 6], // Sabtu, Minggu
    jamMulai: null, // 24 Jam
    jamSelesai: null,
    prioritas: 10,
    tipeAsetID: [], // Semua Aset
  },
];

const MOCK_SINGLE_TARIF = MOCK_TARIF_LIST[0];

// =============================================================================
// URL CONSTANTS
// =============================================================================

const BASE = "http://localhost:3000";
const LIST_PATH = "/dashboard/outlet/reservasi/tarif";
const BUAT_PATH = "/dashboard/outlet/reservasi/tarif/buatTarif";
const EDIT_PATH = "/dashboard/outlet/reservasi/tarif/tarif-001/edit";

// =============================================================================
// SUITE 1 — Halaman Daftar Tarif
// =============================================================================

test.describe("E2E — Tarif › Halaman Daftar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("harus merender UI utama (search bar, tombol tambah, tabel header)", async ({
    page,
  }) => {
    await page.route(
      "**/tarif",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    await expect(page.getByPlaceholder(/cari nama tarif/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /tambah tarif/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: /nama & status tarif/i }),
    ).toBeVisible();
  });

  test("harus merender data tarif beserta format Rupiah, lencana hari, dan status", async ({
    page,
  }) => {
    await page.route(
      "**/tarif",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    // Data 1: Tarif Reguler
    await expect(
      page.getByText("Tarif Reguler Siang", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Rp 35.000")).toBeVisible();
    await expect(page.getByText("Sen, Sel, Rab, Kam, Jum")).toBeVisible();
    await expect(page.getByText("08:00 - 17:00")).toBeVisible();
    await expect(page.getByText("Meja Billiard VIP")).toBeVisible();
    await expect(page.getByText("Aktif", { exact: true })).toBeVisible();

    // Data 2: Promo Weekend (Nonaktif & Semua Aset & 24 Jam)
    await expect(
      page.getByText("Tarif Promo Weekend", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Rp 150.000")).toBeVisible();
    await expect(page.getByText("Min, Sab")).toBeVisible();
    await expect(page.getByText("24 Jam Penuh")).toBeVisible();
    await expect(page.getByText("Semua Aset")).toBeVisible();
    await expect(page.getByText("Nonaktif", { exact: true })).toBeVisible();
  });

  test("search filter harus menyaring data di tabel secara client-side", async ({
    page,
  }) => {
    await page.route(
      "**/tarif",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const searchInput = page.getByPlaceholder(/cari nama tarif/i);
    await searchInput.fill("Promo");

    await expect(page.getByText("Tarif Promo Weekend")).toBeVisible();
    await expect(page.getByText("Tarif Reguler Siang")).not.toBeVisible();
  });

  test("search kosong harus menampilkan empty state khusus", async ({
    page,
  }) => {
    await page.route(
      "**/tarif",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);
    await page.getByPlaceholder(/cari nama tarif/i).fill("Tarif Fiktif");

    await expect(page.getByText(/tidak ada tarif yang cocok/i)).toBeVisible();
  });

  test("klik batal di modal hapus harus menutup modal tanpa menghapus data", async ({
    page,
  }) => {
    await page.route(
      "**/tarif",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const row = page
      .getByRole("row")
      .filter({ hasText: "Tarif Reguler Siang" });
    await row.getByRole("button").last().click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: /batal/i }).click();

    await expect(page.getByRole("alertdialog")).not.toBeVisible();
    await expect(
      page.getByText("Tarif Reguler Siang", { exact: true }),
    ).toBeVisible();
  });

  test("konfirmasi hapus loading state: tombol harus disabled dan teks berubah (STRICT UX TEST)", async ({
    page,
  }) => {
    await page.route(
      "**/tarif",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        }),
      ),
    );

    // Simulasi delay 2 detik dari server agar kita bisa menangkap loading state
    await page.route(
      "**/tarif/tarif-001",
      withApiGuard(async (route) => {
        await new Promise((r) => setTimeout(r, 2000));
        return route.fulfill({ status: 200, body: "{}" });
      }),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const row = page
      .getByRole("row")
      .filter({ hasText: "Tarif Reguler Siang" });
    await row.getByRole("button").last().click();

    await page.getByRole("button", { name: /ya, hapus tarif/i }).click();

    // PENGUJIAN INI AKAN GAGAL JIKA MODAL AUTO-CLOSE
    // Playwright menuntut tombol "Menghapus..." ada dan tidak bisa diklik.
    await expect(
      page.getByRole("button", { name: /menghapus/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /menghapus/i }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /batal/i })).toBeDisabled();
  });

  test("konfirmasi hapus happy path: toast sukses muncul dan data hilang dari tabel", async ({
    page,
  }) => {
    let callCount = 0;

    await page.route(
      "**/tarif",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          callCount++;
          const data = callCount === 1 ? MOCK_TARIF_LIST : [];
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data }),
          });
        }
        return route.continue();
      }),
    );

    await page.route(
      "**/tarif/tarif-001",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const row = page
      .getByRole("row")
      .filter({ hasText: "Tarif Reguler Siang" });
    await row.getByRole("button").last().click();
    await page.getByRole("button", { name: /ya, hapus tarif/i }).click();

    await expect(page.getByText(/tarif berhasil dihapus/i).first()).toBeVisible(
      {
        timeout: 5000,
      },
    );
    await expect(
      page.getByText("Tarif Reguler Siang", { exact: true }),
    ).not.toBeVisible();
  });
});

// =============================================================================
// SUITE 2 — Halaman Buat Tarif
// =============================================================================

test.describe("E2E — Tarif › Halaman Buat", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Kita perlu mem-mock data aset karena halaman buat tarif menarik relasi aset
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_TIPE_ASET }),
        }),
      ),
    );
  });

  test("validasi Zod: jam mulai harus lebih awal dari jam selesai", async ({
    page,
  }) => {
    await page.goto(`${BASE}${BUAT_PATH}`);

    // Isi jam mulai > jam selesai (Invalid)
    // Ingat, lokator custom input kita pakai locator jam dan menit
    const inputsJam = page.locator('input[placeholder="00"]');

    await inputsJam.nth(0).fill("15"); // Mulai Jam
    await inputsJam.nth(1).fill("00"); // Mulai Menit

    await inputsJam.nth(2).fill("10"); // Selesai Jam
    await inputsJam.nth(3).fill("00"); // Selesai Menit

    // Trigger blur/submit untuk memvalidasi
    await page.getByRole("button", { name: /simpan tarif/i }).click();

    // Error kustom Zod harus muncul
    await expect(
      page.getByText(/jam mulai harus lebih awal dari jam selesai/i).first(),
    ).toBeVisible();
  });

  test("happy path: membuat tarif per sesi untuk akhir pekan ke aset spesifik", async ({
    page,
  }) => {
    let capturedBody: any = null;

    await page.route(
      "**/tarif",
      withApiGuard((route) => {
        if (route.request().method() === "POST") {
          capturedBody = route.request().postDataJSON();
          return route.fulfill({ status: 201, body: "{}" });
        }
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        });
      }),
    );

    await page.goto(`${BASE}${BUAT_PATH}`);

    // 1. Info Dasar
    await page.locator('input[name="namaTarif"]').fill("Tarif Sesi Super");
    await page.locator('input[name="prioritas"]').fill("5");
    // Tarif default-nya aktif, kita coba biarkan aktif

    // 2. Aturan Harga
    await page.getByRole("combobox").selectOption("per sesi");
    // Karena input harga tidak punya name (menggunakan Controller), kita ambil via label terdekat
    await page.locator('input[name="harga"]').fill("250000");
    await page.locator('input[name="durasiMinimum"]').fill("2");

    // 3. Jadwal (Matikan selain Sabtu & Minggu)
    await page.getByText("Senin", { exact: true }).click();
    await page.getByText("Selasa", { exact: true }).click();
    await page.getByText("Rabu", { exact: true }).click();
    await page.getByText("Kamis", { exact: true }).click();
    await page.getByText("Jumat", { exact: true }).click();
    // Default form mencentang semua, jika di-klik maka mati. Sisakan Sabtu & Minggu.

    // Isi Waktu (20:00 - 23:59)
    const inputsJam = page.locator('input[placeholder="00"]');
    await inputsJam.nth(0).fill("20");
    await inputsJam.nth(1).fill("00");
    await inputsJam.nth(2).fill("23");
    await inputsJam.nth(3).fill("59");

    // 4. Aset Terkait
    await page.getByText("Meja Billiard VIP", { exact: true }).click();

    // 5. Submit
    await page.getByRole("button", { name: /simpan tarif/i }).click();

    // Verifikasi Keberhasilan & Pengalihan
    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
    await expect(
      page.getByText(/tarif berhasil dibuat/i).first(),
    ).toBeVisible();

    // Analisis ketepatan Payload!
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.namaTarif).toBe("Tarif Sesi Super");
    expect(capturedBody.basisPerhitungan).toBe("per sesi");
    expect(capturedBody.harga).toBe(250000);
    expect(capturedBody.durasiMinimum).toBe(2);
    expect(capturedBody.hariAktif.sort()).toEqual([0, 6]); // 0=Minggu, 6=Sabtu
    expect(capturedBody.jamMulai).toBe("20:00");
    expect(capturedBody.jamSelesai).toBe("23:59");
    expect(capturedBody.tipeAsetID).toEqual(["tipe-001"]);
  });
});

// =============================================================================
// SUITE 3 — Halaman Edit Tarif
// =============================================================================

test.describe("E2E — Tarif › Halaman Edit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_TIPE_ASET }),
        }),
      ),
    );
  });

  test("guard: id 'undefined' harus menampilkan layar error tanpa melempar crash", async ({
    page,
  }) => {
    await page.goto(`${BASE}/dashboard/outlet/reservasi/tarif/undefined/edit`);

    await expect(page.getByText(/id tarif tidak valid/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /kembali ke daftar/i }),
    ).toBeVisible();
  });

  test("harus melakukan pre-fill form sesuai data API, lalu update mengirim payload akurat", async ({
    page,
  }) => {
    let capturedBody: any = null;

    // API Tarikan Data Edit
    await page.route(
      "**/tarif/tarif-001",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          // Bentuk respons GET detail tarif yang dimapping
          const responsePayload = {
            ...MOCK_SINGLE_TARIF,
            dataAset: [{ id: "tipe-001" }], // Mensimulasikan format balikan backend
          };
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: responsePayload }),
          });
        }
        if (route.request().method() === "PUT") {
          capturedBody = route.request().postDataJSON();
          return route.fulfill({ status: 200, body: "{}" });
        }
        return route.continue();
      }),
    );

    await page.route(
      "**/tarif",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);

    // Verifikasi Pre-fill (Tunggu form beres prefill nama)
    const inputNama = page.locator('input[name="namaTarif"]');
    await expect(inputNama).toHaveValue("Tarif Reguler Siang");

    const containerHarga = page
      .locator("label")
      .filter({ hasText: "Harga (Rp)" })
      .locator("..");
    await expect(containerHarga.locator("input")).toHaveValue("35.000");

    // Modifikasi Data
    await inputNama.fill("Tarif Reguler Malam");
    await containerHarga.locator("input").fill("45000"); // Naik harga

    // Submit Perubahan
    await page.getByRole("button", { name: /simpan perubahan/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));

    // Validasi Mutasi Payload
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.namaTarif).toBe("Tarif Reguler Malam");
    expect(capturedBody.harga).toBe(45000);
    // Sisanya harus dipertahankan sesuai prefill!
    expect(capturedBody.hariAktif.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(capturedBody.tipeAsetID).toEqual(["tipe-001"]);
  });

  test("tombol batal harus mengembalikan navigasi tanpa menyimpan", async ({
    page,
  }) => {
    await page.route(
      "**/tarif/tarif-001",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_SINGLE_TARIF }),
        }),
      ),
    );
    await page.route(
      "**/tarif",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ data: MOCK_TARIF_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);
    await page.getByRole("button", { name: /batal/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
  });
});
