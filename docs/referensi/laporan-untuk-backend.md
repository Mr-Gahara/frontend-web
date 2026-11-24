# Laporan untuk Backend

Sifat perubahan: **Sering**: bertambah setiap ada temuan backend; butir yang diperbaiki dan dibuktikan web dipindah ke `arsip/laporan-backend.md`.

Lapis referensi: dibaca pemilik proyek saat bekerja di backend, bersama seluruh dokumentasi frontend; dikirim juga saat menyusun atau membuktikan perbaikan backend.

Laporan lengkap temuan backend yang masih terbuka, ditulis di
dokumentasi, bukan sebagai teks siap salin di percakapan (pemilik
proyek, 24 November 2026). Saat bekerja di backend, pemilik proyek
membaca berkas ini bersama `kontrak/temuan.md` (tabel ringkas seluruh
butir), `referensi/rencana-struk-tutup-kasir.md`, dan
`referensi/rencana-struk-dapur.md`.

Bentuk tiap butir mengikuti `inti/backend.md` (Bila menemukan bug
backend): bukti, penyebab, kenapa penting, saran, dan penanganan
sementara di frontend. Nomor butir sama dengan `kontrak/temuan.md`.
Butir diurutkan menurut kepentingan dan ditutup tabel prioritas. Sejak
16 November 2026 Ridho memimpin seluruh pekerjaan backend; pemilik modul
tetap disebut agar jelas modulnya.

## Laporan 24 November 2026 (utang pengujian)

Diperiksa terhadap backend `ridho` lokal `1718030`.

### Butir 192: revisi surat jalan per kemasan menyimpan jumlah yang salah

Modul transfer stok (Yoga).

- **Bukti:** `PUT /transferstok/:id` dengan
  `items[{bahanBakuID, qtyKirim: 1, satuan: "kaleng"}]` untuk bahan
  "E2E Bahan Kaleng" (ml, kaleng = 290) dijawab 200, lalu
  `GET /transferstok/:id` membaca `qtyKirim` 1, bukan 290. Spec
  `inventaris/bahanBaku/konversi-satuan` skenario "surat jalan per
  kemasan: revisi 1 kaleng tersimpan 290 ml (B365)".
- **Penyebab:** `validators/transferStokValidator.js` baris 141 sampai
  145 mengizinkan `satuan` di item, tetapi menyusun ulang
  `updates.items` hanya dengan `bahanBakuID`, `qtyKirim`, dan
  `catatanItem`. `services/transferStok/itemKiriman.js` baris 52 lalu
  memakai satuan item pengajuan (satuan dasar) karena `item.satuan`
  kosong.
- **Kenapa penting:** jumlah kirim tersimpan salah tanpa galat; gudang
  mengirim 1 kaleng, surat jalan mencatat 1 ml, dan stok berpindah
  menurut angka yang salah. Bertentangan dengan B365 di
  `docs/pengembangan/klien.md` ("satuan opsional ... di POST dan PUT
  draf").
- **Saran:** teruskan `satuan` di `updates.items` hasil validasi edit
  draf, sama dengan jalur `POST`.
- **Penanganan sementara di frontend:** tidak ada (pemilik proyek:
  lapor saja). Spec revisi dibiarkan merah sampai backend memperbaiki.

### Butir 193: status booking mentah di detail penjualan

Modul penjualan dan booking (Nizar).

- **Bukti:** booking 19.14 sampai 20.14 yang dibayar Rp1 tampil "Aktif"
  di bagian Sesi Booking detail penjualan pada pukul 22.14, sedangkan
  `GET /sesibooking` membacanya "Selesai". Spec
  `reservasi/daftar/tandai-selesai` skenario "Tandai Selesai tidak
  tampil untuk booking yang belum dibayar, maupun yang jamnya sudah
  lewat".
- **Penyebab:** `services/penjualan/bacaPenjualan.js` baris 193 sampai
  197 membaca `SesiBooking` dengan `.lean()` tanpa `denganStatusEfektif`
  (`services/sesiBooking/sesiBookingConstants.js` baris 124 dan 191),
  padahal booking yang jam selesainya lewat dianggap Selesai saat dibaca.
- **Kenapa penting:** satu booking tampil berbeda di dua tempat; kasir
  dapat mengira aset masih dipakai.
- **Saran:** terapkan `denganStatusEfektif` pada `sesiBooking[]` detail
  penjualan (B347).
- **Penanganan sementara di frontend:** tidak ada (pemilik proyek:
  lapor saja). Tombol Tandai Selesai sudah tersembunyi oleh aturan web;
  yang merah hanya label status.

### Butir 191: template General Manajer ditolak batas 120 izin

Modul RBAC (Ridho).

- **Bukti:** membuat role berizin template General Manajer dijawab 400
  "permissions maksimal 120 item". Spec `akses/template-role` skenario
  General Manajer.
- **Penyebab:** `validators/roleValidator.js` baris 85 membatasi 120
  izin per role, sedangkan template web berisi 133 izin dan seed kini
  163 izin. Template Manajer (116 izin) sudah dekat batas.
- **Kenapa penting:** role General Manajer tidak dapat dibuat sama
  sekali dari template yang ditawarkan web.
- **Saran:** naikkan batas mengikuti jumlah izin seed (batas tetap
  berguna untuk melindungi dari array membengkak).
- **Penanganan sementara di frontend:** tidak ada (TR1a). Spec General
  Manajer dibiarkan merah.

### Butir 190: logout pengguna web ikut mengeluarkan akun toko

Modul auth (Ridho).

- **Bukti:** sesudah Ganti pengguna di popup profil, memuat ulang
  `/dashboard` berakhir di `/login`, bukan `/login/pengguna`. Spec
  `auth/sidebar-pengguna`.
- **Penyebab:** `controllers/penggunaController.js` `logout` baris 446
  sampai 450 memanggil `res.clearCookie("refreshToken", { path:
  "/api/akun/auth" })` dengan komentar "clear cookie akun sekalian", di
  jalur web dan di `catch`.
- **Kenapa penting:** Ganti pengguna hanya bertahan di tab yang sama;
  muat ulang atau tab baru sebelum pengguna berikutnya masuk meminta
  login email toko lagi.
- **Saran:** jalur web `pin-logout` hanya mengakhiri sesi pengguna dan
  tidak menghapus cookie akun.
- **Penanganan sementara di frontend:** tidak ada (PU3a); Ganti pengguna
  dirilis apa adanya.

### Butir 194: Rekap Absensi memuat staf tanpa kegiatan

Modul SDM (Ridho). Dicatat atas keputusan pemilik proyek sebagai temuan
yang harus diperbaiki backend.

- **Bukti:** `GET /absensi/rekap?bulan=2019-01&locationID=<outlet>`
  memuat "E2E Kasir Outlet" dengan seluruh angka 0, termasuk bulan
  sebelum toko ada.
- **Penyebab:** `services/absensi/rekapAbsensiService.js` baris 22
  sampai 23 dan 109 (AR40) selalu memasukkan staf yang berlokasi kerja
  di lokasi itu.
- **Kenapa penting:** rekap tidak pernah kosong dan berisi baris serba
  nol; total staf di ringkasan ikut menghitung staf tanpa kegiatan.
- **Saran:** muat hanya staf yang punya jadwal, absen, atau izin pada
  bulan itu.
- **Penanganan sementara di frontend:** teks keadaan kosong menyebut
  staf berlokasi kerja (RK2a), dan keadaan kosong diuji lewat simulasi
  bertanda. Bila backend memperbaiki, teks itu dikembalikan.

### Kebutuhan fitur MVP: struk laporan tutup kasir

Bukan bug, tetapi data yang dibutuhkan rilis MVP. Rinciannya di
`referensi/rencana-struk-tutup-kasir.md`:

- `nominal` buka kasir opsional dengan bawaan 0, beserta keputusan arti
  modal kosong (sekarang memicu mutasi selisih laci).
- Penjualan dan pembayaran seluruh metode terhubung ke sesi kasir
  (`sesiKasirID`); sekarang hanya pembayaran tunai.
- Endpoint laporan tutup kasir per sesi, dihitung backend.

### Prioritas

| Prioritas | Butir | Pemilik | Dampak |
|---|---|---|---|
| 1 | 192 | Yoga | Jumlah kirim tersimpan salah tanpa galat |
| 2 | Struk tutup kasir | Ridho dan Nizar | Wajib MVP; data per sesi belum tersedia |
| 3 | 193 | Nizar | Status booking berbeda di dua tempat |
| 4 | 191 | Ridho | Role General Manajer tidak dapat dibuat |
| 5 | 190 | Ridho | Ganti pengguna hanya bertahan di tab yang sama |
| 6 | 194 | Ridho | Rekap berisi baris serba nol, tidak pernah kosong |
