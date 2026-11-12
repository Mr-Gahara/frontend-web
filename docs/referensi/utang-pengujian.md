# Utang Pengujian

Sifat perubahan: **Sering**: bertambah saat modul dikerjakan; butir yang lunas dipindah ke `arsip/riwayat-pengujian.md`.

Lapis referensi: kirim bersama dokumen modul saat menulis atau mengubah spec modul itu. Isinya dipindah dari `inti/pengujian.md` pada 25 Oktober 2026 tanpa perubahan.

Cakupan uji yang belum lengkap beserta alasannya, dan data uji yang
tertinggal di basis data development. Butir yang sudah lunas dan
kejadian sesekali yang tidak berulang ada di `arsip/riwayat-pengujian.md`.

## Utang pengujian

- **Kedua skenario jam di `penjualan/waktu-penjualan.spec.ts` flaky**
  (`page.clock` terpasang): klik pilihan "E2E Penjualan Produk" di
  combobox produk habis waktu karena elemennya berulang kali terlepas dari
  DOM. Terjadi di suite penuh 5 November 2026 (satu skenario) dan
  12 November 2026 (keduanya). Saat diulang sendirian gagal 1 dari 84 run,
  dan trace kegagalannya tidak tertangkap (konfigurasi tidak menyimpan
  trace). Folder `penjualan` utuh lolos 31 dari 31. Dugaan yang belum
  terbukti: `cmdk` menyusun ulang opsi saat daftar produk dirender ulang
  selama jam dipalsukan. Langkah berikutnya: jalankan spec ini dengan
  `--trace retain-on-failure` di suite penuh berikutnya, lalu baca trace.

- **Reset PIN Owner belum punya spec**, karena web belum memakai OTP
  reset PIN Owner (B178, belum dijadwalkan); rencana ujinya di
  `modul/setup-akun.md`, Pengujian OTP.
- **Pemilih outlet di jurnal stok dan pembelian stok hanya berisi satu
  pilihan** di MVP satu outlet, sehingga memilih outlet tidak memicu
  permintaan baru. Kedua jalur cakupan lokasi teruji e2e sejak
  `1cd8211` (`arsip/riwayat-pengujian.md`).
- **Tab pengajuan stok yang disembunyikan menurut izin** hanya teruji di
  unit test (`tests/unit/features/pengajuan-stok/pengajuan-stok.test.ts`),
  dengan alasan yang sama: aturannya hanya berlaku bagi petugas transfer
  tanpa izin setujui.
- **Approve stock opname yang berhasil** tidak diuji e2e, karena mengubah
  stok sungguhan. Yang diuji hanya jalur gagalnya.
- **Setujui pengajuan dan buat surat jalan yang berhasil** tidak diuji e2e,
  karena keduanya meninggalkan dokumen permanen (pengajuan dan transfer
  tidak dapat dihapus). Yang diuji hanya jalur gagalnya.
- **Tambah barang gudang yang berhasil** tidak diuji e2e, karena UI tidak
  punya cara menghapus entri inventory yang terbentuk.
- **Terima penerimaan yang berhasil** diuji sungguhan lewat UI sejak
  `6e314ae` (keputusan PB12a), termasuk jumlah 0. Setiap run menambah stok
  outlet secara permanen, dan surat jalan DITERIMA tidak dapat dibatalkan.
- **Item tanpa master bahan baku pada penerimaan** hanya teruji di unit
  test (`tests/unit/features/transfer-stok/payload.test.ts`), karena
  membuat datanya berarti menghapus master bahan baku.
- **Kirim surat jalan yang berhasil lewat UI** tidak diuji e2e, karena
  memotong stok gudang. Kirim dijalankan lewat API di persiapan spec dan
  ditutup lewat terima penuh di akhir, karena batal dari DIKIRIM ditolak
  backend `465b438` (PB10a); dari UI hanya jalur gagalnya yang diuji.
- **Gate halaman yang menolak pengguna tanpa sebagian izin** hanya teruji
  di unit test (`tests/unit/lib/auth/gate-stock-adjustment.test.ts`, kedua
  ruang),
  dengan alasan yang sama.
  Izin per ruang (RH3a) juga hanya teruji di unit test.

- **Cakupan per lokasi di daftar penjualan hanya teruji pada satu
  outlet** (`20c026b`): `locationID` yang terkirim sama dengan
  `/location/current`, dan seluruh baris milik outlet itu. Data uji hanya
  punya satu outlet, sehingga hasilnya sama dengan tanpa penyaringan.
  Jalur lintas outlet (LP2a) berjalan sejak `2eb668a` dan jalur terkunci
  sejak `1cd8211`; aturan lingkup diuji di
  `tests/unit/features/penjualan/filter.test.ts`.
- **Jalur tanggal terkunci bagi peran selain Owner di catat beban hanya
  teruji di unit test** (`payloadBuatBeban`), karena pengguna uji
  berperan Owner (BO5a).
- **Penolakan backend saat mencatat beban** (saldo kurang atau akun
  nonaktif, 409) tidak punya skenario e2e: form menahan jumlah di atas
  saldo sebelum permintaan dikirim.
- **Jalur tanpa `read-location` di halaman penjualan** (tanpa cakupan, dan
  tanpa `locationID` saat membuat) hanya teruji di unit test, dengan alasan
  yang sama: satu-satunya akun uji berperan Owner.
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
  skenario baru.
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
- **Setup gudang yang berhasil tidak diuji e2e** (keputusan GD6a). Tenant
  uji sudah punya gudang yang menyimpan stok, sehingga setup hanya dapat
  dibuka dengan daftar lokasi tanpa gudang yang disimulasikan, dan
  `POST /location` dijawab gagal agar tidak ada gudang kedua yang
  tersimpan. Payload dan penolakan radius teruji; pengalihan setelah
  setup berhasil dan pembaruan menu sidebar sesudahnya belum.
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
  lewat `POST` yang dijawab gagal.
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
  menampilkan kartu per baris dan susunan kartu di HP; keduanya belum
  punya test integrasi, dan susunan HP tidak diuji spec mana pun.
- **Batas 10 metode aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, karena sepuluh metode aktif tidak dapat
  dibuat di data uji tanpa menumpuk metode permanen. Peringatan metode
  aktif terakhir, akun nonaktif bertanda di form ubah, dan penolakan akun
  nonaktif saat mengaktifkan kembali hanya teruji di unit test
  (`tests/unit/features/metode-pembayaran/`).
  Peringatan itu diganti penahanan di `3b4f35b` (NZ4a), yang teruji e2e.
- **Metode uji menumpuk sebagai nonaktif**, satu per run spec kelola
  metode pembayaran, karena metode tidak dapat dihapus (PO10a).
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
  teruji, karena tenant uji punya outlet. Kartu profil tanpa
  `update-tenant` dan kartu lokasi tanpa `update-location` teruji e2e
  sejak `cbfa23b` lewat pengguna baca-saja.
- **Spec profil toko mengubah nama toko tenant uji untuk sementara**,
  lalu mengembalikannya lewat UI dan, bila test berhenti di tengah, lewat
  API di `finally`. Kode pos tenant uji menjadi teks kosong, bukan null,
  setelah run pertama.
- **Pelanggan uji dihapus lunak**, sehingga setiap run spec pelanggan
  menambah dokumen ber-`isDeleted` di basis data development; daftar dan
  indeks unik backend mengabaikannya.
- **Pengosongan email dan alamat pelanggan tidak teruji e2e**; yang
  teruji hanya nomor HP. Peringatan `isianTidakTerkosongkan` dibuang di
  `1bb26c0`.
- **Email pelanggan kembar yang dijawab 409 hanya dibaca dari kode**;
  e2e menguji nomor HP kembar.
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
  Non-Aktif tidak dihitung batas 50 diskon aktif.
- **Batas 50 diskon aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, dan hanya untuk tombol tambah; menu
  aktifkan yang terkunci saat batas tercapai belum teruji. Pilihan Aktif
  di form buat teruji e2e sejak `a80d2fa` (NZ5a).
- **Keterangan khusus member dan pemilih produk tanpa izin baca produk
  belum teruji**: web tidak dapat menandai khusus member (PD8a), dan
  satu-satunya akun uji berperan Owner. `aksiDiskon` hanya teruji di unit
  test, dengan alasan yang sama.
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
  luar akun uji.
- **Penolakan backend atas Pindah Dana belum teruji e2e**: saldo sumber
  tidak cukup (ditahan form lebih dulu), akun nonaktif, dan pembatalan
  yang ditolak karena saldo akun tujuan tidak cukup. Statusnya (400)
  dibuktikan lewat skrip sekali pakai pada 4 Oktober 2026
  (`kontrak/temuan.md` butir 128).
- **Riwayat Pindah Dana tanpa izin baca hanya teruji di unit test**
  (`aksiTransfer`). Form tanpa izin buat dan tombol Batalkan tanpa izin
  ubah teruji e2e sejak `cbfa23b` lewat pengguna baca-saja. Filter riwayat
  dan keadaan kurang dari dua akun aktif juga belum teruji e2e.
- **Beda `keLocationID` dan `locationID` di daftar surat jalan tidak
  teruji dari data**: seluruh surat jalan uji menuju outlet tenant,
  sehingga keduanya memberi hasil yang sama; bedanya terbukti dari kode
  (`kontrak/temuan.md` butir 33). Lingkup satu lokasi tujuan hanya teruji
  di unit test (`filterServerTransfer`).
- **Data development memuat transfer berjumlah pecahan** di akun "kasir
  outlet" (bukti `kontrak/temuan.md` butir 126, FR2a), sehingga total
  masuk dan total keluar akun itu berpecahan sepanjang Oktober 2026.
  Spec yang membandingkan rupiah memakai `formatRupiah`.
- **Jalur gagal dialog hapus produk hanya diuji dengan jawaban 500
  tiruan**; penolakan hapus dari backend sungguhan belum teruji.

- **Batas atas level, level pengguna yang tidak diketahui (RL3a), dan
  perubahan level atau wewenang di payload ubah hanya teruji di unit
  test** (`tests/unit/features/role/form-role.test.ts`), karena akun uji
  berperan Owner. Penolakan backend saat simpan, yang tampil di atas
  tombol simpan, belum teruji e2e.

- **Penjaga ruang detail stock opname hanya teruji untuk dokumen yang
  tipe lokasinya diketahui**, dan kedua skenarionya dilewati bila ruang
  itu belum punya dokumen. Nama PIC yang gagal dimuat (teks cadangan)
  belum teruji e2e.

- **Kartu Pajak yang disembunyikan tanpa `read-pajak` hanya teruji di
  unit test** (`tests/unit/features/pajak/izin.test.ts`). Tombol Tambah
  Pajak dan menu aksi yang disembunyikan, serta kartu indeks bagi pemegang
  izin baca, teruji e2e sejak `cbfa23b` lewat pengguna baca-saja. Pesan
  tanpa izin baca kini milik gerbang rute (`bc388c6`).
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
- **Tautan penjualan di buku mutasi bergantung pada data**: skenarionya
  dilewati bila halaman pertama bulan berjalan tidak memuat mutasi
  pembayaran. Baris tanpa pencatat hanya teruji di unit test.
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
- **Pesan lokasi gudang gagal dimuat atau belum didaftarkan di jurnal
  stok gudang** belum teruji e2e.
- **Kartu pengajuan dashboard gudang hanya teruji cabang tanpa
  pengajuan siap surat jalan** pada data uji sekarang; cabang klik kartu
  ke tab Perlu Surat Jalan berjalan bila ada pengajuan APPROVED atau
  PENDING tanpa surat jalan.
- **Template role hanya teruji pemetaan namanya** (skenario e2e template
  dan `tests/unit/lib/roleTemplates.test.ts`); role dari template belum
  dipakai untuk membuka halaman stock opname, adjustment, atau absensi.
- **Kartu siap surat jalan dashboard gudang belum diuji dengan
  pengembalian yang disetujui** (AR6a): kartu menghitung kedua arah,
  sedangkan tab hanya permintaan; skenario dashboard gudang gagal dengan
  jujur bila data uji memuat pengembalian seperti itu.
- **Spec alur pengembalian memindahkan satu satuan stok outlet ke gudang
  per run** (`a505783`), karena surat jalan DIKIRIM tidak dapat
  dibatalkan (P12). Bila berhenti setelah disetujui dan sebelum surat
  jalan dibuat, pengajuan APPROVED tertinggal di tab Semua gudang.
- **Pemilihan baris menurut data di spec daftar pengajuan** (`7f1de56`)
  bergantung pada baris itu berada di halaman pertama tabel (10 baris).
- **Kirim Barang dan Penerimaan Stok hanya teruji lewat alur penuh**:
  jalur gagal kirim, revisi, dan batal surat jalan pengembalian, serta
  terima sebagian di gudang, belum punya skenario.
- **Teks badge status dan dialog batal surat jalan hanya teruji lewat
  peta label di unit test** (`a972956`): e2e memeriksa nama tombol tab,
  tetapi tidak membaca badge daftar, badge detail, maupun teks dialog
  batal.
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
- **Jalur tanggal pembelian bagi peran selain Owner** hanya teruji di
  unit test (`payloadBuatPembelian`), karena akun uji berperan Owner.
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
- **Jalur role tanpa izin SDM baru** (B139, B140) hanya teruji di unit
  test (`gate-sdm-jadwal`, templat role), karena akun uji berperan Owner.
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
- **Kalender per lokasi hanya teruji untuk sel yang berisi penanda
  saja**; sel yang berisi jadwal lokal sekaligus penanda lokasi lain
  belum diuji e2e.
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
- **Skenario dilewati tanpa judul tercatat**: satu di suite penuh
  `50c99ae` selain jurnal stok, satu di `6db571d`, dan dua di suite
  terhadap backend `4759208` (spec daftar tidak termasuk; 29 spec lain
  ber-skip bersyarat), serta dua di suite penuh terhadap backend `ridho`
  `c031bde` (6 November 2026). Tidak dicari dengan
  menjalankan ulang sebagian suite; reporter `json` di suite penuh
  berikutnya mencatat judulnya (`referensi/playwright.md`).
- **Keadaan masa berlaku Langganan hanya teruji di unit test**: masa
  percobaan, bilah masa berlaku, masa akses lewat dan masa tenggang, serta
  Muat riwayat lainnya. Akun uji Pro tanpa batas waktu dengan satu catatan
  riwayat, sehingga e2e hanya membuktikan keadaan tanpa batas.
- **Jalur tanpa `read-langganan` hanya teruji di unit test** (gerbang
  rute, `c868870`), karena pengguna uji yang ada memegang seluruh izin
  `read-`. Penolakannya lewat gerbang rute yang sama dengan halaman lain.
- **Keadaan Mesin Kasir di luar alur utama tidak teruji e2e** sejak
  spec pratinjau dihapus (`b74f30a`): memuat, gagal dimuat, sesi lintas
  tengah malam, Muat hari sebelumnya, form tambah tanpa perangkat atau
  tanpa laci, dan posisi panel di HP dan desktop. Yang tersisa
  `tests/e2e/keuangan/mesin-kasir.spec.ts` (alur tambah, buka dari
  aplikasi, tutup dengan catatan, ubah, lepas, dan HP tanpa gulir ke
  samping) serta unit test `tampilan.ts`, `filter.ts`, dan `pesan.ts`.
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
  ruang tidak disesuaikan.
