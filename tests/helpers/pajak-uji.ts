import { expect, type Locator, type Page } from "@playwright/test";
import { api, type Auth } from "./transfer-uji";
import { cocok } from "./reservasi-uji";
import { normalizeId } from "../../lib/api/normalize";

/**
 * Helper bersama spec pengaturan pajak (pajak.spec.ts sebagai pembanding dan
 * kelola-pajak.spec.ts sebagai spec migrasi). Setiap operasi pajak yang diuji
 * berjalan lewat UI; API hanya membaca bukti, menyiapkan produk uji, dan
 * membersihkan sisa run yang gagal (pemilik proyek, 1 Oktober 2026).
 *
 * Produk uji dibuat sekali lalu dipakai ulang, karena memasang pajak menimpa
 * relasi produk itu (upsert per produk di produkPajakService.assignPajak),
 * sehingga produk lain tidak boleh dipakai.
 */

export const URL_PAJAK = "/dashboard/outlet/pengaturan/pajak";
export const POLA_DAFTAR = /\/api\/pajak(\?|$)/i;
export const POLA_BUAT = /\/api\/pajak$/i;
export const POLA_DETAIL = /\/api\/pajak\/[a-f0-9]{24}$/i;
export const POLA_PASANG = /\/api\/produkpajak$/i;
export const POLA_RELASI = /\/api\/produkpajak\/[a-f0-9]{24}$/i;
export const NAMA_PRODUK_UJI = "E2E Pajak Produk";
export const NAMA_KATEGORI_UJI = "E2E Pajak Kategori";

type Hasil<T> = { status: number; data: T; pesan: string };

export type PajakItem = {
  id: string;
  namaPajak: string;
  tarifPajak: number;
  tipePajak: boolean;
  modelPerhitungan: number;
  prioritas: number;
  statusPajak: boolean;
};

export type RelasiItem = {
  id: string;
  produkID?: string;
  pajak: { id: string; nama: string; tarif: number };
};

type ProdukUji = { id: string; namaProduk: string };
type KategoriUji = { id: string; namaKategori: string };

export const barisPajak = (page: Page, nama: string) =>
  page.getByRole("row").filter({ has: page.getByText(nama, { exact: true }) });

export const pemicu = (page: Page, teks: string | RegExp) => page.getByRole("combobox").filter({ hasText: teks });

export const cari = (page: Page, nama: string) => page.getByPlaceholder("Cari nama pajak...").fill(nama);

/** Isian teks: div terdalam yang memuat teks label beserta input-nya; berlaku dengan atau tanpa htmlFor. */
export function isian(lingkup: Locator, label: string) {
  return lingkup
    .locator("div")
    .filter({ has: lingkup.page().getByText(label, { exact: true }) })
    .filter({ has: lingkup.page().locator("input") })
    .last()
    .locator("input");
}

/** Memilih opsi Radix Select lewat nama aksesibel pemicunya (label htmlFor). */
export async function pilihOpsi(lingkup: Locator, label: string, opsi: string) {
  await lingkup.getByRole("combobox", { name: label }).click();
  await lingkup.page().getByRole("option", { name: opsi, exact: true }).click();
}

export type IsianPajak = {
  nama: string;
  tarif: string;
  prioritas?: "1" | "2";
  tipe?: "Per Produk" | "Per Transaksi";
  model?: "Inklusif" | "Add-on" | "Compound";
  status?: "Aktif" | "Non-Aktif";
};

/** Mengisi dialog Tambah atau Edit Pajak; prioritas dipilih 1 bila tidak disebut (PO8a). */
export async function isiFormPajak(dialog: Locator, n: IsianPajak) {
  await isian(dialog, "Nama Pajak").fill(n.nama);
  await isian(dialog, "Tarif (%)").fill(n.tarif);
  await pilihOpsi(dialog, "Prioritas", n.prioritas ?? "1");
  if (n.tipe) await pilihOpsi(dialog, "Tipe Pajak", n.tipe);
  if (n.model) await pilihOpsi(dialog, "Model Perhitungan", n.model);
  if (n.status) await pilihOpsi(dialog, "Status", n.status);
}

export function wajib<T>(r: Hasil<T>, label: string): T {
  expect(r.status, `${label}: ${r.status} ${r.pesan}`).toBeLessThan(300);
  return normalizeId(r.data) as T;
}

export async function pastikanProdukUji(page: Page, auth: Auth): Promise<ProdukUji> {
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

export async function relasiProduk(page: Page, auth: Auth, produkId: string): Promise<RelasiItem[]> {
  return wajib(await api<RelasiItem[]>(page, auth, "GET", "/produkpajak/" + produkId), "GET /produkpajak");
}

/** Membersihkan relasi sisa run yang gagal sebelum skenario dimulai. */
export async function lepasSemuaRelasi(page: Page, auth: Auth, produkId: string) {
  for (const r of await relasiProduk(page, auth, produkId)) {
    const d = await api(page, auth, "DELETE", "/produkpajak/" + r.id);
    expect(d.status, `lepas relasi sisa ${r.id}: ${d.pesan}`).toBe(200);
  }
}

/** Pembersihan di finally; 404 berarti sudah terhapus lewat UI. */
export async function hapusPajakUji(page: Page, auth: Auth, id: string | undefined) {
  if (!id) return;
  const d = await api(page, auth, "DELETE", "/pajak/" + id);
  expect.soft([200, 404], `hapus pajak uji ${id}: ${d.status} ${d.pesan}`).toContain(d.status);
}

/**
 * Membuat pajak lewat dialog Tambah Pajak, bawaan per produk, Add-on, dan
 * aktif. Id dicatat lewat callback begitu respons diterima, agar pembersihan
 * tetap berjalan bila pemeriksaan sesudahnya gagal.
 */
export async function buatLewatUi(
  page: Page,
  nama: string,
  tarif: string,
  catat: (id: string) => void,
  lain: Omit<IsianPajak, "nama" | "tarif"> = {},
) {
  await page.getByRole("button", { name: "Tambah Pajak" }).click();
  const dialog = page.getByRole("dialog", { name: "Tambah Pajak" });
  await isiFormPajak(dialog, { nama, tarif, ...lain });
  const tJawab = page.waitForResponse(cocok("POST", POLA_BUAT));
  await dialog.getByRole("button", { name: "Simpan" }).click();
  const jawab = await tJawab;
  expect(jawab.status(), "POST /pajak").toBe(201);
  catat((normalizeId(((await jawab.json()) as { data: PajakItem }).data) as PajakItem).id);
  await expect(dialog).toBeHidden();
}