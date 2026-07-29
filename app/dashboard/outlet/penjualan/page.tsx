"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  Penjualan,
  GetPenjualanResponse,
  PenjualanFilterParams,
  StatusBayar,
  StatusPenjualan,
  JenisTransaksi,
  JenisPenjualan,
} from "@/types/penjualan";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  ReceiptText,
} from "lucide-react";

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);

const formatTanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// --- BADGE MAPPING DENGAN PALET TETRADIC ---
const badgeStatusBayar = (status: StatusBayar) => {
  const styles: Record<StatusBayar, string> = {
    PAID: "bg-[#718355] text-[#FFFAF3] border-none",      // Sage Green
    UNPAID: "bg-[#D4A373] text-[#0A2947] border-none",    // Mustard
    PARTIAL: "bg-[#0A2947]/10 text-[#0A2947] border-none",// Navy Muted
  };
  const labels: Record<StatusBayar, string> = { 
    PAID: "Lunas", 
    UNPAID: "Belum Bayar", 
    PARTIAL: "Sebagian" 
  };
  
  return (
    <Badge className={`${styles[status] || "bg-muted"} px-2.5 py-0.5 font-bold shadow-sm`}>
      {labels[status] || status}
    </Badge>
  );
};

const badgeStatusPenjualan = (status: StatusPenjualan) => {
  const styles: Record<StatusPenjualan, string> = {
    FINAL: "bg-[#718355] text-[#FFFAF3] border-none", // Sage Green
    DRAFT: "bg-[#D4A373] text-[#0A2947] border-none", // Mustard
    VOID: "bg-[#0A2947]/10 text-[#0A2947]/60 border-none", // Navy Muted
  };
  const labels: Record<StatusPenjualan, string> = { 
    FINAL: "Final", 
    DRAFT: "Draft", 
    VOID: "Void" 
  };

  return (
    <Badge className={`${styles[status] || "bg-muted"} px-2.5 py-0.5 font-bold shadow-sm`}>
      {labels[status] || status}
    </Badge>
  );
};

const emptyFilter: PenjualanFilterParams = {
  statusBayar: undefined,
  statusPenjualan: undefined,
  jenisTransaksi: undefined,
  jenisPenjualan: undefined,
  pelangganID: "",
  startDate: "",
  endDate: "",
  noReferensi: "",
};

function buildQueryString(filters: PenjualanFilterParams): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, value as string);
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default function PenjualanPage() {
  useAuthGuard();

  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<PenjualanFilterParams>(emptyFilter);
  const [appliedFilters, setAppliedFilters] = useState<PenjualanFilterParams>(emptyFilter);
  const [showFilter, setShowFilter] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Penjualan | null>(null);
  const [voidTarget, setVoidTarget] = useState<Penjualan | null>(null);

  const {
    data: penjualanList = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [...queryKeys.penjualan, appliedFilters],
    queryFn: async () => {
      const qs = buildQueryString(appliedFilters);
      const res = await apiClient.get<GetPenjualanResponse>(
        `/penjualan${qs}`,
        undefined,
        "pengguna",
      );
      return res.data;
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Gagal", {
        description:
          error instanceof Error
            ? error.message
            : "Gagal memuat data penjualan.",
      });
    }
  }, [error]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/penjualan/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Penjualan berhasil dihapus." });
      queryClient.invalidateQueries({ queryKey: queryKeys.penjualan });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Menghapus", {
        description: err.message || "Gagal menghapus penjualan.",
      });
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget._id || (deleteTarget as any).id;
    await deleteMutation.mutateAsync(targetId);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.put(
        `/penjualan/${id}`,
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Penjualan berhasil di-void." });
      queryClient.invalidateQueries({ queryKey: queryKeys.penjualan });
      setVoidTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses", {
        description: err.message || "Gagal melakukan void penjualan.",
      });
    },
  });

  const handleVoid = async () => {
    if (!voidTarget) return;
    const targetId = voidTarget._id || (voidTarget as any).id;
    await updateStatusMutation.mutateAsync({
      id: targetId,
      payload: { statusPenjualan: "VOID" },
    });
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filters });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilters(emptyFilter);
    setAppliedFilters(emptyFilter);
  };

  const columns = useMemo<ColumnDef<Penjualan>[]>(
    () => [
      {
        accessorKey: "noReferensi",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. Referensi
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold font-mono text-[#0A2947] text-xs sm:text-sm">
            {row.original.noReferensi}
          </span>
        ),
      },
      {
        accessorKey: "tanggalTransaksi",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer hidden sm:flex"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs sm:text-sm font-medium text-[#0A2947]/70 hidden sm:inline">
            {formatTanggal(row.original.tanggalTransaksi)}
          </span>
        ),
      },
      {
        accessorKey: "dataPelanggan",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60 hidden md:inline">
            Pelanggan
          </span>
        ),
        cell: ({ row }) => (
          <span className="hidden md:inline text-sm font-medium text-[#0A2947]/80 capitalize">
            {row.original.dataPelanggan?.namaPelanggan ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "totalTagihan",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-[#0A2947] text-xs sm:text-sm font-mono">
            {formatRupiah(row.original.totalTagihan)}
          </span>
        ),
      },
      {
        accessorKey: "statusBayar",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60">
            Bayar
          </span>
        ),
        cell: ({ row }) => {
          if (row.original.statusPenjualan === "VOID") {
            return (
              <Badge className="bg-[#0A2947]/10 text-[#0A2947]/60 border-none font-bold shadow-sm px-2.5 py-0.5">
                Batal
              </Badge>
            );
          }
          return badgeStatusBayar(row.original.statusBayar);
        },
      },
      {
        accessorKey: "statusPenjualan",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60 hidden sm:inline">
            Status
          </span>
        ),
        cell: ({ row }) => (
          <span className="hidden sm:inline">
            {badgeStatusPenjualan(row.original.statusPenjualan)}
          </span>
        ),
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-xs font-bold text-[#0A2947]/60">Aksi</div>,
        cell: ({ row }) => {
          const isDraft = row.original.statusPenjualan === "DRAFT";
          const targetId = row.original._id || (row.original as any).id;

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#FFFAF3] border-[#0A2947]/10">
                  <DropdownMenuItem
                    className="cursor-pointer font-bold text-[#0A2947] hover:bg-[#0A2947]/5"
                    onClick={() =>
                      router.push(`/dashboard/outlet/penjualan/${targetId}`)
                    }
                  >
                    Lihat Detail
                  </DropdownMenuItem>

                  {isDraft && (
                    <>
                      <DropdownMenuSeparator className="bg-[#0A2947]/10" />
                      <DropdownMenuItem
                        className="cursor-pointer text-[#718355] focus:text-[#718355] focus:bg-[#718355]/10 font-bold"
                        onClick={() =>
                          router.push(
                            `/dashboard/outlet/penjualan/${targetId}/pembayaran`,
                          )
                        }
                      >
                        Terima Penjualan
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-[#D4A373] focus:text-[#D4A373] focus:bg-[#D4A373]/10 font-bold"
                        onClick={() => setVoidTarget(row.original)}
                      >
                        Void Penjualan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#0A2947]/10" />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
                        onClick={() => setDeleteTarget(row.original)}
                      >
                        Hapus Permanen
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-6 px-2 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shadow-sm hidden sm:block">
            <ReceiptText className="w-6 h-6 text-[#0A2947]" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A2947] truncate">
              Data Penjualan
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#0A2947]/60 hidden sm:block">
              Kelola invoice penjualan dan pantau status pembayaran.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
            className="cursor-pointer gap-1.5 border-[#0A2947]/20 font-bold text-[#0A2947] hover:bg-[#0A2947]/5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button
            onClick={() => router.push("/dashboard/outlet/penjualan/buatPenjualan")}
            size="sm"
            className="cursor-pointer gap-1.5 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buat Penjualan</span>
            <span className="sm:hidden">Buat</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar (DIKEMBALIKAN UTUH 100%) */}
      {showFilter && (
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Baris 1: Search full width */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0A2947]">Cari Nomor Invoice</label>
              <Input
                placeholder="Masukkan no. referensi..."
                value={filters.noReferensi ?? ""}
                onChange={(e) =>
                  setFilters({ ...filters, noReferensi: e.target.value })
                }
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/40"
              />
            </div>

            {/* Baris 2: 2 kolom Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]">Status Bayar</label>
                <Select
                  value={filters.statusBayar ?? "ALL"}
                  onValueChange={(val) =>
                    setFilters({
                      ...filters,
                      statusBayar:
                        val === "ALL" ? undefined : (val as StatusBayar),
                    })
                  }
                >
                  <SelectTrigger className="cursor-pointer w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]">
                    <SelectValue placeholder="Status bayar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="ALL" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Semua Status Bayar</SelectItem>
                    <SelectItem value="UNPAID" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Belum Bayar</SelectItem>
                    <SelectItem value="PAID" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Lunas</SelectItem>
                    <SelectItem value="PARTIAL" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Sebagian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]">Status Transaksi</label>
                <Select
                  value={filters.statusPenjualan ?? "ALL"}
                  onValueChange={(val) =>
                    setFilters({
                      ...filters,
                      statusPenjualan:
                        val === "ALL" ? undefined : (val as StatusPenjualan),
                    })
                  }
                >
                  <SelectTrigger className="cursor-pointer w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]">
                    <SelectValue placeholder="Status penjualan" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="ALL" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Semua Status</SelectItem>
                    <SelectItem value="DRAFT" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Draft</SelectItem>
                    <SelectItem value="FINAL" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Final</SelectItem>
                    <SelectItem value="VOID" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Void</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Baris 3: 2 kolom Jenis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]">Tipe Transaksi</label>
                <Select
                  value={filters.jenisTransaksi ?? "ALL"}
                  onValueChange={(val) =>
                    setFilters({
                      ...filters,
                      jenisTransaksi:
                        val === "ALL" ? undefined : (val as JenisTransaksi),
                    })
                  }
                >
                  <SelectTrigger className="cursor-pointer w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]">
                    <SelectValue placeholder="Jenis transaksi" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="ALL" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Semua Transaksi</SelectItem>
                    <SelectItem value="POS" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">POS Kasir</SelectItem>
                    <SelectItem value="INVOICE" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Invoice Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]">Metode Penjualan</label>
                <Select
                  value={filters.jenisPenjualan ?? "ALL"}
                  onValueChange={(val) =>
                    setFilters({
                      ...filters,
                      jenisPenjualan:
                        val === "ALL" ? undefined : (val as JenisPenjualan),
                    })
                  }
                >
                  <SelectTrigger className="cursor-pointer w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]">
                    <SelectValue placeholder="Jenis penjualan" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="ALL" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Semua Jenis</SelectItem>
                    <SelectItem value="dine-in" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Dine-in</SelectItem>
                    <SelectItem value="takeaway" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Takeaway</SelectItem>
                    <SelectItem value="booking" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Booking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Baris 4: 2 kolom tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]">
                  Dari Tanggal
                </label>
                <Input
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]">
                  Sampai Tanggal
                </label>
                <Input
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]"
                />
              </div>
            </div>

            {/* Baris 5: Tombol Aksi */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleApplyFilter}
                className="flex-1 cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm"
              >
                Terapkan Pencarian
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetFilter}
                className="cursor-pointer shrink-0 border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5"
                title="Reset filter"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-4 sm:p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={penjualanList}
          loading={isLoading}
          emptyMessage="Belum ada data penjualan."
          searchKey="noReferensi"
          searchPlaceholder="Cari no. referensi..."
        />
      </div>

      {/* DIALOG VOID */}
      <AlertDialog
        open={!!voidTarget}
        onOpenChange={(open) => {
          if (!open) setVoidTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10 max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Void Penjualan {voidTarget?.noReferensi}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Tindakan ini akan membatalkan transaksi secara permanen (menjadi
              VOID) dan membatalkan sesi <i>booking</i> (jika ada). Jika
              transaksi ini sudah ada pembayarannya, Anda harus melakukan void
              pada data pembayarannya terlebih dahulu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={updateStatusMutation.isPending}
              className="cursor-pointer w-full sm:w-auto border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoid}
              disabled={updateStatusMutation.isPending}
              className="cursor-pointer bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold w-full sm:w-auto"
            >
              {updateStatusMutation.isPending
                ? "Memproses..."
                : "Ya, Void Penjualan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG HAPUS */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10 max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Hapus penjualan {deleteTarget?.noReferensi}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Tindakan ini akan menghapus data penjualan secara permanen.
              Penjualan hanya dapat dihapus jika masih berstatus Draft. Apakah
              Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="cursor-pointer w-full sm:w-auto border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold w-full sm:w-auto"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}