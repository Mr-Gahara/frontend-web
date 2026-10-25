# Modul Gudang

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul gudang

Diputuskan pemilik proyek pada 29 September 2026, dengan prinsip
keputusan rancangan butir 17 dan 21.

- **GD1a: dashboard gudang memakai sumber data gabungan.** Hitungan
  pengajuan (menunggu persetujuan; siap dibuat surat jalan) dan surat
  jalan (PENDING; sedang dikirim) diambil dari `GET /dashboard/gudang`,
  sedangkan stok kritis dan jurnal terbaru dari hook `features/` yang
  hanya menghitung lokasi Gudang, karena endpoint itu menghitung seluruh
  lokasi tenant termasuk outlet (Model bisnis MVP: stok outlet dan gudang
  tidak boleh tercampur). Eksekusinya sempat ditunda sampai pemilik
  proyek menentukan layout dan UI/UX-nya, lalu dijalankan pada 19 Oktober
  2026 dengan penyesuaian sumber data kartu pengajuan (Dashboard gudang di
  bawah). Sejak `74b6af4` kartu pengajuan kembali memakai
  `GET /dashboard/gudang`.
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
  (`inti/pengujian.md`, Utang pengujian).
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

### Dashboard gudang

Diputuskan pemilik proyek pada 19 Oktober 2026.

- **Isi: GD1a ditambah daftar stok kritis.** Dari empat pratinjau (satu
  mengikuti pola dashboard outlet, tiga alternatif), dipilih desain B
  "Alur barang": dua kelompok kartu berlatar krem (Pengajuan dari outlet;
  Pengiriman ke outlet) yang dihubungkan panah, stok kritis sebagai
  batang isi, dan jurnal terbaru sebagai linimasa.
- **Bahasa awam di setiap kartu.** Label "Langkah 1 sampai 4" di pratinjau
  pertama dibuang karena tidak dipahami pengguna. Setiap kartu menyebut
  arti angkanya ("pengajuan perlu disetujui") dan tindakannya ("Periksa
  dan setujui"); kartu bernilai nol berisi kalimat keadaan tanpa tautan.
- **Kartu pengajuan dihitung dari daftar pengajuan, bukan dari
  `GET /dashboard/gudang`.** Hitungan `siapDibuatSuratJalan` di backend
  ikut menghitung pengajuan yang sudah punya surat jalan
  (`kontrak/temuan.md` butir 149), sehingga angkanya tidak akan sama
  dengan isi tab tujuannya. `hitungAntreanPengajuan` memakai
  `saringPengajuan` dan `cocokTab` yang sama dengan daftar gudang.
  Dibalik di `74b6af4` setelah B101 terbukti (pemilik proyek, 21 Oktober
  2026): kartu memakai `pengajuan` dari ringkasan yang sama dengan kartu
  surat jalan (`antreanDariRingkasan`), satu permintaan untuk kedua
  kelompok, dan aksi pengajuan ikut menginvalidasi kuncinya. Server
  menghitung kedua arah pengajuan (P8), sehingga angkanya dapat melebihi
  isi tab bila ada pengembalian dari outlet sebelum alur itu didukung
  web.
- **Kartu surat jalan tetap dari `GET /dashboard/gudang`**, karena
  filternya terbukti sama dengan tab DRAFT SJ dan halaman pengiriman
  (`transferStokService.getAll` tidak membatasi per izin atau lokasi),
  dan hitungan server tetap ringan berapa pun jumlah surat jalan.
  Sejak `a972956` tab itu berlabel Belum Dikirim (`modul/inventaris.md`,
  Label tab dan status pengajuan stok serta surat jalan).
- **Panel mengikuti izin endpoint-nya**
  (`features/dashboard-gudang/izin.ts`): pengajuan butuh
  `read-pengajuan-stok`, pengiriman `read-dashboard-gudang`, stok kritis
  `read-location` ditambah `read-inventory` atau `read-inventory-gudang`,
  dan jurnal `read-jurnal-stok`. Kelompok pengajuan disembunyikan, bukan
  ditampilkan tanpa angka, bagi pengguna tanpa izin bacanya. Tanpa satu
  pun panel, halaman menampilkan "Belum ada ringkasan untuk akun Anda".
  Sejak 21 Oktober 2026 kelompok pengajuan juga menuntut
  `read-dashboard-gudang` (endpoint angkanya), dan jurnal juga menuntut
  `read-location` (`029413d`), karena panelnya mencari lokasi gudang.
- **Tautan kartu hanya aktif bila gerbang halaman tujuannya terpenuhi**
  (`urlBoleh` lewat `bolehBukaRute`); tanpa izin, kartu tampil tanpa
  tautan.

## Catatan

### Catatan dari modul Gudang

Modul Gudang selesai pada 30 September 2026, kecuali dashboard gudang
yang eksekusinya ditunda (keputusan GD1a): spec pembanding (`2d7225b`),
layout, setup, dan lokasi sidebar (`9ce288b`), serta pengaturan gudang
(`319bd99`). Tidak ada lagi halaman ruang gudang yang memakai
`apiClient`, dan `LokasiListResponse` sudah dihapus.

- Lapisan data lokasi tetap satu, di `features/inventaris`: api dan hook
  buat serta perbarui lokasi, `akses-gudang.ts` untuk keputusan layout,
  `schema-lokasi.ts` untuk form, dan `IsianLokasi` untuk isian yang
  dipakai setup dan pengaturan. Sidebar dan layout gudang berbagi cache
  `lokasi.daftar()` (keputusan rancangan butir 12).
- Layout tidak lagi mengalihkan setiap galat ke `/dashboard`, sehingga
  pengalihan berputar bagi pengguna yang hanya punya ruang gudang hilang
  (GD4a). Jalur selain Owner hanya teruji di unit test.
- Setup yang berhasil tidak diuji e2e, karena tenant uji sudah punya
  gudang (GD6a). Pengaturan diuji dengan mengubah nama "Gudang A"
  sungguhan lalu mengembalikannya.
- Kontrak lokasi dikoreksi terhadap backend `00b9957`: `POST /location`
  dan `PUT /location/:id` di `payload.md`, serta urutan `GET /location`
  di `endpoint.md`. Temuan dashboard gudang dan outlet tercatat di
  `kontrak/temuan.md` butir 74 dan sudah dilaporkan.
- Keputusan pemilik proyek untuk modul ini ada di `modul/gudang.md` (Modul
  gudang, GD1a sampai GD6a).

### Catatan dari dashboard gudang

Dashboard gudang selesai pada 19 Oktober 2026 dalam dua commit, setelah
tiga commit penyiapan: perbaikan pengajuan PENDING (`781c861`), font
Geist (`cdc8c47`), dan tab di `?tab=` (`a68a75f`).

- `06581f3`: lapisan data dan aturan murni (`api.ts`, `hooks.ts`,
  `izin.ts`, `ringkasan.ts`), `EP.dashboardGudang`, dan kunci
  `queryKeys.transferStok.ringkasanGudang()` di bawah akar
  `transferStok`, sehingga invalidasi setelah buat, kirim, atau batal
  surat jalan ikut memperbarui angka dashboard.
- `50dca2f`: tampilan desain B (`panel-alur.tsx`,
  `panel-stok-kritis.tsx`, `panel-jurnal.tsx`, `pesan-gagal.tsx`,
  `halaman-dashboard-gudang.tsx`). Setiap panel memuat sendiri, dengan
  kerangka saat memuat dan pesan galat `role=alert` beserta Coba lagi;
  setiap kelompok adalah region bernama. Teks aksi memakai `amber-800`,
  bukan heksadesimal cokelat pratinjau, agar tidak menambah warna
  hardcoded.
- Stok kritis memakai `isStokKritis` dari backend, tidak dihitung ulang,
  untuk lokasi Gudang pertama (MVP satu gudang); jurnal disaring ke
  lokasi bertipe Gudang lewat `saringJurnal`. Sejak `081d5dc` jurnal
  diminta lima baris dari lokasi Gudang pertama, dan
  `jurnalTerbaruGudang` tinggal penjaga tipe lokasi dan urutan.
- Tes: 14 unit di `tests/unit/features/dashboard-gudang/`, dan 4
  skenario e2e di `tests/e2e/dashboard/dashboard-gudang.spec.ts` yang
  mencocokkan angka dengan respons memakai aturan halaman tujuan, lalu
  mengklik kartu dan mencocokkan jumlah baris tab tujuan.
- Temuan backend baru: butir 149, dilaporkan ke Yoga 19 Oktober 2026
  (`arsip/laporan-backend.md`). Dokumen endpoint dashboard di backend
  masih kerangka yang ditandai pemiliknya sendiri, sehingga tidak
  dilaporkan.

## Utang terbuka

### Utang kecil dari modul Gudang

- Dashboard gudang selesai di `06581f3` dan `50dca2f`. Setelah backend
  memperbaiki butir 149, kartu pengajuan dapat kembali memakai angka
  `GET /dashboard/gudang`, sehingga daftar pengajuan tidak perlu diambil
  utuh hanya untuk menghitung. Selesai di `74b6af4`.
- Dashboard outlet selesai di `0c5822b` (keputusan DB1a sampai DB6a).
  `GET /dashboard/outlet` tetap tidak dipakai web: isinya hitungan
  pengajuan, surat jalan, dan lima jurnal terbaru, bukan isi dashboard
  yang diputuskan pemilik proyek.
