# Laporan untuk Backend

Sifat perubahan: **Sering**: bertambah setiap ada temuan backend; butir yang diperbaiki dan dibuktikan web dipindah ke `arsip/laporan-backend.md`.

Lapis referensi: dibaca pemilik proyek saat bekerja di backend, bersama seluruh dokumentasi frontend; dikirim juga saat menyusun atau membuktikan perbaikan backend.

Laporan lengkap temuan backend yang masih terbuka, ditulis di
dokumentasi, bukan sebagai teks siap salin di percakapan (pemilik
proyek, 24 November 2026). Saat bekerja di backend, pemilik proyek
membaca berkas ini bersama `kontrak/temuan.md` (tabel ringkas seluruh
butir), `referensi/rencana-struk-tutup-kasir.md`, dan
`referensi/rencana-struk-dapur.md`.

Bentuk tiap butir mengikuti `inti/backend.md` (Bila menemukan bug
backend): bukti, penyebab, kenapa penting, saran, dan penanganan
sementara di frontend. Nomor butir sama dengan `kontrak/temuan.md`.
Butir diurutkan menurut kepentingan dan ditutup tabel prioritas. Sejak
16 November 2026 Ridho memimpin seluruh pekerjaan backend; pemilik modul
tetap disebut agar jelas modulnya.

**Keadaan 26 November 2026:** seluruh butir dan kebutuhan di bawah
dikerjakan backend `6478d29` (AR46 sampai AR51, B369 sampai B384) dan
berstatus `Menunggu verifikasi` di `docs/pengembangan/klien.md` backend.
Setiap butir dipindah ke `arsip/laporan-backend.md` sesudah web
membuktikannya lewat paket PW02 sampai PW13 (`referensi/antrean-web.md`).

## Laporan 24 November 2026 (utang pengujian)

Diperiksa terhadap backend `ridho` lokal `1718030`.

### Kebutuhan fitur MVP: struk laporan tutup kasir

Bukan bug, tetapi data yang dibutuhkan rilis MVP. Rinciannya di
`referensi/rencana-struk-tutup-kasir.md`:

- `nominal` buka kasir opsional dengan bawaan 0. Laci yang dikosongkan
  saat buka dicatat sebagai pindah dana dari laci ke akun kas lain yang
  dipilih, bukan mutasi selisih kas keluar seperti sekarang (keputusan 9,
  25 November 2026).
- Penjualan dan pembayaran seluruh metode terhubung ke sesi kasir
  (`sesiKasirID`); sekarang hanya pembayaran tunai.
- Endpoint laporan tutup kasir per shift atau per hari toko, menggabungkan
  seluruh mesin kasir dan seluruh kasir di periode itu, dihitung backend
  dan dipotret saat tutup (keputusan 2, 3, dan 5, 25 November 2026).
- "Total penerimaan kasir" dari transaksi POS realtime, dan "Total
  penerimaan" yang menambahkan pembayaran invoice (penjualan dan sesi
  booking) dalam periode dan outlet struk, termasuk yang dicatat tanpa
  sesi kasir (keputusan 10), dengan baris "Total penerimaan invoice"
  tersendiri di bawah "Total penerimaan kasir" (keputusan 11).

## Laporan 25 November 2026 (pemberitahuan lonceng)

Diperiksa terhadap backend `ridho` lokal `1718030`. Bukan bug, tetapi
data yang dibutuhkan lonceng pemberitahuan web (`modul/pemberitahuan.md`,
LN8a). Backend tidak punya sistem notifikasi, sehingga web membentuk
pemberitahuan dari endpoint yang ada.

### Kebutuhan: hitungan produk yang dapat dijual di ringkasan dashboard

Modul produk dan dashboard (Yoga).

- **Bukti:** `services/dashboardGudangService.js` `getOutletSummary`
  hanya menghitung `produk.stokKritis` untuk produk berstok langsung
  (`"resep.0": { $exists: false }`). Stok terhitung produk beresep hanya
  diisi `#isiStokTerkini` di `services/produkService.js` `getAll`.
- **Kenapa penting:** pemicu LN1a ("tidak ada satu pun produk yang dapat
  dijual", termasuk produk beresep berstok terhitung 0) hanya dapat
  dihitung web dari `GET /produk` tanpa paginasi, yang dimuat lonceng di
  setiap halaman dashboard dan berkala tiap 5 menit.
- **Saran:** tambahkan di `GET /dashboard/outlet` jumlah produk
  (`produk.total`) dan jumlah produk yang dapat dijual (`produk.dapatDijual`:
  unlimited, atau stok, termasuk stok terhitung resep, di atas 0).
- **Penanganan sementara di frontend:** lonceng memuat seluruh produk
  dengan kunci cache sendiri dan menghitungnya; pindah ke ringkasan
  begitu field itu ada.

### Kebutuhan: daftar perangkat menunggu persetujuan se-toko

Modul auth dan perangkat (Ridho).

- **Bukti:** `routes/deviceRoute.js` hanya punya `GET /device/:userId`
  (per pengguna, `read-pengguna`) dan SSE `GET /device/events` untuk
  sesi aplikasi; tidak ada daftar atau hitungan perangkat berstatus
  PENDING untuk seluruh toko.
- **Kenapa penting:** pemberitahuan "perangkat menunggu izin" (LN4a)
  tidak dapat dibentuk tanpa memanggil endpoint per pengguna satu per
  satu.
- **Saran:** `GET /device?status=PENDING` (atau hitungannya) per toko,
  dengan izin yang sama dengan persetujuan (`update-pengguna`), memuat
  pengguna pemilik perangkat.
- **Penanganan sementara di frontend:** tidak ada; sumber ini belum
  tampil sampai endpointnya tersedia.

### Kebutuhan: surat jalan dikirim per arah di ringkasan gudang

Modul dashboard dan transfer stok (Yoga).

- **Bukti:** `services/dashboardGudangService.js` `getSummary` mengirim
  `transfer.sedangDikirim` sebagai satu angka untuk kedua arah, sedangkan
  `getOutletSummary` sudah memisahkannya (`transfer.perArah`).
- **Kenapa penting:** pengguna yang hanya memegang
  `read-dashboard-gudang` tidak dapat diberi tahu pengembalian yang
  menunggu diterima di gudang (`modul/pemberitahuan.md`, LN17a).
- **Saran:** tambahkan `transfer.perArah` di `GET /dashboard/gudang`
  dengan bentuk yang sama dengan ringkasan outlet.
- **Penanganan sementara di frontend:** pemberitahuan penerimaan
  pengembalian hanya tampil bagi pemegang izin dashboard outlet.

## Prioritas seluruh laporan terbuka

| Prioritas | Butir | Pemilik | Dampak |
|---|---|---|---|
| 2 | Struk tutup kasir | Ridho dan Nizar | Wajib MVP; data per sesi belum tersedia |
| 7 | Produk dapat dijual di ringkasan | Yoga | Lonceng memuat seluruh produk setiap 5 menit |
| 8 | Perangkat menunggu izin se-toko | Ridho | Pemberitahuan perangkat belum dapat tampil |
| 9 | Surat jalan dikirim per arah di ringkasan gudang | Yoga | Penerimaan pengembalian belum diberitahukan ke pengguna gudang saja |
