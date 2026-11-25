import { denganTabKritis } from "@/features/inventaris/tab-stok";
import type { Produk } from "@/types/produk";
import { bolehTautan, fiturAktif, type AksesTautan } from "./akses";
import type { Pemberitahuan, TautanPemberitahuan } from "./jenis";

export const URL_PRODUK = "/dashboard/outlet/inventaris/produk";
export const URL_BUAT_PRODUK = "/dashboard/outlet/inventaris/produk/buatProduk";
const POLA_UBAH_PRODUK = "/dashboard/outlet/inventaris/produk/[id]/edit";
export const URL_CATAT_PEMBELIAN = "/dashboard/outlet/inventaris/pembelianStok/catatPembelian";
export const URL_BUAT_PENGAJUAN = "/dashboard/outlet/inventaris/pengajuanStok/buatPengajuan";

/** Nama produk yang disebut di kartu; sisanya diringkas "dan N lainnya". */
const BATAS_NAMA = 3;

/** Pemicu LN1a dari seluruh produk toko beserta stok terhitungnya. */
export type PemicuStokProduk =
  | { jenis: "tanpa-produk" }
  | { jenis: "tak-terjual"; langsung: Produk[]; beresep: Produk[] };

const beresep = (p: Produk) => !p.isUnlimitedStok && (p.resep?.length ?? 0) > 0;
const dapatDijual = (p: Produk) => p.isUnlimitedStok === true || (p.stok ?? 0) > 0;

/**
 * LN1a: toko tanpa produk, atau tidak ada satu pun produk yang dapat dijual
 * (setiap produk berstok yang bukan unlimited stoknya 0, termasuk produk
 * beresep yang stok terhitungnya 0). Produk unlimited selalu dapat dijual.
 */
export function pemicuStokProduk(produk: readonly Produk[]): PemicuStokProduk | null {
  if (produk.length === 0) return { jenis: "tanpa-produk" };
  if (produk.some(dapatDijual)) return null;
  return {
    jenis: "tak-terjual",
    langsung: produk.filter((p) => !beresep(p)),
    beresep: produk.filter(beresep),
  };
}

function sebutNama(daftar: readonly Produk[]): string {
  const nama = daftar.slice(0, BATAS_NAMA).map((p) => p.namaProduk);
  const sisa = daftar.length - nama.length;
  return sisa > 0 ? `${nama.join(", ")}, dan ${sisa} lainnya` : nama.join(", ");
}

/**
 * Kartu LN1a dengan isi menurut jenis produk (LN2a): tanpa produk ke Buat
 * Produk; berstok langsung ke Ubah Produk bila hanya satu, ke daftar Produk
 * bila lebih (LN14a); beresep ke Pembelian Stok, dan Pengajuan ke Gudang
 * bila fitur gudang aktif. Tautan hanya bagi pemegang izinnya.
 */
export function pemberitahuanStokProduk(
  pemicu: PemicuStokProduk | null,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!pemicu) return null;
  const tautan: TautanPemberitahuan[] = [];
  const tambah = (href: string, label: string, pola?: string) => {
    if (bolehTautan(akses, href, pola)) tautan.push({ href, label });
  };

  if (pemicu.jenis === "tanpa-produk") {
    tambah(URL_BUAT_PRODUK, "Buat Produk");
    return {
      id: "stok-produk",
      tingkat: "penting",
      judul: "Toko belum punya produk",
      isi: "Belum ada produk yang dapat dijual. Buat produk lebih dulu agar kasir dapat mencatat penjualan.",
      tautan,
    };
  }

  const kalimat: string[] = [];
  if (pemicu.langsung.length > 0) {
    kalimat.push(
      `Stok ${pemicu.langsung.length} produk berstok langsung habis (${sebutNama(pemicu.langsung)}); isi stoknya lewat Ubah Produk.`,
    );
    if (pemicu.langsung.length === 1) {
      tambah(`${URL_PRODUK}/${pemicu.langsung[0].id}/edit`, "Ubah Produk", POLA_UBAH_PRODUK);
    } else {
      tambah(URL_PRODUK, "Lihat produk");
    }
  }
  if (pemicu.beresep.length > 0) {
    const gudang = fiturAktif(akses, "wms");
    kalimat.push(
      `Stok ${pemicu.beresep.length} produk beresep habis (${sebutNama(pemicu.beresep)}); isi bahannya lewat Pembelian Stok${gudang ? " atau Pengajuan ke Gudang" : ""}.`,
    );
    tambah(URL_CATAT_PEMBELIAN, "Pembelian Stok");
    if (gudang) tambah(URL_BUAT_PENGAJUAN, "Pengajuan ke Gudang");
  }
  return {
    id: "stok-produk",
    tingkat: "penting",
    judul: "Tidak ada produk yang dapat dijual",
    isi: kalimat.join(" "),
    tautan,
  };
}

/** LN1a tingkat sedang: produk berstok langsung yang mencapai stok minimum (ringkasan dashboard outlet). */
export function pemberitahuanProdukMinimum(jumlah: number | null | undefined, akses: AksesTautan): Pemberitahuan | null {
  if (!jumlah || jumlah <= 0) return null;
  return {
    id: "produk-minimum",
    tingkat: "tindakan",
    judul: "Stok produk menipis",
    isi: `${jumlah} produk mencapai stok minimum.`,
    // Langsung tab Stok Kritis daftar Produk (LN16a).
    tautan: bolehTautan(akses, URL_PRODUK) ? [{ href: denganTabKritis(URL_PRODUK), label: "Lihat produk" }] : [],
  };
}
