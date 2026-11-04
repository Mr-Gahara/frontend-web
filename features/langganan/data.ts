/**
 * Data dan aturan halaman Langganan (modul/setup-akun.md, PL1a sampai PL6a).
 * Plan, masa berlaku, dan riwayat dari GET /akun/langganan dan riwayatnya
 * (B229); aturan tampilannya fungsi murni agar teruji unit.
 */
import type { KunciPlan, LanggananToko, RiwayatLanggananToko } from "@/types/langganan";

export type { KunciPlan };

export interface FiturPlan {
  teks: string;
  ada: boolean;
}

export interface InfoPlan {
  kunci: KunciPlan;
  nama: string;
  fitur: FiturPlan[];
  catatan?: string;
}

const BOOKING = "Sesi booking: aset, tipe aset, dan tarif";
const GUDANG = "Gudang dan WMS: pengajuan dan transfer stok";
const DASAR: FiturPlan[] = [
  "Kasir, pembayaran, dan pelanggan",
  "Stok, bahan baku, dan pembelian",
  "Keuangan dan jadwal shift",
].map((teks) => ({ teks, ada: true }));

export const DAFTAR_PLAN: readonly InfoPlan[] = [
  {
    kunci: "basic",
    nama: "Basic",
    fitur: [...DASAR, { teks: BOOKING, ada: false }, { teks: GUDANG, ada: false }],
  },
  {
    kunci: "advanced",
    nama: "Advanced",
    fitur: [...DASAR, { teks: BOOKING, ada: true }, { teks: GUDANG, ada: false }],
    catatan: "Sesudah naik plan, sesi booking terkunci sampai setup-nya selesai. Kasir tetap berjalan.",
  },
  {
    kunci: "pro",
    nama: "Pro",
    fitur: [...DASAR, { teks: BOOKING, ada: true }, { teks: GUDANG, ada: true }],
    catatan: "Sesudah naik plan, gudang terkunci sampai setup-nya selesai. Kasir tetap berjalan.",
  },
];

/**
 * Nomor WhatsApp admin, format internasional tanpa tanda plus. Kosong sampai
 * ditetapkan pemilik proyek; selama kosong, halaman menampilkan teks tanpa
 * tautan, bukan tautan palsu.
 */
export const NOMOR_WA_ADMIN = "";

/** Tautan wa.me dengan pesan pembuka, atau null bila nomor belum diisi. */
export function tautanWhatsapp(nomor: string, namaToko: string, namaPlan: string): string | null {
  const angka = nomor.replace(/\D/g, "");
  if (!angka) return null;
  const pesan = `Halo admin Tachyon, saya ingin naik plan atau memperpanjang langganan toko ${
    namaToko || "saya"
  } (plan ${namaPlan}).`;
  return `https://wa.me/${angka}?text=${encodeURIComponent(pesan)}`;
}

const SEHARI = 86_400_000;

/** Sisa hari sampai berakhir, dibulatkan ke atas, tidak pernah negatif. */
export function sisaHari(berakhir: Date, kini: Date): number {
  return Math.max(0, Math.ceil((berakhir.getTime() - kini.getTime()) / SEHARI));
}

/** Persen masa berlaku yang sudah terpakai, 0 sampai 100. */
export function persenTerpakai(mulai: Date, berakhir: Date, kini: Date): number {
  const total = berakhir.getTime() - mulai.getTime();
  if (total <= 0) return 100;
  const persen = Math.round(((kini.getTime() - mulai.getTime()) / total) * 100);
  return Math.min(100, Math.max(0, persen));
}

export const namaPlan = (kunci: KunciPlan | null | undefined): string =>
  DAFTAR_PLAN.find((p) => p.kunci === kunci)?.nama ?? "Basic";

export interface RingkasanLangganan {
  plan: KunciPlan;
  /** Basic dengan masa gratis yang belum pernah diperpanjang (PL3a). */
  percobaan: boolean;
  /** null berarti masa akses tidak dibatasi. */
  berakhir: Date | null;
  /** Awal masa berlaku sekarang, dari catatan riwayat yang menetapkannya; null bila tidak diketahui. */
  mulai: Date | null;
  /** Masa akses sudah lewat tetapi akun masih dalam masa tenggang. */
  lewat: boolean;
  tenggangSampai: Date | null;
}

const samaWaktu = (a: string | null, b: Date) => a !== null && new Date(a).getTime() === b.getTime();

/**
 * Backend tidak mengirim penanda masa percobaan maupun tanggal mulai, jadi
 * keduanya dibaca dari riwayat yang sudah dimuat: percobaan berarti Basic
 * berbatas waktu tanpa satu pun catatan berdurasi, dan mulai adalah waktu
 * catatan terbaru yang menetapkan tanggal berakhir sekarang. Bila catatan
 * itu belum dimuat (riwayat panjang), bilah masa berlaku tidak ditampilkan.
 */
export function ringkasLangganan(
  langganan: LanggananToko,
  riwayat: readonly RiwayatLanggananToko[],
  kini: Date,
): RingkasanLangganan {
  const berakhir = langganan.aksesBerakhirPada ? new Date(langganan.aksesBerakhirPada) : null;
  const penetap = berakhir ? riwayat.find((r) => samaWaktu(r.berakhirSesudah, berakhir)) : undefined;
  const lewat = berakhir !== null && berakhir.getTime() <= kini.getTime();
  const tenggang = langganan.masaTenggangHari ?? 0;
  return {
    plan: langganan.plan,
    percobaan:
      langganan.plan === "basic" &&
      berakhir !== null &&
      riwayat.some((r) => r.aksi === "buat" && !r.durasiBulan) &&
      !riwayat.some((r) => (r.durasiBulan ?? 0) > 0),
    berakhir,
    mulai: penetap ? new Date(penetap.createdAt) : null,
    lewat,
    tenggangSampai: lewat && berakhir ? new Date(berakhir.getTime() + tenggang * SEHARI) : null,
  };
}

const bulan = (n: number | null) => (n ? `${n} bulan` : "");

/** Kalimat satu catatan riwayat, dengan nama plan bila berubah. */
export function teksRiwayat(r: RiwayatLanggananToko): string {
  const berubah = r.planSebelum !== null && r.planSesudah !== null && r.planSebelum !== r.planSesudah;
  const ubahPlan = berubah ? `plan ${namaPlan(r.planSebelum)} ke ${namaPlan(r.planSesudah)}` : "";
  switch (r.aksi) {
    case "buat":
      return r.durasiBulan
        ? `Akun dibuat, plan ${namaPlan(r.planSesudah)} ${bulan(r.durasiBulan)}`
        : `Akun dibuat, masa percobaan ${namaPlan(r.planSesudah)}`;
    case "perpanjang":
      return [`Diperpanjang ${bulan(r.durasiBulan)}`.trim(), ubahPlan].filter(Boolean).join(", ");
    case "ubah-plan":
      return berubah ? `Plan diubah dari ${namaPlan(r.planSebelum)} ke ${namaPlan(r.planSesudah)}` : "Plan diubah";
    case "freeze":
      return "Akun dibekukan";
    case "unfreeze":
      return r.durasiBulan ? `Akun diaktifkan kembali, ${bulan(r.durasiBulan)}` : "Akun diaktifkan kembali";
    case "kedaluwarsa":
      return "Masa berlaku habis";
  }
}

/** Tanggal panjang zona toko (WIB), sama di server dan browser. */
export const formatTanggal = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });