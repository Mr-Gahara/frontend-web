# Status

Sifat perubahan: **Sering**, setiap modul selesai.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Keadaan pekerjaan refactor: fase yang sudah selesai, metrik, dan pekerjaan
berikutnya. Diperbarui setiap kali satu modul selesai (`docs/README.md`, Cara
memperbarui dokumentasi).

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul.
Diukur ulang per penyesuaian `nizar` (`729c16a`), tidak berubah dari `597a163`.
Baris warna diukur ulang per `9cd22e1` (11 Oktober 2026); keempat angka
lain tidak berubah sampai commit itu:

| Hal | Awal | Per `729c16a` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 0 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan; dari 25 per `845c2cf` menjadi 16, lewat penyesuaian `465b438` dan halaman metode pembayaran, lalu 12 setelah halaman pajak (`e0aaeca`), 9 setelah halaman pelanggan (`d9365d3`), 7 setelah halaman diskon (`1e05df6`), 4 setelah halaman profil, login, dan sidebar (`57a7084`), dan 0 setelah error ESLint warisan (`4f19e77`) |
| Kemunculan `_id` | - | 8 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id`. Perintahnya ikut menghitung komentar: naik 1 di `eef371a` dari komentar normalisasi di `features/sesi-booking/api.ts`. Turun 13 di `45187b6`: 12 dari data tiruan mutasi arus kas dan 1 dari daftar akun kas. Turun 3 di `f99b7cf`: 4 dari halaman dan tabel shift, dikurangi 1 dari komentar normalisasi di `features/shift/api.ts`. Turun 7 di `dcc22e0` dari halaman, tabel, dan form pola roster. Turun 7 di `19227f8` dari halaman jadwal outlet, jadwal gudang, dan generate. Turun 9 lagi sampai `3359497`, dari penyesuaian `465b438` dan halaman metode pembayaran. Turun 7 di `e0aaeca` dari halaman pajak. Turun 2 di `d9365d3` dari halaman pelanggan. Turun 2 di `1e05df6` dari halaman diskon. Turun 1 di `091be4e` dari komentar halaman profil. Naik 1 di `10c7efb` dari komentar normalisasi di `features/admin-akun/api.ts`. Turun 1 di `4f19e77` dari cadangan `_id` di dialog pengguna |
| `useAuthGuard()` berulang di halaman | 49 | 2 | Dihitung di `app/` saja. Yang tersisa `app/dashboard/layout.tsx`, satu-satunya pemanggil, dan berkas hook-nya sendiri; ke-24 pemanggilan berulang di `app/` dan ke-13 di `features/` dibuang di `628f52e` (26 sebelum itu). Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, keempat halaman penjualan, buat reservasi, shift outlet, pola roster outlet, ketiga halaman metode pembayaran, halaman pelanggan, halaman diskon, dan halaman profil) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | 68 (per `9cd22e1`) | Lima warna utama menjadi token di `app/globals.css` (`584a2d8`, `ba28f25`; keputusan WR1a sampai WR4a). Tepat sebelum penggantian terukur 3.764 di `app`, `components`, `features`, dan `lib`. Yang tersisa: warna utama di luar kelas (konstanta palet lokal halaman reservasi dan tarif, serta warna grafik) dan warna lain yang belum punya token |
| Berkas di atas 700 baris | 7 | 3 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.087 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. Per `57a7084` menjadi 3: `components/app-sidebar.tsx` dipecah menjadi 325 baris (keputusan PF4a), dan tersisa buat penjualan (1.090), `features/produk/form-produk.tsx` (803), serta `components/ui/sidebar.tsx` (702). Per `9195472` menjadi 4: `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700 (714 baris) karena penjaga ruang (`eb0181f`), dan buat penjualan menjadi 1.087 baris setelah kode mati dibuang (`6b5e1cc`). Per `b887278` form produk menjadi 809 baris (pemeriksaan satuan resep). Per `628f52e` tetap 4; detail stock opname menjadi 712 baris setelah pemanggilan guard dibuang. Per `7d4c234` form produk 835 baris (isian stok minimal, B237). Per `5b8cbd9` tetap 4: buat penjualan 1.098 baris (`waktuTransaksi` dan jam berjalan, `7a08b63`), form produk 809, detail stock opname 702, dan `components/ui/sidebar.tsx` 702. Per `a611b59` menjadi 3: dialog aksi detail stock opname dipisah, sehingga halamannya 612 baris |

Tahap desain token sengaja tidak dicampur dengan refactor arsitektur, agar
setiap commit tetap fokus. Warna utama sudah menjadi token pada fase UI/UX
11 Oktober 2026; tipografi dan spasi belum.

## Pekerjaan berikutnya: lanjutan penyesuaian backend `4759208`

Pada 4 November 2026 backend lokal di-fast-forward ke `nizar` `4759208`,
yang memuat `yoga` `a07c0b1` (`referensi/keputusan-penyesuaian-backend.md`,
Penyesuaian backend `ridho` lokal `4759208`). Kontrak yang ditunggu
halaman pratinjau tersedia: N1 (B212 sampai B214, B229), N2 (B216,
B224), N3 (B231 sampai B233), N4 (B217), N5 (B215), N6 (B218), Y1
(B220, B223), Y2 (B221), Y3 (B219), P48 (B222), dan sesi kasir (B225
sampai B228). Y4 (stok minimal produk) dan Y5 (penegakan WMS) belum.

Sudah selesai di sesi itu:

1. Daftar, verifikasi email, dan lupa password tersambung ke backend,
   login akun mengarahkan `requireSetup` ke `/setup` dan
   `EMAIL_BELUM_TERVERIFIKASI` ke isian kode, dan tautan "Lupa
   password?" terpasang (`67ec690`).
2. Halaman Langganan memakai data backend dan izin `read-langganan`
   (`c868870`).

Selesai 5 November 2026:

3. Plan di panel admin (B213): label riwayat `ubah-plan` dan perubahan
   plan di riwayat (`475bf0b`), lalu plan di buat akun, durasi 24 bulan,
   aksi Ubah Plan, plan opsional saat perpanjang, serta plan di daftar
   dan detail akun (`468a3bd`).
4. Pelanggan bawaan (B218): Hapus disembunyikan, dialog ubah hanya
   memuat nama, dan sel nama bertanda "Bawaan", karena tenant uji punya
   pelanggan lama biasa yang juga bernama "Customer" (`77d4380`).
5. Jenis mutasi `SELISIH_KAS_MASUK` dan `SELISIH_KAS_KELUAR` (B228) di
   buku mutasi dan filter jenis (`d696354`). Rujukan sesi kasir belum
   ditautkan sampai halaman sesi kasir ada (butir 6).
6. Wizard setup tersambung (B219 sampai B223, B237, B238, B240): status,
   guard, dan kembali dari login PIN (`3205982`); seluruh langkah
   menyimpan ke server dan dapat dilanjutkan setelah dimuat ulang tanpa
   PIN (`41194b7`); tautan Daftar di login akun (`4322dba`); pajak dapat
   ditambah dan ringkasan bertautan (`493f49c`). Keputusan WS1a sampai
   WS5a di `modul/setup-akun.md`.
7. Penyaringan per plan (B216, B224, B234): menu dan rute fitur di luar
   plan disembunyikan dengan ajakan naik plan, setup fitur yang belum
   selesai tampil sebagai ajakan Lengkapi setup, dan banner dashboard
   outlet (`8d0f1dd`). Keputusan PF1a sampai PF6a di
   `modul/setup-akun.md`. Suite penuh 554 lolos, 1 skipped, 2 gagal dari
   557; locator admin diperbaiki di `2d3344b`, dan waktu penjualan lolos
   12 dari 12 saat diulang.
8. Pekerjaan tanpa desain yang dipilih pemilik proyek: enam endpoint akun
   di kontrak (`273a6ff`); pengguna non-aktif yang login PIN kini mendapat
   pesan B202 di halaman login pengguna, bukan dikeluarkan dari akun toko
   (`9a85817`, bug apiClient yang terbukti spec baru); uji Owner kedua 409
   (B195, `eacb5ed`); dan stok minimal produk beserta badge serta tab Stok
   Kritis di daftar Produk (B237, `7d4c234`).

Selesai 6 November 2026, sebelum butir 6:

9. Backend ditarik ke `nizar` `4d221f5` (perbaikan audit backend 5
   November 2026 di bagian Nizar, serta B245 sampai B251), paket AR26
   untuk temuan audit A-06 dicatat di status Ridho backend, dan `ridho`
   di-push ke `c031bde` atas perintah pemilik proyek
   (`referensi/keputusan-penyesuaian-backend.md`, Penyesuaian backend
   `ridho` `c031bde`). Perpanjang bersamaan yang ditolak 409 memuat ulang
   akun di panel admin (B251, `a207fae`). Suite penuh 556 lolos, 3 gagal
   karena B248, dan 2 skipped dari 561 (`inti/pengujian.md`).
10. Utang pengujian tanpa UI baru yang dipilih pemilik proyek: tanggal
    topbar kini berganti sendiri setelah 00.00 (`c6f9ec0`, bug yang
    menyalahi keputusan rancangan butir 28), delapan butir utang yang
    lunas dipindah ke arsip (`0273d45` dan commit dokumen ini), harapan
    spec kirim dan terima disaring per arah (`bc49152`), dan nama
    pelanggan kembar diuji di daftar serta pemilih (`e0d3bb4`). Butir 6
    dan 7 dilewati dulu karena butuh UI baru (pemilik proyek, 6 November
    2026).

Tertunda dari penyesuaian itu, atas keputusan pemilik proyek 6 November
2026:

- **B248, verifikasi email wajib `password`**: ditunda karena keadaan
  tanpa password di memori butuh isian baru di halaman verifikasi (UI
  baru). Sampai dikerjakan, pendaftaran dan login akun yang belum
  terverifikasi di web tertahan, dan tiga skenario auth gagal di suite
  penuh (`kontrak/temuan.md` butir 171). Bagian tanpa UI, mengirim
  password titipan daftar atau login, dapat dikerjakan lebih dulu; bentuk
  isiannya diajukan lewat dialog sebelum ditulis.
  Bagian tanpa UI selesai di `efb05db`: password titipan dikirim, titipan
  bertahan saat kode salah, dan tanpa titipan halaman pindah ke login
  dengan pesan "Masuk lagi" tanpa mengirim kode (pilihan pemilik proyek).
  Pendaftaran web berjalan lagi. Yang tersisa isian password di halaman
  verifikasi untuk keadaan tanpa titipan, yang didesain sendiri oleh
  pemilik proyek.
- **Laporan untuk tim backend**: disusun sekali jalan setelah pekerjaan
  backend dari audit selesai. Temuan baru tetap dicatat di
  `kontrak/temuan.md` begitu terverifikasi.

Urutan berikutnya, semuanya sudah disetujui pemilik proyek pada 4
November 2026:

1. Selesai di `475bf0b` dan `468a3bd` (di atas).
   **Plan di panel admin (B213)**, didahului bug yang sudah terlihat:
   `LABEL_AKSI` di `features/admin-akun/langganan.ts` tidak punya
   `ubah-plan`, sehingga riwayat langganan akun uji di panel admin
   menampilkan baris tanpa label. Lalu pilihan plan dan durasi 24 bulan
   di buat akun (Advanced dan Pro wajib durasi), `PUT
   /admin/users/:id/plan`, plan opsional saat perpanjang, dan plan di
   daftar serta detail akun. `PILIHAN_DURASI_BULAN` dan
   `DurasiLangganan` masih 1, 3, 6, 12.
2. Selesai di `77d4380` (di atas).
   **Pelanggan bawaan (B218)**: pelanggan `isBawaan` tidak dapat
   dihapus (409) dan hanya namanya yang boleh diubah; sembunyikan hapus
   dan field selain nama.
3. Selesai di `d696354` (di atas).
   **Dua jenis mutasi baru (B228)**: `SELISIH_KAS_MASUK` dan
   `SELISIH_KAS_KELUAR` di `ARAH_JENIS` dan label
   `features/akun-kas/mutasi.ts`, dengan rujukan `SesiKasir`.
4. Selesai di `3205982`, `41194b7`, dan `4322dba` (di atas).
   **Wizard setup tersambung** (B220, B219, B223): status dari `GET
   /api/setup/status` bertoken akun, melanjutkan dari langkah pertama
   yang belum selesai, nama toko lewat `POST /tenant`, Owner lewat
   `register-owner` tanpa `installationId` (memakai `accessToken`
   tingkat atas responsnya untuk langkah berikutnya), lalu lokasi,
   kategori, bahan baku, produk, pajak, tipe aset, aset, tarif, dan
   gudang lewat endpoint modul yang ada. Stok minimal produk menunggu
   Y4 dan tidak ditampilkan seolah tersimpan (TP4a). Pemulihan sesi saat
   `/setup` dimuat ulang perlu diperiksa, karena token hanya di memori.
   Sesudahnya tautan "Daftar" di login akun dipasang.
5. Selesai di `8d0f1dd` (di atas).
   **Penyaringan per plan** (B214, B216, B224): menu dan halaman sesi
   booking disembunyikan untuk Basic dari `langganan.plan` di token
   pengguna, dan 403 `PLAN_TIDAK_MENCAKUP` serta
   `SETUP_FITUR_BELUM_SELESAI` ditampilkan sebagai ajakan upgrade atau
   melengkapi setup, bukan pesan izin. Pesan backend saat ini sudah
   tampil apa adanya lewat `pesanError`, dan tidak memicu logout paksa.
6. **Halaman sesi kasir (B227)**: modul baru, pemetaan perangkat ke akun
   kas `Kas Fisik` dan laporan sesi (`read-sesi-kasir`,
   `kelola-perangkat-kasir`). Perlu varian desain lebih dulu, dan
   sumber `installationId` perangkat untuk form pemetaan perlu
   dipastikan dari backend. Sejak backend `4d221f5`: pindah dan hapus
   pemetaan ditolak selama sesi masih terbuka (K-04, K-05), tipe laci
   terpetakan terkunci (B250), dan `referensi.tipe` selisih kasir bernilai
   `SesiKasir`, `SesiKasirBuka`, atau `SesiKasirTutup` (B247). Audit
   backend 5 November 2026 menyebut halaman pemetaan pemblokir utama
   sebelum kasir dipakai, dan menyisakan dua dugaan yang menyentuh
   rancangan form: pemetaan menerima perangkat PENDING atau REVOKED
   (K-18), dan `installationId` seluruh HP keluar di laporan sesi (K-19).
   Keputusan bisnis nomor 1 sampai 3 di audit (laci untuk VOID tunai,
   pemicu sesi lama, dan tunai tanpa sesi kasir termasuk dari web; K-08
   sampai K-10) dibahas pemilik proyek bersama tim backend.
7. **Penanda dan pemandu wizard setup** (pemilik proyek, 5 November
   2026, sesudah butir 6): pemilik proyek mencoba wizard sendiri, mengisi
   form produk lalu menekan "Simpan dan lanjut" tanpa "Simpan produk",
   sehingga produk tidak pernah terkirim (log backend hanya `GET
   /api/produk`) dan galat "Tambahkan minimal satu produk." menyesatkan.
   Jebakan yang sama ada di langkah Kategori dan Bahan baku. Arahnya:
   tombol yang harus ditekan lebih dulu di setiap langkah ditonjolkan,
   dan setelah wizard selesai ditambah pemandu UI (sorotan atau tur)
   yang menunjukkan apa yang diisi dan tombol apa yang ditekan. Rancangan
   dan perilakunya diajukan lewat dialog sebelum dikerjakan.

Belum dijadwalkan: logo toko (B203 sampai B205) dan jam operasional
(B206) di profil toko, serta perubahan backend 30 Oktober 2026 yang belum
dipakai web: OTP reset PIN Owner dan ubah email atau password akun (B178
sampai B180), dan hapus akun oleh Owner (B181). Keempatnya perlu desain
(pemilik proyek, 5 November 2026: butir yang perlu desain tidak
dikerjakan dulu). B202 dan B195 selesai di `9a85817` dan `eacb5ed`.
Juga belum dijadwalkan, dari pertanyaan pemilik proyek 5 November 2026:
nomor WhatsApp admin untuk halaman Langganan (LG1a, `NOMOR_WA_ADMIN`
masih kosong), dan pengingat masa langganan yang hampir habis di luar
halaman Langganan (perlu desain). Laporan untuk tim backend juga belum
disusun (Utang kecil, di bawah).

Pada 5 November 2026 backend lokal di-fast-forward ke `nizar` `aa978cc`
(memuat `yoga` `e37bf26`): Y4 stok minimal produk (B237, B238), Y5 WMS
khusus Pro (B234 sampai B236), `GET /api/akun/me` (B240), pajak toko
usang (B239), kunci izin cuti yang sudah diputuskan (B242), edit
pengajuan stok atomik (B241), dan self-approve perangkat (B243, B244).
Yang dipakai web masuk butir 4 (B237, B238, B240); B239, B242, B243, dan
B244 tidak menyentuh web, dan B234 serta B235 tidak memutus apa pun
karena akun uji Pro. Suite penuh 550 lolos dan 2 skipped dari 552.

Pada 6 November 2026 backend lokal di-fast-forward ke `nizar` `4d221f5`
(memuat `yoga` `cec04de`), lalu `ridho` di-push ke `c031bde` atas
perintah pemilik proyek, dengan satu commit dokumen AR26 di atasnya
(butir 9 di atas).
Backend dijalankan dengan env inline agar `.env` backend tidak diubah
(`inti/pengujian.md`, Menjalankan layanan uji). Kode backend tidak
diubah sama sekali.

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in ridho nizar yoga; do echo "origin/$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...origin/$r | tr '\t' ' ')"; done
```

### Utang kecil dari penyesuaian backend `4759208`

- Calon temuan untuk Ridho (tenant): `POST /tenant` memasang cookie refresh
  akun bernama `refreshToken` di path `/`, sedangkan login akun memasangnya
  di `/api/akun/auth` dan cookie refresh pengguna juga `refreshToken` di
  `/`. `register-owner` sesudahnya menimpa cookie itu. Pemulihan sesi tetap
  berjalan karena cookie login akun di path yang lebih khusus tetap
  berlaku (`POST /tenant` tidak memutar `tokenVersion`); terbukti lewat
  muat ulang di spec setup (`41194b7`). Belum dilaporkan. Dicatat
  sebagai `kontrak/temuan.md` butir 168 (6 November 2026).
- Data toko uji wizard (lokasi, kategori, produk, pajak, dan seterusnya)
  menetap di basis data development setelah akun ujinya dihapus, karena
  hapus akun tidak menghapus tokonya; setiap run spec setup menambah enam
  toko.

- Riwayat admin tanpa label `ubah-plan` (butir 1 di atas). Selesai di
  `475bf0b`: tipe `AksiLangganan` ganda di `types/adminAkun.ts` dibuang.
- `db:data-bawaan` mencocokkan nama persis, jadi Toko3 yang sudah punya
  metode tunai "CASH" dan kas fisik "kas kasir" mendapat metode "Tunai"
  dan akun kas "Kas Kecil (Laci)" baru (dihitung baca-saja 4 November
  2026: tiga metode berkategori tunai, tiga kas fisik aktif). Calon temuan
  untuk Nizar (N6): skrip menggandakan metode tunai toko lama yang
  namanya lain. Dicatat sebagai `kontrak/temuan.md` butir 169
  (6 November 2026).
- Calon temuan kontrak untuk Nizar: `GET /akun/langganan` tidak memuat
  penanda masa percobaan maupun awal masa berlaku, sehingga web
  menyimpulkannya dari riwayat berhalaman (`ringkasLangganan`). Dicatat
  sebagai `kontrak/temuan.md` butir 170 (6 November 2026).
- Laporan untuk tim backend belum disusun: kedua calon temuan di atas,
  serta pembuktian B215, B217, B229, B230, B231, dan B232 dari web
  (`inti/backend.md`, Bila menemukan bug backend). Baris temuan belum
  ditulis di `kontrak/temuan.md`.
  Baris temuannya ditulis 6 November 2026 (butir 168 sampai 170). Bahan
  laporan bertambah pembuktian B251 (`a207fae`) dan B248 (`efb05db`) dari
  web, lalu B250 setelah web mengerjakannya. Laporannya ditunda
  sampai pekerjaan backend dari audit selesai, agar diserahkan sekali
  jalan (pemilik proyek, 6 November 2026).
- `PUT /akun/admin/users/:id/plan` dan plan di buat akun, perpanjang,
  serta riwayat admin dicatat di `kontrak/endpoint.md` (5 November 2026).
- Enam endpoint baru belum dicatat di `kontrak/endpoint.md`:
  verifikasi email dan kirim ulangnya, lupa password, reset password,
  langganan, dan riwayat langganan. Dicatat pada 5 November 2026.
- Akun uji `toko@gmail.com` dinaikkan ke Pro lewat API admin, karena
  akun lama dibaca Basic (B212) dan Basic menolak sesi booking (B216).
  Riwayat langganannya kini berisi satu catatan `ubah-plan`.
- `db:setup-toko-lama` menandai empat toko yang ada saat itu selesai
  setup inti. Jangan dijalankan ulang di basis data lokal setelah spec
  membuat akun pendaftar, karena akun itu ikut ditandai selesai.

## Utang kecil yang tertunda

### Utang kecil dari penyesuaian backend `ridho` `0024eb9`

- Monitoring per lokasi tidak memuat staf yang izin (`kontrak/temuan.md`
  butir 165); panel Status Staf menambah karyawan ruang menurut peran
  yang izin hari itu sampai backend memperbaikinya.
- Jalur role tanpa izin SDM baru, tanpa `read-location`, dan tanpa izin
  lintas outlet hanya teruji di unit test, karena akun uji berperan
  Owner (`referensi/utang-pengujian.md`).
  Jalur tanpa izin lintas outlet teruji e2e sejak `1cd8211`, lewat
  pengguna uji "E2E Tanpa Lintas Outlet"; jalur tanpa izin SDM baru dan
  tanpa `read-location` tetap hanya teruji di unit test.
- Jurnal stok tetap mengirim satu `locationID` untuk Semua Outlet,
  walau backend menerima `tipeLokasi` (B109); berpengaruh hanya bila
  tenant punya lebih dari satu outlet (`kontrak/temuan.md` butir 151).
- Fixture izin cuti menetap di basis data development, karena backend
  tidak punya hapus izin; setiap hari yang menjalankan spec dashboard
  menambah dua izin.
- Laporan penyesuaian ini ditulis ke dokumentasi backend di `128d0de`
  (`arsip/laporan-backend.md`); butir 165 kini utang Yoga, karena Ridho
  sementara tidak memegang backend.

### Utang kecil dari penyesuaian backend `ridho` `877e493`

- Jalur pemegang izin pembelian per ruang saja belum teruji e2e, karena
  akun uji Owner memegang izin umum (`kontrak/temuan.md` butir 158,
  Menunggu verifikasi).
- B112 (urutan stabil, validasi selaras skema, indeks nomor faktur),
  B114, dan B115 dipakai atau tidak lagi diakali web, tetapi belum
  dibuktikan khusus.
- Penerimaan (outlet) dan pengiriman (gudang) tetap daftar kartu mode
  klien dengan polling; tidak termasuk butir 150.
- Tombol urut kolom dibuang di stock adjustment dan stock opname, karena
  urutan klien hanya mengurutkan satu halaman; urutan mengikuti backend.
- Laporan 28 Oktober 2026 belum tercatat di `arsip/laporan-backend.md`.
  Dicatat pada 31 Oktober 2026.

### Utang kecil dari pembelian stok dan audit pergantian hari

- Catatan untuk tim backend dari modul pembelian dan audit pergantian
  hari (`kontrak/temuan.md` butir 154 sampai 162 dan 164) diserahkan ke
  Yoga pada 26 Oktober 2026 dan dicatat di `arsip/laporan-backend.md`.
- Sisi frontend: tab Keuangan tampil tanpa izin (butir 163), filter
  periode bawaan tidak bergeser saat hari berganti, dan saldo akun kas
  yang belum terpotong pembelian (`modul/inventaris.md`, Utang kecil
  dari pembelian stok). Tab Keuangan disaring menurut izin halamannya
  sejak `e051906` (butir 163 selesai).

### Utang kecil dari pengembalian Outlet ke Gudang

- Daftar Kirim Barang memakai asal bertipe Outlet tanpa pemilih (AR10a).
  Untuk multi-outlet, terapkan cakupan outlet seperti Terima Barang
  (`lingkupOutlet` dan `PemilihLokasiOutlet`).
- Kartu siap surat jalan dashboard gudang dihitung server untuk kedua
  arah, sedangkan tab Perlu Surat Jalan gudang hanya memuat permintaan
  (AR6a). Angkanya melebihi isi tab bila ada pengembalian yang disetujui
  dan menunggu surat jalan outlet; perlu hitungan per arah dari backend
  atau kartu tersendiri.
- Halaman revisi surat jalan tidak memeriksa ruang pengirim: tombolnya
  tersembunyi di ruang lawan (AR11a), tetapi URL-nya dapat dibuka
  langsung. Selesai di `5ba2a42`: halaman revisi menolak ruang yang
  bukan pengirim.
- Repo frontend dibuat ulang sebagai repo baru dengan pemilik proyek
  sebagai satu-satunya kontributor, setelah seluruh pekerjaan selesai dan
  masuk produksi (pemilik proyek, 25 Oktober 2026). Seluruh commit yang
  terjangkau per tanggal itu ditulis `Mr-Gahara` tanpa atribusi lain,
  dan remote hanya punya `main` tanpa ref pull request, tetapi daftar
  kontributor GitHub masih menampilkan Claude.
  Per 31 Oktober 2026 API contributors hanya memuat `Mr-Gahara`; yang
  tertinggal panel Contributors halaman repo dan commit `68cd7da` yang
  diganti `8b5ad0f` (`inti/cara-kerja.md`, Atribusi commit).

### Utang kecil dari penyesuaian backend `ridho` `b5b367a`

- Stock opname, stock adjustment, surat jalan, dan pengajuan stok tetap
  mode klien, karena backend belum punya pencarian teks
  (`kontrak/temuan.md` butir 150). Paginasi B104 sampai B106 dipakai
  bersama pencarian begitu tersedia (keputusan rancangan butir 27).
  Pengajuan stok juga menunggu filter tab gabungan (butir 152).
- Kotak cari nama bahan jurnal stok disembunyikan sampai backend
  menerima query pencarian (butir 150), lalu dikembalikan.
- Lingkup per tipe lokasi dikirim sebagai satu `locationID` (MVP);
  multi-lokasi menunggu filter tipe lokasi (butir 151).
- Pengajuan Outlet ke Gudang (P8 backend) belum tampil di web; alurnya
  dikerjakan terpisah dengan pratinjau (`modul/inventaris.md`). Sampai
  itu kartu pengajuan dashboard gudang dapat melebihi isi tab bila ada
  pengembalian dari outlet.
  Selesai di `621e753` sampai `a505783`. Yang tersisa: kartu siap surat
  jalan menghitung pengembalian yang menunggu surat jalan outlet,
  sedangkan tab gudang tidak (AR6a; utang kecil pengembalian, di atas).
- `lokasiJurnalOutlet` dipindah ke `features/inventaris/cakupan.ts` bila
  daftar lain ikut pindah ke server (keputusan rancangan butir 12).
  Selesai di `21abcd8` sebagai `lokasiSatuOutlet`, dipakai jurnal stok
  dan pembelian stok.

### Utang kecil dari penyesuaian backend `ridho` `7d28135`

- Baris `/pembelianstok` di Lampiran A (`kontrak/route-backend.md`)
  masih mencatat tanpa izin, padahal backend memeriksa `read-`,
  `create-`, `update-`, dan `delete-pembelian-stok` (B74); izinnya
  tercatat di `kontrak/endpoint.md`. Lampiran itu bertanda Tetap dan
  diperbarui utuh saat dibangkitkan ulang (pemilik proyek, 26 Oktober
  2026).
- Lampiran A (`kontrak/route-backend.md`) tertinggal: masih mencatat
  `DELETE /bebanoperasional/:id`, yang sudah dibuang backend.
  Dibangkitkan ulang hanya atas perintah pemilik proyek (RG8a).
- Belum dibuktikan dari web: penyaringan beban VOID di laporan laba rugi
  (butir 132), cache daftar beban saat kategori berubah (butir 135),
  penolakan beban saat saldo kurang atau akun nonaktif (butir 133), serta
  bentuk `tanggal`, batas `keterangan`, dan pembatas laju beban (butir
  137).
- Empat penjualan milik toko yang belum punya lokasi tetap tanpa
  `locationID`, sesuai rancangan backend. Tenant uji tidak terdampak:
  total dengan filter outletnya sama dengan total tenant (18 Oktober
  2026).
- Butir 132, 133, dan 135 dicocokkan dari kode `00de455` pada 18 Oktober
  2026 (Catatan dari halaman pengeluaran). Yang tersisa dari butir 137:
  batas tanggal masa depan, panjang keterangan, dan pembatas laju.
  Ketiganya diperbaiki di `yoga` `186fa19` (B100) dan dibuktikan dari kode
  `ridho` `af5f315` pada 19 Oktober 2026 (`kontrak/temuan.md` butir 137).
- Kategori fixture "E2E Kategori Beban" dan satu beban VOID menetap di
  basis data development (RG7a).
- Pemilik proyek memutuskan untuk backend pada 17 Oktober 2026: tanggal
  lampau di beban operasional dan jurnal transfer hanya untuk Owner, dan
  peran lain memakai waktu server hari ini WIB. Halaman pengeluaran nanti
  mengikuti aturan itu; Pindah Dana tidak terdampak karena tidak mengirim
  tanggal (DN3a).
  Diterapkan backend: jurnal transfer di `nizar` `96e890e` (B97) dan beban
  operasional di `yoga` `186fa19` (B100), keduanya termuat di `ridho`
  `af5f315`.
  Sejak `6d07b8d` web mengirim waktu simpan untuk tanggal beban hari ini,
  karena validator membaca `YYYY-MM-DD` sebagai 07.00 WIB
  (`kontrak/temuan.md` butir 154).

### Utang kecil dari penyesuaian backend `ridho` `2dd57aa`

- Hapus bahan baku yang baru dibuat diperbaiki backend di `7d28135`
  (`kontrak/temuan.md` butir 143), dan `test.fixme`-nya dilepas
  (`cfaaa92`).
- Cakupan daftar penjualan pindah ke filter server: syaratnya terpenuhi
  di `7d28135` (butir 144), dan pekerjaannya dijadwalkan sesudah tabel
  seragam (RG4a). Selesai di `20c026b`.
- Izin pembelian stok belum masuk template role, dan modul pembelian
  stok belum punya halaman di web (RH6a). Izin stock adjustment per
  ruang juga belum masuk template role (RH3a).
  Izin stock adjustment per ruang masuk template di `4088d9e`.
  Halaman pembelian selesai di `0db77ed` sampai `1e4f042`, dan izinnya
  masuk template di `5b8cbd9`.
- Belum dicocokkan dari 42 commit backend: modul pembelian stok, dan
  cache produk saat pajak berubah (`kontrak/README.md`).
  Modul pembelian stok dicocokkan dari kode `b5b367a` saat halamannya
  dibangun (`modul/inventaris.md`, Submodul pembelian stok); cache
  produk saat pajak berubah belum.
- Hapus aset yang punya booking (butir 52) dan hapus kategori yang
  dipakai produk (butir 12) belum diuji dari web.
- Nama penyetuju di daftar pengajuan stok terisi sejak `7d28135` (butir
  145); belum dipakai web.

### Utang kecil dari penyesuaian backend `nizar`

- Backend lokal berada di cabang `ridho` `8dc6211` (fast-forward ke
  `origin/nizar`, sudah di-push). Setiap kali `yoga` atau `nizar` maju,
  cabang itu digabung ulang dengan pemeriksaan kelengkapan
  (`inti/backend.md`), lalu kontrak dicocokkan ulang. Cabang uji lokal
  `uji-yoga-nizar` sudah dihapus (8 Oktober 2026).
  Sejak 11 Oktober 2026 `ridho` berada di `2dd57aa`. Sejak 16 Oktober 2026
  di `7d28135` (gabungan `yoga` `723b12f` dan `nizar` `38f523a`). Sejak
  17 Oktober 2026 di `00de455`, fast-forward dua commit dokumen `nizar`.
  Sejak 19 Oktober 2026 di `af5f315`, fast-forward ke `origin/yoga` yang
  memuat `origin/nizar` (`referensi/keputusan-penyesuaian-backend.md`).
  Sejak 21 Oktober 2026 di `b5b367a`, fast-forward ke `origin/yoga`.
  Sejak 28 Oktober 2026 di `877e493`, dan sejak 30 Oktober 2026 di
  `0024eb9` (`inti/backend.md`).
- Indeks pelanggan di basis data development belum sesuai skema
  (`kontrak/temuan.md` butir 142); dibiarkan sebagai bukti sampai backend
  menyediakan migrasi indeks.
  Diselaraskan lewat `npm run db:indeks` pada 11 Oktober 2026 (butir 142
  tertutup).
- Booking milik sebuah penjualan belum disertakan di respons detail
  penjualan; permintaannya ditunda (NZ9a).
- Penyesuaian terhadap `yoga` `55328f1` selesai di `50e6485` dan
  `f64b518`. Yang tersisa: pengeluaran tetap ditunda sampai
  `kontrak/temuan.md` butir 131 sampai 134 diperbaiki backend (NZ11a).
  Butir itu diperbaiki di `7d28135` dan terbukti lewat permintaan nyata;
  pengeluaran tetap ditunda sampai dijadwalkan pemilik proyek (RG6a).
  Dijadwalkan sebagai pekerjaan berikutnya pada 18 Oktober 2026.
  Selesai di `1d7fa7b` (BO3a sampai BO7a).
- Bagian Sesi Booking di detail penjualan memakai tata letak sederhana di
  atas grid informasi; penempatannya menunggu fase UI/UX.
- Timeline reservasi tidak punya aksi Tandai Selesai (NZ7a). Booking lama
  berstatus Batal dibaca VOID sejak backend `nizar` `8dc6211`, sehingga
  menurut kode tidak tampil lagi (`kontrak/temuan.md` butir 141); belum
  dilihat langsung di timeline.
- Khusus member belum ditawarkan di form diskon (NZ6a); ditinjau bersama
  modul membership.
- Mutasi transfer di buku mutasi tidak bertaut ke riwayat Pindah Dana,
  karena riwayat itu tidak punya halaman per transfer.

### Utang kecil dari penyesuaian backend `fc29433`

- Izin beban operasional belum masuk template role (keputusan FC2a);
  ditambahkan bersama halaman pengeluaran.
  Ditambahkan di `61275ac`.
- Pilihan satuan resep hanya terbukti dari respons nyata untuk bahan
  bersatuan pcs, gram, dan ml. Untuk kg, liter, pak, dan unit, isi
  `availableUnits` dibaca dari kode backend, karena data development
  tidak punya bahan bersatuan itu. Sejak `f64b518` bahan bersatuan pak
  terbukti lewat e2e.

### Utang kecil dari penyesuaian backend `f27f093`

- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
  Selesai di `d6f8ba0` (B98): penanganan sementaranya dihapus, bukan
  dibalik, dan skenarionya menjadi langkah sungguhan.
- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
- `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700
  baris (714) sejak penjaga ruang ditambahkan di `eb0181f`, lalu 712
  baris setelah pemanggilan guard dibuang (`628f52e`), dan 702 per
  `5b8cbd9`. Pisahkan dialog
  aksi dan tabel hitungan saat halaman itu disentuh lagi.
  Dialog aksi dipisah ke `features/stock-opname/dialog-aksi-opname.tsx`
  di `a611b59` (612 baris); tabel hitungan tetap di halaman, karena
  memisahkannya menyeret state hitungan tanpa manfaat baru.

### Utang kecil dari 19 Oktober 2026

- Riwayat baseline lama masih di `referensi/playwright.md` (Perintah
  verifikasi yang biasa dipakai); pindahkan ke arsip saat dokumen itu
  disentuh. Baseline terkini ada di `inti/pengujian.md`.
  Dijadwalkan sebagai pekerjaan berikutnya pada 22 Oktober 2026.
  Selesai pada putaran dokumen 25 Oktober 2026 (`arsip/riwayat-pengujian.md`).
- `inti/pengujian.md` melewati batas inti sekitar 400 baris; utang
  pengujian yang sudah lunas dipindah ke arsip saat ditinjau.
  Dijadwalkan sebagai pekerjaan berikutnya pada 22 Oktober 2026.
  Selesai pada putaran dokumen 25 Oktober 2026 (`arsip/riwayat-pengujian.md`).
- Satu skip bersyarat data bertambah di suite penuh `d6f8ba0`
  dibanding hitungan, dan skenarionya belum diidentifikasi
  (`inti/pengujian.md`, Baseline).
  Teridentifikasi 21 Oktober 2026: "buat surat jalan gagal" di spec
  alur pengajuan, dilewati karena tenant uji tidak punya pengajuan
  APPROVED tanpa surat jalan.
