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
(RK1a), empat angka lain sama. Diukur ulang 24 November 2026 saat
bersih-bersih dokumentasi: kelima angka sama dengan 23 November 2026.
Diukur ulang 27 November 2026 per `0d30692` (PW16): warna heksadesimal
34 karena blok komentar mati `app/globals.css` dibuang, empat angka lain
sama.

| Hal | Awal | Per `4dc08e2` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 0 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan; dari 25 per `845c2cf` menjadi 16, lewat penyesuaian `465b438` dan halaman metode pembayaran, lalu 12 setelah halaman pajak (`e0aaeca`), 9 setelah halaman pelanggan (`d9365d3`), 7 setelah halaman diskon (`1e05df6`), 4 setelah halaman profil, login, dan sidebar (`57a7084`), dan 0 setelah error ESLint warisan (`4f19e77`) |
| Kemunculan `_id` | - | 7 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id`. Perintahnya ikut menghitung komentar: naik 1 di `eef371a` dari komentar normalisasi di `features/sesi-booking/api.ts`. Turun 13 di `45187b6`: 12 dari data tiruan mutasi arus kas dan 1 dari daftar akun kas. Turun 3 di `f99b7cf`: 4 dari halaman dan tabel shift, dikurangi 1 dari komentar normalisasi di `features/shift/api.ts`. Turun 7 di `dcc22e0` dari halaman, tabel, dan form pola roster. Turun 7 di `19227f8` dari halaman jadwal outlet, jadwal gudang, dan generate. Turun 9 lagi sampai `3359497`, dari penyesuaian `465b438` dan halaman metode pembayaran. Turun 7 di `e0aaeca` dari halaman pajak. Turun 2 di `d9365d3` dari halaman pelanggan. Turun 2 di `1e05df6` dari halaman diskon. Turun 1 di `091be4e` dari komentar halaman profil. Naik 1 di `10c7efb` dari komentar normalisasi di `features/admin-akun/api.ts`. Turun 1 di `4f19e77` dari cadangan `_id` di dialog pengguna. Per 18 November 2026 ketujuhnya komentar normalisasi (`id`, bukan `_id`), tidak ada di kode |
| `useAuthGuard()` berulang di halaman | 49 | 2 | Dihitung di `app/` saja. Yang tersisa `app/dashboard/layout.tsx`, satu-satunya pemanggil, dan berkas hook-nya sendiri; ke-24 pemanggilan berulang di `app/` dan ke-13 di `features/` dibuang di `628f52e` (26 sebelum itu). Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, keempat halaman penjualan, buat reservasi, shift outlet, pola roster outlet, ketiga halaman metode pembayaran, halaman pelanggan, halaman diskon, dan halaman profil) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | 34 | Lima warna utama menjadi token di `app/globals.css` (`584a2d8`, `ba28f25`; keputusan WR1a sampai WR4a). Tepat sebelum penggantian terukur 3.764 di `app`, `components`, `features`, dan `lib`. Per `9cd22e1` tersisa 68. Sejak `c437d68` (CV21a) tidak ada lagi pemakaian di halaman: ke-41 itu 36 definisi token di `app/globals.css` dan 5 selektor bawaan shadcn di `components/ui/chart.tsx`. Menjadi 42 pada 23 November 2026 karena token `--rose-redup` (RK1a). Menjadi 34 pada 27 November 2026 (`0d30692`, PW16): delapan di antaranya berada di blok lama `app/globals.css` yang seluruhnya dikomentari dan kini dibuang, sehingga yang tersisa 29 di `app/globals.css` dan 5 di `components/ui/chart.tsx` |
| Berkas di atas 700 baris | 7 | 1 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.087 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. Per `57a7084` menjadi 3: `components/app-sidebar.tsx` dipecah menjadi 325 baris (keputusan PF4a), dan tersisa buat penjualan (1.090), `features/produk/form-produk.tsx` (803), serta `components/ui/sidebar.tsx` (702). Per `9195472` menjadi 4: `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700 (714 baris) karena penjaga ruang (`eb0181f`), dan buat penjualan menjadi 1.087 baris setelah kode mati dibuang (`6b5e1cc`). Per `b887278` form produk menjadi 809 baris (pemeriksaan satuan resep). Per `628f52e` tetap 4; detail stock opname menjadi 712 baris setelah pemanggilan guard dibuang. Per `7d4c234` form produk 835 baris (isian stok minimal, B237). Per `5b8cbd9` tetap 4: buat penjualan 1.098 baris (`waktuTransaksi` dan jam berjalan, `7a08b63`), form produk 809, detail stock opname 702, dan `components/ui/sidebar.tsx` 702. Per `a611b59` menjadi 3: dialog aksi detail stock opname dipisah, sehingga halamannya 612 baris. Per `11ed2d4` menjadi 1: buat penjualan dipecah menjadi 693 baris (`584d6ae`) dan form produk 673 baris; tersisa `components/ui/sidebar.tsx` (702, berkas shadcn) |

Tahap desain token sengaja tidak dicampur dengan refactor arsitektur, agar
setiap commit tetap fokus. Warna utama menjadi token pada fase UI/UX
11 Oktober 2026, seluruh warna dan tipografi 14 November 2026 (CV21a,
CV24a), dan spasi pembungkus halaman diseragamkan 18 November 2026
(keputusan rancangan butir 35, SP1a).

## Pekerjaan berikutnya

### Mulai di sini (keadaan akhir 28 November 2026, sesudah PW25)

**Keadaan:** web `main` bersih dan ter-push. Backend `ridho` lokal maju
dari `6478d29` ke `c4aae0d` (28 November 2026, lima commit, AR53 sampai
AR55): butir 197 dikerjakan lewat B385 (AR54, P90) dan butir 196 lewat
B386 (AR55, R29), keduanya `Menunggu verifikasi` di
`docs/pengembangan/klien.md` backend; baris laporan 24 sampai
26 November 2026 sudah ditutup `Selesai` di sana (AR53). PW25 selesai:
seed dan migrasi tidak berubah, index parsial baru sesi kasir terbentuk,
dan PW24 serta PW15 berpindah ke kelompok Sekarang
(`referensi/keputusan-penyesuaian-backend.md`, `c4aae0d`). Sebelumnya
backend `1718030` ke `6478d29` (15 commit, AR45 sampai AR51, B369 sampai
B384) mengerjakan seluruh laporan web 24 sampai 26 November 2026, dan
Ridho menyatakan pekerjaan backend MVP selesai; pembuktian web dan
tampilan struk tutup kasir selesai di PW02 sampai PW14.
Langkah sesudah tarik selesai (PW01: permission selaras, migrasi
`hapusPajakAset.js` diterapkan, index baru terbentuk). PW02 sampai PW06
selesai: ketiga merah disengaja lolos tanpa diubah, Ganti pengguna
bertahan dimuat ulang (`569c3f9`), Rekap Absensi boleh kosong
(`12ded07`), booking tanpa pajak per aset dibuktikan (`c214786`), dan
lonceng pengembalian bagi pengguna gudang saja (`efb5596`). PW09 selesai
27 November 2026 (`b232cad`): rincian sesi menampilkan isi laci yang
dipindah saat buka kasir (MK18a), dan penanda asal Pindah Dana buka
kasir dilaporkan ke backend (butir 196, MK19a). PW10 selesai
(`00fbd5d`): Laporan Tutup Kasir di grup Laporan, daftar periode dan
laporan bersusunan struk (PT1a sampai PT5a). PW11 selesai (`c289fd9`):
cetak struk dari browser di kertas 80 mm setinggi struk. PW12 selesai
(`e42caa9`): unduh laporan PDF dan Excel. PW07 selesai (`b9fe4a0`):
pemicu stok produk lonceng dari ringkasan dashboard, kartu berupa angka
(LN22a). PW08 selesai (`9b6c133`): lonceng perangkat menunggu izin,
disetujui lewat aplikasi (LN23a). PW13 selesai (`86aa357`): struk tutup
kasir terbukti e2e dari transaksi nyata; bagian web MVP struk tutup
kasir selesai. PW16 selesai (`0d30692`): kelas `font-mono` menjadi Geist
Mono dan blok CSS mati di `app/globals.css` dibuang (FN1a, FN2a). PW19
selesai (`f606985`): lonceng kesiapan toko, satu kartu "Siapkan toko"
berlangkah dan penahan pengingat absensi (KS1a sampai KS9a,
`modul/pemberitahuan.md`). PW18 selesai (`041238b`): langkah karyawan
(opsional, "Toko ini hanya saya") dan absensi di kartu itu, catatan
syarat di Tambah Pengguna, Pola Roster, dan Generate Jadwal (KS10a
sampai KS13a). PW20 selesai (`3198f5d`): bidang ruang gudang dan staf
per ruang di kartu itu (KS14a sampai KS16a). PW21 selesai (`7553126`):
staf akses aplikasi tampil di daftar ruang (RS1a, butir 197). Vitest
kini 1362 lolos dari 160 berkas. PW22 selesai (`0d124c7`): suite e2e
penuh 28 November 2026 (`fb2a39f`, backend `6478d29`) 839 lolos dan
1 gagal dari 840, termasuk spec ber-OTP; yang gagal adalah harapan spec
Mesin Kasir yang bergantung jumlah mesin di toko uji, diperbaiki dan
dibuktikan dengan berkasnya, 15 lolos dari 15 (Baseline
`inti/pengujian.md`). PW23 selesai (`eda7694`): status temuan T3, T4,
T6, dan T7 dari backend AR31 dan skenario 409 PW15 di utang pengujian.

**Antrean pekerjaan:** `referensi/antrean-web.md`, paket kecil berkode
`PW01` sampai `PW26`, satu paket per sesi lewat
`/lanjut-frontend-web <kode>`. Ringkasnya:

1. **Sekarang:** PW24 lebih dulu (backend P1), daftar ruang kembali ke
   `GET /pengguna?workspace=` dan `features/pengguna/ruang-staf.ts`
   berhenti memilah sendiri (butir 197, B385); lalu PW15, Batalkan
   Pindah Dana disembunyikan untuk `asal: "buka-kasir"` (butir 196,
   B386), diawali pertanyaan apakah asal itu juga ditampilkan. PW01
   sampai PW14 dan PW16 sampai PW23, serta PW25, selesai.
2. **Diawali dialog keputusan:** tidak ada paket tersendiri.
3. **Menunggu izin pemilik proyek:** PW26, suite e2e penuh sesudah PW24
   dan PW15.
4. **Menunggu backend:** tidak ada. Langkah pertama setiap sesi tetap
   memeriksa apakah cabang backend maju; bila maju, petakan paket baru
   di `referensi/antrean-web.md`. Backend dijalankan dengan env inline
   (`inti/pengujian.md`, Menjalankan layanan uji), dan kodenya tidak
   diubah dari sisi frontend:

   ```bash
   BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in ridho nizar yoga; do echo "origin/$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...origin/$r | tr '\t' ' ')"; done
   ```
5. **Ditunda sampai keadaan tertentu:** multi-outlet (jurnal stok,
   Kirim Barang, beban per lokasi, cakupan penjualan; bagian Utang kecil
   di bawah), aplikasi kasir rilis (tombol Buka aplikasi,
   `modul/setup-akun.md`), VPS siap (Persiapan produksi di bawah), dan
   pasca-MVP (struk dapur). Nomor WhatsApp admin halaman Langganan ditunda
   (LG1a, 26 November 2026; `NOMOR_WA_ADMIN` kosong di
   `features/langganan/data.ts`). Foto profil tidak dipakai (PF9a,
   26 November 2026).

Riwayat keadaan sebelum 24 November 2026 ada di
`arsip/catatan-putaran.md` (Status yang selesai, dipindah 20 dan
24 November 2026).

### Pemberitahuan dan lonceng (25 November 2026)

Keputusan LN1a sampai LN21a di `modul/pemberitahuan.md`. Seluruh sumber
LN4a terpasang (tahap 1 sampai 5), termasuk perangkat menunggu izin
sejak PW08.
Ketiga kebutuhan backend selesai di `6478d29` (B380 sampai B382); web
menyesuaikan lewat PW06 sampai PW08 (selesai)
(`referensi/antrean-web.md`). Suite
e2e penuh sesudah lonceng (LN20a, LN21a) dijalankan 26 November 2026:
hanya tiga merah disengaja yang gagal.

### MVP: struk laporan tutup kasir (dicatat 24 November 2026)

Wajib rilis di MVP (pemilik proyek, 24 November 2026): struk laporan
tutup kasir per sesi kasir, untuk toko bershift maupun tanpa shift,
dengan sembilan section yang sudah diputuskan, dan modal awal saat buka
kasir yang boleh kosong (disimpan 0, bukan null). Diperiksa terhadap
backend `1718030`: modal awal sudah ada sebagai `nominalBuka` tetapi
wajib diisi, dan penjualan serta pembayaran non-tunai belum terhubung ke
sesi kasir, sehingga nominal per metode, jumlah transaksi, dan produk
terjual per sesi belum dapat disajikan. Rencana lengkap, peta data per
isi struk, dan sembilan keputusan terbuka (termasuk arti modal kosong,
karena nominal buka sekarang memicu mutasi selisih laci) di
`referensi/rencana-struk-tutup-kasir.md`. Backend menyelesaikannya di
`6478d29`: modal opsional dan laci dikosongkan sebagai pindah dana
(B371), penjualan dan pembayaran seluruh metode bersesi (B373, B374),
dan laporan per periode (gabungan sesi di outlet, per shift atau hari
toko) di `GET /sesikasir/periode/:id` beserta unduhannya (B375, B376).
Pekerjaan web: PW09 sampai PW13 (`referensi/antrean-web.md`), seluruhnya
selesai 27 November 2026 dan terbukti e2e dari transaksi nyata (PW13).

### Pasca-MVP: struk dapur (dicatat 24 November 2026)

Fitur pengembangan versi berikutnya, bukan rilis MVP (pemilik proyek,
24 November 2026): struk dapur untuk orderan POS aplikasi, berisi menu
dan catatan opsional per menu. Rencana lengkapnya, termasuk bagian
backend dan mobile yang kelak dipindah ke backend, ada di
`referensi/rencana-struk-dapur.md`. Di web tidak ada pekerjaan sebelum
backend menerima catatan per item.

### Catatan data development

- Akun uji `toko@gmail.com` berplan Pro (dinaikkan lewat API admin,
  karena akun lama dibaca Basic, B212, dan Basic menolak sesi booking,
  B216); riwayat langganannya berisi satu catatan `ubah-plan`.
- `db:setup-toko-lama` jangan dijalankan ulang di basis data lokal
  sesudah spec membuat akun pendaftar, karena akun itu ikut ditandai
  selesai setup inti.
- Data uji dibersihkan 18, 20, 24, dan 26 November 2026 lewat skrip bermode
  tinjau `bersih-akunkas.js` dan `bersih-data-uji.js` di
  `~/.cache/frontend-web/alat/` (bawaan tinjau, `--hapus` untuk
  menerapkan), dengan cadangan di `~/Documents/cadangan-db/`. Data bukti
  temuan tidak disentuh: transfer Rp1,5 butir 126 beserta akun E2E-nya,
  bahan uji butir 143, surat jalan rusak, dan data butir 142. Keenam tipe
  aset uji bukti butir 77 dihapus lewat API 25 November 2026 saat butir
  itu ditutup (cadangan
  `db_produk-sebelum-hapus-tipeaset77-2026-11-25.gz`).
- Pembersihan 26 November 2026 (cadangan
  `db_produk-sebelum-bersih-2026-11-26.gz`, dibuat lewat `docker exec
  tachyon-mongo mongodump` karena `mongodump` tidak terpasang di host)
  menghapus 11 akun kas, 18 metode pembayaran, 61 diskon, 91 shift, dan 65
  pelanggan uji. Tidak disentuh: fixture "E2E Kategori Beban" (RG7a), 69
  beban VOID, dan 995 penjualan booking VOID (181 pembayaran terhubung),
  karena keduanya riwayat keuangan yang saling terkait dan tidak ada skrip
  yang aman untuk menghapusnya.

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
