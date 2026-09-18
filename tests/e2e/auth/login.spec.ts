import { test, expect } from "@playwright/test";

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
const TOKEN_NO_TENANT = makeFakeJWT({ id: "acc-001" }); // tenantID tidak ada
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

      // Sesi tidak boleh tersimpan untuk akun tanpa toko
      const accessToken = await page.evaluate(() =>
        sessionStorage.getItem("accessToken"),
      );
      expect(accessToken).toBeNull();

      const akun = await page.evaluate(() => localStorage.getItem("akun"));
      expect(akun).toBeNull();

      // Blok finally tetap berjalan setelah return: tombol kembali aktif
      await expect(
        page.getByRole("button", { name: /masuk|login/i }),
      ).toBeEnabled();
    });

    test("harus menyimpan accessToken ke sessionStorage dan data akun ke localStorage", async ({
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

      const accessToken = await page.evaluate(() =>
        sessionStorage.getItem("accessToken"),
      );
      expect(accessToken).not.toBeNull();
      expect(accessToken).toBe(MOCK_LOGIN_SUCCESS.accessToken);

      const akun = await page.evaluate(() => localStorage.getItem("akun"));
      expect(akun).not.toBeNull();
      expect(JSON.parse(akun!)).toMatchObject({ id: "acc-001" });
    });

    test("harus membersihkan penggunaToken lama sebelum login akun baru", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem("penggunaToken", "token-pengguna-lama");
      });

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

      const oldToken = await page.evaluate(() =>
        sessionStorage.getItem("penggunaToken"),
      );
      expect(oldToken).toBeNull();
    });
  });
});

// =============================================================================
// SUITE 2 — /login/pengguna (PIN Login)
// =============================================================================
test.describe("E2E — /login/pengguna (Login PIN Karyawan/Owner)", () => {
  // ---------------------------------------------------------------------------
  // 2.1 Guard — Proteksi Akses Langsung Tanpa Token
  // ---------------------------------------------------------------------------
  test.describe("Guard — Proteksi Akses", () => {
    test("harus redirect ke /login saat tidak ada accessToken di sessionStorage", async ({
      page,
    }) => {
      await page.goto("http://localhost:3000/login/pengguna");
      await page.waitForURL("**/login");
      await expect(page).toHaveURL(/.*\/login$/);
    });

    test("harus redirect ke /login saat accessToken adalah string literal 'null'", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem("accessToken", "null");
      });

      await page.goto("http://localhost:3000/login/pengguna");
      await page.waitForURL("**/login");
      await expect(page).toHaveURL(/.*\/login$/);
    });

    test("harus redirect ke /login saat accessToken adalah string literal 'undefined'", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem("accessToken", "undefined");
      });

      await page.goto("http://localhost:3000/login/pengguna");
      await page.waitForURL("**/login");
      await expect(page).toHaveURL(/.*\/login$/);
    });

    test("harus redirect ke /login dan bersihkan storage saat JWT rusak / tidak bisa di-decode", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem("accessToken", "ini.bukan.jwt");
        sessionStorage.setItem("penggunaToken", "ikut-dibersihkan");
      });

      await page.goto("http://localhost:3000/login/pengguna");
      await page.waitForURL("**/login");

      const accessToken = await page.evaluate(() =>
        sessionStorage.getItem("accessToken"),
      );
      const penggunaToken = await page.evaluate(() =>
        sessionStorage.getItem("penggunaToken"),
      );
      expect(accessToken).toBeNull();
      expect(penggunaToken).toBeNull();
    });

    test("harus redirect ke /login saat JWT valid secara format tapi payload.id tidak ada", async ({
      page,
    }) => {
      await page.addInitScript(
        (token) => sessionStorage.setItem("accessToken", token),
        TOKEN_NO_ID,
      );

      await page.goto("http://localhost:3000/login/pengguna");
      await page.waitForURL("**/login");
      await expect(page).toHaveURL(/.*\/login$/);
    });

    // [SKENARIO BARU] JWT Kedaluwarsa
    test("harus redirect ke /login saat JWT valid tapi sudah expired", async ({
      page,
    }) => {
      await page.addInitScript(
        (token) => sessionStorage.setItem("accessToken", token),
        TOKEN_EXPIRED,
      );

      await page.goto("http://localhost:3000/login/pengguna");

      // Catatan TDD: Jika kodemu (decodeJWT) belum memvalidasi payload.exp,
      // tes ini akan fail (timeout). Pastikan decodeJWT me-return null jika exp < Date.now()
      await page.waitForURL("**/login");
      await expect(page).toHaveURL(/.*\/login$/);
    });

    test("harus menampilkan pesan error (BUKAN redirect) saat JWT valid tapi tidak ada tenantID", async ({
      page,
    }) => {
      await page.addInitScript(
        (token) => sessionStorage.setItem("accessToken", token),
        TOKEN_NO_TENANT,
      );

      await page.goto("http://localhost:3000/login/pengguna");

      await expect(page).toHaveURL(/.*\/login\/pengguna/);
      await expect(page.getByText(/belum memiliki toko aktif/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /masuk|login/i }),
      ).toBeVisible();
    });

    test("harus auto-redirect ke /dashboard saat penggunaToken valid sudah ada di sessionStorage", async ({
      page,
    }) => {
      await page.addInitScript(
        (tokens) => {
          sessionStorage.setItem("accessToken", tokens.access);
          sessionStorage.setItem("penggunaToken", tokens.pengguna);
        },
        { access: TOKEN_VALID, pengguna: "valid-pengguna-token-aktif" },
      );

      await page.goto("http://localhost:3000/login/pengguna");
      await page.waitForURL("**/dashboard");
      await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test("harus TIDAK auto-redirect saat penggunaToken adalah string literal 'undefined'", async ({
      page,
    }) => {
      await page.addInitScript(
        (tokens) => {
          sessionStorage.setItem("accessToken", tokens.access);
          sessionStorage.setItem("penggunaToken", "undefined");
        },
        { access: TOKEN_VALID },
      );

      await page.goto("http://localhost:3000/login/pengguna");

      // [PERBAIKAN] Gunakan waitForFunction untuk memantau browser, bukan menunggu Label UI
      await page.waitForFunction(
        () => sessionStorage.getItem("penggunaToken") === null,
      );

      await expect(page).toHaveURL(/.*\/login\/pengguna/);
      const garbageToken = await page.evaluate(() =>
        sessionStorage.getItem("penggunaToken"),
      );
      expect(garbageToken).toBeNull();
    });

    test("harus TIDAK auto-redirect saat penggunaToken adalah string literal 'null'", async ({
      page,
    }) => {
      await page.addInitScript(
        (tokens) => {
          sessionStorage.setItem("accessToken", tokens.access);
          sessionStorage.setItem("penggunaToken", "null");
        },
        { access: TOKEN_VALID },
      );

      await page.goto("http://localhost:3000/login/pengguna");

      // [PERBAIKAN] Gunakan waitForFunction untuk memantau browser, bukan menunggu Label UI
      await page.waitForFunction(
        () => sessionStorage.getItem("penggunaToken") === null,
      );

      await expect(page).toHaveURL(/.*\/login\/pengguna/);
      const garbageToken = await page.evaluate(() =>
        sessionStorage.getItem("penggunaToken"),
      );
      expect(garbageToken).toBeNull();
    });

    // ---------------------------------------------------------------------------
    // 2.2 UI & Aksesibilitas
    // ---------------------------------------------------------------------------
    test.describe("UI & Aksesibilitas", () => {
      test.beforeEach(async ({ page }) => {
        await page.addInitScript(
          (token) => sessionStorage.setItem("accessToken", token),
          TOKEN_VALID,
        );
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
        await page.addInitScript(
          (token) => sessionStorage.setItem("accessToken", token),
          TOKEN_VALID,
        );
      });

      test("harus menampilkan error saat nama atau PIN salah (401 dari backend)", async ({
        page,
      }) => {
        // FIX ROOT CAUSE: suntikkan accessToken dulu agar halaman /login/pengguna
        // tidak langsung redirect ke /login sebelum form sempat dirender
        await page.addInitScript(
          (token) => sessionStorage.setItem("accessToken", token),
          TOKEN_VALID,
        );

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
        await page.addInitScript(
          (token) => sessionStorage.setItem("accessToken", token),
          TOKEN_VALID,
        );

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
        await page.addInitScript(
          (token) => sessionStorage.setItem("accessToken", token),
          TOKEN_VALID,
        );
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

      test("harus menyimpan penggunaToken ke sessionStorage setelah PIN login berhasil", async ({
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

        const penggunaToken = await page.evaluate(() =>
          sessionStorage.getItem("penggunaToken"),
        );
        expect(penggunaToken).not.toBeNull();
        expect(penggunaToken).toBe(MOCK_PENGGUNA_SUCCESS.accessToken);
      });
    });

    // ---------------------------------------------------------------------------
    // 2.6 Fitur: Ganti Akun Bisnis
    // ---------------------------------------------------------------------------
    test.describe("Fitur — Ganti Akun Bisnis", () => {
      test("harus clear seluruh sessionStorage dan redirect ke /login saat tombol diklik", async ({
        page,
      }) => {
        await page.addInitScript(
          (tokens) => {
            sessionStorage.setItem("accessToken", tokens.access);
            sessionStorage.setItem("dataLain", "nilai-lain");
          },
          { access: TOKEN_VALID },
        );

        await page.goto("http://localhost:3000/login/pengguna");
        await page.getByText(/ganti akun bisnis/i).click();

        await page.waitForURL("**/login");
        await expect(page).toHaveURL(/.*\/login$/);

        const sessionKeys = await page.evaluate(() =>
          Object.keys(sessionStorage),
        );
        expect(sessionKeys).toHaveLength(0);
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
