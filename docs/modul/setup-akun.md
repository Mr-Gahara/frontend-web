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
  meminta kode baru lalu membuka isian kode.
- **TP7a: halaman Langganan** (`2716f86`) di
  `/dashboard/outlet/pengaturan/langganan`, desain F: plan aktif dengan
  lencana masa percobaan, tanggal berakhir, sisa hari, dan bilah masa
  berlaku; perbandingan tiga plan dengan catatan PL5a; dan riwayat. Di
  bawah `sm` riwayat tampil sebagai daftar, karena tabel yang digeser di
  HP tampak terpotong. Kalimat kanvas "kasir tidak bisa membuka shift"
  tidak dipakai, karena perilakunya belum dipastikan di backend.

## Peta halaman web

| Halaman | Isi | Token | Menunggu |
|---|---|---|---|
| Daftar | Email dan password, lalu verifikasi email. Langkah 1 sudah ada di `/daftar` (`bb17c79`), belum ditautkan dari login akun Tersambung ke backend di `67ec690` (B231). | Publik | Tersambung (`67ec690`); tautan dari login menunggu wizard |
| Verifikasi email | Isian OTP dan kirim ulang. Tampilan pratinjau ada di `/daftar/verifikasi` (`6db571d`), belum ditautkan Tersambung di `67ec690` (B232). | Publik | Tersambung (`67ec690`) |
| Login akun | Email dan password; tautan daftar dan lupa password. Admin ke panel admin, akun belum terverifikasi ke verifikasi, setup belum selesai ke wizard. Tampilan desain A sudah ada (`e7fda09`); kedua tautan dipasang setelah halamannya berfungsi Sejak `67ec690`: `requireSetup` ke `/setup` (B223), belum terverifikasi ke isian kode (B232), dan tautan lupa password terpasang. | Publik | Tautan daftar menunggu wizard |
| Lupa password | Email, lalu OTP dan password baru. Tampilan pratinjau ada di `/lupa-password` (`6db571d`), belum ditautkan Tersambung dan ditautkan dari login akun di `67ec690` (B217). | Publik | Tersambung (`67ec690`) |
| Login pengguna | Nama dan PIN; lupa PIN Owner lewat OTP (B178); galat nonaktif 403 (B202) dan 429. Tampilan desain E sudah ada (`1f3b9e4`); nama toko belum tampil (butir 167) | Akun | Sudah tersedia; nama toko menunggu butir 167 |
| Wizard fase akun | Nama toko (`POST /tenant`), lalu Owner (`register-owner`, 409 bila sudah ada, B195). Tampilan pratinjau kedua fase wizard ada di `/setup` (`50c99ae`), belum ditautkan | Akun | Y3 tersedia (B219); penyambungan berikutnya |
| Wizard fase Owner | Lokasi outlet, kategori, bahan baku bila ada resep, produk, dan pajak; Advanced dan Pro: tipe aset, aset, tarif; Pro: gudang | Pengguna | Y1; stok minimal produk Y4 |
| Langganan | Plan, masa berlaku, perbandingan plan, riwayat, dan kontak admin lewat WhatsApp. Tampilan pratinjau ada di Pengaturan (`2716f86`), hanya Owner (LG2a) Sejak `c868870` datanya dari `GET /akun/langganan` dan bergerbang `read-langganan` (B229). | Pengguna | Tersambung (`c868870`) |
| Penyaringan per plan | Menu, halaman, dan tombol di luar plan atau yang setup fiturnya belum selesai | Pengguna | N1, N2, Y1 |
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
