/**
 * Nama izin yang mudah dipahami untuk pesan 403 (pemilik proyek, 23 November
 * 2026): deskripsi dari backend (GET /permission, seed permission) bila ada,
 * selain itu nama teknis dirapikan, misalnya read-absensi menjadi
 * "Lihat absensi".
 */

const KATA_KERJA: Record<string, string> = {
  read: "Lihat",
  create: "Buat",
  update: "Ubah",
  delete: "Hapus",
  approve: "Setujui",
  submit: "Ajukan",
  review: "Tinjau",
  cancel: "Batalkan",
  kelola: "Kelola",
  akses: "Akses",
};

const KATA: Record<string, string> = {
  akunkas: "akun kas",
  sesikasir: "sesi kasir",
  bahan: "bahan baku",
  inventory: "stok",
  location: "lokasi",
};

export function rapikanNamaIzin(nama: string): string {
  const [kerja, ...sisa] = nama.split("-");
  const objek = sisa.map((k) => KATA[k] ?? k).join(" ");
  const awal = KATA_KERJA[kerja];
  if (!awal) return nama.replace(/-/g, " ").replace("tipe aset", "kategori aset");
  // Sebutan tampilan "kategori aset" (KA1a); nama izin backend tetap tipe-aset.
  const teks = objek.replace("tipe aset", "kategori aset");
  return teks ? `${awal} ${teks}` : awal;
}

export function labelIzin(nama: string, deskripsi?: ReadonlyMap<string, string>): string {
  const teks = deskripsi?.get(nama)?.trim();
  return teks || rapikanNamaIzin(nama);
}

/** Satu syarat: satu izin, atau "Salah satu: A, atau B" untuk izin alternatif. */
export function labelSyarat(pilihan: readonly string[], deskripsi?: ReadonlyMap<string, string>): string {
  const label = pilihan.map((n) => labelIzin(n, deskripsi));
  if (label.length === 1) return label[0];
  return `Salah satu: ${label.slice(0, -1).join(", ")}, atau ${label[label.length - 1]}`;
}
