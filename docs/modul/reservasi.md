# Modul Reservasi

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul reservasi

Diputuskan pemilik proyek pada 26 September 2026, dengan prinsip
keputusan rancangan butir 17 dan 21.

- **R1a: spec master data dibangun ulang sebelum migrasi.** Spec tipe
  aset, aset, dan tarif yang memalsukan respons sukses diganti seluruhnya
  dengan spec terhadap backend sungguhan, dijalankan terhadap kode lama
  sampai lolos, baru skenario baru ditambahkan dan dijalankan ulang.
- **R2b: data uji booking memakai fixture tetap.** Tipe aset, tarif tanpa
  batas hari dan jam, serta aset uji dibuat sekali bila belum ada; booking
  dibuat per run di slot waktu unik lalu di-void, karena hapus aset tidak
  memeriksa booking dan akan meninggalkan sesi yatim.
- **R3a: daftar reservasi yang basi setelah void ditulis sebagai
  `test.fixme` berbadan lengkap.** Data backend dibuktikan lewat detail
  sesi booking yang belum pernah dibaca, sedangkan pemeriksaan daftar di
  UI menunggu backend membersihkan cache daftar per tanggal.
- **R4a: blok booking di daftar reservasi menautkan ke detail
  penjualannya**, tanpa menambah aksi ubah atau hapus sesi booking.
  Anggapan bahwa detail penjualan adalah jalur batal booking terbukti
  keliru (`kontrak/temuan.md` butir 56) dan dijelaskan ulang oleh R4b.
- **Nama berisi spasi saja ditolak di form tipe aset dan aset** (27
  September 2026, `074e98c` dan `d3ae182`). Skema buat dan edit
  disatukan dengan trim; sebelumnya nama itu lolos form tipe aset lalu
  ditolak backend.
- **Dialog hapus aset hanya tertutup saat berhasil** (`d3ae182`,
  keputusan Fase 0), setelah hapus beralih dari `mutateAsync` tanpa
  penangkap ke `mutate`.
- **T1a: halaman buat dan edit tarif tetap terpisah** (27 September
  2026, `365553f`). Logikanya pindah ke `features/tarif`, sedangkan
  tampilan kedua halaman tidak berubah; penyatuan ke satu form ditunda.
- **T2a: skema tarif mempertahankan `z.coerce`**, dengan alasan dan
  batasnya di `referensi/helper-dan-shell.md` (Catatan form).
- **T3b: harga tarif yang tidak diisi ditolak form** dengan "Harga wajib
  diisi", sedangkan 0 yang diketik tetap sah. Sebelumnya harga kosong
  tersimpan 0 tanpa pemberitahuan, dan tarif 0 akan dipilih otomatis
  saat booking.
- **T4a: nama tarif berisi spasi saja ditolak** di buat dan edit,
  sejalan dengan tipe aset dan aset.
- **R2c: booking uji dibersihkan lewat penjualannya** (27 September
  2026, `27749fe`), melengkapi R2b: bayar Rp1, hapus pembayaran itu
  (penjualan kembali DRAFT dan saldo akun kas kembali), lalu void
  penjualan (booking Batal). Penjualan booking selalu FINAL dan tidak dapat
  di-void langsung (`kontrak/temuan.md` butir 56). Diganti PB8a sejak
  backend `465b438`.
- **R4b: tautan blok booking ke detail penjualan adalah jalur lihat dan
  bayar, bukan jalur batal** (`eef371a`). Web belum punya jalur
  membatalkan booking. Sejak `b85c2bd` booking dibatalkan lewat void
  penjualannya (PB2a).
  Tandai Selesai ada di detail penjualan sejak `729c16a` (NZ7a).
- **R5a: booking Batal tidak ditampilkan di timeline daftar reservasi**
  (`eef371a`), karena slotnya sudah dilepas; backend tetap mengirimnya,
  karena daftar tidak disaring menurut status. Sejak backend `465b438`
  statusnya VOID (PB8a).
- **R6a: pemeriksaan bentrok di form buat reservasi hanya menghitung
  booking Aktif** (28 September 2026), sejalan dengan `checkConflict`
  backend; sebelumnya booking Selesai ikut dihitung. Diterapkan di
  `477f258` lewat `bookingBentrok`, dan diuji di test unit. Sejak backend `465b438`
  hanya booking Aktif yang sudah dibayar yang dihitung (PB8a).
- **R7b: diskon di buat reservasi memakai `features/diskon`**, dengan
  aturan `bisaDigabung` sebagai fungsi murni, serta fixture diskon item dan
  diskon global uji di spec e2e (28 September 2026; fixture di `652d669`,
  `pilihDiskon` di `477f258`).
- **R8b: spec buat reservasi memilih tanggal lewat kalender kostum**,
  sekaligus menguji fungsinya (28 September 2026, `652d669`).
- **R9b: buat reservasi dipindah ke `features/sesi-booking` dan dipecah
  menjadi komponen** (28 September 2026, `477f258`): halaman,
  `KartuFasilitas`, dan `PanelRingkasan`, masing-masing di bawah 700
  baris. Karena hampir setiap rentang yang dipindah juga berubah isinya,
  keempat berkas ditulis utuh dari halaman lama yang dibaca penuh, dengan
  `className` disalin, dan spec pembanding `652d669` menjadi penjaganya.

## Catatan

### Catatan dari modul reservasi

Modul reservasi selesai pada 28 September 2026: tipe aset (`074e98c`),
aset (`d3ae182`), tarif (`365553f`), daftar reservasi (`27749fe`,
`eef371a`), komponen tanggal dan waktu (`e43e000`), dan buat reservasi
(`652d669`, `477f258`). Tidak ada lagi halaman reservasi yang memakai
`apiClient`, dan tidak ada berkas reservasi di atas 700 baris.

- Booking dari web dibuat lewat jalur batch dan selalu membuat penjualan
  berjenis `booking` berstatus FINAL; `simpanDraft` diabaikan, sehingga
  ubah dan hapus sesi booking selalu ditolak. Penjualan FINAL tidak dapat
  di-void langsung, sehingga web tidak punya jalur batal booking
  (`kontrak/temuan.md` butir 56); booking uji dibatalkan lewat bayar,
  hapus pembayaran, lalu void penjualannya (keputusan R2c dan R4b). Void
  penjualan membatalkan sesi booking-nya (`penjualanService.update`).
  Sejak backend `465b438` penjualan booking tersimpan UNPAID, dan booking
  dibatalkan lewat void penjualannya (Catatan dari penyesuaian backend
  `465b438`).
- Tarif dipilih otomatis oleh backend menurut tipe aset, hari, jam, dan
  prioritas, dan status aset "digunakan" dihitung dari booking Aktif yang
  sedang berjalan.
- Kontrak sesi booking dikoreksi pada 27 September 2026: validator dan dua
  jalur `POST /sesibooking` di `payload.md`, serta bentuk respons daftar
  di `endpoint.md` bagian 3.3. Route sesi booking per id tidak dipakai
  web, sehingga hanya tercatat di Lampiran A.
- Void penjualan tidak membersihkan cache daftar booking per tanggal
  (butir 57); diperbaiki backend `465b438`, dan `test.fixme` R3a dilepas
  di `e4bfc86`. Sebelumnya satu skenario daftar reservasi menunggu backend
  (keputusan R3a), dan slot booking uji di spec buat reservasi digeser
  menurut menit dan urutan pemanggilan agar tidak tertahan daftar yang
  basi.
- Daftar sesi booking menulis status Selesai saat dibaca (butir 58,
  diperbaiki di `465b438`, terbukti dari kode `50eede7`), dan
  sekitar 930 baris kode lama dikomentari di service sesi booking (butir
  59). Temuan master data reservasi tercatat di butir 51 sampai 55.
  Calon temuan yang belum dibuktikan dari kode: keberadaan tipe aset tidak
  diperiksa saat aset dibuat, dan `voidPenjualan` tidak terpakai.
- Data uji reservasi bernama tetap dan dibuat sekali: tipe aset, aset,
  aset berstatus perbaikan, tarif, pelanggan, serta diskon item dan diskon
  global uji. Setiap run spec daftar dan buat reservasi meninggalkan
  booking VOID (sebelumnya Batal) dan penjualan booking VOID.
- Keputusan pemilik proyek untuk modul ini ada di `modul/reservasi.md` (Modul
  reservasi, R1a sampai R9b, serta T1a sampai T4a untuk tarif).

## Utang terbuka

### Utang kecil dari modul reservasi

- Sebutan di pesan form tipe aset berbeda: "Kategori Aset" di halaman
  buat dan "Tipe Aset" di halaman edit. Dipertahankan di `074e98c` karena
  teks yang dilihat pengguna; penyeragamannya menunggu keputusan pemilik
  proyek.
- Halaman buat dan edit tarif masih berbeda tampilan: `<select>` bawaan
  dan harga polos di buat, Radix Select dan harga berformat ribuan di
  edit. Penyatuan ke satu form ditunda (keputusan T1a).
