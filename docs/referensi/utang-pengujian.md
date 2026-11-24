# Utang Pengujian

Sifat perubahan: **Sering**: bertambah saat modul dikerjakan; butir yang lunas dipindah ke `arsip/riwayat-pengujian.md`.

Lapis referensi: kirim bersama dokumen modul saat menulis atau mengubah spec modul itu. Isinya dipindah dari `inti/pengujian.md` pada 25 Oktober 2026 tanpa perubahan.

Cakupan uji yang belum lengkap beserta alasannya, dan data uji yang
tertinggal di basis data development. Butir yang sudah lunas dan
kejadian sesekali yang tidak berulang ada di `arsip/riwayat-pengujian.md`.

## Utang pengujian

- **Pemilih outlet di jurnal stok dan pembelian stok hanya berisi satu
  pilihan** di MVP satu outlet, sehingga memilih outlet tidak memicu
  permintaan baru. Kedua jalur cakupan lokasi teruji e2e sejak
  `1cd8211` (`arsip/riwayat-pengujian.md`).
- **Terima penerimaan yang berhasil** diuji sungguhan lewat UI sejak
  `6e314ae` (keputusan PB12a), termasuk jumlah 0. Setiap run menambah stok
  outlet secara permanen, dan surat jalan DITERIMA tidak dapat dibatalkan.
- **Item tanpa master bahan baku pada penerimaan** hanya teruji di unit
  test (`tests/unit/features/transfer-stok/payload.test.ts`), karena
  membuat datanya berarti menghapus master bahan baku.

- **Cakupan per lokasi di daftar penjualan hanya teruji pada satu
  outlet** (`20c026b`): `locationID` yang terkirim sama dengan
  `/location/current`, dan seluruh baris milik outlet itu. Data uji hanya
  punya satu outlet, sehingga hasilnya sama dengan tanpa penyaringan.
  Jalur lintas outlet (LP2a) berjalan sejak `2eb668a` dan jalur terkunci
  sejak `1cd8211`; aturan lingkup diuji di
  `tests/unit/features/penjualan/filter.test.ts`.
- **Penolakan backend saat mencatat beban** (saldo kurang atau akun
  nonaktif, 409) tidak punya skenario e2e: form menahan jumlah di atas
  saldo sebelum permintaan dikirim.
- **Idempotensi hanya teruji dari sisi klien**: kunci terkirim dan sama saat
  permintaan diulang. Penahanan permintaan kembar di backend tidak diuji
  dari web.
  Berlaku juga untuk buat pembayaran sejak `26093b0` (RH1a).
- **Spec shift dan pola roster meninggalkan shift uji**: shift hanya
  dapat dinonaktifkan, tidak dihapus, sehingga setiap run menambah shift
  "Shift Ganda ..." (spec shift), serta "Shift Arsip ..." dan "Shift
  Arsip Generate ..." nonaktif (spec pola roster dan generate jadwal), di
  samping shift uji lama spec shift. Fixture "E2E Jadwal Siang" dibuat
  sekali lalu dipakai ulang. Pola roster uji dihapus di akhir setiap
  skenario baru. Shift uji yang masih Aktif juga tertinggal ("Shift Batal
  Hapus ...", "Shift Prefill ...", "Shift Ganda ...", "Shift Ruang ...").
  Dibersihkan 20 November 2026: 539 shift uji Aktif dan Non-Aktif yang
  tidak dirujuk jadwal maupun pola roster dihapus; fixture "E2E Jadwal
  ..." dan shift asli toko tetap (`inti/status.md`, Utang kecil dari
  penyesuaian backend `4759208`).
- **Status aset "Digunakan"** belum teruji (penghapusan aset yang punya
  booking teruji di `reservasi/aset/crud-aset.spec.ts` sejak `66ea7a4`).
  Spec daftar reservasi kini membuat booking sungguhan yang
  mencakup waktu sekarang, tetapi label status aset uji hanya dibandingkan
  dengan respons `GET /aset`, karena daftar aset di-cache backend 60 detik
  dan belum terbukti dibersihkan saat booking dibuat.
- **Booking uji dibersihkan lewat API**: pembayaran PAID-nya dibatalkan,
  lalu penjualannya di-void (PB8a), walau web kini punya jalur void untuk
  penjualan booking yang belum dibayar (PB2a). Setiap run spec daftar
  reservasi meninggalkan penjualan booking VOID dan booking VOID.
- **Blok booking tanpa penjualan** (tanpa tautan R4b) hanya teruji di unit
  test (`tests/unit/features/sesi-booking/tampilan.test.ts`), karena jalur
  buat booking selalu membuat penjualan.
- **Bentrok yang tidak menghitung booking Selesai** (keputusan R6a) hanya
  teruji di unit test `bookingBentrok`, karena membuat booking Selesai di
  e2e berarti membuat booking di masa lalu.
- **Total laba rugi periode Bulanan di halaman ringkasan tidak dicocokkan
  dengan respons**, karena kartu ringkasan di layout meminta periode yang
  sama pada saat yang sama, sehingga respons milik halaman tidak dapat
  dibedakan. Periode Harian dan Mingguan dicocokkan penuh, dan kartu laba
  bulanan dicocokkan di halaman akun kas (`0cfb3bd`).
- **Arah badge pertumbuhan laba hanya pasti teruji di unit test.**
  Skenario KU5a membandingkan badge dengan `teksPertumbuhan` dari dua
  respons nyata, sehingga jalur yang teruji e2e bergantung pada data laba
  dua hari terakhir. Panah naik dan turun teruji di
  `tests/unit/features/laporan/periode.test.ts`, sedangkan warna badge
  belum teruji.
- **Password salah pada akun uji menambah hitungan pembatas login**, dan
  login sukses tidak menguranginya. Spec login gagal lebih awal bila sisa
  kuota di header `RateLimit` di bawah 3; menjalankan spec auth berulang
  (`--repeat-each`) dalam 15 menit dapat mengunci login seluruh suite.
- **Jalur layout gudang selain Owner hanya teruji di unit test**
  (`tests/unit/features/inventaris/gudang.test.ts`): pengguna tanpa
  `read-location`, tanpa `create-location`, dan tenant tanpa gudang,
  karena satu-satunya akun uji berperan Owner dan tenant uji sudah punya
  gudang.
- **Akun kas uji menumpuk sebagai non-aktif**, satu per run spec
  keuangan, lima per run spec ubah akun kas (`1bc76f4`), dua per run
  spec Pindah Dana (`e53c016`), dan satu per run spec tutup akun
  bersaldo (`f7805ca`), karena akun
  kas tidak dapat dihapus sejak backend `465b438`
  (PB13a, `kontrak/temuan.md` butir 81). Payload bersaldo hanya diperiksa
  lewat `POST` yang dijawab gagal. Per 14 November 2026 tenant uji punya 663 akun
  non-aktif, seluruhnya berawalan "E2E", dan halaman Akun Kas menampilkan
  "Akun non-aktif (663)". Dibersihkan 18 November 2026 lewat skrip mongosh
  (`inti/status.md`, Utang kecil dari penyesuaian backend `4759208`): yang
  tidak dirujuk dokumen lain dihapus, dan 148 yang dirujuk jurnal transfer
  tetap; sesudah spec terdampak dijalankan ulang tinggal 157. Metode,
  diskon, dan shift uji nonaktif serta pelanggan terhapus lunak
  dibersihkan bersamanya dan kembali tumbuh per run seperti tercatat di
  butirnya masing-masing. Dibersihkan lagi 20 November 2026 atas
  keputusan pemilik proyek (opsi hapus beserta transfernya): 192 akun E2E
  non-aktif dihapus bersama 316 jurnal transfer Rp1 yang melibatkannya dan
  956 baris mutasinya di kedua sisi. Efek bersih transfer itu di akun
  lawan ("kasir outlet" dan "Kas Kecil (Laci)") nol, sehingga saldo dan
  saldo berjalannya tidak berubah. Satu akun E2E tetap, karena dirujuk
  transfer Rp1,5 bukti butir 126; tenant uji kini punya lima akun kas
  E2E (`inti/status.md`, Utang kecil dari penyesuaian backend `4759208`).
  Sejak 23 November 2026 spec ubah akun, Pindah Dana, dan tutup bersaldo
  memakai akun uji tetap (nama berakhiran " Tetap", `akunUjiTetap`), dan
  hanya Buat Akun yang menambah satu akun per run; `bersih-akunkas.js`
  sesudah suite penuh mengecualikan akun tetap (AU1a, `modul/keuangan.md`).
- **`hapusLewatApi` menerima 404 sebagai sudah terhapus**, padahal route
  yang dihapus backend juga menjawab 404. Route hapus yang hilang tidak
  terdeteksi helper ini; yang menangkapnya adalah audit endpoint
  (`referensi/helper-dan-shell.md`, Helper penggantian).
- **Persetujuan pengajuan uji memakai pengguna penyetuju uji** "E2E
  Penyetuju", karena backend melarang pengaju menyetujui pengajuannya
  sendiri (`kontrak/temuan.md` butir 76, PB11a). Jalur Owner menyetujui
  pengajuannya sendiri belum teruji.
  Sejak `a8aec53` pengajuan uji disetujui Ridho sendiri (RH5a), sehingga
  jalur Owner teruji; penolakan bagi peran lain belum teruji dari web.
- **`DataTable` mode server hanya dipakai dan teruji di daftar
  penjualan** (`tests/e2e/penjualan/daftar-penjualan.spec.ts`). Mode
  klien kesembilan tabel lain tidak berubah di `b63cf08`, dan tidak diuji
  ulang khusus. Urutan server (`urutanServer`, `a4304ce`) juga hanya
  dipakai dan teruji di daftar penjualan. Sejak `93490bb` `DataTable`
  menampilkan kartu per baris dan susunan kartu di HP. Label kartu HP,
  `lebarBungkus`, dan prop `rincian` punya test integrasi sejak `2bcb1ce`
  (`tests/integration/components/data-table/data-table.test.tsx`); susunan
  HP dilihat lewat tangkapan, bukan spec.
- **Batas 10 metode aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, karena sepuluh metode aktif tidak dapat
  dibuat di data uji tanpa menumpuk metode permanen. Peringatan metode
  aktif terakhir, akun nonaktif bertanda di form ubah, dan penolakan akun
  nonaktif saat mengaktifkan kembali hanya teruji di unit test
  (`tests/unit/features/metode-pembayaran/`).
  Peringatan itu diganti penahanan di `3b4f35b` (NZ4a), yang teruji e2e.
- **Metode uji menumpuk sebagai nonaktif**, satu per run spec kelola
  metode pembayaran, karena metode tidak dapat dihapus (PO10a).
  Dibersihkan 20 November 2026: 4 metode E2E nonaktif yang tidak dirujuk
  pembayaran.
- **Form metode pembayaran tanpa `read-akunkas` belum teruji e2e.** Tombol
  yang disembunyikan menurut izin (`aksiMetodePembayaran`) teruji e2e
  sejak `cbfa23b` lewat pengguna baca-saja.
- **Pajak per transaksi hanya diuji jalur gagalnya** (PO10a): membuat atau
  mengaktifkannya menonaktifkan `PPN` tenant uji. Penonaktifan otomatis
  yang tidak atomik (`kontrak/temuan.md` butir 90) terbukti dari kode
  saja.
- **Spec yang ditulis sebelum keputusan rancangan butir 23 masih
  menyiapkan sebagian data uji lewat API**, misalnya fixture metode
  pembayaran di spec kelola dan booking uji di spec reservasi;
  disesuaikan saat spec itu disentuh.
- **Kartu lokasi Profil Toko tanpa `read-location` belum teruji**, karena
  pengguna uji terbatas memegang izin itu; tenant tanpa outlet juga belum
  teruji, karena tenant uji punya outlet. Tanpa `read-location` teruji e2e
  sejak 20 November 2026 lewat "E2E Tanpa Lokasi" (keterangan izin tampil
  dan `GET /location/current` tidak diminta); tenant tanpa outlet tetap
  belum. Kartu profil tanpa
  `update-tenant` dan kartu lokasi tanpa `update-location` teruji e2e
  sejak `cbfa23b` lewat pengguna baca-saja.
- **Spec profil toko mengubah nama toko tenant uji untuk sementara**,
  lalu mengembalikannya lewat UI dan, bila test berhenti di tengah, lewat
  API di `finally`. Kode pos tenant uji menjadi teks kosong, bukan null,
  setelah run pertama.
- **Pelanggan uji dihapus lunak**, sehingga setiap run spec pelanggan
  menambah dokumen ber-`isDeleted` di basis data development; daftar dan
  indeks unik backend mengabaikannya. Dibersihkan 20 November 2026: 39
  pelanggan terhapus lunak yang tidak dirujuk penjualan, membership,
  booking, maupun pemakaian diskon.
- **Spec pemilih pelanggan menambah dua pelanggan terhapus lunak per
  run**, dan skenario nomor HP kembar satu.
- **Bahan uji "E2E Bahan Pak" permanen** di basis data development,
  dibuat sekali oleh spec produk (`f64b518`). Bahan bersatuan unit hanya
  teruji di unit test, dan penolakan backend atas satuan di luar
  `availableUnits` tidak diuji dari web, karena form menahannya lebih
  dulu.
- **Diskon uji menumpuk sebagai Non-Aktif**, lima per run suite penuh
  (satu dari spec pembanding, dua dari kelola, satu dari aturan, dan satu
  dari pilihan kasir), karena backend tidak punya `DELETE /diskon`. Diskon
  Non-Aktif tidak dihitung batas 50 diskon aktif. Dibersihkan
  20 November 2026: 28 diskon E2E Non-Aktif yang tidak dirujuk penjualan
  maupun pemakaian diskon.
- **Batas 50 diskon aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, dan hanya untuk tombol tambah; menu
  aktifkan yang terkunci saat batas tercapai belum teruji. Pilihan Aktif
  di form buat teruji e2e sejak `a80d2fa` (NZ5a).
- **Keterangan khusus member dan pemilih produk tanpa izin baca produk
  belum teruji**: sejak MB1a (17 November 2026) web dapat menandai khusus
  member dan centangnya teruji di `pelanggan/membership.spec.ts`, dan
  keterangan "Khusus member" di daftar dan pilihan diskon teruji e2e
  sejak 20 November 2026 (`diskon/pilihan-kasir.spec.ts`). Pemilih produk
  tanpa izin baca produk tetap belum, karena satu-satunya akun uji
  berperan Owner. `aksiDiskon` hanya teruji di unit test, dengan alasan
  yang sama.
- **Pilihan diskon kasir hanya teruji e2e di buat reservasi**; buat
  penjualan memakai `diskonAktif` yang sama dan teruji di unit test.
  `sedangBerlaku` dapat tertinggal sampai lima menit di cache, dan itu
  tidak diuji.
- **Pengguna uji "E2E Profil" permanen** di basis data development,
  dibuat sekali dengan peran tanpa izin pengguna. Nama, PIN, dan nomor
  HP-nya dipulihkan Ridho di awal setiap test (PF5a).
- **Profil Owner hanya teruji dibuka**, tidak diubah, karena nama dan PIN
  Ridho dipakai login seluruh suite.
- **Pesan titipan setelah PIN berubah hilang bila halaman dimuat ulang**,
  karena hanya hidup di memori; itu tidak diuji.

- **Spec panel admin bergantung pada `.env.e2e`**: tanpa kredensial admin
  uji, 16 dari 17 skenarionya dilewati (PA5a), sehingga mesin tanpa berkas
  itu tidak menguji panel admin sama sekali.
- **Pengulangan `DELETE` setelah password admin salah tidak diukur.**
  Respons 401 dan pesannya teruji; penyegaran token dan permintaan kedua
  hanya dibaca dari `lib/apiClient.ts` (`kontrak/temuan.md` butir 114).
- **Aktifkan dengan durasi wajib dan perpanjangan yang membuka akun
  kedaluwarsa hanya teruji di unit test**
  (`tests/unit/features/admin-akun/langganan.test.ts`), karena akun
  bermasa akses lewat atau beku karena kedaluwarsa tidak dapat dibuat
  lewat UI.
- **Tombol muat berikutnya riwayat langganan belum teruji e2e**, karena
  butuh lebih dari 20 catatan pada satu akun.
- **Bekukan dan hapus sungguhan hanya diuji pada akun uji tanpa toko.**
  Pemutusan sesi pengguna toko saat akun dibekukan dan penghapusan data
  toko saat akun dihapus tidak diuji.
- **Daftar akun yang gagal dimuat, domain email disposable, dan akun
  klien tanpa sesi pengguna yang membuka `/admin`** belum teruji e2e;
  yang terakhir teruji di `tests/unit/lib/auth/tujuan.test.ts`.

- **Spec mutasi arus kas bergantung pada data bulan berjalan**: empat
  skenarionya dilewati bersyarat bila belum ada mutasi, belum sampai dua
  halaman, atau belum ada pembatalan pembayaran pada bulan itu, sehingga
  di awal bulan jumlah skipped dapat naik.
- **Jenis mutasi saldo awal, beban, dan pembatalan transfer keluar belum
  teruji e2e** di halaman mutasi. Transfer masuk, transfer keluar, dan
  pembatalan transfer masuk teruji sejak `f7805ca`
  (`tutup-akun-bersaldo.spec.ts`). Label dan arah kesembilan jenis
  teruji di
  `tests/unit/features/akun-kas/mutasi.test.ts`.
- **Keadaan seluruh akun kas non-aktif belum teruji e2e**, karena tenant
  uji selalu punya akun aktif.
- **Penolakan 409 karena batas 10 akun kas aktif belum teruji e2e.**
  Skenario nonaktifkan yang ditolak memakai akun aktif bersaldo yang
  sudah ada dan dilewati bila tidak ada; penolakannya dapat berasal dari
  penjaga metode pembayaran, yang diperiksa backend lebih dulu, dan spec
  hanya memeriksa status 409 beserta pesan yang tampil. Penolakan yang
  pasti karena saldo teruji di alur tutup akun bersaldo (`f7805ca`), yang
  memakai akun uji tanpa metode pembayaran.
- **Transfer uji menumpuk**, karena transfer tidak dapat dihapus: satu
  VOID per run spec Pindah Dana, serta dua AKTIF dan satu VOID per run
  spec tutup akun bersaldo (`f7805ca`), masing-masing Rp1. Skenario
  utama kedua spec dilewati bila tidak ada akun kas aktif bersaldo di
  luar akun uji. Transfer uji yang terkumpul sampai 20 November 2026
  dihapus bersama akun kas uji (butir akun kas di atas); riwayat
  pengujiannya tetap tercatat di dokumen ini dan di baseline.
- **Penolakan backend atas Pindah Dana belum teruji e2e**: saldo sumber
  tidak cukup (ditahan form lebih dulu), akun nonaktif, dan pembatalan
  yang ditolak karena saldo akun tujuan tidak cukup. Statusnya (400)
  dibuktikan lewat skrip sekali pakai pada 4 Oktober 2026
  (`kontrak/temuan.md` butir 128).
- **Riwayat Pindah Dana tanpa izin baca hanya teruji di unit test**
  (`aksiTransfer`). Form tanpa izin buat dan tombol Batalkan tanpa izin
  ubah teruji e2e sejak `cbfa23b` lewat pengguna baca-saja. Riwayat tanpa
  izin baca (bersama form tanpa izin buat) teruji e2e sejak 20 November
  2026 lewat pengguna "E2E Tanpa Baca Sebagian" di
  `akses/jalur-bukan-owner.spec.ts`. Filter riwayat
  dan keadaan kurang dari dua akun aktif juga belum teruji e2e.
- **Beda `keLocationID` dan `locationID` di daftar surat jalan tidak
  teruji dari data**: seluruh surat jalan uji menuju outlet tenant,
  sehingga keduanya memberi hasil yang sama; bedanya terbukti dari kode
  (`kontrak/temuan.md` butir 33). Lingkup satu lokasi tujuan hanya teruji
  di unit test (`paramHalamanPemantauan` sejak TS2a).
- **Data development memuat transfer berjumlah pecahan** di akun "kasir
  outlet" (bukti `kontrak/temuan.md` butir 126, FR2a), sehingga total
  masuk dan total keluar akun itu berpecahan sepanjang Oktober 2026.
  Spec yang membandingkan rupiah memakai `formatRupiah`.
- **Jalur gagal dialog hapus produk hanya diuji dengan jawaban 500
  tiruan**; penolakan hapus dari backend sungguhan belum teruji.

- **Batas atas level, level pengguna yang tidak diketahui (RL3a), dan
  perubahan level atau wewenang di payload ubah hanya teruji di unit
  test** (`tests/unit/features/role/form-role.test.ts`), karena akun uji
  berperan Owner. Penolakan backend saat simpan teruji e2e sejak `2bcb1ce`.

- **Penjaga ruang detail stock opname hanya teruji untuk dokumen yang
  tipe lokasinya diketahui**, dan kedua skenarionya dilewati bila ruang
  itu belum punya dokumen. Nama PIC yang gagal dimuat (teks cadangan)
  belum teruji e2e.

- **Sisi tertolak gerbang rute hanya teruji e2e untuk rute yang ditolak
  peran pengguna uji profil**: daftar pengguna, serta ubah posisi dan
  ubah produk bila peran itu tidak memegang izinnya. Rute lain teruji di
  `tests/unit/lib/auth/gerbang-rute.test.ts`. Skenarionya dilewati bila
  peran itu tidak memegang `read-dashboard-outlet`.
- **Syarat 44 entri baru `IZIN_HALAMAN` diturunkan dari nama hook dan
  kontrak, bukan dari trace per halaman.** Yang terbukti: pemilik seluruh
  izin membuka setiap rute terpetakan (unit), dan spec terdampak lolos.
- **Suite e2e penuh tidak lagi dijalankan di akhir setiap pekerjaan**
  (6 Oktober 2026), sehingga baseline suite penuh dapat berupa hitungan
  selama beberapa pekerjaan. Sejak 7 November 2026 e2e dijalankan
  sebagai satu suite penuh di akhir setiap putaran, bukan per commit
  (`inti/cara-kerja.md`, Alur setiap perubahan langkah 5); di antara
  commit dan suite penuh, spec baru belum pernah dijalankan.
  Angka terukur terakhir ada di
  `inti/pengujian.md` (Baseline).

- **Batas 10 metode aktif dan metode aktif terakhir hanya teruji lewat
  simulasi** bertanda `// simulasi:`. Penolakan 409 backend atas metode
  aktif terakhir dibuktikan lewat skrip sekali pakai (7 Oktober 2026),
  bukan lewat e2e, karena web kini menahannya.
- **Tandai Selesai hanya teruji untuk satu booking yang dibayar Rp1.**
  Tombol yang tidak tampil (belum dibayar, jam sudah lewat, tanpa
  `update-booking`) hanya teruji di unit test
  (`tests/unit/features/sesi-booking/izin.test.ts`), dan bagian Sesi
  Booking tanpa `read-booking` belum teruji. Setiap run meninggalkan
  satu penjualan booking VOID.
- **Filter periode riwayat Pindah Dana diuji dengan tanggal 15 sampai 20
  bulan berjalan**, yang hampir selalu memberi daftar kosong; isi daftar
  dalam periode tidak dibandingkan per baris.

- **Hapus bahan baku yang berhasil tidak teruji e2e** sejak `43f09af`:
  skenarionya `test.fixme` menunggu backend (`kontrak/temuan.md` butir
  143), dan skenario tambah, cari, dan edit meninggalkan satu bahan uji
  berstok 50 per run. Skenario hapus lama sempat lolos di suite penuh 11
  Oktober 2026 walau bahannya tidak terhapus, karena buktinya hanya baris
  yang tidak ada di tabel; dua bahan uji dari run itu dibiarkan sebagai
  bukti.
  Sejak `cfaaa92` `test.fixme`-nya dilepas, setelah butir 143 tertutup
  (`arsip/riwayat-pengujian.md`, Riwayat pelepasan fixme).
- **Penyaringan stock adjustment per ruang di server tidak teruji dari
  web**, karena akun uji berperan Owner.
- **Penahanan pembayaran kembar di backend tidak diuji dari web**; yang
  teruji kunci yang sama saat permintaan diulang.

- **Periode jurnal stok diuji lewat tanggal 8 sampai 15 bulan
  berjalan**, agar tanggal itu tidak kembar dengan tanggal bulan lain di
  kalender; skenarionya dilewati sebelum tanggal 8. Sampai tanggal tidak
  diubah lewat kalender; pemetaannya teruji di `paramHalamanJurnal`.
  Skenario ukuran dan halaman berikutnya dilewati bila jurnal outlet
  bulan berjalan belum lebih dari satu halaman, sehingga skipped dapat
  naik di awal bulan.
- **Semua Outlet dengan beberapa outlet di jurnal stok** (meminta
  memilih satu outlet) hanya teruji di unit test (`lokasiSatuOutlet`),
  karena tenant uji punya satu outlet.
- **Kartu pengajuan dashboard gudang hanya teruji cabang tanpa
  pengajuan siap surat jalan** pada data uji sekarang; cabang klik kartu
  ke tab Perlu Surat Jalan berjalan bila ada pengajuan APPROVED atau
  PENDING tanpa surat jalan.
- **Template role hanya teruji pemetaan namanya** (skenario e2e template
  dan `tests/unit/lib/roleTemplates.test.ts`); role dari template belum
  dipakai untuk membuka halaman stock opname, adjustment, atau absensi.
- **Spec alur pengembalian memindahkan satu satuan stok outlet ke gudang
  per run** (`a505783`), karena surat jalan DIKIRIM tidak dapat
  dibatalkan (P12). Bila berhenti setelah disetujui dan sebelum surat
  jalan dibuat, pengajuan APPROVED tertinggal di tab Semua gudang.
- **Pemilihan baris menurut data di spec daftar pengajuan** (`7f1de56`)
  bergantung pada baris itu berada di halaman pertama tabel (10 baris).
- **Kirim Barang dan Penerimaan Stok hanya teruji lewat alur penuh**:
  jalur gagal kirim, revisi, dan batal surat jalan pengembalian, serta
  terima sebagian di gudang, belum punya skenario.
- **Teks dialog batal surat jalan hanya teruji bila ada surat jalan
  Belum Dikirim**: badge daftar teruji e2e sejak `2bcb1ce`, sedangkan
  skenario dialog batal dilewati bersyarat bila tidak ada surat jalan
  PENDING (data uji 14 November 2026 tidak punya).
- **Backend di jam rawan hanya teruji saat suite dijalankan pada
  jamnya.** `page.clock` dan `vi.setSystemTime` hanya memalsukan jam
  frontend, sedangkan validator backend memakai jam server. Jendela
  00.00 sampai 07.00 WIB teruji lewat suite penuh 26 Oktober 2026 pukul
  00.11 dan 00.53, dan 28 Oktober 2026 pukul 00.17; B113 dan B118
  dibuktikan lewat permintaan nyata pukul 00.57.
- **Perpindahan hari di dashboard outlet dan gudang, kartu ringkasan
  Keuangan, serta catat pembelian** hanya teruji lewat hook (unit) dan
  pola yang sama di catat beban (e2e `6d07b8d`), tanpa skenario
  `page.clock` tersendiri.
- **Template role pembelian hanya teruji pemetaan namanya**; role dari
  template belum dipakai membuka halaman pembelian.
- **Spec Belanja Stok menyiapkan dua pembelian lewat API** (keputusan
  rancangan butir 23 mengizinkannya, karena halaman itu hanya membaca);
  setiap run menambah lalu mengurangi stok bahan fixture di outlet dan
  gudang.
- **Navigasi halaman berikutnya pada daftar berhalaman server** hanya
  teruji di jurnal stok. Stock adjustment, stock opname, surat jalan, dan
  pengajuan stok menguji halaman pertama, parameter query, dan total dari
  `pagination` (`98054b8` sampai `ebf782b`).
- **Skenario daftar pengajuan dan surat jalan memilih contoh dari halaman
  pertama**, sehingga dilewati bila halaman itu tidak memuat permintaan,
  pengembalian, atau dua dokumen untuk dibandingkan.
- **Fixture izin cuti menetap** (`96a7b40`): pengguna uji "E2E Izin
  Cuti" dan izin uji dibuat lewat API, karena web tidak punya halaman
  izin cuti dan backend tidak punya `DELETE /izincuti`. Setiap hari yang
  menjalankan spec dashboard menambah dua izin (disetujui dan ditolak hari
  itu); izin 2020 dibuat sekali.
- **Peran dan pengguna uji "E2E Tanpa Lintas Outlet" menetap**
  (`1cd8211`): dibuat sekali lewat API dan dipakai ulang setiap run,
  sehingga tidak menumpuk; izin perannya diselaraskan dengan izin baca
  Owner setiap kali.
- **Peran dan pengguna uji "E2E Baca Saja" dan "E2E Pembelian Outlet"
  menetap** (`cbfa23b`), dibuat sekali lewat API oleh
  `tests/helpers/terkunci-uji.ts`; izin perannya diselaraskan ulang setiap
  run dari izin role Owner.
- **Enam pengguna uji "E2E Staf Monitoring 1" sampai 6 menetap**
  (`cd07ae1`), dibuat sekali dan dipakai ulang; jadwal hari ini mereka
  dihapus setiap run. Mereka ikut tampil di daftar pengguna, kalender
  jadwal ruang outlet, dan pilihan login PIN.
- **Skenario aktifkan akun tanpa batas membekukan akun klien sungguhan**
  (`482ac79`), dipilih menurut syarat dan tidak pernah akun uji utama;
  setiap run menambah dua catatan di riwayat langganan akun itu.
- **Skenario pendaftaran di spec daftar dilewati bila kuota pendaftaran
  backend habis** (`d94a48c`). Backend kini menerima `REGISTER_LIMIT_MAX`
  di non-produksi (B230), dan perintah layanan uji menyetelnya; skip itu
  tinggal pengaman bila backend dijalankan tanpa env tersebut.
- **Skenario "Batalkan kembali ke daftar" di spec buat reservasi gagal di
  suite penuh** (1 November 2026 dan `6db571d`), tetapi lolos 8 dari 8 bila
  dijalankan sendiri; penyebabnya belum ditelusuri. Ditelusuri lewat trace
  saat suite penuh berikutnya menggagalkannya lagi, tanpa run tambahan
  untuk memancingnya. Suite terhadap backend `4759208` (4 November 2026)
  meloloskannya.
  Penyebabnya ditemukan 23 November 2026 dari kode, tanpa run tambahan:
  tombol memakai `router.back()`, sehingga tujuannya bergantung riwayat
  tab. Diganti tujuan pasti (KB1a, `modul/ui-ux.md`) dan dibuktikan
  `tampilan/tombol-kembali`. Lunas.
- **Keadaan masa berlaku Langganan hanya teruji di unit test**: masa
  percobaan, bilah masa berlaku, masa akses lewat dan masa tenggang, serta
  Muat riwayat lainnya. Akun uji Pro tanpa batas waktu dengan satu catatan
  riwayat, sehingga e2e hanya membuktikan keadaan tanpa batas.
- **Keadaan Mesin Kasir di luar alur utama tidak teruji e2e** sejak
  spec pratinjau dihapus (`b74f30a`): memuat, gagal dimuat, sesi lintas
  tengah malam, Muat hari sebelumnya, form tambah tanpa perangkat atau
  tanpa laci, dan posisi panel di HP dan desktop. Yang tersisa
  `tests/e2e/keuangan/mesin-kasir.spec.ts` (alur tambah, buka dari
  aplikasi, tutup dengan catatan, ubah, lepas, dan HP tanpa gulir ke
  samping) serta unit test `tampilan.ts`, `filter.ts`, dan `pesan.ts`.
- **Peran dan pengguna uji "E2E Kasir Outlet" beserta perangkat
  aplikasinya menetap** (`5f57454`, B346): dibuat sekali lewat API dan
  dipakai ulang, sehingga tidak menumpuk. Perangkat
  `E2E-KASIR-OUTLET-DEVICE-001` menjadi TRUSTED sebagai perangkat pertama
  pengguna itu dan tidak dicabut, karena perangkat yang dicabut kembali
  PENDING saat login berikutnya. Pengguna itu ikut tampil di daftar
  pengguna dan pilihan login PIN.
- **B170 toko lain memakai akun klien sekali pakai** per run
  (`stok-produk-beresep`), dihapus lewat API admin di akhir; backend
  menghapus tokonya bersama akun, sehingga tidak menumpuk selama
  penghapusannya berhasil.
- **Jalur Mesin Kasir tanpa izin kelola teruji e2e sejak `cbfa23b`**
  lewat pengguna baca-saja (tanpa tambah, ubah, dan lepas, dan tanpa
  `GET /sesikasir/perangkat`). Yang masih hanya teruji di unit test:
  pemegang `kelola-perangkat-kasir` tanpa `read-pengguna`
  atau `read-akunkas` (MK11a), dan pemilihan perangkat yang melewati
  pengguna berlevel sama atau lebih tinggi (403 `GET /device/:userId`).
- **Penyaringan titik tur dashboard menurut izin dan plan hanya teruji
  di unit test** (`tests/unit/components/panduan/titik-dashboard.test.ts`),
  karena akun uji e2e berperan Owner sehingga kelima titik selalu
  tampil. Aturannya `bolehLihatMenu`, yang dipakai bersama sidebar.
- **Label kedatangan Status Staf (AB6a) hanya teruji di unit test**
  (`tests/unit/features/dashboard-outlet/dashboard-outlet.test.ts`),
  karena absen dibuat aplikasi dengan foto dan koordinat, sehingga data
  Terlambat dan Luar Jadwal tidak dapat disiapkan web secara
  deterministik.
- **Lokasi kerja (LK1a) tanpa `read-location` dan untuk role Owner
  hanya teruji di unit dan integration test**
  (`tests/unit/features/pengguna/lokasi-kerja.test.ts`), karena akun uji
  berperan Owner. Pembatasan 403 bagi staf berlokasi kerja (B270 sampai
  B274) tidak diuji web: pengguna uji tidak diberi lokasi kerja, dan
  ruang tidak disesuaikan. Sebagian basi per 20 November 2026: staf
  berlokasi kerja Gudang teruji e2e di `auth/ruang-lokasi-kerja.spec.ts`
  (ruang mengikuti lokasi kerja, B339), dan staf berlokasi kerja Outlet di
  `keuangan/mesin-kasir.spec.ts` (B346); 403 halaman stok bagi lokasi lain
  (B270 sampai B274) tetap tidak diuji, karena ruang kini menolak lebih
  dulu.
- **Setujui yang disembunyikan bagi rekan selokasi pengaju (PG2a) hanya
  teruji di unit test** (`rekanSelokasiPengaju`), karena butuh pengajuan
  dari pengaju berlokasi kerja dan penyetuju berlokasi kerja sama; spec
  daftar pengajuan hanya membuktikan `dimintaOleh.locationID` dari
  respons nyata (16 November 2026).
- **Metode tunai berlaci mesin kasir yang dinonaktifkan (PB15a) hanya
  teruji di unit test** (`metodeLaciMesinKasir`), karena butuh metode
  tunai yang akun kasnya laci uji yang sedang dipetakan, sedangkan spec
  mesin kasir melepas pemetaannya di akhir (16 November 2026).
- **Booking lintas tengah malam di timeline (TL1a) belum teruji e2e**:
  spec reservasi hanya memeriksa query `tampilan=timeline`, karena butuh
  booking yang melewati 00.00 dari hari sebelumnya (16 November 2026).
- **Tur sorotan langkah jam buka (JB9a) hanya teruji di unit test**
  (`titikJamBuka`), karena spec tur wizard berhenti di langkah lokasi;
  mencapai langkah jam buka butuh mengisi lokasi berkoordinat lebih dulu
  (16 November 2026).
- **Jalur berhasil yang meninggalkan data permanen diuji sejak 20 November
  2026** (pemilik proyek: diuji sungguhan dan data yang menumpuk
  diterima). Per run: satu opname outlet APPROVED berhitungan sama dengan
  stok sistem (`stockOpname/setujui-stok-opname.spec.ts`); satu pengajuan
  APPROVED dan satu surat jalan DITERIMA, dengan satu satuan bahan pindah
  dari gudang ke outlet (`transferStok/setujui-kirim-berhasil.spec.ts`);
  satu bahan master "E2E Tarik Gudang ..." beserta entri inventory
  gudangnya (`stok/tambah-barang-gudang.spec.ts`). Setup gudang yang
  berhasil (`gudang/ruang-gudang.spec.ts`) membuat gudang kedua lalu
  menghapusnya lewat API, sehingga tidak menumpuk selama penghapusannya
  berhasil.
- **Diskon uji "E2E Diskon Member ..." menumpuk sebagai Non-Aktif**, satu
  per run skenario khusus member di `diskon/pilihan-kasir.spec.ts`.
- **Peran dan pengguna uji "E2E Tanpa Baca Sebagian", "E2E Petugas
  Transfer", dan "E2E Adjustment Outlet" menetap** (20 November 2026),
  dibuat sekali lewat `tests/helpers/terkunci-uji.ts` dan dipakai ulang.
  Ketiganya ikut tampil di daftar pengguna dan pilihan login PIN.
  Sejak 23 November 2026 "E2E Tanpa Baca Sebagian" juga tidak memegang
  `read-booking`, untuk membuktikan Sesi Booking detail penjualan cukup
  `read-penjualan` (B347); `pastikanPeran` menyelaraskan izinnya.
- **Surat jalan per kemasan (B365) hanya teruji di unit test**: revisi
  dan terima mengirim `satuan` (`susunPayloadRevisi`,
  `susunPayloadTerima`) dan selisih terima dibandingkan dalam satuan dasar
  (`faktorKeDasar`), tetapi alur revisi dan terima lewat UI dengan bahan
  berkemasan belum dibuat e2e, karena butuh surat jalan berisi bahan
  fixture "E2E Bahan Kaleng" dari pengajuan yang disetujui.
- **Bahan uji "E2E Bahan Kaleng" permanen** di basis data development
  (ml, kemasan kaleng = 290), dibuat sekali oleh
  `inventaris/bahanBaku/konversi-satuan.spec.ts`; pengajuan uji per run
  diajukan lalu ditolak, sehingga pengajuan Ditolak bertambah satu per run.
- **Isi berkas ekspor hanya diperiksa tipe kontennya**: spec
  `unduh/ekspor-daftar` membuktikan query, status 200, tipe konten, dan
  unduhan terjadi, tetapi tidak membaca kolom dan baris TOTAL di dalam
  berkas; isinya dijamin test backend (AR38 sampai AR40). Batas 10.000
  baris (400) tidak dapat dibuat deterministik dari web.
- **Rekap Absensi tanpa izin, gagal dimuat, dan bulan kosong** hanya
  teruji dari kode (pesan dan keadaan kosong); spec
  `jadwal/rekap-absensi` berjalan dengan data bulan berjalan.
- **Stok terbaca di inventaris gudang** hanya teruji di unit test
  (`rincianKemasan`); e2e membuktikannya di daftar stok outlet.
- **Rombak panel admin (24 November 2026) teruji di 390, 768, dan 1280
  px saja**: susunan empat kolom (wadah 600 sampai 960 px) di 1024 px dan
  kartu di 640 px tidak punya skenario. Panel bawah dialog di HP hanya
  diuji untuk Perpanjang; Ubah Plan, Aktifkan, Bekukan, dan Hapus memakai
  kelas yang sama. Keluar lewat menu avatar HP hanya diperiksa tampil,
  tidak diklik, karena logout memutar `tokenVersion` admin uji.
- **Topbar admin saat `GET /akun/me` gagal** (email tidak tampil, Keluar
  tetap ada) hanya terbaca dari kode.
- **Revisi profil (24 November 2026) teruji di 390 dan 1280 px untuk
  popup, dan 390, 768, serta 1280 px untuk laman**: popup di tablet 768 px
  dan sidebar mode ikon di desktop tidak punya skenario. Ganti pengguna
  teruji di tab yang sama; muat ulang sesudahnya menunggu backend butir
  190.
- **Batal terkunci selama menyimpan (BT2a) teruji e2e hanya di ubah
  metode pembayaran** (`pengaturan/kelola-metode-pembayaran`, PUT ditahan
  lalu diteruskan). Batal di buat dan ubah akun admin memakai pola yang
  sama dan hanya terbaca dari kode.
