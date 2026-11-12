import type { LanggananToko } from "@/types/langganan";
import { formatTanggal, namaPlan, persenTerpakai, sisaHari } from "./data";

/** Pengingat "hampir habis" tampil mulai 7 hari sebelum akses berakhir (pemilik proyek, 12 November 2026). */
export const AMBANG_PENGINGAT_HARI = 7;
/** Bawaan backend (GRACE_PERIOD_DAYS) bila masaTenggangHari tidak dikirim. */
const TENGGANG_BAWAAN_HARI = 7;
const SEHARI = 86_400_000;

export interface PengingatLangganan {
  jenis: "hampir-habis" | "tenggang";
  judul: string;
  isi: string;
  /** Lebar bilah 0 sampai 100, atau null bila tidak diketahui. */
  persen: number | null;
}

const teksSisa = (hari: number) => (hari === 0 ? "hari ini" : `${hari} hari lagi`);

/**
 * Pengingat masa langganan untuk lonceng topbar (desain C, pemilik proyek
 * 12 November 2026). Tidak ada pengingat untuk akses tanpa batas, akses yang
 * masih lebih dari tujuh hari, atau akun nonaktif (sudah dibekukan, sehingga
 * pengguna tidak sampai ke dashboard). Masa tenggang dihitung dari
 * aksesBerakhirPada ditambah masaTenggangHari, sama dengan batasTenggang
 * backend; bilahnya menunjukkan bagian tenggang yang sudah lewat. Bilah
 * hampir habis menunjukkan masa berlaku terpakai bila awal masa berlakunya
 * diketahui dari riwayat.
 */
export function pengingatLangganan(
  langganan: LanggananToko,
  kini: Date,
  mulai: Date | null = null,
): PengingatLangganan | null {
  if (!langganan.aksesBerakhirPada || langganan.status !== "aktif") return null;
  const berakhir = new Date(langganan.aksesBerakhirPada);
  const plan = namaPlan(langganan.plan);

  if (berakhir.getTime() > kini.getTime()) {
    const sisa = sisaHari(berakhir, kini);
    if (sisa > AMBANG_PENGINGAT_HARI) return null;
    return {
      jenis: "hampir-habis",
      judul: "Langganan segera berakhir",
      isi: `Plan ${plan} berakhir ${formatTanggal(berakhir)}, ${teksSisa(sisa)}. Perpanjang lewat admin Tachyon.`,
      persen: mulai ? persenTerpakai(mulai, berakhir, kini) : null,
    };
  }

  const tenggang = langganan.masaTenggangHari ?? TENGGANG_BAWAAN_HARI;
  const dibekukan = new Date(berakhir.getTime() + tenggang * SEHARI);
  const sisa = sisaHari(dibekukan, kini);
  return {
    jenis: "tenggang",
    judul: "Masa tenggang langganan",
    isi: `Masa akses plan ${plan} berakhir ${formatTanggal(berakhir)}. Akun dibekukan ${formatTanggal(dibekukan)}, ${teksSisa(sisa)}, bila belum diperpanjang.`,
    persen: persenTerpakai(berakhir, dibekukan, kini),
  };
}
