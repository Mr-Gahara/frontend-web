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
| Inventaris: pengajuan stok, lalu transfer, pengiriman, dan penerimaan | - | **Berikutnya** (lihat Pekerjaan berikutnya) |
| Penjualan dan pembayaran | - | Belum |
| Reservasi | - | Belum |
| Keuangan | - | Belum |
| Jadwal dan shift | - | Belum |
| Gudang: dashboard, pengaturan, setup | - | Belum. Halaman stok gudang dikerjakan di modul inventaris (Pekerjaan berikutnya): jurnal stok, inventaris gudang, dan stock opname sudah, pengajuan, transfer, dan pengiriman belum; pengguna gudang sudah ikut modul Pengguna (`7275d14`); jadwal gudang dijadwalkan di modul Jadwal dan shift |

Keputusan produk tiap modul tercatat di `keputusan.md`.

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul:

| Hal | Awal | Setelah submodul stock opname | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 101 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan |
| Kemunculan `_id` | - | 120 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id || _id` |
| `useAuthGuard()` berulang di halaman | 49 | 42 | Dihitung di `app/` saja. Turun karena halaman stock opname menjadi tipis dan pemanggilannya pindah ke komponen di `features/`, bukan karena dipindah ke layout. Rencananya tetap dipindah ke layout |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | - | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | 7 | Sempat 8 karena berkas lain tumbuh; kembali 7 setelah form produk disatukan. Berkurang saat modulnya dimigrasikan |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## Pekerjaan berikutnya: modul inventaris (lanjutan)

Modul inventaris terlalu besar untuk satu commit (24 halaman, sekitar 8.900
baris), sehingga dipecah menjadi enam submodul. Setiap submodul punya spec
pembanding, suite penuh, dan commit sendiri, dan dikerjakan dari yang
terkecil (`arsitektur.md`, Langkah migrasi satu modul, langkah 7).

| No | Submodul | Halaman | Baris | Status |
|---|---|---|---|---|
| 1 | Stock adjustment | outlet: daftar, detail | 431 | Selesai (`a52afbf`) |
| 2 | Jurnal stok | outlet dan gudang: daftar | 617 | Selesai (`98735d4`) |
| 3 | Stok dan inventaris | `outlet/inventaris/stok`, `gudang/inventaris` | 1.094 | Selesai (`ad590f9`) |
| 4 | Stock opname | outlet dan gudang: daftar, detail, buat | 2.544 | Selesai (`fc3f220`) |
| 5 | Pengajuan stok | outlet: daftar, detail, edit, buat; gudang: daftar, detail | 2.298 | **Berikutnya** |
| 6 | Transfer, pengiriman, penerimaan | gudang: transfer (daftar, detail, edit), pengiriman; outlet: penerimaan (daftar, detail) | 1.950 | Belum |

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
  (`arsitektur.md`). Pakai itu; jangan membuat hook lokasi, inventory, atau cakupan
  baru (`keputusan.md` butir 12). Mutation baru mengikuti pola callback halaman
  (butir 13), dan tombol aksi mengikuti izin (butir 14).
- Kunci `queryKeys.lokasi.daftar({ tipe })` masih diisi lewat `apiClient`
  dengan bentuk mentah oleh `outlet/inventaris/penerimaanBarang` (Outlet).
  `features/` memakai `lokasi.daftar()` tanpa filter, sehingga tidak
  tertimpa. Ganti di submodul 6.
- Di luar `components/ui`, halaman inventaris hanya mengimpor
  `components/calendar.tsx` (240 baris, 2 `any`). Bereskan di submodul yang
  memakainya.
- `kontrak/temuan.md` butir 10: operasi tulis tanpa validator, sebagian besar di
  stok (pengajuan dan transfer). Periksa service sebelum menentukan payload.
- Halaman pengiriman stok gudang memakai `/transferstok`, yang mewajibkan
  `read-transfer-stok` (`kontrak/izin-halaman.md`).
- `kontrak/izin-halaman.md` sudah diselaraskan dengan `IZIN_HALAMAN` untuk halaman
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
  atau `components/` saat modul inventaris menyentuhnya.
