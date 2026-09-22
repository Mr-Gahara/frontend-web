# Kontrak API: Payload Operasi Tulis

Sifat perubahan: **Jarang**: koreksi saat migrasi membuktikan perbedaan.

Aturan payload setiap operasi POST, PUT, dan PATCH yang dipanggil frontend. Field yang dibaca service tetapi tidak diperiksa validator dicatat per operasi.

## 4. Payload operasi tulis

Setiap operasi POST, PUT, dan PATCH yang dipanggil frontend. "Aturan" menunjukkan fungsi validator terakhir di rantai validasi, atau skema model bila tidak ada validator. Validator yang dipanggil dari service tidak tertangkap analisis route; operasi stock opname dan transfer stok sudah dikoreksi manual (21 September 2026, `README.md` bagian 1). Tiga operasi inventory divalidasi di route sejak backend `fc159bd` dan juga dikoreksi manual pada tanggal yang sama. Field yang diisi server sudah dikecualikan dari "Wajib dari klien". DELETE tidak membawa body dan tidak dicantumkan.

#### `PATCH /inventory/:id/minimum-stok`

- Aturan: `validateMinimumStokPayload` (validators/inventoryValidator.js) di route sejak backend `fc159bd`: allowlist hanya `stokMinimum`, wajib angka tidak negatif; field lain ditolak "Field tidak dikenal", dan `tenantID`, `_id`, `createdAt`, `updatedAt`, serta `__v` ditolak sebagai field yang diisi server
- Dibaca service dari body: `stokMinimum` (ditolak bila negatif)
- Wajib dari klien: `stokMinimum`
- Field lain yang dikenali: - (ditolak allowlist)
- Diisi server: -

#### `PATCH /pengajuanstok/:id/approve`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Hanya dari SUBMITTED. Stok setiap item diperiksa di `dariLocationID` (gudang asal); stok kurang ditolak 400. Respons `data` berisi dokumen sebelum diperbarui (`temuan.md` butir 26)
- Wajib dari klien: -
- Field lain yang dikenali: `nomorPengajuan`, `jenisPengajuan`, `dariLocationID`, `keLocationID`, `disetujuiOleh`, `ditolakOleh`, `transferStokID`, `items`, `status`, `catatan`, `catatanPenolakan`, `tanggalKebutuhan`, `tanggalApprove`, `tanggalReject`
- Diisi server: `dimintaOleh`

#### `PATCH /pengajuanstok/:id/reject`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Hanya dari SUBMITTED, selain itu 409. REJECTED adalah status akhir: tidak dapat diubah maupun diajukan ulang
- Wajib dari klien: -
- Field lain yang dikenali: `nomorPengajuan`, `jenisPengajuan`, `dariLocationID`, `keLocationID`, `disetujuiOleh`, `ditolakOleh`, `transferStokID`, `items`, `status`, `catatan`, `catatanPenolakan`, `tanggalKebutuhan`, `tanggalApprove`, `tanggalReject`
- Dibaca controller dari body: `alasan`
- Diisi server: `dimintaOleh`

#### `PATCH /pengajuanstok/:id/submit`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Hanya dari DRAFT, selain itu 409
- Wajib dari klien: -
- Field lain yang dikenali: `nomorPengajuan`, `jenisPengajuan`, `dariLocationID`, `keLocationID`, `disetujuiOleh`, `ditolakOleh`, `transferStokID`, `items`, `status`, `catatan`, `catatanPenolakan`, `tanggalKebutuhan`, `tanggalApprove`, `tanggalReject`
- Diisi server: `dimintaOleh`

#### `PATCH /stockopname/:id/approve`

- Aturan: `validateApproveOpname` (validators/stockOpnameValidator.js), dipanggil dari `stockOpnameService` baris 383, bukan dari route: `alasan` opsional, tetapi bila dikirim harus teks
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

- Aturan: `validateUpdateItems` (validators/stockOpnameValidator.js), dipanggil dari `stockOpnameService` baris 214 sampai 216, bukan dari route
- Hanya untuk status DRAFT atau REJECTED. `items` wajib array yang tidak kosong, dan setiap `itemId` wajib ObjectId yang valid
- Validator menolak `qtyPhysical` yang null maupun tidak dikirim ("qtyPhysical wajib diisi."), serta yang bukan angka atau negatif. Loop service sesudahnya sudah menerima `null` sebagai belum dihitung dan membiarkan field yang tidak dikirim, tetapi tidak tercapai (`temuan.md` butir 22). Akibatnya setiap item yang dikirim wajib membawa `qtyPhysical` angka, termasuk bila hanya catatannya yang berubah
- `catatanItem` opsional; bila dikirim harus teks dan disimpan apa adanya, termasuk string kosong. Item yang tidak dikirim tidak berubah
- Wajib dari klien: -
- Field lain yang dikenali: `nomorOpname`, `locationID`, `tanggal`, `reviewerID`, `status`, `items`, `catatan`, `catatanReview`, `stockAdjustmentID`
- Dibaca controller dari body: `items`
- Diisi server: `picID`

#### `PATCH /stockopname/:id/reject`

- Aturan: `validateRejectOpname` (validators/stockOpnameValidator.js), dipanggil dari `stockOpnameService` baris 332, bukan dari route: `catatanReview` wajib teks yang tidak kosong
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
- Dari PENDING atau DIKIRIM, lewat gerbang atomik; DITERIMA dan BATAL adalah status akhir (`transferStokService.updateStatus`). Dari DIKIRIM, stok setiap item dikembalikan ke `dariLocationID` dengan jurnal Masuk beralasan "Lainnya" dalam satu transaksi (`temuan.md` butir 36). Pengajuan terkait kembali ke PENDING dan `transferStokID`-nya dilepas
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Diisi server: `pengirimID`

#### `PATCH /transferstok/:id/kirim`

- Aturan: tanpa validator, dibatasi skema `models/transferStokModel.js`
- Hanya dari PENDING, lewat gerbang atomik (kiriman kedua dijawab 409). Stok setiap item dikurangi di `dariLocationID` dengan syarat stok cukup, dan jurnal Keluar "Transfer Gudang" dicatat, dalam satu transaksi; bila gagal, status dikembalikan ke PENDING
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Dibaca controller dari body: seluruh body diteruskan ke service (`...req.body`); service hanya memakai `tanggalKirim`, dengan bawaan waktu server
- Diisi server: `pengirimID`

#### `PATCH /transferstok/:id/terima`

- Aturan: tanpa validator, dibatasi skema `models/transferStokModel.js`
- Hanya dari DIKIRIM, lewat gerbang atomik. `items` dari body menggantikan seluruh items surat jalan tanpa validasi (`temuan.md` butir 29), lalu stok di `keLocationID` ditambah per item sebesar `qtyTerima`, atau `qtyKirim` bila `qtyTerima` 0 atau tidak dikirim (butir 30), dengan jurnal Masuk "Transfer Gudang". Pengajuan terkait menjadi COMPLETED
- Karena itu klien wajib mengirim seluruh item dengan `bahanBakuID` dan `qtyKirim` dari server; web menyusunnya lewat `susunPayloadTerima` (`features/transfer-stok/payload.ts`)
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Dibaca controller dari body: seluruh body diteruskan ke service (`...req.body`); service memakai `items` dan `tanggalTerima`, dengan bawaan waktu server
- Diisi server: `penerimaID`

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

- Tidak ada di backend. Frontend berhenti memanggilnya di `aab26f3` (`temuan.md` butir 1); entri ini dipertahankan sebagai jejak.

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

- Aturan: `validateCreatePayload` (validators/inventoryValidator.js) di route sejak backend `fc159bd`: allowlist `bahanBakuID`, `barangInventoryID`, `locationID`, `stok`, dan `stokMinimum`; tepat satu di antara `bahanBakuID` dan `barangInventoryID`; `locationID` wajib ObjectId; `stok` dan `stokMinimum` bila dikirim wajib angka tidak negatif
- Item yang sudah terdaftar di lokasi yang sama ditolak: satu catatan stok per item per lokasi (`inventoryService` sekitar baris 24)
- Wajib dari klien: `locationID`, serta salah satu dari `bahanBakuID` atau `barangInventoryID`
- Field lain yang dikenali: `bahanBakuID`, `barangInventoryID`, `locationID`, `stok`, `stokMinimum`
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /inventory/:id/opname`

- Aturan: `validateOpnamePayload` (validators/inventoryValidator.js) di route sejak backend `fc159bd`: allowlist `fisikAktual` dan `catatan`; `fisikAktual` wajib angka tidak negatif; `catatan` bila dikirim wajib teks
- Dibaca service dari body: `fisikAktual` (stok menjadi nilai ini; wajib angka tidak negatif, string dan `null` ditolak 400, `inventoryService` baris 162 di backend `f27f093`) dan `catatan` (keterangan pencatatan, bawaan "Koreksi stok fisik")
- Wajib dari klien: `fisikAktual`
- Field lain yang dikenali: - (ditolak allowlist)
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
- Arah: `dariLocationID` adalah gudang asal barang dan `keLocationID` outlet peminta. Tipe keduanya tidak diperiksa backend (`temuan.md` butir 23 dan 24). Jumlah item dikonversi ke satuan dasar bahan baku
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

- Aturan: `validateCreateOpname` (validators/stockOpnameValidator.js), dipanggil dari `stockOpnameService` baris 100, bukan dari route: `locationID` wajib ObjectId yang valid dan `catatan` bila dikirim harus teks; `tenantID` dan `picID` juga diperiksa, keduanya diisi server
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

- Aturan: `validateTransferPayload` (validators/transferStokValidator.js), dipanggil dari `transferStokService` baris 153, bukan dari route, setelah server mengisi arah lokasi, items, nomor, `tenantID`, dan `pengirimID`
- Hanya dari pengajuan APPROVED atau PENDING yang belum punya surat jalan. Arah lokasi disalin dari pengajuan (`transferStokService` baris 143 dan 144); membatalkan surat jalan mengembalikan pengajuan ke PENDING
- `items` opsional: tanpa items, seluruh item pengajuan dipakai dengan jumlah penuh. Item harus berasal dari pengajuan, dan `qtyKirim` setelah dikonversi ke satuan dasar tidak boleh melebihi jumlah permintaan. Stok setiap item di `dariLocationID` diperiksa sebelum dokumen dibuat; stok kurang ditolak 400 "Pembuatan Draft Gagal: Stok untuk salah satu bahan baku tidak mencukupi di lokasi asal."
- `nomorTransfer` dibuat otomatis dari nomor pengajuan bila tidak dikirim
- Wajib dari klien: `pengajuanStokID`
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

- Tidak ada di backend. Frontend berhenti memanggilnya di `aab26f3` (`temuan.md` butir 1); entri ini dipertahankan sebagai jejak.

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
- Ditolak 400 bila status SUBMITTED, COMPLETED, atau REJECTED; DRAFT, APPROVED, dan PENDING dapat diubah (`temuan.md` butir 25). Arah lokasi sama dengan `POST /pengajuanstok`
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

- Aturan: `validateTransferPayload` mode update, dipanggil dari `transferStokService` baris 548, bukan dari route. Whitelist-nya memuat `nomorTransfer`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `pengirimID`, dan `penerimaID`; field lain ditolak
- Hanya untuk status PENDING. `items` hanya diperiksa bentuknya: tidak dikonversi, tidak dibandingkan dengan pengajuan, dan stok tidak diperiksa (`temuan.md` butir 32). Web hanya mengirim `items` berisi `bahanBakuID` dan `qtyKirim` dalam satuan dasar
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Diisi server: `pengirimID`
