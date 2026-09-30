# Arsitektur dan Langkah Migrasi

Sifat perubahan: **Sering** untuk daftar `features/` (setiap modul); bagian lain **jarang**.

Konteks proyek, fondasi yang wajib dipakai setiap modul, daftar `features/`,
dan urutan migrasi satu modul.

## Konteks proyek

- **Repo**: `~/Documents/frontend-web` (Next.js 16.2, TypeScript, Tailwind v4, shadcn/Radix, TanStack Query, React Hook Form + Zod)
- **Backend**: `~/Documents/backend-js` (Node.js/Express/MongoDB, port 4000). Hanya dibaca, tidak diubah dari sisi frontend.
- **Produk**: Tachyon POS, SaaS POS multi-tenant untuk coffeeshop.
- **Dua frontend berbagi satu backend**: Flutter (mobile) dan Next.js (web ini).
- **Dua ruang kerja**: outlet (POS, keuangan, inventaris, reservasi, jadwal) dan gudang (WMS).
- **Model MVP**: satu tenant satu outlet dan satu gudang; pengguna hanya terikat ke tenant, dan tugas outlet atau gudang dibedakan lewat role dan permission (`keputusan.md`, Model bisnis MVP).

### Struktur direktori

| Direktori | Isi |
|---|---|
| `app/` | Rute Next.js. Idealnya tipis: tata letak dan interaksi saja |
| `features/<modul>/` | Api, hooks, schema, komponen halaman dan form bersama, serta fungsi murni per modul |
| `components/` | Komponen UI yang dipakai lintas modul, termasuk shadcn di `components/ui/` |
| `lib/` | Fondasi: `api/`, `auth/`, `queryKeys.ts`, `apiClient.ts`, `decodeToken.ts` |
| `types/` | Tipe respons dan payload, diturunkan dari kontrak |
| `tests/e2e/` | Playwright, memakai backend sungguhan; `page.route` hanya untuk jalur gagal (`pengujian.md`, Catatan Playwright) |
| `tests/unit/` | Vitest untuk fondasi, hook, dan fungsi murni di `features/` |
| `docs/` | `README.md` (titik masuk), `refactor/`, dan `kontrak/` |
| `scripts/` | Alat pengembangan; `scripts/dokumen/` memeriksa dokumentasi (`npm run docs:periksa`, `npm run docs:dampak`) |

### Konvensi penamaan dan bahasa

- **Komentar kode, pesan commit, dan dokumentasi**: Bahasa Indonesia.
- **Identifier domain** mengikuti backend apa adanya: `namaBahan`, `roleID`,
  `stokMinimum`, `aksesType`. Jangan diterjemahkan.
- **Fungsi dan variabel baru di `features/`**: Bahasa Indonesia.
  - Api: `daftar`, `detail`, `buat`, `perbarui`, `hapus`
  - Hook: `useDaftarX`, `useX`, `useBuatX`, `usePerbaruiX`, `useSimpanX`, `useHapusX`
  - Helper: `bolehBukaHalaman`, `pesanError`, `tandaiKeluar`, `akhiriSesi`
- **Komponen halaman bersama**: `halaman-<modul>.tsx`, diekspor sebagai
  `Halaman<Modul>`.
- **Komponen form bersama** untuk mode buat dan edit: `form-<modul>.tsx`,
  misalnya `form-role.tsx` dan `form-produk.tsx` (diekspor sebagai `FormProduk`).
- **Tanpa emoji atau simbol dekoratif** di kode maupun dokumen.

### Komponen per modul

Selain `components/ui/` (shadcn), ada komponen khusus modul yang dipakai
halaman: `components/pengguna/`,
dan lainnya. Ada juga komponen di dalam folder rute, misalnya
`app/dashboard/outlet/inventaris/components/`, `keuangan/components/`, dan
`reservasi/components/`. Saat memigrasikan sebuah modul, periksa juga
komponennya, karena pola `any` dan `_id` sering bersembunyi di sana.

### Autentikasi

Dua lapis token:

- **Token A (akun SaaS)**: login email dan password, endpoint `/akun/auth/login`.
- **Token C (pengguna)**: login PIN, endpoint `/pengguna/pin-login` dengan `loginType: "web"`.

Keduanya hanya hidup di memori (`lib/auth/session.ts`), dipulihkan lewat cookie
refresh httpOnly saat aplikasi dimuat. Backend hanya mengizinkan **satu sesi web
per pengguna**: login PIN baru mencabut sesi sebelumnya.

## Fondasi yang sudah tersedia

Seluruh modul baru wajib memakai lapisan ini. Jangan memanggil `apiClient`
langsung dari halaman.

**Status transisi**: mayoritas halaman yang belum dimigrasikan masih memanggil
`apiClient` secara langsung, dan itu memang keadaan yang diharapkan.
`lib/api/client.ts` dibangun sebagai pembungkus di atasnya, bukan pengganti,
agar migrasi dapat berjalan per modul tanpa memecahkan halaman lain. Jangan
menyapu seluruh pemakaian `apiClient` sekaligus; ganti bersama modulnya.

**`apiClient` lama tidak menormalkan `_id`.** Mengganti tipe sebuah entitas ke
`id` mengharuskan seluruh pembacanya, termasuk di modul lain, pindah ke hook
`features/` dalam commit yang sama. Bila tidak, `tsc` tetap hijau tetapi
halaman membaca `id` yang tidak ada saat runtime. Bila pembaca lama itu belum
dapat dimigrasikan bersamaan, tipe lamanya diberi akhiran `Lama` dan dipakai
halaman lama lewat alias impor, sedangkan nama kanonik menjadi tipe ber-`id`
(`keputusan.md` butir 19). Contoh: `PelangganLama as Pelanggan` di halaman
pelanggan.

### `lib/apiClient.ts` dan `lib/api/client.ts`

Dua nama yang mirip dan mudah tertukar:

- **`lib/apiClient.ts`** adalah klien lama: menangani header, penyegaran token,
  dan pengalihan ke login saat sesi berakhir. Masih dipakai halaman yang belum
  dimigrasikan, dan tetap menjadi lapisan terbawah.
- **`lib/api/client.ts`** adalah pembungkus baru di atasnya, mengekspor `api`
  dan `apiData`. Inilah yang dipakai `features/`.

Halaman yang sudah dimigrasikan tidak memanggil keduanya secara langsung,
melainkan lewat hook di `features/`.

### `lib/api/endpoints.ts`
Konstanta path, lowercase kanonik sesuai mount path backend. Endpoint
berparameter berupa fungsi: `EP.produk.detail(id)`.

### `lib/api/client.ts`
`apiData` dan `api`. Mengembalikan data yang sudah dinormalkan dan melempar
`ApiError`. Token pengguna menjadi default.

```ts
apiData.get<Produk[]>(EP.produk.list)
apiData.post<Produk>(EP.produk.list, payload)
```

### `lib/api/error.ts`
`ApiError` dengan `status`, `message`, `errors[]`, `code`. Helper:
`isUnauthorized`, `isForbidden`, `isNotFound`, `isConflict`, `isRateLimited`,
dan `pesanError(err, fallback)` untuk menampilkan pesan.

### `lib/api/normalize.ts`
`unwrap` membuka keenam bentuk envelope backend; `normalizeId` mengubah `_id`
menjadi `id` secara rekursif dan membuang `__v`. **Tipe di `types/` wajib
memakai `id`, tidak pernah `_id`.** Tipe modul yang belum dimigrasikan
diperbaiki bersama modulnya (Langkah migrasi satu modul, langkah 3).
`unwrap` juga meneruskan `pagination` (`Paginasi`: page, limit, total, dan
totalPages) sebagai `HasilApi.pagination` bila backend mengirimnya, dengan
nilai yang bukan angka dibaca 0 (daftar penjualan sejak backend `465b438`).

### `lib/auth/`
- `session.ts` — store token dan payload di memori. `tandaiKeluar()` hanya mengakhiri sesi pengguna; `akhiriSesi()` mengakhiri keduanya (logout).
- `sessionChannel.ts` — koordinasi refresh antar tab lewat `BroadcastChannel`.
- `useSession.ts` — hook: `pengguna`, `permissions`, `status`, `sudahMasuk`, `adaTokenAkun`.
- `permissions.ts` — `IZIN`, `IZIN_HALAMAN`, `bolehBukaHalaman`, `bolehBukaGrup`, serta `IZIN_LINTAS_OUTLET` dan `bolehLintasOutlet` (izin lintas outlet; null sampai backend menetapkan namanya, keputusan rancangan butir 18). Syarat di `IZIN_HALAMAN` berupa satu izin, atau array izin yang cukup dipenuhi salah satunya (`SyaratIzin`), untuk endpoint yang menerima izin alternatif (`keputusan.md` butir 16).

### `lib/queryKeys.ts`
Hierarkis. Setiap domain punya akar `semua`, lalu `daftar(filter)` dan
`detail(id)`. Invalidasi akar membatalkan seluruh turunannya.

```ts
queryKeys.produk.semua          // ["produk"]
queryKeys.produk.daftar(filter) // ["produk", "daftar", filter]
queryKeys.produk.detail(id)     // ["produk", "detail", id]
```

### `features/<modul>/`
Pola yang sudah terbukti di bahan baku, pengguna, role, produk, kategori,
stock adjustment, jurnal stok, stok, stock opname, pengajuan stok, transfer
stok, penjualan, tipe aset, aset, tarif, sesi booking, akun kas, laporan,
shift, pola roster, jadwal, absensi, dan metode pembayaran:

- `api.ts` — pemanggilan endpoint memakai `apiData` dan `EP`
- `hooks.ts` — `useQuery` dan `useMutation`, termasuk aturan invalidasi. Hook mutation menerima `onSuccess` dan `onError` dari halaman untuk toast dan reset dialog (`keputusan.md` butir 13)
- `schema.ts` — skema Zod untuk form
- `halaman-*.tsx` — komponen halaman bersama bila outlet dan gudang memakai halaman yang sama
- `form-*.tsx` — komponen form bersama untuk mode buat dan edit
- `payload.ts`, `pesan.ts`, `izin.ts`, `tampilan.ts`, `filter.ts` — fungsi murni untuk penyusunan payload, penerjemahan pesan error, aturan izin endpoint, penyiapan data tampilan, dan penyaringan daftar di klien (`keputusan.md` butir 9 sampai 11)
- Komponen pecahan halaman besar, misalnya `kartu-fasilitas.tsx` dan `panel-ringkasan.tsx` di `sesi-booking` (keputusan R9b)

Isi tiap `features/` yang sudah ada:

| Folder | Berkas | Catatan |
|---|---|---|
| `bahan-baku` | `api.ts`, `hooks.ts`, `schema.ts` | Modul percontohan Fase 2. Lokasi dan stok diambil dari `features/inventaris`; `useDaftarBahanBaku` juga dipakai inventaris gudang untuk master bahan baku |
| `inventaris` | `api.ts`, `hooks.ts`, `lokasi.ts`, `cakupan.ts`, `pemilih-lokasi-outlet.tsx`, `pesan-lokasi.tsx`, `akses-gudang.ts`, `schema-lokasi.ts`, `isian-lokasi.tsx` | Lintas halaman inventaris; dipakai bahan baku, jurnal stok, stok outlet, inventaris gudang, stock opname, stock adjustment, pengajuan stok, penerimaan barang, dan penjualan. Lokasi: `useDaftarLokasi` dan `useLokasiBertipe` berbagi kunci `lokasi.daftar()`, sedangkan `useLokasiAktif` menyeragamkan cache lewat `lokasiTunggal`. Stok: `useDaftarInventory` (argumen `null` berarti belum siap; tanpa `locationID` berarti semua lokasi), `useUbahStokMinimum`, `useOpnameInventory`, dan `useTambahInventory`. Cakupan: `useCakupanLokasiOutlet` (status `lintas`: pemegang izin lintas outlet, seluruh outlet dengan pemilih; status `terkunci`: pengguna lain, lokasi aktif yaitu outlet tenant) dengan fungsi murni `tentukanCakupan` dan `lingkupOutlet`, serta komponen `PemilihLokasiOutlet` dan `PesanLokasi`. `useDaftarLokasi`, `useLokasiAktif`, dan `useCakupanLokasiOutlet` menerima opsi `aktif` (bawaan true) untuk mematikan permintaan bagi pengguna tanpa `read-location` (penjualan, keputusan K11b). Satu-satunya tempat hook lokasi, inventory, dan cakupan. `useLokasiRuang(ruang, { aktif })` (sejak `dcc22e0`) memberi lokasi satu ruang untuk pemisahan data per ruang di shift dan pola roster, dan tidak meminta apa pun selama `aktif` false. Sejak `9ce288b`: `useBuatLokasi` membuat lokasi dan menunggu invalidasi `lokasi.semua` sebelum callback halaman (setup gudang); `akses-gudang.ts` memuat `tentukanAksesGudang` dan `tujuanAksesGudang` untuk layout gudang (GD4a); `schema-lokasi.ts` memuat `skemaLokasi`, `NILAI_AWAL_LOKASI`, dan `payloadBuatLokasi` untuk form lokasi (GD3a); sidebar dan layout gudang berbagi `useDaftarLokasi` (GD5a). Sejak `319bd99`: `usePerbaruiLokasi` dengan pola yang sama dengan `useBuatLokasi`; `nilaiAwalLokasi` dan `payloadPerbaruiLokasi` di `schema-lokasi.ts`; serta `IsianLokasi` (`isian-lokasi.tsx`), isian form lokasi yang dipakai setup dan pengaturan gudang, dengan mode `bacaSaja` (GD2a) |
| `pengguna` | `api.ts`, `hooks.ts`, `peran.ts`, `halaman-pengguna.tsx`, `widget-pengguna.tsx` | Komponen halaman dipakai outlet dan gudang |
| `role` | `api.ts`, `hooks.ts`, `constants.ts`, `form-role.tsx` | `form-role.tsx` dipakai halaman edit dan kostum; `useLevelPenggunaAktif` dipakai lintas modul |
| `produk` | `api.ts`, `hooks.ts`, `schema.ts`, `payload.ts`, `izin.ts`, `form-produk.tsx` | `form-produk.tsx` dipakai halaman buat dan edit; `useDaftarProduk` dipakai halaman kategori, pajak, dan buat penjualan; `bolehBacaProduk` menerima `read-produk` atau `akses-pos` |
| `kategori` | `api.ts`, `hooks.ts`, `schema.ts`, `pesan.ts` | `useDaftarKategori` dipakai form produk; `pesan.ts` menentukan field duplikat karena respons backend tidak dapat diandalkan |
| `stock-adjustment` | `api.ts`, `hooks.ts`, `tampilan.ts`, `ruang.ts`, `tautan-sumber.tsx`, `halaman-daftar-stock-adjustment.tsx`, `halaman-detail-stock-adjustment.tsx` | Hanya baca; komponen daftar dan detail dipakai outlet dan gudang lewat `ruang` (`URL_DAFTAR_ADJUSTMENT` dan `TIPE_LOKASI_RUANG` di `ruang.ts`); daftar menerima `lingkup`, `memuatLingkup`, `penghalang`, dan `pemilihLokasi`, dan detail menolak adjustment yang tipe lokasinya bukan milik ruang itu; `useDaftarStockAdjustment(filter \| null)` mengirim `locationID` yang disaring backend (null berarti lingkup belum siap), dan `useStockAdjustment` tidak mengulang permintaan saat 404. `tampilan.ts` menyusun baris item (`susunBarisItem`: saldo saat disetujui, stok saat draf bila berbeda, dan koreksi) dan sumber (`susunSumber`: label beserta tautan ke dokumen opname di ruang sesuai tipe lokasi); `tautan-sumber.tsx` dipakai daftar dan detail |
| `jurnal-stok` | `api.ts`, `hooks.ts`, `filter.ts`, `tampilan.ts`, `halaman-jurnal-stok.tsx` | Hanya baca; komponen halaman dipakai outlet dan gudang, dibedakan lewat `ruang`, `lingkup` (satu lokasi atau tipe lokasi), `penghalang`, dan `pemilihLokasi` (pemegang izin lintas outlet di ruang outlet). `useDaftarJurnalStok(lingkup)` mengirim `locationID` untuk lingkup satu lokasi lewat `filterServer` (diabaikan backend hari ini) dan tidak meminta data selama lingkup belum siap; penyaringan klien lewat `filter.ts` tetap wajib |
| `stock-opname` | `api.ts`, `hooks.ts`, `payload.ts`, `izin.ts`, `halaman-daftar-stock-opname.tsx`, `halaman-detail-stock-opname.tsx`, `form-buat-stock-opname.tsx` | Ketiga komponen dipakai outlet dan gudang lewat `ruang` dan `TEKS`. Daftar menerima `lingkup` dan `pemilihLokasi`; form buat menerima `sumberLokasi` (tetap atau pilih). `payload.ts` hanya mengirim item yang berubah dibanding data server (`petakanNilaiServer`), dikendalikan `SERVER_TERIMA_HITUNGAN_KOSONG` selama validator backend menolak hitungan kosong; `izin.ts` memuat `bolehHitungOpname` dan `bolehTinjauOpname`; `useStockOpname` tidak mengulang permintaan saat 404 |
| `pengajuan-stok` | `api.ts`, `hooks.ts`, `filter.ts`, `izin.ts`, `arah.ts`, `payload.ts`, `schema.ts`, `tampilan.ts`, `halaman-daftar-pengajuan-stok.tsx`, `form-pengajuan-stok.tsx`, `halaman-edit-pengajuan-stok.tsx`, `halaman-detail-pengajuan-outlet.tsx`, `halaman-detail-pengajuan-gudang.tsx` | Komponen daftar dipakai outlet dan gudang lewat `ruang` dan `TEKS` (tab, label status, kolom lokasi, tombol baris), `lingkup`, `pemilihLokasi`, dan `penghalang`. `filter.ts` menyaring per ruang (arah lokasi, draf, pencarian); `arah.ts` memuat `arahPengajuanValid` (gudang asal di `dariLokasi`, outlet peminta di `keLokasi`), dipakai juga penjaga setujui dan surat jalan di detail gudang; `izin.ts` mencerminkan aturan status per izin di `pengajuanStokService.getAll` dan memuat izin aksi per tombol. `form-pengajuan-stok.tsx` dipakai buat dan revisi: `FormPengajuanStok` menentukan outlet peminta (terkunci ke outlet tenant bagi pengguna tanpa izin lintas outlet) lalu memasang `IsiFormPengajuanStok`, dengan skema di `schema.ts` (jumlah sebagai teks) serta `susunPayloadPengajuan` dan `nilaiAwalPengajuan` di `payload.ts`; halaman edit memasang form setelah detail termuat ulang. Detail outlet dan gudang adalah dua komponen terpisah; `usePengajuanStok` tidak mengulang permintaan saat 404 |
| `transfer-stok` | `api.ts`, `hooks.ts`, `payload.ts`, `filter.ts`, `izin.ts`, `tampilan.ts`, `halaman-daftar-transfer.tsx`, `halaman-detail-transfer.tsx`, `halaman-revisi-transfer.tsx`, `halaman-pengiriman.tsx`, `halaman-daftar-penerimaan.tsx`, `halaman-detail-penerimaan.tsx` | Surat jalan di ruang gudang (daftar, detail, revisi, pengiriman) dan outlet (daftar dan detail penerimaan), serta pembuatan surat jalan dari pengajuan (`useBuatSuratJalan`) untuk detail gudang pengajuan. Keenam komponen terpisah menurut perannya dan hanya berbagi lapisan data (`keputusan.md`, submodul transfer). `filter.ts` menyaring status, lokasi tujuan, dan pencarian di klien karena backend mengabaikan query daftar sampai `465b438`, yang dilaporkan sudah membacanya tetapi belum dibuktikan dari web (`kontrak/temuan.md` butir 33), sedangkan `filterServerTransfer` tetap mengirim filternya. `izin.ts` memuat `aksiSuratJalan`: kirim, revisi, dan batal hanya untuk PENDING, terima hanya untuk DIKIRIM, masing-masing dengan izin endpoint-nya. `payload.ts` memuat `susunPayloadTerima` (seluruh item dengan `itemId` bila ada dan `bahanBakuID` sebagai cadangan, jumlah diterima apa adanya termasuk 0, dan item tanpa keduanya menahan penerimaan; `6e314ae`) dan `susunPayloadRevisi`. `useTransferStok` tidak mengulang saat 404 dan dimuat ulang saat halaman dibuka; halaman revisi dan detail penerimaan memasang form setelah `isFetchedAfterMount`. Mutation aksi menginvalidasi akar sesuai efek backend. Daftar penerimaan memakai `useCakupanLokasiOutlet` |
| `penjualan` | `api.ts`, `hooks.ts`, `filter.ts`, `izin.ts`, `payload.ts`, `tampilan.ts`, `halaman-daftar-penjualan.tsx`, `halaman-detail-penjualan.tsx`, `halaman-pembayaran-penjualan.tsx`, `halaman-buat-penjualan.tsx` | Hanya ruang outlet; keempat halaman di `app/` tipis. Daftar menerima `lingkup`, `penghalang`, dan `pemilihLokasi`. `filter.ts` memuat `filterServerPenjualan` (delapan filter yang diterapkan backend), `tentukanLingkupPenjualan`, `saringPenjualan` (cakupan di klien karena backend tidak menyaring lokasi; penjualan tanpa `locationID` dianggap milik outlet tenant), dan pilihan jumlah baris (`PILIHAN_UKURAN_HALAMAN`, `UKURAN_HALAMAN_BAWAAN`). `useDaftarPenjualan(filter, halaman, ukuran, siap)` meminta satu halaman (`page` dan `limit`) dan mempertahankan data halaman sebelumnya selama halaman berikutnya dimuat; daftar menyerahkan angka `pagination` ke footer `DataTable` lewat `paginasiServer`, tanpa tombol urutkan (PB6a dan PB14a). `izin.ts` memuat `bolehCakupanPenjualan` (K11b), `aksiPenjualan` (aksi per status dan izin, PB1a), `IZIN_PENJUALAN`, dan `bolehBatalkanPembayaran` (PB5a); `tampilan.ts` memuat label dan urutan status (`TAMPILAN_STATUS_PENJUALAN`, `URUTAN_STATUS_PENJUALAN`) serta pesan void dan batal pembayaran. `usePenjualan` tidak mengulang saat 404; `useVoidPenjualan` untuk DRAFT dan UNPAID tanpa pembayaran (PB2a); `useFinalisasiPenjualan` menginvalidasi penjualan, inventory, produk, dan jurnal stok; `useBuatPenjualan` mengirim `x-idempotency-key` (K3a). `payload.ts` memuat `lokasiFinalisasi`, `susunPayloadFinalisasi`, `validasiPenjualan` (termasuk jam transaksi lengkap, keputusan K-TW5a), dan `susunPayloadPenjualan` (tanggal dan jam lewat `gabungTanggalWaktu`, sehingga tidak pernah bergeser; diskon lewat `diskonItem` dan `diskonGlobal`, tanpa `penggunaID`, PB7a). Buat penjualan memakai `PilihTanggal` dan `InputWaktu`, dan filter tanggal daftar memakai `PilihTanggal` (`e43e000`) |
| `pembayaran` | `api.ts`, `hooks.ts`, `payload.ts` | Riwayat pembayaran dibaca dari `pembayaran[]` detail penjualan (PB4a), sehingga `useDaftarPembayaran`, `pembayaranApi.daftar`, dan `filter.ts` dibuang di `b85c2bd`. `useBuatPembayaran` membuat pembayaran, dan `useBatalkanPembayaran` mengirim `PUT /pembayaran/:id` berstatus VOID dengan alasan opsional (PB5a). `payload.ts` memuat `nominalDariTeks`, `validasiPembayaran`, `susunPayloadPembayaran` (tanpa `status` dan `akunKasID`, K2a dan PB3a), `susunPayloadBatalPembayaran`, dan `teksAkunTujuan` (akun kas tujuan dari metode terpilih) |
| `metode-pembayaran` | `api.ts`, `hooks.ts`, `filter.ts`, `schema.ts`, `payload.ts`, `izin.ts`, `tampilan.ts`, `form-metode-pembayaran.tsx`, `halaman-form-metode-pembayaran.tsx`, `halaman-daftar-metode-pembayaran.tsx` | Dibuat untuk modul penjualan (K1a), dilengkapi submodul metode pembayaran modul Pengaturan outlet (`3359497`). `useDaftarMetodePembayaran()` memberi metode aktif untuk pilihan kasir (`metodeAktif`), dan `useDaftarMetodePembayaran({ semua: true })` seluruh metode untuk halaman kelola (`showAll=true`, kunci `daftar({ semua: true })`, PO2a). `useMetodePembayaran` dimuat ulang saat halaman dibuka dan tidak mengulang 404; `useBuatMetodePembayaran` dan `usePerbaruiMetodePembayaran` menunggu invalidasi akar. `payload.ts` memuat `payloadBuatMetode` (keempat field allowlist, `kontrak/temuan.md` butir 84) dan `payloadUbahMetode` (hanya field yang berubah, butir 15); `schema.ts` memuat `buatSkemaMetodePembayaran` (akun nonaktif ditolak saat buat, pindah, dan mengaktifkan kembali); `tampilan.ts` memuat `pilihanAkun`, `masihDalamBatas` (PO3a), dan `metodeAktifTerakhir` (PO5a); `izin.ts` memuat `aksiMetodePembayaran`. `FormMetodePembayaran` dipakai buat dan ubah. `namaMetode` dibuang di `b85c2bd` (PB4a) |
| `akun-kas` | `api.ts`, `hooks.ts`, `filter.ts`, `schema.ts` | Dibuat untuk modul penjualan (K1a), dilengkapi modul keuangan (`45187b6`). `useDaftarAkunKas` (kunci `daftar()`) dipakai daftar akun kas, kartu ringkasan keuangan, pembayaran penjualan, dan form metode pembayaran (`3359497`); `useBuatAkunKas` menginvalidasi akar `akunKas.semua`; `akunKasAktif` untuk pembayaran. `skemaAkunKas` memakai `z.coerce` dengan tipe masukan dan keluaran eksplisit tanpa `.default()` (KU3a), dan nama serta nomor dipangkas (KU7a) |
| `laporan` | `api.ts`, `hooks.ts`, `periode.ts` | Modul keuangan (`45187b6`). Sejak `b85c2bd` rentang dikirim sebagai tanggal lokal `YYYY-MM-DD` (`keTanggalLokal` dari `lib/waktu.ts`), karena backend `465b438` menolak format ISO. `useLabaRugi(rentang)` menyimpan seluruh filter, termasuk `startDate` dan `endDate`, di kunci `laporan.labaRugi`. `periode.ts` memuat `rentangPeriode` (hari ini, sejak Senin, atau sejak tanggal 1, sampai akhir hari ini), `rentangPeriodeSebelumnya` (pembanding KU5a), `rentangBulanIni` (kartu ringkasan), `jumlahkan`, `persentasePertumbuhan`, dan `teksPertumbuhan` |
| `pelanggan` | `api.ts`, `hooks.ts` | Dibuat untuk modul penjualan (K1a); hanya `useDaftarPelanggan`, dipakai buat penjualan dan buat reservasi (`477f258`). Halaman pelanggan belum dimigrasikan |
| `diskon` | `api.ts`, `hooks.ts`, `filter.ts` | Dibuat untuk modul penjualan (K1a); hanya daftar, dengan kunci `diskon.daftar()` tanpa filter, `diskonAktif` per cakupan, dan `pilihDiskon` (aturan `bisaDigabung`, keputusan R7b, dipakai buat reservasi sejak `477f258`). Halaman diskon belum dimigrasikan |
| `pajak` | `api.ts`, `hooks.ts`, `filter.ts` | Dibuat untuk modul penjualan (K1a); hanya daftar dan `pajakTransaksiAktif` (urut prioritas). Halaman pengaturan pajak belum dimigrasikan |
| `tipe-aset` | `api.ts`, `hooks.ts`, `schema.ts`, `payload.ts` | Submodul reservasi (`074e98c`). `useDaftarTipeAset` memakai kunci `daftar()` (keputusan rancangan butir 12), dan dipakai juga form aset serta form buat dan edit tarif; `useTipeAset` tidak mengulang saat 404. Mutation menginvalidasi akar tipe aset, tarif, dan aset, karena daftar tarif dan aset menampilkan nama tipe aset. Satu skema buat dan edit dengan trim; `payloadBuatTipeAset` tidak mengirim deskripsi kosong, sedangkan `payloadUbahTipeAset` mengirim `""` agar deskripsi yang dikosongkan terhapus |
| `aset` | `api.ts`, `hooks.ts`, `schema.ts`, `payload.ts`, `tampilan.ts` | Submodul reservasi (`d3ae182`). `tampilan.ts` memuat `namaTipeAset`, untuk aset yang tipe asetnya sudah tidak ada (PB9a). `useDaftarAset` memakai kunci `daftar()` dan dimuat ulang setiap halaman dibuka, karena status aset dihitung backend dari sesi booking yang sedang berjalan; `useAset` tidak mengulang saat 404. Mutation menginvalidasi akar aset dan sesi booking. Satu skema buat dan edit dengan trim; `payloadAset` tidak mengirim status "digunakan", karena status itu dihitung, bukan disimpan |
| `tarif` | `api.ts`, `hooks.ts`, `schema.ts`, `payload.ts` | Submodul reservasi (`365553f`). `useDaftarTarif` memakai kunci `daftar()`; `useTarif` tidak mengulang saat 404 dan dimuat ulang setiap halaman edit dibuka, dan halaman edit memasang `FormEditTarif` setelah `isFetchedAfterMount` (keputusan rancangan butir 8). Mutation menginvalidasi akar tarif dan tipe aset, karena daftar tipe aset menampilkan tarif terkait. `skemaTarif` dipakai buat dan edit: `z.coerce` dengan tipe masukan dan keluaran eksplisit (keputusan T2a), harga kosong ditolak lewat `z.preprocess` (T3b), dan nama dipangkas (T4a); `NILAI_AWAL_TARIF` untuk buat. `payloadTarif` menyebut sepuluh field form satu per satu, dan `nilaiAwalTarif` menyusun nilai awal edit, termasuk id tipe aset dari `dataAset`. Jam mulai dan selesai memakai `InputWaktu` dengan `pisahTeksWaktu` dan `gabungTeksWaktu`, sehingga isian yang belum lengkap tetap tersimpan dan divalidasi skema (`e43e000`) |
| `sesi-booking` | `api.ts`, `hooks.ts`, `tampilan.ts`, `status.ts`, `tautan-penjualan.tsx`, `schema.ts`, `waktu-booking.ts`, `payload.ts`, `halaman-buat-reservasi.tsx`, `kartu-fasilitas.tsx`, `panel-ringkasan.tsx` | Submodul reservasi (`eef371a`, `477f258`). `useDaftarSesiBooking(tanggal)` memakai kunci `sesiBooking.daftar(tanggal)`, segar 1 menit, dan dimuat ulang saat halaman dibuka dan saat jendela difokus. `useBookingBanyakTanggal` memakai kunci `banyakTanggal` untuk deteksi bentrok di buat reservasi, dimuat ulang tiap menit (keputusan rancangan butir 12). `useBuatBooking` menginvalidasi penjualan dan aset saat berhasil, dan daftar booking saat selesai termasuk gagal, agar penolakan bentrok 409 langsung terlihat. `tampilan.ts` memuat `bookingPerAset` (timeline tanpa booking VOID, R5a dan PB8a), `tautanPenjualanBooking` (R4b), dan `bookingBentrok` (hanya booking Aktif yang sudah dibayar, PB8a); `status.ts` memuat `labelStatusBooking` dan `bookingBertumpukBelumDibayar` (peringatan tanpa menahan simpan). Buat reservasi dipecah menjadi halaman, `KartuFasilitas`, dan `PanelRingkasan` (R9b); waktu per fasilitas disimpan sebagai `WaktuItem` di luar form lalu diisikan ke `waktuMulai` dan `waktuSelesai` lewat `gabungTanggalWaktu`, sehingga jam yang belum lengkap menjadi isian kosong yang ditolak skema (K-TW5a) |
| `shift` | `api.ts`, `hooks.ts`, `schema.ts`, `payload.ts`, `ruang.ts`, `halaman-shift-ruang.tsx`, `halaman-shift.tsx`, `form-shift.tsx`, `dialog-nonaktif-shift.tsx` | Submodul shift modul jadwal (`f99b7cf`). `HalamanShiftRuang` dipakai halaman outlet dan gudang (keputusan SH1b); ia memuat, menyimpan, dan menonaktifkan lewat `useDaftarShift(ruang)`, `useSimpanShift(ruang)`, dan `useNonaktifkanShift`, menampilkan toast, dan melempar ulang galat agar dialog bertahan. Mutation menunggu invalidasi shift, pola roster, dan jadwal shift, sehingga dialog tertutup setelah daftar termuat ulang. `ruang.ts` memuat `KUNCI_LOKASI_SHIFT` (null sampai backend memisahkan shift per lokasi, keputusan rancangan butir 18) dan `filterDaftarShift`, yang selama null mengirim `?workspace=` karena `GET /shift` tanpa query dijawab 500. `form-shift.tsx` memasang `IsiFormShift` setiap kali dialog dibuka (butir 8), dengan `skemaShift` dan `InputWaktu`; `hitungLintasHari`, `nilaiAwalShift`, dan `payloadShift` ada di `payload.ts` (SH2a, SH4a). `useDaftarShift` dipakai pola roster (`dcc22e0`) dan disiapkan untuk jadwal (butir 12); lokasi ruang dari `useLokasiRuang` di `features/inventaris` |
| `pola-roster` | `api.ts`, `hooks.ts`, `schema.ts`, `payload.ts`, `ruang.ts`, `halaman-pola-roster-ruang.tsx`, `halaman-pola-roster.tsx`, `form-pola-roster.tsx`, `dialog-hapus-pola-roster.tsx` | Submodul pola roster modul jadwal (`dcc22e0`). `HalamanPolaRosterRuang` dipakai halaman outlet dan gudang (keputusan PL5); ia memuat pola lewat `useDaftarPolaRoster(ruang)` dan shift lewat `useDaftarShift(ruang)`, lalu menyimpan dan menghapus lewat `useSimpanPolaRoster(ruang)` dan `useHapusPolaRoster`, dengan toast dan galat yang dilempar ulang agar dialog bertahan. `ruang.ts` memuat `KUNCI_LOKASI_POLA_ROSTER` (null, butir 18) dan `filterDaftarPola`, tanpa query selama null. `form-pola-roster.tsx` memasang `IsiFormPolaRoster` setiap kali dialog dibuka (butir 8), dengan `buatSkemaPolaRoster(idShiftAktif)` yang menolak hari kerja tanpa shift dan shift nonaktif (PL1a). `payload.ts` memuat `terimaKetikanSiklus` dan `sesuaikanRincian` (PL3a), `payloadPolaRoster`, `tambahLokasiPolaRoster`, serta `labelShiftPola` dan `teksLabelShift` untuk penanda nonaktif |
| `jadwal` | `tipe.ts`, `rentang.ts`, `pemetaan.ts`, `rencana.ts`, `hasil.ts`, `generate.ts`, `api.ts`, `hooks.ts`, `schema.ts`, `halaman-jadwal-ruang.tsx`, `halaman-jadwal.tsx`, `grid-jadwal.tsx`, `sel-shift.tsx`, `toolbar-jadwal.tsx`, `form-jadwal.tsx`, `halaman-generate-ruang.tsx`, `langkah-satu.tsx`, `langkah-dua.tsx` | Submodul kalender, kelola manual, dan generate modul jadwal (`19227f8`, `e2a0cfd`). `HalamanJadwalRuang` dan `HalamanGenerateRuang` dipakai rute outlet dan gudang. Karyawan dari `useDaftarPengguna` (`features/pengguna`) lewat `keKaryawanRuang`, shift dari `useDaftarShift`, dan pola dari `useDaftarPolaRoster` (butir 12). `rentangBulan` memakai tanggal lokal (J1a); `itemJadwal` memetakan libur, catatan, dan shift nonaktif; `rencanaSimpanJadwal` dijalankan `useSimpanJadwalHari` dengan satu ringkasan (JD6a); `pesanDitolak` menampilkan jadwal yang ditolak (J2a); `simulasiGenerate` menandai shift bermasalah dan menahan simpan (GN2a) |
| `absensi` | `api.ts`, `hooks.ts`, `ringkasan.ts` | Submodul monitoring absensi modul jadwal (`845c2cf`). `useMonitoringAbsensi(tanggal)` memuat ulang setiap 30 detik untuk hari ini dan tidak mengulang jawaban 403 (AB3a). `ringkasan.ts` memuat `stafRuang` (AB4a), `hitungAbsensi` (AB5a), dan `jamWIB`. Dipakai `WidgetActiveUsers` di `features/pengguna/widget-pengguna.tsx`, yang membaca nama peran lewat `namaPeran` (`features/pengguna/peran.ts`) |

Cara memeriksa apakah sebuah modul sudah dimigrasikan: halamannya tidak lagi
memanggil `apiClient`, dan lapisan datanya ada di `features/<modul>/` atau di
`features/` lintas modul (halaman stok memakai `features/inventaris`).

### `components/providers/`

- `query-provider.tsx` — penyedia TanStack Query, dengan `staleTime` bawaan
  5 menit: kembali ke kunci yang masih segar tidak memicu permintaan
  (`pengujian.md`, Urutan debug kegagalan e2e).
- `session-provider.tsx` — memulihkan sesi saat aplikasi dimuat, dengan
  memanggil refresh akun lalu refresh pengguna. Keduanya dipasang di
  `app/layout.tsx`.

### Komponen tanggal dan waktu

Seluruh input tanggal dan waktu memakai komponen ini (keputusan rancangan
butir 22). ESLint menolak impor kalender shadcn murni dan input `type`
date, time, datetime-local, month, maupun week di JSX, di `app`,
`components`, `features`, `hooks`, `lib`, dan `types`.

- `components/pilih-tanggal.tsx` — `PilihTanggal`: tombol berformat
  "dd MMMM yyyy" dan kalender kostum `components/calendar.tsx` di popover.
  Nama aksesibel tombol "<label>, <tanggal>"; kalender dibuka di bulan
  terpilih, popover tertutup setelah memilih, dan `tanggalNonaktif`
  diteruskan ke kalender.
- `components/input-waktu.tsx` — `InputWaktu`: nilai `{ jam, menit }`,
  grup dan isian bernama "<label>", "<label> (jam)", dan "<label>
  (menit)", `inputMode` numeric, dan placeholder "--".
- `lib/waktu.ts` — aturan murni: `terimaKetikan` (hanya angka, ketikan di
  atas batas ditolak), `rapikanBagian`, `waktuLengkap`, `keTeksWaktu` dan
  `dariTeksWaktu` (teks "HH:mm" ketat), `pisahTeksWaktu` dan
  `gabungTeksWaktu` (teks mentah untuk form yang memvalidasi di skema),
  `waktuDari`, `gabungTanggalWaktu` (null untuk waktu belum lengkap), serta
  `keTanggalLokal` dan `dariTanggalLokal` (YYYY-MM-DD lokal).

### Tabel data (`components/ui/data-table.tsx`)

`DataTable` membungkus `@tanstack/react-table` dengan pengurutan dan
paginasi klien (10 baris per halaman) serta footer "total data / Previous /
Next". Tabel yang datanya sudah dipotong server mengisi `paginasiServer`
(`PaginasiServerTabel`): paginasi klien dimatikan, dan footer yang sama
memakai halaman, jumlah halaman, dan total dari server, beserta pilihan
"Tampilkan" bila `pilihanUkuran` diisi (`b63cf08`, daftar penjualan).
Kolom tabel semacam itu tidak diberi tombol urutkan, karena pengurutan
klien hanya mengurutkan baris halaman yang tampil.

## Langkah migrasi satu modul

Urutan yang dipakai pada bahan baku, pengguna, role, produk, kategori, stock
adjustment, jurnal stok, stok, stock opname, pengajuan stok, dan transfer stok,
dan terbukti menjaga `tsc` tetap hijau di tiap langkah:

1. **Petakan keadaan.** Hitung baris tiap berkas, cari pemakaian `apiClient`,
   `any`, `_id`, dan `queryKey`. Bila ada dua halaman serupa (outlet dan
   gudang), bandingkan dengan `diff` untuk mengetahui apakah keduanya kembar.
   Bila modul belum punya spec e2e, tulis spec pembanding untuk perilaku yang
   ada dan jalankan terhadap kode lama sebelum mengubah apa pun.
2. **Periksa kontrak.** Buka `docs/kontrak/endpoint.md` (bagian 3.1 dan 3.3)
   dan `docs/kontrak/payload.md` untuk modul itu. Bila ada field yang
   meragukan, periksa validator dan service backend sebelum memutuskan.
   Untuk field referensi, grep `.populate("<field>"` di service: isinya bisa
   objek, bukan id (`referenceID` stock adjustment sempat ditipekan string
   dan membuat halaman crash). Pemanggil validator dicari di seluruh backend,
   termasuk `services/` (`backend.md`).
3. **Perbaiki tipe** di `types/` agar memakai `id` dan sesuai bentuk respons
   nyata. Jalankan `tsc`; error yang muncul adalah peta migrasinya. Bereskan
   seluruh error itu dulu (umumnya penggantian `_id` menjadi `id`) sampai `tsc`
   hijau kembali, sebelum melangkah ke berkas `features/`. Dengan begitu tiap
   langkah tetap dapat di-commit. `tsc` hijau belum berarti aman bila pembaca
   entitas itu masih memakai `apiClient` lama, karena data mentahnya masih
   membawa `_id` (lihat Fondasi yang sudah tersedia).
4. **Buat `features/<modul>/api.ts`** memakai `apiData` dan `EP`.
5. **Buat `features/<modul>/hooks.ts`**, termasuk aturan invalidasi. Bila satu
   perubahan memengaruhi modul lain (misalnya bahan baku memengaruhi
   inventory), invalidasi keduanya di sini, bukan di halaman.
6. **Buat `schema.ts`** bila modul punya form. Satukan skema buat dan edit bila
   entitasnya sama.
7. **Sambungkan halaman satu per satu**, mulai dari yang paling kecil.
   Jalankan `tsc` setiap selesai satu halaman.
8. **Bersihkan** import yang tidak terpakai dan `any` yang tersisa dengan
   ESLint sebagai penuntun.
9. **Uji**: jalankan spec modul itu, tambahkan skenario untuk perilaku yang
   berubah atau bug yang ditemukan, jalankan ulang.
10. **Commit** dengan pesan lengkap, lalu perbarui dokumentasi (`docs/README.md`).

### Kapan halaman disatukan

Satukan bila kedua halaman benar-benar menjalankan alur yang sama dan hanya
berbeda pada satu atau dua nilai, seperti halaman pengguna outlet dan gudang
yang `diff`-nya hanya satu baris. Komponen bersama menerima pembeda itu
sebagai prop.

Jangan satukan hanya karena tampilannya mirip. Bila perbedaannya bermakna
(sumber data berbeda, aturan penyimpanan berbeda, atau ada blok UI yang hanya
ada di salah satunya), komponen bersama akan penuh percabangan dan justru lebih
sulit dibaca daripada dua berkas terpisah. Dalam hal itu, cukup bagikan lapisan
`features/` dan biarkan halamannya terpisah.

### Kapan halaman besar dipecah

Pola dari buat reservasi (keputusan R9b): bagian halaman yang berdiri
sendiri dan dapat menerima datanya lewat prop, seperti kartu per item dan
panel ringkasan, dipindah ke komponen tersendiri di `features/<modul>/`.
State yang hanya dipakai satu bagian, misalnya popover pemilih diskon,
ikut pindah ke komponennya. Apakah sebuah halaman dipecah diputuskan
pemilik proyek per halaman: buat penjualan (`f33ffa6`) dipindah tanpa
dipecah, dan pemecahannya tercatat sebagai utang di `status.md`.

### Definisi selesai untuk satu modul

- `tsc --noEmit` tanpa error
- ESLint tanpa error pada berkas modul itu (peringatan warisan boleh tersisa)
- Tidak ada lagi `apiClient`, `any`, maupun `_id` di halaman modul itu
- Spec e2e modul lolos, termasuk skenario baru untuk perilaku yang berubah
- Vitest penuh dan suite e2e penuh lolos sebelum commit, dibandingkan dengan baseline
- Pelajaran dari debug dan perbaikan selama modul ini sudah dicatat di `cara-kerja.md` atau `pengujian.md`
- Sudah di-commit dan di-push
- Dokumentasi di `docs/refactor/` dan `docs/kontrak/` diperbarui lalu diperiksa
  ulang utuh sebelum commit (`docs/README.md`)
