# Arsip Pelajaran per Putaran

Sifat perubahan: **Jarang**: hanya bertambah saat isi dipindah dari lapis lain; isi lama tidak diubah.

Lapis arsip: tidak perlu dikirim di chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Pelajaran dari fase UI/UX (11 Oktober 2026)

- **Rancangan tampilan ditunjukkan sebagai pratinjau sebelum kode
  ditulis.** Pemilik proyek menilai dari pratinjau, memilih atau
  mengoreksi, baru kode diterapkan. Setelan kecil sesudahnya (satu angka
  bayangan, satu kelas) langsung diterapkan dan dinilai dari tangkapan
  layar. Dashboard outlet melewati tiga pratinjau, dan tabel empat.
- **Yang diubah pemilik proyek bisa lebih luas dari yang ditanyakan.**
  Saat ditanya warna kartu baris, yang dimaksud adalah warna krem
  utamanya di seluruh aplikasi. Bila jawaban menyebut salah satu warna
  utama, tanyakan apakah yang berubah nilainya atau hanya pemakaiannya.
- **Hierarki permukaan dibuat lewat terang-gelap, bingkai, dan bayangan;
  warna dipakai sebagai aksen.** Krem sebagai isian baris tabel yang lebar
  terasa berat, padahal cocok di bidang kecil (keputusan WR3a).
- **Penggantian massal memakai skrip bermode tinjau yang berhenti bila
  hitungannya tidak cocok,** dan cara menghitung di skrip harus sama
  dengan cara menghitung pembandingnya. Skrip token warna berhenti karena
  mencari `#FFFAF3` tanpa batas, sedangkan pembandingnya `grep` berpola
  `\b`; selisih dua ternyata `#FFFAF399`.
- **Bayangan baris tabel dipasang pada `tr`, bukan pada sel.** Bayangan
  per sel meninggalkan garis tegak di tiap batas kolom. Jangkauannya harus
  lebih pendek dari celah antarbaris: bayangan selebar celah terbaca
  sebagai pita latar, dan pembungkus ber-`overflow-x-auto` memotong
  tepinya lurus.
- **Blok penerap yang panjang dipecah per berkas,** masing-masing dengan
  berkas markanya sendiri. Satu blok sekitar 300 baris tidak dapat
  ditempel utuh di terminal. Blok yang sudah menjawab OK tidak dijalankan
  ulang.
- **Komponen yang hook-nya tidak dapat dimatikan dipasang bersyarat.**
  Izin per panel dashboard ditegakkan dengan tidak memasang komponennya,
  karena `useLabaRugi` dan `useDaftarSesiBooking` tidak menerima opsi
  untuk dimatikan.
- **Gerbang commit membandingkan waktu berkas dengan laporan e2e.** Blok
  commit menolak bila ada berkas yang lebih baru daripada laporan
  (`find -newer`), sehingga perubahan sesudah run tidak ikut ter-commit
  tanpa diuji.

## Pelajaran dari penyesuaian backend `ridho` `7d28135` (16 Oktober 2026)

- **Status perintah dalam pipa dibaca lewat `${pipestatus[1]}`.** Di zsh,
  `$?` sesudah pipa adalah status perintah terakhir; `merge-tree` yang
  berkonflik tercetak berkode 0 karena dipipa ke `head`.
- **Kelengkapan gabungan diperiksa per jenis berkas.** Berkas yang hanya
  diubah satu sisi dibandingkan langsung dengan versi sisinya
  (`git diff --quiet <sisi> -- <berkas>`); pencocokan baris hanya untuk
  berkas yang disentuh kedua sisi. Pencocokan baris lewat himpunan
  menghasilkan 54 temuan palsu dari baris umum seperti `});`.
- **Skrip yang dipakai lintas langkah disimpan di
  `~/.cache/frontend-web/sesi/`**, bukan `/tmp`, yang dikosongkan saat
  mesin dinyalakan ulang di tengah sesi.
- **Nilai enum dibuktikan dari respons, bukan ditebak.** Status akun kas
  adalah `aktif` dan `non-aktif`; skrip bukti yang mencari `AKTIF`
  berhenti tanpa menemukan akun.
- **Tabel field kontrak dibaca utuh per bagian**, bukan lewat `grep` kata
  kunci: `keterangan` wajib di `POST /bebanoperasional` terlewat karena
  barisnya terpotong.
- **Field yang dibaca mapper belum tentu tersimpan di dokumen.**
  `referensi.penjualanID` mutasi kas diisi service dari dokumen pembayaran
  saat respons dibentuk; pemeriksaan di tingkat dokumen menyimpulkan
  tidak ada.
- **Daftar panjang di keluaran diringkas per kelompok.** Daftar akun kas
  yang dicetak per baris mencapai lebih dari 250 baris.
- **Skrip bukti berhenti begitu langkah pembuat gagal.** Langkah sesudah
  `POST` yang gagal memanggil path tanpa id, sehingga menghasilkan 404
  yang tercatat sebagai lolos maupun gagal palsu.
- **Spec yang bergantung pada data folder lain menyiapkan datanya
  sendiri.** Suite berjalan urut abjad: spec `keuangan/` berjalan sebelum
  `penjualan/`, sehingga data yang dibuat spec penjualan belum ada saat
  spec mutasi kas berjalan (RG5a).

## Pelajaran dari tabel seragam K-A (17 Oktober 2026)

- **Gerbang ESLint menerima warning yang sudah tercatat, bukan log
  kosong.** Berkas yang memanggil `useReactTable` selalu memuat satu
  `react-hooks/incompatible-library` yang sengaja dibiarkan (`inti/status.md`).
  Gerbangnya mensyaratkan ringkasan `✖ 1 problem (0 errors, 1 warning)`
  dengan aturan itu; warning lain tetap menghentikan commit.
- **Angka harapan `ls` dihitung dari berkas yang benar-benar dibuat
  blok**: tiga per pasangan teks, empat per rentang, ditambah berkas
  `.berkas` yang dibuat perulangan lebih dulu. Angka yang diperkirakan
  meleset tiga kali pada 16 dan 17 Oktober 2026.
- **Berkas marka `ganti-rentang.js` disimpan di luar direktori pasangan**,
  karena `terapkan-dok.js` membaca setiap nama berkas di direktori itu.
- **`Select` Radix di jsdom butuh polyfill** `ResizeObserver`,
  `hasPointerCapture`, `releasePointerCapture`, dan `scrollIntoView` di
  `beforeAll`; dengan itu `user-event` 14 membuka dan memilih opsinya
  (`tests/integration/components/data-table/data-table.test.tsx`).
- **Warna dipisah menurut arti sebelum diganti.** `text-red-600` di modul
  keuangan dipakai untuk uang keluar, pesan galat, dan status VOID;
  penggantian massal hanya untuk berkas yang seluruh pemakaiannya satu
  arti (jurnal stok), selebihnya per tempat (mutasi kas).
- **E2e didahului pemeriksaan kedua server.** `ERR_CONNECTION_REFUSED` di
  langkah pertama berarti server mati, bukan kode yang gagal; blok
  pemeriksaan memastikan port 3000 dan 4000 menjawab lewat `curl`
  sebelum Playwright dijalankan.
- **Blok penerap yang panjang dipecah sejak awal** (pemilik proyek, 17
  Oktober 2026), masing-masing diakhiri hitungan `ls` sebagai pengaman.

## Pelajaran dari tabel seragam K-C (17 Oktober 2026)

- **Gerbang commit mencetak nilai setiap syarat dalam satu baris**
  sebelum `if`, misalnya `tsc 0 eslint 0 vitest 0 lulus659 1`. Gerbang
  pertama `6f9d3eb` hanya mencetak "GAGAL", dan penyebabnya butuh satu
  putaran pemeriksaan terpisah.
- **Keluaran vitest yang dialihkan ke berkas tetap berwarna.**
  `/tmp/v.log` memuat kode ANSI di antara `Tests` dan `659 passed`,
  sehingga `grep -E 'Tests +659 passed'` tidak pernah cocok. Kodenya
  dibuang lebih dulu lewat `sed 's/\x1b\[[0-9;]*m//g'`.
- **Blok penerap disimulasikan sebelum dikirim**: marka dijalankan dengan
  salinan helper terhadap berkas dari arsip unggahan, dan angka harapan
  (`wc -l`, hitungan `grep`) diambil dari hasil simulasi. Keenam blok
  penerap K-C masuk tanpa ulang. Harapan `wc -l` pesan commit, yang tidak
  disimulasikan, meleset (29 alih-alih 27).
- **Spec untuk daftar yang baru dipaginasi diperiksa langkah yang mencari
  baris tertentu**, lalu urutan server dibuktikan dari service
  (`grep '\.sort('`) dan dari permintaan nyata (`api-surat-jalan.js`)
  sebelum cara spec menemukannya dipilih (TB14a).

## Pelajaran dari tabel seragam K-B (17 Oktober 2026)

- **Berkas baru yang dibuat manual dibuktikan lewat sidik isinya, bukan
  `wc -l`.** Editor dapat menyimpan tanpa baris baru di akhir, sehingga
  `wc -l` kurang satu (45 alih-alih 46 pada `menu-aksi-stok.tsx`).
  Gerbang menormalkan baris baru akhir lalu membandingkan `md5`:
  `{ cat f; [ -n "$(tail -c1 f)" ] && echo; } | md5sum`.
- **Hook di halaman yang punya `return` awal diletakkan sebelum `return`
  itu.** `kolom` inventaris gudang (`useMemo`) ditempatkan sebelum layar
  memuat global.
- **Simulasi juga memeriksa sintaks hasil penerapan** lewat
  `ts.transpileModule` dari `typescript` global, sehingga galat sintaks
  TSX tertangkap sebelum blok dikirim.

## Pelajaran dari tabel seragam K-D (18 Oktober 2026)

- **Gerbang memeriksa keberadaan berkas pembanding sebelum
  membandingkannya.** Saat `/tmp` bersih setelah mesin dinyalakan ulang,
  `find ... -newer /tmp/p.json` gagal dan `wc -l` tetap mencetak 0,
  sehingga syarat "tidak ada berkas lebih baru" lolos keliru. Gerbang
  kini mensyaratkan `[ -f /tmp/p.json ]` dan mencetaknya sebagai
  `laporan`.
- **Pemeriksaan backend di awal sesi dibaca dulu sebelum blok lain
  dijalankan.** Pada 18 Oktober `origin/nizar` membawa dua commit baru,
  tetapi gerbang commit sudah dijalankan di pesan yang sama. Commit
  `2177ac3` tetap sah karena diuji terhadap backend lokal yang tidak
  berubah; dampak commit baru dinilai sesudahnya (Catatan K-D).
- **Penutupan tabel seragam ikut mencari `<table` dan menghitung ulang
  berkasnya.** Butir utang di `inti/status.md` tentang berkas yang masih
  memakai `<table>` tertinggal di angka 17 sejak K-A, karena tidak
  menyebut nama berkas yang diubah K-C dan K-B, sehingga lolos dari
  pencarian dampak. Penutupan K-D menghitungnya ulang di gerbang commit.

## Pelajaran dari tabel seragam K-E (18 Oktober 2026)

- **Setiap blok diawali `cd ~/Documents/frontend-web &&`.** Terminal
  sempat berada di `app/dashboard/outlet/pola-roster`, sehingga semua path
  relatif gagal; gerbang menahan penerapan, tetapi seluruh putaran itu
  terbuang.
- **Penjaga posisi backend ditulis di dalam blok e2e.** Blok
  membandingkan HEAD dan hitungan maju-mundur setiap cabang remote dengan
  keadaan yang terakhir dinilai, lalu berhenti tanpa menjalankan e2e bila
  berbeda, sehingga pelajaran K-D tidak bergantung pada pembaca berhenti
  di tengah.
- **Penggantian berulang di spec memakai skrip sekali pakai berhitungan.**
  Setiap pola punya jumlah harapan, baris yang dikecualikan atau disisipi
  diperiksa isinya lebih dulu, dan tidak ada berkas yang ditulis bila satu
  hitungan meleset (`/tmp/ke-spec.js`, 30 `cariBaris` di tiga spec).
- **Daftar berkas di zsh dipecah dengan `${=VAR}`**, karena zsh tidak
  memecah isi variabel menjadi kata seperti bash.

## Pelajaran dari cakupan daftar penjualan (18 Oktober 2026)

- **Syarat filter server dibuktikan dari data sebelum kode diubah.**
  Total dengan dan tanpa filter dibandingkan lewat satu skrip baca-saja
  (1.685 dan 1.685), bersama jumlah baris tanpa nilai di 100 terbaru.
- **Harapan setiap blok dihitung untuk keadaan sesudah blok itu saja.**
  Pemeriksaan sisa blok E ikut menghitung baris yang baru dibuang blok
  E2, sehingga harapan `sisa: 0` keliru walau penerapannya benar.
- **Pola pemeriksaan sisa hanya cocok dengan bentuk yang dibuang, dan
  barisnya dicetak, bukan hanya jumlahnya.** `Penjualan \}` cocok dengan
  impor `bolehCakupanPenjualan }`.
- **Pemeriksaan sisa di gerbang memakai cakupan berkas yang di-commit**
  (`cat ${=F}`). Cakupan seluruh folder menangkap `outletTenantId` yang
  sah di `lokasiFinalisasi`, dan gerbang menolak commit yang benar.
- **Angka harapan pesan commit diambil dari `wc -l` setelah berkasnya
  ditulis**, lalu dipakai gerbang. Perkiraan 53 baris ternyata 48.

## Pelajaran dari halaman pengeluaran (18 Oktober 2026)

- **Server dev yang menjawab 500 "Is a directory" untuk folder rute baru
  dipulihkan dengan memulai ulang `npm run dev`.** Turbopack sempat
  mencatat folder `kategoriBeban` sebagai berkas, padahal `tsc` bersih
  dan berkasnya benar. Penyebabnya dibaca dari HTML 500 lewat `curl`.
- **Blok e2e menahan bila server frontend tidak menjawab 200**, bukan
  hanya mencetak statusnya. Tanpa itu suite tetap berjalan, dan setiap
  test tertahan di login.
- **Angka harapan audit dibaca dari baseline tercatat, bukan diingat.**
  Harapan 149 panggilan dan 243 route ternyata 150 dan 242.
- **Pencarian dampak untuk beberapa commit menjalankan istilah perilaku
  sekali saja.** Empat run dengan istilah yang sama menghasilkan 1.059
  baris yang sebagian besar berulang.
