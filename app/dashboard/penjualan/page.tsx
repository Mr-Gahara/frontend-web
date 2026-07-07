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

const badgeStatusBayar = (status: StatusBayar) => {
  const map: Record<
    StatusBayar,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    PAID: { label: "Lunas", variant: "default" },
    UNPAID: { label: "Belum Bayar", variant: "destructive" },
    PARTIAL: { label: "Sebagian", variant: "secondary" },
  };
  const { label, variant } = map[status] ?? {
    label: status,
    variant: "outline",
  };
  return <Badge variant={variant}>{label}</Badge>;
};

const badgeStatusPenjualan = (status: StatusPenjualan) => {
  const map: Record<StatusPenjualan, { label: string; className: string }> = {
    FINAL: {
      label: "Final",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    DRAFT: {
      label: "Draft",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    VOID: {
      label: "Void",
      className: "bg-gray-100 text-gray-500 border-gray-200",
    },
  };
  const { label, className } = map[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={className}>
      {label}
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
      params.set(key, value);
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
  const [appliedFilters, setAppliedFilters] =
    useState<PenjualanFilterParams>(emptyFilter);
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
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. Referensi
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium font-mono text-xs sm:text-sm">
            {row.original.noReferensi}
          </span>
        ),
      },
      {
        accessorKey: "tanggalTransaksi",
        // Kolom tanggal disembunyikan di layar kecil (<sm), muncul di sm keatas
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent cursor-pointer hidden sm:flex"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs sm:text-sm hidden sm:inline">
            {formatTanggal(row.original.tanggalTransaksi)}
          </span>
        ),
      },
      {
        accessorKey: "dataPelanggan",
        // Kolom pelanggan disembunyikan di hp, muncul di md keatas
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground hidden md:inline">
            Pelanggan
          </span>
        ),
        cell: ({ row }) => (
          <span className="hidden md:inline text-sm">
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
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-xs sm:text-sm">
            {formatRupiah(row.original.totalTagihan)}
          </span>
        ),
      },
      {
        accessorKey: "statusBayar",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Bayar
          </span>
        ),
        cell: ({ row }) => {
          if (row.original.statusPenjualan === "VOID") {
            return (
              <Badge
                variant="outline"
                className="bg-slate-100 text-slate-500 border-slate-200 text-xs"
              >
                Batal
              </Badge>
            );
          }
          return badgeStatusBayar(row.original.statusBayar);
        },
      },
      {
        accessorKey: "statusPenjualan",
        // Kolom status disembunyikan di hp kecil
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
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
        header: () => <div className="text-right text-xs">Aksi</div>,
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
                    className="h-8 w-8 cursor-pointer"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="cursor-pointer font-medium"
                    onClick={() =>
                      router.push(`/dashboard/penjualan/${targetId}`)
                    }
                  >
                    Lihat Detail
                  </DropdownMenuItem>

                  {isDraft && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 font-medium"
                        onClick={() =>
                          router.push(
                            `/dashboard/penjualan/${targetId}/pembayaran`,
                          )
                        }
                      >
                        Terima Penjualan (Bayar)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50 font-medium"
                        onClick={() => setVoidTarget(row.original)}
                      >
                        Void Penjualan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
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
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            Data Penjualan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Kelola invoice penjualan dan pantau status pembayaran.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Tombol filter toggle — muncul di semua ukuran, filter panel di bawah */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
            className="cursor-pointer gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button
            onClick={() => router.push("/dashboard/penjualan/buatPenjualan")}
            size="sm"
            className="cursor-pointer gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buat Penjualan</span>
            <span className="sm:hidden">Buat</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar — collapsible di mobile */}
      {showFilter && (
        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            {/* Baris 1: Search full width */}
            <Input
              placeholder="Cari no. referensi..."
              value={filters.noReferensi ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, noReferensi: e.target.value })
              }
            />

            {/* Baris 2: 2 kolom sama rata */}
            <div className="grid grid-cols-2 gap-2">
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
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Status bayar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="cursor-pointer">
                    Semua Status Bayar
                  </SelectItem>
                  <SelectItem value="UNPAID" className="cursor-pointer">
                    Belum Bayar
                  </SelectItem>
                  <SelectItem value="PAID" className="cursor-pointer">
                    Lunas
                  </SelectItem>
                  <SelectItem value="PARTIAL" className="cursor-pointer">
                    Sebagian
                  </SelectItem>
                </SelectContent>
              </Select>

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
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Status penjualan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="cursor-pointer">
                    Semua Status
                  </SelectItem>
                  <SelectItem value="DRAFT" className="cursor-pointer">
                    Draft
                  </SelectItem>
                  <SelectItem value="FINAL" className="cursor-pointer">
                    Final
                  </SelectItem>
                  <SelectItem value="VOID" className="cursor-pointer">
                    Void
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Baris 3: 2 kolom sama rata */}
            <div className="grid grid-cols-2 gap-2">
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
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Jenis transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="cursor-pointer">
                    Semua Transaksi
                  </SelectItem>
                  <SelectItem value="POS" className="cursor-pointer">
                    POS
                  </SelectItem>
                  <SelectItem value="INVOICE" className="cursor-pointer">
                    Invoice
                  </SelectItem>
                </SelectContent>
              </Select>

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
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Jenis penjualan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="cursor-pointer">
                    Semua Jenis
                  </SelectItem>
                  <SelectItem value="dine-in" className="cursor-pointer">
                    Dine-in
                  </SelectItem>
                  <SelectItem value="takeaway" className="cursor-pointer">
                    Takeaway
                  </SelectItem>
                  <SelectItem value="booking" className="cursor-pointer">
                    Booking
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Baris 4: 2 kolom tanggal */}
            <div className="flex flex-col gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Dari Tanggal
                </label>
                <Input
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Sampai Tanggal
                </label>
                <Input
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Baris 5: Tombol full width */}
            <div className="flex gap-3">
              <Button
                onClick={handleApplyFilter}
                className="flex-1 cursor-pointer"
              >
                Terapkan
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetFilter}
                className="cursor-pointer shrink-0"
                title="Reset filter"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="w-full overflow-x-auto rounded-xl">
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
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Void Penjualan {voidTarget?.noReferensi}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan membatalkan transaksi secara permanen (menjadi
              VOID) dan membatalkan sesi <i>booking</i> (jika ada). Jika
              transaksi ini sudah ada pembayarannya, Anda harus melakukan void
              pada data pembayarannya terlebih dahulu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={updateStatusMutation.isPending}
              className="cursor-pointer w-full sm:w-auto"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoid}
              disabled={updateStatusMutation.isPending}
              className="cursor-pointer bg-orange-600 hover:bg-orange-700 focus:ring-orange-600 w-full sm:w-auto"
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
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus penjualan {deleteTarget?.noReferensi}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data penjualan secara permanen.
              Penjualan hanya dapat dihapus jika masih berstatus Draft. Apakah
              Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="cursor-pointer w-full sm:w-auto">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 hover:bg-red-700 focus:ring-red-600 w-full sm:w-auto"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
