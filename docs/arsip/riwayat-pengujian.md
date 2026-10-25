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

## Kejadian sesekali yang tidak berulang

Dipindah dari `inti/pengujian.md` (Utang pengujian) pada 25 Oktober 2026.

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
