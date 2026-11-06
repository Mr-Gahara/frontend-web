import { test, expect, type Page, type Response } from "@playwright/test";
import {
  aktifkanAkunKlienUji,
  ALASAN_TANPA_ADMIN,
  buatAkunKlienLewatUi,
  bukaDaftarAkun,
  hapusAkunDariDetail,
  hapusAkunKlienUji,
  kredensialAdmin,
  loginAdmin,
  wajibAdmin,
} from "../../helpers/admin-uji";

/*
 * Langganan akun klien di halaman detail (keputusan PA10b dan PA11a). Akun
 * uji dibuat lewat UI, lalu dibekukan, diaktifkan, dan diperpanjang lewat
 * UI; payload dibandingkan utuh dan hasilnya dibaca dari respons nyata serta
 * dari riwayat. Hapus akun uji masih lewat API di finally, sampai hapus
 * tersedia di UI.
 */

interface AkunRespons {
  id: string;
  email: string;
  role: "client" | "admin";
  status: string;
  plan: "basic" | "advanced" | "pro" | null;
  langganan: { aksesBerakhirPada: string | null };
}

const POLA_BUAT = /\/api\/akun\/admin\/users(\?|$)/i;
const POLA_BEKUKAN = /\/api\/akun\/admin\/users\/[^/]+\/freeze(\?|$)/i;
const POLA_AKTIFKAN = /\/api\/akun\/admin\/users\/[^/]+\/unfreeze(\?|$)/i;
const POLA_LANGGANAN = /\/api\/akun\/admin\/users\/[^/]+\/langganan(\?|$)/i;
const POLA_PLAN = /\/api\/akun\/admin\/users\/[^/]+\/plan(\?|$)/i;

const EMAIL_TOKO = "toko@gmail.com";

const dialog = (page: Page) => page.getByRole("dialog");
const riwayat = (page: Page) => page.getByRole("region", { name: "Riwayat Langganan" });
const tungguPos = (page: Page, pola: RegExp): Promise<Response> =>
  page.waitForResponse((r) => pola.test(r.url()) && r.request().method() === "POST");

const bukaDaftar = (page: Page) => bukaDaftarAkun<AkunRespons>(page);

async function bukaDetail(page: Page, akun: { id: string; email: string }) {
  await page.getByLabel("Cari akun").fill(akun.email);
  await page.getByRole("link", { name: akun.email, exact: true }).click();
  await page.waitForURL("**/admin/akun/" + akun.id);
  await expect(page.getByRole("heading", { name: "Detail Akun" })).toBeVisible();
}

test.describe("Langganan akun klien", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("alur: buat, bekukan, aktifkan, dan perpanjang, dengan riwayat", async ({ page }) => {
    test.setTimeout(90_000);
    const admin = wajibAdmin();
    const unik = Date.now().toString(36);
    const email = `e2e.langganan.${unik}@tachyon-uji.com`;
    let akun: AkunRespons | null = null;
    let terhapus = false;

    try {
      await test.step("buat akun uji dengan masa percobaan lewat UI", async () => {
        await bukaDaftar(page);
        await page.getByRole("button", { name: "Buat Akun Klien" }).click();
        await page.waitForURL("**/admin/akun/buat");
        await page.getByLabel("Email", { exact: true }).fill(email);
        await page.getByLabel("Password awal").fill("UjiKlien123");
        const tunggu = tungguPos(page, POLA_BUAT);
        await page.getByRole("button", { name: "Simpan Akun" }).click();
        const respons = await tunggu;
        akun = ((await respons.json()) as { data?: AkunRespons }).data ?? null;
        expect(respons.status()).toBe(201);
        expect(respons.request().postDataJSON()).toEqual({ email, password: "UjiKlien123" });
        await page.waitForURL("**/admin");
      });
      if (!akun) throw new Error("akun uji tidak terbentuk");
      const uji: AkunRespons = akun;
      const berakhirAwal = uji.langganan.aksesBerakhirPada;
      expect(berakhirAwal, "masa percobaan memberi masa akses").toBeTruthy();

      await test.step("detail: riwayat memuat catatan pembuatan beserta pelaku dan total (B155)", async () => {
        const tRiwayat = page.waitForResponse(
          (r) => POLA_LANGGANAN.test(r.url()) && r.request().method() === "GET",
        );
        await bukaDetail(page, uji);
        const respons = await tRiwayat;
        expect(respons.status()).toBe(200);
        const isi = (await respons.json()) as {
          total: number;
          data: { id: string; _id?: string; oleh: { username: string | null; email: string } | null }[];
        };
        expect(isi.total).toBe(1);
        expect(isi.data[0].id).toBeTruthy();
        expect(isi.data[0]).not.toHaveProperty("_id");
        const oleh = isi.data[0].oleh;
        expect(oleh, "pembuatan lewat panel dicatat atas nama admin").not.toBeNull();
        await expect(riwayat(page).getByRole("listitem")).toHaveCount(1, { timeout: 15_000 });
        await expect(riwayat(page).getByRole("listitem").first()).toContainText("Akun dibuat");
        await expect(riwayat(page).getByRole("listitem").first()).toContainText(
          `oleh ${oleh!.username || oleh!.email}`,
        );
        await expect(riwayat(page).getByText("Menampilkan 1 dari 1 catatan")).toBeVisible();
      });

      await test.step("bekukan dengan alasan", async () => {
        await page.getByRole("button", { name: "Bekukan Akun" }).click();
        await dialog(page).getByLabel("Alasan (opsional)").fill("  uji pembekuan e2e  ");
        const tunggu = tungguPos(page, POLA_BEKUKAN);
        await dialog(page).getByRole("button", { name: "Bekukan", exact: true }).click();
        const respons = await tunggu;
        expect(respons.status()).toBe(200);
        expect(respons.request().postDataJSON()).toEqual({ alasan: "uji pembekuan e2e" });
        await expect(dialog(page)).toBeHidden({ timeout: 15_000 });
        await expect(page.getByText("Non-aktif (dibekukan admin)")).toBeVisible();
        await expect(page.getByRole("button", { name: "Bekukan Akun" })).toHaveCount(0);
        await expect(riwayat(page).getByRole("listitem").first()).toContainText("Dibekukan");
        await expect(riwayat(page).getByRole("listitem").first()).toContainText("uji pembekuan e2e");
      });

      await test.step("aktifkan tanpa perpanjangan selama masa akses masih berjalan", async () => {
        await page.getByRole("button", { name: "Aktifkan Akun" }).click();
        await expect(dialog(page).getByRole("combobox", { name: "Durasi" })).toContainText(
          "Tanpa perpanjangan",
        );
        const tunggu = tungguPos(page, POLA_AKTIFKAN);
        await dialog(page).getByRole("button", { name: "Aktifkan", exact: true }).click();
        const respons = await tunggu;
        expect(respons.status()).toBe(200);
        expect(respons.request().postDataJSON()).toEqual({});
        await expect(dialog(page)).toBeHidden({ timeout: 15_000 });
        await expect(page.getByText("Aktif", { exact: true })).toBeVisible();
        await expect(riwayat(page).getByRole("listitem").first()).toContainText("Diaktifkan kembali");
      });

      await test.step("perpanjang: durasi wajib, lalu 6 bulan menambah masa akses", async () => {
        await page.getByRole("button", { name: "Perpanjang Langganan" }).click();

        let terkirim = 0;
        const catat = (r: { url(): string; method(): string }) => {
          if (POLA_LANGGANAN.test(r.url()) && r.method() === "POST") terkirim += 1;
        };
        page.on("request", catat);
        await dialog(page).getByRole("button", { name: "Perpanjang", exact: true }).click();
        await expect(dialog(page).getByRole("alert")).toContainText("Pilih durasi langganan.");
        page.off("request", catat);
        expect(terkirim, "tanpa durasi tidak ada permintaan").toBe(0);

        await dialog(page).getByRole("combobox", { name: "Durasi" }).click();
        await page.getByRole("option", { name: "6 bulan" }).click();
        const tunggu = tungguPos(page, POLA_LANGGANAN);
        await dialog(page).getByRole("button", { name: "Perpanjang", exact: true }).click();
        const respons = await tunggu;
        expect(respons.status()).toBe(200);
        expect(respons.request().postDataJSON()).toEqual({ durasiBulan: 6 });
        const hasil = ((await respons.json()) as { data: AkunRespons }).data;
        expect(
          new Date(String(hasil.langganan.aksesBerakhirPada)).getTime(),
          "masa akses bertambah dari masa percobaan",
        ).toBeGreaterThan(new Date(String(berakhirAwal)).getTime());

        await expect(dialog(page)).toBeHidden({ timeout: 15_000 });
        await expect(riwayat(page).getByRole("listitem")).toHaveCount(4);
        await expect(riwayat(page).getByRole("listitem").first()).toContainText("Diperpanjang 6 bulan");
        await expect(riwayat(page).getByText("Menampilkan 4 dari 4 catatan")).toBeVisible();
      });

      await test.step("hapus akun uji lewat UI: bekukan, lalu hapus dengan password admin", async () => {
        await hapusAkunDariDetail(page, email, admin);
        terhapus = true;
      });
    } finally {
      const tersisa = akun as AkunRespons | null;
      if (tersisa && !terhapus) await hapusAkunKlienUji(tersisa.id, admin);
    }
  });

  test("plan: buat Pro 24 bulan, ubah plan, dan perpanjang sekaligus ganti plan (B213)", async ({ page }) => {
    test.setTimeout(90_000);
    const admin = wajibAdmin();
    const email = `e2e.plan.${Date.now().toString(36)}@tachyon-uji.com`;
    let akun: AkunRespons | null = null;
    let terhapus = false;
    const butirPlan = page.locator("dl div").filter({ has: page.locator("dt", { hasText: /^Plan$/ }) });

    try {
      await test.step("buat akun Pro: masa percobaan tidak ditawarkan, durasi wajib, lalu 24 bulan", async () => {
        await bukaDaftar(page);
        await page.getByRole("button", { name: "Buat Akun Klien" }).click();
        await page.waitForURL("**/admin/akun/buat");
        await page.getByLabel("Email", { exact: true }).fill(email);
        await page.getByLabel("Password awal").fill("UjiKlien123");
        await page.getByRole("combobox", { name: "Plan" }).click();
        await page.getByRole("option", { name: "Pro" }).click();

        let terkirim = 0;
        const catat = (r: { url(): string; method(): string }) => {
          if (POLA_BUAT.test(r.url()) && r.method() === "POST") terkirim += 1;
        };
        page.on("request", catat);
        await page.getByRole("button", { name: "Simpan Akun" }).click();
        await expect(page.getByText("Pilih durasi langganan.")).toBeVisible();
        page.off("request", catat);
        expect(terkirim, "tanpa durasi tidak ada permintaan").toBe(0);

        await page.getByRole("combobox", { name: "Langganan" }).click();
        await expect(page.getByRole("option", { name: "Masa percobaan" })).toHaveCount(0);
        await page.getByRole("option", { name: "24 bulan" }).click();
        const tunggu = tungguPos(page, POLA_BUAT);
        await page.getByRole("button", { name: "Simpan Akun" }).click();
        const respons = await tunggu;
        akun = ((await respons.json()) as { data?: AkunRespons }).data ?? null;
        expect(respons.status()).toBe(201);
        expect(respons.request().postDataJSON()).toEqual({
          email,
          password: "UjiKlien123",
          plan: "pro",
          durasiBulan: 24,
        });
        expect(akun?.plan).toBe("pro");
        await page.waitForURL("**/admin");
      });
      if (!akun) throw new Error("akun uji tidak terbentuk");
      const uji: AkunRespons = akun;

      await test.step("daftar dan detail menampilkan plan, riwayat mencatat plan awal", async () => {
        await page.getByLabel("Cari akun").fill(email);
        const baris = page.getByRole("row").filter({ hasText: email });
        await expect(baris.getByRole("cell", { name: "Pro", exact: true })).toBeVisible({ timeout: 15_000 });
        await page.getByRole("link", { name: email, exact: true }).click();
        await page.waitForURL("**/admin/akun/" + uji.id);
        await expect(butirPlan).toContainText("Pro");
        const pertama = riwayat(page).getByRole("listitem").first();
        await expect(pertama).toContainText("Akun dibuat 24 bulan", { timeout: 15_000 });
        await expect(pertama).toContainText("Plan Pro");
      });

      await test.step("ubah plan: plan sekarang tidak ditawarkan, Pro menjadi Advanced", async () => {
        await page.getByRole("button", { name: "Ubah Plan" }).click();
        await expect(dialog(page)).toContainText("Plan sekarang Pro. Masa akses tidak berubah.");
        await dialog(page).getByRole("combobox", { name: "Plan baru" }).click();
        await expect(page.getByRole("option", { name: /^Pro/ })).toHaveCount(0);
        await page.getByRole("option", { name: "Advanced" }).click();
        const tunggu = page.waitForResponse((r) => POLA_PLAN.test(r.url()) && r.request().method() === "PUT");
        await dialog(page).getByRole("button", { name: "Ubah Plan", exact: true }).click();
        const respons = await tunggu;
        expect(respons.status()).toBe(200);
        expect(respons.request().postDataJSON()).toEqual({ plan: "advanced" });
        const hasil = ((await respons.json()) as { data: AkunRespons }).data;
        expect(hasil.plan).toBe("advanced");
        expect(hasil.langganan.aksesBerakhirPada, "masa akses tidak berubah").toBe(
          uji.langganan.aksesBerakhirPada,
        );
        await expect(dialog(page)).toBeHidden({ timeout: 15_000 });
        await expect(butirPlan).toContainText("Advanced");
        const pertama = riwayat(page).getByRole("listitem").first();
        await expect(pertama).toContainText("Plan diubah");
        await expect(pertama).toContainText("Plan Pro menjadi Advanced");
      });

      await test.step("perpanjang 1 bulan sekaligus kembali ke Pro", async () => {
        await page.getByRole("button", { name: "Perpanjang Langganan" }).click();
        await expect(dialog(page).getByRole("combobox", { name: "Plan" })).toContainText("Advanced (sekarang)");
        await dialog(page).getByRole("combobox", { name: "Durasi" }).click();
        await page.getByRole("option", { name: "1 bulan", exact: true }).click();
        await dialog(page).getByRole("combobox", { name: "Plan" }).click();
        await page.getByRole("option", { name: "Pro" }).click();
        const tunggu = tungguPos(page, POLA_LANGGANAN);
        await dialog(page).getByRole("button", { name: "Perpanjang", exact: true }).click();
        const respons = await tunggu;
        expect(respons.status()).toBe(200);
        expect(respons.request().postDataJSON()).toEqual({ durasiBulan: 1, plan: "pro" });
        await expect(dialog(page)).toBeHidden({ timeout: 15_000 });
        await expect(butirPlan).toContainText("Pro");
        const pertama = riwayat(page).getByRole("listitem").first();
        await expect(pertama).toContainText("Diperpanjang 1 bulan");
        await expect(pertama).toContainText("Plan Advanced menjadi Pro");
      });

      await test.step("hapus akun uji lewat UI", async () => {
        await hapusAkunDariDetail(page, email, admin);
        terhapus = true;
      });
    } finally {
      const tersisa = akun as AkunRespons | null;
      if (tersisa && !terhapus) await hapusAkunKlienUji(tersisa.id, admin);
    }
  });

  test("akun tanpa batas masa akses diaktifkan tanpa durasi dan tetap tanpa batas (B154)", async ({ page }) => {
    const admin = wajibAdmin();
    const daftar = await bukaDaftar(page);
    // Akun uji utama tenant (EMAIL_TOKO) tidak dibekukan: pembekuan
    // mengeluarkan seluruh pengguna tokonya, yang dipakai spec lain.
    const sasaran = daftar.find(
      (a) =>
        a.role === "client" &&
        a.status === "aktif" &&
        a.langganan.aksesBerakhirPada === null &&
        a.email !== EMAIL_TOKO,
    );
    test.skip(!sasaran, "Tidak ada akun klien aktif tanpa batas masa akses selain akun uji utama");
    if (!sasaran) return;

    let beku = false;
    try {
      await bukaDetail(page, sasaran);
      await expect(page.getByText("Tidak dibatasi")).toBeVisible();
      await page.getByRole("button", { name: "Bekukan Akun" }).click();
      const tBeku = tungguPos(page, POLA_BEKUKAN);
      await dialog(page).getByRole("button", { name: "Bekukan", exact: true }).click();
      expect((await tBeku).status()).toBe(200);
      beku = true;
      await expect(dialog(page)).toBeHidden({ timeout: 15_000 });

      await page.getByRole("button", { name: "Aktifkan Akun" }).click();
      await expect(dialog(page)).toContainText("tanpa batas masa akses");
      await expect(dialog(page).getByRole("combobox", { name: "Durasi" })).toContainText(
        "Tetap tidak dibatasi",
      );
      const tAktif = tungguPos(page, POLA_AKTIFKAN);
      await dialog(page).getByRole("button", { name: "Aktifkan", exact: true }).click();
      const respons = await tAktif;
      expect(respons.status()).toBe(200);
      expect(respons.request().postDataJSON()).toEqual({});
      const hasil = ((await respons.json()) as { data: AkunRespons }).data;
      expect(hasil.status).toBe("aktif");
      expect(hasil.langganan.aksesBerakhirPada, "tetap tanpa batas").toBeNull();
      beku = false;
      await expect(dialog(page)).toBeHidden({ timeout: 15_000 });
      await expect(page.getByText("Tidak dibatasi")).toBeVisible();
    } finally {
      if (beku) await aktifkanAkunKlienUji(sasaran.id, admin);
    }
  });

  test("bekukan gagal: dialog bertahan dan pesan backend tampil", async ({ page }) => {
    const daftar = await bukaDaftar(page);
    const klien = daftar.find((a) => a.role === "client" && a.status === "aktif");
    test.skip(!klien, "Tidak ada akun klien aktif di data uji");
    if (!klien) return;

    await bukaDetail(page, klien);
    await page.route(POLA_BEKUKAN, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: "Simulasi gagal membekukan." }),
      }),
    );
    try {
      await page.getByRole("button", { name: "Bekukan Akun" }).click();
      await dialog(page).getByRole("button", { name: "Bekukan", exact: true }).click();
      await expect(dialog(page).getByRole("alert")).toContainText("Simulasi gagal membekukan.");
      await expect(dialog(page)).toBeVisible();
    } finally {
      await page.unroute(POLA_BEKUKAN);
    }
    await dialog(page).getByRole("button", { name: "Batal" }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByRole("button", { name: "Bekukan Akun" })).toBeVisible();
  });

  test("perpanjang bersamaan ditolak 409: pesan tampil dan akun dimuat ulang (B251)", async ({ page }) => {
    test.setTimeout(90_000);
    const admin = wajibAdmin();
    const email = `e2e.bersamaan.${Date.now().toString(36)}@tachyon-uji.com`;
    let akun: { id: string; email: string } | null = null;
    try {
      await bukaDaftar(page);
      akun = await buatAkunKlienLewatUi(page, email);
      await bukaDetail(page, akun);
      await expect(riwayat(page).getByRole("listitem")).toHaveCount(1, { timeout: 15_000 });

      // Perpanjang lain yang menang tidak dapat dibuat deterministik, dan login
      // admin kedua memutus sesi halaman ini. Permintaan dialog diteruskan
      // sungguhan sebagai perpanjang pemenang, lalu dialog dijawab 409 yang
      // dikirim backend untuk perpanjang yang kalah.
      const PESAN_409 = "Langganan baru saja diubah permintaan lain. Muat ulang lalu coba lagi.";
      let diteruskan = 0;
      await page.route(POLA_LANGGANAN, async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        const asli = await route.fetch();
        if (asli.status() === 200) diteruskan += 1;
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ status: "error", message: PESAN_409 }),
        });
      });
      try {
        await page.getByRole("button", { name: "Perpanjang Langganan" }).click();
        await dialog(page).getByRole("combobox", { name: "Durasi" }).click();
        await page.getByRole("option", { name: "1 bulan" }).click();
        const tRiwayat = page.waitForResponse(
          (r) => POLA_LANGGANAN.test(r.url()) && r.request().method() === "GET",
        );
        await dialog(page).getByRole("button", { name: "Perpanjang", exact: true }).click();
        await expect(dialog(page).getByRole("alert")).toContainText(PESAN_409);
        expect((await tRiwayat).status(), "riwayat dimuat ulang setelah 409").toBe(200);
        await expect(dialog(page)).toBeVisible();
        expect(diteruskan, "perpanjang pemenang tercatat di backend").toBe(1);
      } finally {
        await page.unroute(POLA_LANGGANAN);
      }

      await dialog(page).getByRole("button", { name: "Batal" }).click();
      await expect(dialog(page)).toBeHidden();
      await expect(riwayat(page).getByRole("listitem")).toHaveCount(2);
      await expect(riwayat(page).getByRole("listitem").first()).toContainText("Diperpanjang 1 bulan");
    } finally {
      if (akun) await hapusAkunKlienUji(akun.id, admin);
    }
  });

  test("akun admin: tanpa aksi langganan dan tanpa riwayat", async ({ page }) => {
    await bukaDaftar(page);
    const barisAdmin = page
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: "Admin", exact: true }) })
      .first();
    await barisAdmin.getByRole("link").click();
    await page.waitForURL(/\/admin\/akun\/[0-9a-f]{24}$/);

    await expect(
      page.getByText("Akun admin tidak berlangganan dan tidak dapat dibekukan."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Bekukan Akun" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Perpanjang Langganan" })).toHaveCount(0);
    await expect(riwayat(page)).toHaveCount(0);
  });

  for (const [id, status] of [
    ["000000000000000000000000", 404],
    ["bukan-id", 400],
  ] as const) {
    test(`id ${id} dijawab ${status} oleh detail akun dan menampilkan pesan tidak ditemukan (B176)`, async ({
      page,
    }) => {
      await loginAdmin(page, wajibAdmin());
      await page.goto("/admin/akun/" + id, { waitUntil: "commit" });
      const respons = await page.waitForResponse(
        (r) => r.url().endsWith("/api/akun/admin/users/" + id) && r.request().method() === "GET",
      );
      expect(respons.status()).toBe(status);
      await expect(page.getByRole("alert").filter({ hasText: "Akun tidak ditemukan" })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole("link", { name: "Kembali ke Daftar Akun" })).toBeVisible();
    });
  }
});