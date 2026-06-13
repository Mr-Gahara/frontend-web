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
import { ArrowUpDown, MoreHorizontal, Plus, RotateCcw } from "lucide-react";

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
  const [deleteTarget, setDeleteTarget] = useState<Penjualan | null>(null);

  // QUERY PENJUALAN
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

  // ERROR TOAST
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

  // MUTATION DELETE
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/penjualan/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Penjualan berhasil dihapus.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.penjualan });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus penjualan.",
      });
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filters });
  };

  const handleResetFilter = () => {
    setFilters(emptyFilter);
    setAppliedFilters(emptyFilter);
  };

  // TABLE COLUMNS
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
          <span className="font-medium font-mono text-sm">
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
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {formatTanggal(row.original.tanggalTransaksi)}
          </span>
        ),
      },
      {
        accessorKey: "dataPelanggan",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Pelanggan
          </span>
        ),
        cell: ({ row }) => (
          <span>{row.original.dataPelanggan?.namaPelanggan ?? "-"}</span>
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
            Total Tagihan
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatRupiah(row.original.totalTagihan)}
          </span>
        ),
      },
      {
        accessorKey: "statusBayar",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Status Bayar
          </span>
        ),
        cell: ({ row }) => badgeStatusBayar(row.original.statusBayar),
      },
      {
        accessorKey: "statusPenjualan",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Status
          </span>
        ),
        cell: ({ row }) => badgeStatusPenjualan(row.original.statusPenjualan),
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-xs">Aksi</div>,
        cell: ({ row }) => {
          const isDraft = row.original.statusPenjualan === "DRAFT";
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/penjualan/${row.original._id}`)
                    }
                  >
                    Lihat Detail
                  </DropdownMenuItem>
                  {isDraft && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/dashboard/penjualan/${row.original._id}/edit`,
                          )
                        }
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-500 focus:text-red-500"
                        onClick={() => setDeleteTarget(row.original)}
                      >
                        Hapus
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Data Penjualan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola invoice penjualan dan pantau status pembayaran.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/penjualan/buatPenjualan")}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Buat Penjualan
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* No Referensi */}
          <Input
            placeholder="Cari no. referensi..."
            value={filters.noReferensi ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, noReferensi: e.target.value })
            }
          />

          {/* Status Bayar */}
          <Select
            value={filters.statusBayar ?? "ALL"}
            onValueChange={(val) =>
              setFilters({
                ...filters,
                statusBayar: val === "ALL" ? undefined : (val as StatusBayar),
              })
            }
          >
            <SelectTrigger className="cursor-pointer">
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

          {/* Status Penjualan */}
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
            <SelectTrigger className="cursor-pointer">
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

          {/* Jenis Transaksi */}
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
            <SelectTrigger className="cursor-pointer">
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

          {/* Jenis Penjualan */}
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
            <SelectTrigger className="cursor-pointer">
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

          {/* Start Date */}
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

          {/* End Date */}
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

          {/* Aksi Filter */}
          <div className="flex items-end gap-2">
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
              className="cursor-pointer"
              title="Reset filter"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="w-full">
        <DataTable
          columns={columns}
          data={penjualanList}
          loading={isLoading}
          emptyMessage="Belum ada data penjualan."
          searchKey="noReferensi"
          searchPlaceholder="Cari no. referensi..."
        />
      </div>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
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
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
