# Riwayat Pengujian

Sifat perubahan: **Jarang**: hanya bertambah saat isi dipindah dari lapis lain.

Lapis arsip: kirim hanya bila riwayatnya dibutuhkan. Dibuat 25 Oktober 2026 dari `inti/pengujian.md` dan `referensi/playwright.md`.

Riwayat baseline, riwayat pelepasan fixme, utang pengujian yang lunas, dan
kejadian sesekali yang tidak berulang.

## Utang yang dilunasi 27 November 2026

- **Angka struk Laporan Tutup Kasir dengan transaksi nyata belum diuji
  e2e** (PW10): periode uji tanpa penjualan, sehingga penerimaan per
  metode dan produk terjual teruji di test integrasi
  (`tests/integration/components/sesi-kasir/struk-laporan.test.tsx`);
  e2e membandingkan setiap angka struk dengan laporan backend yang bernilai
  0. Transaksi tunai, non-tunai, dan invoice bersesi adalah PW13.
  Lunas di PW13 (`86aa357`): `keuangan/struk-tutup-kasir-alur` membuat
  transaksi tunai, non-tunai, belum dibayar, dan invoice web, lalu
  membandingkan laporan, layar, cetak, dan Excel dengan harapan dari
  transaksi itu.

## Utang yang dilunasi 26 November 2026

- **Keadaan kosong Rekap Absensi hanya teruji lewat simulasi** (butir
  194, RK2a). Sesudah backend `6478d29` (B379) diuji dari bulan kosong
  terbaru di respons nyata, dibuka lewat Bulan sebelumnya; tabel, daftar
  HP, dan luberan memakai bulan berstaf terbaru (PW04, `12ded07`).
- **Tiga skenario merah disengaja menunggu backend** (butir 191, 192,
  193): template General Manajer di `akses/template-role`, revisi surat
  jalan per kemasan di `inventaris/bahanBaku/konversi-satuan`, dan label
  status booking lewat jam di `reservasi/daftar/tandai-selesai`. Lolos
  tanpa diubah terhadap backend `6478d29` (B377, B369, B370), dua kali
  berturut-turut, 14 dari 14 (PW02). Setiap run spec Tandai Selesai tetap
  meninggalkan tiga penjualan booking VOID.
- **Ganti pengguna dari popup profil hanya teruji di tab yang sama**
  (butir 190, PU3a). Dilunasi sesudah backend `6478d29` (B378) lewat
  skenario muat ulang, `/dashboard`, dan tab baru di
  `auth/sidebar-pengguna` (PW03, `569c3f9`). Skenario itu menemukan bug web
  `pin-login` sesudah tab lain memutar sesi akun, yang diperbaiki di commit
  yang sama.
- **Teks kaki dan nama tombol halaman `DataTable` hanya terbukti lewat
  spec e2e pemakainya** (`modul/ui-ux.md`, sejak 11 Oktober 2026).
  Dilunasi dengan enam test integrasi di
  `tests/integration/components/data-table/data-table.test.tsx`: Previous
  dan Next di ujung halaman klien, keadaan kosong dan memuat, pencarian,
  angka dan aksi paginasi server, serta tombol mati selama server sibuk
  dan jumlah halaman 0 tampil sebagai 1. Dua mutasi sementara pada
  `components/ui/data-table.tsx` (penjaga `sibuk` dan `Math.max(1, …)`)
  membuat test merah, lalu dipulihkan. Label sel di HP sudah teruji sejak
  `2bcb1ce`.
- **Domain alamat uji ber-OTP terhadap validator email `register`**
  (`modul/setup-akun.md`). Diperiksa terhadap `validateRegister` backend
  `ridho` lokal `1718030`: seluruh domain spec (`contoh.test`,
  `kopisenja.id`, `tachyon-uji.com`, `uji.test`, dan lainnya) diterima;
  hanya `mailinator.com` yang ditolak, dan itu memang skenario penolakan
  di `admin/akun-klien`. Tidak ada perubahan kode.

## Riwayat baseline

Dipindah dari `referensi/playwright.md` (Perintah verifikasi yang biasa dipakai) pada 25 Oktober 2026.

Rujukan bagian di dalamnya, seperti "di bawah" dan "(Utang pengujian)",
ditulis menurut letak lamanya di `referensi/playwright.md` dan
`inti/pengujian.md`.

Dipindah dari `inti/pengujian.md` pada 24 November 2026 saat
bersih-bersih dokumentasi: baseline 18 sampai 24 November 2026, terbaru
lebih dulu.

Suite penuh 24 November 2026 dipindah dari `inti/pengujian.md` pada
26 November 2026, digantikan suite penuh 25 November 2026; suite penuh
25 November 2026 dipindah pada hari yang sama, digantikan suite penuh
26 November 2026; suite penuh 26 November 2026 dipindah pada
27 November 2026, digantikan suite penuh 27 November 2026.

**Suite penuh 26 November 2026** (web `fb186f2`, backend `ridho` lokal
`1718030`, pukul 11.55 sampai 12.47 WIB, sesudah LN20a dan LN21a): vitest
1302 lolos dari 155 berkas, dan e2e 822 lolos, 3 gagal, dan 1 dilewati
dari 826. Termasuk spec ber-OTP. Ketiga yang gagal adalah merah disengaja
yang menunggu backend: template General Manajer di `akses/template-role`
(butir 191, "permissions maksimal 120 item"), revisi surat jalan per
kemasan di `inventaris/bahanBaku/konversi-satuan` (butir 192, 1 kaleng
tersimpan 1, bukan 290 ml), dan booking lewat jam yang masih terbaca
Aktif di `reservasi/daftar/tandai-selesai` (butir 193). Tidak ada
kegagalan lain; harapan 826 tercapai.

**Suite penuh 25 November 2026** (web `eb4eb4c`, backend `ridho` lokal
`1718030`, pukul 16.55 sampai 17.51 WIB, sesudah sepuluh utang pengujian
25 November 2026 dan lonceng tahap 1 sampai 5): vitest 1287 lolos dari
154 berkas, dan e2e 815 lolos, 9 gagal, dan 1 dilewati dari 825. Termasuk
spec ber-OTP. Dari sembilan yang gagal: tiga merah disengaja (butir 191,
192, 193); satu sekali jalan (`auth/sidebar-pengguna`, lolos diulang);
empat terganggu permintaan lonceng dan diperbaiki di sisi spec
(`tampilan/bayangan-baris` dua, `pengguna/absensi-widget`,
`auth/gerbang-rute`; `06bdab3`, ketiga spec 7 lolos); dan satu
`auth/ruang-lokasi-kerja`, karena lonceng meminta sumber outlet di ruang
gudang. Yang terakhir diselesaikan LN20a (26 November 2026,
`modul/pemberitahuan.md`): vitest 1296 lolos dari 155 berkas, dan per
berkas `auth/ruang-lokasi-kerja` 5 lolos (test LN20a baru merah 11
permintaan outlet terhadap kode lama), `dashboard/lonceng-pemberitahuan`
dan `akses/syarat-rute` 4 lolos. Suite penuh tidak diulang
(`inti/cara-kerja.md`, langkah 5). Harapan suite penuh berikutnya 826,
dengan tiga merah disengaja.

**Suite penuh 24 November 2026** (web `13a3e93`, backend `ridho` lokal
`1718030`, pukul 22.37 sampai 23.24 WIB, reporter `line,json`, charger
tersambung, `systemd-inhibit`, sesudah seluruh kelompok utang
pengujian): vitest 1246 lolos dari 147 berkas, dan e2e 807 lolos, 4
gagal, dan 2 dilewati dari 813, sesuai harapan hitungan. Termasuk spec
ber-OTP. Tiga yang gagal adalah merah yang disengaja: template General
Manajer (butir 191), revisi surat jalan per kemasan (butir 192), dan
status booking lewat jam di detail penjualan (butir 193). Yang dilewati:
halaman berikutnya stock adjustment (data 10 atau kurang) dan Muat hari
sebelumnya Mesin Kasir (riwayat belum dua halaman). Kegagalan keempat,
kartu pengajuan dashboard gudang, berasal dari skenario baru yang
membuka dashboard dua kali, sehingga penunggu menangkap respons halaman
yang sudah dibuang; diperbaiki di `7b779f5` dan lolos 10 dari 10 dengan
`--repeat-each 2`. Sesudahnya `bersih-akunkas.js` diterapkan (AU1a;
cadangan
`~/Documents/cadangan-db/db_produk-sebelum-bersih-2026-11-24.gz`): 27
akun kas E2E non-aktif, 14 jurnal transfer Rp1, dan 42 baris mutasinya
dihapus; saldo "Kas Kecil (Laci)" bergeser sebesar efek transfer uji
(Rp1.056.005 menjadi Rp1.055.999) dengan rantai saldo berjalan
konsisten, dan bukti butir 126 tidak disentuh. Harapan suite penuh
berikutnya 813.

**Baseline per utang pengujian kelompok reservasi, jadwal, dan tampilan**
(24 November 2026, `2090dd8`, backend `ridho` lokal `1718030`): vitest
1246 lolos dari 147 berkas (unit baru `tombolPanduanGudangTampil`).
Tanpa suite penuh dan tanpa OTP: folder `reservasi` dan `jadwal` serta
`keuangan/mesin-kasir` dijalankan bersama: 185 lolos, 2 gagal, dan 1
dilewati dari 188. Yang gagal skenario bulan kosong Rekap Absensi
(sebelum RK2a; ditulis ulang menjadi simulasi) dan label status booking
lewat jam (butir 193, merah atas keputusan pemilik proyek); yang
dilewati Muat hari sebelumnya Mesin Kasir. Sesudah RK2a dan TG3a dan
dev server dinyalakan ulang, `jadwal/rekap-absensi` dan
`dashboard/panduan-dashboard` 16 lolos; keduanya gagal pada kode lama
(dibuktikan lewat `git stash`). Harapan suite penuh berikutnya 813 (`npx
playwright test --list`, 124 berkas), dengan tiga skenario merah yang
disengaja: General Manajer (191), revisi per kemasan (192), dan status
booking lewat jam (193).

**Baseline per utang pengujian kelompok inventaris dan gudang** (24
November 2026, `826f0ab`, backend `ridho` lokal `1718030`): vitest 1244
lolos dari 147 berkas (unit baru `produkSudahTerhapus`). Tanpa suite
penuh dan tanpa OTP: folder `inventaris` dan `gudang` serta
`dashboard/dashboard-gudang` dijalankan bersama: 190 lolos, 1 gagal, dan
1 dilewati dari 192. Yang gagal skenario revisi surat jalan per kemasan,
bukti temuan backend butir 192 (dibiarkan merah atas keputusan pemilik
proyek); yang dilewati halaman berikutnya stock adjustment (data 10 atau
kurang). Sesudah HP1a folder `inventaris/produk` 25 lolos; skenario hapus
404 gagal pada kode lama (dibuktikan lewat `git stash`). Harapan spec
lama yang diubah dengan bukti: dialog batal surat jalan menghitung
`PATCH`, bukan `PUT`, dan Penerimaan Stok menahan selisih tanpa alasan
lewat tombol yang terkunci. Harapan suite penuh berikutnya 804 (`npx
playwright test --list`, 124 berkas).

**Baseline per utang pengujian kelompok admin dan profil** (24 November
2026, `c1f683b`, backend `ridho` lokal `1718030`): vitest 1243 lolos dari
146 berkas (unit baru `potongKeLayar` dan `jangkarBalon`). Tanpa suite
penuh dan tanpa OTP: folder `admin` dan `profil`, spec
`auth/sidebar-pengguna`, `pengaturan/langganan`, `setup/panduan`, dan
`dashboard/panduan-dashboard` dijalankan bersama sesudah dev server
dinyalakan ulang: 72 lolos dari 72. Spec tur jam buka menemukan balon di
luar layar untuk target setinggi lebih dari layar; diperbaiki (JB10a) dan
gagal pada mesin tur lama (dibuktikan lewat `git stash`). Harapan spec
tur yang keliru disesuaikan dengan bukti: Samakan dilewati selama belum
ada hari berjam lengkap (keputusan JB9a), dan elemen yang lebih besar
dari layar tidak dituntut tampil utuh. Harapan suite penuh berikutnya
791 (`npx playwright test --list`, 122 berkas).

**Baseline per utang pengujian kelompok keuangan** (24 November 2026,
backend `ridho` lokal `1718030`): vitest 1237 lolos dari 146 berkas (unit
baru `kelasPertumbuhan`, warna badge laba rugi yang dipindah dari JSX ke
`features/laporan/periode.ts` tanpa perubahan perilaku). Tanpa suite penuh
dan tanpa OTP: folder `keuangan`, `diskon`, dan `unduh`, spec kelola pajak
dan kedua spec metode pembayaran, `penjualan/alur-penjualan`, dan
`tampilan/pergantian-hari` dijalankan bersama: 151 lolos, 1 gagal, dan 1
dilewati bersyarat dari 153. Yang gagal skenario lama PS10a di
`mutasi-kas` (penunggu respons sebelum `goto` pada halaman yang sudah
terbuka); diperbaiki lalu lolos bersama dua skenario baru (seluruh akun
non-aktif, saldo sumber Pindah Dana berkurang). Yang dilewati Muat hari
sebelumnya Mesin Kasir, karena riwayat belum dua halaman. Idempotensi
penjualan dan pembayaran kini membuktikan backend mengembalikan dokumen
yang sama untuk kunci yang sama. Harapan suite penuh berikutnya dihitung
ulang di akhir seluruh kelompok.

**Baseline per utang pengujian kelompok 1** (24 November 2026, backend
`ridho` lokal `1718030`): vitest 1236 lolos dari 146 berkas (unit baru
`aksiPengguna` dan `pengajuSendiri`). Tanpa suite penuh dan tanpa OTP:
folder `akses`, `roles`, `diskon`, `pengguna`, `inventaris/pengajuanStok`,
dan `inventaris/transferStok`, serta `gudang/ruang-gudang`,
`dashboard/panduan-dashboard`, dan `keuangan/mesin-kasir` dijalankan
bersama: 121 lolos, 1 gagal, dan 1 dilewati bersyarat dari 123. Yang
gagal skenario template General Manajer, yang menunggu backend
(`kontrak/temuan.md` butir 191, TR1a). Spec baru `akses/template-role`,
`akses/gerbang-baca-saja`, `roles/level-bukan-owner`, dan
`diskon/izin-diskon`. Skenario AP1a dan PG3a gagal pada kode lama
(dibuktikan lewat `git stash`), dan skenario tanpa `read-akunkas` serta
LK1a gagal saat aturannya dibuang sementara. Helper
`pengajuanUjiDisetujui` tidak lagi men-submit pengajuan PENDING, karena
backend hanya menerima submit dari DRAFT. Harapan suite penuh berikutnya
757 (`npx playwright test --list`, 121 berkas).

**Baseline per tombol bertaut** (24 November 2026, BT1a, BT2a, RP6a,
backend `ridho` lokal `1718030`): vitest 1230 lolos, tanpa unit baru.
ESLint menolak kesembilan tempat pada kode lama. Tanpa suite penuh dan
tanpa OTP: folder `admin`, `keuangan/tampilan-hp`, `keuangan/pindah-dana`,
`keuangan/ubah-akun-kas`, kedua spec metode pembayaran, dan
`akses/jalur-bukan-owner` 67 lolos. Spec mencari tautan, bukan tombol,
untuk Pindah Dana, Tambah Akun, Tambah Metode, Kembali ke Daftar, Buat
Akun Klien, dan Ubah Akun (termasuk `toHaveCount(0)` Ubah Akun, yang
akan lolos kosong bila tetap mencari tombol). Skenario ubah metode
pembayaran menahan PUT dan memeriksa Batal terkunci; gagal pada kode
lama (dibuktikan lewat `git stash`). Harapan suite penuh berikutnya tetap
736 (`npx playwright test --list`, 117 berkas).

**Baseline per revisi laman profil dan popup profil** (24 November 2026,
PU1a sampai PU3a, backend `ridho` lokal `1718030`): vitest 1230 lolos
(unit profil ditulis ulang untuk `skemaDataDiri`, `skemaPin`, payload
terpisah, teks ringkasan, dan slug tab). Tanpa suite penuh dan tanpa OTP:
`auth/sidebar-pengguna`, `auth/cache-ganti-pengguna`, dan folder `profil`
20 lolos sesudah dev server dinyalakan ulang. Skenario baru: popup desain C
di 1280 dan 390 px (isi, lebar sama dengan pemicu, warna teks pemicu),
Ganti pengguna berhasil dan gagal, dan tata letak profil di 390, 768, dan
1280 px; skenario popup gagal pada kode lama. Spec lama disesuaikan:
"Simpan Perubahan" menjadi "Simpan Data Diri" atau "Ganti PIN" di tab
Keamanan PIN, menu "Profil" dan "Logout" menjadi "Profil Saya" dan
"Keluar dari toko", judul h1 kini nama pengguna, dan status tampil
"Aktif". Harapan suite penuh berikutnya 736 (`npx playwright test
--list`, 117 berkas).

**Baseline per deskripsi paket laman pengenalan** (24 November 2026,
LU6a): vitest 1228 lolos, tanpa unit baru (isi paket data statis). Tanpa
suite penuh: folder `tests/e2e/laman-utama` 5 lolos, termasuk skenario
baru penanda paket di 390, 768, dan 1280 px, yang gagal pada kode lama
(dibuktikan lewat `git stash`, lalu dijalankan ulang sesudah dipulihkan).
Harapan suite penuh berikutnya 732 (`npx playwright test --list`, 117
berkas).

**Baseline per rombak panel admin** (24 November 2026, backend `ridho`
lokal `1718030`): vitest 1228 lolos dari 145 berkas (empat unit baru:
`statusLencana`, `inisialAkun`, `kolomRingkas`, `paramJumlahAkun`). Tanpa
suite penuh dan tanpa OTP: folder `tests/e2e/admin` 26 lolos, 0 dilewati
(spec baru `admin/tampilan-admin`, 4 skenario: laptop, tablet, HP beserta
panel bawah dialog, dan kartu ringkas gagal dimuat). Spec lama disesuaikan
dari combobox ke tombol pilihan (radiogroup) dan dari kolom Peran ke
lencana Admin. Harapan suite penuh berikutnya 731 (`npx playwright test
--list`, 117 berkas).

**Baseline per tuntasnya bug dan temuan frontend** (23 November 2026
malam, backend `ridho` lokal `1718030`): vitest 1224 lolos. Kejadian
vitest gagal 3 test sekali (19 November 2026) tidak tereproduksi: vitest
penuh lima kali berturut-turut dan sekali tepat sesudah Playwright,
semuanya 1224 lolos dan 0 gagal, dengan reporter JSON yang mencatat nama
test yang gagal. Bila muncul lagi, jalankan
`npx vitest run --reporter=json --outputFile=<berkas>` agar nama testnya
tercatat. E2E tanpa suite penuh: folder `tampilan` (bayangan baris dan
spec baru `tombol-kembali`, 5 skenario) dan `setup/setup` 15 lolos.
Harapan suite penuh berikutnya 727 (`npx playwright test --list`, 116
berkas).

**Baseline per bug dan temuan frontend** (23 November 2026 sore, backend
`ridho` lokal `1718030`): vitest 1224 lolos dari 145 berkas (unit baru
`lib/auth/label-izin.ts`, `syaratKurangRute`, `labelMenuRute`, tautan
mutasi PEMBELIAN). Tanpa suite penuh dan tanpa OTP: `auth/gerbang-rute`,
`auth/guard-dashboard`, folder `akses`, `keuangan`, `reservasi`,
`inventaris/pembelianStok`, dan `tampilan`, spec `pengaturan` tanpa OTP,
dan `penjualan/daftar-penjualan` dijalankan bersama: 244 lolos dan 11
gagal dari 255. Penyebabnya: dua skenario baru tanpa login (blok
`describe`-nya tidak login di `beforeEach`), tiga spec tarif yang masih
mencari `input[name="harga"]` dan sekaligus menemukan regresi nyata
(harga kosong tersimpan Rp0, `modul/reservasi.md` TF1a), lima spec tipe
aset dengan teks lama sebelum KA1a, dan pembaca warna bayangan di spec
baru. Sesudah perbaikan, folder `reservasi/tipeAset`, `reservasi/tarif`,
`tampilan`, serta spec `keuangan/mutasi-kas` dan `keuangan/ubah-akun-kas`
lolos 78. Harapan suite penuh berikutnya 722 (`npx playwright test
--list`, 115 berkas).

**Baseline per penyesuaian backend `ridho` `1718030`** (23 November 2026,
backend `ridho` lokal `1718030`): vitest 1218 lolos dari 144 berkas
(unit baru: `lib/unduh.ts`, `features/bahan-baku/satuan.ts`,
`features/absensi/rekap.ts`, rincian hitung opname, satuan pembelian,
pengajuan, surat jalan, dan resep berkemasan).
Tanpa suite penuh dan tanpa OTP: folder `inventaris`, `keuangan`, `unduh`,
`jadwal`, `dashboard`, `penjualan`, `gudang`, dan `akses`, ditambah
`reservasi/daftar/tandai-selesai`, `auth/guard-dashboard`, dan
`setup/plan-fitur`, dijalankan bersama: 377 lolos dan 1 dilewati dari 378
(skip bersyarat dialog batal surat jalan), pukul 09.10 sampai 09.33 WIB.
Spec baru: `unduh/ekspor-daftar` (15), `jadwal/rekap-absensi` (7), dan
`inventaris/bahanBaku/konversi-satuan` (3); skenario baru B347 di
`tandai-selesai`, unduhan di `keuangan/pembayaran-metode`, dan langkah
rincian per kemasan di `draft-stok-opname`. Harapan suite penuh berikutnya
716 (`npx playwright test --list`, 114 berkas): 689 ditambah 27 skenario
baru.

**Baseline per kerapian seluruh laman dan utang pengujian** (20 November
2026 sore, backend `ridho` lokal `2790fc7`): vitest 1194 lolos dari 141
berkas, termasuk satu unit baru TT1a di
`tests/unit/components/topbar.test.tsx`. Angka 1195 di baseline suite
penuh di bawah keliru: `HEAD` sebelum perubahan ini menghitung 1193
(diukur ulang dengan `git stash -u`). Tanpa suite penuh dan tanpa OTP
(suite penuh ditunda sampai seluruh pekerjaan selesai, pemilik proyek):

- Spec terdampak kerapian (KL1b, TH1a, TI1a, KF1a, TT1a, PP1a, dan
  perbaikan teknis), dipilih lewat label dan teks yang berubah, bukan
  nama folder: 85 lolos dari 85, termasuk `pengaturan/pajak` dan
  `pengaturan/kelola-pajak` yang kini membuka menu "Aksi pajak produk".
- Spec bagian C, baru atau berubah, dijalankan bersama: 39 lolos dari 39
  (`akses/jalur-bukan-owner` 8, `diskon/pilihan-kasir`, `gudang/ruang-gudang`,
  `stok/lihat-stok`, dan tiga spec baru jalur berhasil).

Sesudah pembersihan data uji 20 November 2026 (`inti/status.md`, Utang
kecil dari penyesuaian backend `4759208`): folder `keuangan`, `diskon`,
`pelanggan`, `jadwal/shift`, dan spec metode pembayaran 127 lolos dan 1
gagal dari 128; kegagalannya sekali dan tidak terulang
(`arsip/riwayat-pengujian.md`, Kejadian sesekali yang tidak berulang).

Harapan suite penuh berikutnya 689 (`npx playwright test --list`, 111
berkas): 680 ditambah sembilan skenario baru, yaitu `setujui-stok-opname`,
`setujui-kirim-berhasil`, `tambah-barang-gudang`, setup gudang berhasil,
empat skenario `jalur-bukan-owner`, dan skenario khusus member
`pilihan-kasir`.

**Suite penuh 20 November 2026** (web `86f2a0b`, backend `ridho` lokal
`2790fc7`, pukul 11.10 sampai 11.49 WIB, reporter `line,json`, charger
tersambung, `systemd-inhibit`, atas perintah pemilik proyek): e2e 676
lolos, 3 gagal, dan 1 dilewati dari 680, sesuai harapan hitungan. Yang
dilewati skip bersyarat dialog batal surat jalan (tidak ada surat jalan
Belum Dikirim). Termasuk spec ber-OTP. Membuktikan seluruh perubahan sejak
suite 17 November 2026: pembuktian kontrak, SR1a, SP1a, SP2a, TK1a sampai
TK6a, FL1a sampai FL19a, LU1a sampai LU5a, dan DN5a. Ketiga kegagalan
berasal dari spec yang tertinggal dari filter seragam, karena tidak ikut
dijalankan di putaran FL1a:

- `keuangan/tanggal-filter` (HP dan desktop): masih mencari isian tanggal
  di halaman, padahal sejak FL1a isian itu di panel. Setelah disesuaikan,
  spec menemukan bug sungguhan: tanggal berbulan panjang meluber dari
  tombol panel (isi 182 px di tombol 171 px di HP dan 178 px di desktop).
  Diperbaiki lewat FL20a (`99ecd4c`, `modul/ui-ux.md`); spec menunggu
  animasi geser panel sebelum mengukur, dan lolos 4 dari 4 dengan
  `--repeat-each 2`.
- `keuangan/tutup-akun-bersaldo`: memilih akun kas lewat combobox di
  halaman, padahal sejak FL1a pilihan itu di panel; lolos setelah membuka
  panel.

Sesudah perbaikan, tanpa suite penuh ulang dan tanpa OTP: folder
`keuangan`, `inventaris/jurnalStok`, `inventaris/pembelianStok`, dan
`daftar-penjualan` 92 lolos. Vitest 1195 lolos (2 unit
`tautanTransferMutasi`, 3 unit `formatTeks`). Spec `mutasi-kas` memilih
tanggal yang bukan hari ini, karena memilih tanggal bawaan membatalkan
pilihan (gagal pada tanggal 20). Harapan suite penuh berikutnya 680.

**Baseline per filter seragam** (19 November 2026, FL1a sampai FL15a,
backend `ridho` lokal `2790fc7`): vitest 1187 lolos (26 unit test baru:
`lib/filter.ts` dan pil serta lencana per modul). Tanpa suite penuh dan
tanpa OTP; spec dijalankan per kelompok:

- Penjualan: `daftar-penjualan` 9 lolos, dengan `--repeat-each 2` 18
  lolos (tiga skenario baru: panel, draf dibuang tanpa Terapkan, pil;
  kotak cari; panel layar penuh 390 px).
- Keuangan: pengeluaran (skenario baru Select di dalam panel), mutasi kas,
  pindah dana, arus kas, belanja stok, mesin kasir (skenario baru riwayat),
  tampilan HP, dan daftar penjualan 43 lolos bersama.
- Inventaris: folder pembelian stok, jurnal stok, pengajuan stok,
  `lihat-stok-opname`, dan gudang 73 lolos bersama; skenario LT8a 390 px
  diganti pemeriksaan Select selebar isi panel.
- Diskon 12, Master Shift 15, dan admin 22 lolos.
- Halaman hanya-cari, Reservasi, jadwal, pelanggan, pengguna, dan
  pengaturan: 42 berkas, 343 lolos dan 1 dilewati dari 344 (skip bersyarat
  dialog batal surat jalan).

Satu run vitest sesudah percontohan Penjualan gagal 3 dari 1169 tepat
setelah Playwright, lalu dua run berikutnya tanpa perubahan kode lolos
seluruhnya; nama test yang gagal tidak tercatat, sehingga penyebabnya belum
diketahui (pola "Gagal tepat setelah perubahan kode, lalu hilang").
Helper `tests/helpers/filter-uji.ts` (`bukaPanelFilter`,
`terapkanPanelFilter`, `pilihanPanel`). Spec yang memakai `URL` sebagai
konstanta halaman memanggil `new globalThis.URL` (mesin-kasir). Harapan suite
penuh berikutnya 676 (`npx playwright test --list`): 671 ditambah lima
skenario baru (tiga Penjualan, satu Pengeluaran, satu Mesin Kasir);
skenario lain ditulis ulang ke alur panel tanpa mengubah jumlah.

**Baseline per laman utama** (19 November 2026, LU1a sampai LU5a):
vitest 1190 lolos (empat tes `tujuanBukaDashboard` baru). Tanpa suite
penuh dan tanpa OTP: spec baru `tests/e2e/laman-utama/laman-utama.spec.ts`
4 lolos (tombol tamu, tanya jawab, muncul saat digulir dua arah, dan Buka
dashboard sesudah masuk). Harapan suite penuh berikutnya 680: 676 ditambah
empat skenario laman utama. Suite penuh dicatat sebagai utang
(`referensi/utang-pengujian.md`).

**Baseline per ukuran tombol aksi** (19 November 2026, TK1a sampai
TK6a, backend `ridho` lokal `2790fc7`): vitest 1161 lolos. Tanpa suite
penuh dan tanpa OTP; 50 berkas spec terdampak (tombol dan teks yang
berubah, tata letak HP, admin) dijalankan bersama: 345 lolos dan 2 gagal
dari 347. `keuangan/tampilan-hp` gagal karena masih memeriksa susunan
KH1a; spec disesuaikan dengan TK4a. `jadwal/kelola-jadwal` gagal di
`GET /shift` lewat API sebelum menyentuh UI ("Sesi tidak valid", pola
rotasi `pin-refresh` di tabel Urutan debug). Kedua berkas dijalankan ulang
dan lolos 14 dari 14. Harapan suite penuh tetap 671.

**Baseline per pembuktian kontrak dan rapian 18 November 2026** (web
`1072484`, backend `ridho` lokal `2790fc7`): vitest 1161 lolos. Tanpa
suite penuh dan tanpa OTP; spec dijalankan per berkas:

- Spec baru `inventaris/produk/stok-produk-beresep` (3 skenario: B169,
  B170 id rusak, dan B170 toko lain dengan akun sekali pakai) lolos 6
  dari 6 dengan `--repeat-each 2`, dan folder `inventaris/produk` 24
  lolos sesudah SR1a.
- Skenario baru B346 di `keuangan/mesin-kasir` (staf berlokasi kerja
  Outlet) dan berkasnya lolos 8 dari 8 dengan `--repeat-each 2`.
- 19 spec pemakai `tests/helpers/terkunci-uji.ts` (helper menerima
  `aksesType`) 129 lolos.
- Butir 77: `reservasi/tipeAset` dan `reservasi/tarif` dengan
  `--repeat-each 10` 570 lolos.
- Sesudah pembersihan data uji: `diskon`, `pelanggan`, `jadwal`,
  `keuangan`, kedua spec metode pembayaran, `buat-penjualan`, dan
  `reservasi/buat` 177 lolos.
- Sesudah SP1a dan SP2a: 38 spec tata letak dan halaman yang lebarnya
  berubah 253 lolos dan 1 dilewati bersyarat data.

Harapan suite penuh berikutnya 671 (`npx playwright test --list`): 667
ditambah tiga skenario `stok-produk-beresep` dan satu skenario B346;
menunggu izin pemilik proyek.

Dipindah dari `inti/pengujian.md` pada 20 November 2026: baseline 16
dan 17 November 2026, terbaru lebih dulu.

**Suite penuh per penyesuaian backend `3570bd4`** (web `0dbfaba`
ditambah spec `auth/tenggang-pin-refresh`, backend `ridho` lokal
`3570bd4`, 17 November 2026, pukul 13.51 sampai 14.29 WIB, reporter
`line,json`, atas perintah pemilik proyek; charger tersambung sejak
13.54): e2e 665 lolos, 1 gagal, dan 1 dilewati dari 667, sesuai harapan
hitungan (666 ditambah skenario masa tenggang). Yang dilewati skip
bersyarat dialog batal surat jalan (tidak ada surat jalan Belum
Dikirim); skip status staf tidak terjadi. Termasuk spec ber-OTP.
Kegagalannya `dashboard/panduan-dashboard` (Setup Gudang, TG2a): tur
gudang tidak tampil setelah Gudang kembali terbaca. Bug web, bukan spec:
topbar memulai tur di `/dashboard/gudang` selagi penjaga ruang memuat
lokasi, lalu pengalihan ke Setup Gudang mencatatnya sudah dilihat.
Tereproduksi 2 dari 2 dengan respons `/location` ditunda 1,5 detik
(spec sementara, tidak di-commit), dan lolos 2 dari 2 sesudah
perbaikan (`modul/setup-akun.md`, TG2a). Dibuktikan lewat spec
terdampak saja, tanpa suite penuh dan tanpa OTP: `panduan-dashboard`,
`dashboard-gudang`, dan folder `gudang` 21 lolos. Vitest 1161 lolos (2
unit test `kunciPanduanDashboard`). B345 dibuktikan spec baru
`auth/tenggang-pin-refresh` (3 dari 3 dengan `--repeat-each 3`; varian
sementara yang menunggu 31 detik gagal 401). Harapan suite penuh
berikutnya 667.

**Baseline per modul membership** (17 November 2026, MB1a sampai MB3a):
vitest 1159 lolos (12 unit test membership, 2 unit test diskon khusus
member). Spec baru `pelanggan/membership.spec.ts` (5 skenario: paket
tambah, ubah, nonaktifkan, dan hapus lewat dialog; daftarkan dari
penjualan nyata, ubah tanggal mulai, lencana laman Pelanggan, dan hapus;
centang khusus member; HP 390 px; pengguna baca-saja) lolos 10 dari 10
dengan `--repeat-each 2`, tanpa OTP. Data uji dibuat lewat UI dan
dibersihkan di akhir, sehingga penjualan yang dipakai kembali tersedia.
Folder `pelanggan`, `diskon`, `auth/gerbang-rute`, dan
`auth/sidebar-pengguna` lolos per berkas. Harapan suite penuh 666: 661
ditambah kelima skenario itu.

**Baseline per laman Pembayaran per Metode** (17 November 2026, OM2a dan
OM3a): vitest 1145 lolos (8 unit test `pembayaran-metode`; dua harapan
sub-menu Laporan di `sidebar-menu-keuangan` menjadi tiga anak). Spec baru
`keuangan/pembayaran-metode.spec.ts` (4 skenario: Bulan Ini bawaan dengan
angka dari respons nyata, rentang Hari Ini, Minggu Ini, dan Pilih tanggal,
gagal memuat, dan HP 390 px) lolos 12 dari 12 dengan `--repeat-each 3`,
tanpa OTP. Bukti angka dibaca ulang lewat API dengan token sesi yang sama,
karena isi respons halaman sesekali sudah dibuang browser saat dibaca.
Harapan suite penuh 661: 657 ditambah keempat skenario itu.

**Baseline per tur ruang gudang** (17 November 2026, TG1a dan TG2a):
vitest 1137 lolos (2 unit test titik gudang). `panduan-dashboard`
diperbarui: langkah gudang kini memeriksa tur gudang tampil sendiri
sekali dengan enam titik dan kunci terpisah dari outlet, dan skenario
baru Setup Gudang tanpa tombol dan tanpa tur (satu `// simulasi:`:
respons nyata `GET /location` disaring dari Gudang, karena akun uji sudah
punya Gudang); skenario itu terbukti gagal tanpa penjaga setup.
`panduan-dashboard`, `dashboard-gudang`, folder `gudang`, dan
`lonceng-pemberitahuan` 23 lolos per berkas, tanpa OTP. Harapan suite
penuh 657: 656 ditambah skenario Setup Gudang.

**Suite penuh per luberan tabel dan kode mati gudang** (web `f1835d1`,
backend `ridho` lokal `4a19be8`, 17 November 2026, pukul 10.37 sampai
11.14 WIB, reporter `line,json`, charger tersambung, atas izin pemilik
proyek): e2e 654 lolos dan 2 dilewati dari 656, tanpa kegagalan dan
tanpa flaky, sesuai harapan hitungan. Yang dilewati skip bersyarat data:
status staf dashboard outlet (tidak ada staf ruang outlet di monitoring)
dan dialog batal surat jalan (tidak ada surat jalan Belum Dikirim).
Termasuk spec ber-OTP. Membuktikan seluruh perubahan sejak suite
16 November 2026: perbaikan `lihat-stock-adjustment` dan
`jalur-bukan-owner`, kartu bila tabel tidak muat (LT1a sampai LT6a),
luberan HP 390 px (LT7a sampai LT10a), KM1a, dan kunci ukur ulang.
Vitest 1135 lolos. Harapan suite penuh berikutnya 656.

**Baseline per kunci ukur ulang mode kartu** (17 November 2026): vitest
1135 lolos (3 unit test baru `kunciUkurUlang`); `lihat-stock-adjustment`,
`daftar-penjualan`, `lihat-pembelian-stok`, dan `kelola-pelanggan` 41
lolos per berkas, tanpa OTP. Harapan suite penuh tetap 656.

**Baseline per kode mati pesan lokasi gudang** (17 November 2026, KM1a):
vitest 1132 lolos; folder `inventaris/jurnalStok`,
`lihat-pembelian-stok`, dan `ruang-gudang` 29 lolos per berkas, tanpa
OTP. Harapan suite penuh tetap 656.

**Baseline per luberan HP 390 px** (17 November 2026, backend `ridho`
lokal `4a19be8`): vitest 1132 lolos. Tiga skenario baru 390 px dengan
helper `tanpaLuberWadah`: `lihat-pembelian-stok` (filter selebar baris dan
tabel kosong), `crud-produk` (tab Stok Kritis), dan `buat-reservasi`
(pemilih pelanggan dan aset); ketiganya terbukti gagal terhadap kode lama.
Selektor teks pemilih di `buat-reservasi` dan `pemilih-pelanggan`
mengikuti teks baru. Folder `inventaris/pembelianStok`, `crud-produk`,
`buat-reservasi`, dan `pemilih-pelanggan` 44 lolos per berkas, tanpa OTP,
setelah dev server dimulai ulang dengan `.next/dev` dibersihkan. Harapan
suite penuh 656: 653 ditambah ketiga skenario itu.

**Baseline per luberan tabel 768 px** (17 November 2026, backend `ridho`
lokal `4a19be8`): vitest 1132 lolos (4 unit test baru
`tests/unit/components/kartu-bila-tak-muat.test.ts`; dua asersi nama kelas
di integrasi `DataTable` diganti ke `tabel:`). Spec terdampak dijalankan
per berkas, tanpa OTP dan tanpa suite penuh: kedua spec pelanggan,
`daftar-penjualan`, `stok-keluar`, `lihat-stok-opname`,
`lihat-pengajuan-stok`, `ruang-gudang`, `arus-kas`, `tampilan-hp`,
`langganan`, dan `lihat-stock-adjustment` 87 lolos. Run pertama gagal 2 di
`lihat-stock-adjustment` karena CSS basi setelah `git stash`; lolos
setelah dev server dimulai ulang dengan `.next/dev` dibersihkan. Pindai
visual 390, 768, 1024, dan 1280 px tanpa tabel meluber di lebar meja.
Sesudah LT6a: skenario baru `lihat-stock-adjustment` (kartu di 768 px,
kembali tabel di 1280 px, lalu kartu lagi) lolos 3 dari 3 dengan
`--repeat-each 3`; `daftar-penjualan`, `lihat-stok-opname`,
`lihat-stock-adjustment`, dan `tampilan-hp` 35 lolos; vitest 1132 lolos.
Harapan suite penuh 653: 652 ditambah skenario itu.

**Suite penuh per jam buka di shift dan jadwal** (web `0c4cc7e`, backend
`ridho` lokal `4a19be8`, 16 November 2026, pukul 20.57 sampai 21.54 WIB,
reporter `line,json`, atas izin pemilik proyek): e2e 646 lolos, 4 gagal,
dan 2 dilewati dari 652, sesuai harapan hitungan (649 ditambah tiga
skenario `jadwal/jam-buka-jadwal`). Yang dilewati skip bersyarat data:
status staf dashboard outlet (tidak ada staf ruang outlet di monitoring)
dan dialog batal surat jalan (tidak ada surat jalan Belum Dikirim).
Termasuk spec ber-OTP. Laptop ditangguhkan karena baterai lemah pukul
21.23 sampai 21.36 (13 menit 10 detik), walau suite diawali
`systemd-inhibit --what=idle:sleep`. Kegagalannya:

- `keuangan/belanja-stok` (menu Ke outlet dan Ke gudang): karena laptop
  tidur. Gagal 21.36.49, 18 detik setelah bangun, batas 30 detiknya
  terpotong masa tidur; dijalankan ulang sendirian lolos 1.
- `akses/jalur-bukan-owner` (tanpa izin baca shift, pola roster, dan
  jadwal: "Akses ditolak" tidak tampil), 20.59: gagal sungguhan, sebelum
  laptop tidur, dan bukan karena urutan spec atau `fddb3c6`. Halaman
  berakhir di login pengguna: spec berpindah halaman selagi
  `pin-refresh` dokumen sebelumnya berjalan, karena "Dashboard" di
  sidebar tampil sebelum sesi pulih sehingga pemeriksaan ketiadaan menu
  lolos tanpa bukti. Backend sudah memutar `tokenVersion`, cookie
  barunya tidak tersimpan, dan dokumen berikutnya ditolak "Sesi tidak
  valid." Dibuktikan 17 November 2026 dengan repro deterministik (spec
  sementara, 3 dari 3) dan diperbaiki lewat jangkar positif di
  `f80bd16`; berkas spec `--repeat-each 10` 40 lolos.
- `inventaris/stockAdjustment/lihat-stock-adjustment` (kolom sumber dan
  detail), 21.12: gagal sungguhan. Teks sel terbaca "SumberStock Opname
  ..." dan "Fisik Riil90": label kartu HP `DataTable` (`sm:hidden`)
  ikut terbaca, karena `toHaveText` membaca `textContent`. Diperbaiki
  17 November 2026 dengan `useInnerText` di `25b969c`; spec terdampak
  tereproduksi 2 gagal, sesudahnya kedua skenario lolos.

Vitest 1128 lolos. Ketiga kegagalan ditelusuri dan dibuktikan lewat spec
terdampak saja pada 17 November 2026, tanpa suite penuh dan tanpa OTP.
Harapan suite penuh berikutnya tetap 652.

**Baseline per penyesuaian backend `4a19be8`** (web `6ab81aa`, backend
`ridho` lokal `4a19be8`, 16 November 2026, sesudah migrasi
`jamOperasionalToko.js` diterapkan): vitest 1115 lolos (unit baru
`orangSesi` asal web, `namaMesin`, `pilihanPerangkat`,
`rekanSelokasiPengaju`, `ringkasLangganan`, `metodeLaciMesinKasir`,
konverter `jamOperasional`, kriteria `jamBuka`, `paramHalamanProduk`, dan
`paramHalamanInventory`). Spec terdampak dijalankan per berkas, tanpa OTP
dan tanpa suite penuh: `keuangan/mesin-kasir`, `auth/ruang-lokasi-kerja`
(skenario baru B339), `inventaris/pengajuanStok/lihat-pengajuan-stok`,
`pengaturan/langganan`, `dashboard/lonceng-pemberitahuan`, dan
`auth/sidebar-pengguna` 36 lolos; `reservasi/daftar/lihat-reservasi`,
`setup/setup`, `setup/pratinjau-jam-buka`, `pengaturan/profil-toko`
(skenario baru Jam Buka), `inventaris/produk/crud-produk`, dan
`inventaris/stok` 66 lolos dan 2 gagal (pesan kosong produk yang
terlanjur diubah, dikembalikan di `bf5212c`, lalu 2 lolos);
`reservasi/buat`, `penjualan/alur-penjualan`, `gudang/ruang-gudang`, dan
`akses` 38 lolos; folder `inventaris/bahanBaku` 6 lolos (skenario P18
tidak lagi dilewati); `setup/panduan`, `setup/plan-fitur`,
`penjualan/buat-penjualan`, dan `dashboard/dashboard-gudang` 12 lolos.
Spec pratinjau jam buka (6 skenario) dihapus sesudah itu (`1171f33`).
Harapan suite penuh 649 (`npx playwright test --list`): 653 dikurangi 6
pratinjau ditambah 2 skenario baru; menunggu izin pemilik proyek.

Dipindah dari `inti/pengujian.md` pada 17 November 2026: baseline 13
dan 14 November 2026, terbaru lebih dulu.

**Baseline per rapian UI dan utang pengujian** (web `2bcb1ce`, backend
`ridho` lokal `d6709a1`, 14 November 2026): vitest 1100 lolos (5 unit test
`toggleDiskonSelection`, 1 `denganAlfa`, 3 integrasi `DataTable`). Spec
ditulis atau diubah dan dijalankan per berkas, tanpa OTP: `akses/jalur-bukan-owner`
4, `kelola-jadwal` 3, `kelola-pelanggan` 3, `crud-role` 1,
`lihat-jurnal-stok` 1, `daftar-surat-jalan` 1 lolos dan 1 skipped (tidak
ada surat jalan Belum Dikirim), catat pembelian bukan-Owner 1, dan
`generate-jadwal` 4. Perubahan tampilan sesudah suite penuh 14 November
2026 (label kartu HP, tabel rincian, tipografi) belum dijalankan e2e dan
masuk suite penuh berikutnya. Harapan suite penuh 653: 643 ditambah
empat skenario bukan-Owner, satu B165, dua email pelanggan, satu jurnal
gudang, dan dua surat jalan (hitungan), dengan skip bersyarat dialog
batal surat jalan bila datanya kosong; menunggu izin pemilik proyek.

**Suite penuh per cacat tampilan 14 November 2026** (web `a5fa419`,
backend `ridho` lokal `d6709a1`, 14 November 2026, pukul 11.45 sampai
12.24 WIB, reporter `line,json`, atas izin pemilik proyek): e2e 643 lolos
dari 643, tanpa kegagalan dan tanpa skip; skip bersyarat status staf tidak
terjadi. Termasuk spec ber-OTP (verifikasi email, reset PIN Owner, dan
Akun Toko). Harapan 642 di baseline sebelumnya salah hitung: 637 adalah
jumlah lolos, dan totalnya 638 dengan skip status staf, sehingga ditambah
kelima skenario baru menjadi 643. Vitest 1091 lolos. Harapan suite penuh
berikutnya 643, termasuk skip status staf bila datanya kosong (hitungan).

**Baseline per perbaikan cacat tampilan** (web `0df0ca5`, backend `ridho`
lokal `d6709a1`, 14 November 2026): vitest 1091 lolos (9 unit test baru:
`hrefMenuAktif` 4, `PilihTanggal` 3, dan `adaJadwalLokasiLain` 2). Spec e2e
terdampak (dashboard, jurnal stok, pembelian stok, pengajuan stok, stok,
kategori, produk, keuangan, reservasi, diskon, pengguna, jadwal, roles,
daftar penjualan, kategori beban, gudang, dan pratinjau jam buka) 378 lolos,
1 gagal, dan 1 skipped (skip bersyarat status staf), tanpa spec ber-OTP.
Kegagalannya skenario baru Kosongkan di `penjualan/daftar-penjualan.spec.ts`
(salah spec): Terapkan Pencarian menutup panel filter, dan filter tanpa
tanggal sama dengan kunci query awal yang masih segar sehingga tidak ada
permintaan baru. Setelah diperbaiki, spec itu lolos 6/6, dan skenarionya
3/3 dengan `--repeat-each 3`. Skenario baru lain: Libur nonaktif B165 di
`jadwal/jadwal/kelola-jadwal.spec.ts` (sel dan Tambah Manual). Sesudah
batas dua baris (CV12a), spec tabel terdampak (daftar penjualan,
pengajuan stok, diskon, pengguna, tarif, dan folder keuangan) dijalankan
ulang atas izin pemilik proyek: 147 lolos, tanpa OTP. Kedua run itu
bukan suite penuh dan tidak memakai kuota OTP (0 berkas OTP), tetapi run
pertama mencakup lebih dari separuh suite; sesudahnya tidak ada run e2e
sampai suite penuh atas izin pemilik proyek.
Sesudahnya `883a79b` (CV15a sampai CV18a): spec terdampak 31 lolos
(lihat-jurnal-stok, lihat-jadwal, pindah-dana, tutup-akun-bersaldo, dan spec
baru `reservasi/navigasi/tab-navigasi.spec.ts` dengan 2 skenario); asersi
lebar Staf dan kedua skenario tab terbukti gagal terhadap kode lama.
Harapan suite penuh sempat ditulis 642 (salah hitung; lihat suite penuh
14 November 2026 di atas).

**Suite penuh per OTP aksi Owner** (web `8c3c1ea`, backend `ridho` lokal
`d6709a1`, 13 November 2026, pukul 11.47 sampai 12.24 WIB, reporter
`line,json`): e2e 636 lolos, 1 gagal, dan 1 skipped dari 638, sesuai
harapan hitungan 638. Yang dilewati skip bersyarat status staf. Ketiga
skenario ber-OTP Akun Toko (ubah email, ubah password dengan password lama
salah lebih dulu, dan hapus akun) lolos pada run pertamanya.
Kegagalannya `auth/reset-pin-owner.spec.ts`: PIN tersimpan dan login
dengan PIN baru berhasil, tetapi Owner mendarat di dashboard, bukan
kembali ke wizard, karena `/lupa-pin` tidak meneruskan `?kembali=/setup`
(bug web, bukan spec). Diperbaiki lewat `denganKembali`
(`lib/auth/tujuan.ts`) dan dibuktikan tanpa OTP: skenario Lupa PIN? di
`auth/tampilan-login-pengguna.spec.ts` kini memeriksa `kembali` bertahan
dua arah, dan bersama skenario wizard Owner tanpa sesi 3 lolos. Vitest
1082 lolos. Atas izin pemilik proyek, spec ber-OTP reset PIN diulang
sendirian: ulangan pertama berhenti sebelum kode diminta, karena penunggu
`**/lupa-pin` tidak mencocokkan `?kembali=%2Fsetup` (0 kode terpakai);
setelah penunggunya diperbaiki, ulangan kedua lolos (1 kirim dan 1
periksa kode). Harapan suite penuh berikutnya 637 lolos, ditambah skip
status staf bila datanya kosong (hitungan).

**Baseline per hapus akun** (13 November 2026): vitest 1081 lolos (3 unit
test baru di `tests/unit/features/akun-toko/akun-toko.test.ts`). Spec
terdampak `pengaturan/akun-toko.spec.ts` dan `tests/e2e/profil` 13 lolos:
langkah 1 hapus akun (tombol aktif hanya bila nama toko cocok, tanpa
mengirim kode, tanpa meluber), dan profil tanpa Zona Bahaya. Skenario baru
ber-OTP hapus akun di `pengaturan/akun-toko-otp.spec.ts` (akun klien
sekali pakai) menunggu suite penuh akhir putaran. Harapan suite penuh 638:
637 ditambah skenario itu (hitungan).

**Baseline per halaman Akun Toko** (13 November 2026): vitest 1078 lolos (6
unit test baru `tests/unit/features/akun-toko/akun-toko.test.ts`). Spec
terdampak `tests/e2e/pengaturan` dan `auth/gerbang-rute` 52 lolos, termasuk
spec baru `pengaturan/akun-toko.spec.ts` (2 skenario: Owner membuka dari
kartu Pengaturan dan memeriksa tahap 1 kedua dialog tanpa mengirim kode di
390, 768, dan 1280 px; pengguna baca-saja tanpa kartu dan ditolak 403).
Spec baru ber-OTP `pengaturan/akun-toko-otp.spec.ts` (1 skenario, akun
klien sekali pakai) belum dijalankan dan menunggu suite penuh akhir
putaran. Harapan suite penuh 637: 634 ditambah ketiga skenario itu
(hitungan).

**Baseline per reset PIN Owner** (13 November 2026): vitest 1072 lolos (4
unit test baru `tests/unit/features/auth/reset-pin-owner.test.ts`). Spec
terdampak `auth/tampilan-login-pengguna.spec.ts` 5 lolos, termasuk
skenario baru tahap 1 `/lupa-pin` tanpa meluber di 390, 768, dan 1280 px
tanpa mengirim kode. Spec baru ber-OTP `auth/reset-pin-owner.spec.ts` (1
skenario, akun klien sekali pakai) belum dijalankan dan menunggu suite
penuh akhir putaran. Harapan suite penuh 634: 632 ditambah kedua skenario
itu (hitungan).

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

Dilunasi 14 November 2026 (`2bcb1ce`) dan dipindah dari
`referensi/utang-pengujian.md` tanpa perubahan teks: jalur bukan-Owner
lewat pengguna uji baru (E2E Akun Bukan Owner, E2E Pencatat Beban, E2E
Tanpa Lokasi, E2E Tanpa SDM, ditambah E2E Pembelian Outlet untuk tanggal
pembelian) di `tests/e2e/akses/jalur-bukan-owner.spec.ts`, B165 Tambah
Manual dan sel lokal bersama penanda di `kelola-jadwal.spec.ts`, email
pelanggan di `kelola-pelanggan.spec.ts`, dan skip tanpa judul (suite penuh
14 November 2026 dengan reporter json tanpa skip).

- **Penolakan Akun Toko bagi pemegang `update-akun` yang bukan Owner hanya
  teruji di unit test** (`bolehKelolaAkunToko`): tidak ada peran uji yang
  memegang izin itu, dan e2e hanya membuktikan pengguna tanpa izinnya.
- **Jalur tanggal terkunci bagi peran selain Owner di catat beban hanya
  teruji di unit test** (`payloadBuatBeban`), karena pengguna uji
  berperan Owner (BO5a).
- **Jalur tanpa `read-location` di halaman penjualan** (tanpa cakupan, dan
  tanpa `locationID` saat membuat) hanya teruji di unit test, dengan alasan
  yang sama: satu-satunya akun uji berperan Owner.
- **Libur nonaktif selama jadwal tanggal Tambah Manual dimuat (CV10a)
  dan tanggal Tambah Manual di luar bulan yang tampil** hanya teruji lewat
  kode dan unit test `adaJadwalLokasiLain`; skenario e2e B165 memilih
  tanggal di bulan yang sedang tampil.
- **Pengosongan email dan alamat pelanggan tidak teruji e2e**; yang
  teruji hanya nomor HP. Peringatan `isianTidakTerkosongkan` dibuang di
  `1bb26c0`.
- **Email pelanggan kembar yang dijawab 409 hanya dibaca dari kode**;
  e2e menguji nomor HP kembar.
- **Jalur tanggal pembelian bagi peran selain Owner** hanya teruji di
  unit test (`payloadBuatPembelian`), karena akun uji berperan Owner.
- **Jalur role tanpa izin SDM baru** (B139, B140) hanya teruji di unit
  test (`gate-sdm-jadwal`, templat role), karena akun uji berperan Owner.
- **Kalender per lokasi hanya teruji untuk sel yang berisi penanda
  saja**; sel yang berisi jadwal lokal sekaligus penanda lokasi lain
  belum diuji e2e.
- **Skenario dilewati tanpa judul tercatat**: satu di suite penuh
  `50c99ae` selain jurnal stok, satu di `6db571d`, dan dua di suite
  terhadap backend `4759208` (spec daftar tidak termasuk; 29 spec lain
  ber-skip bersyarat), serta dua di suite penuh terhadap backend `ridho`
  `c031bde` (6 November 2026). Tidak dicari dengan
  menjalankan ulang sebagian suite; reporter `json` di suite penuh
  berikutnya mencatat judulnya (`referensi/playwright.md`).

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

Lunas atau basi, dipindah dari `referensi/utang-pengujian.md` pada
20 November 2026 tanpa perubahan teks: tautan penjualan di buku mutasi
kini menyiapkan penjualan lunasnya sendiri lewat helper penjualan, tanpa
skip (`mutasi-kas.spec.ts`); kedua pesan lokasi jurnal stok gudang
dihapus bersama kodenya (KM1a, 17 November 2026); dan kartu siap surat
jalan dashboard gudang hanya menghitung permintaan sejak `f865254`
(B111, 28 Oktober 2026), sehingga sama dengan isi tab.

- **Tautan penjualan di buku mutasi bergantung pada data**: skenarionya
  dilewati bila halaman pertama bulan berjalan tidak memuat mutasi
  pembayaran. Baris tanpa pencatat hanya teruji di unit test.
- **Pesan lokasi gudang gagal dimuat atau belum didaftarkan di jurnal
  stok gudang** tidak dapat diuji: layout ruang gudang menghadang lebih
  dulu, sehingga kedua pesan itu kode mati (`modul/ui-ux.md`). Penghadangan
  layout teruji di `lihat-jurnal-stok.spec.ts` sejak `2bcb1ce`.
- **Kartu siap surat jalan dashboard gudang belum diuji dengan
  pengembalian yang disetujui** (AR6a): kartu menghitung kedua arah,
  sedangkan tab hanya permintaan; skenario dashboard gudang gagal dengan
  jujur bila data uji memuat pengembalian seperti itu.

Lunas 20 November 2026: suite e2e penuh yang tertunda sejak 17 November
2026 dijalankan (676 lolos, 3 gagal, 1 dilewati dari 680; `inti/pengujian.md`,
Baseline), dan butirnya dikeluarkan dari `referensi/utang-pengujian.md`.

Lunas 20 November 2026 (bagian C daftar sisa pekerjaan, atas perintah
pemilik proyek) dan dipindah dari `referensi/utang-pengujian.md` tanpa
perubahan teks. Jalur berhasil yang meninggalkan data permanen diuji
sungguhan atas keputusan pemilik proyek: `setujui-stok-opname`,
`setujui-kirim-berhasil`, `tambah-barang-gudang`, dan skenario setup
berhasil di `gudang/ruang-gudang`. Jalur izin lewat pengguna uji baru
"E2E Tanpa Baca Sebagian", "E2E Petugas Transfer", dan "E2E Adjustment
Outlet" di `akses/jalur-bukan-owner.spec.ts`. Halaman ber-`[id]` dipindai
20 November 2026: 22 rute dengan id nyata di 390, 844, 768, dan 1280 px
(`modul/ui-ux.md`, Kerapian seluruh laman).

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
- **Kirim surat jalan yang berhasil lewat UI** tidak diuji e2e, karena
  memotong stok gudang. Kirim dijalankan lewat API di persiapan spec dan
  ditutup lewat terima penuh di akhir, karena batal dari DIKIRIM ditolak
  backend `465b438` (PB10a); dari UI hanya jalur gagalnya yang diuji.
- **Gate halaman yang menolak pengguna tanpa sebagian izin** hanya teruji
  di unit test (`tests/unit/lib/auth/gate-stock-adjustment.test.ts`, kedua
  ruang),
  dengan alasan yang sama.
  Izin per ruang (RH3a) juga hanya teruji di unit test.
- **Setup gudang yang berhasil tidak diuji e2e** (keputusan GD6a). Tenant
  uji sudah punya gudang yang menyimpan stok, sehingga setup hanya dapat
  dibuka dengan daftar lokasi tanpa gudang yang disimulasikan, dan
  `POST /location` dijawab gagal agar tidak ada gudang kedua yang
  tersimpan. Payload dan penolakan radius teruji; pengalihan setelah
  setup berhasil dan pembaruan menu sidebar sesudahnya belum.
- **Kartu Pajak yang disembunyikan tanpa `read-pajak` hanya teruji di
  unit test** (`tests/unit/features/pajak/izin.test.ts`). Tombol Tambah
  Pajak dan menu aksi yang disembunyikan, serta kartu indeks bagi pemegang
  izin baca, teruji e2e sejak `cbfa23b` lewat pengguna baca-saja. Pesan
  tanpa izin baca kini milik gerbang rute (`bc388c6`).
- **Jalur tanpa `read-langganan` hanya teruji di unit test** (gerbang
  rute, `c868870`), karena pengguna uji yang ada memegang seluruh izin
  `read-`. Penolakannya lewat gerbang rute yang sama dengan halaman lain.
- **Halaman ber-`[id]` selain tabel rincian belum dipindai visual.** Rute
  statis di 768 px dipindai 14 November 2026 dan menemukan luberan tabel
  di lebar tablet (`modul/ui-ux.md`, Utang terbuka); tabel rincian halaman
  detail diukur di 1280 dan 390 px (CV22a).

Dilunasi 24 November 2026 (utang pengujian kelompok 1) dan dipindah dari
`referensi/utang-pengujian.md` tanpa perubahan teks: spec baru
`akses/template-role`, `akses/gerbang-baca-saja`,
`roles/level-bukan-owner`, dan `diskon/izin-diskon`, serta skenario baru
di `keuangan/mesin-kasir`, `akses/jalur-bukan-owner`,
`gudang/ruang-gudang`, dan `inventaris/pengajuanStok/alur-pengajuan-stok`.

- **Template role pembelian hanya teruji pemetaan namanya**; role dari
  template belum dipakai membuka halaman pembelian.
- **Jalur Mesin Kasir tanpa izin kelola teruji e2e sejak `cbfa23b`**
  lewat pengguna baca-saja (tanpa tambah, ubah, dan lepas, dan tanpa
  `GET /sesikasir/perangkat`). Yang masih hanya teruji di unit test:
  pemegang `kelola-perangkat-kasir` tanpa `read-pengguna`
  atau `read-akunkas` (MK11a), dan pemilihan perangkat yang melewati
  pengguna berlevel sama atau lebih tinggi (403 `GET /device/:userId`).
- **Batas atas level, level pengguna yang tidak diketahui (RL3a), dan
  perubahan level atau wewenang di payload ubah hanya teruji di unit
  test** (`tests/unit/features/role/form-role.test.ts`), karena akun uji
  berperan Owner. Penolakan backend saat simpan teruji e2e sejak `2bcb1ce`.
- **Keterangan khusus member dan pemilih produk tanpa izin baca produk
  belum teruji**: sejak MB1a (17 November 2026) web dapat menandai khusus
  member dan centangnya teruji di `pelanggan/membership.spec.ts`, dan
  keterangan "Khusus member" di daftar dan pilihan diskon teruji e2e
  sejak 20 November 2026 (`diskon/pilihan-kasir.spec.ts`). Pemilih produk
  tanpa izin baca produk tetap belum, karena satu-satunya akun uji
  berperan Owner. `aksiDiskon` hanya teruji di unit test, dengan alasan
  yang sama.
- **Penyaringan stock adjustment per ruang di server tidak teruji dari
  web**, karena akun uji berperan Owner.
- **Jalur layout gudang selain Owner hanya teruji di unit test**
  (`tests/unit/features/inventaris/gudang.test.ts`): pengguna tanpa
  `read-location`, tanpa `create-location`, dan tenant tanpa gudang,
  karena satu-satunya akun uji berperan Owner dan tenant uji sudah punya
  gudang.
- **Persetujuan pengajuan uji memakai pengguna penyetuju uji** "E2E
  Penyetuju", karena backend melarang pengaju menyetujui pengajuannya
  sendiri (`kontrak/temuan.md` butir 76, PB11a). Jalur Owner menyetujui
  pengajuannya sendiri belum teruji.
  Sejak `a8aec53` pengajuan uji disetujui Ridho sendiri (RH5a), sehingga
  jalur Owner teruji; penolakan bagi peran lain belum teruji dari web.

Dilunasi 24 November 2026 (utang pengujian kelompok keuangan) dan dipindah
dari `referensi/utang-pengujian.md` tanpa perubahan teks: spec baru
`tampilan/pergantian-hari`, dan skenario baru di `keuangan/pengeluaran`,
`keuangan/keuangan`, `keuangan/mutasi-kas`, `keuangan/pindah-dana`,
`penjualan/alur-penjualan` (idempotensi backend), dan
`pengaturan/kelola-metode-pembayaran` (batas 10 metode dengan data nyata).

- **Penolakan backend saat mencatat beban** (saldo kurang atau akun
  nonaktif, 409) tidak punya skenario e2e: form menahan jumlah di atas
  saldo sebelum permintaan dikirim.
- **Idempotensi hanya teruji dari sisi klien**: kunci terkirim dan sama saat
  permintaan diulang. Penahanan permintaan kembar di backend tidak diuji
  dari web.
  Berlaku juga untuk buat pembayaran sejak `26093b0` (RH1a).
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
- **Batas 10 metode aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, karena sepuluh metode aktif tidak dapat
  dibuat di data uji tanpa menumpuk metode permanen. Peringatan metode
  aktif terakhir, akun nonaktif bertanda di form ubah, dan penolakan akun
  nonaktif saat mengaktifkan kembali hanya teruji di unit test
  (`tests/unit/features/metode-pembayaran/`).
  Peringatan itu diganti penahanan di `3b4f35b` (NZ4a), yang teruji e2e.
- **Form metode pembayaran tanpa `read-akunkas` belum teruji e2e.** Tombol
  yang disembunyikan menurut izin (`aksiMetodePembayaran`) teruji e2e
  sejak `cbfa23b` lewat pengguna baca-saja.
- **Jenis mutasi saldo awal, beban, dan pembatalan transfer keluar belum
  teruji e2e** di halaman mutasi. Transfer masuk, transfer keluar, dan
  pembatalan transfer masuk teruji sejak `f7805ca`
  (`tutup-akun-bersaldo.spec.ts`). Label dan arah kesembilan jenis
  teruji di
  `tests/unit/features/akun-kas/mutasi.test.ts`.
- **Keadaan seluruh akun kas non-aktif belum teruji e2e**, karena tenant
  uji selalu punya akun aktif.
- **Penolakan 409 karena batas 10 akun kas aktif belum teruji e2e.**
  Skenario nonaktifkan yang ditolak memakai akun aktif bersaldo yang
  sudah ada dan dilewati bila tidak ada; penolakannya dapat berasal dari
  penjaga metode pembayaran, yang diperiksa backend lebih dulu, dan spec
  hanya memeriksa status 409 beserta pesan yang tampil. Penolakan yang
  pasti karena saldo teruji di alur tutup akun bersaldo (`f7805ca`), yang
  memakai akun uji tanpa metode pembayaran.
- **Riwayat Pindah Dana tanpa izin baca hanya teruji di unit test**
  (`aksiTransfer`). Form tanpa izin buat dan tombol Batalkan tanpa izin
  ubah teruji e2e sejak `cbfa23b` lewat pengguna baca-saja. Riwayat tanpa
  izin baca (bersama form tanpa izin buat) teruji e2e sejak 20 November
  2026 lewat pengguna "E2E Tanpa Baca Sebagian" di
  `akses/jalur-bukan-owner.spec.ts`. Filter riwayat
  dan keadaan kurang dari dua akun aktif juga belum teruji e2e.
- **Filter periode riwayat Pindah Dana diuji dengan tanggal 15 sampai 20
  bulan berjalan**, yang hampir selalu memberi daftar kosong; isi daftar
  dalam periode tidak dibandingkan per baris.
- **Penahanan pembayaran kembar di backend tidak diuji dari web**; yang
  teruji kunci yang sama saat permintaan diulang.
- **Perpindahan hari di dashboard outlet dan gudang, kartu ringkasan
  Keuangan, serta catat pembelian** hanya teruji lewat hook (unit) dan
  pola yang sama di catat beban (e2e `6d07b8d`), tanpa skenario
  `page.clock` tersendiri.

Dilunasi 24 November 2026 (utang pengujian kelompok admin dan profil,
`c1f683b`) dan dipindah dari `referensi/utang-pengujian.md` tanpa
perubahan teks; tiga butir (aktifkan akun kedaluwarsa, masa berlaku
Langganan, revisi profil) dipersempit ke sisanya di sana. Skenario baru di
`admin/akun-klien`, `admin/kelola-akun`, `admin/langganan-akun`,
`admin/sesi-admin`, `admin/tampilan-admin`, `auth/sidebar-pengguna`,
`pengaturan/langganan`, `profil/profil`, dan `setup/panduan`. Spec tur jam
buka menemukan balon di luar layar untuk target setinggi lebih dari layar,
diperbaiki di commit yang sama (`modul/setup-akun.md`, JB10a).

- **Profil Owner hanya teruji dibuka**, tidak diubah, karena nama dan PIN
  Ridho dipakai login seluruh suite.
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
- **Keadaan masa berlaku Langganan hanya teruji di unit test**: masa
  percobaan, bilah masa berlaku, masa akses lewat dan masa tenggang, serta
  Muat riwayat lainnya. Akun uji Pro tanpa batas waktu dengan satu catatan
  riwayat, sehingga e2e hanya membuktikan keadaan tanpa batas.
- **Tur sorotan langkah jam buka (JB9a) hanya teruji di unit test**
  (`titikJamBuka`), karena spec tur wizard berhenti di langkah lokasi;
  mencapai langkah jam buka butuh mengisi lokasi berkoordinat lebih dulu
  (16 November 2026).
- **Rombak panel admin (24 November 2026) teruji di 390, 768, dan 1280
  px saja**: susunan empat kolom (wadah 600 sampai 960 px) di 1024 px dan
  kartu di 640 px tidak punya skenario. Panel bawah dialog di HP hanya
  diuji untuk Perpanjang; Ubah Plan, Aktifkan, Bekukan, dan Hapus memakai
  kelas yang sama. Keluar lewat menu avatar HP hanya diperiksa tampil,
  tidak diklik, karena logout memutar `tokenVersion` admin uji.
- **Topbar admin saat `GET /akun/me` gagal** (email tidak tampil, Keluar
  tetap ada) hanya terbaca dari kode.
- **Revisi profil (24 November 2026) teruji di 390 dan 1280 px untuk
  popup, dan 390, 768, serta 1280 px untuk laman**: popup di tablet 768 px
  dan sidebar mode ikon di desktop tidak punya skenario. Ganti pengguna
  teruji di tab yang sama; muat ulang sesudahnya menunggu backend butir
  190.
- **Batal terkunci selama menyimpan (BT2a) teruji e2e hanya di ubah
  metode pembayaran** (`pengaturan/kelola-metode-pembayaran`, PUT ditahan
  lalu diteruskan). Batal di buat dan ubah akun admin memakai pola yang
  sama dan hanya terbaca dari kode.

Dilunasi 24 November 2026 (utang pengujian kelompok inventaris dan
gudang, `826f0ab`) dan dipindah dari `referensi/utang-pengujian.md` tanpa
perubahan teks; tiga butir (penjaga ruang stock opname, halaman
berikutnya, surat jalan per kemasan) dipersempit ke sisanya di sana.
Skenario baru di `inventaris/halaman-berikutnya`, `produk/crud-produk`,
`stockOpname/ruang-dan-pic`, `dashboard/dashboard-gudang`,
`transferStok/daftar-surat-jalan`, `pengajuanStok/alur-pengajuan-stok`,
`pengajuanStok/pengembalian-jalur-gagal`, dan
`bahanBaku/konversi-satuan`. Temuan: hapus produk 404 (`modul/produk-kategori.md`,
HP1a) dan revisi per kemasan di backend (`kontrak/temuan.md` butir 192).

- **Jalur gagal dialog hapus produk hanya diuji dengan jawaban 500
  tiruan**; penolakan hapus dari backend sungguhan belum teruji.
- **Penjaga ruang detail stock opname hanya teruji untuk dokumen yang
  tipe lokasinya diketahui**, dan kedua skenarionya dilewati bila ruang
  itu belum punya dokumen. Nama PIC yang gagal dimuat (teks cadangan)
  belum teruji e2e.
- **Kartu pengajuan dashboard gudang hanya teruji cabang tanpa
  pengajuan siap surat jalan** pada data uji sekarang; cabang klik kartu
  ke tab Perlu Surat Jalan berjalan bila ada pengajuan APPROVED atau
  PENDING tanpa surat jalan.
- **Kirim Barang dan Penerimaan Stok hanya teruji lewat alur penuh**:
  jalur gagal kirim, revisi, dan batal surat jalan pengembalian, serta
  terima sebagian di gudang, belum punya skenario.
- **Teks dialog batal surat jalan hanya teruji bila ada surat jalan
  Belum Dikirim**: badge daftar teruji e2e sejak `2bcb1ce`, sedangkan
  skenario dialog batal dilewati bersyarat bila tidak ada surat jalan
  PENDING (data uji 14 November 2026 tidak punya).
- **Navigasi halaman berikutnya pada daftar berhalaman server** hanya
  teruji di jurnal stok. Stock adjustment, stock opname, surat jalan, dan
  pengajuan stok menguji halaman pertama, parameter query, dan total dari
  `pagination` (`98054b8` sampai `ebf782b`).
- **Setujui yang disembunyikan bagi rekan selokasi pengaju (PG2a) hanya
  teruji di unit test** (`rekanSelokasiPengaju`), karena butuh pengajuan
  dari pengaju berlokasi kerja dan penyetuju berlokasi kerja sama; spec
  daftar pengajuan hanya membuktikan `dimintaOleh.locationID` dari
  respons nyata (16 November 2026).
- **Surat jalan per kemasan (B365) hanya teruji di unit test**: revisi
  dan terima mengirim `satuan` (`susunPayloadRevisi`,
  `susunPayloadTerima`) dan selisih terima dibandingkan dalam satuan dasar
  (`faktorKeDasar`), tetapi alur revisi dan terima lewat UI dengan bahan
  berkemasan belum dibuat e2e, karena butuh surat jalan berisi bahan
  fixture "E2E Bahan Kaleng" dari pengajuan yang disetujui.
- **Stok terbaca di inventaris gudang** hanya teruji di unit test
  (`rincianKemasan`); e2e membuktikannya di daftar stok outlet.

Dilunasi 24 November 2026 (utang pengujian kelompok reservasi, jadwal,
dan tampilan, `2090dd8`) dan dipindah dari `referensi/utang-pengujian.md`
tanpa perubahan teks; dua butir (Tandai Selesai, Rekap Absensi)
dipersempit ke sisanya di sana. Skenario baru di
`reservasi/daftar/lihat-reservasi`, `reservasi/daftar/tandai-selesai`,
`jadwal/rekap-absensi`, `keuangan/mesin-kasir`, dan
`dashboard/panduan-dashboard`. Temuan: RK2a dan TG3a (diperbaiki), serta
butir 193 dan 194 untuk backend.

- **Status aset "Digunakan"** belum teruji (penghapusan aset yang punya
  booking teruji di `reservasi/aset/crud-aset.spec.ts` sejak `66ea7a4`).
  Spec daftar reservasi kini membuat booking sungguhan yang
  mencakup waktu sekarang, tetapi label status aset uji hanya dibandingkan
  dengan respons `GET /aset`, karena daftar aset di-cache backend 60 detik
  dan belum terbukti dibersihkan saat booking dibuat.
- **Tandai Selesai hanya teruji untuk satu booking yang dibayar Rp1.**
  Tombol yang tidak tampil (belum dibayar, jam sudah lewat, tanpa
  `update-booking`) hanya teruji di unit test
  (`tests/unit/features/sesi-booking/izin.test.ts`), dan bagian Sesi
  Booking tanpa `read-booking` belum teruji. Setiap run meninggalkan
  satu penjualan booking VOID.
- **Metode tunai berlaci mesin kasir yang dinonaktifkan (PB15a) hanya
  teruji di unit test** (`metodeLaciMesinKasir`), karena butuh metode
  tunai yang akun kasnya laci uji yang sedang dipetakan, sedangkan spec
  mesin kasir melepas pemetaannya di akhir (16 November 2026).
- **Booking lintas tengah malam di timeline (TL1a) belum teruji e2e**:
  spec reservasi hanya memeriksa query `tampilan=timeline`, karena butuh
  booking yang melewati 00.00 dari hari sebelumnya (16 November 2026).
- **Penyaringan titik tur dashboard menurut plan hanya teruji di unit
  test** (`titik-dashboard.test.ts`, `kunciPanduanDashboard`): titik tur
  ruang outlet tidak bergantung plan, dan tur ruang gudang tidak ada bagi
  plan tanpa gudang. Penyaringan menurut izin teruji e2e sejak 24 November
  2026 (`dashboard/panduan-dashboard`, pengguna tanpa `read-pengguna`).
- **Rekap Absensi tanpa izin, gagal dimuat, dan bulan kosong** hanya
  teruji dari kode (pesan dan keadaan kosong); spec
  `jadwal/rekap-absensi` berjalan dengan data bulan berjalan.

Dipindah 24 November 2026 saat bersih-bersih dokumentasi, tanpa
perubahan teks: dua butir yang sudah lunas tetapi masih tercatat di
`referensi/utang-pengujian.md`.

- **Hapus bahan baku yang berhasil tidak teruji e2e** sejak `43f09af`:
  skenarionya `test.fixme` menunggu backend (`kontrak/temuan.md` butir
  143), dan skenario tambah, cari, dan edit meninggalkan satu bahan uji
  berstok 50 per run. Skenario hapus lama sempat lolos di suite penuh 11
  Oktober 2026 walau bahannya tidak terhapus, karena buktinya hanya baris
  yang tidak ada di tabel; dua bahan uji dari run itu dibiarkan sebagai
  bukti.
  Sejak `cfaaa92` `test.fixme`-nya dilepas, setelah butir 143 tertutup
  (`arsip/riwayat-pengujian.md`, Riwayat pelepasan fixme).
- **Skenario "Batalkan kembali ke daftar" di spec buat reservasi gagal di
  suite penuh** (1 November 2026 dan `6db571d`), tetapi lolos 8 dari 8 bila
  dijalankan sendiri; penyebabnya belum ditelusuri. Ditelusuri lewat trace
  saat suite penuh berikutnya menggagalkannya lagi, tanpa run tambahan
  untuk memancingnya. Suite terhadap backend `4759208` (4 November 2026)
  meloloskannya.
  Penyebabnya ditemukan 23 November 2026 dari kode, tanpa run tambahan:
  tombol memakai `router.back()`, sehingga tujuannya bergantung riwayat
  tab. Diganti tujuan pasti (KB1a, `modul/ui-ux.md`) dan dibuktikan
  `tampilan/tombol-kembali`. Lunas.

Dilunasi 25 November 2026 dan dipindah dari
`referensi/utang-pengujian.md` tanpa perubahan teks: booking Selesai tidak
dihitung bentrok (`reservasi/buat/buat-reservasi`, booking berbayar tiga
jam lalu terbaca Selesai); `hapusLewatApi` membedakan route yang tidak ada
(404 "Not Found" dari `app.js` backend) dari data yang sudah terhapus;
kartu lokasi Profil Toko tanpa outlet (`pengaturan/profil-toko`, akun
klien sekali pakai); diskon yang berakhir selagi Buat Penjualan terbuka
ditolak backend saat disimpan dan pesannya tampil
(`penjualan/alur-penjualan`); pesan titipan PIN tampil sekali dan tidak
muncul lagi saat dimuat ulang (`profil/kelola-profil`); seluruh 26 rute
ber-`[id]` lewat pengguna baca-saja dengan id uji (`akses/gerbang-baca-saja`);
perpindahan halaman daftar akun admin, yang ternyata sudah teruji sejak
`7ea8427` (`admin/akun-klien`); dan ringkasan Belanja Stok untuk sebelas
pembelian (`keuangan/belanja-stok`).

- **Bentrok yang tidak menghitung booking Selesai** (keputusan R6a) hanya
  teruji di unit test `bookingBentrok`, karena membuat booking Selesai di
  e2e berarti membuat booking di masa lalu.
- **`hapusLewatApi` menerima 404 sebagai sudah terhapus**, padahal route
  yang dihapus backend juga menjawab 404. Route hapus yang hilang tidak
  terdeteksi helper ini; yang menangkapnya adalah audit endpoint
  (`referensi/helper-dan-shell.md`, Helper penggantian).
- **Kartu lokasi Profil Toko untuk tenant tanpa outlet belum teruji**,
  karena tenant uji punya outlet; dapat dibuktikan dengan akun klien
  sekali pakai yang wizard-nya berhenti sebelum langkah lokasi. Tanpa
  `read-location` teruji e2e sejak 20 November 2026 lewat "E2E Tanpa
  Lokasi", dan kartu profil tanpa `update-tenant` serta kartu lokasi tanpa
  `update-location` sejak `cbfa23b` lewat pengguna baca-saja.
- **`sedangBerlaku` pilihan diskon kasir dapat tertinggal sampai lima menit
  di cache**, dan itu tidak diuji. Pilihan diskon di buat reservasi dan
  buat penjualan teruji e2e (`diskon/pilihan-kasir`, 24 November 2026).
- **Pesan titipan setelah PIN berubah hilang bila halaman dimuat ulang**,
  karena hanya hidup di memori; itu tidak diuji.
- **Sisi tertolak gerbang rute ber-`[id]` teruji e2e hanya di ubah akun
  kas** (`keuangan/ubah-akun-kas`, pengguna baca-saja); rute ber-`[id]`
  lain hanya di unit test (`gerbang-rute.test.ts`). Seluruh rute statis
  `IZIN_HALAMAN` teruji e2e sejak 24 November 2026
  (`akses/gerbang-baca-saja`).
- **Perpindahan halaman daftar akun admin belum teruji e2e**: skenarionya
  dilewati selama data uji berisi tidak lebih dari 10 akun; dapat
  dibuktikan dengan akun klien sekali pakai yang dihapus lagi lewat API
  admin (dipindah dari `modul/panel-admin.md`, 24 November 2026).
- **Ringkasan Belanja Stok untuk periode lebih dari satu halaman hanya
  teruji di unit test**: kartu ringkasan dibaca dari endpoint ringkasan,
  terpisah dari daftar berhalaman. Butuh lebih dari 10 pembelian dalam
  periode; periksa data uji lebih dulu (dipindah dari `modul/keuangan.md`,
  24 November 2026).

Dilunasi 25 November 2026 (`akses/syarat-rute`): setiap rute
`IZIN_HALAMAN` dibuka sebagai peran uji yang memegang tepat izin syaratnya;
temuan SR1a sampai SR4a (`modul/akses.md`) diperbaiki lalu seluruh rute
terbuka tanpa 403.

- **Syarat 44 entri baru `IZIN_HALAMAN` diturunkan dari nama hook dan
  kontrak, bukan dari trace per halaman.** Yang terbukti: pemilik seluruh
  izin membuka setiap rute terpetakan (unit), dan spec terdampak lolos.

Dilunasi 25 November 2026 lewat audit seluruh spec atas keputusan pemilik
proyek (88 pemanggilan API tulis di spec, ditambah helper). Diubah ke UI,
karena data subjek dibuat lewat halaman yang diuji (keputusan rancangan
butir 23): tarif uji di `reservasi/tarif` (form Buat Tarif), tipe aset dan
aset uji di spec CRUD-nya (`buatTipeAsetLewatForm`, `buatAsetLewatForm`),
pola roster uji (dialog), jadwal uji (`buatJadwalLewatKalender`), dan libur
di `jadwal/lihat-jadwal`. Tetap lewat API karena sah menurut butir 23:
pembersihan di `finally`, data milik halaman lain (misalnya tipe aset di
spec aset dan tarif, booking dan pembayaran di spec daftar reservasi, mesin
dan metode di form pembayaran), bukti penolakan backend, keadaan bersamaan
("diubah di luar"), keadaan yang tidak dapat dibuat lewat UI (booking
lampau, diskon berakhir per detik, saldo terkuras), prasyarat batas (10
metode atau akun aktif), dan fixture tetap yang dibuat sekali bila belum
ada.

- **Spec yang ditulis sebelum keputusan rancangan butir 23 masih
  menyiapkan sebagian data uji lewat API.** Diaudit menyeluruh atas
  keputusan pemilik proyek 25 November 2026, per modul. Sudah lewat UI:
  tarif uji (form Buat Tarif), pola roster uji (dialog), dan jadwal uji
  (`buatJadwalLewatKalender`: Tambah Manual, atau Tambah Split Shift untuk
  shift kedua). Pemanggilan API yang tetap sah menurut butir 23:
  pembersihan, data milik halaman lain, bukti penolakan backend, keadaan
  bersamaan, dan keadaan yang tidak dapat dibuat lewat UI.

## Kejadian sesekali yang tidak berulang

- **Master Shift tampil sebagai kartu di 1280 px, sekali** (20 November
  2026, spec terdampak sesudah pembersihan data uji, 127 lolos dan 1 gagal
  dari 128): `crud-shift` "read: elemen antarmuka" tidak menemukan kepala
  kolom "Nama Shift", karena `DataTable` sedang dalam mode kartu (LT1a).
  Diulang sendirian 2 kali, bersama skenario happy path 5 kali, dan satu
  folder `jadwal/shift` sekali: seluruhnya lolos. Penyebab tidak
  terbukti; dugaan terdekat ukur ulang mode kartu yang lengket saat isi
  daftar berubah tanpa mengubah kunci ukur ulang (`modul/ui-ux.md`,
  Utang terbuka). Ditelusuri lewat trace bila suite penuh menggagalkannya
  lagi.

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
