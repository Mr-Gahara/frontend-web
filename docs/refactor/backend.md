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
dipakai berulang disimpan sebagai helper (`cara-kerja.md`, Helper
penggantian): `tinjau-surat-jalan.js` untuk membaca surat jalan beserta
jurnal dan pengajuannya, dan `api-surat-jalan.js` untuk daftar, detail, dan
batal lewat API. Skrip sekali pakai tetap di `/tmp`.

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
- Laporan submodul pengajuan stok (daftar) — 1 temuan, disusun 20 September
  2026: status yang disembunyikan menurut izin dijawab daftar kosong tanpa
  keterangan, sehingga klien harus mencerminkan aturan service
- Tindak lanjut atas tanggapan tim backend 20 September 2026 (berkas
  README-Temuan-Frontend di repo backend, menanggapi temuan 2, 9, 18, dan
  19) — 3 temuan, disusun 21 September 2026: validator stock opname masih
  menolak `qtyPhysical` null sehingga perbaikan SO-1 tidak sampai ke
  endpoint (butir 22), `referenceID` adjustment berisi objek populate tanpa
  dokumentasi, dan `GET /jurnalstok` tidak membaca query lokasi (bersama
  SO-3), beserta konfirmasi SO-2, koreksi butir 2 dan 9, dan kontrak
  inventory
- Laporan arah lokasi pengajuan stok — 4 temuan, disusun 21 September 2026:
  tipe lokasi pengajuan tidak divalidasi sehingga pengajuan terbalik dari
  web diterima, pengajuan APPROVED dan PENDING masih bisa diubah, respons
  `approve` berisi dokumen sebelum diperbarui, serta dokumentasi arah dan
  nama endpoint lama; beserta catatan pembalikan 8 pengajuan development
- Laporan submodul transfer stok: penerimaan dan surat jalan — 8 temuan,
  disusun 21 September 2026 setelah `dec9d01`: terima mengganti seluruh
  items tanpa validasi, jumlah diterima 0 menambah stok penuh, dugaan
  dampak ke aplikasi Flutter, PUT surat jalan menerima field yang
  seharusnya dikunci, daftar surat jalan mengabaikan query, hapus draf
  tidak melepas ikatan pengajuan, validator update tetap valid tanpa field
  sah, dan batal dari DIKIRIM saat barang di perjalanan (perlu keputusan);
  beserta konfirmasi validator inventory di route (`fc159bd`) dan bukti
  surat jalan development yang rusak (`kontrak/temuan.md` butir 29 sampai
  36)
- Laporan model bisnis MVP dan izin lintas outlet — 3 temuan dan satu
  jawaban keputusan, disusun 22 September 2026: stok produk dihitung dari
  master bahan baku tanpa lokasi, stok awal bahan baku jatuh ke lokasi apa
  pun bila tenant belum punya outlet, dan permintaan permission lintas
  outlet; beserta jawaban SO-3 bahwa data tidak dibatasi per lokasi
  pengguna (`kontrak/temuan.md` butir 20 dan 37 sampai 39)
- Laporan pembatasan stock adjustment per ruang — 1 temuan, disusun 23
  September 2026: daftar dan detail adjustment tidak membedakan ruang
  outlet dan gudang, baik lewat izin maupun lewat penyaring, sehingga
  pemisahan stok outlet dan gudang hanya ditegakkan di tampilan frontend
  (`kontrak/temuan.md` butir 40)
- Laporan modul penjualan dan pembayaran — 9 temuan, disusun 26 September
  2026: validator buat penjualan mewajibkan `penggunaID` yang dibuang
  controller, galat validasi penjualan dan pembayaran tanpa `status` dan
  `message`, daftar pembayaran tanpa filter per penjualan dan tanpa nama
  metode, pembayaran tanpa idempotensi, `isAutomated` yang tidak ada di
  model, cache daftar jurnal yang tidak dibersihkan saat jurnal ditulis,
  hapus bahan baku yang meninggalkan data yatim, pengguna tanpa
  `read-location` yang tidak dapat mengetahui outletnya, dan daftar
  penjualan tanpa filter lokasi; beserta catatan 408 test merah di branch
  `ridho` (`kontrak/temuan.md` butir 41 sampai 49)
- Laporan spec login — 1 temuan, disusun 26 September 2026: login akun
  membedakan email tidak terdaftar (404) dari password salah (400),
  sehingga keberadaan sebuah email dapat diketahui tanpa password
  (`kontrak/temuan.md` butir 50)
- Laporan master data reservasi — 5 temuan, disusun 27 September 2026:
  cache daftar aset tidak dibersihkan saat tipe aset dihapus, hapus aset
  dan tipe aset tanpa pemeriksaan pemakaian, hapus tarif menjawab 500
  setelah datanya terhapus, ubah tarif tidak dapat melepas tipe aset, dan
  cache tipe aset dibersihkan dengan `tenantID` undefined
  (`kontrak/temuan.md` butir 51 sampai 55)
- Laporan modul reservasi: sesi booking — 4 temuan, disusun 27 September
  2026 setelah `eef371a`: booking tanpa pembayaran tidak dapat dibatalkan
  karena penjualannya selalu FINAL (perlu keputusan alur), void penjualan
  tidak membersihkan cache daftar per tanggal dan detail booking, status
  Selesai ditulis saat daftar dibaca, dan kode lama yang dikomentari di
  `services/sesiBooking/sesiBookingService.js` (`kontrak/temuan.md` butir
  56 sampai 59)
- Laporan setelah spec keuangan — 2 temuan, disusun 28 September 2026
  setelah `0cfb3bd`: nomor surat jalan yang dapat bentrok karena dibentuk
  dari nomor pengajuan dan empat digit terakhir `Date.now()`, dan
  kebutuhan endpoint mutasi kas untuk halaman mutasi arus kas (perlu
  keputusan) (`kontrak/temuan.md` butir 60 dan 61)
- Laporan spec jadwal shift — 5 temuan, disusun 29 September 2026
  setelah `d9af531`: jadwal dengan shift tidak aktif dilewati diam-diam
  oleh generate, galat `bulkWrite` ditelan, satu hari dapat libur
  sekaligus punya shift (perlu keputusan), nama dan role karyawan di
  respons jadwal selalu "Tidak Diketahui", dan respons sukses walau
  jadwal ditolak (`kontrak/temuan.md` butir 62 sampai 66)
- Laporan submodul shift — 5 temuan dan 1 permintaan, disusun 29
  September 2026 setelah `f99b7cf`: penyebab `GET /shift` tanpa query
  menjawab 500, cache daftar shift yang tidak pernah dibaca, jam tanpa
  titik dua diterima, lintas hari tidak dicocokkan dengan jam, dan
  `tenantID` yang dapat diubah lewat `PUT /shift/:id`; beserta permintaan
  `locationID` untuk shift, pola roster, dan monitoring absensi
  (`kontrak/temuan.md` butir 8 dan 67 sampai 71)
- Laporan submodul pola roster — 2 temuan, disusun 29 September 2026
  setelah `dcc22e0`: `tenantID` yang dapat diubah lewat
  `PUT /polaroster/:id`, dan cache daftar pola roster yang basi saat
  shift diubah (`kontrak/temuan.md` butir 72 dan 73)
- Laporan modul Gudang — 1 temuan, disusun 30 September 2026 setelah
  `319bd99`: dashboard gudang dan outlet mencampur data lokasi (stok
  kritis dan jurnal terbaru dari seluruh lokasi tenant), tidak memeriksa
  izin baca modul, dan mengirim jurnal tanpa mapper
  (`kontrak/temuan.md` butir 74)
- Laporan penyesuaian backend `465b438` — 8 temuan untuk backend dan satu
  catatan milik frontend (butir 82), beserta penilaian ulang, disusun
  30 September 2026 setelah `b63cf08`: catatan pembayaran
  tertimpa alasan pembatalan, larangan pengaju menyetujui pengajuannya
  sendiri tanpa pengecualian Owner (perlu keputusan), `DELETE /tipeaset`
  dan `/tarif` yang sesekali tertahan (pengamatan), sisa jalur payment
  gateway, dokumen metode pembayaran yang masih menyebut gateway,
  `assignPajak` tanpa pemeriksaan tenant, akun kas bersaldo yang tidak
  dapat ditutup (perlu keputusan), route hapus yang hilang sementara
  halaman web lama masih memanggilnya, dan urutan per kolom di
  `GET /penjualan`; beserta konfirmasi butir yang sudah diperbaiki
  (`kontrak/temuan.md` butir 29, 30, 33, 36, 41, 43, 51 sampai 58, dan 75
  sampai 83)
- Laporan submodul metode pembayaran — 3 temuan dan satu perluasan,
  disusun 1 Oktober 2026 setelah `3359497`: membuat metode nonaktif tetap
  dihitung ke batas 10 metode aktif, nama kembar diperiksa sebelum
  dipangkas, dan metode aktif terakhir dapat dinonaktifkan (perlu
  keputusan); beserta perluasan butir 77, yaitu `POST /tipeaset` yang
  juga tertahan setelah data tersimpan dan enam tipe aset uji yang
  tertinggal sebagai jejaknya, serta konfirmasi butir 84 yang diperbaiki
  di frontend (`kontrak/temuan.md` butir 77 dan 85 sampai 87)
- Laporan submodul pajak — 9 temuan, disusun 1 Oktober 2026 setelah
  `b84de56`: `pajakList` produk dibentuk dari field yang tidak pernah
  ditulis, `PUT /pajak/:id` menyimpan `tenantID` dari body, penonaktifan
  otomatis pajak per transaksi yang tidak atomik, `tipePajak` wajib di
  setiap update, relasi pajak yatim saat produk dihapus, relasi ke pajak
  nonaktif yang tersembunyi tetapi tertimpa, cache produk yang tidak
  dibersihkan saat pajak diubah, simulasi pajak transaksi yang berbeda
  dari penjualan, dan konstanta validator yang tidak dipakai
  (`kontrak/temuan.md` butir 88 sampai 96)
- Laporan permission seed — 1 temuan, disusun 1 Oktober 2026 setelah
  `366e9b7`: sinkron seed permission tidak membuang nama yang dikeluarkan
  dari daftar, `--reset` memutus referensi setiap role selain Owner, dan
  izin baru hanya sampai ke role Owner lewat `seedOwnerPermission.js`;
  beserta bukti basis data development (lima nama lama dipegang lima role,
  tiga izin jurnal transfer belum ada) dan cara penyelarasannya
  (`kontrak/temuan.md` butir 97)
- Laporan penyesuaian backend `yoga` — 1 temuan dan satu pengamatan,
  disusun 2 Oktober 2026 setelah `a4304ce`: stok produk yang masih potret
  padahal menjadi gerbang finalisasi (butir 37, sebagian), dan kejadian
  keempat permintaan tertahan (butir 77); beserta konfirmasi butir 11,
  75, dan 83 yang terbukti diperbaiki lewat e2e (`kontrak/temuan.md`)
- Laporan submodul profil outlet — 5 temuan, disusun 2 Oktober 2026
  setelah `fcf2dd2`: token hasil `pin-refresh` web membawa `tenantName`
  "Toko Tidak Diketahui", `isSetupComplete` yang dapat diubah klien,
  panjang `namaToko` dihitung sebelum dipangkas, validasi yang berjalan
  sebelum pemeriksaan izin di `PUT /tenant/:id`, serta `persenPajak`,
  `tipePajak`, dan `logoUrl` tenant tanpa pemakai (perlu keputusan)
  (`kontrak/temuan.md` butir 98 sampai 103)

Cakupan laporan Fase 2: `pin-refresh` 500 tanpa body, `GET /shift`
500, validator pola roster, hapus pengguna, field yang dipakai service tetapi
tidak ada di validator, envelope tidak seragam, identitas tidak seragam,
33 endpoint tanpa `checkPermission`, 17 permission tanpa route, nama permission
pengiriman stok tidak sejalan, permission jadwal belum ada, allowlist tidak
universal, dan konfirmasi kebijakan sesi web tunggal.
