"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAkunSaya } from "@/features/setup/hooks";
import { inisialAkun } from "./tampilan";

/**
 * Topbar panel admin desain B (pemilik proyek, 24 November 2026): navy
 * selebar layar, merek di kiri, identitas admin dan Keluar di kanan. Email
 * admin dibaca dari GET /akun/me (B240), karena token akun tidak membawanya;
 * selama belum termuat, avatar dan email tidak ditampilkan. Di bawah 768 px
 * identitas dan Keluar pindah ke menu avatar.
 */
export function KepalaAdmin({ onKeluar, keluarBerjalan }: { onKeluar: () => void; keluarBerjalan: boolean }) {
  const saya = useAkunSaya(true);
  const email = saya.data?.email ?? null;
  const inisial = email ? inisialAkun({ email, username: null }) : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 bg-navy px-4 text-gading sm:h-16 sm:px-6 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gading text-isi font-black text-navy"
        >
          T
        </span>
        <p className="hidden text-besar font-bold whitespace-nowrap sm:block">Tachyon POS</p>
        <span className="rounded-full bg-karamel/20 px-2.5 py-0.5 text-kecil font-semibold whitespace-nowrap text-karamel">
          Panel Admin
        </span>
      </div>

      <div className="hidden min-w-0 items-center gap-4 md:flex">
        {email && (
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-karamel text-kecil font-bold text-navy"
            >
              {inisial}
            </span>
            <span className="max-w-60 truncate text-isi font-medium" title={email}>
              {email}
            </span>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onKeluar}
          disabled={keluarBerjalan}
          className="h-9 border-gading/30 bg-transparent px-3.5 text-gading hover:bg-gading/10 hover:text-gading"
        >
          <LogOut className="size-4" />
          Keluar
        </Button>
      </div>

      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu akun admin"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-gading/60 focus-visible:outline-none"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-karamel text-kecil font-bold text-navy">
                {inisial ?? "A"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {email && (
              <>
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-mikro text-muted-foreground">Masuk sebagai</span>
                  <span className="text-isi font-semibold break-all text-navy">{email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={onKeluar} disabled={keluarBerjalan} className="cursor-pointer">
              <LogOut className="mr-2 size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
