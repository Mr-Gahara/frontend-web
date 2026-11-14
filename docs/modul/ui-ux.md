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
  hari itu (B183, `modul/jadwal-shift.md`).
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

### Utang kecil dari fase UI/UX 11 Oktober 2026

- `DataTable` punya test integrasi untuk pemilih ukuran klien sejak
  `4677447`. Teks kaki lainnya, nama tombol halaman, dan label sel di HP
  masih hanya terbukti lewat spec e2e halaman pemakainya.
- Label sel di HP hanya tampil bila kolom punya `meta.label` atau `header`
  berupa teks. Sebagian besar halaman menulis `header` sebagai komponen,
  sehingga kartu baris di HP menampilkan nilai tanpa label. Dilengkapi
  saat tiap halaman dirapikan.
- 9 berkas masih memakai `<table>` yang ditulis sendiri (19 sebelum K-A,
  per `eb81a1f`; seluruh tabel daftar selesai di K-A sampai K-E): tabel
  rincian di halaman detail dan form (delapan berkas, termasuk
  `features/jadwal/langkah-dua.tsx`), dan kalender jadwal
  (`features/jadwal/grid-jadwal.tsx`), yang perlu pratinjau tersendiri
  (keputusan TB4a). Sampai 16 Oktober 2026 daftar aset, tarif, tipe aset,
  dan pola roster tersirat masuk tabel rincian, padahal keempatnya tabel
  daftar (RG3a).
- Daftar akun admin dan tab pajak per produk
  (`features/pajak/tab-pajak-produk.tsx`) belum ditinjau terhadap aturan
  tabel yang baru.
- Dashboard gudang (`app/dashboard/gudang/page.tsx`) masih placeholder.
  Selesai di `06581f3` dan `50dca2f` (`modul/gudang.md`): halamannya kini
  memasang `HalamanDashboardGudang`.
- Layout dan tampilan panel admin masih menunggu fase ini (Utang kecil
  dari modul panel admin).
- Lonceng notifikasi nonaktif sampai ada sumber datanya (DB4a), dan status
  alpha staf ditunda (DB3a). Lonceng aktif sejak 12 November 2026 sebagai
  pusat pemberitahuan pengingat masa langganan (`modul/setup-akun.md`,
  TP8a); status alpha staf tetap ditunda.
- Sisa 68 warna heksadesimal belum menjadi token: konstanta palet lokal di
  tiga halaman reservasi dan tarif (termasuk `#FFFAF399` yang memakai
  akhiran alfa), warna grafik di `features/laporan/grafik-laporan.tsx`,
  dan warna di luar lima warna utama. Tipografi dan spasi juga belum.
  Sejak `eb81a1f` tabel dan baris filter tarif memakai token, dan
  `COLORS` di daftar tarif tinggal tiga warna untuk dialog hapus (TB23a);
  angka 68 belum diukur ulang.
- Temuan pemindaian 14 November 2026 yang dibiarkan karena dirancang:
  kalender jadwal dan deretan tab bergulir ke samping; keterangan Mutasi
  Kas di kartu HP dan nama aset di timeline reservasi dipotong "...".
  Aksi riwayat Pindah Dana yang masih tombol Batalkan dan tab Manajemen
  Booking yang tidak menandai tab mana pun di Buat Reservasi selesai di
  `883a79b` (CV17a, CV18a).
- `inventaris-nav-tabs.tsx` di rute inventaris outlet tidak dipasang di halaman mana pun (kode mati; ditemukan 14 November
  2026 saat menerapkan CV18a). Dihapus 14 November 2026 atas keputusan
  pemilik proyek (CV19a).
- Bayangan kartu baris memakai `filter` pada elemen `tr`. Di browser yang
  tidak mendukungnya, kartu tampil dengan bingkai saja.
- Suite e2e penuh dijalankan ulang pada 16 Oktober 2026 terhadap backend
  `ridho` `7d28135` (Catatan dari penyesuaian backend `ridho` `7d28135`);
  harapan sesudahnya 456 lolos dan 13 skipped. Suite penuh terakhir
  18 Oktober 2026 (`eb81a1f`): 461 lolos dan 13 skipped; harapan
  sesudah `20c026b` 462 lolos dan 14 skipped.
