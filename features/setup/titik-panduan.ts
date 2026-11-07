import type { TitikPanduan } from "@/lib/panduan";

/**
 * Teks tur sorotan setiap langkah wizard setup (disetujui pemilik proyek,
 * 7 November 2026). Target adalah nilai atribut data-panduan di komponen
 * langkah; titik yang elemennya tidak tampil pada keadaan itu tidak
 * dimasukkan, misalnya tombol Tambah bahan baku saat tidak ada resep.
 * Titik terakhir selalu tombol lanjut, dengan judul mengikuti teks tombolnya.
 */

function lanjut(teksLanjut: string, isi?: string): TitikPanduan {
  return { target: "lanjut", judul: `Tekan ${teksLanjut}`, isi, sisi: "top" };
}

export function titikNamaToko(teksLanjut: string): TitikPanduan[] {
  return [
    {
      target: "nama-toko",
      judul: "Isi nama toko",
      isi: "Nama ini tampil di kasir, struk, dan laporan. Minimal 3 karakter.",
    },
    lanjut(teksLanjut, "Nama toko langsung tersimpan, lalu Anda lanjut ke langkah Owner."),
  ];
}

export function titikOwner(teksLanjut: string): TitikPanduan[] {
  return [
    {
      target: "owner-nama",
      judul: "Isi nama Owner",
      isi: "Owner memegang semua izin. Nama ini dipakai untuk masuk, bersama PIN.",
    },
    {
      target: "owner-pin",
      judul: "Buat PIN 6 digit",
      isi: "Ketik PIN yang sama di kedua isian. PIN ini dipakai masuk di web dan aplikasi kasir.",
    },
    lanjut(teksLanjut, "Sesudah disimpan, Anda langsung masuk sebagai Owner untuk melanjutkan setup."),
  ];
}

const TEKS_LOKASI = {
  outlet: { tempat: "outlet", penghuni: "Karyawan", dicatat: "Stok, shift, dan penjualan dicatat per outlet." },
  // Gudang tidak berjualan, sehingga penjualan tidak disebut.
  gudang: { tempat: "gudang", penghuni: "Staf gudang", dicatat: "Stok dan shift dicatat per gudang." },
} as const;

export function titikLokasi(jenis: "outlet" | "gudang", teksLanjut: string, bolehLewati: boolean): TitikPanduan[] {
  const t = TEKS_LOKASI[jenis];
  return [
    { target: "lokasi-nama", judul: `Isi nama dan alamat ${t.tempat}`, isi: t.dicatat },
    {
      target: "lokasi-koordinat",
      judul: `Ambil koordinat di ${t.tempat}`,
      isi: `Tekan tombol ini saat Anda sedang berada di ${t.tempat}. ${t.penghuni} hanya bisa absen di sekitar titik ini.`,
    },
    { target: "lokasi-radius", judul: "Atur radius absen", isi: "10 sampai 50 meter dari titik koordinat." },
    ...(bolehLewati
      ? [
          {
            target: "lewati",
            judul: "Belum siap? Lewati dulu",
            isi: "Kasir tetap bisa dipakai. Gudang bisa dilengkapi saat wizard dibuka lagi.",
            sisi: "top" as const,
          },
        ]
      : []),
    lanjut(teksLanjut, `Anda akan diminta memastikan sedang di ${t.tempat} sebelum lokasi disimpan.`),
  ];
}

export function titikKategori(teksLanjut: string): TitikPanduan[] {
  return [
    {
      target: "kategori-isian",
      judul: "Isi nama dan kode kategori",
      isi: "Contoh: Minuman dingin dengan kode MND.",
    },
    {
      target: "tambah",
      judul: "Tekan Tambah kategori",
      isi: "Kategori baru tersimpan setelah tombol ini ditekan. Tambahkan minimal satu, lalu tekan Simpan dan lanjut.",
    },
    lanjut(teksLanjut, "Sesudah minimal satu kategori ditambahkan, lanjut ke bahan baku."),
  ];
}

export function titikBahan(teksLanjut: string, adaResep: boolean): TitikPanduan[] {
  return [
    {
      target: "bahan-resep",
      judul: "Ada menu dari resep?",
      isi: "Pilih Ya bila ada menu yang dibuat dari bahan, misalnya kopi susu. Pilih Tidak untuk melewati langkah ini.",
    },
    ...(adaResep
      ? [
          {
            target: "tambah",
            judul: "Tekan Tambah bahan baku",
            isi: "Isi nama, satuan, stok awal, dan batas minimum, lalu tekan tombol ini. Ulangi untuk setiap bahan.",
          },
        ]
      : []),
    lanjut(teksLanjut, "Bila memilih Ya, tambahkan minimal satu bahan baku dulu."),
  ];
}

export function titikProduk(teksLanjut: string): TitikPanduan[] {
  return [
    {
      target: "produk-isian",
      judul: "Isi data produk",
      isi: "Nama, kategori, harga dasar, dan harga jual, lalu stok atau resep.",
    },
    {
      target: "tambah",
      judul: "Tekan Simpan produk",
      isi: "Produk tersimpan setelah tombol ini ditekan dan masuk ke daftar. Tambahkan minimal satu.",
    },
    lanjut(teksLanjut),
  ];
}

export function titikPajak(teksLanjut: string, modeDaftar: boolean): TitikPanduan[] {
  return [
    { target: "pajak-isian", judul: "Isi nama dan tarif pajak", isi: "Contoh: PB1 dengan tarif 10%." },
    {
      target: "pajak-cakupan",
      judul: "Pilih cakupan pajak",
      isi: "Seluruh transaksi dihitung dari total belanja. Produk tertentu dipilih nanti di halaman Pajak.",
    },
    {
      target: "pajak-hitung",
      judul: "Pilih cara hitung",
      isi: "Pajak bisa sudah termasuk harga jual, ditambahkan ke harga jual, atau dihitung di atas pajak lain.",
    },
    ...(modeDaftar
      ? [
          {
            target: "tambah",
            judul: "Tekan Tambah pajak",
            isi: "Pajak berikutnya tersimpan setelah tombol ini ditekan.",
          },
        ]
      : []),
    lanjut(
      teksLanjut,
      modeDaftar ? "Lanjut bila minimal satu pajak aktif." : "Pajak pertama langsung tersimpan saat tombol ini ditekan.",
    ),
  ];
}

export function titikBooking(teksLanjut: string, bolehLewati: boolean): TitikPanduan[] {
  return [
    {
      target: "booking-aset",
      judul: "Tipe aset dan aset",
      isi: "Tipe aset adalah jenisnya, misalnya Meja biliar. Aset adalah unitnya, misalnya Meja 1.",
    },
    {
      target: "booking-tarif",
      judul: "Atur tarif",
      isi: "Pilih per jam atau per sesi, lalu isi harga dan durasi minimum.",
    },
    ...(bolehLewati
      ? [
          {
            target: "lewati",
            judul: "Belum siap? Lewati dulu",
            isi: "Kasir tetap bisa dipakai. Hanya menu booking yang terkunci sampai langkah ini selesai.",
            sisi: "top" as const,
          },
        ]
      : []),
    lanjut(teksLanjut),
  ];
}