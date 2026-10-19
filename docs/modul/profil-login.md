# Modul Profil, Login, dan Sidebar

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul Profil, login, dan sidebar

Diputuskan pemilik proyek pada 2 Oktober 2026, dengan prinsip keputusan
rancangan butir 17, 21, dan 23.

- **PF1a: tiga submodul berurutan**: profil (`0ed0e9a`, `091be4e`), login
  akun dan login pengguna (`1c13ee6`), lalu sidebar beserta logout
  (`57a7084`).
- **PF2a: tombol hapus akun tampil nonaktif dengan keterangan**, tanpa
  `alert`. Backend diminta menyediakan jalur hapus akun sendiri: hanya
  Owner, mencakup akun beserta tokonya, dengan konfirmasi password atau
  autentikasi dua kali, dan admin platform tetap berkuasa penuh atas
  semua akun (`kontrak/temuan.md` butir 112).
- **PF3a: form login akun dan login pengguna memakai React Hook Form,
  Zod, dan `noValidate`**, menggantikan validasi HTML5 browser. Login
  pengguna hanya menuntut PIN terisi dan berupa angka; panjang tepat 6
  digit ditegakkan saat PIN dibuat atau diubah.
- **PF4a: sidebar dipecah**, tampilan dipertahankan: data menu, kaki
  sidebar, dan komponen utama (`referensi/arsitektur.md`).
- **PF5a: nama dan PIN diuji sungguhan pada pengguna uji khusus "E2E
  Profil"**, yang tidak memegang `read-pengguna` maupun
  `update-pengguna`, di konteks browser terpisah. Nama dan PIN Ridho
  tidak diubah, karena login seluruh suite bergantung padanya; Ridho
  memulihkan pengguna uji di awal setiap test.
- **PF6a: suite e2e penuh dijalankan sekali saat modul selesai**,
  sebelum pembaruan dokumentasi, bukan sebelum setiap commit. Setiap
  commit kode melewati `tsc`, ESLint, vitest penuh, dan spec yang
  terdampak. Langkah 5 Alur setiap perubahan di `inti/cara-kerja.md` diubah
  atas perintah ini. Diganti pada 6 Oktober 2026: suite penuh hanya
  dijalankan saat penting (Gerbang rute).
- **PF7a: setelah PIN berubah, pengguna diberi pesan lalu login ulang.**
  Backend memutus sesi setiap PIN berubah; halaman menitipkan pesan,
  mengakhiri sesi pengguna, dan menuju login pengguna, tanpa permintaan
  yang pasti dijawab 401.
- **PF8a: nomor HP isian teks** yang hanya menerima angka dan tanda + di
  depan. Nomor yang dikosongkan dikirim sebagai null, dan format akhirnya
  diputuskan backend.
- **PF9a: avatar memakai inisial nama**, di halaman profil dan kaki
  sidebar; gambar contoh dari luar dibuang. Unggah foto profil bukan
  kebutuhan MVP dan ditinjau setelah rilis.
- **Login tahap kedua dinamai "pengguna", bukan "pin"**, di nama berkas,
  komponen, skema, hook, dan tipe. Kata PIN hanya dipakai untuk isian PIN
  itu sendiri.
- **Pekerjaan setelah modul ini adalah panel admin** bagi akun admin
  setelah login akun (selesai di `c824f18`, Modul panel admin).
- Diterapkan tanpa ditanyakan (`091be4e`): PIN baru tepat 6 digit
  (keputusan Fase 0); form dipasang setelah data termuat (butir 8); ubah
  hanya mengirim field yang berubah (butir 15); PIN lama yang diisi
  tanpa PIN baru ditolak form; isian nama dan nomor HP baca-saja selama
  simpan berjalan, agar ketikan tidak hilang saat form dipasang ulang;
  profil yang gagal dimuat tampil sebagai pesan dengan tombol coba lagi;
  dan `useAuthGuard` menuju login pengguna bila token akun masih ada.
- Diterapkan tanpa ditanyakan (`1c13ee6`, `57a7084`): "Ganti Akun
  Bisnis" menjadi tombol; logout akun tetap dijalankan walau logout
  pengguna gagal; izin sidebar dibaca dari sesi saat render, bukan
  disalin ke state; nama di sidebar dari satu hook yang berbagi cache
  dengan halaman profil (butir 12); dan `tenantName` dibuang dari
  `PenggunaSesi`.

## Catatan

### Catatan dari modul Profil, login, dan sidebar

Modul terakhir migrasi halaman lama selesai pada 2 Oktober 2026 dalam
empat commit, dengan suite e2e penuh dijalankan sekali di akhir modul
(keputusan PF6a): 393 lolos dan 17 skipped.

| Commit | Isi |
|---|---|
| `0ed0e9a` | Spec pembanding halaman profil terhadap kode lama |
| `091be4e` | Halaman profil ke `features/pengguna`: form berskema, PIN 6 digit, dan login ulang setelah PIN berubah |
| `1c13ee6` | Login akun dan login pengguna ke `features/auth`, dengan form berskema dan respons bertipe |
| `57a7084` | Sidebar dipecah, izin dari sesi saat render, dan logout lewat `features/auth` |

- Tidak ada lagi halaman, komponen, maupun berkas `features/` yang
  mengimpor `apiClient`; ia tinggal lapisan terbawah di `lib/`
  (`referensi/arsitektur.md`). Login memakai `apiMentah`, karena `accessToken`
  berada di tingkat atas respons.
- Backend meloloskan `GET` dan `PUT /pengguna/:id` atas diri sendiri
  tanpa `read-pengguna` dan `update-pengguna`, dan seluruh field `PUT`
  opsional; keduanya berbeda dari kontrak lama dan dibuktikan dari web
  oleh pengguna uji "E2E Profil" (PF5a). Kontrak dikoreksi
  (`kontrak/endpoint.md`, `kontrak/payload.md`).
- Setelah PIN berubah backend memutus sesi. Halaman profil menitipkan
  pesan, mengakhiri sesi pengguna, dan menuju login pengguna (PF7a);
  `useAuthGuard` kini menuju `/login/pengguna` bila token akun masih
  ada, dan area login punya layout ber-Toaster sendiri.
- Sidebar dipecah menjadi `components/app-sidebar.tsx` (325 baris),
  `components/sidebar-menu.ts`, dan `components/sidebar-pengguna.tsx`.
  Nama pengguna dibaca lewat `usePenggunaSaya`, yang berbagi cache dengan
  halaman profil, dan avatar memakai inisial (PF9a).
- Login tahap kedua dinamai "pengguna", bukan "pin", di seluruh kode
  (`HalamanLoginPengguna`, `skemaLoginPengguna`), atas permintaan pemilik
  proyek.
- Temuan backend baru: butir 111 dan 112, dilaporkan 2 Oktober 2026
  (`arsip/laporan-backend.md`).
- Enam kegagalan pada run pertama submodul sidebar berasal dari server
  dev yang belum selesai mengompilasi satu rute, bukan dari kode
  (`referensi/playwright.md`, Catatan Playwright).
- Keputusan pemilik proyek: `modul/profil-login.md` (Modul Profil, login, dan
  sidebar).

## Utang terbuka

### Utang kecil dari modul Profil, login, dan sidebar

- Tombol hapus akun di halaman profil tampil nonaktif (PF2a) sampai
  backend punya jalur hapus akun sendiri bagi Owner (`kontrak/temuan.md`
  butir 112).
- Unggah foto profil belum ada; avatar memakai inisial (PF9a). Bukan
  kebutuhan MVP, dan ditinjau setelah rilis.
- Teks tombol saat memuat di login pengguna masih "Menerbitkan Token
  C...", istilah internal; penggantiannya menunggu keputusan pemilik
  proyek.
- Halaman ringkasan laba rugi memicu peringatan ukuran grafik di konsol
  (lebar dan tinggi -1 saat render pertama). Penyebabnya belum ditelusuri
  dari kode, dan grafiknya tetap tampil. Sejak `0c5822b` komponen grafik
  yang sama (`GrafikLaporan`) juga dipakai dashboard outlet.
