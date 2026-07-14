import { InventarisNavTabs } from "@/app/dashboard/inventaris/components/inventaris-nav-tabs"; // Sesuaikan path

export default function InventarisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header Utama Modul */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Modul Inventaris</h1>
        <p className="text-sm text-muted-foreground">
          Kelola daftar produk, kategori, harga, dan stok toko Anda.
        </p>
      </div>

      {/* Navigasi Tabs untuk semua anak halaman */}
      <InventarisNavTabs />

      {/* Konten halamannya (Tabel Produk, Form, atau Tabel Kategori) */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}