# Cara Kerja

Sifat perubahan: **Jarang**: bertambah saat ada pelajaran. "Alur setiap perubahan" dan "Aturan blok perintah" **tetap**.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Aturan kerja sehari-hari: alur setiap perubahan, blok perintah, helper,
catatan alat, dan disiplin yang lahir dari kesalahan sebelumnya. Alur setiap
perubahan dan aturan blok perintah ditetapkan pemilik proyek dan hanya diubah
atas permintaannya; bagian lain bertambah setiap ada pelajaran baru.

## Alur setiap perubahan

Bagian **tetap**: hanya diubah atas perintah pemilik proyek.

1. Komparasi lama dan baru, ditulis lengkap tanpa placeholder.
2. Blok perintah siap tempel yang menerapkannya (menjalankannya adalah persetujuan).
3. Perintah verifikasi: `tsc`, ESLint, dan pemeriksaan hasil.
4. Menjalankan test yang ada, menambah skenario untuk perubahan itu, menjalankan ulang.
5. Sebelum commit: `tsc`, ESLint, vitest penuh, dan spec e2e yang terdampak
   perubahan itu, seluruhnya lolos. Suite e2e penuh hanya dijalankan saat
   penting: penyesuaian backend, penelusuran bug atau galat yang butuh uji
   menyeluruh, atau atas permintaan pemilik proyek (pemilik proyek,
   6 Oktober 2026).
6. Setelah lolos: `git add`, commit dengan pesan lengkap (masalah, keputusan rancangan beserta alasan, dampak, pengujian), lalu push.

Tidak ada perubahan yang diterapkan tanpa persetujuan. Komparasi dan blok
penerapnya dikirim dalam respons yang sama, dan menjalankan blok itulah bentuk
persetujuannya. Setelah dijalankan, hasilnya diverifikasi sebelum melangkah ke
perubahan berikutnya.

## Aturan blok perintah

Bagian **tetap**: hanya diubah atas perintah pemilik proyek.

- Hanya berisi perintah, tanpa baris komentar atau judul di dalamnya.
- Efisien, tidak memakai pager, output ringkas dan mudah disalin.
- Berkas baru di repo frontend-web diberikan sebagai isi lengkap untuk dibuat
  manual, tanpa perintah terminal. Perubahan pada berkas yang sudah ada tetap
  lewat terminal karena harus presisi. Pengecualian: berkas baru yang
  dibangun dari salinan berkas lama (misalnya komponen form bersama) dibuat
  dengan `cp` lalu diubah lewat helper, agar isi lamanya tidak diketik ulang.
- Berkas di luar repo yang bersifat cache atau alat (helper di
  `~/.cache/frontend-web/alat/`, skrip sekali pakai di `/tmp`) dibuat lewat
  blok terminal, bukan manual (ditetapkan pemilik proyek, 21 September 2026).
- Satu blok untuk satu berkas atau satu tujuan. Blok yang panjang tidak dapat
  dijalankan sekaligus dan mudah terpotong saat ditempel.

## Pengecualian alur

Ditetapkan pemilik proyek, di luar teks bagian Tetap agar pemeriksa
dokumen tetap menjaganya:

- Commit yang hanya mengubah dokumentasi tidak menjalankan vitest penuh
  maupun spec e2e (langkah 5 Alur setiap perubahan); gerbangnya
  `npm run docs:periksa` (28 September 2026).

## Cara berbagi konteks

Konteks proyek dibagikan dengan menjalankan perintah terminal dan menempel
outputnya. Berkas diunggah hanya untuk pemeriksaan dokumentasi yang terlalu
panjang untuk ditempel. Karena itu setiap perintah harus ringkas
outputnya: batasi jumlah baris, potong lebar dengan `cut -c1-110`, dan
hindari pager.

Panjang setiap dokumen diperiksa lebih dulu dengan `wc -l` dan `wc -c`.
Dokumen pendek dibaca lewat `cat`, `grep`, atau `sed`, dan hanya yang
benar-benar panjang dikirim sebagai berkas (pemilik proyek, 30 September
2026). Jumlah karakter ikut menentukan: `kontrak/temuan.md` hanya sekitar
100 baris, tetapi baris tabelnya ratusan karakter, sehingga tetap dikirim
sebagai berkas.

Untuk kode, informasi diambil bertahap, bukan dengan `cat` seluruh berkas:

1. **Peta** berkas lewat `grep -n` pada baris penting (pemanggilan API, query,
   mutation, state, handler, dialog), atau hunk `diff` saja untuk
   membandingkan dua halaman.
2. **Potongan** yang dibutuhkan lewat `sed -n 'awal,akhirp'`, dengan nomor
   baris dari peta itu.
3. **Sekaligus saat memetakan sebuah perubahan**: test yang menguji perilaku
   yang akan diubah, seluruh pemanggil fungsi atau hook yang diubah (grep),
   dan jalur backend endpoint-nya utuh. Pada penyesuaian backend `f27f093`,
   potongan yang diambil sedikit demi sedikit menambah banyak putaran.

Satu blok pengambilan dijaga di bawah sekitar 100 baris keluaran. Pengecualian:
pemeriksaan dokumentasi yang strukturnya berubah besar memakai isi utuh berkas
yang berubah (`docs/README.md`), agar pemeriksaannya cukup sekali.

## Kapan berhenti dan bertanya

Beberapa keputusan bukan milik sisi teknis dan harus ditanyakan lebih dulu:

- **Keputusan produk**: apakah sebuah data boleh dilihat semua orang, apakah
  sebuah field masih dibutuhkan, bagaimana perilaku yang benar bila backend dan
  UI berselisih.
- **Cakupan pekerjaan yang membengkak**: bila sebuah perbaikan ternyata
  menyeret banyak berkas di luar rencana, sampaikan pilihannya beserta
  konsekuensi masing-masing, jangan diputuskan sendiri.
- **Menandai test `fixme` atau membuang skenario**: mengurangi cakupan uji
  selalu perlu persetujuan.
- **Menghapus field atau perilaku** yang tampak tidak terpakai, sebelum
  dibuktikan bahwa backend memang tidak memakainya.

Sampaikan pilihan secara ringkas beserta alasan condongnya ke mana, lalu
tunggu jawaban.

Keputusan perbaikan tidak diajukan satu per satu selagi informasi masih
dikumpulkan (pemilik proyek, 21 September 2026). Kumpulkan bukti sampai
cukup, lalu ajukan seluruh temuan yang memerlukan keputusan sekaligus:
masalahnya sekarang, opsi solusi, dan rekomendasi beserta alasannya.
Sebelum keputusan diambil, tidak ada perbaikan yang diterapkan.

Keputusan diajukan lewat dialog pilihan, bukan ditulis sebagai teks,
agar jawabannya diberikan sebelum respons berlanjut (pemilik proyek,
29 September 2026).

## Keputusan berdasar bukti

Setiap keputusan harus bersandar pada kode atau output yang benar-benar
diperiksa, bukan pada dugaan dari gejala. Bila sebuah dugaan muncul, verifikasi
dulu dengan perintah, baru lanjut. Beberapa kali dugaan yang masuk akal ternyata
salah, dan pemeriksaan singkat mencegah bug baru.

## Belajar dari setiap putaran

Setiap debug, penelusuran masalah, dan perbaikan adalah bahan untuk
mempercepat putaran berikutnya. Begitu satu masalah selesai, jawab tiga
pertanyaan ini sebelum melangkah:

1. **Apa yang memperlambat?** Dugaan yang meleset, perintah yang outputnya
   terlalu panjang atau gagal, bukti yang diambil terlambat, atau langkah
   yang diulang.
2. **Apa yang akan menemukannya lebih cepat?** Perintah, urutan pemeriksaan,
   atau sumber bukti yang seharusnya dipakai lebih dulu.
3. **Apakah itu akan berulang?** Bila ya, catat di tempat yang sesuai: pola
   kegagalan ke tabel "Urutan debug kegagalan e2e", perintah baru ke "Perintah
   verifikasi yang biasa dipakai", dan kebiasaan Playwright ke "Catatan
   Playwright" (yang pertama di `inti/pengujian.md`, dua lainnya di
   `referensi/playwright.md`); kesalahan penerapan ke "Disiplin
   saat menerapkan perubahan", dan kebiasaan form atau shell ke catatannya
   (di berkas ini).

Catatan ditulis dalam commit modul yang sama atau commit dokumen penutup
modul itu, selagi konteksnya masih segar. Tulis sebagai aturan yang dapat
langsung diterapkan beserta contoh nyata singkat, bukan sebagai kronologi
kejadian. Bila catatan lama terbukti keliru atau ada cara yang lebih cepat,
perbarui catatan itu alih-alih menambah catatan baru yang bertentangan.
