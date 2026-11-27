# Utang Pengujian

Sifat perubahan: **Sering**: bertambah saat modul dikerjakan; butir yang lunas dipindah ke `arsip/riwayat-pengujian.md`.

Lapis referensi: kirim bersama dokumen modul saat menulis atau mengubah spec modul itu. Isinya dipindah dari `inti/pengujian.md` pada 25 Oktober 2026 tanpa perubahan.

Cakupan uji yang belum lengkap beserta alasannya, dan data uji yang
tertinggal di basis data development. Disusun ulang 24 November 2026
menjadi lima bagian, agar sesi berikutnya cukup membaca berkas ini tanpa
menelusuri kode: yang dapat dikerjakan sekarang, yang menunggu keputusan,
yang menunggu backend, yang tidak dapat dibuktikan beserta alasannya, dan
data uji yang menetap. Butir yang sudah lunas dan
kejadian sesekali yang tidak berulang ada di `arsip/riwayat-pengujian.md`.

## Dapat dikerjakan sekarang

Hanya menyentuh frontend dan data uji; tidak menunggu backend maupun
keputusan baru.

Tidak ada. Seluruh butir dilunasi 25 November 2026
(`arsip/riwayat-pengujian.md`).

## Menunggu keputusan pemilik proyek

Tidak ada. Isi berkas Excel ekspor dibaca sejak 25 November 2026 lewat
`exceljs` (dependency pengembangan, keputusan pemilik proyek):
`unduh/ekspor-daftar` memeriksa judul kolom yang sama dengan CSV, lebar
setiap baris, baris TOTAL, dan TOTAL yang menjumlah setiap kolom angka
menurut status yang dihitung backend (penjualan tersimpan, pengeluaran
tanpa VOID), termasuk laba rugi dan stok saat ini.

## Menunggu backend

Tidak ada. Ketiga skenario merah disengaja (butir 191, 192, 193) lolos
sesudah backend `6478d29` (PW02, 26 November 2026;
`arsip/riwayat-pengujian.md`).

## Tidak dapat dibuktikan dengan data atau lingkungan sekarang

- **Tiga rute ubah di `akses/syarat-rute` memakai id uji yang tidak ada**
  (Ubah Pengajuan DRAFT, revisi surat jalan PENDING di outlet dan gudang),
  selama data uji tidak punya dokumen berstatus itu; form yang dipasang
  sesudah detail termuat di ketiganya belum tertelusuri.

- **Batas 10.000 baris ekspor (400)** tidak dapat dibuat deterministik
  dari web.

Batas cakupan yang diterima: MVP satu outlet, data yang hanya dibuat
aplikasi, keadaan yang hanya dapat dibuat lewat simulasi bertanda,
skip bersyarat data, dan catatan proses.

- **Pemilih outlet di jurnal stok dan pembelian stok hanya berisi satu
  pilihan** di MVP satu outlet, sehingga memilih outlet tidak memicu
  permintaan baru. Kedua jalur cakupan lokasi teruji e2e sejak
  `1cd8211` (`arsip/riwayat-pengujian.md`).
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
- **Blok booking tanpa penjualan** (tanpa tautan R4b) hanya teruji di unit
  test (`tests/unit/features/sesi-booking/tampilan.test.ts`), karena jalur
  buat booking selalu membuat penjualan.
- **Beda `keLocationID` dan `locationID` di daftar surat jalan tidak
  teruji dari data**: seluruh surat jalan uji menuju outlet tenant,
  sehingga keduanya memberi hasil yang sama; bedanya terbukti dari kode
  (`kontrak/temuan.md` butir 33). Lingkup satu lokasi tujuan hanya teruji
  di unit test (`paramHalamanPemantauan` sejak TS2a).
- **Semua Outlet dengan beberapa outlet di jurnal stok** (meminta
  memilih satu outlet) hanya teruji di unit test (`lokasiSatuOutlet`),
  karena tenant uji punya satu outlet.
- **Penjaga ruang detail stock opname hanya teruji untuk dokumen yang
  tipe lokasinya diketahui**, dan kedua skenarionya dilewati bila ruang
  itu belum punya dokumen.
- **Periode jurnal stok diuji lewat tanggal 8 sampai 15 bulan
  berjalan**, agar tanggal itu tidak kembar dengan tanggal bulan lain di
  kalender; skenarionya dilewati sebelum tanggal 8. Sampai tanggal tidak
  diubah lewat kalender; pemetaannya teruji di `paramHalamanJurnal`.
  Skenario ukuran dan halaman berikutnya dilewati bila jurnal outlet
  bulan berjalan belum lebih dari satu halaman, sehingga skipped dapat
  naik di awal bulan.
- **Pemilihan baris menurut data di spec daftar pengajuan** (`7f1de56`)
  bergantung pada baris itu berada di halaman pertama tabel (10 baris).
- **Backend di jam rawan hanya teruji saat suite dijalankan pada
  jamnya.** `page.clock` dan `vi.setSystemTime` hanya memalsukan jam
  frontend, sedangkan validator backend memakai jam server. Jendela
  00.00 sampai 07.00 WIB teruji lewat suite penuh 26 Oktober 2026 pukul
  00.11 dan 00.53, dan 28 Oktober 2026 pukul 00.17; B113 dan B118
  dibuktikan lewat permintaan nyata pukul 00.57.
- **Navigasi halaman berikutnya stock adjustment dilewati bersyarat**
  (`inventaris/halaman-berikutnya`): kedua ruang punya 10 adjustment atau
  kurang, dan membuatnya berarti opname disetujui dengan selisih yang
  mengubah stok. Stock opname, surat jalan, pengajuan stok, dan jurnal
  stok teruji.
- **Skenario daftar pengajuan dan surat jalan memilih contoh dari halaman
  pertama**, sehingga dilewati bila halaman itu tidak memuat permintaan,
  pengembalian, atau dua dokumen untuk dibandingkan.
- **Muat hari sebelumnya riwayat Mesin Kasir dilewati bersyarat** bila
  riwayat tujuh hari terakhir belum lebih dari satu halaman (20 sesi);
  sesi lintas tengah malam tidak teruji e2e. Memuat, gagal dimuat, form
  tanpa perangkat atau tanpa laci, dan susunan panel di HP dan desktop
  teruji e2e sejak 24 November 2026 (`keuangan/mesin-kasir`).
- **Label kedatangan Status Staf (AB6a) hanya teruji di unit test**
  (`tests/unit/features/dashboard-outlet/dashboard-outlet.test.ts`),
  karena absen dibuat aplikasi dengan foto dan koordinat, sehingga data
  Terlambat dan Luar Jadwal tidak dapat disiapkan web secara
  deterministik.
- **Pembatasan 403 halaman stok bagi staf di luar lokasi kerjanya (B270
  sampai B274) tidak diuji web**, karena ruang kini menolak lebih dulu
  (LK3a). Isian lokasi kerja tanpa `read-location` dan untuk role Owner
  teruji e2e sejak 24 November 2026 (`pengguna/crud-pengguna`).
- **Batas 50 diskon aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, untuk tombol tambah dan menu Aktifkan
  (sejak 24 November 2026), karena lima puluh diskon aktif tidak dibuat di
  data uji. Pilihan Aktif di form buat teruji e2e sejak `a80d2fa` (NZ5a).
- **Metode aktif terakhir hanya teruji lewat simulasi** bertanda
  `// simulasi:`. Penolakan 409 backend atasnya dibuktikan lewat skrip
  sekali pakai (7 Oktober 2026), karena web kini menahannya. Batas 10
  metode aktif teruji dengan data nyata sejak 24 November 2026.
- **Aktifkan dengan durasi wajib dan perpanjangan yang membuka akun
  kedaluwarsa teruji e2e lewat simulasi** respons detail bertanda
  `// simulasi:` (`admin/langganan-akun`, 24 November 2026), karena akun
  bermasa akses lewat atau beku karena kedaluwarsa tidak dapat dibuat
  lewat UI maupun API.
- **Keadaan masa berlaku Langganan teruji e2e lewat simulasi** respons
  bertanda `// simulasi:` (`pengaturan/langganan`, 24 November 2026): masa
  percobaan beserta bilahnya, dan masa akses lewat beserta masa tenggang.
  Akun uji Pro tanpa batas waktu dengan satu catatan riwayat, sehingga
  Muat riwayat lainnya halaman Langganan hanya teruji di unit test
  (Muat Berikutnya panel admin teruji e2e).
- **Spec mutasi arus kas bergantung pada data bulan berjalan**: empat
  skenarionya dilewati bersyarat bila belum ada mutasi, belum sampai dua
  halaman, atau belum ada pembatalan pembayaran pada bulan itu, sehingga
  di awal bulan jumlah skipped dapat naik.
- **Penonaktifan otomatis pajak per transaksi yang tidak atomik**
  (`kontrak/temuan.md` butir 90) terbukti dari kode saja. Jalur berhasil
  membuat pajak per transaksi aktif teruji e2e sejak 24 November 2026
  (`pengaturan/kelola-pajak`), lalu PPN dipulihkan di akhir skenario.
- **`DataTable` mode server hanya dipakai dan teruji di daftar
  penjualan** (`tests/e2e/penjualan/daftar-penjualan.spec.ts`). Mode
  klien kesembilan tabel lain tidak berubah di `b63cf08`, dan tidak diuji
  ulang khusus. Urutan server (`urutanServer`, `a4304ce`) juga hanya
  dipakai dan teruji di daftar penjualan. Sejak `93490bb` `DataTable`
  menampilkan kartu per baris dan susunan kartu di HP. Label kartu HP,
  `lebarBungkus`, dan prop `rincian` punya test integrasi sejak `2bcb1ce`,
  serta teks kaki dan tombol halaman mode klien maupun server sejak
  26 November 2026, termasuk angka dan aksi paginasi server tanpa daftar
  penjualan (`tests/integration/components/data-table/data-table.test.tsx`);
  susunan HP dilihat lewat tangkapan, bukan spec.
- **Password salah pada akun uji menambah hitungan pembatas login**, dan
  login sukses tidak menguranginya. Spec login gagal lebih awal bila sisa
  kuota di header `RateLimit` di bawah 3; menjalankan spec auth berulang
  (`--repeat-each`) dalam 15 menit dapat mengunci login seluruh suite.
- **Spec panel admin bergantung pada `.env.e2e`**: tanpa kredensial admin
  uji, 16 dari 17 skenarionya dilewati (PA5a), sehingga mesin tanpa berkas
  itu tidak menguji panel admin sama sekali.
- **Skenario pendaftaran di spec daftar dilewati bila kuota pendaftaran
  backend habis** (`d94a48c`). Backend kini menerima `REGISTER_LIMIT_MAX`
  di non-produksi (B230), dan perintah layanan uji menyetelnya; skip itu
  tinggal pengaman bila backend dijalankan tanpa env tersebut.
- **Suite e2e penuh tidak lagi dijalankan di akhir setiap pekerjaan**
  (6 Oktober 2026), sehingga baseline suite penuh dapat berupa hitungan
  selama beberapa pekerjaan. Sejak 7 November 2026 e2e dijalankan
  sebagai satu suite penuh di akhir setiap putaran, bukan per commit
  (`inti/cara-kerja.md`, Alur setiap perubahan langkah 5); di antara
  commit dan suite penuh, spec baru belum pernah dijalankan.
  Angka terukur terakhir ada di
  `inti/pengujian.md` (Baseline).

- **Sumber lonceng yang datanya dibuat aplikasi atau bergantung hari
  hanya teruji di unit test** (`tests/unit/features/notifikasi`): kasir
  lupa ditutup (sesi dibuka aplikasi kemarin), kehadiran (absen dibuat
  aplikasi), jadwal minggu depan (hanya Kamis sampai Minggu), izin cuti
  diajukan (dibuat aplikasi), hasil pengajuan dalam 24 jam, dan booking
  lewat jam belum lunas. E2E `dashboard/lonceng-pemberitahuan`
  membuktikan jumlah lencana sama dengan kartu dan urutan per tingkat
  terhadap data nyata, serta pemicu stok LN1a lewat akun klien sekali
  pakai.
- **Pengembalian menunggu diterima di gudang bagi pengguna gudang saja
  (LN17a, B382) hanya teruji di unit test**
  (`tests/unit/features/notifikasi/sumber-inventaris.test.ts`), atas
  pilihan pemilik proyek 26 November 2026 (PW06): data development tidak
  punya surat jalan berstatus DIKIRIM (466 DITERIMA, 308 BATAL), dan peran
  uji "E2E Lokasi Gudang" hanya memegang izin baca. Pembuktian e2e butuh
  peran uji gudang berizin terima dan surat jalan pengembalian yang
  dikirim lewat UI (stok outlet berpindah ke gudang setiap run).
- **Angka struk Laporan Tutup Kasir dengan transaksi nyata belum diuji
  e2e** (PW10): periode uji tanpa penjualan, sehingga penerimaan per
  metode dan produk terjual teruji di test integrasi
  (`tests/integration/components/sesi-kasir/struk-laporan.test.tsx`);
  e2e membandingkan setiap angka struk dengan laporan backend yang bernilai
  0. Transaksi tunai, non-tunai, dan invoice bersesi adalah PW13.
- **Cetak struk ke printer sungguhan tidak diuji** (PW11): dialog cetak
  browser tidak dapat dikendalikan Playwright, sehingga `window.print`
  dicatat lewat pengganti, tampilan cetak dibuktikan dengan
  `emulateMedia`, dan ukuran kertas dari PDF `@page` (80 mm, satu lembar
  setinggi struk). Hasil di printer termal 80 mm nyata belum dicoba.
- **Lihat semua di panel lonceng (LN19a) hanya teruji di test integrasi**
  (`tests/integration/components/notifikasi`), karena akun uji per
  25 November 2026 punya tepat lima pemberitahuan; spec
  `dashboard/lonceng-pemberitahuan` membentangkan panel bila tombolnya
  ada.

## Data uji yang menetap dan data per run

Pembersihan terakhir 26 November 2026 lewat `bersih-data-uji.js`
(cadangan `db_produk-sebelum-bersih-2026-11-26.gz`): 11 akun kas, 18
metode, 61 diskon, 91 shift, dan 65 pelanggan uji yang tidak dirujuk
dokumen lain (`inti/status.md`, Catatan data development). Angka per
tanggal di butir di bawah adalah pembersihan sebelumnya.

- **Terima penerimaan yang berhasil** diuji sungguhan lewat UI sejak
  `6e314ae` (keputusan PB12a), termasuk jumlah 0. Setiap run menambah stok
  outlet secara permanen, dan surat jalan DITERIMA tidak dapat dibatalkan.
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
- **Booking uji dibersihkan lewat API**: pembayaran PAID-nya dibatalkan,
  lalu penjualannya di-void (PB8a), walau web kini punya jalur void untuk
  penjualan booking yang belum dibayar (PB2a). Setiap run spec daftar
  reservasi meninggalkan penjualan booking VOID dan booking VOID. Per
  26 November 2026 tenant uji punya 995 penjualan booking VOID dengan 181
  pembayaran terhubung; tidak dibersihkan, karena riwayat keuangan yang
  saling terkait dan belum ada skrip yang aman (`inti/status.md`, Catatan
  data development).
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
- **Metode uji menumpuk sebagai nonaktif**, satu per run spec kelola
  metode pembayaran, karena metode tidak dapat dihapus (PO10a).
  Dibersihkan 20 November 2026: 4 metode E2E nonaktif yang tidak dirujuk
  pembayaran.
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
- **Pengguna uji "E2E Profil" permanen** di basis data development,
  dibuat sekali dengan peran tanpa izin pengguna. Nama, PIN, dan nomor
  HP-nya dipulihkan Ridho di awal setiap test (PF5a).
- **Transfer uji menumpuk**, karena transfer tidak dapat dihapus: satu
  VOID per run spec Pindah Dana, serta dua AKTIF dan satu VOID per run
  spec tutup akun bersaldo (`f7805ca`), masing-masing Rp1. Skenario
  utama kedua spec dilewati bila tidak ada akun kas aktif bersaldo di
  luar akun uji. Transfer uji yang terkumpul sampai 20 November 2026
  dihapus bersama akun kas uji (butir akun kas di atas); riwayat
  pengujiannya tetap tercatat di dokumen ini dan di baseline.
- **Penolakan backend atas Pindah Dana teruji e2e sejak 24 November 2026**
  (`keuangan/pindah-dana`): saldo sumber berkurang dan akun tujuan
  dinonaktifkan sesudah form dibuka, dan pembatalan yang menguras saldo
  tujuan. Setiap run menambah lima transfer Rp1 di akun uji tetap.
- **Data development memuat transfer berjumlah pecahan** di akun "kasir
  outlet" (bukti `kontrak/temuan.md` butir 126, FR2a), sehingga total
  masuk dan total keluar akun itu berpecahan sepanjang Oktober 2026.
  Spec yang membandingkan rupiah memakai `formatRupiah`.
- **Spec alur pengembalian memindahkan satu satuan stok outlet ke gudang
  per run** (`a505783`), karena surat jalan DIKIRIM tidak dapat
  dibatalkan (P12). Bila berhenti setelah disetujui dan sebelum surat
  jalan dibuat, pengajuan APPROVED tertinggal di tab Semua gudang.
- **Spec Belanja Stok menyiapkan dua pembelian lewat API** (keputusan
  rancangan butir 23 mengizinkannya, karena halaman itu hanya membaca);
  setiap run menambah lalu mengurangi stok bahan fixture di outlet dan
  gudang.
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
- **Bahan uji "E2E Bahan Kaleng" permanen** di basis data development
  (ml, kemasan kaleng = 290), dibuat sekali oleh
  `inventaris/bahanBaku/konversi-satuan.spec.ts`; pengajuan uji per run
  diajukan lalu ditolak, sehingga pengajuan Ditolak bertambah satu per run.
- **Peran dan pengguna uji kelompok 1 menetap** (24 November 2026),
  dibuat sekali lewat `tests/helpers/terkunci-uji.ts` dan dipakai ulang:
  E2E Template Supervisor, Manajer, dan Kasir; E2E Kelola Kasir Tanpa
  Akun dan Tanpa Pengguna; E2E Tur Tanpa Pengguna; E2E Pengelola Posisi;
  E2E Diskon Tanpa Produk dan Buat Saja; E2E Kelola Pengguna Tanpa
  Lokasi; E2E Gudang Tanpa Buat Lokasi; E2E Pengelola Pengajuan; dan
  peran tanpa pengguna E2E Staf Level Rendah. Mereka ikut tampil di
  daftar pengguna dan pilihan login PIN.
- **Data per run spec kelompok 1**: satu diskon Non-Aktif "E2E Diskon
  Tanpa Produk ..." (`diskon/izin-diskon`) dan satu pengajuan Ditolak
  (`alur-pengajuan-stok`, P20). Posisi dan staf uji yang dibuat dihapus di
  akhir skenario; staf "Karyawan Tanpa Lokasi ..." dari run yang gagal di
  tengah tertinggal.
- **Data per run spec kelompok keuangan** (24 November 2026): satu akun
  kas "E2E Mutasi Jenis ..." non-aktif bersama satu beban VOID dan satu
  transfer VOID (`mutasi-kas`), satu transfer Rp1 "E2E riwayat periode"
  (`pindah-dana`), empat transfer Rp1 di akun "E2E Beban Ditolak Tetap"
  (`pengeluaran`), dan penjualan serta pembayaran uji skenario idempotensi
  yang dibersihkan seperti skenario penjualan lain (`alur-penjualan`).
  Akun pengisi "E2E Batas Akun Tetap 1" sampai 10, "E2E Batas Akun
  Cadangan Tetap", dan metode "E2E Batas Metode Tetap 1" sampai 10 menetap
  non-aktif dan dipakai ulang.
- **Spec kelompok admin dan profil tidak meninggalkan data menetap**
  (24 November 2026): akun klien bertoko (bekukan dan hapus), akun
  berriwayat lebih dari 20 catatan (11 kali bekukan dan buka lewat API),
  dan akun dialog HP dibuat sekali pakai lalu dihapus lewat API admin;
  nama Owner dipulihkan di akhir skenario.
- **Data per run spec kelompok inventaris dan gudang** (24 November
  2026): satu surat jalan BATAL dari `transferStok/daftar-surat-jalan`
  (pengajuan uji transfer kembali PENDING lalu dipakai ulang); satu
  surat jalan pengembalian BATAL dan satu DITERIMA sebagian dari
  `pengajuanStok/pengembalian-jalur-gagal`, yang memindahkan dua satuan
  dari stok outlet dan satu di antaranya ke gudang; satu pengajuan
  Ditolak dari PG2a (`alur-pengajuan-stok`); dua surat jalan kaleng
  (BATAL dan DITERIMA 200 ml) dari `konversi-satuan`, dengan pembelian
  Rp0 dua kaleng di gudang setiap kali stoknya kurang (pengajuan kaleng
  yang kembali PENDING dipakai ulang; empat dari run sebelum `946ce02`
  tertinggal); dan satu produk
  uji yang dihapus dari `produk/crud-produk`. Entri inventory gudang
  "E2E Bahan Kaleng" dan pengguna uji "E2E Pengaju Gudang" serta "E2E
  Penyetuju Gudang" (berlokasi kerja Gudang) menetap.
- **Data per run skenario laci dikosongkan saat buka kasir**
  (`keuangan/mesin-kasir`, PW09, 27 November 2026): satu sesi kasir
  tertutup, satu Pindah Dana buka kasir Aktif dari laci uji ke "E2E Tujuan
  Laci Tetap" (tidak dapat di-VOID), dan satu transfer pengosongan akun
  tujuan ke akun aktif bukan uji. Akun tujuan menetap non-aktif dan
  dipakai ulang lewat `akunUjiTetap`, karena batas 10 akun kas aktif.
  Bila laci uji sudah kosong, skenario memindah Rp1 dengan catatan
  selisih.
- **Data per run spec Laporan Tutup Kasir** (`keuangan/laporan-tutup-kasir`,
  PW10, 27 November 2026): satu sesi kasir dan satu periode tertutup di
  laci uji, dibuka lewat aplikasi lalu ditutup lewat API dengan hitungan
  sama dengan saldo. Skenario periode berjalan dilewati bila mesin kasir
  lain masih buka, karena periode uji baru tertutup oleh sesi terakhir.
- **Data per run spec kelompok reservasi, jadwal, dan tampilan**
  (24 November 2026): dua penjualan booking VOID dari
  `reservasi/daftar/lihat-reservasi` (Digunakan dan TL1a, termasuk satu
  pembayaran Rp1 yang dibatalkan), satu penjualan booking VOID dari
  PB15a beserta satu perangkat mesin kasir uji yang dilepas, dan satu
  akun klien Basic sekali pakai dari tur dashboard yang dihapus lewat API
  admin. Metode "E2E Metode Laci Tetap" menetap non-aktif dan dipakai
  ulang.
