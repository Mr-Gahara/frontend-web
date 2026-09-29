import { test, expect, type Page } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, login } from "../../helpers/transfer-uji";
import { cocok, pantauPermintaan, tunda } from "../../helpers/reservasi-uji";

/*
 * Spec pembanding ruang gudang terhadap kode lama (modul Gudang, langkah 1):
 * verifikasi gudang di layout, pengalihan setup saat gudang sudah ada,
 * pilihan Ruang Gudang di sidebar, serta payload dan penolakan radius di
 * setup. Hanya perilaku yang tidak berubah oleh keputusan GD3a sampai GD6a.
 * Tenant uji sudah punya gudang, sehingga setup dibuka dengan daftar lokasi
 * tanpa gudang yang dibentuk dari respons nyata ("// simulasi:"), dan POST
 * dijawab gagal agar tidak ada lokasi yang tersimpan (keputusan GD6a).
 * Skenario koordinat kosong, label, koordinat bukan angka, dan galat
 * layout ditambahkan saat migrasi (keputusan GD3a dan GD4a).
 */

const URL_GUDANG = BASIS + "/dashboard/gudang";
const URL_SETUP = URL_GUDANG + "/setup";
const POLA_LOKASI = /\/api\/location(\?|$)/i;

const NAMA = "E2E Gudang Setup";
const ALAMAT = "Jl. Uji Setup No. 1";
const LATITUDE = "-0.0393";
const LONGITUDE = "109.2747";

async function simulasikanTanpaGudang(page: Page) {
  await page.route(POLA_LOKASI, async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      await route.fulfill(JAWAB_GAGAL);
      return;
    }
    if (method !== "GET") {
      await route.continue();
      return;
    }
    const asli = await route.fetch();
    const body = await asli.json();
    const data = Array.isArray(body.data)
      ? body.data.filter((l: { tipe?: string }) => l.tipe !== "Gudang")
      : body.data;
    // simulasi: tenant tanpa gudang hanya ada bila gudang tenant uji dihapus, padahal gudang itu menyimpan stok
    await route.fulfill({ status: asli.status(), json: { ...body, data } });
  });
}

async function bukaSetup(page: Page) {
  await page.goto(URL_SETUP);
  await expect(page.getByRole("heading", { name: "Inisiasi Gudang Pusat" })).toBeVisible({
    timeout: 15_000,
  });
}

function isianKoordinat(page: Page, label: "Latitude" | "Longitude") {
  return page.getByText(label, { exact: true }).locator("xpath=..").locator("input");
}

async function isiSetup(page: Page, radius: string) {
  await page.getByPlaceholder("Contoh: Gudang Utama A").fill(NAMA);
  await page.getByPlaceholder("Contoh: Jl. Khatulistiwa No. 123").fill(ALAMAT);
  await isianKoordinat(page, "Latitude").fill(LATITUDE);
  await isianKoordinat(page, "Longitude").fill(LONGITUDE);
  await page.getByPlaceholder("Contoh: 20").fill(radius);
}

const tombolSimpan = (page: Page) =>
  page.getByRole("button", { name: /simpan & buka ruang gudang/i });

test.describe("Ruang gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("halaman gudang tampil setelah lokasi gudang diverifikasi", async ({ page }) => {
    for (const url of [URL_GUDANG, URL_GUDANG + "/jurnalStok"]) {
      await page.goto(url, { waitUntil: "commit" });
      const res = await page.waitForResponse(cocok("GET", POLA_LOKASI));
      expect(res.status()).toBe(200);
      const daftar = ((await res.json()).data ?? []) as { tipe: string }[];
      expect(
        daftar.some((l) => l.tipe === "Gudang"),
        "tenant uji harus punya lokasi Gudang",
      ).toBe(true);
      await expect(page.getByText("Memverifikasi data Gudang...")).toHaveCount(0, {
        timeout: 15_000,
      });
      await expect(page).toHaveURL(url);
      await expect(page.getByText("Gudang Ops.")).toBeVisible();
    }
  });

  test("setup dialihkan ke dashboard gudang bila gudang sudah ada", async ({ page }) => {
    await page.goto(URL_SETUP);
    await page.waitForURL(URL_GUDANG, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Inisiasi Gudang Pusat" })).toHaveCount(0);
  });

  test("sidebar menawarkan Ruang Gudang tanpa Setup Gudang Baru", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/outlet/);
    await page.getByText("Outlet Ops.").click();
    const ruang = page.getByRole("menuitem", { name: /ruang gudang/i });
    await expect(ruang).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("menuitem", { name: /setup gudang baru/i })).toHaveCount(0);
    await ruang.click();
    await page.waitForURL(URL_GUDANG);
    await expect(page.getByText("Gudang Ops.")).toBeVisible({ timeout: 15_000 });
  });

  test("setup mengirim payload lokasi Gudang dan bertahan saat gagal", async ({ page }) => {
    await simulasikanTanpaGudang(page);
    await bukaSetup(page);
    await isiSetup(page, "20");
    const tPost = page.waitForRequest(
      (r) => r.method() === "POST" && POLA_LOKASI.test(r.url()),
    );
    await tombolSimpan(page).click();
    const req = await tPost;
    expect(req.postDataJSON()).toEqual({
      nama: NAMA,
      tipe: "Gudang",
      alamat: ALAMAT,
      radiusAbsen: 20,
      latitude: Number(LATITUDE),
      longitude: Number(LONGITUDE),
    });
    await expect(page.getByText("Gagal Membuat Gudang")).toBeVisible();
    await expect(page).toHaveURL(URL_SETUP);
    await expect(page.getByPlaceholder("Contoh: Gudang Utama A")).toHaveValue(NAMA);
    await page.unroute(POLA_LOKASI);
  });

  test("setup memulai koordinat kosong dengan label yang terhubung ke isiannya", async ({ page }) => {
    await simulasikanTanpaGudang(page);
    await bukaSetup(page);
    await expect(page.getByLabel("Nama Gudang / Warehouse")).toBeVisible();
    await expect(page.getByLabel("Alamat Lengkap")).toBeVisible();
    await expect(page.getByLabel("Radius Toleransi Absen (Meter)")).toBeVisible();
    await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue("");
    await page.unroute(POLA_LOKASI);
  });

  test("setup tidak mengirim koordinat bukan angka dan menampilkan pesannya", async ({ page }) => {
    await simulasikanTanpaGudang(page);
    await bukaSetup(page);
    await isiSetup(page, "20");
    await isianKoordinat(page, "Latitude").fill("abc");
    const pantau = pantauPermintaan(page, "POST", POLA_LOKASI);
    await tombolSimpan(page).click();
    await expect(page.getByText("Latitude harus berupa angka desimal.")).toBeVisible();
    await tunda(1_000);
    pantau.lepas();
    expect(pantau.jumlah()).toBe(0);
    await expect(page).toHaveURL(URL_SETUP);
    await page.unroute(POLA_LOKASI);
  });

  test("layout menampilkan pesan dan tombol coba lagi saat lokasi gagal dimuat", async ({ page }) => {
    test.setTimeout(60_000);
    await page.route(POLA_LOKASI, async (route) => {
      if (route.request().method() === "GET") await route.fulfill(JAWAB_GAGAL);
      else await route.continue();
    });
    await page.goto(URL_GUDANG);
    await expect(page.getByText("Gagal Memuat Data Gudang")).toBeVisible({ timeout: 25_000 });
    await expect(page).toHaveURL(URL_GUDANG);
    await page.unroute(POLA_LOKASI);
    const tMuatUlang = page.waitForResponse(cocok("GET", POLA_LOKASI));
    await page.getByRole("button", { name: "Coba Lagi" }).click();
    expect((await tMuatUlang).status()).toBe(200);
    await expect(page.getByText("Gagal Memuat Data Gudang")).toHaveCount(0);
    await expect(page.getByText("Memverifikasi data Gudang...")).toHaveCount(0);
    await expect(page).toHaveURL(URL_GUDANG);
  });

  for (const radius of ["5", "60"]) {
    test(`setup tidak mengirim lokasi dengan radius ${radius} meter`, async ({ page }) => {
      await simulasikanTanpaGudang(page);
      await bukaSetup(page);
      await isiSetup(page, radius);
      const pantau = pantauPermintaan(page, "POST", POLA_LOKASI);
      await tombolSimpan(page).click();
      await tunda(1_000);
      pantau.lepas();
      expect(pantau.jumlah()).toBe(0);
      await expect(page).toHaveURL(URL_SETUP);
      await page.unroute(POLA_LOKASI);
    });
  }
});