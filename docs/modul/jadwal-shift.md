# Modul Jadwal dan Shift

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

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
  diganti di `modul/jadwal-shift.md`. Generate jadwal belum punya entri, dan
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
  disampaikan. Konstanta diisi `"locationID"` di `8b5ad0f` (B168).
  Konstanta dan keterangan pemakaian bersama dibuang di `7f6d623`,
  karena backend mewajibkan `locationID`.
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
  berbeda. Konstanta diisi `"locationID"` di `8b5ad0f` (B168).
  Konstanta dan keterangan pemakaian bersama dibuang di `7f6d623`,
  karena backend mewajibkan `locationID`.
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
  Digantikan monitoring per lokasi ruang di `44a81d0` (B183, keputusan
  di bawah).
- **AB5a: widget menampilkan yang sedang bekerja dan yang sudah absen.**
  Angka besar adalah staf yang sedang bekerja, dengan baris jumlah staf
  yang sudah absen hari ini; teks kosong dibedakan antara belum ada yang
  absen dan tidak ada yang sedang bekerja.
- Diterapkan tanpa ditanyakan (`845c2cf`): nama peran dari satu fungsi
  `namaPeran` di `features/pengguna`, dipakai tabel pengguna, kalender
  jadwal, dan widget (keputusan rancangan butir 12); jam masuk dalam zona
  `Asia/Jakarta` agar label WIB selalu benar; log debug dibuang.

### Penyesuaian backend `ridho` `0024eb9`

Diputuskan pemilik proyek pada 30 dan 31 Oktober 2026
(`referensi/keputusan-penyesuaian-backend.md`).

- **Gerbang SDM mengikuti izin baru** (`90537c7`, B139, B140): shift
  `read-location` dan `read-shift`; pola roster ditambah
  `read-pola-roster`; kalender `read-location`, `read-pengguna`,
  `read-jadwal-shift`, dan `read-shift`; generate `read-location`,
  `read-pengguna`, `read-shift`, `read-pola-roster`, dan
  `create-jadwal-shift`. Aksi per modul di `features/<modul>/izin.ts`
  (`aksiShift`, `aksiPolaRoster`, `aksiJadwal`): menonaktifkan shift
  memakai `DELETE`, sel kalender berisi menuntut `update-`, sel kosong
  `create-`, dan menu titik tiga tidak dipasang tanpa aksi.
- **Templat role SDM**: Manajer dan General Manajer memegang ke-12 izin,
  Supervisor hanya `read-shift`, `read-pola-roster`, dan
  `read-jadwal-shift`.
- **Monitoring absensi per lokasi ruang** (`44a81d0`, B183),
  menggantikan AB4a. Widget dan panel Status Staf mengirim `locationID`
  dari `useLokasiRuang`, sumber yang sama dengan shift. Staf yang izin
  disetujui dijadikan libur tanpa shift oleh backend dan tidak dimuat
  monitoring per lokasi, sehingga panel Status Staf menambah karyawan
  ruang outlet menurut peran yang izin hari itu (`kontrak/temuan.md`
  butir 165).
- **Kalender per lokasi ruang dengan penanda lokasi lain** (`b5a2578`,
  B184). Jadwal kerja karyawan ruang di lokasi lain tampil "Lokasi lain"
  sebagai penanda baca-saja; sel yang hanya berisi penanda tidak
  menawarkan buat, karena menjadikan hari itu libur dari ruang ini
  menghapus jadwal lokasi lain (B165). Libur tidak punya lokasi dan tetap
  tampil biasa.
- Diterapkan tanpa ditanyakan: ubah ke libur tanpa langkah hapus
  (`6a344b0`, B165), dan penolakan seluruh jadwal 409 dibentuk ulang
  menjadi hasil biasa (`2319662`, B147).

### Penyesuaian backend `ridho` lokal `916e7df`

Diputuskan pemilik proyek pada 8 November 2026
(`referensi/keputusan-penyesuaian-backend.md`; Model bisnis MVP di
`inti/keputusan-rancangan.md` diperbarui mengikuti P61).

- **LK1a: lokasi kerja diisi di dialog pengguna** (`4fe201b`, B269).
  Dialog tambah dan ubah pengguna menambah pilihan Lokasi Kerja: Tidak
  dibatasi (bawaan), outlet, atau gudang toko, dikirim sebagai
  `locationID`. Tidak tampil untuk role Owner (dikenali dari level).
  Daftar pengguna tidak menambah kolom, dan ruang tidak disesuaikan:
  staf di luar lokasi kerjanya melihat pesan 403 backend. Tanpa
  `read-location` isiannya disembunyikan dan `locationID` tidak dikirim.
  Diterapkan tanpa ditanyakan: `locationID` hanya dikirim bila berubah
  (keputusan rancangan butir 15), dan isiannya terkunci saat mengubah
  diri sendiri seperti role dan status, karena backend mengabaikannya.
- **LK3a: ruang mengikuti lokasi kerja** (pemilik proyek, 10 November
  2026, mengganti bagian "ruang tidak disesuaikan" di LK1a). Bagi staf
  berlokasi kerja tanpa `akses-lintas-outlet`, sidebar, pemilih ruang,
  dan `/dashboard` hanya membuka ruang lokasi kerjanya, dan gerbang rute
  menolak ruang lain. Lokasi kerja dibaca dari detail pengguna sendiri,
  karena token tidak membawanya. Owner, pemegang `akses-lintas-outlet`,
  dan staf tanpa lokasi kerja tidak berubah. Diuji unit dan e2e lewat
  pengguna uji berlokasi kerja baru ("E2E Lokasi Gudang",
  `tests/e2e/auth/ruang-lokasi-kerja.spec.ts`). Dua keputusan lanjutan
  pemilik proyek pada hari yang sama: staf berlokasi kerja tanpa
  `read-location` tidak dibatasi, karena tipe lokasinya tidak dapat
  dibaca (`kontrak/temuan.md` butir 182, diserahkan ke Ridho); dan ruang
  lain ditolak seluruhnya, termasuk halaman tingkat toko seperti produk,
  pajak, dan pengguna, sehingga staf yang mengurus master toko diberi
  `akses-lintas-outlet` atau tanpa lokasi kerja. Penolakannya pesan di
  tempat "Ruang ini di luar lokasi kerja Anda." dari `GerbangRute`, dan
  isi dashboard ditahan sampai lokasi kerja diketahui. Sejak backend
  `4a19be8` (B339) tipe lokasi kerja dibaca dari `lokasiKerja` di detail
  diri, yang terbaca juga tanpa `read-location`, sehingga syarat
  keputusan lanjutan pertama hilang dan staf tanpa izin itu ikut
  dibatasi; daftar lokasi tidak lagi diminta (`8901b20`, pengguna uji
  "E2E Lokasi Gudang Tanpa Lokasi").
- **AB6a: label kedatangan di Status Staf** (`69f2b18`, B276, B278).
  Staf yang sudah absen mendapat label kecil "Terlambat N menit" atau
  "Luar jadwal" dari `sesiTerakhir` monitoring; Tepat Waktu tanpa label.
  Widget absensi halaman pengguna tidak berubah.

### Jam buka toko di shift dan jadwal

Diputuskan pemilik proyek pada 16 November 2026 dari kanvas desain "Jam
Buka di Shift dan Jadwal" (desain A dari tiga, desktop 1280 dan HP 390
px). Hanya ruang outlet, karena jam buka adalah jam toko melayani
pembeli; ruang gudang tidak berubah. Backend hanya memakai
`jamOperasional` untuk booking (P81), sehingga keduanya aturan web.
Fungsinya murni di `features/tenant/jam-operasional.ts`.

- **JO1a: peringatan di form shift.** Shift dibandingkan dengan setiap
  hari Buka; hari 24 jam dan Libur tidak dihitung, dan toko 24 jam atau
  jam belum diatur tidak diberi peringatan. Rentang yang lewat tengah
  malam dibaca menyambung. Judulnya "Shift ini melewati jam tutup toko",
  "Shift ini mulai sebelum toko buka", atau "Shift ini di luar jam buka
  toko"; isinya satu kalimat per kelompok hari berjam sama, misalnya
  "Toko tutup pukul 22.00 pada Senin sampai Sabtu, sedangkan shift
  pulang 23.00.", ditutup "Shift tetap bisa disimpan.". Kotak karamel di
  bawah isian jam, dan isian yang melanggar bergaris karamel; simpan
  tidak ditahan (`fddb3c6`).
- **JO2a: kalender dan generate.** Kalender mengarsir kolom hari Libur
  toko (`arsir-libur`, dari token krem) dengan label "Toko libur";
  jadwal yang sudah ada tetap tampil. Generate tidak membuat entri di
  tanggal libur toko, sehingga jadwal lama di tanggal itu tidak
  disentuh; urutan pola tetap mengikuti tanggal (hari yang dilewati
  memakan satu hari siklus); ringkasan menambah "Hari Dilewati" (misalnya
  "2 hari, toko libur (Minggu 22 dan 29 Nov)"), dan sel pratinjaunya
  berarsir "Dilewati" (`fddb3c6`).

### Penyesuaian backend `ridho` `1718030`

Diputuskan pemilik proyek 23 November 2026 (`referensi/keputusan-penyesuaian-backend.md`).

- Panel Status Staf tidak lagi menambah karyawan ruang yang izin
  (`gabungStatusStaf` tanpa `karyawanRuang`), karena monitoring per lokasi
  memuat staf tanpa lokasi kerja yang izin bila perannya memegang izin
  dashboard ruang (B348, P84, butir 187).
- **RK1a: laman Rekap Absensi ruang outlet** (B358, P86), desain D kanvas
  "Rekap Absensi" (pemilik proyek, 23 November 2026, dari tiga desain
  dan satu gabungan): desktop memakai desain A, yaitu empat kartu
  ringkasan dan tabel tujuh kolom gabungan (Kehadiran, Ketepatan, Pulang
  awal, Jam kerja, Izin dan cuti, Tidak hadir) dengan baris TOTAL;
  tablet dan HP memakai kartu ringkasan A dan daftar per staf desain C
  yang barisnya dibuka untuk rincian empat kelompok. Angka Tidak hadir di
  kartu memakai merah redup `rose-redup` (`#B4475A`) atas permintaan
  pemilik proyek. Pemilih bulan dan Unduh Excel atau CSV di kepala. Menu
  "Rekap Absensi" di grup Manajemen Shift, gerbang `read-location` dan
  `read-absensi`. Tidak hadir dihitung per shift (P86); status alpha
  harian tetap ditunda (DB3a).
- **RK2a: teks keadaan kosong Rekap Absensi menyebut lokasi kerja**
  (pemilik proyek, 24 November 2026). Backend memuat staf yang berlokasi
  kerja di outlet itu setiap bulan walau tanpa kegiatan (AR40), sehingga
  teksnya menjadi "Staf tampil di sini bila berlokasi kerja di outlet
  ini, atau punya jadwal kerja, absen, atau izin cuti pada bulan yang
  dipilih." Keadaan kosong diuji lewat simulasi bertanda, karena data uji
  selalu punya staf berlokasi kerja. Perilaku backend tetap dicatat
  sebagai temuan yang harus diperbaiki backend (`kontrak/temuan.md`
  butir 194; `2090dd8`). Berakhir 26 November 2026: backend `6478d29`
  (B379) hanya memuat staf berkegiatan, sehingga teksnya dikembalikan
  menjadi "Staf tampil di sini bila punya jadwal kerja, absen, atau izin
  cuti pada bulan yang dipilih." dan keadaan kosong diuji tanpa simulasi
  (PW04, `12ded07`).

### Ruang staf (27 November 2026)

Diputuskan pemilik proyek, dari laporannya bahwa pengguna berakses App
Kasir saja tidak tampil di daftar karyawan (`7553126`, PW21).

- **RS1a: ruang staf dipilah web.** Lokasi kerja terisi menentukan ruang;
  tanpa lokasi kerja, izin dashboard role (dibaca dari daftar
  `GET /pengguna?workspace=` backend, sehingga Owner di kedua ruang); tanpa
  keduanya, ruang outlet, karena aplikasi kasir dipakai di outlet. Berlaku
  di halaman Pengguna, Generate Jadwal, kalender Jadwal, Status Staf, dan
  hitungan staf lonceng (`ruang-staf.ts` di `features/pengguna`). Backend hanya
  membaca izin dashboard, sehingga staf berposisi tanpa izin dashboard
  tidak masuk ruang mana pun (`kontrak/temuan.md` butir 197). Sejak
  backend `c4aae0d` (B385, P90) aturan yang sama dipilah backend di
  `GET /pengguna?workspace=`, sehingga web kembali memakai daftar itu
  apa adanya dan `ruang-staf.ts` di `features/pengguna` dibuang (PW24,
  `fa97abd`, 28 November 2026). Aturan dan halaman yang dicakupnya tidak
  berubah.

Rincian penerapan, bukan bagian teks opsi: pengguna yang lokasi kerjanya
diubah berpindah ruang, sehingga hilang dari daftar ruang tempat ia
diubah. Selama web memilah sendiri (PW21 sampai PW24), lokasi kerja yang
tipenya tidak diketahui pengelola tanpa `read-location` dilewati ke izin
dashboard; backend membaca tipenya sendiri, sehingga staf berlokasi kerja
Gudang kini hanya di ruang gudang bagi siapa pun.

## Catatan

- Sejak PW18 (`041238b`, KS12a di `modul/pemberitahuan.md`): dialog Pola
  Roster tanpa shift aktif menampilkan catatan "Buat shift dulu" dan
  mematikan Simpan, Generate Jadwal menampilkan catatan bila belum ada
  pola roster atau staf selain Owner, dan dialog Tambah Pengguna bila
  belum ada posisi di bawah level pengguna. Berlaku di outlet dan gudang.

### Catatan dari modul jadwal dan shift

Modul jadwal dan shift selesai pada 29 September 2026 dalam empat
submodul: shift (`f99b7cf`), pola roster (`dcc22e0`), kalender, kelola
manual, dan generate jadwal (`19227f8` dan `e2a0cfd`), serta monitoring
absensi (`845c2cf`). Spec pembandingnya di `d9af531`. Seluruh lapisan
data kini di `features/shift/`, `features/pola-roster/`,
`features/jadwal/`, dan `features/absensi/`, dan tidak ada lagi halaman
modul ini yang memakai `apiClient`.

- Endpoint yang terlibat: `/jadwalshift` (termasuk `bulk`), `/shift`,
  `/polaroster`, `/pengguna`, dan `/absensi/monitoring`. Route jadwal,
  shift, dan pola roster tanpa `checkPermission` (`kontrak/temuan.md`
  butir 5); monitoring absensi memeriksa `read-absensi` di controller.
  Halaman jadwal dan generate jadwal bergate `read-pengguna`, dan enam
  permission jadwal belum ada di seed (butir 4). `GET /shift` tanpa
  query string dijawab 500 (butir 8).
- Shift, pola roster, dan absensi belum dapat dipisahkan per lokasi di
  backend (keputusan SH5a, `kontrak/temuan.md` butir 70). Shift dan pola
  roster menunggu lewat konstanta null; widget absensi menyaring dengan
  karyawan ruang (AB4a).
- Edit pola roster menunggu backend (`test.fixme`), dan pola roster
  memakai hapus permanen (keputusan Fase 0).
- Spec: `tests/e2e/jadwal/` (jadwal, pola roster, dan shift) dengan
  fixture di `tests/helpers/jadwal-uji.ts`, serta
  `tests/e2e/pengguna/absensi-widget.spec.ts`. Keputusan modul tercatat
  di `modul/jadwal-shift.md` (Modul jadwal dan shift), dan laporan backend di
  `kontrak/temuan.md` butir 62 sampai 73.

### Catatan dari penyesuaian backend `ridho` `0024eb9`

- `8b5ad0f`: kunci lokasi shift dan pola roster diisi; fixture e2e jadwal
  dibuat per ruang (`siapkanFixtureJadwal(page, auth, ruang)`), karena
  shift uji milik outlet tidak tampil di ruang gudang.
- `6a344b0` dan `2319662`: `rencanaSimpanJadwal` tanpa langkah hapus;
  `hasilDariPenolakanSeluruh` membentuk ulang 409; `apiClient` membaca
  `reason`, dan `ApiError.rincian` menyimpan `errors` asli.
- `ea2e752`: fixme ubah pola roster dilepas (B128), dengan pemeriksaan
  payload PUT dan langkah hapus lewat UI.
- `44a81d0`: `useMonitoringAbsensi(tanggal, ruang)`; `stafRuang` dibuang,
  dan `gabungStatusStaf` menerima karyawan ruang. Backend menjadikan
  jadwal staf yang izin disetujui libur, juga pada buat manual
  ("Otomatis Libur: Karyawan sedang Cuti Disetujui."). Karyawan ruang
  dilepas lagi dari `gabungStatusStaf` 23 November 2026 (B348).
- `b5a2578`: `useDaftarJadwal(filter, { aktif })`, `lainMap` di
  `KaryawanJadwal`, dan penanda di `ShiftCell`.

## Utang terbuka

Tidak ada utang terbuka per 24 November 2026; utang yang selesai dipindah ke
`arsip/catatan-putaran.md` (Utang modul yang selesai, dipindah 24 November 2026).
