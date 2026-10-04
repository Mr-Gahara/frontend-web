import { expect, type Page } from "@playwright/test";
import { api, type Auth } from "./transfer-uji";
import { unik } from "./reservasi-uji";

/*
 * Helper akun kas uji untuk spec keuangan. Akun kas tidak dapat dihapus,
 * sehingga akun uji dibuat lewat API bersaldo 0 dan ditutup lewat status
 * non-aktif (pola keputusan KU4a dan PB13a). Sebelum 4 Oktober 2026 helper
 * ini didefinisikan kembar di spec ubah akun kas dan spec Pindah Dana.
 */

export type AkunKasUji = {
  id: string;
  namaAkun: string;
  nomorAkun: string;
  saldo: number;
  status: string;
  keterangan: string | null;
};

export async function daftarAkun(page: Page, auth: Auth) {
  const baca = await api<AkunKasUji[]>(page, auth, "GET", "/akunkas");
  expect(baca.status, "baca akun kas: " + baca.pesan).toBe(200);
  return baca.data ?? [];
}

export async function saldoAkun(page: Page, auth: Auth, id: string) {
  const akun = (await daftarAkun(page, auth)).find((a) => a.id === id);
  expect(akun, "akun kas " + id + " terbaca").toBeTruthy();
  return (akun as AkunKasUji).saldo;
}

export async function buatAkunUji(page: Page, auth: Auth, nama: string, keterangan = "E2E akun kas uji") {
  const buat = await api<AkunKasUji>(page, auth, "POST", "/akunkas", {
    namaAkun: nama,
    nomorAkun: "E2E-" + unik(),
    tipeAkun: "Kas Fisik",
    keterangan,
    saldo: 0,
    status: "aktif",
  });
  expect(buat.status, "buat akun kas uji: " + buat.pesan).toBe(201);
  const akun = (await daftarAkun(page, auth)).find((a) => a.namaAkun === nama);
  expect(akun, "akun uji tersimpan di backend").toBeTruthy();
  return akun as AkunKasUji;
}

/** Menutup akun uji lewat status non-aktif; dipakai di finally, sehingga pemeriksaannya lunak. */
export async function tutupAkunUji(page: Page, auth: Auth, id: string | undefined) {
  if (!id) return;
  const tutup = await api(page, auth, "PUT", "/akunkas/" + id, { status: "non-aktif" });
  expect.soft(tutup.status, `nonaktifkan akun kas uji: ${tutup.pesan}`).toBe(200);
}

/** Memilih akun di pemicu Select berlabel (form Pindah Dana). */
export async function pilihAkun(page: Page, label: string, nama: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: nama, exact: true }).click();
}