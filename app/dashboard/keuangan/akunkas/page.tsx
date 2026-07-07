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
import { KeuanganNavTabs } from "../components/keuangan-nav-tabs";
import { KeuanganSummaryCards } from "../components/keuangan-summary-cards";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function AkunKasCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between min-h-45">
      <div>
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div>
        <div className="h-px w-full bg-border my-4" />
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-8 w-36" />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <h1 className="text-2xl font-semibold">Manajemen Keuangan</h1>
        <Button
          variant="secondary"
          className="bg-[#424242] text-white hover:bg-[#525252] border-none shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Laporan
        </Button>
      </div>

      <KeuanganSummaryCards />

      {/* Navigasi tab keuangan */}
      <KeuanganNavTabs />

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
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/50 p-16 text-center">
            <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              Belum ada Akun Kas
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Tambahkan rekening bank atau kas fisik pertama Anda untuk mulai
              mencatat arus keuangan.
            </p>
          </div>
        ) : (
          akunKasList.map((akun, index) => {
            if (!akun._id) {
              console.warn(
                `_id hilang di indeks ${index}. Data asli:`,
                akun,
              );
            }

            const Icon = akun.tipeAkun === "Rekening Bank" ? Landmark : Wallet;
            const isAktif = akun.status === "aktif";

            return (
              <div
                // Fallback: Gunakan _id jika ada, atau gunakan kombinasi string dan index jika _id undefined
                key={akun._id || `akunkas-fallback-${index}`}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between min-h-45 shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{akun.tipeAkun}</Badge>
                      {!isAktif && (
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-600 hover:bg-red-100 border-none"
                        >
                          Non-Aktif
                        </Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {akun.namaAkun}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {akun.nomorAkun || "-"}
                  </p>
                  {akun.keterangan && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {akun.keterangan}
                    </p>
                  )}
                </div>
                <div>
                  <div className="h-px w-full bg-border my-4" />
                  <p className="text-xs font-medium text-muted-foreground mb-1 tracking-wider uppercase">
                    Saldo Saat Ini
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
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
