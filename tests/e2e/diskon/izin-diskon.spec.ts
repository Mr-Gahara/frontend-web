import { test, expect, type Page } from "@playwright/test";
import { IZIN } from "../../../lib/auth/permissions";
import { BASIS, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";
import { masukBacaSaja, masukSebagai } from "../../helpers/terkunci-uji";

/*
 * Izin halaman diskon dari pengguna bukan Owner (utang pengujian kelompok 1:
 * pemilih produk tanpa izin baca produk dan aksiDiskon, sebelumnya hanya
 * teruji unit). Diskon berproduk dibuat Owner lewat UI, lalu diubah pengguna
 * uji tanpa read-produk. Diskon uji berstatus Non-Aktif dan tertinggal,
 * karena backend tidak punya DELETE (utang pengujian, diskon menumpuk).
 */

const URL_DISKON = BASIS + "/dashboard/outlet/diskon";
const POLA_PRODUK = /\/api\/produk(\?|$)/i;
const POLA_SATU = /\/api\/diskon\/[0-9a-f]{24}$/i;

type ProdukMentah = { _id?: string; id?: string; namaProduk: string };
type DiskonMentah = { id: string; namaDiskon: string; nilai: number; produkIDs: string[] };

const baris = (page: Page, nama: string) => page.locator("tbody tr").filter({ hasText: nama });
const pencarian = (page: Page) => page.getByPlaceholder("Cari nama diskon...");
const judul = (page: Page) => page.getByRole("heading", { name: "Kelola Diskon" });

async function bukaHalaman(page: Page) {
  await page.goto(URL_DISKON);
  await expect(judul(page)).toBeVisible({ timeout: 20_000 });
}

test("tanpa read-produk: pemilih produk diganti keterangan, daftar produk tidak diminta, dan produk terpilih tidak berubah saat diubah", async ({
  page,
}) => {
  await login(page);
  const auth = await bukaDenganAuth(page, URL_DISKON);
  const produk = await api<ProdukMentah[]>(page, auth, "GET", "/produk");
  expect(produk.status, produk.pesan).toBe(200);
  test.skip(produk.data.length === 0, "Tidak ada produk untuk dipilih sebagai produk tertentu");
  const produkUji = produk.data[0];
  const idProduk = String(produkUji._id ?? produkUji.id);
  const nama = "E2E Diskon Tanpa Produk " + unik();

  await test.step("Owner membuat diskon untuk satu produk lewat halaman", async () => {
    await expect(judul(page)).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Tambah Diskon" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nama Diskon").fill(nama);
    await dialog.getByRole("combobox", { name: "Cakupan" }).click();
    await page.getByRole("option", { name: "Item" }).click();
    await dialog.getByRole("combobox", { name: "Tipe Diskon" }).click();
    await page.getByRole("option", { name: "Nominal (Rp)" }).click();
    await dialog.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Non-Aktif" }).click();
    await dialog.getByLabel("Nilai Potongan").fill("500");
    await dialog.getByRole("button", { name: "Aturan tambahan" }).click();
    await dialog.getByRole("textbox", { name: "Cari produk" }).fill(produkUji.namaProduk);
    await dialog.getByRole("checkbox", { name: produkUji.namaProduk, exact: true }).first().click();
    const tPost = page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/diskon(\?|$)/i.test(r.url()));
    await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
    expect((await tPost).status(), "POST /diskon").toBe(201);
    await expect(dialog).toBeHidden({ timeout: 15_000 });
  });

  await masukSebagai(page, {
    nama: "E2E Diskon Tanpa Produk",
    pin: "864239",
    deskripsi: "Peran uji e2e: izin baca Owner tanpa produk, ditambah buat dan ubah diskon",
    izin: (n) =>
      (n.startsWith("read-") && n !== IZIN.produk) || n === IZIN.buatDiskon || n === IZIN.ubahDiskon,
  });
  let mintaProduk = 0;
  page.on("request", (r) => {
    if (r.method() === "GET" && POLA_PRODUK.test(r.url())) mintaProduk += 1;
  });
  await bukaHalaman(page);
  await pencarian(page).fill(nama);
  await expect(baris(page, nama)).toHaveCount(1, { timeout: 15_000 });
  await baris(page, nama).getByRole("button", { name: "Buka menu" }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Nilai Potongan")).toHaveValue("500");
  // PD9a: bagian aturan terbuka sendiri, karena diskon ini sudah punya produk tertentu.
  await expect(dialog.getByRole("button", { name: "Aturan tambahan" })).toHaveAttribute("aria-expanded", "true");
  await expect(
    dialog.getByText("Memilih produk membutuhkan izin melihat produk. 1 produk terpilih tidak berubah."),
  ).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Cari produk" })).toHaveCount(0);

  await dialog.getByLabel("Nilai Potongan").fill("600");
  const tPut = page.waitForResponse((r) => r.request().method() === "PUT" && POLA_SATU.test(r.url()));
  await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
  const put = await tPut;
  expect(put.status(), "PUT /diskon/:id").toBe(200);
  expect(put.request().postDataJSON(), "produkIDs tidak ikut dikirim").toEqual({ nilai: 600 });
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  expect(mintaProduk, "GET /produk tidak diminta tanpa read-produk").toBe(0);

  const pemilik = await bukaDenganAuth(page, URL_DISKON);
  const daftar = await api<DiskonMentah[]>(page, pemilik, "GET", "/diskon");
  const tersimpan = daftar.data.find((d) => d.namaDiskon === nama);
  expect(tersimpan?.nilai).toBe(600);
  expect(tersimpan?.produkIDs.map(String), "produk terpilih tetap").toEqual([idProduk]);
});

test("baca-saja (aksiDiskon): daftar tampil tanpa Tambah Diskon dan tanpa menu aksi baris", async ({ page }) => {
  await login(page);
  await masukBacaSaja(page);
  const tDaftar = page.waitForResponse((r) => r.request().method() === "GET" && /\/api\/diskon(\?|$)/i.test(r.url()));
  await bukaHalaman(page);
  expect((await tDaftar).status()).toBe(200);
  await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Tambah Diskon" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Buka menu" })).toHaveCount(0);
});

test("hanya create-diskon (aksiDiskon): Tambah Diskon tampil, menu aksi baris tidak", async ({ page }) => {
  await login(page);
  await masukSebagai(page, {
    nama: "E2E Diskon Buat Saja",
    pin: "864240",
    deskripsi: "Peran uji e2e: izin baca Owner ditambah buat diskon, tanpa ubah",
    izin: (n) => n.startsWith("read-") || n === IZIN.buatDiskon,
  });
  await bukaHalaman(page);
  await expect(page.getByRole("button", { name: "Tambah Diskon" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Buka menu" })).toHaveCount(0);
});
