"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { decodeJWT } from "@/lib/decodeToken";
import { apiClient } from "@/lib/apiClient";
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
  Ticket
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const menuGroups: MenuGroup[] = [
  // {
  //   grup: null,
  //   items: [
  //     {
  //       label: "Menu Utama",
  //       href: "/dashboard",
  //       icon: Home,
  //     },
  //   ],
  // },
  {
    grup: null,
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      // {
      //   label: "Titik Penjualan (POS)",
      //   href: "/dashboard/pos",
      //   icon: MonitorSmartphone,
      //   permission: "read-penjualan",
      // },
      // {
      //   label: "Manajemen Booking",
      //   href: "/dashboard/booking",
      //   icon: CalendarDays,
      //   permission: "read-booking",
      // },
    ],
  },
  {
    grup: null,
    items: [
      {
        label: "Modul Keuangan",
        href: "/dashboard/keuangan",
        icon: CircleDollarSign,
        permission: "read-akunkas", // Sesuai dengan seed permission Anda
        subItems: [
          {
            label: "Penjualan",
            href: "/dashboard/penjualan",
            permission: "read-penjualan",
          },
          {
            label: "Pengeluaran",
            href: "/dashboard/pengeluaran",
            permission: "read-pembayaran", // Disesuaikan dengan seed
          },
        ],
      },
    ],
  },
  {
    grup: null,
    items: [
      {
        label: "Modul Inventaris",
        href: "/dashboard/inventaris",
        icon: Package,
        permission: "read-inventory", // Disamakan dengan seed
        subItems: [
          {
            label: "Kategori",
            href: "/dashboard/kategori",
            permission: "read-kategori",
          },
          {
            label: "Produk",
            href: "/dashboard/produk",
            permission: "read-produk",
          },
        ],
      },
    ],
  },
  {
    grup: null,
    items: [
      {
        label: "Modul Tim & Staff",
        href: "/dashboard/pengguna",
        icon: Users,
        permission: "read-pengguna",
      },
    ],
  },
  {
    grup: null,
    items: [
      {
        label: "Modul Pelanggan",
        href: "/dashboard/pelanggan",
        icon: UserCircle,
        permission: "read-pelanggan",
      },
    ],
  },
  {
    grup: null,
    items: [
      {
        label: "Modul Laporan",
        href: "/dashboard/keuangan/ringkasanLabaRugi",
        icon: FileText,
        permission: "read-laporan",
      },
    ],
  },
  {
    grup: null,
    items: [
      {
        label: "Promo",
        href: "/dashboard/diskon",
        icon: Ticket,
      },
    ]
  },
    {
    grup: null,
    items: [
      {
        label: "Pengaturan",
        href: "/dashboard/pengaturan",
        icon: Settings,
      },
    ]
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const [namaUser, setNamaUser] = useState("");
  const [posisiUser, setPosisiUser] = useState("");
  const [namaToko, setNamaToko] = useState(""); // State baru untuk nama toko
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const fetchSidebarUserData = async () => {
      try {
        const penggunaToken = sessionStorage.getItem("penggunaToken");
        if (!penggunaToken) return;

        const payload = decodeJWT(penggunaToken);
        if (!payload || !payload.id) return;

        // 1. Set data fallback awal dari JWT agar tidak kosong saat loading
        setNamaUser(payload.nama || "Pengguna");
        setPosisiUser(payload.role || "");
        setNamaToko(payload.tenantName || "Nama Toko");
        setPermissions(payload.permissions || []);

        // 2. Ambil data terupdate langsung dari database (Sama seperti Laman Profil)
        const response = await apiClient.get<{ data: any }>(
          `/pengguna/${payload.id}`,
          undefined,
          "pengguna",
        );

        // 3. Timpa nama dengan data asli terupdate dari database
        if (response && response.data) {
          const userDb = response.data;
          setNamaUser(userDb.nama || payload.nama || "Pengguna");
        }
      } catch (err) {
        console.error("Gagal memuat data user di sidebar:", err);
      }
    };

    fetchSidebarUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post("/pengguna/pin-logout", {}, undefined, "pengguna");
    } catch {}
    try {
      await apiClient.post("/akun/auth/logout", {});
    } catch {
    } finally {
      sessionStorage.removeItem("penggunaToken");
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("akun");
      router.push("/login");
    }
  };

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  return (
    <Sidebar collapsible="icon" className="border-none [&>div]:border-none" {...props}>
      {/* HEADER */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="bg-transparent! hover:bg-sidebar-accent! data-[state=open]:bg-sidebar-accent! cursor-pointer"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-700 text-sidebar-primary-foreground">
                <GalleryVerticalEnd className="size-4 " />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight text-slate-50 hover:text-slate-900">
                <span className="truncate font-semibold">{namaToko}</span>{" "}
                {/* Dinamis dari Token */}
                <span className="truncate text-xs">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent>
        {menuGroups.map((group, gi) => {
          const visibleItems = group.items.filter((item) =>
            hasPermission(item.permission),
          );

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={gi}>
              {group.grup && (
                <SidebarGroupLabel>{group.grup}</SidebarGroupLabel>
              )}
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const visibleSubItems = item.subItems?.filter((sub) =>
                    hasPermission(sub.permission),
                  );

                  const hasSubItems =
                    visibleSubItems && visibleSubItems.length > 0;

                  const isParentActive =
                    pathname === item.href ||
                    visibleSubItems?.some((sub) => pathname.includes(sub.href));

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
                              {visibleSubItems.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === subItem.href}
                                    className="text-slate-50/90! bg-transparent! hover:bg-slate-50/40! hover:text-slate-50! data-[active=true]:text-slate-50! data-[active=true]:bg-slate-50/40! cursor-pointer"
                                  >
                                    <a
                                      href={subItem.href}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        router.push(subItem.href);
                                      }}
                                    >
                                      <span>{subItem.label}</span>
                                    </a>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
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
                        onClick={() => router.push(item.href)}
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

      {/* FOOTER */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="bg-transparent! hover:bg-sidebar-accent! data-[state=open]:bg-sidebar-accent! text-slate-50! hover:text-slate-900! data-[state=open]:text-slate-900! cursor-pointer"
                >
                  {/* Perubahan ke Avatar Bulat Sempurna Shadcn UI */}
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt={namaUser || "Avatar Pengguna"}
                    />
                    <AvatarFallback className="bg-neutral-600 text-xs font-bold">
                      {namaUser ? namaUser.substring(0, 2).toUpperCase() : "US"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate active:text-slate-900! font-semibold">
                      {namaUser || "Nama Pengguna"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {posisiUser || "Position"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/profil")} // Ganti ke "/dashboard/profil" jika Anda mengikuti saran saya, Sir.
                  className="cursor-pointer"
                >
                  <User className="mr-2 size-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-500 focus:text-white focus:bg-red-400 cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  Logout
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
