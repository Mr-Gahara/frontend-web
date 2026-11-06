"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { AkunKas } from "@/types/akunKas";
import type { PerangkatKasir, SesiKasir } from "@/types/sesiKasir";
import type { StatusMuat } from "./bagian-kasir-buka";
import { ChipStatusKasir } from "./label";
import { labelLaci, teksTerakhirDipakai } from "./tampilan";

interface PropsPanelMesinKasir {
  status: StatusMuat;
  mesin: PerangkatKasir[];
  akunKas: AkunKas[] | undefined;
  sesiBuka: SesiKasir[];
  /** Sesi terbaru per installationId; null bila mesin belum pernah dipakai. */
  sesiTerakhir: Record<string, SesiKasir | null>;
  sekarang: Date;
  onTambah: () => void;
  onUbah: (mesin: PerangkatKasir) => void;
  onBerhenti: (mesin: PerangkatKasir) => void;
  onCobaLagi: () => void;
}

/**
 * Tingkat ketiga hierarki: pengaturan mesin kasir, jarang diubah. Selama
 * kasir di sebuah mesin buka, Berhenti dinonaktifkan (K-04, K-05: backend
 * menolak 409); Ubah tetap bisa untuk nama, dan lacinya terkunci di dialog.
 */
export function PanelMesinKasir({
  status,
  mesin,
  akunKas,
  sesiBuka,
  sesiTerakhir,
  sekarang,
  onTambah,
  onUbah,
  onBerhenti,
  onCobaLagi,
}: PropsPanelMesinKasir) {
  return (
    <section
      aria-labelledby="judul-mesin-kasir"
      className="flex flex-col gap-3 rounded-[18px] bg-krem p-4 sm:rounded-[20px] sm:p-[22px]"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="judul-mesin-kasir" className="text-lg font-bold text-navy">
          Mesin kasir
        </h2>
        {status === "siap" && <span className="text-sm text-navy/70">{mesin.length} terpasang</span>}
      </div>

      {status === "memuat" &&
        [0, 1].map((i) => <Skeleton key={i} className="h-[72px] rounded-[14px] bg-navy/10" />)}

      {status === "gagal" && (
        <div role="alert" className="flex flex-col gap-2 rounded-[14px] bg-gading p-4">
          <span className="font-bold text-navy">Daftar mesin kasir gagal dimuat</span>
          <Button variant="outline" onClick={onCobaLagi} className="h-11 border-navy/20 font-semibold text-navy">
            Coba lagi
          </Button>
        </div>
      )}

      {status === "siap" && (
        <ul className="flex flex-col gap-3">
          {mesin.map((m) => {
            const buka = sesiBuka.some((s) => s.installationId === m.installationId);
            return (
              <li key={m.id} className="flex items-start gap-2.5 rounded-[14px] bg-gading py-3 pl-3.5 pr-1.5">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="break-words font-bold text-navy">{m.namaPerangkat}</span>
                    <ChipStatusKasir buka={buka} />
                  </div>
                  <span className="text-sm text-navy/70">Laci {labelLaci(m, akunKas)}</span>
                  <span className="text-sm text-navy/70">
                    {teksTerakhirDipakai(sesiTerakhir[m.installationId] ?? null, sekarang)}
                  </span>
                </div>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      aria-label={`Aksi ${m.namaPerangkat}`}
                      className="size-11 shrink-0 p-0 text-navy hover:bg-krem"
                    >
                      <MoreHorizontal className="size-5" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 border-navy/10 bg-white p-1.5">
                    <DropdownMenuItem
                      onSelect={() => onUbah(m)}
                      className="h-11 cursor-pointer text-[15px] font-semibold text-navy"
                    >
                      Ubah nama dan laci
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={buka}
                      onSelect={() => onBerhenti(m)}
                      className="h-11 cursor-pointer text-[15px] text-navy"
                    >
                      Berhenti jadi mesin kasir
                    </DropdownMenuItem>
                    {buka && (
                      <p className="px-3 pb-2 pt-1 text-[13px] text-navy/70">
                        Kasir di mesin ini masih buka. Tutup kasirnya dulu untuk mengganti laci atau berhenti.
                      </p>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}

      {status === "siap" && (
        <Button
          variant="outline"
          onClick={onTambah}
          className="h-11 border-navy/25 bg-white text-[15px] font-bold text-navy"
        >
          <Plus className="size-[18px]" aria-hidden="true" />
          Tambah mesin kasir
        </Button>
      )}
    </section>
  );
}

/** Pemakaian pertama: belum ada mesin kasir, sehingga langkah ini naik ke paling atas (Revisi 2). */
export function MulaiMesinKasir({ onTambah }: { onTambah: () => void }) {
  return (
    <section aria-labelledby="judul-mulai" className="flex max-w-2xl flex-col gap-3 rounded-[20px] bg-krem p-5">
      <h2 id="judul-mulai" className="text-xl font-bold text-navy">
        Belum ada mesin kasir
      </h2>
      <p className="text-[15px] text-navy/70">
        Tambahkan HP atau tablet yang dipakai berjualan, lalu pilih laci uangnya. Tanpa mesin kasir, kasir tidak
        bisa dibuka dari aplikasi.
      </p>
      <Button
        onClick={onTambah}
        className="h-12 bg-navy text-base font-bold text-gading hover:bg-navy/90 sm:self-start sm:px-6"
      >
        <Plus className="size-[18px]" aria-hidden="true" />
        Tambah mesin kasir
      </Button>
    </section>
  );
}