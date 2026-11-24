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

## Pekerjaan UI 12 sampai 16 November 2026

Dipindah dari `inti/status.md` (Pekerjaan UI berikutnya) pada 17 November 2026.

Dicatat pemilik proyek 12 November 2026, dikerjakan sesudah putaran ini
dengan alur kanvas desain seperti butir di bawah:

1. **Laman Keuangan pindah ke sub-sidebar Keuangan**: selesai 12 November
   2026. Keuangan dan Laporan menjadi dua menu lipat, bar tab dibuang,
   judul dan kartu ringkasan tetap (`modul/keuangan.md`, SK1a dan SK2a).
2. **Perbaikan bug visual di laman buat penjualan**: selesai 12 November
   2026. Kolom kanan sticky menutupi tombol Buat Penjualan saat digulir;
   kini berhenti di atas baris aksi (`modul/penjualan.md`, BP1a).
3. **Belanja Stok untuk plan Basic**: selesai 12 November 2026, tombol
   Catat pembelian dan Pembelian Stok sebagai menu tunggal
   (`modul/keuangan.md`, BS4a dan BS5a).
4. **Penyesuaian backend `yoga` `d6709a1`**: selesai 12 November 2026
   (`referensi/keputusan-penyesuaian-backend.md`).
5. **Stok keluar di detail penjualan (VD3a)**: selesai 12 November 2026,
   desain A kanvas (`modul/penjualan.md`, VD4a sampai VD10a).
6. **Paginasi server produk, bahan baku, dan inventory**: selesai
   16 November 2026 setelah backend B340 sampai B342 (PV1a dan PV2a,
   `624761a`, `e41fe76`, `6ab81aa`; `modul/inventaris.md` dan
   `modul/produk-kategori.md`).
7. **Bug dan cacat tampilan**: selesai 14 November 2026 (`609b36a`,
   `0df0ca5`; `modul/ui-ux.md`, CV1a sampai CV14a). Sampel tampilan dan
   pemindaian seluruh rute dashboard di 1280 dan 390 px, lalu perbaikan
   teks terpotong, luberan HP, tabel 1280, menu aktif sidebar, peringatan
   grafik, Libur B165, dialog hapus jadwal, Kosongkan tanggal, dan Buat
   Posisi. "Akun non-aktif" ternyata seluruhnya sisa uji E2E. Temuan
   tampilan tersisa (label filter jurnal, kolom Staf jadwal, menu Pindah
   Dana, tab Booking, cincin fokus) selesai lewat kanvas desain di
   `883a79b` (CV15a sampai CV18a). Suite e2e penuh 14 November 2026:
   643 lolos dari 643 (`arsip/riwayat-pengujian.md`).
8. **Fitur, rapian kode, dan utang pengujian**: selesai 14 November 2026.
   Pemecahan buat penjualan dan `PolaRosterItem` wajib (`7c004c2`), label
   kartu HP (`ceb8c95`), token warna (`c437d68`), tabel rincian
   (`eb64c70`), tipografi tujuh tingkat (`5e597c2`), aturan spasi
   (keputusan rancangan butir 35), dan utang pengujian bukan-Owner,
   keadaan gagal, dan B165 (`2bcb1ce`). Suite e2e penuh berikutnya
   menunggu izin pemilik proyek. Temuan baru: luberan tabel di 768 px dan
   kode mati pesan lokasi jurnal stok gudang (`modul/ui-ux.md`).

## Status yang selesai, dipindah 20 November 2026

Dipindah dari `inti/status.md` pada 20 November 2026 tanpa perubahan
isi, setelah diverifikasi terhadap kode dan git: seluruh butir di bawah
selesai atau lunas. Kartu siap surat jalan dashboard gudang (AR6a) lunas
sejak `f865254`, 28 Oktober 2026; status Batal di timeline reservasi
bukan bug, karena Batal dibaca VOID dan timeline sengaja tidak
menampilkan booking VOID; mutasi transfer bertaut ke rincian transfernya
sejak `86f2a0b` (`modul/keuangan.md`, DN5a).

Pada 7 November 2026 Mesin Kasir disambung (`b74f30a`) dan keempat
butir tanpa UI baru selesai (`arsip/catatan-putaran.md`, Catatan dari
penyambungan Mesin Kasir dan Catatan dari pekerjaan tanpa UI baru
7 November 2026). Yang dapat dikerjakan berikutnya menunggu backend
(langkah jam buka, butir 176), desain pemilik proyek, atau keputusan
pemilik proyek (bagian di bawah).

#### Mesin Kasir, sisi backend

Penyambungan selesai di `b74f30a` (`modul/keuangan.md`, MK10a sampai
MK13a). Sisi backend tuntas di `4a19be8`: K-08 sampai K-10 diterapkan
Nizar (MK15a sampai MK17a; B324 sampai B326), dan butir 172 sampai 174,
K-18, serta K-19 ditutup Ridho (B334 sampai B337). Web memakai daftar
perangkat se-toko, nama mesin dari sesi, dan asal penutupan (MK3b,
MK5b, MK6b, `e1ea235`), serta menonaktifkan metode tunai berlaci di
form pembayaran (PB15a, `46ebfc3`).

#### Langkah jam buka

Tersambung 16 November 2026 (JB8a, `46d90e1`; backend P81, B331): wizard
sesudah Lokasi outlet dan kartu Jam Buka di Profil Toko memakai isian
yang sama, dan pratinjaunya dihapus setelah spec alur nyata lolos
(`1171f33`). Pada hari yang sama tur sorotannya ditambah (JB9a,
`0c4cc7e`), dan jam buka dipakai di form shift, kalender, dan generate
ruang outlet lewat kanvas desain (JO1a dan JO2a, `fddb3c6`;
`modul/jadwal-shift.md`).

#### Pekerjaan UI berikutnya

Kedelapan butir yang dicatat pemilik proyek 12 November 2026 selesai
12 sampai 16 November 2026, dan daftarnya dipindah ke
`arsip/catatan-putaran.md` (Pekerjaan UI 12 sampai 16 November 2026)
pada 17 November 2026; rujukan "Pekerjaan UI berikutnya butir N" di
dokumen lain merujuk daftar di sana.

#### Menunggu pemilik proyek, dicatat 14 November 2026

Dilanjutkan nanti atas perintah pemilik proyek, tidak sekarang:

1. **Suite e2e penuh**: dijalankan 16 November 2026, 646 lolos, 4 gagal,
   dan 2 dilewati dari 652 (`inti/pengujian.md`, Baseline). Satu gagal
   karena laptop tidur dan lolos saat diulang; tiga gagal sungguhan
   selesai ditelusuri 17 November 2026 dan dibuktikan lewat spec
   terdampak saja: label kartu HP ikut terbaca di
   `lihat-stock-adjustment` (`25b969c`), dan perpindahan halaman di
   tengah `pin-refresh` di `akses/jalur-bukan-owner` (`f80bd16`)
   (`inti/pengujian.md`, Baseline). Suite penuh 17 November 2026 atas
   izin pemilik proyek: 654 lolos dan 2 dilewati dari 656, tanpa
   kegagalan.
2. **Luberan tabel daftar di 768 px**: selesai 17 November 2026 lewat
   kanvas desain, kartu bila tabel tidak muat (`modul/ui-ux.md`, LT1a
   sampai LT5a). Temuan lanjutan di 390 px (Pembelian Stok, Produk,
   Buat Reservasi) selesai pada hari yang sama (LT7a sampai LT10a).
3. **Kode mati pesan lokasi jurnal stok gudang**: dihapus 17 November
   2026, bersama pola yang sama di Pembelian Stok gudang (`modul/ui-ux.md`,
   KM1a).

#### Menunggu desain pemilik proyek

Butir yang butuh UI baru tidak dikerjakan dulu (pemilik proyek, 5 dan
6 November 2026). Urutannya disetujui 4 dan 5 November 2026.

1. **Isian password di halaman verifikasi email**, sisa B248: selesai
   12 November 2026 (opsi A, `modul/setup-akun.md` TP6a). Tanpa password
   titipan, halaman menampilkan Password akun dan Ulangi password, yang
   tidak dikosongkan saat kode salah; tanpa email di alamat tetap pesan
   galat. Spec e2e-nya lolos di suite penuh 14 November 2026.
2. **Belum dijadwalkan, perlu desain**: logo toko selesai 12 November
   2026 (`modul/pengaturan-outlet.md`, PO17a dan PO18a); jam operasional
   B206 menyusul penyambungan langkah jam buka, di atas. Pengingat masa
   langganan selesai 12 November 2026 lewat lonceng topbar
   (`modul/setup-akun.md`, TP8a). OTP reset PIN Owner, ubah email atau
   password akun, dan hapus akun oleh Owner (B178 sampai B181): selesai
   13 November 2026 (`modul/setup-akun.md`, OA1a sampai OA12a); spec
   ber-OTP-nya lolos di suite penuh 14 November 2026.
3. **Halaman arus kas** (B291, LR2a): selesai 12 November 2026, tab
   Keuangan "Arus Kas" dengan desain D pemilik proyek (`modul/keuangan.md`,
   LR3a sampai LR6a).
4. **Omzet per metode pembayaran di laporan** (OM1a): selesai
   17 November 2026 sebagai laman Pembayaran per Metode, desain B dari
   tiga desain kanvas (`modul/keuangan.md`, OM2a dan OM3a; uang diterima
   per metode dari B329, bukan omzet).
5. **Stok keluar di detail penjualan, termasuk yang VOID** (VD3a):
   selesai 12 November 2026 (`modul/penjualan.md`, VD4a sampai VD10a).
6. **Modul membership web** (paket dan pendaftaran member), syarat
   menawarkan diskon khusus member (NZ6a): selesai 17 November 2026,
   desain B kanvas "Modul Membership" (`modul/pelanggan-diskon.md`, MB1a
   sampai MB3a); khusus member ditawarkan lagi di form diskon.

Diputuskan 10 November 2026: keputusan bisnis Mesin Kasir MK15a sampai
MK17a (`modul/keuangan.md`, menunggu backend), ruang mengikuti lokasi
kerja LK3a (`modul/jadwal-shift.md`), Tandai Selesai tetap di detail
penjualan (NZ7a) dan khusus member menunggu modul membership (NZ6a),
nama toko di login pengguna TP2b (`modul/setup-akun.md`), dan Lampiran
A dibangkitkan ulang RG9a. Ketiganya selesai 10 November 2026: TP2b
(`19498b7`), LK3a (`bce1362`), dan RG9a (`c2c5915`).

Dicatat pemilik proyek 18 November 2026, dikerjakan nanti atas perintahnya,
tidak sekarang:

4. **Laman utama (laman pengenalan website)**: selesai 19 November 2026
   dari kanvas desain "Laman Utama Tachyon POS", desain G
   (`modul/ui-ux.md`, LU1a sampai LU5a); tidak ada pengalihan, tautan,
   atau spec yang ternyata bergantung pada `/` sebagai laman login.
   Catatan awal: halaman yang pertama tampil
   saat website dibuka, bukan laman login. Sekarang `app/page.tsx`
   langsung merender `LoginPage`, sehingga `/` sama dengan `/login`.
   Isi, desain, dan tujuan tombolnya (masuk, daftar) perlu keputusan dan
   desain pemilik proyek; periksa juga pengalihan yang mengandalkan `/`
   sebagai halaman login (`lib/auth/tujuan.ts`, gerbang rute, dan spec
   `auth`), serta tur dan tautan yang menunjuk `/`.
5. **Penyelarasan ukuran tombol buat, tambah, dan catat**: ukurannya kini
   berbeda-beda antarhalaman, ada yang besar dan ada yang kecil. Pemetaan
   awal 18 November 2026: teks tombol "Tambah", "Buat", atau "Catat"
   muncul di 59 berkas, dengan sedikitnya enam ukuran di dekatnya (`h-11`
   8 kali, `h-12` 5, `size="sm"` 4, `h-8` 2, `h-9` dan `h-10` masing-masing
   1). Langkah pertama: daftar seluruh tombolnya beserta kelas ukurannya
   (`grep -rnE -B5 '(Tambah|Buat|Catat) [A-Z]' app features`), lalu ajukan
   satu ukuran baku (misalnya varian `Button` sendiri) sebagai keputusan
   pemilik proyek. Selesai 19 November 2026: `size="aksi"`, 44 px mulai
   640 px dan 32 px di HP, selebar penuh di HP, termasuk tombol form dan
   tetangga sebaris; sekaligus tailwind-merge mengenal token ukuran huruf
   (`modul/ui-ux.md`, TK1a sampai TK6a).
6. **Filter seragam**: selesai 19 November 2026 dari kanvas desain "Popup
   Filter" (gabungan desain A, B, dan C): bilah kotak cari dan Filter
   lainnya berlencana, pil aktif, dan panel samping beranimasi di 16 laman
   berfilter; kotak cari seragam di halaman hanya-cari; Filter Aset
   Reservasi dihapus (`modul/ui-ux.md`, FL1a sampai FL15a). Suite e2e
   penuh sesudahnya kini harapan 680 (ditambah empat skenario laman
   utama), dicatat sebagai utang pengujian 19 November 2026 dan tidak
   dikerjakan sekarang atas perintah pemilik proyek
   (`referensi/utang-pengujian.md`).

- Data toko uji wizard sempat menetap: 5 toko "Kopi Senja E2E" dan 10
  akun `e2e.*` per 18 November 2026. Penyebabnya akun uji yang tidak
  terhapus karena run yang gagal, bukan hapus akun: backend menghapus
  seluruh data toko bersama akunnya (`akunService.deleteUserByAdmin`
  memanggil `tenantService.wipeTenantData`). Kesepuluh akun dihapus lewat
  API admin 18 November 2026, dan kelima toko ikut terhapus tanpa dokumen
  yatim.
- Data uji yang menumpuk di toko uji dibersihkan 18 November 2026 (pemilik
  proyek): skrip mongosh sekali pakai dengan mode tinjau, setelah basis
  data dicadangkan ke
  `~/Documents/cadangan-db/db_produk-sebelum-bersih-2026-11-18.gz`.
  Cadangan itu dibuat sesudah akun dan toko wizard di atas terhapus,
  sehingga hanya memulihkan pembersihan di toko uji.
  Dihapus 579 akun kas E2E nonaktif, 91 metode E2E nonaktif, 370 diskon
  E2E nonaktif, 576 shift uji nonaktif, dan 541 pelanggan terhapus lunak.
  Yang dirujuk dokumen lain tetap, yaitu 148 akun kas yang dirujuk jurnal
  transfer; penjualan, booking, opname, transfer, dan jurnal tidak
  disentuh. Spec terdampak 177 lolos sesudahnya.
- Laporan untuk tim backend yang ditunda sejak 6 November 2026 tidak
  disusun (LB1a, pemilik proyek 16 November 2026): Ridho membaca repo web
  `70d2648` pada 16 November 2026, mencatat butir 168 sampai 170, 172
  sampai 174, 176 sampai 179, 182, dan 184 beserta K-18 dan K-19 di
  `docs/pengembangan/klien.md` backend (180 dan 181 sudah tercatat
  sebelumnya), dan menutup seluruhnya di `4a19be8`. Status setiap
  butir diselaraskan di `kontrak/temuan.md`, dicocokkan menurut isinya
  karena nomor di `docs/pengembangan/klien.md` backend pernah bergeser,
  dan pembuktiannya dicatat di sana.
  Laporan baru hanya bila ada temuan baru: butir 185 (rotasi
  `pin-refresh` tanpa masa tenggang) dilaporkan 17 November 2026 atas
  keputusan pemilik proyek, ditutup Ridho pada hari yang sama (B345,
  `3570bd4`), dan dibuktikan web lewat `auth/tenggang-pin-refresh`.
  Butir 85 dan 107 (B50, B51) dibuktikan dari kode 16 November 2026, dan
  B169, B170, B346, butir 178, serta butir 169 (sebagian) pada
  18 November 2026 (`referensi/keputusan-penyesuaian-backend.md`,
  Pembuktian web 18 November 2026). Tidak ada lagi kontrak yang menunggu
  pembuktian web.

#### Utang kecil dari penanda dan panduan wizard

Penanda dan tur sorotan wizard serta dashboard selesai di `58d7eb9`,
`aa3c1c6`, `c8a2e83`, dan `5c3da45`, dan ringkasan tersimpan tanpa
tautan (WS6a) di `daf9e3a` (`modul/setup-akun.md`, PN1a sampai PN4a).

- Ruang gudang dan langkah jam buka belum punya tur
  (`modul/setup-akun.md`, Utang terbuka). Keduanya selesai: jam buka
  16 November 2026 (JB9a), ruang gudang 17 November 2026 (TG1a, TG2a).

#### Utang kecil dari perbaikan HP Keuangan

- Padding area gulir dashboard di HP turun dari 24 px menjadi 16 px
  untuk seluruh halaman (`b3f8698`, `modul/keuangan.md` KH2b). Seluruh
  rute statis dipindai di 390 px 18 November 2026: hanya 12 dari 78 yang
  16 px, karena pembungkus halaman menambah padding sendiri. Selesai
  18 November 2026 lewat SP1a dan SP2a (`modul/ui-ux.md`, Padding HP dan
  pembungkus halaman): 69 dari 78, sisanya rute yang dikecualikan.

- Jalur role tanpa izin SDM baru, tanpa `read-location`, dan tanpa izin
  lintas outlet hanya teruji di unit test, karena akun uji berperan
  Owner (`referensi/utang-pengujian.md`).
  Jalur tanpa izin lintas outlet teruji e2e sejak `1cd8211`, lewat
  pengguna uji "E2E Tanpa Lintas Outlet"; jalur tanpa izin SDM baru dan
  tanpa `read-location` teruji e2e sejak `2bcb1ce` lewat pengguna uji "E2E
  Tanpa SDM" dan "E2E Tanpa Lokasi".

- Ruang mengikuti lokasi kerja sejak LK3a (10 November 2026), dan sejak
  `8901b20` (B339) juga bagi staf berlokasi kerja tanpa `read-location`
  (`kontrak/temuan.md` butir 182). Sebelumnya staf berlokasi
  kerja yang membuka ruang lain melihat pesan 403 backend di setiap
  halaman stok, dan sejak backend `e9112a8` juga di pembelian stok,
  penjualan, pembayaran, sesi kasir, panel Status Staf, dan laba rugi
  (B283, B286 sampai B290), serta sejak `0bbd261` dashboard gudang dan
  stok produk ber-`locationID` (B317, B318). Atasan berlokasi kerja yang
  memberi lokasi lain di dialog pengguna melihat pesan 403 (B310, LK2a).

- Kartu siap surat jalan dashboard gudang dihitung server untuk kedua
  arah, sedangkan tab Perlu Surat Jalan gudang hanya memuat permintaan
  (AR6a). Angkanya melebihi isi tab bila ada pengembalian yang disetujui
  dan menunggu surat jalan outlet; perlu hitungan per arah dari backend
  atau kartu tersendiri. Lunas sejak 28 Oktober 2026 (`f865254`, B111):
  kartu memakai `siapDibuatSuratJalanPerArah.permintaan`
  (`features/dashboard-gudang/ringkasan.ts`); catatan ini tertinggal dan
  ditandai 20 November 2026.

- Ketertinggalan Lampiran A (izin `/pembelianstok` dan
  `DELETE /bebanoperasional/:id`) lunas: Lampiran A dibangkitkan ulang
  terhadap `aeb6a52` pada 10 November 2026 (RG9a).

- Timeline reservasi tidak punya aksi Tandai Selesai (NZ7a). Booking lama
  berstatus Batal dibaca VOID sejak backend `nizar` `8dc6211`; respons
  7 November 2026 tidak memuat satu pun status Batal, sehingga timeline
  tidak dapat menampilkannya (`kontrak/temuan.md` butir 141). Bukan bug:
  ditelusuri 20 November 2026, Batal dibaca VOID dan timeline sengaja
  tidak menampilkan booking VOID (`features/sesi-booking/tampilan.ts`),
  sama seperti booking yang dibatalkan sekarang.
- Khusus member belum ditawarkan di form diskon (NZ6a); ditinjau bersama
  modul membership. Selesai 17 November 2026 (MB1a).

- Mutasi transfer di buku mutasi tidak bertaut ke riwayat Pindah Dana,
  karena riwayat itu tidak punya halaman per transfer. Selesai
  20 November 2026 lewat dialog rincian transfer di Pindah Dana
  (`modul/keuangan.md`, DN5a, `86f2a0b`).

## Status yang selesai, dipindah 24 November 2026

Dipindah dari `inti/status.md` tanpa perubahan teks pada bersih-bersih
dokumentasi 24 November 2026: keadaan 23 November 2026 dan sebelumnya,
daftar "Berikutnya" 18 sampai 20 November 2026, utang pengujian kelompok
1, butir Menunggu keputusan yang sudah diputuskan, dan butir utang kecil
yang sudah selesai.

### Keadaan 23 November 2026 sore

Keadaan akhir sesi 23 November 2026: backend `ridho` `1718030` (tidak maju
sejak 22 November). Dua putaran selesai hari itu:

1. **Penyesuaian backend `1718030`** (`referensi/keputusan-penyesuaian-backend.md`):
   B347, B348, ekspor dan unduh laporan (UD1a sampai UD3a), kemasan dan
   satuan (KN1a sampai KN3a), dan Rekap Absensi (RK1a).
2. **Bug dan temuan frontend**: tautan mutasi PEMBELIAN (TM1a), akun kas
   uji tetap (AU1a), metode pembayaran tanpa `read-akunkas` (MP1a),
   sebutan Kategori Aset (KA1a), satu form tarif (TF1a, beserta regresi
   harga kosong yang dibetulkan), pesan 403 yang menyebut halaman dan izin
   (GR9a), bayangan baris per sel (BB1a), dan halaman ubah akun kas dari
   `GET /akunkas/:id`. Catatan logout `pin-logout` ternyata sudah selesai
   di backend B343.
3. **Bug dan temuan frontend tuntas**: sebutan "kategori aset" di seluruh
   aplikasi (KA2a), tombol kembali bertujuan pasti di enam laman (KB1a,
   penyebab gagal sesekali "Batalkan kembali ke daftar"), dan kejadian
   vitest gagal sekali tidak tereproduksi dalam enam run.

Urutan kerja berikutnya, atas perintah pemilik proyek: butir daftar
20 November 2026 dan 19 November 2026 di bawah yang belum selesai (rombak
UI/UX laman admin, deskripsi paket laman pengenalan, revisi laman profil
dan menu popup profil), nomor WhatsApp admin (LG1a), dan utang pengujian
kelompok 1. **Suite e2e penuh ditunda sampai seluruh pekerjaan selesai**
(pemilik proyek, 20 November 2026); harapannya 727, dan sesudahnya skrip
`bersih-akunkas.js` (AU1a).

### Keadaan sebelum 23 November 2026

Sesi 20 November 2026 malam: kerapian seluruh laman (KL1b, TH1a, TI1a,
KF1a, TT1a, PP1a), utang pengujian bagian C, dan pembuktian kontrak 68
sampai 72 (`modul/ui-ux.md`, `inti/pengujian.md`); backend lokal `ridho`
`2790fc7`.

Laporan backend 186 sampai 188 (`kontrak/temuan.md`) sudah diberikan ke
pemilik proyek; ketiganya diperbaiki backend 22 November 2026 dan
dibuktikan web 23 November 2026.
Butir 189 (satuan kemasan seperti pak tidak dapat dipakai sebagian di
resep; temuan pemilik proyek 20 November 2026) diputuskan backend
22 November 2026 (P87) dan disesuaikan web 23 November 2026
(`modul/produk-kategori.md`, KN1a sampai KN3a).

Keadaan per 16 November 2026: backend lokal `ridho` `4a19be8`, sama
dengan remote, 29 commit di atas `d6709a1` (Nizar K-08 sampai K-10,
B324 sampai B329; Ridho P80 sampai P82, B330 sampai B344). Ridho
menutup seluruh butir web yang menunggu backend (168 sampai 184, K-18,
dan K-19). Web menyesuaikan diri dalam 13 commit, `e1ea235` sampai
`6ab81aa`: sesi kasir (MK3b, MK5b, MK6b), lokasi kerja tanpa
`read-location`, Setujui rekan selokasi (PG2a), langganan (LG4a),
timeline reservasi (TL1a), metode tunai berlaci (PB15a), langkah jam
buka (JB8a), dan paginasi server empat daftar (PV1a, PV2a)
(`referensi/keputusan-penyesuaian-backend.md`).

Keadaan per 17 November 2026: backend lokal `ridho` `3570bd4`, sama
dengan remote, lima commit di atas `4a19be8`, termasuk gabungan `nizar`
`a79c087`. Ridho menutup butir 185 (masa tenggang rotasi refresh, P83,
B345) dan menyaring perangkat toko menurut lokasi kerja (AR36, B346).
Web tidak berubah kodenya; B345 dibuktikan lewat spec baru
`auth/tenggang-pin-refresh`, dan B346 belum dibuktikan web
(`referensi/keputusan-penyesuaian-backend.md`). Suite penuh sesudahnya
665 lolos, 1 gagal, dan 1 dilewati dari 667; kegagalannya bug tur gudang
(TG2a) yang diperbaiki dan dibuktikan lewat spec terdampak
(`arsip/riwayat-pengujian.md`, Riwayat baseline).

Keadaan per 18 November 2026: backend lokal `ridho` `2790fc7`, satu
commit dokumen di atas `3570bd4` (checkpoint `status/ridho.md`, butir 3
mencatat B169, B170, dan B346 menunggu web). Seluruh kontrak yang belum
dibuktikan web ditutup: B169, B170, dan B346 lewat e2e (`5f57454`), butir
178 dan 169 lewat skrip, dan butir 77 diuji ulang 570 kali tanpa
tereproduksi (`referensi/keputusan-penyesuaian-backend.md`, Pembuktian web
18 November 2026). Sesudahnya form ubah produk beresep menampilkan stok
terhitung (SR1a), seluruh pembungkus halaman diseragamkan dengan 16 px di
HP (SP1a, SP2a), metrik diukur ulang, dan data uji yang menumpuk
dibersihkan (Utang kecil dari penyesuaian backend `4759208`).

Keadaan per 20 November 2026: backend lokal `ridho` `2790fc7`, tidak
maju sejak 18 November. Mutasi transfer bertaut ke rincian transfernya
(DN5a, `86f2a0b`), suite penuh dijalankan, tanggal panel filter
berbulan singkat (FL20a, `99ecd4c`), dan butir status yang basi
diverifikasi terhadap kode lalu dipindah ke arsip.

Keadaan per 7 sampai 10 November 2026 dipindah ke
`arsip/catatan-putaran.md` (Keadaan pekerjaan 7 sampai 10 November 2026)
pada 14 November 2026, termasuk keterangan rujukan "butir 4 (wizard)",
"butir 6 (sesi kasir)", dan "butir 7" di dokumen lain.

Backend dijalankan dengan env inline agar `.env` backend tidak diubah
(`inti/pengujian.md`, Menjalankan layanan uji). Kode backend tidak
diubah dari sisi frontend. Langkah pertama setiap sesi memeriksa apakah
cabang backend maju:

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for r in ridho nizar yoga; do echo "origin/$r mundur-maju:$(git -C "$BE" rev-list --left-right --count HEAD...origin/$r | tr '\t' ' ')"; done
```

### Yang selesai sebelum 18 November 2026

Mesin Kasir sisi backend, langkah jam buka, Pekerjaan UI berikutnya
12 sampai 16 November 2026, butir Menunggu pemilik proyek 14 November
2026, dan seluruh butir Menunggu desain pemilik proyek selesai, dan
catatannya dipindah ke `arsip/catatan-putaran.md` (Status yang selesai,
dipindah 20 November 2026) pada 20 November 2026; rujukan "Pekerjaan UI
berikutnya butir N" di dokumen lain merujuk daftar di arsip itu.

### Berikutnya, dicatat 18 November 2026

1. **Suite e2e penuh**: dijalankan 20 November 2026 atas perintah
   pemilik proyek, 676 lolos, 3 gagal, dan 1 dilewati dari 680. Ketiganya
   spec yang tertinggal dari filter seragam; salah satunya menemukan
   tanggal panel filter meluber, diperbaiki lewat FL20a (`99ecd4c`), dan
   seluruhnya dibuktikan lewat spec terdampak (`inti/pengujian.md`,
   Baseline).
2. **Utang pengujian yang basi atau murah ditutup**
   (`referensi/utang-pengujian.md`), ditawarkan 18 November 2026: selesai
   20 November 2026 sebagai bagian C (Mulai di sini, di atas). LK1a sudah
   dicatat basi sebagian di butirnya, keterangan khusus member teruji e2e,
   dan pesan jurnal stok gudang KM1a sudah diarsipkan 17 November 2026.
3. **Nomor WhatsApp admin** halaman Langganan (LG1a), di bawah.

Laman utama, ukuran tombol aksi, dan filter seragam, yang dicatat
pemilik proyek pada hari yang sama, selesai 19 November 2026
(`modul/ui-ux.md`, LU1a sampai LU5a, TK1a sampai TK6a, dan FL1a sampai
FL19a); catatannya dipindah ke arsip yang sama.

### Berikutnya, dicatat 19 November 2026

Dicatat pemilik proyek sesudah laman utama (LU1a sampai LU5a), dikerjakan
pada sesi berikutnya:

1. **Revisi tata letak dan UI laman profil pengguna**
   (`/dashboard/profil`, `features/pengguna/halaman-profil.tsx`). Selesai
   24 November 2026 (`modul/profil-login.md`, PU1a).
2. **Revisi UI menu popup profil pengguna di kaki sidebar**: menu yang
   terbuka saat menekan profil pengguna di bagian paling bawah sidebar
   (`components/sidebar-pengguna.tsx`). Selesai 24 November 2026
   (`modul/profil-login.md`, PU2a dan PU3a).

### Berikutnya, dicatat 20 November 2026

Dicatat pemilik proyek 20 November 2026, dikerjakan nanti atas
perintahnya:

1. **Rombak UI/UX laman admin platform** (`app/admin`,
   `features/admin-akun`: daftar, buat, detail, dan ubah akun klien,
   langganan, serta riwayatnya). Selesai 24 November 2026 dari kanvas tiga
   arah (`modul/panel-admin.md`, RP1a sampai RP5a).
2. **Perbaikan deskripsi paket di laman pengenalan** (`/`, `PAKET` di
   `features/laman-utama/konten.ts`: kalimat "untuk" dan daftar fitur
   Basic, Advanced, dan Pro). Isinya dicocokkan dengan pembatasan plan
   yang berlaku (`features/langganan/data.ts`, `modul/setup-akun.md`
   PL6a) dan diputuskan pemilik proyek. Selesai 24 November 2026
   (`modul/ui-ux.md`, LU6a).
3. **Kerapian spacing dan alignment seluruh laman** (pemilik proyek,
   20 November 2026): setiap laman rapi di HP, HP mendatar, tablet, dan
   desktop, horizontal maupun vertikal, tanpa elemen berdempet. Selesai
   20 November 2026 (`modul/ui-ux.md`, Kerapian seluruh laman): kartu lega
   menjadi bawaan semua `DataTable` (KL1b), dan pola bersama lain
   diputuskan lewat kanvas (TH1a, TI1a, KF1a, TT1a).
4. **Unduh PDF, Excel, atau CSV untuk laporan dan data penting**
   (dicatat pemilik proyek 20 November 2026). Selesai 23 November 2026
   sesudah backend menambah ekspor (P85, B349 sampai B358): Unduh per
   bulan di daftar penjualan, mutasi kas, pengeluaran, belanja stok, stok
   saat ini, jurnal stok, stock opname, dan adjustment (UD1a), Unduh
   laporan di Ringkasan Laba/Rugi dan Pembayaran per Metode (UD2a), dan
   laman Rekap Absensi (RK1a). Ditunda backend (P85 butir 1): pindah dana,
   mesin kasir, pengajuan dan surat jalan, produk dan bahan baku,
   pelanggan, membership, dan reservasi.

### Berikutnya: utang pengujian kelompok 1 yang tersisa (dicatat 20 November 2026)

Selesai 24 November 2026 (`inti/pengujian.md`, Baseline per utang pengujian
kelompok 1), kecuali template General Manajer yang menunggu backend
(butir 191). Bagian MK11a tentang `read-pengguna` dan `GET /device/:userId`
sudah basi sejak MK3b; yang dibuktikan jalur tanpa `read-akunkas` dan
tanpa `read-pengguna`.

Dicatat pemilik proyek 20 November 2026 sebagai pekerjaan berikutnya.
Jalur yang aturannya sudah teruji unit, tetapi belum dibuktikan e2e karena
akun uji berperan Owner. Setiap butir menambah peran dan pengguna uji
menetap lewat `tests/helpers/terkunci-uji.ts`, seperti bagian C
20 November 2026 (`referensi/utang-pengujian.md` memuat rinciannya):

1. **Template role membuka halamannya**: role dari template (stock opname,
   adjustment, absensi, pembelian) dipakai login dan membuka halaman yang
   dijanjikan templatnya; kini hanya pemetaan nama yang teruji.
2. **Mesin Kasir MK11a**: pemegang `kelola-perangkat-kasir` tanpa
   `read-pengguna` atau tanpa `read-akunkas`, dan pemilihan perangkat yang
   melewati pengguna berlevel sama atau lebih tinggi (403
   `GET /device/:userId`).
3. **Titik tur dashboard menurut izin dan plan**: tur bagi pengguna yang
   tidak memegang izin sebagian menu (`bolehLihatMenu`).
4. **Batas level role (RL3a)**: batas atas level, level pengguna yang
   tidak diketahui, dan perubahan level atau wewenang di payload ubah,
   dari pengguna bukan Owner.
5. **Pemilih produk tanpa izin baca produk** di form diskon, beserta
   `aksiDiskon`.
6. **Lokasi kerja (LK1a) di dialog pengguna** bagi pemegang
   `update-pengguna` tanpa `read-location`, dan untuk role Owner.

### Menunggu keputusan pemilik proyek

- Nomor WhatsApp admin untuk halaman Langganan (LG1a, `NOMOR_WA_ADMIN`
  masih kosong).

Tombol bertaut dan penanda "(sekarang)" diputuskan 24 November 2026
(BT1a, BT2a, RP6a).

### Utang kecil dari penyesuaian backend `4759208`

- Data uji wizard yang menetap, pembersihan data uji 18 November 2026,
  dan laporan backend yang ditunda (LB1a) selesai; catatannya dipindah ke
  arsip yang sama. Cadangan sebelum pembersihan:
  `~/Documents/cadangan-db/db_produk-sebelum-bersih-2026-11-18.gz`.
- Data uji yang menumpuk dibersihkan lagi 20 November 2026 (pemilik
  proyek), setelah basis data dicadangkan ke
  `~/Documents/cadangan-db/db_produk-sebelum-bersih-2026-11-20.gz`, lewat
  skrip bermode tinjau `bersih-akunkas.js` dan `bersih-data-uji.js` di
  `~/.cache/frontend-web/alat/` (bawaan tinjau, `--hapus` untuk
  menerapkan). Kriterianya hanya data uji di toko uji yang tidak dirujuk
  dokumen lain, kecuali akun kas: atas keputusan pemilik proyek, 192 akun
  E2E non-aktif dihapus bersama 316 jurnal transfer Rp1 yang melibatkannya
  dan 956 baris mutasinya di kedua sisi. Saldo akun lawan dikoreksi sebesar
  efek transfer yang dihapus; efek bersihnya nol, sehingga saldo dan saldo
  berjalan "kasir outlet" dan "Kas Kecil (Laci)" tidak berubah. Rantai saldo
  berjalan "kasir outlet" sudah tidak konsisten sebelum pembersihan dan
  dibiarkan apa adanya. Dihapus juga 539 shift uji Aktif dan Non-Aktif, 4
  metode, 28 diskon, dan 39 pelanggan terhapus lunak. Data bukti temuan
  tidak disentuh: transfer Rp1,5 butir 126 beserta akun E2E-nya, tipe aset
  butir 77, bahan uji butir 143, surat jalan rusak, dan data butir 142.
  Riwayat pengujian yang menghasilkan data itu tetap tercatat di
  `referensi/utang-pengujian.md`, `inti/pengujian.md`, dan arsip.
- Akun uji `toko@gmail.com` dinaikkan ke Pro lewat API admin, karena
  akun lama dibaca Basic (B212) dan Basic menolak sesi booking (B216).
  Riwayat langganannya kini berisi satu catatan `ubah-plan`.
- `db:setup-toko-lama` menandai empat toko yang ada saat itu selesai
  setup inti. Jangan dijalankan ulang di basis data lokal setelah spec
  membuat akun pendaftar, karena akun itu ikut ditandai selesai.

### Utang kecil dari penyesuaian backend `ridho` `2dd57aa`

- Nama penyetuju di daftar pengajuan stok terisi sejak `7d28135` (butir
  145); belum dipakai web. Selesai 20 November 2026 (`modul/inventaris.md`,
  PI1a).

### Utang kecil dari penyesuaian backend `nizar`

- Booking milik sebuah penjualan belum disertakan di respons detail
  penjualan; permintaannya ditunda (NZ9a). Laporan untuk tim backend
  disusun 20 November 2026 atas perintah pemilik proyek (butir 186), dan
  web memuat setiap booking lewat `GET /sesibooking/:id` sampai backend
  menyertakannya. Selesai 23 November 2026: web membaca `sesiBooking[]`
  detail penjualan (B347).
- Bagian Sesi Booking di detail penjualan memakai tata letak sederhana di
  atas grid informasi; penempatannya menunggu fase UI/UX. Selesai
  20 November 2026 (`modul/penjualan.md`, SB1a).

### Butir utang kecil yang selesai

- Monitoring per lokasi tidak memuat staf yang izin (`kontrak/temuan.md`
  butir 165); panel Status Staf menambah karyawan ruang menurut peran
  yang izin hari itu sampai backend memperbaikinya. Backend `916e7df`
  (B278) memuat staf yang izin hanya bila lokasi kerjanya lokasi itu,
  sehingga tambahan web tetap untuk staf tanpa lokasi kerja. Laporan
  lanjutan untuk tim backend disusun 20 November 2026 (butir 187).
  Selesai 23 November 2026: backend B348 memuat staf tanpa lokasi kerja
  yang izin, dan tambahan web dibuang.
- Penerimaan (outlet) dan pengiriman (gudang) tetap daftar kartu mode
  klien dengan polling; tidak termasuk butir 150. Selesai 20 November
  2026: keduanya berhalaman di server (`modul/inventaris.md`, TS2a,
  `e056daa`).

## Utang modul yang selesai, dipindah 24 November 2026

Dipindah dari bagian Utang terbuka dokumen modul tanpa perubahan teks,
per dokumen dan subjudul asalnya: butir yang bertanda selesai, lunas,
gugur, tertutup, atau dihapus, serta butir yang diverifikasi basi
terhadap kode dan dokumen lain (izin per ruang PS9a, akun non-aktif 518,
akun kas tanpa `update-akunkas`, label mutasi, keadaan Mesin Kasir,
perpindahan halaman daftar akun admin dan Belanja Stok yang pindah ke
`referensi/utang-pengujian.md`, password admin salah, metode tanpa
`read-akunkas`, monitoring izin, jalur tanpa SDM, pratinjau setup, tautan
Daftar, kuota pendaftaran, panel admin, lonceng, dan suite Oktober).

### `akses`

#### Utang kecil dari gerbang rute

- Pesan gerbang bersifat umum dan tidak menyebut halaman maupun izin yang
  kurang. Selesai 23 November 2026 (GR9a).

### `gudang`

#### Utang kecil dari modul Gudang

- Dashboard gudang selesai di `06581f3` dan `50dca2f`. Setelah backend
  memperbaiki butir 149, kartu pengajuan dapat kembali memakai angka
  `GET /dashboard/gudang`, sehingga daftar pengajuan tidak perlu diambil
  utuh hanya untuk menghitung. Selesai di `74b6af4`.

### `inventaris`

#### Utang kecil dari penyesuaian backend `d6709a1`

- Pemicu filter arah jurnal stok terpotong menjadi "Semua ." di 1280 px
  (terlihat 12 November 2026, sudah ada sebelum JS1a). Selesai di
  `609b36a`: pemicu Arah dan Alasan 190 dan 200 px, di HP selebar penuh
  (`modul/ui-ux.md`, CV2b).
- Pemicu Arah dan Alasan jurnal stok tidak berlabel, berbeda dengan isian
  filter lain di baris yang sama (terlihat 14 November 2026). Selesai di
  `883a79b`: label "Arah" dan "Alasan", tanpa ikon corong (`modul/ui-ux.md`,
  CV15a).
#### Utang kecil dari pembelian stok

- Mutasi `PEMBELIAN` di buku mutasi kas belum bertaut ke detail
  pembelian, karena referensinya hanya membawa id, sedangkan rute detail
  bergantung pada ruang lokasi penerimanya (PS10a). Selesai 23 November
  2026 (`modul/keuangan.md`, TM1a).
- Izin per ruang menunggu backend (PS9a, `kontrak/temuan.md` butir 158).

### `jadwal-shift`

#### Utang kecil dari modul jadwal dan shift

- Hapus jadwal masih memakai `confirm` bawaan browser, berbeda dengan
  dialog konfirmasi di modul lain; spec kelola jadwal bergantung padanya
  (`page.once("dialog")`). Diseragamkan bila pemilik proyek memutuskan.
  Selesai di `0df0ca5`: dialog "Hapus jadwal?" (`modul/ui-ux.md`, CV4a).
- Shift outlet dan gudang masih memakai daftar tenant yang sama sampai
  backend memisahkan shift per lokasi (`KUNCI_LOKASI_SHIFT`, keputusan
  SH1b, `kontrak/temuan.md` butir 70). Selesai di `8b5ad0f` (B168).
- Query `?workspace=` pada `GET /shift` hanya penanganan sementara,
  karena backend menjawab 500 tanpa query apa pun (`kontrak/temuan.md`
  butir 8). Dibuang begitu backend diperbaiki (`features/shift/ruang.ts`).
  Sejak `8b5ad0f` web mengirim `locationID`; cabang `workspace` tinggal
  untuk konstanta null, dan dibuang di `7f6d623`.
- Pola roster outlet dan gudang masih memakai daftar tenant yang sama
  sampai backend memisahkannya per lokasi (`KUNCI_LOKASI_POLA_ROSTER`,
  keputusan PL5, `kontrak/temuan.md` butir 70). Selesai di `8b5ad0f`
  (B168).
- Ubah pola roster tetap gagal karena validator model backend
  (`test.fixme` di `inti/pengujian.md`); tombol ubah tetap ditampilkan dan
  galatnya diteruskan ke pengguna. Selesai di backend (B128); fixme
  dilepas di `ea2e752`.
- `keterangan` dan `dibuatPada` di `PolaRosterItem` masih opsional, walau
  halaman generate lama yang memetakan pola sendiri sudah tidak ada
  (`19227f8`); dijadikan wajib bersama perapian tipe berikutnya. Selesai
  di `7c004c2`: mapper backend selalu mengirim keduanya (null bila kosong).
#### Utang kecil dari penyesuaian backend `ridho` `0024eb9`

- Monitoring per lokasi tidak memuat staf yang izin (`kontrak/temuan.md`
  butir 165); baris izin di panel Status Staf disusun web dari karyawan
  ruang menurut peran sampai backend memuat libur karyawan lokasi itu.
  Sejak backend `916e7df` (B278) monitoring memuat staf yang izin bila
  lokasi kerjanya lokasi itu; tambahan web tetap untuk staf tanpa lokasi
  kerja.
- Widget absensi dan panel Status Staf memuat lokasi ruang, sehingga
  menuntut `read-location`, sedangkan gerbang panel dan halaman pengguna
  belum memeriksanya. Selesai di `b69d39a`: panel dipasang hanya dengan
  `read-location`, dan widget menampilkan pesan izin lokasi; jalur itu
  hanya teruji di unit test.
- Jalur role tanpa izin SDM baru (B139, B140) hanya teruji di unit test,
  karena akun uji berperan Owner. Teruji e2e sejak `2bcb1ce` lewat
  pengguna uji "E2E Tanpa SDM".
- Hapus jadwal masih `confirm` bawaan browser (utang di atas), dan sel
  yang berisi jadwal lokal sekaligus penanda lokasi lain tetap dapat
  dijadikan libur, yang menghapus jadwal lokasi lain (B165). Keduanya
  selesai di `0df0ca5`: Libur dinonaktifkan dengan keterangan, lewat klik
  sel dan Tambah Manual (`modul/ui-ux.md`, CV3a dan CV10a).
- Kolom Staf / Karyawan kalender jadwal selebar sekitar 460 px di 1280 px,
  sehingga hanya tiga hari yang terlihat tanpa gulir (terlihat 14
  November 2026); kalender menunggu pratinjau tersendiri (TB4a). Diukur
  462 px di 1280 px dan 362 px di HP, sehingga di HP tidak ada hari yang
  terlihat. Selesai di `883a79b`: dikunci 220 px mulai `md` dan 112 px di HP
  (`modul/ui-ux.md`, CV16a); tabel kalender lainnya tetap menunggu TB4a.

### `keuangan`

#### Utang kecil dari tombol Catat pembelian

- Isian tanggal filter Belanja Stok yang meluber di HP lunas 12 November
  2026 (BS6a, di bawah).
- Menu tunggal Pembelian Stok hanya aktif di sidebar pada daftarnya, tidak
  di detail dan form catat, seperti menu tunggal lain (`isActive` cocok
  persis). Selesai di `609b36a` untuk seluruh menu tunggal
  (`hrefMenuAktif`, `modul/ui-ux.md` CV2b).
#### Utang kecil dari modul keuangan

- Halaman pengeluaran menampilkan keterangan belum tersedia sejak
  `7fce871`, dan gate-nya masih `read-pembayaran`. Halamannya dibangun
  begitu backend memperbaiki izin beban dan menetapkan kontraknya
  (`kontrak/temuan.md` butir 130 sampai 132). Izinnya sudah diperbaiki
  (`yoga` `55328f1`); yang ditunggu tinggal butir 131 sampai 134 (NZ11a).
  Keempatnya diperbaiki di `7d28135` (RG6a), dan halamannya dijadwalkan
  setelah RG4a.
  Halamannya selesai di `1d7fa7b`, dengan gate `read-beban-operasional`.
- Tampilan halaman akun kas dan halaman ubah bagi pengguna tanpa
  `update-akunkas` belum teruji e2e (`inti/pengujian.md`), dan halaman ubah
  membaca akun dari cache daftar tanpa `GET /akunkas/:id`. Halaman ubah
  membaca `GET /akunkas/:id` sejak 23 November 2026, teruji
  `keuangan/ubah-akun-kas`.
- Label jenis mutasi saldo awal dan beban belum pernah tampil dengan data
  nyata. Tampilan mutasi transfer dan pembatalan transfer masuk teruji
  e2e sejak `f7805ca`; pembatalan transfer keluar hanya teruji di unit
  test. Selisih kas lebih dan kurang (B228, `d696354`) juga belum pernah
  tampil dengan data nyata, karena sesi kasir dibuka dari aplikasi; filter
  kedua jenis teruji e2e terhadap server.
- Tab Keuangan tampil bagi pengguna tanpa izin halamannya dan baru
  ditolak saat dibuka (`kontrak/temuan.md` butir 163). Selesai di
  `e051906`.
- Ringkasan Belanja Stok lebih dari satu halaman hanya teruji di unit
  test (`referensi/utang-pengujian.md`).
#### Utang kecil dari Mesin Kasir dan perbaikan HP Keuangan

- Halaman Akun Kas tenant uji menampilkan "Akun non-aktif (518)"
  (tangkapan layar pemilik proyek, 6 November 2026). Asalnya belum
  ditelusuri; dugaan awal, akun uji spec Keuangan yang dinonaktifkan
  karena `DELETE /akunkas/:id` tidak ada lagi (`kontrak/temuan.md`
  butir 81). Ditelusuri 14 November 2026 lewat kueri baca-saja: kini 663,
  seluruhnya akun bernama awalan "E2E" (Ubah Kembar 146, Keuangan Akun 97,
  Ubah Status 73, Pindah Tujuan dan Pindah Sumber masing-masing 68, Tutup
  Bersaldo 64, dan seterusnya). Bukan bug tampilan; tetap utang pengujian
  (`referensi/utang-pengujian.md`, akun kas uji menumpuk).
  Penumpukan dihentikan 23 November 2026 lewat akun uji tetap (AU1a).
- Tab Keuangan memakai `focus-visible:ring-0`, sehingga tab tidak punya
  penanda fokus saat dipakai dengan keyboard. Dipertahankan di
  `b3f8698` karena tidak ada di pratinjau yang disetujui. Gugur di
  `7b90716`: bar tab Keuangan dibuang (SK2a). Kelas yang sama di tab
  navigasi Inventaris dan Reservasi diganti cincin fokus di `883a79b`
  (`modul/ui-ux.md`, CV18a).
- Keadaan memuat, gagal dimuat, sesi lintas tengah malam, Muat hari
  sebelumnya, serta posisi panel di HP dan desktop tidak lagi teruji e2e
  sejak spec pratinjau dihapus di `b74f30a` (daftar periksa nomor 6);
  spec alur nyata hanya memeriksa tanpa gulir ke samping di HP
  (`referensi/utang-pengujian.md`).
- `kontrak/temuan.md` butir 172 sampai 174, K-18, dan K-19 tetap
  terbuka di backend; web menanganinya seperti sebelum penyambungan
  (MK3a, MK5a, dan `NAMA_MESIN_TANPA_DAFTAR`). Selesai di backend
  `4a19be8` (B334 sampai B337), dan web memakainya di `e1ea235` (MK3b,
  MK5b, MK6b).

### `panel-admin`

#### Utang kecil dari modul panel admin

- Daftar akun dimuat seluruhnya tanpa paginasi, dan halaman detail serta
  halaman ubah membaca akun dari cache daftar, karena backend tidak punya
  endpoint detail maupun daftar yang dapat dipotong (`kontrak/temuan.md`
  butir 119). Diganti begitu endpoint-nya ada. Selesai di `25aa498` dan
  `1ccf0ef` (B176, B177).
- Dialog aktifkan mewajibkan durasi untuk akun tanpa masa akses, mengikuti
  backend (`durasiWajibSaatAktifkan`, `kontrak/temuan.md` butir 115);
  disesuaikan begitu makna masa akses kosong diputuskan. Selesai di
  `482ac79` (B154).
- Password admin yang salah saat hapus dijawab 401, sehingga klien
  menyegarkan token lalu mengulang `DELETE` (butir 114); web menampilkan
  pesannya tanpa penanganan sementara. Sejak B150 dijawab 400.
- Kepala panel admin tidak menampilkan identitas admin yang sedang masuk,
  karena token akun tidak membawa email, dan tampilannya masih sederhana
  dengan token tema; layout dan UI/UX-nya menunggu keputusan pemilik proyek.
  Selesai 24 November 2026: email dari `GET /akun/me` di topbar (RP1a).
#### Utang kecil dari penyesuaian backend `ridho` `0024eb9`

- Perpindahan halaman daftar akun belum teruji e2e: skenarionya
  dilewati selama data uji berisi tidak lebih dari 10 akun.

### `pengaturan-outlet`

#### Utang kecil dari modul Pengaturan outlet

- Form buat dan ubah metode pembayaran bergantung pada `read-akunkas`
  untuk pilihan akun tujuan, walau backend hanya mewajibkan izin create
  atau update metode; tanpa izin itu form menampilkan pesan gagal memuat.
  Diputuskan bila ada role yang membutuhkannya
  (`kontrak/izin-halaman.md`). Diputuskan 23 November 2026 (MP1a).
- Tab pajak per produk tidak dapat menampilkan relasi ke pajak nonaktif,
  karena backend tidak mengirimnya (`kontrak/temuan.md` butir 93), sehingga
  produk itu tampak tanpa pajak dan konfirmasi ganti tidak muncul.
  Tertutup di `ed4bfd3`: relasi itu tampil bertanda (RH4a).
- Wewenang yang namanya tidak punya padanan id di daftar permission
  dibuang diam-diam saat form role menyusun payload (`payloadBuatRole`),
  dan teks tombol simpan form role tetap "Simpan Perubahan" saat membuat
  posisi baru; keduanya dipertahankan dari form lama (`597a163`).
  Keduanya ditutup 14 November 2026: tombol mode buat "Buat Posisi" di
  `0df0ca5` (CV6a), dan pembuangan wewenang dinilai bukan bug, karena
  daftar centang dan wewenang tersembunyi berasal dari daftar permission
  utuh (CV7a; `modul/ui-ux.md`).

### `penjualan`

#### Utang kecil dari modul penjualan dan pembayaran

- Tipe berakhiran `Lama` (`inti/keputusan-rancangan.md` butir 19) habis sejak `1e05df6`:
  `PelangganLama` dihapus di `d9365d3` dan `DiskonLama` di `1e05df6`.
  Riwayatnya: tipe itu dipakai halaman lama lewat alias impor, dan masing-masing
  dihapus di commit migrasi modul pemiliknya. Sisanya dihitung dengan
  `grep -rhoE 'export interface [A-Za-z]+Lama\b' types | wc -l` (2 per
  `e0aaeca`, yang menghapus `PajakLama`, `ProdukPajakRelasiLama`, dan
  `PajakDariProdukLama`; 5 per `3359497`, yang menghapus `AkunKasLama`,
  `AkunKasRefLama`, dan `MetodePembayaranLama`, dan pesan commit itu
  keliru menyebut enam). Per `d9365d3` tersisa 1, dan per `1e05df6` 0.
- `features/penjualan/halaman-buat-penjualan.tsx` 698 baris per BP1a (dipecah di `584d6ae`; 1.098 per `7a08b63`):
  migrasi memindahkan lapisan data dan membuang `any`, tetapi tidak memecah
  komponennya. Pisahkan pemilih pelanggan, pemilih diskon, dan pratinjau
  total saat halaman itu disentuh lagi. Selesai di `7c004c2`: kartu
  Pelanggan, kartu Diskon Global dan Keterangan, dan `pilihan-diskon.ts`
  dipisah; halaman 438 baris (ringkasan tagihan sudah terpisah).
- Dua `test.fixme` di spec alur penjualan menunggu backend, keduanya
  untuk cache daftar jurnal (`kontrak/temuan.md` butir 46). Yang ketiga
  (butir 37) dilepas di `a17d584` setelah backend `fc29433`.
  Keduanya dilepas di `936f073`.
- Filter tanggal daftar penjualan tidak dapat dikosongkan langsung,
  karena `PilihTanggal` tidak punya tombol kosongkan; filter dikosongkan
  lewat reset filter. Selesai di `0df0ca5`: tombol Kosongkan di kalender
  (`modul/ui-ux.md`, CV5a).

### `profil-login`

#### Utang kecil dari modul Profil, login, dan sidebar

- Bila `POST /pengguna/pin-logout` gagal, logout tetap mengakhiri sesi
  lokal dan memutus sesi akun, tetapi cookie refresh pengguna tetap
  berlaku di backend, sehingga membuka `/dashboard` lagi di browser yang
  sama memulihkan sesi pengguna itu (suite penuh 7 November 2026, skenario
  logout gagal di `auth/sidebar-pengguna.spec.ts`). Jalur refresh web
  `penggunaDeviceService.refreshToken` backend `ridho` `1584222` (baris
  683 sampai 707) hanya memeriksa JWT refresh pengguna, `tokenVersion`
  pengguna, dan status akun aktif (`_assertAkunAktif`, baris 32), tidak
  sesi akun. Cookie itu httpOnly dan tidak dapat dihapus web. Pemilik
  proyek memutuskan melaporkannya ke backend (7 November 2026,
  `kontrak/temuan.md` butir 177). Selesai di backend `ridho` `4a19be8`
  (B343, P82): logout akun ikut memutus sesi pengguna web; dibuktikan
  `auth/sidebar-pengguna.spec.ts` 16 November 2026 (dicatat ulang
  23 November 2026).
- Tombol hapus akun di halaman profil tampil nonaktif (PF2a) sampai
  backend punya jalur hapus akun sendiri bagi Owner (`kontrak/temuan.md`
  butir 112). Backend menyediakannya di B181; selesai 13 November 2026
  lewat OA5a dan OA8a: Zona Bahaya profil dibuang, dan hapus akun berada
  di halaman Akun Toko (`modul/setup-akun.md`).
- Halaman ringkasan laba rugi memicu peringatan ukuran grafik di konsol
  (lebar dan tinggi -1 saat render pertama). Penyebabnya belum ditelusuri
  dari kode, dan grafiknya tetap tampil. Sejak `0c5822b` komponen grafik
  yang sama (`GrafikLaporan`) juga dipakai dashboard outlet. Selesai di
  `609b36a`: `ResponsiveContainer` recharts 3.8 memulai ukuran dari
  `initialDimension` -1 x -1; kini 1 x 1 (`modul/ui-ux.md`, CV2b).

### `reservasi`

#### Utang kecil dari modul reservasi

- Sebutan di pesan form tipe aset berbeda: "Kategori Aset" di halaman
  buat dan "Tipe Aset" di halaman edit. Dipertahankan di `074e98c` karena
  teks yang dilihat pengguna; penyeragamannya menunggu keputusan pemilik
  proyek. Selesai 23 November 2026: "Kategori Aset" (KA1a).
- Halaman buat dan edit tarif masih berbeda tampilan: `<select>` bawaan
  dan harga polos di buat, Radix Select dan harga berformat ribuan di
  edit. Penyatuan ke satu form ditunda (keputusan T1a). Selesai
  23 November 2026 (TF1a).

### `setup-akun`

- Wizard: isian kategori, bahan baku, atau produk yang belum disimpan
  dengan tombol "Tambah ..." atau "Simpan produk" tidak ikut terkirim
  oleh "Simpan dan lanjut", dan galatnya hanya menyebut daftar kosong
  (ditemukan pemilik proyek, 5 November 2026). Diantrikan di
  `inti/status.md` (Pekerjaan berikutnya, Menunggu desain pemilik
  proyek): penanda tombol yang harus ditekan lebih dulu, dan pemandu UI
  setelah wizard selesai. Selesai di `58d7eb9` (penanda, PN1a) serta
  `c8a2e83` dan `5c3da45` (tur wizard dan dashboard, PN2a sampai PN4a).
- Nama toko dan email akun belum dapat ditampilkan di login pengguna,
  karena token akun tidak memuatnya dan `GET /tenant/:id` menolak token
  akun (`kontrak/temuan.md` butir 167, diserahkan ke Yoga). Selesai lewat
  `GET /akun/me` (B240): panel login pengguna menampilkan keduanya sejak
  `19498b7` (TP2b).
- Tautan "Daftar" dan "Lupa password?" di login akun dipasang setelah N3,
  N4, dan Y1 tersedia; sampai itu `/daftar`, `/daftar/verifikasi`,
  `/lupa-password`, dan `/setup` hanya dapat dibuka langsung.
  "Lupa password?" terpasang di `67ec690`; "Daftar" menunggu wizard
  tersambung, karena daftar berakhir di `/setup`. "Daftar" terpasang di
  `4322dba` setelah wizard tersambung.
- Permission langganan belum ada di backend (LG2a). Usulan: permission
  baca langganan yang dimiliki Owner, diserahkan bersama N1; sampai itu
  web membatasi lewat role.
  Selesai di `c868870`: backend menyediakan `read-langganan` (B229), dan
  halaman serta kartunya bergerbang izin itu.
- Kuota `registerLimiter` di backend development (Fakta backend) membuat
  spec daftar dilewati bila spec auth diulang dalam 15 menit (`d94a48c`).
  Usulan: batasnya dapat dilonggarkan lewat env di backend non-produksi,
  seperti batas OTP di N5. Tersedia sebagai `REGISTER_LIMIT_MAX` (B230)
  dan disetel di perintah layanan uji (`inti/pengujian.md`).
- Halaman pratinjau disambungkan ke backend di chat berikutnya
  (`inti/status.md`, Pekerjaan berikutnya): data contoh dan spanduk
  pratinjau dibuang halaman demi halaman begitu endpoint-nya tersedia.
  Daftar, verifikasi email, dan lupa password tersambung di `67ec690`,
  dan Langganan di `c868870`; wizard masih pratinjau.
- Panel admin belum mengenal plan (B213), dan riwayat langganannya
  menampilkan aksi `ubah-plan` tanpa label (`inti/status.md`). Selesai di
  `475bf0b` dan `468a3bd`.
- Langkah jam buka (JB1a sampai JB7a) belum tersambung: tampilannya hanya
  di rute pratinjau `/setup/pratinjauJamBuka`, menunggu kontrak jam per
  hari dari backend (`kontrak/temuan.md` butir 176). Selesai di
  `46d90e1` (JB8a), dan pratinjaunya dihapus di `1171f33`.
- WS6a belum diterapkan: ringkasan tersimpan lokasi outlet, sesi booking,
  dan gudang masih bertautan (`kontrak/temuan.md` butir 175). Selesai di
  `daf9e3a`.
- Ruang gudang belum punya tur (PN4a). Menunya berbeda dari ruang outlet
  (Petugas Gudang, Pengaturan Gudang), sehingga titik dan teksnya
  diajukan ke pemilik proyek lebih dulu. Selesai 17 November 2026 (TG1a,
  TG2a).
- Langkah jam buka belum punya tur, karena teksnya belum diusulkan.
  Selesai di `0c4cc7e` (JB9a).
- Pemakaian jam buka di shift dan jadwal belum diputuskan pemilik proyek
  (JB8a, 16 November 2026). Selesai di `fddb3c6` (JO1a, JO2a).

### `ui-ux`

#### Utang kecil dari fase UI/UX 11 Oktober 2026

- Label sel di HP hanya tampil bila kolom punya `meta.label` atau `header`
  berupa teks. Sebagian besar halaman menulis `header` sebagai komponen,
  sehingga kartu baris di HP menampilkan nilai tanpa label. Dilengkapi
  saat tiap halaman dirapikan. Selesai di `ceb8c95` (CV20a): 43 kolom di
  13 halaman diberi `meta.label`.
- 9 berkas masih memakai `<table>` yang ditulis sendiri (19 sebelum K-A,
  per `eb81a1f`; seluruh tabel daftar selesai di K-A sampai K-E): tabel
  rincian di halaman detail dan form (delapan berkas, termasuk
  `features/jadwal/langkah-dua.tsx`), dan kalender jadwal
  (`features/jadwal/grid-jadwal.tsx`), yang perlu pratinjau tersendiri
  (keputusan TB4a). Sampai 16 Oktober 2026 daftar aset, tarif, tipe aset,
  dan pola roster tersirat masuk tabel rincian, padahal keempatnya tabel
  daftar (RG3a). Tabel rincian selesai di `eb64c70` (CV22a): delapan
  berkas memakai `DataTable rincian`. Tersisa grid kalender jadwal dan grid
  langkah 2 generate jadwal (CV23a), keduanya menunggu pratinjau TB4a.
- Daftar akun admin dan tab pajak per produk
  (`features/pajak/tab-pajak-produk.tsx`) belum ditinjau terhadap aturan
  tabel yang baru. Tab pajak per produk selesai 20 November 2026 (PP1a);
  daftar akun admin ikut rombak UI/UX laman admin (`inti/status.md`).
- Dashboard gudang (`app/dashboard/gudang/page.tsx`) masih placeholder.
  Selesai di `06581f3` dan `50dca2f` (`modul/gudang.md`): halamannya kini
  memasang `HalamanDashboardGudang`.
- Layout dan tampilan panel admin masih menunggu fase ini (Utang kecil
  dari modul panel admin).
- Lonceng notifikasi nonaktif sampai ada sumber datanya (DB4a), dan status
  alpha staf ditunda (DB3a). Lonceng aktif sejak 12 November 2026 sebagai
  pusat pemberitahuan pengingat masa langganan (`modul/setup-akun.md`,
  TP8a); status alpha staf tetap ditunda.
- Sisa 68 warna heksadesimal belum menjadi token: konstanta palet lokal di
  tiga halaman reservasi dan tarif (termasuk `#FFFAF399` yang memakai
  akhiran alfa), warna grafik di `features/laporan/grafik-laporan.tsx`,
  dan warna di luar lima warna utama. Tipografi dan spasi juga belum.
  Sejak `eb81a1f` tabel dan baris filter tarif memakai token, dan
  `COLORS` di daftar tarif tinggal tiga warna untuk dialog hapus (TB23a);
  angka 68 belum diukur ulang. Selesai di `c437d68` (CV21a): tidak ada
  heksadesimal tersisa di `app`, `components`, `features`, dan `lib` selain
  `lib/warna.ts`. Tipografi selesai di `5e597c2` (CV24a sampai CV26a);
  spasi dicatat sebagai aturan (keputusan rancangan butir 35, CV27b), dan
  seluruh pembungkus halaman diseragamkan 18 November 2026 (SP1a). Diukur
  ulang 18 November 2026: 41 kemunculan, yaitu 36 definisi token di
  `app/globals.css` dan 5 selektor bawaan shadcn di
  `components/ui/chart.tsx`.
- Pemindaian 768 px (14 November 2026): hampir 20 tabel daftar lebih lebar
  dari wadahnya di lebar tablet (misalnya Produk +167, Stock Adjustment
  +245, Penjualan +179, Tarif +184 px), karena kartu HP baru aktif di
  bawah 640 px sedangkan wadah tabel dengan sidebar sekitar 600 px; luberan
  halaman di Barang Gudang (+18) dan Pengajuan Stok outlet (+48); dan
  label kartu Arus Kas terpotong. Perbaikannya keputusan desain (batas
  kartu DataTable atau kolom per tabel). Selesai 17 November 2026 (LT1a
  sampai LT5a, Luberan tabel 768 px).
- Pemindaian 390 px (17 November 2026, sudah ada sebelum LT1a, dibuktikan
  dengan `git stash`): tabel Pembelian Stok outlet lebih lebar 10 px dari
  wadahnya (276 dan 266), halaman Produk +22 px, dan Buat Reservasi +18 px.
  Selesai 17 November 2026 (LT7a sampai LT10a, Luberan HP 390 px).
- Mode kartu LT1a lengket saat isi berubah tanpa mengubah kunci ukur
  ulang (jumlah baris, halaman, ukuran, status muat, kolom): misalnya
  pencarian di daftar berhalaman server yang tetap memberi 10 baris di
  halaman 1 tetap kartu sampai wadah berubah lebar. Selesai 17 November
  2026: id baris pertama dan terakhir ikut di kunci (`kunciUkurUlang`);
  isi di tengah halaman yang berubah tanpa mengubah kedua ujungnya tetap
  tidak terdeteksi, dan itu diterima.
- Pesan "Gagal Memuat Lokasi Gudang" dan "Gudang Belum Didaftarkan" di
  `app/dashboard/gudang/jurnalStok/page.tsx` tidak pernah tampil, karena
  layout ruang gudang menghadang lebih dulu (kode mati). Dihapus
  17 November 2026 bersama pola yang sama di Pembelian Stok gudang (KM1a,
  pemilik proyek): kedua halaman memakai kunci query lokasi yang sama
  dengan layout, yang memeriksa galat dan gudang yang belum ada lebih
  dulu, termasuk saat muat ulang gagal dengan data lama. Tampilan tidak
  berubah; spec `lihat-jurnal-stok` tetap memeriksa pesan layout.
- Temuan pemindaian 14 November 2026 yang dibiarkan karena dirancang:
  kalender jadwal dan deretan tab bergulir ke samping; keterangan Mutasi
  Kas di kartu HP dan nama aset di timeline reservasi dipotong "...".
  Aksi riwayat Pindah Dana yang masih tombol Batalkan dan tab Manajemen
  Booking yang tidak menandai tab mana pun di Buat Reservasi selesai di
  `883a79b` (CV17a, CV18a).
- `inventaris-nav-tabs.tsx` di rute inventaris outlet tidak dipasang di halaman mana pun (kode mati; ditemukan 14 November
  2026 saat menerapkan CV18a). Dihapus 14 November 2026 atas keputusan
  pemilik proyek (CV19a).
- Bayangan kartu baris memakai `filter` pada elemen `tr`. Di browser yang
  tidak mendukungnya, kartu tampil dengan bingkai saja. Selesai
  23 November 2026 (BB1a).
- Suite e2e penuh dijalankan ulang pada 16 Oktober 2026 terhadap backend
  `ridho` `7d28135` (Catatan dari penyesuaian backend `ridho` `7d28135`);
  harapan sesudahnya 456 lolos dan 13 skipped. Suite penuh terakhir
  18 Oktober 2026 (`eb81a1f`): 461 lolos dan 13 skipped; harapan
  sesudah `20c026b` 462 lolos dan 14 skipped.
