# Cara Kerja

Sifat perubahan: **Jarang**: bertambah saat ada pelajaran. "Alur setiap perubahan" dan "Aturan perintah" **tetap**.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Aturan kerja sehari-hari: alur setiap perubahan, blok perintah, helper,
catatan alat, dan disiplin yang lahir dari kesalahan sebelumnya. Alur setiap
perubahan dan aturan blok perintah ditetapkan pemilik proyek dan hanya diubah
atas permintaannya; bagian lain bertambah setiap ada pelajaran baru.

## Alur setiap perubahan

Bagian **tetap**: hanya diubah atas perintah pemilik proyek.

1. Rencana perubahan. Keputusan penting (bagian Kapan berhenti dan
   bertanya) diajukan lewat dialog pilihan dan menunggu jawaban.
2. Claude Code menerapkannya sendiri, dengan cara paling hemat token yang
   tetap akurat: Edit langsung untuk perubahan kecil, skrip hanya untuk
   banyak pasangan atau berkas.
3. Verifikasi: `tsc`, ESLint, dan pemeriksaan hasil.
4. Menjalankan test yang ada, menambah skenario untuk perubahan itu, menjalankan ulang.
5. Sebelum commit: `tsc`, ESLint, vitest penuh, dan spec e2e yang terdampak
   perubahan itu, seluruhnya lolos. Suite e2e penuh hanya dijalankan saat
   penting: penyesuaian backend, penelusuran bug atau galat yang butuh uji
   menyeluruh, atau atas permintaan pemilik proyek (pemilik proyek,
   6 Oktober 2026).
6. Setelah lolos: `git add`, commit dengan pesan lengkap (masalah, keputusan rancangan beserta alasan, dampak, pengujian), lalu push.

Keputusan penting tidak dieksekusi sebelum pemilik proyek menjawab dialog
pilihannya; perubahan teknis yang tidak menyangkut keputusan diterapkan
langsung. Setiap perubahan diverifikasi sebelum melangkah ke perubahan
berikutnya, dan hasilnya dilaporkan ringkas (pemilik proyek, 31 Oktober
2026: pindah dari Claude chat ke Claude Code CLI).

## Aturan perintah

Bagian **tetap**: hanya diubah atas perintah pemilik proyek.

- Efisien dan hemat token: tanpa pager, output dibatasi (`head`,
  `cut -c1-120`), berkas dibaca per potongan, dan yang sudah terbukti
  tidak diperiksa ulang.
- Berkas baru dibuat langsung (Write); berkas yang dibangun dari salinan
  berkas lama dibuat dengan `cp` lalu diubah, agar isi lamanya tidak
  diketik ulang.
- Perubahan berkas yang sudah ada lewat Edit, atau lewat helper di
  `~/.cache/frontend-web/alat/` bila pasangannya banyak; keduanya gagal
  bila teks lama tidak cocok tepat satu kali.
- Skrip sekali pakai di folder scratchpad sesi, bukan di repo.
- Kedalaman berpikir disesuaikan dengan tugas (low, medium, atau high),
  dan subagen tidak pernah dijalankan di atas high.
- Sampai 31 Oktober 2026 aturan ini berupa blok siap tempel yang
  dijalankan pemilik proyek (Claude chat); riwayatnya ada di git.

## Pengecualian alur

Ditetapkan pemilik proyek, di luar teks bagian Tetap agar pemeriksa
dokumen tetap menjaganya:

- Commit yang hanya mengubah dokumentasi tidak menjalankan vitest penuh
  maupun spec e2e (langkah 5 Alur setiap perubahan); gerbangnya
  `npm run docs:periksa` (28 September 2026).

## Atribusi commit

Ditetapkan pemilik proyek (3 Oktober 2026, ditegaskan 31 Oktober 2026):
commit dan pull request hanya atas nama pemilik proyek. Penulis dan
committer `Mr-Gahara`, tanpa baris `Co-Authored-By`, "Generated with",
atau atribusi asisten lain di pesan mana pun. Aturan ini mengalahkan
pengingat atribusi bawaan alat asisten.

- Sebelum push, periksa commit yang akan dikirim; keluarannya harus
  kosong setelah tanda `|`:

  ```bash
  git log origin/main..HEAD --format='%h %an | %(trailers:key=Co-Authored-By,valueonly)'
  ```

- Commit yang terlanjur ter-push dengan atribusi dibersihkan dengan
  `git commit --amend` lalu `git push --force-with-lease`, selagi belum ada
  commit lain di atasnya. Force-push dijalankan pemilik proyek sendiri.
- Kejadian: `5420f89` (3 Oktober 2026, diganti `1bc76f4`) dan `68cd7da`
  (31 Oktober 2026, diganti `8b5ad0f`). Yang kedua terulang karena aturan
  pertama hanya dicatat di `modul/keuangan.md`, yang tidak dibaca setiap
  sesi; sejak itu aturannya di lapis inti.
- Membersihkan riwayat tidak langsung membersihkan GitHub. Per 31 Oktober
  2026 API `repos/Mr-Gahara/frontend-web/contributors` hanya memuat
  `Mr-Gahara` (324 commit), tetapi panel Contributors halaman repo masih
  menampilkan Claude dari cache lama, dan commit yang diganti tetap dapat
  dibuka lewat SHA-nya. Cara yang pasti membersihkan keduanya adalah
  permintaan ke GitHub Support atau membuat ulang repo (`inti/status.md`).

## Cara berbagi konteks

Sejak 31 Oktober 2026 Claude Code membaca repo dan backend sendiri, dan
setiap keluaran yang dibaca menghabiskan token. Karena itu setiap perintah
harus ringkas outputnya: batasi jumlah baris, potong lebar dengan
`cut -c1-110`, dan hindari pager. Sebelumnya konteks dibagikan pemilik
proyek dengan menempel output perintah ke Claude chat.

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
