import { expect, test, type Locator, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Pratinjau development Mesin Kasir (pemilik proyek, 6 November 2026):
 * tampilan dan perilaku komponen features/sesi-kasir dengan data contoh,
 * sebelum disambung ke backend. Tidak ada permintaan API milik modul ini;
 * yang diuji susunan tiga tingkat hierarki, setiap keadaan Revisi 2, menu,
 * dialog, rincian, dan responsif di lebar HP dan desktop.
 */

const URL_PRATINJAU = "/dashboard/outlet/keuangan/pratinjauMesinKasir";
const HP = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };
const LEBAR = { width: 1600, height: 900 };

async function buka(page: Page, ukuran: { width: number; height: number }) {
  await page.setViewportSize(ukuran);
  await login(page);
  await page.goto(URL_PRATINJAU);
  await expect(page.getByRole("group", { name: "Keadaan pratinjau" })).toBeVisible({ timeout: 20_000 });
}

const pilihKeadaan = (page: Page, label: string) =>
  page.getByRole("group", { name: "Keadaan pratinjau" }).getByRole("button", { name: label, exact: true }).click();

/** Judul bagian halaman (h2); nama mesin di kartu kasir buka berupa h3 dan tidak ikut. */
const judul = (page: Page, nama: string) => page.getByRole("heading", { name: nama, exact: true, level: 2 });

async function kotak(loc: Locator) {
  const k = await loc.boundingBox();
  expect(k, "elemen harus punya ukuran di layar").not.toBeNull();
  return k!;
}

async function tanpaGulirSamping(page: Page, konteks: string) {
  const lebar = await page.evaluate(() => ({
    isi: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.isi, `${konteks}: lebar isi tidak melebihi layar`).toBeLessThanOrEqual(lebar.layar);
}

test.describe("pratinjau Mesin Kasir", () => {
  for (const [nama, ukuran] of [
    ["HP", HP],
    ["desktop", DESKTOP],
  ] as const) {
    test(`${nama}: setiap keadaan tampil tanpa gulir ke samping`, async ({ page }) => {
      await buka(page, ukuran);
      const harapan: [string, () => Promise<void>][] = [
        [
          "Normal",
          async () => {
            await expect(page.getByRole("article", { name: "Kasir buka: Kasir Depan" })).toBeVisible();
            await expect(judul(page, "Mesin kasir")).toBeVisible();
          },
        ],
        ["Semua kasir tutup", () => expect(page.getByText("Semua kasir sedang tutup")).toBeVisible()],
        ["Riwayat kosong", () => expect(page.getByText(/Belum ada kasir yang ditutup pada/)).toBeVisible()],
        ["Memuat", () => expect(page.getByLabel("Memuat riwayat")).toBeVisible()],
        [
          "Gagal dimuat",
          async () => {
            await expect(page.getByText("Riwayat gagal dimuat")).toBeVisible();
            await expect(page.getByText("Kasir yang buka gagal dimuat")).toBeVisible();
          },
        ],
        [
          "Tanpa izin kelola",
          async () => {
            await expect(page.getByRole("article", { name: "Kasir buka: Mesin kasir" })).toBeVisible();
            await expect(page.getByRole("button", { name: "Tutup kasir dari web" })).toHaveCount(0);
            await expect(judul(page, "Mesin kasir")).toHaveCount(0);
          },
        ],
        [
          "Belum ada mesin kasir",
          async () => {
            await expect(judul(page, "Belum ada mesin kasir")).toBeVisible();
            await expect(judul(page, "Kasir yang sedang buka")).toHaveCount(0);
            await expect(page.getByText("Riwayat tampil di sini setelah kasir pertama ditutup.")).toBeVisible();
          },
        ],
      ];
      for (const [label, periksa] of harapan) {
        await test.step(label, async () => {
          await pilihKeadaan(page, label);
          await periksa();
          await tanpaGulirSamping(page, label);
        });
      }
    });
  }

  test("HP: kasir buka, riwayat, lalu mesin kasir; desktop: mesin kasir di samping riwayat", async ({ page }) => {
    await buka(page, HP);
    const yBuka = (await kotak(judul(page, "Kasir yang sedang buka"))).y;
    const yRiwayat = (await kotak(judul(page, "Riwayat buka-tutup kasir"))).y;
    const yMesin = (await kotak(judul(page, "Mesin kasir"))).y;
    expect(yBuka, "kasir buka di atas riwayat").toBeLessThan(yRiwayat);
    expect(yRiwayat, "riwayat di atas mesin kasir").toBeLessThan(yMesin);

    // Laptop 1280 dengan sidebar: panel tetap di samping, baris riwayat bertumpuk
    // karena riwayat lebih sempit dari 640 px (pemilik proyek, 6 November 2026).
    await page.setViewportSize(DESKTOP);
    const bagian = (nama: string) => page.getByRole("region", { name: nama, exact: true });
    const riwayat = await kotak(bagian("Riwayat buka-tutup kasir"));
    const mesin = await kotak(bagian("Mesin kasir"));
    expect(mesin.x, "mesin kasir di kanan riwayat").toBeGreaterThanOrEqual(riwayat.x + riwayat.width);
    expect(Math.abs(mesin.y - riwayat.y), "mesin kasir sejajar riwayat").toBeLessThan(40);
    await expect(page.getByText("Jam buka sampai tutup")).toBeHidden();
    await tanpaGulirSamping(page, "desktop 1280");

    await page.setViewportSize(LEBAR);
    await expect(page.getByText("Jam buka sampai tutup")).toBeVisible();
    await tanpaGulirSamping(page, "desktop 1600");
  });

  test("menu titik tiga mengikuti status kasir, dialog ubah mengunci laci selama kasir buka", async ({ page }) => {
    await buka(page, DESKTOP);

    await test.step("kasir buka: berhenti nonaktif beserta alasannya", async () => {
      await page.getByRole("button", { name: "Aksi Kasir Depan" }).click();
      await expect(page.getByRole("menuitem", { name: "Berhenti jadi mesin kasir" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await expect(page.getByText("Kasir di mesin ini masih buka.", { exact: false })).toBeVisible();
      await page.getByRole("menuitem", { name: "Ubah nama dan laci" }).click();
      const dialog = page.getByRole("dialog", { name: "Ubah mesin kasir" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("combobox", { name: "Laci uang" })).toBeDisabled();
      await expect(dialog.getByText("Laci tidak bisa diganti selama kasir di mesin ini masih buka.")).toBeVisible();
      await dialog.getByRole("button", { name: "Batal" }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("kasir tutup: berhenti meminta konfirmasi", async () => {
      await page.getByRole("button", { name: "Aksi Kasir Bar" }).click();
      await page.getByRole("menuitem", { name: "Berhenti jadi mesin kasir" }).click();
      const konfirmasi = page.getByRole("alertdialog", { name: "Kasir Bar berhenti jadi mesin kasir?" });
      await expect(konfirmasi).toBeVisible();
      await expect(konfirmasi).toContainText("Riwayat buka-tutup kasirnya tetap tersimpan.");
      await konfirmasi.getByRole("button", { name: "Batal" }).click();
      await expect(konfirmasi).toBeHidden();
    });

    await test.step("tambah: perangkat yang sudah jadi mesin kasir nonaktif, simpan menunggu nama", async () => {
      await page.getByRole("button", { name: "Tambah mesin kasir" }).click();
      const dialog = page.getByRole("dialog", { name: "Tambah mesin kasir" });
      await expect(dialog.getByRole("radio", { name: /Oppo A58/ })).toBeDisabled();
      await expect(dialog.getByRole("radio", { name: /Samsung Galaxy A15/ })).toBeEnabled();
      await expect(dialog.getByRole("radio", { name: /Vivo Y21/ })).toHaveCount(0);
      const simpan = dialog.getByRole("button", { name: "Simpan" });
      await expect(simpan).toBeDisabled();
      await dialog.getByLabel("Nama mesin kasir").fill("Kasir Teras");
      await expect(simpan).toBeEnabled();
      await simpan.click();
      await expect(dialog).toBeHidden();
      await expect(page.getByText("Mesin kasir disimpan (pratinjau, tidak disimpan)")).toBeVisible();
    });
  });

  test("HP: tutup kasir dari web meminta catatan saat hitungan berbeda, lalu tertutup", async ({ page }) => {
    await buka(page, HP);
    await page.getByRole("button", { name: "Tutup kasir dari web" }).click();
    const dialog = page.getByRole("dialog", { name: "Tutup kasir Kasir Depan?" });
    await expect(dialog).toBeVisible();
    const kDialog = await kotak(dialog);
    expect(kDialog.x + kDialog.width, "dialog di dalam layar").toBeLessThanOrEqual(HP.width);

    const nominal = dialog.getByLabel("Uang yang dihitung di laci");
    await nominal.fill("1000000");
    await expect(nominal).toHaveValue("1.000.000");
    await dialog.getByRole("button", { name: "Tutup kasir", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("Hitungan berbeda dengan catatan sistem.");
    const catatan = dialog.getByLabel(/Catatan/);
    await expect(catatan).toBeFocused();

    await catatan.fill("Kembalian terlewat dicatat");
    await dialog.getByRole("button", { name: "Tutup kasir", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Kasir ditutup (pratinjau, tidak disimpan)")).toBeVisible();
  });

  test("riwayat memuat hari sebelumnya, menandai sesi lintas tengah malam dan mesin yang dilepas, lalu membuka rincian", async ({
    page,
  }) => {
    await buka(page, LEBAR);
    await page.getByRole("button", { name: "Muat hari sebelumnya" }).click();
    await expect(page.getByRole("button", { name: "Muat hari sebelumnya" })).toHaveCount(0);
    await expect(page.getByText(/^22\.10 sampai 02\.15 \(\d+ \S+\)$/)).toBeVisible();
    await expect(page.getByText("Mesin kasir yang sudah dilepas").first()).toBeAttached();

    await page.getByRole("combobox", { name: "Mesin kasir" }).click();
    await page.getByRole("option", { name: "Kasir Bar" }).click();
    await expect(page.getByText("Mesin kasir yang sudah dilepas")).toHaveCount(0);

    await page.getByRole("link", { name: /Kasir Bar/ }).first().click();
    await expect(page).toHaveURL(/pratinjauMesinKasir\/rincian\?sesi=/);
    await expect(page.getByRole("heading", { level: 1, name: /^Kasir Bar, / })).toBeVisible();
    await expect(judul(page, "Saat kasir ditutup")).toBeVisible();
    await page.getByRole("link", { name: "Kembali ke Mesin Kasir" }).click();
    await expect(page).toHaveURL(new RegExp(`${URL_PRATINJAU}$`));
  });

  test("HP: rincian sesi yang masih buka tampil utuh tanpa gulir ke samping", async ({ page }) => {
    await buka(page, HP);
    await page.getByRole("link", { name: "Lihat rincian" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /^Kasir Depan, / })).toBeVisible();
    await expect(page.getByText("Kasir belum ditutup")).toBeVisible();
    await tanpaGulirSamping(page, "rincian");
  });
});