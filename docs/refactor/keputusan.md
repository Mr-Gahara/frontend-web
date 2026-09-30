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
  di-void langsung (`kontrak/temuan.md` butir 56).
- **R4b: tautan blok booking ke detail penjualan adalah jalur lihat dan
  bayar, bukan jalur batal** (`eef371a`). Web belum punya jalur
  membatalkan booking.
- **R5a: booking Batal tidak ditampilkan di timeline daftar reservasi**
  (`eef371a`), karena slotnya sudah dilepas; backend tetap mengirimnya,
  karena daftar tidak disaring menurut status.
- **R6a: pemeriksaan bentrok di form buat reservasi hanya menghitung
  booking Aktif** (28 September 2026), sejalan dengan `checkConflict`
  backend; sebelumnya booking Selesai ikut dihitung. Diterapkan di
  `477f258` lewat `bookingBentrok`, dan diuji di test unit.
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
- **KU2a: kartu ringkasan yang gagal memuat menampilkan `-`** beserta
  keterangan singkat, bukan Rp0 (keputusan rancangan butir 11).
- **KU3a: skema buat akun kas mempertahankan `z.coerce`** dengan tipe
  masukan dan keluaran eksplisit, seperti T2a; `.default()` dibuang
  karena nilai awal sudah ada di `defaultValues`.
- **KU4a: spec buat akun kas membuat akun uji sungguhan** bernama unik
  per run, lalu menghapusnya lewat `DELETE /akunkas/:id` di `finally`
  (`0cfb3bd`).
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
  tetap untuk modul Profil, login, dan sidebar.
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
    `features/transfer-stok/payload.ts` (pemilik proyek, 21 September 2026).
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
