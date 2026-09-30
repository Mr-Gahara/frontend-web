# Kontrak API: Izin per Halaman

Sifat perubahan: **Sering**: baris halaman yang dimigrasikan.

Gate setiap menu sidebar dibandingkan dengan permission endpoint yang dipanggil halamannya. Baris halaman diperbarui setiap kali halaman itu dimigrasikan.

## 5. Kebutuhan izin per halaman

Untuk setiap menu sidebar: gate yang dipakai saat ini, endpoint GET yang dipanggil `page.tsx` halamannya, dan permission yang diwajibkan backend untuk endpoint tersebut. Halaman yang memuat data lewat komponen terpisah ditandai untuk diperiksa manual.

Baris halaman yang sudah dimigrasikan diperbarui manual dari `IZIN_HALAMAN` (`lib/auth/permissions.ts`):

- 20 September 2026: pengguna, produk, kategori, bahan baku, stok, stock adjustment, jurnal stok, inventaris gudang, stock opname, dan pengajuan stok (daftar).
- 21 September 2026: bahan baku, stok, dan inventaris gudang, untuk izin alternatif (`temuan.md` butir 2).
- 22 September 2026: penerimaan barang dan pengiriman stok setelah migrasi submodul 6. Gate baris gudang untuk jurnal stok, stock opname, pengajuan stok, transfer stok, dan pengiriman stok dicocokkan ulang dengan `IZIN_HALAMAN` dan sudah sesuai.
- 22 September 2026: stock adjustment, setelah daftarnya memakai cakupan outlet (`a5e9cec`, gate `fe5dd9c`).
- 23 September 2026: stock adjustment gudang, halaman baru (`247cf2d`).
- 26 September 2026: penjualan setelah migrasi modul penjualan dan pembayaran (`f33ffa6`), dan pengeluaran yang ternyata halaman placeholder.
- 27 September 2026: reservasi setelah migrasi daftar reservasi (`eef371a`), tanpa perubahan gate maupun endpoint.
- 28 September 2026: ringkasan laba rugi setelah migrasi modul keuangan (`45187b6`), tanpa perubahan gate. Halaman akun kas dan mutasi arus kas bukan menu sidebar (dibuka lewat tab keuangan) dan bergate `read-akunkas` di `IZIN_HALAMAN`.
- 29 September 2026: jadwal outlet dan jadwal gudang, yang ternyata sudah bergate `read-pengguna` di `IZIN_HALAMAN` sejak Fase 2, serta shift outlet dan shift gudang setelah migrasi submodul shift (`f99b7cf`).
- 29 September 2026: pola roster outlet dan pola roster gudang setelah migrasi submodul pola roster (`dcc22e0`).
- 29 September 2026: jadwal dan generate jadwal outlet dan gudang setelah migrasi submodul kalender dan generate (`19227f8`); generate outlet mendapat entri `IZIN_HALAMAN`, dan generate gudang dibuat.
- 29 September 2026: ruang gudang setelah migrasi layout dan setup gudang (`9ce288b`). Layout bergerbang `read-dashboard-gudang` dan memuat `/location` bagi pemegang `read-location`; setup membuat lokasi lewat `POST /location` (`create-location`), bukan menu sidebar, dan tidak punya entri `IZIN_HALAMAN`.
- 30 September 2026: pengaturan gudang setelah migrasi profil gudang (`319bd99`), dengan gate `read-location` di `IZIN_HALAMAN`.

Baris lain mencerminkan keadaan saat kontrak dibangkitkan.

| Menu | Gate saat ini | Endpoint GET di halaman | Permission dibutuhkan | Penilaian |
|---|---|---|---|---|
| `/dashboard/outlet` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/outlet/reservasi` | `read-booking` | `/aset`, `/sesibooking` | `read-booking` | Sejalan |
| `/dashboard/outlet/diskon` | - | `/diskon` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/keuangan` | `read-akunkas` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/penjualan` | `read-penjualan` | `/penjualan`; `/location` dan `/location/current` hanya bagi pemegang `read-location` | `read-penjualan`; `read-location` opsional untuk cakupan outlet | Sejalan; gate sengaja tidak menambah `read-location` agar Guest, Staff, dan Kasir tetap dapat membuka daftar (keputusan K11b) |
| `/dashboard/outlet/pengeluaran` | `read-pembayaran` | - | - | Halaman placeholder tanpa data |
| `/dashboard/outlet/keuangan/ringkasanLabaRugi` | `read-laporan` | `/laporan/laba-rugi` (periode berjalan dan pembanding); kartu ringkasan di layout juga `/akunkas` | -; `/akunkas` butuh `read-akunkas` | Backend tidak memeriksa izin laporan; tanpa `read-akunkas` kartu saldo menampilkan `-` (KU2a) |
| `/dashboard/outlet/inventaris-data` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/produk` | `read-produk` | `/produk` | `read-produk` atau `akses-pos` | Sejalan |
| `/dashboard/outlet/inventaris/kategori` | `read-kategori` | `/kategori`, `/produk` | `read-kategori`; `/produk` opsional (`read-produk` atau `akses-pos`) untuk hitungan pemakaian | Sejalan |
| `/dashboard/outlet/inventaris/bahanBaku` | `read-location`, `read-inventory` atau `read-inventory-outlet` | `/location`, `/inventory` | `read-location`, salah satu dari `read-inventory`, `read-inventory-gudang`, `read-inventory-outlet` | Sejalan; gate sengaja tidak menerima `read-inventory-gudang` di ruang outlet (keputusan produk) |
| `/dashboard/outlet/inventaris-pantau` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/stok` | `read-location`, `read-inventory` atau `read-inventory-outlet` | `/location`, `/location/current`, `/inventory` | `read-location`, salah satu dari `read-inventory`, `read-inventory-gudang`, `read-inventory-outlet` | Sejalan; gate sengaja tidak menerima `read-inventory-gudang` di ruang outlet (keputusan produk) |
| `/dashboard/outlet/inventaris/stockOpname` | `read-stock-opname`, `read-location` | `/stockopname`, `/location`, `/location/current` | `read-stock-opname`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris/stockAdjustment` | `read-stock-adjustment`, `read-location` | `/stockopname/adjustments`, `/location`, `/location/current` | `read-stock-adjustment`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris/jurnalStok` | `read-jurnal-stok`, `read-location` | `/jurnalstok`, `/location`, `/location/current` | `read-jurnal-stok`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris-suplai` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/pengajuanStok` | `read-pengajuan-stok`, `read-location` | `/pengajuanstok`, `/location`, `/location/current` | `read-pengajuan-stok`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris/penerimaanBarang` | `read-location`, `read-transfer-stok` | `/location`, `/location/current`, `/transferstok` | `read-location`, `read-transfer-stok` | Sejalan |
| `/dashboard/outlet/jadwal` | `read-pengguna` | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift` | `read-pengguna` | Sejalan; baris ini sempat tertinggal dari `IZIN_HALAMAN` (dikoreksi 29 September 2026) |
| `/dashboard/outlet/jadwal/generate` | `read-pengguna` | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift/bulk` | `read-pengguna` | Sejalan; entri `IZIN_HALAMAN` ditambahkan di `19227f8` |
| `/dashboard/outlet/pola-roster` | - | `/shift`, `/polaroster` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/shift` | - | `/shift` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/pelanggan` | `read-pelanggan` | `/pelanggan` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/pengguna` | `read-pengguna`, `read-role` | `/pengguna`, `/role` | `read-pengguna`, `read-role` | Sejalan |
| `/dashboard/outlet/pengaturan` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/gudang` | - | - | - | Halaman placeholder tanpa data (keputusan GD1a); layout ruang gudang bergerbang `read-dashboard-gudang` dan memuat `/location` bagi pemegang `read-location` (`9ce288b`) |
| `/dashboard/gudang/inventaris` | `read-location`, `read-inventory` atau `read-inventory-gudang`, `read-bahan` | `/location`, `/inventory`, `/bahanbaku` | `read-location`, salah satu dari `read-inventory`, `read-inventory-gudang`, `read-inventory-outlet`, `read-bahan` | Sejalan; gate sengaja tidak menerima `read-inventory-outlet` di ruang gudang (keputusan produk) |
| `/dashboard/gudang/jurnalStok` | `read-jurnal-stok` | `/jurnalstok` | `read-jurnal-stok` | Sejalan |
| `/dashboard/gudang/stockOpname` | `read-stock-opname` | `/stockopname` | `read-stock-opname` | Sejalan |
| `/dashboard/gudang/stockAdjustment` | `read-stock-adjustment` | `/stockopname/adjustments` | `read-stock-adjustment` | Sejalan |
| `/dashboard/gudang/pengajuanStok` | `read-pengajuan-stok` | `/pengajuanstok` | `read-pengajuan-stok` | Sejalan |
| `/dashboard/gudang/transferStok` | `read-transfer-stok` | `/transferstok` | `read-transfer-stok` | Sejalan |
| `/dashboard/gudang/pengirimanStok` | `read-transfer-stok` | `/transferstok` | `read-transfer-stok` | Sejalan |
| `/dashboard/gudang/jadwal` | `read-pengguna` | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift` | `read-pengguna` | Sejalan; baris ini sempat tertinggal dari `IZIN_HALAMAN` (dikoreksi 29 September 2026) |
| `/dashboard/gudang/jadwal/generate` | `read-pengguna` | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift/bulk` | `read-pengguna` | Sejalan; halaman dibuat di `19227f8` (keputusan J5b dan JD13c) |
| `/dashboard/gudang/pola-roster` | - | `/shift`, `/polaroster` | - | Backend tidak memeriksa izin; halaman dibuat di `dcc22e0` (keputusan PL5) |
| `/dashboard/gudang/shift` | - | `/shift` | - | Backend tidak memeriksa izin; halaman dibuat di `f99b7cf` (keputusan SH1b) |
| `/dashboard/gudang/pengguna` | `read-pengguna`, `read-role` | `/pengguna`, `/role` | `read-pengguna`, `read-role` | Sejalan |
| `/dashboard/gudang/pengaturan` | `read-location` | `/location` | `read-location`; `PUT /location/:id` butuh `update-location` | Sejalan; tanpa `update-location` profil gudang tampil baca-saja (`319bd99`, keputusan GD2a) |
