# Modul Panel Admin

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul panel admin

Diputuskan pemilik proyek pada 2 dan 3 Oktober 2026, dengan prinsip
keputusan rancangan butir 17, 21, dan 23. PA1a, PA5a, dan PA6a diterapkan
di `0f54b3c`; PA7a sampai PA9a di `4e2a254`; PA10b dan PA11a di `10c7efb`;
dan PA3a serta PA12a sampai PA14a di `c824f18`.

- **PA1a: panel admin berada di `/admin`, terpisah dari `/dashboard`**,
  dengan layout dan guard sendiri. Akun admin dikenali dari `role` di
  payload token akun dan masuk tanpa login pengguna; login akun admin
  menuju `/admin`, dan halaman toko maupun login pengguna mengembalikannya
  ke sana.
- **PA2a: cakupan putaran ini akun dan langganan**: daftar, buat, ubah,
  hapus, bekukan, aktifkan, perpanjang, dan riwayat. Daftar toko dan
  kelola permission platform tidak ikut.
- **PA3a: form ubah hanya username, email, dan password.** `role` dan
  `tenantID` tidak ditawarkan, walau backend menerimanya
  (`kontrak/temuan.md` butir 113).
- **PA4a: spec e2e memakai akun admin dari seed backend.**
- **PA5a: kredensial admin uji tidak masuk git.** Spec dan helper tetap di
  repo; email dan password dibaca dari variabel lingkungan atau `.env.e2e`
  yang diabaikan git, dan tanpa itu spec admin dilewati lewat `test.skip`
  bersyarat dengan alasan yang terlihat.
- **PA6a: dokumentasi dan pesan commit tidak memuat email maupun password
  akun admin.**
- **PA7a: akun admin tampil di daftar dengan penanda peran**; aksi hanya
  untuk akun klien, karena backend menolak membekukan dan melanggankan
  akun admin.
- **PA8b: form buat akun klien di halaman tersendiri**,
  `/admin/akun/buat`.
- **PA9a: akun klien uji dibuat lewat UI dengan email unik per run.**
  Pembersihannya sempat lewat API selama bekukan dan hapus belum ada di
  UI; sejak `c824f18` akun uji dibekukan dan dihapus lewat UI, dan API
  tinggal cadangan di `finally`.
- **PA10b: aksi langganan dan riwayat di halaman detail akun**,
  `/admin/akun/[id]`. Backend tidak punya endpoint detail satu akun,
  sehingga akun dibaca dari cache daftar, dan kekurangan itu dilaporkan
  (`kontrak/temuan.md` butir 119). Sejak `25aa498` detail dan ubah memuat
  satu akun dari `GET /akun/admin/users/:id` (B176).
- **PA11a: riwayat langganan bertahap dengan tombol muat berikutnya.**
  Backend memberi kursor tanpa jumlah total; kebutuhan total dilaporkan
  (butir 120). Sejak `821b7de` total dan pelaku tampil (B155).
- **PA12a: form ubah akun di halaman tersendiri**,
  `/admin/akun/[id]/ubah`.
- **PA13a: ubah dan hapus hanya untuk akun klien.** Akun admin baca-saja,
  sehingga admin tidak dapat mengunci dirinya sendiri atau admin lain dari
  web.
- **PA14a: tombol Hapus Akun selalu tampil untuk akun klien**, nonaktif
  dengan keterangan selama akunnya aktif, karena backend hanya menghapus
  akun non-aktif.
- **Pekerjaan setelah modul ini adalah mutasi arus kas** (3 Oktober 2026;
  selesai di `e129f9d`, Modul keuangan).
- Diterapkan tanpa ditanyakan (`0f54b3c`): makna `status` sesi tidak
  diubah, sehingga admin yang sudah masuk berstatus "keluar" dan dikenali
  dari role akunnya; role di luar `admin` diperlakukan sebagai klien;
  aturan pengalihan ditulis sebagai fungsi murni (butir 10); pemulihan
  sesi melewati `pin-refresh` untuk akun admin; dan logout admin tetap
  mengakhiri sesi lokal walau permintaannya gagal.
- Diterapkan tanpa ditanyakan (`4e2a254`, `10c7efb`, `c824f18`):
  pencarian dan filter status daftar di klien dari satu cache (butir 12);
  skema buat mengikuti validator backend, dan skema ubah diturunkan
  darinya karena `PUT` tidak punya validator; lama masa percobaan tidak
  ditulis di web karena berasal dari konfigurasi backend; akun tanpa masa
  akses tampil "Tidak dibatasi"; durasi saat mengaktifkan wajib bila masa
  akses kosong atau sudah lewat, mengikuti backend; dialog aksi dipasang
  setiap kali dibuka dan hanya tertutup saat berhasil (keputusan Fase 0);
  ubah hanya mengirim field yang berubah (butir 15), dengan username yang
  dikosongkan sebagai null; password admin yang salah ditampilkan apa
  adanya tanpa penanganan sementara (butir 17); dan halaman admin memakai
  token tema, bukan warna heksadesimal.

### Penyesuaian backend `ridho` `0024eb9`

Diputuskan pemilik proyek pada 31 Oktober 2026
(`referensi/keputusan-penyesuaian-backend.md`).

- **Daftar akun berhalaman di server bersama cari dan status**
  (`1ccf0ef`, B177; keputusan rancangan butir 27). `paramDaftarAkun`
  menggantikan `saringAkun`, cari dibatasi 100 karakter seperti backend,
  dan total tampil di footer tabel.
- **Riwayat menyebut pelaku dan total** (`821b7de`, B155): username atau
  email pelaku, "Sistem" untuk job pembeku, dan "Admin (akun terhapus)"
  bila akun pelakunya sudah dihapus; di atas daftar "Menampilkan x dari
  y catatan".
- **Aktifkan akun tanpa batas tidak mewajibkan durasi** (`482ac79`,
  B154): bawaannya "Tetap tidak dibatasi", dan memilih durasi membuat
  masa aksesnya berbatas. Durasi tetap wajib bila masa akses sudah
  lewat.
- Diterapkan tanpa ditanyakan (`25aa498`, B176): detail dan ubah dari
  `useAkun`, dengan id rusak (400) dan akun tidak ada (404) sebagai
  "Akun tidak ditemukan" (`akunTidakAda`).

## Catatan

### Catatan dari modul panel admin

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
  `requireSetup` dan tanpa `daftarTenant`; sejak B136 keduanya dikirim.
- Lapisan data di `features/admin-akun`, seluruhnya dengan token akun
  (`referensi/arsitektur.md`). Cakupannya akun dan langganan (PA2a); daftar toko dan
  kelola permission tidak ikut.
- Backend tidak punya endpoint detail satu akun, sehingga halaman detail
  dan halaman ubah membaca akun dari cache daftar (PA10b). Riwayat
  langganan berkursor tanpa jumlah total, sehingga dibaca lewat
  `apiMentah.get` dan ditampilkan bertahap (PA11a). Keduanya tersedia
  sejak B155 dan B176 (Catatan dari penyesuaian backend, di bawah).
- Ubah hanya untuk username, email, dan password akun klien (PA3a, PA13a);
  hapus membawa password admin di body `DELETE` dan hanya untuk akun yang
  sudah dibekukan (PA14a).
- Kredensial admin uji tidak ada di repo: spec membacanya dari `.env.e2e`
  yang diabaikan git, dan tanpa berkas itu 16 skenario admin (20 per 31
  Oktober 2026) dilewati (PA5a, PA6a, `inti/pengujian.md`).
- Password akun admin di basis data development diganti lewat model
  backend pada 2 Oktober 2026, karena password lamanya tidak diketahui dan
  tidak ada jalur API untuk itu tanpa login admin.
- Temuan backend baru: butir 113 sampai 122, dilaporkan 3 Oktober 2026
  (`arsip/laporan-backend.md`). Kontrak akun admin ditambahkan ke
  `kontrak/endpoint.md` dan `kontrak/payload.md`.
- Keputusan pemilik proyek: `modul/panel-admin.md` (Modul panel admin).

### Catatan dari penyesuaian backend `ridho` `0024eb9`

- Respons login admin kini sebentuk klien (`requireSetup: false`,
  `daftarTenant: []`, B136), dan tipe login menjadikan keduanya wajib
  (`5cd4ffb`). Password admin yang salah saat hapus dijawab 400 (B150).
- Spec admin memakai satu pintu `bukaDaftarAkun` di
  `tests/helpers/admin-uji.ts`: halaman pertama diperiksa `page=1` dan
  `limit=10`, dan seluruh akun dibaca lewat API dengan token permintaan
  halaman itu sendiri, karena login di konteks lain memutar
  `tokenVersion` admin.
- Skenario B154 memilih akun klien aktif tanpa batas selain akun uji
  utama, karena pembekuan mengeluarkan seluruh pengguna tokonya; bila
  langkah UI gagal, `aktifkanAkunKlienUji` memulihkannya di `finally`.

## Utang terbuka

### Utang kecil dari modul panel admin

- Daftar akun dimuat seluruhnya tanpa paginasi, dan halaman detail serta
  halaman ubah membaca akun dari cache daftar, karena backend tidak punya
  endpoint detail maupun daftar yang dapat dipotong (`kontrak/temuan.md`
  butir 119). Diganti begitu endpoint-nya ada. Selesai di `25aa498` dan
  `1ccf0ef` (B176, B177).
- Akun admin baca-saja di panel (PA13a): tidak ada jalur web untuk
  mengubah atau mengganti password akun admin, termasuk miliknya sendiri.
- Daftar toko (`GET /tenant`) dan kelola permission platform di luar
  cakupan putaran ini (PA2a).
- Dialog aktifkan mewajibkan durasi untuk akun tanpa masa akses, mengikuti
  backend (`durasiWajibSaatAktifkan`, `kontrak/temuan.md` butir 115);
  disesuaikan begitu makna masa akses kosong diputuskan. Selesai di
  `482ac79` (B154).
- Password admin yang salah saat hapus dijawab 401, sehingga klien
  menyegarkan token lalu mengulang `DELETE` (butir 114); web menampilkan
  pesannya tanpa penanganan sementara. Sejak B150 dijawab 400.
- Kepala panel admin tidak menampilkan identitas admin yang sedang masuk,
  karena token akun tidak membawa email, dan tampilannya masih sederhana
  dengan token tema; layout dan UI/UX-nya menunggu keputusan pemilik proyek.
### Utang kecil dari penyesuaian backend `ridho` `0024eb9`

- Perpindahan halaman daftar akun belum teruji e2e: skenarionya
  dilewati selama data uji berisi tidak lebih dari 10 akun.
