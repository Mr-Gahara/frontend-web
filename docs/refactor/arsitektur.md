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

### Struktur direktori

| Direktori | Isi |
|---|---|
| `app/` | Rute Next.js. Idealnya tipis: tata letak dan interaksi saja |
| `features/<modul>/` | Api, hooks, schema, komponen halaman dan form bersama, serta fungsi murni per modul |
| `components/` | Komponen UI yang dipakai lintas modul, termasuk shadcn di `components/ui/` |
| `lib/` | Fondasi: `api/`, `auth/`, `queryKeys.ts`, `apiClient.ts`, `decodeToken.ts` |
| `types/` | Tipe respons dan payload, diturunkan dari kontrak |
| `tests/e2e/` | Playwright, memakai backend sungguhan |
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
halaman: `components/pengguna/`, `components/shift/`, `components/pola-roster/`,
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
halaman membaca `id` yang tidak ada saat runtime. Contoh: tipe `Produk` juga
dibaca halaman pajak dan buat penjualan.

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

### `lib/auth/`
- `session.ts` — store token dan payload di memori. `tandaiKeluar()` hanya mengakhiri sesi pengguna; `akhiriSesi()` mengakhiri keduanya (logout).
- `sessionChannel.ts` — koordinasi refresh antar tab lewat `BroadcastChannel`.
- `useSession.ts` — hook: `pengguna`, `permissions`, `status`, `sudahMasuk`, `adaTokenAkun`.
- `permissions.ts` — `IZIN`, `IZIN_HALAMAN`, `bolehBukaHalaman`, `bolehBukaGrup`.

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
stock adjustment, jurnal stok, stok, stock opname, dan daftar pengajuan stok:

- `api.ts` — pemanggilan endpoint memakai `apiData` dan `EP`
- `hooks.ts` — `useQuery` dan `useMutation`, termasuk aturan invalidasi. Hook mutation menerima `onSuccess` dan `onError` dari halaman untuk toast dan reset dialog (`keputusan.md` butir 13)
- `schema.ts` — skema Zod untuk form
- `halaman-*.tsx` — komponen halaman bersama bila outlet dan gudang memakai halaman yang sama
- `form-*.tsx` — komponen form bersama untuk mode buat dan edit
- `payload.ts`, `pesan.ts`, `izin.ts`, `tampilan.ts`, `filter.ts` — fungsi murni untuk penyusunan payload, penerjemahan pesan error, aturan izin endpoint, penyiapan data tampilan, dan penyaringan daftar di klien (`keputusan.md` butir 9 sampai 11)

Isi tiap `features/` yang sudah ada:

| Folder | Berkas | Catatan |
|---|---|---|
| `bahan-baku` | `api.ts`, `hooks.ts`, `schema.ts` | Modul percontohan Fase 2. Lokasi dan stok diambil dari `features/inventaris`; `useDaftarBahanBaku` juga dipakai inventaris gudang untuk master bahan baku |
| `inventaris` | `api.ts`, `hooks.ts`, `lokasi.ts`, `cakupan.ts`, `pemilih-lokasi-outlet.tsx`, `pesan-lokasi.tsx` | Lintas halaman inventaris; dipakai bahan baku, jurnal stok, stok outlet, inventaris gudang, stock opname, dan pengajuan stok. Lokasi: `useDaftarLokasi` dan `useLokasiBertipe` berbagi kunci `lokasi.daftar()`, sedangkan `useLokasiAktif` menyeragamkan cache lewat `lokasiTunggal`. Stok: `useDaftarInventory` (argumen `null` berarti belum siap; tanpa `locationID` berarti semua lokasi), `useUbahStokMinimum`, `useOpnameInventory`, dan `useTambahInventory`. Cakupan: `useCakupanLokasiOutlet` (owner seluruh outlet, staf lokasi aktif) dengan fungsi murni `tentukanCakupan` dan `lingkupOutlet`, serta komponen `PemilihLokasiOutlet` dan `PesanLokasi`. Satu-satunya tempat hook lokasi, inventory, dan cakupan |
| `pengguna` | `api.ts`, `hooks.ts`, `halaman-pengguna.tsx` | Komponen halaman dipakai outlet dan gudang |
| `role` | `api.ts`, `hooks.ts`, `constants.ts`, `form-role.tsx` | `form-role.tsx` dipakai halaman edit dan kostum; `useLevelPenggunaAktif` dipakai lintas modul |
| `produk` | `api.ts`, `hooks.ts`, `schema.ts`, `payload.ts`, `izin.ts`, `form-produk.tsx` | `form-produk.tsx` dipakai halaman buat dan edit; `useDaftarProduk` dipakai halaman kategori, pajak, dan buat penjualan; `bolehBacaProduk` menerima `read-produk` atau `akses-pos` |
| `kategori` | `api.ts`, `hooks.ts`, `schema.ts`, `pesan.ts` | `useDaftarKategori` dipakai form produk; `pesan.ts` menentukan field duplikat karena respons backend tidak dapat diandalkan |
| `stock-adjustment` | `api.ts`, `hooks.ts`, `tampilan.ts` | Hanya baca; `useStockAdjustment` tidak mengulang permintaan saat 404; `tampilan.ts` menampilkan `-` untuk nilai yang salah dari mapper backend, dikendalikan `MAPPER_ADJUSTMENT_SUDAH_BENAR` |
| `jurnal-stok` | `api.ts`, `hooks.ts`, `filter.ts`, `tampilan.ts`, `halaman-jurnal-stok.tsx` | Hanya baca; komponen halaman dipakai outlet dan gudang, dibedakan lewat `ruang`, `lingkup` (satu lokasi atau tipe lokasi), `penghalang`, dan `pemilihLokasi` (owner di ruang outlet) |
| `stock-opname` | `api.ts`, `hooks.ts`, `payload.ts`, `izin.ts`, `halaman-daftar-stock-opname.tsx`, `halaman-detail-stock-opname.tsx`, `form-buat-stock-opname.tsx` | Ketiga komponen dipakai outlet dan gudang lewat `ruang` dan `TEKS`. Daftar menerima `lingkup` dan `pemilihLokasi`; form buat menerima `sumberLokasi` (tetap atau pilih). `payload.ts` hanya mengirim hitungan yang terisi; `izin.ts` memuat `bolehHitungOpname` dan `bolehTinjauOpname`; `useStockOpname` tidak mengulang permintaan saat 404 |
| `pengajuan-stok` | `api.ts`, `hooks.ts`, `filter.ts`, `izin.ts`, `halaman-daftar-pengajuan-stok.tsx` | Komponen daftar dipakai outlet dan gudang lewat `ruang` dan `TEKS` (tab, label status, kolom lokasi, tombol baris), `lingkup`, `pemilihLokasi`, dan `penghalang`. `filter.ts` menyaring per ruang (tipe lokasi, draf, pencarian); `izin.ts` mencerminkan aturan status per izin di `pengajuanStokService.getAll`. Detail, edit, dan buat belum dimigrasikan |

Cara memeriksa apakah sebuah modul sudah dimigrasikan: halamannya tidak lagi
memanggil `apiClient`, dan lapisan datanya ada di `features/<modul>/` atau di
`features/` lintas modul (halaman stok memakai `features/inventaris`).

### `components/providers/`

- `query-provider.tsx` — penyedia TanStack Query.
- `session-provider.tsx` — memulihkan sesi saat aplikasi dimuat, dengan
  memanggil refresh akun lalu refresh pengguna. Keduanya dipasang di
  `app/layout.tsx`.

## Langkah migrasi satu modul

Urutan yang dipakai pada bahan baku, pengguna, role, produk, kategori, stock
adjustment, jurnal stok, stok, stock opname, dan daftar pengajuan stok, dan
terbukti menjaga `tsc` tetap hijau di tiap langkah:

1. **Petakan keadaan.** Hitung baris tiap berkas, cari pemakaian `apiClient`,
   `any`, `_id`, dan `queryKey`. Bila ada dua halaman serupa (outlet dan
   gudang), bandingkan dengan `diff` untuk mengetahui apakah keduanya kembar.
   Bila modul belum punya spec e2e, tulis spec pembanding untuk perilaku yang
   ada dan jalankan terhadap kode lama sebelum mengubah apa pun.
2. **Periksa kontrak.** Buka `docs/kontrak/endpoint.md` (bagian 3.1 dan 3.3)
   dan `docs/kontrak/payload.md` untuk modul itu. Bila ada field yang
   meragukan, periksa validator dan service backend sebelum memutuskan.
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
