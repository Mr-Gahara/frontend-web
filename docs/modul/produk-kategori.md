# Modul Produk dan Kategori

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul produk dan kategori

- **Hapus kategori yang masih dipakai produk dicegah di frontend.** Dialog
  menyebut jumlah produk dan menonaktifkan Lanjutkan. Bila pengguna tidak
  boleh membaca produk, dialog hanya memperingatkan.
- **Produk yang kategorinya sudah dihapus** tampil "Tanpa kategori" dan harus
  dipilihkan kategori baru sebelum disimpan.
- **Satuan resep dibatasi** ke gram, ml, pcs, kg, dan liter, sesuai validator
  backend. Sejak `f64b518` juga pak dan unit (NZ13a).
- **Bug stok saat edit produk ditangani di frontend**: resep hanya dikirim bila
  perlu. Bila resep dihapus seluruhnya, backend tetap menjadikan stok 0, dan
  form memberi petunjuk agar stok diatur ulang.

Diputuskan pemilik proyek pada 4 Oktober 2026, untuk utang kecil modul
produk (`152088b`). Labelnya PR:

- **PR1a: `BahanBakuCombobox` pindah ke `features/bahan-baku`**
  (`bahan-baku-combobox.tsx`), karena komponennya khusus domain bahan
  baku, bukan UI lintas modul.
- **PR2a: ketiga pemilih bahan baku di spec produk memakai satu helper**
  yang memilih pemicu lewat teks tombolnya.
- **PR3a: nama produk uji berakhiran `Date.now()`**, mengikuti pola yang
  sudah ada di spec itu.
- Diterapkan tanpa ditanyakan (`152088b`): dialog hapus produk hanya
  tertutup saat berhasil (keputusan Fase 0), dengan `preventDefault` di
  `onClick`; dan jalur gagalnya diuji lewat `page.route` pada `DELETE`
  saja, setelah dibuktikan gagal terhadap halaman lama.

### Penyesuaian backend `ridho` lokal `4a19be8`

Diputuskan pemilik proyek 16 November 2026 (`referensi/keputusan-penyesuaian-backend.md`).

- **PV1a: daftar produk berhalaman di server** bersama pencarian
  (`cari`) dan tab Stok Kritis (`stokKritis`) (B340), tanpa tombol urut
  kolom; pesan kosong tidak berubah (`624761a`, `bf5212c`). Pemakai
  daftar utuh lain tetap `useDaftarProduk`.
- **PV2a: daftar Bahan Baku outlet berhalaman di server** dengan
  `locationID` outlet dan `cari` (B342). Saringan klien baris tanpa data
  master dibuang: data development tidak memuat satu pun, dan backend
  menghapus inventory bersama bahannya dalam satu transaksi. Baris
  seperti itu, bila kelak ada, tampil bernama "-" tanpa menu Edit dan
  Hapus (`6ab81aa`).

### Pembuktian B169 dan B170

Diputuskan pemilik proyek 18 November 2026
(`referensi/keputusan-penyesuaian-backend.md`, Pembuktian web 18 November
2026).

- **SR1a: isian stok produk beresep di form ubah menampilkan stok
  terhitung** dari respons detail (B169), bukan 0 yang dipaksa form
  selama ada resep. Isiannya tetap terkunci dan payload tetap mengirim
  stok 0 untuk produk beresep (`features/produk/payload.ts`); Unlimited
  tetap 0, dan resep lama yang dihapus seluruhnya tetap mengosongkan stok
  agar diisi ulang. Produk baru beresep tampil 0 (`4dc08e2`). Opsi
  lainnya: dibiarkan 0.

## Catatan

### Catatan dari utang kecil modul produk dan pemformat rupiah

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
- Keputusan pemilik proyek: `modul/produk-kategori.md` (Modul produk dan kategori,
  PR1a sampai PR3a; Modul keuangan, FR1a dan FR2a; keputusan rancangan
  butir 24).
