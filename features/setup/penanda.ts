/**
 * Penanda isian yang belum ditambahkan di langkah berisi daftar (kategori,
 * bahan baku, produk, dan pajak kedua): isian di form tambah tidak ikut
 * terkirim oleh Simpan dan lanjut, sehingga tombol tambahnya ditonjolkan
 * dan Simpan dan lanjut menjelaskan sebabnya (keputusan pemilik proyek,
 * 7 November 2026; modul/setup-akun.md). Tidak ada yang disimpan diam-diam.
 */

/** Ada isian teks yang terisi; pilihan bawaan seperti satuan tidak ikut dihitung. */
export function adaIsian(nilai: readonly unknown[]): boolean {
  return nilai.some((v) => typeof v === "string" && v.trim() !== "");
}

/** Pesan Simpan dan lanjut saat masih ada isian yang belum ditambahkan atau disimpan. */
export function pesanBelumTersimpan(
  jenis: string,
  nama: string | undefined,
  teksTombol: string,
  kata: "ditambahkan" | "disimpan" = "ditambahkan",
): string {
  const n = (nama ?? "").trim();
  const subjek = n ? `${jenis} "${n}"` : `Isian ${jenis.toLowerCase()}`;
  return `${subjek} belum ${kata}. Tekan ${teksTombol} dulu, atau kosongkan isiannya.`;
}

/** Menggulir ke tombol tambah; dipanggil dari penangan klik, tidak saat render. */
export function gulirKe(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}
