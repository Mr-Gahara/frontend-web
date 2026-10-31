import { test, expect, type Page } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, login } from "../../helpers/transfer-uji";
import { cocok } from "../../helpers/reservasi-uji";

/*
 * Spec widget absensi di halaman pengguna outlet (submodul monitoring
 * absensi, keputusan AB3a dan AB5a, serta B183). Angka dibandingkan dengan
 * respons nyata GET /absensi/monitoring per lokasi outlet; route.fulfill
 * hanya menyimulasikan kegagalan (keputusan rancangan butir 21).
 */

test.use({ timezoneId: "Asia/Pontianak" });

const URL_PENGGUNA = BASIS + "/dashboard/outlet/pengguna";
const POLA_MONITORING = /\/api\/absensi\/monitoring\?/i;

test.beforeEach(async ({ page }) => {
  await login(page);
});

/** Kartu widget: div terdalam yang memuat judul dan catatan kakinya. */
const widget = (page: Page) =>
  page
    .locator("div")
    .filter({ has: page.getByText("Aktif Bekerja", { exact: true }) })
    .filter({ has: page.getByText("Disinkronisasi secara real-time", { exact: true }) })
    .last();

test("widget menampilkan staf outlet yang sedang bekerja dan yang sudah absen, per lokasi (keputusan AB5a, B183)", async ({
  page,
}) => {
  const tungguLokasi = page.waitForResponse(cocok("GET", /\/api\/location\/current$/i));
  const tungguMonitoring = page.waitForResponse(cocok("GET", POLA_MONITORING));
  await page.goto(URL_PENGGUNA);
  const [resLokasi, resMonitoring] = await Promise.all([tungguLokasi, tungguMonitoring]);
  expect(resMonitoring.status(), "GET /absensi/monitoring").toBe(200);
  const lokasi = (await resLokasi.json()).data as { id?: string; _id?: string };
  expect(new URL(resMonitoring.url()).searchParams.get("locationID"), "monitoring per lokasi outlet").toBe(
    String(lokasi.id ?? lokasi._id),
  );
  const daftar = ((await resMonitoring.json()).data?.daftar ?? []) as { penggunaID: string; status: string }[];
  const sedang = daftar.filter((s) => s.status === "sedang_bekerja").length;
  const sudah = daftar.filter((s) => s.status !== "belum_absen").length;
  const w = widget(page);
  await expect(w.getByText(String(sedang), { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(w.getByText("sedang bekerja", { exact: true })).toBeVisible();
  await expect(w.getByText(`${sudah} staf sudah absen hari ini`, { exact: true })).toBeVisible();
});

test("tanpa izin read-absensi widget menampilkan pesan izin, bukan daftar kosong (keputusan AB3a)", async ({ page }) => {
  await page.route(POLA_MONITORING, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 403,
          contentType: "application/json",
          // B141: pesan umum checkPermission (middleware/authorizePermission.js).
          body: JSON.stringify({ status: "error", message: "Akses ditolak. Anda tidak memiliki izin untuk tindakan ini." }),
        })
      : route.continue(),
  );
  try {
    await page.goto(URL_PENGGUNA);
    const w = widget(page);
    await expect(w.getByRole("alert")).toHaveText("Anda tidak memiliki izin melihat absensi staf.", { timeout: 20_000 });
    await expect(w.getByText("Belum ada karyawan yang absen hari ini.")).toHaveCount(0);
  } finally {
    await page.unroute(POLA_MONITORING);
  }
});

test("gagal memuat monitoring menampilkan pesan galat (keputusan AB3a)", async ({ page }) => {
  await page.route(POLA_MONITORING, (route) =>
    route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
  );
  try {
    await page.goto(URL_PENGGUNA);
    await expect(widget(page).getByRole("alert")).toContainText("Gagal memuat data absensi", { timeout: 30_000 });
  } finally {
    await page.unroute(POLA_MONITORING);
  }
});