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
ANSI, bahkan saat keluarannya dialihkan ke berkas. Gerbang yang memakai
`grep` atas keluaran alat membuang kode ANSI lebih dulu
(`sed 's/\x1b\[[0-9;]*[A-Za-z]//g'`), dan setiap langkah gerbang mencetak
alasannya saat gagal. `grep -q` yang gagal tanpa pesan sempat menghentikan
commit `08d0a73` diam-diam.

Daftar error ESLint beserta berkas, baris, dan aturannya (helper
`daftar-eslint.js`). Helper ini selalu mencetak `error: N`, sehingga
keluaran kosong tidak pernah berarti bersih. Formatter `unix` tidak ada di
ESLint 9; pakai `json`:

```bash
npx eslint <berkas atau folder> -f json 2>/dev/null | node ~/.cache/frontend-web/alat/daftar-eslint.js
```

Memastikan tidak ada spec yang memalsukan respons sukses (helper
`audit-fulfill.js`, keputusan rancangan butir 21). Helper keluar dengan
kode gagal bila ada `route.fulfill` berstatus sukses tanpa tanda
`// simulasi:`, sehingga dipakai sebagai gerbang di blok commit spec.
Selama spec reservasi belum dibangun ulang, audit seluruh suite gagal;
jalankan untuk folder spec yang diubah:

```bash
node ~/.cache/frontend-web/alat/audit-fulfill.js tests/e2e
```

Saat menutup modul, kolom "Dipakai di" di `docs/kontrak/endpoint.md` dan
kecocokan frontend dengan backend diperiksa lewat helper `audit-endpoint.js`
(`cara-kerja.md`, Helper penggantian). Jalankan
`node ~/.cache/frontend-web/alat/audit-endpoint.js | head -40` dari akar
repo, nilai setiap baris laporannya, lalu ulangi dengan `--tulis`. Audit 22
September 2026 memastikan seluruh panggilan frontend ada di backend dan
tercatat di kontrak.

Suite e2e penuh memakan 8 sampai 12 menit karena berjalan dengan satu worker
dan memakai backend sungguhan. Saat iterasi cukup jalankan spec modul yang
sedang dikerjakan. **Sebelum setiap commit, vitest penuh dan suite e2e penuh
wajib dijalankan dan seluruhnya lolos**, dengan baseline sebagai pembanding.

Satu pengecualian atas backend sungguhan: ketiga spec master data
reservasi masih memalsukan respons sukses sampai dibangun ulang di modul
reservasi (Utang pengujian, di bawah). Spec lain memakai `page.route`
hanya untuk jalur gagal, terbukti dengan `audit-fulfill.js` pada 26
September 2026.

**Baseline per perbaikan spec login** (commit `5a3deea`): 186 test
unit dan integrasi lolos di 27 berkas, 225 e2e lolos, 17 skipped:
delapan `test.fixme` bersyarat yang menunggu izin lintas outlet dari
backend, tujuh `test.fixme` lain yang menunggu backend (tiga di antaranya
di spec alur penjualan), dan dua `test.skip` bersyarat data (Test yang
ditandai fixme dan skip bersyarat, di bawah). Satu e2e lebih banyak dari
baseline modul penjualan (`f33ffa6`, 224), karena skenario kredensial
salah di spec login dipecah dua.
Diukur terhadap backend lokal `00b9957` (branch `ridho` setelah
menggabungkan origin/yoga `77f4767`). Angka ini pembanding untuk memastikan tidak ada
yang hilang diam-diam. Angka skipped dapat berubah bila data uji berubah;
periksa judul test yang dilewati sebelum menyimpulkan ada yang hilang.
Begitu `IZIN_LINTAS_OUTLET` diisi, delapan skenario lintas outlet berjalan
dan tiga skenario jalur terkunci dilewati.

Setiap run suite penuh menambah tiga dokumen stock opname berstatus
CANCELLED, serta tiga surat jalan BATAL dan empat entri jurnal gudang. Spec
penerimaan dan spec pengiriman masing-masing membatalkan satu surat jalan
DIKIRIM (jurnal kirim dan jurnal batal), dan spec alur transfer membatalkan
satu surat jalan PENDING tanpa jurnal. Terbukti dengan
`tinjau-surat-jalan.js BATAL` pada suite penuh `580a1e1`. Aturan data uji
spec tulis ada di Test yang ditandai fixme dan skip bersyarat, di bawah.

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
- `route.fulfill` berstatus sukses dilarang (keputusan rancangan butir 21).
  Keadaan memuat diuji dengan menahan permintaan lalu `route.continue()`,
  sehingga responsnya tetap dari backend. Simulasi berstatus 200 yang tidak
  terhindarkan dibentuk dari respons nyata bila bisa (`route.fetch()` lalu
  mengubah satu field) dan ditandai `// simulasi: <alasan>` di baris
  `fulfill` atau tepat di atasnya. Periksa dengan `audit-fulfill.js`.
- Pesan gagal dibandingkan dengan `message` respons nyata yang ditunggu
  lewat `page.waitForResponse`, bukan dengan teks yang ditulis di spec.
  Spec login lama menulis sendiri 401 "Email atau password salah.",
  padahal backend menjawab 404 dan 400 dengan pesan lain.
- Uji login gagal memakai email atau nama pengguna unik per run, karena
  pembatas login dihitung per IP dan email serta per tenant dan nama.
  Percobaan gagal dengan akun uji menambah hitungan yang, bila habis,
  mengunci login seluruh suite selama 15 menit.
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
- Payload operasi tulis yang tidak boleh meninggalkan data diperiksa dengan
  `page.route` yang menjawab gagal hanya untuk method dan path itu: isi
  permintaan dibaca dari `page.waitForRequest`, lalu pesan gagal di UI
  diperiksa. Contoh: skenario payload buat di spec daftar pengajuan stok.
- Setiap navigasi penuh (`goto`, `reload`) memulihkan sesi lewat
  `pin-refresh`, dan token yang dipegang spec sebelum refresh itu dijawab
  401 "Sesi tidak valid". Spec yang memanggil API dengan `page.request`
  mengambil token dari respons `pin-refresh` pemuatan halaman, lalu
  menggantinya setiap kali halaman melakukan `pin-refresh` lagi. Token dari
  permintaan pertama yang membawa `Authorization` tidak dipakai, karena
  bisa milik halaman sebelumnya. Contoh: `bukaDenganAuth` di
  `tests/helpers/transfer-uji.ts`, dipakai spec penerimaan, transfer, dan
  alur pengajuan stok. Spec alur pengajuan sempat punya `bukaDenganAuth`
  lokal bernama sama yang membekukan token dari permintaan API pertama,
  dan itulah penyebab kegagalan sesekali "setujui gagal: dialog bertahan
  dan pesan tampil": halaman mendarat di login karena token spec sudah
  dijawab 401. Gejalanya muncul dua kali pada 21 September 2026, sekali
  pada 22 September, dan tiga kali berturut-turut pada `247cf2d`, selalu
  bergantung pada waktu `pin-refresh`. Diperbaiki di `8d62c56` dengan
  memakai helper bersama; 260 dari 260 lolos dengan `--repeat-each 20`.
  Bila gejala serupa muncul di spec lain, periksa lebih dulu apakah spec
  itu memakai helper bersama atau versi lokalnya sendiri.
- Persiapan data lewat API memeriksa status setiap langkah dan menyertakan
  pesan backend. `test.skip` hanya dipakai bila memang tidak ada data yang
  layak; kegagalan persiapan sebagian menggagalkan test setelah dokumen
  yang sempat tercipta dibatalkan. Pada spec penerimaan, `skip` sempat
  menelan `GET` yang dijawab 401 dan meninggalkan surat jalan DIKIRIM.
- Pemeriksaan di blok `finally` memakai `expect.soft`. Pengecualian yang
  dilempar di `finally` menggantikan kegagalan asli test, sehingga
  penyebabnya hilang dari laporan: pada spec penerimaan, kegagalan
  selector sempat tertutup oleh kegagalan pembatalan.
- Spec pembanding memakai `expect.soft` untuk setiap perilaku yang akan
  diubah, agar seluruh perbedaan dengan kode lama terlapor dalam satu run.
  Pemeriksaan keras hanya untuk syarat jalannya skenario.
- Helper pembuka halaman yang menunggu respons tidak mengodekan jalur
  peran. `bukaOutlet` di spec stok sempat menunggu `GET /inventory` tanpa
  `locationID` (jalur owner lama), sehingga saat cakupan berubah, enam test
  yang perilakunya tidak berubah ikut gagal. Penunggu mengikuti lingkup
  halaman (`ADA_IZIN_LINTAS`).
- Ringkasan `passed:0 failed:0 skipped:0` berarti tidak ada test yang
  berjalan, biasanya karena spec gagal dikompilasi (misalnya modul helper
  belum ada), bukan hasil bersih. Jalankan `tsc` lebih dulu.
- Asersi "tidak berubah" hanya bermakna bila bacaannya terbukti segar. Di
  spec alur penjualan, asersi "tidak ada jurnal baru" lolos padahal daftar
  jurnal di-cache 300 detik, sehingga bacaan sesudah selalu sama dengan
  sebelumnya. Pastikan lebih dulu bahwa perubahan yang diharapkan memang
  terbaca lewat sumber yang sama (asersi positif), baru percayai asersi
  negatifnya.
- Data uji harus dapat membedakan hasil yang benar dari yang salah. Bila
  data hanya punya satu nilai (satu outlet), skenario penyaringan lolos
  tanpa menguji apa pun; uji aturannya di unit test dan catat
  keterbatasannya di Utang pengujian.

## Test yang ditandai fixme dan skip bersyarat

Menunggu perbaikan backend:

| Test | Menunggu |
|---|---|
| Edit pola roster | Validator memakai `this.siklusHari` dalam konteks `findOneAndUpdate` |
| Hapus pengguna | `Promise.all` paralel di dalam transaksi MongoDB |
| Hitungan tersimpan dapat dikosongkan kembali (`inventaris/stockOpname/draft-stok-opname.spec.ts`) | Validator stock opname menerima `qtyPhysical` null (`kontrak/temuan.md` butir 22). Badannya berupa penanda; skenario ditulis saat `SERVER_TERIMA_HITUNGAN_KOSONG` dibalik |
| Jumlah diterima 0 terkirim apa adanya (`inventaris/penerimaanBarang/terima-penerimaan.spec.ts`) | Backend berhenti menghitung stok masuk dengan `qtyTerima \|\| qtyKirim` (`kontrak/temuan.md` butir 30). Badannya lengkap; jalankan setelah `SERVER_TERIMA_JUMLAH_NOL` dibalik |
| Jurnal Keluar penjualan langsung terbaca setelah finalisasi, dan finalisasi yang ditolak tidak menambah jurnal (`penjualan/alur-penjualan.spec.ts`, dua test) | Backend membersihkan cache daftar jurnal setiap kali `inventoryService` menulis jurnal (`kontrak/temuan.md` butir 46). Keduanya dibuka bersamaan: test kedua baru bermakna bila bacaan jurnal terbukti segar |
| Finalisasi berhasil bila stok bahan outlet cukup walau stok produk tidak (`penjualan/alur-penjualan.spec.ts`) | Backend menghubungkan stok produk ke stok lokasi (`kontrak/temuan.md` butir 37) |
| Delapan skenario lintas outlet di spec jurnal stok, stock opname (daftar), pengajuan stok (daftar), stok, dan stock adjustment | Backend menetapkan permission lintas outlet dan `IZIN_LINTAS_OUTLET` diisi (`kontrak/temuan.md` butir 39). `test.fixme` bersyarat lewat `tests/helpers/lintas-outlet.ts`; badannya lengkap dan berjalan sendiri begitu konstanta diisi |

Selain itu ada `test.skip` bersyarat data, bukan penantian backend, yang ikut
terhitung di angka skipped pada baseline:

| Spec | Dilewati bila |
|---|---|
| `reservasi/aset/crud-aset.spec.ts` | Tidak ada aset berstatus digunakan. Spec ini memalsukan respons sukses; skenarionya pindah ke spec alur reservasi yang membuat booking sungguhan (keputusan R1a dan R2b) |
| `inventaris/stok/lihat-stok.spec.ts`, tab kritis gudang | Tidak ada stok gudang yang kritis (terjadi pada data uji sekarang) |
| `inventaris/stockOpname/alur-stok-opname*.spec.ts`, `draft-stok-opname.spec.ts` | Lokasi aktif outlet atau gudang terpilih masih punya opname DRAFT atau SUBMITTED; backend menjawab 409 (tidak terjadi pada data uji sekarang) |
| `inventaris/penerimaanBarang/terima-penerimaan.spec.ts`, `inventaris/transferStok/*.spec.ts` | Tidak ada pengajuan APPROVED atau PENDING berarah benar tanpa surat jalan dengan stok gudang cukup. Kegagalan persiapan lain menggagalkan test, bukan melewatinya |
| Skenario jalur terkunci di spec stok, pengajuan stok (daftar), dan stock adjustment | `IZIN_LINTAS_OUTLET` sudah diisi, sehingga Ridho memegangnya; butuh akun uji tanpa izin itu. Tidak terjadi selama konstanta null, sehingga belum terhitung di baseline |

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

- **Cakupan lokasi di e2e hanya teruji satu jalur pada satu waktu**,
  karena satu-satunya akun uji (Ridho) berperan Owner. Selama
  `IZIN_LINTAS_OUTLET` null, Ridho terkunci ke outlet tenant dan jalur
  terkunci teruji e2e, sedangkan jalur lintas outlet berupa `test.fixme`
  bersyarat. Begitu konstanta diisi, keduanya bertukar dan jalur terkunci
  butuh akun uji tanpa izin itu. Keduanya teruji di unit test
  (`tests/unit/features/inventaris/cakupan.test.ts`).
- **Tab pengajuan stok yang disembunyikan menurut izin** hanya teruji di
  unit test (`tests/unit/features/pengajuan-stok/pengajuan-stok.test.ts`),
  dengan alasan yang sama: aturannya hanya berlaku bagi petugas transfer
  tanpa izin setujui.
- **Approve stock opname yang berhasil** tidak diuji e2e, karena mengubah
  stok sungguhan. Yang diuji hanya jalur gagalnya.
- **Setujui pengajuan dan buat surat jalan yang berhasil** tidak diuji e2e,
  karena keduanya meninggalkan dokumen permanen (pengajuan dan transfer
  tidak dapat dihapus). Yang diuji hanya jalur gagalnya.
- **Tambah barang gudang yang berhasil** tidak diuji e2e, karena UI tidak
  punya cara menghapus entri inventory yang terbentuk.
- **Terima penerimaan yang berhasil** tidak diuji e2e, karena menambah stok
  outlet secara permanen dan surat jalan DITERIMA tidak dapat dibatalkan.
  Yang diuji hanya jalur gagalnya beserta isi payload.
- **Item tanpa master bahan baku pada penerimaan** hanya teruji di unit
  test (`tests/unit/features/transfer-stok/payload.test.ts`), karena
  membuat datanya berarti menghapus master bahan baku.
- **Kirim surat jalan yang berhasil lewat UI** tidak diuji e2e, karena
  memotong stok gudang. Kirim dijalankan lewat API di persiapan spec dan
  dibatalkan di akhir; dari UI hanya jalur gagalnya yang diuji.
- **Tombol aksi surat jalan yang disembunyikan menurut izin** hanya teruji
  di unit test (`aksiSuratJalan`), dengan alasan yang sama dengan cakupan
  lokasi: satu-satunya akun uji berperan Owner.
- **Gate halaman yang menolak pengguna tanpa sebagian izin** hanya teruji
  di unit test (`tests/unit/lib/auth/gate-stock-adjustment.test.ts`, kedua
  ruang),
  dengan alasan yang sama.
- **`tests/helpers/storage.ts`** masih membaca `sessionStorage` dan sudah
  tidak relevan sejak token dipindah ke memori. Berkas itu belum dibersihkan.
- **Pengosongan hitungan stock opname** baru berupa penanda `test.fixme`
  tanpa badan, karena backend belum menerima `qtyPhysical` null
  (`kontrak/temuan.md` butir 22). Yang teruji saat ini hanya perilaku
  sementara: pengosongan ditahan dengan pesan, tanpa `PATCH`.

- **Cakupan per lokasi di daftar penjualan tidak punya skenario e2e.** Data
  uji hanya punya satu outlet, sehingga penyaringan per lokasi tidak dapat
  dibedakan dari tanpa penyaringan. Aturannya, termasuk K11b dan penjualan
  tanpa lokasi, diuji di `tests/unit/features/penjualan/filter.test.ts`.
- **Jalur tanpa `read-location` di halaman penjualan** (tanpa cakupan, dan
  tanpa `locationID` saat membuat) hanya teruji di unit test, dengan alasan
  yang sama: satu-satunya akun uji berperan Owner.
- **Idempotensi hanya teruji dari sisi klien**: kunci terkirim dan sama saat
  permintaan diulang. Penahanan permintaan kembar di backend tidak diuji
  dari web.
- **Tiga spec master data reservasi memalsukan respons sukses**: 70
  `route.fulfill` sukses di spec tipe aset, tarif, dan aset menurut audit
  26 September 2026, sehingga skenario buat, edit, dan hapusnya tidak
  pernah menyentuh backend. Dibangun ulang terhadap backend sungguhan
  sebagai langkah pertama modul reservasi (keputusan R1a).
- **Password salah pada akun uji menambah hitungan pembatas login**, dan
  login sukses tidak menguranginya. Spec login gagal lebih awal bila sisa
  kuota di header `RateLimit` di bawah 3; menjalankan spec auth berulang
  (`--repeat-each`) dalam 15 menit dapat mengunci login seluruh suite.

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
  Sejak `247cf2d`, satu berkas memuat dua `describe` per ruang: helper
  `bukaDaftar` menerima url dan tipe lokasi, dan skenario gudang memeriksa
  daftar tidak memuat adjustment outlet, penolakan id ruang lain, serta
  tautan setelah setujui dari detail opname gudang.
- `tests/e2e/inventaris/jurnalStok/lihat-jurnal-stok.spec.ts`: halaman outlet
  dan gudang yang berbagi komponen, jumlah baris tabel dihitung dari respons
  server, filter Radix Select dibuka lewat teks nilainya, simulasi kegagalan
  GET dengan `page.route` pada endpoint lokasi yang dipakai jalurnya, dan
  skenario lintas outlet (pilih satu outlet, dengan pemeriksaan bahwa
  permintaan membawa `locationID`) sebagai `test.fixme` bersyarat.
- `tests/e2e/inventaris/stok/lihat-stok.spec.ts`: penunggu dipasang setelah
  `goto(..., { waitUntil: "commit" })`, harapan dihitung dari respons
  permintaan itu sendiri, operasi tulis yang mengembalikan nilai semula,
  aturan tombol nonaktif, dan jalur gagal tambah barang dengan `page.route`
  pada POST saja.
- `tests/e2e/inventaris/stockOpname/lihat-stok-opname.spec.ts`: tabel
  berpaginasi diperiksa lewat dokumen pertama dari respons, dan skenario
  lintas outlet (pilih satu outlet) sebagai `test.fixme` bersyarat.
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
  dengan tampilan (`diOutlet` dan `diGudang` lewat `arahBenar`), payload buat
  diperiksa lewat `page.route` yang menjawab gagal sehingga tidak ada data
  tersimpan, dan label tab diambil dari
  kode.
- `tests/e2e/inventaris/pengajuanStok/alur-pengajuan-stok.spec.ts`: spec
  pembanding alur tulis yang ditulis dan dijalankan terhadap kode lama
  sebelum migrasi (pilihan A, `status.md` Catatan dari modul inventaris).
  Test pertama membuat satu
  pengajuan per run dan menutupnya REJECTED; dialog yang harus bertahan
  saat operasi gagal diperiksa dengan `expect.soft` agar alur tetap
  selesai walau pemeriksaan itu gagal. Setujui dan surat jalan memakai
  pengajuan yang sudah ada dan hanya menguji jalur gagalnya; daftar dan
  detail diambil lewat `page.request` dengan header `Authorization` yang
  ditangkap dari permintaan halaman. Itu pola lama yang kini dilarang
  Catatan Playwright, karena tokennya bisa milik halaman sebelumnya; spec
  baru memakai `bukaDenganAuth` (`tests/helpers/transfer-uji.ts`), dan spec
  ini dipindah ke pola itu saat disentuh lagi.
- `tests/e2e/inventaris/bahanBaku/hapus-bahan-baku.spec.ts`: dialog yang harus
  tetap terbuka saat operasi gagal.
- `tests/e2e/inventaris/penerimaanBarang/terima-penerimaan.spec.ts`: surat
  jalan disiapkan lewat API dari pengajuan yang layak dan ditutup di
  `finally`, token API mengikuti `pin-refresh` halaman, payload terima
  dibaca dari permintaan yang dijawab gagal lewat `page.route`, penahanan
  dibuktikan dengan penghitung request, dan `test.fixme` berbadan lengkap
  untuk perilaku yang menunggu backend. Helper-nya (`login`,
  `bukaDenganAuth`, `api`, `siapkanSuratJalan`, `batalkan`) ada di
  `tests/helpers/transfer-uji.ts`.
- `tests/e2e/inventaris/transferStok/alur-transfer-stok.spec.ts`: spec
  pembanding alur tulis gudang dengan surat jalan PENDING dari API. Tab
  status diperiksa dengan `toHaveCount(0)` pada baris yang tidak boleh
  tampil, revisi kuantitas disimpan sungguhan dan dicek lewat API, dan
  pembatalan dari PENDING lewat UI sekaligus menjadi pembersihnya (tanda
  `dibatalkan` mencegah pembatalan ganda di `finally`).
- `tests/e2e/inventaris/transferStok/pengiriman-penerimaan.spec.ts`: harapan
  jumlah kartu dihitung dari seluruh surat jalan berstatus DIKIRIM, karena
  backend mengabaikan query status, lalu dibandingkan dengan jumlah tombol
  per kartu di ruang gudang dan outlet.
- `tests/helpers/lintas-outlet.ts`: satu sumber keadaan izin lintas outlet
  untuk seluruh spec, dengan `test.fixme` bersyarat untuk jalur lintas
  outlet dan `test.skip` bersyarat untuk jalur terkunci (keputusan
  rancangan butir 18). Contoh pemakaiannya: jalur terkunci di spec stok,
  pengajuan stok (daftar), dan stock adjustment memeriksa `locationID`
  permintaan terhadap id dari `/location/current`.
- `tests/e2e/penjualan/alur-penjualan.spec.ts`: spec pembanding alur bisnis
  dengan fixture tetap (`tests/helpers/penjualan-uji.ts`). Bahan baku dan
  produk uji dibuat sekali, lalu stok master, `produk.stok`, dan stok outlet
  disetel ulang di awal setiap test, sehingga pemotongan stok dibuktikan
  dengan angka pasti. Kedua gerbang stok finalisasi diuji terpisah dengan
  menyetel satu angka saja. Payload diperiksa dari permintaan nyata
  (`postDataJSON`, header `x-idempotency-key`), dialog yang harus bertahan
  diuji lewat `page.route`, dan kunci idempotensi dibandingkan antara
  percobaan yang gagal dan ulangannya.
- `tests/e2e/auth/login.spec.ts`: spec tanpa respons sukses palsu. Login
  sungguhan dengan status dan token diperiksa dari respons, pesan gagal
  dibandingkan dengan `message` respons nyata, email dan nama unik per run
  agar tidak terhitung pembatas, tombol memuat lewat `tahanLaluTeruskan`,
  simulasi `requireSetup` dari respons login nyata lewat `route.fetch()`,
  dan pemeriksaan sisa kuota dari header `RateLimit`.
