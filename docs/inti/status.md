# Status

Sifat perubahan: **Sering**, setiap modul selesai.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Keadaan pekerjaan refactor: fase yang sudah selesai, metrik, dan pekerjaan
berikutnya. Diperbarui setiap kali satu modul selesai (`docs/README.md`, Cara
memperbarui dokumentasi).

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul.
Diukur ulang per penyesuaian `nizar` (`729c16a`), tidak berubah dari `597a163`.
Baris warna diukur ulang per `9cd22e1` (11 Oktober 2026); keempat angka
lain tidak berubah sampai commit itu:

| Hal | Awal | Per `729c16a` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 0 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan; dari 25 per `845c2cf` menjadi 16, lewat penyesuaian `465b438` dan halaman metode pembayaran, lalu 12 setelah halaman pajak (`e0aaeca`), 9 setelah halaman pelanggan (`d9365d3`), 7 setelah halaman diskon (`1e05df6`), 4 setelah halaman profil, login, dan sidebar (`57a7084`), dan 0 setelah error ESLint warisan (`4f19e77`) |
| Kemunculan `_id` | - | 8 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id`. Perintahnya ikut menghitung komentar: naik 1 di `eef371a` dari komentar normalisasi di `features/sesi-booking/api.ts`. Turun 13 di `45187b6`: 12 dari data tiruan mutasi arus kas dan 1 dari daftar akun kas. Turun 3 di `f99b7cf`: 4 dari halaman dan tabel shift, dikurangi 1 dari komentar normalisasi di `features/shift/api.ts`. Turun 7 di `dcc22e0` dari halaman, tabel, dan form pola roster. Turun 7 di `19227f8` dari halaman jadwal outlet, jadwal gudang, dan generate. Turun 9 lagi sampai `3359497`, dari penyesuaian `465b438` dan halaman metode pembayaran. Turun 7 di `e0aaeca` dari halaman pajak. Turun 2 di `d9365d3` dari halaman pelanggan. Turun 2 di `1e05df6` dari halaman diskon. Turun 1 di `091be4e` dari komentar halaman profil. Naik 1 di `10c7efb` dari komentar normalisasi di `features/admin-akun/api.ts`. Turun 1 di `4f19e77` dari cadangan `_id` di dialog pengguna |
| `useAuthGuard()` berulang di halaman | 49 | 2 | Dihitung di `app/` saja. Yang tersisa `app/dashboard/layout.tsx`, satu-satunya pemanggil, dan berkas hook-nya sendiri; ke-24 pemanggilan berulang di `app/` dan ke-13 di `features/` dibuang di `628f52e` (26 sebelum itu). Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, keempat halaman penjualan, buat reservasi, shift outlet, pola roster outlet, ketiga halaman metode pembayaran, halaman pelanggan, halaman diskon, dan halaman profil) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | 68 (per `9cd22e1`) | Lima warna utama menjadi token di `app/globals.css` (`584a2d8`, `ba28f25`; keputusan WR1a sampai WR4a). Tepat sebelum penggantian terukur 3.764 di `app`, `components`, `features`, dan `lib`. Yang tersisa: warna utama di luar kelas (konstanta palet lokal halaman reservasi dan tarif, serta warna grafik) dan warna lain yang belum punya token |
| Berkas di atas 700 baris | 7 | 4 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.087 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. Per `57a7084` menjadi 3: `components/app-sidebar.tsx` dipecah menjadi 325 baris (keputusan PF4a), dan tersisa buat penjualan (1.090), `features/produk/form-produk.tsx` (803), serta `components/ui/sidebar.tsx` (702). Per `9195472` menjadi 4: `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700 (714 baris) karena penjaga ruang (`eb0181f`), dan buat penjualan menjadi 1.087 baris setelah kode mati dibuang (`6b5e1cc`). Per `b887278` form produk menjadi 809 baris (pemeriksaan satuan resep). Per `628f52e` tetap 4; detail stock opname menjadi 712 baris setelah pemanggilan guard dibuang |

Tahap desain token sengaja tidak dicampur dengan refactor arsitektur, agar
setiap commit tetap fokus. Warna utama sudah menjadi token pada fase UI/UX
11 Oktober 2026; tipografi dan spasi belum.

## Pekerjaan berikutnya: label tab berbahasa awam

Dashboard gudang selesai pada 19 Oktober 2026 (`modul/gudang.md`, Catatan
dari dashboard gudang), bersama perbaikan pengajuan PENDING, font Geist,
tab di `?tab=`, penyesuaian backend `ridho` `af5f315`, dan pemecahan
dokumentasi menjadi lapis inti, modul, referensi, dan arsip
(`4cbb38f`). Pemilik proyek lalu memilih label tab berbahasa awam
sebagai pekerjaan berikutnya. Sebelum itu, penyesuaian backend `ridho`
`b5b367a` diselesaikan pada 21 Oktober 2026
(`referensi/keputusan-penyesuaian-backend.md`): template role, kartu
pengajuan dashboard gudang dari server, jurnal stok berhalaman di
server, dan izin jurnal gudang.

Tab daftar pengajuan stok masih menampilkan sebagian kode status mentah:
`labelTab` di `halaman-daftar-pengajuan-stok.tsx` hanya mengisi sebagian
tab, sehingga DRAFT, REJECTED, dan COMPLETED di outlet serta COMPLETED dan
REJECTED di gudang tampil apa adanya. Label tab daftar surat jalan
(`LABEL_TAB_TRANSFER` di `features/transfer-stok/tampilan.ts`, misalnya
DRAFT SJ) masih diambil dari halaman lama dan ikut ditinjau. Desain harus
mudah dipahami orang awam, sehingga perubahannya didahului pratinjau
visual. Halaman bertab di web ada tiga: daftar pengajuan stok, daftar
surat jalan, dan pajak (21 Oktober 2026). Langkah pertama sesi
berikutnya: periksa cabang backend, lalu petakan label ketiganya.

Backend lokal berada di `ridho` `b5b367a` (fast-forward ke `origin/yoga`,
yang memuat `origin/nizar`). Suite e2e penuh terakhir: 478 lolos dan 14
skipped di `b03c276` (`inti/pengujian.md`, Baseline). Dua belas
`test.fixme` menunggu backend.

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in $(git -C "$BE" for-each-ref --format='%(refname:short)' refs/remotes/origin | grep -v '^origin$' | grep -v '/HEAD$'); do echo "$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...$r | tr '\t' ' ')"; done
cd ~/Documents/frontend-web
grep -nE 'labelTab|LABEL_TAB|tab:' features/pengajuan-stok/halaman-daftar-pengajuan-stok.tsx features/transfer-stok/tampilan.ts | cut -c1-160
```

## Utang kecil yang tertunda

## Utang kecil dari penyesuaian backend `ridho` `b5b367a`

- Stock opname, stock adjustment, surat jalan, dan pengajuan stok tetap
  mode klien, karena backend belum punya pencarian teks
  (`kontrak/temuan.md` butir 150). Paginasi B104 sampai B106 dipakai
  bersama pencarian begitu tersedia (keputusan rancangan butir 27).
  Pengajuan stok juga menunggu filter tab gabungan (butir 152).
- Kotak cari nama bahan jurnal stok disembunyikan sampai backend
  menerima query pencarian (butir 150), lalu dikembalikan.
- Lingkup per tipe lokasi dikirim sebagai satu `locationID` (MVP);
  multi-lokasi menunggu filter tipe lokasi (butir 151).
- Pengajuan Outlet ke Gudang (P8 backend) belum tampil di web; alurnya
  dikerjakan terpisah dengan pratinjau (`modul/inventaris.md`). Sampai
  itu kartu pengajuan dashboard gudang dapat melebihi isi tab bila ada
  pengembalian dari outlet.
- `lokasiJurnalOutlet` dipindah ke `features/inventaris/cakupan.ts` bila
  daftar lain ikut pindah ke server (keputusan rancangan butir 12).

## Utang kecil dari penyesuaian backend `ridho` `7d28135`

- Lampiran A (`kontrak/route-backend.md`) tertinggal: masih mencatat
  `DELETE /bebanoperasional/:id`, yang sudah dibuang backend.
  Dibangkitkan ulang hanya atas perintah pemilik proyek (RG8a).
- Belum dibuktikan dari web: penyaringan beban VOID di laporan laba rugi
  (butir 132), cache daftar beban saat kategori berubah (butir 135),
  penolakan beban saat saldo kurang atau akun nonaktif (butir 133), serta
  bentuk `tanggal`, batas `keterangan`, dan pembatas laju beban (butir
  137).
- Empat penjualan milik toko yang belum punya lokasi tetap tanpa
  `locationID`, sesuai rancangan backend. Tenant uji tidak terdampak:
  total dengan filter outletnya sama dengan total tenant (18 Oktober
  2026).
- Butir 132, 133, dan 135 dicocokkan dari kode `00de455` pada 18 Oktober
  2026 (Catatan dari halaman pengeluaran). Yang tersisa dari butir 137:
  batas tanggal masa depan, panjang keterangan, dan pembatas laju.
  Ketiganya diperbaiki di `yoga` `186fa19` (B100) dan dibuktikan dari kode
  `ridho` `af5f315` pada 19 Oktober 2026 (`kontrak/temuan.md` butir 137).
- Kategori fixture "E2E Kategori Beban" dan satu beban VOID menetap di
  basis data development (RG7a).
- Pemilik proyek memutuskan untuk backend pada 17 Oktober 2026: tanggal
  lampau di beban operasional dan jurnal transfer hanya untuk Owner, dan
  peran lain memakai waktu server hari ini WIB. Halaman pengeluaran nanti
  mengikuti aturan itu; Pindah Dana tidak terdampak karena tidak mengirim
  tanggal (DN3a).
  Diterapkan backend: jurnal transfer di `nizar` `96e890e` (B97) dan beban
  operasional di `yoga` `186fa19` (B100), keduanya termuat di `ridho`
  `af5f315`.

## Utang kecil dari penyesuaian backend `ridho` `2dd57aa`

- Hapus bahan baku yang baru dibuat diperbaiki backend di `7d28135`
  (`kontrak/temuan.md` butir 143), dan `test.fixme`-nya dilepas
  (`cfaaa92`).
- Cakupan daftar penjualan pindah ke filter server: syaratnya terpenuhi
  di `7d28135` (butir 144), dan pekerjaannya dijadwalkan sesudah tabel
  seragam (RG4a). Selesai di `20c026b`.
- Izin pembelian stok belum masuk template role, dan modul pembelian
  stok belum punya halaman di web (RH6a). Izin stock adjustment per
  ruang juga belum masuk template role (RH3a).
  Izin stock adjustment per ruang masuk template di `4088d9e`.
- Belum dicocokkan dari 42 commit backend: modul pembelian stok, dan
  cache produk saat pajak berubah (`kontrak/README.md`).
- Hapus aset yang punya booking (butir 52) dan hapus kategori yang
  dipakai produk (butir 12) belum diuji dari web.
- Nama penyetuju di daftar pengajuan stok terisi sejak `7d28135` (butir
  145); belum dipakai web.

## Utang kecil dari penyesuaian backend `nizar`

- Backend lokal berada di cabang `ridho` `8dc6211` (fast-forward ke
  `origin/nizar`, sudah di-push). Setiap kali `yoga` atau `nizar` maju,
  cabang itu digabung ulang dengan pemeriksaan kelengkapan
  (`inti/backend.md`), lalu kontrak dicocokkan ulang. Cabang uji lokal
  `uji-yoga-nizar` sudah dihapus (8 Oktober 2026).
  Sejak 11 Oktober 2026 `ridho` berada di `2dd57aa`. Sejak 16 Oktober 2026
  di `7d28135` (gabungan `yoga` `723b12f` dan `nizar` `38f523a`). Sejak
  17 Oktober 2026 di `00de455`, fast-forward dua commit dokumen `nizar`.
  Sejak 19 Oktober 2026 di `af5f315`, fast-forward ke `origin/yoga` yang
  memuat `origin/nizar` (`referensi/keputusan-penyesuaian-backend.md`).
  Sejak 21 Oktober 2026 di `b5b367a`, fast-forward ke `origin/yoga`.
- Indeks pelanggan di basis data development belum sesuai skema
  (`kontrak/temuan.md` butir 142); dibiarkan sebagai bukti sampai backend
  menyediakan migrasi indeks.
  Diselaraskan lewat `npm run db:indeks` pada 11 Oktober 2026 (butir 142
  tertutup).
- Booking milik sebuah penjualan belum disertakan di respons detail
  penjualan; permintaannya ditunda (NZ9a).
- Penyesuaian terhadap `yoga` `55328f1` selesai di `50e6485` dan
  `f64b518`. Yang tersisa: pengeluaran tetap ditunda sampai
  `kontrak/temuan.md` butir 131 sampai 134 diperbaiki backend (NZ11a).
  Butir itu diperbaiki di `7d28135` dan terbukti lewat permintaan nyata;
  pengeluaran tetap ditunda sampai dijadwalkan pemilik proyek (RG6a).
  Dijadwalkan sebagai pekerjaan berikutnya pada 18 Oktober 2026.
  Selesai di `1d7fa7b` (BO3a sampai BO7a).
- Bagian Sesi Booking di detail penjualan memakai tata letak sederhana di
  atas grid informasi; penempatannya menunggu fase UI/UX.
- Timeline reservasi tidak punya aksi Tandai Selesai (NZ7a). Booking lama
  berstatus Batal dibaca VOID sejak backend `nizar` `8dc6211`, sehingga
  menurut kode tidak tampil lagi (`kontrak/temuan.md` butir 141); belum
  dilihat langsung di timeline.
- Khusus member belum ditawarkan di form diskon (NZ6a); ditinjau bersama
  modul membership.
- Mutasi transfer di buku mutasi tidak bertaut ke riwayat Pindah Dana,
  karena riwayat itu tidak punya halaman per transfer.

## Utang kecil dari penyesuaian backend `fc29433`

- Izin beban operasional belum masuk template role (keputusan FC2a);
  ditambahkan bersama halaman pengeluaran.
  Ditambahkan di `61275ac`.
- Pilihan satuan resep hanya terbukti dari respons nyata untuk bahan
  bersatuan pcs, gram, dan ml. Untuk kg, liter, pak, dan unit, isi
  `availableUnits` dibaca dari kode backend, karena data development
  tidak punya bahan bersatuan itu. Sejak `f64b518` bahan bersatuan pak
  terbukti lewat e2e.

## Utang kecil dari penyesuaian backend `f27f093`

- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
  Selesai di `d6f8ba0` (B98): penanganan sementaranya dihapus, bukan
  dibalik, dan skenarionya menjadi langkah sungguhan.
- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
- `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700
  baris (714) sejak penjaga ruang ditambahkan di `eb0181f`, dan kini 712
  baris setelah pemanggilan guard dibuang (`628f52e`). Pisahkan dialog
  aksi dan tabel hitungan saat halaman itu disentuh lagi.

## Utang kecil dari 19 Oktober 2026

- Riwayat baseline lama masih di `referensi/playwright.md` (Perintah
  verifikasi yang biasa dipakai); pindahkan ke arsip saat dokumen itu
  disentuh. Baseline terkini ada di `inti/pengujian.md`.
- `inti/pengujian.md` melewati batas inti sekitar 400 baris; utang
  pengujian yang sudah lunas dipindah ke arsip saat ditinjau.
- Satu skip bersyarat data bertambah di suite penuh `d6f8ba0`
  dibanding hitungan, dan skenarionya belum diidentifikasi
  (`inti/pengujian.md`, Baseline).
  Teridentifikasi 21 Oktober 2026: "buat surat jalan gagal" di spec
  alur pengajuan, dilewati karena tenant uji tidak punya pengajuan
  APPROVED tanpa surat jalan.
