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
| Jadwal dan shift, termasuk pola roster dan monitoring absensi | `d9af531` (spec), `f99b7cf` (shift), `dcc22e0` (pola roster), `19227f8` dan `e2a0cfd` (jadwal), `845c2cf` (monitoring absensi) | Selesai |
| Gudang: layout, setup, pengaturan, dan dashboard | `2d7225b` (spec), `9ce288b` (layout, setup, dan lokasi sidebar), `319bd99` (pengaturan) | Selesai (keputusan GD1a sampai GD6a). Eksekusi dashboard gudang ditunda sampai pemilik proyek menentukan layout dan UI/UX-nya (Utang kecil dari modul Gudang). Halaman stok gudang sudah dimigrasikan di modul inventaris (`580a1e1`), termasuk stock adjustment (`247cf2d`); pengguna gudang ikut modul Pengguna (`7275d14`), dan jadwal, shift, serta pola roster gudang ikut modul Jadwal dan shift |
| Penyesuaian backend `465b438`: keuangan, penjualan, pembayaran, reservasi, transfer stok, pembersihan data uji, dan paginasi daftar penjualan | `b85c2bd` (penyesuaian), `a10af75`, `e4bfc86`, `8134842`, `31ebd92` (fixme dilepas), `6e314ae` (terima), `b5a55c4` (data uji), `b63cf08` (paginasi) | Selesai (Catatan dari penyesuaian backend `465b438`) |
| Pengaturan outlet: metode pembayaran | `9ca273a` (spec), `3359497` | Selesai (keputusan PO1a sampai PO5a dan PO10a; Catatan dari submodul metode pembayaran) |
| Pengaturan outlet: pajak | `9586e3c` (spec), `e0aaeca`, `b84de56` (komentar) | Selesai (keputusan PO6a sampai PO9a; Catatan dari submodul pajak). Spec pembanding metode pembayaran diperbaiki di `cc65d93` |
| Role: template tanpa permission di luar seed (PO11a) | `366e9b7` | Selesai (Catatan dari PO11a) |
| Penyesuaian backend `yoga` `50eede7`: fixture stok penjualan, `alasanVoid`, urutan server daftar penjualan, dan lokasi stok produk | `65edf8c` (fixture), `a4304ce` (penyesuaian) | Selesai (keputusan PY4a sampai PY7a; Catatan dari penyesuaian backend `yoga`) |
| Pengaturan outlet: profil outlet | `ca6eb3d` (menu sidebar setelah muat ulang), `fcf2dd2` | Selesai (keputusan PO12a sampai PO16a; Catatan dari submodul profil outlet) |
| Pelanggan | `b6de75c` (spec), `d9365d3` | Selesai (keputusan PD1a dan PD5a; Catatan dari submodul pelanggan) |
| Diskon | `8cb6f31` (spec), `1e05df6` (halaman), `54f2938` (aturan), `52c550e` (pilihan kasir) | Selesai (keputusan PD2a sampai PD4a dan PD6a sampai PD9a; Catatan dari submodul diskon) |
| Profil, login, dan sidebar | `0ed0e9a` (spec profil), `091be4e` (profil), `1c13ee6` (login), `57a7084` (sidebar) | Selesai (keputusan PF1a sampai PF9a; Catatan dari modul Profil, login, dan sidebar). Modul terakhir migrasi halaman lama |
| Panel admin | `0f54b3c` (fondasi), `4e2a254` (daftar dan buat akun), `10c7efb` (langganan), `c824f18` (ubah dan hapus) | Selesai (keputusan PA1a sampai PA14a; Catatan dari modul panel admin) |
| Keuangan: mutasi arus kas dan akun kas non-aktif | `e129f9d` (mutasi arus kas), `6a57d12` (akun kas non-aktif dipisah) | Selesai (keputusan MK1a sampai MK3a dan AK1a; Catatan dari pekerjaan mutasi arus kas dan akun kas) |
| Keuangan: ubah dan aktifkan kembali akun kas | `1bc76f4` | Selesai (keputusan UA1a sampai UA4a; Catatan dari pekerjaan ubah akun kas) |
| Keuangan: Pindah Dana antar akun kas | `e053a67` (izin di template role), `e53c016` | Selesai (keputusan DN1a sampai DN4a; Catatan dari pekerjaan Pindah Dana) |
| Keuangan: pengeluaran (beban operasional) | `7fce871` (keterangan belum tersedia) | Ditunda (keputusan BO1a dan BO2a; Catatan dari penundaan pengeluaran dan pemeriksaan ulang utang): endpoint beban menjawab 403 bagi setiap pengguna di backend `50eede7` |
| Transfer stok: daftar surat jalan memakai penyaringan server (butir 33) | `03c4eb3` | Selesai (keputusan TS1a; Catatan dari penundaan pengeluaran dan pemeriksaan ulang utang) |
| Keuangan: utang kecil (menutup akun bersaldo lewat Pindah Dana, dan tampilan mutasi transfer) | `f7805ca` | Selesai (keputusan UK1a sampai UK3a; Catatan dari penundaan pengeluaran dan pemeriksaan ulang utang) |
| Produk: utang kecil (dialog hapus, spec produk, dan `BahanBakuCombobox`) | `152088b` | Selesai (keputusan PR1a sampai PR3a; Catatan dari utang kecil modul produk dan pemformat rupiah) |
| `formatRupiah` deterministik untuk nilai pecahan | `4c9c4ed` | Selesai (keputusan FR1a dan FR2a, dan keputusan rancangan butir 24) |
| Pemformat rupiah: sembilan berkas ke `formatRupiah` | `006d7f8` | Selesai (keputusan rancangan butir 24; Catatan dari utang kecil modul produk dan pemformat rupiah) |
| Error ESLint warisan | `4f19e77` (tipe, kutip, dan `storage.ts`), `039ead4` (hidrasi), `f5fe574` (form role) | Selesai (keputusan EL1a sampai EL4a; Catatan dari error ESLint warisan) |
| Utang kecil yang tidak menunggu backend | `6b5e1cc` (kode mati), `eb0181f` (penjaga ruang opname, nama PIC, dan kerangka memuat stok), `9195472` (spec tipe aset) | Selesai (Catatan dari utang kecil yang tidak menunggu backend) |
| Penyesuaian backend `fc29433` | `a17d584` (fixme butir 37), `d3443e2` (izin pajak), `1ec905d` (template role), `b887278` (satuan resep) | Selesai (keputusan FC1a sampai FC4a; Catatan dari penyesuaian backend `fc29433`) |
| `useAuthGuard()` berulang | `628f52e` | Selesai (Catatan dari useAuthGuard berulang) |
| Gerbang rute dari `IZIN_HALAMAN` | `bc388c6` | Selesai (keputusan GR1a sampai GR7a; Catatan dari gerbang rute) |
| Utang kecil gerbang rute | `dc0af1c` | Selesai (Catatan dari utang kecil gerbang rute) |
| Form role ke React Hook Form dan Zod | `597a163` | Selesai (keputusan RL1a sampai RL3a; Catatan dari form role) |
| Penyesuaian backend `nizar` | `9b25433` (sesi booking), `3b4f35b` (metode pembayaran), `a80d2fa` (diskon), `d23844a` (mutasi), `8072214` (riwayat Pindah Dana), `729c16a` (tandai selesai) | Selesai (keputusan NZ1a sampai NZ7a; Catatan dari penyesuaian backend `nizar`) |
| Penyesuaian backend `nizar` `8dc6211` | `4539c85` (gerbang rute), `fe9631f` (pemilih pelanggan), `1bb26c0` (pengosongan kontak), `5b92d14` (spec kembar) | Selesai (keputusan NZ8a sampai NZ10a; Catatan dari penyesuaian backend `nizar` `8dc6211`) |
| Rancangan dan perbaikan UI/UX, layout, dan palet warna | - | **Berikutnya** (lihat Pekerjaan berikutnya) |

Keputusan produk tiap modul tercatat di `keputusan.md`.

## Metrik sisa pekerjaan

Angka awal sebelum Fase 2, sebagian sudah berkurang seiring migrasi modul.
Diukur ulang per penyesuaian `nizar` (`729c16a`), tidak berubah dari `597a163`:

| Hal | Awal | Per `729c16a` | Catatan |
|---|---|---|---|
| Pemakaian `any` | 302 | 0 | Dihitung di `app`, `components`, `lib`, dan `features` (perintah di `docs/README.md`). Berkurang tiap modul yang dimigrasikan; dari 25 per `845c2cf` menjadi 16, lewat penyesuaian `465b438` dan halaman metode pembayaran, lalu 12 setelah halaman pajak (`e0aaeca`), 9 setelah halaman pelanggan (`d9365d3`), 7 setelah halaman diskon (`1e05df6`), 4 setelah halaman profil, login, dan sidebar (`57a7084`), dan 0 setelah error ESLint warisan (`4f19e77`) |
| Kemunculan `_id` | - | 8 | Dihitung di `app`, `components`, dan `features` (perintah di `docs/README.md`), tidak termasuk `types/`. Tersisa di modul yang belum dimigrasikan; angka awal 90 dihitung khusus pola `id \|\| _id`. Perintahnya ikut menghitung komentar: naik 1 di `eef371a` dari komentar normalisasi di `features/sesi-booking/api.ts`. Turun 13 di `45187b6`: 12 dari data tiruan mutasi arus kas dan 1 dari daftar akun kas. Turun 3 di `f99b7cf`: 4 dari halaman dan tabel shift, dikurangi 1 dari komentar normalisasi di `features/shift/api.ts`. Turun 7 di `dcc22e0` dari halaman, tabel, dan form pola roster. Turun 7 di `19227f8` dari halaman jadwal outlet, jadwal gudang, dan generate. Turun 9 lagi sampai `3359497`, dari penyesuaian `465b438` dan halaman metode pembayaran. Turun 7 di `e0aaeca` dari halaman pajak. Turun 2 di `d9365d3` dari halaman pelanggan. Turun 2 di `1e05df6` dari halaman diskon. Turun 1 di `091be4e` dari komentar halaman profil. Naik 1 di `10c7efb` dari komentar normalisasi di `features/admin-akun/api.ts`. Turun 1 di `4f19e77` dari cadangan `_id` di dialog pengguna |
| `useAuthGuard()` berulang di halaman | 49 | 2 | Dihitung di `app/` saja. Yang tersisa `app/dashboard/layout.tsx`, satu-satunya pemanggil, dan berkas hook-nya sendiri; ke-24 pemanggilan berulang di `app/` dan ke-13 di `features/` dibuang di `628f52e` (26 sebelum itu). Turun saat halaman menjadi tipis atau pemanggilannya dibuang (stock opname, penerimaan barang, stock adjustment, keempat halaman penjualan, buat reservasi, shift outlet, pola roster outlet, ketiga halaman metode pembayaran, halaman pelanggan, halaman diskon, dan halaman profil) |
| Warna heksadesimal hardcoded | 4.544 (28 nilai unik) | - | Ditunda ke tahap desain token tersendiri |
| Berkas di atas 700 baris | 7 | 4 | `components/app-sidebar.tsx` melewati 700 (701 baris) karena menu stock adjustment gudang. Daftar penjualan (701) kini tipis, sedangkan buat penjualan pindah ke `features/penjualan/halaman-buat-penjualan.tsx` dengan 1.127 baris saat itu, kini 1.087 (Utang kecil dari modul penjualan dan pembayaran). Buat dan edit tarif (774 dan 807 baris) turun di bawah 700 setelah skema dan logikanya pindah ke `features/tarif` (`365553f`). Berkurang saat modulnya dimigrasikan atau dipecah. Buat reservasi (1.165 baris) dipecah menjadi tiga berkas di `477f258` (keputusan R9b). Per `e0aaeca`, sama dengan `3359497`: buat penjualan (1.089), `features/produk/form-produk.tsx` (794), `components/app-sidebar.tsx` (704), dan `components/ui/sidebar.tsx` (702). Per `a4304ce` jumlahnya tetap 4; `features/produk/form-produk.tsx` menjadi 803 baris karena lokasi aktif dan petunjuk resep. Per `fcf2dd2` jumlahnya tetap 4; `components/app-sidebar.tsx` menjadi 713 baris. Per `52c550e` tetap 4; buat penjualan 1.090 baris. Per `57a7084` menjadi 3: `components/app-sidebar.tsx` dipecah menjadi 325 baris (keputusan PF4a), dan tersisa buat penjualan (1.090), `features/produk/form-produk.tsx` (803), serta `components/ui/sidebar.tsx` (702). Per `9195472` menjadi 4: `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700 (714 baris) karena penjaga ruang (`eb0181f`), dan buat penjualan menjadi 1.087 baris setelah kode mati dibuang (`6b5e1cc`). Per `b887278` form produk menjadi 809 baris (pemeriksaan satuan resep). Per `628f52e` tetap 4; detail stock opname menjadi 712 baris setelah pemanggilan guard dibuang |

Tahap desain token (warna, tipografi, spasi) sengaja ditunda dan tidak
dicampur dengan refactor arsitektur, agar setiap commit tetap fokus.

## Pekerjaan berikutnya: rancangan dan perbaikan UI/UX, layout, dan palet warna

Form role selesai di `597a163`. Pekerjaan berikutnya, atas keputusan
pemilik proyek (6 Oktober 2026), adalah fase rancangan dan perbaikan
UI/UX, layout, dan palet warna. Seluruh rancangannya ditentukan pemilik
proyek sendiri: tidak ada usulan desain yang diterapkan tanpa arahannya
(`keputusan.md`, Form role).

Pemetaannya belum diambil, dan cakupan serta urutannya menunggu arahan
pemilik proyek. Yang sudah tercatat menunggu fase ini: tahap 2.7 desain
token (warna, tipografi, spasi) dan metrik warna heksadesimal hardcoded;
dashboard gudang dan outlet yang masih placeholder (keputusan GD1a); dan
layout serta tampilan panel admin (Utang kecil dari modul panel admin).
Langkah pertama sesi berikutnya: backend di-`fetch` dan dibandingkan
dengan acuan (`cara-kerja.md`), lalu arahan pemilik proyek. Perintah di
bawah memetakan warna yang dipakai sekarang, bila dibutuhkan. Suite e2e
penuh tidak dijalankan di awal sesi; harapan hitungannya 447 lolos dan
15 skipped (`pengujian.md`). Backend lokal berada di cabang `ridho`
`8dc6211`, hasil fast-forward ke `origin/nizar` pada 8 Oktober 2026 dan
belum di-push; `origin/ridho` masih `92d4f27` (`backend.md` bagian
Pemilik modul backend). Tiga perubahan `yoga` belum dimanfaatkan web:
B36 (Yoga), B37 (Yoga), dan B38 (Yoga) di `docs/pengembangan/klien.md`
backend.

```bash
BE=~/Documents/backend-js; git -C "$BE" fetch --all --quiet; git -C "$BE" --no-pager log --oneline --remotes --not HEAD | head -20
grep -rhoE '#[0-9A-Fa-f]{6}\b' app components features | tr 'a-f' 'A-F' | sort | uniq -c | sort -rn | head -30
grep -nE '^\s*--[a-z-]+:' app/globals.css | cut -c1-100 | head -60
```

## Catatan dari penyesuaian backend `nizar` `8dc6211`

Dikerjakan pada 8 Oktober 2026 dalam empat commit. `origin/nizar` maju
delapan commit di atas `ridho` `92d4f27` (pelanggan, membership, posisi,
dan sesi booking), sehingga `ridho` lokal cukup di-fast-forward: tidak
ada sisi kedua yang perlu diperiksa kelengkapannya. `origin/yoga` tidak
maju.

| Commit | Isi |
|---|---|
| `4539c85` | Buat penjualan dan buat reservasi menuntut `read-pelanggan` (GR7a) |
| `fe9631f` | Pemilih pelanggan menampilkan dan mencari nomor HP (NZ8a) |
| `1bb26c0` | `test.fixme` pengosongan nomor HP dilepas, dan peringatan sementara dibuang (NZ10a) |
| `5b92d14` | Skenario penolakan kembar berpindah dari nama (400) ke nomor HP (409) |

- Permission diselaraskan menurut `backend.md`: seed sinkron menambah
  empat izin posisi (135 di seed), dan seed Owner memberi 132 izin ke dua
  role Owner. Tidak ada nama yang dikeluarkan dari seed.
- Audit endpoint tidak berubah: 243 route dan 142 panggilan frontend
  unik, tanpa panggilan ke route yang tidak ada.
- `GET /pelanggan` kini memeriksa `read-pelanggan`. Halaman pelanggan
  sudah bergate izin itu sejak Fase 2; gerbang buat penjualan dan buat
  reservasi disusulkan (`kontrak/izin-halaman.md`).
- Terbukti lewat permintaan nyata: butir 104 dan 105 tertutup, nomor HP
  kembar dijawab 409 (butir 106), `?penjualanID=` diterima (butir 140),
  dan query tidak dikenal ditolak 400 di daftar pelanggan dan booking.
  Status Batal yang dibaca VOID (butir 141) dan email kembar 409 dibaca
  dari kode.
- Nama kembar masih ditolak 409 di basis data development, karena indeks
  unik lama tidak ikut terhapus saat dibuang dari skema; indeks nomor HP
  dan email di basis data juga belum memuat filter `isDeleted`
  (`kontrak/temuan.md` butir 142). Basis datanya dibiarkan sebagai
  bukti.
- Filter `?penjualanID=` berasal dari permintaan web sendiri (butir 140)
  dan tidak dipakai: detail penjualan tetap memuat booking per id (NZ9a).
- Helper `ganti-blok.js` diperbaiki: beberapa pasangan di bawah satu
  baris berkas kini diterapkan (`f573eeb`, `cara-kerja.md`).
- Cabang uji lokal `uji-yoga-nizar` di backend dihapus; kedua induknya
  termuat di `ridho`.
- Vitest 629 lolos di 77 berkas. Suite e2e penuh: 447 lolos dan 15
  skipped, tanpa kegagalan (`pengujian.md`).
- Temuan backend baru: butir 142 (`backend.md`).
- Keputusan: `keputusan.md` (Penyesuaian backend `nizar` `8dc6211`, NZ8a
  sampai NZ10a).

## Catatan dari penyesuaian backend `nizar`

Dikerjakan pada 7 Oktober 2026 dalam enam commit. Saat dimulai,
`origin/yoga` berada di `fc29433`, dan `origin/nizar` maju tiga commit ke
`9d45efc` dari titik cabang `3edbdea`, sehingga tidak memuat `fc29433`.
Acuan ujinya gabungan lokal keduanya, cabang `uji-yoga-nizar` `54f787b`,
yang tidak di-push. Pada malam yang sama `origin/yoga` maju tujuh commit
ke `55328f1` (izin kategori beban, `tipePajak` hanya wajib saat membuat,
dan satuan resep mengikuti bahan). Malam itu juga ketiga cabang
disatukan di `ridho` `92d4f27` dan di-push; suite penuh terhadapnya, 8
Oktober 2026, menghasilkan 444 lolos dan 16 skipped, sehingga ketujuh
commit itu tidak menggeser spec mana pun (`backend.md` bagian Pemilik
modul backend).

| Commit | Isi |
|---|---|
| `9b25433` | Status Tidak Datang dan field check-in dibuang dari tipe, label timeline, dan test |
| `3b4f35b` | Metode aktif terakhir ditahan (NZ4a), dan Tambah tetap hidup saat batas 10 tercapai (NZ5a) |
| `a80d2fa` | Tambah diskon tetap hidup saat batas 50 tercapai, dengan form terkunci Non-Aktif (NZ5a) |
| `d23844a` | Ringkasan mutasi gabungan (NZ1a), kolom Pencatat, dan tautan penjualan (NZ2a) |
| `8072214` | Filter periode dan Reset Filter di riwayat Pindah Dana (NZ3a) |
| `729c16a` | Tandai Selesai untuk booking lunas di detail penjualan (NZ7a) |

- Permission diselaraskan menurut `backend.md`: seed sinkron menambah
  delapan izin membership (127 di seed), dan seed Owner memberi 124 izin
  ke tiga role Owner. Tidak ada nama yang dikeluarkan dari seed.
- Audit endpoint: 243 route dan 142 panggilan frontend unik, tanpa
  panggilan ke route yang tidak ada. `POST /sesibooking/:id/checkin`
  hilang, dan `GET /akunkas/ringkasan` bertambah.
- Tidak ada `test.fixme` yang dapat dilepas: berkas penentu butir 8, 22,
  46, 70, dan 104 serta validator ubah pola roster tidak diubah `nizar`,
  dan seed tidak memuat izin lintas outlet (butir 39).
- Terbukti lewat permintaan nyata: butir 86, 87, 123, 124, 125, 126, dan
  129, bentuk galat validator (butir 42 dan 128), dan bentuk sesi
  booking. Butir 85, 107, dan 127 dibaca dari diff. Butir 77 dan 109
  hanya menurut pesan commit (`kontrak/temuan.md`).
- `POST /metodepembayaran` tanpa `kategori` dijawab 400, sehingga
  kontraknya dikoreksi; `jamBuka` dan `jamTutup` tipe aset, yang ada
  sejak `465b438`, baru tercatat (`kontrak/payload.md`,
  `kontrak/endpoint.md`).
- Booking milik sebuah penjualan dikenali dari
  `itemPenjualan[].sesiBookingID` dan dimuat per id, karena daftar
  booking tidak dapat disaring per penjualan (butir 140).
- Vitest 627 lolos di 76 berkas. Suite e2e penuh: 440 lolos, 4 gagal,
  dan 16 skipped; jumlah skenarionya sesuai hitungan harapan (444 dan
  16).
- Keempat kegagalan bukan dari kode hari itu: `POST /pengajuanstok`
  dijawab 409 nomor kembar, karena pembentuk nomor backend mengurutkan
  menurut `createdAt` dan tiga pengajuan development ber-`createdAt` di
  depan jam sistem (butir 139). Setelah `createdAt` ketiganya digeser,
  ketiga folder spec terkait lolos 17 dan 2 skipped (`pengujian.md`).
  Pemicu waktu di depan itu tidak terbukti.
- Push commit `8072214` dua kali ditolak GitHub dengan galat server, dan
  masuk bersama `729c16a`.
- Temuan backend baru: butir 139 sampai 141 (`backend.md`).
- Keputusan: `keputusan.md` (Penyesuaian backend `nizar`, NZ1a sampai
  NZ7a).

## Catatan dari form role

Dikerjakan pada 6 Oktober 2026 dalam satu commit, `597a163`, terhadap
backend `yoga` `fc29433`; `origin/yoga` tidak maju sejak itu.

- Isian form role beralih dari `useState` dan validasi di `handleSubmit`
  ke React Hook Form dan Zod, dengan `noValidate`. Tampilan, teks, label,
  dan id isian tidak berubah, dan ketiga handler wewenang tidak disentuh.
- Empat cacat form lama terbukti dari kode dan diperbaiki: nama hanya
  dijaga atribut `required` browser dan dikirim tanpa `trim`; deskripsi
  yang dikosongkan tidak dikirim; level desimal dipotong `parseInt`; dan
  setiap simpan ditolak bila level pengguna aktif tidak dapat ditentukan.
- Galat validasi tampil di bawah tiap isian (RL1a). Ubah hanya mengirim
  field yang berubah, dan simpan nonaktif selama tidak ada perubahan
  (RL2a). Batas atas level hanya diperiksa form bila level pengguna
  diketahui (RL3a).
- Lapisan murninya di `features/role/schema.ts` dan
  `features/role/payload.ts` (`arsitektur.md`).
- Dasar RL2a dibaca dari backend lebih dulu: `roleService.update` menulis
  hanya field yang dikirim, dan validator mode update menjadikan seluruh
  field opsional. Kontrak `PUT /role/:id` dikoreksi (`kontrak/payload.md`).
- Kedua skenario e2e baru dijalankan terhadap form lama lebih dulu dan
  gagal keduanya, lalu lolos setelah peralihan. Vitest 620 lolos di 73
  berkas, dan `tests/e2e/roles` 7 lolos (`pengujian.md`). Suite e2e penuh
  tidak dijalankan.
- Tidak ada temuan backend baru.
- Keputusan: `keputusan.md` (Form role, RL1a sampai RL3a).

## Catatan dari utang kecil gerbang rute

Dikerjakan pada 6 Oktober 2026 dalam satu commit, `dc0af1c`, terhadap
backend `yoga` `fc29433`; `origin/yoga` tidak maju sejak itu.

- `IZIN` menjadi satu sumber nama izin: 24 izin aksi ditambahkan,
  sehingga memuat 71 nama dalam tiga kelompok (ruang dan baca, tulis
  halaman form, dan aksi di dalam halaman). Atas keputusan pemilik
  proyek, seluruh izin tulis dipindah, bukan hanya yang kembar.
- Sebelas `features/<modul>/izin.ts` merujuk `IZIN`. Objek lokal seperti
  `IZIN_PENJUALAN` dan fungsi aksi dipertahankan, sehingga pemakai dan
  test unitnya tidak berubah.
- Izin ruang, lokasi, dan tenant di layout outlet, halaman `/dashboard`,
  pengaturan gudang, sidebar, `akses-gudang.ts`, dan halaman profil toko
  ikut merujuk `IZIN`.
- `revisiTransferStok` diganti nama menjadi `buatTransferStok`, karena
  `create-transfer-stok` dipakai untuk membuat dan merevisi surat jalan.
- Cabang keterangan tanpa `update-akunkas` di halaman ubah akun kas
  dibuang. Cabang itu terbukti mati dari kode: layout outlet tidak
  memasang isi sampai sesi masuk, dan sesudahnya gerbang rute menuntut
  `update-akunkas` untuk rute itu (GR5a).
- Yang sengaja tetap teks: `lib/roleTemplates.ts` dan
  `features/role/constants.ts` (data), serta dua pembanding nama di
  `features/role/form-role.tsx`.
- Seluruh 71 nama di `IZIN` disilang dengan `seeds/permissionSeed.js`
  backend lewat skrip: tidak ada yang hilang.
- Vitest 604 lolos di 72 berkas, dan spec e2e terdampak 121 lolos dan 3
  skipped (`pengujian.md`). Suite e2e penuh tidak dijalankan.
- Tidak ada perubahan perilaku selain cabang mati itu, tidak ada temuan
  backend baru, dan kontrak tidak berubah.
- Keputusan: `keputusan.md` (Gerbang rute).

## Catatan dari gerbang rute

Dikerjakan pada 5 dan 6 Oktober 2026 dalam satu commit, `bc388c6`,
terhadap backend `yoga` `fc29433`; `origin/yoga` tidak maju sejak itu.

- Suite e2e penuh yang tertunda sejak `628f52e` dijalankan di awal sesi,
  sebelum perubahan: 436 lolos dan 16 skipped, sesuai hitungan.
- `GerbangRute` (`components/gerbang-rute.tsx`) dipasang di
  `app/dashboard/layout.tsx`. Rute yang syaratnya tidak dipenuhi tidak
  dipasang isinya dan menampilkan pesan di tempat, tanpa pengalihan.
- `IZIN_HALAMAN` kini memuat seluruh 83 halaman di bawah `/dashboard`: 44
  entri baru, dengan rute berparameter sebagai pola `[id]`. `syaratRute`
  mencocokkan persis lebih dulu, lalu pola bersegmen sama
  (`arsitektur.md`).
- `IZIN` bertambah 23 izin tulis: halaman form menuntut izin baca dan
  izin tulisnya, sedangkan halaman detail hanya izin baca (GR5a).
- Syarat setiap rute diturunkan dari hook yang dipanggil halamannya,
  lewat skrip sekali pakai yang menelusuri impor setiap `page.tsx`, dan
  dari izin endpoint di kontrak; tidak ada yang diwariskan dari induk.
- Lokasi di buat bahan baku, bahan baku di form produk, dan pajak di buat
  penjualan terbukti opsional dari kode, sehingga tidak menjadi syarat
  (GR7a).
- Pemeriksaan izin baca di halaman pajak dibuang (GR4a); kartu indeks
  pengaturan tetap membaca `bolehBukaHalaman`.
- Vitest 603 lolos di 72 berkas. Spec baru
  `tests/e2e/auth/gerbang-rute.spec.ts` lolos 2, dan skenario tertolaknya
  terbukti gagal tanpa gerbang. Spec terdampak: 83 lolos, lalu 60 lolos
  dan 2 skipped (`pengujian.md`).
- Suite e2e penuh tidak dijalankan ulang setelah perubahan. Sejak
  6 Oktober 2026 suite penuh hanya dijalankan saat penting (`keputusan.md`,
  Gerbang rute).
- Tidak ada temuan backend baru. `kontrak/izin-halaman.md` mendapat
  tabel rute turunan; kontrak lain tidak berubah.
- Keputusan: `keputusan.md` (Gerbang rute, GR1a sampai GR7a).

## Catatan dari useAuthGuard berulang

Dikerjakan pada 5 Oktober 2026 dalam satu commit, `628f52e`, terhadap
backend `yoga` `fc29433`; `origin/yoga` tidak maju sejak itu.

- Baris impor dan baris pemanggilan `useAuthGuard()` dibuang dari 37
  berkas: 24 di `app/` dan 13 di `features/`, beserta empat baris kosong
  yang menjadi berlebih. Tidak ada baris yang ditambahkan, dan perilaku
  tidak berubah.
- Pemetaan terhadap `9195472` dibuktikan ulang sebelum diterapkan:
  jumlah pemanggil sama, tidak ada yang memakai nilai kembalian hook,
  dan bentuk kedua baris seragam di setiap berkas.
- Guard sesi dashboard kini hanya dipasang di `app/dashboard/layout.tsx`
  (`arsitektur.md`), dan `features/` tidak lagi mengimpor
  `useAuthGuard`.
- Spec baru `tests/e2e/auth/guard-dashboard.spec.ts`: tanpa sesi, empat
  rute di bawah `/dashboard` berakhir di `/login`. Skenarionya lolos
  juga terhadap kode lama; gunanya menjaga guard layout sebagai
  satu-satunya penjaga.
- Vitest penuh 593 lolos, dan spec e2e terdampak 98 lolos dan 2
  skipped. Suite e2e penuh tidak dijalankan, atas keputusan pemilik
  proyek, dan menjadi langkah pertama pekerjaan berikutnya
  (`pengujian.md`).
- Tidak ada temuan backend baru, dan kontrak tidak berubah.
- Keputusan: `keputusan.md` (useAuthGuard berulang).

## Catatan dari penyesuaian backend `fc29433`

Dikerjakan pada 4 dan 5 Oktober 2026. `origin/yoga` maju lima commit dari
`50eede7` ke `fc29433` (keputusan backend R16 dan P15), dan atas
keputusan pemilik proyek penyesuaian ini didahulukan dari
`useAuthGuard()` berulang.

| Commit | Isi |
|---|---|
| `a17d584` | `test.fixme` butir 37 dilepas: finalisasi produk beresep tidak lagi memakai `produk.stok` |
| `d3443e2` | Halaman pajak mengikuti izin: `features/pajak/izin.ts`, gerbang halaman, tombol, tab pajak produk, dan kartu indeks pengaturan |
| `1ec905d` | Keempat izin pajak di template Manajer dan General Manajer |
| `b887278` | Satuan resep mengikuti `availableUnits` bahan terpilih |

- Backend lokal dipindah ke `fc29433` dengan fast-forward. Permission
  diselaraskan menurut `backend.md`: seed sinkron menambah delapan izin
  (119 di basis data dan 119 di seed), seed Owner memberi 116 izin ke
  tiga role Owner, dan cache izin dibersihkan.
- Audit endpoint tidak berubah: 243 route backend dan 139 panggilan
  frontend unik, tanpa panggilan ke route yang tidak ada.
- Dibuktikan lewat permintaan nyata sebagai Owner: `GET /pajak` 200,
  `GET /bebanoperasional` 200, `GET /kategoribeban` masih 403, dan
  `PUT /pajak/:id` tanpa `tipePajak` masih 400.
- Yang tertutup di backend: butir 37, 89, dan 90, serta butir 5 untuk
  pajak dan butir 130 untuk beban operasional. Yang masih terbuka: butir
  91, butir 130 untuk kategori beban, dan butir 15, yang kini berakibat
  nyata (bahan bersatuan pak atau unit tidak dapat dipakai di resep).
- Pekerjaan pengeluaran tetap ditunda (keputusan BO1a): beban tidak dapat
  dicatat tanpa kategori, dan kategori beban masih 403.
- Dugaan yang keliru: skenario gerbang `produk.stok` diperkirakan gagal
  terhadap backend baru, padahal skenario penolakan yang aktif menguji
  gerbang stok bahan dan tetap benar; skenario `produk.stok` adalah
  `test.fixme` itu sendiri.
- Suite penuh 4 Oktober 2026: 431 lolos, 1 gagal, dan 16 skipped, sesuai
  hitungan harapan. Yang gagal login di `beforeEach` spec tipe aset,
  tidak terkait perubahan; spec itu lolos 25 saat dijalankan terpisah
  (`pengujian.md`, Utang pengujian).
- Laporan untuk tim backend disusun 5 Oktober 2026: kategori beban,
  `tipePajak`, dan satuan pak serta unit.
- Keputusan: `keputusan.md` (Penyesuaian backend `fc29433`).

## Catatan dari utang kecil yang tidak menunggu backend

Dikerjakan pada 4 Oktober 2026 dalam tiga commit, terhadap backend `yoga`
`50eede7`. Suite e2e penuh dijalankan sekali di akhir (keputusan PF6a):
430 lolos dan 17 skipped, tanpa kegagalan.

| Commit | Isi |
|---|---|
| `6b5e1cc` | Tiga belas impor dan dua variabel tidak terpakai, ternary di `toggleExpand`, dan tiga tipe tanpa pemakai di `types/auth.ts` |
| `eb0181f` | Penjaga ruang di detail stock opname, nama PIC lewat `usePenggunaSaya`, `nama` dibuang dari `PenggunaSesi`, dan kerangka memuat tabel stok outlet |
| `9195472` | Spec tipe aset memakai helper bersama `tests/helpers/reservasi-uji.ts` |

- Warning ESLint turun dari 20 menjadi 2. Yang tersisa dua
  `react-hooks/incompatible-library` (`components/ui/data-table.tsx` dan
  `features/stock-opname/form-buat-stock-opname.tsx`), yang dibiarkan: itu
  keterangan React Compiler tentang pustaka, bukan cacat kode.
- Variabel `isLoadingLokasi` yang tidak terpakai ternyata menandai bug:
  selama lokasi aktif dimuat, query stok belum berjalan dan tidak
  melaporkan memuat, sehingga tabel stok outlet sempat menampilkan "Tidak
  ada data stok yang ditemukan." Kerangka memuat kini mengikuti keduanya.
- Detail stock opname menolak dokumen yang tipe lokasinya bukan milik
  ruang itu, dengan pola yang sama dengan detail stock adjustment. Ini
  penjaga tampilan, bukan pengaman akses.
- PIC di form buat stock opname menampilkan nama pengguna dari server.
  Sebelumnya selalu teks cadangan, karena token tidak membawa nama.
- Keempat skenario e2e baru dijalankan lebih dulu terhadap kode lama dan
  gagal keempatnya, lalu lolos setelah perbaikan.
- Helper lokal spec tipe aset dibandingkan baris demi baris dengan helper
  bersama sebelum diganti; jumlah test spec tetap 25.
- Tidak ada temuan backend baru, dan kontrak tidak berubah.
- Keputusan: `keputusan.md` (Submodul stok dan inventaris gudang, dan
  Submodul stock opname).

## Catatan dari error ESLint warisan

Dikerjakan pada 4 Oktober 2026 dalam tiga commit, terhadap backend `yoga`
`50eede7`. Suite e2e penuh dijalankan sekali di akhir (keputusan PF6a):
426 lolos dan 17 skipped, tanpa kegagalan.

| Commit | Isi |
|---|---|
| `4f19e77` | Enam belas error tanpa perubahan perilaku: empat belas `no-explicit-any` dan dua `react/no-unescaped-entities`; `storage.ts` di helper uji dihapus (EL1a) |
| `039ead4` | `useSudahHidrasi` menggantikan `setState` di effect di kedua halaman role dan topbar, serta dua salinan lama di reservasi (EL4a) |
| `f5fe574` | Form role dipasang setelah detail termuat, dan effect pengisinya dibuang (EL2a) |

- ESLint atas `app`, `components`, `features`, `hooks`, `lib`, dan
  `tests` kini tanpa error. Hitungan 20 per `57a7084` terbukti masih sama
  saat diukur ulang sebelum pekerjaan dimulai, dan pemakaian `any` di
  metrik menjadi 0.
- `decodeJWT` mengembalikan `Record<string, unknown>`, dan
  `lib/auth/session.ts` tidak berubah, karena setiap field payload sudah
  dibaca lewat `String`, `Array.isArray`, atau perbandingan. Satu beda
  perilaku: `exp` token yang bukan angka kini dianggap kedaluwarsa.
- Deteksi hidrasi kini satu hook, `hooks/use-sudah-hidrasi.ts`, dengan
  lima pemakai. Halaman role yang dibuka lewat navigasi di dalam aplikasi
  langsung tampil tanpa satu render kosong lebih dulu, dan tanggal di
  topbar dihitung di setiap render.
- Form role dipecah menjadi `FormRole` (memuat detail) dan `IsiFormRole`
  (form), dengan nilai awal dari `nilaiAwalRole` (`arsitektur.md`). Detail
  yang gagal dimuat tampil sebagai pesan di tempat beserta tautan
  kembali, menggantikan toast dan form kosong; jalurnya teruji e2e lewat
  id yang tidak ada, tanpa respons tiruan.
- Isian form role tetap memakai `useState` (Utang kecil dari modul
  Pengaturan outlet).
- Tidak ada temuan backend baru, dan kontrak tidak berubah.
- Keputusan pemilik proyek: `keputusan.md` (Error ESLint warisan, EL1a
  sampai EL4a).

## Catatan dari utang kecil modul produk dan pemformat rupiah

Dikerjakan pada 4 Oktober 2026 dalam tiga commit, terhadap backend `yoga`
`50eede7`. Suite e2e penuh dijalankan dua kali: setelah `152088b` (424
lolos, 1 gagal, dan 17 skipped; kegagalannya diperbaiki di `4c9c4ed`),
dan setelah `006d7f8` (425 lolos dan 17 skipped, tanpa kegagalan).

| Commit | Isi |
|---|---|
| `152088b` | Dialog hapus produk bertahan saat gagal, `BahanBakuCombobox` ke `features/bahan-baku`, dan spec produk bernama unik (PR1a sampai PR3a) |
| `4c9c4ed` | `formatRupiah` memakai `maximumFractionDigits` 2 secara eksplisit, dan helper `rupiah` ketiga spec keuangan memanggilnya (FR1a) |
| `006d7f8` | Sembilan pemformat IDR lokal dibuang; seluruh tampilan rupiah lewat `formatRupiah` (keputusan rancangan butir 24) |

- Keempat utang kecil modul produk selesai. Dialog hapus produk dahulu
  tertutup juga saat gagal, karena `setDeleteTarget(null)` berada di
  blok `finally`; skenario jalur gagalnya ditulis lebih dulu dan
  terbukti gagal terhadap halaman lama, lalu lolos setelah perbaikan.
- `features/` tidak lagi bergantung pada `app/`: `BahanBakuCombobox`
  kini di `features/bahan-baku/bahan-baku-combobox.tsx`.
- Satu kegagalan suite penuh, skenario ringkasan periode di spec mutasi
  (MK2a), bukan dari kode yang diubah hari itu: batas pecahan bawaan
  `Intl` untuk IDR bergantung pada versi ICU, sehingga Node membulatkan
  nilai pecahan dan Chromium tidak. Pecahannya berasal dari transfer
  berjumlah pecahan di data development (`kontrak/temuan.md` butir 126),
  yang dibiarkan sebagai bukti (FR2a).
- Sembilan berkas aplikasi yang punya pemformat IDR sendiri dipindah ke
  `formatRupiah` di `006d7f8`. Opsinya sama semua, sehingga tampilan
  tidak berubah; tiga di antaranya memformat `angka || 0`, dan tidak ada
  pemanggilnya yang dapat mengirim `NaN`.
- Keputusan pemilik proyek: `keputusan.md` (Modul produk dan kategori,
  PR1a sampai PR3a; Modul keuangan, FR1a dan FR2a; keputusan rancangan
  butir 24).

## Catatan dari penundaan pengeluaran dan pemeriksaan ulang utang

Dikerjakan pada 4 Oktober 2026 dalam tiga commit, terhadap backend `yoga`
`50eede7`. Suite e2e penuh tidak dijalankan (keputusan PF6a): setiap
commit melewati `tsc`, ESLint, vitest penuh, dan spec yang terdampak.

| Commit | Isi |
|---|---|
| `7fce871` | Halaman pengeluaran menampilkan keterangan belum tersedia (BO2a) |
| `03c4eb3` | Daftar surat jalan memakai penyaringan server: `keLocationID`, dan status tidak lagi disaring klien (TS1a) |
| `f7805ca` | Alur e2e menutup akun kas bersaldo beserta buku mutasi transfernya, dan helper akun kas uji bersama (UK1a sampai UK3a) |

- Halaman pengeluaran tidak dapat dibangun terhadap `50eede7`:
  `GET /bebanoperasional` dan `GET /kategoribeban` menjawab 403 bagi
  Owner, karena izin `kelola-beban-operasional` dan
  `kelola-kategori-beban` tidak ada di seed, dan controller membandingkan
  nama izin dari sesi dengan `_id` dokumen permission
  (`kontrak/temuan.md` butir 130). Pekerjaannya ditunda (BO1a).
- Kontrak beban diperkirakan berubah: beban belum menulis buku mutasi
  (butir 131), dan laporan laba rugi sudah menyaring status VOID yang
  belum ada di model beban (butir 132). Temuan backend baru: butir 130
  sampai 138, disusun 4 Oktober 2026 (`backend.md`).
- Tidak ada cabang backend yang lebih depan dari `50eede7`: `origin/yoga`,
  `origin/nizar`, `origin/ridho`, dan `origin/main` diperiksa. Utang yang
  menunggu backend dibaca ulang dari kode commit itu: butir 8, 22, 39,
  46, 70, dan 76 serta validator ubah pola roster masih tertahan.
- Butir 33 terbukti diperbaiki lewat permintaan nyata, sehingga
  `filterServerTransfer` mengirim `keLocationID` dan `saringTransfer`
  tidak lagi menyaring status (`arsitektur.md`). Butir 58 terbukti dari
  kode: service daftar sesi booking tidak lagi menulis saat dibaca.
- Pemeriksaan booking saat aset dihapus (butir 52) tetap belum
  dibuktikan.
- Kedua utang kecil keuangan ditutup tanpa mengubah kode halaman
  (`f7805ca`): akun uji diisi Rp1 lewat Pindah Dana, penonaktifannya
  ditolak 409 karena saldo, saldonya dipindah keluar, lalu akun
  dinonaktifkan; buku mutasinya menampilkan transfer masuk, pembatalan
  transfer masuk, dan transfer keluar dengan label dan jumlah yang sesuai
  respons (`pengujian.md`, Spec rujukan).
- Helper akun kas uji yang kembar di dua spec dipindah ke
  `tests/helpers/akun-kas-uji.ts` (UK1a).
- Suite e2e penuh belum dijalankan untuk ketiga commit, atas keputusan
  pemilik proyek; harapannya 424 lolos dan 17 skipped (`pengujian.md`).
- Keputusan pemilik proyek: `keputusan.md` (Modul keuangan, BO1a, BO2a,
  dan UK1a sampai UK3a; Submodul transfer, pengiriman, dan penerimaan,
  TS1a).

## Catatan dari pekerjaan Pindah Dana

Selesai pada 3 dan 4 Oktober 2026 dalam dua commit. Suite e2e penuh
dijalankan sebelum commit fitur: 422 lolos dan 17 skipped, tanpa
kegagalan.

| Commit | Isi |
|---|---|
| `e053a67` | Ketiga izin jurnal transfer di template Manajer dan General Manajer (DN4a) |
| `e53c016` | Halaman Pindah Dana: form, riwayat berpaginasi server, dan pembatalan lewat VOID |

- Halaman `/dashboard/outlet/keuangan/akunkas/pindahDana` (DN1a) memuat
  form di atas dan riwayat transfer di bawahnya (DN2a), di atas
  `features/jurnal-transfer` (`arsitektur.md`). Waktu transfer adalah
  waktu server; `tanggal` tidak dikirim (DN3a).
- Backend tidak punya `DELETE`: transfer dibatalkan lewat
  `PUT /jurnaltransfer/:id` berstatus VOID, yang membalik saldo kedua
  akun. Jumlah, akun, dan tanggal tidak dapat diubah setelah tercatat.
- Halaman tanpa syarat di `IZIN_HALAMAN` (entri kosong sejak `bc388c6`),
  dengan izin per bagian: form bagi
  `create-jurnal-transfer`, riwayat bagi `read-jurnal-transfer`, dan
  Batalkan bagi `update-jurnal-transfer`. Tombol Pindah Dana di halaman
  akun kas menjadi tautan bagi pemegang izin buat atau baca.
- Kedua mutation menginvalidasi akar `jurnalTransfer` dan `akunKas`,
  karena transfer mengubah saldo dua akun dan menulis dua baris buku
  mutasi.
- Pembatas tulis `/jurnaltransfer` 30 permintaan per menit per pengguna,
  dengan kunci sendiri yang terpisah dari `/akunkas`.
- Calon temuan backend dibuktikan lewat permintaan nyata pada akun uji
  sebelum dilaporkan: empat terbukti, dan satu dugaan (id tidak sah di
  `PUT` berujung galat server) terbantah, karena dijawab 404.
- Catatan backend baru: butir 126 sampai 129, dilaporkan 4 Oktober 2026
  (`backend.md`). Kontrak jurnal transfer ditambahkan ke
  `kontrak/endpoint.md` dan `kontrak/payload.md`.
- Keputusan pemilik proyek: `keputusan.md` (Modul keuangan, DN1a sampai
  DN4a).

## Catatan dari pekerjaan ubah akun kas

Selesai pada 3 Oktober 2026 dalam satu commit, `1bc76f4`. Suite e2e penuh
dijalankan sebelum commit: 420 lolos dan 17 skipped, tanpa kegagalan.

- Halaman akun kas kini memakai `PUT /akunkas/:id` untuk tiga hal: ubah
  isian di halaman tersendiri,
  `/dashboard/outlet/keuangan/akunkas/[id]/ubah` (UA1a); nonaktifkan
  lewat tombol terpisah di halaman ubah (UA3a); dan aktifkan kembali
  lewat tombol di baris bagian lipat (UA2a).
- Form ubah mengirim hanya field yang berubah (UA4a): teks dibandingkan
  setelah dipangkas, keterangan yang dikosongkan dikirim `null`, dan
  tombol simpan mati bila tidak ada perubahan, karena backend menolak
  `PUT` tanpa perubahan dengan 400. Saldo hanya ditampilkan: validator
  backend menolak `saldo` saat update.
- Ganti status mengirim hanya `{ status }`. Penolakan 409 backend
  ditampilkan apa adanya di dalam dialog, karena pesannya memuat jumlah
  saldo atau nama metode: saldo belum 0, akun masih dipakai metode
  pembayaran (metode non-aktif ikut dihitung), dan batas 10 akun kas
  aktif saat mengaktifkan.
- Tombol Ubah dan Aktifkan kembali hanya tampil bagi pemegang
  `update-akunkas` (`features/akun-kas/izin.ts`); pengguna lain mendapat
  keterangan di halaman ubah. Rute ubah tanpa entri `IZIN_HALAMAN` saat
  itu; sejak `bc388c6` bersyarat `read-akunkas` dan `update-akunkas`,
  sehingga keterangan itu tidak lagi tercapai. Cabangnya dibuang di
  `dc0af1c`.
- Halaman ubah membaca akun dari cache daftar; `GET /akunkas/:id` tidak
  dipakai. `useUbahAkunKas` menginvalidasi akar `akunKas` dan
  `metodePembayaran`, karena respons metode memuat nama dan nomor akun
  kas tujuan.
- `routes/akunKasRoute.js` membatasi tambah dan ubah akun kas 30
  permintaan per menit per pengguna, dan hanya dilewati bila backend
  berjalan dengan `NODE_ENV=test`. Satu putaran spec ubah mengirim 15
  tulisan, sehingga pengulangan beruntun dijawab 429 (`pengujian.md`).
- Commit pertama pekerjaan ini (`5420f89`) dicabut dari `main` dan
  diganti `1bc76f4` dengan isi yang sama: pesan commit tidak memuat baris
  atribusi asisten, atas keputusan pemilik proyek (3 Oktober 2026).
- Tidak ada catatan backend baru. Kontrak `PUT /akunkas/:id` ditambahkan
  ke `kontrak/endpoint.md` dan `kontrak/payload.md`.
- Keputusan pemilik proyek: `keputusan.md` (Modul keuangan, UA1a sampai
  UA4a).

## Catatan dari pekerjaan mutasi arus kas dan akun kas

Selesai pada 3 Oktober 2026 dalam dua commit. Suite e2e penuh dijalankan
sekali di akhir (keputusan PF6a): 413 lolos, 1 gagal, dan 17 skipped.

| Commit | Isi |
|---|---|
| `e129f9d` | Halaman mutasi arus kas dari `GET /akunkas/mutasi`, dengan filter, ringkasan per akun, dan paginasi server |
| `6a57d12` | Halaman akun kas: kartu hanya untuk akun aktif, akun non-aktif di bagian lipat ringkas |

- Halaman mutasi adalah buku gabungan seluruh akun kas (MK1a): filter
  akun, periode, arah, dan jenis diterapkan backend bersama paginasi.
  Ringkasan periode tampil hanya saat satu akun dipilih (MK2a), dan
  halaman dibuka dengan bulan berjalan (MK3a).
  Sejak `d23844a` tanpa akun terpilih tampil ringkasan gabungan (NZ1a).
- Lapisan datanya ditambahkan ke `features/akun-kas` (`arsitektur.md`).
  Kedua hook mutasi selalu dimuat ulang saat dibuka, karena pembayaran
  mengubah buku tanpa menginvalidasi akar `akunKas`.
- Batas periode dikirim sebagai ISO utuh dari awal dan akhir hari lokal:
  tanggal tanpa jam dibaca backend sebagai tengah malam UTC, terbukti
  dari respons nyata (`kontrak/temuan.md` butir 123).
- Butir 61 terpenuhi. Catatan backend baru: butir 123 sampai 125,
  dilaporkan 3 Oktober 2026 (`backend.md`). Kontrak mutasi dan ringkasan
  ditambahkan ke `kontrak/endpoint.md`.
- Satu kegagalan suite penuh berasal dari backend, bukan dari kode:
  `POST /aset` saat menyiapkan data spec aset dijawab 500 "Connection
  operation buffering timed out after 10000ms" (koneksi Mongoose ke basis
  data). Spec itu lolos 50 dari 50 saat diulang dua putaran
  (`pengujian.md`).
- Keputusan pemilik proyek: `keputusan.md` (Modul keuangan, MK1a sampai
  MK3a dan AK1a).

## Catatan dari modul panel admin

Modul panel admin selesai pada 2 dan 3 Oktober 2026 dalam empat submodul,
dengan suite e2e penuh dijalankan sekali di akhir modul (keputusan PF6a):
410 lolos dan 17 skipped.

| Commit | Isi |
|---|---|
| `0f54b3c` | Fondasi: login admin menuju `/admin`, sesi akun dari token, guard, dan logout |
| `4e2a254` | Daftar akun dan buat akun klien |
| `10c7efb` | Langganan di halaman detail: bekukan, aktifkan, perpanjang, dan riwayat |
| `c824f18` | Ubah dan hapus akun klien, dan pembersihan akun uji lewat UI |

- Panel admin adalah ruang kerja di `/admin`, terpisah dari `/dashboard`
  (PA1a). Akun admin tidak punya toko maupun pengguna: ia dikenali dari
  `role` di payload token akun, masuk tanpa login pengguna, dan sesinya
  dipulihkan lewat refresh akun saja. Respons login admin terbukti tanpa
  `requireSetup` dan tanpa `daftarTenant`.
- Lapisan data di `features/admin-akun`, seluruhnya dengan token akun
  (`arsitektur.md`). Cakupannya akun dan langganan (PA2a); daftar toko dan
  kelola permission tidak ikut.
- Backend tidak punya endpoint detail satu akun, sehingga halaman detail
  dan halaman ubah membaca akun dari cache daftar (PA10b). Riwayat
  langganan berkursor tanpa jumlah total, sehingga dibaca lewat
  `apiMentah.get` dan ditampilkan bertahap (PA11a).
- Ubah hanya untuk username, email, dan password akun klien (PA3a, PA13a);
  hapus membawa password admin di body `DELETE` dan hanya untuk akun yang
  sudah dibekukan (PA14a).
- Kredensial admin uji tidak ada di repo: spec membacanya dari `.env.e2e`
  yang diabaikan git, dan tanpa berkas itu 16 skenario admin dilewati
  (PA5a, PA6a, `pengujian.md`).
- Password akun admin di basis data development diganti lewat model
  backend pada 2 Oktober 2026, karena password lamanya tidak diketahui dan
  tidak ada jalur API untuk itu tanpa login admin.
- Temuan backend baru: butir 113 sampai 122, dilaporkan 3 Oktober 2026
  (`backend.md`). Kontrak akun admin ditambahkan ke `kontrak/endpoint.md`
  dan `kontrak/payload.md`.
- Keputusan pemilik proyek: `keputusan.md` (Modul panel admin).

## Catatan dari modul Profil, login, dan sidebar

Modul terakhir migrasi halaman lama selesai pada 2 Oktober 2026 dalam
empat commit, dengan suite e2e penuh dijalankan sekali di akhir modul
(keputusan PF6a): 393 lolos dan 17 skipped.

| Commit | Isi |
|---|---|
| `0ed0e9a` | Spec pembanding halaman profil terhadap kode lama |
| `091be4e` | Halaman profil ke `features/pengguna`: form berskema, PIN 6 digit, dan login ulang setelah PIN berubah |
| `1c13ee6` | Login akun dan login pengguna ke `features/auth`, dengan form berskema dan respons bertipe |
| `57a7084` | Sidebar dipecah, izin dari sesi saat render, dan logout lewat `features/auth` |

- Tidak ada lagi halaman, komponen, maupun berkas `features/` yang
  mengimpor `apiClient`; ia tinggal lapisan terbawah di `lib/`
  (`arsitektur.md`). Login memakai `apiMentah`, karena `accessToken`
  berada di tingkat atas respons.
- Backend meloloskan `GET` dan `PUT /pengguna/:id` atas diri sendiri
  tanpa `read-pengguna` dan `update-pengguna`, dan seluruh field `PUT`
  opsional; keduanya berbeda dari kontrak lama dan dibuktikan dari web
  oleh pengguna uji "E2E Profil" (PF5a). Kontrak dikoreksi
  (`kontrak/endpoint.md`, `kontrak/payload.md`).
- Setelah PIN berubah backend memutus sesi. Halaman profil menitipkan
  pesan, mengakhiri sesi pengguna, dan menuju login pengguna (PF7a);
  `useAuthGuard` kini menuju `/login/pengguna` bila token akun masih
  ada, dan area login punya layout ber-Toaster sendiri.
- Sidebar dipecah menjadi `components/app-sidebar.tsx` (325 baris),
  `components/sidebar-menu.ts`, dan `components/sidebar-pengguna.tsx`.
  Nama pengguna dibaca lewat `usePenggunaSaya`, yang berbagi cache dengan
  halaman profil, dan avatar memakai inisial (PF9a).
- Login tahap kedua dinamai "pengguna", bukan "pin", di seluruh kode
  (`HalamanLoginPengguna`, `skemaLoginPengguna`), atas permintaan pemilik
  proyek.
- Temuan backend baru: butir 111 dan 112, dilaporkan 2 Oktober 2026
  (`backend.md`).
- Enam kegagalan pada run pertama submodul sidebar berasal dari server
  dev yang belum selesai mengompilasi satu rute, bukan dari kode
  (`pengujian.md`, Catatan Playwright).
- Keputusan pemilik proyek: `keputusan.md` (Modul Profil, login, dan
  sidebar).

## Catatan dari submodul diskon

Submodul 2 modul Pelanggan dan diskon selesai pada 2 Oktober 2026 dalam
empat commit, dan dengan itu modul Pelanggan dan diskon selesai.

| Commit | Isi |
|---|---|
| `8cb6f31` | Spec pembanding terhadap kode lama |
| `1e05df6` | Halaman ke `features/diskon`: ubah mengirim `PUT`, aktifkan dan nonaktifkan, aturan baca-saja (PD2a, PD3a) |
| `54f2938` | Form mengelola aturan tambahan (PD3a, PD6a sampai PD9a) |
| `52c550e` | Pilihan diskon kasir mengikuti `sedangBerlaku` (PD4a) |

- Halaman lama membaca `_id` dari respons ber-`id`, sehingga ubah
  mengirim `POST` dan hapus memanggil route yang tidak ada; dibuktikan
  lewat test terhadap kode lama sebelum spec pembanding di-commit
  (`kontrak/temuan.md` butir 110).
- Lapisan data dan komponen di `features/diskon` (`arsitektur.md`).
  Halaman diskon, buat penjualan, dan buat reservasi berbagi satu cache
  `diskon.daftar()`, dan filter halaman menyaring di klien.
- Backend `yoga` menegakkan aturan diskon saat penjualan dan booking
  disimpan. Web kini dapat membuat dan mengubah aturan itu, dan pilihan
  diskon kasir hanya menawarkan diskon yang sedang berlaku.
- Diskon tidak dapat dihapus, sehingga diskon uji dibuat Non-Aktif dan
  tertinggal lima per run suite penuh (`pengujian.md`, Utang pengujian).
- Temuan backend baru: butir 107 sampai 109, dilaporkan 2 Oktober 2026
  (`backend.md`). Kontrak diskon dikoreksi terhadap `yoga`
  (`kontrak/payload.md`, `kontrak/endpoint.md`).
- Tipe berakhiran `Lama` habis di seluruh repo.
- Keputusan pemilik proyek: `keputusan.md` (Modul Pelanggan dan diskon,
  PD2a sampai PD4a dan PD6a sampai PD9a).

## Catatan dari submodul pelanggan

Submodul 1 modul Pelanggan dan diskon selesai pada 2 Oktober 2026: spec
pembanding (`b6de75c`) dan migrasi (`d9365d3`). Halaman pelanggan tidak
lagi memakai `apiClient`, dan `PelangganLama` dihapus.

- Lapisan data dan komponen di `features/pelanggan` (`arsitektur.md`).
  Halaman, buat penjualan, dan buat reservasi berbagi satu cache
  `pelanggan.daftar()`.
- Dialog konfirmasi buat dan hapus kini hanya tertutup saat berhasil
  (keputusan Fase 0), label terhubung ke isiannya, dan daftar yang gagal
  dimuat tampil sebagai pesan.
- Backend menjawab 200 saat nomor HP, email, atau alamat dikosongkan
  tanpa mengubah nilainya (`kontrak/temuan.md` butir 104); web mengirim
  teks kosong lalu memperingatkan dari hasil simpan (PD5a), dan skenario
  pengosongannya menunggu sebagai `test.fixme`.
- `PUT /pelanggan/:id` menerima operator MongoDB dari body, dibuktikan
  lewat permintaan nyata (butir 105, alasan keamanan). Temuan backend
  baru: butir 104 sampai 106, dilaporkan 2 Oktober 2026 (`backend.md`).
- Satu selector spec pembanding berubah di commit migrasi, karena dialog
  yang kini bertahan menyembunyikan `main` dari pohon aksesibilitas
  (`pengujian.md`, Catatan Playwright).
- Kontrak pelanggan dikoreksi terhadap `yoga` (`kontrak/payload.md`,
  `kontrak/endpoint.md`).
- Keputusan pemilik proyek: `keputusan.md` (Modul Pelanggan dan diskon).

## Catatan dari submodul profil outlet

Submodul 3 modul Pengaturan outlet selesai pada 2 Oktober 2026 dalam dua
commit: perbaikan menu sidebar setelah muat ulang (`ca6eb3d`) dan halaman
Profil Toko (`fcf2dd2`). Dengan itu modul Pengaturan outlet selesai.

- Lapisan data di `features/tenant` (`arsitektur.md`). Halaman memuat dua
  kartu dengan simpan masing-masing: profil tenant, dan lokasi Outlet
  lewat `IsianLokasi` (keputusan PO12a sampai PO14a).
- Token hasil `pin-refresh` membawa `tenantName` "Toko Tidak Diketahui"
  (`kontrak/temuan.md` butir 98), sehingga nama toko di sidebar dan
  halaman profil dibaca dari `GET /tenant/:id` (PO15a). Token tetap
  membawa role dan seluruh izin.
- Menu berizin dan nama pengguna di sidebar hilang setelah halaman dimuat
  ulang, karena effect sidebar hanya berjalan sekali sebelum sesi pulih.
  Itu bug frontend, diperbaiki di `ca6eb3d` (PO16a). Spec generate jadwal
  ikut dikoreksi, karena selama ini lolos berkat kaki sidebar yang kosong
  (`pengujian.md`, Catatan Playwright).
- Spec pembanding tidak ditulis, karena halaman lama hanya placeholder;
  ketujuh skenario ditulis bersama migrasi, seluruhnya lewat UI
  (keputusan rancangan butir 23).
- `urlSetup` form buat stock opname outlet kini menuju halaman Profil
  Toko, dan frasa "jam operasional" dibuang dari kartu indeks pengaturan.
- Payload token pengguna tidak membawa `nama`, sehingga nama pengguna di
  sidebar bergantung pada `GET /pengguna/:id`. Endpoint itu sempat dicatat
  mewajibkan `read-pengguna`; ternyata backend meloloskan diri sendiri
  tanpa izin itu (dibuktikan di `091be4e`).
- Temuan backend baru: butir 98 sampai 103, dilaporkan 2 Oktober 2026
  (`backend.md`). Kontrak tenant ditambahkan ke `kontrak/endpoint.md`,
  `kontrak/payload.md`, dan `kontrak/izin-halaman.md`.

## Catatan dari penyesuaian backend `yoga`

Backend lokal berpindah ke `origin/yoga` `50eede7` pada 1 Oktober 2026
(keputusan PY1a), sembilan commit di depan `465b438`. Route dan seed tidak
berubah: audit endpoint sama dengan sebelumnya, dan permission basis data
tetap sama dengan seed. Suite pertama terhadap `yoga` menghasilkan 332
lolos dan 15 gagal: empat belas test penjualan berhenti di fixture stok,
dan satu kejadian butir 77.

| Commit | Isi |
|---|---|
| `65edf8c` | Fixture stok penjualan mengikuti `produk.stok` dari inventory outlet (PY4a) |
| `a4304ce` | `alasanVoid` untuk pembayaran dan penjualan (PY5a), urutan server daftar penjualan (PY6a), dan `locationID` produk (PY7a) |

- Butir 11, 75, dan 83 terbukti diperbaiki backend lewat e2e. Butir 37
  tertutup sebagian: `produk.stok` bersumber dari outlet, tetapi tetap
  potret dan tetap memblokir finalisasi, sehingga `test.fixme`-nya
  dipertahankan.
- Dampak dibaca dari diff kode `465b438..yoga` per modul, bukan dari judul
  commit (`cara-kerja.md`).
- Kontrak produk, penjualan, pembayaran, dan sesi booking dikoreksi
  terhadap `yoga` (`kontrak/README.md`). Laporan untuk tim backend ada di
  `backend.md` (laporan penyesuaian `yoga`).

## Catatan dari PO11a

Diterapkan pada 1 Oktober 2026 (`366e9b7`), sebelum penyesuaian `yoga`
dan submodul profil outlet (keputusan PY2a).

- Lima permission yang tidak ada di seed backend dibuang dari template
  Manajer dan General Manajer di `lib/roleTemplates.ts`. Silang seluruh
  nama izin template terhadap `seeds/permissionSeed.js` backend: tidak
  ada lagi nama di luar seed.
- `POST /role` menolak nama izin yang tidak dikenal (400), tetapi halaman
  buat posisi dari template dan form role selalu mengirim id dan membuang
  nama tanpa padanan diam-diam. Dampak yang terlihat hanya badge
  "N Wewenang" yang lebih besar daripada izin tersimpan.
- Basis data development masih memuat kelima permission lama dan belum
  memuat tiga izin jurnal transfer, karena seed `465b438` belum dijalankan
  ulang. Diselaraskan langsung (keputusan PY3a, `refactor/backend.md`),
  dan temuannya dicatat di `kontrak/temuan.md` butir 97.

## Catatan dari submodul pajak

Submodul 2 modul Pengaturan outlet selesai pada 1 Oktober 2026: spec
pembanding (`9586e3c`), migrasi (`e0aaeca`), dan pelurusan komentar
invalidasi (`b84de56`). Tidak ada lagi halaman pajak yang memakai
`apiClient`, dan delapan tipe pajak lama dihapus.

- Lapisan data dan komponen di `features/pajak` (`arsitektur.md`). Buat
  penjualan tetap memakai `useDaftarPajak`.
- Seluruh operasi di kedua spec pajak berjalan lewat UI (keputusan
  rancangan butir 23), dengan helper bersama di
  `tests/helpers/pajak-uji.ts`. Aturan ini menemukan form buat lama yang
  menahan submit sampai prioritas diketik.
- `pajakList` di respons produk tidak mencerminkan pajak per produk yang
  dipasang, karena dibentuk dari field `pajak` dokumen produk, bukan dari
  relasi (`kontrak/temuan.md` butir 88); web tidak menampilkannya.
- Temuan backend baru: butir 88 sampai 96, dilaporkan 1 Oktober 2026.
- Kontrak pajak dan produk pajak dikoreksi terhadap `465b438`
  (`kontrak/payload.md`, `kontrak/endpoint.md`).
- Suite penuh `e0aaeca` sempat gagal di spec pembanding metode pembayaran,
  karena metode uji yang menumpuk mendorong `CASH` ke halaman kedua tabel;
  spec itu kini mencari lewat kotak pencarian (`cc65d93`).
- Keputusan pemilik proyek: `keputusan.md` (Modul Pengaturan outlet, PO6a
  sampai PO10a, dan keputusan rancangan butir 23).

## Catatan dari submodul metode pembayaran

Submodul 1 modul Pengaturan outlet selesai pada 1 Oktober 2026: spec
pembanding (`9ca273a`) dan migrasi (`3359497`). Tidak ada lagi halaman
metode pembayaran yang memakai `apiClient`, dan hapus diganti aktifkan dan
nonaktifkan (keputusan PO2a).

- Lapisan data di `features/metode-pembayaran` (`arsitektur.md`). Pilihan
  kasir di pembayaran penjualan tetap memakai metode aktif saja, sedangkan
  halaman kelola memakai `useDaftarMetodePembayaran({ semua: true })`.
- Butir 84 dan bagian metode pembayaran butir 82 selesai. Temuan backend
  baru: butir 85 sampai 87, serta perluasan butir 77 (`kontrak/temuan.md`).
- Kontrak `PUT /metodepembayaran/:id` dikoreksi terhadap `465b438`
  (`kontrak/payload.md`).
- Keputusan pemilik proyek: `keputusan.md` (Modul Pengaturan outlet, PO1a
  sampai PO5a dan PO10a).

## Catatan dari penyesuaian backend `465b438`

Backend di-fast-forward ke branch `nizar` `465b438` pada 30 September
2026, sebelumnya `ridho` `00b9957`. Suite pertama terhadap backend itu
menghasilkan 306 lolos, 8 gagal, dan 24 skipped; penyesuaiannya selesai
dalam delapan commit, dengan keputusan PB1a sampai PB14a (`keputusan.md`).

| Commit | Isi |
|---|---|
| `b85c2bd` | Penyesuaian keuangan, penjualan, pembayaran, reservasi, dan transfer stok (52 berkas) |
| `a10af75`, `e4bfc86`, `8134842`, `31ebd92` | `test.fixme` yang terbukti diperbaiki backend dilepas: hapus pengguna, timeline setelah void booking (R3a), hapus tarif, dan pelepasan tarif dari tipe aset |
| `6e314ae` | Terima surat jalan dengan `itemId` dan jumlah 0 sebagai barang tidak sampai, diuji sungguhan lewat UI |
| `b5a55c4` | Pembersihan data uji diperiksa; akun kas uji bersaldo 0 lalu dinonaktifkan |
| `b63cf08` | Footer `DataTable` memakai paginasi server, dengan pilihan jumlah baris |

- Kontrak dikoreksi terhadap `465b438` untuk penjualan, pembayaran,
  laporan, sesi booking, tipe aset, transfer stok, dan buat akun kas
  (`kontrak/payload.md`, `kontrak/endpoint.md`). Metode pembayaran
  dikoreksi 1 Oktober 2026 (`3359497`), begitu pula pajak (`e0aaeca`);
  pelanggan dikoreksi 2 Oktober 2026 (`d9365d3`), begitu pula diskon
  (`1e05df6`).
- Audit endpoint mencatat backend kini memiliki 243 route: tujuh route
  Lampiran A hilang, termasuk `DELETE /akunkas/:id`, `DELETE /diskon/:id`,
  dan `DELETE /metodepembayaran/:id`, dan empat route baru belum dipakai
  web, yaitu mutasi dan ringkasan akun kas serta check-in sesi booking.
  Lampiran A tidak diubah sampai pembangkitan ulang (`kontrak/README.md`).
  Check-in dibuang backend `nizar` `60575b5` tanpa pernah dipakai web.
- Status penjualan kini DRAFT, UNPAID, PARTIAL, PAID, dan VOID. Booking
  tersimpan UNPAID dan dapat di-void selama belum dibayar, sehingga web
  punya jalur batal booking lewat void penjualan (PB2a).
- Temuan untuk tim backend: `kontrak/temuan.md` butir 75 sampai 83.
  Butir 29, 30, 41, 43, dan 53 sampai 57 terbukti diperbaiki, butir 52
  sebagian, dan butir 33 serta 58 dilaporkan diperbaiki tetapi belum
  dibuktikan dari web saat itu; butir 33 terbukti lewat permintaan nyata
  dan butir 58 dari kode pada 4 Oktober 2026 (`03c4eb3`).
- `test.fixme` yang masih gagal terhadap `465b438`: jurnal Keluar yang
  langsung terbaca (butir 46), stok produk tingkat tenant (butir 37), dan
  ubah pola roster (validator model).
- Lima akun kas uji bersaldo yang tertinggal dihapus langsung dari basis
  data development beserta mutasi saldo awalnya (PB13a); setiap run kini
  meninggalkan satu akun kas uji non-aktif bersaldo 0.

## Catatan dari modul Gudang

Modul Gudang selesai pada 30 September 2026, kecuali dashboard gudang
yang eksekusinya ditunda (keputusan GD1a): spec pembanding (`2d7225b`),
layout, setup, dan lokasi sidebar (`9ce288b`), serta pengaturan gudang
(`319bd99`). Tidak ada lagi halaman ruang gudang yang memakai
`apiClient`, dan `LokasiListResponse` sudah dihapus.

- Lapisan data lokasi tetap satu, di `features/inventaris`: api dan hook
  buat serta perbarui lokasi, `akses-gudang.ts` untuk keputusan layout,
  `schema-lokasi.ts` untuk form, dan `IsianLokasi` untuk isian yang
  dipakai setup dan pengaturan. Sidebar dan layout gudang berbagi cache
  `lokasi.daftar()` (keputusan rancangan butir 12).
- Layout tidak lagi mengalihkan setiap galat ke `/dashboard`, sehingga
  pengalihan berputar bagi pengguna yang hanya punya ruang gudang hilang
  (GD4a). Jalur selain Owner hanya teruji di unit test.
- Setup yang berhasil tidak diuji e2e, karena tenant uji sudah punya
  gudang (GD6a). Pengaturan diuji dengan mengubah nama "Gudang A"
  sungguhan lalu mengembalikannya.
- Kontrak lokasi dikoreksi terhadap backend `00b9957`: `POST /location`
  dan `PUT /location/:id` di `payload.md`, serta urutan `GET /location`
  di `endpoint.md`. Temuan dashboard gudang dan outlet tercatat di
  `kontrak/temuan.md` butir 74 dan sudah dilaporkan.
- Keputusan pemilik proyek untuk modul ini ada di `keputusan.md` (Modul
  gudang, GD1a sampai GD6a).

## Catatan dari modul jadwal dan shift

Modul jadwal dan shift selesai pada 29 September 2026 dalam empat
submodul: shift (`f99b7cf`), pola roster (`dcc22e0`), kalender, kelola
manual, dan generate jadwal (`19227f8` dan `e2a0cfd`), serta monitoring
absensi (`845c2cf`). Spec pembandingnya di `d9af531`. Seluruh lapisan
data kini di `features/shift/`, `features/pola-roster/`,
`features/jadwal/`, dan `features/absensi/`, dan tidak ada lagi halaman
modul ini yang memakai `apiClient`.

- Endpoint yang terlibat: `/jadwalshift` (termasuk `bulk`), `/shift`,
  `/polaroster`, `/pengguna`, dan `/absensi/monitoring`. Route jadwal,
  shift, dan pola roster tanpa `checkPermission` (`kontrak/temuan.md`
  butir 5); monitoring absensi memeriksa `read-absensi` di controller.
  Halaman jadwal dan generate jadwal bergate `read-pengguna`, dan enam
  permission jadwal belum ada di seed (butir 4). `GET /shift` tanpa
  query string dijawab 500 (butir 8).
- Shift, pola roster, dan absensi belum dapat dipisahkan per lokasi di
  backend (keputusan SH5a, `kontrak/temuan.md` butir 70). Shift dan pola
  roster menunggu lewat konstanta null; widget absensi menyaring dengan
  karyawan ruang (AB4a).
- Edit pola roster menunggu backend (`test.fixme`), dan pola roster
  memakai hapus permanen (keputusan Fase 0).
- Spec: `tests/e2e/jadwal/` (jadwal, pola roster, dan shift) dengan
  fixture di `tests/helpers/jadwal-uji.ts`, serta
  `tests/e2e/pengguna/absensi-widget.spec.ts`. Keputusan modul tercatat
  di `keputusan.md` (Modul jadwal dan shift), dan laporan backend di
  `kontrak/temuan.md` butir 62 sampai 73.

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
- Mutasi arus kas sempat menunggu endpoint mutasi kas dari backend
  (`kontrak/temuan.md` butir 61, keputusan KU1a); halamannya diwujudkan
  di `e129f9d` (Catatan dari pekerjaan mutasi arus kas dan akun kas).
- Setup tenant membuat akun kas bawaan "Kas Kecil (Laci)" `CASH-001` dan
  metode pembayaran "Tunai" yang bergantung padanya
  (`tenantService.createWithOwner`). Spec keuangan hanya menutup akun
  uji yang dibuatnya sendiri: sejak `b5a55c4` akun uji dibuat bersaldo 0
  lalu dinonaktifkan, karena `DELETE /akunkas/:id` tidak ada lagi dan akun
  bersaldo tidak dapat ditutup (`kontrak/temuan.md` butir 81).
- `AkunKasLama` dan `AkunKasRefLama` dihapus bersama migrasi metode
  pembayaran (`3359497`).
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
  Sejak backend `465b438` penjualan booking tersimpan UNPAID, dan booking
  dibatalkan lewat void penjualannya (Catatan dari penyesuaian backend
  `465b438`).
- Tarif dipilih otomatis oleh backend menurut tipe aset, hari, jam, dan
  prioritas, dan status aset "digunakan" dihitung dari booking Aktif yang
  sedang berjalan.
- Kontrak sesi booking dikoreksi pada 27 September 2026: validator dan dua
  jalur `POST /sesibooking` di `payload.md`, serta bentuk respons daftar
  di `endpoint.md` bagian 3.3. Route sesi booking per id tidak dipakai
  web, sehingga hanya tercatat di Lampiran A.
- Void penjualan tidak membersihkan cache daftar booking per tanggal
  (butir 57); diperbaiki backend `465b438`, dan `test.fixme` R3a dilepas
  di `e4bfc86`. Sebelumnya satu skenario daftar reservasi menunggu backend
  (keputusan R3a), dan slot booking uji di spec buat reservasi digeser
  menurut menit dan urutan pemanggilan agar tidak tertahan daftar yang
  basi.
- Daftar sesi booking menulis status Selesai saat dibaca (butir 58,
  diperbaiki di `465b438`, terbukti dari kode `50eede7`), dan
  sekitar 930 baris kode lama dikomentari di service sesi booking (butir
  59). Temuan master data reservasi tercatat di butir 51 sampai 55.
  Calon temuan yang belum dibuktikan dari kode: keberadaan tipe aset tidak
  diperiksa saat aset dibuat, dan `voidPenjualan` tidak terpakai.
- Data uji reservasi bernama tetap dan dibuat sekali: tipe aset, aset,
  aset berstatus perbaikan, tarif, pelanggan, serta diskon item dan diskon
  global uji. Setiap run spec daftar dan buat reservasi meninggalkan
  booking VOID (sebelumnya Batal) dan penjualan booking VOID.
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
  `PilihTanggal`; kedua `any`-nya dibereskan di `4f19e77`.
- `app/dashboard/outlet/inventaris/components/` berisi
  `inventaris-nav-tabs.tsx`; `BahanBakuCombobox` pindah ke
  `features/bahan-baku/bahan-baku-combobox.tsx` di `152088b`.
- Tambah barang di inventaris gudang hanya menawarkan master bahan baku.
  Barang inventory non-bahan (`barangInventoryID`, `/baranginventory`)
  belum dipakai web sama sekali; master data tetap bersumber dari outlet
  (`keputusan.md`, Model bisnis MVP). Dirapikan di modul gudang.
- Di ruang gudang, `gudang/layout.tsx` dan `gudang/setup` memakai
  `features/inventaris` sejak `9ce288b` (modul Gudang). Jadwal gudang
  sudah beralih ke `features/jadwal` di `19227f8`.
- Backend lokal: branch `ridho` `9cd1439`, yang menggabungkan origin/yoga
  `f0b7157` (21 September 2026, belum di-push). Berkas transfer stok tidak
  berubah sejak `f27f093`; `fc159bd` memasang validator allowlist di route
  inventory, dan spec stok lolos terhadapnya. Sejak 30 September 2026
  backend lokal adalah `nizar` `465b438` (Catatan dari penyesuaian backend
  `465b438`), dan sejak 1 Oktober 2026 `yoga` `50eede7` (Catatan dari
  penyesuaian backend `yoga`).
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

### Utang kecil dari penyesuaian backend `nizar`

- Backend lokal berada di cabang `ridho` `8dc6211` (fast-forward ke
  `origin/nizar`, belum di-push). Setiap kali `yoga` atau `nizar` maju,
  cabang itu digabung ulang dengan pemeriksaan kelengkapan
  (`backend.md`), lalu kontrak dicocokkan ulang. Cabang uji lokal
  `uji-yoga-nizar` sudah dihapus (8 Oktober 2026).
- Indeks pelanggan di basis data development belum sesuai skema
  (`kontrak/temuan.md` butir 142); dibiarkan sebagai bukti sampai backend
  menyediakan migrasi indeks.
- Booking milik sebuah penjualan belum disertakan di respons detail
  penjualan; permintaannya ditunda (NZ9a).
- Penyesuaian terhadap `yoga` `55328f1` belum dikerjakan: izin kategori
  beban (`kontrak/temuan.md` butir 130), `tipePajak` di `PUT /pajak/:id`
  (butir 91), dan satuan resep (butir 15).
- Bagian Sesi Booking di detail penjualan memakai tata letak sederhana di
  atas grid informasi; penempatannya menunggu fase UI/UX.
- Timeline reservasi tidak punya aksi Tandai Selesai (NZ7a). Booking lama
  berstatus Batal dibaca VOID sejak backend `nizar` `8dc6211`, sehingga
  menurut kode tidak tampil lagi (`kontrak/temuan.md` butir 141); belum
  dilihat langsung di timeline.
- Khusus member belum ditawarkan di form diskon (NZ6a); ditinjau bersama
  modul membership.
- Mutasi transfer di buku mutasi tidak bertaut ke riwayat Pindah Dana,
  karena riwayat itu tidak punya halaman per transfer.

### Utang kecil dari gerbang rute

- Pesan gerbang bersifat umum dan tidak menyebut halaman maupun izin yang
  kurang.
- Syarat 44 entri baru diturunkan dari nama hook dan kontrak, bukan dari
  trace per halaman (`pengujian.md`, Utang pengujian).

### Utang kecil dari penyesuaian backend `fc29433`

- Izin beban operasional belum masuk template role (keputusan FC2a);
  ditambahkan bersama halaman pengeluaran.
- Pilihan satuan resep hanya terbukti dari respons nyata untuk bahan
  bersatuan pcs, gram, dan ml. Untuk kg, liter, pak, dan unit, isi
  `availableUnits` dibaca dari kode backend, karena data development
  tidak punya bahan bersatuan itu.

### Utang kecil dari modul penjualan dan pembayaran

- Tipe berakhiran `Lama` (`keputusan.md` butir 19) habis sejak `1e05df6`:
  `PelangganLama` dihapus di `d9365d3` dan `DiskonLama` di `1e05df6`.
  Riwayatnya: tipe itu dipakai halaman lama lewat alias impor, dan masing-masing
  dihapus di commit migrasi modul pemiliknya. Sisanya dihitung dengan
  `grep -rhoE 'export interface [A-Za-z]+Lama\b' types | wc -l` (2 per
  `e0aaeca`, yang menghapus `PajakLama`, `ProdukPajakRelasiLama`, dan
  `PajakDariProdukLama`; 5 per `3359497`, yang menghapus `AkunKasLama`,
  `AkunKasRefLama`, dan `MetodePembayaranLama`, dan pesan commit itu
  keliru menyebut enam). Per `d9365d3` tersisa 1, dan per `1e05df6` 0.
- `features/penjualan/halaman-buat-penjualan.tsx` masih 1.087 baris:
  migrasi memindahkan lapisan data dan membuang `any`, tetapi tidak memecah
  komponennya. Pisahkan pemilih pelanggan, pemilih diskon, dan pratinjau
  total saat halaman itu disentuh lagi.
- Cakupan outlet daftar penjualan (K11b) dan `locationID` buat penjualan
  (K13a) hanya berlaku bagi pemegang `read-location`; pengguna lain melihat
  seluruh penjualan tenant dan tidak mengirim lokasi. Halaman buat belum
  punya pemilih outlet bagi pemegang izin lintas outlet. Keduanya wajib
  ditutup sebelum multi-outlet (`kontrak/temuan.md` butir 48 dan 49).
- Dua `test.fixme` di spec alur penjualan menunggu backend, keduanya
  untuk cache daftar jurnal (`kontrak/temuan.md` butir 46). Yang ketiga
  (butir 37) dilepas di `a17d584` setelah backend `fc29433`.
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

### Utang kecil dari modul keuangan

- Halaman pengeluaran menampilkan keterangan belum tersedia sejak
  `7fce871`, dan gate-nya masih `read-pembayaran`. Halamannya dibangun
  begitu backend memperbaiki izin beban dan menetapkan kontraknya
  (`kontrak/temuan.md` butir 130 sampai 132).
- `DELETE /akunkas/:id` tidak ada lagi sejak backend `465b438`, dan akun
  bersaldo tidak dapat ditutup (`kontrak/temuan.md` butir 81). Ubah,
  nonaktifkan, dan aktifkan kembali tersedia sejak `1bc76f4`, dan Pindah
  Dana sejak `e53c016`. Menutup akun bersaldo dengan memindah saldonya
  lebih dulu teruji sebagai satu alur sejak `f7805ca`; backend tetap
  tidak punya jalur koreksi saldo.
- Riwayat transfer berfilter periode sejak `8072214` (NZ3a). Ubah
  keterangan transfer tanpa VOID tidak dibuat.
- Halaman mutasi arus kas menampilkan pencatat, tautan penjualan, dan
  ringkasan gabungan sejak `d23844a` (NZ1a dan NZ2a).
  `GET /akunkas/:id/mutasi` tidak dipakai web, karena buku gabungan
  menerima `akunKasID`.
- Tampilan halaman akun kas dan halaman ubah bagi pengguna tanpa
  `update-akunkas` belum teruji e2e (`pengujian.md`), dan halaman ubah
  membaca akun dari cache daftar tanpa `GET /akunkas/:id`.
- Label jenis mutasi saldo awal dan beban belum pernah tampil dengan data
  nyata. Tampilan mutasi transfer dan pembatalan transfer masuk teruji
  e2e sejak `f7805ca`; pembatalan transfer keluar hanya teruji di unit
  test.

### Utang kecil dari modul jadwal dan shift

- Hapus jadwal masih memakai `confirm` bawaan browser, berbeda dengan
  dialog konfirmasi di modul lain; spec kelola jadwal bergantung padanya
  (`page.once("dialog")`). Diseragamkan bila pemilik proyek memutuskan.
- Shift outlet dan gudang masih memakai daftar tenant yang sama sampai
  backend memisahkan shift per lokasi (`KUNCI_LOKASI_SHIFT`, keputusan
  SH1b, `kontrak/temuan.md` butir 70).
- Query `?workspace=` pada `GET /shift` hanya penanganan sementara,
  karena backend menjawab 500 tanpa query apa pun (`kontrak/temuan.md`
  butir 8). Dibuang begitu backend diperbaiki (`features/shift/ruang.ts`).
- Pola roster outlet dan gudang masih memakai daftar tenant yang sama
  sampai backend memisahkannya per lokasi (`KUNCI_LOKASI_POLA_ROSTER`,
  keputusan PL5, `kontrak/temuan.md` butir 70).
- Ubah pola roster tetap gagal karena validator model backend
  (`test.fixme` di `pengujian.md`); tombol ubah tetap ditampilkan dan
  galatnya diteruskan ke pengguna.
- `keterangan` dan `dibuatPada` di `PolaRosterItem` masih opsional, walau
  halaman generate lama yang memetakan pola sendiri sudah tidak ada
  (`19227f8`); dijadikan wajib bersama perapian tipe berikutnya.

### Utang kecil dari modul Gudang

- Dashboard gudang (`app/dashboard/gudang/page.tsx`) masih placeholder.
  Sumber datanya sudah diputuskan (GD1a), tetapi eksekusinya ditunda
  sampai pemilik proyek menentukan layout dan UI/UX-nya.
- Dashboard outlet (`app/dashboard/outlet/page.tsx`) juga placeholder,
  dan `GET /dashboard/outlet` belum dipakai web; di luar cakupan modul
  Gudang.

### Utang kecil dari modul Pengaturan outlet

- Form buat dan ubah metode pembayaran bergantung pada `read-akunkas`
  untuk pilihan akun tujuan, walau backend hanya mewajibkan izin create
  atau update metode; tanpa izin itu form menampilkan pesan gagal memuat.
  Diputuskan bila ada role yang membutuhkannya
  (`kontrak/izin-halaman.md`).
- Enam tipe aset uji tertinggal sebagai bukti butir 77
  (`kontrak/temuan.md`), dan dihapus lewat API setelah laporan backend
  diterima.
- Tab pajak per produk tidak dapat menampilkan relasi ke pajak nonaktif,
  karena backend tidak mengirimnya (`kontrak/temuan.md` butir 93), sehingga
  produk itu tampak tanpa pajak dan konfirmasi ganti tidak muncul.
- Pajak per aset (`assetID` di `POST /produkpajak`) belum dipakai web;
  ditinjau bersama modul reservasi bila dibutuhkan.
- `pajakList` di tipe `Produk` tetap ada tetapi tidak dipakai tampilan,
  karena tidak mencerminkan relasi pajak (`kontrak/temuan.md` butir 88).
- Wewenang yang namanya tidak punya padanan id di daftar permission
  dibuang diam-diam saat form role menyusun payload (`payloadBuatRole`),
  dan teks tombol simpan form role tetap "Simpan Perubahan" saat membuat
  posisi baru; keduanya dipertahankan dari form lama (`597a163`).

### Utang kecil dari modul Profil, login, dan sidebar

- Tombol hapus akun di halaman profil tampil nonaktif (PF2a) sampai
  backend punya jalur hapus akun sendiri bagi Owner (`kontrak/temuan.md`
  butir 112).
- Unggah foto profil belum ada; avatar memakai inisial (PF9a). Bukan
  kebutuhan MVP, dan ditinjau setelah rilis.
- Teks tombol saat memuat di login pengguna masih "Menerbitkan Token
  C...", istilah internal; penggantiannya menunggu keputusan pemilik
  proyek.
- Halaman ringkasan laba rugi memicu peringatan ukuran grafik di konsol
  (lebar dan tinggi -1 saat render pertama). Penyebabnya belum ditelusuri
  dari kode, dan grafiknya tetap tampil.

### Utang kecil dari modul panel admin

- Daftar akun dimuat seluruhnya tanpa paginasi, dan halaman detail serta
  halaman ubah membaca akun dari cache daftar, karena backend tidak punya
  endpoint detail maupun daftar yang dapat dipotong (`kontrak/temuan.md`
  butir 119). Diganti begitu endpoint-nya ada.
- Akun admin baca-saja di panel (PA13a): tidak ada jalur web untuk
  mengubah atau mengganti password akun admin, termasuk miliknya sendiri.
- Daftar toko (`GET /tenant`) dan kelola permission platform di luar
  cakupan putaran ini (PA2a).
- Dialog aktifkan mewajibkan durasi untuk akun tanpa masa akses, mengikuti
  backend (`durasiWajibSaatAktifkan`, `kontrak/temuan.md` butir 115);
  disesuaikan begitu makna masa akses kosong diputuskan.
- Password admin yang salah saat hapus dijawab 401, sehingga klien
  menyegarkan token lalu mengulang `DELETE` (butir 114); web menampilkan
  pesannya tanpa penanganan sementara.
- Kepala panel admin tidak menampilkan identitas admin yang sedang masuk,
  karena token akun tidak membawa email, dan tampilannya masih sederhana
  dengan token tema; layout dan UI/UX-nya menunggu keputusan pemilik proyek.

### Utang kecil dari penyesuaian backend `f27f093`

- Setelah validator stock opname diperbaiki backend (`kontrak/temuan.md`
  butir 22): balik `SERVER_TERIMA_HITUNGAN_KOSONG` menjadi true, tulis badan
  `test.fixme` "hitungan tersimpan dapat dikosongkan kembali", dan pastikan
  hanya field yang berubah yang terkirim.
- Kontrak dikoreksi tertarget terhadap `f27f093`, lalu terhadap `9cd1439`
  untuk transfer stok dan validator inventory. Pembangkitan ulang penuh
  ditunda sampai backend menyelesaikan modul produk, bahan baku, stok, dan
  WMS, dan hanya atas perintah pemilik proyek.
- `features/stock-opname/halaman-detail-stock-opname.tsx` melewati 700
  baris (714) sejak penjaga ruang ditambahkan di `eb0181f`, dan kini 712
  baris setelah pemanggilan guard dibuang (`628f52e`). Pisahkan dialog
  aksi dan tabel hitungan saat halaman itu disentuh lagi.
