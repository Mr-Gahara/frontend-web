import { expect, test, type Page, type Response } from "@playwright/test";
import { BASIS, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { tanpaLuberWadah } from "../../helpers/tata-letak-uji";
import { formatAngka } from "../../../lib/format";
import { geserBulan, keBulan } from "../../../lib/unduh";
import type { RekapAbsensiResponse } from "../../../types/absensi";

/*
 * Laman Rekap Absensi ruang outlet (desain D kanvas "Rekap Absensi"; pemilik
 * proyek, 23 November 2026; backend B358, P86). Angka dibandingkan dengan
 * respons nyata GET /absensi/rekap yang dibaca ulang lewat API (keputusan
 * rancangan butir 21 dan 23).
 */

const URL_HALAMAN = "/dashboard/outlet/rekap-absensi";
const POLA = /\/api\/absensi\/rekap(\?|$)/i;
const query = (r: Response) => new URL(r.url()).searchParams;
const tungguRekap = (page: Page, bulan: string) =>
  page.waitForResponse((r) => POLA.test(r.url()) && query(r).get("bulan") === bulan && !query(r).has("format"));

async function bacaRekap(page: Page, auth: () => string, bulan: string, locationID: string): Promise<RekapAbsensiResponse> {
  const res = await page.request.get(`${BASIS}/api/absensi/rekap`, {
    params: { bulan, locationID },
    headers: { Authorization: auth() },
  });
  expect(res.status()).toBe(200);
  return ((await res.json()) as { data: RekapAbsensiResponse }).data;
}

/*
 * Sejak backend B379 (butir 194) rekap per lokasi hanya memuat staf yang
 * berjadwal, absen, atau izin disetujui pada bulan itu, sehingga bulan
 * berjalan boleh kosong. Skenario tabel dan daftar memilih bulan terbaru
 * yang berisi staf, dan keadaan kosong memilih bulan terbaru tanpa staf,
 * keduanya dari respons nyata, lalu membukanya lewat tombol Bulan sebelumnya.
 */
async function cariBulan(
  page: Page,
  auth: () => string,
  locationID: string,
  cocok: (r: RekapAbsensiResponse) => boolean,
  batas: number,
): Promise<{ mundur: number; bulan: string; rekap: RekapAbsensiResponse } | null> {
  for (let mundur = 0; mundur <= batas; mundur++) {
    const bulan = keBulan(geserBulan(new Date(), -mundur));
    const rekap = await bacaRekap(page, auth, bulan, locationID);
    if (cocok(rekap)) return { mundur, bulan, rekap };
  }
  return null;
}
const bulanBerdata = (page: Page, auth: () => string, locationID: string) =>
  cariBulan(page, auth, locationID, (r) => r.data.length > 0, 12);
const bulanKosong = (page: Page, auth: () => string, locationID: string) =>
  cariBulan(page, auth, locationID, (r) => r.data.length === 0, 36);

async function mundurKe(page: Page, tujuan: { mundur: number; bulan: string }) {
  if (tujuan.mundur === 0) return;
  const t = tungguRekap(page, tujuan.bulan);
  for (let i = 0; i < tujuan.mundur; i++) {
    await page.getByRole("button", { name: "Bulan sebelumnya" }).click();
  }
  expect((await t).status()).toBe(200);
}

test.describe("Rekap Absensi", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("menu Manajemen Shift; bulan berjalan per lokasi outlet; kartu dan tabel sesuai respons", async ({ page }) => {
    const bulan = keBulan(new Date());
    const t = tungguRekap(page, bulan);
    const auth = await bukaDenganAuth(page, URL_HALAMAN);
    const res = await t;
    expect(res.status()).toBe(200);
    const locationID = query(res).get("locationID");
    expect(locationID, "rekap per lokasi outlet (butir 29)").toBeTruthy();
    // Item menu sidebar berupa tombol di grup Manajemen Shift, sesudah Master Shift.
    await expect(page.getByRole("button", { name: "Rekap Absensi", exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "Bulan rekap" })).toContainText(/november|desember|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober/i);
    await expect(page.getByRole("button", { name: "Bulan berikutnya" })).toBeDisabled();

    const rekap = await bacaRekap(page, auth, bulan, locationID!);
    const ringkasan = page.getByRole("region", { name: "Ringkasan rekap" });
    await expect(ringkasan).toContainText(formatAngka(rekap.ringkasan.totalStaf));
    await expect(ringkasan).toContainText(`dari ${formatAngka(rekap.ringkasan.shiftDijadwalkan ?? 0)} shift terjadwal`);

    const berdata = await bulanBerdata(page, auth, locationID!);
    test.skip(!berdata, "Tidak ada staf berkegiatan dalam 12 bulan terakhir");
    await mundurKe(page, berdata!);
    const isi = berdata!.rekap;
    await expect(ringkasan).toContainText(formatAngka(isi.ringkasan.totalStaf));

    // Desktop: tabel tujuh kolom, satu baris per staf, ditambah TOTAL di kaki.
    const tabel = page.getByRole("table");
    await expect(tabel.getByRole("columnheader")).toHaveCount(7);
    for (const s of isi.data.slice(0, 5)) {
      const baris = tabel.getByRole("row").filter({ hasText: s.nama });
      await expect(baris.first()).toContainText(`${s.hariHadir} dari ${s.shiftDijadwalkan} shift`);
      await expect(baris.first()).toContainText(`${s.shiftTidakHadir} shift`);
    }
    await expect(tabel.getByRole("row").filter({ hasText: `TOTAL · ${isi.ringkasan.totalStaf} staf` })).toBeVisible();
    await expect(page.getByRole("list", { name: "Rekap per staf" })).toBeHidden();
  });

  for (const [status, harap] of [
    [403, "Anda tidak memiliki izin melihat rekap absensi."],
    [500, "Rekap uji gagal dimuat"],
  ] as const) {
    test(`rekap dijawab ${status}: pesan tampil, bukan ringkasan maupun keadaan kosong`, async ({ page }) => {
      await page.goto(BASIS + URL_HALAMAN, { waitUntil: "commit" });
      await page.route(POLA, (route) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify({ status: "error", message: status === 403 ? "Akses ditolak" : "Rekap uji gagal dimuat" }),
        }),
      );
      await page.reload({ waitUntil: "commit" });
      const pesan = page.getByRole("alert").filter({ hasText: harap });
      await expect(pesan).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole("region", { name: "Ringkasan rekap" })).toHaveCount(0);
      await expect(page.getByText("Belum ada data bulan ini")).toHaveCount(0);
    });
  }

  test("bulan tanpa jadwal, absen, maupun izin tidak memuat staf berlokasi kerja (B379, butir 194)", async ({ page }) => {
    const t0 = tungguRekap(page, keBulan(new Date()));
    const auth = await bukaDenganAuth(page, URL_HALAMAN);
    const locationID = query(await t0).get("locationID")!;
    // Bulan jauh sebelum toko uji punya kegiatan: staf berlokasi kerja di
    // outlet ini (E2E Kasir Outlet) tidak lagi dimuat, dan ringkasan ikut 0.
    const rekap = await bacaRekap(page, auth, "2019-01", locationID);
    expect(rekap.data).toEqual([]);
    expect(rekap.ringkasan.totalStaf).toBe(0);
  });

  test("bulan tanpa staf menampilkan keadaan kosong beserta syarat staf tampil", async ({ page }) => {
    const t0 = tungguRekap(page, keBulan(new Date()));
    const auth = await bukaDenganAuth(page, URL_HALAMAN);
    const locationID = query(await t0).get("locationID")!;
    const kosong = await bulanKosong(page, auth, locationID);
    expect(kosong, "bulan tanpa staf dalam 36 bulan terakhir").not.toBeNull();
    await mundurKe(page, kosong!);
    await expect(page.getByText("Belum ada data bulan ini")).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText("Staf tampil di sini bila punya jadwal kerja, absen, atau izin cuti pada bulan yang dipilih."),
    ).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("bulan sebelumnya mengirim bulan itu", async ({ page }) => {
    const t0 = tungguRekap(page, keBulan(new Date()));
    await bukaDenganAuth(page, URL_HALAMAN);
    await t0;
    const lalu = keBulan(geserBulan(new Date(), -1));
    const t = tungguRekap(page, lalu);
    await page.getByRole("button", { name: "Bulan sebelumnya" }).click();
    expect((await t).status()).toBe(200);
    await expect(page.getByRole("button", { name: "Bulan berikutnya" })).toBeEnabled();
  });

  test("Unduh Excel dan CSV mengirim bulan dan lokasi yang tampil (B358)", async ({ page }) => {
    const bulan = keBulan(new Date());
    const t0 = tungguRekap(page, bulan);
    await bukaDenganAuth(page, URL_HALAMAN);
    const lokasi = query(await t0).get("locationID");
    for (const [label, format, tipe] of [
      ["Excel", "xlsx", /spreadsheetml/],
      ["CSV", "csv", /text\/csv/],
    ] as const) {
      const tRes = page.waitForResponse((r) => POLA.test(r.url()) && query(r).get("format") === format);
      const tBerkas = page.waitForEvent("download");
      await page.getByRole("button", { name: "Unduh", exact: true }).click();
      await page.getByRole("menuitem", { name: label, exact: true }).click();
      const res = await tRes;
      expect(res.status()).toBe(200);
      expect(query(res).get("bulan")).toBe(bulan);
      expect(query(res).get("locationID")).toBe(lokasi);
      expect(res.headers()["content-type"]).toMatch(tipe);
      expect((await tBerkas).suggestedFilename()).toBe(`rekap-absensi_${bulan}.${format}`);
    }
  });

  test("HP 390 px: daftar per staf, baris dibuka untuk rincian empat kelompok", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const bulan = keBulan(new Date());
    const t = tungguRekap(page, bulan);
    const auth = await bukaDenganAuth(page, URL_HALAMAN);
    const res = await t;
    const berdata = await bulanBerdata(page, auth, query(res).get("locationID")!);
    test.skip(!berdata, "Tidak ada staf berkegiatan dalam 12 bulan terakhir");
    await mundurKe(page, berdata!);
    const rekap = berdata!.rekap;

    await expect(page.getByRole("table")).toBeHidden();
    const daftar = page.getByRole("list", { name: "Rekap per staf" });
    await expect(daftar.getByRole("listitem")).toHaveCount(rekap.data.length + 1);
    const pertama = daftar.getByRole("button", { name: new RegExp(rekap.data[0].nama) });
    await expect(pertama).toHaveAttribute("aria-expanded", "false");
    await pertama.click();
    await expect(pertama).toHaveAttribute("aria-expanded", "true");
    const item = daftar.getByRole("listitem").first();
    for (const judul of ["Kehadiran", "Ketepatan", "Izin dan cuti (hari)", "Jam kerja"]) {
      await expect(item.getByText(judul, { exact: true })).toBeVisible();
    }
    await expect(item.getByText("Menit pulang awal")).toBeVisible();
    await tanpaLuberWadah(page, "rekap absensi 390 px, rincian terbuka");
  });

  for (const lebar of [768, 1024, 1280]) {
    test(`tanpa luberan di ${lebar} px`, async ({ page }) => {
      await page.setViewportSize({ width: lebar, height: 900 });
      const t = tungguRekap(page, keBulan(new Date()));
      const auth = await bukaDenganAuth(page, URL_HALAMAN);
      const berdata = await bulanBerdata(page, auth, query(await t).get("locationID")!);
      if (berdata) await mundurKe(page, berdata);
      await expect(page.getByRole("region", { name: "Ringkasan rekap" })).toBeVisible();
      await tanpaLuberWadah(page, `rekap absensi ${lebar} px`);
    });
  }
});
