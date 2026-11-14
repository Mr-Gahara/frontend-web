import { expect, test, type Page } from "@playwright/test";
import { bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { daftarAkun, pilihAkun, type AkunKasUji } from "../../helpers/akun-kas-uji";
import { KATEGORI_FIXTURE, pastikanKategoriFixture } from "../../helpers/beban-uji";
import {
  masukAkunBukanOwner,
  masukPencatatBeban,
  masukTanpaLokasi,
  masukTanpaSdm,
} from "../../helpers/terkunci-uji";

/*
 * Jalur bukan-Owner yang sebelumnya hanya teruji di unit test (utang
 * pengujian; pemilik proyek, 14 November 2026, mengizinkan peran dan
 * pengguna uji menetap). Peran uji berlevel 90 dan izinnya diturunkan dari
 * izin Owner (tests/helpers/terkunci-uji.ts). Tidak ada data yang ditulis:
 * simpan beban dijawab gagal oleh route.fulfill (keputusan rancangan butir
 * 21) agar payloadnya terbaca tanpa beban baru.
 */

const ditolak = (page: Page) => expect(page.getByRole("heading", { name: "Akses ditolak" })).toBeVisible({ timeout: 15_000 });

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("pemegang update-akun yang bukan Owner tidak melihat kartu Akun Toko dan ditolak di halamannya", async ({ page }) => {
  await masukAkunBukanOwner(page);
  await page.goto("/dashboard/outlet/pengaturan");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /Akun Toko/ })).toHaveCount(0);
  await page.goto("/dashboard/outlet/pengaturan/akun");
  await ditolak(page);
});

test("pencatat beban bukan Owner: tanggal terkunci hari ini dan payload memakai waktu simpan", async ({ page }) => {
  const auth = await bukaDenganAuth(page, "/dashboard/outlet/pengeluaran");
  await pastikanKategoriFixture(page, auth);
  const sumber = (await daftarAkun(page, auth)).find(
    (a) => a.status === "aktif" && a.saldo >= 1 && !a.namaAkun.startsWith("E2E"),
  );
  test.skip(!sumber, "tidak ada akun kas aktif bersaldo");

  await masukPencatatBeban(page);
  await page.goto("/dashboard/outlet/pengeluaran/catatBeban");
  const utama = page.getByRole("main");
  await expect(utama.getByText("Hanya Owner yang dapat mencatat beban bertanggal lampau.")).toBeVisible({
    timeout: 15_000,
  });
  await expect(utama.getByText(/^Hari ini, /)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Tanggal Beban,/ }), "tanpa pemilih tanggal").toHaveCount(0);

  await pilihAkun(page, "Akun Kas", (sumber as AkunKasUji).namaAkun);
  await pilihAkun(page, "Kategori", KATEGORI_FIXTURE);
  await page.getByLabel("Jumlah (Rp)").fill("1");
  await page.getByLabel("Keterangan", { exact: true }).fill("E2E beban bukan Owner");

  const pola = /\/api\/bebanoperasional(\?|$)/i;
  await page.route(pola, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ status: "error", message: "E2E beban ditahan" }),
        })
      : route.continue(),
  );
  try {
    const sebelum = Date.now();
    const tBuat = page.waitForRequest((r) => r.method() === "POST" && pola.test(r.url()));
    await page.getByRole("button", { name: "Simpan Beban" }).click();
    const kiriman = (await tBuat).postDataJSON() as { tanggal: string };
    const waktu = new Date(kiriman.tanggal).getTime();
    expect(waktu, "waktu simpan, bukan tanggal pilihan").toBeGreaterThanOrEqual(sebelum - 60_000);
    expect(waktu).toBeLessThanOrEqual(Date.now() + 60_000);
  } finally {
    await page.unroute(pola);
  }
});

test("tanpa read-location: Status Staf tidak dipasang, absensi dan lokasi Profil Toko menampilkan pesan izin, dan daftar penjualan tanpa cakupan", async ({
  page,
}) => {
  await masukTanpaLokasi(page);

  await page.goto("/dashboard/outlet");
  await expect(page.getByRole("region", { name: "Omzet Hari Ini" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel("Status Staf"), "panel Status Staf menuntut read-location").toHaveCount(0);

  await page.goto("/dashboard/outlet/pengguna");
  await expect(
    page.getByText("Anda tidak memiliki izin melihat lokasi ruang, sehingga absensi staf tidak dapat dimuat."),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto("/dashboard/outlet/pengaturan/toko");
  await expect(page.getByText("Anda tidak memiliki izin melihat lokasi outlet.")).toBeVisible({ timeout: 15_000 });

  const tDaftar = page.waitForResponse(
    (r) => r.request().method() === "GET" && /\/api\/penjualan\?/i.test(r.url()),
  );
  await page.goto("/dashboard/outlet/penjualan");
  const daftar = await tDaftar;
  expect(daftar.status()).toBe(200);
  expect(new URL(daftar.url()).searchParams.has("locationID"), "tanpa cakupan lokasi (K11b)").toBe(false);
  await expect(page.getByText("Filter Lokasi", { exact: true })).toHaveCount(0);
});

test("tanpa izin baca shift, pola roster, dan jadwal: menunya tidak tampil dan halamannya ditolak", async ({ page }) => {
  await masukTanpaSdm(page);
  await page.goto("/dashboard/outlet");
  const sidebar = page.locator("[data-sidebar=sidebar]").first();
  await expect(sidebar.getByText("Dashboard", { exact: true })).toBeVisible({ timeout: 15_000 });
  for (const menu of ["Kalender Jadwal", "Pola Roster", "Master Shift"]) {
    await expect(sidebar.getByText(menu, { exact: true }), menu).toHaveCount(0);
  }
  for (const rute of ["/dashboard/outlet/jadwal", "/dashboard/outlet/pola-roster", "/dashboard/outlet/shift"]) {
    await page.goto(rute);
    await ditolak(page);
  }
});
