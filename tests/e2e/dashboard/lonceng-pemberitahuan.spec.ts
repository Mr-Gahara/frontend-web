import { test, expect, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, kredensialAdmin, wajibAdmin } from "../../helpers/admin-uji";
import { akunBaru, isiTokoDanOwner } from "../../helpers/setup-uji";
import { balonPanduan } from "../../helpers/panduan-uji";
import { loginAplikasi } from "../../helpers/sesi-kasir-uji";
import { PENGGUNA_KASIR_OUTLET, masukBacaSaja, siapkanKasirOutlet } from "../../helpers/terkunci-uji";
import { pengingatLangganan } from "../../../features/langganan/pengingat";
import { pemicuStokProduk } from "../../../features/notifikasi/sumber-stok-produk";
import type { PerangkatMenunggu, RingkasanOutlet } from "../../../features/notifikasi/api";
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
  test(`lonceng ${nama}: lencana sama dengan jumlah kartu, kartu stok produk, produk minimum, dan langganan sesuai data nyata, urut per tingkat, panel di dalam layar`, async ({
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
    // B380: hitungan ringkasan sama dengan daftar produk beserta stok terhitung resepnya.
    expect(ringkasan.data.produk.total, "produk.total ringkasan").toBe(produk.data.length);
    expect(ringkasan.data.produk.dapatDijual, "produk.dapatDijual ringkasan").toBe(
      produk.data.filter((p) => p.isUnlimitedStok === true || (p.stok ?? 0) > 0).length,
    );

    const pengingat = pengingatLangganan(langganan.data, new Date());
    // Tiga sumber dihitung dari respons nyata; sumber lain (inventaris,
    // operasional, staf, penjualan) diuji per sumber di unit test, dan di
    // sini cukup terhitung sama antara lencana dan kartu.
    const harapan: Record<string, boolean> = {
      "stok-produk": pemicuStokProduk(ringkasan.data.produk) !== null,
      langganan: pengingat !== null,
      "produk-minimum": ringkasan.data.produk.stokKritis > 0,
    };

    await expect(lonceng(page)).toBeEnabled();
    // Tunggu seluruh sumber termuat: nama lonceng berhenti berubah.
    await page.waitForLoadState("networkidle");
    await lonceng(page).click();
    await expect(panel(page)).toBeVisible();
    // Panel ringkas: seluruh kartu penting lalu sampai lima kartu; Lihat
    // semua membentangkan sisanya di panel yang sama (LN19a).
    const kartuPanel = panel(page).locator("article[data-pemberitahuan]");
    const lihatSemua = panel(page).getByRole("button", { name: /^Lihat semua/ });
    if ((await lihatSemua.count()) > 0) {
      const ringkas = await kartuPanel.count();
      expect(ringkas, "panel ringkas memuat paling sedikit lima kartu").toBeGreaterThanOrEqual(5);
      const sisa = Number((await lihatSemua.textContent())?.match(/\((\d+) lainnya\)/)?.[1]);
      await lihatSemua.click();
      await expect(kartuPanel).toHaveCount(ringkas + sisa);
      await expect(lihatSemua).toHaveCount(0);
    } else {
      expect(await kartuPanel.count(), "tanpa Lihat semua bila lima kartu atau kurang").toBeLessThanOrEqual(5);
    }
    const jumlah = await kartuPanel.count();
    await expect(lonceng(page)).toHaveAccessibleName(jumlah ? `Pemberitahuan, ${jumlah} baru` : "Pemberitahuan");
    const lencana = page.getByTestId("lencana-pemberitahuan");
    await expect(lencana).toHaveCount(jumlah ? 1 : 0);
    if (jumlah) await expect(lencana).toHaveText(jumlah > 9 ? "9+" : String(jumlah));
    else await expect(panel(page)).toContainText("Belum ada pemberitahuan.");
    for (const [id, ada] of Object.entries(harapan)) await expect(kartu(page, id)).toHaveCount(ada ? 1 : 0);
    if (pengingat) {
      await expect(kartu(page, "langganan")).toContainText(pengingat.judul);
      await expect(kartu(page, "langganan")).toContainText(pengingat.isi);
      await expect(kartu(page, "langganan").getByRole("link", { name: "Lihat langganan" })).toHaveAttribute(
        "href",
        URL_LANGGANAN,
      );
    }
    if (harapan["produk-minimum"]) {
      await expect(kartu(page, "produk-minimum")).toContainText(
        `${ringkasan.data.produk.stokKritis} produk mencapai stok minimum.`,
      );
      await expect(kartu(page, "produk-minimum").getByRole("link", { name: "Lihat produk" })).toHaveAttribute(
        "href",
        "/dashboard/outlet/inventaris/produk?tab=stok-kritis",
      );
    }
    // Urutan per tingkat (LN11a): penting, perlu tindakan, lalu info.
    const tingkat = await panel(page).locator("article[data-pemberitahuan]").evaluateAll((el) =>
      el.map((e) => e.getAttribute("data-tingkat")),
    );
    const urutan = { penting: 0, tindakan: 1, info: 2 } as Record<string, number>;
    expect(tingkat.map((t) => urutan[t ?? ""])).toEqual([...tingkat.map((t) => urutan[t ?? ""])].sort());

    const kotak = await panel(page).boundingBox();
    expect(kotak, "panel tampil").toBeTruthy();
    expect(kotak!.x, "tidak keluar di kiri").toBeGreaterThanOrEqual(0);
    expect(kotak!.x + kotak!.width, "tidak keluar di kanan").toBeLessThanOrEqual(lebar);
    expect(kotak!.y + kotak!.height, "tidak keluar di bawah").toBeLessThanOrEqual(800);

    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
  });
}

/**
 * Perangkat kedua pengguna uji "E2E Kasir Outlet": perangkat pertamanya sudah
 * TRUSTED, sehingga login aplikasi dari perangkat ini menunggu persetujuan
 * (DEVICE_PENDING_APPROVAL). Dicabut lagi di akhir skenario.
 */
const PERANGKAT_PENDING = { installationId: "E2E-KASIR-OUTLET-PENDING-001", nama: "E2E HP Kasir Pending" } as const;
const POLA_PERANGKAT = /\/api\/device\?status=pending$/i;

test.describe("perangkat menunggu izin (PW08, B381)", () => {
  test("kartu perlu tindakan menyebut jumlah dan nama dari respons nyata, tanpa tautan; tanpa update-pengguna tidak diminta", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await login(page);
    await siapkanKasirOutlet(page);
    await loginAplikasi(PENGGUNA_KASIR_OUTLET, PERANGKAT_PENDING);
    const auth = await bukaDenganAuth(page, URL_DASHBOARD);
    try {
      const baca = await api<PerangkatMenunggu[]>(page, auth, "GET", "/device?status=pending");
      expect(baca.status, baca.pesan).toBe(200);
      const daftar = baca.data;
      const milikUji = daftar.find((d) => d.installationId === PERANGKAT_PENDING.installationId);
      expect(milikUji?.pengguna?.nama, "perangkat uji menunggu izin").toBe(PENGGUNA_KASIR_OUTLET.nama);

      const tMinta = page.waitForResponse((r) => POLA_PERANGKAT.test(r.url()));
      await page.reload();
      expect((await tMinta).status(), "lonceng meminta perangkat menunggu dengan token pengguna").toBe(200);
      await page.waitForLoadState("networkidle");
      await lonceng(page).click();
      await expect(panel(page)).toBeVisible();
      const lihatSemua = panel(page).getByRole("button", { name: /^Lihat semua/ });
      if ((await lihatSemua.count()) > 0) await lihatSemua.click();
      const k = kartu(page, "perangkat-menunggu");
      await expect(k).toHaveAttribute("data-tingkat", "tindakan");
      await expect(k).toContainText("Perangkat menunggu izin");
      await expect(k).toContainText(`${daftar.length} perangkat menunggu izin (`);
      await expect(k).toContainText(PENGGUNA_KASIR_OUTLET.nama);
      await expect(k).toContainText("Setujui lewat aplikasi.");
      await expect(k.getByRole("link"), "disetujui lewat aplikasi, tanpa tautan").toHaveCount(0);
    } finally {
      const cabut = await api(page, auth, "POST", "/device/revoke", { installationId: PERANGKAT_PENDING.installationId });
      expect.soft(cabut.status, "cabut perangkat uji: " + cabut.pesan).toBe(200);
    }

    // Tanpa update-pengguna: lonceng tidak meminta daftar perangkat.
    await masukBacaSaja(page);
    // Pencatat dipasang sesudah berpindah pengguna, agar permintaan sesi Owner tidak terhitung.
    let diminta = 0;
    page.on("request", (r) => {
      if (POLA_PERANGKAT.test(r.url())) diminta += 1;
    });
    await page.goto(URL_DASHBOARD);
    await expect(lonceng(page)).toBeEnabled({ timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    expect(diminta, "tanpa update-pengguna tidak meminta perangkat menunggu").toBe(0);
  });
});

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
