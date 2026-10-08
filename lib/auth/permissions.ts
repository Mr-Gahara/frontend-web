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

/**
 * Nama permission yang dikenal web, sesuai route dan seed backend. Satu
 * sumber nama izin: gerbang rute, sidebar, dan aturan aksi di
 * features/<modul>/izin.ts merujuk ke sini. Yang tetap ditulis sebagai
 * teks hanya data template role (lib/roleTemplates.ts).
 */
export const IZIN = {
  // Izin ruang dan izin baca.
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
  pajak: "read-pajak",
  aksesPos: "akses-pos",

  pengguna: "read-pengguna",
  role: "read-role",

  // Izin tulis halaman form: syarat gerbang rute di samping izin bacanya
  // (keputusan GR5a).
  buatPenjualan: "create-penjualan",
  buatPembayaran: "create-pembayaran",
  buatAkunKas: "create-akunkas",
  ubahAkunKas: "update-akunkas",
  buatBooking: "create-booking",
  ubahBooking: "update-booking",
  buatAset: "create-aset",
  ubahAset: "update-aset",
  buatTarif: "create-tarif",
  ubahTarif: "update-tarif",
  buatTipeAset: "create-tipe-aset",
  ubahTipeAset: "update-tipe-aset",
  buatMetodePembayaran: "create-metode-pembayaran",
  ubahMetodePembayaran: "update-metode-pembayaran",
  buatRole: "create-role",
  ubahRole: "update-role",
  buatProduk: "create-produk",
  ubahProduk: "update-produk",
  buatBahan: "create-bahan",
  ubahBahan: "update-bahan",
  buatStockOpname: "create-stock-opname",
  buatPengajuanStok: "create-pengajuan-stok",
  ubahPengajuanStok: "update-pengajuan-stok",
  buatTransferStok: "create-transfer-stok",

  // Izin aksi di dalam halaman: tombol dan bagian mengikuti izin
  // endpoint-nya lewat features/<modul>/izin.ts (keputusan rancangan
  // butir 9 dan 14).
  ubahPenjualan: "update-penjualan",
  hapusPenjualan: "delete-penjualan",
  ubahPembayaran: "update-pembayaran",
  buatDiskon: "create-diskon",
  ubahDiskon: "update-diskon",
  bacaJurnalTransfer: "read-jurnal-transfer",
  buatJurnalTransfer: "create-jurnal-transfer",
  ubahJurnalTransfer: "update-jurnal-transfer",
  buatPajak: "create-pajak",
  ubahPajak: "update-pajak",
  hapusPajak: "delete-pajak",
  buatPelanggan: "create-pelanggan",
  ubahPelanggan: "update-pelanggan",
  hapusPelanggan: "delete-pelanggan",
  hitungStockOpname: "submit-stock-opname",
  tinjauStockOpname: "review-stock-opname",
  kirimTransferStok: "approve-transfer-stok",
  batalTransferStok: "cancel-transfer-stok",
  terimaTransferStok: "receive-transfer-stok",
  setujuiPengajuanStok: "approve-pengajuan-stok",
  tolakPengajuanStok: "reject-pengajuan-stok",
  buatLocation: "create-location",
  ubahLocation: "update-location",
  ubahTenant: "update-tenant",
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
 * Catatan: route shift, pola roster, dan jadwal shift belum memakai
 * checkPermission di backend (catatan tim backend nomor 2 dan 12), dan
 * monitoring absensi memeriksa read-absensi di controller. Laporan memeriksa
 * read-laporan sejak backend 465b438, dan pelanggan memeriksa read-pelanggan
 * sejak backend nizar 8dc6211; gate keduanya sudah dipasang lebih dulu
 * memakai permission yang ada di seed. Untuk data referensi yang memang
 * dibutuhkan kasir saat transaksi (aset, diskon, metode pembayaran, tarif,
 * tipe aset), gate tidak dipasang.
 */
export const IZIN_HALAMAN: Record<string, readonly SyaratIzin[]> = {
  // Akar dan profil: tanpa data berizin.
  "/dashboard": [],
  "/dashboard/profil": [],

  // Outlet
  "/dashboard/outlet": [],
  "/dashboard/outlet/penjualan": [IZIN.penjualan],
  "/dashboard/outlet/penjualan/buatPenjualan": [[IZIN.produk, IZIN.aksesPos], IZIN.pelanggan, IZIN.buatPenjualan],
  "/dashboard/outlet/penjualan/[id]": [IZIN.penjualan],
  "/dashboard/outlet/penjualan/[id]/pembayaran": [IZIN.penjualan, IZIN.buatPembayaran],
  "/dashboard/outlet/pengeluaran": [IZIN.pembayaran],
  "/dashboard/outlet/keuangan/akunkas": [IZIN.akunKas],
  "/dashboard/outlet/keuangan/akunkas/buatAkunKas": [IZIN.buatAkunKas],
  "/dashboard/outlet/keuangan/akunkas/[id]/ubah": [IZIN.akunKas, IZIN.ubahAkunKas],
  // Izin per bagian di dalam halaman (keputusan DN1a).
  "/dashboard/outlet/keuangan/akunkas/pindahDana": [],
  "/dashboard/outlet/keuangan/mutasiArusKas": [IZIN.akunKas],
  "/dashboard/outlet/keuangan/ringkasanLabaRugi": [IZIN.laporan],
  "/dashboard/outlet/pelanggan": [IZIN.pelanggan],
  "/dashboard/outlet/reservasi": [IZIN.booking],
  "/dashboard/outlet/reservasi/buatReservasi": [IZIN.booking, IZIN.pelanggan, IZIN.buatBooking],
  // Master reservasi: GET tanpa izin di backend (keputusan GR6a).
  "/dashboard/outlet/reservasi/aset": [],
  "/dashboard/outlet/reservasi/aset/buatAset": [IZIN.buatAset],
  "/dashboard/outlet/reservasi/aset/[id]/edit": [IZIN.ubahAset],
  "/dashboard/outlet/reservasi/tarif": [],
  "/dashboard/outlet/reservasi/tarif/buatTarif": [IZIN.buatTarif],
  "/dashboard/outlet/reservasi/tarif/[id]/edit": [IZIN.ubahTarif],
  "/dashboard/outlet/reservasi/tipeAset": [],
  "/dashboard/outlet/reservasi/tipeAset/buatTipeAset": [IZIN.buatTipeAset],
  "/dashboard/outlet/reservasi/tipeAset/[id]/edit": [IZIN.ubahTipeAset],
  "/dashboard/outlet/diskon": [],
  "/dashboard/outlet/pengaturan": [],
  // Bukan menu sidebar: dibaca halaman pajak dan kartu indeks pengaturan.
  // GET /pajak menerima read-pajak atau akses-pos sejak backend fc29433.
  "/dashboard/outlet/pengaturan/pajak": [[IZIN.pajak, IZIN.aksesPos]],
  "/dashboard/outlet/pengaturan/metodePembayaran": [],
  // Akun tujuan wajib saat membuat metode, sehingga read-akunkas ikut (GR7a).
  "/dashboard/outlet/pengaturan/metodePembayaran/buatMetodePembayaran": [IZIN.akunKas, IZIN.buatMetodePembayaran],
  "/dashboard/outlet/pengaturan/metodePembayaran/[id]": [IZIN.ubahMetodePembayaran],
  "/dashboard/outlet/pengaturan/roles": [IZIN.role],
  "/dashboard/outlet/pengaturan/roles/buatRole": [IZIN.role, IZIN.buatRole],
  "/dashboard/outlet/pengaturan/roles/buatRole/kostum": [IZIN.role, IZIN.buatRole],
  "/dashboard/outlet/pengaturan/roles/[id]/edit": [IZIN.role, IZIN.ubahRole],
  // Izin per bagian di dalam halaman (keputusan PO14a).
  "/dashboard/outlet/pengaturan/toko": [],
  "/dashboard/outlet/pengguna": [IZIN.pengguna, IZIN.role],

  // Inventaris outlet
  "/dashboard/outlet/inventaris/produk": [IZIN.produk],
  "/dashboard/outlet/inventaris/produk/buatProduk": [IZIN.kategori, IZIN.buatProduk],
  "/dashboard/outlet/inventaris/produk/[id]/edit": [IZIN.produk, IZIN.kategori, IZIN.ubahProduk],
  "/dashboard/outlet/inventaris/kategori": [IZIN.kategori],
  "/dashboard/outlet/inventaris/bahanBaku": [IZIN.location, [IZIN.inventory, IZIN.inventoryOutlet]],
  "/dashboard/outlet/inventaris/bahanBaku/buatBahanBaku": [IZIN.buatBahan],
  "/dashboard/outlet/inventaris/bahanBaku/[id]/edit": [IZIN.bahan, IZIN.ubahBahan],
  "/dashboard/outlet/inventaris/stok": [IZIN.location, [IZIN.inventory, IZIN.inventoryOutlet]],
  "/dashboard/outlet/inventaris/stockOpname": [IZIN.stockOpname, IZIN.location],
  "/dashboard/outlet/inventaris/stockOpname/buatStockOpname": [IZIN.location, IZIN.buatStockOpname],
  "/dashboard/outlet/inventaris/stockOpname/[id]": [IZIN.stockOpname],
  "/dashboard/outlet/inventaris/stockAdjustment": [IZIN.stockAdjustment, IZIN.location],
  "/dashboard/outlet/inventaris/stockAdjustment/[id]": [IZIN.stockAdjustment],
  "/dashboard/outlet/inventaris/jurnalStok": [IZIN.jurnalStok, IZIN.location],
  "/dashboard/outlet/inventaris/pengajuanStok": [IZIN.pengajuanStok, IZIN.location],
  "/dashboard/outlet/inventaris/pengajuanStok/buatPengajuan": [IZIN.bahan, IZIN.location, IZIN.buatPengajuanStok],
  "/dashboard/outlet/inventaris/pengajuanStok/[id]": [IZIN.pengajuanStok],
  "/dashboard/outlet/inventaris/pengajuanStok/[id]/edit": [IZIN.pengajuanStok, IZIN.bahan, IZIN.location, IZIN.ubahPengajuanStok],
  "/dashboard/outlet/inventaris/penerimaanBarang": [IZIN.location, IZIN.transferStok],
  "/dashboard/outlet/inventaris/penerimaanBarang/[id]": [IZIN.transferStok],

  // Jadwal outlet: izin shift, pola roster, dan jadwal belum ada di backend,
  // sehingga gate memakai izin data yang benar-benar diperiksa (daftar karyawan).
  "/dashboard/outlet/jadwal": [IZIN.pengguna],
  "/dashboard/outlet/jadwal/generate": [IZIN.pengguna],
  "/dashboard/outlet/pola-roster": [],
  "/dashboard/outlet/shift": [],

  // Gudang
  "/dashboard/gudang": [],
  // Layout gudang sudah memutuskan siapa yang boleh setup (keputusan GD4a).
  "/dashboard/gudang/setup": [],
  "/dashboard/gudang/inventaris": [IZIN.location, [IZIN.inventory, IZIN.inventoryGudang], IZIN.bahan],
  "/dashboard/gudang/jurnalStok": [IZIN.jurnalStok],
  "/dashboard/gudang/stockOpname": [IZIN.stockOpname],
  "/dashboard/gudang/stockOpname/buatStockOpname": [IZIN.location, IZIN.buatStockOpname],
  "/dashboard/gudang/stockOpname/[id]": [IZIN.stockOpname],
  "/dashboard/gudang/stockAdjustment": [IZIN.stockAdjustment],
  "/dashboard/gudang/stockAdjustment/[id]": [IZIN.stockAdjustment],
  "/dashboard/gudang/pengajuanStok": [IZIN.pengajuanStok],
  "/dashboard/gudang/pengajuanStok/[id]": [IZIN.pengajuanStok],
  "/dashboard/gudang/transferStok": [IZIN.transferStok],
  "/dashboard/gudang/transferStok/[id]": [IZIN.transferStok],
  "/dashboard/gudang/transferStok/[id]/edit": [IZIN.transferStok, IZIN.buatTransferStok],
  "/dashboard/gudang/pengirimanStok": [IZIN.transferStok],
  "/dashboard/gudang/jadwal": [IZIN.pengguna],
  "/dashboard/gudang/jadwal/generate": [IZIN.pengguna],
  "/dashboard/gudang/shift": [],
  "/dashboard/gudang/pola-roster": [],
  "/dashboard/gudang/pengguna": [IZIN.pengguna, IZIN.role],
  "/dashboard/gudang/pengaturan": [IZIN.location],
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
  return penuhiSyarat(butuh, dimiliki);
}

function penuhiSyarat(butuh: readonly SyaratIzin[], dimiliki: string[]): boolean {
  return butuh.every((syarat) =>
    typeof syarat === "string"
      ? dimiliki.includes(syarat)
      : syarat.some((i) => dimiliki.includes(i)),
  );
}

/** Kunci IZIN_HALAMAN yang memuat segmen berparameter, misalnya [id]. */
const POLA_HALAMAN = Object.keys(IZIN_HALAMAN)
  .filter((kunci) => kunci.includes("["))
  .map((kunci) => ({ kunci, bagian: kunci.split("/") }));

/**
 * Syarat izin sebuah rute nyata (hasil usePathname).
 *
 * Kunci yang cocok persis didahulukan, sehingga rute statis seperti
 * penjualan/buatPenjualan tidak pernah jatuh ke pola penjualan/[id]. Pola
 * hanya cocok bila jumlah segmennya sama. Rute yang tidak dikenal
 * mengembalikan undefined.
 */
export function syaratRute(pathname: string): readonly SyaratIzin[] | undefined {
  const persis = IZIN_HALAMAN[pathname];
  if (persis) return persis;
  const bagian = pathname.split("/");
  const cocok = POLA_HALAMAN.find(
    (pola) =>
      pola.bagian.length === bagian.length &&
      pola.bagian.every((b, i) => (b.startsWith("[") ? bagian[i] !== "" : b === bagian[i])),
  );
  return cocok ? IZIN_HALAMAN[cocok.kunci] : undefined;
}

/**
 * Menentukan apakah isi sebuah rute boleh dipasang; dipakai gerbang rute
 * di layout dashboard (keputusan GR1a). Halaman detail menuntut izin baca,
 * dan halaman form menuntut izin baca beserta izin tulisnya (GR5a).
 */
export function bolehBukaRute(pathname: string, dimiliki: string[]): boolean {
  const butuh = syaratRute(pathname);
  if (!butuh) return true;
  return penuhiSyarat(butuh, dimiliki);
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