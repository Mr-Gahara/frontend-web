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
  { id: "tipe-002", namaTipeAset: "Kamar Karaoke" },
];

const MOCK_ASET_LIST = [
  {
    id: "ast-001",
    namaAset: "Meja Billiard 01",
    status: "tersedia",
    dataAset: { id: "tipe-001", namaTipeAset: "Meja Billiard VIP" },
  },
  {
    id: "ast-002",
    namaAset: "Ruang Karaoke Alpha",
    status: "digunakan",
    dataAset: { id: "tipe-002", namaTipeAset: "Kamar Karaoke" },
  },
  {
    id: "ast-003",
    namaAset: "Meja Rusak Total",
    status: "perbaikan",
    dataAset: null, // Simulasi tipe aset yang dihapus/hilang
  },
];

const MOCK_SINGLE_ASET_TERSEDIA = MOCK_ASET_LIST[0];
const MOCK_SINGLE_ASET_DIGUNAKAN = MOCK_ASET_LIST[1];

// =============================================================================
// URL CONSTANTS
// =============================================================================

const BASE = "http://localhost:3000";
const LIST_PATH = "/dashboard/outlet/reservasi/aset";
const BUAT_PATH = "/dashboard/outlet/reservasi/aset/buatAset";
const EDIT_PATH_TERSEDIA = "/dashboard/outlet/reservasi/aset/ast-001/edit";
const EDIT_PATH_DIGUNAKAN = "/dashboard/outlet/reservasi/aset/ast-002/edit";

// =============================================================================
// SUITE 1 — Halaman Daftar Aset
// =============================================================================

test.describe("E2E — Aset › Halaman Daftar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("harus merender UI utama (search bar, tombol tambah, tabel header)", async ({
    page,
  }) => {
    await page.route(
      "**/aset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_ASET_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    await expect(page.getByPlaceholder(/cari nama aset/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /tambah aset baru/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: /nama aset/i }),
    ).toBeVisible();
  });

  test("harus merender data aset dengan status badge yang sesuai (Tersedia, Digunakan, Perbaikan)", async ({
    page,
  }) => {
    await page.route(
      "**/aset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_ASET_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    // Data 1: Tersedia
    await expect(
      page.getByText("Meja Billiard 01", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Meja Billiard VIP", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Tersedia", { exact: true })).toBeVisible();

    // Data 2: Digunakan
    await expect(
      page.getByText("Ruang Karaoke Alpha", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Digunakan (Booking)", { exact: true }),
    ).toBeVisible();

    // Data 3: Perbaikan (Dan Fallback Tipe Aset)
    await expect(
      page.getByText("Meja Rusak Total", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Tipe Tidak Diketahui", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Perbaikan", { exact: true })).toBeVisible();
  });

  test("search filter harus menyaring data di tabel secara client-side", async ({
    page,
  }) => {
    await page.route(
      "**/aset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_ASET_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const searchInput = page.getByPlaceholder(/cari nama aset/i);
    await searchInput.fill("Karaoke");

    await expect(
      page.getByText("Ruang Karaoke Alpha", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Meja Billiard 01", { exact: true }),
    ).not.toBeVisible();
  });

  test("konfirmasi hapus loading state: tombol harus disabled dan teks berubah (STRICT UX TEST)", async ({
    page,
  }) => {
    await page.route(
      "**/aset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_ASET_LIST }),
        }),
      ),
    );

    // Simulasi delay server
    await page.route(
      "**/aset/ast-001",
      withApiGuard(async (route) => {
        await new Promise((r) => setTimeout(r, 2000));
        return route.fulfill({ status: 200, body: "{}" });
      }),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const row = page.getByRole("row").filter({ hasText: "Meja Billiard 01" });
    await row.getByRole("button").last().click();

    await page.getByRole("button", { name: /ya, hapus aset/i }).click();

    // PENGUJIAN INI AKAN GAGAL JIKA MODAL AUTO-CLOSE
    await expect(
      page.getByRole("button", { name: /menghapus/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /menghapus/i }),
    ).toBeDisabled();
  });

  test("konfirmasi hapus happy path: toast sukses muncul dan data hilang dari tabel", async ({
    page,
  }) => {
    let callCount = 0;

    await page.route(
      "**/aset",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          callCount++;
          const data = callCount === 1 ? MOCK_ASET_LIST : [];
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
      "**/aset/ast-001",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const row = page.getByRole("row").filter({ hasText: "Meja Billiard 01" });
    await row.getByRole("button").last().click();
    await page.getByRole("button", { name: /ya, hapus aset/i }).click();

    await expect(
      page.getByText(/data aset berhasil dihapus/i).first(),
    ).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText("Meja Billiard 01", { exact: true }),
    ).not.toBeVisible();
  });
});

// =============================================================================
// SUITE 2 — Halaman Buat Aset
// =============================================================================

test.describe("E2E — Aset › Halaman Buat", () => {
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

  test("validasi Zod: error muncul jika form disubmit dalam keadaan kosong", async ({
    page,
  }) => {
    await page.goto(`${BASE}${BUAT_PATH}`);
    await page.getByRole("button", { name: /simpan aset baru/i }).click();

    await expect(page.getByText(/nama aset wajib diisi/i)).toBeVisible();
    await expect(page.getByText(/tipe aset wajib dipilih/i)).toBeVisible();
  });

  test("happy path: membuat aset baru berhasil mengirim payload akurat ke backend", async ({
    page,
  }) => {
    let capturedBody: any = null;

    await page.route(
      "**/aset",
      withApiGuard((route) => {
        if (route.request().method() === "POST") {
          capturedBody = route.request().postDataJSON();
          return route.fulfill({ status: 201, body: "{}" });
        }
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ data: MOCK_ASET_LIST }),
        });
      }),
    );

    await page.goto(`${BASE}${BUAT_PATH}`);

    // Isi Nama
    await page.locator('input[name="namaAset"]').fill("Ruang VIP B");

    // Pilih Tipe Aset (Combobox Pertama)
    const tipeCombobox = page.getByRole("combobox").first();
    await tipeCombobox.click();
    await page.getByRole("option", { name: "Kamar Karaoke" }).click();

    // Status default adalah 'tersedia', kita ubah ke 'perbaikan' (Combobox Kedua)
    const statusCombobox = page.getByRole("combobox").nth(1);
    await statusCombobox.click();
    await page.getByRole("option", { name: /dalam perbaikan/i }).click();

    // Submit
    await page.getByRole("button", { name: /simpan aset baru/i }).click();

    // Verifikasi Pengalihan & Payload
    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));

    expect(capturedBody).not.toBeNull();
    expect(capturedBody.namaAset).toBe("Ruang VIP B");
    expect(capturedBody.tipeAsetID).toBe("tipe-002");
    expect(capturedBody.status).toBe("perbaikan");
  });
});

// =============================================================================
// SUITE 3 — Halaman Edit Aset (tanpa mock, pakai data asli dari backend)
// =============================================================================
test.describe("E2E — Aset › Halaman Edit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Helper: ambil ID aset pertama dari daftar
  async function getIdAsetPertama(page: Page): Promise<string> {
    await page.goto(`${BASE}${LIST_PATH}`);
    await page.waitForSelector("tbody tr", { state: "visible" });
    // Ambil href dari tombol edit di baris pertama
    const firstRow = page.getByRole("row").nth(1);
    const aksiCell = firstRow.getByRole("cell").last();
    await aksiCell.getByRole("button").click();
    const editItem = page.getByRole("menuitem", { name: /edit/i });
    const href = await editItem.getAttribute("href");
    await page.keyboard.press("Escape");
    // Extract ID dari href: /dashboard/outlet/reservasi/aset/{id}/edit
    const match = href?.match(/aset\/(.+)\/edit/);
    return match?.[1] ?? "";
  }

  // Regresi: fetch detail gagal (404) sebelumnya membuat spinner tampil selamanya
  // karena guard loading ikut memeriksa !asetData sebelum isErrorAset.
  test("aset tidak ditemukan (404) menampilkan pesan error, bukan spinner tanpa akhir", async ({
    page,
  }) => {
    const ID_TIDAK_ADA = "000000000000000000000000";

    await page.route(
      `**/api/aset/${ID_TIDAK_ADA}`,
      withApiGuard((route) =>
        route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            status: "error",
            message: "Aset tidak ditemukan.",
          }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}/${ID_TIDAK_ADA}/edit`);

    // React Query mencoba ulang 3 kali sebelum isError; beri waktu cukup
    await expect(
      page.getByRole("heading", { name: /data tidak ditemukan/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/gagal mengambil data aset/i)).toBeVisible();
  });

  test("harus memuat data aset dan mengisi form dengan benar", async ({
    page,
  }) => {
    await page.goto(`${BASE}${LIST_PATH}`);
    await page.waitForSelector("tbody tr", { state: "visible" });

    // Klik tombol edit di baris pertama
    const firstRow = page.getByRole("row").nth(1);
    await firstRow.getByRole("button", { name: /edit/i }).click();

    await page.waitForURL("**/edit");
    await expect(
      page.getByRole("heading", { name: /edit aset/i }),
    ).toBeVisible();

    // Input nama harus ter-prefill (tidak kosong)
    const inputNama = page.locator('input[name="namaAset"]');
    await expect(inputNama).not.toHaveValue("");

    // Combobox tipe aset harus ter-prefill (tidak menampilkan placeholder)
    const tipeCombobox = page.getByRole("combobox").first();
    await expect(tipeCombobox).not.toHaveText(/pilih kategori tipe aset/i, {
      timeout: 10000,
    });

    // Combobox status harus ter-prefill
    const statusCombobox = page.getByRole("combobox").nth(1);
    await expect(statusCombobox).not.toHaveText(/pilih status/i, {
      timeout: 10000,
    });
  });

  test("happy path: edit nama aset → tersimpan dan redirect ke daftar", async ({
    page,
  }) => {
    await page.goto(`${BASE}${LIST_PATH}`);
    await page.waitForSelector("tbody tr", { state: "visible" });

    // Ambil nama aset pertama sebelum edit
    const firstRow = page.getByRole("row").nth(1);
    const namaAwal = (await firstRow.getByRole("cell").first().innerText())
      .trim()
      .split("\n")[0]
      .trim();

    // Buka edit
    await firstRow.getByRole("button", { name: /edit/i }).click();

    await page.waitForURL("**/edit");

    // Tunggu prefill selesai
    const inputNama = page.locator('input[name="namaAset"]');
    await expect(inputNama).toHaveValue(namaAwal.trim());

    const tipeCombobox = page.getByRole("combobox").first();
    await expect(tipeCombobox).not.toHaveText(/pilih kategori tipe aset/i, {
      timeout: 10000,
    });

    // Edit nama
    const namaBaru = `${namaAwal.trim()} - E2E`;
    await inputNama.clear();
    await inputNama.fill(namaBaru);

    await page.getByRole("button", { name: /simpan perubahan/i }).click();

    await expect(page.getByText(/berhasil diperbarui/i)).toBeVisible({
      timeout: 10000,
    });
    await page.waitForURL(`**${LIST_PATH}`);

    // Kembalikan nama semula (cleanup)
    const updatedRow = page.getByRole("row").nth(1);
    await updatedRow.getByRole("button", { name: /edit/i }).click();
    await page.waitForURL("**/edit");
    await expect(inputNama).toHaveValue(namaBaru);
    await inputNama.clear();
    await inputNama.fill(namaAwal.trim());
    await page.getByRole("button", { name: /simpan perubahan/i }).click();
    await page.waitForURL(`**${LIST_PATH}`);
  });

  test("LOGIKA BISNIS: aset berstatus digunakan menampilkan peringatan biru", async ({
    page,
  }) => {
    // Cari aset dengan status "digunakan" di tabel
    await page.goto(`${BASE}${LIST_PATH}`);
    await page.waitForSelector("tbody tr", { state: "visible" });

    const rowDigunakan = page
      .getByRole("row")
      .filter({ hasText: /digunakan/i })
      .first();

    // Kalau tidak ada aset digunakan, skip test ini
    const count = await rowDigunakan.count();
    test.skip(count === 0, "Tidak ada aset berstatus digunakan di database");

    const aksiCell = rowDigunakan.getByRole("cell").last();
    await aksiCell.getByRole("button").click();
    await page.getByRole("menuitem", { name: /edit/i }).click();

    await page.waitForURL("**/edit");

    const inputNama = page.locator('input[name="namaAset"]');
    await expect(inputNama).not.toHaveValue("", { timeout: 10000 });

    // Peringatan biru harus muncul
    await expect(page.getByText(/perhatian/i).first()).toBeVisible();
    await expect(
      page.getByText(/aset ini saat ini berstatus "digunakan"/i),
    ).toBeVisible();

    // Opsi "Sedang Digunakan" harus disabled di dropdown
    const statusCombobox = page.getByRole("combobox").nth(1);
    await statusCombobox.click();

    const optionDigunakan = page
      .locator('[role="option"]')
      .filter({ hasText: /sedang digunakan/i });
    await expect(optionDigunakan).toBeVisible();
    await expect(optionDigunakan).toBeDisabled();
  });
});
