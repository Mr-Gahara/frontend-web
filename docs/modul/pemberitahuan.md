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
    sebelumnya); setup fitur plan belum selesai; perangkat aplikasi
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
- **LN8a: produk yang dapat dijual.** Lonceng memuat seluruh produk
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
  tur panduan dashboard belum pernah tampil, agar tidak bertumpuk.
- **LN14a: satu produk berstok langsung ke Ubah Produk, lebih dari satu
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
  backend.

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
  dari `fiturPerluSetup`, sama dengan banner dashboard; booking hari ini
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

- Pengerjaan bertahap per kelompok sumber; daftar yang belum selesai ada
  di `inti/status.md` (Mulai di sini).
- Sumber yang datanya hanya dibuat aplikasi atau bergantung hari (kasir
  lupa ditutup, kehadiran, jadwal minggu depan, izin cuti diajukan, hasil
  pengajuan dalam 24 jam, booking lewat jam) hanya teruji di unit test;
  e2e lonceng membuktikan jumlah lencana sama dengan kartu dan urutan per
  tingkat terhadap data nyata (`referensi/utang-pengujian.md`).
- Akun uji utama tidak punya pemberitahuan per 25 November 2026, sehingga
  skenario data nyata `dashboard/lonceng-pemberitahuan` hanya membuktikan
  keadaan kosong; keadaan berisi dibuktikan akun klien sekali pakai tanpa
  produk dan unit test per sumber.
