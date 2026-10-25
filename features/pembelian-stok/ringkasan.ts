import type { Lokasi } from "@/types/location";
import type { PembelianStok } from "@/types/pembelianStok";
import type { HalamanPembelianStok } from "./api";
import type { RuangPembelian } from "./izin";
import { TIPE_LOKASI_PEMBELIAN } from "./ruang";
import { lokasiPembelian } from "./tampilan";

/*
 * Ringkasan Belanja Stok di Keuangan (keputusan pemilik proyek, 25 Oktober
 * 2026). Backend belum punya endpoint ringkasan pembelian, sehingga seluruh
 * halaman GET /pembelianstok pada filter yang sama diambil lalu dijumlahkan
 * di frontend, paling banyak BATAS_HALAMAN_RINGKASAN halaman. Ganti dengan
 * endpoint ringkasan begitu backend menyediakannya.
 */

/** limit terbesar yang diterima backend (B103). */
export const UKURAN_HALAMAN_RINGKASAN = 100;
export const BATAS_HALAMAN_RINGKASAN = 20;
export const BATAS_SUPPLIER_TERATAS = 5;
/** Bagian terbesar yang tampil di bilah porsi; sisanya digabung menjadi Lainnya. */
export const BATAS_BAGIAN = 4;

export const LOKASI_TIDAK_DIKENAL = "Lokasi tidak dikenal";
export const AKUN_TIDAK_DIKENAL = "Akun kas tidak dikenal";
export const NAMA_LAINNYA = "Lainnya";

export interface KumpulanPembelian {
  /** Pembelian unik per id dari halaman yang diambil. */
  daftar: PembelianStok[];
  /** pagination.total halaman pertama; panjang daftar bila backend tidak mengirim pagination. */
  total: number;
  /** True bila jumlah halaman melebihi batas, sehingga sebagian pembelian tidak diambil. */
  terpotong: boolean;
}

/**
 * Mengambil halaman 1 sampai halaman terakhir, atau sampai batas, satu per
 * satu. Urutan backend { tanggal: -1, createdAt: -1 } tidak punya pemecah
 * seri, dan pembelian dapat dicatat atau dihapus di tengah pengambilan,
 * sehingga baris yang sama dapat muncul di dua halaman. Hasilnya dibuat unik
 * per id, dan ringkasanLengkap membandingkannya dengan total.
 */
export async function kumpulkanPembelian(
  ambil: (halaman: number) => Promise<HalamanPembelianStok>,
  batas: number = BATAS_HALAMAN_RINGKASAN,
): Promise<KumpulanPembelian> {
  const pertama = await ambil(1);
  const jumlahHalaman = pertama.pagination?.totalPages ?? 1;
  const semua = [...pertama.data];
  for (let halaman = 2; halaman <= Math.min(jumlahHalaman, batas); halaman++) {
    semua.push(...(await ambil(halaman)).data);
  }
  const unik = new Map<string, PembelianStok>();
  for (const pembelian of semua) if (!unik.has(pembelian.id)) unik.set(pembelian.id, pembelian);
  const daftar = [...unik.values()];
  return {
    daftar,
    total: pertama.pagination?.total ?? daftar.length,
    terpotong: jumlahHalaman > batas,
  };
}

export function ringkasanLengkap(kumpulan: KumpulanPembelian): boolean {
  return !kumpulan.terpotong && kumpulan.daftar.length === kumpulan.total;
}

/** Peringatan di atas kartu bila ringkasan tidak mencakup seluruh pembelian pada filter. */
export function teksRingkasanTidakLengkap(kumpulan: KumpulanPembelian): string {
  const diambil = kumpulan.daftar.length.toLocaleString("id-ID");
  const total = kumpulan.total.toLocaleString("id-ID");
  if (kumpulan.terpotong) {
    const batas = (BATAS_HALAMAN_RINGKASAN * UKURAN_HALAMAN_RINGKASAN).toLocaleString("id-ID");
    return `Ringkasan dihitung dari ${diambil} dari ${total} pembelian, karena pembelian pada filter ini melebihi ${batas}. Persempit periode atau filter untuk angka lengkap.`;
  }
  return `Pembelian berubah selama ringkasan dihitung (${diambil} dari ${total} pembelian). Muat ulang halaman untuk angka terbaru.`;
}

export interface BarisRingkasan {
  kunci: string;
  nama: string;
  total: number;
  /** Banyaknya pembelian. */
  jumlah: number;
}

export interface RingkasanBelanja {
  total: number;
  jumlahPembelian: number;
  perLokasi: BarisRingkasan[];
  perAkun: BarisRingkasan[];
  /** Supplier dengan belanja terbesar, paling banyak batasSupplier. */
  supplier: BarisRingkasan[];
}

function tambahkan(peta: Map<string, BarisRingkasan>, kunci: string, nama: string, nilai: number) {
  const ada = peta.get(kunci);
  if (ada) {
    ada.total += nilai;
    ada.jumlah += 1;
  } else {
    peta.set(kunci, { kunci, nama, total: nilai, jumlah: 1 });
  }
}

function urutkan(peta: Map<string, BarisRingkasan>): BarisRingkasan[] {
  return [...peta.values()].sort((a, b) => b.total - a.total || a.nama.localeCompare(b.nama, "id"));
}

/**
 * Total, porsi per lokasi penerima, porsi per akun kas, dan supplier
 * terbesar. Lokasi dan akun yang tidak dikenali digabung menjadi satu baris.
 * Supplier dikelompokkan tanpa membedakan huruf besar dan spasi di tepi,
 * karena supplier diketik bebas; nama yang tampil adalah ejaan pertama.
 */
export function ringkasBelanja(
  daftar: readonly PembelianStok[],
  daftarLokasi: readonly Lokasi[] | undefined,
  batasSupplier: number = BATAS_SUPPLIER_TERATAS,
): RingkasanBelanja {
  const perLokasi = new Map<string, BarisRingkasan>();
  const perAkun = new Map<string, BarisRingkasan>();
  const perSupplier = new Map<string, BarisRingkasan>();
  let total = 0;
  for (const pembelian of daftar) {
    const nilai = pembelian.totalBiaya;
    total += nilai;
    const lokasi = lokasiPembelian(pembelian, daftarLokasi);
    tambahkan(perLokasi, lokasi?.id ?? "", lokasi?.nama || LOKASI_TIDAK_DIKENAL, nilai);
    const akun = pembelian.akunKasID;
    tambahkan(perAkun, akun?.id ?? "", akun?.namaAkun || AKUN_TIDAK_DIKENAL, nilai);
    const supplier = pembelian.supplier.trim();
    tambahkan(perSupplier, supplier.toLocaleLowerCase("id-ID"), supplier, nilai);
  }
  return {
    total,
    jumlahPembelian: daftar.length,
    perLokasi: urutkan(perLokasi),
    perAkun: urutkan(perAkun),
    supplier: urutkan(perSupplier).slice(0, batasSupplier),
  };
}

export interface BagianRingkasan extends BarisRingkasan {
  /** Porsi dari total seluruh baris, 0 sampai 100. */
  persen: number;
}

/**
 * Bagian bilah porsi. Lebih dari maks + 1 baris: maks baris terbesar
 * ditambah satu bagian Lainnya, karena satu sisa tidak perlu digabung.
 */
export function bagianRingkasan(
  baris: readonly BarisRingkasan[],
  maks: number = BATAS_BAGIAN,
): BagianRingkasan[] {
  const total = baris.reduce((jumlah, b) => jumlah + b.total, 0);
  let tampil: BarisRingkasan[] = [...baris];
  if (baris.length > maks + 1) {
    const sisa = baris.slice(maks);
    tampil = [
      ...baris.slice(0, maks),
      {
        kunci: "__lainnya",
        nama: NAMA_LAINNYA,
        total: sisa.reduce((jumlah, b) => jumlah + b.total, 0),
        jumlah: sisa.reduce((jumlah, b) => jumlah + b.jumlah, 0),
      },
    ];
  }
  return tampil.map((b) => ({ ...b, persen: total > 0 ? (b.total / total) * 100 : 0 }));
}

/** Teks pengganti bilah porsi bagi pembaca layar. */
export function teksAriaBagian(bagian: readonly Pick<BagianRingkasan, "nama" | "persen">[]): string {
  return bagian.map((b) => `${b.nama} ${Math.round(b.persen)} persen`).join(", ");
}

/** Ruang tempat pembelian di lokasi ini dibuka; null bila tipenya bukan Outlet atau Gudang. */
export function ruangLokasi(lokasi: Pick<Lokasi, "tipe"> | null | undefined): RuangPembelian | null {
  if (!lokasi) return null;
  const ruang = (Object.keys(TIPE_LOKASI_PEMBELIAN) as RuangPembelian[]).find(
    (r) => TIPE_LOKASI_PEMBELIAN[r] === lokasi.tipe,
  );
  return ruang ?? null;
}

const teksTanggal = (tanggal: Date) =>
  tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

/** Periode filter di kartu total, misalnya "1 Okt 2026 sampai 31 Okt 2026". */
export function teksPeriode(dari?: Date, sampai?: Date): string {
  if (dari && sampai) return `${teksTanggal(dari)} sampai ${teksTanggal(sampai)}`;
  if (dari) return `sejak ${teksTanggal(dari)}`;
  if (sampai) return `sampai ${teksTanggal(sampai)}`;
  return "seluruh waktu";
}