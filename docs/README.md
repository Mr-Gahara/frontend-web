# Dokumentasi Refactor Frontend Web

Sifat perubahan: **Tetap**, kecuali peta dokumen saat berkas bertambah.

Titik masuk dokumentasi refactor frontend web Tachyon POS. Dokumentasi dibagi
menjadi empat lapis menurut kapan dokumen perlu dibaca, agar di chat baru
cukup dikirim dokumen yang benar-benar dibutuhkan:

- **Inti**: dikirim di setiap chat baru.
- **Per modul**: dikirim hanya saat modul itu dikerjakan.
- **Referensi**: dikirim bila jenis pekerjaannya membutuhkan.
- **Arsip**: tidak perlu dikirim; dibuka hanya untuk menelusuri asal-usul.

Sebelum 19 Oktober 2026, isi keempat lapis berada di `docs/refactor/`.
Sebelum 20 September 2026 seluruhnya ada di `docs/refactor-progress.md`
dan `docs/kontrak-api.md`.

## Memulai sesi baru

Kirim ini sebagai pesan pertama, lalu tambahkan dokumen sesuai jenis
pekerjaan (tabel di bawah):

```bash
cd ~/Documents/frontend-web && cat docs/README.md docs/inti/*.md && git --no-pager log --oneline -12 && git status --short
```

Riwayat commit adalah bagian dari konteks: alasan di balik tiap keputusan
tercatat lengkap di pesan commit, bukan hanya di dokumentasi ini. Untuk
pertanyaan tentang endpoint, bentuk data, atau izin, rujuk `docs/kontrak/`,
mulai dari `kontrak/README.md`. Pastikan juga helper di
`~/.cache/frontend-web/alat/` masih ada (`referensi/helper-dan-shell.md`,
Helper penggantian).

**Pastikan `git status` bersih sebelum memulai modul baru.** Bila ada perubahan
yang belum di-commit, selesaikan atau buang dulu, agar `git diff` tetap dapat
dipakai memeriksa pekerjaan yang sedang berjalan.

### Menjalankan aplikasi

```bash
cd ~/Documents/backend-js && npm run dev
cd ~/Documents/frontend-web && npm run dev
```

Backend harus berjalan lebih dulu: seluruh spec e2e memakai backend sungguhan,
bukan mock, sehingga akan gagal bila backend mati.

## Dokumen yang dikirim per jenis pekerjaan

Inti selalu dikirim. Tabel ini menyebut tambahannya.

| Pekerjaan | Tambahan selain inti |
|---|---|
| Modul atau halaman | `modul/<modul>.md`, `referensi/arsitektur.md`, `referensi/utang-pengujian.md`, dan baris kontrak modul itu dari `kontrak/endpoint.md`, `kontrak/payload.md`, dan `kontrak/izin-halaman.md` (lewat `grep`) |
| Fase UI/UX | `modul/ui-ux.md` dan dokumen modul halaman yang disentuh |
| Penyesuaian backend | `kontrak/temuan.md`, `referensi/keputusan-penyesuaian-backend.md`, dan dokumen modul yang terdampak |
| Laporan untuk tim backend | `kontrak/temuan.md` |
| Menelusuri kegagalan e2e | `referensi/playwright.md` |
| Perubahan besar atau memakai helper | `referensi/helper-dan-shell.md` dan `referensi/disiplin-perubahan.md` |
| Pembaruan dokumentasi | Dokumen yang akan diubah |

Contoh untuk modul gudang:

```bash
cd ~/Documents/frontend-web && cat docs/modul/gudang.md docs/referensi/arsitektur.md
```

## Peta dokumen

### Inti

| Berkas | Isi | Sifat perubahan |
|---|---|---|
| `README.md` | Memulai sesi, dokumen per jenis pekerjaan, peta dokumen, cara memperbarui dokumentasi | **Tetap**, kecuali peta dokumen saat berkas bertambah |
| `inti/status.md` | Pekerjaan berikutnya, metrik, dan utang lintas modul | **Sering**: setiap modul |
| `inti/keputusan-rancangan.md` | Model bisnis MVP dan keputusan rancangan bernomor yang mengikat semua modul | **Jarang**: bertambah saat ada keputusan baru. Butir lama boleh dilengkapi, tetapi tidak dibalik tanpa pembahasan |
| `inti/cara-kerja.md` | Alur setiap perubahan, aturan blok perintah, cara berbagi konteks, kapan berhenti, belajar dari setiap putaran | **Jarang**: bertambah saat ada pelajaran. Alur dan aturan blok perintah **tetap** |
| `inti/pengujian.md` | Kredensial uji, baseline, urutan debug e2e, fixme dan skip | **Sering**: baseline setiap modul |
| `inti/backend.md` | Membaca backend, cache kontrak, penyelarasan permission, bug backend, pemilik modul, bentuk laporan | **Jarang**: bertambah saat prosedurnya berubah |

### Per modul

Setiap dokumen berisi kelompok Keputusan (keputusan produk), Catatan
(catatan teknis per putaran), dan Utang terbuka, sejauh ada.

| Berkas | Cakupan |
|---|---|
| `modul/inventaris.md` | Stock adjustment, jurnal stok, stok dan inventaris gudang, stock opname, pengajuan stok, transfer, pengiriman, penerimaan, dan pembelian stok |
| `modul/produk-kategori.md` | Produk, kategori, dan bahan baku |
| `modul/penjualan.md` | Penjualan, pembayaran, dan cakupan daftar penjualan |
| `modul/reservasi.md` | Sesi booking, aset, tipe aset, dan tarif |
| `modul/keuangan.md` | Akun kas, mutasi arus kas, Pindah Dana, laba rugi, pengeluaran, dan Belanja Stok |
| `modul/jadwal-shift.md` | Jadwal, shift, dan pola roster |
| `modul/gudang.md` | Ruang gudang, pengaturan gudang, dan dashboard gudang |
| `modul/pengaturan-outlet.md` | Profil outlet, pajak, dan metode pembayaran |
| `modul/pelanggan-diskon.md` | Pelanggan dan diskon |
| `modul/profil-login.md` | Profil pengguna, login, dan sidebar |
| `modul/panel-admin.md` | Panel admin: akun klien dan langganan |
| `modul/akses.md` | Gerbang rute, `useAuthGuard`, dan form role |
| `modul/ui-ux.md` | Dashboard outlet, token warna, tabel seragam, dan komponen tanggal dan waktu |

Semua dokumen modul berlabel **Jarang**: bertambah saat modulnya dikerjakan.

### Referensi

| Berkas | Isi | Sifat perubahan |
|---|---|---|
| `referensi/arsitektur.md` | Konteks proyek, fondasi, daftar `features/`, langkah migrasi | **Sering** untuk daftar `features/`; bagian lain **jarang** |
| `referensi/helper-dan-shell.md` | Helper penggantian, catatan shell, dan catatan form | **Jarang**: bertambah saat ada pelajaran |
| `referensi/disiplin-perubahan.md` | Disiplin saat menerapkan perubahan | **Jarang**: bertambah saat ada pelajaran |
| `referensi/playwright.md` | Perintah verifikasi, catatan Playwright, dan spec rujukan | **Jarang**: bertambah saat ada pelajaran atau spec rujukan baru |
| `referensi/utang-pengujian.md` | Utang pengujian yang masih terbuka, per modul | **Sering**: bertambah saat modul dikerjakan; butir yang lunas dipindah ke arsip |
| `referensi/keputusan-penyesuaian-backend.md` | Keputusan yang diambil saat menyesuaikan diri dengan backend, per commit acuan | **Jarang**: bertambah saat penyesuaian backend menghasilkan keputusan |

### Kontrak

| Berkas | Isi | Sifat perubahan |
|---|---|---|
| `kontrak/README.md` | Cara membaca kontrak, acuan, metodologi, keterbatasan, aturan umum (bagian 1 dan 2) | **Jarang** |
| `kontrak/endpoint.md` | Tabel endpoint, sampel gagal, bentuk respons (bagian 3) | **Jarang**: koreksi saat migrasi membuktikan perbedaan |
| `kontrak/payload.md` | Payload operasi tulis (bagian 4) | **Jarang**: koreksi saat migrasi membuktikan perbedaan |
| `kontrak/izin-halaman.md` | Kebutuhan izin per halaman (bagian 5) | **Sering**: baris halaman yang dimigrasikan |
| `kontrak/temuan.md` | Ketidakselarasan yang tercatat (bagian 6) | **Jarang**: bertambah saat ada temuan |
| `kontrak/route-backend.md` | Seluruh route backend (Lampiran A) | **Tetap**: dibangkitkan ulang hanya atas perintah pemilik proyek |

### Arsip

| Berkas | Isi |
|---|---|
| `arsip/riwayat-fase.md` | Fase 0 sampai 3 dan tabel modul yang sudah selesai |
| `arsip/catatan-putaran.md` | Catatan putaran yang tidak terikat satu modul: penyesuaian backend, utang lintas modul yang sudah selesai |
| `arsip/pelajaran.md` | Pelajaran bertanggal per putaran |
| `arsip/keputusan-lama.md` | Keputusan Fase 0 dan error ESLint warisan |
| `arsip/laporan-backend.md` | Daftar laporan yang sudah diserahkan ke tim backend |
| `arsip/riwayat-pengujian.md` | Riwayat baseline, riwayat pelepasan fixme, utang pengujian yang lunas, dan kejadian sesekali yang tidak berulang |

Semua dokumen arsip berlabel **Jarang**: hanya bertambah saat isi dipindah
dari lapis lain; isi lama tidak diubah.

Tiga sifat perubahan:

- **Sering**: diperbarui setiap modul selesai.
- **Jarang**: diperbarui hanya bila ada hal baru (keputusan, pelajaran, temuan,
  koreksi kontrak); isi lama diubah hanya bila terbukti keliru.
- **Tetap**: tidak diubah kecuali atas perintah pemilik proyek.

Sifat perubahan juga tertulis di bawah judul setiap berkas, agar terlihat saat
berkas dibuka sendiri.

## Cara memperbarui dokumentasi

Perbarui setelah setiap modul selesai dan sudah di-commit, sebagai commit
tersendiri atau disatukan dengan commit modulnya.

Berkas dan bagian bertanda **Tetap** tidak disentuh dalam pembaruan biasa.
Bila sebuah pembaruan tampak menuntut perubahan di sana, sampaikan dulu
alasannya dan tunggu perintah pemilik proyek.

**Sebelum commit, setiap perubahan dokumentasi diperiksa sampai benar, valid,
lengkap, detail, dan relevan.** Pembaruan tidak boleh setengah-setengah:
setiap baris yang menyebut hal yang berubah dinilai ulang, termasuk di berkas
lain, lalu yang sudah tidak relevan, tertinggal, atau bertentangan diganti
seluruhnya. Setiap pemeriksaan melaporkan seluruh temuan sekaligus: fakta yang
tidak sesuai bukti, kalimat yang bertentangan antarbagian atau antarberkas,
angka dan rujukan yang tertinggal, serta pelajaran yang belum tercatat. Pada
modul produk dan kategori, pemeriksaan yang dicicil per bagian butuh lebih
dari lima putaran perbaikan.

Bentuk, fakta yang dapat dihitung, dan bagian Tetap diperiksa mesin; kebenaran
isi terhadap perilaku terbaru dinilai lewat pencarian dampak. Isi utuh berkas
yang berubah hanya dikirim (lewat `cat`, atau diunggah bila terlalu panjang)
saat struktur dokumentasi berubah besar. Lihat Pemeriksa dokumentasi dan Tata
cara pembaruan per modul di bawah.

Blok commit dokumen diawali `grep -q` atas teks perbaikan terakhir, lalu
`git add` dirangkai dengan `&&`, sehingga commit tidak berjalan bila blok
perbaikan belum dijalankan. Pada submodul stok, commit sempat berjalan
sebelum blok perbaikan dokumen, dan butuh commit susulan.

Yang berubah setiap kali:

| Berkas | Perubahan |
|---|---|
| `inti/status.md`, pekerjaan berikutnya | Ganti seluruhnya dengan pekerjaan berikutnya beserta pemetaan awalnya. Bila pemetaan belum sempat diambil, cantumkan perintahnya sebagai langkah pertama sesi berikutnya |
| `inti/status.md`, metrik | Perbarui bila angkanya berubah cukup jauh |
| `modul/<modul>.md` | Keputusan produk, catatan putaran, dan utang terbuka modul yang dikerjakan |
| `referensi/arsitektur.md`, daftar `features/` | Tambahkan modul dan berkas baru |
| `inti/pengujian.md`, baseline | Perbarui jumlah test dan commit acuannya |
| `inti/pengujian.md`, fixme dan skip | Tambah atau hapus bila ada perubahan |
| `referensi/utang-pengujian.md` | Tambah utang pengujian modul yang dikerjakan; pindahkan yang lunas ke `arsip/riwayat-pengujian.md` |
| `referensi/playwright.md`, spec rujukan | Tambahkan spec yang memperkenalkan pola baru |
| `kontrak/izin-halaman.md` | Perbarui baris halaman yang dimigrasikan dari `IZIN_HALAMAN` |

Yang ditambahkan bila ada:

- **Keputusan produk**, ke `modul/<modul>.md` di kelompok Keputusan
- **Keputusan rancangan baru** yang berlaku lintas modul, ke
  `inti/keputusan-rancangan.md` dengan nomor butir berikutnya
- **Keputusan saat penyesuaian backend**, ke
  `referensi/keputusan-penyesuaian-backend.md`; bila mengubah perilaku
  sebuah modul, catat juga di dokumen modul itu
- **Pelajaran dari setiap debug, penelusuran, dan perbaikan**, ke tempat
  yang ditunjuk "Belajar dari setiap putaran" di `inti/cara-kerja.md`
- **Temuan backend baru**, ke `kontrak/temuan.md`, ke `inti/pengujian.md`
  bila ada test `fixme`, dan, setelah laporannya diserahkan, ke daftar
  laporan di `arsip/laporan-backend.md`
- **Perubahan kontrak** yang ditemukan saat migrasi (izin, payload, bentuk
  respons), ke `kontrak/endpoint.md`, `kontrak/payload.md`, atau
  `kontrak/izin-halaman.md`

Yang dipindah ke arsip:

- Catatan putaran yang tidak lagi dibutuhkan saat bekerja, utang yang sudah
  lunas, dan pekerjaan yang sudah selesai, ke dokumen arsip yang sesuai.
  Pemindahan memakai alat pemindah, bukan disalin tangan, agar tidak ada
  baris yang hilang.
- Lapis inti dijaga ringkas: bila satu dokumen inti melewati sekitar 400
  baris, pindahkan yang sudah selesai ke arsip, atau yang berupa cara kerja
  terperinci ke referensi.

Perintah untuk menyiapkan angka baru:

```bash
cd ~/Documents/frontend-web
grep -rc ": any" app components lib features | grep -v ":0" | awk -F: "{s+=\$2} END {print \"any: \" s}"
grep -rc "_id" app components features | grep -v ":0" | awk -F: "{s+=\$2} END {print \"_id: \" s}"
grep -rlc "useAuthGuard()" app | wc -l
find app components features -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | awk '$1>700 && $2!="total"' | wc -l
npx vitest run 2>&1 | tail -5
```

Jangan memangkas isi dokumentasi hanya demi keringkasan: dokumentasi ini
menggantikan ingatan, dan bagian yang dibuang akan menjadi pertanyaan berulang
di sesi berikutnya. Isi yang tidak lagi dibutuhkan setiap sesi dipindah ke
lapis yang tepat, bukan dihapus. Bila satu berkas mulai terlalu panjang,
pecah lagi menurut lapisnya, lalu perbarui peta dokumen di atas.

## Pemeriksa dokumentasi

Pemeriksa ada di `scripts/dokumen/`, satu berkas per tugas, dan dijalankan
lewat npm:

| Perintah | Memeriksa | Kapan |
|---|---|---|
| `npm run --silent docs:periksa` | Bentuk (tabel terputus, baris tabel tanpa header, jumlah kolom yang berbeda dari header, baris kepanjangan, baris kosong ganda, blok kode tidak tertutup, rujukan `.md` yang tidak ada, nama berkas lama, label sifat perubahan), fakta (path kode yang disebut, hash commit, judul commit sementara, tabel `features/` beserta berkasnya), dan bagian **Tetap** terhadap `HEAD` | Setiap perubahan dokumentasi, dan sebagai gerbang di blok commit |
| `npm run --silent docs:periksa -- --metrik` | Ditambah metrik di `inti/status.md`, dihitung ulang dan dibandingkan | Otomatis bila `inti/status.md` sedang diubah (menutup modul); manual dengan opsi ini |
| `npm run --silent docs:periksa -- --izinkan-tetap` | Sama, tanpa penjaga bagian Tetap | Hanya bila pemilik proyek memerintahkan perubahan di bagian Tetap |
| `npm run --silent docs:dampak -- --commit <hash> "istilah"` | Seluruh baris dokumentasi yang menyebut berkas yang diubah commit itu, termasuk bentuk prosanya (`jurnalStok` dan `jurnal-stok` juga dicari sebagai "jurnal stok"), dan istilah tambahan | Setiap menutup modul, sebelum menyusun pembaruan dokumentasi |

Rujukan ke dokumen lain wajib menyebut lapisnya, misalnya `inti/status.md`
atau `modul/gudang.md`. Rujukan tanpa folder hanya sah untuk README ini dan
untuk sesama dokumen kontrak.

Pemeriksa keluar dengan kode gagal bila ada temuan, sehingga blok commit
berhenti sebelum `git add`. Yang tidak dapat diperiksanya: apakah sebuah
kalimat masih benar terhadap perilaku terbaru, apakah keputusan atau pelajaran
sudah tercatat, dan apakah isi antarberkas bertentangan. Ketiganya dinilai
lewat pencarian dampak dan diff.

## Tata cara pembaruan per modul

1. **Kode selesai dan di-commit** (`inti/cara-kerja.md`, Alur setiap
   perubahan). Angka yang dijalankan dicatat: vitest, serta e2e lolos dan
   skipped dari spec terdampak, atau dari suite penuh bila dijalankan.
2. **Laporan backend**, bila ada temuan, disusun setelah commit bersih
   (`inti/backend.md`).
3. **Pencarian dampak**:
   `npm run --silent docs:dampak -- --commit <hash> "istilah"`. Istilah
   perilaku ditambahkan manual bila perubahannya tidak terlihat dari nama
   berkas, misalnya "Semua Lokasi" atau "owner".
4. **Penilaian dampak dan daftar perubahan.** Setiap baris hasil pencarian
   dinilai: masih benar, perlu diperbarui, atau perlu dihapus. Baris
   bertanda `[judul]` berarti seluruh bagian di bawah judul itu ikut dinilai.
   Hasilnya dilaporkan sebagai tabel berkas, baris, dan penilaian, bersama
   daftar perubahan per berkas (tabel "Yang berubah setiap kali" di atas).
   Perubahan di bagian **Tetap** disebut terpisah dan menunggu perintah
   pemilik proyek.
5. **Blok penerap** dijalankan pemilik proyek. Blok berhenti tanpa menulis
   bila ada teks lama yang tidak cocok tepat satu kali.
6. **Verifikasi**: `npm run --silent docs:periksa` (metrik ikut dihitung
   karena `inti/status.md` berubah), lalu perintah diff di bawah untuk
   melihat persis baris yang berubah, termasuk butir daftar. Diff dicocokkan
   dengan daftar di langkah 4 dan dengan bukti: keluaran test, `git log`,
   dan kode.

```bash
   git --no-pager diff -U0 docs | grep -E '^[-+]' | grep -vE '^(\+\+\+|---) ' | cut -c1-120
```
7. **Pemeriksaan utuh** hanya bila struktur berubah besar (berkas baru atau
   bagian dipindah). Seluruh temuan dilaporkan dalam satu putaran.
8. **Commit** dengan gerbang di awal blok: `grep -q` atas teks perbaikan
   terakhir, lalu `npm run --silent docs:periksa`.