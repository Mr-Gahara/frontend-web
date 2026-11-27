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
- PW01 (selesai) menyiapkan backend lokal: kode dan basis data `6478d29`.

## Antrean

| Kode | Judul | Kelompok | Status | Commit |
|---|---|---|---|---|
| PW01 | Langkah sesudah tarik backend `6478d29` dan dokumen sinkron | Sekarang | Selesai | `db12e2a` |
| PW02 | Bukti tiga merah disengaja: butir 191, 192 (bersama 189), 193 | Sekarang | Selesai | `09d507e` |
| PW03 | Butir 190: Ganti pengguna bertahan setelah dimuat ulang | Sekarang | Selesai | `569c3f9` |
| PW04 | Butir 194: Rekap Absensi boleh kosong, RK2a dikembalikan | Sekarang | Selesai | `12ded07` |
| PW05 | Butir 195: booking tanpa pajak per aset | Sekarang | Selesai | `c214786` |
| PW06 | Lonceng LN17a: pengembalian menunggu diterima di gudang | Sekarang | Selesai | `efb5596` |
| PW07 | Lonceng LN1a dan LN8a: produk dapat dijual dari ringkasan | Keputusan | Selesai | `b9fe4a0` |
| PW08 | Lonceng: perangkat menunggu izin | Keputusan | Selesai | `9b6c133` |
| PW09 | Mesin Kasir: data sesi tahap 1 dan Pindah Dana buka kasir | Keputusan | Selesai | `b232cad` |
| PW10 | Struk tutup kasir: daftar dan laporan periode | Keputusan | Selesai | `00fbd5d` |
| PW11 | Struk tutup kasir: cetak dari browser 80 mm | Sekarang | Selesai | `c289fd9` |
| PW12 | Struk tutup kasir: unduh PDF dan Excel | Sekarang | Selesai | `e42caa9` |
| PW13 | Struk tutup kasir: e2e alur nyata | Sekarang | Selesai | `86aa357` |
| PW14 | Suite e2e penuh penutup putaran | Menunggu izin | Selesai | `81e9214` |
| PW15 | Pindah Dana buka kasir tanpa Batalkan (butir 196) | Menunggu backend | Belum | |
| PW16 | Kelas `font-mono` menjadi Geist Mono | Keputusan | Selesai | `0d30692` |
| PW17 | Dokumen sinkron sesudah PW14 | Sekarang | Selesai | `3284338` |
| PW18 | Panduan menyiapkan absensi: lonceng, langkah berurutan, dan catatan syarat | Keputusan | Selesai | `041238b` |
| PW19 | Lonceng kesiapan toko: akun baru mendahulukan setup sampai siap beroperasi | Keputusan | Selesai | `f606985` |
| PW20 | Kesiapan ruang gudang (Pro): petugas, absensi, dan barang gudang pertama | Keputusan | Selesai | `3198f5d` |
| PW21 | Staf akses aplikasi tampil di daftar ruang (butir 197) | Keputusan | Selesai | `7553126` |

Kelompok: **Sekarang** dapat langsung dikerjakan; **Keputusan** dapat
dikerjakan sekarang tetapi dimulai dengan dialog keputusan;
**Menunggu izin** hanya atas izin pemilik proyek; **Menunggu backend**
dimulai begitu backend menyediakan yang dibutuhkan. Urutan yang disarankan
mengikuti tabel; PW10 sampai PW13 berurutan, dan PW11 serta PW12 butuh
PW10.

## Rincian paket

### PW01: langkah sesudah tarik backend `6478d29`

Selesai 26 November 2026. Permission selaras (163 nama, Owner 160, seed
tidak berubah); `hapusPajakAset.js` diterapkan sesudah cadangan
`produkpajaks` (1 field `assetID` dan 2 index lama dibuang); index model
baru terbentuk. Bagian Backend dan Mobile kedua rencana struk dihapus,
dan rencana struk tutup kasir memuat data laporan per periode. Butir 139,
186, 187 sudah Tertutup sejak 23 November 2026. Rincian di
`referensi/keputusan-penyesuaian-backend.md` (`6478d29`).

### PW02: bukti tiga merah disengaja

Selesai 26 November 2026. Spec `akses/template-role`,
`inventaris/bahanBaku/konversi-satuan`, dan `reservasi/daftar/tandai-selesai`
lolos tanpa diubah terhadap backend `6478d29` (B377, B369, B370), dua kali
berturut-turut, 14 dari 14. Butir 191, 192, 193 dipindah ke
`arsip/laporan-backend.md` dan Tertutup di `kontrak/temuan.md`; butir 189
ditutup bersama 192. Suite penuh berikutnya tidak mengharapkan kegagalan.

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

Selesai 26 November 2026 (`12ded07`). Teks keadaan kosong dikembalikan
(RK2a); skenario AR40 diganti perilaku B379 (Januari 2019 tanpa staf,
`totalStaf` 0); keadaan kosong diuji dari bulan kosong nyata tanpa
simulasi. Karena bulan berjalan kini dapat kosong, tabel, daftar HP, dan
luberan memakai bulan berstaf terbaru dalam 12 bulan, dibuka lewat Bulan
sebelumnya. Butir 194 dipindah ke `arsip/laporan-backend.md`.

### PW05: butir 195, booking tanpa pajak per aset

Selesai 26 November 2026 (`c214786`). Skenario berhasil buat-reservasi
membaca detail penjualan booking: baris booking tanpa pajak per item dan
pajak per transaksi aktif tetap dikenakan; skenario baru kelola-pajak
membuktikan `assetID` ditolak 400 dan aset tanpa relasi pajak (B383).
Tidak ada kode web yang berubah. Ditemukan dan diperbaiki: R6a mencari
booking lampau menurut aset dan jam saja, sehingga run kedua dalam jam
yang sama memilih booking VOID run sebelumnya. Butir 195 dipindah ke
`arsip/laporan-backend.md`.

### PW06: lonceng LN17a, pengembalian di ringkasan gudang

Selesai 26 November 2026 (`efb5596`). Tipe ringkasan gudang menambah
`transfer.perArah`, dan kartu pengembalian menunggu diterima di gudang
memakai ringkasan gudang per arah bagi pengguna gudang saja; penerimaan
di outlet tetap dari ringkasan outlet (LN21a). Bukti unit test saja, atas
pilihan pemilik proyek (data tanpa surat jalan DIKIRIM; dicatat di utang
pengujian). Kebutuhan lonceng ini dipindah ke `arsip/laporan-backend.md`.

### PW07: lonceng LN1a dan LN8a dari ringkasan dashboard

Selesai 27 November 2026 (`b9fe4a0`). Pemicu LN1a dibaca dari
`produk.total` dan `produk.dapatDijual` ringkasan dashboard outlet (B380);
`GET /produk` dibuang dari lonceng. Kartu tidak ada yang dapat dijual
cukup angka, "N produk stoknya habis.", dengan tautan Lihat produk dan
Pembelian Stok (LN22a). Soal izin gugur karena laman pemakai pesan stok
berada di ruang outlet. B380 dibuktikan e2e terhadap hitungan dari
daftar produk; laporannya dipindah ke `arsip/laporan-backend.md`.

### PW08: lonceng, perangkat menunggu izin

Selesai 27 November 2026 (`9b6c133`). Kartu Perlu tindakan tingkat toko
dari `GET /device?status=pending` (B381) bagi pemegang `update-pengguna`:
angka dan sampai tiga nama pengguna, "Setujui lewat aplikasi.", tanpa
tautan (LN23a). Token pengguna dikirim eksplisit lewat `apiData`, sehingga
`determineTokenKey` tidak diubah. Dibuktikan e2e dengan perangkat kedua
pengguna uji E2E Kasir Outlet; laporannya dipindah ke arsip.

### PW09: Mesin Kasir, data sesi tahap 1

Selesai 27 November 2026 (`b232cad`). Tipe sesi memuat `periodeKasirID`,
`pindahDanaBuka`, dan respons tutup ber-`periode` (`HasilTutupKasir`,
untuk PW10). Kartu "Saat kasir dibuka" di rincian sesi lima baris bila
laci dikosongkan (MK18a); Batalkan Pindah Dana buka kasir tetap tampil
dengan pesan 409 backend apa adanya, dan penanda asalnya dilaporkan
(MK19a, butir 196, PW15). Ringkasan sesi tidak ditampilkan web, sehingga
B374 tidak mengubah label. Helper `bukaKasirLewatAplikasi` menerima modal
kosong, `pindahDana`, dan catatan; skenario baru `keuangan/mesin-kasir`
membuktikan keduanya terhadap respons nyata.

### PW10: struk tutup kasir, daftar dan laporan periode

Selesai 27 November 2026 (`00fbd5d`). Dari kanvas tiga desain, pemilik
proyek memilih desain A untuk kedua laman: anak menu "Tutup Kasir" di
grup Laporan dengan daftar periode (`DataTable` server, filter Periode
dibuka) dan laman laporan bersusunan struk di tengah, serta tautan dari
rincian sesi (PT1a sampai PT5a, `modul/keuangan.md`). Komponen
`StrukLaporan` dipakai cetak PW11. Ditemukan: kelas `font-mono` jatuh ke
tumpukan bawaan Tailwind (PW16).

### PW11: struk tutup kasir, cetak dari browser

Selesai 27 November 2026 (`c289fd9`). Tombol "Cetak struk" di kepala
laman laporan periode TUTUP memanggil `window.print`; salinan
`StrukLaporan` khusus cetak dipasang di body, dan `@media print`
menyembunyikan selainnya. `size: 80mm auto` ternyata tidak sah (PDF
terukur Letter), sehingga kertas 80 mm x tinggi struk disetel pada
`beforeprint`. Dibuktikan e2e lewat `emulateMedia` dan ukuran `/MediaBox`
PDF.

### PW12: struk tutup kasir, unduh

Selesai 27 November 2026 (`e42caa9`). Tombol "Unduh" bergaris tepi di
samping Cetak struk (papan A) memakai `TombolUnduhLaporan` dengan pilihan
PDF dan Excel saja, lewat `sesiKasirApi.unduhPeriode` (`apiClient.unduh`),
hanya untuk periode TUTUP. Isi Excel dibaca `exceljs` di spec dan sama
dengan laporan backend. Penolakan 403 bagi kasir tetap di PW13.

### PW13: struk tutup kasir, e2e alur nyata

Selesai 27 November 2026 (`86aa357`). Spec `keuangan/struk-tutup-kasir-alur`:
sesi pembatas, lalu penjualan POS tunai, non-tunai, dan belum dibayar dari
aplikasi serta invoice dari web, ditutup dari web; laporan backend sama
dengan harapan dari transaksi itu, begitu pula layar, cetak, dan Excel;
kasir tanpa `read-sesi-kasir` ditolak 403; VOID sesudah tutup tidak
mengubah laporan. Batas hitungan buka dan tutup kasir (10 per menit per
pengguna) ditunggu helper `tungguBatasHitungan`. Kriteria selesai MVP
bagian web ditutup.

### PW14: suite e2e penuh

Selesai 27 November 2026 atas izin pemilik proyek, pada web `81e9214`
dan backend `6478d29`, dengan charger tersambung dan layanan uji lengkap
(Mailpit, env inline): e2e 837 lolos dari 837 dalam 54,8 menit, tanpa
gagal maupun dilewati, termasuk spec ber-OTP; vitest 1333 lolos dari
158 berkas. Ketiga merah disengaja (butir 191, 192, 193) lolos tanpa
diubah. Tidak ada perbaikan kode; baseline baru di `inti/pengujian.md`.

### PW15: Pindah Dana buka kasir tanpa Batalkan

Menunggu backend (butir 196, `referensi/laporan-untuk-backend.md`):
respons jurnal transfer membawa penanda asal buka kasir. Sesudahnya menu
Batalkan di `features/jurnal-transfer/halaman-pindah-dana.tsx`
disembunyikan untuk jurnal itu (aturan di `features/jurnal-transfer/izin.ts`
atau fungsi murni), skenario 409 di `keuangan/mesin-kasir` diganti
pemeriksaan tanpa Batalkan, dan MK19a diperbarui.

### PW16: kelas `font-mono` menjadi Geist Mono

Selesai 27 November 2026 (`0d30692`). Pemetaan `--font-mono` hanya ada
di blok lama `app/globals.css` yang seluruhnya dikomentari; atas
keputusan pemilik proyek token ditambah ke `@theme inline` aktif, blok
mati dibuang, dan `StrukLaporan` kembali berkelas `font-mono` (FN1a,
FN2a, `modul/ui-ux.md`). Geist Mono 0 sampai 5% lebih sempit tanpa
luberan baru; skenario HP `keuangan/laporan-tutup-kasir` memeriksa
hurufnya.

### PW17: dokumen sinkron sesudah PW14

Selesai 27 November 2026 (`3284338`), dokumen saja: Keadaan di
`inti/status.md` kini menyatakan pembuktian web selesai dan sisa web
hanya PW15, label usulan dibuang dari Kriteria selesai MVP di
`referensi/rencana-struk-tutup-kasir.md`, dan Keadaan
`referensi/laporan-untuk-backend.md` menyebut suite penuh PW14.

### PW18: panduan menyiapkan absensi

Selesai 27 November 2026 (`041238b`), atas keputusan pemilik proyek
KS10a sampai KS13a (`modul/pemberitahuan.md`, Karyawan dan absensi di
kesiapan toko). Kartu Siapkan toko kini memuat langkah karyawan (Buat
posisi, Tambah karyawan; opsional dengan tombol "Toko ini hanya saya" per
perangkat) dan absensi bila ada staf (Master Shift, Pola Roster, Generate
jadwal; jadwal selesai bila pernah ada dalam 62 hari sampai akhir minggu
depan). Catatan syarat bertaut di Tambah Pengguna, dialog Pola Roster
(Simpan mati tanpa shift aktif), dan Generate Jadwal, di outlet dan
gudang; titik tur Atur jadwal kerja menyebut urutannya. Kotak langkah di
Posisi, Pengguna, Master Shift, Pola Roster, dan Generate Jadwal outlet.
Ruang gudang menjadi PW20.

### PW19: lonceng kesiapan toko

Selesai 27 November 2026 (`f606985`), atas keputusan pemilik proyek
KS1a sampai KS9a (`modul/pemberitahuan.md`, Kesiapan toko). Satu kartu
"Siapkan toko (langkah k dari N)" paling atas di lonceng, dihitung terus
dari data, dengan urutan produk, karyawan, absensi, lalu fitur plan;
langkah produk cukup toko punya produk dan menggantikan kartu Toko belum
punya produk, langkah fitur plan menggantikan kartu setup fitur.
Pengingat jadwal minggu depan dan kehadiran ditahan selama belum ada
staf selain Owner, shift aktif, atau pola roster. Kotak langkah yang
sama di Buat Produk dan wizard Setup. Slot karyawan dan absensi di
`langkahKesiapan` diisi PW18. Urutan bergantung di bidang produk (bahan,
satuan, resep, stok, harga, pajak) dijamin wizard (SA9a sampai SA11a),
sehingga langkahnya cukup punya produk (KS5a).

### PW20: kesiapan ruang gudang (Pro)

Selesai 27 November 2026 (`3198f5d`), atas keputusan pemilik proyek
KS14a sampai KS16a (`modul/pemberitahuan.md`, Ruang gudang di kesiapan
toko). Kartu Siapkan toko memuat bidang gudang di akhir: Masukkan barang
gudang, lalu absensi gudang bila ada petugas gudang; staf dihitung per
ruang, sehingga toko dengan petugas gudang saja tidak mendapat langkah
absensi outlet. Kotak langkah di Inventaris, Master Shift, Pola Roster,
dan Generate Jadwal gudang.

### PW21: staf akses aplikasi tampil di daftar ruang

Selesai 27 November 2026 (`7553126`), dari laporan pemilik proyek:
pengguna berakses App Kasir saja tidak tampil di daftar karyawan, karena
backend memilah ruang hanya dari izin dashboard posisi (butir 197). Atas
keputusan RS1a (`modul/jadwal-shift.md`) web memilah ruang dari lokasi
kerja, lalu izin dashboard, lalu outlet, di halaman Pengguna, Generate
Jadwal, kalender Jadwal, Status Staf, dan lonceng. Laporan butir 197 di
`referensi/laporan-untuk-backend.md`.

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
