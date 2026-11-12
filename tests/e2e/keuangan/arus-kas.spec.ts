import { expect, test, type Page, type Response } from "@playwright/test";
import { JAWAB_GAGAL, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { rincianArusKas } from "../../../features/laporan/arus-kas";
import { formatRupiah } from "../../../lib/format";
import { keTanggalLokal } from "../../../lib/waktu";
import type { BarisArusKas, RingkasanArusKas } from "../../../types/laporan";

/*
 * Halaman arus kas (B291, desain D pemilik proyek 12 November 2026). Angka
 * dibandingkan dengan respons nyata GET /laporan/arus-kas; respons sukses
 * tidak dipalsukan (keputusan rancangan butir 21), hanya jalur gagal. Unduhan
 * dibuktikan lewat event download dan query format yang dikirim.
 */

const URL_ARUS_KAS = "/dashboard/outlet/keuangan/arusKas";
const POLA_ARUS_KAS = /\/api\/laporan\/arus-kas(\?|$)/i;

type ResponsArusKas = { data: BarisArusKas[]; ringkasan: RingkasanArusKas };

/** Rupiah seperti yang ditampilkan halaman; spasi tak-putus diganti spasi biasa. */
const rupiah = (n: number) => formatRupiah(n).replace(/ /g, " ");
const query = (r: Response) => new URL(r.url()).searchParams;
const tungguArusKas = (page: Page, cocok: (q: URLSearchParams) => boolean = () => true) =>
  page.waitForResponse((r) => POLA_ARUS_KAS.test(r.url()) && r.request().method() === "GET" && !query(r).get("format") && cocok(query(r)));

const kartu = (page: Page, judul: string) =>
  page.locator("div").filter({ has: page.getByText(judul, { exact: true }) }).filter({ hasText: "Rp" }).last();

test.describe("Arus kas", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("tab Arus Kas dan Mutasi Kas; filter awal bulan berjalan per hari; angka sesuai respons", async ({ page }) => {
    const tunggu = tungguArusKas(page);
    await bukaDenganAuth(page, URL_ARUS_KAS);
    const res = await tunggu;
    expect(res.status()).toBe(200);

    const sekarang = new Date();
    const q = query(res);
    expect(q.get("startDate")).toBe(keTanggalLokal(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)));
    expect(q.get("endDate")).toBe(keTanggalLokal(sekarang));
    expect(q.get("kelompok")).toBe("hari");
    expect(q.get("akunKasID"), "Semua akun tidak mengirim akunKasID").toBeNull();
    expect(q.get("periode"), "periode tidak dikirim").toBeNull();

    const nav = page.getByRole("navigation", { name: "Navigasi Keuangan" });
    await expect(nav.getByRole("link", { name: "Arus Kas", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Mutasi Kas", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Laporan Arus Kas" })).toBeVisible();

    const isi = (await res.json()) as ResponsArusKas;
    const { ringkasan } = isi;
    await expect(kartu(page, "Saldo awal periode")).toContainText(rupiah(ringkasan.saldoAwalPeriode));
    await expect(kartu(page, "Saldo akhir periode")).toContainText(rupiah(ringkasan.saldoAkhirPeriode));

    const [masuk, keluar] = rincianArusKas(ringkasan, false);
    await expect(page.getByRole("region", { name: "Uang masuk" })).toContainText(rupiah(masuk.total));
    await expect(page.getByRole("region", { name: "Uang keluar" })).toContainText(rupiah(keluar.total));
    expect(masuk.total - keluar.total, "panel cocok dengan arusKasBersih backend").toBe(ringkasan.arusKasBersih);
    await expect(page.getByText("Transfer antar akun tidak dihitung untuk Semua akun", { exact: false })).toBeVisible();

    const daftar = page.getByRole("region", { name: "Per hari" }).getByRole("listitem");
    await expect(daftar).toHaveCount(isi.data.length);
  });

  test("kelompok Minggu dan satu akun kas dikirim ke backend, lalu Reset Filter mengembalikannya", async ({ page }) => {
    const awal = tungguArusKas(page);
    await bukaDenganAuth(page, URL_ARUS_KAS);
    await awal;

    const perMinggu = tungguArusKas(page, (q) => q.get("kelompok") === "minggu");
    await page.getByRole("group", { name: "Kelompokkan per" }).getByRole("button", { name: "Minggu" }).click();
    const resMinggu = await perMinggu;
    expect(resMinggu.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Per minggu" })).toBeVisible();
    const isiMinggu = (await resMinggu.json()) as ResponsArusKas;
    await expect(page.getByRole("region", { name: "Per minggu" }).getByRole("listitem")).toHaveCount(isiMinggu.data.length);

    await page.getByLabel("Akun kas").click();
    const pilihan = page.getByRole("option");
    await expect(pilihan.first()).toBeVisible();
    test.skip((await pilihan.count()) < 2, "Tenant uji tidak punya akun kas untuk dipilih");
    const satuAkun = tungguArusKas(page, (q) => Boolean(q.get("akunKasID")));
    await pilihan.nth(1).click();
    const resAkun = await satuAkun;
    expect(resAkun.status()).toBe(200);
    expect(query(resAkun).get("kelompok"), "kelompok tetap minggu").toBe("minggu");
    await expect(page.getByText("Transfer antar akun tidak dihitung untuk Semua akun", { exact: false })).toHaveCount(0);

    await page.getByRole("button", { name: "Reset Filter" }).click();
    await expect(page.getByRole("heading", { name: "Per hari" })).toBeVisible();
    await expect(page.getByText("Transfer antar akun tidak dihitung untuk Semua akun", { exact: false })).toBeVisible();
  });

  test("Unduh laporan: menu PDF, Excel, dan CSV mengunduh berkas backend dengan filter yang sama", async ({ page }) => {
    const awal = tungguArusKas(page);
    await bukaDenganAuth(page, URL_ARUS_KAS);
    const q = query(await awal);
    const akhiran = `${q.get("startDate")}_${q.get("endDate")}`;

    for (const [label, format, ekstensi] of [
      ["PDF", "pdf", "pdf"],
      ["Excel", "xlsx", "xlsx"],
      ["CSV", "csv", "csv"],
    ] as const) {
      const permintaan = page.waitForResponse((r) => POLA_ARUS_KAS.test(r.url()) && query(r).get("format") === format);
      const unduhan = page.waitForEvent("download");
      await page.getByRole("button", { name: "Unduh laporan" }).click();
      await page.getByRole("menuitem", { name: label, exact: true }).click();
      const res = await permintaan;
      expect(res.status(), `unduhan ${label}`).toBe(200);
      expect(query(res).get("startDate")).toBe(q.get("startDate"));
      expect(query(res).get("kelompok")).toBe("hari");
      expect((await unduhan).suggestedFilename()).toBe(`arus-kas_${akhiran}.${ekstensi}`);
    }
  });

  test("laporan gagal dimuat menampilkan pesan backend", async ({ page }) => {
    await page.route(POLA_ARUS_KAS, (route) => route.fulfill(JAWAB_GAGAL));
    await bukaDenganAuth(page, URL_ARUS_KAS);
    await expect(page.getByRole("alert").filter({ hasText: "uji" })).toBeVisible();
  });
});
