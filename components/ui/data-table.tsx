"use client";
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Di HP tiap baris menjadi satu kartu dan selnya tersusun ke bawah
 * (keputusan TB1a). Kelas ber-first dan ber-last menimpa bingkai kartu
 * per sel milik TableCell, yang hanya berlaku di lebar meja.
 */
const KELAS_BARIS_HP =
  "max-sm:relative max-sm:mb-2 max-sm:flex max-sm:flex-col max-sm:gap-1.5 max-sm:rounded-2xl max-sm:border max-sm:border-navy/10 max-sm:bg-[var(--warna-baris,var(--permukaan))] max-sm:p-3";
const KELAS_SEL_HP =
  "max-sm:block max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:whitespace-normal max-sm:first:border-l-0 max-sm:first:rounded-none max-sm:first:pr-10 max-sm:first:text-base max-sm:first:font-bold max-sm:last:border-r-0 max-sm:last:rounded-none";
const KELAS_AKSI_HP = "max-sm:absolute max-sm:right-2 max-sm:top-2";

/** Label kecil sel di HP: meta.label kolom, atau header bila berupa teks. */
function labelKolom(kolom: { meta?: unknown; header?: unknown }): string | null {
  const label = (kolom.meta as { label?: unknown } | undefined)?.label;
  if (typeof label === "string") return label;
  return typeof kolom.header === "string" ? kolom.header : null;
}

/** Paginasi dari server: angka dan aksi footer datang dari pemakai tabel. */
export interface PaginasiServerTabel {
  halaman: number;
  jumlahHalaman: number;
  total: number;
  ukuran: number;
  pilihanUkuran?: readonly number[];
  sibuk?: boolean;
  onGantiHalaman: (halaman: number) => void;
  onGantiUkuran?: (ukuran: number) => void;
}

/**
 * Urutan dari server: tabel tidak mengurutkan baris sendiri, dan pergantian
 * urutan kolom diteruskan ke pemakai tabel (daftar penjualan, GET /penjualan
 * sort dan order sejak backend yoga 8fad4c0).
 */
export interface UrutanServerTabel {
  urutan: SortingState;
  onGantiUrutan: (urutan: SortingState) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  emptyMessage?: string;
  searchKey?: string;
  searchPlaceholder?: string;
  /**
   * Paginasi dari server: data sudah dipotong per halaman, sehingga paginasi
   * klien dimatikan dan footer yang sama memakai angka serta aksi dari
   * server (daftar penjualan).
   */
  paginasiServer?: PaginasiServerTabel;
  /** Urutan dari server: pengurutan klien dimatikan dan urutan datang dari pemakai tabel. */
  urutanServer?: UrutanServerTabel;
  /**
   * Pilihan jumlah baris per halaman untuk paginasi klien, opt-in (pemilik
   * proyek, 17 Oktober 2026). Tanpa prop ini tabel tetap 10 baris tanpa
   * pemilih. Nilai pertama menjadi ukuran awal; mengganti ukuran kembali ke
   * halaman 1.
   */
  pilihanUkuranKlien?: readonly number[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  emptyMessage = "Tidak ada data.",
  searchKey,
  searchPlaceholder = "Cari...",
  paginasiServer,
  urutanServer,
  pilihanUkuranKlien,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: paginasiServer ? undefined : getPaginationRowModel(),
    manualPagination: !!paginasiServer,
    getSortedRowModel: urutanServer ? undefined : getSortedRowModel(),
    manualSorting: !!urutanServer,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (pembaru) => {
      if (!urutanServer) return setSorting(pembaru);
      urutanServer.onGantiUrutan(typeof pembaru === "function" ? pembaru(urutanServer.urutan) : pembaru);
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting: urutanServer ? urutanServer.urutan : sorting, columnFilters, columnVisibility },
    initialState: { pagination: { pageSize: pilihanUkuranKlien?.[0] ?? 10 } },
  });

  const server = paginasiServer;
  const totalData = server ? server.total : table.getFilteredRowModel().rows.length;
  const halamanKini = server ? server.halaman : table.getState().pagination.pageIndex + 1;
  const jumlahHalaman = server ? Math.max(1, server.jumlahHalaman) : table.getPageCount() || 1;
  const bisaSebelumnya = server ? !server.sibuk && server.halaman > 1 : table.getCanPreviousPage();
  const bisaBerikutnya = server ? !server.sibuk && server.halaman < server.jumlahHalaman : table.getCanNextPage();
  const keSebelumnya = () => (server ? server.onGantiHalaman(server.halaman - 1) : table.previousPage());
  const keBerikutnya = () => (server ? server.onGantiHalaman(server.halaman + 1) : table.nextPage());
  const pilihanUkuran = server ? server.pilihanUkuran : pilihanUkuranKlien;
  const ukuranKini = server ? server.ukuran : table.getState().pagination.pageSize;
  const gantiUkuran = server
    ? server.onGantiUkuran
    : (ukuran: number) => table.setPagination({ pageIndex: 0, pageSize: ukuran });

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      {searchKey && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={searchPlaceholder}
            suppressHydrationWarning
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
            className="max-w-sm text-sm bg-permukaan text-navy border-navy/15 focus-visible:ring-navy/50 h-11 rounded-xl px-4 font-medium"
          />
        </div>
      )}

      {/* Tiap baris adalah kartu terpisah (TB1a); di HP kepala kolom disembunyikan dan sel tersusun ke bawah. */}
      <Table className="max-sm:block">
        <TableHeader className="max-sm:hidden">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="max-sm:block">
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-navy/60">
                Memuat data...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-navy/60">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className={KELAS_BARIS_HP}>
                {row.getVisibleCells().map((cell) => {
                  const label = labelKolom(cell.column.columnDef);
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn("text-sm", KELAS_SEL_HP, cell.column.id === "aksi" && KELAS_AKSI_HP)}
                    >
                      {label && (
                        <span className="sm:hidden block text-[11px] font-semibold text-navy/60">
                          {label}
                        </span>
                      )}
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Kaki tabel: kontrol polos tanpa latar maupun kotak (TB3a); klien, atau angka dan aksi dari server. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
        <p className="text-xs font-semibold text-navy/60">
          {totalData} total data
        </p>
        <div className="flex items-center gap-1 sm:gap-2">
          {pilihanUkuran && gantiUkuran && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-navy/60">Tampilkan</span>
              <Select value={String(ukuranKini)} onValueChange={(nilai) => gantiUkuran(Number(nilai))}>
                <SelectTrigger
                  aria-label="Jumlah baris per halaman"
                  className="h-8 w-auto cursor-pointer gap-1 border-0 bg-transparent px-1 text-xs font-bold text-navy shadow-none focus-visible:ring-1 focus-visible:ring-navy/40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pilihanUkuran.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous"
            onClick={keSebelumnya}
            disabled={!bisaSebelumnya}
            className="h-8 w-8 cursor-pointer text-navy hover:bg-transparent hover:text-navy/60"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="text-xs font-semibold text-navy/60">
            Halaman {halamanKini} dari {jumlahHalaman}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next"
            onClick={keBerikutnya}
            disabled={!bisaBerikutnya}
            className="h-8 w-8 cursor-pointer text-navy hover:bg-transparent hover:text-navy/60"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

    </div>
  );
}