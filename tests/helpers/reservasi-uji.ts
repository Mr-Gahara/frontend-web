import { expect, type Page, type Request, type Response } from "@playwright/test";
import { api, type Auth } from "./transfer-uji";
import { normalizeId } from "@/lib/api/normalize";

/*
 * Helper spec reservasi: nama unik per run, permintaan yang ditahan lalu
 * diteruskan ke backend sungguhan, pemantau permintaan, serta data uji tipe
 * aset dan aset lewat API. Respons sukses tidak pernah dipalsukan (keputusan
 * rancangan butir 21, keputusan R1a).
 */

export const ID_TIDAK_ADA = "000000000000000000000000";

let urut = 0;
export const unik = () => Date.now().toString(36) + (urut++).toString(36);
export const tunda = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Predikat waitForResponse untuk satu method dan pola URL. */
export function cocok(method: string, pola: RegExp) {
  return (r: Response) => r.request().method() === method && pola.test(r.url());
}

/** Menghitung permintaan satu method dan pola URL; lepas() menghentikannya. */
export function pantauPermintaan(page: Page, method: string, pola: RegExp) {
  const tercatat: Request[] = [];
  const catat = (r: Request) => {
    if (r.method() === method && pola.test(r.url())) tercatat.push(r);
  };
  page.on("request", catat);
  return { jumlah: () => tercatat.length, lepas: () => page.off("request", catat) };
}

/** Menahan permintaan method itu sebentar lalu meneruskannya ke backend sungguhan. */
export async function tahanLaluTeruskan(page: Page, method: string, pola: RegExp, ms = 1_500) {
  await page.route(pola, async (route) => {
    if (route.request().method() === method) await tunda(ms);
    await route.continue();
  });
}

export type TipeAsetMentah = {
  id: string;
  namaTipeAset: string;
  deskripsi: string | null;
  dataTarif: { id: string }[];
};

export type AsetMentah = {
  id: string;
  namaAset: string;
  status: string;
  dataAset: { id: string; namaTipeAset: string | null } | null;
};

export async function buatTipeAset(page: Page, auth: Auth, nama: string, deskripsi?: string) {
  const r = await api<TipeAsetMentah>(
    page,
    auth,
    "POST",
    "/tipeaset",
    deskripsi ? { namaTipeAset: nama, deskripsi } : { namaTipeAset: nama },
  );
  expect(r.status, "buat tipe aset uji: " + r.pesan).toBeLessThan(300);
  expect(r.data?.id, "respons buat tipe aset harus membawa id").toBeTruthy();
  return r.data;
}

export async function buatAset(
  page: Page,
  auth: Auth,
  data: { namaAset: string; tipeAsetID: string; status?: "tersedia" | "perbaikan" },
) {
  const r = await api<AsetMentah>(page, auth, "POST", "/aset", data);
  expect(r.status, "buat aset uji: " + r.pesan).toBeLessThan(300);
  expect(r.data?.id, "respons buat aset harus membawa id").toBeTruthy();
  return r.data;
}

/** Menghapus data uji lewat API; status tidak diperiksa karena dipakai di finally. */
export async function hapusLewatApi(page: Page, auth: Auth, path: string, id: string | undefined) {
  if (id) await api(page, auth, "DELETE", path + "/" + id);
}

/*
 * Fixture booking (keputusan R2b dan R2c). Tipe aset, tarif, aset, dan
 * pelanggan uji bernama tetap dan dibuat sekali bila belum ada. Booking dibuat
 * per test lewat jalur batch, yang selalu membuat penjualan FINAL, lalu
 * dibatalkan lewat satu-satunya jalur di backend: bayar Rp1, hapus pembayaran
 * itu (penjualan kembali DRAFT dan saldo akun kas kembali), lalu void
 * penjualan (booking menjadi Batal).
 *
 * Booking dibaca dari GET /sesibooking tanpa tanggal. Kunci cache tanpa
 * tanggal dibersihkan saat booking dibuat maupun saat penjualannya di-void,
 * sedangkan kunci per tanggal, yang dibaca halaman, tidak dibersihkan saat
 * void (keputusan R3a). Membaca daftar per tanggal di helper akan mengisi
 * kunci itu dan membuat halaman menerima data basi.
 */
export const NAMA_TIPE_BOOKING = "E2E Reservasi Tipe";
export const NAMA_TARIF_BOOKING = "E2E Reservasi Tarif";
export const NAMA_ASET_BOOKING = "E2E Reservasi Aset";
export const NAMA_PELANGGAN_BOOKING = "E2E Reservasi Pelanggan";

export type FixtureBooking = { tipeAsetId: string; asetId: string; pelangganId: string };

export type SesiBookingMentah = {
  id: string;
  status: string;
  waktuMulai: string;
  waktuSelesai: string | null;
  dataAset: { id: string | null } | null;
  dataPenjualan: { id: string; statusPenjualan: string } | null;
};

type Berid = { id: string };

/** Tanggal lokal YYYY-MM-DD, sama dengan query tanggal halaman daftar reservasi. */
export function tanggalLokal(d: Date) {
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

async function bacaDaftar<T>(page: Page, auth: Auth, path: string, lunak = false): Promise<T[]> {
  const r = await api<unknown>(page, auth, "GET", path);
  if (lunak) expect.soft(r.status, "GET " + path + ": " + r.pesan).toBe(200);
  else expect(r.status, "GET " + path + ": " + r.pesan).toBe(200);
  return (normalizeId(r.data ?? []) as unknown as T[]) ?? [];
}

async function cariAtauBuat<T extends Berid>(
  page: Page,
  auth: Auth,
  path: string,
  cocokkan: (x: T) => boolean,
  isi: object,
  label: string,
): Promise<T> {
  const ada = (await bacaDaftar<T>(page, auth, path)).find(cocokkan);
  if (ada) return ada;
  const r = await api<unknown>(page, auth, "POST", path, isi);
  expect(r.status, "buat " + label + ": " + r.pesan).toBeLessThan(300);
  const baru = normalizeId(r.data) as unknown as T;
  expect(baru?.id, "respons buat " + label + " harus membawa id").toBeTruthy();
  return baru;
}

export async function siapkanFixtureBooking(page: Page, auth: Auth): Promise<FixtureBooking> {
  const tipe = await cariAtauBuat<Berid & { namaTipeAset: string }>(
    page,
    auth,
    "/tipeaset",
    (x) => x.namaTipeAset === NAMA_TIPE_BOOKING,
    { namaTipeAset: NAMA_TIPE_BOOKING },
    "tipe aset booking",
  );
  await cariAtauBuat<Berid & { namaTarif: string }>(
    page,
    auth,
    "/tarif",
    (x) => x.namaTarif === NAMA_TARIF_BOOKING,
    {
      namaTarif: NAMA_TARIF_BOOKING,
      basisPerhitungan: "per jam",
      harga: 10000,
      durasiMinimum: 60,
      isActive: true,
      hariAktif: [0, 1, 2, 3, 4, 5, 6],
      jamMulai: "00:00",
      jamSelesai: "23:59",
      prioritas: 1,
      tipeAsetID: [tipe.id],
    },
    "tarif booking",
  );
  const aset = await cariAtauBuat<Berid & { namaAset: string }>(
    page,
    auth,
    "/aset",
    (x) => x.namaAset === NAMA_ASET_BOOKING,
    { namaAset: NAMA_ASET_BOOKING, tipeAsetID: tipe.id },
    "aset booking",
  );
  const pelanggan = await cariAtauBuat<Berid & { namaPelanggan: string }>(
    page,
    auth,
    "/pelanggan",
    (x) => x.namaPelanggan === NAMA_PELANGGAN_BOOKING,
    { namaPelanggan: NAMA_PELANGGAN_BOOKING, tipePelanggan: "umum" },
    "pelanggan booking",
  );
  return { tipeAsetId: tipe.id, asetId: aset.id, pelangganId: pelanggan.id };
}

async function bookingAset(page: Page, auth: Auth, fx: FixtureBooking, lunak = false) {
  const semua = await bacaDaftar<SesiBookingMentah>(page, auth, "/sesibooking", lunak);
  return semua.filter((b) => b.dataAset?.id === fx.asetId);
}

/** Membuat satu booking aset uji lewat jalur batch, lalu membacanya dari daftar tanpa tanggal. */
export async function buatBooking(
  page: Page,
  auth: Auth,
  fx: FixtureBooking,
  mulai: Date,
  selesai: Date,
): Promise<SesiBookingMentah> {
  const r = await api<unknown>(page, auth, "POST", "/sesibooking", {
    dataPelanggan: fx.pelangganId,
    items: [{ dataAset: fx.asetId, waktuMulai: mulai.toISOString(), waktuSelesai: selesai.toISOString() }],
  });
  expect(r.status, "buat booking uji: " + r.pesan).toBeLessThan(300);
  const b = (await bookingAset(page, auth, fx)).find(
    (x) => x.status === "Aktif" && new Date(x.waktuMulai).getTime() === mulai.getTime(),
  );
  expect(b, "booking uji harus terbaca dari daftar booking tenant").toBeTruthy();
  expect(b?.dataPenjualan?.id, "booking uji harus membawa penjualan").toBeTruthy();
  return b as SesiBookingMentah;
}

/** Membatalkan booking lewat penjualannya (keputusan R2c); dipakai di finally, sehingga memakai expect.soft. */
export async function batalkanBooking(page: Page, auth: Auth, penjualanId: string | undefined) {
  if (!penjualanId) return;
  const p = await api<{ statusPenjualan: string }>(page, auth, "GET", "/penjualan/" + penjualanId);
  expect.soft(p.status, "baca penjualan booking: " + p.pesan).toBe(200);
  const status = p.data?.statusPenjualan;
  if (status === "VOID") return;
  if (status === "FINAL") {
    const metode = (await bacaDaftar<Berid & { isActive: boolean }>(page, auth, "/metodepembayaran", true)).find(
      (m) => m.isActive,
    );
    const akun = (await bacaDaftar<Berid & { status: string }>(page, auth, "/akunkas", true)).find(
      (a) => a.status === "aktif",
    );
    expect.soft(metode, "metode pembayaran aktif untuk membatalkan booking").toBeTruthy();
    expect.soft(akun, "akun kas aktif untuk membatalkan booking").toBeTruthy();
    if (!metode || !akun) return;
    const bayar = await api<unknown>(page, auth, "POST", "/pembayaran", {
      penjualanID: penjualanId,
      metodePembayaranID: metode.id,
      akunKasID: akun.id,
      jumlahBayar: 1,
      tanggalBayar: new Date().toISOString(),
    });
    expect.soft(bayar.status, "bayar Rp1 untuk membatalkan booking: " + bayar.pesan).toBeLessThan(300);
    const idBayar = (normalizeId(bayar.data) as unknown as Berid | undefined)?.id;
    if (!idBayar) return;
    const hapus = await api(page, auth, "DELETE", "/pembayaran/" + idBayar);
    expect.soft(hapus.status, "hapus pembayaran Rp1: " + hapus.pesan).toBeLessThan(300);
  }
  const v = await api(page, auth, "PUT", "/penjualan/" + penjualanId, { statusPenjualan: "VOID" });
  expect.soft(v.status, "void penjualan booking: " + v.pesan).toBeLessThan(300);
}

/** Membatalkan booking Aktif aset uji yang tertinggal dari run yang gagal sebelum pembersihan. */
export async function bersihkanSisaBooking(page: Page, auth: Auth, fx: FixtureBooking) {
  const sisa = (await bookingAset(page, auth, fx)).filter((b) => b.status === "Aktif");
  for (const b of sisa) await batalkanBooking(page, auth, b.dataPenjualan?.id);
}

/** Status satu booking dari detailnya; detail yang belum pernah dibaca tidak berasal dari cache. */
export async function statusBooking(page: Page, auth: Auth, id: string) {
  const r = await api<{ status: string }>(page, auth, "GET", "/sesibooking/" + id);
  expect(r.status, "baca detail booking: " + r.pesan).toBe(200);
  return r.data?.status;
}

export const NAMA_ASET_PERBAIKAN = "E2E Reservasi Aset Perbaikan";
export const NAMA_DISKON_ITEM = "E2E Reservasi Diskon Item";
export const NAMA_DISKON_GLOBAL = "E2E Reservasi Diskon Global";

export type FixtureBuatReservasi = FixtureBooking & { diskonItemId: string; diskonGlobalId: string };

/**
 * Fixture buat reservasi (keputusan R7b): fixture booking, ditambah aset uji
 * berstatus perbaikan dan satu diskon item serta satu diskon global Aktif
 * yang dapat digabung. Semuanya bernama tetap dan dibuat sekali bila belum
 * ada.
 */
export async function siapkanFixtureBuatReservasi(page: Page, auth: Auth): Promise<FixtureBuatReservasi> {
  const fx = await siapkanFixtureBooking(page, auth);
  await cariAtauBuat<Berid & { namaAset: string }>(
    page,
    auth,
    "/aset",
    (x) => x.namaAset === NAMA_ASET_PERBAIKAN,
    { namaAset: NAMA_ASET_PERBAIKAN, tipeAsetID: fx.tipeAsetId, status: "perbaikan" },
    "aset perbaikan",
  );
  const diskonItem = await cariAtauBuat<Berid & { namaDiskon: string }>(
    page,
    auth,
    "/diskon",
    (x) => x.namaDiskon === NAMA_DISKON_ITEM,
    { namaDiskon: NAMA_DISKON_ITEM, cakupan: "Item", tipe: "persen", nilai: 10, bisaDigabung: true, status: "Aktif" },
    "diskon item",
  );
  const diskonGlobal = await cariAtauBuat<Berid & { namaDiskon: string }>(
    page,
    auth,
    "/diskon",
    (x) => x.namaDiskon === NAMA_DISKON_GLOBAL,
    { namaDiskon: NAMA_DISKON_GLOBAL, cakupan: "Global", tipe: "nominal", nilai: 1000, bisaDigabung: true, status: "Aktif" },
    "diskon global",
  );
  return { ...fx, diskonItemId: diskonItem.id, diskonGlobalId: diskonGlobal.id };
}