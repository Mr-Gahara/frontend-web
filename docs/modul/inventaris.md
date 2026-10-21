# Modul Inventaris

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Submodul stock adjustment

- **Data yang terbukti salah dari backend tidak ditampilkan sebagai nilai.**
  Selama mapper backend salah (`kontrak/temuan.md` butir 18), saldo sistem,
  koreksi, dan alasan tampil sebagai `-` atau keterangan "belum dikirim
  server", bukan 0 atau "tidak ada alasan". Sejak mapper diperbaiki
  (`f27f093`), nilainya ditampilkan apa adanya (`2b3b52d`).
- **Kolom sumber dimunculkan kembali** di daftar dan detail (21 September
  2026). Sumber diturunkan dari `referenceType`: "Stock Opname" disertai
  nomor dokumennya dan bertaut ke dokumen itu, "Koreksi Manual" tanpa
  tautan. Kolom ini sempat dihapus karena respons tidak membawa
  `referenceType` dan kolom lama hanya mengulang nomor jurnal.
- **Kolom catatan per item dihapus**, karena backend tidak punya sumber data
  untuknya dan membuang `catatanItem` dari respons.
- **Saldo sistem adalah saldo saat disetujui** (`qtyCurrent`). Stok saat
  draf dibuat (`qtySnapshot`) tampil di bawahnya hanya bila berbeda, sebagai
  tanda stok bergerak selama opname berlangsung.
- **Ruang outlet hanya menampilkan adjustment lokasi Outlet** (22 September
  2026, `a5e9cec`), dengan cakupan outlet seperti halaman inventaris outlet
  lain. Adjustment hasil opname gudang tidak tampil di ruang outlet, dan
  sampai ruang gudang punya halaman stock adjustment tidak tampil di mana
  pun di web; sejak `247cf2d` halaman itu ada. Gate halaman
  ditambah `read-location` karena cakupan memanggil `/location/current`
  (`fe5dd9c`).
- **Ruang gudang menampilkan adjustment seluruh lokasi bertipe Gudang**
  (23 September 2026, `247cf2d`), tanpa cakupan per gudang (Model bisnis
  MVP). Daftar dan detail memakai komponen bersama dengan ruang outlet,
  dibedakan lewat `ruang`. Gate halamannya cukup `read-stock-adjustment`,
  karena ruang gudang tidak memanggil `/location`.
- **Detail menolak adjustment dari ruang yang salah** (23 September 2026).
  Id milik ruang lain yang dibuka lewat URL menampilkan pesan beserta
  tombol kembali, bukan isi dokumen. Ini penjaga tampilan demi aturan stok
  outlet dan gudang tidak tercampur, bukan pengaman akses: backend tidak
  membatasi stock adjustment per ruang (`kontrak/temuan.md` butir 40).
  Adjustment yang lokasinya sudah terhapus tetap ditampilkan.
  Sejak backend `yoga` `12c143f` backend membatasinya lewat izin per ruang
  (RH3a).
- **Tombol setelah setujui di detail opname gudang menuju jurnal
  penyesuaian gudang**, sejalan dengan ruang outlet, menggantikan tautan
  lama ke jurnal stok gudang.
- **Kegagalan memuat daftar stock adjustment tampil sebagai pesan**,
  sejalan dengan keputusan submodul jurnal stok.

### Submodul jurnal stok

- **Kegagalan memuat tidak lagi tampil sebagai daftar kosong.** Tabel
  menampilkan pesan error, dan halaman outlet membedakan "gagal memuat
  lokasi" dari "lokasi belum dikonfigurasi".

Diputuskan pemilik proyek pada 21 Oktober 2026 (penyesuaian backend
`ridho` `b5b367a`, B102; `081d5dc`, `b03c276`):

- **Daftar jurnal berhalaman di server**: lokasi, periode, arah, dan
  alasan dikirim sebagai query, dan `DataTable` memakai paginasi server
  (10, 20, atau 50 baris). Mengganti filter, ukuran, atau lokasi kembali
  ke halaman 1.
- **Kotak cari nama bahan disembunyikan** sampai backend menerima query
  pencarian (`kontrak/temuan.md` butir 150), lalu dikembalikan. Jurnal
  stok adalah pengecualian keputusan rancangan butir 27, karena tumbuh
  satu baris per bahan setiap penjualan.
- **Lingkup per tipe lokasi dikirim sebagai satu `locationID`**: ruang
  gudang memakai lokasi Gudang pertama, dan pilihan Semua Outlet memakai
  satu-satunya outlet; bila outlet lebih dari satu, halaman meminta
  memilih satu outlet (`lokasiJurnalOutlet`, MVP). Filter tipe lokasi
  diminta ke backend (butir 151).
- **Filter periode** Dari tanggal dan Sampai tanggal memakai
  `PilihTanggal`, dengan periode awal tanggal 1 bulan berjalan sampai
  hari ini, disetujui dari pratinjau. Reset Filter mengembalikan periode,
  arah, dan alasan.
- **Rute jurnal gudang menuntut `read-location`** selain
  `read-jurnal-stok`, karena halamannya mencari lokasi gudang
  (`029413d`).

### Submodul stok dan inventaris gudang

- **Gagal mengubah batas minimum atau opname di gudang kini menampilkan
  pesan.** Sebelumnya dialog tetap terbuka tanpa keterangan apa pun.
- **Perilaku lain dipertahankan**: catatan opname tetap wajib, opname tanpa
  selisih tetap diizinkan, dan pilihan "Semua Lokasi" di outlet tetap
  menampilkan stok seluruh lokasi bertipe Outlet. Sejak commit cakupan
  lokasi, pilihan itu hanya untuk owner; staf dibatasi ke lokasi aktif tanpa
  pemilih. Sejak `085ec78`, pembedanya izin lintas outlet, bukan peran
  (Model bisnis MVP).
- **Gate halaman stok menerima izin inventory per ruang** (21 September
  2026). Stok outlet dan bahan baku menerima `read-inventory` atau
  `read-inventory-outlet`; inventaris gudang menerima `read-inventory` atau
  `read-inventory-gudang`. Backend menerima ketiganya untuk lokasi mana pun
  (`kontrak/temuan.md` butir 2), tetapi nama izinnya dimaksudkan per ruang.

- **Tabel stok outlet menampilkan kerangka memuat selama lokasi aktif
  dimuat** (4 Oktober 2026, `eb0181f`), bukan "Tidak ada data stok yang
  ditemukan.": selama itu query stok belum berjalan, sehingga daftar
  kosong belum dapat disimpulkan. Diterapkan tanpa ditanyakan, sejalan
  dengan keputusan submodul jurnal stok. Sejak `753f61e` keadaan memuat
  itu ditampilkan `DataTable` sebagai "Memuat data...", bukan kerangka.

### Submodul stock opname

- **Cakupan lokasi di ruang outlet mengikuti peran.** Owner melihat seluruh
  outlet dengan pemilih lokasi (bawaan "Semua Outlet"); staf hanya lokasi
  aktifnya. Dokumen gudang tetap di ruang gudang. Owner dikenali lewat
  `useLevelPenggunaAktif` (keputusan rancangan butir 2). Pembatasan ini hanya di
  tampilan, karena backend mengirim data seluruh tenant kepada pemegang izin
  baca (`kontrak/temuan.md` butir 20). Aturan yang sama diterapkan juga ke
  jurnal stok dan stok outlet dalam commit cakupan lokasi, dan ke daftar
  pengajuan stok (`59e10a1`), serta daftar penerimaan barang (`580a1e1`).
  Sejak `085ec78`, pembedanya bukan peran owner melainkan izin lintas
  outlet, sehingga selama izin itu belum ada di backend semua pengguna
  terkunci ke outlet tenant (Model bisnis MVP). Daftar stock adjustment
  ikut aturan ini sejak `a5e9cec`.
- **Membuat opname di outlet tetap memakai lokasi aktif** untuk semua
  pengguna, termasuk owner, karena opname adalah hitungan fisik di tempat.
- **Tombol aksi disembunyikan sesuai izin**: `submit-stock-opname` untuk
  menghitung dan mengajukan, `review-stock-opname` untuk menyetujui, menolak,
  dan membatalkan (keputusan rancangan butir 14).
- **Pembatalan tersedia untuk DRAFT, SUBMITTED, dan REJECTED** bagi pemegang
  izin tinjau, sejalan dengan backend. Sebelumnya hanya dari SUBMITTED.
- **Simpan sementara hanya mengirim item yang berubah** dibanding data server
  (21 September 2026). Catatan yang dihapus dikirim sebagai string kosong,
  dan simpan tanpa perubahan menampilkan "Tidak ada perubahan untuk
  disimpan" tanpa memanggil backend.
- **Hitungan kosong ditahan selama validator backend menolaknya**
  (`kontrak/temuan.md` butir 22, opsi B). Setiap item yang dikirim membawa
  hitungan angka, dan item berubah yang hitungannya kosong tidak dikirim,
  melainkan dilaporkan dengan pesan "Sebagian perubahan tidak disimpan".
  Konsekuensi yang diterima pemilik proyek: item yang hanya berubah
  catatannya ikut mengirim hitungan yang tampil di layar, sehingga hitungan
  staf lain untuk item yang sama yang tersimpan setelah halaman dimuat dapat
  tertimpa. Risiko ini sama dengan perilaku sebelumnya, dan hilang begitu
  `SERVER_TERIMA_HITUNGAN_KOSONG` di `features/stock-opname/payload.ts`
  dibalik menjadi true.
- **Dialog aksi hanya tertutup saat berhasil**; saat gagal tetap terbuka
  beserta isiannya (keputusan Fase 0).
- **Detail membedakan dokumen yang tidak ditemukan dari kegagalan memuat.**
- **Gate daftar stock opname outlet ditambah `read-location`**, karena
  cakupan outlet memanggil `/location` dan `/location/current`.

- **Detail menolak dokumen dari ruang yang salah** (4 Oktober 2026,
  `eb0181f`), sejalan dengan detail stock adjustment. Id milik ruang lain
  yang dibuka lewat URL menampilkan pesan beserta tombol kembali, bukan
  isi dokumen. Ini penjaga tampilan demi aturan stok outlet dan gudang
  tidak tercampur, bukan pengaman akses, dan dokumen yang tipe lokasinya
  tidak diketahui tetap ditampilkan.
- **PIC di form buat menampilkan nama pengguna dari server** (`eb0181f`),
  lewat `usePenggunaSaya`. `picID` tetap dari sesi; selama nama dimuat
  tampil "Memuat data Anda...", dan bila gagal dimuat kembali ke teks
  cadangan, sehingga form tidak tertahan permintaan nama.

### Submodul pengajuan stok

- **Daftar outlet mengikuti cakupan outlet**: pemegang izin lintas outlet
  melihat seluruh outlet dengan pemilih lokasi, pengguna lain hanya
  pengajuan outlet tenant (`085ec78`).
- **Daftar gudang menampilkan pengajuan ke seluruh lokasi bertipe
  Gudang.** Rencana beralih ke per gudang (owner seluruh gudang, petugas
  gudang hanya gudangnya), yang dijadwalkan pemilik proyek pada 22
  September 2026, dibatalkan pada hari yang sama: pengguna tidak terikat ke
  lokasi, dan akses ditentukan RBAC (Model bisnis MVP).
- **Draf tidak pernah tampil di ruang gudang**, karena belum diajukan dan
  belum menjadi urusan gudang.
- **Tab status yang selalu kosong karena izin disembunyikan.** Backend
  hanya mengirim status tertentu kepada petugas transfer tanpa izin setujui
  (`kontrak/temuan.md` butir 21); tab lainnya disembunyikan lewat
  `features/pengajuan-stok/izin.ts`.
- **Kegagalan memuat daftar tampil sebagai pesan**, sejalan dengan
  keputusan submodul jurnal stok.
- **Arah lokasi mengikuti backend** (21 September 2026): gudang asal di
  `dariLocationID`, outlet peminta di `keLocationID`. Halaman buat dan edit
  tetap menampilkan outlet di atas dan gudang di bawah; yang berubah hanya
  field yang diikat dan labelnya ("Outlet Peminta", "Gudang Asal Barang").
- **Pengajuan yang tersimpan terbalik tidak tampil di daftar mana pun**, dan
  di detail gudang tombol setujui serta buat surat jalannya dikunci dengan
  keterangan, agar stok tidak bergerak ke arah salah. Tolak tetap aktif.
  Penjaga ini dipertahankan sampai backend memvalidasi tipe lokasi
  (`kontrak/temuan.md` butir 24).
- **Data development yang terbalik dibalik langsung di basis data**, atas
  izin pemilik proyek karena belum ada data produksi (8 pengajuan,
  21 September 2026).
- **Outlet peminta di halaman buat dan edit** (22 September 2026,
  `085ec78`): staf outlet A hanya mengajukan untuk outlet A. Pengguna tanpa
  izin lintas outlet melihat outlet peminta terisi lokasi aktif dan
  terkunci, dan tidak dapat merevisi draf milik outlet lain; pemegang izin
  lintas outlet memilih dari seluruh outlet. Form menentukan outlet lebih
  dulu, lalu memasang form (keputusan rancangan butir 8).
- **Buat dan revisi memakai satu form** (`form-pengajuan-stok.tsx`). Jumlah
  disimpan sebagai teks agar isian kosong tetap tampil kosong, dan aturan
  lama dipertahankan: baris tanpa barang atau berjumlah 0 diabaikan tanpa
  pesan, tetapi harus ada minimal satu baris valid.
- **Detail outlet dan detail gudang tetap dua komponen**, karena perannya
  berbeda (outlet mengajukan, gudang meninjau dan membuat surat jalan);
  keduanya berbagi lapisan data, izin, dan pemformat.
- **Tombol aksi mengikuti izin masing-masing**, tidak hanya status:
  `update-pengajuan-stok` untuk revisi dan ajukan, `approve-pengajuan-stok`
  untuk setujui, `reject-pengajuan-stok` untuk tolak, dan
  `create-transfer-stok` untuk surat jalan.
- **Halaman detail, edit, dan buat tidak punya entri `IZIN_HALAMAN`**,
  mengikuti pola detail stock opname: `useAuthGuard` menjaga sesi, tombol
  aksi mengikuti izin, dan backend menolak dengan 403. Sejak `628f52e`
  sesi dijaga guard layout dashboard, tanpa pemanggilan di halaman.
  Diganti di `bc388c6`: ketiganya punya entri sendiri (GR3a dan GR5a).
- **Revisi hanya untuk DRAFT** di halaman edit, walau backend masih
  mengizinkan APPROVED dan PENDING diubah (`kontrak/temuan.md` butir 25).

Diputuskan pemilik proyek pada 19 Oktober 2026 (perbaikan pengajuan
PENDING, `781c861`, dan tab di URL, `a68a75f`):

- **Pengajuan PENDING kembali dapat dibuatkan surat jalan.** Membatalkan
  surat jalan atau menghapus drafnya mengembalikan pengajuan ke PENDING
  dan mengosongkan `transferStokID`. Backend mengizinkan surat jalan dari
  APPROVED maupun PENDING, tetapi web dulu hanya mengenali APPROVED,
  sehingga pengajuan itu macet tanpa tombol, berlabel "Perlu Tinjauan" di
  gudang dan "Menunggu" di outlet.
- **Tahap, bukan status, menjadi dasar tampilan** (`tahap.ts`): APPROVED
  dan PENDING menjadi PERLU_SURAT_JALAN atau SURAT_JALAN_DIBUAT menurut
  ada tidaknya `transferStokID`, karena membuat surat jalan tidak
  mengubah status pengajuan. Badge, label, tab, panel surat jalan, dan
  hitungan dashboard gudang memakai fungsi yang sama.
- **Tab gabungan**: gudang "PERLU SURAT JALAN" (APPROVED atau PENDING
  tanpa surat jalan) dan outlet "DISETUJUI" (APPROVED dan PENDING)
  menggantikan tab "APPROVED". Backend hanya menerima satu status per
  permintaan, sehingga tab gabungan meminta tanpa status lalu disaring
  di klien (`statusServerTab` dan `cocokTab` di `filter.ts`).
- **Tab tersimpan di `?tab=`**, dengan slug terbaca per ruang di
  `tampilan.ts`. Aturan keamanannya ada di `referensi/arsitektur.md`
  (bagian `lib/tab-url.ts`).

Diputuskan pemilik proyek pada 21 Oktober 2026:

- **Pengajuan stok berjalan dua arah, mengikuti P8 backend**: gudang
  mengirim ke outlet, dan outlet mengembalikan ke gudang. Dukungan web
  untuk pengembalian dikerjakan terpisah dengan pratinjau; sampai itu
  penjaga `arahPengajuanValid` tetap menyembunyikan arah Outlet ke
  Gudang. Keputusan "arah lokasi mengikuti backend" dan "pengajuan yang
  tersimpan terbalik" di atas ditinjau ulang bersama pekerjaan itu.
- **Daftar pengajuan, surat jalan, stock opname, dan stock adjustment
  tetap mode klien** dengan pencarian yang berfungsi, sampai backend
  punya pencarian teks (butir 150) dan, untuk pengajuan, filter tab
  gabungan (butir 152); keputusan rancangan butir 27.

### Submodul transfer, pengiriman, dan penerimaan

Diputuskan pemilik proyek pada 21 September 2026, dengan satu prinsip yang
mengikat seluruhnya (keputusan rancangan butir 17): frontend hanya
memperbaiki bagiannya sendiri dan ditulis untuk kontrak yang benar; setiap
bug backend dilaporkan dan tidak diakali agar test lolos.

- **Penerimaan yang mengosongkan surat jalan diperbaiki sebagai commit
  tersendiri sebelum migrasi** (`dec9d01`, `kontrak/temuan.md` butir 28),
  mengikuti preseden arah lokasi pengajuan (`08d0a73`).
- **Jumlah diterima 0 ditahan dengan pesan** selama backend menghitungnya
  sebagai diterima penuh (butir 30). Penahanan dikendalikan
  `SERVER_TERIMA_JUMLAH_NOL` di `features/transfer-stok/payload.ts`, dan
  payload sudah membawa 0 apa adanya. Konsekuensi yang diterima: surat jalan
  yang salah satu barangnya tidak diterima sama sekali tertahan DIKIRIM.
  Dicabut 30 September 2026 (PB12a): backend `465b438` mencatat 0
  sebagai barang tidak sampai.
- **Item yang master bahan bakunya terhapus menahan penerimaan** (butir 29).
  Aturan ini tidak dikendalikan konstanta, karena payload yang benar untuk
  item itu baru ada bila kontrak terima berubah. Sejak `6e314ae` penahanan
  hanya berlaku bila `itemId` juga tidak ada (PB12a).
- **Spec memakai data sungguhan yang dibuat dan ditutup sendiri.** Surat
  jalan dibuat dari pengajuan APPROVED atau PENDING tanpa surat jalan,
  dikirim lewat API bila skenarionya butuh DIKIRIM, dan dibatalkan di akhir,
  sehingga pengajuannya kembali ke PENDING. Kirim dan terima hanya diuji
  jalur gagalnya lewat `page.route`; batal dari DIKIRIM lewat API hanya
  dipakai membersihkan data uji. Sejak backend `465b438` surat jalan
  DIKIRIM ditutup lewat terima (PB10a), dan terima sungguhan diuji lewat
  UI sejak `6e314ae` (PB12a).
- **Daftar penerimaan outlet mengikuti cakupan outlet**: pemegang izin
  lintas outlet seluruh outlet dengan pemilih, pengguna lain hanya outlet
  tenant (`580a1e1`, `085ec78`).
- **Batal surat jalan di web hanya untuk PENDING**, walau backend menerima
  batal dari DIKIRIM, karena stok gudang langsung dikembalikan saat barang
  masih di perjalanan (butir 36). Backend `465b438` kini menerapkan aturan
  yang sama (P12).
- **Surat jalan development yang rusak dibiarkan** sebagai bukti untuk tim
  backend (butir 29).
- **Halaman pengiriman dan daftar transfer gudang tetap dua halaman** dan
  hanya berbagi lapisan `features/`: pengiriman memantau surat jalan
  DIKIRIM dengan lama perjalanan dan polling, sedangkan daftar transfer
  adalah arsip bertab (`referensi/arsitektur.md`, Kapan halaman disatukan).
- **Tombol aksi surat jalan mengikuti izin endpoint-nya** (`aksiSuratJalan`,
  keputusan rancangan butir 14): kirim `approve-transfer-stok`, revisi
  `create-transfer-stok`, batal `cancel-transfer-stok`, dan terima
  `receive-transfer-stok`.
- **Revisi mempertahankan aturan lama**: baris tanpa barang, berjumlah 0,
  atau bukan angka diabaikan, tetapi harus ada minimal satu baris valid.
  Karena PUT mengganti items apa adanya (`kontrak/temuan.md` butir 32),
  baris yang diabaikan hilang dari surat jalan.
- **Kegagalan memuat daftar penerimaan tampil sebagai pesan**, sejalan
  dengan keputusan submodul jurnal stok, termasuk lokasi yang gagal dimuat
  dan tenant tanpa outlet (lokasi aktif kosong).
- **TS1a: daftar surat jalan memakai penyaringan server** (4 Oktober
  2026, `03c4eb3`), setelah butir 33 terbukti diperbaiki lewat permintaan
  nyata terhadap backend `50eede7`. Lingkup satu lokasi tujuan dikirim
  sebagai `keLocationID`, karena `locationID` di server berarti asal atau
  tujuan, dan status tidak lagi disaring di klien. Lingkup per tipe
  lokasi dan pencarian tetap disaring di klien, karena tidak punya
  padanan di server.

## Catatan

### Catatan dari modul inventaris

Modul inventaris (24 halaman, sekitar 8.900 baris) dikerjakan dalam enam
submodul, masing-masing dengan spec pembanding, suite penuh, dan commit
sendiri:

| No | Submodul | Baris | Commit |
|---|---|---|---|
| 1 | Stock adjustment | 431 | `a52afbf` |
| 2 | Jurnal stok | 617 | `98735d4` |
| 3 | Stok dan inventaris gudang | 1.094 | `ad590f9` |
| 4 | Stock opname | 2.544 | `fc3f220` |
| 5 | Pengajuan stok | 2.298 | `59e10a1`, `08d0a73`, `90eb935` |
| 6 | Transfer, pengiriman, penerimaan | 1.950 | `dec9d01`, `ad77a14`, `580a1e1` |

Angka `diff` antarhalaman tidak cukup untuk memutuskan penyatuan. Jurnal
stok (341 dari 617 baris berbeda, hampir seluruhnya teks), stock opname, dan
daftar pengajuan stok (161 dari 474) disatukan, sedangkan stok dan
inventaris gudang, detail pengajuan, serta seluruh halaman surat jalan hanya
berbagi lapisan `features/`. Baca isi perbedaannya lewat `diff` tanpa baris
`className` sebelum memutuskan.

Yang masih berlaku:

- `features/inventaris` memuat seluruh hook lokasi, stok, dan cakupan
  (`referensi/arsitektur.md`); jangan membuat hook serupa (keputusan rancangan butir
  12).
- `kontrak/izin-halaman.md` sudah diselaraskan dengan `IZIN_HALAMAN` untuk
  halaman yang disebut kalimat pembukanya; baris lain masih mencerminkan
  keadaan sebelum Fase 2 dan diperbarui saat halamannya dimigrasikan.
- `kontrak/temuan.md` butir 10: operasi tulis tanpa validator di modul lain
  masih perlu ditelusuri sampai ke service, termasuk validator yang
  dipanggil dari service (butir 22). Stock opname, pengajuan stok, transfer
  stok, dan inventory sudah diperiksa.
- Belum diverifikasi: `inventoryService` (sekitar baris 106 di backend
  `f27f093`) membangun `new RegExp(search, "i")` langsung dari masukan
  pengguna. Dugaannya, karakter seperti `(` membuat pencarian stok dijawab
  500. Buktikan lewat e2e atau trace sebelum dilaporkan ke backend atau
  ditangani di frontend.
- Belum diverifikasi: `kontrak/payload.md` mencatat `PUT /bahanbaku/:id`
  memakai `locationID` untuk injeksi stok awal, tetapi
  `bahanBakuService.update` di backend `9cd1439` (baris 124 sampai 140)
  hanya menjalankan `$set` atas body. Telusuri route dan controller-nya
  sebelum kontrak dikoreksi.
- `components/calendar.tsx` (240 baris) adalah kalender kostum standar
  sejak `e43e000` (keputusan rancangan butir 22) dan dipakai lewat
  `PilihTanggal`; kedua `any`-nya dibereskan di `4f19e77`.
- `app/dashboard/outlet/inventaris/components/` berisi
  `inventaris-nav-tabs.tsx`; `BahanBakuCombobox` pindah ke
  `features/bahan-baku/bahan-baku-combobox.tsx` di `152088b`.
- Tambah barang di inventaris gudang hanya menawarkan master bahan baku.
  Barang inventory non-bahan (`barangInventoryID`, `/baranginventory`)
  belum dipakai web sama sekali; master data tetap bersumber dari outlet
  (`inti/keputusan-rancangan.md`, Model bisnis MVP). Dirapikan di modul gudang.
- Di ruang gudang, `gudang/layout.tsx` dan `gudang/setup` memakai
  `features/inventaris` sejak `9ce288b` (modul Gudang). Jadwal gudang
  sudah beralih ke `features/jadwal` di `19227f8`.
- Backend lokal: branch `ridho` `9cd1439`, yang menggabungkan origin/yoga
  `f0b7157` (21 September 2026, belum di-push). Berkas transfer stok tidak
  berubah sejak `f27f093`; `fc159bd` memasang validator allowlist di route
  inventory, dan spec stok lolos terhadapnya. Sejak 30 September 2026
  backend lokal adalah `nizar` `465b438` (Catatan dari penyesuaian backend
  `465b438`), dan sejak 1 Oktober 2026 `yoga` `50eede7` (Catatan dari
  penyesuaian backend `yoga`).
- Pengajuan stok:
  - Aturan status per izin di `pengajuanStokService.getAll` (baris 30
    sampai 47) dicerminkan di `features/pengajuan-stok/izin.ts`; keduanya
    diperbarui bersama.
  - `jenisPengajuan` `PENGIRIMAN` tidak dipakai backend maupun frontend:
    semua pengajuan adalah permintaan dari outlet ke gudang.
    Sejak keputusan 21 Oktober 2026 (P8), pengajuan juga dapat berupa
    pengembalian dari outlet ke gudang; `jenisPengajuan` tetap tidak
    dipakai.
  - Strategi data uji spec alur (keputusan pemilik proyek, pilihan A): buat,
    edit, ajukan, lalu tolak, dengan dokumen baru per run yang berakhir
    REJECTED; setujui dan buat surat jalan diuji jalur gagalnya saja dengan
    `page.route`, karena keduanya meninggalkan dokumen permanen.
  - Outlet peminta diputuskan pemilik proyek pada 22 September 2026
    (`085ec78`): pengguna tanpa izin lintas outlet terkunci ke outlet
    tenant dan tidak dapat merevisi draf outlet lain; pemegang izin lintas
    outlet memilih dari seluruh outlet (`modul/inventaris.md`, submodul pengajuan
    stok). Izin itu menunggu backend (`kontrak/temuan.md` butir 39).
  - Usulan tertunda: daftar outlet tidak menampilkan outlet peminta,
    sehingga pemegang izin lintas outlet di pilihan "Semua Outlet" tidak
    dapat membedakan outlet pengaju. Relevan begitu tenant punya lebih dari
    satu outlet.

### Catatan dari perbaikan pengajuan PENDING dan tab di URL

- `781c861`: pengajuan PENDING dapat dibuatkan surat jalan lagi (tahap
  pengajuan dan tab gabungan). Skenario e2e baru di
  `lihat-pengajuan-stok.spec.ts`: tab DISETUJUI, tab PERLU SURAT JALAN,
  dan detail PENDING tanpa surat jalan yang menampilkan tombol buat surat
  jalan (respons detail diubah lewat `page.route`; tombol tidak diklik
  sesuai strategi data uji pilihan A, Catatan dari modul inventaris).
- `a68a75f`: tab daftar pengajuan dan surat jalan disimpan di `?tab=`,
  dengan `aria-pressed` di tombol tab. Skenario e2e: `?tab=` membuka tab,
  klik tab menulis dan tab bawaan menghapusnya, dan `?tab=` berisi markup
  serta `__proto__` kembali ke tab bawaan tanpa dirender.
- `d6f8ba0` (penyesuaian backend `ridho` `af5f315`, B98): penanganan
  sementara hitungan kosong stock opname dihapus; `susunPayloadHitungan`
  kini hanya mengirim field yang berubah, dan hitungan yang dikosongkan
  dikirim null. `test.fixme` "hitungan tersimpan dapat dikosongkan
  kembali" menjadi langkah sungguhan di `draft-stok-opname.spec.ts`.
- Tab daftar pengajuan yang tidak diisi `labelTab` masih tampil sebagai
  kode mentah (DRAFT, REJECTED, dan COMPLETED di outlet; COMPLETED dan
  REJECTED di gudang), dan label tab surat jalan (`LABEL_TAB_TRANSFER`,
  misalnya DRAFT SJ) masih diambil dari halaman lama; dijadwalkan sebagai
  pekerjaan berikutnya (`inti/status.md`).
- Tiga spec transfer (`alur-transfer-stok.spec.ts`,
  `pengiriman-penerimaan.spec.ts`, dan `terima-penerimaan.spec.ts`)
  merujuk keputusan pemilik proyek "K3 pilihan B" dan K4, dan
  `alur-transfer-stok.spec.ts` juga merujuk R8 dan R13. Keempat label itu
  tidak tercatat di dokumentasi (diperiksa 19 Oktober 2026). Komentarnya
  dibetulkan ke rujukan yang benar saat spec itu disentuh lagi.

### Catatan dari penyesuaian backend `ridho` `b5b367a`

- `081d5dc`: `jurnalStokApi.halaman`, `paramHalamanJurnal`, dan
  `useHalamanJurnalStok` (`keepPreviousData`); panel jurnal dashboard
  gudang meminta lima baris dari lokasi Gudang pertama.
- `b03c276`: halaman jurnal stok mode server. `saringJurnal`,
  `dalamLingkup`, `filterServer`, `useDaftarJurnalStok`, dan
  `jurnalStokApi.daftar` dibuang; spec disusun ulang agar setiap
  skenario membuktikan query yang terkirim, lalu mencocokkan tabel dengan
  respons halaman itu.
- `029413d`: rute jurnal gudang dan panel jurnal dashboard menuntut
  `read-location`.
- Pemetaan paginasi kelima daftar: hanya jurnal stok yang pindah ke
  server. Empat daftar lain mencari di klien (`saringTransfer`,
  `saringPengajuan`, dan `searchKey` `DataTable` di stock opname serta
  stock adjustment), sedangkan backend tidak membaca query pencarian.
