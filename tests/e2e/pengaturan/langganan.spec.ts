import { test, expect, type Page } from "@playwright/test";
import { masuk } from "../../helpers/masuk-uji";

/*
 * Halaman Langganan (desain F), dari GET /akun/langganan dan riwayatnya
 * (B229), bergerbang read-langganan. Pengguna uji Ridho berperan Owner,
 * yang memegang izin itu lewat seed. Akun uji ber-plan Pro tanpa batas
 * waktu (dinaikkan lewat API admin pada penyesuaian backend 4759208).
 * Jalur tanpa izin diuji di unit (IZIN_HALAMAN) dan memakai gerbang rute
 * yang sama dengan halaman lain.
 */
const URL_LANGGANAN = "/dashboard/outlet/pengaturan/langganan";
const NAMA_PLAN: Record<string, string> = { basic: "Basic", advanced: "Advanced", pro: "Pro" };
const kartuPlan = (page: Page, nama: string) => page.getByRole("article", { name: `Plan ${nama}` });

interface Langganan {
  plan: string;
  aksesBerakhirPada: string | null;
  masaPercobaan: boolean;
  aksesMulaiPada: string | null;
}

/** Membuka halaman dan mengembalikan data langganan serta jumlah riwayat dari respons nyata. */
async function bukaLangganan(
  page: Page,
  lewat: () => Promise<unknown>,
  sebelumPenunggu: () => Promise<unknown> = () => Promise.resolve(),
) {
  await sebelumPenunggu();
  const jawabLangganan = page.waitForResponse((r) => /\/api\/akun\/langganan$/.test(r.url()));
  const jawabRiwayat = page.waitForResponse((r) => /\/api\/akun\/langganan\/riwayat/.test(r.url()));
  await lewat();
  const l = await jawabLangganan;
  const r = await jawabRiwayat;
  expect(l.status()).toBe(200);
  expect(r.status()).toBe(200);
  const data = (await l.json()).data as Langganan;
  const riwayat = ((await r.json()).data as unknown[]).length;
  return { data, riwayat };
}

/**
 * Membuka halaman langsung. Lonceng topbar (TP8a) ikut meminta
 * /akun/langganan di setiap halaman dashboard, jadi penunggu dipasang
 * setelah navigasi commit, agar tidak menangkap respons halaman sebelumnya
 * yang sudah dibuang.
 */
async function bukaLangsung(page: Page) {
  return bukaLangganan(page, () => Promise.resolve(), () => page.goto(URL_LANGGANAN, { waitUntil: "commit" }));
}

test.describe("Langganan", () => {
  test.beforeEach(async ({ page }) => {
    await masuk(page);
  });

  test("Owner membuka Langganan dari kartu di Pengaturan, dengan plan dan riwayat dari backend", async ({ page }) => {
    await page.goto("/dashboard/outlet/pengaturan");
    const { data, riwayat } = await bukaLangganan(page, () => page.getByRole("link", { name: /Langganan/ }).click());
    await page.waitForURL("**" + URL_LANGGANAN);
    await expect(page.getByRole("heading", { level: 1, name: "Langganan" })).toBeVisible();
    await expect(page.getByText("Pratinjau tampilan")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: `Plan ${NAMA_PLAN[data.plan]}` })).toBeVisible();
    // B333: penanda masa percobaan dan awal masa berlaku dari backend (LG4a).
    expect(typeof data.masaPercobaan, "masaPercobaan").toBe("boolean");
    expect(data, "aksesMulaiPada").toHaveProperty("aksesMulaiPada");
    if (data.aksesBerakhirPada === null) {
      expect(data.aksesMulaiPada).toBeNull();
      await expect(page.getByText("Masa berlaku tidak dibatasi.")).toBeVisible();
      await expect(page.getByRole("progressbar")).toHaveCount(0);
    }
    expect(riwayat, "akun uji punya riwayat ubah plan").toBeGreaterThan(0);
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(riwayat);
  });

  test("perbandingan tiga plan dengan fitur sesuai plan, plan aktif ditandai", async ({ page }) => {
    const { data } = await bukaLangsung(page);
    for (const [kunci, nama] of Object.entries(NAMA_PLAN)) {
      const kartu = expect(kartuPlan(page, nama));
      if (kunci === data.plan) await kartu.toContainText("Plan Anda");
      else await kartu.not.toContainText("Plan Anda");
    }
    await expect(kartuPlan(page, "Basic").getByRole("img", { name: "Tidak termasuk" })).toHaveCount(2);
    await expect(kartuPlan(page, "Advanced").getByRole("img", { name: "Tidak termasuk" })).toHaveCount(1);
    await expect(kartuPlan(page, "Pro").getByRole("img", { name: "Tidak termasuk" })).toHaveCount(0);
  });

  test("tanpa nomor WhatsApp admin, kontak tampil sebagai teks tanpa tautan", async ({ page }) => {
    await page.goto(URL_LANGGANAN);
    await expect(page.getByText("Hubungi admin Tachyon untuk naik plan atau perpanjang.")).toBeVisible();
    await expect(page.locator('a[href^="https://wa.me"]')).toHaveCount(0);
  });

  test("di layar HP halaman tidak melebar; riwayat tampil sebagai kartu berlabel (CV22a)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { riwayat } = await bukaLangsung(page);
    await expect(page.getByRole("heading", { level: 2, name: "Riwayat" })).toBeVisible();
    const kartu = page.locator("table tbody tr");
    await expect(kartu).toHaveCount(riwayat);
    await expect(kartu.first().getByText("Berlaku sampai", { exact: true })).toBeVisible();
    const lebar = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(lebar).toBeLessThanOrEqual(390);
  });
});

test.describe("Langganan: keadaan masa berlaku", () => {
  test.beforeEach(async ({ page }) => {
    await masuk(page);
  });

  /** Respons /akun/langganan nyata dengan bidang masa berlaku diganti. */
  async function simulasikanMasa(page: Page, ubah: Record<string, unknown>) {
    await page.route(/\/api\/akun\/langganan$/, async (route) => {
      const asli = await route.fetch();
      const body = await asli.json();
      // simulasi: akun uji Pro tanpa batas waktu; masa percobaan dan masa akses lewat tidak dapat dibuat pada akun uji yang dipakai seluruh suite
      await route.fulfill({ response: asli, json: { ...body, data: { ...body.data, ...ubah } } });
    });
  }

  test("masa percobaan: penanda, tanggal berakhir, sisa hari, dan bilah terpakai", async ({ page }) => {
    const HARI = 86_400_000;
    const mulai = new Date(Date.now() - 4 * HARI);
    const berakhir = new Date(Date.now() + 10 * HARI);
    await simulasikanMasa(page, {
      plan: "basic",
      masaPercobaan: true,
      aksesMulaiPada: mulai.toISOString(),
      aksesBerakhirPada: berakhir.toISOString(),
    });
    await page.goto(URL_LANGGANAN);
    const aktif = page.locator('[aria-labelledby="langganan-aktif"]');
    await expect(aktif.getByText("Masa percobaan")).toBeVisible({ timeout: 15_000 });
    await expect(aktif).toContainText(/Berakhir .*, 10 hari lagi\./);
    const bilah = aktif.getByRole("progressbar", { name: "Masa berlaku terpakai" });
    const nilai = Number(await bilah.getAttribute("aria-valuenow"));
    expect(nilai, "sekitar 4 dari 14 hari terpakai").toBeGreaterThanOrEqual(28);
    expect(nilai).toBeLessThanOrEqual(30);
  });

  test("masa akses lewat: tanggal habis dan batas masa tenggang, tanpa bilah", async ({ page }) => {
    const HARI = 86_400_000;
    const berakhir = new Date(Date.now() - 2 * HARI);
    await simulasikanMasa(page, {
      masaPercobaan: false,
      aksesMulaiPada: new Date(berakhir.getTime() - 30 * HARI).toISOString(),
      aksesBerakhirPada: berakhir.toISOString(),
      masaTenggangHari: 7,
    });
    await page.goto(URL_LANGGANAN);
    const aktif = page.locator('[aria-labelledby="langganan-aktif"]');
    await expect(aktif).toContainText("Masa berlaku habis", { timeout: 15_000 });
    await expect(aktif).toContainText("Toko masih dapat dipakai sampai");
    await expect(aktif.getByRole("progressbar")).toHaveCount(0);
    await expect(aktif.getByText("Masa percobaan")).toHaveCount(0);
  });
});
