import type { Lokasi } from "@/types/location";
import type { RingkasanPembelianStok } from "@/types/pembelianStok";
import type { RuangPembelian } from "./izin";
import { TIPE_LOKASI_PEMBELIAN } from "./ruang";

/*
 * Ringkasan Belanja Stok di Keuangan (keputusan pemilik proyek, 25 Oktober
 * 2026), dari GET /pembelianstok/ringkasan (B117, backend ridho 877e493).
 * Total, per lokasi, per akun kas, dan supplier dijumlahkan backend untuk
 * seluruh periode, dengan filter dan aturan ruang yang sama dengan daftar.
 * Sebelumnya seluruh halaman daftar diambil dan dijumlahkan di frontend
 * (kontrak/temuan.md butir 157).
 */

/** Supplier teratas yang diminta lewat limit ringkasan. */
export const BATAS_SUPPLIER_TERATAS = 5;
/** Bagian terbesar yang tampil di bilah porsi; sisanya digabung menjadi Lainnya. */
export const BATAS_BAGIAN = 4;

export const LOKASI_TIDAK_DIKENAL = "Lokasi tidak dikenal";
export const AKUN_TIDAK_DIKENAL = "Akun kas tidak dikenal";
export const NAMA_LAINNYA = "Lainnya";

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
  /** Supplier dengan belanja terbesar, paling banyak BATAS_SUPPLIER_TERATAS. */
  supplier: BarisRingkasan[];
}

/**
 * Baris kartu dari respons ringkasan, dalam urutan backend (total terbesar
 * dulu). Lokasi atau akun tanpa nama, karena pembelian lama tanpa lokasi
 * atau relasinya terhapus, diberi nama pengganti.
 */
export function petakanRingkasan(data: RingkasanPembelianStok): RingkasanBelanja {
  return {
    total: data.total,
    jumlahPembelian: data.jumlahPembelian,
    perLokasi: data.perLokasi.map((l) => ({
      kunci: l.locationID ?? "",
      nama: l.nama || LOKASI_TIDAK_DIKENAL,
      total: l.total,
      jumlah: l.jumlah,
    })),
    perAkun: data.perAkunKas.map((a) => ({
      kunci: a.akunKasID ?? "",
      nama: a.namaAkun || AKUN_TIDAK_DIKENAL,
      total: a.total,
      jumlah: a.jumlah,
    })),
    supplier: data.supplier.map((s) => ({ kunci: s.nama, nama: s.nama, total: s.total, jumlah: s.jumlah })),
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
