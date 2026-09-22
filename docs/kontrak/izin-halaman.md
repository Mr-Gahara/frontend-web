# Kontrak API: Izin per Halaman

Sifat perubahan: **Sering**: baris halaman yang dimigrasikan.

Gate setiap menu sidebar dibandingkan dengan permission endpoint yang dipanggil halamannya. Baris halaman diperbarui setiap kali halaman itu dimigrasikan.

## 5. Kebutuhan izin per halaman

Untuk setiap menu sidebar: gate yang dipakai saat ini, endpoint GET yang dipanggil `page.tsx` halamannya, dan permission yang diwajibkan backend untuk endpoint tersebut. Halaman yang memuat data lewat komponen terpisah ditandai untuk diperiksa manual.

Baris halaman yang sudah dimigrasikan diperbarui manual dari `IZIN_HALAMAN` (`lib/auth/permissions.ts`):

- 20 September 2026: pengguna, produk, kategori, bahan baku, stok, stock adjustment, jurnal stok, inventaris gudang, stock opname, dan pengajuan stok (daftar).
- 21 September 2026: bahan baku, stok, dan inventaris gudang, untuk izin alternatif (`temuan.md` butir 2).
- 22 September 2026: penerimaan barang dan pengiriman stok setelah migrasi submodul 6. Gate baris gudang untuk jurnal stok, stock opname, pengajuan stok, transfer stok, dan pengiriman stok dicocokkan ulang dengan `IZIN_HALAMAN` dan sudah sesuai.

Baris lain mencerminkan keadaan saat kontrak dibangkitkan.

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
| `/dashboard/outlet/inventaris/bahanBaku` | `read-location`, `read-inventory` atau `read-inventory-outlet` | `/location`, `/inventory` | `read-location`, salah satu dari `read-inventory`, `read-inventory-gudang`, `read-inventory-outlet` | Sejalan; gate sengaja tidak menerima `read-inventory-gudang` di ruang outlet (keputusan produk) |
| `/dashboard/outlet/inventaris-pantau` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/stok` | `read-location`, `read-inventory` atau `read-inventory-outlet` | `/location`, `/location/current`, `/inventory` | `read-location`, salah satu dari `read-inventory`, `read-inventory-gudang`, `read-inventory-outlet` | Sejalan; gate sengaja tidak menerima `read-inventory-gudang` di ruang outlet (keputusan produk) |
| `/dashboard/outlet/inventaris/stockOpname` | `read-stock-opname`, `read-location` | `/stockopname`, `/location`, `/location/current` | `read-stock-opname`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris/stockAdjustment` | `read-stock-adjustment` | `/stockopname/adjustments`, `/stockopname/adjustments/:id` | `read-stock-adjustment` | Sejalan |
| `/dashboard/outlet/inventaris/jurnalStok` | `read-jurnal-stok`, `read-location` | `/jurnalstok`, `/location`, `/location/current` | `read-jurnal-stok`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris-suplai` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/pengajuanStok` | `read-pengajuan-stok`, `read-location` | `/pengajuanstok`, `/location`, `/location/current` | `read-pengajuan-stok`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris/penerimaanBarang` | `read-location`, `read-transfer-stok` | `/location`, `/location/current`, `/transferstok` | `read-location`, `read-transfer-stok` | Sejalan |
| `/dashboard/outlet/jadwal` | - | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift` | `read-pengguna` | Tanpa gate, endpoint berizin |
| `/dashboard/outlet/pola-roster` | - | `/shift`, `/polaroster` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/shift` | - | `/shift` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/pelanggan` | `read-pelanggan` | `/pelanggan` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/pengguna` | `read-pengguna`, `read-role` | `/pengguna`, `/role` | `read-pengguna`, `read-role` | Sejalan |
| `/dashboard/outlet/pengaturan` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/gudang` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/gudang/inventaris` | `read-location`, `read-inventory` atau `read-inventory-gudang`, `read-bahan` | `/location`, `/inventory`, `/bahanbaku` | `read-location`, salah satu dari `read-inventory`, `read-inventory-gudang`, `read-inventory-outlet`, `read-bahan` | Sejalan; gate sengaja tidak menerima `read-inventory-outlet` di ruang gudang (keputusan produk) |
| `/dashboard/gudang/jurnalStok` | `read-jurnal-stok` | `/jurnalstok` | `read-jurnal-stok` | Sejalan |
| `/dashboard/gudang/stockOpname` | `read-stock-opname` | `/stockopname` | `read-stock-opname` | Sejalan |
| `/dashboard/gudang/pengajuanStok` | `read-pengajuan-stok` | `/pengajuanstok` | `read-pengajuan-stok` | Sejalan |
| `/dashboard/gudang/transferStok` | `read-transfer-stok` | `/transferstok` | `read-transfer-stok` | Sejalan |
| `/dashboard/gudang/pengirimanStok` | `read-transfer-stok` | `/transferstok` | `read-transfer-stok` | Sejalan |
| `/dashboard/gudang/jadwal` | - | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift` | `read-pengguna` | Tanpa gate, endpoint berizin |
| `/dashboard/gudang/pola-roster` | - | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/gudang/shift` | - | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/gudang/pengguna` | `read-pengguna`, `read-role` | `/pengguna`, `/role` | `read-pengguna`, `read-role` | Sejalan |
| `/dashboard/gudang/pengaturan` | - | - | - | Data dimuat lewat komponen, periksa manual |
