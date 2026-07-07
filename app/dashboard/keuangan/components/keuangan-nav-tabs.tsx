"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, LineChart, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    label: "Ringkasan Laba/Rugi",
    href: "/dashboard/keuangan/ringkasanLabaRugi",
    icon: LineChart,
  },
  {
    label: "Mutasi & Arus Kas",
    href: "/dashboard/keuangan/mutasiArusKas",
    icon: ArrowLeftRight,
  },
  {
    label: "Akun Kas & Bank",
    href: "/dashboard/keuangan/akunkas",
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
                "flex flex-1 items-center justify-center gap-2 py-3 px-1 text-sm font-medium whitespace-nowrap transition-all border-b-4 rounded-none bg-transparent cursor-pointer -mb-px focus-visible:ring-0 focus-visible:outline-none",
                isActive
                  ? "border-zinc-900 text-zinc-900 shadow-none"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-transparent",
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
