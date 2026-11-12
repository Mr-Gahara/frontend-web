/**
 * Kredensial titipan antara daftar (atau login yang dijawab
 * EMAIL_BELUM_TERVERIFIKASI, B232) dan halaman verifikasi email.
 *
 * Sejak B248 verifikasi email wajib membawa password, dan password itu
 * menjadi password akun (A-01). Backend juga tidak menerbitkan token saat
 * verifikasi berhasil, sehingga klien login lagi dengan password yang sama.
 * Password dititipkan di memori, bukan di storage, sehingga hilang saat
 * halaman dimuat ulang. Tanpa titipan, halaman verifikasi meminta pendaftar
 * mengisi password akun sendiri (B248, opsi A).
 */
export interface KredensialDaftar {
  email: string;
  password: string;
}

let titipan: KredensialDaftar | null = null;

export function titipKredensial(k: KredensialDaftar) {
  titipan = k;
}

const cocok = (k: KredensialDaftar | null, email: string) =>
  k && k.email.toLowerCase() === email.trim().toLowerCase() ? k : null;

/**
 * Membaca titipan untuk email itu tanpa mengosongkannya, agar kode yang
 * salah dapat diulang dengan password yang sama. Email lain dianggap tidak
 * ada titipan, agar password tidak dipakai untuk akun lain.
 */
export function lihatKredensial(email: string): KredensialDaftar | null {
  return cocok(titipan, email);
}

/** Mengambil titipan untuk email itu lalu mengosongkannya, setelah verifikasi berhasil. */
export function ambilKredensial(email: string): KredensialDaftar | null {
  const k = titipan;
  titipan = null;
  return cocok(k, email);
}
