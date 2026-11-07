import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * Pratinjau development langkah jam buka wizard setup (pemilik proyek,
 * 7 November 2026; keputusan rancangan butir 30): tampilan desain C dan
 * perilaku isiannya dengan data contoh, sebelum disambung ke backend. Rute
 * tidak memerlukan sesi dan tidak memanggil API milik langkah ini.
 */

const URL_PRATINJAU = "/setup/pratinjauJamBuka";
const HP = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

async function buka(page: Page, ukuran: { width: number; height: number }) {
  await page.setViewportSize(ukuran);
  await page.goto(URL_PRATINJAU);
  await expect(page.getByRole("group", { name: "Keadaan pratinjau" })).toBeVisible({ timeout: 20_000 });
}

const pilihKeadaan = (page: Page, label: string) =>
  page.getByRole("group", { name: "Keadaan pratinjau" }).getByRole("button", { name: label, exact: true }).click();

const pilihanMode = (page: Page, label: "Buka 24 jam" | "Jam tertentu") =>
  page.getByRole("group", { name: "Toko buka kapan?" }).getByRole("button", { name: new RegExp(`^${label}`) });

const kartu = (page: Page, hari: string) =>
  page.getByRole("list", { name: "Jam buka per hari" }).getByRole("listitem", { name: hari, exact: true });

async function isiJam(k: Locator, hari: string, jenis: "Jam buka" | "Jam tutup", jam: string, menit: string) {
  await k.getByLabel(`${jenis} ${hari} (jam)`).fill(jam);
  await k.getByLabel(`${jenis} ${hari} (menit)`).fill(menit);
}

/** Galat langkah; dibatasi ke main agar pengumum rute Next.js (role alert) tidak ikut. */
const galat = (page: Page) => page.getByRole("main").getByRole("alert");
const CATATAN_SAH = "Isian sah: wizard pindah ke langkah Kategori.";

const simpan = (page: Page) => page.getByRole("button", { name: "Simpan dan lanjut" }).click();

async function kotak(loc: Locator) {
  const k = await loc.boundingBox();
  expect(k, "elemen harus punya ukuran di layar").not.toBeNull();
  return k!;
}

async function tanpaGulirSamping(page: Page, konteks: string) {
  const lebar = await page.evaluate(() => ({ isi: document.documentElement.scrollWidth, layar: window.innerWidth }));
  expect(lebar.isi, `${konteks}: lebar isi tidak melebihi layar`).toBeLessThanOrEqual(lebar.layar);
}

test.describe("pratinjau langkah jam buka", () => {
  for (const [nama, ukuran] of [
    ["HP", HP],
    ["desktop", DESKTOP],
  ] as const) {
    test(`${nama}: setiap keadaan tampil tanpa gulir ke samping`, async ({ page }) => {
      await buka(page, ukuran);
      const daftarHari = page.getByRole("list", { name: "Jam buka per hari" });
      const harapan: [string, () => Promise<void>][] = [
        [
          "Belum memilih",
          async () => {
            await expect(pilihanMode(page, "Buka 24 jam")).toHaveAttribute("aria-pressed", "false");
            await expect(pilihanMode(page, "Jam tertentu")).toHaveAttribute("aria-pressed", "false");
            await expect(daftarHari).toHaveCount(0);
          },
        ],
        [
          "Buka 24 jam",
          async () => {
            await expect(pilihanMode(page, "Buka 24 jam")).toHaveAttribute("aria-pressed", "true");
            await expect(daftarHari).toHaveCount(0);
          },
        ],
        [
          "Jam tertentu, kosong",
          async () => {
            await expect(daftarHari.getByRole("listitem")).toHaveCount(7);
            await expect(daftarHari.getByText("Jam belum lengkap")).toHaveCount(7);
            await expect(page.getByRole("button", { name: /^Samakan semua hari/ })).toHaveCount(0);
          },
        ],
        [
          "Terisi biasa",
          async () => {
            await expect(kartu(page, "Senin").getByText("08.00 sampai 22.00")).toBeVisible();
            await expect(daftarHari.getByText("Tutup di hari yang sama, pukul 22.00")).toHaveCount(6);
            await expect(kartu(page, "Minggu").getByText("Toko tutup seharian")).toBeVisible();
          },
        ],
        [
          "Lewat tengah malam",
          async () => {
            await expect(kartu(page, "Jumat").getByText("Tutup keesokan harinya, Sabtu pukul 02.00")).toBeVisible();
            await expect(kartu(page, "Minggu").getByText("Tutup keesokan harinya, Senin pukul 02.00")).toBeVisible();
            await expect(kartu(page, "Senin").getByText("Tutup di hari yang sama, pukul 23.00")).toBeVisible();
          },
        ],
        [
          "Campuran",
          async () => {
            await expect(kartu(page, "Senin").getByText("Toko tutup seharian")).toBeVisible();
            await expect(kartu(page, "Sabtu").getByText("Buka sepanjang hari, tanpa jam tutup")).toBeVisible();
            await expect(kartu(page, "Selasa").getByText("Tutup keesokan harinya, Rabu pukul 01.00")).toBeVisible();
          },
        ],
        [
          "Semua libur",
          async () => {
            await expect(page.getByRole("note")).toContainText("Semua hari libur.");
            await expect(daftarHari.getByText("Toko tutup seharian")).toHaveCount(7);
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

  test("desktop: daftar langkah di samping form; HP: di atas form, dengan Jam buka toko di langkah 4", async ({ page }) => {
    await buka(page, DESKTOP);
    const daftar = page.getByRole("list", { name: "Langkah setup toko" });
    await expect(daftar.locator('[aria-current="step"]')).toHaveText("4Jam buka toko");
    await expect(page.getByText("Langkah 4 dari 8")).toBeVisible();
    const judul = page.getByRole("heading", { level: 1, name: "Jam buka toko" });
    expect((await kotak(judul)).x, "form di kanan daftar langkah").toBeGreaterThan((await kotak(daftar)).x + (await kotak(daftar)).width);

    await page.setViewportSize(HP);
    expect((await kotak(judul)).y, "form di bawah daftar langkah").toBeGreaterThan((await kotak(daftar)).y);
  });

  test("validasi: pilihan wajib, jam per hari wajib, dan jam buka tidak boleh sama dengan jam tutup", async ({ page }) => {
    await buka(page, DESKTOP);
    await simpan(page);
    await expect(galat(page)).toHaveText("Pilih salah satu: buka 24 jam atau jam tertentu.");

    await pilihanMode(page, "Jam tertentu").click();
    await simpan(page);
    await expect(galat(page)).toHaveText("Masih ada hari yang jamnya belum lengkap.");
    await expect(page.getByText("Isi jam buka dan jam tutup.")).toHaveCount(7);

    const senin = kartu(page, "Senin");
    await isiJam(senin, "Senin", "Jam buka", "08", "00");
    await isiJam(senin, "Senin", "Jam tutup", "08", "00");
    await expect(senin.getByText("Jam buka dan jam tutup tidak boleh sama.")).toBeVisible();
    await isiJam(senin, "Senin", "Jam tutup", "22", "00");
    await expect(senin.getByText("Jam buka dan jam tutup tidak boleh sama.")).toHaveCount(0);
    await expect(page.getByText("Isi jam buka dan jam tutup.")).toHaveCount(6);
    await expect(page.getByText(CATATAN_SAH)).toHaveCount(0);
  });

  test("samakan mengisi hari Buka lain dari hari pertama yang lengkap, tanpa mengubah 24 jam dan Libur", async ({ page }) => {
    await buka(page, HP);
    await pilihKeadaan(page, "Jam tertentu, kosong");
    await kartu(page, "Senin").getByRole("group", { name: "Status Senin" }).getByRole("button", { name: "Libur", exact: true }).click();
    await kartu(page, "Sabtu").getByRole("group", { name: "Status Sabtu" }).getByRole("button", { name: "24 jam", exact: true }).click();
    const selasa = kartu(page, "Selasa");
    await isiJam(selasa, "Selasa", "Jam buka", "10", "00");
    await isiJam(selasa, "Selasa", "Jam tutup", "02", "00");
    await expect(selasa.getByText("Tutup keesokan harinya, Rabu pukul 02.00")).toBeVisible();

    await page.getByRole("button", { name: "Samakan semua hari dengan Selasa" }).click();
    for (const hari of HARI.filter((h) => !["Senin", "Sabtu"].includes(h))) {
      await expect(kartu(page, hari).getByText("10.00 sampai 02.00"), hari).toBeVisible();
    }
    await expect(kartu(page, "Senin").getByText("Toko tutup seharian")).toBeVisible();
    await expect(kartu(page, "Sabtu").getByText("Buka sepanjang hari, tanpa jam tutup")).toBeVisible();
    await expect(kartu(page, "Minggu").getByText("Tutup keesokan harinya, Senin pukul 02.00")).toBeVisible();

    await simpan(page);
    await expect(page.getByRole("status").filter({ hasText: CATATAN_SAH })).toBeVisible();
    await expect(galat(page)).toHaveCount(0);
    await tanpaGulirSamping(page, "HP sesudah samakan");
  });

  test("semua libur tetap bisa disimpan, dan penolakan server tampil di langkah", async ({ page }) => {
    await buka(page, DESKTOP);
    await pilihKeadaan(page, "Semua libur");
    await simpan(page);
    await expect(page.getByRole("status").filter({ hasText: CATATAN_SAH })).toBeVisible();

    await pilihKeadaan(page, "Gagal disimpan");
    await simpan(page);
    await expect(galat(page)).toContainText("Gagal menyimpan jam buka");
  });
});