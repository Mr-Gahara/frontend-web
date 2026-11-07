import type { KunciPlan } from "@/types/langganan";
import { daftarLangkah, type KunciLangkah, type LangkahSetup } from "./langkah";

/** Kunci langkah GET /api/setup/status (B220, docs/api/endpoint/setup.md backend). */
export type KunciLangkahServer =
  | "namaToko"
  | "owner"
  | "outlet"
  | "kategoriProduk"
  | "produk"
  | "bahanBaku"
  | "pajak"
  | "tipeAset"
  | "aset"
  | "tarif"
  | "gudang";

export interface LangkahServer {
  kunci: KunciLangkahServer;
  bagian: "inti" | "sesi-booking" | "wms";
  wajibUntuk: KunciPlan[];
  wajib: boolean;
  selesai: boolean;
}

interface BagianSetup {
  selesai: boolean;
  selesaiPada: string | null;
}

interface FiturSetup extends BagianSetup {
  termasukPlan: boolean;
}

/** data GET /api/setup/status. plan null hanya untuk akun admin. */
export interface StatusSetup {
  adaToko: boolean;
  plan: KunciPlan | null;
  inti: BagianSetup;
  fitur: { "sesi-booking": FiturSetup; wms: FiturSetup };
  langkah: LangkahServer[];
}

/** Langkah web beserta langkah server penyusunnya; urutan web menaruh bahan baku sebelum produk. */
const PETA_LANGKAH: Record<KunciLangkah, KunciLangkahServer[]> = {
  toko: ["namaToko"],
  owner: ["owner"],
  lokasi: ["outlet"],
  // Belum ada padanan di GET /api/setup/status; langkahnya belum masuk
  // daftarLangkah sampai penyambungan, sehingga nilai ini belum dibaca.
  jamBuka: [],
  kategori: ["kategoriProduk"],
  bahanBaku: ["bahanBaku"],
  produk: ["produk"],
  pajak: ["pajak"],
  booking: ["tipeAset", "aset", "tarif"],
  gudang: ["gudang"],
};

/** Plan untuk menyusun wizard: dari status, Basic bila tidak dikenal. */
export function planSetup(status: StatusSetup): KunciPlan {
  return status.plan ?? "basic";
}

/**
 * Selesai tidaknya tiap langkah web, dari data saat ini. Booking selesai
 * hanya bila tipe aset, aset, dan tarif ketiganya selesai. Bahan baku
 * dilaporkan selesai selama belum ada produk beresep (wajib false); di web
 * langkah itu dianggap belum selesai sampai produk selesai, agar pemilik
 * toko tetap melewatinya dan dapat memilih memakai resep.
 */
export function selesaiPerLangkah(status: StatusSetup): Record<KunciLangkah, boolean> {
  const server = new Map(status.langkah.map((l) => [l.kunci, l]));
  const selesai = (k: KunciLangkahServer) => server.get(k)?.selesai === true;
  const hasil = {} as Record<KunciLangkah, boolean>;
  for (const [kunci, sumber] of Object.entries(PETA_LANGKAH) as [KunciLangkah, KunciLangkahServer[]][]) {
    hasil[kunci] = sumber.every(selesai);
  }
  hasil.bahanBaku = hasil.bahanBaku && (server.get("bahanBaku")?.wajib === true || hasil.produk);
  return hasil;
}

/** Langkah wizard menurut plan akun. */
export function langkahDariStatus(status: StatusSetup): readonly LangkahSetup[] {
  return daftarLangkah(planSetup(status));
}

/** Indeks langkah pertama yang belum selesai; panjang daftar bila semuanya selesai. */
export function indeksAwal(status: StatusSetup): number {
  const selesai = selesaiPerLangkah(status);
  const langkah = langkahDariStatus(status);
  const i = langkah.findIndex((l) => !selesai[l.kunci]);
  return i === -1 ? langkah.length : i;
}

/**
 * Setup tidak perlu dibuka lagi: setup inti dan setiap fitur yang termasuk
 * plan sudah pernah selesai. Memakai selesai per bagian, yang tidak hilang
 * walau datanya kemudian dihapus (SA3a).
 */
export function setupTuntas(status: StatusSetup): boolean {
  const fitur = Object.values(status.fitur);
  return status.inti.selesai && fitur.every((f) => !f.termasukPlan || f.selesai);
}

/** Owner sudah terdaftar, sehingga langkah sesudahnya memerlukan sesi pengguna Owner. */
export function ownerTerdaftar(status: StatusSetup): boolean {
  return status.langkah.some((l) => l.kunci === "owner" && l.selesai);
}

/** Izin untuk menindaklanjuti setup sebuah fitur (keputusan pemilik proyek, 5 November 2026). */
const IZIN_SETUP_FITUR: Record<"sesi-booking" | "wms", readonly string[]> = {
  "sesi-booking": ["create-tipe-aset", "create-aset", "create-tarif"],
  wms: ["create-location"],
};

/**
 * Fitur termasuk plan yang setup-nya belum pernah selesai dan dapat
 * dilengkapi pengguna ini, untuk banner "Lengkapi setup" di dashboard.
 */
export function fiturPerluSetup(status: StatusSetup, permissions: readonly string[]): ("sesi-booking" | "wms")[] {
  return (["sesi-booking", "wms"] as const).filter((f) => {
    const fitur = status.fitur[f];
    return fitur.termasukPlan && !fitur.selesai && IZIN_SETUP_FITUR[f].every((i) => permissions.includes(i));
  });
}
