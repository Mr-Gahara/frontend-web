# Pengujian

Sifat perubahan: **Sering**: baseline dan spec rujukan setiap modul; bagian lain bertambah saat ada pelajaran.

Perintah verifikasi dan baseline, cara menelusuri kegagalan e2e, catatan
Playwright, test yang ditandai fixme atau dilewati, utang pengujian, dan spec
rujukan. Baseline dan spec rujukan diperbarui setiap modul.

## Perintah verifikasi yang biasa dipakai

```bash
echo "tsc: $(npx tsc --noEmit > /tmp/t.log 2>&1; echo $?)"; grep 'error TS' /tmp/t.log | cut -c1-110 | head -5
npx eslint features app components lib 2>&1 | tail -3
npx vitest run 2>&1 | tail -5
npx playwright test tests/e2e/<modul> --reporter=json > /tmp/p.json 2>/dev/null; node ~/.cache/frontend-web/alat/ringkas-e2e.js
```

Menjalankan satu test saja, dan memeriksa ketahanannya terhadap flakiness:

```bash
npx playwright test tests/e2e/<modul> -g '<potongan judul>' --reporter=json > /tmp/p.json 2>/dev/null; node ~/.cache/frontend-web/alat/ringkas-e2e.js
npx playwright test tests/e2e/<modul> -g '<potongan judul>' --repeat-each 3 --reporter=line 2>&1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' | grep -E '^\s+[0-9]+ (passed|failed|flaky|skipped|did not run)'
```

Membandingkan jumlah error ESLint sebuah berkas terhadap `HEAD`, untuk
memisahkan error baru dari error warisan (memakai
`~/.cache/frontend-web/alat/hitung-eslint.js`):

```bash
f=path/ke/berkas.tsx; echo "sekarang:$(npx eslint "$f" -f json 2>/dev/null | node ~/.cache/frontend-web/alat/hitung-eslint.js) HEAD:$(git show "HEAD:$f" | npx eslint --stdin --stdin-filename "$f" -f json 2>/dev/null | node ~/.cache/frontend-web/alat/hitung-eslint.js)"
```

Ringkasan e2e, beserta status dan pesan error setiap test yang tidak lolos
(helper `ringkas-e2e.js`, bagian Helper penggantian di `cara-kerja.md`):

```bash
npx playwright test tests/e2e --reporter=json > /tmp/p.json 2>/dev/null; node ~/.cache/frontend-web/alat/ringkas-e2e.js
```

Keluaran reporter `line` jangan dipotong dengan `tail` untuk membaca hasil:
daftar judul test yang gagal atau tidak dijalankan tercetak tanpa baris
ringkasan di dekatnya, sehingga hasilnya ambigu. Ringkasan vitest dibaca
dengan `tail -5`, bukan `grep`, karena baris ringkasannya membawa kode warna
ANSI.

Daftar error ESLint beserta berkas, baris, dan aturannya (helper
`daftar-eslint.js`). Helper ini selalu mencetak `error: N`, sehingga
keluaran kosong tidak pernah berarti bersih. Formatter `unix` tidak ada di
ESLint 9; pakai `json`:

```bash
npx eslint <berkas atau folder> -f json 2>/dev/null | node ~/.cache/frontend-web/alat/daftar-eslint.js
```

Suite e2e penuh memakan 8 sampai 12 menit karena berjalan dengan satu worker
dan memakai backend sungguhan. Saat iterasi cukup jalankan spec modul yang
sedang dikerjakan. **Sebelum setiap commit, vitest penuh dan suite e2e penuh
wajib dijalankan dan seluruhnya lolos**, dengan baseline sebagai pembanding.

**Baseline per penyesuaian backend `f27f093`** (commit `2b3b52d`): 129 test
unit dan integrasi lolos, 203 e2e lolos, 5 skipped: tiga `test.fixme` yang
menunggu backend dan dua `test.skip` bersyarat data (Test yang ditandai
fixme dan skip bersyarat, di bawah). Diukur terhadap backend lokal di branch
`ridho` yang digabung dengan `yoga`. Sebelum perubahan frontend apa pun,
suite penuh terhadap backend itu identik dengan baseline `59e10a1` (118,
203, dan 4), sehingga seluruh selisihnya berasal dari commit `2b3b52d`.
Angka ini pembanding untuk memastikan tidak ada yang
hilang diam-diam. Angka skipped dapat berubah bila data uji berubah; periksa
judul test yang dilewati sebelum menyimpulkan
ada yang hilang. Setiap run suite penuh menambah tiga dokumen stock opname
berstatus CANCELLED (Test yang ditandai fixme dan skip bersyarat, di bawah).

## Kredensial uji

- Akun: `toko@gmail.com` / `Toko1234`
- Pengguna: nama `Ridho`, PIN `123456` (berperan Owner)
- Frontend `localhost:3000`, backend `localhost:4000`

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
gagal; cari dengan `find test-results -name error-context.md`.

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

Contoh nyata: pada modul role, penghapusan tidak pernah terkirim karena
tombol hapus sempat disabled sampai daftar role selesai dimuat (level
pengguna diturunkan dari daftar itu). Tiga dugaan sebelumnya keliru, dan
satu di antaranya memperburuk keadaan. Trace jaringan menjawabnya dalam
satu putaran.

## Catatan Playwright

- Radix Select: buka lewat teks yang sedang tampil di trigger, yaitu placeholder (misalnya "Pilih role") atau nilai terpilih (misalnya "Semua Lokasi"), bukan `getByRole("combobox").nth()`, karena Radix merender trigger beserta select tersembunyi.
- Setelah mutation, tunggu permintaan pemuatan ulang selesai sebelum memeriksa tabel, agar tidak berlomba dengan invalidasi cache.
- Toast Sonner menutup sendiri; jangan jadikan satu-satunya bukti keberhasilan.
- Isi Select sebelum input angka, karena perubahan Select memicu render ulang.
- Test yang lolos saat dijalankan sendirian bisa gagal ketika dijalankan
  bersama spec lain, dan sebaliknya. Bila sebuah test baru lolos, jalankan
  ulang bersama spec satu modul sebelum menyimpulkan selesai.
- Jangan menjadikan perpindahan halaman sebagai penanda keberhasilan bila
  mutation-nya sendiri bisa gagal; periksa efeknya pada data, misalnya
  hilangnya baris dari tabel.
- `page.route` hanya dipakai untuk mensimulasikan kegagalan yang tidak dapat
  dibuat backend secara deterministik, dan hanya untuk method serta path yang
  diperlukan. Request lain tetap ke backend sungguhan, dan intersepsi dilepas
  dengan `page.unroute` setelah dipakai.
- Nama data uji dibuat unik per run (misalnya akhiran dari `Date.now()`), agar
  data sisa dari run yang gagal tidak memicu penolakan duplikat.
- Nilai input berformat rupiah diperiksa dengan pola, misalnya
  `toHaveValue(/15\.?000/)`, bukan string persis, karena tampilannya diubah
  oleh format ribuan.
- `getByText(teks, { exact: true })` gagal (strict mode) bila teks yang sama
  tampil di dua tempat. Sempitkan ke elemen pembungkusnya, misalnya
  `getByText(/no\. ref:/i)` lalu `toContainText(nomor)`.
- Untuk halaman yang hanya menampilkan data, ambil data uji dari respons
  server dengan `page.waitForResponse`, lalu bandingkan tampilan dengan isi
  respons itu. Bila halaman sebelumnya (misalnya dashboard setelah login)
  memanggil endpoint yang sama, pasang penunggu setelah
  `page.goto(url, { waitUntil: "commit" })` atau
  `page.reload({ waitUntil: "commit" })`; bila tidak, respons halaman lama
  ikut tertangkap dan isinya sudah dibuang. Pada stock opname, aturan ini
  terlupa di `reload` dan menggagalkan spec alur. Untuk aksi klik, pasang
  penunggu sebelum klik. Baca isi respons segera, seperti helper `tunggu` di
  spec stok.
- Spec untuk operasi tulis mengembalikan data ke nilai semula, misalnya batas
  minimum dinaikkan 1 lalu dikembalikan, dan opname dikirim dengan fisik sama
  dengan stok. Operasi yang tidak bisa dibatalkan dari UI (tambah barang
  gudang) hanya diuji jalur batal dan gagalnya.
- Simulasi kegagalan GET dengan `page.route` (misalnya status 500) butuh
  timeout sekitar 20 detik pada assertion pesan error, karena TanStack Query
  mengulang permintaan beberapa kali sebelum query dinyatakan gagal.
- Spec pembanding mencocokkan path API tanpa membedakan huruf besar kecil
  (`/\/api\/pengajuanstok/i`). Halaman lama memanggil `/pengajuanStok`,
  sedangkan `features/` memakai konstanta kanonik lowercase; spec yang peka
  huruf gagal setelah migrasi padahal perilakunya sama.
- Respons mentah yang dipakai sebagai harapan dinormalkan dengan
  `normalizeId` dari `lib/api/normalize.ts` bila objek bersarangnya dipakai,
  karena halaman menerima data yang sudah dinormalkan. Pada stock
  adjustment, `referenceID` mentah membawa `_id`, sehingga href yang
  diharapkan menjadi `.../undefined` padahal halamannya benar.
- Bukti bahwa sebuah aksi tidak mengirim permintaan diambil dari penghitung
  `page.on("request", ...)` yang dilepas dengan `page.off`, bukan hanya dari
  toast. Contoh: langkah pengosongan di spec draft stock opname.
- Konfigurasi Playwright tidak menyimpan trace untuk test yang gagal. Untuk
  menelusuri, jalankan ulang test itu dengan `--trace on`; pada spec tulis,
  bersihkan dulu dokumen yang tertinggal agar run ulang tidak `skipped`.
- Blok diagnosis yang menjalankan spec tulis selalu diberi peringatan bahwa
  ia membuat data baru, dan hasil lolos atau gagalnya dicetak, tidak dibuang
  ke `/dev/null`. Spec tulis stock opname membuat dokumen baru setiap kali
  dijalankan, dan dokumen itu tertutup hanya bila test lolos sampai langkah
  pembatalan.

## Test yang ditandai fixme dan skip bersyarat

Menunggu perbaikan backend:

| Test | Menunggu |
|---|---|
| Edit pola roster | Validator memakai `this.siklusHari` dalam konteks `findOneAndUpdate` |
| Hapus pengguna | `Promise.all` paralel di dalam transaksi MongoDB |
| Hitungan tersimpan dapat dikosongkan kembali (`inventaris/stockOpname/draft-stok-opname.spec.ts`) | Validator stock opname menerima `qtyPhysical` null (`kontrak/temuan.md` butir 22). Badannya berupa penanda; skenario ditulis saat `SERVER_TERIMA_HITUNGAN_KOSONG` dibalik |

Selain itu ada `test.skip` bersyarat data, bukan penantian backend, yang ikut
terhitung di angka skipped pada baseline:

| Spec | Dilewati bila |
|---|---|
| `reservasi/aset/crud-aset.spec.ts` | Tidak ada aset berstatus digunakan |
| `inventaris/stok/lihat-stok.spec.ts`, tab kritis gudang | Tidak ada stok gudang yang kritis (terjadi pada data uji sekarang) |
| `inventaris/stockOpname/alur-stok-opname*.spec.ts`, `draft-stok-opname.spec.ts` | Lokasi aktif outlet atau gudang terpilih masih punya opname DRAFT atau SUBMITTED; backend menjawab 409 (tidak terjadi pada data uji sekarang) |

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

- **Jalur staf pada cakupan lokasi** hanya teruji di unit test
  (`tests/unit/features/inventaris/cakupan.test.ts`), karena satu-satunya akun
  uji (Ridho) berperan Owner. Butuh akun staf dengan lokasi aktif untuk
  menambahkannya ke e2e.
- **Tab pengajuan stok yang disembunyikan menurut izin** hanya teruji di
  unit test (`tests/unit/features/pengajuan-stok/pengajuan-stok.test.ts`),
  dengan alasan yang sama: aturannya hanya berlaku bagi petugas transfer
  tanpa izin setujui.
- **Approve stock opname yang berhasil** tidak diuji e2e, karena mengubah
  stok sungguhan. Yang diuji hanya jalur gagalnya.
- **Tambah barang gudang yang berhasil** tidak diuji e2e, karena UI tidak
  punya cara menghapus entri inventory yang terbentuk.
- **`tests/helpers/storage.ts`** masih membaca `sessionStorage` dan sudah
  tidak relevan sejak token dipindah ke memori. Berkas itu belum dibersihkan.
- **Pengosongan hitungan stock opname** baru berupa penanda `test.fixme`
  tanpa badan, karena backend belum menerima `qtyPhysical` null
  (`kontrak/temuan.md` butir 22). Yang teruji saat ini hanya perilaku
  sementara: pengosongan ditahan dengan pesan, tanpa `PATCH`.

## Spec rujukan

- `tests/e2e/inventaris/kategori/crud-kategori.spec.ts`: spec pembanding yang
  ditulis sebelum migrasi, nama dan kode unik per run, dan simulasi kegagalan
  dengan `page.route` hanya untuk satu method dan path.
- `tests/e2e/inventaris/produk/crud-produk.spec.ts`: form bersama dua mode,
  input tanpa label dipilih lewat nama aksesibel (`aria-labelledby`), dan
  pemeriksaan data setelah halaman edit dibuka ulang.
- `tests/e2e/inventaris/stockAdjustment/lihat-stock-adjustment.spec.ts`:
  halaman hanya baca, data uji diambil dari respons server lewat
  `page.waitForResponse`, `test.skip` bila data kosong, dan pemeriksaan sel
  tabel terhadap isi respons yang dinormalkan dengan `normalizeId`; label
  dan tautan sumber diharapkan dari fungsi tampilan yang sama
  (`susunSumber`), sedangkan angka dibandingkan langsung dengan field mentah.
- `tests/e2e/inventaris/jurnalStok/lihat-jurnal-stok.spec.ts`: halaman outlet
  dan gudang yang berbagi komponen, jumlah baris tabel dihitung dari respons
  server, filter Radix Select dibuka lewat teks nilainya, simulasi kegagalan
  GET dengan `page.route`, dan skenario owner (seluruh outlet, pilih satu
  outlet, dengan pemeriksaan bahwa permintaan membawa `locationID`).
- `tests/e2e/inventaris/stok/lihat-stok.spec.ts`: penunggu dipasang setelah
  `goto(..., { waitUntil: "commit" })`, harapan dihitung dari respons
  permintaan itu sendiri, operasi tulis yang mengembalikan nilai semula,
  aturan tombol nonaktif, dan jalur gagal tambah barang dengan `page.route`
  pada POST saja.
- `tests/e2e/inventaris/stockOpname/lihat-stok-opname.spec.ts`: tabel
  berpaginasi diperiksa lewat dokumen pertama dari respons, dan skenario owner
  (seluruh outlet, pilih satu outlet).
- `tests/e2e/inventaris/stockOpname/alur-stok-opname.spec.ts` dan
  `alur-stok-opname-gudang.spec.ts`: alur tulis lengkap dengan `test.step`,
  dokumen baru per run yang ditutup di akhir, skip bila backend menjawab 409,
  dan baris tabel dipilih menurut urutan respons.
- `tests/e2e/inventaris/stockOpname/draft-stok-opname.spec.ts`: payload
  simpan sebagian diperiksa isinya (hanya item yang berubah), pengosongan
  hitungan ditahan tanpa `PATCH` (dibuktikan dengan penghitung request),
  penanda `test.fixme` untuk perilaku yang menunggu backend, dan dokumen yang
  tidak ditemukan.
- `tests/e2e/inventaris/pengajuanStok/lihat-pengajuan-stok.spec.ts`: path API
  dicocokkan tanpa membedakan huruf besar kecil agar berlaku sebelum dan
  sesudah migrasi, harapan dihitung per ruang dengan aturan yang sama
  dengan tampilan (`dariOutlet`, `diGudang`), dan label tab diambil dari
  kode.
- `tests/e2e/inventaris/bahanBaku/hapus-bahan-baku.spec.ts`: dialog yang harus
  tetap terbuka saat operasi gagal.
