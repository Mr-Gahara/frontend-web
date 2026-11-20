
export default function InventarisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* Header Utama Modul */}
      <div className="space-y-1">
        <h1 className="text-judul font-bold tracking-tight text-navy">Modul Inventaris</h1>
        <p className="text-isi text-muted-foreground">
          Kelola daftar produk, kategori, harga, dan stok toko Anda.
        </p>
      </div>

      {/* Konten halamannya (Tabel Produk, Form, atau Tabel Kategori) */}
      {/* TH1a: halaman di dalam layout modul tidak menambah padding pembungkus sendiri, agar tepinya segaris dengan judul modul. */}
      <div className="w-full sm:*:px-0! sm:*:py-0!">
        {children}
      </div>
    </div>
  );
}