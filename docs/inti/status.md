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
| Berkas di atas 700 baris | 7 | 1 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.087 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. Per `57a7084` menjadi 3: `components/app-sidebar.tsx` dipecah menjadi 325 baris (keputusan PF4a), dan tersisa buat penjualan (1.090), `features/produk/form-produk.tsx` (803), serta `components/ui/sidebar.tsx` (702). Per `9195472` menjadi 4: `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700 (714 baris) karena penjaga ruang (`eb0181f`), dan buat penjualan menjadi 1.087 baris setelah kode mati dibuang (`6b5e1cc`). Per `b887278` form produk menjadi 809 baris (pemeriksaan satuan resep). Per `628f52e` tetap 4; detail stock opname menjadi 712 baris setelah pemanggilan guard dibuang. Per `7d4c234` form produk 835 baris (isian stok minimal, B237). Per `5b8cbd9` tetap 4: buat penjualan 1.098 baris (`waktuTransaksi` dan jam berjalan, `7a08b63`), form produk 809, detail stock opname 702, dan `components/ui/sidebar.tsx` 702. Per `a611b59` menjadi 3: dialog aksi detail stock opname dipisah, sehingga halamannya 612 baris. Per `11ed2d4` menjadi 1: buat penjualan dipecah menjadi 693 baris (`584d6ae`) dan form produk 673 baris; tersisa `components/ui/sidebar.tsx` (702, berkas shadcn) |

Tahap desain token sengaja tidak dicampur dengan refactor arsitektur, agar
setiap commit tetap fokus. Warna utama sudah menjadi token pada fase UI/UX
11 Oktober 2026; tipografi dan spasi belum.

## Pekerjaan berikutnya

Keadaan per 10 November 2026: backend lokal `ridho` `0bbd261`,
di-fast-forward ke `yoga` (8 commit di atas `origin/ridho` `0e43a6d`,
yang maju 18 commit di atas `e9112a8`: P68 sampai P77, AR30 sampai AR34,
B292 sampai B318) tanpa di-push. Penyesuaiannya pesan kategori kembar
(KG1a), tipe kategori, dan muat ulang pengguna setelah 409 B315;
keputusan LK2a, VK1a, RT1a, dan OM1a tanpa perubahan kode
(`referensi/keputusan-penyesuaian-backend.md`).

Keadaan per 8 November 2026 (sore): backend lokal `ridho` `e9112a8`,
di-fast-forward ke `nizar` (28 commit di atas `916e7df`, memuat `yoga`
`1d3851d`: P65 sampai P67, B283 sampai B291) tanpa di-push. Tidak ada
perubahan kode web: LR1a laba rugi tetap seluruh toko, LR2a arus kas
menunggu desain, dan PG1a pesan 403 Setujui rekan selokasi tampil apa
adanya (`referensi/keputusan-penyesuaian-backend.md`).

Keadaan per 8 November 2026: backend lokal `ridho` `916e7df`,
di-fast-forward ke `yoga` (16 commit di atas `origin/ridho` `d267f03`:
P61 sampai P64, B267 sampai B282) tanpa di-push. Penyesuaiannya PS10a
pembelian memotong saldo (`b66a6eb`), LK1a lokasi kerja di dialog
pengguna (`4fe201b`), dan AB6a label kedatangan di Status Staf
(`69f2b18`); Model bisnis MVP diperbarui mengikuti P61
(`referensi/keputusan-penyesuaian-backend.md`).

Keadaan per 7 November 2026: backend lokal `ridho` `d267f03`, sama
dengan `origin/ridho` (tujuh commit Ridho di atas `1584222`: AR26 sampai
AR29, B263 sampai B266). Penyesuaiannya hanya B266 (`5b6ff0d`), dicatat
di `referensi/keputusan-penyesuaian-backend.md`. Sesudahnya utang tanpa UI
baru dikerjakan (pemilik proyek, 7 November 2026): syarat fixme lintas
outlet dibuang (`860ff15`), B250 dan B255 dibuktikan e2e (`778eb2d`), dan
tombol tulis menurut izin serta butir 158 diuji lewat pengguna uji
terbatas (`cbfa23b`, `4601d91`), termasuk tombol Tambah Akun yang kini
menurut izin. Pekerjaan yang selesai sejak
penyesuaian `4759208` (4 sampai 6 November 2026, butir 1 sampai 10
beserta urutan yang disetujui 4 November 2026) dipindah ke
`arsip/catatan-putaran.md` (Catatan dari penyesuaian backend `4759208`
sampai `c031bde`); rujukan "butir 4 (wizard)", "butir 6 (sesi kasir)",
dan "butir 7" di dokumen lain merujuk daftar di sana.

Pada 7 November 2026 Mesin Kasir disambung (`b74f30a`) dan keempat
butir tanpa UI baru selesai (`arsip/catatan-putaran.md`, Catatan dari
penyambungan Mesin Kasir dan Catatan dari pekerjaan tanpa UI baru
7 November 2026). Yang dapat dikerjakan berikutnya menunggu backend
(langkah jam buka, butir 176), desain pemilik proyek, atau keputusan
pemilik proyek (bagian di bawah).

Backend dijalankan dengan env inline agar `.env` backend tidak diubah
(`inti/pengujian.md`, Menjalankan layanan uji). Kode backend tidak
diubah dari sisi frontend. Langkah pertama setiap sesi memeriksa apakah
cabang backend maju:

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in ridho nizar yoga; do echo "origin/$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...origin/$r | tr '\t' ' ')"; done
```

### Mesin Kasir, sisi backend

Penyambungan selesai di `b74f30a` (`modul/keuangan.md`, MK10a sampai
MK13a; daftar periksanya di `arsip/catatan-putaran.md`, Catatan dari
penyambungan Mesin Kasir). Yang masih terbuka di sisi backend:
`kontrak/temuan.md` butir 172 sampai 174; keputusan bisnis nomor 1
sampai 3 di audit backend 5 November 2026 (K-08 sampai K-10), yang
diputuskan pemilik proyek 10 November 2026 sebagai MK15a sampai MK17a
(`modul/keuangan.md`) dan menunggu diterapkan backend; serta K-18 (pemetaan menerima
perangkat berstatus apa pun) dan K-19 (`installationId` seluruh HP
keluar di laporan sesi). Di web, K-18 ditangani dengan menyaring
perangkat `trusted`, dan K-19 dengan tidak menampilkan `installationId`.

### Penyambungan langkah jam buka

Tampilan langkah jam buka selesai tanpa API (`b48cfdb`, `1386a30`;
`modul/setup-akun.md`, JB1a sampai JB7a) dan dipratinjau di
`/setup/pratinjauJamBuka`. Penyambungannya menunggu backend
(`kontrak/temuan.md` butir 176), yang kebutuhannya diserahkan ke Ridho,
Yoga, dan Nizar pada 7 November 2026. Daftar periksa:

1. Kontrak backend jam per hari: status Buka, 24 jam, atau Libur beserta
   jam buka dan tutup per hari, penanda 24 jam yang berbeda dari belum
   diatur, dan kriteria jam buka di `GET /api/setup/status`.
2. `LANGKAH_JAM_BUKA` masuk `daftarLangkah` sesudah lokasi,
   `PETA_LANGKAH.jamBuka` diisi kunci server, dan langkah tersambung
   menyimpan lewat `features/tenant` dengan nilai awal dari data tenant.
3. Langkah yang sudah tersimpan tampil sebagai ringkasan tanpa tautan,
   seperti ringkasan langkah lain sejak `daf9e3a` (WS6a).
4. Spec alur nyata di `tests/e2e/setup/setup.spec.ts` (jumlah langkah per
   plan bertambah satu), lalu hapus `features/setup/pratinjau-jam-buka.tsx`,
   `app/setup/pratinjauJamBuka`, dan
   `tests/e2e/setup/pratinjau-jam-buka.spec.ts`.
5. Jam buka di Profil Toko memakai komponen yang sama; pemakaiannya di
   shift dan jadwal diputuskan pemilik proyek saat penyambungan.
6. Tur sorotan langkah jam buka: teksnya diajukan ke pemilik proyek,
   lalu titiknya ditambah di `features/setup/titik-panduan.ts` dan
   langkahnya memberi prop `panduan` ke `JudulLangkah` (keputusan
   rancangan butir 32; `modul/setup-akun.md`, PN2a dan PN3a).

### Pekerjaan UI berikutnya

Dicatat pemilik proyek 12 November 2026, dikerjakan sesudah putaran ini
dengan alur kanvas desain seperti butir di bawah:

1. **Laman Keuangan pindah ke sub-sidebar Keuangan.** Tab Keuangan sudah
   terlalu banyak (Ringkasan Laba/Rugi, Arus Kas, Mutasi Kas, Akun Kas &
   Bank, Belanja Stok, Mesin Kasir), sehingga seluruh laman itu dipindah
   menjadi anak menu Keuangan di sidebar.
2. **Perbaikan bug visual di laman buat penjualan**
   (`features/penjualan/halaman-buat-penjualan.tsx`). Rincian bugnya
   ditanyakan ke pemilik proyek saat butir ini dimulai.

### Menunggu desain pemilik proyek

Butir yang butuh UI baru tidak dikerjakan dulu (pemilik proyek, 5 dan
6 November 2026). Urutannya disetujui 4 dan 5 November 2026.

1. **Isian password di halaman verifikasi email**, sisa B248: selesai
   12 November 2026 (opsi A, `modul/setup-akun.md` TP6a). Tanpa password
   titipan, halaman menampilkan Password akun dan Ulangi password, yang
   tidak dikosongkan saat kode salah; tanpa email di alamat tetap pesan
   galat. Spec e2e-nya menunggu suite penuh di akhir putaran.
2. **Belum dijadwalkan, perlu desain**: logo toko selesai 12 November
   2026 (`modul/pengaturan-outlet.md`, PO17a dan PO18a); jam operasional
   B206 menyusul penyambungan langkah jam buka, di atas; OTP reset PIN
   Owner dan ubah
   email atau password akun (B178 sampai B180); hapus akun oleh Owner
   (B181). Pengingat masa langganan selesai 12 November 2026 lewat
   lonceng topbar (`modul/setup-akun.md`, TP8a).
3. **Halaman arus kas** (B291, LR2a): selesai 12 November 2026, tab
   Keuangan "Arus Kas" dengan desain D pemilik proyek (`modul/keuangan.md`,
   LR3a sampai LR6a).
4. **Omzet per metode pembayaran di laporan** (OM1a): menunggu endpoint
   backend lebih dulu (`kontrak/temuan.md` butir 180), lalu didesain
   pemilik proyek.
5. **Stok keluar di detail penjualan, termasuk yang VOID** (VD3a):
   menunggu backend mencatat rinciannya (`kontrak/temuan.md` butir 181),
   lalu didesain pemilik proyek.
6. **Modul membership web** (paket dan pendaftaran member), syarat
   menawarkan diskon khusus member (NZ6a, `modul/pelanggan-diskon.md`).

### Menunggu keputusan pemilik proyek

- Nomor WhatsApp admin untuk halaman Langganan (LG1a, `NOMOR_WA_ADMIN`
  masih kosong).
- Laporan untuk tim backend, yang ditunda sampai pekerjaan backend dari
  audit selesai (utang kecil, di bawah).

Diputuskan 10 November 2026: keputusan bisnis Mesin Kasir MK15a sampai
MK17a (`modul/keuangan.md`, menunggu backend), ruang mengikuti lokasi
kerja LK3a (`modul/jadwal-shift.md`), Tandai Selesai tetap di detail
penjualan (NZ7a) dan khusus member menunggu modul membership (NZ6a),
nama toko di login pengguna TP2b (`modul/setup-akun.md`), dan Lampiran
A dibangkitkan ulang RG9a. Yang dapat dikerjakan web sekarang: TP2b,
LK3a, dan RG9a.

### Utang kecil dari penyesuaian backend `4759208`

- Data toko uji wizard (lokasi, kategori, produk, pajak, dan seterusnya)
  menetap di basis data development setelah akun ujinya dihapus, karena
  hapus akun tidak menghapus tokonya; setiap run spec setup menambah enam
  toko.
- Laporan untuk tim backend belum disusun (`inti/backend.md`, Bila
  menemukan bug backend). Bahannya ditinjau ulang terhadap backend
  `ridho` lokal `0bbd261` dan `docs/pengembangan/klien.md` backend pada
  10 November 2026. Penomoran di sana bergeser satu mulai butir web
  167 (tercatat 166), sehingga butir dicocokkan menurut isinya.
  - **Temuan baru, masih berlaku di `0bbd261`**: `kontrak/temuan.md`
    butir 168 (cookie refresh `POST /tenant`), 169 (`db:data-bawaan`
    mencocokkan nama), 170 (penanda masa percobaan), 172 sampai 174
    (perangkat dan asal penutupan sesi kasir), 177 (logout akun tidak
    mencabut sesi pengguna), 178 (penyimpanan penjualan bersamaan;
    diuji ulang 10 November 2026 sesudah P-03 dan masih terjadi: stok
    turun 6 untuk satu penjualan tersimpan), dan 179 (lokasi
    kerja pengaju, B284), dan 182 (tipe lokasi kerja tidak terbaca tanpa
  `read-location`, LK3a). Butir 180 (omzet per metode pembayaran, OM1a)
    sudah dicatat langsung di `docs/pengembangan/klien.md` backend
    `dd6bc98` atas perintah pemilik proyek, dan butir 181 (stok keluar
    per penjualan tidak tertelusur, VD2a) di `aeb6a52`; keduanya cukup
    dirujuk.
  - **Pembuktian, satu baris per butir**: butir 12 (hapus kategori yang
    dipakai, P19) dan 52 (hapus aset ber-booking), P18 hapus bahan,
    butir 14 (kembar 409, B304; spec `crud-kategori` lolos di suite
    penuh 10 November 2026), butir 13 (`kategoriID` produk diperiksa
    keberadaannya) dan 16 (cache produk dibuang saat kategori berubah)
    dari respons nyata 10 November 2026; B215, B217, B229 sampai B232, B251
    (`a207fae`), dan B248 (`efb05db`) dari web; B252 dan B259 sampai
    B261 (penyesuaian `1584222`) serta B266 (`d267f03`) dari respons
    nyata; B250 dan B255 terbukti e2e 7 November 2026 (`778eb2d`); B269,
    B279, B281, dan B282 (`916e7df`) serta B290 dan B291 (`e9112a8`)
    dari respons nyata.
  - **Belum dibuktikan**: butir 85 dan 107 (B50, B51), B169, dan B170
    yang menunggu web sejak AR31 (VK1a).
  - **Dikeluarkan karena basi**: butir 167 (selesai lewat B240,
    `GET /akun/me`; web belum memakainya, TP2a), 141, 155, 156, 158,
    160, 162, dan 164 beserta B112, B114, B115, dan B116 (ditutup
    `Selesai` oleh backend AR31 dengan bukti web), 165 (ditutup backend
    dengan catatan staf tanpa lokasi kerja; tambahan web tetap), 94
    (tertutup sejak `1584222`), dan 176 (dilaporkan 7 November 2026).
  Laporannya ditunda sampai pekerjaan backend dari audit
  selesai, agar diserahkan sekali jalan (pemilik proyek, 6 November
  2026).
- Akun uji `toko@gmail.com` dinaikkan ke Pro lewat API admin, karena
  akun lama dibaca Basic (B212) dan Basic menolak sesi booking (B216).
  Riwayat langganannya kini berisi satu catatan `ubah-plan`.
- `db:setup-toko-lama` menandai empat toko yang ada saat itu selesai
  setup inti. Jangan dijalankan ulang di basis data lokal setelah spec
  membuat akun pendaftar, karena akun itu ikut ditandai selesai.

## Utang kecil yang tertunda

### Persiapan produksi di VPS

Frontend ditempatkan di VPS yang sama dengan backend, di belakang Caddy
backend, dengan subdomain sendiri: `/api/*` diteruskan Caddy langsung ke
backend, sisanya ke container frontend; domain API tetap untuk aplikasi
Flutter (pemilik proyek, 7 November 2026). Syarat dari pemilik proyek:
lebih cepat dan efisien dengan tampilan dan hasil yang sama. Yang sudah
selesai:

- `output: "standalone"` di `next.config.ts`; `npm run build` menyalin
  `public` dan `.next/static`, dan `npm start` menjalankan
  `.next/standalone/server.js`. Dev server dan e2e tetap `next dev`.
- `Dockerfile`, `.dockerignore`, `deploy/Caddyfile.web`,
  `deploy/compose.web.yml`, dan `deploy/README.md`. Image dibangun dan
  container sehat (user `node`, sekitar 56 MB RAM); Caddyfile lolos
  `caddy validate`.
- Grafik dashboard outlet dimuat terpisah lewat `next/dynamic`, dengan
  unduhan dimulai saat panel dipasang: muatan awal dashboard turun dari
  449 menjadi 356 KB gzip, dan `tests/e2e/dashboard` 12 lolos.

Sisa, dikerjakan pemilik proyek di repo backend saat VPS siap
(`deploy/README.md`, Langkah sekali): blok Caddy web, service `frontend`
di compose, `WEB_DOMAIN`, domain web di `CORS_ORIGINS`, dan bagian
Arsitektur `deploy/RUNBOOK.md` yang masih mencatat frontend di Vercel.
Ukuran pada 7 November 2026: server produksi sekitar 112 sampai 165 MB
RAM, build memuncak sekitar 2 GB.

### Utang kecil dari kerapian repo

- Folder `tests/` (225 berkas) masih ikut di repo publik GitHub, termasuk
  kredensial uji. Rencananya (pemilik proyek, 7 November 2026, dicatat
  sebagai utang): isi `tests/` dipindah ke repo privat terpisah, misalnya
  `Mr-Gahara/frontend-web-tests`; di `frontend-web`, `tests/` masuk
  `.gitignore` dan dikeluarkan dari pelacakan (`git rm -r --cached
  tests`). Di laptop lain: `git clone` `frontend-web`, lalu `git clone`
  repo test ke folder `tests`. Commit test dijalankan di dalam `tests/`.
  Riwayat lama tidak ditulis ulang; isinya hilang saat repo dibuat ulang
  (keputusan 25 Oktober 2026).
- `CLAUDE.md` dan `AGENTS.md` dikeluarkan dari repo dan masuk
  `.gitignore` (pemilik proyek, 7 November 2026). Di laptop lain keduanya
  dibuat ulang: `CLAUDE.md` berisi `@AGENTS.md`, dan `AGENTS.md` berisi
  peringatan bahwa versi Next.js ini berbeda dari data latih dan panduan
  di `node_modules/next/dist/docs/` dibaca sebelum menulis kode.

### Utang kecil dari penanda dan panduan wizard

Penanda dan tur sorotan wizard serta dashboard selesai di `58d7eb9`,
`aa3c1c6`, `c8a2e83`, dan `5c3da45`, dan ringkasan tersimpan tanpa
tautan (WS6a) di `daf9e3a` (`modul/setup-akun.md`, PN1a sampai PN4a).

- Ruang gudang dan langkah jam buka belum punya tur
  (`modul/setup-akun.md`, Utang terbuka).

### Utang kecil dari perbaikan HP Keuangan

- Padding area gulir dashboard di HP turun dari 24 px menjadi 16 px
  untuk seluruh halaman (`b3f8698`, `modul/keuangan.md` KH2b). Spec yang
  punya skenario lebar HP lolos (Keuangan, dashboard outlet, dan
  langganan), tetapi halaman lain belum dilihat langsung di HP. Suite
  e2e penuh 7 November 2026 lolos untuk seluruh spec lama.

### Utang kecil dari penyesuaian backend `ridho` `0024eb9`

- Monitoring per lokasi tidak memuat staf yang izin (`kontrak/temuan.md`
  butir 165); panel Status Staf menambah karyawan ruang menurut peran
  yang izin hari itu sampai backend memperbaikinya. Backend `916e7df`
  (B278) memuat staf yang izin hanya bila lokasi kerjanya lokasi itu,
  sehingga tambahan web tetap untuk staf tanpa lokasi kerja.
- Jalur role tanpa izin SDM baru, tanpa `read-location`, dan tanpa izin
  lintas outlet hanya teruji di unit test, karena akun uji berperan
  Owner (`referensi/utang-pengujian.md`).
  Jalur tanpa izin lintas outlet teruji e2e sejak `1cd8211`, lewat
  pengguna uji "E2E Tanpa Lintas Outlet"; jalur tanpa izin SDM baru dan
  tanpa `read-location` tetap hanya teruji di unit test.
- Jurnal stok tetap mengirim satu `locationID` untuk Semua Outlet,
  walau backend menerima `tipeLokasi` (B109); berpengaruh hanya bila
  tenant punya lebih dari satu outlet (`kontrak/temuan.md` butir 151).
  Ditunda sampai multi-outlet (pemilik proyek, 7 November 2026).
- Fixture izin cuti menetap di basis data development, karena backend
  tidak punya hapus izin; setiap hari yang menjalankan spec dashboard
  menambah dua izin.

### Utang kecil dari penyesuaian backend `ridho` `877e493`

- B112 terbukti dari respons nyata 7 November 2026; B114 hanya jalur
  Owner dan B115 hanya formatnya (`kontrak/temuan.md` butir 155 dan
  164).
- Penerimaan (outlet) dan pengiriman (gudang) tetap daftar kartu mode
  klien dengan polling; tidak termasuk butir 150.

### Utang kecil dari penyesuaian backend `ridho` lokal `916e7df`

- Ruang mengikuti lokasi kerja sejak LK3a (10 November 2026), kecuali
  bagi staf berlokasi kerja tanpa `read-location` (`kontrak/temuan.md`
  butir 182). Sebelumnya staf berlokasi
  kerja yang membuka ruang lain melihat pesan 403 backend di setiap
  halaman stok, dan sejak backend `e9112a8` juga di pembelian stok,
  penjualan, pembayaran, sesi kasir, panel Status Staf, dan laba rugi
  (B283, B286 sampai B290), serta sejak `0bbd261` dashboard gudang dan
  stok produk ber-`locationID` (B317, B318). Atasan berlokasi kerja yang
  memberi lokasi lain di dialog pengguna melihat pesan 403 (B310, LK2a).
- Beban tetap dicatat tanpa `locationID` (tingkat toko) atas keputusan
  pemilik proyek; pilihan lokasi beban ditinjau bersama laporan laba
  rugi per outlet saat multi-outlet (P63, B279, B280, LR1a).
- Label kedatangan Status Staf (AB6a) hanya teruji di unit test
  (`referensi/utang-pengujian.md`).

### Utang kecil dari pengembalian Outlet ke Gudang

- Daftar Kirim Barang memakai asal bertipe Outlet tanpa pemilih (AR10a).
  Untuk multi-outlet, terapkan cakupan outlet seperti Terima Barang
  (`lingkupOutlet` dan `PemilihLokasiOutlet`). Ditunda sampai
  multi-outlet (pemilik proyek, 7 November 2026).
- Kartu siap surat jalan dashboard gudang dihitung server untuk kedua
  arah, sedangkan tab Perlu Surat Jalan gudang hanya memuat permintaan
  (AR6a). Angkanya melebihi isi tab bila ada pengembalian yang disetujui
  dan menunggu surat jalan outlet; perlu hitungan per arah dari backend
  atau kartu tersendiri.
- Repo frontend dibuat ulang sebagai repo baru dengan pemilik proyek
  sebagai satu-satunya kontributor, setelah seluruh pekerjaan selesai dan
  masuk produksi (pemilik proyek, 25 Oktober 2026). Seluruh commit yang
  terjangkau per tanggal itu ditulis `Mr-Gahara` tanpa atribusi lain,
  dan remote hanya punya `main` tanpa ref pull request, tetapi daftar
  kontributor GitHub masih menampilkan Claude.
  Per 31 Oktober 2026 API contributors hanya memuat `Mr-Gahara`; yang
  tertinggal panel Contributors halaman repo dan commit `68cd7da` yang
  diganti `8b5ad0f` (`inti/cara-kerja.md`, Atribusi commit).

### Utang kecil dari penyesuaian backend `ridho` `7d28135`

- Ketertinggalan Lampiran A (izin `/pembelianstok` dan
  `DELETE /bebanoperasional/:id`) lunas: Lampiran A dibangkitkan ulang
  terhadap `aeb6a52` pada 10 November 2026 (RG9a).
- Kategori fixture "E2E Kategori Beban" dan satu beban VOID menetap di
  basis data development (RG7a).

### Utang kecil dari penyesuaian backend `ridho` `2dd57aa`

- Nama penyetuju di daftar pengajuan stok terisi sejak `7d28135` (butir
  145); belum dipakai web.

### Utang kecil dari penyesuaian backend `nizar`

- Booking milik sebuah penjualan belum disertakan di respons detail
  penjualan; permintaannya ditunda (NZ9a).
- Bagian Sesi Booking di detail penjualan memakai tata letak sederhana di
  atas grid informasi; penempatannya menunggu fase UI/UX.
- Timeline reservasi tidak punya aksi Tandai Selesai (NZ7a). Booking lama
  berstatus Batal dibaca VOID sejak backend `nizar` `8dc6211`; respons
  7 November 2026 tidak memuat satu pun status Batal, sehingga timeline
  tidak dapat menampilkannya (`kontrak/temuan.md` butir 141).
- Khusus member belum ditawarkan di form diskon (NZ6a); ditinjau bersama
  modul membership.
- Mutasi transfer di buku mutasi tidak bertaut ke riwayat Pindah Dana,
  karena riwayat itu tidak punya halaman per transfer.

### Utang kecil dari penyesuaian backend `fc29433`

- Pilihan satuan resep hanya terbukti dari respons nyata untuk bahan
  bersatuan pcs, gram, dan ml. Untuk kg, liter, pak, dan unit, isi
  `availableUnits` dibaca dari kode backend, karena data development
  tidak punya bahan bersatuan itu. Sejak `f64b518` bahan bersatuan pak
  terbukti lewat e2e.

### Utang kecil dari penyesuaian backend `f27f093`

- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
