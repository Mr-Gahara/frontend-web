# Pengujian

Sifat perubahan: **Sering**: baseline setiap modul; bagian lain bertambah saat ada pelajaran.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Baseline, kredensial uji, cara menelusuri kegagalan e2e, dan test yang
ditandai fixme atau dilewati. Baseline diperbarui setiap modul. Perintah
verifikasi, catatan Playwright, dan spec rujukan ada di
`referensi/playwright.md`; utang pengujian di `referensi/utang-pengujian.md`;
riwayat baseline dan utang yang lunas di `arsip/riwayat-pengujian.md`.

## Baseline

**Suite penuh per cacat tampilan 14 November 2026** (web `a5fa419`,
backend `ridho` lokal `d6709a1`, 14 November 2026, pukul 11.45 sampai
12.24 WIB, reporter `line,json`, atas izin pemilik proyek): e2e 643 lolos
dari 643, tanpa kegagalan dan tanpa skip; skip bersyarat status staf tidak
terjadi. Termasuk spec ber-OTP (verifikasi email, reset PIN Owner, dan
Akun Toko). Harapan 642 di baseline sebelumnya salah hitung: 637 adalah
jumlah lolos, dan totalnya 638 dengan skip status staf, sehingga ditambah
kelima skenario baru menjadi 643. Vitest 1091 lolos. Harapan suite penuh
berikutnya 643, termasuk skip status staf bila datanya kosong (hitungan).

**Baseline per perbaikan cacat tampilan** (web `0df0ca5`, backend `ridho`
lokal `d6709a1`, 14 November 2026): vitest 1091 lolos (9 unit test baru:
`hrefMenuAktif` 4, `PilihTanggal` 3, dan `adaJadwalLokasiLain` 2). Spec e2e
terdampak (dashboard, jurnal stok, pembelian stok, pengajuan stok, stok,
kategori, produk, keuangan, reservasi, diskon, pengguna, jadwal, roles,
daftar penjualan, kategori beban, gudang, dan pratinjau jam buka) 378 lolos,
1 gagal, dan 1 skipped (skip bersyarat status staf), tanpa spec ber-OTP.
Kegagalannya skenario baru Kosongkan di `penjualan/daftar-penjualan.spec.ts`
(salah spec): Terapkan Pencarian menutup panel filter, dan filter tanpa
tanggal sama dengan kunci query awal yang masih segar sehingga tidak ada
permintaan baru. Setelah diperbaiki, spec itu lolos 6/6, dan skenarionya
3/3 dengan `--repeat-each 3`. Skenario baru lain: Libur nonaktif B165 di
`jadwal/jadwal/kelola-jadwal.spec.ts` (sel dan Tambah Manual). Sesudah
batas dua baris (CV12a), spec tabel terdampak (daftar penjualan,
pengajuan stok, diskon, pengguna, tarif, dan folder keuangan) dijalankan
ulang atas izin pemilik proyek: 147 lolos, tanpa OTP. Kedua run itu
bukan suite penuh dan tidak memakai kuota OTP (0 berkas OTP), tetapi run
pertama mencakup lebih dari separuh suite; sesudahnya tidak ada run e2e
sampai suite penuh atas izin pemilik proyek.
Sesudahnya `883a79b` (CV15a sampai CV18a): spec terdampak 31 lolos
(lihat-jurnal-stok, lihat-jadwal, pindah-dana, tutup-akun-bersaldo, dan spec
baru `reservasi/navigasi/tab-navigasi.spec.ts` dengan 2 skenario); asersi
lebar Staf dan kedua skenario tab terbukti gagal terhadap kode lama.
Harapan suite penuh sempat ditulis 642 (salah hitung; lihat suite penuh
14 November 2026 di atas).

**Suite penuh per OTP aksi Owner** (web `8c3c1ea`, backend `ridho` lokal
`d6709a1`, 13 November 2026, pukul 11.47 sampai 12.24 WIB, reporter
`line,json`): e2e 636 lolos, 1 gagal, dan 1 skipped dari 638, sesuai
harapan hitungan 638. Yang dilewati skip bersyarat status staf. Ketiga
skenario ber-OTP Akun Toko (ubah email, ubah password dengan password lama
salah lebih dulu, dan hapus akun) lolos pada run pertamanya.
Kegagalannya `auth/reset-pin-owner.spec.ts`: PIN tersimpan dan login
dengan PIN baru berhasil, tetapi Owner mendarat di dashboard, bukan
kembali ke wizard, karena `/lupa-pin` tidak meneruskan `?kembali=/setup`
(bug web, bukan spec). Diperbaiki lewat `denganKembali`
(`lib/auth/tujuan.ts`) dan dibuktikan tanpa OTP: skenario Lupa PIN? di
`auth/tampilan-login-pengguna.spec.ts` kini memeriksa `kembali` bertahan
dua arah, dan bersama skenario wizard Owner tanpa sesi 3 lolos. Vitest
1082 lolos. Atas izin pemilik proyek, spec ber-OTP reset PIN diulang
sendirian: ulangan pertama berhenti sebelum kode diminta, karena penunggu
`**/lupa-pin` tidak mencocokkan `?kembali=%2Fsetup` (0 kode terpakai);
setelah penunggunya diperbaiki, ulangan kedua lolos (1 kirim dan 1
periksa kode). Harapan suite penuh berikutnya 637 lolos, ditambah skip
status staf bila datanya kosong (hitungan).

**Baseline per hapus akun** (13 November 2026): vitest 1081 lolos (3 unit
test baru di `tests/unit/features/akun-toko/akun-toko.test.ts`). Spec
terdampak `pengaturan/akun-toko.spec.ts` dan `tests/e2e/profil` 13 lolos:
langkah 1 hapus akun (tombol aktif hanya bila nama toko cocok, tanpa
mengirim kode, tanpa meluber), dan profil tanpa Zona Bahaya. Skenario baru
ber-OTP hapus akun di `pengaturan/akun-toko-otp.spec.ts` (akun klien
sekali pakai) menunggu suite penuh akhir putaran. Harapan suite penuh 638:
637 ditambah skenario itu (hitungan).

**Baseline per halaman Akun Toko** (13 November 2026): vitest 1078 lolos (6
unit test baru `tests/unit/features/akun-toko/akun-toko.test.ts`). Spec
terdampak `tests/e2e/pengaturan` dan `auth/gerbang-rute` 52 lolos, termasuk
spec baru `pengaturan/akun-toko.spec.ts` (2 skenario: Owner membuka dari
kartu Pengaturan dan memeriksa tahap 1 kedua dialog tanpa mengirim kode di
390, 768, dan 1280 px; pengguna baca-saja tanpa kartu dan ditolak 403).
Spec baru ber-OTP `pengaturan/akun-toko-otp.spec.ts` (1 skenario, akun
klien sekali pakai) belum dijalankan dan menunggu suite penuh akhir
putaran. Harapan suite penuh 637: 634 ditambah ketiga skenario itu
(hitungan).

**Baseline per reset PIN Owner** (13 November 2026): vitest 1072 lolos (4
unit test baru `tests/unit/features/auth/reset-pin-owner.test.ts`). Spec
terdampak `auth/tampilan-login-pengguna.spec.ts` 5 lolos, termasuk
skenario baru tahap 1 `/lupa-pin` tanpa meluber di 390, 768, dan 1280 px
tanpa mengirim kode. Spec baru ber-OTP `auth/reset-pin-owner.spec.ts` (1
skenario, akun klien sekali pakai) belum dijalankan dan menunggu suite
penuh akhir putaran. Harapan suite penuh 634: 632 ditambah kedua skenario
itu (hitungan).

Baseline sebelum suite penuh 13 November 2026, mulai suite penuh per stok
keluar di detail penjualan (12 November 2026) sampai penyesuaian backend
`ridho` `b5b367a` (21 Oktober 2026), dipindah ke
`arsip/riwayat-pengujian.md` (Riwayat baseline) pada 14 November 2026.

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
| `response.json` gagal dengan `No resource with given identifier found` | Penunggu menangkap respons milik halaman sebelumnya yang sudah dibuang; pasang penunggu setelah `goto(..., { waitUntil: "commit" })` atau `reload(...)` yang sama. Komponen global (topbar, sidebar) yang meminta endpoint yang sama memicunya juga: lonceng TP8a dan spec langganan (suite penuh 12 November 2026). Saat menambah permintaan di komponen global, grep spec yang menunggu endpoint itu |
| Skenario tulis `skipped` padahal kode tidak berubah | Dokumen aktif sisa run yang gagal menghalangi pembuatan (409). Baca pesan `POST` di trace (backend menyebut nomornya), lalu batalkan dokumen itu dari halaman detail |
| `net::ERR_NETWORK_IO_SUSPENDED` saat `page.goto` | Mesin menangguhkan jaringan (tidur atau hemat daya) di tengah suite; jalankan ulang test itu sendirian, lalu suite penuh diawali `systemd-inhibit --what=idle:sleep` |
| Surat jalan uji ditolak karena nomornya bentrok, sekali lalu hilang | Backend membentuk akhiran nomor dari empat digit terakhir `Date.now()` (`transferStokService.js` baris 148 sampai 150), dan setiap run spec transfer membuat surat jalan baru dari pengajuan uji yang sama (124 surat jalan untuk `PGJ/202608/0001` per 28 September 2026), sehingga peluang bentrok naik setiap run (`kontrak/temuan.md` butir 60; terjadi di suite penuh `074e98c` dan `0cfb3bd`). Jalankan ulang test itu sendirian, lalu suite penuh |
| `page.request` di `finally` habis waktu, sekali lalu hilang | Backend sesaat tidak menjawab; permintaan ini tidak melewati `page.route`, sehingga bukan akibat simulasi spec (suite penuh `074e98c`; juga `api()` di hapus tarif pada suite penuh terhadap backend `ridho` `7d28135`, lolos 9 dari 9 saat diulang). Jalankan ulang suite penuh sebelum mengubah spec |
| `waitForResponse` habis waktu setelah kembali ke halaman atau filter yang sudah pernah dimuat | Kunci query masih segar (`staleTime` 5 menit di `components/providers/query-provider.tsx`), sehingga tidak ada permintaan. Buktikan dari tampilan; penunggu jaringan hanya untuk kunci yang belum pernah dimuat (`b63cf08`) |
| Pembersihan tampak lolos, tetapi data uji menumpuk di basis data | Helper pembersihan membuang jawaban permintaannya. Periksa statusnya dengan `expect.soft`, dan jalankan audit endpoint: route yang dihapus backend juga menjawab 404 (`b5a55c4`) |
| `POST /pengajuanstok` ditolak 409 nomor kembar, menetap saat diulang | Backend membentuk nomor dari dokumen terakhir menurut `createdAt` (`kontrak/temuan.md` butir 139). Bandingkan `createdAt` dan waktu `_id` dokumen bernomor terbesar dengan jam sistem lewat skrip baca-saja; dokumen ber-`createdAt` di depan mengunci pembuatan sampai bulan berganti |
| Spec gagal hanya pada jam tertentu, berulang, juga di pohon kerja bersih | Cek `date` dan `date -u`, lalu bandingkan dengan `git stash -u`. Tanggal `YYYY-MM-DD` dibaca backend sebagai 00.00 UTC, sehingga tanggal hari ini ditolak antara 00.00 dan 07.00 WIB (`kontrak/temuan.md` butir 154) |
| Lolos sendirian, gagal saat dijalankan bersama spec lain | Test memilih baris pertama daftar, padahal spec yang berjalan lebih dulu membuat data dari jenis lain (berurutan menurut nama berkas, `workers: 1`). Pilih baris menurut data yang memenuhi syarat, lewat nomornya (`7f1de56`) |
| Pengguna uji terbatas berakhir di Profil Pengguna, dan permintaan halaman tujuan tidak pernah terkirim | `/dashboard` mengalihkan sendiri menurut izin (`app/dashboard/page.tsx`) dan dapat menyalip `goto` berikutnya; layout ruang outlet dan gudang menuntut `read-dashboard-outlet` dan `read-dashboard-gudang`. Helper peran uji menunggu URL meninggalkan `/dashboard`, dan peran uji memegang izin dashboard ruang yang dibukanya (`4601d91`) |
| `page.goto` `net::ERR_ABORTED` tepat setelah spec memasang `page.route` 403 | Halaman sebelumnya masih memuat permintaan susulan (panel dashboard) yang ikut dijawab 403 dan mengalihkan ke /login. Pasang route setelah halaman tujuan termuat, lalu `reload({ waitUntil: "commit" })` (suite penuh 8 November 2026) |
| Opsi popover terlepas dari DOM sekali lalu tidak kembali, hanya di spec ber-`page.clock` | Radix mengembalikan fokus ke pemicu popover sebelumnya lewat `setTimeout`, yang dipalsukan `page.clock`; bila berjalan setelah popover berikutnya dibuka, popover itu menutup. Tunggu popover lepas dan fokus kembali sebelum membuka popover berikutnya (`tungguPopoverLepas` di `tests/helpers/penjualan-uji.ts`). Dibuktikan dengan `page.clock.pauseAt` lalu `runFor`, bukan dengan angka flaky (suite penuh 12 November 2026) |
| Alur berhasil tetapi mendarat di dashboard, bukan kembali ke wizard | Parameter `?kembali=/setup` hilang saat jalur login pengguna melewati halaman lain (`/lupa-pin`). Setiap halaman di jalur itu meneruskannya lewat `denganKembali` (`lib/auth/tujuan.ts`); periksa URL setelah tautan dan pengalihan, bukan hanya tujuan akhir (suite penuh 13 November 2026, OA1a). Penunggu glob seperti `waitForURL("**/lupa-pin")` tidak cocok dengan URL ber-query; pakai regex yang menyebut query-nya |
| Isian PIN terlepas dari DOM saat login ulang sebagai pengguna lain di tab yang sama, lalu halaman sampai di dashboard tanpa `pin-login` | `/login` memulihkan sesi lama lewat cookie (`refreshtoken`, `pin-refresh`) bersamaan dengan login baru, dan halaman login pengguna mengalihkan begitu sesi lama pulih. Buang cookie (`about:blank`, `clearCookies`) sebelum login ulang (`masukSebagai`). Dibuktikan dengan menahan `pin-refresh` sampai URL `/login/pengguna` (suite 12 November 2026, RG4a) |
| `strict mode violation` saat mengklik tombol yang hanya satu di halaman | Nama dicari sebagian dan tidak peka huruf besar: tombol paginasi "Next" ikut cocok dengan "Open Next.js Dev Tools" milik dev server. Pakai `exact: true` (`b03c276`) |

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
