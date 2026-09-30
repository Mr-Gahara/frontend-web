# Kontrak API: Payload Operasi Tulis

Sifat perubahan: **Jarang**: koreksi saat migrasi membuktikan perbedaan.

Aturan payload setiap operasi POST, PUT, dan PATCH yang dipanggil frontend. Field yang dibaca service tetapi tidak diperiksa validator dicatat per operasi.

## 4. Payload operasi tulis

Setiap operasi POST, PUT, dan PATCH yang dipanggil frontend. "Aturan" menunjukkan fungsi validator terakhir di rantai validasi, atau skema model bila tidak ada validator. Validator yang dipanggil dari service tidak tertangkap analisis route; operasi stock opname dan transfer stok sudah dikoreksi manual (21 September 2026, `README.md` bagian 1). Tiga operasi inventory divalidasi di route sejak backend `fc159bd` dan juga dikoreksi manual pada tanggal yang sama. Field yang diisi server sudah dikecualikan dari "Wajib dari klien". DELETE tidak membawa body dan tidak dicantumkan. Pada 30 September 2026, operasi buat akun kas, penjualan, pembayaran, sesi booking, tipe aset, serta terima dan batal transfer stok dikoreksi terhadap backend `465b438`; operasi diskon, pajak, pelanggan, dan ubah metode pembayaran belum, dan diperiksa saat modul pemiliknya dimigrasikan; buat metode pembayaran dikoreksi bersama `temuan.md` butir 84.

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
- Hanya dari PENDING sejak backend `465b438` (P12); DIKIRIM ditolak 400, sehingga barang yang sudah dikirim diselesaikan lewat terima (`temuan.md` butir 36). DITERIMA dan BATAL adalah status akhir. Pengajuan terkait kembali ke PENDING dan `transferStokID`-nya dilepas
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
- Hanya dari DIKIRIM, lewat gerbang atomik. Sejak backend `465b438`, `items` dari body hanya memuat barang yang berbeda dari kiriman, dikenali lewat `itemId` (id item surat jalan) atau `bahanBakuID`; barang di luar surat jalan dan `qtyKirim` yang berbeda ditolak, dan body tanpa `items` berarti seluruh barang diterima penuh (`temuan.md` butir 29). Stok di `keLocationID` ditambah per item sebesar `qtyTerima`, dengan jurnal Masuk "Transfer Gudang"; `qtyTerima` 0 berarti barang tidak sampai, tanpa stok maupun jurnal masuk (butir 30, `transferStokService` baris 544 sampai 547). Pengajuan terkait menjadi COMPLETED
- Web mengirim seluruh item dengan `itemId` bila ada, `bahanBakuID` sebagai cadangan, dan `qtyTerima` apa adanya termasuk 0, lewat `susunPayloadTerima` (`features/transfer-stok/payload.ts`, `6e314ae`)
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

- Aturan: validateAkunKasPayload (validators/akunKasValidator.js). Dikoreksi 28 September 2026 terhadap validator: `tipeAkun` wajib saat create, dan `saldo` bila dikirim wajib bertipe number dan tidak negatif
- Wajib dari klien: `namaAkun` dan `nomorAkun` (diperiksa setelah `trim`), `tipeAkun`
- Field lain yang dikenali: `status`, `saldo`
- Tidak diperiksa validator tetapi dipakai: `keterangan` (controller meneruskan `...req.body` ke `AkunKas.create`)
- Nilai sah: `VALID_TIPE_AKUN`: Kas Fisik, Rekening Bank; `VALID_STATUS`: aktif, non-aktif
- Nomor akun duplikat dalam tenant dijawab 400 "Nomor Akun sudah digunakan di tenant ini" (`akunKasService` baris 69), bukan 409
- Sejak backend `465b438`, setiap tenant dibatasi 10 akun kas aktif, dan buat ditolak 409 bila sudah penuh (`akunKasService` baris 141 sampai 144); saldo awal lebih dari 0 dicatat sebagai mutasi `SALDO_AWAL`. Akun bersaldo tidak dapat ditutup, dan `DELETE /akunkas/:id` tidak ada lagi (`temuan.md` butir 81), sehingga spec web tidak membuat akun uji bersaldo (`refactor/pengujian.md`)
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /aset`

- Aturan: validateAsetPayload (validators/asetValidator.js)
- Wajib dari klien: `namaAset`, `tipeAsetID`
- Field lain yang dikenali: `status`
- Nilai sah: `VALID_STATUS`: tersedia, digunakan, perbaikan
- Dibaca controller dari body: `-`
- Diisi server: -
- Service mengganti `status` kosong atau `digunakan` menjadi `tersedia`. Status yang dibaca kembali dihitung ulang dari sesi booking Aktif yang sedang berjalan (`asetService._applyDynamicStatus`), kecuali `perbaikan`. `tipeAsetID` hanya diperiksa formatnya

#### `POST /bahan-baku`

- Tidak ada di backend. Frontend berhenti memanggilnya di `aab26f3` (`temuan.md` butir 1); entri ini dipertahankan sebagai jejak.

#### `POST /bahanbaku`

- Aturan: validateBahanBakuPayload (validators/bahanBakuValidator.js)
- Wajib dari klien: `namaBahan`
- Field lain yang dikenali: `satuan`, `stok`
- Tidak diperiksa validator tetapi dipakai service: `locationID` (lokasi tujuan injeksi stok awal; tanpa ini backend memakai outlet pertama tenant, atau lokasi apa pun bila tenant belum punya outlet, `temuan.md` butir 38), `stokMinimum` (batas minimum entri inventory yang dibuat)
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

- Aturan: tanpa validator di route. Service `createManual` mewajibkan `penggunaId` dan `tanggal`, serta minimal satu shift bila bukan libur (400), lalu menyusun satu entri per shift dan meneruskannya ke `generateBulk`, sehingga seluruh aturan `POST /jadwalshift/bulk` berlaku. Dikoreksi 29 September 2026; sebelumnya tercatat memakai field model
- Body yang dibaca service: `penggunaId`, `tanggal` (YYYY-MM-DD), `isLibur`, `shiftIds[]`, dan `catatan`. Ejaannya berbeda dari field model (`penggunaID`, `tanggalKerja`, `shiftID`)
- Wajib dari klien: `penggunaId`, `tanggal`, dan `shiftIds` yang tidak kosong bila `isLibur` false
- Upsert per `tenantID`, `penggunaID`, `tanggalKerja`, dan `shiftID`: membuat jadwal yang sama dua kali tidak ditolak, hanya diperbarui. Libur disimpan sebagai dokumen ber-`shiftID` null, sehingga tidak menimpa shift di hari yang sama (`temuan.md` butir 64)
- Respons 201 dengan `data` berisi `message`, `berhasilDiproses`, `ditolak`, dan `detailDitolak`, juga saat seluruh jadwal ditolak (`temuan.md` butir 66)
- Diisi server: `tenantID`

#### `POST /jadwalshift/bulk`

- Aturan: `validateJadwalShiftPayload` (validators/jadwalShiftValidator.js), dipanggil dari `jadwalShiftService.generateBulk`, bukan dari route. Dikoreksi 29 September 2026
- Body: array (satu objek diterima sebagai array berisi satu), maksimal 2000 entri. Setiap entri: `penggunaID` dan `tanggalKerja` wajib, `isLibur` wajib boolean, `shiftID` wajib ObjectId bila bukan libur, dan `catatan` opsional
- Aturan service: setiap `penggunaID` harus milik tenant (400 bila tidak); shift diambil hanya yang Aktif, dan entri dengan shift tidak aktif dilewati tanpa masuk `detailDitolak` (`temuan.md` butir 62); cuti yang disetujui memaksa hari itu libur dengan catatan otomatis; entri yang bentrok jam dengan entri lain di batch yang sama masuk `detailDitolak`, dan bentrok dengan jadwal lama pengguna itu dari sehari sebelum sampai sehari sesudah juga diperiksa
- Ditulis lewat `bulkWrite` upsert per 500 entri, dengan filter yang sama dengan `POST /jadwalshift`; galat penulisan ditelan (`temuan.md` butir 63)
- Respons 200 dengan `data` berisi `message`, `berhasilDiproses`, `ditolak`, dan `detailDitolak`. `berhasilDiproses` hanya menghitung dokumen yang dibuat atau berubah (`temuan.md` butir 66)
- Web mengirim `penggunaID`, `tanggalKerja` (YYYY-MM-DD), `isLibur`, dan `shiftID` untuk hari kerja
- Diisi server: `tenantID`

#### `POST /kategori`

- Aturan: tanpa validator, dibatasi skema `models/kategoriModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `namaKategori`, `kodeKategori`, `keterangan`
- Duplikat nama atau kode: 400 `{ errors: ["tenantID sudah digunakan di tenant ini"] }` tanpa `message`; field yang bentrok tidak disebut (`temuan.md` butir 14)
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /location`

- Aturan: validateLocationPayload (validators/locationValidator.js) di route, setelah `tenantID` disuntik dari sesi. Dikoreksi 29 September 2026 terhadap backend `00b9957`; sebelumnya allowlist update tercatat sebagai allowlist buat, dan hanya `alamat` yang tercatat wajib
- Allowlist buat (`DIIZINKAN_BUAT`): `tenantID`, `nama`, `alamat`, `tipe`, `latitude`, `longitude`, `radiusAbsen`. Field lain ditolak "Field tidak dikenal", sedangkan `_id`, `koordinat`, `createdAt`, `updatedAt`, dan `__v` ditolak sebagai field yang diisi server
- Wajib dari klien: `nama` dan `alamat` (teks yang tidak kosong setelah `trim`), `tipe`, `latitude`, dan `longitude`
- Koordinat wajib angka sungguhan (bertipe number dan terhingga; teks angka dan `null` ditolak), dengan latitude -90 sampai 90 dan longitude -180 sampai 180. `radiusAbsen` opsional; bila dikirim wajib angka 10 sampai 50, dan bawaan model 50
- Nilai sah: `VALID_TIPE`: Gudang, Outlet
- Aturan service: satu tenant hanya boleh punya satu lokasi bertipe Outlet (`locationService.create` baris 39 sampai 49, dan indeks unik parsial yang bentroknya dijawab 409 di baris 68); Gudang boleh lebih dari satu. Koordinat disimpan sebagai GeoJSON `koordinat` berurutan longitude, latitude
- Galat validator dijawab 400 lewat errorHandler pusat dengan `message` "Payload lokasi tidak valid." dan `errors`
- Web mengirim hasil `payloadBuatLokasi` (`features/inventaris/schema-lokasi.ts`) dari setup gudang
- Dibaca controller dari body: seluruh body, dengan `tenantID` ditimpa dari sesi
- Diisi server: `tenantID`

#### `POST /metodepembayaran`

- Aturan: validateMetodePembayaranPayload (validators/metodePembayaranValidator.js). Dikoreksi 30 September 2026 terhadap backend `465b438`: allowlist `FIELD_DIIZINKAN` berisi `namaPembayaran`, `akunKasID`, `kategori`, dan `isActive`; field lain ditolak 400, dan `tenantID` ditolak sebagai field terlarang (`FIELD_DILARANG`)
- Wajib dari klien: `namaPembayaran` dan `akunKasID` (ObjectId yang sah)
- Field lain yang dikenali: `kategori`, `isActive`
- Aturan service: akun kas tujuan harus aktif, selain itu 400 (`_tulisDenganAkunKas`); satu akun kas boleh dipakai banyak metode; nama kembar dalam tenant ditolak 409 (indeks unik `{ tenantID, namaPembayaran }` tanpa membedakan huruf besar kecil); paling banyak 10 metode aktif per tenant, dan metode ke-11 ditolak 409 (`BATAS_METODE_AKTIF`)
- Halaman lama web selalu mengirim `isAutomated`, sehingga seluruh permintaan buatnya ditolak 400 (`temuan.md` butir 84)
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
- Wajib dari klien: `penjualanID`, `metodePembayaranID`, dan `jumlahBayar` (angka lebih dari 0); `tanggalBayar` wajib bila status akhirnya PAID dan tidak boleh mendahului tanggal transaksi penjualan (`pembayaranService`, dikoreksi 26 September 2026)
- Field lain yang dikenali: `tanggalBayar`, `catatan`, dan `uangDiterima` (opsional; bila dikirim wajib angka). Sejak backend `465b438`, field yang diatur server (`FIELD_SERVER`), antara lain `akunKasID`, ditolak 400 "Field diatur server dan tidak boleh dikirim": akun kas tujuan diambil dari metode pembayaran, dan `kembalian` dihitung server. Web tidak mengirim `status` (keputusan K2a); cabang gateway `metode.isAutomated` masih ada di service tetapi tidak pernah berjalan (`temuan.md` butir 45 dan 78)
- Web menolak membayar penjualan DRAFT dan VOID sejak `b85c2bd`: pembayaran baru dibuka setelah finalisasi, untuk penjualan UNPAID atau PARTIAL
- Nilai sah: `VALID_STATUS`: PAID, PENDING, EXPIRED, FAILED, VOID
- Aturan service: penjualan VOID, penjualan yang sudah lunas, dan `jumlahBayar` di atas `sisaTagihan` ditolak 400 (belum diperiksa ulang terhadap backend `465b438`); `sisaTagihan` dikurangi secara atomik sebelum dokumen dibuat. Tanpa idempotensi (`temuan.md` butir 44). Galat validator dibalas mentah `{ errors }` dari route (butir 42)
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /pengajuanstok`

- Aturan: tanpa validator, dibatasi skema `models/pengajuanStokModel.js`
- Arah: `dariLocationID` adalah gudang asal barang dan `keLocationID` outlet peminta. Tipe keduanya tidak diperiksa backend (`temuan.md` butir 23 dan 24). Jumlah item dikonversi ke satuan dasar bahan baku. Web mengunci `keLocationID` ke outlet tenant bagi pengguna tanpa izin lintas outlet; backend tidak membatasi outlet peminta (`temuan.md` butir 39)
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

- Aturan: `validatePenjualanPayload` (validators/penjualanValidator.js), dipasang di route setelah `tenantID` disuntik dari sesi; controller lalu menyaring body dengan allowlist 13 field (`_sanitizePayload`, dikoreksi 30 September 2026 terhadap backend `465b438`). Analisis statis sempat mencatat `validateIdOrArray`, fungsi pembantu di berkas yang sama (dikoreksi 26 September 2026)
- Wajib dari klien: `pelangganID`, `jenisTransaksi`, `tanggalTransaksi` (tidak boleh di masa depan), `jenisPenjualan`, `itemPenjualan` (minimal satu, dengan `produkID` sah dan `jumlah` minimal 1)
- Field lain yang dikenali (allowlist controller): `jatuhTempo`, `diskonGlobal`, `pajakTransaksiIDs`, `keterangan`, `locationID`, `simpanDraft`, `statusPenjualan`, `finalize`; diskon per item lewat `itemPenjualan[].diskonItem`
- Sejak backend `465b438`, `penggunaID` tidak lagi wajib dan kasir diambil dari token (`temuan.md` butir 41). Harga dan diskon tidak dapat diatur kasir: `jumlahDiskon` per item dan `jumlahDiskonTransaksi` ditolak validator ("gunakan diskonItem" dan "gunakan diskonGlobal"), sedangkan nama lama `diskonGlobalIDs` dibuang allowlist tanpa galat, sehingga diskon global hilang diam-diam. Web mengirim `diskonGlobal` dan `diskonItem` sejak `b85c2bd`, dibuktikan lewat e2e
- Header: `x-idempotency-key` (opsional). Kunci yang sama dalam 24 jam per tenant mengembalikan hasil pertama, dan dijawab 409 selama permintaan pertama masih diproses
- Nilai status penjualan: DRAFT, UNPAID, PARTIAL, PAID, dan VOID sejak backend `465b438`; FINAL dihapus, dan UNPAID, PARTIAL, serta PAID dihitung dari pembayaran; `VALID_JENIS_TRANSAKSI`: POS, INVOICE; `VALID_JENIS_PENJUALAN`: dine-in, takeaway, booking
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /polaroster`

- Aturan: validatePolaRosterPayload (validators/polaRosterValidator.js)
- Wajib dari klien: `namaPola`, `siklusHari`, `detailSiklus`
- Field lain yang dikenali: `keterangan`, disimpan model tanpa aturan validator
- Aturan validator: `siklusHari` angka minimal 1; `detailSiklus` array yang panjangnya sama dengan `siklusHari`, dengan `hariKe` unik dari 1 sampai `siklusHari`; hari kerja wajib `shiftID` ObjectId yang sah, dan hari libur boleh tanpa `shiftID`. Controller menolak `detailSiklus` lebih dari 365 hari; web membatasi 31 (keputusan PL4a). Service menolak 400 bila ada shift yang tidak ditemukan atau sudah nonaktif. Nama ganda dalam tenant (indeks `{ tenantID, namaPola }`) dijawab 4xx tanpa pesan galat MongoDB (spec `dcc22e0`). Dikoreksi 29 September 2026
- Web mengirim hasil `payloadPolaRoster` (`features/pola-roster/payload.ts`): nama dipangkas, dan `shiftID` hanya untuk hari kerja
- Respons 201 dengan `data` berbentuk item `GET /polaroster`
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

- Aturan: `validateSesiBookingPayload` (validators/sesiBookingValidator.js) di route. Analisis statis sempat mencatat `validateWaktuRange`, fungsi pembantu di berkas yang sama (dikoreksi 27 September 2026)
- Wajib dari klien: `dataPelanggan`, lalu salah satu dari dua jalur yang saling meniadakan: jalur tunggal (`dataAset`, `waktuMulai`, `waktuSelesai`) atau jalur batch (`items` tidak kosong, setiap item dengan `dataAset`, `waktuMulai`, dan `waktuSelesai`). Controller memanggil `createBatch` untuk jalur batch dan `create` untuk jalur tunggal
- Aturan service: kedua jalur membuat penjualan `booking` berstatus UNPAID sejak backend `465b438`, dengan `sisaTagihan` sama dengan `totalTagihan`; penjualan tanpa pembayaran dapat di-void beserta booking-nya (`temuan.md` butir 56); `simpanDraft` tidak dibaca. Bentrok hanya dihitung terhadap booking Aktif yang sudah dibayar, sehingga jadwal baru terkunci setelah pembayaran pertama, dan bentrok ditolak 409 (`checkConflict`). Tarif dipilih otomatis lewat `findBestTarif` menurut tipe aset, hari, dan jam, lalu prioritas, tanpa memeriksa `isActive`
- Field lain yang dikenali: `dataTarif`, `diskonItem`, `diskonGlobal`, `status`, `simpanDraft`, `noReferensi`, `dataPenjualan`
- Nilai sah: `VALID_STATUS`: Aktif, Selesai, VOID (sebelumnya Batal; validator baris 3 dan model baris 53 di backend `465b438`). Tidak Datang tidak disimpan, melainkan dihitung saat dibaca
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`, `dataPengguna`

#### `POST /shift`

- Aturan: validateShiftPayload (validators/shiftValidator.js)
- Wajib dari klien: `namaShift`, `jamMasuk`, `jamPulang`
- Field lain yang dikenali: `isLintasHari`, `toleransiTerlambat`, `status`
- Jam divalidasi dengan pola yang titik duanya opsional, sehingga "0800" diterima (`temuan.md` butir 68); `isLintasHari` tidak dicocokkan dengan jam (butir 69), dan jam masuk yang sama dengan jam pulang hanya sah bila lintas hari. Nama ganda dalam tenant (indeks `{ tenantID, namaShift }`) dijawab 4xx tanpa pesan galat MongoDB; spec `f99b7cf` menerima 400 maupun 409. Controller meneruskan `...req.body` ke `Shift.create`, dan field di luar skema dibuang Mongoose, termasuk `workspace` yang dahulu dikirim web. Web mengirim keenam field dari `payloadShift` (`features/shift/payload.ts`). Dikoreksi 29 September 2026
- Respons 201 dengan `data` berbentuk item `GET /shift`
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
- Field lain yang dikenali: `hariAktif`, `jamMulai`, `jamSelesai`, `tipeAsetID`; `isActive` dan `prioritas` diteruskan service tanpa aturan, dan model berbawaan `isActive: false`
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `POST /tipeaset`

- Aturan: validateTipeAsetPayload (validators/tipeAsetValidator.js)
- Wajib dari klien: `namaTipeAset`
- Field lain yang dikenali: `deskripsi`, tanpa aturan di validator dan diteruskan service
- Nama tipe aset kembar dalam toko ditolak 409 "Nama tipe aset sudah digunakan di toko ini" (`tipeAsetService` baris 149 dan 186, juga saat `PUT`), dan hapus tipe aset yang masih dipakai aset ditolak 409 (baris 206), sejak backend `465b438`
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
- Wajib dari klien: - (validator memeriksa field wajib hanya saat create; `tipeAsetID` yang dikirim diperiksa formatnya)
- Field lain yang dikenali: `namaAset`, `tipeAsetID`, `status`
- Nilai sah: `VALID_STATUS`: tersedia, digunakan, perbaikan
- Diisi server: -
- Service mengganti `status` `digunakan` menjadi `tersedia`, sehingga status itu tidak dapat dipaksa dari klien

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

- Aturan: tanpa validator. Service `update` hanya membaca `isLibur`, `shiftID`, dan `catatan`; field yang tidak dikirim memakai nilai lama, dan pengguna maupun tanggal tidak dapat diubah. Dikoreksi 29 September 2026
- Bukan libur: `shiftID` wajib (400) dan harus shift Aktif milik tenant (400 "Master Shift yang dipilih tidak ditemukan atau sudah tidak aktif."), lalu diperiksa bentrok jam dengan jadwal lain pengguna itu dari sehari sebelum sampai sehari sesudah (400)
- Libur: `shiftID` dikosongkan
- Wajib dari klien: -
- Respons 200 dengan detail jadwal, berbentuk seperti item `GET /jadwalshift`
- Diisi server: -

#### `PUT /kategori/:id`

- Aturan: tanpa validator, dibatasi skema `models/kategoriModel.js`
- Wajib dari klien: -
- Field lain yang dikenali: `namaKategori`, `kodeKategori`, `keterangan`
- Duplikat nama atau kode: 400 `{ errors: ["tenantID sudah digunakan di tenant ini"] }` tanpa `message`, sama seperti `POST /kategori` (`temuan.md` butir 14)
- Diisi server: -

#### `PUT /location/:id`

- Aturan: validateLocationPayload mode update (validators/locationValidator.js) di route: seluruh field opsional, tetapi yang dikirim diperiksa, lalu body diganti hasil whitelist (`validation.updates`). Ditambahkan 30 September 2026 terhadap backend `00b9957`
- Allowlist update: `nama`, `alamat`, `latitude`, `longitude`, `radiusAbsen`. `tenantID`, `_id`, `createdAt`, `updatedAt`, dan `tipe` ditolak "tidak diizinkan untuk diubah"; field lain ditolak "Field tidak dikenal"; body tanpa field sah ditolak "Tidak ada data valid untuk diperbarui."
- Aturan nilai sama dengan `POST /location`: nama dan alamat teks yang tidak kosong, koordinat angka sungguhan dalam rentangnya, dan radius 10 sampai 50
- Aturan service: bila salah satu koordinat dikirim, `koordinat` disusun ulang dari nilai baru dan nilai lama, lalu `$set` dijalankan dengan `runValidators`; lokasi milik tenant lain dijawab 404; cache daftar, detail, dan lokasi tenant dibersihkan
- Respons 200 dengan `data` berbentuk item `GET /location` dan `message` "Lokasi berhasil diperbarui"
- Web mengirim kelima field hasil `payloadPerbaruiLokasi` (`features/inventaris/schema-lokasi.ts`) dari pengaturan gudang
- Wajib dari klien: -
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

#### `PUT /pembayaran/:id`

- Aturan: `FIELD_UPDATE` di `services/pembayaranService.js` baris 27: hanya `catatan` dan `status` yang dibaca. Ditambahkan 30 September 2026 terhadap backend `465b438`
- Dipakai web untuk membatalkan pembayaran PAID dengan `{ status: "VOID", catatan? }`, beralasan opsional; tombolnya hanya untuk pembayaran PAID dan pemegang `update-pembayaran` (`bolehBatalkanPembayaran`)
- Aturan service: membatalkan pembayaran PAID mengurangi saldo akun kas tujuannya dan mencatat mutasi `VOID_PEMBAYARAN` beserta alasannya (baris 506 sampai 518), lalu status bayar dan sisa tagihan penjualan disinkronkan. `catatan` asli pembayaran ditimpa alasan pembatalan (`temuan.md` butir 75)
- Wajib dari klien: -
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

- Aturan: `validatePenjualanPayload` dengan `isUpdate` (validators/penjualanValidator.js) di route, lalu allowlist controller yang sama dengan buat. Analisis statis sempat mencatat `validateIdOrArray` (dikoreksi 26 September 2026)
- Wajib dari klien: - (seluruh field opsional saat update)
- Field lain yang dikenali: sama dengan buat. `finalize: true` memfinalisasi DRAFT menjadi UNPAID, memotong stok lewat `inventoryService.processSaleStock` di `locationID` penjualan atau lokasi Outlet pertama tenant; `statusPenjualan: "VOID"` membatalkan DRAFT, atau UNPAID yang belum punya pembayaran aktif, beserta sesi booking-nya
- Aturan service: penjualan VOID tidak dapat diubah; sejak backend `465b438`, penjualan yang punya pembayaran aktif tidak dapat di-VOID sampai pembayarannya dibatalkan lewat `PUT /pembayaran/:id`, menggantikan aturan FINAL
- Nilai status penjualan: DRAFT, UNPAID, PARTIAL, PAID, dan VOID; `VALID_JENIS_TRANSAKSI`: POS, INVOICE; `VALID_JENIS_PENJUALAN`: dine-in, takeaway, booking
- Dibaca controller dari body: `-`
- Diisi server: `tenantID`

#### `PUT /polaroster/:id`

- Aturan: validatePolaRosterPayload mode update (validators/polaRosterValidator.js): seluruh field opsional, tetapi `siklusHari` dan `detailSiklus` wajib dikirim bersamaan
- Wajib dari klien: -
- Field lain yang dikenali: `namaPola`, `siklusHari`, `detailSiklus`, `keterangan`
- Selalu gagal selama `detailSiklus` ikut dikirim: validator model memakai `this.siklusHari` di dalam `findOneAndUpdate`, dan di sana `this` adalah query (`test.fixme` di `refactor/pengujian.md`); web selalu mengirimnya. Service menjalankan `$set` atas seluruh body, sehingga `tenantID` yang dikirim ikut disimpan bila berupa ObjectId yang sah (`temuan.md` butir 72); web tidak mengirimnya. Dikoreksi 29 September 2026
- Dibaca controller dari body: `-`
- Diisi server: - (`tenantID` hanya diisi saat create)

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

- Aturan: validateShiftPayload mode update (validators/shiftValidator.js): seluruh field opsional, tetapi yang dikirim diperiksa formatnya
- Wajib dari klien: -
- Field lain yang dikenali: `namaShift`, `jamMasuk`, `jamPulang`, `isLintasHari`, `toleransiTerlambat`, `status`
- Service menjalankan `findOneAndUpdate` dengan `$set` atas seluruh body. `tenantID` yang dikirim ikut disimpan bila berupa ObjectId yang sah, sehingga shift dapat dipindah ke tenant lain (`temuan.md` butir 71); web tidak mengirimnya. Dikoreksi 29 September 2026
- Dibaca controller dari body: `-`
- Diisi server: - (`tenantID` hanya diisi saat create)

#### `PUT /tarif/:id`

- Aturan: validateTarifPayload (validators/tarifValidator.js)
- Wajib dari klien: - (validator memeriksa field wajib hanya saat create)
- Field lain yang dikenali: `namaTarif`, `basisPerhitungan`, `harga`, `durasiMinimum`, `hariAktif`, `jamMulai`, `jamSelesai`, `tipeAsetID`; `isActive` dan `prioritas` diteruskan service tanpa aturan
- `tipeAsetID` digabung ke tipe aset lama lewat `$addToSet`, sehingga tipe aset tidak dapat dilepas maupun diganti (`temuan.md` butir 54)
- Diisi server: - (`tenantID` hanya disuntikkan saat create, sehingga cache tipe aset dibersihkan dengan `tenantID` undefined, `temuan.md` butir 55)

#### `PUT /tipeaset/:id`

- Aturan: validateTipeAsetPayload (validators/tipeAsetValidator.js)
- Wajib dari klien: - (`namaTipeAset` yang dikirim tidak boleh kosong dan minimal 2 karakter)
- Field lain yang dikenali: `deskripsi`, tanpa aturan; payload diteruskan utuh ke `findOneAndUpdate`, sehingga string kosong menghapus deskripsi (dikirim frontend sejak `a2adc70`)
- Diisi server: - (`tenantID` hanya disuntikkan saat create, dan dibuang service saat update)

#### `PUT /transferstok/:id`

- Aturan: `validateTransferPayload` mode update, dipanggil dari `transferStokService` baris 548, bukan dari route. Whitelist-nya memuat `nomorTransfer`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `pengirimID`, dan `penerimaID`; field lain ditolak
- Hanya untuk status PENDING. `items` hanya diperiksa bentuknya: tidak dikonversi, tidak dibandingkan dengan pengajuan, dan stok tidak diperiksa (`temuan.md` butir 32). Web hanya mengirim `items` berisi `bahanBakuID` dan `qtyKirim` dalam satuan dasar
- Wajib dari klien: -
- Field lain yang dikenali: `nomorTransfer`, `pengajuanStokID`, `dariLocationID`, `keLocationID`, `status`, `items`, `tanggalKirim`, `tanggalTerima`, `penerimaID`
- Diisi server: `pengirimID`
