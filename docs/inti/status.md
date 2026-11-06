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
| Berkas di atas 700 baris | 7 | 3 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.087 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. Per `57a7084` menjadi 3: `components/app-sidebar.tsx` dipecah menjadi 325 baris (keputusan PF4a), dan tersisa buat penjualan (1.090), `features/produk/form-produk.tsx` (803), serta `components/ui/sidebar.tsx` (702). Per `9195472` menjadi 4: `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700 (714 baris) karena penjaga ruang (`eb0181f`), dan buat penjualan menjadi 1.087 baris setelah kode mati dibuang (`6b5e1cc`). Per `b887278` form produk menjadi 809 baris (pemeriksaan satuan resep). Per `628f52e` tetap 4; detail stock opname menjadi 712 baris setelah pemanggilan guard dibuang. Per `7d4c234` form produk 835 baris (isian stok minimal, B237). Per `5b8cbd9` tetap 4: buat penjualan 1.098 baris (`waktuTransaksi` dan jam berjalan, `7a08b63`), form produk 809, detail stock opname 702, dan `components/ui/sidebar.tsx` 702. Per `a611b59` menjadi 3: dialog aksi detail stock opname dipisah, sehingga halamannya 612 baris |

Tahap desain token sengaja tidak dicampur dengan refactor arsitektur, agar
setiap commit tetap fokus. Warna utama sudah menjadi token pada fase UI/UX
11 Oktober 2026; tipografi dan spasi belum.

## Pekerjaan berikutnya

Keadaan per 6 November 2026: backend lokal `ridho` `c031bde` (kode
`nizar` `4d221f5` ditambah commit dokumen AR26), sudah di-push atas
perintah pemilik proyek (`inti/backend.md`). Pekerjaan yang selesai sejak
penyesuaian `4759208` (4 sampai 6 November 2026, butir 1 sampai 10
beserta urutan yang disetujui 4 November 2026) dipindah ke
`arsip/catatan-putaran.md` (Catatan dari penyesuaian backend `4759208`
sampai `c031bde`); rujukan "butir 4 (wizard)", "butir 6 (sesi kasir)",
dan "butir 7" di dokumen lain merujuk daftar di sana.

Backend dijalankan dengan env inline agar `.env` backend tidak diubah
(`inti/pengujian.md`, Menjalankan layanan uji). Kode backend tidak
diubah dari sisi frontend. Langkah pertama setiap sesi memeriksa apakah
cabang backend maju:

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in ridho nizar yoga; do echo "origin/$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...origin/$r | tr '\t' ' ')"; done
```

### Menunggu desain pemilik proyek

Butir yang butuh UI baru tidak dikerjakan dulu (pemilik proyek, 5 dan
6 November 2026). Urutannya disetujui 4 dan 5 November 2026.

1. **Halaman sesi kasir (B227)**: modul baru, pemetaan perangkat ke akun
   kas `Kas Fisik` dan laporan sesi (`read-sesi-kasir`,
   `kelola-perangkat-kasir`). Perlu varian desain lebih dulu, dan
   sumber `installationId` perangkat untuk form pemetaan perlu
   dipastikan dari backend. Sejak backend `4d221f5`: pindah dan hapus
   pemetaan ditolak selama sesi masih terbuka (K-04, K-05), tipe laci
   terpetakan terkunci (B250), dan `referensi.tipe` selisih kasir bernilai
   `SesiKasir`, `SesiKasirBuka`, atau `SesiKasirTutup` (B247). Audit
   backend 5 November 2026 menyebut halaman pemetaan pemblokir utama
   sebelum kasir dipakai, dan menyisakan dua dugaan yang menyentuh
   rancangan form: pemetaan menerima perangkat PENDING atau REVOKED
   (K-18), dan `installationId` seluruh HP keluar di laporan sesi (K-19).
   Keputusan bisnis nomor 1 sampai 3 di audit (laci untuk VOID tunai,
   pemicu sesi lama, dan tunai tanpa sesi kasir termasuk dari web; K-08
   sampai K-10) dibahas pemilik proyek bersama tim backend.
2. **Penanda dan pemandu wizard setup** (pemilik proyek, 5 November
   2026, sesudah halaman sesi kasir): pemilik proyek mencoba wizard
   sendiri, mengisi form produk lalu menekan "Simpan dan lanjut" tanpa
   "Simpan produk", sehingga produk tidak pernah terkirim (log backend
   hanya `GET /api/produk`) dan galat "Tambahkan minimal satu produk."
   menyesatkan.
   Jebakan yang sama ada di langkah Kategori dan Bahan baku. Arahnya:
   tombol yang harus ditekan lebih dulu di setiap langkah ditonjolkan,
   dan setelah wizard selesai ditambah pemandu UI (sorotan atau tur)
   yang menunjukkan apa yang diisi dan tombol apa yang ditekan. Rancangan
   dan perilakunya diajukan lewat dialog sebelum dikerjakan.
3. **Isian password di halaman verifikasi email**, sisa B248: keadaan
   tanpa password titipan (halaman dimuat ulang atau dibuka langsung)
   kini pindah ke login dengan pesan "Masuk lagi" (`efb05db`). Isiannya
   didesain sendiri oleh pemilik proyek (`kontrak/temuan.md` butir 171).
4. **Belum dijadwalkan, perlu desain**: logo toko (B203 sampai B205) dan
   jam operasional (B206) di profil toko; OTP reset PIN Owner dan ubah
   email atau password akun (B178 sampai B180); hapus akun oleh Owner
   (B181); dan pengingat masa langganan yang hampir habis di luar
   halaman Langganan.

### Menunggu keputusan pemilik proyek

- Nomor WhatsApp admin untuk halaman Langganan (LG1a, `NOMOR_WA_ADMIN`
  masih kosong).
- Keputusan bisnis nomor 1 sampai 3 di audit backend 5 November 2026
  (butir halaman sesi kasir, di atas).
- Laporan untuk tim backend, yang ditunda sampai pekerjaan backend dari
  audit selesai (utang kecil, di bawah).

### Tanpa UI baru, belum dijadwalkan

Diajukan lewat dialog sebelum dikerjakan:

- Cocokkan cache produk saat pajak berubah dari kode backend, uji hapus
  aset yang punya booking dan hapus kategori yang dipakai produk dari
  web, buktikan B112, B114, dan B115, dan lihat langsung booking Batal
  di timeline (utang kecil, di bawah).
- Pecah berkas di atas 700 baris tanpa mengubah perilaku: buat penjualan
  dan form produk (Metrik sisa pekerjaan, di atas).
- Suite penuh dengan reporter `json`, untuk mengukur harapan 564 dan
  mencatat judul skip (`inti/pengujian.md`, Baseline).
- Sisa utang pengujian yang tidak butuh pengguna uji non-Owner maupun
  data permanen (`referensi/utang-pengujian.md`).

### Utang kecil dari penyesuaian backend `4759208`

- Data toko uji wizard (lokasi, kategori, produk, pajak, dan seterusnya)
  menetap di basis data development setelah akun ujinya dihapus, karena
  hapus akun tidak menghapus tokonya; setiap run spec setup menambah enam
  toko.
- Laporan untuk tim backend belum disusun (`inti/backend.md`, Bila
  menemukan bug backend). Bahannya: `kontrak/temuan.md` butir 168 sampai
  170, serta pembuktian B215, B217, B229, B230, B231, B232, B251
  (`a207fae`), dan B248 (`efb05db`) dari web, lalu B250 setelah web
  mengerjakannya. Laporannya ditunda sampai pekerjaan backend dari audit
  selesai, agar diserahkan sekali jalan (pemilik proyek, 6 November
  2026).
- Akun uji `toko@gmail.com` dinaikkan ke Pro lewat API admin, karena
  akun lama dibaca Basic (B212) dan Basic menolak sesi booking (B216).
  Riwayat langganannya kini berisi satu catatan `ubah-plan`.
- `db:setup-toko-lama` menandai empat toko yang ada saat itu selesai
  setup inti. Jangan dijalankan ulang di basis data lokal setelah spec
  membuat akun pendaftar, karena akun itu ikut ditandai selesai.

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

### Utang kecil dari penyesuaian backend `ridho` `877e493`

- Jalur pemegang izin pembelian per ruang saja belum teruji e2e, karena
  akun uji Owner memegang izin umum (`kontrak/temuan.md` butir 158,
  Menunggu verifikasi).
- B112 (urutan stabil, validasi selaras skema, indeks nomor faktur),
  B114, dan B115 dipakai atau tidak lagi diakali web, tetapi belum
  dibuktikan khusus.
- Penerimaan (outlet) dan pengiriman (gudang) tetap daftar kartu mode
  klien dengan polling; tidak termasuk butir 150.

### Utang kecil dari pembelian stok dan audit pergantian hari

- Saldo akun kas belum terpotong pembelian, karena backend belum
  memotongnya (`modul/inventaris.md`, PS6a); dicek ulang 6 November
  2026: `pembelianStokService.js` `ridho` `c031bde` tidak menulis
  mutasi kas.

### Utang kecil dari pengembalian Outlet ke Gudang

- Daftar Kirim Barang memakai asal bertipe Outlet tanpa pemilih (AR10a).
  Untuk multi-outlet, terapkan cakupan outlet seperti Terima Barang
  (`lingkupOutlet` dan `PemilihLokasiOutlet`).
- Kartu siap surat jalan dashboard gudang dihitung server untuk kedua
  arah, sedangkan tab Perlu Surat Jalan gudang hanya memuat permintaan
  (AR6a). Angkanya melebihi isi tab bila ada pengembalian yang disetujui
  dan menunggu surat jalan outlet; perlu hitungan per arah dari backend
  atau kartu tersendiri.
- Repo frontend dibuat ulang sebagai repo baru dengan pemilik proyek
  sebagai satu-satunya kontributor, setelah seluruh pekerjaan selesai dan
  masuk produksi (pemilik proyek, 25 Oktober 2026). Seluruh commit yang
  terjangkau per tanggal itu ditulis `Mr-Gahara` tanpa atribusi lain,
  dan remote hanya punya `main` tanpa ref pull request, tetapi daftar
  kontributor GitHub masih menampilkan Claude.
  Per 31 Oktober 2026 API contributors hanya memuat `Mr-Gahara`; yang
  tertinggal panel Contributors halaman repo dan commit `68cd7da` yang
  diganti `8b5ad0f` (`inti/cara-kerja.md`, Atribusi commit).

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
- Kategori fixture "E2E Kategori Beban" dan satu beban VOID menetap di
  basis data development (RG7a).

### Utang kecil dari penyesuaian backend `ridho` `2dd57aa`

- Cache produk saat pajak berubah belum dicocokkan dari kode backend
  (`kontrak/README.md`).
- Hapus aset yang punya booking (butir 52) dan hapus kategori yang
  dipakai produk (butir 12) belum diuji dari web.
- Nama penyetuju di daftar pengajuan stok terisi sejak `7d28135` (butir
  145); belum dipakai web.

### Utang kecil dari penyesuaian backend `nizar`

- Booking milik sebuah penjualan belum disertakan di respons detail
  penjualan; permintaannya ditunda (NZ9a).
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

- Pilihan satuan resep hanya terbukti dari respons nyata untuk bahan
  bersatuan pcs, gram, dan ml. Untuk kg, liter, pak, dan unit, isi
  `availableUnits` dibaca dari kode backend, karena data development
  tidak punya bahan bersatuan itu. Sejak `f64b518` bahan bersatuan pak
  terbukti lewat e2e.

### Utang kecil dari penyesuaian backend `f27f093`

- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
