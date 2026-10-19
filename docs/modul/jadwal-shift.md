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

## Catatan

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

## Utang terbuka

### Utang kecil dari modul jadwal dan shift

- Hapus jadwal masih memakai `confirm` bawaan browser, berbeda dengan
  dialog konfirmasi di modul lain; spec kelola jadwal bergantung padanya
  (`page.once("dialog")`). Diseragamkan bila pemilik proyek memutuskan.
- Shift outlet dan gudang masih memakai daftar tenant yang sama sampai
  backend memisahkan shift per lokasi (`KUNCI_LOKASI_SHIFT`, keputusan
  SH1b, `kontrak/temuan.md` butir 70).
- Query `?workspace=` pada `GET /shift` hanya penanganan sementara,
  karena backend menjawab 500 tanpa query apa pun (`kontrak/temuan.md`
  butir 8). Dibuang begitu backend diperbaiki (`features/shift/ruang.ts`).
- Pola roster outlet dan gudang masih memakai daftar tenant yang sama
  sampai backend memisahkannya per lokasi (`KUNCI_LOKASI_POLA_ROSTER`,
  keputusan PL5, `kontrak/temuan.md` butir 70).
- Ubah pola roster tetap gagal karena validator model backend
  (`test.fixme` di `inti/pengujian.md`); tombol ubah tetap ditampilkan dan
  galatnya diteruskan ke pengguna.
- `keterangan` dan `dibuatPada` di `PolaRosterItem` masih opsional, walau
  halaman generate lama yang memetakan pola sendiri sudah tidak ada
  (`19227f8`); dijadikan wajib bersama perapian tipe berikutnya.
