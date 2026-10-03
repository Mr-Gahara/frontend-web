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
- 30 September 2026: penjualan setelah penyesuaian backend `465b438` (`b85c2bd`), tanpa perubahan gate. Aksi di daftar dan detail mengikuti izin endpoint-nya (`aksiPenjualan`): `update-penjualan` untuk finalisasi dan void, `delete-penjualan` untuk hapus, `create-pembayaran` untuk bayar, dan `update-pembayaran` untuk membatalkan pembayaran (`bolehBatalkanPembayaran`).
- 1 Oktober 2026: metode pembayaran setelah migrasi submodul 1 modul Pengaturan outlet (`3359497`). Halaman kelola bukan menu sidebar (dibuka dari halaman indeks pengaturan) dan tanpa entri `IZIN_HALAMAN`, karena `GET /metodepembayaran` tidak memeriksa izin. Tombol tambah mengikuti `create-metode-pembayaran`, dan menu ubah, aktifkan, serta nonaktifkan mengikuti `update-metode-pembayaran`. Form buat dan ubah juga memuat `GET /akunkas` untuk pilihan akun tujuan, sehingga tanpa `read-akunkas` form menampilkan pesan gagal memuat.
- 1 Oktober 2026: pajak setelah migrasi submodul 2 modul Pengaturan outlet (`e0aaeca`). Halaman bukan menu sidebar (dibuka dari halaman indeks pengaturan) dan tanpa entri `IZIN_HALAMAN`, karena route pajak dan produk pajak tidak memeriksa izin (`temuan.md` butir 5). Tab pajak per produk juga memuat `GET /produk` (`read-produk` atau `akses-pos`); tanpa izin itu tab menampilkan pesan gagal memuat produk, sedangkan daftar pajak tetap dapat dikelola.
- 2 Oktober 2026: profil toko setelah migrasi submodul 3 modul Pengaturan outlet (`fcf2dd2`). Halaman bukan menu sidebar (dibuka dari halaman indeks pengaturan) dan tanpa entri `IZIN_HALAMAN` (keputusan PO14a). Profil tenant dimuat lewat `GET /tenant/:id`, yang tidak memeriksa izin, dan diubah pemegang `update-tenant`; lokasi Outlet dimuat lewat `GET /location/current` bagi pemegang `read-location` dan diubah pemegang `update-location`. Sidebar dan halaman profil juga memuat `GET /tenant/:id` untuk nama toko (PO15a).
- 2 Oktober 2026: pelanggan setelah migrasi submodul pelanggan (`d9365d3`), tanpa perubahan gate maupun endpoint baca. Tombol tambah mengikuti `create-pelanggan`, menu ubah `update-pelanggan`, dan menu hapus `delete-pelanggan` (`aksiPelanggan`).
- 2 Oktober 2026: diskon setelah migrasi submodul diskon (`1e05df6`), tanpa perubahan gate maupun endpoint baca. Tombol tambah mengikuti `create-diskon`, dan menu ubah, aktifkan, serta nonaktifkan mengikuti `update-diskon` (`aksiDiskon`). Bagian produk tertentu di form juga memuat `GET /produk` (`read-produk` atau `akses-pos`); tanpa izin itu pilihan produk yang tersimpan tidak berubah.
- 2 Oktober 2026: profil pengguna (`/dashboard/profil`) setelah migrasi modul Profil, login, dan sidebar (`091be4e`). Halaman bukan menu sidebar (dibuka dari kaki sidebar). `GET` dan `PUT /pengguna/:id` meloloskan permintaan atas diri sendiri tanpa `read-pengguna` maupun `update-pengguna` (`checkPermissionOrSelf`), dibuktikan pengguna uji tanpa kedua izin itu, sehingga setiap pengguna dapat membuka dan mengubah profilnya.
- 3 Oktober 2026: panel admin (`/admin`, `/admin/akun/buat`, `/admin/akun/[id]`, dan `/admin/akun/[id]/ubah`) setelah modul panel admin (`c824f18`). Bukan menu sidebar dan tanpa entri `IZIN_HALAMAN`: gerbangnya role akun `admin` di token akun (`useAdminGuard`), dan seluruh endpoint-nya dijaga `authAkun` serta `adminOnly`, bukan permission pengguna.
- 3 Oktober 2026: mutasi arus kas setelah `e129f9d`, tanpa perubahan gate (`read-akunkas`). Halaman memanggil `GET /akunkas/mutasi`, `GET /akunkas/:id/ringkasan` saat satu akun dipilih, dan `GET /akunkas` untuk nama akun serta pilihan filter; ketiganya memeriksa `read-akunkas`, sejalan dengan gate.

Baris lain mencerminkan keadaan saat kontrak dibangkitkan.

| Menu | Gate saat ini | Endpoint GET di halaman | Permission dibutuhkan | Penilaian |
|---|---|---|---|---|
| `/dashboard/outlet` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/outlet/reservasi` | `read-booking` | `/aset`, `/sesibooking` | `read-booking` | Sejalan |
| `/dashboard/outlet/diskon` | - | `/diskon` | - | Backend tidak memeriksa izin |
| `/dashboard/outlet/keuangan` | `read-akunkas` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/penjualan` | `read-penjualan` | `/penjualan` (per halaman, `page` dan `limit`); `/location` dan `/location/current` hanya bagi pemegang `read-location` | `read-penjualan`; `read-location` opsional untuk cakupan outlet | Sejalan; gate sengaja tidak menambah `read-location` agar Guest, Staff, dan Kasir tetap dapat membuka daftar (keputusan K11b) |
| `/dashboard/outlet/pengeluaran` | `read-pembayaran` | - | - | Halaman placeholder tanpa data |
| `/dashboard/outlet/keuangan/ringkasanLabaRugi` | `read-laporan` | `/laporan/laba-rugi` (periode berjalan dan pembanding); kartu ringkasan di layout juga `/akunkas` | `read-laporan`; `/akunkas` butuh `read-akunkas` | Sejalan sejak backend `465b438` memeriksa `read-laporan`; tanpa `read-akunkas` kartu saldo menampilkan `-` (KU2a) |
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
| `/dashboard/outlet/pengaturan` | - | - | - | Halaman indeks tanpa data (`IZIN_HALAMAN` berisi syarat kosong). Sub-halaman metode pembayaran memanggil `/metodepembayaran` (tanpa izin baca) dan `/akunkas` (`read-akunkas`), tanpa entri `IZIN_HALAMAN` (`3359497`); sub-halaman pajak memanggil `/pajak` dan `/produkpajak` (tanpa izin) serta `/produk` (`read-produk` atau `akses-pos`), juga tanpa entri (`e0aaeca`); sub-halaman profil toko memanggil `/tenant/:id` (tanpa izin baca) dan `/location/current` (`read-location`), tanpa entri (`fcf2dd2`) |
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
