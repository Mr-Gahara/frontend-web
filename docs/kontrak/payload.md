# Kontrak API: Payload Operasi Tulis

Sifat perubahan: **Jarang**: koreksi saat migrasi membuktikan perbedaan.

Aturan payload setiap operasi POST, PUT, dan PATCH yang dipanggil frontend. Field yang dibaca service tetapi tidak diperiksa validator dicatat per operasi.

## 4. Payload operasi tulis

Setiap operasi POST, PUT, dan PATCH yang dipanggil frontend. "Aturan" menunjukkan fungsi validator terakhir di rantai validasi, atau skema model bila tidak ada validator. Field yang diisi server sudah dikecualikan dari "Wajib dari klien". DELETE tidak membawa body dan tidak dicantumkan.

#### `PATCH /inventory/:id/minimum-stok`

- Aturan: tanpa validator, dibatasi skema `models/inventoryModel.js`
- Dibaca service dari body: `stokMinimum` (ditolak bila negatif)
- Wajib dari klien: -
- Field lain yang dikenali: `bahanBakuID`, `barangInventoryID`, `locationID`, `stok`, `stokMinimum`
- Diisi server: -

#### `PATCH /pengajuanstok/:id/approve`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorPengajuan`, `jenisPengajuan`, `dariLocationID`, `keLocationID`, `disetujuiOleh`, `ditolakOleh`, `transferStokID`, `items`, `status`, `catatan`, `catatanPenolakan`, `tanggalKebutuhan`, `tanggalApprove`, `tanggalReject`
- Diisi server: `dimintaOleh`

#### `PATCH /pengajuanstok/:id/reject`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorPengajuan`, `jenisPengajuan`, `dariLocationID`, `keLocationID`, `disetujuiOleh`, `ditolakOleh`, `transferStokID`, `items`, `status`, `catatan`, `catatanPenolakan`, `tanggalKebutuhan`, `tanggalApprove`, `tanggalReject`
- Dibaca controller dari body: `alasan`
- Diisi server: `dimintaOleh`

#### `PATCH /pengajuanstok/:id/submit`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorPengajuan`, `jenisPengajuan`, `dariLocationID`, `keLocationID`, `disetujuiOleh`, `ditolakOleh`, `transferStokID`, `items`, `status`, `catatan`, `catatanPenolakan`, `tanggalKebutuhan`, `tanggalApprove`, `tanggalReject`
- Diisi server: `dimintaOleh`

#### `PATCH /stockopname/:id/approve`

- Aturan: tanpa validator, dibatasi skema `models/stockOpnameModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorOpname`, `locationID`, `tanggal`, `reviewerID`, `status`, `items`, `catatan`, `catatanReview`, `stockAdjustmentID`
- Dibaca controller dari body: `alasan`
- Diisi server: `picID`

#### `PATCH /stockopname/:id/cancel`

- Aturan: tanpa validator, dibatasi skema `models/stockOpnameModel.js`
- Diizinkan dari DRAFT, SUBMITTED, atau REJECTED; APPROVED dan CANCELLED ditolak (`stockOpnameService.cancel`)
- Wajib dari klien: -
- Field lain yang dikenali: `nomorOpname`, `locationID`, `tanggal`, `reviewerID`, `status`, `items`, `catatan`, `catatanReview`, `stockAdjustmentID`
- Diisi server: `picID`

#### `PATCH /stockopname/:id/items`

- Aturan: tanpa validator, dibatasi skema `models/stockOpnameModel.js`
- Hanya untuk status DRAFT atau REJECTED. Setiap item yang dikirim wajib punya `qtyPhysical` angka tidak negatif; `null` ditolak 400 dengan pesan "qtyPhysical tidak boleh kurang dari 0." (`temuan.md` butir 19). Item yang tidak dikirim tidak berubah
- Wajib dari klien: -
- Field lain yang dikenali: `nomorOpname`, `locationID`, `tanggal`, `reviewerID`, `status`, `items`, `catatan`, `catatanReview`, `stockAdjustmentID`
- Dibaca controller dari body: `items`
- Diisi server: `picID`

#### `PATCH /stockopname/:id/reject`

- Aturan: tanpa validator, dibatasi skema `models/stockOpnameModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorOpname`, `locationID`, `tanggal`, `reviewerID`, `status`, `items`, `catatan`, `catatanReview`, `stockAdjustmentID`
- Dibaca controller dari body: `catatanReview`
- Diisi server: `picID`

#### `PATCH /stockopname/:id/submit`

- Aturan: tanpa validator, dibatasi skema `models/stockOpnameModel.js`
- Hanya dari DRAFT atau REJECTED, dan ditolak bila masih ada item tanpa `qtyPhysical`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorOpname`, `locationID`, `tanggal`, `reviewerID`, `status`, `items`, `catatan`, `catatanReview`, `stockAdjustmentID`
- Diisi server: `picID`

#### `PATCH /transferstok/:id/batal`

- Aturan: tanpa validator, dibatasi skema `models/transferStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Diisi server: `pengirimID`

#### `PATCH /transferstok/:id/kirim`

- Aturan: tanpa validator, dibatasi skema `models/transferStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Dibaca controller dari body: `-`
- Diisi server: `pengirimID`

#### `PATCH /transferstok/:id/terima`

- Aturan: tanpa validator, dibatasi skema `models/transferStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Dibaca controller dari body: `-`
- Diisi server: `pengirimID`

#### `POST /akun/auth/login`

- Aturan: validateLogin (validators/akunValidator.js)
- Wajib dari klien: `password`
- Field lain yang dikenali: `email`
- Dibaca controller dari body: `-`
- Diisi server: -

#### `POST /akun/auth/logout`

- Aturan: tanpa validator, dibatasi skema `models/akunModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `username`, `email`, `password`, `role`, `status`, `tokenVersion`, `aksesBerakhirPada`, `alasanNonAktif`, `dibekukanPada`, `masaTenggangHari`
- Diisi server: -

#### `POST /akunkas`

- Aturan: validateAkunKasPayload (validators/akunKasValidator.js)
- Wajib dari klien: `namaAkun`, `nomorAkun`
- Field lain yang dikenali: `tipeAkun`, `status`, `saldo`
- Nilai sah: `VALID_STATUS`: aktif, non-aktif
- Dibaca controller dari body: `-`
- Diisi server: -

#### `POST /aset`

- Aturan: validateAsetPayload (validators/asetValidator.js)
- Wajib dari klien: `namaAset`, `tipeAsetID`
- Field lain yang dikenali: `status`
- Nilai sah: `VALID_STATUS`: tersedia, digunakan, perbaikan
- Dibaca controller dari body: `-`
- Diisi server: -

#### `POST /bahan-baku`

- Tidak ada di backend.

#### `POST /bahanbaku`

- Aturan: validateBahanBakuPayload (validators/bahanBakuValidator.js)
- Wajib dari klien: `namaBahan`
- Field lain yang dikenali: `satuan`, `stok`
- Tidak diperiksa validator tetapi dipakai service: `locationID` (lokasi tujuan injeksi stok awal; tanpa ini backend memakai lokasi default tenant), `stokMinimum` (batas minimum entri inventory yang dibuat)
- Nilai sah: `VALID_UNITS`: kg, gram, liter, ml, pcs, pak, unit
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /diskon`

- Aturan: validateDiskonPayload (validators/diskonValidator.js)
- Wajib dari klien: `namaDiskon`
- Field lain yang dikenali: `cakupan`, `tipe`, `nilai`, `bisaDigabung`, `status`
- Nilai sah: `VALID_TIPE`: persen, nominal; `VALID_STATUS`: Aktif, Non-Aktif; `VALID_CAKUPAN`: Global, Item
- Dibaca controller dari body: `-`
- Diisi server: -

#### `POST /inventory`

- Aturan: tanpa validator, dibatasi skema `models/inventoryModel.js`
- Item yang sudah terdaftar di lokasi yang sama ditolak: satu catatan stok per item per lokasi (`inventoryService` sekitar baris 24)
- Wajib dari klien: -
- Field lain yang dikenali: `bahanBakuID`, `barangInventoryID`, `locationID`, `stok`, `stokMinimum`
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /inventory/:id/opname`

- Aturan: tanpa validator, dibatasi skema `models/inventoryModel.js`
- Dibaca service dari body: `fisikAktual` (stok menjadi nilai ini) dan `catatan` (keterangan pencatatan, bawaan "Koreksi stok fisik")
- Wajib dari klien: -
- Field lain yang dikenali: `bahanBakuID`, `barangInventoryID`, `locationID`, `stok`, `stokMinimum`
- Diisi server: -

#### `POST /jadwalshift`

- Aturan: tanpa validator, dibatasi skema `models/jadwalShiftModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `penggunaID`, `shiftID`, `tanggalKerja`, `isLibur`, `catatan`
- Diisi server: -

#### `POST /jadwalshift/bulk`

- Aturan: tanpa validator, dibatasi skema `models/jadwalShiftModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `penggunaID`, `shiftID`, `tanggalKerja`, `isLibur`, `catatan`
- Diisi server: -

#### `POST /kategori`

- Aturan: tanpa validator, dibatasi skema `models/kategoriModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `namaKategori`, `kodeKategori`, `keterangan`
- Duplikat nama atau kode: 400 `{ errors: ["tenantID sudah digunakan di tenant ini"] }` tanpa `message`; field yang bentrok tidak disebut (`temuan.md` butir 14)
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /location`

- Aturan: validateLocationPayload (validators/locationValidator.js)
- Wajib dari klien: `alamat`
- Field lain yang dikenali: `nama`, `tipe`, `latitude`, `longitude`, `radiusAbsen`
- Nilai sah: `VALID_TIPE`: Gudang, Outlet
- Allowlist field: `nama`, `alamat`, `latitude`, `longitude`, `radiusAbsen`
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /metodepembayaran`

- Aturan: validateMetodePembayaranPayload (validators/metodePembayaranValidator.js)
- Wajib dari klien: -
- Field lain yang dikenali: -
- Dibaca controller dari body: `-`
- Diisi server: -

#### `POST /pajak`

- Aturan: validatePajakPayload (validators/pajakValidator.js)
- Wajib dari klien: `namaPajak`, `tarifPajak`, `modelPerhitungan`, `prioritas`, `tipePajak`
- Field lain yang dikenali: -
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /pelanggan`

- Aturan: validatePelangganPayload (validators/pelangganValidator.js)
- Wajib dari klien: `namaPelanggan`, `tipePelanggan`
- Field lain yang dikenali: `nomorHp`, `email`, `alamat`
- Nilai sah: `VALID_TYPES`: umum, member, korporat
- Dibaca controller dari body: `-`
- Diisi server: -

#### `POST /pembayaran`

- Aturan: validatePembayaranPayload (validators/pembayaranValidator.js)
- Wajib dari klien: `penjualanID`, `metodePembayaranID`, `akunKasID`, `jumlahBayar`
- Field lain yang dikenali: `status`, `tanggalBayar`
- Nilai sah: `VALID_STATUS`: PAID, PENDING, EXPIRED, FAILED, VOID
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /pengajuanstok`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorPengajuan`, `jenisPengajuan`, `dariLocationID`, `keLocationID`, `disetujuiOleh`, `ditolakOleh`, `transferStokID`, `items`, `status`, `catatan`, `catatanPenolakan`, `tanggalKebutuhan`, `tanggalApprove`, `tanggalReject`
- Dibaca controller dari body: `-`
- Diisi server: `dimintaOleh`, `tenantID`

#### `POST /pengguna/pin-login`

- Aturan: validatePenggunaLogin (validators/penggunaValidator.js)
- Wajib dari klien: `loginType`, `installationId`
- Field lain yang dikenali: `nama`, `pin`
- Nilai sah: `validLoginTypes`: web, app
- Dibaca controller dari body: `nama`, `pin`, `loginType`, `installationId`, `deviceName`, `appVersion`, `osVersion`
- Diisi server: -

#### `POST /pengguna/pin-logout`

- Aturan: tanpa validator, dibatasi skema `models/penggunaModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nama`, `pin`, `roleID`, `status`, `nomorHp`, `fotoKaryawan`, `aksesType`, `tokenVersion`, `appTokenVersion`
- Dibaca controller dari body: `installationId`
- Diisi server: -

#### `POST /pengguna/register-pengguna`

- Aturan: validatePenggunaPayload (validators/penggunaValidator.js)
- Wajib dari klien: `nama`, `pin`, `roleID`, `aksesType`
- Field lain yang dikenali: `pinBaru`, `nomorHp`, `status`
- Nilai sah: `validTypes`: web, app
- Dibaca controller dari body: `nama`, `pin`, `roleID`, `aksesType`, `nomorHp`, `status`
- Diisi server: -

#### `POST /penjualan`

- Aturan: validateIdOrArray (validators/penjualanValidator.js)
- Wajib dari klien: `penggunaID`, `pelangganID`, `jenisTransaksi`, `tanggalTransaksi`, `jenisPenjualan`, `itemPenjualan`
- Field lain yang dikenali: `simpanDraft`, `finalize`, `statusPenjualan`, `locationID`, `jatuhTempo`, `pajakTransaksiIDs`, `diskonGlobalIDs`, `jumlahDiskonTransaksi`
- Nilai sah: `VALID_STATUS_PENJUALAN`: DRAFT, FINAL, VOID; `VALID_JENIS_TRANSAKSI`: POS, INVOICE; `VALID_JENIS_PENJUALAN`: dine-in, takeaway, booking
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /polaroster`

- Aturan: validatePolaRosterPayload (validators/polaRosterValidator.js)
- Wajib dari klien: `namaPola`, `siklusHari`, `detailSiklus`
- Field lain yang dikenali: -
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /produk`

- Aturan: validateProdukPayload (validators/produkValidator.js)
- Wajib dari klien: `namaProduk`, `hargaJual`, `hargaDasar`, `kategoriID`
- Field lain yang dikenali: `resep`, `isUnlimitedStok`
- Tidak diperiksa validator tetapi dipakai service: `stok`, `gambarProduk`, `keterangan` (payload diteruskan utuh ke `Produk.create`)
- Nilai sah satuan resep: gram, ml, pcs, kg, liter (lebih sempit dari satuan bahan baku)
- `kategoriID` hanya diperiksa formatnya, bukan keberadaannya (`temuan.md` butir 13)
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /produkpajak`

- Aturan: validateProdukPajakPayload (validators/produkPajakValidator.js)
- Wajib dari klien: `pajakID`
- Field lain yang dikenali: `produkID`, `assetID`
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /role`

- Aturan: validateRolePayload (validators/roleValidator.js)
- Wajib dari klien: `namaRole`, `permissions`
- Field lain yang dikenali: `deskripsi`
- Allowlist field: `tenantID`, `namaRole`, `deskripsi`, `permissions`, `level`
- Dibaca controller dari body: `-`
- Diisi server: -

#### `POST /sesibooking`

- Aturan: validateWaktuRange (validators/sesiBookingValidator.js)
- Wajib dari klien: `dataPelanggan`, `dataAset`, `waktuMulai`, `waktuSelesai`, `items`
- Field lain yang dikenali: `dataTarif`, `diskonItem`, `diskonGlobal`, `status`, `simpanDraft`, `noReferensi`, `dataPenjualan`
- Nilai sah: `VALID_STATUS`: Aktif, Selesai, Batal
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`, `dataPengguna`

#### `POST /shift`

- Aturan: validateShiftPayload (validators/shiftValidator.js)
- Wajib dari klien: `namaShift`, `jamMasuk`, `jamPulang`
- Field lain yang dikenali: `isLintasHari`, `toleransiTerlambat`, `status`
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /stockopname`

- Aturan: tanpa validator, dibatasi skema `models/stockOpnameModel.js`
- Dibaca service: `locationID` dan `catatan`; item diambil otomatis dari seluruh inventory di lokasi itu
- Opname aktif (DRAFT atau SUBMITTED) di lokasi yang sama ditolak 409 dengan pesan yang menyebut nomor dan statusnya
- Wajib dari klien: -
- Field lain yang dikenali: `nomorOpname`, `locationID`, `tanggal`, `reviewerID`, `status`, `items`, `catatan`, `catatanReview`, `stockAdjustmentID`
- Dibaca controller dari body: `-`
- Diisi server: `picID`, `tenantID`

#### `POST /tarif`

- Aturan: validateTarifPayload (validators/tarifValidator.js)
- Wajib dari klien: `namaTarif`, `basisPerhitungan`, `harga`, `durasiMinimum`
- Field lain yang dikenali: `hariAktif`, `jamMulai`, `jamSelesai`, `tipeAsetID`
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /tipeaset`

- Aturan: validateTipeAsetPayload (validators/tipeAsetValidator.js)
- Wajib dari klien: `namaTipeAset`
- Field lain yang dikenali: -
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /transferstok`

- Aturan: tanpa validator, dibatasi skema `models/transferStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Dibaca controller dari body: `-`
- Diisi server: `pengirimID`, `tenantID`

#### `PUT /aset/:id`

- Aturan: validateAsetPayload (validators/asetValidator.js)
- Wajib dari klien: `namaAset`, `tipeAsetID`
- Field lain yang dikenali: `status`
- Nilai sah: `VALID_STATUS`: tersedia, digunakan, perbaikan
- Diisi server: -

#### `PUT /bahan-baku/:param`

- Tidak ada di backend.

#### `PUT /bahanbaku/:id`

- Aturan: validateBahanBakuPayload (validators/bahanBakuValidator.js)
- Wajib dari klien: `namaBahan`
- Field lain yang dikenali: `satuan`, `stok`
- Tidak diperiksa validator tetapi dipakai service: `locationID` (lokasi tujuan injeksi stok awal; tanpa ini backend memakai lokasi default tenant)
- Nilai sah: `VALID_UNITS`: kg, gram, liter, ml, pcs, pak, unit
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `PUT /diskon/:id`

- Aturan: validateDiskonPayload (validators/diskonValidator.js)
- Wajib dari klien: `namaDiskon`
- Field lain yang dikenali: `cakupan`, `tipe`, `nilai`, `bisaDigabung`, `status`
- Nilai sah: `VALID_TIPE`: persen, nominal; `VALID_STATUS`: Aktif, Non-Aktif; `VALID_CAKUPAN`: Global, Item
- Diisi server: -

#### `PUT /jadwalshift/:id`

- Aturan: tanpa validator, dibatasi skema `models/jadwalShiftModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `penggunaID`, `shiftID`, `tanggalKerja`, `isLibur`, `catatan`
- Diisi server: -

#### `PUT /kategori/:id`

- Aturan: tanpa validator, dibatasi skema `models/kategoriModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `namaKategori`, `kodeKategori`, `keterangan`
- Duplikat nama atau kode: 400 `{ errors: ["tenantID sudah digunakan di tenant ini"] }` tanpa `message`, sama seperti `POST /kategori` (`temuan.md` butir 14)
- Diisi server: -

#### `PUT /metodepembayaran/:id`

- Aturan: validateMetodePembayaranPayload (validators/metodePembayaranValidator.js)
- Wajib dari klien: -
- Field lain yang dikenali: -
- Diisi server: -

#### `PUT /pajak/:id`

- Aturan: validatePajakPayload (validators/pajakValidator.js)
- Wajib dari klien: `namaPajak`, `tarifPajak`, `modelPerhitungan`, `prioritas`, `tipePajak`
- Field lain yang dikenali: -
- Diisi server: -

#### `PUT /pelanggan/:id`

- Aturan: validatePelangganPayload (validators/pelangganValidator.js)
- Wajib dari klien: `namaPelanggan`, `tipePelanggan`
- Field lain yang dikenali: `nomorHp`, `email`, `alamat`
- Nilai sah: `VALID_TYPES`: umum, member, korporat
- Diisi server: -

#### `PUT /pengajuanstok/:id`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorPengajuan`, `jenisPengajuan`, `dariLocationID`, `keLocationID`, `disetujuiOleh`, `ditolakOleh`, `transferStokID`, `items`, `status`, `catatan`, `catatanPenolakan`, `tanggalKebutuhan`, `tanggalApprove`, `tanggalReject`
- Diisi server: `dimintaOleh`

#### `PUT /pengguna/:id`

- Aturan: validatePenggunaPayload (validators/penggunaValidator.js)
- Wajib dari klien: `nama`, `pin`, `roleID`, `aksesType`
- Field lain yang dikenali: `pinBaru`, `nomorHp`, `status`
- Nilai sah: `validTypes`: web, app
- Dibaca controller dari body: `-`
- Diisi server: -

#### `PUT /penjualan/:id`

- Aturan: validateIdOrArray (validators/penjualanValidator.js)
- Wajib dari klien: `penggunaID`, `pelangganID`, `jenisTransaksi`, `tanggalTransaksi`, `jenisPenjualan`, `itemPenjualan`
- Field lain yang dikenali: `simpanDraft`, `finalize`, `statusPenjualan`, `locationID`, `jatuhTempo`, `pajakTransaksiIDs`, `diskonGlobalIDs`, `jumlahDiskonTransaksi`
- Nilai sah: `VALID_STATUS_PENJUALAN`: DRAFT, FINAL, VOID; `VALID_JENIS_TRANSAKSI`: POS, INVOICE; `VALID_JENIS_PENJUALAN`: dine-in, takeaway, booking
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `PUT /polaroster/:id`

- Aturan: validatePolaRosterPayload (validators/polaRosterValidator.js)
- Wajib dari klien: `namaPola`, `siklusHari`, `detailSiklus`
- Field lain yang dikenali: -
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `PUT /produk/:id`

- Aturan: validateProdukPayload (validators/produkValidator.js)
- Wajib dari klien: `namaProduk`, `hargaJual`, `hargaDasar`, `kategoriID`
- Field lain yang dikenali: `resep`, `isUnlimitedStok`
- Tidak diperiksa validator tetapi dipakai service: `stok`, `gambarProduk`, `keterangan`
- `resep` yang dikirim, termasuk array kosong, membuat stok dihitung ulang dari resep; resep kosong menjadikan stok 0. Kirim `resep` hanya bila perlu (`temuan.md` butir 11)
- Nilai sah satuan resep: gram, ml, pcs, kg, liter
- `kategoriID` hanya diperiksa formatnya, bukan keberadaannya (`temuan.md` butir 13)
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `PUT /role/:id`

- Aturan: validateRolePayload (validators/roleValidator.js)
- Wajib dari klien: `namaRole`, `permissions`
- Field lain yang dikenali: `deskripsi`
- Allowlist field: `tenantID`, `namaRole`, `deskripsi`, `permissions`, `level`
- Diisi server: -

#### `PUT /shift/:id`

- Aturan: validateShiftPayload (validators/shiftValidator.js)
- Wajib dari klien: `namaShift`, `jamMasuk`, `jamPulang`
- Field lain yang dikenali: `isLintasHari`, `toleransiTerlambat`, `status`
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `PUT /tarif/:id`

- Aturan: validateTarifPayload (validators/tarifValidator.js)
- Wajib dari klien: `namaTarif`, `basisPerhitungan`, `harga`, `durasiMinimum`
- Field lain yang dikenali: `hariAktif`, `jamMulai`, `jamSelesai`, `tipeAsetID`
- Diisi server: `tenantID`

#### `PUT /tipeaset/:id`

- Aturan: validateTipeAsetPayload (validators/tipeAsetValidator.js)
- Wajib dari klien: `namaTipeAset`
- Field lain yang dikenali: -
- Diisi server: `tenantID`

#### `PUT /transferstok/:id`

- Aturan: tanpa validator, dibatasi skema `models/transferStokModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Diisi server: `pengirimID`
