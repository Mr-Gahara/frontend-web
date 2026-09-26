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
| Reservasi | - | **Berikutnya** (lihat Pekerjaan berikutnya) |
| Keuangan | - | Belum |
| Jadwal dan shift | - | Belum |
| Gudang: dashboard, pengaturan, setup | - | Belum. Halaman stok gudang sudah dimigrasikan di modul inventaris (`580a1e1`), termasuk stock adjustment (`247cf2d`); `gudang/layout.tsx` dan `gudang/setup` masih memakai `apiClient`, dan layout memeriksa nama role Owner (baris 32, keputusan rancangan butir 2); pengguna gudang sudah ikut modul Pengguna (`7275d14`); jadwal gudang dijadwalkan di modul Jadwal dan shift |

Keputusan produk tiap modul tercatat di `keputusan.md`.

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul:

| Hal | Awal | Setelah modul penjualan `f33ffa6` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 71 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan |
| Kemunculan `_id` | - | 78 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id` |
| `useAuthGuard()` berulang di halaman | 49 | 35 | Dihitung di `app/` saja, termasuk `app/dashboard/layout.tsx`, yang sudah memanggilnya untuk seluruh dashboard; pemanggilan di halaman karena itu berulang. Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, dan keempat halaman penjualan) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | - | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | 7 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris (Utang kecil dari modul penjualan dan pembayaran). Berkurang saat modulnya dimigrasikan atau dipecah |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## Pekerjaan berikutnya: modul reservasi

Cakupan (pemilik proyek, 26 September 2026): seluruh halaman reservasi dan
sesi booking beserta master datanya, yaitu aset, tipe aset, dan tarif,
termasuk hubungannya dengan penjualan. Halamannya ada di
`app/dashboard/outlet/reservasi/`: daftar dan buat reservasi, serta daftar,
buat, dan edit untuk aset, tarif, dan tipe aset, beserta
`app/dashboard/outlet/reservasi/layout.tsx` dan
`app/dashboard/outlet/reservasi/components/reservasi-nav-tabs.tsx`.

- Void penjualan membatalkan sesi booking-nya (`penjualanService.update`),
  dan pembuatan booking membuat penjualan berjenis `booking`. Spec alurnya
  harus membuktikan kedua arah itu, bukan hanya CRUD master data.
- Spec pembanding yang sudah ada hanya untuk master data:
  `tests/e2e/reservasi/aset/crud-aset.spec.ts`,
  `tests/e2e/reservasi/tarif/crud-tarif.spec.ts`, dan
  `tests/e2e/reservasi/tipeAset/crud-tipeAset.spec.ts`. Ketiganya membawa
  error ESLint `any` warisan (Utang kecil dari modul stock adjustment
  gudang). Daftar dan buat reservasi belum punya spec.
- Buat reservasi mengisi kunci `pelanggan.semua` dan
  `diskon.daftar({ status: "Aktif" })` dengan data mentah. Migrasinya
  memakai `features/pelanggan` dan `features/diskon` (keputusan rancangan
  butir 12), bukan membuat hook baru.
- Kontrak sesi booking, aset, tipe aset, dan tarif belum pernah
  diverifikasi terhadap kode. Telusuri route, validator, service, dan
  mapper seperti modul penjualan; sebagian endpointnya tanpa
  `checkPermission` (`kontrak/temuan.md` butir 5).

Pemetaan awal belum diambil. Langkah pertama sesi berikutnya:

```bash
find app/dashboard/outlet/reservasi -name '*.tsx' | xargs wc -l | sort -rn
grep -rnE 'apiClient|: any|_id|queryKey' app/dashboard/outlet/reservasi --include='*.tsx' | cut -c1-130
```

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

### Utang kecil dari modul stock adjustment gudang

- 21 error ESLint `@typescript-eslint/no-explicit-any` warisan di luar
  berkas modul: spec reservasi (aset, tarif, tipe aset), login, integration
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
- `features/penjualan/halaman-buat-penjualan.tsx` masih 1.127 baris:
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

### Utang kecil dari penyesuaian backend `f27f093`

- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
