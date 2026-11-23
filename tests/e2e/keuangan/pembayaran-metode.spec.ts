import { expect, test, type Page, type Response } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { tanpaLuberWadah } from "../../helpers/tata-letak-uji";
import { formatPersen, rentangMetode, susunMetode } from "../../../features/laporan/pembayaran-metode";
import { formatRupiah } from "../../../lib/format";
import { keTanggalLokal } from "../../../lib/waktu";
import type { PembayaranPerMetode } from "../../../types/laporan";

/*
 * Laman Pembayaran per Metode (desain B, OM2a; pemilik proyek, 17 November
 * 2026). Angka dibandingkan dengan respons nyata GET
 * /laporan/pembayaran-per-metode (B353; sebelumnya ringkasan laba rugi,
 * B329); respons sukses tidak dipalsukan (keputusan rancangan butir 21),
 * hanya jalur gagal. Penunggu memilih permintaan menurut rentangnya.
 */

const URL_HALAMAN = "/dashboard/outlet/keuangan/pembayaranMetode";
const POLA = /\/api\/laporan\/pembayaran-per-metode(\?|$)/i;

const rupiah = (n: number) => formatRupiah(n).replace(/ /g, " ");
const query = (r: Response) => new URL(r.url()).searchParams;
// periode tidak dipakai endpoint ini (B353), sehingga tidak dikirim.
const tunggu = (page: Page, startDate: string, endDate: string) =>
  page.waitForResponse(
    (r) =>
      POLA.test(r.url()) &&
      r.request().method() === "GET" &&
      !query(r).has("format") &&
      query(r).get("startDate") === startDate &&
      query(r).get("endDate") === endDate &&
      !query(r).has("periode"),
  );
type Rentang = { periode: string; startDate: string; endDate: string };

/**
 * Bukti angka dibaca ulang lewat API dengan token sesi yang sama (keputusan
 * rancangan butir 23), bukan dari isi respons halaman: isinya sesekali sudah
 * dibuang browser saat dibaca (No resource with given identifier found).
 */
async function bacaMetode(page: Page, auth: () => string, r: Rentang): Promise<PembayaranPerMetode[]> {
  const res = await page.request.get(`${BASIS}/api/laporan/pembayaran-per-metode`, {
    params: { startDate: r.startDate, endDate: r.endDate },
    headers: { Authorization: auth() },
  });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { data?: PembayaranPerMetode[] };
  return body.data ?? [];
}

const kartu = (page: Page) => page.getByRole("region", { name: "Pembayaran per Metode" });
const tombolPeriode = (page: Page, nama: string) => kartu(page).getByRole("button", { name: nama, exact: true });

test.describe("Pembayaran per Metode", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("sub-menu Laporan; Bulan Ini bawaan; total, legenda, cincin, dan rincian sesuai respons", async ({ page }) => {
    const r = rentangMetode("bulan", new Date()).rentang!;
    const t = tunggu(page, r.startDate, r.endDate);
    const auth = await bukaDenganAuth(page, URL_HALAMAN);
    const res = await t;
    expect(res.status()).toBe(200);

    await expect(page.getByRole("link", { name: "Pembayaran per Metode", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(tombolPeriode(page, "Bulan Ini")).toHaveAttribute("aria-pressed", "true");

    const ringkas = susunMetode(await bacaMetode(page, auth, r));
    await expect(kartu(page)).toContainText(rupiah(ringkas.total));
    await expect(kartu(page)).toContainText(`diterima dari ${ringkas.jumlahPembayaran} pembayaran`);
    test.skip(ringkas.baris.length === 0, "Belum ada pembayaran bulan ini");

    for (const b of ringkas.baris) {
      const legenda = kartu(page).getByRole("listitem").filter({ hasText: b.nama });
      await expect(legenda).toContainText(formatPersen(b.persen));
      await expect(legenda).toContainText(rupiah(b.jumlah));
    }
    await expect(kartu(page).getByRole("img", { name: /^Porsi: / })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Rincian metode" })).toBeVisible();
    for (const b of ringkas.baris) {
      const sel = page.getByRole("row").filter({ hasText: b.nama }).getByRole("cell");
      await expect(sel.nth(1)).toHaveText(String(b.jumlahPembayaran), { useInnerText: true });
      await expect(sel.nth(2)).toHaveText(rupiah(b.jumlah), { useInnerText: true });
      await expect(sel.nth(3)).toHaveText(formatPersen(b.persen), { useInnerText: true });
    }
    await expect(page.getByText(/bukan pembagian omzet/)).toBeVisible();
  });

  test("Hari Ini dan Minggu Ini mengirim rentangnya; Pilih tanggal mengisi awal bulan sampai hari ini lalu mengirim tanggal pilihan", async ({
    page,
  }) => {
    const sekarang = new Date();
    const bulan = rentangMetode("bulan", sekarang).rentang!;
    const t0 = tunggu(page, bulan.startDate, bulan.endDate);
    await bukaDenganAuth(page, URL_HALAMAN);
    await t0;

    const hari = rentangMetode("hari", sekarang).rentang!;
    const tHari = tunggu(page, hari.startDate, hari.endDate);
    await tombolPeriode(page, "Hari Ini").click();
    expect((await tHari).status()).toBe(200);

    const minggu = rentangMetode("minggu", sekarang).rentang!;
    const tMinggu = tunggu(page, minggu.startDate, minggu.endDate);
    await tombolPeriode(page, "Minggu Ini").click();
    expect((await tMinggu).status()).toBe(200);

    await tombolPeriode(page, "Pilih tanggal").click();
    const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
    const dari = kartu(page).getByRole("button", { name: /^Dari, / });
    await expect(dari).toHaveAccessibleName(`Dari, ${String(awalBulan.getDate()).padStart(2, "0")} ${awalBulan.toLocaleDateString("id-ID", { month: "long" })} ${awalBulan.getFullYear()}`);
    await expect(kartu(page).getByRole("button", { name: /^Sampai, / })).toBeVisible();

    // Dari tanggal 1 bulan lalu: rentang lintas bulan sampai hari ini.
    const awalBulanLalu = new Date(sekarang.getFullYear(), sekarang.getMonth() - 1, 1);
    const tPilih = tunggu(page, keTanggalLokal(awalBulanLalu), keTanggalLokal(sekarang));
    await dari.click();
    await page.getByRole("button", { name: /previous month/i }).click();
    await page
      .getByRole("grid")
      .locator(`button[data-day="${awalBulanLalu.getMonth() + 1}/1/${awalBulanLalu.getFullYear()}"]`)
      .click();
    expect((await tPilih).status()).toBe(200);
  });

  test("gagal memuat tampil sebagai pesan, bukan Rp 0", async ({ page }) => {
    await bukaDenganAuth(page, URL_HALAMAN);
    await expect(kartu(page)).toBeVisible({ timeout: 15_000 });
    await page.route(POLA, (route) => route.fulfill(JAWAB_GAGAL));
    try {
      await tombolPeriode(page, "Hari Ini").click();
      await expect(kartu(page).getByText("Gagal memuat data laporan.")).toBeVisible({ timeout: 15_000 });
      await expect(kartu(page).getByText(/^Rp/)).toHaveCount(0);
    } finally {
      await page.unroute(POLA);
    }
  });

  test("HP 390 px: tanpa luberan, dan rincian tampil sebagai kartu berlabel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = rentangMetode("bulan", new Date()).rentang!;
    const t = tunggu(page, r.startDate, r.endDate);
    const auth = await bukaDenganAuth(page, URL_HALAMAN);
    expect((await t).status()).toBe(200);
    const ringkas = susunMetode(await bacaMetode(page, auth, r));
    await expect(kartu(page)).toContainText(rupiah(ringkas.total));
    await tanpaLuberWadah(page, "pembayaran per metode 390 px");
    test.skip(ringkas.baris.length === 0, "Belum ada pembayaran bulan ini");
    await expect(page.getByRole("columnheader", { name: "Diterima" })).toBeHidden();
    await expect(page.getByRole("row").filter({ hasText: ringkas.baris[0].nama }).getByText("Diterima", { exact: true })).toBeVisible();
  });

  test("Unduh laporan mengirim rentang yang tampil dengan format pilihan (B353, P85)", async ({ page }) => {
    const r = rentangMetode("bulan", new Date()).rentang!;
    const t = tunggu(page, r.startDate, r.endDate);
    await bukaDenganAuth(page, URL_HALAMAN);
    await t;
    for (const [label, format, tipe] of [
      ["CSV", "csv", /text\/csv/],
      ["PDF", "pdf", /application\/pdf/],
    ] as const) {
      const tUnduh = page.waitForResponse((res) => POLA.test(res.url()) && query(res).get("format") === format);
      const tBerkas = page.waitForEvent("download");
      await kartu(page).getByRole("button", { name: "Unduh laporan" }).click();
      await page.getByRole("menuitem", { name: label, exact: true }).click();
      const res = await tUnduh;
      expect(res.status()).toBe(200);
      expect(query(res).get("startDate")).toBe(r.startDate);
      expect(query(res).get("endDate")).toBe(r.endDate);
      expect(res.headers()["content-type"]).toMatch(tipe);
      expect((await tBerkas).suggestedFilename()).toMatch(new RegExp(`\\.${format}$`));
    }
  });
});
