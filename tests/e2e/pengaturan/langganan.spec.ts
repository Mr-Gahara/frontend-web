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
}

/** Membuka halaman dan mengembalikan data langganan serta jumlah riwayat dari respons nyata. */
async function bukaLangganan(page: Page, lewat: () => Promise<unknown>) {
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
    if (data.aksesBerakhirPada === null) {
      await expect(page.getByText("Masa berlaku tidak dibatasi.")).toBeVisible();
      await expect(page.getByRole("progressbar")).toHaveCount(0);
    }
    expect(riwayat, "akun uji punya riwayat ubah plan").toBeGreaterThan(0);
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(riwayat);
  });

  test("perbandingan tiga plan dengan fitur sesuai plan, plan aktif ditandai", async ({ page }) => {
    const { data } = await bukaLangganan(page, () => page.goto(URL_LANGGANAN));
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

  test("di layar HP halaman tidak melebar; riwayat tampil sebagai daftar, bukan tabel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { riwayat } = await bukaLangganan(page, () => page.goto(URL_LANGGANAN));
    await expect(page.getByRole("heading", { level: 2, name: "Riwayat" })).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();
    await expect(page.getByRole("listitem").filter({ hasText: "berlaku sampai" })).toHaveCount(riwayat);
    const lebar = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(lebar).toBeLessThanOrEqual(390);
  });
});
