import { test, expect, type Page } from "@playwright/test";
import { normalizeId } from "@/lib/api/normalize";
import { masuk } from "../../../helpers/masuk-uji";
import { api, bukaDenganAuth, BASIS, type Auth } from "../../../helpers/transfer-uji";
import { NAMA_PRODUK, TAKARAN, setelStokOutlet, siapkanFixture } from "../../../helpers/penjualan-uji";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, kredensialAdmin, wajibAdmin } from "../../../helpers/admin-uji";
import { akunBaru, isiTokoDanOwner } from "../../../helpers/setup-uji";

/*
 * Pembuktian web atas B169 dan B170 (backend ridho 4a19be8, AR31; status
 * `Menunggu verifikasi` di docs/pengembangan/klien.md backend).
 *
 * B169: stok produk beresep di GET /produk dan /produk/:id dihitung saat
 * dibaca dari stok bahan di outlet. Sebelumnya angkanya potret saat produk
 * disimpan (kontrak/temuan.md butir 37), sehingga spec ini hanya mengubah
 * stok bahan lewat opname inventory (data milik modul lain, keputusan
 * rancangan butir 23) dan tidak pernah menyimpan ulang produknya; updatedAt
 * produk yang tidak berubah membuktikannya.
 *
 * B170: GET /produk/:id dengan id rusak dijawab 404, bukan 500, dan cache
 * detail produk diperiksa per toko, sehingga produk toko lain yang masih di
 * cache tetap 404.
 */

type ProdukMentah = { id: string; namaProduk: string; stok: number; updatedAt: string };

const STOK_AWAL = 10;
const URL_DAFTAR = BASIS + "/dashboard/outlet/inventaris/produk";
const urlEdit = (id: string) => `${URL_DAFTAR}/${id}/edit`;

async function bacaProduk(page: Page, auth: Auth, id: string): Promise<ProdukMentah> {
  const r = await api<ProdukMentah>(page, auth, "GET", "/produk/" + id);
  expect(r.status, "GET /produk/:id: " + r.pesan).toBe(200);
  return normalizeId(r.data);
}

/** Stok produk uji di daftar produk lewat pencarian server (PV1a). */
async function stokDiDaftar(page: Page): Promise<void> {
  const cari = page.getByPlaceholder(/cari nama produk/i);
  const tCari = page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      /\/api\/produk\?/.test(r.url()) &&
      new URL(r.url()).searchParams.get("cari") === NAMA_PRODUK,
  );
  await cari.fill(NAMA_PRODUK);
  expect((await tCari).status(), "GET /produk?cari=").toBe(200);
}

test.describe("Stok produk beresep dan detail produk (B169, B170)", () => {
  test("B169: stok produk beresep mengikuti stok bahan outlet tanpa produk disimpan ulang", async ({ page }) => {
    await masuk(page);
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixture(page, auth, STOK_AWAL);
    try {
      // Detail dibaca lebih dulu agar jalur detail ter-cache (120 detik) ikut diuji.
      const awal = await bacaProduk(page, auth, fx.produkId);
      expect(awal.stok, "stok awal dari stok bahan outlet").toBe(Math.floor(STOK_AWAL / TAKARAN));

      const STOK_BARU = 7;
      await setelStokOutlet(page, auth, fx, STOK_BARU);
      const harapan = Math.floor(STOK_BARU / TAKARAN);

      const sesudah = await bacaProduk(page, auth, fx.produkId);
      expect(sesudah.updatedAt, "produk tidak disimpan ulang").toBe(awal.updatedAt);
      expect(sesudah.stok, "detail ter-cache dihitung ulang dari stok bahan").toBe(harapan);

      const daftar = await api<ProdukMentah[]>(page, auth, "GET", "/produk?cari=" + encodeURIComponent(NAMA_PRODUK));
      expect(daftar.status, "GET /produk?cari=: " + daftar.pesan).toBe(200);
      expect(normalizeId(daftar.data).find((p) => p.id === fx.produkId)?.stok, "stok di daftar produk").toBe(harapan);

      const rusak = await api(page, auth, "GET", "/produk?locationID=bukan-id");
      expect(rusak.status, "locationID rusak ditolak").toBe(400);

      // Tampilan: daftar produk dimuat ulang (cache klien 5 menit) lalu dicari.
      await page.reload({ waitUntil: "commit" });
      await expect(page.getByRole("heading", { name: /data produk/i })).toBeVisible({ timeout: 15_000 });
      await stokDiDaftar(page);
      const baris = page.getByRole("row", { name: new RegExp(NAMA_PRODUK, "i") }).first();
      await expect(baris).toContainText(`${harapan} item`);

      // Detail yang diminta halaman ubah membawa angka terkini. Isiannya sendiri
      // tidak dibandingkan: form memaksa stok 0 selama produk punya resep
      // (form-produk.tsx, Manajemen Paksa Stok), sehingga tidak menampilkan stok.
      const tDetail = page.waitForResponse(
        (r) => r.request().method() === "GET" && r.url().endsWith("/api/produk/" + fx.produkId),
      );
      await page.goto(urlEdit(fx.produkId), { waitUntil: "commit" });
      const detail = await tDetail;
      expect(detail.status(), "GET /produk/:id halaman ubah").toBe(200);
      expect((await detail.json()).data?.stok, "stok di detail halaman ubah").toBe(harapan);
      await expect(page.locator("#stok")).toBeDisabled({ timeout: 15_000 });
    } finally {
      await setelStokOutlet(page, auth, fx, STOK_AWAL);
    }
  });

  test("B170: id produk rusak di halaman ubah dijawab 404 dan pesannya tampil", async ({ page }) => {
    await masuk(page);
    const tDetail = page.waitForResponse(
      (r) => r.request().method() === "GET" && r.url().endsWith("/api/produk/bukan-id-produk"),
    );
    await page.goto(urlEdit("bukan-id-produk"), { waitUntil: "commit" });
    expect((await tDetail).status(), "id rusak 404, bukan 500").toBe(404);
    await expect(page.getByText("Produk tidak ditemukan.", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Memuat detail produk...")).toHaveCount(0);
  });

  test.describe("toko lain", () => {
    test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);
    test.describe.configure({ timeout: 120_000 });

    test("B170: produk toko lain yang masih di cache dijawab 404", async ({ page, browser }) => {
      // Toko kedua sekali pakai (pemilik proyek, 18 November 2026): akun dari API
      // admin, nama toko dan Owner lewat wizard, lalu akunnya dihapus.
      const lain = await browser.newContext();
      const halamanLain = await lain.newPage();
      const { id: idAkun } = await akunBaru(halamanLain, "toko-lain");
      try {
        await isiTokoDanOwner(halamanLain);

        // Toko uji membuka produknya lebih dulu, sehingga detailnya masuk cache.
        await masuk(page);
        const auth = await bukaDenganAuth(page, URL_DAFTAR);
        const fx = await siapkanFixture(page, auth, STOK_AWAL);
        await bacaProduk(page, auth, fx.produkId);

        const tDetail = halamanLain.waitForResponse(
          (r) => r.request().method() === "GET" && r.url().endsWith("/api/produk/" + fx.produkId),
        );
        await halamanLain.goto(urlEdit(fx.produkId), { waitUntil: "commit" });
        expect((await tDetail).status(), "produk toko lain 404").toBe(404);
        await expect(halamanLain.getByText("Produk tidak ditemukan.", { exact: true })).toBeVisible({
          timeout: 15_000,
        });
        await expect(halamanLain.locator("#namaProduk")).toHaveCount(0);
      } finally {
        await lain.close();
        await hapusAkunKlienUji(idAkun, wajibAdmin());
      }
    });
  });
});
