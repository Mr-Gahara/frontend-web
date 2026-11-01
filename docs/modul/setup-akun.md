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

## Peta halaman web

| Halaman | Isi | Token | Menunggu |
|---|---|---|---|
| Daftar | Email dan password, lalu verifikasi email | Publik | N3 |
| Verifikasi email | Isian OTP dan kirim ulang | Publik | N3 |
| Login akun | Email dan password; tautan daftar dan lupa password. Admin ke panel admin, akun belum terverifikasi ke verifikasi, setup belum selesai ke wizard | Publik | N1, N3, Y1 |
| Lupa password | Email, lalu OTP dan password baru | Publik | N4 |
| Login pengguna | Nama dan PIN; lupa PIN Owner lewat OTP (B178); galat nonaktif 403 (B202) dan 429 | Akun | Sudah tersedia |
| Wizard fase akun | Nama toko (`POST /tenant`), lalu Owner (`register-owner`, 409 bila sudah ada, B195) | Akun | Y3 |
| Wizard fase Owner | Lokasi outlet, kategori, bahan baku bila ada resep, produk, dan pajak; Advanced dan Pro: tipe aset, aset, tarif; Pro: gudang | Pengguna | Y1 |
| Langganan | Plan, masa berlaku, dan tombol hubungi admin | Pengguna | N1 |
| Penyaringan per plan | Menu, halaman, dan tombol di luar plan atau yang setup fiturnya belum selesai | Pengguna | N1, N2, Y1 |
| Panel admin | Plan dan durasi saat membuat akun dan memperpanjang langganan | Akun admin | N1 |

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

- Kontak admin di halaman langganan (WhatsApp atau email) belum
  ditetapkan.
- Ajis diminta mendaftar layar aplikasi yang menyentuh pembuatan toko,
  pendaftaran Owner, dan `requireSetup`.
- Domain alamat uji ber-OTP perlu dicocokkan dengan validator email
  `register`, karena buat akun klien oleh admin menolak domain disposable
  (`kontrak/payload.md`).
- Varian desain login akun, login pengguna, dan daftar belum dibuat.