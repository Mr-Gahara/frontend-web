# Keputusan Penyesuaian Backend

Sifat perubahan: **Jarang**: bertambah saat penyesuaian backend menghasilkan keputusan.

Lapis referensi: kirim bila pekerjaannya membutuhkan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Penyesuaian backend `465b438`

Diputuskan pemilik proyek pada 30 September 2026, saat backend
di-fast-forward ke branch `nizar` `465b438`, dengan prinsip keputusan
rancangan butir 17 dan 21. Diterapkan di `b85c2bd`, kecuali yang disebut
lain.

- **PB1a: status penjualan mengikuti backend**: DRAFT, UNPAID, PARTIAL,
  PAID, dan VOID; FINAL dihapus. Aksi di daftar dan detail ditentukan
  status dan izin endpoint-nya (`aksiPenjualan`, keputusan rancangan
  butir 14): finalisasi untuk DRAFT, bayar untuk UNPAID dan PARTIAL, void
  untuk DRAFT dan UNPAID yang belum punya pembayaran, dan hapus untuk
  DRAFT. Label dan urutan status tinggal di
  `features/penjualan/tampilan.ts`.
- **PB2a: void penjualan ditawarkan di detail** untuk DRAFT dan UNPAID
  tanpa pembayaran, lewat tombol Void Penjualan dengan dialog yang hanya
  tertutup saat berhasil. Penjualan yang punya pembayaran aktif di-void
  setelah pembayarannya dibatalkan.
- **PB3a: pembayaran tidak mengirim `akunKasID`**; form menampilkan akun
  tujuan dari metode yang dipilih. Halaman bayar menolak penjualan DRAFT
  dan VOID dengan pesan beserta tautan ke detail.
- **PB4a: riwayat pembayaran dibaca dari `pembayaran[]` detail
  penjualan** beserta `namaMetodePembayaran`, menggantikan penyaringan
  `GET /pembayaran` di klien dan pencocokan nama metode (K12a).
  Pembayaran VOID tetap tampil dengan statusnya.
- **PB5a: pembayaran PAID dapat dibatalkan per baris** oleh pemegang
  `update-pembayaran`, lewat `PUT /pembayaran/:id { status: "VOID" }`
  dengan alasan opsional yang dikirim sebagai `catatan`. Alasan itu
  menimpa catatan asli pembayaran (`kontrak/temuan.md` butir 75). Sejak
  `a4304ce` alasan dikirim sebagai `alasanVoid`, dan catatan asli tetap
  (PY5a).
- **PB6a: daftar penjualan per halaman**, 10 baris per halaman (pilihan
  jumlah baris sejak PB14a), dengan
  data halaman sebelumnya dipertahankan selama halaman berikutnya
  dimuat, karena backend selalu menjawab per halaman.
- **PB7a: payload buat penjualan memakai `diskonItem` dan
  `diskonGlobal`**, tanpa `penggunaID`. Keberhasilan diskon dibuktikan
  lewat e2e dari UI, bukan hanya unit test, karena nama lama dibuang
  backend tanpa galat.
- **PB8a: reservasi mengikuti status booking baru**: Aktif, Selesai,
  VOID, dan Tidak Datang. Timeline menyembunyikan booking VOID
  (melengkapi R5a), pemeriksaan bentrok hanya menghitung booking Aktif
  yang sudah dibayar (melengkapi R6a), dan booking bertumpuk yang belum
  dibayar tampil sebagai peringatan tanpa menahan simpan. Booking uji
  dibatalkan dengan membatalkan pembayaran PAID-nya lalu mem-void
  penjualan (menggantikan R2c).
  Tidak Datang dibuang backend `nizar` `60575b5` (`9b25433`).
- **PB9a: skenario "Tipe Tidak Diketahui" dan `test.fixme` butir 51
  dibuang**, karena backend kini menolak hapus tipe aset yang masih
  dipakai (409); tampilan tipe yang hilang diuji unit lewat
  `namaTipeAset`.
- **PB10a: surat jalan uji DIKIRIM ditutup lewat terima penuh**, karena
  batal dari DIKIRIM ditolak backend (P12). `siapkanSuratJalan` memakai
  pengajuan uji milik spec, yang dipakai ulang bila ada dan dibuat bila
  tidak, lalu disetujui pengguna uji "E2E Penyetuju" di konteks
  permintaan terpisah.
  Sejak `a8aec53` pengajuan uji disetujui Ridho sendiri (RH5a).
- **PB11a: persetujuan pengajuan sendiri**: Owner boleh menyetujui
  pengajuannya sendiri dengan penanda self-approval, peran lain tidak.
  Backend belum menerapkannya (`kontrak/temuan.md` butir 76); sampai itu
  spec memakai pengguna penyetuju uji (PB10a).
  Diterapkan backend `yoga` `2e25bb6`; penyetuju uji dicabut di `a8aec53`
  (RH5a).
- **PB12a: terima penerimaan diuji sungguhan lewat UI tanpa
  `page.route`** (`6e314ae`). Jumlah diterima 0 dikirim apa adanya dan
  tidak lagi ditahan, mencabut penahanan `SERVER_TERIMA_JUMLAH_NOL` dari
  submodul transfer; item dikenali lewat `itemId`.
- **PB13a: pembersihan data uji memeriksa jawabannya** (`b5a55c4`):
  `hapusLewatApi` dan `hapusTipe` menerima sukses atau 404 lewat
  `expect.soft`. Akun kas uji dibuat bersaldo 0 lalu dinonaktifkan,
  karena akun kas tidak dapat dihapus dan akun bersaldo tidak dapat
  ditutup (melengkapi KU4a, `kontrak/temuan.md` butir 81); payload
  bersaldo diperiksa lewat `POST` yang dijawab gagal. Lima akun uji
  bersaldo yang tertinggal dihapus langsung dari basis data development
  beserta mutasi saldo awalnya.
- **PB14a: footer tabel memakai paginasi server** (`b63cf08`),
  menggantikan bar navigasi terpisah yang membuat daftar penjualan
  menampilkan dua kontrol halaman. `DataTable` mendapat `paginasiServer`,
  dan footer yang sudah ada memakai angka serta aksi server. Pilihan
  jumlah baris 10, 20, 50, dan 100 ada di footer, berbawaan 10 dan tidak
  diingat; mengganti jumlah baris kembali ke halaman 1. Tombol urutkan No.
  Referensi, Tanggal, dan Total dibuang, karena `GET /penjualan` tidak
  menerima parameter urutan; kebutuhannya dilaporkan
  (`kontrak/temuan.md` butir 83). Dipasang kembali sebagai urutan server
  di `a4304ce` (PY6a).
- Diterapkan tanpa ditanyakan (`b85c2bd`): laporan laba rugi mengirim
  tanggal lokal `YYYY-MM-DD` (`keTanggalLokal`), karena backend menolak
  format ISO; `filter.ts` di `features/pembayaran`, `useDaftarPembayaran`, dan
  `namaMetode` dibuang; dan `test.fixme` yang terbukti diperbaiki backend
  dilepas satu per satu dengan commit masing-masing (`a10af75`,
  `e4bfc86`, `8134842`, `31ebd92`).

## Penyesuaian backend `yoga`

Diputuskan pemilik proyek pada 1 Oktober 2026.

- **PY1a: acuan backend berikutnya `origin/yoga`** (`50eede7`), yang sudah
  menggabungkan `origin/nizar` `3edbdea`.
- **PY2a: urutan pekerjaan.** PO11a di-commit terhadap `465b438`, lalu
  penyesuaian ke `yoga`, lalu submodul profil outlet, agar profil outlet
  tidak diuji terhadap backend yang akan diganti.
- **PY3a: permission basis data development diselaraskan sendiri** dengan
  seed backend, karena basis datanya lokal: nama yang dikeluarkan dari
  seed dilepas dari role lalu dihapus, seed disinkronkan, dan role Owner
  diisi ulang (`inti/backend.md`). Temuannya tetap dilaporkan, karena
  setiap basis data yang sudah berjalan akan mengalami hal yang sama
  (`kontrak/temuan.md` butir 97).
- **PY4a: fixture stok penjualan mengikuti kontrak `yoga`** (`65edf8c`).
  `produk.stok` disetel lewat stok bahan uji di outlet, karena backend
  menghitungnya dari inventory outlet saat produk disimpan; stok master
  tidak dipakai lagi. Kedua gerbang stok finalisasi tetap diuji terpisah
  dengan mengubah stok outlet sesudah produk disimpan. `test.fixme` butir
  37 dibuktikan masih gagal dan dipertahankan.
- **PY5a: `alasanVoid` untuk pembayaran dan penjualan** (`a4304ce`).
  Batal pembayaran mengirim `alasanVoid`, riwayat menampilkan catatan asli
  dan alasan batal, dan void penjualan menerima alasan opsional lewat
  `DialogVoidPenjualan`, yang dipakai detail dan daftar; detail penjualan
  VOID menampilkan alasannya.
- **PY6a: urutan daftar penjualan dari server** (`a4304ce`), mencabut
  penundaan di PB14a. No. Referensi, Tanggal, dan Total dapat diurutkan
  lewat `sort` dan `order`, urutan ikut kunci query, dan mengganti urutan
  kembali ke halaman 1.
- **PY7a: form produk mengirim `locationID` lokasi aktif** untuk produk
  beresep (`a4304ce`), bagi pemegang `read-location`. Petunjuk resep yang
  dihapus diganti: stok yang diisi tersimpan apa adanya sejak butir 11
  diperbaiki.

## Penyesuaian backend `nizar`

Diputuskan pemilik proyek pada 7 Oktober 2026, setelah `origin/nizar` maju
ke `9d45efc` (tiga commit, bercabang dari `yoga` di `3edbdea`). Labelnya
NZ.

- **Acuan uji adalah gabungan lokal `yoga` dan `nizar`**: cabang
  `uji-yoga-nizar` `54f787b` di backend lokal, tidak di-push, karena
  `nizar` tidak memuat `fc29433`. Satu-satunya konflik ada di dokumen
  backend dan diselesaikan dengan versi `nizar`. Ketiga cabang backend
  (`ridho`, `nizar`, `yoga`) memegang pekerjaan pemilik yang berbeda dan
  tidak saling memuat. Sejak `92d4f27` acuan uji adalah cabang `ridho`,
  tempat pemilik proyek menyatukan `yoga` dan `nizar`; cabang uji lokal
  tidak dipakai lagi (`inti/backend.md` bagian Pemilik modul backend).
- **Seluruh perbaikan backend dimanfaatkan dalam putaran ini**, satu
  commit per kelompok.
- **NZ1a: ringkasan mutasi gabungan tampil saat tidak ada akun dipilih**
  (`d23844a`), dari `GET /akunkas/ringkasan`; dengan satu akun tetap
  ringkasan akun itu. Mengubah MK2a.
- **NZ2a: buku mutasi menampilkan pencatat dan tautan penjualan**
  (`d23844a`): kolom Pencatat, dan nomor referensi mutasi pembayaran
  bertaut ke detail penjualannya. Nama akun dibaca dari baris, dengan
  daftar akun kas sebagai cadangan.
- **NZ3a: riwayat Pindah Dana berfilter periode** (`8072214`), lewat dua
  `PilihTanggal` atas tanggal transfer, dengan tombol Reset Filter yang
  mati selama tidak ada filter yang diisi. Melengkapi DN2a.
- **NZ4a: metode pembayaran aktif terakhir ditahan di klien**
  (`3b4f35b`): menu Nonaktifkan dan pilihan Non-Aktif di form ubah mati
  beserta keterangan, dan jawaban 409 backend tetap ditampilkan.
  Menggantikan PO5a.
- **NZ5a: saat batas aktif tercapai, tambah tetap terbuka dan hanya dapat
  menyimpan nonaktif** (`3b4f35b` untuk metode pembayaran, `a80d2fa`
  untuk diskon). Mengaktifkan tetap ditahan. Mengubah PO3a dan PD2a.
- **NZ6a: khusus member tetap tidak ditawarkan** sampai web punya modul
  membership, walau izinnya kini ada di seed. PD8a dipertahankan.
- **NZ7a: booking yang sudah dibayar dapat ditandai Selesai lebih awal
  dari detail penjualan** (`729c16a`), bukan dari blok timeline, yang
  tetap menjadi tautan (R4b).
- **Booking lama berstatus Batal dibiarkan** dan dicatat
  (`kontrak/temuan.md` butir 141): hanya data development, dan backend
  tidak lagi menulis status itu.
- **`createdAt` tiga pengajuan development digeser** ke sebelum
  `PGJ/202610/0137`, lewat skrip bermode tinjau, karena pembentuk nomor
  backend terkunci olehnya (`kontrak/temuan.md` butir 139).
- Diterapkan tanpa ditanyakan (`9b25433`): status Tidak Datang serta
  `waktuCheckIn` dan `batasCheckIn` dibuang dari tipe, label timeline,
  dan test, mengikuti backend.
- Diterapkan tanpa ditanyakan (`d23844a`): periode tetap dikirim sebagai
  ISO hari lokal, karena hasilnya terbukti sama dengan tanggal saja;
  ringkasan gabungan lewat method api tersendiri, agar audit endpoint
  mengenalinya; dan field baru di tipe mutasi opsional.
- Diterapkan tanpa ditanyakan (`8072214`): periode riwayat kosong di
  awal, dan dikirim sebagai `YYYY-MM-DD`; labelnya "Transfer dari" dan
  "Transfer sampai", karena backend menyaring tanggal transfer.
- Diterapkan tanpa ditanyakan (`729c16a`): booking dimuat per id dari
  `itemPenjualan[].sesiBookingID`, hanya bagi pemegang `read-booking`;
  tombol hanya untuk booking Aktif yang jamnya belum lewat; dan dialog
  hanya tertutup saat berhasil (keputusan Fase 0).

## Penyesuaian backend `nizar` `8dc6211`

Diputuskan pemilik proyek pada 8 Oktober 2026, setelah `origin/nizar` maju
delapan commit di atas `ridho` `92d4f27`. Labelnya melanjutkan NZ.

- **Prinsip penilaian**: acuannya praktik baku. Setiap perubahan backend
  dinilai lebih dulu; yang benar diikuti, dan yang keliru dilaporkan
  tanpa ditiru di web.
- **NZ8a: nama pelanggan boleh kembar, mengikuti backend.** Yang unik
  adalah pengenal (nomor HP dan email), bukan nama. Sebagai gantinya,
  pemilih pelanggan di buat penjualan dan buat reservasi menampilkan dan
  mencari nomor HP (`fe9631f`), dan skenario penolakan kembar di e2e
  berpindah dari nama (400) ke nomor HP (409) (`5b92d14`).
- **NZ9a: booking di detail penjualan tetap dimuat per id.** Filter
  `?penjualanID=`, yang diminta web di `kontrak/temuan.md` butir 140,
  tidak dipakai, dan tidak ada permintaan baru ke backend. Menyertakan
  booking di respons detail penjualan, seperti `pembayaran[]`, baru
  diajukan bila penjualan dengan banyak booking terbukti nyata, bersama
  keputusan izinnya. Melengkapi NZ7a.
- **NZ10a: `test.fixme` pengosongan nomor HP dilepas, dan
  `isianTidakTerkosongkan` beserta peringatannya dibuang** (`1bb26c0`),
  setelah pengosongan terbukti di backend. Mencabut PD5a.
- **Basis data development tidak diselaraskan untuk indeks pelanggan**
  (`kontrak/temuan.md` butir 142): dibiarkan sebagai bukti, karena
  perubahan web tidak bergantung padanya.
- Diterapkan tanpa ditanyakan (`4539c85`): buat penjualan dan buat
  reservasi menuntut `read-pelanggan`, karena pelanggan wajib di kedua
  payload (GR7a); template role tidak diubah, karena setiap template
  yang memuat `create-penjualan` sudah memuat izin itu.
- Diterapkan tanpa ditanyakan (`fe9631f`): aturan tampilan pemilih
  ditulis sebagai fungsi murni di `features/pelanggan/tampilan.ts`
  (keputusan rancangan butir 10 dan 12); nomor HP tampil di baris pilihan
  dan di pemicu, dengan gaya elemen di sebelahnya; dan `value` item
  pilihan di buat reservasi memuat id agar unik.

## Penyesuaian backend `yoga` `55328f1`

Diputuskan pemilik proyek pada 8 Oktober 2026, untuk tiga perubahan Yoga
yang termuat di `ridho` sejak `92d4f27` dan belum dimanfaatkan web (B36,
B37, dan B38 milik Yoga). Labelnya melanjutkan NZ.

- **NZ11a: pengeluaran tetap ditunda** (BO1a dipertahankan). Kategori
  beban kini dapat diakses, tetapi beban masih mengubah saldo akun kas
  tanpa buku mutasi, tanpa transaksi, dan tanpa status VOID
  (`kontrak/temuan.md` butir 131 sampai 134), sehingga halaman yang
  dibangun sekarang akan meniru kekeliruan itu. Izin beban masuk template
  role bersama halamannya (FC2a).
- **NZ12a: ubah pajak hanya mengirim field yang berubah** (`50e6485`),
  setelah backend tidak lagi mewajibkan `tipePajak` saat mengubah.
  Mencabut penanganan sementara dari submodul pajak.
- **NZ13a: bahan bersatuan pak dan unit dapat dipakai di resep**
  (`f64b518`), dengan satuannya sendiri. Pemeriksaan terhadap
  `availableUnits` tetap (FC4a).
- Diterapkan tanpa ditanyakan (`50e6485`): aturan "ada perubahan" di form
  pajak mengikuti payload yang tidak kosong, dan `PerubahanPajak` tidak
  lagi mewajibkan `tipePajak`.
- Diterapkan tanpa ditanyakan (`f64b518`): bahan uji tetap "E2E Bahan
  Pak" dibuat sekali lewat API dan tidak dihapus; dan pesan "belum dapat
  dipakai di resep" dipertahankan untuk satuan bahan yang tidak dikenal
  web.

## Penyesuaian backend `ridho` `2dd57aa`

Diputuskan pemilik proyek pada 11 Oktober 2026, setelah `origin/yoga` maju
42 commit di atas `ridho` `8dc6211` dan memuat `origin/nizar` `b0a77d4`,
sehingga `ridho` cukup di-fast-forward. Labelnya RH.

- **RH1a: buat pembayaran mengirim `x-idempotency-key`** (`26093b0`),
  satu kunci per pengisian form, dengan pola K3a (keputusan rancangan
  butir 20). Menutup `kontrak/temuan.md` butir 44 dari sisi web.
- **RH2b: cakupan daftar penjualan lewat `locationID` server ditunda.**
  Sekitar 980 dari 1.620 penjualan development tidak punya `locationID`,
  termasuk seluruh penjualan booking, dan filter backend mencocokkan
  persis, sehingga memakainya akan menyembunyikan penjualan itu
  (`kontrak/temuan.md` butir 144). K5b tetap di klien sampai backend
  mengisi lokasi setiap penjualan. Menggantikan RH2a, yang semula
  memilih memindahkannya ke server.
  Dicabut di `20c026b` setelah syaratnya terpenuhi (RG4a).
- **RH3a: gate stock adjustment menerima izin per ruang** (`f61e146`)
  sebagai alternatif izin umum: `read-stock-adjustment-outlet` di ruang
  outlet dan `read-stock-adjustment-gudang` di ruang gudang (keputusan
  rancangan butir 16). Izin ruang lain tidak diterima, dan template role
  tidak diubah.
- **RH4a: relasi ke pajak nonaktif tampil bertanda "(nonaktif)"** di tab
  pajak per produk (`ed4bfd3`), beserta keterangan bahwa pajak itu tidak
  dikenakan saat penjualan. Tab tetap membaca `GET /produkpajak`, bukan
  `pajakList` produk, karena relasi membawa id untuk melepas pajak.
- **RH5a: pengguna penyetuju uji dicabut dari helper spec** (`a8aec53`).
  Pengajuan uji disetujui Ridho sendiri, sehingga jalur Owner menyetujui
  pengajuannya sendiri teruji. Pengguna "E2E Penyetuju" dibiarkan di
  basis data development. Menggantikan bagian penyetuju di PB10a.
- **RH6a: izin pembelian stok masuk template role bersama halamannya**,
  seperti FC2a. Terlaksana di `5b8cbd9` (`modul/akses.md`, Template
  role).
- **Bahan baku yang belum punya riwayat dapat dihapus**, walau saat
  dibuat diisi stok awal dan batas minimum: setelah dihapus, bahan itu
  dianggap tidak pernah ada. Yang tidak dapat dihapus adalah bahan yang
  sudah dipakai resep produk, diopname, ditransfer, diajukan, dibeli,
  atau tercatat di jurnal stok, agar riwayat lama tidak kehilangan
  rujukannya, seperti metode pembayaran. Backend `2dd57aa` masih menolak
  bahan yang baru dibuat (`kontrak/temuan.md` butir 143); kode halaman
  web tidak diubah, dan skenario hapusnya menjadi `test.fixme`
  (`43f09af`).
- Diterapkan tanpa ditanyakan (`936f073`): kedua `test.fixme` jurnal
  stok dilepas setelah lolos dua putaran, dan judulnya diluruskan
  (mencabut K9a).
- Diterapkan tanpa ditanyakan (`ed4bfd3`): `pajak.status` di tipe relasi
  opsional, dan status yang tidak dikirim dianggap aktif; aturannya
  fungsi murni `relasiNonaktif` (butir 10).
- Diterapkan tanpa ditanyakan (`43f09af`): bukti hapus di badan
  `test.fixme` diambil dari respons `DELETE` dan dari daftar yang dibaca
  ulang, bukan dari baris yang tidak ada di tabel.

## Penyesuaian backend `ridho` `7d28135`

Diputuskan pemilik proyek pada 16 Oktober 2026, setelah `origin/yoga`
maju sembilan commit dan `origin/nizar` satu commit di atas `ridho`
`2dd57aa`, ke arah yang berbeda. Labelnya RG.

- **RG1a: penyesuaian backend didahulukan, lalu tabel seragam**, agar spec
  tabel dijalankan terhadap backend yang sudah final, dan baseline suite
  penuh ditetapkan sekali.
- **RG2a: konflik `docs/pengembangan/klien.md` backend diselesaikan tanpa
  mengubah nomor.**
  B96 (Yoga) tetap di tabel Modul Pengajuan Stok; B89 dan B90 milik Nizar
  dipindah ke tabel Modul Akun Kas, Pembayaran, dan Penjualan di bawah
  B70; paragraf nomor kembar ditambahkan dan nomor baru dimulai dari B97;
  rujukan di baris temuan 144 dan filter tanggal ditandai (Nizar).
  Gabungannya di-commit di `ridho` lokal lalu di-push langsung, seperti
  `2dd57aa`, dan Yoga serta Nizar diberi tahu.
- **RG3a: tabel seragam mencakup empat belas halaman di sepuluh berkas**,
  termasuk daftar aset, tarif, tipe aset, dan pola roster, yang sama-sama
  melanggar TB2a dan TB7a.
- **RG4a: cakupan daftar penjualan pindah ke filter `locationID` server
  sesudah tabel seragam.** Syarat RH2b terpenuhi di `7d28135`; sampai
  dikerjakan, RH2b tetap berlaku.
  Diterapkan di `20c026b` (Cakupan daftar penjualan, LP1a dan LP2a).
- **RG5a: test rincian pembayaran mutasi kas menyiapkan penjualan
  lunasnya sendiri** (`f338c74`) lewat helper penjualan yang sudah
  teruji, dengan draft dibuat lewat UI, bukan helper baru lewat
  `POST /penjualan`. Sebelumnya test itu dilewati setiap suite penuh di
  bulan berjalan, karena spec keuangan berjalan sebelum spec penjualan.
- **RG6a: pengeluaran tetap ditunda**; perbaikan beban cukup dibuktikan
  lewat permintaan nyata dengan skrip sekali pakai berisi bacaan dan satu
  siklus beban `jumlah` 1 yang di-VOID, bukan spec permanen, karena spec
  beban masuk bersama halamannya.
  Dijadwalkan pemilik proyek pada 18 Oktober 2026 sebagai pekerjaan
  setelah RG4a.
  Halamannya dibangun di `1d7fa7b` (Halaman pengeluaran).
- **RG7a: kategori beban uji adalah fixture tetap "E2E Kategori Beban"**,
  dicari menurut nama, dibuat sekali bila belum ada, lalu dipakai ulang,
  seperti fixture penjualan. Kategori yang dipakai beban tidak dapat
  dihapus (B72 Yoga).
- **RG8a: Lampiran A tidak dibangkitkan ulang sekarang**;
  ketertinggalannya dicatat di `inti/status.md`.
- **RG9a: Lampiran A dibangkitkan ulang terhadap backend `aeb6a52`**
  (pemilik proyek, 10 November 2026, mengganti RG8a), dari `routes/*.js`
  dengan kolom "Dipakai frontend" dari `lib/api/endpoints.ts`.
  `kontrak/endpoint.md` dan `kontrak/payload.md` tetap dikoreksi
  tertarget; pembangkitan ulang penuh menunggu backend stabil menjelang
  rilis.

## Penyesuaian backend `fc29433`

Diputuskan pemilik proyek pada 4 Oktober 2026, setelah `origin/yoga` maju
dari `50eede7` ke `fc29433`.

- **Urutan kerja**: penyesuaian backend didahulukan dari `useAuthGuard()`
  berulang, sejalan dengan PY2a.
- **FC1a: keempat izin pajak masuk template Manajer dan General
  Manajer** (`1ec905d`), sejalan dengan izin metode pembayaran dan diskon
  yang sudah mereka pegang (pola DN4a). Kasir dan staf membaca pajak
  lewat `akses-pos`.
- **FC2a: izin beban operasional masuk template bersama halaman
  pengeluaran**, bukan sekarang, karena kategori beban masih dijawab 403
  dan kontrak beban belum final.
  Diterapkan di `61275ac`.
- **FC3a: halaman pajak mendapat entri `IZIN_HALAMAN`** (`read-pajak`
  atau `akses-pos`, `d3443e2`), diturunkan dari endpoint yang dipanggil
  halaman. Karena `IZIN_HALAMAN` hanya dibaca sidebar dan halaman pajak
  bukan menu sidebar, entrinya dibaca halaman pajak sendiri dan kartu di
  halaman indeks pengaturan. Sejak `bc388c6` entrinya ditegakkan gerbang
  rute, dan pemeriksaan di halaman pajak dibuang (GR4a).
- **FC4a: satuan resep yang tidak sah untuk bahannya ditahan di form
  produk** (`b887278`), bukan dibiarkan sampai backend menolaknya saat
  finalisasi. Sejak `yoga` `05c1149` backend menolaknya saat produk
  disimpan, dan pak serta unit sah (NZ13a).
- Diterapkan tanpa ditanyakan (`d3443e2`): tanpa izin baca, isi halaman
  pajak tidak dipasang, sehingga tidak ada permintaan yang pasti dijawab
  403; kolom Aksi kosong bila `update-pajak` dan `delete-pajak` sama-sama
  tidak dipegang; bagian Assign Pajak disembunyikan utuh bagi pengguna
  tanpa `update-produk`, sedangkan relasi yang terpasang tetap terbaca.
- Diterapkan tanpa ditanyakan (`b887278`): sumber aturan satuan adalah
  `availableUnits` yang dihitung backend, bukan salinan tabel kelompok
  satuan di web (keputusan rancangan butir 12); bahan tanpa satuan resep
  yang sah (pak dan unit) ditolak dengan pesan tersendiri; `skemaProduk`
  tetap diekspor dan pemeriksaannya ditambahkan lewat `buatSkemaProduk`.

## Penyesuaian backend `ridho` `af5f315`

Diputuskan pemilik proyek pada 19 Oktober 2026, setelah `origin/yoga`
maju lima commit (perbaikan butir 22, 137, dan 148, serta catatan B98
sampai B100) dan menggabungkan `origin/nizar`.

- **`ridho` di-fast-forward ke `origin/yoga`**, bukan digabung dengan
  commit merge: `ridho` leluhur `yoga` dan `origin/nizar` sudah termuat di
  `yoga`, sehingga isinya sama, riwayatnya tetap lurus, dan `--ff-only`
  menolak berjalan bila ternyata ada perbedaan. Sudah di-push.
- **Laporan butir 149 ditunda dan digabung** dengan pembuktian B98 sampai
  B100, agar Yoga menerima satu laporan.
- **Penanganan sementara butir 22 dibersihkan dalam satu putaran**,
  bukan sekadar dibalik: konstanta, cabang lamanya, mekanisme
  `ditahan`, dan test unit perilaku lama dihapus.
- **Asersi status yang menerima dua kemungkinan diperketat** begitu
  kontraknya pasti (kategori beban kembar 409), agar regresi terdeteksi.
- Suite e2e penuh dijalankan karena ini penyesuaian backend: 476 lolos
  dan 14 skipped, tanpa kegagalan (`d6f8ba0`).

## Penyesuaian backend `ridho` `b5b367a`

Diputuskan pemilik proyek pada 21 Oktober 2026, setelah `origin/yoga`
maju sembilan commit di atas `af5f315` (paginasi B102 sampai B106,
filter pembelian stok B103, hitungan dashboard B101, serta jurnal manual
P24 dan B107).

- **`ridho` di-fast-forward ke `b5b367a` dan di-push**, seperti
  `af5f315`. Permission diselaraskan: `delete-jurnal-stok` dilepas dari
  5 role lalu dihapus, basis data dan seed sama-sama 139 nama.
- **Template role mengikuti seed dan dilengkapi** (`ffd3994`,
  `4088d9e`; `modul/akses.md`, Template role), termasuk RH3a.
- **B101 dibuktikan dulu, lalu kartu pengajuan dashboard gudang memakai
  angka server** (`74b6af4`; `modul/gudang.md`). Kelompok pengajuan
  tetap menuntut `read-pengajuan-stok`.
- **Pengajuan stok dua arah mengikuti P8** sebagai pekerjaan terpisah
  dengan pratinjau; penjaga web tetap sampai itu (`modul/inventaris.md`,
  submodul pengajuan stok).
- **Paginasi server hanya bersama pencarian** (keputusan rancangan butir
  27): jurnal stok pindah ke server tanpa kotak cari (`081d5dc`,
  `b03c276`), dengan filter periode baru; stock opname, stock
  adjustment, surat jalan, dan pengajuan stok tetap mode klien. Kotak
  cari kedua daftar stok sempat diputuskan dibuang, lalu dibalik pemilik
  proyek: pencarian tidak dibuang, padanannya diminta ke backend.
- **Filter Sumber stock adjustment** (`referenceType`) tidak
  ditambahkan.
- **Izin jurnal gudang dan panel jurnal dashboard menuntut
  `read-location`** (`029413d`), ditemukan saat penilaian dampak.
- Laporan untuk Yoga: butir 150 sampai 153, serta pembuktian butir 149
  dan 46.
- Suite e2e penuh dijalankan karena ini penyesuaian backend: 478 lolos
  dan 14 skipped, tanpa kegagalan (`b03c276`).

## Penyesuaian backend `ridho` `877e493`

Diputuskan pemilik proyek pada 28 Oktober 2026, setelah `origin/nizar`
maju 16 commit dan `origin/yoga` 14 commit di atas `b5b367a`; `nizar`
memuat seluruh `yoga` (B108 sampai B118, P25).

- **Suite penuh di atas `5b8cbd9` lebih dulu, terhadap backend lama**, di
  jendela 00.00 sampai 07.00 WIB, sebagai bukti bersih sebelum
  penyesuaian: 495 lolos dan 14 skipped.
- **`ridho` di-fast-forward ke `877e493` dan di-push.** Permission
  diselaraskan tanpa langkah 2, karena seed hanya menambah delapan izin
  pembelian per ruang (basis data dan seed 147 nama, Owner 144), lalu
  `npm run db:indeks`.
- **B113 dan B118 dibuktikan lewat permintaan nyata di jam rawan**
  (00.57 WIB), karena di luar jam itu tidak dapat dibuktikan. Web tetap
  mengirim waktu simpan untuk tanggal hari ini (keputusan rancangan butir
  28), yang juga sah menurut P25, sehingga tidak ada kode yang diubah.
- **Izin pembelian per ruang** (`4227228`): aksi dan gerbang menerima
  izin umum atau izin ruangnya, seperti backend. Template role memakai
  izin ruang seperti stock adjustment, izin umum tinggal milik Owner, dan
  Belanja Stok menerima keduanya agar template tidak kehilangan halaman
  itu.
- **Lokasi dari populate dan Belanja Stok lewat ringkasan server digabung
  dalam satu commit** (`cab57a9`), agar test agregasi klien tidak ditulis
  ulang hanya untuk dibuang. Detail pembelian tidak lagi menuntut
  `read-location`.
- **Kartu siap surat jalan gudang memakai permintaan** (B111,
  `f865254`), sama dengan isi tab Perlu Surat Jalan.
- **Empat daftar pindah ke paginasi server bersama pencarian, satu commit
  per daftar, sebelum login**: stock adjustment, stock opname, surat
  jalan gudang, dan pengajuan stok (`98054b8`, `0ca6764`, `cc969db`,
  `ebf782b`), lalu kotak cari jurnal stok kembali (`c2a1e73`). Cakupan
  cari mengikuti backend apa adanya, termasuk nama lokasi sisi sendiri;
  penjaga pasangan lokasi tidak sah di daftar pengajuan dibuang, karena
  validasi arah ditutup backend (butir 24); tombol urut kolom dibuang di
  daftar yang pindah; penerimaan dan pengiriman tetap mode klien.
  Penyusun query lokasi dan cari bersama dipindah ke
  `features/inventaris/cakupan.ts` begitu daftar kedua memakainya
  (keputusan rancangan butir 12).
- **Laporan berisi pembuktian saja**, tanpa temuan baru; butir yang
  dipakai web tetapi belum dibuktikan khusus tidak ditulis terbukti.
- Suite e2e penuh dijalankan karena ini penyesuaian backend: 503 lolos
  dan 14 skipped, tanpa kegagalan (`c2a1e73`).

## Penyesuaian backend `ridho` `0024eb9`

Diputuskan pemilik proyek pada 30 dan 31 Oktober 2026, setelah
`origin/ridho` maju 75 commit di atas `877e493` dan memuat `yoga`
`f102c53`; `nizar` tidak maju. Isinya terutama modul SDM dan akun milik
Ridho, serta serah utang backend ke Yoga dan Nizar.

- **Lingkungan diselaraskan, lalu suite penuh lebih dulu terhadap backend
  baru, sebelum kode web diubah.** Dua migrasi backend mengisi
  `locationID` 787 shift dan 150 pola roster, membuang 2 indeks lama, dan
  merapikan 11 hari jadwal ganda. Permission diselaraskan lewat langkah
  1, 3, 4, dan 5 (`inti/backend.md`); langkah 2 dilewati karena sinkron
  seed kini membuang nama lama sendiri (B143). Basis data dan seed 160
  nama, Owner 157. Sesudahnya `npm run db:indeks`. Suite penuh: 486
  lolos, 14 skipped, dan 17 gagal, seluruhnya cocok dengan perubahan
  backend (10 B168, 1 B147, 5 B149 dan B150, 1 B136). B136 tidak ada di
  catatan backend dan hanya tertangkap suite.
- **Cakupan: yang rusak ditambah seluruh perubahan yang dapat dipakai
  web.** OTP reset PIN Owner dan ubah profil (B178 sampai B181), B195,
  dan B202 digabung ke pembangunan ulang login; logo toko (B203 sampai
  B205) dan jam operasional (B206) belum dikerjakan.
- **Shift dan pola roster per lokasi** (`8b5ad0f`, B168):
  `KUNCI_LOKASI_SHIFT` dan `KUNCI_LOKASI_POLA_ROSTER` diisi
  `"locationID"`, fixture e2e jadwal dibuat per ruang, dan kedua
  `test.fixme` "dibuat di outlet tidak tampil di gudang" berjalan.
- **Ubah ke libur tanpa langkah hapus** (`6a344b0`, B165), karena
  backend kini menghapus jadwal lain hari itu sendiri.
- **Penolakan seluruh jadwal 409 dibentuk ulang menjadi hasil biasa**
  (`2319662`, B147, B148), agar pesan tetap menyebut karyawan dan
  tanggal (J2a). `apiClient` ikut membaca `reason`, dan `ApiError`
  menyimpan `errors` aslinya (`rincian`).
- **Gerbang dan aksi SDM mengikuti izin baru** (`90537c7`, B139, B140):
  halaman shift, pola roster, kalender, dan generate digerbangi izin
  `read-` dan `create-` beserta `read-location`, tombol mengikuti izin
  per operasi, dan templat Manajer serta General Manajer memegang ke-12
  izin, Supervisor hanya tiga izin `read-`.
- **Izin lintas outlet diisi `akses-lintas-outlet`** (`2eb668a`, B142),
  dan hanya templat General Manajer yang memegangnya. Sembilan
  `test.fixme` lintas outlet berjalan; dua di antaranya keliru di spec,
  bukan di halaman, dan dibetulkan di commit yang sama.
- **Assertion status dan bentuk respons baru** (`5cd4ffb`, B136, B141,
  B149, B150). Tipe login menjadikan `requireSetup` dan `daftarTenant`
  wajib.
- **Fixme ubah pola roster dilepas** (`ea2e752`, B128), dengan
  pemeriksaan payload dan langkah hapus lewat UI.
- **Panel admin** (`25aa498`, `1ccf0ef`, `821b7de`, `482ac79`; B176,
  B177, B155, B154): detail dan ubah dari `GET /akun/admin/users/:id`,
  daftar berhalaman di server bersama cari dan status, pelaku dan total
  di riwayat, serta aktifkan akun tanpa batas tanpa durasi. Keputusan
  pemilik proyek: paginasi server, nama pelaku beserta total, dan durasi
  opsional dengan bawaan "Tetap tidak dibatasi".
- **Izin cuti hari ini disaring server** (`96a7b40`, B160). Fixture e2e
  positif dan negatif dibuat lewat API dan menetap, karena web tidak
  punya halaman izin cuti dan backend tidak punya hapus (pemilik proyek).
- **Monitoring absensi per lokasi ruang** (`44a81d0`, B183), menggantikan
  AB4a. Staf yang izin disetujui dijadikan libur tanpa shift oleh
  backend, sehingga tidak pernah termuat monitoring per lokasi; karyawan
  ruang yang izin hari itu ditambahkan sebagai baris tersendiri di panel
  Status Staf (pemilik proyek), dan temuannya dicatat
  (`kontrak/temuan.md` butir 165).
- **Kalender per lokasi ruang dengan penanda jadwal lokasi lain**
  (`b5a2578`, B184). Sel yang hanya berisi penanda tidak menawarkan buat,
  karena menjadikannya libur dari ruang lain menghapus jadwal lokasi itu
  (B165).
- **Panel Status Staf dan widget absensi menuntut `read-location`**
  (`b69d39a`), ditemukan saat penilaian dampak dokumentasi: monitoring
  per lokasi memuat lokasi ruang, sedangkan gerbangnya belum
  memeriksanya.
- Suite e2e penuh dijalankan karena ini penyesuaian backend: 514 lolos
  dan 10 skipped, tanpa kegagalan (`b5a2578`).
- **Atribusi commit**: `68cd7da` ter-push dengan baris
  `Co-Authored-By`, diganti `8b5ad0f` lewat force-push oleh pemilik
  proyek, dan aturannya dipindah ke lapis inti (`90472fe`,
  `inti/cara-kerja.md`, Atribusi commit).

## Penyesuaian backend `ridho` lokal `4759208`

Diputuskan pemilik proyek pada 4 November 2026, setelah `nizar` maju 33
commit ke `4759208` yang memuat `yoga` `a07c0b1` (23 commit). Isinya plan
dan setup akun dari web (N1 sampai N6, Y1 sampai Y3, P48) serta modul sesi
kasir.

- **Backend hanya diambil**: fast-forward atau merge beserta konflik,
  tanpa perubahan kode, tanpa mengubah `.env`, dan `ridho` tidak di-push.
  Layanan uji dijalankan dengan env inline (`inti/pengujian.md`,
  Menjalankan layanan uji), dan Mailpit sebagai kontainer Docker.
- **Basis data lokal diselaraskan atas persetujuan pemilik proyek**:
  kedua seed (164 nama, Owner 161), `db:indeks`, `db:lokasi-penjualan`
  (0 diisi), `db:data-bawaan` (4 pelanggan `Customer`, 3 akun kas, 3
  metode Tunai), dan `db:setup-toko-lama` (4 toko). Cache Redis izin
  kosong saat dihapus.
- **Akun uji dinaikkan ke Pro lewat `PUT /admin/users/:id/plan`**, karena
  akun lama dibaca Basic (B212) dan Basic menolak sesi booking, aset,
  tipe aset, dan tarif (B216); gudang juga hanya Pro (PL6a).
- **Suite penuh lebih dulu terhadap backend baru**, sebelum kode web
  diubah (09.41 sampai 10.13 WIB): 544 lolos, 2 skipped, dan 1 gagal dari
  547. Satu-satunya kegagalan adalah skenario email terdaftar 409 di
  spec daftar (B231). Judul kedua skip tidak tercatat.
- **Skenario email terdaftar diubah ke perilaku baru, bukan dibuang**:
  email terdaftar tetap lanjut ke isian kode tanpa disebut sudah dipakai.
- **Cakupan: seluruh perubahan yang dapat dipakai web**, dikerjakan
  bertahap dengan satu commit hijau per bagian: daftar, verifikasi, dan
  lupa password (`67ec690`); Langganan (`c868870`); lalu plan di panel
  admin, pelanggan bawaan, jenis mutasi baru, wizard, penyaringan per
  plan, dan halaman sesi kasir (`inti/status.md`, Pekerjaan berikutnya).
- **Verifikasi email langsung login dengan password titipan di memori**
  (`features/auth/kredensial-daftar.ts`), karena backend tidak
  menerbitkan token saat verifikasi; tanpa titipan pendaftar diarahkan
  ke login.
- **Suite e2e penuh tidak dijalankan ulang setelah perubahan web** atas
  perintah pemilik proyek; spec terdampak masing-masing lolos
  (`inti/pengujian.md`, Baseline).

## Penyesuaian backend `ridho` lokal `aa978cc`

Diminta pemilik proyek pada 5 November 2026 sebelum butir 4 (wizard):
`nizar` maju 20 commit ke `aa978cc` dan memuat seluruh `yoga` `e37bf26`,
sehingga cukup fast-forward.

- **Backend hanya diambil**, seperti `4759208`: tanpa merge, tanpa
  perubahan kode atau `.env`, dan `ridho` tidak di-push.
- **Langkah sesudah tarik tanpa `db:setup-toko-lama`**, karena di basis
  data lokal skrip itu ikut menandai akun pendaftar uji selesai setup.
  `db:plan-toko-gudang` menaikkan 0 akun; seed, indeks, lokasi
  penjualan, dan data bawaan tidak mengubah apa pun. Cache Redis izin
  dihapus.
- **Suite penuh sebelum kode web diubah**: 550 lolos dan 2 skipped dari
  552, tanpa kegagalan.
- **Tidak ada perubahan web tersendiri**: B237, B238 (stok minimal
  produk dan syarat setup produk), dan B240 (`GET /api/akun/me`)
  dikerjakan bersama wizard (butir 4).

## Penyesuaian backend `ridho` `c031bde`

Diminta pemilik proyek pada 6 November 2026 sebelum butir 6 (sesi
kasir): `nizar` maju 18 commit ke `4d221f5` dan memuat seluruh `yoga`
`cec04de`, sehingga lokal `ridho` cukup di-fast-forward dari `aa978cc`.
Isinya perbaikan audit backend 5 November 2026 (laporan Ajis dari
aplikasi mobile) di bagian Nizar, serta B245 dan B246 dari Yoga.

- **Backend diambil lalu di-push atas perintah pemilik proyek.** Satu
  commit dokumen ditambahkan di atas `4d221f5`: paket AR26 di
  `docs/pengembangan/status/ridho.md` backend untuk temuan audit A-06
  (cache sesi pengguna saat perangkat pertama dipercaya), yang akan
  dikerjakan pemilik proyek sendiri saat kembali memegang backend.
  `ridho` di-push ke `c031bde` agar Yoga dan Nizar menarik dari cabang
  itu. A-05 diserahkan pemilik proyek langsung ke Nizar, tanpa catatan.
  Kode dan `.env` backend tetap tidak diubah.
- **Langkah sesudah tarik tidak dijalankan**: seed tidak menambah atau
  membuang nama izin (hanya membersihkan cache izin di Redis), dan tidak
  ada model maupun skrip migrasi baru.
- **Kesembilan temuan audit yang dialamatkan Nizar ke Ridho dan Yoga
  dicek ulang dari kode `4d221f5`** (D-01, D-02, D-03, D-05, D-06, A-05,
  A-06, P-01, P-02): seluruhnya masih ada. Pembagian Nizar benar kecuali
  A-05, yang barisnya berasal dari commit Nizar `30b1e9f` (Y1) dan
  diserahkan pemilik proyek ke Nizar; A-06 dipegang Ridho (AR26), dan
  sisanya milik Yoga. Temuan audit tidak dicatat di `kontrak/temuan.md`,
  karena bukan temuan web.
- **Perubahan web**: B251 (perpanjang bersamaan dijawab 409) di
  `a207fae`. B248 (verifikasi email wajib `password`) ditunda pemilik
  proyek karena butuh isian baru di halaman verifikasi
  (`kontrak/temuan.md` butir 171); bagian tanpa UI menyusul di `efb05db`
  setelah suite penuh. B247 dan B250 tidak mengubah web
  sekarang dan dipakai di butir 6. B245, B246, dan B249 tidak menyentuh
  web: payload pengajuan web sudah sah, web tidak punya hapus lokasi, dan
  token web tidak membawa `installationId`.
- **Suite penuh sesudah `a207fae`**: 556 lolos, 3 gagal, dan 2 skipped
  dari 561, seluruh kegagalan karena B248 (`inti/pengujian.md`).
- **Laporan untuk tim backend ditunda** sampai pekerjaan backend dari
  audit selesai, agar diserahkan sekali jalan (pemilik proyek,
  6 November 2026). Temuan tetap dicatat di `kontrak/temuan.md` begitu
  terverifikasi (butir 168 sampai 171).

## Penyesuaian backend `ridho` lokal `1584222`

Diminta pemilik proyek pada 6 November 2026, sebelum membahas pekerjaan
tanpa UI baru: `yoga` maju 12 commit tepat di atas `c031bde` ke
`1584222`, sedangkan `nizar` dan `ridho` remote tidak maju, sehingga
`ridho` lokal di-fast-forward tanpa commit gabungan dan tanpa di-push
(maju 12 dari `origin/ridho`). Isinya P53 sampai P59 serta B252 sampai
B262, sebagian di modul Ridho atas penugasan sementara.

- **Langkah sesudah tarik**: seed membuang lima izin
  `*-pengiriman-stok` (P56, B258). Tinjauan sebelum sinkron: seed 159,
  basis data 164, di luar seed hanya kelima nama itu, dipegang 10 role.
  Sinkron seed (dibuang 5), seed Owner, dan pembersihan cache izin
  Redis, lalu tinjauan ulang: 159 nama, Owner 156, tanpa nama di luar
  seed. `db:indeks` selaras tanpa perubahan; `db:setup-toko-lama` tidak
  dijalankan (akun pendaftar uji ikut ditandai).
- **Migrasi baru di RUNBOOK backend**: `rapikanJamShift.js` mode laporan
  memeriksa 957 shift tanpa jam yang perlu dirapikan dan tanpa
  `perluManual`, sehingga tidak diterapkan. `hapusFieldUsang.js` mode
  laporan menemukan `pajak` di 9 produk dan `stok` di 46 master bahan
  baku; mode `--terapkan` ditolak penjaga izin sesi, lalu dijalankan
  pemilik proyek sendiri pada hari yang sama (9 dan 46 diterapkan), dan
  laporan ulang menunjukkan 0 dan 0.
- **Suite penuh sebelum kode web diubah** (pukul 15.52 sampai 16.21
  WIB): 562 lolos, 1 gagal, dan 1 skipped dari 564. Kegagalannya
  templat role Manajer: 116 dari 118 izin terpetakan ke id, karena
  templat masih memuat izin `*-pengiriman-stok` (B258).
- **Perubahan web**: ketujuh nama `*-pengiriman-stok` dibuang dari
  `lib/roleTemplates.ts`; nama yang tidak ada sudah dilewati saat
  dipetakan ke id, sehingga role yang dibuat dari templat tidak berubah.
  Komentar halaman edit pengajuan diselaraskan dengan B255.
- **Tidak mengubah web**: B255 (edit web sudah hanya `DRAFT`), B259
  (form edit bahan baku hanya mengirim nama dan satuan), B261 (payload
  form produk dan wizard berada di daftar validator), B252 (galat
  `{ errors }` dibaca `ApiError`; web hanya menawarkan kategori toko
  sendiri), B253 dan B254 (web tidak menulis izin cuti maupun absensi,
  selain fixture spec bertanggal `YYYY-MM-DD`), B256 dan B257 (web
  belum punya ubah email maupun hapus akun sendiri, B178 sampai B181),
  dan B262 (web tidak memanggil `GET /dashboard/outlet`). Dashboard
  gudang tidak mendapat rincian per arah, sehingga utang AR6a tetap.
- **Bukti respons nyata** (skrip API, 6 November 2026): `PUT /produk/:id`
  dengan `tenantID` dan `pajak` 400 beserta `errors` (B261); respons
  produk tanpa `pajak` dan detail ber-`createdAt` (B260, B252);
  `PUT /bahanbaku/:id` dengan `stok` 400 (B259). B255 belum dibuktikan,
  karena tenant uji tidak punya pengajuan APPROVED maupun PENDING.

## Penyesuaian backend `ridho` `d267f03`

Diminta pemilik proyek pada 7 November 2026: `ridho` remote maju tujuh
commit tepat di atas `1584222` ke `d267f03` (AR26 sampai AR29, milik
Ridho), sedangkan `nizar` dan `yoga` tidak maju, sehingga `ridho` lokal
sama dengan `origin/ridho` tanpa gabungan. Label baru B263 sampai B266.

- **Langkah sesudah tarik**: seed tidak berubah, sehingga permission
  tidak diselaraskan. `db:indeks`, yang wajib sejak AR27, membuang indeks
  unik lama `installationId_1` perangkat dan membentuk
  `{ installationId, status }`; indeks lain selaras tanpa perubahan.
  Migrasi baru `hapusPajakToko.js` (AR28) mode laporan: 8 toko masih
  membawa `persenPajak` atau `tipePajak`, dan `tanpaPajakAktif` kosong,
  sehingga tidak ada tarif yang hilang. Mode `--terapkan` ditolak
  penjaga izin sesi, lalu dijalankan pemilik proyek sendiri pada hari
  yang sama (8 dibersihkan), dan laporan ulang menunjukkan
  `tokoBerfield` 0.
- **Perubahan web** (`5b6ff0d`): `persenPajak`, `tipePajak`, dan tipe
  `TipePajak` tenant dibuang dari `types/tenant.ts`, beserta fixture unit
  test dan komentar PO13a (B266). Payload tidak berubah, karena web tidak
  mengirim keduanya sejak PO13a.
- **Tidak mengubah web**: B263 (cache sesi perangkat app pertama; web
  login tanpa `installationId`), B264 dan B265 (tablet kasir bersama;
  web tidak menyetujui maupun mencabut perangkat, dan pilihan perangkat
  Mesin Kasir sudah satu baris per `installationId` dengan seluruh
  pemakainya lewat `pilihanPerangkat`). Helper
  `tests/helpers/sesi-kasir-uji.ts` login app sebagai Owner di tablet
  yang sudah `trusted` miliknya, sehingga jalurnya tidak berubah. AR29
  hanya pengukuran hapus akun, tanpa perubahan kontrak.
- **Bukti respons nyata** (skrip API, 7 November 2026): `GET /tenant/:id`
  200 tanpa `persenPajak` dan `tipePajak`, dan `PUT /tenant/:id` dengan
  `persenPajak` 400 `Field berikut tidak diizinkan pada data tenant:
  persenPajak.` (B266).
- **Temuan baru di status backend** (milik Nizar, belum ada label B):
  setelah AR27 sesi kasir terikat perangkat, bukan pengguna, sehingga
  kasir berikutnya di tablet bersama dapat berjualan di sesi yang dibuka
  rekannya. Tidak mengubah web.

## Penyesuaian backend `ridho` lokal `916e7df`

Diminta pemilik proyek pada 8 November 2026: `yoga` maju 16 commit tepat
di atas `d267f03` ke `916e7df` (P53 sampai P59 dicatat hash-nya, B267
dan B268, P61 sampai P64, B269 sampai B282), sedangkan `nizar` dan
`ridho` remote tidak maju, sehingga `ridho` lokal di-fast-forward tanpa
gabungan dan tanpa di-push. Lokasi kerja (P61) dan pencocokan absen ke
jadwal (P62) dikerjakan Yoga di modul Ridho atas penugasan sementara.

- **Langkah sesudah tarik**: seed dan indeks model tidak berubah,
  sehingga permission tidak diselaraskan dan `db:indeks` tidak
  dijalankan. Migrasi baru `isiLokasiKerja.js` (RUNBOOK backend) mode
  laporan: `diisi` 0, dua toko bergudang (37 dan 3 staf) dibiarkan tanpa
  lokasi kerja, `tokoTanpaOutlet` kosong; `--terapkan` tidak perlu
  dijalankan.
- **Pencocokan dengan permintaan web**: P64 sesuai (utang PS6a lunas).
  B278 hanya sebagian menjawab butir 165, karena monitoring memuat staf
  yang izin hanya bila lokasi kerjanya lokasi itu. P46 dan P61 membalik
  keputusan produk Model bisnis MVP (SO-3, butir 20); pemilik proyek
  memilih mengikuti backend (`inti/keputusan-rancangan.md`).
- **Perubahan web**: PS10a pembelian memotong saldo (`b66a6eb`), LK1a
  isian lokasi kerja di dialog pengguna (`4fe201b`), dan AB6a label
  Terlambat dan Luar jadwal di Status Staf (`69f2b18`).
- **Tidak mengubah web**: P63 beban (B279, B280) atas keputusan pemilik
  proyek: payload tetap tanpa `locationID`, sehingga beban tetap tingkat
  toko, tanpa kolom atau pilihan lokasi; ditinjau bersama laporan laba
  rugi per outlet atau multi-outlet. B267 (validasi web sudah 0 sampai
  100 dengan pesan sendiri), B268 (perbaikan kebocoran cache antar-toko),
  B275 (web tidak punya hapus lokasi), dan B277 (galat absen terlalu
  awal milik aplikasi). B270 sampai B274 tidak berlaku bagi pengguna
  tanpa lokasi kerja, termasuk seluruh pengguna uji.
- **Bukti respons nyata** (skrip API, 8 November 2026): `GET /pengguna`
  memuat `locationID` null (B269); `GET /bebanoperasional` memuat
  `lokasi` null (B279); `POST /pembelianstok` 201 `saldoDipotong` true,
  saldo 231.000 menjadi 230.000 dengan mutasi `PEMBELIAN` ber-referensi
  `{ tipe: "PembelianStok" }`, `DELETE` 200 mengembalikan saldo dengan
  `PEMBALIK_PEMBELIAN` ber-`mutasiAsalID`, dan total di atas saldo 409
  `Saldo akun kas tidak mencukupi (saldo Rp 231.000).` (B281, B282).
  Pembelian lama tidak membawa `saldoDipotong` sama sekali, karena
  dokumen dibaca apa adanya (`.lean()`); web membacanya sebagai belum
  terpotong.

## Penyesuaian backend `ridho` lokal `e9112a8`

Diminta pemilik proyek pada 8 November 2026: `nizar` maju 28 commit ke
`e9112a8`, memuat seluruh `yoga` `1d3851d` (9 commit: P65 sampai P67,
B283 sampai B286), dan `ridho` lokal tidak punya commit di luarnya,
sehingga `ridho` lokal di-fast-forward tanpa gabungan dan tanpa
di-push. Label baru Nizar: B287 sampai B289 (P46 di penjualan,
pembayaran, dan sesi kasir), B290 (laba rugi per lokasi), dan B291
(arus kas); audit A-03, A-05, R1, dan P-03 bagian penjualan.

- **Langkah sesudah tarik**: seed tidak berubah, sehingga permission
  tidak diselaraskan. `db:indeks` membentuk indeks baru
  `PemakaianDiskon` `{ tenantID, diskonID }` (R1); indeks lain selaras
  tanpa perubahan. Tidak ada skrip migrasi baru.
- **Keputusan pemilik proyek** (`modul/keuangan.md` dan
  `modul/inventaris.md`):
  - **LR1a**: laporan laba rugi tetap seluruh toko tanpa `locationID`,
    karena MVP satu akun satu outlet dan satu gudang (B290). Tidak ada
    perubahan kode.
  - **LR2a**: halaman arus kas (B291) menunggu desain pemilik proyek.
  - **PG1a**: tombol Setujui pengajuan tetap tampil bagi rekan
    selokasi; pesan 403 B284 tampil apa adanya lewat toast yang sudah
    ada, dan permintaan lokasi kerja pengaju di detail masuk bahan
    laporan untuk Yoga (`kontrak/temuan.md` butir 179).
- **Tidak mengubah web**: B283 dan B287 sampai B289 (web selalu
  mengirim `locationID` ruang; pesan 403 "Lokasi di luar lokasi kerja
  Anda." tidak cocok dengan pola pengalihan login di `lib/apiClient.ts`,
  yang hanya untuk dinonaktifkan atau dibekukan), B285
  (`menitPulangAwal` tidak ada di `sesiTerakhir` monitoring, dan web
  tidak menampilkan riwayat absen), B286 (web selalu mengirim
  `locationID`), A-05 (kontrak tetap), R1 dan P-03 (internal). Seluruh
  pengguna uji tanpa lokasi kerja, sehingga jalurnya tidak berubah.
- **A-03 dan e2e**: batas per IP 20 kirim email (`lupa-password`,
  `verifikasi-email/kirim`) dan 30 periksa OTP (`reset-password`,
  `verifikasi-email`) per 15 menit, ditulis tetap tanpa variabel
  lingkungan dan disimpan di memori proses. Satu suite penuh memakai
  sekitar 6 dan 8; menjalankan ulang `tests/e2e/auth` berkali-kali
  sesudahnya dapat dijawab 429, yang tidak dilewati `ALASAN_KUOTA`.
  Restart backend mengosongkan hitungannya.
- **Bukti respons nyata** (skrip API, 8 November 2026): `GET
  /laporan/laba-rugi` 200, baris `data` tetap sepuluh kunci yang sama,
  dan `ringkasan` menambah `locationID` serta `totalBebanTingkatToko`
  (keduanya null tanpa `locationID`; dengan `locationID` outlet,
  `totalBebanTingkatToko` 0) (B290). `GET /laporan/arus-kas` 200 dengan
  baris per hari (`penjualanMasuk`, `penjualanVoid`, `bebanKeluar`,
  `pembelianKeluar`, `selisihKasMasuk`, `transferMasuk`, `saldoAwalAkun`,
  `arusKasBersih`, dan pasangan pembaliknya) (B291). `GET
  /pengajuanstok/:id` memuat `dimintaOleh` `{ id, nama }` (butir 179).

## Penyesuaian backend `ridho` lokal `0bbd261`

Diminta pemilik proyek pada 10 November 2026: `ridho` remote maju 18
commit di atas `e9112a8` ke `0e43a6d` (Yoga P-03 dan P68 sampai P73,
B292 sampai B306; Ridho AR30, AR31, AR33, AR34, dan P74, B307 sampai
B311), dan `ridho` lokal sudah sama dengannya. `yoga` lalu maju delapan
commit tepat di atas `0e43a6d` ke `0bbd261` (P75 sampai P77, B312 sampai
B318), sehingga `ridho` lokal di-fast-forward tanpa gabungan dan tanpa
di-push. `nizar` tidak maju.

- **Langkah sesudah tarik**: seed menambah empat izin
  `*-barang-inventory` (B297) tanpa nama dibuang, sehingga langkah 2
  penyelarasan dilewati; harapannya 163 nama dan Owner 160. Migrasi baru
  `izinBarangInventory.js` dijalankan sesudah kedua seed, dan
  `hapusFieldUsang.js` kini juga membuang `namaPajak` dari relasi produk
  pajak (P73). Skrip tinjau yang membaca `.env` backend ditolak penjaga
  izin, sehingga seluruh langkah basis data dijalankan pemilik proyek
  lewat perintah `!`.
- **Keputusan pemilik proyek**:
  - **KG1a**: kategori kembar (B304) tetap ditentukan dari daftar
    kategori yang dimuat, sehingga nama dan kode yang sama-sama kembar
    tetap disebut keduanya; field dari pesan 409 backend dipakai bila
    daftar tidak menunjukkan bentrok (`features/kategori/pesan.ts`).
  - **LK2a**: atasan berlokasi kerja yang memberi lokasi lain atau null
    (B310) melihat pesan 403 apa adanya; pilihan lokasi kerja di dialog
    pengguna tidak dibatasi, sejalan dengan PG1a dan utang LK1a.
  - **VK1a**: butir 85 dan 107 (B50, B51), B169, dan B170 yang menunggu
    pembuktian web (AR31) masuk bahan laporan, dibuktikan saat laporan
    disusun.
  - **RT1a**: templat role web tidak memuat izin `*-barang-inventory`,
    karena web tidak punya halaman barang inventory; izinnya diberikan
    lewat form role.
  - **OM1a**: omzet per metode pembayaran di laporan diminta ke backend
    lebih dulu (`kontrak/temuan.md` butir 180); tampilannya didesain
    pemilik proyek setelah endpoint tersedia.
- **Diubah di web**: pesan kategori kembar (KG1a), tipe `Kategori.tenantID`
  menjadi id (B305), dan `useSimpanPengguna` memuat ulang daftar juga saat
  gagal, karena PUT yang dijawab 409 B315 tetap menyimpan field lain.
- **Tidak mengubah web**: B292 dan B301 sampai B303 serta B312 sampai
  B314 (web tidak memakai `process-sale`, `jurnalstok/wms`, maupun
  `baranginventory`; payload bahan baku sudah dalam daftar field: buat
  `namaBahan`, `satuan`, `stok`, `stokMinimum`, `locationID`, ubah hanya
  `namaBahan` dan `satuan`), B293 sampai B296 (payload pajak dalam daftar
  field, ubah tanpa perubahan ditahan form, dan pesan galat dibaca dari
  `errors`), B306 (nama pajak produk tetap dari populate master), B307
  sampai B309 dan B311 (web hanya membaca izin cuti, tidak memakai
  `PUT /absensi` maupun `DELETE /akun/profil`), B316 (kasir), dan B317
  serta B318 (pengguna uji tanpa lokasi kerja). Payload API di helper
  uji (bahan, kategori, izin cuti) juga dalam daftar field.

## Penyesuaian backend `ridho` lokal `d6709a1`

Diminta pemilik proyek pada 12 November 2026: `yoga` maju enam commit
tepat di atas `ridho` `f110c04` ke `d6709a1` (P78 stok keluar per
penjualan, menutup butir 181; P79 paginasi opt-in produk, inventory,
dan bahan baku; B319 sampai B323), sehingga `ridho` lokal di-fast-forward
tanpa gabungan dan tanpa di-push. `nizar` dan `ridho` remote tidak maju.

- **Langkah sesudah tarik**: seed dan skrip migrasi tidak berubah
  (`git diff f110c04..d6709a1 -- seeds scripts package.json` kosong).
  Skema jurnal stok menambah index parsial `{ tenantID, penjualanID }`,
  sehingga cukup `npm run db:indeks`, dijalankan pemilik proyek lewat
  perintah `!`.
- **Keputusan pemilik proyek**:
  - **JS1a**: filter alasan jurnal stok menerima Pembelian dan
    Penjualan, dengan badge karamel (Penjualan) dan sage (Pembelian)
    (`modul/inventaris.md`).
  - **JS2a**: rincian jurnal beralasan Penjualan bertaut ke detail
    penjualannya (`modul/inventaris.md`).
  - **VD3a**: tampilan `rincianStok` di detail penjualan menjadi
    pekerjaan UI berikutnya lewat kanvas (`modul/penjualan.md`).
  - **Paginasi P79**: diperiksa lalu direncanakan. Belum ada daftar yang
    dapat dipindah tanpa melanggar keputusan rancangan butir 27; padanan
    filternya diminta ke backend (`kontrak/temuan.md` butir 184).
- **Diubah di web**: tipe `AlasanJurnal` ditambah `Pembelian` dan
  `Penjualan`, `JurnalStok.penjualanID`, filter dan badge (JS1a), tautan
  rincian (JS2a, `tautanPenjualanJurnal` di `features/jurnal-stok/tampilan.ts`),
  dan helper `jurnalPenjualan` di `tests/helpers/penjualan-uji.ts`, yang
  tadinya mencocokkan keterangan `Penjualan <produk> x<jumlah>` dan
  menemukan 0 jurnal terhadap backend baru; kini lewat `?penjualanID=`.
- **Dibuktikan dari respons nyata**: B319 (alasan, `penjualanID`,
  keterangan bernomor referensi) dan B320 (`rincianStok` bahan resep
  dalam satuan bahan di outlet tenant) lewat
  `penjualan/alur-penjualan.spec.ts`.
- **Tidak mengubah web**: B321 sampai B323 (web tidak mengirim `page`
  maupun `limit` ke `/produk`, `/inventory`, dan `/bahanbaku`, sehingga
  daftar tetap utuh), dan potong stok sekaligus (P78 butir 3; temuan 178
  belum diuji ulang).
