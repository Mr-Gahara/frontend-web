"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Download, Landmark, Plus, Wallet } from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AkunKas } from "@/types/akunKas";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function AkunKasCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-5 sm:p-6 flex flex-col justify-between min-h-45 shadow-sm">
      <div>
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-12 w-12 rounded-lg bg-[#0A2947]/10" />
          <Skeleton className="h-5 w-20 rounded-full bg-[#0A2947]/10" />
        </div>
        <Skeleton className="h-5 w-40 mb-2 bg-[#0A2947]/10" />
        <Skeleton className="h-4 w-28 bg-[#0A2947]/10" />
      </div>
      <div>
        <div className="h-px w-full bg-[#0A2947]/10 my-4" />
        <Skeleton className="h-3 w-24 mb-2 bg-[#0A2947]/10" />
        <Skeleton className="h-8 w-36 bg-[#0A2947]/10" />
      </div>
    </div>
  );
}

export default function AkunKasPage() {
  useAuthGuard();

  const { data: akunKasList = [], isLoading } = useQuery({
    queryKey: queryKeys.akunKas,
    queryFn: async (): Promise<AkunKas[]> => {
      const res = await apiClient.get<{ data: AkunKas[] } | AkunKas[]>(
        "/akunkas",
        undefined,
        "pengguna"
      );

      if (Array.isArray(res)) return res;
      if (res && "data" in res && Array.isArray(res.data)) return res.data;

      return [];
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A2947]">
            Daftar Akun Kas & Bank
          </h2>
          <p className="text-sm font-medium text-[#0A2947]/60 mt-1">
            Kelola rekening dan kas fisik yang terhubung ke sistem POS.
          </p>
        </div>

        {/* 
          PENGUBAHAN UTAMA: 
          Menggunakan `grid grid-cols-2` di mobile agar membagi persis 50:50.
          Di layar sm (tablet/desktop), kembali ke `flex` agar ukurannya menyesuaikan konten (auto).
        */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            disabled
            title="Fitur transfer antar akun belum tersedia"
            className="w-full sm:w-auto border-[#0A2947]/20 text-[#0A2947] px-2 sm:px-4"
          >
            <ArrowLeftRight className="w-4 h-4 mr-1.5 shrink-0" />
            <span className="truncate text-xs min-[375px]:text-sm">
              Pindah Dana
            </span>
          </Button>

          {/* Menambahkan class `block w-full` pada Link agar mengisi penuh sel Grid-nya */}
          <Link
            href="/dashboard/outlet/keuangan/akunkas/buatAkunKas"
            className="block w-full sm:w-auto"
          >
            <Button className="w-full bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 border-none font-bold shadow-sm cursor-pointer px-2 sm:px-4">
              <Plus className="w-4 h-4 mr-1.5 shrink-0" />
              <span className="truncate text-xs min-[375px]:text-sm">
                Tambah Akun
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid kartu akun kas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
        {isLoading ? (
          <>
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
          </>
        ) : akunKasList.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[#0A2947]/20 bg-[#F2EAE1] p-12 sm:p-16 text-center shadow-sm">
            <Wallet className="w-10 h-10 text-[#D4A373] mx-auto mb-4" />
            <p className="text-base font-bold text-[#0A2947] mb-1">
              Belum ada Akun Kas
            </p>
            <p className="text-sm font-medium text-[#0A2947]/60 mb-6 max-w-md mx-auto">
              Tambahkan rekening bank atau kas fisik pertama Anda untuk mulai
              mencatat arus keuangan.
            </p>
          </div>
        ) : (
          akunKasList.map((akun, index) => {
            const Icon = akun.tipeAkun === "Rekening Bank" ? Landmark : Wallet;
            const isAktif = akun.status === "aktif";

            return (
              <div
                key={akun._id || `akunkas-fallback-${index}`}
                className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-5 sm:p-6 flex flex-col justify-between min-h-45 shadow-sm hover:border-[#0A2947]/30 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[#FFFAF3] rounded-lg shadow-sm">
                      <Icon className="w-6 h-6 text-[#D4A373]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-[#718355] text-[#FFFAF3] hover:bg-[#718355]/90 border-none shadow-sm"
                      >
                        {akun.tipeAkun}
                      </Badge>
                      {!isAktif && (
                        <Badge
                          variant="secondary"
                          className="bg-red-900/10 text-red-600 hover:bg-red-900/10 border-none shadow-sm"
                        >
                          Non-Aktif
                        </Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#0A2947]">
                    {akun.namaAkun}
                  </h3>
                  <p className="text-sm font-medium text-[#0A2947]/70 mt-1">
                    {akun.nomorAkun || "-"}
                  </p>
                  {akun.keterangan && (
                    <p className="text-xs font-medium text-[#0A2947]/50 mt-1.5 line-clamp-2">
                      {akun.keterangan}
                    </p>
                  )}
                </div>
                <div>
                  <div className="h-px w-full bg-[#0A2947]/10 my-4" />
                  <p className="text-[11px] font-bold text-[#D4A373] mb-1 tracking-wider uppercase">
                    Saldo Saat Ini
                  </p>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2947]">
                    {formatRupiah(akun.saldo ?? 0)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}