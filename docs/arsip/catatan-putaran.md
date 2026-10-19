# Arsip Catatan per Putaran

Sifat perubahan: **Jarang**: hanya bertambah saat isi dipindah dari lapis lain; isi lama tidak diubah.

Lapis arsip: tidak perlu dikirim di chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Catatan dari penyesuaian backend `ridho` `7d28135`

Dikerjakan pada 16 Oktober 2026 dalam dua commit test, atas keputusan
pemilik proyek mendahulukan penyesuaian backend sebelum tabel (RG1a).
`origin/yoga` maju sembilan commit dan `origin/nizar` satu commit di atas
`ridho` `2dd57aa`, ke arah yang berbeda, sehingga `ridho` di-fast-forward
ke `yoga` `723b12f`, lalu `nizar` `38f523a` digabung menjadi `7d28135` dan
di-push pada hari yang sama (`inti/backend.md`).

| Commit | Isi |
|---|---|
| `f338c74` | Test rincian pembayaran mutasi kas menyiapkan penjualan lunasnya sendiri (RG5a) |
| `cfaaa92` | `test.fixme` hapus bahan baku yang baru dibuat dilepas (butir 143) |

- Konflik gabungan hanya di `docs/pengembangan/klien.md` backend, dan
  diselesaikan menurut RG2a. Hanya berkas itu dan
  `docs/pengembangan/status.md` backend yang disentuh kedua sisi; setiap
  berkas yang diubah satu sisi sama persis dengan versi sisinya. Jest
  modul yang disentuh: 43 suite, 1.644 test lolos.
- Permission diselaraskan: `delete-beban-operasional` dilepas dari tiga
  role Owner lalu dihapus, seed sinkron 140, dan ketiga Owner memegang 137
  izin (tanpa tiga izin kelola permission yang dibatasi untuk platform).
  Penjualan lama diberi lokasi lewat `npm run db:lokasi-penjualan`: 996
  diisi, dan 4 penjualan toko tanpa lokasi tetap null. `npm run db:indeks`
  tidak mengubah apa pun, dan cache izin di Redis kosong.
- Suite e2e penuh terhadap `7d28135`: 453 lolos, 1 gagal, dan 15 skipped.
  Yang gagal habis waktu sesaat di hapus tarif, lalu lolos 9 dari 9 saat
  diulang. Lewatan baru di test rincian pembayaran bergantung pada urutan
  spec, bukan regresi backend (RG5a).
- Terbukti lewat permintaan nyata (RG6a): butir 144, 145, dan 147, serta
  B89 sampai B94 Yoga untuk beban. Butir 143 terbukti lewat e2e
  (`cfaaa92`). Siklus bukti beban meninggalkan satu beban VOID dan
  kategori fixture "E2E Kategori Beban" (RG7a); saldo akun kas kembali
  utuh.
- Tidak ada temuan backend baru, sehingga tidak ada laporan untuk tim
  backend. Kategori beban yang dikirim dengan `_id` sesuai kontrak backend
  (tanpa mapper).
- Yoga dan Nizar diberi tahu gabungan dan penyelesaian konfliknya,
  termasuk dokumen status Yoga yang masih menulis P22 belum di-commit.
- Vitest 653 lolos di 79 berkas, tidak berubah.
- Keputusan: `referensi/keputusan-penyesuaian-backend.md` (Penyesuaian backend `ridho` `7d28135`, RG1a
  sampai RG8a).

## Catatan dari penyesuaian backend `ridho` `2dd57aa`

Dikerjakan pada 11 Oktober 2026 dalam enam commit. `origin/yoga` maju 42
commit di atas `ridho` `8dc6211` dan sudah memuat `origin/nizar` `b0a77d4`
(dua commit), sehingga `ridho` di-fast-forward ke `2dd57aa` dan di-push
pada hari yang sama.

| Commit | Isi |
|---|---|
| `936f073` | Dua `test.fixme` jurnal stok dilepas (butir 46) |
| `26093b0` | Buat pembayaran mengirim kunci idempotensi (RH1a) |
| `a8aec53` | Pengajuan uji disetujui Owner sendiri; penyetuju uji dicabut (RH5a) |
| `f61e146` | Gate stock adjustment menerima izin per ruang (RH3a) |
| `ed4bfd3` | Relasi ke pajak nonaktif tampil bertanda (RH4a) |
| `43f09af` | Hapus bahan yang baru dibuat menjadi `test.fixme` (butir 143) |

- Gabungan Yoga `1d3f2d7` (`nizar` ke `yoga`) diperiksa kelengkapannya:
  satu-satunya berkas yang diubah kedua sisi adalah
  `docs/pengembangan/klien.md` backend, dan seluruh baris tambahan kedua
  sisi ada di hasilnya.
- Permission diselaraskan menurut `inti/backend.md`: seed sinkron menambah
  enam izin (141 di seed: empat izin pembelian stok dan dua izin stock
  adjustment per ruang), dan seed Owner memberi 138 izin ke dua role
  Owner. Indeks pelanggan dan posisi diselaraskan lewat
  `npm run db:indeks`.
- Cache izin tidak dapat dipastikan bersih: Redis lokal tanpa sandi
  kosong, sedangkan `.env` backend memuat `REDIS_URL`.
- Audit endpoint tidak berubah: 243 route dan 142 panggilan frontend
  unik, tanpa panggilan ke route yang tidak ada.
- Terbukti dari web: butir 46, 76, dan 93 lewat e2e, dan butir 142 lewat
  permintaan nyata. Dicocokkan dari kode: butir 12, 16, 38, 40, 44, 59,
  60, 80, dan 95 (`kontrak/temuan.md`).
- Filter `?locationID=` daftar penjualan tidak dipakai: sekitar 980 dari
  1.620 penjualan development tanpa `locationID` (butir 144, RH2b).
- Suite penuh kedua gagal di hapus bahan baku: bahan yang baru dibuat
  ditolak 409 karena entri stok otomatisnya (butir 143). Aturan pemilik
  proyek berbeda dari perilaku itu, sehingga skenarionya menjadi
  `test.fixme`, dan kode halaman tidak diubah.
- Skenario hapus itu lolos di suite pagi walau bahannya tidak terhapus;
  sebabnya tidak terbukti (`inti/pengujian.md`, Utang pengujian).
- Usulan untuk pengeluaran, diteruskan ke Yoga dan belum diputuskan:
  beban yang salah dicatat dibatalkan lewat VOID beralasan dengan baris
  mutasi pembalik, bukan dihapus atau diubah jumlahnya.
- Vitest 634 lolos di 77 berkas. Suite e2e penuh: 450 lolos, 1 gagal,
  dan 13 skipped; harapan setelah `43f09af` 451 lolos dan 14 skipped
  (`inti/pengujian.md`).
- Temuan backend baru: butir 143 sampai 145 (`arsip/laporan-backend.md`).
- Keputusan: `referensi/keputusan-penyesuaian-backend.md` (Penyesuaian backend `ridho` `2dd57aa`, RH1a
  sampai RH6a).

## Catatan dari penyesuaian backend `yoga` `55328f1`

Dikerjakan pada 8 Oktober 2026 dalam dua commit, setelah penyesuaian
`nizar` `8dc6211`. Kode Yoga sudah termuat di `ridho` sejak `92d4f27`;
yang dikerjakan adalah tiga perubahannya yang belum dimanfaatkan web.

| Commit | Isi |
|---|---|
| `50e6485` | Ubah pajak hanya mengirim field yang berubah, tanpa `tipePajak` wajib (NZ12a) |
| `f64b518` | Pak dan unit sebagai satuan resep (NZ13a) |

- B36 (Yoga): `GET /kategoribeban` dan `GET /bebanoperasional` dijawab
  200 bagi Owner, dan kedelapan izin beban ada di daftar permission
  (`kontrak/temuan.md` butir 130 tertutup). Service beban belum berubah:
  saldo masih diubah tanpa buku mutasi, tanpa transaksi, dan tanpa
  status VOID (butir 131 sampai 134, dari kode), sehingga pengeluaran
  tetap ditunda (NZ11a).
- B37 (Yoga): terbukti lewat e2e. Langkah ubah nama di spec kelola pajak
  mengirim tepat `{ namaPajak }` dan dijawab 200 (butir 91 tertutup).
- B38 (Yoga): terbukti lewat e2e. Produk beresep bahan bersatuan pak
  tersimpan 201 (butir 15 tertutup).
- Satu test unit di berkas lain, test payload produk, menegaskan pak
  ditolak skema dan gagal setelah perubahan; contohnya diganti satuan
  yang memang tidak dikenal.
- `ridho` `8dc6211` sudah di-push pemilik proyek.
- Vitest 631 lolos di 77 berkas. Suite e2e penuh: 448 lolos dan 15
  skipped, tanpa kegagalan (`inti/pengujian.md`).
- Tidak ada temuan backend baru.
- Keputusan: `referensi/keputusan-penyesuaian-backend.md` (Penyesuaian backend `yoga` `55328f1`, NZ11a
  sampai NZ13a).

## Catatan dari penyesuaian backend `nizar` `8dc6211`

Dikerjakan pada 8 Oktober 2026 dalam empat commit. `origin/nizar` maju
delapan commit di atas `ridho` `92d4f27` (pelanggan, membership, posisi,
dan sesi booking), sehingga `ridho` lokal cukup di-fast-forward: tidak
ada sisi kedua yang perlu diperiksa kelengkapannya. `origin/yoga` tidak
maju.

| Commit | Isi |
|---|---|
| `4539c85` | Buat penjualan dan buat reservasi menuntut `read-pelanggan` (GR7a) |
| `fe9631f` | Pemilih pelanggan menampilkan dan mencari nomor HP (NZ8a) |
| `1bb26c0` | `test.fixme` pengosongan nomor HP dilepas, dan peringatan sementara dibuang (NZ10a) |
| `5b92d14` | Skenario penolakan kembar berpindah dari nama (400) ke nomor HP (409) |

- Permission diselaraskan menurut `inti/backend.md`: seed sinkron menambah
  empat izin posisi (135 di seed), dan seed Owner memberi 132 izin ke dua
  role Owner. Tidak ada nama yang dikeluarkan dari seed.
- Audit endpoint tidak berubah: 243 route dan 142 panggilan frontend
  unik, tanpa panggilan ke route yang tidak ada.
- `GET /pelanggan` kini memeriksa `read-pelanggan`. Halaman pelanggan
  sudah bergate izin itu sejak Fase 2; gerbang buat penjualan dan buat
  reservasi disusulkan (`kontrak/izin-halaman.md`).
- Terbukti lewat permintaan nyata: butir 104 dan 105 tertutup, nomor HP
  kembar dijawab 409 (butir 106), `?penjualanID=` diterima (butir 140),
  dan query tidak dikenal ditolak 400 di daftar pelanggan dan booking.
  Status Batal yang dibaca VOID (butir 141) dan email kembar 409 dibaca
  dari kode.
- Nama kembar masih ditolak 409 di basis data development, karena indeks
  unik lama tidak ikut terhapus saat dibuang dari skema; indeks nomor HP
  dan email di basis data juga belum memuat filter `isDeleted`
  (`kontrak/temuan.md` butir 142). Basis datanya dibiarkan sebagai
  bukti.
- Filter `?penjualanID=` berasal dari permintaan web sendiri (butir 140)
  dan tidak dipakai: detail penjualan tetap memuat booking per id (NZ9a).
- Helper `ganti-blok.js` diperbaiki: beberapa pasangan di bawah satu
  baris berkas kini diterapkan (`f573eeb`, `referensi/helper-dan-shell.md`).
- Cabang uji lokal `uji-yoga-nizar` di backend dihapus; kedua induknya
  termuat di `ridho`.
- Vitest 629 lolos di 77 berkas. Suite e2e penuh: 447 lolos dan 15
  skipped, tanpa kegagalan (`inti/pengujian.md`).
- Temuan backend baru: butir 142 (`arsip/laporan-backend.md`).
- Keputusan: `referensi/keputusan-penyesuaian-backend.md` (Penyesuaian backend `nizar` `8dc6211`, NZ8a
  sampai NZ10a).

## Catatan dari penyesuaian backend `nizar`

Dikerjakan pada 7 Oktober 2026 dalam enam commit. Saat dimulai,
`origin/yoga` berada di `fc29433`, dan `origin/nizar` maju tiga commit ke
`9d45efc` dari titik cabang `3edbdea`, sehingga tidak memuat `fc29433`.
Acuan ujinya gabungan lokal keduanya, cabang `uji-yoga-nizar` `54f787b`,
yang tidak di-push. Pada malam yang sama `origin/yoga` maju tujuh commit
ke `55328f1` (izin kategori beban, `tipePajak` hanya wajib saat membuat,
dan satuan resep mengikuti bahan). Malam itu juga ketiga cabang
disatukan di `ridho` `92d4f27` dan di-push; suite penuh terhadapnya, 8
Oktober 2026, menghasilkan 444 lolos dan 16 skipped, sehingga ketujuh
commit itu tidak menggeser spec mana pun (`inti/backend.md` bagian Pemilik
modul backend).

| Commit | Isi |
|---|---|
| `9b25433` | Status Tidak Datang dan field check-in dibuang dari tipe, label timeline, dan test |
| `3b4f35b` | Metode aktif terakhir ditahan (NZ4a), dan Tambah tetap hidup saat batas 10 tercapai (NZ5a) |
| `a80d2fa` | Tambah diskon tetap hidup saat batas 50 tercapai, dengan form terkunci Non-Aktif (NZ5a) |
| `d23844a` | Ringkasan mutasi gabungan (NZ1a), kolom Pencatat, dan tautan penjualan (NZ2a) |
| `8072214` | Filter periode dan Reset Filter di riwayat Pindah Dana (NZ3a) |
| `729c16a` | Tandai Selesai untuk booking lunas di detail penjualan (NZ7a) |

- Permission diselaraskan menurut `inti/backend.md`: seed sinkron menambah
  delapan izin membership (127 di seed), dan seed Owner memberi 124 izin
  ke tiga role Owner. Tidak ada nama yang dikeluarkan dari seed.
- Audit endpoint: 243 route dan 142 panggilan frontend unik, tanpa
  panggilan ke route yang tidak ada. `POST /sesibooking/:id/checkin`
  hilang, dan `GET /akunkas/ringkasan` bertambah.
- Tidak ada `test.fixme` yang dapat dilepas: berkas penentu butir 8, 22,
  46, 70, dan 104 serta validator ubah pola roster tidak diubah `nizar`,
  dan seed tidak memuat izin lintas outlet (butir 39).
- Terbukti lewat permintaan nyata: butir 86, 87, 123, 124, 125, 126, dan
  129, bentuk galat validator (butir 42 dan 128), dan bentuk sesi
  booking. Butir 85, 107, dan 127 dibaca dari diff. Butir 77 dan 109
  hanya menurut pesan commit (`kontrak/temuan.md`).
- `POST /metodepembayaran` tanpa `kategori` dijawab 400, sehingga
  kontraknya dikoreksi; `jamBuka` dan `jamTutup` tipe aset, yang ada
  sejak `465b438`, baru tercatat (`kontrak/payload.md`,
  `kontrak/endpoint.md`).
- Booking milik sebuah penjualan dikenali dari
  `itemPenjualan[].sesiBookingID` dan dimuat per id, karena daftar
  booking tidak dapat disaring per penjualan (butir 140).
- Vitest 627 lolos di 76 berkas. Suite e2e penuh: 440 lolos, 4 gagal,
  dan 16 skipped; jumlah skenarionya sesuai hitungan harapan (444 dan
  16).
- Keempat kegagalan bukan dari kode hari itu: `POST /pengajuanstok`
  dijawab 409 nomor kembar, karena pembentuk nomor backend mengurutkan
  menurut `createdAt` dan tiga pengajuan development ber-`createdAt` di
  depan jam sistem (butir 139). Setelah `createdAt` ketiganya digeser,
  ketiga folder spec terkait lolos 17 dan 2 skipped (`inti/pengujian.md`).
  Pemicu waktu di depan itu tidak terbukti.
- Push commit `8072214` dua kali ditolak GitHub dengan galat server, dan
  masuk bersama `729c16a`.
- Temuan backend baru: butir 139 sampai 141 (`arsip/laporan-backend.md`).
- Keputusan: `referensi/keputusan-penyesuaian-backend.md` (Penyesuaian backend `nizar`, NZ1a sampai
  NZ7a).

## Catatan dari penyesuaian backend `fc29433`

Dikerjakan pada 4 dan 5 Oktober 2026. `origin/yoga` maju lima commit dari
`50eede7` ke `fc29433` (keputusan backend R16 dan P15), dan atas
keputusan pemilik proyek penyesuaian ini didahulukan dari
`useAuthGuard()` berulang.

| Commit | Isi |
|---|---|
| `a17d584` | `test.fixme` butir 37 dilepas: finalisasi produk beresep tidak lagi memakai `produk.stok` |
| `d3443e2` | Halaman pajak mengikuti izin: `features/pajak/izin.ts`, gerbang halaman, tombol, tab pajak produk, dan kartu indeks pengaturan |
| `1ec905d` | Keempat izin pajak di template Manajer dan General Manajer |
| `b887278` | Satuan resep mengikuti `availableUnits` bahan terpilih |

- Backend lokal dipindah ke `fc29433` dengan fast-forward. Permission
  diselaraskan menurut `inti/backend.md`: seed sinkron menambah delapan izin
  (119 di basis data dan 119 di seed), seed Owner memberi 116 izin ke
  tiga role Owner, dan cache izin dibersihkan.
- Audit endpoint tidak berubah: 243 route backend dan 139 panggilan
  frontend unik, tanpa panggilan ke route yang tidak ada.
- Dibuktikan lewat permintaan nyata sebagai Owner: `GET /pajak` 200,
  `GET /bebanoperasional` 200, `GET /kategoribeban` masih 403, dan
  `PUT /pajak/:id` tanpa `tipePajak` masih 400.
- Yang tertutup di backend: butir 37, 89, dan 90, serta butir 5 untuk
  pajak dan butir 130 untuk beban operasional. Yang masih terbuka: butir
  91, butir 130 untuk kategori beban, dan butir 15, yang kini berakibat
  nyata (bahan bersatuan pak atau unit tidak dapat dipakai di resep).
- Pekerjaan pengeluaran tetap ditunda (keputusan BO1a): beban tidak dapat
  dicatat tanpa kategori, dan kategori beban masih 403.
- Dugaan yang keliru: skenario gerbang `produk.stok` diperkirakan gagal
  terhadap backend baru, padahal skenario penolakan yang aktif menguji
  gerbang stok bahan dan tetap benar; skenario `produk.stok` adalah
  `test.fixme` itu sendiri.
- Suite penuh 4 Oktober 2026: 431 lolos, 1 gagal, dan 16 skipped, sesuai
  hitungan harapan. Yang gagal login di `beforeEach` spec tipe aset,
  tidak terkait perubahan; spec itu lolos 25 saat dijalankan terpisah
  (`inti/pengujian.md`, Utang pengujian).
- Laporan untuk tim backend disusun 5 Oktober 2026: kategori beban,
  `tipePajak`, dan satuan pak serta unit.
- Keputusan: `referensi/keputusan-penyesuaian-backend.md` (Penyesuaian backend `fc29433`).

## Catatan dari utang kecil yang tidak menunggu backend

Dikerjakan pada 4 Oktober 2026 dalam tiga commit, terhadap backend `yoga`
`50eede7`. Suite e2e penuh dijalankan sekali di akhir (keputusan PF6a):
430 lolos dan 17 skipped, tanpa kegagalan.

| Commit | Isi |
|---|---|
| `6b5e1cc` | Tiga belas impor dan dua variabel tidak terpakai, ternary di `toggleExpand`, dan tiga tipe tanpa pemakai di `types/auth.ts` |
| `eb0181f` | Penjaga ruang di detail stock opname, nama PIC lewat `usePenggunaSaya`, `nama` dibuang dari `PenggunaSesi`, dan kerangka memuat tabel stok outlet |
| `9195472` | Spec tipe aset memakai helper bersama `tests/helpers/reservasi-uji.ts` |

- Warning ESLint turun dari 20 menjadi 2. Yang tersisa dua
  `react-hooks/incompatible-library` (`components/ui/data-table.tsx` dan
  `features/stock-opname/form-buat-stock-opname.tsx`), yang dibiarkan: itu
  keterangan React Compiler tentang pustaka, bukan cacat kode.
- Variabel `isLoadingLokasi` yang tidak terpakai ternyata menandai bug:
  selama lokasi aktif dimuat, query stok belum berjalan dan tidak
  melaporkan memuat, sehingga tabel stok outlet sempat menampilkan "Tidak
  ada data stok yang ditemukan." Kerangka memuat kini mengikuti keduanya.
- Detail stock opname menolak dokumen yang tipe lokasinya bukan milik
  ruang itu, dengan pola yang sama dengan detail stock adjustment. Ini
  penjaga tampilan, bukan pengaman akses.
- PIC di form buat stock opname menampilkan nama pengguna dari server.
  Sebelumnya selalu teks cadangan, karena token tidak membawa nama.
- Keempat skenario e2e baru dijalankan lebih dulu terhadap kode lama dan
  gagal keempatnya, lalu lolos setelah perbaikan.
- Helper lokal spec tipe aset dibandingkan baris demi baris dengan helper
  bersama sebelum diganti; jumlah test spec tetap 25.
- Tidak ada temuan backend baru, dan kontrak tidak berubah.
- Keputusan: `modul/inventaris.md` (Submodul stok dan inventaris gudang, dan
  Submodul stock opname).

## Catatan dari error ESLint warisan

Dikerjakan pada 4 Oktober 2026 dalam tiga commit, terhadap backend `yoga`
`50eede7`. Suite e2e penuh dijalankan sekali di akhir (keputusan PF6a):
426 lolos dan 17 skipped, tanpa kegagalan.

| Commit | Isi |
|---|---|
| `4f19e77` | Enam belas error tanpa perubahan perilaku: empat belas `no-explicit-any` dan dua `react/no-unescaped-entities`; `storage.ts` di helper uji dihapus (EL1a) |
| `039ead4` | `useSudahHidrasi` menggantikan `setState` di effect di kedua halaman role dan topbar, serta dua salinan lama di reservasi (EL4a) |
| `f5fe574` | Form role dipasang setelah detail termuat, dan effect pengisinya dibuang (EL2a) |

- ESLint atas `app`, `components`, `features`, `hooks`, `lib`, dan
  `tests` kini tanpa error. Hitungan 20 per `57a7084` terbukti masih sama
  saat diukur ulang sebelum pekerjaan dimulai, dan pemakaian `any` di
  metrik menjadi 0.
- `decodeJWT` mengembalikan `Record<string, unknown>`, dan
  `lib/auth/session.ts` tidak berubah, karena setiap field payload sudah
  dibaca lewat `String`, `Array.isArray`, atau perbandingan. Satu beda
  perilaku: `exp` token yang bukan angka kini dianggap kedaluwarsa.
- Deteksi hidrasi kini satu hook, `hooks/use-sudah-hidrasi.ts`, dengan
  lima pemakai. Halaman role yang dibuka lewat navigasi di dalam aplikasi
  langsung tampil tanpa satu render kosong lebih dulu, dan tanggal di
  topbar dihitung di setiap render.
- Form role dipecah menjadi `FormRole` (memuat detail) dan `IsiFormRole`
  (form), dengan nilai awal dari `nilaiAwalRole` (`referensi/arsitektur.md`). Detail
  yang gagal dimuat tampil sebagai pesan di tempat beserta tautan
  kembali, menggantikan toast dan form kosong; jalurnya teruji e2e lewat
  id yang tidak ada, tanpa respons tiruan.
- Isian form role tetap memakai `useState` (Utang kecil dari modul
  Pengaturan outlet).
- Tidak ada temuan backend baru, dan kontrak tidak berubah.
- Keputusan pemilik proyek: `arsip/keputusan-lama.md` (Error ESLint warisan, EL1a
  sampai EL4a).

## Catatan dari penundaan pengeluaran dan pemeriksaan ulang utang

Dikerjakan pada 4 Oktober 2026 dalam tiga commit, terhadap backend `yoga`
`50eede7`. Suite e2e penuh tidak dijalankan (keputusan PF6a): setiap
commit melewati `tsc`, ESLint, vitest penuh, dan spec yang terdampak.

| Commit | Isi |
|---|---|
| `7fce871` | Halaman pengeluaran menampilkan keterangan belum tersedia (BO2a) |
| `03c4eb3` | Daftar surat jalan memakai penyaringan server: `keLocationID`, dan status tidak lagi disaring klien (TS1a) |
| `f7805ca` | Alur e2e menutup akun kas bersaldo beserta buku mutasi transfernya, dan helper akun kas uji bersama (UK1a sampai UK3a) |

- Halaman pengeluaran tidak dapat dibangun terhadap `50eede7`:
  `GET /bebanoperasional` dan `GET /kategoribeban` menjawab 403 bagi
  Owner, karena izin `kelola-beban-operasional` dan
  `kelola-kategori-beban` tidak ada di seed, dan controller membandingkan
  nama izin dari sesi dengan `_id` dokumen permission
  (`kontrak/temuan.md` butir 130). Pekerjaannya ditunda (BO1a).
- Kontrak beban diperkirakan berubah: beban belum menulis buku mutasi
  (butir 131), dan laporan laba rugi sudah menyaring status VOID yang
  belum ada di model beban (butir 132). Temuan backend baru: butir 130
  sampai 138, disusun 4 Oktober 2026 (`arsip/laporan-backend.md`).
- Tidak ada cabang backend yang lebih depan dari `50eede7`: `origin/yoga`,
  `origin/nizar`, `origin/ridho`, dan `origin/main` diperiksa. Utang yang
  menunggu backend dibaca ulang dari kode commit itu: butir 8, 22, 39,
  46, 70, dan 76 serta validator ubah pola roster masih tertahan.
- Butir 33 terbukti diperbaiki lewat permintaan nyata, sehingga
  `filterServerTransfer` mengirim `keLocationID` dan `saringTransfer`
  tidak lagi menyaring status (`referensi/arsitektur.md`). Butir 58 terbukti dari
  kode: service daftar sesi booking tidak lagi menulis saat dibaca.
- Pemeriksaan booking saat aset dihapus (butir 52) tetap belum
  dibuktikan.
- Kedua utang kecil keuangan ditutup tanpa mengubah kode halaman
  (`f7805ca`): akun uji diisi Rp1 lewat Pindah Dana, penonaktifannya
  ditolak 409 karena saldo, saldonya dipindah keluar, lalu akun
  dinonaktifkan; buku mutasinya menampilkan transfer masuk, pembatalan
  transfer masuk, dan transfer keluar dengan label dan jumlah yang sesuai
  respons (`referensi/playwright.md`, Spec rujukan).
- Helper akun kas uji yang kembar di dua spec dipindah ke
  `tests/helpers/akun-kas-uji.ts` (UK1a).
- Suite e2e penuh belum dijalankan untuk ketiga commit, atas keputusan
  pemilik proyek; harapannya 424 lolos dan 17 skipped (`inti/pengujian.md`).
- Keputusan pemilik proyek: `modul/keuangan.md` (Modul keuangan, BO1a, BO2a,
  dan UK1a sampai UK3a; Submodul transfer, pengiriman, dan penerimaan,
  TS1a).

## Catatan dari penyesuaian backend `yoga`

Backend lokal berpindah ke `origin/yoga` `50eede7` pada 1 Oktober 2026
(keputusan PY1a), sembilan commit di depan `465b438`. Route dan seed tidak
berubah: audit endpoint sama dengan sebelumnya, dan permission basis data
tetap sama dengan seed. Suite pertama terhadap `yoga` menghasilkan 332
lolos dan 15 gagal: empat belas test penjualan berhenti di fixture stok,
dan satu kejadian butir 77.

| Commit | Isi |
|---|---|
| `65edf8c` | Fixture stok penjualan mengikuti `produk.stok` dari inventory outlet (PY4a) |
| `a4304ce` | `alasanVoid` untuk pembayaran dan penjualan (PY5a), urutan server daftar penjualan (PY6a), dan `locationID` produk (PY7a) |

- Butir 11, 75, dan 83 terbukti diperbaiki backend lewat e2e. Butir 37
  tertutup sebagian: `produk.stok` bersumber dari outlet, tetapi tetap
  potret dan tetap memblokir finalisasi, sehingga `test.fixme`-nya
  dipertahankan.
- Dampak dibaca dari diff kode `465b438..yoga` per modul, bukan dari judul
  commit (`referensi/disiplin-perubahan.md`).
- Kontrak produk, penjualan, pembayaran, dan sesi booking dikoreksi
  terhadap `yoga` (`kontrak/README.md`). Laporan untuk tim backend ada di
  `arsip/laporan-backend.md` (laporan penyesuaian `yoga`).

## Catatan dari penyesuaian backend `465b438`

Backend di-fast-forward ke branch `nizar` `465b438` pada 30 September
2026, sebelumnya `ridho` `00b9957`. Suite pertama terhadap backend itu
menghasilkan 306 lolos, 8 gagal, dan 24 skipped; penyesuaiannya selesai
dalam delapan commit, dengan keputusan PB1a sampai PB14a
(`referensi/keputusan-penyesuaian-backend.md`).

| Commit | Isi |
|---|---|
| `b85c2bd` | Penyesuaian keuangan, penjualan, pembayaran, reservasi, dan transfer stok (52 berkas) |
| `a10af75`, `e4bfc86`, `8134842`, `31ebd92` | `test.fixme` yang terbukti diperbaiki backend dilepas: hapus pengguna, timeline setelah void booking (R3a), hapus tarif, dan pelepasan tarif dari tipe aset |
| `6e314ae` | Terima surat jalan dengan `itemId` dan jumlah 0 sebagai barang tidak sampai, diuji sungguhan lewat UI |
| `b5a55c4` | Pembersihan data uji diperiksa; akun kas uji bersaldo 0 lalu dinonaktifkan |
| `b63cf08` | Footer `DataTable` memakai paginasi server, dengan pilihan jumlah baris |

- Kontrak dikoreksi terhadap `465b438` untuk penjualan, pembayaran,
  laporan, sesi booking, tipe aset, transfer stok, dan buat akun kas
  (`kontrak/payload.md`, `kontrak/endpoint.md`). Metode pembayaran
  dikoreksi 1 Oktober 2026 (`3359497`), begitu pula pajak (`e0aaeca`);
  pelanggan dikoreksi 2 Oktober 2026 (`d9365d3`), begitu pula diskon
  (`1e05df6`).
- Audit endpoint mencatat backend kini memiliki 243 route: tujuh route
  Lampiran A hilang, termasuk `DELETE /akunkas/:id`, `DELETE /diskon/:id`,
  dan `DELETE /metodepembayaran/:id`, dan empat route baru belum dipakai
  web, yaitu mutasi dan ringkasan akun kas serta check-in sesi booking.
  Lampiran A tidak diubah sampai pembangkitan ulang (`kontrak/README.md`).
  Check-in dibuang backend `nizar` `60575b5` tanpa pernah dipakai web.
- Status penjualan kini DRAFT, UNPAID, PARTIAL, PAID, dan VOID. Booking
  tersimpan UNPAID dan dapat di-void selama belum dibayar, sehingga web
  punya jalur batal booking lewat void penjualan (PB2a).
- Temuan untuk tim backend: `kontrak/temuan.md` butir 75 sampai 83.
  Butir 29, 30, 41, 43, dan 53 sampai 57 terbukti diperbaiki, butir 52
  sebagian, dan butir 33 serta 58 dilaporkan diperbaiki tetapi belum
  dibuktikan dari web saat itu; butir 33 terbukti lewat permintaan nyata
  dan butir 58 dari kode pada 4 Oktober 2026 (`03c4eb3`).
- `test.fixme` yang masih gagal terhadap `465b438`: jurnal Keluar yang
  langsung terbaca (butir 46), stok produk tingkat tenant (butir 37), dan
  ubah pola roster (validator model).
- Lima akun kas uji bersaldo yang tertinggal dihapus langsung dari basis
  data development beserta mutasi saldo awalnya (PB13a); setiap run kini
  meninggalkan satu akun kas uji non-aktif bersaldo 0.
