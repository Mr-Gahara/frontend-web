"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, LineChart, FileText, MonitorSmartphone, Package, Wallet } from "lucide-react";
import { bolehBukaHalaman } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { cn } from "@/lib/utils";

const tabs = [
  {
    label: "Ringkasan Laba/Rugi",
    href: "/dashboard/outlet/keuangan/ringkasanLabaRugi",
    icon: LineChart,
  },
  {
    // Laporan arus kas (B291, desain D pemilik proyek 12 November 2026).
    label: "Arus Kas",
    href: "/dashboard/outlet/keuangan/arusKas",
    icon: Wallet,
  },
  {
    // Buku mutasi; nama tab dari "Mutasi & Arus Kas" agar tidak kembar dengan
    // tab Arus Kas (pemilik proyek, 12 November 2026).
    label: "Mutasi Kas",
    href: "/dashboard/outlet/keuangan/mutasiArusKas",
    icon: ArrowLeftRight,
  },
  {
    label: "Akun Kas & Bank",
    href: "/dashboard/outlet/keuangan/akunkas",
    icon: FileText,
  },
  {
    // Gabungan pembelian stok seluruh outlet dan gudang (keputusan pemilik
    // proyek, 25 Oktober 2026); ubah dan hapus tetap di ruang asal.
    label: "Belanja Stok",
    href: "/dashboard/outlet/keuangan/belanjaStok",
    icon: Package,
  },
  {
    // Buka-tutup kasir dan mesin kasir (MK1a, modul/keuangan.md).
    label: "Mesin Kasir",
    href: "/dashboard/outlet/keuangan/mesinKasir",
    icon: MonitorSmartphone,
  },
];

export function KeuanganNavTabs() {
  const pathname = usePathname();
  const { permissions } = useSession();
  // Tab yang halamannya ditolak IZIN_HALAMAN disembunyikan, seperti sidebar
  // (kontrak/temuan.md butir 163).
  const tabTerlihat = tabs.filter(({ href }) => bolehBukaHalaman(href, permissions));

  return (
    <div className="w-full">
      <nav
        className="flex flex-wrap gap-2 w-full sm:flex-nowrap sm:gap-0 sm:overflow-x-auto sm:overflow-y-hidden sm:[&::-webkit-scrollbar]:hidden sm:[-ms-overflow-style:none] sm:[scrollbar-width:none]"
        aria-label="Navigasi Keuangan"
      >
        {tabTerlihat.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // HP: pil yang turun ke baris berikutnya, sehingga setiap tab dan
                // tab aktif selalu terlihat. Sejak sm: garis bawah seperti semula.
                "flex items-center justify-center gap-2 h-10 px-3.5 rounded-full border text-sm font-semibold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-0 focus-visible:outline-none",
                "sm:flex-1 sm:h-auto sm:py-3 sm:px-1 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-4 sm:font-bold sm:bg-transparent sm:-mb-px",
                isActive
                  ? "bg-navy text-gading border-navy sm:text-navy sm:shadow-none"
                  : "bg-white text-navy border-navy/15 hover:bg-krem sm:border-transparent sm:text-navy/50 sm:hover:text-navy sm:hover:bg-transparent",
              )}
            >
              <Icon className="hidden sm:block w-4 h-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
