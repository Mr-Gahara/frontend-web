# Keputusan

Sifat perubahan: **Jarang**: bertambah saat ada keputusan baru. Butir lama boleh dilengkapi, tetapi tidak dibalik tanpa pembahasan.

Dua jenis keputusan yang mengikat pekerjaan refactor:

- **Keputusan produk**: perilaku yang dilihat pengguna, diputuskan pemilik
  proyek.
- **Keputusan rancangan**: aturan teknis yang berlaku lintas modul.

Keputusan yang sudah tercatat tidak dibalik tanpa pembahasan dengan pemilik
proyek. Keputusan baru ditambahkan di akhir kelompoknya, dan nomor butir
keputusan rancangan tidak diubah agar rujukan lama tetap berlaku.

## Keputusan produk

### Fase 0

Tidak boleh dibalik tanpa pembahasan:

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

### Modul produk dan kategori

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

### Submodul stock adjustment

- **Data yang terbukti salah dari backend tidak ditampilkan sebagai nilai.**
  Saldo sistem, koreksi, dan alasan adjustment tampil sebagai `-` atau
  keterangan "belum dikirim server", bukan 0 atau "tidak ada alasan"
  (`kontrak/temuan.md` butir 18).
- **Kolom sumber dihapus** dari daftar dan detail, karena respons tidak
  membawa `referenceType` dan kolom lama hanya mengulang nomor jurnal.

### Submodul jurnal stok

- **Kegagalan memuat tidak lagi tampil sebagai daftar kosong.** Tabel
  menampilkan pesan error, dan halaman outlet membedakan "gagal memuat
  lokasi" dari "lokasi belum dikonfigurasi".

### Submodul stok dan inventaris gudang

- **Gagal mengubah batas minimum atau opname di gudang kini menampilkan
  pesan.** Sebelumnya dialog tetap terbuka tanpa keterangan apa pun.
- **Perilaku lain dipertahankan**: catatan opname tetap wajib, opname tanpa
  selisih tetap diizinkan, dan pilihan "Semua Lokasi" di outlet tetap
  menampilkan stok seluruh lokasi bertipe Outlet. Sejak commit cakupan
  lokasi, pilihan itu hanya untuk owner; staf dibatasi ke lokasi aktif tanpa
  pemilih.

### Submodul stock opname

- **Cakupan lokasi di ruang outlet mengikuti peran.** Owner melihat seluruh
  outlet dengan pemilih lokasi (bawaan "Semua Outlet"); staf hanya lokasi
  aktifnya. Dokumen gudang tetap di ruang gudang. Owner dikenali lewat
  `useLevelPenggunaAktif` (keputusan rancangan butir 2). Pembatasan ini hanya di
  tampilan, karena backend mengirim data seluruh tenant kepada pemegang izin
  baca (`kontrak/temuan.md` butir 20). Aturan yang sama diterapkan juga ke
  jurnal stok dan stok outlet dalam commit cakupan lokasi.
- **Membuat opname di outlet tetap memakai lokasi aktif** untuk semua
  pengguna, termasuk owner, karena opname adalah hitungan fisik di tempat.
- **Tombol aksi disembunyikan sesuai izin**: `submit-stock-opname` untuk
  menghitung dan mengajukan, `review-stock-opname` untuk menyetujui, menolak,
  dan membatalkan (keputusan rancangan butir 14).
- **Pembatalan tersedia untuk DRAFT, SUBMITTED, dan REJECTED** bagi pemegang
  izin tinjau, sejalan dengan backend. Sebelumnya hanya dari SUBMITTED.
- **Simpan sementara hanya mengirim hitungan yang terisi**, karena backend
  menolak isian kosong (`kontrak/temuan.md` butir 19). Bila belum ada hitungan,
  pesan tampil tanpa memanggil backend.
- **Dialog aksi hanya tertutup saat berhasil**; saat gagal tetap terbuka
  beserta isiannya (keputusan Fase 0).
- **Detail membedakan dokumen yang tidak ditemukan dari kegagalan memuat.**
- **Gate daftar stock opname outlet ditambah `read-location`**, karena
  cakupan staf memanggil `/location/current`.

## Keputusan rancangan yang mengikat

1. **Tipe selalu memakai `id`**, tidak pernah `_id`, karena `lib/api/client.ts` menormalkan respons. Pola `id || _id` tidak boleh ditulis lagi.
2. **Owner tidak diperlakukan khusus** lewat pengecekan nama role. Backend memberi Owner seluruh permission, sehingga pemeriksaan berbasis daftar permission sudah mencakupnya. Pengecualian: `useLevelPenggunaAktif` memakai nama role untuk menentukan level 100, karena token tidak membawa level. Cakupan data lintas lokasi di ruang outlet juga mengikuti level itu (100 berarti owner) lewat `useCakupanLokasiOutlet`; halaman tidak memeriksa nama role sendiri.
3. **Invalidasi memakai akar domain** bila perubahan bisa memengaruhi beberapa varian. Kunci akar (`semua`) hanya untuk invalidasi, tidak untuk menyimpan data: halaman gudang lama memakai `queryKeys.bahanBaku.semua` sebagai kunci data master bahan baku.
4. **Field yang dipakai service tetapi tidak ada di validator** harus diperiksa sebelum dihapus dari payload (lihat `docs/kontrak/README.md` bagian 1, keterbatasan).
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
