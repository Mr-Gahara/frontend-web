import type { RuangKerja } from "@/features/pengguna/lokasi-kerja";
import type { Pemberitahuan } from "./jenis";

/*
 * Lonceng mengikuti ruang yang dapat dimasuki pengguna.
 * - LN20a (pemilik proyek, 25 November 2026): sumber lonceng mengikuti lokasi
 *   kerja staf; sumber ruang lain tidak dimuat, karena permintaannya ditolak
 *   backend dan kartunya mengarah ke ruang yang tertutup.
 * - LN21a (pemilik proyek, 26 November 2026): "notifikasi outlet tidak akan
 *   muncul untuk staff gudang atau yang ga punya izin akses ke outlet, begitu
 *   juga sebaliknya". Akses ruang sama dengan pemilih ruang sidebar
 *   (aksesRuang: izin dashboard ruang dan lokasi kerja), dan kartu disaring
 *   menurut ruang tujuannya.
 */

/** Ruang sebuah sumber atau kartu lonceng; "toko" berlaku di kedua ruang. */
export type RuangSumber = RuangKerja | "toko";

/** Ruang yang dapat dimasuki pengguna sesi; `siap` false selama detail diri dimuat. */
export interface AksesRuangSesi {
  outlet: boolean;
  gudang: boolean;
  siap: boolean;
}

/**
 * Sumber atau kartu boleh dimuat dan tampil. Yang tingkat toko tidak
 * menunggu apa pun; yang outlet dan gudang menunggu detail diri (siap), agar
 * staf berlokasi kerja tidak sempat meminta sumber ruang lain.
 */
export function muatRuang(akses: AksesRuangSesi, sumber: RuangSumber): boolean {
  if (sumber === "toko") return true;
  return akses.siap && akses[sumber];
}

/**
 * Ringkasan dashboard yang dimuat untuk sumber inventaris (LN17a, LN20a).
 * Ringkasan outlet bagi yang dapat masuk ruang outlet; ringkasan gudang bila
 * ringkasan outlet tidak dimuat, termasuk staf gudang yang memegang izin
 * dashboard outlet, agar pengajuan dan surat jalan tetap terbaca dari
 * ruangnya sendiri.
 */
export function ringkasanDimuat(muat: (sumber: RuangSumber) => boolean): { outlet: boolean; gudang: boolean } {
  const outlet = muat("outlet");
  return { outlet, gudang: !outlet && muat("gudang") };
}

/**
 * Ruang tujuan setiap kartu lonceng, menurut halaman tindakannya. Langganan
 * dan hasil pengajuan saya berada di ruang outlet (LN21a). Unit test
 * memastikan setiap id kartu yang dibuat sumber tercantum di sini.
 */
export const RUANG_KARTU: Readonly<Record<string, RuangSumber>> = {
  "stok-produk": "outlet",
  "produk-minimum": "outlet",
  "bahan-minimum": "outlet",
  "surat-jalan-pengembalian": "outlet",
  "terima-outlet": "outlet",
  "opname-outlet": "outlet",
  "kasir-lupa": "outlet",
  "booking-belum-lunas": "outlet",
  "penjualan-belum-lunas": "outlet",
  "membership-berakhir": "outlet",
  "diskon-berakhir": "outlet",
  kehadiran: "outlet",
  "jadwal-minggu-depan": "outlet",
  "hasil-pengajuan": "outlet",
  langganan: "outlet",
  "gudang-minimum": "gudang",
  "pengajuan-menunggu": "gudang",
  "surat-jalan-permintaan": "gudang",
  "terima-gudang": "gudang",
  "opname-gudang": "gudang",
  "izin-cuti": "toko",
  "setup-fitur": "toko",
};

/**
 * Kartu yang ruang tujuannya dapat dimasuki pengguna (LN21a). Kartu yang
 * belum tercantum disembunyikan, agar tidak bocor ke ruang lain; unit test
 * menangkap kelalaian itu.
 */
export function saringKartuRuang(daftar: readonly Pemberitahuan[], akses: AksesRuangSesi): Pemberitahuan[] {
  return daftar.filter((p) => {
    const ruang = RUANG_KARTU[p.id];
    return ruang !== undefined && muatRuang(akses, ruang);
  });
}
