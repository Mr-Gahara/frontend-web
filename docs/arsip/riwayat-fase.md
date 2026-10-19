# Arsip Riwayat Fase

Sifat perubahan: **Jarang**: hanya bertambah saat isi dipindah dari lapis lain; isi lama tidak diubah.

Lapis arsip: tidak perlu dikirim di chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Fase yang sudah selesai

### Fase 0 — Perbaikan bug dan konfigurasi test
Commit `751f4db` sampai `06857e1`. Pemisahan runner Playwright dan Vitest,
perbaikan auth, produk, reservasi, jadwal, pola roster, dan pengguna.

Keputusan produk yang dihasilkan tercatat di `arsip/keputusan-lama.md` (Fase 0).

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
| Gudang: cakupan per gudang | - | Dibatalkan (`inti/keputusan-rancangan.md`, Model bisnis MVP) |
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
| Keuangan: pengeluaran (beban operasional) | `7fce871` (keterangan belum tersedia) | Digantikan halaman sungguhan (baris Keuangan: halaman pengeluaran) |
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
| Penyesuaian backend `yoga` `55328f1` | `50e6485` (ubah pajak), `f64b518` (satuan resep) | Selesai (keputusan NZ11a sampai NZ13a; Catatan dari penyesuaian backend `yoga` `55328f1`) |
| Penyesuaian backend `ridho` `2dd57aa` | `936f073` (fixme jurnal), `26093b0` (idempotensi pembayaran), `a8aec53` (penyetuju uji), `f61e146` (izin stock adjustment), `ed4bfd3` (pajak nonaktif), `43f09af` (fixme hapus bahan baku) | Selesai (keputusan RH1a sampai RH6a; Catatan dari penyesuaian backend `ridho` `2dd57aa`) |
| Dashboard outlet | `342dcd3` (grafik bersama), `3812763` (lapisan data), `0c5822b` (halaman) | Selesai (keputusan DB1a sampai DB6a; Catatan dari fase UI/UX 11 Oktober 2026) |
| Token warna utama | `584a2d8` (lima warna), `ba28f25` (krem dan permukaan) | Selesai (keputusan WR1a sampai WR4a; Catatan dari fase UI/UX 11 Oktober 2026) |
| Tabel seragam: dasar tabel, panel pembungkus, mutasi arus kas, bahan baku | `93490bb` (dasar), `cc1092e` (kartu dan panel), `f44db05` (mutasi), `9cd22e1` (bahan baku) | Selesai (keputusan TB1a sampai TB7a; Catatan dari fase UI/UX 11 Oktober 2026) |
| Penyesuaian backend `ridho` `7d28135` | `f338c74` (pembayaran uji mutasi kas), `cfaaa92` (fixme hapus bahan baku) | Selesai (keputusan RG1a sampai RG8a; Catatan dari penyesuaian backend `ridho` `7d28135`) |
| Tabel seragam K-A: jurnal stok dan pengajuan stok | `4677447` (pilihan ukuran), `9b06283` (jurnal stok), `fc6ddd3` (warna keluar mutasi), `20e332f` (pengajuan stok) | Selesai (keputusan TB8a sampai TB12a; Catatan dari tabel seragam K-A) |
| Tabel seragam K-C: daftar surat jalan gudang | `6f9d3eb` | Selesai (keputusan TB13a sampai TB15a; Catatan dari tabel seragam K-C) |
| Tabel seragam K-B: stok outlet dan inventaris gudang | `753f61e` | Selesai (keputusan TB16a sampai TB18a; Catatan dari tabel seragam K-B) |
| Tabel seragam K-D: shift dan pola roster | `2177ac3` | Selesai (keputusan TB19a dan TB20a; Catatan dari tabel seragam K-D) |
| Tabel seragam K-E: aset, tarif, dan tipe aset | `eb81a1f` | Selesai (keputusan TB21a sampai TB23a; Catatan dari tabel seragam K-E) |
| Cakupan daftar penjualan lewat filter `locationID` server (RG4a) | `20c026b` | Selesai (keputusan LP1a dan LP2a; Catatan dari cakupan daftar penjualan) |
| Keuangan: halaman pengeluaran (beban operasional) | `61275ac`, `b2d84a6`, `87fbf7a`, `1d7fa7b` | Selesai (keputusan BO3a sampai BO7a; Catatan dari halaman pengeluaran) |
| Dashboard gudang: tata letak dan isi (GD1a) | - | **Berikutnya** (lihat Pekerjaan berikutnya) |

Keputusan produk tiap modul tercatat di `modul/produk-kategori.md`.
