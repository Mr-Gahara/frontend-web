# Kontrak API: Temuan

Sifat perubahan: **Jarang**: bertambah saat ada temuan.

Ketidakselarasan antara frontend dan backend yang sudah diverifikasi, beserta pemilik dan statusnya. Butir baru ditambahkan dengan nomor berikutnya.

## 6. Ketidakselarasan yang tercatat

Setiap butir di bawah sudah diverifikasi dari kode atau respons backend. Kolom Pemilik menunjukkan sisi yang perlu bertindak. Butir 11 sampai 20 diperiksa terhadap kode backend pada 19 sampai 20 September 2026, bukan terhadap commit acuan di `README.md` bagian 1; nomor barisnya dapat bergeser bila backend berubah.

| No | Temuan | Bukti | Pemilik | Status |
|---|---|---|---|---|
| 1 | Frontend memanggil `/bahan-baku` sebagai percobaan pertama, lalu jatuh ke `/bahanBaku` | Lima panggilan tidak punya pasangan di backend; `GET /bahan-baku` dijawab 404 | Frontend | Dibuang pada Fase 2 |
| 2 | Gate menu sidebar tidak sejalan dengan permission endpoint halamannya | Bagian 5 (`izin-halaman.md`): grup inventaris memakai `read-inventory-outlet` dan `read-inventory-gudang` yang tidak diperiksa route mana pun; Pengiriman Stok memakai `read-pengiriman-stok` padahal endpoint mewajibkan `read-transfer-stok`; halaman Pengguna juga butuh `read-role` | Frontend | Gate diturunkan dari kebutuhan endpoint pada Fase 2 |
| 3 | Casing path di frontend tidak seragam (`/tipeAset`, `/stockopname`, `/metodepembayaran`) | Seluruhnya berjalan karena Express tidak membedakan huruf besar kecil | Frontend | Konstanta endpoint kanonik pada Fase 2 |
| 4 | Enam permission gate frontend tidak ada di seed (`read-shift-*`, `read-pola-roster-*`, `read-jadwal-shift-*`) | Gate dikomentari di `components/app-sidebar.tsx` | Backend | Catatan backend nomor 2 |
| 5 | Endpoint yang dipakai frontend tanpa `checkPermission` | Tulis: pajak, produk pajak, shift, pola roster, jadwal shift. Baca data sensitif: `GET /laporan/laba-rugi`, `GET /absensi/monitoring`. Baca data referensi transaksi (aset, diskon, metode pembayaran, pelanggan, tarif, tipe aset) perlu dikonfirmasi sebagai desain yang disengaja | Backend | Catatan backend nomor 2, diperluas |
| 6 | Permission sudah ada di seed tetapi tidak diperiksa route mana pun, antara lain `read-laporan`, `read-absensi`, `create-absensi`, `update-absensi`, `read-pelanggan` | Silang seed terhadap route | Backend | Memperkuat butir 5 |
| 7 | Delapan permission membership dipakai route tetapi tidak ada di seed | Route membership dan paket membership | Backend | Sudah tercatat di README backend (G5b) |
| 8 | `GET /api/shift` tanpa query string menjawab 500 `Cannot access 'data' before initialization` | Panggilan langsung ke backend lokal; frontend selalu mengirim query sehingga belum terdampak | Backend | Catatan backend berikutnya |
| 9 | README backend menyatakan validator memakai allowlist, tetapi penolakan field tak dikenal hanya ada di tenant, akun, transfer stok, inventory, absensi (absen pulang), pengajuan stok, dan lokasi | Grep pesan "tidak diizinkan" di `validators/` | Backend | Catatan dokumentasi backend |
| 10 | 22 operasi tulis tanpa validator; sebagian meneruskan `req.body` utuh ke service sementara skemanya memuat field sensitif seperti `status`, `disetujuiOleh`, dan `reviewerID` | Bagian 4 (`payload.md`, operasi bertanda skema model) | Backend | Potensi mass assignment, perlu verifikasi di service sebelum dilaporkan sebagai bug |
| 11 | `PUT /produk/:id` memeriksa `if (payload.resep)`, sehingga `resep: []` menjadikan stok 0 dan produk tanpa resep tidak dapat dijual | `produkService` baris 185 dan 209, `inventoryService` sekitar baris 228, trace PUT | Backend | Laporan modul produk dan kategori; frontend hanya mengirim resep bila perlu |
| 12 | Hapus kategori tidak memeriksa produk yang memakainya | `kategoriService.delete` baris 109 sampai 115 | Backend | Laporan modul produk dan kategori; frontend mencegah hapus bila produk dapat dibaca |
| 13 | `kategoriID` produk hanya diperiksa formatnya | `produkValidator` baris 72 sampai 76 | Backend | Laporan modul produk dan kategori; form produk menolak kategori yang tidak ada |
| 14 | Duplikat kategori dijawab 400 dengan field `tenantID` | Trace `POST /api/kategori`; `kategoriService` baris 69 dan 101 | Backend | Laporan modul produk dan kategori; frontend menentukan field dari daftar kategori |
| 15 | Satuan resep produk (5) lebih sempit dari satuan bahan baku (7) | `produkValidator` baris 88, `bahanBakuValidator` | Backend | Laporan modul produk dan kategori; perlu keputusan |
| 16 | Cache daftar produk (TTL 120 detik) tidak dibersihkan saat kategori berubah | `produkService` baris 67 dan 118, `kategoriService` baris 64, 96, dan 113 | Backend | Laporan modul produk dan kategori |
| 17 | Detail produk mengirim `createdAt` dan `updatedAt` bernilai null | Cache kontrak `GET /produk/:param` | Backend | Laporan modul produk dan kategori |
| 18 | Mapper stock adjustment membaca `qtySebelum`, `qtyAdjustment`, `stockOpnameID`, dan `catatan`, padahal model menyimpan `qtyCurrent`, `qtyDifference`, `referenceID`, dan `alasan`; `referenceType` tidak dikirim. Akibatnya saldo sistem dan koreksi selalu 0, sedangkan sumber opname dan alasan selalu null | `mappers/stockOpnameMapper.js` baris 167, 169, 190, 192; `models/stockAdjustmentModel.js` (`qtyCurrent`, `qtyDifference`, `referenceType`); `stockOpnameService` baris 418 sampai 427; cache kontrak `GET /stockopname/adjustments/:param` (`qtySebelum` 0, `qtyPhysical` 35000, `qtyAdjustment` 0) | Backend | Laporan submodul stock adjustment; frontend menampilkan `-` lewat `features/stock-adjustment/tampilan.ts` |
| 19 | Pembaruan item stock opname menolak `qtyPhysical` kosong, sehingga hitungan yang baru sebagian tidak dapat disimpan; pesan errornya "tidak boleh kurang dari 0" walau isiannya kosong | `stockOpnameService` sekitar baris 235; frontend lama mengirim `null` untuk isian kosong | Backend | Laporan submodul stock opname; frontend hanya mengirim item yang terisi (`features/stock-opname/payload.ts`) |
| 20 | Data stock opname (dan data stok lain) dikirim untuk seluruh lokasi tenant kepada pemegang izin baca; pembatasan staf ke lokasi aktif hanya ada di tampilan web | `stockOpnameService.getAll` baris 150 sampai 155: `locationID` hanya filter opsional dari query | Backend, perlu keputusan produk | Laporan submodul stock opname; web membatasi staf lewat `useCakupanLokasiOutlet` |
