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
| `features/<modul>/` | Api, hooks, schema, dan komponen halaman bersama per modul |
| `components/` | Komponen UI yang dipakai lintas modul, termasuk shadcn di `components/ui/` |
| `lib/` | Fondasi: `api/`, `auth/`, `queryKeys.ts`, `apiClient.ts`, `decodeToken.ts` |
| `types/` | Tipe respons dan payload, diturunkan dari kontrak |
| `tests/e2e/` | Playwright, memakai backend sungguhan |
| `tests/unit/` | Vitest untuk fondasi dan hook |
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
- **Tanpa emoji atau simbol dekoratif** di kode maupun dokumen.

### Komponen per modul

Selain `components/ui/` (shadcn), ada komponen khusus modul yang dipakai
halaman: `components/pengguna/`, `components/shift/`, `components/pola-roster/`,
dan lainnya. Saat memigrasikan sebuah modul, periksa juga komponennya, karena
pola `any` dan `_id` sering bersembunyi di sana.

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
Commit `668951d`, `7f05c24`. Hasilnya `docs/kontrak-api.md` (1226 baris):
246 route backend, bentuk respons tiap endpoint, aturan payload, kebutuhan izin
per halaman, dan daftar ketidaksesuaian.

**Dokumen ini adalah acuan utama.** Setiap keputusan tentang endpoint, bentuk
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
| Role | - | **Berikutnya** |
| Produk dan kategori | - | Belum |
| Inventaris (stok, jurnal, opname) | - | Belum |
| Penjualan dan pembayaran | - | Belum |
| Reservasi | - | Belum |
| Keuangan | - | Belum |
| Jadwal dan shift | - | Belum |
| Gudang | - | Belum |

---

## 3. Fondasi yang sudah tersedia

Seluruh modul baru wajib memakai lapisan ini. Jangan memanggil `apiClient`
langsung dari halaman.

**Status transisi**: mayoritas halaman yang belum dimigrasikan masih memanggil
`apiClient` secara langsung, dan itu memang keadaan yang diharapkan.
`lib/api/client.ts` dibangun sebagai pembungkus di atasnya, bukan pengganti,
agar migrasi dapat berjalan per modul tanpa memecahkan halaman lain. Jangan
menyapu seluruh pemakaian `apiClient` sekaligus; ganti bersama modulnya.

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

### `lib/apiClient.ts` dan `lib/api/client.ts`

Dua nama yang mirip dan mudah tertukar:

- **`lib/apiClient.ts`** adalah klien lama: menangani header, penyegaran token,
  dan pengalihan ke login saat sesi berakhir. Masih dipakai halaman yang belum
  dimigrasikan, dan tetap menjadi lapisan terbawah.
- **`lib/api/client.ts`** adalah pembungkus baru di atasnya, mengekspor `api`
  dan `apiData`. Inilah yang dipakai `features/`.

Halaman yang sudah dimigrasikan tidak memanggil keduanya secara langsung,
melainkan lewat hook di `features/`.

### `lib/api/error.ts`
`ApiError` dengan `status`, `message`, `errors[]`, `code`. Helper:
`isUnauthorized`, `isForbidden`, `isNotFound`, `isConflict`, `isRateLimited`,
dan `pesanError(err, fallback)` untuk menampilkan pesan.

### `lib/api/normalize.ts`
`unwrap` membuka keenam bentuk envelope backend; `normalizeId` mengubah `_id`
menjadi `id` secara rekursif dan membuang `__v`. **Tipe di `types/` selalu
memakai `id`, tidak pernah `_id`.**

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
Pola yang sudah terbukti di bahan baku dan pengguna:

- `api.ts` — pemanggilan endpoint memakai `apiData` dan `EP`
- `hooks.ts` — `useQuery` dan `useMutation`, termasuk aturan invalidasi
- `schema.ts` — skema Zod untuk form
- `halaman-*.tsx` — komponen halaman bersama bila outlet dan gudang memakai halaman yang sama

Isi tiap `features/` yang sudah ada:

| Folder | Berkas | Catatan |
|---|---|---|
| `bahan-baku` | `api.ts`, `hooks.ts`, `schema.ts` | Modul percontohan Fase 2 |
| `inventaris` | `api.ts`, `hooks.ts` | Lintas halaman inventaris; memuat `useLokasiBertipe` dan `useDaftarInventory` |
| `pengguna` | `api.ts`, `hooks.ts`, `halaman-pengguna.tsx` | Komponen halaman dipakai outlet dan gudang |
| `role` | `api.ts`, `hooks.ts` | Memuat `useDaftarRole`, `useRole`, `useDaftarPermission`, `useSimpanRole`, `useHapusRole`, `useLevelPenggunaAktif`; halamannya belum dimigrasikan |

Cara memeriksa apakah sebuah modul sudah dimigrasikan: ada folder
`features/<modul>/`, dan halamannya tidak lagi memanggil `apiClient`.

### `components/providers/`

- `query-provider.tsx` — penyedia TanStack Query.
- `session-provider.tsx` — memulihkan sesi saat aplikasi dimuat, dengan
  memanggil refresh akun lalu refresh pengguna. Keduanya dipasang di
  `app/layout.tsx`.

---

## 4. Langkah migrasi satu modul

Urutan yang dipakai pada bahan baku dan pengguna, dan terbukti menjaga
`tsc` tetap hijau di tiap langkah:

1. **Petakan keadaan.** Hitung baris tiap berkas, cari pemakaian `apiClient`,
   `any`, `_id`, dan `queryKey`. Bila ada dua halaman serupa (outlet dan
   gudang), bandingkan dengan `diff` untuk mengetahui apakah keduanya kembar.
2. **Periksa kontrak.** Buka `docs/kontrak-api.md` bagian 3.1, 3.3, dan 4 untuk
   modul itu. Bila ada field yang meragukan, periksa validator dan service
   backend sebelum memutuskan.
3. **Perbaiki tipe** di `types/` agar memakai `id` dan sesuai bentuk respons
   nyata. Jalankan `tsc`; error yang muncul adalah peta migrasinya. Bereskan
   seluruh error itu dulu (umumnya penggantian `_id` menjadi `id`) sampai `tsc`
   hijau kembali, sebelum melangkah ke berkas `features/`. Dengan begitu tiap
   langkah tetap dapat di-commit.
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
- Sudah di-commit dan di-push
- Dokumen ini diperbarui

## 5. Keputusan rancangan yang mengikat

1. **Tipe selalu memakai `id`**, tidak pernah `_id`, karena respons sudah dinormalkan. Pola `id || _id` tidak boleh ditulis lagi.
2. **Owner tidak diperlakukan khusus** lewat pengecekan nama role. Backend memberi Owner seluruh permission, sehingga pemeriksaan berbasis daftar permission sudah mencakupnya. Pengecualian: `useLevelPenggunaAktif` memakai nama role untuk menentukan level 100, karena token tidak membawa level.
3. **Invalidasi memakai akar domain** bila perubahan bisa memengaruhi beberapa varian.
4. **Field yang dipakai service tetapi tidak ada di validator** harus diperiksa sebelum dihapus dari payload (lihat `docs/kontrak-api.md` bagian 1, butir keterbatasan).
5. **Bug backend tidak diperbaiki dari sini.** Frontend menyesuaikan diri, lalu temuan ditulis untuk tim backend setelah commit bersih.
6. **Setiap tahap harus hijau dan bisa di-commit.** Tipe dan pemakaiannya berubah dalam satu commit.

---

## 6. Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul:

| Hal | Jumlah awal | Catatan |
|---|---|---|
| Pemakaian `any` | 302 | Berkurang tiap modul yang dimigrasikan |
| Pola `id \|\| _id` | 90 | Hilang saat tipe modul diperbaiki |
| `useAuthGuard()` berulang di halaman | 49 | Belum disentuh; rencananya dipindah ke layout |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | Berkurang lewat pemindahan ke `features/` |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## 7. Cara kerja

### Alur setiap perubahan

1. Komparasi lama dan baru, ditulis lengkap tanpa placeholder.
2. Blok perintah siap tempel yang menerapkannya (menjalankannya adalah persetujuan).
3. Perintah verifikasi: `tsc`, ESLint, dan pemeriksaan hasil.
4. Menjalankan test yang ada, menambah skenario untuk perubahan itu, menjalankan ulang.
5. Setelah lolos: `git add`, commit dengan pesan lengkap (masalah, keputusan rancangan beserta alasan, dampak, pengujian), lalu push.

Tidak ada perubahan yang diterapkan tanpa persetujuan. Komparasi selalu
dikirim lebih dulu, dan menjalankan blok perintah itulah bentuk persetujuannya.
Setelah dijalankan, hasilnya diverifikasi sebelum melangkah ke perubahan
berikutnya.

### Aturan blok perintah

- Hanya berisi perintah, tanpa baris komentar atau judul di dalamnya.
- Efisien, tidak memakai pager, output ringkas dan mudah disalin.
- Berkas baru dibuat lewat terminal, bukan diedit manual.

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

**Catatan penting**: blok panjang kadang tertempel dua kali di terminal. Bila
sebuah penggantian melaporkan 0 kecocokan padahal seharusnya ada, periksa dulu
apakah perubahannya sudah masuk dari tempelan pertama, sebelum menyimpulkan
polanya salah.

### Catatan shell (zsh)

- Heredoc yang memuat tanda `!` memicu history expansion. Jalankan
  `setopt nobanghist` lebih dulu, atau hindari `!` di dalam heredoc.
- Pola glob yang tidak cocok menghasilkan `no matches found` dan menghentikan
  perintah. Untuk mencari berkas hasil test, pakai
  `ls -t test-results/*/trace.zip | head -1`.

### Catatan form (React Hook Form dan Zod)

- **Hindari `z.coerce`.** Ia membuat tipe input dan output skema berbeda,
  sehingga `useForm<T>` dengan satu parameter tipe bentrok dengan resolver.
- Untuk input angka, pakai `z.number()` di skema dan
  `register("field", { valueAsNumber: true })` di komponen. Tanpa itu, nilai
  terkirim sebagai string dan validasi menahan submit tanpa pesan yang terlihat.
- Skema buat dan edit disatukan bila entitasnya sama; field yang hanya relevan
  saat membuat dibuat opsional.
- Setiap `label` wajib punya `htmlFor` dan input punya `id` yang sepadan.
  Tombol ikon tanpa teks wajib punya `aria-label`.

### Perintah verifikasi yang biasa dipakai

```bash
echo "tsc: $(npx tsc --noEmit > /tmp/t.log 2>&1; echo $?)"; grep 'error TS' /tmp/t.log | cut -c1-110 | head -5
npx eslint features app components lib 2>&1 | tail -3
npx vitest run 2>&1 | grep -E 'Test Files|Tests '
npx playwright test tests/e2e/<modul> --reporter=line 2>&1 | tail -3
```

Menjalankan satu test saja, dan memeriksa ketahanannya terhadap flakiness:

```bash
npx playwright test tests/e2e/<modul> -g "<potongan judul>" --reporter=line 2>&1 | tail -3
npx playwright test tests/e2e/<modul> -g "<potongan judul>" --repeat-each 3 --reporter=line 2>&1 | tail -3
```

Ringkasan e2e dengan daftar kegagalan:

```bash
npx playwright test tests/e2e --reporter=json > /tmp/p.json 2>/dev/null; node -e '
const r=require("/tmp/p.json");const s=r.stats;
console.log(`e2e passed:${s.expected} failed:${s.unexpected} skipped:${s.skipped}`);
const jalan=(su)=>su.forEach(x=>{(x.specs||[]).forEach(sp=>sp.tests.forEach(t=>t.results.forEach(res=>{if(res.status==="failed"||res.status==="timedOut")console.log("GAGAL: "+sp.title.slice(0,80))})));if(x.suites)jalan(x.suites)});
jalan(r.suites);'
```

Suite e2e penuh memakan 8 sampai 12 menit karena berjalan dengan satu worker
dan memakai backend sungguhan. Untuk pekerjaan sehari-hari cukup jalankan spec
modul yang sedang dikerjakan.

**Baseline per commit `7275d14`**: 76 test unit dan integrasi lolos,
136 e2e lolos, 3 skipped (test.fixme yang menunggu backend). Angka ini
pembanding untuk memastikan tidak ada yang hilang diam-diam.

### Menelusuri kegagalan e2e

Jangan menebak selector. Ambil bukti:

```bash
npx playwright test tests/e2e/<modul> -g "<nama test>" --trace on --reporter=line > /dev/null 2>&1
T=$(ls -t test-results/*/trace.zip | head -1)
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

Snapshot DOM saat gagal ada di `test-results/*/error-context.md`.

### Mengambil informasi dari backend

Backend hanya dibaca, tidak pernah diubah dari sisi frontend. Perintah yang
sering dipakai (`BE=~/Documents/backend-js`):

```bash
BE=~/Documents/backend-js
grep -rn "checkPermission" "$BE/routes/<modul>Route.js" | cut -c1-120
grep -n "wajib\|allowlist\|enum" "$BE/validators/<modul>Validator.js" | cut -c1-120
grep -rn "<namaField>" "$BE/services/<modul>Service.js" | cut -c1-140
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

### Kredensial uji

- Akun: `toko@gmail.com` / `Toko1234`
- Pengguna: nama `Ridho`, PIN `123456` (berperan Owner)
- Frontend `localhost:3000`, backend `localhost:4000`

### Catatan Playwright

- Radix Select: buka lewat teks placeholder-nya (misalnya "Pilih role"), bukan `getByRole("combobox").nth()`, karena Radix merender trigger beserta select tersembunyi.
- Setelah mutation, tunggu permintaan pemuatan ulang selesai sebelum memeriksa tabel, agar tidak berlomba dengan invalidasi cache.
- Toast Sonner menutup sendiri; jangan jadikan satu-satunya bukti keberhasilan.
- Isi Select sebelum input angka, karena perubahan Select memicu render ulang.
- Test yang lolos saat dijalankan sendirian bisa gagal ketika dijalankan
  bersama spec lain, dan sebaliknya. Bila sebuah test baru lolos, jalankan
  ulang bersama spec satu modul sebelum menyimpulkan selesai.
- Jangan menjadikan perpindahan halaman sebagai penanda keberhasilan bila
  mutation-nya sendiri bisa gagal; periksa efeknya pada data, misalnya
  hilangnya baris dari tabel.

---

## 8. Test yang ditandai fixme

Menunggu perbaikan backend:

| Test | Menunggu |
|---|---|
| Edit pola roster | Validator memakai `this.siklusHari` dalam konteks `findOneAndUpdate` |
| Hapus pengguna | `Promise.all` paralel di dalam transaksi MongoDB |

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
5. **Setelah commit bersih**, tulis laporan untuk tim backend di
   `~/Documents/catatan-backend/`.

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

Tersimpan di `~/Documents/catatan-backend/`:

- `README.md` — temuan 1 sampai 6 dari Fase 1
- `catatan-lanjutan-backend-hapus-pengguna-dan-aturan-pin.md` — temuan 7 sampai 9
- Laporan Fase 2 — 13 temuan, sudah diserahkan ke tim backend

Cakupan laporan terakhir: `pin-refresh` 500 tanpa body, `GET /shift`
500, validator pola roster, hapus pengguna, field yang dipakai service tetapi
tidak ada di validator, envelope tidak seragam, identitas tidak seragam,
33 endpoint tanpa `checkPermission`, 17 permission tanpa route, nama permission
pengiriman stok tidak sejalan, permission jadwal belum ada, allowlist tidak
universal, dan konfirmasi kebijakan sesi web tunggal.

---

## 11. Cara memperbarui dokumen ini

Perbarui setelah setiap modul selesai dan sudah di-commit, sebagai commit
tersendiri atau disatukan dengan commit modulnya.

Yang berubah setiap kali:

| Bagian | Perubahan |
|---|---|
| 2, tabel Fase 3 | Isi commit hash modul yang selesai, tandai modul berikutnya |
| 3, daftar `features/` | Tambahkan modul baru |
| 6, metrik | Perbarui bila angkanya berubah cukup jauh |
| 7, baseline test | Perbarui jumlah test dan commit acuannya |
| 8, test fixme | Tambah atau hapus bila ada perubahan |
| 12 | Ganti seluruhnya dengan modul berikutnya beserta pemetaan awalnya |

Yang ditambahkan bila ada:

- **Keputusan rancangan baru** yang berlaku lintas modul, ke bagian 5
- **Pelajaran teknis baru** (Playwright, form, shell), ke bagian 7
- **Temuan backend baru**, ke bagian 8 dan 10
- **Keputusan produk**, ke bagian 2 di bawah fase terkait

Perintah untuk menyiapkan angka baru:

```bash
cd ~/Documents/frontend-web
grep -rc ": any" app components lib features | grep -v ":0" | awk -F: "{s+=\$2} END {print \"any: \" s}"
grep -rc "_id" app components features | grep -v ":0" | awk -F: "{s+=\$2} END {print \"_id: \" s}"
grep -rlc "useAuthGuard()" app | wc -l
npx vitest run 2>&1 | grep "Tests "
```

Bila dokumen ini mulai terasa panjang, pecah bagian 7 menjadi berkas tersendiri
(`docs/cara-kerja.md`) dan tinggalkan rujukan di sini. Jangan memangkas isinya
hanya demi keringkasan: dokumen ini menggantikan ingatan, dan bagian yang
dibuang akan menjadi pertanyaan berulang di sesi berikutnya.

## 12. Pekerjaan berikutnya: modul role

Empat berkas. Hitung ulang jumlah barisnya sebelum mulai, karena angka di
bawah diambil sebelum migrasi tipe pada commit `7275d14`:

| Berkas | Baris | Isi |
|---|---|---|
| `roles/page.tsx` | 416 | Daftar role |
| `roles/buatRole/page.tsx` | 263 | Pilih template role |
| `roles/buatRole/kostum/page.tsx` | 530 | Form role baru |
| `roles/[id]/edit/page.tsx` | 584 | Form edit role |

### Temuan awal

Halaman **edit** dan **kostum** identik sekitar dua pertiga (187 baris berbeda
dari 584 dan 530). Yang membedakan:

| Aspek | Edit | Kostum |
|---|---|---|
| Data awal | `GET /role/:id` | Konstanta `BASIC_PERMISSIONS` |
| Mutation | PUT | POST |
| Permission terlarang | `RESTRICTED_PERMS` disaring dari tampilan, tetapi dipertahankan saat menyimpan lewat `hiddenExistingPerms` | Tidak ada |
| Dialog wewenang dasar | Tidak ada | Ada |
| Judul, tombol kembali, pesan | Berbeda | Berbeda |
| JSX form dan daftar permission | Sama | Sama |

### Rencana

1. `features/role/form-role.tsx` sebagai komponen bersama, menerima judul, `roleId` opsional, nilai awal, izin awal terpilih, dan penanganan permission tersembunyi.
2. Halaman edit dan kostum menjadi pemanggil tipis, seperti halaman pengguna.
3. `roles/page.tsx` dan `buatRole/page.tsx` memakai hooks dari `features/role/hooks.ts` yang sudah ada.

### Yang harus hati-hati

`RESTRICTED_PERMS` dan `hiddenExistingPerms` bukan sekadar tampilan: permission
terlarang yang sudah dimiliki sebuah role **harus ikut terkirim saat menyimpan**,
kalau tidak, izin itu hilang diam-diam. Pastikan perilaku ini terjaga di
komponen bersama, dan tambahkan skenario e2e yang memverifikasinya.

Belum ada spec e2e untuk modul role.

### Spec rujukan

Untuk meniru pola penulisan test, lihat:

- `tests/e2e/pengguna/crud-pengguna.spec.ts` — helper `login`,
  `bersihkanPengguna`, pencarian tabel sebelum memeriksa baris, dan skenario
  lintas ruang kerja
- `tests/e2e/inventaris/bahanBaku/crud-bahan-baku.spec.ts` — alur lengkap
  tambah, cari, edit, hapus dalam satu test dengan `test.step`

Catatan: `tests/helpers/storage.ts` masih membaca `sessionStorage` dan sudah
tidak relevan sejak token dipindah ke memori. Berkas itu belum dibersihkan.