# Arsip Keputusan Lama

Sifat perubahan: **Jarang**: hanya bertambah saat isi dipindah dari lapis lain; isi lama tidak diubah.

Lapis arsip: tidak perlu dikirim di chat baru. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Fase 0

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
  di `app`, `components`, `hooks`, `lib`, dan `types`, serta di `features`
  sejak `e43e000`.

## Error ESLint warisan

Diputuskan pemilik proyek pada 4 Oktober 2026. Labelnya EL:

- **EL1a: `storage.ts` di helper uji dihapus** (`4f19e77`), bukan hanya
  diperbaiki tipenya, karena tidak punya pengimpor dan membaca
  `sessionStorage` yang tidak dipakai sejak token pindah ke memori.
- **EL2a: form role dipecah sesuai keputusan rancangan butir 8**
  (`f5fe574`), bukan ditunda: `FormRole` memuat detail lalu memasang
  `IsiFormRole` dengan nilai awal, dan effect pengisinya dibuang.
- **EL3a: tiga commit per kelompok**, masing-masing dengan gerbang dan
  spec terdampaknya sendiri: tipe, kutip, dan `storage.ts` tanpa
  perubahan perilaku; hidrasi; lalu form role.
- **EL4a: deteksi hidrasi lewat satu hook bersama dengan lima pemakai**
  (`039ead4`): kedua halaman role, topbar, dan dua salinan
  `useSyncExternalStore` yang sudah ada di reservasi, agar pola itu hanya
  didefinisikan sekali (keputusan rancangan butir 12).
- **Pekerjaan setelah ini adalah utang kecil yang tidak menunggu
  backend** (selesai di `9195472`), lalu `useAuthGuard()` yang berulang
  (selesai di `628f52e`, useAuthGuard berulang).
- Diterapkan tanpa ditanyakan (`4f19e77`): `decodeJWT` mengembalikan
  `Record<string, unknown>`, dan `exp` yang bukan angka dianggap
  kedaluwarsa; tipe `Dropdown` kalender diambil dari `react-day-picker`;
  pilihan role di dialog pengguna membaca `role.id` tanpa cadangan `_id`
  (butir 1); dan fixture test dialog pengguna ditulis sesuai tipenya.
- Diterapkan tanpa ditanyakan (`f5fe574`): detail yang gagal dimuat
  tampil sebagai pesan di tempat beserta tautan kembali, menggantikan
  toast dan form kosong, sejalan dengan keputusan detail yang gagal
  dimuat di modul lain; `useRole` dimuat ulang saat halaman dibuka; nilai
  awal disusun fungsi murni `nilaiAwalRole` (butir 10); dan isian form
  tetap memakai `useState`.
