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

Keadaan per 16 November 2026: backend lokal `ridho` `4a19be8`, sama
dengan remote, 29 commit di atas `d6709a1` (Nizar K-08 sampai K-10,
B324 sampai B329; Ridho P80 sampai P82, B330 sampai B344). Ridho
menutup seluruh butir web yang menunggu backend (168 sampai 184, K-18,
dan K-19). Web menyesuaikan diri dalam 13 commit, `e1ea235` sampai
`6ab81aa`: sesi kasir (MK3b, MK5b, MK6b), lokasi kerja tanpa
`read-location`, Setujui rekan selokasi (PG2a), langganan (LG4a),
timeline reservasi (TL1a), metode tunai berlaci (PB15a), langkah jam
buka (JB8a), dan paginasi server empat daftar (PV1a, PV2a)
(`referensi/keputusan-penyesuaian-backend.md`). `nizar` `a79c087`
(dokumen) belum masuk `ridho`.

Keadaan per 7 sampai 10 November 2026 dipindah ke
`arsip/catatan-putaran.md` (Keadaan pekerjaan 7 sampai 10 November 2026)
pada 14 November 2026, termasuk keterangan rujukan "butir 4 (wizard)",
"butir 6 (sesi kasir)", dan "butir 7" di dokumen lain.

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
MK13a). Sisi backend tuntas di `4a19be8`: K-08 sampai K-10 diterapkan
Nizar (MK15a sampai MK17a; B324 sampai B326), dan butir 172 sampai 174,
K-18, serta K-19 ditutup Ridho (B334 sampai B337). Web memakai daftar
perangkat se-toko, nama mesin dari sesi, dan asal penutupan (MK3b,
MK5b, MK6b, `e1ea235`), serta menonaktifkan metode tunai berlaci di
form pembayaran (PB15a, `46ebfc3`).

### Langkah jam buka

Tersambung 16 November 2026 (JB8a, `46d90e1`; backend P81, B331): wizard
sesudah Lokasi outlet dan kartu Jam Buka di Profil Toko memakai isian
yang sama, dan pratinjaunya dihapus setelah spec alur nyata lolos
(`1171f33`). Pada hari yang sama tur sorotannya ditambah (JB9a,
`0c4cc7e`), dan jam buka dipakai di form shift, kalender, dan generate
ruang outlet lewat kanvas desain (JO1a dan JO2a, `fddb3c6`;
`modul/jadwal-shift.md`).

### Pekerjaan UI berikutnya

Dicatat pemilik proyek 12 November 2026, dikerjakan sesudah putaran ini
dengan alur kanvas desain seperti butir di bawah:

1. **Laman Keuangan pindah ke sub-sidebar Keuangan**: selesai 12 November
   2026. Keuangan dan Laporan menjadi dua menu lipat, bar tab dibuang,
   judul dan kartu ringkasan tetap (`modul/keuangan.md`, SK1a dan SK2a).
2. **Perbaikan bug visual di laman buat penjualan**: selesai 12 November
   2026. Kolom kanan sticky menutupi tombol Buat Penjualan saat digulir;
   kini berhenti di atas baris aksi (`modul/penjualan.md`, BP1a).
3. **Belanja Stok untuk plan Basic**: selesai 12 November 2026, tombol
   Catat pembelian dan Pembelian Stok sebagai menu tunggal
   (`modul/keuangan.md`, BS4a dan BS5a).
4. **Penyesuaian backend `yoga` `d6709a1`**: selesai 12 November 2026
   (`referensi/keputusan-penyesuaian-backend.md`).
5. **Stok keluar di detail penjualan (VD3a)**: selesai 12 November 2026,
   desain A kanvas (`modul/penjualan.md`, VD4a sampai VD10a).
6. **Paginasi server produk, bahan baku, dan inventory**: selesai
   16 November 2026 setelah backend B340 sampai B342 (PV1a dan PV2a,
   `624761a`, `e41fe76`, `6ab81aa`; `modul/inventaris.md` dan
   `modul/produk-kategori.md`).
7. **Bug dan cacat tampilan**: selesai 14 November 2026 (`609b36a`,
   `0df0ca5`; `modul/ui-ux.md`, CV1a sampai CV14a). Sampel tampilan dan
   pemindaian seluruh rute dashboard di 1280 dan 390 px, lalu perbaikan
   teks terpotong, luberan HP, tabel 1280, menu aktif sidebar, peringatan
   grafik, Libur B165, dialog hapus jadwal, Kosongkan tanggal, dan Buat
   Posisi. "Akun non-aktif" ternyata seluruhnya sisa uji E2E. Temuan
   tampilan tersisa (label filter jurnal, kolom Staf jadwal, menu Pindah
   Dana, tab Booking, cincin fokus) selesai lewat kanvas desain di
   `883a79b` (CV15a sampai CV18a). Suite e2e penuh 14 November 2026:
   643 lolos dari 643 (`inti/pengujian.md`).
8. **Fitur, rapian kode, dan utang pengujian**: selesai 14 November 2026.
   Pemecahan buat penjualan dan `PolaRosterItem` wajib (`7c004c2`), label
   kartu HP (`ceb8c95`), token warna (`c437d68`), tabel rincian
   (`eb64c70`), tipografi tujuh tingkat (`5e597c2`), aturan spasi
   (keputusan rancangan butir 35), dan utang pengujian bukan-Owner,
   keadaan gagal, dan B165 (`2bcb1ce`). Suite e2e penuh berikutnya
   menunggu izin pemilik proyek. Temuan baru: luberan tabel di 768 px dan
   kode mati pesan lokasi jurnal stok gudang (`modul/ui-ux.md`).

### Menunggu pemilik proyek, dicatat 14 November 2026

Dilanjutkan nanti atas perintah pemilik proyek, tidak sekarang:

1. **Suite e2e penuh**: dijalankan 16 November 2026, 646 lolos, 4 gagal,
   dan 2 dilewati dari 652 (`inti/pengujian.md`, Baseline). Satu gagal
   karena laptop tidur dan lolos saat diulang; tiga gagal sungguhan
   selesai ditelusuri 17 November 2026 dan dibuktikan lewat spec
   terdampak saja: label kartu HP ikut terbaca di
   `lihat-stock-adjustment` (`25b969c`), dan perpindahan halaman di
   tengah `pin-refresh` di `akses/jalur-bukan-owner` (`f80bd16`)
   (`inti/pengujian.md`, Baseline).
2. **Luberan tabel daftar di 768 px** (hampir 20 tabel): pilih batas
   kartu `DataTable` atau kolom per tabel (`modul/ui-ux.md`, Utang
   terbuka).
3. **Kode mati pesan lokasi jurnal stok gudang**: hapus atau biarkan
   (`modul/ui-ux.md`, Utang terbuka).

### Menunggu desain pemilik proyek

Butir yang butuh UI baru tidak dikerjakan dulu (pemilik proyek, 5 dan
6 November 2026). Urutannya disetujui 4 dan 5 November 2026.

1. **Isian password di halaman verifikasi email**, sisa B248: selesai
   12 November 2026 (opsi A, `modul/setup-akun.md` TP6a). Tanpa password
   titipan, halaman menampilkan Password akun dan Ulangi password, yang
   tidak dikosongkan saat kode salah; tanpa email di alamat tetap pesan
   galat. Spec e2e-nya lolos di suite penuh 14 November 2026.
2. **Belum dijadwalkan, perlu desain**: logo toko selesai 12 November
   2026 (`modul/pengaturan-outlet.md`, PO17a dan PO18a); jam operasional
   B206 menyusul penyambungan langkah jam buka, di atas. Pengingat masa
   langganan selesai 12 November 2026 lewat lonceng topbar
   (`modul/setup-akun.md`, TP8a). OTP reset PIN Owner, ubah email atau
   password akun, dan hapus akun oleh Owner (B178 sampai B181): selesai
   13 November 2026 (`modul/setup-akun.md`, OA1a sampai OA12a); spec
   ber-OTP-nya lolos di suite penuh 14 November 2026.
3. **Halaman arus kas** (B291, LR2a): selesai 12 November 2026, tab
   Keuangan "Arus Kas" dengan desain D pemilik proyek (`modul/keuangan.md`,
   LR3a sampai LR6a).
4. **Omzet per metode pembayaran di laporan** (OM1a): endpoint tersedia
   sejak backend `4a19be8` (B329, `ringkasan.pembayaranPerMetode` di laba
   rugi, berarti uang diterima per metode, bukan omzet); menunggu desain
   pemilik proyek (`kontrak/temuan.md` butir 180).
5. **Stok keluar di detail penjualan, termasuk yang VOID** (VD3a):
   selesai 12 November 2026 (`modul/penjualan.md`, VD4a sampai VD10a).
6. **Modul membership web** (paket dan pendaftaran member), syarat
   menawarkan diskon khusus member (NZ6a, `modul/pelanggan-diskon.md`).

### Menunggu keputusan pemilik proyek

- Nomor WhatsApp admin untuk halaman Langganan (LG1a, `NOMOR_WA_ADMIN`
  masih kosong).

Diputuskan 10 November 2026: keputusan bisnis Mesin Kasir MK15a sampai
MK17a (`modul/keuangan.md`, menunggu backend), ruang mengikuti lokasi
kerja LK3a (`modul/jadwal-shift.md`), Tandai Selesai tetap di detail
penjualan (NZ7a) dan khusus member menunggu modul membership (NZ6a),
nama toko di login pengguna TP2b (`modul/setup-akun.md`), dan Lampiran
A dibangkitkan ulang RG9a. Ketiganya selesai 10 November 2026: TP2b
(`19498b7`), LK3a (`bce1362`), dan RG9a (`c2c5915`).

### Utang kecil dari penyesuaian backend `4759208`

- Data toko uji wizard (lokasi, kategori, produk, pajak, dan seterusnya)
  menetap di basis data development setelah akun ujinya dihapus, karena
  hapus akun tidak menghapus tokonya; setiap run spec setup menambah enam
  toko.
- Laporan untuk tim backend yang ditunda sejak 6 November 2026 tidak
  disusun (LB1a, pemilik proyek 16 November 2026): Ridho membaca repo web
  `70d2648` pada 16 November 2026, mencatat butir 168 sampai 170, 172
  sampai 174, 176 sampai 179, 182, dan 184 beserta K-18 dan K-19 di
  `docs/pengembangan/klien.md` backend (180 dan 181 sudah tercatat
  sebelumnya), dan menutup seluruhnya di `4a19be8`. Status setiap
  butir diselaraskan di `kontrak/temuan.md`, dicocokkan menurut isinya
  karena nomor di `docs/pengembangan/klien.md` backend pernah bergeser,
  dan pembuktiannya dicatat di sana.
  Laporan baru hanya bila ada temuan baru: butir 185 (rotasi
  `pin-refresh` tanpa masa tenggang) dilaporkan 17 November 2026 atas
  keputusan pemilik proyek. Butir 85 dan 107 (B50, B51)
  dibuktikan dari kode 16 November 2026; yang belum dibuktikan web: 169
  dan 178 (tanpa perubahan kontrak), serta B169 dan B170.
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
  tanpa `read-location` teruji e2e sejak `2bcb1ce` lewat pengguna uji "E2E
  Tanpa SDM" dan "E2E Tanpa Lokasi".
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

- Ruang mengikuti lokasi kerja sejak LK3a (10 November 2026), dan sejak
  `8901b20` (B339) juga bagi staf berlokasi kerja tanpa `read-location`
  (`kontrak/temuan.md` butir 182). Sebelumnya staf berlokasi
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
