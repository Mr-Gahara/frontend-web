import type { TitikPanduan } from "@/lib/panduan";

/**
 * Teks tur dashboard ruang outlet (disetujui pemilik proyek, 7 November
 * 2026; titik Karyawan dari kanvas "Panduan Wizard Setup"). Titik menu
 * ditandai dengan href menunya (targetMenu) di components/app-sidebar.tsx,
 * dan hanya dimasukkan bila menu itu tampil bagi pengguna (izin dan plan).
 */

export const TARGET_MENU_UTAMA = "menu-utama";

export function targetMenu(href: string): string {
  return "menu:" + href;
}

const TITIK_MENU = [
  {
    href: "/dashboard/outlet/inventaris-data",
    judul: "Kelola barang",
    isi: "Produk jualan, kategori, dan bahan baku yang diisi saat setup dapat ditambah dan diubah di sini.",
  },
  {
    href: "/dashboard/outlet/pengguna",
    judul: "Tambahkan karyawan",
    isi: "Setiap kasir masuk dengan nama dan PIN sendiri. Tambahkan karyawan di sini sebelum mereka memakai aplikasi kasir.",
  },
  {
    href: "/dashboard/outlet/jadwal",
    judul: "Atur jadwal kerja",
    isi: "Tentukan siapa bekerja di shift mana setiap hari.",
  },
  {
    href: "/dashboard/outlet/pengaturan",
    judul: "Pengaturan outlet",
    isi: "Profil toko, pajak, metode pembayaran, role, kategori beban, dan langganan diubah di sini.",
  },
] as const;

/** Href menu yang punya titik tur, berurutan. */
export const HREF_TITIK_MENU: readonly string[] = TITIK_MENU.map((t) => t.href);

/**
 * Titik tur dashboard. Di HP menu berada di sidebar yang dibuka untuk titik
 * menu, sehingga balon diletakkan di bawah menu, bukan di sampingnya.
 */
export function titikDashboard(terlihat: (href: string) => boolean, hp: boolean): TitikPanduan[] {
  return [
    {
      target: TARGET_MENU_UTAMA,
      judul: "Menu halaman",
      isi: hp
        ? "Tekan tombol ini untuk membuka menu. Semua halaman toko ada di sana, dan panduan membukanya untuk Anda sekarang."
        : "Tekan tombol ini untuk menyempitkan atau melebarkan menu. Semua halaman toko ada di menu itu.",
      sisi: "bottom",
    },
    ...TITIK_MENU.filter((t) => terlihat(t.href)).map(
      (t): TitikPanduan => ({ target: targetMenu(t.href), judul: t.judul, isi: t.isi, sisi: hp ? "bottom" : "right" }),
    ),
  ];
}