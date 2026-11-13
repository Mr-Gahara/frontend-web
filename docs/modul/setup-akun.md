# Modul Plan dan Setup Akun

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim saat plan, pendaftaran, atau setup akun dikerjakan;
halaman login juga memakai `modul/profil-login.md`.

Rancangan plan dan setup akun, pembagian kerja backend, dan peta halaman
web. Rancangan yang sama diserahkan ke Nizar dan Yoga (backend) serta Ajis
(aplikasi) pada 1 November 2026; nomor N dan Y merujuk pekerjaan mereka.

## Keputusan

### Setup akun

Diputuskan pemilik proyek pada 1 November 2026, menggantikan butir
onboarding Model bisnis MVP (28 September 2026) di
`inti/keputusan-rancangan.md`.

- **SA1a: pendaftaran dan seluruh setup akun di web.** Klien mendaftar,
  login, dan menyelesaikan setup di web sampai akunnya siap dipakai POS
  kasir. Aplikasi hanya memakai akun yang sudah siap; alur pembuatan toko
  dan pendaftaran Owner di aplikasi dihapus.
- **SA2a: aplikasi menahan akun yang setup intinya belum selesai.** Akun
  tetap dapat login di aplikasi, tetapi ditahan dan diarahkan ke web.
  Penahanan ditegakkan aplikasi dan backend.
- **SA3a: status setup ditentukan backend, dan sekali selesai tetap
  selesai.** Aplikasi tidak ditahan lagi walau data kriterianya kemudian
  dihapus atau dinonaktifkan; web cukup menampilkan peringatan.
- **SA4a: setup dapat dilanjutkan** dari langkah terakhir yang tersimpan.
- **SA5a: bound device bukan bagian setup web.** Perangkat terikat ke
  pengguna yang login di aplikasi; urutan login, misalnya Owner lebih
  dulu, tidak ditegakkan.
- **SA6a: Owner dari setup web selalu ber-`aksesType` web dan app**, tidak
  boleh salah satu saja.
- **SA7a: petugas lapangan dan admin platform tetap ada**; alur ini
  memudahkan mereka.
- **SA8a: akun kas, metode pembayaran, dan pelanggan bawaan dibuat
  otomatis**, bukan langkah setup: "Kas Kecil (Laci)" dan "Tunai" (sudah
  ada), serta pelanggan "customer" (baru) yang tidak dapat dihapus atau
  dinonaktifkan, tetapi namanya boleh diubah.
- **SA9a: setiap produk di setup ditanya pakai stok dan pakai resep.**
  Tanpa stok berarti stok tak terbatas dan langsung dapat dijual; pakai
  stok mewajibkan stok awal dan stok minimal; pakai resep mewajibkan bahan
  baku dan jumlahnya.
- **SA10a: pajak yang wajib adalah pajak di modul pajak**, minimal satu
  aktif, per produk maupun per transaksi (misalnya PPN 11%), karena hanya
  modul pajak yang dibaca penjualan.
- **SA11a: bahan baku wajib hanya bila ada produk yang memakai resep.**

### Plan

Diputuskan pemilik proyek pada 1 November 2026, menggantikan rancangan tier
Basic, Advanced, dan Full.

| Plan | Fitur | Masa gratis |
|---|---|---|
| Basic | Semua fitur kecuali sesi booking dan WMS/gudang | 14 hari |
| Advanced | Semua fitur kecuali WMS/gudang | Tidak ada |
| Pro | Semua fitur | Tidak ada |

- **PL1a: sesi booking** mencakup sesi booking, aset, tipe aset, dan tarif;
  **WMS/gudang** mencakup lokasi bertipe Gudang dan seluruh alurnya
  (pengajuan stok, pengembalian, transfer stok atau surat jalan,
  penerimaan, dashboard gudang, dan operasi stok di lokasi Gudang). Kelola
  stok di outlet ada di semua plan.
- **PL2a: durasi semua plan 1, 3, 6, 12, dan 24 bulan.** Harga belum
  ditetapkan.
- **PL3a: masa gratis 14 hari hanya untuk Basic**, dan pendaftar mandiri
  selalu mulai di Basic dengan masa gratis.
- **PL4a: plan diubah admin platform**, dengan pembayaran lewat invoice
  manual tanpa payment gateway. Web punya halaman langganan berisi plan,
  masa berlaku, dan tombol menghubungi admin untuk upgrade atau
  perpanjangan.
- **PL5a: naik plan tidak menahan POS.** Hanya fitur baru yang terkunci
  sampai setup tambahannya selesai. Turun plan tidak menghapus data; route
  fitur di luar plan menolak.
- **PL6a: gudang hanya ada di Pro.** Tenant Basic dan Advanced punya satu
  outlet tanpa gudang.

### Halaman langganan

Diputuskan pemilik proyek pada 3 November 2026.

- **LG1a: kontak admin lewat WhatsApp.** Nomornya belum ditetapkan;
  selama `NOMOR_WA_ADMIN` kosong, halaman menampilkan teks tanpa tautan,
  bukan tautan palsu.
- **LG2a: hanya Owner, di menu Pengaturan.** Backend belum punya
  permission langganan, sehingga kartu dan halamannya dibatasi lewat role
  (`bolehLihatLangganan`), sebagai pengecualian dari gerbang berbasis
  permission. Entri `IZIN_HALAMAN` dibiarkan kosong dengan komentar, dan
  diganti pemeriksaan izin begitu permission-nya ada. Diganti di `c868870`
  (B229, `read-langganan`).
- **LG3a: pratinjau dengan data contoh**, seperti wizard setup: masa
  percobaan Basic 14 hari yang dimulai dua hari sebelum hari ini, dengan
  spanduk pratinjau, sampai N1 tersedia. Data contoh dibuang di
  `c868870`; masa percobaan dan awal masa berlaku dibaca dari riwayat,
  karena respons tidak memuat keduanya (`ringkasLangganan`).

### Akun dan OTP

- **AK1a: OTP selalu dikirim ke email akun.**
- **AK2a: email wajib diverifikasi dengan OTP saat mendaftar mandiri**;
  akun buatan admin platform dianggap terverifikasi.
- **AK3a: lupa password akun memakai OTP** dari halaman login, bukan
  langkah setup.
- **AK4a: OTP hanya untuk ubah email atau password akun dan hapus akun
  (B179 sampai B181), serta reset PIN Owner (B178)**, yang terakhir sebagai
  satu-satunya pengecualian di lapis pengguna. Ubah data pengguna lain
  tanpa OTP.

### Pembagian kerja backend

- **BK1a: dibagi menurut berkas agar tidak bentrok, dan bagian yang lebih
  besar ke yang bebannya lebih ringan.** Per 1 November 2026 Nizar lebih
  ringan (berkas status 38 baris dan 1 utang, sekitar 9 butir web terbuka)
  dibanding Yoga (97 baris dan 3 utang, sekitar 10 butir terbuka, ditambah
  butir 165 milik Ridho).

### Pengujian

- **UJ1a: alur ber-OTP diuji e2e lewat penangkap email lokal (Mailpit)**,
  tanpa email asli dan tanpa jalan pintas di logika OTP (Pengujian OTP, di
  bawah).

### Jam buka toko

Diputuskan pemilik proyek pada 7 November 2026, dari kanvas desain "Langkah
Jam Buka Toko - Wizard Setup" (lima gaya). Tampilan selesai tanpa API di
`b48cfdb` (logika murni) dan `1386a30` (komponen dan pratinjau);
penyambungannya menunggu backend (`kontrak/temuan.md` butir 176).

- **JB1a: langkah jam buka wajib, sesudah Lokasi outlet**, untuk shift dan
  jadwal karyawan. Pilihan "Buka 24 jam" atau "Jam tertentu" tanpa bawaan;
  Simpan dan lanjut menolak bila belum memilih atau ada hari Buka yang
  jamnya belum lengkap.
- **JB2a: jam tertentu diatur per hari**, Senin sampai Minggu, masing-masing
  berstatus Buka dengan jam, 24 jam, atau Libur. Backend B206 baru
  menyimpan satu pasang jam untuk semua hari.
- **JB3a: isi satu hari, lalu samakan.** Hari mulai berstatus Buka dengan
  jam kosong; "Samakan semua hari dengan <hari>" mengambil jam hari pertama
  berstatus Buka yang sah dan menimpa setiap hari Buka lain, tanpa mengubah
  hari 24 jam dan Libur.
- **JB4a: semua hari Libur tetap boleh disimpan, dengan peringatan** bahwa
  jam buka dapat diubah dari Pengaturan, Profil Toko.
- **JB5a: tutup lewat tengah malam dibaca dari jamnya.** Jam tutup lebih
  kecil dari jam buka berarti tutup keesokan harinya, sama dengan B206;
  keterangannya menyebut nama hari berikutnya ("Tutup keesokan harinya,
  Selasa pukul 02.00") dalam kotak karamel berikon bulan, dan hari lain
  diberi "Tutup di hari yang sama, pukul 22.00". Jam buka sama dengan jam
  tutup ditolak, mengikuti `tenantValidator`.
- **JB6a: desain C (garis waktu).** Kartu per hari berisi nama hari,
  ringkasan jam, bilah 00 sampai 24 sebagai hiasan, keterangan tutup
  keesokan harinya, tombol status, lalu isian; baris 24 jam dan Libur
  diberi keterangan, dan kartu Libur berlatar gading. Isian memakai
  `InputWaktu`, dengan tampilan isian setup lewat `className` di langkah
  ini saja.
- **JB7a: pratinjau dengan kerangka wizard** di `/setup/pratinjauJamBuka`
  (keputusan rancangan butir 30). `KunciLangkah` mendapat `jamBuka`, tetapi
  `daftarLangkah` final tidak berubah sampai penyambungan, karena langkah
  tanpa padanan status server akan membuka wizard yang sudah tuntas di
  langkah itu.

### Penanda dan panduan wizard

Diputuskan pemilik proyek pada 7 November 2026 dari kanvas desain
"Panduan Wizard Setup": gaya B, dengan penanda isian dan tautan Lihat
panduan dari gaya A. Menjawab isian yang tidak ikut terkirim oleh Simpan
dan lanjut (ditemukan pemilik proyek, 5 November 2026; Utang terbuka).
Mesinnya mengikuti keputusan rancangan butir 32.

- **PN1a: isian yang belum ditambahkan ditonjolkan** (`58d7eb9`). Selama
  isian kategori, bahan baku (bila ada resep), produk, atau pajak (bila
  sudah ada pajak tersimpan) terisi tetapi belum ditambahkan, tombol
  tambahnya menyala navy dan di bawahnya tampil "Belum tersimpan. Tekan
  <tombol>." Simpan dan lanjut menolak dengan pesan seperti 'Kategori
  "Minuman dingin" belum ditambahkan. Tekan Tambah kategori dulu, atau
  kosongkan isiannya.' (produk: "belum disimpan", tombol Simpan produk)
  dan menggulir ke tombolnya, alih-alih membuang isian diam-diam.
- **PN2a: tur sorotan di setiap langkah form wizard** (`c8a2e83`): nama
  toko, Owner, lokasi outlet, kategori, bahan baku, produk, pajak, sesi
  booking, dan gudang. Tur tampil sendiri saat langkah pertama kali
  dibuka di perangkat itu, dan dapat dibuka ulang lewat tautan Lihat
  panduan di samping nomor langkah. Ringkasan langkah tersimpan tidak
  punya tur maupun tautannya. Balon berisi "Panduan x dari y", tombol
  tutup, judul dan isi titik, Lewati panduan, Kembali (tidak di titik
  pertama), lalu Lanjut atau Selesai; layar diredupkan navy dengan
  cincin navy di elemen yang disorot. Tur yang tertutup dengan cara apa
  pun, termasuk karena pengguna pindah langkah, dicatat sudah dilihat.
- **PN3a: teks tur wizard disimpan di kode**
  (`features/setup/titik-panduan.ts`), disetujui pemilik proyek 7
  November 2026. Titik terakhir selalu tombol lanjut, dengan judul
  mengikuti teks tombolnya. Titik Tambah bahan baku hanya bila ada resep,
  Tambah pajak hanya bila sudah ada pajak tersimpan, dan "Belum siap?
  Lewati dulu" hanya di sesi booking dan gudang. Teks gudang tidak
  menyebut penjualan, karena gudang tidak berjualan. Teks yang disetujui
  pertama kali tidak tersimpan di kanvas, sehingga disusun ulang dari
  kode dan disetujui lagi.
- **PN4a: tur dashboard ruang outlet** (`5c3da45`): tombol bantuan
  "Lihat panduan dashboard" di topbar, di samping lonceng, dengan bentuk
  yang sama tetapi aktif. Lima titik: tombol menu, Data Barang, Karyawan
  & Staff, Kalender Jadwal, dan Pengaturan Outlet
  (`components/panduan/titik-dashboard.ts`; teks titik Karyawan dari
  kanvas). Titik menu yang tidak tampil bagi pengguna menurut izin atau
  plan tidak dimasukkan. Tur tampil sendiri bagi setiap pengguna web saat
  pertama kali membuka ruang outlet di perangkat itu (kunci per id
  pengguna). Di HP sidebar dibuka untuk titik menu dan ditutup lagi saat
  tur selesai. Ruang gudang belum punya tur, sehingga tombolnya tidak
  tampil di sana.

### OTP aksi Owner

Diputuskan pemilik proyek pada 13 November 2026 dari kanvas desain "OTP
Aksi Owner" (reset PIN, Akun Toko A dan B, hapus akun A dan B, desktop
dan HP 390 px), memakai B178 sampai B181 backend. Akhiran huruf mengikuti
opsi dialog yang dipilih; kode tanpa huruf adalah arahan yang ditulis
pemilik proyek sendiri. Menggantikan PF2a (`modul/profil-login.md`) dan
bagian reset PIN Owner di TP2a.

- **OA1a: reset PIN Owner tiga layar.** Tautan "Atur ulang PIN Owner" di
  panel Lupa PIN? login pengguna membuka tahap 1 (penjelasan dan Kirim
  kode). Sesudah kode terkirim, tahap 2 berisi kode, password akun toko,
  PIN baru, dan ulangi PIN, dengan kirim ulang berhitung mundur. Sesudah
  tersimpan, kembali ke login pengguna untuk masuk dengan PIN baru. Tata
  letaknya sama dengan login pengguna (desain E). Rute
  `/login/pengguna/reset-pin` dipilih sisi teknis.
- **OA2: setiap tahap satu layar tersendiri**, bukan beberapa tahap dalam
  satu layar; berlaku juga untuk Akun Toko dan hapus akun.
- **OA3a: ubah email dan password akun lewat dialog di tengah, dua
  tahap**: isian (email baru, atau password lama, baru, dan ulangi) lalu
  Kirim kode, kemudian kode dan Simpan. Email: toast sukses bawaan
  aplikasi, dan kartu menampilkan email baru. Password: pindah ke login
  akun dengan pesan masuk lagi.
- **OA4: toast sukses memakai popup bawaan** (sonner `richColors`, hijau,
  "Berhasil"), bukan toast berwarna navy.
- **OA5a: hapus akun lewat dialog dua langkah** (desain B kanvas).
  Langkah 1: akibat dan ketik nama toko, lalu "Kirim kode dan lanjut".
  Langkah 2: kode, PIN Owner, dan password akun, lalu Hapus permanen.
  Sesudahnya pindah ke login akun dengan pesan akun dan data toko telah
  dihapus.
- **OA6a: versi HP 390 px sesuai kanvas.** Tahap 2 reset PIN memakai
  panel navy ringkas satu baris; dialog selebar layar dikurangi 16 px
  dengan tombol bertumpuk (aksi utama di atas, tinggi minimal 44 px);
  isian berhuruf 16 px; baris email dan password boleh terlipat; toast di
  atas selebar layar; tablet memakai tata letak desktop. Dibuktikan e2e
  di 390, 768, dan 1280 px tanpa meluber.
- **OA7: Akun Toko tidak menambah atau mengubah sidebar.**
- **OA8a: halaman sendiri "Akun Toko"** di
  `/dashboard/outlet/pengaturan/akun`, dibuka dari kartu baru di halaman
  Pengaturan (urutan terakhir, setelah Langganan, berketerangan "Email dan
  password masuk akun toko, serta hapus akun beserta data toko. Hanya
  Owner."). Halaman berjudul "Akun Toko" ("Email, password, dan
  penghapusan akun toko. Hanya untuk Owner."), berisi kartu "Email dan
  Password" dan Zona Bahaya. Kartu dan halamannya hanya bagi Owner
  pemegang `update-akun`. Zona Bahaya nonaktif di Profil Pengguna
  dibuang.
- **OA9a: judul `/dashboard/profil` tetap "Profil Pengguna"**, karena
  halaman itu kembali hanya berisi data pengguna. Permintaan sebelumnya
  untuk mengganti judul menjadi "Profil Akun" dibatalkan oleh OA8a.
- **OA10a: tombol "Kirim kode dan lanjut" hapus akun aktif hanya bila
  nama toko cocok persis** (spasi di awal dan akhir diabaikan, huruf
  besar-kecil sama seperti backend).
- **OA11a: penolakan backend di tahap 2 tampil di tahap 2**, dan isian
  kode tetap (backend tidak menghanguskan kode untuk password lama salah,
  email terpakai, atau PIN dan password salah saat hapus). Untuk ubah
  email atau password, Kembali membawa ke tahap 1 dengan isian tetap
  terisi, dan Kirim kode di tahap 1 tidak wajib diulang: ada pilihan
  "Lanjut dengan kode yang sama".
- **OA12a: pesan sesudah keluar memakai toast bawaan login**
  (`titipPesanLogin`, seperti PF7a): toast hijau di kanan atas halaman
  login, bukan kotak di dalam form seperti di kanvas. Reset PIN kembali ke
  login pengguna dengan toast "PIN Owner diubah".

## Kriteria setup

| Kriteria | Minimal | Plan |
|---|---|---|
| Nama toko | 1 | Semua |
| Owner (nama dan PIN 6 digit, `aksesType` web dan app) | 1 | Semua |
| Lokasi outlet dengan koordinat dan radius absen | Tepat 1 | Semua |
| Kategori produk | 1 | Semua |
| Produk aktif berharga | 1 | Semua |
| Bahan baku | 1, hanya bila ada produk yang memakai resep | Semua |
| Pajak aktif di modul pajak | 1 | Semua |
| Tipe aset, aset, dan tarif | Masing-masing 1 | Advanced, Pro |
| Gudang | Tepat 1 | Pro |

Setup inti adalah kriteria yang berlaku untuk semua plan. Tipe aset, aset,
dan tarif adalah setup fitur sesi booking; gudang adalah setup fitur WMS.

## Pekerjaan backend

Diserahkan 1 November 2026 sebagai teks siap salin, satu dokumen per orang.

| Butir | Pemilik | Isi | Prioritas |
|---|---|---|---|
| N1 | Nizar | Plan di akun dan riwayat langganan, durasi, masa gratis Basic, plan di respons login dan token | Tinggi |
| N2 | Nizar | Middleware penegakan fitur per plan, dipasang di route sesi booking, aset, tipe aset, dan tarif | Tinggi |
| N3 | Nizar | Verifikasi email dengan OTP saat daftar mandiri | Tinggi |
| N4 | Nizar | Lupa password akun lewat OTP | Sedang |
| N5 | Nizar | Transport email SMTP non-produksi dan batas OTP lewat env | Tinggi |
| N6 | Nizar | Pelanggan "customer" bawaan yang dilindungi, beserta migrasinya | Sedang |
| Y1 | Yoga | Status setup per plan, tanggal selesai, daftar langkah, dan endpoint baca bertoken akun | Tinggi |
| Y2 | Yoga | Penolakan `pin-login` aplikasi selama setup inti belum selesai | Tinggi |
| Y3 | Yoga | `registerOwner` dari web dengan `aksesType` web dan app tanpa `installationId` | Tinggi |
| Y4 | Yoga | Stok minimal di produk | Sedang |
| Y5 | Yoga | Pemasangan middleware N2 di route WMS dan pembuatan lokasi Gudang | Sedang |
| Y6 | Yoga | Pajak di data toko tidak dipakai perhitungan (`kontrak/temuan.md` butir 166, `Perlu diputuskan`) | Rendah |

Titik singgung: respons login akun memuat plan (N1) dan status setup (Y1),
dengan fungsi hitung status dari Yoga dipasang Nizar; middleware N2 ikut
memeriksa status setup fitur dari Y1, agar fitur hasil naik plan tetap
terkunci sampai setup tambahannya selesai. Nama field dan kode galat di
dokumen serah terima hanya usulan; nama akhirnya mengikuti label B.

## Tampilan halaman

Varian desain dibuat di kanvas "Varian Login Tachyon POS" dan dipilih
pemilik proyek pada 1 November 2026. Ketiga halaman memakai font Geist
dan token warna yang sudah ada.

- **TP1a: login akun memakai desain A (Meja Navy)** (`e7fda09`): panel
  navy berisi merek dan judul "Buka toko, mulai shift.", form di kanan.
- **TP2a: login pengguna memakai desain E (Layar Kunci)** (`1f3b9e4`):
  latar krem, panel navy dengan jam dan tanggal yang berganti tiap
  menit, "Lupa PIN?" sebagai panel bantuan dua jalur (karyawan meminta
  Owner; reset PIN Owner disebut belum tersedia di web), dan "Keluar dari
  akun toko" menggantikan "Ganti Akun Bisnis". Panel menampilkan merek,
  bukan nama toko dan email (`kontrak/temuan.md` butir 167).
- **TP2b: panel login pengguna menampilkan nama toko dan email akun**
  (pemilik proyek, 10 November 2026, mengganti bagian merek di TP2a),
  dari `GET /akun/me` (B240); bila gagal dimuat, kembali ke merek
  Tachyon POS. Alasan memakai merek di TP2a, data yang belum tersedia,
  sudah tidak berlaku.
- **TP3a: daftar memakai desain E dengan carousel plan dan stepper**
  (`bb17c79`). Stepper "Daftar akun, Verifikasi email, Siapkan toko"
  (`features/auth/langkah-daftar.tsx`) dipakai lagi oleh wizard setup.
  Varian E2 (krem dan navy) ditolak. Stepper tegak di layar sempit yang
  disebut pesan commit `bb17c79` baru masuk di `50c99ae`, karena blok
  perbaikannya tidak diterapkan saat itu.
- **TP4a: teks halaman tidak menjanjikan langkah yang belum ada.** Tombol
  daftar bertuliskan "Daftar", bukan "Daftar dan kirim kode verifikasi",
  dan sesudah daftar halaman menyebut verifikasi email serta penyiapan
  toko belum tersedia. `/daftar` belum ditautkan dari login akun sampai
  N3 dan Y1 ada. Sejak `67ec690` daftar langsung ke isian kode
  (B231), dan halaman tidak pernah menyebut email sudah dipakai.
- **TP5a: wizard setup di `/setup`** (`50c99ae`), bergaya daftar E dengan
  stepper tegak dan daftar periksa langkah. Langkah mengikuti plan
  (`features/setup/langkah.ts`): Basic tujuh langkah, Advanced menambah
  sesi booking, dan Pro menambah sesi booking serta gudang. Koordinat
  outlet dan gudang diambil dari lokasi perangkat dengan dua peringatan:
  kotak peringatan bahwa koordinat diambil di lokasi itu sendiri, lalu
  dialog konfirmasi bahwa lokasinya sudah benar (keputusan pemilik
  proyek). Skema dipakai ulang dari modul yang ada: lokasi (radius absen 10
  sampai 50 meter), kategori, pajak, satuan resep, dan satuan bahan baku.
  Langkah selesai menyebut aplikasi kasir juga siap dipakai, dengan tombol
  "Masuk ke dashboard". Data pratinjau, belum menyimpan apa pun.
  Tersambung di `3205982` dan `41194b7` (5 November 2026): status dan
  plan dari `GET /api/setup/status`, dan `?plan=` dibuang.
- **WS1a: setiap butir langsung tersimpan di server.** Kategori, bahan
  baku, dan produk disimpan dan dihapus per butir, dan daftar yang tampil
  selalu dari server (pemilik proyek, 5 November 2026).
- **WS2a: wizard dibuka di langkah pertama yang belum selesai, dan
  langkah yang selesai dapat dibuka lagi.** Nama toko dan Owner terkunci
  setelah tersimpan; kategori, bahan baku, produk, dan pajak tetap dapat
  ditambah (pajak lewat "Tambah pajak", `493f49c`). Bahan baku tanpa
  resep, yang dilaporkan backend selesai, tetap disinggahi sampai produk
  selesai. Penerapan pertama (`41194b7`) sempat mengunci pajak tanpa
  bertanya (`inti/cara-kerja.md`, Opsi terpilih diterapkan persis).
- **WS5a: outlet, sesi booking, dan gudang yang tersimpan tampil sebagai
  ringkasan bertautan** ke halaman ubahnya: Profil Toko, Pengaturan
  Gudang, Aset, dan Tarif. Dipilih pemilik proyek setelah perbandingan
  untung rugi dengan "booking dan gudang bisa ditambah" (bertentangan
  dengan satu outlet dan satu gudang pada MVP) dan "bisa diubah di
  wizard" (kode dan risiko terbesar) (5 November 2026, `493f49c`).
  Tautannya diganti teks petunjuk oleh WS6a (`daf9e3a`).
- **WS6a: ringkasan tersimpan tidak bertautan** (pemilik proyek, 7 November
  2026, menggantikan tautan WS5a). Tautan "Ubah di ..." membawa pengguna
  keluar dari wizard ke dashboard sebelum setup selesai
  (`kontrak/temuan.md` butir 175). Ringkasan lokasi outlet, sesi booking,
  dan gudang cukup menyebut halaman untuk mengubahnya nanti, seperti
  catatan Nama toko ("Nama toko dapat diubah nanti dari Profil Toko.").
  Diterapkan di `daf9e3a`: lokasi outlet dapat diubah nanti dari Profil
  Toko, gudang dari Pengaturan Gudang, dan sesi booking dari halaman Aset
  dan Tarif di menu Sesi Booking & Reservasi; prop `tautan`
  `LangkahTersimpan` dibuang.
- **WS3a: Owner terdaftar tanpa sesi pengguna masuk lewat login PIN**
  (`/login/pengguna?kembali=/setup`), lalu kembali ke wizard; `kembali`
  hanya menerima `/setup`.
- **WS4a: setup fitur boleh dilewati** dengan "Lewati, lengkapi nanti";
  fiturnya terkunci sampai dilengkapi dari `/setup`. Setup yang tuntas
  mengalihkan `/setup` ke dashboard.
- **PF1a: menu fitur di luar plan disembunyikan** (sesi booking untuk
  Basic; gudang untuk Basic dan Advanced): Sesi Booking & Reservasi,
  Pengajuan, Terima, dan Kirim Barang, ruang gudang, dan Setup Gudang
  Baru. Pembelian Stok outlet ada di semua plan. URL langsung menampilkan
  ajakan naik plan dari gerbang rute tanpa memasang isinya (pemilik
  proyek, 5 November 2026, `8d0f1dd`).
- **PF2a: ajakan naik plan menuju halaman Langganan** bagi pemegang
  `read-langganan`; pengguna lain diminta menghubungi pemilik toko.
- **PF3a: setup fitur yang belum selesai tampil sebagai ajakan Lengkapi
  setup ke `/setup`** di halaman fitur yang terkunci (timeline Reservasi,
  Pengajuan, Terima, dan Kirim Barang), bukan "Gagal memuat data",
  ditambah banner di dashboard outlet.
- **PF4a: panel Status Venue dan bagian Sesi Booking di detail penjualan
  disembunyikan** untuk plan tanpa sesi booking; panel venue mengajak
  melengkapi setup bila setupnya belum selesai.
- **PF5a: ruang gudang Pro tanpa gudang tetap ke Setup Gudang**
  (`/dashboard/gudang/setup`), bukan ajakan ke `/setup`.
- **PF6a: banner Lengkapi setup hanya bagi pemegang izin buat data setup
  fitur itu**: tipe aset, aset, dan tarif untuk sesi booking, dan
  `create-location` untuk gudang.
- **TP6a: verifikasi email dan lupa password** (`6db571d`).
  `/daftar/verifikasi?email=` berisi isian kode enam kotak (pindah
  otomatis, hapus mundur, dan tempel) dan kirim ulang berhitung mundur;
  kode lengkap mengarah ke `/setup`. `/lupa-password` bergaya A dalam tiga
  tahap: email, kode dan password baru, lalu selesai. Aturan password
  dipakai bersama form daftar (`aturanPassword`). Keduanya belum
  ditautkan dan belum memanggil backend. Tersambung di `67ec690` (B217, B232):
  kode benar memverifikasi lalu langsung login dengan password titipan di
  memori (`kredensial-daftar.ts`), lalu ke `/setup` bila `requireSetup`;
  tanpa titipan ke login. Login yang dijawab `EMAIL_BELUM_TERVERIFIKASI`
  meminta kode baru lalu membuka isian kode. Sejak `efb05db` (B248, pilihan
  pemilik proyek 6 November 2026) password titipan ikut dikirim saat
  verifikasi dan bertahan saat kode salah; tanpa titipan kode tidak
  dikirim, dan halaman pindah ke login dengan pesan "Masuk lagi". Sejak
  12 November 2026 (opsi A dari tiga desain kanvas, pemilik proyek)
  keadaan tanpa titipan menampilkan isian "Password akun" (keterangan
  "Dipakai untuk masuk ke akun toko. Minimal 8 karakter, dengan huruf
  kapital dan angka.") dan "Ulangi password" di bawah kotak kode; password
  itu dikirim saat verifikasi lalu dipakai login, dan isiannya tidak
  dikosongkan saat kode salah. Tombolnya menjadi "Verifikasi dan masuk"
  di kedua keadaan. Tanpa `?email=` isian password tidak tampil dan kode
  tetap ditolak dengan pesan galat (pemilik proyek, 12 November 2026).
- **TP7a: halaman Langganan** (`2716f86`) di
  `/dashboard/outlet/pengaturan/langganan`, desain F: plan aktif dengan
  lencana masa percobaan, tanggal berakhir, sisa hari, dan bilah masa
  berlaku; perbandingan tiga plan dengan catatan PL5a; dan riwayat. Di
  bawah `sm` riwayat tampil sebagai daftar, karena tabel yang digeser di
  HP tampak terpotong. Kalimat kanvas "kasir tidak bisa membuka shift"
  tidak dipakai, karena perilakunya belum dipastikan di backend.
- **TP8a: pengingat masa langganan lewat lonceng topbar** (desain C,
  pemilik proyek 12 November 2026). Lonceng yang tadinya nonaktif menjadi
  pusat pemberitahuan (`features/notifikasi/lonceng-pemberitahuan.tsx`)
  di semua halaman dashboard: titik karamel (hampir habis, mulai tujuh
  hari sebelum akses berakhir) atau rose (masa tenggang sampai akun
  dibekukan cron), dan klik membuka panel "Pemberitahuan" beranimasi
  berisi judul, kalimat tanggal, bilah masa berlaku, dan "Lihat
  langganan". Di HP panel selebar layar dikurangi tepi. Datanya
  `GET /akun/langganan` sehingga hanya pemegang `read-langganan` yang
  mendapat pengingat; pengguna lain dan keadaan tanpa pengingat melihat
  "Belum ada pemberitahuan.". Logikanya `features/langganan/pengingat.ts`.

## Peta halaman web

| Halaman | Isi | Token | Menunggu |
|---|---|---|---|
| Daftar | Email dan password, lalu verifikasi email. Langkah 1 sudah ada di `/daftar` (`bb17c79`), belum ditautkan dari login akun Tersambung ke backend di `67ec690` (B231). | Publik | Tersambung (`67ec690`); ditautkan dari login akun di `4322dba` |
| Verifikasi email | Isian OTP dan kirim ulang. Tampilan pratinjau ada di `/daftar/verifikasi` (`6db571d`), belum ditautkan Tersambung di `67ec690` (B232). | Publik | Tersambung (`67ec690`) |
| Login akun | Email dan password; tautan daftar dan lupa password. Admin ke panel admin, akun belum terverifikasi ke verifikasi, setup belum selesai ke wizard. Tampilan desain A sudah ada (`e7fda09`); kedua tautan dipasang setelah halamannya berfungsi Sejak `67ec690`: `requireSetup` ke `/setup` (B223), belum terverifikasi ke isian kode (B232), dan tautan lupa password terpasang. | Publik | Tautan daftar terpasang di `4322dba` |
| Lupa password | Email, lalu OTP dan password baru. Tampilan pratinjau ada di `/lupa-password` (`6db571d`), belum ditautkan Tersambung dan ditautkan dari login akun di `67ec690` (B217). | Publik | Tersambung (`67ec690`) |
| Login pengguna | Nama dan PIN; lupa PIN Owner lewat OTP (B178); galat nonaktif 403 (B202) dan 429. Tampilan desain E sudah ada (`1f3b9e4`); nama toko belum tampil (butir 167) | Akun | Sudah tersedia; nama toko menunggu butir 167 |
| Wizard fase akun | Nama toko (`POST /tenant`), lalu Owner (`register-owner`, 409 bila sudah ada, B195). Tampilan pratinjau kedua fase wizard ada di `/setup` (`50c99ae`), belum ditautkan Tersambung di `41194b7`, dibuka dari login akun lewat `requireSetup`. | Akun | Tersambung (`41194b7`) |
| Wizard fase Owner | Lokasi outlet, kategori, bahan baku bila ada resep, produk, dan pajak; Advanced dan Pro: tipe aset, aset, tarif; Pro: gudang Tersambung di `41194b7`, dengan stok minimal produk (B237, B238). | Pengguna | Tersambung (`41194b7`) |
| Langganan | Plan, masa berlaku, perbandingan plan, riwayat, dan kontak admin lewat WhatsApp. Tampilan pratinjau ada di Pengaturan (`2716f86`), hanya Owner (LG2a) Sejak `c868870` datanya dari `GET /akun/langganan` dan bergerbang `read-langganan` (B229). | Pengguna | Tersambung (`c868870`) |
| Penyaringan per plan | Menu, halaman, dan tombol di luar plan atau yang setup fiturnya belum selesai Tersambung di `8d0f1dd` (PF1a sampai PF6a). | Pengguna | Tersambung (`8d0f1dd`) |
| Panel admin | Plan dan durasi saat membuat akun dan memperpanjang langganan Sejak `468a3bd` juga Ubah Plan, serta plan di daftar, detail, dan riwayat. | Akun admin | Tersambung (`475bf0b`, `468a3bd`) |

## Fakta backend

Dibaca dari `ridho` `128d0de` pada 1 November 2026:

- `requireSetup` di respons login akun hanya berarti belum punya toko
  (`akunService.js` baris 129).
- `createWithOwner` membuat toko, role Owner, akun kas, dan metode Tunai,
  tanpa pengguna Owner, lokasi, maupun pelanggan (`tenantService.js` baris
  236 sampai 344). `POST /tenant` dan `register-owner` memakai token akun;
  lokasi dan master data memakai token pengguna dan izin.
- `registerOwner` memberi `aksesType` bawaan app dan mewajibkan
  `installationId` bila ada akses app (`penggunaDeviceService.js` baris 109
  sampai 118); `aksesType` ditegakkan saat login (baris 289 sampai 290).
- Model akun tidak punya plan maupun penanda email terverifikasi; masa
  gratis `TRIAL_DAYS` bawaan 14 hari (`config/index.js` baris 139 sampai
  140). `paketMembership` adalah paket membership pelanggan, bukan plan.
- Belum ada lupa password akun; yang ada hanya pemulihan PIN Owner.
- Email OTP: transport bawaan `log` yang menulis kode ke log, produksi
  wajib Brevo (`config/index.js` baris 42 sampai 45 dan 147 sampai 149),
  dan `.env` development tidak berisi variabel email.
- Produk punya `stok`, `isUnlimitedStok`, dan `resep`, tanpa stok minimal
  (`produkModel.js` baris 38, 43, dan 73). Penjualan ditolak bila stok
  kurang (`inventoryService.js` baris 313 dan 322).
- Pajak per produk (`tipePajak` true) dan per transaksi (false), dengan
  hanya satu pajak per transaksi yang aktif (`pajakService.js` baris 121,
  140, dan 151 sampai 159); pajak di data toko tidak dipakai perhitungan
  (Y6).

Diuji langsung terhadap backend development pada 1 November 2026:

- Payload token akun berisi `id`, `role`, `version`, `tenantID`, `iat`,
  dan `exp`. `GET /tenant/:id` dengan token akun dijawab 403.
- `POST /akun/auth/register` menjawab 201 dengan data akun, tanpa token
  dan tanpa email; akunnya langsung aktif tanpa toko, dengan masa
  percobaan. Email dari layanan disposable ditolak.
- `registerLimiter` hanya dilewati bila `NODE_ENV` bernilai `test`, jadi
  di backend development batasnya tetap 10 pendaftaran per 15 menit per
  IP (`middleware/rateLimiters.js` baris 14 dan 44).

Diperbarui dari `nizar` `4759208` pada 4 November 2026:

- `requireSetup` di login akun berarti setup inti belum selesai, termasuk
  toko yang sudah ada, dan respons menambah `setup: { adaToko, inti,
  fitur }` (B223). Rincian langkah dari `GET /api/setup/status` bertoken
  akun (B220), sebelas langkah; `bahanBaku` tidak wajib selama tidak ada
  produk beresep, dan stok minimal belum menjadi kriteria sampai Y4.
- `register-owner` tanpa `installationId` membuat Owner ber-`aksesType`
  web dan app dengan token web di `accessToken` tingkat atas (B219).
- Akun punya `plan` dan `aksesBerakhirPada` (B212); akun lama dibaca
  Basic. Token pengguna dan respons `pin-login` memuat `langganan: {
  plan, aksesBerakhirPada }` (B214).
- Register selalu 201 dengan email tersamar, tanpa id (B231). Login
  pendaftar belum terverifikasi 403 `EMAIL_BELUM_TERVERIFIKASI` (B232).
- Pelanggan bawaan `Customer` (`isBawaan`) dibuat untuk setiap toko (B218).
  Halaman pelanggan web menyembunyikan hapus dan isian selain nama untuk
  pelanggan itu sejak `77d4380`.

## Pengujian OTP

- Mailpit berjalan di Docker: SMTP `localhost:1025` dan API HTTP
  `localhost:8025`. Backend non-produksi mengirim ke sana lewat transport
  `smtp` (N5), dengan batas OTP yang dilonggarkan lewat env.
- Spec memakai alamat unik per run, membaca email terbaru untuk alamat itu
  lewat API Mailpit, mengambil kode 6 digit, lalu mengetiknya di form.
- Spec ber-OTP: daftar, lupa password, reset PIN Owner, ubah email atau
  password akun, dan hapus akun. Akun uji `toko@gmail.com` tidak terdampak,
  karena akun buatan admin dianggap terverifikasi (AK2a).

## Utang terbuka

- Wizard: isian kategori, bahan baku, atau produk yang belum disimpan
  dengan tombol "Tambah ..." atau "Simpan produk" tidak ikut terkirim
  oleh "Simpan dan lanjut", dan galatnya hanya menyebut daftar kosong
  (ditemukan pemilik proyek, 5 November 2026). Diantrikan di
  `inti/status.md` (Pekerjaan berikutnya, Menunggu desain pemilik
  proyek): penanda tombol yang harus ditekan lebih dulu, dan pemandu UI
  setelah wizard selesai. Selesai di `58d7eb9` (penanda, PN1a) serta
  `c8a2e83` dan `5c3da45` (tur wizard dan dashboard, PN2a sampai PN4a).
- Nomor WhatsApp admin belum ditetapkan (LG1a); `NOMOR_WA_ADMIN` di
  `features/langganan/data.ts` masih kosong.
- Ajis diminta mendaftar layar aplikasi yang menyentuh pembuatan toko,
  pendaftaran Owner, dan `requireSetup`.
- Domain alamat uji ber-OTP perlu dicocokkan dengan validator email
  `register`, karena buat akun klien oleh admin menolak domain disposable
  (`kontrak/payload.md`).
- Nama toko dan email akun belum dapat ditampilkan di login pengguna,
  karena token akun tidak memuatnya dan `GET /tenant/:id` menolak token
  akun (`kontrak/temuan.md` butir 167, diserahkan ke Yoga).
- Tautan "Daftar" dan "Lupa password?" di login akun dipasang setelah N3,
  N4, dan Y1 tersedia; sampai itu `/daftar`, `/daftar/verifikasi`,
  `/lupa-password`, dan `/setup` hanya dapat dibuka langsung.
  "Lupa password?" terpasang di `67ec690`; "Daftar" menunggu wizard
  tersambung, karena daftar berakhir di `/setup`.
- Tombol "Buka aplikasi" di halaman setup selesai belum ada, karena
  aplikasi kasir belum rilis. Wajib ada saat aplikasi rilis: tombol
  membuka aplikasi lewat deep link, dan bila aplikasi belum terpasang
  mengarah ke halaman Play Store. Yang dibutuhkan dari Ajis: skema deep
  link atau Android App Links, serta nama paket atau tautan Play Store.
- Permission langganan belum ada di backend (LG2a). Usulan: permission
  baca langganan yang dimiliki Owner, diserahkan bersama N1; sampai itu
  web membatasi lewat role.
  Selesai di `c868870`: backend menyediakan `read-langganan` (B229), dan
  halaman serta kartunya bergerbang izin itu.
- Kuota `registerLimiter` di backend development (Fakta backend) membuat
  spec daftar dilewati bila spec auth diulang dalam 15 menit (`d94a48c`).
  Usulan: batasnya dapat dilonggarkan lewat env di backend non-produksi,
  seperti batas OTP di N5. Tersedia sebagai `REGISTER_LIMIT_MAX` (B230)
  dan disetel di perintah layanan uji (`inti/pengujian.md`).
- Halaman pratinjau disambungkan ke backend di chat berikutnya
  (`inti/status.md`, Pekerjaan berikutnya): data contoh dan spanduk
  pratinjau dibuang halaman demi halaman begitu endpoint-nya tersedia.
  Daftar, verifikasi email, dan lupa password tersambung di `67ec690`,
  dan Langganan di `c868870`; wizard masih pratinjau.
- Panel admin belum mengenal plan (B213), dan riwayat langganannya
  menampilkan aksi `ubah-plan` tanpa label (`inti/status.md`). Selesai di
  `475bf0b` dan `468a3bd`.
- Langkah jam buka (JB1a sampai JB7a) belum tersambung: tampilannya hanya
  di rute pratinjau `/setup/pratinjauJamBuka`, menunggu kontrak jam per
  hari dari backend (`kontrak/temuan.md` butir 176). Daftar periksa
  penyambungannya di `inti/status.md`.
- WS6a belum diterapkan: ringkasan tersimpan lokasi outlet, sesi booking,
  dan gudang masih bertautan (`kontrak/temuan.md` butir 175). Selesai di
  `daf9e3a`.
- Ruang gudang belum punya tur (PN4a). Menunya berbeda dari ruang outlet
  (Petugas Gudang, Pengaturan Gudang), sehingga titik dan teksnya
  diajukan ke pemilik proyek lebih dulu.
- Langkah jam buka belum punya tur, karena teksnya belum diusulkan; ikut
  penyambungannya (`inti/status.md`, Penyambungan langkah jam buka).
