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
    <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 flex flex-col justify-between min-h-45 shadow-sm">
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
    // 1. Kunci return type secara eksplisit di fungsi ini
    queryFn: async (): Promise<AkunKas[]> => {
      // 2. Gunakan Union Type: Respons bisa berupa Array murni ATAU Object dengan properti 'data'
      const res = await apiClient.get<{ data: AkunKas[] } | AkunKas[]>(
        "/akunkas",
        undefined,
        "pengguna",
      );

      // 3. Evaluasi aman (Type Guarding)
      if (Array.isArray(res)) return res;
      if (res && "data" in res && Array.isArray(res.data)) return res.data;

      return [];
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Daftar Akun Kas & Bank</h2>
          <p className="text-sm text-muted-foreground">
            Kelola rekening dan kas fisik yang terhubung ke sistem POS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled
            title="Fitur transfer antar akun belum tersedia"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Pindah Dana
          </Button>
          <Link href="/dashboard/keuangan/akunkas/buatAkunKas">
            <Button className="bg-[#424242] text-white hover:bg-[#525252] border-none">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Akun
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid kartu akun kas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {isLoading ? (
          <>
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
          </>
        ) : akunKasList.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[#0A2947]/20 bg-[#F2EAE1] p-16 text-center shadow-sm">
            <Wallet className="w-10 h-10 text-[#D4A373] mx-auto mb-4" />
            <p className="text-sm font-semibold text-[#0A2947] mb-1">
              Belum ada Akun Kas
            </p>
            <p className="text-xs text-[#0A2947]/70 mb-6">
              Tambahkan rekening bank atau kas fisik pertama Anda untuk mulai
              mencatat arus keuangan.
            </p>
          </div>
        ) : (
          akunKasList.map((akun, index) => {
            if (!akun._id) {
              console.warn(`_id hilang di indeks ${index}. Data asli:`, akun);
            }

            const Icon = akun.tipeAkun === "Rekening Bank" ? Landmark : Wallet;
            const isAktif = akun.status === "aktif";

            return (
              <div
                key={akun._id || `akunkas-fallback-${index}`}
                className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 flex flex-col justify-between min-h-45 shadow-sm hover:border-[#0A2947]/30 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    {/* Kotak Penetral Cream, Ikon Mustard */}
                    <div className="p-3 bg-[#FFFAF3] rounded-lg shadow-sm">
                      <Icon className="w-6 h-6 text-[#D4A373]" />
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Badge Sage Green, Teks Cream */}
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
                  {/* Teks Utama Navy */}
                  <h3 className="text-lg font-bold tracking-tight text-[#0A2947]">
                    {akun.namaAkun}
                  </h3>
                  <p className="text-sm font-medium text-[#0A2947]/70 mt-1">
                    {akun.nomorAkun || "-"}
                  </p>
                  {akun.keterangan && (
                    <p className="text-xs text-[#0A2947]/60 mt-1 line-clamp-1">
                      {akun.keterangan}
                    </p>
                  )}
                </div>
                <div>
                  {/* Garis Navy Transparan */}
                  <div className="h-px w-full bg-[#0A2947]/10 my-4" />
                  {/* Label Mustard, Nominal Navy */}
                  <p className="text-xs font-bold text-[#D4A373] mb-1 tracking-wider uppercase">
                    Saldo Saat Ini
                  </p>
                  <p className="text-2xl font-black tracking-tight text-[#0A2947]">
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
