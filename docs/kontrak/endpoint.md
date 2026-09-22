# Kontrak API: Endpoint

Sifat perubahan: **Jarang**: koreksi saat migrasi membuktikan perbedaan.

Endpoint yang dipanggil frontend beserta auth, permission, envelope, dan bentuk respons GET. Aturan umum dan keterbatasannya ada di `README.md`.

## 3. Endpoint yang dipakai frontend

Saat kontrak dibangkitkan, frontend memanggil 126 endpoint unik; 121 di antaranya didefinisikan backend. Backend memiliki 246 route secara keseluruhan (Lampiran A, `route-backend.md`). Audit ulang 22 September 2026 (frontend `580a1e1`, backend `9cd1439`): frontend memanggil 124 endpoint unik, 122 lewat `apiData`, `api`, dan `apiClient` dan 2 lewat `fetch` langsung untuk penyegaran sesi, seluruhnya ada di backend dan tercatat di tabel ini; lima baris `/bahan-baku` tinggal sebagai jejak, dan backend kini memiliki 247 route (tambahan sejak acuan: `POST /akun/owner/create-tenant`, belum dipakai frontend). Kolom "Dipakai di" diisi dari audit itu: berkas `features/` pemanggilnya, jumlah berkas halaman lama yang masih memanggil lewat `apiClient`, atau keterangan bila tidak dipanggil lagi.

Seluruh path di bagian 3 sampai 5 dan Lampiran A ditulis relatif terhadap `/api`; contoh `/diskon` berarti `/api/diskon`. Kolom Permission berisi `-` bila route tidak memakai `checkPermission`. Kolom Envelope dan ID hanya terisi untuk GET yang diambil sampelnya.

### 3.1 Tabel endpoint per modul

#### `/absensi`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/absensi/monitoring` | authPengguna | - | `{ data }` | - | 1 file |

#### `/akun`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| POST | `/akun/auth/login` | public | - | - | - | 1 file |
| POST | `/akun/auth/refreshtoken` | public | - | - | - | 2 file (lewat `fetch`: `lib/apiClient.ts` dan `components/providers/session-provider.tsx`) |
| POST | `/akun/auth/logout` | public | - | - | - | 2 file |

#### `/akunkas`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/akunkas` | authPengguna | `read-akunkas` | `{ data }` | `id` | 6 file |
| POST | `/akunkas` | authPengguna | `create-akunkas` | - | - | 1 file |

#### `/aset`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/aset` | authPengguna | - | `{ data }` | `id` | 3 file |
| POST | `/aset` | authPengguna | `create-aset` | - | - | 1 file |
| GET | `/aset/:id` | authPengguna | - | `{ data }` | `id` | 1 file |
| PUT | `/aset/:id` | authPengguna | `update-aset` | - | - | 1 file |
| DELETE | `/aset/:id` | authPengguna | `delete-aset` | - | - | 1 file |

#### `/bahan-baku`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/bahan-baku` | tidak ada di backend | - | - | - | tidak dipanggil lagi, dibuang di `aab26f3` (`temuan.md` butir 1) |
| POST | `/bahan-baku` | tidak ada di backend | - | - | - | tidak dipanggil lagi, dibuang di `aab26f3` (`temuan.md` butir 1) |
| GET | `/bahan-baku/:param` | tidak ada di backend | - | - | - | tidak dipanggil lagi, dibuang di `aab26f3` (`temuan.md` butir 1) |
| PUT | `/bahan-baku/:param` | tidak ada di backend | - | - | - | tidak dipanggil lagi, dibuang di `aab26f3` (`temuan.md` butir 1) |
| DELETE | `/bahan-baku/:param` | tidak ada di backend | - | - | - | tidak dipanggil lagi, dibuang di `aab26f3` (`temuan.md` butir 1) |

#### `/bahanbaku`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/bahanbaku` | authPengguna | `read-bahan` | `{ data, success }` | `id` | `features/bahan-baku/api.ts` |
| POST | `/bahanbaku` | authPengguna | `create-bahan` | - | - | `features/bahan-baku/api.ts` |
| GET | `/bahanbaku/:id` | authPengguna | `read-bahan` | `{ data, success }` | `id` | `features/bahan-baku/api.ts` |
| PUT | `/bahanbaku/:id` | authPengguna | `update-bahan` | - | - | `features/bahan-baku/api.ts` |
| DELETE | `/bahanbaku/:id` | authPengguna | `delete-bahan` | - | - | `features/bahan-baku/api.ts` |

#### `/diskon`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/diskon` | authPengguna | - | `{ data }` | `id` | 3 file |
| POST | `/diskon` | authPengguna | `create-diskon` | - | - | 1 file |
| PUT | `/diskon/:id` | authPengguna | `update-diskon` | - | - | 1 file |
| DELETE | `/diskon/:id` | authPengguna | `delete-diskon` | - | - | 1 file |

#### `/inventory`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/inventory` | authPengguna | `read-inventory`, `read-inventory-gudang`, atau `read-inventory-outlet` | `{ count, data, success }` | `id` | `features/inventaris/api.ts` |
| POST | `/inventory` | authPengguna | `create-inventory` | - | - | `features/inventaris/api.ts` |
| PATCH | `/inventory/:id/minimum-stok` | authPengguna | `update-inventory-minimum` | - | - | `features/inventaris/api.ts` |
| POST | `/inventory/:id/opname` | authPengguna | `opname-inventory` | - | - | `features/inventaris/api.ts` |

#### `/jadwalshift`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/jadwalshift` | authPengguna | - | `{ data, message, success }` | `id` | 2 file |
| POST | `/jadwalshift` | authPengguna | - | - | - | 1 file |
| PUT | `/jadwalshift/:id` | authPengguna | - | - | - | 1 file |
| DELETE | `/jadwalshift/:id` | authPengguna | - | - | - | 1 file |
| POST | `/jadwalshift/bulk` | authPengguna | - | - | - | 1 file |

#### `/jurnalstok`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/jurnalstok` | authPengguna | `read-jurnal-stok` | `{ data }` | `_id`, `_id` bersarang | `features/jurnal-stok/api.ts` (query `locationID` untuk lingkup satu lokasi; diabaikan backend, `temuan.md` butir 20) |

#### `/kategori`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/kategori` | authPengguna | `read-kategori` | `{ data }` | `_id`, `_id` bersarang, `__v` | `features/kategori/api.ts` |
| POST | `/kategori` | authPengguna | `create-kategori` | - | - | `features/kategori/api.ts` |
| PUT | `/kategori/:id` | authPengguna | `update-kategori` | - | - | `features/kategori/api.ts` |
| DELETE | `/kategori/:id` | authPengguna | `delete-kategori` | - | - | `features/kategori/api.ts` |

#### `/laporan`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/laporan/laba-rugi` | authPengguna | - | `{ data, message, success }` | - | 2 file |

#### `/location`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/location` | authPengguna | `read-location` | `{ data, success }` | `id` | `features/inventaris/api.ts`, 1 file halaman lama |
| POST | `/location` | authPengguna | `create-location` | - | - | 1 file |
| GET | `/location/current` | authPengguna | `read-location` | `{ data, success }` | `id` | `features/inventaris/api.ts` |

#### `/metodepembayaran`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/metodepembayaran` | authPengguna | - | `{ data }` | `id` | 2 file |
| POST | `/metodepembayaran` | authPengguna | `create-metode-pembayaran` | - | - | 1 file |
| GET | `/metodepembayaran/:id` | authPengguna | - | `{ data }` | `id` | 1 file |
| PUT | `/metodepembayaran/:id` | authPengguna | `update-metode-pembayaran` | - | - | 1 file |
| DELETE | `/metodepembayaran/:id` | authPengguna | `delete-metode-pembayaran` | - | - | 1 file |

#### `/pajak`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pajak` | authPengguna | - | `{ data, success }` | `_id` | 2 file |
| POST | `/pajak` | authPengguna | - | - | - | 1 file |
| PUT | `/pajak/:id` | authPengguna | - | - | - | 1 file |
| DELETE | `/pajak/:id` | authPengguna | - | - | - | 1 file |

#### `/pelanggan`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pelanggan` | authPengguna | - | `{ data }` | `id` | 3 file |
| POST | `/pelanggan` | authPengguna | `create-pelanggan` | - | - | 1 file |
| PUT | `/pelanggan/:id` | authPengguna | `update-pelanggan` | - | - | 1 file |
| DELETE | `/pelanggan/:id` | authPengguna | `delete-pelanggan` | - | - | 1 file |

#### `/pembayaran`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pembayaran` | authPengguna | `read-pembayaran` | `{ data }` | `id` | 1 file |
| POST | `/pembayaran` | authPengguna | `create-pembayaran` | - | - | 1 file |

#### `/pengajuanstok`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pengajuanstok` | authPengguna | `read-pengajuan-stok` | `{ data, success }` | `id` | `features/pengajuan-stok/api.ts` (query `status`, `locationID`) |
| POST | `/pengajuanstok` | authPengguna | `create-pengajuan-stok` | - | - | `features/pengajuan-stok/api.ts` |
| GET | `/pengajuanstok/:id` | authPengguna | `read-pengajuan-stok` | `{ data, success }` | `id` | `features/pengajuan-stok/api.ts` |
| PUT | `/pengajuanstok/:id` | authPengguna | `update-pengajuan-stok` | - | - | `features/pengajuan-stok/api.ts` |
| PATCH | `/pengajuanstok/:id/approve` | authPengguna | `approve-pengajuan-stok` | - | - | `features/pengajuan-stok/api.ts` |
| PATCH | `/pengajuanstok/:id/reject` | authPengguna | `reject-pengajuan-stok` | - | - | `features/pengajuan-stok/api.ts` |
| PATCH | `/pengajuanstok/:id/submit` | authPengguna | `update-pengajuan-stok` | - | - | `features/pengajuan-stok/api.ts` |

#### `/pengguna`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pengguna` | authPengguna | `read-pengguna` | `{ data, message, total }` | `id` | `features/pengguna/api.ts`, 3 file halaman lama |
| GET | `/pengguna/:id` | authPengguna | `read-pengguna` | `{ data, message }` | `id` | 1 file |
| PUT | `/pengguna/:id` | authPengguna | `update-pengguna` | - | - | `features/pengguna/api.ts`, 1 file halaman lama |
| DELETE | `/pengguna/:id` | authPengguna | `delete-pengguna` | - | - | `features/pengguna/api.ts` |
| POST | `/pengguna/pin-login` | authAkun | - | - | - | 1 file |
| POST | `/pengguna/pin-logout` | authPengguna | - | - | - | 1 file |
| POST | `/pengguna/pin-refresh` | public | - | - | - | 2 file (lewat `fetch`: `lib/apiClient.ts` dan `components/providers/session-provider.tsx`) |
| POST | `/pengguna/register-pengguna` | authPengguna | `create-pengguna` | - | - | `features/pengguna/api.ts` |

#### `/penjualan`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/penjualan` | authPengguna | `read-penjualan` | `{ data }` | `id`, `_id` bersarang | 1 file |
| POST | `/penjualan` | authPengguna | `create-penjualan` | - | - | 1 file |
| GET | `/penjualan/:id` | authPengguna | `read-penjualan` | `{ data }` | `id`, `_id` bersarang | 2 file |
| PUT | `/penjualan/:id` | authPengguna | `update-penjualan` | - | - | 2 file |
| DELETE | `/penjualan/:id` | authPengguna | `delete-penjualan` | - | - | 1 file |

#### `/permission`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/permission` | authEither | - | `{ data, message }` | `_id`, `__v` | `features/role/api.ts` |

#### `/polaroster`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/polaroster` | authPengguna | - | `{ data, message, success }` | `id` | 4 file |
| POST | `/polaroster` | authPengguna | - | - | - | 1 file |
| PUT | `/polaroster/:id` | authPengguna | - | - | - | 1 file |
| DELETE | `/polaroster/:id` | authPengguna | - | - | - | 1 file |

#### `/produk`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/produk` | authPengguna | `read-produk` atau `akses-pos` | `{ data, success }` | `_id` | `features/produk/api.ts` |
| POST | `/produk` | authPengguna | `create-produk` | - | - | `features/produk/api.ts` |
| GET | `/produk/:id` | authPengguna | `read-produk` atau `akses-pos` | `{ data, success }` | `_id` | `features/produk/api.ts` |
| PUT | `/produk/:id` | authPengguna | `update-produk` | - | - | `features/produk/api.ts` |
| DELETE | `/produk/:id` | authPengguna | `delete-produk` | - | - | `features/produk/api.ts` |

#### `/produkpajak`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| POST | `/produkpajak` | authPengguna | - | - | - | 1 file |
| GET | `/produkpajak/:targetid` | authPengguna | - | - | - | 1 file |
| DELETE | `/produkpajak/:id` | authPengguna | - | - | - | 1 file |

#### `/role`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/role` | authPengguna | `read-role` | `{ data, message, total }` | `id` | `features/role/api.ts` |
| POST | `/role` | authPengguna | `create-role` | - | - | `features/role/api.ts` |
| GET | `/role/:id` | authPengguna | `read-role` | `{ data, message }` | `id` | `features/role/api.ts` |
| PUT | `/role/:id` | authPengguna | `update-role` | - | - | `features/role/api.ts` |
| DELETE | `/role/:id` | authPengguna | `delete-role` | - | - | `features/role/api.ts` |

#### `/sesibooking`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/sesibooking` | authPengguna | `read-booking` | `{ data }` | - | 2 file |
| POST | `/sesibooking` | authPengguna | `create-booking` | - | - | 1 file |

#### `/shift`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/shift` | authPengguna | - | 500 | - | 5 file |
| POST | `/shift` | authPengguna | - | - | - | 1 file |
| PUT | `/shift/:id` | authPengguna | - | - | - | 1 file |
| DELETE | `/shift/:id` | authPengguna | - | - | - | 1 file |

#### `/stockopname`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/stockopname` | authPengguna | `read-stock-opname` | - | - | `features/stock-opname/api.ts` (query `status` dan `locationID`, divalidasi `validateOpnameQuery` di service; bentuk item di 3.3) |
| POST | `/stockopname` | authPengguna | `create-stock-opname` | - | - | `features/stock-opname/api.ts` |
| GET | `/stockopname/:id` | authPengguna | `read-stock-opname` | - | - | `features/stock-opname/api.ts` |
| PATCH | `/stockopname/:id/approve` | authPengguna | `review-stock-opname` | - | - | `features/stock-opname/api.ts` |
| PATCH | `/stockopname/:id/cancel` | authPengguna | `review-stock-opname` | - | - | `features/stock-opname/api.ts` |
| PATCH | `/stockopname/:id/items` | authPengguna | `submit-stock-opname` | - | - | `features/stock-opname/api.ts` |
| PATCH | `/stockopname/:id/reject` | authPengguna | `review-stock-opname` | - | - | `features/stock-opname/api.ts` |
| PATCH | `/stockopname/:id/submit` | authPengguna | `submit-stock-opname` | - | - | `features/stock-opname/api.ts` |
| GET | `/stockopname/adjustments` | authPengguna | `read-stock-adjustment` | `{ count, data, success }` | `id` | `features/stock-adjustment/api.ts` |
| GET | `/stockopname/adjustments/:id` | authPengguna | `read-stock-adjustment` | `{ data, success }` | `id` | `features/stock-adjustment/api.ts` |

#### `/tarif`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/tarif` | authPengguna | - | `{ data }` | `id` | 1 file |
| POST | `/tarif` | authPengguna | `create-tarif` | - | - | 1 file |
| GET | `/tarif/:id` | authPengguna | - | `{ data }` | `id` | 1 file |
| PUT | `/tarif/:id` | authPengguna | `update-tarif` | - | - | 1 file |
| DELETE | `/tarif/:id` | authPengguna | `delete-tarif` | - | - | 1 file |

#### `/tipeaset`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/tipeaset` | authPengguna | - | `{ data }` | `id` | 5 file |
| POST | `/tipeaset` | authPengguna | `create-tipe-aset` | - | - | 1 file |
| GET | `/tipeaset/:id` | authPengguna | - | `{ data }` | `id` | 1 file |
| PUT | `/tipeaset/:id` | authPengguna | `update-tipe-aset` | - | - | 1 file |
| DELETE | `/tipeaset/:id` | authPengguna | `delete-tipe-aset` | - | - | 1 file |

#### `/transferstok`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/transferstok` | authPengguna | `read-transfer-stok` | `{ count, data, success }` | `id` | `features/transfer-stok/api.ts` (query `status` dan `locationID` dikirim web tetapi diabaikan backend, `temuan.md` butir 33) |
| POST | `/transferstok` | authPengguna | `create-transfer-stok` | - | - | `features/transfer-stok/api.ts` |
| GET | `/transferstok/:id` | authPengguna | `read-transfer-stok` | `{ data, success }` | `id` | `features/transfer-stok/api.ts` |
| PUT | `/transferstok/:id` | authPengguna | `create-transfer-stok` | - | - | `features/transfer-stok/api.ts` |
| PATCH | `/transferstok/:id/batal` | authPengguna | `cancel-transfer-stok` | - | - | `features/transfer-stok/api.ts` |
| PATCH | `/transferstok/:id/kirim` | authPengguna | `approve-transfer-stok` | - | - | `features/transfer-stok/api.ts` |
| PATCH | `/transferstok/:id/terima` | authPengguna | `receive-transfer-stok` | - | - | `features/transfer-stok/api.ts` |

### 3.2 Status sampel GET yang tidak berhasil

- `GET /bahan-baku`: 404 Not Found (route tidak ada di backend; frontend berhenti memanggilnya di `aab26f3`)
- `GET /shift`: 500 Cannot access 'data' before initialization

### 3.3 Bentuk item respons GET

Kunci item pertama (atau objek detail) pada sampel respons. Objek bertingkat ditulis `nama{kunci}`, array ditulis `nama[]`.

- `GET /absensi/monitoring`: daftar[], ringkasan{belumAbsen, sudahAbsen, totalStaf}, tanggal
- `GET /akunkas`: createdAt, id, keterangan, namaAkun, nomorAkun, saldo, status, tenantID, tipeAkun, updatedAt
- `GET /aset`: createdAt, dataAset{deskripsi, id, namaTipeAset}, id, namaAset, status, tenantID, updatedAt
- `GET /aset/:param`: createdAt, dataAset{deskripsi, id, namaTipeAset}, id, namaAset, status, tenantID, updatedAt
- `GET /bahanbaku`: availableUnits[], createdAt, id, namaBahan, satuan, tenantID, updatedAt
- `GET /bahanbaku/:param`: availableUnits[], createdAt, id, namaBahan, satuan, tenantID, updatedAt
- `GET /diskon`: bisaDigabung, cakupan, createdAt, id, namaDiskon, nilai, status, tenantID, tipe, updatedAt
- `GET /inventory`: createdAt, id, isStokKritis, item{id, kategori, nama, satuan, tipeItem}, lokasi{id, nama, tipe}, stok, stokMinimum, tenantID, updatedAt (dari `mappers/inventoryMapper.js` backend `f27f093`: `item.kategori` berisi `tipe` barang inventory; `isStokKritis` hanya true bila `stokMinimum` lebih dari 0 dan stok tidak melebihinya, sehingga `stokMinimum` 0 berarti tidak dipantau. Query yang dibaca service: `locationID`, `kategori` (dicocokkan dengan `BarangInventory.tipe`), dan `search`; tanpa `locationID` mengirim stok seluruh lokasi tenant. Respons `POST /inventory` kini ter-populate dan berbentuk sama)
- `GET /jadwalshift`: catatan, id, isLibur, karyawan{id, namaLengkap, role}, shift{id, isLintasHari, jamMasuk, jamPulang, namaShift, status}, tanggalKerja
- `GET /jurnalstok`: _id, alasan, bahanBakuID{_id, namaBahan, satuan}, createdAt, dicatatOleh{_id, nama}, jumlah, keterangan, locationID{_id, nama, tipe}, tanggal, tenantID, tipeKoreksi, updatedAt
- `GET /kategori`: __v, _id, createdAt, keterangan, kodeKategori, namaKategori, tenantID{_id, namaToko}, updatedAt
- `GET /laporan/laba-rugi`: tanggal, totalBebanOperasional, totalDiskon, totalHPP, totalLabaBersih, totalLabaKotor, totalOmzet, totalPenjualanKotor
- `GET /location`: alamat, createdAt, id, koordinat{coordinates, type}, nama, radiusAbsen, tenantID, tipe, updatedAt
- `GET /location/current`: alamat, createdAt, id, koordinat{coordinates, type}, nama, radiusAbsen, tenantID, tipe, updatedAt
- `GET /metodepembayaran`: akunKas{id, namaAkun, nomorAkun}, createdAt, id, isActive, kategori, namaPembayaran, tenantID, updatedAt
- `GET /metodepembayaran/:param`: akunKas{id, namaAkun, nomorAkun}, createdAt, id, isActive, kategori, namaPembayaran, tenantID, updatedAt
- `GET /pajak`: _id, createdAt, modelPerhitungan, namaPajak, prioritas, statusPajak, tarifPajak, tenantID, tipePajak, updatedAt
- `GET /pelanggan`: alamat, createdAt, email, id, namaPelanggan, nomorHp, poinLoyalitas, tenantID, tipePelanggan, updatedAt
- `GET /pembayaran`: akunKasID, catatan, createdAt, gatewayPaymentID, id, jumlahBayar, metodePembayaranID, noReferensi, penjualanID, qrString, status, tanggalBayar, tenantID, updatedAt
- `GET /pengajuanstok`: catatan, catatanPenolakan, createdAt, dariLokasi{id, nama, tipe}, dimintaOleh{id, nama}, disetujuiOleh, ditolakOleh, id, items[], jenisPengajuan, keLokasi{id, nama, tipe}, nomorPengajuan, status, tanggalApprove, tanggalKebutuhan, tanggalReject, tenantID, transferStokID, updatedAt (query yang dibaca service: `status`, `jenisPengajuan`, dan `locationID` untuk lokasi asal atau tujuan; status dibatasi menurut izin, `temuan.md` butir 21). Arah: `dariLokasi` adalah gudang asal barang dan `keLokasi` outlet peminta (`temuan.md` butir 23); `GET /pengajuanstok/:param` menambahkan `items[].stokGudangSaatIni`, yaitu stok item di `dariLocationID`
- `GET /pengajuanstok/:param`: catatan, catatanPenolakan, createdAt, dariLokasi{id, nama, tipe}, dimintaOleh{id, nama}, disetujuiOleh, ditolakOleh, id, items[], jenisPengajuan, keLokasi{id, nama, tipe}, nomorPengajuan, status, tanggalApprove, tanggalKebutuhan, tanggalReject, tenantID, transferStokID, updatedAt
- `GET /pengguna`: aksesType[], fotoKaryawan, id, nama, nomorHp, role, roleID, status
- `GET /pengguna/:param`: aksesType[], fotoKaryawan, id, nama, nomorHp, role, roleID, status
- `GET /penjualan`: createdAt, dataPelanggan{_id, namaPelanggan, nomorHp, tipePelanggan}, dataPengguna{_id, nama}, diskonGlobal[], id, itemPenjualan[], jatuhTempo, jenisPenjualan, jenisTransaksi, jumlahDiskonTransaksi, jumlahPajakTransaksi, keterangan, locationID, noReferensi, pajakTransaksi[], sisaTagihan, statusBayar, statusPenjualan, tanggalTransaksi, tenantID, totalDibayar, totalHargaProduk, totalTagihan, updatedAt
- `GET /penjualan/:param`: createdAt, dataPelanggan{_id, namaPelanggan, tipePelanggan}, dataPengguna{_id, nama}, diskonGlobal[], id, itemPenjualan[], jatuhTempo, jenisPenjualan, jenisTransaksi, jumlahDiskonTransaksi, jumlahPajakTransaksi, keterangan, locationID, noReferensi, pajakTransaksi[], sisaTagihan, statusBayar, statusPenjualan, tanggalTransaksi, tenantID, totalDibayar, totalHargaProduk, totalTagihan, updatedAt
- `GET /permission`: __v, _id, deskripsi, grup, nama
- `GET /polaroster`: detailSiklus[], dibuatPada, id, keterangan, namaPola, siklusHari
- `GET /produk`: _id, createdAt, gambarProduk, hargaDasar, hargaJual, isUnlimitedStok, kategori, kategoriID, keterangan, namaProduk, pajakList[], resep[], stok, updatedAt
- `GET /produk/:param`: _id, createdAt, gambarProduk, hargaDasar, hargaJual, isUnlimitedStok, kategori, kategoriID, keterangan, namaProduk, pajakList[], resep[], stok, updatedAt
- `GET /role`: deskripsi, id, level, namaRole, permissions[]
- `GET /role/:param`: deskripsi, id, level, namaRole, permissions[]
- `GET /stockopname` dan `GET /stockopname/:param` (dari `mappers/stockOpnameMapper.js`, bukan dari sampel cache kontrak; sekurang-kurangnya): catatan, catatanReview, id, items[] (itemId, namaSnapshot, satuanSnapshot, qtySystemSnapshot, qtyPhysical, varianceSnapshot, adaSelisih, catatanItem), lokasi{id, nama, tipe}, nomorOpname, pic{id, nama}, reviewer, status, stockAdjustment, tanggal (`qtyPhysical` dan `varianceSnapshot` null selama item belum dihitung, dan `adaSelisih` false untuk item itu; mapper backend `f27f093` baris 90 dan 93)
- `GET /stockopname/adjustments` (dari `mappers/stockOpnameMapper.js` backend `f27f093`, bukan dari sampel cache kontrak): alasan, createdAt, id, items[], lokasi{id, nama, tipe}, nomorAdjustment, pic{id, nama}, referenceID{id, nomorOpname, tanggal}, referenceType, tanggal, tenantID, updatedAt. `referenceID` berisi objek hasil populate (`stockOpnameService` baris 557), null untuk koreksi manual atau dokumen opname yang sudah tidak ada; `referenceType` bernilai `STOCK_OPNAME` atau `MANUAL_CORRECTION`. Query `referenceType` dan `locationID` divalidasi `validateAdjustmentQuery` di service
- `GET /stockopname/adjustments/:param`: seperti daftar, dengan lokasi{alamat, id, nama, tipe} dan referenceID{id, nomorOpname, tanggal, picID} (`picID` tidak dipopulate, `stockOpnameService` baris 581). Setiap item: itemId, bahanBakuID, barangInventoryID, namaSnapshot, satuanSnapshot, qtySnapshot (stok saat draf dibuat), qtyCurrent (stok saat approval), qtyPhysical, dan qtyDifference (qtyPhysical dikurangi qtyCurrent); keempat kuantitas wajib di model
- `GET /tarif`: basisPerhitungan, createdAt, dataAset[], durasiMinimum, harga, hariAktif[], id, isActive, jamMulai, jamSelesai, namaTarif, prioritas, tenantID, updatedAt
- `GET /tarif/:param`: basisPerhitungan, createdAt, dataAset[], durasiMinimum, harga, hariAktif[], id, isActive, jamMulai, jamSelesai, namaTarif, prioritas, tenantID, updatedAt
- `GET /tipeaset`: createdAt, dataTarif[], deskripsi, id, namaTipeAset, tenantID, updatedAt
- `GET /tipeaset/:param`: createdAt, dataTarif[], deskripsi, id, namaTipeAset, tenantID, updatedAt
- `GET /transferstok`: createdAt, dariLokasi{id, nama, tipe}, id, items[], keLokasi{id, nama, tipe}, nomorTransfer, penerima{id, nama}, pengajuanStokID, pengirim{id, nama}, status, tanggalKirim, tanggalTerima, tenantID, updatedAt (dari `mappers/transferStokMapper.js` baris 49 sampai 75: setiap item berisi bahanBaku{id, namaBahan, satuan}, qtyKirim, qtyTerima, selisih yaitu qtyTerima dikurangi qtyKirim, dan catatanItem; qtyKirim dan qtyTerima dalam satuan dasar bahan baku. Tidak ada `bahanBakuID` di respons (`temuan.md` butir 28), dan `bahanBaku` null bila master bahan bakunya terhapus, karena populate menghasilkan null dan id-nya ikut hilang (butir 29). Service tidak membaca query apa pun, butir 33)
- `GET /transferstok/:param`: createdAt, dariLokasi{id, nama, tipe}, id, items[], keLokasi{id, nama, tipe}, nomorTransfer, penerima{id, nama}, pengajuanStokID, pengirim{id, nama}, status, tanggalKirim, tanggalTerima, tenantID, updatedAt (bentuk item sama dengan daftar)
