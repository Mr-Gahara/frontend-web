# Keputusan Rancangan

Sifat perubahan: **Jarang**: bertambah saat ada keputusan baru. Butir lama boleh dilengkapi, tetapi tidak dibalik tanpa pembahasan.

Lapis inti: kirim di setiap chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

Dua jenis keputusan yang mengikat pekerjaan refactor:

- **Keputusan produk**: perilaku yang dilihat pengguna, diputuskan pemilik
  proyek.
- **Keputusan rancangan**: aturan teknis yang berlaku lintas modul.

Keputusan yang sudah tercatat tidak dibalik tanpa pembahasan dengan pemilik
proyek. Keputusan baru ditambahkan di akhir kelompoknya, dan nomor butir
keputusan rancangan tidak diubah agar rujukan lama tetap berlaku.

## Keputusan produk

## Model bisnis MVP

Diputuskan pemilik proyek pada 22 September 2026. Mengikat seluruh modul,
dan membatalkan rencana cakupan per gudang yang dijadwalkan pada hari yang
sama (submodul pengajuan stok, di bawah).

- **Satu tenant adalah satu brand dengan tepat satu outlet dan satu
  gudang** pada MVP. Multi-outlet dan multi-gudang direncanakan di patch
  berikutnya; relasi outlet dan gudang (many-to-many atau many-to-one)
  belum diputuskan.
- **Pengguna dan akun hanya terikat ke tenant**, tidak ke lokasi. Tempat
  dan peran kerja seseorang (petugas gudang, kasir outlet) dibedakan lewat
  role dan permission. Petugas gudang yang sedang berada di outlet tetap
  dapat membuka ruang gudang, karena aksesnya ditentukan RBAC.
- **Lokasi hanya penanda posisi dan acuan absensi** (koordinat dan radius
  absen). Absensi urusan aplikasi; web hanya memantau.
- **Lokasi aktif adalah outlet milik tenant**, bukan lokasi pribadi
  pengguna: `GET /location/current` memanggil `getByTenant`, yang mencari
  lokasi pertama bertipe Outlet (`kontrak/endpoint.md` bagian 3.3).
- **Ruang gudang menampilkan seluruh gudang milik tenant**, tanpa cakupan
  per gudang. Siapa yang boleh masuk ditentukan RBAC.
- **Bekerja lintas outlet ditentukan satu permission khusus**, bukan nama
  role maupun lokasi: melihat data seluruh outlet di ruang outlet, dan
  mengajukan stok atas nama outlet lain. Namanya ditetapkan tim backend;
  sampai itu `IZIN_LINTAS_OUTLET` di `lib/auth/permissions.ts` bernilai
  null, dan semua pengguna, owner pun, terkunci ke outlet tenant
  (`085ec78`, keputusan rancangan butir 18).
- **Data tidak dibatasi per lokasi pengguna** di backend, cukup per tenant
  dan per permission. Query `locationID` tetap sah sebagai penyaring
  pilihan, bukan pembatas akses. Ini jawaban atas SO-3
  (`kontrak/temuan.md` butir 20).
- **Master data (produk, bahan baku, barang) milik tenant dan bersumber
  dari outlet.** Gudang tidak punya master sendiri; gudang baru mulai
  kosong, lalu menarik barang dari master lewat tambah barang di
  inventaris gudang.
- **Stok outlet dan stok gudang tidak boleh tercampur** di tampilan mana
  pun. Stock adjustment di ruang outlet hanya lokasi Outlet sejak
  `a5e9cec`, dan ruang gudang hanya lokasi Gudang sejak `247cf2d`.
- **Onboarding dilakukan klien sendiri** (28 September 2026). Klien
  mendaftar lewat `POST /akun/auth/register` (publik; menghasilkan akun
  `client` tanpa tenant dengan masa percobaan), lalu men-setup tenant,
  owner pengguna, dan lokasi sendiri lewat aplikasi. Petugas lapangan
  bersifat opsional: bila klien kesulitan, petugas datang ke toko dan
  membantu dengan login ke akun klien itu. Admin platform hanya membuat
  akun klien dan mengelola langganan (`/akun/admin/*`), tidak men-setup
  tenant. Setup tenant (`POST /tenant`, `tenantService.createWithOwner`)
  selalu untuk akun pemanggilnya, dan membuat role Owner berizin penuh,
  akun kas "Kas Kecil (Laci)" `CASH-001`, serta metode pembayaran
  "Tunai".

## Keputusan rancangan yang mengikat

1. **Tipe selalu memakai `id`**, tidak pernah `_id`, karena `lib/api/client.ts` menormalkan respons. Pola `id || _id` tidak boleh ditulis lagi.
2. **Owner tidak diperlakukan khusus** lewat pengecekan nama role. Backend memberi Owner seluruh permission, sehingga pemeriksaan berbasis daftar permission sudah mencakupnya. Pengecualian: `useLevelPenggunaAktif` memakai nama role untuk menentukan level 100, karena token tidak membawa level; dipakai modul pengguna dan role untuk membandingkan level role. Cakupan data lintas lokasi di ruang outlet sempat mengikuti level itu, dan sejak `085ec78` mengikuti izin lintas outlet (`bolehLintasOutlet`), sehingga tidak lagi bergantung pada nama role. Pemeriksaan nama role Owner di `gudang/layout.tsx` dibuang bersama modul gudang (`9ce288b`).
3. **Invalidasi memakai akar domain** bila perubahan bisa memengaruhi beberapa varian. Kunci akar (`semua`) hanya untuk invalidasi, tidak untuk menyimpan data: halaman gudang lama memakai `queryKeys.bahanBaku.semua` sebagai kunci data master bahan baku.
4. **Field yang dipakai service tetapi tidak ada di validator** harus diperiksa sebelum dihapus dari payload (lihat `docs/kontrak/README.md` bagian 1, keterbatasan).
5. **Bug backend tidak diperbaiki dari sini.** Frontend menyesuaikan diri, lalu temuan ditulis untuk tim backend setelah commit bersih.
6. **Setiap tahap harus hijau dan bisa di-commit.** Tipe dan pemakaiannya berubah dalam satu commit.
7. **Satu prop untuk satu tujuan.** Pada komponen bersama, jangan memakai satu
   nilai untuk dua maksud yang kebetulan sama di salah satu mode. Pada modul
   role, `urlKembali` sempat dipakai sebagai tujuan tombol kembali sekaligus
   tujuan setelah menyimpan, sehingga halaman kostum kembali ke pilih template
   alih-alih ke daftar posisi.
8. **Form yang diisi dari data server dipasang setelah data itu termuat**, dengan
   nilai awal lewat `defaultValues`, bukan diisi ulang dengan `reset` di
   effect. Hook detailnya memuat ulang saat halaman dibuka
   (`refetchOnMount: "always"`), karena `defaultValues` hanya dibaca sekali dan
   `isFetchedAfterMount` tidak pernah true bila cache masih segar.
9. **Aturan izin endpoint yang tidak sederhana** (misalnya menerima salah satu
   dari beberapa izin) diletakkan di `features/<modul>/izin.ts`, bukan ditulis
   ulang di halaman pemakainya.
10. **Logika yang menangani ketidakselarasan backend** (payload, pesan error,
    data tampilan) ditulis sebagai fungsi murni (`payload.ts`, `pesan.ts`,
    `tampilan.ts`) agar dapat diuji unit dan mudah dibersihkan setelah backend
    diperbaiki.
11. **Data yang terbukti salah dari backend tidak ditampilkan sebagai nilai.**
    Tampilkan `-` beserta keterangan singkat, dan kendalikan penanganan
    sementara apa pun dengan satu konstanta (misalnya
    `SERVER_TERIMA_HITUNGAN_KOSONG` di `features/stock-opname/payload.ts`)
    yang komentarnya menyebut penyebab, konsekuensi, dan syarat pembaliknya,
    agar pembersihannya cukup satu perubahan. Angka palsu seperti koreksi 0
    pada audit trail lebih menyesatkan daripada kolom kosong. Pola ini
    terbukti pada `MAPPER_ADJUSTMENT_SUDAH_BENAR`, yang dibersihkan dalam
    satu putaran begitu mapper backend diperbaiki (`2b3b52d`).
12. **Hook dan API untuk data lintas modul hanya didefinisikan sekali.** Lokasi
    dan inventory tinggal di `features/inventaris`; modul lain mengimpornya dari
    sana. Sebelum membuat hook baru, grep kunci cache dan endpoint-nya di seluruh
    `features/`. Pada jurnal stok, `useLokasiAktif` ternyata sudah ada di
    `features/bahan-baku` dengan kunci yang sama, lalu disatukan.
    Periksa juga halaman lama yang mengisi kunci yang sama lewat `apiClient`:
    bila bentuk datanya berbeda, pakai kunci lain (`useLokasiBertipe` pindah ke
    `lokasi.daftar()`) atau seragamkan lewat fungsi murni (`lokasiTunggal`).
13. **Hook mutation menerima callback halaman.** `onSuccess` dan `onError` dari
    halaman dipakai untuk toast dan reset dialog, sedangkan pemanggilan API dan
    invalidasi tetap di hook. Dengan begitu variabel mutation dan JSX yang
    memanggil `.mutate()` atau `.isPending` tidak perlu diubah saat migrasi.
    Contoh: `useUbahStokMinimum({ onSuccess, onError })` di `features/inventaris`.
14. **Tombol aksi mengikuti izin endpoint-nya, bukan hanya status dokumen.**
    Status menentukan tahap, izin menentukan siapa yang boleh bertindak.
    Tombol yang izinnya tidak dimiliki pengguna disembunyikan, dan aturannya
    diletakkan di `features/<modul>/izin.ts` (butir 9). Contoh:
    `bolehHitungOpname` dan `bolehTinjauOpname` di `features/stock-opname`.
15. **Penyimpanan sebagian hanya mengirim yang berubah dibanding data
    server.** Pembandingnya nilai tersimpan di cache query, bukan isian awal
    lokal, dan field yang tidak berubah tidak dikirim bila backend
    mengizinkannya. Dengan begitu data yang disimpan pengguna lain setelah
    halaman dimuat tidak tertimpa. Contoh: `susunPayloadHitungan` dan
    `petakanNilaiServer` di `features/stock-opname/payload.ts`. Rancangan
    pertama yang mengirim `null` untuk setiap isian kosong akan menimpa
    hitungan staf lain.
16. **Izin alternatif sebuah endpoint dinyatakan di `IZIN_HALAMAN`** sebagai
    array di dalam daftar syarat (`SyaratIzin`), bukan sebagai fungsi izin per
    halaman. Dengan begitu `bolehBukaHalaman` dan `bolehBukaGrup` tetap satu
    pintu untuk sidebar dan gate halaman. Aturan izin untuk tombol dan data
    di dalam halaman tetap di `features/<modul>/izin.ts` (butir 9 dan 14).
17. **Frontend hanya memperbaiki bagiannya sendiri, ditulis untuk kontrak
    yang benar.** Bug backend dilaporkan dengan bukti, bukan diakali agar
    test lolos. Penanganan sementara hanya dipakai bila perilaku backend
    merusak data, dan dikendalikan satu konstanta bila membaliknya cukup
    untuk kembali ke kontrak yang benar (butir 11). Test yang membuktikan
    perilaku benar ditulis lengkap sebagai `test.fixme`. Bila tidak ada
    payload yang benar selama kontrak backend belum berubah, penahanannya
    ditulis sebagai aturan beserta syarat pencabutannya, bukan konstanta.
    Contoh: `SERVER_TERIMA_JUMLAH_NOL` dan penahanan item tanpa master di
    `features/transfer-stok/payload.ts` (pemilik proyek, 21 September 2026);
    saklar itu dibuang di `6e314ae` begitu backend memperbaikinya (PB12a).
    Bug milik frontend yang terbukti oleh spec tidak ditandai `test.fixme`,
    melainkan diperbaiki di commit spec itu, karena perbaikannya ada di
    tangan frontend: deskripsi tipe aset (`a2adc70`), serta kolom tipe
    aset dan dialog hapus tarif (`04830b7`) (pemilik proyek, 26 September
    2026).
18. **Identitas yang masih menunggu backend ditulis sebagai konstanta
    null, bukan tebakan.** Aturannya ditulis lengkap sekarang dan berlaku
    begitu konstanta diisi, tanpa perubahan lain. Nama tebakan yang kelak
    berbeda dari backend akan diam-diam tidak pernah cocok, sedangkan null
    terlihat jelas, mudah dicari, dan dipaksa ditangani TypeScript. Test
    untuk kedua keadaan dikondisikan pada konstanta yang sama: skenario
    yang menunggu backend memakai `test.fixme` bersyarat, skenario yang
    hanya berlaku selama konstanta null memakai `test.skip` bersyarat.
    Contoh: `IZIN_LINTAS_OUTLET` di `lib/auth/permissions.ts` dan
    `tests/helpers/lintas-outlet.ts` (pemilik proyek, 22 September 2026).
19. **Tipe ber-`_id` yang masih dibaca halaman lama menjadi jembatan
    berakhiran `Lama`.** Nama kanonik menjadi tipe ber-`id` dari bentuk
    respons nyata, sedangkan halaman lama memakai tipe lamanya lewat alias
    impor (`DiskonLama as Diskon`, sampai `1e05df6`), sehingga badan halaman tidak
    berubah. Tipe `Lama` dihapus di commit migrasi modul pemiliknya, dan
    sisanya dicatat di `inti/status.md` sampai habis (pemilik proyek, 24
    September 2026: frontend akhirnya harus bersih dari `_id`).
20. **Endpoint buat yang mendukung idempotensi dipanggil dengan satu kunci
    per pengisian form.** Kunci dibuat saat form pertama kali lolos
    validasi, dipakai ulang bila permintaan diulang, dan diganti setelah
    berhasil, lewat opsi header `api.post` dan `apiData.post`. Contoh:
    `x-idempotency-key` di `useBuatPenjualan` (keputusan K3a).
21. **Spec e2e tidak memalsukan respons sukses.** `route.fulfill` hanya
    menjawab status gagal untuk jalur yang tidak dapat dibuat backend
    secara deterministik. Keadaan antara diuji dengan menahan permintaan
    lalu meneruskannya (`route.continue`), dan keberhasilan dibuktikan
    dari respons nyata atau data yang dibaca ulang lewat API. Simulasi
    berstatus 200 yang tidak terhindarkan ditandai `// simulasi:` beserta
    alasannya, dan gerbangnya `audit-fulfill.js`. Tujuan pengujian adalah
    membuktikan logika dan alur berjalan benar di frontend dan backend
    (pemilik proyek, 26 September 2026). Contoh:
    `tests/e2e/auth/login.spec.ts` (`5a3deea`).
22. **Seluruh input tanggal dan waktu memakai komponen kostum.** Tanggal
    memakai `PilihTanggal` (`components/pilih-tanggal.tsx`) dengan kalender
    kostum `components/calendar.tsx`, turunan kalender shadcn dengan
    tampilan proyek; jam dan menit memakai `InputWaktu`
    (`components/input-waktu.tsx`), dengan aturan di `lib/waktu.ts`.
    Kalender shadcn murni sudah dihapus, dan ESLint menolak impornya serta
    input tanggal atau waktu bawaan browser di JSX. Halaman lama yang
    masih menulis input jam sendiri (form shift dan jadwal) diganti saat
    modulnya dimigrasikan; buat reservasi sudah memakai kedua komponen
    sejak `477f258` (pemilik proyek, 28 September 2026, `e43e000`).
23. **Spec e2e menjalankan setiap operasi yang diuji lewat UI.** Data yang
    menjadi bahan uji dibuat, diubah, dan dihapus lewat halaman yang diuji,
    agar tombol dan fungsi yang rusak ikut terlihat; tidak ada data yang
    disuntikkan diam-diam lewat API. API hanya membaca bukti, menyiapkan
    data milik modul lain (misalnya produk uji untuk pajak per produk), dan
    membersihkan sisa run yang gagal. Aturan ini menemukan form buat pajak
    lama yang menahan submit sampai prioritas diketik (pemilik proyek,
    1 Oktober 2026, `9586e3c`). Spec yang ditulis sebelumnya dan masih
    menyiapkan data uji lewat API disesuaikan saat spec itu disentuh
    (`referensi/utang-pengujian.md`).
24. **Rupiah ditampilkan lewat satu pemformat, `formatRupiah`
    (`lib/format.ts`), dengan batas pecahan yang eksplisit.** Batas
    pecahan bawaan `Intl` untuk IDR bergantung pada versi ICU runtime (0
    di Node 22, lebih dari 0 di Chromium), sehingga pemformat tanpa
    `maximumFractionDigits` memberi teks berbeda di server, di test, dan
    di browser untuk nilai pecahan. Halaman dan spec memakai
    `formatRupiah`, bukan `Intl.NumberFormat` sendiri; sembilan berkas
    yang masih memformat sendiri dipindah di `006d7f8`
    (pemilik proyek, 4 Oktober 2026, `4c9c4ed`).

25. **Warna utama dipakai lewat token, bukan heksadesimal.** Nilainya ada
    di `:root` `app/globals.css` (`--navy`, `--gading`, `--krem`,
    `--karamel`, `--sage`, dan peran `--permukaan`) dan dirujuk
    `@theme inline` sebagai `--color-*`, sehingga kelasnya `bg-navy`,
    `text-gading`, `border-karamel/20`, dan seterusnya. Kode baru tidak
    menulis `[#0A2947]` dan sejenisnya; mengubah satu warna berarti
    mengubah satu baris (pemilik proyek, 11 Oktober 2026, `584a2d8`,
    `ba28f25`).
26. **Tabel daftar memakai `DataTable`, dan tabel lain memakai `Table`
    dari `components/ui/table.tsx`.** Halaman tidak menulis `<table>`
    sendiri dan tidak membungkus tabel dengan panel berlatar. Aksi baris
    berada di menu titik tiga, dan kolom yang tidak muat pindah ke dialog
    rincian (pemilik proyek, 11 Oktober 2026, `93490bb`, `cc1092e`,
    `f44db05`, `9cd22e1`; keputusan TB1a sampai TB7a).
27. **Daftar dipindah ke paginasi server hanya bersama seluruh
    filternya, termasuk pencarian.** Filter tanpa padanan di server
    tidak disaring di klien atas halaman yang sedang tampil, karena
    hasilnya keliru diam-diam. Bila backend belum punya pencariannya,
    padanannya diminta ke backend, dan daftar tetap mode klien dengan
    pencarian yang berfungsi sampai keduanya dapat dipindah bersama.
    Pengecualian yang diputuskan: jurnal stok berhalaman di server tanpa
    kotak cari, karena tumbuh satu baris per bahan setiap penjualan
    (pemilik proyek, 21 Oktober 2026, `b03c276`; `kontrak/temuan.md`
    butir 150).
