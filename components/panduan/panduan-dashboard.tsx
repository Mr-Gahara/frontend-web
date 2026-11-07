"use client";

import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { bolehLihatMenu, outletMenus } from "@/components/sidebar-menu";
import { useSession } from "@/lib/auth/useSession";
import { TurSorotan, usePanduan } from "./tur-sorotan";
import { TARGET_MENU_UTAMA, titikDashboard } from "./titik-dashboard";

const MENU_OUTLET = outletMenus.flatMap((g) => g.items);

/**
 * Tombol Lihat panduan dashboard di topbar beserta turnya (kanvas "Panduan
 * Wizard Setup", pemilik proyek, 7 November 2026). Tur tampil sendiri saat
 * pengguna pertama kali membuka ruang outlet di perangkat ini, dengan kunci
 * dashboard.<id pengguna>. Ruang gudang memakai menu lain dan belum punya
 * tur, sehingga tombolnya tidak tampil di sana. Di HP sidebar dibuka untuk
 * titik menu dan ditutup lagi saat tur selesai.
 */
export function TombolPanduanDashboard() {
  const pathname = usePathname();
  const { pengguna, plan, permissions } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const ruangOutlet = !pathname.startsWith("/dashboard/gudang");
  const { buka, mulai, tutup } = usePanduan(ruangOutlet && pengguna ? "dashboard." + pengguna.id : null);
  const titik = titikDashboard((href) => {
    const menu = MENU_OUTLET.find((m) => m.href === href);
    return !!menu && bolehLihatMenu(menu, plan, permissions);
  }, isMobile);

  if (!ruangOutlet) return null;
  return (
    <>
      <button
        type="button"
        onClick={mulai}
        aria-label="Lihat panduan dashboard"
        title="Lihat panduan dashboard"
        className="flex items-center justify-center p-2.5 bg-navy text-white rounded-lg border-none shadow-sm cursor-pointer hover:bg-navy/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel"
      >
        <CircleHelp size={20} aria-hidden="true" />
      </button>
      <TurSorotan
        titik={titik}
        buka={buka}
        onPindah={(t) => {
          if (isMobile) setOpenMobile(t.target !== TARGET_MENU_UTAMA);
        }}
        onTutup={() => {
          if (isMobile) setOpenMobile(false);
          tutup();
        }}
      />
    </>
  );
}