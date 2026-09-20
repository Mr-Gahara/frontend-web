# Kontrak API Backend untuk Frontend Web

Dokumen ini adalah sumber kebenaran kontrak antara frontend-web dan backend-js: endpoint yang dipanggil frontend, token dan permission yang dibutuhkan, bentuk respons, serta aturan payload setiap operasi tulis. Untuk kebutuhan frontend web, dokumen ini menggantikan tabel endpoint di README backend, yang terbukti tertinggal dari kode.

## 1. Acuan dan metodologi

| Repo | Commit acuan |
|---|---|
| backend-js | 4310d1c (2026-09-18) fix(pengguna): hapus pengguna tidak lagi gagal acak dan riwayat absensi dijaga |
| frontend-web | 668951d (2026-09-18) docs(kontrak): kontrak API backend untuk frontend web berbasis bukti |

Bagian 3 sampai 5 dan Lampiran A dibangkitkan dari bukti, bukan ditulis tangan:

| Sumber | Cara | Menghasilkan |
|---|---|---|
| `routes/*.js` backend | Analisis statis rantai `router`, termasuk `router.route().get().post()`, dengan urutan `router.use` diperhitungkan | Method, path, auth, dan permission setiap route |
| Kode frontend (`app`, `components`, `hooks`, `lib`) | Analisis statis setiap `apiClient.<method>(...)` | Endpoint yang benar-benar dipanggil frontend |
| Backend lokal yang berjalan | Panggilan GET dengan token pengguna web; tidak ada POST, PUT, PATCH, maupun DELETE | Bentuk respons yang sebenarnya |
| Route, controller, `validators/`, dan `models/` backend | Penelusuran route ke controller ke validator, dengan skema model sebagai cadangan | Aturan payload operasi tulis |

Keterbatasan:

- Validasi yang hanya ada di service tidak tertangkap; operasi seperti itu tercatat memakai skema model.
- Daftar field pada bagian 4 berasal dari validator, sedangkan validator hanya memeriksa dan tidak membuang field lain. Service dapat memakai field di luar daftar itu, seperti `locationID` pada `POST /bahanbaku`. Sebelum sebuah field dihapus dari payload frontend, periksa dulu pemakaiannya di service.
- Bentuk respons operasi tulis tidak diambil dengan memanggil endpoint, agar data tidak berubah.
- Analisis statis route hanya membaca argumen pertama `checkPermission`. Route yang menerima salah satu dari beberapa izin perlu dikoreksi manual; `GET /produk` dan `GET /produk/:id` (`read-produk` atau `akses-pos`) sudah dikoreksi pada 20 September 2026.
- Analisis statis frontend hanya menangkap panggilan `apiClient`. Untuk modul yang sudah dipindah ke `features/`, pemanggilan terpusat di `features/<modul>/api.ts`, sehingga kolom "Dipakai di" di bagian 3.1 tidak lagi mencerminkan jumlah halaman pemakai. Bagian 5 untuk modul itu diperbarui manual.
- Dokumen ini berlaku untuk commit acuan di atas. Bila backend berubah, bagian 3 sampai 5 dan Lampiran A perlu dibangkitkan ulang.

## 2. Aturan umum

### 2.1 Alamat dan pembentukan path

- Browser selalu memanggil path relatif `/api/...`. Next.js meneruskannya ke backend lewat rewrite di `next.config.ts` (`BACKEND_URL`, default `127.0.0.1` port 4000).
- Mount path backend dibentuk dari nama file route: akhiran `Route.js` atau `Routes.js` dibuang, lalu di-lowercase (`routes/index.js`). Contoh: `tipeAsetRoute.js` menjadi `/api/tipeaset`, `produkRoutes.js` menjadi `/api/produk`.
- Express tidak membedakan huruf besar kecil, sehingga `/tipeAset` dan `/tipeaset` sama-sama berjalan. Frontend memakai bentuk kanonik lowercase yang didefinisikan di satu modul konstanta endpoint.

### 2.2 Token

| Token | Didapat dari | Masa berlaku | Dipakai untuk |
|---|---|---|---|
| Akun | `POST /api/akun/auth/login` | 15 menit | Login PIN, endpoint `/akun`, pembuatan tenant, panel admin |
| Pengguna (web) | `POST /api/pengguna/pin-login` dengan `loginType: "web"` | 1 jam | Seluruh operasi toko |

- Keduanya dikirim sebagai header `Authorization: Bearer <token>`.
- Refresh akun lewat `POST /api/akun/auth/refreshtoken`, refresh pengguna web lewat `POST /api/pengguna/pin-refresh`. Keduanya membaca refresh token dari cookie httpOnly, sehingga request wajib menyertakan cookie.
- Hanya satu sesi web aktif per pengguna. Login di tempat lain membuat sesi lama dijawab 401.
- Kolom Auth di bagian 3 menunjukkan middleware yang diperiksa backend: `authAkun`, `authPengguna`, `authEither`, dan `adminOnly`.

### 2.3 Format error dan kode status

Semua error berbentuk `{ status: "error", message, errors? }`; `errors` hanya ada pada sebagian error 4xx.

| Status | Arti | Tindakan frontend |
|---|---|---|
| 400 | Payload tidak valid | Tampilkan `errors` atau `message` di form |
| 401 | Token kedaluwarsa atau sesi diambil alih | Refresh sekali; bila gagal, kembali ke login |
| 403 | Izin ditolak, pengguna nonaktif, atau tenant/akun dibekukan | Jangan refresh; tampilkan pesan akses ditolak |
| 404 | Data tidak ada atau id tidak valid | Tampilkan keadaan tidak ditemukan |
| 409 | Duplikat atau data masih dipakai | Tampilkan pesan konflik. Tidak semua modul memakainya: duplikat kategori dijawab 400 (bagian 6 butir 14) |
| 429 | Terlalu banyak percobaan login | Tampilkan waktu tunggu |

Login PIN untuk aplikasi dapat menjawab 200 dengan `success: false` (perangkat menunggu persetujuan). Web tidak terdampak, tetapi lapisan API tetap memeriksa `success` bila ada.

### 2.4 Envelope respons

Semua respons GET yang sukses memuat `data`. Kunci lain tidak seragam antarmodul (`success`, `message`, `count`, `total`). Lapisan API frontend mengambil `data` sebagai isi dan menyeragamkan `count` atau `total` menjadi satu nama. Kolom Envelope di bagian 3 menunjukkan kunci yang benar-benar dikirim. Pembukaan envelope ini, dan normalisasi identitas di 2.5, hanya dilakukan `lib/api/client.ts`. Halaman yang masih memakai klien lama `lib/apiClient.ts` menerima respons mentah, termasuk `_id`.

### 2.5 Identitas dan field referensi

- Sebagian modul memakai `id`, sebagian `_id`, dan sebagian mencampur keduanya (`id` di tingkat atas, `_id` di objek bertingkat). Beberapa masih membawa `__v`. `lib/api/client.ts` menormalkan `_id` menjadi `id` secara rekursif dan membuang `__v`, sehingga halaman yang memakai lapisan itu hanya mengenal `id`. Halaman yang masih memakai klien lama menerima `_id` apa adanya (2.4).
- Nama field referensi tidak selalu mencerminkan isinya. Contoh: `bahanBakuID` dan `locationID` di jurnal stok berisi objek hasil populate, dan `dataAset` di aset berisi tipe aset. Tipe frontend mengikuti bentuk nyata di bagian 3.3, bukan nama field.

### 2.6 Field yang diisi server

Backend mengisi sendiri field berikut dari token pengguna; frontend tidak mengirimnya:

- `tenantID` pada hampir semua operasi create.
- `dataPengguna` (sesi booking), `dimintaOleh` (pengajuan stok), `picID` (stock opname), `pengirimID` (transfer stok), dan `dicatatOleh` (pembelian stok).

Daftar "Wajib dari klien" di bagian 4 sudah mengecualikan field ini.

## 3. Endpoint yang dipakai frontend

Saat kontrak dibangkitkan, frontend memanggil 126 endpoint unik; 121 di antaranya didefinisikan backend. Backend memiliki 246 route secara keseluruhan (Lampiran A).

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
| POST | `/akun/auth/logout` | public | - | - | - | 1 file |

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
| GET | `/bahan-baku` | tidak ada di backend | - | - | - | 3 file |
| POST | `/bahan-baku` | tidak ada di backend | - | - | - | 1 file |
| GET | `/bahan-baku/:param` | tidak ada di backend | - | - | - | 1 file |
| PUT | `/bahan-baku/:param` | tidak ada di backend | - | - | - | 1 file |
| DELETE | `/bahan-baku/:param` | tidak ada di backend | - | - | - | 1 file |

#### `/bahanbaku`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/bahanbaku` | authPengguna | `read-bahan` | `{ data, success }` | `id` | 5 file |
| POST | `/bahanbaku` | authPengguna | `create-bahan` | - | - | 1 file |
| GET | `/bahanbaku/:id` | authPengguna | `read-bahan` | `{ data, success }` | `id` | 1 file |
| PUT | `/bahanbaku/:id` | authPengguna | `update-bahan` | - | - | 1 file |
| DELETE | `/bahanbaku/:id` | authPengguna | `delete-bahan` | - | - | 1 file |

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
| GET | `/inventory` | authPengguna | `read-inventory` | `{ count, data, success }` | `id` | 3 file |
| POST | `/inventory` | authPengguna | `create-inventory` | - | - | 1 file |
| PATCH | `/inventory/:id/minimum-stok` | authPengguna | `update-inventory-minimum` | - | - | 2 file |
| POST | `/inventory/:id/opname` | authPengguna | `opname-inventory` | - | - | 2 file |

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
| GET | `/jurnalstok` | authPengguna | `read-jurnal-stok` | `{ data }` | `_id`, `_id` bersarang | 2 file |

#### `/kategori`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/kategori` | authPengguna | `read-kategori` | `{ data }` | `_id`, `_id` bersarang, `__v` | 3 file |
| POST | `/kategori` | authPengguna | `create-kategori` | - | - | 1 file |
| PUT | `/kategori/:id` | authPengguna | `update-kategori` | - | - | 1 file |
| DELETE | `/kategori/:id` | authPengguna | `delete-kategori` | - | - | 1 file |

#### `/laporan`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/laporan/laba-rugi` | authPengguna | - | `{ data, message, success }` | - | 2 file |

#### `/location`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/location` | authPengguna | `read-location` | `{ data, success }` | `id` | 8 file |
| POST | `/location` | authPengguna | `create-location` | - | - | 1 file |
| GET | `/location/current` | authPengguna | `read-location` | `{ data, success }` | `id` | 3 file |

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
| GET | `/pengajuanstok` | authPengguna | `read-pengajuan-stok` | `{ data, success }` | `id` | 2 file |
| POST | `/pengajuanstok` | authPengguna | `create-pengajuan-stok` | - | - | 1 file |
| GET | `/pengajuanstok/:id` | authPengguna | `read-pengajuan-stok` | `{ data, success }` | `id` | 3 file |
| PUT | `/pengajuanstok/:id` | authPengguna | `update-pengajuan-stok` | - | - | 1 file |
| PATCH | `/pengajuanstok/:id/approve` | authPengguna | `approve-pengajuan-stok` | - | - | 1 file |
| PATCH | `/pengajuanstok/:id/reject` | authPengguna | `reject-pengajuan-stok` | - | - | 1 file |
| PATCH | `/pengajuanstok/:id/submit` | authPengguna | `update-pengajuan-stok` | - | - | 1 file |

#### `/pengguna`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pengguna` | authPengguna | `read-pengguna` | `{ data, message, total }` | `id` | 5 file |
| GET | `/pengguna/:id` | authPengguna | `read-pengguna` | `{ data, message }` | `id` | 1 file |
| PUT | `/pengguna/:id` | authPengguna | `update-pengguna` | - | - | 3 file |
| DELETE | `/pengguna/:id` | authPengguna | `delete-pengguna` | - | - | 2 file |
| POST | `/pengguna/pin-login` | authAkun | - | - | - | 1 file |
| POST | `/pengguna/pin-logout` | authPengguna | - | - | - | 1 file |
| POST | `/pengguna/register-pengguna` | authPengguna | `create-pengguna` | - | - | 2 file |

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
| GET | `/permission` | authEither | - | `{ data, message }` | `_id`, `__v` | 4 file |

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
| GET | `/produk` | authPengguna | `read-produk` atau `akses-pos` | `{ data, success }` | `_id` | 3 file |
| POST | `/produk` | authPengguna | `create-produk` | - | - | 1 file |
| GET | `/produk/:id` | authPengguna | `read-produk` atau `akses-pos` | `{ data, success }` | `_id` | 1 file |
| PUT | `/produk/:id` | authPengguna | `update-produk` | - | - | 1 file |
| DELETE | `/produk/:id` | authPengguna | `delete-produk` | - | - | 1 file |

#### `/produkpajak`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| POST | `/produkpajak` | authPengguna | - | - | - | 1 file |
| GET | `/produkpajak/:targetid` | authPengguna | - | - | - | 1 file |
| DELETE | `/produkpajak/:id` | authPengguna | - | - | - | 1 file |

#### `/role`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/role` | authPengguna | `read-role` | `{ data, message, total }` | `id` | 5 file |
| POST | `/role` | authPengguna | `create-role` | - | - | 2 file |
| GET | `/role/:id` | authPengguna | `read-role` | `{ data, message }` | `id` | 1 file |
| PUT | `/role/:id` | authPengguna | `update-role` | - | - | 1 file |
| DELETE | `/role/:id` | authPengguna | `delete-role` | - | - | 1 file |

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
| POST | `/stockopname` | authPengguna | `create-stock-opname` | - | - | 2 file |
| GET | `/stockopname/:id` | authPengguna | `read-stock-opname` | - | - | 2 file |
| PATCH | `/stockopname/:id/approve` | authPengguna | `review-stock-opname` | - | - | 2 file |
| PATCH | `/stockopname/:id/cancel` | authPengguna | `review-stock-opname` | - | - | 2 file |
| PATCH | `/stockopname/:id/items` | authPengguna | `submit-stock-opname` | - | - | 2 file |
| PATCH | `/stockopname/:id/reject` | authPengguna | `review-stock-opname` | - | - | 2 file |
| PATCH | `/stockopname/:id/submit` | authPengguna | `submit-stock-opname` | - | - | 2 file |
| GET | `/stockopname/adjustments` | authPengguna | `read-stock-adjustment` | `{ count, data, success }` | `id` | 1 file |
| GET | `/stockopname/adjustments/:id` | authPengguna | `read-stock-adjustment` | `{ data, success }` | `id` | 1 file |

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
| GET | `/transferstok` | authPengguna | `read-transfer-stok` | `{ count, data, success }` | `id` | 3 file |
| POST | `/transferstok` | authPengguna | `create-transfer-stok` | - | - | 1 file |
| GET | `/transferstok/:id` | authPengguna | `read-transfer-stok` | `{ data, success }` | `id` | 3 file |
| PUT | `/transferstok/:id` | authPengguna | `create-transfer-stok` | - | - | 1 file |
| PATCH | `/transferstok/:id/batal` | authPengguna | `cancel-transfer-stok` | - | - | 1 file |
| PATCH | `/transferstok/:id/kirim` | authPengguna | `approve-transfer-stok` | - | - | 1 file |
| PATCH | `/transferstok/:id/terima` | authPengguna | `receive-transfer-stok` | - | - | 1 file |

### 3.2 Status sampel GET yang tidak berhasil

- `GET /bahan-baku`: 404 Not Found
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
- `GET /inventory`: createdAt, id, isStokKritis, item{id, nama, satuan, tipeItem}, lokasi{id, nama, tipe}, stok, stokMinimum, tenantID, updatedAt (query yang dibaca service: `locationID`, `kategori`, `search`; tanpa `locationID` mengirim stok seluruh lokasi tenant)
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
- `GET /pengajuanstok`: catatan, catatanPenolakan, createdAt, dariLokasi{id, nama, tipe}, dimintaOleh{id, nama}, disetujuiOleh, ditolakOleh, id, items[], jenisPengajuan, keLokasi{id, nama, tipe}, nomorPengajuan, status, tanggalApprove, tanggalKebutuhan, tanggalReject, tenantID, transferStokID, updatedAt
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
- `GET /stockopname/adjustments`: catatan, createdAt, id, items[], lokasi{id, nama, tipe}, nomorAdjustment, pic{id, nama}, stockOpnameID, tanggal, tenantID, updatedAt (`items` kosong pada sampel daftar; `catatan` dan `stockOpnameID` tidak dapat dipercaya, bagian 6 butir 18)
- `GET /stockopname/adjustments/:param`: catatan, createdAt, id, items[], lokasi{alamat, id, nama, tipe}, nomorAdjustment, pic{id, nama}, stockOpnameID, tanggal, tenantID, updatedAt (`catatan`, `stockOpnameID`, `items[].qtySebelum`, dan `items[].qtyAdjustment` tidak dapat dipercaya, bagian 6 butir 18)
- `GET /tarif`: basisPerhitungan, createdAt, dataAset[], durasiMinimum, harga, hariAktif[], id, isActive, jamMulai, jamSelesai, namaTarif, prioritas, tenantID, updatedAt
- `GET /tarif/:param`: basisPerhitungan, createdAt, dataAset[], durasiMinimum, harga, hariAktif[], id, isActive, jamMulai, jamSelesai, namaTarif, prioritas, tenantID, updatedAt
- `GET /tipeaset`: createdAt, dataTarif[], deskripsi, id, namaTipeAset, tenantID, updatedAt
- `GET /tipeaset/:param`: createdAt, dataTarif[], deskripsi, id, namaTipeAset, tenantID, updatedAt
- `GET /transferstok`: createdAt, dariLokasi{id, nama, tipe}, id, items[], keLokasi{id, nama, tipe}, nomorTransfer, penerima{id, nama}, pengajuanStokID, pengirim{id, nama}, status, tanggalKirim, tanggalTerima, tenantID, updatedAt
- `GET /transferstok/:param`: createdAt, dariLokasi{id, nama, tipe}, id, items[], keLokasi{id, nama, tipe}, nomorTransfer, penerima{id, nama}, pengajuanStokID, pengirim{id, nama}, status, tanggalKirim, tanggalTerima, tenantID, updatedAt

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
- Wajib dari klien: -
- Field lain yang dikenali: `nomorOpname`, `locationID`, `tanggal`, `reviewerID`, `status`, `items`, `catatan`, `catatanReview`, `stockAdjustmentID`
- Diisi server: `picID`

#### `PATCH /stockopname/:id/items`

- Aturan: tanpa validator, dibatasi skema `models/stockOpnameModel.js`
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
- Duplikat nama atau kode: 400 `{ errors: ["tenantID sudah digunakan di tenant ini"] }` tanpa `message`; field yang bentrok tidak disebut (bagian 6 butir 14)
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
- `kategoriID` hanya diperiksa formatnya, bukan keberadaannya (bagian 6 butir 13)
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
- Duplikat nama atau kode: 400 `{ errors: ["tenantID sudah digunakan di tenant ini"] }` tanpa `message`, sama seperti `POST /kategori` (bagian 6 butir 14)
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
- `resep` yang dikirim, termasuk array kosong, membuat stok dihitung ulang dari resep; resep kosong menjadikan stok 0. Kirim `resep` hanya bila perlu (bagian 6 butir 11)
- Nilai sah satuan resep: gram, ml, pcs, kg, liter
- `kategoriID` hanya diperiksa formatnya, bukan keberadaannya (bagian 6 butir 13)
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

## 5. Kebutuhan izin per halaman

Untuk setiap menu sidebar: gate yang dipakai saat ini, endpoint GET yang dipanggil `page.tsx` halamannya, dan permission yang diwajibkan backend untuk endpoint tersebut. Halaman yang memuat data lewat komponen terpisah ditandai untuk diperiksa manual. Baris pengguna, produk, kategori, bahan baku, stok, stock adjustment, jurnal stok, dan inventaris gudang diperbarui manual dari `IZIN_HALAMAN` setelah migrasi (20 September 2026); baris lain mencerminkan keadaan saat kontrak dibangkitkan.

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
| `/dashboard/outlet/inventaris/stok` | `read-location`, `read-inventory` | `/location`, `/inventory` | `read-location`, `read-inventory` | Sejalan |
| `/dashboard/outlet/inventaris/stockOpname` | - | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/outlet/inventaris/stockAdjustment` | `read-stock-adjustment` | `/stockopname/adjustments`, `/stockopname/adjustments/:id` | `read-stock-adjustment` | Sejalan |
| `/dashboard/outlet/inventaris/jurnalStok` | `read-jurnal-stok`, `read-location` | `/jurnalstok`, `/location/current` | `read-jurnal-stok`, `read-location` | Sejalan |
| `/dashboard/outlet/inventaris-suplai` | `read-inventory-outlet` | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/outlet/inventaris/pengajuanStok` | - | `/pengajuanstok` | `read-pengajuan-stok` | Tanpa gate, endpoint berizin |
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
| `/dashboard/gudang/stockOpname` | `read-stock-opname` | - | - | Data dimuat lewat komponen, periksa manual |
| `/dashboard/gudang/pengajuanStok` | `read-pengajuan-stok` | `/pengajuanstok` | `read-pengajuan-stok` | Sejalan |
| `/dashboard/gudang/transferStok` | `read-transfer-stok` | `/transferstok` | `read-transfer-stok` | Sejalan |
| `/dashboard/gudang/pengirimanStok` | `read-pengiriman-stok` | `/transferstok` | `read-transfer-stok` | Tidak sejalan |
| `/dashboard/gudang/jadwal` | - | `/pengguna`, `/shift`, `/polaroster`, `/jadwalshift` | `read-pengguna` | Tanpa gate, endpoint berizin |
| `/dashboard/gudang/pola-roster` | - | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/gudang/shift` | - | - | - | Tidak ada halaman (grup menu atau rute kosong) |
| `/dashboard/gudang/pengguna` | `read-pengguna`, `read-role` | `/pengguna`, `/role` | `read-pengguna`, `read-role` | Sejalan |
| `/dashboard/gudang/pengaturan` | - | - | - | Data dimuat lewat komponen, periksa manual |

## 6. Ketidakselarasan yang tercatat

Setiap butir di bawah sudah diverifikasi dari kode atau respons backend. Kolom Pemilik menunjukkan sisi yang perlu bertindak. Butir 11 sampai 18 diperiksa terhadap kode backend pada 19 sampai 20 September 2026, bukan terhadap commit acuan di bagian 1; nomor barisnya dapat bergeser bila backend berubah.

| No | Temuan | Bukti | Pemilik | Status |
|---|---|---|---|---|
| 1 | Frontend memanggil `/bahan-baku` sebagai percobaan pertama, lalu jatuh ke `/bahanBaku` | Lima panggilan tidak punya pasangan di backend; `GET /bahan-baku` dijawab 404 | Frontend | Dibuang pada Fase 2 |
| 2 | Gate menu sidebar tidak sejalan dengan permission endpoint halamannya | Bagian 5: grup inventaris memakai `read-inventory-outlet` dan `read-inventory-gudang` yang tidak diperiksa route mana pun; Pengiriman Stok memakai `read-pengiriman-stok` padahal endpoint mewajibkan `read-transfer-stok`; halaman Pengguna juga butuh `read-role` | Frontend | Gate diturunkan dari kebutuhan endpoint pada Fase 2 |
| 3 | Casing path di frontend tidak seragam (`/tipeAset`, `/stockopname`, `/metodepembayaran`) | Seluruhnya berjalan karena Express tidak membedakan huruf besar kecil | Frontend | Konstanta endpoint kanonik pada Fase 2 |
| 4 | Enam permission gate frontend tidak ada di seed (`read-shift-*`, `read-pola-roster-*`, `read-jadwal-shift-*`) | Gate dikomentari di `components/app-sidebar.tsx` | Backend | Catatan backend nomor 2 |
| 5 | Endpoint yang dipakai frontend tanpa `checkPermission` | Tulis: pajak, produk pajak, shift, pola roster, jadwal shift. Baca data sensitif: `GET /laporan/laba-rugi`, `GET /absensi/monitoring`. Baca data referensi transaksi (aset, diskon, metode pembayaran, pelanggan, tarif, tipe aset) perlu dikonfirmasi sebagai desain yang disengaja | Backend | Catatan backend nomor 2, diperluas |
| 6 | Permission sudah ada di seed tetapi tidak diperiksa route mana pun, antara lain `read-laporan`, `read-absensi`, `create-absensi`, `update-absensi`, `read-pelanggan` | Silang seed terhadap route | Backend | Memperkuat butir 5 |
| 7 | Delapan permission membership dipakai route tetapi tidak ada di seed | Route membership dan paket membership | Backend | Sudah tercatat di README backend (G5b) |
| 8 | `GET /api/shift` tanpa query string menjawab 500 `Cannot access 'data' before initialization` | Panggilan langsung ke backend lokal; frontend selalu mengirim query sehingga belum terdampak | Backend | Catatan backend berikutnya |
| 9 | README backend menyatakan validator memakai allowlist, tetapi penolakan field tak dikenal hanya ada di tenant, akun, transfer stok, inventory, absensi (absen pulang), pengajuan stok, dan lokasi | Grep pesan "tidak diizinkan" di `validators/` | Backend | Catatan dokumentasi backend |
| 10 | 22 operasi tulis tanpa validator; sebagian meneruskan `req.body` utuh ke service sementara skemanya memuat field sensitif seperti `status`, `disetujuiOleh`, dan `reviewerID` | Bagian 4 (operasi bertanda skema model) | Backend | Potensi mass assignment, perlu verifikasi di service sebelum dilaporkan sebagai bug |
| 11 | `PUT /produk/:id` memeriksa `if (payload.resep)`, sehingga `resep: []` menjadikan stok 0 dan produk tanpa resep tidak dapat dijual | `produkService` baris 185 dan 209, `inventoryService` sekitar baris 228, trace PUT | Backend | Laporan modul produk dan kategori; frontend hanya mengirim resep bila perlu |
| 12 | Hapus kategori tidak memeriksa produk yang memakainya | `kategoriService.delete` baris 109 sampai 115 | Backend | Laporan modul produk dan kategori; frontend mencegah hapus bila produk dapat dibaca |
| 13 | `kategoriID` produk hanya diperiksa formatnya | `produkValidator` baris 72 sampai 76 | Backend | Laporan modul produk dan kategori; form produk menolak kategori yang tidak ada |
| 14 | Duplikat kategori dijawab 400 dengan field `tenantID` | Trace `POST /api/kategori`; `kategoriService` baris 69 dan 101 | Backend | Laporan modul produk dan kategori; frontend menentukan field dari daftar kategori |
| 15 | Satuan resep produk (5) lebih sempit dari satuan bahan baku (7) | `produkValidator` baris 88, `bahanBakuValidator` | Backend | Laporan modul produk dan kategori; perlu keputusan |
| 16 | Cache daftar produk (TTL 120 detik) tidak dibersihkan saat kategori berubah | `produkService` baris 67 dan 118, `kategoriService` baris 64, 96, dan 113 | Backend | Laporan modul produk dan kategori |
| 17 | Detail produk mengirim `createdAt` dan `updatedAt` bernilai null | Cache kontrak `GET /produk/:param` | Backend | Laporan modul produk dan kategori |
| 18 | Mapper stock adjustment membaca `qtySebelum`, `qtyAdjustment`, `stockOpnameID`, dan `catatan`, padahal model menyimpan `qtyCurrent`, `qtyDifference`, `referenceID`, dan `alasan`; `referenceType` tidak dikirim. Akibatnya saldo sistem dan koreksi selalu 0, sedangkan sumber opname dan alasan selalu null | `mappers/stockOpnameMapper.js` baris 167, 169, 190, 192; `models/stockAdjustmentModel.js` (`qtyCurrent`, `qtyDifference`, `referenceType`); `stockOpnameService` baris 418 sampai 427; cache kontrak `GET /stockopname/adjustments/:param` (`qtySebelum` 0, `qtyPhysical` 35000, `qtyAdjustment` 0) | Backend | Laporan submodul stock adjustment; frontend menampilkan `-` lewat `features/stock-adjustment/tampilan.ts` |

## Lampiran A. Seluruh route backend

| Method | Path | Auth | Permission | Dipakai frontend | File route |
|---|---|---|---|---|---|
| GET | `/absensi` | authPengguna | - | - | `absensiRoute.js` |
| POST | `/absensi` | authPengguna | - | - | `absensiRoute.js` |
| GET | `/absensi/:id` | authPengguna | - | - | `absensiRoute.js` |
| PUT | `/absensi/:id` | authPengguna | - | - | `absensiRoute.js` |
| GET | `/absensi/monitoring` | authPengguna | - | ya | `absensiRoute.js` |
| GET | `/akunkas` | authPengguna | `read-akunkas` | ya | `akunKasRoute.js` |
| POST | `/akunkas` | authPengguna | `create-akunkas` | ya | `akunKasRoute.js` |
| GET | `/akunkas/:id` | authPengguna | `read-akunkas` | - | `akunKasRoute.js` |
| PUT | `/akunkas/:id` | authPengguna | `update-akunkas` | - | `akunKasRoute.js` |
| DELETE | `/akunkas/:id` | authPengguna | `delete-akunkas` | - | `akunKasRoute.js` |
| GET | `/akun/admin/all` | authAkun+adminOnly | - | - | `akunRoute.js` |
| POST | `/akun/admin/users` | authAkun+adminOnly | - | - | `akunRoute.js` |
| PUT | `/akun/admin/users/:id` | authAkun+adminOnly | - | - | `akunRoute.js` |
| DELETE | `/akun/admin/users/:id` | authAkun+adminOnly | - | - | `akunRoute.js` |
| POST | `/akun/admin/users/:id/freeze` | authAkun+adminOnly | - | - | `akunRoute.js` |
| GET | `/akun/admin/users/:id/langganan` | authAkun+adminOnly | - | - | `akunRoute.js` |
| POST | `/akun/admin/users/:id/langganan` | authAkun+adminOnly | - | - | `akunRoute.js` |
| POST | `/akun/admin/users/:id/unfreeze` | authAkun+adminOnly | - | - | `akunRoute.js` |
| POST | `/akun/auth/login` | public | - | ya | `akunRoute.js` |
| POST | `/akun/auth/logout` | public | - | ya | `akunRoute.js` |
| POST | `/akun/auth/refreshtoken` | public | - | - | `akunRoute.js` |
| POST | `/akun/auth/register` | public | - | - | `akunRoute.js` |
| GET | `/akun/profil` | authPengguna | `read-akun` | - | `akunRoute.js` |
| PUT | `/akun/profil/update/:id` | authPengguna | `update-akun` | - | `akunRoute.js` |
| GET | `/aset` | authPengguna | - | ya | `asetRoute.js` |
| POST | `/aset` | authPengguna | `create-aset` | ya | `asetRoute.js` |
| GET | `/aset/:id` | authPengguna | - | ya | `asetRoute.js` |
| PUT | `/aset/:id` | authPengguna | `update-aset` | ya | `asetRoute.js` |
| DELETE | `/aset/:id` | authPengguna | `delete-aset` | ya | `asetRoute.js` |
| GET | `/bahanbaku` | authPengguna | `read-bahan` | ya | `bahanBakuRoute.js` |
| POST | `/bahanbaku` | authPengguna | `create-bahan` | ya | `bahanBakuRoute.js` |
| GET | `/bahanbaku/:id` | authPengguna | `read-bahan` | ya | `bahanBakuRoute.js` |
| PUT | `/bahanbaku/:id` | authPengguna | `update-bahan` | ya | `bahanBakuRoute.js` |
| DELETE | `/bahanbaku/:id` | authPengguna | `delete-bahan` | ya | `bahanBakuRoute.js` |
| GET | `/baranginventory` | authPengguna | - | - | `barangInventoryRoute.js` |
| POST | `/baranginventory` | authPengguna | - | - | `barangInventoryRoute.js` |
| GET | `/baranginventory/:id` | authPengguna | - | - | `barangInventoryRoute.js` |
| PUT | `/baranginventory/:id` | authPengguna | - | - | `barangInventoryRoute.js` |
| DELETE | `/baranginventory/:id` | authPengguna | - | - | `barangInventoryRoute.js` |
| GET | `/bebanoperasional` | authPengguna | - | - | `bebanOperasionalRoute.js` |
| POST | `/bebanoperasional` | authPengguna | - | - | `bebanOperasionalRoute.js` |
| GET | `/bebanoperasional/:id` | authPengguna | - | - | `bebanOperasionalRoute.js` |
| PUT | `/bebanoperasional/:id` | authPengguna | - | - | `bebanOperasionalRoute.js` |
| DELETE | `/bebanoperasional/:id` | authPengguna | - | - | `bebanOperasionalRoute.js` |
| GET | `/dashboard/gudang` | authPengguna | `read-dashboard-gudang` | - | `dashboardRoute.js` |
| GET | `/dashboard/outlet` | authPengguna | `read-dashboard-outlet` | - | `dashboardRoute.js` |
| GET | `/device/:userid` | authPengguna | `read-pengguna` | - | `deviceRoute.js` |
| POST | `/device/approve` | authPengguna | `update-pengguna` | - | `deviceRoute.js` |
| GET | `/device/events` | authPengguna | - | - | `deviceRoute.js` |
| POST | `/device/fcm-token` | authPengguna | - | - | `deviceRoute.js` |
| DELETE | `/device/fcm-token` | authPengguna | - | - | `deviceRoute.js` |
| POST | `/device/revoke` | authPengguna | `update-pengguna` | - | `deviceRoute.js` |
| POST | `/device/self-approve` | authPengguna | - | - | `deviceRoute.js` |
| POST | `/device/transfer-primary` | authPengguna | - | - | `deviceRoute.js` |
| GET | `/diskon` | authPengguna | - | ya | `diskonRoute.js` |
| POST | `/diskon` | authPengguna | `create-diskon` | ya | `diskonRoute.js` |
| GET | `/diskon/:id` | authPengguna | - | - | `diskonRoute.js` |
| PUT | `/diskon/:id` | authPengguna | `update-diskon` | ya | `diskonRoute.js` |
| DELETE | `/diskon/:id` | authPengguna | `delete-diskon` | ya | `diskonRoute.js` |
| GET | `/inventory` | authPengguna | `read-inventory` | ya | `inventoryRoute.js` |
| POST | `/inventory` | authPengguna | `create-inventory` | ya | `inventoryRoute.js` |
| GET | `/inventory/:id` | authPengguna | `read-inventory` | - | `inventoryRoute.js` |
| DELETE | `/inventory/:id` | authPengguna | `delete-inventory` | - | `inventoryRoute.js` |
| PATCH | `/inventory/:id/minimum-stok` | authPengguna | `update-inventory-minimum` | ya | `inventoryRoute.js` |
| POST | `/inventory/:id/opname` | authPengguna | `opname-inventory` | ya | `inventoryRoute.js` |
| POST | `/inventory/process-sale` | authPengguna | `akses-pos` | - | `inventoryRoute.js` |
| GET | `/izincuti` | authPengguna | `read-izin-cuti` | - | `izinCutiRoute.js` |
| POST | `/izincuti` | authPengguna | `create-izin-cuti` | - | `izinCutiRoute.js` |
| GET | `/izincuti/:id` | authPengguna | `read-izin-cuti` | - | `izinCutiRoute.js` |
| PUT | `/izincuti/:id` | authPengguna | `update-izin-cuti` | - | `izinCutiRoute.js` |
| GET | `/izincuti/pengguna` | authPengguna | - | - | `izinCutiRoute.js` |
| POST | `/izincuti/pengguna` | authPengguna | - | - | `izinCutiRoute.js` |
| GET | `/jadwalshift` | authPengguna | - | ya | `jadwalShiftRoute.js` |
| POST | `/jadwalshift` | authPengguna | - | ya | `jadwalShiftRoute.js` |
| GET | `/jadwalshift/:id` | authPengguna | - | - | `jadwalShiftRoute.js` |
| PUT | `/jadwalshift/:id` | authPengguna | - | ya | `jadwalShiftRoute.js` |
| DELETE | `/jadwalshift/:id` | authPengguna | - | ya | `jadwalShiftRoute.js` |
| POST | `/jadwalshift/bulk` | authPengguna | - | ya | `jadwalShiftRoute.js` |
| GET | `/jurnalstok` | authPengguna | `read-jurnal-stok` | ya | `jurnalStokRoute.js` |
| POST | `/jurnalstok` | authPengguna | `create-jurnal-stok` | - | `jurnalStokRoute.js` |
| GET | `/jurnalstok/:id` | authPengguna | `read-jurnal-stok` | - | `jurnalStokRoute.js` |
| PUT | `/jurnalstok/:id` | authPengguna | `update-jurnal-stok` | - | `jurnalStokRoute.js` |
| DELETE | `/jurnalstok/:id` | authPengguna | `delete-jurnal-stok` | - | `jurnalStokRoute.js` |
| PATCH | `/jurnalstok/wms/kirim` | authPengguna | `create-jurnal-stok` | - | `jurnalStokRoute.js` |
| PATCH | `/jurnalstok/wms/opname` | authPengguna | `create-jurnal-stok` | - | `jurnalStokRoute.js` |
| PATCH | `/jurnalstok/wms/rollback` | authPengguna | `create-jurnal-stok` | - | `jurnalStokRoute.js` |
| PATCH | `/jurnalstok/wms/terima` | authPengguna | `create-jurnal-stok` | - | `jurnalStokRoute.js` |
| GET | `/jurnaltransfer` | authPengguna | - | - | `jurnalTransferRoute.js` |
| POST | `/jurnaltransfer` | authPengguna | - | - | `jurnalTransferRoute.js` |
| GET | `/jurnaltransfer/:id` | authPengguna | - | - | `jurnalTransferRoute.js` |
| PUT | `/jurnaltransfer/:id` | authPengguna | - | - | `jurnalTransferRoute.js` |
| DELETE | `/jurnaltransfer/:id` | authPengguna | - | - | `jurnalTransferRoute.js` |
| GET | `/kategoribeban` | authPengguna | - | - | `kategoriBebanRoute.js` |
| POST | `/kategoribeban` | authPengguna | - | - | `kategoriBebanRoute.js` |
| GET | `/kategoribeban/:id` | authPengguna | - | - | `kategoriBebanRoute.js` |
| PUT | `/kategoribeban/:id` | authPengguna | - | - | `kategoriBebanRoute.js` |
| DELETE | `/kategoribeban/:id` | authPengguna | - | - | `kategoriBebanRoute.js` |
| GET | `/kategori` | authPengguna | `read-kategori` | ya | `kategoriRoutes.js` |
| POST | `/kategori` | authPengguna | `create-kategori` | ya | `kategoriRoutes.js` |
| GET | `/kategori/:id` | authPengguna | `read-kategori` | - | `kategoriRoutes.js` |
| PUT | `/kategori/:id` | authPengguna | `update-kategori` | ya | `kategoriRoutes.js` |
| DELETE | `/kategori/:id` | authPengguna | `delete-kategori` | ya | `kategoriRoutes.js` |
| GET | `/kontrakkompensasi` | authPengguna | `read-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| POST | `/kontrakkompensasi` | authPengguna | `create-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| GET | `/kontrakkompensasi/:id` | authPengguna | `read-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| PUT | `/kontrakkompensasi/:id` | authPengguna | `update-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| DELETE | `/kontrakkompensasi/:id` | authPengguna | `delete-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| GET | `/laporan/laba-rugi` | authPengguna | - | ya | `laporanRoute.js` |
| GET | `/location` | authPengguna | `read-location` | ya | `locationRoute.js` |
| POST | `/location` | authPengguna | `create-location` | ya | `locationRoute.js` |
| GET | `/location/:id` | authPengguna | `read-location` | - | `locationRoute.js` |
| PUT | `/location/:id` | authPengguna | `update-location` | - | `locationRoute.js` |
| DELETE | `/location/:id` | authPengguna | `delete-location` | - | `locationRoute.js` |
| GET | `/location/current` | authPengguna | `read-location` | ya | `locationRoute.js` |
| GET | `/membership` | authPengguna | `read-membership` | - | `membershipRoute.js` |
| POST | `/membership` | authPengguna | `create-membership` | - | `membershipRoute.js` |
| GET | `/membership/:id` | authPengguna | `read-membership` | - | `membershipRoute.js` |
| PUT | `/membership/:id` | authPengguna | `update-membership` | - | `membershipRoute.js` |
| DELETE | `/membership/:id` | authPengguna | `delete-membership` | - | `membershipRoute.js` |
| GET | `/metodepembayaran` | authPengguna | - | ya | `metodePembayaranRoute.js` |
| POST | `/metodepembayaran` | authPengguna | `create-metode-pembayaran` | ya | `metodePembayaranRoute.js` |
| GET | `/metodepembayaran/:id` | authPengguna | - | ya | `metodePembayaranRoute.js` |
| PUT | `/metodepembayaran/:id` | authPengguna | `update-metode-pembayaran` | ya | `metodePembayaranRoute.js` |
| DELETE | `/metodepembayaran/:id` | authPengguna | `delete-metode-pembayaran` | ya | `metodePembayaranRoute.js` |
| PATCH | `/metodepembayaran/:id/toggle-active` | authPengguna | `update-metode-pembayaran` | - | `metodePembayaranRoute.js` |
| GET | `/pajak` | authPengguna | - | ya | `pajakRoute.js` |
| POST | `/pajak` | authPengguna | - | ya | `pajakRoute.js` |
| GET | `/pajak/:id` | authPengguna | - | - | `pajakRoute.js` |
| PUT | `/pajak/:id` | authPengguna | - | ya | `pajakRoute.js` |
| DELETE | `/pajak/:id` | authPengguna | - | ya | `pajakRoute.js` |
| POST | `/pajak/simulasi-produk` | authPengguna | - | - | `pajakRoute.js` |
| POST | `/pajak/simulasi-transaksi` | authPengguna | - | - | `pajakRoute.js` |
| GET | `/paketmembership` | authPengguna | `read-paket-membership` | - | `paketMembershipRoute.js` |
| POST | `/paketmembership` | authPengguna | `create-paket-membership` | - | `paketMembershipRoute.js` |
| GET | `/paketmembership/:id` | authPengguna | `read-paket-membership` | - | `paketMembershipRoute.js` |
| PUT | `/paketmembership/:id` | authPengguna | `update-paket-membership` | - | `paketMembershipRoute.js` |
| DELETE | `/paketmembership/:id` | authPengguna | `delete-paket-membership` | - | `paketMembershipRoute.js` |
| GET | `/pelanggan` | authPengguna | - | ya | `pelangganRoute.js` |
| POST | `/pelanggan` | authPengguna | `create-pelanggan` | ya | `pelangganRoute.js` |
| GET | `/pelanggan/:id` | authPengguna | - | - | `pelangganRoute.js` |
| PUT | `/pelanggan/:id` | authPengguna | `update-pelanggan` | ya | `pelangganRoute.js` |
| DELETE | `/pelanggan/:id` | authPengguna | `delete-pelanggan` | ya | `pelangganRoute.js` |
| GET | `/pembayaran` | authPengguna | `read-pembayaran` | ya | `pembayaranRoute.js` |
| POST | `/pembayaran` | authPengguna | `create-pembayaran` | ya | `pembayaranRoute.js` |
| GET | `/pembayaran/:id` | authPengguna | `read-pembayaran` | - | `pembayaranRoute.js` |
| PUT | `/pembayaran/:id` | authPengguna | `update-pembayaran` | - | `pembayaranRoute.js` |
| DELETE | `/pembayaran/:id` | authPengguna | `delete-pembayaran` | - | `pembayaranRoute.js` |
| GET | `/pembelianstok` | authPengguna | - | - | `pembelianStokRoute.js` |
| POST | `/pembelianstok` | authPengguna | - | - | `pembelianStokRoute.js` |
| GET | `/pembelianstok/:id` | authPengguna | - | - | `pembelianStokRoute.js` |
| PUT | `/pembelianstok/:id` | authPengguna | - | - | `pembelianStokRoute.js` |
| DELETE | `/pembelianstok/:id` | authPengguna | - | - | `pembelianStokRoute.js` |
| GET | `/pengajuanstok` | authPengguna | `read-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| POST | `/pengajuanstok` | authPengguna | `create-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| GET | `/pengajuanstok/:id` | authPengguna | `read-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| PUT | `/pengajuanstok/:id` | authPengguna | `update-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| PATCH | `/pengajuanstok/:id/approve` | authPengguna | `approve-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| PATCH | `/pengajuanstok/:id/reject` | authPengguna | `reject-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| PATCH | `/pengajuanstok/:id/submit` | authPengguna | `update-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| GET | `/pengguna` | authPengguna | `read-pengguna` | ya | `penggunaRoute.js` |
| GET | `/pengguna/:id` | authPengguna | `read-pengguna` | ya | `penggunaRoute.js` |
| PUT | `/pengguna/:id` | authPengguna | `update-pengguna` | ya | `penggunaRoute.js` |
| DELETE | `/pengguna/:id` | authPengguna | `delete-pengguna` | ya | `penggunaRoute.js` |
| GET | `/pengguna/check-owner` | authAkun | - | - | `penggunaRoute.js` |
| POST | `/pengguna/pin-login` | authAkun | - | ya | `penggunaRoute.js` |
| POST | `/pengguna/pin-logout` | authPengguna | - | ya | `penggunaRoute.js` |
| POST | `/pengguna/pin-refresh` | public | - | - | `penggunaRoute.js` |
| POST | `/pengguna/register-owner` | authAkun | - | - | `penggunaRoute.js` |
| POST | `/pengguna/register-pengguna` | authPengguna | `create-pengguna` | ya | `penggunaRoute.js` |
| POST | `/pengguna/reset-pin-owner` | authAkun | - | - | `penggunaRoute.js` |
| GET | `/penjualan` | authPengguna | `read-penjualan` | ya | `penjualanRoute.js` |
| POST | `/penjualan` | authPengguna | `create-penjualan` | ya | `penjualanRoute.js` |
| GET | `/penjualan/:id` | authPengguna | `read-penjualan` | ya | `penjualanRoute.js` |
| PUT | `/penjualan/:id` | authPengguna | `update-penjualan` | ya | `penjualanRoute.js` |
| DELETE | `/penjualan/:id` | authPengguna | `delete-penjualan` | ya | `penjualanRoute.js` |
| GET | `/permission` | authEither | - | ya | `permissionRoute.js` |
| POST | `/permission` | authAkun+adminOnly | - | - | `permissionRoute.js` |
| PUT | `/permission/:id` | authAkun+adminOnly | - | - | `permissionRoute.js` |
| DELETE | `/permission/:id` | authAkun+adminOnly | - | - | `permissionRoute.js` |
| GET | `/permission/grouped` | authEither | - | - | `permissionRoute.js` |
| GET | `/polaroster` | authPengguna | - | ya | `polaRosterRoute.js` |
| POST | `/polaroster` | authPengguna | - | ya | `polaRosterRoute.js` |
| GET | `/polaroster/:id` | authPengguna | - | - | `polaRosterRoute.js` |
| PUT | `/polaroster/:id` | authPengguna | - | ya | `polaRosterRoute.js` |
| DELETE | `/polaroster/:id` | authPengguna | - | ya | `polaRosterRoute.js` |
| GET | `/posisi` | public | - | - | `posisiRoute.js` |
| POST | `/posisi` | public | - | - | `posisiRoute.js` |
| GET | `/posisi/:id` | public | - | - | `posisiRoute.js` |
| PUT | `/posisi/:id` | public | - | - | `posisiRoute.js` |
| DELETE | `/posisi/:id` | public | - | - | `posisiRoute.js` |
| POST | `/produkpajak` | authPengguna | - | ya | `produkPajakRoute.js` |
| DELETE | `/produkpajak/:id` | authPengguna | - | ya | `produkPajakRoute.js` |
| GET | `/produkpajak/:targetid` | authPengguna | - | ya | `produkPajakRoute.js` |
| GET | `/produk` | authPengguna | `read-produk` atau `akses-pos` | ya | `produkRoutes.js` |
| POST | `/produk` | authPengguna | `create-produk` | ya | `produkRoutes.js` |
| GET | `/produk/:id` | authPengguna | `read-produk` atau `akses-pos` | ya | `produkRoutes.js` |
| PUT | `/produk/:id` | authPengguna | `update-produk` | ya | `produkRoutes.js` |
| DELETE | `/produk/:id` | authPengguna | `delete-produk` | ya | `produkRoutes.js` |
| GET | `/role` | authPengguna | `read-role` | ya | `roleRoute.js` |
| POST | `/role` | authPengguna | `create-role` | ya | `roleRoute.js` |
| GET | `/role/:id` | authPengguna | `read-role` | ya | `roleRoute.js` |
| PUT | `/role/:id` | authPengguna | `update-role` | ya | `roleRoute.js` |
| DELETE | `/role/:id` | authPengguna | `delete-role` | ya | `roleRoute.js` |
| GET | `/sesibooking` | authPengguna | `read-booking` | ya | `sesiBookingRoute.js` |
| POST | `/sesibooking` | authPengguna | `create-booking` | ya | `sesiBookingRoute.js` |
| GET | `/sesibooking/:id` | authPengguna | `read-booking` | - | `sesiBookingRoute.js` |
| PUT | `/sesibooking/:id` | authPengguna | `update-booking` | - | `sesiBookingRoute.js` |
| DELETE | `/sesibooking/:id` | authPengguna | `delete-booking` | - | `sesiBookingRoute.js` |
| GET | `/shift` | authPengguna | - | ya | `shiftRoute.js` |
| POST | `/shift` | authPengguna | - | ya | `shiftRoute.js` |
| GET | `/shift/:id` | authPengguna | - | - | `shiftRoute.js` |
| PUT | `/shift/:id` | authPengguna | - | ya | `shiftRoute.js` |
| DELETE | `/shift/:id` | authPengguna | - | ya | `shiftRoute.js` |
| GET | `/stockopname` | authPengguna | `read-stock-opname` | - | `stockOpnameRoute.js` |
| POST | `/stockopname` | authPengguna | `create-stock-opname` | ya | `stockOpnameRoute.js` |
| GET | `/stockopname/:id` | authPengguna | `read-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/approve` | authPengguna | `review-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/cancel` | authPengguna | `review-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/items` | authPengguna | `submit-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/reject` | authPengguna | `review-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/submit` | authPengguna | `submit-stock-opname` | ya | `stockOpnameRoute.js` |
| GET | `/stockopname/adjustments` | authPengguna | `read-stock-adjustment` | ya | `stockOpnameRoute.js` |
| GET | `/stockopname/adjustments/:id` | authPengguna | `read-stock-adjustment` | ya | `stockOpnameRoute.js` |
| GET | `/tarif` | authPengguna | - | ya | `tarifRoute.js` |
| POST | `/tarif` | authPengguna | `create-tarif` | ya | `tarifRoute.js` |
| GET | `/tarif/:id` | authPengguna | - | ya | `tarifRoute.js` |
| PUT | `/tarif/:id` | authPengguna | `update-tarif` | ya | `tarifRoute.js` |
| DELETE | `/tarif/:id` | authPengguna | `delete-tarif` | ya | `tarifRoute.js` |
| GET | `/tenant` | authAkun+adminOnly | - | - | `tenantRoute.js` |
| POST | `/tenant` | authAkun | - | - | `tenantRoute.js` |
| GET | `/tenant/:id` | authPengguna | - | - | `tenantRoute.js` |
| PUT | `/tenant/:id` | authPengguna | `update-tenant` | - | `tenantRoute.js` |
| DELETE | `/tenant/:id` | authPengguna | `delete-tenant` | - | `tenantRoute.js` |
| GET | `/tipeaset` | authPengguna | - | ya | `tipeAsetRoute.js` |
| POST | `/tipeaset` | authPengguna | `create-tipe-aset` | ya | `tipeAsetRoute.js` |
| GET | `/tipeaset/:id` | authPengguna | - | ya | `tipeAsetRoute.js` |
| PUT | `/tipeaset/:id` | authPengguna | `update-tipe-aset` | ya | `tipeAsetRoute.js` |
| DELETE | `/tipeaset/:id` | authPengguna | `delete-tipe-aset` | ya | `tipeAsetRoute.js` |
| GET | `/transferstok` | authPengguna | `read-transfer-stok` | ya | `transferStokRoute.js` |
| POST | `/transferstok` | authPengguna | `create-transfer-stok` | ya | `transferStokRoute.js` |
| GET | `/transferstok/:id` | authPengguna | `read-transfer-stok` | ya | `transferStokRoute.js` |
| PUT | `/transferstok/:id` | authPengguna | `create-transfer-stok` | ya | `transferStokRoute.js` |
| DELETE | `/transferstok/:id` | authPengguna | `cancel-transfer-stok` | - | `transferStokRoute.js` |
| PATCH | `/transferstok/:id/batal` | authPengguna | `cancel-transfer-stok` | ya | `transferStokRoute.js` |
| PATCH | `/transferstok/:id/kirim` | authPengguna | `approve-transfer-stok` | ya | `transferStokRoute.js` |
| PATCH | `/transferstok/:id/terima` | authPengguna | `receive-transfer-stok` | ya | `transferStokRoute.js` |
