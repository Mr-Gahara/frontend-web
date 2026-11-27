import type { TitikPanduan } from "@/lib/panduan";

/**
 * Teks tur dashboard ruang outlet dan gudang. Ruang outlet (disetujui pemilik proyek, 7 November
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
    // Urutan menyiapkan absensi (KS12a, PW18).
    isi: "Tentukan siapa bekerja di shift mana setiap hari. Urutannya: tambah karyawan, buat Master Shift, buat Pola Roster, lalu Generate Jadwal.",
  },
  {
    href: "/dashboard/outlet/pengaturan",
    judul: "Pengaturan outlet",
    isi: "Profil toko, pajak, metode pembayaran, role, kategori beban, dan langganan diubah di sini.",
  },
] as const;

/**
 * Teks tur dashboard ruang gudang (pemilik proyek, 17 November 2026; TG1a):
 * alur barang keluar diperkenalkan, menu lain ditemukan dari sidebar.
 */
const TITIK_MENU_GUDANG = [
  {
    href: "/dashboard/gudang/inventaris",
    judul: "Kelola barang gudang",
    isi: "Gudang baru mulai kosong. Masukkan barang dari master data toko di sini, lalu pantau stok gudang.",
  },
  {
    href: "/dashboard/gudang/pengajuanStok",
    judul: "Tinjau pengajuan outlet",
    isi: "Permintaan barang dan pengembalian dari outlet masuk ke sini untuk disetujui atau ditolak.",
  },
  {
    href: "/dashboard/gudang/transferStok",
    judul: "Kirim barang ke outlet",
    isi: "Permintaan yang disetujui dikirim lewat surat jalan yang dibuat di sini.",
  },
  {
    href: "/dashboard/gudang/pengguna",
    judul: "Tambahkan petugas gudang",
    isi: "Setiap petugas masuk dengan nama dan PIN sendiri. Tambahkan petugas di sini.",
  },
  {
    href: "/dashboard/gudang/pengaturan",
    judul: "Pengaturan gudang",
    isi: "Nama, alamat, koordinat, dan radius absen gudang diubah di sini.",
  },
] as const;

export type RuangPanduan = "outlet" | "gudang";

const TITIK_MENU_RUANG = { outlet: TITIK_MENU, gudang: TITIK_MENU_GUDANG } as const;

/** Href menu yang punya titik tur, berurutan. */
export const HREF_TITIK_MENU: readonly string[] = TITIK_MENU.map((t) => t.href);
export const HREF_TITIK_MENU_GUDANG: readonly string[] = TITIK_MENU_GUDANG.map((t) => t.href);

/**
 * Titik tur dashboard. Di HP menu berada di sidebar yang dibuka untuk titik
 * menu, sehingga balon diletakkan di bawah menu, bukan di sampingnya.
 */
export function titikDashboard(
  terlihat: (href: string) => boolean,
  hp: boolean,
  ruang: RuangPanduan = "outlet",
): TitikPanduan[] {
  return [
    {
      target: TARGET_MENU_UTAMA,
      judul: "Menu halaman",
      isi: hp
        ? "Tekan tombol ini untuk membuka menu. Semua halaman toko ada di sana, dan panduan membukanya untuk Anda sekarang."
        : "Tekan tombol ini untuk menyempitkan atau melebarkan menu. Semua halaman toko ada di menu itu.",
      sisi: "bottom",
    },
    ...TITIK_MENU_RUANG[ruang].filter((t) => terlihat(t.href)).map(
      (t): TitikPanduan => ({ target: targetMenu(t.href), judul: t.judul, isi: t.isi, sisi: hp ? "bottom" : "right" }),
    ),
  ];
}
/**
 * Kunci tur dashboard, atau null bila tur belum boleh berjalan. Ruang gudang
 * menunggu penjaganya mengizinkan ruang dibuka: selagi lokasi dimuat topbar
 * sudah terpasang, dan tur yang terbuka di balik pemuat lalu dilepas oleh
 * pengalihan ke Setup Gudang tercatat sudah dilihat sebelum Gudang terdaftar
 * (TG2a; suite penuh 17 November 2026). Di Setup Gudang tur tidak tampil.
 */
export function kunciPanduanDashboard(m: {
  penggunaId: string | null;
  ruang: RuangPanduan;
  diSetupGudang: boolean;
  gudangDiizinkan: boolean;
}): string | null {
  if (!m.penggunaId) return null;
  if (m.ruang === "outlet") return "dashboard." + m.penggunaId;
  if (m.diSetupGudang || !m.gudangDiizinkan) return null;
  return "dashboard-gudang." + m.penggunaId;
}

/**
 * Tombol Lihat panduan dashboard di ruang gudang tidak dipasang selama tur
 * gudang tidak berlaku: gudang di luar plan, atau akses gudang ditolak
 * (pemilik proyek, 24 November 2026). Sebelumnya tombol itu membuka tur satu
 * titik di halaman "Gudang belum termasuk plan Anda". Ruang outlet tidak
 * berubah.
 */
export function tombolPanduanGudangTampil(m: { planMencakupGudang: boolean; aksesGudang: string }): boolean {
  return m.planMencakupGudang && m.aksesGudang !== "ditolak";
}
