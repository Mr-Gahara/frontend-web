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

## Catatan dari perapian utang status 6 November 2026

Dipindah dari `inti/status.md` (utang kecil) atas permintaan pemilik
proyek. Setiap butir sudah selesai, tercatat di tempat lain, atau
kembar dengan butir yang tetap terbuka; butir yang selesai sebagian
diganti sisanya di `inti/status.md`. Butir terbuka yang meragukan
dicek ulang terhadap kode web dan backend `ridho` `c031bde`.

- Calon temuan untuk Ridho (tenant): `POST /tenant` memasang cookie refresh
  akun bernama `refreshToken` di path `/`, sedangkan login akun memasangnya
  di `/api/akun/auth` dan cookie refresh pengguna juga `refreshToken` di
  `/`. `register-owner` sesudahnya menimpa cookie itu. Pemulihan sesi tetap
  berjalan karena cookie login akun di path yang lebih khusus tetap
  berlaku (`POST /tenant` tidak memutar `tokenVersion`); terbukti lewat
  muat ulang di spec setup (`41194b7`). Belum dilaporkan. Dicatat
  sebagai `kontrak/temuan.md` butir 168 (6 November 2026).
  Tercatat sebagai `kontrak/temuan.md` butir 168; pelaporannya ikut
  butir laporan untuk tim backend.
- Riwayat admin tanpa label `ubah-plan` (butir 1 di atas). Selesai di
  `475bf0b`: tipe `AksiLangganan` ganda di `types/adminAkun.ts` dibuang.
- `db:data-bawaan` mencocokkan nama persis, jadi Toko3 yang sudah punya
  metode tunai "CASH" dan kas fisik "kas kasir" mendapat metode "Tunai"
  dan akun kas "Kas Kecil (Laci)" baru (dihitung baca-saja 4 November
  2026: tiga metode berkategori tunai, tiga kas fisik aktif). Calon temuan
  untuk Nizar (N6): skrip menggandakan metode tunai toko lama yang
  namanya lain. Dicatat sebagai `kontrak/temuan.md` butir 169
  (6 November 2026).
  Tercatat sebagai `kontrak/temuan.md` butir 169.
- Calon temuan kontrak untuk Nizar: `GET /akun/langganan` tidak memuat
  penanda masa percobaan maupun awal masa berlaku, sehingga web
  menyimpulkannya dari riwayat berhalaman (`ringkasLangganan`). Dicatat
  sebagai `kontrak/temuan.md` butir 170 (6 November 2026).
  Tercatat sebagai `kontrak/temuan.md` butir 170.
- `PUT /akun/admin/users/:id/plan` dan plan di buat akun, perpanjang,
  serta riwayat admin dicatat di `kontrak/endpoint.md` (5 November 2026).
- Enam endpoint baru belum dicatat di `kontrak/endpoint.md`:
  verifikasi email dan kirim ulangnya, lupa password, reset password,
  langganan, dan riwayat langganan. Dicatat pada 5 November 2026.
- Laporan penyesuaian ini ditulis ke dokumentasi backend di `128d0de`
  (`arsip/laporan-backend.md`); butir 165 kini utang Yoga, karena Ridho
  sementara tidak memegang backend.
  Butir 165 milik Yoga tetap terbuka di utang `0024eb9`.
- Laporan 28 Oktober 2026 belum tercatat di `arsip/laporan-backend.md`.
  Dicatat pada 31 Oktober 2026.
- Catatan untuk tim backend dari modul pembelian dan audit pergantian
  hari (`kontrak/temuan.md` butir 154 sampai 162 dan 164) diserahkan ke
  Yoga pada 26 Oktober 2026 dan dicatat di `arsip/laporan-backend.md`.
- Sisi frontend: tab Keuangan tampil tanpa izin (butir 163), filter
  periode bawaan tidak bergeser saat hari berganti, dan saldo akun kas
  yang belum terpotong pembelian (`modul/inventaris.md`, Utang kecil
  dari pembelian stok). Tab Keuangan disaring menurut izin halamannya
  sejak `e051906` (butir 163 selesai).
  Filter periode bawaan yang tidak bergeser disengaja (keputusan
  rancangan butir 28). Saldo akun kas yang belum terpotong pembelian
  tetap terbuka sebagai butir sendiri.
- Halaman revisi surat jalan tidak memeriksa ruang pengirim: tombolnya
  tersembunyi di ruang lawan (AR11a), tetapi URL-nya dapat dibuka
  langsung. Selesai di `5ba2a42`: halaman revisi menolak ruang yang
  bukan pengirim.
- Stock opname, stock adjustment, surat jalan, dan pengajuan stok tetap
  mode klien, karena backend belum punya pencarian teks
  (`kontrak/temuan.md` butir 150). Paginasi B104 sampai B106 dipakai
  bersama pencarian begitu tersedia (keputusan rancangan butir 27).
  Pengajuan stok juga menunggu filter tab gabungan (butir 152).
  Selesai di `98054b8` sampai `c2a1e73` (B108, keputusan rancangan butir
  27), dan tab gabungan pengajuan disaring server di `ebf782b` (butir
  152 selesai).
- Kotak cari nama bahan jurnal stok disembunyikan sampai backend
  menerima query pencarian (butir 150), lalu dikembalikan.
  Dikembalikan bersama B108 (keputusan rancangan butir 27).
- Lingkup per tipe lokasi dikirim sebagai satu `locationID` (MVP);
  multi-lokasi menunggu filter tipe lokasi (butir 151).
  Sama dengan butir jurnal stok di utang `0024eb9` (butir 151), yang
  tetap terbuka di sana.
- Pengajuan Outlet ke Gudang (P8 backend) belum tampil di web; alurnya
  dikerjakan terpisah dengan pratinjau (`modul/inventaris.md`). Sampai
  itu kartu pengajuan dashboard gudang dapat melebihi isi tab bila ada
  pengembalian dari outlet.
  Selesai di `621e753` sampai `a505783`. Yang tersisa: kartu siap surat
  jalan menghitung pengembalian yang menunggu surat jalan outlet,
  sedangkan tab gudang tidak (AR6a; utang kecil pengembalian, di atas).
  Sisanya (AR6a) tetap terbuka di utang pengembalian Outlet ke Gudang.
- `lokasiJurnalOutlet` dipindah ke `features/inventaris/cakupan.ts` bila
  daftar lain ikut pindah ke server (keputusan rancangan butir 12).
  Selesai di `21abcd8` sebagai `lokasiSatuOutlet`, dipakai jurnal stok
  dan pembelian stok.
- Belum dibuktikan dari web: penyaringan beban VOID di laporan laba rugi
  (butir 132), cache daftar beban saat kategori berubah (butir 135),
  penolakan beban saat saldo kurang atau akun nonaktif (butir 133), serta
  bentuk `tanggal`, batas `keterangan`, dan pembatas laju beban (butir
  137).
  Dicocokkan dari kode (butir berikut); jalur e2e penolakan beban
  tercatat di `referensi/utang-pengujian.md`.
- Empat penjualan milik toko yang belum punya lokasi tetap tanpa
  `locationID`, sesuai rancangan backend. Tenant uji tidak terdampak:
  total dengan filter outletnya sama dengan total tenant (18 Oktober
  2026).
  Catatan keadaan data tanpa tindakan lanjutan.
- Butir 132, 133, dan 135 dicocokkan dari kode `00de455` pada 18 Oktober
  2026 (Catatan dari halaman pengeluaran). Yang tersisa dari butir 137:
  batas tanggal masa depan, panjang keterangan, dan pembatas laju.
  Ketiganya diperbaiki di `yoga` `186fa19` (B100) dan dibuktikan dari kode
  `ridho` `af5f315` pada 19 Oktober 2026 (`kontrak/temuan.md` butir 137).
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
  Bagian modul pembelian stok selesai; cache produk saat pajak berubah
  tetap terbuka sebagai butir sendiri.
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
  Riwayat posisi backend kini di `inti/backend.md` (Pemilik modul
  backend); per 6 November 2026 `ridho` di `c031bde`.
- Indeks pelanggan di basis data development belum sesuai skema
  (`kontrak/temuan.md` butir 142); dibiarkan sebagai bukti sampai backend
  menyediakan migrasi indeks.
  Diselaraskan lewat `npm run db:indeks` pada 11 Oktober 2026 (butir 142
  tertutup).
- Penyesuaian terhadap `yoga` `55328f1` selesai di `50e6485` dan
  `f64b518`. Yang tersisa: pengeluaran tetap ditunda sampai
  `kontrak/temuan.md` butir 131 sampai 134 diperbaiki backend (NZ11a).
  Butir itu diperbaiki di `7d28135` dan terbukti lewat permintaan nyata;
  pengeluaran tetap ditunda sampai dijadwalkan pemilik proyek (RG6a).
  Dijadwalkan sebagai pekerjaan berikutnya pada 18 Oktober 2026.
  Selesai di `1d7fa7b` (BO3a sampai BO7a).
- Izin beban operasional belum masuk template role (keputusan FC2a);
  ditambahkan bersama halaman pengeluaran.
  Ditambahkan di `61275ac`.
- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
  Selesai di `d6f8ba0` (B98): penanganan sementaranya dihapus, bukan
  dibalik, dan skenarionya menjadi langkah sungguhan.
- `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700
  baris (714) sejak penjaga ruang ditambahkan di `eb0181f`, lalu 712
  baris setelah pemanggilan guard dibuang (`628f52e`), dan 702 per
  `5b8cbd9`. Pisahkan dialog
  aksi dan tabel hitungan saat halaman itu disentuh lagi.
  Dialog aksi dipisah ke `features/stock-opname/dialog-aksi-opname.tsx`
  di `a611b59` (612 baris); tabel hitungan tetap di halaman, karena
  memisahkannya menyeret state hitungan tanpa manfaat baru.
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
- Tombol urut kolom dibuang di stock adjustment dan stock opname, karena
  urutan klien hanya mengurutkan satu halaman; urutan mengikuti backend.
  Dicatat di keputusan rancangan butir 27.

## Catatan dari penyesuaian backend `4759208` sampai `c031bde`

Dipindah dari `inti/status.md` (Pekerjaan berikutnya) pada 6 November
2026 atas permintaan pemilik proyek, tanpa perubahan isi. Butir yang
belum selesai (halaman sesi kasir dan pemandu wizard) tetap di
`inti/status.md`.

Pada 4 November 2026 backend lokal di-fast-forward ke `nizar` `4759208`,
yang memuat `yoga` `a07c0b1` (`referensi/keputusan-penyesuaian-backend.md`,
Penyesuaian backend `ridho` lokal `4759208`). Kontrak yang ditunggu
halaman pratinjau tersedia: N1 (B212 sampai B214, B229), N2 (B216,
B224), N3 (B231 sampai B233), N4 (B217), N5 (B215), N6 (B218), Y1
(B220, B223), Y2 (B221), Y3 (B219), P48 (B222), dan sesi kasir (B225
sampai B228). Y4 (stok minimal produk) dan Y5 (penegakan WMS) belum.

Sudah selesai di sesi itu:

1. Daftar, verifikasi email, dan lupa password tersambung ke backend,
   login akun mengarahkan `requireSetup` ke `/setup` dan
   `EMAIL_BELUM_TERVERIFIKASI` ke isian kode, dan tautan "Lupa
   password?" terpasang (`67ec690`).
2. Halaman Langganan memakai data backend dan izin `read-langganan`
   (`c868870`).

Selesai 5 November 2026:

3. Plan di panel admin (B213): label riwayat `ubah-plan` dan perubahan
   plan di riwayat (`475bf0b`), lalu plan di buat akun, durasi 24 bulan,
   aksi Ubah Plan, plan opsional saat perpanjang, serta plan di daftar
   dan detail akun (`468a3bd`).
4. Pelanggan bawaan (B218): Hapus disembunyikan, dialog ubah hanya
   memuat nama, dan sel nama bertanda "Bawaan", karena tenant uji punya
   pelanggan lama biasa yang juga bernama "Customer" (`77d4380`).
5. Jenis mutasi `SELISIH_KAS_MASUK` dan `SELISIH_KAS_KELUAR` (B228) di
   buku mutasi dan filter jenis (`d696354`). Rujukan sesi kasir belum
   ditautkan sampai halaman sesi kasir ada (butir 6).
6. Wizard setup tersambung (B219 sampai B223, B237, B238, B240): status,
   guard, dan kembali dari login PIN (`3205982`); seluruh langkah
   menyimpan ke server dan dapat dilanjutkan setelah dimuat ulang tanpa
   PIN (`41194b7`); tautan Daftar di login akun (`4322dba`); pajak dapat
   ditambah dan ringkasan bertautan (`493f49c`). Keputusan WS1a sampai
   WS5a di `modul/setup-akun.md`.
7. Penyaringan per plan (B216, B224, B234): menu dan rute fitur di luar
   plan disembunyikan dengan ajakan naik plan, setup fitur yang belum
   selesai tampil sebagai ajakan Lengkapi setup, dan banner dashboard
   outlet (`8d0f1dd`). Keputusan PF1a sampai PF6a di
   `modul/setup-akun.md`. Suite penuh 554 lolos, 1 skipped, 2 gagal dari
   557; locator admin diperbaiki di `2d3344b`, dan waktu penjualan lolos
   12 dari 12 saat diulang.
8. Pekerjaan tanpa desain yang dipilih pemilik proyek: enam endpoint akun
   di kontrak (`273a6ff`); pengguna non-aktif yang login PIN kini mendapat
   pesan B202 di halaman login pengguna, bukan dikeluarkan dari akun toko
   (`9a85817`, bug apiClient yang terbukti spec baru); uji Owner kedua 409
   (B195, `eacb5ed`); dan stok minimal produk beserta badge serta tab Stok
   Kritis di daftar Produk (B237, `7d4c234`).

Selesai 6 November 2026, sebelum butir 6:

9. Backend ditarik ke `nizar` `4d221f5` (perbaikan audit backend 5
   November 2026 di bagian Nizar, serta B245 sampai B251), paket AR26
   untuk temuan audit A-06 dicatat di status Ridho backend, dan `ridho`
   di-push ke `c031bde` atas perintah pemilik proyek
   (`referensi/keputusan-penyesuaian-backend.md`, Penyesuaian backend
   `ridho` `c031bde`). Perpanjang bersamaan yang ditolak 409 memuat ulang
   akun di panel admin (B251, `a207fae`). Suite penuh 556 lolos, 3 gagal
   karena B248, dan 2 skipped dari 561 (`inti/pengujian.md`).
10. Utang pengujian tanpa UI baru yang dipilih pemilik proyek: tanggal
    topbar kini berganti sendiri setelah 00.00 (`c6f9ec0`, bug yang
    menyalahi keputusan rancangan butir 28), delapan butir utang yang
    lunas dipindah ke arsip (`0273d45` dan commit dokumen ini), harapan
    spec kirim dan terima disaring per arah (`bc49152`), dan nama
    pelanggan kembar diuji di daftar serta pemilih (`e0d3bb4`). Butir 6
    dan 7 dilewati dulu karena butuh UI baru (pemilik proyek, 6 November
    2026).

Tertunda dari penyesuaian itu, atas keputusan pemilik proyek 6 November
2026:

- **B248, verifikasi email wajib `password`**: ditunda karena keadaan
  tanpa password di memori butuh isian baru di halaman verifikasi (UI
  baru). Sampai dikerjakan, pendaftaran dan login akun yang belum
  terverifikasi di web tertahan, dan tiga skenario auth gagal di suite
  penuh (`kontrak/temuan.md` butir 171). Bagian tanpa UI, mengirim
  password titipan daftar atau login, dapat dikerjakan lebih dulu; bentuk
  isiannya diajukan lewat dialog sebelum ditulis.
  Bagian tanpa UI selesai di `efb05db`: password titipan dikirim, titipan
  bertahan saat kode salah, dan tanpa titipan halaman pindah ke login
  dengan pesan "Masuk lagi" tanpa mengirim kode (pilihan pemilik proyek).
  Pendaftaran web berjalan lagi. Yang tersisa isian password di halaman
  verifikasi untuk keadaan tanpa titipan, yang didesain sendiri oleh
  pemilik proyek.
- **Laporan untuk tim backend**: disusun sekali jalan setelah pekerjaan
  backend dari audit selesai. Temuan baru tetap dicatat di
  `kontrak/temuan.md` begitu terverifikasi.

Urutan berikutnya, semuanya sudah disetujui pemilik proyek pada 4
November 2026:

1. Selesai di `475bf0b` dan `468a3bd` (di atas).
   **Plan di panel admin (B213)**, didahului bug yang sudah terlihat:
   `LABEL_AKSI` di `features/admin-akun/langganan.ts` tidak punya
   `ubah-plan`, sehingga riwayat langganan akun uji di panel admin
   menampilkan baris tanpa label. Lalu pilihan plan dan durasi 24 bulan
   di buat akun (Advanced dan Pro wajib durasi), `PUT
   /admin/users/:id/plan`, plan opsional saat perpanjang, dan plan di
   daftar serta detail akun. `PILIHAN_DURASI_BULAN` dan
   `DurasiLangganan` masih 1, 3, 6, 12.
2. Selesai di `77d4380` (di atas).
   **Pelanggan bawaan (B218)**: pelanggan `isBawaan` tidak dapat
   dihapus (409) dan hanya namanya yang boleh diubah; sembunyikan hapus
   dan field selain nama.
3. Selesai di `d696354` (di atas).
   **Dua jenis mutasi baru (B228)**: `SELISIH_KAS_MASUK` dan
   `SELISIH_KAS_KELUAR` di `ARAH_JENIS` dan label
   `features/akun-kas/mutasi.ts`, dengan rujukan `SesiKasir`.
4. Selesai di `3205982`, `41194b7`, dan `4322dba` (di atas).
   **Wizard setup tersambung** (B220, B219, B223): status dari `GET
   /api/setup/status` bertoken akun, melanjutkan dari langkah pertama
   yang belum selesai, nama toko lewat `POST /tenant`, Owner lewat
   `register-owner` tanpa `installationId` (memakai `accessToken`
   tingkat atas responsnya untuk langkah berikutnya), lalu lokasi,
   kategori, bahan baku, produk, pajak, tipe aset, aset, tarif, dan
   gudang lewat endpoint modul yang ada. Stok minimal produk menunggu
   Y4 dan tidak ditampilkan seolah tersimpan (TP4a). Pemulihan sesi saat
   `/setup` dimuat ulang perlu diperiksa, karena token hanya di memori.
   Sesudahnya tautan "Daftar" di login akun dipasang.
5. Selesai di `8d0f1dd` (di atas).
   **Penyaringan per plan** (B214, B216, B224): menu dan halaman sesi
   booking disembunyikan untuk Basic dari `langganan.plan` di token
   pengguna, dan 403 `PLAN_TIDAK_MENCAKUP` serta
   `SETUP_FITUR_BELUM_SELESAI` ditampilkan sebagai ajakan upgrade atau
   melengkapi setup, bukan pesan izin. Pesan backend saat ini sudah
   tampil apa adanya lewat `pesanError`, dan tidak memicu logout paksa.
6. **Halaman sesi kasir (B227)**: modul baru, pemetaan perangkat ke akun
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
7. **Penanda dan pemandu wizard setup** (pemilik proyek, 5 November
   2026, sesudah butir 6): pemilik proyek mencoba wizard sendiri, mengisi
   form produk lalu menekan "Simpan dan lanjut" tanpa "Simpan produk",
   sehingga produk tidak pernah terkirim (log backend hanya `GET
   /api/produk`) dan galat "Tambahkan minimal satu produk." menyesatkan.
   Jebakan yang sama ada di langkah Kategori dan Bahan baku. Arahnya:
   tombol yang harus ditekan lebih dulu di setiap langkah ditonjolkan,
   dan setelah wizard selesai ditambah pemandu UI (sorotan atau tur)
   yang menunjukkan apa yang diisi dan tombol apa yang ditekan. Rancangan
   dan perilakunya diajukan lewat dialog sebelum dikerjakan.

Belum dijadwalkan: logo toko (B203 sampai B205) dan jam operasional
(B206) di profil toko, serta perubahan backend 30 Oktober 2026 yang belum
dipakai web: OTP reset PIN Owner dan ubah email atau password akun (B178
sampai B180), dan hapus akun oleh Owner (B181). Keempatnya perlu desain
(pemilik proyek, 5 November 2026: butir yang perlu desain tidak
dikerjakan dulu). B202 dan B195 selesai di `9a85817` dan `eacb5ed`.
Juga belum dijadwalkan, dari pertanyaan pemilik proyek 5 November 2026:
nomor WhatsApp admin untuk halaman Langganan (LG1a, `NOMOR_WA_ADMIN`
masih kosong), dan pengingat masa langganan yang hampir habis di luar
halaman Langganan (perlu desain). Laporan untuk tim backend juga belum
disusun (Utang kecil, di bawah).

Pada 5 November 2026 backend lokal di-fast-forward ke `nizar` `aa978cc`
(memuat `yoga` `e37bf26`): Y4 stok minimal produk (B237, B238), Y5 WMS
khusus Pro (B234 sampai B236), `GET /api/akun/me` (B240), pajak toko
usang (B239), kunci izin cuti yang sudah diputuskan (B242), edit
pengajuan stok atomik (B241), dan self-approve perangkat (B243, B244).
Yang dipakai web masuk butir 4 (B237, B238, B240); B239, B242, B243, dan
B244 tidak menyentuh web, dan B234 serta B235 tidak memutus apa pun
karena akun uji Pro. Suite penuh 550 lolos dan 2 skipped dari 552.

Pada 6 November 2026 backend lokal di-fast-forward ke `nizar` `4d221f5`
(memuat `yoga` `cec04de`), lalu `ridho` di-push ke `c031bde` atas
perintah pemilik proyek, dengan satu commit dokumen AR26 di atasnya
(butir 9 di atas).
Backend dijalankan dengan env inline agar `.env` backend tidak diubah
(`inti/pengujian.md`, Menjalankan layanan uji). Kode backend tidak
diubah sama sekali.

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in ridho nizar yoga; do echo "origin/$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...origin/$r | tr '\t' ' ')"; done
```

## Catatan dari penyambungan Mesin Kasir

Selesai di `b74f30a` (7 November 2026), dengan keputusan MK10a sampai
MK13a (`modul/keuangan.md`). Bagian di bawah dipindah utuh dari
`inti/status.md`.

Berikutnya, dari halaman sesi kasir (B227). Desainnya disetujui pemilik
proyek 6 November 2026 (pratinjau Revisi 1 dan Revisi 2), dan
tampilannya selesai tanpa API di `b86e4b7` (tipe dan fungsi tampilan),
`0178550` (komponen dan pratinjau development), dan `23d00f0` (entri
`IZIN_HALAMAN` rute pratinjau). Keputusan produknya di
`modul/keuangan.md` (Mesin Kasir, MK1a sampai MK9). Saat development,
pratinjau dibuka di `/dashboard/outlet/keuangan/pratinjauMesinKasir`
dengan pemilih keadaan.

Daftar periksa penyambungan (pemilik proyek, 6 November 2026):

1. Rute final `/dashboard/outlet/keuangan/mesinKasir` beserta rute
   rinciannya, entri `IZIN_HALAMAN` (`read-sesi-kasir` atau
   `kelola-perangkat-kasir`, keputusan rancangan butir 16), tab kelima
   "Mesin Kasir" di `keuangan-nav-tabs.tsx`, dan baris di
   `kontrak/izin-halaman.md`.
2. Nama berkas, komponen, dan rute ditinjau ulang terhadap pola modul
   (`referensi/arsitektur.md`): komponen yang kini menerima data lewat
   props disambung ke hook, nama yang menyebut pratinjau tidak dipakai
   lagi, dan `api.ts`, `hooks.ts`, `izin.ts`, serta `pesan.ts`
   ditambahkan di `features/sesi-kasir`.
3. Endpoint: `GET /sesikasir?status=BUKA` untuk kasir yang buka,
   `GET /sesikasir?status=TUTUP` dengan `installationId`, `dari`,
   `sampai`, `page`, dan `limit` untuk riwayat, `GET /sesikasir/:id`,
   `POST /sesikasir/:id/tutup`, `GET` dan `POST /sesikasir/perangkat`,
   `DELETE /sesikasir/perangkat/:id`, serta `GET /device/:userId` per
   karyawan untuk pilihan perangkat (`read-pengguna`). Terakhir dipakai
   per mesin dibaca dari sesi terbarunya (`installationId`, `limit` 1).
4. Pesan lewat `pesan.ts`: 409 pindah dan hapus pemetaan selama sesi
   terbuka (K-04, K-05), 409 laci dipakai perangkat lain, 404 perangkat
   tidak ditemukan, dan 400 catatan wajib saat tutup, yang ditampilkan
   "Hitungan berbeda dengan catatan sistem. Tulis catatan penyebabnya,
   lalu tutup lagi."
5. Spec alur nyata menggantikan spec pratinjau: mesin kasir ditambah,
   diubah, dan dilepas lewat UI; sesi dibuka lewat API aplikasi sebagai
   data milik modul lain (keputusan rancangan butir 23), lalu ditutup
   dari web.
6. Setelah seluruh uji alur nyata lolos, hapus
   `data-contoh.ts`,
   `pratinjau.tsx` di `features/sesi-kasir`, kedua rute
   `pratinjauMesinKasir`, entrinya di `IZIN_HALAMAN`, dan
   `pratinjau-mesin-kasir.spec.ts`.

## Catatan dari pekerjaan tanpa UI baru 7 November 2026

Dipindah utuh dari `inti/status.md`.

Keempat butir yang dipilih pemilik proyek lewat dialog 7 November 2026
selesai. E2E tidak dijalankan per commit: tiap commit diperiksa `tsc`,
ESLint, dan vitest penuh, lalu satu suite e2e penuh di akhir putaran
(pemilik proyek, 7 November 2026).

1. Berkas di atas 700 baris dipecah tanpa mengubah perilaku: buat
   penjualan (`584d6ae`) dan form produk (`11ed2d4`).
2. Bukti dari kode backend dan respons nyata `1584222`: cache produk saat
   pajak berubah (butir 94), hapus kategori yang dipakai produk 409
   (butir 12), hapus aset yang punya booking dari web (butir 52,
   `66ea7a4`), B112, B114 jalur Owner, format nomor B115, dan booking
   Batal yang tidak lagi dikirim ke web (butir 141). Yang tersisa: B114
   bagi peran selain Owner (butuh pengguna non-Owner) dan nomor B115
   pada 00.00 sampai 07.00 WIB.
3. Lima utang pengujian dilunasi (`5c9ed69`, `af77b1f`;
   `arsip/riwayat-pengujian.md`).
4. Suite e2e penuh 589 test, 585 lolos dan 1 skipped; ketiga kegagalan
   skenario baru diperbaiki (`inti/pengujian.md`, Baseline).

## Keadaan pekerjaan 7 sampai 10 November 2026

Dipindah dari `inti/status.md` (Pekerjaan berikutnya) pada 14 November
2026 tanpa perubahan.

Keadaan per 10 November 2026: backend lokal `ridho` `0bbd261`,
di-fast-forward ke `yoga` (8 commit di atas `origin/ridho` `0e43a6d`,
yang maju 18 commit di atas `e9112a8`: P68 sampai P77, AR30 sampai AR34,
B292 sampai B318) tanpa di-push. Penyesuaiannya pesan kategori kembar
(KG1a), tipe kategori, dan muat ulang pengguna setelah 409 B315;
keputusan LK2a, VK1a, RT1a, dan OM1a tanpa perubahan kode
(`referensi/keputusan-penyesuaian-backend.md`).

Keadaan per 8 November 2026 (sore): backend lokal `ridho` `e9112a8`,
di-fast-forward ke `nizar` (28 commit di atas `916e7df`, memuat `yoga`
`1d3851d`: P65 sampai P67, B283 sampai B291) tanpa di-push. Tidak ada
perubahan kode web: LR1a laba rugi tetap seluruh toko, LR2a arus kas
menunggu desain, dan PG1a pesan 403 Setujui rekan selokasi tampil apa
adanya (`referensi/keputusan-penyesuaian-backend.md`).

Keadaan per 8 November 2026: backend lokal `ridho` `916e7df`,
di-fast-forward ke `yoga` (16 commit di atas `origin/ridho` `d267f03`:
P61 sampai P64, B267 sampai B282) tanpa di-push. Penyesuaiannya PS10a
pembelian memotong saldo (`b66a6eb`), LK1a lokasi kerja di dialog
pengguna (`4fe201b`), dan AB6a label kedatangan di Status Staf
(`69f2b18`); Model bisnis MVP diperbarui mengikuti P61
(`referensi/keputusan-penyesuaian-backend.md`).

Keadaan per 7 November 2026: backend lokal `ridho` `d267f03`, sama
dengan `origin/ridho` (tujuh commit Ridho di atas `1584222`: AR26 sampai
AR29, B263 sampai B266). Penyesuaiannya hanya B266 (`5b6ff0d`), dicatat
di `referensi/keputusan-penyesuaian-backend.md`. Sesudahnya utang tanpa UI
baru dikerjakan (pemilik proyek, 7 November 2026): syarat fixme lintas
outlet dibuang (`860ff15`), B250 dan B255 dibuktikan e2e (`778eb2d`), dan
tombol tulis menurut izin serta butir 158 diuji lewat pengguna uji
terbatas (`cbfa23b`, `4601d91`), termasuk tombol Tambah Akun yang kini
menurut izin. Pekerjaan yang selesai sejak
penyesuaian `4759208` (4 sampai 6 November 2026, butir 1 sampai 10
beserta urutan yang disetujui 4 November 2026) dipindah ke
`arsip/catatan-putaran.md` (Catatan dari penyesuaian backend `4759208`
sampai `c031bde`); rujukan "butir 4 (wizard)", "butir 6 (sesi kasir)",
dan "butir 7" di dokumen lain merujuk daftar di sana.
