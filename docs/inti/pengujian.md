# Pengujian

Sifat perubahan: **Sering**: baseline setiap modul; bagian lain bertambah saat ada pelajaran.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Baseline, kredensial uji, cara menelusuri kegagalan e2e, dan test yang
ditandai fixme atau dilewati. Baseline diperbarui setiap modul. Perintah
verifikasi, catatan Playwright, dan spec rujukan ada di
`referensi/playwright.md`; utang pengujian di `referensi/utang-pengujian.md`;
riwayat baseline dan utang yang lunas di `arsip/riwayat-pengujian.md`.

## Baseline

**Baseline per penyesuaian backend `ridho` `877e493`** (commit `c2a1e73`,
28 Oktober 2026): 838 test unit dan integrasi lolos. Suite e2e penuh
dijalankan terhadap backend `ridho` `877e493`, pukul 11.09 sampai 11.33
WIB: 503 lolos dan 14 skipped (12 `test.fixme` menunggu backend dan 2
skip bersyarat data), tanpa kegagalan. Totalnya 517, bertambah 8 dari
509 lewat skenario baru di spec stock adjustment, stock opname,
pengajuan stok, jurnal stok, dan spec baru daftar surat jalan
(`tests/e2e/inventaris/transferStok/daftar-surat-jalan.spec.ts`).
Sebelum penyesuaian, suite penuh di atas `5b8cbd9` terhadap backend
`b5b367a` dijalankan di jendela rawan, pukul 00.17 sampai 00.47 WIB: 495
lolos dan 14 skipped, tanpa kegagalan, sehingga utang suite penuh
`7a08b63` dan `5b8cbd9` lunas. Kedelapan commit penyesuaian
masing-masing menjalankan spec terdampaknya, lewat gerbang
ber-`pipefail` sejak `cab57a9` (`referensi/helper-dan-shell.md`,
Catatan shell).

**Baseline per pembelian stok dan audit pergantian hari** (commit
`5b8cbd9`, 26 Oktober 2026): 827 test unit dan integrasi lolos di 92
berkas. Suite e2e berisi 509 test. Suite penuh terakhir dijalankan di
`e073a9d`, pukul 01.42 sampai 02.06 WIB: 493 lolos dan 14 skipped (12
`test.fixme` menunggu backend dan 2 skip bersyarat data), tanpa
kegagalan. Sebelumnya di `6d07b8d` (00.53 sampai 01.18 WIB): 490 lolos
dan 14 skipped. Suite penuh pertama di jendela dini hari (00.11 sampai
00.35 WIB, di atas `1e4f042` dengan isi `e073a9d` yang belum di-commit)
gagal 1 dari 506 di spec pengeluaran, yang membuka audit pergantian
hari. Sesudah `e073a9d`, `7a08b63` menambah dua skenario penjualan dan
`5b8cbd9` tidak menambah e2e; keduanya hanya menjalankan spec terdampak
(dashboard, keuangan, pembelian stok, dan penjualan 77 lolos dengan 1
skipped; spec template role 18 lolos dengan 2 skipped), dan suite
penuhnya menjadi utang (`referensi/utang-pengujian.md`).

**Baseline per pengembalian Outlet ke Gudang** (commit `a505783`, 25
Oktober 2026): 755 test unit dan integrasi lolos di 86 berkas. Suite e2e
berisi 495 test di 72 berkas: 492 per `b03c276`, ditambah skenario
pengembalian di spec alur dan spec daftar pengajuan stok, serta
`alur-pengembalian.spec.ts`. Suite penuh tidak dijalankan ulang; spec
terdampak (pengajuan stok, surat jalan, penerimaan barang, dan dashboard
gudang) lolos 30 dengan 3 skipped dari 33. Catatan `a972956` di bawah
menulis spec pengajuan stok dan surat jalan lolos 25 dengan 3 skipped;
angka itu tidak dapat dicocokkan, karena kedua folder berisi 24 test,
26 bersama penerimaan barang, dan tidak ada spec yang berubah sesudahnya.

**Baseline per penyesuaian backend `ridho` `b5b367a`** (commit `b03c276`,
21 Oktober 2026): 721 test unit dan integrasi lolos di 86 berkas. Suite
e2e penuh dijalankan terhadap backend `ridho` `b5b367a`: 478 lolos dan
14 skipped, tanpa kegagalan, dalam 23,3 menit. Totalnya 492: 490 per
`d6f8ba0`, ditambah dua di spec jurnal stok (skenario pencarian
dibuang; alasan, periode, dan halaman berikutnya ditambahkan). Skip
bersyarat data yang di `d6f8ba0` belum teridentifikasi adalah "buat
surat jalan gagal" di spec alur pengajuan: tenant uji tidak punya
pengajuan APPROVED tanpa surat jalan. Sesudahnya `029413d` menambah
satu test unit (722); suite penuh tidak dijalankan ulang, dan spec
terdampaknya lolos 16 dengan 1 skipped. Sesudahnya `a972956` (label tab
berbahasa awam) menambah delapan test unit, sehingga vitest penuh
menjadi 730 lolos di 86 berkas; suite penuh tidak dijalankan ulang, dan
spec terdampaknya dicatat lolos 25 dengan 3 skipped untuk pengajuan
stok dan surat jalan, angka yang tidak dapat dicocokkan dengan isi spec
(paragraf di atas), serta dashboard gudang 4.

## Kredensial uji

- Akun: `toko@gmail.com` / `Toko1234`
- Pengguna: nama `Ridho`, PIN `123456` (berperan Owner)
- Frontend `localhost:3000`, backend `localhost:4000`
- Akun admin platform: tidak ditulis di sini (keputusan PA6a). Spec
  membacanya dari `E2E_ADMIN_EMAIL` dan `E2E_ADMIN_PASSWORD` di `.env.e2e`
  (akar repo, diabaikan git) atau dari variabel lingkungan, lewat
  `tests/helpers/admin-uji.ts`

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
| `response.json` gagal dengan `No resource with given identifier found` | Penunggu menangkap respons milik halaman sebelumnya yang sudah dibuang; pasang penunggu setelah `goto(..., { waitUntil: "commit" })` atau `reload(...)` yang sama |
| Skenario tulis `skipped` padahal kode tidak berubah | Dokumen aktif sisa run yang gagal menghalangi pembuatan (409). Baca pesan `POST` di trace (backend menyebut nomornya), lalu batalkan dokumen itu dari halaman detail |
| `net::ERR_NETWORK_IO_SUSPENDED` saat `page.goto` | Mesin menangguhkan jaringan (tidur atau hemat daya) di tengah suite; jalankan ulang test itu sendirian, lalu suite penuh diawali `systemd-inhibit --what=idle:sleep` |
| Surat jalan uji ditolak karena nomornya bentrok, sekali lalu hilang | Backend membentuk akhiran nomor dari empat digit terakhir `Date.now()` (`transferStokService.js` baris 148 sampai 150), dan setiap run spec transfer membuat surat jalan baru dari pengajuan uji yang sama (124 surat jalan untuk `PGJ/202608/0001` per 28 September 2026), sehingga peluang bentrok naik setiap run (`kontrak/temuan.md` butir 60; terjadi di suite penuh `074e98c` dan `0cfb3bd`). Jalankan ulang test itu sendirian, lalu suite penuh |
| `page.request` di `finally` habis waktu, sekali lalu hilang | Backend sesaat tidak menjawab; permintaan ini tidak melewati `page.route`, sehingga bukan akibat simulasi spec (suite penuh `074e98c`; juga `api()` di hapus tarif pada suite penuh terhadap backend `ridho` `7d28135`, lolos 9 dari 9 saat diulang). Jalankan ulang suite penuh sebelum mengubah spec |
| `waitForResponse` habis waktu setelah kembali ke halaman atau filter yang sudah pernah dimuat | Kunci query masih segar (`staleTime` 5 menit di `components/providers/query-provider.tsx`), sehingga tidak ada permintaan. Buktikan dari tampilan; penunggu jaringan hanya untuk kunci yang belum pernah dimuat (`b63cf08`) |
| Pembersihan tampak lolos, tetapi data uji menumpuk di basis data | Helper pembersihan membuang jawaban permintaannya. Periksa statusnya dengan `expect.soft`, dan jalankan audit endpoint: route yang dihapus backend juga menjawab 404 (`b5a55c4`) |
| `POST /pengajuanstok` ditolak 409 nomor kembar, menetap saat diulang | Backend membentuk nomor dari dokumen terakhir menurut `createdAt` (`kontrak/temuan.md` butir 139). Bandingkan `createdAt` dan waktu `_id` dokumen bernomor terbesar dengan jam sistem lewat skrip baca-saja; dokumen ber-`createdAt` di depan mengunci pembuatan sampai bulan berganti |
| Spec gagal hanya pada jam tertentu, berulang, juga di pohon kerja bersih | Cek `date` dan `date -u`, lalu bandingkan dengan `git stash -u`. Tanggal `YYYY-MM-DD` dibaca backend sebagai 00.00 UTC, sehingga tanggal hari ini ditolak antara 00.00 dan 07.00 WIB (`kontrak/temuan.md` butir 154) |
| Lolos sendirian, gagal saat dijalankan bersama spec lain | Test memilih baris pertama daftar, padahal spec yang berjalan lebih dulu membuat data dari jenis lain (berurutan menurut nama berkas, `workers: 1`). Pilih baris menurut data yang memenuhi syarat, lewat nomornya (`7f1de56`) |
| `strict mode violation` saat mengklik tombol yang hanya satu di halaman | Nama dicari sebagian dan tidak peka huruf besar: tombol paginasi "Next" ikut cocok dengan "Open Next.js Dev Tools" milik dev server. Pakai `exact: true` (`b03c276`) |

Contoh nyata: pada modul role, penghapusan tidak pernah terkirim karena
tombol hapus sempat disabled sampai daftar role selesai dimuat (level
pengguna diturunkan dari daftar itu). Tiga dugaan sebelumnya keliru, dan
satu di antaranya memperburuk keadaan. Trace jaringan menjawabnya dalam
satu putaran.

## Test yang ditandai fixme dan skip bersyarat

Menunggu perbaikan backend:

| Test | Menunggu |
|---|---|
| Edit pola roster | Validator memakai `this.siklusHari` dalam konteks `findOneAndUpdate` |
| Sembilan skenario lintas outlet di spec jurnal stok, stock opname (daftar), pengajuan stok (daftar), stok, stock adjustment, dan daftar penjualan (`20c026b`) | Backend menetapkan permission lintas outlet dan `IZIN_LINTAS_OUTLET` diisi (`kontrak/temuan.md` butir 39). `test.fixme` bersyarat lewat `tests/helpers/lintas-outlet.ts`; badannya lengkap dan berjalan sendiri begitu konstanta diisi |
| Shift yang dibuat di ruang outlet tidak tampil di ruang gudang (`jadwal/shift/crud-shift.spec.ts`) | Backend memisahkan shift per lokasi dan `KUNCI_LOKASI_SHIFT` di `features/shift/ruang.ts` diisi (`kontrak/temuan.md` butir 70). `test.fixme` bersyarat; badannya lengkap |
| Pola yang dibuat di ruang outlet tidak tampil di ruang gudang (`jadwal/pola-roster/crud-pola-roster.spec.ts`) | Backend memisahkan pola roster per lokasi dan `KUNCI_LOKASI_POLA_ROSTER` di `features/pola-roster/ruang.ts` diisi (`kontrak/temuan.md` butir 70). `test.fixme` bersyarat; badannya lengkap |

Cara membuktikan sebuah fixme: lepas sementara, jalankan dua kali,
kembalikan berkasnya dengan `git checkout`, lalu lepas dan commit per test
yang lolos. Fixme berbadan kosong, fixme yang bersyarat konstanta frontend,
dan fixme yang hanya bermakna bila fixme lain lolos lebih dulu bukan
kandidat. Riwayat pelepasannya ada di `arsip/riwayat-pengujian.md`.

Selain itu ada `test.skip` bersyarat data, bukan penantian backend, yang ikut
terhitung di angka skipped pada baseline:

| Spec | Dilewati bila |
|---|---|
| `inventaris/stok/lihat-stok.spec.ts`, tab kritis gudang | Tidak ada stok gudang yang kritis (terjadi pada data uji sekarang) |
| `inventaris/stockOpname/alur-stok-opname*.spec.ts`, `draft-stok-opname.spec.ts` | Lokasi aktif outlet atau gudang terpilih masih punya opname DRAFT atau SUBMITTED; backend menjawab 409 (tidak terjadi pada data uji sekarang) |
| Skenario jalur terkunci di spec stok, pengajuan stok (daftar), stock adjustment, dan daftar penjualan (`20c026b`) | `IZIN_LINTAS_OUTLET` sudah diisi, sehingga Ridho memegangnya; butuh akun uji tanpa izin itu. Tidak terjadi selama konstanta null, sehingga belum terhitung di baseline |
| Halaman shift gudang dengan keterangan pemakaian bersama (`jadwal/shift/crud-shift.spec.ts`) | `KUNCI_LOKASI_SHIFT` sudah diisi, sehingga keterangan tidak tampil lagi. Tidak terjadi selama konstanta null |
| Halaman pola roster gudang dengan keterangan pemakaian bersama (`jadwal/pola-roster/crud-pola-roster.spec.ts`) | `KUNCI_LOKASI_POLA_ROSTER` sudah diisi, sehingga keterangan tidak tampil lagi. Tidak terjadi selama konstanta null |
| Enam belas skenario di `tests/e2e/admin/` (sesi, akun klien, langganan, dan kelola akun) | `.env.e2e` tidak berisi kredensial admin uji (PA5a). Tidak terjadi di mesin pemilik proyek, sehingga tidak terhitung di baseline |

Skenario lain di spec stok, stock adjustment, jurnal stok, stock opname, dan
hapus bahan baku juga dilewati bila datanya kosong, tetapi tidak terjadi pada
data uji sekarang.

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
