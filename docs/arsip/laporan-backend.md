# Arsip Laporan Backend

Sifat perubahan: **Jarang**: hanya bertambah saat isi dipindah dari lapis lain; isi lama tidak diubah.

Lapis arsip: tidak perlu dikirim di chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Catatan untuk tim backend

Berkasnya disimpan pemilik proyek di `~/Documents/catatan-backend/`:

- `README.md` — temuan 1 sampai 6 dari Fase 1
- `catatan-lanjutan-backend-hapus-pengguna-dan-aturan-pin.md` — temuan 7 sampai 9
- Laporan Fase 2 — 13 temuan, sudah diserahkan ke tim backend
- Laporan modul produk dan kategori — 8 temuan, disusun 20 September 2026:
  stok tertimpa 0 saat edit produk, hapus kategori tanpa pemeriksaan
  pemakaian, keberadaan kategori tidak diperiksa, field duplikat kategori yang
  salah, satuan resep lebih sempit dari satuan bahan baku, cache daftar produk
  tidak dibersihkan saat kategori berubah, detail produk tanpa timestamp, dan
  import tidak terpakai
- Laporan submodul stock adjustment — 1 temuan, disusun 20 September 2026:
  mapper membaca empat field yang tidak ada di model dan tidak mengirim
  `referenceType`
- Laporan submodul stock opname — 2 temuan, disusun 20 September 2026:
  simpan hitungan menolak isian kosong sehingga simpan sementara sebagian
  tidak mungkin, dan data tidak dibatasi per lokasi (perlu keputusan)
- Laporan submodul pengajuan stok (daftar) — 1 temuan, disusun 20 September
  2026: status yang disembunyikan menurut izin dijawab daftar kosong tanpa
  keterangan, sehingga klien harus mencerminkan aturan service
- Tindak lanjut atas tanggapan tim backend 20 September 2026 (berkas
  README-Temuan-Frontend di repo backend, menanggapi temuan 2, 9, 18, dan
  19) — 3 temuan, disusun 21 September 2026: validator stock opname masih
  menolak `qtyPhysical` null sehingga perbaikan SO-1 tidak sampai ke
  endpoint (butir 22), `referenceID` adjustment berisi objek populate tanpa
  dokumentasi, dan `GET /jurnalstok` tidak membaca query lokasi (bersama
  SO-3), beserta konfirmasi SO-2, koreksi butir 2 dan 9, dan kontrak
  inventory
- Laporan arah lokasi pengajuan stok — 4 temuan, disusun 21 September 2026:
  tipe lokasi pengajuan tidak divalidasi sehingga pengajuan terbalik dari
  web diterima, pengajuan APPROVED dan PENDING masih bisa diubah, respons
  `approve` berisi dokumen sebelum diperbarui, serta dokumentasi arah dan
  nama endpoint lama; beserta catatan pembalikan 8 pengajuan development
- Laporan submodul transfer stok: penerimaan dan surat jalan — 8 temuan,
  disusun 21 September 2026 setelah `dec9d01`: terima mengganti seluruh
  items tanpa validasi, jumlah diterima 0 menambah stok penuh, dugaan
  dampak ke aplikasi Flutter, PUT surat jalan menerima field yang
  seharusnya dikunci, daftar surat jalan mengabaikan query, hapus draf
  tidak melepas ikatan pengajuan, validator update tetap valid tanpa field
  sah, dan batal dari DIKIRIM saat barang di perjalanan (perlu keputusan);
  beserta konfirmasi validator inventory di route (`fc159bd`) dan bukti
  surat jalan development yang rusak (`kontrak/temuan.md` butir 29 sampai
  36)
- Laporan model bisnis MVP dan izin lintas outlet — 3 temuan dan satu
  jawaban keputusan, disusun 22 September 2026: stok produk dihitung dari
  master bahan baku tanpa lokasi, stok awal bahan baku jatuh ke lokasi apa
  pun bila tenant belum punya outlet, dan permintaan permission lintas
  outlet; beserta jawaban SO-3 bahwa data tidak dibatasi per lokasi
  pengguna (`kontrak/temuan.md` butir 20 dan 37 sampai 39)
- Laporan pembatasan stock adjustment per ruang — 1 temuan, disusun 23
  September 2026: daftar dan detail adjustment tidak membedakan ruang
  outlet dan gudang, baik lewat izin maupun lewat penyaring, sehingga
  pemisahan stok outlet dan gudang hanya ditegakkan di tampilan frontend
  (`kontrak/temuan.md` butir 40)
- Laporan modul penjualan dan pembayaran — 9 temuan, disusun 26 September
  2026: validator buat penjualan mewajibkan `penggunaID` yang dibuang
  controller, galat validasi penjualan dan pembayaran tanpa `status` dan
  `message`, daftar pembayaran tanpa filter per penjualan dan tanpa nama
  metode, pembayaran tanpa idempotensi, `isAutomated` yang tidak ada di
  model, cache daftar jurnal yang tidak dibersihkan saat jurnal ditulis,
  hapus bahan baku yang meninggalkan data yatim, pengguna tanpa
  `read-location` yang tidak dapat mengetahui outletnya, dan daftar
  penjualan tanpa filter lokasi; beserta catatan 408 test merah di branch
  `ridho` (`kontrak/temuan.md` butir 41 sampai 49)
- Laporan spec login — 1 temuan, disusun 26 September 2026: login akun
  membedakan email tidak terdaftar (404) dari password salah (400),
  sehingga keberadaan sebuah email dapat diketahui tanpa password
  (`kontrak/temuan.md` butir 50)
- Laporan master data reservasi — 5 temuan, disusun 27 September 2026:
  cache daftar aset tidak dibersihkan saat tipe aset dihapus, hapus aset
  dan tipe aset tanpa pemeriksaan pemakaian, hapus tarif menjawab 500
  setelah datanya terhapus, ubah tarif tidak dapat melepas tipe aset, dan
  cache tipe aset dibersihkan dengan `tenantID` undefined
  (`kontrak/temuan.md` butir 51 sampai 55)
- Laporan modul reservasi: sesi booking — 4 temuan, disusun 27 September
  2026 setelah `eef371a`: booking tanpa pembayaran tidak dapat dibatalkan
  karena penjualannya selalu FINAL (perlu keputusan alur), void penjualan
  tidak membersihkan cache daftar per tanggal dan detail booking, status
  Selesai ditulis saat daftar dibaca, dan kode lama yang dikomentari di
  `services/sesiBooking/sesiBookingService.js` (`kontrak/temuan.md` butir
  56 sampai 59)
- Laporan setelah spec keuangan — 2 temuan, disusun 28 September 2026
  setelah `0cfb3bd`: nomor surat jalan yang dapat bentrok karena dibentuk
  dari nomor pengajuan dan empat digit terakhir `Date.now()`, dan
  kebutuhan endpoint mutasi kas untuk halaman mutasi arus kas (perlu
  keputusan) (`kontrak/temuan.md` butir 60 dan 61)
- Laporan spec jadwal shift — 5 temuan, disusun 29 September 2026
  setelah `d9af531`: jadwal dengan shift tidak aktif dilewati diam-diam
  oleh generate, galat `bulkWrite` ditelan, satu hari dapat libur
  sekaligus punya shift (perlu keputusan), nama dan role karyawan di
  respons jadwal selalu "Tidak Diketahui", dan respons sukses walau
  jadwal ditolak (`kontrak/temuan.md` butir 62 sampai 66)
- Laporan submodul shift — 5 temuan dan 1 permintaan, disusun 29
  September 2026 setelah `f99b7cf`: penyebab `GET /shift` tanpa query
  menjawab 500, cache daftar shift yang tidak pernah dibaca, jam tanpa
  titik dua diterima, lintas hari tidak dicocokkan dengan jam, dan
  `tenantID` yang dapat diubah lewat `PUT /shift/:id`; beserta permintaan
  `locationID` untuk shift, pola roster, dan monitoring absensi
  (`kontrak/temuan.md` butir 8 dan 67 sampai 71)
- Laporan submodul pola roster — 2 temuan, disusun 29 September 2026
  setelah `dcc22e0`: `tenantID` yang dapat diubah lewat
  `PUT /polaroster/:id`, dan cache daftar pola roster yang basi saat
  shift diubah (`kontrak/temuan.md` butir 72 dan 73)
- Laporan modul Gudang — 1 temuan, disusun 30 September 2026 setelah
  `319bd99`: dashboard gudang dan outlet mencampur data lokasi (stok
  kritis dan jurnal terbaru dari seluruh lokasi tenant), tidak memeriksa
  izin baca modul, dan mengirim jurnal tanpa mapper
  (`kontrak/temuan.md` butir 74)
- Laporan penyesuaian backend `465b438` — 8 temuan untuk backend dan satu
  catatan milik frontend (butir 82), beserta penilaian ulang, disusun
  30 September 2026 setelah `b63cf08`: catatan pembayaran
  tertimpa alasan pembatalan, larangan pengaju menyetujui pengajuannya
  sendiri tanpa pengecualian Owner (perlu keputusan), `DELETE /tipeaset`
  dan `/tarif` yang sesekali tertahan (pengamatan), sisa jalur payment
  gateway, dokumen metode pembayaran yang masih menyebut gateway,
  `assignPajak` tanpa pemeriksaan tenant, akun kas bersaldo yang tidak
  dapat ditutup (perlu keputusan), route hapus yang hilang sementara
  halaman web lama masih memanggilnya, dan urutan per kolom di
  `GET /penjualan`; beserta konfirmasi butir yang sudah diperbaiki
  (`kontrak/temuan.md` butir 29, 30, 33, 36, 41, 43, 51 sampai 58, dan 75
  sampai 83)
- Laporan submodul metode pembayaran — 3 temuan dan satu perluasan,
  disusun 1 Oktober 2026 setelah `3359497`: membuat metode nonaktif tetap
  dihitung ke batas 10 metode aktif, nama kembar diperiksa sebelum
  dipangkas, dan metode aktif terakhir dapat dinonaktifkan (perlu
  keputusan); beserta perluasan butir 77, yaitu `POST /tipeaset` yang
  juga tertahan setelah data tersimpan dan enam tipe aset uji yang
  tertinggal sebagai jejaknya, serta konfirmasi butir 84 yang diperbaiki
  di frontend (`kontrak/temuan.md` butir 77 dan 85 sampai 87)
- Laporan submodul pajak — 9 temuan, disusun 1 Oktober 2026 setelah
  `b84de56`: `pajakList` produk dibentuk dari field yang tidak pernah
  ditulis, `PUT /pajak/:id` menyimpan `tenantID` dari body, penonaktifan
  otomatis pajak per transaksi yang tidak atomik, `tipePajak` wajib di
  setiap update, relasi pajak yatim saat produk dihapus, relasi ke pajak
  nonaktif yang tersembunyi tetapi tertimpa, cache produk yang tidak
  dibersihkan saat pajak diubah, simulasi pajak transaksi yang berbeda
  dari penjualan, dan konstanta validator yang tidak dipakai
  (`kontrak/temuan.md` butir 88 sampai 96)
- Laporan permission seed — 1 temuan, disusun 1 Oktober 2026 setelah
  `366e9b7`: sinkron seed permission tidak membuang nama yang dikeluarkan
  dari daftar, `--reset` memutus referensi setiap role selain Owner, dan
  izin baru hanya sampai ke role Owner lewat `seedOwnerPermission.js`;
  beserta bukti basis data development (lima nama lama dipegang lima role,
  tiga izin jurnal transfer belum ada) dan cara penyelarasannya
  (`kontrak/temuan.md` butir 97)
- Laporan penyesuaian backend `yoga` — 1 temuan dan satu pengamatan,
  disusun 2 Oktober 2026 setelah `a4304ce`: stok produk yang masih potret
  padahal menjadi gerbang finalisasi (butir 37, sebagian), dan kejadian
  keempat permintaan tertahan (butir 77); beserta konfirmasi butir 11,
  75, dan 83 yang terbukti diperbaiki lewat e2e (`kontrak/temuan.md`)
- Laporan submodul profil outlet — 5 temuan, disusun 2 Oktober 2026
  setelah `fcf2dd2`: token hasil `pin-refresh` web membawa `tenantName`
  "Toko Tidak Diketahui", `isSetupComplete` yang dapat diubah klien,
  panjang `namaToko` dihitung sebelum dipangkas, validasi yang berjalan
  sebelum pemeriksaan izin di `PUT /tenant/:id`, serta `persenPajak`,
  `tipePajak`, dan `logoUrl` tenant tanpa pemakai (perlu keputusan)
  (`kontrak/temuan.md` butir 98 sampai 103)
- Laporan submodul pelanggan — 3 temuan, disusun 2 Oktober 2026 setelah
  `d9365d3`: `PUT /pelanggan/:id` menerima operator MongoDB dari body
  sehingga field yang dilindungi dapat diubah (alasan keamanan, dibuktikan
  lewat permintaan nyata), nomor HP, email, dan alamat yang tidak dapat
  dikosongkan padahal dijawab berhasil, dan duplikat yang dijawab 400
  (`kontrak/temuan.md` butir 104 sampai 106)
- Laporan submodul diskon — 3 temuan dan satu catatan milik frontend,
  disusun 2 Oktober 2026 setelah `52c550e`: diskon khusus member yang
  tidak dapat dipakai karena permission membership tidak ada di seed,
  diskon Non-Aktif yang ikut dihitung ke batas 50 diskon aktif saat
  dibuat, dan jam berlaku yang dibaca dalam WIB tetap (perlu keputusan);
  beserta catatan bahwa halaman diskon lama mengirim `POST` saat mengubah
  (`kontrak/temuan.md` butir 107 sampai 110)
- Laporan modul Profil, login, dan sidebar — 1 temuan, 1 permintaan, dan
  3 konfirmasi kontrak, disusun 2 Oktober 2026 setelah `57a7084`: PIN
  lama yang salah dijawab 401 sehingga klien menyegarkan token dan
  mengirim ulang permintaan, dan permintaan jalur hapus akun sendiri bagi
  Owner (perlu keputusan); beserta konfirmasi bahwa web kini mengandalkan
  izin diri sendiri di `GET` dan `PUT /pengguna/:id`, field `PUT` yang
  seluruhnya opsional, dan kontrak login pengguna
  (`kontrak/temuan.md` butir 111 dan 112)
- Laporan modul panel admin — 10 butir, disusun dan diserahkan 3 Oktober
  2026 setelah `c824f18`: `PUT /akun/admin/users/:id` tanpa validator dan
  allowlist sehingga `role` dan `tenantID` dapat diubah (alasan
  keamanan), password admin yang salah saat hapus dijawab 401, akun tanpa
  masa akses yang tidak dapat diaktifkan tanpa durasi (perlu keputusan),
  hapus akun yang menjawab berhasil sebelum data toko terhapus, riwayat
  langganan yang gagal dicatat ditelan, respons aksi admin yang tidak
  sebentuk dengan daftar, permintaan endpoint detail akun dan daftar yang
  dapat dipotong, riwayat tanpa jumlah total dan tanpa mapper, respons
  login admin yang berbeda bentuk, dan `username` ber-`sparse` tanpa
  indeks; beserta konfirmasi kontrak akun admin yang terbukti lewat e2e
  (`kontrak/temuan.md` butir 113 sampai 122)
- Laporan halaman mutasi arus kas — 1 catatan dan 2 permintaan, disusun
  dan diserahkan 3 Oktober 2026 setelah `6a57d12`: batas periode
  bertanggal saja dibaca
  sebagai tengah malam UTC (dokumentasi atau keputusan zona waktu), baris
  mutasi tanpa nama akun, nama pencatat, dan id penjualan, serta
  ringkasan periode gabungan seluruh akun kas; beserta konfirmasi bahwa
  butir 61 terpenuhi dan kontrak mutasi yang terbukti lewat e2e
  (`kontrak/temuan.md` butir 61 dan 123 sampai 125)
- Laporan Pindah Dana (jurnal transfer) — 3 temuan dan 1 permintaan,
  disusun dan diserahkan 4 Oktober 2026 setelah `e53c016`: jumlah
  transfer pecahan diterima validator, keterangan dan catatan transfer
  yang sudah VOID masih dapat diubah, penolakan aturan dijawab 400 dan
  galat validator tanpa `message`, serta permintaan filter periode di
  daftar transfer; beserta konfirmasi kontrak jurnal transfer yang
  terbukti lewat e2e dan permintaan nyata
  (`kontrak/temuan.md` butir 126 sampai 129)
- Laporan modul beban operasional dan kategori beban — 9 butir, disusun
  4 Oktober 2026 setelah `7fce871`: setiap permintaan ke kedua endpoint
  dijawab 403 karena izinnya tidak ada di seed dan pembandingnya nama
  terhadap `_id` (penghalang), beban mengubah saldo tanpa buku mutasi,
  laporan laba rugi menyaring status VOID yang tidak ada di model (perlu
  keputusan VOID atau hapus), buat beban tanpa pemeriksaan saldo, akun,
  dan kategori serta tidak atomik, ubah beban tanpa `$set` dan allowlist
  yang dapat merusak saldo, kategori yang dapat dihapus selagi dipakai,
  permintaan daftar berpaginasi, berfilter, dan bermapper, bentuk galat
  dan aturan nilai, serta dokumen API yang masih kerangka; hanya butir
  pertama yang terbukti lewat permintaan nyata
  (`kontrak/temuan.md` butir 130 sampai 138)
- Laporan penyesuaian `fc29433` (disusun 5 Oktober 2026): kategori beban
  masih dijawab 403 (butir 130), `tipePajak` masih wajib di
  `PUT /pajak/:id` (butir 91), dan bahan bersatuan pak atau unit tidak
  dapat dipakai di resep (butir 15)
- Laporan 7 Oktober 2026, disusun per pemilik (Yoga, Nizar, Ridho) dan
  semula disebut laporan penyesuaian `nizar` — 3 temuan dan konfirmasi,
  disusun 7 Oktober 2026 setelah `729c16a` dan sudah diserahkan ke tim
  backend (tercatat di `docs/pengembangan/klien.md` backend sebagai
  Laporan Frontend Web 8 Oktober 2026): nomor pengajuan dibentuk dari
  urutan
  `createdAt` sehingga dapat mengunci pembuatan pengajuan sebulan
  (beserta catatan penggeseran tiga dokumen development), permintaan
  filter per penjualan di daftar sesi booking, dan booking lama
  berstatus Batal yang tidak dimigrasikan; beserta konfirmasi butir yang
  terbukti diperbaiki `nizar` `c29310c` dan `60575b5`, dan butir yang
  masih terbuka (`kontrak/temuan.md` butir 139 sampai 141)
- Laporan penyesuaian `nizar` `8dc6211`, untuk Nizar — 1 temuan, 1
  pelurusan, dan konfirmasi, disusun dan diserahkan 8 Oktober 2026
  setelah `5b92d14`:
  perubahan indeks skema pelanggan tidak sampai ke basis data yang sudah
  berjalan, sehingga nama kembar tetap ditolak dan kontak pelanggan
  terhapus tetap terkunci (perlu migrasi indeks); pelurusan bahwa filter
  `?penjualanID=` berasal dari permintaan web dan tidak dipakai; beserta
  konfirmasi butir 104, 105, 106, 140, dan 141 (`kontrak/temuan.md`
  butir 142)
- Konfirmasi untuk Yoga atas `yoga` `55328f1`, disusun 8 Oktober 2026
  setelah `f64b518`, tanpa temuan baru: B36, B37, dan B38 (Yoga) terbukti
  dari web (`kontrak/temuan.md` butir 130, 91, dan 15 tertutup). Butir
  lama yang masih terbuka tidak diulang
- Laporan 11 Oktober 2026, per pemilik (Yoga dan Nizar), terhadap `ridho`
  `2dd57aa` — 3 temuan dan hasil pembuktian, disusun dan diserahkan 11
  Oktober 2026 setelah `43f09af`: bahan baku yang baru dibuat tidak dapat
  dihapus karena entri stok otomatisnya dihitung sebagai keterkaitan
  (Yoga), filter lokasi daftar penjualan yang belum dapat dipakai karena
  sebagian besar penjualan tanpa `locationID` (Nizar), dan nama penyetuju
  yang kosong di daftar pengajuan stok (Yoga); beserta pembuktian butir
  44, 46, 76, 93, dan 142 (`kontrak/temuan.md` butir 143 sampai 145).
  Versi ringkas butir 143 dan 145 juga dikirim ke Yoga, begitu pula
  usulan VOID beralasan untuk beban operasional
- Laporan 11 Oktober 2026 dari fase UI/UX, 2 temuan, disusun dan
  diserahkan 11 Oktober 2026 setelah `5706d4c`: `GET /izincuti` tanpa
  filter tanggal, dan `startDate` bertanggal saja di
  `GET /penjualan` yang dibaca sebagai tengah malam UTC
  (`kontrak/temuan.md` butir 146 dan 147)
- Penyesuaian 16 Oktober 2026 terhadap `ridho` `7d28135` tanpa temuan
  baru, sehingga tanpa laporan. Pembuktian butir 143 sampai 145, 147, dan
  B89 sampai B94 (Yoga) tercatat di `kontrak/temuan.md`; Yoga dan Nizar
  diberi tahu gabungannya
- Laporan untuk Yoga: 1 temuan dan pembuktian, disusun 19 Oktober 2026
  terhadap `ridho` `af5f315`: hitungan `siapDibuatSuratJalan` dashboard
  gudang ikut menghitung pengajuan yang sudah punya surat jalan (butir
  149); B98 sampai B100 terbukti (butir 22, 148, dan 137), dan B97
  dicatat
- Laporan untuk Yoga: 4 temuan dan pembuktian, disusun 21 Oktober 2026
  terhadap `ridho` `b5b367a`: pencarian teks di lima daftar stok (butir
  150), filter tipe lokasi (butir 151), filter tab gabungan pengajuan
  (butir 152), dan komentar arah surat jalan (butir 153); butir 149
  (B101) dan 46 (B102) terbukti

Cakupan laporan Fase 2: `pin-refresh` 500 tanpa body, `GET /shift`
500, validator pola roster, hapus pengguna, field yang dipakai service tetapi
tidak ada di validator, envelope tidak seragam, identitas tidak seragam,
33 endpoint tanpa `checkPermission`, 17 permission tanpa route, nama permission
pengiriman stok tidak sejalan, permission jadwal belum ada, allowlist tidak
universal, dan konfirmasi kebijakan sesi web tunggal.
