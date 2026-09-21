# Dokumentasi Refactor Frontend Web

Sifat perubahan: **Tetap**, kecuali peta dokumen saat berkas bertambah.

Titik masuk dokumentasi refactor frontend web Tachyon POS. Dokumentasi dipecah
menurut sifat perubahannya: berkas yang berubah setiap modul terpisah dari
berkas yang jarang berubah dan dari berkas yang tetap. Sebelum 20 September
2026, seluruh isi `refactor/` berada di satu berkas `docs/refactor-progress.md`
dan seluruh isi `kontrak/` di `docs/kontrak-api.md`.

## Memulai sesi baru

Kirim ini sebagai pesan pertama:

```bash
cd ~/Documents/frontend-web && cat docs/README.md docs/refactor/*.md && git --no-pager log --oneline -12 && git status --short
```

Riwayat commit adalah bagian dari konteks: alasan di balik tiap keputusan
tercatat lengkap di pesan commit, bukan hanya di dokumentasi ini. Untuk
pertanyaan tentang endpoint, bentuk data, atau izin, rujuk `docs/kontrak/`,
mulai dari `docs/kontrak/README.md`. Pastikan juga helper di
`~/.cache/frontend-web/alat/` masih ada (`refactor/cara-kerja.md`, Helper
penggantian).

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

## Peta dokumen

| Berkas | Isi | Sifat perubahan |
|---|---|---|
| `README.md` | Memulai sesi, peta dokumen, cara memperbarui dokumentasi | **Tetap**, kecuali peta dokumen saat berkas bertambah |
| `refactor/status.md` | Fase yang sudah selesai, tabel Fase 3, metrik, pekerjaan berikutnya, utang kecil | **Sering**: setiap modul |
| `refactor/keputusan.md` | Keputusan produk per modul dan keputusan rancangan bernomor | **Jarang**: bertambah saat ada keputusan baru. Butir lama boleh dilengkapi, tetapi tidak dibalik tanpa pembahasan |
| `refactor/arsitektur.md` | Konteks proyek, fondasi, daftar `features/`, langkah migrasi | **Sering** untuk daftar `features/`; bagian lain **jarang** |
| `refactor/cara-kerja.md` | Alur perubahan, aturan blok perintah, helper, catatan shell dan form, disiplin | **Jarang**: bertambah saat ada pelajaran. Alur dan aturan blok perintah **tetap** |
| `refactor/pengujian.md` | Perintah verifikasi, baseline, debug e2e, catatan Playwright, fixme dan skip, utang pengujian, spec rujukan | **Sering**: baseline dan spec rujukan setiap modul |
| `refactor/backend.md` | Cara membaca backend, cache kontrak, penanganan bug backend, daftar laporan | **Jarang**: bertambah saat ada laporan |
| `kontrak/README.md` | Cara membaca kontrak, acuan, metodologi, keterbatasan, aturan umum (bagian 1 dan 2) | **Jarang** |
| `kontrak/endpoint.md` | Tabel endpoint, sampel gagal, bentuk respons (bagian 3) | **Jarang**: koreksi saat migrasi membuktikan perbedaan |
| `kontrak/payload.md` | Payload operasi tulis (bagian 4) | **Jarang**: koreksi saat migrasi membuktikan perbedaan |
| `kontrak/izin-halaman.md` | Kebutuhan izin per halaman (bagian 5) | **Sering**: baris halaman yang dimigrasikan |
| `kontrak/temuan.md` | Ketidakselarasan yang tercatat (bagian 6) | **Jarang**: bertambah saat ada temuan |
| `kontrak/route-backend.md` | Seluruh route backend (Lampiran A) | **Tetap**: dibangkitkan ulang hanya atas perintah pemilik proyek |

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
| `refactor/status.md`, tabel Fase 3 | Isi commit hash modul yang selesai, tandai modul berikutnya. Bila dokumentasi di-commit bersama modulnya, tulis judul commit dan ganti dengan hash pada pembaruan berikutnya |
| `refactor/status.md`, metrik | Perbarui bila angkanya berubah cukup jauh |
| `refactor/status.md`, pekerjaan berikutnya | Ganti seluruhnya dengan modul berikutnya beserta pemetaan awalnya. Bila pemetaan belum sempat diambil, cantumkan perintahnya sebagai langkah pertama sesi berikutnya |
| `refactor/arsitektur.md`, daftar `features/` | Tambahkan modul baru |
| `refactor/pengujian.md`, baseline | Perbarui jumlah test dan commit acuannya |
| `refactor/pengujian.md`, fixme dan skip | Tambah atau hapus bila ada perubahan |
| `refactor/pengujian.md`, spec rujukan | Tambahkan spec yang memperkenalkan pola baru |
| `kontrak/izin-halaman.md` | Perbarui baris halaman yang dimigrasikan dari `IZIN_HALAMAN` |

Yang ditambahkan bila ada:

- **Keputusan produk**, ke `refactor/keputusan.md` di bawah modulnya
- **Keputusan rancangan baru** yang berlaku lintas modul, ke
  `refactor/keputusan.md` dengan nomor butir berikutnya
- **Pelajaran dari setiap debug, penelusuran, dan perbaikan**, ke
  `refactor/cara-kerja.md` atau `refactor/pengujian.md`, mengikuti aturan
  "Belajar dari setiap putaran"
- **Temuan backend baru**, ke daftar laporan di `refactor/backend.md`, ke
  `refactor/pengujian.md` bila ada test `fixme`, dan ke `kontrak/temuan.md`
- **Perubahan kontrak** yang ditemukan saat migrasi (izin, payload, bentuk
  respons), ke `kontrak/endpoint.md`, `kontrak/payload.md`, atau
  `kontrak/izin-halaman.md`

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
di sesi berikutnya. Bila satu berkas mulai terlalu panjang, pecah lagi menurut
sifat perubahannya, lalu perbarui peta dokumen di atas.

## Pemeriksa dokumentasi

Pemeriksa ada di `scripts/dokumen/`, satu berkas per tugas, dan dijalankan
lewat npm:

| Perintah | Memeriksa | Kapan |
|---|---|---|
| `npm run --silent docs:periksa` | Bentuk (tabel terputus, baris tabel tanpa header, jumlah kolom yang berbeda dari header, baris kepanjangan, baris kosong ganda, blok kode tidak tertutup, rujukan `.md` yang tidak ada, nama berkas lama, label sifat perubahan), fakta (path kode yang disebut, hash commit, judul commit sementara, tabel `features/` beserta berkasnya, satu **Berikutnya** per tabel status), dan bagian **Tetap** terhadap `HEAD` | Setiap perubahan dokumentasi, dan sebagai gerbang di blok commit |
| `npm run --silent docs:periksa -- --metrik` | Ditambah metrik di `status.md`, dihitung ulang dan dibandingkan | Otomatis bila `status.md` sedang diubah (menutup modul); manual dengan opsi ini |
| `npm run --silent docs:periksa -- --izinkan-tetap` | Sama, tanpa penjaga bagian Tetap | Hanya bila pemilik proyek memerintahkan perubahan di bagian Tetap |
| `npm run --silent docs:dampak -- --commit <hash> "istilah"` | Seluruh baris dokumentasi yang menyebut berkas yang diubah commit itu, termasuk bentuk prosanya (`jurnalStok` dan `jurnal-stok` juga dicari sebagai "jurnal stok"), dan istilah tambahan | Setiap menutup modul, sebelum menyusun pembaruan dokumentasi |

Pemeriksa keluar dengan kode gagal bila ada temuan, sehingga blok commit
berhenti sebelum `git add`. Yang tidak dapat diperiksanya: apakah sebuah
kalimat masih benar terhadap perilaku terbaru, apakah keputusan atau pelajaran
sudah tercatat, dan apakah isi antarberkas bertentangan. Ketiganya dinilai
lewat pencarian dampak dan diff.

## Tata cara pembaruan per modul

1. **Kode selesai dan di-commit** (`refactor/cara-kerja.md`, Alur setiap
   perubahan). Angka dari suite penuh dicatat: vitest, e2e lolos, dan skipped.
2. **Laporan backend**, bila ada temuan, disusun setelah commit bersih
   (`refactor/backend.md`).
3. **Pencarian dampak**:
   `npm run --silent docs:dampak -- --commit <hash> "istilah"`. Istilah
   perilaku ditambahkan manual bila perubahannya tidak terlihat dari nama
   berkas, misalnya "Semua Lokasi" atau "owner".
4. **Penilaian dampak dan daftar perubahan.** Setiap baris hasil pencarian
   dinilai: masih benar, perlu diperbarui, atau perlu dihapus. Baris
   bertanda `[judul]` berarti seluruh bagian di bawah judul itu ikut dinilai.
   Hasilnya dilaporkan sebagai tabel berkas, baris, dan penilaian, bersama daftar
   perubahan per berkas (tabel "Yang berubah setiap kali" di atas).
   Perubahan di bagian **Tetap** disebut terpisah dan menunggu perintah
   pemilik proyek.
5. **Blok penerap** dijalankan pemilik proyek. Blok berhenti tanpa menulis
   bila ada teks lama yang tidak cocok tepat satu kali.
6. **Verifikasi**: `npm run --silent docs:periksa` (metrik ikut dihitung karena
   `status.md` berubah), lalu perintah diff di bawah untuk melihat persis
   baris yang berubah, termasuk butir daftar. Diff dicocokkan dengan daftar di
   langkah 4 dan dengan bukti: keluaran test, `git log`, dan kode.

   ```bash
   git --no-pager diff -U0 docs | grep -E '^[-+]' | grep -vE '^(\+\+\+|---) ' | cut -c1-120
   ```
7. **Pemeriksaan utuh** hanya bila struktur berubah besar (berkas baru atau
   bagian dipindah). Seluruh temuan dilaporkan dalam satu putaran.
8. **Commit** dengan gerbang di awal blok: `grep -q` atas teks perbaikan
   terakhir, lalu `npm run --silent docs:periksa`.
