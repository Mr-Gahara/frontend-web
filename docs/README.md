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
cd ~/Documents/frontend-web && cat docs/README.md docs/refactor/*.md && git log --oneline -12 && git status --short
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
| `refactor/keputusan.md` | Keputusan produk per modul dan keputusan rancangan bernomor | **Jarang**: bertambah saat ada keputusan baru. Butir yang sudah ada **tetap** |
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

**Sebelum commit, isi utuh setiap berkas dokumentasi yang berubah dibaca
ulang** (dikirim ke percakapan lewat `cat`, atau diunggah bila terlalu panjang
untuk ditempel) sampai benar, valid, lengkap, detail, dan
relevan. Setiap pembaruan tidak boleh setengah-setengah: baca berkas yang
berubah dari awal sampai akhir, periksa juga kesesuaiannya dengan berkas lain
yang dirujuknya, cari setiap bagian yang sudah tidak relevan, tertinggal, atau
bertentangan dengan keadaan sekarang, lalu ganti seluruhnya. Setiap
pemeriksaan melaporkan seluruh temuan sekaligus: fakta yang tidak sesuai
bukti, kalimat yang bertentangan antarbagian atau antarberkas, angka dan
rujukan yang tertinggal, serta pelajaran yang belum tercatat. Pada modul
produk dan kategori, pemeriksaan yang dicicil per bagian butuh lebih dari
lima putaran perbaikan.

Kerapian diperiksa dengan `node scripts/periksa-dokumen.cjs`: tabel terputus,
baris kepanjangan, baris kosong ganda, blok kode tidak tertutup, rujukan ke
berkas yang tidak ada, nama berkas lama, dan label sifat perubahan. Keluarannya
hanya temuan, sehingga isi utuh tidak perlu dikirim ulang untuk memeriksa
kerapian. Perbaikan susulan setelah pemeriksaan utuh cukup diverifikasi lewat
pemeriksa itu ditambah baris yang berubah (`git diff -U1 docs`), bukan isi utuh.
Pemeriksaan utuh tetap dilakukan saat struktur dokumentasi berubah besar.

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
