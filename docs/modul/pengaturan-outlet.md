# Modul Pengaturan Outlet

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul Pengaturan outlet

Diputuskan pemilik proyek pada 30 September 2026, dengan prinsip
keputusan rancangan butir 17 dan 21. PO1a sampai PO5a diterapkan di
`3359497` (submodul metode pembayaran), dan PO6a sampai PO9a di
`e0aaeca` (submodul pajak). PO11a diterapkan di `366e9b7`, dan PO12a
sampai PO14a diputuskan pada 1 Oktober 2026 untuk submodul profil outlet
dan diterapkan di `fcf2dd2` bersama PO15a; PO16a diterapkan di `ca6eb3d`.

- **PO1a: tiga submodul berurutan**, masing-masing dengan spec pembanding,
  migrasi, commit, dan dokumen penutup sendiri: metode pembayaran, pajak,
  lalu profil outlet. Profil outlet memakai `IsianLokasi` dan
  `usePerbaruiLokasi` dari `features/inventaris`, dan `urlSetup` form buat
  stock opname outlet diarahkan ke halamannya.
- **PO2a: hapus metode pembayaran diganti aktifkan dan nonaktifkan** dari
  menu daftar, lewat dialog yang hanya tertutup saat berhasil, karena
  backend tidak punya `DELETE` (`kontrak/temuan.md` butir 82). Status
  tetap dapat diubah di form ubah. Halaman kelola memakai `showAll=true`.
- **PO3a: batas 10 metode aktif ditahan di klien**, dihitung dari daftar
  kelola: tombol Tambah dan menu Aktifkan nonaktif beserta keterangan, dan
  pilihan Aktif di form nonaktif. Jawaban 409 backend tetap ditampilkan.
  Sejak `3b4f35b` tombol Tambah tetap hidup saat batas tercapai (NZ5a).
- **PO4a: badge Default, kolom Sistem, kotak centang gateway Xendit, dan
  field gateway di tipe web dibuang.** Badge ditebak dari nama tanpa
  konsep backend, dan gateway tidak dipakai (`kontrak/temuan.md` butir 78).
- **PO5a: menonaktifkan metode aktif terakhir diberi peringatan** di
  dialog tanpa ditahan, karena backend tidak menahannya
  (`kontrak/temuan.md` butir 87).
  Diganti NZ4a (`3b4f35b`): backend kini menolaknya, dan web menahannya.
- **PO6a: satu pajak per produk.** Tab pajak per produk menampilkan satu
  pajak terpasang, memasang pajak lain menggantinya lewat konfirmasi yang
  menyebut pajak lama, dan hanya pajak per produk yang aktif yang
  ditawarkan, karena backend menyimpan relasi lewat upsert per produk.
  Relasi ke pajak nonaktif tampil bertanda sejak `ed4bfd3` (RH4a).
- **PO7a: menyimpan pajak per transaksi yang aktif diberi peringatan**
  yang menyebut pajak per transaksi aktif yang akan dinonaktifkan backend.
- **PO8a: prioritas pajak berupa pilihan 1 atau 2**, sesuai validator;
  tarif kosong ditolak form (sejalan T3b), 0 yang diketik tetap sah,
  batasnya 0 sampai 100, dan nama dipangkas.
- **PO9a: hapus pajak tetap ada**, dengan peringatan bahwa relasi produk
  ikut dilepas dan pajak hilang dari penjualan berikutnya; dialog hanya
  tertutup saat berhasil.
- **PO10a: data uji.** Metode uji "E2E Metode Uji" dibuat sekali di akun
  kas yang sudah dipakai metode tunai bawaan, disimpan nonaktif, lalu
  diubah dan dikembalikan tiap test; buat sungguhan bernama unik lalu
  dinonaktifkan. Akun kas uji spec keuangan tidak dipakai, karena metode
  yang menunjuk sebuah akun mengunci akun itu dari penonaktifan. Pajak uji
  per produk dibuat lalu dihapus lewat UI (`9586e3c`, `e0aaeca`), dan
  dipasang pada produk uji khusus "E2E Pajak Produk" yang dibuat sekali,
  karena memasang pajak menimpa relasi produk itu; pajak per transaksi yang
  aktif hanya diuji lewat `POST` yang dijawab gagal, agar `PPN` tenant uji
  tidak dinonaktifkan.
- **PO11a: lima permission template role yang tidak ada di seed dibuang**
  (`delete-pembayaran`, `delete-diskon`, `delete-akunkas`,
  `delete-metode-pembayaran`, dan `delete-booking`) dalam commit
  tersendiri, setelah perlakuan `POST /role` atas nama izin yang tidak
  dikenal dipastikan. Diterapkan di `366e9b7`: backend menolak nama yang
  tidak dikenal dengan 400, sedangkan halaman template dan form role
  membuangnya diam-diam sebelum mengirim, sehingga yang terdampak hanya
  badge jumlah wewenang.
- **PO12a: Profil Toko memuat profil tenant dan lokasi Outlet** (1 Oktober
  2026), dalam dua kartu dengan simpan masing-masing: profil toko lewat
  `PUT /tenant/:id`, dan lokasi Outlet lewat `IsianLokasi` dan
  `usePerbaruiLokasi`, melengkapi PO1a.
- **PO13a: `persenPajak`, `tipePajak`, `logoUrl`, dan `isSetupComplete`
  tidak ditampilkan.** Pajak tenant tidak dipakai backend di luar model
  dan mapper (pajak penjualan lewat modul pajak), logo hanya teks tanpa
  unggah, dan flag setup dapat diubah klien. Ketiganya dilaporkan bersama
  submodul profil outlet.
- **PO14a: halaman tanpa entri `IZIN_HALAMAN`, dengan izin per bagian.**
  Profil tenant dibaca semua pengguna dan diubah pemegang `update-tenant`;
  lokasi dimuat bagi pemegang `read-location` dan diubah bagi pemegang
  `update-location`, baca-saja selain itu (sejalan GD2a). Sejak `bc388c6`
  entrinya ditulis eksplisit kosong, agar gerbang rute tidak menolaknya.
- **PO15a: nama toko di sidebar dan halaman profil dibaca dari
  `GET /tenant/:id`** (2 Oktober 2026, `fcf2dd2`), lewat `useTenant` yang
  berbagi cache dengan halaman Profil Toko, sehingga nama ikut berubah
  setelah profil disimpan. `tenantName` di token tidak dipakai lagi,
  karena menjadi "Toko Tidak Diketahui" setelah `pin-refresh`
  (`kontrak/temuan.md` butir 98). Hanya pembacaan nama toko yang
  disentuh di sidebar dan halaman profil, seperti GD5a.
- **PO16a: effect sidebar mengikuti sesi, sebagai commit tersendiri**
  (2 Oktober 2026, `ca6eb3d`) sebelum profil toko. Effect yang menyalin
  nama, role, dan izin berdependensi `[]` dan keluar selama sesi belum
  pulih, sehingga setelah muat ulang menu berizin hilang sampai login
  ulang. Spec muat ulang ditulis lebih dulu dan dibuktikan gagal terhadap
  kode lama. Sisa sidebar tetap untuk modul Profil, login, dan sidebar
  (selesai di `57a7084`, keputusan PF4a).
- Diterapkan tanpa ditanyakan (`3359497`): ubah hanya mengirim field yang
  berubah (butir 15), sehingga akun lama yang sudah nonaktif tidak
  menggagalkan penggantian nama; akun nonaktif milik metode tampil
  bertanda "(nonaktif)" seperti PL1a; tombol mengikuti izin create dan
  update (butir 14); detail yang gagal dimuat atau tidak ditemukan
  menampilkan pesan; form memakai React Hook Form dan Zod dengan nama
  dipangkas dan paling banyak 100 karakter; menu Edit memakai `onSelect`
  dan `router.push`; dan mutation memakai `mutate` beserta callback,
  sehingga penolakan backend tidak menjadi unhandled rejection.
- Diterapkan tanpa ditanyakan (`e0aaeca`): ubah pajak hanya mengirim field
  yang berubah ditambah `tipePajak`, karena validator backend mewajibkannya
  juga pada update (`kontrak/temuan.md` butir 91; dicabut NZ12a di
  `50e6485`); simpan ubah nonaktif
  selama tidak ada perubahan; kolom Status tab pajak per produk dibuang,
  karena backend tidak mengirimnya dan relasi ke pajak nonaktif sudah
  disaring; galat memuat tampil di tempat dengan tombol coba lagi; tombol
  aksi baris ber-`aria-label`; teks tombol, label, dan tab lama
  dipertahankan agar spec pembanding tetap berlaku; dan tidak ada tombol
  yang disembunyikan menurut izin, karena route pajak tanpa
  `checkPermission` (butir 5). Butir terakhir berubah di `d3443e2`: sejak
  backend `fc29433` route pajak memeriksa izin, dan tombolnya mengikuti
  (keputusan FC3a).
- Diterapkan tanpa ditanyakan (`fcf2dd2`): ubah profil toko hanya mengirim
  field yang berubah (butir 15), dan field yang dikosongkan dikirim
  sebagai teks kosong; setiap isian dipangkas, nama toko minimal 3
  karakter, dan email diperiksa bentuknya bila diisi, sesuai validator
  backend; simpan nonaktif selama form belum berubah; kedua form dipasang
  ulang lewat `key` berisi id dan `updatedAt` (butir 8); `IsianLokasi`
  menerima teks per tipe lokasi, dengan bawaan gudang; `BuatTokoRequest`
  dan `BuatTokoResponse` dibuang karena tidak punya pemakai; dan spec
  pembanding tidak ditulis karena halaman lama hanya placeholder.
  Diputuskan saat pemetaan (1 Oktober 2026) dan diterapkan di commit yang
  sama: tenant tanpa outlet (`/location/current` menjawab null)
  menampilkan pesan di kartu lokasi, sejalan GD4a, karena setup outlet
  urusan onboarding lewat aplikasi; frasa "jam operasional" dibuang dari
  kartu indeks pengaturan, karena tidak punya field; dan tipe `Tenant`
  dipindah ke `id` (keputusan rancangan butir 1).

## Catatan

### Catatan dari submodul profil outlet

Submodul 3 modul Pengaturan outlet selesai pada 2 Oktober 2026 dalam dua
commit: perbaikan menu sidebar setelah muat ulang (`ca6eb3d`) dan halaman
Profil Toko (`fcf2dd2`). Dengan itu modul Pengaturan outlet selesai.

- Lapisan data di `features/tenant` (`referensi/arsitektur.md`). Halaman memuat dua
  kartu dengan simpan masing-masing: profil tenant, dan lokasi Outlet
  lewat `IsianLokasi` (keputusan PO12a sampai PO14a).
- Token hasil `pin-refresh` membawa `tenantName` "Toko Tidak Diketahui"
  (`kontrak/temuan.md` butir 98), sehingga nama toko di sidebar dan
  halaman profil dibaca dari `GET /tenant/:id` (PO15a). Token tetap
  membawa role dan seluruh izin.
- Menu berizin dan nama pengguna di sidebar hilang setelah halaman dimuat
  ulang, karena effect sidebar hanya berjalan sekali sebelum sesi pulih.
  Itu bug frontend, diperbaiki di `ca6eb3d` (PO16a). Spec generate jadwal
  ikut dikoreksi, karena selama ini lolos berkat kaki sidebar yang kosong
  (`referensi/playwright.md`, Catatan Playwright).
- Spec pembanding tidak ditulis, karena halaman lama hanya placeholder;
  ketujuh skenario ditulis bersama migrasi, seluruhnya lewat UI
  (keputusan rancangan butir 23).
- `urlSetup` form buat stock opname outlet kini menuju halaman Profil
  Toko, dan frasa "jam operasional" dibuang dari kartu indeks pengaturan.
- Payload token pengguna tidak membawa `nama`, sehingga nama pengguna di
  sidebar bergantung pada `GET /pengguna/:id`. Endpoint itu sempat dicatat
  mewajibkan `read-pengguna`; ternyata backend meloloskan diri sendiri
  tanpa izin itu (dibuktikan di `091be4e`).
- Temuan backend baru: butir 98 sampai 103, dilaporkan 2 Oktober 2026
  (`arsip/laporan-backend.md`). Kontrak tenant ditambahkan ke `kontrak/endpoint.md`,
  `kontrak/payload.md`, dan `kontrak/izin-halaman.md`.

### Catatan dari PO11a

Diterapkan pada 1 Oktober 2026 (`366e9b7`), sebelum penyesuaian `yoga`
dan submodul profil outlet (keputusan PY2a).

- Lima permission yang tidak ada di seed backend dibuang dari template
  Manajer dan General Manajer di `lib/roleTemplates.ts`. Silang seluruh
  nama izin template terhadap `seeds/permissionSeed.js` backend: tidak
  ada lagi nama di luar seed.
- `POST /role` menolak nama izin yang tidak dikenal (400), tetapi halaman
  buat posisi dari template dan form role selalu mengirim id dan membuang
  nama tanpa padanan diam-diam. Dampak yang terlihat hanya badge
  "N Wewenang" yang lebih besar daripada izin tersimpan.
- Basis data development masih memuat kelima permission lama dan belum
  memuat tiga izin jurnal transfer, karena seed `465b438` belum dijalankan
  ulang. Diselaraskan langsung (keputusan PY3a, `inti/backend.md`),
  dan temuannya dicatat di `kontrak/temuan.md` butir 97.

### Catatan dari submodul pajak

Submodul 2 modul Pengaturan outlet selesai pada 1 Oktober 2026: spec
pembanding (`9586e3c`), migrasi (`e0aaeca`), dan pelurusan komentar
invalidasi (`b84de56`). Tidak ada lagi halaman pajak yang memakai
`apiClient`, dan delapan tipe pajak lama dihapus.

- Lapisan data dan komponen di `features/pajak` (`referensi/arsitektur.md`). Buat
  penjualan tetap memakai `useDaftarPajak`.
- Seluruh operasi di kedua spec pajak berjalan lewat UI (keputusan
  rancangan butir 23), dengan helper bersama di
  `tests/helpers/pajak-uji.ts`. Aturan ini menemukan form buat lama yang
  menahan submit sampai prioritas diketik.
- `pajakList` di respons produk tidak mencerminkan pajak per produk yang
  dipasang, karena dibentuk dari field `pajak` dokumen produk, bukan dari
  relasi (`kontrak/temuan.md` butir 88); web tidak menampilkannya.
- Temuan backend baru: butir 88 sampai 96, dilaporkan 1 Oktober 2026.
- Kontrak pajak dan produk pajak dikoreksi terhadap `465b438`
  (`kontrak/payload.md`, `kontrak/endpoint.md`).
- Suite penuh `e0aaeca` sempat gagal di spec pembanding metode pembayaran,
  karena metode uji yang menumpuk mendorong `CASH` ke halaman kedua tabel;
  spec itu kini mencari lewat kotak pencarian (`cc65d93`).
- Keputusan pemilik proyek: `modul/pengaturan-outlet.md` (Modul Pengaturan outlet, PO6a
  sampai PO10a, dan keputusan rancangan butir 23).

### Catatan dari submodul metode pembayaran

Submodul 1 modul Pengaturan outlet selesai pada 1 Oktober 2026: spec
pembanding (`9ca273a`) dan migrasi (`3359497`). Tidak ada lagi halaman
metode pembayaran yang memakai `apiClient`, dan hapus diganti aktifkan dan
nonaktifkan (keputusan PO2a).

- Lapisan data di `features/metode-pembayaran` (`referensi/arsitektur.md`). Pilihan
  kasir di pembayaran penjualan tetap memakai metode aktif saja, sedangkan
  halaman kelola memakai `useDaftarMetodePembayaran({ semua: true })`.
- Butir 84 dan bagian metode pembayaran butir 82 selesai. Temuan backend
  baru: butir 85 sampai 87, serta perluasan butir 77 (`kontrak/temuan.md`).
- Kontrak `PUT /metodepembayaran/:id` dikoreksi terhadap `465b438`
  (`kontrak/payload.md`).
- Keputusan pemilik proyek: `modul/pengaturan-outlet.md` (Modul Pengaturan outlet, PO1a
  sampai PO5a dan PO10a).

## Utang terbuka

### Utang kecil dari modul Pengaturan outlet

- Form buat dan ubah metode pembayaran bergantung pada `read-akunkas`
  untuk pilihan akun tujuan, walau backend hanya mewajibkan izin create
  atau update metode; tanpa izin itu form menampilkan pesan gagal memuat.
  Diputuskan bila ada role yang membutuhkannya
  (`kontrak/izin-halaman.md`).
- Enam tipe aset uji tertinggal sebagai bukti butir 77
  (`kontrak/temuan.md`), dan dihapus lewat API setelah laporan backend
  diterima.
- Tab pajak per produk tidak dapat menampilkan relasi ke pajak nonaktif,
  karena backend tidak mengirimnya (`kontrak/temuan.md` butir 93), sehingga
  produk itu tampak tanpa pajak dan konfirmasi ganti tidak muncul.
  Tertutup di `ed4bfd3`: relasi itu tampil bertanda (RH4a).
- Pajak per aset (`assetID` di `POST /produkpajak`) belum dipakai web;
  ditinjau bersama modul reservasi bila dibutuhkan.
- `pajakList` di tipe `Produk` tetap ada tetapi tidak dipakai tampilan,
  karena tidak mencerminkan relasi pajak (`kontrak/temuan.md` butir 88).
  Sejak backend `yoga` `e9bd1ae` dibaca dari relasi; tab tetap memakai
  `GET /produkpajak` (RH4a).
- Wewenang yang namanya tidak punya padanan id di daftar permission
  dibuang diam-diam saat form role menyusun payload (`payloadBuatRole`),
  dan teks tombol simpan form role tetap "Simpan Perubahan" saat membuat
  posisi baru; keduanya dipertahankan dari form lama (`597a163`).
