# Modul Pelanggan dan Diskon

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul Pelanggan dan diskon

Diputuskan pemilik proyek pada 2 Oktober 2026, dengan prinsip keputusan
rancangan butir 17, 21, dan 23. PD1a dan PD5a diterapkan di `d9365d3`
(submodul pelanggan). PD2a dan PD3a diterapkan di `1e05df6` dan
`54f2938`, PD4a di `52c550e`, dan PD6a sampai PD9a di `54f2938`
(submodul diskon).

- **PD1a: dua submodul berurutan**, pelanggan lalu diskon, masing-masing
  dengan spec pembanding, migrasi, commit, dan dokumen penutup sendiri.
- **PD2a: hapus diskon diganti aktifkan dan nonaktifkan** dari menu
  daftar, lewat dialog yang hanya tertutup saat berhasil, karena backend
  tidak punya `DELETE` (diskon dirujuk riwayat penjualan). Batas 50 diskon
  aktif ditahan di klien dengan keterangan, dan jawaban 409 backend tetap
  ditampilkan, seperti PO2a dan PO3a.
  Sejak `a80d2fa` tombol tambah tetap hidup saat batas tercapai (NZ5a).
- **PD3a: form diskon mengelola seluruh field backend, dalam dua commit.**
  Commit pertama memigrasikan enam field lama dan menampilkan aturan lain
  baca-saja di daftar; commit kedua menambah masa berlaku, jam dan hari,
  minimal belanja, kuota, kuota per pelanggan, khusus member, produk
  tertentu, dan hitung per barang.
- **PD4a: pilihan diskon di buat penjualan dan buat reservasi mengikuti
  `sedangBerlaku`** dari backend, sehingga diskon di luar masa, jam, hari,
  atau kuotanya tidak ditawarkan. Syarat yang bergantung pada transaksi
  (minimal belanja, khusus member, produk) tampil sebagai keterangan, dan
  penolakan backend ditampilkan apa adanya.
- **PD5a: isian pelanggan yang dikosongkan dikirim, lalu hasilnya
  diperingatkan.** Backend menjawab 200 tanpa mengubah nilainya
  (`kontrak/temuan.md` butir 104). Form ubah mengirim teks kosong, lalu
  membandingkan hasil simpan lewat `isianTidakTerkosongkan` dan
  memperingatkan bila nilainya masih ada. Tanpa konstanta, karena
  peringatan hilang sendiri begitu backend diperbaiki; skenario
  pengosongannya ditulis lengkap sebagai `test.fixme`.
  Dicabut NZ10a (`1bb26c0`): backend `nizar` `8dc6211` menerapkan
  pengosongan, dan peringatannya dibuang.
- **PD6a: masa berlaku diskon diisi sebagai tanggal saja.** Tanggal mulai
  dikirim sebagai awal hari dan tanggal berakhir sebagai akhir hari, waktu
  lokal; jam harian diatur lewat jam berlaku.
- **PD7a: produk tertentu dipilih lewat daftar centang berpencarian** di
  dalam form, hanya untuk cakupan Item dan bagi pemegang izin baca produk.
  Tanpa pilihan, diskon berlaku untuk seluruh produk.
- **PD8a: khusus member tidak ditawarkan di form.** Backend mensyaratkan
  `Membership` aktif, sedangkan permission membership tidak ada di seed,
  sehingga membership tidak dapat dibuat siapa pun (`kontrak/temuan.md`
  butir 108). Diskon yang sudah ditandai diberi keterangan.
  Dipertahankan setelah izin membership masuk seed (NZ6a), dan sekali
  lagi pada 10 November 2026 walau backend sudah memperbaiki butir 108:
  khusus member ditawarkan setelah web punya modul membership, yang
  menunggu desain pemilik proyek (`inti/status.md`). Dibuka 17 November
  2026 bersama modul membership (MB1a).
- **PD9a: aturan berada di bagian Aturan tambahan yang dapat dibuka dan
  ditutup**, terbuka sendiri bila diskon sudah punya aturan atau ada
  isian aturan yang ditolak. Enam isian dasar tetap seperti semula.
- Diterapkan tanpa ditanyakan (`d9365d3`): form memakai React Hook Form
  dan Zod dengan isian dipangkas dan email diperiksa bentuknya bila diisi;
  ubah hanya mengirim field yang berubah (butir 15), dan simpan tanpa
  perubahan tidak mengirim permintaan; dialog konfirmasi buat dan hapus
  hanya tertutup saat berhasil (keputusan Fase 0); label ber-`htmlFor`;
  tombol tambah, ubah, dan hapus mengikuti izin endpoint-nya (butir 14);
  daftar yang gagal dimuat tampil sebagai pesan dengan tombol coba lagi,
  sejalan dengan keputusan submodul jurnal stok; dan tampilan serta teks
  lain dipertahankan agar spec pembanding tetap berlaku.
- Diterapkan tanpa ditanyakan (`1e05df6`, `54f2938`, `52c550e`): form
  diskon memakai React Hook Form dan Zod; ubah hanya mengirim field yang
  berubah (butir 15), aturan yang dikosongkan dikirim sebagai null, 0,
  atau array kosong, dan jam selalu berpasangan; saat membuat, hanya
  aturan yang diisi yang dikirim; berpindah ke cakupan Global ikut
  mengosongkan produk dan hitung per barang; filter daftar menyaring di
  klien dari satu cache (butir 12); tombol tambah ditahan seluruhnya saat
  batas 50 tercapai, karena backend menghitung batas juga untuk diskon
  Non-Aktif (`kontrak/temuan.md` butir 107); tombol mengikuti izin create
  dan update (butir 14); isian jam diberi keterangan WIB (butir 109);
  syarat yang bergantung pada transaksi tampil di bawah nama diskon pada
  pilihan kasir; dan tampilan serta teks lama dipertahankan.

### Modul membership

Diputuskan pemilik proyek pada 17 November 2026, dari kanvas desain
"Modul Membership" (tiga desain lengkap dengan alur desktop, HP 390 px,
dan tablet 768 px). Backend: `/api/membership` (Nizar) dan
`/api/paketmembership` (Ridho) di `4a19be8`; membership tidak dibatasi
plan.

- **MB1a: laman Membership desain B** di `/dashboard/outlet/membership`
  (`features/membership/`), menu "Membership" di Manajemen & Relasi
  setelah Pelanggan, tab Member dan Paket. Alur daftar memilih penjualan
  yang sudah ada, karena backend mewajibkan satu penjualan per membership
  (milik pelanggan yang sama, bukan VOID) dan tidak menautkan paket ke
  produk maupun harga. Aksi lewat dialog (lembar layar penuh di HP);
  tabel member bersaringan Semua, Aktif, Kadaluarsa; paket berupa kartu
  dengan kartu "Tambah Paket" bergaris putus; toko tanpa paket melihat
  ajakan membuat paket. Diskon khusus member ditawarkan lagi di form
  diskon, membuka PD8a.
- **MB2a: rincian penerapan** (disetujui sebagai satu paket): izin per
  tab dan per tombol (`features/membership/izin.ts`; daftarkan juga
  menuntut baca pelanggan, paket, dan penjualan); daftar member dimuat
  utuh, cari dan saringan di klien; dialog Daftarkan tanpa pelanggan
  bawaan, 50 penjualan terbaru per muatan dengan "Muat lebih banyak", VOID
  dan yang sudah dipakai disembunyikan; dialog Ubah mengunci pelanggan dan
  penjualan, karena backend hanya menerima paket dan tanggal mulai; menu
  member Ubah dan Hapus; menu paket Ubah, Nonaktifkan atau Aktifkan, dan
  Hapus (409 backend ditampilkan apa adanya).
- **MB3a: status membership di laman Pelanggan**: lencana "Member s.d.
  <tanggal>" di bawah tipe bagi pelanggan dengan membership Aktif, hanya
  bagi pemegang `read-membership`. Field tipe yang diisi manual dan kartu
  "Pelanggan Member" tidak berubah. Kolom Tipe dibungkus 150 px dan nama
  140 px agar tabel tetap muat di 1280 px (LT1a).

## Catatan

### Catatan dari submodul diskon

Submodul 2 modul Pelanggan dan diskon selesai pada 2 Oktober 2026 dalam
empat commit, dan dengan itu modul Pelanggan dan diskon selesai.

| Commit | Isi |
|---|---|
| `8cb6f31` | Spec pembanding terhadap kode lama |
| `1e05df6` | Halaman ke `features/diskon`: ubah mengirim `PUT`, aktifkan dan nonaktifkan, aturan baca-saja (PD2a, PD3a) |
| `54f2938` | Form mengelola aturan tambahan (PD3a, PD6a sampai PD9a) |
| `52c550e` | Pilihan diskon kasir mengikuti `sedangBerlaku` (PD4a) |

- Halaman lama membaca `_id` dari respons ber-`id`, sehingga ubah
  mengirim `POST` dan hapus memanggil route yang tidak ada; dibuktikan
  lewat test terhadap kode lama sebelum spec pembanding di-commit
  (`kontrak/temuan.md` butir 110).
- Lapisan data dan komponen di `features/diskon` (`referensi/arsitektur.md`).
  Halaman diskon, buat penjualan, dan buat reservasi berbagi satu cache
  `diskon.daftar()`, dan filter halaman menyaring di klien.
- Backend `yoga` menegakkan aturan diskon saat penjualan dan booking
  disimpan. Web kini dapat membuat dan mengubah aturan itu, dan pilihan
  diskon kasir hanya menawarkan diskon yang sedang berlaku.
- Diskon tidak dapat dihapus, sehingga diskon uji dibuat Non-Aktif dan
  tertinggal lima per run suite penuh (`referensi/utang-pengujian.md`).
- Temuan backend baru: butir 107 sampai 109, dilaporkan 2 Oktober 2026
  (`arsip/laporan-backend.md`). Kontrak diskon dikoreksi terhadap `yoga`
  (`kontrak/payload.md`, `kontrak/endpoint.md`).
- Tipe berakhiran `Lama` habis di seluruh repo.
- Keputusan pemilik proyek: `modul/pelanggan-diskon.md` (Modul Pelanggan dan diskon,
  PD2a sampai PD4a dan PD6a sampai PD9a).

### Catatan dari submodul pelanggan

Submodul 1 modul Pelanggan dan diskon selesai pada 2 Oktober 2026: spec
pembanding (`b6de75c`) dan migrasi (`d9365d3`). Halaman pelanggan tidak
lagi memakai `apiClient`, dan `PelangganLama` dihapus.

- Lapisan data dan komponen di `features/pelanggan` (`referensi/arsitektur.md`).
  Halaman, buat penjualan, dan buat reservasi berbagi satu cache
  `pelanggan.daftar()`.
- Dialog konfirmasi buat dan hapus kini hanya tertutup saat berhasil
  (keputusan Fase 0), label terhubung ke isiannya, dan daftar yang gagal
  dimuat tampil sebagai pesan.
- Backend menjawab 200 saat nomor HP, email, atau alamat dikosongkan
  tanpa mengubah nilainya (`kontrak/temuan.md` butir 104); web mengirim
  teks kosong lalu memperingatkan dari hasil simpan (PD5a), dan skenario
  pengosongannya menunggu sebagai `test.fixme`.
- `PUT /pelanggan/:id` menerima operator MongoDB dari body, dibuktikan
  lewat permintaan nyata (butir 105, alasan keamanan). Temuan backend
  baru: butir 104 sampai 106, dilaporkan 2 Oktober 2026 (`arsip/laporan-backend.md`).
- Satu selector spec pembanding berubah di commit migrasi, karena dialog
  yang kini bertahan menyembunyikan `main` dari pohon aksesibilitas
  (`referensi/playwright.md`, Catatan Playwright).
- Kontrak pelanggan dikoreksi terhadap `yoga` (`kontrak/payload.md`,
  `kontrak/endpoint.md`).
- Keputusan pemilik proyek: `modul/pelanggan-diskon.md` (Modul Pelanggan dan diskon).
