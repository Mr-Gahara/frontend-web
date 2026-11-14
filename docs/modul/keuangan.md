# Modul Keuangan

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

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
  Diubah NZ1a (`d23844a`): tanpa akun terpilih tampil ringkasan gabungan.
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
- **Tombol Tambah Akun mengikuti `create-akunkas`** (pemilik proyek,
  7 November 2026, `cbfa23b`): sebelumnya tampil bagi semua pengguna
  dan baru ditolak gerbang rute halaman buat. Aturannya `aksiAkunKas`
  (keputusan rancangan butir 14), dibuktikan pengguna uji baca-saja.
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
  Filter periode ditambahkan di `8072214` (NZ3a).
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
  ulang. Temuannya dilaporkan (`arsip/laporan-backend.md`).
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

### Halaman pengeluaran

Diputuskan pemilik proyek pada 18 Oktober 2026, saat pengeluaran
dibangun setelah RG4a (`61275ac` sampai `1d7fa7b`). Melanjutkan label BO.

- **BO3a: daftar pengeluaran dengan halaman catat tersendiri.** Daftar
  memakai DataTable berpaginasi server dengan filter akun kas, kategori,
  status, dan periode; Catat Beban berada di
  `/dashboard/outlet/pengeluaran/catatBeban`. Menggantikan BO2a.
- **BO4a: kategori beban dikelola di Pengaturan**, sejajar metode
  pembayaran dan pajak. Form catat menautkan ke sana bila belum ada
  kategori.
- **BO5a: Owner memilih tanggal beban, peran lain hari ini**, sesuai
  keputusan pemilik proyek 17 Oktober 2026 dan P23 backend. Owner
  dikenali dari level role 100, dan tanggal masa depan dinonaktifkan.
  Backend belum menegakkannya untuk beban.
  Sejak `6d07b8d` tanggal yang tidak dipilih Owner, dan tanggal hari
  ini, dikirim sebagai waktu simpan (`inti/keputusan-rancangan.md` butir
  28, `kontrak/temuan.md` butir 154).
- **BO6a: menu titik tiga Lihat rincian, Ubah (keterangan dan
  kategori), dan Batalkan (VOID beralasan)**; dua yang terakhir hanya
  untuk beban AKTIF.
- **BO7a: data uji beban Rp1 dari akun aktif bersaldo, lalu di-VOID
  lewat UI**, dengan kategori fixture RG7a. Setiap run meninggalkan satu
  beban berstatus Dibatalkan.
- **Pekerjaan setelah ini adalah dashboard gudang**; tata letak dan
  UI/UX-nya menunggu rancangan pemilik proyek (GD1a).
- Diterapkan tanpa ditanyakan: gerbang daftar pindah ke
  `read-beban-operasional`, dan halaman catat menuntut
  `read-kategori-beban`, `read-akunkas`, dan `create-beban-operasional`
  (GR5a, GR7a); filter akun dan kategori hanya bagi pemegang izin
  bacanya; mutasi beban menginvalidasi akar beban, akunKas, dan laporan;
  form menahan jumlah di atas saldo; keterangan dan nama kategori
  dibatasi 500 dan 100 karakter, karena backend belum membatasinya; dan
  nama kategori uji unik per run dan dihapus di run yang sama.
  Penundaan BO1a, NZ11a, dan RG6a berakhir.

### Tab Belanja Stok

Diputuskan pemilik proyek pada 25 dan 26 Oktober 2026, dari pratinjau
desain yang disetujui (`e073a9d`):

- **BS1a: pembelian stok seluruh outlet dan gudang dalam satu tab
  Keuangan**, `/dashboard/outlet/keuangan/belanjaStok`. Filter periode,
  lokasi penerima, akun kas, dan supplier; kartu total, porsi per lokasi
  penerima, porsi per akun kas, dan lima supplier terbesar; lalu daftar
  gabungan dengan kolom Lokasi. Baris dibuka di detail ruang asalnya;
  ubah dan hapus tetap di sana (PS8a, `modul/inventaris.md`).
- **BS2a: ringkasan dihitung di frontend dari seluruh halaman**
  `GET /pembelianstok` (`limit` 100) pada filter yang sama, paling
  banyak 20 halaman, karena backend belum punya endpoint ringkasan.
  Endpoint ringkasan beserta paginasinya diminta ke backend
  (`kontrak/temuan.md` butir 157). Hasilnya dibuat unik per id (butir
  156), dan peringatan tampil bila terpotong atau jumlahnya berbeda dari
  `pagination.total`.
- **BS3a: tab selalu tampil seperti tiga tab lain**; gerbang halaman
  `read-pembelian-stok`, `read-akunkas`, dan `read-location`, karena
  nama lokasi dan ruang asal dibaca dari daftar lokasi. Tab yang tampil
  tanpa izin dicatat sebagai temuan frontend (butir 163). Sejak
  `e051906` keempat tab disaring lewat `bolehBukaHalaman`.
- Kartu mengikuti seluruh filter, seperti ringkasan mutasi arus kas.
  Pembelian disebut persediaan, bukan beban, sehingga tidak masuk laba
  rugi, dan saldo akun kas belum terpotong.

- **BS4a: tombol "Catat pembelian" di kanan judul Belanja Stok** (pemilik
  proyek, 12 November 2026), tampil bila pengguna boleh mencatat di
  setidaknya satu ruang (`ruangCatatBelanja` di
  `features/pembelian-stok/ruang.ts`: izin buat ruang itu, plan, dan
  `IZIN_HALAMAN` rute catat; gudang juga `read-dashboard-gudang` dan lokasi
  bertipe Gudang). Satu ruang langsung membuka form catatnya (Basic dan
  Advanced: outlet); outlet dan gudang membuka menu "Ke outlet" dan "Ke
  gudang". Sesudah simpan tetap ke detail pembelian.
- **BS5a: Pembelian Stok ruang outlet menjadi menu tunggal** di grup
  Manajemen Inventaris untuk semua plan, keluar dari Suplai Gudang, yang
  kini hanya berisi Pengajuan, Terima, dan Kirim Barang (Pro), sehingga
  Suplai Gudang tidak tampil di Basic dan Advanced (pemilik proyek,
  12 November 2026).

- **BS6a: isian tanggal filter tidak meluber** (pemilik proyek,
  12 November 2026). Di HP "Dari" dan "Sampai" masing-masing selebar
  layar dan bertumpuk seperti Arus Kas, dan sejak `sm` tombolnya 208 px
  (`sm:w-52`, sebelumnya 176 px) agar "30 September 2026" muat dengan
  padding utuh. Berlaku di lima laman yang terukur meluber: Belanja Stok,
  Pembelian Stok outlet dan gudang, riwayat Mesin Kasir, dan Jurnal Stok
  (Mesin Kasir tetap selebar penuhnya sendiri). Format tanggal tidak
  berubah. Di ruang gudang lima filter Pembelian Stok tetap turun ke baris
  kedua di 1280 px, seperti sebelumnya.

### Tampilan HP tab Keuangan

Diputuskan pemilik proyek pada 6 November 2026, dari pratinjau Revisi 1
(perbaikan Akun Kas di HP) dan dialog sesudahnya (`b3f8698`):

- **KH1a: tiga bug tampilan HP tab Keuangan diperbaiki bersama Mesin
  Kasir**: label tombol Pindah Dana dan Tambah Akun terpotong, bar tab
  terpotong sehingga tab aktif tidak terlihat, dan empat kartu ringkasan
  memenuhi satu layar. Di bawah `sm` tab menjadi pil yang turun ke baris
  berikutnya tanpa ikon (tab aktif navy, `aria-current`), kartu ringkasan
  dua kolom dengan judul pendek tanpa badge tren, dan kedua tombol header
  Akun Kas bertumpuk penuh setinggi 48 px dengan Tambah Akun di atas.
  Sejak `sm` tampilan tidak berubah.
- **KH2b: padding HP hanya dari dashboard**: area gulir dashboard `p-4`
  di bawah `sm` (dari `p-6`), dan layout Keuangan serta halaman di
  dalamnya tidak menambah padding sendiri di bawah `sm`. Isi tab di HP
  menjadi sekitar 330 px dari lebar 390 px, sebelumnya sekitar 234 px.
  Opsi lainnya: hanya layout Keuangan, atau dibiarkan.
- **KH3a: halaman Ringkasan Laba/Rugi ikut dibersihkan** dari padding
  sendirinya di HP, sama dengan Akun Kas.

### Mesin Kasir

Diputuskan pemilik proyek pada 6 November 2026, dari tiga gaya desain,
pratinjau Revisi 1 dan Revisi 2 di kanvas desain, dan dialog sesudahnya
(`b86e4b7`, `0178550`). Akhiran huruf mengikuti opsi dialog yang
dipilih; kode tanpa huruf adalah jawaban yang ditulis pemilik proyek
sendiri.

- **MK1a: nama "Mesin Kasir"** untuk perangkat yang dipakai berjualan
  dan dipasangkan ke laci uang (`PerangkatKasir` di backend), agar tidak
  tertukar dengan perangkat login karyawan dan owner untuk absen
  (`Device`). Tombol "Tambah mesin kasir", menu "Ubah nama dan laci" dan
  "Berhenti jadi mesin kasir". Nama tipe di kode tetap `PerangkatKasir`.
- **MK2: gaya C dengan data riwayat gaya B**: kasir yang sedang buka di
  kartu navy paling atas, riwayat buka-tutup kasir dikelompokkan per
  hari sebagai isi utama, dan panel mesin kasir di samping (di HP paling
  bawah). Setiap baris riwayat memuat nama mesin, orang, jam buka sampai
  tutup, uang akhir, dan satu label selisih saat tutup. Sesi yang masih
  buka hanya tampil di kartu atas. Pengecualian keputusan rancangan
  butir 26 (`inti/keputusan-rancangan.md`).
- **MK3a: pilihan perangkat digabung dari perangkat setiap karyawan**
  (`GET /device/:userId`), satu baris per `installationId`, hanya status
  `trusted` (K-18), karena backend belum punya daftar perangkat se-toko
  (`kontrak/temuan.md` butir 172). Sejak backend `a3a391b` (B264) satu
  tablet boleh `trusted` untuk beberapa pengguna setoko; tablet itu tetap
  satu pilihan dengan seluruh pemakainya, tanpa perubahan web.
- **MK4a: tampilan dulu, penyambungan menyusul**: komponen menerima data
  lewat props, dan dipratinjau di rute development `pratinjauMesinKasir`
  dengan data contoh dan pemilih keadaan (keputusan rancangan butir 30).
  Disambung di `b74f30a`; pratinjau, data contoh, dan spec pratinjaunya
  dihapus di commit yang sama, dan daftar periksanya dipindah ke
  `arsip/catatan-putaran.md` (Catatan dari penyambungan Mesin Kasir).
- **MK5a: asal penutupan sesi tidak ditulis**: riwayat menulis "Sari,
  ditutup Ridho" bila penutupnya berbeda, tanpa "dari web", karena
  respons tidak membawa penandanya (`kontrak/temuan.md` butir 174).
- **MK6a: waktu perangkat diberi label "Terakhir aktif"**, sesuai arti
  `lastSeenAt`, bukan "Terakhir login" seperti di pratinjau.
- **MK7a: filter riwayat memakai dua `PilihTanggal`**, "Dibuka dari" dan
  "Dibuka sampai", seperti Pindah Dana, bukan satu tombol rentang seperti
  di pratinjau.
- **MK8a: panel mesin kasir tetap di samping di laptop 1280 px**:
  riwayat menyempit, dan barisnya bertumpuk seperti di HP selama riwayat
  lebih sempit dari 640 px (keputusan rancangan butir 31).
- **MK9: menu, dialog, dan keadaan Revisi 2 disetujui**. Selama kasir di
  sebuah mesin buka, Berhenti nonaktif beserta alasannya dan laci
  terkunci di dialog ubah, sedangkan nama tetap dapat diubah (K-04,
  K-05). Konfirmasi berhenti menyebut riwayat tetap tersimpan. Tutup
  kasir dari web tanpa angka sistem (hitung buta, `sesiKasirService`
  baris 79 sampai 103), dengan catatan diminta bila backend menjawab
  catatan wajib. Ada keadaan semua kasir tutup, riwayat kosong, gagal
  dimuat, memuat, dan form tambah tanpa perangkat atau laci. Tanpa
  `kelola-perangkat-kasir`, tombol tutup dan panel mesin kasir tidak
  tampil dan nama mesin menjadi "Mesin kasir" (`kontrak/temuan.md`
  butir 173). Saat belum ada mesin kasir, langkah menambah naik ke
  paling atas.
- Halaman Mesin Kasir menjadi tab kelima Keuangan saat disambung. Laci
  hanya akun Kas Fisik aktif, satu laci untuk satu mesin (indeks unik
  `tenantID` dan `akunKasID`).

Diputuskan pemilik proyek pada 7 November 2026, saat penyambungan
(`b74f30a`):

- **MK10a: gerbang halaman wajib `read-sesi-kasir`**, untuk
  `/dashboard/outlet/keuangan/mesinKasir` dan rinciannya
  `/mesinKasir/[id]`. Panel mesin kasir dan tombol tutup tampil tambahan
  bagi pemegang izin kelola; pemegang `kelola-perangkat-kasir` saja tidak
  melihat tab Mesin Kasir.
- **MK11a: kelola butuh ketiga izin**: panel mesin kasir dan tombol
  tutup tampil hanya bila memegang `kelola-perangkat-kasir`,
  `read-pengguna`, dan `read-akunkas` sekaligus (`bolehKelolaMesinKasir`
  di `features/sesi-kasir/izin.ts`), karena form membaca perangkat
  karyawan dan laci. Tanpa salah satunya halaman tampil seperti tanpa
  izin kelola.
- **MK12a: data uji spec alur nyata**: sesi dibuka lewat login app
  sebagai Ridho di perangkat trusted miliknya `OWNER-DEVICE-UUID-001`
  (login app tidak memutar `tokenVersion` web), dengan satu akun Kas
  Fisik uji tetap "E2E Laci Mesin Kasir" yang dibuat sekali lalu dipakai
  ulang. Mesin kasir ditambah, diubah, dan dilepas lewat UI; sisa uji
  dibersihkan di `finally` lewat API.
- **MK13a: pesan pemakaian pertama hanya bila belum pernah ada sesi**.
  Langkah tambah mesin kasir tetap paling atas selama belum ada mesin
  kasir, tetapi pesan "Riwayat tampil di sini setelah kasir pertama
  ditutup" hanya tampil bila `GET /sesikasir?limit=1` tanpa filter
  memberi total 0. Bila sudah ada sesi, riwayat dan filternya tampil
  seperti biasa dengan nama "Mesin kasir yang sudah dilepas". Susunan
  Revisi 2 menyembunyikan riwayat itu begitu mesin terakhir dilepas.
- **MK14b: pesan galat backend diteruskan apa adanya**, kecuali catatan
  wajib saat tutup kasir. Penolakan saat menyimpan atau melepas mesin
  kasir (409 sesi terbuka, 409 laci dipakai mesin lain, dan 404 perangkat
  tidak ditemukan) tampil dengan teks backend, misalnya "Akun Kas ini
  sudah dipakai perangkat lain.", bukan terjemahan berisi "mesin kasir"
  dan "laci" yang sempat ditulis Claude di `b74f30a` tanpa ditanyakan.

### Penyesuaian backend `ridho` lokal `e9112a8`

Diputuskan pemilik proyek pada 8 November 2026
(`referensi/keputusan-penyesuaian-backend.md`).

- **LR1a: laporan laba rugi tetap seluruh toko** (B290). Tidak ada
  pilihan outlet dan `locationID` tidak dikirim, karena MVP satu akun
  satu outlet dan satu gudang; `totalBebanTingkatToko` tidak dibaca.
  Ditinjau bersama lokasi beban (P63) saat multi-outlet.
- **LR2a: halaman arus kas menunggu desain pemilik proyek** (B291,
  `inti/status.md`).

### Halaman arus kas

Diputuskan pemilik proyek pada 12 November 2026, dari lima desain kanvas
(A sampai E). Menutup LR2a.

- **LR3a: desain D** di `/dashboard/outlet/keuangan/arusKas`
  (`features/laporan/halaman-arus-kas.tsx`): judul "Laporan Arus Kas",
  pita filter Akun kas, Dari, Sampai, dan Hari/Minggu/Bulan beserta Reset
  Filter; tiga kartu navy bergaris karamel (saldo awal, arus kas bersih
  berlencana Naik/Turun/Tetap, saldo akhir); panel krem "Uang masuk" dan
  "Uang keluar" per kategori dengan batang, pembatalan berlencana karamel
  "Pembatalan"; lalu daftar per periode bergaya desain C dalam satu kolom
  (tanpa kotak putih). Transfer hanya tampil bila satu akun kas dipilih,
  mengikuti backend. Pilihan akun kas hanya bagi pemegang `read-akunkas`.
- **LR4a: tab "Arus Kas"** di samping Ringkasan Laba/Rugi, dan tab buku
  mutasi berganti nama dari "Mutasi & Arus Kas" menjadi "Mutasi Kas"
  (judulnya "Laporan Mutasi Kas"); rutenya tetap `mutasiArusKas`.
- **LR5a: "Unduh laporan" membuka menu PDF, Excel, dan CSV**, berkas dari
  backend (`?format=`) dengan filter yang sama, diunduh lewat
  `apiClient.unduh` karena butuh header Authorization.
- **LR6a: filter awal bulan berjalan sampai hari ini**, Semua akun, per
  hari.

### Keputusan bisnis Mesin Kasir

Diputuskan pemilik proyek pada 10 November 2026, atas keputusan bisnis
nomor 1 sampai 3 audit backend 5 November 2026 (K-08 sampai K-10). Teks
audit tidak tersimpan di repo, sehingga ketiganya dirumuskan dari aturan
backend `aeb6a52`. Ketiganya perubahan backend (Nizar); web menyesuaikan
setelah backend menerapkannya.

- **MK15a: VOID pembayaran tunai mengurangi laci sesi yang sedang buka
  di perangkat yang melakukan VOID**, tempat uang fisik keluar. Tanpa
  sesi terbuka (web, Owner) tetap dari laci yang dulu menerima.
  Sekarang selalu dari laci asal (`services/pembayaranService.js` baris
  628), sehingga sesi berikutnya di laci asal selisih bila sesi asalnya
  sudah ditutup.
- **MK16a: login pengguna lain di perangkat mewajibkan tutup sesi lama
  dengan hitungan** sebelum bertransaksi; Owner tetap dikecualikan.
  Sekarang sesi terbuka dipakai siapa pun di perangkat itu
  (`middleware/kasirBuka.js`), sehingga transaksi kasir berikutnya masuk
  sesi kasir sebelumnya.
- **MK17a: tunai ke laci yang dipetakan ke mesin kasir hanya lewat sesi
  terbuka laci itu.** Selain itu, termasuk dari web dan dari perangkat
  Owner tanpa sesi, ditolak dengan pesan buka kasir dulu atau pilih akun
  kas lain (misalnya "Kas Kantor"). Web perlu menampilkan pesan itu di
  pembayaran penjualan setelah backend menerapkannya.

### Sub-menu Keuangan dan Laporan

Diputuskan pemilik proyek pada 12 November 2026 (`inti/status.md`,
Pekerjaan UI berikutnya butir 1), karena tab Keuangan sudah terlalu
banyak. Menggantikan tab LR4a dan tab Belanja Stok serta Mesin Kasir
sebagai jalan masuk; rutenya tidak berubah.

- **SK1a: grup "Keuangan & Laporan" berisi dua menu lipat** dengan gaya
  menu Keuangan yang sudah ada (`components/sidebar-menu.ts`). Keuangan:
  Penjualan, Pengeluaran, Akun Kas & Bank, Mutasi Kas, Belanja Stok, dan
  Mesin Kasir. Laporan: Ringkasan Laba/Rugi dan Arus Kas; menu Laporan
  yang tadinya tautan tunggal ke Ringkasan Laba/Rugi memakai href semu
  `/dashboard/outlet/laporan` sebagai induk.
- **SK2a: bar tab di layout Keuangan dibuang**, sedangkan judul
  "Manajemen Keuangan" dan empat kartu ringkasan tetap tampil di semua
  laman Keuangan. Anak menu yang halamannya ditolak `IZIN_HALAMAN`
  disembunyikan sidebar seperti tab sebelumnya (`kontrak/temuan.md` butir
  163).

## Catatan

### Catatan dari sub-menu Keuangan dan Laporan

- Tautan sub-menu sidebar kini membawa `aria-current="page"` mengikuti
  status aktifnya (termasuk halaman anak seperti `akunkas/[id]`), sehingga
  spec yang dulu memeriksa tab aktif memeriksa sub-menu.
- Unit test tab (`keuangan-nav-tabs.test.tsx`, 5 kasus) dibuang bersama
  komponennya; kasus izinnya dibawa ke
  `tests/unit/components/sidebar-menu-keuangan.test.ts` (7 kasus,
  termasuk susunan dan href induk Laporan).
- Sub-menu yang induknya tidak aktif tertutup dan isinya tidak dipasang,
  sehingga spec mencari tautan Keuangan dari laman Keuangan dan tautan
  Laporan dari laman Laporan.

### Catatan dari penyambungan Mesin Kasir

- `GET /sesikasir` selalu berhalaman (`bacaPaginasiWajib`, bawaan 20
  baris, maksimal 100), sehingga kasir yang buka dimuat dengan `limit`
  100 agar tidak terpotong diam-diam. Riwayat memakai `useInfiniteQuery`
  20 sesi per halaman lewat tombol "Muat hari sebelumnya".
- `dari` dan `sampai` dikirim `YYYY-MM-DD` lokal (`keTanggalLokal`);
  backend membacanya sebagai awal dan akhir hari WIB (`bacaTanggal` di
  `utils/periodeWIB.js`).
- `GET /device/:userId` menjawab 403 bila level role peminta tidak di
  atas level pengguna itu, kecuali perangkat milik sendiri, dan respons
  tidak mem-populate pemiliknya. Pilihan perangkat memuat perangkat
  setiap karyawan outlet lewat `useQueries` tanpa retry, melewati yang
  ditolak, dan mengisi nama pemilik dari daftar pengguna. Dimuat saat
  halaman dibuka bagi pemegang izin kelola, agar form tidak sempat
  menampilkan keadaan tanpa perangkat selama memuat.
- Tutup kasir menjawab 400 untuk catatan wajib, akun nonaktif, dan
  validator, sehingga `pesan.ts` mengenali kasus dari teks pesan, bukan
  dari status saja. Pesan lain diteruskan apa adanya (MK14b).
- Tutup dari web menginvalidasi akar `sesiKasir` dan `akunKas`, karena
  selisih menyamakan saldo laci dan menulis mutasi selisih kas.
- Rate limit hitungan kasir 10 per menit per pengguna berlaku juga di
  backend development (dilewati hanya bila `NODE_ENV=test`); spec
  memakai tiga hitungan per run (buka, tutup ditolak, tutup).
- Keadaan pratinjau yang disetujui perlu diuji ulang dengan data nyata:
  keadaan "belum ada mesin kasir" di pratinjau selalu tanpa riwayat,
  padahal di data nyata riwayat mesin yang sudah dilepas tetap ada
  (MK13a). Ketahuan dari skenario HP yang terlewati karena riwayat
  tidak tampil, lewat snapshot `error-context.md`.

### Catatan dari tampilan Mesin Kasir dan perbaikan HP Keuangan

- Selisih sesi kasir dihitung `nominal - saldo` (`sesiKasirService.js`
  baris 99): positif berarti uang di laci lebih dari catatan sistem.
- Respons mesin kasir hanya membawa `namaAkun` laci; nomor akun diambil
  dari daftar akun kas. `GET /sesikasir` berhalaman server (`page` dan
  `limit`, bawaan dari `bacaPaginasiWajib`) dan membaca `status`,
  `installationId`, `dari`, dan `sampai`; parameter lain ditolak 400.
- Lebar isi halaman di HP dan laptop diukur dari rantai pembungkusnya,
  bukan diperkirakan dari pratinjau. Kanvas desain digambar tanpa
  sidebar, sehingga lebar isi di laptop 1280 px (sekitar 880 px) jauh di
  bawah bingkai 1440 px pratinjau. Langkah ukur sementara di spec
  mencetak posisi, lebar, padding, dan margin setiap pembungkus.
- Spec tampilan menguji posisi dan ukuran (`boundingBox`), label tidak
  terpotong (`scrollWidth` terhadap `clientWidth`), dan halaman tanpa
  gulir ke samping, lalu dibuktikan gagal terhadap kode lama lewat
  `git stash push` atas berkas yang diubah.

### Catatan dari tab Belanja Stok

- `e073a9d`: `features/pembelian-stok/ringkasan.ts`
  (`kumpulkanPembelian`, `ringkasBelanja`, `bagianRingkasan`,
  `ruangLokasi`, `teksPeriode`), `useRingkasanBelanjaStok` di bawah akar
  `pembelianStok`, dan `halaman-belanja-stok.tsx`. Layout Keuangan
  memasang kartu ringkasan laba rugi di atas setiap tab, sehingga kartu
  Belanja Stok berada di dalam tab.
- Verifikasi pertama commit itu gagal di spec pengeluaran pukul 00.03
  WIB. Kegagalannya terbukti juga di pohon kerja bersih lewat
  `git stash`, sehingga bukan dari Belanja Stok; penyebabnya diperbaiki
  di `6d07b8d`, dan Belanja Stok di-commit sesudahnya.
- `6d07b8d`: `payloadBuatBeban(isian, owner, tanggalDipilih, sekarang)`,
  dan form catat beban memakai `useHariIni`. Field tanggal yang belum
  diubah Owner disinkronkan lewat `setValue` tanpa menandainya dirty.
- `7a08b63`: kartu ringkasan Keuangan memakai `useTanggalHariIni`,
  sehingga bulan berjalan ikut berganti.

### Catatan dari halaman pengeluaran

Dikerjakan pada 18 Oktober 2026 dalam empat commit, terhadap backend
`ridho` `00de455`. `origin/nizar` tetap dua commit di depan (`96e890e`
dan `3efd05b`), dan cabang lain tidak maju.

| Commit | Isi |
|---|---|
| `61275ac` | Izin beban operasional di template Manajer dan General Manajer (FC2a) |
| `b2d84a6` | Fondasi beban operasional dan kategori beban |
| `87fbf7a` | Kategori beban di Pengaturan (BO4a) |
| `1d7fa7b` | Halaman pengeluaran dan catat beban (BO3a, BO5a, BO6a, BO7a) |

- Kontrak diambil dari kode dan dokumen API backend, lalu dicocokkan
  dengan respons nyata: daftar beban berpaginasi, query asing ditolak
  400, dan kategori dikirim tanpa mapper.
- Dari kode `00de455`: laporan laba rugi menyaring beban VOID (butir
  132), saldo kurang dan akun nonaktif ditolak 409 di dalam transaksi
  (butir 133), dan daftar beban tidak lagi di-cache serta ganti nama
  kategori membuang cache detail beban (butir 135). Hapus kategori yang
  dipakai beban ditolak 409, terbukti lewat e2e.
- P23 (tanggal lampau hanya untuk Owner) sudah ditetapkan backend, tetapi
  baru diterapkan di jurnal transfer. Web menahannya lebih dulu di beban
  (BO5a). Dokumen backend sendiri mencatat sisi beban masih menunggu,
  sehingga tidak dilaporkan ulang.
- Temuan baru: nama kategori beban kembar dijawab 400, bukan 409
  (`kontrak/temuan.md` butir 148), dilaporkan ke Yoga.
- Run e2e pertama commit kategori gagal di login karena server dev
  menjawab 500: Turbopack mencatat folder rute baru sebagai berkas.
  Dipulihkan dengan memulai ulang server dev (`referensi/disiplin-perubahan.md`).
- Setiap run spec pengeluaran meninggalkan satu beban Rp1 berstatus
  Dibatalkan (BO7a). Kategori milik e2e tetap satu, fixture "E2E
  Kategori Beban".
- Vitest 678 lolos di 83 berkas. Suite e2e penuh tidak dijalankan
  (`inti/pengujian.md`).
- Keputusan: `modul/keuangan.md` (Halaman pengeluaran, BO3a sampai BO7a).

### Catatan dari pekerjaan Pindah Dana

Selesai pada 3 dan 4 Oktober 2026 dalam dua commit. Suite e2e penuh
dijalankan sebelum commit fitur: 422 lolos dan 17 skipped, tanpa
kegagalan.

| Commit | Isi |
|---|---|
| `e053a67` | Ketiga izin jurnal transfer di template Manajer dan General Manajer (DN4a) |
| `e53c016` | Halaman Pindah Dana: form, riwayat berpaginasi server, dan pembatalan lewat VOID |

- Halaman `/dashboard/outlet/keuangan/akunkas/pindahDana` (DN1a) memuat
  form di atas dan riwayat transfer di bawahnya (DN2a), di atas
  `features/jurnal-transfer` (`referensi/arsitektur.md`). Waktu transfer adalah
  waktu server; `tanggal` tidak dikirim (DN3a).
- Backend tidak punya `DELETE`: transfer dibatalkan lewat
  `PUT /jurnaltransfer/:id` berstatus VOID, yang membalik saldo kedua
  akun. Jumlah, akun, dan tanggal tidak dapat diubah setelah tercatat.
- Halaman tanpa syarat di `IZIN_HALAMAN` (entri kosong sejak `bc388c6`),
  dengan izin per bagian: form bagi
  `create-jurnal-transfer`, riwayat bagi `read-jurnal-transfer`, dan
  Batalkan bagi `update-jurnal-transfer`. Tombol Pindah Dana di halaman
  akun kas menjadi tautan bagi pemegang izin buat atau baca.
- Kedua mutation menginvalidasi akar `jurnalTransfer` dan `akunKas`,
  karena transfer mengubah saldo dua akun dan menulis dua baris buku
  mutasi.
- Pembatas tulis `/jurnaltransfer` 30 permintaan per menit per pengguna,
  dengan kunci sendiri yang terpisah dari `/akunkas`.
- Calon temuan backend dibuktikan lewat permintaan nyata pada akun uji
  sebelum dilaporkan: empat terbukti, dan satu dugaan (id tidak sah di
  `PUT` berujung galat server) terbantah, karena dijawab 404.
- Catatan backend baru: butir 126 sampai 129, dilaporkan 4 Oktober 2026
  (`arsip/laporan-backend.md`). Kontrak jurnal transfer ditambahkan ke
  `kontrak/endpoint.md` dan `kontrak/payload.md`.
- Keputusan pemilik proyek: `modul/keuangan.md` (Modul keuangan, DN1a sampai
  DN4a).

### Catatan dari pekerjaan ubah akun kas

Selesai pada 3 Oktober 2026 dalam satu commit, `1bc76f4`. Suite e2e penuh
dijalankan sebelum commit: 420 lolos dan 17 skipped, tanpa kegagalan.

- Halaman akun kas kini memakai `PUT /akunkas/:id` untuk tiga hal: ubah
  isian di halaman tersendiri,
  `/dashboard/outlet/keuangan/akunkas/[id]/ubah` (UA1a); nonaktifkan
  lewat tombol terpisah di halaman ubah (UA3a); dan aktifkan kembali
  lewat tombol di baris bagian lipat (UA2a).
- Form ubah mengirim hanya field yang berubah (UA4a): teks dibandingkan
  setelah dipangkas, keterangan yang dikosongkan dikirim `null`, dan
  tombol simpan mati bila tidak ada perubahan, karena backend menolak
  `PUT` tanpa perubahan dengan 400. Saldo hanya ditampilkan: validator
  backend menolak `saldo` saat update.
- Ganti status mengirim hanya `{ status }`. Penolakan 409 backend
  ditampilkan apa adanya di dalam dialog, karena pesannya memuat jumlah
  saldo atau nama metode: saldo belum 0, akun masih dipakai metode
  pembayaran (metode non-aktif ikut dihitung), dan batas 10 akun kas
  aktif saat mengaktifkan.
- Tombol Ubah dan Aktifkan kembali hanya tampil bagi pemegang
  `update-akunkas` (`features/akun-kas/izin.ts`); pengguna lain mendapat
  keterangan di halaman ubah. Rute ubah tanpa entri `IZIN_HALAMAN` saat
  itu; sejak `bc388c6` bersyarat `read-akunkas` dan `update-akunkas`,
  sehingga keterangan itu tidak lagi tercapai. Cabangnya dibuang di
  `dc0af1c`.
- Halaman ubah membaca akun dari cache daftar; `GET /akunkas/:id` tidak
  dipakai. `useUbahAkunKas` menginvalidasi akar `akunKas` dan
  `metodePembayaran`, karena respons metode memuat nama dan nomor akun
  kas tujuan.
- `routes/akunKasRoute.js` membatasi tambah dan ubah akun kas 30
  permintaan per menit per pengguna, dan hanya dilewati bila backend
  berjalan dengan `NODE_ENV=test`. Satu putaran spec ubah mengirim 15
  tulisan, sehingga pengulangan beruntun dijawab 429 (`inti/pengujian.md`).
- Commit pertama pekerjaan ini (`5420f89`) dicabut dari `main` dan
  diganti `1bc76f4` dengan isi yang sama: pesan commit tidak memuat baris
  atribusi asisten, atas keputusan pemilik proyek (3 Oktober 2026).
- Tidak ada catatan backend baru. Kontrak `PUT /akunkas/:id` ditambahkan
  ke `kontrak/endpoint.md` dan `kontrak/payload.md`.
- Keputusan pemilik proyek: `modul/keuangan.md` (Modul keuangan, UA1a sampai
  UA4a).

### Catatan dari pekerjaan mutasi arus kas dan akun kas

Selesai pada 3 Oktober 2026 dalam dua commit. Suite e2e penuh dijalankan
sekali di akhir (keputusan PF6a): 413 lolos, 1 gagal, dan 17 skipped.

| Commit | Isi |
|---|---|
| `e129f9d` | Halaman mutasi arus kas dari `GET /akunkas/mutasi`, dengan filter, ringkasan per akun, dan paginasi server |
| `6a57d12` | Halaman akun kas: kartu hanya untuk akun aktif, akun non-aktif di bagian lipat ringkas |

- Halaman mutasi adalah buku gabungan seluruh akun kas (MK1a): filter
  akun, periode, arah, dan jenis diterapkan backend bersama paginasi.
  Ringkasan periode tampil hanya saat satu akun dipilih (MK2a), dan
  halaman dibuka dengan bulan berjalan (MK3a).
  Sejak `d23844a` tanpa akun terpilih tampil ringkasan gabungan (NZ1a).
- Lapisan datanya ditambahkan ke `features/akun-kas` (`referensi/arsitektur.md`).
  Kedua hook mutasi selalu dimuat ulang saat dibuka, karena pembayaran
  mengubah buku tanpa menginvalidasi akar `akunKas`.
- Batas periode dikirim sebagai ISO utuh dari awal dan akhir hari lokal:
  tanggal tanpa jam dibaca backend sebagai tengah malam UTC, terbukti
  dari respons nyata (`kontrak/temuan.md` butir 123).
- Butir 61 terpenuhi. Catatan backend baru: butir 123 sampai 125,
  dilaporkan 3 Oktober 2026 (`arsip/laporan-backend.md`). Kontrak mutasi
  dan ringkasan ditambahkan ke `kontrak/endpoint.md`.
- Satu kegagalan suite penuh berasal dari backend, bukan dari kode:
  `POST /aset` saat menyiapkan data spec aset dijawab 500 "Connection
  operation buffering timed out after 10000ms" (koneksi Mongoose ke basis
  data). Spec itu lolos 50 dari 50 saat diulang dua putaran
  (`inti/pengujian.md`).
- Keputusan pemilik proyek: `modul/keuangan.md` (Modul keuangan, MK1a sampai
  MK3a dan AK1a).

### Catatan dari modul keuangan

Modul keuangan selesai pada 28 September 2026: spec pembanding (`0cfb3bd`)
dan migrasi (`45187b6`). Tidak ada lagi halaman keuangan yang memakai
`apiClient`, dan tidak ada data tiruan.

- Lapisan data ada di `features/akun-kas` (daftar, buat, dan skema) dan
  `features/laporan` (laba rugi dan aturan periode di `periode.ts`);
  halamannya tetap di `app/` dengan tampilan lama.
- Ringkasan laba rugi meminta dua rentang per periode, berjalan dan
  pembanding (KU5a). Kartu ringkasan dipasang di `layout.tsx` dan meminta
  bulan kalender penuh serta `GET /akunkas`, sehingga pengguna tanpa
  `read-akunkas` melihat `-` di kartu saldo (KU2a,
  `kontrak/izin-halaman.md`).
- Mutasi arus kas sempat menunggu endpoint mutasi kas dari backend
  (`kontrak/temuan.md` butir 61, keputusan KU1a); halamannya diwujudkan
  di `e129f9d` (Catatan dari pekerjaan mutasi arus kas dan akun kas).
- Setup tenant membuat akun kas bawaan "Kas Kecil (Laci)" `CASH-001` dan
  metode pembayaran "Tunai" yang bergantung padanya
  (`tenantService.createWithOwner`). Spec keuangan hanya menutup akun
  uji yang dibuatnya sendiri: sejak `b5a55c4` akun uji dibuat bersaldo 0
  lalu dinonaktifkan, karena `DELETE /akunkas/:id` tidak ada lagi dan akun
  bersaldo tidak dapat ditutup (`kontrak/temuan.md` butir 81).
- `AkunKasLama` dan `AkunKasRefLama` dihapus bersama migrasi metode
  pembayaran (`3359497`).
- Keputusan pemilik proyek untuk modul ini ada di `modul/keuangan.md` (Modul
  keuangan, KU1a sampai KU7a).

### Catatan dari penyesuaian backend `ridho` `af5f315`

- B99 (butir 148): nama kategori beban kembar dijawab 409 saat membuat
  maupun mengganti nama. Asersi spec kategori beban diperketat dari
  `[400, 409]` menjadi 409 (`d6f8ba0`).
- B100 (butir 137): beban operasional menolak tanggal masa depan,
  membatasi keterangan 500 karakter, membatasi tulis 30 per menit per
  pengguna, dan galat validatornya berbentuk `message` beserta `errors`.
  Pembatas laju hanya dilewati saat `NODE_ENV=test`; backend development
  memakai `development`, tetapi spec pengeluaran menulis jauh di bawah
  batasnya. Form web sudah menahan tanggal dan keterangan dengan aturan
  yang sama, sehingga hanya komentar
  `features/beban-operasional/schema.ts` yang diperbarui. Penolakan
  backend tidak dapat dipicu lewat UI dan dibuktikan dari kode.
- B97 (Nizar): tanggal lampau jurnal transfer hanya untuk Owner; Pindah
  Dana tidak mengirim tanggal, sehingga tidak berubah.

## Utang terbuka

### Utang kecil dari tombol Catat pembelian

- Isian tanggal filter Belanja Stok yang meluber di HP lunas 12 November
  2026 (BS6a, di bawah).
- Menu tunggal Pembelian Stok hanya aktif di sidebar pada daftarnya, tidak
  di detail dan form catat, seperti menu tunggal lain (`isActive` cocok
  persis). Selesai di `609b36a` untuk seluruh menu tunggal
  (`hrefMenuAktif`, `modul/ui-ux.md` CV2b).

### Utang kecil dari modul keuangan

- Halaman pengeluaran menampilkan keterangan belum tersedia sejak
  `7fce871`, dan gate-nya masih `read-pembayaran`. Halamannya dibangun
  begitu backend memperbaiki izin beban dan menetapkan kontraknya
  (`kontrak/temuan.md` butir 130 sampai 132). Izinnya sudah diperbaiki
  (`yoga` `55328f1`); yang ditunggu tinggal butir 131 sampai 134 (NZ11a).
  Keempatnya diperbaiki di `7d28135` (RG6a), dan halamannya dijadwalkan
  setelah RG4a.
  Halamannya selesai di `1d7fa7b`, dengan gate `read-beban-operasional`.
- `DELETE /akunkas/:id` tidak ada lagi sejak backend `465b438`, dan akun
  bersaldo tidak dapat ditutup (`kontrak/temuan.md` butir 81). Ubah,
  nonaktifkan, dan aktifkan kembali tersedia sejak `1bc76f4`, dan Pindah
  Dana sejak `e53c016`. Menutup akun bersaldo dengan memindah saldonya
  lebih dulu teruji sebagai satu alur sejak `f7805ca`; backend tetap
  tidak punya jalur koreksi saldo.
- Riwayat transfer berfilter periode sejak `8072214` (NZ3a). Ubah
  keterangan transfer tanpa VOID tidak dibuat.
- Halaman mutasi arus kas menampilkan pencatat, tautan penjualan, dan
  ringkasan gabungan sejak `d23844a` (NZ1a dan NZ2a).
  `GET /akunkas/:id/mutasi` tidak dipakai web, karena buku gabungan
  menerima `akunKasID`.
- Tampilan halaman akun kas dan halaman ubah bagi pengguna tanpa
  `update-akunkas` belum teruji e2e (`inti/pengujian.md`), dan halaman ubah
  membaca akun dari cache daftar tanpa `GET /akunkas/:id`.
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

### Utang kecil dari Mesin Kasir dan perbaikan HP Keuangan

- Halaman Akun Kas tenant uji menampilkan "Akun non-aktif (518)"
  (tangkapan layar pemilik proyek, 6 November 2026). Asalnya belum
  ditelusuri; dugaan awal, akun uji spec Keuangan yang dinonaktifkan
  karena `DELETE /akunkas/:id` tidak ada lagi (`kontrak/temuan.md`
  butir 81). Ditelusuri 14 November 2026 lewat kueri baca-saja: kini 663,
  seluruhnya akun bernama awalan "E2E" (Ubah Kembar 146, Keuangan Akun 97,
  Ubah Status 73, Pindah Tujuan dan Pindah Sumber masing-masing 68, Tutup
  Bersaldo 64, dan seterusnya). Bukan bug tampilan; tetap utang pengujian
  (`referensi/utang-pengujian.md`, akun kas uji menumpuk).
- Tab Keuangan memakai `focus-visible:ring-0`, sehingga tab tidak punya
  penanda fokus saat dipakai dengan keyboard. Dipertahankan di
  `b3f8698` karena tidak ada di pratinjau yang disetujui. Gugur di
  `7b90716`: bar tab Keuangan dibuang (SK2a). Kelas yang sama masih
  dipakai tab navigasi Inventaris dan Reservasi
  (`inventaris-nav-tabs.tsx`, `reservasi-nav-tabs.tsx`; terlihat
  14 November 2026).
- Keadaan memuat, gagal dimuat, sesi lintas tengah malam, Muat hari
  sebelumnya, serta posisi panel di HP dan desktop tidak lagi teruji e2e
  sejak spec pratinjau dihapus di `b74f30a` (daftar periksa nomor 6);
  spec alur nyata hanya memeriksa tanpa gulir ke samping di HP
  (`referensi/utang-pengujian.md`).
- `kontrak/temuan.md` butir 172 sampai 174, K-18, dan K-19 tetap
  terbuka di backend; web menanganinya seperti sebelum penyambungan
  (MK3a, MK5a, dan `NAMA_MESIN_TANPA_DAFTAR`).
