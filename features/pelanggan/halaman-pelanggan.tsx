"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Users, Crown, MapPin, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth/useSession";
import type { Pelanggan } from "@/types/pelanggan";
import { DialogHapusPelanggan } from "./dialog-hapus-pelanggan";
import { DialogUbahPelanggan, FormTambahPelanggan } from "./form-pelanggan";
import { useDaftarPelanggan } from "./hooks";
import { aksiPelanggan } from "./izin";

const KELAS_KEPALA =
  "h-auto p-0 text-xs font-semibold text-[#041E3F]/60 hover:text-[#041E3F] hover:bg-transparent";

function KartuStatistik({
  ikon,
  kelasIkon,
  judul,
  nilai,
}: {
  ikon: React.ReactNode;
  kelasIkon: string;
  judul: string;
  nilai: number;
}) {
  return (
    <div className="rounded-xl border border-[#041E3F]/10 bg-[#F2EAE1] p-6 shadow-sm flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${kelasIkon}`}>
        {ikon}
      </div>
      <div>
        <p className="text-sm font-bold text-[#6c5d4c]">{judul}</p>
        <h3 className="text-2xl font-bold text-[#6c5d4c]">{nilai}</h3>
      </div>
    </div>
  );
}

/**
 * Halaman pelanggan (keputusan PD1a): daftar, panel tambah, dialog ubah, dan
 * dialog hapus. Tombol tambah, ubah, dan hapus mengikuti izin endpoint-nya
 * (keputusan rancangan butir 14); GET /pelanggan tidak memeriksa izin, dan
 * gate halamannya read-pelanggan (IZIN_HALAMAN).
 */
export function HalamanPelanggan() {
  const { permissions } = useSession();
  const aksi = aksiPelanggan(permissions);
  const daftar = useDaftarPelanggan();
  const pelangganList = useMemo(() => daftar.data ?? [], [daftar.data]);

  const [diubah, setDiubah] = useState<Pelanggan | null>(null);
  const [dihapus, setDihapus] = useState<Pelanggan | null>(null);

  const statistik = useMemo(
    () => ({
      total: pelangganList.length,
      member: pelangganList.filter((p) => p.tipePelanggan === "member").length,
      korporat: pelangganList.filter((p) => p.tipePelanggan === "korporat").length,
    }),
    [pelangganList],
  );

  const columns: ColumnDef<Pelanggan>[] = [
    {
      accessorKey: "namaPelanggan",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className={KELAS_KEPALA}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Nama Pelanggan</span>
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-[#041E3F]">{row.original.namaPelanggan}</span>
          {row.original.alamat && (
            <span className="text-xs text-[#041E3F]/60 line-clamp-1 mt-0.5">
              {row.original.alamat}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "nomorHp",
      header: () => <span className="text-xs font-semibold text-[#041E3F]/60">Kontak</span>,
      cell: ({ row }) => (
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-[#041E3F]">{row.original.nomorHp || "-"}</span>
          {row.original.email && <span className="text-xs text-[#041E3F]/60">{row.original.email}</span>}
        </div>
      ),
    },
    {
      accessorKey: "tipePelanggan",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className={KELAS_KEPALA}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Tipe</span>
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const tipe = row.original.tipePelanggan;
        const colorClass =
          tipe === "member"
            ? "bg-amber-100 text-amber-700 font-bold dark:bg-amber-900/30 dark:text-amber-400"
            : tipe === "korporat"
              ? "bg-sky-100 text-sky-700 font-bold dark:bg-sky-900/30 dark:text-sky-400"
              : "bg-[#041E3F]/10 text-[#041E3F] font-bold";

        return (
          <span className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${colorClass}`}>
            {tipe}
          </span>
        );
      },
    },
    {
      accessorKey: "poinLoyalitas",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className={KELAS_KEPALA}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Poin</span>
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-[#041E3F]">{row.original.poinLoyalitas}</span>
      ),
    },
    {
      id: "aksi",
      header: () => <div className="text-right text-xs text-[#041E3F]/60">Aksi</div>,
      cell: ({ row }) => {
        if (!aksi.ubah && !aksi.hapus) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-[#041E3F]/70 hover:text-[#041E3F] hover:bg-[#041E3F]/5">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#F2EAE1] border-[#041E3F]/10">
                {aksi.ubah && (
                  <DropdownMenuItem className="cursor-pointer font-bold text-[#041E3F]/80 focus:bg-[#8d8377]/20" onClick={() => setDiubah(row.original)}>
                    Edit
                  </DropdownMenuItem>
                )}
                {aksi.ubah && aksi.hapus && <DropdownMenuSeparator className="bg-[#041E3F]/10" />}
                {aksi.hapus && (
                  <DropdownMenuItem
                    className="cursor-pointer font-bold text-red-600/60 focus:text-red-700 focus:bg-red-500/10"
                    onClick={() => setDihapus(row.original)}
                  >
                    Hapus
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#041E3F]">Manajemen Pelanggan</h1>
        <p className="text-sm font-medium text-[#6c5d4c]/60">
          Kelola data pelanggan, keanggotaan, dan informasi kontak.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <KartuStatistik
            ikon={<Users className="h-6 w-6" />}
            kelasIkon="bg-[#cbb193] text-[#67543d]"
            judul="Total Pelanggan"
            nilai={statistik.total}
          />
          <KartuStatistik
            ikon={<Crown className="h-6 w-6" />}
            kelasIkon="bg-[#FFBF00]/70 text-[#a55f30]"
            judul="Pelanggan Member"
            nilai={statistik.member}
          />
          <KartuStatistik
            ikon={<MapPin className="h-6 w-6" />}
            kelasIkon="bg-[#F62440]/70 text-white"
            judul="Klien Korporat"
            nilai={statistik.korporat}
          />
        </div>

        <div
          className={`rounded-xl border border-[#041E3F]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4 ${
            aksi.buat ? "lg:col-span-8" : "lg:col-span-12"
          }`}
        >
          <h2 className="text-sm font-semibold text-[#041E3F]">Daftar Pelanggan</h2>
          {daftar.isError ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center">
              <p className="text-sm font-medium text-red-600">
                Gagal memuat data pelanggan. Periksa koneksi Anda, lalu coba lagi.
              </p>
              <Button variant="outline" onClick={() => daftar.refetch()} disabled={daftar.isFetching}>
                Coba Lagi
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={pelangganList}
              loading={daftar.isLoading}
              emptyMessage="Belum ada data pelanggan."
              searchKey="namaPelanggan"
              searchPlaceholder="Cari nama pelanggan..."
            />
          )}
        </div>

        {aksi.buat && (
          <div className="rounded-xl border border-[#041E3F]/10 bg-[#F2EAE1] p-6 shadow-sm lg:col-span-4 lg:sticky lg:top-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[#041E3F]">Tambah Pelanggan Cepat</h2>
              <p className="text-xs text-[#041E3F]/60 mt-1">
                Tambahkan data pelanggan baru langsung dari panel ini.
              </p>
            </div>
            <FormTambahPelanggan />
          </div>
        )}
      </div>

      <DialogUbahPelanggan pelanggan={diubah} onTutup={() => setDiubah(null)} />
      <DialogHapusPelanggan pelanggan={dihapus} onTutup={() => setDihapus(null)} />
    </div>
  );
}