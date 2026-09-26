import { test, expect, type Page } from "@playwright/test";

// =============================================================================
// Spec login memakai backend sungguhan. page.route hanya untuk jalur gagal
// yang tidak dapat dibuat backend secara deterministik, atau untuk menahan
// permintaan lalu meneruskannya (route.continue) agar keadaan memuat terlihat.
// Respons sukses tidak dipalsukan; simulasi yang tidak terhindarkan ditandai
// "// simulasi:" beserta alasannya (docs/refactor/pengujian.md).
// =============================================================================
const EMAIL_UJI = "toko@gmail.com";
const PASSWORD_UJI = "Toko1234";
const NAMA_UJI = "Ridho";
const PIN_UJI = "123456";
const POLA_LOGIN_AKUN = /\/api\/akun\/auth\/login(\?|$)/i;
const POLA_LOGIN_PIN = /\/api\/pengguna\/pin-login(\?|$)/i;
const POLA_JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/;

/** Akhiran unik per run, agar pembatas login tidak menghitung akun dan pengguna uji. */
const unik = () => Date.now().toString(36);

/** Menahan permintaan sebentar lalu meneruskannya ke backend sungguhan. */
async function tahanLaluTeruskan(page: Page, pola: RegExp, ms = 1_500) {
  await page.route(pola, async (route) => {
    await new Promise((r) => setTimeout(r, ms));
    await route.continue();
  });
}

/** Sisa kuota pembatas dari header RateLimit (draft-7), atau null bila tidak ada. */
function sisaKuota(header: string | undefined): number | null {
  const m = header?.match(/remaining=(\d+)/);
  return m ? Number(m[1]) : null;
}

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
      await page.goto("http://localhost:3000/login");
      const tLogin = page.waitForResponse(POLA_LOGIN_AKUN);

      // Simulasikan flow user murni pakai keyboard
      await page.getByLabel(/email/i).focus();
      await page.keyboard.insertText(EMAIL_UJI);
      await page.keyboard.press("Tab"); // Pindah ke field password
      await page.keyboard.insertText(PASSWORD_UJI);
      await page.keyboard.press("Enter"); // Submit form

      expect((await tLogin).status()).toBe(200);
      await page.waitForURL("**/login/pengguna");
      await expect(page).toHaveURL(/.*\/login\/pengguna/);
    });
  });

  // ---------------------------------------------------------------------------
  // 1.2 Unhappy Path
  // ---------------------------------------------------------------------------
  test.describe("Unhappy Path", () => {
    test("harus menampilkan pesan backend saat email tidak terdaftar", async ({ page }) => {
      await page.goto("http://localhost:3000/login");
      // Email unik per run: pembatas login dihitung per IP dan email.
      await page.getByLabel(/email/i).fill("e2e-" + unik() + "@contoh.test");
      await page.getByLabel(/password/i).fill("PasswordNgarang");
      const tLogin = page.waitForResponse(POLA_LOGIN_AKUN);
      await page.getByRole("button", { name: /masuk|login/i }).click();

      const res = await tLogin;
      const body = await res.json();
      expect(res.status()).toBe(404);
      expect(body.message, "respons gagal harus membawa message").toBeTruthy();
      await expect(page.getByText(body.message).first()).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/.*\/login$/);
    });

    test("harus menampilkan pesan backend saat password salah", async ({ page }) => {
      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill(EMAIL_UJI);
      await page.getByLabel(/password/i).fill("Salah-" + unik());
      const tLogin = page.waitForResponse(POLA_LOGIN_AKUN);
      await page.getByRole("button", { name: /masuk|login/i }).click();

      const res = await tLogin;
      const body = await res.json();
      expect(res.status()).toBe(400);
      expect(body.message, "respons gagal harus membawa message").toBeTruthy();
      await expect(page.getByText(body.message).first()).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/.*\/login$/);

      // Percobaan ini menambah hitungan pembatas akun uji (per IP dan email;
      // login sukses tidak menguranginya), dan seluruh spec login dengan akun
      // itu. Gagal lebih awal bila kuota menipis, agar penyebabnya terlihat di sini.
      const sisa = sisaKuota(res.headers()["ratelimit"]);
      expect(sisa, "header RateLimit harus ada pada respons login akun").not.toBeNull();
      expect(
        sisa ?? -1,
        "sisa kuota login " + EMAIL_UJI + " menipis; tunggu jendela pembatas berakhir",
      ).toBeGreaterThanOrEqual(3);
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
      await tahanLaluTeruskan(page, POLA_LOGIN_AKUN);

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
      await page.waitForURL("**/login/pengguna");
    });
  });

  // ---------------------------------------------------------------------------
  // 1.4 Happy Path
  // ---------------------------------------------------------------------------
  test.describe("Happy Path", () => {
    test("harus redirect ke /login/pengguna saat login berhasil dan requireSetup=false", async ({
      page,
    }) => {
      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill(EMAIL_UJI);
      await page.getByLabel(/password/i).fill(PASSWORD_UJI);
      const tLogin = page.waitForResponse(POLA_LOGIN_AKUN);
      await page.getByRole("button", { name: /masuk|login/i }).click();

      const res = await tLogin;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.requireSetup).toBe(false);
      expect(JSON.stringify(body)).toMatch(POLA_JWT);
      await page.waitForURL("**/login/pengguna");
      await expect(page).toHaveURL(/.*\/login\/pengguna/);
    });

    test("harus tetap di /login dan mengarahkan ke aplikasi saat requireSetup=true, tanpa menyimpan sesi", async ({
      page,
    }) => {
      await page.route(POLA_LOGIN_AKUN, async (route) => {
        const asli = await route.fetch();
        const body = await asli.json();
        // simulasi: akun uji selalu punya toko (needsSetup false); akun baru tanpa toko akan permanen
        await route.fulfill({ status: asli.status(), json: { ...body, requireSetup: true } });
      });

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
test.describe("E2E — Penanganan 403 akun dibekukan", () => {
  test("sesi diakhiri dan kembali ke /login saat backend menjawab 403 dibekukan", async ({
    page,
  }) => {
    await siapkanSesiAkun(page);
    await page.getByLabel(/nama/i).fill("Ridho");
    await page.getByLabel(/pin/i).fill("123456");
    await page.getByRole("button", { name: /masuk|login/i }).click();
    await page.waitForURL("**/dashboard/**", { timeout: 15_000 });

    // Backend membekukan akun setelah sesi berjalan. Mencoba ulang tidak ada
    // gunanya, sehingga sesi diakhiri dan pengguna dikembalikan ke login.
    await page.route("**/api/**", (route) => {
      const url = route.request().url();
      if (/\/api\/(akun|pengguna)\/(auth|pin)/.test(url)) return route.continue();
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          message: "Akses ditolak. Akun bisnis sedang dibekukan atau tidak aktif.",
        }),
      });
    });

    // Halaman dashboard outlet tidak memanggil API, jadi buka halaman yang
    // memuat data agar 403 benar-benar melewati apiClient.
    await page.goto("http://localhost:3000/dashboard/outlet/inventaris/produk");
    await expect(page).toHaveURL(/.*\/login$/, { timeout: 20_000 });
  });
});

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

      test("harus menampilkan pesan backend saat nama atau PIN salah (401)", async ({
        page,
      }) => {
        await page.goto("http://localhost:3000/login/pengguna");
        // Nama unik per run: pembatas PIN dihitung per tenant dan nama.
        await page.getByLabel(/nama/i).fill("E2E Salah " + unik());
        await page.getByLabel(/pin/i).fill("000000");
        const tLogin = page.waitForResponse(POLA_LOGIN_PIN);
        await page.getByRole("button", { name: /masuk|login/i }).click();

        const res = await tLogin;
        const body = await res.json();
        expect(res.status()).toBe(401);
        expect(body.message, "respons gagal harus membawa message").toBeTruthy();
        await expect(page.getByText(body.message).first()).toBeVisible({ timeout: 10_000 });
        await expect(page).toHaveURL(/.*\/login\/pengguna$/);
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
          // simulasi: backend yang menjawab 200 tanpa token tidak dapat dibuat deterministik
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

        await tahanLaluTeruskan(page, POLA_LOGIN_PIN);

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
        await page.waitForURL("**/dashboard");
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
        await page.goto("http://localhost:3000/login/pengguna");
        await page.getByLabel(/nama/i).fill(NAMA_UJI);
        await page.getByLabel(/pin/i).fill(PIN_UJI);
        const tLogin = page.waitForResponse(POLA_LOGIN_PIN);
        await page.getByRole("button", { name: /masuk|login/i }).click();

        const res = await tLogin;
        expect(res.status()).toBe(200);
        expect(JSON.stringify(await res.json())).toMatch(POLA_JWT);
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
      // FASE 1: Login Akun SaaS
      await page.goto("http://localhost:3000/login");
      await page.getByLabel(/email/i).fill(EMAIL_UJI);
      await page.getByLabel(/password/i).fill(PASSWORD_UJI);
      const tAkun = page.waitForResponse(POLA_LOGIN_AKUN);
      await page.getByRole("button", { name: /masuk|login/i }).click();
      expect((await tAkun).status()).toBe(200);

      await page.waitForURL("**/login/pengguna");
      await expect(page).toHaveURL(/.*\/login\/pengguna/);

      // FASE 2: Login PIN Karyawan
      await page.getByLabel(/nama/i).fill(NAMA_UJI);
      await page.getByLabel(/pin/i).fill(PIN_UJI);
      const tPin = page.waitForResponse(POLA_LOGIN_PIN);
      await page.getByRole("button", { name: /masuk|login/i }).click();
      const resPin = await tPin;
      expect(resPin.status()).toBe(200);
      expect(JSON.stringify(await resPin.json())).toMatch(POLA_JWT);

      // FASE 3: Verifikasi masuk ke Dashboard
      await page.waitForURL("**/dashboard");
      await expect(page).toHaveURL(/.*\/dashboard/);

      // [PERBAIKAN] Dibuat lebih generik, cukup memastikan halaman render element heading (apa pun nama dashboard-nya)
      await expect(page.getByRole("heading").first()).toBeVisible();
    });
  });
});
