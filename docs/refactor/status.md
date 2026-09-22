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
| Gudang: halaman stock adjustment | - | **Berikutnya** (lihat Pekerjaan berikutnya) |
| Penjualan dan pembayaran | - | Belum |
| Reservasi | - | Belum |
| Keuangan | - | Belum |
| Jadwal dan shift | - | Belum |
| Gudang: dashboard, pengaturan, setup | - | Belum. Halaman stok gudang sudah dimigrasikan di modul inventaris (`580a1e1`), kecuali stock adjustment yang belum punya halaman gudang (baris Berikutnya); `gudang/layout.tsx` dan `gudang/setup` masih memakai `apiClient`, dan layout memeriksa nama role Owner (baris 32, keputusan rancangan butir 2); pengguna gudang sudah ikut modul Pengguna (`7275d14`); jadwal gudang dijadwalkan di modul Jadwal dan shift |

Keputusan produk tiap modul tercatat di `keputusan.md`.

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul:

| Hal | Awal | Setelah modul inventaris `580a1e1` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 88 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan |
| Kemunculan `_id` | - | 99 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id` |
| `useAuthGuard()` berulang di halaman | 49 | 41 | Dihitung di `app/` saja, termasuk `app/dashboard/layout.tsx`, yang sudah memanggilnya untuk seluruh dashboard; pemanggilan di halaman karena itu berulang. Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | - | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | 7 | Sempat 8 karena berkas lain tumbuh; kembali 7 setelah form produk disatukan. Berkurang saat modulnya dimigrasikan |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## Pekerjaan berikutnya: halaman stock adjustment gudang

Sejak `a5e9cec`, daftar stock adjustment di ruang outlet hanya menampilkan
lokasi Outlet (keputusan pemilik proyek, 22 September 2026), sehingga
adjustment hasil opname gudang tidak tampil di mana pun di web. Ruang gudang
juga tidak menautkan ke sana: tombol setelah setujui di detail stock opname
gudang menuju jurnal stok gudang (`tautanSetelahSetuju` di `TEKS.gudang`,
`features/stock-opname/halaman-detail-stock-opname.tsx`). Pemilik proyek
menetapkan halaman ini dikerjakan di putaran berikutnya, sebelum modul
penjualan dan pembayaran.

- Daftar di ruang gudang menampilkan adjustment seluruh lokasi bertipe
  Gudang milik tenant, tanpa cakupan per gudang (`keputusan.md`, Model
  bisnis MVP). Backend menyaring `locationID` tetapi tidak mengenal tipe
  lokasi, sehingga tipe disaring di klien.
- Halaman daftar dan detail outlet
  (`app/dashboard/outlet/inventaris/stockAdjustment/`) dibandingkan dengan
  `diff` sebelum memutuskan disatukan lewat `ruang` atau hanya berbagi
  `features/stock-adjustment` (`arsitektur.md`, Kapan halaman disatukan).
- `susunSumber` di `features/stock-adjustment/tampilan.ts` sudah menautkan
  sumber ke ruang sesuai tipe lokasi. Tautan dari detail stock opname
  gudang ke adjustment-nya ditambahkan di `TEKS.gudang`.
- Entri `IZIN_HALAMAN` dan menu sidebar gudang ditambahkan, dengan gate
  yang mengikuti endpoint halamannya.
- Pekerjaan ini menyentuh detail stock opname, sehingga empat error ESLint
  warisan di `features/stock-opname` (Utang kecil dari penyesuaian backend
  `f27f093`, di bawah) dibereskan di commit yang sama.

Pemetaan awal belum diambil. Langkah pertama sesi berikutnya:

```bash
grep -rnE 'stockAdjustment|tautanSetelahSetuju|susunSumber' features app/dashboard components/app-sidebar.tsx lib/auth/permissions.ts --include='*.ts' --include='*.tsx' | cut -c1-130
```

Sesudah itu: modul penjualan dan pembayaran (tabel Fase 3). Halaman buat
penjualan memakai daftar produk, dan stok produk yang dikirim backend tidak
terhubung ke stok outlet mana pun (`kontrak/temuan.md` butir 37).

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
- `components/calendar.tsx` (240 baris, 2 `any`) belum dibereskan; periksa
  pemakainya sebelum modul yang memakainya dimigrasikan.
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

### Utang kecil dari penyesuaian backend `f27f093`

- Empat error ESLint warisan di `features/stock-opname`:
  `react-hooks/preserve-manual-memoization` di halaman daftar (sekitar baris
  129), `react-hooks/set-state-in-effect` di halaman detail (sekitar baris
  163, efek yang mengisi isian dari data server, bertentangan dengan
  keputusan rancangan butir 8), dan dua `react/no-unescaped-entities`
  (sekitar baris 388). Jumlahnya sama dengan sebelum `2b3b52d`. Bereskan
  saat halaman detail stock opname disentuh lagi.
- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
