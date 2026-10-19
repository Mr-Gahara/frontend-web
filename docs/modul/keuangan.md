# Modul Keuangan

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul keuangan

Diputuskan pemilik proyek pada 28 September 2026.

- **KU1a: halaman mutasi arus kas tidak lagi menampilkan data tiruan.**
  Tab dan rutenya tetap, dengan keterangan bahwa fitur belum tersedia,
  karena backend belum punya model maupun route mutasi kas. Kebutuhan
  endpoint-nya disampaikan ke tim backend (`kontrak/temuan.md` butir 61).
  Backend `465b438` kini punya endpoint mutasi kas, dan halamannya
  diwujudkan di `e129f9d` (MK1a sampai MK3a di bawah).
- **KU2a: kartu ringkasan yang gagal memuat menampilkan `-`** beserta
  keterangan singkat, bukan Rp0 (keputusan rancangan butir 11).
- **KU3a: skema buat akun kas mempertahankan `z.coerce`** dengan tipe
  masukan dan keluaran eksplisit, seperti T2a; `.default()` dibuang
  karena nilai awal sudah ada di `defaultValues`.
- **KU4a: spec buat akun kas membuat akun uji sungguhan** bernama unik
  per run, lalu menghapusnya lewat `DELETE /akunkas/:id` di `finally`
  (`0cfb3bd`); sejak `b5a55c4` akun uji bersaldo 0 lalu dinonaktifkan,
  karena hapus tidak ada lagi (PB13a).
- **KU5a: persentase pertumbuhan laba dihitung dari laba periode
  sebelumnya** lewat endpoint yang sama dengan rentang mundur satu
  periode, dan `-` bila laba periode sebelumnya 0. Sebelumnya persentase
  itu dihitung dengan `Math.random()`. Diterapkan di `45187b6`:
  pembanding adalah periode yang sama mundur satu periode sepanjang yang
  sudah berjalan (kemarin; Senin sampai hari yang sama minggu lalu; atau
  tanggal 1 sampai tanggal yang sama bulan lalu, dipangkas ke akhir
  bulan), agar periode berjalan yang parsial tidak dibandingkan dengan
  periode penuh. Penyebutnya nilai mutlak, sehingga rugi yang membaik
  bertanda positif, dan warna badge mengikuti arah pertumbuhan: hijau
  naik, merah turun, netral untuk `0%` dan `-`.
- **KU6a: daftar akun kas yang gagal dimuat menampilkan pesan**, bukan
  "Belum ada Akun Kas", sejalan dengan keputusan submodul jurnal stok
  (`45187b6`).
- **KU7a: nama dan nomor akun berisi spasi saja ditolak form** lewat
  `trim` dengan pesan wajib yang sudah ada, sejalan dengan T4a
  (`45187b6`); sebelumnya isian itu lolos form lalu ditolak backend.

Diputuskan pemilik proyek pada 3 Oktober 2026, untuk mutasi arus kas
(`e129f9d`) dan halaman akun kas (`6a57d12`):

- **MK1a: mutasi arus kas adalah satu halaman buku gabungan** seluruh
  akun kas dari `GET /akunkas/mutasi`, dengan filter akun, periode, arah,
  dan jenis, berpaginasi server. Halaman mutasi per akun tidak dibuat.
- **MK2a: ringkasan periode tampil hanya saat satu akun dipilih** di
  filter (saldo awal, total masuk, total keluar, dan saldo akhir), karena
  backend hanya punya ringkasan per akun (`kontrak/temuan.md` butir 125).
  Diubah NZ1a (`d23844a`): tanpa akun terpilih tampil ringkasan gabungan.
- **MK3a: halaman dibuka dengan periode bulan berjalan**, dari tanggal 1
  sampai hari ini, dan dapat diubah lewat dua `PilihTanggal`.
- **AK1a: halaman akun kas menampilkan kartu hanya untuk akun aktif.**
  Akun non-aktif masuk bagian lipat "Akun non-aktif (N)" di bawah kartu,
  tertutup saat halaman dibuka, berisi daftar ringkas satu baris per
  akun. Alasannya: akun kas tidak dapat dihapus, sehingga akun yang
  ditutup terus bertambah dan menenggelamkan akun aktif.
- **UA1a: form ubah akun kas di halaman tersendiri**,
  `/dashboard/outlet/keuangan/akunkas/[id]/ubah`, sejalan dengan halaman
  buat; tautan Ubah ada di kartu akun aktif dan di baris akun non-aktif.
- **UA2a: akun non-aktif diaktifkan kembali lewat tombol di baris bagian
  lipat**, dengan dialog konfirmasi.
- **UA3a: nonaktifkan adalah tombol terpisah di halaman ubah**, bukan
  isian status di form, sehingga penolakan backend (saldo belum 0 atau
  akun masih dipakai metode pembayaran) tidak menggagalkan simpan isian
  lain.
- **UA4a: form ubah mengirim hanya field yang berubah.** Tombol simpan
  mati bila tidak ada perubahan, keterangan yang dikosongkan dikirim
  `null`, dan saldo hanya ditampilkan.
- **Pekerjaan setelah ini adalah Pindah Dana antar akun kas** (selesai di
  `e53c016`, DN1a sampai DN4a di bawah).
- Diterapkan tanpa ditanyakan (`e129f9d`): batas periode dikirim sebagai
  ISO utuh dari awal dan akhir hari lokal, karena tanggal tanpa jam
  dibaca backend sebagai tengah malam UTC (butir 123); periode menyaring
  waktu dicatat mengikuti backend, dan tanggal transaksi ditampilkan
  hanya bila harinya berbeda; nama akun dicocokkan dari daftar akun kas;
  pilihan jenis mengikuti arah, dan mengganti arah mengosongkan jenis
  yang tidak searah; filter akun memuat akun non-aktif juga, agar mutasi
  lamanya tetap dapat disaring; tabel tanpa tombol urutkan, karena
  backend tidak menerima urutan; dan kedua hook mutasi selalu dimuat
  ulang saat dibuka.
- Diterapkan tanpa ditanyakan (`6a57d12`): seluruh akun non-aktif
  menampilkan keterangan "Belum ada akun kas aktif", berbeda dari keadaan
  belum ada akun sama sekali; lencana Non-Aktif di kartu dibuang; dan
  halamannya tetap di `app/` dengan tampilan lama.
- Diterapkan tanpa ditanyakan (`1bc76f4`): halaman ubah akun non-aktif
  juga memuat tombol Aktifkan Kembali, agar halaman itu tidak buntu;
  akun dibaca dari cache daftar tanpa permintaan detail; skema ubah
  memakai batas panjang backend (nama 100, nomor 50, keterangan 255);
  teks dibandingkan setelah dipangkas, sehingga spasi di tepi bukan
  perubahan; dialog ganti status tetap terbuka dan menampilkan pesan
  backend saat ditolak; metode pembayaran ikut diinvalidasi; dan
  pengguna tanpa `update-akunkas` tidak melihat tombol aksi serta
  mendapat keterangan di halaman ubah.

Diputuskan pemilik proyek pada 3 dan 4 Oktober 2026, untuk Pindah Dana
(`e053a67`, `e53c016`). Labelnya DN, karena PD sudah dipakai modul
Pelanggan dan diskon:

- **DN1a: form Pindah Dana di halaman tersendiri**,
  `/dashboard/outlet/keuangan/akunkas/pindahDana`, sejalan dengan halaman
  buat dan ubah akun kas.
- **DN2a: riwayat transfer di halaman yang sama**, berpaginasi server,
  dengan filter akun dan status, serta Batalkan per baris lewat dialog
  beralasan opsional.
  Filter periode ditambahkan di `8072214` (NZ3a).
- **DN3a: tanggal transfer tidak diisi.** `tanggal` tidak dikirim dan
  backend memakai waktu server, karena filter periode buku mutasi memakai
  waktu dicatat.
- **DN4a: ketiga izin jurnal transfer masuk template Manajer dan General
  Manajer**, sebagai commit tersendiri (`e053a67`), seperti PO11a.
- **Pekerjaan setelah ini adalah pengeluaran (beban operasional)**
  (4 Oktober 2026); ditunda pada hari yang sama (BO1a di bawah).
- Diterapkan tanpa ditanyakan (`e53c016`): halaman tanpa entri
  `IZIN_HALAMAN`, dengan izin per bagian seperti PO14a (form bagi izin
  buat, riwayat bagi izin baca, Batalkan bagi izin ubah); jumlah
  bilangan bulat minimal 1 dan disimpan sebagai teks; keterangan wajib,
  dipangkas, paling panjang 500; pilihan akun hanya yang aktif, dan akun
  tujuan tidak menawarkan akun sumber; jumlah di atas saldo sumber
  ditahan form, sedangkan penolakan backend ditampilkan apa adanya;
  form dikosongkan setelah berhasil tanpa berpindah halaman; dialog batal
  hanya tertutup saat berhasil (keputusan Fase 0); filter akun riwayat
  memuat akun non-aktif juga; ubah keterangan tanpa VOID tidak dibuat;
  dan transfer uji e2e dibuat lalu dibatalkan lewat UI, sehingga saldo
  akun sumber pulih.

Diputuskan pemilik proyek pada 4 Oktober 2026, untuk pengeluaran
(`7fce871`). Labelnya BO (beban operasional):

- **BO1a: pekerjaan pengeluaran ditunda** sampai backend memperbaiki izin
  beban dan menetapkan kontraknya. Kedua endpoint beban menjawab 403 bagi
  setiap pengguna di backend `50eede7`, dan kontraknya diperkirakan
  berubah (`kontrak/temuan.md` butir 130 sampai 132), sehingga halaman
  yang dibangun sekarang tidak dapat diuji e2e dan berisiko ditulis
  ulang. Temuannya dilaporkan (`arsip/laporan-backend.md`).
- **BO2a: halaman pengeluaran menampilkan keterangan belum tersedia**,
  seperti mutasi arus kas dahulu (KU1a), dengan rute dan menu tetap.
  Gate `read-pembayaran` tidak diubah sampai izin backend ditetapkan.
- **Pekerjaan setelah ini**: memeriksa ulang utang yang menunggu backend
  terhadap cabang backend terbaru (hasilnya TS1a, Submodul transfer,
  pengiriman, dan penerimaan), lalu utang kecil keuangan (selesai di
  `f7805ca`, UK1a sampai UK3a di bawah).

Diputuskan pemilik proyek pada 4 Oktober 2026, untuk utang kecil keuangan
(`f7805ca`). Labelnya UK:

- **UK1a: helper akun kas uji menjadi helper bersama**,
  `tests/helpers/akun-kas-uji.ts`, dan spec ubah akun kas serta Pindah
  Dana dipindah ke helper itu di commit yang sama.
- **UK2a: alur menutup akun bersaldo menyertakan satu pembatalan
  transfer**, agar label pembatalan ikut diperiksa di halaman mutasi;
  satu transfer VOID tambahan tertinggal per run.
- **UK3a: skenario 409 lama di spec ubah akun kas dipertahankan**, walau
  penyebab penolakannya tidak pasti; alur baru menambah bukti penolakan
  yang pasti karena saldo.
- **Suite e2e penuh tidak dijalankan sebelum dokumentasi ditutup**;
  baseline dicatat sebagai hitungan, dan suite penuh dijalankan di akhir
  pekerjaan berikutnya.
- **Pekerjaan setelah ini adalah utang kecil modul produk** (selesai di
  `152088b`, Modul produk dan kategori).
- Diterapkan tanpa ditanyakan (`f7805ca`): spec baru tersendiri,
  `tutup-akun-bersaldo.spec.ts`; akun uji dibuat lewat API seperti kedua
  spec lama; `finally` memulihkan saldo dan menutup akun lewat API bila
  alur berhenti di tengah; dan harapan buku mutasi dihitung dari respons
  yang dibaca halaman itu sendiri.

Diputuskan pemilik proyek pada 4 Oktober 2026, untuk pemformat rupiah
(`4c9c4ed`). Labelnya FR:

- **FR1a: `formatRupiah` menampilkan pecahan sampai dua digit**, lewat
  `maximumFractionDigits` 2 yang eksplisit. Pembulatan ke rupiah utuh
  tidak dipilih, agar pecahan yang ada di data tetap terlihat.
- **FR2a: transfer berjumlah pecahan di data development dibiarkan**
  sebagai bukti `kontrak/temuan.md` butir 126.
- **Baseline suite penuh dicatat apa adanya** (424 lolos, 1 gagal, dan
  17 skipped), tanpa menjalankan ulang suite penuh setelah perbaikan.
- **Pekerjaan setelah ini adalah menyatukan pemformat rupiah** (selesai
  di `006d7f8`), lalu error ESLint warisan (selesai di `f5fe574`, Error
  ESLint warisan).

### Halaman pengeluaran

Diputuskan pemilik proyek pada 18 Oktober 2026, saat pengeluaran
dibangun setelah RG4a (`61275ac` sampai `1d7fa7b`). Melanjutkan label BO.

- **BO3a: daftar pengeluaran dengan halaman catat tersendiri.** Daftar
  memakai DataTable berpaginasi server dengan filter akun kas, kategori,
  status, dan periode; Catat Beban berada di
  `/dashboard/outlet/pengeluaran/catatBeban`. Menggantikan BO2a.
- **BO4a: kategori beban dikelola di Pengaturan**, sejajar metode
  pembayaran dan pajak. Form catat menautkan ke sana bila belum ada
  kategori.
- **BO5a: Owner memilih tanggal beban, peran lain hari ini**, sesuai
  keputusan pemilik proyek 17 Oktober 2026 dan P23 backend. Owner
  dikenali dari level role 100, dan tanggal masa depan dinonaktifkan.
  Backend belum menegakkannya untuk beban.
- **BO6a: menu titik tiga Lihat rincian, Ubah (keterangan dan
  kategori), dan Batalkan (VOID beralasan)**; dua yang terakhir hanya
  untuk beban AKTIF.
- **BO7a: data uji beban Rp1 dari akun aktif bersaldo, lalu di-VOID
  lewat UI**, dengan kategori fixture RG7a. Setiap run meninggalkan satu
  beban berstatus Dibatalkan.
- **Pekerjaan setelah ini adalah dashboard gudang**; tata letak dan
  UI/UX-nya menunggu rancangan pemilik proyek (GD1a).
- Diterapkan tanpa ditanyakan: gerbang daftar pindah ke
  `read-beban-operasional`, dan halaman catat menuntut
  `read-kategori-beban`, `read-akunkas`, dan `create-beban-operasional`
  (GR5a, GR7a); filter akun dan kategori hanya bagi pemegang izin
  bacanya; mutasi beban menginvalidasi akar beban, akunKas, dan laporan;
  form menahan jumlah di atas saldo; keterangan dan nama kategori
  dibatasi 500 dan 100 karakter, karena backend belum membatasinya; dan
  nama kategori uji unik per run dan dihapus di run yang sama.
  Penundaan BO1a, NZ11a, dan RG6a berakhir.

## Catatan

### Catatan dari halaman pengeluaran

Dikerjakan pada 18 Oktober 2026 dalam empat commit, terhadap backend
`ridho` `00de455`. `origin/nizar` tetap dua commit di depan (`96e890e`
dan `3efd05b`), dan cabang lain tidak maju.

| Commit | Isi |
|---|---|
| `61275ac` | Izin beban operasional di template Manajer dan General Manajer (FC2a) |
| `b2d84a6` | Fondasi beban operasional dan kategori beban |
| `87fbf7a` | Kategori beban di Pengaturan (BO4a) |
| `1d7fa7b` | Halaman pengeluaran dan catat beban (BO3a, BO5a, BO6a, BO7a) |

- Kontrak diambil dari kode dan dokumen API backend, lalu dicocokkan
  dengan respons nyata: daftar beban berpaginasi, query asing ditolak
  400, dan kategori dikirim tanpa mapper.
- Dari kode `00de455`: laporan laba rugi menyaring beban VOID (butir
  132), saldo kurang dan akun nonaktif ditolak 409 di dalam transaksi
  (butir 133), dan daftar beban tidak lagi di-cache serta ganti nama
  kategori membuang cache detail beban (butir 135). Hapus kategori yang
  dipakai beban ditolak 409, terbukti lewat e2e.
- P23 (tanggal lampau hanya untuk Owner) sudah ditetapkan backend, tetapi
  baru diterapkan di jurnal transfer. Web menahannya lebih dulu di beban
  (BO5a). Dokumen backend sendiri mencatat sisi beban masih menunggu,
  sehingga tidak dilaporkan ulang.
- Temuan baru: nama kategori beban kembar dijawab 400, bukan 409
  (`kontrak/temuan.md` butir 148), dilaporkan ke Yoga.
- Run e2e pertama commit kategori gagal di login karena server dev
  menjawab 500: Turbopack mencatat folder rute baru sebagai berkas.
  Dipulihkan dengan memulai ulang server dev (`referensi/disiplin-perubahan.md`).
- Setiap run spec pengeluaran meninggalkan satu beban Rp1 berstatus
  Dibatalkan (BO7a). Kategori milik e2e tetap satu, fixture "E2E
  Kategori Beban".
- Vitest 678 lolos di 83 berkas. Suite e2e penuh tidak dijalankan
  (`inti/pengujian.md`).
- Keputusan: `modul/keuangan.md` (Halaman pengeluaran, BO3a sampai BO7a).

### Catatan dari pekerjaan Pindah Dana

Selesai pada 3 dan 4 Oktober 2026 dalam dua commit. Suite e2e penuh
dijalankan sebelum commit fitur: 422 lolos dan 17 skipped, tanpa
kegagalan.

| Commit | Isi |
|---|---|
| `e053a67` | Ketiga izin jurnal transfer di template Manajer dan General Manajer (DN4a) |
| `e53c016` | Halaman Pindah Dana: form, riwayat berpaginasi server, dan pembatalan lewat VOID |

- Halaman `/dashboard/outlet/keuangan/akunkas/pindahDana` (DN1a) memuat
  form di atas dan riwayat transfer di bawahnya (DN2a), di atas
  `features/jurnal-transfer` (`referensi/arsitektur.md`). Waktu transfer adalah
  waktu server; `tanggal` tidak dikirim (DN3a).
- Backend tidak punya `DELETE`: transfer dibatalkan lewat
  `PUT /jurnaltransfer/:id` berstatus VOID, yang membalik saldo kedua
  akun. Jumlah, akun, dan tanggal tidak dapat diubah setelah tercatat.
- Halaman tanpa syarat di `IZIN_HALAMAN` (entri kosong sejak `bc388c6`),
  dengan izin per bagian: form bagi
  `create-jurnal-transfer`, riwayat bagi `read-jurnal-transfer`, dan
  Batalkan bagi `update-jurnal-transfer`. Tombol Pindah Dana di halaman
  akun kas menjadi tautan bagi pemegang izin buat atau baca.
- Kedua mutation menginvalidasi akar `jurnalTransfer` dan `akunKas`,
  karena transfer mengubah saldo dua akun dan menulis dua baris buku
  mutasi.
- Pembatas tulis `/jurnaltransfer` 30 permintaan per menit per pengguna,
  dengan kunci sendiri yang terpisah dari `/akunkas`.
- Calon temuan backend dibuktikan lewat permintaan nyata pada akun uji
  sebelum dilaporkan: empat terbukti, dan satu dugaan (id tidak sah di
  `PUT` berujung galat server) terbantah, karena dijawab 404.
- Catatan backend baru: butir 126 sampai 129, dilaporkan 4 Oktober 2026
  (`arsip/laporan-backend.md`). Kontrak jurnal transfer ditambahkan ke
  `kontrak/endpoint.md` dan `kontrak/payload.md`.
- Keputusan pemilik proyek: `modul/keuangan.md` (Modul keuangan, DN1a sampai
  DN4a).

### Catatan dari pekerjaan ubah akun kas

Selesai pada 3 Oktober 2026 dalam satu commit, `1bc76f4`. Suite e2e penuh
dijalankan sebelum commit: 420 lolos dan 17 skipped, tanpa kegagalan.

- Halaman akun kas kini memakai `PUT /akunkas/:id` untuk tiga hal: ubah
  isian di halaman tersendiri,
  `/dashboard/outlet/keuangan/akunkas/[id]/ubah` (UA1a); nonaktifkan
  lewat tombol terpisah di halaman ubah (UA3a); dan aktifkan kembali
  lewat tombol di baris bagian lipat (UA2a).
- Form ubah mengirim hanya field yang berubah (UA4a): teks dibandingkan
  setelah dipangkas, keterangan yang dikosongkan dikirim `null`, dan
  tombol simpan mati bila tidak ada perubahan, karena backend menolak
  `PUT` tanpa perubahan dengan 400. Saldo hanya ditampilkan: validator
  backend menolak `saldo` saat update.
- Ganti status mengirim hanya `{ status }`. Penolakan 409 backend
  ditampilkan apa adanya di dalam dialog, karena pesannya memuat jumlah
  saldo atau nama metode: saldo belum 0, akun masih dipakai metode
  pembayaran (metode non-aktif ikut dihitung), dan batas 10 akun kas
  aktif saat mengaktifkan.
- Tombol Ubah dan Aktifkan kembali hanya tampil bagi pemegang
  `update-akunkas` (`features/akun-kas/izin.ts`); pengguna lain mendapat
  keterangan di halaman ubah. Rute ubah tanpa entri `IZIN_HALAMAN` saat
  itu; sejak `bc388c6` bersyarat `read-akunkas` dan `update-akunkas`,
  sehingga keterangan itu tidak lagi tercapai. Cabangnya dibuang di
  `dc0af1c`.
- Halaman ubah membaca akun dari cache daftar; `GET /akunkas/:id` tidak
  dipakai. `useUbahAkunKas` menginvalidasi akar `akunKas` dan
  `metodePembayaran`, karena respons metode memuat nama dan nomor akun
  kas tujuan.
- `routes/akunKasRoute.js` membatasi tambah dan ubah akun kas 30
  permintaan per menit per pengguna, dan hanya dilewati bila backend
  berjalan dengan `NODE_ENV=test`. Satu putaran spec ubah mengirim 15
  tulisan, sehingga pengulangan beruntun dijawab 429 (`inti/pengujian.md`).
- Commit pertama pekerjaan ini (`5420f89`) dicabut dari `main` dan
  diganti `1bc76f4` dengan isi yang sama: pesan commit tidak memuat baris
  atribusi asisten, atas keputusan pemilik proyek (3 Oktober 2026).
- Tidak ada catatan backend baru. Kontrak `PUT /akunkas/:id` ditambahkan
  ke `kontrak/endpoint.md` dan `kontrak/payload.md`.
- Keputusan pemilik proyek: `modul/keuangan.md` (Modul keuangan, UA1a sampai
  UA4a).

### Catatan dari pekerjaan mutasi arus kas dan akun kas

Selesai pada 3 Oktober 2026 dalam dua commit. Suite e2e penuh dijalankan
sekali di akhir (keputusan PF6a): 413 lolos, 1 gagal, dan 17 skipped.

| Commit | Isi |
|---|---|
| `e129f9d` | Halaman mutasi arus kas dari `GET /akunkas/mutasi`, dengan filter, ringkasan per akun, dan paginasi server |
| `6a57d12` | Halaman akun kas: kartu hanya untuk akun aktif, akun non-aktif di bagian lipat ringkas |

- Halaman mutasi adalah buku gabungan seluruh akun kas (MK1a): filter
  akun, periode, arah, dan jenis diterapkan backend bersama paginasi.
  Ringkasan periode tampil hanya saat satu akun dipilih (MK2a), dan
  halaman dibuka dengan bulan berjalan (MK3a).
  Sejak `d23844a` tanpa akun terpilih tampil ringkasan gabungan (NZ1a).
- Lapisan datanya ditambahkan ke `features/akun-kas` (`referensi/arsitektur.md`).
  Kedua hook mutasi selalu dimuat ulang saat dibuka, karena pembayaran
  mengubah buku tanpa menginvalidasi akar `akunKas`.
- Batas periode dikirim sebagai ISO utuh dari awal dan akhir hari lokal:
  tanggal tanpa jam dibaca backend sebagai tengah malam UTC, terbukti
  dari respons nyata (`kontrak/temuan.md` butir 123).
- Butir 61 terpenuhi. Catatan backend baru: butir 123 sampai 125,
  dilaporkan 3 Oktober 2026 (`arsip/laporan-backend.md`). Kontrak mutasi
  dan ringkasan ditambahkan ke `kontrak/endpoint.md`.
- Satu kegagalan suite penuh berasal dari backend, bukan dari kode:
  `POST /aset` saat menyiapkan data spec aset dijawab 500 "Connection
  operation buffering timed out after 10000ms" (koneksi Mongoose ke basis
  data). Spec itu lolos 50 dari 50 saat diulang dua putaran
  (`inti/pengujian.md`).
- Keputusan pemilik proyek: `modul/keuangan.md` (Modul keuangan, MK1a sampai
  MK3a dan AK1a).

### Catatan dari modul keuangan

Modul keuangan selesai pada 28 September 2026: spec pembanding (`0cfb3bd`)
dan migrasi (`45187b6`). Tidak ada lagi halaman keuangan yang memakai
`apiClient`, dan tidak ada data tiruan.

- Lapisan data ada di `features/akun-kas` (daftar, buat, dan skema) dan
  `features/laporan` (laba rugi dan aturan periode di `periode.ts`);
  halamannya tetap di `app/` dengan tampilan lama.
- Ringkasan laba rugi meminta dua rentang per periode, berjalan dan
  pembanding (KU5a). Kartu ringkasan dipasang di `layout.tsx` dan meminta
  bulan kalender penuh serta `GET /akunkas`, sehingga pengguna tanpa
  `read-akunkas` melihat `-` di kartu saldo (KU2a,
  `kontrak/izin-halaman.md`).
- Mutasi arus kas sempat menunggu endpoint mutasi kas dari backend
  (`kontrak/temuan.md` butir 61, keputusan KU1a); halamannya diwujudkan
  di `e129f9d` (Catatan dari pekerjaan mutasi arus kas dan akun kas).
- Setup tenant membuat akun kas bawaan "Kas Kecil (Laci)" `CASH-001` dan
  metode pembayaran "Tunai" yang bergantung padanya
  (`tenantService.createWithOwner`). Spec keuangan hanya menutup akun
  uji yang dibuatnya sendiri: sejak `b5a55c4` akun uji dibuat bersaldo 0
  lalu dinonaktifkan, karena `DELETE /akunkas/:id` tidak ada lagi dan akun
  bersaldo tidak dapat ditutup (`kontrak/temuan.md` butir 81).
- `AkunKasLama` dan `AkunKasRefLama` dihapus bersama migrasi metode
  pembayaran (`3359497`).
- Keputusan pemilik proyek untuk modul ini ada di `modul/keuangan.md` (Modul
  keuangan, KU1a sampai KU7a).

## Utang terbuka

### Utang kecil dari modul keuangan

- Halaman pengeluaran menampilkan keterangan belum tersedia sejak
  `7fce871`, dan gate-nya masih `read-pembayaran`. Halamannya dibangun
  begitu backend memperbaiki izin beban dan menetapkan kontraknya
  (`kontrak/temuan.md` butir 130 sampai 132). Izinnya sudah diperbaiki
  (`yoga` `55328f1`); yang ditunggu tinggal butir 131 sampai 134 (NZ11a).
  Keempatnya diperbaiki di `7d28135` (RG6a), dan halamannya dijadwalkan
  setelah RG4a.
  Halamannya selesai di `1d7fa7b`, dengan gate `read-beban-operasional`.
- `DELETE /akunkas/:id` tidak ada lagi sejak backend `465b438`, dan akun
  bersaldo tidak dapat ditutup (`kontrak/temuan.md` butir 81). Ubah,
  nonaktifkan, dan aktifkan kembali tersedia sejak `1bc76f4`, dan Pindah
  Dana sejak `e53c016`. Menutup akun bersaldo dengan memindah saldonya
  lebih dulu teruji sebagai satu alur sejak `f7805ca`; backend tetap
  tidak punya jalur koreksi saldo.
- Riwayat transfer berfilter periode sejak `8072214` (NZ3a). Ubah
  keterangan transfer tanpa VOID tidak dibuat.
- Halaman mutasi arus kas menampilkan pencatat, tautan penjualan, dan
  ringkasan gabungan sejak `d23844a` (NZ1a dan NZ2a).
  `GET /akunkas/:id/mutasi` tidak dipakai web, karena buku gabungan
  menerima `akunKasID`.
- Tampilan halaman akun kas dan halaman ubah bagi pengguna tanpa
  `update-akunkas` belum teruji e2e (`inti/pengujian.md`), dan halaman ubah
  membaca akun dari cache daftar tanpa `GET /akunkas/:id`.
- Label jenis mutasi saldo awal dan beban belum pernah tampil dengan data
  nyata. Tampilan mutasi transfer dan pembatalan transfer masuk teruji
  e2e sejak `f7805ca`; pembatalan transfer keluar hanya teruji di unit
  test.
