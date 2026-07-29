"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, LineChart, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    label: "Ringkasan Laba/Rugi",
    href: "/dashboard/outlet/keuangan/ringkasanLabaRugi",
    icon: LineChart,
  },
  {
    label: "Mutasi & Arus Kas",
    href: "/dashboard/outlet/keuangan/mutasiArusKas",
    icon: ArrowLeftRight,
  },
  {
    label: "Akun Kas & Bank",
    href: "/dashboard/outlet/keuangan/akunkas",
    icon: FileText,
  },
];

export function KeuanganNavTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full">
      <nav
        className="flex flex-row overflow-x-auto overflow-y-hidden w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        aria-label="Navigasi Keuangan"
      >
        {tabs.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3 px-1 text-sm font-bold whitespace-nowrap transition-all border-b-4 rounded-none bg-transparent cursor-pointer -mb-px focus-visible:ring-0 focus-visible:outline-none",
                isActive
                  ? "border-[#0A2947] text-[#0A2947] shadow-none"
                  : "border-transparent text-[#0A2947]/50 hover:text-[#0A2947] hover:bg-transparent",
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
