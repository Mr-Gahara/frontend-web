# Rencana Struk Laporan Tutup Kasir

Sifat perubahan: **Jarang**: diperbarui saat rancangannya diputuskan; bagian backend dan mobile dipindah ke backend lalu dihapus dari sini.

Lapis referensi: kirim saat mengerjakan atau merancang laporan tutup kasir, di web, backend, maupun mobile.

**Wajib rilis di MVP** (pemilik proyek, 24 November 2026), berbeda dari
struk dapur yang pasca-MVP (`referensi/rencana-struk-dapur.md`). Alurnya
sama dengan struk dapur, atas perintah pemilik proyek: dicatat lengkap di
sini dulu tanpa menulis apa pun di backend; saat pemilik proyek
mengerjakan backend, bagian **Backend** dan **Mobile** dipindah ke
dokumentasi backend lalu dihapus dari sini, dan hanya bagian **Web**
yang tetap.

Susunan struk dan aturan modal awal di bawah **diputuskan pemilik
proyek**. Data dan laporannya sudah dibangun backend `6478d29` (AR47,
AR48); letak dan tampilan web diputuskan di PW10 (`modul/keuangan.md`,
PT1a sampai PT5a).

## Tujuan

Saat kasir ditutup, kasir dan Owner memegang satu lembar laporan yang
menjawab: siapa yang bertugas dan kapan, berapa modal awal, berapa uang
masuk per metode pembayaran, berapa transaksi selesai dan belum dibayar,
apakah uang tunai di laci cocok dengan hitungan sistem, dan produk apa
saja yang terjual. Berlaku untuk toko yang memakai shift maupun yang
tidak: satu laporan untuk setiap sesi kasir (buka sampai tutup).

## Susunan struk (diputuskan)

Setiap section dipisah satu baris garis putus-putus, kecuali antara
section 6 dan section 7 yang dipisah **dua** baris garis putus-putus.

1. **Informasi toko atau outlet** (tanpa judul).
2. Judul **"Laporan Tutup Kasir Transaksi Penjualan"**, berisi: nama
   kasir yang bertugas di sesi itu, waktu kasir buka, waktu kasir tutup,
   jumlah modal awal, nominal masuk untuk setiap metode pembayaran yang
   dipakai di sesi itu, dan total penerimaan kasir (jumlah penerimaan
   seluruh metode pembayaran di sesi itu; diperjelas keputusan 10,
   25 November 2026: transaksi POS realtime).
   Tepat di bawahnya baris "Total penerimaan invoice" (keputusan 11).
3. Tanpa judul: nominal total penerimaan (keputusan 10: total penerimaan
   kasir ditambah total penerimaan invoice).
4. Tanpa judul: nominal saldo akhir.
5. Tanpa judul: jumlah transaksi selesai dan jumlah transaksi belum
   terbayar.
6. Tanpa judul: total nominal sistem, total nominal tunai aktual, dan
   selisih keduanya.
7. Judul **"Laporan Tutup Kasir Penjualan Menu"**, berisi informasi yang
   sama dengan section 2, lalu judul **"Produk Terjual"** di akhir
   section.
8. Tanpa judul: setiap produk yang terjual, berisi nama produk dan
   jumlah terjual.
9. Tanpa judul: total jumlah produk terjual dari section 8.

Gambaran bentuk (contoh angka, lebar kertas mengikuti printer):

```text
            Kopi Senja
     Jl. Gajah Mada No. 12, Pontianak
--------------------------------
LAPORAN TUTUP KASIR
TRANSAKSI PENJUALAN
Kasir           Rina
Buka            24/11/2026 08.00
Tutup           24/11/2026 16.05
Modal awal              200.000
Tunai                 1.250.000
QRIS                    430.000
Total penerimaan kasir 1.680.000
Total penerimaan invoice 250.000
--------------------------------
Total penerimaan      1.930.000
--------------------------------
Saldo akhir           1.450.000
--------------------------------
Transaksi selesai            42
Belum terbayar                2
--------------------------------
Total sistem          1.450.000
Tunai aktual          1.448.000
Selisih                  -2.000
--------------------------------
--------------------------------
LAPORAN TUTUP KASIR
PENJUALAN MENU
Kasir           Rina
...(sama dengan section 2)...
PRODUK TERJUAL
--------------------------------
Es Kopi Susu                 18
Teh Tarik                    12
--------------------------------
Total produk terjual         30
```

## Modal awal (diputuskan)

Modal awal diisi saat kasir dibuka, per sesi kasir (toko bershift dan
toko tanpa shift sama-sama membuka kasir). Isiannya **boleh kosong**,
dan yang kosong disimpan sebagai **0, bukan null**.

Keadaan backend `6478d29` (B371, AR47): `nominal` saat buka opsional
dengan bawaan 0, dan laci yang dikosongkan dikirim sebagai `pindahDana {
akunKasTujuanID, jumlah }`, dicatat sebagai Pindah Dana ke akun kas
pilihan, bukan selisih kas keluar (keputusan 9). Rincian sesi memuat
`pindahDanaBuka`, dengan `saldoSistemBuka + selisihBuka −
pindahDanaBuka.jumlah = nominalBuka`. Jurnal Pindah Dana itu tidak dapat
di-VOID (409). Isian ini diisi aplikasi; web tidak membuka kasir.

## Data laporan dari backend (`6478d29`)

Backend membentuk laporan per **periode**, gabungan seluruh sesi kasir
di satu outlet (B375, B376, P88 butir 9): mesin pertama yang dibuka
membuka periode, mesin lain ikut bergabung, dan sesi terakhir yang
ditutup menutup periode lalu memotret laporannya. Mesin yang sudah
menutup sesinya lalu dibuka lagi memulai periode baru. Sesi sebelum
26 November 2026 tidak punya periode (`periodeKasirID: null`).

- `GET /sesikasir/periode` (daftar berhalaman; query `status` BUKA atau
  TUTUP, `locationID`, `dari`, `sampai`) dan `GET /sesikasir/periode/:id`
  (detail beserta `laporan`, `null` selama BUKA). Izin `read-sesi-kasir`
  (dibatasi lokasi kerja) atau `buka-tutup-kasir` (hanya periode TUTUP
  perangkatnya).
- Unduh `GET /sesikasir/periode/:id?format=pdf` atau `xlsx`, hanya
  `read-sesi-kasir`; periode BUKA dijawab 409.
- Respons tutup kasir menambah `periode: { id, status }`, dan respons
  sesi menambah `periodeKasirID`.

| Section struk | Field `laporan` |
|---|---|
| 1. Toko dan outlet | `toko { namaToko, alamat, logoUrl }`, `outlet { id, nama, alamat }` |
| 2 dan 7. Kasir, waktu, modal, per metode | `kasir[]`, `dibukaPada`, `ditutupPada`, `jumlahSesi`, `modalAwal`, `penerimaanPerMetode[] { namaMetodePembayaran, jumlah }`, `totalPenerimaanKasir`, `totalPenerimaanInvoice`, `jendelaInvoice { dari, sampai }` |
| 3. Total penerimaan | `totalPenerimaan` |
| 4. Saldo akhir | `saldoAkhir` |
| 5. Transaksi | `transaksiSelesai` (PAID), `transaksiBelumTerbayar` (UNPAID) |
| 6. Laci | `totalSistem`, `tunaiAktual`, `selisih` |
| 8 dan 9. Produk terjual | `produkTerjual[] { produkID, namaProduk, jumlah }`, `totalProdukTerjual` |

Rancangan dan aturan hitungnya di backend
`docs/pengembangan/rencana/struk-tutup-kasir.md`, kontraknya di
`docs/api/endpoint/sesiKasir.md` dan `docs/api/payload/sesiKasir.md`.

## Bagian web

Bagian Backend dan Mobile serta peta data 24 November 2026 dipindah ke
backend `docs/pengembangan/rencana/struk-tutup-kasir.md` (AR45,
26 November 2026) dan dihapus dari sini. Bagian ini tetap di frontend.

Web bukan mesin kasir, tetapi Owner memantau dan dapat menutup kasir dari
web (`ditutupDari: "web"`, Mesin Kasir). Peran web, dikerjakan lewat paket
PW09 sampai PW13 (`referensi/antrean-web.md`):

1. **Laporan periode** dari `GET /sesikasir/periode` dan
   `/periode/:id`, selesai di PW10 (`00fbd5d`): anak menu "Tutup Kasir"
   di grup Laporan dengan daftar periode dan laman laporan bersusunan
   struk, serta tautan dari rincian sesi lewat `periodeKasirID`
   (PT1a sampai PT5a).
2. **Cetak dari browser** untuk periode TUTUP: halaman cetak selebar
   struk (80 mm) lewat `window.print`, tanpa driver printer khusus. Ikut
   MVP (keputusan 8; PW11).
3. **Unduh** PDF atau Excel dari `?format=`, mengikuti keputusan
   rancangan butir 37 (berkas dibangun backend). Ikut MVP (keputusan 8;
   PW12).
4. **Spec e2e** dengan respons nyata: sesi baru dibuka dari aplikasi uji
   (`bukaKasirLewatAplikasi`), transaksi tunai dan non-tunai bersesi,
   pembayaran invoice dari web, ditutup, lalu angka laporan di web
   dibandingkan dengan respons backend (PW13).

## Keputusan 25 November 2026

Diputuskan pemilik proyek (25 November 2026), menjawab kesembilan
keputusan terbuka 24 November 2026:

1. **Saldo akhir** (section 4): omzet yang diperoleh kasir dari penjualan
   **lunas** dalam periode struk; penjualan belum terbayar dan VOID tidak
   dihitung.
2. **Satu struk per shift atau per hari toko**: toko bershift mendapat
   satu struk per shift, toko tanpa shift satu struk dari toko buka sampai
   toko tutup. Struk menggabungkan seluruh mesin kasir di outlet selama
   periode itu: Budi di mesin A dan Aryo di mesin B pada shift pagi tetap
   satu struk. Ini mengubah usulan "satu laporan untuk setiap sesi kasir"
   di Tujuan dan Bagian backend (kini di backend
   `docs/pengembangan/rencana/struk-tutup-kasir.md`): laporan dihitung
   per periode shift atau hari toko dari seluruh sesi kasir di dalamnya.
3. **Nama kasir**: seluruh kasir yang bertugas dalam periode struk
   dicantumkan, dan isi struk adalah gabungan transaksi mereka.
4. **Transaksi belum terbayar** (section 5): hanya penjualan yang belum
   dibayar sama sekali (UNPAID); lunas sebagian tidak termasuk, karena
   umumnya hanya terjadi pada invoice, bukan POS.
5. **VOID sesudah tutup**: laporan dipotret saat tutup dan disimpan, agar
   cetak ulang memberi angka yang sama.
6. **Telepon toko**: tidak perlu; section 1 tanpa telepon.
7. **Penjualan menu** (section 8 dan 9): ikut menghitung penjualan yang
   belum terbayar.
8. **Cetak dari browser dan unduh ikut MVP** (peran web nomor 2 dan 3).
9. **Modal awal kosong berarti laci memang dikosongkan saat buka.** Toko
   mengosongkan laci agar isinya murni hasil penjualan hari itu; uang
   hari-hari sebelumnya disimpan di akun kas lain, dan pengeluaran hari
   itu diambil dari akun lain itu, sehingga arus kas masuk kasir hari itu
   tidak terganggu. Uang yang dikeluarkan dari laci saat dikosongkan
   dicatat sebagai **pindah dana dari laci ke akun kas lain** yang
   dipilih, bukan mutasi selisih kas keluar seperti backend `1718030`.

10. **Section 2 dan 3** (koreksi pemilik proyek, 25 November 2026):
    - Baris terakhir section 2 bertulisan **"Total penerimaan kasir"**:
      uang masuk dari transaksi POS realtime (tipe transaksi POS),
      penjualan maupun booking bila fitur Sesi Booking dipakai.
    - Section 3 bertulisan **"Total penerimaan"**: total penerimaan kasir
      ditambah penerimaan dari invoice (tipe transaksi Invoice), baik
      invoice penjualan maupun invoice sesi booking bila fitur itu
      dipakai. Sama dengan section 2 bila tidak ada pembayaran invoice
      dalam periode struk.
    - **Keputusan 11** (pemilik proyek, 25 November 2026): tepat di bawah
      "Total penerimaan kasir" di section 2 ditambah baris **"Total
      penerimaan invoice"**, agar asal angka section 3 tidak ambigu:
      Total penerimaan = Total penerimaan kasir + Total penerimaan
      invoice. Baris ini tampil walau nilainya 0.
    - Akibatnya, laporan juga menghitung pembayaran invoice yang tidak
      lewat mesin kasir (misalnya dicatat dari web, tanpa sesi kasir)
      dalam periode dan outlet struk; cara mengaitkannya dirancang
      bersama backend.

12. **Periode struk toko tanpa shift**: dari mesin kasir pertama dibuka
    sampai mesin kasir terakhir ditutup, saat tidak ada lagi mesin kasir
    yang buka di outlet itu. Toko yang buka melewati tengah malam tetap
    satu struk, karena periode mengikuti kegiatan kasir, bukan jam
    operasional maupun hari kalender.

### Masih terbuka

Tidak ada.

## Kriteria selesai MVP (usulan)

- Kasir dapat membuka kasir tanpa mengisi modal awal, dan tersimpan 0.
- Penjualan dan pembayaran seluruh metode dari perangkat bersesi
  terhubung ke sesi kasirnya.
- Struk laporan tutup kasir per shift atau per hari toko tercetak di
  aplikasi dengan section dan pemisah seperti di atas, dengan angka dari
  backend, dan dapat dicetak dari browser serta diunduh di web.
- Web menampilkan laporan periode yang sama di Mesin Kasir.
- Pengujian backend, mobile, dan web membuktikan angka laporan sama
  dengan transaksi sesi, termasuk non-tunai, belum terbayar, dan VOID.
