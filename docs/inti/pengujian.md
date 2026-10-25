# Pengujian

Sifat perubahan: **Sering**: baseline setiap modul; bagian lain bertambah saat ada pelajaran.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Baseline, kredensial uji, cara menelusuri kegagalan e2e, test yang ditandai
fixme atau dilewati, dan utang pengujian. Baseline diperbarui setiap modul.
Perintah verifikasi, catatan Playwright, spec rujukan, dan riwayat baseline
ada di `referensi/playwright.md`.

## Baseline

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
spec terdampaknya lolos: pengajuan stok dan surat jalan 25 dengan 3
skipped, serta dashboard gudang 4.

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

Pada 30 September 2026, setelah backend `465b438`, lima `test.fixme`
dilepas karena terbukti diperbaiki: hapus pengguna (`a10af75`), timeline
setelah void booking (`e4bfc86`), hapus tarif (`8134842`), dan pelepasan
tarif dari tipe aset (`31ebd92`), masing-masing dengan commit sendiri;
jumlah diterima 0 diganti terima sungguhan lewat UI (`6e314ae`). Skenario
daftar aset setelah tipe asetnya dihapus dibuang, karena hapus tipe aset
yang masih dipakai kini ditolak 409 (keputusan PB9a). Cara membuktikan
sebuah fixme: lepas sementara, jalankan dua kali, kembalikan berkasnya
dengan `git checkout`, lalu lepas dan commit per test yang lolos. Fixme
berbadan kosong, fixme yang bersyarat konstanta frontend, dan fixme yang
hanya bermakna bila fixme lain lolos lebih dulu bukan kandidat.

Pada 8 Oktober 2026, setelah backend `nizar` `8dc6211`, `test.fixme`
pengosongan nomor HP pelanggan dilepas (`1bb26c0`), setelah lolos dua
putaran berturut-turut.

Pada 11 Oktober 2026, setelah backend `ridho` `2dd57aa`, kedua
`test.fixme` jurnal stok di spec alur penjualan dilepas (`936f073`),
setelah lolos dua putaran berturut-turut.

Pada 16 Oktober 2026, setelah backend `ridho` `7d28135`, `test.fixme`
hapus bahan baku yang baru dibuat dilepas (`cfaaa92`), setelah lolos dua
putaran berturut-turut tanpa perubahan badannya.

Pada 19 Oktober 2026, setelah backend `ridho` `af5f315`, `test.fixme`
hitungan tersimpan dapat dikosongkan kembali diganti langkah sungguhan di
skenario draft stock opname (`d6f8ba0`).

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
- **Terima penerimaan yang berhasil** diuji sungguhan lewat UI sejak
  `6e314ae` (keputusan PB12a), termasuk jumlah 0. Setiap run menambah stok
  outlet secara permanen, dan surat jalan DITERIMA tidak dapat dibatalkan.
- **Item tanpa master bahan baku pada penerimaan** hanya teruji di unit
  test (`tests/unit/features/transfer-stok/payload.test.ts`), karena
  membuat datanya berarti menghapus master bahan baku.
- **Kirim surat jalan yang berhasil lewat UI** tidak diuji e2e, karena
  memotong stok gudang. Kirim dijalankan lewat API di persiapan spec dan
  ditutup lewat terima penuh di akhir, karena batal dari DIKIRIM ditolak
  backend `465b438` (PB10a); dari UI hanya jalur gagalnya yang diuji.
- **Tombol aksi surat jalan yang disembunyikan menurut izin** hanya teruji
  di unit test (`aksiSuratJalan`), dengan alasan yang sama dengan cakupan
  lokasi: satu-satunya akun uji berperan Owner.
- **Gate halaman yang menolak pengguna tanpa sebagian izin** hanya teruji
  di unit test (`tests/unit/lib/auth/gate-stock-adjustment.test.ts`, kedua
  ruang),
  dengan alasan yang sama.
  Izin per ruang (RH3a) juga hanya teruji di unit test.

- **Cakupan per lokasi di daftar penjualan teruji e2e hanya untuk jalur
  terkunci** (`20c026b`): `locationID` yang terkirim sama dengan
  `/location/current`, dan seluruh baris milik outlet itu. Data uji hanya
  punya satu outlet, sehingga hasilnya sama dengan tanpa penyaringan.
  Jalur lintas outlet berupa `test.fixme` bersyarat (LP2a), dan aturan
  lingkup diuji di `tests/unit/features/penjualan/filter.test.ts`.
- **Jalur tanggal terkunci bagi peran selain Owner di catat beban hanya
  teruji di unit test** (`payloadBuatBeban`), karena pengguna uji
  berperan Owner (BO5a).
- **Penolakan backend saat mencatat beban** (saldo kurang atau akun
  nonaktif, 409) tidak punya skenario e2e: form menahan jumlah di atas
  saldo sebelum permintaan dikirim.
- **Jalur tanpa `read-location` di halaman penjualan** (tanpa cakupan, dan
  tanpa `locationID` saat membuat) hanya teruji di unit test, dengan alasan
  yang sama: satu-satunya akun uji berperan Owner.
- **Idempotensi hanya teruji dari sisi klien**: kunci terkirim dan sama saat
  permintaan diulang. Penahanan permintaan kembar di backend tidak diuji
  dari web.
  Berlaku juga untuk buat pembayaran sejak `26093b0` (RH1a).
- **Spec tarif sempat gagal sekali di suite penuh `074e98c`** (spinner,
  lolos 3 dari 3 saat diulang). Sebelum migrasi tarif, spec itu lolos 78
  dari 78 dalam tiga putaran terhadap kode lama; penyebab kegagalan
  sekali itu belum diketahui.
- **Spec tipe aset sempat habis waktu sekali di suite penuh `d9af531`**:
  `hapusTipe` lewat `page.request` tidak dijawab dalam batas waktu test
  (`crud-tipeAset.spec.ts` baris 267), lalu lolos 75 dari 75 dengan
  `--repeat-each 3`, dan suite penuh berikutnya bersih. Sejalan dengan
  kejadian spec tarif di atas; penyebabnya belum diketahui. Terulang dua
  kali pada 30 September 2026 di `DELETE /tipeaset` dan `/tarif`, dengan
  permintaan tertahan sekitar 25 detik, lalu 220 eksekusi sesudahnya
  bersih; dicatat untuk tim backend (`kontrak/temuan.md` butir 77).
  Kejadian ketiga pukul 22.28 di `POST /tipeaset`: dokumennya tersimpan
  tetapi jawabannya tidak sampai, dan enam tipe aset uji tertinggal
  sebagai jejak kejadian sejak 27 September. Kejadian keempat 1 Oktober
  22.49 WIB, suite penuh terhadap `yoga` (`crud-tipeAset.spec.ts:221`),
  meninggalkan jejak ketujuh; tiga run ulang spec itu lolos 75 dari 75.
- **Spec shift dan pola roster meninggalkan shift uji**: shift hanya
  dapat dinonaktifkan, tidak dihapus, sehingga setiap run menambah shift
  "Shift Ganda ..." (spec shift), serta "Shift Arsip ..." dan "Shift
  Arsip Generate ..." nonaktif (spec pola roster dan generate jadwal), di
  samping shift uji lama spec shift. Fixture "E2E Jadwal Siang" dibuat
  sekali lalu dipakai ulang. Pola roster uji dihapus di akhir setiap
  skenario baru.
- **Status aset "Digunakan" dan penghapusan aset yang punya booking**
  belum teruji. Spec daftar reservasi kini membuat booking sungguhan yang
  mencakup waktu sekarang, tetapi label status aset uji hanya dibandingkan
  dengan respons `GET /aset`, karena daftar aset di-cache backend 60 detik
  dan belum terbukti dibersihkan saat booking dibuat.
- **Booking uji dibersihkan lewat API**: pembayaran PAID-nya dibatalkan,
  lalu penjualannya di-void (PB8a), walau web kini punya jalur void untuk
  penjualan booking yang belum dibayar (PB2a). Setiap run spec daftar
  reservasi meninggalkan penjualan booking VOID dan booking VOID.
- **Blok booking tanpa penjualan** (tanpa tautan R4b) hanya teruji di unit
  test (`tests/unit/features/sesi-booking/tampilan.test.ts`), karena jalur
  buat booking selalu membuat penjualan.
- **Bentrok yang tidak menghitung booking Selesai** (keputusan R6a) hanya
  teruji di unit test `bookingBentrok`, karena membuat booking Selesai di
  e2e berarti membuat booking di masa lalu.
- **Total laba rugi periode Bulanan di halaman ringkasan tidak dicocokkan
  dengan respons**, karena kartu ringkasan di layout meminta periode yang
  sama pada saat yang sama, sehingga respons milik halaman tidak dapat
  dibedakan. Periode Harian dan Mingguan dicocokkan penuh, dan kartu laba
  bulanan dicocokkan di halaman akun kas (`0cfb3bd`).
- **Arah badge pertumbuhan laba hanya pasti teruji di unit test.**
  Skenario KU5a membandingkan badge dengan `teksPertumbuhan` dari dua
  respons nyata, sehingga jalur yang teruji e2e bergantung pada data laba
  dua hari terakhir. Panah naik dan turun teruji di
  `tests/unit/features/laporan/periode.test.ts`, sedangkan warna badge
  belum teruji.
- **Password salah pada akun uji menambah hitungan pembatas login**, dan
  login sukses tidak menguranginya. Spec login gagal lebih awal bila sisa
  kuota di header `RateLimit` di bawah 3; menjalankan spec auth berulang
  (`--repeat-each`) dalam 15 menit dapat mengunci login seluruh suite.
- **Setup gudang yang berhasil tidak diuji e2e** (keputusan GD6a). Tenant
  uji sudah punya gudang yang menyimpan stok, sehingga setup hanya dapat
  dibuka dengan daftar lokasi tanpa gudang yang disimulasikan, dan
  `POST /location` dijawab gagal agar tidak ada gudang kedua yang
  tersimpan. Payload dan penolakan radius teruji; pengalihan setelah
  setup berhasil dan pembaruan menu sidebar sesudahnya belum.
- **Jalur layout gudang selain Owner hanya teruji di unit test**
  (`tests/unit/features/inventaris/gudang.test.ts`): pengguna tanpa
  `read-location`, tanpa `create-location`, dan tenant tanpa gudang,
  karena satu-satunya akun uji berperan Owner dan tenant uji sudah punya
  gudang.
- **Mode baca-saja pengaturan gudang belum teruji**, karena satu-satunya
  akun uji memegang `update-location`. Yang teruji e2e hanya jalur ubah,
  dan `bacaSaja` di `IsianLokasi` belum punya test.
- **Akun kas uji menumpuk sebagai non-aktif**, satu per run spec
  keuangan, lima per run spec ubah akun kas (`1bc76f4`), dua per run
  spec Pindah Dana (`e53c016`), dan satu per run spec tutup akun
  bersaldo (`f7805ca`), karena akun
  kas tidak dapat dihapus sejak backend `465b438`
  (PB13a, `kontrak/temuan.md` butir 81). Payload bersaldo hanya diperiksa
  lewat `POST` yang dijawab gagal.
- **`hapusLewatApi` menerima 404 sebagai sudah terhapus**, padahal route
  yang dihapus backend juga menjawab 404. Route hapus yang hilang tidak
  terdeteksi helper ini; yang menangkapnya adalah audit endpoint
  (`referensi/helper-dan-shell.md`, Helper penggantian).
- **Persetujuan pengajuan uji memakai pengguna penyetuju uji** "E2E
  Penyetuju", karena backend melarang pengaju menyetujui pengajuannya
  sendiri (`kontrak/temuan.md` butir 76, PB11a). Jalur Owner menyetujui
  pengajuannya sendiri belum teruji.
  Sejak `a8aec53` pengajuan uji disetujui Ridho sendiri (RH5a), sehingga
  jalur Owner teruji; penolakan bagi peran lain belum teruji dari web.
- **`DataTable` mode server hanya dipakai dan teruji di daftar
  penjualan** (`tests/e2e/penjualan/daftar-penjualan.spec.ts`). Mode
  klien kesembilan tabel lain tidak berubah di `b63cf08`, dan tidak diuji
  ulang khusus. Urutan server (`urutanServer`, `a4304ce`) juga hanya
  dipakai dan teruji di daftar penjualan. Sejak `93490bb` `DataTable`
  menampilkan kartu per baris dan susunan kartu di HP; keduanya belum
  punya test integrasi, dan susunan HP tidak diuji spec mana pun.
- **Batas 10 metode aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, karena sepuluh metode aktif tidak dapat
  dibuat di data uji tanpa menumpuk metode permanen. Peringatan metode
  aktif terakhir, akun nonaktif bertanda di form ubah, dan penolakan akun
  nonaktif saat mengaktifkan kembali hanya teruji di unit test
  (`tests/unit/features/metode-pembayaran/`).
  Peringatan itu diganti penahanan di `3b4f35b` (NZ4a), yang teruji e2e.
- **Metode uji menumpuk sebagai nonaktif**, satu per run spec kelola
  metode pembayaran, karena metode tidak dapat dihapus (PO10a).
- **Tombol metode pembayaran yang disembunyikan menurut izin hanya teruji
  di unit test** (`aksiMetodePembayaran`), dan form tanpa `read-akunkas`
  belum teruji, karena satu-satunya akun uji berperan Owner.
- **Spec pola roster sesekali kehilangan sesi setelah `reload`**: pada run
  suite penuh pertama untuk `b84de56`, skenario "gagal memuat: tabel
  menampilkan pesan galat" habis waktu (21,7 detik), karena snapshot
  menampilkan halaman login setelah `page.reload()`. Test itu lolos 3 dari
  3 sendirian, dan run ulang suite bersih; jawaban `pin-refresh`-nya tidak
  terbaca karena trace tidak disimpan. Bila terulang, jalankan dengan
  `--trace on`.
- **Pajak per transaksi hanya diuji jalur gagalnya** (PO10a): membuat atau
  mengaktifkannya menonaktifkan `PPN` tenant uji. Penonaktifan otomatis
  yang tidak atomik (`kontrak/temuan.md` butir 90) terbukti dari kode
  saja.
- **Relasi ke pajak nonaktif tidak dapat diuji dari web**, karena backend
  tidak mengirimnya (butir 93).
  Teruji e2e sejak `ed4bfd3`, setelah backend mengirimnya (RH4a).
- **Spec yang ditulis sebelum keputusan rancangan butir 23 masih
  menyiapkan sebagian data uji lewat API**, misalnya fixture metode
  pembayaran di spec kelola dan booking uji di spec reservasi;
  disesuaikan saat spec itu disentuh.
- **Mode baca-saja Profil Toko belum teruji**: kartu profil tanpa
  `update-tenant`, kartu lokasi tanpa `update-location`, dan kartu lokasi
  tanpa `read-location`, karena satu-satunya akun uji berperan Owner.
  Tenant tanpa outlet juga belum teruji, karena tenant uji punya outlet.
- **Spec profil toko mengubah nama toko tenant uji untuk sementara**,
  lalu mengembalikannya lewat UI dan, bila test berhenti di tengah, lewat
  API di `finally`. Kode pos tenant uji menjadi teks kosong, bukan null,
  setelah run pertama.
- **Spec login sempat habis waktu sekali di suite penuh 2 Oktober 2026**
  (sekitar 13.34 WIB, test "PIN login in-flight"): halaman login PIN
  menampilkan "Akses ditolak. Token akun tidak ditemukan.", yang berarti
  `akun/auth/refreshtoken` pada pemuatan itu tidak memulihkan token akun.
  Test itu lolos sendirian dan di dua suite penuh sesudahnya; penyebabnya
  belum diketahui, karena trace tidak disimpan. Bila terulang, jalankan
  dengan `--trace on`.
- **Tombol pelanggan yang disembunyikan menurut izin hanya teruji di unit
  test** (`aksiPelanggan`), karena satu-satunya akun uji berperan Owner.
- **Pelanggan uji dihapus lunak**, sehingga setiap run spec pelanggan
  menambah dokumen ber-`isDeleted` di basis data development; daftar dan
  indeks unik backend mengabaikannya.
- **Pengosongan email dan alamat pelanggan tidak teruji e2e**; yang
  teruji hanya nomor HP. Peringatan `isianTidakTerkosongkan` dibuang di
  `1bb26c0`.
- **Nama pelanggan kembar yang diterima tidak teruji**, karena basis
  data development masih menolaknya lewat indeks lama
  (`kontrak/temuan.md` butir 142). Email kembar yang dijawab 409 hanya
  dibaca dari kode; e2e menguji nomor HP kembar.
- **Dua pelanggan bernama sama di pemilih hanya teruji di unit test**
  (`tests/unit/features/pelanggan/tampilan.test.ts`), dengan alasan yang
  sama. E2E menguji pencarian lewat nomor HP dan tampilannya.
- **Spec pemilih pelanggan menambah dua pelanggan terhapus lunak per
  run**, dan skenario nomor HP kembar satu.
- **Bahan uji "E2E Bahan Pak" permanen** di basis data development,
  dibuat sekali oleh spec produk (`f64b518`). Bahan bersatuan unit hanya
  teruji di unit test, dan penolakan backend atas satuan di luar
  `availableUnits` tidak diuji dari web, karena form menahannya lebih
  dulu.
- **Diskon uji menumpuk sebagai Non-Aktif**, lima per run suite penuh
  (satu dari spec pembanding, dua dari kelola, satu dari aturan, dan satu
  dari pilihan kasir), karena backend tidak punya `DELETE /diskon`. Diskon
  Non-Aktif tidak dihitung batas 50 diskon aktif.
- **Batas 50 diskon aktif hanya teruji lewat simulasi** respons daftar
  yang ditandai `// simulasi:`, dan hanya untuk tombol tambah; menu
  aktifkan yang terkunci saat batas tercapai belum teruji. Pilihan Aktif
  di form buat teruji e2e sejak `a80d2fa` (NZ5a).
- **Keterangan khusus member dan pemilih produk tanpa izin baca produk
  belum teruji**: web tidak dapat menandai khusus member (PD8a), dan
  satu-satunya akun uji berperan Owner. `aksiDiskon` hanya teruji di unit
  test, dengan alasan yang sama.
- **Pilihan diskon kasir hanya teruji e2e di buat reservasi**; buat
  penjualan memakai `diskonAktif` yang sama dan teruji di unit test.
  `sedangBerlaku` dapat tertinggal sampai lima menit di cache, dan itu
  tidak diuji.
- **Satu surat jalan uji tertinggal DIKIRIM sejak 30 September 2026**
  (`SJ-PGJ/202609/0096-8045`), sisa run sebelum PB10a; suite tetap lolos
  dengannya. Ditutup lewat terima penuh dari halaman penerimaan.

- **Pengguna uji "E2E Profil" permanen** di basis data development,
  dibuat sekali dengan peran tanpa izin pengguna. Nama, PIN, dan nomor
  HP-nya dipulihkan Ridho di awal setiap test (PF5a).
- **Profil Owner hanya teruji dibuka**, tidak diubah, karena nama dan PIN
  Ridho dipakai login seluruh suite.
- **Profil yang gagal dimuat dan logout yang gagal belum teruji e2e**:
  pesan beserta tombol coba lagi, dan logout akun yang tetap berjalan
  walau logout pengguna gagal, hanya terbukti dari kode.
- **Pesan titipan setelah PIN berubah hilang bila halaman dimuat ulang**,
  karena hanya hidup di memori; itu tidak diuji.

- **Spec panel admin bergantung pada `.env.e2e`**: tanpa kredensial admin
  uji, 16 dari 17 skenarionya dilewati (PA5a), sehingga mesin tanpa berkas
  itu tidak menguji panel admin sama sekali.
- **Pengulangan `DELETE` setelah password admin salah tidak diukur.**
  Respons 401 dan pesannya teruji; penyegaran token dan permintaan kedua
  hanya dibaca dari `lib/apiClient.ts` (`kontrak/temuan.md` butir 114).
- **Aktifkan dengan durasi wajib dan perpanjangan yang membuka akun
  kedaluwarsa hanya teruji di unit test**
  (`tests/unit/features/admin-akun/langganan.test.ts`), karena akun
  bermasa akses lewat atau beku karena kedaluwarsa tidak dapat dibuat
  lewat UI.
- **Tombol muat berikutnya riwayat langganan belum teruji e2e**, karena
  butuh lebih dari 20 catatan pada satu akun.
- **Bekukan dan hapus sungguhan hanya diuji pada akun uji tanpa toko.**
  Pemutusan sesi pengguna toko saat akun dibekukan dan penghapusan data
  toko saat akun dihapus tidak diuji.
- **Daftar akun yang gagal dimuat, domain email disposable, dan akun
  klien tanpa sesi pengguna yang membuka `/admin`** belum teruji e2e;
  yang terakhir teruji di `tests/unit/lib/auth/tujuan.test.ts`.

- **Spec mutasi arus kas bergantung pada data bulan berjalan**: empat
  skenarionya dilewati bersyarat bila belum ada mutasi, belum sampai dua
  halaman, atau belum ada pembatalan pembayaran pada bulan itu, sehingga
  di awal bulan jumlah skipped dapat naik.
- **Jenis mutasi saldo awal, beban, dan pembatalan transfer keluar belum
  teruji e2e** di halaman mutasi. Transfer masuk, transfer keluar, dan
  pembatalan transfer masuk teruji sejak `f7805ca`
  (`tutup-akun-bersaldo.spec.ts`). Label dan arah kesembilan jenis
  teruji di
  `tests/unit/features/akun-kas/mutasi.test.ts`.
- **Filter periode mutasi lewat `PilihTanggal` dan tombol reset belum
  teruji e2e**; query periode awal dan fungsi pembentuknya teruji.
- **Keadaan seluruh akun kas non-aktif belum teruji e2e**, karena tenant
  uji selalu punya akun aktif.
- **Tampilan tanpa `update-akunkas` belum teruji e2e** (tombol Ubah dan
  Aktifkan kembali tidak tampil, dan rute ubah ditolak gerbang rute sejak
  `bc388c6`),
  karena data uji tidak punya pengguna tanpa izin itu; `aksiAkunKas`
  teruji di unit test.
- **Penolakan 409 karena batas 10 akun kas aktif belum teruji e2e.**
  Skenario nonaktifkan yang ditolak memakai akun aktif bersaldo yang
  sudah ada dan dilewati bila tidak ada; penolakannya dapat berasal dari
  penjaga metode pembayaran, yang diperiksa backend lebih dulu, dan spec
  hanya memeriksa status 409 beserta pesan yang tampil. Penolakan yang
  pasti karena saldo teruji di alur tutup akun bersaldo (`f7805ca`), yang
  memakai akun uji tanpa metode pembayaran.
- **Transfer uji menumpuk**, karena transfer tidak dapat dihapus: satu
  VOID per run spec Pindah Dana, serta dua AKTIF dan satu VOID per run
  spec tutup akun bersaldo (`f7805ca`), masing-masing Rp1. Skenario
  utama kedua spec dilewati bila tidak ada akun kas aktif bersaldo di
  luar akun uji.
- **Penolakan backend atas Pindah Dana belum teruji e2e**: saldo sumber
  tidak cukup (ditahan form lebih dulu), akun nonaktif, dan pembatalan
  yang ditolak karena saldo akun tujuan tidak cukup. Statusnya (400)
  dibuktikan lewat skrip sekali pakai pada 4 Oktober 2026
  (`kontrak/temuan.md` butir 128).
- **Tampilan Pindah Dana menurut izin hanya teruji di unit test**
  (`aksiTransfer`): form tanpa izin buat, riwayat tanpa izin baca, dan
  tombol Batalkan tanpa izin ubah, karena satu-satunya akun uji berperan
  Owner. Filter riwayat dan keadaan kurang dari dua akun aktif juga
  belum teruji e2e.
- **Beda `keLocationID` dan `locationID` di daftar surat jalan tidak
  teruji dari data**: seluruh surat jalan uji menuju outlet tenant,
  sehingga keduanya memberi hasil yang sama; bedanya terbukti dari kode
  (`kontrak/temuan.md` butir 33). Lingkup satu lokasi tujuan hanya teruji
  di unit test (`filterServerTransfer`).
- **Data development memuat transfer berjumlah pecahan** di akun "kasir
  outlet" (bukti `kontrak/temuan.md` butir 126, FR2a), sehingga total
  masuk dan total keluar akun itu berpecahan sepanjang Oktober 2026.
  Spec yang membandingkan rupiah memakai `formatRupiah`.
- **Jalur gagal dialog hapus produk hanya diuji dengan jawaban 500
  tiruan**; penolakan hapus dari backend sungguhan belum teruji.

- **Batas atas level, level pengguna yang tidak diketahui (RL3a), dan
  perubahan level atau wewenang di payload ubah hanya teruji di unit
  test** (`tests/unit/features/role/form-role.test.ts`), karena akun uji
  berperan Owner. Penolakan backend saat simpan, yang tampil di atas
  tombol simpan, belum teruji e2e.
- **Form role yang gagal dimuat hanya teruji untuk id yang tidak ada.**
  Galat server saat memuat detail dan penanda memuat selama detail dimuat
  ulang belum teruji e2e. `nilaiAwalRole` teruji di
  `tests/unit/features/role/nilai-awal.test.ts`.

- **Penjaga ruang detail stock opname hanya teruji untuk dokumen yang
  tipe lokasinya diketahui**, dan kedua skenarionya dilewati bila ruang
  itu belum punya dokumen. Nama PIC yang gagal dimuat (teks cadangan)
  belum teruji e2e.

- **Dua kejadian sesekali pada spec tipe aset, 4 dan 5 Oktober 2026**,
  terhadap backend `fc29433`. Di suite penuh, login akun di `beforeEach`
  tidak berpindah dari `/login` ke `/login/pengguna` dalam 30 detik
  (sekali). Pada run pertama keesokan harinya, baris tipe aset yang baru
  dibuat lewat API tidak tampil dalam 5 detik di skenario pencarian
  (sekali); run berikutnya lolos 25 dengan test terlama 6,9 detik.
  Sebabnya tidak terbukti: laporan suite ada di `/tmp` dan hilang sebelum
  durasinya dibaca. Tidak ada kode maupun asersi yang diubah.
- **Sisi tanpa izin di halaman pajak hanya teruji di unit test**
  (`tests/unit/features/pajak/izin.test.ts`): tombol dan kartu indeks
  pengaturan tidak teruji e2e, karena akun uji berperan Owner. Pesan
  tanpa izin baca kini milik gerbang rute (`bc388c6`).
- **Sisi tertolak gerbang rute hanya teruji e2e untuk rute yang ditolak
  peran pengguna uji profil**: daftar pengguna, serta ubah posisi dan
  ubah produk bila peran itu tidak memegang izinnya. Rute lain teruji di
  `tests/unit/lib/auth/gerbang-rute.test.ts`. Skenarionya dilewati bila
  peran itu tidak memegang `read-dashboard-outlet`.
- **Syarat 44 entri baru `IZIN_HALAMAN` diturunkan dari nama hook dan
  kontrak, bukan dari trace per halaman.** Yang terbukti: pemilik seluruh
  izin membuka setiap rute terpetakan (unit), dan spec terdampak lolos.
- **Suite e2e penuh tidak lagi dijalankan di akhir setiap pekerjaan**
  (6 Oktober 2026), sehingga baseline suite penuh dapat berupa hitungan
  selama beberapa pekerjaan. Angka terukur terakhir ada di Baseline.

- **Jumlah skenario lolos suite penuh 7 Oktober 2026 adalah 440, bukan
  444**: empat skenario gagal karena nomor pengajuan kembar di backend
  (`kontrak/temuan.md` butir 139), lalu lolos saat foldernya diulang
  setelah data development digeser.
- **Batas 10 metode aktif dan metode aktif terakhir hanya teruji lewat
  simulasi** bertanda `// simulasi:`. Penolakan 409 backend atas metode
  aktif terakhir dibuktikan lewat skrip sekali pakai (7 Oktober 2026),
  bukan lewat e2e, karena web kini menahannya.
- **Tandai Selesai hanya teruji untuk satu booking yang dibayar Rp1.**
  Tombol yang tidak tampil (belum dibayar, jam sudah lewat, tanpa
  `update-booking`) hanya teruji di unit test
  (`tests/unit/features/sesi-booking/izin.test.ts`), dan bagian Sesi
  Booking tanpa `read-booking` belum teruji. Setiap run meninggalkan
  satu penjualan booking VOID.
- **Tautan penjualan di buku mutasi bergantung pada data**: skenarionya
  dilewati bila halaman pertama bulan berjalan tidak memuat mutasi
  pembayaran. Baris tanpa pencatat hanya teruji di unit test.
- **Filter periode riwayat Pindah Dana diuji dengan tanggal 15 sampai 20
  bulan berjalan**, yang hampir selalu memberi daftar kosong; isi daftar
  dalam periode tidak dibandingkan per baris.
- **Booking lama berstatus Batal** masih ada di data development dan
  tampil di timeline (`kontrak/temuan.md` butir 141); tidak ada test
  untuknya.

- **Hapus bahan baku yang berhasil tidak teruji e2e** sejak `43f09af`:
  skenarionya `test.fixme` menunggu backend (`kontrak/temuan.md` butir
  143), dan skenario tambah, cari, dan edit meninggalkan satu bahan uji
  berstok 50 per run. Skenario hapus lama sempat lolos di suite penuh 11
  Oktober 2026 walau bahannya tidak terhapus, karena buktinya hanya baris
  yang tidak ada di tabel; dua bahan uji dari run itu dibiarkan sebagai
  bukti.
- **Penolakan hapus bahan yang punya riwayat tidak teruji e2e**; yang
  teruji hanya dialog yang bertahan saat hapus dijawab gagal.
- **Penyaringan stock adjustment per ruang di server tidak teruji dari
  web**, karena akun uji berperan Owner.
- **Penahanan pembayaran kembar di backend tidak diuji dari web**; yang
  teruji kunci yang sama saat permintaan diulang.

- **Periode jurnal stok diuji lewat tanggal 8 sampai 15 bulan
  berjalan**, agar tanggal itu tidak kembar dengan tanggal bulan lain di
  kalender; skenarionya dilewati sebelum tanggal 8. Sampai tanggal tidak
  diubah lewat kalender; pemetaannya teruji di `paramHalamanJurnal`.
  Skenario ukuran dan halaman berikutnya dilewati bila jurnal outlet
  bulan berjalan belum lebih dari satu halaman, sehingga skipped dapat
  naik di awal bulan.
- **Semua Outlet dengan beberapa outlet di jurnal stok** (meminta
  memilih satu outlet) hanya teruji di unit test (`lokasiJurnalOutlet`),
  karena tenant uji punya satu outlet dan izin lintas outlet null.
- **Pesan lokasi gudang gagal dimuat atau belum didaftarkan di jurnal
  stok gudang** belum teruji e2e.
- **Kartu pengajuan dashboard gudang hanya teruji cabang tanpa
  pengajuan siap surat jalan** pada data uji sekarang; cabang klik kartu
  ke tab Perlu Surat Jalan berjalan bila ada pengajuan APPROVED atau
  PENDING tanpa surat jalan.
- **Template role hanya teruji pemetaan namanya** (skenario e2e template
  dan `tests/unit/lib/roleTemplates.test.ts`); role dari template belum
  dipakai untuk membuka halaman stock opname, adjustment, atau absensi.
- **Pengajuan Outlet ke Gudang tidak punya skenario**, karena web belum
  menampilkannya (P8); skenario dashboard gudang gagal dengan jujur bila
  data uji memuatnya.
- **Teks badge status dan dialog batal surat jalan hanya teruji lewat
  peta label di unit test** (`a972956`): e2e memeriksa nama tombol tab,
  tetapi tidak membaca badge daftar, badge detail, maupun teks dialog
  batal.
