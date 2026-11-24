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
proyek**. Pembagian peran dan rancangan data adalah **usulan**.

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
   seluruh metode pembayaran di sesi itu).
3. Tanpa judul: nominal total penerimaan.
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
Total penerimaan      1.680.000
--------------------------------
Total penerimaan      1.680.000
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

Keadaan backend sekarang (`ridho` lokal `1718030`): modal awal sudah ada
sebagai `nominalBuka` di `models/sesiKasirModel.js` (hitungan uang laci
saat buka, bilangan bulat minimal 0), tetapi **wajib diisi**:
`validators/sesiKasirValidator.js` baris 34 sampai 35 menolak dengan
"nominal wajib diisi" bila `nominal` tidak dikirim. Yang dibutuhkan:
`nominal` saat buka menjadi opsional dengan bawaan 0. Ini satu-satunya
isian baru dari sisi pengguna.

**Jebakan yang harus diputuskan lebih dulu** (keputusan terbuka nomor
9): `nominalBuka` sekarang adalah hitungan uang laci, bukan modal
terpisah. Saat buka, backend menghitung `selisih = nominal − saldo akun
laci`; bila tidak 0, catatan wajib diisi dan saldo akun laci dikoreksi
lewat mutasi `SELISIH_KAS_MASUK` atau `SELISIH_KAS_KELUAR`
(`services/sesiKasirService.js` baris 102 sampai 135). Akun laci membawa
saldo dari sesi sebelumnya, sehingga isian kosong yang disimpan 0 pada
laci berisi Rp1.050.000 tercatat sebagai selisih kas keluar Rp1.050.000
dan saldo laci menjadi 0, padahal uangnya masih ada.

## Peta data struk (diperiksa 24 November 2026, backend `1718030`)

| Data di struk | Sumber sekarang | Keadaan |
|---|---|---|
| Nama toko, alamat, logo | `tenant.namaToko`, `tenant.alamat`, `tenant.logoUrl` | Ada |
| Nama dan alamat outlet | `location.nama`, `location.alamat` (lokasi sesi, `sesiKasir.locationID`) | Ada |
| Telepon toko | Tidak ada field telepon di tenant | Belum ada; perlu diputuskan apakah ikut |
| Nama kasir | `sesiKasir.dibukaOleh` dan `ditutupOleh` (nama ter-populate) | Ada; kasir lain yang melayani di tengah sesi belum terbaca (lihat Keputusan terbuka) |
| Waktu buka dan tutup | `sesiKasir.dibukaPada`, `ditutupPada` | Ada |
| Modal awal | `sesiKasir.nominalBuka` | Ada, tetapi wajib diisi, dan nilainya sekaligus hitungan laci yang memicu mutasi selisih (lihat Modal awal) |
| Nominal per metode pembayaran | Pembayaran tunai ke laci membawa `sesiKasirID`; pembayaran non-tunai menyimpan `sesiKasirID` null (`models/pembayaranModel.js` baris 21) | **Belum ada** untuk non-tunai |
| Total penerimaan kasir | Jumlah nominal per metode | **Belum ada** (bergantung baris di atas); detail sesi baru punya `ringkasan.tunaiMasuk` |
| Saldo akhir | `sesiKasir.saldoSistemTutup` atau `nominalTutup` | Ada; maknanya perlu diputuskan |
| Transaksi selesai dan belum terbayar | Penjualan tidak terhubung ke sesi kasir: hanya `penggunaID`, tanpa perangkat maupun `sesiKasirID` (`models/penjualanModel.js`) | **Belum ada** |
| Total sistem, tunai aktual, selisih | `saldoSistemTutup`, `nominalTutup`, `selisihTutup` | Ada |
| Produk terjual per produk dan totalnya | `penjualan.itemPenjualan` (`namaProduk`, `jumlah`), tetapi penjualan tidak terhubung ke sesi | **Belum ada** |

Kesimpulan: data dasarnya ada, tetapi tiga bagian struk butuh
**penjualan dan seluruh pembayaran terhubung ke sesi kasir**.
Mengelompokkan menurut jendela waktu buka-tutup dan kasir tidak akurat:
satu perangkat dapat dipakai beberapa kasir, dan beberapa perangkat dapat
buka bersamaan di satu outlet.

## Bagian backend

Dipindah ke dokumentasi backend saat dikerjakan, lalu dihapus dari sini.
Peran backend (pemilik proyek): menyajikan data yang diminta secara
akurat dan faktual.

**Data:**

- `nominal` saat buka kasir opsional, bawaan 0, tidak pernah null.
- Penjualan yang dibuat dari perangkat dengan sesi kasir terbuka
  menyimpan `sesiKasirID` (usulan), sama seperti pembayaran tunai.
- Pembayaran **seluruh metode** dari perangkat bersesi menyimpan
  `sesiKasirID`, bukan hanya tunai; aturan akun kas tujuan tunai tetap.
- Penjualan dan pembayaran dari web tetap tanpa sesi (web bukan mesin
  kasir).

**Laporan (usulan):**

- Satu endpoint laporan tutup kasir per sesi, misalnya
  `GET /sesikasir/:id/laporan`, berisi seluruh isi struk dalam bentuk
  data siap tampil: informasi toko dan outlet, kasir, waktu, modal awal,
  nominal per metode (nama metode dari salinan di pembayaran, seperti
  struk pelanggan), total penerimaan, saldo akhir, jumlah transaksi
  selesai dan belum terbayar, total sistem, tunai aktual, selisih, dan
  daftar produk terjual beserta totalnya.
- Angka dihitung backend, bukan aplikasi atau web, agar mobile dan web
  menampilkan angka yang sama.
- Disarankan dipotret saat sesi ditutup (disimpan bersama sesi), agar
  cetak ulang esok hari memberi angka yang sama walau ada pembayaran
  yang di-VOID kemudian. Bila tidak dipotret, aturan VOID sesudah tutup
  harus diputuskan (Keputusan terbuka).
- Izin baca mengikuti detail sesi kasir dan pembatasan lokasi kerja
  (P46).

## Bagian mobile

Dipindah ke dokumentasi backend atau mobile saat dikerjakan, lalu
dihapus dari sini.

- Isian modal awal saat buka kasir, boleh kosong (dikirim 0 atau tidak
  dikirim, sesuai keputusan backend).
- Saat tutup kasir: kirim hitungan tunai aktual seperti sekarang, lalu
  ambil laporan dari backend dan cetak ke printer termal dengan susunan
  di atas.
- Cetak ulang laporan sesi yang sudah tutup.
- Aplikasi tidak menghitung sendiri angka laporan.

## Bagian web

Bagian ini tetap di frontend sesudah bagian lain dipindah.

Web bukan mesin kasir, tetapi Owner memantau dan dapat menutup kasir dari
web (`ditutupDari: "web"`, Mesin Kasir). Peran web (usulan):

1. **Rincian sesi di Mesin Kasir** menampilkan laporan tutup kasir dari
   endpoint laporan yang sama, dengan section yang sama dengan struk.
2. **Cetak dari browser** untuk sesi yang ditutup dari web, atau saat
   Owner butuh salinan: halaman cetak selebar struk (80 mm) lewat
   `window.print`, tanpa driver printer khusus. Opsional, bila
   diputuskan.
3. **Unduh** laporan sesi (PDF atau Excel) mengikuti keputusan rancangan
   butir 37 (berkas dibangun backend). Opsional, bila diputuskan.
4. **Spec e2e** dengan respons nyata: sesi dibuka dari aplikasi uji
   (`bukaKasirLewatAplikasi`), transaksi tunai dan non-tunai, ditutup,
   lalu angka laporan di web dibandingkan dengan respons backend.

Tidak ada pekerjaan web sebelum backend menyediakan endpoint laporan.

## Keputusan terbuka

1. **Saldo akhir** (section 4): saldo sistem saat tutup, tunai aktual,
   atau modal awal ditambah penerimaan tunai?
2. **Total penerimaan** di section 2 dan section 3 bernilai sama; apakah
   section 3 memang pengulangan agar mudah dibaca, atau berisi angka
   lain (misalnya penerimaan bersih sesudah VOID)?
3. **Nama kasir** bila beberapa kasir melayani dalam satu sesi: pembuka,
   penutup, atau seluruh kasir yang mencatat penjualan?
4. **Transaksi belum terbayar**: penjualan di sesi itu yang belum lunas
   saat tutup, termasuk yang lunas sebagian?
5. **VOID sesudah tutup**: laporan dipotret saat tutup, atau dihitung
   ulang setiap dibaca?
6. **Telepon toko** di section 1: perlu field baru di tenant?
7. **Penjualan menu**: dihitung dari seluruh penjualan selesai di sesi,
   atau termasuk yang belum terbayar?
8. Peran web nomor 2 dan 3 (cetak dari browser, unduh) ikut MVP atau
   tidak.
9. **Arti modal awal kosong**: "laci memang kosong" (selisih terhadap
   saldo laci dicatat, seperti sekarang), atau "tidak dihitung" (modal
   dicatat 0 tanpa menyentuh saldo laci dan tanpa mutasi selisih)? Bila
   yang kedua, modal awal perlu dipisah dari hitungan laci saat buka.

## Kriteria selesai MVP (usulan)

- Kasir dapat membuka kasir tanpa mengisi modal awal, dan tersimpan 0.
- Penjualan dan pembayaran seluruh metode dari perangkat bersesi
  terhubung ke sesi kasirnya.
- Struk laporan tutup kasir tercetak di aplikasi dengan sembilan section
  dan pemisah seperti di atas, dengan angka dari backend.
- Web menampilkan laporan yang sama di rincian sesi Mesin Kasir.
- Pengujian backend, mobile, dan web membuktikan angka laporan sama
  dengan transaksi sesi, termasuk non-tunai, belum terbayar, dan VOID.
