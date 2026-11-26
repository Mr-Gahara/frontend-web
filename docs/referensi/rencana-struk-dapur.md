# Rencana Struk Dapur

Sifat perubahan: **Jarang**: diperbarui saat rancangannya diputuskan; bagian backend dan mobile dipindah ke backend lalu dihapus dari sini.

Lapis referensi: kirim saat mengerjakan atau merancang struk dapur, di web, backend, maupun mobile.

Fitur pasca-MVP, tidak termasuk rilis MVP (pemilik proyek, 24 November
2026). Dokumen ini mengumpulkan konteks penuhnya agar pemilik proyek
dapat menyiapkan data backend yang tepat bagi web dan mobile. Alurnya,
atas perintah pemilik proyek:

1. Dicatat lengkap di sini lebih dulu, tanpa menulis apa pun di backend.
2. Saat pemilik proyek mengerjakan backend, isi dokumen ini dibaca
   bersama seluruh dokumentasi frontend (bug, temuan, dan utang).
3. Bagian **Backend** dan **Mobile** dipindah ke dokumentasi backend.
4. Di frontend hanya bagian **Web** yang disimpan; bagian lain dihapus,
   karena sudah tercatat lengkap di backend.

Seluruh rancangan di bawah adalah **usulan**, bukan keputusan, kecuali
yang ditandai diputuskan. Keputusan terbuka dikumpulkan di bagian akhir.

## Masalah dan tujuan

Kedai yang memasak pesanan butuh dua kertas untuk satu orderan POS:
struk pelanggan (harga dan pembayaran) dan struk dapur (apa yang harus
dibuat). Tanpa struk dapur, kasir menyampaikan pesanan secara lisan atau
menulis ulang, sehingga pesanan terlewat, tertukar, atau permintaan khusus
pelanggan ("tanpa es", "pedas sedang") hilang.

Tujuan:

- Setiap menu yang dipesan sampai ke dapur tanpa ditulis ulang.
- Permintaan khusus per menu tercatat dan terbaca dapur (catatan
  opsional per menu).
- Pesanan tambahan pada orderan yang sama hanya mengirim tambahannya,
  sehingga dapur tidak memasak dua kali.
- Data pesanan dan catatannya tersimpan di backend, sehingga dapat
  ditelusuri saat ada keluhan dan dibaca ulang di web.

Bukan tujuan versi pertama: layar dapur (Kitchen Display), status masak
per menu, waktu saji, dan laporan kinerja dapur. Ketiganya dicatat di
Pengembangan lanjutan.

## Keadaan sekarang (diperiksa 24 November 2026)

Backend `ridho` lokal `1718030`:

- Tidak ada konsep dapur, stasiun, maupun printer di model, service,
  atau route.
- Item penjualan (`ItemPenjualanSchema`, `models/penjualanModel.js`)
  memuat `produkID`, `namaProduk`, `jumlah`, harga, diskon, pajak, dan
  `sesiBookingID`, tetapi **tidak ada catatan per item**.
- Catatan yang ada hanya `keterangan` tingkat transaksi.
- `jenisPenjualan` sudah membedakan `dine-in`, `takeaway`, dan `booking`;
  `jenisTransaksi` `POS` dan `INVOICE`.
- Struk pelanggan sudah punya `footerStruk` dan `logoUrl` di tenant
  (AR21).

Web: tidak ada halaman atau komponen struk dapur. Buat penjualan web
(`features/penjualan/halaman-buat-penjualan.tsx`) tidak punya isian
catatan per item.

## Istilah

- **Struk dapur** (kitchen ticket): kertas untuk dapur berisi menu,
  jumlah, dan catatan per menu, tanpa harga.
- **Stasiun**: tempat pengolahan yang menerima struk dapur, misalnya
  Dapur, Bar, atau Pastry. Satu toko dapat punya satu atau beberapa.
- **Kirim ke dapur**: saat item pesanan dinyatakan harus dibuat dan
  struk dapurnya dicetak.
- **Item terkirim**: item yang sudah masuk struk dapur, sehingga tidak
  dicetak lagi saat pesanan ditambah.

## Alur pengguna (usulan)

1. Kasir di aplikasi memilih menu. Untuk setiap menu, kasir boleh
   mengisi catatan singkat ("tanpa es", "level 2").
2. Kasir menyimpan pesanan. Pada saat yang sama aplikasi mencetak struk
   dapur ke printer stasiun, berisi item yang belum terkirim, lalu
   backend menandainya terkirim.
3. Struk pelanggan dicetak saat dibayar, seperti sekarang.
4. Pelanggan menambah pesanan sebelum membayar (orderan terbuka): hanya
   item tambahan yang dicetak, dengan penanda "Tambahan".
5. Item dibatalkan sesudah terkirim: struk pembatalan dicetak ke stasiun
   yang sama, agar dapur berhenti membuat.
6. Printer gagal atau kertas habis: kasir menekan cetak ulang; struknya
   ditandai "Cetak ulang", dan item tidak dikirim dua kali.

Pertanyaan alur yang belum diputuskan ada di Keputusan terbuka nomor 1
sampai 3.

## Isi struk dapur (usulan)

- Nama stasiun, nomor pesanan (`noReferensi`), jenis penjualan
  (dine-in atau takeaway), dan nomor meja atau nama pelanggan bila ada.
- Waktu kirim ke dapur dan nama kasir.
- Daftar menu: jumlah, nama menu, dan catatan menu di bawahnya.
- Penanda "Tambahan", "Batal", atau "Cetak ulang" bila berlaku.
- Tanpa harga, diskon, pajak, maupun pembayaran.

## Aturan bisnis (usulan)

- Catatan per menu opsional, teks pendek (usulan batas 100 karakter),
  disimpan apa adanya di item penjualan dan tidak memengaruhi harga.
- Satu menu yang sama dengan catatan berbeda adalah dua baris item.
  Contoh: dua Es Teh, satu "tanpa gula" dan satu biasa.
- Hanya produk yang ditandai perlu ke dapur yang masuk struk dapur;
  minuman kemasan atau barang jadi tidak perlu.
- Item booking (`sesiBookingID`, `jenisPenjualan` booking) tidak masuk
  struk dapur.
- Penjualan VOID sesudah terkirim menghasilkan struk pembatalan untuk
  item yang sudah terkirim.
- Mengubah catatan sesudah terkirim diperlakukan seperti batal lalu
  tambahan, agar dapur menerima versi terbaru.

## Bagian backend dan mobile

Dipindah ke backend `docs/pengembangan/rencana/struk-dapur.md` (AR45,
26 November 2026) dan dihapus dari sini. Backend mencatatnya sebagai
AR52 `Perlu diputuskan`, menunggu tujuh keputusan terbuka di bawah, yang
diajukan sesudah MVP rilis.

## Bagian web

Bagian ini tetap di frontend; bagian backend dan mobile sudah dipindah.

Web tidak mencetak struk dapur. Pencetakan ke printer termal dari
browser tidak andal, dan printer dapur ada di dekat perangkat kasir.
Peran web:

1. **Pengaturan stasiun dapur** (Pengaturan Outlet): daftar stasiun dan
   pemetaan kategori produk ke stasiun, dengan gerbang izin baru di
   `IZIN_HALAMAN`. Owner mengaturnya dari laptop.
2. **Detail penjualan** menampilkan catatan per menu di Rincian Item,
   dan bila tersedia, kapan item dikirim ke dapur atau dibatalkan.
3. **Buat penjualan web** menerima catatan per menu bila backend sudah
   menerimanya, dan Simpan tidak mencetak apa pun.
4. **Spec e2e**: catatan per menu tersimpan dan terbaca ulang, serta
   halaman pengaturan stasiun dengan dan tanpa izin.

Tidak ada pekerjaan web sebelum backend menyediakan `items[].catatan`;
urutannya mengikuti backend.

## Pengembangan lanjutan (di luar versi pertama)

- Layar dapur (Kitchen Display): pesanan masuk tampil di tablet dapur
  dengan status diterima, dimasak, dan siap. Dapat berupa halaman web
  layar penuh, karena tablet dapur cukup memakai browser.
- Waktu saji per pesanan dan laporan kinerja dapur.
- Pemberitahuan pesanan siap ke kasir atau pelayan.

## Keputusan terbuka

Diajukan ke pemilik proyek sebelum backend mengerjakannya:

1. Kapan struk dapur dicetak: saat pesanan disimpan (bayar belakangan),
   atau saat dibayar (bayar di depan)? Bisa juga pengaturan per toko.
2. Apakah orderan terbuka (tambah pesanan sebelum bayar) termasuk versi
   pertama, atau setiap orderan langsung dibayar?
3. Satu printer untuk semua (tanpa stasiun) di versi pertama, atau
   langsung mendukung beberapa stasiun?
4. Pemetaan ke stasiun per kategori atau per produk?
5. Batas panjang catatan, dan apakah ada saran catatan cepat yang
   diatur toko.
6. Apakah nomor meja dan nama pemesan dine-in ikut di versi pertama?
7. Plan mana yang mendapat fitur ini (Basic, Advanced, atau Pro).

## Kriteria selesai versi pertama (usulan)

- Kasir dapat mengisi catatan per menu di aplikasi, dan catatan itu
  tersimpan di penjualan.
- Struk dapur tercetak berisi menu, jumlah, dan catatan, tanpa harga.
- Tambah pesanan hanya mencetak tambahannya, dan cetak ulang tidak
  menggandakan pesanan.
- Web menampilkan catatan per menu di detail penjualan.
- Seluruh jalur di atas punya pengujian di backend, mobile, dan web
  (web: spec e2e dengan respons nyata, keputusan rancangan butir 21).
