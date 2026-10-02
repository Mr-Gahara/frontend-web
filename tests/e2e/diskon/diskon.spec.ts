import { test, expect, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";

/*
 * Spec pembanding halaman diskon, ditulis terhadap kode sebelum migrasi
 * (keputusan PD1a). Hanya memuat perilaku yang tidak berubah: daftar dari
 * data nyata, filter status, buat lewat UI, dan nama kembar yang ditolak
 * backend. Backend tidak punya DELETE diskon, sehingga diskon uji dibuat
 * berstatus Non-Aktif (tidak dihitung batas 50 diskon aktif) dengan nama
 * unik per run, dan tertinggal sebagai data uji.
 */

const URL_DISKON = BASIS + "/dashboard/outlet/diskon";
const POLA_DISKON = /\/api\/diskon(\?|$)/i;

type DiskonMentah = {
  id: string;
  namaDiskon: string;
  cakupan: string;
  tipe: string;
  nilai: number;
  bisaDigabung: boolean;
  status: string;
};

const baris = (page: Page, nama: string) => page.locator("tbody tr").filter({ hasText: nama });
const pencarian = (page: Page) => page.getByPlaceholder("Cari nama diskon...");
const dialogForm = (page: Page) => page.getByRole("dialog");

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

/** Mengisi form tambah: nama, status Non-Aktif bila diminta, lalu nilai. */
async function isiFormTambah(page: Page, nama: string, nilai: string, nonAktif: boolean) {
  await page.getByRole("button", { name: "Tambah Diskon" }).click();
  const dialog = dialogForm(page);
  await expect(dialog.getByText("Tambah Diskon")).toBeVisible();
  await dialog.getByPlaceholder("Contoh: Diskon Kemerdekaan").fill(nama);
  if (nonAktif) {
    await dialog.getByRole("combobox").filter({ hasText: /^Aktif$/ }).click();
    await page.getByRole("option", { name: "Non-Aktif" }).click();
  }
  await dialog.getByPlaceholder("0").fill(nilai);
  return dialog;
}

const tungguPost = (page: Page) =>
  page.waitForResponse((r) => r.request().method() === "POST" && POLA_DISKON.test(r.url()));

test.describe("Diskon", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar menampilkan jumlah diskon sesuai data tersimpan", async ({ page }) => {
    const auth = await bukaDiskon(page);
    const daftar = await daftarDiskon(page, auth);
    await expect(page.getByText(`${daftar.length} total data`)).toBeVisible({ timeout: 15_000 });
  });

  test("filter status menyaring daftar, dan reset mengembalikannya", async ({ page }) => {
    const auth = await bukaDiskon(page);
    const daftar = await daftarDiskon(page, auth);
    const nonAktif = daftar.filter((d) => d.status === "Non-Aktif").length;
    test.skip(nonAktif === daftar.length, "Seluruh diskon Non-Aktif; filter tidak dapat dibedakan");
    await expect(page.getByText(`${daftar.length} total data`)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("combobox").filter({ hasText: "Semua Status" }).click();
    await page.getByRole("option", { name: "Non-Aktif" }).click();
    await expect(page.getByText(`${nonAktif} total data`)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Reset Filter" }).click();
    await expect(page.getByText(`${daftar.length} total data`)).toBeVisible({ timeout: 15_000 });
  });

  test("diskon dibuat lewat halaman dengan payload enam field", async ({ page }) => {
    const auth = await bukaDiskon(page);
    const nama = "E2E Diskon " + unik();
    const dialog = await isiFormTambah(page, nama, "15", true);
    const tPost = tungguPost(page);
    await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
    const res = await tPost;
    expect(res.status(), "POST /diskon").toBe(201);
    expect(res.request().postDataJSON()).toEqual({
      namaDiskon: nama,
      cakupan: "Global",
      tipe: "persen",
      nilai: 15,
      bisaDigabung: false,
      status: "Non-Aktif",
    });
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    const tersimpan = (await daftarDiskon(page, auth)).find((d) => d.namaDiskon === nama);
    expect(tersimpan).toMatchObject({ cakupan: "Global", tipe: "persen", nilai: 15, status: "Non-Aktif" });
    await pencarian(page).fill(nama);
    await expect(baris(page, nama)).toHaveCount(1, { timeout: 15_000 });
    await expect(baris(page, nama)).toContainText("15%");
    await expect(baris(page, nama)).toContainText("Non-Aktif");
  });

  test("nama yang sudah dipakai ditolak backend, pesannya tampil, dan dialog bertahan", async ({ page }) => {
    const auth = await bukaDiskon(page);
    const daftar = await daftarDiskon(page, auth);
    test.skip(daftar.length === 0, "Tidak ada diskon untuk diuji nama kembarnya");
    const dialog = await isiFormTambah(page, daftar[0].namaDiskon, "10", true);
    const tPost = tungguPost(page);
    await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
    const res = await tPost;
    expect(res.status(), "POST /diskon dengan nama kembar").toBe(409);
    const pesan = String((await res.json()).message);
    await expect(dialog.getByText(pesan)).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByPlaceholder("Contoh: Diskon Kemerdekaan")).toHaveValue(daftar[0].namaDiskon);
    expect((await daftarDiskon(page, auth)).length).toBe(daftar.length);
  });
});