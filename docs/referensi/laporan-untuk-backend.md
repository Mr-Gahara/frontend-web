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
Butir 196 (27 November 2026) adalah laporan baru sesudahnya, belum
diserahkan ke backend.

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

## Laporan 27 November 2026 (Mesin Kasir)

Diperiksa terhadap backend `ridho` lokal `6478d29`.

### Butir 196: penanda asal Pindah Dana buka kasir di jurnal transfer

Modul akun kas dan jurnal transfer (Nizar), dikerjakan Ridho.

- **Bukti:** `mappers/jurnalTransferMapper.js` `mapJurnalTransferResponse`
  mengirim `tanggal`, `kasSumber`, `kasTujuan`, `jumlah`, `keterangan`,
  `status`, `catatan`, dan `dicatatOleh`, tanpa penanda asal. Penolakan
  VOID di `services/jurnalTransferService.js` (`de0bf66`) mengenali
  jurnal buka kasir lewat
  `SesiKasir.exists({ "pindahDanaBuka.jurnalTransferID": id })`,
  dan `GET /sesikasir` tidak menerima filter per jurnal. Keterangan
  "Laci dikosongkan saat buka kasir" dapat diubah lewat `PUT`, sehingga
  bukan penanda. Dibuktikan e2e 27 November 2026
  (`keuangan/mesin-kasir`, PW09): Batalkan di halaman Pindah Dana dijawab
  409 dan transfer tetap Aktif.
- **Penyebab:** asal jurnal hanya tersimpan di dokumen sesi kasir.
- **Kenapa penting:** halaman Pindah Dana menawarkan Batalkan untuk
  setiap transfer Aktif kepada pemegang `update-jurnal-transfer`; untuk
  jurnal buka kasir tombol itu selalu berakhir 409.
- **Saran:** respons `GET /jurnaltransfer` dan `GET /jurnaltransfer/:id`
  membawa penanda, misalnya `sesiKasirID` atau `asal: "buka-kasir"`
  (bisa juga `bolehVoid: false`), tanpa memaksakan bentuknya.
- **Penanganan sementara di frontend:** tidak ada kode khusus; dialog
  batal menampilkan pesan 409 backend apa adanya (MK19a,
  `modul/keuangan.md`). Begitu penandanya ada, Batalkan disembunyikan
  untuk jurnal itu (PW15, `referensi/antrean-web.md`).

## Prioritas seluruh laporan terbuka

| Prioritas | Butir | Pemilik | Dampak |
|---|---|---|---|
| 2 | Struk tutup kasir | Ridho dan Nizar | Wajib MVP; data per sesi belum tersedia |
| 9 | Butir 196: penanda asal Pindah Dana buka kasir | Ridho (modul Nizar) | Batalkan tampil lalu ditolak 409 |
