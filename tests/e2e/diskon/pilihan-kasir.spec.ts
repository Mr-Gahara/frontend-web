import { test, expect, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { NAMA_DISKON_GLOBAL, unik } from "../../helpers/reservasi-uji";

/*
 * Pilihan diskon kasir mengikuti sedangBerlaku (keputusan PD4a). Diskon
 * Global berstatus Aktif dengan tanggal mulai bulan depan dibuat lewat UI:
 * daftar diskon menandainya tidak sedang berlaku, dan buat reservasi tidak
 * menawarkannya, sedangkan diskon uji reservasi yang berlaku tetap
 * ditawarkan. Diskon uji lalu dinonaktifkan lewat UI, dan lewat API di
 * finally bila test berhenti di tengah, agar tidak tertinggal sebagai
 * diskon aktif.
 */

const URL_DISKON = BASIS + "/dashboard/outlet/diskon";
const URL_BUAT_RESERVASI = BASIS + "/dashboard/outlet/reservasi/buatReservasi";
const POLA_DISKON = /\/api\/diskon(\?|$)/i;
const POLA_SATU = /\/api\/diskon\/[0-9a-f]{24}$/i;

type DiskonMentah = {
  id: string;
  namaDiskon: string;
  cakupan: string;
  status: string;
  sedangBerlaku: boolean;
};

const baris = (page: Page, nama: string) => page.locator("tbody tr").filter({ hasText: nama });
const pencarian = (page: Page) => page.getByPlaceholder("Cari nama diskon...");

const tunggu = (page: Page, method: string, pola: RegExp) =>
  page.waitForResponse((r) => r.request().method() === method && pola.test(r.url()));

async function daftarDiskon(page: Page, auth: Auth): Promise<DiskonMentah[]> {
  const r = await api<DiskonMentah[]>(page, auth, "GET", "/diskon");
  expect(r.status, r.pesan).toBe(200);
  return r.data;
}

async function bukaDiskon(page: Page): Promise<Auth> {
  const auth = await bukaDenganAuth(page, URL_DISKON);
  await expect(page.getByRole("heading", { name: "Kelola Diskon" })).toBeVisible({
    timeout: 15_000,
  });
  return auth;
}

test.describe("Pilihan diskon kasir", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("diskon Aktif yang belum mulai berlaku ditandai di daftar dan tidak ditawarkan di buat reservasi", async ({ page }) => {
    const auth = await bukaDiskon(page);
    const pembanding = (await daftarDiskon(page, auth)).find(
      (d) => d.namaDiskon === NAMA_DISKON_GLOBAL && d.status === "Aktif" && d.sedangBerlaku,
    );
    test.skip(!pembanding, "Diskon uji reservasi yang berlaku tidak ada sebagai pembanding");

    const nama = "E2E Diskon Belum Berlaku " + unik();
    let id: string | undefined;
    try {
      await test.step("buat diskon Aktif dengan tanggal mulai bulan depan", async () => {
        await page.getByRole("button", { name: "Tambah Diskon" }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel("Nama Diskon").fill(nama);
        await dialog.getByLabel("Nilai Potongan").fill("5");
        await dialog.getByRole("button", { name: "Aturan tambahan" }).click();
        await dialog.getByRole("button", { name: /^Tanggal Mulai, / }).click();
        await page.getByRole("button", { name: /next month/i }).click();
        await page.getByRole("grid").getByText("15", { exact: true }).click();
        await expect(page.getByRole("grid")).toHaveCount(0);
        const tPost = tunggu(page, "POST", POLA_DISKON);
        await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
        const res = await tPost;
        expect(res.status(), "POST /diskon").toBe(201);
        expect(new Date(res.request().postDataJSON().tanggalMulai).getTime()).toBeGreaterThan(Date.now());
        await expect(dialog).toBeHidden({ timeout: 15_000 });
        const tersimpan = (await daftarDiskon(page, auth)).find((d) => d.namaDiskon === nama);
        expect(tersimpan).toMatchObject({ cakupan: "Global", status: "Aktif", sedangBerlaku: false });
        id = tersimpan?.id;
        await pencarian(page).fill(nama);
        await expect(baris(page, nama)).toContainText("Tidak sedang berlaku", { timeout: 15_000 });
      });

      await test.step("buat reservasi tidak menawarkannya", async () => {
        await page.goto(URL_BUAT_RESERVASI);
        await page.getByRole("button", { name: "Pilih Diskon" }).nth(1).click();
        await expect(page.getByRole("option").filter({ hasText: NAMA_DISKON_GLOBAL })).toHaveCount(1, {
          timeout: 15_000,
        });
        await expect(page.getByRole("option").filter({ hasText: nama })).toHaveCount(0);
        await page.keyboard.press("Escape");
      });

      await test.step("nonaktifkan lewat halaman diskon", async () => {
        await bukaDiskon(page);
        await pencarian(page).fill(nama);
        await baris(page, nama).getByRole("button", { name: "Buka menu" }).click();
        await page.getByRole("menuitem", { name: "Nonaktifkan", exact: true }).click();
        const dialog = page.getByRole("alertdialog");
        const tPut = tunggu(page, "PUT", POLA_SATU);
        await dialog.getByRole("button", { name: "Nonaktifkan", exact: true }).click();
        expect((await tPut).status(), "PUT status Non-Aktif").toBe(200);
        await expect(dialog).toBeHidden({ timeout: 15_000 });
        await expect(baris(page, nama)).toContainText("Non-Aktif");
      });
    } finally {
      const kini = (await daftarDiskon(page, auth)).find((d) => d.id === id);
      if (kini?.status === "Aktif") {
        const r = await api(page, auth, "PUT", "/diskon/" + id, { status: "Non-Aktif" });
        expect.soft(r.status, "diskon uji dinonaktifkan kembali: " + r.pesan).toBe(200);
      }
    }
  });
});