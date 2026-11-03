/**
 * Data dan aturan halaman Langganan (modul/setup-akun.md, PL1a sampai PL6a).
 * Plan dan masa berlaku asli menunggu backend (N1); selama itu halaman
 * memakai data contoh dan spanduk pratinjau.
 */
export type KunciPlan = "basic" | "advanced" | "pro";

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

/**
 * Pengecualian sementara: backend belum punya permission langganan, jadi
 * kartu dan halaman Langganan dibatasi lewat role (keputusan pemilik
 * proyek). Diganti pemeriksaan izin begitu permission-nya tersedia.
 */
export function bolehLihatLangganan(role: string): boolean {
  return role === "Owner";
}

export interface RiwayatLangganan {
  tanggal: Date;
  perubahan: string;
  berlakuSampai: Date;
}

export interface DataLangganan {
  plan: KunciPlan;
  percobaan: boolean;
  mulai: Date;
  berakhir: Date;
  riwayat: RiwayatLangganan[];
}

/** Data contoh pratinjau: masa percobaan Basic 14 hari yang dimulai dua hari lalu. */
export function langgananContoh(kini: Date): DataLangganan {
  const mulai = new Date(kini.getTime() - 2 * SEHARI);
  const berakhir = new Date(mulai.getTime() + 14 * SEHARI);
  return {
    plan: "basic",
    percobaan: true,
    mulai,
    berakhir,
    riwayat: [{ tanggal: mulai, perubahan: "Akun dibuat, masa percobaan Basic 14 hari", berlakuSampai: berakhir }],
  };
}

/** Tanggal panjang zona toko (WIB), sama di server dan browser. */
export const formatTanggal = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });