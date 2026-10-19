# Backend

Sifat perubahan: **Jarang**: bertambah saat ada laporan untuk tim backend.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

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
grep -rnE '\b<namaFungsi>\b' "$BE" --include='*.js' --exclude-dir=node_modules --exclude-dir=__tests__ | cut -c1-140
grep -nE 'populate\(' "$BE/services/<modul>Service.js" | cut -c1-140
```

Data di basis data development dapat dibaca lewat skrip Node yang memakai
`mongoose` dan `.env` milik backend; URI Mongo diambil dari nilai `.env`
yang diawali `mongodb` dan tidak dicetak. Skrip selalu memutus koneksi di
`finally`. Operasi yang harus melewati aturan backend, misalnya
membatalkan surat jalan agar stok gudang kembali, dijalankan lewat API
dengan skrip yang masuk lewat `/api/akun/auth/login` lalu
`/api/pengguna/pin-login`, bukan dengan menulis langsung ke basis data.
Login PIN dari skrip mengambil alih sesi web pengguna itu. Skrip yang
dipakai berulang disimpan sebagai helper (`referensi/helper-dan-shell.md`, Helper
penggantian): `tinjau-surat-jalan.js` untuk membaca surat jalan beserta
jurnal dan pengajuannya, dan `api-surat-jalan.js` untuk daftar, detail,
batal, dan terima lewat API. Skrip sekali pakai tetap di `/tmp`.

Data development adalah data pengujian; belum ada produksi (pemilik
proyek, 21 September 2026). Yang dijaga adalah kebenaran alur dan aturan,
bukan isi datanya: spec dan skrip boleh membuat, mengubah, dan membatalkan
data, dan data cacat yang ditemukan dinilai sebagai sisa pengujian. Skrip
yang mengubah data tetap punya mode tinjau, dan perubahannya dicatat di
laporan untuk tim backend bila menyangkut bukti temuan.

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
   Validator dapat dipanggil dari route, controller, atau service; stock opname
   memanggil kelimanya dari service, sehingga tidak terlihat dari route.
3. **Service** dapat memakai field yang tidak ada di validator, dan aturannya
   bisa bertentangan dengan validator di depannya (`kontrak/temuan.md` butir 22).

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

## Menyelaraskan permission basis data development

Seed permission backend tidak menghapus nama yang dikeluarkan dari daftar.
`seeds/permissionSeed.js` mode bawaan hanya meng-upsert per nama, dan
`--reset` membuat ulang seluruh permission dengan `_id` baru, sehingga
setiap role selain Owner kehilangan izinnya (`kontrak/temuan.md` butir
97). Karena itu, setiap kali backend berpindah versi, permission basis
data disilang dengan seed lebih dulu, lalu diselaraskan dengan urutan ini
(1 Oktober 2026, keputusan PY3a; basis datanya lokal, `localhost:27017`):

1. Tinjau dengan skrip baca-saja: jumlah permission basis data dan seed,
   nama di luar seed, nama seed yang belum ada, dan role pemegangnya.
2. Nama yang dikeluarkan dari seed dilepas dari role (`$pull`) lalu
   dihapus, hanya bila daftar di luar seed sama dengan nama yang
   diharapkan, agar permission kustom tidak ikut terhapus.
3. `node seeds/permissionSeed.js` mode sinkron, tanpa `--reset`, dengan
   `MONGO_URI` dari `.env`.
4. `node seeds/seedOwnerPermission.js`, yang menimpa izin setiap role
   Owner dengan seluruh permission basis data kecuali permission
   platform. Langkah 2 harus lebih dulu, agar Owner tidak kembali
   memegang nama lama.
5. Cache Redis `permissions:all`, `role:list:*`, dan `auth:pengguna:*`
   dihapus, lalu tinjauan diulang.

Sejak backend `nizar` `3c9c19f`, indeks pelanggan dan posisi juga
diselaraskan setiap berpindah versi lewat `npm run db:indeks` di repo
backend; skripnya berhenti tanpa mengubah apa pun bila ada data yang
bentrok.

Skrip tinjau dan penghapusnya sekali pakai di `/tmp`
(`rekonsiliasi-permission.js`), dengan mode tinjau sebagai bawaan.

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
   `inti/pengujian.md` (Test yang ditandai fixme dan skip bersyarat).
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

## Pemilik modul backend

Backend dikerjakan tiga orang di tiga cabang remote: `ridho`, `nizar`, dan
`yoga`. Setiap cabang memuat pekerjaan pemiliknya dan tidak selalu memuat
pekerjaan yang lain, sehingga satu cabang saja tidak menggambarkan backend
seutuhnya. Sumber kepemilikan adalah
`~/Documents/backend-js/docs/pemilik.md`, bukan
riwayat commit: `kategoriBebanService.js` ditulis Nizar, tercatat milik
Ridho, lalu dipindahkan ke Yoga di `149f17f`.

Cabang `ridho` adalah tempat ketiganya disatukan, dan menjadi acuan web
sejak `92d4f27` (7 Oktober 2026: `yoga` `55328f1` digabung `nizar`
`9d45efc`). Setiap kali `yoga` atau `nizar` maju, `ridho` digabung ulang
sebelum web disesuaikan. Pada 8 Oktober 2026 `nizar` maju ke `8dc6211`
tepat di atas `92d4f27`, sehingga `ridho` lokal cukup di-fast-forward;
bila satu sisi tidak punya commit di luar sisi lain, pemeriksaan
kelengkapan di bawah tidak diperlukan. `ridho` `8dc6211` di-push pada
hari yang sama.
Pada 11 Oktober 2026 `yoga` maju ke `2dd57aa`, 42 commit di atas
`8dc6211`, dan sudah memuat `nizar` `b0a77d4`, sehingga `ridho` kembali
cukup di-fast-forward. Gabungan Yoga sendiri (`1d3f2d7`) tetap diperiksa
kelengkapannya untuk berkas yang diubah kedua induknya.
Pada 16 Oktober 2026 `yoga` maju sembilan commit dan `nizar` satu commit
di atas `2dd57aa`, ke arah yang berbeda. `ridho` di-fast-forward ke
`yoga` `723b12f`, lalu `nizar` `38f523a` digabung menjadi `7d28135` dan
di-push. Konflik hanya di `docs/pengembangan/klien.md`: B96 (Yoga) serta
B89 dan B90 (Nizar) ditambahkan di titik yang sama, dan B89 serta B90
dipakai keduanya. Nomornya tidak diubah; baris Nizar dipindah ke bagian
Modul Akun Kas, Pembayaran, dan Penjualan, paragraf nomor kembar
ditambahkan seperti B27 sampai B38, dan nomor baru dimulai dari B97
(keputusan RG2a). Setelah itu permission diselaraskan
(`delete-beban-operasional` dibuang dari seed), lalu
`npm run db:lokasi-penjualan` dan `npm run db:indeks` dijalankan.

Gabungan tanpa konflik belum tentu lengkap. Pada `92d4f27`, gabung
otomatis membuang lima bagian milik Nizar dari
`docs/pengembangan/klien.md` backend tanpa tanda konflik, karena bagian
itu sudah tertimpa di cabang `yoga`. Karena itu hasil gabungan
dibandingkan dengan kedua ujung cabang dan titik cabangnya sebelum
di-commit:

- tidak ada berkas dari salah satu sisi yang absen;
- tidak ada baris yang ditambahkan salah satu sisi sejak titik cabang
  yang hilang;
- baris lama yang diganti sisi lain berada di modul milik pengubahnya,
  dan yang berada di dokumen bersama dibaca satu per satu.

Sesudah itu suite test backend yang disentuh kedua sisi dijalankan,
permission basis data diselaraskan, dan suite e2e web penuh dijalankan.
Nomor B27 sampai B38 di `docs/pengembangan/klien.md` backend dipakai dua
kali dan dirujuk dengan pemiliknya, misalnya B36 (Yoga).

Keadaan per 7 Oktober 2026 (berkas pemilik di `yoga` `55328f1`):

| Pemilik | Nama git | Cakupan |
|---|---|---|
| Ridho | `Mr-Gahara` | Auth, sesi, RBAC, tenant, keamanan, deploy, SDM (absensi, shift, jadwal shift, pola roster, izin cuti, kontrak kompensasi), paket membership, serta `middleware/` dan `config/` |
| Yoga | `Yoga Pradana` | Inventaris, gudang, WMS (pengajuan stok, transfer stok, stock opname, jurnal stok), produk, pajak, beban operasional, kategori beban, dashboard |
| Nizar | `Nizar Khawarizmi` | Kasir dan uang toko (penjualan, pembayaran, metode pembayaran, diskon, akun kas, transfer saldo), pelanggan, membership, posisi, booking (sesi booking, aset, tipe aset, tarif), laporan |

`seeds/permissionSeed.js` tercatat belum ditentukan pemiliknya dan diubah
lebih dari satu orang, sehingga temuan tentang isi seed dialamatkan ke
pemilik modul yang memakai izinnya.

Yang dibaca di awal setiap penyesuaian, di setiap cabang, sebelum kontrak
dicocokkan atau laporan disusun:

- Berkas pemilik di atas: siapa memegang modul apa.
- `docs/pengembangan/status/<nama>.md`, diambil dari cabang pemiliknya:
  pekerjaan selesai dan utang yang sudah mereka ketahui.
- `docs/pengembangan/status.md` bagian Temuan untuk pemilik modul lain.
- `docs/pengembangan/klien.md`: status tiap butir laporan web
  (`Perlu diperbaiki`, `Perlu diputuskan`, `Menunggu verifikasi`,
  `Selesai`, `Bukan backend`, `Dicatat`) dan label B untuk perubahan yang
  perlu diteruskan ke klien.

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; for b in ridho nizar yoga; do echo "== $b $(git -C "$BE" rev-parse --short origin/$b)"; git -C "$BE" show origin/$b:docs/pengembangan/status/$b.md | cut -c1-200; done; git -C "$BE" show origin/yoga:docs/pemilik.md
```

Laporan disusun per pemilik, memakai nomor butir `kontrak/temuan.md`,
label B mereka bila ada, dan kosakata status di atas. Butir yang sudah
mereka catat cukup dirujuk. Laporan 7 Oktober 2026 adalah yang pertama
disusun dengan cara ini.

Laporan tidak mengulang temuan yang sudah diserahkan dan dicatat (pemilik
proyek, 8 Oktober 2026). Isinya hanya temuan baru, dan hasil pembuktian
atas perbaikan mereka, satu baris per butir. Butir lama yang masih
terbuka tidak ditulis ulang, juga tidak sebagai pengingat; bila perlu
disebut, cukup nomornya. Sebelum laporan disusun, setiap calon butir
dicocokkan dengan daftar laporan di bawah dan dengan
`docs/pengembangan/klien.md` backend. Bila tidak ada temuan baru maupun
pembuktian baru, tidak ada laporan yang dibuat.
