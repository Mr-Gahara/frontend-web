# Kontrak API: Izin per Halaman

Sifat perubahan: **Sering**: baris halaman yang dimigrasikan.

Gate setiap menu sidebar dibandingkan dengan permission endpoint yang dipanggil halamannya. Baris halaman diperbarui setiap kali halaman itu dimigrasikan.

## 5. Kebutuhan izin per halaman

Untuk setiap menu sidebar: gate yang dipakai saat ini, endpoint GET yang dipanggil `page.tsx` halamannya, dan permission yang diwajibkan backend untuk endpoint tersebut. Halaman yang memuat data lewat komponen terpisah ditandai untuk diperiksa manual. Baris pengguna, produk, kategori, bahan baku, stok, stock adjustment, jurnal stok, inventaris gudang, stock opname, dan pengajuan stok (daftar) diperbarui manual dari `IZIN_HALAMAN` setelah migrasi (20 September 2026); baris lain mencerminkan keadaan saat kontrak dibangkitkan.

| Menu | Gate saat ini | Endpoint GET di halaman | Permission dibutuhkan | Penilaian |
|---|---|---|---|---|
| `/dashboard/outlet` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/outlet/reservasi` | `read-booking` | `/aset`, `/sesibooking` | `read-booking` | Sejalan |
| `/dashboard/outlet/diskon` | - | `/diskon` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/keuangan` | `read-akunkas` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/penjualan` | `read-penjualan` | `/penjualan` | `read-penjualan` | Sejalan |
| `/dashboard/outlet/pengeluaran` | `read-pembayaran` | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/outlet/keuangan/ringkasanLabaRugi` | `read-laporan` | `/laporan/laba-rugi` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/inventaris-data` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/produk` | `read-produk` | `/produk` | `read-produk` atau `akses-pos` | Sejalan |
| `/dashboard/outlet/inventaris/kategori` | `read-kategori` | `/kategori`, `/produk` | `read-kategori`; `/produk` opsional (`read-produk` atau `akses-pos`) untuk hitungan pemakaian | Sejalan |
| `/dashboard/outlet/inventaris/bahanBaku` | `read-location`, `read-inventory` | `/location`, `/inventory` | `read-location`, `read-inventory` | Sejalan |
| `/dashboard/outlet/inventaris-pantau` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/stok` | `read-location`, `read-inventory` | `/location`, `/location/current`, `/inventory` | `read-location`, `read-inventory` | Sejalan |
| `/dashboard/outlet/inventaris/stockOpname` | `read-stock-opname`, `read-location` | `/stockopname`, `/location`, `/location/current` | `read-stock-opname`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris/stockAdjustment` | `read-stock-adjustment` | `/stockopname/adjustments`, `/stockopname/adjustments/:id` | `read-stock-adjustment` | Sejalan |
| `/dashboard/outlet/inventaris/jurnalStok` | `read-jurnal-stok`, `read-location` | `/jurnalstok`, `/location`, `/location/current` | `read-jurnal-stok`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris-suplai` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/pengajuanStok` | `read-pengajuan-stok`, `read-location` | `/pengajuanstok`, `/location`, `/location/current` | `read-pengajuan-stok`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris/penerimaanBarang` | - | `/location`, `/transferstok` | `read-location`, `read-transfer-stok` | Tanpa gate, endpoint berizin |
| `/dashboard/outlet/jadwal` | - | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift` | `read-pengguna` | Tanpa gate, endpoint berizin |
| `/dashboard/outlet/pola-roster` | - | `/shift`, `/polaroster` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/shift` | - | `/shift` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/pelanggan` | `read-pelanggan` | `/pelanggan` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/pengguna` | `read-pengguna`, `read-role` | `/pengguna`, `/role` | `read-pengguna`, `read-role` | Sejalan |
| `/dashboard/outlet/pengaturan` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/gudang` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/gudang/inventaris` | `read-location`, `read-inventory`, `read-bahan` | `/location`, `/inventory`, `/bahanbaku` | `read-location`, `read-inventory`, `read-bahan` | Sejalan |
| `/dashboard/gudang/jurnalStok` | `read-jurnal-stok` | `/jurnalstok` | `read-jurnal-stok` | Sejalan |
| `/dashboard/gudang/stockOpname` | `read-stock-opname` | `/stockopname` | `read-stock-opname` | Sejalan |
| `/dashboard/gudang/pengajuanStok` | `read-pengajuan-stok` | `/pengajuanstok` | `read-pengajuan-stok` | Sejalan |
| `/dashboard/gudang/transferStok` | `read-transfer-stok` | `/transferstok` | `read-transfer-stok` | Sejalan |
| `/dashboard/gudang/pengirimanStok` | `read-pengiriman-stok` | `/transferstok` | `read-transfer-stok` | Tidak sejalan |
| `/dashboard/gudang/jadwal` | - | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift` | `read-pengguna` | Tanpa gate, endpoint berizin |
| `/dashboard/gudang/pola-roster` | - | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/gudang/shift` | - | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/gudang/pengguna` | `read-pengguna`, `read-role` | `/pengguna`, `/role` | `read-pengguna`, `read-role` | Sejalan |
| `/dashboard/gudang/pengaturan` | - | - | - | Data dimuat lewat komponen, periksa manual |
