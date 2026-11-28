# Pengujian

Sifat perubahan: **Sering**: baseline setiap modul; bagian lain bertambah saat ada pelajaran.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Baseline, kredensial uji, cara menelusuri kegagalan e2e, dan test yang
ditandai fixme atau dilewati. Baseline diperbarui setiap modul. Perintah
verifikasi, catatan Playwright, dan spec rujukan ada di
`referensi/playwright.md`; utang pengujian di `referensi/utang-pengujian.md`;
riwayat baseline dan utang yang lunas di `arsip/riwayat-pengujian.md`.

## Baseline

**Suite penuh 28 November 2026** (web `fb2a39f`, backend `ridho` lokal
`6478d29`, pukul 07.50 sampai 08.46 WIB, penutup putaran PW17 sampai
PW21, PW22): vitest 1362 lolos dari 160 berkas, dan e2e 839 lolos dan
1 gagal dari 840 dalam 56,1 menit, tanpa dilewati. Termasuk spec
ber-OTP. Yang gagal, `keuangan/mesin-kasir` "memuat: kerangka tampil
selama riwayat ditahan, lalu berganti isi", menunggu `#judul-kasir-buka`
yang sengaja tidak dirender saat toko uji tanpa mesin kasir; harapannya
terbukti keliru dan penandanya diganti isi riwayat (`0d124c7`), lalu
dibuktikan dengan berkasnya saja, 15 lolos dari 15. Tiga skenario baru
sejak suite sebelumnya ikut lolos, dan penunggu lonceng baru (PW18
sampai PW21) tidak menabrak spec lain.

Baseline 16 dan 17 November 2026, dari penyesuaian backend `4a19be8`
sampai suite penuh per penyesuaian backend `3570bd4`, dan baseline
sebelumnya mulai rapian UI dan utang pengujian (14 November 2026) sampai
penyesuaian backend `ridho` `b5b367a` (21 Oktober 2026), dipindah ke
`arsip/riwayat-pengujian.md` (Riwayat baseline) pada 14, 17, dan
20 November 2026. Baseline 18 sampai 24 November 2026, dari pembuktian
kontrak sampai utang pengujian per kelompok, dipindah ke arsip yang sama
pada 24 November 2026, suite penuh 24 dan 25 November 2026 pada
26 November 2026, suite penuh 26 November 2026 pada 27 November 2026,
dan suite penuh 27 November 2026 pada 28 November 2026; yang tersisa di
atas hanya suite penuh terbaru.

## Kredensial uji

- Akun: `toko@gmail.com` / `Toko1234`
- Pengguna: nama `Ridho`, PIN `123456` (berperan Owner)
- Frontend `localhost:3000`, backend `localhost:4000`
- Akun admin platform: tidak ditulis di sini (keputusan PA6a). Spec
  membacanya dari `E2E_ADMIN_EMAIL` dan `E2E_ADMIN_PASSWORD` di `.env.e2e`
  (akar repo, diabaikan git) atau dari variabel lingkungan, lewat
  `tests/helpers/admin-uji.ts`

## Menjalankan layanan uji

Frontend `npm run dev`, MongoDB dan Redis lokal. Backend dijalankan dengan
env inline, karena `.env` backend tidak diubah dari sisi frontend
(4 November 2026); dotenv backend tidak menimpa variabel yang sudah ada:

```bash
cd ~/Documents/backend-js && EMAIL_TRANSPORT=smtp SMTP_HOST=127.0.0.1 SMTP_PORT=1025 EMAIL_PENGIRIM=noreply@tachyon.test OTP_JEDA_KIRIM_DETIK=0 OTP_MAKS_KIRIM_HARIAN=1000 EMAIL_KUOTA_HARIAN=5000 REGISTER_LIMIT_MAX=1000 npm start
```

Mailpit menangkap email OTP (UJ1a): `docker start mailpit`, atau pertama
kali `docker run -d --name mailpit -p 127.0.0.1:1025:1025 -p
127.0.0.1:8025:8025 axllent/mailpit:v1.21`. Spec membaca kode lewat
`tests/helpers/mailpit-uji.ts`.

## Menelusuri kegagalan e2e

Jangan menebak selector. Ambil bukti:

```bash
npx playwright test tests/e2e/<modul> -g "<nama test>" --trace on --reporter=line > /dev/null 2>&1
T=$(find test-results -name trace.zip | head -1)
unzip -p "$T" '*.network' | T="$T" node -e '
const { execSync } = require("child_process");
const ambil = (sha) => execSync(`unzip -p "${process.env.T}" "resources/${sha}"`).toString();
for (const l of require("fs").readFileSync(0, "utf8").split("\n").filter(Boolean)) {
  let o; try { o = JSON.parse(l); } catch { continue; }
  const s = o.snapshot;
  if (!s || !/\/api\//.test(s.request.url)) continue;
  console.log(`${s.request.method} ${s.request.url.replace(/^.*\/api/, "/api")} -> ${s.response.status}`);
  const sha = s.response.content && s.response.content._sha1;
  if (s.response.status >= 400 && sha) console.log("  " + ambil(sha).slice(0, 200));
}'
```

Untuk melihat body yang dikirim, cetak juga `s.request.postData` (isinya di
`text`, atau di `_sha1` yang dibaca dengan `ambil`). Pada modul produk, cara ini
membuktikan PUT dikirim tanpa `resep`.

Snapshot DOM saat gagal ada di `error-context.md` di dalam folder test yang
gagal. Playwright memendekkan nama folder dan menambahkan hash, jadi berkas
sebuah test dicari lewat judulnya di isi berkas, bukan lewat pola nama
folder: `grep -l '<judul test>' $(find test-results -name error-context.md)`.
Potongan kode sumber spec ikut tercetak di berkas itu; saring baris berpola
`nomor |` bila hanya isi snapshot yang dibutuhkan.

## Urutan debug kegagalan e2e

Urutan ini terbukti paling cepat; melompatinya justru memperlama.

1. **Apakah request-nya terkirim?** Ambil trace jaringan lebih dulu. Ini
   memisahkan masalah UI dari masalah data, dan sering langsung menjawab.
2. **Bila tidak terkirim**: cari yang menghalangi, yaitu validasi form,
   tombol yang disabled, atau selector yang salah.
3. **Bila terkirim dan berhasil**: masalahnya di assertion atau di waktu.

Pola kegagalan yang berulang:

| Gejala | Penyebab yang paling sering |
|---|---|
| Timeout menunggu elemen | Selector tebakan; ambil teks sebenarnya dari kode komponen |
| Request tidak terkirim sama sekali | Validasi menahan submit, atau tombol disabled |
| Request berhasil tetapi UI tidak berubah | Balapan dengan pemuatan ulang daftar |
| Lolos sendirian, gagal saat diulang | Elemen yang sempat disabled, atau data menumpuk |
| Gagal beruntun setelah satu kegagalan | Data sisa dari test yang gagal sebelum cleanup; bersihkan dulu, atau pakai nama unik per run |
| Gagal tepat setelah perubahan kode, lalu hilang | Belum dapat dipastikan; jalankan `--repeat-each 5` sebelum menyimpulkan selesai |
| Halaman tertahan di loader | Kondisi pemuatan yang tidak pernah terpenuhi; periksa trace, apakah request yang ditunggu benar-benar terkirim |
| Klik habis waktu padahal tombol terlihat | Tombol `disabled` oleh validasi form, misalnya catatan wajib; baca kondisi `disabled` di kode sebelum mengubah spec |
| `response.json` gagal dengan `No resource with given identifier found` | Penunggu menangkap respons milik halaman sebelumnya yang sudah dibuang; pasang penunggu setelah `goto(..., { waitUntil: "commit" })` atau `reload(...)` yang sama. Komponen global (topbar, sidebar) yang meminta endpoint yang sama memicunya juga: lonceng TP8a dan spec langganan (suite penuh 12 November 2026). Saat menambah permintaan di komponen global, grep spec yang menunggu endpoint itu. Bila hanya angkanya yang dibutuhkan sebagai bukti, baca ulang lewat API dengan token `bukaDenganAuth`; penunggu jaringan cukup untuk memeriksa query dan status (`pembayaran-metode`, 17 November 2026) |
| Skenario tulis `skipped` padahal kode tidak berubah | Dokumen aktif sisa run yang gagal menghalangi pembuatan (409). Baca pesan `POST` di trace (backend menyebut nomornya), lalu batalkan dokumen itu dari halaman detail |
| `net::ERR_NETWORK_IO_SUSPENDED` saat `page.goto` | Mesin menangguhkan jaringan (tidur atau hemat daya) di tengah suite; jalankan ulang test itu sendirian, lalu suite penuh diawali `systemd-inhibit --what=idle:sleep` |
| Surat jalan uji ditolak karena nomornya bentrok, sekali lalu hilang | Backend membentuk akhiran nomor dari empat digit terakhir `Date.now()` (`transferStokService.js` baris 148 sampai 150), dan setiap run spec transfer membuat surat jalan baru dari pengajuan uji yang sama (124 surat jalan untuk `PGJ/202608/0001` per 28 September 2026), sehingga peluang bentrok naik setiap run (`kontrak/temuan.md` butir 60; terjadi di suite penuh `074e98c` dan `0cfb3bd`). Jalankan ulang test itu sendirian, lalu suite penuh |
| `page.request` di `finally` habis waktu, sekali lalu hilang | Backend sesaat tidak menjawab; permintaan ini tidak melewati `page.route`, sehingga bukan akibat simulasi spec (suite penuh `074e98c`; juga `api()` di hapus tarif pada suite penuh terhadap backend `ridho` `7d28135`, lolos 9 dari 9 saat diulang). Jalankan ulang suite penuh sebelum mengubah spec |
| `waitForResponse` habis waktu setelah kembali ke halaman atau filter yang sudah pernah dimuat | Kunci query masih segar (`staleTime` 5 menit di `components/providers/query-provider.tsx`), sehingga tidak ada permintaan. Buktikan dari tampilan; penunggu jaringan hanya untuk kunci yang belum pernah dimuat (`b63cf08`) |
| Pembersihan tampak lolos, tetapi data uji menumpuk di basis data | Helper pembersihan membuang jawaban permintaannya. Periksa statusnya dengan `expect.soft`, dan jalankan audit endpoint: route yang dihapus backend juga menjawab 404 (`b5a55c4`) |
| `POST /pengajuanstok` ditolak 409 nomor kembar, menetap saat diulang | Backend membentuk nomor dari dokumen terakhir menurut `createdAt` (`kontrak/temuan.md` butir 139). Bandingkan `createdAt` dan waktu `_id` dokumen bernomor terbesar dengan jam sistem lewat skrip baca-saja; dokumen ber-`createdAt` di depan mengunci pembuatan sampai bulan berganti |
| Spec gagal hanya pada jam tertentu, berulang, juga di pohon kerja bersih | Cek `date` dan `date -u`, lalu bandingkan dengan `git stash -u`. Tanggal `YYYY-MM-DD` dibaca backend sebagai 00.00 UTC, sehingga tanggal hari ini ditolak antara 00.00 dan 07.00 WIB (`kontrak/temuan.md` butir 154) |
| Lolos sendirian, gagal saat dijalankan bersama spec lain | Test memilih baris pertama daftar, padahal spec yang berjalan lebih dulu membuat data dari jenis lain (berurutan menurut nama berkas, `workers: 1`). Pilih baris menurut data yang memenuhi syarat, lewat nomornya (`7f1de56`) |
| Penanda "halaman sudah termuat" tidak ditemukan hanya di suite penuh, padahal halamannya tampil | Penanda itu bagian yang sengaja diganti keadaan lain menurut data toko uji (misalnya `#judul-kasir-buka` diganti langkah tambah mesin saat mesin kasir 0, PW22). Hitung datanya langsung di Mongo, jalankan uji itu sendirian, lalu pilih penanda dari bagian yang memang diuji |
| Pengguna uji terbatas berakhir di Profil Pengguna, dan permintaan halaman tujuan tidak pernah terkirim | `/dashboard` mengalihkan sendiri menurut izin (`app/dashboard/page.tsx`) dan dapat menyalip `goto` berikutnya; layout ruang outlet dan gudang menuntut `read-dashboard-outlet` dan `read-dashboard-gudang`. Helper peran uji menunggu URL meninggalkan `/dashboard`, dan peran uji memegang izin dashboard ruang yang dibukanya (`4601d91`) |
| `page.goto` `net::ERR_ABORTED` tepat setelah spec memasang `page.route` 403 | Halaman sebelumnya masih memuat permintaan susulan (panel dashboard) yang ikut dijawab 403 dan mengalihkan ke /login. Pasang route setelah halaman tujuan termuat, lalu `reload({ waitUntil: "commit" })` (suite penuh 8 November 2026) |
| Opsi popover terlepas dari DOM sekali lalu tidak kembali, hanya di spec ber-`page.clock` | Radix mengembalikan fokus ke pemicu popover sebelumnya lewat `setTimeout`, yang dipalsukan `page.clock`; bila berjalan setelah popover berikutnya dibuka, popover itu menutup. Tunggu popover lepas dan fokus kembali sebelum membuka popover berikutnya (`tungguPopoverLepas` di `tests/helpers/penjualan-uji.ts`). Dibuktikan dengan `page.clock.pauseAt` lalu `runFor`, bukan dengan angka flaky (suite penuh 12 November 2026) |
| Alur berhasil tetapi mendarat di dashboard, bukan kembali ke wizard | Parameter `?kembali=/setup` hilang saat jalur login pengguna melewati halaman lain (`/lupa-pin`). Setiap halaman di jalur itu meneruskannya lewat `denganKembali` (`lib/auth/tujuan.ts`); periksa URL setelah tautan dan pengalihan, bukan hanya tujuan akhir (suite penuh 13 November 2026, OA1a). Penunggu glob seperti `waitForURL("**/lupa-pin")` tidak cocok dengan URL ber-query; pakai regex yang menyebut query-nya |
| Isian PIN terlepas dari DOM saat login ulang sebagai pengguna lain di tab yang sama, lalu halaman sampai di dashboard tanpa `pin-login` | `/login` memulihkan sesi lama lewat cookie (`refreshtoken`, `pin-refresh`) bersamaan dengan login baru, dan halaman login pengguna mengalihkan begitu sesi lama pulih. Buang cookie (`about:blank`, `clearCookies`) sebelum login ulang (`masukSebagai`). Dibuktikan dengan menahan `pin-refresh` sampai URL `/login/pengguna` (suite 12 November 2026, RG4a) |
| Tangkapan atau ukuran gaya tidak berubah sesudah token tema baru, atau kelas token tidak berpengaruh | Dev server melayani CSS basi setelah `git stash` bolak-balik atau perubahan `@theme`; `touch app/globals.css` tidak selalu cukup. Periksa `getComputedStyle` atau aturan di `document.styleSheets` lebih dulu; bila kosong, hentikan dev server, hapus `.next/dev`, lalu jalankan ulang (14 November 2026, tipografi CV24a). Setelah `git stash` bolak-balik, hasil e2e juga tidak dapat dipercaya sampai dev server dimulai ulang: label kartu `tabel:hidden` tampil di 1280 px dan tampak seperti regresi spec (17 November 2026, LT1a). Dev server yang baru dinyalakan di atas `.next/dev` lama juga dapat menjawab 404 untuk setiap rute di bawah layout bertingkat (inventaris, pengaturan, keuangan), sedangkan `/dashboard/outlet` 200; bandingkan dengan `curl` beberapa rute yang tidak disentuh sebelum menelusuri kode (lonceng LN1a, 25 November 2026) |
| Kepala kolom tidak ditemukan atau label sel ikut terbaca di 1280 px, padahal tampilan tidak diubah | Sejak LT1a `DataTable` tampil sebagai kartu bila lebar alaminya melebihi wadah, misalnya karena data uji yang panjang. Periksa `[data-kartu]` lebih dulu; perbaiki dengan `meta.lebarBungkus` di kolom terlebar seperti LT2a, bukan dengan mengubah spec |
| Klik tanggal kalender kena dua elemen (`strict mode violation`) untuk hari 22 sampai 31 | Grid kalender juga menampilkan tanggal bulan sebelumnya; pilih lewat `button[data-day="M/D/YYYY"]`, seperti `pilihTanggalKalender` di `tests/helpers/jadwal-uji.ts` (`2bcb1ce`) |
| Skenario `skipped` padahal data ujinya ada, sejak daftarnya berhalaman di server | Spec mencari data uji di respons pertama daftar, yang kini hanya satu halaman. Cari lewat query server (isi kotak cari lalu tunggu respons ber-`cari`), dan baca harapan dari `pagination.total` (skenario P18 bahan baku, 16 November 2026, `6ab81aa`) |
| Gagal beberapa detik setelah jeda panjang di tengah suite, waktu habis menunggu URL atau elemen | Laptop ditangguhkan karena baterai lemah; `systemd-inhibit --what=idle:sleep` tidak menahannya. Cocokkan waktu `error-context.md` (`date -r`) dengan `journalctl -b \| grep -E "suspend\|resum"`; jalankan suite dengan charger tersambung (16 November 2026) |
| Pengguna uji berakhir di "Siapa yang bertugas?" sesekali, dan backend mencatat `pin-refresh` 401 "Sesi tidak valid." tanpa rotasi lain di log | Spec berpindah halaman selagi `pin-refresh` dokumen sebelumnya berjalan: backend sudah memutar `tokenVersion`, tetapi cookie barunya tidak tersimpan. Pemicunya pemeriksaan ketiadaan (`toHaveCount(0)`) yang lolos sebelum izin terbaca, karena layout dan "Dashboard" di sidebar tampil sebelum sesi pulih. Dahului setiap `goto` dengan jangkar positif berizin. Logger PERF backend hanya mencatat pada `finish`, sehingga permintaan yang terpotong tidak tampak. Repro: `route.fetch`, kembalikan cookie lama, `route.abort`, lalu `goto` (`f80bd16`). Sejak backend `3570bd4` (B345) cookie lama diterima 30 detik, sehingga gejala ini hanya muncul bila jedanya lebih lama; spec `auth/tenggang-pin-refresh` menjaga masa tenggangnya |
| Tur sorotan tidak tampil sendiri hanya di suite penuh, lolos sendirian | Komponen global (topbar) memulai tur selagi penjaga layout masih memuat, lalu pengalihan melepasnya dan mencatatnya sudah dilihat. Buktikan dengan menunda respons yang ditunggu penjaga (`route.fetch` lalu jeda 1,5 detik); kunci tur menunggu keputusan penjaga, seperti `kunciPanduanDashboard` (17 November 2026, TG2a) |
| Spec yang tidak disentuh berbulan-bulan gagal mencari isian yang tampak masih ada | Isian pindah tempat oleh perubahan komponen bersama (FL1a memindah isian filter ke panel), dan spec itu tidak ikut putaran yang mengubahnya. Saat mengubah komponen bersama, grep spec menurut label isiannya (`grep -rn "Pembelian dari\|Akun kas" tests/e2e`), bukan menurut nama folder modul (suite penuh 20 November 2026) |
| Ukuran atau letak elemen panel filter melebihi layar, padahal tampilannya benar | Panel bergeser masuk (`panel-filter-gerak`); `toBeVisible` lolos sebelum animasi selesai. Tunggu `el.getAnimations({ subtree: true })` selesai sebelum `boundingBox` (`tanggal-filter`, 20 November 2026) |
| `buat peran uji ...` gagal 403 "Akses ditolak" di skenario yang masuk sebagai dua peran uji berturut-turut | `masukSebagai` (`tests/helpers/terkunci-uji.ts`) membuat dan menyelaraskan peran memakai sesi yang sedang aktif; sesudah peran pertama, sesi itu milik peran terbatas. Panggil `login(page)` (Owner) sebelum peran kedua (`jalur-bukan-owner`, 20 November 2026) |
| Select di form ubah tampil placeholder ("Pilih Satuan...") padahal respons detail membawa nilainya | Form diisi lewat `reset` di effect; Select Radix kehilangan nilainya. Pasang form setelah detail dimuat ulang dengan `defaultValues` (keputusan rancangan butir 8), seperti halaman ubah bahan baku (23 November 2026) |
| Bagian berbasis container query tidak berganti tampilan di lebar yang diharapkan | Lebar isi lebih kecil dari lebar layar karena sidebar, padding area gulir, dan padding pembungkus; di 1280 px isi halaman daftar sekitar 888 px. Ukur lebar wadah lebih dulu sebelum memilih ambang `@[..rem]` (Rekap Absensi, 23 November 2026) |
| `bukaDenganAuth` habis waktu menunggu `pin-refresh` di skenario baru | Blok `describe` tempat skenario ditambahkan tidak login di `beforeEach`; skenario lain di blok itu memanggil `login(page)` sendiri. Baca `beforeEach` blok tujuan sebelum menambah skenario (23 November 2026) |
| `getComputedStyle(...).boxShadow` sel bertanda `shadow-none` bukan `none`, atau warnanya tidak terbaca pola `rgba` | Tailwind v4 menulis bayangan sebagai beberapa lapisan variabel; `shadow-none` menjadi lapisan `rgba(0, 0, 0, 0)`, dan warna `color-mix` terhitung `color(srgb … / a)`. Periksa alfa setiap lapisan (`adaBayanganTerlihat` di `tampilan/bayangan-baris`) |
| Skenario navigasi kembali gagal hanya di suite penuh, lolos sendirian | Tombol memakai `router.back()`, sehingga tujuannya bergantung riwayat tab yang berbeda antara run sendiri dan suite penuh. Buka laman di tab baru (`context().newPage()`) untuk membuktikannya secara pasti, dan pakai tujuan pasti (KB1a) |
| `response.json` gagal `No resource with given identifier found` di skenario yang membuka halaman yang sama dua kali (helper sesi lalu helper pembuka halaman) | Pemuatan pertama masih meminta data saat pemuatan kedua memasang penunggu. Ambil sesi (`bukaDenganAuth`) dari halaman lain (`dashboard-gudang`, suite penuh 24 November 2026) |
| Helper penunggu daftar menerima respons dengan query yang tidak diharapkan sesudah halaman diberi komponen baru | Penunggu tanpa syarat ikut menangkap permintaan endpoint yang sama dari komponen baru di halaman itu (kartu ringkas admin meminta `limit=1`). Saat menambah permintaan ke endpoint daftar, beri penunggu helper syarat query (`bukaDaftarAkun`, 24 November 2026) |
| Penunggu `GET` daftar (inventory, stockopname, pengajuanstok, sesikasir, penjualan, diskon) menangkap respons berisi satu baris, atau `No resource with given identifier found`, di halaman dashboard mana pun | Lonceng topbar meminta endpoint yang sama di setiap halaman (`modul/pemberitahuan.md`, LN7a). Syaratkan penunggu dengan `!dariLonceng(r.url())` dari `tests/helpers/lonceng-uji.ts`, atau dengan query khas halamannya; saat menambah sumber lonceng, perbarui ciri di helper itu dan grep penunggu endpoint-nya (25 November 2026) |
| Daftar tab dan isinya bersisian, atau tab aktif tidak berbeda, padahal memakai `Tabs` shadcn | Varian `data-horizontal:` dan `data-active:` di `components/ui/tabs.tsx` tidak cocok dengan atribut Radix proyek ini (`data-orientation`, `data-state`). Tulis `flex-col` di `Tabs` dan `data-[state=active]:` di `TabsTrigger`, seperti laman pajak dan profil (PU1a, 24 November 2026) |
| `strict mode violation` saat mengklik tombol yang hanya satu di halaman | Nama dicari sebagian dan tidak peka huruf besar: tombol paginasi "Next" ikut cocok dengan "Open Next.js Dev Tools" milik dev server. Pakai `exact: true` (`b03c276`) |
| Spec masih mencari tombol yang sudah menjadi tautan, padahal grep nama tombol sudah dijalankan | Spec menulis nama sebagai regex (`/tambah metode/i`), bukan teks. Saat mengubah peran elemen, grep nama dengan dan tanpa garis miring, tanpa membedakan huruf besar (BT1a) |
| Pengguna uji yang baru dibuat Owner tidak ada di daftar Kelola Pengguna milik pengguna lain | Ruang staf ditentukan lokasi kerja lebih dulu, lalu izin dashboard role, lalu outlet (RS1a di web sejak PW21; `getByWorkspace` backend sejak `c4aae0d`, B385). Periksa lokasi kerja staf uji: staf berlokasi kerja gudang hanya ada di ruang gudang walau perannya memegang `read-dashboard-outlet`. Sebelum `c4aae0d` backend hanya memuat pemegang izin dashboard ruang itu, sehingga peran staf uji diberi izin dashboard ruangnya (24 November 2026) |
| Menu Edit dan Hapus pengguna nonaktif bagi pengelola uji | Pengguna berlevel setara atau lebih tinggi tidak dapat diubah (`canEdit`); peran uji berlevel 90, sehingga staf yang diubahnya butuh peran berlevel rendah (`siapkanPeran`, E2E Staf Level Rendah) |
| Helper pengajuan uji dijawab 409 "sudah di-submit" | Pengajuan PENDING (sesudah surat jalannya batal) tidak dapat di-submit; backend hanya menerima submit dari DRAFT. Pakai yang APPROVED atau buat baru (`pengajuanUjiDisetujui`, 24 November 2026) |
| Opsi baru tidak ada di Select panel filter padahal data sudah dibuat lewat API | Daftar pilihan dimuat saat halaman dibuka dan masih segar di cache (`staleTime` 5 menit). Muat ulang halaman sesudah menyiapkan data, lalu buka panel (`mutasi-kas`, 24 November 2026) |
| Baris tabel tidak ditemukan sesudah dialog gagal | Dialog modal membuat isi halaman tidak terjangkau peran; tutup dialog lebih dulu, lalu periksa baris (`pindah-dana`, 24 November 2026) |
| `pin-login` ditolak 401 "Sesi telah berakhir atau dihentikan" dengan PIN benar, sesudah spec membuka tab baru atau memuat ulang | Setiap `refreshtoken` akun memutar `tokenVersion` (`middleware/authAkun.js` backend), sehingga token akun yang tersimpan di tab lain langsung ditolak. Sejak PW03 `lib/apiClient.ts` menyegarkan sekali lalu mengulang `pin-login` untuk penolakan sesi akun; bila gejalanya kembali, periksa pesan 401 di trace lebih dulu (PIN salah juga 401, tetapi tidak diulang) |
| `akunUjiTetap` gagal "pulihkan akun uji tetap" (PUT `/akunkas/:id` ditolak) di spec yang lolos sendirian | Toko sudah punya 10 akun kas aktif (`BATAS_AKUN_KAS_AKTIF`, `services/akunKasService.js`), dan mengaktifkan kembali akun uji dihitung ke batas itu. Spec yang memakai akun uji tetap harus menonaktifkannya di `finally` (kosongkan saldonya dulu); akun "E2E Tujuan Laci Tetap" yang dibiarkan aktif membuat `pindah-dana` gagal (PW09, 27 November 2026) |
| Buka atau tutup kasir dijawab 429 "Terlalu banyak permintaan. Coba lagi dalam 1 menit." hanya saat spec diulang atau berdekatan | Batas hitungan 10 per menit per pengguna (`batasHitungan` di `routes/sesiKasirRoute.js`), perlindungan hitung buta yang tidak diakali. Satu run `struk-tutup-kasir-alur` memakai sekitar lima hitungan; helper `tungguBatasHitungan` menunggu `Retry-After` lalu mengulang sekali (PW13, 27 November 2026) |
| Pemeriksaan "tidak ada permintaan" bagi pengguna terbatas menghitung 1, padahal peran itu tidak memegang izinnya | Pencatat `page.on("request")` dipasang sebelum `masukSebagai`, sehingga permintaan sesi sebelumnya (Owner) selama berpindah pengguna ikut terhitung. Pasang pencatat sesudah perpindahan selesai, sebelum `goto` halaman yang diuji (PW08, 27 November 2026) |
| PDF cetak berukuran Letter (612 pt) padahal `@page` menulis 80 mm | Nilai `size` yang tidak sah diabaikan seluruhnya; `80mm auto` tidak sah (tinggi tidak boleh `auto`). Tulis dua panjang, atau setel `@page` dari skrip pada `beforeprint` seperti `features/sesi-kasir/area-cetak-struk.tsx`. Aturan `@media print` baru yang sama sekali tidak terbaca di `document.styleSheets` berarti CSS dev server basi: hentikan dev server, hapus `.next/dev`, jalankan ulang (PW11, 27 November 2026) |
| Dua tombol berdampingan `flex-1` berbeda lebar 2 px sesudah tautan menjadi item flex | Basis flex 0 tidak dapat lebih kecil dari border, sehingga tautan berborder 1 px melebar dari tautan `border-none`. Beri border yang sama, berwarna latar (`border-navy`, BT1a) |

Contoh nyata: pada modul role, penghapusan tidak pernah terkirim karena
tombol hapus sempat disabled sampai daftar role selesai dimuat (level
pengguna diturunkan dari daftar itu). Tiga dugaan sebelumnya keliru, dan
satu di antaranya memperburuk keadaan. Trace jaringan menjawabnya dalam
satu putaran.

## Test yang ditandai fixme dan skip bersyarat

Menunggu perbaikan backend: tidak ada sejak penyesuaian backend `ridho`
`0024eb9`. Ke-12 `test.fixme` yang terhitung di baseline sebelumnya
dilepas pada 30 dan 31 Oktober 2026: sembilan skenario lintas outlet
(B142, `2eb668a`), shift dan pola roster yang dibuat di ruang outlet tidak
tampil di ruang gudang (B168, `8b5ad0f`), dan ubah pola roster (B128,
`ea2e752`). Kedua fixme shift dan pola roster itu tadinya bersyarat
konstanta lokasi; syaratnya dibuang di `7f6d623`. Sembilan
`test.fixme(!ADA_IZIN_LINTAS)` lintas outlet yang selalu berjalan sejak
`2eb668a` dibuang syaratnya pada 7 November 2026, bersama
`lintas-outlet.ts` di `tests/helpers`; jumlah skenario tidak berubah.

Sejak 24 November 2026 tiga skenario dibiarkan **merah tanpa
`test.fixme`** sebagai bukti temuan backend, atas keputusan pemilik
proyek ("lapor saja, spec merah"), sehingga suite penuh mengharapkan tiga
kegagalan itu: template General Manajer di `akses/template-role`
(butir 191), revisi surat jalan per kemasan di
`inventaris/bahanBaku/konversi-satuan` (butir 192), dan label status
booking lewat jam di `reservasi/daftar/tandai-selesai` (butir 193).
Begitu backend memperbaikinya, skenario itu harus lolos tanpa diubah
(`referensi/laporan-untuk-backend.md`). Berakhir 26 November 2026:
backend `6478d29` (B369, B370, B377) memperbaiki ketiganya, dan ketiga
spec lolos tanpa diubah, dua kali berturut-turut, 14 dari 14 (PW02).
Suite penuh 27 November 2026 (PW14) membuktikannya: tanpa kegagalan.

Cara membuktikan sebuah fixme: lepas sementara, jalankan dua kali,
kembalikan berkasnya dengan `git checkout`, lalu lepas dan commit per test
yang lolos. Fixme berbadan kosong, fixme yang bersyarat konstanta frontend,
dan fixme yang hanya bermakna bila fixme lain lolos lebih dulu bukan
kandidat. Riwayat pelepasannya ada di `arsip/riwayat-pengujian.md`.

Selain itu ada `test.skip` bersyarat data, bukan penantian backend, yang ikut
terhitung di angka skipped pada baseline:

| Spec | Dilewati bila |
|---|---|
| `inventaris/stockOpname/alur-stok-opname*.spec.ts`, `draft-stok-opname.spec.ts` | Lokasi aktif outlet atau gudang terpilih masih punya opname DRAFT atau SUBMITTED; backend menjawab 409 (tidak terjadi pada data uji sekarang) |
| Dua puluh skenario di `tests/e2e/admin/` (sesi, akun klien, langganan, dan kelola akun) | `.env.e2e` tidak berisi kredensial admin uji (PA5a). Tidak terjadi di mesin pemilik proyek, sehingga tidak terhitung di baseline |
| Ketiga skenario `tests/e2e/setup/plan-fitur.spec.ts` | Sama: akun uji Basic, Advanced, dan Pro dibuat lewat API admin (`8d0f1dd`) |
| Kedelapan skenario `tests/e2e/setup/setup.spec.ts` dan ketiga skenario `tests/e2e/setup/panduan.spec.ts` | Sama: akun uji wizard dibuat dan dihapus lewat API admin (`41194b7`, `c8a2e83`). Sebelumnya spec pratinjau selalu berjalan |

Skenario lain di spec stok, stock adjustment, jurnal stok, stock opname, dan
hapus bahan baku juga dilewati bila datanya kosong. Pada data uji sekarang
itu hanya terjadi di jurnal stok pada tanggal 1, karena data bulan
berjalan masih kosong (baseline 1 November 2026, kini di
`arsip/riwayat-pengujian.md`). Skenario status staf
di `dashboard/dashboard-outlet.spec.ts` dilewati bila monitoring absensi
tidak memuat staf ruang outlet; terjadi di spec terdampak 7 November
2026. Skenario HP di `keuangan/mesin-kasir.spec.ts` dilewati bila
riwayat tujuh hari terakhir kosong; skenario alur di berkas yang sama,
yang berjalan lebih dulu, selalu meninggalkan satu sesi tertutup.
Skenario halaman berikutnya stock adjustment di
`inventaris/halaman-berikutnya.spec.ts` dilewati selama data kedua ruang
10 atau kurang, dan Muat hari sebelumnya di `keuangan/mesin-kasir.spec.ts`
selama riwayat tujuh hari terakhir belum dua halaman; keduanya terjadi di
suite penuh 24 November 2026.

Tiga skenario pendaftaran di `auth/daftar.spec.ts` dilewati bila backend
menjawab 429 (`ALASAN_KUOTA`, `d94a48c`): batas `registerLimiter` 10 per
15 menit per IP berlaku kecuali backend dijalankan dengan
`REGISTER_LIMIT_MAX` lebih besar (B230; perintah di Menjalankan layanan
uji). Skenario ber-OTP di spec daftar dan verifikasi-lupa-password juga
dilewati bila Mailpit tidak menyala (`ALASAN_TANPA_MAILPIT`) atau
kredensial admin uji tidak ada, karena akunnya dibersihkan lewat API
admin. Ketiganya tidak terjadi bila layanan uji dijalankan seperti di
atas.

Lupa password dan verifikasi email dibatasi per IP sejak backend
`e9112a8` (A-03): 20 kirim email (`lupa-password`,
`verifikasi-email/kirim`) dan 30 periksa kode (`reset-password`,
`verifikasi-email`) per 15 menit. Pembatasan ini memang tujuannya, tidak
diakali dan tidak dapat dinaikkan lewat variabel lingkungan (pemilik
proyek, 8 November 2026). Karena itu `auth/daftar.spec.ts` dan
`auth/verifikasi-lupa-password.spec.ts` tidak dijalankan sering-sering,
dan jumlah permintaannya tidak boleh melampaui batas:

- Satu suite penuh memakai sekitar 6 kirim email dan 11 periksa kode
  (bertambah 3 dari skenario tanpa password titipan, 12 November 2026).
  Sesudahnya kedua spec itu dijalankan ulang paling banyak sekali dalam
  15 menit yang sama, tanpa `--repeat-each`.
- Pengujian OTP dibatasi sesedikit mungkin, karena pemakaiannya terbatas
  (pemilik proyek, 12 November 2026). Kedua spec itu, dan uji manual
  yang meminta atau memeriksa kode, hanya dijalankan di suite penuh akhir
  putaran, tidak sendirian untuk debug. Kegagalannya ditelusuri lewat
  trace dan kode lebih dulu; pengulangan kedua dan seterusnya ditanyakan
  ke pemilik proyek.
- Bila perlu diulang lebih dari itu, tunggu 15 menit atau restart
  backend (hitungannya di memori proses).
- 429 di kedua endpoint tidak dilewati `ALASAN_KUOTA`, sehingga tercatat
  sebagai gagal; bacanya sebagai batas yang terlampaui, bukan regresi.
- Spec baru yang memanggil keempat endpoint itu dihitung pemakaiannya
  lebih dulu dan dicatat di sini.
- OTP aksi Owner (B178, B180) tidak termasuk batas per IP di atas; batasnya
  per akun (jeda dan batas harian, dilonggarkan lewat env layanan uji) dan
  `resetPinOwnerLimiter` serta `hapusAkunLimiter` yang hanya menghitung
  percobaan gagal. Pemakaiannya tetap dicatat: `auth/reset-pin-owner.spec.ts`
  1 kirim dan 1 periksa kode per run, pada akun klien sekali pakai;
  `pengaturan/akun-toko-otp.spec.ts` 2 kirim dan 2 periksa kode untuk
  ubah email dan password, ditambah 1 kirim dan 1 periksa untuk hapus akun.
  Penolakan yang disengaja (password lama salah, PIN salah) tidak memakai
  periksa kode, karena backend memeriksanya sebelum kode. Total OTP aksi
  Owner per suite penuh: 4 kirim dan 4 periksa kode.

Ketiga spec tulis stock opname membuat dokumen baru di setiap run dan
menutupnya sebagai CANCELLED, sehingga dokumen CANCELLED bertambah tiga per
run suite penuh. Bila spec gagal di tengah, dokumennya tertinggal aktif dan
run berikutnya dilewati sampai dokumen itu dibatalkan dari halaman detail.
Nomornya dapat dibaca dari pesan `POST /api/stockopname` di trace (lihat
Urutan debug kegagalan e2e di atas).

## Utang pengujian

Utang pengujian yang masih terbuka ada di `referensi/utang-pengujian.md`,
dikirim bersama dokumen modul saat menulis atau mengubah spec modul itu
(`docs/README.md`, Dokumen yang dikirim per jenis pekerjaan). Utang yang
sudah lunas dan kejadian sesekali yang tidak berulang ada di
`arsip/riwayat-pengujian.md`.
