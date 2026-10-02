"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { akhiriSesi } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { useKeluar } from "@/features/auth/hooks";
import { usePenggunaSaya } from "@/features/pengguna/hooks-profil";
import { inisialNama } from "@/features/pengguna/schema-profil";

/**
 * Kaki sidebar: identitas pengguna, tautan profil, dan logout. Nama dibaca
 * dari GET /pengguna/:id lewat usePenggunaSaya, karena token tidak membawa
 * nama; hook itu berbagi cache dengan halaman profil, sehingga nama di sini
 * ikut berubah setelah profil disimpan. Peran dibaca dari sesi.
 */
export function SidebarPengguna({ onNavigasi }: { onNavigasi: (href: string) => void }) {
  const router = useRouter();
  const { pengguna: sesi } = useSession();
  const profil = usePenggunaSaya();
  const nama = profil.data?.nama ?? "";
  const peran = sesi?.role ?? "";
  const keluar = useKeluar();

  // Sesi lokal tetap diakhiri walau permintaan logout gagal.
  const logout = () => {
    keluar.mutate(undefined, {
      onSettled: () => {
        akhiriSesi();
        router.push("/login");
      },
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-transparent! hover:bg-sidebar-accent! data-[state=open]:bg-sidebar-accent! text-slate-50! hover:text-slate-900! data-[state=open]:text-slate-900! cursor-pointer transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-neutral-600 text-xs font-bold text-white">
                  {inisialNama(nama)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold group-data-[state=open]:text-slate-900">
                  {nama || "Nama Pengguna"}
                </span>
                <span className="truncate text-xs text-slate-50/70 group-data-[state=open]:text-slate-500">
                  {peran || "Position"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-slate-50/70 group-data-[state=open]:text-slate-500" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{nama}</p>
                <p className="text-xs leading-none text-muted-foreground">{peran}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onNavigasi("/dashboard/profil")}
              className="cursor-pointer"
            >
              <User className="mr-2 size-4" /> Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-500 focus:text-white focus:bg-red-500 cursor-pointer"
            >
              <LogOut className="mr-2 size-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}