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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  emptyMessage = "Tidak ada data.",
  searchKey,
  searchPlaceholder = "Cari...",
  paginasiServer,
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
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
    initialState: { pagination: { pageSize: 10 } },
  });

  const server = paginasiServer;
  const totalData = server ? server.total : table.getFilteredRowModel().rows.length;
  const halamanKini = server ? server.halaman : table.getState().pagination.pageIndex + 1;
  const jumlahHalaman = server ? Math.max(1, server.jumlahHalaman) : table.getPageCount() || 1;
  const bisaSebelumnya = server ? !server.sibuk && server.halaman > 1 : table.getCanPreviousPage();
  const bisaBerikutnya = server ? !server.sibuk && server.halaman < server.jumlahHalaman : table.getCanNextPage();
  const keSebelumnya = () => (server ? server.onGantiHalaman(server.halaman - 1) : table.previousPage());
  const keBerikutnya = () => (server ? server.onGantiHalaman(server.halaman + 1) : table.nextPage());

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
            className="max-w-sm text-sm bg-[#FFFAF3] text-[#041E3F] border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 h-11 rounded-xl px-4 font-medium"
          />
        </div>
      )}

      {/* Table Wrapper - Diubah warnanya agar "Pop Out" dari background card */}
      <div className="overflow-hidden rounded-xl border border-[#041E3F]/10 bg-[#FFFAF3] shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#041E3F]/3 hover:bg-[#041E3F]/3 border-b-[#041E3F]/10">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-bold text-[#041E3F]/60 uppercase tracking-wider h-12"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-medium text-[#041E3F]/60">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-medium text-[#041E3F]/60">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-[#041E3F]/10 last:border-0 hover:bg-[#041E3F]/2 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination: klien, atau angka dan aksi dari server bila paginasiServer diisi */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs font-semibold text-[#041E3F]/60">
          {totalData} total data
        </p>
        <div className="flex items-center gap-3">
          {server?.pilihanUkuran && server.onGantiUkuran && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#041E3F]/60">Tampilkan</span>
              <Select value={String(server.ukuran)} onValueChange={(nilai) => server.onGantiUkuran?.(Number(nilai))}>
                <SelectTrigger
                  aria-label="Jumlah baris per halaman"
                  className="h-9 w-[76px] cursor-pointer rounded-lg border-[#041E3F]/20 bg-transparent text-xs font-bold text-[#041E3F]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {server.pilihanUkuran.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={keSebelumnya}
            disabled={!bisaSebelumnya}
            className="text-xs cursor-pointer border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 bg-transparent font-bold rounded-lg h-9"
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-[#041E3F]/60">
            Halaman {halamanKini} dari {jumlahHalaman}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={keBerikutnya}
            disabled={!bisaBerikutnya}
            className="text-xs cursor-pointer border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 bg-transparent font-bold rounded-lg h-9"
          >
            Next
          </Button>
        </div>
      </div>

    </div>
  );
}