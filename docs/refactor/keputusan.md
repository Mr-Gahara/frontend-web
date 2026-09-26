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
  di `app`, `components`, `hooks`, `lib`, dan `types`.

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
  aksi mengikuti izin, dan backend menolak dengan 403.
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
- **Item yang master bahan bakunya terhapus menahan penerimaan** (butir 29).
  Aturan ini tidak dikendalikan konstanta, karena payload yang benar untuk
  item itu baru ada bila kontrak terima berubah.
- **Spec memakai data sungguhan yang dibuat dan ditutup sendiri.** Surat
  jalan dibuat dari pengajuan APPROVED atau PENDING tanpa surat jalan,
  dikirim lewat API bila skenarionya butuh DIKIRIM, dan dibatalkan di akhir,
  sehingga pengajuannya kembali ke PENDING. Kirim dan terima hanya diuji
  jalur gagalnya lewat `page.route`; batal dari DIKIRIM lewat API hanya
  dipakai membersihkan data uji.
- **Daftar penerimaan outlet mengikuti cakupan outlet**: pemegang izin
  lintas outlet seluruh outlet dengan pemilih, pengguna lain hanya outlet
  tenant (`580a1e1`, `085ec78`).
- **Batal surat jalan di web hanya untuk PENDING**, walau backend menerima
  batal dari DIKIRIM, karena stok gudang langsung dikembalikan saat barang
  masih di perjalanan (butir 36).
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
  butir 37).
- **K5b dan K11b: daftar penjualan memakai cakupan outlet hanya bagi
  pemegang `read-location`.** Template Guest, Staff, dan Kasir memegang
  `read-penjualan` tanpa `read-location`, sehingga gate tidak ditambah, dan
  pengguna tanpa izin itu melihat penjualan seluruh tenant (pada MVP satu
  outlet sama dengan outlet tenant). Penjualan tanpa `locationID` dianggap
  milik outlet tenant, sama dengan cadangan backend saat finalisasi. Wajib
  ditutup sebelum multi-outlet (`kontrak/temuan.md` butir 48 dan 49).
- **K6b: spec alur membuktikan alur bisnis sampai stok dan pembayaran**,
  dengan stok disiapkan sesuai kebutuhan setiap test, walau meninggalkan
  penjualan FINAL dan pembayaran di data uji.
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
  ditentukan, menggantikan "Kasir" yang selalu tampil.
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
  penjualannya**, satu-satunya jalur membatalkan booking, tanpa menambah
  aksi ubah atau hapus sesi booking.

## Keputusan rancangan yang mengikat

1. **Tipe selalu memakai `id`**, tidak pernah `_id`, karena `lib/api/client.ts` menormalkan respons. Pola `id || _id` tidak boleh ditulis lagi.
2. **Owner tidak diperlakukan khusus** lewat pengecekan nama role. Backend memberi Owner seluruh permission, sehingga pemeriksaan berbasis daftar permission sudah mencakupnya. Pengecualian: `useLevelPenggunaAktif` memakai nama role untuk menentukan level 100, karena token tidak membawa level; dipakai modul pengguna dan role untuk membandingkan level role. Cakupan data lintas lokasi di ruang outlet sempat mengikuti level itu, dan sejak `085ec78` mengikuti izin lintas outlet (`bolehLintasOutlet`), sehingga tidak lagi bergantung pada nama role. `gudang/layout.tsx` masih memeriksa nama role Owner (baris 32) dan dibereskan bersama modul gudang.
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
    `features/transfer-stok/payload.ts` (pemilik proyek, 21 September 2026).
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
    impor (`PelangganLama as Pelanggan`), sehingga badan halaman tidak
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
