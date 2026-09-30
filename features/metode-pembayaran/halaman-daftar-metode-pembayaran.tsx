"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpDown, MoreHorizontal, Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import type { MetodePembayaran } from "@/types/metodePembayaran";
import { useDaftarMetodePembayaran, usePerbaruiMetodePembayaran } from "./hooks";
import { aksiMetodePembayaran } from "./izin";
import { BATAS_METODE_AKTIF, labelKategori, masihDalamBatas, metodeAktifTerakhir } from "./tampilan";
import { PesanMetode, URL_DAFTAR_METODE } from "./form-metode-pembayaran";

const URL_BUAT = URL_DAFTAR_METODE + "/buatMetodePembayaran";
const kelasKepalaKolom = "text-xs font-bold text-[#0A2947]/60";

/**
 * Daftar kelola metode pembayaran: seluruh metode termasuk yang nonaktif
 * (showAll, keputusan PO2a). Hapus diganti aktifkan dan nonaktifkan lewat
 * PUT { isActive }, karena backend 465b438 tidak punya DELETE
 * (kontrak/temuan.md butir 82). Tambah dan aktifkan ditahan saat toko sudah
 * punya 10 metode aktif (PO3a), menonaktifkan metode aktif terakhir diberi
 * peringatan (PO5a), dan tombol mengikuti izin create dan update
 * (keputusan rancangan butir 14).
 */
export function HalamanDaftarMetodePembayaran() {
  const router = useRouter();
  const { permissions } = useSession();
  const aksi = aksiMetodePembayaran(permissions);
  const daftar = useDaftarMetodePembayaran({ semua: true });
  const data = useMemo(() => daftar.data ?? [], [daftar.data]);
  const dalamBatas = masihDalamBatas(data);
  const [target, setTarget] = useState<MetodePembayaran | null>(null);

  const ubahStatus = usePerbaruiMetodePembayaran({
    onSuccess: () => {
      toast.success("Berhasil", {
        description: target?.isActive ? "Metode pembayaran telah dinonaktifkan." : "Metode pembayaran telah diaktifkan.",
      });
      setTarget(null);
    },
    onError: (err) =>
      toast.error("Gagal Mengubah Status", { description: pesanError(err, "Status metode pembayaran gagal diubah.") }),
  });

  const columns = useMemo<ColumnDef<MetodePembayaran>[]>(
    () => [
      {
        accessorKey: "namaPembayaran",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947]"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Pembayaran <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <span className="font-bold text-[#0A2947]">{row.original.namaPembayaran}</span>,
      },
      {
        accessorKey: "kategori",
        header: () => <span className={kelasKepalaKolom}>Kategori</span>,
        cell: ({ row }) => (
          <span className="text-sm capitalize font-medium text-[#0A2947]/80">{labelKategori(row.original.kategori)}</span>
        ),
      },
      {
        id: "akunKas",
        header: () => <span className={kelasKepalaKolom}>Akun Tujuan</span>,
        cell: ({ row }) => {
          const akun = row.original.akunKas;
          if (!akun?.namaAkun) return <span className="text-xs font-medium text-[#0A2947]/50">-</span>;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-[#0A2947]">{akun.namaAkun}</span>
              <span className="text-xs font-medium text-[#0A2947]/60 font-mono">{akun.nomorAkun}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: () => <span className={kelasKepalaKolom}>Status</span>,
        cell: ({ row }) => {
          const aktif = row.original.isActive;
          return (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${aktif ? "bg-[#718355] text-[#FFFAF3]" : "bg-[#0A2947]/10 text-[#0A2947]/60"}`}
            >
              {aktif ? "Aktif" : "Non-Aktif"}
            </span>
          );
        },
      },
      {
        id: "aksi",
        header: () => <div className={`text-right ${kelasKepalaKolom}`}>Aksi</div>,
        cell: ({ row }) => {
          const m = row.original;
          if (!aksi.ubah) return null;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Aksi ${m.namaPembayaran}`}
                    className="h-8 w-8 cursor-pointer text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#FFFAF3] border-[#0A2947]/10">
                  <DropdownMenuItem
                    className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
                    onSelect={() => router.push(`${URL_DAFTAR_METODE}/${m.id}`)}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#0A2947]/10" />
                  {m.isActive ? (
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
                      onSelect={() => setTarget(m)}
                    >
                      Nonaktifkan
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      disabled={!dalamBatas}
                      className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
                      onSelect={() => setTarget(m)}
                    >
                      Aktifkan
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [aksi.ubah, dalamBatas, router],
  );

  const menonaktifkan = target?.isActive === true;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/pengaturan")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Laman Pengaturan
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shrink-0 shadow-sm">
              <Wallet className="w-6 h-6 text-[#0A2947]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Metode Pembayaran</h1>
              <p className="text-sm font-medium text-[#0A2947]/60">Kelola saluran pembayaran yang terhubung ke Akun Kas Anda.</p>
            </div>
          </div>
          {aksi.buat &&
            (dalamBatas ? (
              <Link href={URL_BUAT} className="w-full sm:w-auto">
                <Button className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm w-full font-bold">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Metode
                </Button>
              </Link>
            ) : (
              <Button disabled className="bg-[#0A2947] text-[#FFFAF3] shadow-sm w-full sm:w-auto font-bold">
                <Plus className="mr-2 h-4 w-4" /> Tambah Metode
              </Button>
            ))}
        </div>
        {!dalamBatas && (
          <p className="text-sm font-medium text-[#0A2947]/70">
            Toko sudah punya {BATAS_METODE_AKTIF} metode aktif (batas maksimal). Nonaktifkan metode yang tidak dipakai untuk
            menambah atau mengaktifkan metode lain.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4">
        {daftar.isError ? (
          <PesanMetode
            judul="Gagal memuat metode pembayaran"
            pesan={pesanError(daftar.error, "Terjadi kesalahan saat memuat metode pembayaran.")}
            onCobaLagi={() => void daftar.refetch()}
            kembali={false}
          />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            loading={daftar.isPending}
            emptyMessage="Belum ada data metode pembayaran."
            searchKey="namaPembayaran"
            searchPlaceholder="Cari nama pembayaran..."
          />
        )}
      </div>

      <AlertDialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open && !ubahStatus.isPending) setTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              {menonaktifkan ? "Nonaktifkan" : "Aktifkan"} metode {target?.namaPembayaran}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              {menonaktifkan
                ? "Metode ini tidak lagi dapat dipilih di kasir. Pembayaran lama tetap tercatat, dan metode dapat diaktifkan kembali kapan saja."
                : "Metode ini akan kembali dapat dipilih di kasir."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {target && metodeAktifTerakhir(data, target) && (
            <p className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-600">
              Ini metode aktif terakhir. Setelah dinonaktifkan, kasir tidak punya metode pembayaran sama sekali.
            </p>
          )}
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel
              disabled={ubahStatus.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={ubahStatus.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (target) ubahStatus.mutate({ id: target.id, payload: { isActive: !target.isActive } });
              }}
              className={`cursor-pointer font-bold ${menonaktifkan ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90"}`}
            >
              {ubahStatus.isPending ? "Menyimpan..." : menonaktifkan ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}