export interface RoleTemplate {
  id: string;
  namaRole: string;
  deskripsi: string;
  level: number;
  permissions: string[];
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  // GUEST — Level 5
  // Akses baca keuangan saja. Untuk auditor/pajak.
  {
    id: "guest",
    namaRole: "Guest",
    deskripsi:
      "Akses terbatas hanya untuk membaca laporan dan data keuangan. Cocok untuk auditor eksternal atau petugas pajak.",
    level: 5,
    permissions: [
      "read-akun",
      "read-tenant",
      // Keuangan
      "read-akunkas",
      "read-pembayaran",
      "read-penjualan",
      "read-laporan",
    ],
  },

  // STAFF — Level 10
  // Akses baca dasar operasional. Untuk karyawan baru atau magang.
  {
    id: "staff",
    namaRole: "Staff",
    deskripsi:
      "Akses baca dasar untuk operasional harian. Cocok untuk karyawan baru atau magang yang belum perlu melakukan perubahan data.",
    level: 10,
    permissions: [
      "read-akun",
      "read-tenant",
      // Produk
      "read-kategori",
      "read-produk",
      "read-bahan",
      // Penjualan
      "read-penjualan",
      // Inventory
      "read-inventory-outlet",
      // Dashboard
      "read-dashboard-outlet",
    ],
  },

  // KASIR — Level 20
  // Operasional POS penuh. Untuk staf kasir.
  {
    id: "kasir",
    namaRole: "Kasir",
    deskripsi:
      "Akses operasional POS — transaksi penjualan, pelanggan, dan pembayaran. Cocok untuk staf kasir front-line.",
    level: 20,
    permissions: [
      "read-akun",
      "read-tenant",
      // Produk
      "read-kategori",
      "read-produk",
      // POS & Transaksi
      "akses-pos",
      "create-penjualan",
      "read-penjualan",
      // Pelanggan
      "read-pelanggan",
      "create-pelanggan",
      "update-pelanggan",
      // Pembayaran
      "read-pembayaran",
      "create-pembayaran",
      // Inventory
      "read-inventory-outlet",
    ],
  },

  // SUPERVISOR — Level 40
  // Kasir + manajemen stok & laporan. Untuk pengawas shift.
  {
    id: "supervisor",
    namaRole: "Supervisor",
    deskripsi:
      "Akses operasional penuh termasuk manajemen stok, jurnal, dan laporan. Cocok untuk pengawas shift atau kepala kasir.",
    level: 40,
    permissions: [
      "read-akun",
      "read-tenant",
      // Produk
      "read-kategori",
      "read-produk",
      "read-bahan",
      // POS & Transaksi
      "akses-pos",
      "create-penjualan",
      "read-penjualan",
      "update-penjualan",
      // Pelanggan
      "read-pelanggan",
      "create-pelanggan",
      "update-pelanggan",
      // Pembayaran
      "read-pembayaran",
      "create-pembayaran",
      "update-pembayaran",
      // Inventory
      "read-inventory",
      "read-inventory-outlet",
      "read-inventory-gudang",
      "create-inventory",
      "opname-inventory",
      "update-inventory-minimum",
      // Lokasi
      "read-location",
      // Jurnal Stok
      "read-jurnal-stok",
      "create-jurnal-stok",
      // Pengajuan Stok
      "read-pengajuan-stok",
      "create-pengajuan-stok",
      "update-pengajuan-stok",
      // Laporan & Dashboard
      "read-laporan",
      "read-dashboard-outlet",
      "read-dashboard-gudang",
    ],
  },

  // MANAJER — Level 60
  // Operasional + CRUD produk/stok/aset. Untuk kepala toko.
  {
    id: "manajer",
    namaRole: "Manajer",
    deskripsi:
      "Akses manajerial penuh — CRUD produk, kategori, diskon, stok, booking aset, dan supervisi SDM dasar. Cocok untuk kepala toko atau store manager.",
    level: 60,
    permissions: [
      "read-akun",
      "read-tenant",
      // Produk & Kategori
      "read-kategori",
      "create-kategori",
      "update-kategori",
      "delete-kategori",
      "read-produk",
      "create-produk",
      "update-produk",
      "delete-produk",
      "read-bahan",
      "create-bahan",
      "update-bahan",
      "delete-bahan",
      // POS & Transaksi
      "akses-pos",
      "create-penjualan",
      "read-penjualan",
      "update-penjualan",
      "delete-penjualan",
      // Pelanggan
      "read-pelanggan",
      "create-pelanggan",
      "update-pelanggan",
      "delete-pelanggan",
      // Pembayaran
      "read-pembayaran",
      "create-pembayaran",
      "update-pembayaran",
      "delete-pembayaran",
      // Pengaturan Toko
      "read-akunkas",
      "create-akunkas",
      "update-akunkas",
      "create-metode-pembayaran",
      "update-metode-pembayaran",
      "create-diskon",
      "update-diskon",
      "delete-diskon",
      // Inventory & Stok
      "read-inventory",
      "read-inventory-outlet",
      "read-inventory-gudang",
      "create-inventory",
      "delete-inventory",
      "opname-inventory",
      "update-inventory-minimum",
      "read-location",
      "create-location",
      "update-location",
      "read-jurnal-stok",
      "create-jurnal-stok",
      "update-jurnal-stok",
      "delete-jurnal-stok",
      "read-pengajuan-stok",
      "create-pengajuan-stok",
      "update-pengajuan-stok",
      "approve-pengajuan-stok",
      "reject-pengajuan-stok",
      "read-transfer-stok",
      "create-transfer-stok",
      "approve-transfer-stok",
      "receive-transfer-stok",
      "read-pengiriman-stok",
      "create-pengiriman-stok",
      // Aset & Booking
      "create-tipe-aset",
      "update-tipe-aset",
      "create-aset",
      "update-aset",
      "create-tarif",
      "update-tarif",
      "read-booking",
      "create-booking",
      "update-booking",
      // Pengguna & Role (view only)
      "read-pengguna",
      "read-role",
      // SDM
      "read-kontrak-kompensasi",
      "read-izin-cuti",
      "create-izin-cuti",
      "update-izin-cuti",
      // Laporan & Dashboard
      "read-laporan",
      "read-dashboard-outlet",
      "read-dashboard-gudang",
    ],
  },

  // GENERAL MANAJER — Level 80
  // Hampir penuh. Untuk GM atau Direktur Operasional.
  {
    id: "general-manajer",
    namaRole: "General Manajer",
    deskripsi:
      "Akses hampir penuh termasuk manajemen pengguna, role, kontrak kerja, dan seluruh operasional logistik. Cocok untuk General Manager atau Direktur Operasional.",
    level: 80,
    permissions: [
      "read-akun",
      "read-tenant",
      "update-tenant",
      // Produk & Kategori
      "read-kategori",
      "create-kategori",
      "update-kategori",
      "delete-kategori",
      "read-produk",
      "create-produk",
      "update-produk",
      "delete-produk",
      "read-bahan",
      "create-bahan",
      "update-bahan",
      "delete-bahan",
      // POS & Transaksi
      "akses-pos",
      "create-penjualan",
      "read-penjualan",
      "update-penjualan",
      "delete-penjualan",
      // Pelanggan
      "read-pelanggan",
      "create-pelanggan",
      "update-pelanggan",
      "delete-pelanggan",
      // Pembayaran
      "read-pembayaran",
      "create-pembayaran",
      "update-pembayaran",
      "delete-pembayaran",
      // Pengaturan Toko
      "read-akunkas",
      "create-akunkas",
      "update-akunkas",
      "delete-akunkas",
      "create-metode-pembayaran",
      "update-metode-pembayaran",
      "delete-metode-pembayaran",
      "create-diskon",
      "update-diskon",
      "delete-diskon",
      // Inventory & Stok
      "read-inventory",
      "read-inventory-outlet",
      "read-inventory-gudang",
      "create-inventory",
      "delete-inventory",
      "opname-inventory",
      "update-inventory-minimum",
      "read-location",
      "create-location",
      "update-location",
      "delete-location",
      "read-jurnal-stok",
      "create-jurnal-stok",
      "update-jurnal-stok",
      "delete-jurnal-stok",
      "read-pengajuan-stok",
      "create-pengajuan-stok",
      "update-pengajuan-stok",
      "approve-pengajuan-stok",
      "reject-pengajuan-stok",
      "read-transfer-stok",
      "create-transfer-stok",
      "approve-transfer-stok",
      "receive-transfer-stok",
      "cancel-transfer-stok",
      "read-pengiriman-stok",
      "create-pengiriman-stok",
      "update-pengiriman-stok",
      "approve-pengiriman-stok",
      "reject-pengiriman-stok",
      // Aset & Booking
      "create-tipe-aset",
      "update-tipe-aset",
      "delete-tipe-aset",
      "create-aset",
      "update-aset",
      "delete-aset",
      "create-tarif",
      "update-tarif",
      "delete-tarif",
      "read-booking",
      "create-booking",
      "update-booking",
      "delete-booking",
      // Pengguna & Role (full CRUD)
      "read-pengguna",
      "create-pengguna",
      "update-pengguna",
      "delete-pengguna",
      "read-role",
      "create-role",
      "update-role",
      "delete-role",
      "read-permission",
      // SDM (full)
      "read-kontrak-kompensasi",
      "create-kontrak-kompensasi",
      "update-kontrak-kompensasi",
      "delete-kontrak-kompensasi",
      "read-izin-cuti",
      "create-izin-cuti",
      "update-izin-cuti",
      // Laporan & Dashboard
      "read-laporan",
      "read-dashboard-outlet",
      "read-dashboard-gudang",
    ],
  },
];