# Status Refactor Frontend Web

Sifat perubahan: **Sering**, setiap modul selesai.

Keadaan pekerjaan refactor: fase yang sudah selesai, metrik, dan pekerjaan
berikutnya. Diperbarui setiap kali satu modul selesai (`docs/README.md`, Cara
memperbarui dokumentasi).

## Fase yang sudah selesai

### Fase 0 — Perbaikan bug dan konfigurasi test
Commit `751f4db` sampai `06857e1`. Pemisahan runner Playwright dan Vitest,
perbaikan auth, produk, reservasi, jadwal, pola roster, dan pengguna.

Keputusan produk yang dihasilkan tercatat di `keputusan.md` (Fase 0).

### Fase 1 — Audit kontrak API
Commit `668951d`, `7f05c24`. Hasilnya kontrak API berbasis bukti: 246 route
backend, bentuk respons tiap endpoint, aturan payload, kebutuhan izin per
halaman, dan daftar ketidaksesuaian. Awalnya satu berkas `docs/kontrak-api.md`
(1226 baris saat dibuat); sejak 20 September 2026 dipecah di `docs/kontrak/`
(cara membacanya di `docs/kontrak/README.md`).

### Fase 2 — Fondasi

| Tahap | Commit | Isi |
|---|---|---|
| 2.1 | `aab26f3` | `lib/api/endpoints.ts`, fallback `/bahan-baku` dibuang |
| 2.2 | `71aa3fc` | `ApiError`, normalisasi envelope dan `_id` ke `id` |
| 2.3 | `7070e14` | `types/api.ts`, tipe bahan baku dari kontrak |
| 2.4a | `ecceb6e` | Token di memori, pemulihan sesi lewat cookie |
| 2.4b | `421a582` | `ApiError` dari respons fetch, penanganan 403 dan 429 |
| 2.5 | `4336fc1` | `lib/auth/permissions.ts`, gate menu dari izin endpoint |
| 2.6 | `c8fb132` | Kunci cache hierarkis di 72 berkas |
| 2.7 | ditunda | Desain token (warna, tipografi, spasi). Sengaja dipisah dari refactor arsitektur |
| 2.8 | `059814d` | Modul percontohan bahan baku |

### Fase 3 — Migrasi per modul (sedang berjalan)

| Modul | Commit | Status |
|---|---|---|
| Pengguna | `7275d14` | Selesai |
| Role | `e17c572` | Selesai |
| Produk dan kategori | `53414dd`, `e0366c1`, `06f8fd8` | Selesai |
| Inventaris: stock adjustment | `a52afbf` | Selesai |
| Inventaris: jurnal stok | `98735d4` | Selesai |
| Bahan baku: perbaikan dialog hapus | `50e8815` | Selesai |
| Inventaris: stok dan inventaris gudang | `ad590f9` | Selesai |
| Inventaris: stock opname | `fc3f220` | Selesai |
| Cakupan lokasi owner dan staf: jurnal stok dan stok outlet | `6ca6da8` | Selesai |
| Penyesuaian backend `f27f093`: stock adjustment, gate stok, simpan hitungan opname, dan filter lokasi jurnal stok | `2b3b52d` | Selesai |
| Inventaris: pengajuan stok, lalu transfer, pengiriman, dan penerimaan | `59e10a1` (daftar pengajuan), `08d0a73` (arah lokasi), `90eb935` (detail, edit, buat), `dec9d01` (perbaikan terima penerimaan), `ad77a14` (transfer dan pengiriman gudang), `580a1e1` (penerimaan outlet) | Selesai |
| Izin lintas outlet: cakupan outlet dan outlet peminta pengajuan | `085ec78` | Selesai |
| Stock adjustment outlet hanya lokasi Outlet | `a5e9cec`, `fe5dd9c` (gate `read-location`) | Selesai |
| Gudang: cakupan per gudang | - | Dibatalkan (`keputusan.md`, Model bisnis MVP) |
| Gudang: halaman stock adjustment | `247cf2d` | Selesai |
| Perbaikan spec alur pengajuan stok | `8d62c56` | Selesai |
| Penjualan dan pembayaran | `e8c81b1` (fondasi), `c9640ce` (daftar), `69a5d5e` (detail), `8738752` (pembayaran), `f33ffa6` (buat) | Selesai |
| Spec login tanpa respons sukses palsu | `5a3deea` | Selesai |
| Spec master data reservasi | `a2adc70` (tipe aset), `4d3467f` (aset), `adbee4c` dan `04830b7` (tarif) | Selesai |
| Reservasi: tipe aset | `074e98c` | Selesai |
| Reservasi: aset | `d3ae182` | Selesai |
| Reservasi: tarif | `365553f` | Selesai |
| Reservasi: daftar reservasi | `27749fe` (spec), `eef371a` | Selesai |
| Komponen tanggal dan waktu (lintas modul) | `e43e000` | Selesai |
| Reservasi: buat reservasi | `652d669` (spec), `477f258` | Selesai |
| Keuangan | `0cfb3bd` (spec) | **Berikutnya** (lihat Pekerjaan berikutnya) |
| Jadwal dan shift | - | Belum |
| Gudang: dashboard, pengaturan, setup | - | Belum. Halaman stok gudang sudah dimigrasikan di modul inventaris (`580a1e1`), termasuk stock adjustment (`247cf2d`); `gudang/layout.tsx` dan `gudang/setup` masih memakai `apiClient`, dan layout memeriksa nama role Owner (baris 32, keputusan rancangan butir 2); pengguna gudang sudah ikut modul Pengguna (`7275d14`); jadwal gudang dijadwalkan di modul Jadwal dan shift |

Keputusan produk tiap modul tercatat di `keputusan.md`.

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul:

| Hal | Awal | Setelah buat reservasi `477f258` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 56 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan |
| Kemunculan `_id` | - | 59 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id`. Perintahnya ikut menghitung komentar: naik 1 di `eef371a` dari komentar normalisasi di `features/sesi-booking/api.ts` |
| `useAuthGuard()` berulang di halaman | 49 | 34 | Dihitung di `app/` saja, termasuk `app/dashboard/layout.tsx`, yang sudah memanggilnya untuk seluruh dashboard; pemanggilan di halaman karena itu berulang. Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, keempat halaman penjualan, dan buat reservasi) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | - | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | 4 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.088 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## Pekerjaan berikutnya: modul keuangan

Cakupan: `app/dashboard/outlet/keuangan/`, tujuh berkas dengan total 1.377
baris: akun kas (daftar dan buat), mutasi arus kas, ringkasan laba rugi,
dua komponen bersama, dan layout. Tidak ada berkas di atas 700 baris.

Pemetaan awal (28 September 2026):

| Berkas | Baris | `apiClient` | `any` | `_id` | `queryKey` |
|---|---|---|---|---|---|
| `app/dashboard/outlet/keuangan/akunkas/buatAkunKas/page.tsx` | 391 | 2 | 1 | 0 | 2 |
| `app/dashboard/outlet/keuangan/akunkas/page.tsx` | 188 | 2 | 0 | 1 | 2 |
| `app/dashboard/outlet/keuangan/components/keuangan-nav-tabs.tsx` | 56 | 0 | 0 | 0 | 0 |
| `app/dashboard/outlet/keuangan/components/keuangan-summary-cards.tsx` | 124 | 3 | 2 | 0 | 4 |
| `app/dashboard/outlet/keuangan/layout.tsx` | 26 | 0 | 0 | 0 | 0 |
| `app/dashboard/outlet/keuangan/mutasiArusKas/page.tsx` | 298 | 0 | 0 | 12 | 0 |
| `app/dashboard/outlet/keuangan/ringkasanLabaRugi/page.tsx` | 294 | 2 | 2 | 0 | 3 |

- Sumber data (dipetakan 28 September 2026): daftar akun kas dan kartu
  Saldo Kas Total memanggil `GET /akunkas`, buat akun kas `POST /akunkas`,
  dan ringkasan laba rugi serta tiga kartu laba memanggil
  `GET /laporan/laba-rugi` dengan query `periode` (harian, mingguan, atau
  bulanan), `startDate`, dan `endDate`. Kartu ringkasan dipasang di
  `layout.tsx`, sehingga tampil di setiap halaman keuangan. Daftar akun
  kas dan kartu ringkasan menyimpan data di bawah kunci akar
  `akunKas.semua` (keputusan rancangan butir 3), dan kunci laba rugi
  menambahkan `startDate` dan `endDate` di luar objek filter.
- Mutasi arus kas tidak punya sumber data: seluruh isinya data tiruan di
  dalam kode, dan backend tidak punya model maupun route mutasi kas
  (keputusan KU1a, `kontrak/temuan.md` butir 61). Persentase "vs periode
  sebelumnya" di ringkasan laba
  rugi dihitung dengan `Math.random()` (KU5a), dan kartu ringkasan
  menelan galat menjadi Rp0 (KU2a).
- `features/akun-kas` sudah ada dari modul penjualan (keputusan K1a).
  `AkunKasLama` masih dipakai tiga halaman metode pembayaran, dan
  `AkunKasRefLama` dipakai `types/metodePembayaran.ts`, sehingga keduanya
  tetap ada sampai modul metode pembayaran dimigrasikan.
- Setup tenant membuat akun kas bawaan "Kas Kecil (Laci)" `CASH-001` dan
  metode pembayaran "Tunai" yang bergantung padanya
  (`tenantService.createWithOwner`). Spec keuangan hanya menghapus akun
  uji yang dibuatnya sendiri.
- Spec pembanding `tests/e2e/keuangan/keuangan.spec.ts` (`0cfb3bd`) lolos
  terhadap kode lama: daftar dan buat akun kas, laba rugi harian dan
  mingguan, serta kartu ringkasan.

Langkah berikutnya: migrasi modul keuangan. `features/akun-kas` mendapat
`buat` dan hook mutation; folder `laporan` baru di `features/` untuk laba rugi,
dengan kunci berisi seluruh filter dan permintaan periode sebelumnya
(KU5a); skema buat akun kas mempertahankan `z.coerce` tanpa `.default()`
(KU3a); kartu ringkasan menampilkan `-` saat gagal (KU2a); dan mutasi arus
kas tanpa data tiruan (KU1a). Skenario untuk ketiga perubahan perilaku itu
ditambahkan ke spec keuangan.

## Catatan dari modul reservasi

Modul reservasi selesai pada 28 September 2026: tipe aset (`074e98c`),
aset (`d3ae182`), tarif (`365553f`), daftar reservasi (`27749fe`,
`eef371a`), komponen tanggal dan waktu (`e43e000`), dan buat reservasi
(`652d669`, `477f258`). Tidak ada lagi halaman reservasi yang memakai
`apiClient`, dan tidak ada berkas reservasi di atas 700 baris.

- Booking dari web dibuat lewat jalur batch dan selalu membuat penjualan
  berjenis `booking` berstatus FINAL; `simpanDraft` diabaikan, sehingga
  ubah dan hapus sesi booking selalu ditolak. Penjualan FINAL tidak dapat
  di-void langsung, sehingga web tidak punya jalur batal booking
  (`kontrak/temuan.md` butir 56); booking uji dibatalkan lewat bayar,
  hapus pembayaran, lalu void penjualannya (keputusan R2c dan R4b). Void
  penjualan membatalkan sesi booking-nya (`penjualanService.update`).
- Tarif dipilih otomatis oleh backend menurut tipe aset, hari, jam, dan
  prioritas, dan status aset "digunakan" dihitung dari booking Aktif yang
  sedang berjalan.
- Kontrak sesi booking dikoreksi pada 27 September 2026: validator dan dua
  jalur `POST /sesibooking` di `payload.md`, serta bentuk respons daftar
  di `endpoint.md` bagian 3.3. Route sesi booking per id tidak dipakai
  web, sehingga hanya tercatat di Lampiran A.
- Void penjualan tidak membersihkan cache daftar booking per tanggal
  (butir 57). Satu skenario daftar reservasi menunggu backend (`test.fixme`,
  keputusan R3a), dan slot booking uji di spec buat reservasi digeser
  menurut menit dan urutan pemanggilan agar tidak tertahan daftar yang
  basi.
- Daftar sesi booking menulis status Selesai saat dibaca (butir 58), dan
  sekitar 930 baris kode lama dikomentari di service sesi booking (butir
  59). Temuan master data reservasi tercatat di butir 51 sampai 55.
  Calon temuan yang belum dibuktikan dari kode: keberadaan tipe aset tidak
  diperiksa saat aset dibuat, dan `voidPenjualan` tidak terpakai.
- Data uji reservasi bernama tetap dan dibuat sekali: tipe aset, aset,
  aset berstatus perbaikan, tarif, pelanggan, serta diskon item dan diskon
  global uji. Setiap run spec daftar dan buat reservasi meninggalkan
  booking Batal dan penjualan booking VOID.
- Keputusan pemilik proyek untuk modul ini ada di `keputusan.md` (Modul
  reservasi, R1a sampai R9b, serta T1a sampai T4a untuk tarif).

## Catatan dari modul inventaris

Modul inventaris (24 halaman, sekitar 8.900 baris) dikerjakan dalam enam
submodul, masing-masing dengan spec pembanding, suite penuh, dan commit
sendiri:

| No | Submodul | Baris | Commit |
|---|---|---|---|
| 1 | Stock adjustment | 431 | `a52afbf` |
| 2 | Jurnal stok | 617 | `98735d4` |
| 3 | Stok dan inventaris gudang | 1.094 | `ad590f9` |
| 4 | Stock opname | 2.544 | `fc3f220` |
| 5 | Pengajuan stok | 2.298 | `59e10a1`, `08d0a73`, `90eb935` |
| 6 | Transfer, pengiriman, penerimaan | 1.950 | `dec9d01`, `ad77a14`, `580a1e1` |

Angka `diff` antarhalaman tidak cukup untuk memutuskan penyatuan. Jurnal
stok (341 dari 617 baris berbeda, hampir seluruhnya teks), stock opname, dan
daftar pengajuan stok (161 dari 474) disatukan, sedangkan stok dan
inventaris gudang, detail pengajuan, serta seluruh halaman surat jalan hanya
berbagi lapisan `features/`. Baca isi perbedaannya lewat `diff` tanpa baris
`className` sebelum memutuskan.

Yang masih berlaku:

- `features/inventaris` memuat seluruh hook lokasi, stok, dan cakupan
  (`arsitektur.md`); jangan membuat hook serupa (keputusan rancangan butir
  12).
- `kontrak/izin-halaman.md` sudah diselaraskan dengan `IZIN_HALAMAN` untuk
  halaman yang disebut kalimat pembukanya; baris lain masih mencerminkan
  keadaan sebelum Fase 2 dan diperbarui saat halamannya dimigrasikan.
- `kontrak/temuan.md` butir 10: operasi tulis tanpa validator di modul lain
  masih perlu ditelusuri sampai ke service, termasuk validator yang
  dipanggil dari service (butir 22). Stock opname, pengajuan stok, transfer
  stok, dan inventory sudah diperiksa.
- Belum diverifikasi: `inventoryService` (sekitar baris 106 di backend
  `f27f093`) membangun `new RegExp(search, "i")` langsung dari masukan
  pengguna. Dugaannya, karakter seperti `(` membuat pencarian stok dijawab
  500. Buktikan lewat e2e atau trace sebelum dilaporkan ke backend atau
  ditangani di frontend.
- Belum diverifikasi: `kontrak/payload.md` mencatat `PUT /bahanbaku/:id`
  memakai `locationID` untuk injeksi stok awal, tetapi
  `bahanBakuService.update` di backend `9cd1439` (baris 124 sampai 140)
  hanya menjalankan `$set` atas body. Telusuri route dan controller-nya
  sebelum kontrak dikoreksi.
- `components/calendar.tsx` (240 baris) adalah kalender kostum standar
  sejak `e43e000` (keputusan rancangan butir 22) dan dipakai lewat
  `PilihTanggal`; kedua `any`-nya belum dibereskan.
- `app/dashboard/outlet/inventaris/components/` berisi
  `bahanBakuCombobox.tsx` (dipakai `features/produk/form-produk.tsx`, lihat
  utang modul produk) dan `inventaris-nav-tabs.tsx`.
- Tambah barang di inventaris gudang hanya menawarkan master bahan baku.
  Barang inventory non-bahan (`barangInventoryID`, `/baranginventory`)
  belum dipakai web sama sekali; master data tetap bersumber dari outlet
  (`keputusan.md`, Model bisnis MVP). Dirapikan di modul gudang.
- Di ruang gudang, `gudang/layout.tsx`, `gudang/setup`, dan `gudang/jadwal`
  masih memakai `apiClient`; ketiganya bukan halaman stok (modul Gudang dan
  modul Jadwal dan shift).
- Backend lokal: branch `ridho` `9cd1439`, yang menggabungkan origin/yoga
  `f0b7157` (21 September 2026, belum di-push). Berkas transfer stok tidak
  berubah sejak `f27f093`; `fc159bd` memasang validator allowlist di route
  inventory, dan spec stok lolos terhadapnya.
- Pengajuan stok:
  - Aturan status per izin di `pengajuanStokService.getAll` (baris 30
    sampai 47) dicerminkan di `features/pengajuan-stok/izin.ts`; keduanya
    diperbarui bersama.
  - `jenisPengajuan` `PENGIRIMAN` tidak dipakai backend maupun frontend:
    semua pengajuan adalah permintaan dari outlet ke gudang.
  - Strategi data uji spec alur (keputusan pemilik proyek, pilihan A): buat,
    edit, ajukan, lalu tolak, dengan dokumen baru per run yang berakhir
    REJECTED; setujui dan buat surat jalan diuji jalur gagalnya saja dengan
    `page.route`, karena keduanya meninggalkan dokumen permanen.
  - Outlet peminta diputuskan pemilik proyek pada 22 September 2026
    (`085ec78`): pengguna tanpa izin lintas outlet terkunci ke outlet
    tenant dan tidak dapat merevisi draf outlet lain; pemegang izin lintas
    outlet memilih dari seluruh outlet (`keputusan.md`, submodul pengajuan
    stok). Izin itu menunggu backend (`kontrak/temuan.md` butir 39).
  - Usulan tertunda: daftar outlet tidak menampilkan outlet peminta,
    sehingga pemegang izin lintas outlet di pilihan "Semua Outlet" tidak
    dapat membedakan outlet pengaju. Relevan begitu tenant punya lebih dari
    satu outlet.

## Utang kecil yang tertunda

### Utang kecil dari modul produk

- Dialog hapus di halaman daftar produk masih tertutup saat hapus gagal
  (perilaku lama dipertahankan di `53414dd`), bertentangan dengan keputusan
  Fase 0. Samakan dengan halaman kategori: `preventDefault`, tertutup hanya
  saat berhasil, tetap terbuka saat gagal.
- Skenario 4d di spec produk membuka pemilih bahan baku dengan
  `getByRole("combobox").nth(1)`, bertentangan dengan catatan Playwright di
  `pengujian.md`. Ganti dengan tombol berteks "Pilih bahan..." saat spec produk
  disentuh lagi.
- Spec produk memakai nama produk tetap. Satu kegagalan sebelum cleanup
  membuat run berikutnya gagal karena nama duplikat, dan hal itu terjadi pada
  modul ini. Pakai akhiran unik per run seperti spec kategori.
- `features/produk/form-produk.tsx` mengimpor `BahanBakuCombobox` dari
  `app/dashboard/outlet/inventaris/components/`, sehingga `features/`
  bergantung pada `app/`. Pindahkan komponen itu ke `features/bahan-baku`
  atau `components/` saat modul produk atau bahan baku disentuh lagi; modul
  inventaris selesai tanpa menyentuhnya.

### Utang kecil dari modul stock adjustment gudang

- 10 error ESLint `@typescript-eslint/no-explicit-any` warisan di luar
  berkas modul: integration
  jadwal, pengguna, dan pola roster, `tests/helpers/storage.ts`,
  `tests/unit/lib/decodeToken.test.ts`, dan `components/app-sidebar.tsx`
  baris 368. Bereskan saat berkasnya dimigrasikan; `storage.ts` sendiri
  sudah tidak relevan (`pengujian.md`). Mengganti `any` di sidebar dicoba
  dan dikembalikan, karena tipe hilirnya ikut berubah (`cara-kerja.md`).
- Detail stock opname tidak memeriksa tipe lokasi terhadap ruang, sehingga
  dokumen gudang yang dibuka lewat URL ruang outlet tetap tampil. Pola
  penjaganya sudah ada di `features/stock-adjustment/ruang.ts`
  (`TIPE_LOKASI_RUANG`). Bereskan saat halaman stock opname disentuh lagi.

### Utang kecil dari modul penjualan dan pembayaran

- Delapan tipe berakhiran `Lama` masih dipakai halaman yang belum
  dimigrasikan lewat alias impor (`keputusan.md` butir 19): `PelangganLama`
  (halaman pelanggan), `DiskonLama` (halaman diskon), `PajakLama`,
  `ProdukPajakRelasiLama`, dan `PajakDariProdukLama` (pengaturan pajak),
  `AkunKasLama` dan `AkunKasRefLama` (keuangan dan metode pembayaran), serta
  `MetodePembayaranLama` (pengaturan metode pembayaran). Masing-masing
  dihapus di commit migrasi modul pemiliknya. Sisanya dihitung dengan
  `grep -rhoE 'export interface [A-Za-z]+Lama\b' types | wc -l` (8 per
  `f33ffa6`).
- `features/penjualan/halaman-buat-penjualan.tsx` masih 1.088 baris:
  migrasi memindahkan lapisan data dan membuang `any`, tetapi tidak memecah
  komponennya. Pisahkan pemilih pelanggan, pemilih diskon, dan pratinjau
  total saat halaman itu disentuh lagi.
- Cakupan outlet daftar penjualan (K11b) dan `locationID` buat penjualan
  (K13a) hanya berlaku bagi pemegang `read-location`; pengguna lain melihat
  seluruh penjualan tenant dan tidak mengirim lokasi. Halaman buat belum
  punya pemilih outlet bagi pemegang izin lintas outlet. Keduanya wajib
  ditutup sebelum multi-outlet (`kontrak/temuan.md` butir 48 dan 49).
- Tiga `test.fixme` di spec alur penjualan menunggu backend: dua untuk
  cache daftar jurnal (`kontrak/temuan.md` butir 46) dan satu untuk stok
  produk (butir 37).
- Filter tanggal daftar penjualan tidak dapat dikosongkan langsung,
  karena `PilihTanggal` tidak punya tombol kosongkan; filter dikosongkan
  lewat reset filter.

### Utang kecil dari modul reservasi

- Sebutan di pesan form tipe aset berbeda: "Kategori Aset" di halaman
  buat dan "Tipe Aset" di halaman edit. Dipertahankan di `074e98c` karena
  teks yang dilihat pengguna; penyeragamannya menunggu keputusan pemilik
  proyek.
- Halaman buat dan edit tarif masih berbeda tampilan: `<select>` bawaan
  dan harga polos di buat, Radix Select dan harga berformat ribuan di
  edit. Penyatuan ke satu form ditunda (keputusan T1a).
- Form shift (`components/shift/shift-form-dialog.tsx`) dan form jadwal
  masih menulis input jam dan tanggal sendiri; diganti `InputWaktu` dan
  `PilihTanggal` bersama modul jadwal (keputusan K-TW3a).

### Utang kecil dari penyesuaian backend `f27f093`

- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
