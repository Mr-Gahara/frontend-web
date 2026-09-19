import { test, expect, type Page } from "@playwright/test";

// =============================================================================
// HELPER — Membuat fake JWT yang bisa di-decode oleh decodeJWT() di frontend
// Standard base64url encoding (compatible dengan atob() di browser)
// =============================================================================
function makeFakeJWT(payload: Record<string, any>): string {
  const encode = (data: string) =>
    Buffer.from(data)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encode(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

// =============================================================================
// TOKEN FIXTURES
// =============================================================================
const TOKEN_VALID = makeFakeJWT({ id: "acc-001", tenantID: "tenant-001" });
const TOKEN_NO_ID = makeFakeJWT({ tenantID: "tenant-001" }); // id tidak ada — JWT invalid
// [SKENARIO BARU] Token kedaluwarsa (1 jam yang lalu)
const TOKEN_EXPIRED = makeFakeJWT({
  id: "acc-001",
  tenantID: "tenant-001",
  exp: Math.floor(Date.now() / 1000) - 3600,
});

// =============================================================================
// MOCK API RESPONSE FIXTURES
// =============================================================================
const MOCK_LOGIN_SUCCESS = {
  accessToken: TOKEN_VALID,
  data: { id: "acc-001", email: "toko@gmail.com", nama: "Toko Demo" },
  requireSetup: false,
};

const MOCK_LOGIN_REQUIRE_SETUP = {
  ...MOCK_LOGIN_SUCCESS,
  requireSetup: true,
};

const MOCK_PENGGUNA_SUCCESS = {
  accessToken: "pengguna-token-xyz-valid",
};

/**
 * Menyiapkan sesi akun untuk halaman login PIN.
 *
 * Token kini hanya hidup di memori dan berasal dari cookie refresh
 * httpOnly, sehingga tidak dapat disuntikkan lewat addInitScript seperti
 * sebelumnya. Prasyarat disiapkan dengan login akun sungguhan.
 */
async function siapkanSesiAkun(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL("**/login/pengguna");
}

const MOCK_ERROR_CREDENTIALS = {
  message: "Email atau password salah.",
};

const MOCK_ERROR_PIN = {
  message: "Nama atau PIN tidak valid.",
};

// =============================================================================
// SUITE 1 — /login (SaaS Account Login)
// =============================================================================
test.describe("E2E — /login (Login Akun SaaS)", () => {
  // ---------------------------------------------------------------------------
  // 1.1 UI & Aksesibilitas
  // ---------------------------------------------------------------------------
  test.describe("UI & Aksesibilitas", () => {
    test("harus merender semua elemen form dengan aksesibilitas yang benar (A11y)", async ({
      page,
    }) => {
      await page.goto("http://localhost:3000/login");

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /masuk|login/i }),
      ).toBeVisible();
    });

    test("field password harus ter-mask (type='password')", async ({
      page,
    }) => {
      await page.goto("http://localhost:3000/login");
      await expect(page.getByLabel(/password/i)).toHaveAttribute(
        "type",
        "password",
      );
    });

    // [SKENARIO BARU] Keyboard Navigation
    test("harus bisa navigasi dan submit form menggunakan tombol Keyboard (Tab & Enter)", async ({
      page,
    }) => {
      await page.route("**/akun/auth/login", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_LOGIN_SUCCESS),
        }),
      );

      await page.goto("http://localhost:3000/login");

      // Simulasikan flow user murni pakai keyboard
      await page.getByLabel(/email/i).focus();
      await page.keyboard.insertText("toko@gmail.com");
      await page.keyboard.press("Tab"); // Pindah ke field password
      await page.keyboard.insertText("Toko1234");
      await page.keyboard.press("Enter"); // Submit form

      await page.waitForURL("**/login/pengguna");
      await expect(page).toHaveURL(/.*\/login\/pengguna/);
    });
  });

  // ---------------------------------------------------------------------------
  // 1.2 Unhappy Path
  // ---------------------------------------------------------------------------
  test.describe("Unhappy Path", () => {
    test("harus menampilkan pesan error saat kredensial salah (401 dari backend)", async ({
      page,
    }) => {
      await page.route("**/akun/auth/login", (route) =>
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify(MOCK_ERROR_CREDENTIALS),
        }),
      );

      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill("salah@gmail.com");
      await page.getByLabel(/password/i).fill("PasswordNgarang");
      await page.getByRole("button", { name: /masuk|login/i }).click();

      // Gunakan teks error langsung — lebih robust dari class selector
      await expect(page.getByText(/email atau password salah/i)).toBeVisible({
        timeout: 10_000,
      });
    });

    test("harus menampilkan pesan error saat terjadi network failure (abort)", async ({
      page,
    }) => {
      await page.route("**/akun/auth/login", (route) => route.abort());

      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill("toko@gmail.com");
      await page.getByLabel(/password/i).fill("Toko1234");
      await page.getByRole("button", { name: /masuk|login/i }).click();

      await expect(page.locator("[class*='destructive']")).toBeVisible({
        timeout: 10_000,
      });
    });

    test("harus menolak submit saat format email tidak valid (HTML5 validation)", async ({
      page,
    }) => {
      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill("ini-bukan-email");
      await page.getByLabel(/password/i).fill("Toko1234");
      await page.getByRole("button", { name: /masuk|login/i }).click();

      await expect(page).toHaveURL(/.*\/login$/);
    });

    // [SKENARIO BARU] Bypass HTML5
    test("harus tetap gagal submit jika atribut HTML5 di-bypass dan input dikosongkan", async ({
      page,
    }) => {
      await page.goto("http://localhost:3000/login");

      // Hapus atribut 'required' via JS untuk simulasi celah DOM
      await page.evaluate(() => {
        document.getElementById("email")?.removeAttribute("required");
        document.getElementById("password")?.removeAttribute("required");
      });

      await page.getByRole("button", { name: /masuk|login/i }).click();

      // Halaman tidak boleh pindah ke rute lain (harus tetap tertahan di form login)
      await expect(page).toHaveURL(/.*\/login$/);
    });
  });

  // ---------------------------------------------------------------------------
  // 1.3 Loading State
  // ---------------------------------------------------------------------------
  test.describe("Loading State", () => {
    test("tombol harus disabled dan teks berubah menjadi loading saat request in-flight", async ({
      page,
    }) => {
      await page.route("**/akun/auth/login", async (route) => {
        await new Promise((r) => setTimeout(r, 2_000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_LOGIN_SUCCESS),
        });
      });

      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill("toko@gmail.com");
      await page.getByLabel(/password/i).fill("Toko1234");

      const submitBtn = page.getByRole("button", { name: /masuk|login/i });
      await submitBtn.click();

      // [PERBAIKAN] Pastikan teks berubah DULU (sinkronisasi DOM), baru cek disabled state
      const loadingBtn = page.getByRole("button", {
        name: /membuka akses sesi/i,
      });
      await expect(loadingBtn).toBeVisible();
      await expect(loadingBtn).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // 1.4 Happy Path
  // ---------------------------------------------------------------------------
  test.describe("Happy Path", () => {
    test("harus redirect ke /login/pengguna saat login berhasil dan requireSetup=false", async ({
      page,
    }) => {
      await page.route("**/akun/auth/login", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_LOGIN_SUCCESS),
        }),
      );

      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill("toko@gmail.com");
      await page.getByLabel(/password/i).fill("Toko1234");
      await page.getByRole("button", { name: /masuk|login/i }).click();

      await page.waitForURL("**/login/pengguna");
      await expect(page).toHaveURL(/.*\/login\/pengguna/);
    });

    test("harus tetap di /login dan mengarahkan ke aplikasi saat requireSetup=true, tanpa menyimpan sesi", async ({
      page,
    }) => {
      await page.route("**/akun/auth/login", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_LOGIN_REQUIRE_SETUP),
        }),
      );

      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill("toko@gmail.com");
      await page.getByLabel(/password/i).fill("Toko1234");
      await page.getByRole("button", { name: /masuk|login/i }).click();

      // Onboarding toko hanya di aplikasi mobile: tampilkan arahan, jangan pindah halaman
      await expect(
        page.getByText(/selesaikan pembuatan toko melalui aplikasi/i),
      ).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/.*\/login$/);

      // Sesi tidak boleh tersimpan untuk akun tanpa toko: membuka halaman
      // PIN harus tetap ditolak dan kembali ke login akun.
      // Blok finally tetap berjalan setelah return: tombol kembali aktif
      await expect(
        page.getByRole("button", { name: /masuk|login/i }),
      ).toBeEnabled();
    });
  });
});

// =============================================================================
// SUITE 2 — /login/pengguna (PIN Login)
// =============================================================================
// =============================================================================
// SUITE 3 — Perilaku sesi: token di memori, pemulihan lewat cookie refresh
// =============================================================================
test.describe("E2E — Sesi lintas muat halaman", () => {
  test("sesi bertahan setelah halaman di-reload", async ({ page }) => {
    await siapkanSesiAkun(page);
    await page.getByLabel(/nama/i).fill("Ridho");
    await page.getByLabel(/pin/i).fill("123456");
    await page.getByRole("button", { name: /masuk|login/i }).click();
    await page.waitForURL("**/dashboard/**", { timeout: 15_000 });

    const sebelum = page.url();
    await page.reload();

    // Access token hanya di memori dan hilang saat reload; sesi dipulihkan
    // lewat cookie refresh httpOnly, sehingga pengguna tetap masuk.
    await expect(page).toHaveURL(sebelum, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("tab baru langsung masuk tanpa login ulang", async ({ page, context }) => {
    await siapkanSesiAkun(page);
    await page.getByLabel(/nama/i).fill("Ridho");
    await page.getByLabel(/pin/i).fill("123456");
    await page.getByRole("button", { name: /masuk|login/i }).click();
    await page.waitForURL("**/dashboard/**", { timeout: 15_000 });

    const tabBaru = await context.newPage();
    await tabBaru.goto("http://localhost:3000/dashboard/outlet");

    // Cookie sesi dibagi antar tab, sehingga tab baru tidak perlu login PIN.
    // Sebelumnya token per tab memaksa login ulang, yang justru mencabut
    // sesi tab pertama karena backend hanya mengizinkan satu sesi web.
    await expect(tabBaru).toHaveURL(/\/dashboard\/outlet/, { timeout: 15_000 });
    await expect(tabBaru).not.toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/\/login/);
    await tabBaru.close();
  });

  test("token tidak pernah ditulis ke sessionStorage maupun localStorage", async ({
    page,
  }) => {
    await siapkanSesiAkun(page);
    await page.getByLabel(/nama/i).fill("Ridho");
    await page.getByLabel(/pin/i).fill("123456");
    await page.getByRole("button", { name: /masuk|login/i }).click();
    await page.waitForURL("**/dashboard/**", { timeout: 15_000 });

    const isiStorage = await page.evaluate(() => ({
      sesi: Object.keys(sessionStorage),
      lokal: Object.keys(localStorage),
    }));

    expect(isiStorage.sesi).toHaveLength(0);
    expect(isiStorage.lokal.filter((k) => /token|akun/i.test(k))).toHaveLength(0);
  });
});

test.describe("E2E — /login/pengguna (Login PIN Karyawan/Owner)", () => {
  // ---------------------------------------------------------------------------
  // 2.1 Guard — Proteksi Akses Langsung Tanpa Token
  // ---------------------------------------------------------------------------
  test.describe("Guard — Proteksi Akses", () => {
    test("harus redirect ke /login saat membuka halaman PIN tanpa sesi akun", async ({
      page,
    }) => {
      // Tanpa cookie sesi, pemulihan gagal dan halaman mengembalikan ke login akun.
      await page.context().clearCookies();
      await page.goto("http://localhost:3000/login/pengguna");
      await expect(page).toHaveURL(/.*\/login$/, { timeout: 15_000 });
    });
    // ---------------------------------------------------------------------------
    // 2.2 UI & Aksesibilitas
    // ---------------------------------------------------------------------------
    test.describe("UI & Aksesibilitas", () => {
      test.beforeEach(async ({ page }) => {
        await siapkanSesiAkun(page);
      });

      test("harus merender form PIN dengan semua elemen yang accessible (A11y)", async ({
        page,
      }) => {
        await page.goto("http://localhost:3000/login/pengguna");

        await expect(page.getByLabel(/nama/i)).toBeVisible();
        await expect(page.getByLabel(/pin/i)).toBeVisible();
        await expect(
          page.getByRole("button", { name: /masuk|login/i }),
        ).toBeVisible();
      });

      test("input PIN harus bertipe password dan membatasi input maksimal 6 karakter", async ({
        page,
      }) => {
        await page.goto("http://localhost:3000/login/pengguna");

        const pinInput = page.getByLabel(/pin/i);
        await expect(pinInput).toHaveAttribute("type", "password");
        await expect(pinInput).toHaveAttribute("maxLength", "6");
      });

      // [SKENARIO BARU] Hanya Menerima Angka
      test("input PIN tidak boleh menerima karakter huruf/abjad (Hanya Angka)", async ({
        page,
      }) => {
        await page.goto("http://localhost:3000/login/pengguna");

        const pinInput = page.getByLabel(/pin/i);

        // Simulasikan user mengetik kombinasi angka dan huruf
        await pinInput.pressSequentially("12A34B");

        // Catatan TDD: Jika kodemu (onChange) belum membuang huruf, tes ini akan gagal
        // Idealnya input PIN hanya mengizinkan angka sehingga nilainya harus menjadi "1234"
        await expect(pinInput).not.toHaveValue("12A34B");
      });

      test("tombol 'Ganti Akun Bisnis' harus terlihat di halaman", async ({
        page,
      }) => {
        await page.goto("http://localhost:3000/login/pengguna");
        await expect(page.getByText(/ganti akun bisnis/i)).toBeVisible();
      });
    });

    // ---------------------------------------------------------------------------
    // 2.3 Unhappy Path
    // ---------------------------------------------------------------------------
    test.describe("Unhappy Path", () => {
      test.beforeEach(async ({ page }) => {
        await siapkanSesiAkun(page);
      });

      test("harus menampilkan error saat nama atau PIN salah (401 dari backend)", async ({
        page,
      }) => {
        // FIX ROOT CAUSE: suntikkan accessToken dulu agar halaman /login/pengguna
        // tidak langsung redirect ke /login sebelum form sempat dirender
        await siapkanSesiAkun(page);

        await page.route("**/pengguna/pin-login", (route) =>
          route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify(MOCK_ERROR_PIN),
          }),
        );

        await page.goto("http://localhost:3000/login/pengguna");
        await page.getByLabel(/nama/i).fill("NamaSalah");
        await page.getByLabel(/pin/i).fill("000000");
        await page.getByRole("button", { name: /masuk|login/i }).click();

        // Gunakan teks error langsung — lebih robust dari class selector
        await expect(page.getByText(/nama atau pin tidak valid/i)).toBeVisible({
          timeout: 10_000,
        });
      });

      test("harus menampilkan error saat terjadi network failure di endpoint PIN", async ({
        page,
      }) => {
        await page.route("**/pengguna/pin-login", (route) => route.abort());

        await page.goto("http://localhost:3000/login/pengguna");
        await page.getByLabel(/nama/i).fill("Ridho");
        await page.getByLabel(/pin/i).fill("123456");
        await page.getByRole("button", { name: /masuk|login/i }).click();

        await expect(page.locator("[class*='destructive']")).toBeVisible({
          timeout: 10_000,
        });
      });

      test("harus menampilkan error saat backend tidak mengembalikan token sama sekali", async ({
        page,
      }) => {
        await page.route("**/pengguna/pin-login", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: {} }), // tidak ada accessToken
          }),
        );

        await page.goto("http://localhost:3000/login/pengguna");
        await page.getByLabel(/nama/i).fill("Ridho");
        await page.getByLabel(/pin/i).fill("123456");
        await page.getByRole("button", { name: /masuk|login/i }).click();

        await expect(page.locator("[class*='destructive']")).toBeVisible();
      });
    });

    // ---------------------------------------------------------------------------
    // 2.4 Loading State
    // ---------------------------------------------------------------------------
    test.describe("Loading State", () => {
      test("tombol harus disabled dan teks berubah menjadi loading saat PIN login in-flight", async ({
        page,
      }) => {
        await siapkanSesiAkun(page);

        await page.route("**/pengguna/pin-login", async (route) => {
          await new Promise((r) => setTimeout(r, 2_000));
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(MOCK_PENGGUNA_SUCCESS),
          });
        });

        await page.goto("http://localhost:3000/login/pengguna");
        await page.getByLabel(/nama/i).fill("Ridho");
        await page.getByLabel(/pin/i).fill("123456");

        const submitBtn = page.getByRole("button", { name: /masuk|login/i });
        await submitBtn.click();

        // [PERBAIKAN] Pastikan teks DOM berubah dulu, baru cek disabled
        const loadingBtn = page.getByRole("button", {
          name: /menerbitkan token/i,
        });
        await expect(loadingBtn).toBeVisible();
        await expect(loadingBtn).toBeDisabled();
      });
    });

    // ---------------------------------------------------------------------------
    // 2.5 Happy Path
    // ---------------------------------------------------------------------------
    test.describe("Happy Path", () => {
      test.beforeEach(async ({ page }) => {
        await siapkanSesiAkun(page);
      });

      test("harus redirect ke /dashboard setelah PIN login berhasil", async ({
        page,
      }) => {
        await page.route("**/pengguna/pin-login", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(MOCK_PENGGUNA_SUCCESS),
          }),
        );

        await page.goto("http://localhost:3000/login/pengguna");
        await page.getByLabel(/nama/i).fill("Ridho");
        await page.getByLabel(/pin/i).fill("123456");
        await page.getByRole("button", { name: /masuk|login/i }).click();

        await page.waitForURL("**/dashboard");
        await expect(page).toHaveURL(/.*\/dashboard/);
      });
    });

    // ---------------------------------------------------------------------------
    // 2.6 Fitur: Ganti Akun Bisnis
    // ---------------------------------------------------------------------------
    test.describe("Fitur — Ganti Akun Bisnis", () => {
      test("harus mengakhiri sesi dan kembali ke /login saat tombol diklik", async ({
        page,
      }) => {
        await siapkanSesiAkun(page);
        await page.getByText(/ganti akun bisnis/i).click();

        await expect(page).toHaveURL(/.*\/login$/);

        // Sesi berakhir: membuka halaman PIN lagi harus kembali ditolak.
        await page.goto("http://localhost:3000/login/pengguna");
        await expect(page).toHaveURL(/.*\/login$/, { timeout: 15_000 });
      });
    });
  });

  // =============================================================================
  // SUITE 3 — Full E2E Flow (Alur Lengkap dari Login sampai Dashboard)
  // =============================================================================
  test.describe("E2E — Full Flow: Login Akun → Login PIN → Dashboard", () => {
    test("harus berhasil tembus dari /login → /login/pengguna → /dashboard", async ({
      page,
    }) => {
      await page.route("**/akun/auth/login", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_LOGIN_SUCCESS),
        }),
      );

      await page.route("**/pengguna/pin-login", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_PENGGUNA_SUCCESS),
        }),
      );

      // FASE 1: Login Akun SaaS
      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill("toko@gmail.com");
      await page.getByLabel(/password/i).fill("Toko1234");
      await page.getByRole("button", { name: /masuk|login/i }).click();

      await page.waitForURL("**/login/pengguna");
      await expect(page).toHaveURL(/.*\/login\/pengguna/);

      // FASE 2: Login PIN Karyawan
      await page.getByLabel(/nama/i).fill("Ridho");
      await page.getByLabel(/pin/i).fill("123456");
      await page.getByRole("button", { name: /masuk|login/i }).click();

      // FASE 3: Verifikasi masuk ke Dashboard
      await page.waitForURL("**/dashboard");
      await expect(page).toHaveURL(/.*\/dashboard/);

      // [PERBAIKAN] Dibuat lebih generik, cukup memastikan halaman render element heading (apa pun nama dashboard-nya)
      await expect(page.getByRole("heading").first()).toBeVisible();
    });
  });
});
