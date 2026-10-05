"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { IZIN, bolehBukaGrup, bolehBukaHalaman } from "@/lib/auth/permissions";
import { useDaftarLokasi } from "@/features/inventaris/hooks";
import { useTenant } from "@/features/tenant/hooks";
import { SidebarPengguna } from "@/components/sidebar-pengguna";
import { gudangMenus, outletMenus, type MenuItem } from "@/components/sidebar-menu";

// Impor Ikon (Tambahan ikon Archive untuk Data Barang)
import {
  ChevronRight,
  ChevronsUpDown,
  GalleryVerticalEnd,
  Building2,
  Warehouse,
  PlusCircle,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  // Izin dibaca langsung dari sesi saat render, bukan disalin ke state
  // lewat effect, sehingga menu berizin mengikuti sesi begitu pulih setelah
  // halaman dimuat ulang (keputusan PO16a).
  const { pengguna } = useSession();
  const permissions = pengguna?.permissions ?? [];
  // Lokasi dimuat lewat features/inventaris dan berbagi cache dengan layout
  // gudang, sehingga menu Ruang Gudang muncul setelah setup tanpa muat
  // ulang (keputusan GD5a). Tanpa read-location permintaan dimatikan.
  const bacaLokasi = permissions.includes(IZIN.location);
  const daftarLokasi = useDaftarLokasi({ aktif: bacaLokasi });
  const hasGudang = daftarLokasi.data?.some((l) => l.tipe === "Gudang") ?? false;
  const isLoadingLokasi = bacaLokasi && daftarLokasi.isLoading;
  // Nama toko dibaca dari GET /tenant/:id, bukan dari tenantName token, yang
  // menjadi "Toko Tidak Diketahui" setelah pin-refresh (keputusan PO15a,
  // kontrak/temuan.md butir 98). Berbagi cache dengan halaman Profil Toko,
  // sehingga nama ikut berubah setelah profil disimpan.
  const tenant = useTenant();
  const namaToko = tenant.data?.namaToko ?? (tenant.isError ? "Nama Toko" : "");

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  /**
   * Kelayakan menu ditentukan oleh izin yang benar-benar diwajibkan backend
   * untuk endpoint yang dipanggil halamannya (lib/auth/permissions.ts),
   * bukan oleh nama permission yang ditulis di definisi menu.
   *
   * Pemeriksaan nama role dihapus: Owner memegang seluruh permission di
   * backend, sehingga pemeriksaan berbasis daftar permission sudah mencakupnya.
   */
  const bolehLihatItem = (item: MenuItem) =>
    item.subItems?.length
      ? bolehBukaGrup(
          item.subItems.map((s) => s.href),
          permissions,
        )
      : bolehBukaHalaman(item.href, permissions);

  const isGudangWorkspace = pathname.startsWith("/dashboard/gudang");
  const activeMenus = isGudangWorkspace ? gudangMenus : outletMenus;
  const currentWorkspaceName = isGudangWorkspace
    ? "Gudang Ops."
    : "Outlet Ops.";

  const canAccessOutlet =
    permissions.includes(IZIN.dashboardOutlet);
  const canAccessGudang =
    permissions.includes(IZIN.dashboardGudang);
  const canCreateLocation =
    permissions.includes(IZIN.buatLocation);
  // Ruang Gudang tetap ditawarkan saat lokasi tidak dapat dibaca (tanpa
  // read-location) atau gagal dimuat; layout gudang yang menampilkan
  // pesannya (keputusan GD4a dan GD5a). Setup hanya ditawarkan bila daftar
  // lokasi terbukti tidak memuat gudang.
  const tawarkanRuangGudang =
    canAccessGudang &&
    !isLoadingLokasi &&
    (hasGudang || !bacaLokasi || daftarLokasi.isError);
  const tawarkanSetupGudang =
    canCreateLocation && daftarLokasi.isSuccess && !hasGudang;

  return (
    <Sidebar
      collapsible="icon"
      className="border-none [&>div]:border-none"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="bg-transparent! hover:bg-sidebar-accent! data-[state=open]:bg-sidebar-accent! cursor-pointer"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-700 text-sidebar-primary-foreground">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight text-slate-50 hover:text-slate-900 transition-colors">
                    <span className="truncate font-semibold">{namaToko}</span>
                    <span className="truncate text-xs text-slate-50/70 group-hover:text-slate-500">
                      {currentWorkspaceName}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-slate-50/70 group-hover:text-slate-500" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Pilih Ruang Kerja
                </DropdownMenuLabel>

                {canAccessOutlet && (
                  <DropdownMenuItem
                    onClick={() => handleNavigation("/dashboard/outlet")}
                    className={`cursor-pointer ${!isGudangWorkspace ? "bg-accent" : ""}`}
                  >
                    <Building2 className="mr-2 size-4 text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Ruang Outlet</span>
                      <span className="text-[10px] text-muted-foreground">
                        Dasbor Kasir & Penjualan
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}

                {tawarkanRuangGudang && (
                  <DropdownMenuItem
                    onClick={() => handleNavigation("/dashboard/gudang")}
                    className={`cursor-pointer ${isGudangWorkspace ? "bg-accent" : ""}`}
                  >
                    <Warehouse className="mr-2 size-4 text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Ruang Gudang</span>
                      <span className="text-[10px] text-muted-foreground">
                        WMS & Inventaris Pusat
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}

                {tawarkanSetupGudang && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleNavigation("/dashboard/gudang/setup")
                      }
                      className="cursor-pointer text-amber-600 focus:bg-amber-50 focus:text-amber-700"
                    >
                      <PlusCircle className="mr-2 size-4" />
                      <span className="font-medium">Setup Gudang Baru</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {activeMenus.map((group, gi) => {
          const visibleItems = group.items.filter((item) =>
            bolehLihatItem(item),
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={gi}>
              {group.grup && (
                <SidebarGroupLabel className="text-slate-50/50 uppercase tracking-wider text-[10px] mt-2">
                  {group.grup}
                </SidebarGroupLabel>
              )}
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const visibleSubItems = item.subItems?.filter((sub) =>
                    bolehBukaHalaman(sub.href, permissions),
                  );
                  const hasSubItems =
                    visibleSubItems && visibleSubItems.length > 0;

                  // FIX: Gunakan exact match atau URL children (startsWith) agar tidak salah deteksi irisan URL
                  const isParentActive =
                    pathname === item.href ||
                    visibleSubItems?.some(
                      (sub) =>
                        pathname === sub.href ||
                        pathname.startsWith(`${sub.href}/`),
                    );

                  if (hasSubItems) {
                    return (
                      <Collapsible
                        key={item.href}
                        asChild
                        defaultOpen={isParentActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.label}
                              isActive={isParentActive}
                              className="text-slate-50/90! bg-transparent! hover:bg-slate-50/40! hover:text-slate-50! data-[active=true]:text-slate-50! data-[active=true]:bg-slate-50/40! cursor-pointer"
                            >
                              <item.icon />
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {visibleSubItems.map((subItem) => {
                                // FIX: Menjaga menu tetap aktif saat berada di halaman detail (misal: /pengajuanStok/[id])
                                const isSubActive =
                                  pathname === subItem.href ||
                                  pathname.startsWith(`${subItem.href}/`);
                                return (
                                  <SidebarMenuSubItem key={subItem.href}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      className="text-slate-50/90! bg-transparent! hover:bg-slate-50/40! hover:text-slate-50! data-[active=true]:text-slate-50! data-[active=true]:bg-slate-50/40! cursor-pointer"
                                    >
                                      <a
                                        href={subItem.href}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleNavigation(subItem.href);
                                        }}
                                      >
                                        <span>{subItem.label}</span>
                                      </a>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={pathname === item.href}
                        onClick={() => handleNavigation(item.href)}
                        className="text-slate-50/90! bg-transparent! hover:bg-slate-50/40! hover:text-slate-50! data-[active=true]:text-slate-50! data-[active=true]:bg-slate-50/40! cursor-pointer"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarPengguna onNavigasi={handleNavigation} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
