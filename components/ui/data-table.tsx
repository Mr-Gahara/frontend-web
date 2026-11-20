"use client";
import * as React from "react";
import { KotakCari } from "@/components/filter/bilah-filter";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KakiPaginasi } from "@/components/ui/kaki-paginasi";
import { cn } from "@/lib/utils";
import { kunciUkurUlang, useKartuBilaTakMuat } from "@/components/ui/use-kartu-bila-tak-muat";

/**
 * Di HP tiap baris menjadi satu kartu dan selnya tersusun ke bawah
 * (keputusan TB1a); di lebar meja juga bila tabel tidak muat di wadahnya
 * (LT1a, varian kartu: dan tabel: di app/globals.css). Kelas ber-first dan ber-last menimpa bingkai kartu
 * per sel milik TableCell, yang hanya berlaku di lebar meja.
 */
const KELAS_BARIS_HP =
  "kartu:relative kartu:mb-2 kartu:flex kartu:flex-col kartu:gap-1.5 kartu:rounded-2xl kartu:border kartu:border-navy/10 kartu:bg-[var(--warna-baris,var(--permukaan))] kartu:p-3";
const KELAS_SEL_HP =
  "kartu:block kartu:border-0 kartu:bg-transparent kartu:p-0 kartu:whitespace-normal kartu:first:border-l-0 kartu:first:rounded-none kartu:first:pr-10 kartu:first:text-besar kartu:first:font-bold kartu:last:border-r-0 kartu:last:rounded-none";
const KELAS_AKSI_HP = "kartu:absolute kartu:right-2 kartu:top-2";
/** kartuLega: jarak antar-field, padding, dan jarak antarkartu lebih longgar (20 November 2026). */
const KELAS_BARIS_HP_LEGA = "kartu:mb-3 kartu:gap-3 kartu:p-4";

/**
 * meta.sembunyiHp: sel tidak tampil di kartu HP (di bawah 640 px, CV20a),
 * tetapi tampil berlabel di kartu lebar meja (pemilik proyek,
 * 17 November 2026; LT6a).
 */
const sembunyiHp = (kolom: { meta?: unknown }) =>
  (kolom.meta as { sembunyiHp?: unknown } | undefined)?.sembunyiHp === true;

/** Label kecil sel di HP: meta.label kolom, atau header bila berupa teks. */
function labelKolom(kolom: { meta?: unknown; header?: unknown }): string | null {
  const label = (kolom.meta as { label?: unknown } | undefined)?.label;
  if (typeof label === "string") return label;
  return typeof kolom.header === "string" ? kolom.header : null;
}

/**
 * meta.lebarBungkus kolom (px): mulai lebar sm, isi sel boleh turun baris
 * dengan lebar paling banyak sekian, agar tabel tidak lebih lebar dari
 * wadahnya di laptop 1280 px (pemilik proyek, 14 November 2026). Kartu HP
 * tidak terpengaruh.
 */
function gayaBungkus(kolom: { meta?: unknown }): React.CSSProperties | undefined {
  const lebar = (kolom.meta as { lebarBungkus?: unknown } | undefined)?.lebarBungkus;
  return typeof lebar === "number" ? ({ "--lebar-bungkus": `${lebar}px` } as React.CSSProperties) : undefined;
}

const KELAS_BUNGKUS = "tabel:whitespace-normal tabel:max-w-(--lebar-bungkus) tabel:[&_*]:whitespace-normal";

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
  /**
   * Tabel rincian di halaman detail dan form: seluruh baris tampil tanpa
   * kaki tabel (jumlah data dan paginasi), dengan kartu baris dan kartu HP
   * yang sama dengan tabel daftar (pemilik proyek, 14 November 2026; CV22a).
   */
  rincian?: boolean;
  /**
   * Kartu baris yang lebih longgar: jarak antar-field 12 px, padding 16 px,
   * dan label berjarak dari nilainya, untuk daftar yang kartunya padat
   * (daftar pengajuan stok, pemilik proyek 20 November 2026).
   */
  kartuLega?: boolean;
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
  rincian = false,
  kartuLega = false,
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
    initialState: { pagination: { pageSize: rincian ? Number.MAX_SAFE_INTEGER : (pilihanUkuranKlien?.[0] ?? 10) } },
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
  const { ref: refTabel, kartu } = useKartuBilaTakMuat(
    kunciUkurUlang({
      idBaris: table.getRowModel().rows.map((r) => (r.original as { id?: unknown }).id ?? r.id),
      halaman: halamanKini,
      ukuran: ukuranKini,
      memuat: loading,
      kolom: columns.length,
    }),
  );

  return (
    <div ref={refTabel} data-kartu={kartu ? "" : undefined} className="flex flex-col gap-4">

      {/* Toolbar */}
      {/* Kotak cari seragam (FL6a): 32 px di HP, 44 px mulai 640 px, ikon cari. */}
      {searchKey && (
        <KotakCari
          id={`cari-tabel-${searchKey}`}
          label={(searchPlaceholder ?? "Cari").replace(/\.+$/, "")}
          placeholder={searchPlaceholder ?? "Cari..."}
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
          onChange={(nilai) => table.getColumn(searchKey)?.setFilterValue(nilai)}
        />
      )}

      {/* Tiap baris adalah kartu terpisah (TB1a); di HP kepala kolom disembunyikan dan sel tersusun ke bawah. */}
      <Table className="kartu:block">
        <TableHeader className="kartu:hidden">
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
        <TableBody className="kartu:block">
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-isi text-navy/60 whitespace-normal">
                Memuat data...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-isi text-navy/60 whitespace-normal">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className={cn(KELAS_BARIS_HP, kartuLega && KELAS_BARIS_HP_LEGA)}>
                {row.getVisibleCells().map((cell) => {
                  const label = labelKolom(cell.column.columnDef);
                  const bungkus = gayaBungkus(cell.column.columnDef);
                  return (
                    <TableCell
                      key={cell.id}
                      style={bungkus}
                      className={cn(
                        "text-isi",
                        KELAS_SEL_HP,
                        cell.column.id === "aksi" && KELAS_AKSI_HP,
                        sembunyiHp(cell.column.columnDef) && "max-sm:hidden!",
                        bungkus && KELAS_BUNGKUS,
                      )}
                    >
                      {label && (
                        <span className={cn("tabel:hidden block text-mikro font-semibold text-navy/60", kartuLega && "mb-1")}>
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
      {!rincian && (
        <KakiPaginasi
          total={totalData}
          halaman={halamanKini}
          jumlahHalaman={jumlahHalaman}
          bisaSebelumnya={bisaSebelumnya}
          bisaBerikutnya={bisaBerikutnya}
          onSebelumnya={keSebelumnya}
          onBerikutnya={keBerikutnya}
          ukuran={ukuranKini}
          pilihanUkuran={pilihanUkuran}
          onGantiUkuran={gantiUkuran}
        />
      )}
    </div>
  );
}