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
| Keuangan | `0cfb3bd` (spec), `45187b6` | Selesai |
| Jadwal dan shift, termasuk pola roster dan monitoring absensi | `d9af531` (spec) | **Berikutnya** (lihat Pekerjaan berikutnya) |
| Gudang: dashboard, pengaturan, setup | - | Belum. Halaman stok gudang sudah dimigrasikan di modul inventaris (`580a1e1`), termasuk stock adjustment (`247cf2d`); `gudang/layout.tsx` dan `gudang/setup` masih memakai `apiClient`, dan layout memeriksa nama role Owner (baris 32, keputusan rancangan butir 2); pengguna gudang sudah ikut modul Pengguna (`7275d14`); jadwal gudang dijadwalkan di modul Jadwal dan shift |

Keputusan produk tiap modul tercatat di `keputusan.md`.

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul:

| Hal | Awal | Setelah keuangan `45187b6` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 54 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan |
| Kemunculan `_id` | - | 46 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id`. Perintahnya ikut menghitung komentar: naik 1 di `eef371a` dari komentar normalisasi di `features/sesi-booking/api.ts`. Turun 13 di `45187b6`: 12 dari data tiruan mutasi arus kas dan 1 dari daftar akun kas |
| `useAuthGuard()` berulang di halaman | 49 | 34 | Dihitung di `app/` saja, termasuk `app/dashboard/layout.tsx`, yang sudah memanggilnya untuk seluruh dashboard; pemanggilan di halaman karena itu berulang. Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, keempat halaman penjualan, dan buat reservasi) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | - | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | 4 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.088 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## Pekerjaan berikutnya: modul jadwal dan shift

Cakupan: jadwal outlet (`jadwal/` dan `jadwal/generate/`), jadwal gudang,
shift, dan pola roster, beserta komponennya di `components/jadwal/`,
`components/shift/`, dan `components/pola-roster/`: 18 berkas dengan total
4.138 baris. Tidak ada berkas di atas 700 baris.

Pemetaan awal (28 September 2026):

| Berkas | Baris | `apiClient` | `any` | `_id` | `queryKey` |
|---|---|---|---|---|---|
| `app/dashboard/gudang/jadwal/page.tsx` | 235 | 5 | 4 | 1 | 5 |
| `app/dashboard/outlet/jadwal/generate/page.tsx` | 222 | 5 | 5 | 1 | 5 |
| `app/dashboard/outlet/jadwal/page.tsx` | 310 | 8 | 5 | 5 | 8 |
| `app/dashboard/outlet/pola-roster/page.tsx` | 216 | 6 | 7 | 3 | 5 |
| `app/dashboard/outlet/shift/page.tsx` | 131 | 5 | 4 | 1 | 4 |
| `components/jadwal/form-jadwal-dialog.tsx` | 435 | 0 | 0 | 0 | 0 |
| `components/jadwal/generate/step-dua-preview.tsx` | 285 | 0 | 1 | 0 | 0 |
| `components/jadwal/generate/step-satu-form.tsx` | 398 | 0 | 0 | 0 | 0 |
| `components/jadwal/jadwal-grid.tsx` | 170 | 0 | 0 | 0 | 0 |
| `components/jadwal/jadwal-toolbar.tsx` | 84 | 0 | 0 | 0 | 0 |
| `components/jadwal/jadwal-utama.tsx` | 149 | 0 | 0 | 0 | 0 |
| `components/jadwal/shift-cell.tsx` | 53 | 0 | 0 | 0 | 0 |
| `components/pola-roster/pola-delete-dialog.tsx` | 77 | 0 | 0 | 0 | 0 |
| `components/pola-roster/pola-form-dialog.tsx` | 274 | 0 | 0 | 1 | 0 |
| `components/pola-roster/pola-utama.tsx` | 280 | 0 | 0 | 3 | 0 |
| `components/shift/shift-delete-dialog.tsx` | 76 | 0 | 0 | 0 | 0 |
| `components/shift/shift-form-dialog.tsx` | 393 | 0 | 0 | 0 | 0 |
| `components/shift/shift-utama.tsx` | 350 | 0 | 1 | 3 | 0 |

- Lapisan data hanya ada di kelima halaman `app/`; komponen di
  `components/` tidak memanggil `apiClient` maupun `useQuery`, dan
  menerima data dari halamannya.
- Endpoint yang terlibat: `/jadwalshift` (termasuk `bulk`), `/shift`,
  `/polaroster`, dan `/pengguna`. Route jadwal, shift, dan pola roster
  tanpa `checkPermission` (`kontrak/temuan.md` butir 5), halaman jadwal
  tanpa gate walau `/pengguna` mewajibkan `read-pengguna`
  (`kontrak/izin-halaman.md`), dan enam permission jadwal belum ada di
  seed (butir 4). `GET /shift` tanpa query string dijawab 500 (butir 8).
- `GET /pengguna` masih dipanggil halaman jadwal lama bersama
  `features/pengguna` (audit endpoint 28 September 2026).
- Edit pola roster menunggu backend (`test.fixme`, `pengujian.md`), dan
  pola roster memakai hapus permanen (keputusan Fase 0).
- Form shift dan form jadwal beralih ke `InputWaktu` dan `PilihTanggal`
  (keputusan K-TW3a dan rancangan butir 22). Error ESLint warisan di test
  integrasi jadwal dan pola roster dibereskan bersama modul ini (Utang
  kecil dari modul stock adjustment gudang).
- Spec yang ada: `tests/e2e/jadwal/pola-roster/crud-pola-roster.spec.ts`
  dan `tests/e2e/jadwal/shift/crud-shift.spec.ts`. Jadwal dan generate
  jadwal belum punya spec e2e.

Spec pembanding jadwal outlet, jadwal gudang, kelola manual, dan generate
jadwal selesai di `d9af531` (`tests/e2e/jadwal/jadwal/`), dengan fixture
di `tests/helpers/jadwal-uji.ts`. Jalur backend `jadwalshift` sudah
dipetakan (`kontrak/payload.md`, `kontrak/temuan.md` butir 62 sampai
66), dan keputusan J1a sampai J5b tercatat di `keputusan.md` (Modul
jadwal dan shift).

Cakupan diperluas atas permintaan pemilik proyek (29 September 2026):
seluruh bug, galat, dan cacat UI/UX di fitur jadwal, shift, pola roster,
dan monitoring absensi dibereskan di modul ini. Monitoring absensi di web
hanya `hooks/use-monitoring-absensi.ts` (`GET /absensi/monitoring` lewat
`apiClient` lama), yang dipakai
`components/pengguna/bento-pengguna-widget.tsx`.

Langkah berikutnya: inventaris utuh seluruh berkas jadwal, shift, pola
roster, dan monitoring absensi. Setiap berkas dibaca penuh, dan seluruh
temuan dilaporkan sekaligus beserta buktinya. Keputusan yang dibutuhkan
diajukan sekaligus, baru kemudian migrasi. Skenario J1a, J2a, dan J5b
ditambahkan ke spec di commit migrasi.

## Catatan dari modul keuangan

Modul keuangan selesai pada 28 September 2026: spec pembanding (`0cfb3bd`)
dan migrasi (`45187b6`). Tidak ada lagi halaman keuangan yang memakai
`apiClient`, dan tidak ada data tiruan.

- Lapisan data ada di `features/akun-kas` (daftar, buat, dan skema) dan
  `features/laporan` (laba rugi dan aturan periode di `periode.ts`);
  halamannya tetap di `app/` dengan tampilan lama.
- Ringkasan laba rugi meminta dua rentang per periode, berjalan dan
  pembanding (KU5a). Kartu ringkasan dipasang di `layout.tsx` dan meminta
  bulan kalender penuh serta `GET /akunkas`, sehingga pengguna tanpa
  `read-akunkas` melihat `-` di kartu saldo (KU2a,
  `kontrak/izin-halaman.md`).
- Mutasi arus kas menunggu endpoint mutasi kas dari backend
  (`kontrak/temuan.md` butir 61, keputusan KU1a).
- Setup tenant membuat akun kas bawaan "Kas Kecil (Laci)" `CASH-001` dan
  metode pembayaran "Tunai" yang bergantung padanya
  (`tenantService.createWithOwner`). Spec keuangan hanya menghapus akun
  uji yang dibuatnya sendiri.
- `AkunKasLama` dan `AkunKasRefLama` tinggal dipakai modul metode
  pembayaran.
- Keputusan pemilik proyek untuk modul ini ada di `keputusan.md` (Modul
  keuangan, KU1a sampai KU7a).

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
  `AkunKasLama` dan `AkunKasRefLama` (metode pembayaran), serta
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

### Utang kecil dari modul keuangan

- Daftar akun kas belum punya ubah maupun hapus, walau backend punya
  `PUT` dan `DELETE /akunkas/:id` (Lampiran A), dan tombol "Pindah Dana"
  nonaktif karena transfer antar akun belum ada.
- Ketiga halaman keuangan yang memuat data masih memanggil
  `useAuthGuard()`, karena halamannya tetap di `app/` dengan tampilan
  lama; pemanggilan itu dibuang bila halamannya dijadikan tipis.

### Utang kecil dari modul jadwal dan shift

- Halaman jadwal outlet, generate jadwal, dan jadwal gudang tetap tanpa
  gate, walau `GET /pengguna` mewajibkan `read-pengguna` (keputusan J3b).
  Pengguna tanpa izin itu hanya melihat "Gagal Memuat Data", karena
  galat pengguna ikut menentukan galat halaman. Disampaikan bersama
  laporan akhir modul, bersama permission jadwal yang belum ada di seed
  (`kontrak/temuan.md` butir 4).

### Utang kecil dari penyesuaian backend `f27f093`

- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
