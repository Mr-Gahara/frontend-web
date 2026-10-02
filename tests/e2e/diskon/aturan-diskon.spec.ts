import { test, expect, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";

/*
 * Spec aturan tambahan diskon (keputusan PD3a, PD6a, PD7a, dan PD9a).
 * Diskon beraturan dibuat lewat UI, dibaca ulang lewat API, tampil di kolom
 * Aturan, lalu aturannya dikosongkan lewat UI. Diskon uji berstatus
 * Non-Aktif dengan nama unik dan tertinggal, karena backend tidak punya
 * DELETE. Produk tertentu dipilih dari produk yang sudah ada di tenant uji.
 */

const URL_DISKON = BASIS + "/dashboard/outlet/diskon";
const POLA_DISKON = /\/api\/diskon(\?|$)/i;
const POLA_SATU = /\/api\/diskon\/[0-9a-f]{24}$/i;

type DiskonMentah = {
  id: string;
  namaDiskon: string;
  tanggalMulai: string | null;
  tanggalBerakhir: string | null;
  jamMulai: string | null;
  jamSelesai: string | null;
  hariAktif: number[];
  minimalBelanja: number;
  kuota: number | null;
  kuotaPerPelanggan: number | null;
  produkIDs: string[];
  hitungPerBarang: boolean;
};

type ProdukMentah = { _id?: string; id?: string; namaProduk: string };

const baris = (page: Page, nama: string) => page.locator("tbody tr").filter({ hasText: nama });
const pencarian = (page: Page) => page.getByPlaceholder("Cari nama diskon...");
const dialogForm = (page: Page) => page.getByRole("dialog");

const tunggu = (page: Page, method: string, pola: RegExp) =>
  page.waitForResponse((r) => r.request().method() === method && pola.test(r.url()));

async function diskonLewatApi(page: Page, auth: Auth, nama: string): Promise<DiskonMentah> {
  const r = await api<DiskonMentah[]>(page, auth, "GET", "/diskon");
  expect(r.status, r.pesan).toBe(200);
  const diskon = r.data.find((d) => d.namaDiskon === nama);
  expect(diskon, "diskon uji terbaca lewat API").toBeTruthy();
  return diskon as DiskonMentah;
}

async function bukaDiskon(page: Page): Promise<Auth> {
  const auth = await bukaDenganAuth(page, URL_DISKON);
  await expect(page.getByRole("heading", { name: "Kelola Diskon" })).toBeVisible({
    timeout: 15_000,
  });
  return auth;
}

/** Memilih satu hari di bulan yang sedang tampil pada kalender kostum. */
async function pilihTanggal(page: Page, label: string, hari: number) {
  await dialogForm(page).getByRole("button", { name: new RegExp(`^${label}, `) }).click();
  await page.getByRole("grid").getByText(String(hari), { exact: true }).click();
  await expect(page.getByRole("grid")).toHaveCount(0);
}

async function isiJam(page: Page, label: string, jam: string, menit: string) {
  await dialogForm(page).getByRole("textbox", { name: `${label} (jam)` }).fill(jam);
  await dialogForm(page).getByRole("textbox", { name: `${label} (menit)` }).fill(menit);
}

test.describe("Aturan tambahan diskon", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("diskon beraturan dibuat lewat halaman, tampil di kolom Aturan, lalu aturannya dikosongkan", async ({ page }) => {
    const auth = await bukaDiskon(page);
    const produk = await api<ProdukMentah[]>(page, auth, "GET", "/produk");
    expect(produk.status, produk.pesan).toBe(200);
    test.skip(produk.data.length === 0, "Tidak ada produk untuk dipilih sebagai produk tertentu");
    const produkUji = produk.data[0];
    const idProduk = String(produkUji._id ?? produkUji.id);
    const nama = "E2E Diskon Aturan " + unik();
    const kini = new Date();

    await test.step("buat", async () => {
      await page.getByRole("button", { name: "Tambah Diskon" }).click();
      const dialog = dialogForm(page);
      await dialog.getByLabel("Nama Diskon").fill(nama);
      await dialog.getByRole("combobox", { name: "Cakupan" }).click();
      await page.getByRole("option", { name: "Item" }).click();
      await dialog.getByRole("combobox", { name: "Tipe Diskon" }).click();
      await page.getByRole("option", { name: "Nominal (Rp)" }).click();
      await dialog.getByRole("combobox", { name: "Status" }).click();
      await page.getByRole("option", { name: "Non-Aktif" }).click();
      await dialog.getByLabel("Nilai Potongan").fill("500");

      await expect(dialog.getByLabel("Kuota Pemakaian")).toBeHidden();
      await dialog.getByRole("button", { name: "Aturan tambahan" }).click();
      await expect(dialog.getByLabel("Kuota Pemakaian")).toBeVisible();

      await pilihTanggal(page, "Tanggal Mulai", 15);
      await pilihTanggal(page, "Tanggal Berakhir", 20);
      await isiJam(page, "Jam Mulai", "10", "00");
      await isiJam(page, "Jam Selesai", "14", "00");
      await dialog.getByRole("checkbox", { name: "Sen", exact: true }).click();
      await dialog.getByRole("checkbox", { name: "Jum", exact: true }).click();
      await dialog.getByLabel("Minimal Belanja (Rp)").fill("1000");
      await dialog.getByLabel("Kuota Pemakaian").fill("10");
      await dialog.getByLabel("Kuota per Pelanggan").fill("2");
      await dialog.getByRole("textbox", { name: "Cari produk" }).fill(produkUji.namaProduk);
      await dialog.getByRole("checkbox", { name: produkUji.namaProduk, exact: true }).first().click();
      await dialog.getByRole("checkbox", { name: /^Hitung per barang/ }).click();

      const tPost = tunggu(page, "POST", POLA_DISKON);
      await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
      const res = await tPost;
      expect(res.status(), "POST /diskon").toBe(201);
      const payload = res.request().postDataJSON();
      expect(payload).toMatchObject({
        namaDiskon: nama,
        cakupan: "Item",
        tipe: "nominal",
        nilai: 500,
        status: "Non-Aktif",
        jamMulai: "10:00",
        jamSelesai: "14:00",
        hariAktif: [1, 5],
        minimalBelanja: 1000,
        kuota: 10,
        kuotaPerPelanggan: 2,
        produkIDs: [idProduk],
        hitungPerBarang: true,
      });
      const mulai = new Date(payload.tanggalMulai);
      const berakhir = new Date(payload.tanggalBerakhir);
      expect([mulai.getFullYear(), mulai.getMonth(), mulai.getDate(), mulai.getHours()]).toEqual([
        kini.getFullYear(),
        kini.getMonth(),
        15,
        0,
      ]);
      expect([berakhir.getMonth(), berakhir.getDate(), berakhir.getHours()]).toEqual([
        kini.getMonth(),
        20,
        23,
      ]);
      await expect(dialog).toBeHidden({ timeout: 15_000 });

      const tersimpan = await diskonLewatApi(page, auth, nama);
      expect(tersimpan).toMatchObject({
        jamMulai: "10:00",
        jamSelesai: "14:00",
        hariAktif: [1, 5],
        minimalBelanja: 1000,
        kuota: 10,
        kuotaPerPelanggan: 2,
        hitungPerBarang: true,
      });
      expect(tersimpan.produkIDs.map(String)).toEqual([idProduk]);
      expect(tersimpan.tanggalMulai).toBe(payload.tanggalMulai);
    });

    await test.step("kolom Aturan", async () => {
      await pencarian(page).fill(nama);
      const b = baris(page, nama);
      await expect(b).toHaveCount(1, { timeout: 15_000 });
      await expect(b).toContainText("Berlaku mulai");
      await expect(b).toContainText("Jam 10:00 sampai 14:00");
      await expect(b).toContainText("Hari Sen, Jum");
      await expect(b).toContainText("Kuota 10 dari 10 tersisa");
      await expect(b).toContainText("Maksimal 2 kali per pelanggan");
      await expect(b).toContainText("1 produk tertentu");
      await expect(b).toContainText("Dihitung per barang");
    });

    await test.step("kosongkan sebagian aturan", async () => {
      await baris(page, nama).getByRole("button", { name: "Buka menu" }).click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
      const dialog = dialogForm(page);
      await expect(dialog.getByLabel("Kuota Pemakaian")).toHaveValue("10");
      await expect(dialog.getByRole("checkbox", { name: "Jum", exact: true })).toBeChecked();

      await dialog.getByLabel("Kuota Pemakaian").fill("");
      await dialog.getByRole("button", { name: "Kosongkan tanggal mulai" }).click();
      await dialog.getByRole("checkbox", { name: "Jum", exact: true }).click();

      const tPut = tunggu(page, "PUT", POLA_SATU);
      await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
      const res = await tPut;
      expect(res.status(), "PUT /diskon/:id").toBe(200);
      expect(res.request().postDataJSON()).toEqual({
        tanggalMulai: null,
        hariAktif: [1],
        kuota: null,
      });
      await expect(dialog).toBeHidden({ timeout: 15_000 });

      const tersimpan = await diskonLewatApi(page, auth, nama);
      expect(tersimpan.tanggalMulai).toBeNull();
      expect(tersimpan.kuota).toBeNull();
      expect(tersimpan.hariAktif).toEqual([1]);
      expect(tersimpan.jamMulai).toBe("10:00");
      await expect(baris(page, nama)).toContainText("Hari Sen");
      await expect(baris(page, nama)).not.toContainText("Kuota 10 dari 10 tersisa");
    });
  });

  test("jam yang hanya diisi satu dan kuota nol tidak dikirim, dan pesannya tampil", async ({ page }) => {
    await bukaDiskon(page);
    let jumlahPost = 0;
    const hitung = (r: { method(): string; url(): string }) => {
      if (r.method() === "POST" && POLA_DISKON.test(r.url())) jumlahPost++;
    };
    page.on("request", hitung);
    await page.getByRole("button", { name: "Tambah Diskon" }).click();
    const dialog = dialogForm(page);
    await dialog.getByLabel("Nama Diskon").fill("E2E Diskon Aturan Validasi " + unik());
    await dialog.getByLabel("Nilai Potongan").fill("10");
    await dialog.getByRole("button", { name: "Aturan tambahan" }).click();
    await isiJam(page, "Jam Mulai", "10", "00");
    await dialog.getByLabel("Kuota Pemakaian").fill("0");
    await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
    await expect(
      dialog.getByText("Jam mulai dan jam selesai harus diisi lengkap, atau keduanya dikosongkan."),
    ).toBeVisible();
    await expect(
      dialog.getByText("Kuota harus bilangan bulat minimal 1, atau dikosongkan."),
    ).toBeVisible();
    page.off("request", hitung);
    expect(jumlahPost).toBe(0);
    await dialog.getByRole("button", { name: "Tutup" }).click();
    await expect(dialog).toBeHidden();
  });
});