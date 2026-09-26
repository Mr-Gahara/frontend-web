# Kontrak API Backend untuk Frontend Web

Sifat perubahan: **Jarang**.

Kontrak ini adalah sumber kebenaran antara frontend-web dan backend-js: endpoint yang dipanggil frontend, token dan permission yang dibutuhkan, bentuk respons, serta aturan payload setiap operasi tulis. Untuk kebutuhan frontend web, kontrak ini menggantikan tabel endpoint di README backend, yang terbukti tertinggal dari kode.

Kontrak dipecah per jenis isi. Nomor bagian dan butir dipertahankan dari
dokumen asal (`docs/kontrak-api.md`), agar rujukan di pesan commit lama tetap
dapat ditelusuri.

## Cara membaca kontrak

**Kontrak ini adalah acuan utama.** Setiap keputusan tentang endpoint, bentuk
data, atau izin harus diturunkan dari sini, bukan dari dugaan.

| Keperluan | Berkas |
|---|---|
| Path, method, auth, dan permission sebuah endpoint | `endpoint.md` bagian 3.1, dikelompokkan per modul |
| Bentuk respons GET, sebagai dasar menulis tipe | `endpoint.md` bagian 3.3 |
| Field payload operasi tulis, yang wajib dan yang diisi server | `payload.md` (bagian 4) |
| Izin yang dibutuhkan sebuah halaman | `izin-halaman.md` (bagian 5) |
| Ketidakselarasan yang sudah tercatat beserta pemiliknya | `temuan.md` (bagian 6) |
| Seluruh 246 route backend, termasuk yang belum dipakai | `route-backend.md` (Lampiran A) |

Kontrak terikat pada commit backend `4310d1c` (18 September 2026). Bagian
inventory dan stock opname di `endpoint.md`, `payload.md`, `izin-halaman.md`,
dan `temuan.md` dikoreksi manual terhadap backend `f27f093` (origin/yoga,
20 September 2026) pada 21 September 2026. Pada hari yang sama, bagian
transfer stok dan validator inventory di `endpoint.md`, `payload.md`, dan
`temuan.md` dikoreksi terhadap backend `9cd1439` (branch `ridho` yang
menggabungkan origin/yoga `f0b7157`). Bagian penjualan dan pembayaran di
`endpoint.md`, `payload.md`, `izin-halaman.md`, dan `temuan.md` dikoreksi
terhadap backend `00b9957` (branch `ridho`) pada 26 September 2026. Bila
backend berubah cukup jauh, `endpoint.md`, `payload.md`, `izin-halaman.md`,
dan `route-backend.md` perlu dibangkitkan ulang; bagian 1 di bawah menjelaskan
cara pembangkitannya. Gejala bahwa kontrak sudah tertinggal: endpoint yang
dipanggil menjawab 404, permission yang tercatat tidak lagi diperiksa, atau
bentuk respons berbeda dari tipe. Pembangkitan ulang hanya dilakukan atas
permintaan pemilik proyek.

## 1. Acuan dan metodologi

| Repo | Commit acuan |
|---|---|
| backend-js | 4310d1c (2026-09-18) fix(pengguna): hapus pengguna tidak lagi gagal acak dan riwayat absensi dijaga |
| frontend-web | 668951d (2026-09-18) docs(kontrak): kontrak API backend untuk frontend web berbasis bukti |

Bagian 3 sampai 5 dan Lampiran A (`endpoint.md`, `payload.md`, `izin-halaman.md`, dan `route-backend.md`) dibangkitkan dari bukti, bukan ditulis tangan:

| Sumber | Cara | Menghasilkan |
|---|---|---|
| `routes/*.js` backend | Analisis statis rantai `router`, termasuk `router.route().get().post()`, dengan urutan `router.use` diperhitungkan | Method, path, auth, dan permission setiap route |
| Kode frontend (`app`, `components`, `hooks`, `lib`) | Analisis statis setiap `apiClient.<method>(...)` | Endpoint yang benar-benar dipanggil frontend |
| Backend lokal yang berjalan | Panggilan GET dengan token pengguna web; tidak ada POST, PUT, PATCH, maupun DELETE | Bentuk respons yang sebenarnya |
| Route, controller, `validators/`, dan `models/` backend | Penelusuran route ke controller ke validator, dengan skema model sebagai cadangan | Aturan payload operasi tulis |

Keterbatasan:

- Validasi yang hanya ada di service tidak tertangkap; operasi seperti itu tercatat memakai skema model. Termasuk validator di `validators/` yang dipanggil dari service, bukan route: stock opname memanggil lima validator dari service (`POST /stockopname`, `PATCH /stockopname/:id/items`, `.../approve`, `.../reject`, dan query kedua daftar), dikoreksi manual di `payload.md` pada 21 September 2026; transfer stok memanggil `validateTransferPayload` dari service untuk `POST` dan `PUT`, dikoreksi pada tanggal yang sama. Sebelum menyimpulkan sebuah operasi tidak divalidasi atau sebuah validator tidak terpakai, cari pemanggilnya di seluruh backend, termasuk `services/`.
- Daftar field pada bagian 4 (`payload.md`) berasal dari validator, sedangkan validator hanya memeriksa dan tidak membuang field lain. Service dapat memakai field di luar daftar itu, seperti `locationID` pada `POST /bahanbaku`. Sebelum sebuah field dihapus dari payload frontend, periksa dulu pemakaiannya di service.
- Bentuk respons operasi tulis tidak diambil dengan memanggil endpoint, agar data tidak berubah.
- Analisis statis route hanya membaca argumen pertama `checkPermission`. Route yang menerima salah satu dari beberapa izin perlu dikoreksi manual; `GET /produk` dan `GET /produk/:id` (`read-produk` atau `akses-pos`) sudah dikoreksi pada 20 September 2026, dan `GET /inventory` (`read-inventory`, `read-inventory-gudang`, atau `read-inventory-outlet`) pada 21 September 2026. Sapuan seluruh route pada tanggal itu, termasuk pemanggilan yang argumennya dipecah ke beberapa baris, hanya menemukan satu route lain yang berizin ganda, yaitu `PATCH /jurnalstok/wms/*`, yang tidak dipakai frontend. Lampiran A (`route-backend.md`) belum mencerminkan koreksi inventory karena bertanda Tetap.
- Analisis statis frontend hanya menangkap panggilan `apiClient` dengan path tertulis. Path yang disusun dinamis terlewat, sehingga `GET /stockopname` sempat tercatat tidak dipakai (dikoreksi 20 September 2026). Untuk modul yang sudah dipindah ke `features/`, pemanggilan terpusat di `features/<modul>/api.ts`, dan kolom "Dipakai di" di bagian 3.1 (`endpoint.md`) diaudit ulang pada 22 September 2026 lewat helper `audit-endpoint.js` (`refactor/cara-kerja.md`), sehingga menyebut berkas itu serta jumlah halaman lama yang masih memanggil langsung. Bagian 5 (`izin-halaman.md`) untuk modul itu diperbarui manual. Panggilan yang tidak lewat `apiClient.<method>` juga terlewat: `POST /pengguna/pin-refresh` dan `POST /akun/auth/refreshtoken` dipanggil lewat `fetch` langsung oleh `components/providers/session-provider.tsx` (pemulihan sesi saat aplikasi dimuat) dan `lib/apiClient.ts` (penyegaran token). Keduanya kini tercatat di `endpoint.md`, tetapi Lampiran A (`route-backend.md`) mencatatnya tidak dipakai.
- Kontrak ini berlaku untuk commit acuan di atas. Bila backend berubah, bagian 3 sampai 5 dan Lampiran A perlu dibangkitkan ulang.

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
- Kolom Auth di bagian 3 (`endpoint.md`) menunjukkan middleware yang diperiksa backend: `authAkun`, `authPengguna`, `authEither`, dan `adminOnly`.

### 2.3 Format error dan kode status

Semua error berbentuk `{ status: "error", message, errors? }`; `errors` hanya ada pada sebagian error 4xx.

| Status | Arti | Tindakan frontend |
|---|---|---|
| 400 | Payload tidak valid | Tampilkan `errors` atau `message` di form |
| 401 | Token kedaluwarsa atau sesi diambil alih | Refresh sekali; bila gagal, kembali ke login |
| 403 | Izin ditolak, pengguna nonaktif, atau tenant/akun dibekukan | Jangan refresh; tampilkan pesan akses ditolak |
| 404 | Data tidak ada atau id tidak valid | Tampilkan keadaan tidak ditemukan |
| 409 | Duplikat atau data masih dipakai | Tampilkan pesan konflik. Tidak semua modul memakainya: duplikat kategori dijawab 400 (`temuan.md` butir 14), sedangkan opname aktif ganda di satu lokasi dijawab 409 (`payload.md`, `POST /stockopname`) |
| 429 | Terlalu banyak percobaan login | Tampilkan waktu tunggu |

Login PIN untuk aplikasi dapat menjawab 200 dengan `success: false` (perangkat menunggu persetujuan). Web tidak terdampak, tetapi lapisan API tetap memeriksa `success` bila ada.

### 2.4 Envelope respons

Semua respons GET yang sukses memuat `data`. Kunci lain tidak seragam antarmodul (`success`, `message`, `count`, `total`). Lapisan API frontend mengambil `data` sebagai isi dan menyeragamkan `count` atau `total` menjadi satu nama. Kolom Envelope di bagian 3 (`endpoint.md`) menunjukkan kunci yang benar-benar dikirim. Pembukaan envelope ini, dan normalisasi identitas di 2.5, hanya dilakukan `lib/api/client.ts`. Halaman yang masih memakai klien lama `lib/apiClient.ts` menerima respons mentah, termasuk `_id`.

### 2.5 Identitas dan field referensi

- Sebagian modul memakai `id`, sebagian `_id`, dan sebagian mencampur keduanya (`id` di tingkat atas, `_id` di objek bertingkat). Beberapa masih membawa `__v`. `lib/api/client.ts` menormalkan `_id` menjadi `id` secara rekursif dan membuang `__v`, sehingga halaman yang memakai lapisan itu hanya mengenal `id`. Halaman yang masih memakai klien lama menerima `_id` apa adanya (2.4).
- Nama field referensi tidak selalu mencerminkan isinya. Contoh: `bahanBakuID` dan `locationID` di jurnal stok berisi objek hasil populate, `dataAset` di aset berisi tipe aset, dan `referenceID` di stock adjustment berisi dokumen opname `{ id, nomorOpname, tanggal }`. Tipe frontend mengikuti bentuk nyata di bagian 3.3 (`endpoint.md`), bukan nama field; untuk field referensi, periksa `.populate(` di service sebelum menulis tipenya. Nama juga bisa menyesatkan arah: pada pengajuan stok, `dariLocationID` adalah gudang asal barang dan `keLocationID` outlet peminta, walau pengajuannya dibuat oleh outlet (`temuan.md` butir 23).

### 2.6 Field yang diisi server

Backend mengisi sendiri field berikut dari token pengguna; frontend tidak mengirimnya:

- `tenantID` pada hampir semua operasi create.
- `dataPengguna` (sesi booking), `dimintaOleh` (pengajuan stok), `picID` (stock opname), `pengirimID` (buat dan kirim transfer stok), `penerimaID` (terima transfer stok), dan `dicatatOleh` (pembelian stok).

Daftar "Wajib dari klien" di bagian 4 (`payload.md`) sudah mengecualikan field ini.
