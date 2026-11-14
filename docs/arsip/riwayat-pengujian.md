# Riwayat Pengujian

Sifat perubahan: **Jarang**: hanya bertambah saat isi dipindah dari lapis lain.

Lapis arsip: kirim hanya bila riwayatnya dibutuhkan. Dibuat 25 Oktober 2026 dari `inti/pengujian.md` dan `referensi/playwright.md`.

Riwayat baseline, riwayat pelepasan fixme, utang pengujian yang lunas, dan
kejadian sesekali yang tidak berulang.

## Riwayat baseline

Dipindah dari `referensi/playwright.md` (Perintah verifikasi yang biasa dipakai) pada 25 Oktober 2026.

Rujukan bagian di dalamnya, seperti "di bawah" dan "(Utang pengujian)",
ditulis menurut letak lamanya di `referensi/playwright.md` dan
`inti/pengujian.md`.

Dipindah dari `inti/pengujian.md` pada 14 November 2026: baseline 21
Oktober sampai 12 November 2026, terbaru lebih dulu.

**Suite penuh per stok keluar di detail penjualan** (web `eece2e2`,
backend `ridho` lokal `d6709a1`, 12 November 2026, pukul 17.11 sampai
17.47 WIB, reporter `line,json`): e2e 630 lolos dan 2 gagal dari 632,
tanpa skip, sesuai harapan hitungan 632. Kedua kegagalan adalah skenario
jam di `penjualan/waktu-penjualan.spec.ts` (`page.clock`): pilihan produk
terus terlepas dari DOM saat diklik. Bukan regresi VD3a: spec itu lolos
4 dari 4 sendirian, folder `penjualan` 31 dari 31, dan saat diulang gagal
1 dari 84 run. Penyebabnya kemudian terbukti: pengembalian fokus Radix
lewat `setTimeout` yang dipalsukan `page.clock` menutup popover produk
(Urutan debug kegagalan e2e). Run ulang folder `penjualan` juga
menemukan race login ulang di `daftar-penjualan` RG4a (pemulihan sesi
Ridho menyalip login pengguna uji). Keduanya diperbaiki di helper uji dan
dibuktikan dengan spec sementara yang memicunya secara pasti (gagal
terhadap urutan lama, lolos terhadap yang baru). Spec terdampak: folder
`penjualan` 31 lolos, `waktu-penjualan` 20 dari 20 dengan
`--repeat-each 5`, dan ke-17 spec pemakai `masukSebagai` 117 lolos. Vitest
1068 lolos. Harapan suite penuh sesudahnya 632 lolos, ditambah skip
status staf bila datanya kosong (hitungan).

**Baseline per stok keluar di detail penjualan** (12 November 2026):
vitest 1068 lolos (6 unit test baru
`tests/unit/features/penjualan/stok-keluar.test.ts`). Spec baru
`penjualan/stok-keluar.spec.ts` (1 skenario: DRAFT, tersimpan, VOID, dan
HP 390 px tanpa meluber) lolos terhadap backend `ridho` lokal `d6709a1`.
Harapan suite penuh 632: 631 ditambah skenario itu (hitungan); suite
penuh menunggu izin pemilik proyek.

**Baseline per backend `ridho` lokal `d6709a1`** (12 November 2026):
vitest 1062 lolos (3 unit test baru
`tests/unit/features/jurnal-stok/tautan-penjualan.test.ts`). Spec terdampak
96 lolos tanpa skip terhadap backend baru: `tests/e2e/penjualan`,
`inventaris/jurnalStok`, `inventaris/pembelianStok`, `inventaris/stok`,
`inventaris/produk`, dan `inventaris/bahanBaku`. Skenario jurnal penjualan
di `alur-penjualan.spec.ts` kini lewat `?penjualanID=` dan membuktikan
B319, B320, serta tautan rincian (JS2a); helper lama menemukan 0 jurnal
terhadap backend baru. Skenario baru filter alasan Pembelian dan
Penjualan di `lihat-jurnal-stok.spec.ts`. Harapan suite penuh 631: 630
ditambah satu skenario itu (hitungan); suite penuh menunggu izin pemilik
proyek.

**Baseline per tanggal filter HP** (12 November 2026): vitest 1059 lolos,
tidak berubah. Spec baru `keuangan/tanggal-filter.spec.ts` (2 skenario, HP
390 px dan desktop 1280 px, enam rute dengan jam dipatok 30 September 2026)
lolos, dan gagal terhadap kode lama (HP: teks 182 px di tombol 141 px;
desktop: 182 px di 174 px). Spec terdampak 32 lolos: `tanggal-filter`,
`belanja-stok`, `mesin-kasir`, `inventaris/pembelianStok`, dan
`inventaris/jurnalStok`. Harapan suite penuh 630: 628 ditambah dua skenario
itu (hitungan); suite penuh menunggu izin pemilik proyek.

**Baseline per tombol Catat pembelian** (12 November 2026): vitest 1059
lolos (5 unit test baru
`tests/unit/features/pembelian-stok/ruang-catat-belanja.test.ts`). Spec
terdampak 21 lolos: `keuangan/belanja-stok.spec.ts` (skenario baru menu Ke
outlet dan Ke gudang pada akun Pro, dan tombol tersembunyi bagi pengguna
baca-saja), `setup/plan-fitur.spec.ts` (Basic: Pembelian Stok menu tunggal,
Suplai Gudang tidak tampil, dan tombol langsung ke form outlet),
`inventaris/pembelianStok`, dan `keuangan/tampilan-hp`. Harapan suite
penuh 628: 627 ditambah satu skenario itu (hitungan); suite penuh menunggu
izin pemilik proyek.

**Baseline per kebocoran cache antarakun** (12 November 2026): vitest
1054 lolos (6 unit test baru `tests/unit/lib/auth/pemilik-cache.test.ts`).
Spec baru `auth/cache-ganti-pengguna.spec.ts` (1 skenario: logout lalu
pengguna lain lewat UI tanpa `page.goto` meminta `/akunkas` sendiri) lolos,
dan gagal terhadap provider lama (0 permintaan). Reproduksi lintas akun
(`toko@gmail.com` lalu `tokotes1@gmail.com`) lewat skrip sekali pakai, karena
akun kedua adalah akun uji manual pemilik proyek. Spec terdampak sesi,
logout, profil, dan tampilan Keuangan lolos; `auth/ruang-lokasi-kerja`
sekali gagal di `beforeEach` (login PIN "Sesi telah berakhir atau
dihentikan"), lalu lolos sendirian, bersama spec sebelumnya, dan dengan
`--repeat-each 3`. Harapan suite penuh 627: 626 ditambah satu skenario itu
(hitungan); suite penuh menunggu izin pemilik proyek.

**Baseline per sub-menu Keuangan dan bug buat penjualan** (12 November
2026): vitest 1048 lolos (5 unit test tab dibuang, 7 unit test baru
`tests/unit/components/sidebar-menu-keuangan.test.ts`). Spec terdampak 39
lolos: `keuangan/tampilan-hp`, `arus-kas`, `belanja-stok`, dan
`mesin-kasir` (tab diganti sub-menu sidebar), `penjualan/alur-penjualan`,
`buat-penjualan`, dan `waktu-penjualan`, serta spec baru
`penjualan/tampilan-buat-penjualan.spec.ts` (2 skenario, 1024 dan 1280
px), yang gagal terhadap kode lama. Harapan suite penuh 626: 624 ditambah
dua skenario itu (hitungan); suite penuh menunggu izin pemilik proyek.

**Suite penuh per putaran 12 November 2026** (web `bb64b5c`, backend
`ridho` lokal `aeb6a52`, pukul 10.48 sampai 11.23 WIB, reporter
`line,json`): e2e 622 lolos dan 2 gagal dari 624, tanpa skip, sesuai
harapan hitungan 624. Skip bersyarat status staf tidak terjadi. Kedua
kegagalan di `pengaturan/langganan.spec.ts` (perbandingan tiga plan, dan
lebar HP): `response.json` "No resource with given identifier found",
karena lonceng topbar (TP8a, `0033479`) kini meminta `/akun/langganan` di
setiap halaman dashboard dan penunggu spec yang dipasang sebelum
`page.goto` menangkap respons halaman sebelumnya. Diperbaiki di spec:
penunggu dipasang setelah navigasi `commit`; spec terdampak 4 lolos, lalu
12 dari 12 dengan `--repeat-each 3`. Vitest 1046 lolos. Harapan suite
penuh sesudahnya 624 lolos, ditambah skip status staf bila datanya kosong
(hitungan).

**Baseline per halaman galat** (12 November 2026): vitest 1046 lolos (4
unit test baru `tests/unit/components/galat/halaman-galat.test.tsx`).
Spec terdampak 18 lolos: spec baru `galat/halaman-galat.spec.ts` (3
skenario: 404 di dalam dashboard pada lebar desktop dan HP, serta di luar
dashboard dengan tautan kembali), `auth/gerbang-rute.spec.ts`,
`inventaris/pembelianStok/catat-pembelian-stok.spec.ts`, dan
`keuangan/ubah-akun-kas.spec.ts` (403 tertanam; kalimat izin lama tetap
ada di teks 403). Harapan suite penuh 624: 621 ditambah tiga skenario
galat (hitungan); suite penuh menunggu izin pemilik proyek.

**Baseline per lonceng pemberitahuan** (12 November 2026): vitest 1042
lolos (4 unit test baru `tests/unit/features/langganan/pengingat.test.ts`).
Spec terdampak: spec baru `dashboard/lonceng-pemberitahuan.spec.ts` (2
skenario, desktop dan HP) bersama `dashboard/dashboard-outlet.spec.ts` 7
lolos dan 1 skipped (skip bersyarat status staf), dan
`dashboard/panduan-dashboard.spec.ts` 2 lolos setelah penanda topbarnya
memakai lonceng baru. Skenario status staf tidak lagi memeriksa lonceng
nonaktif. Harapan suite penuh 621: 619 ditambah dua skenario lonceng
(hitungan); suite penuh menunggu izin pemilik proyek.

**Baseline per logo toko** (12 November 2026): vitest 1038 lolos (3 unit
test baru `tests/unit/features/tenant/logo.test.ts`). Spec terdampak 13
lolos: spec baru `pengaturan/logo-toko.spec.ts` (5 skenario: unggah dan
hapus sampai sidebar, validasi klien, serta tata letak 1280, 768, dan
390 px) dan `pengaturan/profil-toko.spec.ts`, yang locator nama tokonya
dibatasi ke sidebar karena nama juga tampil di pratinjau struk. Harapan
suite penuh 619: 614 ditambah lima skenario logo (hitungan); suite penuh
menunggu izin pemilik proyek.

**Baseline per halaman arus kas** (12 November 2026): vitest 1035 lolos
(11 unit test baru `tests/unit/features/laporan/arus-kas.test.ts`). Spec
terdampak 13 lolos: spec baru `keuangan/arus-kas.spec.ts` (4 skenario,
termasuk unduhan PDF, Excel, dan CSV), `keuangan/mutasi-kas.spec.ts`, dan
`keuangan/tutup-akun-bersaldo.spec.ts` (judul "Laporan Mutasi Kas"). Suite
penuh menunggu izin pemilik proyek; harapannya 614: 608 ditambah dua
skenario verifikasi email (`4e141a0`) dan empat skenario arus kas
(hitungan).

**Suite penuh per putaran 10 November 2026 malam** (web `fa6b223`,
backend `ridho` `aeb6a52` dengan kode sama dengan `0bbd261`, pukul 19.31
sampai 20.04 WIB, reporter `line,json`): e2e 608 lolos dari 608, tanpa
kegagalan dan tanpa skip, sesuai harapan hitungan 604 ditambah skenario
merek saat `GET /akun/me` gagal (TP2b, `19498b7`) dan tiga skenario ruang
lokasi kerja (LK3a, `bce1362`, pengguna uji baru "E2E Lokasi Gudang").
Skip status staf tidak terjadi. Vitest 1022 lolos. Harapan suite penuh
sesudahnya 608 lolos, ditambah skip status staf bila datanya kosong
(hitungan).

**Suite penuh per backend `ridho` lokal `0bbd261`** (web `824517b`, 10
November 2026, pukul 18.00 sampai 18.37 WIB, reporter `line,json`): e2e
603 lolos dan 1 skipped dari 604, tanpa kegagalan, sesuai harapan
hitungan. Yang dilewati skip bersyarat data "status staf memuat staf
ruang outlet, dan lonceng nonaktif". Dijalankan setelah permission
diselaraskan (163 nama, Owner 160), migrasi `izinBarangInventory.js` dan
`hapusFieldUsang.js` diterapkan, dan `db:indeks`. Run pertama dihentikan
di tengah atas permintaan pemilik proyek untuk pemeriksaan manual, lalu
dijalankan ulang dari awal. Vitest 1014 lolos (unit test pesan kategori,
KG1a). Harapan suite penuh sesudahnya 604 lolos, ditambah skip status
staf bila datanya kosong (hitungan).

**Suite penuh per backend `ridho` lokal `e9112a8`** (web `d61bf7a`, 8
November 2026, pukul 21.25 sampai 22.10 WIB, reporter `line,json`): e2e
604 lolos dari 604, tanpa kegagalan dan tanpa skip, sesuai harapan
hitungan. Skip bersyarat status staf tidak terjadi. Penyesuaiannya tanpa
perubahan kode web, sehingga vitest tetap 1013. Harapan suite penuh
sesudahnya 604 lolos, ditambah skip status staf bila datanya kosong
(hitungan).

**Suite penuh per backend `ridho` lokal `916e7df`** (web `9bffc66`, 8
November 2026, pukul 12.18 sampai 12.52 WIB, reporter `line,json`): e2e
602 lolos, 1 gagal, dan 1 skipped dari 604, sesuai harapan hitungan 602
ditambah skenario saldo kurang (`b66a6eb`) dan lokasi kerja
(`4fe201b`). Kegagalannya "sesi diakhiri dan kembali ke /login saat
backend menjawab 403 dibekukan" di `auth/login.spec.ts`: trace
menunjukkan monitoring absensi panel Status Staf menyusul sekitar 300 ms
setelah dashboard outlet termuat, dijawab 403 oleh route spec, lalu
mengalihkan ke /login dan membatalkan `goto` produk (`net::ERR_ABORTED`;
gagal 2 dari 3 saat diulang). Diperbaiki di spec: route dipasang setelah
halaman produk termuat, lalu halaman dimuat ulang; lolos 8 dari 8 dengan
`--repeat-each 8`. Spec terdampak `tests/e2e/auth` 60 lolos dan 1 gagal:
skenario password salah berhenti oleh penjaga kuota login spec
("sisa kuota login toko@gmail.com menipis") setelah puluhan login
pengulangan tadi, bukan regresi; skenario itu lolos di suite penuh. Yang
dilewati skip bersyarat data "status staf memuat staf ruang outlet, dan
lonceng nonaktif" (monitoring tidak memuat staf ruang outlet); skip
bersyarat tanggal jurnal stok tidak terjadi lagi mulai tanggal 8. Vitest
1013 lolos. Harapan suite penuh sesudahnya 604 lolos, ditambah skip
status staf bila datanya kosong (hitungan).

**Suite penuh per backend `ridho` `d267f03`** (web `cbfa23b`, 7 November
2026, pukul 21.11 sampai 21.43 WIB, reporter `line,json`): e2e 598
lolos, 3 gagal, dan 1 skipped dari 602, sesuai harapan hitungan 589
ditambah B250 dan B255 (`778eb2d`) serta sebelas skenario pengguna uji
terbatas (`cbfa23b`). Ketiga kegagalan skenario baru itu sendiri (status
200 pemetaan mesin kasir, locator tab Mesin Kasir, dan pada peran
pembelian outlet: pengalihan `/dashboard`, izin layout ruang, serta
Keterangan wajib di form catat), diperbaiki di `4601d91`. Spec terdampak
(15 berkas pemakai helper peran uji) 110 lolos dan 1 gagal, yaitu
skenario pembelian outlet sebelum perbaikan izin layout dan Keterangan;
skenario itu lalu lolos 2 dari 2 dengan `--repeat-each 2`, dan sekali
lagi 2 dari 2 setelah ditambah tab Belanja Stok Keuangan. Yang dilewati
skip bersyarat tanggal di
`lihat-jurnal-stok.spec.ts`. Vitest 1002 lolos (unit test `aksiAkunKas`
buat, `cbfa23b`). Harapan suite penuh sesudahnya 602 lolos tanpa skip
mulai tanggal 8 (hitungan).

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

**Baseline per halaman pengeluaran** (commit `1d7fa7b`, 18 Oktober
2026): 678 test unit dan integrasi lolos di 83 berkas, bertambah 19 test
di dua berkas di `b2d84a6`. Suite penuh tidak dijalankan. Yang
dijalankan: `tests/e2e/pengaturan` dan spec gerbang rute (38 lolos di
`87fbf7a`), serta spec pengeluaran, kategori beban, dan gerbang rute (8
lolos di `1d7fa7b`). Spec pengeluaran berganti dari satu menjadi tiga
skenario, dan spec kategori beban menambah tiga, sehingga harapan suite
penuh menjadi 467 lolos dan 14 skipped; angka itu hitungan.

**Baseline per cakupan daftar penjualan** (commit `20c026b`, 18 Oktober
2026): 659 test unit dan integrasi lolos di 81 berkas, tidak berubah:
test `saringPenjualan` diganti test `paramLingkupPenjualan`. Suite penuh
tidak dijalankan; `tests/e2e/penjualan/daftar-penjualan.spec.ts` 4 lolos
dan 1 skipped (fixme lintas outlet). Dua skenario baru menambah harapan
suite penuh menjadi 462 lolos dan 14 skipped; angka itu hitungan.

**Baseline per tabel seragam K-E** (commit `eb81a1f`, 18 Oktober 2026):
659 test unit dan integrasi lolos di 81 berkas, tidak berubah. Suite e2e
penuh dijalankan terhadap backend `ridho` `00de455`: 461 lolos, 0 gagal,
0 flaky, dan 13 skipped, sama dengan harapan hitungan sejak K-B. Ketiga
belas skipped adalah dua belas fixme yang menunggu backend dan satu skip
bersyarat data (tab stok kritis gudang).

**Baseline per tabel seragam K-D** (commit `2177ac3`): 659 test unit dan
integrasi lolos di 81 berkas, tidak berubah. Suite penuh tidak
dijalankan; `tests/e2e/jadwal/shift` dan `tests/e2e/jadwal/pola-roster`
26 lolos dan 3 skipped (tiga fixme yang menunggu backend). Tidak ada test
baru, sehingga harapan suite penuh tetap 461 lolos dan 13 skipped.

**Baseline per tabel seragam K-B** (commit `753f61e`): 659 test unit dan
integrasi lolos di 81 berkas, tidak berubah. Suite penuh tidak
dijalankan; `tests/e2e/inventaris/stok` 14 lolos dan 3 skipped (dua
fixme lintas outlet, satu tab kritis gudang tanpa stok kritis). Dua
skenario galat baru menambah harapan suite penuh menjadi 461 lolos dan
13 skipped; angka itu hitungan.

**Baseline per tabel seragam K-C** (commit `6f9d3eb`): 659 test unit dan
integrasi lolos di 81 berkas, tidak berubah. Suite penuh tidak
dijalankan; spec `alur-transfer-stok` 2 lolos. Skenario galat baru di
spec itu menambah harapan suite penuh menjadi 459 lolos dan 13 skipped;
angka itu hitungan.

**Baseline per tabel seragam K-A** (commit `20e332f`): 659 test unit dan
integrasi lolos di 81 berkas, bertambah enam: tiga test integrasi
`DataTable` (`4677447`) dan tiga test `teksJumlahJurnal` (`9b06283`).
Suite penuh tidak dijalankan; spec terdampak lolos per commit (11 lolos
untuk mutasi kas dan bahan baku, 17 lolos dan 1 skipped untuk jurnal stok
dan ruang gudang, 6 lolos untuk mutasi kas, serta 13 lolos dan 2 skipped
untuk pengajuan stok). Dua skenario baru di spec jurnal stok menambah
harapan suite penuh menjadi 458 lolos dan 13 skipped; angka itu hitungan.

**Baseline per penyesuaian backend `ridho` `7d28135`** (commit
`cfaaa92`): 653 test unit dan integrasi lolos di 79 berkas, tidak
berubah. Suite penuh 16 Oktober 2026 pukul 22.02 terhadap `7d28135`,
sebelum perubahan web, menghasilkan 453 lolos, 1 gagal, dan 15 skipped.
Yang gagal habis waktu sesaat di hapus tarif (lolos 9 dari 9 saat diulang
bersama kembarannya), dan lewatan tambahan adalah test rincian pembayaran
mutasi kas yang bergantung pada urutan spec. Sesudah `f338c74` (test itu
menyiapkan datanya sendiri; `mutasi-kas.spec.ts` 12 lolos dalam dua
putaran) dan `cfaaa92` (fixme butir 143 dilepas; folder `bahanBaku` 5
lolos), harapan suite penuh 456 lolos dan 13 skipped; angka itu hitungan,
karena suite penuh tidak dijalankan ulang.

**Baseline per fase UI/UX 11 Oktober 2026** (commit `9cd22e1`): 653 test
unit dan integrasi lolos di 79 berkas, bertambah 19: dua belas test
lapisan data dashboard (`3812763`), serta enam test izin panel dan susunan
petak dan satu test label tanggal pendek (`0c5822b`). Suite penuh 11
Oktober 2026 pukul 19.44, atas pohon kerja yang memuat isi `584a2d8` dan
`93490bb` sebelum keduanya di-commit, menghasilkan 455 lolos, 0 gagal,
dan 14 skipped: 451 dan 14 dari harapan sebelumnya, ditambah empat
skenario dashboard outlet. Sesudah itu suite penuh tidak dijalankan
ulang. Spec terdampak tiap commit lolos (155 lolos dan 3 skipped untuk
halaman pemakai tabel, 7 lolos untuk mutasi dan tutup akun bersaldo,
serta 4 lolos dan 1 skipped untuk bahan baku), dan jumlah skenarionya
tidak berubah, sehingga harapan suite penuh tetap 455 lolos dan 14
skipped.

**Baseline per penyesuaian backend `ridho` `2dd57aa`** (commit
`43f09af`): 634 test unit dan integrasi lolos di 77 berkas, bertambah
tiga (dua test gate stock adjustment di `f61e146`, dan satu test
`relasiNonaktif` di `ed4bfd3`). Suite penuh 11 Oktober 2026 pukul 14.55,
sebelum perubahan web, menghasilkan 448 lolos, 0 gagal, dan 15 skipped,
tetapi skenario hapus bahan baku di dalamnya lolos tanpa bahannya
terhapus (Utang pengujian). Suite penuh kedua pada hari yang sama, atas
isi `ed4bfd3`, menghasilkan 450 lolos, 1 gagal, dan 13 skipped; jumlah
skenarionya sesuai hitungan 451 dan 13: dua `test.fixme` jurnal dilepas
(`936f073`), dan satu skenario pajak nonaktif ditambahkan (`ed4bfd3`).
Yang gagal skenario hapus bahan baku, karena backend menolak hapus bahan
yang punya entri stok (`kontrak/temuan.md` butir 143). Setelah `43f09af`
harapan suite penuh 451 lolos dan 14 skipped; angka itu hitungan, karena
suite penuh tidak dijalankan ulang, dan folder `bahanBaku` lolos 4
dengan 1 skipped.

**Baseline per penyesuaian backend `yoga` `55328f1`** (commit `f64b518`):
631 test unit dan integrasi lolos di 77 berkas, bertambah dua test satuan
resep; `50e6485` tidak mengubah jumlah. Suite penuh 8 Oktober 2026
terhadap backend `ridho` `8dc6211` menghasilkan 448 lolos, 0 gagal, dan
15 skipped, sesuai hitungan: bertambah satu skenario resep bersatuan pak
(`f64b518`). Suite itu dijalankan atas isi `f64b518` sebelum di-commit.

**Baseline per penyesuaian backend `nizar` `8dc6211`** (commit
`5b92d14`): 629 test unit dan integrasi lolos di 77 berkas: `fe9631f`
menambah empat test tampilan pelanggan, dan `1bb26c0` membuang dua test
`isianTidakTerkosongkan`. Suite penuh 8 Oktober 2026 terhadap backend
lokal `ridho` `8dc6211` (fast-forward ke `origin/nizar`) menghasilkan 447
lolos, 0 gagal, dan 15 skipped, sesuai hitungan: dua skenario pemilih
pelanggan (`fe9631f`), satu `test.fixme` yang dilepas (`1bb26c0`), dan
skenario kembar yang diganti satu banding satu (`5b92d14`).

**Baseline per penyesuaian backend `nizar`** (commit `729c16a`): 627
test unit dan integrasi lolos di 76 berkas, bertambah tujuh (tiga test
baris mutasi, dua test filter periode transfer, dan dua test izin sesi
booking). Suite penuh 7 Oktober 2026 terhadap cabang uji lokal
`uji-yoga-nizar` `54f787b` menghasilkan 440 lolos, 4 gagal, dan 16
skipped. Hitungannya sesuai harapan 444 dan 16: empat skenario baru
(metode aktif terakhir, baris pembayaran di mutasi, filter periode
Pindah Dana, dan tandai selesai). Keempat yang gagal berhenti di
`POST /pengajuanstok` yang dijawab 409 nomor kembar
(`kontrak/temuan.md` butir 139), bukan dari kode yang diubah. Setelah
`createdAt` tiga pengajuan development digeser, folder
`penerimaanBarang`, `transferStok`, dan `pengajuanStok` lolos 17 dan 2
skipped; suite penuh tidak dijalankan ulang terhadap cabang uji itu.
Suite penuh berikutnya, 8 Oktober 2026 terhadap backend `ridho`
`92d4f27` (gabungan `yoga` `55328f1` dan `nizar` `9d45efc`),
menghasilkan 444 lolos, 0 gagal, dan 16 skipped.

**Baseline per form role** (commit `597a163`): 620 test unit dan
integrasi lolos di 73 berkas, bertambah 16 test di
`tests/unit/features/role/form-role.test.ts`. `597a163` menambah dua
skenario di `tests/e2e/roles/crud-role.spec.ts`, sehingga harapan suite
penuh 440 lolos dan 16 skipped; angka itu hitungan, karena suite penuh
tidak dijalankan. Yang dijalankan terhadap backend lokal `yoga`
`fc29433`: `tests/e2e/roles`, 7 lolos.

**Baseline per utang kecil gerbang rute** (commit `dc0af1c`): 604 test
unit dan integrasi lolos di 72 berkas, bertambah satu test nama izin
unik di `tests/unit/lib/auth/permissions.test.ts`. Jumlah skenario e2e
tidak berubah, sehingga harapan suite penuh tetap 438 lolos dan 16
skipped; angka itu hitungan, karena suite penuh tidak dijalankan. Yang
dijalankan terhadap backend lokal `yoga` `fc29433`: spec ubah akun kas,
Pindah Dana, `tests/e2e/pelanggan`, kelola diskon,
`tests/e2e/pengaturan`, `tests/e2e/inventaris/transferStok`,
`tests/e2e/inventaris/pengajuanStok`, `tests/e2e/gudang`, dan
`tests/e2e/auth`, 121 lolos dan 3 skipped (tiga `test.fixme` lama).

**Baseline per gerbang rute** (commit `bc388c6`): 603 test unit dan
integrasi lolos di 72 berkas, bertambah sepuluh test di
`tests/unit/lib/auth/gerbang-rute.test.ts`. Suite penuh yang tertunda
sejak `628f52e` dijalankan 5 Oktober 2026 terhadap backend lokal `yoga`
`fc29433`, sebelum perubahan: 436 lolos dan 16 skipped, sesuai hitungan
di bawah. `bc388c6` menambah dua skenario,
`tests/e2e/auth/gerbang-rute.spec.ts`, sehingga harapan suite penuh 438
lolos dan 16 skipped. Angka itu hitungan: suite penuh tidak dijalankan
ulang, atas keputusan pemilik proyek (6 Oktober 2026). Yang dijalankan
setelah perubahan: `tests/e2e/auth`, `tests/e2e/pengaturan`,
`tests/e2e/roles`, dan `tests/e2e/profil`, 83 lolos; spec gerbang rute,
2 lolos; serta spec buat penjualan, `tests/e2e/inventaris/stockOpname`,
`tests/e2e/reservasi/tarif`, dan `tests/e2e/gudang`, 60 lolos dan 2
skipped (dua `test.fixme` lama).

**Baseline per `useAuthGuard()` berulang** (commit `628f52e`): 593 test
unit dan integrasi lolos di 71 berkas, tidak berubah. `628f52e` menambah
empat skenario, `tests/e2e/auth/guard-dashboard.spec.ts`, sehingga
harapan suite penuh 436 lolos dan 16 skipped. Angka itu hitungan, yaitu
harapan 432 dan 16 di bawah ditambah empat: suite penuh tidak
dijalankan, atas keputusan pemilik proyek (5 Oktober 2026), dan menjadi
langkah pertama pekerjaan berikutnya. Yang dijalankan terhadap backend
lokal `yoga` `fc29433`: `tests/e2e/auth`, `tests/e2e/roles`,
`tests/e2e/inventaris/kategori`, `tests/e2e/inventaris/stockAdjustment`,
`tests/e2e/reservasi/tarif`, dan spec Pindah Dana, 98 lolos dan 2
skipped (dua `test.fixme` lintas outlet).

**Baseline per penyesuaian backend `fc29433`** (commit `b887278`): 593
test unit dan integrasi lolos di 71 berkas, bertambah empat belas (enam
test izin pajak dan delapan test satuan resep). Suite penuh 4 Oktober
2026 terhadap backend lokal `yoga` `fc29433` menghasilkan 431 lolos, 1
gagal, dan 16 skipped. Hitungannya sesuai harapan 432 dan 16:
`test.fixme` butir 37 dilepas dan lolos, dan satu skenario satuan resep
ditambahkan. Yang gagal login di `beforeEach` spec tipe aset, tidak
terkait perubahan (Utang pengujian); spec itu lolos 25 saat dijalankan
terpisah pada 5 Oktober 2026.

**Baseline per utang kecil yang tidak menunggu backend** (commit
`9195472`): 579 test unit dan integrasi lolos di 69 berkas, tidak
berubah. Suite penuh 4 Oktober 2026 terhadap backend lokal `yoga`
`50eede7` menghasilkan 430 lolos dan 17 skipped tanpa kegagalan,
bertambah empat skenario dari `eb0181f` (tiga di
`tests/e2e/inventaris/stockOpname/ruang-dan-pic.spec.ts` dan satu di
`tests/e2e/inventaris/stok/memuat-stok.spec.ts`), dalam sekitar 21 menit.

**Baseline per error ESLint warisan** (commit `f5fe574`): 579 test unit
dan integrasi lolos di 69 berkas: `039ead4` menambah dua test
`useSudahHidrasi`, dan `f5fe574` empat test `nilaiAwalRole`; `4f19e77`
tidak mengubah jumlah. Suite penuh 4 Oktober 2026 terhadap backend lokal
`yoga` `50eede7` menghasilkan 426 lolos dan 17 skipped tanpa kegagalan,
bertambah satu skenario di spec role (`f5fe574`), dalam sekitar 23 menit.

**Baseline per penyatuan pemformat rupiah** (commit `006d7f8`): 573
test unit dan integrasi lolos di 67 berkas, tidak berubah. Suite penuh
4 Oktober 2026 terhadap backend lokal `yoga` `50eede7` menghasilkan 425
lolos dan 17 skipped tanpa kegagalan, dalam sekitar 27 menit. Itu run
penuh pertama yang bersih sejak `e53c016`, dan mencakup seluruh commit
kode hari itu (`7fce871` sampai `006d7f8`).

**Baseline per utang kecil modul produk dan pemformat rupiah** (commit
`4c9c4ed`): 573 test unit dan integrasi lolos di 67 berkas, bertambah
satu test pecahan di `tests/unit/lib/format.test.ts`. Suite penuh
4 Oktober 2026 setelah `152088b`, terhadap backend lokal `yoga`
`50eede7`, menghasilkan 424 lolos, 1 gagal, dan 17 skipped dalam sekitar
22 menit; `152088b` menambah satu skenario hapus gagal di spec produk.
Yang gagal adalah skenario ringkasan periode di
`tests/e2e/keuangan/mutasi-kas.spec.ts` (MK2a): kartu menampilkan
pecahan, sedangkan harapan spec, yang dihitung di Node, dibulatkan
(keputusan rancangan butir 24). Setelah `4c9c4ed` skenario itu lolos
bersama spec keuangan dan tutup akun bersaldo (17 lolos), tetapi suite
penuh tidak dijalankan ulang, atas keputusan pemilik proyek. Harapan run
berikutnya 425 lolos dan 17 skipped.

**Baseline per utang kecil keuangan** (commit `f7805ca`): 572 test unit
dan integrasi lolos di 67 berkas, tidak berubah. `f7805ca` menambah satu
skenario, `tests/e2e/keuangan/tutup-akun-bersaldo.spec.ts`, sehingga
harapan suite penuh 424 lolos dan 17 skipped. Angka itu hitungan: suite
penuh belum dijalankan sejak `e53c016`, atas keputusan pemilik proyek
(4 Oktober 2026), dan dijalankan di akhir pekerjaan berikutnya. Yang
dijalankan: spec ubah akun kas, Pindah Dana, dan alur baru, 9 lolos dua
kali berturut-turut, terhadap backend lokal `yoga` `50eede7`. Ketiganya
mengirim 22 tulisan ke `/akunkas` dan enam ke `/jurnaltransfer` per
putaran, sehingga tidak diulang beruntun dalam satu menit.

**Baseline per penundaan pengeluaran dan butir 33** (commit `03c4eb3`):
572 test unit dan integrasi lolos di 67 berkas, tidak berubah: test unit
`saringTransfer` dan `filterServerTransfer` ditulis ulang tanpa menambah
jumlah. `7fce871` menambah satu skenario,
`tests/e2e/keuangan/pengeluaran.spec.ts`, sehingga harapan suite penuh
423 lolos dan 17 skipped. Suite penuh tidak dijalankan untuk kedua commit
(PF6a); yang dijalankan spec pengeluaran (1 lolos) serta folder
`transferStok` dan `penerimaanBarang` (4 lolos), terhadap backend lokal
`yoga` `50eede7`.

**Baseline per pekerjaan Pindah Dana** (commit `e53c016`): 572 test unit
dan integrasi lolos di 67 berkas, bertambah 16 test dari
`tests/unit/features/jurnal-transfer/jurnal-transfer.test.ts`. Suite
penuh 4 Oktober 2026 terhadap backend lokal `yoga` `50eede7` menghasilkan
422 lolos dan 17 skipped tanpa kegagalan, bertambah dua skenario
`tests/e2e/keuangan/pindah-dana.spec.ts`, dalam sekitar 20 menit.
Template role (`e053a67`) tidak mengubah jumlah test. Pembatas tulis
`/jurnaltransfer` (30 per menit per pengguna) berkunci sendiri, terpisah
dari `/akunkas`; satu putaran spec Pindah Dana mengirim dua tulisan ke
`/jurnaltransfer` dan empat ke `/akunkas`.

**Baseline per pekerjaan ubah akun kas** (commit `1bc76f4`): 556 test
unit dan integrasi lolos di 66 berkas, bertambah 11 test dari
`tests/unit/features/akun-kas/ubah.test.ts`. Suite penuh 3 Oktober 2026
terhadap backend lokal `yoga` `50eede7` menghasilkan 420 lolos dan 17
skipped tanpa kegagalan, bertambah enam skenario
`tests/e2e/keuangan/ubah-akun-kas.spec.ts`. Spec yang menulis ke
`/akunkas` tidak boleh diulang beruntun: route itu membatasi tambah dan
ubah 30 permintaan per menit per pengguna (dilewati hanya bila backend
berjalan dengan `NODE_ENV=test`), dan satu putaran spec ubah mengirim 15
tulisan. `--repeat-each 3` tanpa jeda menghasilkan 13 lolos dan 5 gagal
karena 429; tiga putaran berjeda 65 detik lolos 6 dari 6.

**Baseline per pekerjaan mutasi arus kas dan akun kas** (commit
`6a57d12`): 545 test unit dan integrasi lolos di 65 berkas. Mutasi
(`e129f9d`) menambah 13 test unit dan lima skenario serta membuang
skenario KU1a; akun kas (`6a57d12`) menambah 2 test unit dan mengganti
satu skenario. Harapan suite penuh karena itu 414 lolos dan 17 skipped.
Run suite penuh 3 Oktober 2026 terhadap backend lokal `yoga` `50eede7`
menghasilkan 413 lolos, 1 gagal, dan 17 skipped: `POST /aset` saat
menyiapkan data spec aset dijawab backend 500 "Connection operation
buffering timed out after 10000ms". Spec aset lalu lolos 50 dari 50
dengan `--repeat-each 2`, sehingga kegagalan itu dicatat sebagai gangguan
sesaat koneksi basis data backend, bukan sebagai 414 lolos.

**Baseline per modul panel admin** (commit `c824f18`): 530 test unit dan
integrasi lolos di 63 berkas, 410 e2e lolos, 17 skipped (sama dengan
baseline pelanggan di bawah). Dari baseline profil, fondasi (`0f54b3c`)
menambah 15 test unit dan lima skenario (398); daftar dan buat akun
(`4e2a254`) menambah 18 test unit dan lima skenario (403); langganan
(`10c7efb`) menambah 12 test unit dan empat skenario (407); dan ubah serta
hapus (`c824f18`) menambah 12 test unit dan tiga skenario (410). Suite
penuh dijalankan sekali di akhir modul (PF6a), terhadap backend lokal
`yoga` `50eede7`. Angka ini berlaku bila `.env.e2e` berisi kredensial
admin uji. Tanpa berkas itu 16 skenario admin dilewati (spec admin: 1
lolos dan 16 skipped, terukur), sehingga suite penuh menjadi 394 lolos dan
33 skipped (dihitung, belum dijalankan penuh).

**Baseline per modul Profil, login, dan sidebar** (commit `57a7084`): 473
test unit dan integrasi lolos di 59 berkas, 393 e2e lolos, 17 skipped (sama
dengan baseline pelanggan di bawah). Dari baseline diskon, spec pembanding
profil (`0ed0e9a`) menambah lima skenario (383); migrasi profil (`091be4e`)
menambah 16 test unit dan lima skenario (388); login (`1c13ee6`) menambah
9 test unit dan dua skenario (390); dan sidebar (`57a7084`) menambah tiga
skenario (393). Suite penuh dijalankan sekali di akhir modul (PF6a).
Diukur terhadap backend lokal `yoga` `50eede7`.

**Baseline per submodul diskon** (commit `52c550e`): 448 test unit dan
integrasi lolos di 56 berkas, 378 e2e lolos, 17 skipped (sama dengan
baseline pelanggan di bawah). Dari baseline pelanggan, spec pembanding
diskon (`8cb6f31`) menambah empat skenario (370); migrasi halaman
(`1e05df6`) menambah 14 test unit dan lima skenario (375); form aturan
(`54f2938`) menambah 12 test unit dan dua skenario (377); dan pilihan
kasir (`52c550e`) menambah tiga test unit dan satu skenario (378). Diukur
terhadap backend lokal `yoga` `50eede7`.

**Baseline per submodul pelanggan** (commit `d9365d3`): 419 test unit dan
integrasi lolos di 53 berkas, 366 e2e lolos, 17 skipped: 16 seperti
baseline `465b438` di bawah, ditambah satu `test.fixme` pengosongan nomor
HP pelanggan. Dari baseline profil outlet, spec pembanding pelanggan
(`b6de75c`) menambah empat skenario (360), dan migrasinya (`d9365d3`)
menambah 12 test unit, enam skenario lolos, dan satu `test.fixme` (366).
Diukur terhadap backend lokal `yoga` `50eede7`.

**Baseline per submodul profil outlet** (commit `fcf2dd2`): 407 test unit
dan integrasi lolos di 52 berkas, 356 e2e lolos, 16 skipped (sama dengan
baseline `465b438` di bawah). Dari baseline `yoga`, perbaikan sidebar
(`ca6eb3d`) menambah satu skenario (349), dan profil toko (`fcf2dd2`)
menambah 8 test unit dan tujuh skenario (356). Diukur terhadap backend
lokal `yoga` `50eede7`.

**Baseline per penyesuaian backend `yoga`** (commit `a4304ce`): 399 test
unit dan integrasi lolos di 51 berkas, 348 e2e lolos, 16 skipped (sama
dengan baseline `465b438` di bawah). Fixture stok penjualan (`65edf8c`)
tidak mengubah jumlah; penyesuaian `a4304ce` menambah 8 test unit dan
satu skenario urutan di spec daftar penjualan. Diukur terhadap backend
lokal `yoga` `50eede7`, setelah permission basis data ditinjau sama
dengan seed.

**Baseline per PO11a** (commit `366e9b7`): 391 test unit dan integrasi
lolos di 49 berkas, 347 e2e lolos, 16 skipped (sama dengan baseline
`465b438` di bawah). Skenario template di spec role menambah satu
skenario. Diukur terhadap backend lokal `465b438`, setelah permission
basis data diselaraskan dengan seed (`inti/backend.md`).

**Baseline per submodul pajak** (commit `b84de56`): 391 test unit dan
integrasi lolos di 49 berkas, 346 e2e lolos, 16 skipped (sama dengan
baseline `465b438` di bawah). Dari baseline metode pembayaran, spec
pembanding pajak (`9586e3c`) menambah lima skenario (341), perbaikan spec
pembanding metode pembayaran (`cc65d93`) tidak mengubah jumlah, dan
migrasi pajak (`e0aaeca`) menambah 13 test unit dan lima skenario (346).
Diukur terhadap backend lokal `465b438`.

**Baseline per submodul metode pembayaran** (commit `3359497`): 378 test
unit dan integrasi lolos di 48 berkas, 336 e2e lolos, 16 skipped (sama
dengan baseline `465b438` di bawah). Dari baseline itu, spec pembanding
metode pembayaran (`9ca273a`) menambah enam skenario (328), dan migrasinya
(`3359497`) menambah 13 test unit dan delapan skenario (336). Diukur
terhadap backend lokal `465b438`.

**Baseline per penyesuaian backend `465b438`** (commit `b63cf08`): 365
test unit dan integrasi lolos di 47 berkas, 322 e2e lolos, 16 skipped:
dua `test.fixme` bersyarat yang menunggu backend memisahkan shift dan pola
roster per lokasi, delapan `test.fixme` bersyarat yang menunggu izin
lintas outlet, lima `test.fixme` lain yang menunggu backend (ubah pola
roster, hitungan opname yang dikosongkan, dua jurnal di spec alur
penjualan, dan stok produk), dan satu `test.skip` bersyarat data (tab
stok kritis). Diukur terhadap backend lokal `465b438` (branch `nizar`).
Dari baseline modul Gudang di bawah (345 unit, 316 e2e, 22 skipped):
penyesuaian `b85c2bd` sampai `6e314ae` menjadikannya 368 unit dan 319
e2e, karena enam `test.fixme` dilepas atau dibuang dan skenario baru
ditambahkan; `b5a55c4` menambah satu skenario akun kas (320); dan
`b63cf08` menambah dua skenario daftar penjualan (322) serta satu test
unit, sambil membuang empat test unit `navigasiHalaman` (365).

**Baseline per modul Gudang** (commit `319bd99`): 345 test unit
dan integrasi lolos di 44 berkas, 316 e2e lolos, 22 skipped: dua
`test.fixme` bersyarat yang menunggu backend memisahkan shift dan pola
roster per lokasi,
delapan `test.fixme` bersyarat yang menunggu izin lintas outlet dari
backend, sebelas `test.fixme` lain yang menunggu backend (pola roster,
pengguna, stock opname, penerimaan, tiga di spec alur penjualan, tiga di
spec master data reservasi, dan satu di spec daftar reservasi), dan satu
`test.skip` bersyarat data (Test yang ditandai fixme dan skip bersyarat,
di bawah). Dari baseline `5a3deea` (225 lolos), spec tipe aset berubah
dari 40 menjadi 25 test, aset dari 11 menjadi 27, dan tarif dari 12
menjadi 28. Migrasi tipe aset (`074e98c`) dan aset (`d3ae182`)
menambah 4 dan 3 test unit dari 186 di 27 berkas, tanpa mengubah
angka e2e. Migrasi tarif (`365553f`) menambah 10 test unit dan 4
skenario e2e di spec tarif. Spec daftar reservasi (`27749fe`) menambah 6
skenario lolos dan satu fixme, dan migrasinya (`eef371a`) menambah 7 test
unit dan satu skenario. Komponen tanggal dan waktu (`e43e000`) menambah
27 test unit dan integrasi serta dua skenario e2e penjualan. Spec buat
reservasi (`652d669`) menambah enam skenario, dan migrasinya (`477f258`)
menambah 18 test unit dan satu skenario. Spec keuangan (`0cfb3bd`)
menambah enam skenario, dan migrasinya (`45187b6`) menambah 22 test unit
dan lima skenario. Spec pembanding jadwal (`d9af531`) menambah 13
skenario. Submodul shift (`f99b7cf`) menambah 14 test unit, empat
skenario lolos, dan satu `test.fixme` bersyarat. Submodul pola roster
(`dcc22e0`) menambah 15 test unit, satu test integrasi, lima skenario
lolos, dan satu `test.fixme` bersyarat. Submodul jadwal (`19227f8` dan
`e2a0cfd`) menambah 15 test unit, satu test integrasi, dan tujuh
skenario lolos. Submodul monitoring absensi (`845c2cf`) menambah empat
test unit dan tiga skenario lolos. Spec ruang gudang (`2d7225b`) menambah
enam skenario lolos, dan langkah 1 modul Gudang (`9ce288b`) menambah 16
test unit dan tiga skenario lolos. Pengaturan gudang (`319bd99`) menambah
dua test unit dan empat skenario lolos.
Diukur terhadap backend lokal `00b9957` (branch `ridho` setelah
menggabungkan origin/yoga `77f4767`). Angka ini pembanding untuk memastikan tidak ada
yang hilang diam-diam. Angka skipped dapat berubah bila data uji berubah;
periksa judul test yang dilewati sebelum menyimpulkan ada yang hilang.
Begitu `IZIN_LINTAS_OUTLET` diisi, delapan skenario lintas outlet berjalan
dan tiga skenario jalur terkunci dilewati.

## Riwayat pelepasan fixme

Dipindah dari `inti/pengujian.md` (Test yang ditandai fixme dan skip bersyarat) pada 25 Oktober 2026.

Pada 30 September 2026, setelah backend `465b438`, lima `test.fixme`
dilepas karena terbukti diperbaiki: hapus pengguna (`a10af75`), timeline
setelah void booking (`e4bfc86`), hapus tarif (`8134842`), dan pelepasan
tarif dari tipe aset (`31ebd92`), masing-masing dengan commit sendiri;
jumlah diterima 0 diganti terima sungguhan lewat UI (`6e314ae`). Skenario
daftar aset setelah tipe asetnya dihapus dibuang, karena hapus tipe aset
yang masih dipakai kini ditolak 409 (keputusan PB9a). Cara membuktikan
sebuah fixme: lepas sementara, jalankan dua kali, kembalikan berkasnya
dengan `git checkout`, lalu lepas dan commit per test yang lolos. Fixme
berbadan kosong, fixme yang bersyarat konstanta frontend, dan fixme yang
hanya bermakna bila fixme lain lolos lebih dulu bukan kandidat.

Pada 8 Oktober 2026, setelah backend `nizar` `8dc6211`, `test.fixme`
pengosongan nomor HP pelanggan dilepas (`1bb26c0`), setelah lolos dua
putaran berturut-turut.

Pada 11 Oktober 2026, setelah backend `ridho` `2dd57aa`, kedua
`test.fixme` jurnal stok di spec alur penjualan dilepas (`936f073`),
setelah lolos dua putaran berturut-turut.

Pada 16 Oktober 2026, setelah backend `ridho` `7d28135`, `test.fixme`
hapus bahan baku yang baru dibuat dilepas (`cfaaa92`), setelah lolos dua
putaran berturut-turut tanpa perubahan badannya.

Pada 19 Oktober 2026, setelah backend `ridho` `af5f315`, `test.fixme`
hitungan tersimpan dapat dikosongkan kembali diganti langkah sungguhan di
skenario draft stock opname (`d6f8ba0`).

## Utang pengujian yang lunas

Dipindah dari `inti/pengujian.md` (Utang pengujian) pada 25 Oktober 2026.

- **Relasi ke pajak nonaktif tidak dapat diuji dari web**, karena backend
  tidak mengirimnya (butir 93).
  Teruji e2e sejak `ed4bfd3`, setelah backend mengirimnya (RH4a).
- **Satu surat jalan uji tertinggal DIKIRIM sejak 30 September 2026**
  (`SJ-PGJ/202609/0096-8045`), sisa run sebelum PB10a; suite tetap lolos
  dengannya. Ditutup lewat terima penuh dari halaman penerimaan.

Dipindah dari `referensi/utang-pengujian.md` pada 31 Oktober 2026.

- **Cakupan lokasi di e2e hanya teruji satu jalur pada satu waktu**,
  karena satu-satunya akun uji (Ridho) berperan Owner. Selama
  `IZIN_LINTAS_OUTLET` null, Ridho terkunci ke outlet tenant dan jalur
  terkunci teruji e2e, sedangkan jalur lintas outlet berupa `test.fixme`
  bersyarat. Begitu konstanta diisi, keduanya bertukar dan jalur terkunci
  butuh akun uji tanpa izin itu. Keduanya teruji di unit test
  (`tests/unit/features/inventaris/cakupan.test.ts`). Konstanta diisi di
  `2eb668a` (B142): jalur lintas outlet kini teruji e2e, dan empat
  skenario jalur terkunci dilewati. Di MVP satu outlet, pemilih outlet
  hanya berisi satu pilihan, sehingga pilih outlet di jurnal stok dan
  pembelian stok tidak memicu permintaan baru.
  Lunas di `1cd8211`: jalur terkunci login sebagai pengguna uji "E2E
  Tanpa Lintas Outlet" (`tests/helpers/terkunci-uji.ts`), sehingga
  kedua jalur teruji e2e bersama.
- **Perpindahan halaman daftar akun dan pembatas lima baris staf di HP
  tidak berjalan pada data uji sekarang** (skip bersyarat data,
  `inti/pengujian.md`): akun platform tidak lebih dari 10, dan staf
  monitoring per lokasi outlet tidak lebih dari lima sejak B183.
  Lunas di `7ea8427` dan `cd07ae1`: kedua skenario menyiapkan datanya
  sendiri (akun klien uji yang dihapus di finally, dan enam staf uji
  berjadwal hari ini).

Dipindah dari `referensi/utang-pengujian.md` pada 6 November 2026.

- **Pengguna nonaktif yang ditolak 403 saat login PIN (B202)** belum
  teruji e2e; pesannya tampil lewat `pesanError` tanpa penanganan khusus.
  Lunas di `9a85817`: skenario "pengguna non-aktif ditolak 403 saat
  login PIN dan tidak mendapat sesi (B202)" di
  `tests/e2e/pengguna/crud-pengguna.spec.ts`.
- **Verifikasi email, lupa password, dan reset PIN Owner** belum punya
  spec, karena backend-nya belum ada (N3, N4, B178); rencana ujinya di
  `modul/setup-akun.md`, Pengujian OTP.
  Verifikasi email dan lupa password lunas di `67ec690`
  (`tests/e2e/auth/verifikasi-lupa-password.spec.ts` dan
  `tests/e2e/auth/daftar.spec.ts`); reset PIN Owner tetap terbuka di
  `referensi/utang-pengujian.md`.
- **Tanggal di topbar tetap "Sabtu, 31 Oktober 2026" setelah jam palsu
  melewati tengah malam**, diamati 1 November 2026 di spec yang memakai
  `page.clock`. Mungkin menyalahi keputusan rancangan butir 28; belum
  diselidiki apakah topbar memang tidak berganti hari tanpa muat ulang.
  Lunas di `c6f9ec0`: topbar memang tidak berganti hari tanpa muat
  ulang. Kini memakai `useTanggalHariIni`, dengan unit test
  `tests/unit/components/topbar.test.tsx` dan skenario `page.clock` di
  spec dashboard outlet.
- **Suite e2e penuh belum dijalankan setelah perubahan web `67ec690` dan
  `c868870`**; yang terakhir dijalankan adalah suite terhadap backend
  `4759208` sebelum kode web diubah (544 lolos, 2 skipped, 1 gagal dari
  547). Harapannya 549 (`inti/pengujian.md`, Baseline), angka hitungan.
  Dijalankan atas permintaan pemilik proyek atau bersama penyesuaian
  backend berikutnya, dengan layanan uji seperti di `inti/pengujian.md`
  (Menjalankan layanan uji), agar skenario ber-OTP tidak dilewati.
  Lunas oleh suite penuh 6 November 2026 terhadap backend `ridho`
  `c031bde` (`inti/pengujian.md`, Baseline).
- **Wizard `/setup` hanya diuji tampilan dan validasinya** (`50c99ae`);
  penyimpanan setup diuji saat wizard tersambung ke backend. Verifikasi
  email, lupa password, dan Langganan sudah diuji terhadap backend sejak
  `67ec690` dan `c868870`.
  Lunas di `41194b7`: spec setup menjalankan alur nyata yang menyimpan
  setiap langkah ke server, termasuk melanjutkan setelah dimuat ulang.
- **Spec `pengiriman-penerimaan` menghitung seluruh surat jalan DIKIRIM
  tanpa melihat arahnya**, padahal halaman pengiriman hanya menampilkan
  asal gudang dan penerimaan outlet hanya tujuan outlet. Satu surat jalan
  Outlet ke Gudang yang tertinggal DIKIRIM cukup untuk menggagalkannya
  (`arsip/riwayat-pengujian.md`, kejadian 1 November 2026). Harapannya
  perlu disaring menurut asal dan tujuan.
  Lunas di `bc49152`: harapan pengiriman disaring asal Gudang dan
  penerimaan tujuan Outlet, langsung dari respons API.
- **Nama pelanggan kembar yang diterima tidak teruji**, karena basis
  data development masih menolaknya lewat indeks lama
  (`kontrak/temuan.md` butir 142). Email kembar yang dijawab 409 hanya
  dibaca dari kode; e2e menguji nomor HP kembar.
  Sejak 11 Oktober 2026 indeksnya diselaraskan dan butir 142 tertutup;
  skenario nama kembar yang diterima belum ditulis.
  Bagian nama kembar lunas di `e0d3bb4` (spec kelola pelanggan); bagian
  email kembar tetap terbuka di `referensi/utang-pengujian.md`.
- **Dua pelanggan bernama sama di pemilih hanya teruji di unit test**
  (`tests/unit/features/pelanggan/tampilan.test.ts`), dengan alasan yang
  sama. E2E menguji pencarian lewat nomor HP dan tampilannya.
  Alasan itu gugur sejak butir 142 tertutup; skenarionya belum ditulis.
  Lunas di `e0d3bb4`: skenario dua pelanggan bernama sama di pemilih buat
  penjualan (`tests/e2e/pelanggan/pemilih-pelanggan.spec.ts`).
- **Profil yang gagal dimuat dan logout yang gagal belum teruji e2e**:
  pesan beserta tombol coba lagi, dan logout akun yang tetap berjalan
  walau logout pengguna gagal, hanya terbukti dari kode.
  Lunas di `5c9ed69` dan `af77b1f`: `profil/profil-gagal-dimuat.spec.ts`
  dan skenario logout gagal di `auth/sidebar-pengguna.spec.ts`. Membuka
  dashboard lagi setelah pin-logout gagal ternyata memulihkan sesi
  (`modul/profil-login.md`), sehingga skenarionya berhenti di halaman login.
- **Filter periode mutasi lewat `PilihTanggal` dan tombol reset belum
  teruji e2e**; query periode awal dan fungsi pembentuknya teruji.
  Lunas di `5c9ed69`: skenario periode dan Reset Filter di
  `keuangan/mutasi-kas.spec.ts`.
- **Form role yang gagal dimuat hanya teruji untuk id yang tidak ada.**
  Galat server saat memuat detail dan penanda memuat selama detail dimuat
  ulang belum teruji e2e. `nilaiAwalRole` teruji di
  `tests/unit/features/role/nilai-awal.test.ts`.
  Lunas di `5c9ed69` dan `af77b1f`: skenario penanda memuat dan galat
  server di `roles/crud-role.spec.ts`.
- **Penolakan hapus bahan yang punya riwayat tidak teruji e2e**; yang
  teruji hanya dialog yang bertahan saat hapus dijawab gagal.
  Lunas di `5c9ed69`: hapus "E2E Bahan Pak" ditolak 409 di
  `inventaris/bahanBaku/hapus-bahan-baku.spec.ts`.
- **Kirim ulang kode belum diuji e2e** di verifikasi email maupun lupa
  password, karena tombolnya menunggu hitung mundur 60 detik; perlu
  `page.clock`. Jalur verifikasi tanpa password titipan (halaman dibuka
  langsung, lalu diarahkan ke login dengan pesan) teruji e2e sejak
  `efb05db`.
  Lunas di `5c9ed69`: dua skenario kirim ulang dengan `page.clock` di
  `auth/verifikasi-lupa-password.spec.ts`.
- **Suite e2e penuh belum dijalankan sejak `c8a2e83`** (ditunda pemilik
  proyek, 7 November 2026). Sejak commit itu `playwright.config.ts`
  mengisi `tachyon.panduan.otomatis=mati` lewat `storageState` untuk
  semua spec; yang sudah teruji hanya `tests/e2e/setup` dan
  `tests/e2e/dashboard`. Harapannya di `inti/pengujian.md` (Baseline).
  Lunas 7 November 2026: suite penuh 589 test, 585 lolos dan 1 skipped
  (`inti/pengujian.md`, Baseline).
- **Booking lama berstatus Batal** masih ada di data development dan
  tampil di timeline (`kontrak/temuan.md` butir 141); tidak ada test
  untuknya.
  Sejak `nizar` `8dc6211` booking itu dibaca VOID dan menurut kode tidak
  tampil lagi; belum dilihat langsung di timeline (`inti/status.md`).
  Lunas 7 November 2026 tanpa test: basis data masih memuat 150 booking
  Batal, tetapi `GET /sesibooking` tidak mengirim satu pun
  (`kontrak/temuan.md` butir 141).
- **Tombol aksi surat jalan yang disembunyikan menurut izin** hanya teruji
  di unit test (`aksiSuratJalan`), karena satu-satunya akun uji berperan
  Owner.
  Lunas 7 November 2026 (`cbfa23b`): pengguna uji "E2E Baca Saja" membuka
  detail surat jalan PENDING di ruang gudang dan DIKIRIM di ruang outlet
  tanpa tombol aksi (`pengiriman-penerimaan.spec.ts`).
- **Mode baca-saja pengaturan gudang belum teruji**, karena satu-satunya
  akun uji memegang `update-location`. Yang teruji e2e hanya jalur ubah,
  dan `bacaSaja` di `IsianLokasi` belum punya test.
  Lunas 7 November 2026 (`cbfa23b`): pengguna baca-saja melihat isian
  `readonly` tanpa Simpan Perubahan dan Deteksi Otomatis
  (`pengaturan-gudang.spec.ts`).
- **Tombol pelanggan yang disembunyikan menurut izin hanya teruji di unit
  test** (`aksiPelanggan`), karena satu-satunya akun uji berperan Owner.
  Lunas 7 November 2026 (`cbfa23b`): pengguna baca-saja melihat daftar tanpa
  panel Tambah Pelanggan Cepat dan tanpa menu aksi baris
  (`pelanggan.spec.ts`).
- **Tampilan tanpa `update-akunkas` belum teruji e2e** (tombol Ubah dan
  Aktifkan kembali tidak tampil, dan rute ubah ditolak gerbang rute sejak
  `bc388c6`),
  karena data uji tidak punya pengguna tanpa izin itu; `aksiAkunKas`
  teruji di unit test.
  Lunas 7 November 2026 (`cbfa23b`): pengguna baca-saja melihat daftar tanpa
  Ubah dan Aktifkan kembali, dan rute ubah ditolak gerbang
  (`ubah-akun-kas.spec.ts`). Tombol Tambah Akun kini ikut menurut izin.
- **Tombol Ubah Info dan Hapus pembelian menurut izin** hanya teruji
  lewat `aksiPembelianStok` di unit test, termasuk izin per ruang (B116).
  Gerbang halaman per ruang teruji di `gate-pembelian-stok.test.ts`;
  jalur pemegang izin ruang saja belum teruji e2e, karena akun uji Owner
  memegang izin umum.
  Lunas 7 November 2026 (`cbfa23b`, `4601d91`): pengguna baca-saja membuka
  detail tanpa kedua tombol (`belanja-stok.spec.ts`), dan pengguna "E2E
  Pembelian Outlet" mencatat dan menghapus lewat UI di ruang outlet lalu
  ditolak gerbang di ruang gudang (`catat-pembelian-stok.spec.ts`).

## Kejadian sesekali yang tidak berulang

Dipindah dari `inti/pengujian.md` (Utang pengujian) pada 25 Oktober 2026.

- **Suite penuh 1 November 2026 (14.24 sampai 14.51 WIB) gagal di tiga
  spec.** Buat reservasi (judul halaman buat tidak muncul) dan tarif
  (`hapusLewatApi` tidak dijawab dalam 30 detik) lolos saat diulang
  tersendiri; penyebabnya belum diketahui, sejalan dengan kejadian spec
  tarif dan tipe aset di bawah. Spec pengiriman dan penerimaan surat
  jalan gagal karena `SJ-PGJ/202611/0021-01` (Outlet Pontianak Kota ke
  Gudang A) tertinggal DIKIRIM dari suite yang dihentikan dengan Ctrl+C
  pukul 14.24. Surat jalan itu ditutup lewat
  `PATCH /transferstok/:id/terima` dengan helper uji, bukan lewat Proses
  Terima seperti tertulis di pesan commit `e7fda09`; spec lalu lolos.
- **Suite penuh pertama 1 November 2026 mencatat sembilan skipped**,
  sedangkan run berikutnya hanya satu. Judul test yang dilewati tidak
  dicatat, sehingga penyebabnya tidak dapat dipastikan.
- **Spec tarif sempat gagal sekali di suite penuh `074e98c`** (spinner,
  lolos 3 dari 3 saat diulang). Sebelum migrasi tarif, spec itu lolos 78
  dari 78 dalam tiga putaran terhadap kode lama; penyebab kegagalan
  sekali itu belum diketahui.
- **Spec tipe aset sempat habis waktu sekali di suite penuh `d9af531`**:
  `hapusTipe` lewat `page.request` tidak dijawab dalam batas waktu test
  (`crud-tipeAset.spec.ts` baris 267), lalu lolos 75 dari 75 dengan
  `--repeat-each 3`, dan suite penuh berikutnya bersih. Sejalan dengan
  kejadian spec tarif di atas; penyebabnya belum diketahui. Terulang dua
  kali pada 30 September 2026 di `DELETE /tipeaset` dan `/tarif`, dengan
  permintaan tertahan sekitar 25 detik, lalu 220 eksekusi sesudahnya
  bersih; dicatat untuk tim backend (`kontrak/temuan.md` butir 77).
  Kejadian ketiga pukul 22.28 di `POST /tipeaset`: dokumennya tersimpan
  tetapi jawabannya tidak sampai, dan enam tipe aset uji tertinggal
  sebagai jejak kejadian sejak 27 September. Kejadian keempat 1 Oktober
  22.49 WIB, suite penuh terhadap `yoga` (`crud-tipeAset.spec.ts:221`),
  meninggalkan jejak ketujuh; tiga run ulang spec itu lolos 75 dari 75.
- **Spec pola roster sesekali kehilangan sesi setelah `reload`**: pada run
  suite penuh pertama untuk `b84de56`, skenario "gagal memuat: tabel
  menampilkan pesan galat" habis waktu (21,7 detik), karena snapshot
  menampilkan halaman login setelah `page.reload()`. Test itu lolos 3 dari
  3 sendirian, dan run ulang suite bersih; jawaban `pin-refresh`-nya tidak
  terbaca karena trace tidak disimpan. Bila terulang, jalankan dengan
  `--trace on`.
- **Spec login sempat habis waktu sekali di suite penuh 2 Oktober 2026**
  (sekitar 13.34 WIB, test "PIN login in-flight"): halaman login PIN
  menampilkan "Akses ditolak. Token akun tidak ditemukan.", yang berarti
  `akun/auth/refreshtoken` pada pemuatan itu tidak memulihkan token akun.
  Test itu lolos sendirian dan di dua suite penuh sesudahnya; penyebabnya
  belum diketahui, karena trace tidak disimpan. Bila terulang, jalankan
  dengan `--trace on`.
- **Dua kejadian sesekali pada spec tipe aset, 4 dan 5 Oktober 2026**,
  terhadap backend `fc29433`. Di suite penuh, login akun di `beforeEach`
  tidak berpindah dari `/login` ke `/login/pengguna` dalam 30 detik
  (sekali). Pada run pertama keesokan harinya, baris tipe aset yang baru
  dibuat lewat API tidak tampil dalam 5 detik di skenario pencarian
  (sekali); run berikutnya lolos 25 dengan test terlama 6,9 detik.
  Sebabnya tidak terbukti: laporan suite ada di `/tmp` dan hilang sebelum
  durasinya dibaca. Tidak ada kode maupun asersi yang diubah.
- **Jumlah skenario lolos suite penuh 7 Oktober 2026 adalah 440, bukan
  444**: empat skenario gagal karena nomor pengajuan kembar di backend
  (`kontrak/temuan.md` butir 139), lalu lolos saat foldernya diulang
  setelah data development digeser.
