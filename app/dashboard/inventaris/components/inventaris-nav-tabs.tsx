"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Tags, ClipboardCheck, Scale, BoxIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    label: "Daftar Produk",
    href: "/dashboard/inventaris/produk",
    icon: Package,
  },
  {
    label: "Kategori Produk",
    href: "/dashboard/inventaris/kategori", 
    icon: Tags,
  },
    {
    label: "Bahan Baku",
    href: "/dashboard/inventaris/bahanBaku",
    icon: BoxIcon
  },
  {
    label: "Stok Opname",
    href: "/dashboard/inventaris/stockOpname", 
    icon: ClipboardCheck,
  },
  {
    label: "Penyesuaian Stok",
    href: "/dashboard/inventaris/stockAdjustment", 
    icon: Scale,
  },
  {
    label: "Stok Real-time",
    href: "/dashboard/inventaris/stok",
    icon: BoxIcon,
  },
];

export function InventarisNavTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full mb-6">
      <nav
        className="flex flex-row overflow-x-auto overflow-y-hidden w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        aria-label="Navigasi Inventaris"
      >
        {tabs.map(({ label, href, icon: Icon }) => {
          // Sedikit trik: pakai startsWith biar pas lu masuk ke /produk/buatProduk
          // tab "Daftar Produk" nya tetep nyala (aktif).
          const isActive = pathname.startsWith(href); 
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3 px-4 text-sm font-bold whitespace-nowrap transition-all border-b-4 rounded-none bg-transparent cursor-pointer -mb-px focus-visible:ring-0 focus-visible:outline-none",
                isActive
                  ? "border-[#0A2947] text-[#0A2947] shadow-none"
                  : "border-transparent text-[#0A2947]/50 hover:text-[#0A2947]/80 hover:bg-transparent hover:border-[#0A2947]/20",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}