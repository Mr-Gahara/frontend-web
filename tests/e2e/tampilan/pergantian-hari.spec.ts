import { expect, test, type Page, type Response } from "@playwright/test";
import { bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { formatHari } from "../../../features/dashboard-gudang/tampilan";
import { keTanggalLokal } from "../../../lib/waktu";

/*
 * Pergantian hari di layar yang dibiarkan menyala melewati 00.00 (keputusan
 * rancangan butir 28; utang pengujian: sebelumnya hanya hook unit dan pola
 * catat beban). page.clock hanya memalsukan jam frontend; tidak ada data
 * yang ditulis.
 */

const POLA_LABA_RUGI = /\/api\/laporan\/laba-rugi(\?|$)/i;

const labaRugi = (syarat: (q: URLSearchParams) => boolean) => (r: Response) =>
  r.request().method() === "GET" && POLA_LABA_RUGI.test(r.url()) && syarat(new URL(r.url()).searchParams);

function sekitarTengahMalam(awalBulan = false) {
  const kini = new Date();
  const tengahMalam = awalBulan
    ? new Date(kini.getFullYear(), kini.getMonth(), 1, 0, 0, 0)
    : new Date(kini.getFullYear(), kini.getMonth(), kini.getDate(), 0, 0, 0);
  const sebelum = new Date(tengahMalam.getTime() - 60_000);
  return { sebelum, tengahMalam };
}

async function mulai(page: Page, waktu: Date) {
  await page.clock.install({ time: waktu });
  await login(page);
}

test("catat pembelian: tanggal bawaan ikut berganti sesudah 00.00", async ({ page }) => {
  const { sebelum, tengahMalam } = sekitarTengahMalam();
  const label = (d: Date) =>
    "Tanggal pembelian, " + d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  await mulai(page, sebelum);
  await bukaDenganAuth(page, "/dashboard/outlet/inventaris/pembelianStok/catatPembelian");
  await expect(page.getByRole("button", { name: label(sebelum) }), "tanggal hari form dibuka").toBeVisible({
    timeout: 20_000,
  });
  await page.clock.runFor(90_000);
  await expect(page.getByRole("button", { name: label(tengahMalam) }), "tanggal ikut berganti").toBeVisible();
});

test("dashboard outlet: Omzet Hari Ini meminta laporan hari yang baru sesudah 00.00", async ({ page }) => {
  const { sebelum, tengahMalam } = sekitarTengahMalam();
  await mulai(page, sebelum);
  const tKemarin = page.waitForResponse(labaRugi((q) => q.get("startDate") === keTanggalLokal(sebelum) && q.get("endDate") === keTanggalLokal(sebelum)));
  await page.goto("/dashboard/outlet");
  expect((await tKemarin).status()).toBe(200);
  const tHariIni = page.waitForResponse(
    labaRugi((q) => q.get("startDate") === keTanggalLokal(tengahMalam) && q.get("endDate") === keTanggalLokal(tengahMalam)),
  );
  await page.clock.runFor(90_000);
  expect((await tHariIni).status(), "laporan hari yang baru").toBe(200);
});

test("dashboard gudang: tanggal di kepala halaman ikut berganti sesudah 00.00", async ({ page }) => {
  const { sebelum, tengahMalam } = sekitarTengahMalam();
  await mulai(page, sebelum);
  await page.goto("/dashboard/gudang");
  // Kepala dashboard gudang: "<nama gudang> · <hari>"; topbar juga menulis tanggal.
  const kepala = (d: Date) => page.getByText(new RegExp(` · ${formatHari(d)}$`));
  await expect(kepala(sebelum)).toBeVisible({ timeout: 20_000 });
  await page.clock.runFor(90_000);
  await expect(kepala(tengahMalam)).toBeVisible();
});

test("kartu ringkasan Keuangan: bulan berjalan berganti sesudah 00.00 tanggal 1", async ({ page }) => {
  const { sebelum, tengahMalam } = sekitarTengahMalam(true);
  const awalBulanLalu = new Date(sebelum.getFullYear(), sebelum.getMonth(), 1);
  await mulai(page, sebelum);
  const tLalu = page.waitForResponse(
    labaRugi((q) => q.get("periode") === "bulanan" && q.get("startDate") === keTanggalLokal(awalBulanLalu)),
  );
  await page.goto("/dashboard/outlet/keuangan/akunkas");
  expect((await tLalu).status()).toBe(200);
  const tBaru = page.waitForResponse(
    labaRugi((q) => q.get("periode") === "bulanan" && q.get("startDate") === keTanggalLokal(tengahMalam)),
  );
  await page.clock.runFor(90_000);
  expect((await tBaru).status(), "bulan yang baru").toBe(200);
});
