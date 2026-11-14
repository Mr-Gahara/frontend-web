# Modul Penjualan dan Pembayaran

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul penjualan dan pembayaran

Diputuskan pemilik proyek pada 24 sampai 26 September 2026, dengan prinsip
keputusan rancangan butir 17.

- **K1a: data referensi lintas modul ada di `features/<domain>/`**
  (pelanggan, diskon, pajak, akun kas, metode pembayaran). Masing-masing
  dibuat di submodul pemakai pertamanya, dengan kunci `daftar()` yang
  berbeda dari kunci yang diisi halaman lama (butir 12).
- **K2a: pembayaran dari web tidak mengirim `status`.** Backend
  menentukannya dari metode, dan karena `isAutomated` tidak ada di model,
  hasilnya selalu PAID (`kontrak/temuan.md` butir 45).
- **K3a: buat penjualan mengirim `x-idempotency-key`**, satu kunci per
  pengisian form (butir 20).
  Buat pembayaran memakai pola yang sama sejak `26093b0` (RH1a).
- **K4a: halaman buat penjualan tidak menampilkan stok produk**, karena
  `produk.stok` tidak terhubung ke lokasi mana pun (`kontrak/temuan.md`
  butir 37). Dipertahankan sejak backend `yoga` (keputusan PY4a):
  `produk.stok` kini potret stok outlet saat produk disimpan, belum stok
  yang hidup. Tetap dipertahankan setelah backend `fc29433` (keputusan
  backend P15): finalisasi tidak lagi memakainya, tetapi angkanya di
  respons produk masih potret.
- **K5b dan K11b: daftar penjualan memakai cakupan outlet hanya bagi
  pemegang `read-location`.** Template Guest, Staff, dan Kasir memegang
  `read-penjualan` tanpa `read-location`, sehingga gate tidak ditambah, dan
  pengguna tanpa izin itu melihat penjualan seluruh tenant (pada MVP satu
  outlet sama dengan outlet tenant). Penjualan tanpa `locationID` dianggap
  milik outlet tenant, sama dengan cadangan backend saat finalisasi. Wajib
  ditutup sebelum multi-outlet (`kontrak/temuan.md` butir 48 dan 49).
  Tetap di klien setelah backend punya filter `locationID` (RH2b).
  Disaring server sejak `20c026b` (RG4a), dan anggapan penjualan tanpa
  `locationID` milik outlet tenant ikut dibuang.
- **K6b: spec alur membuktikan alur bisnis sampai stok dan pembayaran**,
  dengan stok disiapkan sesuai kebutuhan setiap test, walau meninggalkan
  penjualan FINAL (sejak backend `465b438` berstatus PAID) dan pembayaran
  di data uji.
- **K8a: tipe ber-`_id` yang masih dibaca halaman lama menjadi tipe
  `Lama`** (butir 19), dengan syarat pemilik proyek: frontend akhirnya
  harus bersih dari `_id`.
- **K9a: asersi jurnal stok menjadi `test.fixme`** selama cache daftar
  jurnal tidak dibersihkan saat jurnal ditulis (`kontrak/temuan.md` butir
  46).
  Dilepas di `936f073`, setelah backend `yoga` `b63811d` membuang cache itu.
- **K10a: pemeriksaan dialog yang bertahan saat gagal dipisah ke
  `test.fixme` per submodul pemiliknya**, agar suite hijau di setiap
  commit. Ketiganya sudah dibuka di submodul 2 dan 3.
- **K12a: kolom Metode di riwayat pembayaran menampilkan nama metode
  sebenarnya** dari daftar metode pembayaran, dan `-` bila tidak dapat
  ditentukan, menggantikan "Kasir" yang selalu tampil. Sejak `b85c2bd` nama metode
  dibaca dari respons detail (PB4a).
- **K13a: buat penjualan mengirim outlet tenant sebagai `locationID`** bagi
  pemegang `read-location`. Pemilih outlet bagi pemegang izin lintas outlet
  ditunda sampai multi-outlet.
- **Detail dan pembayaran yang tidak ditemukan menampilkan pesan** tanpa
  pengalihan otomatis, sejalan dengan detail stock opname.
- **Dialog void, hapus, finalisasi, konfirmasi pembayaran, dan buat
  penjualan hanya tertutup saat berhasil** (keputusan Fase 0).

- **WK1a: tanggal dan jam transaksi mengikuti jam berjalan sampai kasir
  mengubahnya**, dan penjualan yang tidak diubah memakai waktu saat
  simpan (pemilik proyek, 26 Oktober 2026, `7a08b63`;
  `inti/keputusan-rancangan.md` butir 28). Sebelumnya keduanya terisi
  waktu layar dibuka, sehingga penjualan yang dikonfirmasi lewat tengah
  malam masuk hari kemarin.
- **VD1a: VOID penjualan tidak mengembalikan stok** (pemilik proyek,
  10 November 2026). Stok yang terpotong saat penjualan disimpan tetap
  keluar setelah penjualan di-VOID, dan menghapus draft tidak memulihkan
  apa pun. Ini aturan produk, bukan bug; jangan dijadikan temuan. Tetapi
  penjualan itu, termasuk setelah di-VOID, harus tetap mencatat stok apa
  saja yang sudah berkurang karenanya. Data uji yang memotong stok lalu
  di-VOID menurunkan stok bahan uji seterusnya, sehingga spec menyetel
  stoknya di awal setiap test.
- **VD2a: pencatatan stok keluar per penjualan diminta ke backend**
  (pemilik proyek, 10 November 2026). Saat ini tidak tertelusur
  (`kontrak/temuan.md` butir 181); dicatat langsung di
  `docs/pengembangan/klien.md` backend `aeb6a52` untuk Nizar dan Yoga.
- **VD3a: tampilan stok keluar di detail penjualan menunggu desain
  pemilik proyek**, dikerjakan setelah backend mengirim rinciannya.
  Backend `d6709a1` mengirimnya sebagai `rincianStok` (P78, B320);
  dikerjakan sebagai pekerjaan UI berikutnya lewat kanvas (pemilik proyek,
  12 November 2026).

### Stok keluar di detail penjualan

Diputuskan pemilik proyek pada 12 November 2026 dari tiga desain kanvas
"Stok Keluar Detail Penjualan" (A sampai C, desktop dan HP 390 px), lalu
tiga revisi warna. Menutup VD3a.

- **VD4a: desain A**, kartu "Stok Keluar" di bawah Rincian Item
  (`features/penjualan/kartu-stok-keluar.tsx`, aturan di
  `features/penjualan/stok-keluar.ts`). `rincianStok` dikelompokkan per
  produk menurut urutan item (judul berlatar krem "Nama × jumlah"); baris
  Barang, Jenis (lencana "Bahan baku" `bg-sage/15` dan "Stok produk"
  `bg-navy/8`, teks navy), dan Jumlah keluar mono tebal merah lembut
  `text-red-800` (sama dengan kolom Keluar Jurnal Stok dan Mutasi Kas);
  judul kolomnya tetap warna biasa. Produk dan bahan yang sama di beberapa
  baris item digabung. Di bawah `sm` baris bertumpuk dengan jumlah di
  kanan. Kartu dibangun sebagai daftar, bukan `Table`, agar sama dengan
  kanvas (pengecualian butir 26).
- **VD5a: penjualan VOID** menampilkan "Penjualan ini di-VOID. Stok di
  bawah tetap keluar dan tidak dikembalikan." tanpa latar: teks tebal
  bergaris bawah tipis navy dengan ikon info.
- **VD6a: tanpa tautan ke Jurnal Stok**; arah sebaliknya sudah ada (JS2a).
- **VD7a: rincian kosong tetap tampil** dengan kalimat: DRAFT "Stok belum
  dipotong. Rinciannya muncul setelah penjualan disimpan.", selain itu
  "Tidak ada stok yang tercatat keluar untuk penjualan ini." Penjualan
  sebelum backend `d6709a1` dan penjualan yang semua produknya Stok Tak
  Terbatas tidak dapat dibedakan.
- **VD8a: tampil bagi semua yang membuka detail penjualan**, tanpa izin
  tambahan, mengikuti respons backend.
- **VD9a: item tanpa rincian disebut tanpa alasan**: "Air Mineral tidak
  memotong stok.", karena respons tidak membawa penanda Stok Tak Terbatas.
- **VD10a: nama outlet di subjudul** ("Dipotong dari <outlet> saat
  penjualan disimpan.") hanya bila outlet tenant terbaca (`read-location`)
  dan sama dengan lokasi rincian; selain itu "Dipotong saat penjualan
  disimpan."

- **BP1a: kolom kanan buat penjualan berhenti di atas baris aksi**
  (pemilik proyek, 12 November 2026). Di lebar `lg` ke atas kolom kanan
  yang `sticky` dibatasi seluruh form, sehingga saat digulir kartu
  Ringkasan menutupi baris Batal dan Buat Penjualan. Kedua kolom kini
  dibungkus grid sendiri; tampilan lain dan HP tidak berubah. Diuji
  `tests/e2e/penjualan/tampilan-buat-penjualan.spec.ts` di 1024 dan
  1280 px, yang gagal terhadap kode lama.

### Cakupan daftar penjualan

Diputuskan pemilik proyek pada 18 Oktober 2026, saat RG4a diterapkan
(`20c026b`). Labelnya LP.

- **LP1a: mengganti outlet di daftar penjualan kembali ke halaman 1**,
  dengan filter, urutan, dan jumlah baris dipertahankan, seperti
  mengganti jumlah baris (PB14a) dan urutan (PY6a). Halaman disesuaikan
  saat render, bukan lewat effect, agar halaman lama tidak diminta untuk
  lingkup baru. Hanya tercapai bagi pemegang izin lintas outlet.
- **LP2a: jalur lintas outlet daftar penjualan ditulis sebagai
  `test.fixme` bersyarat** pada `IZIN_LINTAS_OUTLET` (keputusan
  rancangan butir 18), dengan badan lengkap: memilih satu outlet
  mengirim `locationID` dan kembali ke halaman 1.
- **Rancangan tidak menutup multi-outlet** (pemilik proyek): setiap
  outlet disaring server, dan pemilih outlet serta pilihan "Semua
  Outlet" tetap ada. Multi-outlet direncanakan setelah rilis produksi.
- **Pekerjaan setelah ini adalah pengeluaran (beban operasional)**,
  mengakhiri penundaan BO1a, NZ11a, dan RG6a.
- Diterapkan tanpa ditanyakan (`20c026b`): `saringPenjualan`,
  `dalamLingkupPenjualan`, dan anggapan penjualan tanpa `locationID`
  milik outlet tenant dibuang, karena syaratnya terbukti dari data
  (total dengan filter outlet tenant sama dengan total tenant, 1.685);
  lingkup tidak lagi membawa `outletTenantId`, sehingga halaman daftar
  tidak memuat `useLokasiAktif` sendiri; lingkup dikirim lewat argumen
  `paramLokasi` di `useDaftarPenjualan`; dan K11b tidak berubah.

## Catatan

### Catatan dari cakupan daftar penjualan

Dikerjakan pada 18 Oktober 2026 dalam satu commit, terhadap backend
`ridho` `00de455`. `origin/nizar` tetap dua commit di depan (`96e890e`
dan `3efd05b`), dan cabang lain tidak maju.

| Commit | Isi |
|---|---|
| `20c026b` | Cakupan daftar penjualan disaring server lewat `locationID` (RG4a, LP1a, LP2a) |

- Syarat RG4a dibuktikan lewat permintaan nyata sebelum kode diubah:
  total penjualan tenant uji dan total dengan `?locationID=` outlet
  tenant sama-sama 1.685, dan 100 penjualan terbaru seluruhnya membawa
  `locationID` (`kontrak/temuan.md` butir 144).
- Penyaringan klien lama berjalan setelah server memotong halaman,
  sehingga dengan lebih dari satu outlet satu halaman dapat tampil
  kurang dari ukurannya, dan footer menghitung penjualan di luar
  lingkup. Pada MVP satu outlet cacat ini tidak terlihat.
- K11b tidak berubah: pengguna tanpa `read-location` tetap melihat
  seluruh penjualan tenant, tanpa `locationID`.
- `outletTenantId` di `lokasiFinalisasi` (`features/penjualan/payload.ts`)
  tetap: itu cadangan lokasi finalisasi, bukan lingkup daftar.
- Gerbang commit pertama menolak karena pemeriksaan sisanya mencakup
  seluruh `features/penjualan`, bukan berkas yang di-commit; yang
  diperbaiki gerbangnya (`arsip/pelajaran.md`).
- Vitest 659 lolos di 81 berkas, tidak berubah. Spec daftar penjualan 4
  lolos dan 1 skipped (fixme lintas outlet). Suite penuh tidak
  dijalankan (`inti/pengujian.md`).
- Tidak ada temuan backend baru, sehingga tidak ada laporan.
- Keputusan: `modul/penjualan.md` (Cakupan daftar penjualan, LP1a dan LP2a).

## Utang terbuka

### Utang kecil dari modul penjualan dan pembayaran

- Tipe berakhiran `Lama` (`inti/keputusan-rancangan.md` butir 19) habis sejak `1e05df6`:
  `PelangganLama` dihapus di `d9365d3` dan `DiskonLama` di `1e05df6`.
  Riwayatnya: tipe itu dipakai halaman lama lewat alias impor, dan masing-masing
  dihapus di commit migrasi modul pemiliknya. Sisanya dihitung dengan
  `grep -rhoE 'export interface [A-Za-z]+Lama\b' types | wc -l` (2 per
  `e0aaeca`, yang menghapus `PajakLama`, `ProdukPajakRelasiLama`, dan
  `PajakDariProdukLama`; 5 per `3359497`, yang menghapus `AkunKasLama`,
  `AkunKasRefLama`, dan `MetodePembayaranLama`, dan pesan commit itu
  keliru menyebut enam). Per `d9365d3` tersisa 1, dan per `1e05df6` 0.
- `features/penjualan/halaman-buat-penjualan.tsx` 698 baris per BP1a (dipecah di `584d6ae`; 1.098 per `7a08b63`):
  migrasi memindahkan lapisan data dan membuang `any`, tetapi tidak memecah
  komponennya. Pisahkan pemilih pelanggan, pemilih diskon, dan pratinjau
  total saat halaman itu disentuh lagi. Selesai di `7c004c2`: kartu
  Pelanggan, kartu Diskon Global dan Keterangan, dan `pilihan-diskon.ts`
  dipisah; halaman 438 baris (ringkasan tagihan sudah terpisah).
- Cakupan outlet daftar penjualan (K11b) dan `locationID` buat penjualan
  (K13a) hanya berlaku bagi pemegang `read-location`; pengguna lain melihat
  seluruh penjualan tenant dan tidak mengirim lokasi. Halaman buat belum
  punya pemilih outlet bagi pemegang izin lintas outlet. Keduanya wajib
  ditutup sebelum multi-outlet (`kontrak/temuan.md` butir 48 dan 49).
  Filter `?locationID=` backend belum dapat dipakai (butir 144, RH2b).
  Daftar memakainya sejak `20c026b` (RG4a); jalur tanpa `read-location`
  dan pemilih outlet di halaman buat tetap terbuka.
- Dua `test.fixme` di spec alur penjualan menunggu backend, keduanya
  untuk cache daftar jurnal (`kontrak/temuan.md` butir 46). Yang ketiga
  (butir 37) dilepas di `a17d584` setelah backend `fc29433`.
  Keduanya dilepas di `936f073`.
- Filter tanggal daftar penjualan tidak dapat dikosongkan langsung,
  karena `PilihTanggal` tidak punya tombol kosongkan; filter dikosongkan
  lewat reset filter. Selesai di `0df0ca5`: tombol Kosongkan di kalender
  (`modul/ui-ux.md`, CV5a).
