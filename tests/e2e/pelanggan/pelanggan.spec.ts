import { test, expect, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { hapusLewatApi, unik } from "../../helpers/reservasi-uji";

/*
 * Spec pembanding halaman pelanggan, ditulis terhadap kode sebelum migrasi
 * (keputusan PD1a). Hanya memuat perilaku yang tidak berubah: daftar dari
 * data nyata, alur buat, ubah, dan hapus lewat UI (keputusan rancangan
 * butir 23), validasi nama kosong, dan penolakan nama kembar oleh backend.
 * Pelanggan uji bernama unik per run dan dihapus lewat UI; API hanya
 * membaca bukti dan, di finally, menghapus sisa bila test berhenti di
 * tengah. Hapus di backend adalah hapus lunak.
 */

const URL_PELANGGAN = BASIS + "/dashboard/outlet/pelanggan";
const POLA_DAFTAR = /\/api\/pelanggan$/i;
const POLA_SATU = /\/api\/pelanggan\/[0-9a-f]{24}$/i;

type PelangganMentah = {
  id: string;
  namaPelanggan: string;
  tipePelanggan: string;
  nomorHp: string | null;
  email: string | null;
  alamat: string | null;
};

const isianNama = (page: Page) => page.getByPlaceholder("Misal: Budi Santoso");
const isianHp = (page: Page) => page.getByPlaceholder("Misal: 08123456789");
const isianEmail = (page: Page) => page.getByPlaceholder("Misal: budi@email.com");
const isianAlamat = (page: Page) => page.getByPlaceholder("Misal: Jl. Sudirman No. 123");
const pencarian = (page: Page) => page.getByPlaceholder("Cari nama pelanggan...");
const baris = (page: Page, nama: string) => page.locator("tbody tr").filter({ hasText: nama });

const tunggu = (page: Page, method: string, pola: RegExp) =>
  page.waitForResponse((r) => r.request().method() === method && pola.test(r.url()));

async function daftarPelanggan(page: Page, auth: Auth): Promise<PelangganMentah[]> {
  const r = await api<PelangganMentah[]>(page, auth, "GET", "/pelanggan");
  expect(r.status, r.pesan).toBe(200);
  return r.data;
}

async function bukaPelanggan(page: Page): Promise<Auth> {
  const auth = await bukaDenganAuth(page, URL_PELANGGAN);
  await expect(page.getByRole("heading", { name: "Manajemen Pelanggan" })).toBeVisible({
    timeout: 15_000,
  });
  return auth;
}

/** Mengirim form tambah yang sudah diisi: simpan, lalu konfirmasi. */
async function kirimFormTambah(page: Page) {
  await page.getByRole("button", { name: "Simpan Pelanggan" }).click();
  await expect(page.getByText("Simpan Pelanggan Baru?")).toBeVisible();
  const tPost = tunggu(page, "POST", POLA_DAFTAR);
  await page.getByRole("button", { name: "Ya, Simpan" }).click();
  return tPost;
}

test.describe("Pelanggan", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar menampilkan jumlah pelanggan sesuai data tersimpan", async ({ page }) => {
    const auth = await bukaPelanggan(page);
    const daftar = await daftarPelanggan(page, auth);
    await expect(page.getByText(`${daftar.length} total data`)).toBeVisible({ timeout: 15_000 });
  });

  test("alur: pelanggan dibuat, diubah, lalu dihapus lewat halaman", async ({ page }) => {
    const auth = await bukaPelanggan(page);
    const akhiran = unik();
    const nama = "E2E Pelanggan " + akhiran;
    const namaBaru = nama + " Ubah";
    const nomorHp = "08" + String(Date.now()).slice(-10);
    const email = `e2e-${akhiran}@contoh.id`;
    const alamat = "Jl. E2E Pelanggan " + akhiran;
    let id: string | undefined;

    try {
      await test.step("buat", async () => {
        await isianNama(page).fill(nama);
        await page.getByRole("combobox").filter({ hasText: "Umum" }).click();
        await page.getByRole("option", { name: "Member" }).click();
        await isianHp(page).fill(nomorHp);
        await isianEmail(page).fill(email);
        await isianAlamat(page).fill(alamat);
        const res = await kirimFormTambah(page);
        expect(res.status(), "POST /pelanggan").toBe(201);
        expect(res.request().postDataJSON()).toEqual({
          namaPelanggan: nama,
          tipePelanggan: "member",
          nomorHp,
          email,
          alamat,
        });
        const tersimpan = (await daftarPelanggan(page, auth)).find((p) => p.namaPelanggan === nama);
        expect(tersimpan, "pelanggan baru terbaca lewat API").toBeTruthy();
        id = tersimpan?.id;
        expect(tersimpan).toMatchObject({ tipePelanggan: "member", nomorHp, email, alamat });

        await pencarian(page).fill(nama);
        await expect(baris(page, nama)).toHaveCount(1, { timeout: 15_000 });
        await expect(baris(page, nama)).toContainText(nomorHp);
        await expect(baris(page, nama)).toContainText(email);
        await expect(baris(page, nama)).toContainText(alamat);
        await expect(baris(page, nama)).toContainText("member");
      });

      await test.step("ubah", async () => {
        await baris(page, nama).getByRole("button", { name: "Buka menu" }).click();
        await page.getByRole("menuitem", { name: "Edit" }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByText("Edit Pelanggan")).toBeVisible();
        await expect(dialog.getByPlaceholder("Misal: Budi Santoso")).toHaveValue(nama);
        await dialog.getByPlaceholder("Misal: Budi Santoso").fill(namaBaru);
        const tPut = tunggu(page, "PUT", POLA_SATU);
        await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
        const res = await tPut;
        expect(res.status(), "PUT /pelanggan/:id").toBe(200);
        expect(res.request().postDataJSON()).toMatchObject({ namaPelanggan: namaBaru });
        await expect(dialog).toBeHidden({ timeout: 15_000 });
        const tersimpan = (await daftarPelanggan(page, auth)).find((p) => p.id === id);
        expect(tersimpan?.namaPelanggan).toBe(namaBaru);
        await pencarian(page).fill(namaBaru);
        await expect(baris(page, namaBaru)).toHaveCount(1, { timeout: 15_000 });
      });

      await test.step("hapus", async () => {
        await baris(page, namaBaru).getByRole("button", { name: "Buka menu" }).click();
        await page.getByRole("menuitem", { name: "Hapus" }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog.getByText(`Hapus pelanggan ${namaBaru}?`)).toBeVisible();
        const tDelete = tunggu(page, "DELETE", POLA_SATU);
        await dialog.getByRole("button", { name: "Hapus", exact: true }).click();
        expect((await tDelete).status(), "DELETE /pelanggan/:id").toBe(200);
        await expect(baris(page, namaBaru)).toHaveCount(0, { timeout: 15_000 });
        const sisa = (await daftarPelanggan(page, auth)).some((p) => p.id === id);
        expect(sisa, "pelanggan tidak lagi ada di daftar API").toBe(false);
        id = undefined;
      });
    } finally {
      await hapusLewatApi(page, auth, "/pelanggan", id);
    }
  });

  test("nama berisi spasi saja tidak dikirim dan pesannya tampil", async ({ page }) => {
    await bukaPelanggan(page);
    let jumlahPost = 0;
    const hitung = (r: { method(): string; url(): string }) => {
      if (r.method() === "POST" && POLA_DAFTAR.test(r.url())) jumlahPost++;
    };
    page.on("request", hitung);
    await isianNama(page).fill("   ");
    await page.getByRole("button", { name: "Simpan Pelanggan" }).click();
    await expect(page.getByText("Nama pelanggan wajib diisi.")).toBeVisible();
    await expect(page.getByText("Simpan Pelanggan Baru?")).toHaveCount(0);
    page.off("request", hitung);
    expect(jumlahPost).toBe(0);
  });

  test("nama yang sudah terdaftar ditolak backend dan pesannya tampil", async ({ page }) => {
    const auth = await bukaPelanggan(page);
    const daftar = await daftarPelanggan(page, auth);
    test.skip(daftar.length === 0, "Tidak ada pelanggan untuk diuji nama kembarnya");
    const sudahAda = daftar[0].namaPelanggan;
    await isianNama(page).fill(sudahAda);
    const res = await kirimFormTambah(page);
    expect(res.status(), "POST /pelanggan dengan nama kembar").toBe(400);
    const pesan = String((await res.json()).message);
    expect(pesan).toContain(sudahAda);
    await expect(page.getByRole("main").getByText(pesan)).toBeVisible({ timeout: 15_000 });
    const sesudah = await daftarPelanggan(page, auth);
    expect(sesudah.length).toBe(daftar.length);
  });
});