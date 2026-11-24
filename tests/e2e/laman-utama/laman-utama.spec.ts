import { test, expect, type Page } from "@playwright/test";
import { masuk } from "../../helpers/masuk-uji";

/**
 * Laman utama di / (desain G, LU1a sampai LU5a): tombol tamu dan pengguna
 * yang sudah masuk, akordeon tanya jawab, dan bagian yang muncul saat
 * digulir dari kedua arah.
 */

const navbar = (page: Page) => page.locator("header").first();

test.describe("Laman utama (tamu)", () => {
  test("LU3a: tamu melihat Masuk dan Coba gratis menuju login dan daftar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toko Anda, terbaca dalam satu layar.");
    await expect(navbar(page).getByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/login");
    await expect(navbar(page).getByRole("link", { name: "Coba gratis" })).toHaveAttribute("href", "/daftar");
    await expect(page.getByRole("link", { name: "Buka dashboard" })).toHaveCount(0);
  });

  test("LU4a: tanya jawab membuka satu jawaban pada satu waktu", async ({ page }) => {
    await page.goto("/");
    const pertama = page.getByRole("button", { name: "Bisakah satu akun dipakai banyak karyawan?" });
    const kedua = page.getByRole("button", { name: "Bagaimana cara mendaftar?" });
    await expect(pertama).toHaveAttribute("aria-expanded", "true");
    await kedua.click();
    await expect(kedua).toHaveAttribute("aria-expanded", "true");
    await expect(pertama).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Tekan Coba gratis, isi email toko")).toBeVisible();
    await kedua.click();
    await expect(kedua).toHaveAttribute("aria-expanded", "false");
  });

  test("LU4a: bagian muncul saat digulir ke bawah dan masuk dari atas saat digulir ke atas", async ({ page }) => {
    await page.goto("/");
    const paket = page.locator("#paket [data-muncul]").first();
    await expect(paket).toHaveAttribute("data-muncul", "bawah");
    await paket.scrollIntoViewIfNeeded();
    await expect(paket).toHaveAttribute("data-muncul", "tampil");
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(paket).toHaveAttribute("data-muncul", "atas");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(paket).toHaveAttribute("data-muncul", "bawah");
  });
});

test.describe("Laman utama (sudah masuk)", () => {
  test("paket: setiap fitur berpenanda sesuai plan, tanpa gulir samping di tiga lebar", async ({ page }) => {
    // Deskripsi gaya A di kartu B (pemilik proyek, 24 November 2026); aturan plan
    // dari lib/auth/fitur-plan.ts: Sesi booking mulai Advanced, Gudang mulai Pro.
    const harapan: Record<string, string[]> = {
      Basic: ["termasuk", "termasuk", "termasuk", "tidak termasuk", "tidak termasuk"],
      Advanced: ["termasuk", "termasuk", "termasuk", "termasuk", "tidak termasuk"],
      Pro: ["termasuk", "termasuk", "termasuk", "termasuk", "termasuk"],
    };
    for (const lebar of [390, 768, 1280]) {
      await page.setViewportSize({ width: lebar, height: 900 });
      await page.goto("/");
      const paket = page.locator("#paket");
      await paket.scrollIntoViewIfNeeded();
      for (const [nama, tanda] of Object.entries(harapan)) {
        const kartu = paket.locator("[data-muncul]").filter({ has: page.getByRole("heading", { name: nama, exact: true }) });
        const baris = kartu.getByRole("listitem");
        await expect(baris).toHaveCount(5);
        await expect(baris.nth(3)).toContainText("Sesi booking: aset, tipe aset, dan tarif");
        await expect(baris.nth(4)).toContainText("Gudang dan WMS: pengajuan dan transfer stok");
        for (let i = 0; i < tanda.length; i++) {
          const teks = (await baris.nth(i).innerText()).replace(/\s+/g, " ");
          if (tanda[i] === "termasuk") expect(teks, `${nama} baris ${i + 1} di ${lebar} px`).toMatch(/ termasuk$/);
          else await expect(baris.nth(i).locator(".sr-only")).toHaveText("tidak termasuk");
        }
        await expect(kartu.locator("li.line-through")).toHaveCount(0);
      }
      const isi = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(isi, `tanpa gulir samping di ${lebar} px`).toBeLessThanOrEqual(lebar);
    }
  });

  test("LU3a: pengguna yang sudah masuk hanya melihat Buka dashboard", async ({ page }) => {
    await masuk(page);
    await page.goto("/");
    await expect(navbar(page).getByRole("link", { name: "Buka dashboard" })).toHaveAttribute("href", "/dashboard");
    await expect(navbar(page).getByRole("link", { name: "Masuk" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Coba gratis" })).toHaveCount(1); // hanya di kaki laman
    await navbar(page).getByRole("link", { name: "Buka dashboard" }).click();
    await page.waitForURL("**/dashboard**");
  });
});
