# Pengujian

Sifat perubahan: **Sering**: baseline setiap modul; bagian lain bertambah saat ada pelajaran.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Baseline, kredensial uji, cara menelusuri kegagalan e2e, dan test yang
ditandai fixme atau dilewati. Baseline diperbarui setiap modul. Perintah
verifikasi, catatan Playwright, dan spec rujukan ada di
`referensi/playwright.md`; utang pengujian di `referensi/utang-pengujian.md`;
riwayat baseline dan utang yang lunas di `arsip/riwayat-pengujian.md`.

## Baseline

**Suite penuh per putaran 7 November 2026** (web `5c9ed69`, backend
`ridho` lokal `1584222`, pukul 15.59 sampai 16.37 WIB, reporter
`line,json`): e2e 585 lolos, 3 gagal, dan 1 skipped dari 589, sesuai
harapan hitungan 581 ditambah delapan skenario baru (hapus aset
ber-booking, periode mutasi, profil gagal dimuat, logout gagal, form
role gagal dimuat, hapus bahan berriwayat, dan dua kirim ulang kode).
Ketiga kegagalan skenario baru itu sendiri (locator aset, penunggu daftar
role, dan pemulihan sesi setelah pin-logout gagal), diperbaiki di
`af77b1f` dan dibuktikan spec terdampak `auth/sidebar-pengguna`,
`reservasi/aset/crud-aset`, dan `roles/crud-role` 38 lolos. Yang
dilewati skip bersyarat tanggal di `lihat-jurnal-stok.spec.ts` ("outlet:
periode dikirim sebagai tanggal YYYY-MM-DD, dan Reset Filter
mengembalikan bulan berjalan"); skip status staf dan skip HP Mesin Kasir
tidak terjadi. Vitest 1001 lolos (5 test baru `hitungSimulasi`, `584d6ae`).
Harapan suite penuh sesudahnya 588 lolos dan 1 skipped sampai tanggal 8
(hitungan).

**Baseline per penyambungan Mesin Kasir** (commit `b74f30a`, 7 November
2026): 996 test unit dan integrasi lolos, bertambah 13 dari 983: izin,
pesan, dan filter Mesin Kasir (11) serta tab Keuangan (2). Spec e2e
terdampak dijalankan lebih dulu, sebelum pemilik proyek menetapkan e2e
hanya dijalankan sebagai suite penuh di akhir putaran: spec baru
`tests/e2e/keuangan/mesin-kasir.spec.ts` 2 lolos, dan skenario alurnya
lolos lagi dengan `--repeat-each 2`. `pratinjau-mesin-kasir.spec.ts` (7
skenario) dihapus. Harapan suite penuh 581: 586 dikurangi 7 ditambah 2,
dengan skip bersyarat tanggal sampai tanggal 8, skip status staf bila
datanya kosong, dan skip HP Mesin Kasir bila riwayat tujuh hari
terakhir kosong (hitungan).

**Baseline per penanda dan panduan wizard** (commit `daf9e3a`, 7
November 2026): 983 test unit dan integrasi lolos, bertambah 18 dari
965: penanda (4, `58d7eb9`), catatan tur dan kotak sorotan (6,
`aa3c1c6`), titik tur wizard (5, `c8a2e83`), dan titik tur dashboard (3,
`5c3da45`). Suite e2e penuh tidak dijalankan atas permintaan pemilik
proyek (`referensi/utang-pengujian.md`). Spec terdampak:
`tests/e2e/setup` 20 lolos di `daf9e3a` (satu skenario penanda baru di
`setup.spec.ts`, dan spec baru `panduan.spec.ts` dengan 3 skenario), dan
bersama `tests/e2e/dashboard` 31 lolos dan 1 skipped di `5c3da45` (spec
baru `panduan-dashboard.spec.ts` dengan 2 skenario). Yang dilewati skip
bersyarat data "status staf memuat staf ruang outlet, dan lonceng
nonaktif", karena monitoring absensi tidak memuat staf ruang outlet.
Sejak `c8a2e83` `playwright.config.ts` mematikan tur otomatis untuk
semua spec lewat `storageState` (keputusan rancangan butir 32). Harapan
suite penuh 586: 580 ditambah enam skenario itu, dengan 585 lolos dan 1
skipped bersyarat tanggal sampai tanggal 8, ditambah skip status staf
bila datanya kosong (hitungan).

**Baseline per langkah jam buka** (commit `1386a30`, 7 November 2026):
965 test unit dan integrasi lolos, termasuk 21 test baru
`tests/unit/features/setup/jam-buka.test.ts` (`b48cfdb`). Suite e2e penuh
tidak dijalankan; spec terdampak `tests/e2e/setup` 16 lolos, termasuk spec
baru `pratinjau-jam-buka.spec.ts` (6 skenario). Harapan suite penuh 580:
574 ditambah enam skenario itu, dengan 579 lolos dan 1 skipped bersyarat
tanggal sampai tanggal 8 (hitungan).

**Baseline per tampilan Mesin Kasir** (commit `23d00f0`, 6 November
2026): 944 test unit dan integrasi lolos. Suite e2e penuh tidak
dijalankan sesudah `2f3cf51`. Spec terdampak: `tests/e2e/keuangan` 45
lolos tanpa skip sesudah `0178550`, termasuk spec baru
`tampilan-hp.spec.ts` (3 skenario, `b3f8698`) dan
`pratinjau-mesin-kasir.spec.ts` (7 skenario, `0178550`); bersama
`dashboard/dashboard-outlet.spec.ts` dan `pengaturan/langganan.spec.ts`
48 lolos di `b3f8698`, karena padding HP area gulir dashboard ikut
berubah. Harapan suite penuh 574: 564 ditambah sepuluh skenario itu,
dengan 573 lolos dan 1 skipped bersyarat tanggal sampai tanggal 8
(hitungan).

**Suite penuh per backend `ridho` lokal `1584222`** (web `2f3cf51`, 6
November 2026, pukul 15.52 sampai 16.21 WIB, reporter `line,json`): e2e
562 lolos, 1 gagal, dan 1 skipped dari 564, sesuai harapan hitungan 564.
Kegagalannya templat role (B258), diperbaiki di commit penyesuaian dan
dibuktikan `tests/e2e/roles` 7 lolos; vitest 928 lolos. Yang dilewati
skip bersyarat tanggal di `lihat-jurnal-stok.spec.ts` ("outlet: periode
dikirim sebagai tanggal YYYY-MM-DD, dan Reset Filter mengembalikan bulan
berjalan"; alasan "Awal bulan: tanggal uji 8 sampai 15 belum lewat").
Harapan suite penuh sesudahnya 563 lolos dan 1 skipped sampai tanggal 8
(hitungan).

**Baseline per B248 tanpa UI** (commit `efb05db`, 6 November 2026): 928
test unit dan integrasi lolos. Suite e2e penuh tidak dijalankan; spec
terdampak `tests/e2e/auth` 58 lolos tanpa skip terhadap backend `ridho`
`c031bde`, termasuk ketiga skenario B248 yang gagal di suite penuh 6
November 2026. Ketiganya gagal bila perubahan kode dicabut. Jumlah
skenario tetap; harapan suite penuh 564 lolos tanpa kegagalan B248
(hitungan).

**Baseline per utang pengujian 6 November 2026** (commit `e0d3bb4`):
927 test unit dan integrasi lolos. Suite e2e penuh tidak dijalankan
sesudah `a207fae`; spec terdampak: dashboard 10 lolos (`c6f9ec0`, tanggal
topbar lewat tengah malam), transfer stok 7 lolos (`bc49152`, harapan
kirim dan terima per arah), dan pelanggan 16 lolos (`e0d3bb4`, nama
kembar di daftar dan pemilih). Harapan suite penuh 564: 561 ditambah tiga
skenario itu, dengan tiga kegagalan B248 yang sama; angka itu hitungan.

**Suite penuh per backend `ridho` `c031bde`** (kode backend `nizar`
`4d221f5`, web `a207fae`, 6 November 2026, pukul 07.22 sampai 07.55
WIB): 926 test unit dan integrasi lolos; e2e 556 lolos, 3 gagal, dan 2
skipped dari 561. Totalnya 560 per hitungan stok minimal produk,
ditambah skenario B251 di spec langganan admin (`a207fae`). Ketiga
kegagalan karena B248, verifikasi email wajib `password` yang belum
dikirim web (`kontrak/temuan.md` butir 171), dibuktikan lewat pesan dan
snapshot DOM: `auth/daftar.spec.ts` pendaftaran berhasil (verifikasi
dijawab 400) dan login sebelum verifikasi ("Password baru wajib
diisi." lalu timeout), serta `auth/verifikasi-lupa-password.spec.ts`
kode salah (yang tampil pesan password, bukan pesan OTP salah). Ketiganya
tidak ditandai `test.fixme` dan lolos lagi bersama perbaikan B248. Judul
kedua skip tidak tercatat (reporter line); jumlahnya sama dengan suite
penuh `aa978cc`. Spec terdampak `a207fae` sebelumnya: `tests/e2e/admin`
22 lolos.

**Baseline per stok minimal produk** (commit `7d4c234`, 5 November
2026): 926 test unit dan integrasi lolos. Suite e2e penuh tidak
dijalankan sesudah `8d0f1dd`; spec terdampak: auth dan pengguna 76 lolos
(`9a85817`, termasuk B202), setup dan plan-fitur 10 lolos (`eacb5ed`,
termasuk B195), serta produk dan stok 37 lolos (`7d4c234`). Harapan suite
penuh 560: 557 ditambah tiga skenario itu; angka itu hitungan.

**Suite penuh per penyaringan per plan** (commit `8d0f1dd`, 5 November
2026, pukul 13.36 sampai 14.16 WIB): 925 test unit dan integrasi lolos;
e2e 554 lolos, 1 skipped, dan 2 gagal dari 557. Kegagalan pertama:
locator tautan `tes1@gmail.com` di spec langganan admin ikut cocok dengan
`tokotes1@gmail.com`, akun uji manual pemilik proyek; diperbaiki dengan
`exact: true` di `2d3344b` (spec admin 21 lolos). Kegagalan kedua:
"jam yang diubah kasir dikunci" di spec waktu penjualan, klik pilihan
produk mendapati elemen tidak stabil lalu terlepas dari DOM; lolos 12
dari 12 dengan `--repeat-each 3`, sehingga dinilai flaky. Judul skip
tidak tercatat. Totalnya 557: 554 per hitungan sebelumnya, ditambah tiga
skenario spec `tests/e2e/setup/plan-fitur.spec.ts`.

**Baseline per wizard setup tersambung** (commit `4322dba`, 5 November
2026): 920 test unit dan integrasi lolos. Suite e2e penuh tidak
dijalankan; spec setup ditulis ulang ke alur nyata (6 skenario, lolos 12
dari 2 kali ulang; skenario kategori wajib kemudian memakai akun Advanced
dan memeriksa delapan langkah tanpa gudang, lolos sendiri), dan spec auth
58 serta pengaturan lolos. Skenario `?plan=asing` dan unit test
`bacaPlan` ikut dibuang bersama `?plan=`. Harapan
suite penuh 554: 552 ditambah satu skenario setup (5 menjadi 6) dan
tautan Daftar; angka itu hitungan.

**Suite penuh per backend `ridho` lokal `aa978cc`** (di atas `d005d22`,
5 November 2026, pukul 11.48 sampai 12.10 WIB): 550 lolos dan 2 skipped
dari 552, tanpa kegagalan, sesuai harapan hitungan 552. Judul kedua skip
tidak tercatat (reporter line). Vitest tetap 900.

**Baseline per jenis mutasi selisih kas** (commit `d696354`, 5 November
2026): 900 test unit dan integrasi lolos. Suite e2e penuh tidak
dijalankan; spec terdampak `tests/e2e/keuangan` 35 lolos, termasuk
skenario baru filter selisih kas. Harapan suite penuh 552: 551 ditambah
skenario itu; angka itu hitungan.

**Baseline per pelanggan bawaan** (commit `77d4380`, 5 November 2026):
900 test unit dan integrasi lolos. Suite e2e penuh tidak dijalankan; spec
terdampak `tests/e2e/pelanggan` 14 lolos, termasuk skenario baru
pelanggan bawaan. Harapan suite penuh 551: 550 ditambah skenario itu;
angka itu hitungan.

**Baseline per plan di panel admin** (commit `468a3bd`, 5 November 2026):
898 test unit dan integrasi lolos. Suite e2e penuh tidak dijalankan; spec
terdampak `tests/e2e/admin` dan gerbang rute 23 lolos, termasuk skenario
baru plan B213 di spec langganan admin. Harapan suite penuh 550: 549
ditambah skenario itu; angka itu hitungan.

**Baseline per penyesuaian backend `ridho` lokal `4759208`** (commit
`c868870`, 4 November 2026): 892 test unit dan integrasi lolos di 102
berkas. Suite e2e penuh dijalankan sekali terhadap backend `4759208`
sebelum kode web diubah, pukul 09.41 sampai 10.13 WIB: 544 lolos, 2
skipped, dan 1 gagal dari 547. Kegagalannya skenario 409 di spec daftar
(B231), yang kemudian diubah; judul kedua skip tidak tercatat. Sesudahnya
suite penuh tidak dijalankan ulang atas perintah pemilik proyek. Spec
terdampak: spec auth (daftar, verifikasi-lupa-password, tampilan login
akun, login, validasi login) 44 lolos di `67ec690`, dan
`tests/e2e/pengaturan` bersama gerbang rute 42 lolos di `c868870`.
Harapan suite penuh 549: 547 ditambah satu skenario di spec daftar
(login sebelum verifikasi) dan satu di spec verifikasi-lupa-password
(lupa password sampai login); angka itu hitungan.

**Baseline per halaman Langganan** (commit `2716f86`, 3 November 2026):
886 test unit dan integrasi lolos. Suite e2e penuh tidak dijalankan; yang
dijalankan `tests/e2e/pengaturan` dan spec gerbang rute (41 lolos dan 1
gagal karena locator spec, lalu spec Langganan 4 lolos setelah
perbaikan). Harapan suite penuh 547: 543 pada suite penuh `6db571d`
ditambah 4 spec Langganan; angka itu hitungan.

**Suite penuh di atas `6db571d`** (verifikasi email dan lupa password):
878 test unit dan integrasi lolos; e2e 539 lolos, 1 skipped, dan 3 gagal
dari 543. Dua kegagalan adalah spec daftar yang dijawab 429 oleh
`registerLimiter` backend development, karena spec auth dijalankan
berulang dalam 15 menit; sejak `d94a48c` keduanya dilewati dengan alasan
tertulis bila dijawab 429 (Test yang ditandai fixme dan skip bersyarat, di
bawah). Kegagalan ketiga, "Batalkan kembali ke daftar" di spec buat
reservasi, lolos 8 dari 8 bila dijalankan sendiri
(`referensi/utang-pengujian.md`). Judul skenario yang dilewati tidak
tercatat.

**Suite penuh di atas `50c99ae`** (wizard setup): 870 test unit dan
integrasi lolos; e2e 536 lolos dan 2 skipped dari 538, tanpa kegagalan.
Salah satu yang dilewati adalah skip bersyarat jurnal stok; yang lain belum
diidentifikasi. Totalnya bertambah 5 dari 533 lewat spec wizard setup.

**Baseline per halaman login dan daftar** (commit `bb17c79`, 1 November
2026): 858 test unit dan integrasi lolos. Suite e2e penuh dijalankan di
atas `bb17c79`, pukul 16.12 sampai 16.34 WIB: 532 lolos dan 1 skipped,
tanpa kegagalan. Totalnya 533: 522 pada suite penuh untuk `005ebb7`,
ditambah spec tampilan login akun (3), tampilan login pengguna (3), dan
daftar (5). Berkurangnya dua test dari 524 ke 522 dan turunnya skipped
dari 10 belum ditelusuri. Satu-satunya yang dilewati adalah skip
bersyarat data di jurnal stok, karena data bulan berjalan masih kosong
pada tanggal 1.

**Baseline per penyesuaian backend `ridho` `0024eb9`** (commit `b69d39a`,
31 Oktober 2026): 855 test unit dan integrasi lolos. Suite e2e penuh
dijalankan di atas `b5a2578` terhadap backend `ridho` `0024eb9`, pukul
12.21 sampai 12.43 WIB: 514 lolos dan 10 skipped, tanpa kegagalan.
Totalnya 524, bertambah 7 dari 517 lewat skenario baru admin (id rusak
dan tidak ada, halaman berikutnya, dan akun tanpa batas), dashboard
(izin hari ini), dan kalender (penanda lokasi lain di kedua ruang).
Skipped turun dari 14 menjadi 10: ke-12 `test.fixme` dilepas, dan
bertambah 8 skip bersyarat data (empat jalur terkunci lintas outlet,
dua keterangan pemakaian bersama, halaman berikutnya daftar akun, dan
lebar HP Status Staf), di samping tab kritis gudang dan buat surat
jalan gagal. Sebelum kode web diubah, suite penuh terhadap backend baru
gagal 17 dari 517, seluruhnya cocok dengan perubahan backend
(`referensi/keputusan-penyesuaian-backend.md`). `b69d39a` sesudahnya
hanya menjalankan spec terdampaknya (pengguna dan dashboard 25 lolos
dengan 1 skipped).
Sesudah itu `1cd8211` menjalankan keempat skenario jalur terkunci lewat
pengguna uji tanpa izin lintas outlet, dan `7f6d623` membuang dua
skenario keterangan pemakaian bersama. Suite e2e kini berisi 522 test,
dengan harapan 518 lolos dan 4 skipped (tab kritis gudang, buat surat
jalan gagal, halaman berikutnya daftar akun, dan lebar HP Status Staf).
Angka itu hitungan, karena suite penuh belum dijalankan ulang
(`referensi/utang-pengujian.md`). Spec terdampaknya: stok, stock
adjustment, pengajuan stok, daftar penjualan, role, dan gerbang rute 64
lolos dengan 1 skipped (tab kritis gudang), dan `tests/e2e/jadwal` 50
lolos tanpa skip. Vitest tetap 855; `2a9a47b` hanya mengubah komentar.
Sesudahnya `e051906` menambah tiga test unit tab Keuangan (vitest 858
lolos di 98 berkas), dan `5ba2a42` menambah satu langkah di alur surat
jalan gudang, tanpa test baru; spec terdampak keuangan 34 lolos, transfer
stok 7 lolos, dan stock opname 16 lolos (`a611b59`).
Sesudah itu `28eedc1`, `6cdb61a`, `7ea8427`, dan `cd07ae1` membuat
keempat skip bersyarat data (tab kritis gudang, buat surat jalan gagal,
halaman berikutnya daftar akun, dan lebar HP Status Staf) menyiapkan
datanya sendiri, sehingga harapan suite penuh menjadi 522 lolos tanpa
skipped (hitungan). Spec terdampaknya lolos tanpa skip: stok dan
dashboard gudang 21; pengajuan, transfer, penerimaan, dan dashboard
gudang 37; admin 20; dashboard, jadwal, dan pengguna 76; serta auth,
profil, roles, dan pengaturan 92.

**Baseline per penyesuaian backend `ridho` `877e493`** (commit `c2a1e73`,
28 Oktober 2026): 838 test unit dan integrasi lolos. Suite e2e penuh
dijalankan terhadap backend `ridho` `877e493`, pukul 11.09 sampai 11.33
WIB: 503 lolos dan 14 skipped (12 `test.fixme` menunggu backend dan 2
skip bersyarat data), tanpa kegagalan. Totalnya 517, bertambah 8 dari
509 lewat skenario baru di spec stock adjustment, stock opname,
pengajuan stok, jurnal stok, dan spec baru daftar surat jalan
(`tests/e2e/inventaris/transferStok/daftar-surat-jalan.spec.ts`).
Sebelum penyesuaian, suite penuh di atas `5b8cbd9` terhadap backend
`b5b367a` dijalankan di jendela rawan, pukul 00.17 sampai 00.47 WIB: 495
lolos dan 14 skipped, tanpa kegagalan, sehingga utang suite penuh
`7a08b63` dan `5b8cbd9` lunas. Kedelapan commit penyesuaian
masing-masing menjalankan spec terdampaknya, lewat gerbang
ber-`pipefail` sejak `cab57a9` (`referensi/helper-dan-shell.md`,
Catatan shell).

**Baseline per pembelian stok dan audit pergantian hari** (commit
`5b8cbd9`, 26 Oktober 2026): 827 test unit dan integrasi lolos di 92
berkas. Suite e2e berisi 509 test. Suite penuh terakhir dijalankan di
`e073a9d`, pukul 01.42 sampai 02.06 WIB: 493 lolos dan 14 skipped (12
`test.fixme` menunggu backend dan 2 skip bersyarat data), tanpa
kegagalan. Sebelumnya di `6d07b8d` (00.53 sampai 01.18 WIB): 490 lolos
dan 14 skipped. Suite penuh pertama di jendela dini hari (00.11 sampai
00.35 WIB, di atas `1e4f042` dengan isi `e073a9d` yang belum di-commit)
gagal 1 dari 506 di spec pengeluaran, yang membuka audit pergantian
hari. Sesudah `e073a9d`, `7a08b63` menambah dua skenario penjualan dan
`5b8cbd9` tidak menambah e2e; keduanya hanya menjalankan spec terdampak
(dashboard, keuangan, pembelian stok, dan penjualan 77 lolos dengan 1
skipped; spec template role 18 lolos dengan 2 skipped), dan suite
penuhnya menjadi utang (`referensi/utang-pengujian.md`).

**Baseline per pengembalian Outlet ke Gudang** (commit `a505783`, 25
Oktober 2026): 755 test unit dan integrasi lolos di 86 berkas. Suite e2e
berisi 495 test di 72 berkas: 492 per `b03c276`, ditambah skenario
pengembalian di spec alur dan spec daftar pengajuan stok, serta
`alur-pengembalian.spec.ts`. Suite penuh tidak dijalankan ulang; spec
terdampak (pengajuan stok, surat jalan, penerimaan barang, dan dashboard
gudang) lolos 30 dengan 3 skipped dari 33. Catatan `a972956` di bawah
menulis spec pengajuan stok dan surat jalan lolos 25 dengan 3 skipped;
angka itu tidak dapat dicocokkan, karena kedua folder berisi 24 test,
26 bersama penerimaan barang, dan tidak ada spec yang berubah sesudahnya.

**Baseline per penyesuaian backend `ridho` `b5b367a`** (commit `b03c276`,
21 Oktober 2026): 721 test unit dan integrasi lolos di 86 berkas. Suite
e2e penuh dijalankan terhadap backend `ridho` `b5b367a`: 478 lolos dan
14 skipped, tanpa kegagalan, dalam 23,3 menit. Totalnya 492: 490 per
`d6f8ba0`, ditambah dua di spec jurnal stok (skenario pencarian
dibuang; alasan, periode, dan halaman berikutnya ditambahkan). Skip
bersyarat data yang di `d6f8ba0` belum teridentifikasi adalah "buat
surat jalan gagal" di spec alur pengajuan: tenant uji tidak punya
pengajuan APPROVED tanpa surat jalan. Sesudahnya `029413d` menambah
satu test unit (722); suite penuh tidak dijalankan ulang, dan spec
terdampaknya lolos 16 dengan 1 skipped. Sesudahnya `a972956` (label tab
berbahasa awam) menambah delapan test unit, sehingga vitest penuh
menjadi 730 lolos di 86 berkas; suite penuh tidak dijalankan ulang, dan
spec terdampaknya dicatat lolos 25 dengan 3 skipped untuk pengajuan
stok dan surat jalan, angka yang tidak dapat dicocokkan dengan isi spec
(paragraf di atas), serta dashboard gudang 4.

## Kredensial uji

- Akun: `toko@gmail.com` / `Toko1234`
- Pengguna: nama `Ridho`, PIN `123456` (berperan Owner)
- Frontend `localhost:3000`, backend `localhost:4000`
- Akun admin platform: tidak ditulis di sini (keputusan PA6a). Spec
  membacanya dari `E2E_ADMIN_EMAIL` dan `E2E_ADMIN_PASSWORD` di `.env.e2e`
  (akar repo, diabaikan git) atau dari variabel lingkungan, lewat
  `tests/helpers/admin-uji.ts`

## Menjalankan layanan uji

Frontend `npm run dev`, MongoDB dan Redis lokal. Backend dijalankan dengan
env inline, karena `.env` backend tidak diubah dari sisi frontend
(4 November 2026); dotenv backend tidak menimpa variabel yang sudah ada:

```bash
cd ~/Documents/backend-js && EMAIL_TRANSPORT=smtp SMTP_HOST=127.0.0.1 SMTP_PORT=1025 EMAIL_PENGIRIM=noreply@tachyon.test OTP_JEDA_KIRIM_DETIK=0 OTP_MAKS_KIRIM_HARIAN=1000 EMAIL_KUOTA_HARIAN=5000 REGISTER_LIMIT_MAX=1000 npm start
```

Mailpit menangkap email OTP (UJ1a): `docker start mailpit`, atau pertama
kali `docker run -d --name mailpit -p 127.0.0.1:1025:1025 -p
127.0.0.1:8025:8025 axllent/mailpit:v1.21`. Spec membaca kode lewat
`tests/helpers/mailpit-uji.ts`.

## Menelusuri kegagalan e2e

Jangan menebak selector. Ambil bukti:

```bash
npx playwright test tests/e2e/<modul> -g "<nama test>" --trace on --reporter=line > /dev/null 2>&1
T=$(find test-results -name trace.zip | head -1)
unzip -p "$T" '*.network' | T="$T" node -e '
const { execSync } = require("child_process");
const ambil = (sha) => execSync(`unzip -p "${process.env.T}" "resources/${sha}"`).toString();
for (const l of require("fs").readFileSync(0, "utf8").split("\n").filter(Boolean)) {
  let o; try { o = JSON.parse(l); } catch { continue; }
  const s = o.snapshot;
  if (!s || !/\/api\//.test(s.request.url)) continue;
  console.log(`${s.request.method} ${s.request.url.replace(/^.*\/api/, "/api")} -> ${s.response.status}`);
  const sha = s.response.content && s.response.content._sha1;
  if (s.response.status >= 400 && sha) console.log("  " + ambil(sha).slice(0, 200));
}'
```

Untuk melihat body yang dikirim, cetak juga `s.request.postData` (isinya di
`text`, atau di `_sha1` yang dibaca dengan `ambil`). Pada modul produk, cara ini
membuktikan PUT dikirim tanpa `resep`.

Snapshot DOM saat gagal ada di `error-context.md` di dalam folder test yang
gagal. Playwright memendekkan nama folder dan menambahkan hash, jadi berkas
sebuah test dicari lewat judulnya di isi berkas, bukan lewat pola nama
folder: `grep -l '<judul test>' $(find test-results -name error-context.md)`.
Potongan kode sumber spec ikut tercetak di berkas itu; saring baris berpola
`nomor |` bila hanya isi snapshot yang dibutuhkan.

## Urutan debug kegagalan e2e

Urutan ini terbukti paling cepat; melompatinya justru memperlama.

1. **Apakah request-nya terkirim?** Ambil trace jaringan lebih dulu. Ini
   memisahkan masalah UI dari masalah data, dan sering langsung menjawab.
2. **Bila tidak terkirim**: cari yang menghalangi, yaitu validasi form,
   tombol yang disabled, atau selector yang salah.
3. **Bila terkirim dan berhasil**: masalahnya di assertion atau di waktu.

Pola kegagalan yang berulang:

| Gejala | Penyebab yang paling sering |
|---|---|
| Timeout menunggu elemen | Selector tebakan; ambil teks sebenarnya dari kode komponen |
| Request tidak terkirim sama sekali | Validasi menahan submit, atau tombol disabled |
| Request berhasil tetapi UI tidak berubah | Balapan dengan pemuatan ulang daftar |
| Lolos sendirian, gagal saat diulang | Elemen yang sempat disabled, atau data menumpuk |
| Gagal beruntun setelah satu kegagalan | Data sisa dari test yang gagal sebelum cleanup; bersihkan dulu, atau pakai nama unik per run |
| Gagal tepat setelah perubahan kode, lalu hilang | Belum dapat dipastikan; jalankan `--repeat-each 5` sebelum menyimpulkan selesai |
| Halaman tertahan di loader | Kondisi pemuatan yang tidak pernah terpenuhi; periksa trace, apakah request yang ditunggu benar-benar terkirim |
| Klik habis waktu padahal tombol terlihat | Tombol `disabled` oleh validasi form, misalnya catatan wajib; baca kondisi `disabled` di kode sebelum mengubah spec |
| `response.json` gagal dengan `No resource with given identifier found` | Penunggu menangkap respons milik halaman sebelumnya yang sudah dibuang; pasang penunggu setelah `goto(..., { waitUntil: "commit" })` atau `reload(...)` yang sama |
| Skenario tulis `skipped` padahal kode tidak berubah | Dokumen aktif sisa run yang gagal menghalangi pembuatan (409). Baca pesan `POST` di trace (backend menyebut nomornya), lalu batalkan dokumen itu dari halaman detail |
| `net::ERR_NETWORK_IO_SUSPENDED` saat `page.goto` | Mesin menangguhkan jaringan (tidur atau hemat daya) di tengah suite; jalankan ulang test itu sendirian, lalu suite penuh diawali `systemd-inhibit --what=idle:sleep` |
| Surat jalan uji ditolak karena nomornya bentrok, sekali lalu hilang | Backend membentuk akhiran nomor dari empat digit terakhir `Date.now()` (`transferStokService.js` baris 148 sampai 150), dan setiap run spec transfer membuat surat jalan baru dari pengajuan uji yang sama (124 surat jalan untuk `PGJ/202608/0001` per 28 September 2026), sehingga peluang bentrok naik setiap run (`kontrak/temuan.md` butir 60; terjadi di suite penuh `074e98c` dan `0cfb3bd`). Jalankan ulang test itu sendirian, lalu suite penuh |
| `page.request` di `finally` habis waktu, sekali lalu hilang | Backend sesaat tidak menjawab; permintaan ini tidak melewati `page.route`, sehingga bukan akibat simulasi spec (suite penuh `074e98c`; juga `api()` di hapus tarif pada suite penuh terhadap backend `ridho` `7d28135`, lolos 9 dari 9 saat diulang). Jalankan ulang suite penuh sebelum mengubah spec |
| `waitForResponse` habis waktu setelah kembali ke halaman atau filter yang sudah pernah dimuat | Kunci query masih segar (`staleTime` 5 menit di `components/providers/query-provider.tsx`), sehingga tidak ada permintaan. Buktikan dari tampilan; penunggu jaringan hanya untuk kunci yang belum pernah dimuat (`b63cf08`) |
| Pembersihan tampak lolos, tetapi data uji menumpuk di basis data | Helper pembersihan membuang jawaban permintaannya. Periksa statusnya dengan `expect.soft`, dan jalankan audit endpoint: route yang dihapus backend juga menjawab 404 (`b5a55c4`) |
| `POST /pengajuanstok` ditolak 409 nomor kembar, menetap saat diulang | Backend membentuk nomor dari dokumen terakhir menurut `createdAt` (`kontrak/temuan.md` butir 139). Bandingkan `createdAt` dan waktu `_id` dokumen bernomor terbesar dengan jam sistem lewat skrip baca-saja; dokumen ber-`createdAt` di depan mengunci pembuatan sampai bulan berganti |
| Spec gagal hanya pada jam tertentu, berulang, juga di pohon kerja bersih | Cek `date` dan `date -u`, lalu bandingkan dengan `git stash -u`. Tanggal `YYYY-MM-DD` dibaca backend sebagai 00.00 UTC, sehingga tanggal hari ini ditolak antara 00.00 dan 07.00 WIB (`kontrak/temuan.md` butir 154) |
| Lolos sendirian, gagal saat dijalankan bersama spec lain | Test memilih baris pertama daftar, padahal spec yang berjalan lebih dulu membuat data dari jenis lain (berurutan menurut nama berkas, `workers: 1`). Pilih baris menurut data yang memenuhi syarat, lewat nomornya (`7f1de56`) |
| `strict mode violation` saat mengklik tombol yang hanya satu di halaman | Nama dicari sebagian dan tidak peka huruf besar: tombol paginasi "Next" ikut cocok dengan "Open Next.js Dev Tools" milik dev server. Pakai `exact: true` (`b03c276`) |

Contoh nyata: pada modul role, penghapusan tidak pernah terkirim karena
tombol hapus sempat disabled sampai daftar role selesai dimuat (level
pengguna diturunkan dari daftar itu). Tiga dugaan sebelumnya keliru, dan
satu di antaranya memperburuk keadaan. Trace jaringan menjawabnya dalam
satu putaran.

## Test yang ditandai fixme dan skip bersyarat

Menunggu perbaikan backend: tidak ada sejak penyesuaian backend `ridho`
`0024eb9`. Ke-12 `test.fixme` yang terhitung di baseline sebelumnya
dilepas pada 30 dan 31 Oktober 2026: sembilan skenario lintas outlet
(B142, `2eb668a`), shift dan pola roster yang dibuat di ruang outlet tidak
tampil di ruang gudang (B168, `8b5ad0f`), dan ubah pola roster (B128,
`ea2e752`). Kedua fixme shift dan pola roster itu tadinya bersyarat
konstanta lokasi; syaratnya dibuang di `7f6d623`.

Cara membuktikan sebuah fixme: lepas sementara, jalankan dua kali,
kembalikan berkasnya dengan `git checkout`, lalu lepas dan commit per test
yang lolos. Fixme berbadan kosong, fixme yang bersyarat konstanta frontend,
dan fixme yang hanya bermakna bila fixme lain lolos lebih dulu bukan
kandidat. Riwayat pelepasannya ada di `arsip/riwayat-pengujian.md`.

Selain itu ada `test.skip` bersyarat data, bukan penantian backend, yang ikut
terhitung di angka skipped pada baseline:

| Spec | Dilewati bila |
|---|---|
| `inventaris/stockOpname/alur-stok-opname*.spec.ts`, `draft-stok-opname.spec.ts` | Lokasi aktif outlet atau gudang terpilih masih punya opname DRAFT atau SUBMITTED; backend menjawab 409 (tidak terjadi pada data uji sekarang) |
| Dua puluh skenario di `tests/e2e/admin/` (sesi, akun klien, langganan, dan kelola akun) | `.env.e2e` tidak berisi kredensial admin uji (PA5a). Tidak terjadi di mesin pemilik proyek, sehingga tidak terhitung di baseline |
| Ketiga skenario `tests/e2e/setup/plan-fitur.spec.ts` | Sama: akun uji Basic, Advanced, dan Pro dibuat lewat API admin (`8d0f1dd`) |
| Kedelapan skenario `tests/e2e/setup/setup.spec.ts` dan ketiga skenario `tests/e2e/setup/panduan.spec.ts` | Sama: akun uji wizard dibuat dan dihapus lewat API admin (`41194b7`, `c8a2e83`). Sebelumnya spec pratinjau selalu berjalan |

Skenario lain di spec stok, stock adjustment, jurnal stok, stock opname, dan
hapus bahan baku juga dilewati bila datanya kosong. Pada data uji sekarang
itu hanya terjadi di jurnal stok pada tanggal 1, karena data bulan
berjalan masih kosong (baseline 1 November 2026). Skenario status staf
di `dashboard/dashboard-outlet.spec.ts` dilewati bila monitoring absensi
tidak memuat staf ruang outlet; terjadi di spec terdampak 7 November
2026. Skenario HP di `keuangan/mesin-kasir.spec.ts` dilewati bila
riwayat tujuh hari terakhir kosong; skenario alur di berkas yang sama,
yang berjalan lebih dulu, selalu meninggalkan satu sesi tertutup.

Tiga skenario pendaftaran di `auth/daftar.spec.ts` dilewati bila backend
menjawab 429 (`ALASAN_KUOTA`, `d94a48c`): batas `registerLimiter` 10 per
15 menit per IP berlaku kecuali backend dijalankan dengan
`REGISTER_LIMIT_MAX` lebih besar (B230; perintah di Menjalankan layanan
uji). Skenario ber-OTP di spec daftar dan verifikasi-lupa-password juga
dilewati bila Mailpit tidak menyala (`ALASAN_TANPA_MAILPIT`) atau
kredensial admin uji tidak ada, karena akunnya dibersihkan lewat API
admin. Ketiganya tidak terjadi bila layanan uji dijalankan seperti di
atas.

Ketiga spec tulis stock opname membuat dokumen baru di setiap run dan
menutupnya sebagai CANCELLED, sehingga dokumen CANCELLED bertambah tiga per
run suite penuh. Bila spec gagal di tengah, dokumennya tertinggal aktif dan
run berikutnya dilewati sampai dokumen itu dibatalkan dari halaman detail.
Nomornya dapat dibaca dari pesan `POST /api/stockopname` di trace (lihat
Urutan debug kegagalan e2e di atas).

## Utang pengujian

Utang pengujian yang masih terbuka ada di `referensi/utang-pengujian.md`,
dikirim bersama dokumen modul saat menulis atau mengubah spec modul itu
(`docs/README.md`, Dokumen yang dikirim per jenis pekerjaan). Utang yang
sudah lunas dan kejadian sesekali yang tidak berulang ada di
`arsip/riwayat-pengujian.md`.
