# Modul Pemberitahuan

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Dibuat 25 November 2026.

Lonceng topbar sebagai pusat pemberitahuan toko
(`features/notifikasi`), menggantikan lonceng satu sumber TP8a
(`modul/setup-akun.md`).

## Keputusan

### Pemberitahuan stok (24 November 2026)

Diputuskan pemilik proyek lewat dialog saat utang pengujian kelompok
inventaris dan gudang:

- **LN1a: pemicu stok.** Peringatan bila toko tidak punya produk sama
  sekali, atau tidak ada satu pun produk yang dapat dijual (setiap
  produk berstok yang bukan unlimited stoknya 0, termasuk produk
  beresep yang stok terhitungnya 0). Ditambah pemberitahuan tingkat
  sedang untuk produk yang stoknya mencapai batas minimum.
- **LN2a: isi menurut jenis produk.** Tanpa produk: Buat Produk;
  berstok langsung: isi stok lewat Ubah Produk; beresep: Pembelian Stok,
  dan Pengajuan ke Gudang bila plan punya gudang. Tautan hanya bagi
  pemegang izinnya.
- **LN3a: bentuk.** Pemberitahuan di lonceng topbar, dan panel lonceng
  terbuka sendiri setiap halaman dashboard toko dibuka atau dimuat ulang
  selama pemicu LN1a berlaku; ditambah banner di dashboard outlet dan
  pesan di Buat Penjualan, pajak per produk, dan diskon per produk. Toko
  yang setupnya selesai tidak dikembalikan ke wizard.

### Lonceng untuk seluruh toko (25 November 2026)

Diputuskan pemilik proyek lewat dialog: lonceng diberdayakan maksimal,
agar klien tahu informasi terbaru dan penting lewat pemberitahuan, bukan
hanya stok. Backend tidak punya sistem notifikasi, sehingga setiap
pemberitahuan dibentuk web dari endpoint yang ada, dan hanya tampil bagi
pemegang izin endpoint serta plan fiturnya.

- **LN4a: sumber pemberitahuan.** Selain LN1a dan masa langganan (TP8a):
  - Inventaris dan gudang: bahan baku outlet mencapai stok minimum;
    pengajuan stok menunggu persetujuan, dan pengajuan disetujui yang
    siap dibuat surat jalan; surat jalan Dikirim yang menunggu diterima;
    stock opname menunggu ditinjau; stok gudang mencapai minimum (Pro).
  - Operasional: kasir lupa ditutup (sesi kasir terbuka sejak hari
    sebelumnya); setup fitur plan belum selesai (sejak PW19 menjadi
    langkah kartu kesiapan toko, KS6a); perangkat aplikasi
    menunggu izin (menunggu backend, LN8a); booking yang jamnya lewat
    tetapi belum lunas.
  - Staf: izin, sakit, atau cuti yang menunggu persetujuan (tanpa
    tautan, ditinjau lewat aplikasi, karena web tidak punya halaman izin
    cuti); staf terlambat atau belum absen padahal jadwalnya sudah mulai
    hari ini; jadwal shift minggu depan belum ada sama sekali (mulai Kamis
    minggu berjalan); pengajuan stok milik pengguna yang disetujui atau
    ditolak dalam 24 jam terakhir.
  - Penjualan dan pelanggan: penjualan belum lunas atau lunas sebagian;
    membership pelanggan yang kedaluwarsa dalam 7 hari; diskon Aktif
    yang berakhir dalam 3 hari atau sudah lewat.
- **LN5a: berbasis kondisi.** Tidak ada status dibaca: pemberitahuan ada
  selama kondisinya berlaku dan hilang sendiri saat beres. Lencana
  lonceng menampilkan jumlah dan warna tingkat tertinggi.
- **LN6a: penyegaran.** Dimuat saat halaman dashboard dibuka atau
  dimuat ulang, saat panel lonceng dibuka, saat tab kembali terlihat, dan
  berkala tiap 5 menit selama tab aktif.
- **LN7a: strategi permintaan.** Pengajuan, surat jalan, bahan baku
  minimum outlet, produk minimum, dan stok gudang dibaca dari
  `GET /dashboard/outlet` dan `GET /dashboard/gudang`. Sumber lain
  memakai endpoint daftarnya dengan limit kecil dan kunci cache sendiri,
  dan penunggu spec yang terdampak diberi syarat query.
- **LN8a: produk yang dapat dijual.** (Selesai: sejak PW07 dari ringkasan,
  LN22a; perangkat menunggu izin sejak PW08, LN23a.) Lonceng memuat seluruh produk
  (`GET /produk` tanpa paginasi, satu-satunya yang mengisi stok
  terhitung produk beresep; kunci cache sendiri) dan menghitung sendiri
  LN1a. Hitungan itu dilaporkan ke backend agar masuk ringkasan
  dashboard, lalu web pindah ke ringkasan. Perangkat menunggu izin juga
  dilaporkan, karena belum ada daftar perangkat pending se-toko; web
  menunggu.
- **LN9a: penjualan belum lunas bertaut ke daftar yang tersaring.**
  Daftar penjualan membaca `?statusBayar=` dari URL dan mengisi panel
  filternya (cakupan baru di modul penjualan).
- **LN10a: membership berakhir bertaut ke halaman Membership**
  (`/dashboard/outlet/membership`), menggantikan teks "halaman
  pelanggan" di opsi LN4a.
- **LN11a: tiga tingkat.**
  - Penting (rose): tidak ada produk atau tidak ada yang dapat dijual,
    masa tenggang langganan, kasir lupa ditutup.
  - Perlu tindakan (karamel): stok minimum produk, bahan, dan gudang;
    langganan hampir habis; pengajuan menunggu persetujuan; opname
    menunggu ditinjau; izin dan cuti diajukan; perangkat menunggu izin;
    kehadiran hari ini; jadwal minggu depan; booking lewat belum
    dibayar; penjualan belum lunas.
  - Info (navy): surat jalan menunggu diterima, pengajuan siap surat
    jalan, setup fitur, hasil pengajuan saya, membership dan diskon
    berakhir.
  - Sejak PW19 kartu tidak ada produk dan setup fitur menjadi langkah
    kartu kesiapan toko, dengan tingkat yang sama (KS7a).
- **LN12a: panel berupa daftar per tingkat.** Lencana angka di lonceng
  (9+ bila lebih) berwarna tingkat tertinggi, menggantikan titik. Panel:
  judul dan jumlah, lalu kartu ringkas diurutkan per tingkat (ikon,
  judul, kalimat dengan angka, tautan aksi bila berizin), bergulir
  maksimal 70% tinggi layar. Kartu langganan tetap dengan bilah masa
  berlaku.

### Rincian penerapan stok (25 November 2026)

Diputuskan pemilik proyek lewat dialog saat menerapkan LN1a sampai
LN3a:

- **LN13a: panel terbuka sendiri hanya di beranda dashboard outlet**
  (`/dashboard/outlet`), setiap dibuka atau dimuat ulang selama pemicu
  LN1a berlaku; di halaman lain lencana rose tetap terlihat. Ditunda bila
  tur panduan dashboard belum pernah tampil, agar tidak bertumpuk. Sejak
  PW19 dibaca dari pemicu LN1a langsung, bukan id kartu, karena toko tanpa
  produk tampil sebagai kartu kesiapan toko (KS5a).
- **LN14a (digantikan LN22a, 27 November 2026): satu produk berstok langsung ke Ubah Produk, lebih dari satu
  ke daftar Produk** ("Lihat produk"). Kartu menyebut jumlah dan sampai
  tiga nama produk.
- **LN15a: pesan halaman sama dengan kartu lonceng**: kotak rose berisi
  judul, kalimat, dan tautan aksi yang sama (tautan hanya bagi pemegang
  izin); halaman tetap dapat dipakai.

### Rincian penerapan inventaris dan gudang (25 November 2026)

Diputuskan pemilik proyek lewat dialog saat menerapkan sumber inventaris
dan gudang LN4a:

- **LN16a: tab Stok Kritis lewat URL di tiga halaman.** Stok outlet,
  Inventaris gudang, dan daftar Produk membaca `?tab=stok-kritis`
  (`features/inventaris/tab-stok.ts`, `lib/tab-url.ts`), sehingga ketiga
  pemberitahuan stok minimum membuka daftar yang langsung tersaring.
- **LN17a: pengguna gudang saja memakai ringkasan gudang.** Pemegang izin
  dashboard outlet memakai ringkasan outlet (lengkap per arah); yang
  hanya memegang izin dashboard gudang memakai `GET /dashboard/gudang`:
  menunggu persetujuan dan siap surat jalan per arah tampil, tetapi
  pengembalian yang menunggu diterima di gudang belum, karena
  `transfer.sedangDikirim` gudang menggabungkan kedua arah. Dilaporkan ke
  backend. Sejak 26 November 2026 (backend `6478d29`, B382; PW06,
  `efb5596`) ringkasan gudang mengirim `transfer.perArah`, sehingga
  pengembalian yang menunggu diterima di gudang tampil bagi pemegang izin
  terima; penerimaan di outlet tetap hanya dari ringkasan outlet (LN21a).
  Buktinya unit test saja, atas pilihan pemilik proyek 26 November 2026:
  data development tidak punya surat jalan pengembalian yang sedang
  dikirim, dan peran uji gudang saja tidak memegang izin terima.

### Rincian penerapan penjualan (25 November 2026)

- **LN18a: saringan URL penjualan memakai isian Status yang sudah ada.**
  `?status=belum-bayar` dan `?status=sebagian` mengisi isian Status panel
  filter (statusPenjualan UNPAID dan PARTIAL, sama dengan belum lunas dan
  lunas sebagian, tanpa Draft), menggantikan nama parameter
  `?statusBayar=` di LN9a, karena panel tidak punya isian status bayar dan
  backend hanya menerima satu nilai per saringan. Kartu lonceng menyebut
  kedua jumlah dan punya dua tautan, "Belum bayar" dan "Sebagian"
  (pemilik proyek, 25 November 2026).

### Panel ringkas (25 November 2026)

- **LN19a: panel menampilkan yang terpenting dulu, sisanya dibentangkan di
  panel.** Seluruh kartu penting selalu tampil, lalu kartu berikutnya
  menurut urutan tingkat sampai total lima (`ringkasPanel`, `BATAS_PANEL`).
  Bila ada sisa, tombol "Lihat semua (N lainnya)" membentangkan sisa kartu
  di panel yang sama, yang tetap bergulir paling tinggi 70% layar (LN12a).
  Pemilik proyek sempat memilih halaman Pemberitahuan tersendiri, melihat
  kanvas tiga arahnya, lalu membatalkannya dan memilih bentangan di panel
  (pemilik proyek, 25 November 2026). Panel yang ditutup, termasuk lewat
  tautan kartu, kembali ringkas saat dibuka lagi; ini rincian penerapan,
  bukan bagian teks opsi.
- **LN20a: sumber lonceng mengikuti lokasi kerja staf** (pemilik proyek,
  25 November 2026; diterapkan 26 November 2026). Staf berlokasi kerja
  Gudang hanya memuat sumber gudang dan tingkat toko (stok dan opname
  gudang, pengajuan, surat jalan, izin cuti, langganan, setup, hasil
  pengajuan saya); sumber outlet (stok produk dan bahan outlet, ringkasan
  outlet, penjualan, booking, sesi kasir, kehadiran dan jadwal outlet,
  membership, diskon, opname outlet) tidak dimuat. Staf berlokasi kerja
  Outlet tidak memuat sumber gudang (ringkasan gudang, lokasi dan stok
  gudang, opname gudang). Owner, pemegang `akses-lintas-outlet`, dan staf
  tanpa lokasi kerja tidak berubah. Penerapan: `features/notifikasi/ruang.ts`
  (`muatRuang`, `ringkasanDimuat`) dipasang di setiap `enabled`
  `features/notifikasi/hooks.ts`, membaca `useRuangLokasiKerja` (sama dengan
  gerbang ruang LK3a). Sumber outlet dan gudang menunggu detail diri
  (`siap`); sumber toko tidak menunggu. Staf gudang yang memegang izin
  dashboard outlet beralih ke ringkasan gudang (perluasan LN17a), sehingga
  pengajuan dan surat jalan tetap terbaca, dengan batas LN17a yang sama:
  pengembalian yang menunggu diterima di gudang belum tampil (berakhir
  dengan B382, PW06). Bukti:
  sebelumnya lonceng di ruang gudang meminta 11 sumber outlet dan
  `GET /absensi/monitoring` dijawab 403; kini
  `auth/ruang-lokasi-kerja.spec.ts` (test LN20a) menegaskan tidak ada
  permintaan sumber outlet maupun 403, dan unit
  `tests/unit/features/notifikasi/ruang.test.ts`.
- **LN21a: lonceng mengikuti ruang yang dapat dimasuki** (pemilik proyek,
  26 November 2026: "notifikasi outlet tidak akan muncul untuk staff gudang
  atau yang ga punya izin akses ke outlet, begitu juga sebaliknya").
  Perluasan LN20a: akses ruang kini izin dashboard ruang ditambah lokasi
  kerja, satu pintu `aksesRuang` (`features/pengguna/lokasi-kerja.ts`) yang
  juga dipakai pemilih ruang sidebar. Dua lapis penyaring:
  1. Sumber outlet dan gudang dimuat hanya bila ruangnya dapat dimasuki
     (`muatRuang`); langganan dan hasil pengajuan saya kini tergolong
     sumber outlet, karena halaman tindakannya berada di ruang outlet.
     Pengecualian: daftar produk tetap disaring lokasi kerja saja, karena
     juga dipakai pesan halaman LN3a yang terbuka tanpa izin dashboard
     outlet.
  2. Setiap kartu disaring menurut ruang tujuannya (`RUANG_KARTU`,
     `saringKartuRuang` di `features/notifikasi/ruang.ts`), termasuk kartu
     gudang yang datang dari ringkasan outlet. Kartu yang belum tercantum
     disembunyikan; unit test memastikan setiap id kartu di berkas
     `sumber-*` dan `kesiapan.ts` tercantum. Kartu tingkat toko (izin
     cuti, kesiapan toko) tetap tampil bagi siapa pun yang memenuhi
     syaratnya.
  Bukti: `tests/unit/features/notifikasi/ruang.test.ts` dan
  `auth/ruang-lokasi-kerja.spec.ts` (test LN20a, LN21a: lonceng di ruang
  gudang tidak meminta `akun/langganan` maupun pengajuan disetujui).

### Pemicu stok dari ringkasan (27 November 2026)

Diputuskan pemilik proyek lewat dialog PW07, sesudah backend B380:

- **LN22a: pemicu LN1a dari ringkasan, kartu berupa angka.** Lonceng tidak
  lagi memuat seluruh produk; pemicu dibaca dari `produk.total` dan
  `produk.dapatDijual` `GET /dashboard/outlet`. Kartu tidak ada yang dapat
  dijual berjudul "Tidak ada produk yang dapat dijual" dengan isi "N produk
  stoknya habis." (N jumlah produk, tanpa menyebut nama satu per satu) dan
  tautan Lihat produk serta Pembelian Stok bagi pemegang izinnya.
  Menggantikan pemisahan berstok langsung dan beresep LN2a untuk kartu
  ini, sebutan tiga nama dan tautan Ubah Produk satu produk LN14a, dan
  Pengajuan ke Gudang di kartu ini. Kartu Toko belum punya produk tetap
  (sejak PW19 menjadi langkah kartu kesiapan toko, KS5a; pesan halaman
  LN3a tidak berubah).
  Banner dan pesan halaman (LN3a, LN15a) memakai sumber yang sama. Soal
  izin gugur: seluruh laman pemakai pesan stok berada di ruang outlet yang
  menuntut izin dashboard outlet (`b9fe4a0`).

### Perangkat menunggu izin (27 November 2026)

Diputuskan pemilik proyek lewat dialog PW08, sesudah backend B381:

- **LN23a: kartu perangkat menunggu izin tanpa tautan, disetujui lewat
  aplikasi**, seperti kartu izin cuti, karena web tidak punya laman
  perangkat. Isinya angka dan nama pengguna: "N perangkat menunggu izin
  (Sari, Budi, dan 1 lainnya). Setujui lewat aplikasi." Tingkat Perlu
  tindakan (LN11a), tingkat toko, hanya bagi pemegang `update-pengguna`;
  sumbernya `GET /device?status=pending`, disaring level peminta (P39).
  Satu pengguna dengan beberapa perangkat disebut sekali (`9b6c133`).

### Kesiapan toko (27 November 2026)

Diputuskan pemilik proyek lewat dialog PW19, dari laporannya: akun baru
mendapat "Jadwal minggu depan belum dibuat" padahal toko baru punya Owner
saja dan belum punya shift, lalu diarahkan ke Generate Jadwal. Lonceng
untuk toko yang belum siap beroperasi mendahulukan setup sampai siap
(`features/notifikasi/kesiapan.ts`, `kotak-kesiapan.tsx`, `f606985`).

- **KS1a: urutan bidang** produk, karyawan, absensi, lalu fitur plan
  (sesi booking, gudang). Karyawan (opsional, role lalu pengguna) dan
  absensi (hanya bila ada staf: shift, pola roster, jadwal) diisi PW18;
  wizard sudah menjamin pajak, jam buka, kategori, dan bahan beresep.
  Aplikasi kasir tidak masuk; perangkat menunggu izin punya kartunya.
- **KS2a: kartu kesiapan paling atas, pengingat yang bergantung
  ditahan.** Kartu tampil di atas tingkat Penting dan selalu tampil di
  panel ringkas (`utama`, `ringkasPanel`); pemberitahuan lain tetap tampil
  di bawahnya menurut tingkatnya.
- **KS3a: satu kartu, langkah berikutnya.** "Siapkan toko (langkah k dari
  N)" menyebut langkah pertama yang belum selesai, penjelasannya, dan
  langkah belum selesai sesudahnya ("Sesudahnya: ..."), dengan tautan ke
  halamannya bagi pemegang izin. Halaman tujuan menampilkan kotak yang
  sama (seperti LN15a); kartu berganti sendiri saat langkah selesai.
- **KS4a: dihitung terus dari data** seperti LN5a, tanpa penyimpanan;
  toko lama yang datanya lengkap langsung siap, dan langkah yang datanya
  dihapus muncul lagi. Langkah yang datanya belum diketahui tidak
  dihitung.
- **KS5a: langkah produk cukup toko punya produk**, menggantikan kartu
  Toko belum punya produk. Kehabisan stok tetap kartu operasional Penting
  LN22a, agar toko yang berjalan tidak kembali ke mode setup; stok awal
  bahan dan produk berstok dijamin wizard (SA9a).
- **KS6a: langkah fitur plan menggantikan kartu Info setup fitur**
  (`fiturSetupPengguna`, aturan izin yang sama dengan `fiturPerluSetup`);
  banner dashboard setup fitur tetap.
- **KS7a: tingkat kartu ikut langkah yang tampil**: produk Penting,
  fitur plan Info, sama dengan kartu yang digantikan; warna lencana tetap
  tingkat tertinggi (`tingkatTertinggi` tidak lagi bergantung urutan).
- **KS8a: penahan pengingat absensi.** Jadwal minggu depan dan kehadiran
  hari ini ditahan selama belum ada staf selain Owner, belum ada shift
  aktif, atau belum ada pola roster di outlet (`tahanPengingatAbsensi`).
  Jadwal tidak menjadi syarat, karena pengingat itulah yang mengajak
  membuatnya. Tanpa izin baca pengguna, shift, atau pola roster, penahan
  tidak berlaku.
- **KS9a: kotak langkah di Buat Produk dan wizard Setup**
  (`KotakKesiapan`), di atas isinya, dan hilang sendiri saat langkahnya
  selesai. Pesan stok produk LN3a di empat halaman tidak berubah.

Rincian penerapan, bukan bagian teks opsi (dapat dibatalkan pemilik
proyek):

- Penahan KS8a: selama data pengguna, shift, dan pola masih dimuat,
  pengingat ikut ditahan agar tidak muncul lalu hilang; bila salah satu
  permintaannya gagal, penahan tidak berlaku; syarat berizin juga menuntut
  `read-location`, karena outlet dibaca dari `/location/current`. Staf
  selain Owner dihitung dari pengguna lebih dari satu, karena backend
  menolak membuat pengguna berrole setingkat pembuatnya.
- Kotak KS9a: tautan yang menuju halaman itu sendiri tidak ditampilkan;
  di Buat Produk hanya saat membuat (bukan Ubah Produk); di wizard Setup
  hanya di langkah wizard yang sama dengan langkah kesiapan (Sesi booking
  untuk Setup Sesi Booking, Gudang untuk Setup Gudang), tidak selagi
  setup inti berjalan.
- Panel terbuka sendiri LN13a membaca pemicu LN1a langsung.

### Karyawan dan absensi di kesiapan toko (27 November 2026)

Diputuskan pemilik proyek lewat dialog PW18 (`041238b`), mengisi slot
karyawan dan absensi KS1a. Ruang gudang menjadi PW20.

- **KS10a: langkah karyawan opsional, dengan "Toko ini hanya saya".**
  Buat posisi lalu Tambah karyawan, bertingkat Info. Kartu dan kotak
  langkahnya membawa tombol "Toko ini hanya saya" yang melewati langkah
  karyawan dan absensi, disimpan per perangkat di localStorage karena
  backend tidak punya tempatnya; perangkat lain bertanya lagi sekali.
  Begitu ada staf, langkah absensi muncul walau pernah dilewati.
- **KS11a: langkah absensi hanya bila ada staf**: Buat Master Shift, Buat
  Pola Roster, lalu Generate jadwal. Langkah jadwal selesai bila ada
  jadwal outlet dalam 62 hari terakhir sampai akhir minggu depan (batas
  rentang backend), sehingga toko berjalan tidak kembali ke mode setup;
  selanjutnya pengingat Jadwal minggu depan yang mengingatkan. Selama
  langkah jadwal berjalan, pengingat itu tidak tampil agar tidak dobel.
- **KS12a: catatan syarat bertaut di outlet dan gudang**: dialog Tambah
  Pengguna tanpa posisi ("Buat posisi dulu"), dialog Pola Roster tanpa
  shift aktif ("Buat shift dulu", dan Simpan dimatikan agar tidak
  tersimpan pola libur semua seperti "reguler 5-2"), Generate Jadwal tanpa
  pola atau tanpa staf. Titik tur dashboard "Atur jadwal kerja" menyebut
  urutan: karyawan, shift, pola roster, generate jadwal.
- **KS13a: kotak langkah** dipasang di Posisi, Pengguna, Master Shift,
  Pola Roster, dan Generate Jadwal (`CatatanSyarat` di
  `components/catatan-syarat.tsx` untuk KS12a).

Rincian penerapan, bukan bagian teks opsi (dapat dibatalkan pemilik
proyek):

- Langkah absensi bertingkat Perlu tindakan; posisi dihitung dari role
  berlevel di bawah 100 (Owner berlevel 100); data yang belum termuat
  atau tidak berizin tidak dihitung (KS4a).
- Kunci "Toko ini hanya saya" per akun (`hanya-owner.ts`), sehingga akun
  lain di perangkat yang sama tidak mewarisinya (keputusan rancangan
  butir 33); kartu lonceng dan kotak berbagi nilainya lewat satu
  peristiwa di tab yang sama.
- Kotak langkah karyawan dan absensi hanya di halaman ruang outlet, karena
  langkahnya dihitung dari outlet; catatan syarat KS12a di kedua ruang.
- Staf di Generate Jadwal dihitung dari daftar karyawan ruang lebih dari
  satu, karena daftar itu selalu memuat Owner.

## Catatan

- Lonceng ada di setiap halaman dashboard, sehingga setiap sumber hanya
  meminta data bila izin, plan, dan setup fiturnya terpenuhi. 403 izin
  tidak mengalihkan ke login (`lib/apiClient.ts` hanya mengalihkan untuk
  akun dinonaktifkan atau dibekukan), tetapi permintaan yang pasti
  ditolak tetap tidak dikirim.
- Panel yang terbuka sendiri (LN3a) dimatikan di e2e lewat
  `storageState`, seperti tur sorotan (keputusan rancangan butir 32);
  hanya spec lonceng yang menyalakannya.

- Tahap 1 (25 November 2026): mesin lonceng, langganan, LN1a sampai
  LN3a, dan LN13a sampai LN15a. Produk minimum dibaca dari
  `GET /dashboard/outlet` (`produk.stokKritis`), sehingga lonceng sudah
  memakai ringkasan itu sejak tahap 1. Membuka panel menyegarkan setiap
  sumber yang sudah pernah dimuat.
- Tahap 2 (25 November 2026): sumber inventaris dan gudang
  (`sumber-inventaris.ts`). Setiap kartu hanya tampil bila ada yang
  perlu dikerjakan dan pengguna memegang izin aksinya (setujui pengajuan,
  buat surat jalan, terima surat jalan, tinjau opname). Stok gudang
  minimum dihitung dari `GET /inventory?locationID=<gudang>&stokKritis=true`,
  bukan dari ringkasan gudang, karena `inventory.stokKritis` ringkasan
  gudang dihitung se-tenant bagi Owner (`types/dashboardGudang.ts`).
  Opname menunggu ditinjau dari `GET /stockopname?status=SUBMITTED` per
  `tipeLokasi`. Daftar opname dan penerimaan belum punya tab URL, sehingga
  tautannya ke halaman daftar.
- Tahap 3 sampai 5 (25 November 2026): `sumber-operasional.ts` (kasir
  lupa ditutup dari sesi BUKA yang dibuka sebelum hari ini; setup fitur
  dari `fiturPerluSetup`, sama dengan banner dashboard, sejak PW19 di
  `kesiapan.ts`; booking hari ini
  yang lewat jam dan belum lunas, paling banyak tiga tautan detail
  penjualan), `sumber-staf.ts` (izin cuti berstatus diajukan tanpa
  tautan; kehadiran dari monitoring absensi dicocokkan dengan jadwal shift
  hari ini, karena monitoring juga memuat staf tanpa jadwal; jadwal
  minggu depan Senin sampai Minggu, dicek Kamis sampai Minggu; pengajuan
  milik pengguna yang diputuskan dalam 24 jam, dari 20 pengajuan terbaru),
  dan `sumber-penjualan.ts` (jumlah UNPAID dan PARTIAL lewat `limit=1`;
  membership Aktif yang kedaluwarsa dalam 7 hari; diskon Aktif yang
  berakhir dalam 3 hari atau sudah lewat). Tautan kehadiran ke
  `/dashboard/outlet#status-staf` (jangkar di panel Status Staf).
- Kunci cache sumber lonceng berada di bawah akar domainnya
  (`queryKeys.notifikasi`), sehingga invalidasi setelah aksi modul ikut
  memperbarui lonceng, tetapi terpisah dari kunci halaman, agar lonceng
  tidak mengisi cache halaman daftar.
- Permintaan lonceng ke endpoint daftar dikenali spec lewat
  `tests/helpers/lonceng-uji.ts` (`dariLonceng`), dan penunggu daftar yang
  tidak bersyarat query memakainya (LN7a). Penanda query `lonceng=1`
  ditolak backend di `/sesikasir`, `/sesibooking`, dan `/izincuti`
  (parameter tidak dikenal), sehingga tidak dipakai.
- Pesan stok di diskon per produk tampil di bagian Produk Tertentu
  (cakupan Item), dan di pajak per produk di atas pemilih produk.

## Utang terbuka

- Seluruh sumber LN4a terpasang sejak PW08 (27 November 2026); tidak ada
  kelompok sumber yang tertunda.
- Sumber yang datanya hanya dibuat aplikasi atau bergantung hari (kasir
  lupa ditutup, kehadiran, jadwal minggu depan, izin cuti diajukan, hasil
  pengajuan dalam 24 jam, booking lewat jam) hanya teruji di unit test;
  e2e lonceng membuktikan jumlah lencana sama dengan kartu dan urutan per
  tingkat terhadap data nyata (`referensi/utang-pengujian.md`).
- Akun uji utama tidak punya pemberitahuan per 25 November 2026, sehingga
  skenario data nyata `dashboard/lonceng-pemberitahuan` hanya membuktikan
  keadaan kosong; keadaan berisi dibuktikan akun klien sekali pakai tanpa
  produk dan unit test per sumber.
