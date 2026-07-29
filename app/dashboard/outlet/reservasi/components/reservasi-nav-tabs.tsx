"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, CalendarClock, History, Layers, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    label: "Dasbor Timeline",
    href: "/dashboard/outlet/reservasi",
    icon: CalendarClock,
  },
  {
    label: "Aset (Meja/Unit)",
    href: "/dashboard/outlet/reservasi/aset",
    icon: Layers,
  },
  {
    label: "Tipe Aset",
    href: "/dashboard/outlet/reservasi/tipeAset",
    icon: Box,
  },
  {
    label: "Tarif Harga",
    href: "/dashboard/outlet/reservasi/tarif",
    icon: Tags,
  },
];

export function ReservasiNavTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full mb-6">
      <nav
        className="flex flex-row overflow-x-auto overflow-y-hidden w-full border-b border-[#0A2947]/10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        aria-label="Navigasi Reservasi"
      >
        {tabs.map(({ label, href, icon: Icon }) => {
          // Logika Penting:
          // Karena base path "/dashboard/reservasi" akan selalu match dengan `startsWith` 
          // untuk sub-rute lainnya, kita pakai strict match (===) khusus untuk tab utama.
          const isActive =
            href === "/dashboard/outlet/reservasi"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3 px-4 text-sm font-bold whitespace-nowrap transition-all border-b-4 rounded-none bg-transparent cursor-pointer -mb-px focus-visible:ring-0 focus-visible:outline-none",
                isActive
                  ? "border-[#0A2947] text-[#0A2947] shadow-none"
                  : "border-transparent text-[#0A2947]/50 hover:text-[#0A2947]/80 hover:bg-transparent hover:border-[#0A2947]/20"
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