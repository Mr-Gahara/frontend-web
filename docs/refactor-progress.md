# Status Refactor Frontend Web

Dokumen ini adalah titik masuk untuk melanjutkan pekerjaan refactor di sesi
baru. Isinya: keadaan sekarang, keputusan rancangan yang mengikat, cara kerja,
dan rencana berikutnya.

Perbarui dokumen ini setiap kali satu modul selesai; caranya ada di bagian 11.

---

## 0. Memulai sesi baru

Kirim ini sebagai pesan pertama:

```bash
cd ~/Documents/frontend-web && cat docs/refactor-progress.md && git log --oneline -12 && git status --short
```

Riwayat commit adalah bagian dari konteks: alasan di balik tiap keputusan
tercatat lengkap di pesan commit, bukan hanya di dokumen ini. Untuk pertanyaan
tentang endpoint, bentuk data, atau izin, rujuk `docs/kontrak-api.md`.
Pastikan juga helper di `~/.cache/frontend-web/alat/` masih ada (bagian 7, Helper penggantian).

**Pastikan `git status` bersih sebelum memulai modul baru.** Bila ada perubahan
yang belum di-commit, selesaikan atau buang dulu, agar `git diff` tetap dapat
dipakai memeriksa pekerjaan yang sedang berjalan.

### Menjalankan aplikasi

```bash
cd ~/Documents/backend-js && npm run dev
cd ~/Documents/frontend-web && npm run dev
```

Backend harus berjalan lebih dulu: seluruh spec e2e memakai backend sungguhan,
bukan mock, sehingga akan gagal bila backend mati.

---

## 1. Konteks proyek

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
| `docs/` | `kontrak-api.md` dan dokumen ini |

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

---

## 2. Fase yang sudah selesai

### Fase 0 — Perbaikan bug dan konfigurasi test
Commit `751f4db` sampai `06857e1`. Pemisahan runner Playwright dan Vitest,
perbaikan auth, produk, reservasi, jadwal, pola roster, dan pengguna.

Keputusan produk yang dihasilkan dan tidak boleh dibalik tanpa pembahasan:

- **Onboarding hanya lewat aplikasi.** Bila login akun menjawab `requireSetup: true`,
  web menampilkan pesan yang mengarahkan ke aplikasi Tachyon POS, tanpa menyimpan
  sesi dan tanpa berpindah halaman. Halaman `/register` dihapus.
- **PIN tepat 6 digit angka.** Input menyaring non-digit, dan validasi memakai
  `/^\d{6}$/`.
- **Pola roster memakai hapus permanen**, bukan arsip. Backend tidak memiliki
  field `status` pada pola roster, sehingga UI memperingatkan penghapusan permanen.
- **`aksesType` default `["web"]`** saat membuat pengguna dari web.
- **Dialog hanya tertutup bila simpan berhasil.** `onSave` dan `onDelete`
  mengembalikan `Promise<void>`, dan `confirmDelete` memanggil `preventDefault`
  agar dialog bertahan selama mutation berjalan.
- **ESLint memblokir import dari `__tests__`, `__fixtures__`, dan `__mocks__`**
  di `app`, `components`, `hooks`, `lib`, dan `types`.

### Fase 1 — Audit kontrak API
Commit `668951d`, `7f05c24`. Hasilnya `docs/kontrak-api.md` (1226 baris saat dibuat):
246 route backend, bentuk respons tiap endpoint, aturan payload, kebutuhan izin
per halaman, dan daftar ketidaksesuaian.

**Kontrak itu adalah acuan utama.** Setiap keputusan tentang endpoint, bentuk
data, atau izin harus diturunkan dari sana, bukan dari dugaan.

Cara membacanya sesuai keperluan:

| Keperluan | Bagian |
|---|---|
| Path, method, auth, dan permission sebuah endpoint | 3.1, dikelompokkan per modul |
| Bentuk respons GET, sebagai dasar menulis tipe | 3.3 |
| Field payload operasi tulis, yang wajib dan yang diisi server | 4 |
| Izin yang dibutuhkan sebuah halaman | 5 |
| Ketidakselarasan yang sudah tercatat beserta pemiliknya | 6 |
| Seluruh 246 route backend, termasuk yang belum dipakai | Lampiran A |

Kontrak itu terikat pada commit backend `4310d1c` (18 September 2026). Bila
backend berubah cukup jauh, bagian 3 sampai 5 dan Lampiran A perlu dibangkitkan
ulang, dan bagian 1 dokumen itu menjelaskan cara pembangkitannya. Gejala bahwa
kontrak sudah tertinggal: endpoint yang dipanggil menjawab 404, permission yang
tercatat tidak lagi diperiksa, atau bentuk respons berbeda dari tipe.

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
| Inventaris: stock opname | `refactor(stock-opname)`; hash diisi pada pembaruan dokumen berikutnya | Selesai |
| Cakupan lokasi owner dan staf: jurnal stok dan stok outlet | - | **Berikutnya** (bagian 12) |
| Inventaris: pengajuan, transfer | - | Belum |
| Penjualan dan pembayaran | - | Belum |
| Reservasi | - | Belum |
| Keuangan | - | Belum |
| Jadwal dan shift | - | Belum |
| Gudang: dashboard, pengaturan, setup | - | Belum. Halaman stok gudang dikerjakan di modul inventaris (bagian 12): jurnal stok, inventaris gudang, dan stock opname sudah, pengajuan, transfer, dan pengiriman belum; pengguna gudang sudah ikut modul Pengguna (`7275d14`); jadwal gudang dijadwalkan di modul Jadwal dan shift |

Keputusan produk dari modul produk dan kategori:

- **Hapus kategori yang masih dipakai produk dicegah di frontend.** Dialog
  menyebut jumlah produk dan menonaktifkan Lanjutkan. Bila pengguna tidak
  boleh membaca produk, dialog hanya memperingatkan.
- **Produk yang kategorinya sudah dihapus** tampil "Tanpa kategori" dan harus
  dipilihkan kategori baru sebelum disimpan.
- **Satuan resep dibatasi** ke gram, ml, pcs, kg, dan liter, sesuai validator
  backend.
- **Bug stok saat edit produk ditangani di frontend**: resep hanya dikirim bila
  perlu. Bila resep dihapus seluruhnya, backend tetap menjadikan stok 0, dan
  form memberi petunjuk agar stok diatur ulang.

Keputusan produk dari submodul stock adjustment:

- **Data yang terbukti salah dari backend tidak ditampilkan sebagai nilai.**
  Saldo sistem, koreksi, dan alasan adjustment tampil sebagai `-` atau
  keterangan "belum dikirim server", bukan 0 atau "tidak ada alasan"
  (kontrak bagian 6 butir 18).
- **Kolom sumber dihapus** dari daftar dan detail, karena respons tidak
  membawa `referenceType` dan kolom lama hanya mengulang nomor jurnal.

Keputusan produk dari submodul jurnal stok:

- **Kegagalan memuat tidak lagi tampil sebagai daftar kosong.** Tabel
  menampilkan pesan error, dan halaman outlet membedakan "gagal memuat
  lokasi" dari "lokasi belum dikonfigurasi".

Keputusan produk dari submodul stok dan inventaris gudang:

- **Gagal mengubah batas minimum atau opname di gudang kini menampilkan
  pesan.** Sebelumnya dialog tetap terbuka tanpa keterangan apa pun.
- **Perilaku lain dipertahankan**: catatan opname tetap wajib, opname tanpa
  selisih tetap diizinkan, dan pilihan "Semua Lokasi" di outlet tetap
  menampilkan stok seluruh lokasi bertipe Outlet. Pembatasan untuk staf
  menyusul lewat keputusan cakupan dari submodul stock opname.

Keputusan produk dari submodul stock opname:

- **Cakupan lokasi di ruang outlet mengikuti peran.** Owner melihat seluruh
  outlet dengan pemilih lokasi (bawaan "Semua Outlet"); staf hanya lokasi
  aktifnya. Dokumen gudang tetap di ruang gudang. Owner dikenali lewat
  `useLevelPenggunaAktif` (bagian 5 butir 2). Pembatasan ini hanya di
  tampilan, karena backend mengirim data seluruh tenant kepada pemegang izin
  baca (kontrak bagian 6 butir 20). Aturan yang sama diterapkan ke jurnal
  stok dan stok outlet dalam commit terpisah (bagian 12).
- **Membuat opname di outlet tetap memakai lokasi aktif** untuk semua
  pengguna, termasuk owner, karena opname adalah hitungan fisik di tempat.
- **Tombol aksi disembunyikan sesuai izin**: `submit-stock-opname` untuk
  menghitung dan mengajukan, `review-stock-opname` untuk menyetujui, menolak,
  dan membatalkan (bagian 5 butir 14).
- **Pembatalan tersedia untuk DRAFT, SUBMITTED, dan REJECTED** bagi pemegang
  izin tinjau, sejalan dengan backend. Sebelumnya hanya dari SUBMITTED.
- **Simpan sementara hanya mengirim hitungan yang terisi**, karena backend
  menolak isian kosong (kontrak bagian 6 butir 19). Bila belum ada hitungan,
  pesan tampil tanpa memanggil backend.
- **Dialog aksi hanya tertutup saat berhasil**; saat gagal tetap terbuka
  beserta isiannya (keputusan Fase 0).
- **Detail membedakan dokumen yang tidak ditemukan dari kegagalan memuat.**
- **Gate daftar stock opname outlet ditambah `read-location`**, karena
  cakupan staf memanggil `/location/current`.

---

## 3. Fondasi yang sudah tersedia

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
diperbaiki bersama modulnya (bagian 4, langkah 3).

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
stock adjustment, jurnal stok, stok, dan stock opname:

- `api.ts` — pemanggilan endpoint memakai `apiData` dan `EP`
- `hooks.ts` — `useQuery` dan `useMutation`, termasuk aturan invalidasi. Hook mutation menerima `onSuccess` dan `onError` dari halaman untuk toast dan reset dialog (bagian 5 butir 13)
- `schema.ts` — skema Zod untuk form
- `halaman-*.tsx` — komponen halaman bersama bila outlet dan gudang memakai halaman yang sama
- `form-*.tsx` — komponen form bersama untuk mode buat dan edit
- `payload.ts`, `pesan.ts`, `izin.ts`, `tampilan.ts`, `filter.ts` — fungsi murni untuk penyusunan payload, penerjemahan pesan error, aturan izin endpoint, penyiapan data tampilan, dan penyaringan daftar di klien (bagian 5, butir 9 sampai 11)

Isi tiap `features/` yang sudah ada:

| Folder | Berkas | Catatan |
|---|---|---|
| `bahan-baku` | `api.ts`, `hooks.ts`, `schema.ts` | Modul percontohan Fase 2. Lokasi dan stok diambil dari `features/inventaris`; `useDaftarBahanBaku` juga dipakai inventaris gudang untuk master bahan baku |
| `inventaris` | `api.ts`, `hooks.ts`, `lokasi.ts`, `cakupan.ts`, `pemilih-lokasi-outlet.tsx`, `pesan-lokasi.tsx` | Lintas halaman inventaris; dipakai bahan baku, jurnal stok, stok outlet, inventaris gudang, dan stock opname. Lokasi: `useDaftarLokasi` dan `useLokasiBertipe` berbagi kunci `lokasi.daftar()`, sedangkan `useLokasiAktif` menyeragamkan cache lewat `lokasiTunggal`. Stok: `useDaftarInventory` (argumen `null` berarti belum siap; tanpa `locationID` berarti semua lokasi), `useUbahStokMinimum`, `useOpnameInventory`, dan `useTambahInventory`. Cakupan: `useCakupanLokasiOutlet` (owner seluruh outlet, staf lokasi aktif) dengan fungsi murni `tentukanCakupan` dan `lingkupOutlet`, serta komponen `PemilihLokasiOutlet` dan `PesanLokasi`. Satu-satunya tempat hook lokasi, inventory, dan cakupan |
| `pengguna` | `api.ts`, `hooks.ts`, `halaman-pengguna.tsx` | Komponen halaman dipakai outlet dan gudang |
| `role` | `api.ts`, `hooks.ts`, `constants.ts`, `form-role.tsx` | `form-role.tsx` dipakai halaman edit dan kostum; `useLevelPenggunaAktif` dipakai lintas modul |
| `produk` | `api.ts`, `hooks.ts`, `schema.ts`, `payload.ts`, `izin.ts`, `form-produk.tsx` | `form-produk.tsx` dipakai halaman buat dan edit; `useDaftarProduk` dipakai halaman kategori, pajak, dan buat penjualan; `bolehBacaProduk` menerima `read-produk` atau `akses-pos` |
| `kategori` | `api.ts`, `hooks.ts`, `schema.ts`, `pesan.ts` | `useDaftarKategori` dipakai form produk; `pesan.ts` menentukan field duplikat karena respons backend tidak dapat diandalkan |
| `stock-adjustment` | `api.ts`, `hooks.ts`, `tampilan.ts` | Hanya baca; `useStockAdjustment` tidak mengulang permintaan saat 404; `tampilan.ts` menampilkan `-` untuk nilai yang salah dari mapper backend, dikendalikan `MAPPER_ADJUSTMENT_SUDAH_BENAR` |
| `jurnal-stok` | `api.ts`, `hooks.ts`, `filter.ts`, `tampilan.ts`, `halaman-jurnal-stok.tsx` | Hanya baca; komponen halaman dipakai outlet dan gudang, dibedakan lewat `ruang`, `lingkup` (lokasi aktif atau tipe lokasi), dan `penghalang` |
| `stock-opname` | `api.ts`, `hooks.ts`, `payload.ts`, `izin.ts`, `halaman-daftar-stock-opname.tsx`, `halaman-detail-stock-opname.tsx`, `form-buat-stock-opname.tsx` | Ketiga komponen dipakai outlet dan gudang lewat `ruang` dan `TEKS`. Daftar menerima `lingkup` dan `pemilihLokasi`; form buat menerima `sumberLokasi` (tetap atau pilih). `payload.ts` hanya mengirim hitungan yang terisi; `izin.ts` memuat `bolehHitungOpname` dan `bolehTinjauOpname`; `useStockOpname` tidak mengulang permintaan saat 404 |

Cara memeriksa apakah sebuah modul sudah dimigrasikan: halamannya tidak lagi
memanggil `apiClient`, dan lapisan datanya ada di `features/<modul>/` atau di
`features/` lintas modul (halaman stok memakai `features/inventaris`).

### `components/providers/`

- `query-provider.tsx` — penyedia TanStack Query.
- `session-provider.tsx` — memulihkan sesi saat aplikasi dimuat, dengan
  memanggil refresh akun lalu refresh pengguna. Keduanya dipasang di
  `app/layout.tsx`.

---

## 4. Langkah migrasi satu modul

Urutan yang dipakai pada bahan baku, pengguna, role, produk, kategori, stock
adjustment, jurnal stok, stok, dan stock opname, dan terbukti menjaga `tsc`
tetap hijau di tiap langkah:

1. **Petakan keadaan.** Hitung baris tiap berkas, cari pemakaian `apiClient`,
   `any`, `_id`, dan `queryKey`. Bila ada dua halaman serupa (outlet dan
   gudang), bandingkan dengan `diff` untuk mengetahui apakah keduanya kembar.
   Bila modul belum punya spec e2e, tulis spec pembanding untuk perilaku yang
   ada dan jalankan terhadap kode lama sebelum mengubah apa pun.
2. **Periksa kontrak.** Buka `docs/kontrak-api.md` bagian 3.1, 3.3, dan 4 untuk
   modul itu. Bila ada field yang meragukan, periksa validator dan service
   backend sebelum memutuskan.
3. **Perbaiki tipe** di `types/` agar memakai `id` dan sesuai bentuk respons
   nyata. Jalankan `tsc`; error yang muncul adalah peta migrasinya. Bereskan
   seluruh error itu dulu (umumnya penggantian `_id` menjadi `id`) sampai `tsc`
   hijau kembali, sebelum melangkah ke berkas `features/`. Dengan begitu tiap
   langkah tetap dapat di-commit. `tsc` hijau belum berarti aman bila pembaca
   entitas itu masih memakai `apiClient` lama, karena data mentahnya masih
   membawa `_id` (bagian 3).
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
10. **Commit** dengan pesan lengkap, lalu perbarui dokumen ini (bagian 11).

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
- Pelajaran dari debug dan perbaikan selama modul ini sudah dicatat di bagian 7
- Sudah di-commit dan di-push
- Dokumen ini, dan `docs/kontrak-api.md` bila ada perubahan kontrak, diperbarui
  lalu diperiksa ulang utuh sebelum commit (bagian 11)

## 5. Keputusan rancangan yang mengikat

1. **Tipe selalu memakai `id`**, tidak pernah `_id`, karena `lib/api/client.ts` menormalkan respons. Pola `id || _id` tidak boleh ditulis lagi.
2. **Owner tidak diperlakukan khusus** lewat pengecekan nama role. Backend memberi Owner seluruh permission, sehingga pemeriksaan berbasis daftar permission sudah mencakupnya. Pengecualian: `useLevelPenggunaAktif` memakai nama role untuk menentukan level 100, karena token tidak membawa level. Cakupan data lintas lokasi di ruang outlet juga mengikuti level itu (100 berarti owner) lewat `useCakupanLokasiOutlet`; halaman tidak memeriksa nama role sendiri.
3. **Invalidasi memakai akar domain** bila perubahan bisa memengaruhi beberapa varian. Kunci akar (`semua`) hanya untuk invalidasi, tidak untuk menyimpan data: halaman gudang lama memakai `queryKeys.bahanBaku.semua` sebagai kunci data master bahan baku.
4. **Field yang dipakai service tetapi tidak ada di validator** harus diperiksa sebelum dihapus dari payload (lihat `docs/kontrak-api.md` bagian 1, butir keterbatasan).
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
    Tampilkan `-` beserta keterangan singkat, dan kendalikan penanganannya
    dengan satu konstanta di `tampilan.ts` (misalnya
    `MAPPER_ADJUSTMENT_SUDAH_BENAR`) agar pembersihannya cukup satu perubahan.
    Angka palsu seperti koreksi 0 pada audit trail lebih menyesatkan daripada
    kolom kosong.
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

---

## 6. Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul:

| Hal | Awal | Setelah submodul stock opname | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 101 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di bagian 11). Berkurang tiap modul yang dimigrasikan |
| Kemunculan `_id` | - | 120 | Dihitung di `app`, `components`, dan `features` (perintah di bagian 11), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id || _id` |
| `useAuthGuard()` berulang di halaman | 49 | 42 | Dihitung di `app/` saja. Turun karena halaman stock opname menjadi tipis dan pemanggilannya pindah ke komponen di `features/`, bukan karena dipindah ke layout. Rencananya tetap dipindah ke layout |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | - | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | 7 | Sempat 8 karena berkas lain tumbuh; kembali 7 setelah form produk disatukan. Berkurang saat modulnya dimigrasikan |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## 7. Cara kerja

### Alur setiap perubahan

1. Komparasi lama dan baru, ditulis lengkap tanpa placeholder.
2. Blok perintah siap tempel yang menerapkannya (menjalankannya adalah persetujuan).
3. Perintah verifikasi: `tsc`, ESLint, dan pemeriksaan hasil.
4. Menjalankan test yang ada, menambah skenario untuk perubahan itu, menjalankan ulang.
5. Sebelum commit: vitest penuh dan suite e2e penuh, dibandingkan dengan
   baseline. Seluruhnya harus lolos, bukan hanya spec modul.
6. Setelah lolos: `git add`, commit dengan pesan lengkap (masalah, keputusan rancangan beserta alasan, dampak, pengujian), lalu push.

Tidak ada perubahan yang diterapkan tanpa persetujuan. Komparasi dan blok
penerapnya dikirim dalam respons yang sama, dan menjalankan blok itulah bentuk
persetujuannya. Setelah dijalankan, hasilnya diverifikasi sebelum melangkah ke
perubahan berikutnya.

### Aturan blok perintah

- Hanya berisi perintah, tanpa baris komentar atau judul di dalamnya.
- Efisien, tidak memakai pager, output ringkas dan mudah disalin.
- Berkas baru diberikan sebagai isi lengkap untuk dibuat manual, tanpa perintah
  terminal. Perubahan pada berkas yang sudah ada tetap lewat terminal karena
  harus presisi. Pengecualian: berkas baru yang dibangun dari salinan berkas
  lama (misalnya komponen form bersama) dibuat dengan `cp` lalu diubah lewat
  helper, agar isi lamanya tidak diketik ulang.
- Satu blok untuk satu berkas atau satu tujuan. Blok yang panjang tidak dapat
  dijalankan sekaligus dan mudah terpotong saat ditempel.

### Helper penggantian

Penggantian teks memakai skrip Node inline yang menolak bila jumlah kecocokan
bukan satu, sehingga tidak ada penggantian ambigu:

```bash
node -e '
const fs = require("fs");
const f = "path/ke/berkas.tsx";
const isi = fs.readFileSync(f, "utf8");
const lama = `...`;
const baru = `...`;
if (isi.split(lama).length - 1 !== 1) { console.error("GAGAL"); process.exit(1); }
fs.writeFileSync(f, isi.replace(lama, () => baru));
console.log("OK");
'
```

Untuk penggantian di banyak berkas, kumpulkan pasangan dalam array dan tulis
berkas hanya bila seluruhnya cocok.

Tiga helper disimpan di `~/.cache/frontend-web/alat/`, bersebelahan dengan cache
kontrak. Sampai submodul stok, helper disimpan di `/tmp`, dan folder itu dua
kali dikosongkan sistem dalam sehari: sekali membuat perbaikan dokumen tidak
masuk sebelum commit (`b0d11d2` menyusulkannya). Skrip sekali pakai tetap di
`/tmp`. Periksa dengan `ls ~/.cache/frontend-web/alat` sebelum blok pertama sesi, dan buat
ulang bila hilang:

```bash
mkdir -p ~/.cache/frontend-web/alat
cat > ~/.cache/frontend-web/alat/ganti.js <<'EOF'
const fs = require("fs");
module.exports = (f, pasangan, rapikan) => {
  let isi = fs.readFileSync(f, "utf8");
  for (const [lama, baru] of pasangan) {
    const n = isi.split(lama).length - 1;
    if (n === 1) {
      isi = isi.replace(lama, () => baru);
      continue;
    }
    console.error("GAGAL " + f + " (" + n + "): " + lama.slice(0, 70).replace(/\n/g, " | "));
    process.exit(1);
  }
  if (rapikan) isi = isi.replace(/^[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n");
  fs.writeFileSync(f, isi);
  console.log("OK " + f + " (" + pasangan.length + " pasangan)");
};
EOF
cat > ~/.cache/frontend-web/alat/ganti-baris.js <<'EOF'
const fs = require("fs");
module.exports = (f, awal, akhir, iAwal, iAkhir, baru) => {
  const baris = fs.readFileSync(f, "utf8").split("\n");
  const a = baris.indexOf(awal);
  const z = baris.indexOf(akhir, a);
  if (a !== iAwal || z !== iAkhir) {
    console.error("GAGAL jangkar " + f + " " + a + " " + z);
    process.exit(1);
  }
  baris.splice(a, z - a + 1, baru);
  fs.writeFileSync(f, baris.join("\n"));
  console.log("OK " + f + " baris " + (a + 1) + "-" + (z + 1));
};
EOF
cat > ~/.cache/frontend-web/alat/hitung-eslint.js <<'EOF'
let d = "";
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  const r = JSON.parse(d || "[]");
  console.log(r.reduce((s, x) => s + x.errorCount, 0));
});
EOF
```

- `ganti.js`: dipanggil dengan ``node -e 'require(process.env.HOME + "/.cache/frontend-web/alat/ganti.js")("berkas", [[`lama`, `baru`]])'``.
  Berkas hanya ditulis bila setiap pasangan cocok tepat satu kali. Argumen
  ketiga `true` merapikan baris kosong berlebih.
- `ganti-baris.js`: mengganti rentang baris dari jangkar awal sampai jangkar
  akhir, dengan indeks yang diharapkan sebagai pengaman. Indeks diambil dari
  `grep -n` yang mencetak kedua jangkar di blok yang sama (nomor baris dikurangi
  satu).
- `hitung-eslint.js`: menjumlahkan error dari `eslint -f json`.
- Di dalam template literal skrip, backtick dan tanda dolar yang diikuti kurung
  kurawal ditulis dengan escape, dan tanda miring terbalik ditulis ganda agar
  sampai ke berkas. Hindari kutip bersarang di konten yang disisipkan.
- Untuk menyisipkan kutip tunggal ke dalam argumen `node -e '...'`, tulis
  `'"'"'` (tutup kutip, kutip tunggal di dalam kutip ganda, buka kutip lagi),
  atau pakai skrip heredoc berisi string JavaScript.

**Catatan penting**: blok panjang kadang tertempel dua kali di terminal. Bila
sebuah penggantian melaporkan 0 kecocokan padahal seharusnya ada, periksa dulu
apakah perubahannya sudah masuk dari tempelan pertama, sebelum menyimpulkan
polanya salah.

### Catatan shell (zsh)

- Tanda `!` di dalam kutip tunggal (`node -e '...'`) dan di heredoc
  berdelimiter kutip (`<<'EOF'`) terbukti aman: skrip modul produk yang
  memuat `!==` berjalan normal. Di luar dua bentuk itu, jalankan
  `setopt nobanghist` lebih dulu atau hindari `!`. Contoh yang pernah terjadi:
  pola grep berkutip ganda yang memuat `!` membuat zsh menunggu masukan
  (`dquote>`) dan menyisipkan perintah dari riwayat.
- Pola glob yang tidak cocok menghasilkan `no matches found` dan menghentikan
  perintah. Pesan itu datang dari zsh sendiri, sehingga `2>/dev/null` tidak
  meredamnya. Untuk berkas yang mungkin tidak ada, pakai `find`, misalnya
  `find test-results -name trace.zip | head -1`. Folder `test-results`
  dikosongkan di setiap run, sehingga hasilnya selalu dari run terakhir.
- Path berisi `[id]` selalu dikutip, karena kurung siku dibaca sebagai pola glob.
- Perintah git yang dapat membuka pager ditulis `git --no-pager`.
- Argumen berpola seperti `--include=*.ts` pada grep juga terkena ekspansi
  glob. Kutip polanya: `--include='*.ts'`.
- Variabel berisi daftar berkas tidak dipecah menjadi beberapa argumen di zsh,
  berbeda dengan bash: `grep pola $F` mengirim seluruh daftar sebagai satu nama
  berkas (`No such file or directory` dengan nama berisi banyak baris). Simpan
  daftarnya ke berkas lalu pakai `tr '\n' '\0' < daftar | xargs -0 grep ...`,
  atau baca per baris dengan `while read f; do ...; done`.

### Catatan form (React Hook Form dan Zod)

- **Hindari `z.coerce`.** Ia membuat tipe input dan output skema berbeda,
  sehingga `useForm<T>` dengan satu parameter tipe bentrok dengan resolver.
- Untuk input angka, pakai `z.number()` di skema dan
  `register("field", { valueAsNumber: true })` di komponen. Tanpa itu, nilai
  terkirim sebagai string dan validasi menahan submit tanpa pesan yang terlihat.
- Bila isian kosong harus bernilai 0 (bukan NaN), pakai `setValueAs: keAngka`
  dari `features/produk/schema.ts` sebagai pengganti `valueAsNumber`.
- Hindari `.default()` di skema form. Ia juga membuat tipe input dan output
  berbeda. Nilai awal diberikan lewat `defaultValues`.
- Input yang judulnya bukan `label` (misalnya `h3`) dihubungkan lewat
  `aria-labelledby`, sehingga tetap dapat dipilih dengan nama aksesibel.
- Skema buat dan edit disatukan bila entitasnya sama; field yang hanya relevan
  saat membuat dibuat opsional.
- Setiap `label` wajib punya `htmlFor` dan input punya `id` yang sepadan.
  Tombol ikon tanpa teks wajib punya `aria-label`.
- `AlertDialogAction` dari Radix menutup dialog secara bawaan saat diklik.
  Bila dialog harus bertahan sampai operasi berhasil (keputusan Fase 0),
  panggil `e.preventDefault()` di `onClick`. Bug hapus bahan baku (`50e8815`)
  berasal dari sini.

### Perintah verifikasi yang biasa dipakai

```bash
echo "tsc: $(npx tsc --noEmit > /tmp/t.log 2>&1; echo $?)"; grep 'error TS' /tmp/t.log | cut -c1-110 | head -5
npx eslint features app components lib 2>&1 | tail -3
npx vitest run 2>&1 | tail -5
npx playwright test tests/e2e/<modul> --reporter=line 2>&1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' | tail -3
```

Menjalankan satu test saja, dan memeriksa ketahanannya terhadap flakiness:

```bash
npx playwright test tests/e2e/<modul> -g "<potongan judul>" --reporter=line 2>&1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' | tail -3
npx playwright test tests/e2e/<modul> -g "<potongan judul>" --repeat-each 3 --reporter=line 2>&1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' | tail -3
```

Membandingkan jumlah error ESLint sebuah berkas terhadap `HEAD`, untuk
memisahkan error baru dari error warisan (memakai `~/.cache/frontend-web/alat/hitung-eslint.js`):

```bash
f=path/ke/berkas.tsx; echo "sekarang:$(npx eslint "$f" -f json 2>/dev/null | node ~/.cache/frontend-web/alat/hitung-eslint.js) HEAD:$(git show "HEAD:$f" | npx eslint --stdin --stdin-filename "$f" -f json 2>/dev/null | node ~/.cache/frontend-web/alat/hitung-eslint.js)"
```

Ringkasan e2e dengan daftar kegagalan:

```bash
npx playwright test tests/e2e --reporter=json > /tmp/p.json 2>/dev/null; node -e '
const r=require("/tmp/p.json");const s=r.stats;
console.log(`e2e passed:${s.expected} failed:${s.unexpected} flaky:${s.flaky} skipped:${s.skipped}`);
const jalan=(su)=>su.forEach(x=>{(x.specs||[]).forEach(sp=>sp.tests.forEach(t=>t.results.forEach(res=>{if(res.status==="failed"||res.status==="timedOut")console.log("GAGAL: "+sp.title.slice(0,80))})));if(x.suites)jalan(x.suites)});
jalan(r.suites);'
```

Suite e2e penuh memakan 8 sampai 12 menit karena berjalan dengan satu worker
dan memakai backend sungguhan. Saat iterasi cukup jalankan spec modul yang
sedang dikerjakan. **Sebelum setiap commit, vitest penuh dan suite e2e penuh
wajib dijalankan dan seluruhnya lolos**, dengan baseline sebagai pembanding.

**Baseline per submodul stock opname** (commit `refactor(stock-opname)`): 113
test unit dan integrasi lolos, 192 e2e lolos, 4 skipped: dua `test.fixme` yang
menunggu backend dan dua `test.skip` bersyarat data (bagian 8). Angka ini pembanding
untuk memastikan tidak ada yang hilang diam-diam. Angka skipped dapat berubah
bila data uji berubah; periksa judul test yang dilewati sebelum menyimpulkan
ada yang hilang. Setiap run suite penuh menambah tiga dokumen stock opname
berstatus CANCELLED (bagian 8).

### Menelusuri kegagalan e2e

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
gagal; cari dengan `find test-results -name error-context.md`.

### Mengambil informasi dari backend

Backend hanya dibaca, tidak pernah diubah dari sisi frontend. Perintah yang
sering dipakai (`BE=~/Documents/backend-js`):

```bash
BE=~/Documents/backend-js
grep -rn "checkPermission" "$BE/routes/<modul>Route.js" | cut -c1-120
grep -n "wajib\|allowlist\|enum" "$BE/validators/<modul>Validator.js" | cut -c1-120
grep -rn "<namaField>" "$BE/services/<modul>Service.js" | cut -c1-140
```

Untuk menilai apakah sebuah perilaku backend disengaja, lihat riwayatnya. Pada
modul produk, `blame` menunjukkan bahwa pemeriksaan resep yang berbeda di
`create` dan `update` berasal dari satu commit yang sama:

```bash
git -C "$BE" --no-pager blame -L <awal>,<akhir> services/<modul>Service.js | cut -c1-120
git -C "$BE" --no-pager log --format='%h %ad %s' --date=short -5 -- services/<modul>Service.js | cut -c1-120
```

Tiga lapis yang harus dibedakan, karena sering tidak sejalan:

1. **Route** menentukan izin yang diperiksa.
2. **Validator** menentukan field yang diperiksa, tetapi tidak membuang field lain.
3. **Service** dapat memakai field yang tidak ada di validator.

Karena itu, sebelum menghapus sebuah field dari payload frontend, periksa dulu
pemakaiannya di service. Kekeliruan semacam ini pernah terjadi dua kali:
`locationID` dan `stokMinimum` pada bahan baku.

### Cache kontrak API

Hasil pemeriksaan respons nyata tersimpan di
`~/.cache/frontend-web/kontrak/kontrak-respons.json`. Berguna untuk melihat
bentuk respons sebuah endpoint tanpa memanggilnya:

```bash
node -e 'const r=require(process.env.HOME+"/.cache/frontend-web/kontrak/kontrak-respons.json");console.log(JSON.stringify(r["/<endpoint>"].contoh.data[0],null,1).slice(0,400))'
```

### Cara berbagi konteks

Konteks proyek dibagikan dengan menjalankan perintah terminal dan menempel
outputnya, bukan dengan mengunggah berkas. Karena itu setiap perintah harus
ringkas outputnya: batasi jumlah baris, potong lebar dengan `cut -c1-110`,
dan hindari pager.

Untuk kode, informasi diambil bertahap, bukan dengan `cat` seluruh berkas:

1. **Peta** berkas lewat `grep -n` pada baris penting (pemanggilan API, query,
   mutation, state, handler, dialog), atau hunk `diff` saja untuk
   membandingkan dua halaman.
2. **Potongan** yang dibutuhkan lewat `sed -n 'awal,akhirp'`, dengan nomor
   baris dari peta itu.

Satu blok pengambilan dijaga di bawah sekitar 100 baris keluaran. Pengecualian:
pembaruan dokumen selalu memakai isi utuh kedua dokumen (bagian 11), agar
pemeriksaannya cukup sekali.

### Urutan debug kegagalan e2e

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

Contoh nyata: pada modul role, penghapusan tidak pernah terkirim karena
tombol hapus sempat disabled sampai daftar role selesai dimuat (level
pengguna diturunkan dari daftar itu). Tiga dugaan sebelumnya keliru, dan
satu di antaranya memperburuk keadaan. Trace jaringan menjawabnya dalam
satu putaran.

### Disiplin saat menerapkan perubahan

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
  atau gagal dengan alasan yang terlihat, lalu catat di bagian 8 dan, bila
  memang dari backend, di laporan untuk tim backend. Sebelum menyebut
  penyebabnya backend, pastikan dari kode: pada stock opname, pembatalan DRAFT
  ternyata diizinkan backend dan hanya dibatasi tampilan frontend.

### Kapan berhenti dan bertanya

Beberapa keputusan bukan milik sisi teknis dan harus ditanyakan lebih dulu:

- **Keputusan produk**: apakah sebuah data boleh dilihat semua orang, apakah
  sebuah field masih dibutuhkan, bagaimana perilaku yang benar bila backend dan
  UI berselisih.
- **Cakupan pekerjaan yang membengkak**: bila sebuah perbaikan ternyata
  menyeret banyak berkas di luar rencana, sampaikan pilihannya beserta
  konsekuensi masing-masing, jangan diputuskan sendiri.
- **Menandai test `fixme` atau membuang skenario**: mengurangi cakupan uji
  selalu perlu persetujuan.
- **Menghapus field atau perilaku** yang tampak tidak terpakai, sebelum
  dibuktikan bahwa backend memang tidak memakainya.

Sampaikan pilihan secara ringkas beserta alasan condongnya ke mana, lalu
tunggu jawaban.

### Keputusan berdasar bukti

Setiap keputusan harus bersandar pada kode atau output yang benar-benar
diperiksa, bukan pada dugaan dari gejala. Bila sebuah dugaan muncul, verifikasi
dulu dengan perintah, baru lanjut. Beberapa kali dugaan yang masuk akal ternyata
salah, dan pemeriksaan singkat mencegah bug baru.

### Belajar dari setiap putaran

Setiap debug, penelusuran masalah, dan perbaikan adalah bahan untuk
mempercepat putaran berikutnya. Begitu satu masalah selesai, jawab tiga
pertanyaan ini sebelum melangkah:

1. **Apa yang memperlambat?** Dugaan yang meleset, perintah yang outputnya
   terlalu panjang atau gagal, bukti yang diambil terlambat, atau langkah
   yang diulang.
2. **Apa yang akan menemukannya lebih cepat?** Perintah, urutan pemeriksaan,
   atau sumber bukti yang seharusnya dipakai lebih dulu.
3. **Apakah itu akan berulang?** Bila ya, catat di dokumen ini pada bagian
   yang sesuai: pola kegagalan ke tabel di "Urutan debug kegagalan e2e",
   kesalahan penerapan ke "Disiplin saat menerapkan perubahan", perintah baru
   ke "Perintah verifikasi yang biasa dipakai", dan kebiasaan alat ke catatan
   Playwright, form, atau shell.

Catatan ditulis dalam commit modul yang sama atau commit dokumen penutup
modul itu, selagi konteksnya masih segar. Tulis sebagai aturan yang dapat
langsung diterapkan beserta contoh nyata singkat, bukan sebagai kronologi
kejadian. Bila catatan lama terbukti keliru atau ada cara yang lebih cepat,
perbarui catatan itu alih-alih menambah catatan baru yang bertentangan.

### Kredensial uji

- Akun: `toko@gmail.com` / `Toko1234`
- Pengguna: nama `Ridho`, PIN `123456` (berperan Owner)
- Frontend `localhost:3000`, backend `localhost:4000`

### Catatan Playwright

- Radix Select: buka lewat teks yang sedang tampil di trigger, yaitu placeholder (misalnya "Pilih role") atau nilai terpilih (misalnya "Semua Lokasi"), bukan `getByRole("combobox").nth()`, karena Radix merender trigger beserta select tersembunyi.
- Setelah mutation, tunggu permintaan pemuatan ulang selesai sebelum memeriksa tabel, agar tidak berlomba dengan invalidasi cache.
- Toast Sonner menutup sendiri; jangan jadikan satu-satunya bukti keberhasilan.
- Isi Select sebelum input angka, karena perubahan Select memicu render ulang.
- Test yang lolos saat dijalankan sendirian bisa gagal ketika dijalankan
  bersama spec lain, dan sebaliknya. Bila sebuah test baru lolos, jalankan
  ulang bersama spec satu modul sebelum menyimpulkan selesai.
- Jangan menjadikan perpindahan halaman sebagai penanda keberhasilan bila
  mutation-nya sendiri bisa gagal; periksa efeknya pada data, misalnya
  hilangnya baris dari tabel.
- `page.route` hanya dipakai untuk mensimulasikan kegagalan yang tidak dapat
  dibuat backend secara deterministik, dan hanya untuk method serta path yang
  diperlukan. Request lain tetap ke backend sungguhan, dan intersepsi dilepas
  dengan `page.unroute` setelah dipakai.
- Nama data uji dibuat unik per run (misalnya akhiran dari `Date.now()`), agar
  data sisa dari run yang gagal tidak memicu penolakan duplikat.
- Nilai input berformat rupiah diperiksa dengan pola, misalnya
  `toHaveValue(/15\.?000/)`, bukan string persis, karena tampilannya diubah
  oleh format ribuan.
- `getByText(teks, { exact: true })` gagal (strict mode) bila teks yang sama
  tampil di dua tempat. Sempitkan ke elemen pembungkusnya, misalnya
  `getByText(/no\. ref:/i)` lalu `toContainText(nomor)`.
- Untuk halaman yang hanya menampilkan data, ambil data uji dari respons
  server dengan `page.waitForResponse`, lalu bandingkan tampilan dengan isi
  respons itu. Bila halaman sebelumnya (misalnya dashboard setelah login)
  memanggil endpoint yang sama, pasang penunggu setelah
  `page.goto(url, { waitUntil: "commit" })` atau
  `page.reload({ waitUntil: "commit" })`; bila tidak, respons halaman lama
  ikut tertangkap dan isinya sudah dibuang. Pada stock opname, aturan ini
  terlupa di `reload` dan menggagalkan spec alur. Untuk aksi klik, pasang penunggu
  sebelum klik. Baca isi respons segera, seperti helper `tunggu` di spec stok.
- Spec untuk operasi tulis mengembalikan data ke nilai semula, misalnya batas
  minimum dinaikkan 1 lalu dikembalikan, dan opname dikirim dengan fisik sama
  dengan stok. Operasi yang tidak bisa dibatalkan dari UI (tambah barang
  gudang) hanya diuji jalur batal dan gagalnya.
- Simulasi kegagalan GET dengan `page.route` (misalnya status 500) butuh
  timeout sekitar 20 detik pada assertion pesan error, karena TanStack Query
  mengulang permintaan beberapa kali sebelum query dinyatakan gagal.

---

## 8. Test yang ditandai fixme

Menunggu perbaikan backend:

| Test | Menunggu |
|---|---|
| Edit pola roster | Validator memakai `this.siklusHari` dalam konteks `findOneAndUpdate` |
| Hapus pengguna | `Promise.all` paralel di dalam transaksi MongoDB |

Selain itu ada `test.skip` bersyarat data, bukan penantian backend, yang ikut
terhitung di angka skipped pada baseline:

| Spec | Dilewati bila |
|---|---|
| `reservasi/aset/crud-aset.spec.ts` | Tidak ada aset berstatus digunakan |
| `inventaris/stok/lihat-stok.spec.ts`, tab kritis gudang | Tidak ada stok gudang yang kritis (terjadi pada data uji sekarang) |

| `inventaris/stockOpname/alur-stok-opname*.spec.ts`, `draft-stok-opname.spec.ts` | Lokasi aktif outlet atau gudang terpilih masih punya opname DRAFT atau SUBMITTED; backend menjawab 409 (tidak terjadi pada data uji sekarang) |

Skenario lain di spec stok, stock adjustment, jurnal stok, stock opname, dan
hapus bahan baku juga dilewati bila datanya kosong, tetapi tidak terjadi pada
data uji sekarang.

Ketiga spec tulis stock opname membuat dokumen baru di setiap run dan
menutupnya sebagai CANCELLED, sehingga dokumen CANCELLED bertambah tiga per
run suite penuh. Bila spec gagal di tengah, dokumennya tertinggal aktif dan
run berikutnya dilewati sampai dokumen itu dibatalkan dari halaman detail.
Nomornya dapat dibaca dari pesan `POST /api/stockopname` di trace (bagian 7,
Urutan debug kegagalan e2e).

---

## 9. Bila menemukan bug backend

Urutannya:

1. **Verifikasi bahwa itu memang bug backend**, dengan membaca route, validator,
   controller, atau service terkait. Gejala di frontend saja tidak cukup.
2. **Jangan ubah backend.** Frontend menyesuaikan diri agar pekerjaan tidak
   tertahan, misalnya dengan mengirim body kosong pada `pin-refresh`.
3. **Catat penanganan sementara itu di komentar kode**, beserta alasannya, agar
   dapat dibersihkan setelah backend diperbaiki.
4. **Bila perilaku tidak dapat diakali**, tandai skenario ujinya `test.fixme`
   dengan keterangan apa yang ditunggu, lalu catat di bagian 8 dokumen ini.
5. **Setelah commit bersih**, tulis laporan untuk tim backend sebagai teks siap
   salin di percakapan. Berkasnya di `~/Documents/catatan-backend/` dibuat
   sendiri oleh pemilik proyek, bukan lewat terminal.

Bentuk tiap temuan dalam laporan:

- **Bukti** — request dan respons nyata, atau potongan kode beserta nomor baris
- **Penyebab** — apa yang membuatnya terjadi
- **Kenapa penting** — dampaknya bagi pengguna atau frontend lain
- **Saran** — arah perbaikan, tanpa memaksakan implementasi
- **Penanganan sementara di frontend** — agar tim backend tahu apa yang akan
  dibersihkan setelah perbaikan

Temuan diurutkan berdasarkan tingkat kepentingan, dan ditutup tabel ringkasan
prioritas.

## 10. Catatan untuk tim backend

Berkasnya disimpan pemilik proyek di `~/Documents/catatan-backend/`:

- `README.md` — temuan 1 sampai 6 dari Fase 1
- `catatan-lanjutan-backend-hapus-pengguna-dan-aturan-pin.md` — temuan 7 sampai 9
- Laporan Fase 2 — 13 temuan, sudah diserahkan ke tim backend
- Laporan modul produk dan kategori — 8 temuan, disusun 20 September 2026:
  stok tertimpa 0 saat edit produk, hapus kategori tanpa pemeriksaan
  pemakaian, keberadaan kategori tidak diperiksa, field duplikat kategori yang
  salah, satuan resep lebih sempit dari satuan bahan baku, cache daftar produk
  tidak dibersihkan saat kategori berubah, detail produk tanpa timestamp, dan
  import tidak terpakai
- Laporan submodul stock adjustment — 1 temuan, disusun 20 September 2026:
  mapper membaca empat field yang tidak ada di model dan tidak mengirim
  `referenceType`
- Laporan submodul stock opname — 2 temuan, disusun 20 September 2026:
  simpan hitungan menolak isian kosong sehingga simpan sementara sebagian
  tidak mungkin, dan data tidak dibatasi per lokasi (perlu keputusan)

Cakupan laporan Fase 2: `pin-refresh` 500 tanpa body, `GET /shift`
500, validator pola roster, hapus pengguna, field yang dipakai service tetapi
tidak ada di validator, envelope tidak seragam, identitas tidak seragam,
33 endpoint tanpa `checkPermission`, 17 permission tanpa route, nama permission
pengiriman stok tidak sejalan, permission jadwal belum ada, allowlist tidak
universal, dan konfirmasi kebijakan sesi web tunggal.

---

## 11. Cara memperbarui dokumen ini

Perbarui setelah setiap modul selesai dan sudah di-commit, sebagai commit
tersendiri atau disatukan dengan commit modulnya.

**Sebelum commit pembaruan dokumen ini atau `docs/kontrak-api.md`, isi utuh
kedua berkas dibaca ulang** (dikirim ke percakapan) sampai benar, valid,
lengkap, detail, dan relevan, dan pemeriksaan diulang setelah setiap
perbaikan. Setiap pembaruan tidak boleh setengah-setengah: baca kedua berkas
dari awal sampai akhir, cari setiap bagian yang sudah tidak relevan,
tertinggal, atau bertentangan dengan keadaan sekarang, lalu ganti seluruhnya
sampai valid, relevan, benar, detail, dan lengkap, bukan hanya menambah
kalimat di bagian yang baru disentuh. Setiap pemeriksaan melaporkan seluruh
temuan sekaligus: fakta yang tidak sesuai bukti, kalimat yang bertentangan
antarbagian atau antarberkas, angka dan rujukan bagian yang tertinggal, serta
pelajaran yang belum tercatat. Pada modul produk dan kategori, pemeriksaan
yang dicicil per bagian butuh lebih dari lima putaran perbaikan.

Blok commit dokumen diawali `grep -q` atas teks perbaikan terakhir, lalu
`git add` dirangkai dengan `&&`, sehingga commit tidak berjalan bila blok
perbaikan belum dijalankan. Pada submodul stok, commit sempat berjalan
sebelum blok perbaikan dokumen, dan butuh commit susulan.

Yang berubah setiap kali:

| Bagian | Perubahan |
|---|---|
| 2, tabel Fase 3 | Isi commit hash modul yang selesai, tandai modul berikutnya. Bila dokumen di-commit bersama modulnya, tulis judul commit dan ganti dengan hash pada pembaruan berikutnya |
| 3, daftar `features/` | Tambahkan modul baru |
| 6, metrik | Perbarui bila angkanya berubah cukup jauh |
| 7, baseline test | Perbarui jumlah test dan commit acuannya |
| 8, test fixme | Tambah atau hapus bila ada perubahan |
| 12 | Ganti seluruhnya dengan modul berikutnya beserta pemetaan awalnya. Bila pemetaan belum sempat diambil, cantumkan perintahnya sebagai langkah pertama sesi berikutnya |

Yang ditambahkan bila ada:

- **Keputusan rancangan baru** yang berlaku lintas modul, ke bagian 5
- **Pelajaran dari setiap debug, penelusuran, dan perbaikan**, ke bagian 7
  mengikuti aturan "Belajar dari setiap putaran"
- **Temuan backend baru**, ke bagian 8 dan 10, serta ke `docs/kontrak-api.md` bagian 6
- **Perubahan kontrak** yang ditemukan saat migrasi (izin, payload, bentuk
  respons), ke `docs/kontrak-api.md` bagian 3 sampai 5
- **Keputusan produk**, ke bagian 2 di bawah fase terkait

Perintah untuk menyiapkan angka baru:

```bash
cd ~/Documents/frontend-web
grep -rc ": any" app components lib features | grep -v ":0" | awk -F: "{s+=\$2} END {print \"any: \" s}"
grep -rc "_id" app components features | grep -v ":0" | awk -F: "{s+=\$2} END {print \"_id: \" s}"
grep -rlc "useAuthGuard()" app | wc -l
find app components features -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | awk '$1>700 && $2!="total"' | wc -l
npx vitest run 2>&1 | tail -5
```

Bila dokumen ini mulai terasa panjang, pecah bagian 7 menjadi berkas tersendiri
(`docs/cara-kerja.md`) dan tinggalkan rujukan di sini. Jangan memangkas isinya
hanya demi keringkasan: dokumen ini menggantikan ingatan, dan bagian yang
dibuang akan menjadi pertanyaan berulang di sesi berikutnya.

## 12. Pekerjaan berikutnya: modul inventaris (lanjutan)

Modul inventaris terlalu besar untuk satu commit (24 halaman, sekitar 8.900
baris), sehingga dipecah menjadi enam submodul. Setiap submodul punya spec
pembanding, suite penuh, dan commit sendiri, dan dikerjakan dari yang
terkecil (bagian 4 langkah 7).

| No | Submodul | Halaman | Baris | Status |
|---|---|---|---|---|
| 1 | Stock adjustment | outlet: daftar, detail | 431 | Selesai (`a52afbf`) |
| 2 | Jurnal stok | outlet dan gudang: daftar | 617 | Selesai (`98735d4`) |
| 3 | Stok dan inventaris | `outlet/inventaris/stok`, `gudang/inventaris` | 1.094 | Selesai (`ad590f9`) |
| 4 | Stock opname | outlet dan gudang: daftar, detail, buat | 2.544 | Selesai |
| 5 | Pengajuan stok | outlet: daftar, detail, edit, buat; gudang: daftar, detail | 2.298 | Belum |
| 6 | Transfer, pengiriman, penerimaan | gudang: transfer (daftar, detail, edit), pengiriman; outlet: penerimaan (daftar, detail) | 1.950 | Belum |

### Langkah berikutnya: cakupan lokasi di jurnal stok dan stok outlet

Keputusan cakupan dari submodul stock opname (bagian 2) diterapkan ke dua
halaman outlet yang sudah dimigrasikan, sebagai commit tersendiri sebelum
submodul 5:

- **Jurnal stok outlet** saat ini menampilkan lokasi aktif untuk semua
  pengguna. Owner harus bisa melihat seluruh outlet lewat
  `PemilihLokasiOutlet`, sedangkan staf tetap lokasi aktif. Kotak pesan lokasi
  di halamannya diganti `PesanLokasi` dari `features/inventaris`.
- **Stok outlet** saat ini menampilkan seluruh outlet dengan pemilih untuk
  semua pengguna. Staf harus dibatasi ke lokasi aktif tanpa pemilih.
- Keduanya memakai `useCakupanLokasiOutlet` dan `lingkupOutlet`. Gate halaman
  disesuaikan bila halaman mulai memanggil `/location/current`.
- Spec jurnal stok dan stok diperbarui untuk skenario owner. Jalur staf hanya
  teruji di unit test (lihat utang pengujian).

### Pemetaan awal (20 September 2026)

Halaman yang tersisa, dikelompokkan per submodul. Kolom menunjukkan jumlah
baris dan jumlah baris yang memuat pola lama.

| Halaman | Baris | apiClient | any | _id | queryKey |
|---|---|---|---|---|---|
| `outlet/inventaris/pengajuanStok` | 210 | 2 | 1 | 0 | 2 |
| `outlet/inventaris/pengajuanStok/[id]` | 369 | 3 | 3 | 0 | 4 |
| `outlet/inventaris/pengajuanStok/[id]/edit` | 504 | 5 | 7 | 7 | 6 |
| `outlet/inventaris/pengajuanStok/buatPengajuan` | 363 | 4 | 6 | 4 | 4 |
| `gudang/pengajuanStok` | 264 | 2 | 1 | 0 | 2 |
| `gudang/pengajuanStok/[id]` | 588 | 5 | 7 | 1 | 8 |
| `gudang/transferStok` | 267 | 2 | 1 | 0 | 2 |
| `gudang/transferStok/[id]` | 484 | 4 | 5 | 0 | 9 |
| `gudang/transferStok/[id]/edit` | 255 | 3 | 3 | 0 | 4 |
| `gudang/pengirimanStok` | 226 | 2 | 1 | 0 | 2 |
| `outlet/inventaris/penerimaanBarang` | 218 | 3 | 3 | 1 | 3 |
| `outlet/inventaris/penerimaanBarang/[id]` | 500 | 3 | 4 | 8 | 6 |

Pasangan halaman outlet dan gudang yang tersisa (baris beda menurut `diff`
dibanding total baris keduanya):

| Halaman | Beda / total | Penilaian awal |
|---|---|---|
| `pengajuanStok` | 161 / 474 | Periksa bedanya |
| `pengajuanStok/[id]` | 373 / 957 | Peran berbeda (outlet mengajukan, gudang menyetujui); kemungkinan tetap terpisah |

Angka `diff` tidak cukup untuk memutuskan. Jurnal stok (341 dari 617 baris
berbeda, hampir seluruhnya teks) dan stock opname (perbedaan kecil tersebar di
34 hunk) tetap disatukan, sedangkan stok dan inventaris gudang (perbedaan
perilaku tersebar di seluruh berkas) hanya berbagi lapisan `features/`. Baca
isi perbedaannya lewat `diff` tanpa baris `className` sebelum memutuskan.

Perintah untuk mengulang pemetaan:

```bash
find app/dashboard/outlet/inventaris app/dashboard/gudang -name page.tsx | grep -vE "produk|kategori|bahanBaku|pengguna|jadwal|pengaturan|setup|stockAdjustment|jurnalStok|stockOpname|inventaris/stok|gudang/inventaris/page.tsx|gudang/page.tsx" | sort | while read f; do printf "%-58s %4s  apiClient:%s any:%s _id:%s qk:%s\n" "${f#app/dashboard/}" "$(wc -l < "$f")" "$(grep -c apiClient "$f")" "$(grep -cE ': any|as any|<any' "$f")" "$(grep -c _id "$f")" "$(grep -cE 'queryKey' "$f")"; done
```

### Yang sudah diketahui

- `features/inventaris` memuat seluruh hook lokasi, stok, dan cakupan
  (bagian 3). Pakai itu; jangan membuat hook lokasi, inventory, atau cakupan
  baru (bagian 5 butir 12). Mutation baru mengikuti pola callback halaman
  (butir 13), dan tombol aksi mengikuti izin (butir 14).
- Kunci `queryKeys.lokasi.daftar({ tipe })` masih diisi lewat `apiClient`
  dengan bentuk mentah oleh `outlet/inventaris/penerimaanBarang` (Outlet).
  `features/` memakai `lokasi.daftar()` tanpa filter, sehingga tidak
  tertimpa. Ganti di submodul 6.
- Di luar `components/ui`, halaman inventaris hanya mengimpor
  `components/calendar.tsx` (240 baris, 2 `any`). Bereskan di submodul yang
  memakainya.
- Kontrak bagian 6 butir 10: operasi tulis tanpa validator, sebagian besar di
  stok (pengajuan dan transfer). Periksa service sebelum menentukan payload.
- Halaman pengiriman stok gudang memakai `/transferstok`, yang mewajibkan
  `read-transfer-stok` (kontrak bagian 5).
- Kontrak bagian 5 sudah diselaraskan dengan `IZIN_HALAMAN` untuk halaman
  yang disebut di kalimat pembukanya. Baris lain masih mencerminkan keadaan
  sebelum Fase 2; periksa gate yang berlaku di `lib/auth/permissions.ts` dan
  perbarui barisnya saat halamannya dimigrasikan.
- Belum diverifikasi: `inventoryService` (sekitar baris 70) membangun
  `new RegExp(search, "i")` langsung dari masukan pengguna. Dugaannya,
  karakter seperti `(` membuat pencarian stok dijawab 500. Buktikan lewat e2e
  atau trace sebelum dilaporkan ke backend atau ditangani di frontend.
- Spec e2e yang sudah ada di `tests/e2e/inventaris`: bahan baku, produk,
  kategori, stock adjustment, jurnal stok, stok, dan stock opname. Submodul 5
  dan 6 butuh spec pembanding lebih dulu. Pengajuan dan transfer juga punya
  alur tulis; pakai pola spec alur stock opname (dokumen baru per run, ditutup
  di akhir run).
- `app/dashboard/outlet/inventaris/components/` berisi `bahanBakuCombobox.tsx`
  (sudah bebas `any` dan `_id` sejak modul produk) dan `inventaris-nav-tabs.tsx`.

### Utang pengujian

- **Jalur staf pada cakupan lokasi** hanya teruji di unit test
  (`tests/unit/features/inventaris/cakupan.test.ts`), karena satu-satunya akun
  uji (Ridho) berperan Owner. Butuh akun staf dengan lokasi aktif untuk
  menambahkannya ke e2e.
- **Approve stock opname yang berhasil** tidak diuji e2e, karena mengubah
  stok sungguhan. Yang diuji hanya jalur gagalnya.
- **Tambah barang gudang yang berhasil** tidak diuji e2e, karena UI tidak
  punya cara menghapus entri inventory yang terbentuk.

### Spec rujukan

- `tests/e2e/inventaris/kategori/crud-kategori.spec.ts`: spec pembanding yang
  ditulis sebelum migrasi, nama dan kode unik per run, dan simulasi kegagalan
  dengan `page.route` hanya untuk satu method dan path.
- `tests/e2e/inventaris/produk/crud-produk.spec.ts`: form bersama dua mode,
  input tanpa label dipilih lewat nama aksesibel (`aria-labelledby`), dan
  pemeriksaan data setelah halaman edit dibuka ulang.
- `tests/e2e/inventaris/stockAdjustment/lihat-stock-adjustment.spec.ts`:
  halaman hanya baca, data uji diambil dari respons server lewat
  `page.waitForResponse`, `test.skip` bila data kosong, dan pemeriksaan sel
  tabel terhadap isi respons.
- `tests/e2e/inventaris/jurnalStok/lihat-jurnal-stok.spec.ts`: halaman outlet
  dan gudang yang berbagi komponen, jumlah baris tabel dihitung dari respons
  server, filter Radix Select dibuka lewat teks nilainya, dan simulasi
  kegagalan GET dengan `page.route`.
- `tests/e2e/inventaris/stok/lihat-stok.spec.ts`: penunggu dipasang setelah
  `goto(..., { waitUntil: "commit" })`, harapan dihitung dari respons
  permintaan itu sendiri, operasi tulis yang mengembalikan nilai semula,
  aturan tombol nonaktif, dan jalur gagal tambah barang dengan `page.route`
  pada POST saja.
- `tests/e2e/inventaris/stockOpname/lihat-stok-opname.spec.ts`: tabel
  berpaginasi diperiksa lewat dokumen pertama dari respons, dan skenario owner
  (seluruh outlet, pilih satu outlet).
- `tests/e2e/inventaris/stockOpname/alur-stok-opname.spec.ts` dan
  `alur-stok-opname-gudang.spec.ts`: alur tulis lengkap dengan `test.step`,
  dokumen baru per run yang ditutup di akhir, skip bila backend menjawab 409,
  dan baris tabel dipilih menurut urutan respons.
- `tests/e2e/inventaris/stockOpname/draft-stok-opname.spec.ts`: bukti bug
  simpan sebagian (isi payload diperiksa) dan dokumen yang tidak ditemukan.
- `tests/e2e/inventaris/bahanBaku/hapus-bahan-baku.spec.ts`: dialog yang harus
  tetap terbuka saat operasi gagal.

### Utang kecil dari modul produk

- Dialog hapus di halaman daftar produk masih tertutup saat hapus gagal
  (perilaku lama dipertahankan di `53414dd`), bertentangan dengan keputusan
  Fase 0. Samakan dengan halaman kategori: `preventDefault`, tertutup hanya
  saat berhasil, tetap terbuka saat gagal.
- Skenario 4d di spec produk membuka pemilih bahan baku dengan
  `getByRole("combobox").nth(1)`, bertentangan dengan catatan Playwright di
  bagian 7. Ganti dengan tombol berteks "Pilih bahan..." saat spec produk
  disentuh lagi.
- Spec produk memakai nama produk tetap. Satu kegagalan sebelum cleanup
  membuat run berikutnya gagal karena nama duplikat, dan hal itu terjadi pada
  modul ini. Pakai akhiran unik per run seperti spec kategori.
- `features/produk/form-produk.tsx` mengimpor `BahanBakuCombobox` dari
  `app/dashboard/outlet/inventaris/components/`, sehingga `features/`
  bergantung pada `app/`. Pindahkan komponen itu ke `features/bahan-baku`
  atau `components/` saat modul inventaris menyentuhnya.

Catatan: `tests/helpers/storage.ts` masih membaca `sessionStorage` dan sudah
tidak relevan sejak token dipindah ke memori. Berkas itu belum dibersihkan.
