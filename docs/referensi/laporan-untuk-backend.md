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

**Keadaan 27 November 2026:** seluruh butir dan kebutuhan laporan 24
sampai 26 November 2026 dikerjakan backend `6478d29` (AR46 sampai AR51,
B369 sampai B384) dan sudah dibuktikan web lewat paket PW02 sampai PW13,
lalu dipindah ke `arsip/laporan-backend.md`; suite e2e penuh
27 November 2026 (PW14, web `81e9214`) membuktikan ulang seluruhnya,
837 lolos dari 837. Ridho menutup baris itu `Selesai` di
`docs/pengembangan/klien.md` backend pada 28 November 2026 (AR53).

**Keadaan 28 November 2026:** butir 196 dan 197 dibaca backend (AR53)
dan dikerjakan di `c4aae0d`: butir 197 lewat B385 (AR54, P90,
`6595622`) dan butir 196 lewat B386 (AR55, R29, `df4238e`). Keduanya
`Menunggu verifikasi` di `docs/pengembangan/klien.md` backend, dan
tetap di berkas ini sampai dibuktikan web (PW24 dan PW15,
`referensi/antrean-web.md`).

## Laporan 27 November 2026 (Mesin Kasir)

Diperiksa terhadap backend `ridho` lokal `6478d29`.

### Butir 196: penanda asal Pindah Dana buka kasir di jurnal transfer

Modul akun kas dan jurnal transfer (Nizar), dikerjakan Ridho.

- **Bukti:** `mappers/jurnalTransferMapper.js` `mapJurnalTransferResponse`
  mengirim `tanggal`, `kasSumber`, `kasTujuan`, `jumlah`, `keterangan`,
  `status`, `catatan`, dan `dicatatOleh`, tanpa penanda asal. Penolakan
  VOID di `services/jurnalTransferService.js` (`de0bf66`) mengenali
  jurnal buka kasir lewat
  `SesiKasir.exists({ "pindahDanaBuka.jurnalTransferID": id })`,
  dan `GET /sesikasir` tidak menerima filter per jurnal. Keterangan
  "Laci dikosongkan saat buka kasir" dapat diubah lewat `PUT`, sehingga
  bukan penanda. Dibuktikan e2e 27 November 2026
  (`keuangan/mesin-kasir`, PW09): Batalkan di halaman Pindah Dana dijawab
  409 dan transfer tetap Aktif.
- **Penyebab:** asal jurnal hanya tersimpan di dokumen sesi kasir.
- **Kenapa penting:** halaman Pindah Dana menawarkan Batalkan untuk
  setiap transfer Aktif kepada pemegang `update-jurnal-transfer`; untuk
  jurnal buka kasir tombol itu selalu berakhir 409.
- **Saran:** respons `GET /jurnaltransfer` dan `GET /jurnaltransfer/:id`
  membawa penanda, misalnya `sesiKasirID` atau `asal: "buka-kasir"`
  (bisa juga `bolehVoid: false`), tanpa memaksakan bentuknya.
- **Penanganan sementara di frontend:** tidak ada kode khusus; dialog
  batal menampilkan pesan 409 backend apa adanya (MK19a,
  `modul/keuangan.md`). Begitu penandanya ada, Batalkan disembunyikan
  untuk jurnal itu (PW15, `referensi/antrean-web.md`).

### Butir 197: staf tanpa izin dashboard tidak masuk daftar ruang

Modul pengguna dan RBAC (Ridho).

- **Bukti:** `services/pengguna/penggunaCrudService.js` `getByWorkspace`
  memuat Owner (`isOwnerRole`) dan pengguna yang role-nya memegang
  `read-dashboard-outlet` atau `read-dashboard-gudang`; pengguna lain
  dibuang (`return false`). Data development 27 November 2026: tiga staf
  baru pemilik proyek, "nijar", "nijar hitam" (role Staff, 7 izin), dan
  "aril" (role Kasir, 13 izin), ber-`aksesType` `["app"]` dan berlokasi
  kerja outlet, tidak memegang kedua izin itu, sehingga
  `GET /pengguna?workspace=outlet` tidak memuat mereka. Dibuktikan e2e
  `pengguna/crud-pengguna` (skenario RS1a): staf akses aplikasi dengan
  posisi tanpa izin dashboard tidak ada di respons `workspace=outlet`.
- **Penyebab:** ruang staf diturunkan dari izin dashboard web, padahal
  staf aplikasi (kasir) tidak membutuhkan dashboard web, dan lokasi kerja
  (P61) yang menyatakan ruangnya tidak dibaca.
- **Kenapa penting:** staf aplikasi hilang dari halaman Pengguna, Generate
  Jadwal, kalender Jadwal, dan Status Staf web, sehingga tidak dapat
  dijadwalkan dan absensinya tidak berjalan; aplikasi dan modul lain yang
  memakai `workspace` terdampak sama.
- **Saran:** pakai aturan yang sama dengan web (RS1a): lokasi kerja
  terisi menentukan ruang; tanpa lokasi kerja, izin dashboard role; tanpa
  keduanya, ruang outlet; Owner di kedua ruang.
- **Penanganan sementara di frontend:** `features/pengguna/ruang-staf.ts`
  memuat seluruh pengguna (`GET /pengguna`) dan memilah sendiri, memakai
  kedua daftar `workspace` hanya sebagai sumber izin dashboard. Begitu
  backend memakai aturan yang sama, web cukup kembali ke
  `GET /pengguna?workspace=`.

## Prioritas seluruh laporan terbuka

| Prioritas | Butir | Pemilik | Dampak |
|---|---|---|---|
| 8 | Butir 197: staf tanpa izin dashboard tidak masuk daftar ruang | Ridho | Staf aplikasi tidak dapat dijadwalkan; web memilah sendiri |
| 9 | Butir 196: penanda asal Pindah Dana buka kasir | Ridho (modul Nizar) | Batalkan tampil lalu ditolak 409 |
