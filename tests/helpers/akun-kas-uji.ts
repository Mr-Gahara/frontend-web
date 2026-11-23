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
  tipeAkun: string;
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
/**
 * Akun uji tetap untuk spec yang tidak menguji pembuatan akun (pemilik
 * proyek, 23 November 2026): dicari menurut nama pasti, atau menurut nama
 * sisa run yang gagal di tengah (`namaSisa`), lalu dipulihkan: nama,
 * keterangan, dan status aktif, dan saldonya dikosongkan ke akun aktif
 * bukan uji lewat Pindah Dana API. Dibuat sekali bila belum ada. Akun kas
 * tidak dapat dihapus, sehingga cara ini menghentikan penumpukan akun uji
 * non-aktif per run.
 */
export async function akunUjiTetap(
  page: Page,
  auth: Auth,
  nama: string,
  { keterangan = "E2E akun kas uji", namaSisa = [] as string[] } = {},
): Promise<AkunKasUji> {
  const semua = await daftarAkun(page, auth);
  const ada = semua.find((a) => a.namaAkun === nama) ?? semua.find((a) => namaSisa.includes(a.namaAkun));
  if (!ada) return buatAkunUji(page, auth, nama, keterangan);

  const ubah: Record<string, unknown> = {};
  if (ada.namaAkun !== nama) ubah.namaAkun = nama;
  if ((ada.keterangan ?? "") !== keterangan) ubah.keterangan = keterangan;
  if (ada.status !== "aktif") ubah.status = "aktif";
  if (ada.tipeAkun !== "Kas Fisik") ubah.tipeAkun = "Kas Fisik";
  if (Object.keys(ubah).length > 0) {
    const pulih = await api(page, auth, "PUT", "/akunkas/" + ada.id, ubah);
    expect(pulih.status, `pulihkan akun uji tetap ${nama}: ${pulih.pesan}`).toBe(200);
  }
  const saldo = Number(ada.saldo ?? 0);
  if (saldo > 0) {
    const tujuan = semua.find((a) => a.status === "aktif" && !a.namaAkun.startsWith("E2E") && a.id !== ada.id);
    expect(tujuan, "akun aktif bukan uji untuk menampung sisa saldo akun uji tetap").toBeTruthy();
    const kosong = await api(page, auth, "POST", "/jurnaltransfer", {
      kasSumberID: ada.id,
      kasTujuanID: (tujuan as AkunKasUji).id,
      jumlah: saldo,
      keterangan: "E2E pengosongan akun uji tetap " + nama,
    });
    expect(kosong.status, `kosongkan saldo akun uji tetap ${nama}: ${kosong.pesan}`).toBe(201);
  }
  const akhir = (await daftarAkun(page, auth)).find((a) => a.id === ada.id);
  expect(akhir?.saldo, `saldo akun uji tetap ${nama} kosong`).toBe(0);
  return akhir as AkunKasUji;
}
