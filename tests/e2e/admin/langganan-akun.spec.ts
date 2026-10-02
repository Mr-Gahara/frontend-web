import { test, expect, type Page, type Response } from "@playwright/test";
import {
  ALASAN_TANPA_ADMIN,
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
  langganan: { aksesBerakhirPada: string | null };
}

const POLA_DAFTAR = /\/api\/akun\/admin\/all(\?|$)/i;
const POLA_BUAT = /\/api\/akun\/admin\/users(\?|$)/i;
const POLA_BEKUKAN = /\/api\/akun\/admin\/users\/[^/]+\/freeze(\?|$)/i;
const POLA_AKTIFKAN = /\/api\/akun\/admin\/users\/[^/]+\/unfreeze(\?|$)/i;
const POLA_LANGGANAN = /\/api\/akun\/admin\/users\/[^/]+\/langganan(\?|$)/i;

const dialog = (page: Page) => page.getByRole("dialog");
const riwayat = (page: Page) => page.getByRole("region", { name: "Riwayat Langganan" });
const tungguPos = (page: Page, pola: RegExp): Promise<Response> =>
  page.waitForResponse((r) => pola.test(r.url()) && r.request().method() === "POST");

/** Login admin, lalu muat ulang agar respons daftar milik halaman ini tertangkap. */
async function bukaDaftar(page: Page): Promise<AkunRespons[]> {
  await loginAdmin(page, wajibAdmin());
  await page.reload({ waitUntil: "commit" });
  const respons = await page.waitForResponse(
    (r) => POLA_DAFTAR.test(r.url()) && r.request().method() === "GET",
  );
  expect(respons.status()).toBe(200);
  const isi = (await respons.json()) as { data: AkunRespons[] };
  await expect(page.getByText(`${isi.data.length} dari ${isi.data.length} akun`)).toBeVisible({
    timeout: 15_000,
  });
  return isi.data;
}

async function bukaDetail(page: Page, akun: { id: string; email: string }) {
  await page.getByLabel("Cari akun").fill(akun.email);
  await page.getByRole("link", { name: akun.email }).click();
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

      await test.step("detail: riwayat memuat catatan pembuatan", async () => {
        await bukaDetail(page, uji);
        await expect(riwayat(page).getByRole("listitem")).toHaveCount(1, { timeout: 15_000 });
        await expect(riwayat(page).getByRole("listitem").first()).toContainText("Akun dibuat");
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

  test("id yang tidak ada di daftar menampilkan pesan tidak ditemukan", async ({ page }) => {
    await loginAdmin(page, wajibAdmin());
    await page.goto("/admin/akun/000000000000000000000000");
    await expect(page.getByRole("alert").filter({ hasText: "Akun tidak ditemukan" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "Kembali ke Daftar Akun" })).toBeVisible();
  });
});