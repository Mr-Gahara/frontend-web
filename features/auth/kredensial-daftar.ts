/**
 * Kredensial titipan antara daftar (atau login yang dijawab
 * EMAIL_BELUM_TERVERIFIKASI, B232) dan halaman verifikasi email.
 *
 * Backend tidak menerbitkan token saat verifikasi berhasil: klien harus
 * login lagi. Agar pendaftar tidak mengetik ulang password tepat setelah
 * memasukkan kode, password dititipkan di memori, bukan di storage,
 * sehingga hilang saat halaman dimuat ulang. Tanpa titipan, halaman
 * verifikasi mengarahkan ke login dengan email terisi.
 */
export interface KredensialDaftar {
  email: string;
  password: string;
}

let titipan: KredensialDaftar | null = null;

export function titipKredensial(k: KredensialDaftar) {
  titipan = k;
}

/**
 * Mengambil titipan untuk email itu lalu mengosongkannya. Email lain
 * dianggap tidak ada titipan, agar password tidak dipakai untuk akun lain.
 */
export function ambilKredensial(email: string): KredensialDaftar | null {
  const k = titipan;
  titipan = null;
  return k && k.email.toLowerCase() === email.trim().toLowerCase() ? k : null;
}
