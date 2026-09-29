import { test, expect, type Page } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, login } from "../../helpers/transfer-uji";
import { cocok } from "../../helpers/reservasi-uji";

/*
 * Spec widget absensi di halaman pengguna outlet (submodul monitoring
 * absensi, keputusan AB3a, AB4a, dan AB5a). Angka dibandingkan dengan
 * respons nyata GET /absensi/monitoring dan GET /pengguna; route.fulfill
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

test("widget menampilkan staf ruang yang sedang bekerja dan yang sudah absen (keputusan AB4a dan AB5a)", async ({
  page,
}) => {
  const tungguPengguna = page.waitForResponse(cocok("GET", /\/api\/pengguna\?workspace=outlet/i));
  const tungguMonitoring = page.waitForResponse(cocok("GET", POLA_MONITORING));
  await page.goto(URL_PENGGUNA);
  const [resPengguna, resMonitoring] = await Promise.all([tungguPengguna, tungguMonitoring]);
  expect(resMonitoring.status(), "GET /absensi/monitoring").toBe(200);
  const idRuang = new Set(
    (((await resPengguna.json()).data ?? []) as { id: string }[]).map((p) => String(p.id)),
  );
  const daftar = (((await resMonitoring.json()).data?.daftar ?? []) as { penggunaID: string; status: string }[])
    .filter((s) => idRuang.has(String(s.penggunaID)));
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
          body: JSON.stringify({ status: "error", message: "Anda tidak memiliki izin melihat ringkasan absensi seluruh staf." }),
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