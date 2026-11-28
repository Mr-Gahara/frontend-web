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
dibuktikan web (PW24 `fa97abd`, PW15 `0aef46e`) dan dipindah ke
`arsip/laporan-backend.md`. Tidak ada laporan terbuka; di
`docs/pengembangan/klien.md` backend kedua barisnya masih `Menunggu
verifikasi` sampai Ridho menutupnya.

## Prioritas seluruh laporan terbuka

| Prioritas | Butir | Pemilik | Dampak |
|---|---|---|---|
| - | Tidak ada butir terbuka per 28 November 2026 | - | - |
