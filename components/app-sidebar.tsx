"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { decodeJWT } from "@/lib/decodeToken";
import { apiClient } from "@/lib/apiClient";
import { LokasiListResponse } from "@/types/location";

// Impor Ikon (Tambahan ikon Archive untuk Data Barang)
import {
  LayoutDashboard,
  User,
  CircleDollarSign,
  Package,
  Users,
  UserCircle,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ChevronsUpDown,
  GalleryVerticalEnd,
  Ticket,
  Building2,
  Warehouse,
  PlusCircle,
  ArrowRightLeft,
  Truck,
  BookOpen,
  ClipboardList,
  Archive
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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- TIPE DATA ---
type SubMenuItem = {
  label: string;
  href: string;
  permission?: string;
};

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  subItems?: SubMenuItem[];
};

type MenuGroup = {
  grup: string | null;
  items: MenuItem[];
};

// --- 1. DEFINISI MENU OUTLET (TELAH DIRESTUKTURISASI) ---
const outletMenus: MenuGroup[] = [
  {
    grup: null,
    items: [
      {
        label: "Dashboard",
        href: "/dashboard/outlet",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    grup: "Operasional",
    items: [
      {
        label: "Sesi Booking & Reservasi",
        href: "/dashboard/outlet/reservasi",
        icon: UserCircle,
        permission: "read-booking",
      },
      {
        label: "Promo & Diskon",
        href: "/dashboard/outlet/diskon",
        icon: Ticket,
      },
    ],
  },
  {
    grup: "Keuangan & Laporan",
    items: [
      {
        label: "Keuangan",
        href: "/dashboard/outlet/keuangan",
        icon: CircleDollarSign,
        permission: "read-akunkas",
        subItems: [
          {
            label: "Penjualan",
            href: "/dashboard/outlet/penjualan",
            permission: "read-penjualan",
          },
          {
            label: "Pengeluaran",
            href: "/dashboard/outlet/pengeluaran",
            permission: "read-pembayaran",
          },
        ],
      },
      {
        label: "Laporan",
        href: "/dashboard/outlet/keuangan/ringkasanLabaRugi",
        icon: FileText,
        permission: "read-laporan",
      },
    ],
  },
  // KELOMPOK BARU: INVENTARIS YANG DIPECAH 3
  {
    grup: "Manajemen Inventaris",
    items: [
      {
        label: "Data Barang",
        href: "/dashboard/outlet/inventaris-data", // Href semu untuk parent
        icon: Archive,
        permission: "read-inventory-outlet",
        subItems: [
          { label: "Produk Jualan", href: "/dashboard/outlet/inventaris/produk" },
          { label: "Kategori", href: "/dashboard/outlet/inventaris/kategori" },
          { label: "Bahan Baku / Resep", href: "/dashboard/outlet/inventaris/bahanBaku" },
        ]
      },
      {
        label: "Pantau Stok",
        href: "/dashboard/outlet/inventaris-pantau", // Href semu untuk parent
        icon: ClipboardList,
        permission: "read-inventory-outlet",
        subItems: [
          { label: "Stok Saat Ini", href: "/dashboard/outlet/inventaris/stok" },
          { label: "Hitung Fisik", href: "/dashboard/outlet/inventaris/stockOpname" },
          { label: "Koreksi Selisih", href: "/dashboard/outlet/inventaris/stockAdjustment" },
          { label: "Riwayat Pergerakan", href: "/dashboard/outlet/inventaris/jurnalStok" },
        ]
      },
      {
        label: "Suplai Gudang",
        href: "/dashboard/outlet/inventaris-suplai", // Href semu untuk parent
        icon: Truck,
        permission: "read-inventory-outlet",
        subItems: [
          { label: "Minta Barang", href: "/dashboard/outlet/inventaris/pengajuanStok" },
          { label: "Terima Barang", href: "/dashboard/outlet/inventaris/penerimaanBarang" },
        ]
      }
    ],
  },
  {
    grup: "Manajemen & Relasi",
    items: [
      {
        label: "Pelanggan",
        href: "/dashboard/outlet/pelanggan",
        icon: UserCircle,
        permission: "read-pelanggan",
      },
      {
        label: "Karyawan & Staff",
        href: "/dashboard/outlet/pengguna",
        icon: Users,
        permission: "read-pengguna",
      },
      {
        label: "Pengaturan Outlet",
        href: "/dashboard/outlet/pengaturan",
        icon: Settings,
      },
    ],
  },
];

// --- 2. DEFINISI MENU GUDANG (WMS) ---
const gudangMenus: MenuGroup[] = [
  {
    grup: null,
    items: [
      {
        label: "Dashboard WMS",
        href: "/dashboard/gudang",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    grup: "Manajemen Inventaris",
    items: [
      {
        label: "Barang Gudang",
        href: "/dashboard/gudang/inventaris",
        icon: Package,
        permission: "read-inventory-gudang",
      },
      {
        label: "Jurnal Stok",
        href: "/dashboard/gudang/jurnalStok",
        icon: BookOpen,
        permission: "read-jurnal-stok",
      },
      {
        label: "Stock Opname",
        href: "/dashboard/gudang/stockOpname",
        icon: ClipboardList,
        permission: "read-stock-opname",
      },
    ],
  },
  {
    grup: "Distribusi & WMS",
    items: [
      {
        label: "Pengajuan Stok",
        href: "/dashboard/gudang/pengajuanStok",
        icon: FileText,
        permission: "read-pengajuan-stok",
      },
      {
        label: "Transfer Stok",
        href: "/dashboard/gudang/transferStok",
        icon: ArrowRightLeft,
        permission: "read-transfer-stok",
      },
      {
        label: "Pengiriman Stok",
        href: "/dashboard/gudang/pengirimanStok",
        icon: Truck,
        permission: "read-pengiriman-stok",
      },
    ],
  },
  {
    grup: "Manajemen",
    items: [
      {
        label: "Petugas Gudang",
        href: "/dashboard/gudang/pengguna",
        icon: Users,
        permission: "read-pengguna",
      },
      {
        label: "Pengaturan Gudang",
        href: "/dashboard/gudang/pengaturan",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  // State Pengguna & Hak Akses
  const [namaUser, setNamaUser] = useState("");
  const [posisiUser, setPosisiUser] = useState("");
  const [namaToko, setNamaToko] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>("");

  // State Evaluasi Lokasi
  const [hasGudang, setHasGudang] = useState<boolean>(false);
  const [isLoadingLokasi, setIsLoadingLokasi] = useState<boolean>(true);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const penggunaToken = sessionStorage.getItem("penggunaToken");
        if (!penggunaToken) return;

        const payload = decodeJWT(penggunaToken);
        if (!payload || !payload.id) return;

        setNamaUser(payload.nama || "Pengguna");
        setPosisiUser(payload.role || "");
        setRole(payload.role || "");
        setNamaToko(payload.tenantName || "Nama Toko");
        setPermissions(payload.permissions || []);

        apiClient
          .get<{ data: any }>(`/pengguna/${payload.id}`, undefined, "pengguna")
          .then((res) => {
            if (res && res.data) setNamaUser(res.data.nama || payload.nama);
          })
          .catch(() => {});

        apiClient
          .get<LokasiListResponse>("/location", undefined, "pengguna")
          .then((res) => {
            const gudangExists = res.data?.some((loc) => loc.tipe === "Gudang");
            setHasGudang(!!gudangExists);
          })
          .catch(() => {})
          .finally(() => {
            setIsLoadingLokasi(false);
          });
      } catch (err) {
        console.error("Gagal memuat data di sidebar:", err);
        setIsLoadingLokasi(false);
      }
    };

    fetchSidebarData();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post("/pengguna/pin-logout", {}, undefined, "pengguna");
      await apiClient.post("/akun/auth/logout", {});
    } catch {}
    finally {
      sessionStorage.removeItem("penggunaToken");
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("akun");
      router.push("/login");
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const hasPermission = (permission?: string) => {
    if (role === "Owner") return true;
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const isGudangWorkspace = pathname.startsWith("/dashboard/gudang");
  const activeMenus = isGudangWorkspace ? gudangMenus : outletMenus;
  const currentWorkspaceName = isGudangWorkspace ? "Gudang Ops." : "Outlet Ops.";

  const canAccessOutlet = role === "Owner" || permissions.includes("read-dashboard-outlet");
  const canAccessGudang = role === "Owner" || permissions.includes("read-dashboard-gudang");
  const canCreateLocation = role === "Owner" || permissions.includes("create-location");

  return (
    <Sidebar collapsible="icon" className="border-none [&>div]:border-none" {...props}>
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
              
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" align="start" side="bottom" sideOffset={4}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Pilih Ruang Kerja</DropdownMenuLabel>
                
                {canAccessOutlet && (
                  <DropdownMenuItem onClick={() => handleNavigation("/dashboard/outlet")} className={`cursor-pointer ${!isGudangWorkspace ? "bg-accent" : ""}`}>
                    <Building2 className="mr-2 size-4 text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Ruang Outlet</span>
                      <span className="text-[10px] text-muted-foreground">Dasbor Kasir & Penjualan</span>
                    </div>
                  </DropdownMenuItem>
                )}

                {canAccessGudang && hasGudang && !isLoadingLokasi && (
                  <DropdownMenuItem onClick={() => handleNavigation("/dashboard/gudang")} className={`cursor-pointer ${isGudangWorkspace ? "bg-accent" : ""}`}>
                    <Warehouse className="mr-2 size-4 text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Ruang Gudang</span>
                      <span className="text-[10px] text-muted-foreground">WMS & Inventaris Pusat</span>
                    </div>
                  </DropdownMenuItem>
                )}

                {!hasGudang && canCreateLocation && !isLoadingLokasi && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavigation("/dashboard/gudang/setup")} className="cursor-pointer text-amber-600 focus:bg-amber-50 focus:text-amber-700">
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
          const visibleItems = group.items.filter((item) => hasPermission(item.permission));
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
                  const visibleSubItems = item.subItems?.filter((sub) => hasPermission(sub.permission));
                  const hasSubItems = visibleSubItems && visibleSubItems.length > 0;

                  // FIX: Gunakan exact match atau URL children (startsWith) agar tidak salah deteksi irisan URL
                  const isParentActive =
                    pathname === item.href ||
                    visibleSubItems?.some((sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`));

                  if (hasSubItems) {
                    return (
                      <Collapsible key={item.href} asChild defaultOpen={isParentActive} className="group/collapsible">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.label} isActive={isParentActive} className="text-slate-50/90! bg-transparent! hover:bg-slate-50/40! hover:text-slate-50! data-[active=true]:text-slate-50! data-[active=true]:bg-slate-50/40! cursor-pointer">
                              <item.icon />
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {visibleSubItems.map((subItem) => {
                                // FIX: Menjaga menu tetap aktif saat berada di halaman detail (misal: /pengajuanStok/[id])
                                const isSubActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
                                return (
                                  <SidebarMenuSubItem key={subItem.href}>
                                    <SidebarMenuSubButton asChild isActive={isSubActive} className="text-slate-50/90! bg-transparent! hover:bg-slate-50/40! hover:text-slate-50! data-[active=true]:text-slate-50! data-[active=true]:bg-slate-50/40! cursor-pointer">
                                      <a href={subItem.href} onClick={(e) => { e.preventDefault(); handleNavigation(subItem.href); }}>
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
                      <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href} onClick={() => handleNavigation(item.href)} className="text-slate-50/90! bg-transparent! hover:bg-slate-50/40! hover:text-slate-50! data-[active=true]:text-slate-50! data-[active=true]:bg-slate-50/40! cursor-pointer">
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
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="bg-transparent! hover:bg-sidebar-accent! data-[state=open]:bg-sidebar-accent! text-slate-50! hover:text-slate-900! data-[state=open]:text-slate-900! cursor-pointer transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" alt={namaUser || "Avatar Pengguna"} />
                    <AvatarFallback className="bg-neutral-600 text-xs font-bold text-white">
                      {namaUser ? namaUser.substring(0, 2).toUpperCase() : "US"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold group-data-[state=open]:text-slate-900">{namaUser || "Nama Pengguna"}</span>
                    <span className="truncate text-xs text-slate-50/70 group-data-[state=open]:text-slate-500">{posisiUser || "Position"}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-slate-50/70 group-data-[state=open]:text-slate-500" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{namaUser}</p>
                    <p className="text-xs leading-none text-muted-foreground">{role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation("/dashboard/profil")} className="cursor-pointer">
                  <User className="mr-2 size-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-white focus:bg-red-500 cursor-pointer">
                  <LogOut className="mr-2 size-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
