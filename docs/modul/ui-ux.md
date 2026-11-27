# Fase UI/UX

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Komponen tanggal dan waktu

Diputuskan pemilik proyek pada 28 September 2026 (`e43e000`).

- **K-TW1a: `PilihTanggal` dan `InputWaktu` menjadi komponen bersama**,
  dengan aturan murni di `lib/waktu.ts` (keputusan rancangan butir 22).
- **K-TW4a: hanya angka yang diterima, dan ketikan yang membuat jam
  melebihi 23 atau menit melebihi 59 ditolak**; isian tetap berisi nilai
  sah terakhir.
- **K-TW5a: isian jam kosong dibiarkan kosong dan ditolak halaman saat
  simpan.** Di buat penjualan, jam yang dikosongkan tidak lagi menjadi
  00.00; di tarif, kedua isian kosong tetap ditolak skema seperti
  sebelumnya.
- **K-TW2a: kalender shadcn murni dihapus, dan pemakaiannya ditolak
  ESLint**, begitu pula input `type` date, time, datetime-local, month, dan
  week di JSX.
- **K-TW3a: diterapkan lebih dulu di buat penjualan, filter daftar
  penjualan, dan tarif** (`e43e000`), lalu di buat reservasi (`477f258`);
  form shift dan jadwal bersama modul jadwal.
- **Filter tanggal daftar penjualan dikosongkan lewat reset filter**,
  karena `PilihTanggal` tidak punya tombol kosongkan.

### Fase UI/UX: dashboard outlet, token warna, dan tabel

Diputuskan pemilik proyek pada 11 Oktober 2026. Rancangannya ditentukan
pemilik proyek lewat pratinjau yang disetujui sebelum diterapkan. Labelnya
DB (dashboard outlet), WR (warna), dan TB (tabel).

- **DB1a: Transaksi Hari Ini adalah penjualan PAID hari ini**, dengan
  jumlah dari `pagination.total` `GET /penjualan`. Batas hari dikirim
  sebagai waktu ISO utuh (`kontrak/temuan.md` butir 147) (`3812763`,
  `0c5822b`).
- **DB2a: kartu laba bersih dan HPP menampilkan angka kemarin, dan
  pembandingnya hari sebelum kemarin** (`0c5822b`).
- **DB3a: status staf adalah absensi ditambah sakit, izin, dan cuti** dari
  `GET /izincuti` yang disetujui dan berlaku hari ini. Kehadiran nyata
  menang atas izin, dan status alpha ditunda (`3812763`). Sejak `96a7b40`
  izin hari ini disaring server (B160), dan sejak `44a81d0` staf berasal
  dari monitoring per lokasi outlet ditambah karyawan ruang yang izin
  hari itu (B183, `modul/jadwal-shift.md`). Sejak 23 November 2026
  monitoring sendiri memuat staf yang izin, dan tambahan web dibuang
  (B348).
- **DB4a: lonceng notifikasi dipasang nonaktif** dengan keterangan belum
  tersedia, karena belum ada sumber datanya (`0c5822b`).
- **DB5a: grafik dashboard memplot omzet (`totalOmzet`) per tanggal bulan
  berjalan**, dibandingkan periode yang sama bulan lalu. Grafik halaman
  ringkasan laba rugi tetap memplot laba bersih (`342dcd3`, `0c5822b`).
- **DB6a: petak venue mengikuti status aset dari `GET /aset`**, dan
  rinciannya (pelanggan dan sisa waktu) dari booking yang sedang berjalan
  (`3812763`, `0c5822b`).

Susunan dashboard outlet: empat kartu navy di atas, grafik pendapatan di
samping petak venue (rasio 3 banding 2), dan tabel status staf selebar
penuh. Sampai enam aset petaknya besar, lebih dari itu ringkas, dan paling
banyak sepuluh yang tampil dengan aset terpakai lebih dulu. Di HP kartu
menjadi 2x2, venue berada di atas grafik, dan daftar staf menampilkan lima
baris pertama dengan tombol "Tampilkan semua". Izin ditegakkan per panel
(`features/dashboard-outlet/izin.ts`, keputusan rancangan butir 9): panel
yang izinnya tidak dipegang tidak dipasang.

- **WR1a: lima warna utama menjadi token**, yaitu `navy` (`#0A2947`),
  `gading` (`#FFFAF3`), `krem`, `karamel` (`#D4A373`), dan `sage`
  (`#718355`) (`584a2d8`; keputusan rancangan butir 25).
- **WR2a: navy kedua `#041E3F` dilebur ke navy utama**, termasuk latar
  sidebar (`584a2d8`).
- **WR3a: krem bernilai `#F2EAE2` dan berperan sebagai aksen sekunder**
  (sorotan baris, lencana netral, panel), bukan isian bidang lebar. Krem
  yang digelapkan menjadi `#E0D2C2` sempat diterapkan lalu ditolak, karena
  sebagai isian baris tabel terasa berat dan kusam (`ba28f25`).
- **WR4a: permukaan berwarna putih di atas latar halaman gading**, lewat
  token peran `permukaan`; dipakai kartu baris tabel dan isian (`ba28f25`,
  `cc1092e`).

- **TB1a: tiap baris tabel adalah kartu terpisah**, di desktop maupun HP.
  Di desktop isinya sejajar dalam kolom; di HP tersusun ke bawah
  (`93490bb`).
- **TB2a: kepala kolom tanpa warna latar**, hanya teks (`93490bb`).
- **TB3a: kontrol kaki tabel polos**, tanpa latar maupun kotak
  (`93490bb`).
- **TB4a: cakupannya seluruh tabel**: dasar tabel, tabel daftar yang masih
  ditulis sendiri, tabel rincian, dan kalender jadwal dengan pratinjau
  tersendiri.
- **TB5a: tabel daftar berdiri langsung di atas latar halaman**, tanpa
  panel pembungkus; kartu barisnya putih, bersudut bulat, dan berbayangan
  halus. Bingkai putus-putus dan garis kiri berwarna status dicoba dan
  ditolak (`cc1092e`).
- **TB6a: tabel tidak digeser ke samping.** Kolom dibatasi ke yang
  penting, dan rincian lengkap dibuka dari menu titik tiga sebagai dialog
  di tengah layar. Pada mutasi arus kas, pencatat, saldo, dan tautan
  penjualan (NZ2a) pindah dari baris tabel ke dialog itu (`f44db05`).
- **TB7a: semua tabel daftar memakai `DataTable`**, dengan aksi baris di
  menu titik tiga (`9cd22e1` untuk bahan baku; keputusan rancangan butir
  26).
- **TB8a: tabel seragam dikerjakan per kelompok**, berurutan K-A (jurnal
  stok dan pengajuan stok), K-C (transfer stok gudang), K-B (stok outlet
  dan inventaris gudang), K-D (shift dan pola roster), lalu K-E
  (reservasi), karena K-A menguji pola `DataTable` di ruang outlet dan
  gudang sekaligus, dan reservasi masih memakai palet lokal (17 Oktober
  2026).
- **TB9a: tabel jurnal stok berkolom Barang (dengan lokasi), Waktu,
  Alasan, Jumlah, dan menu titik tiga.** Barang di depan sebagai judul
  kartu di HP; pencatat dan keterangan utuh pindah ke dialog rincian
  (`9b06283`).
- **TB10a: aksi baris pengajuan stok di menu titik tiga langsung membuka
  halaman detail**, tanpa dialog ringkasan: "Tinjau" di gudang,
  "Lanjutkan draft" atau "Lihat detail" di outlet (`20e332f`).
- **TB11a: paginasi klien memakai pilihan 10, 20, dan 50 yang opt-in**
  lewat `pilihanUkuranKlien`; tabel yang tidak mengirimnya tetap 10 baris
  tanpa pemilih, dan pemilihnya dibuktikan lewat test integrasi
  `DataTable` (`4677447`).
- **TB12a: teks jumlah keluar memakai `red-800`**, karena `red-600` terlalu
  terang di atas kartu putih; masuk tetap `emerald-700`. Berlaku untuk
  jurnal stok dan mutasi kas (`9b06283`, `fc6ddd3`); pesan galat dan
  status VOID tetap `red-600`, dan latar ikon tetap `bg-red-500/10`.
- **TB13a: aksi baris surat jalan gudang di menu titik tiga adalah "Lihat
  detail" untuk semua status**, langsung membuka halaman detail seperti
  TB10a; tombol "Detail" yang menonjolkan Draft SJ tidak dipertahankan
  (`6f9d3eb`).
- **TB14a: spec mencari baris tertentu di daftar berpaginasi klien lewat
  kotak pencarian**, bukan mengharapkannya di halaman pertama, karena
  urutan server tidak menjamin data uji berada di sana. Surat jalan
  diurutkan `tanggalKirim` lalu `createdAt` turun di antara 374 surat
  jalan development (`6f9d3eb`).
- **TB15a: tabel daftar yang gagal dimuat diganti pesan `role="alert"`**,
  seperti pengajuan stok dan jurnal stok, dan jalur itu diuji lewat
  `page.route` yang menjawab setiap `GET` daftar dengan 500 (`6f9d3eb`).
- **TB16a: aksi baris tabel stok outlet dan inventaris gudang di menu
  titik tiga bersama** (`features/inventaris/menu-aksi-stok.tsx`), dengan
  label seragam "Ubah batas minimum" dan "Sesuaikan stok", karena kedua
  aksi dan endpoint-nya sama; judul dialog tidak berubah (`753f61e`).
- **TB17a: kolom inventaris gudang dibatasi ke Nama Barang, Stok Saat Ini,
  Batas Minimum, dan Aksi**: kolom "Kategori / Tipe" yang selalu "Bahan
  Baku" dan baris "ID:" di bawah nama barang dibuang (TB6a, `753f61e`).
- **TB18a: pesan `role="alert"` stok hanya untuk daftar stok yang gagal
  dimuat**; gagal memuat lokasi outlet tetap ditangani `PesanLokasi`,
  sehingga keduanya tidak tumpang tindih (`753f61e`).
- **TB19a: menu titik tiga shift dan pola roster dipertahankan apa
  adanya** di kolom aksi `DataTable`, termasuk ikon, pemisah, dan aksi
  merah untuk Non-Aktifkan dan Hapus Pola, karena warna merah menandai
  aksi yang mengarsipkan atau menghapus dan labelnya disebut spec
  (`2177ac3`).
- **TB20a: panel filter berlatar krem di halaman shift dan pola roster
  dibereskan bersama tabelnya**: baris filter bergaris bawah tanpa panel
  seperti K-A dan K-C, isian `bg-permukaan` (WR4a), dan daftar pilihan
  filter `bg-gading` seperti menu titik tiga (WR3a, `2177ac3`).
- **TB21a: Edit dan Hapus di daftar aset, tarif, dan tipe aset memakai
  menu titik tiga bergaya K-D** lewat komponen bersama
  `components/menu-edit-hapus.tsx`: ikon, pemisah, dan Hapus merah,
  karena hapus di ketiganya permanen (TB19a, `eb81a1f`).
- **TB22a: panel filter krem di ketiga halaman reservasi dibereskan
  seperti TB20a, dan chip "Total: N" dibuang**, karena kaki tabel
  `DataTable` sudah menampilkan "N total data" untuk daftar tersaring yang
  sama (`eb81a1f`).
- **TB23a: tabel dan baris filter tarif memakai token, bukan objek hex
  lokal**, dengan keenam kolom dipertahankan; `COLORS` tinggal tiga warna
  untuk dialog hapus yang di luar tabel (WR3a, WR4a, `eb81a1f`).

### Font aplikasi

Diputuskan pemilik proyek pada 19 Oktober 2026, setelah membandingkan
Arial dan Geist pada pratinjau komponen dashboard: **Geist** dipakai di
seluruh aplikasi (`cdc8c47`). Geist sudah dimuat `next/font` di
`app/layout.tsx`, tetapi tidak pernah dipakai: `--font-sans` di kedua
blok `@theme` merujuk dirinya sendiri, dan kedua aturan `body` menulis
Arial langsung. Kini `--font-sans` dan `body` memakai
`--font-geist-sans`; `--font-mono` tidak berubah. Ukuran huruf dan
tinggi baris belum menjadi token.

### Cacat tampilan 14 November 2026

Diputuskan pemilik proyek pada 14 November 2026. Sampel tampilan diambil
lebih dulu (tangkapan layar di `~/Downloads/sampel-visual/`), lalu seluruh
rute statis `app/dashboard` dipindai di 1280 dan 390 px untuk teks yang
terpotong dan luberan samping (helper `~/.cache/frontend-web/alat/pindai-visual`).
Perbaikan di `609b36a` (tampilan) dan `0df0ca5` (perilaku).

- **CV1a: tabel yang meluber di 1280 px dibungkus, kolom dipindah hanya
  bila perlu.** Tujuh tabel `DataTable` lebih lebar dari wadahnya, sehingga
  kolom Status dan Aksi tersembunyi di balik gulir samping: Diskon (+165
  px), Pengguna kedua ruang (+83, +167), Tarif (+132), Penjualan (+15),
  Pengajuan Stok kedua ruang (+19, +16), Mutasi Kas (+323), dan riwayat
  Pindah Dana (+490). Uji coba di browser membuktikan membungkus teks saja
  cukup untuk enam tabel. Kolom ber-`meta.lebarBungkus` (px) boleh turun
  baris mulai lebar `sm` (`components/ui/data-table.tsx`), dengan teks
  paling banyak dua baris lewat `TeksDuaBaris` (CV12a): Penjualan
  Pelanggan 180; Pengajuan Stok Rute 200; Pengguna Nama 200; Diskon Nama
  200 dan Aturan 180; Tarif Nama 200, Jadwal Berlaku 160, dan Kategori
  Aset 150; Mutasi Kas Akun Kas 180 dan Keterangan 260; Pindah Dana Dari
  dan Ke 160 serta Keterangan 180. Luberan ketujuh tabel menjadi 0; kartu
  HP tidak berubah. Kategori Aset Tarif berupa deretan badge yang sudah
  dibungkus sebelumnya (`max-w-45`) dan tidak dibatasi baris.
- **CV2b: delapan cacat teknis diperbaiki lewat pratinjau.** (1) Pemicu
  Arah dan Alasan jurnal stok terpotong "Semua ." di 1024 dan 1280 px
  serta "Semu" di HP: dilebarkan (190 dan 200 px), di HP masing-masing
  selebar penuh dengan teks rata kiri. (2) Menu sidebar tunggal tidak
  menyala di halaman turunannya (Catat Pembelian, Akun Toko, Buat
  Reservasi): `hrefMenuAktif` (`components/sidebar-menu.ts`) memilih menu
  terdekat, sama untuk menu tunggal dan sub-menu; dashboard ruang dan
  induk Keuangan hanya menyala bila sama persis. (3) Peringatan konsol
  grafik "width(-1) and height(-1)": `initialDimension` 1 x 1 di
  `GrafikLaporan`, karena bawaan recharts 3.8 -1 x -1. (4) Tombol periode
  laba rugi "Mingg..." dan "Bulan..." di 1280 dan 1440 px: lebarnya
  mengikuti teks. (5) Label kartu dashboard "Laba Bersih (Ke...)" di 1280
  px dan ketiga label di HP: boleh dua baris. (6) HP: tombol Buat
  Reservasi Baru keluar layar, tab Stok Kritis gudang terpotong, serta
  luberan Kategori, Buat Pengajuan, dan Jadwal: baris tombol dan tab
  dibungkus. (7) Tab status Pengajuan Stok terjepit 128 px di 1280 px:
  filter pindah ke baris sendiri. (8) "Semua Cakupan" Diskon terpotong:
  pemicu filter 176 px. Pratinjau disetujui (CV8a).
- **CV3a: Libur dinonaktifkan di hari yang juga berjadwal di lokasi lain**
  (B165), dengan keterangan; teksnya diganti CV10a.
- **CV4a: hapus jadwal memakai dialog proyek**, bukan `confirm()`: judul
  "Hapus jadwal?", teks "Jadwal karyawan ini pada tanggal tersebut akan
  dihapus.", tombol Batal dan Hapus merah.
- **CV5a: tombol Kosongkan di kalender `PilihTanggal`** lewat prop
  opsional `onKosongkan`, tampil hanya bila tanggal terisi; dipakai kedua
  isian tanggal filter daftar penjualan saja.
- **CV6a: form buat posisi bertombol "Buat Posisi"** ("Membuat
  Posisi..." saat terkirim); mode ubah tetap "Simpan Perubahan".
- **CV7a: wewenang tanpa padanan id di form role ditutup sebagai bukan
  bug.** Daftar centang dan wewenang tersembunyi sama-sama berasal dari
  daftar permission utuh (`GET /permission`), sehingga nama tanpa id hanya
  mungkin bila permission dihapus di server di tengah sesi.
- **CV8a: pratinjau kedelapan perbaikan teknis disetujui** untuk
  di-commit.
- **CV9a: pencatat riwayat Pindah Dana menjadi baris kedua di sel
  Tanggal** ("oleh Ridho"); kolom Dicatat oleh dibuang, termasuk di kartu
  HP.
- **CV10a: keterangan Libur berbunyi "Karyawan ini juga berjadwal di
  lokasi lain pada tanggal ini; atur liburnya dari kalender lokasi itu
  atau hapus jadwalnya lebih dulu."**, dan aturannya juga berlaku di
  Tambah Manual begitu karyawan dan tanggal yang punya jadwal lokasi lain
  dipilih. Tanggalnya bisa di luar bulan yang tampil, sehingga form
  membaca jadwal tanggal itu lewat dua daftar (lokasi ruang dan seluruh
  lokasi, `useJadwalLokasiLainPada`). Perilaku tambahan selama memuat
  dan saat Libur terlanjur dipilih diputuskan CV13a.
- **CV11a: label rincian Arus Kas boleh dua baris** di HP; "Pembelian
  stok" bersama badge Pembatalan terpotong 7 px di 390 px.
- **CV12a: teks yang dibungkus di tabel 1280 px paling banyak dua baris**,
  kembali ke teks opsi CV1a. Penerapan pertama tanpa batas baris membuat
  Keterangan Mutasi Kas, Dari, Ke, dan Keterangan Pindah Dana, serta nama
  Tarif menjadi tiga baris atau lebih. Kini `TeksDuaBaris`
  (`components/ui/teks-dua-baris.tsx`) memotong sisanya dengan "..." dan
  teks lengkap di tooltip, mulai lebar `sm`; kartu HP tidak dibatasi.
  Keterangan Mutasi Kas yang dulu satu baris terpotong kini dua baris.
- **CV13a: dua perilaku Tambah Manual di luar teks opsi CV10a
  dipertahankan**: Libur nonaktif tanpa keterangan selama jadwal tanggal
  terpilih dimuat, dan simpan ditahan bila Libur terlanjur dipilih untuk
  tanggal yang berjadwal di lokasi lain. Tanpa keduanya Libur dapat
  tersimpan sebelum pemeriksaan selesai. Keduanya sempat diterapkan
  sebelum ditanyakan; diakui dan diputuskan di putaran yang sama.
- **CV14a: cara tabel 1280 px tidak menjadi keputusan rancangan lintas
  modul.** Aturan yang sempat ditambahkan ke butir 26 tanpa ditanyakan
  dicabut; caranya cukup tercatat di CV1a untuk ketujuh tabel itu.

### Temuan tampilan tersisa 14 November 2026

Diputuskan pemilik proyek pada 14 November 2026 dari kanvas desain
"Temuan Tampilan Tersisa" (sekarang dan usulan per temuan), setelah
sampel tampilan dan pengukuran DOM. Perbaikan di `883a79b`.

- **CV15a: filter Arah dan Alasan jurnal stok berlabel** (desain A): label
  "Arah" dan "Alasan" bergaya label filter yang sama dan menjadi nama
  aksesibel pemicunya (`aria-labelledby`); ikon corong di pemicu Arah
  dibuang. Berlaku di ruang outlet dan gudang.
- **CV16a: kolom Staf kalender jadwal dikunci** (desain A): 220 px mulai
  `md` dan 112 px di HP, lewat lebar, lebar minimum, dan lebar maksimum
  yang sama pada kepala dan sel. Sebelumnya hanya lebar minimum, sehingga
  tabel membagi sisa ruang ke kolom ini (462 px di 1280 px, 362 px di HP,
  dan di HP kolom yang menempel kiri menutup seluruh hari). Nama panjang
  terpotong dengan nama lengkap di tooltip; avatar tetap tersembunyi di
  HP. Teks kepala "Staf / Karyawan" tidak diubah.
- **CV17a: aksi riwayat Pindah Dana di menu titik tiga** ("Aksi
  transfer"), berisi satu item merah "Batalkan transfer" yang membuka
  dialog Batalkan yang sudah ada; tampil hanya bila transfer Aktif dan
  pengguna boleh membatalkan.
- **CV18a: Dasbor Timeline menyala di Buat Reservasi, dan tab bercincin
  saat fokus keyboard** (desain 4A dan 5A). Cincin 2 px navy 50% di dalam
  tab (`focus-visible:ring-2 ring-inset ring-navy/50`, sudut atas
  membulat) menggantikan `focus-visible:ring-0`. Tab memakai
  `transition-all`, sehingga cincin baru penuh setelah transisi; spec
  menunggunya lewat `expect.poll`. Diterapkan juga di
  `inventaris-nav-tabs.tsx` sesuai opsi, tetapi komponen itu kode mati dan
  kemudian dihapus (CV19a).
- **CV19a: `inventaris-nav-tabs.tsx` dihapus**, karena tidak diimpor di
  mana pun; folder `components` di rute inventaris outlet ikut hilang.

### Rapian UI 14 November 2026

Diputuskan pemilik proyek pada 14 November 2026.

- **CV20a: label kartu HP untuk kolom berkepala komponen**, setelah
  pratinjau 13 halaman di 390 px: 43 kolom diberi `meta.label` sama dengan
  kepala desktopnya; empat kolom yang isinya disembunyikan di HP (Tanggal
  dan Pelanggan daftar penjualan, Tanggal dan Lokasi stock opname) tanpa
  label (`ceb8c95`).
- **CV21a: warna heksadesimal menjadi token** tanpa perubahan tampilan.
  Sembilan belas token turunan (sage-tua, sage-muda, sage-pucat,
  sage-terang, karamel-tua, karamel-redup, cokelat, cokelat-tua,
  cokelat-zaitun, cokelat-abu, pasir, krem-muda, krem-hover, navy-terang,
  emas, tembaga, merah-tingkat, rose-terang, abu-teks) ditambah rose-lama
  untuk `#F43F5E`, karena rose-500 Tailwind 4 di proyek ini
  `oklch(64.5% 0.246 16.439)`. `lib/warna.ts` memberi `WARNA` untuk style
  dan recharts, dan `denganAlfa()` menggantikan akhiran alfa heksadesimal
  dengan `color-mix` yang setara. Pembandingan piksel 11 tangkapan identik
  (`c437d68`).
- **CV22a: tabel rincian halaman detail memakai DataTable berkartu baris**
  (kanvas "Tabel Rincian", arah A): panel berlatar dibuang, judul bagian
  di atas, prop `rincian` (seluruh baris tanpa kaki tabel), nilai rata
  kiri di kartu HP. Delapan berkas: detail penjualan (dua tabel), detail
  dan revisi surat jalan, detail pengajuan outlet dan gudang, detail stock
  adjustment, detail stock opname, dan riwayat Langganan (`eb64c70`).
- **CV23a: grid langkah 2 generate jadwal ditunda** bersama kalender
  jadwal (TB4a), karena bentuknya grid staf x tanggal, bukan tabel rincian.
- **CV24a: skala tipografi tujuh tingkat** (kanvas "Token Tipografi dan
  Spasi", arah A): tampilan 30/900, judul 24, subjudul 18, besar 16, isi
  14, kecil 12, mikro 11/600. Seluruh kelas ukuran diganti nama token dan
  ESLint menolak ukuran lain. Pembulatan: 13 dan 15 px menurut peran
  (redup turun, lainnya naik), 20 ke 18, 36 ke 30; semua h1 menjadi judul
  dan h2 subjudul; black dan extrabold di luar angka KPI menjadi bold
  (`5e597c2`).
- **CV25a: teks hero dikecualikan dari skala**: angka 404, angka besar
  widget Pengguna, dan judul hero login serta lupa password, dengan
  komentar `eslint-disable` beralasan.
- **CV26a: judul dan subjudul tanpa ketebalan bawaan**, agar teks biasa
  18 px tidak ikut tebal; h1 dan h2 menulis `font-bold` sendiri.
- **CV27b: spasi tetap skala Tailwind dengan aturan tertulis** (arah B):
  keputusan rancangan butir 35; halaman diseragamkan saat disentuh.
  Seluruh pembungkus diseragamkan sekaligus 18 November 2026 (SP1a, Padding
  HP dan pembungkus halaman).

### Luberan tabel 768 px

Diputuskan pemilik proyek pada 17 November 2026 dari kanvas desain
"Luberan Tabel 768 px" (arah A dari tiga, render nyata 768 px), setelah
pengukuran wadah dan lebar alami seluruh tabel daftar dan rincian di 768,
1024, dan 1280 px. Tidak ada satu batas lebar wadah yang memisahkan dengan
bersih: tabel yang meluber di 768 px berwadah 568 sampai 664 px, sedangkan
yang muat di 1280 px ada yang lebih sempit (rincian Pengajuan dan Transfer
563 sampai 584 px, Pengguna 661 px).

- **LT1a: kartu bila tabel tidak muat.** `useKartuBilaTakMuat`
  (`components/ui/use-kartu-bila-tak-muat.ts`) mengukur wadah tabel lewat
  ResizeObserver; bila lebar alami melebihi wadah, DataTable memasang
  `data-kartu` dan baris tampil sebagai kartu berlabel yang sama dengan
  kartu HP, di lebar layar mana pun. Varian `kartu:` dan `tabel:` di
  `app/globals.css` menggantikan `max-sm:` dan `sm:` di DataTable,
  sehingga kartu HP di bawah 640 px tidak berubah. Berlaku untuk daftar
  dan rincian. Ukur ulang dipicu kunci sederhana (jumlah baris, halaman,
  ukuran, status muat, jumlah kolom), bukan array data. Hasil: 29 tabel
  menjadi kartu di 768 px, tidak ada tabel meluber di 768, 1024, dan
  1280 px.
- **LT2a: kolom nama Pelanggan dibungkus 180 px**, agar tetap tabel di
  1024 dan 1280 px (sebelumnya 590 px di wadah 584 px). Sejak MB3a nama
  140 px dan Tipe 150 px, karena lencana membership ikut di kolom Tipe.
- **LT3a: baris filter Pengajuan Stok outlet boleh turun baris** mulai
  640 px, dan deretan tab selebar wadah lalu digeser di dalamnya.
- **LT4a: baris cari dan Masukkan Master Data Barang Gudang boleh turun
  baris** mulai 640 px (sebelumnya halaman +18 px).
- **LT5a: kartu saldo Arus Kas satu kolom di bawah 1024 px**, tiga kolom
  mulai 1024 px, sehingga label dan rupiah tidak terpotong di 768 px.
  Kerangka muatnya ikut satu kolom: diterapkan di luar teks opsi, lalu
  dipertahankan pemilik proyek setelah ditanyakan.
- **LT6a: empat kolom kosong kartu HP tampil berlabel di kartu lebar
  meja.** Tanggal dan Pelanggan daftar penjualan serta Tanggal Dibuat dan
  Lokasi stock opname diberi `meta.label` dan `meta.sembunyiHp`: selnya
  tersembunyi di bawah 640 px seperti CV20a (`max-sm:hidden!`, karena
  `kartu:block` menimpanya tanpa penanda penting), dan tampil berlabel di
  kartu 640 px ke atas. Di mode tabel Pelanggan dan Lokasi tetap
  tersembunyi di bawah 768 px. Penerapan pertama menyembunyikan keempatnya
  juga di kartu lebar meja tanpa bertanya, sehingga tanggal penjualan
  hilang di tablet; pemilik proyek memilih arah ini setelah penyimpangan
  itu diakui.

### Luberan HP 390 px

Diputuskan pemilik proyek pada 17 November 2026 dari papan "Luberan di HP
390 px" di kanvas yang sama (render nyata sekarang dan usulan). Dengan
keempatnya, pindaian seluruh rute 390 px tidak menyisakan luberan; yang
tersisa pemotongan yang dirancang (kolom Staf kalender jadwal, nama aset
timeline) dan salah deteksi input tersembunyi Profil Toko.

- **LT7a: sel pesan kosong dan Memuat data di DataTable boleh turun
  baris** (`whitespace-normal`); tabel kosong Pembelian Stok sebelumnya
  10 px lebih lebar dari wadahnya.
- **LT8a: filter Akun kas dan Bahan baku daftar Pembelian Stok selebar
  baris di bawah 640 px** (`col-span-2 sm:col-span-1`); sebelumnya berbagi
  satu baris dan terpotong ("Semua a").
- **LT9a: tab Semua Produk dan Stok Kritis Data Produk boleh turun
  baris** (`flex-wrap`); sebelumnya Stok Kritis keluar 38 px dan halaman
  melebar 22 px.
- **LT10a: pemilih Buat Reservasi.** Pelanggan: teks kosong "Cari
  pelanggan..." dan nama terpilih dipotong rapi (`truncate`); sebelumnya
  meluber dari kartunya (halaman +18 px). Aset: teks kosong "Pilih aset",
  karena labelnya sudah "Pilih Aset / Meja / Ruangan".

Helper `tanpaLuberWadah` (`tests/helpers/tata-letak-uji.ts`) memeriksa
wadah gulir dashboard dan wadah tabel, karena `tanpaGulirSamping` hanya
mengukur dokumen dan tidak menangkap luberan di dalam wadah gulir.

### Padding HP dan pembungkus halaman

Diputuskan pemilik proyek pada 18 November 2026, dari pindaian 390 px
(jarak tepi isi dari tepi layar) dan pindaian kelas pembungkus di 1280 px
seluruh rute statis `app/dashboard`. Sebelumnya hanya 12 dari 78 rute
berjarak 16 px di HP (KH2b); 32 rute 32 px karena pembungkus `px-4`
ditumpuk di atas padding dashboard, sisanya 24 atau 40 px, dan halaman
Inventaris serta Reservasi sekitar 60 px karena layout dan halamannya
sama-sama memberi `px-4 py-8`. Pembungkus yang sesuai butir 35 hanya 40
dari 78, dengan 18 variasi lain.

- **SP1a: 16 px di HP untuk seluruh halaman** (opsi pertama dari tiga;
  lainnya kartu ikut diseragamkan, atau butir 35 apa adanya dengan 32 px
  di HP). Seluruh pembungkus halaman dan layout menjadi `mx-auto flex
  w-full max-w-{3xl|6xl|7xl} flex-col gap-6 sm:px-4 sm:py-8` (keputusan
  rancangan butir 35), di 76 berkas (`1072484`): mulai `sm` sama dengan butir 35
  sebelumnya, di HP tanpa padding tambahan. Lebar yang menyimpang dipilih
  dari tiga lebar butir 35: form `4xl` dan `5xl` (Produk, Catat Pembelian
  Stok, form dan revisi Pengajuan dan Transfer, Tarif) menjadi `3xl`;
  daftar dan detail `4xl`, `5xl`, atau tanpa lebar (Role, Buat Role,
  Kategori, detail penjualan, transfer, penerimaan, dan pengajuan,
  Langganan, Stock Adjustment, Stock Opname, Shift, Pola Roster) menjadi
  `6xl`; `max-w-2xl` (Akun Toko, Profil) menjadi `3xl`; `max-w-350`
  (Pengguna) menjadi `7xl`. Layout Keuangan dan halaman di dalamnya
  (`sm:p-6`, `p-4 sm:p-6`, `gap-8`) ikut aturan yang sama. Dikecualikan:
  dashboard ruang outlet dan gudang, serta kalender jadwal dan generate.
  Kartu tidak disentuh. Padding ganda layout dan halaman di lebar meja
  (Inventaris, Reservasi, Keuangan) tetap, karena mulai `sm` sengaja
  tidak berubah.
- **SP2a: kartu tengah Setup Gudang dan Pengaturan Gudang hanya membuang
  padding HP** (`p-4` menjadi `sm:p-4`); kartunya tetap di tengah layar
  (opsi pertama dari tiga; lainnya pembungkus standar rata atas, atau
  dibiarkan).

Sesudahnya 69 dari 78 rute berjarak 16 px di HP; sisanya rute yang
dikecualikan, dan Setup Gudang yang di toko uji dialihkan ke dashboard
gudang. Pindai memakai `~/.cache/frontend-web/alat/pindai-visual`
ditambah dua spec sementara (padding dan pembungkus) yang tidak di-commit.
Pindaian jarak tepi mengambil kotak terkiri di halaman, sehingga padding
bersarang di bawah judul layout (Keuangan) tidak terbaca; kelas
pembungkus dibaca dari kode.

### Ukuran tombol Buat, Tambah, dan Catat

Diputuskan pemilik proyek pada 19 November 2026 (`inti/status.md`,
Berikutnya butir 5), dari pengukuran DOM seluruh rute statis
`app/dashboard` di 1280, 768, dan 390 px. Sebelumnya ada empat tinggi:
44 px (`h-11`: Bahan Baku, Aset, Tarif, Tipe Aset, Buat Reservasi Baru,
Master Shift, Pola Roster, Tambah Manual), 48 px (Mesin Kasir; Akun Kas
di HP), 32 px (bawaan `h-8`, mayoritas), dan 28 px (`size="sm"`: Buat
Penjualan dan Buat Opname); sudut 8, 10, atau 14 px; padding samping 10,
20, atau 24 px; di HP 17 halaman selebar penuh dan sekitar 10 tidak.

- **TK1a: `size="aksi"` di `Button`**: 32 px dengan padding 10 px di
  bawah 640 px, 44 px dengan padding 24 px mulai `sm`; sudut 10 px, ikon
  16 px, tebal bold. Warna dan variant setiap tombol tidak diubah, dan
  kelas `h-`, `px-`, `rounded-`, serta jarak ikon milik halaman dibuang.
- **TK2a: tata letak kepala halaman**: mulai 640 px tombol di kanan
  sebaris judul (`sm:flex-row sm:items-center`), di HP turun ke bawah
  judul dan selebar penuh. Teks lengkap di semua lebar ("Buat" Penjualan
  di HP menjadi "Buat Penjualan"). Tombol di tengah isi (kartu kosong
  Membership dan Mesin Kasir, panel Mesin Kasir) ikut ukuran dan lebar
  ini dengan posisi tetap.
- **TK3a: cakupan semua tombol berteks Buat, Tambah, dan Catat**,
  termasuk tombol tambah baris di form (Tambah Barang, Baris, Bahan,
  Item, Fasilitas Lain, Split Shift) dan tombol kirim (Buat Penjualan,
  Buat Draft & Mulai Opname, Buat Posisi). Posisinya di form tetap; di
  HP selebar penuh, mulai 640 px lebar mengikuti teks kecuali yang memang
  selebar penuh (Tambah Fasilitas Lain, Tambah Split Shift). Batal di
  samping tombol kirim ikut ukurannya, dan di HP keduanya selebar penuh
  bertumpuk.
- **TK4a: tetangga sebaris ikut ukuran**: Pindah Dana (Akun Kas),
  Auto-Generate (Jadwal), Filter Aset (layout Reservasi), Filter
  (Penjualan), dan kotak cari Inventaris Gudang. Di HP baris tombolnya
  selebar penuh dan dibagi sama rata (Filter Penjualan yang hanya ikon
  tetap selebar ikon; kotak cari Gudang di baris sendiri). Untuk Akun
  Kas ini menggantikan susunan bertumpuk 48 px KH1a (`modul/keuangan.md`):
  label keduanya utuh di 390 px (159 px per tombol), dan
  `keuangan/tampilan-hp` kini memeriksa sebaris, lebar sama, dan 32 px.
- **TK5a: kasus khusus yang ikut**: kartu Tambah Paket Membership menjadi
  tombol garis putus-putus berukuran baku dengan teks kecilnya pindah ke
  tooltip (`title`), Buat Surat Jalan, Masukkan Master Data, dan
  Daftarkan Member. Wizard setup tidak disentuh, dan tombol "Proses &
  Buat Tagihan" Buat Reservasi tidak termasuk karena teksnya diawali
  "Proses".
- **TK6a: tailwind-merge mengenal token ukuran huruf.** `cn()` membuang
  `text-isi` dan `text-kecil` bila ada kelas warna teks (`text-gading`,
  `text-navy`), karena token proyek tidak dikenalnya, sehingga hampir
  semua `Button` tampil 16 px. Ketujuh token butir 34 didaftarkan lewat
  `extendTailwindMerge` di `lib/utils.ts`; huruf tombol di seluruh
  aplikasi kembali ke ukuran varian (14 px, `sm` dan `xs` 12 px).

Sesudahnya seluruh tombol dalam cakupan terukur 44 px di 1280 dan 768 px
dan 32 px di 390 px, dengan padding, sudut, dan huruf yang sama. Ukur dan
pratinjau memakai dua spec sementara di folder sampel sementara
`tests` (tidak di-commit); tangkapan per lebar dibagikan sebagai pratinjau ke pemilik
proyek.

### Filter seragam

Diputuskan pemilik proyek pada 19 November 2026 dari kanvas desain
"Popup Filter" (papan Sekarang, desain A, B, dan C, lalu gabungan), setelah
pindaian seluruh rute statis 1280 px dan pemetaan isian dari kode.
Sebelumnya hanya Penjualan dan Reservasi yang punya tombol Filter:
Penjualan membuka panel di dalam halaman, dan Filter Aset Reservasi tidak
berfungsi (`onClick` kosong). Halaman lain menampilkan isian langsung
dengan susunan, label, dan tinggi berbeda (40 sampai 48 px), serta tiga
gaya Reset Filter.

- **FL1a: gabungan tiga desain.** Bilah dari desain C: kotak cari selalu
  tampil (Penjualan: nomor referensi) dan tombol "Filter lainnya" dengan
  lencana jumlah filter aktif; di HP tombolnya ikon dan lencana. Tanda
  aktif dari desain A: deretan pil "Label: nilai ×" dan "Atur ulang
  semua" di bawah bilah, tidak tampil bila tidak ada filter aktif. Panel
  dari desain B: panel samping dari kanan berkelompok, layar penuh di HP.
- **FL2a: periode hanya di panel**, dengan pil cepat di atas dua isian
  tanggal (FL12a).
- **FL3a: pilihan berlaku lewat Terapkan.** Menutup panel tanpa Terapkan
  membuang pilihan yang belum diterapkan; Atur ulang mengosongkan isian
  panel.
- **FL4a: pil aktif dengan Atur ulang semua**; × menghapus satu filter.
- **FL5a: animasi panel**: masuk geser dari kanan sekitar 260 ms dengan
  latar meredup, keluar sekitar 200 ms; tanpa animasi bila perangkat
  meminta gerak dikurangi.
- **FL6a: cakupan semua halaman yang punya pilihan.** Panel di Penjualan,
  Diskon, riwayat Pindah Dana, Arus Kas, Pengeluaran, Belanja Stok, Mutasi
  Kas, Pembelian Stok, Jurnal Stok, Master Shift, Stock Opname, dan
  Pengajuan Stok (outlet dan gudang bila ada), riwayat Mesin Kasir, dan
  Akun Klien admin. Halaman yang hanya punya kotak cari tidak mendapat
  tombol Filter, tetapi kotak carinya diseragamkan (44 px mulai 640 px,
  32 px di HP, ikon cari). Tab dan pilihan jumlah baris per halaman tetap.
- **FL7a: halaman tanpa kotak cari** (Mutasi Kas, Pengeluaran, riwayat
  Pindah Dana, Diskon, riwayat Mesin Kasir, Arus Kas) hanya mendapat
  tombol Filter lainnya rata kanan; tidak ada pencarian baru (butir 27).
- **FL8a: Arus Kas ikut tanpa "Kelompokkan per"**, yang tetap di halaman
  sebagai pilihan tampilan.
- **FL9a: Filter Aset di layout Reservasi dihapus.**
- **FL10a: bentuk isian di panel**: pilihan tetap 2 sampai 4 berupa
  segmen, 5 ke atas berupa pil, daftar dari data (akun kas, kategori,
  bahan, mesin kasir) berupa Select di dalam panel; tanggal `PilihTanggal`.
- **FL11a: periode bawaan tidak dihitung** di lencana dan tidak menjadi
  pil sampai diubah; Atur ulang kembali ke bawaan halaman (butir 28).
- **FL12a: pil periode cepat** (Hari ini, 7 hari, Bulan ini) di setiap
  panel bertanggal, dihitung lewat `useHariIni`. Pembayaran per Metode
  tidak disentuh (OM2a).
- **FL13a: pemilih outlet tetap di halaman**, di luar panel, tanpa
  lencana dan pil (LP1a); termasuk pilihan Lokasi di Stok, sehingga Stok
  menjadi halaman hanya-cari.

Penerapan: komponen bersama `components/filter/bilah-filter.tsx`
(`KotakCari`, `TombolFilter`, `BilahFilter`, `PilFilterAktif`) dan
`components/filter/panel-filter.tsx` (`PanelFilter` dari Dialog Radix,
`KelompokFilter`, `PilihanPil`, `PilihanSegmen`, `PilihanPeriode`), draf
lewat `hooks/use-panel-filter.ts`, label pil dan periode cepat sebagai fungsi
murni di `lib/filter.ts`, animasi `panel-filter-gerak` dan
`latar-filter-gerak` di `app/globals.css`. Percontohan Penjualan: tombol
Filter keluar dari kepala halaman ke bilah, sehingga Buat Penjualan sendirian
di kepala (bagian Penjualan dari TK4a berakhir), dan nomor referensi berlaku
sendiri setelah jeda 400 ms tanpa Terapkan. Helper uji `tests/helpers/filter-uji.ts`.

Keputusan lama yang berakhir karena isiannya pindah ke panel: CV2b butir 1
(lebar pemicu Arah dan Alasan jurnal stok) dan CV15a (label Arah dan
Alasan, kini segmen dan pil berlabel kelompok), LT3a (baris filter
Pengajuan Stok), dan LT8a (Akun kas dan Bahan baku Pembelian Stok selebar
baris di HP, kini selebar isi panel; skenario 390 px-nya diganti pemeriksaan
panel). Halaman yang menonaktifkan filter selama ada penghalang memakai prop
`nonaktif` di `BilahFilter`.

Empat perilaku berikut diterapkan lebih dulu tanpa disebut opsi, diakui di
laporan, lalu diputuskan pemilik proyek pada hari yang sama:

- **FL16a: Atur ulang semua tidak mengosongkan kotak cari.** Kotak cari
  berdiri sendiri di bilah; Reset Filter lama di Jurnal Stok, Pembelian
  Stok, Belanja Stok, dan Stock Opname ikut mengosongkannya. Nomor
  referensi Penjualan berlaku sendiri 400 ms setelah diketik.
- **FL17a: Atur ulang semua Arus Kas tidak mengubah Kelompokkan per**
  (sebelumnya ikut kembali ke Hari).
- **FL18a: Saringan status Membership tetap segmen di halaman** seperti
  tab, dan Lokasi penerima Belanja Stok tetap Select di panel, karena
  bukan pemilih outlet lintas izin (FL13a).
- **FL19a: tombol Reset Filter di pesan riwayat kosong Mesin Kasir
  dibiarkan** (kembali ke tujuh hari terakhir).

- **FL14a: kotak cari Diskon pindah ke bilah.** Koreksi fakta: Diskon
  ternyata punya pencarian nama lewat `searchKey` DataTable, sehingga
  terlewat di FL7a. Pencariannya kini kotak cari bilah, dan `saringDiskon`
  menyaring nama di klien seperti sebelumnya (tanpa peka huruf besar).
- **FL15a: kotak cari DataTable diseragamkan di komponennya.** `searchKey`
  memasang `KotakCari`, sehingga Kategori, Metode Pembayaran, Pengguna,
  Kategori Beban, Pajak, dan Pelanggan ikut tanpa berpindah letak. Halaman
  hanya-cari yang menulis kotak cari sendiri (Produk, Bahan Baku, Stok,
  Aset, Tarif, Tipe Aset, Inventaris Gudang, Kirim Barang, daftar surat
  jalan, Penerimaan, Pola Roster, Stock Adjustment, Jadwal, Membership)
  memakai `KotakCari` di tempatnya. Segmen Saringan status Membership
  diperlakukan seperti tab dan tidak diubah (FL18a).

Filter Aset dihapus dari layout Reservasi (FL9a), sehingga Buat Reservasi
Baru sendirian di kepala layout dan selebar penuh di HP (TK2a); bagian
Reservasi dari TK4a berakhir.

Diputuskan pemilik proyek pada 20 November 2026 dari kanvas desain
"Tanggal Panel Filter" (render nyata Belanja Stok di 390 dan 1280 px, jam
dipatok 30 September 2026; papan Sekarang dan opsi A, B, C), setelah suite
penuh menemukan isian tanggal panel meluber lewat spec `tanggal-filter`
yang tertinggal dari FL1a. Bulan panjang ("01 September 2026", 182 sampai
184 px) tidak muat di tombol setengah lebar panel: 171 px di HP dan 178 px
di desktop.

- **FL20a: tanggal di panel filter berbulan singkat** (opsi B, `99ecd4c`).
  Dari dan Sampai tetap dua kolom; tombol `PilihTanggal` di `PilihanPeriode`
  memakai `formatTeks="pendek"` ("01 Sep 2026", "15 Agt 2026", pola
  `dd MMM yyyy` id-ID), dan nama aksesibelnya ikut pendek (pilihan pemilik
  proyek atas pertanyaan susulan). Tombol tanggal di form lain dan pil
  filter aktif tetap bulan panjang. Opsi lain di kanvas: A bertumpuk satu
  kolom (muat lega, panel bertambah satu baris) dan C tombol dirapatkan
  (padding 6 px, muat tanpa sisa di HP; padding 8 px masih luber 5 sampai
  7 px).

### Laman utama

Dikerjakan 19 November 2026 dari kanvas desain "Laman Utama Tachyon POS"
(desain G, kustom pemilik proyek dari desain F, C, B, A, dan E). `/` kini
laman pengenalan, bukan `LoginPage`; kodenya di `features/laman-utama/`.
Keputusan pemilik proyek sebelumnya: laman pengenalan lengkap, paket tanpa
harga, Coba gratis tanpa jumlah hari, dan pengunjung yang sudah masuk tetap
di laman.

- **LU1a: desain G.** Navbar dan hero desain F berlatar navy dengan pola
  titik ("Toko Anda, terbaca dalam satu layar.", penekanan sage pucat
  bergaris bawah), ruang outlet dan gudang desain C, tiga paket desain B,
  tahapan mulai dan banner desain A, lalu tanya jawab desain E dan kaki
  laman krem. Tanpa tombol di hero, karena sudah ada di navbar. Tombol
  Coba gratis di banner gading bertulisan navy, bukan karamel.
- **LU2a: ilustrasi dasbor sebagai komponen tiruan**
  (`ilustrasi-dasbor.tsx`), bukan gambar tangkapan. Ditulis pada ukuran
  layar asli (1440 × 900 desktop, 390 × 760 HP) lalu diperkecil, dengan
  menu sidebar dari `outletMenus` yang sama dengan sidebar aplikasi dan
  ikon lucide yang sama dengan dasbor. Kartunya dibaringkan ke belakang
  (poros di tepi bawah, 22° desktop dan 18° HP) tanpa garis tepi dan
  bayangan, agar menyatu dengan latar navy. Data contoh, dengan keterangan
  di bawahnya.
- **LU3a: pengunjung yang sudah masuk melihat satu tombol Buka
  dashboard** di navbar dan banner, menggantikan Masuk dan Coba gratis;
  tujuannya `/dashboard`, atau `/admin` bagi admin platform
  (`tujuanBukaDashboard` di `lib/auth/tujuan.ts`). Akun toko yang belum
  masuk PIN dan sesi yang masih dipulihkan tetap tamu. Kaki laman tetap
  menautkan Masuk, Coba gratis, dan Lupa password.
- **LU4a: gerak halus.** Saat dibuka atau di-refresh, teks hero naik
  bergantian dan kartu dasbor merebah dari tegak (`laman-naik`,
  `laman-rebah`). Saat digulir, setiap bagian naik dari arah datangnya,
  dari bawah saat menggulir ke bawah dan dari atas saat menggulir ke atas,
  lalu tersembunyi lagi setelah keluar layar (`Muncul`, `laman-muncul`).
  Tanya jawab membuka satu jawaban pada satu waktu dengan tinggi yang
  bergerak dan ikon + menjadi −. Semua 0,4 sampai 0,7 detik dan mati bila
  gerak dikurangi.
- **LU5a: judul besar laman utama ikut pengecualian CV25a**: judul hero
  (44, 64, 80 px), judul bagian (28 sampai 40 px), Tanya jawab (32 dan
  52 px), banner (30 dan 44 px), dan angka langkah (40 dan 56 px),
  masing-masing dengan komentar `eslint-disable` beralasan. Teks lain
  memakai skala tujuh tingkat, sehingga ukuran kanvas yang tidak ada di
  skala dibulatkan ke token terdekat (misalnya 15 dan 17 px menjadi
  besar, 20 px menjadi subjudul).
- **LU6a: deskripsi paket gaya A di kartu B** (pemilik proyek,
  24 November 2026, kanvas yang sama). Kartu, latar krem, judul "Pilih
  sesuai toko Anda", pengantar, kalimat untuk siapa, dan font sans laman
  tetap; tanpa tombol tambahan. Setiap fitur menjadi baris bergaris tipis:
  teks di kiri, "termasuk" atau tanda pisah di kanan (pembaca layar
  "tidak termasuk"), fitur yang tidak termasuk diredupkan tanpa coretan.
  Teks versi lengkap tabel A, sesuai `FITUR_PER_PLAN`: "Sesi booking:
  aset, tipe aset, dan tarif" mulai Advanced, "Gudang dan WMS: pengajuan
  dan transfer stok" hanya Pro. Diterapkan tanpa ditanyakan: teks baris
  tetap 14 px sampai 1024 px, karena di tablet 768 px kolom kartu sempit
  dan teks 16 px turun sampai tiga baris.

### Kerapian seluruh laman

Dikerjakan 20 November 2026 atas perintah pemilik proyek (butir 3 daftar
20 November 2026 di `inti/status.md`). Seluruh rute dipindai di HP 390 px,
HP mendatar 844 px, tablet 768 dan 1024 px, serta desktop 1280 dan
1440 px: 78 rute statis `app/dashboard`, 22 rute ber-`[id]` dengan id
nyata (390, 844, 768, dan 1280 px), dan lima laman publik. Pemindai
`rapi.spec.ts` di `~/.cache/frontend-web/alat/pindai-visual/`
(`referensi/helper-dan-shell.md`) menambah deteksi elemen bertumpuk,
berdempet, teks mepet tepi kotak, dan elemen yang keluar dari kartunya
pada pemindai 14 November 2026. Panel admin tidak dipindai, karena
ikut rombak UI/UX admin (butir 1 daftar yang sama).

Perbaikan teknis, diterapkan langsung:

- Status Staf dashboard di HP: label kotak ringkasan terpotong ("Mas…",
  "Pula…"), dan lencana status terdorong keluar kartu baris. Kotak
  ringkasan 2 × 2 bila wadahnya di bawah 288 px (`@container`, keputusan
  rancangan butir 31), dan nama di kartu baris terpotong di dalam selnya.
- Judul Koordinat Lokasi dan tombol Deteksi Otomatis (Profil Toko,
  Pengaturan Gudang, Setup Gudang) berdempet dua baris di HP; kini
  berjarak dan turun baris utuh.
- Generate jadwal: ikon panah pemilih template keluar dari kotaknya, dan
  tombol Batal menonjol keluar kartu ke kiri di HP. Langkah 1 dan 2
  memakai kaki tombol bertumpuk seperti form lain.
- Combobox Pelanggan, Produk penjualan, dan Kategori produk: nama panjang
  dipotong rapi, tidak lagi mendorong ikon keluar.
- Judul Diskon Global (Buat Penjualan) dan Diskon Global Transaksi (Buat
  Reservasi) terjepit dua baris di samping tombolnya di 1024 px; kini
  turun baris utuh.
- Label tanggal pertama sumbu grafik laba (dashboard dan Ringkasan Laba
  Rugi) terpotong; tepi grafik 28 px.
- Grid Informasi detail penjualan, stock opname, dan stock adjustment
  tanpa jarak kolom ("13:36POS"); kini `gap-x-4`.
- Judul layout Keuangan memakai `font-semibold text-zinc-900` dan judul
  Inventaris tanpa warna token; keduanya kini `font-bold text-navy`
  seperti Reservasi (keputusan rancangan butir 25 dan 34).
- Topbar memakai padding 32 px di HP sementara isi 16 px, sehingga tombol
  sidebar tidak segaris dengan tepi isi; padding topbar kini sama dengan
  area gulir (`px-4 sm:px-6 md:px-8`).

Keputusan pemilik proyek dari kanvas "Kerapian Seluruh Laman" (render
nyata, lima papan):

- **KL1b: `kartuLega` menjadi bawaan semua `DataTable`, satu kolom.**
  Kartu rapat sebelumnya berdempet; di daftar surat jalan label "Jumlah
  Item" bertumpuk 3 px dengan nilainya. Prop `kartuLega` tetap ada
  (bawaan `true`); `false` mengembalikan kartu rapat. Opsi lain: A
  dibiarkan, C kartu berkolom 2 dan 3 di HP mendatar dan tablet.
- **TH1a: tepi halaman di dalam layout modul segaris dengan judul
  modul.** Layout Inventaris, Keuangan, dan Reservasi sudah memakai
  pembungkus SP1a, lalu halaman di dalamnya menambah pembungkus yang sama,
  sehingga di 640 px ke atas isinya menjorok 16 px dan berjarak atas
  32 px tambahan. Atas pilihan susulan pemilik proyek, padding itu
  dinetralkan di layout (`sm:*:px-0! sm:*:py-0!` pada wadah konten), bukan
  dibuang per halaman, karena 11 komponen halaman dipakai bersama ruang
  Gudang yang tidak punya layout modul. Diperiksa di 46 rute ketiga modul:
  tidak ada pembungkus yang masih berpadding dan tidak ada kartu yang ikut
  kehilangan padding. Melengkapi keputusan rancangan butir 35.
- **TI1a: isian form setinggi 42 px.** Sebelumnya Input 42 px, Select
  46 px (varian `data-[size=default]:h-auto` menimpa tinggi yang ditulis
  halaman), dan combobox 32 px. `SelectTrigger` ukuran default kini 42 px
  (`data-[size=default]:h-[42px] py-0`), dan ketujuh combobox (Kategori
  produk, Pelanggan, Produk penjualan, bahan baku, reservasi, membership,
  pola roster generate) `h-[42px]`. Select ukuran sm, pemicu panel filter
  (`KELAS_PEMICU_PANEL`, tetap 46 px), dan pemilih bulan kalender dikunci
  dengan kelas ber-`!` agar tidak berubah.
- **KF1a: kaki tombol form di HP bertumpuk selebar penuh**, aksi utama di
  atas (`flex-col-reverse sm:flex-row`, tombol `w-full sm:w-auto`), sama
  dengan form Produk. Diterapkan di Buat Tarif, Metode Pembayaran, dan
  Pengajuan Stok; Aset, Tipe Aset, Ubah Tarif, dan Revisi surat jalan sudah
  bertumpuk. Form Pelanggan, Pajak, dan Kategori ada di dalam dialog,
  sehingga tidak termasuk ("bukan dialog" di teks opsi).
- **TT1a: tanggal topbar singkat di bawah 640 px** ("Jum, 20 Nov 2026");
  di 640 px ke atas tetap "Jumat, 20 November 2026". Diuji di
  `tests/unit/components/topbar.test.tsx`.
- **PP1a: tab Pajak per Produk mengikuti keputusan rancangan butir 26**
  (`modul/pengaturan-outlet.md`).

Yang dibiarkan karena dirancang, sama dengan pemindaian 14 November 2026:
deretan tab dan kalender jadwal bergulir ke samping, nama aset timeline
dan nama karyawan kalender dipotong "…", serta kontrol segmen periode
(Harian, Mingguan, Bulanan) yang tombolnya berimpit.

### Bug dan temuan frontend 23 November 2026

Diputuskan pemilik proyek 23 November 2026, dari daftar bug dan temuan frontend yang tersisa.

- **BB1a: bayangan kartu baris per sel**: `box-shadow` bawah di setiap sel
  tabel (`components/ui/table.tsx`), bukan filter pada `tr`, agar tampil
  di semua browser; mode kartu DataTable memasang bayangan di kartunya dan
  sel tanpa bayangan. Pembuktian di WebKit (Safari) tidak dapat dijalankan
  di mesin ini karena pustaka sistemnya tidak ada, sehingga pemilik proyek
  memilih mengganti tanpa menunggu bukti.
- **KB1a: tombol Kembali, Batal, dan Batalkan bertujuan pasti**, bukan
  `router.back()` yang bergantung riwayat browser: Buat Reservasi ke daftar
  reservasi, Buat Pengajuan ke daftar pengajuan dan revisinya ke detail
  pengajuan, Batal Revisi surat jalan ke detail surat jalannya, surat jalan
  dan penerimaan yang tidak ditemukan ke daftarnya, dan pembayaran
  penjualan ke detail penjualannya. `router.back()` hanya tersisa di
  halaman galat yang berlabel "Kembali ke halaman sebelumnya". Penyebab
  gagal sesekali "Batalkan kembali ke daftar" di suite penuh; dibuktikan
  `tampilan/tombol-kembali` dengan membuka setiap laman di tab baru, dan
  spec itu gagal terhadap kode lama.

### Tombol bertaut 24 November 2026 (`3494bdd`)

Diputuskan pemilik proyek 24 November 2026, dari temuan rombak panel admin.
Hitungan lewat AST 9 tempat di 7 berkas, bukan sekitar 21 berkas seperti
catatan awal.

- **BT1a: `<Button asChild>` berisi `<Link>` di kesembilan tempat**, dengan
  aturan ESLint `no-restricted-syntax` yang menolak Link membungkus Button
  (keputusan rancangan butir 39): Pindah Dana dan Tambah Akun di Akun Kas,
  Tambah Metode, Kembali ke Daftar, dan Batal di metode pembayaran, serta
  Buat Akun Klien, Ubah Akun, dan kedua Batal di panel admin. Kelas tata
  letak Link digabung ke Button. Tambah Akun memakai `border-navy`, bukan
  `border-none`: sebagai item flex berbasis 0, tautan berborder 1 px
  (Pindah Dana) melebar 2 px dari tautan tanpa border.
- **BT2a: Batal terkunci selama menyimpan** di buat dan ubah akun admin
  serta form metode pembayaran: redup, tidak dapat diklik, dan tidak
  dijangkau Tab. Sebelumnya hanya klik yang tertahan; Tab ke tautan lalu
  Enter tetap berpindah halaman.

## Catatan

### Catatan dari tabel seragam K-E

Dikerjakan pada 18 Oktober 2026 dalam satu commit, terhadap backend
`ridho` `00de455`. Rancangan ditunjukkan sebagai pratinjau dan disetujui
pemilik proyek sebelum diterapkan.

| Commit | Isi |
|---|---|
| `eb81a1f` | Aset, tarif, dan tipe aset: `DataTable`, menu `MenuEditHapus`, baris filter tanpa panel dan chip Total, token di tarif, dan spec lewat pencarian (TB21a sampai TB23a) |

- `guard-dashboard` tidak terdampak: satu-satunya rute K-E yang ia buka
  adalah halaman ubah tarif, bukan daftar. Ini koreksi kedua atas daftar
  spec terdampak, sesudah `generate-jadwal` di K-D.
- Ketiga halaman menghitung daftar tersaring lewat `.filter()` di badan
  komponen, sehingga `DataTable` akan kembali ke halaman 1 setiap render,
  termasuk saat dialog hapus dibuka. Daftar dan kolom kini di-`useMemo`
  (`referensi/arsitektur.md`, Tabel data).
- Tarif memakai objek warna hex lokal di hampir setiap sel; tabel dan
  baris filternya kini memakai token, dan `COLORS` tinggal tiga warna
  untuk dialog hapus. Baris `ID:` di aset dibuang mengikuti TB17a.
- Ketiga spec diubah lewat skrip sekali pakai berhitungan
  (`arsip/pelajaran.md`): 30 `cariBaris`, 10 hapus dan 3 edit lewat menu, 11
  pernyataan Total, dan pencarian kategori sebelum baris tipe aset. Lima
  baris sesudah pencarian eksplisit sengaja tidak diubah, termasuk uji
  huruf kapital.
- Penerapan pertama gagal di semua gerbang karena terminal berada di
  subdirektori, dan gerbang commit pertama menolak karena `/tmp/p.json`
  hilang setelah mesin dinyalakan ulang; e2e dijalankan ulang dengan
  penjaga posisi backend (`arsip/pelajaran.md`).
- Suite e2e penuh sesudah commit: 461 lolos, 0 gagal, dan 13 skipped,
  sama dengan harapan hitungan sejak K-B (`inti/pengujian.md`).
- Butir utang berkas yang masih memakai `<table>` dihitung ulang menjadi
  9, seluruhnya tabel rincian dan kalender jadwal.
- Keputusan: `modul/ui-ux.md` (Fase UI/UX, TB21a sampai TB23a).

### Catatan dari tabel seragam K-D

Dikerjakan pada 17 dan 18 Oktober 2026 dalam satu commit, terhadap
backend `ridho` `00de455`. Rancangan ditunjukkan sebagai pratinjau dan
disetujui pemilik proyek sebelum diterapkan.

| Commit | Isi |
|---|---|
| `2177ac3` | Shift dan pola roster: `DataTable` dengan menu lama, panel filter krem dibereskan, pesan galat menggantikan tabel, dan spec lewat pencarian (TB19a dan TB20a) |

- `halaman-shift-ruang.tsx` dan `halaman-pola-roster-ruang.tsx` terbukti
  memuat kedua berkas tabel lewat impor, sehingga satu berkas melayani
  rute outlet dan gudang. `generate-jadwal` hanya memanggil API `/shift`
  untuk data uji dan tidak terdampak, berbeda dari catatan sebelumnya.
- Menu titik tiga dan pesan `role="alert"` sudah ada sebelum K-D; yang
  diganti bingkai tabel, kepala kolom `#F8F3EB`, `whitespace-nowrap`, dan
  pesan galat yang tadinya berupa sel tabel. `handleOpenEdit` dan
  `handleOpenDelete` shift diganti setter langsung agar `kolom` dapat
  di-`useMemo` tanpa dependensi.
- Sembilan tempat di kedua spec mencari baris uji tanpa pencarian, dan
  shift yang dinonaktifkan tetap tersimpan sehingga daftarnya bertambah
  setiap run. Semuanya kini lewat `cariShift` dan `cariPola` (TB14a).
  Empat pemanggilan combobox tanpa nama di spec shift disebut namanya,
  karena pemilih jumlah baris `DataTable` juga combobox (`referensi/playwright.md`).
- Gerbang commit pertama pada 18 Oktober menolak karena `/tmp/p.json`
  hilang setelah mesin dinyalakan ulang; e2e dijalankan ulang dengan hasil
  yang sama (`arsip/pelajaran.md`).
- `origin/nizar` membawa `96e890e` dan `3efd05b` (18 Oktober): tanggal
  lampau jurnal transfer hanya dipakai untuk Owner (P23), peran lain
  dicatat dengan waktu sekarang. Belum di `ridho`. Tidak berdampak ke web,
  karena pindah dana tidak mengirim `tanggal` (DN3a,
  `features/jurnal-transfer/payload.ts`); kontrak diperbarui saat acuan
  pindah.
- Butir utang berkas yang masih memakai `<table>` dihitung ulang menjadi
  12 (tertinggal di 17 sejak K-A).
- Vitest 659 lolos di 81 berkas; kedua spec 26 lolos dan 3 skipped (fixme
  yang menunggu backend). Suite penuh tidak dijalankan (`inti/pengujian.md`).
- Keputusan: `modul/ui-ux.md` (Fase UI/UX, TB19a dan TB20a).

### Catatan dari tabel seragam K-B

Dikerjakan pada 17 Oktober 2026 dalam satu commit, terhadap backend
`ridho` `00de455` yang tidak berubah. Rancangan ditunjukkan sebagai
pratinjau dan disetujui pemilik proyek sebelum diterapkan.

| Commit | Isi |
|---|---|
| `753f61e` | Stok outlet dan inventaris gudang: `DataTable`, menu titik tiga bersama, kolom gudang dirampingkan, pesan galat, dan spec lewat menu (TB16a sampai TB18a) |

- Kedua halaman tetap terpisah di `app/` (Kapan halaman disatukan,
  `referensi/arsitektur.md`): sumber lokasinya berbeda (cakupan lintas outlet dan
  `useLokasiBertipe`), dan hanya gudang yang punya dialog tambah barang
  serta layar memuat global. Yang dibagi hanya menu aksi baris,
  `features/inventaris/menu-aksi-stok.tsx`.
- `GET /inventory` mengembalikan seluruh stok tanpa paginasi. Pencarian
  dikirim ke server, sedangkan tab Stok Kritis dan saringan lokasi
  bertipe Outlet berjalan di klien.
- `kolom` gudang diletakkan sebelum layar memuat global, karena
  `useMemo` adalah hook dan tidak boleh berada sesudah `return` awal.
- Spec `lihat-stok` memakai pola K-A untuk jumlah baris, membuka dialog
  lewat menu dengan indeks sel per tabel, dan mengambil target ubah serta
  opname dari sepuluh data pertama karena tabel mempertahankan urutan
  respons. `memuat-stok` tidak berubah: kepala tabel tetap tampil, dan
  `DataTable` menampilkan "Memuat data..." selama lokasi dimuat.
- Berkas baru `menu-aksi-stok.tsx` dibuat manual tanpa baris baru di
  akhir, sehingga `wc -l` melaporkan 45, bukan 46; isinya dibuktikan
  identik lewat sidik `md5` di gerbang commit (`arsip/pelajaran.md`).
- Vitest 659 lolos di 81 berkas; `tests/e2e/inventaris/stok` 14 lolos dan
  3 skipped (dua fixme lintas outlet, satu karena tidak ada stok gudang
  yang kritis). Suite penuh tidak dijalankan (`inti/pengujian.md`).
- Keputusan: `modul/ui-ux.md` (Fase UI/UX, TB16a sampai TB18a).

### Catatan dari tabel seragam K-C

Dikerjakan pada 17 Oktober 2026 dalam satu commit, terhadap backend
`ridho` `00de455` yang tidak berubah sejak K-A: tidak ada cabang remote
yang membawa commit baru. Rancangan ditunjukkan sebagai pratinjau dan
disetujui pemilik proyek sebelum diterapkan.

| Commit | Isi |
|---|---|
| `6f9d3eb` | Surat jalan gudang: `DataTable`, menu titik tiga, pesan galat, dan spec lewat pencarian (TB13a sampai TB15a) |

- Satu-satunya pemakai halaman adalah
  `app/dashboard/gudang/transferStok/page.tsx`, dan satu-satunya spec yang
  membuka rutenya `alur-transfer-stok`; `alur-pengajuan-stok` hanya
  menyebut field `transferStokID`.
- `GET /transferstok` mengembalikan seluruh surat jalan tanpa paginasi,
  diurutkan `tanggalKirim` lalu `createdAt` turun (`transferStokService`
  baris 360, dikunci test unit backend). Data development berisi 374
  surat jalan (212 BATAL, 162 DITERIMA), yang sebelumnya dirender
  sekaligus.
- Isi kelima kolom dan urutan server tidak berubah. Tanggal yang tampil
  tetap `createdAt`, walau urutannya menurut `tanggalKirim`.
- Spec mendapat skenario galat: setiap `GET` daftar dijawab 500, React
  Query mengulang sekali (`retry: 1` di
  `components/providers/query-provider.tsx`), lalu pesan `role="alert"`
  tampil tanpa `<table>`.
- Gerbang commit pertama menolak karena `/tmp/v.log` berisi kode warna
  ANSI; yang diperbaiki gerbangnya, bukan kodenya (`arsip/pelajaran.md`).
- Vitest 659 lolos di 81 berkas; spec `alur-transfer-stok` 2 lolos.
  Suite penuh tidak dijalankan (`inti/pengujian.md`).
- Keputusan: `modul/ui-ux.md` (Fase UI/UX, TB13a sampai TB15a).

### Catatan dari tabel seragam K-A

Dikerjakan pada 17 Oktober 2026 dalam empat commit, setelah `ridho`
di-fast-forward ke `00de455` (dua commit dokumen `nizar`, tanpa perubahan
kode). Setiap rancangan ditunjukkan sebagai pratinjau dan disetujui
pemilik proyek sebelum diterapkan.

| Commit | Isi |
|---|---|
| `4677447` | `DataTable`: pilihan ukuran klien opt-in dan test integrasi pertamanya (TB11a) |
| `9b06283` | Jurnal stok: `DataTable`, dialog rincian, dan teks keluar `red-800` (TB9a, TB12a) |
| `fc6ddd3` | Mutasi kas: teks keluar `red-800` (TB12a) |
| `20e332f` | Pengajuan stok: `DataTable` dan menu titik tiga (TB10a) |

- Rute pemakai komponen bersama dibuktikan dari `app/`: jurnal stok dan
  pengajuan stok dipakai ruang outlet dan gudang.
- Spec yang menghitung seluruh baris kini membandingkan halaman pertama
  (paling banyak 10) dan kaki "N total data"; tombol baris diganti menu
  titik tiga.
- Gerbang ESLint pertama menolak warning `react-hooks/incompatible-library`
  di `data-table.tsx` yang sudah tercatat dan sengaja dibiarkan; yang
  diperbaiki gerbangnya, bukan kodenya (`arsip/pelajaran.md`).
- Pemilik proyek menilai `red-600` terlalu terang dan memilih `red-800`
  dari pembanding empat warna; `red-700` yang direkomendasikan tidak
  dipilih (TB12a).
- Vitest 659 lolos di 81 berkas. Spec terdampak lolos per commit; suite
  penuh tidak dijalankan (`inti/pengujian.md`).
- Keputusan: `modul/ui-ux.md` (Fase UI/UX, TB8a sampai TB12a).

### Catatan dari fase UI/UX 11 Oktober 2026

Dikerjakan pada 11 Oktober 2026 dalam sembilan commit, atas arahan pemilik
proyek. Setiap rancangan ditunjukkan sebagai pratinjau dan disetujui
sebelum diterapkan (`arsip/pelajaran.md`, Pelajaran dari fase UI/UX).

| Commit | Isi |
|---|---|
| `342dcd3` | Grafik garis halaman ringkasan laba rugi menjadi `GrafikLaporan` di `features/laporan` |
| `3812763` | Lapisan data dashboard outlet (`features/dashboard-outlet`) dan `features/izin-cuti` |
| `0c5822b` | Halaman dashboard outlet; lonceng notifikasi di topbar dinonaktifkan |
| `584a2d8` | Lima warna utama menjadi token di `app/globals.css` |
| `93490bb` | Dasar tabel menjadi kartu per baris (`components/ui/table.tsx` dan `components/ui/data-table.tsx`) |
| `ba28f25` | Krem kembali ke `#F2EAE2` dan token peran `permukaan` |
| `cc1092e` | Kartu baris putih berbayang; panel pembungkus tabel dibuang di sebelas halaman |
| `f44db05` | Mutasi arus kas: kolom ringkas dan dialog rincian |
| `9cd22e1` | Daftar bahan baku memakai `DataTable` |

- Keputusan pemilik proyek tercatat di `modul/ui-ux.md` (Fase UI/UX): DB1a
  sampai DB6a untuk dashboard outlet, WR1a sampai WR4a untuk warna, dan
  TB1a sampai TB7a untuk tabel; ditambah keputusan rancangan butir 25
  dan 26.
- Yang dicoba lalu ditolak pemilik proyek: krem yang digelapkan menjadi
  `#E0D2C2` (masuk di `584a2d8`, dikembalikan di `ba28f25`), kartu baris
  berwarna krem, bingkai kartu putus-putus, dan garis kiri berwarna
  status. Dua yang terakhir tidak pernah di-commit.
- Vitest 653 lolos di 79 berkas, bertambah 19 dari 634: dua belas test
  lapisan data dashboard, enam test izin panel dan susunan petak, dan
  satu test label tanggal pendek.
- Suite e2e penuh dijalankan sekali, atas pohon kerja yang memuat isi
  `584a2d8` dan `93490bb` sebelum keduanya di-commit: 455 lolos, 0 gagal,
  dan 14 skipped. Sesudah itu hanya spec terdampak yang dijalankan: 155
  lolos dan 3 skipped untuk halaman pemakai tabel (`ba28f25`, `cc1092e`),
  7 lolos untuk mutasi dan tutup akun bersaldo (`f44db05`), serta 4 lolos
  dan 1 skipped untuk bahan baku (`9cd22e1`).
- Dua skenario `mutasi-kas.spec.ts` dan tiga langkah di dua spec bahan
  baku diubah mengikuti perilaku baru yang diputuskan pemilik proyek:
  rincian dan aksi dibuka lewat menu titik tiga. Asersi sesudahnya tetap.
- Dokumentasi kesembilan commit ditulis sekaligus di commit penutup, atas
  keputusan pemilik proyek menundanya sampai pekerjaan tabel hari itu
  selesai.
- Dua temuan backend dilaporkan pada hari yang sama, setelah commit
  dokumentasi `5706d4c` (`kontrak/temuan.md` butir 146 dan 147).

## Utang terbuka

- Kelas `font-mono` jatuh ke tumpukan bawaan Tailwind, bukan Geist Mono
  (terukur 27 November 2026 saat PW10); keputusan dan perbaikannya di
  PW16 (`referensi/antrean-web.md`).

Selain itu tidak ada utang terbuka per 26 November 2026. Teks kaki dan tombol halaman
`DataTable` (klien dan server: total data, Halaman N dari M, Previous dan
Next mati di ujung dan selama server sibuk, keadaan kosong, memuat, dan
pencarian) teruji integrasi sejak 26 November 2026, dan label sel di HP
sejak `2bcb1ce` (`tests/integration/components/data-table/data-table.test.tsx`;
`arsip/riwayat-pengujian.md`).
