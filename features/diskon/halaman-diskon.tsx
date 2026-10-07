"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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
import { useSession } from "@/lib/auth/useSession";
import type { Diskon } from "@/types/diskon";
import { DialogStatusDiskon } from "./dialog-status-diskon";
import { DialogFormDiskon } from "./form-diskon";
import { useDaftarDiskon } from "./hooks";
import { aksiDiskon } from "./izin";
import {
  BATAS_DISKON_AKTIF,
  FILTER_DISKON_AWAL,
  aktifTetapiTidakBerlaku,
  filterDiskonAktif,
  masihDalamBatas,
  ringkasAturan,
  saringDiskon,
  teksNilai,
  type FilterDiskon,
} from "./tampilan";

const KELAS_KEPALA = "text-xs font-semibold text-[#041E3F]/60";
const KELAS_PEMICU_FILTER =
  "w-40 h-11 bg-[#FFFAF3] text-[#041E3F] border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium rounded-xl";
const KELAS_ISI_FILTER = "bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl";

/**
 * Halaman diskon (keputusan PD2a dan PD3a). Daftar disaring di klien dari
 * satu cache daftar diskon. Tombol tambah, ubah, dan aktifkan atau
 * nonaktifkan mengikuti izin endpoint-nya (keputusan rancangan butir 14);
 * hapus tidak ada, karena backend tidak punya DELETE. Batas diskon aktif
 * ditahan di sini, dan penolakan backend tetap ditampilkan. Aturan
 * tambahan tampil baca-saja di kolom Aturan.
 */
export function HalamanDiskon() {
  const { permissions } = useSession();
  const aksi = aksiDiskon(permissions);
  const daftar = useDaftarDiskon();
  const semua = useMemo(() => daftar.data ?? [], [daftar.data]);

  const [filter, setFilter] = useState<FilterDiskon>(FILTER_DISKON_AWAL);
  const [form, setForm] = useState<{ diskon: Diskon | null } | null>(null);
  const [statusDiubah, setStatusDiubah] = useState<Diskon | null>(null);

  const tampil = useMemo(() => saringDiskon(semua, filter), [semua, filter]);
  const dalamBatas = masihDalamBatas(semua);

  const columns: ColumnDef<Diskon>[] = [
    {
      accessorKey: "namaDiskon",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-semibold text-[#041E3F]/60 hover:text-[#041E3F] hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Diskon
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-bold text-[#041E3F]">{row.original.namaDiskon}</span>
      ),
    },
    {
      accessorKey: "cakupan",
      header: () => <span className={KELAS_KEPALA}>Cakupan</span>,
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            row.original.cakupan === "Global"
              ? "bg-sky-100 text-sky-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {row.original.cakupan}
        </span>
      ),
    },
    {
      accessorKey: "tipe",
      header: () => <span className={KELAS_KEPALA}>Tipe</span>,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[#041E3F]/70">
          {row.original.tipe === "persen" ? "Persen" : "Nominal"}
        </span>
      ),
    },
    {
      accessorKey: "nilai",
      header: () => <span className={KELAS_KEPALA}>Nilai</span>,
      cell: ({ row }) => (
        <span className="font-bold text-[#041E3F]">{teksNilai(row.original)}</span>
      ),
    },
    {
      accessorKey: "bisaDigabung",
      header: () => <span className={KELAS_KEPALA}>Digabung</span>,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[#041E3F]/70">
          {row.original.bisaDigabung ? "Ya" : "Tidak"}
        </span>
      ),
    },
    {
      id: "aturan",
      header: () => <span className={KELAS_KEPALA}>Aturan</span>,
      cell: ({ row }) => {
        const aturan = ringkasAturan(row.original);
        if (aturan.length === 0) {
          return <span className="text-sm font-medium text-[#041E3F]/40">-</span>;
        }
        return (
          <ul className="space-y-0.5">
            {aturan.map((teks) => (
              <li key={teks} className="text-xs font-medium text-[#041E3F]/70">
                {teks}
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className={KELAS_KEPALA}>Status</span>,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              row.original.status === "Aktif"
                ? "bg-green-100 text-green-700"
                : "bg-[#041E3F]/10 text-[#041E3F]/60"
            }`}
          >
            {row.original.status}
          </span>
          {aktifTetapiTidakBerlaku(row.original) && (
            <span className="text-[10px] font-semibold text-amber-700">Tidak sedang berlaku</span>
          )}
        </div>
      ),
    },
    {
      id: "aksi",
      header: () => <div className="text-right text-xs text-[#041E3F]/60">Aksi</div>,
      cell: ({ row }) => {
        if (!aksi.ubah) return null;
        const item = row.original;
        const mengaktifkan = item.status === "Non-Aktif";
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-[#041E3F]/70 hover:text-[#041E3F] hover:bg-[#041E3F]/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#F2EAE1] border-[#041E3F]/10">
                <DropdownMenuItem
                  className="cursor-pointer text-[#041E3F] hover:bg-[#041E3F]/5 font-medium"
                  onClick={() => setForm({ diskon: item })}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#041E3F]/10" />
                <DropdownMenuItem
                  disabled={mengaktifkan && !dalamBatas}
                  className={
                    mengaktifkan
                      ? "cursor-pointer text-[#041E3F] hover:bg-[#041E3F]/5 font-medium"
                      : "cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-medium"
                  }
                  onClick={() => setStatusDiubah(item)}
                >
                  {mengaktifkan ? "Aktifkan" : "Nonaktifkan"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#041E3F]">Kelola Diskon</h1>
          <p className="text-sm text-[#041E3F]/60">
            Kelola seluruh data diskon dan promosi toko.
          </p>
        </div>
        {aksi.buat && (
          <Button
            onClick={() => setForm({ diskon: null })}
            className="cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 font-semibold rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Diskon
          </Button>
        )}
      </div>

      {!dalamBatas && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800">
          Toko ini sudah punya {BATAS_DISKON_AKTIF} diskon aktif (batas maksimal). Diskon baru hanya
          dapat disimpan Non-Aktif; nonaktifkan diskon yang tidak dipakai untuk mengaktifkan diskon lain.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Select
          value={filter.status}
          onValueChange={(nilai) => setFilter({ ...filter, status: nilai as FilterDiskon["status"] })}
        >
          <SelectTrigger className={KELAS_PEMICU_FILTER}>
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className={KELAS_ISI_FILTER}>
            <SelectItem value="all" className="cursor-pointer">Semua Status</SelectItem>
            <SelectItem value="Aktif" className="cursor-pointer">Aktif</SelectItem>
            <SelectItem value="Non-Aktif" className="cursor-pointer">Non-Aktif</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.cakupan}
          onValueChange={(nilai) => setFilter({ ...filter, cakupan: nilai as FilterDiskon["cakupan"] })}
        >
          <SelectTrigger className={KELAS_PEMICU_FILTER}>
            <SelectValue placeholder="Semua Cakupan" />
          </SelectTrigger>
          <SelectContent className={KELAS_ISI_FILTER}>
            <SelectItem value="all" className="cursor-pointer">Semua Cakupan</SelectItem>
            <SelectItem value="Global" className="cursor-pointer">Global</SelectItem>
            <SelectItem value="Item" className="cursor-pointer">Item</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.tipe}
          onValueChange={(nilai) => setFilter({ ...filter, tipe: nilai as FilterDiskon["tipe"] })}
        >
          <SelectTrigger className={KELAS_PEMICU_FILTER}>
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent className={KELAS_ISI_FILTER}>
            <SelectItem value="all" className="cursor-pointer">Semua Tipe</SelectItem>
            <SelectItem value="persen" className="cursor-pointer">Persen</SelectItem>
            <SelectItem value="nominal" className="cursor-pointer">Nominal</SelectItem>
          </SelectContent>
        </Select>

        {filterDiskonAktif(filter) && (
          <Button
            variant="outline"
            onClick={() => setFilter(FILTER_DISKON_AWAL)}
            className="cursor-pointer h-11 border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 bg-transparent font-semibold rounded-xl"
          >
            Reset Filter
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-[#041E3F]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4 mt-2">
        {daftar.isError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center">
            <p className="text-sm font-medium text-red-600">
              Gagal memuat data diskon. Periksa koneksi Anda, lalu coba lagi.
            </p>
            <Button variant="outline" onClick={() => daftar.refetch()} disabled={daftar.isFetching}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tampil}
            loading={daftar.isLoading}
            emptyMessage="Belum ada data diskon."
            searchKey="namaDiskon"
            searchPlaceholder="Cari nama diskon..."
          />
        )}
      </div>

      <DialogFormDiskon
        terbuka={form !== null}
        diskon={form?.diskon ?? null}
        batasTercapai={!dalamBatas}
        onTutup={() => setForm(null)}
      />
      <DialogStatusDiskon diskon={statusDiubah} onTutup={() => setStatusDiubah(null)} />
    </div>
  );
}