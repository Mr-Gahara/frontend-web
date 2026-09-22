/**
 * Permission dan kebutuhan izin per halaman.
 *
 * Sebelumnya nama permission ditulis langsung di sidebar, dan beberapa di
 * antaranya tidak memberi akses ke data halamannya:
 *   - grup menu inventaris memakai read-inventory-outlet dan
 *     read-inventory-gudang, sehingga menu tersembunyi walau pengguna berhak
 *     atas produk atau kategori. Kedua izin itu sah untuk membaca stok:
 *     GET /inventory menerima salah satu dari read-inventory,
 *     read-inventory-gudang, dan read-inventory-outlet (inventoryRoute.js),
 *     sehingga keduanya dipakai sebagai alternatif pada gate halaman stok
 *   - menu Pengiriman Stok memakai read-pengiriman-stok padahal endpointnya
 *     mewajibkan read-transfer-stok
 *   - banyak menu inventaris tanpa gate sama sekali, sehingga pengguna
 *     melihat menu lalu mendapat 403 saat halaman memuat data
 *
 * Peta di bawah diturunkan dari docs/kontrak/izin-halaman.md bagian 5: untuk setiap
 * halaman, izin yang benar-benar diwajibkan backend bagi endpoint yang
 * dipanggil halaman itu.
 */

/** Permission yang terdaftar di seeds/permissionSeed.js backend. */
export const IZIN = {
  dashboardOutlet: "read-dashboard-outlet",
  dashboardGudang: "read-dashboard-gudang",

  produk: "read-produk",
  kategori: "read-kategori",
  bahan: "read-bahan",
  inventory: "read-inventory",
  inventoryOutlet: "read-inventory-outlet",
  inventoryGudang: "read-inventory-gudang",
  location: "read-location",
  jurnalStok: "read-jurnal-stok",
  stockOpname: "read-stock-opname",
  stockAdjustment: "read-stock-adjustment",
  pengajuanStok: "read-pengajuan-stok",
  transferStok: "read-transfer-stok",

  penjualan: "read-penjualan",
  pembayaran: "read-pembayaran",
  akunKas: "read-akunkas",
  laporan: "read-laporan",
  pelanggan: "read-pelanggan",
  booking: "read-booking",

  pengguna: "read-pengguna",
  role: "read-role",
} as const;

export type Izin = (typeof IZIN)[keyof typeof IZIN];

/**
 * Permission yang mengizinkan pengguna bekerja lintas outlet: melihat data
 * seluruh outlet tenant di ruang outlet (useCakupanLokasiOutlet) dan
 * mengajukan stok atas nama outlet lain (form pengajuan stok). Keputusan
 * pemilik proyek 22 September 2026: akses ditentukan role dan permission,
 * bukan nama role maupun lokasi pengguna.
 *
 * Belum ada di backend; namanya ditetapkan tim backend. Selama null, tidak
 * ada pengguna yang memegangnya, owner pun tidak, sehingga semua pengguna
 * terkunci ke outlet tenant. Di MVP (satu outlet per tenant) datanya sama.
 * Isi dengan nama dari seeder permission backend begitu tersedia; tidak ada
 * perubahan lain yang dibutuhkan.
 */
export const IZIN_LINTAS_OUTLET: string | null = null;

/** True bila pengguna memegang izin lintas outlet; selalu false selama izinnya belum ditetapkan. */
export function bolehLintasOutlet(
  permissions: readonly string[],
  izin: string | null = IZIN_LINTAS_OUTLET,
): boolean {
  return izin !== null && permissions.includes(izin);
}

/**
 * Satu syarat gate: satu izin, atau array izin yang cukup dipenuhi salah
 * satunya, untuk endpoint yang menerima beberapa izin alternatif.
 */
export type SyaratIzin = Izin | readonly Izin[];

/**
 * Izin yang dibutuhkan setiap halaman.
 *
 * Halaman ditampilkan bila pengguna memiliki SELURUH izin dalam daftar,
 * karena halaman memanggil semua endpoint itu saat dimuat. Daftar kosong
 * berarti halaman tidak memuat data berizin.
 *
 * Catatan: shift, pola roster, jadwal shift, pajak, produk pajak, laporan,
 * absensi, dan sebagian data referensi transaksi belum diperiksa backend
 * (catatan tim backend nomor 2 dan 12). Untuk data sensitif seperti laporan
 * dan pelanggan, gate tetap dipasang memakai permission yang sudah ada di
 * seed, sehingga begitu backend memasang checkPermission frontend sudah
 * siap. Untuk data referensi yang memang dibutuhkan kasir saat transaksi
 * (aset, diskon, metode pembayaran, tarif, tipe aset), gate tidak dipasang.
 */
export const IZIN_HALAMAN: Record<string, readonly SyaratIzin[]> = {
  // Outlet
  "/dashboard/outlet": [],
  "/dashboard/outlet/penjualan": [IZIN.penjualan],
  "/dashboard/outlet/pengeluaran": [IZIN.pembayaran],
  "/dashboard/outlet/keuangan/akunkas": [IZIN.akunKas],
  "/dashboard/outlet/keuangan/mutasiArusKas": [IZIN.akunKas],
  "/dashboard/outlet/keuangan/ringkasanLabaRugi": [IZIN.laporan],
  "/dashboard/outlet/pelanggan": [IZIN.pelanggan],
  "/dashboard/outlet/reservasi": [IZIN.booking],
  "/dashboard/outlet/diskon": [],
  "/dashboard/outlet/pengaturan": [],
  "/dashboard/outlet/pengguna": [IZIN.pengguna, IZIN.role],

  // Inventaris outlet
  "/dashboard/outlet/inventaris/produk": [IZIN.produk],
  "/dashboard/outlet/inventaris/kategori": [IZIN.kategori],
  "/dashboard/outlet/inventaris/bahanBaku": [IZIN.location, [IZIN.inventory, IZIN.inventoryOutlet]],
  "/dashboard/outlet/inventaris/stok": [IZIN.location, [IZIN.inventory, IZIN.inventoryOutlet]],
  "/dashboard/outlet/inventaris/stockOpname": [IZIN.stockOpname, IZIN.location],
  "/dashboard/outlet/inventaris/stockAdjustment": [IZIN.stockAdjustment, IZIN.location],
  "/dashboard/outlet/inventaris/jurnalStok": [IZIN.jurnalStok, IZIN.location],
  "/dashboard/outlet/inventaris/pengajuanStok": [IZIN.pengajuanStok, IZIN.location],
  "/dashboard/outlet/inventaris/penerimaanBarang": [IZIN.location, IZIN.transferStok],

  // Jadwal outlet: izin shift, pola roster, dan jadwal belum ada di backend,
  // sehingga gate memakai izin data yang benar-benar diperiksa (daftar karyawan).
  "/dashboard/outlet/jadwal": [IZIN.pengguna],
  "/dashboard/outlet/pola-roster": [],
  "/dashboard/outlet/shift": [],

  // Gudang
  "/dashboard/gudang": [],
  "/dashboard/gudang/inventaris": [IZIN.location, [IZIN.inventory, IZIN.inventoryGudang], IZIN.bahan],
  "/dashboard/gudang/jurnalStok": [IZIN.jurnalStok],
  "/dashboard/gudang/stockOpname": [IZIN.stockOpname],
  "/dashboard/gudang/pengajuanStok": [IZIN.pengajuanStok],
  "/dashboard/gudang/transferStok": [IZIN.transferStok],
  "/dashboard/gudang/pengirimanStok": [IZIN.transferStok],
  "/dashboard/gudang/jadwal": [IZIN.pengguna],
  "/dashboard/gudang/pengguna": [IZIN.pengguna, IZIN.role],
  "/dashboard/gudang/pengaturan": [],
};

/**
 * Menentukan apakah sebuah halaman boleh ditampilkan.
 *
 * Setiap syarat di IZIN_HALAMAN wajib terpenuhi. Syarat berupa array
 * terpenuhi bila salah satu izin di dalamnya dimiliki.
 *
 * Owner memegang seluruh permission di backend (role level 100), sehingga
 * pemeriksaan berbasis daftar permission sudah mencakupnya tanpa perlu
 * memeriksa nama role.
 */
export function bolehBukaHalaman(href: string, dimiliki: string[]): boolean {
  const butuh = IZIN_HALAMAN[href];
  if (!butuh) return true;
  return butuh.every((syarat) =>
    typeof syarat === "string"
      ? dimiliki.includes(syarat)
      : syarat.some((i) => dimiliki.includes(i)),
  );
}

/**
 * Menentukan apakah sebuah grup menu boleh ditampilkan.
 *
 * Grup tidak punya halaman sendiri, sehingga terlihat bila pengguna berhak
 * atas setidaknya satu anaknya.
 */
export function bolehBukaGrup(hrefAnak: string[], dimiliki: string[]): boolean {
  return hrefAnak.some((h) => bolehBukaHalaman(h, dimiliki));
}