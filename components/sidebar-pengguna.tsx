"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, ChevronsUpDown, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { pesanError } from "@/lib/api/error";
import { akhiriSesi, tandaiKeluar } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { useGantiPengguna, useKeluar } from "@/features/auth/hooks";
import { usePenggunaSaya } from "@/features/pengguna/hooks-profil";
import { inisialNama } from "@/features/pengguna/schema-profil";
import { useTenant } from "@/features/tenant/hooks";

/**
 * Avatar inisial (PF9a) berlatar karamel dengan teks putih (pemilik proyek,
 * 24 November 2026, PU2a; kontras rendah diterima pemilik proyek).
 */
function AvatarPengguna({ nama, besar }: { nama: string; besar?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        besar
          ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-karamel text-kecil font-bold text-white"
          : "flex size-8 shrink-0 items-center justify-center rounded-full bg-karamel text-kecil font-bold text-white"
      }
    >
      {inisialNama(nama)}
    </span>
  );
}

/**
 * Kaki sidebar desain C (PU2a): identitas pengguna, lalu Profil Saya, Ganti
 * pengguna, dan Keluar dari toko. Nama dibaca dari GET /pengguna/:id lewat
 * usePenggunaSaya, karena token tidak membawa nama; hook itu berbagi cache
 * dengan halaman profil, sehingga nama di sini ikut berubah setelah profil
 * disimpan. Peran dibaca dari sesi, nama toko dari tenant.
 */
export function SidebarPengguna({ onNavigasi }: { onNavigasi: (href: string) => void }) {
  const router = useRouter();
  const { pengguna: sesi } = useSession();
  const profil = usePenggunaSaya();
  const tenant = useTenant();
  const nama = profil.data?.nama ?? "";
  const peran = sesi?.role ?? "";
  const namaToko = tenant.data?.namaToko ?? "";
  const keluar = useKeluar();
  const ganti = useGantiPengguna();

  // Keluar dari toko: sesi lokal tetap diakhiri walau permintaan logout gagal.
  const keluarDariToko = () => {
    keluar.mutate(undefined, {
      onSettled: () => {
        akhiriSesi();
        router.push("/login");
      },
    });
  };

  // Ganti pengguna: akun toko tetap masuk, kembali ke "Siapa yang bertugas?".
  const gantiPengguna = () => {
    ganti.mutate(undefined, {
      onSuccess: () => {
        tandaiKeluar();
        router.replace("/login/pengguna");
      },
      onError: (err) => toast.error("Gagal ganti pengguna", { description: pesanError(err, "Coba lagi sebentar.") }),
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer bg-transparent! text-gading! transition-colors hover:bg-gading/14! data-[state=open]:bg-gading/14! data-[state=open]:text-gading!"
            >
              <AvatarPengguna nama={nama} />
              <div className="grid flex-1 text-left text-isi leading-tight">
                <span className="truncate font-semibold">{nama || "Nama Pengguna"}</span>
                <span className="truncate text-kecil text-gading/75">{peran || "Peran"}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-gading/75" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border-navy/10 p-1.5 text-navy"
            side="bottom"
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="flex min-w-0 items-start gap-2.5 p-2 font-normal">
              <AvatarPengguna nama={nama} besar />
              <span className="flex min-w-0 flex-col">
                <span className="text-isi font-bold [overflow-wrap:anywhere]">{nama}</span>
                <span className="text-kecil text-muted-foreground">{peran}</span>
                {namaToko && (
                  <span className="mt-0.5 text-kecil text-muted-foreground [overflow-wrap:anywhere]">{namaToko}</span>
                )}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-krem" />
            <DropdownMenuItem onClick={() => onNavigasi("/dashboard/profil")} className="h-10 cursor-pointer gap-2.5 text-isi">
              <User className="size-4" /> Profil Saya
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                gantiPengguna();
              }}
              disabled={ganti.isPending}
              className="min-h-11 cursor-pointer items-center gap-2.5 py-1.5"
            >
              <ArrowLeftRight className="size-4 shrink-0" />
              <span className="flex flex-col">
                <span className="text-isi">Ganti pengguna</span>
                <span className="text-kecil text-muted-foreground">Kembali ke Siapa yang bertugas?</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-krem" />
            <DropdownMenuItem
              onClick={keluarDariToko}
              disabled={keluar.isPending}
              className="h-10 cursor-pointer gap-2.5 text-isi font-semibold text-rose-redup focus:bg-rose-redup/10 focus:text-rose-redup"
            >
              <LogOut className="size-4 text-rose-redup" /> Keluar dari toko
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
