# Backend

Sifat perubahan: **Jarang**: bertambah saat ada laporan untuk tim backend.

Backend (`~/Documents/backend-js`) hanya dibaca dari sisi frontend. Berkas ini
memuat cara membaca backend dan cache kontrak, cara menangani bug backend, dan
daftar laporan yang sudah diserahkan ke tim backend.

## Mengambil informasi dari backend

Backend hanya dibaca, tidak pernah diubah dari sisi frontend. Perintah yang
sering dipakai (`BE=~/Documents/backend-js`):

```bash
BE=~/Documents/backend-js
grep -rn "checkPermission" "$BE/routes/<modul>Route.js" | cut -c1-120
grep -n "wajib\|allowlist\|enum" "$BE/validators/<modul>Validator.js" | cut -c1-120
grep -rn "<namaField>" "$BE/services/<modul>Service.js" | cut -c1-140
```

Untuk menilai apakah sebuah perilaku backend disengaja, lihat riwayatnya. Pada
modul produk, `blame` menunjukkan bahwa pemeriksaan resep yang berbeda di
`create` dan `update` berasal dari satu commit yang sama:

```bash
git -C "$BE" --no-pager blame -L <awal>,<akhir> services/<modul>Service.js | cut -c1-120
git -C "$BE" --no-pager log --format='%h %ad %s' --date=short -5 -- services/<modul>Service.js | cut -c1-120
```

Tiga lapis yang harus dibedakan, karena sering tidak sejalan:

1. **Route** menentukan izin yang diperiksa.
2. **Validator** menentukan field yang diperiksa, tetapi tidak membuang field lain.
3. **Service** dapat memakai field yang tidak ada di validator.

Karena itu, sebelum menghapus sebuah field dari payload frontend, periksa dulu
pemakaiannya di service. Kekeliruan semacam ini pernah terjadi dua kali:
`locationID` dan `stokMinimum` pada bahan baku.

## Cache kontrak API

Hasil pemeriksaan respons nyata tersimpan di
`~/.cache/frontend-web/kontrak/kontrak-respons.json`. Berguna untuk melihat
bentuk respons sebuah endpoint tanpa memanggilnya:

```bash
node -e 'const r=require(process.env.HOME+"/.cache/frontend-web/kontrak/kontrak-respons.json");console.log(JSON.stringify(r["/<endpoint>"].contoh.data[0],null,1).slice(0,400))'
```

## Bila menemukan bug backend

Urutannya:

1. **Verifikasi bahwa itu memang bug backend**, dengan membaca route, validator,
   controller, atau service terkait. Gejala di frontend saja tidak cukup.
2. **Jangan ubah backend.** Frontend menyesuaikan diri agar pekerjaan tidak
   tertahan, misalnya dengan mengirim body kosong pada `pin-refresh`.
3. **Catat penanganan sementara itu di komentar kode**, beserta alasannya, agar
   dapat dibersihkan setelah backend diperbaiki.
4. **Bila perilaku tidak dapat diakali**, tandai skenario ujinya `test.fixme`
   dengan keterangan apa yang ditunggu, lalu catat di
   `pengujian.md` (Test yang ditandai fixme dan skip bersyarat).
5. **Setelah commit bersih**, tulis laporan untuk tim backend sebagai teks siap
   salin di percakapan. Berkasnya di `~/Documents/catatan-backend/` dibuat
   sendiri oleh pemilik proyek, bukan lewat terminal.

Bentuk tiap temuan dalam laporan:

- **Bukti** — request dan respons nyata, atau potongan kode beserta nomor baris
- **Penyebab** — apa yang membuatnya terjadi
- **Kenapa penting** — dampaknya bagi pengguna atau frontend lain
- **Saran** — arah perbaikan, tanpa memaksakan implementasi
- **Penanganan sementara di frontend** — agar tim backend tahu apa yang akan
  dibersihkan setelah perbaikan

Temuan diurutkan berdasarkan tingkat kepentingan, dan ditutup tabel ringkasan
prioritas.

## Catatan untuk tim backend

Berkasnya disimpan pemilik proyek di `~/Documents/catatan-backend/`:

- `README.md` — temuan 1 sampai 6 dari Fase 1
- `catatan-lanjutan-backend-hapus-pengguna-dan-aturan-pin.md` — temuan 7 sampai 9
- Laporan Fase 2 — 13 temuan, sudah diserahkan ke tim backend
- Laporan modul produk dan kategori — 8 temuan, disusun 20 September 2026:
  stok tertimpa 0 saat edit produk, hapus kategori tanpa pemeriksaan
  pemakaian, keberadaan kategori tidak diperiksa, field duplikat kategori yang
  salah, satuan resep lebih sempit dari satuan bahan baku, cache daftar produk
  tidak dibersihkan saat kategori berubah, detail produk tanpa timestamp, dan
  import tidak terpakai
- Laporan submodul stock adjustment — 1 temuan, disusun 20 September 2026:
  mapper membaca empat field yang tidak ada di model dan tidak mengirim
  `referenceType`
- Laporan submodul stock opname — 2 temuan, disusun 20 September 2026:
  simpan hitungan menolak isian kosong sehingga simpan sementara sebagian
  tidak mungkin, dan data tidak dibatasi per lokasi (perlu keputusan)

Cakupan laporan Fase 2: `pin-refresh` 500 tanpa body, `GET /shift`
500, validator pola roster, hapus pengguna, field yang dipakai service tetapi
tidak ada di validator, envelope tidak seragam, identitas tidak seragam,
33 endpoint tanpa `checkPermission`, 17 permission tanpa route, nama permission
pengiriman stok tidak sejalan, permission jadwal belum ada, allowlist tidak
universal, dan konfirmasi kebijakan sesi web tunggal.
