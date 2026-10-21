# Akses: Gerbang Rute, Sesi, dan Role

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### useAuthGuard berulang

Diputuskan pemilik proyek pada 4 dan 5 Oktober 2026 (`628f52e`).

- **Guard sesi dashboard hanya dipasang di `app/dashboard/layout.tsx`.**
  Ke-37 pemanggilan `useAuthGuard()` di bawah layout itu dibuang dalam
  satu commit tanpa perubahan perilaku.
- **Suite e2e penuh tidak dijalankan sebelum commit dan dokumentasi
  ditutup** (5 Oktober 2026); baseline dicatat sebagai hitungan, dan
  suite penuh menjadi langkah pertama pekerjaan berikutnya.
- **Pekerjaan setelah ini adalah gerbang rute dari `IZIN_HALAMAN`**
  (selesai di `bc388c6`, Gerbang rute).
- Diterapkan tanpa ditanyakan (`628f52e`): spec baru
  `tests/e2e/auth/guard-dashboard.spec.ts` untuk empat rute tanpa sesi;
  spec e2e terdampak dijalankan sebagai perwakilan tiap jenis berkas
  yang berubah; dan guard halaman login serta panel admin tidak
  disentuh.

### Gerbang rute

Diputuskan pemilik proyek pada 5 dan 6 Oktober 2026 (`bc388c6`). Labelnya
GR:

- **GR1a: gerbang rute dipasang sekali di `app/dashboard/layout.tsx`**,
  di samping guard sesi, sehingga outlet, gudang, dan profil lewat satu
  pintu.
- **GR2a: rute yang ditolak menampilkan pesan di tempat**, tanpa
  pengalihan, dan isi halamannya tidak dipasang, sehingga tidak ada
  permintaan yang pasti dijawab 403 (sejalan GD4a).
- **GR3a: seluruh rute dipetakan sekaligus.** Setiap halaman di bawah
  `/dashboard` punya entri `IZIN_HALAMAN` sendiri, diturunkan dari
  endpoint yang dipanggilnya. Syarat tidak diwariskan dari induk: warisan
  akan menuntut `read-akunkas` di Pindah Dana dan `read-location` di
  detail pengajuan outlet.
- **GR4a: pemeriksaan izin baca di halaman pajak dibuang**; gerbang
  pusat menggantikannya dengan pesan umum.
- **GR5a: halaman form menuntut izin baca dan izin tulisnya**, karena
  tanpa izin tulis form pasti berakhir 403. Halaman detail hanya
  menuntut izin baca, dan tombol aksinya tetap mengikuti izin
  masing-masing (keputusan rancangan butir 14).
- **GR6a: daftar aset, tarif, dan tipe aset tanpa syarat**, mengikuti
  `GET` backend yang tanpa izin; halaman buat dan ubahnya mengikuti GR5a.
- **GR7a: data pendukung form menjadi syarat hanya bila wajib untuk
  menyimpan**, misalnya kategori di form produk dan akun tujuan di buat
  metode pembayaran. Data opsional tetap menampilkan pesan gagal memuat
  di tempat.
- **Suite e2e penuh hanya dijalankan saat penting** (6 Oktober 2026),
  menggantikan PF6a: penyesuaian backend, penelusuran bug atau galat
  yang butuh uji menyeluruh, atau atas permintaan pemilik proyek. Setiap
  commit kode tetap melewati `tsc`, ESLint, vitest penuh, dan spec e2e
  modul yang terdampak.
- **Pekerjaan setelah ini adalah utang kecil gerbang rute** (selesai di
  `dc0af1c`).
- **Seluruh nama izin di `features/` merujuk `IZIN`** (6 Oktober 2026,
  `dc0af1c`), bukan hanya yang kembar dengan izin gerbang, agar nama izin
  punya satu sumber dan salah ketik tertangkap `tsc`. Aturan aksi tetap
  di `features/<modul>/izin.ts` (keputusan rancangan butir 9), dan data
  template role tetap teks.
- **Pekerjaan setelah itu adalah form role ke React Hook Form dan Zod**
  (selesai di `597a163`, Form role).
- Diterapkan tanpa ditanyakan (`dc0af1c`): objek izin lokal seperti
  `IZIN_PENJUALAN` dipertahankan sebagai alias, sehingga pemakai dan
  test-nya tidak berubah; `revisiTransferStok` diganti nama menjadi
  `buatTransferStok`; izin ruang dan lokasi di layout outlet, halaman
  `/dashboard`, pengaturan gudang, dan sidebar ikut merujuk `IZIN`; dan
  cabang keterangan tanpa `update-akunkas` dibuang setelah terbukti tidak
  tercapai dari kode layout outlet dan gerbang.
- Diterapkan tanpa ditanyakan (`bc388c6`): selama sesi belum masuk, isi
  halaman diteruskan seperti sebelumnya, agar pesan tanpa izin tidak
  tampil sebelum daftar izin diketahui; `bolehBukaHalaman` tetap
  mencocokkan persis untuk sidebar dan kartu, dan gerbang memakai
  `bolehBukaRute`; rute statis didahulukan dari pola `[id]`; halaman
  berizin per bagian (profil toko, Pindah Dana) dan setup gudang ditulis
  sebagai entri kosong; rute tanpa entri tetap diloloskan, dan test unit
  kelengkapan yang menolak halaman tanpa entri; serta spec e2e membaca
  izin peran pengguna uji dari backend, bukan mengandaikannya.

### Form role

Diputuskan pemilik proyek pada 6 Oktober 2026 (`597a163`). Labelnya RL:

- **RL1a: galat validasi form role tampil di bawah tiap isian**, seperti
  form lain; penolakan backend tetap satu paragraf di atas tombol simpan.
- **RL2a: ubah posisi hanya mengirim field yang berubah** (keputusan
  rancangan butir 15). Deskripsi yang dikosongkan dikirim sebagai teks
  kosong, daftar wewenang dikirim utuh hanya bila susunannya berubah,
  dan simpan nonaktif selama tidak ada perubahan.
- **RL3a: batas atas level hanya diperiksa form bila level pengguna
  aktif diketahui.** Bila tidak, form hanya menuntut bilangan bulat
  minimal 1, dan backend yang menolak level setara atau melebihi level
  pengguna, dengan pesannya ditampilkan.
- **Pekerjaan setelah ini adalah fase rancangan dan perbaikan UI/UX,
  layout, dan palet warna.** Seluruh rancangannya ditentukan pemilik
  proyek sendiri; tidak ada usulan desain yang diterapkan tanpa
  arahannya (`inti/status.md`, Pekerjaan berikutnya).
- Diterapkan tanpa ditanyakan (`597a163`): nama dipangkas dan dibatasi 3
  sampai 50 karakter serta deskripsi 255, sesuai validator backend
  (sejalan T4a); level desimal ditolak, bukan dipotong (sejalan SH4a);
  penjelasan wewenang dasar pindah ke `constants.ts` sebagai data;
  `selectedPermissions` dan penulisnya dipertahankan namanya agar handler
  wewenang tidak berubah; teks tombol simpan tetap "Simpan Perubahan" di
  kedua mode; dan kedua skenario e2e dibuktikan gagal terhadap form lama
  sebelum form diubah.

### Template role

Diputuskan pemilik proyek pada 21 Oktober 2026 (`ffd3994`, `4088d9e`):

- **Nama izin template mengikuti seed backend.** `delete-jurnal-stok`
  dibuang setelah P24; nama yang tidak ada di basis data membuat
  pembuatan role dijawab 400, dan skenario e2e template menangkapnya.
- **Stock opname**: Supervisor `create`, `read`, dan `submit`; Manajer
  dan General Manajer keempatnya, termasuk `review`.
- **Absensi**: `read-absensi` untuk Supervisor ke atas; `create-absensi`
  dan `update-absensi` untuk Manajer dan General Manajer. Absen diri
  sendiri tidak butuh izin.
- **Stock adjustment per ruang** (`read-stock-adjustment-outlet` dan
  `read-stock-adjustment-gudang`, RH3a) untuk Supervisor ke atas.
- Guest, Staff, dan Kasir tidak mendapat izin tambahan; izin pembelian
  stok tetap di luar template (RH6a).

## Catatan

### Catatan dari form role

Dikerjakan pada 6 Oktober 2026 dalam satu commit, `597a163`, terhadap
backend `yoga` `fc29433`; `origin/yoga` tidak maju sejak itu.

- Isian form role beralih dari `useState` dan validasi di `handleSubmit`
  ke React Hook Form dan Zod, dengan `noValidate`. Tampilan, teks, label,
  dan id isian tidak berubah, dan ketiga handler wewenang tidak disentuh.
- Empat cacat form lama terbukti dari kode dan diperbaiki: nama hanya
  dijaga atribut `required` browser dan dikirim tanpa `trim`; deskripsi
  yang dikosongkan tidak dikirim; level desimal dipotong `parseInt`; dan
  setiap simpan ditolak bila level pengguna aktif tidak dapat ditentukan.
- Galat validasi tampil di bawah tiap isian (RL1a). Ubah hanya mengirim
  field yang berubah, dan simpan nonaktif selama tidak ada perubahan
  (RL2a). Batas atas level hanya diperiksa form bila level pengguna
  diketahui (RL3a).
- Lapisan murninya di `features/role/schema.ts` dan
  `features/role/payload.ts` (`referensi/arsitektur.md`).
- Dasar RL2a dibaca dari backend lebih dulu: `roleService.update` menulis
  hanya field yang dikirim, dan validator mode update menjadikan seluruh
  field opsional. Kontrak `PUT /role/:id` dikoreksi (`kontrak/payload.md`).
- Kedua skenario e2e baru dijalankan terhadap form lama lebih dulu dan
  gagal keduanya, lalu lolos setelah peralihan. Vitest 620 lolos di 73
  berkas, dan `tests/e2e/roles` 7 lolos (`inti/pengujian.md`). Suite e2e penuh
  tidak dijalankan.
- Tidak ada temuan backend baru.
- Keputusan: `modul/akses.md` (Form role, RL1a sampai RL3a).

### Catatan dari utang kecil gerbang rute

Dikerjakan pada 6 Oktober 2026 dalam satu commit, `dc0af1c`, terhadap
backend `yoga` `fc29433`; `origin/yoga` tidak maju sejak itu.

- `IZIN` menjadi satu sumber nama izin: 24 izin aksi ditambahkan,
  sehingga memuat 71 nama dalam tiga kelompok (ruang dan baca, tulis
  halaman form, dan aksi di dalam halaman). Atas keputusan pemilik
  proyek, seluruh izin tulis dipindah, bukan hanya yang kembar.
- Sebelas `features/<modul>/izin.ts` merujuk `IZIN`. Objek lokal seperti
  `IZIN_PENJUALAN` dan fungsi aksi dipertahankan, sehingga pemakai dan
  test unitnya tidak berubah.
- Izin ruang, lokasi, dan tenant di layout outlet, halaman `/dashboard`,
  pengaturan gudang, sidebar, `akses-gudang.ts`, dan halaman profil toko
  ikut merujuk `IZIN`.
- `revisiTransferStok` diganti nama menjadi `buatTransferStok`, karena
  `create-transfer-stok` dipakai untuk membuat dan merevisi surat jalan.
- Cabang keterangan tanpa `update-akunkas` di halaman ubah akun kas
  dibuang. Cabang itu terbukti mati dari kode: layout outlet tidak
  memasang isi sampai sesi masuk, dan sesudahnya gerbang rute menuntut
  `update-akunkas` untuk rute itu (GR5a).
- Yang sengaja tetap teks: `lib/roleTemplates.ts` dan
  `features/role/constants.ts` (data), serta dua pembanding nama di
  `features/role/form-role.tsx`.
- Seluruh 71 nama di `IZIN` disilang dengan `seeds/permissionSeed.js`
  backend lewat skrip: tidak ada yang hilang.
- Vitest 604 lolos di 72 berkas, dan spec e2e terdampak 121 lolos dan 3
  skipped (`inti/pengujian.md`). Suite e2e penuh tidak dijalankan.
- Tidak ada perubahan perilaku selain cabang mati itu, tidak ada temuan
  backend baru, dan kontrak tidak berubah.
- Keputusan: `modul/akses.md` (Gerbang rute).

### Catatan dari gerbang rute

Dikerjakan pada 5 dan 6 Oktober 2026 dalam satu commit, `bc388c6`,
terhadap backend `yoga` `fc29433`; `origin/yoga` tidak maju sejak itu.

- Suite e2e penuh yang tertunda sejak `628f52e` dijalankan di awal sesi,
  sebelum perubahan: 436 lolos dan 16 skipped, sesuai hitungan.
- `GerbangRute` (`components/gerbang-rute.tsx`) dipasang di
  `app/dashboard/layout.tsx`. Rute yang syaratnya tidak dipenuhi tidak
  dipasang isinya dan menampilkan pesan di tempat, tanpa pengalihan.
- `IZIN_HALAMAN` kini memuat seluruh 83 halaman di bawah `/dashboard`: 44
  entri baru, dengan rute berparameter sebagai pola `[id]`. `syaratRute`
  mencocokkan persis lebih dulu, lalu pola bersegmen sama
  (`referensi/arsitektur.md`).
- `IZIN` bertambah 23 izin tulis: halaman form menuntut izin baca dan
  izin tulisnya, sedangkan halaman detail hanya izin baca (GR5a).
- Syarat setiap rute diturunkan dari hook yang dipanggil halamannya,
  lewat skrip sekali pakai yang menelusuri impor setiap `page.tsx`, dan
  dari izin endpoint di kontrak; tidak ada yang diwariskan dari induk.
- Lokasi di buat bahan baku, bahan baku di form produk, dan pajak di buat
  penjualan terbukti opsional dari kode, sehingga tidak menjadi syarat
  (GR7a).
- Pemeriksaan izin baca di halaman pajak dibuang (GR4a); kartu indeks
  pengaturan tetap membaca `bolehBukaHalaman`.
- Vitest 603 lolos di 72 berkas. Spec baru
  `tests/e2e/auth/gerbang-rute.spec.ts` lolos 2, dan skenario tertolaknya
  terbukti gagal tanpa gerbang. Spec terdampak: 83 lolos, lalu 60 lolos
  dan 2 skipped (`inti/pengujian.md`).
- Suite e2e penuh tidak dijalankan ulang setelah perubahan. Sejak
  6 Oktober 2026 suite penuh hanya dijalankan saat penting
  (`modul/akses.md`, Gerbang rute).
- Tidak ada temuan backend baru. `kontrak/izin-halaman.md` mendapat
  tabel rute turunan; kontrak lain tidak berubah.
- Keputusan: `modul/akses.md` (Gerbang rute, GR1a sampai GR7a).

### Catatan dari useAuthGuard berulang

Dikerjakan pada 5 Oktober 2026 dalam satu commit, `628f52e`, terhadap
backend `yoga` `fc29433`; `origin/yoga` tidak maju sejak itu.

- Baris impor dan baris pemanggilan `useAuthGuard()` dibuang dari 37
  berkas: 24 di `app/` dan 13 di `features/`, beserta empat baris kosong
  yang menjadi berlebih. Tidak ada baris yang ditambahkan, dan perilaku
  tidak berubah.
- Pemetaan terhadap `9195472` dibuktikan ulang sebelum diterapkan:
  jumlah pemanggil sama, tidak ada yang memakai nilai kembalian hook,
  dan bentuk kedua baris seragam di setiap berkas.
- Guard sesi dashboard kini hanya dipasang di `app/dashboard/layout.tsx`
  (`referensi/arsitektur.md`), dan `features/` tidak lagi mengimpor
  `useAuthGuard`.
- Spec baru `tests/e2e/auth/guard-dashboard.spec.ts`: tanpa sesi, empat
  rute di bawah `/dashboard` berakhir di `/login`. Skenarionya lolos
  juga terhadap kode lama; gunanya menjaga guard layout sebagai
  satu-satunya penjaga.
- Vitest penuh 593 lolos, dan spec e2e terdampak 98 lolos dan 2
  skipped. Suite e2e penuh tidak dijalankan, atas keputusan pemilik
  proyek, dan menjadi langkah pertama pekerjaan berikutnya
  (`inti/pengujian.md`).
- Tidak ada temuan backend baru, dan kontrak tidak berubah.
- Keputusan: `modul/akses.md` (useAuthGuard berulang).

## Utang terbuka

### Utang kecil dari gerbang rute

- Pesan gerbang bersifat umum dan tidak menyebut halaman maupun izin yang
  kurang.
- Syarat 44 entri baru diturunkan dari nama hook dan kontrak, bukan dari
  trace per halaman (`inti/pengujian.md`, Utang pengujian).
