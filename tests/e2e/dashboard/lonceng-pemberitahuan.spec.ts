import { test, expect, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, kredensialAdmin, wajibAdmin } from "../../helpers/admin-uji";
import { akunBaru, isiTokoDanOwner } from "../../helpers/setup-uji";
import { balonPanduan } from "../../helpers/panduan-uji";
import { pengingatLangganan } from "../../../features/langganan/pengingat";
import { pemicuStokProduk } from "../../../features/notifikasi/sumber-stok-produk";
import type { RingkasanOutlet } from "../../../features/notifikasi/api";
import type { LanggananToko } from "../../../types/langganan";
import type { Produk } from "../../../types/produk";

/*
 * Lonceng topbar sebagai pusat pemberitahuan toko (modul/pemberitahuan.md,
 * LN1a sampai LN15a). Harapan dihitung dari respons nyata endpoint
 * sumbernya; respons tidak dipalsukan (keputusan rancangan butir 21).
 * Keadaan langganan hampir habis dan tenggang, serta isi kartu per jenis
 * produk, diuji di unit test (tests/unit/features/notifikasi), karena data
 * akun uji tidak dapat dibuat ke keadaan itu secara deterministik.
 */

const URL_DASHBOARD = BASIS + "/dashboard/outlet";
const URL_LANGGANAN = "/dashboard/outlet/pengaturan/langganan";

const lonceng = (page: Page) => page.getByRole("button", { name: /^Pemberitahuan/ });
const panel = (page: Page) => page.getByRole("dialog", { name: "Pemberitahuan" });
const kartu = (page: Page, id: string) => panel(page).locator(`article[data-pemberitahuan="${id}"]`);

for (const { nama, lebar } of [
  { nama: "desktop", lebar: 1280 },
  { nama: "HP", lebar: 390 },
]) {
  test(`lonceng ${nama}: lencana dan kartu sesuai data nyata stok produk, produk minimum, dan langganan, panel di dalam layar`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: lebar, height: 800 });
    await login(page);
    const auth = await bukaDenganAuth(page, URL_DASHBOARD);
    const [langganan, produk, ringkasan] = await Promise.all([
      api<LanggananToko>(page, auth, "GET", "/akun/langganan"),
      api<Produk[]>(page, auth, "GET", "/produk"),
      api<RingkasanOutlet>(page, auth, "GET", "/dashboard/outlet"),
    ]);
    for (const r of [langganan, produk, ringkasan]) expect(r.status, r.pesan).toBe(200);

    const pengingat = pengingatLangganan(langganan.data, new Date());
    const harapan: string[] = [];
    if (pemicuStokProduk(produk.data)) harapan.push("stok-produk");
    if (pengingat) harapan.push("langganan");
    if (ringkasan.data.produk.stokKritis > 0) harapan.push("produk-minimum");

    await expect(lonceng(page)).toBeEnabled();
    await expect(lonceng(page)).toHaveAccessibleName(
      harapan.length ? `Pemberitahuan, ${harapan.length} baru` : "Pemberitahuan",
      { timeout: 15_000 },
    );
    const lencana = page.getByTestId("lencana-pemberitahuan");
    await expect(lencana).toHaveCount(harapan.length ? 1 : 0);
    if (harapan.length) await expect(lencana).toHaveText(harapan.length > 9 ? "9+" : String(harapan.length));

    await lonceng(page).click();
    await expect(panel(page)).toBeVisible();
    if (harapan.length === 0) await expect(panel(page)).toContainText("Belum ada pemberitahuan.");
    await expect(panel(page).locator("article[data-pemberitahuan]")).toHaveCount(harapan.length);
    for (const id of harapan) await expect(kartu(page, id)).toBeVisible();
    if (pengingat) {
      await expect(kartu(page, "langganan")).toContainText(pengingat.judul);
      await expect(kartu(page, "langganan")).toContainText(pengingat.isi);
      await expect(kartu(page, "langganan").getByRole("link", { name: "Lihat langganan" })).toHaveAttribute(
        "href",
        URL_LANGGANAN,
      );
    }
    if (harapan.includes("produk-minimum")) {
      await expect(kartu(page, "produk-minimum")).toContainText(
        `${ringkasan.data.produk.stokKritis} produk mencapai stok minimum.`,
      );
    }

    const kotak = await panel(page).boundingBox();
    expect(kotak, "panel tampil").toBeTruthy();
    expect(kotak!.x, "tidak keluar di kiri").toBeGreaterThanOrEqual(0);
    expect(kotak!.x + kotak!.width, "tidak keluar di kanan").toBeLessThanOrEqual(lebar);
    expect(kotak!.y + kotak!.height, "tidak keluar di bawah").toBeLessThanOrEqual(800);

    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
  });
}

test.describe("toko tanpa produk (akun klien sekali pakai)", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("LN1a sampai LN3a: tur lebih dulu, lalu panel terbuka sendiri hanya di beranda outlet, dan pesan di halaman", async ({
    page,
  }) => {
    // Tur wizard dimatikan selama setup, lalu saklarnya dikosongkan agar
    // layar yang tampil sendiri berjalan seperti bagi pengguna nyata.
    await page.goto("/login");
    await page.evaluate(() => localStorage.setItem("tachyon.panduan.otomatis", "mati"));
    const { id } = await akunBaru(page, "lonceng-tanpa-produk");
    try {
      await isiTokoDanOwner(page);
      await page.goto("/dashboard/outlet");
      await expect(lonceng(page)).toHaveAccessibleName(/^Pemberitahuan, \d+ baru$/, { timeout: 15_000 });

      await test.step("panel dimatikan saklar e2e, banner dashboard tetap tampil", async () => {
        await page.waitForTimeout(1_000);
        await expect(panel(page)).toHaveCount(0);
        const banner = page.getByRole("status").filter({ hasText: "Toko belum punya produk" });
        await expect(banner).toBeVisible();
        await expect(banner.getByRole("link", { name: "Buat Produk" })).toHaveAttribute(
          "href",
          "/dashboard/outlet/inventaris/produk/buatProduk",
        );
      });

      await test.step("tur panduan yang belum pernah tampil didahulukan; panel tidak bertumpuk", async () => {
        await page.evaluate(() => localStorage.removeItem("tachyon.panduan.otomatis"));
        await page.reload();
        await expect(balonPanduan(page)).toBeVisible({ timeout: 15_000 });
        await expect(panel(page)).toHaveCount(0);
        await balonPanduan(page).getByRole("button", { name: "Lewati panduan" }).click();
        await expect(balonPanduan(page)).toHaveCount(0);
      });

      await test.step("dimuat ulang: panel terbuka sendiri dengan kartu penting dan lencana rose", async () => {
        await page.reload();
        await expect(panel(page)).toBeVisible({ timeout: 15_000 });
        const stok = kartu(page, "stok-produk");
        await expect(stok).toHaveAttribute("data-tingkat", "penting");
        await expect(stok).toContainText("Toko belum punya produk");
        await expect(page.getByTestId("lencana-pemberitahuan")).toHaveAttribute("data-tingkat", "penting");
      });

      await test.step("halaman lain tidak membuka panel sendiri; Buat Penjualan memuat pesan yang sama", async () => {
        await kartu(page, "stok-produk").getByRole("link", { name: "Buat Produk" }).click();
        await page.waitForURL("**/inventaris/produk/buatProduk");
        await expect(panel(page)).toHaveCount(0);
        await page.goto("/dashboard/outlet/penjualan/buatPenjualan");
        await expect(page.getByRole("heading", { name: "Buat Penjualan" })).toBeVisible({ timeout: 15_000 });
        await page.waitForTimeout(1_000);
        await expect(panel(page)).toHaveCount(0);
        await expect(page.getByRole("status").filter({ hasText: "Toko belum punya produk" })).toBeVisible();
      });
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });
});
