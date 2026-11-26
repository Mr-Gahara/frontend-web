# Antrean Web

Sifat perubahan: **Sering**: status paket berubah setiap paket selesai; paket baru ditambahkan saat backend maju atau pemilik proyek menambah pekerjaan.

Lapis referensi: dibaca setiap sesi lewat `/lanjut-frontend-web`, bersama lapis inti.

Antrean pekerjaan web yang dipecah menjadi paket kecil berkode `PWnn`,
satu paket per sesi. Disusun 26 November 2026 sesudah backend `ridho`
maju dari `1718030` ke `6478d29` (AR45 sampai AR51, B369 sampai B384),
dari pembacaan `docs/pengembangan/klien.md`, `status/ridho.md`,
`rencana/struk-tutup-kasir.md`, dan `docs/api/` backend, dicocokkan
dengan kode web `82b24c1`.

Kode `PWnn` hanya penanda paket. Keputusan yang lahir di dalam paket
tetap memakai kode keputusan modulnya (misalnya LN22a), dan kode backend
tetap `AR`, `B`, dan `P`.

## Cara memakai

- Sesi baru: `/lanjut-frontend-web PW03`, atau tanpa kode untuk paket
  teratas berstatus Belum di kelompok Sekarang.
- Paket berlabel **Keputusan** memuat pertanyaan untuk pemilik proyek;
  dialog pilihan diajukan sesudah seluruh fakta paket diperiksa, dan
  tidak ada kode ditulis sebelum dijawab (`inti/cara-kerja.md`).
- Paket selesai: kolom Status menjadi `Selesai`, kolom Commit diisi hash
  commit kode (atau dokumen bila paketnya dokumen saja), dan bagian
  rincinya diringkas menjadi satu kalimat hasil. Paket yang memunculkan
  pekerjaan baru menambah baris di akhir kelompoknya.
- PW01 adalah prasyarat seluruh paket lain: backend lokal harus
  menjalankan kode dan basis data `6478d29`.

## Antrean

| Kode | Judul | Kelompok | Status | Commit |
|---|---|---|---|---|
| PW01 | Langkah sesudah tarik backend `6478d29` dan dokumen sinkron | Sekarang | Belum | |
| PW02 | Bukti tiga merah disengaja: butir 191, 192 (bersama 189), 193 | Sekarang | Belum | |
| PW03 | Butir 190: Ganti pengguna bertahan setelah dimuat ulang | Sekarang | Selesai | `569c3f9` |
| PW04 | Butir 194: Rekap Absensi boleh kosong, RK2a dikembalikan | Sekarang | Belum | |
| PW05 | Butir 195: booking tanpa pajak per aset | Sekarang | Belum | |
| PW06 | Lonceng LN17a: pengembalian menunggu diterima di gudang | Sekarang | Belum | |
| PW07 | Lonceng LN1a dan LN8a: produk dapat dijual dari ringkasan | Keputusan | Belum | |
| PW08 | Lonceng: perangkat menunggu izin | Keputusan | Belum | |
| PW09 | Mesin Kasir: data sesi tahap 1 dan Pindah Dana buka kasir | Keputusan | Belum | |
| PW10 | Struk tutup kasir: daftar dan laporan periode | Keputusan | Belum | |
| PW11 | Struk tutup kasir: cetak dari browser 80 mm | Sekarang | Belum | |
| PW12 | Struk tutup kasir: unduh PDF dan Excel | Sekarang | Belum | |
| PW13 | Struk tutup kasir: e2e alur nyata | Sekarang | Belum | |
| PW14 | Suite e2e penuh penutup putaran | Menunggu izin | Belum | |

Kelompok: **Sekarang** dapat langsung dikerjakan; **Keputusan** dapat
dikerjakan sekarang tetapi dimulai dengan dialog keputusan;
**Menunggu izin** hanya atas izin pemilik proyek. Urutan yang disarankan
mengikuti tabel; PW10 sampai PW13 berurutan, dan PW11 serta PW12 butuh
PW10.

## Rincian paket

### PW01: langkah sesudah tarik backend `6478d29`

`ridho` lokal sudah sama dengan `origin/ridho` (`6478d29`), dan `nizar`
serta `yoga` tidak punya commit di luarnya; tidak ada yang digabung.

- Penyelarasan permission langkah 1 (`inti/backend.md`): seed tidak
  berubah sejak `1718030`, tinjauan tetap dijalankan.
- `migrations/hapusPajakAset.js` mode laporan lebih dulu (RUNBOOK backend
  7.1), lalu `--terapkan` bila laporannya menyebut relasi aset atau index
  lama `assetID_1` dan `tenantID_1_assetID_1`.
- Nyalakan ulang backend dengan env inline (`inti/pengujian.md`,
  Menjalankan layanan uji). Index `PeriodeKasir` dan index parsial
  `Penjualan.sesiKasirID` dibentuk Mongoose saat menyala; periksa lewat
  `getIndexes()`.
- Dokumen: paragraf 26 November 2026 di `inti/backend.md` (Pemilik modul
  backend), entri `6478d29` di `referensi/keputusan-penyesuaian-backend.md`,
  dan status butir 139, 186, 187 di `kontrak/temuan.md` serta arsip
  laporan (ditutup backend AR45 dari bukti e2e web 23 November 2026).
- Bagian Backend dan Mobile di `referensi/rencana-struk-tutup-kasir.md`
  dan `referensi/rencana-struk-dapur.md` dihapus, karena sudah dipindah ke
  `docs/pengembangan/rencana/` backend; bagian Web tetap, dengan rujukan
  ke berkas backend. Peta data dan Bagian web struk tutup kasir
  diselaraskan dengan bentuk periode (lihat PW10).
- Tanpa perubahan kode; gerbang `npm run docs:periksa`.

### PW02: bukti tiga merah disengaja

Backend: B377 (batas izin role mengikuti seed, 163), B369 (revisi surat
jalan meneruskan `satuan`), dan B370 (status efektif booking di detail
penjualan).

- Jalankan per berkas, tanpa mengubah spec: `akses/template-role`,
  `inventaris/bahanBaku/konversi-satuan`, dan
  `reservasi/daftar/tandai-selesai`. Ketiganya harus lolos apa adanya
  (`inti/pengujian.md`, Test yang ditandai fixme).
- Bila lolos: baseline tidak lagi mengharapkan kegagalan; bagian merah
  disengaja di `inti/pengujian.md` dan Menunggu backend di
  `referensi/utang-pengujian.md` diperbarui; butir 191, 192, 193 di
  `referensi/laporan-untuk-backend.md` dipindah ke
  `arsip/laporan-backend.md` dengan alat pemindah; butir 189 ditutup
  bersama 192 (B359 sampai B366 terbukti; B367 tidak dipakai web).
- Bila ada yang tetap merah: telusuri trace lebih dulu, lalu laporan baru.
- Tidak ada batas 120 izin di kode web (`features/role`, diperiksa
  26 November 2026), sehingga 191 tidak menyisakan kode.

### PW03: butir 190, Ganti pengguna bertahan setelah dimuat ulang

Selesai 26 November 2026 (`569c3f9`). Skenario muat ulang, `/dashboard`,
dan tab baru sesudah Ganti pengguna di `auth/sidebar-pengguna` lolos
terhadap backend B378. Skenario itu menemukan bug web: `pin-login`
dikecualikan dari percobaan ulang 401, sehingga sesudah tab lain memutar
`tokenVersion` akun, PIN benar ditolak "Sesi telah berakhir atau
dihentikan". Kini penolakan sesi akun disegarkan sekali lalu diulang,
sedangkan PIN salah tidak (`lib/apiClient.ts`, unit test
`tests/unit/lib/api-client-pin-login.test.ts`). Butir 190 dipindah ke
`arsip/laporan-backend.md`.

### PW04: butir 194, Rekap Absensi boleh kosong

Backend B379: rekap per lokasi hanya memuat staf berkegiatan bulan itu,
dan `ringkasan.totalStaf` mengikutinya.

- RK2a (`modul/jadwal-shift.md`) sudah menetapkan teks keadaan kosong
  dikembalikan bila backend memperbaiki; tidak perlu keputusan baru.
  Kodenya di `features/absensi/halaman-rekap-absensi.tsx`.
- Keadaan kosong diuji dari data nyata (bulan tanpa kegiatan, misalnya
  2019-01), menggantikan simulasi bertanda di
  `tests/e2e/jadwal/rekap-absensi.spec.ts`; unit test
  `tests/unit/features/absensi/rekap.test.ts` disesuaikan bila teksnya
  diuji di sana.
- Utang "Keadaan kosong Rekap Absensi hanya teruji lewat simulasi"
  dipindah ke arsip.

### PW05: butir 195, booking tanpa pajak per aset

Backend B383 dan B384 (P89): `POST /produkpajak` menolak `assetID`, dan
baris booking selalu `rincianPajak: []`.

- Web tidak pernah mengirim `assetID` (grep `features` 26 November
  2026), sehingga tidak ada kode yang dibuang.
- Periksa pemakaian `GET /produkpajak/:targetID` di `features/pajak`
  dan `tests/helpers/pajak-uji.ts` terhadap respons yang kini hanya
  relasi produk.
- Bukti: booking dengan pajak transaksi aktif hanya dikenai pajak
  transaksi (spec reservasi yang sudah ada, atau skenario baru bila
  belum ada yang memeriksa baris booking).
- Butir 195 dipindah ke arsip; PO19a (`modul/pengaturan-outlet.md`) diberi
  catatan penutup.

### PW06: lonceng LN17a, pengembalian di ringkasan gudang

Backend B382: `GET /dashboard/gudang` menambah
`transfer.perArah.{permintaan,pengembalian}` berisi
`{ suratJalanPending, sedangDikirim }`.

- `features/notifikasi/sumber-inventaris.ts` dan tipe di
  `features/notifikasi/api.ts`: pengguna yang hanya memegang izin
  dashboard gudang memakai `g.transfer.perArah.pengembalian.sedangDikirim`.
  Batas LN17a sudah diputuskan; ini pelaksanaannya.
- Unit test sumber, dan e2e `dashboard/lonceng-pemberitahuan` bila
  datanya dapat disiapkan; kebutuhan lonceng ini dipindah ke arsip
  laporan.

### PW07: lonceng LN1a dan LN8a dari ringkasan dashboard

Backend B380: `GET /dashboard/outlet` menambah `produk.total` dan
`produk.dapatDijual` (stok terhitung resep di outlet ringkasan).

Keputusan yang perlu diajukan:

- Gerbang berubah: sumber sekarang `GET /produk` bagi `read-produk` atau
  `akses-pos` (`features/notifikasi/hooks.ts`), sedangkan ringkasan
  menuntut izin dashboard outlet. Pemegang produk tanpa izin dashboard
  tetap memuat seluruh produk, kehilangan pemicu, atau cara lain.
- Kartu LN14a menyebut sampai tiga nama produk; ringkasan hanya memberi
  angka. Nama tetap dibaca dari daftar (beban sama) atau kartu cukup
  angka.
- Banner dashboard outlet dan pesan halaman LN3a/LN15a memakai sumber
  yang sama (`features/notifikasi/pesan-stok-produk.tsx`).

Sesudahnya: unit test sumber stok, spec lonceng dan pesan stok, dan
penunggu `!dariLonceng` di `tests/helpers/lonceng-uji.ts` diperbarui
bila lonceng berhenti memanggil `GET /produk`.

### PW08: lonceng, perangkat menunggu izin

Backend B381: `GET /device?status=pending` (`update-pengguna`) memuat
perangkat menunggu se-toko milik pengguna berlevel di bawah peminta
(P39), dengan `pengguna { id, nama, status, level }`.

- Tingkat sudah diputuskan: Perlu tindakan (LN11a).
- `determineTokenKey` di `lib/apiClient.ts` memilih token pengguna lewat
  pola `/device/` (bergaris miring); `GET /device?status=pending` tanpa
  garis miring akan memakai token akun. Panggil dengan `tokenType`
  `pengguna` eksplisit atau perluas polanya (dicatat saat PW03).
- Keputusan yang perlu diajukan: web tidak punya halaman perangkat
  (tidak ada pemanggil `/device` di `features`), sehingga tautan kartu
  belum ada tujuannya: tanpa tautan seperti izin cuti, ke Kelola
  Pengguna, atau halaman persetujuan perangkat baru (cakupan membesar).
  Juga isi kartu (jumlah dan nama pengguna).
- Hitungan berbeda per peminta karena P39; spec memakai pengguna uji
  berlevel rendah dengan perangkat pending, disiapkan seperti
  `bukaKasirLewatAplikasi` di `tests/helpers/sesi-kasir-uji.ts`.

### PW09: Mesin Kasir, data sesi tahap 1

Backend B371, B372, B374, B376 (P88). Web bukan mesin kasir dan tidak
memanggil `POST /sesikasir/buka` (hanya helper uji), sehingga B372
(`GET /sesikasir/akun-tujuan`) tidak dipakai web.

- Tipe sesi di `features/sesi-kasir/api.ts`: `periodeKasirID`,
  `pindahDanaBuka { jurnalTransferID, akunKasTujuan, jumlah }`, dan
  `periode` di respons tutup.
- `features/sesi-kasir/rincian-sesi.tsx` menampilkan modal awal
  (`nominalBuka`, kini boleh 0) dan, bila laci dikosongkan, pindah dana
  saat buka; tanpa itu selisih buka tampak menyesatkan
  (`saldoSistemBuka + selisihBuka − pindahDanaBuka.jumlah = nominalBuka`).
- `ringkasan.tunaiMasuk` dan `jumlahPembayaran` kini hanya pembayaran ke
  laci (B374); periksa label di rincian.
- Helper `bukaKasirLewatAplikasi` menerima modal kosong dan `pindahDana`,
  untuk skenario rincian di `keuangan/mesin-kasir`.

Keputusan yang perlu diajukan:

- Pindah Dana dari buka kasir tidak dapat di-VOID (409, `de0bf66`), tetapi
  respons `jurnalTransfer` tidak punya penanda asalnya (diperiksa
  `mappers/jurnalTransferMapper.js` backend 26 November 2026), sehingga
  tombol Batalkan di `features/jurnal-transfer/halaman-pindah-dana.tsx`
  tetap tampil dan ditolak. Pilihan: tampilkan pesan 409 apa adanya,
  minta penanda ke backend (laporan baru), atau cocokkan dengan
  `pindahDanaBuka` sesi kasir di web.

### PW10: struk tutup kasir, daftar dan laporan periode

Backend B375 dan B376 (P88 butir 9): `GET /sesikasir/periode` (daftar
berhalaman, query `status`, `locationID`, `dari`, `sampai`) dan
`GET /sesikasir/periode/:id` (detail dengan `laporan`, `null` selama
`BUKA`), izin `read-sesi-kasir` atau `buka-tutup-kasir`.

Bagian web di `referensi/rencana-struk-tutup-kasir.md` masih mengusulkan
laporan per sesi di rincian sesi, padahal backend memakai periode
(gabungan sesi di outlet, keputusan 2). Keputusan yang perlu diajukan:

- Letak: tab atau bagian Laporan Tutup Kasir di Mesin Kasir, tautan dari
  rincian sesi lewat `periodeKasirID`, atau keduanya; rute baru tercatat
  di `IZIN_HALAMAN` (`lib/auth/permissions.ts`).
- Tampilan periode `BUKA` (laporan belum ada) dan sesi lama tanpa
  periode (`periodeKasirID: null`).
- Bentuk tampilan di layar: susunan sembilan section struk atau kartu
  web; kanvas desain bila pemilik proyek ingin memilih dulu
  (`inti/cara-kerja.md`, Kanvas desain).

Pelaksanaan: tipe, API, hooks, dan `queryKeys` di `features/sesi-kasir`,
tampilan, unit test pemetaan, dan integration test komponen.

### PW11: struk tutup kasir, cetak dari browser

Keputusan 8 (25 November 2026): cetak dari browser ikut MVP. Halaman
cetak selebar 80 mm lewat `window.print`, susunan dan garis putus-putus
sesuai Susunan struk, hanya untuk periode `TUTUP`. Uji: unit atau
integration untuk susunan, dan e2e yang memeriksa halaman cetak (gaya
`@media print`).

### PW12: struk tutup kasir, unduh

Keputusan rancangan butir 37: `GET /sesikasir/periode/:id?format=pdf`
atau `xlsx` lewat `apiClient.unduh` dan `simpanBerkas`, hanya bagi
`read-sesi-kasir`, hanya periode `TUTUP` (409 bila `BUKA`). Isi Excel
dibaca `exceljs` di spec seperti `unduh/ekspor-daftar`.

### PW13: struk tutup kasir, e2e alur nyata

Sesi baru dibuka lewat aplikasi uji (sesi lama tidak punya periode),
transaksi tunai dan non-tunai bersesi, pembayaran invoice dari web
(tanpa sesi), lalu tutup dari web (respons memuat `periode`); angka
laporan di layar, cetak, dan unduhan dibandingkan dengan respons
backend. Termasuk izin: kasir `buka-tutup-kasir` tidak mengunduh (403).
Kriteria selesai MVP di `referensi/rencana-struk-tutup-kasir.md` ditutup
di sini.

### PW14: suite e2e penuh

Hanya setelah pemilik proyek mengizinkan, dengan charger tersambung dan
layanan uji lengkap (Mailpit, env inline). Spec ber-OTP hanya di sini.
Harapan: tanpa merah disengaja bila PW02 lolos. Baseline baru di
`inti/pengujian.md`.

## Perubahan backend tanpa pekerjaan web

Diperiksa 26 November 2026 terhadap kode web `82b24c1`:

| Label | Isi | Alasan tidak ada pekerjaan web |
|---|---|---|
| B372 | `GET /sesikasir/akun-tujuan` | Hanya untuk aplikasi saat buka kasir; web tidak membuka kasir |
| B373 | `sesiKasirID` di penjualan dan 409 sesi ditutup | Web selalu `null` dan tidak punya sesi kasir; tidak ditampilkan |
| B374 | `sesiKasirID` di pembayaran non-tunai | Sama; dampaknya pada ringkasan sesi dibahas di PW09 |
| B383 | `assetID` ditolak di `POST /produkpajak` | Web tidak pernah mengirimnya (PW05 hanya membuktikan) |

Setiap label B369 sampai B384 lainnya masuk tepat satu paket di atas:
B369, B370, B377 (PW02); B378 (PW03); B379 (PW04); B384 (PW05); B382
(PW06); B380 (PW07); B381 (PW08); B371, B376 (PW09); B375 (PW10 sampai
PW13).

## Ditunda

Tidak masuk antrean sampai keadaannya berubah:

- **Multi-outlet**: jurnal stok Semua Outlet (butir 151), cakupan outlet
  Kirim Barang (AR10a), lokasi beban (LR1a), dan cakupan penjualan
  (`inti/status.md`, Utang kecil).
- **Aplikasi kasir rilis**: tombol Buka aplikasi (`modul/setup-akun.md`).
- **VPS siap**: sisa Persiapan produksi (`inti/status.md`).
- **Struk dapur** (pasca-MVP): backend AR52 `Perlu diputuskan`, tujuh
  keputusan terbuka di `referensi/rencana-struk-dapur.md`.
- **Nomor WhatsApp admin Langganan** (LG1a).
- **Folder `tests/` ke repo privat**, dan `kontrak/route-backend.md`
  (Tetap) dibangkitkan ulang untuk route baru: keduanya hanya atas
  perintah pemilik proyek.
