import { expect, type Page } from "@playwright/test";
import { api, type Auth } from "./transfer-uji";

/*
 * Helper beban operasional uji. Kategori fixture tetap "E2E Kategori Beban"
 * (keputusan RG7a) dicari menurut nama, dibuat sekali bila belum ada, lalu
 * dipakai ulang oleh spec kategori beban dan spec pengeluaran.
 */

export const KATEGORI_FIXTURE = "E2E Kategori Beban";

export type KategoriUji = { _id?: string; id?: string; namaKategori: string };

export const idKategori = (k: KategoriUji) => (k.id ?? k._id) as string;

export async function daftarKategori(page: Page, auth: Auth) {
  const baca = await api<KategoriUji[]>(page, auth, "GET", "/kategoribeban");
  expect(baca.status, "baca kategori beban: " + baca.pesan).toBe(200);
  return baca.data ?? [];
}

export async function pastikanKategoriFixture(page: Page, auth: Auth) {
  const ada = (await daftarKategori(page, auth)).find((k) => k.namaKategori === KATEGORI_FIXTURE);
  if (ada) return idKategori(ada);
  const buat = await api<KategoriUji>(page, auth, "POST", "/kategoribeban", {
    namaKategori: KATEGORI_FIXTURE,
  });
  expect(buat.status, "buat fixture kategori beban: " + buat.pesan).toBe(201);
  return idKategori(buat.data as KategoriUji);
}