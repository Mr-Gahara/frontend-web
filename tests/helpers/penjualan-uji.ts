import { expect, type Page } from "@playwright/test";
import { normalizeId } from "@/lib/api/normalize";
import { api, BASIS, type Auth } from "./transfer-uji";

/**
 * Fixture tetap untuk spec alur penjualan. Bahan baku dan produk uji dibuat
 * sekali bila belum ada, lalu nilainya disetel ulang di awal setiap test.
 * Fixture tidak dihapus setelah dipakai, karena hapus bahan baku di backend
 * hanya menghapus master dan meninggalkan inventory serta jurnal yatim.
 *
 * Resep produk uji: TAKARAN pcs bahan uji per unit produk.
 */
export const NAMA_BAHAN = "E2E Penjualan Bahan";
export const NAMA_PRODUK = "E2E Penjualan Produk";
export const TAKARAN = 2;

export type Fixture = {
  outletId: string;
  bahanId: string;
  produkId: string;
  kategoriId: string;
  inventoryId: string;
};

export type PenjualanUji = {
  id: string;
  noReferensi: string;
  statusPenjualan: string;
  statusBayar: string;
  totalTagihan: number;
  totalDibayar: number;
  sisaTagihan: number;
};

type Hasil<T> = { status: number; data: T; pesan: string };
type Lokasi = { id: string; tipe: string } | null;
type BahanBaku = { id: string; namaBahan: string };
type ItemInventory = { id: string; stok: number; item: { id: string } | null; lokasi: { id: string } | null };
type Kategori = { id: string };
type ProdukUji = { id: string; namaProduk: string; stok: number };
type Jurnal = {
  id: string;
  jumlah: number;
  tipeKoreksi: string;
  keterangan: string;
  createdAt: string;
  bahanBakuID: { id: string } | null;
  locationID: { id: string } | null;
};

function wajib<T>(r: Hasil<T>, label: string): T {
  expect(r.status, `${label}: ${r.status} ${r.pesan}`).toBeLessThan(300);
  return normalizeId(r.data);
}

async function inventoryBahan(page: Page, auth: Auth, outletId: string, bahanId: string) {
  const daftar = wajib(
    await api<ItemInventory[]>(page, auth, "GET", `/inventory?locationID=${outletId}`),
    "GET /inventory",
  );
  return daftar.find((i) => i.item?.id === bahanId && i.lokasi?.id === outletId);
}

export async function stokOutlet(page: Page, auth: Auth, fx: Fixture): Promise<number> {
  const inv = await inventoryBahan(page, auth, fx.outletId, fx.bahanId);
  expect(inv, "inventory bahan uji di outlet tenant").toBeTruthy();
  return inv!.stok;
}

export async function stokProduk(page: Page, auth: Auth, fx: Fixture): Promise<number> {
  const produk = wajib(await api<ProdukUji>(page, auth, "GET", `/produk/${fx.produkId}`), "GET produk uji");
  return produk.stok;
}

/** Menyetel stok bahan uji di outlet tenant lewat opname. */
export async function setelStokOutlet(page: Page, auth: Auth, fx: Fixture, stok: number) {
  wajib(
    await api(page, auth, "POST", `/inventory/${fx.inventoryId}/opname`, {
      fisikAktual: stok,
      catatan: "Persiapan e2e penjualan",
    }),
    "opname bahan uji",
  );
  expect(await stokOutlet(page, auth, fx), "stok outlet setelah opname").toBe(stok);
}

async function simpanProduk(page: Page, auth: Auth, bahanId: string, kategoriId: string, produkId?: string) {
  const body = {
    namaProduk: NAMA_PRODUK,
    hargaJual: 10000,
    hargaDasar: 4000,
    kategoriID: kategoriId,
    resep: [{ bahanBakuID: bahanId, jumlah: TAKARAN, satuan: "pcs" }],
  };
  if (produkId) return wajib(await api<ProdukUji>(page, auth, "PUT", `/produk/${produkId}`, body), "PUT produk uji");
  return wajib(await api<ProdukUji>(page, auth, "POST", "/produk", body), "POST produk uji");
}

/**
 * Menyetel stok master bahan uji, lalu menyimpan ulang resep produk agar
 * backend menghitung ulang produk.stok dari stok master itu. produk.stok
 * adalah angka tingkat tenant yang tidak terhubung ke lokasi mana pun
 * (kontrak/temuan.md butir 37), tetapi ikut diperiksa saat finalisasi.
 */
export async function setelStokProduk(page: Page, auth: Auth, fx: Fixture, stokMaster: number) {
  wajib(
    await api(page, auth, "PUT", `/bahanbaku/${fx.bahanId}`, { namaBahan: NAMA_BAHAN, satuan: "pcs", stok: stokMaster }),
    "PUT bahan uji",
  );
  await simpanProduk(page, auth, fx.bahanId, fx.kategoriId, fx.produkId);
  expect(await stokProduk(page, auth, fx), "produk.stok dihitung ulang dari stok master").toBe(
    Math.floor(stokMaster / TAKARAN),
  );
}

export async function siapkanFixture(page: Page, auth: Auth, stokAwal: number): Promise<Fixture> {
  const lokasi = wajib(await api<Lokasi>(page, auth, "GET", "/location/current"), "GET /location/current");
  expect(lokasi, "tenant harus punya outlet").toBeTruthy();
  const outletId = lokasi!.id;

  const semuaBahan = wajib(await api<BahanBaku[]>(page, auth, "GET", "/bahanbaku"), "GET /bahanbaku");
  let bahan = semuaBahan.find((b) => b.namaBahan === NAMA_BAHAN);
  if (!bahan) {
    bahan = wajib(
      await api<BahanBaku>(page, auth, "POST", "/bahanbaku", {
        namaBahan: NAMA_BAHAN,
        satuan: "pcs",
        stok: stokAwal,
        stokMinimum: 0,
        locationID: outletId,
      }),
      "POST bahan uji",
    );
  }
  const inv = await inventoryBahan(page, auth, outletId, bahan.id);
  expect(inv, "bahan uji harus punya inventory di outlet tenant").toBeTruthy();

  const kategori = wajib(await api<Kategori[]>(page, auth, "GET", "/kategori"), "GET /kategori");
  expect(kategori.length, "tenant harus punya minimal satu kategori").toBeGreaterThan(0);

  const semuaProduk = wajib(await api<ProdukUji[]>(page, auth, "GET", "/produk"), "GET /produk");
  const ada = semuaProduk.find((p) => p.namaProduk === NAMA_PRODUK);
  const produkId = ada?.id ?? (await simpanProduk(page, auth, bahan.id, kategori[0].id)).id;

  const fx: Fixture = { outletId, bahanId: bahan.id, produkId, kategoriId: kategori[0].id, inventoryId: inv!.id };
  await setelStokProduk(page, auth, fx, stokAwal);
  await setelStokOutlet(page, auth, fx, stokAwal);
  return fx;
}

/** Jurnal stok bahan uji dengan keterangan penjualan produk uji sejumlah itu. */
export async function jurnalPenjualan(page: Page, auth: Auth, fx: Fixture, jumlahJual: number) {
  const semua = wajib(await api<Jurnal[]>(page, auth, "GET", "/jurnalstok"), "GET /jurnalstok");
  const keterangan = `Penjualan ${NAMA_PRODUK} x${jumlahJual}`;
  return semua.filter((j) => j.bahanBakuID?.id === fx.bahanId && j.keterangan === keterangan);
}

export async function detailPenjualan(page: Page, auth: Auth, id: string): Promise<PenjualanUji> {
  return wajib(await api<PenjualanUji>(page, auth, "GET", `/penjualan/${id}`), "GET detail penjualan");
}

/** Menghapus penjualan uji yang masih DRAFT; FINAL dan VOID memang tidak dapat dihapus. */
export async function hapusDraft(page: Page, auth: Auth, id: string) {
  const r = await api<PenjualanUji>(page, auth, "GET", `/penjualan/${id}`);
  if (r.status !== 200 || r.data?.statusPenjualan !== "DRAFT") return;
  const hapus = await api(page, auth, "DELETE", `/penjualan/${id}`);
  expect.soft(hapus.status, `hapus draf uji: ${hapus.pesan}`).toBe(200);
}

/** Membuat penjualan DRAFT lewat halaman buat; id dan nomor diambil dari respons POST. */
export async function buatDraftLewatUi(page: Page, jumlah: number): Promise<PenjualanUji> {
  await page.goto(BASIS + "/dashboard/outlet/penjualan/buatPenjualan");
  await expect(page.getByRole("heading", { name: /buat penjualan/i })).toBeVisible();

  await page.getByRole("combobox").filter({ hasText: /pilih pelanggan/i }).click();
  await page.getByPlaceholder("Cari pelanggan...").fill("a");
  await page.getByRole("option").first().click();

  await page.getByRole("combobox").filter({ hasText: /pilih produk/i }).click();
  await page.getByPlaceholder("Cari produk...").fill(NAMA_PRODUK);
  await page.getByRole("option", { name: new RegExp(NAMA_PRODUK) }).first().click();

  const inputJumlah = page.getByLabel(/jumlah/i).first();
  await inputJumlah.clear();
  await inputJumlah.fill(String(jumlah));
  await inputJumlah.blur();

  const keterangan = page.getByLabel(/keterangan/i);
  await keterangan.fill(`E2E alur penjualan ${Date.now()}`);
  await keterangan.press("Enter");
  await expect(page.getByRole("alertdialog")).toBeVisible();

  const tunggu = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/api\/penjualan(\?|$)/i.test(r.url()),
  );
  await page.getByRole("button", { name: /ya, lanjutkan/i }).click();
  const res = await tunggu;
  const body = await res.json().catch(() => ({}));
  expect(res.status(), `POST /penjualan: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
  return normalizeId(body.data as PenjualanUji);
}