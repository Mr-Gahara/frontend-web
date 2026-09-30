import { expect, test, type Page } from "@playwright/test";
import { JAWAB_GAGAL, login } from "../../helpers/transfer-uji";
import { cocok, pantauPermintaan, unik } from "../../helpers/reservasi-uji";

/*
 * Spec pembanding metode pembayaran (modul Pengaturan outlet, submodul 1,
 * keputusan PO1a). Hanya memuat perilaku yang tetap setelah migrasi dan lolos
 * terhadap kode lama: daftar dari respons nyata, navigasi, isian form ubah
 * dari detail, penolakan akun kosong di klien, serta galat backend yang
 * tampil. Buat dan ubah yang berhasil, aktifkan dan nonaktifkan, serta hapus
 * rusak di kode lama (kontrak/temuan.md butir 82 dan 84) dan diuji di commit
 * migrasi. Tidak ada data yang ditulis: POST dan PUT dijawab gagal lewat
 * page.route.
 */

const URL_DAFTAR = "/dashboard/outlet/pengaturan/metodePembayaran";
const URL_BUAT = URL_DAFTAR + "/buatMetodePembayaran";
const POLA_DAFTAR = /\/api\/metodepembayaran(\?|$)/i;
const POLA_BUAT = /\/api\/metodepembayaran$/i;
const POLA_DETAIL = /\/api\/metodepembayaran\/[a-f0-9]{24}$/i;
const PLACEHOLDER_NAMA = "Misal: Transfer Bank Mandiri";

type MetodeMentah = {
  id: string;
  namaPembayaran: string;
  kategori: "tunai" | "non-tunai";
  isActive: boolean;
  akunKas: { id: string; namaAkun: string | null; nomorAkun: string | null } | null;
};

async function bukaDaftar(page: Page) {
  await page.goto(URL_DAFTAR, { waitUntil: "commit" });
  const res = await page.waitForResponse(cocok("GET", POLA_DAFTAR));
  expect(res.status(), "GET daftar metode pembayaran").toBe(200);
  return ((await res.json()) as { data: MetodeMentah[] }).data;
}

const barisMetode = (page: Page, nama: string) =>
  page.getByRole("row").filter({ has: page.getByText(nama, { exact: true }) });

const pemicu = (page: Page, teks: string | RegExp) => page.getByRole("combobox").filter({ hasText: teks });

function metodeTunaiAktif(daftar: MetodeMentah[]) {
  const m = daftar.find((x) => x.isActive && x.kategori === "tunai" && x.akunKas?.namaAkun);
  expect(m, "tenant uji punya metode tunai aktif berakun kas").toBeTruthy();
  return m!;
}

test.describe("E2E — Pengaturan metode pembayaran (pembanding)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar menampilkan nama, kategori, akun tujuan, dan status setiap metode dari backend", async ({ page }) => {
    const daftar = await bukaDaftar(page);
    expect(daftar.length, "tenant uji punya metode pembayaran").toBeGreaterThan(0);
    for (const m of daftar.slice(0, 10)) {
      const baris = barisMetode(page, m.namaPembayaran);
      await expect(baris).toHaveCount(1);
      const kategori = m.kategori === "tunai" ? "Tunai" : "Non Tunai";
      await expect(baris.getByText(kategori, { exact: true }).first()).toBeVisible();
      if (m.akunKas?.namaAkun) await expect(baris.getByText(m.akunKas.namaAkun, { exact: true })).toBeVisible();
      if (m.akunKas?.nomorAkun) await expect(baris.getByText(m.akunKas.nomorAkun, { exact: true })).toBeVisible();
      await expect(baris.getByText(m.isActive ? "Aktif" : "Non-Aktif", { exact: true })).toBeVisible();
    }
  });

  test("tombol tambah membuka halaman buat, dan menu Edit membuka halaman ubah metode itu", async ({ page }) => {
    const m = metodeTunaiAktif(await bukaDaftar(page));
    await page.getByText("Tambah Metode", { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(URL_BUAT + "$"));
    await page.goBack();
    const baris = barisMetode(page, m.namaPembayaran);
    await expect(baris).toHaveCount(1);
    await baris.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page).toHaveURL(new RegExp(URL_DAFTAR + "/" + m.id + "$"));
  });

  test("halaman ubah terisi dari detail, dan simpan nonaktif selama belum ada perubahan", async ({ page }) => {
    const m = metodeTunaiAktif(await bukaDaftar(page));
    await page.goto(URL_DAFTAR + "/" + m.id, { waitUntil: "commit" });
    const res = await page.waitForResponse(cocok("GET", POLA_DETAIL));
    const detail = ((await res.json()) as { data: MetodeMentah }).data;
    await expect(page.getByPlaceholder(PLACEHOLDER_NAMA)).toHaveValue(detail.namaPembayaran);
    await expect(pemicu(page, /^Tunai$/)).toHaveCount(1);
    await expect(pemicu(page, detail.akunKas!.namaAkun!)).toHaveCount(1);
    await expect(pemicu(page, /^Aktif$/)).toHaveCount(1);
    await expect(page.getByRole("button", { name: /simpan perubahan/i })).toBeDisabled();
  });

  test("buat tanpa akun tujuan ditolak dengan pesan tanpa mengirim permintaan", async ({ page }) => {
    await page.goto(URL_BUAT);
    await expect(pemicu(page, /pilih akun kas/i)).toBeEnabled();
    await page.getByPlaceholder(PLACEHOLDER_NAMA).fill("E2E Metode " + unik());
    const pantau = pantauPermintaan(page, "POST", POLA_BUAT);
    await page.getByRole("button", { name: /simpan metode/i }).click();
    await expect(page.getByText("Akun Tujuan wajib dipilih.")).toBeVisible();
    expect(pantau.jumlah(), "tidak ada POST metode pembayaran").toBe(0);
    pantau.lepas();
  });

  test("buat yang ditolak backend menampilkan pesannya dan tetap di halaman buat", async ({ page }) => {
    await page.route(POLA_BUAT, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_BUAT);
    await page.getByPlaceholder(PLACEHOLDER_NAMA).fill("E2E Metode " + unik());
    await pemicu(page, /pilih akun kas/i).click();
    await page.getByRole("option").first().click();
    const tKirim = page.waitForRequest((r) => r.method() === "POST" && POLA_BUAT.test(r.url()));
    await page.getByRole("button", { name: /simpan metode/i }).click();
    await tKirim;
    await expect(page.getByRole("main").getByText("uji", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(URL_BUAT + "$"));
  });

  test("ubah yang ditolak backend menampilkan pesannya dan tetap di halaman ubah", async ({ page }) => {
    const m = metodeTunaiAktif(await bukaDaftar(page));
    await page.route(POLA_DETAIL, (route) =>
      route.request().method() === "PUT" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_DAFTAR + "/" + m.id);
    const nama = page.getByPlaceholder(PLACEHOLDER_NAMA);
    await expect(nama).toHaveValue(m.namaPembayaran);
    await nama.fill(m.namaPembayaran + " E2E");
    const tKirim = page.waitForRequest((r) => r.method() === "PUT" && POLA_DETAIL.test(r.url()));
    await page.getByRole("button", { name: /simpan perubahan/i }).click();
    expect((await tKirim).postDataJSON().namaPembayaran).toBe(m.namaPembayaran + " E2E");
    await expect(page.getByRole("main").getByText("uji", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(m.id + "$"));
  });
});