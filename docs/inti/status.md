# Status

Sifat perubahan: **Sering**, setiap modul selesai.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Keadaan pekerjaan refactor: fase yang sudah selesai, metrik, dan pekerjaan
berikutnya. Diperbarui setiap kali satu modul selesai (`docs/README.md`, Cara
memperbarui dokumentasi).

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul.
Diukur ulang 18 November 2026 per `4dc08e2` dengan perintah di
`docs/README.md`; heksadesimal dihitung dengan
`grep -rEo "#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b" app components features lib`.
Diukur ulang 20 November 2026 per `86f2a0b`: kelima angka sama dengan
per `4dc08e2`. Diukur ulang 23 November 2026 sesudah penyesuaian backend
`1718030`: warna heksadesimal 42 karena token baru `--rose-redup`
(RK1a), empat angka lain sama.

| Hal | Awal | Per `4dc08e2` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 0 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan; dari 25 per `845c2cf` menjadi 16, lewat penyesuaian `465b438` dan halaman metode pembayaran, lalu 12 setelah halaman pajak (`e0aaeca`), 9 setelah halaman pelanggan (`d9365d3`), 7 setelah halaman diskon (`1e05df6`), 4 setelah halaman profil, login, dan sidebar (`57a7084`), dan 0 setelah error ESLint warisan (`4f19e77`) |
| Kemunculan `_id` | - | 7 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id`. Perintahnya ikut menghitung komentar: naik 1 di `eef371a` dari komentar normalisasi di `features/sesi-booking/api.ts`. Turun 13 di `45187b6`: 12 dari data tiruan mutasi arus kas dan 1 dari daftar akun kas. Turun 3 di `f99b7cf`: 4 dari halaman dan tabel shift, dikurangi 1 dari komentar normalisasi di `features/shift/api.ts`. Turun 7 di `dcc22e0` dari halaman, tabel, dan form pola roster. Turun 7 di `19227f8` dari halaman jadwal outlet, jadwal gudang, dan generate. Turun 9 lagi sampai `3359497`, dari penyesuaian `465b438` dan halaman metode pembayaran. Turun 7 di `e0aaeca` dari halaman pajak. Turun 2 di `d9365d3` dari halaman pelanggan. Turun 2 di `1e05df6` dari halaman diskon. Turun 1 di `091be4e` dari komentar halaman profil. Naik 1 di `10c7efb` dari komentar normalisasi di `features/admin-akun/api.ts`. Turun 1 di `4f19e77` dari cadangan `_id` di dialog pengguna. Per 18 November 2026 ketujuhnya komentar normalisasi (`id`, bukan `_id`), tidak ada di kode |
| `useAuthGuard()` berulang di halaman | 49 | 2 | Dihitung di `app/` saja. Yang tersisa `app/dashboard/layout.tsx`, satu-satunya pemanggil, dan berkas hook-nya sendiri; ke-24 pemanggilan berulang di `app/` dan ke-13 di `features/` dibuang di `628f52e` (26 sebelum itu). Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, keempat halaman penjualan, buat reservasi, shift outlet, pola roster outlet, ketiga halaman metode pembayaran, halaman pelanggan, halaman diskon, dan halaman profil) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | 42 | Lima warna utama menjadi token di `app/globals.css` (`584a2d8`, `ba28f25`; keputusan WR1a sampai WR4a). Tepat sebelum penggantian terukur 3.764 di `app`, `components`, `features`, dan `lib`. Per `9cd22e1` tersisa 68. Sejak `c437d68` (CV21a) tidak ada lagi pemakaian di halaman: ke-41 itu 36 definisi token di `app/globals.css` dan 5 selektor bawaan shadcn di `components/ui/chart.tsx`. Menjadi 42 pada 23 November 2026 karena token `--rose-redup` (RK1a) |
| Berkas di atas 700 baris | 7 | 1 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.087 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. Per `57a7084` menjadi 3: `components/app-sidebar.tsx` dipecah menjadi 325 baris (keputusan PF4a), dan tersisa buat penjualan (1.090), `features/produk/form-produk.tsx` (803), serta `components/ui/sidebar.tsx` (702). Per `9195472` menjadi 4: `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700 (714 baris) karena penjaga ruang (`eb0181f`), dan buat penjualan menjadi 1.087 baris setelah kode mati dibuang (`6b5e1cc`). Per `b887278` form produk menjadi 809 baris (pemeriksaan satuan resep). Per `628f52e` tetap 4; detail stock opname menjadi 712 baris setelah pemanggilan guard dibuang. Per `7d4c234` form produk 835 baris (isian stok minimal, B237). Per `5b8cbd9` tetap 4: buat penjualan 1.098 baris (`waktuTransaksi` dan jam berjalan, `7a08b63`), form produk 809, detail stock opname 702, dan `components/ui/sidebar.tsx` 702. Per `a611b59` menjadi 3: dialog aksi detail stock opname dipisah, sehingga halamannya 612 baris. Per `11ed2d4` menjadi 1: buat penjualan dipecah menjadi 693 baris (`584d6ae`) dan form produk 673 baris; tersisa `components/ui/sidebar.tsx` (702, berkas shadcn) |

Tahap desain token sengaja tidak dicampur dengan refactor arsitektur, agar
setiap commit tetap fokus. Warna utama menjadi token pada fase UI/UX
11 Oktober 2026, seluruh warna dan tipografi 14 November 2026 (CV21a,
CV24a), dan spasi pembungkus halaman diseragamkan 18 November 2026
(keputusan rancangan butir 35, SP1a).

## Pekerjaan berikutnya

### Mulai di sini (sesi berikutnya, dicatat 23 November 2026 sore)

Keadaan akhir sesi 23 November 2026: backend `ridho` `1718030` (tidak maju
sejak 22 November). Dua putaran selesai hari itu:

1. **Penyesuaian backend `1718030`** (`referensi/keputusan-penyesuaian-backend.md`):
   B347, B348, ekspor dan unduh laporan (UD1a sampai UD3a), kemasan dan
   satuan (KN1a sampai KN3a), dan Rekap Absensi (RK1a).
2. **Bug dan temuan frontend**: tautan mutasi PEMBELIAN (TM1a), akun kas
   uji tetap (AU1a), metode pembayaran tanpa `read-akunkas` (MP1a),
   sebutan Kategori Aset (KA1a), satu form tarif (TF1a, beserta regresi
   harga kosong yang dibetulkan), pesan 403 yang menyebut halaman dan izin
   (GR9a), bayangan baris per sel (BB1a), dan halaman ubah akun kas dari
   `GET /akunkas/:id`. Catatan logout `pin-logout` ternyata sudah selesai
   di backend B343.

Urutan kerja berikutnya, atas perintah pemilik proyek: butir daftar
20 November 2026 dan 19 November 2026 di bawah yang belum selesai (rombak
UI/UX laman admin, deskripsi paket laman pengenalan, revisi laman profil
dan menu popup profil), nomor WhatsApp admin (LG1a), dan utang pengujian
kelompok 1. **Suite e2e penuh ditunda sampai seluruh pekerjaan selesai**
(pemilik proyek, 20 November 2026); harapannya 722, dan sesudahnya skrip
`bersih-akunkas.js` (AU1a).

### Keadaan sebelum 23 November 2026

Sesi 20 November 2026 malam: kerapian seluruh laman (KL1b, TH1a, TI1a,
KF1a, TT1a, PP1a), utang pengujian bagian C, dan pembuktian kontrak 68
sampai 72 (`modul/ui-ux.md`, `inti/pengujian.md`); backend lokal `ridho`
`2790fc7`.

Laporan backend 186 sampai 188 (`kontrak/temuan.md`) sudah diberikan ke
pemilik proyek; ketiganya diperbaiki backend 22 November 2026 dan
dibuktikan web 23 November 2026.
Butir 189 (satuan kemasan seperti pak tidak dapat dipakai sebagian di
resep; temuan pemilik proyek 20 November 2026) diputuskan backend
22 November 2026 (P87) dan disesuaikan web 23 November 2026
(`modul/produk-kategori.md`, KN1a sampai KN3a).

Keadaan per 16 November 2026: backend lokal `ridho` `4a19be8`, sama
dengan remote, 29 commit di atas `d6709a1` (Nizar K-08 sampai K-10,
B324 sampai B329; Ridho P80 sampai P82, B330 sampai B344). Ridho
menutup seluruh butir web yang menunggu backend (168 sampai 184, K-18,
dan K-19). Web menyesuaikan diri dalam 13 commit, `e1ea235` sampai
`6ab81aa`: sesi kasir (MK3b, MK5b, MK6b), lokasi kerja tanpa
`read-location`, Setujui rekan selokasi (PG2a), langganan (LG4a),
timeline reservasi (TL1a), metode tunai berlaci (PB15a), langkah jam
buka (JB8a), dan paginasi server empat daftar (PV1a, PV2a)
(`referensi/keputusan-penyesuaian-backend.md`).

Keadaan per 17 November 2026: backend lokal `ridho` `3570bd4`, sama
dengan remote, lima commit di atas `4a19be8`, termasuk gabungan `nizar`
`a79c087`. Ridho menutup butir 185 (masa tenggang rotasi refresh, P83,
B345) dan menyaring perangkat toko menurut lokasi kerja (AR36, B346).
Web tidak berubah kodenya; B345 dibuktikan lewat spec baru
`auth/tenggang-pin-refresh`, dan B346 belum dibuktikan web
(`referensi/keputusan-penyesuaian-backend.md`). Suite penuh sesudahnya
665 lolos, 1 gagal, dan 1 dilewati dari 667; kegagalannya bug tur gudang
(TG2a) yang diperbaiki dan dibuktikan lewat spec terdampak
(`arsip/riwayat-pengujian.md`, Riwayat baseline).

Keadaan per 18 November 2026: backend lokal `ridho` `2790fc7`, satu
commit dokumen di atas `3570bd4` (checkpoint `status/ridho.md`, butir 3
mencatat B169, B170, dan B346 menunggu web). Seluruh kontrak yang belum
dibuktikan web ditutup: B169, B170, dan B346 lewat e2e (`5f57454`), butir
178 dan 169 lewat skrip, dan butir 77 diuji ulang 570 kali tanpa
tereproduksi (`referensi/keputusan-penyesuaian-backend.md`, Pembuktian web
18 November 2026). Sesudahnya form ubah produk beresep menampilkan stok
terhitung (SR1a), seluruh pembungkus halaman diseragamkan dengan 16 px di
HP (SP1a, SP2a), metrik diukur ulang, dan data uji yang menumpuk
dibersihkan (Utang kecil dari penyesuaian backend `4759208`).

Keadaan per 20 November 2026: backend lokal `ridho` `2790fc7`, tidak
maju sejak 18 November. Mutasi transfer bertaut ke rincian transfernya
(DN5a, `86f2a0b`), suite penuh dijalankan, tanggal panel filter
berbulan singkat (FL20a, `99ecd4c`), dan butir status yang basi
diverifikasi terhadap kode lalu dipindah ke arsip.

Keadaan per 7 sampai 10 November 2026 dipindah ke
`arsip/catatan-putaran.md` (Keadaan pekerjaan 7 sampai 10 November 2026)
pada 14 November 2026, termasuk keterangan rujukan "butir 4 (wizard)",
"butir 6 (sesi kasir)", dan "butir 7" di dokumen lain.

Backend dijalankan dengan env inline agar `.env` backend tidak diubah
(`inti/pengujian.md`, Menjalankan layanan uji). Kode backend tidak
diubah dari sisi frontend. Langkah pertama setiap sesi memeriksa apakah
cabang backend maju:

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in ridho nizar yoga; do echo "origin/$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...origin/$r | tr '\t' ' ')"; done
```

### Yang selesai sebelum 18 November 2026

Mesin Kasir sisi backend, langkah jam buka, Pekerjaan UI berikutnya
12 sampai 16 November 2026, butir Menunggu pemilik proyek 14 November
2026, dan seluruh butir Menunggu desain pemilik proyek selesai, dan
catatannya dipindah ke `arsip/catatan-putaran.md` (Status yang selesai,
dipindah 20 November 2026) pada 20 November 2026; rujukan "Pekerjaan UI
berikutnya butir N" di dokumen lain merujuk daftar di arsip itu.

### Berikutnya, dicatat 18 November 2026

1. **Suite e2e penuh**: dijalankan 20 November 2026 atas perintah
   pemilik proyek, 676 lolos, 3 gagal, dan 1 dilewati dari 680. Ketiganya
   spec yang tertinggal dari filter seragam; salah satunya menemukan
   tanggal panel filter meluber, diperbaiki lewat FL20a (`99ecd4c`), dan
   seluruhnya dibuktikan lewat spec terdampak (`inti/pengujian.md`,
   Baseline).
2. **Utang pengujian yang basi atau murah ditutup**
   (`referensi/utang-pengujian.md`), ditawarkan 18 November 2026: selesai
   20 November 2026 sebagai bagian C (Mulai di sini, di atas). LK1a sudah
   dicatat basi sebagian di butirnya, keterangan khusus member teruji e2e,
   dan pesan jurnal stok gudang KM1a sudah diarsipkan 17 November 2026.
3. **Nomor WhatsApp admin** halaman Langganan (LG1a), di bawah.

Laman utama, ukuran tombol aksi, dan filter seragam, yang dicatat
pemilik proyek pada hari yang sama, selesai 19 November 2026
(`modul/ui-ux.md`, LU1a sampai LU5a, TK1a sampai TK6a, dan FL1a sampai
FL19a); catatannya dipindah ke arsip yang sama.

### Berikutnya, dicatat 19 November 2026

Dicatat pemilik proyek sesudah laman utama (LU1a sampai LU5a), dikerjakan
pada sesi berikutnya:

1. **Revisi tata letak dan UI laman profil pengguna**
   (`/dashboard/profil`, `features/pengguna/halaman-profil.tsx`). Arah
   revisinya perlu keputusan dan desain pemilik proyek.
2. **Revisi UI menu popup profil pengguna di kaki sidebar**: menu yang
   terbuka saat menekan profil pengguna di bagian paling bawah sidebar
   (`components/sidebar-pengguna.tsx`). Arah revisinya perlu keputusan
   dan desain pemilik proyek.

### Berikutnya, dicatat 20 November 2026

Dicatat pemilik proyek 20 November 2026, dikerjakan nanti atas
perintahnya:

1. **Rombak UI/UX laman admin platform** (`app/admin`,
   `features/admin-akun`: daftar, buat, detail, dan ubah akun klien,
   langganan, serta riwayatnya). Arah rombakannya perlu keputusan dan
   desain pemilik proyek.
2. **Perbaikan deskripsi paket di laman pengenalan** (`/`, `PAKET` di
   `features/laman-utama/konten.ts`: kalimat "untuk" dan daftar fitur
   Basic, Advanced, dan Pro). Isinya dicocokkan dengan pembatasan plan
   yang berlaku (`features/langganan/data.ts`, `modul/setup-akun.md`
   PL6a) dan diputuskan pemilik proyek.
3. **Kerapian spacing dan alignment seluruh laman** (pemilik proyek,
   20 November 2026): setiap laman rapi di HP, HP mendatar, tablet, dan
   desktop, horizontal maupun vertikal, tanpa elemen berdempet. Selesai
   20 November 2026 (`modul/ui-ux.md`, Kerapian seluruh laman): kartu lega
   menjadi bawaan semua `DataTable` (KL1b), dan pola bersama lain
   diputuskan lewat kanvas (TH1a, TI1a, KF1a, TT1a).
4. **Unduh PDF, Excel, atau CSV untuk laporan dan data penting**
   (dicatat pemilik proyek 20 November 2026). Selesai 23 November 2026
   sesudah backend menambah ekspor (P85, B349 sampai B358): Unduh per
   bulan di daftar penjualan, mutasi kas, pengeluaran, belanja stok, stok
   saat ini, jurnal stok, stock opname, dan adjustment (UD1a), Unduh
   laporan di Ringkasan Laba/Rugi dan Pembayaran per Metode (UD2a), dan
   laman Rekap Absensi (RK1a). Ditunda backend (P85 butir 1): pindah dana,
   mesin kasir, pengajuan dan surat jalan, produk dan bahan baku,
   pelanggan, membership, dan reservasi.

### Berikutnya: utang pengujian kelompok 1 yang tersisa (dicatat 20 November 2026)

Dicatat pemilik proyek 20 November 2026 sebagai pekerjaan berikutnya.
Jalur yang aturannya sudah teruji unit, tetapi belum dibuktikan e2e karena
akun uji berperan Owner. Setiap butir menambah peran dan pengguna uji
menetap lewat `tests/helpers/terkunci-uji.ts`, seperti bagian C
20 November 2026 (`referensi/utang-pengujian.md` memuat rinciannya):

1. **Template role membuka halamannya**: role dari template (stock opname,
   adjustment, absensi, pembelian) dipakai login dan membuka halaman yang
   dijanjikan templatnya; kini hanya pemetaan nama yang teruji.
2. **Mesin Kasir MK11a**: pemegang `kelola-perangkat-kasir` tanpa
   `read-pengguna` atau tanpa `read-akunkas`, dan pemilihan perangkat yang
   melewati pengguna berlevel sama atau lebih tinggi (403
   `GET /device/:userId`).
3. **Titik tur dashboard menurut izin dan plan**: tur bagi pengguna yang
   tidak memegang izin sebagian menu (`bolehLihatMenu`).
4. **Batas level role (RL3a)**: batas atas level, level pengguna yang
   tidak diketahui, dan perubahan level atau wewenang di payload ubah,
   dari pengguna bukan Owner.
5. **Pemilih produk tanpa izin baca produk** di form diskon, beserta
   `aksiDiskon`.
6. **Lokasi kerja (LK1a) di dialog pengguna** bagi pemegang
   `update-pengguna` tanpa `read-location`, dan untuk role Owner.

### Menunggu keputusan pemilik proyek

- Nomor WhatsApp admin untuk halaman Langganan (LG1a, `NOMOR_WA_ADMIN`
  masih kosong).

### Utang kecil dari penyesuaian backend `4759208`

- Data uji wizard yang menetap, pembersihan data uji 18 November 2026,
  dan laporan backend yang ditunda (LB1a) selesai; catatannya dipindah ke
  arsip yang sama. Cadangan sebelum pembersihan:
  `~/Documents/cadangan-db/db_produk-sebelum-bersih-2026-11-18.gz`.
- Data uji yang menumpuk dibersihkan lagi 20 November 2026 (pemilik
  proyek), setelah basis data dicadangkan ke
  `~/Documents/cadangan-db/db_produk-sebelum-bersih-2026-11-20.gz`, lewat
  skrip bermode tinjau `bersih-akunkas.js` dan `bersih-data-uji.js` di
  `~/.cache/frontend-web/alat/` (bawaan tinjau, `--hapus` untuk
  menerapkan). Kriterianya hanya data uji di toko uji yang tidak dirujuk
  dokumen lain, kecuali akun kas: atas keputusan pemilik proyek, 192 akun
  E2E non-aktif dihapus bersama 316 jurnal transfer Rp1 yang melibatkannya
  dan 956 baris mutasinya di kedua sisi. Saldo akun lawan dikoreksi sebesar
  efek transfer yang dihapus; efek bersihnya nol, sehingga saldo dan saldo
  berjalan "kasir outlet" dan "Kas Kecil (Laci)" tidak berubah. Rantai saldo
  berjalan "kasir outlet" sudah tidak konsisten sebelum pembersihan dan
  dibiarkan apa adanya. Dihapus juga 539 shift uji Aktif dan Non-Aktif, 4
  metode, 28 diskon, dan 39 pelanggan terhapus lunak. Data bukti temuan
  tidak disentuh: transfer Rp1,5 butir 126 beserta akun E2E-nya, tipe aset
  butir 77, bahan uji butir 143, surat jalan rusak, dan data butir 142.
  Riwayat pengujian yang menghasilkan data itu tetap tercatat di
  `referensi/utang-pengujian.md`, `inti/pengujian.md`, dan arsip.
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

- Repo frontend dibuat ulang sebagai repo baru dengan pemilik proyek
  sebagai satu-satunya kontributor, setelah seluruh pekerjaan selesai dan
  masuk produksi (pemilik proyek, 25 Oktober 2026). Seluruh commit yang
  terjangkau per tanggal itu ditulis `Mr-Gahara` tanpa atribusi lain,
  dan remote hanya punya `main` tanpa ref pull request, tetapi daftar
  kontributor GitHub masih menampilkan Claude.
  Per 31 Oktober 2026 API contributors hanya memuat `Mr-Gahara`; yang
  tertinggal panel Contributors halaman repo dan commit `68cd7da` yang
  diganti `8b5ad0f` (`inti/cara-kerja.md`, Atribusi commit).
- Folder `tests/` (272 berkas per 20 November 2026) masih ikut di repo publik GitHub, termasuk
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

### Utang kecil dari penyesuaian backend `ridho` `0024eb9`

- Monitoring per lokasi tidak memuat staf yang izin (`kontrak/temuan.md`
  butir 165); panel Status Staf menambah karyawan ruang menurut peran
  yang izin hari itu sampai backend memperbaikinya. Backend `916e7df`
  (B278) memuat staf yang izin hanya bila lokasi kerjanya lokasi itu,
  sehingga tambahan web tetap untuk staf tanpa lokasi kerja. Laporan
  lanjutan untuk tim backend disusun 20 November 2026 (butir 187).
  Selesai 23 November 2026: backend B348 memuat staf tanpa lokasi kerja
  yang izin, dan tambahan web dibuang.
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
  klien dengan polling; tidak termasuk butir 150. Selesai 20 November
  2026: keduanya berhalaman di server (`modul/inventaris.md`, TS2a,
  `e056daa`).

### Utang kecil dari penyesuaian backend `ridho` lokal `916e7df`

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

### Utang kecil dari penyesuaian backend `ridho` `7d28135`

- Kategori fixture "E2E Kategori Beban" dan satu beban VOID menetap di
  basis data development (RG7a).

### Utang kecil dari penyesuaian backend `ridho` `2dd57aa`

- Nama penyetuju di daftar pengajuan stok terisi sejak `7d28135` (butir
  145); belum dipakai web. Selesai 20 November 2026 (`modul/inventaris.md`,
  PI1a).

### Utang kecil dari penyesuaian backend `nizar`

- Booking milik sebuah penjualan belum disertakan di respons detail
  penjualan; permintaannya ditunda (NZ9a). Laporan untuk tim backend
  disusun 20 November 2026 atas perintah pemilik proyek (butir 186), dan
  web memuat setiap booking lewat `GET /sesibooking/:id` sampai backend
  menyertakannya. Selesai 23 November 2026: web membaca `sesiBooking[]`
  detail penjualan (B347).
- Bagian Sesi Booking di detail penjualan memakai tata letak sederhana di
  atas grid informasi; penempatannya menunggu fase UI/UX. Selesai
  20 November 2026 (`modul/penjualan.md`, SB1a).

### Utang kecil dari penyesuaian backend `fc29433`

- Pilihan satuan resep hanya terbukti dari respons nyata untuk bahan
  bersatuan pcs, gram, ml, dan pak (pak lewat e2e sejak `f64b518`).
  Untuk kg, liter, dan unit, isi `availableUnits` dibaca dari kode
  backend, karena data development tidak punya bahan bersatuan itu.

### Utang kecil dari penyesuaian backend `f27f093`

- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
