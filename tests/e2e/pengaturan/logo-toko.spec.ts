import { test, expect, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";

/*
 * Logo toko di Profil Toko (B203 sampai B205, desain C pemilik proyek
 * 12 November 2026). Unggah dan hapus dijalankan lewat UI dengan respons
 * nyata; API hanya membaca bukti dan menghapus logo uji di finally.
 * Tata letak dua kolom (Logo dan Pratinjau struk) diperiksa di lebar
 * desktop, tablet, dan HP, sesuai papan desain.
 */

const URL_PROFIL = BASIS + "/dashboard/outlet/pengaturan/toko";
const POLA_LOGO = /\/api\/tenant\/[0-9a-f]{24}\/logo$/i;
const POLA_BERKAS_LOGO = /\/api\/tenant\/[0-9a-f]{24}\/logo\/[^/]+$/i;

/** PNG 1x1 yang sah, agar backend dapat mengubahnya ke WebP. */
const PNG_KECIL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

type TenantMentah = { id: string; namaToko: string; logoUrl: string | null };

const masukanLogo = (page: Page) => page.getByLabel("Berkas logo toko");
const logoKartu = (page: Page) => page.getByRole("img", { name: "Logo toko saat ini" });
const logoStruk = (page: Page) => page.getByRole("img", { name: "Logo di struk" });

async function bukaLogo(page: Page): Promise<{ auth: Auth; tenant: TenantMentah }> {
  const auth = await bukaDenganAuth(page, URL_PROFIL);
  const lokasi = await api<{ tenantID: string }>(page, auth, "GET", "/location/current");
  expect(lokasi.status, lokasi.pesan).toBe(200);
  const tenant = await api<TenantMentah>(page, auth, "GET", "/tenant/" + lokasi.data.tenantID);
  expect(tenant.status, tenant.pesan).toBe(200);
  await expect(page.getByRole("heading", { name: "Logo Toko", exact: true })).toBeVisible({ timeout: 15_000 });
  return { auth, tenant: tenant.data };
}

/** Kolom Logo dan Pratinjau struk: berdampingan sejajar, atau bertumpuk. */
async function letakKolom(page: Page) {
  const logo = await page.getByText("Logo", { exact: true }).boundingBox();
  const struk = await page.getByText("Pratinjau struk", { exact: true }).boundingBox();
  expect(logo && struk, "kedua label kolom tampil").toBeTruthy();
  return { logo: logo!, struk: struk! };
}

test.describe("Logo toko", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("unggah logo tampil di kartu, pratinjau struk, dan sidebar, lalu hapus mengembalikan keadaan kosong", async ({
    page,
  }) => {
    const { auth, tenant } = await bukaLogo(page);
    try {
      if (tenant.logoUrl) {
        const tHapus = page.waitForResponse((r) => r.request().method() === "DELETE" && POLA_LOGO.test(r.url()));
        await page.getByRole("button", { name: "Hapus logo" }).click();
        expect((await tHapus).status()).toBe(200);
      }
      await expect(page.getByRole("img", { name: "Belum ada logo" })).toBeVisible();
      await expect(page.getByText("Tanpa logo, struk dimulai dari nama toko.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Hapus logo" })).toHaveCount(0);

      const tUnggah = page.waitForResponse((r) => r.request().method() === "PUT" && POLA_LOGO.test(r.url()));
      const tBerkas = page.waitForResponse((r) => POLA_BERKAS_LOGO.test(r.url()) && r.request().method() === "GET");
      await masukanLogo(page).setInputFiles({ name: "logo-uji.png", mimeType: "image/png", buffer: PNG_KECIL });
      const unggah = await tUnggah;
      expect(unggah.status(), "PUT logo").toBe(200);
      expect(unggah.request().headers()["content-type"], "dikirim multipart").toMatch(/^multipart\/form-data; boundary=/);
      const logoUrl = ((await unggah.json()).data as TenantMentah).logoUrl;
      expect(logoUrl, "backend mengisi logoUrl").toMatch(/^\/api\/tenant\/[0-9a-f]{24}\/logo\/.+\.webp$/);
      expect((await tBerkas).status(), "berkas logo diambil dengan token").toBe(200);

      await expect(logoKartu(page)).toBeVisible();
      await expect(logoStruk(page)).toBeVisible();
      await expect(page.getByRole("img", { name: `Logo ${tenant.namaToko}` }), "logo di kepala sidebar").toBeVisible();
      await expect(page.getByText("Contoh tampilan; struk asli dicetak aplikasi kasir.")).toBeVisible();
      await expect(page.getByText("Seret gambar baru ke sini, atau")).toBeVisible();

      const tHapus = page.waitForResponse((r) => r.request().method() === "DELETE" && POLA_LOGO.test(r.url()));
      await page.getByRole("button", { name: "Hapus logo" }).click();
      expect((await tHapus).status(), "DELETE logo").toBe(200);
      await expect(page.getByRole("img", { name: "Belum ada logo" })).toBeVisible();
      await expect(logoStruk(page)).toHaveCount(0);
      await expect(page.getByRole("img", { name: `Logo ${tenant.namaToko}` })).toHaveCount(0);
      const sesudah = await api<TenantMentah>(page, auth, "GET", "/tenant/" + tenant.id);
      expect(sesudah.data.logoUrl, "logoUrl dikosongkan backend").toBeNull();
    } finally {
      const akhir = await api<TenantMentah>(page, auth, "GET", "/tenant/" + tenant.id);
      if (akhir.data?.logoUrl) {
        const r = await api(page, auth, "DELETE", `/tenant/${tenant.id}/logo`);
        expect.soft(r.status, "logo uji dibersihkan").toBe(200);
      }
    }
  });

  test("berkas selain JPEG, PNG, atau WebP dan berkas di atas 2 MB ditolak tanpa permintaan", async ({ page }) => {
    await bukaLogo(page);
    const terkirim: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "PUT" && POLA_LOGO.test(r.url())) terkirim.push(r.url());
    });

    await masukanLogo(page).setInputFiles({ name: "logo.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") });
    await expect(page.getByRole("alert").filter({ hasText: "Format logo tidak valid. Gunakan JPEG, PNG, atau WebP." })).toBeVisible();

    await masukanLogo(page).setInputFiles({
      name: "besar.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    });
    await expect(page.getByRole("alert").filter({ hasText: "Ukuran logo maksimal 2MB." })).toBeVisible();
    expect(terkirim, "berkas yang pasti ditolak tidak dikirim").toEqual([]);
  });

  for (const { nama, lebar, berdampingan } of [
    { nama: "desktop", lebar: 1280, berdampingan: true },
    { nama: "tablet", lebar: 768, berdampingan: true },
    { nama: "HP", lebar: 390, berdampingan: false },
  ]) {
    test(`tata letak ${nama} (${lebar} px): kolom Logo dan Pratinjau struk ${berdampingan ? "berdampingan sejajar" : "bertumpuk"}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: lebar, height: 900 });
      await bukaLogo(page);
      const { logo, struk } = await letakKolom(page);
      if (berdampingan) {
        expect(Math.abs(logo.y - struk.y), "kedua label sejajar").toBeLessThan(2);
        expect(struk.x, "pratinjau di kanan").toBeGreaterThan(logo.x);
      } else {
        expect(struk.y, "pratinjau di bawah kolom logo").toBeGreaterThan(logo.y + 100);
        expect(Math.abs(logo.x - struk.x), "kedua kolom rata kiri").toBeLessThan(2);
      }
      const lebarHalaman = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(lebarHalaman, "tanpa gulir mendatar").toBeLessThanOrEqual(lebar);
    });
  }
});
