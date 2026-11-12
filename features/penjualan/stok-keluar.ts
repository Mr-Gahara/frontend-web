import type { Penjualan, RincianStokPenjualan, StatusPenjualan } from "@/types/penjualan";

/**
 * Tampilan stok keluar di detail penjualan (VD3a, desain A pemilik proyek
 * 12 November 2026): rincianStok (backend P78, B320) dikelompokkan per
 * produk menurut urutan item penjualan.
 */

export interface BarisStokKeluar {
  kunci: string;
  nama: string;
  jenis: "Bahan baku" | "Stok produk";
  jumlah: string;
}

export interface KelompokStokKeluar {
  produkID: string;
  /** "Kopi Susu Gula Aren × 2" */
  judul: string;
  baris: BarisStokKeluar[];
}

export interface StokKeluar {
  kelompok: KelompokStokKeluar[];
  /** Nama item yang tidak memotong stok; sebabnya tidak dibaca (pemilik proyek, 12 November 2026). */
  tanpaPotong: string[];
}

const FORMAT_ANGKA = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 });

/** 36 gram, 0,5 kg; stok produk tanpa satuan cukup angkanya. */
export function formatJumlahStok(jumlah: number, satuan: string | null): string {
  const angka = FORMAT_ANGKA.format(jumlah);
  return satuan ? `${angka} ${satuan}` : angka;
}

function bulatkan(n: number): number {
  return Math.round(n * 1000) / 1000;
}

type BahanPenjualan = Pick<Penjualan, "itemPenjualan" | "rincianStok">;

export function susunStokKeluar(penjualan: BahanPenjualan): StokKeluar {
  const rincian = penjualan.rincianStok ?? [];
  const item = penjualan.itemPenjualan ?? [];

  // Produk yang sama di beberapa baris item digabung, begitu juga bahannya.
  const produk = new Map<string, { nama: string; jumlah: number }>();
  for (const i of item) {
    const ada = produk.get(i.produkID);
    produk.set(i.produkID, { nama: ada?.nama ?? i.namaProduk, jumlah: bulatkan((ada?.jumlah ?? 0) + i.jumlah) });
  }

  const perProduk = new Map<string, Map<string, RincianStokPenjualan>>();
  for (const r of rincian) {
    const baris = perProduk.get(r.produkID) ?? new Map<string, RincianStokPenjualan>();
    const kunci = r.jenis === "BAHAN" ? `B:${r.bahanBakuID}` : `P:${r.produkID}`;
    const ada = baris.get(kunci);
    baris.set(kunci, ada ? { ...ada, jumlah: bulatkan(ada.jumlah + r.jumlah) } : r);
    perProduk.set(r.produkID, baris);
  }

  // Urutan item lebih dulu; produk rincian yang tidak ada di item ditaruh di akhir.
  const urutan = [...produk.keys(), ...[...perProduk.keys()].filter((id) => !produk.has(id))];
  const kelompok: KelompokStokKeluar[] = [];
  for (const produkID of urutan) {
    const baris = perProduk.get(produkID);
    if (!baris) continue;
    const p = produk.get(produkID);
    const daftar = [...baris.entries()].map(([kunci, r]) => ({
      kunci,
      nama: r.nama ?? (r.jenis === "PRODUK" ? p?.nama : null) ?? "-",
      jenis: r.jenis === "BAHAN" ? ("Bahan baku" as const) : ("Stok produk" as const),
      jumlah: formatJumlahStok(r.jumlah, r.satuan),
    }));
    kelompok.push({
      produkID,
      judul: p ? `${p.nama} × ${FORMAT_ANGKA.format(p.jumlah)}` : (daftar[0]?.nama ?? "-"),
      baris: daftar,
    });
  }

  const tanpaPotong = kelompok.length
    ? [...produk.entries()].filter(([id]) => !perProduk.has(id)).map(([, p]) => p.nama)
    : [];
  return { kelompok, tanpaPotong };
}

/** Subjudul kartu: nama outlet hanya bila terbaca dan cocok dengan lokasi rincian. */
export function kalimatLokasiStok(
  rincian: RincianStokPenjualan[] | undefined,
  outlet: { id: string; nama?: string | null } | null | undefined,
): string {
  const lokasi = (rincian ?? []).find((r) => r.locationID)?.locationID;
  if (lokasi && outlet?.nama && outlet.id === lokasi) {
    return `Dipotong dari ${outlet.nama} saat penjualan disimpan.`;
  }
  return "Dipotong saat penjualan disimpan.";
}

export function kalimatStokKosong(status: StatusPenjualan): string {
  return status === "DRAFT"
    ? "Stok belum dipotong. Rinciannya muncul setelah penjualan disimpan."
    : "Tidak ada stok yang tercatat keluar untuk penjualan ini.";
}

export const PESAN_VOID_STOK = "Penjualan ini di-VOID. Stok di bawah tetap keluar dan tidak dikembalikan.";
