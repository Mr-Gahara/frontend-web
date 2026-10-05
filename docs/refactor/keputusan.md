# Keputusan

Sifat perubahan: **Jarang**: bertambah saat ada keputusan baru. Butir lama boleh dilengkapi, tetapi tidak dibalik tanpa pembahasan.

Dua jenis keputusan yang mengikat pekerjaan refactor:

- **Keputusan produk**: perilaku yang dilihat pengguna, diputuskan pemilik
  proyek.
- **Keputusan rancangan**: aturan teknis yang berlaku lintas modul.

Keputusan yang sudah tercatat tidak dibalik tanpa pembahasan dengan pemilik
proyek. Keputusan baru ditambahkan di akhir kelompoknya, dan nomor butir
keputusan rancangan tidak diubah agar rujukan lama tetap berlaku.

## Keputusan produk

### Model bisnis MVP

Diputuskan pemilik proyek pada 22 September 2026. Mengikat seluruh modul,
dan membatalkan rencana cakupan per gudang yang dijadwalkan pada hari yang
sama (submodul pengajuan stok, di bawah).

- **Satu tenant adalah satu brand dengan tepat satu outlet dan satu
  gudang** pada MVP. Multi-outlet dan multi-gudang direncanakan di patch
  berikutnya; relasi outlet dan gudang (many-to-many atau many-to-one)
  belum diputuskan.
- **Pengguna dan akun hanya terikat ke tenant**, tidak ke lokasi. Tempat
  dan peran kerja seseorang (petugas gudang, kasir outlet) dibedakan lewat
  role dan permission. Petugas gudang yang sedang berada di outlet tetap
  dapat membuka ruang gudang, karena aksesnya ditentukan RBAC.
- **Lokasi hanya penanda posisi dan acuan absensi** (koordinat dan radius
  absen). Absensi urusan aplikasi; web hanya memantau.
- **Lokasi aktif adalah outlet milik tenant**, bukan lokasi pribadi
  pengguna: `GET /location/current` memanggil `getByTenant`, yang mencari
  lokasi pertama bertipe Outlet (`kontrak/endpoint.md` bagian 3.3).
- **Ruang gudang menampilkan seluruh gudang milik tenant**, tanpa cakupan
  per gudang. Siapa yang boleh masuk ditentukan RBAC.
- **Bekerja lintas outlet ditentukan satu permission khusus**, bukan nama
  role maupun lokasi: melihat data seluruh outlet di ruang outlet, dan
  mengajukan stok atas nama outlet lain. Namanya ditetapkan tim backend;
  sampai itu `IZIN_LINTAS_OUTLET` di `lib/auth/permissions.ts` bernilai
  null, dan semua pengguna, owner pun, terkunci ke outlet tenant
  (`085ec78`, keputusan rancangan butir 18).
- **Data tidak dibatasi per lokasi pengguna** di backend, cukup per tenant
  dan per permission. Query `locationID` tetap sah sebagai penyaring
  pilihan, bukan pembatas akses. Ini jawaban atas SO-3
  (`kontrak/temuan.md` butir 20).
- **Master data (produk, bahan baku, barang) milik tenant dan bersumber
  dari outlet.** Gudang tidak punya master sendiri; gudang baru mulai
  kosong, lalu menarik barang dari master lewat tambah barang di
  inventaris gudang.
- **Stok outlet dan stok gudang tidak boleh tercampur** di tampilan mana
  pun. Stock adjustment di ruang outlet hanya lokasi Outlet sejak
  `a5e9cec`, dan ruang gudang hanya lokasi Gudang sejak `247cf2d`.
- **Onboarding dilakukan klien sendiri** (28 September 2026). Klien
  mendaftar lewat `POST /akun/auth/register` (publik; menghasilkan akun
  `client` tanpa tenant dengan masa percobaan), lalu men-setup tenant,
  owner pengguna, dan lokasi sendiri lewat aplikasi. Petugas lapangan
  bersifat opsional: bila klien kesulitan, petugas datang ke toko dan
  membantu dengan login ke akun klien itu. Admin platform hanya membuat
  akun klien dan mengelola langganan (`/akun/admin/*`), tidak men-setup
  tenant. Setup tenant (`POST /tenant`, `tenantService.createWithOwner`)
  selalu untuk akun pemanggilnya, dan membuat role Owner berizin penuh,
  akun kas "Kas Kecil (Laci)" `CASH-001`, serta metode pembayaran
  "Tunai".

### Fase 0

Tidak boleh dibalik tanpa pembahasan:

- **Onboarding hanya lewat aplikasi.** Bila login akun menjawab `requireSetup: true`,
  web menampilkan pesan yang mengarahkan ke aplikasi Tachyon POS, tanpa menyimpan
  sesi dan tanpa berpindah halaman. Halaman `/register` dihapus.
- **PIN tepat 6 digit angka.** Input menyaring non-digit, dan validasi memakai
  `/^\d{6}$/`.
- **Pola roster memakai hapus permanen**, bukan arsip. Backend tidak memiliki
  field `status` pada pola roster, sehingga UI memperingatkan penghapusan permanen.
- **`aksesType` default `["web"]`** saat membuat pengguna dari web.
- **Dialog hanya tertutup bila simpan berhasil.** `onSave` dan `onDelete`
  mengembalikan `Promise<void>`, dan `confirmDelete` memanggil `preventDefault`
  agar dialog bertahan selama mutation berjalan.
- **ESLint memblokir import dari `__tests__`, `__fixtures__`, dan `__mocks__`**
  di `app`, `components`, `hooks`, `lib`, dan `types`, serta di `features`
  sejak `e43e000`.

### Modul produk dan kategori

- **Hapus kategori yang masih dipakai produk dicegah di frontend.** Dialog
  menyebut jumlah produk dan menonaktifkan Lanjutkan. Bila pengguna tidak
  boleh membaca produk, dialog hanya memperingatkan.
- **Produk yang kategorinya sudah dihapus** tampil "Tanpa kategori" dan harus
  dipilihkan kategori baru sebelum disimpan.
- **Satuan resep dibatasi** ke gram, ml, pcs, kg, dan liter, sesuai validator
  backend.
- **Bug stok saat edit produk ditangani di frontend**: resep hanya dikirim bila
  perlu. Bila resep dihapus seluruhnya, backend tetap menjadikan stok 0, dan
  form memberi petunjuk agar stok diatur ulang.

Diputuskan pemilik proyek pada 4 Oktober 2026, untuk utang kecil modul
produk (`152088b`). Labelnya PR:

- **PR1a: `BahanBakuCombobox` pindah ke `features/bahan-baku`**
  (`bahan-baku-combobox.tsx`), karena komponennya khusus domain bahan
  baku, bukan UI lintas modul.
- **PR2a: ketiga pemilih bahan baku di spec produk memakai satu helper**
  yang memilih pemicu lewat teks tombolnya.
- **PR3a: nama produk uji berakhiran `Date.now()`**, mengikuti pola yang
  sudah ada di spec itu.
- Diterapkan tanpa ditanyakan (`152088b`): dialog hapus produk hanya
  tertutup saat berhasil (keputusan Fase 0), dengan `preventDefault` di
  `onClick`; dan jalur gagalnya diuji lewat `page.route` pada `DELETE`
  saja, setelah dibuktikan gagal terhadap halaman lama.

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
- **Tombol setelah setujui di detail opname gudang menuju jurnal
  penyesuaian gudang**, sejalan dengan ruang outlet, menggantikan tautan
  lama ke jurnal stok gudang.
- **Kegagalan memuat daftar stock adjustment tampil sebagai pesan**,
  sejalan dengan keputusan submodul jurnal stok.

### Submodul jurnal stok

- **Kegagalan memuat tidak lagi tampil sebagai daftar kosong.** Tabel
  menampilkan pesan error, dan halaman outlet membedakan "gagal memuat
  lokasi" dari "lokasi belum dikonfigurasi".

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
  dengan keputusan submodul jurnal stok.

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
- **Revisi hanya untuk DRAFT** di halaman edit, walau backend masih
  mengizinkan APPROVED dan PENDING diubah (`kontrak/temuan.md` butir 25).

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
  adalah arsip bertab (`arsitektur.md`, Kapan halaman disatukan).
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

### Modul penjualan dan pembayaran

Diputuskan pemilik proyek pada 24 sampai 26 September 2026, dengan prinsip
keputusan rancangan butir 17.

- **K1a: data referensi lintas modul ada di `features/<domain>/`**
  (pelanggan, diskon, pajak, akun kas, metode pembayaran). Masing-masing
  dibuat di submodul pemakai pertamanya, dengan kunci `daftar()` yang
  berbeda dari kunci yang diisi halaman lama (butir 12).
- **K2a: pembayaran dari web tidak mengirim `status`.** Backend
  menentukannya dari metode, dan karena `isAutomated` tidak ada di model,
  hasilnya selalu PAID (`kontrak/temuan.md` butir 45).
- **K3a: buat penjualan mengirim `x-idempotency-key`**, satu kunci per
  pengisian form (butir 20).
- **K4a: halaman buat penjualan tidak menampilkan stok produk**, karena
  `produk.stok` tidak terhubung ke lokasi mana pun (`kontrak/temuan.md`
  butir 37). Dipertahankan sejak backend `yoga` (keputusan PY4a):
  `produk.stok` kini potret stok outlet saat produk disimpan, belum stok
  yang hidup. Tetap dipertahankan setelah backend `fc29433` (keputusan
  backend P15): finalisasi tidak lagi memakainya, tetapi angkanya di
  respons produk masih potret.
- **K5b dan K11b: daftar penjualan memakai cakupan outlet hanya bagi
  pemegang `read-location`.** Template Guest, Staff, dan Kasir memegang
  `read-penjualan` tanpa `read-location`, sehingga gate tidak ditambah, dan
  pengguna tanpa izin itu melihat penjualan seluruh tenant (pada MVP satu
  outlet sama dengan outlet tenant). Penjualan tanpa `locationID` dianggap
  milik outlet tenant, sama dengan cadangan backend saat finalisasi. Wajib
  ditutup sebelum multi-outlet (`kontrak/temuan.md` butir 48 dan 49).
- **K6b: spec alur membuktikan alur bisnis sampai stok dan pembayaran**,
  dengan stok disiapkan sesuai kebutuhan setiap test, walau meninggalkan
  penjualan FINAL (sejak backend `465b438` berstatus PAID) dan pembayaran
  di data uji.
- **K8a: tipe ber-`_id` yang masih dibaca halaman lama menjadi tipe
  `Lama`** (butir 19), dengan syarat pemilik proyek: frontend akhirnya
  harus bersih dari `_id`.
- **K9a: asersi jurnal stok menjadi `test.fixme`** selama cache daftar
  jurnal tidak dibersihkan saat jurnal ditulis (`kontrak/temuan.md` butir
  46).
- **K10a: pemeriksaan dialog yang bertahan saat gagal dipisah ke
  `test.fixme` per submodul pemiliknya**, agar suite hijau di setiap
  commit. Ketiganya sudah dibuka di submodul 2 dan 3.
- **K12a: kolom Metode di riwayat pembayaran menampilkan nama metode
  sebenarnya** dari daftar metode pembayaran, dan `-` bila tidak dapat
  ditentukan, menggantikan "Kasir" yang selalu tampil. Sejak `b85c2bd` nama metode
  dibaca dari respons detail (PB4a).
- **K13a: buat penjualan mengirim outlet tenant sebagai `locationID`** bagi
  pemegang `read-location`. Pemilih outlet bagi pemegang izin lintas outlet
  ditunda sampai multi-outlet.
- **Detail dan pembayaran yang tidak ditemukan menampilkan pesan** tanpa
  pengalihan otomatis, sejalan dengan detail stock opname.
- **Dialog void, hapus, finalisasi, konfirmasi pembayaran, dan buat
  penjualan hanya tertutup saat berhasil** (keputusan Fase 0).

### Modul reservasi

Diputuskan pemilik proyek pada 26 September 2026, dengan prinsip
keputusan rancangan butir 17 dan 21.

- **R1a: spec master data dibangun ulang sebelum migrasi.** Spec tipe
  aset, aset, dan tarif yang memalsukan respons sukses diganti seluruhnya
  dengan spec terhadap backend sungguhan, dijalankan terhadap kode lama
  sampai lolos, baru skenario baru ditambahkan dan dijalankan ulang.
- **R2b: data uji booking memakai fixture tetap.** Tipe aset, tarif tanpa
  batas hari dan jam, serta aset uji dibuat sekali bila belum ada; booking
  dibuat per run di slot waktu unik lalu di-void, karena hapus aset tidak
  memeriksa booking dan akan meninggalkan sesi yatim.
- **R3a: daftar reservasi yang basi setelah void ditulis sebagai
  `test.fixme` berbadan lengkap.** Data backend dibuktikan lewat detail
  sesi booking yang belum pernah dibaca, sedangkan pemeriksaan daftar di
  UI menunggu backend membersihkan cache daftar per tanggal.
- **R4a: blok booking di daftar reservasi menautkan ke detail
  penjualannya**, tanpa menambah aksi ubah atau hapus sesi booking.
  Anggapan bahwa detail penjualan adalah jalur batal booking terbukti
  keliru (`kontrak/temuan.md` butir 56) dan dijelaskan ulang oleh R4b.
- **Nama berisi spasi saja ditolak di form tipe aset dan aset** (27
  September 2026, `074e98c` dan `d3ae182`). Skema buat dan edit
  disatukan dengan trim; sebelumnya nama itu lolos form tipe aset lalu
  ditolak backend.
- **Dialog hapus aset hanya tertutup saat berhasil** (`d3ae182`,
  keputusan Fase 0), setelah hapus beralih dari `mutateAsync` tanpa
  penangkap ke `mutate`.
- **T1a: halaman buat dan edit tarif tetap terpisah** (27 September
  2026, `365553f`). Logikanya pindah ke `features/tarif`, sedangkan
  tampilan kedua halaman tidak berubah; penyatuan ke satu form ditunda.
- **T2a: skema tarif mempertahankan `z.coerce`**, dengan alasan dan
  batasnya di `cara-kerja.md` (Catatan form).
- **T3b: harga tarif yang tidak diisi ditolak form** dengan "Harga wajib
  diisi", sedangkan 0 yang diketik tetap sah. Sebelumnya harga kosong
  tersimpan 0 tanpa pemberitahuan, dan tarif 0 akan dipilih otomatis
  saat booking.
- **T4a: nama tarif berisi spasi saja ditolak** di buat dan edit,
  sejalan dengan tipe aset dan aset.
- **R2c: booking uji dibersihkan lewat penjualannya** (27 September
  2026, `27749fe`), melengkapi R2b: bayar Rp1, hapus pembayaran itu
  (penjualan kembali DRAFT dan saldo akun kas kembali), lalu void
  penjualan (booking Batal). Penjualan booking selalu FINAL dan tidak dapat
  di-void langsung (`kontrak/temuan.md` butir 56). Diganti PB8a sejak
  backend `465b438`.
- **R4b: tautan blok booking ke detail penjualan adalah jalur lihat dan
  bayar, bukan jalur batal** (`eef371a`). Web belum punya jalur
  membatalkan booking. Sejak `b85c2bd` booking dibatalkan lewat void
  penjualannya (PB2a).
- **R5a: booking Batal tidak ditampilkan di timeline daftar reservasi**
  (`eef371a`), karena slotnya sudah dilepas; backend tetap mengirimnya,
  karena daftar tidak disaring menurut status. Sejak backend `465b438`
  statusnya VOID (PB8a).
- **R6a: pemeriksaan bentrok di form buat reservasi hanya menghitung
  booking Aktif** (28 September 2026), sejalan dengan `checkConflict`
  backend; sebelumnya booking Selesai ikut dihitung. Diterapkan di
  `477f258` lewat `bookingBentrok`, dan diuji di test unit. Sejak backend `465b438`
  hanya booking Aktif yang sudah dibayar yang dihitung (PB8a).
- **R7b: diskon di buat reservasi memakai `features/diskon`**, dengan
  aturan `bisaDigabung` sebagai fungsi murni, serta fixture diskon item dan
  diskon global uji di spec e2e (28 September 2026; fixture di `652d669`,
  `pilihDiskon` di `477f258`).
- **R8b: spec buat reservasi memilih tanggal lewat kalender kostum**,
  sekaligus menguji fungsinya (28 September 2026, `652d669`).
- **R9b: buat reservasi dipindah ke `features/sesi-booking` dan dipecah
  menjadi komponen** (28 September 2026, `477f258`): halaman,
  `KartuFasilitas`, dan `PanelRingkasan`, masing-masing di bawah 700
  baris. Karena hampir setiap rentang yang dipindah juga berubah isinya,
  keempat berkas ditulis utuh dari halaman lama yang dibaca penuh, dengan
  `className` disalin, dan spec pembanding `652d669` menjadi penjaganya.

### Komponen tanggal dan waktu

Diputuskan pemilik proyek pada 28 September 2026 (`e43e000`).

- **K-TW1a: `PilihTanggal` dan `InputWaktu` menjadi komponen bersama**,
  dengan aturan murni di `lib/waktu.ts` (keputusan rancangan butir 22).
- **K-TW4a: hanya angka yang diterima, dan ketikan yang membuat jam
  melebihi 23 atau menit melebihi 59 ditolak**; isian tetap berisi nilai
  sah terakhir.
- **K-TW5a: isian jam kosong dibiarkan kosong dan ditolak halaman saat
  simpan.** Di buat penjualan, jam yang dikosongkan tidak lagi menjadi
  00.00; di tarif, kedua isian kosong tetap ditolak skema seperti
  sebelumnya.
- **K-TW2a: kalender shadcn murni dihapus, dan pemakaiannya ditolak
  ESLint**, begitu pula input `type` date, time, datetime-local, month, dan
  week di JSX.
- **K-TW3a: diterapkan lebih dulu di buat penjualan, filter daftar
  penjualan, dan tarif** (`e43e000`), lalu di buat reservasi (`477f258`);
  form shift dan jadwal bersama modul jadwal.
- **Filter tanggal daftar penjualan dikosongkan lewat reset filter**,
  karena `PilihTanggal` tidak punya tombol kosongkan.

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
  ulang. Temuannya dilaporkan (`backend.md`).
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

### Modul jadwal dan shift

Diputuskan pemilik proyek pada 29 September 2026, dengan prinsip
keputusan rancangan butir 17 dan 21.

- **Cakupan modul diperluas**: seluruh bug, galat, dan cacat UI/UX di
  fitur jadwal, shift, pola roster, dan monitoring absensi dibereskan di
  modul ini, bukan hanya migrasi lapisan data.
- **J1a: rentang bulan kalender jadwal diperbaiki di commit migrasi.**
  Halaman outlet dan gudang menyusun `startDate` dan `endDate` dari
  `toISOString` tengah malam lokal, sehingga di WIB rentangnya bergeser
  sehari: jadwal di tanggal terakhir bulan tidak termuat, dan jadwal dari
  tanggal terakhir bulan lalu tampil di tanggal yang sama bulan ini.
  Dampaknya hanya tampilan. Generate terbukti mengirim tanggal yang
  benar, karena `startDate`-nya teks YYYY-MM-DD yang dibaca sebagai
  tengah malam UTC.
- **J2a: jadwal yang ditolak backend ditampilkan.** Buat dan generate
  menjawab sukses walau `ditolak` lebih dari 0 (`kontrak/temuan.md`
  butir 66). Buat manual yang seluruhnya ditolak diperlakukan gagal
  (dialog bertahan dengan alasan dari `detailDitolak`), penolakan sebagian
  ditampilkan sebagai peringatan, dan generate tetap di langkah 2 dengan
  daftar jadwal yang ditolak.
- **J3b: dicabut** (29 September 2026, setelah `f99b7cf`). Keputusan ini
  diambil di atas baris `kontrak/izin-halaman.md` yang tertinggal, padahal
  `IZIN_HALAMAN` sudah memasang `read-pengguna` untuk jadwal outlet dan
  jadwal gudang sejak Fase 2. Tidak ada gate yang diubah, dan utangnya
  diganti di `status.md`. Generate jadwal belum punya entri, dan
  ditangani di submodul generate.
- **J4: data uji jadwal memakai fixture tetap** (shift dan pola roster
  uji) dan jadwal uji Ridho di bulan 30 hari pertama mulai dua bulan ke
  depan, yang dihapus per id di awal dan di `finally` (`d9af531`).
- **J5b: jadwal gudang dikelola penuh seperti outlet**: buat, ubah,
  hapus, dan generate. Hari ini toolbar gudang sudah menampilkan Tambah
  Manual dan Auto-Generate, tetapi halamannya tidak mengirim
  `onSubmitManual`, dan Auto-Generate menuju
  `/dashboard/gudang/jadwal/generate`, rute yang tidak ada.
- **Spec pembanding hanya memuat perilaku yang tidak berubah** dan lolos
  terhadap kode lama (`d9af531`); skenario J1a, J2a, dan J5b
  ditambahkan di commit migrasi.
- **Modul dipecah menjadi lima submodul** menurut ketergantungan data,
  masing-masing dengan inventaris, keputusan, perbaikan, commit, dan
  dokumen penutup sendiri: shift, pola roster, kalender jadwal dan
  kelola manual, generate, lalu monitoring absensi. Informasi diambil
  lewat blok terminal; berkas diunggah hanya bila memang perlu.
- **Outlet dan gudang punya karyawan, jadwal, shift, pola roster, dan
  absensi masing-masing.** Tampilannya boleh sama, tetapi datanya tidak
  dicampur.
- **SH1b: halaman shift gudang memakai komponen yang sama dengan outlet**
  (`f99b7cf`), dan pemisahan shift per ruang ditulis lengkap di
  `features/shift/ruang.ts` dengan `KUNCI_LOKASI_SHIFT` bernilai null
  (keputusan rancangan butir 18). Selama null, kedua ruang menampilkan
  daftar tenant yang sama beserta keterangan, karena `shiftModel` belum
  punya field lokasi. Menggantikan SH1a (data shift milik tenant
  bersama), yang diputuskan sebelum kebutuhan pemisahan per ruang
  disampaikan.
- **SH2a: lintas hari dihitung dari jam** (jam pulang tidak lebih besar
  dari jam masuk, termasuk jam yang sama), dan kotak centangnya nonaktif
  beserta keterangan. Sebelumnya effect menimpa centang manual setiap
  kali jam lengkap.
- **SH3a: form shift memakai React Hook Form dan Zod** dengan
  `InputWaktu`, dan tampilannya dipertahankan.
- **SH4a: toleransi harus bilangan bulat menit yang tidak negatif**;
  desimal ditolak, sedangkan sebelumnya dibulatkan ke bawah tanpa
  pemberitahuan.
- **SH5a: tim backend diminta menambah `locationID`** untuk shift, pola
  roster, dan monitoring absensi, dengan indeks unik nama shift per
  tenant dan lokasi (`kontrak/temuan.md` butir 70).
- **PL1a: shift nonaktif di pola roster ditampilkan dengan penanda
  "(nonaktif)"** (`dcc22e0`). Pratinjau memakai nama dan status dari
  daftar shift, atau dari shift hasil populate di respons pola bila tidak
  ada di daftar. Form ubah menampilkannya sebagai pilihan nonaktif, dan
  skema meminta pengguna menggantinya, karena backend menolak pola dengan
  shift nonaktif.
- **PL2a: form pola roster memakai React Hook Form dan Zod**, dengan
  pesan galat dan tampilan yang sama.
- **PL3a: ketikan siklus di atas batas ditolak**, dan isian tetap berisi
  nilai sah terakhir. Mengosongkan isian tidak menghapus rincian hari;
  rincian baru disesuaikan saat siklus berisi angka sah, dan baris yang
  ada dipertahankan beserta pilihan shift-nya.
- **PL4a: batas siklus tetap 31 hari**, walau backend menerima sampai
  365.
- **PL5: halaman pola roster gudang memakai komponen yang sama dengan
  outlet** (`dcc22e0`), mengikuti prinsip bahwa outlet dan gudang punya
  data masing-masing. Pemisahan per ruang ditulis lengkap dengan
  `KUNCI_LOKASI_POLA_ROSTER` bernilai null, terpisah dari
  `KUNCI_LOKASI_SHIFT`, karena backend dapat menambahkannya di waktu yang
  berbeda.
- **JD5a: jadwal libur tampil LIBUR** di sel kalender (`19227f8`), berbeda
  dari sel tanpa jadwal yang tetap tanda hubung.
- **JD6a: simpan jadwal beruntun dengan satu ringkasan.** Ubah jadwal satu
  hari dijalankan sebagai langkah berurutan (`rencanaSimpanJadwal`); bila
  satu langkah gagal, dialog bertahan, pesan menyebut langkahnya, dan
  kalender dimuat ulang.
- **JD8a: form jadwal memakai React Hook Form dan Zod** dengan
  `PilihTanggal`, dan tampilannya dipertahankan.
- **JD13c: submodul kalender dan generate digabung** dalam satu commit,
  agar Auto-Generate gudang tidak pernah menuju halaman yang belum ada.
- **JD14a: `PenggunaItem` dilengkapi `role` opsional** sesuai kontrak
  `GET /pengguna` (`e2a0cfd`); kalender dan generate membaca `role`, lalu
  `roleID.namaRole`, lalu tanda hubung. Perilaku halaman pengguna tidak
  berubah.
- **GN2a: hari pola dengan shift nonaktif atau hilang ditandai di pratinjau
  generate, dan simpan ditahan**, karena backend melewati entri itu tanpa
  mencatatnya (`kontrak/temuan.md` butir 62).
- **GN4a: langkah 1 generate memakai React Hook Form dan Zod** dengan
  `PilihTanggal` dan kotak centang berlabel.
- Diterapkan dari keputusan sebelumnya tanpa ditanyakan ulang (`19227f8`):
  J1a, J2a, J5b, penanda shift nonaktif di form jadwal seperti PL1a,
  catatan yang dimuat ke form ubah, galat keempat sumber data, dan
  aksesibilitas sel serta pilihan status.
- **AB3a: widget absensi menampilkan pesan izin dan galat** (`845c2cf`).
  Jawaban 403 menampilkan pesan bahwa pengguna tidak memiliki izin melihat
  absensi, galat lain tampil sebagai gagal memuat, dan "belum ada yang
  absen" hanya muncul bila permintaan berhasil tanpa data. Permintaan yang
  dijawab 403 tidak diulang.
- **AB4a: monitoring absensi disaring dengan karyawan ruang** yang sudah
  dimuat halaman pengguna. Staf yang terdaftar di kedua ruang tampil di
  keduanya. Backend belum memisahkan absensi per lokasi (SH5a).
- **AB5a: widget menampilkan yang sedang bekerja dan yang sudah absen.**
  Angka besar adalah staf yang sedang bekerja, dengan baris jumlah staf
  yang sudah absen hari ini; teks kosong dibedakan antara belum ada yang
  absen dan tidak ada yang sedang bekerja.
- Diterapkan tanpa ditanyakan (`845c2cf`): nama peran dari satu fungsi
  `namaPeran` di `features/pengguna`, dipakai tabel pengguna, kalender
  jadwal, dan widget (keputusan rancangan butir 12); jam masuk dalam zona
  `Asia/Jakarta` agar label WIB selalu benar; log debug dibuang.

### Modul gudang

Diputuskan pemilik proyek pada 29 September 2026, dengan prinsip
keputusan rancangan butir 17 dan 21.

- **GD1a: dashboard gudang memakai sumber data gabungan.** Hitungan
  pengajuan (menunggu persetujuan; siap dibuat surat jalan) dan surat
  jalan (PENDING; sedang dikirim) diambil dari `GET /dashboard/gudang`,
  sedangkan stok kritis dan jurnal terbaru dari hook `features/` yang
  hanya menghitung lokasi Gudang, karena endpoint itu menghitung seluruh
  lokasi tenant termasuk outlet (Model bisnis MVP: stok outlet dan gudang
  tidak boleh tercampur). **Eksekusinya ditunda**: layout dan UI/UX
  dashboard ditentukan pemilik proyek sendiri, dan halamannya tetap
  placeholder sampai itu (`status.md`, Utang kecil dari modul Gudang).
- **GD2a: pengaturan gudang berisi profil gudang yang dapat diubah**
  (nama, alamat, koordinat, dan radius absen) lewat `PUT /location/:id`
  bagi pemegang `update-location`, dan baca-saja bagi pengguna lain,
  dengan form yang sama dengan setup.
- **GD3a: form setup memakai React Hook Form dan Zod** dengan tampilan
  yang dipertahankan: label ber-`htmlFor`, koordinat wajib angka dalam
  rentang backend dan kosong di awal (diisi lewat Deteksi Otomatis atau
  manual) menggantikan koordinat bawaan titik tengah Pontianak, dan
  radius tetap wajib 10 sampai 50 meter.
- **GD4a: layout gudang menampilkan pesan di tempat, tanpa pengalihan.**
  Pengguna tanpa `read-location` membuka ruang gudang tanpa pemeriksaan
  gudang, karena setiap halaman punya gate sendiri. Galat memuat tampil
  sebagai pesan dengan tombol coba lagi, dan gudang yang belum ada bagi
  pengguna tanpa `create-location` tampil sebagai pesan agar menghubungi
  pemilik. Pengalihan berputar antara `/dashboard` dan `/dashboard/gudang`
  hilang. Gerbang ruang tetap `read-dashboard-gudang`, sejalan dengan
  backend, sidebar, dan layout outlet.
- **GD5a: hanya pemuatan lokasi di sidebar yang ikut dimigrasikan**, ke
  `useDaftarLokasi` yang berbagi cache dengan layout (keputusan rancangan
  butir 12), sehingga menu Ruang Gudang muncul setelah setup tanpa muat
  ulang. Tanpa `read-location` permintaannya dimatikan, dan menu Ruang
  Gudang tetap tampil bagi pemegang `read-dashboard-gudang`. Sisa sidebar
  tetap untuk modul Profil, login, dan sidebar (selesai di `57a7084`).
- **GD6a: setup diuji dengan daftar lokasi tanpa gudang yang dibentuk dari
  respons nyata** (`// simulasi:`), karena tenant uji sudah punya gudang
  yang menyimpan stok, dan `POST /location` dijawab gagal agar tidak ada
  lokasi yang tersimpan (`2d7225b`). Setup yang berhasil tidak diuji e2e
  (`pengujian.md`, Utang pengujian).
- Diputuskan tanpa ditanyakan, diterapkan di `9ce288b`: pemeriksaan
  nama role Owner di layout dibuang (keputusan rancangan butir 2), dan
  `urlSetup` form buat stock opname gudang diarahkan ke
  `/dashboard/gudang/setup`, karena gudang yang belum didaftarkan adalah
  urusan setup, bukan pengaturan.
- Diterapkan tanpa ditanyakan di `319bd99`: pengaturan mengubah lokasi
  Gudang pertama dari `GET /location` (MVP satu gudang); isian form
  dipakai bersama setup lewat `IsianLokasi`; tombol simpan nonaktif selama
  form belum berubah; form dipasang ulang lewat `key` berisi id dan
  `updatedAt` (keputusan rancangan butir 8); dan gate halaman
  `read-location`, diturunkan dari endpoint yang dipanggilnya.

### Penyesuaian backend `465b438`

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
- **PB9a: skenario "Tipe Tidak Diketahui" dan `test.fixme` butir 51
  dibuang**, karena backend kini menolak hapus tipe aset yang masih
  dipakai (409); tampilan tipe yang hilang diuji unit lewat
  `namaTipeAset`.
- **PB10a: surat jalan uji DIKIRIM ditutup lewat terima penuh**, karena
  batal dari DIKIRIM ditolak backend (P12). `siapkanSuratJalan` memakai
  pengajuan uji milik spec, yang dipakai ulang bila ada dan dibuat bila
  tidak, lalu disetujui pengguna uji "E2E Penyetuju" di konteks
  permintaan terpisah.
- **PB11a: persetujuan pengajuan sendiri**: Owner boleh menyetujui
  pengajuannya sendiri dengan penanda self-approval, peran lain tidak.
  Backend belum menerapkannya (`kontrak/temuan.md` butir 76); sampai itu
  spec memakai pengguna penyetuju uji (PB10a).
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
- **PO4a: badge Default, kolom Sistem, kotak centang gateway Xendit, dan
  field gateway di tipe web dibuang.** Badge ditebak dari nama tanpa
  konsep backend, dan gateway tidak dipakai (`kontrak/temuan.md` butir 78).
- **PO5a: menonaktifkan metode aktif terakhir diberi peringatan** di
  dialog tanpa ditahan, karena backend tidak menahannya
  (`kontrak/temuan.md` butir 87).
- **PO6a: satu pajak per produk.** Tab pajak per produk menampilkan satu
  pajak terpasang, memasang pajak lain menggantinya lewat konfirmasi yang
  menyebut pajak lama, dan hanya pajak per produk yang aktif yang
  ditawarkan, karena backend menyimpan relasi lewat upsert per produk.
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
  `update-location`, baca-saja selain itu (sejalan GD2a).
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
  juga pada update (`kontrak/temuan.md` butir 91); simpan ubah nonaktif
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

### Penyesuaian backend `yoga`

Diputuskan pemilik proyek pada 1 Oktober 2026.

- **PY1a: acuan backend berikutnya `origin/yoga`** (`50eede7`), yang sudah
  menggabungkan `origin/nizar` `3edbdea`.
- **PY2a: urutan pekerjaan.** PO11a di-commit terhadap `465b438`, lalu
  penyesuaian ke `yoga`, lalu submodul profil outlet, agar profil outlet
  tidak diuji terhadap backend yang akan diganti.
- **PY3a: permission basis data development diselaraskan sendiri** dengan
  seed backend, karena basis datanya lokal: nama yang dikeluarkan dari
  seed dilepas dari role lalu dihapus, seed disinkronkan, dan role Owner
  diisi ulang (`refactor/backend.md`). Temuannya tetap dilaporkan, karena
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

### Modul Pelanggan dan diskon

Diputuskan pemilik proyek pada 2 Oktober 2026, dengan prinsip keputusan
rancangan butir 17, 21, dan 23. PD1a dan PD5a diterapkan di `d9365d3`
(submodul pelanggan). PD2a dan PD3a diterapkan di `1e05df6` dan
`54f2938`, PD4a di `52c550e`, dan PD6a sampai PD9a di `54f2938`
(submodul diskon).

- **PD1a: dua submodul berurutan**, pelanggan lalu diskon, masing-masing
  dengan spec pembanding, migrasi, commit, dan dokumen penutup sendiri.
- **PD2a: hapus diskon diganti aktifkan dan nonaktifkan** dari menu
  daftar, lewat dialog yang hanya tertutup saat berhasil, karena backend
  tidak punya `DELETE` (diskon dirujuk riwayat penjualan). Batas 50 diskon
  aktif ditahan di klien dengan keterangan, dan jawaban 409 backend tetap
  ditampilkan, seperti PO2a dan PO3a.
- **PD3a: form diskon mengelola seluruh field backend, dalam dua commit.**
  Commit pertama memigrasikan enam field lama dan menampilkan aturan lain
  baca-saja di daftar; commit kedua menambah masa berlaku, jam dan hari,
  minimal belanja, kuota, kuota per pelanggan, khusus member, produk
  tertentu, dan hitung per barang.
- **PD4a: pilihan diskon di buat penjualan dan buat reservasi mengikuti
  `sedangBerlaku`** dari backend, sehingga diskon di luar masa, jam, hari,
  atau kuotanya tidak ditawarkan. Syarat yang bergantung pada transaksi
  (minimal belanja, khusus member, produk) tampil sebagai keterangan, dan
  penolakan backend ditampilkan apa adanya.
- **PD5a: isian pelanggan yang dikosongkan dikirim, lalu hasilnya
  diperingatkan.** Backend menjawab 200 tanpa mengubah nilainya
  (`kontrak/temuan.md` butir 104). Form ubah mengirim teks kosong, lalu
  membandingkan hasil simpan lewat `isianTidakTerkosongkan` dan
  memperingatkan bila nilainya masih ada. Tanpa konstanta, karena
  peringatan hilang sendiri begitu backend diperbaiki; skenario
  pengosongannya ditulis lengkap sebagai `test.fixme`.
- **PD6a: masa berlaku diskon diisi sebagai tanggal saja.** Tanggal mulai
  dikirim sebagai awal hari dan tanggal berakhir sebagai akhir hari, waktu
  lokal; jam harian diatur lewat jam berlaku.
- **PD7a: produk tertentu dipilih lewat daftar centang berpencarian** di
  dalam form, hanya untuk cakupan Item dan bagi pemegang izin baca produk.
  Tanpa pilihan, diskon berlaku untuk seluruh produk.
- **PD8a: khusus member tidak ditawarkan di form.** Backend mensyaratkan
  `Membership` aktif, sedangkan permission membership tidak ada di seed,
  sehingga membership tidak dapat dibuat siapa pun (`kontrak/temuan.md`
  butir 108). Diskon yang sudah ditandai diberi keterangan.
- **PD9a: aturan berada di bagian Aturan tambahan yang dapat dibuka dan
  ditutup**, terbuka sendiri bila diskon sudah punya aturan atau ada
  isian aturan yang ditolak. Enam isian dasar tetap seperti semula.
- Diterapkan tanpa ditanyakan (`d9365d3`): form memakai React Hook Form
  dan Zod dengan isian dipangkas dan email diperiksa bentuknya bila diisi;
  ubah hanya mengirim field yang berubah (butir 15), dan simpan tanpa
  perubahan tidak mengirim permintaan; dialog konfirmasi buat dan hapus
  hanya tertutup saat berhasil (keputusan Fase 0); label ber-`htmlFor`;
  tombol tambah, ubah, dan hapus mengikuti izin endpoint-nya (butir 14);
  daftar yang gagal dimuat tampil sebagai pesan dengan tombol coba lagi,
  sejalan dengan keputusan submodul jurnal stok; dan tampilan serta teks
  lain dipertahankan agar spec pembanding tetap berlaku.
- Diterapkan tanpa ditanyakan (`1e05df6`, `54f2938`, `52c550e`): form
  diskon memakai React Hook Form dan Zod; ubah hanya mengirim field yang
  berubah (butir 15), aturan yang dikosongkan dikirim sebagai null, 0,
  atau array kosong, dan jam selalu berpasangan; saat membuat, hanya
  aturan yang diisi yang dikirim; berpindah ke cakupan Global ikut
  mengosongkan produk dan hitung per barang; filter daftar menyaring di
  klien dari satu cache (butir 12); tombol tambah ditahan seluruhnya saat
  batas 50 tercapai, karena backend menghitung batas juga untuk diskon
  Non-Aktif (`kontrak/temuan.md` butir 107); tombol mengikuti izin create
  dan update (butir 14); isian jam diberi keterangan WIB (butir 109);
  syarat yang bergantung pada transaksi tampil di bawah nama diskon pada
  pilihan kasir; dan tampilan serta teks lama dipertahankan.

### Modul Profil, login, dan sidebar

Diputuskan pemilik proyek pada 2 Oktober 2026, dengan prinsip keputusan
rancangan butir 17, 21, dan 23.

- **PF1a: tiga submodul berurutan**: profil (`0ed0e9a`, `091be4e`), login
  akun dan login pengguna (`1c13ee6`), lalu sidebar beserta logout
  (`57a7084`).
- **PF2a: tombol hapus akun tampil nonaktif dengan keterangan**, tanpa
  `alert`. Backend diminta menyediakan jalur hapus akun sendiri: hanya
  Owner, mencakup akun beserta tokonya, dengan konfirmasi password atau
  autentikasi dua kali, dan admin platform tetap berkuasa penuh atas
  semua akun (`kontrak/temuan.md` butir 112).
- **PF3a: form login akun dan login pengguna memakai React Hook Form,
  Zod, dan `noValidate`**, menggantikan validasi HTML5 browser. Login
  pengguna hanya menuntut PIN terisi dan berupa angka; panjang tepat 6
  digit ditegakkan saat PIN dibuat atau diubah.
- **PF4a: sidebar dipecah**, tampilan dipertahankan: data menu, kaki
  sidebar, dan komponen utama (`arsitektur.md`).
- **PF5a: nama dan PIN diuji sungguhan pada pengguna uji khusus "E2E
  Profil"**, yang tidak memegang `read-pengguna` maupun
  `update-pengguna`, di konteks browser terpisah. Nama dan PIN Ridho
  tidak diubah, karena login seluruh suite bergantung padanya; Ridho
  memulihkan pengguna uji di awal setiap test.
- **PF6a: suite e2e penuh dijalankan sekali saat modul selesai**,
  sebelum pembaruan dokumentasi, bukan sebelum setiap commit. Setiap
  commit kode melewati `tsc`, ESLint, vitest penuh, dan spec yang
  terdampak. Langkah 5 Alur setiap perubahan di `cara-kerja.md` diubah
  atas perintah ini.
- **PF7a: setelah PIN berubah, pengguna diberi pesan lalu login ulang.**
  Backend memutus sesi setiap PIN berubah; halaman menitipkan pesan,
  mengakhiri sesi pengguna, dan menuju login pengguna, tanpa permintaan
  yang pasti dijawab 401.
- **PF8a: nomor HP isian teks** yang hanya menerima angka dan tanda + di
  depan. Nomor yang dikosongkan dikirim sebagai null, dan format akhirnya
  diputuskan backend.
- **PF9a: avatar memakai inisial nama**, di halaman profil dan kaki
  sidebar; gambar contoh dari luar dibuang. Unggah foto profil bukan
  kebutuhan MVP dan ditinjau setelah rilis.
- **Login tahap kedua dinamai "pengguna", bukan "pin"**, di nama berkas,
  komponen, skema, hook, dan tipe. Kata PIN hanya dipakai untuk isian PIN
  itu sendiri.
- **Pekerjaan setelah modul ini adalah panel admin** bagi akun admin
  setelah login akun (selesai di `c824f18`, Modul panel admin).
- Diterapkan tanpa ditanyakan (`091be4e`): PIN baru tepat 6 digit
  (keputusan Fase 0); form dipasang setelah data termuat (butir 8); ubah
  hanya mengirim field yang berubah (butir 15); PIN lama yang diisi
  tanpa PIN baru ditolak form; isian nama dan nomor HP baca-saja selama
  simpan berjalan, agar ketikan tidak hilang saat form dipasang ulang;
  profil yang gagal dimuat tampil sebagai pesan dengan tombol coba lagi;
  dan `useAuthGuard` menuju login pengguna bila token akun masih ada.
- Diterapkan tanpa ditanyakan (`1c13ee6`, `57a7084`): "Ganti Akun
  Bisnis" menjadi tombol; logout akun tetap dijalankan walau logout
  pengguna gagal; izin sidebar dibaca dari sesi saat render, bukan
  disalin ke state; nama di sidebar dari satu hook yang berbagi cache
  dengan halaman profil (butir 12); dan `tenantName` dibuang dari
  `PenggunaSesi`.

### Modul panel admin

Diputuskan pemilik proyek pada 2 dan 3 Oktober 2026, dengan prinsip
keputusan rancangan butir 17, 21, dan 23. PA1a, PA5a, dan PA6a diterapkan
di `0f54b3c`; PA7a sampai PA9a di `4e2a254`; PA10b dan PA11a di `10c7efb`;
dan PA3a serta PA12a sampai PA14a di `c824f18`.

- **PA1a: panel admin berada di `/admin`, terpisah dari `/dashboard`**,
  dengan layout dan guard sendiri. Akun admin dikenali dari `role` di
  payload token akun dan masuk tanpa login pengguna; login akun admin
  menuju `/admin`, dan halaman toko maupun login pengguna mengembalikannya
  ke sana.
- **PA2a: cakupan putaran ini akun dan langganan**: daftar, buat, ubah,
  hapus, bekukan, aktifkan, perpanjang, dan riwayat. Daftar toko dan
  kelola permission platform tidak ikut.
- **PA3a: form ubah hanya username, email, dan password.** `role` dan
  `tenantID` tidak ditawarkan, walau backend menerimanya
  (`kontrak/temuan.md` butir 113).
- **PA4a: spec e2e memakai akun admin dari seed backend.**
- **PA5a: kredensial admin uji tidak masuk git.** Spec dan helper tetap di
  repo; email dan password dibaca dari variabel lingkungan atau `.env.e2e`
  yang diabaikan git, dan tanpa itu spec admin dilewati lewat `test.skip`
  bersyarat dengan alasan yang terlihat.
- **PA6a: dokumentasi dan pesan commit tidak memuat email maupun password
  akun admin.**
- **PA7a: akun admin tampil di daftar dengan penanda peran**; aksi hanya
  untuk akun klien, karena backend menolak membekukan dan melanggankan
  akun admin.
- **PA8b: form buat akun klien di halaman tersendiri**,
  `/admin/akun/buat`.
- **PA9a: akun klien uji dibuat lewat UI dengan email unik per run.**
  Pembersihannya sempat lewat API selama bekukan dan hapus belum ada di
  UI; sejak `c824f18` akun uji dibekukan dan dihapus lewat UI, dan API
  tinggal cadangan di `finally`.
- **PA10b: aksi langganan dan riwayat di halaman detail akun**,
  `/admin/akun/[id]`. Backend tidak punya endpoint detail satu akun,
  sehingga akun dibaca dari cache daftar, dan kekurangan itu dilaporkan
  (`kontrak/temuan.md` butir 119).
- **PA11a: riwayat langganan bertahap dengan tombol muat berikutnya.**
  Backend memberi kursor tanpa jumlah total; kebutuhan total dilaporkan
  (butir 120).
- **PA12a: form ubah akun di halaman tersendiri**,
  `/admin/akun/[id]/ubah`.
- **PA13a: ubah dan hapus hanya untuk akun klien.** Akun admin baca-saja,
  sehingga admin tidak dapat mengunci dirinya sendiri atau admin lain dari
  web.
- **PA14a: tombol Hapus Akun selalu tampil untuk akun klien**, nonaktif
  dengan keterangan selama akunnya aktif, karena backend hanya menghapus
  akun non-aktif.
- **Pekerjaan setelah modul ini adalah mutasi arus kas** (3 Oktober 2026;
  selesai di `e129f9d`, Modul keuangan).
- Diterapkan tanpa ditanyakan (`0f54b3c`): makna `status` sesi tidak
  diubah, sehingga admin yang sudah masuk berstatus "keluar" dan dikenali
  dari role akunnya; role di luar `admin` diperlakukan sebagai klien;
  aturan pengalihan ditulis sebagai fungsi murni (butir 10); pemulihan
  sesi melewati `pin-refresh` untuk akun admin; dan logout admin tetap
  mengakhiri sesi lokal walau permintaannya gagal.
- Diterapkan tanpa ditanyakan (`4e2a254`, `10c7efb`, `c824f18`):
  pencarian dan filter status daftar di klien dari satu cache (butir 12);
  skema buat mengikuti validator backend, dan skema ubah diturunkan
  darinya karena `PUT` tidak punya validator; lama masa percobaan tidak
  ditulis di web karena berasal dari konfigurasi backend; akun tanpa masa
  akses tampil "Tidak dibatasi"; durasi saat mengaktifkan wajib bila masa
  akses kosong atau sudah lewat, mengikuti backend; dialog aksi dipasang
  setiap kali dibuka dan hanya tertutup saat berhasil (keputusan Fase 0);
  ubah hanya mengirim field yang berubah (butir 15), dengan username yang
  dikosongkan sebagai null; password admin yang salah ditampilkan apa
  adanya tanpa penanganan sementara (butir 17); dan halaman admin memakai
  token tema, bukan warna heksadesimal.

### Error ESLint warisan

Diputuskan pemilik proyek pada 4 Oktober 2026. Labelnya EL:

- **EL1a: `storage.ts` di helper uji dihapus** (`4f19e77`), bukan hanya
  diperbaiki tipenya, karena tidak punya pengimpor dan membaca
  `sessionStorage` yang tidak dipakai sejak token pindah ke memori.
- **EL2a: form role dipecah sesuai keputusan rancangan butir 8**
  (`f5fe574`), bukan ditunda: `FormRole` memuat detail lalu memasang
  `IsiFormRole` dengan nilai awal, dan effect pengisinya dibuang.
- **EL3a: tiga commit per kelompok**, masing-masing dengan gerbang dan
  spec terdampaknya sendiri: tipe, kutip, dan `storage.ts` tanpa
  perubahan perilaku; hidrasi; lalu form role.
- **EL4a: deteksi hidrasi lewat satu hook bersama dengan lima pemakai**
  (`039ead4`): kedua halaman role, topbar, dan dua salinan
  `useSyncExternalStore` yang sudah ada di reservasi, agar pola itu hanya
  didefinisikan sekali (keputusan rancangan butir 12).
- **Pekerjaan setelah ini adalah utang kecil yang tidak menunggu
  backend** (selesai di `9195472`), lalu `useAuthGuard()` yang berulang
  (selesai di `628f52e`, useAuthGuard berulang).
- Diterapkan tanpa ditanyakan (`4f19e77`): `decodeJWT` mengembalikan
  `Record<string, unknown>`, dan `exp` yang bukan angka dianggap
  kedaluwarsa; tipe `Dropdown` kalender diambil dari `react-day-picker`;
  pilihan role di dialog pengguna membaca `role.id` tanpa cadangan `_id`
  (butir 1); dan fixture test dialog pengguna ditulis sesuai tipenya.
- Diterapkan tanpa ditanyakan (`f5fe574`): detail yang gagal dimuat
  tampil sebagai pesan di tempat beserta tautan kembali, menggantikan
  toast dan form kosong, sejalan dengan keputusan detail yang gagal
  dimuat di modul lain; `useRole` dimuat ulang saat halaman dibuka; nilai
  awal disusun fungsi murni `nilaiAwalRole` (butir 10); dan isian form
  tetap memakai `useState`.

### useAuthGuard berulang

Diputuskan pemilik proyek pada 4 dan 5 Oktober 2026 (`628f52e`).

- **Guard sesi dashboard hanya dipasang di `app/dashboard/layout.tsx`.**
  Ke-37 pemanggilan `useAuthGuard()` di bawah layout itu dibuang dalam
  satu commit tanpa perubahan perilaku.
- **Suite e2e penuh tidak dijalankan sebelum commit dan dokumentasi
  ditutup** (5 Oktober 2026); baseline dicatat sebagai hitungan, dan
  suite penuh menjadi langkah pertama pekerjaan berikutnya.
- **Pekerjaan setelah ini adalah gerbang rute dari `IZIN_HALAMAN`**
  (`status.md`, Pekerjaan berikutnya).
- Diterapkan tanpa ditanyakan (`628f52e`): spec baru
  `tests/e2e/auth/guard-dashboard.spec.ts` untuk empat rute tanpa sesi;
  spec e2e terdampak dijalankan sebagai perwakilan tiap jenis berkas
  yang berubah; dan guard halaman login serta panel admin tidak
  disentuh.

## Keputusan rancangan yang mengikat

1. **Tipe selalu memakai `id`**, tidak pernah `_id`, karena `lib/api/client.ts` menormalkan respons. Pola `id || _id` tidak boleh ditulis lagi.
2. **Owner tidak diperlakukan khusus** lewat pengecekan nama role. Backend memberi Owner seluruh permission, sehingga pemeriksaan berbasis daftar permission sudah mencakupnya. Pengecualian: `useLevelPenggunaAktif` memakai nama role untuk menentukan level 100, karena token tidak membawa level; dipakai modul pengguna dan role untuk membandingkan level role. Cakupan data lintas lokasi di ruang outlet sempat mengikuti level itu, dan sejak `085ec78` mengikuti izin lintas outlet (`bolehLintasOutlet`), sehingga tidak lagi bergantung pada nama role. Pemeriksaan nama role Owner di `gudang/layout.tsx` dibuang bersama modul gudang (`9ce288b`).
3. **Invalidasi memakai akar domain** bila perubahan bisa memengaruhi beberapa varian. Kunci akar (`semua`) hanya untuk invalidasi, tidak untuk menyimpan data: halaman gudang lama memakai `queryKeys.bahanBaku.semua` sebagai kunci data master bahan baku.
4. **Field yang dipakai service tetapi tidak ada di validator** harus diperiksa sebelum dihapus dari payload (lihat `docs/kontrak/README.md` bagian 1, keterbatasan).
5. **Bug backend tidak diperbaiki dari sini.** Frontend menyesuaikan diri, lalu temuan ditulis untuk tim backend setelah commit bersih.
6. **Setiap tahap harus hijau dan bisa di-commit.** Tipe dan pemakaiannya berubah dalam satu commit.
7. **Satu prop untuk satu tujuan.** Pada komponen bersama, jangan memakai satu
   nilai untuk dua maksud yang kebetulan sama di salah satu mode. Pada modul
   role, `urlKembali` sempat dipakai sebagai tujuan tombol kembali sekaligus
   tujuan setelah menyimpan, sehingga halaman kostum kembali ke pilih template
   alih-alih ke daftar posisi.
8. **Form yang diisi dari data server dipasang setelah data itu termuat**, dengan
   nilai awal lewat `defaultValues`, bukan diisi ulang dengan `reset` di
   effect. Hook detailnya memuat ulang saat halaman dibuka
   (`refetchOnMount: "always"`), karena `defaultValues` hanya dibaca sekali dan
   `isFetchedAfterMount` tidak pernah true bila cache masih segar.
9. **Aturan izin endpoint yang tidak sederhana** (misalnya menerima salah satu
   dari beberapa izin) diletakkan di `features/<modul>/izin.ts`, bukan ditulis
   ulang di halaman pemakainya.
10. **Logika yang menangani ketidakselarasan backend** (payload, pesan error,
    data tampilan) ditulis sebagai fungsi murni (`payload.ts`, `pesan.ts`,
    `tampilan.ts`) agar dapat diuji unit dan mudah dibersihkan setelah backend
    diperbaiki.
11. **Data yang terbukti salah dari backend tidak ditampilkan sebagai nilai.**
    Tampilkan `-` beserta keterangan singkat, dan kendalikan penanganan
    sementara apa pun dengan satu konstanta (misalnya
    `SERVER_TERIMA_HITUNGAN_KOSONG` di `features/stock-opname/payload.ts`)
    yang komentarnya menyebut penyebab, konsekuensi, dan syarat pembaliknya,
    agar pembersihannya cukup satu perubahan. Angka palsu seperti koreksi 0
    pada audit trail lebih menyesatkan daripada kolom kosong. Pola ini
    terbukti pada `MAPPER_ADJUSTMENT_SUDAH_BENAR`, yang dibersihkan dalam
    satu putaran begitu mapper backend diperbaiki (`2b3b52d`).
12. **Hook dan API untuk data lintas modul hanya didefinisikan sekali.** Lokasi
    dan inventory tinggal di `features/inventaris`; modul lain mengimpornya dari
    sana. Sebelum membuat hook baru, grep kunci cache dan endpoint-nya di seluruh
    `features/`. Pada jurnal stok, `useLokasiAktif` ternyata sudah ada di
    `features/bahan-baku` dengan kunci yang sama, lalu disatukan.
    Periksa juga halaman lama yang mengisi kunci yang sama lewat `apiClient`:
    bila bentuk datanya berbeda, pakai kunci lain (`useLokasiBertipe` pindah ke
    `lokasi.daftar()`) atau seragamkan lewat fungsi murni (`lokasiTunggal`).
13. **Hook mutation menerima callback halaman.** `onSuccess` dan `onError` dari
    halaman dipakai untuk toast dan reset dialog, sedangkan pemanggilan API dan
    invalidasi tetap di hook. Dengan begitu variabel mutation dan JSX yang
    memanggil `.mutate()` atau `.isPending` tidak perlu diubah saat migrasi.
    Contoh: `useUbahStokMinimum({ onSuccess, onError })` di `features/inventaris`.
14. **Tombol aksi mengikuti izin endpoint-nya, bukan hanya status dokumen.**
    Status menentukan tahap, izin menentukan siapa yang boleh bertindak.
    Tombol yang izinnya tidak dimiliki pengguna disembunyikan, dan aturannya
    diletakkan di `features/<modul>/izin.ts` (butir 9). Contoh:
    `bolehHitungOpname` dan `bolehTinjauOpname` di `features/stock-opname`.
15. **Penyimpanan sebagian hanya mengirim yang berubah dibanding data
    server.** Pembandingnya nilai tersimpan di cache query, bukan isian awal
    lokal, dan field yang tidak berubah tidak dikirim bila backend
    mengizinkannya. Dengan begitu data yang disimpan pengguna lain setelah
    halaman dimuat tidak tertimpa. Contoh: `susunPayloadHitungan` dan
    `petakanNilaiServer` di `features/stock-opname/payload.ts`. Rancangan
    pertama yang mengirim `null` untuk setiap isian kosong akan menimpa
    hitungan staf lain.
16. **Izin alternatif sebuah endpoint dinyatakan di `IZIN_HALAMAN`** sebagai
    array di dalam daftar syarat (`SyaratIzin`), bukan sebagai fungsi izin per
    halaman. Dengan begitu `bolehBukaHalaman` dan `bolehBukaGrup` tetap satu
    pintu untuk sidebar dan gate halaman. Aturan izin untuk tombol dan data
    di dalam halaman tetap di `features/<modul>/izin.ts` (butir 9 dan 14).
17. **Frontend hanya memperbaiki bagiannya sendiri, ditulis untuk kontrak
    yang benar.** Bug backend dilaporkan dengan bukti, bukan diakali agar
    test lolos. Penanganan sementara hanya dipakai bila perilaku backend
    merusak data, dan dikendalikan satu konstanta bila membaliknya cukup
    untuk kembali ke kontrak yang benar (butir 11). Test yang membuktikan
    perilaku benar ditulis lengkap sebagai `test.fixme`. Bila tidak ada
    payload yang benar selama kontrak backend belum berubah, penahanannya
    ditulis sebagai aturan beserta syarat pencabutannya, bukan konstanta.
    Contoh: `SERVER_TERIMA_JUMLAH_NOL` dan penahanan item tanpa master di
    `features/transfer-stok/payload.ts` (pemilik proyek, 21 September 2026);
    saklar itu dibuang di `6e314ae` begitu backend memperbaikinya (PB12a).
    Bug milik frontend yang terbukti oleh spec tidak ditandai `test.fixme`,
    melainkan diperbaiki di commit spec itu, karena perbaikannya ada di
    tangan frontend: deskripsi tipe aset (`a2adc70`), serta kolom tipe
    aset dan dialog hapus tarif (`04830b7`) (pemilik proyek, 26 September
    2026).
18. **Identitas yang masih menunggu backend ditulis sebagai konstanta
    null, bukan tebakan.** Aturannya ditulis lengkap sekarang dan berlaku
    begitu konstanta diisi, tanpa perubahan lain. Nama tebakan yang kelak
    berbeda dari backend akan diam-diam tidak pernah cocok, sedangkan null
    terlihat jelas, mudah dicari, dan dipaksa ditangani TypeScript. Test
    untuk kedua keadaan dikondisikan pada konstanta yang sama: skenario
    yang menunggu backend memakai `test.fixme` bersyarat, skenario yang
    hanya berlaku selama konstanta null memakai `test.skip` bersyarat.
    Contoh: `IZIN_LINTAS_OUTLET` di `lib/auth/permissions.ts` dan
    `tests/helpers/lintas-outlet.ts` (pemilik proyek, 22 September 2026).
19. **Tipe ber-`_id` yang masih dibaca halaman lama menjadi jembatan
    berakhiran `Lama`.** Nama kanonik menjadi tipe ber-`id` dari bentuk
    respons nyata, sedangkan halaman lama memakai tipe lamanya lewat alias
    impor (`DiskonLama as Diskon`, sampai `1e05df6`), sehingga badan halaman tidak
    berubah. Tipe `Lama` dihapus di commit migrasi modul pemiliknya, dan
    sisanya dicatat di `status.md` sampai habis (pemilik proyek, 24
    September 2026: frontend akhirnya harus bersih dari `_id`).
20. **Endpoint buat yang mendukung idempotensi dipanggil dengan satu kunci
    per pengisian form.** Kunci dibuat saat form pertama kali lolos
    validasi, dipakai ulang bila permintaan diulang, dan diganti setelah
    berhasil, lewat opsi header `api.post` dan `apiData.post`. Contoh:
    `x-idempotency-key` di `useBuatPenjualan` (keputusan K3a).
21. **Spec e2e tidak memalsukan respons sukses.** `route.fulfill` hanya
    menjawab status gagal untuk jalur yang tidak dapat dibuat backend
    secara deterministik. Keadaan antara diuji dengan menahan permintaan
    lalu meneruskannya (`route.continue`), dan keberhasilan dibuktikan
    dari respons nyata atau data yang dibaca ulang lewat API. Simulasi
    berstatus 200 yang tidak terhindarkan ditandai `// simulasi:` beserta
    alasannya, dan gerbangnya `audit-fulfill.js`. Tujuan pengujian adalah
    membuktikan logika dan alur berjalan benar di frontend dan backend
    (pemilik proyek, 26 September 2026). Contoh:
    `tests/e2e/auth/login.spec.ts` (`5a3deea`).
22. **Seluruh input tanggal dan waktu memakai komponen kostum.** Tanggal
    memakai `PilihTanggal` (`components/pilih-tanggal.tsx`) dengan kalender
    kostum `components/calendar.tsx`, turunan kalender shadcn dengan
    tampilan proyek; jam dan menit memakai `InputWaktu`
    (`components/input-waktu.tsx`), dengan aturan di `lib/waktu.ts`.
    Kalender shadcn murni sudah dihapus, dan ESLint menolak impornya serta
    input tanggal atau waktu bawaan browser di JSX. Halaman lama yang
    masih menulis input jam sendiri (form shift dan jadwal) diganti saat
    modulnya dimigrasikan; buat reservasi sudah memakai kedua komponen
    sejak `477f258` (pemilik proyek, 28 September 2026, `e43e000`).
23. **Spec e2e menjalankan setiap operasi yang diuji lewat UI.** Data yang
    menjadi bahan uji dibuat, diubah, dan dihapus lewat halaman yang diuji,
    agar tombol dan fungsi yang rusak ikut terlihat; tidak ada data yang
    disuntikkan diam-diam lewat API. API hanya membaca bukti, menyiapkan
    data milik modul lain (misalnya produk uji untuk pajak per produk), dan
    membersihkan sisa run yang gagal. Aturan ini menemukan form buat pajak
    lama yang menahan submit sampai prioritas diketik (pemilik proyek,
    1 Oktober 2026, `9586e3c`). Spec yang ditulis sebelumnya dan masih
    menyiapkan data uji lewat API disesuaikan saat spec itu disentuh
    (`pengujian.md`, Utang pengujian).
24. **Rupiah ditampilkan lewat satu pemformat, `formatRupiah`
    (`lib/format.ts`), dengan batas pecahan yang eksplisit.** Batas
    pecahan bawaan `Intl` untuk IDR bergantung pada versi ICU runtime (0
    di Node 22, lebih dari 0 di Chromium), sehingga pemformat tanpa
    `maximumFractionDigits` memberi teks berbeda di server, di test, dan
    di browser untuk nilai pecahan. Halaman dan spec memakai
    `formatRupiah`, bukan `Intl.NumberFormat` sendiri; sembilan berkas
    yang masih memformat sendiri dipindah di `006d7f8`
    (pemilik proyek, 4 Oktober 2026, `4c9c4ed`).

### Penyesuaian backend `fc29433`

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
- **FC3a: halaman pajak mendapat entri `IZIN_HALAMAN`** (`read-pajak`
  atau `akses-pos`, `d3443e2`), diturunkan dari endpoint yang dipanggil
  halaman. Karena `IZIN_HALAMAN` hanya dibaca sidebar dan halaman pajak
  bukan menu sidebar, entrinya dibaca halaman pajak sendiri dan kartu di
  halaman indeks pengaturan.
- **FC4a: satuan resep yang tidak sah untuk bahannya ditahan di form
  produk** (`b887278`), bukan dibiarkan sampai backend menolaknya saat
  finalisasi.
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
