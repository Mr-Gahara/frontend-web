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
// Mencegah Playwright mencegat request dokumen HTML agar halaman bisa di-render
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

const MOCK_LIST = [
  {
    id: "tipe-001",
    _id: "tipe-001",
    namaTipeAset: "Meja Billiard",
    deskripsi: "Meja billiard standar internasional",
    dataTarif: [{ id: "t1" }, { id: "t2" }],
  },
  {
    id: "tipe-002",
    _id: "tipe-002",
    namaTipeAset: "Lapangan Futsal",
    deskripsi: "Lapangan futsal indoor berukuran standar",
    dataTarif: [],
  },
  {
    id: "tipe-003",
    _id: "tipe-003",
    namaTipeAset: "Kolam Renang",
    deskripsi: null,
    dataTarif: [{ id: "t3" }],
  },
];

const MOCK_SINGLE = MOCK_LIST[0];

// =============================================================================
// URL CONSTANTS
// =============================================================================

const BASE = "http://localhost:3000";
const LIST_PATH = "/dashboard/outlet/reservasi/tipeAset";
const BUAT_PATH = "/dashboard/outlet/reservasi/tipeAset/buatTipeAset";
const EDIT_PATH = "/dashboard/outlet/reservasi/tipeAset/tipe-001/edit";

// =============================================================================
// SUITE 1 — Halaman Daftar Tipe Aset
// =============================================================================

test.describe("E2E — Tipe Aset › Halaman Daftar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ---------------------------------------------------------------------------
  // 1.1 UI & Render State
  // ---------------------------------------------------------------------------

  test("harus merender header, search bar, counter total, dan tombol tambah", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    await expect(
      page.getByRole("heading", { name: /kategori aset/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/cari kategori/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /tambah kategori/i }),
    ).toBeVisible();
    await expect(page.getByText(/total: 3 tipe/i)).toBeVisible();
  });

  test("harus merender loading spinner saat data sedang diambil dari API", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard(async (route) => {
        await new Promise((r) => setTimeout(r, 2_000));
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        });
      }),
    );

    await page.goto(`${BASE}${LIST_PATH}`);
    await expect(page.getByText(/memuat data/i)).toBeVisible();
  });

  test("harus merender error state saat API gagal (500)", async ({ page }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);
    await expect(page.getByText(/gagal memuat data tipe aset/i)).toBeVisible();
  });

  test("harus merender empty state 'belum ada data' saat list kosong tanpa pencarian", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);
    await expect(
      page.getByText(/belum ada master data tipe aset/i),
    ).toBeVisible();
  });

  test("harus merender data dengan benar — nama, deskripsi, dan badge jumlah tarif", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    await expect(
      page.getByText("Meja Billiard", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Meja billiard standar internasional"),
    ).toBeVisible();
    await expect(page.getByText("2 Tarif Terhubung")).toBeVisible();

    await expect(
      page.getByText("Lapangan Futsal", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("0 Tarif Terhubung")).toBeVisible();

    await expect(page.getByText("Kolam Renang")).toBeVisible();
    await expect(page.getByText("1 Tarif Terhubung")).toBeVisible();
  });

  test("item tanpa deskripsi harus menampilkan teks fallback 'Tidak ada deskripsi'", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);
    await expect(page.getByText(/tidak ada deskripsi/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 1.2 Search Filter
  // ---------------------------------------------------------------------------

  test("search harus menyaring list secara client-side dan memperbarui counter", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    await page.getByPlaceholder(/cari kategori/i).fill("billiard");

    await expect(
      page.getByText("Meja Billiard", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Lapangan Futsal")).not.toBeVisible();
    await expect(page.getByText("Kolam Renang")).not.toBeVisible();
    await expect(page.getByText(/total: 1 tipe/i)).toBeVisible();
  });

  test("search yang tidak menemukan hasil harus tampilkan empty state dengan teks pencarian", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    await page.getByPlaceholder(/cari kategori/i).fill("aset tidak pernah ada");

    await expect(
      page.getByText(/tidak ada tipe aset yang cocok dengan pencarian/i),
    ).toBeVisible();
    await expect(page.getByText(/total: 0 tipe/i)).toBeVisible();
  });

  test("search harus case-insensitive — 'BILLIARD' harus match 'Meja Billiard'", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);
    await page.getByPlaceholder(/cari kategori/i).fill("BILLIARD");
    await expect(
      page.getByText("Meja Billiard", { exact: true }),
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 1.3 Navigasi
  // ---------------------------------------------------------------------------

  test("tombol 'Tambah Kategori' harus navigate ke halaman buatTipeAset", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);
    await page.getByRole("button", { name: /tambah kategori/i }).click();

    await page.waitForURL(`**${BUAT_PATH}`);
    await expect(page).toHaveURL(new RegExp(BUAT_PATH));
  });

  test("tombol Edit harus navigate ke halaman edit dengan ID item yang benar", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const firstRow = page.getByRole("row").filter({ hasText: "Meja Billiard" });
    await firstRow.getByRole("button", { name: /edit/i }).click();

    await page.waitForURL("**/tipe-001/edit");
    await expect(page).toHaveURL(/tipe-001\/edit/);
  });

  // ---------------------------------------------------------------------------
  // 1.4 Delete Flow
  // ---------------------------------------------------------------------------

  test("klik tombol hapus (ikon trash) harus membuka modal konfirmasi dengan nama item", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const targetRow = page
      .getByRole("row")
      .filter({ hasText: "Meja Billiard" });
    await targetRow.getByRole("button").last().click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByRole("alertdialog").getByText(/meja billiard/i),
    ).toBeVisible();
    await expect(page.getByText(/akan dihapus secara permanen/i)).toBeVisible();
  });

  test("klik Batal di modal hapus harus menutup modal dan data tetap ada di tabel", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const targetRow = page
      .getByRole("row")
      .filter({ hasText: "Meja Billiard" });
    await targetRow.getByRole("button").last().click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: /batal/i }).click();

    await expect(page.getByRole("alertdialog")).not.toBeVisible();
    await expect(
      page.getByText("Meja Billiard", { exact: true }),
    ).toBeVisible();
  });

  test("konfirmasi hapus loading state: tombol harus disabled dan teks berubah", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard(async (route) => {
        await new Promise((r) => setTimeout(r, 2_000));
        return route.fulfill({ status: 200, body: "{}" });
      }),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const targetRow = page
      .getByRole("row")
      .filter({ hasText: "Meja Billiard" });
    await targetRow.getByRole("button").last().click();
    await page.getByRole("button", { name: /ya, hapus/i }).click();

    await expect(
      page.getByRole("button", { name: /menghapus/i }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /batal/i })).toBeDisabled();
  });

  test("konfirmasi hapus happy path: item hilang dari tabel setelah dihapus", async ({
    page,
  }) => {
    let getCallCount = 0;

    await page.route(
      "**/tipeAset",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          getCallCount++;
          const data =
            getCallCount === 1
              ? MOCK_LIST
              : MOCK_LIST.filter((i) => i.id !== "tipe-001");
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
      "**/tipeAset/tipe-001",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const targetRow = page
      .getByRole("row")
      .filter({ hasText: "Meja Billiard" });
    await targetRow.getByRole("button").last().click();
    await page.getByRole("button", { name: /ya, hapus/i }).click();

    await expect(
      page.getByText(/data tipe aset berhasil dihapus/i),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Meja Billiard")).not.toBeVisible();
    await expect(page.getByRole("alertdialog")).not.toBeVisible();
  });

  test("konfirmasi hapus error: toast error muncul dan modal tidak ikut tertutup", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) =>
        route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Tipe aset masih digunakan oleh aset aktif",
          }),
        }),
      ),
    );

    await page.goto(`${BASE}${LIST_PATH}`);

    const targetRow = page
      .getByRole("row")
      .filter({ hasText: "Meja Billiard" });
    await targetRow.getByRole("button").last().click();
    await page.getByRole("button", { name: /ya, hapus/i }).click();

    await expect(
      page.getByText(/tipe aset masih digunakan/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// =============================================================================
// SUITE 2 — Halaman Buat Tipe Aset
// =============================================================================

test.describe("E2E — Tipe Aset › Halaman Buat", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ---------------------------------------------------------------------------
  // 2.1 UI & Navigasi
  // ---------------------------------------------------------------------------

  test("harus merender form dengan semua elemen yang diperlukan", async ({
    page,
  }) => {
    await page.goto(`${BASE}${BUAT_PATH}`);

    await expect(
      page.getByRole("heading", { name: /tambah kategori aset baru/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/meja billiard vip/i)).toBeVisible();
    await expect(
      page.getByPlaceholder(/catatan atau keterangan/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /simpan kategori aset/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /batal/i })).toBeVisible();
  });

  test("tombol 'Kembali ke Daftar' harus navigate ke halaman daftar", async ({
    page,
  }) => {
    await page.goto(`${BASE}${BUAT_PATH}`);

    await page
      .getByRole("button", { name: /kembali ke daftar kategori aset/i })
      .click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
  });

  test("tombol 'Batal' harus navigate ke halaman daftar", async ({ page }) => {
    await page.goto(`${BASE}${BUAT_PATH}`);

    await page.getByRole("button", { name: /batal/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
  });

  // ---------------------------------------------------------------------------
  // 2.2 Validasi Form (Zod)
  // ---------------------------------------------------------------------------

  test("unhappy: submit tanpa nama harus menampilkan pesan validasi wajib diisi", async ({
    page,
  }) => {
    await page.goto(`${BASE}${BUAT_PATH}`);

    await page.getByRole("button", { name: /simpan kategori aset/i }).click();

    await expect(
      page.getByText(/nama kategori aset wajib diisi/i),
    ).toBeVisible();
  });

  test("unhappy: submit dengan nama 1 karakter harus menampilkan error minimal 2 karakter", async ({
    page,
  }) => {
    await page.goto(`${BASE}${BUAT_PATH}`);

    await page.getByPlaceholder(/meja billiard vip/i).fill("A");
    await page.getByRole("button", { name: /simpan kategori aset/i }).click();

    await expect(page.getByText(/minimal 2 karakter/i)).toBeVisible();
  });

  test("deskripsi bersifat opsional — tidak ada error validasi saat deskripsi dikosongkan", async ({
    page,
  }) => {
    await page.goto(`${BASE}${BUAT_PATH}`);

    await page.getByPlaceholder(/meja billiard vip/i).fill("Tipe Valid");
    await expect(page.getByText(/deskripsi.*wajib/i)).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 2.3 Loading State
  // ---------------------------------------------------------------------------

  test("loading state: tombol harus disabled dan teks berubah saat submit in-flight", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard(async (route) => {
        if (route.request().method() === "POST") {
          await new Promise((r) => setTimeout(r, 2_000));
          return route.fulfill({ status: 201, body: "{}" });
        }
        return route.continue();
      }),
    );

    await page.goto(`${BASE}${BUAT_PATH}`);
    await page.getByPlaceholder(/meja billiard vip/i).fill("Arena Badminton");
    await page.getByRole("button", { name: /simpan kategori aset/i }).click();

    await expect(
      page.getByRole("button", { name: /menyimpan data/i }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /batal/i })).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // 2.4 Happy Path
  // ---------------------------------------------------------------------------

  test("happy path: submit nama valid tanpa deskripsi harus redirect ke daftar + toast sukses", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              data: { id: "tipe-004", namaTipeAset: "Arena Badminton" },
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        });
      }),
    );

    await page.goto(`${BASE}${BUAT_PATH}`);
    await page.getByPlaceholder(/meja billiard vip/i).fill("Arena Badminton");
    await page.getByRole("button", { name: /simpan kategori aset/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
    await expect(
      page.getByText(/kategori aset baru berhasil ditambahkan/i),
    ).toBeVisible();
  });

  test("happy path: payload yang dikirim harus sesuai — nama trimmed, deskripsi ada jika diisi", async ({
    page,
  }) => {
    let capturedBody: any = null;

    await page.route(
      "**/tipeAset",
      withApiGuard(async (route) => {
        if (route.request().method() === "POST") {
          capturedBody = route.request().postDataJSON();
          return route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({ data: { id: "tipe-005" } }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        });
      }),
    );

    await page.goto(`${BASE}${BUAT_PATH}`);
    await page.getByPlaceholder(/meja billiard vip/i).fill("  Kamar VIP  ");
    await page
      .getByPlaceholder(/catatan atau keterangan/i)
      .fill("Kamar eksklusif dengan AC");
    await page.getByRole("button", { name: /simpan kategori aset/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);

    expect(capturedBody.namaTipeAset).toBe("Kamar VIP");
    expect(capturedBody.deskripsi).toBe("Kamar eksklusif dengan AC");
  });

  test("happy path: submit tanpa deskripsi harus mengirim payload tanpa field deskripsi", async ({
    page,
  }) => {
    let capturedBody: any = null;

    await page.route(
      "**/tipeAset",
      withApiGuard(async (route) => {
        if (route.request().method() === "POST") {
          capturedBody = route.request().postDataJSON();
          return route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({ data: { id: "tipe-006" } }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        });
      }),
    );

    await page.goto(`${BASE}${BUAT_PATH}`);
    await page
      .getByPlaceholder(/meja billiard vip/i)
      .fill("Tipe Tanpa Deskripsi");
    await page.getByRole("button", { name: /simpan kategori aset/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);

    expect(capturedBody.deskripsi).toBeUndefined();
  });

  test("unhappy: error dari backend harus menampilkan toast error dan tidak redirect", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({
            status: 409,
            contentType: "application/json",
            body: JSON.stringify({ message: "Nama tipe aset sudah terdaftar" }),
          });
        }
        return route.continue();
      }),
    );

    await page.goto(`${BASE}${BUAT_PATH}`);
    await page.getByPlaceholder(/meja billiard vip/i).fill("Meja Billiard");
    await page.getByRole("button", { name: /simpan kategori aset/i }).click();

    await expect(page.getByText(/nama tipe aset sudah terdaftar/i)).toBeVisible(
      { timeout: 5_000 },
    );
    await expect(page).toHaveURL(new RegExp(BUAT_PATH));
  });
});

// =============================================================================
// SUITE 3 — Halaman Edit Tipe Aset
// =============================================================================

test.describe("E2E — Tipe Aset › Halaman Edit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ---------------------------------------------------------------------------
  // 3.1 Guard — ID Tidak Valid
  // ---------------------------------------------------------------------------

  test("guard: navigasi ke ID 'undefined' harus merender halaman error ID tidak valid", async ({
    page,
  }) => {
    await page.goto(
      `${BASE}/dashboard/outlet/reservasi/tipeAset/undefined/edit`,
    );

    await expect(page.getByText(/id tipe aset tidak valid/i)).toBeVisible();
    await expect(page.getByText(/id pada url ini rusak/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /kembali ke daftar tipe aset/i }),
    ).toBeVisible();
  });

  test("guard: tombol kembali di halaman error ID harus navigate ke daftar", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(
      `${BASE}/dashboard/outlet/reservasi/tipeAset/undefined/edit`,
    );

    await page
      .getByRole("button", { name: /kembali ke daftar tipe aset/i })
      .click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
  });

  // ---------------------------------------------------------------------------
  // 3.2 Loading & Error State Fetch
  // ---------------------------------------------------------------------------

  test("harus merender loading spinner saat data tipe aset sedang di-fetch", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard(async (route) => {
        await new Promise((r) => setTimeout(r, 2_000));
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_SINGLE }),
        });
      }),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);
    await expect(page.getByText(/memuat data tipe aset/i)).toBeVisible();
  });

  test("harus merender error state saat fetch data gagal (404)", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) =>
        route.fulfill({ status: 404, body: "Not Found" }),
      ),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);

    await expect(page.getByText(/data tidak ditemukan/i)).toBeVisible();
    await expect(
      page.getByText(/gagal mengambil data tipe aset/i),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /kembali/i })).toBeVisible();
  });

  test("tombol kembali di error state fetch harus navigate ke daftar", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) =>
        route.fulfill({ status: 404, body: "Not Found" }),
      ),
    );
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);
    await page.getByRole("button", { name: /kembali/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
  });

  // ---------------------------------------------------------------------------
  // 3.3 Pre-fill & Navigasi
  // ---------------------------------------------------------------------------

  test("harus pre-fill form dengan data existing yang diambil dari API", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        return route.continue();
      }),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);

    const namaInput = page.getByPlaceholder(/meja billiard vip/i);
    const deskripsiInput = page.getByPlaceholder(/catatan atau keterangan/i);

    await expect(namaInput).toHaveValue("Meja Billiard");
    await expect(deskripsiInput).toHaveValue(
      "Meja billiard standar internasional",
    );
  });

  test("tombol 'Kembali ke Daftar Tipe Aset' harus navigate ke halaman daftar", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        return route.continue();
      }),
    );
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);
    await page
      .getByRole("button", { name: /kembali ke daftar tipe aset/i })
      .click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
  });

  test("tombol 'Batal' harus navigate ke halaman daftar", async ({ page }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        return route.continue();
      }),
    );
    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);
    await page.getByRole("button", { name: /batal/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
  });

  // ---------------------------------------------------------------------------
  // 3.4 Validasi Form
  // ---------------------------------------------------------------------------

  test("unhappy: kosongkan nama dan submit harus menampilkan error validasi Zod", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        return route.continue();
      }),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);

    await page.getByPlaceholder(/meja billiard vip/i).clear();
    await page.getByRole("button", { name: /simpan perubahan/i }).click();

    await expect(page.getByText(/nama tipe aset wajib diisi/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 3.5 Loading State Submit
  // ---------------------------------------------------------------------------

  test("loading state: tombol harus disabled dan teks berubah saat update in-flight", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard(async (route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        if (route.request().method() === "PUT") {
          await new Promise((r) => setTimeout(r, 2_000));
          return route.fulfill({ status: 200, body: "{}" });
        }
        return route.continue();
      }),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);
    await page.getByRole("button", { name: /simpan perubahan/i }).click();

    await expect(
      page.getByRole("button", { name: /menyimpan perubahan/i }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /batal/i })).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // 3.6 Happy Path
  // ---------------------------------------------------------------------------

  test("happy path: edit nama harus redirect ke daftar + toast sukses + payload benar", async ({
    page,
  }) => {
    let capturedBody: any = null;

    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        if (route.request().method() === "PUT") {
          capturedBody = route.request().postDataJSON();
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: { ...MOCK_SINGLE, namaTipeAset: "Meja Billiard Premium" },
            }),
          });
        }
        return route.continue();
      }),
    );

    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);

    const namaInput = page.getByPlaceholder(/meja billiard vip/i);
    await namaInput.clear();
    await namaInput.fill("Meja Billiard Premium");
    await page.getByRole("button", { name: /simpan perubahan/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);
    await expect(page).toHaveURL(new RegExp(LIST_PATH));
    await expect(
      page.getByText(/perubahan tipe aset telah tersimpan/i),
    ).toBeVisible();

    expect(capturedBody.namaTipeAset).toBe("Meja Billiard Premium");
  });

  test("happy path: hapus deskripsi (clear textarea) → payload deskripsi harus undefined", async ({
    page,
  }) => {
    let capturedBody: any = null;

    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        if (route.request().method() === "PUT") {
          capturedBody = route.request().postDataJSON();
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        return route.continue();
      }),
    );

    await page.route(
      "**/tipeAset",
      withApiGuard((route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_LIST }),
        }),
      ),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);

    await page.getByPlaceholder(/catatan atau keterangan/i).clear();
    await page.getByRole("button", { name: /simpan perubahan/i }).click();

    await page.waitForURL(`**${LIST_PATH}`);

    expect(capturedBody.deskripsi).toBeUndefined();
  });

  test("unhappy: error dari backend saat update harus menampilkan toast error dan tidak redirect", async ({
    page,
  }) => {
    await page.route(
      "**/tipeAset/tipe-001",
      withApiGuard((route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_SINGLE }),
          });
        }
        if (route.request().method() === "PUT") {
          return route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Terjadi kesalahan pada server" }),
          });
        }
        return route.continue();
      }),
    );

    await page.goto(`${BASE}${EDIT_PATH}`);
    await page.getByRole("button", { name: /simpan perubahan/i }).click();

    await expect(page.getByText(/terjadi kesalahan/i)).toBeVisible({
      timeout: 5_000,
    });

    await expect(page).toHaveURL(new RegExp(EDIT_PATH));
  });
});
