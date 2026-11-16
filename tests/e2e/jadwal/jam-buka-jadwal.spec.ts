import { test, expect, type Page } from "@playwright/test";
import { api, BASIS, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { cocok } from "../../helpers/reservasi-uji";
import {
  bulanUji,
  NAMA_PENGGUNA,
  NAMA_POLA,
  pilihTanggalKalender,
  POLA_BULK_JADWAL,
  siapkanFixtureJadwal,
  URL_GENERATE_OUTLET,
  URL_JADWAL_GUDANG,
  URL_JADWAL_OUTLET,
  type BulanUji,
} from "../../helpers/jadwal-uji";

/*
 * Jam buka toko di shift dan jadwal ruang outlet (JO1a, JO2a; desain A kanvas
 * "Jam Buka di Shift dan Jadwal", pemilik proyek 16 November 2026). Jam toko
 * uji diatur lewat API di awal setiap skenario dan dikembalikan ke nilai asal
 * di akhir, karena jamOperasional ikut dibaca booking dan spec generate lain.
 */

test.use({ timezoneId: "Asia/Pontianak" });

type HariMentah = { status: string; jamBuka: string | null; jamTutup: string | null };
const buka = (): HariMentah => ({ status: "buka", jamBuka: "08:00", jamTutup: "22:00" });
const libur = (): HariMentah => ({ status: "libur", jamBuka: null, jamTutup: null });
const indeksHari = (d: Date) => (d.getDay() + 6) % 7;

/** Jam toko uji: semua hari 08.00 sampai 22.00, kecuali indeks yang disebut Libur. */
function jamUji(liburIndeks: number[]) {
  return { mode: "tertentu", hari: Array.from({ length: 7 }, (_, i) => (liburIndeks.includes(i) ? libur() : buka())) };
}

async function denganJamToko(page: Page, auth: Auth, jam: unknown, isi: () => Promise<void>) {
  const lokasi = await api<{ tenantID: string }>(page, auth, "GET", "/location/current");
  const tenantID = lokasi.data.tenantID;
  const asal = (await api<{ jamOperasional: unknown }>(page, auth, "GET", "/tenant/" + tenantID)).data.jamOperasional ?? null;
  const atur = await api(page, auth, "PUT", "/tenant/" + tenantID, { jamOperasional: jam });
  expect(atur.status, "jam toko uji: " + atur.pesan).toBe(200);
  try {
    await isi();
  } finally {
    const r = await api(page, auth, "PUT", "/tenant/" + tenantID, { jamOperasional: asal });
    expect.soft(r.status, "jam toko dikembalikan: " + r.pesan).toBe(200);
  }
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("form shift outlet: peringatan karamel bila shift lewat jam tutup, gudang tanpa peringatan (JO1a)", async ({
  page,
}) => {
  const auth = await bukaDenganAuth(page, BASIS + "/dashboard/outlet/shift");
  await denganJamToko(page, auth, jamUji([6]), async () => {
    for (const [ruang, judul] of [
      ["outlet", /master shift outlet/i],
      ["gudang", /master shift gudang/i],
    ] as const) {
      await page.goto(`${BASIS}/dashboard/${ruang}/shift`);
      await expect(page.getByRole("heading", { name: judul })).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: /tambah master shift/i }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Jam Masuk (jam)").fill("18");
      await dialog.getByLabel("Jam Masuk (menit)").fill("00");
      await dialog.getByLabel("Jam Pulang (jam)").fill("23");
      await dialog.getByLabel("Jam Pulang (menit)").fill("00");
      const peringatan = dialog.getByRole("status").filter({ hasText: "Shift ini melewati jam tutup toko" });
      if (ruang === "outlet") {
        await expect(peringatan).toBeVisible({ timeout: 15_000 });
        await expect(peringatan).toContainText(
          "Toko tutup pukul 22.00 pada Senin sampai Sabtu, sedangkan shift pulang 23.00.",
        );
        await expect(peringatan).toContainText("Shift tetap bisa disimpan.");
        // Di dalam jam buka: peringatan hilang.
        await dialog.getByLabel("Jam Pulang (jam)").fill("21");
        await expect(peringatan).toHaveCount(0);
      } else {
        await expect(dialog.getByText("Shift tetap bisa disimpan.")).toHaveCount(0);
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
    }
  });
});

test("kalender outlet: kolom hari libur toko berlabel Toko libur, gudang tidak (JO2a)", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const hariIni = new Date();
  await denganJamToko(page, auth, jamUji([indeksHari(hariIni)]), async () => {
    await page.goto(URL_JADWAL_OUTLET);
    const label = page.getByRole("columnheader").filter({ hasText: "Toko libur" });
    await expect(label.first()).toBeVisible({ timeout: 20_000 });
    // Satu hari dalam seminggu: empat atau lima kolom sebulan.
    expect(await label.count()).toBeGreaterThanOrEqual(4);
    await expect(label.first()).toHaveClass(/arsir-libur/);
    await page.goto(URL_JADWAL_GUDANG);
    await expect(page.getByRole("columnheader").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Toko libur", { exact: true })).toHaveCount(0);
  });
});

async function pilihTanggalBerlabel(page: Page, labelTeks: string, b: BulanUji, hari: number) {
  await page.getByText(labelTeks, { exact: true }).locator("xpath=..").getByRole("button").click();
  await pilihTanggalKalender(page, b.selisih, hari);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("grid")).toHaveCount(0);
}

test("pratinjau generate outlet: tanggal libur toko dilewati dan tidak dikirim (JO2a)", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_GENERATE_OUTLET);
  await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const libur21 = new Date(b.tahun, b.bulan, 21);
  await denganJamToko(page, auth, jamUji([indeksHari(libur21)]), async () => {
    await page.goto(URL_GENERATE_OUTLET);
    await page.getByRole("combobox").filter({ hasText: "Pilih pola yang sudah dibuat..." }).click();
    await page.getByPlaceholder("Cari pola roster...").fill(NAMA_POLA);
    await page.getByRole("option", { name: new RegExp(NAMA_POLA) }).click();
    await pilihTanggalBerlabel(page, "Mulai Tanggal", b, 20);
    await pilihTanggalBerlabel(page, "Sampai Tanggal", b, 22);
    await page.getByRole("main").getByText(NAMA_PENGGUNA, { exact: true }).click();
    await page.getByRole("button", { name: "Lanjut Pratinjau" }).click();
    await expect(page.getByText("Langkah 2: Pratinjau Jadwal")).toBeVisible();

    await expect(page.getByText("Hari Dilewati", { exact: true })).toBeVisible();
    await expect(page.getByText(/^1 hari, toko libur \(/)).toBeVisible();
    await expect(page.getByText("Dilewati", { exact: true })).toHaveCount(1);

    // Permintaan simpan ditahan dan diperiksa isinya tanpa diteruskan: tanggal
    // libur tidak ikut dikirim (keputusan rancangan butir 21: jalur gagal).
    let tanggal: string[] = [];
    await page.route(POLA_BULK_JADWAL, async (route) => {
      tanggal = (route.request().postDataJSON() as { tanggalKerja: string }[]).map((j) => j.tanggalKerja);
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "uji" }) });
    });
    const tBulk = page.waitForResponse(cocok("POST", POLA_BULK_JADWAL));
    await page.getByRole("button", { name: /Simpan & Terapkan Jadwal/ }).click();
    await tBulk;
    await page.unroute(POLA_BULK_JADWAL);
    const pad = (n: number) => String(n).padStart(2, "0");
    const t = (h: number) => `${b.tahun}-${pad(b.bulan + 1)}-${pad(h)}`;
    expect(tanggal).toEqual([t(20), t(22)]);
  });
});
