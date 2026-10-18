"use client";

import { PilihTanggal } from "@/components/pilih-tanggal";
import { dariTanggalLokal, keTanggalLokal } from "@/lib/waktu";

import { useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { pesanError } from "@/lib/api/error";
import { useDaftarPenjualan, useHapusPenjualan, useVoidPenjualan } from "./hooks";
import {
  PILIHAN_UKURAN_HALAMAN,
  paramLingkupPenjualan,
  UKURAN_HALAMAN_BAWAAN,
  type LingkupPenjualan,
  type UkuranHalaman,
} from "./filter";
import { aksiPenjualan } from "./izin";
import { DialogVoidPenjualan } from "./dialog-void-penjualan";
import { TAMPILAN_STATUS_PENJUALAN, URUTAN_STATUS_PENJUALAN } from "./tampilan";
import { useSession } from "@/lib/auth/useSession";
import {
  Penjualan,
  PenjualanFilterParams,
  StatusPenjualan,
  JenisTransaksi,
  JenisPenjualan,
} from "@/types/penjualan";
import { ColumnDef, type SortingState } from "@tanstack/react-table";
import { KepalaUrut } from "@/components/ui/kepala-urut";
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
  MoreHorizontal,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  ReceiptText,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

const formatTanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// --- BADGE STATUS (satu status sejak backend 465b438) ---
const badgeStatus = (status: StatusPenjualan) => {
  const tampilan = TAMPILAN_STATUS_PENJUALAN[status];
  return (
    <Badge className={`${tampilan?.kelas ?? "bg-muted"} px-2.5 py-0.5 font-bold shadow-sm`}>
      {tampilan?.label ?? status}
    </Badge>
  );
};

const emptyFilter: PenjualanFilterParams = {
  statusPenjualan: undefined,
  jenisTransaksi: undefined,
  jenisPenjualan: undefined,
  pelangganID: "",
  startDate: "",
  endDate: "",
  noReferensi: "",
};

interface PropsHalamanDaftarPenjualan {
  /** Lingkup outlet dari halaman; null berarti sesi atau lokasi belum siap. */
  lingkup: LingkupPenjualan | null;
  /** Pengganti tabel bila lokasi gagal dimuat atau belum dikonfigurasi. */
  penghalang?: ReactNode;
  /** Pemilih outlet bagi pemegang izin lintas outlet. */
  pemilihLokasi?: ReactNode;
}

export default function HalamanDaftarPenjualan({
  lingkup,
  penghalang,
  pemilihLokasi,
}: PropsHalamanDaftarPenjualan) {
  const router = useRouter();
  const { permissions } = useSession();

  const [filters, setFilters] = useState<PenjualanFilterParams>(emptyFilter);
  const [appliedFilters, setAppliedFilters] = useState<PenjualanFilterParams>(emptyFilter);
  const [halaman, setHalaman] = useState(1);
  const [ukuranHalaman, setUkuranHalaman] = useState<UkuranHalaman>(UKURAN_HALAMAN_BAWAAN);
  // Urutan per kolom diterapkan server (keputusan PB14a, backend yoga).
  const [urutan, setUrutan] = useState<SortingState>([]);
  const [showFilter, setShowFilter] = useState(false);
  // Mengganti outlet kembali ke halaman 1, seperti mengganti jumlah baris dan
  // urutan; filter dan urutan dipertahankan (keputusan LP1a). Disesuaikan saat
  // render, bukan lewat effect, agar halaman lama tidak sempat diminta untuk
  // lingkup baru.
  const kunciLingkup = lingkup?.jenis === "lokasi" ? lingkup.locationID : (lingkup?.jenis ?? "");
  const [lingkupTerakhir, setLingkupTerakhir] = useState(kunciLingkup);
  if (lingkupTerakhir !== kunciLingkup) {
    setLingkupTerakhir(kunciLingkup);
    setHalaman(1);
  }

  const [deleteTarget, setDeleteTarget] = useState<Penjualan | null>(null);
  const [voidTarget, setVoidTarget] = useState<Penjualan | null>(null);

  const daftar = useDaftarPenjualan(
    appliedFilters,
    halaman,
    ukuranHalaman,
    lingkup !== null && !penghalang,
    urutan,
    paramLingkupPenjualan(lingkup),
  );
  // Lingkup outlet disaring server lewat locationID (keputusan RG4a), sehingga
  // baris, jumlah halaman, dan total data sama-sama berasal dari lingkup itu.
  const penjualanList = useMemo(
    () => (lingkup ? (daftar.data?.data ?? []) : []),
    [daftar.data, lingkup],
  );

  // Dialog hapus dan void hanya tertutup saat berhasil; saat gagal tetap
  // terbuka beserta pesannya (keputusan Fase 0).
  const deleteMutation = useHapusPenjualan({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Penjualan berhasil dihapus." });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error("Gagal Menghapus", {
        description: pesanError(err, "Gagal menghapus penjualan."),
      });
    },
  });

  const handleDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  };

  const updateStatusMutation = useVoidPenjualan({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Penjualan berhasil di-void." });
      setVoidTarget(null);
    },
    onError: (err) => {
      toast.error("Gagal Memproses", {
        description: pesanError(err, "Gagal melakukan void penjualan."),
      });
    },
  });

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filters });
    setHalaman(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilters(emptyFilter);
    setAppliedFilters(emptyFilter);
    setHalaman(1);
  };

  const columns = useMemo<ColumnDef<Penjualan>[]>(
    () => [
      {
        accessorKey: "noReferensi",
        header: ({ column }) => <KepalaUrut column={column} judul="No. Referensi" />,
        cell: ({ row }) => (
          <span className="font-bold font-mono text-navy text-xs sm:text-sm">
            {row.original.noReferensi}
          </span>
        ),
      },
      {
        accessorKey: "tanggalTransaksi",
        header: ({ column }) => <KepalaUrut column={column} judul="Tanggal" className="hidden sm:inline-flex" />,
        cell: ({ row }) => (
          <span className="text-xs sm:text-sm font-medium text-navy/70 hidden sm:inline">
            {formatTanggal(row.original.tanggalTransaksi)}
          </span>
        ),
      },
      {
        accessorKey: "dataPelanggan",
        header: () => (
          <span className="text-xs font-bold text-navy/60 hidden md:inline">
            Pelanggan
          </span>
        ),
        cell: ({ row }) => (
          <span className="hidden md:inline text-sm font-medium text-navy/80 capitalize">
            {row.original.dataPelanggan?.namaPelanggan ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "totalTagihan",
        header: ({ column }) => <KepalaUrut column={column} judul="Total" />,
        cell: ({ row }) => (
          <span className="font-bold text-navy text-xs sm:text-sm font-mono">
            {formatRupiah(row.original.totalTagihan)}
          </span>
        ),
      },
      {
        accessorKey: "statusPenjualan",
        header: () => (
          <span className="text-xs font-bold text-navy/60">
            Status
          </span>
        ),
        cell: ({ row }) => badgeStatus(row.original.statusPenjualan),
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-xs font-bold text-navy/60">Aksi</div>,
        cell: ({ row }) => {
          const aksi = aksiPenjualan(row.original, permissions);
          const targetId = row.original.id;

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-gading border-navy/10">
                  <DropdownMenuItem
                    className="cursor-pointer font-bold text-navy hover:bg-navy/5"
                    onClick={() =>
                      router.push(`/dashboard/outlet/penjualan/${targetId}`)
                    }
                  >
                    Lihat Detail
                  </DropdownMenuItem>

                  {aksi.bayar && (
                    <>
                      <DropdownMenuSeparator className="bg-navy/10" />
                      <DropdownMenuItem
                        className="cursor-pointer text-sage focus:text-sage focus:bg-sage/10 font-bold"
                        onClick={() =>
                          router.push(
                            `/dashboard/outlet/penjualan/${targetId}/pembayaran`,
                          )
                        }
                      >
                        Terima Pembayaran
                      </DropdownMenuItem>
                    </>
                  )}
                  {aksi.void && (
                    <>
                      <DropdownMenuSeparator className="bg-navy/10" />
                      <DropdownMenuItem
                        className="cursor-pointer text-karamel focus:text-karamel focus:bg-karamel/10 font-bold"
                        onClick={() => setVoidTarget(row.original)}
                      >
                        Void Penjualan
                      </DropdownMenuItem>
                    </>
                  )}
                  {aksi.hapus && (
                    <>
                      <DropdownMenuSeparator className="bg-navy/10" />
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
    [router, permissions],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-6 px-2 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shadow-sm hidden sm:block">
            <ReceiptText className="w-6 h-6 text-navy" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy truncate">
              Data Penjualan
            </h1>
            <p className="text-xs sm:text-sm font-medium text-navy/60 hidden sm:block">
              Kelola invoice penjualan dan pantau status pembayaran.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
            className="cursor-pointer gap-1.5 border-navy/20 font-bold text-navy hover:bg-navy/5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button
            onClick={() => router.push("/dashboard/outlet/penjualan/buatPenjualan")}
            size="sm"
            className="cursor-pointer gap-1.5 bg-navy text-gading hover:bg-navy/90 font-bold shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buat Penjualan</span>
            <span className="sm:hidden">Buat</span>
          </Button>
        </div>
      </div>

      {pemilihLokasi}
      {/* Filter Bar (DIKEMBALIKAN UTUH 100%) */}
      {showFilter && (
        <div className="rounded-2xl border border-navy/10 bg-krem p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Baris 1: Search full width */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy">Cari Nomor Invoice</label>
              <Input
                placeholder="Masukkan no. referensi..."
                value={filters.noReferensi ?? ""}
                onChange={(e) =>
                  setFilters({ ...filters, noReferensi: e.target.value })
                }
                className="bg-gading border-navy/20 text-navy placeholder:text-navy/40"
              />
            </div>

            {/* Baris 2: Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy">Status</label>
              <Select
                value={filters.statusPenjualan ?? "ALL"}
                onValueChange={(val) =>
                  setFilters({
                    ...filters,
                    statusPenjualan: val === "ALL" ? undefined : (val as StatusPenjualan),
                  })
                }
              >
                <SelectTrigger className="cursor-pointer w-full bg-gading border-navy/20 text-navy">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gading border-navy/10 text-navy">
                  <SelectItem value="ALL" className="cursor-pointer font-medium hover:bg-navy/5">Semua Status</SelectItem>
                  {URUTAN_STATUS_PENJUALAN.map((status) => (
                    <SelectItem key={status} value={status} className="cursor-pointer font-medium hover:bg-navy/5">
                      {TAMPILAN_STATUS_PENJUALAN[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Baris 3: 2 kolom Jenis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy">Tipe Transaksi</label>
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
                  <SelectTrigger className="cursor-pointer w-full bg-gading border-navy/20 text-navy">
                    <SelectValue placeholder="Jenis transaksi" />
                  </SelectTrigger>
                  <SelectContent className="bg-gading border-navy/10 text-navy">
                    <SelectItem value="ALL" className="cursor-pointer font-medium hover:bg-navy/5">Semua Transaksi</SelectItem>
                    <SelectItem value="POS" className="cursor-pointer font-medium hover:bg-navy/5">POS Kasir</SelectItem>
                    <SelectItem value="INVOICE" className="cursor-pointer font-medium hover:bg-navy/5">Invoice Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy">Metode Penjualan</label>
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
                  <SelectTrigger className="cursor-pointer w-full bg-gading border-navy/20 text-navy">
                    <SelectValue placeholder="Jenis penjualan" />
                  </SelectTrigger>
                  <SelectContent className="bg-gading border-navy/10 text-navy">
                    <SelectItem value="ALL" className="cursor-pointer font-medium hover:bg-navy/5">Semua Jenis</SelectItem>
                    <SelectItem value="dine-in" className="cursor-pointer font-medium hover:bg-navy/5">Dine-in</SelectItem>
                    <SelectItem value="takeaway" className="cursor-pointer font-medium hover:bg-navy/5">Takeaway</SelectItem>
                    <SelectItem value="booking" className="cursor-pointer font-medium hover:bg-navy/5">Booking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Baris 4: 2 kolom tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="filter-dari-tanggal" className="text-xs font-bold text-navy">
                  Dari Tanggal
                </label>
                <PilihTanggal
                  id="filter-dari-tanggal"
                  label="Dari Tanggal"
                  placeholder="Semua tanggal"
                  value={dariTanggalLokal(filters.startDate)}
                  onChange={(tanggal) => setFilters({ ...filters, startDate: keTanggalLokal(tanggal) })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="filter-sampai-tanggal" className="text-xs font-bold text-navy">
                  Sampai Tanggal
                </label>
                <PilihTanggal
                  id="filter-sampai-tanggal"
                  label="Sampai Tanggal"
                  placeholder="Semua tanggal"
                  value={dariTanggalLokal(filters.endDate)}
                  onChange={(tanggal) => setFilters({ ...filters, endDate: keTanggalLokal(tanggal) })}
                  className="h-10"
                />
              </div>
            </div>

            {/* Baris 5: Tombol Aksi */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleApplyFilter}
                className="flex-1 cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold shadow-sm"
              >
                Terapkan Pencarian
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetFilter}
                className="cursor-pointer shrink-0 border-navy/20 text-navy hover:bg-navy/5"
                title="Reset filter"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="w-full">
        {penghalang ? (
          penghalang
        ) : daftar.isError ? (
          <p role="alert" className="py-10 text-center text-sm font-medium text-red-700">
            {pesanError(daftar.error, "Gagal memuat data penjualan.")}
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={penjualanList}
              loading={lingkup === null || daftar.isLoading}
              emptyMessage="Belum ada data penjualan."
              paginasiServer={{
                halaman,
                jumlahHalaman: daftar.data?.pagination?.totalPages ?? 1,
                total: daftar.data?.pagination?.total ?? 0,
                ukuran: ukuranHalaman,
                pilihanUkuran: PILIHAN_UKURAN_HALAMAN,
                sibuk: daftar.isFetching,
                onGantiHalaman: setHalaman,
                onGantiUkuran: (ukuran) => {
                  setUkuranHalaman(ukuran as UkuranHalaman);
                  setHalaman(1);
                },
              }}
              urutanServer={{
                urutan,
                onGantiUrutan: (berikut) => {
                  setUrutan(berikut);
                  setHalaman(1);
                },
              }}
            />
          </>
        )}
      </div>

      {/* DIALOG VOID */}
      <DialogVoidPenjualan
        noReferensi={voidTarget?.noReferensi}
        terbuka={!!voidTarget}
        memproses={updateStatusMutation.isPending}
        onTutup={() => setVoidTarget(null)}
        onKonfirmasi={(alasan) => {
          if (voidTarget) updateStatusMutation.mutate({ id: voidTarget.id, alasan });
        }}
      />

      {/* DIALOG HAPUS */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-gading border-navy/10 max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">
              Hapus penjualan {deleteTarget?.noReferensi}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Tindakan ini akan menghapus data penjualan secara permanen.
              Penjualan hanya dapat dihapus jika masih berstatus Draft. Apakah
              Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="cursor-pointer w-full sm:w-auto border-navy/20 text-navy hover:bg-navy/5 font-bold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
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