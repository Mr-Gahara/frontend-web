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
| Berkas di atas 700 baris | 7 | 3 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.087 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. Per `57a7084` menjadi 3: `components/app-sidebar.tsx` dipecah menjadi 325 baris (keputusan PF4a), dan tersisa buat penjualan (1.090), `features/produk/form-produk.tsx` (803), serta `components/ui/sidebar.tsx` (702). Per `9195472` menjadi 4: `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700 (714 baris) karena penjaga ruang (`eb0181f`), dan buat penjualan menjadi 1.087 baris setelah kode mati dibuang (`6b5e1cc`). Per `b887278` form produk menjadi 809 baris (pemeriksaan satuan resep). Per `628f52e` tetap 4; detail stock opname menjadi 712 baris setelah pemanggilan guard dibuang. Per `5b8cbd9` tetap 4: buat penjualan 1.098 baris (`waktuTransaksi` dan jam berjalan, `7a08b63`), form produk 809, detail stock opname 702, dan `components/ui/sidebar.tsx` 702. Per `a611b59` menjadi 3: dialog aksi detail stock opname dipisah, sehingga halamannya 612 baris |

Tahap desain token sengaja tidak dicampur dengan refactor arsitektur, agar
setiap commit tetap fokus. Warna utama sudah menjadi token pada fase UI/UX
11 Oktober 2026; tipografi dan spasi belum.

## Pekerjaan berikutnya: login akun dan pengguna

Penyesuaian ke backend `ridho` `0024eb9` selesai pada 31 Oktober 2026,
dalam 15 commit kode dari `8b5ad0f` sampai `b69d39a`, ditambah commit
dokumen atribusi `90472fe`
(`referensi/keputusan-penyesuaian-backend.md`, Penyesuaian backend
`ridho` `0024eb9`): shift, pola roster, monitoring absensi, dan kalender
per lokasi (B168, B183, B184), izin SDM (B139, B140), izin lintas outlet
(B142), jadwal (B147, B148, B165), status dan bentuk respons login (B136,
B149, B150), fixme ubah pola roster (B128), panel admin (B154, B155,
B176, B177), dan izin cuti hari ini (B160). Seluruh `test.fixme` yang
menunggu backend sudah dilepas. Suite penuh di atas `b5a2578`: 514 lolos
dan 10 skipped (`inti/pengujian.md`, Baseline). Sesudahnya jalur
terkunci lintas outlet kembali berjalan lewat pengguna uji tanpa izin
itu (`1cd8211`), dan penahan lokasi null shift serta pola roster
dibuang (`7f6d623`); harapan suite penuh menjadi 518 lolos dan 4
skipped, belum dijalankan.

Urutan pilihan pemilik proyek (26 Oktober 2026), tidak berubah:

1. **Halaman login akun dan login pengguna dibangun ulang.** Murni
   frontend; tata letak dan alurnya dirancang lewat pratinjau sebelum
   kode (`modul/profil-login.md`). Perubahan backend yang belum dipakai
   web ikut dikerjakan di sini (keputusan 30 Oktober 2026): OTP reset PIN
   Owner dan ubah email atau password akun (B178 sampai B180), hapus akun
   oleh Owner (B181), register Owner yang ditolak 409 bila toko sudah
   punya Owner (B195), dan pengguna nonaktif yang ditolak 403 saat login
   PIN (B202).
2. **Plan tier per akun** (Basic, Advanced, dan Full) yang membatasi
   akses fitur. Menunggu rancangan dan penegakan backend: model tier,
   pemeriksaan di route, dan tier di respons sesi. Frontend menyaring
   menu, halaman, dan tombol per tier begitu kontraknya ada; rancangannya
   dipetakan sambil login dikerjakan.

Belum dijadwalkan: logo toko (B203 sampai B205) dan jam operasional
(B206) di profil toko.

Backend lokal di `ridho` `0024eb9`, yang memuat `yoga` `f102c53`;
`nizar` di `877e493`. Laporan penyesuaian ini, berisi temuan baru
`kontrak/temuan.md` butir 165 beserta pembuktian, ditulis langsung ke
dokumentasi backend (`128d0de`), dan butir 165 diserahkan ke Yoga
(`arsip/laporan-backend.md`).

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in ridho nizar yoga; do echo "origin/$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...origin/$r | tr '\t' ' ')"; done
```

## Utang kecil yang tertunda

### Utang kecil dari penyesuaian backend `ridho` `0024eb9`

- Monitoring per lokasi tidak memuat staf yang izin (`kontrak/temuan.md`
  butir 165); panel Status Staf menambah karyawan ruang menurut peran
  yang izin hari itu sampai backend memperbaikinya.
- Jalur role tanpa izin SDM baru, tanpa `read-location`, dan tanpa izin
  lintas outlet hanya teruji di unit test, karena akun uji berperan
  Owner (`referensi/utang-pengujian.md`).
  Jalur tanpa izin lintas outlet teruji e2e sejak `1cd8211`, lewat
  pengguna uji "E2E Tanpa Lintas Outlet"; jalur tanpa izin SDM baru dan
  tanpa `read-location` tetap hanya teruji di unit test.
- Jurnal stok tetap mengirim satu `locationID` untuk Semua Outlet,
  walau backend menerima `tipeLokasi` (B109); berpengaruh hanya bila
  tenant punya lebih dari satu outlet (`kontrak/temuan.md` butir 151).
- Fixture izin cuti menetap di basis data development, karena backend
  tidak punya hapus izin; setiap hari yang menjalankan spec dashboard
  menambah dua izin.
- Laporan penyesuaian ini ditulis ke dokumentasi backend di `128d0de`
  (`arsip/laporan-backend.md`); butir 165 kini utang Yoga, karena Ridho
  sementara tidak memegang backend.

### Utang kecil dari penyesuaian backend `ridho` `877e493`

- Jalur pemegang izin pembelian per ruang saja belum teruji e2e, karena
  akun uji Owner memegang izin umum (`kontrak/temuan.md` butir 158,
  Menunggu verifikasi).
- B112 (urutan stabil, validasi selaras skema, indeks nomor faktur),
  B114, dan B115 dipakai atau tidak lagi diakali web, tetapi belum
  dibuktikan khusus.
- Penerimaan (outlet) dan pengiriman (gudang) tetap daftar kartu mode
  klien dengan polling; tidak termasuk butir 150.
- Tombol urut kolom dibuang di stock adjustment dan stock opname, karena
  urutan klien hanya mengurutkan satu halaman; urutan mengikuti backend.
- Laporan 28 Oktober 2026 belum tercatat di `arsip/laporan-backend.md`.
  Dicatat pada 31 Oktober 2026.

### Utang kecil dari pembelian stok dan audit pergantian hari

- Catatan untuk tim backend dari modul pembelian dan audit pergantian
  hari (`kontrak/temuan.md` butir 154 sampai 162 dan 164) diserahkan ke
  Yoga pada 26 Oktober 2026 dan dicatat di `arsip/laporan-backend.md`.
- Sisi frontend: tab Keuangan tampil tanpa izin (butir 163), filter
  periode bawaan tidak bergeser saat hari berganti, dan saldo akun kas
  yang belum terpotong pembelian (`modul/inventaris.md`, Utang kecil
  dari pembelian stok). Tab Keuangan disaring menurut izin halamannya
  sejak `e051906` (butir 163 selesai).

### Utang kecil dari pengembalian Outlet ke Gudang

- Daftar Kirim Barang memakai asal bertipe Outlet tanpa pemilih (AR10a).
  Untuk multi-outlet, terapkan cakupan outlet seperti Terima Barang
  (`lingkupOutlet` dan `PemilihLokasiOutlet`).
- Kartu siap surat jalan dashboard gudang dihitung server untuk kedua
  arah, sedangkan tab Perlu Surat Jalan gudang hanya memuat permintaan
  (AR6a). Angkanya melebihi isi tab bila ada pengembalian yang disetujui
  dan menunggu surat jalan outlet; perlu hitungan per arah dari backend
  atau kartu tersendiri.
- Halaman revisi surat jalan tidak memeriksa ruang pengirim: tombolnya
  tersembunyi di ruang lawan (AR11a), tetapi URL-nya dapat dibuka
  langsung. Selesai di `5ba2a42`: halaman revisi menolak ruang yang
  bukan pengirim.
- Repo frontend dibuat ulang sebagai repo baru dengan pemilik proyek
  sebagai satu-satunya kontributor, setelah seluruh pekerjaan selesai dan
  masuk produksi (pemilik proyek, 25 Oktober 2026). Seluruh commit yang
  terjangkau per tanggal itu ditulis `Mr-Gahara` tanpa atribusi lain,
  dan remote hanya punya `main` tanpa ref pull request, tetapi daftar
  kontributor GitHub masih menampilkan Claude.
  Per 31 Oktober 2026 API contributors hanya memuat `Mr-Gahara`; yang
  tertinggal panel Contributors halaman repo dan commit `68cd7da` yang
  diganti `8b5ad0f` (`inti/cara-kerja.md`, Atribusi commit).

### Utang kecil dari penyesuaian backend `ridho` `b5b367a`

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
  Selesai di `621e753` sampai `a505783`. Yang tersisa: kartu siap surat
  jalan menghitung pengembalian yang menunggu surat jalan outlet,
  sedangkan tab gudang tidak (AR6a; utang kecil pengembalian, di atas).
- `lokasiJurnalOutlet` dipindah ke `features/inventaris/cakupan.ts` bila
  daftar lain ikut pindah ke server (keputusan rancangan butir 12).
  Selesai di `21abcd8` sebagai `lokasiSatuOutlet`, dipakai jurnal stok
  dan pembelian stok.

### Utang kecil dari penyesuaian backend `ridho` `7d28135`

- Baris `/pembelianstok` di Lampiran A (`kontrak/route-backend.md`)
  masih mencatat tanpa izin, padahal backend memeriksa `read-`,
  `create-`, `update-`, dan `delete-pembelian-stok` (B74); izinnya
  tercatat di `kontrak/endpoint.md`. Lampiran itu bertanda Tetap dan
  diperbarui utuh saat dibangkitkan ulang (pemilik proyek, 26 Oktober
  2026).
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
  Sejak `6d07b8d` web mengirim waktu simpan untuk tanggal beban hari ini,
  karena validator membaca `YYYY-MM-DD` sebagai 07.00 WIB
  (`kontrak/temuan.md` butir 154).

### Utang kecil dari penyesuaian backend `ridho` `2dd57aa`

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
  Halaman pembelian selesai di `0db77ed` sampai `1e4f042`, dan izinnya
  masuk template di `5b8cbd9`.
- Belum dicocokkan dari 42 commit backend: modul pembelian stok, dan
  cache produk saat pajak berubah (`kontrak/README.md`).
  Modul pembelian stok dicocokkan dari kode `b5b367a` saat halamannya
  dibangun (`modul/inventaris.md`, Submodul pembelian stok); cache
  produk saat pajak berubah belum.
- Hapus aset yang punya booking (butir 52) dan hapus kategori yang
  dipakai produk (butir 12) belum diuji dari web.
- Nama penyetuju di daftar pengajuan stok terisi sejak `7d28135` (butir
  145); belum dipakai web.

### Utang kecil dari penyesuaian backend `nizar`

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
  Sejak 28 Oktober 2026 di `877e493`, dan sejak 30 Oktober 2026 di
  `0024eb9` (`inti/backend.md`).
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

### Utang kecil dari penyesuaian backend `fc29433`

- Izin beban operasional belum masuk template role (keputusan FC2a);
  ditambahkan bersama halaman pengeluaran.
  Ditambahkan di `61275ac`.
- Pilihan satuan resep hanya terbukti dari respons nyata untuk bahan
  bersatuan pcs, gram, dan ml. Untuk kg, liter, pak, dan unit, isi
  `availableUnits` dibaca dari kode backend, karena data development
  tidak punya bahan bersatuan itu. Sejak `f64b518` bahan bersatuan pak
  terbukti lewat e2e.

### Utang kecil dari penyesuaian backend `f27f093`

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
  baris (714) sejak penjaga ruang ditambahkan di `eb0181f`, lalu 712
  baris setelah pemanggilan guard dibuang (`628f52e`), dan 702 per
  `5b8cbd9`. Pisahkan dialog
  aksi dan tabel hitungan saat halaman itu disentuh lagi.
  Dialog aksi dipisah ke `features/stock-opname/dialog-aksi-opname.tsx`
  di `a611b59` (612 baris); tabel hitungan tetap di halaman, karena
  memisahkannya menyeret state hitungan tanpa manfaat baru.

### Utang kecil dari 19 Oktober 2026

- Riwayat baseline lama masih di `referensi/playwright.md` (Perintah
  verifikasi yang biasa dipakai); pindahkan ke arsip saat dokumen itu
  disentuh. Baseline terkini ada di `inti/pengujian.md`.
  Dijadwalkan sebagai pekerjaan berikutnya pada 22 Oktober 2026.
  Selesai pada putaran dokumen 25 Oktober 2026 (`arsip/riwayat-pengujian.md`).
- `inti/pengujian.md` melewati batas inti sekitar 400 baris; utang
  pengujian yang sudah lunas dipindah ke arsip saat ditinjau.
  Dijadwalkan sebagai pekerjaan berikutnya pada 22 Oktober 2026.
  Selesai pada putaran dokumen 25 Oktober 2026 (`arsip/riwayat-pengujian.md`).
- Satu skip bersyarat data bertambah di suite penuh `d6f8ba0`
  dibanding hitungan, dan skenarionya belum diidentifikasi
  (`inti/pengujian.md`, Baseline).
  Teridentifikasi 21 Oktober 2026: "buat surat jalan gagal" di spec
  alur pengajuan, dilewati karena tenant uji tidak punya pengajuan
  APPROVED tanpa surat jalan.
