/**
 * Isi laman utama (desain G kanvas "Laman Utama Tachyon POS", LU1a): ruang
 * kerja, paket tanpa harga, tahapan mulai, dan tanya jawab. Data dasbor
 * contoh di ilustrasi hero juga di sini, agar ilustrasi hanya berisi tata
 * letak.
 */

export const NAV_BAGIAN = [
  { href: "#ruang", label: "Ruang kerja" },
  { href: "#paket", label: "Paket" },
  { href: "#mulai", label: "Cara mulai" },
  { href: "#tanya", label: "Tanya jawab" },
] as const;

export const RUANG = [
  {
    label: "Ruang outlet",
    judul: "Tempat berjualan setiap hari",
    isi: "Kasir, pembayaran, dan stok bahan yang dipakai resep produk, lengkap dengan keuangan toko.",
    daftar: [
      "Kasir dan Mesin Kasir",
      "Stok, bahan baku, dan stock opname",
      "Pembelian stok dan beban",
      "Mutasi kas dan arus kas",
      "Sesi booking (Advanced)",
    ],
  },
  {
    label: "Ruang gudang · Pro",
    judul: "Tempat stok disiapkan untuk outlet",
    isi: "Outlet mengajukan kebutuhan, gudang membuat surat jalan, dan outlet menerima barangnya.",
    daftar: [
      "Pengajuan stok dari outlet",
      "Surat jalan dan pengiriman",
      "Penerimaan barang",
      "Jurnal stok per lokasi",
      "Jadwal shift gudang",
    ],
  },
] as const;

export interface FiturPaket {
  teks: string;
  ada: boolean;
}

const fiturDasar: FiturPaket[] = [
  { teks: "Kasir, pembayaran, pelanggan", ada: true },
  { teks: "Stok, bahan baku, pembelian", ada: true },
  { teks: "Keuangan dan jadwal shift", ada: true },
];

/** Paket tanpa harga (keputusan pemilik proyek); garis atas navy, karamel, sage. */
export const PAKET = [
  {
    nama: "Basic",
    untuk: "Satu outlet yang berjualan langsung.",
    garis: "border-navy",
    fitur: [...fiturDasar, { teks: "Sesi booking", ada: false }, { teks: "Gudang dan WMS", ada: false }],
  },
  {
    nama: "Advanced",
    untuk: "Ditambah meja, ruang, atau lapangan yang disewa per sesi.",
    garis: "border-karamel",
    fitur: [...fiturDasar, { teks: "Sesi booking", ada: true }, { teks: "Gudang dan WMS", ada: false }],
  },
  {
    nama: "Pro",
    untuk: "Ditambah gudang yang memasok outlet.",
    garis: "border-sage",
    fitur: [...fiturDasar, { teks: "Sesi booking", ada: true }, { teks: "Gudang dan WMS", ada: true }],
  },
] as const;

export const LANGKAH = [
  {
    no: "1",
    judul: "Daftar dengan email toko",
    isi: "Buat akun toko dan verifikasi email. Masa coba dimulai saat itu juga.",
  },
  {
    no: "2",
    judul: "Setup toko",
    isi: "Wizard menuntun outlet, Owner, produk pertama, pajak, dan jam buka. Bisa dilanjutkan kapan saja.",
  },
  {
    no: "3",
    judul: "Karyawan masuk dengan PIN",
    isi: "Setiap karyawan memilih namanya dan mengetik PIN, lalu kasir siap dibuka.",
  },
] as const;

export const TANYA_JAWAB = [
  {
    tanya: "Bisakah satu akun dipakai banyak karyawan?",
    jawab:
      "Bisa. Satu akun toko dipakai bersama; setiap karyawan masuk dengan nama dan PIN, dan yang bisa dibuka mengikuti posisinya.",
  },
  {
    tanya: "Apakah stok berkurang sendiri saat ada penjualan?",
    jawab:
      "Ya. Resep produk menyebut bahan baku dan takarannya, sehingga setiap penjualan mengurangi stok bahan yang dipakai.",
  },
  {
    tanya: "Bagaimana cara mendaftar?",
    jawab:
      "Tekan Coba gratis, isi email toko dan password, masukkan kode yang dikirim ke email, lalu ikuti wizard setup toko.",
  },
  {
    tanya: "Bisakah naik paket nanti?",
    jawab:
      "Bisa, lewat halaman Langganan. Fitur barunya terbuka setelah setup-nya selesai, dan kasir tetap berjalan selama itu.",
  },
  {
    tanya: "Saya punya gudang. Paket mana yang cocok?",
    jawab: "Pro. Paket ini menambah ruang gudang: pengajuan stok dari outlet, surat jalan, dan penerimaan barang.",
  },
] as const;

/* ---- Data contoh ilustrasi dasbor ---- */

export const KPI_CONTOH = [
  { judul: "Omzet Hari Ini", nilai: "Rp 2.145.000", tren: "↑ 12,0%", naik: true, pembanding: "dari kemarin" },
  { judul: "Transaksi Hari Ini", nilai: "86 transaksi", tren: "↑ 8", naik: true, pembanding: "dari kemarin" },
  { judul: "Laba Bersih (Kemarin)", nilai: "Rp 720.000", tren: "↑ 4,2%", naik: true, pembanding: "dari biasanya" },
  { judul: "HPP (Kemarin)", nilai: "Rp 980.000", tren: "↓ 2,1%", naik: false, pembanding: "dari biasanya" },
] as const;

export type StatusVenue = "Dipakai" | "Kosong" | "Perbaikan";

export const VENUE_CONTOH: { nama: string; status: StatusVenue }[] = [
  { nama: "Meja 1", status: "Dipakai" },
  { nama: "Meja 2", status: "Kosong" },
  { nama: "Ruang A", status: "Perbaikan" },
  { nama: "Meja 3", status: "Dipakai" },
  { nama: "Meja 4", status: "Kosong" },
  { nama: "Meja 5", status: "Kosong" },
  { nama: "Meja 6", status: "Dipakai" },
  { nama: "Ruang B", status: "Kosong" },
];
