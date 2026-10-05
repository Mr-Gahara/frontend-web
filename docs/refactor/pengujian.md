# Pengujian

Sifat perubahan: **Sering**: baseline dan spec rujukan setiap modul; bagian lain bertambah saat ada pelajaran.

Perintah verifikasi dan baseline, cara menelusuri kegagalan e2e, catatan
Playwright, test yang ditandai fixme atau dilewati, utang pengujian, dan spec
rujukan. Baseline dan spec rujukan diperbarui setiap modul.

## Perintah verifikasi yang biasa dipakai

```bash
echo "tsc: $(npx tsc --noEmit > /tmp/t.log 2>&1; echo $?)"; grep 'error TS' /tmp/t.log | cut -c1-110 | head -5
npx eslint app components features hooks lib tests 2>&1 | tail -3
npx vitest run 2>&1 | tail -5
npx playwright test tests/e2e/<modul> --reporter=json > /tmp/p.json 2>/dev/null; node ~/.cache/frontend-web/alat/ringkas-e2e.js
```

Menjalankan satu test saja, dan memeriksa ketahanannya terhadap flakiness:

```bash
npx playwright test tests/e2e/<modul> -g '<potongan judul>' --reporter=json > /tmp/p.json 2>/dev/null; node ~/.cache/frontend-web/alat/ringkas-e2e.js
npx playwright test tests/e2e/<modul> -g '<potongan judul>' --repeat-each 3 --reporter=line 2>&1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' | grep -E '^\s+[0-9]+ (passed|failed|flaky|skipped|did not run)'
```

Membandingkan jumlah error ESLint sebuah berkas terhadap `HEAD`, untuk
memisahkan error baru dari error warisan (memakai
`~/.cache/frontend-web/alat/hitung-eslint.js`):

```bash
f=path/ke/berkas.tsx; echo "sekarang:$(npx eslint "$f" -f json 2>/dev/null | node ~/.cache/frontend-web/alat/hitung-eslint.js) HEAD:$(git show "HEAD:$f" | npx eslint --stdin --stdin-filename "$f" -f json 2>/dev/null | node ~/.cache/frontend-web/alat/hitung-eslint.js)"
```

Ringkasan e2e, beserta status dan pesan error setiap test yang tidak lolos
(helper `ringkas-e2e.js`, bagian Helper penggantian di `cara-kerja.md`):

```bash
npx playwright test tests/e2e --reporter=json > /tmp/p.json 2>/dev/null; node ~/.cache/frontend-web/alat/ringkas-e2e.js
```

Keluaran reporter `line` jangan dipotong dengan `tail` untuk membaca hasil:
daftar judul test yang gagal atau tidak dijalankan tercetak tanpa baris
ringkasan di dekatnya, sehingga hasilnya ambigu. Ringkasan vitest dibaca
dengan `tail -5`, bukan `grep`, karena baris ringkasannya membawa kode warna
ANSI, bahkan saat keluarannya dialihkan ke berkas. Gerbang yang memakai
`grep` atas keluaran alat membuang kode ANSI lebih dulu
(`sed 's/\x1b\[[0-9;]*[A-Za-z]//g'`), dan setiap langkah gerbang mencetak
alasannya saat gagal. `grep -q` yang gagal tanpa pesan sempat menghentikan
commit `08d0a73` diam-diam.

Daftar error ESLint beserta berkas, baris, dan aturannya (helper
`daftar-eslint.js`). Helper ini selalu mencetak `error: N`, sehingga
keluaran kosong tidak pernah berarti bersih. Formatter `unix` tidak ada di
ESLint 9; pakai `json`:

```bash
npx eslint <berkas atau folder> -f json 2>/dev/null | node ~/.cache/frontend-web/alat/daftar-eslint.js
```

Memastikan tidak ada spec yang memalsukan respons sukses (helper
`audit-fulfill.js`, keputusan rancangan butir 21). Helper keluar dengan
kode gagal bila ada `route.fulfill` berstatus sukses tanpa tanda
`// simulasi:`, sehingga dipakai sebagai gerbang di blok commit spec.
Audit seluruh suite bersih sejak `04830b7`; jalankan untuk seluruh suite
sebelum commit spec, atau untuk folder spec yang diubah saat iterasi:

```bash
node ~/.cache/frontend-web/alat/audit-fulfill.js tests/e2e
```

Saat menutup modul, kolom "Dipakai di" di `docs/kontrak/endpoint.md` dan
kecocokan frontend dengan backend diperiksa lewat helper `audit-endpoint.js`
(`cara-kerja.md`, Helper penggantian). Jalankan
`node ~/.cache/frontend-web/alat/audit-endpoint.js | head -40` dari akar
repo, nilai setiap baris laporannya, lalu ulangi dengan `--tulis`. Audit 22
September 2026 memastikan seluruh panggilan frontend ada di backend dan
tercatat di kontrak. Audit juga dijalankan setiap kali backend berpindah
versi: audit 30 September 2026 terhadap `465b438` menemukan tujuh route
yang hilang, termasuk route hapus yang dipakai pembersihan spec.

Suite e2e penuh memakan sekitar 35 menit (diukur 3 Oktober 2026 dengan
427 test; 26 menit pada 2 Oktober 2026 dengan
393 test; 13 sampai 15 menit pada 28 September 2026)
karena berjalan dengan satu worker dan memakai backend sungguhan. Saat
iterasi cukup jalankan spec modul yang sedang dikerjakan. **Sebelum setiap
commit, `tsc`, ESLint, vitest penuh, dan spec e2e yang terdampak wajib
lolos; suite e2e penuh hanya dijalankan saat penting**: penyesuaian
backend, penelusuran bug atau galat yang butuh uji menyeluruh, atau atas
permintaan pemilik proyek (pemilik proyek, 6 Oktober 2026, menggantikan
PF6a). Commit yang hanya mengubah dokumentasi
dikecualikan; gerbangnya `npm run docs:periksa` (pemilik proyek, 28
September 2026).

Seluruh spec memakai `page.route` hanya untuk jalur gagal atau untuk
menahan permintaan lalu meneruskannya: audit `audit-fulfill.js` atas
seluruh suite bersih sejak `04830b7`, dengan empat simulasi beralasan (dua
di spec login, satu di spec tipe aset, dan satu di spec ruang gudang sejak
`2d7225b`).

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
basis data diselaraskan dengan seed (`refactor/backend.md`).

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

Setiap run suite penuh menambah tiga dokumen stock opname berstatus
CANCELLED, serta tiga surat jalan BATAL dan empat entri jurnal gudang. Spec
penerimaan dan spec pengiriman masing-masing membatalkan satu surat jalan
DIKIRIM (jurnal kirim dan jurnal batal), dan spec alur transfer membatalkan
satu surat jalan PENDING tanpa jurnal. Terbukti dengan
`tinjau-surat-jalan.js BATAL` pada suite penuh `580a1e1`. Sejak `b85c2bd`
(PB10a), surat jalan DIKIRIM spec penerimaan dan pengiriman ditutup lewat
terima penuh, bukan dibatalkan, sehingga setiap run menambah surat jalan
DITERIMA beserta jurnal kirim dan terima, dan stok outlet uji bertambah;
jumlah per run belum diukur ulang. Spec keuangan menambah satu akun kas
non-aktif bersaldo 0 per run (PB13a), dan spec kelola metode pembayaran
satu metode uji nonaktif per run (PO10a). Spec pajak menghapus pajak
ujinya lewat UI di setiap run; kategori dan produk uji pajak dibuat
sekali. Aturan data uji
spec tulis ada di Test yang ditandai fixme dan skip bersyarat, di bawah.

## Kredensial uji

- Akun: `toko@gmail.com` / `Toko1234`
- Pengguna: nama `Ridho`, PIN `123456` (berperan Owner)
- Frontend `localhost:3000`, backend `localhost:4000`
- Akun admin platform: tidak ditulis di sini (keputusan PA6a). Spec
  membacanya dari `E2E_ADMIN_EMAIL` dan `E2E_ADMIN_PASSWORD` di `.env.e2e`
  (akar repo, diabaikan git) atau dari variabel lingkungan, lewat
  `tests/helpers/admin-uji.ts`

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
| `page.request` di `finally` habis waktu, sekali lalu hilang | Backend sesaat tidak menjawab; permintaan ini tidak melewati `page.route`, sehingga bukan akibat simulasi spec (suite penuh `074e98c`). Jalankan ulang suite penuh sebelum mengubah spec |
| `waitForResponse` habis waktu setelah kembali ke halaman atau filter yang sudah pernah dimuat | Kunci query masih segar (`staleTime` 5 menit di `components/providers/query-provider.tsx`), sehingga tidak ada permintaan. Buktikan dari tampilan; penunggu jaringan hanya untuk kunci yang belum pernah dimuat (`b63cf08`) |
| Pembersihan tampak lolos, tetapi data uji menumpuk di basis data | Helper pembersihan membuang jawaban permintaannya. Periksa statusnya dengan `expect.soft`, dan jalankan audit endpoint: route yang dihapus backend juga menjawab 404 (`b5a55c4`) |

Contoh nyata: pada modul role, penghapusan tidak pernah terkirim karena
tombol hapus sempat disabled sampai daftar role selesai dimuat (level
pengguna diturunkan dari daftar itu). Tiga dugaan sebelumnya keliru, dan
satu di antaranya memperburuk keadaan. Trace jaringan menjawabnya dalam
satu putaran.

## Catatan Playwright

- Radix Select: buka lewat teks yang sedang tampil di trigger, yaitu placeholder (misalnya "Pilih role") atau nilai terpilih (misalnya "Semua Lokasi"), bukan `getByRole("combobox").nth()`, karena Radix merender trigger beserta select tersembunyi.
- Setelah mutation, tunggu permintaan pemuatan ulang selesai sebelum memeriksa tabel, agar tidak berlomba dengan invalidasi cache.
- Toast Sonner menutup sendiri; jangan jadikan satu-satunya bukti keberhasilan.
- Isi Select sebelum input angka, karena perubahan Select memicu render ulang.
- Test yang lolos saat dijalankan sendirian bisa gagal ketika dijalankan
  bersama spec lain, dan sebaliknya. Bila sebuah test baru lolos, jalankan
  ulang bersama spec satu modul sebelum menyimpulkan selesai.
- Jangan menjadikan perpindahan halaman sebagai penanda keberhasilan bila
  mutation-nya sendiri bisa gagal; periksa efeknya pada data, misalnya
  hilangnya baris dari tabel.
- `page.route` hanya dipakai untuk mensimulasikan kegagalan yang tidak dapat
  dibuat backend secara deterministik, dan hanya untuk method serta path yang
  diperlukan. Request lain tetap ke backend sungguhan, dan intersepsi dilepas
  dengan `page.unroute` setelah dipakai.
- `route.fulfill` berstatus sukses dilarang (keputusan rancangan butir 21).
  Keadaan memuat diuji dengan menahan permintaan lalu `route.continue()`,
  sehingga responsnya tetap dari backend. Simulasi berstatus 200 yang tidak
  terhindarkan dibentuk dari respons nyata bila bisa (`route.fetch()` lalu
  mengubah satu field) dan ditandai `// simulasi: <alasan>` di baris
  `fulfill` atau tepat di atasnya. Periksa dengan `audit-fulfill.js`.
- Pesan gagal dibandingkan dengan `message` respons nyata yang ditunggu
  lewat `page.waitForResponse`, bukan dengan teks yang ditulis di spec.
  Spec login lama menulis sendiri 401 "Email atau password salah.",
  padahal backend menjawab 404 dan 400 dengan pesan lain.
- Uji login gagal memakai email atau nama pengguna unik per run, karena
  pembatas login dihitung per IP dan email serta per tenant dan nama.
  Percobaan gagal dengan akun uji menambah hitungan yang, bila habis,
  mengunci login seluruh suite selama 15 menit.
- Input yang dirender lewat `Controller` tidak punya atribut `name`
  (misalnya harga berformat ribuan di edit tarif); pilih lewat atribut
  yang benar-benar ada di kode, seperti `inputmode` dan `placeholder`.
  Selector diturunkan dari kode halaman, bukan dari spec lama: selector
  `menuitem` di spec aset lama tidak pernah cocok dengan UI, karena
  skenarionya selalu di-skip.
- Checkbox Radix yang dibungkus `<label>` bernama sesuai teks labelnya,
  sehingga `getByRole("checkbox", { name })` dan `toBeChecked()` dapat
  dipakai (hari aktif dan tipe aset di form tarif).
- Tombol simpan yang teks menunggunya tidak diketahui diperiksa lewat
  `button[type="submit"]` yang nonaktif selama permintaan ditahan.
- Pesan galat utuh test yang gagal dicetak helper `galat-e2e.js`
  (`cara-kerja.md`, Helper penggantian), karena `ringkas-e2e.js` memotong
  nilai yang diterima.
- Nama data uji dibuat unik per run (misalnya akhiran dari `Date.now()`), agar
  data sisa dari run yang gagal tidak memicu penolakan duplikat.
- Nilai input berformat rupiah diperiksa dengan pola, misalnya
  `toHaveValue(/15\.?000/)`, bukan string persis, karena tampilannya diubah
  oleh format ribuan.
- `getByText(teks, { exact: true })` gagal (strict mode) bila teks yang sama
  tampil di dua tempat. Sempitkan ke elemen pembungkusnya, misalnya
  `getByText(/no\. ref:/i)` lalu `toContainText(nomor)`.
- Untuk halaman yang hanya menampilkan data, ambil data uji dari respons
  server dengan `page.waitForResponse`, lalu bandingkan tampilan dengan isi
  respons itu. Bila halaman sebelumnya (misalnya dashboard setelah login)
  memanggil endpoint yang sama, pasang penunggu setelah
  `page.goto(url, { waitUntil: "commit" })` atau
  `page.reload({ waitUntil: "commit" })`; bila tidak, respons halaman lama
  ikut tertangkap dan isinya sudah dibuang. Pada stock opname, aturan ini
  terlupa di `reload` dan menggagalkan spec alur. Untuk aksi klik, pasang
  penunggu sebelum klik. Baca isi respons segera, seperti helper `tunggu` di
  spec stok.
- Spec untuk operasi tulis mengembalikan data ke nilai semula, misalnya batas
  minimum dinaikkan 1 lalu dikembalikan, dan opname dikirim dengan fisik sama
  dengan stok. Operasi yang tidak bisa dibatalkan dari UI (tambah barang
  gudang) hanya diuji jalur batal dan gagalnya.
- Simulasi kegagalan GET dengan `page.route` (misalnya status 500) butuh
  timeout sekitar 20 detik pada assertion pesan error, karena TanStack Query
  mengulang permintaan beberapa kali sebelum query dinyatakan gagal.
- Spec pembanding mencocokkan path API tanpa membedakan huruf besar kecil
  (`/\/api\/pengajuanstok/i`). Halaman lama memanggil `/pengajuanStok`,
  sedangkan `features/` memakai konstanta kanonik lowercase; spec yang peka
  huruf gagal setelah migrasi padahal perilakunya sama.
- Respons mentah yang dipakai sebagai harapan dinormalkan dengan
  `normalizeId` dari `lib/api/normalize.ts` bila objek bersarangnya dipakai,
  karena halaman menerima data yang sudah dinormalkan. Pada stock
  adjustment, `referenceID` mentah membawa `_id`, sehingga href yang
  diharapkan menjadi `.../undefined` padahal halamannya benar.
- Bukti bahwa sebuah aksi tidak mengirim permintaan diambil dari penghitung
  `page.on("request", ...)` yang dilepas dengan `page.off`, bukan hanya dari
  toast. Contoh: langkah pengosongan di spec draft stock opname.
- Konfigurasi Playwright tidak menyimpan trace untuk test yang gagal. Untuk
  menelusuri, jalankan ulang test itu dengan `--trace on`; pada spec tulis,
  bersihkan dulu dokumen yang tertinggal agar run ulang tidak `skipped`.
- Blok diagnosis yang menjalankan spec tulis selalu diberi peringatan bahwa
  ia membuat data baru, dan hasil lolos atau gagalnya dicetak, tidak dibuang
  ke `/dev/null`. Spec tulis stock opname membuat dokumen baru setiap kali
  dijalankan, dan dokumen itu tertutup hanya bila test lolos sampai langkah
  pembatalan.
- Payload operasi tulis yang tidak boleh meninggalkan data diperiksa dengan
  `page.route` yang menjawab gagal hanya untuk method dan path itu: isi
  permintaan dibaca dari `page.waitForRequest`, lalu pesan gagal di UI
  diperiksa. Contoh: skenario payload buat di spec daftar pengajuan stok.
- Setiap navigasi penuh (`goto`, `reload`) memulihkan sesi lewat
  `pin-refresh`, dan token yang dipegang spec sebelum refresh itu dijawab
  401 "Sesi tidak valid". Spec yang memanggil API dengan `page.request`
  mengambil token dari respons `pin-refresh` pemuatan halaman, lalu
  menggantinya setiap kali halaman melakukan `pin-refresh` lagi. Token dari
  permintaan pertama yang membawa `Authorization` tidak dipakai, karena
  bisa milik halaman sebelumnya. Contoh: `bukaDenganAuth` di
  `tests/helpers/transfer-uji.ts`, dipakai spec penerimaan, transfer, dan
  alur pengajuan stok. Spec alur pengajuan sempat punya `bukaDenganAuth`
  lokal bernama sama yang membekukan token dari permintaan API pertama,
  dan itulah penyebab kegagalan sesekali "setujui gagal: dialog bertahan
  dan pesan tampil": halaman mendarat di login karena token spec sudah
  dijawab 401. Gejalanya muncul dua kali pada 21 September 2026, sekali
  pada 22 September, dan tiga kali berturut-turut pada `247cf2d`, selalu
  bergantung pada waktu `pin-refresh`. Diperbaiki di `8d62c56` dengan
  memakai helper bersama; 260 dari 260 lolos dengan `--repeat-each 20`.
  Bila gejala serupa muncul di spec lain, periksa lebih dulu apakah spec
  itu memakai helper bersama atau versi lokalnya sendiri.
- Persiapan data lewat API memeriksa status setiap langkah dan menyertakan
  pesan backend. `test.skip` hanya dipakai bila memang tidak ada data yang
  layak; kegagalan persiapan sebagian menggagalkan test setelah dokumen
  yang sempat tercipta dibatalkan. Pada spec penerimaan, `skip` sempat
  menelan `GET` yang dijawab 401 dan meninggalkan surat jalan DIKIRIM.
- Pemeriksaan di blok `finally` memakai `expect.soft`. Pengecualian yang
  dilempar di `finally` menggantikan kegagalan asli test, sehingga
  penyebabnya hilang dari laporan: pada spec penerimaan, kegagalan
  selector sempat tertutup oleh kegagalan pembatalan.
- Spec pembanding memakai `expect.soft` untuk setiap perilaku yang akan
  diubah, agar seluruh perbedaan dengan kode lama terlapor dalam satu run.
  Pemeriksaan keras hanya untuk syarat jalannya skenario.
- Helper pembuka halaman yang menunggu respons tidak mengodekan jalur
  peran. `bukaOutlet` di spec stok sempat menunggu `GET /inventory` tanpa
  `locationID` (jalur owner lama), sehingga saat cakupan berubah, enam test
  yang perilakunya tidak berubah ikut gagal. Penunggu mengikuti lingkup
  halaman (`ADA_IZIN_LINTAS`).
- Ringkasan `passed:0 failed:0 skipped:0` berarti tidak ada test yang
  berjalan, biasanya karena spec gagal dikompilasi (misalnya modul helper
  belum ada), bukan hasil bersih. Jalankan `tsc` lebih dulu.
- Asersi "tidak berubah" hanya bermakna bila bacaannya terbukti segar. Di
  spec alur penjualan, asersi "tidak ada jurnal baru" lolos padahal daftar
  jurnal di-cache 300 detik, sehingga bacaan sesudah selalu sama dengan
  sebelumnya. Pastikan lebih dulu bahwa perubahan yang diharapkan memang
  terbaca lewat sumber yang sama (asersi positif), baru percayai asersi
  negatifnya.
- Data uji harus dapat membedakan hasil yang benar dari yang salah. Bila
  data hanya punya satu nilai (satu outlet), skenario penyaringan lolos
  tanpa menguji apa pun; uji aturannya di unit test dan catat
  keterbatasannya di Utang pengujian.
- Laporan JSON untuk run berulang atau diagnosis ditulis ke berkas
  tersendiri, misalnya `/tmp/p-daftar.json`. Pada daftar reservasi,
  `/tmp/p.json` tertimpa run penuh yang terhenti, lalu `galat-e2e.js`
  menjawab `gagal: 0` karena statusnya `interrupted`.
- Elemen yang dikenali lewat teks yang dapat berulang dari data run
  sebelumnya dihitung dari respons, bukan ditebak 1. Booking Batal dari
  run sebelumnya dalam menit yang sama berteks jam sama, dan
  `--repeat-each 3` pertama gagal dengan `Received: 2`.
- Helper persiapan tidak membaca kunci cache backend yang juga dibaca
  halaman yang diuji. Helper booking membaca `GET /sesibooking` tanpa
  tanggal, karena daftar per tanggal yang terbaca helper tidak dibersihkan
  saat void (`kontrak/temuan.md` butir 57) dan membuat halaman menerima
  data basi.
- Satu aksi yang memicu dua permintaan ke endpoint dan query yang sama
  membuat `waitForResponse` menangkap salah satunya tanpa urutan yang
  pasti. Sejak KU5a, tombol periode laba rugi meminta periode berjalan dan
  pembandingnya, dan penunggu yang hanya mencocokkan `periode` lolos
  karena kebetulan urutan. Penunggu dipersempit dengan parameter pembeda,
  di sini `endDate` (`responsLabaRugi`, `45187b6`).
- Pemicu bertipe `combobox` tidak mendapat nama aksesibel dari teks di
  dalamnya, sehingga `getByRole("combobox", { name })` tidak pernah cocok
  bila pemicu itu tidak berlabel; pilih lewat `.filter({ hasText })`.
  Tanpa `actionTimeout` di konfigurasi, aksi yang tidak menemukan
  elemennya menunggu sampai batas waktu test habis, dan galatnya hanya
  menunjuk langkah pembersihan sesudahnya. Snapshot DOM diperiksa lebih
  dulu (pemicu pola di generate jadwal, `d9af531`).
- Status respons yang belum pernah dibaca dari kode atau respons nyata
  tidak ditebak dari endpoint serupa: `POST /jadwalshift` menjawab 201,
  sedangkan `POST /jadwalshift/bulk` menjawab 200.
- Setelah menekan simpan di dialog modal, tunggu dialog tertutup
  (`toBeHidden`) sebelum berinteraksi dengan halaman. Hook di `features/`
  menunggu invalidasi sebelum mutation selesai, sehingga dialog baru
  tertutup setelah daftar dimuat ulang, dan klik di luar dialog yang
  masih terbuka hanya menutupnya. Terbukti lewat trace di spec shift
  (`f99b7cf`); spec itu lolos di kode lama hanya karena dialog lama
  tertutup lebih cepat.
- Hasil `--repeat-each N` untuk spec yang memuat `test.fixme` bersyarat
  dihitung sebagai lolos kali N ditambah skipped kali N. Pesan commit
  `f99b7cf` menyebut spec shift 48 lolos, padahal hasilnya 45 lolos dan
  3 skipped.
- Pola path `page.route` ditulis sebagai regex tanpa membedakan huruf
  besar kecil (`/\/api\/polaroster$/i`), bukan glob string. Glob peka
  huruf besar kecil, dan pencegat yang tidak kena gagal diam-diam: di
  spec pola roster, `"**/api/polaRoster"` tidak mengenai path kanonik
  `/polaroster` setelah migrasi, sehingga simulasi simpan gagal justru
  menyimpan pola sungguhan, yang lalu dihapus lewat API (`dcc22e0`). Per
  29 September 2026, enam `page.route` lain masih memakai glob string,
  dan seluruhnya ber-path lowercase yang cocok dengan path kanonik.

- Keberhasilan dibuktikan dari respons atau data yang dibaca ulang dari
  backend, bukan dari teks toast umum. Surat jalan DITERIMA dan
  `qtyTerima: 0` di spec terima dibuktikan lewat detail dari API
  (`6e314ae`).
- Jalur gagal yang diuji lewat `page.route` perlu pasangan jalur sukses
  sungguhan. Terima penerimaan sempat hanya diuji jalur gagalnya, sehingga
  kontrak `itemId` backend `465b438` tidak terlihat sampai terima
  sungguhan ditulis.
- Elemen yang diubah oleh aksi yang diuji tidak dicari lewat nilai yang
  ikut berubah. Baris riwayat pembayaran yang dicari lewat catatannya
  hilang setelah dibatalkan, karena backend menimpa catatan itu dengan
  alasan pembatalan (`kontrak/temuan.md` butir 75, diperbaiki backend
  `yoga`); cari lewat id atau nilai yang tetap.
- Field payload dibandingkan dengan validator dan allowlist backend
  setiap kali backend berpindah versi, lalu efeknya dibuktikan lewat e2e.
  `diskonGlobalIDs` dibuang allowlist `465b438` tanpa galat, sehingga
  diskon hilang diam-diam walau test unit payload lolos.
- Pengguna kedua di e2e (misalnya penyetuju pengajuan) masuk lewat
  `request.newContext()` terpisah, agar sesi web pengguna uji tidak
  diambil alih (PB10a).
- Helper pembersihan memeriksa jawaban setiap permintaannya dengan
  `expect.soft`, yang menerima sukses atau 404. `hapusLewatApi` sempat
  membuang jawabannya, sehingga lima akun kas uji tertinggal tanpa
  terlihat (`b5a55c4`).
- Kegagalan sesekali ditelusuri dari durasi di laporan JSON, yang
  membedakan permintaan tertahan dari test yang lambat; tangkapan layar
  dan trace diambil sebelum run lain menimpanya, dan run ulang dilakukan
  terbuka, bukan dianggap selesai (`kontrak/temuan.md` butir 77).
- Spec baru untuk sebuah halaman menyalin cara pembukaan halaman dari
  spec yang sudah lolos untuk halaman itu. Spec daftar penjualan sempat
  menyalin pola spec keuangan: tanpa `login`, dan penunggu dipasang
  sebelum `reload`, sehingga respons halaman sebelumnya ikut tertangkap
  (`b63cf08`).
- Pesan galat yang juga tampil di overlay galat Next.js (dev) dicari di
  dalam `main`, dan tidak adanya galat runtime dibuktikan lewat
  `page.on("pageerror")`. Di halaman buat metode lama, penolakan backend
  menjadi unhandled rejection, sehingga teks pesannya tampil dua kali
  (`9ca273a`).
- Daftar yang tumbuh karena data uji menumpuk dicari lewat kotak
  pencarian halaman, bukan diasumsikan ada di halaman pertama tabel (spec
  kelola metode pembayaran, `3359497`).
- Trace dibaca per entri: berkas `.trace` juga memuat entri `snapshot`
  milik snapshot DOM tanpa `request`, sehingga skrip yang membaca
  `snapshot.request` memeriksa keberadaannya lebih dulu.
- Pemicu Radix Select yang diberi label `htmlFor` bernama aksesibel sesuai
  labelnya, sehingga dipilih lewat `getByRole("combobox", { name })`
  (helper `pilihOpsi` di `tests/helpers/pajak-uji.ts`); pemicu tanpa label
  tetap dipilih lewat teks yang tampil.
- Spec yang meninggalkan data uji permanen di sebuah daftar membuat spec
  lain di halaman yang sama ikut gagal begitu daftarnya melewati satu
  halaman tabel. Saat menulis spec semacam itu, periksa juga spec lain di
  halaman itu, dan cari baris lewat kotak pencarian. Spec pembanding
  metode pembayaran gagal karena metode uji spec kelola mendorong `CASH`
  ke halaman kedua (`cc65d93`).
- Spec form memeriksa bahwa permintaannya terkirim, bukan hanya hasil
  akhirnya: validasi browser (`required`, `min`) menahan submit tanpa
  pesan yang dapat dibaca test. Form buat pajak lama menahan submit sampai
  prioritas diketik, dan hanya terungkap lewat `waitForResponse` yang habis
  waktu serta snapshot dengan isian prioritas aktif (`9586e3c`).
- Teks yang juga dapat tampil di sidebar atau topbar dicari di dalam
  `main`, bukan di seluruh halaman. Spec generate jadwal mencari nama
  pengguna uji dengan `page.getByText`, dan lolos hanya karena kaki
  sidebar kosong setelah navigasi penuh; begitu sidebar diperbaiki,
  pencariannya mengenai dua elemen (`ca6eb3d`).
- Perilaku setelah halaman dimuat ulang diuji dengan `reload` sungguhan.
  Test yang memeriksa sidebar tepat setelah `login` tidak melewati
  pemulihan sesi, karena navigasi dari halaman login terjadi saat sesi
  sudah ada; menu yang hilang setelah muat ulang tidak terlihat sampai
  spec muat ulang ditulis (`ca6eb3d`).
- Selagi dialog modal terbuka, isi halaman tersembunyi dari pohon
  aksesibilitas, sehingga `getByRole("main")` tidak menemukan apa pun dan
  toast di dalamnya hanya dapat dicari lewat `page.getByText`. Spec
  pembanding pelanggan mencari pesan gagal di dalam `main`, yang hanya
  berhasil karena dialog lama tertutup saat diklik; selector itu berubah
  di commit migrasi begitu dialog bertahan (`d9365d3`). Selector spec
  pembanding tidak boleh bergantung pada perilaku yang akan diubah.
- Tampilan yang bergantung pada perilaku backend yang menunggu perbaikan
  diuji dengan membaca respons nyata lalu memeriksa tampilan yang sesuai
  dengannya, sedangkan perilaku yang benar ditegaskan `test.fixme`
  tersendiri. Langkah pengosongan nomor HP memeriksa peringatan bila
  respons masih membawa nilainya dan pesan berhasil bila tidak, sehingga
  benar di kedua keadaan backend (`d9365d3`).
- Bila seluruh test gagal di `login` (koneksi ditolak, atau habis waktu
  menunggu isian email), periksa server lebih dulu, bukan test-nya:
  `curl` ke `/login` dan `tsc`. Pada submodul diskon itu terjadi dua kali:
  sekali server dev tidak berjalan (388 gagal dengan
  `ERR_CONNECTION_REFUSED`), dan sekali sebuah berkas yang sudah diimpor
  belum dibuat, sehingga tidak ada halaman yang terkompilasi.
- Dugaan bug halaman lama dibuktikan dengan test yang menegaskan perilaku
  benar dan dijalankan terhadap kode lama, lalu dibuang dari spec
  pembanding sebelum commit dan kembali di spec migrasi. Test "ubah
  mengirim PUT ke id diskon" gagal terhadap kode lama dengan
  `POST /diskon` berstatus 409, dan lolos setelah migrasi (`8cb6f31`,
  `1e05df6`).
- Pemeriksaan "tidak ditawarkan" didampingi pemeriksaan positif pada
  daftar yang sama. Spec pilihan kasir memastikan diskon uji yang berlaku
  tampil di popover sebelum menegaskan diskon yang belum berlaku tidak
  ada, sehingga popover yang salah atau daftar yang belum termuat tidak
  lolos diam-diam (`52c550e`).

- Bila beberapa test gagal serentak menunggu satu rute yang sama
  (`waitForURL`), baca status permintaan `_rsc` rute itu di trace lebih
  dulu. Status -1 berarti server dev tidak menjawab, biasanya karena
  masih mengompilasi; pastikan dengan `curl` ke rute itu sebelum kode
  dicurigai. Enam test gagal begitu setelah sidebar dipecah, juga dengan
  sidebar lama, lalu lolos tanpa perubahan (`57a7084`).
- `Toaster` berada di dalam `main` layout dashboard, sehingga toast tidak
  ikut berpindah ke halaman di luar layout itu. Pesan yang harus tampil
  setelah berpindah ke area login dititipkan lewat
  `lib/auth/pesan-login.ts` dan ditampilkan `app/login/layout.tsx`.
- Pemeriksaan "tidak ada" disempitkan ke bagian yang diuji. Locator
  gambar selebar halaman di spec profil mengenai avatar di sidebar, bukan
  halaman profil (`091be4e`).
- Isian yang masih dapat diedit selama simpan berjalan kehilangan
  ketikannya saat form dipasang ulang. Isian dibuat baca-saja selama
  simpan; `fill` menunggu isian dapat diedit, sehingga test menjadi pasti
  tanpa penunggu tambahan (`091be4e`).
- Pengguna kedua yang harus masuk lewat UI memakai `browser.newContext()`
  dan `loginSebagai` (`tests/helpers/profil-uji.ts`), agar cookie sesi
  pengguna pertama tidak tertimpa.

- `getByRole("alert")` selebar halaman juga mengenai route announcer
  Next.js (`__next-route-announcer__`, ber-`role="alert"` di luar `main`),
  sehingga locator-nya ganda. Pesan galat dicari di dalam `main` atau di
  dalam dialog (`c824f18`).
- Klaim "tidak ada permintaan setelah X" dihitung sejak respons X
  diterima, bukan sejak halaman dibuka. Pemulihan sesi di halaman login,
  sebelum ada akun, memang memanggil `pin-refresh`, dan penghitung yang
  mulai dari `goto` ikut mencatatnya (`catatPermintaanPin` dengan
  `sejakRespons`, `0f54b3c`).
- Kredensial yang tidak boleh masuk repo dibaca helper dari berkas yang
  diabaikan git, dan spec-nya dilewati dengan alasan bila berkas itu tidak
  ada. Log panggilan Playwright memuat nilai yang diisikan, sehingga
  keluaran galat disaring dengan `grep -vE 'fill\('` sebelum ditempel.
- Berkas halaman rute baru dibuat sebelum spec dijalankan. Rute yang
  pertama kali dikompilasi `next dev` di tengah run dapat membuat
  `.next/dev/types/validator.ts` tertulis rusak, dan `tsc` lalu gagal di
  berkas bangkitan itu walau kodenya benar (`4e2a254`).
- Pembersihan lewat UI didampingi cadangan API di `finally` yang hanya
  berjalan bila penanda `terhapus` belum diset, sehingga data uji tidak
  tertinggal saat test berhenti di tengah (`hapusAkunDariDetail` dan
  `hapusAkunKlienUji`, `c824f18`).
- Login akun di konteks `request` terpisah memutar `tokenVersion` akun
  itu dan memutus sesi halaman yang sedang diuji; helper semacam itu
  dipanggil setelah halaman tidak dipakai lagi.
- Nama pada `getByRole` dicocokkan sebagian. Tombol "Next" milik footer
  `DataTable` bertabrakan dengan tombol lain yang namanya memuat kata itu
  di mode pengembangan, sehingga dipakai `exact: true` (`e129f9d`).
- Kegagalan suite penuh yang pesannya berasal dari backend, misalnya 500
  "Connection operation buffering timed out", dinilai dari pesannya, lalu
  spec itu dijalankan ulang sendiri dengan `--repeat-each 2`. Hasilnya
  dicatat apa adanya di baseline: jumlah lolos suite penuh tidak
  dinaikkan menjadi angka harapan.
- Harapan spec baca-saja dihitung dari respons yang dibaca halaman itu
  sendiri, dan skenarionya dilewati dengan alasan bila datanya tidak
  cukup (misalnya mutasi bulan berjalan belum sampai dua halaman),
  sehingga spec tetap benar di awal bulan.
- Teks hasil `Intl` yang dihitung spec berasal dari Node, bukan dari
  browser, dan keduanya dapat berbeda: batas pecahan bawaan IDR 0 di
  Node 22 dan lebih dari 0 di Chromium. Harapan rupiah dihitung lewat
  `formatRupiah`, yang batasnya eksplisit (keputusan rancangan butir
  24); skenario ringkasan mutasi gagal karenanya begitu data memuat
  pecahan (`4c9c4ed`).

- Jalur gagal memuat sebuah detail dapat diuji tanpa `page.route`: buka
  halamannya dengan id berformat sah yang tidak ada, tunggu respons
  gagal dari backend, lalu bandingkan pesan yang tampil dengan `message`
  respons itu. Spec menegaskan responsnya gagal, bukan status
  tertentu, selama status itu belum dibaca dari respons nyata (form role,
  `f5fe574`).

## Test yang ditandai fixme dan skip bersyarat

Menunggu perbaikan backend:

| Test | Menunggu |
|---|---|
| Edit pola roster | Validator memakai `this.siklusHari` dalam konteks `findOneAndUpdate` |
| Hitungan tersimpan dapat dikosongkan kembali (`inventaris/stockOpname/draft-stok-opname.spec.ts`) | Validator stock opname menerima `qtyPhysical` null (`kontrak/temuan.md` butir 22). Badannya berupa penanda; skenario ditulis saat `SERVER_TERIMA_HITUNGAN_KOSONG` dibalik |
| Jurnal Keluar penjualan langsung terbaca setelah finalisasi, dan finalisasi yang ditolak tidak menambah jurnal (`penjualan/alur-penjualan.spec.ts`, dua test) | Backend membersihkan cache daftar jurnal setiap kali `inventoryService` menulis jurnal (`kontrak/temuan.md` butir 46). Keduanya dibuka bersamaan: test kedua baru bermakna bila bacaan jurnal terbukti segar |
| Delapan skenario lintas outlet di spec jurnal stok, stock opname (daftar), pengajuan stok (daftar), stok, dan stock adjustment | Backend menetapkan permission lintas outlet dan `IZIN_LINTAS_OUTLET` diisi (`kontrak/temuan.md` butir 39). `test.fixme` bersyarat lewat `tests/helpers/lintas-outlet.ts`; badannya lengkap dan berjalan sendiri begitu konstanta diisi |
| Shift yang dibuat di ruang outlet tidak tampil di ruang gudang (`jadwal/shift/crud-shift.spec.ts`) | Backend memisahkan shift per lokasi dan `KUNCI_LOKASI_SHIFT` di `features/shift/ruang.ts` diisi (`kontrak/temuan.md` butir 70). `test.fixme` bersyarat; badannya lengkap |
| Nomor HP pelanggan yang dikosongkan tersimpan kosong (`pelanggan/kelola-pelanggan.spec.ts`) | Backend menerapkan pengosongan `nomorHp`, `email`, dan `alamat` di `PUT /pelanggan/:id`, yang kini dibuang validator lalu dijawab 200 (`kontrak/temuan.md` butir 104, keputusan PD5a). Badannya lengkap |
| Pola yang dibuat di ruang outlet tidak tampil di ruang gudang (`jadwal/pola-roster/crud-pola-roster.spec.ts`) | Backend memisahkan pola roster per lokasi dan `KUNCI_LOKASI_POLA_ROSTER` di `features/pola-roster/ruang.ts` diisi (`kontrak/temuan.md` butir 70). `test.fixme` bersyarat; badannya lengkap |

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

Selain itu ada `test.skip` bersyarat data, bukan penantian backend, yang ikut
terhitung di angka skipped pada baseline:

| Spec | Dilewati bila |
|---|---|
| `inventaris/stok/lihat-stok.spec.ts`, tab kritis gudang | Tidak ada stok gudang yang kritis (terjadi pada data uji sekarang) |
| `inventaris/stockOpname/alur-stok-opname*.spec.ts`, `draft-stok-opname.spec.ts` | Lokasi aktif outlet atau gudang terpilih masih punya opname DRAFT atau SUBMITTED; backend menjawab 409 (tidak terjadi pada data uji sekarang) |
| Skenario jalur terkunci di spec stok, pengajuan stok (daftar), dan stock adjustment | `IZIN_LINTAS_OUTLET` sudah diisi, sehingga Ridho memegangnya; butuh akun uji tanpa izin itu. Tidak terjadi selama konstanta null, sehingga belum terhitung di baseline |
| Halaman shift gudang dengan keterangan pemakaian bersama (`jadwal/shift/crud-shift.spec.ts`) | `KUNCI_LOKASI_SHIFT` sudah diisi, sehingga keterangan tidak tampil lagi. Tidak terjadi selama konstanta null |
| Halaman pola roster gudang dengan keterangan pemakaian bersama (`jadwal/pola-roster/crud-pola-roster.spec.ts`) | `KUNCI_LOKASI_POLA_ROSTER` sudah diisi, sehingga keterangan tidak tampil lagi. Tidak terjadi selama konstanta null |
| Enam belas skenario di `tests/e2e/admin/` (sesi, akun klien, langganan, dan kelola akun) | `.env.e2e` tidak berisi kredensial admin uji (PA5a). Tidak terjadi di mesin pemilik proyek, sehingga tidak terhitung di baseline |

Skenario lain di spec stok, stock adjustment, jurnal stok, stock opname, dan
hapus bahan baku juga dilewati bila datanya kosong, tetapi tidak terjadi pada
data uji sekarang.

Ketiga spec tulis stock opname membuat dokumen baru di setiap run dan
menutupnya sebagai CANCELLED, sehingga dokumen CANCELLED bertambah tiga per
run suite penuh. Bila spec gagal di tengah, dokumennya tertinggal aktif dan
run berikutnya dilewati sampai dokumen itu dibatalkan dari halaman detail.
Nomornya dapat dibaca dari pesan `POST /api/stockopname` di trace (lihat
Urutan debug kegagalan e2e di atas).

## Utang pengujian

- **Cakupan lokasi di e2e hanya teruji satu jalur pada satu waktu**,
  karena satu-satunya akun uji (Ridho) berperan Owner. Selama
  `IZIN_LINTAS_OUTLET` null, Ridho terkunci ke outlet tenant dan jalur
  terkunci teruji e2e, sedangkan jalur lintas outlet berupa `test.fixme`
  bersyarat. Begitu konstanta diisi, keduanya bertukar dan jalur terkunci
  butuh akun uji tanpa izin itu. Keduanya teruji di unit test
  (`tests/unit/features/inventaris/cakupan.test.ts`).
- **Tab pengajuan stok yang disembunyikan menurut izin** hanya teruji di
  unit test (`tests/unit/features/pengajuan-stok/pengajuan-stok.test.ts`),
  dengan alasan yang sama: aturannya hanya berlaku bagi petugas transfer
  tanpa izin setujui.
- **Approve stock opname yang berhasil** tidak diuji e2e, karena mengubah
  stok sungguhan. Yang diuji hanya jalur gagalnya.
- **Setujui pengajuan dan buat surat jalan yang berhasil** tidak diuji e2e,
  karena keduanya meninggalkan dokumen permanen (pengajuan dan transfer
  tidak dapat dihapus). Yang diuji hanya jalur gagalnya.
- **Tambah barang gudang yang berhasil** tidak diuji e2e, karena UI tidak
  punya cara menghapus entri inventory yang terbentuk.
- **Terima penerimaan yang berhasil** diuji sungguhan lewat UI sejak
  `6e314ae` (keputusan PB12a), termasuk jumlah 0. Setiap run menambah stok
  outlet secara permanen, dan surat jalan DITERIMA tidak dapat dibatalkan.
- **Item tanpa master bahan baku pada penerimaan** hanya teruji di unit
  test (`tests/unit/features/transfer-stok/payload.test.ts`), karena
  membuat datanya berarti menghapus master bahan baku.
- **Kirim surat jalan yang berhasil lewat UI** tidak diuji e2e, karena
  memotong stok gudang. Kirim dijalankan lewat API di persiapan spec dan
  ditutup lewat terima penuh di akhir, karena batal dari DIKIRIM ditolak
  backend `465b438` (PB10a); dari UI hanya jalur gagalnya yang diuji.
- **Tombol aksi surat jalan yang disembunyikan menurut izin** hanya teruji
  di unit test (`aksiSuratJalan`), dengan alasan yang sama dengan cakupan
  lokasi: satu-satunya akun uji berperan Owner.
- **Gate halaman yang menolak pengguna tanpa sebagian izin** hanya teruji
  di unit test (`tests/unit/lib/auth/gate-stock-adjustment.test.ts`, kedua
  ruang),
  dengan alasan yang sama.
- **Pengosongan hitungan stock opname** baru berupa penanda `test.fixme`
  tanpa badan, karena backend belum menerima `qtyPhysical` null
  (`kontrak/temuan.md` butir 22). Yang teruji saat ini hanya perilaku
  sementara: pengosongan ditahan dengan pesan, tanpa `PATCH`.

- **Cakupan per lokasi di daftar penjualan tidak punya skenario e2e.** Data
  uji hanya punya satu outlet, sehingga penyaringan per lokasi tidak dapat
  dibedakan dari tanpa penyaringan. Aturannya, termasuk K11b dan penjualan
  tanpa lokasi, diuji di `tests/unit/features/penjualan/filter.test.ts`.
- **Jalur tanpa `read-location` di halaman penjualan** (tanpa cakupan, dan
  tanpa `locationID` saat membuat) hanya teruji di unit test, dengan alasan
  yang sama: satu-satunya akun uji berperan Owner.
- **Idempotensi hanya teruji dari sisi klien**: kunci terkirim dan sama saat
  permintaan diulang. Penahanan permintaan kembar di backend tidak diuji
  dari web.
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
- **Spec shift dan pola roster meninggalkan shift uji**: shift hanya
  dapat dinonaktifkan, tidak dihapus, sehingga setiap run menambah shift
  "Shift Ganda ..." (spec shift), serta "Shift Arsip ..." dan "Shift
  Arsip Generate ..." nonaktif (spec pola roster dan generate jadwal), di
  samping shift uji lama spec shift. Fixture "E2E Jadwal Siang" dibuat
  sekali lalu dipakai ulang. Pola roster uji dihapus di akhir setiap
  skenario baru.
- **Status aset "Digunakan" dan penghapusan aset yang punya booking**
  belum teruji. Spec daftar reservasi kini membuat booking sungguhan yang
  mencakup waktu sekarang, tetapi label status aset uji hanya dibandingkan
  dengan respons `GET /aset`, karena daftar aset di-cache backend 60 detik
  dan belum terbukti dibersihkan saat booking dibuat.
- **Booking uji dibersihkan lewat API**: pembayaran PAID-nya dibatalkan,
  lalu penjualannya di-void (PB8a), walau web kini punya jalur void untuk
  penjualan booking yang belum dibayar (PB2a). Setiap run spec daftar
  reservasi meninggalkan penjualan booking VOID dan booking VOID.
- **Blok booking tanpa penjualan** (tanpa tautan R4b) hanya teruji di unit
  test (`tests/unit/features/sesi-booking/tampilan.test.ts`), karena jalur
  buat booking selalu membuat penjualan.
- **Bentrok yang tidak menghitung booking Selesai** (keputusan R6a) hanya
  teruji di unit test `bookingBentrok`, karena membuat booking Selesai di
  e2e berarti membuat booking di masa lalu.
- **Total laba rugi periode Bulanan di halaman ringkasan tidak dicocokkan
  dengan respons**, karena kartu ringkasan di layout meminta periode yang
  sama pada saat yang sama, sehingga respons milik halaman tidak dapat
  dibedakan. Periode Harian dan Mingguan dicocokkan penuh, dan kartu laba
  bulanan dicocokkan di halaman akun kas (`0cfb3bd`).
- **Arah badge pertumbuhan laba hanya pasti teruji di unit test.**
  Skenario KU5a membandingkan badge dengan `teksPertumbuhan` dari dua
  respons nyata, sehingga jalur yang teruji e2e bergantung pada data laba
  dua hari terakhir. Panah naik dan turun teruji di
  `tests/unit/features/laporan/periode.test.ts`, sedangkan warna badge
  belum teruji.
- **Password salah pada akun uji menambah hitungan pembatas login**, dan
  login sukses tidak menguranginya. Spec login gagal lebih awal bila sisa
  kuota di header `RateLimit` di bawah 3; menjalankan spec auth berulang
  (`--repeat-each`) dalam 15 menit dapat mengunci login seluruh suite.
- **Setup gudang yang berhasil tidak diuji e2e** (keputusan GD6a). Tenant
  uji sudah punya gudang yang menyimpan stok, sehingga setup hanya dapat
  dibuka dengan daftar lokasi tanpa gudang yang disimulasikan, dan
  `POST /location` dijawab gagal agar tidak ada gudang kedua yang
  tersimpan. Payload dan penolakan radius teruji; pengalihan setelah
  setup berhasil dan pembaruan menu sidebar sesudahnya belum.
- **Jalur layout gudang selain Owner hanya teruji di unit test**
  (`tests/unit/features/inventaris/gudang.test.ts`): pengguna tanpa
  `read-location`, tanpa `create-location`, dan tenant tanpa gudang,
  karena satu-satunya akun uji berperan Owner dan tenant uji sudah punya
  gudang.
- **Mode baca-saja pengaturan gudang belum teruji**, karena satu-satunya
  akun uji memegang `update-location`. Yang teruji e2e hanya jalur ubah,
  dan `bacaSaja` di `IsianLokasi` belum punya test.
- **Akun kas uji menumpuk sebagai non-aktif**, satu per run spec
  keuangan, lima per run spec ubah akun kas (`1bc76f4`), dua per run
  spec Pindah Dana (`e53c016`), dan satu per run spec tutup akun
  bersaldo (`f7805ca`), karena akun
  kas tidak dapat dihapus sejak backend `465b438`
  (PB13a, `kontrak/temuan.md` butir 81). Payload bersaldo hanya diperiksa
  lewat `POST` yang dijawab gagal.
- **`hapusLewatApi` menerima 404 sebagai sudah terhapus**, padahal route
  yang dihapus backend juga menjawab 404. Route hapus yang hilang tidak
  terdeteksi helper ini; yang menangkapnya adalah audit endpoint
  (`cara-kerja.md`, Helper penggantian).
- **Persetujuan pengajuan uji memakai pengguna penyetuju uji** "E2E
  Penyetuju", karena backend melarang pengaju menyetujui pengajuannya
  sendiri (`kontrak/temuan.md` butir 76, PB11a). Jalur Owner menyetujui
  pengajuannya sendiri belum teruji.
- **`DataTable` mode server hanya dipakai dan teruji di daftar
  penjualan** (`tests/e2e/penjualan/daftar-penjualan.spec.ts`). Mode
  klien kesembilan tabel lain tidak berubah di `b63cf08`, dan tidak diuji
  ulang khusus. Urutan server (`urutanServer`, `a4304ce`) juga hanya
  dipakai dan teruji di daftar penjualan.
- **Batas 10 metode aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, karena sepuluh metode aktif tidak dapat
  dibuat di data uji tanpa menumpuk metode permanen. Peringatan metode
  aktif terakhir, akun nonaktif bertanda di form ubah, dan penolakan akun
  nonaktif saat mengaktifkan kembali hanya teruji di unit test
  (`tests/unit/features/metode-pembayaran/`).
- **Metode uji menumpuk sebagai nonaktif**, satu per run spec kelola
  metode pembayaran, karena metode tidak dapat dihapus (PO10a).
- **Tombol metode pembayaran yang disembunyikan menurut izin hanya teruji
  di unit test** (`aksiMetodePembayaran`), dan form tanpa `read-akunkas`
  belum teruji, karena satu-satunya akun uji berperan Owner.
- **Spec pola roster sesekali kehilangan sesi setelah `reload`**: pada run
  suite penuh pertama untuk `b84de56`, skenario "gagal memuat: tabel
  menampilkan pesan galat" habis waktu (21,7 detik), karena snapshot
  menampilkan halaman login setelah `page.reload()`. Test itu lolos 3 dari
  3 sendirian, dan run ulang suite bersih; jawaban `pin-refresh`-nya tidak
  terbaca karena trace tidak disimpan. Bila terulang, jalankan dengan
  `--trace on`.
- **Pajak per transaksi hanya diuji jalur gagalnya** (PO10a): membuat atau
  mengaktifkannya menonaktifkan `PPN` tenant uji. Penonaktifan otomatis
  yang tidak atomik (`kontrak/temuan.md` butir 90) terbukti dari kode
  saja.
- **Relasi ke pajak nonaktif tidak dapat diuji dari web**, karena backend
  tidak mengirimnya (butir 93).
- **Spec yang ditulis sebelum keputusan rancangan butir 23 masih
  menyiapkan sebagian data uji lewat API**, misalnya fixture metode
  pembayaran di spec kelola dan booking uji di spec reservasi;
  disesuaikan saat spec itu disentuh.
- **Mode baca-saja Profil Toko belum teruji**: kartu profil tanpa
  `update-tenant`, kartu lokasi tanpa `update-location`, dan kartu lokasi
  tanpa `read-location`, karena satu-satunya akun uji berperan Owner.
  Tenant tanpa outlet juga belum teruji, karena tenant uji punya outlet.
- **Spec profil toko mengubah nama toko tenant uji untuk sementara**,
  lalu mengembalikannya lewat UI dan, bila test berhenti di tengah, lewat
  API di `finally`. Kode pos tenant uji menjadi teks kosong, bukan null,
  setelah run pertama.
- **Spec login sempat habis waktu sekali di suite penuh 2 Oktober 2026**
  (sekitar 13.34 WIB, test "PIN login in-flight"): halaman login PIN
  menampilkan "Akses ditolak. Token akun tidak ditemukan.", yang berarti
  `akun/auth/refreshtoken` pada pemuatan itu tidak memulihkan token akun.
  Test itu lolos sendirian dan di dua suite penuh sesudahnya; penyebabnya
  belum diketahui, karena trace tidak disimpan. Bila terulang, jalankan
  dengan `--trace on`.
- **Tombol pelanggan yang disembunyikan menurut izin hanya teruji di unit
  test** (`aksiPelanggan`), karena satu-satunya akun uji berperan Owner.
- **Pelanggan uji dihapus lunak**, sehingga setiap run spec pelanggan
  menambah dokumen ber-`isDeleted` di basis data development; daftar dan
  indeks unik backend mengabaikannya.
- **Peringatan pengosongan email dan alamat hanya teruji di unit test**
  (`isianTidakTerkosongkan`); e2e hanya menguji nomor HP.
- **Diskon uji menumpuk sebagai Non-Aktif**, lima per run suite penuh
  (satu dari spec pembanding, dua dari kelola, satu dari aturan, dan satu
  dari pilihan kasir), karena backend tidak punya `DELETE /diskon`. Diskon
  Non-Aktif tidak dihitung batas 50 diskon aktif.
- **Batas 50 diskon aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, dan hanya untuk tombol tambah; menu
  aktifkan dan pilihan Aktif di form yang terkunci saat batas tercapai
  belum teruji.
- **Keterangan khusus member dan pemilih produk tanpa izin baca produk
  belum teruji**: web tidak dapat menandai khusus member (PD8a), dan
  satu-satunya akun uji berperan Owner. `aksiDiskon` hanya teruji di unit
  test, dengan alasan yang sama.
- **Pilihan diskon kasir hanya teruji e2e di buat reservasi**; buat
  penjualan memakai `diskonAktif` yang sama dan teruji di unit test.
  `sedangBerlaku` dapat tertinggal sampai lima menit di cache, dan itu
  tidak diuji.
- **Satu surat jalan uji tertinggal DIKIRIM sejak 30 September 2026**
  (`SJ-PGJ/202609/0096-8045`), sisa run sebelum PB10a; suite tetap lolos
  dengannya. Ditutup lewat terima penuh dari halaman penerimaan.

- **Pengguna uji "E2E Profil" permanen** di basis data development,
  dibuat sekali dengan peran tanpa izin pengguna. Nama, PIN, dan nomor
  HP-nya dipulihkan Ridho di awal setiap test (PF5a).
- **Profil Owner hanya teruji dibuka**, tidak diubah, karena nama dan PIN
  Ridho dipakai login seluruh suite.
- **Profil yang gagal dimuat dan logout yang gagal belum teruji e2e**:
  pesan beserta tombol coba lagi, dan logout akun yang tetap berjalan
  walau logout pengguna gagal, hanya terbukti dari kode.
- **Pesan titipan setelah PIN berubah hilang bila halaman dimuat ulang**,
  karena hanya hidup di memori; itu tidak diuji.

- **Spec panel admin bergantung pada `.env.e2e`**: tanpa kredensial admin
  uji, 16 dari 17 skenarionya dilewati (PA5a), sehingga mesin tanpa berkas
  itu tidak menguji panel admin sama sekali.
- **Pengulangan `DELETE` setelah password admin salah tidak diukur.**
  Respons 401 dan pesannya teruji; penyegaran token dan permintaan kedua
  hanya dibaca dari `lib/apiClient.ts` (`kontrak/temuan.md` butir 114).
- **Aktifkan dengan durasi wajib dan perpanjangan yang membuka akun
  kedaluwarsa hanya teruji di unit test**
  (`tests/unit/features/admin-akun/langganan.test.ts`), karena akun
  bermasa akses lewat atau beku karena kedaluwarsa tidak dapat dibuat
  lewat UI.
- **Tombol muat berikutnya riwayat langganan belum teruji e2e**, karena
  butuh lebih dari 20 catatan pada satu akun.
- **Bekukan dan hapus sungguhan hanya diuji pada akun uji tanpa toko.**
  Pemutusan sesi pengguna toko saat akun dibekukan dan penghapusan data
  toko saat akun dihapus tidak diuji.
- **Daftar akun yang gagal dimuat, domain email disposable, dan akun
  klien tanpa sesi pengguna yang membuka `/admin`** belum teruji e2e;
  yang terakhir teruji di `tests/unit/lib/auth/tujuan.test.ts`.

- **Spec mutasi arus kas bergantung pada data bulan berjalan**: empat
  skenarionya dilewati bersyarat bila belum ada mutasi, belum sampai dua
  halaman, atau belum ada pembatalan pembayaran pada bulan itu, sehingga
  di awal bulan jumlah skipped dapat naik.
- **Jenis mutasi saldo awal, beban, dan pembatalan transfer keluar belum
  teruji e2e** di halaman mutasi. Transfer masuk, transfer keluar, dan
  pembatalan transfer masuk teruji sejak `f7805ca`
  (`tutup-akun-bersaldo.spec.ts`). Label dan arah kesembilan jenis
  teruji di
  `tests/unit/features/akun-kas/mutasi.test.ts`.
- **Filter periode mutasi lewat `PilihTanggal` dan tombol reset belum
  teruji e2e**; query periode awal dan fungsi pembentuknya teruji.
- **Keadaan seluruh akun kas non-aktif belum teruji e2e**, karena tenant
  uji selalu punya akun aktif.
- **Tampilan tanpa `update-akunkas` belum teruji e2e** (tombol Ubah dan
  Aktifkan kembali tidak tampil, dan rute ubah ditolak gerbang rute sejak
  `bc388c6`),
  karena data uji tidak punya pengguna tanpa izin itu; `aksiAkunKas`
  teruji di unit test.
- **Penolakan 409 karena batas 10 akun kas aktif belum teruji e2e.**
  Skenario nonaktifkan yang ditolak memakai akun aktif bersaldo yang
  sudah ada dan dilewati bila tidak ada; penolakannya dapat berasal dari
  penjaga metode pembayaran, yang diperiksa backend lebih dulu, dan spec
  hanya memeriksa status 409 beserta pesan yang tampil. Penolakan yang
  pasti karena saldo teruji di alur tutup akun bersaldo (`f7805ca`), yang
  memakai akun uji tanpa metode pembayaran.
- **Transfer uji menumpuk**, karena transfer tidak dapat dihapus: satu
  VOID per run spec Pindah Dana, serta dua AKTIF dan satu VOID per run
  spec tutup akun bersaldo (`f7805ca`), masing-masing Rp1. Skenario
  utama kedua spec dilewati bila tidak ada akun kas aktif bersaldo di
  luar akun uji.
- **Penolakan backend atas Pindah Dana belum teruji e2e**: saldo sumber
  tidak cukup (ditahan form lebih dulu), akun nonaktif, dan pembatalan
  yang ditolak karena saldo akun tujuan tidak cukup. Statusnya (400)
  dibuktikan lewat skrip sekali pakai pada 4 Oktober 2026
  (`kontrak/temuan.md` butir 128).
- **Tampilan Pindah Dana menurut izin hanya teruji di unit test**
  (`aksiTransfer`): form tanpa izin buat, riwayat tanpa izin baca, dan
  tombol Batalkan tanpa izin ubah, karena satu-satunya akun uji berperan
  Owner. Filter riwayat dan keadaan kurang dari dua akun aktif juga
  belum teruji e2e.
- **Beda `keLocationID` dan `locationID` di daftar surat jalan tidak
  teruji dari data**: seluruh surat jalan uji menuju outlet tenant,
  sehingga keduanya memberi hasil yang sama; bedanya terbukti dari kode
  (`kontrak/temuan.md` butir 33). Lingkup satu lokasi tujuan hanya teruji
  di unit test (`filterServerTransfer`).
- **Data development memuat transfer berjumlah pecahan** di akun "kasir
  outlet" (bukti `kontrak/temuan.md` butir 126, FR2a), sehingga total
  masuk dan total keluar akun itu berpecahan sepanjang Oktober 2026.
  Spec yang membandingkan rupiah memakai `formatRupiah`.
- **Jalur gagal dialog hapus produk hanya diuji dengan jawaban 500
  tiruan**; penolakan hapus dari backend sungguhan belum teruji.

- **Form role yang gagal dimuat hanya teruji untuk id yang tidak ada.**
  Galat server saat memuat detail dan penanda memuat selama detail dimuat
  ulang belum teruji e2e. `nilaiAwalRole` teruji di
  `tests/unit/features/role/nilai-awal.test.ts`.

- **Penjaga ruang detail stock opname hanya teruji untuk dokumen yang
  tipe lokasinya diketahui**, dan kedua skenarionya dilewati bila ruang
  itu belum punya dokumen. Nama PIC yang gagal dimuat (teks cadangan)
  belum teruji e2e.

- **Dua kejadian sesekali pada spec tipe aset, 4 dan 5 Oktober 2026**,
  terhadap backend `fc29433`. Di suite penuh, login akun di `beforeEach`
  tidak berpindah dari `/login` ke `/login/pengguna` dalam 30 detik
  (sekali). Pada run pertama keesokan harinya, baris tipe aset yang baru
  dibuat lewat API tidak tampil dalam 5 detik di skenario pencarian
  (sekali); run berikutnya lolos 25 dengan test terlama 6,9 detik.
  Sebabnya tidak terbukti: laporan suite ada di `/tmp` dan hilang sebelum
  durasinya dibaca. Tidak ada kode maupun asersi yang diubah.
- **Sisi tanpa izin di halaman pajak hanya teruji di unit test**
  (`tests/unit/features/pajak/izin.test.ts`): tombol dan kartu indeks
  pengaturan tidak teruji e2e, karena akun uji berperan Owner. Pesan
  tanpa izin baca kini milik gerbang rute (`bc388c6`).
- **Sisi tertolak gerbang rute hanya teruji e2e untuk rute yang ditolak
  peran pengguna uji profil**: daftar pengguna, serta ubah posisi dan
  ubah produk bila peran itu tidak memegang izinnya. Rute lain teruji di
  `tests/unit/lib/auth/gerbang-rute.test.ts`. Skenarionya dilewati bila
  peran itu tidak memegang `read-dashboard-outlet`.
- **Syarat 44 entri baru `IZIN_HALAMAN` diturunkan dari nama hook dan
  kontrak, bukan dari trace per halaman.** Yang terbukti: pemilik seluruh
  izin membuka setiap rute terpetakan (unit), dan spec terdampak lolos.
- **Suite e2e penuh tidak lagi dijalankan di akhir setiap pekerjaan**
  (6 Oktober 2026), sehingga baseline suite penuh dapat berupa hitungan
  selama beberapa pekerjaan. Angka terukur terakhir 436 lolos dan 16
  skipped, terhadap `628f52e`.

## Spec rujukan

- `tests/e2e/inventaris/kategori/crud-kategori.spec.ts`: spec pembanding yang
  ditulis sebelum migrasi, nama dan kode unik per run, dan simulasi kegagalan
  dengan `page.route` hanya untuk satu method dan path.
- `tests/e2e/inventaris/produk/crud-produk.spec.ts`: form bersama dua mode,
  input tanpa label dipilih lewat nama aksesibel (`aria-labelledby`), dan
  pemeriksaan data setelah halaman edit dibuka ulang. Sejak `152088b`:
  nama produk unik per run, pemilih bahan baku dibuka lewat teks
  pemicunya (`pemilihBahan`), dan jalur gagal dialog hapus diuji dengan
  menjawab gagal `DELETE` saja, lalu melepas pencegat dan mengulang hapus
  yang sama sampai berhasil.
- `tests/e2e/inventaris/stockAdjustment/lihat-stock-adjustment.spec.ts`:
  halaman hanya baca, data uji diambil dari respons server lewat
  `page.waitForResponse`, `test.skip` bila data kosong, dan pemeriksaan sel
  tabel terhadap isi respons yang dinormalkan dengan `normalizeId`; label
  dan tautan sumber diharapkan dari fungsi tampilan yang sama
  (`susunSumber`), sedangkan angka dibandingkan langsung dengan field mentah.
  Sejak `247cf2d`, satu berkas memuat dua `describe` per ruang: helper
  `bukaDaftar` menerima url dan tipe lokasi, dan skenario gudang memeriksa
  daftar tidak memuat adjustment outlet, penolakan id ruang lain, serta
  tautan setelah setujui dari detail opname gudang.
- `tests/e2e/inventaris/jurnalStok/lihat-jurnal-stok.spec.ts`: halaman outlet
  dan gudang yang berbagi komponen, jumlah baris tabel dihitung dari respons
  server, filter Radix Select dibuka lewat teks nilainya, simulasi kegagalan
  GET dengan `page.route` pada endpoint lokasi yang dipakai jalurnya, dan
  skenario lintas outlet (pilih satu outlet, dengan pemeriksaan bahwa
  permintaan membawa `locationID`) sebagai `test.fixme` bersyarat.
- `tests/e2e/inventaris/stok/lihat-stok.spec.ts`: penunggu dipasang setelah
  `goto(..., { waitUntil: "commit" })`, harapan dihitung dari respons
  permintaan itu sendiri, operasi tulis yang mengembalikan nilai semula,
  aturan tombol nonaktif, dan jalur gagal tambah barang dengan `page.route`
  pada POST saja.
- `tests/e2e/inventaris/stockOpname/lihat-stok-opname.spec.ts`: tabel
  berpaginasi diperiksa lewat dokumen pertama dari respons, dan skenario
  lintas outlet (pilih satu outlet) sebagai `test.fixme` bersyarat.
- `tests/e2e/inventaris/stockOpname/alur-stok-opname.spec.ts` dan
  `alur-stok-opname-gudang.spec.ts`: alur tulis lengkap dengan `test.step`,
  dokumen baru per run yang ditutup di akhir, skip bila backend menjawab 409,
  dan baris tabel dipilih menurut urutan respons.
- `tests/e2e/inventaris/stockOpname/draft-stok-opname.spec.ts`: payload
  simpan sebagian diperiksa isinya (hanya item yang berubah), pengosongan
  hitungan ditahan tanpa `PATCH` (dibuktikan dengan penghitung request),
  penanda `test.fixme` untuk perilaku yang menunggu backend, dan dokumen yang
  tidak ditemukan.
- `tests/e2e/inventaris/pengajuanStok/lihat-pengajuan-stok.spec.ts`: path API
  dicocokkan tanpa membedakan huruf besar kecil agar berlaku sebelum dan
  sesudah migrasi, harapan dihitung per ruang dengan aturan yang sama
  dengan tampilan (`diOutlet` dan `diGudang` lewat `arahBenar`), payload buat
  diperiksa lewat `page.route` yang menjawab gagal sehingga tidak ada data
  tersimpan, dan label tab diambil dari
  kode.
- `tests/e2e/inventaris/pengajuanStok/alur-pengajuan-stok.spec.ts`: spec
  pembanding alur tulis yang ditulis dan dijalankan terhadap kode lama
  sebelum migrasi (pilihan A, `status.md` Catatan dari modul inventaris).
  Test pertama membuat satu
  pengajuan per run dan menutupnya REJECTED; dialog yang harus bertahan
  saat operasi gagal diperiksa dengan `expect.soft` agar alur tetap
  selesai walau pemeriksaan itu gagal. Setujui dan surat jalan memakai
  pengajuan yang sudah ada dan hanya menguji jalur gagalnya; daftar dan
  detail diambil lewat `page.request` dengan header `Authorization` yang
  ditangkap dari permintaan halaman. Itu pola lama yang kini dilarang
  Catatan Playwright, karena tokennya bisa milik halaman sebelumnya; spec
  baru memakai `bukaDenganAuth` (`tests/helpers/transfer-uji.ts`), dan spec
  ini dipindah ke pola itu saat disentuh lagi.
- `tests/e2e/inventaris/bahanBaku/hapus-bahan-baku.spec.ts`: dialog yang harus
  tetap terbuka saat operasi gagal.
- `tests/e2e/inventaris/penerimaanBarang/terima-penerimaan.spec.ts`: surat
  jalan disiapkan lewat API dari pengajuan yang layak dan ditutup di
  `finally`, token API mengikuti `pin-refresh` halaman, payload terima
  dibaca dari permintaan yang dijawab gagal lewat `page.route`, penahanan
  dibuktikan dengan penghitung request, dan sejak `6e314ae` terima
  sungguhan lewat UI tanpa `page.route`, dengan surat jalan DITERIMA dan
  `qtyTerima: 0` dibuktikan dari backend. Helper-nya ada di
  `tests/helpers/transfer-uji.ts`, termasuk `siapkanSuratJalan` dan
  `tutupSuratJalanUji` (PB10a).
- `tests/e2e/inventaris/transferStok/alur-transfer-stok.spec.ts`: spec
  pembanding alur tulis gudang dengan surat jalan PENDING dari API. Tab
  status diperiksa dengan `toHaveCount(0)` pada baris yang tidak boleh
  tampil, revisi kuantitas disimpan sungguhan dan dicek lewat API, dan
  pembatalan dari PENDING lewat UI sekaligus menjadi pembersihnya (tanda
  `dibatalkan` mencegah pembatalan ganda di `finally`).
- `tests/e2e/inventaris/transferStok/pengiriman-penerimaan.spec.ts`: harapan
  jumlah kartu dihitung dari seluruh surat jalan berstatus DIKIRIM yang
  dibaca tanpa query, lalu dibandingkan dengan jumlah tombol per kartu di
  ruang gudang dan outlet. Sejak `03c4eb3` halaman tidak lagi menyaring
  status di klien, sehingga skenario ini hanya lolos bila server
  menyaring (`kontrak/temuan.md` butir 33).
- `tests/helpers/lintas-outlet.ts`: satu sumber keadaan izin lintas outlet
  untuk seluruh spec, dengan `test.fixme` bersyarat untuk jalur lintas
  outlet dan `test.skip` bersyarat untuk jalur terkunci (keputusan
  rancangan butir 18). Contoh pemakaiannya: jalur terkunci di spec stok,
  pengajuan stok (daftar), dan stock adjustment memeriksa `locationID`
  permintaan terhadap id dari `/location/current`.
- `tests/e2e/penjualan/alur-penjualan.spec.ts`: spec pembanding alur bisnis
  dengan fixture tetap (`tests/helpers/penjualan-uji.ts`). Bahan baku dan
  produk uji dibuat sekali, lalu stok outlet dan `produk.stok` disetel
  ulang di awal setiap test (sejak `65edf8c`, `produk.stok` lewat stok
  outlet dan simpan ulang resep), sehingga pemotongan stok dibuktikan
  dengan angka pasti. Kedua gerbang stok finalisasi diuji terpisah dengan
  menyetel satu angka saja. Payload diperiksa dari permintaan nyata
  (`postDataJSON`, header `x-idempotency-key`), dialog yang harus bertahan
  diuji lewat `page.route`, dan kunci idempotensi dibandingkan antara
  percobaan yang gagal dan ulangannya.
- `tests/e2e/auth/login.spec.ts`: spec tanpa respons sukses palsu. Login
  sungguhan dengan status dan token diperiksa dari respons, pesan gagal
  dibandingkan dengan `message` respons nyata, email dan nama unik per run
  agar tidak terhitung pembatas, tombol memuat lewat `tahanLaluTeruskan`,
  simulasi `requireSetup` dari respons login nyata lewat `route.fetch()`,
  dan pemeriksaan sisa kuota dari header `RateLimit`.
- `tests/e2e/reservasi/tipeAset/crud-tipeAset.spec.ts`: data uji dibuat
  lewat API dengan nama unik dan dihapus di `finally` (jawabannya
  diperiksa lunak sejak `b5a55c4`), keberhasilan
  dibuktikan dengan membaca ulang lewat API (404 setelah hapus), galat
  backend sungguhan dari nama duplikat, dan simulasi daftar kosong yang
  dibentuk dari respons nyata. Sejak `9195472` helper-nya diimpor dari
  `tests/helpers/reservasi-uji.ts`, tanpa salinan lokal.
- `tests/e2e/reservasi/aset/crud-aset.spec.ts`: helper bersama
  `tests/helpers/reservasi-uji.ts`. Skenario data yatim (tipe aset uji
  dihapus) beserta `test.fixme` cache backend yang basi dibuang di
  `b85c2bd`, karena hapus tipe aset yang masih dipakai kini ditolak 409
  (PB9a).
- `tests/e2e/reservasi/tarif/crud-tarif.spec.ts`: skenario pendamping yang
  tetap membuktikan efek sebenarnya selama skenario utama menunggu backend
  (tarif terhapus walau `DELETE` menjawab 500; skenario utama dilepas di
  `8134842`), serta selector untuk input
  `Controller` tanpa `name` dan checkbox Radix berlabel.
- `tests/e2e/reservasi/daftar/lihat-reservasi.spec.ts`: fixture booking
  tetap dengan pembersihan lewat penjualan (`batalkanBooking`, keputusan
  R2c, sejak `b85c2bd` PB8a), booking yang dibaca helper dari daftar
  tanpa tanggal agar kunci
  cache yang dibaca halaman tidak terisi, harapan dari respons yang dibaca
  halaman itu sendiri, dan tautan yang diperiksa lewat `href` lalu dibuka.
- `tests/e2e/penjualan/waktu-penjualan.spec.ts`: input dipilih lewat nama
  aksesibel komponen (`Jam Transaksi (jam)`, tombol `Tanggal Transaksi,
  <tanggal>`), kalender kostum diuji di browser sungguhan (navigasi bulan,
  memilih tanggal, dan popover tertutup), dan harapan tanggal dibandingkan
  dengan payload nyata.
- `tests/integration/components/waktu/`: perilaku mengetik `InputWaktu`
  lewat `user-event`, dan `PilihTanggal` di jsdom dengan stub
  `ResizeObserver`, yang dibutuhkan popover Radix.
- `tests/e2e/reservasi/buat/buat-reservasi.spec.ts`: payload nyata
  dibandingkan utuh, termasuk id diskon item dan diskon global dari
  fixture tetap (keputusan R7b); tanggal dipilih lewat kalender kostum
  (R8b); slot booking uji digeser menurut menit berjalan dan urutan
  pemanggilan, agar tidak tertahan daftar booking per tanggal yang basi
  (`kontrak/temuan.md` butir 57).
- `tests/e2e/keuangan/keuangan.spec.ts`: harapan angka dihitung dari
  respons yang dibaca halaman itu sendiri (jumlah saldo dan field laba
  rugi), rupiah dibandingkan setelah spasi tak-putus dari `Intl` diganti
  spasi biasa, dan permintaan yang dibuat dua komponen sekaligus (periode
  bulanan di halaman ringkasan dan di kartu layout) dihindari dengan
  menguji periode yang hanya diminta satu komponen. Sejak `45187b6`, dua
  rentang periode yang sama (berjalan dan pembanding) dibedakan lewat
  `endDate` (`responsLabaRugi`), harapan badge dihitung dengan fungsi
  murni yang sama dengan tampilan, dan kegagalan per sumber data
  disimulasikan dengan `JAWAB_GAGAL` hanya untuk GET endpoint itu. Sejak
  `b5a55c4`, akun uji dibuat bersaldo 0 dan dinonaktifkan di `finally`,
  dan payload bersaldo diperiksa lewat `POST` yang dijawab gagal (PB13a).
- `tests/e2e/jadwal/jadwal/`: `test.use({ timezoneId: "Asia/Pontianak" })`
  agar perilaku zona waktu sama di mesin mana pun; sel grid dipilih lewat
  indeks hari (sel pertama baris adalah nama karyawan), dan item selnya
  lewat struktur `:scope > div > div`; bulan dinavigasi lewat tombol di
  sebelah label bulan toolbar sambil menunggu `GET /jadwalshift` bulan
  itu; dan hari uji setiap test dibersihkan lewat API di awal dan di
  `finally` (`tests/helpers/jadwal-uji.ts`).
- `tests/e2e/jadwal/shift/crud-shift.spec.ts` (sejak `f99b7cf`): skenario
  yang menunggu pemisahan per ruang ditulis lengkap sebagai `test.fixme`
  bersyarat pada `shiftTerpisahPerRuang()`, keterangan yang hanya berlaku
  selama konstanta null memakai `test.skip` bersyarat, dan penolakan
  validasi browser dibuktikan lewat `validity.valid` beserta penghitung
  permintaan.
- `tests/e2e/jadwal/pola-roster/crud-pola-roster.spec.ts` (sejak
  `dcc22e0`): skenario migrasi berada di `describe` tersendiri yang
  memakai helper bersama `tests/helpers`, dan data uji yang tidak dapat
  dibuat lewat UI (pola dengan shift yang kemudian dinonaktifkan)
  disiapkan lewat API lalu dihapus di `finally`.
- `tests/e2e/jadwal/jadwal/` (sejak `19227f8`): penolakan backend (J2a)
  dibuktikan dengan fixture shift kedua yang jamnya bertumpuk
  (`pastikanShiftSiang`), bukan dengan respons tiruan, dan penahanan
  simpan (GN2a) dibuktikan dengan penghitung permintaan bulk yang tetap
  nol.
- `tests/e2e/pengguna/absensi-widget.spec.ts` (sejak `845c2cf`): angka
  widget dibandingkan dengan respons nyata monitoring yang disaring
  karyawan ruang, dan jawaban 403 disimulasikan dengan `route.fulfill`
  berstatus 403 untuk membuktikan pesan izin.
- `tests/e2e/gudang/ruang-gudang.spec.ts` (sejak `2d7225b`): keadaan
  tanpa gudang dibentuk dari respons `GET /location` nyata yang disaring,
  dengan `POST` pada pencegat yang sama dijawab gagal; penunggu respons
  dipasang setelah `goto` dengan `waitUntil: "commit"`; dan isian tanpa
  label dipilih lewat placeholder, atau lewat teks saudaranya beserta
  induknya. Sejak `9ce288b`, galat layout disimulasikan dengan
  `JAWAB_GAGAL` untuk GET saja, lalu pencegatnya dilepas sebelum tombol
  coba lagi ditekan dan respons muat ulangnya ditunggu.
- `tests/e2e/gudang/pengaturan-gudang.spec.ts` (sejak `319bd99`): data
  uji tetap ("Gudang A") diubah lewat UI lalu dikembalikan lewat API di
  `finally`; keberhasilan dibuktikan dari payload, respons `PUT`, dan
  pembacaan ulang API; harapan tampilan dihitung dari `GET /location` yang
  dibaca lewat API.
- `tests/e2e/penjualan/daftar-penjualan.spec.ts` (sejak `b63cf08`):
  halaman dibuka dengan `goto` ber-`waitUntil: "commit"` sebelum penunggu
  dipasang, harapan footer dihitung dari respons halaman itu sendiri,
  perpindahan ke kunci yang masih segar di cache dibuktikan dari
  tampilan, dan tidak ada data yang ditulis. Sejak `a4304ce`, urutan
  server dibuktikan dari parameter permintaan dan urutan baris respons,
  mulai dari halaman 2 agar kembalinya ke halaman 1 ikut teruji.
- `tests/e2e/pengaturan/metode-pembayaran.spec.ts` (`9ca273a`) dan
  `kelola-metode-pembayaran.spec.ts` (`3359497`): spec pembanding dan
  spec migrasi dipisah, dan berkas pembanding hanya berubah bila asumsinya
  terbukti keliru (pencarian baris sejak `cc65d93`); fixture
  tetap diubah lalu dikembalikan lewat API di `finally`; baris dicari
  lewat kotak pencarian; payload dibandingkan utuh dengan `toEqual`,
  termasuk ketiadaan field gateway; batas 10 lewat simulasi dari respons
  nyata (`route.fetch()`); dan `pageerror` membuktikan tidak ada galat
  runtime.
- `tests/e2e/pengaturan/pajak.spec.ts` (`9586e3c`) dan
  `kelola-pajak.spec.ts` (`e0aaeca`): seluruh operasi pajak lewat UI
  (keputusan rancangan butir 23), helper bersama di
  `tests/helpers/pajak-uji.ts` (isian tanpa label lewat div terdalam yang
  memuat label dan input, pemicu Select berlabel lewat `pilihOpsi`), id
  dicatat lewat callback begitu respons diterima agar pembersihan tetap
  berjalan, payload dibandingkan utuh, dan pajak per transaksi hanya lewat
  `POST` yang dijawab gagal.
- `tests/e2e/roles/crud-role.spec.ts` (sejak `366e9b7`): setiap template
  dipakai dengan `POST /role` dijawab gagal lewat `JAWAB_GAGAL`, sehingga
  tidak ada role yang tersimpan; harapan diturunkan dari `ROLE_TEMPLATES`
  yang diimpor; dan pembuktian terhadap kode lama baru sah setelah
  permission basis data disilang dengan seed. Sejak `f5fe574`: halaman
  ubah dibuka untuk id berformat sah yang tidak ada, sehingga jalur gagal
  memuat teruji lewat respons backend sungguhan, dan ketiadaan form
  ditegaskan lewat `toHaveCount(0)` pada isian dan tombol simpan.
- `tests/e2e/auth/sidebar-muat-ulang.spec.ts` (`ca6eb3d`): sidebar
  diperiksa sebelum dan sesudah `reload`, dengan respons `pin-refresh`
  ditunggu setelah `reload` ber-`waitUntil: "commit"`; spec ini dibuktikan
  gagal terhadap kode lama sebelum perbaikannya diterapkan.
- `tests/e2e/pengaturan/profil-toko.spec.ts` (`fcf2dd2`): setiap perubahan
  dijalankan dan dikembalikan lewat UI, dengan payload dibandingkan utuh
  (hanya field yang berubah) dan hasilnya dibaca ulang lewat API; nama
  toko dibuktikan tampil di sidebar dan bertahan setelah muat ulang; dan
  `finally` mengembalikan data lewat API hanya bila nilainya masih
  berbeda.
- `tests/e2e/pelanggan/pelanggan.spec.ts` (`b6de75c`) dan
  `kelola-pelanggan.spec.ts` (`d9365d3`): spec pembanding dan spec
  migrasi dipisah; pelanggan uji dibuat, diubah, dan dihapus lewat UI
  dengan nama, nomor HP, dan email unik per run; dialog yang bertahan
  dibuktikan dengan menjawab gagal lalu melepas pencegat dan mengulang
  aksi yang sama sampai berhasil; dan `test.fixme` berbadan lengkap
  berdampingan dengan langkah yang membaca respons nyata.
- `tests/e2e/diskon/`: `diskon.spec.ts` (`8cb6f31`, pembanding),
  `kelola-diskon.spec.ts` (`1e05df6`), `aturan-diskon.spec.ts`
  (`54f2938`), dan `pilihan-kasir.spec.ts` (`52c550e`). Diskon uji dibuat
  lewat UI berstatus Non-Aktif karena tidak dapat dihapus; tanggal dari
  kalender kostum di dalam dialog diperiksa lewat komponen waktu lokal
  payload, bukan teks ISO; pengosongan aturan ditegaskan dengan payload
  persis; batas 50 lewat simulasi dari respons nyata (`route.fetch()`);
  dan diskon yang sempat diaktifkan dinonaktifkan lewat UI, dengan API di
  `finally` sebagai cadangan.
- `tests/e2e/profil/profil.spec.ts` (`0ed0e9a`) dan `kelola-profil.spec.ts`
  (`091be4e`): pengguna uji khusus dipulihkan oleh Ridho di awal setiap
  test (`tests/helpers/profil-uji.ts`) dan masuk lewat UI di konteks
  browser terpisah; nama dan PIN diubah sungguhan, PIN baru dibuktikan
  dengan login lewat UI, dan bukti dibaca lewat API oleh Ridho. Payload
  dibandingkan utuh, dan penolakan form dibuktikan dengan penghitung
  permintaan.
- `tests/e2e/auth/validasi-login.spec.ts` (`1c13ee6`): pesan skema dan
  penghitung permintaan yang tetap nol, tanpa satu pun percobaan login
  gagal di backend, sehingga pembatas login tidak terhitung.
- `tests/e2e/auth/sidebar-pengguna.spec.ts` (`57a7084`): logout
  dibuktikan dari kedua respons dan dari sesi yang tidak dapat dipulihkan
  saat dashboard dibuka lagi; cache bersama dibuktikan dari nama di
  sidebar yang berubah setelah profil disimpan.
- `tests/e2e/admin/sesi-admin.spec.ts` (`0f54b3c`): `test.skip` bersyarat
  kredensial di tingkat `describe`, penghitung permintaan berjendela
  sejak respons login, sesi yang dibuktikan pulih lewat refresh akun saja
  setelah `reload`, dan logout yang dibuktikan dari respons serta dari
  sesi yang tidak dapat dipulihkan.
- `tests/e2e/admin/akun-klien.spec.ts` (`4e2a254`),
  `langganan-akun.spec.ts` (`10c7efb`), dan `kelola-akun.spec.ts`
  (`c824f18`), dengan helper di `tests/helpers/admin-uji.ts`: akun uji
  beremail unik dibuat, dibekukan, diubah, dan dihapus lewat UI; payload
  dibandingkan utuh, termasuk body kosong dan `username: null`; status
  penolakan backend (409, 401) dan pesannya dibaca dari respons nyata;
  password baru dibuktikan dengan login di konteks terpisah; dan satu
  jalur gagal (bekukan dijawab 500) memakai akun yang sudah ada agar
  tidak ada akun sungguhan yang ikut beku.
- `tests/e2e/keuangan/mutasi-kas.spec.ts` (`e129f9d`): spec baca-saja
  untuk daftar berpaginasi dan berfilter server. Query awal dibandingkan
  dengan batas hari lokal yang dihitung spec, baris tabel dengan respons
  yang sama, filter dibuktikan dari query permintaan dan dari isi
  respons, ringkasan dari respons `ringkasan`, dan jalur gagal dipulihkan
  lewat tombol coba lagi setelah `unroute`.
- `tests/e2e/keuangan/ubah-akun-kas.spec.ts` (`1bc76f4`): spec tulis
  terhadap `PUT /akunkas/:id` tanpa respons palsu. Akun uji dibuat lewat
  API bersaldo 0 dan ditutup di `finally`. Payload dibandingkan persis
  (hanya field yang berubah, atau hanya `status`), hasil dibaca ulang
  lewat API, dan pesan penolakan 409 diambil dari respons lalu
  dicocokkan dengan yang tampil di toast atau dialog. Satu putaran
  mengirim 15 tulisan dari kuota 30 per menit.
- `tests/e2e/keuangan/pindah-dana.spec.ts` (`e53c016`): operasi yang
  mengubah saldo diuji sungguhan lalu dipulihkan lewat UI. Rp1 dipindah
  dari akun aktif ke akun uji bersaldo 0, payload dibandingkan persis,
  saldo kedua akun dibaca ulang lewat API, lalu transfer dibatalkan dari
  riwayat dan saldo dibuktikan pulih; `finally` membatalkan lewat API
  hanya bila penanda `dibatalkan` belum diset. Penahanan form dibuktikan
  dengan penghitung permintaan yang tetap nol, dan pemicu Select dipilih
  lewat nama label.
- `tests/e2e/keuangan/pengeluaran.spec.ts` (`7fce871`): halaman yang
  menunggu backend diuji lewat keterangannya dan lewat penghitung
  permintaan ke endpoint yang belum dapat dipakai, yang harus tetap nol.
- `tests/e2e/keuangan/tutup-akun-bersaldo.spec.ts` (`f7805ca`): alur
  lintas halaman ber-`test.step` yang membuat datanya sendiri lewat UI,
  sehingga halaman baca-saja (mutasi) diperiksa dengan jumlah dan urutan
  baris yang pasti. Token API diambil ulang lewat `bukaDenganAuth` di
  setiap navigasi penuh, penolakan 409 dibaca dari respons nyata, label
  dan jumlah per baris diharapkan dari fungsi tampilan yang sama
  (`LABEL_JENIS`, `teksJumlahMutasi`), dan `finally` memulihkan saldo
  lewat API hanya bila alur berhenti di tengah. Helper akun kas uji
  bersama ada di `tests/helpers/akun-kas-uji.ts`.
- `tests/e2e/inventaris/stockOpname/ruang-dan-pic.spec.ts` (`eb0181f`):
  spec baca-saja yang dibuktikan gagal terhadap kode lama sebelum
  perbaikannya diterapkan. Id dokumen ruang lain diambil dari respons
  daftar ruang itu, lalu dibuka lewat URL ruang yang salah; nama PIC
  dibandingkan dengan respons `GET /pengguna/:id` yang dibaca halaman.
- `tests/e2e/inventaris/stok/memuat-stok.spec.ts` (`eb0181f`): keadaan
  antara diuji dengan menahan satu permintaan lalu meneruskannya
  (`tahanLaluTeruskan`). Pemeriksaan positif (kepala tabel sudah tampil)
  mendahului pemeriksaan bahwa teks daftar kosong tidak ada, dan batas
  waktu pemeriksaan negatif lebih pendek daripada lama penahanan.
- Skenario "pilihan satuan hanya menawarkan satuan yang sah" di
  `tests/e2e/inventaris/produk/crud-produk.spec.ts` (`b887278`): harapan
  dibaca dari teks pilihan yang ditekan, dan skenario tidak menyimpan
  data. Bukti terhadap kode lama diambil dengan `git stash push` atas
  berkas perubahannya saja, lalu `git stash pop`, tanpa mengubah spec.
- `tests/e2e/auth/guard-dashboard.spec.ts` (`628f52e`): skenario
  dibangkitkan dari daftar rute, tanpa login dan tanpa data. Konteks
  tanpa sesi membuka rute di `app/`, rute berparameter, dan halaman dari
  `features/`, lalu menunggu URL berakhir di `/login`. Spec penjaga
  untuk refactor tanpa perubahan perilaku: lolos sebelum dan sesudahnya.
- `tests/e2e/auth/gerbang-rute.spec.ts` (`bc388c6`): sisi tertolak diuji
  dengan pengguna uji profil di konteks browser terpisah. Izin perannya
  dibaca dari backend, rute yang semestinya tertolak dihitung dengan
  `bolehBukaRute` yang sama dengan gerbang, dan ketiadaan permintaan data
  dibuktikan dengan penghitung permintaan. Pemeriksaan positif
  mendampinginya: profil tetap terbuka, dan Owner memicu `GET /role` dari
  halaman form. Skenario tertolak dibuktikan gagal tanpa gerbang lewat
  `git stash push` atas layout saja.
