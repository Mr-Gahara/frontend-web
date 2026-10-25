"use client";

import { Suspense, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { useDebounce } from "@/hooks/use-debounce";
import { useTabUrl } from "@/hooks/use-tab-url";
import type { StatusTransfer, TransferStok } from "@/types/transferStok";
import { useDaftarTransferStok } from "./hooks";
import { filterServerTransfer, saringTransfer, type TabTransfer } from "./filter";
import { LABEL_STATUS_TRANSFER, LABEL_TAB_TRANSFER, SLUG_TAB_TRANSFER, TAB_TRANSFER } from "./tampilan";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Send,
  MoreHorizontal,
} from "lucide-react";

/** Pilihan baris per halaman (DataTable opt-in, keputusan TB11a). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (status: StatusTransfer) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-none font-bold">
          <Clock className="w-3 h-3 mr-1" /> {LABEL_STATUS_TRANSFER.PENDING}
        </Badge>
      );
    case "DIKIRIM":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold">
          <Send className="w-3 h-3 mr-1" /> {LABEL_STATUS_TRANSFER.DIKIRIM}
        </Badge>
      );
    case "DITERIMA":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {LABEL_STATUS_TRANSFER.DITERIMA}
        </Badge>
      );
    case "BATAL":
      return (
        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none font-bold">
          <XCircle className="w-3 h-3 mr-1" /> {LABEL_STATUS_TRANSFER.BATAL}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

/**
 * Daftar surat jalan di ruang gudang. Tab disaring server lewat query status
 * (kontrak/temuan.md butir 33).
 */
function IsiDaftarTransfer() {
  const router = useRouter();

  // --- States ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  // Tab dari ?tab= (lib/tab-url.ts), misalnya tautan "Kirim sekarang" dari dashboard gudang.
  const [activeTab, setActiveTab] = useTabUrl<TabTransfer>(SLUG_TAB_TRANSFER, TAB_TRANSFER, "ALL");

  // --- Queries ---
  // Status disaring server; pencarian disaring di klien lewat saringTransfer
  // (nomor atau nama outlet tujuan). Hanya surat jalan berasal Gudang: surat
  // jalan pengembalian dikirim dan dibatalkan dari ruang outlet (P8, AR2a).
  const kriteria = { status: activeTab, asal: { tipeLokasi: "Gudang" }, cari: debouncedSearch };
  const {
    data: daftarTransfer = [],
    isLoading,
    isError,
  } = useDaftarTransferStok(filterServerTransfer(kriteria));
  const filteredData = saringTransfer(daftarTransfer, kriteria);

  // Aksi baris di menu titik tiga (TB7a): seluruh status membuka halaman detail.
  const kolom = useMemo<ColumnDef<TransferStok>[]>(
    () => [
      {
        id: "info",
        header: "Informasi Surat Jalan",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold font-mono text-navy">{row.original.nomorTransfer}</span>
            <span className="text-xs font-medium text-navy/50 mt-1">
              {formatTanggal(row.original.createdAt)}
            </span>
          </div>
        ),
      },
      {
        id: "tujuan",
        header: "Tujuan Pengiriman",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-navy">
              {row.original.keLokasi?.nama || "Outlet Tidak Dikenal"}
            </span>
            <span className="text-xs font-medium text-navy/50 mt-1 capitalize">
              Terkait: {row.original.pengajuanStokID ? "Pengajuan Stok" : "Transfer Manual"}
            </span>
          </div>
        ),
      },
      {
        id: "item",
        header: "Jumlah Item",
        cell: ({ row }) => (
          <span className="font-bold text-navy bg-navy/5 px-3 py-1 rounded-lg">
            {row.original.items?.length || 0} Macam
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gading border-navy/10">
                <DropdownMenuItem
                  className="cursor-pointer font-bold text-navy/80"
                  onClick={() => router.push(`/dashboard/gudang/transferStok/${row.original.id}`)}
                >
                  Lihat detail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            <Truck className="w-6 h-6 text-karamel" /> Surat Jalan (Transfer
            Stok)
          </h1>
          <p className="text-sm font-medium text-navy/60">
            Pantau dan kelola pengiriman fisik barang dari Gudang Pusat ke
            Outlet.
          </p>
        </div>
      </div>

      {/* FILTER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 pb-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {TAB_TRANSFER.map(
            (tab) => (
              <Button
                key={tab}
                variant="ghost"
                size="sm"
                aria-pressed={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 font-bold transition-all text-xs ${
                  activeTab === tab
                    ? "bg-navy text-white hover:bg-navy/90"
                    : "text-navy/60 hover:text-navy hover:bg-navy/5"
                }`}
              >
                {LABEL_TAB_TRANSFER[tab]}
              </Button>
            ),
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            placeholder="Cari No. Transfer / Outlet Tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-navy/20 text-navy focus-visible:ring-navy"
          />
        </div>
      </div>

      {/* TABEL: DataTable, kartu per baris (TB1a sampai TB7a) */}
      {isError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat surat jalan. Periksa koneksi, lalu muat ulang halaman.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredData}
          loading={isLoading}
          emptyMessage="Tidak ada dokumen Surat Jalan yang ditemukan."
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}
    </div>
  );
}

/** useSearchParams membutuhkan batas Suspense agar halaman tetap dapat dirender statis. */
export default function HalamanDaftarTransfer() {
  return (
    <Suspense fallback={null}>
      <IsiDaftarTransfer />
    </Suspense>
  );
}
