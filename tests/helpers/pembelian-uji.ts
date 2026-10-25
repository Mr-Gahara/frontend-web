import { expect, type Page } from "@playwright/test";
import { api, type Auth } from "./transfer-uji";

/*
 * Helper e2e pembelian stok, dipakai spec catat di inventaris dan spec
 * Belanja Stok di Keuangan. Bahan fixture permanen "E2E Bahan Pak" menjadi
 * barang pembelian uji.
 */

export type Berid = { id?: string; _id?: string };

export const BAHAN_FIXTURE = "E2E Bahan Pak";

export const idDari = (x: Berid | string | null | undefined) =>
  typeof x === "string" ? x : String(x?.id ?? x?._id ?? "");

export async function lokasiBertipe(page: Page, auth: Auth, tipe: string) {
  const baca = await api<(Berid & { tipe: string; nama: string })[]>(page, auth, "GET", "/location");
  expect(baca.status, "baca lokasi: " + baca.pesan).toBe(200);
  const lokasi = (baca.data ?? []).find((l) => l.tipe === tipe);
  expect(lokasi, "lokasi bertipe " + tipe).toBeTruthy();
  return { id: idDari(lokasi), nama: (lokasi as { nama: string }).nama };
}

export async function idBahanFixture(page: Page, auth: Auth) {
  const baca = await api<(Berid & { namaBahan: string })[]>(page, auth, "GET", "/bahanbaku");
  expect(baca.status, "baca bahan baku: " + baca.pesan).toBe(200);
  const bahan = (baca.data ?? []).find((b) => b.namaBahan === BAHAN_FIXTURE);
  expect(bahan, "bahan fixture " + BAHAN_FIXTURE).toBeTruthy();
  return idDari(bahan);
}

/**
 * Menyiapkan satu pembelian lewat API untuk halaman yang hanya membaca
 * pembelian, seperti Belanja Stok di Keuangan (keputusan rancangan butir
 * 23); alur catat lewat UI dibuktikan spec catat. Pembelian menambah stok
 * bahan di lokasinya, dan hapusPembelianUji menguranginya kembali.
 */
export async function buatPembelianUji(
  page: Page,
  auth: Auth,
  data: {
    akunKasID: string;
    supplier: string;
    locationID: string;
    bahanBakuID: string;
    jumlah: number;
    hargaBeli: number;
  },
) {
  const buat = await api<Berid>(page, auth, "POST", "/pembelianstok", {
    akunKasID: data.akunKasID,
    supplier: data.supplier,
    keterangan: "E2E belanja stok " + data.supplier,
    locationID: data.locationID,
    items: [{ bahanBakuID: data.bahanBakuID, jumlah: data.jumlah, hargaBeli: data.hargaBeli }],
  });
  expect([200, 201], "buat pembelian uji: " + buat.pesan).toContain(buat.status);
  const id = idDari(buat.data);
  expect(id, "id pembelian uji").toBeTruthy();
  return id;
}

export async function hapusPembelianUji(page: Page, auth: Auth, id: string | undefined) {
  if (!id) return;
  const hapus = await api(page, auth, "DELETE", "/pembelianstok/" + id);
  expect.soft(hapus.status, "hapus pembelian uji: " + hapus.pesan).toBe(200);
}