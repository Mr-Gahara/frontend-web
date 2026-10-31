# Disiplin Menerapkan Perubahan

Sifat perubahan: **Jarang**: bertambah saat ada pelajaran.

Lapis referensi: kirim bila pekerjaannya membutuhkan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Disiplin saat menerapkan perubahan

Kesalahan yang pernah terjadi dan cara menghindarinya:

- **Jangan mengubah test dua kali tanpa bukti baru.** Bila perbaikan
  pertama tidak menolong, ambil bukti sebelum mencoba yang kedua.
- **Kembalikan perubahan yang memperburuk, segera.** Menumpuk perbaikan di
  atas perubahan yang salah membuat penyebabnya makin sulit dikenali.
- **Verifikasi keadaan akhir, bukan keluaran `OK` dari skrip.** Sebuah skrip
  dapat melaporkan berhasil padahal tidak mengubah apa pun; periksa
  berkasnya dengan grep atau sed.
- **Ambil selector dari kode komponen sebelum menulis spec**, bukan
  menebaknya. Satu perintah grep untuk teks tombol, label, dan placeholder
  menghemat banyak putaran.
- **Tulis spec untuk alur yang akan diubah sebelum migrasi selesai.** Bug
  navigasi pada modul role baru ketahuan berjam-jam setelah kodenya jadi.
- **Blok perintah dijaga pendek dan bertujuan tunggal.** Blok panjang
  kadang tertempel dua kali atau terpotong di terminal, dan kegagalannya
  tidak selalu terlihat.
- **Untuk blok besar, ganti berbasis nomor baris**, dengan memeriksa isi
  baris sebagai pengaman. Pencocokan teks panjang mudah gagal hanya karena
  indentasi meleset dua spasi.
- **Hindari skrip pembersih otomatis berbasis keluaran ESLint.** Dua kali
  dicoba dan dua kali gagal (escaping regex berlapis, lalu execSync yang
  melempar saat ESLint keluar dengan kode bukan nol). Membaca daftarnya
  lalu mengganti blok import secara langsung lebih cepat dan pasti.
- **Angka pengaman untuk penggantian berbasis baris diambil dari `grep -n`**
  yang mencetak jangkar di blok yang sama, bukan dihitung dengan mata dari
  output sebelumnya. Pada modul produk, hitungan manual dua kali meleset satu
  baris.
- **Jangan membuat blok yang bergantung pada penanda sementara dari blok
  lain.** Cari sasaran dari isi kode yang memang ada, agar urutan blok tidak
  menentukan hasil.
- **Bentuk pesan error backend dipastikan dari respons nyata** (trace atau
  cache kontrak) sebelum dipetakan di frontend. Pada kategori, service menyebut
  field yang salah, dan hal itu baru ketahuan dari trace.
- **Jangan menyimpulkan selesai dari satu run yang lolos** bila sebelumnya ada
  kegagalan. Jalankan ulang dengan `--repeat-each`.
- **Sebelum menghapus atau mengganti nama fungsi, grep seluruh pemakaiannya**
  di berkas itu. `next dev` tidak memeriksa tipe, sehingga pemakaian yang
  tertinggal baru muncul sebagai halaman crash di e2e. Pada stock adjustment,
  `formatTanggal` terhapus tetapi masih dipanggil di halaman detail.
- **Nilai yang bergantung pada locale tidak ditebak di unit test.** Periksa
  bentuknya, bukan teksnya. Pada stock adjustment, tebakan singkatan bulan
  dari locale `id` date-fns membuat unit test gagal.
- **Setelah menambah berkas test, pastikan jumlah test bertambah sesuai
  harapan**, bukan hanya tidak ada yang gagal. Vitest melewati berkas yang
  namanya tidak cocok pola `*.test.ts` tanpa error; pada jurnal stok, berkas
  bernama `*.tst.ts` membuat 9 test tidak berjalan.
- **Keluaran reporter `line` Playwright menghapus baris terminal sebelumnya.**
  Reporter itu mencetak kode kontrol `ESC[1A` dan `ESC[2K` (naik baris, hapus
  baris) yang tetap lolos lewat `tail`, sehingga keluaran `tsc`, ESLint, atau
  vitest di blok yang sama tampak hilang. Buang kodenya dengan
  `sed 's/\x1b\[[0-9;]*[A-Za-z]//g'`, atau jalankan Playwright paling
  akhir. Terbukti dengan `cat -v` pada modul stok.
- **Setiap dialog konfirmasi diuji juga jalur gagalnya**, dengan `page.route`
  pada method dan path operasinya. Bug hapus bahan baku (`50e8815`) lolos
  karena spec lama hanya menguji hapus yang berhasil, sedangkan dialog yang
  tertutup sebelum waktunya baru terlihat saat operasi gagal.
- **Nama tombol untuk selector diambil dari snapshot DOM (`error-context.md`)
  atau baris kode utuh**, bukan dari hasil ekstraksi regex. Pola
  `[A-Za-z ...]` memotong "Setujui & Sesuaikan Stok" menjadi "Setujui" tanpa
  tanda apa pun, dan spec alur stock opname sempat gagal karena itu.
- **Test tidak pernah diubah hanya agar lolos.** Bila sebuah skenario tidak
  dapat berjalan karena keadaan data atau menunggu backend, biarkan `skipped`
  atau gagal dengan alasan yang terlihat, lalu catat di
  `inti/pengujian.md` (Test yang ditandai fixme dan skip bersyarat) dan, bila
  memang dari backend, di laporan untuk tim backend. Sebelum menyebut
  penyebabnya backend, pastikan dari kode: pada stock opname, pembatalan DRAFT
  ternyata diizinkan backend dan hanya dibatasi tampilan frontend.
- **Saat menyaring keluaran Playwright, jangan ikutkan pola yang menangkap
  baris progres** (misalnya `›`). Baris progres menghabiskan jatah `head`
  sebelum ringkasan tercetak. Untuk ringkasan, pakai pola
  `"  [0-9]+ (passed|failed|skipped)"`.
- **Isi dokumen dipindah lewat skrip, lalu dibuktikan tidak ada yang hilang.**
  Saat dokumentasi dipecah, potongan diambil menurut judul dan ditulis apa
  adanya, lalu setiap baris dokumen lama dicari di gabungan berkas baru; yang
  tidak ditemukan hanyalah baris yang sengaja diubah. Rujukan dokumen di
  komentar kode dan spec (`bagian N`, nama berkas lama) ikut di-grep dan
  diperbarui. Cara ini membuktikan kelengkapan pemecahan dokumentasi dalam
  satu putaran.
- **Skrip penerap tidak bergantung pada berkas yang harus dibuat manual di
  luar bloknya.** Pada pengajuan stok, skrip membaca dua halaman dari `/tmp`
  yang belum dibuat, lalu berhenti di tengah. Berkas yang ditulis ulang utuh
  memakai heredoc di blok yang sama.
- **Invalidasi memakai akar domain, bukan `daftar()` tanpa argumen.** Kunci
  daftar selalu membawa objek filter, sehingga `daftar()` (filter
  `undefined`) tidak mengenai daftar mana pun. Terjadi di stock opname dan
  pengajuan stok.
- **Tipe field referensi dipastikan dari `.populate(` di service dan dari
  mapper-nya**, bukan dari laporan backend atau komentar model.
  `referenceID` stock adjustment ditipekan string padahal berisi objek hasil
  populate, sehingga href menjadi `[object Object]` dan halaman daftar crash.
- **Jalur backend ditelusuri utuh sebelum menyimpulkan**: route, controller,
  service, lalu validator. Pemanggil sebuah fungsi dicari di seluruh backend
  (`inti/backend.md`), bukan hanya di `routes/` dan `controllers/`. Pencarian yang
  terlalu sempit membuat `validateUpdateItems` sempat disimpulkan kode mati,
  padahal dipanggil dari service.
- **Klaim perbaikan di laporan backend adalah petunjuk, bukan bukti.**
  Perbaikan dibuktikan lewat e2e atau trace terhadap backend yang berjalan
  sebelum penanganan sementara di frontend dibuang atau payload dirancang
  ulang. Laporan 20 September menyatakan `qtyPhysical: null` diterima,
  tetapi validator di depan service masih menolaknya.
- **Keluaran kosong tidak pernah berarti bersih.** Filter yang tidak mencetak
  apa pun bisa berarti perintahnya gagal (formatter ESLint yang tidak ada)
  atau polanya salah (kode warna ANSI di ringkasan vitest). Pakai perintah
  verifikasi baku dan helper yang selalu mencetak jumlah (`inti/pengujian.md`).
- **Jangkar penggantian diambil dari berkas nyata**, lewat `grep -n` atau
  `sed -n`, bukan dari salinan dokumen yang diunggah. Pembungkusan baris di
  salinan bisa berbeda dari berkasnya; jangkar Catatan shell di berkas ini
  sempat gagal karena itu.
- **Jangkar untuk prosa yang dibungkus mencakup baris utuh sampai akhir
  baris.** Jangkar yang berhenti di tengah baris membuat sisa baris lama
  tersambung ke teks baru; baseline di `inti/pengujian.md` sempat menjadi satu
  baris kepanjangan karena itu.
- **Filter diff dokumentasi tidak boleh membuang butir daftar.** Pola
  `^[-+][^-+]` yang sempat dipakai di langkah 6 tata cara (`docs/README.md`)
  membuang setiap baris yang diawali `-- ` atau `+- `, sehingga butir daftar
  yang berubah tidak terlihat saat verifikasi. Sejak 21 September 2026, atas
  perintah pemilik proyek, langkah itu memakai
  `grep -E '^[-+]' | grep -vE '^(\+\+\+|---) '` setelah
  `git --no-pager diff -U0 docs`.
- **Makna sebuah field dipastikan dari jalur hilirnya dan dari dokumentasi
  backend** (folder `docs/` di repo backend), sebelum menyimpulkan sisi mana
  yang salah. Pada pengajuan stok, dugaan pertama menyalahkan backend karena
  stok diperiksa di `dariLocationID`; penelusuran surat jalan (kirim dan
  terima) dan skenario e2e backend membuktikan justru frontend yang membalik
  arah.
- **Apakah kerusakan data sudah terjadi dinilai dari `git blame` baris
  penentu, dibandingkan dengan `createdAt` datanya.** Transfer satu-satunya
  dari pengajuan terbalik ternyata dibuat sebelum baris penyalin arah masuk,
  sehingga stok belum pernah bergerak ke arah salah.
- **Data development diukur sebelum ditangani, dan skrip pengubah data
  selalu punya mode tinjau.** Hitungan per arah dan status menentukan
  pilihan penanganan; pembalikan dijalankan setelah daftar sasarannya
  dicetak dan diperiksa.
- **Teks yang bergantung pada spasi di awal baris disusun lewat skrip**,
  bukan lewat baris heredoc yang ditempel. Pagar blok kode di dalam butir
  daftar `docs/README.md` sempat kehilangan indentasinya saat ditempel, dan
  `4214e13` memperbaikinya.
- **Pesan commit yang panjang disimpan ke berkas di `/tmp` lebih dulu**, lalu
  dipakai dengan `git commit -F`, sehingga commit dapat diulang tanpa
  menempel ulang bila gerbangnya gagal.
- **Tanda tangan sebuah hook dibaca sebelum dipakai**, bukan ditebak dari
  namanya. `useLokasiBertipe` ternyata mengembalikan satu lokasi pertama
  (`{ lokasi, lokasiId }`), bukan daftar; form pengajuan membutuhkan
  `useDaftarLokasi` yang disaring per tipe.
- **Dugaan penyebab kegagalan diuji terhadap bukti sebelum dijadikan
  kesimpulan**, termasuk dugaan yang terasa cocok dengan semua pengamatan.
  Kehilangan sesi pada spec alur pengajuan sempat diduga benturan login
  paralel, lalu terbantah oleh `workers: 1` di konfigurasi Playwright.
- **Skrip basis data memutus koneksi di `finally`.** Keluar lebih awal lewat
  `return` sebelum `mongoose.disconnect()` membuat Node menunggu tanpa
  batas; skrip tinjau surat jalan sempat menggantung pada jalur "tidak ada
  surat jalan DIKIRIM" dan disangka pengujian yang macet.
- **Teks tombol yang sebaris dengan ikon ikut hilang bila keluaran disaring
  dari baris `className`.** Ambil baris itu utuh dengan `sed -n` pada nomor
  baris yang hilang dari keluaran. Pada submodul 6, judul "Finalisasi
  Kedatangan" sempat dipakai sebagai nama tombol karena baris tombolnya
  ("Konfirmasi Terima Barang") tersaring, padahal aturan nama tombol di
  atas sudah ada.
- **Asal kerusakan data dicari juga dari riwayat berkas penentunya.** Pada
  penerimaan, `git log --follow` membuktikan halaman web belum ada saat
  surat jalan yang rusak diterima, sehingga penyebabnya kemungkinan klien
  lain yang memakai backend yang sama.
- **Pasangan penggantian yang teks barunya memuat teks lamanya tidak
  idempoten.** Menjalankannya dua kali menyisipkan ulang, karena jangkarnya
  masih ada tepat satu kali. `ganti-blok.js` kini menolaknya dengan
  `SUDAH DITERAPKAN`; dengan `ganti.js`, periksa hasilnya dengan grep
  jumlah kemunculan sebelum melangkah.
- **Halaman dimigrasikan lewat salinan dan penyusunan ulang berjangkar.**
  `cp` halaman lama ke `features/`, lalu skrip mengganti rentang dari baris
  jangkar unik sampai sebelum `return (` utama, membungkus tombol dengan
  mencari `<Button` dan `</Button>` terdekat dari baris `onClick` uniknya,
  dan memindah blok penjaga utuh ke komponen luar. Urutan jangkar diperiksa
  sebelum menulis. Cara ini memigrasikan keenam halaman submodul 6 tanpa
  mengetik ulang tampilannya.
- **Berkas salinan membawa error ESLint warisan, dan itu dibereskan di
  commit migrasi**, karena definisi selesai berlaku untuk berkas modul,
  bukan hanya baris yang diubah. Detail surat jalan membawa empat tanda
  kutip tanpa escape di teks dialog.
- **Penggantian global dijalankan terakhir dan jumlahnya dicocokkan dengan
  hitungan yang diharapkan.** Pada detail penerimaan, penggantian `_id`
  menjadi `kunci` melaporkan 11, bukan 7, karena empat atribut yang
  disisipkan skrip yang sama ikut terganti. Selisih semacam ini dijelaskan
  dari grep hasilnya sebelum melangkah.
- **Blok tempel yang memuat pagar kode Markdown ditulis lewat skrip yang
  membaca isinya dari berkas**, bukan ditempel utuh. Pagar kode di dalam
  heredoc menutup blok perintah saat ditampilkan, sehingga blok tercetak
  terpotong (sumber skrip tinjau di bagian Helper penggantian).
- **Makna konsep yang akan digeneralisasi dipastikan dari backend dan dari
  model bisnis pemilik proyek.** Rencana cakupan per gudang dibangun di
  atas "lokasi aktif" sebagai lokasi pengguna, padahal pengguna hanya
  terikat ke tenant dan `/location/current` selalu mengembalikan outlet
  tenant. Satu fungsi backend dan satu pertanyaan kepada pemilik proyek
  membatalkan rencana itu sebelum ada kode yang ditulis.
- **Perilaku komponen bersama dipastikan per nilai pembedanya** (`ruang`,
  objek `TEKS`), bukan dari fakta bahwa komponennya dipakai bersama. Pada
  stock adjustment, tautan dari detail opname ke rute outlet sempat
  disimpulkan berlaku di kedua ruang dan diajukan sebagai keputusan,
  padahal hanya ada di `TEKS.outlet`.
- **Sebelum merancang pengiriman query ke backend, pastikan service
  benar-benar memakainya.** Validator hanya memeriksa format. Daftar
  adjustment menyaring `locationID`, sedangkan `GET /jurnalstok` dan
  `GET /transferstok` mengabaikan query (surat jalan hanya sampai backend
  `465b438`, `kontrak/temuan.md` butir 33).
- **Gerbang di blok tempel tidak pernah memakai `exit`.** Di shell
  interaktif, `exit` menutup terminal beserta pesan alasannya; pada commit
  gate stock adjustment, cabang `{ echo ...; exit 1; }` menutup terminal
  tanpa jejak. Pakai `if <gerbang>; then <commit>; else echo "GAGAL ...";
  fi`.
- **Berkas baru yang dibuat manual diperiksa ukurannya sebelum menjalankan
  apa pun** (`wc -c`, yang juga gagal bila berkasnya belum ada). Berkas
  yang belum dibuat atau belum tersimpan (0 byte) membuat vitest menjawab
  "No test suite found" atau tidak menambah jumlah test, `tsc` gagal
  menemukan modul, dan Playwright tidak menjalankan satu test pun. Terjadi
  tiga kali pada putaran izin lintas outlet: dua kali berkas belum dibuat,
  sekali berukuran 0 byte.
- **Keluaran panjang disimpan ke berkas lalu dibaca per bagian.** Pencarian
  dampak menghasilkan ratusan baris; simpan ke `/tmp`, cetak judul bagian
  dengan `grep -n '^=='`, lalu bagian tertentu dengan `awk`.

- **Kegagalan e2e diperiksa dari snapshot DOM lebih dulu**, untuk
  memastikan halaman yang tampil memang halaman yang diuji. Pesan
  `element(s) not found` pada tombol yang seharusnya ada sering berarti
  sesi hilang, bukan status dokumen atau nama tombol yang salah. Snapshot
  di `test-results/*/error-context.md` menjawabnya dalam satu perintah;
  pastikan berkasnya dari run terakhir dengan `find -newermt`.
- **`awk` dengan rentang baris lintas berkas memakai `FNR`, bukan `NR`.**
  `NR` menghitung terus antarberkas, sehingga berkas kedua dan seterusnya
  tidak pernah tercetak. Terjadi saat memetakan dua berkas halaman stock
  opname sekaligus.
- **Blok perintah tidak diletakkan di dalam butir daftar.** Indentasinya
  ikut tersalin, sehingga delimiter heredoc tidak dikenali dan terminal
  menggantung di `heredoc>`, dan marka `@@@` tidak dikenali
  `ganti-blok.js`.
- **Membuang `any` dari parameter generik mengubah tipe di hilirnya.**
  Pemakai hasilnya dibaca lebih dulu: pada sidebar, `res.data.nama ||
  pengguna.nama` menjadi `string | undefined` dan ditolak `setNamaUser`,
  sehingga perubahan itu dikembalikan.
- **Jangkar akhir untuk penggantian berbasis baris harus unik.** Baris
  kosong sebagai jangkar akhir cocok dengan baris kosong pertama sesudah
  jangkar awal, bukan yang dimaksud; `ganti-baris.js` menolaknya lewat
  indeks pengaman. Pakai baris berisi teks khas, misalnya rujukan temuan.
- **Helper lokal bernama sama dengan helper bersama adalah jebakan.**
  Sebelum memakai helper yang didefinisikan di dalam spec, cari nama itu di
  `tests/helpers/`: bila ada, versi bersama biasanya sudah menangani hal
  yang belum diketahui saat versi lokal ditulis. `bukaDenganAuth` ada dua,
  dan yang lokal membekukan token sehingga spec pengajuan gagal sesekali
  selama tiga hari (`referensi/playwright.md`, Catatan Playwright).
- **Aturan yang sudah tertulis tetap perlu diperiksa penerapannya di
  setiap berkas.** Catatan token mengikuti `pin-refresh` sudah ada sejak
  submodul transfer, tetapi satu spec tertinggal memakai pola lama. Saat
  sebuah aturan ditulis, grep pemakaian pola lamanya di seluruh spec dan
  perbaiki sekaligus, jangan hanya di berkas yang sedang dikerjakan.

- **Salinan untuk migrasi diambil dari `git show HEAD:`, bukan dari berkas
  kerja.** Pada halaman buat penjualan, blok salinan dijalankan setelah
  blok yang menulis halaman tipis, sehingga yang tersalin adalah halaman
  tipis itu. Sumber dari HEAD tidak bergantung pada urutan eksekusi blok.
- **Jangkar diperiksa ada tepat sekali oleh skrip yang menulis, sebelum
  menulis apa pun.** `ganti-baris.js` sempat membandingkan
  `indexOf(jangkar)` dengan indeks yang diberikan; saat jangkar tidak ada,
  keduanya `-1` sehingga dianggap cocok, dan wilayah baru tertempel di
  akhir berkas. Sejak 26 September 2026 helper itu menolak indeks negatif
  dan keluar dengan kode 1. Skrip wilayah di modul penjualan tetap
  menghitung kemunculan setiap jangkar dan berhenti bila tidak tepat satu.
- **Berkas marka hanya memuat pasangan yang wajib.** `ganti-blok.js`
  menulis semua atau tidak sama sekali, sehingga satu pasangan yang tidak
  cocok menahan seluruhnya. Di halaman buat penjualan, pasangan pengganti
  deklarasi tipe union yang setara dengan `JenisPenjualan` gagal cocok
  tanpa sebab yang terjelaskan dan menahan 15 pasangan lain; pasangan itu
  tidak diperlukan dan dibuang.
- **Teks yang muncul berulang diganti dengan jumlah kemunculan yang
  ditetapkan**, bukan lewat pasangan unik: skrip memeriksa setiap pola
  muncul tepat N kali sebelum mengganti semuanya (`d._id || d.id` delapan
  kali di halaman buat penjualan).
- **Istilah `docs:dampak` harus khas.** Istilah umum seperti "lama" atau
  "buat" menjaring ratusan baris derau (237 baris untuk "Lama" di modul
  penjualan). Pakai nama fungsi, nama berkas, atau frasa khas.
  Istilah turunan nama berkas yang diubah commit juga dapat umum
  ("gudang", "inventaris", "location"): pada `9ce288b`, dari 528 baris
  hanya puluhan yang relevan. Baca bagian istilah khas lebih dulu, lalu
  saring bagian umum dengan `grep -E` atas kata kunci perubahan.
- **Gerbang atas kode ditulis sebagai helper yang membaca per pemanggilan,
  bukan grep per baris.** Gerbang grep pertama untuk `route.fulfill`
  salah menghitung, karena `status` hampir selalu ditulis di baris sesudah
  `route.fulfill({`; `audit-fulfill.js` membaca setiap pemanggilan sampai
  pemanggilan berikutnya.
- **Pernyataan dokumentasi tentang seluruh suite diaudit, bukan
  diasumsikan.** Kalimat bahwa seluruh spec e2e memakai backend sungguhan
  bertahan sejak Fase 0, padahal empat spec memalsukan respons sukses:
  aturan `page.route` di Catatan Playwright tidak pernah diperiksa
  terhadap spec yang ditulis sebelum aturan itu ada. Spec lama yang
  dijadikan pembanding migrasi diaudit dulu dengan `audit-fulfill.js`.
- **Variabel daftar berkas di zsh tetap terlupa walau sudah dicatat.**
  Blok pemetaan reservasi memakai `$S` berisi daftar service dan gagal.
  Daftar berkas diteruskan langsung lewat `$(...)` di argumen, bukan
  disimpan ke variabel lebih dulu.
- **Kegagalan spec pengganti dipilah menurut pemilik bugnya sebelum ada
  yang diubah.** Spec master data reservasi ditulis untuk perilaku benar
  dan gagal tujuh kali: tiga bug frontend (deskripsi tipe aset, kolom tipe
  aset tarif, dialog hapus tarif) diperbaiki, tiga bug backend (cache
  aset, hapus tarif 500, `$addToSet` tarif) menjadi `test.fixme` dengan
  persetujuan, dan satu kesalahan selector spec (harga di edit tarif)
  dibetulkan. Tidak satu pun diselesaikan dengan melonggarkan harapan.
- **Sesi dibuka dengan perintah pembuka `docs/README.md` utuh**,
  termasuk `git log`. Commit modul tanpa commit dokumen penutup terlihat
  dari log: bila commit terakhir bukan `docs:`, dokumentasinya ditutup
  lebih dulu. Pada 27 September 2026, `074e98c` dan `d3ae182` baru
  ketahuan dari pohon berkas (`features/aset` tanpa baris di
  `referensi/arsitektur.md`), karena sesi dibuka dengan `tree` tanpa log.
- **Pemeriksaan akhir skrip penerap mencari bentuk pemakaian kode, bukan
  kata.** Skrip edit tarif menolak hasilnya sendiri karena komentar
  sisipannya memuat "reset()" dan pola `\breset\b` ikut cocok; polanya
  dipersempit menjadi `reset\(\{` dan `useEffect\(`. Saat gagal, skrip
  sebaiknya mencetak pola mana yang tersisa, agar penyebabnya tidak perlu
  dicari dengan perintah terpisah.
- **Error `tsc` yang muncul di beberapa berkas sekaligus setelah satu
  tahap dicocokkan dulu dengan blok yang mungkin terlewat.** Pada tarif,
  blok `types/tarif.ts` tidak dijalankan; dua error di halaman daftar
  dan test unit adalah gejalanya, dan `git status` menunjukkan berkas
  tipe itu belum berubah.
- **Specifier import yang tidak lagi dipakai dibuang oleh skrip penerap
  dengan menghitung kemunculan namanya**, bukan ditebak dari keluaran
  grep yang terpotong. Pada tarif, `useState` dan `useWatch` ternyata
  tidak terpakai di buat, begitu pula `useState`, `useEffect`, dan
  `useWatch` di edit (`/tmp/tarif-umum.js`).
- **Klaim dokumentasi tentang perilaku backend dibuktikan dari kode
  sebelum menjadi dasar rancangan.** R2b dan R4a disusun di atas kalimat
  "satu-satunya jalan batal adalah void penjualannya", padahal penjualan
  booking selalu FINAL dan FINAL tidak dapat di-void langsung; rancangan
  fixture harus diajukan ulang (R2c, R4b).
- **Deteksi hidrasi memakai `useSudahHidrasi`**
  (`hooks/use-sudah-hidrasi.ts`, `039ead4`), pembungkus
  `useSyncExternalStore` dengan snapshot server false dan klien true,
  bukan `setState` di effect yang ditolak
  `react-hooks/set-state-in-effect`. Pola itu sempat ditulis sendiri di
  dua berkas reservasi sejak `eef371a` sebelum disatukan.
- **`awk` tidak mengenal `\b` sebagai batas kata**; di `awk`, `\b` adalah
  karakter backspace. Pola `<(Button|...)\b` saat memetakan buat reservasi
  tidak menangkap satu tag pun. Pakai `grep -E` untuk pola berbatas kata,
  atau `awk` dengan pola tanpa `\b`.
- **Aturan ESLint yang sama di flat config ditimpa blok berikutnya** untuk
  berkas yang sama, bukan digabung. Larangan impor kalender shadcn
  digabung ke `no-restricted-imports` yang sudah memuat larangan
  `__tests__` (`e43e000`).
- **Berkas yang sudah dihapus dengan `git rm` tidak disebut lagi di
  `git add`.** Satu path yang tidak ada menggagalkan seluruh perintah,
  sehingga tidak ada yang ter-stage dan commit berikutnya di rangkaian
  `&&` tidak berjalan (commit `e43e000` sempat tertahan).
- **Komponen yang membungkus nilai form mempertahankan bentuk nilai mentah
  form itu.** Tarif menyimpan jam sebagai teks "HH:mm" yang divalidasi
  skema; membungkus `InputWaktu` dengan `keTeksWaktu`, yang mengembalikan
  string kosong untuk waktu belum lengkap, akan menghapus angka yang baru
  diketik. `pisahTeksWaktu` dan `gabungTeksWaktu` menyimpan isian apa
  adanya.
- **Akibat bug dibuktikan dengan menjalankan baris yang dicurigai**
  sebelum diperbaiki. Dua baris `setHours` dan `toISOString` dari
  `susunPayloadPenjualan` dijalankan lewat `node -e` dan membuktikan jam
  "99" menggeser transaksi empat hari serta jam "ab" melempar
  `RangeError`.
- **Nama fixture uji tidak boleh menjadi awalan nama fixture lain**, dan
  elemen yang dikenali lewat nama dicocokkan persis tanpa `.first()`.
  Fixture "E2E Reservasi Aset Perbaikan" membuat pencari baris "E2E
  Reservasi Aset" di spec daftar reservasi membaca baris yang salah, dan
  tiga skenario gagal di suite penuh walaupun spec buat reservasi lolos
  sendirian (`652d669`).
- **Marka tidak menunjuk berkas yang baru dibuat oleh blok yang belum
  dijalankan.** Pesan commit di `/tmp` baru ada setelah blok commit
  dijalankan; marka yang menyisipkan butir ke berkas itu gagal dengan
  ENOENT sebelum menulis apa pun (terjadi dua kali). Pesan commit ditulis
  utuh di blok commit itu sendiri.
- **Halaman besar yang dipindah sekaligus diubah ditulis utuh, bukan
  dipindah lewat skrip.** Di buat reservasi hampir setiap rentang yang
  dipindah juga berubah isinya, sehingga skrip berjangkar justru rawan
  salah. Halaman lama dibaca penuh lebih dulu, `className` disalin persis,
  dan spec pembanding menjadi penjaganya (`477f258`, keputusan R9b).
- **Gerbang commit hanya sah bila laporannya dibuat setelah perubahan
  terakhir.** Gerbang membaca `/tmp/v.log` dan `/tmp/p.json` apa adanya,
  sehingga pada `bcd44a1` (perubahan komentar saja) gerbang lolos dengan
  laporan suite `477f258` karena suite tidak dijalankan ulang. Gerbang
  commit kode memeriksa juga bahwa kedua laporan lebih baru daripada
  berkas yang di-stage, misalnya
  `[ -z "$(find <berkas> -newer /tmp/p.json)" ]`.
- **Baris yang terpotong di keluaran (`cut -c`) tidak dijadikan jangkar
  maupun teks lama.** Pada kartu ringkasan keuangan, pembungkus kartu
  yang `className`-nya terpotong dibiarkan, dan penggantian memakai
  jangkar di sekitarnya. Berkas yang hampir seluruhnya berubah (mutasi
  arus kas, 298 menjadi 31 baris) ditulis ulang lewat heredoc di balik
  gerbang `git diff --quiet HEAD -- <berkas>` (`45187b6`).
- **Sebelum menamai tipe atau pola baru di `features/`, grep bentuk yang
  sudah ada.** Callback mutation punya dua bentuk (`OpsiMutasi` dan
  `Callback`); `useBuatAkunKas` sempat memakai nama ketiga sebelum
  diselaraskan dengan `Callback` milik penjualan dan pembayaran.
- **Selector untuk spec diambil dari rentang JSX utuh komponennya, dalam
  satu putaran.** Grep pola teks membuang teks tombol dan label yang
  ditulis di baris sendiri atau sebaris dengan ikon, dan pemetaan spec
  jadwal butuh lima putaran karenanya. Yang berhasil: `sed -n` pada
  rentang JSX setiap komponen yang disentuh spec (toolbar, sel, form,
  langkah), dengan saringan yang hanya membuang baris kosong, baris
  `className=` saja, baris penutup kurung, dan komentar JSX, ditambah
  helper uji dan komponen bersama yang dipakainya (kalender).
- **Tanda tangan hook dibaca utuh, termasuk nilai kembaliannya.** Aturan
  bahwa tanda tangan sebuah hook dibaca sebelum dipakai sudah ada, tetapi
  di submodul shift yang terbaca baru parameternya lewat `grep '^export'`,
  sehingga `useLokasiAktif` ditulis seolah mengembalikan hasil `useQuery`
  (`outlet.data?.id`), padahal mengembalikan `{ lokasi, lokasiId }`.
  `tsc` menangkapnya. Baca badan hook sampai `return`-nya.
- **Keluaran yang disaring tidak dijadikan teks lama penggantian.**
  Seperti baris yang terpotong `cut -c`, keluaran `grep -vE '^\s*$'`
  membuang baris kosong yang ada di berkas, sehingga pasangan yang
  melintasi baris kosong tidak pernah cocok. Di spec shift, dua pasangan
  gagal karena itu. Pakai pasangan satu baris, atau ambil teks lamanya
  dengan `sed -n` tanpa saringan (`cat -A` menampilkan baris kosong).
- **Spec lama dibaca utuh sebelum migrasi, bukan hanya judul dan
  selectornya.** Di submodul pola roster, badan dua test lama baru
  terbaca setelah keduanya gagal: satu mengharapkan perilaku yang sudah
  diubah keputusan (PL3a), dan satu mencegat path dengan glob yang peka
  huruf besar kecil, sehingga run pertama menyimpan data sungguhan yang
  harus dihapus lewat API.
- **`features/` diperiksa sebelum menulis api atau hook lintas modul.**
  Di submodul jadwal, daftar karyawan per ruang ditulis ulang di
  `features/jadwal`, padahal `features/pengguna` sudah menyediakan
  `useDaftarPengguna(workspace)`. Duplikasinya baru terlihat saat
  pencarian dampak dokumen penutup, dan diperbaiki di `e2a0cfd`. Cari
  dengan `grep -rn 'EP\.<modul>' features` sebelum menulis api baru.
- **Blok penerap dan blok verifikasinya digabung dalam satu blok.** Di
  Tahap B submodul jadwal, blok penerap dan blok verifikasi terpisah, dan
  verifikasi dua kali melaporkan galat yang sama karena blok penerapnya
  belum dijalankan. Setelah digabung, satu kali salin cukup.
- **`awk` tidak mengenal `\b`** (di awk, `\b` adalah backspace), sehingga
  pola seperti `/type Nama\b/` tidak pernah cocok. Pakai `[^A-Za-z]` atau
  `grep -n` untuk menemukan barisnya.

- **Jangkar `ganti-rentang.js` wajib unik di seluruh berkas dan diambil
  dari keluaran yang sudah terlihat.** Bila ragu, gerbang
  `grep -cF '<jangkar>'` menuntut hitungan tepat 1 sebelum skrip
  dijalankan.
- **Blok tempel dijaga paling banyak sekitar 50 baris.** Berkas panjang
  ditulis bertahap dengan `cat >>` yang bergerbang, bukan satu heredoc
  panjang.
- **Angka harapan untuk gerbang dihitung dari keluaran runner, dalam
  satuan yang sama.** Gerbang commit `b63cf08` sempat menuntut 364 test
  unit karena test `navigasiHalaman` dihitung dari baris `expect` (lima),
  bukan blok `it` (empat); hitungan spec penjualan 32 menjadi 28 sudah
  memberi angka yang benar.
- **Suite e2e penuh hanya dijalankan saat penting** (pemilik proyek,
  6 Oktober 2026, menggantikan PF6a): penyesuaian backend, penelusuran
  bug atau galat yang butuh uji menyeluruh, atau atas permintaan. Setiap
  commit kode tetap melewati `tsc`, ESLint, vitest penuh, dan spec yang
  terdampak, dan gerbangnya menuntut laporan spec itu lebih baru daripada
  berkas yang di-commit.
- **Skrip yang mencari penutup blok mencocokkan baris utuh berindentasi
  yang diharapkan**, bukan baris yang sudah dipangkas. Pencari penutup
  `describe("navigasiHalaman")` sempat mengenai `  });` milik blok `it`
  pertama, karena keduanya sama setelah dipangkas.
- **Skrip yang membuang rentang dari jangkar awal sampai jangkar akhir
  memeriksa isi di antaranya.** Pembuangan tipe dan fungsi
  `navigasiHalaman` ikut membuang tiga konstanta yang disisipkan di
  antaranya satu langkah sebelumnya; skrip semacam itu berhenti bila
  rentangnya memuat `export` lain yang tidak disebut.
- **Pasangan `ganti-blok.js` yang membuang baris memakai teks lama
  berupa baris itu beserta akhir barisnya, dengan satu baris kosong
  sesudah `@@@ baru`.** Helper membaca isian itu sebagai teks kosong,
  sehingga barisnya hilang tanpa sisa (tabel fixme `inti/pengujian.md`,
  30 September 2026).
- **Label keputusan baru diperiksa unik lintas dokumen.** R5 sampai R13
  untuk perubahan backend `465b438` bertabrakan dengan keputusan
  reservasi R1a sampai R9b dan sempat tertulis di `kontrak/temuan.md`;
  keputusannya dicatat ulang sebagai PB1a sampai PB14a.
- **Nama fungsi dan perilaku backend yang ditulis di dokumen atau
  komentar kode diperiksa dari kode lebih dulu.** `_filterDatabase`
  sempat ditulis di komentar `features/penjualan/filter.ts` tanpa dibaca;
  kebetulan benar, dan klaim 409 nama tipe aset kembar di
  `kontrak/README.md` baru dibuktikan setelah tertulis.
- **Audit endpoint dijalankan setiap kali backend berpindah versi,
  sebelum penyesuaiannya dianggap selesai.** Tujuh route yang hilang di
  `465b438`, termasuk `DELETE /akunkas/:id` yang dipakai pembersihan spec
  keuangan, baru ketahuan saat dokumen penutup disusun, setelah lima akun
  uji tertinggal.
- **Verifikasi berkas baru memeriksa ekspor yang diharapkan, bukan hanya
  ukurannya.** Dua berkas baru submodul metode pembayaran berukuran sama
  persis karena isi satu berkas tertempel ke berkas lainnya; `tsc` dan
  lima test e2e gagal lebih dulu sebelum `cmp` membuktikannya. Pemeriksaan
  `grep -c "^export function <Nama>\b"` per berkas menangkapnya dalam satu
  putaran.
- **Umur data uji dibaca dari `createdAt` di basis data, bukan ditebak
  dari akhiran `unik()`.** Perkiraan dari awalan basis 36 sempat keliru
  menyimpulkan satu tipe aset uji berasal dari run yang sedang ditelusuri.
- **Jumlah di pesan commit dihitung dengan perintah, bukan diperkirakan.**
  Pesan `3359497` menyebut enam tipe `Lama` tersisa, padahal `grep`
  menunjukkan lima.
- **Angka harapan di blok verifikasi juga dihitung dari isi berkas.** Pada
  submodul pajak, jumlah pasangan marka dan jumlah ekspor helper
  diperkirakan dan dua kali meleset, sehingga keluaran yang benar sempat
  tampak salah. Terulang pada error ESLint warisan (`4f19e77`): 15
  alih-alih 16 error dan 10 alih-alih 8 berkas, karena disebut dari
  ingatan, bukan dijumlah dari daftar yang sudah tercetak. Terulang lagi
  di `bc388c6`: 48 alih-alih 47 izin di `IZIN`. Terulang di `f64b518`: 20
  alih-alih 19 skenario spec produk, dihitung dari daftar judul; gerbang
  commit menolaknya. Angka gerbang diambil dari keluaran runner.
- **Rentang aggregate dibaca dari tahap `$lookup`-nya**, lewat
  `grep -nE '\$lookup' -A6`, bukan dari nomor baris field hasilnya.
  Rentang `sed` yang diambil dari baris `pajakList` hanya memuat
  `$project`, dan asal datanya baru terlihat di putaran berikutnya.
- **Temuan lama dibaca sebelum laporan backend disusun.** Dua calon temuan
  submodul pajak (galat 500 dan pencarian tanpa `tenantID` di
  `assignPajak`) ternyata sudah tercakup butir 80.
- **Dugaan sumber data dibuktikan dari model dan data development**, bukan
  dari nama field. `pajakList` diduga dibentuk dari relasi pajak produk;
  model produk, pencarian penulis field, dan tinjauan basis data
  membuktikan sumbernya field yang tidak pernah ditulis.
- **Pembuktian terhadap kode lama hanya sah bila data uji dapat
  membedakannya.** Skenario template lolos terhadap kode lama karena basis
  data development masih memuat permission yang sudah dibuang dari seed.
  Setelah keduanya disilang dan diselaraskan, skenario gagal di Manajer
  dan General Manajer (`366e9b7`).
- **`gagal: 0` dari `galat-e2e.js` dibaca bersama `ringkas-e2e.js`.**
  Helper itu hanya menghitung test yang gagal, sehingga run yang tidak
  menjalankan apa pun juga menjawab 0.
- **Backend di-`fetch` dan dibandingkan dengan acuan di awal setiap
  submodul**, sebelum pemetaan. Perubahan backend yang terlambat diketahui
  membuat pemetaan dan spec disusun di atas kontrak yang akan diganti:
  pada 1 Oktober 2026, `yoga` sudah sembilan commit di depan `465b438`
  saat submodul profil outlet dipetakan.
- **Fixture yang menulis perilaku keliru backend ikut menegaskannya.**
  `setelStokProduk` menegaskan `produk.stok` dihitung dari stok master,
  sehingga perbaikan backend `yoga` (`5eb72e5`) tampil sebagai empat belas
  kegagalan di persiapan test. Asersi persiapan diberi label yang
  menyebut kontrak yang dianggapnya, agar kegagalannya langsung terbaca
  sebagai perubahan kontrak, bukan regresi.
- **Dampak perpindahan backend dibaca dari diff kode per modul, bukan dari
  judul commit.** Judul `5eb72e5` ("hitung stok resep dari inventory
  outlet") mengesankan butir 37 tertutup, tetapi diff menunjukkan
  perhitungannya tetap hanya saat produk disimpan, dan `test.fixme`-nya
  terbukti masih gagal.
- **Gejala yang dilaporkan dibuktikan penyebabnya sebelum dicatat.**
  Menu sidebar yang hilang setelah muat ulang sempat diduga akibat token
  `pin-refresh`; isi token dari respons nyata menunjukkan izinnya utuh,
  dan penyebabnya ternyata effect sidebar ber-`[]` (`ca6eb3d`). Bandingkan
  payload token sebelum dan sesudah refresh lebih dulu, baru baca
  komponennya.
- **Harapan di blok verifikasi dihitung dengan cakupan yang sama dengan
  perintahnya.** Pada submodul profil outlet tiga harapan meleset karena
  cakupannya: `grep` nama field ikut menghitung komentar yang baru
  ditulis, `grep 'test('` ikut menghitung `test.describe(`, dan ESLint
  atas satu folder ikut memeriksa halaman modul lain.
- **Pekerjaan yang belum di-commit disimpan dengan `git stash push -u`
  sebelum mengerjakan commit perbaikan terpisah**, lalu dikembalikan
  dengan `git stash pop` setelah commit itu masuk, agar suite penuh
  mengukur perbaikan itu saja (`ca6eb3d` di tengah profil toko).
- **Celah backend dibuktikan lewat field yang tidak merusak, pada data
  uji yang dibuat dan dihapus skrip itu sendiri.** Operator `$set` di
  `PUT /pelanggan/:id` dibuktikan dengan `poinLoyalitas` pelanggan uji,
  bukan `tenantID`, dan dibandingkan dengan permintaan tanpa operator
  agar terlihat perlindungan mana yang terlewati. Service yang meneruskan
  body ke `findOneAndUpdate` tanpa `$set` dan validator tanpa allowlist
  adalah tandanya.
- **Jawaban sukses backend dibandingkan dengan data yang dibaca ulang.**
  `PUT` pelanggan menjawab 200 "berhasil" untuk pengosongan yang tidak
  terjadi; bila hanya status yang diperiksa, temuan itu tidak terlihat.
- **Berkas baru dibuat dan diperiksa sebelum blok yang mengimpornya
  dijalankan.** Pada pilihan diskon kasir, blok penerap menambahkan impor
  ke tiga berkas sebelum `syarat-diskon.tsx` dibuat; `next dev` gagal
  mengompilasi seluruh halaman, dan setiap test e2e habis waktu di login.
  Isi berkas baru ditulis paling atas dalam respons, dan blok penerap
  diawali pemeriksaan bahwa berkas itu ada.
- **Blok yang mengubah berkas di daftar gerbang commit yang belum masuk
  ditunda sampai commit itu masuk.** Gerbang menuntut laporan suite lebih
  baru daripada setiap berkas di daftarnya; perubahan untuk commit
  berikutnya yang diterapkan lebih dulu membuat gerbang menolak.
- **Suite penuh diawali pemeriksaan bahwa frontend dan backend hidup**
  (`curl` ke `/login` dan ke sebuah endpoint API), agar run 18 menit tidak
  terbuang.

- **Keluaran bersaring tidak dipakai untuk menyalin tampilan.** JSX yang
  akan ditulis ulang diambil utuh dengan `sed -n` tanpa saringan dan tanpa
  `cut`. Di halaman profil, saringan yang membuang baris `className`
  membuat migrasi harus dipecah dua tahap.
- **Helper audit dicocokkan setiap kali lapisan API bertambah.**
  `audit-endpoint.js` hanya mengenali `apiData`, `api`, dan `apiClient`,
  sehingga kedua login lewat `apiMentah` dilaporkan tanpa pemanggil
  (`1c13ee6`); polanya ditambah pada 2 Oktober 2026.
- **Respons yang membawa field di tingkat atas tidak dilewatkan
  `apiData`.** `unwrap` hanya mengembalikan `data`, sehingga `accessToken`
  login akan hilang; pakai `apiMentah` (`lib/api/client.ts`).
- **Dugaan regresi diuji dengan mengembalikan berkas tersangka ke `HEAD`
  sebelum disimpulkan.** Enam kegagalan setelah sidebar dipecah sempat
  disebut regresi; test yang sama tetap gagal dengan sidebar lama, dan
  penyebabnya server dev yang belum selesai mengompilasi rute itu
  (`referensi/playwright.md`, Catatan Playwright).
- **Snapshot sebuah test dicari lewat nama folder test-nya.** Berkas
  `error-context.md` memuat potongan sumber spec, sehingga `grep -l` atas
  judul test lain ikut cocok dan mengenai snapshot yang salah.
- **Data test unit ditulis sesuai maksud yang disebut judulnya.** Test
  nomor HP "berspasi di tengah" memakai teks berspasi di ujung, yang sah
  setelah `trim`, dan gagal karenanya.

- **Skrip yang memuat model backend dijalankan dari direktori backend.**
  Model memuat `config`, dan `config` membaca `.env` dari direktori
  kerja; dijalankan dari `frontend-web`, pemeriksaan variabel rahasia
  backend menghentikan proses sebelum tersambung. Pakai subshell:
  `(cd ~/Documents/backend-js && node /tmp/skrip.js)`.
- **Skrip yang berhenti tanpa bekerja keluar dengan kode gagal.** Skrip
  ganti password admin mencetak "BERHENTI" tetapi keluar dengan kode 0,
  sehingga rangkaian `&&` melanjutkan ke login dan menambah percobaan
  gagal di pembatas login. Set `process.exitCode = 1`, dan bila
  keluarannya dipipa, teruskan kodenya dengan `exit ${pipestatus[1]}` di
  dalam subshell.
- **Rahasia tidak lewat percakapan maupun riwayat shell.** Kredensial
  ditulis pemilik proyek ke berkas yang diabaikan git, skrip membacanya
  dari sana, dan keluaran hanya mencetak bentuk (panjang, jenis karakter,
  kunci respons), bukan nilainya.
- **Password yang terlupa tidak dapat dibaca dari basis data**, karena
  yang tersimpan hanya hash. Penggantiannya lewat model backend agar hook
  hash tetap berjalan, dengan mode tinjau sebagai bawaan dan syarat yang
  diperiksa sebelum menulis.
- **Galat `tsc` yang menunjuk `.next/dev/types/` diperiksa barisnya
  sebelum kode dicurigai.** Itu berkas bangkitan `next dev`; satu baris
  impornya sempat tertulis rusak (`page.jsge.js`) saat rute baru pertama
  dikompilasi di tengah run spec.
- **Berkas rute baru dibuat paling akhir, setelah seluruh berkas yang
  diimpornya ada**, dan blok yang mengubah berkas pengimpor diberi gerbang
  keberadaan berkas itu. Satu halaman rute yang belum dibuat lolos dari
  `tsc`, karena belum ada yang mengimpornya, dan baru terlihat sebagai
  tautan menuju 404.
- **Batas pembatas login dibaca dari nilainya, bukan dari nama
  konstantanya**, sebelum percobaan login diulang; saringan yang hanya
  menampilkan `limit: MAX_ATTEMPTS` belum menjawab berapa percobaan yang
  tersisa.
- **Laporan gerbang di `/tmp` dapat hilang bila commit ditunda.** Suite
  penuh `e53c016` dijalankan sehari setelah vitest, dan `/tmp/v.log`
  sudah dikosongkan sistem, sehingga gerbang menolak. Bila suite penuh
  dan commit tidak dikerjakan dalam satu sesi, vitest dijalankan ulang
  di blok commit yang sama.
- **Calon temuan backend dari kode dibuktikan lewat permintaan nyata
  sebelum dilaporkan**, pada data uji yang dibuat dan ditutup skrip itu
  sendiri. Dari lima calon temuan jurnal transfer, satu terbantah: id
  tidak sah di `PUT` diduga berujung galat server, padahal errorHandler
  pusat menjawab 404.
- **Izin endpoint modul baru dibuktikan lewat `GET` nyata sebelum
  pemetaannya dilanjutkan.** Pengeluaran dijadwalkan dari Lampiran A,
  yang mencatat route beban tanpa izin; satu `GET` sebagai Owner dijawab
  403, karena izinnya diperiksa di controller dengan nama yang tidak ada
  di seed. Silang juga nama izin di controller dan route dengan
  `GET /permission`.
- **Perbaikan backend yang dilaporkan tetapi belum dibuktikan diperiksa
  ulang setiap kali pekerjaan berikutnya tertahan.** Butir 33 menunggu
  sejak 30 September 2026 dan terbukti dalam satu skrip baca-saja yang
  membandingkan jumlah per status dengan dan tanpa query.
- **Membuang penyaringan klien didahului pemeriksaan bahwa hook tidak
  mempertahankan data filter sebelumnya.** Tanpa `placeholderData`,
  berganti filter mengosongkan daftar sampai respons baru tiba; dengan
  itu, baris filter lama akan tampil tanpa penyaring klien.
- **Skrip yang menyusun ulang blok impor mempertahankan baris kosong
  sesudahnya.** Skrip pemindah helper akun kas menyambung impor dan badan
  berkas tanpa baris kosong; `tsc` dan ESLint tidak menangkapnya, dan
  baru terlihat dari `sed -n '1,8p'` atas hasilnya (`f7805ca`).
- **Harapan spec yang belum dilihat langsung disebut sebelum run.**
  Dengan begitu kegagalannya dibaca sebagai harapan yang perlu diluruskan
  dari bukti, bukan dilonggarkan; di alur tutup akun bersaldo, teks pesan
  409 dan jumlah baris buku mutasi disebut lebih dulu, lalu terbukti.
- **Opsi `Intl` yang bergantung pada runtime ditulis eksplisit.** Dua
  pemformat yang teksnya sama persis memberi hasil berbeda di Node dan
  Chromium, karena batas pecahan IDR diambil dari data ICU. Bandingkan
  `resolvedOptions()` sebelum menyimpulkan bahwa fungsinya yang berbeda
  (`4c9c4ed`).
- **Premis sebuah pilihan dibuktikan sebelum diajukan sebagai
  keputusan.** Pilihan agar spec memakai pemformat halaman diajukan dan
  dipilih, padahal kedua pemformat sudah sama; keputusannya harus
  diajukan ulang setelah `lib/format.ts` dibaca.
- **Pola rentang `awk` untuk blok JSX tidak menuntut karakter sesudah
  nama tag.** `/<AlertDialog[ >]/` tidak menangkap tag yang berdiri di
  baris sendiri; ambil rentangnya dengan `sed -n` dari nomor baris hasil
  `grep -n`.

- **Tipe pengganti `any` dibuktikan lewat `tsc` per lokasi.**
  `Object.values` atas nilai yang dipersempit `typeof === "object"`
  bertipe `unknown[]`, sehingga callback berparameter sempit ditolak;
  parameternya `unknown`, dan field dibaca lewat cast (`lib/apiClient.ts`,
  `4f19e77`). Sebelum mengganti kembalian sebuah fungsi ke `unknown`,
  baca setiap pemakainya: `lib/auth/session.ts` tidak perlu diubah karena
  seluruh field sudah dibaca lewat `String` dan `Array.isArray`.
- **Pemakai sebuah berkas dicari juga lewat impor relatif.** Grep atas
  path beralias (`helpers/storage`) tidak menangkap `./storage` dari
  berkas di folder yang sama; gerbang penghapusan memakai pola yang
  mencakup keduanya.

- **Variabel yang dihitung tetapi tidak dipakai diperiksa sebagai calon
  bug sebelum dibuang.** `isLoadingLokasi` di stok outlet tampak seperti
  sisa migrasi, padahal menandai keadaan memuat yang tidak pernah
  ditampilkan: query ber-`enabled: false` tidak melaporkan `isLoading`,
  sehingga tabel menampilkan daftar kosong selama lokasi dimuat
  (`eb0181f`). Baca pemakaian yang semestinya ada sebelum memutuskan.
- **Blok perintah tidak memuat placeholder yang harus diganti tangan.**
  Blok pencarian dampak memuat `C=HASH_C` dan dijalankan apa adanya,
  sehingga pencarian untuk commit itu gagal tanpa terlihat. Nilai yang
  baru ada setelah blok lain dijalankan diambil lewat perintah, misalnya
  `git rev-parse --short HEAD`.

- **Laporan run yang masih akan dibaca tidak disimpan di `/tmp`.**
  Laporan suite penuh `fc29433` hilang sebelum durasi kegagalannya
  dibaca, sehingga sebab kegagalan itu tidak dapat dibuktikan. Laporan
  suite penuh ditulis ke `~/.cache/frontend-web/`.
- **Baris tabel kontrak dicari lewat isinya, bukan nomor dari ingatan.**
  Nomor `EP` baris pajak ditulis dari ingatan dan tidak ada; bagian
  riwayat yang diandaikan ada ternyata tidak. Cari lewat method dan path,
  dan lihat strukturnya sebelum menulis penerap.
- **Sebelum menjanjikan sebuah gerbang, periksa siapa yang membacanya.**
  Entri `IZIN_HALAMAN` diandaikan menolak rute, padahal hanya dibaca
  sidebar. `grep` pemanggilnya lebih dulu.
- **Field yang dihitung backend dipakai sebelum aturannya disalin.**
  Satuan resep hampir ditulis sebagai salinan tabel kelompok satuan
  backend, padahal `availableUnits` sudah dikirim per bahan.
- **Dugaan tentang test mana yang akan gagal dibaca dari isi spec.**
  Skenario gerbang `produk.stok` diperkirakan gagal terhadap backend
  baru, padahal skenario itu `test.fixme`; yang aktif menguji gerbang
  lain dan tetap benar.
- **Perubahan seragam di banyak berkas dibuktikan lewat ringkasan
  diff.** `git diff -U0` yang disaring lalu `sort | uniq -c` harus hanya
  memuat jenis baris yang direncanakan beserta jumlahnya; di `628f52e`
  itu 37 baris impor, 37 baris pemanggilan, dan empat baris kosong,
  tanpa baris tambahan. Skrip penerapnya memeriksa bentuk setiap berkas
  dan jumlah berkas sebelum menulis apa pun.

- **Syarat sebuah rute diturunkan dari hook yang dipanggil halamannya,
  bukan diwariskan dari path induknya.** Warisan akan menuntut
  `read-akunkas` di Pindah Dana dan `read-location` di detail pengajuan
  outlet, dan meloloskan `pengaturan/roles` lewat entri kosong induknya.
  Skrip sekali pakai yang menelusuri impor `.tsx` setiap `page.tsx` dan
  mencetak hook datanya memetakan 44 rute dalam satu putaran (`bc388c6`).
- **Data pendukung form dinilai wajib atau opsional dari kodenya sebelum
  dijadikan syarat.** Lokasi di buat bahan baku, bahan baku di form
  produk, dan pajak di buat penjualan tampak wajib dari nama hook-nya,
  tetapi ketiganya berbawaan kosong atau dimatikan tanpa izinnya.
- **Aturan kelengkapan dijaga test yang membaca disk.** Test unit gerbang
  rute membaca `app/dashboard` dan gagal bila ada `page.tsx` tanpa entri
  `IZIN_HALAMAN`, sehingga halaman baru tidak lolos diam-diam.

- **Nama izin di kode disilang dengan seed backend lewat skrip**, bukan
  dibaca dengan mata: satu perintah mencetak setiap nama di `IZIN` yang
  tidak ditemukan di `seeds/permissionSeed.js` (`dc0af1c`: 71 nama, tidak
  ada yang hilang).

- **Saat state form dipindah ke React Hook Form, nama pembaca dan
  penulisnya dipertahankan sebagai pembungkus nilai form.** Di form role,
  `selectedPermissions` (`useWatch`) dan `setSelectedPermissions`
  (`setValue`) membuat ketiga handler wewenang tidak perlu diubah, dan
  diff-nya tinggal sumber nilai serta validasi (`597a163`).
- **Rentang kode yang memuat baris kosong diganti lewat
  `ganti-rentang.js`, dengan penutup blok lama dibiarkan menjadi penutup
  blok baru.** Baris kosong di teks lama tidak terlihat isinya di
  keluaran, sehingga pasangan `ganti-blok.js` yang melintasinya rawan
  tidak cocok; `handleSubmit` form role diganti dari baris pembukanya
  sampai pernyataan terakhirnya saja.

- **Riwayat seluruh cabang backend diperiksa, bukan hanya cabang
  acuan.** `origin/yoga` tidak maju, tetapi `origin/nizar` maju tiga
  commit dari titik cabang yang lebih lama. Hitung commit di depan dan
  di belakang acuan untuk setiap cabang remote, dan uji gabungannya
  lewat `git merge-tree --write-tree` sebelum memutuskan cara mengujinya.
- **Pathspec pengecualian ditulis `:(exclude)<path>`.** Bentuk pendek
  `:!__tests__` gagal, karena garis bawah sesudah `!` dibaca git sebagai
  magic pathspec.
- **Rantai `a || b || c` atas ekspor modul dibaca dari bentuk ekspornya
  lebih dulu.** `m.client` pada klien ioredis adalah method perintah
  `CLIENT`, sehingga rantai itu memilih fungsi tersebut, bukan kliennya.
- **Komparasi dan marka dihitung dari satuan yang sama.** Satu bagian
  komparasi yang dipecah menjadi dua pasangan marka membuat harapan
  jumlah pasangan meleset (`9b25433`), dan harapan sisa nol meleset
  karena komentar baru memuat kata yang dicari.
- **Push dipisah dari rangkaian gerbang commit.** Push `8072214` ditolak
  galat server GitHub setelah commit masuk, lalu blok yang tertempel
  ulang ditolak gerbang karena tidak ada lagi yang berubah. Tanda `↑1`
  di prompt menunjukkan commit yang belum ter-push.
- **Nomor kembar yang menetap diperiksa dari data, bukan diulang.**
  Empat spec gagal di `POST /pengajuanstok`; `createdAt` dan waktu `_id`
  dokumen terakhir, dibandingkan dengan jam sistem, menunjukkan sebabnya
  dalam satu skrip baca-saja (`kontrak/temuan.md` butir 139).
- **Method api untuk endpoint yang berbeda ditulis terpisah**, bukan
  ternary di argumen pemanggilan: `audit-endpoint.js` mengenali panggilan
  lewat `apiData.get(EP...`, dan ternary membuatnya terlewat.
- **Pemilik modul backend dibaca dari berkas pemilik backend, bukan dari
  riwayat commit.** `git log --format='%an'` menunjuk Nizar untuk
  kategori beban, sedangkan pemiliknya Ridho lalu Yoga. Laporan 7 Oktober
  2026 semula melampirkan temuan nomor pengajuan (milik Yoga) pada
  laporan penyesuaian `nizar`.
- **Dokumen status backend dibaca di ketiga cabang sebelum laporan
  disusun.** `docs/pengembangan/klien.md` backend berisi 127, 325, dan
  241 baris di `ridho`,
  `nizar`, dan `yoga`; label B dan status `Menunggu verifikasi` di
  dalamnya menentukan bentuk laporan (`inti/backend.md`).
- **Ujung cabang remote diperiksa ulang sesudah `fetch` sebelum sebuah
  hash ditulis sebagai keadaan cabang.** Dokumen `9df34f6` menyebut
  `origin/yoga` `fc29433`, padahal cabang itu sudah di `55328f1` saat
  dokumen di-commit.
- **Blok perintah ditulis untuk zsh.** `set -- $p` tidak memecah kata di
  zsh; pasangan nilai dipisah dengan `${p% *}` dan `${p#* }`.
- **Beberapa pasangan `ganti-blok.js` untuk satu berkas cukup di bawah
  satu `@@@ berkas`** sejak 8 Oktober 2026. Sebelumnya pasangan di bawah
  satu `@@@ berkas` memakai satu objek, sehingga semuanya berisi teks
  pasangan terakhir dan ditolak dengan hitungan 0, tanpa ada berkas yang
  ditulis; kini `@@@ akhir` memulai objek baru yang mewarisi berkasnya.
- **Berkas backend ditulis agar tidak terbaca pemeriksa sebagai berkas
  repo ini.** `bentuk.cjs` menuntut setiap nama `.md` berhuruf kecil
  dalam backtick, polos atau berawalan `docs/`, `refactor/`, atau
  `kontrak/`, ada di `docs/` repo ini, dan `fakta.cjs` menuntut setiap
  path dalam backtick yang berawalan `app/`, `components/`, `features/`,
  `hooks/`, `lib/`, `scripts/`, `tests/`, atau `types/` ada di repo ini.
  Berkas backend berbentuk begitu ditulis dengan awalan
  `~/Documents/backend-js/`, seperti berkas pemilik di `inti/backend.md`.
  Path backend lain, misalnya `docs/pengembangan/klien.md` atau
  `seeds/permissionSeed.js`, tidak diperiksa dan cukup disertai kata
  backend. Nama yang kebetulan sama dengan berkas di `docs/` repo ini
  lolos tanpa tanda, sehingga kata backend tetap ditulis.
- **Hitungan `rev-list A..B` bukan ukuran aman menghapus cabang
  gabungan.** Cabang yang ujungnya commit gabungan miliknya sendiri
  selalu punya satu commit di luar; yang dibuktikan adalah kedua
  induknya, lewat `git merge-base --is-ancestor`. Syarat "aman hanya
  bila 0" sempat keliru untuk `uji-yoga-nizar`.
- **Bila `rev-list --left-right --count` menjawab 0 di satu sisi,
  gabungannya fast-forward**, dan pemeriksaan kelengkapan gabungan tidak
  diperlukan (`ridho` ke `nizar` `8dc6211`).
- **Perubahan indeks di skema backend dibuktikan dari daftar indeks di
  basis data**, bukan dari skemanya. Indeks yang dibuang dari skema
  tetap ada di basis data yang sudah berjalan: nama pelanggan kembar
  ditolak 409 walau skema `8dc6211` mengizinkannya, dan satu skrip
  baca-saja atas `collection.indexes()` menjelaskannya
  (`kontrak/temuan.md` butir 142).
- **Permintaan ke backend ditimbang terhadap preseden di proyek sebelum
  diajukan.** Butir 140 meminta filter koleksi `?penjualanID=`, padahal
  detail penjualan sudah membawa `pembayaran[]` dengan pola disertakan;
  permintaannya dipenuhi lalu tidak dipakai (NZ9a).
- **URL di blok tempel tidak diikuti titik koma, juga di dalam kutip
  tunggal.** zsh tetap menyisipkan garis miring terbalik saat ditempel;
  setiap `curl` ditulis di baris sendiri (pemeriksaan server sebelum
  suite penuh, 8 Oktober 2026).
- **URL yang diikuti titik koma juga rusak di dalam kode sumber yang
  ditempel lewat heredoc.** Baris konstanta berisi URL di berkas marka
  tertulis dengan garis miring terbalik sebelum titik koma, dan `tsc`
  menolaknya dengan "Invalid character" (`f64b518`). Di kode yang
  ditempel, URL disusun dari potongan atau diambil dari konstanta yang
  sudah ada, lalu barisnya diperiksa dengan `cat -A`.
- **Sebelum mengubah konstanta atau enum bersama, grep seluruh test yang
  menegaskan nilai lamanya.** `SATUAN_RESEP` ditambah pak, dan satu test
  di berkas test lain yang menegaskan pak ditolak baru ketahuan dari
  vitest (`f64b518`).
- **Gabungan cabang tanpa konflik diperiksa kelengkapannya sebelum
  di-commit.** Hasilnya dibandingkan dengan kedua ujung dan titik
  cabangnya: berkas yang absen, baris baru yang hilang, dan baris lama
  yang diganti sisi lain (`inti/backend.md`). Pada backend `92d4f27` hanya
  satu berkas berkonflik, tetapi lima bagian dokumen hilang di luar
  potongan konflik itu.
- **Tanda tangan fungsi lapisan API dibaca utuh sebelum dipanggil.**
  Opsi header `apiData.post` adalah argumen keempat, sesudah `tokenType`;
  pemanggilan pembayaran ditulis dari potongan grep pemanggilan penjualan
  dan ditolak `tsc` (`26093b0`).
- **Maksud sebuah aturan dipastikan kepada pemilik proyek sebelum
  perilaku backend dinilai.** Penolakan hapus bahan baku dinilai keliru,
  lalu benar, lalu keliru sebagian, dalam tiga putaran, sampai aturannya
  dirumuskan pemilik proyek: yang menghalangi hapus adalah riwayat, bukan
  entri stok awal (`kontrak/temuan.md` butir 143).
- **Test yang menegaskan perilaku backend ditulis setelah perilaku itu
  dipastikan benar.** Skenario yang menegaskan 409 untuk bahan baru
  sempat diterapkan lalu dibuang sebelum di-commit, karena mengunci
  perilaku yang ternyata keliru (`43f09af`).
- **Bukti hapus diambil dari respons dan dari data yang dibaca ulang.**
  Skenario hapus bahan baku lolos di satu suite penuh walau bahannya
  tidak terhapus, karena hanya menunggu baris tidak ada di tabel.
- **Filter server dipakai setelah datanya diukur.** `?locationID=` daftar
  penjualan menyaring dengan benar, tetapi sekitar 980 dari 1.620
  penjualan tidak punya `locationID`; tiga permintaan baca-saja (total,
  total terfilter, dan contoh baris tanpa nilai) menunjukkannya sebelum
  ada kode yang diubah.
- **Gabungan yang dibuat orang lain tetap diperiksa kelengkapannya.**
  Bila cabang yang ditarik sudah memuat cabang lain lewat commit
  gabungannya sendiri, berkas yang diubah kedua induknya dibandingkan
  terhadap titik cabang: baris tambahan tiap sisi dicari di hasil
  gabungan (`1d3f2d7` di backend).
- **Keluaran yang akan diunggah disimpan di luar `/tmp`**, misalnya di
  `~/Documents`, karena dialog unggah tidak membuka `/tmp` dengan mudah.
- **Dokumen bertabel panjang diperbarui lewat skrip berawalan baris**,
  bukan pasangan teks. Baris dikenali dari awalannya (nomor butir, method
  dan path, atau judul bagian), kalimat ditambahkan di akhirnya, dan
  skrip berhenti bila sasaran tidak tepat satu atau sudah diterapkan
  (dokumen penutup `2dd57aa`).
- **Alat diperiksa keberadaannya sebelum dipakai.** `npx` untuk paket
  yang tidak ada di `node_modules/.bin` menunggu konfirmasi unduh, dan
  bila keluarannya dibuang ke `/dev/null` terminal tampak macet
  (Prettier, 21 Oktober 2026). Sebelum menulis alat sekali pakai, baca
  daftar helper di `referensi/helper-dan-shell.md`: `/tmp/tambal.js`
  sempat ditulis ulang padahal `ganti-blok.js` sudah melakukannya.
- **Grep peta kode untuk teks antarmuka memakai `-i`.** Kotak cari
  bawaan `DataTable` ("Cari no. opname...") lolos dari pola huruf kecil
  `cari`, sehingga pemetaan stock opname sempat keliru menyatakan tanpa
  pencarian.
- **Endpoint baru di halaman atau panel berarti syarat izinnya dinilai
  ulang di commit yang sama** (keputusan rancangan butir 9 dan 16).
  Jurnal gudang dan panel jurnal dashboard mulai memanggil `/location`
  di `081d5dc` dan `b03c276` tanpa menuntut `read-location`; ditemukan
  saat penilaian dampak dan diperbaiki di `029413d`.

- **Mayoritas berkas repo tidak diakhiri baris baru** (487 dari 699
  berkas `.ts` dan `.tsx` per 26 Oktober 2026). Teks lama di skrip
  pengganti tidak memuat `\n` sesudah baris terakhir berkas, dan skrip
  mempertahankan bentuk akhir semula. Perapian akhir berkas tidak
  dicampur dengan commit fitur; perintah yang menyentuh banyak berkas
  sekaligus dibatasi pada berkas commit itu.
- **Berkas baru yang ditempel manual diperiksa isinya sebelum test
  dijalankan** (`head -3`): berkas test yang tertempel isi hook membuat
  vitest menjawab "No test suite found" (26 Oktober 2026).
- **Kandidat pekerjaan diturunkan dari baris yang dibaca, bukan dari
  jumlah hasil grep.** Ketiga "pemakaian `apiClient`" yang tersisa
  ternyata komentar (26 Oktober 2026).
- **Tidak ada formatter otomatis di repo ini**: tidak ada konfigurasi
  Prettier, dan baris dibiarkan sepanjang gaya berkasnya. Menjalankan
  `prettier --write` pada satu berkas memformat ulang baris yang tidak
  diubah (`riwayat-langganan.tsx`, 31 Oktober 2026; dibatalkan sebelum
  commit). Indentasi blok sisipan disesuaikan oleh skrip pengganti, dan
  hasilnya diperiksa dengan `git diff -w`.
- **Blok sisipan ditulis utuh sekali, bukan dengan penanda yang
  dirapikan kemudian.** Sisipan berisi test kosong dan kurung penutup
  sementara sempat masuk ke spec dashboard lalu harus ditulis ulang
  (31 Oktober 2026); `tsc` dan ESLint tidak selalu menangkapnya bila
  sintaksnya kebetulan sah.
