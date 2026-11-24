"use client";

import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { bolehLihatMenu, gudangMenus, outletMenus } from "@/components/sidebar-menu";
import { useSession } from "@/lib/auth/useSession";
import { useAksesGudang } from "@/features/inventaris/use-akses-gudang";
import { TurSorotan, usePanduan } from "./tur-sorotan";
import { kunciPanduanDashboard, TARGET_MENU_UTAMA, titikDashboard, tombolPanduanGudangTampil } from "./titik-dashboard";
import { planMencakup } from "@/lib/auth/fitur-plan";

const MENU_RUANG = {
  outlet: outletMenus.flatMap((g) => g.items),
  gudang: gudangMenus.flatMap((g) => g.items),
};

/**
 * Tombol Lihat panduan dashboard di topbar beserta turnya (kanvas "Panduan
 * Wizard Setup", pemilik proyek, 7 November 2026). Tur tampil sendiri saat
 * pengguna pertama kali membuka ruang outlet di perangkat ini, dengan kunci
 * dashboard.<id pengguna>. Ruang gudang punya tur sendiri dengan menunya
 * (TG1a, 17 November 2026) dan kunci dashboard-gudang.<id pengguna>, sehingga
 * masing-masing tampil sendiri sekali. Di HP sidebar dibuka untuk titik menu
 * dan ditutup lagi saat tur selesai.
 */
export function TombolPanduanDashboard() {
  const pathname = usePathname();
  const { pengguna, plan, permissions } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const ruang = pathname.startsWith("/dashboard/gudang") ? "gudang" : "outlet";
  // Di Setup Gudang menu gudang mengalihkan kembali ke setup, sehingga tur
  // tidak tampil di sana dan baru tampil setelah Gudang terdaftar (TG2a).
  const diSetupGudang = pathname.startsWith("/dashboard/gudang/setup");
  const { akses: aksesGudang } = useAksesGudang(pathname, ruang === "gudang");
  const { buka, mulai, tutup } = usePanduan(
    kunciPanduanDashboard({
      penggunaId: pengguna?.id ?? null,
      ruang,
      diSetupGudang,
      gudangDiizinkan: aksesGudang === "izinkan",
    }),
  );
  const titik = titikDashboard(
    (href) => {
      const menu = MENU_RUANG[ruang].find((m) => m.href === href);
      return !!menu && bolehLihatMenu(menu, plan, permissions);
    },
    isMobile,
    ruang,
  );

  if (diSetupGudang) return null;
  if (ruang === "gudang" && !tombolPanduanGudangTampil({ planMencakupGudang: planMencakup(plan, "wms"), aksesGudang })) {
    return null;
  }
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