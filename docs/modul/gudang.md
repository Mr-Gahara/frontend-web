# Modul Gudang

Sifat perubahan: **Jarang**: bertambah saat modul ini dikerjakan; isi lama diubah hanya bila terbukti keliru.

Lapis per modul: kirim hanya saat modul ini dikerjakan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

## Keputusan

### Modul gudang

Diputuskan pemilik proyek pada 29 September 2026, dengan prinsip
keputusan rancangan butir 17 dan 21.

- **GD1a: dashboard gudang memakai sumber data gabungan.** Hitungan
  pengajuan (menunggu persetujuan; siap dibuat surat jalan) dan surat
  jalan (PENDING; sedang dikirim) diambil dari `GET /dashboard/gudang`,
  sedangkan stok kritis dan jurnal terbaru dari hook `features/` yang
  hanya menghitung lokasi Gudang, karena endpoint itu menghitung seluruh
  lokasi tenant termasuk outlet (Model bisnis MVP: stok outlet dan gudang
  tidak boleh tercampur). **Eksekusinya ditunda**: layout dan UI/UX
  dashboard ditentukan pemilik proyek sendiri, dan halamannya tetap
  placeholder sampai itu (`modul/gudang.md`, Utang kecil dari modul Gudang).
- **GD2a: pengaturan gudang berisi profil gudang yang dapat diubah**
  (nama, alamat, koordinat, dan radius absen) lewat `PUT /location/:id`
  bagi pemegang `update-location`, dan baca-saja bagi pengguna lain,
  dengan form yang sama dengan setup.
- **GD3a: form setup memakai React Hook Form dan Zod** dengan tampilan
  yang dipertahankan: label ber-`htmlFor`, koordinat wajib angka dalam
  rentang backend dan kosong di awal (diisi lewat Deteksi Otomatis atau
  manual) menggantikan koordinat bawaan titik tengah Pontianak, dan
  radius tetap wajib 10 sampai 50 meter.
- **GD4a: layout gudang menampilkan pesan di tempat, tanpa pengalihan.**
  Pengguna tanpa `read-location` membuka ruang gudang tanpa pemeriksaan
  gudang, karena setiap halaman punya gate sendiri. Galat memuat tampil
  sebagai pesan dengan tombol coba lagi, dan gudang yang belum ada bagi
  pengguna tanpa `create-location` tampil sebagai pesan agar menghubungi
  pemilik. Pengalihan berputar antara `/dashboard` dan `/dashboard/gudang`
  hilang. Gerbang ruang tetap `read-dashboard-gudang`, sejalan dengan
  backend, sidebar, dan layout outlet.
- **GD5a: hanya pemuatan lokasi di sidebar yang ikut dimigrasikan**, ke
  `useDaftarLokasi` yang berbagi cache dengan layout (keputusan rancangan
  butir 12), sehingga menu Ruang Gudang muncul setelah setup tanpa muat
  ulang. Tanpa `read-location` permintaannya dimatikan, dan menu Ruang
  Gudang tetap tampil bagi pemegang `read-dashboard-gudang`. Sisa sidebar
  tetap untuk modul Profil, login, dan sidebar (selesai di `57a7084`).
- **GD6a: setup diuji dengan daftar lokasi tanpa gudang yang dibentuk dari
  respons nyata** (`// simulasi:`), karena tenant uji sudah punya gudang
  yang menyimpan stok, dan `POST /location` dijawab gagal agar tidak ada
  lokasi yang tersimpan (`2d7225b`). Setup yang berhasil tidak diuji e2e
  (`inti/pengujian.md`, Utang pengujian).
- Diputuskan tanpa ditanyakan, diterapkan di `9ce288b`: pemeriksaan
  nama role Owner di layout dibuang (keputusan rancangan butir 2), dan
  `urlSetup` form buat stock opname gudang diarahkan ke
  `/dashboard/gudang/setup`, karena gudang yang belum didaftarkan adalah
  urusan setup, bukan pengaturan.
- Diterapkan tanpa ditanyakan di `319bd99`: pengaturan mengubah lokasi
  Gudang pertama dari `GET /location` (MVP satu gudang); isian form
  dipakai bersama setup lewat `IsianLokasi`; tombol simpan nonaktif selama
  form belum berubah; form dipasang ulang lewat `key` berisi id dan
  `updatedAt` (keputusan rancangan butir 8); dan gate halaman
  `read-location`, diturunkan dari endpoint yang dipanggilnya.

## Catatan

### Catatan dari modul Gudang

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
- Keputusan pemilik proyek untuk modul ini ada di `modul/gudang.md` (Modul
  gudang, GD1a sampai GD6a).

## Utang terbuka

### Utang kecil dari modul Gudang

- Dashboard gudang (`app/dashboard/gudang/page.tsx`) masih placeholder.
  Sumber datanya sudah diputuskan (GD1a), tetapi eksekusinya ditunda
  sampai pemilik proyek menentukan layout dan UI/UX-nya.
- Dashboard outlet selesai di `0c5822b` (keputusan DB1a sampai DB6a).
  `GET /dashboard/outlet` tetap tidak dipakai web: isinya hitungan
  pengajuan, surat jalan, dan lima jurnal terbaru, bukan isi dashboard
  yang diputuskan pemilik proyek.
