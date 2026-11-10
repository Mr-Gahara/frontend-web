# Kontrak API: Seluruh Route Backend

Sifat perubahan: **Tetap**: dibangkitkan ulang hanya atas perintah pemilik proyek.

Dibangkitkan ulang 10 November 2026 terhadap backend `ridho` `aeb6a52` atas perintah pemilik proyek (RG9a), dari pembangkit daftar route milik repo backend (bangkit.cjs), yang dijalankan dari salinan tanpa menulis ke repo backend. Kolom "Dipakai frontend" dihitung dari pemanggilan `.get`, `.post`, `.put`, `.patch`, dan `.delete` dengan `EP` di kode web, termasuk bentuk template literal, dicocokkan per method dan path. Beberapa izin dalam satu baris berarti salah satunya cukup (`checkPermission` memakai `some`). Kolom Permission kosong berarti route tidak memanggil `checkPermission`; dua baris `GET /kategori` dikoreksi manual karena memakai middleware sendiri sejak P76. Auth `authAkun (admin)` berarti hanya akun admin platform. Tidak diubah tangan selain koreksi yang ditandai.

Jumlah: 269 route, 174 dipakai frontend.

## Lampiran A. Seluruh route backend

| Method | Path | Auth | Permission | Dipakai frontend | File route |
|---|---|---|---|---|---|
| POST | `/absensi` | authPengguna | - | - | `absensiRoute.js` |
| GET | `/absensi` | authPengguna | - | - | `absensiRoute.js` |
| GET | `/absensi/monitoring` | authPengguna | `read-absensi` | ya | `absensiRoute.js` |
| GET | `/absensi/:id` | authPengguna | - | - | `absensiRoute.js` |
| PUT | `/absensi/:id` | authPengguna | - | - | `absensiRoute.js` |
| GET | `/akunkas` | authPengguna | `read-akunkas` | ya | `akunKasRoute.js` |
| POST | `/akunkas` | authPengguna | `create-akunkas` | ya | `akunKasRoute.js` |
| GET | `/akunkas/mutasi` | authPengguna | `read-akunkas` | ya | `akunKasRoute.js` |
| GET | `/akunkas/ringkasan` | authPengguna | `read-akunkas` | ya | `akunKasRoute.js` |
| GET | `/akunkas/:id` | authPengguna | `read-akunkas` | - | `akunKasRoute.js` |
| PUT | `/akunkas/:id` | authPengguna | `update-akunkas` | ya | `akunKasRoute.js` |
| GET | `/akunkas/:id/mutasi` | authPengguna | `read-akunkas` | - | `akunKasRoute.js` |
| GET | `/akunkas/:id/ringkasan` | authPengguna | `read-akunkas` | ya | `akunKasRoute.js` |
| POST | `/akun/auth/register` | - | - | ya | `akunRoute.js` |
| POST | `/akun/auth/login` | - | - | ya | `akunRoute.js` |
| POST | `/akun/auth/lupa-password` | - | - | ya | `akunRoute.js` |
| POST | `/akun/auth/reset-password` | - | - | ya | `akunRoute.js` |
| POST | `/akun/auth/verifikasi-email/kirim` | - | - | ya | `akunRoute.js` |
| POST | `/akun/auth/verifikasi-email` | - | - | ya | `akunRoute.js` |
| POST | `/akun/auth/refreshtoken` | - | - | - | `akunRoute.js` |
| POST | `/akun/auth/logout` | - | - | ya | `akunRoute.js` |
| GET | `/akun/admin/all` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| GET | `/akun/admin/users/:id` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| DELETE | `/akun/admin/users/:id` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| PUT | `/akun/admin/users/:id` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| POST | `/akun/admin/users` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| POST | `/akun/admin/users/:id/freeze` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| POST | `/akun/admin/users/:id/unfreeze` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| POST | `/akun/admin/users/:id/langganan` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| PUT | `/akun/admin/users/:id/plan` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| GET | `/akun/admin/users/:id/langganan` | authAkun, authAkun (admin) | - | ya | `akunRoute.js` |
| GET | `/akun/me` | authAkun | - | ya | `akunRoute.js` |
| GET | `/akun/profil` | authPengguna | `read-akun` | - | `akunRoute.js` |
| PUT | `/akun/profil/update/:id` | authPengguna | `update-akun` | - | `akunRoute.js` |
| GET | `/akun/langganan` | authPengguna | `read-langganan` | ya | `akunRoute.js` |
| GET | `/akun/langganan/riwayat` | authPengguna | `read-langganan` | ya | `akunRoute.js` |
| POST | `/akun/profil/otp` | authPengguna | `update-akun` | - | `akunRoute.js` |
| DELETE | `/akun/profil` | authPengguna | `update-akun` | - | `akunRoute.js` |
| GET | `/aset` | authPengguna | - | ya | `asetRoute.js` |
| POST | `/aset` | authPengguna | `create-aset` | ya | `asetRoute.js` |
| GET | `/aset/:id` | authPengguna | - | ya | `asetRoute.js` |
| PUT | `/aset/:id` | authPengguna | `update-aset` | ya | `asetRoute.js` |
| DELETE | `/aset/:id` | authPengguna | `delete-aset` | ya | `asetRoute.js` |
| POST | `/bahanbaku` | authPengguna | `create-bahan` | ya | `bahanBakuRoute.js` |
| GET | `/bahanbaku` | authPengguna | `read-bahan` | ya | `bahanBakuRoute.js` |
| GET | `/bahanbaku/:id` | authPengguna | `read-bahan` | ya | `bahanBakuRoute.js` |
| PUT | `/bahanbaku/:id` | authPengguna | `update-bahan` | ya | `bahanBakuRoute.js` |
| DELETE | `/bahanbaku/:id` | authPengguna | `delete-bahan` | ya | `bahanBakuRoute.js` |
| POST | `/baranginventory` | authPengguna | `create-barang-inventory` | - | `barangInventoryRoute.js` |
| GET | `/baranginventory` | authPengguna | `read-barang-inventory` | - | `barangInventoryRoute.js` |
| GET | `/baranginventory/:id` | authPengguna | `read-barang-inventory` | - | `barangInventoryRoute.js` |
| PUT | `/baranginventory/:id` | authPengguna | `update-barang-inventory` | - | `barangInventoryRoute.js` |
| DELETE | `/baranginventory/:id` | authPengguna | `delete-barang-inventory` | - | `barangInventoryRoute.js` |
| POST | `/bebanoperasional` | authPengguna | `create-beban-operasional` | ya | `bebanOperasionalRoute.js` |
| GET | `/bebanoperasional` | authPengguna | `read-beban-operasional` | ya | `bebanOperasionalRoute.js` |
| GET | `/bebanoperasional/:id` | authPengguna | `read-beban-operasional` | - | `bebanOperasionalRoute.js` |
| PUT | `/bebanoperasional/:id` | authPengguna | `update-beban-operasional` | ya | `bebanOperasionalRoute.js` |
| GET | `/dashboard/gudang` | authPengguna | `read-dashboard-gudang` | ya | `dashboardRoute.js` |
| GET | `/dashboard/outlet` | authPengguna | `read-dashboard-outlet` | - | `dashboardRoute.js` |
| GET | `/device/events` | authPengguna | - | - | `deviceRoute.js` |
| GET | `/device/:userId` | authPengguna | `read-pengguna` | ya | `deviceRoute.js` |
| POST | `/device/approve` | authPengguna | `update-pengguna` | - | `deviceRoute.js` |
| POST | `/device/revoke` | authPengguna | `update-pengguna` | - | `deviceRoute.js` |
| POST | `/device/self-approve/otp` | authPengguna | - | - | `deviceRoute.js` |
| POST | `/device/self-approve` | authPengguna | - | - | `deviceRoute.js` |
| POST | `/device/transfer-primary` | authPengguna | - | - | `deviceRoute.js` |
| POST | `/device/fcm-token` | authPengguna | - | - | `deviceRoute.js` |
| DELETE | `/device/fcm-token` | authPengguna | - | - | `deviceRoute.js` |
| GET | `/diskon` | authPengguna | - | ya | `diskonRoute.js` |
| POST | `/diskon` | authPengguna | `create-diskon` | ya | `diskonRoute.js` |
| GET | `/diskon/:id` | authPengguna | - | - | `diskonRoute.js` |
| PUT | `/diskon/:id` | authPengguna | `update-diskon` | ya | `diskonRoute.js` |
| POST | `/inventory` | authPengguna | `create-inventory` | ya | `inventoryRoute.js` |
| GET | `/inventory` | authPengguna | `read-inventory`, `read-inventory-gudang`, `read-inventory-outlet` | ya | `inventoryRoute.js` |
| GET | `/inventory/:id` | authPengguna | `read-inventory`, `read-inventory-gudang`, `read-inventory-outlet` | - | `inventoryRoute.js` |
| DELETE | `/inventory/:id` | authPengguna | `delete-inventory` | - | `inventoryRoute.js` |
| POST | `/inventory/:id/opname` | authPengguna | `opname-inventory` | ya | `inventoryRoute.js` |
| PATCH | `/inventory/:id/minimum-stok` | authPengguna | `update-inventory-minimum` | ya | `inventoryRoute.js` |
| POST | `/inventory/process-sale` | authPengguna | `akses-pos` | - | `inventoryRoute.js` |
| GET | `/izincuti/pengguna` | authPengguna | - | - | `izinCutiRoute.js` |
| POST | `/izincuti/pengguna` | authPengguna | - | - | `izinCutiRoute.js` |
| GET | `/izincuti` | authPengguna | `read-izin-cuti` | ya | `izinCutiRoute.js` |
| POST | `/izincuti` | authPengguna | `create-izin-cuti` | - | `izinCutiRoute.js` |
| GET | `/izincuti/:id` | authPengguna | `read-izin-cuti` | - | `izinCutiRoute.js` |
| PUT | `/izincuti/:id` | authPengguna | `update-izin-cuti` | - | `izinCutiRoute.js` |
| GET | `/jadwalshift` | authPengguna | - | ya | `jadwalShiftRoute.js` |
| POST | `/jadwalshift` | authPengguna | `create-jadwal-shift` | ya | `jadwalShiftRoute.js` |
| POST | `/jadwalshift/bulk` | authPengguna | `create-jadwal-shift` | ya | `jadwalShiftRoute.js` |
| GET | `/jadwalshift/:id` | authPengguna | - | - | `jadwalShiftRoute.js` |
| PUT | `/jadwalshift/:id` | authPengguna | `update-jadwal-shift` | ya | `jadwalShiftRoute.js` |
| DELETE | `/jadwalshift/:id` | authPengguna | `delete-jadwal-shift` | ya | `jadwalShiftRoute.js` |
| POST | `/jurnalstok` | authPengguna | `create-jurnal-stok` | - | `jurnalStokRoute.js` |
| GET | `/jurnalstok` | authPengguna | `read-jurnal-stok` | ya | `jurnalStokRoute.js` |
| GET | `/jurnalstok/:id` | authPengguna | `read-jurnal-stok` | - | `jurnalStokRoute.js` |
| PUT | `/jurnalstok/:id` | authPengguna | `update-jurnal-stok` | - | `jurnalStokRoute.js` |
| PATCH | `/jurnalstok/wms/kirim` | authPengguna | `create-jurnal-stok`, `update-jurnal-stok` | - | `jurnalStokRoute.js` |
| PATCH | `/jurnalstok/wms/terima` | authPengguna | `create-jurnal-stok`, `update-jurnal-stok` | - | `jurnalStokRoute.js` |
| PATCH | `/jurnalstok/wms/rollback` | authPengguna | `create-jurnal-stok`, `update-jurnal-stok` | - | `jurnalStokRoute.js` |
| PATCH | `/jurnalstok/wms/opname` | authPengguna | `create-jurnal-stok`, `update-jurnal-stok` | - | `jurnalStokRoute.js` |
| GET | `/jurnaltransfer` | authPengguna | `read-jurnal-transfer` | ya | `jurnalTransferRoute.js` |
| POST | `/jurnaltransfer` | authPengguna | `create-jurnal-transfer` | ya | `jurnalTransferRoute.js` |
| GET | `/jurnaltransfer/:id` | authPengguna | `read-jurnal-transfer` | - | `jurnalTransferRoute.js` |
| PUT | `/jurnaltransfer/:id` | authPengguna | `update-jurnal-transfer` | ya | `jurnalTransferRoute.js` |
| POST | `/kategoribeban` | authPengguna | `create-kategori-beban` | ya | `kategoriBebanRoute.js` |
| GET | `/kategoribeban` | authPengguna | `read-kategori-beban` | ya | `kategoriBebanRoute.js` |
| GET | `/kategoribeban/:id` | authPengguna | `read-kategori-beban` | - | `kategoriBebanRoute.js` |
| PUT | `/kategoribeban/:id` | authPengguna | `update-kategori-beban` | ya | `kategoriBebanRoute.js` |
| DELETE | `/kategoribeban/:id` | authPengguna | `delete-kategori-beban` | ya | `kategoriBebanRoute.js` |
| POST | `/kategori` | authPengguna | `create-kategori` | ya | `kategoriRoutes.js` |
| GET | `/kategori` | authPengguna | `read-kategori` atau `akses-pos` (P76, dikoreksi manual) | ya | `kategoriRoutes.js` |
| GET | `/kategori/:id` | authPengguna | `read-kategori` atau `akses-pos` (P76, dikoreksi manual) | - | `kategoriRoutes.js` |
| PUT | `/kategori/:id` | authPengguna | `update-kategori` | ya | `kategoriRoutes.js` |
| DELETE | `/kategori/:id` | authPengguna | `delete-kategori` | ya | `kategoriRoutes.js` |
| GET | `/kontrakkompensasi` | authPengguna | `read-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| POST | `/kontrakkompensasi` | authPengguna | `create-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| GET | `/kontrakkompensasi/:id` | authPengguna | `read-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| PUT | `/kontrakkompensasi/:id` | authPengguna | `update-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| DELETE | `/kontrakkompensasi/:id` | authPengguna | `delete-kontrak-kompensasi` | - | `kontrakKompensasiRoute.js` |
| GET | `/laporan/laba-rugi` | authPengguna | `read-laporan` | ya | `laporanRoute.js` |
| GET | `/laporan/arus-kas` | authPengguna | `read-laporan` | - | `laporanRoute.js` |
| POST | `/location` | authPengguna | `create-location` | ya | `locationRoute.js` |
| GET | `/location` | authPengguna | `read-location` | ya | `locationRoute.js` |
| GET | `/location/current` | authPengguna | `read-location` | ya | `locationRoute.js` |
| GET | `/location/:id` | authPengguna | `read-location` | - | `locationRoute.js` |
| PUT | `/location/:id` | authPengguna | `update-location` | ya | `locationRoute.js` |
| DELETE | `/location/:id` | authPengguna | `delete-location` | - | `locationRoute.js` |
| GET | `/membership` | authPengguna | `read-membership` | - | `membershipRoute.js` |
| POST | `/membership` | authPengguna | `create-membership` | - | `membershipRoute.js` |
| GET | `/membership/:id` | authPengguna | `read-membership` | - | `membershipRoute.js` |
| PUT | `/membership/:id` | authPengguna | `update-membership` | - | `membershipRoute.js` |
| DELETE | `/membership/:id` | authPengguna | `delete-membership` | - | `membershipRoute.js` |
| GET | `/metodepembayaran` | authPengguna | - | ya | `metodePembayaranRoute.js` |
| POST | `/metodepembayaran` | authPengguna | `create-metode-pembayaran` | ya | `metodePembayaranRoute.js` |
| GET | `/metodepembayaran/:id` | authPengguna | - | ya | `metodePembayaranRoute.js` |
| PUT | `/metodepembayaran/:id` | authPengguna | `update-metode-pembayaran` | ya | `metodePembayaranRoute.js` |
| POST | `/pajak` | authPengguna | `create-pajak` | ya | `pajakRoute.js` |
| POST | `/pajak/simulasi-produk` | authPengguna | - | - | `pajakRoute.js` |
| POST | `/pajak/simulasi-transaksi` | authPengguna | - | - | `pajakRoute.js` |
| GET | `/pajak` | authPengguna | - | ya | `pajakRoute.js` |
| GET | `/pajak/:id` | authPengguna | - | - | `pajakRoute.js` |
| PUT | `/pajak/:id` | authPengguna | `update-pajak` | ya | `pajakRoute.js` |
| DELETE | `/pajak/:id` | authPengguna | `delete-pajak` | ya | `pajakRoute.js` |
| GET | `/paketmembership` | authPengguna | `read-paket-membership` | - | `paketMembershipRoute.js` |
| POST | `/paketmembership` | authPengguna | `create-paket-membership` | - | `paketMembershipRoute.js` |
| GET | `/paketmembership/:id` | authPengguna | `read-paket-membership` | - | `paketMembershipRoute.js` |
| PUT | `/paketmembership/:id` | authPengguna | `update-paket-membership` | - | `paketMembershipRoute.js` |
| DELETE | `/paketmembership/:id` | authPengguna | `delete-paket-membership` | - | `paketMembershipRoute.js` |
| GET | `/pelanggan` | authPengguna | `read-pelanggan` | ya | `pelangganRoute.js` |
| POST | `/pelanggan` | authPengguna | `create-pelanggan` | ya | `pelangganRoute.js` |
| GET | `/pelanggan/:id` | authPengguna | `read-pelanggan` | - | `pelangganRoute.js` |
| PUT | `/pelanggan/:id` | authPengguna | `update-pelanggan` | ya | `pelangganRoute.js` |
| DELETE | `/pelanggan/:id` | authPengguna | `delete-pelanggan` | ya | `pelangganRoute.js` |
| POST | `/pembayaran` | authPengguna | `create-pembayaran` | ya | `pembayaranRoute.js` |
| GET | `/pembayaran` | authPengguna | `read-pembayaran` | - | `pembayaranRoute.js` |
| GET | `/pembayaran/:id` | authPengguna | `read-pembayaran` | - | `pembayaranRoute.js` |
| PUT | `/pembayaran/:id` | authPengguna | `update-pembayaran` | ya | `pembayaranRoute.js` |
| POST | `/pembelianstok` | authPengguna | `create-pembelian-stok`, `create-pembelian-stok-outlet`, `create-pembelian-stok-gudang` | ya | `pembelianStokRoute.js` |
| GET | `/pembelianstok` | authPengguna | `read-pembelian-stok`, `read-pembelian-stok-outlet`, `read-pembelian-stok-gudang` | ya | `pembelianStokRoute.js` |
| GET | `/pembelianstok/ringkasan` | authPengguna | `read-pembelian-stok`, `read-pembelian-stok-outlet`, `read-pembelian-stok-gudang` | - | `pembelianStokRoute.js` |
| GET | `/pembelianstok/:id` | authPengguna | `read-pembelian-stok`, `read-pembelian-stok-outlet`, `read-pembelian-stok-gudang` | ya | `pembelianStokRoute.js` |
| PUT | `/pembelianstok/:id` | authPengguna | `update-pembelian-stok`, `update-pembelian-stok-outlet`, `update-pembelian-stok-gudang` | ya | `pembelianStokRoute.js` |
| DELETE | `/pembelianstok/:id` | authPengguna | `delete-pembelian-stok`, `delete-pembelian-stok-outlet`, `delete-pembelian-stok-gudang` | ya | `pembelianStokRoute.js` |
| GET | `/pengajuanstok` | authPengguna | `read-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| GET | `/pengajuanstok/:id` | authPengguna | `read-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| POST | `/pengajuanstok` | authPengguna | `create-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| PUT | `/pengajuanstok/:id` | authPengguna | `update-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| PATCH | `/pengajuanstok/:id/submit` | authPengguna | `update-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| PATCH | `/pengajuanstok/:id/approve` | authPengguna | `approve-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| PATCH | `/pengajuanstok/:id/reject` | authPengguna | `reject-pengajuan-stok` | ya | `pengajuanStokRoute.js` |
| POST | `/pengguna/pin-refresh` | authPengguna | - | - | `penggunaRoute.js` |
| POST | `/pengguna/register-owner` | authPengguna, authAkun | - | ya | `penggunaRoute.js` |
| POST | `/pengguna/pin-login` | authPengguna, authAkun | - | ya | `penggunaRoute.js` |
| GET | `/pengguna/check-owner` | authPengguna, authAkun | - | - | `penggunaRoute.js` |
| POST | `/pengguna/reset-pin-owner/otp` | authPengguna, authAkun | - | - | `penggunaRoute.js` |
| POST | `/pengguna/reset-pin-owner` | authPengguna, authAkun | - | - | `penggunaRoute.js` |
| POST | `/pengguna/pin-logout` | authPengguna | - | ya | `penggunaRoute.js` |
| POST | `/pengguna/register-pengguna` | authPengguna | `create-pengguna` | ya | `penggunaRoute.js` |
| GET | `/pengguna` | authPengguna | `read-pengguna` | ya | `penggunaRoute.js` |
| GET | `/pengguna/:id` | authPengguna | `read-pengguna` | ya | `penggunaRoute.js` |
| PUT | `/pengguna/:id` | authPengguna | `update-pengguna` | ya | `penggunaRoute.js` |
| DELETE | `/pengguna/:id` | authPengguna | `delete-pengguna` | ya | `penggunaRoute.js` |
| POST | `/penjualan` | authPengguna | `create-penjualan` | ya | `penjualanRoute.js` |
| GET | `/penjualan` | authPengguna | `read-penjualan` | ya | `penjualanRoute.js` |
| GET | `/penjualan/:id` | authPengguna | `read-penjualan` | ya | `penjualanRoute.js` |
| PUT | `/penjualan/:id` | authPengguna | `update-penjualan` | ya | `penjualanRoute.js` |
| DELETE | `/penjualan/:id` | authPengguna | `delete-penjualan` | ya | `penjualanRoute.js` |
| GET | `/permission` | authEither | - | ya | `permissionRoute.js` |
| GET | `/permission/grouped` | authEither | - | - | `permissionRoute.js` |
| POST | `/permission` | authAkun, authAkun (admin) | - | - | `permissionRoute.js` |
| PUT | `/permission/:id` | authAkun, authAkun (admin) | - | - | `permissionRoute.js` |
| DELETE | `/permission/:id` | authAkun, authAkun (admin) | - | - | `permissionRoute.js` |
| GET | `/polaroster` | authPengguna | `read-pola-roster` | ya | `polaRosterRoute.js` |
| GET | `/polaroster/:id` | authPengguna | `read-pola-roster` | - | `polaRosterRoute.js` |
| POST | `/polaroster` | authPengguna | `create-pola-roster` | ya | `polaRosterRoute.js` |
| PUT | `/polaroster/:id` | authPengguna | `update-pola-roster` | ya | `polaRosterRoute.js` |
| DELETE | `/polaroster/:id` | authPengguna | `delete-pola-roster` | ya | `polaRosterRoute.js` |
| GET | `/posisi` | authPengguna | `read-posisi` | - | `posisiRoute.js` |
| POST | `/posisi` | authPengguna | `create-posisi` | - | `posisiRoute.js` |
| GET | `/posisi/:id` | authPengguna | `read-posisi` | - | `posisiRoute.js` |
| PUT | `/posisi/:id` | authPengguna | `update-posisi` | - | `posisiRoute.js` |
| DELETE | `/posisi/:id` | authPengguna | `delete-posisi` | - | `posisiRoute.js` |
| POST | `/produkpajak` | authPengguna | `update-produk` | ya | `produkPajakRoute.js` |
| GET | `/produkpajak/:targetID` | authPengguna | `read-pajak`, `read-produk`, `akses-pos` | ya | `produkPajakRoute.js` |
| DELETE | `/produkpajak/:id` | authPengguna | `update-produk` | ya | `produkPajakRoute.js` |
| GET | `/produk` | authPengguna | `read-produk`, `akses-pos` | ya | `produkRoutes.js` |
| GET | `/produk/:id` | authPengguna | `read-produk`, `akses-pos` | ya | `produkRoutes.js` |
| POST | `/produk` | authPengguna | `create-produk` | ya | `produkRoutes.js` |
| PUT | `/produk/:id` | authPengguna | `update-produk` | ya | `produkRoutes.js` |
| DELETE | `/produk/:id` | authPengguna | `delete-produk` | ya | `produkRoutes.js` |
| GET | `/role` | authPengguna | `read-role` | ya | `roleRoute.js` |
| GET | `/role/:id` | authPengguna | `read-role` | ya | `roleRoute.js` |
| POST | `/role` | authPengguna | `create-role` | ya | `roleRoute.js` |
| PUT | `/role/:id` | authPengguna | `update-role` | ya | `roleRoute.js` |
| DELETE | `/role/:id` | authPengguna | `delete-role` | ya | `roleRoute.js` |
| POST | `/sesibooking` | authPengguna | `create-booking` | ya | `sesiBookingRoute.js` |
| GET | `/sesibooking` | authPengguna | `read-booking` | ya | `sesiBookingRoute.js` |
| GET | `/sesibooking/:id` | authPengguna | `read-booking` | ya | `sesiBookingRoute.js` |
| PUT | `/sesibooking/:id` | authPengguna | `update-booking` | ya | `sesiBookingRoute.js` |
| GET | `/sesikasir/perangkat` | authPengguna | `kelola-perangkat-kasir` | ya | `sesiKasirRoute.js` |
| POST | `/sesikasir/perangkat` | authPengguna | `kelola-perangkat-kasir` | ya | `sesiKasirRoute.js` |
| DELETE | `/sesikasir/perangkat/:id` | authPengguna | `kelola-perangkat-kasir` | ya | `sesiKasirRoute.js` |
| GET | `/sesikasir/aktif` | authPengguna | `buka-tutup-kasir` | - | `sesiKasirRoute.js` |
| POST | `/sesikasir/buka` | authPengguna | `buka-tutup-kasir` | - | `sesiKasirRoute.js` |
| POST | `/sesikasir/tutup` | authPengguna | `buka-tutup-kasir` | - | `sesiKasirRoute.js` |
| GET | `/sesikasir` | authPengguna | `read-sesi-kasir` | ya | `sesiKasirRoute.js` |
| GET | `/sesikasir/:id` | authPengguna | `read-sesi-kasir` | ya | `sesiKasirRoute.js` |
| POST | `/sesikasir/:id/tutup` | authPengguna | `kelola-perangkat-kasir` | ya | `sesiKasirRoute.js` |
| GET | `/setup/status` | authAkun | - | ya | `setupRoute.js` |
| GET | `/shift` | authPengguna | `read-shift` | ya | `shiftRoute.js` |
| GET | `/shift/:id` | authPengguna | `read-shift` | - | `shiftRoute.js` |
| POST | `/shift` | authPengguna | `create-shift` | ya | `shiftRoute.js` |
| PUT | `/shift/:id` | authPengguna | `update-shift` | ya | `shiftRoute.js` |
| DELETE | `/shift/:id` | authPengguna | `delete-shift` | ya | `shiftRoute.js` |
| GET | `/stockopname/adjustments` | authPengguna | `read-stock-adjustment`, `read-stock-adjustment-outlet`, `read-stock-adjustment-gudang` | ya | `stockOpnameRoute.js` |
| GET | `/stockopname/adjustments/:id` | authPengguna | `read-stock-adjustment`, `read-stock-adjustment-outlet`, `read-stock-adjustment-gudang` | ya | `stockOpnameRoute.js` |
| POST | `/stockopname` | authPengguna | `create-stock-opname` | ya | `stockOpnameRoute.js` |
| GET | `/stockopname` | authPengguna | `read-stock-opname` | ya | `stockOpnameRoute.js` |
| GET | `/stockopname/:id` | authPengguna | `read-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/items` | authPengguna | `submit-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/submit` | authPengguna | `submit-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/reject` | authPengguna | `review-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/approve` | authPengguna | `review-stock-opname` | ya | `stockOpnameRoute.js` |
| PATCH | `/stockopname/:id/cancel` | authPengguna | `review-stock-opname` | ya | `stockOpnameRoute.js` |
| GET | `/tarif` | authPengguna | - | ya | `tarifRoute.js` |
| POST | `/tarif` | authPengguna | `create-tarif` | ya | `tarifRoute.js` |
| GET | `/tarif/:id` | authPengguna | - | ya | `tarifRoute.js` |
| PUT | `/tarif/:id` | authPengguna | `update-tarif` | ya | `tarifRoute.js` |
| DELETE | `/tarif/:id` | authPengguna | `delete-tarif` | ya | `tarifRoute.js` |
| GET | `/tenant` | authAkun, authAkun (admin) | - | - | `tenantRoute.js` |
| POST | `/tenant` | authAkun | - | ya | `tenantRoute.js` |
| GET | `/tenant/:id` | authPengguna | - | ya | `tenantRoute.js` |
| PUT | `/tenant/:id` | authPengguna | `update-tenant` | ya | `tenantRoute.js` |
| PUT | `/tenant/:id/logo` | authPengguna | `update-tenant` | - | `tenantRoute.js` |
| DELETE | `/tenant/:id/logo` | authPengguna | `update-tenant` | - | `tenantRoute.js` |
| GET | `/tenant/:id/logo/:namaFile` | authPengguna | - | - | `tenantRoute.js` |
| DELETE | `/tenant/:id` | authPengguna | `delete-tenant` | - | `tenantRoute.js` |
| GET | `/tipeaset` | authPengguna | - | ya | `tipeAsetRoute.js` |
| POST | `/tipeaset` | authPengguna | `create-tipe-aset` | ya | `tipeAsetRoute.js` |
| GET | `/tipeaset/:id` | authPengguna | - | ya | `tipeAsetRoute.js` |
| PUT | `/tipeaset/:id` | authPengguna | `update-tipe-aset` | ya | `tipeAsetRoute.js` |
| DELETE | `/tipeaset/:id` | authPengguna | `delete-tipe-aset` | ya | `tipeAsetRoute.js` |
| POST | `/transferstok` | authPengguna | `create-transfer-stok` | ya | `transferStokRoute.js` |
| GET | `/transferstok` | authPengguna | `read-transfer-stok` | ya | `transferStokRoute.js` |
| GET | `/transferstok/:id` | authPengguna | `read-transfer-stok` | ya | `transferStokRoute.js` |
| PUT | `/transferstok/:id` | authPengguna | `create-transfer-stok` | ya | `transferStokRoute.js` |
| DELETE | `/transferstok/:id` | authPengguna | `cancel-transfer-stok` | - | `transferStokRoute.js` |
| PATCH | `/transferstok/:id/kirim` | authPengguna | `approve-transfer-stok` | ya | `transferStokRoute.js` |
| PATCH | `/transferstok/:id/terima` | authPengguna | `receive-transfer-stok` | ya | `transferStokRoute.js` |
| PATCH | `/transferstok/:id/batal` | authPengguna | `cancel-transfer-stok` | ya | `transferStokRoute.js` |
