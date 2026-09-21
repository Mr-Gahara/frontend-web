"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import type { StockAdjustment } from "@/types/stockOpname";
import type { ColumnDef } from "@tanstack/react-table";
import { useDaftarStockAdjustment } from "@/features/stock-adjustment/hooks";
import { formatTanggalAdjustment } from "@/features/stock-adjustment/tampilan";
import { TautanSumber } from "@/features/stock-adjustment/tautan-sumber";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Scale, ArrowUpDown, Eye } from "lucide-react";

export default function StockAdjustmentListPage() {
  useAuthGuard();
  const router = useRouter();

  const { data: adjustmentList = [], isLoading } = useDaftarStockAdjustment();

  // --- COLUMNS DEFINITION ---
  const columns = useMemo<ColumnDef<StockAdjustment>[]>(
    () => [
      {
        accessorKey: "nomorAdjustment",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. Jurnal
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold font-mono text-[#0A2947] text-sm">
            {row.original.nomorAdjustment}
          </span>
        ),
      },
      {
        accessorKey: "tanggal",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal Eksekusi
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-[#0A2947]/70">
            {formatTanggalAdjustment(row.original.tanggal)}
          </span>
        ),
      },
      {
        id: "sumber",
        header: () => (
          <div className="text-xs font-bold text-[#0A2947]/60">Sumber</div>
        ),
        cell: ({ row }) => (
          <TautanSumber
            adjustment={row.original}
            className="text-sm font-bold text-[#0A2947]"
          />
        ),
      },
      {
        id: "aksi",
        header: () => (
          <div className="text-right text-xs font-bold text-[#0A2947]/60">Aksi</div>
        ),
        cell: ({ row }) => {

          return (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm h-8 px-3"
                onClick={() => router.push(`/dashboard/outlet/inventaris/stockAdjustment/${row.original.id}`)}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Lihat Audit Trail
              </Button>
            </div>
          );
        },
      },
    ],
    [router],
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shadow-sm hidden sm:block">
          <Scale className="w-6 h-6 text-[#0A2947]" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Jurnal Penyesuaian Stok
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Audit trail historis eksekusi perubahan saldo inventaris.
          </p>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-4 sm:p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={adjustmentList}
          loading={isLoading}
          emptyMessage="Belum ada riwayat penyesuaian stok."
          searchKey="nomorAdjustment"
          searchPlaceholder="Cari nomor jurnal..."
        />
      </div>
    </div>
  );
}