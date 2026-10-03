# Kontrak API: Endpoint

Sifat perubahan: **Jarang**: koreksi saat migrasi membuktikan perbedaan.

Endpoint yang dipanggil frontend beserta auth, permission, envelope, dan bentuk respons GET. Aturan umum dan keterbatasannya ada di `README.md`.

## 3. Endpoint yang dipakai frontend

Saat kontrak dibangkitkan, frontend memanggil 126 endpoint unik; 121 di antaranya didefinisikan backend. Backend memiliki 246 route secara keseluruhan (Lampiran A, `route-backend.md`). Audit ulang 22 September 2026 (frontend `580a1e1`, backend `9cd1439`): frontend memanggil 124 endpoint unik, 122 lewat `apiData`, `api`, dan `apiClient` dan 2 lewat `fetch` langsung untuk penyegaran sesi, seluruhnya ada di backend dan tercatat di tabel ini; lima baris `/bahan-baku` tinggal sebagai jejak, dan backend tetap memiliki 246 route. Audit itu sempat mencatat 247 dengan `POST /akun/owner/create-tenant`, padahal route itu dikomentari di `akunRoute.js` baris 74; `audit-endpoint.js` membaca baris komentar sampai diperbaiki pada 28 September 2026. Audit 27 September 2026 (frontend `365553f`, backend `00b9957`) dan 28 September 2026 (frontend `477f258` dan `45187b6`), serta 29 September 2026 (frontend `f99b7cf`, `dcc22e0`, `e2a0cfd`, `845c2cf`, dan `9ce288b`), menghasilkan angka yang sama. Audit 30 September 2026 (frontend `319bd99`) mencatat 125 panggilan unik, bertambah `PUT /location/:id` dari pengaturan gudang, seluruhnya ada di backend dan tercatat di tabel ini. Audit 30 September 2026 (frontend `b5a55c4`, backend `465b438`) tetap mencatat 125 panggilan unik: `GET /pembayaran` tidak dipanggil lagi, dan `PUT /pembayaran/:id` bertambah. Backend kini memiliki 243 route, dan dua panggilan halaman lama, `DELETE /diskon/:id` dan `DELETE /metodepembayaran/:id`, tidak ada lagi di backend (`temuan.md` butir 82). Audit 1 Oktober 2026 (frontend `3359497`) mencatat 124 panggilan unik: `DELETE /metodepembayaran/:id` tidak dipanggil lagi, dan keempat panggilan metode pembayaran kini lewat `features/metode-pembayaran/api.ts`. Audit 1 Oktober 2026 (frontend `e0aaeca`) tetap mencatat 124 panggilan unik: ketujuh panggilan pajak dan produk pajak kini lewat `features/pajak/api.ts`, dan tiga endpoint masih dipanggil `features/` sekaligus halaman lama (`GET /diskon`, `GET /pelanggan`, dan `PUT /pengguna/:id`). Audit 2 Oktober 2026 terhadap backend `yoga` `50eede7` menghasilkan angka yang sama: 243 route dan 124 panggilan unik, dengan `DELETE /diskon/:id` tetap satu-satunya panggilan tanpa route. Audit 2 Oktober 2026 (frontend `fcf2dd2`) mencatat 126 panggilan unik, bertambah `GET /tenant/:id` dan `PUT /tenant/:id` lewat `features/tenant/api.ts`. Audit 2 Oktober 2026 (frontend `d9365d3`) tetap mencatat 126 panggilan unik: keempat panggilan pelanggan kini lewat `features/pelanggan/api.ts`, dan dua endpoint masih dipanggil `features/` sekaligus halaman lama (`GET /diskon` dan `PUT /pengguna/:id`). Audit 2 Oktober 2026 (frontend `52c550e`) mencatat 125 panggilan unik: `DELETE /diskon/:id` tidak dipanggil lagi, ketiga panggilan diskon kini lewat `features/diskon/api.ts`, tidak ada lagi panggilan tanpa route backend, dan hanya `PUT /pengguna/:id` yang masih dipanggil `features/` sekaligus halaman lama. Audit 2 Oktober 2026 (frontend `57a7084`) tetap mencatat 125 panggilan unik: login akun dan login pengguna kini lewat `features/auth/api.ts` (`apiMentah`), detail dan ubah pengguna lewat `features/pengguna/api.ts`, kedua logout lewat `features/auth/api.ts`, dan tidak ada lagi endpoint yang dipanggil halaman lama. Audit 3 Oktober 2026 (frontend `c824f18`) mencatat 133 panggilan unik: bertambah delapan panggilan `/akun/admin/...` lewat `features/admin-akun/api.ts`, seluruhnya ada di backend, dan tetap tidak ada endpoint yang dipanggil halaman lama. Audit 3 Oktober 2026 (frontend `6a57d12`) mencatat 135 panggilan unik: bertambah `GET /akunkas/mutasi` dan `GET /akunkas/:id/ringkasan` lewat `features/akun-kas/api.ts`, keduanya ada di backend. Audit 3 Oktober 2026 (frontend `1bc76f4`) mencatat 136 panggilan unik: bertambah `PUT /akunkas/:id` lewat `features/akun-kas/api.ts`, ada di backend. Kolom "Dipakai di" diisi dari audit terakhir: berkas `features/` pemanggilnya, jumlah berkas halaman lama yang masih memanggil lewat `apiClient`, atau keterangan bila tidak dipanggil lagi.

Seluruh path di bagian 3 sampai 5 dan Lampiran A ditulis relatif terhadap `/api`; contoh `/diskon` berarti `/api/diskon`. Kolom Permission berisi `-` bila route tidak memakai `checkPermission`. Kolom Envelope dan ID hanya terisi untuk GET yang diambil sampelnya.

### 3.1 Tabel endpoint per modul

#### `/absensi`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/absensi/monitoring` | authPengguna | - | `{ data }` | - | `features/absensi/api.ts` |

#### `/akun`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| POST | `/akun/auth/login` | public | - | - | - | `features/auth/api.ts` |
| POST | `/akun/auth/refreshtoken` | public | - | - | - | 2 file (lewat `fetch`: `lib/apiClient.ts` dan `components/providers/session-provider.tsx`) |
| POST | `/akun/auth/logout` | public | - | - | - | `features/auth/api.ts` |
| GET | `/akun/admin/all` | authAkun+adminOnly | - | `{ data, message }` | `id` | `features/admin-akun/api.ts` |
| POST | `/akun/admin/users` | authAkun+adminOnly | - | - | - | `features/admin-akun/api.ts` |
| PUT | `/akun/admin/users/:id` | authAkun+adminOnly | - | - | - | `features/admin-akun/api.ts` |
| DELETE | `/akun/admin/users/:id` | authAkun+adminOnly | - | - | - | `features/admin-akun/api.ts` (password admin di body) |
| POST | `/akun/admin/users/:id/freeze` | authAkun+adminOnly | - | - | - | `features/admin-akun/api.ts` |
| POST | `/akun/admin/users/:id/unfreeze` | authAkun+adminOnly | - | - | - | `features/admin-akun/api.ts` |
| POST | `/akun/admin/users/:id/langganan` | authAkun+adminOnly | - | - | - | `features/admin-akun/api.ts` |
| GET | `/akun/admin/users/:id/langganan` | authAkun+adminOnly | - | `{ cursorBerikutnya, data, message }` | `_id`, `__v` | `features/admin-akun/api.ts` (query `cursor`; dibaca lewat `apiMentah.get`) |

#### `/akunkas`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/akunkas` | authPengguna | `read-akunkas` | `{ data }` | `id` | `features/akun-kas/api.ts` |
| POST | `/akunkas` | authPengguna | `create-akunkas` | - | - | `features/akun-kas/api.ts` |
| PUT | `/akunkas/:id` | authPengguna | `update-akunkas` | `{ data }` | `id` | `features/akun-kas/api.ts` (ubah isian, nonaktifkan, dan aktifkan kembali; tulisan dibatasi 30 per menit per pengguna) |
| GET | `/akunkas/mutasi` | authPengguna | `read-akunkas` | `{ data, pagination }` | `id` | `features/akun-kas/api.ts` (query `page`, `limit`, `dari`, `sampai`, `akunKasID`, `arah`, dan `jenis`) |
| GET | `/akunkas/:id/ringkasan` | authPengguna | `read-akunkas` | `{ data }` | - | `features/akun-kas/api.ts` (query `dari` dan `sampai`) |

#### `/aset`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/aset` | authPengguna | - | `{ data }` | `id` | `features/aset/api.ts` |
| POST | `/aset` | authPengguna | `create-aset` | - | - | `features/aset/api.ts` |
| GET | `/aset/:id` | authPengguna | - | `{ data }` | `id` | `features/aset/api.ts` |
| PUT | `/aset/:id` | authPengguna | `update-aset` | - | - | `features/aset/api.ts` |
| DELETE | `/aset/:id` | authPengguna | `delete-aset` | - | - | `features/aset/api.ts` |

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
| GET | `/diskon` | authPengguna | - | `{ data }` | `id` | `features/diskon/api.ts` |
| POST | `/diskon` | authPengguna | `create-diskon` | - | - | `features/diskon/api.ts` |
| PUT | `/diskon/:id` | authPengguna | `update-diskon` | - | - | `features/diskon/api.ts` |
| DELETE | `/diskon/:id` | authPengguna | `delete-diskon` | - | - | tidak dipanggil lagi sejak `1e05df6` (route tidak ada lagi di backend `465b438`; diskon dihentikan lewat `PUT` dengan `status`, `temuan.md` butir 82) |

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
| GET | `/jadwalshift` | authPengguna | - | `{ data, message, success }` | `id` | `features/jadwal/api.ts` |
| POST | `/jadwalshift` | authPengguna | - | - | - | `features/jadwal/api.ts` |
| PUT | `/jadwalshift/:id` | authPengguna | - | - | - | `features/jadwal/api.ts` |
| DELETE | `/jadwalshift/:id` | authPengguna | - | - | - | `features/jadwal/api.ts` |
| POST | `/jadwalshift/bulk` | authPengguna | - | - | - | `features/jadwal/api.ts` |

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
| GET | `/laporan/laba-rugi` | authPengguna | `read-laporan` | `{ data, message, success }` | - | `features/laporan/api.ts` |

#### `/location`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/location` | authPengguna | `read-location` | `{ data, success }` | `id` | `features/inventaris/api.ts` |
| POST | `/location` | authPengguna | `create-location` | - | - | `features/inventaris/api.ts` |
| GET | `/location/current` | authPengguna | `read-location` | `{ data, success }` | `id` | `features/inventaris/api.ts` |
| PUT | `/location/:id` | authPengguna | `update-location` | - | - | `features/inventaris/api.ts` |

#### `/metodepembayaran`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/metodepembayaran` | authPengguna | - | `{ data }` | `id` | `features/metode-pembayaran/api.ts` (query `showAll=true` untuk halaman kelola, tanpa query untuk pilihan kasir) |
| POST | `/metodepembayaran` | authPengguna | `create-metode-pembayaran` | - | - | `features/metode-pembayaran/api.ts` |
| GET | `/metodepembayaran/:id` | authPengguna | - | `{ data }` | `id` | `features/metode-pembayaran/api.ts` |
| PUT | `/metodepembayaran/:id` | authPengguna | `update-metode-pembayaran` | - | - | `features/metode-pembayaran/api.ts` |
| DELETE | `/metodepembayaran/:id` | authPengguna | `delete-metode-pembayaran` | - | - | tidak dipanggil lagi sejak `3359497` (route tidak ada lagi di backend `465b438`; metode dihentikan lewat `PUT` dengan `isActive`, `temuan.md` butir 82) |

#### `/pajak`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pajak` | authPengguna | - | `{ data, success }` | `_id` | `features/pajak/api.ts` |
| POST | `/pajak` | authPengguna | - | - | - | `features/pajak/api.ts` |
| PUT | `/pajak/:id` | authPengguna | - | - | - | `features/pajak/api.ts` |
| DELETE | `/pajak/:id` | authPengguna | - | - | - | `features/pajak/api.ts` |

#### `/pelanggan`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pelanggan` | authPengguna | - | `{ data }` | `id` | `features/pelanggan/api.ts` |
| POST | `/pelanggan` | authPengguna | `create-pelanggan` | - | - | `features/pelanggan/api.ts` |
| PUT | `/pelanggan/:id` | authPengguna | `update-pelanggan` | - | - | `features/pelanggan/api.ts` |
| DELETE | `/pelanggan/:id` | authPengguna | `delete-pelanggan` | - | - | `features/pelanggan/api.ts` |

#### `/pembayaran`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/pembayaran` | authPengguna | `read-pembayaran` | `{ data }` | `id` | tidak dipanggil lagi sejak `b85c2bd` (riwayat dibaca dari detail penjualan, `temuan.md` butir 43) |
| POST | `/pembayaran` | authPengguna | `create-pembayaran` | - | - | `features/pembayaran/api.ts` |
| PUT | `/pembayaran/:id` | authPengguna | `update-pembayaran` | - | - | `features/pembayaran/api.ts` (pembatalan lewat `status: "VOID"`) |

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
| GET | `/pengguna` | authPengguna | `read-pengguna` | `{ data, message, total }` | `id` | `features/pengguna/api.ts` |
| GET | `/pengguna/:id` | authPengguna | `read-pengguna`, atau diri sendiri tanpa izin (`checkPermissionOrSelf`) | `{ data, message }` | `id` | `features/pengguna/api.ts` |
| PUT | `/pengguna/:id` | authPengguna | `update-pengguna`, atau diri sendiri tanpa izin (`checkPermissionOrSelf`) | - | - | `features/pengguna/api.ts` |
| DELETE | `/pengguna/:id` | authPengguna | `delete-pengguna` | - | - | `features/pengguna/api.ts` |
| POST | `/pengguna/pin-login` | authAkun | - | - | - | `features/auth/api.ts` |
| POST | `/pengguna/pin-logout` | authPengguna | - | - | - | `features/auth/api.ts` |
| POST | `/pengguna/pin-refresh` | public | - | - | - | 2 file (lewat `fetch`: `lib/apiClient.ts` dan `components/providers/session-provider.tsx`) |
| POST | `/pengguna/register-pengguna` | authPengguna | `create-pengguna` | - | - | `features/pengguna/api.ts` |

#### `/penjualan`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/penjualan` | authPengguna | `read-penjualan` | `{ data, pagination }` | `id`, `_id` bersarang | `features/penjualan/api.ts` (query `page` dan `limit` 10, 20, 50, atau 100, serta `sort` dan `order` sejak `a4304ce`, `temuan.md` butir 83) |
| POST | `/penjualan` | authPengguna | `create-penjualan` | - | - | `features/penjualan/api.ts` |
| GET | `/penjualan/:id` | authPengguna | `read-penjualan` | `{ data }` | `id`, `_id` bersarang | `features/penjualan/api.ts` |
| PUT | `/penjualan/:id` | authPengguna | `update-penjualan` | - | - | `features/penjualan/api.ts` |
| DELETE | `/penjualan/:id` | authPengguna | `delete-penjualan` | - | - | `features/penjualan/api.ts` |

#### `/permission`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/permission` | authEither | - | `{ data, message }` | `_id`, `__v` | `features/role/api.ts` |

#### `/polaroster`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/polaroster` | authPengguna | - | `{ data, message, success }` | `id` | `features/pola-roster/api.ts` |
| POST | `/polaroster` | authPengguna | - | - | - | `features/pola-roster/api.ts` |
| PUT | `/polaroster/:id` | authPengguna | - | - | - | `features/pola-roster/api.ts` |
| DELETE | `/polaroster/:id` | authPengguna | - | - | - | `features/pola-roster/api.ts` |

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
| POST | `/produkpajak` | authPengguna | - | - | - | `features/pajak/api.ts` |
| GET | `/produkpajak/:targetid` | authPengguna | - | - | - | `features/pajak/api.ts` |
| DELETE | `/produkpajak/:id` | authPengguna | - | - | - | `features/pajak/api.ts` |

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
| GET | `/sesibooking` | authPengguna | `read-booking` | `{ data }` | `id`, `_id` bersarang | `features/sesi-booking/api.ts` (query `tanggal`, cache per tanggal, `temuan.md` butir 57) |
| POST | `/sesibooking` | authPengguna | `create-booking` | - | - | `features/sesi-booking/api.ts` |

#### `/shift`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/shift` | authPengguna | - | `{ data, message, success }` | `id` | `features/shift/api.ts` (query `workspace` hanya penghindar 500, `temuan.md` butir 8) |
| POST | `/shift` | authPengguna | - | - | - | `features/shift/api.ts` |
| PUT | `/shift/:id` | authPengguna | - | - | - | `features/shift/api.ts` |
| DELETE | `/shift/:id` | authPengguna | - | - | - | `features/shift/api.ts` |

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
| GET | `/stockopname/adjustments` | authPengguna | `read-stock-adjustment` | `{ count, data, success }` | `id` | `features/stock-adjustment/api.ts` (query `locationID`, disaring backend) |
| GET | `/stockopname/adjustments/:id` | authPengguna | `read-stock-adjustment` | `{ data, success }` | `id` | `features/stock-adjustment/api.ts` |

#### `/tarif`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/tarif` | authPengguna | - | `{ data }` | `id` | `features/tarif/api.ts` |
| POST | `/tarif` | authPengguna | `create-tarif` | - | - | `features/tarif/api.ts` |
| GET | `/tarif/:id` | authPengguna | - | `{ data }` | `id` | `features/tarif/api.ts` |
| PUT | `/tarif/:id` | authPengguna | `update-tarif` | - | - | `features/tarif/api.ts` |
| DELETE | `/tarif/:id` | authPengguna | `delete-tarif` | - | - | `features/tarif/api.ts` |

#### `/tenant`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/tenant/:id` | authPengguna | - | - | - | `features/tenant/api.ts` |
| PUT | `/tenant/:id` | authPengguna | `update-tenant` | - | - | `features/tenant/api.ts` |

#### `/tipeaset`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/tipeaset` | authPengguna | - | `{ data }` | `id` | `features/tipe-aset/api.ts` |
| POST | `/tipeaset` | authPengguna | `create-tipe-aset` | - | - | `features/tipe-aset/api.ts` |
| GET | `/tipeaset/:id` | authPengguna | - | `{ data }` | `id` | `features/tipe-aset/api.ts` |
| PUT | `/tipeaset/:id` | authPengguna | `update-tipe-aset` | - | - | `features/tipe-aset/api.ts` |
| DELETE | `/tipeaset/:id` | authPengguna | `delete-tipe-aset` | - | - | `features/tipe-aset/api.ts` |

#### `/transferstok`

| Method | Path backend | Auth | Permission | Envelope | ID | Dipakai di |
|---|---|---|---|---|---|---|
| GET | `/transferstok` | authPengguna | `read-transfer-stok` | `{ count, data, success }` | `id` | `features/transfer-stok/api.ts` (query `status` dan `locationID` dikirim web; diabaikan backend sampai `465b438`, yang dilaporkan sudah membacanya tetapi belum dibuktikan dari web, `temuan.md` butir 33) |
| POST | `/transferstok` | authPengguna | `create-transfer-stok` | - | - | `features/transfer-stok/api.ts` |
| GET | `/transferstok/:id` | authPengguna | `read-transfer-stok` | `{ data, success }` | `id` | `features/transfer-stok/api.ts` |
| PUT | `/transferstok/:id` | authPengguna | `create-transfer-stok` | - | - | `features/transfer-stok/api.ts` |
| PATCH | `/transferstok/:id/batal` | authPengguna | `cancel-transfer-stok` | - | - | `features/transfer-stok/api.ts` |
| PATCH | `/transferstok/:id/kirim` | authPengguna | `approve-transfer-stok` | - | - | `features/transfer-stok/api.ts` |
| PATCH | `/transferstok/:id/terima` | authPengguna | `receive-transfer-stok` | - | - | `features/transfer-stok/api.ts` |

### 3.2 Status sampel GET yang tidak berhasil

- `GET /bahan-baku`: 404 Not Found (route tidak ada di backend; frontend berhenti memanggilnya di `aab26f3`)
- `GET /shift`: 500 Cannot access 'data' before initialization, hanya bila tanpa query apa pun (`shiftService.getAll` baris 21 sampai 28, `temuan.md` butir 8)

### 3.3 Bentuk item respons GET

Kunci item pertama (atau objek detail) pada sampel respons. Objek bertingkat ditulis `nama{kunci}`, array ditulis `nama[]`.

- `GET /absensi/monitoring`: daftar[], ringkasan{belumAbsen, sudahAbsen, totalStaf}, tanggal (controller memeriksa `read-absensi` sendiri dan menjawab 403 tanpa izin; service memuat seluruh staf aktif tenant tanpa pemisah ruang, `temuan.md` butir 70, menentukan hari ini dalam WIB, dan menyimpan hasilnya 30 detik di produksi)
- `GET /akun/admin/all`: createdAt, daftarTenant[], email, id, langganan{aksesBerakhirPada, alasanNonAktif, dibekukanPada, masaTenggangHari}, role, status, updatedAt, username (dari `mappers/akunMapper.js` backend `yoga` `50eede7` dan respons nyata 2 Oktober 2026: seluruh akun termasuk admin, tanpa paginasi, dengan cache 60 detik yang dibersihkan setiap operasi tulis admin; `daftarTenant[]` berisi `{ tenantID, namaToko }` dan kosong untuk akun tanpa toko; `aksesBerakhirPada` null berarti tidak dibatasi, karena job pembeku hanya menyasar akun bertanggal; `alasanNonAktif` bernilai manual, kedaluwarsa, atau null)
- `GET /akun/admin/users/:param/langganan` (dari `langgananService.riwayat`, bukan dari sampel cache kontrak): _id, __v, akunID, aksi, alasan, berakhirSebelum, berakhirSesudah, createdAt, durasiBulan, olehAkunID, updatedAt. Dokumen mentah tanpa mapper, terbaru lebih dulu; `aksi` bernilai buat, perpanjang, freeze, unfreeze, atau kedaluwarsa, dan `olehAkunID` null untuk tindakan sistem. Query `limit` (1 sampai 100, bawaan 20) dan `cursor` (waktu ISO dari `cursorBerikutnya`); `cursorBerikutnya` berada di tingkat atas respons, null bila habis, tanpa jumlah total, dan id akun yang tidak ada dijawab 200 dengan daftar kosong (`temuan.md` butir 120)
- `GET /akunkas`: createdAt, id, keterangan, namaAkun, nomorAkun, saldo, status, tenantID, tipeAkun, updatedAt
- `GET /akunkas/mutasi` (dari `mappers/akunKasMapper.js` backend `yoga` `50eede7` dan respons nyata 3 Oktober 2026): akunKasID, arah, createdAt, id, jenis, jumlah, keterangan, mutasiAsalID, penggunaID, referensi{id, tipe}, saldoSebelum, saldoSesudah, tanggal. Buku gabungan seluruh akun kas tenant, terbaru dicatat lebih dulu dan selalu per halaman (`page` dan `limit`, bawaan 20, paling besar 100; di atasnya 400), dengan `pagination` berisi page, limit, total, dan totalPages. `akunKasID`, `penggunaID`, dan `referensi.id` berupa id tanpa nama (`temuan.md` butir 124); `arah` MASUK atau KELUAR mengikuti `jenis`, yang bernilai SALDO_AWAL, PEMBAYARAN, VOID_PEMBAYARAN, BEBAN, PEMBALIK_BEBAN, TRANSFER_KELUAR, TRANSFER_MASUK, VOID_TRANSFER_KELUAR, atau VOID_TRANSFER_MASUK. `tanggal` adalah tanggal transaksi, sedangkan urutan dan filter periode memakai `createdAt`. Query `dari` dan `sampai` dibaca sebagai saat ISO 8601, sehingga tanggal tanpa jam berarti tengah malam UTC (butir 123); `akunKasID`, `arah`, dan `jenis` yang tidak sah dijawab 400 dengan pesan. `GET /akunkas/:id/mutasi` berbentuk sama untuk satu akun dan tidak dipakai web
- `GET /akunkas/:param/ringkasan` (dari `akunKasService._ringkasanMutasi` dan respons nyata 3 Oktober 2026): saldoAkhirPeriode, saldoAwalPeriode, totalKeluar, totalKeluarLain, totalLunas, totalMasuk, totalVoid. Dihitung dari buku mutasi satu akun untuk periode `dari` sampai `sampai`: saldo awal dari `saldoSebelum` baris pertama periode, atau dari saldo sesudah mutasi terakhir sebelum periode bila periodenya kosong; akun yang tidak ada dijawab 404. Tidak ada ringkasan gabungan seluruh akun (butir 125)
- `GET /aset`: createdAt, dataAset{deskripsi, id, namaTipeAset}, id, namaAset, status, tenantID, updatedAt
- `GET /aset/:param`: createdAt, dataAset{deskripsi, id, namaTipeAset}, id, namaAset, status, tenantID, updatedAt
- `GET /bahanbaku`: availableUnits[], createdAt, id, namaBahan, satuan, tenantID, updatedAt
- `GET /bahanbaku/:param`: availableUnits[], createdAt, id, namaBahan, satuan, tenantID, updatedAt
- `GET /diskon`: bisaDigabung, cakupan, createdAt, hariAktif[], hitungPerBarang, id, jamMulai, jamSelesai, khususMember, kuota, kuotaPerPelanggan, minimalBelanja, namaDiskon, nilai, produkIDs[], sedangBerlaku, sisaKuota, status, tanggalBerakhir, tanggalMulai, tenantID, terpakai, tipe, updatedAt (dari `mappers/diskonMapper.js` backend `yoga` `50eede7`: `sisaKuota` dihitung dari `kuota` dan `terpakai`, null bila tanpa kuota; `sedangBerlaku` dihitung saat respons dibuat dari status, masa berlaku, jam dan hari dalam WIB, dan kuota, `temuan.md` butir 109. Service membaca query `status`, `cakupan`, dan `tipe`, serta `page` dan `limit` yang opsional; daftar diurutkan status lalu terbaru dan di-cache 300 detik. Web memuat daftar tanpa query dan menyaring di klien)
- `GET /inventory`: createdAt, id, isStokKritis, item{id, kategori, nama, satuan, tipeItem}, lokasi{id, nama, tipe}, stok, stokMinimum, tenantID, updatedAt (dari `mappers/inventoryMapper.js` backend `f27f093`: `item.kategori` berisi `tipe` barang inventory; `isStokKritis` hanya true bila `stokMinimum` lebih dari 0 dan stok tidak melebihinya, sehingga `stokMinimum` 0 berarti tidak dipantau. Query yang dibaca service: `locationID`, `kategori` (dicocokkan dengan `BarangInventory.tipe`), dan `search`; tanpa `locationID` mengirim stok seluruh lokasi tenant. Respons `POST /inventory` kini ter-populate dan berbentuk sama)
- `GET /jadwalshift`: catatan, id, isLibur, karyawan{id, namaLengkap, role}, shift{id, isLintasHari, jamMasuk, jamPulang, namaShift, status}, tanggalKerja (dari `mappers/jadwalShiftMapper.js` backend `00b9957`: `tanggalKerja` berupa teks YYYY-MM-DD dari tanggal UTC, `shift` null untuk libur, dan `karyawan.namaLengkap` serta `karyawan.role` selalu "Tidak Diketahui", `temuan.md` butir 65. Query yang dibaca: `startDate` dan `endDate`, yang wajib berpasangan dan menyaring `tanggalKerja` dari tengah malam UTC tanggal pertama sampai tengah malam UTC tanggal kedua, serta `penggunaID`)
- `GET /jurnalstok`: _id, alasan, bahanBakuID{_id, namaBahan, satuan}, createdAt, dicatatOleh{_id, nama}, jumlah, keterangan, locationID{_id, nama, tipe}, tanggal, tenantID, tipeKoreksi, updatedAt
- `GET /kategori`: __v, _id, createdAt, keterangan, kodeKategori, namaKategori, tenantID{_id, namaToko}, updatedAt
- `GET /laporan/laba-rugi`: tanggal, totalBebanOperasional, totalDiskon, totalHPP, totalLabaBersih, totalLabaKotor, totalOmzet, totalPajak, totalPenjualanKotor, totalPenjualanSewa (dari `laporanController` dan `laporanService`: array per kelompok waktu, per jam untuk `harian` dan per tanggal untuk `mingguan` dan `bulanan`; respons juga membawa `ringkasan`, yang belum dibaca web. Sejak backend `465b438`, `startDate` dan `endDate` hanya diterima sebagai tanggal `YYYY-MM-DD` (ISO ditolak), `harian` wajib `startDate` sama dengan `endDate`, omzet tidak lagi memuat pajak, dan route memeriksa `read-laporan`. Web selalu mengirim ketiga query lewat `features/laporan` sebagai tanggal lokal (`keTanggalLokal`))
- `GET /location`: alamat, createdAt, id, koordinat{coordinates, type}, nama, radiusAbsen, tenantID, tipe, updatedAt (diurutkan dari yang terbaru, `locationService` baris 90 di backend `00b9957`, sehingga lokasi pertama bertipe Gudang adalah gudang terbaru; `koordinat.coordinates` berurutan longitude, latitude)
- `GET /location/current`: alamat, createdAt, id, koordinat{coordinates, type}, nama, radiusAbsen, tenantID, tipe, updatedAt (dari `locationService.getByTenant` backend `9cd1439` baris 108: lokasi pertama tenant bertipe Outlet, sama untuk setiap pengguna; null bila tenant belum punya outlet)
- `GET /metodepembayaran`: akunKas{id, namaAkun, nomorAkun}, createdAt, id, isActive, kategori, namaPembayaran, tenantID, updatedAt (sejak backend `465b438`, tanpa `showAll=true` hanya metode aktif yang dikirim)
- `GET /metodepembayaran/:param`: akunKas{id, namaAkun, nomorAkun}, createdAt, id, isActive, kategori, namaPembayaran, tenantID, updatedAt
- `GET /pajak`: _id, createdAt, modelPerhitungan, namaPajak, prioritas, statusPajak, tarifPajak, tenantID, tipePajak, updatedAt (dari `pajakService.getAll` backend `465b438`: diurutkan menurut `prioritas` lalu `createdAt`, tanpa mapper sehingga membawa `_id`; `tipePajak` true untuk per produk dan false untuk per transaksi, `modelPerhitungan` 1 inklusif, 2 eksklusif, dan 3 compound)
- `GET /pelanggan`: alamat, createdAt, email, id, namaPelanggan, nomorHp, poinLoyalitas, tenantID, tipePelanggan, updatedAt (dari `mappers/pelangganMapper.js` backend `yoga` `50eede7`: `nomorHp`, `email`, dan `alamat` null bila tidak diisi; pelanggan yang dihapus lunak tidak dikirim, terbukti di `tests/e2e/pelanggan/pelanggan.spec.ts`; daftar di-cache 300 detik dan dibersihkan saat buat, ubah, dan hapus)
- `GET /pembayaran`: akunKasID, catatan, createdAt, gatewayPaymentID, id, jumlahBayar, metodePembayaranID, noReferensi, penjualanID, qrString, status, tanggalBayar, tenantID, updatedAt (dari `mappers/pembayaranMapper.js` backend `00b9957`: `akunKasID`, `penjualanID`, dan `metodePembayaranID` berupa id string lewat `_extractId`, tanpa nama metode; service hanya membaca `tenantID`, sehingga daftar selalu berisi seluruh pembayaran tenant, `temuan.md` butir 43). Tidak dipanggil web lagi sejak `b85c2bd`. Sejak backend `yoga` `8fad4c0` item membawa `alasanVoid`
- `GET /pengajuanstok`: catatan, catatanPenolakan, createdAt, dariLokasi{id, nama, tipe}, dimintaOleh{id, nama}, disetujuiOleh, ditolakOleh, id, items[], jenisPengajuan, keLokasi{id, nama, tipe}, nomorPengajuan, status, tanggalApprove, tanggalKebutuhan, tanggalReject, tenantID, transferStokID, updatedAt (query yang dibaca service: `status`, `jenisPengajuan`, dan `locationID` untuk lokasi asal atau tujuan; status dibatasi menurut izin, `temuan.md` butir 21). Arah: `dariLokasi` adalah gudang asal barang dan `keLokasi` outlet peminta (`temuan.md` butir 23); `GET /pengajuanstok/:param` menambahkan `items[].stokGudangSaatIni`, yaitu stok item di `dariLocationID`
- `GET /pengajuanstok/:param`: catatan, catatanPenolakan, createdAt, dariLokasi{id, nama, tipe}, dimintaOleh{id, nama}, disetujuiOleh, ditolakOleh, id, items[], jenisPengajuan, keLokasi{id, nama, tipe}, nomorPengajuan, status, tanggalApprove, tanggalKebutuhan, tanggalReject, tenantID, transferStokID, updatedAt
- `GET /pengguna`: aksesType[], fotoKaryawan, id, nama, nomorHp, role, roleID, status
- `GET /pengguna/:param`: aksesType[], fotoKaryawan, id, nama, nomorHp, role, roleID, status (dari `mappers/penggunaMapper.js` backend `yoga` `50eede7`, dipakai juga respons `PUT /pengguna/:id`: `nomorHp` dan `fotoKaryawan` null bila kosong, `roleID` berupa id dan `role` nama peran, tanpa timestamps; detail di-cache 3.600 detik dan dibersihkan saat pengguna diubah)
- `GET /penjualan`: createdAt, dataPelanggan{_id, namaPelanggan, nomorHp, tipePelanggan}, dataPengguna{_id, nama}, diskonGlobal[], id, itemPenjualan[], jatuhTempo, jenisPenjualan, jenisTransaksi, jumlahDiskonTransaksi, jumlahPajakTransaksi, keterangan, locationID, noReferensi, pajakTransaksi[], sisaTagihan, statusBayar, statusPenjualan, tanggalTransaksi, tenantID, totalDibayar, totalHargaProduk, totalTagihan, updatedAt (dari `mappers/penjualanMapper.js` backend `00b9957`: `pajakTransaksi[]` dan `itemPenjualan[].rincianPajak[]` berbentuk `{_id, namaPajak, tarifPajak, jumlah, model}`, sedangkan `diskonGlobal[]` dan `itemPenjualan[].diskonItem[]` berisi hasil populate diskon. Sejak backend `465b438` daftar disaring di basis data menurut query yang sama (`statusBayar`, `statusPenjualan`, `jenisTransaksi`, `jenisPenjualan`, `pelangganID`, `startDate`, `endDate`, dan `noReferensi`) dan selalu per halaman: tanpa `page` dan `limit` dijawab 20 terbaru, dan respons membawa `pagination`. `statusPenjualan` bernilai DRAFT, UNPAID, PARTIAL, PAID, atau VOID; FINAL dihapus, dan UNPAID, PARTIAL, serta PAID dihitung dari pembayaran. Tanpa `locationID`, `temuan.md` butir 49. Sejak backend `yoga` `8fad4c0` daftar menerima `sort` (`tanggalTransaksi`, `totalTagihan`, atau `noReferensi`) dan `order` (`asc` atau `desc`), diterapkan sebelum `skip` dan `limit` dengan `_id` sebagai pemecah nilai kembar; tanpa keduanya tetap terbaru dulu, dan nilai lain ditolak 400. Item membawa `alasanVoid`, berisi alasan void atau null)
- `GET /penjualan/:param`: createdAt, dataPelanggan{_id, namaPelanggan, tipePelanggan}, dataPengguna{_id, nama}, diskonGlobal[], id, itemPenjualan[], jatuhTempo, jenisPenjualan, jenisTransaksi, jumlahDiskonTransaksi, jumlahPajakTransaksi, keterangan, locationID, noReferensi, pajakTransaksi[], sisaTagihan, statusBayar, statusPenjualan, tanggalTransaksi, tenantID, totalDibayar, totalHargaProduk, totalTagihan, updatedAt (bentuk seperti daftar; `dataPelanggan` detail mem-populate `alamat` dan `email`, bukan `nomorHp`. Sejak backend `465b438` detail juga membawa `pembayaran[]` berisi id, namaMetodePembayaran, jumlahBayar, uangDiterima, kembalian, status, tanggalBayar, dan catatan, termasuk pembayaran VOID; sejak backend `yoga` `8fad4c0` setiap pembayaran juga membawa `alasanVoid`, begitu pula penjualannya)
- `GET /permission`: __v, _id, deskripsi, grup, nama
- `GET /polaroster`: detailSiklus[], dibuatPada, id, keterangan, namaPola, siklusHari (dari `mappers/polaRosterMapper.js` backend `00b9957`: setiap `detailSiklus[]` berisi hariKe, isLibur, shiftID yang null untuk libur, dan shift{id, namaShift, jamMasuk, jamPulang, status} hasil populate. Service tidak membaca query apa pun, dan daftarnya di-cache 3.600 detik tanpa dibersihkan saat shift berubah, `temuan.md` butir 73)
- `GET /produk`: _id, createdAt, gambarProduk, hargaDasar, hargaJual, isUnlimitedStok, kategori, kategoriID, keterangan, namaProduk, pajakList[], resep[], stok, updatedAt (`stok` adalah potret: sejak backend `yoga` `5eb72e5` dihitung dari inventory lokasi (`locationID` payload, atau outlet tenant) saat produk dibuat atau diubah, dan tidak ikut berubah saat opname, transfer, atau penerimaan, `temuan.md` butir 37; `pajakList[]` berisi `{ _id, namaPajak }` dari field `pajak` di dokumen produk, bukan dari relasi `ProdukPajak` yang dipasang lewat `POST /produkpajak`, sehingga tidak mencerminkan pajak per produk yang dikenakan penjualan, butir 88)
- `GET /produk/:param`: _id, createdAt, gambarProduk, hargaDasar, hargaJual, isUnlimitedStok, kategori, kategoriID, keterangan, namaProduk, pajakList[], resep[], stok, updatedAt
- `GET /produkpajak/:param` (dari `produkPajakService.getPajakByTarget` backend `465b438`, bukan dari sampel cache kontrak): _id, produkID atau assetID, pajak{_id, nama, tarif, tipe, prioritas, model}. `model` berupa teks Inclusive, Exclusive, atau Compound, dan `statusPajak` tidak dikirim, karena relasi ke pajak nonaktif sudah disaring (`temuan.md` butir 93). Parameter dicocokkan dengan `produkID` maupun `assetID`; satu produk paling banyak punya satu relasi (upsert per produk)
- `GET /role`: deskripsi, id, level, namaRole, permissions[]
- `GET /role/:param`: deskripsi, id, level, namaRole, permissions[]
- `GET /sesibooking`: dataAset{id, namaAset, status}, dataPelanggan{id, namaPelanggan, tipePelanggan}, dataPengguna{id, nama}, dataPenjualan{_id, noReferensi, statusPenjualan, statusBayar, totalTagihan, totalDibayar, sisaTagihan, itemPenjualan[], dan lainnya}, dataTarif{id, harga, namaTarif}, durasiMenit, id, status, tenantID, totalBiaya, waktuMulai, waktuSelesai (dari `mappers/sesiBookingMapper.js` backend `00b9957`, bukan dari sampel cache kontrak: referensi dibentuk `_formatRef`, sehingga selalu `{ id, ...field }` atau null, dan `dataPenjualan` dari `_formatPenjualanOutput` membawa `_id`. Service hanya membaca query `tanggal` (YYYY-MM-DD lokal) dan menyaring `waktuMulai` pada tanggal itu tanpa menyaring status, sehingga booking VOID ikut terkirim. Sejak backend `465b438` status bernilai Aktif, Selesai, VOID (sebelumnya Batal), atau Tidak Datang, yang dihitung saat dibaca tanpa ditulis (`temuan.md` butir 58); item membawa `sudahDibayar`, `waktuCheckIn`, dan `batasCheckIn`; dan void penjualan membersihkan cache daftar per tanggal (butir 57, terbukti di `e4bfc86`). Sejak backend `yoga` `8fad4c0` daftar menerima `sort` (`waktuMulai`, `totalBiaya`, atau `createdAt`) dan `order`, yang tidak dipakai web, dan item membawa `alasanVoid`, yang disalin dari void penjualannya)
- `GET /shift`: dibuatPada, id, isLintasHari, jamMasuk, jamPulang, namaShift, status, toleransiTerlambat (dari `mappers/shiftMapper.js` backend `00b9957`, bukan dari sampel cache kontrak: tanpa `tenantID`, dan waktu dibuat bernama `dibuatPada`. Service hanya membaca query `status` dan mengurutkan menurut `jamMasuk`; tanpa query apa pun dijawab 500, `temuan.md` butir 8)
- `GET /stockopname` dan `GET /stockopname/:param` (dari `mappers/stockOpnameMapper.js`, bukan dari sampel cache kontrak; sekurang-kurangnya): catatan, catatanReview, id, items[] (itemId, namaSnapshot, satuanSnapshot, qtySystemSnapshot, qtyPhysical, varianceSnapshot, adaSelisih, catatanItem), lokasi{id, nama, tipe}, nomorOpname, pic{id, nama}, reviewer, status, stockAdjustment, tanggal (`qtyPhysical` dan `varianceSnapshot` null selama item belum dihitung, dan `adaSelisih` false untuk item itu; mapper backend `f27f093` baris 90 dan 93)
- `GET /stockopname/adjustments` (dari `mappers/stockOpnameMapper.js` backend `f27f093`, bukan dari sampel cache kontrak): alasan, createdAt, id, items[], lokasi{id, nama, tipe}, nomorAdjustment, pic{id, nama}, referenceID{id, nomorOpname, tanggal}, referenceType, tanggal, tenantID, updatedAt. `referenceID` berisi objek hasil populate (`stockOpnameService` baris 557), null untuk koreksi manual atau dokumen opname yang sudah tidak ada; `referenceType` bernilai `STOCK_OPNAME` atau `MANUAL_CORRECTION`. Query `referenceType` dan `locationID` divalidasi `validateAdjustmentQuery` di service, lalu dipakai sebagai filter (`getAllAdjustments` baris 538 sampai 552 di backend `9cd1439`)
- `GET /stockopname/adjustments/:param`: seperti daftar, dengan lokasi{alamat, id, nama, tipe} dan referenceID{id, nomorOpname, tanggal, picID} (`picID` tidak dipopulate, `stockOpnameService` baris 581). Setiap item: itemId, bahanBakuID, barangInventoryID, namaSnapshot, satuanSnapshot, qtySnapshot (stok saat draf dibuat), qtyCurrent (stok saat approval), qtyPhysical, dan qtyDifference (qtyPhysical dikurangi qtyCurrent); keempat kuantitas wajib di model
- `GET /tarif`: basisPerhitungan, createdAt, dataAset[], durasiMinimum, harga, hariAktif[], id, isActive, jamMulai, jamSelesai, namaTarif, prioritas, tenantID, updatedAt
- `GET /tarif/:param`: basisPerhitungan, createdAt, dataAset[], durasiMinimum, harga, hariAktif[], id, isActive, jamMulai, jamSelesai, namaTarif, prioritas, tenantID, updatedAt
- `GET /tenant/:param` (dari `mappers/tenantMapper.js` backend `yoga` `50eede7`, bukan dari sampel cache kontrak): absensiLokasiAktif, alamat, createdAt, emailBisnis, footerStruk, id, idNPWP, isSetupComplete, kodePos, kota, logoUrl, namaToko, nomorTelepon, persenPajak, status, tipePajak, updatedAt. Field teks yang belum diisi bernilai null. Controller menolak id yang bukan tenant sesi dengan 403, dan service menyimpan hasilnya 60 detik di cache yang dibersihkan saat `PUT`
- `GET /tipeaset`: createdAt, dataTarif[], deskripsi, id, namaTipeAset, tenantID, updatedAt
- `GET /tipeaset/:param`: createdAt, dataTarif[], deskripsi, id, namaTipeAset, tenantID, updatedAt
- `GET /transferstok`: createdAt, dariLokasi{id, nama, tipe}, id, items[], keLokasi{id, nama, tipe}, nomorTransfer, penerima{id, nama}, pengajuanStokID, pengirim{id, nama}, status, tanggalKirim, tanggalTerima, tenantID, updatedAt (dari `mappers/transferStokMapper.js` baris 49 sampai 75: setiap item berisi bahanBaku{id, namaBahan, satuan}, qtyKirim, qtyTerima, selisih yaitu qtyTerima dikurangi qtyKirim, dan catatanItem; qtyKirim dan qtyTerima dalam satuan dasar bahan baku. Tidak ada `bahanBakuID` di respons (`temuan.md` butir 28), dan `bahanBaku` null bila master bahan bakunya terhapus, karena populate menghasilkan null dan id-nya ikut hilang (butir 29). Sejak backend `465b438` setiap item juga membawa `id`, yang dipakai sebagai `itemId` saat terima, dan query daftar dilaporkan dibaca service (butir 33, belum dibuktikan dari web))
- `GET /transferstok/:param`: createdAt, dariLokasi{id, nama, tipe}, id, items[], keLokasi{id, nama, tipe}, nomorTransfer, penerima{id, nama}, pengajuanStokID, pengirim{id, nama}, status, tanggalKirim, tanggalTerima, tenantID, updatedAt (bentuk item sama dengan daftar)
