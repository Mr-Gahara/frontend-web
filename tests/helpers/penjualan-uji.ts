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
  jumlahDiskonTransaksi?: number;
  itemPenjualan?: { jumlahDiskon: number }[];
  /** Hanya di detail (backend 465b438). */
  pembayaran?: { id: string; status: string; catatan: string | null; namaMetodePembayaran: string | null }[];
};

export type MetodeUji = {
  id: string;
  namaPembayaran: string;
  isActive: boolean;
  akunKas: { id: string; namaAkun: string | null; nomorAkun: string | null } | null;
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

async function simpanProduk(
  page: Page,
  auth: Auth,
  bahanId: string,
  kategoriId: string,
  outletId: string,
  produkId?: string,
) {
  const body = {
    namaProduk: NAMA_PRODUK,
    hargaJual: 10000,
    hargaDasar: 4000,
    kategoriID: kategoriId,
    resep: [{ bahanBakuID: bahanId, jumlah: TAKARAN, satuan: "pcs" }],
    locationID: outletId,
  };
  if (produkId) return wajib(await api<ProdukUji>(page, auth, "PUT", `/produk/${produkId}`, body), "PUT produk uji");
  return wajib(await api<ProdukUji>(page, auth, "POST", "/produk", body), "POST produk uji");
}

/**
 * Menyetel produk.stok lewat stok bahan uji di outlet tenant: stok outlet
 * diopname ke nilai itu, lalu resep produk disimpan ulang dengan locationID
 * outlet, sehingga backend menghitung produk.stok dari inventory outlet
 * (backend yoga 5eb72e5). produk.stok tetap potret saat produk disimpan:
 * opname, transfer, dan penerimaan sesudahnya tidak mengubahnya
 * (kontrak/temuan.md butir 37), tetapi ia ikut diperiksa saat finalisasi.
 * Stok outlet berakhir di nilai yang sama; ubah lewat setelStokOutlet
 * sesudahnya bila skenario butuh kedua angka berbeda.
 */
export async function setelStokProduk(page: Page, auth: Auth, fx: Fixture, stok: number) {
  await setelStokOutlet(page, auth, fx, stok);
  await simpanProduk(page, auth, fx.bahanId, fx.kategoriId, fx.outletId, fx.produkId);
  expect(await stokProduk(page, auth, fx), "produk.stok dihitung dari stok outlet saat produk disimpan").toBe(
    Math.floor(stok / TAKARAN),
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
  const produkId = ada?.id ?? (await simpanProduk(page, auth, bahan.id, kategori[0].id, outletId)).id;

  const fx: Fixture = { outletId, bahanId: bahan.id, produkId, kategoriId: kategori[0].id, inventoryId: inv!.id };
  await setelStokProduk(page, auth, fx, stokAwal);
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

/** Menghapus penjualan uji yang masih DRAFT; penjualan tersimpan dan VOID memang tidak dapat dihapus (batalkanPenjualanUji). */
export async function hapusDraft(page: Page, auth: Auth, id: string) {
  const r = await api<PenjualanUji>(page, auth, "GET", `/penjualan/${id}`);
  if (r.status !== 200 || r.data?.statusPenjualan !== "DRAFT") return;
  const hapus = await api(page, auth, "DELETE", `/penjualan/${id}`);
  expect.soft(hapus.status, `hapus draf uji: ${hapus.pesan}`).toBe(200);
}

/** Mengisi pelanggan, produk uji, jumlah, dan keterangan di halaman buat penjualan, tanpa mengirim. */
export async function isiIsianPenjualan(page: Page, jumlah: number) {
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

  await page.getByLabel(/keterangan/i).fill(`E2E alur penjualan ${Date.now()}`);
}

/** Mengisi halaman buat penjualan dengan produk uji sampai dialog konfirmasi terbuka. */
export async function isiFormPenjualan(page: Page, jumlah: number) {
  await isiIsianPenjualan(page, jumlah);
  await page.getByLabel(/keterangan/i).press("Enter");
  await expect(page.getByRole("alertdialog")).toBeVisible();
}

/** Membuat penjualan DRAFT lewat halaman buat; id dan nomor diambil dari respons POST. */
export async function buatDraftLewatUi(page: Page, jumlah: number): Promise<PenjualanUji> {
  await isiFormPenjualan(page, jumlah);
  const tunggu = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/api\/penjualan(\?|$)/i.test(r.url()),
  );
  await page.getByRole("button", { name: /ya, lanjutkan/i }).click();
  const res = await tunggu;
  const body = await res.json().catch(() => ({}));
  expect(res.status(), `POST /penjualan: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
  return normalizeId(body.data as PenjualanUji);
}

/** Menyimpan (finalisasi) penjualan uji lewat API: DRAFT menjadi UNPAID dan stok dipotong. */
export async function simpanLewatApi(page: Page, auth: Auth, id: string, fx: Fixture) {
  wajib(
    await api(page, auth, "PUT", `/penjualan/${id}`, { finalize: true, locationID: fx.outletId }),
    "simpan penjualan uji",
  );
}

/** Metode pembayaran aktif pertama yang punya akun kas tujuan. */
export async function metodeUji(page: Page, auth: Auth): Promise<MetodeUji> {
  const daftar = wajib(await api<MetodeUji[]>(page, auth, "GET", "/metodepembayaran"), "GET /metodepembayaran");
  const metode = daftar.find((m) => m.isActive && m.akunKas);
  expect(metode, "metode pembayaran aktif berakun kas").toBeTruthy();
  return metode!;
}

/** Mencatat pembayaran uji lewat API, tanpa akunKasID dan status (backend 465b438). */
export async function bayarLewatApi(
  page: Page,
  auth: Auth,
  penjualanId: string,
  metodeId: string,
  jumlah: number,
  catatan: string,
) {
  wajib(
    await api(page, auth, "POST", "/pembayaran", {
      penjualanID: penjualanId,
      metodePembayaranID: metodeId,
      jumlahBayar: jumlah,
      tanggalBayar: new Date().toISOString(),
      catatan,
    }),
    "bayar penjualan uji",
  );
}

/**
 * Membersihkan penjualan uji dari blok finally: DRAFT dihapus, penjualan
 * tersimpan dibatalkan pembayaran PAID-nya lalu di-void (backend 465b438).
 * Pemeriksaannya lunak agar tidak menutupi kegagalan asli test.
 */
export async function batalkanPenjualanUji(page: Page, auth: Auth, id: string | undefined) {
  if (!id) return;
  const r = await api<PenjualanUji>(page, auth, "GET", `/penjualan/${id}`);
  if (r.status !== 200) return;
  const penjualan = normalizeId(r.data);
  if (penjualan.statusPenjualan === "VOID") return;
  if (penjualan.statusPenjualan === "DRAFT") return hapusDraft(page, auth, id);
  for (const bayar of penjualan.pembayaran ?? []) {
    if (bayar.status !== "PAID") continue;
    const v = await api(page, auth, "PUT", `/pembayaran/${bayar.id}`, { status: "VOID", catatan: "Pembersihan e2e" });
    expect.soft(v.status, `batalkan pembayaran uji: ${v.pesan}`).toBe(200);
  }
  const v = await api(page, auth, "PUT", `/penjualan/${id}`, { statusPenjualan: "VOID" });
  expect.soft(v.status, `void penjualan uji: ${v.pesan}`).toBe(200);
}

/** Membuka menu aksi baris daftar penjualan untuk nomor itu, lalu memilih menunya. */
export async function bukaAksiBaris(page: Page, noReferensi: string, menu: RegExp) {
  const baris = page.getByRole("row").filter({ hasText: noReferensi });
  await expect(baris).toHaveCount(1);
  await baris.getByRole("cell").last().getByRole("button").click();
  await page.getByRole("menuitem", { name: menu }).click();
}

/**
 * Memilih satu diskon di pemilih Diskon Produk (baris item) atau Diskon Global
 * halaman buat, lalu menutup pemilihnya. Kedua pemicu bernama "Pilih Diskon",
 * sehingga dicari dari pembungkus terdalam yang memuat judulnya.
 */
export async function pilihDiskon(page: Page, judul: "Diskon Produk" | "Diskon Global", nama: string) {
  const bagian = page.locator("div").filter({ has: page.getByText(judul, { exact: true }) }).last();
  await bagian.getByRole("button", { name: "Pilih Diskon" }).click();
  await page.getByRole("option", { name: new RegExp(nama) }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText(new RegExp(`${nama} \\(`)).first(), `badge ${nama}`).toBeVisible();
}