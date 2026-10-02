/**
 * Pesan sekali pakai untuk halaman login. Dititipkan sebelum sesi diakhiri
 * (misalnya setelah PIN diubah, keputusan PF7a), lalu diambil layout area
 * login saat terpasang. Toast biasa tidak sampai ke sana: Toaster dashboard
 * ikut dilepas saat berpindah, dan Toaster login hanya menerima toast yang
 * ditembakkan setelah ia terpasang. Hanya hidup di memori, sehingga hilang
 * saat halaman dimuat ulang.
 */
export interface PesanLogin {
  judul: string;
  deskripsi: string;
}

let titipan: PesanLogin | null = null;

export function titipPesanLogin(pesan: PesanLogin) {
  titipan = pesan;
}

/** Mengambil pesan titipan dan mengosongkannya, agar tampil sekali saja. */
export function ambilPesanLogin(): PesanLogin | null {
  const pesan = titipan;
  titipan = null;
  return pesan;
}