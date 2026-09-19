/**
 * Wewenang dasar dan terlarang pada form role.
 *
 * Sebelumnya kedua konstanta ini disalin di halaman edit dan halaman
 * kostum dengan isi yang sama persis.
 */

/**
 * Wewenang minimum yang selalu dimiliki setiap role, sehingga pengguna
 * dapat membuka aplikasi. Sengaja hanya berisi wewenang baca esensial:
 * update-pengguna tidak dimasukkan agar tidak membocorkan wewenang
 * mengubah data staf lain.
 */
export const IZIN_DASAR = ["read-akun", "read-tenant"];

/**
 * Wewenang yang tidak boleh diberikan lewat form ini karena menyangkut
 * pengelolaan permission itu sendiri. Disembunyikan dari daftar pilihan,
 * tetapi bila sebuah role sudah memilikinya, wewenang itu dipertahankan
 * saat menyimpan agar tidak hilang diam-diam.
 */
export const IZIN_TERLARANG = [
  "create-permission",
  "update-permission",
  "delete-permission",
];