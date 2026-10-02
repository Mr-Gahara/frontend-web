# Status Refactor Frontend Web

Sifat perubahan: **Sering**, setiap modul selesai.

Keadaan pekerjaan refactor: fase yang sudah selesai, metrik, dan pekerjaan
berikutnya. Diperbarui setiap kali satu modul selesai (`docs/README.md`, Cara
memperbarui dokumentasi).

## Fase yang sudah selesai

### Fase 0 — Perbaikan bug dan konfigurasi test
Commit `751f4db` sampai `06857e1`. Pemisahan runner Playwright dan Vitest,
perbaikan auth, produk, reservasi, jadwal, pola roster, dan pengguna.

Keputusan produk yang dihasilkan tercatat di `keputusan.md` (Fase 0).

### Fase 1 — Audit kontrak API
Commit `668951d`, `7f05c24`. Hasilnya kontrak API berbasis bukti: 246 route
backend, bentuk respons tiap endpoint, aturan payload, kebutuhan izin per
halaman, dan daftar ketidaksesuaian. Awalnya satu berkas `docs/kontrak-api.md`
(1226 baris saat dibuat); sejak 20 September 2026 dipecah di `docs/kontrak/`
(cara membacanya di `docs/kontrak/README.md`).

### Fase 2 — Fondasi

| Tahap | Commit | Isi |
|---|---|---|
| 2.1 | `aab26f3` | `lib/api/endpoints.ts`, fallback `/bahan-baku` dibuang |
| 2.2 | `71aa3fc` | `ApiError`, normalisasi envelope dan `_id` ke `id` |
| 2.3 | `7070e14` | `types/api.ts`, tipe bahan baku dari kontrak |
| 2.4a | `ecceb6e` | Token di memori, pemulihan sesi lewat cookie |
| 2.4b | `421a582` | `ApiError` dari respons fetch, penanganan 403 dan 429 |
| 2.5 | `4336fc1` | `lib/auth/permissions.ts`, gate menu dari izin endpoint |
| 2.6 | `c8fb132` | Kunci cache hierarkis di 72 berkas |
| 2.7 | ditunda | Desain token (warna, tipografi, spasi). Sengaja dipisah dari refactor arsitektur |
| 2.8 | `059814d` | Modul percontohan bahan baku |

### Fase 3 — Migrasi per modul (sedang berjalan)

| Modul | Commit | Status |
|---|---|---|
| Pengguna | `7275d14` | Selesai |
| Role | `e17c572` | Selesai |
| Produk dan kategori | `53414dd`, `e0366c1`, `06f8fd8` | Selesai |
| Inventaris: stock adjustment | `a52afbf` | Selesai |
| Inventaris: jurnal stok | `98735d4` | Selesai |
| Bahan baku: perbaikan dialog hapus | `50e8815` | Selesai |
| Inventaris: stok dan inventaris gudang | `ad590f9` | Selesai |
| Inventaris: stock opname | `fc3f220` | Selesai |
| Cakupan lokasi owner dan staf: jurnal stok dan stok outlet | `6ca6da8` | Selesai |
| Penyesuaian backend `f27f093`: stock adjustment, gate stok, simpan hitungan opname, dan filter lokasi jurnal stok | `2b3b52d` | Selesai |
| Inventaris: pengajuan stok, lalu transfer, pengiriman, dan penerimaan | `59e10a1` (daftar pengajuan), `08d0a73` (arah lokasi), `90eb935` (detail, edit, buat), `dec9d01` (perbaikan terima penerimaan), `ad77a14` (transfer dan pengiriman gudang), `580a1e1` (penerimaan outlet) | Selesai |
| Izin lintas outlet: cakupan outlet dan outlet peminta pengajuan | `085ec78` | Selesai |
| Stock adjustment outlet hanya lokasi Outlet | `a5e9cec`, `fe5dd9c` (gate `read-location`) | Selesai |
| Gudang: cakupan per gudang | - | Dibatalkan (`keputusan.md`, Model bisnis MVP) |
| Gudang: halaman stock adjustment | `247cf2d` | Selesai |
| Perbaikan spec alur pengajuan stok | `8d62c56` | Selesai |
| Penjualan dan pembayaran | `e8c81b1` (fondasi), `c9640ce` (daftar), `69a5d5e` (detail), `8738752` (pembayaran), `f33ffa6` (buat) | Selesai |
| Spec login tanpa respons sukses palsu | `5a3deea` | Selesai |
| Spec master data reservasi | `a2adc70` (tipe aset), `4d3467f` (aset), `adbee4c` dan `04830b7` (tarif) | Selesai |
| Reservasi: tipe aset | `074e98c` | Selesai |
| Reservasi: aset | `d3ae182` | Selesai |
| Reservasi: tarif | `365553f` | Selesai |
| Reservasi: daftar reservasi | `27749fe` (spec), `eef371a` | Selesai |
| Komponen tanggal dan waktu (lintas modul) | `e43e000` | Selesai |
| Reservasi: buat reservasi | `652d669` (spec), `477f258` | Selesai |
| Keuangan | `0cfb3bd` (spec), `45187b6` | Selesai |
| Jadwal dan shift, termasuk pola roster dan monitoring absensi | `d9af531` (spec), `f99b7cf` (shift), `dcc22e0` (pola roster), `19227f8` dan `e2a0cfd` (jadwal), `845c2cf` (monitoring absensi) | Selesai |
| Gudang: layout, setup, pengaturan, dan dashboard | `2d7225b` (spec), `9ce288b` (layout, setup, dan lokasi sidebar), `319bd99` (pengaturan) | Selesai (keputusan GD1a sampai GD6a). Eksekusi dashboard gudang ditunda sampai pemilik proyek menentukan layout dan UI/UX-nya (Utang kecil dari modul Gudang). Halaman stok gudang sudah dimigrasikan di modul inventaris (`580a1e1`), termasuk stock adjustment (`247cf2d`); pengguna gudang ikut modul Pengguna (`7275d14`), dan jadwal, shift, serta pola roster gudang ikut modul Jadwal dan shift |
| Penyesuaian backend `465b438`: keuangan, penjualan, pembayaran, reservasi, transfer stok, pembersihan data uji, dan paginasi daftar penjualan | `b85c2bd` (penyesuaian), `a10af75`, `e4bfc86`, `8134842`, `31ebd92` (fixme dilepas), `6e314ae` (terima), `b5a55c4` (data uji), `b63cf08` (paginasi) | Selesai (Catatan dari penyesuaian backend `465b438`) |
| Pengaturan outlet: metode pembayaran | `9ca273a` (spec), `3359497` | Selesai (keputusan PO1a sampai PO5a dan PO10a; Catatan dari submodul metode pembayaran) |
| Pengaturan outlet: pajak | `9586e3c` (spec), `e0aaeca`, `b84de56` (komentar) | Selesai (keputusan PO6a sampai PO9a; Catatan dari submodul pajak). Spec pembanding metode pembayaran diperbaiki di `cc65d93` |
| Role: template tanpa permission di luar seed (PO11a) | `366e9b7` | Selesai (Catatan dari PO11a) |
| Penyesuaian backend `yoga` `50eede7`: fixture stok penjualan, `alasanVoid`, urutan server daftar penjualan, dan lokasi stok produk | `65edf8c` (fixture), `a4304ce` (penyesuaian) | Selesai (keputusan PY4a sampai PY7a; Catatan dari penyesuaian backend `yoga`) |
| Pengaturan outlet: profil outlet | `ca6eb3d` (menu sidebar setelah muat ulang), `fcf2dd2` | Selesai (keputusan PO12a sampai PO16a; Catatan dari submodul profil outlet) |
| Pelanggan | `b6de75c` (spec), `d9365d3` | Selesai (keputusan PD1a dan PD5a; Catatan dari submodul pelanggan) |
| Diskon | `8cb6f31` (spec), `1e05df6` (halaman), `54f2938` (aturan), `52c550e` (pilihan kasir) | Selesai (keputusan PD2a sampai PD4a dan PD6a sampai PD9a; Catatan dari submodul diskon) |
| Profil, login, dan sidebar | - | **Berikutnya** (lihat Pekerjaan berikutnya). `app/dashboard/profil/page.tsx`, `app/login/page.tsx`, `app/login/pengguna/page.tsx`, dan `components/app-sidebar.tsx` masih memakai `apiClient`. Nama toko di sidebar dan halaman profil sudah dibaca lewat `useTenant` (`fcf2dd2`), dan effect sidebar mengikuti sesi (`ca6eb3d`) |

Keputusan produk tiap modul tercatat di `keputusan.md`.

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul.
Diukur ulang per submodul diskon (`52c550e`):

| Hal | Awal | Setelah diskon `52c550e` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 7 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan; dari 25 per `845c2cf` menjadi 16, lewat penyesuaian `465b438` dan halaman metode pembayaran, lalu 12 setelah halaman pajak (`e0aaeca`), 9 setelah halaman pelanggan (`d9365d3`), dan 7 setelah halaman diskon (`1e05df6`) |
| Kemunculan `_id` | - | 9 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id`. Perintahnya ikut menghitung komentar: naik 1 di `eef371a` dari komentar normalisasi di `features/sesi-booking/api.ts`. Turun 13 di `45187b6`: 12 dari data tiruan mutasi arus kas dan 1 dari daftar akun kas. Turun 3 di `f99b7cf`: 4 dari halaman dan tabel shift, dikurangi 1 dari komentar normalisasi di `features/shift/api.ts`. Turun 7 di `dcc22e0` dari halaman, tabel, dan form pola roster. Turun 7 di `19227f8` dari halaman jadwal outlet, jadwal gudang, dan generate. Turun 9 lagi sampai `3359497`, dari penyesuaian `465b438` dan halaman metode pembayaran. Turun 7 di `e0aaeca` dari halaman pajak. Turun 2 di `d9365d3` dari halaman pelanggan. Turun 2 di `1e05df6` dari halaman diskon |
| `useAuthGuard()` berulang di halaman | 49 | 27 | Dihitung di `app/` saja, termasuk `app/dashboard/layout.tsx`, yang sudah memanggilnya untuk seluruh dashboard; pemanggilan di halaman karena itu berulang. Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, keempat halaman penjualan, buat reservasi, shift outlet, pola roster outlet, ketiga halaman metode pembayaran, halaman pelanggan, dan halaman diskon) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | - | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | 4 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.088 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## Pekerjaan berikutnya: modul Profil, login, dan sidebar

Modul terakhir Fase 3; modul Pelanggan dan diskon selesai di `52c550e`.
`app/dashboard/profil/page.tsx`, `app/login/page.tsx`,
`app/login/pengguna/page.tsx`, dan `components/app-sidebar.tsx` masih
memakai `apiClient`. Pemetaannya belum diambil; yang sudah diketahui dari
modul lain:

- Sidebar: effect yang menyalin nama, role, dan izin dari sesi sudah
  mengikuti sesi (`ca6eb3d`), dan nama toko dibaca lewat `useTenant`
  (`fcf2dd2`). Sisanya masih state lokal yang disalin di effect, satu
  `any` di pemanggilan `GET /pengguna/:id`, dan pemuatan lokasi lewat
  `useDaftarLokasi` (GD5a).
- Payload token pengguna tidak membawa `nama`, sehingga nama pengguna di
  sidebar bergantung pada `GET /pengguna/:id`, yang mewajibkan
  `read-pengguna` (`kontrak/README.md` bagian 2.2).
- `tenantName` masih ada di `PenggunaSesi` tanpa pembaca
  (`kontrak/temuan.md` butir 98).
- Halaman profil memanggil `PUT /pengguna/:id` langsung; itu satu-satunya
  endpoint yang masih dipanggil `features/` sekaligus halaman lama (audit
  `52c550e`).
- Spec login sempat habis waktu sekali di halaman login PIN dengan pesan
  "Token akun tidak ditemukan" (`pengujian.md`, Utang pengujian);
  penyebabnya belum diketahui.

Langkah pertama sesi berikutnya, setelah backend di-`fetch` dan
dibandingkan dengan acuan (`cara-kerja.md`): petakan keempat berkas itu
(jumlah baris, `apiClient`, `any`, `_id`, dan `queryKey`), lalu ajukan
pembagian submodulnya.

## Catatan dari submodul diskon

Submodul 2 modul Pelanggan dan diskon selesai pada 2 Oktober 2026 dalam
empat commit, dan dengan itu modul Pelanggan dan diskon selesai.

| Commit | Isi |
|---|---|
| `8cb6f31` | Spec pembanding terhadap kode lama |
| `1e05df6` | Halaman ke `features/diskon`: ubah mengirim `PUT`, aktifkan dan nonaktifkan, aturan baca-saja (PD2a, PD3a) |
| `54f2938` | Form mengelola aturan tambahan (PD3a, PD6a sampai PD9a) |
| `52c550e` | Pilihan diskon kasir mengikuti `sedangBerlaku` (PD4a) |

- Halaman lama membaca `_id` dari respons ber-`id`, sehingga ubah
  mengirim `POST` dan hapus memanggil route yang tidak ada; dibuktikan
  lewat test terhadap kode lama sebelum spec pembanding di-commit
  (`kontrak/temuan.md` butir 110).
- Lapisan data dan komponen di `features/diskon` (`arsitektur.md`).
  Halaman diskon, buat penjualan, dan buat reservasi berbagi satu cache
  `diskon.daftar()`, dan filter halaman menyaring di klien.
- Backend `yoga` menegakkan aturan diskon saat penjualan dan booking
  disimpan. Web kini dapat membuat dan mengubah aturan itu, dan pilihan
  diskon kasir hanya menawarkan diskon yang sedang berlaku.
- Diskon tidak dapat dihapus, sehingga diskon uji dibuat Non-Aktif dan
  tertinggal lima per run suite penuh (`pengujian.md`, Utang pengujian).
- Temuan backend baru: butir 107 sampai 109, dilaporkan 2 Oktober 2026
  (`backend.md`). Kontrak diskon dikoreksi terhadap `yoga`
  (`kontrak/payload.md`, `kontrak/endpoint.md`).
- Tipe berakhiran `Lama` habis di seluruh repo.
- Keputusan pemilik proyek: `keputusan.md` (Modul Pelanggan dan diskon,
  PD2a sampai PD4a dan PD6a sampai PD9a).

## Catatan dari submodul pelanggan

Submodul 1 modul Pelanggan dan diskon selesai pada 2 Oktober 2026: spec
pembanding (`b6de75c`) dan migrasi (`d9365d3`). Halaman pelanggan tidak
lagi memakai `apiClient`, dan `PelangganLama` dihapus.

- Lapisan data dan komponen di `features/pelanggan` (`arsitektur.md`).
  Halaman, buat penjualan, dan buat reservasi berbagi satu cache
  `pelanggan.daftar()`.
- Dialog konfirmasi buat dan hapus kini hanya tertutup saat berhasil
  (keputusan Fase 0), label terhubung ke isiannya, dan daftar yang gagal
  dimuat tampil sebagai pesan.
- Backend menjawab 200 saat nomor HP, email, atau alamat dikosongkan
  tanpa mengubah nilainya (`kontrak/temuan.md` butir 104); web mengirim
  teks kosong lalu memperingatkan dari hasil simpan (PD5a), dan skenario
  pengosongannya menunggu sebagai `test.fixme`.
- `PUT /pelanggan/:id` menerima operator MongoDB dari body, dibuktikan
  lewat permintaan nyata (butir 105, alasan keamanan). Temuan backend
  baru: butir 104 sampai 106, dilaporkan 2 Oktober 2026 (`backend.md`).
- Satu selector spec pembanding berubah di commit migrasi, karena dialog
  yang kini bertahan menyembunyikan `main` dari pohon aksesibilitas
  (`pengujian.md`, Catatan Playwright).
- Kontrak pelanggan dikoreksi terhadap `yoga` (`kontrak/payload.md`,
  `kontrak/endpoint.md`).
- Keputusan pemilik proyek: `keputusan.md` (Modul Pelanggan dan diskon).

## Catatan dari submodul profil outlet

Submodul 3 modul Pengaturan outlet selesai pada 2 Oktober 2026 dalam dua
commit: perbaikan menu sidebar setelah muat ulang (`ca6eb3d`) dan halaman
Profil Toko (`fcf2dd2`). Dengan itu modul Pengaturan outlet selesai.

- Lapisan data di `features/tenant` (`arsitektur.md`). Halaman memuat dua
  kartu dengan simpan masing-masing: profil tenant, dan lokasi Outlet
  lewat `IsianLokasi` (keputusan PO12a sampai PO14a).
- Token hasil `pin-refresh` membawa `tenantName` "Toko Tidak Diketahui"
  (`kontrak/temuan.md` butir 98), sehingga nama toko di sidebar dan
  halaman profil dibaca dari `GET /tenant/:id` (PO15a). Token tetap
  membawa role dan seluruh izin.
- Menu berizin dan nama pengguna di sidebar hilang setelah halaman dimuat
  ulang, karena effect sidebar hanya berjalan sekali sebelum sesi pulih.
  Itu bug frontend, diperbaiki di `ca6eb3d` (PO16a). Spec generate jadwal
  ikut dikoreksi, karena selama ini lolos berkat kaki sidebar yang kosong
  (`pengujian.md`, Catatan Playwright).
- Spec pembanding tidak ditulis, karena halaman lama hanya placeholder;
  ketujuh skenario ditulis bersama migrasi, seluruhnya lewat UI
  (keputusan rancangan butir 23).
- `urlSetup` form buat stock opname outlet kini menuju halaman Profil
  Toko, dan frasa "jam operasional" dibuang dari kartu indeks pengaturan.
- Payload token pengguna tidak membawa `nama`, sehingga nama pengguna di
  sidebar bergantung pada `GET /pengguna/:id`, yang mewajibkan
  `read-pengguna`. Ditinjau bersama modul Profil, login, dan sidebar.
- Temuan backend baru: butir 98 sampai 103, dilaporkan 2 Oktober 2026
  (`backend.md`). Kontrak tenant ditambahkan ke `kontrak/endpoint.md`,
  `kontrak/payload.md`, dan `kontrak/izin-halaman.md`.

## Catatan dari penyesuaian backend `yoga`

Backend lokal berpindah ke `origin/yoga` `50eede7` pada 1 Oktober 2026
(keputusan PY1a), sembilan commit di depan `465b438`. Route dan seed tidak
berubah: audit endpoint sama dengan sebelumnya, dan permission basis data
tetap sama dengan seed. Suite pertama terhadap `yoga` menghasilkan 332
lolos dan 15 gagal: empat belas test penjualan berhenti di fixture stok,
dan satu kejadian butir 77.

| Commit | Isi |
|---|---|
| `65edf8c` | Fixture stok penjualan mengikuti `produk.stok` dari inventory outlet (PY4a) |
| `a4304ce` | `alasanVoid` untuk pembayaran dan penjualan (PY5a), urutan server daftar penjualan (PY6a), dan `locationID` produk (PY7a) |

- Butir 11, 75, dan 83 terbukti diperbaiki backend lewat e2e. Butir 37
  tertutup sebagian: `produk.stok` bersumber dari outlet, tetapi tetap
  potret dan tetap memblokir finalisasi, sehingga `test.fixme`-nya
  dipertahankan.
- Dampak dibaca dari diff kode `465b438..yoga` per modul, bukan dari judul
  commit (`cara-kerja.md`).
- Kontrak produk, penjualan, pembayaran, dan sesi booking dikoreksi
  terhadap `yoga` (`kontrak/README.md`). Laporan untuk tim backend ada di
  `backend.md` (laporan penyesuaian `yoga`).

## Catatan dari PO11a

Diterapkan pada 1 Oktober 2026 (`366e9b7`), sebelum penyesuaian `yoga`
dan submodul profil outlet (keputusan PY2a).

- Lima permission yang tidak ada di seed backend dibuang dari template
  Manajer dan General Manajer di `lib/roleTemplates.ts`. Silang seluruh
  nama izin template terhadap `seeds/permissionSeed.js` backend: tidak
  ada lagi nama di luar seed.
- `POST /role` menolak nama izin yang tidak dikenal (400), tetapi halaman
  buat posisi dari template dan form role selalu mengirim id dan membuang
  nama tanpa padanan diam-diam. Dampak yang terlihat hanya badge
  "N Wewenang" yang lebih besar daripada izin tersimpan.
- Basis data development masih memuat kelima permission lama dan belum
  memuat tiga izin jurnal transfer, karena seed `465b438` belum dijalankan
  ulang. Diselaraskan langsung (keputusan PY3a, `refactor/backend.md`),
  dan temuannya dicatat di `kontrak/temuan.md` butir 97.

## Catatan dari submodul pajak

Submodul 2 modul Pengaturan outlet selesai pada 1 Oktober 2026: spec
pembanding (`9586e3c`), migrasi (`e0aaeca`), dan pelurusan komentar
invalidasi (`b84de56`). Tidak ada lagi halaman pajak yang memakai
`apiClient`, dan delapan tipe pajak lama dihapus.

- Lapisan data dan komponen di `features/pajak` (`arsitektur.md`). Buat
  penjualan tetap memakai `useDaftarPajak`.
- Seluruh operasi di kedua spec pajak berjalan lewat UI (keputusan
  rancangan butir 23), dengan helper bersama di
  `tests/helpers/pajak-uji.ts`. Aturan ini menemukan form buat lama yang
  menahan submit sampai prioritas diketik.
- `pajakList` di respons produk tidak mencerminkan pajak per produk yang
  dipasang, karena dibentuk dari field `pajak` dokumen produk, bukan dari
  relasi (`kontrak/temuan.md` butir 88); web tidak menampilkannya.
- Temuan backend baru: butir 88 sampai 96, dilaporkan 1 Oktober 2026.
- Kontrak pajak dan produk pajak dikoreksi terhadap `465b438`
  (`kontrak/payload.md`, `kontrak/endpoint.md`).
- Suite penuh `e0aaeca` sempat gagal di spec pembanding metode pembayaran,
  karena metode uji yang menumpuk mendorong `CASH` ke halaman kedua tabel;
  spec itu kini mencari lewat kotak pencarian (`cc65d93`).
- Keputusan pemilik proyek: `keputusan.md` (Modul Pengaturan outlet, PO6a
  sampai PO10a, dan keputusan rancangan butir 23).

## Catatan dari submodul metode pembayaran

Submodul 1 modul Pengaturan outlet selesai pada 1 Oktober 2026: spec
pembanding (`9ca273a`) dan migrasi (`3359497`). Tidak ada lagi halaman
metode pembayaran yang memakai `apiClient`, dan hapus diganti aktifkan dan
nonaktifkan (keputusan PO2a).

- Lapisan data di `features/metode-pembayaran` (`arsitektur.md`). Pilihan
  kasir di pembayaran penjualan tetap memakai metode aktif saja, sedangkan
  halaman kelola memakai `useDaftarMetodePembayaran({ semua: true })`.
- Butir 84 dan bagian metode pembayaran butir 82 selesai. Temuan backend
  baru: butir 85 sampai 87, serta perluasan butir 77 (`kontrak/temuan.md`).
- Kontrak `PUT /metodepembayaran/:id` dikoreksi terhadap `465b438`
  (`kontrak/payload.md`).
- Keputusan pemilik proyek: `keputusan.md` (Modul Pengaturan outlet, PO1a
  sampai PO5a dan PO10a).

## Catatan dari penyesuaian backend `465b438`

Backend di-fast-forward ke branch `nizar` `465b438` pada 30 September
2026, sebelumnya `ridho` `00b9957`. Suite pertama terhadap backend itu
menghasilkan 306 lolos, 8 gagal, dan 24 skipped; penyesuaiannya selesai
dalam delapan commit, dengan keputusan PB1a sampai PB14a (`keputusan.md`).

| Commit | Isi |
|---|---|
| `b85c2bd` | Penyesuaian keuangan, penjualan, pembayaran, reservasi, dan transfer stok (52 berkas) |
| `a10af75`, `e4bfc86`, `8134842`, `31ebd92` | `test.fixme` yang terbukti diperbaiki backend dilepas: hapus pengguna, timeline setelah void booking (R3a), hapus tarif, dan pelepasan tarif dari tipe aset |
| `6e314ae` | Terima surat jalan dengan `itemId` dan jumlah 0 sebagai barang tidak sampai, diuji sungguhan lewat UI |
| `b5a55c4` | Pembersihan data uji diperiksa; akun kas uji bersaldo 0 lalu dinonaktifkan |
| `b63cf08` | Footer `DataTable` memakai paginasi server, dengan pilihan jumlah baris |

- Kontrak dikoreksi terhadap `465b438` untuk penjualan, pembayaran,
  laporan, sesi booking, tipe aset, transfer stok, dan buat akun kas
  (`kontrak/payload.md`, `kontrak/endpoint.md`). Metode pembayaran
  dikoreksi 1 Oktober 2026 (`3359497`), begitu pula pajak (`e0aaeca`);
  pelanggan dikoreksi 2 Oktober 2026 (`d9365d3`), begitu pula diskon
  (`1e05df6`).
- Audit endpoint mencatat backend kini memiliki 243 route: tujuh route
  Lampiran A hilang, termasuk `DELETE /akunkas/:id`, `DELETE /diskon/:id`,
  dan `DELETE /metodepembayaran/:id`, dan empat route baru belum dipakai
  web, yaitu mutasi dan ringkasan akun kas serta check-in sesi booking.
  Lampiran A tidak diubah sampai pembangkitan ulang (`kontrak/README.md`).
- Status penjualan kini DRAFT, UNPAID, PARTIAL, PAID, dan VOID. Booking
  tersimpan UNPAID dan dapat di-void selama belum dibayar, sehingga web
  punya jalur batal booking lewat void penjualan (PB2a).
- Temuan untuk tim backend: `kontrak/temuan.md` butir 75 sampai 83.
  Butir 29, 30, 41, 43, dan 53 sampai 57 terbukti diperbaiki, butir 52
  sebagian, dan butir 33 serta 58 dilaporkan diperbaiki tetapi belum
  dibuktikan dari web.
- `test.fixme` yang masih gagal terhadap `465b438`: jurnal Keluar yang
  langsung terbaca (butir 46), stok produk tingkat tenant (butir 37), dan
  ubah pola roster (validator model).
- Lima akun kas uji bersaldo yang tertinggal dihapus langsung dari basis
  data development beserta mutasi saldo awalnya (PB13a); setiap run kini
  meninggalkan satu akun kas uji non-aktif bersaldo 0.

## Catatan dari modul Gudang

Modul Gudang selesai pada 30 September 2026, kecuali dashboard gudang
yang eksekusinya ditunda (keputusan GD1a): spec pembanding (`2d7225b`),
layout, setup, dan lokasi sidebar (`9ce288b`), serta pengaturan gudang
(`319bd99`). Tidak ada lagi halaman ruang gudang yang memakai
`apiClient`, dan `LokasiListResponse` sudah dihapus.

- Lapisan data lokasi tetap satu, di `features/inventaris`: api dan hook
  buat serta perbarui lokasi, `akses-gudang.ts` untuk keputusan layout,
  `schema-lokasi.ts` untuk form, dan `IsianLokasi` untuk isian yang
  dipakai setup dan pengaturan. Sidebar dan layout gudang berbagi cache
  `lokasi.daftar()` (keputusan rancangan butir 12).
- Layout tidak lagi mengalihkan setiap galat ke `/dashboard`, sehingga
  pengalihan berputar bagi pengguna yang hanya punya ruang gudang hilang
  (GD4a). Jalur selain Owner hanya teruji di unit test.
- Setup yang berhasil tidak diuji e2e, karena tenant uji sudah punya
  gudang (GD6a). Pengaturan diuji dengan mengubah nama "Gudang A"
  sungguhan lalu mengembalikannya.
- Kontrak lokasi dikoreksi terhadap backend `00b9957`: `POST /location`
  dan `PUT /location/:id` di `payload.md`, serta urutan `GET /location`
  di `endpoint.md`. Temuan dashboard gudang dan outlet tercatat di
  `kontrak/temuan.md` butir 74 dan sudah dilaporkan.
- Keputusan pemilik proyek untuk modul ini ada di `keputusan.md` (Modul
  gudang, GD1a sampai GD6a).

## Catatan dari modul jadwal dan shift

Modul jadwal dan shift selesai pada 29 September 2026 dalam empat
submodul: shift (`f99b7cf`), pola roster (`dcc22e0`), kalender, kelola
manual, dan generate jadwal (`19227f8` dan `e2a0cfd`), serta monitoring
absensi (`845c2cf`). Spec pembandingnya di `d9af531`. Seluruh lapisan
data kini di `features/shift/`, `features/pola-roster/`,
`features/jadwal/`, dan `features/absensi/`, dan tidak ada lagi halaman
modul ini yang memakai `apiClient`.

- Endpoint yang terlibat: `/jadwalshift` (termasuk `bulk`), `/shift`,
  `/polaroster`, `/pengguna`, dan `/absensi/monitoring`. Route jadwal,
  shift, dan pola roster tanpa `checkPermission` (`kontrak/temuan.md`
  butir 5); monitoring absensi memeriksa `read-absensi` di controller.
  Halaman jadwal dan generate jadwal bergate `read-pengguna`, dan enam
  permission jadwal belum ada di seed (butir 4). `GET /shift` tanpa
  query string dijawab 500 (butir 8).
- Shift, pola roster, dan absensi belum dapat dipisahkan per lokasi di
  backend (keputusan SH5a, `kontrak/temuan.md` butir 70). Shift dan pola
  roster menunggu lewat konstanta null; widget absensi menyaring dengan
  karyawan ruang (AB4a).
- Edit pola roster menunggu backend (`test.fixme`), dan pola roster
  memakai hapus permanen (keputusan Fase 0).
- Spec: `tests/e2e/jadwal/` (jadwal, pola roster, dan shift) dengan
  fixture di `tests/helpers/jadwal-uji.ts`, serta
  `tests/e2e/pengguna/absensi-widget.spec.ts`. Keputusan modul tercatat
  di `keputusan.md` (Modul jadwal dan shift), dan laporan backend di
  `kontrak/temuan.md` butir 62 sampai 73.

## Catatan dari modul keuangan

Modul keuangan selesai pada 28 September 2026: spec pembanding (`0cfb3bd`)
dan migrasi (`45187b6`). Tidak ada lagi halaman keuangan yang memakai
`apiClient`, dan tidak ada data tiruan.

- Lapisan data ada di `features/akun-kas` (daftar, buat, dan skema) dan
  `features/laporan` (laba rugi dan aturan periode di `periode.ts`);
  halamannya tetap di `app/` dengan tampilan lama.
- Ringkasan laba rugi meminta dua rentang per periode, berjalan dan
  pembanding (KU5a). Kartu ringkasan dipasang di `layout.tsx` dan meminta
  bulan kalender penuh serta `GET /akunkas`, sehingga pengguna tanpa
  `read-akunkas` melihat `-` di kartu saldo (KU2a,
  `kontrak/izin-halaman.md`).
- Mutasi arus kas menunggu endpoint mutasi kas dari backend
  (`kontrak/temuan.md` butir 61, keputusan KU1a).
- Setup tenant membuat akun kas bawaan "Kas Kecil (Laci)" `CASH-001` dan
  metode pembayaran "Tunai" yang bergantung padanya
  (`tenantService.createWithOwner`). Spec keuangan hanya menutup akun
  uji yang dibuatnya sendiri: sejak `b5a55c4` akun uji dibuat bersaldo 0
  lalu dinonaktifkan, karena `DELETE /akunkas/:id` tidak ada lagi dan akun
  bersaldo tidak dapat ditutup (`kontrak/temuan.md` butir 81).
- `AkunKasLama` dan `AkunKasRefLama` dihapus bersama migrasi metode
  pembayaran (`3359497`).
- Keputusan pemilik proyek untuk modul ini ada di `keputusan.md` (Modul
  keuangan, KU1a sampai KU7a).

## Catatan dari modul reservasi

Modul reservasi selesai pada 28 September 2026: tipe aset (`074e98c`),
aset (`d3ae182`), tarif (`365553f`), daftar reservasi (`27749fe`,
`eef371a`), komponen tanggal dan waktu (`e43e000`), dan buat reservasi
(`652d669`, `477f258`). Tidak ada lagi halaman reservasi yang memakai
`apiClient`, dan tidak ada berkas reservasi di atas 700 baris.

- Booking dari web dibuat lewat jalur batch dan selalu membuat penjualan
  berjenis `booking` berstatus FINAL; `simpanDraft` diabaikan, sehingga
  ubah dan hapus sesi booking selalu ditolak. Penjualan FINAL tidak dapat
  di-void langsung, sehingga web tidak punya jalur batal booking
  (`kontrak/temuan.md` butir 56); booking uji dibatalkan lewat bayar,
  hapus pembayaran, lalu void penjualannya (keputusan R2c dan R4b). Void
  penjualan membatalkan sesi booking-nya (`penjualanService.update`).
  Sejak backend `465b438` penjualan booking tersimpan UNPAID, dan booking
  dibatalkan lewat void penjualannya (Catatan dari penyesuaian backend
  `465b438`).
- Tarif dipilih otomatis oleh backend menurut tipe aset, hari, jam, dan
  prioritas, dan status aset "digunakan" dihitung dari booking Aktif yang
  sedang berjalan.
- Kontrak sesi booking dikoreksi pada 27 September 2026: validator dan dua
  jalur `POST /sesibooking` di `payload.md`, serta bentuk respons daftar
  di `endpoint.md` bagian 3.3. Route sesi booking per id tidak dipakai
  web, sehingga hanya tercatat di Lampiran A.
- Void penjualan tidak membersihkan cache daftar booking per tanggal
  (butir 57); diperbaiki backend `465b438`, dan `test.fixme` R3a dilepas
  di `e4bfc86`. Sebelumnya satu skenario daftar reservasi menunggu backend
  (keputusan R3a), dan slot booking uji di spec buat reservasi digeser
  menurut menit dan urutan pemanggilan agar tidak tertahan daftar yang
  basi.
- Daftar sesi booking menulis status Selesai saat dibaca (butir 58,
  dilaporkan diperbaiki di `465b438`), dan
  sekitar 930 baris kode lama dikomentari di service sesi booking (butir
  59). Temuan master data reservasi tercatat di butir 51 sampai 55.
  Calon temuan yang belum dibuktikan dari kode: keberadaan tipe aset tidak
  diperiksa saat aset dibuat, dan `voidPenjualan` tidak terpakai.
- Data uji reservasi bernama tetap dan dibuat sekali: tipe aset, aset,
  aset berstatus perbaikan, tarif, pelanggan, serta diskon item dan diskon
  global uji. Setiap run spec daftar dan buat reservasi meninggalkan
  booking VOID (sebelumnya Batal) dan penjualan booking VOID.
- Keputusan pemilik proyek untuk modul ini ada di `keputusan.md` (Modul
  reservasi, R1a sampai R9b, serta T1a sampai T4a untuk tarif).

## Catatan dari modul inventaris

Modul inventaris (24 halaman, sekitar 8.900 baris) dikerjakan dalam enam
submodul, masing-masing dengan spec pembanding, suite penuh, dan commit
sendiri:

| No | Submodul | Baris | Commit |
|---|---|---|---|
| 1 | Stock adjustment | 431 | `a52afbf` |
| 2 | Jurnal stok | 617 | `98735d4` |
| 3 | Stok dan inventaris gudang | 1.094 | `ad590f9` |
| 4 | Stock opname | 2.544 | `fc3f220` |
| 5 | Pengajuan stok | 2.298 | `59e10a1`, `08d0a73`, `90eb935` |
| 6 | Transfer, pengiriman, penerimaan | 1.950 | `dec9d01`, `ad77a14`, `580a1e1` |

Angka `diff` antarhalaman tidak cukup untuk memutuskan penyatuan. Jurnal
stok (341 dari 617 baris berbeda, hampir seluruhnya teks), stock opname, dan
daftar pengajuan stok (161 dari 474) disatukan, sedangkan stok dan
inventaris gudang, detail pengajuan, serta seluruh halaman surat jalan hanya
berbagi lapisan `features/`. Baca isi perbedaannya lewat `diff` tanpa baris
`className` sebelum memutuskan.

Yang masih berlaku:

- `features/inventaris` memuat seluruh hook lokasi, stok, dan cakupan
  (`arsitektur.md`); jangan membuat hook serupa (keputusan rancangan butir
  12).
- `kontrak/izin-halaman.md` sudah diselaraskan dengan `IZIN_HALAMAN` untuk
  halaman yang disebut kalimat pembukanya; baris lain masih mencerminkan
  keadaan sebelum Fase 2 dan diperbarui saat halamannya dimigrasikan.
- `kontrak/temuan.md` butir 10: operasi tulis tanpa validator di modul lain
  masih perlu ditelusuri sampai ke service, termasuk validator yang
  dipanggil dari service (butir 22). Stock opname, pengajuan stok, transfer
  stok, dan inventory sudah diperiksa.
- Belum diverifikasi: `inventoryService` (sekitar baris 106 di backend
  `f27f093`) membangun `new RegExp(search, "i")` langsung dari masukan
  pengguna. Dugaannya, karakter seperti `(` membuat pencarian stok dijawab
  500. Buktikan lewat e2e atau trace sebelum dilaporkan ke backend atau
  ditangani di frontend.
- Belum diverifikasi: `kontrak/payload.md` mencatat `PUT /bahanbaku/:id`
  memakai `locationID` untuk injeksi stok awal, tetapi
  `bahanBakuService.update` di backend `9cd1439` (baris 124 sampai 140)
  hanya menjalankan `$set` atas body. Telusuri route dan controller-nya
  sebelum kontrak dikoreksi.
- `components/calendar.tsx` (240 baris) adalah kalender kostum standar
  sejak `e43e000` (keputusan rancangan butir 22) dan dipakai lewat
  `PilihTanggal`; kedua `any`-nya belum dibereskan.
- `app/dashboard/outlet/inventaris/components/` berisi
  `bahanBakuCombobox.tsx` (dipakai `features/produk/form-produk.tsx`, lihat
  utang modul produk) dan `inventaris-nav-tabs.tsx`.
- Tambah barang di inventaris gudang hanya menawarkan master bahan baku.
  Barang inventory non-bahan (`barangInventoryID`, `/baranginventory`)
  belum dipakai web sama sekali; master data tetap bersumber dari outlet
  (`keputusan.md`, Model bisnis MVP). Dirapikan di modul gudang.
- Di ruang gudang, `gudang/layout.tsx` dan `gudang/setup` memakai
  `features/inventaris` sejak `9ce288b` (modul Gudang). Jadwal gudang
  sudah beralih ke `features/jadwal` di `19227f8`.
- Backend lokal: branch `ridho` `9cd1439`, yang menggabungkan origin/yoga
  `f0b7157` (21 September 2026, belum di-push). Berkas transfer stok tidak
  berubah sejak `f27f093`; `fc159bd` memasang validator allowlist di route
  inventory, dan spec stok lolos terhadapnya. Sejak 30 September 2026
  backend lokal adalah `nizar` `465b438` (Catatan dari penyesuaian backend
  `465b438`), dan sejak 1 Oktober 2026 `yoga` `50eede7` (Catatan dari
  penyesuaian backend `yoga`).
- Pengajuan stok:
  - Aturan status per izin di `pengajuanStokService.getAll` (baris 30
    sampai 47) dicerminkan di `features/pengajuan-stok/izin.ts`; keduanya
    diperbarui bersama.
  - `jenisPengajuan` `PENGIRIMAN` tidak dipakai backend maupun frontend:
    semua pengajuan adalah permintaan dari outlet ke gudang.
  - Strategi data uji spec alur (keputusan pemilik proyek, pilihan A): buat,
    edit, ajukan, lalu tolak, dengan dokumen baru per run yang berakhir
    REJECTED; setujui dan buat surat jalan diuji jalur gagalnya saja dengan
    `page.route`, karena keduanya meninggalkan dokumen permanen.
  - Outlet peminta diputuskan pemilik proyek pada 22 September 2026
    (`085ec78`): pengguna tanpa izin lintas outlet terkunci ke outlet
    tenant dan tidak dapat merevisi draf outlet lain; pemegang izin lintas
    outlet memilih dari seluruh outlet (`keputusan.md`, submodul pengajuan
    stok). Izin itu menunggu backend (`kontrak/temuan.md` butir 39).
  - Usulan tertunda: daftar outlet tidak menampilkan outlet peminta,
    sehingga pemegang izin lintas outlet di pilihan "Semua Outlet" tidak
    dapat membedakan outlet pengaju. Relevan begitu tenant punya lebih dari
    satu outlet.

## Utang kecil yang tertunda

### Utang kecil dari modul produk

- Dialog hapus di halaman daftar produk masih tertutup saat hapus gagal
  (perilaku lama dipertahankan di `53414dd`), bertentangan dengan keputusan
  Fase 0. Samakan dengan halaman kategori: `preventDefault`, tertutup hanya
  saat berhasil, tetap terbuka saat gagal.
- Skenario 4d di spec produk membuka pemilih bahan baku dengan
  `getByRole("combobox").nth(1)`, bertentangan dengan catatan Playwright di
  `pengujian.md`. Ganti dengan tombol berteks "Pilih bahan..." saat spec produk
  disentuh lagi.
- Spec produk memakai nama produk tetap. Satu kegagalan sebelum cleanup
  membuat run berikutnya gagal karena nama duplikat, dan hal itu terjadi pada
  modul ini. Pakai akhiran unik per run seperti spec kategori.
- `features/produk/form-produk.tsx` mengimpor `BahanBakuCombobox` dari
  `app/dashboard/outlet/inventaris/components/`, sehingga `features/`
  bergantung pada `app/`. Pindahkan komponen itu ke `features/bahan-baku`
  atau `components/` saat modul produk atau bahan baku disentuh lagi; modul
  inventaris selesai tanpa menyentuhnya.

### Utang kecil dari modul stock adjustment gudang

- 9 error ESLint `@typescript-eslint/no-explicit-any` warisan di luar
  berkas modul (test integrasi pola roster bersih sejak `dcc22e0`):
  integration jadwal dan pengguna, `tests/helpers/storage.ts`,
  `tests/unit/lib/decodeToken.test.ts`, dan `components/app-sidebar.tsx`
  baris 373. Bereskan saat berkasnya dimigrasikan; `storage.ts` sendiri
  sudah tidak relevan (`pengujian.md`). Mengganti `any` di sidebar dicoba
  dan dikembalikan, karena tipe hilirnya ikut berubah (`cara-kerja.md`).
- Detail stock opname tidak memeriksa tipe lokasi terhadap ruang, sehingga
  dokumen gudang yang dibuka lewat URL ruang outlet tetap tampil. Pola
  penjaganya sudah ada di `features/stock-adjustment/ruang.ts`
  (`TIPE_LOKASI_RUANG`). Bereskan saat halaman stock opname disentuh lagi.

### Utang kecil dari modul penjualan dan pembayaran

- Tipe berakhiran `Lama` (`keputusan.md` butir 19) habis sejak `1e05df6`:
  `PelangganLama` dihapus di `d9365d3` dan `DiskonLama` di `1e05df6`.
  Riwayatnya: tipe itu dipakai halaman lama lewat alias impor, dan masing-masing
  dihapus di commit migrasi modul pemiliknya. Sisanya dihitung dengan
  `grep -rhoE 'export interface [A-Za-z]+Lama\b' types | wc -l` (2 per
  `e0aaeca`, yang menghapus `PajakLama`, `ProdukPajakRelasiLama`, dan
  `PajakDariProdukLama`; 5 per `3359497`, yang menghapus `AkunKasLama`,
  `AkunKasRefLama`, dan `MetodePembayaranLama`, dan pesan commit itu
  keliru menyebut enam). Per `d9365d3` tersisa 1, dan per `1e05df6` 0.
- `features/penjualan/halaman-buat-penjualan.tsx` masih 1.088 baris:
  migrasi memindahkan lapisan data dan membuang `any`, tetapi tidak memecah
  komponennya. Pisahkan pemilih pelanggan, pemilih diskon, dan pratinjau
  total saat halaman itu disentuh lagi.
- Cakupan outlet daftar penjualan (K11b) dan `locationID` buat penjualan
  (K13a) hanya berlaku bagi pemegang `read-location`; pengguna lain melihat
  seluruh penjualan tenant dan tidak mengirim lokasi. Halaman buat belum
  punya pemilih outlet bagi pemegang izin lintas outlet. Keduanya wajib
  ditutup sebelum multi-outlet (`kontrak/temuan.md` butir 48 dan 49).
- Tiga `test.fixme` di spec alur penjualan menunggu backend: dua untuk
  cache daftar jurnal (`kontrak/temuan.md` butir 46) dan satu untuk stok
  produk (butir 37, tertutup sebagian di backend `yoga`).
- Filter tanggal daftar penjualan tidak dapat dikosongkan langsung,
  karena `PilihTanggal` tidak punya tombol kosongkan; filter dikosongkan
  lewat reset filter.

### Utang kecil dari modul reservasi

- Sebutan di pesan form tipe aset berbeda: "Kategori Aset" di halaman
  buat dan "Tipe Aset" di halaman edit. Dipertahankan di `074e98c` karena
  teks yang dilihat pengguna; penyeragamannya menunggu keputusan pemilik
  proyek.
- Halaman buat dan edit tarif masih berbeda tampilan: `<select>` bawaan
  dan harga polos di buat, Radix Select dan harga berformat ribuan di
  edit. Penyatuan ke satu form ditunda (keputusan T1a).

### Utang kecil dari modul keuangan

- Daftar akun kas belum punya ubah maupun nonaktifkan, walau backend
  punya `PUT /akunkas/:id`. `DELETE /akunkas/:id` tidak ada lagi sejak
  backend `465b438`, dan akun bersaldo tidak dapat ditutup
  (`kontrak/temuan.md` butir 81). Tombol "Pindah Dana" nonaktif karena
  transfer antar akun belum ada.
- Backend `465b438` menambah `GET /akunkas/mutasi`,
  `GET /akunkas/:id/mutasi`, dan `GET /akunkas/:id/ringkasan`
  (`kontrak/temuan.md` butir 61), sehingga halaman mutasi arus kas (KU1a)
  dapat diwujudkan; cakupannya menunggu keputusan pemilik proyek.
- Ketiga halaman keuangan yang memuat data masih memanggil
  `useAuthGuard()`, karena halamannya tetap di `app/` dengan tampilan
  lama; pemanggilan itu dibuang bila halamannya dijadikan tipis.

### Utang kecil dari modul jadwal dan shift

- Hapus jadwal masih memakai `confirm` bawaan browser, berbeda dengan
  dialog konfirmasi di modul lain; spec kelola jadwal bergantung padanya
  (`page.once("dialog")`). Diseragamkan bila pemilik proyek memutuskan.
- Shift outlet dan gudang masih memakai daftar tenant yang sama sampai
  backend memisahkan shift per lokasi (`KUNCI_LOKASI_SHIFT`, keputusan
  SH1b, `kontrak/temuan.md` butir 70).
- Query `?workspace=` pada `GET /shift` hanya penanganan sementara,
  karena backend menjawab 500 tanpa query apa pun (`kontrak/temuan.md`
  butir 8). Dibuang begitu backend diperbaiki (`features/shift/ruang.ts`).
- Pola roster outlet dan gudang masih memakai daftar tenant yang sama
  sampai backend memisahkannya per lokasi (`KUNCI_LOKASI_POLA_ROSTER`,
  keputusan PL5, `kontrak/temuan.md` butir 70).
- Ubah pola roster tetap gagal karena validator model backend
  (`test.fixme` di `pengujian.md`); tombol ubah tetap ditampilkan dan
  galatnya diteruskan ke pengguna.
- `keterangan` dan `dibuatPada` di `PolaRosterItem` masih opsional, walau
  halaman generate lama yang memetakan pola sendiri sudah tidak ada
  (`19227f8`); dijadikan wajib bersama perapian tipe berikutnya.

### Utang kecil dari modul Gudang

- Dashboard gudang (`app/dashboard/gudang/page.tsx`) masih placeholder.
  Sumber datanya sudah diputuskan (GD1a), tetapi eksekusinya ditunda
  sampai pemilik proyek menentukan layout dan UI/UX-nya.
- Dashboard outlet (`app/dashboard/outlet/page.tsx`) juga placeholder,
  dan `GET /dashboard/outlet` belum dipakai web; di luar cakupan modul
  Gudang.
- Dua error ESLint `react/no-unescaped-entities` di
  `app/dashboard/gudang/inventaris/page.tsx` baris 273 (tanda kutip di
  teks keadaan kosong) warisan sejak migrasi stok `ad590f9`, yang ditutup
  walau definisi selesai meminta ESLint tanpa error di berkas modulnya.
  Bereskan saat halaman inventaris gudang disentuh lagi.

### Utang kecil dari modul Pengaturan outlet

- Form buat dan ubah metode pembayaran bergantung pada `read-akunkas`
  untuk pilihan akun tujuan, walau backend hanya mewajibkan izin create
  atau update metode; tanpa izin itu form menampilkan pesan gagal memuat.
  Diputuskan bila ada role yang membutuhkannya
  (`kontrak/izin-halaman.md`).
- Enam tipe aset uji tertinggal sebagai bukti butir 77
  (`kontrak/temuan.md`), dan dihapus lewat API setelah laporan backend
  diterima.
- Tab pajak per produk tidak dapat menampilkan relasi ke pajak nonaktif,
  karena backend tidak mengirimnya (`kontrak/temuan.md` butir 93), sehingga
  produk itu tampak tanpa pajak dan konfirmasi ganti tidak muncul.
- Pajak per aset (`assetID` di `POST /produkpajak`) belum dipakai web;
  ditinjau bersama modul reservasi bila dibutuhkan.
- `pajakList` di tipe `Produk` tetap ada tetapi tidak dipakai tampilan,
  karena tidak mencerminkan relasi pajak (`kontrak/temuan.md` butir 88).
- Dua error ESLint `react-hooks/set-state-in-effect` warisan modul Role di
  `app/dashboard/outlet/pengaturan/roles/page.tsx` baris 39 dan
  `app/dashboard/outlet/pengaturan/roles/buatRole/page.tsx` baris 43.
  Bereskan saat halaman role disentuh lagi.
- `tenantName` masih ada di `PenggunaSesi` (`lib/auth/session.ts`) tanpa
  pembaca, karena token masih membawanya; dibuang bersama modul Profil,
  login, dan sidebar.

### Utang kecil dari penyesuaian backend `f27f093`

- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
