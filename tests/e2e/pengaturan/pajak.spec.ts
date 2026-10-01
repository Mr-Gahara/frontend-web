import { expect, test, type Locator, type Page } from "@playwright/test";
import { JAWAB_GAGAL, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { cocok, unik } from "../../helpers/reservasi-uji";
import { normalizeId } from "../../../lib/api/normalize";

/**
 * Spec pembanding pengaturan pajak, ditulis dan dijalankan terhadap halaman
 * lama sebelum migrasi (submodul pajak, keputusan PO1a). Hanya memuat
 * perilaku yang tidak berubah oleh PO6a sampai PO9a: daftar, buat, ubah, dan
 * hapus pajak per produk, simpan yang gagal, serta pasang dan lepas pajak
 * per produk pada produk uji khusus. Tabel relasi, prioritas, dan dialog
 * hapus yang gagal diuji di spec migrasi.
 *
 * Setiap operasi pajak yang diuji dijalankan lewat UI, termasuk membuat pajak
 * uji, agar tombol dan fungsi yang rusak ikut terlihat (pemilik proyek,
 * 1 Oktober 2026). API hanya dipakai untuk membaca bukti, menyiapkan produk
 * uji milik modul produk, dan membersihkan sisa run yang gagal.
 *
 * Data uji (PO10a): pajak per transaksi tidak pernah dibuat maupun
 * diaktifkan, agar PPN tenant uji tidak dinonaktifkan backend. Pajak uji per
 * produk bernama unik dan dihapus di akhir; hapus pajak ikut menghapus
 * relasinya. Produk uji dibuat sekali lalu dipakai ulang, karena memasang
 * pajak menimpa relasi produk itu (upsert per produk di
 * produkPajakService.assignPajak), sehingga produk lain tidak boleh dipakai.
 * Form buat lama menahan submit sampai prioritas diketik, sehingga spec
 * mengisinya; langkah itu menjadi pilihan saat migrasi (PO8a).
 */

const URL_PAJAK = "/dashboard/outlet/pengaturan/pajak";
const POLA_DAFTAR = /\/api\/pajak(\?|$)/i;
const POLA_BUAT = /\/api\/pajak$/i;
const POLA_DETAIL = /\/api\/pajak\/[a-f0-9]{24}$/i;
const POLA_PASANG = /\/api\/produkpajak$/i;
const POLA_RELASI = /\/api\/produkpajak\/[a-f0-9]{24}$/i;
const NAMA_PRODUK_UJI = "E2E Pajak Produk";
const NAMA_KATEGORI_UJI = "E2E Pajak Kategori";

type Hasil<T> = { status: number; data: T; pesan: string };

type PajakItem = {
  id: string;
  namaPajak: string;
  tarifPajak: number;
  tipePajak: boolean;
  modelPerhitungan: number;
  prioritas: number;
  statusPajak: boolean;
};

type RelasiItem = {
  id: string;
  produkID?: string;
  pajak: { id: string; nama: string; tarif: number };
};

type ProdukUji = { id: string; namaProduk: string };
type KategoriUji = { id: string; namaKategori: string };

const barisPajak = (page: Page, nama: string) =>
  page.getByRole("row").filter({ has: page.getByText(nama, { exact: true }) });

const pemicu = (page: Page, teks: string | RegExp) => page.getByRole("combobox").filter({ hasText: teks });

const cari = (page: Page, nama: string) => page.getByPlaceholder("Cari nama pajak...").fill(nama);

/** Isian tanpa label terhubung: div terdalam yang memuat teks label beserta input-nya. */
function isian(lingkup: Locator, label: string) {
  return lingkup
    .locator("div")
    .filter({ has: lingkup.page().getByText(label, { exact: true }) })
    .filter({ has: lingkup.page().locator("input") })
    .last()
    .locator("input");
}

function wajib<T>(r: Hasil<T>, label: string): T {
  expect(r.status, `${label}: ${r.status} ${r.pesan}`).toBeLessThan(300);
  return normalizeId(r.data) as T;
}

async function pastikanProdukUji(page: Page, auth: Auth): Promise<ProdukUji> {
  const daftar = wajib(await api<ProdukUji[]>(page, auth, "GET", "/produk"), "GET /produk");
  const ada = daftar.find((p) => p.namaProduk === NAMA_PRODUK_UJI);
  if (ada) return ada;
  const semuaKategori = wajib(await api<KategoriUji[]>(page, auth, "GET", "/kategori"), "GET /kategori");
  let kategori = semuaKategori.find((k) => k.namaKategori === NAMA_KATEGORI_UJI);
  if (!kategori) {
    kategori = wajib(
      await api<KategoriUji>(page, auth, "POST", "/kategori", {
        namaKategori: NAMA_KATEGORI_UJI,
        kodeKategori: "E2E-PJK",
        keterangan: "Kategori produk uji spec pajak",
      }),
      "POST kategori uji",
    );
  }
  return wajib(
    await api<ProdukUji>(page, auth, "POST", "/produk", {
      namaProduk: NAMA_PRODUK_UJI,
      hargaJual: 10000,
      hargaDasar: 5000,
      kategoriID: kategori.id,
      isUnlimitedStok: true,
    }),
    "POST produk uji",
  );
}

async function relasiProduk(page: Page, auth: Auth, produkId: string): Promise<RelasiItem[]> {
  return wajib(await api<RelasiItem[]>(page, auth, "GET", "/produkpajak/" + produkId), "GET /produkpajak");
}

async function lepasSemuaRelasi(page: Page, auth: Auth, produkId: string) {
  for (const r of await relasiProduk(page, auth, produkId)) {
    const d = await api(page, auth, "DELETE", "/produkpajak/" + r.id);
    expect(d.status, `lepas relasi sisa ${r.id}: ${d.pesan}`).toBe(200);
  }
}

/**
 * Membuat pajak per produk lewat dialog Tambah Pajak dengan nilai awal form.
 * Id dicatat lewat callback begitu respons diterima, agar pembersihan tetap
 * berjalan bila pemeriksaan sesudahnya gagal.
 */
async function buatLewatUi(page: Page, nama: string, tarif: string, catat: (id: string) => void) {
  await page.getByRole("button", { name: "Tambah Pajak" }).click();
  const dialog = page.getByRole("dialog", { name: "Tambah Pajak" });
  await isian(dialog, "Nama Pajak").fill(nama);
  await isian(dialog, "Tarif (%)").fill(tarif);
  await isian(dialog, "Prioritas").fill("1");
  const tJawab = page.waitForResponse(cocok("POST", POLA_BUAT));
  await dialog.getByRole("button", { name: "Simpan" }).click();
  const jawab = await tJawab;
  expect(jawab.status(), "POST /pajak").toBe(201);
  catat((normalizeId(((await jawab.json()) as { data: PajakItem }).data) as PajakItem).id);
  await expect(dialog).toBeHidden();
}

async function hapusPajakUji(page: Page, auth: Auth, id: string | undefined) {
  if (!id) return;
  const d = await api(page, auth, "DELETE", "/pajak/" + id);
  expect.soft([200, 404], `hapus pajak uji ${id}: ${d.status} ${d.pesan}`).toContain(d.status);
}

test.describe("E2E — Pengaturan pajak (pembanding)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar memuat GET /pajak dan menampilkan kolom serta isi baris", async ({ page }) => {
    await bukaDenganAuth(page, URL_PAJAK);
    await page.goto(URL_PAJAK, { waitUntil: "commit" });
    const res = await page.waitForResponse(cocok("GET", POLA_DAFTAR));
    expect(res.status()).toBe(200);
    const data = normalizeId(((await res.json()) as { data: PajakItem[] }).data) as PajakItem[];
    expect(data.length, "tenant uji punya minimal satu pajak").toBeGreaterThan(0);
    for (const kolom of ["Nama Pajak", "Tarif", "Model", "Prioritas", "Status", "Aksi"]) {
      await expect(page.getByRole("columnheader", { name: kolom, exact: true })).toBeVisible();
    }
    const p = data[0];
    await cari(page, p.namaPajak);
    const baris = barisPajak(page, p.namaPajak);
    await expect(baris).toHaveCount(1);
    await expect(baris).toContainText(`${p.tarifPajak}%`);
    await expect(baris.getByText(p.statusPajak ? "Aktif" : "Non-Aktif", { exact: true })).toBeVisible();
  });

  test("buat, ubah, lalu hapus pajak per produk lewat UI", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const nama = "E2E PJK " + unik();
    let id: string | undefined;
    try {
      await test.step("buat dengan nilai awal form", async () => {
        await buatLewatUi(page, nama, "5", (baru) => {
          id = baru;
        });
        const tersimpan = wajib(await api<PajakItem>(page, auth, "GET", "/pajak/" + id), "GET pajak uji");
        expect(tersimpan).toMatchObject({
          namaPajak: nama,
          tarifPajak: 5,
          tipePajak: true,
          modelPerhitungan: 2,
          prioritas: 1,
          statusPajak: true,
        });
        await cari(page, nama);
        const baris = barisPajak(page, nama);
        await expect(baris).toContainText("5%");
        await expect(baris).toContainText("Add-on (Eksklusif)");
        await expect(baris.getByText("Aktif", { exact: true })).toBeVisible();
      });

      await test.step("ubah tarif", async () => {
        const baris = barisPajak(page, nama);
        await baris.getByRole("button").click();
        await page.getByRole("menuitem", { name: "Edit" }).click();
        const dialog = page.getByRole("dialog", { name: "Edit Pajak" });
        const tarif = isian(dialog, "Tarif (%)");
        await expect(tarif).toHaveValue("5");
        await tarif.fill("7");
        const tJawab = page.waitForResponse(cocok("PUT", POLA_DETAIL));
        await dialog.getByRole("button", { name: "Simpan" }).click();
        expect((await tJawab).status()).toBe(200);
        await expect(dialog).toBeHidden();
        await expect(baris).toContainText("7%");
        const tersimpan = wajib(await api<PajakItem>(page, auth, "GET", "/pajak/" + id), "GET pajak uji");
        expect(tersimpan.tarifPajak).toBe(7);
        expect(tersimpan.tipePajak).toBe(true);
      });

      await test.step("hapus", async () => {
        const baris = barisPajak(page, nama);
        await baris.getByRole("button").click();
        await page.getByRole("menuitem", { name: "Hapus" }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toContainText(nama);
        const tJawab = page.waitForResponse(cocok("DELETE", POLA_DETAIL));
        await dialog.getByRole("button", { name: "Lanjutkan" }).click();
        expect((await tJawab).status()).toBe(200);
        await expect(baris).toHaveCount(0);
        const sesudah = await api(page, auth, "GET", "/pajak/" + id);
        expect(sesudah.status, "pajak terhapus dari backend").toBe(404);
        id = undefined;
      });
    } finally {
      await hapusPajakUji(page, auth, id);
    }
  });

  test("simpan yang gagal: dialog bertahan dengan pesan backend, tanpa data tersimpan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const nama = "E2E PJK " + unik();
    await page.route(POLA_BUAT, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    try {
      await page.getByRole("button", { name: "Tambah Pajak" }).click();
      const dialog = page.getByRole("dialog", { name: "Tambah Pajak" });
      await isian(dialog, "Nama Pajak").fill(nama);
      await isian(dialog, "Tarif (%)").fill("5");
      await isian(dialog, "Prioritas").fill("1");
      const tJawab = page.waitForResponse(cocok("POST", POLA_BUAT));
      await dialog.getByRole("button", { name: "Simpan" }).click();
      expect((await tJawab).status()).toBe(500);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("uji", { exact: true })).toBeVisible();
    } finally {
      await page.unroute(POLA_BUAT);
    }
    const daftar = wajib(await api<PajakItem[]>(page, auth, "GET", "/pajak"), "GET /pajak");
    expect(daftar.some((p) => p.namaPajak === nama), "tidak ada pajak tersimpan").toBe(false);
  });

  test("pajak per produk: pasang dan lepas pada produk uji; pajak per transaksi tidak ditawarkan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const produk = await pastikanProdukUji(page, auth);
    await lepasSemuaRelasi(page, auth, produk.id);
    const nama = "E2E PJK " + unik();
    let pajakId: string | undefined;
    try {
      await page.reload();
      await buatLewatUi(page, nama, "5", (baru) => {
        pajakId = baru;
      });
      const semua = wajib(await api<PajakItem[]>(page, auth, "GET", "/pajak"), "GET /pajak");
      const perTransaksi = semua.filter((p) => p.tipePajak === false);
      await page.getByRole("tab", { name: "Pajak per Produk" }).click();
      await pemicu(page, "Pilih produk").click();
      const tRelasi = page.waitForResponse(cocok("GET", POLA_RELASI));
      await page.getByRole("option", { name: NAMA_PRODUK_UJI, exact: true }).click();
      expect((await tRelasi).status()).toBe(200);
      await expect(page.getByRole("button", { name: "Lepas" })).toHaveCount(0);

      await pemicu(page, "Pilih pajak").click();
      await expect(page.getByRole("option", { name: `${nama} (5%)`, exact: true })).toBeVisible();
      for (const t of perTransaksi) {
        await expect(page.getByRole("option", { name: `${t.namaPajak} (${t.tarifPajak}%)`, exact: true })).toHaveCount(0);
      }
      await page.getByRole("option", { name: `${nama} (5%)`, exact: true }).click();

      const tKirim = page.waitForRequest((r) => r.method() === "POST" && POLA_PASANG.test(r.url()));
      const tPasang = page.waitForResponse(cocok("POST", POLA_PASANG));
      await page.getByRole("button", { name: "Assign" }).click();
      expect((await tKirim).postDataJSON()).toEqual({ produkID: produk.id, pajakID: pajakId });
      expect((await tPasang).status()).toBe(201);
      await expect(page.getByRole("button", { name: "Lepas" })).toHaveCount(1);
      const terpasang = await relasiProduk(page, auth, produk.id);
      expect(terpasang.map((r) => r.pajak.id)).toEqual([pajakId]);

      const tLepas = page.waitForResponse(cocok("DELETE", POLA_RELASI));
      await page.getByRole("button", { name: "Lepas" }).click();
      expect((await tLepas).status()).toBe(200);
      await expect(page.getByRole("button", { name: "Lepas" })).toHaveCount(0);
      expect(await relasiProduk(page, auth, produk.id)).toEqual([]);
    } finally {
      await hapusPajakUji(page, auth, pajakId);
    }
  });

  test("tombol kembali menuju halaman pengaturan", async ({ page }) => {
    await page.goto(URL_PAJAK);
    await page.getByRole("button", { name: "Kembali ke Laman Pengaturan" }).click();
    await expect(page).toHaveURL(/\/dashboard\/outlet\/pengaturan$/);
  });
});