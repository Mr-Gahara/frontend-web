"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Wallet,
  MoreHorizontal,
  ArrowUpDown,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { AkunKas } from "@/types/akunKas"; // Pastikan tipe ini di-import

type MetodePembayaran = {
  _id: string;
  namaPembayaran: string;
  kategori: "tunai" | "non-tunai";
  isAutomated: boolean;
  isActive: boolean;
  xenditChannelCode?: string | null;
  akunKasID: any; // Sengaja kita any-kan karena backend bisa ngirim string atau object
};

export default function MetodePembayaranListPage() {
  useAuthGuard();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<MetodePembayaran | null>(null);

  // 1. FETCH DATA METODE
  const { data = [], isLoading: loadingMetode, error } = useQuery({
    queryKey: queryKeys.metodePembayaran || ["metode-pembayaran"],
    queryFn: async (): Promise<MetodePembayaran[]> => {
      try {
        const res = await apiClient.get<any>("/metodepembayaran", undefined, "pengguna");
        return Array.isArray(res) ? res : res?.data || [];
      } catch (err: any) {
        if (err?.status === 404 || String(err).toLowerCase().includes("not found")) return [];
        throw err;
      }
    },
  });

  // 2. [PERBAIKAN BUG]: FETCH MASTER AKUN KAS UNTUK MENCOCOKKAN NAMA DI TABEL
  const { data: akunKasList = [], isLoading: loadingAkun } = useQuery({
    queryKey: queryKeys.akunKas,
    queryFn: async (): Promise<AkunKas[]> => {
      try {
        const res = await apiClient.get<any>("/akunkas", undefined, "pengguna");
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    if (error) toast.error("Gangguan Sistem", { description: "Terjadi kesalahan saat memuat metode pembayaran." });
  }, [error]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/metodepembayaran/${id}`, undefined, "pengguna"),
    onSuccess: () => {
      toast.success("Berhasil", { description: "Metode pembayaran telah dihapus dari sistem." });
      queryClient.invalidateQueries({ queryKey: queryKeys.metodePembayaran || ["metode-pembayaran"] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error("Gagal Menghapus", { description: err.message || "Gagal menghapus metode." }),
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget._id || (deleteTarget as any).id;
    if (targetId) await deleteMutation.mutateAsync(targetId);
  };

  const columns = useMemo<ColumnDef<MetodePembayaran>[]>(
    () => [
      {
        accessorKey: "namaPembayaran",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947]" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nama Pembayaran <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const metode = row.original;
          const isDefault = metode.kategori === "tunai" && metode.namaPembayaran.toLowerCase() === "tunai";
          return (
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0A2947]">{metode.namaPembayaran}</span>
              {isDefault && <Badge variant="secondary" className="bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373] border-none text-[10px] px-2 py-0.5 font-bold shadow-sm">Default</Badge>}
            </div>
          );
        },
      },
      {
        accessorKey: "kategori",
        header: () => <span className="text-xs font-bold text-[#0A2947]/60">Kategori</span>,
        cell: ({ row }) => <span className="text-sm capitalize font-medium text-[#0A2947]/80">{row.getValue("kategori") === "tunai" ? "Tunai" : "Non Tunai"}</span>,
      },
      {
        accessorKey: "akunKasID",
        header: () => <span className="text-xs font-bold text-[#0A2947]/60">Akun Tujuan</span>,
        cell: ({ row }) => {
          const rawAkun = row.original.akunKasID || (row.original as any).akunKas;

          // Ekstrak ID mentah (antisipasi string atau objek)
          let kasId = "";
          if (typeof rawAkun === "string") kasId = rawAkun;
          else if (typeof rawAkun === "object" && rawAkun !== null) kasId = rawAkun._id || rawAkun.id;

          // Silangkan ID tersebut dengan data master akunKasList
          const matchedAkun = akunKasList.find(a => a._id === kasId || (a as any).id === kasId);

          const displayNama = matchedAkun?.namaAkun || (typeof rawAkun === "object" ? rawAkun.namaAkun : null);
          const displayNomor = matchedAkun?.nomorAkun || (typeof rawAkun === "object" ? rawAkun.nomorAkun : null);

          if (!displayNama) return <span className="text-xs font-medium text-[#0A2947]/50">-</span>;

          return (
            <div className="flex flex-col">
              <span className="font-semibold text-[#0A2947]">{displayNama}</span>
              <span className="text-xs font-medium text-[#0A2947]/60 font-mono">{displayNomor}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "isAutomated",
        header: () => <span className="text-xs font-bold text-[#0A2947]/60">Sistem</span>,
        cell: ({ row }) => row.getValue("isAutomated") ? (
          <span className="inline-flex items-center text-[#718355] text-xs font-bold"><AlertCircle className="w-3 h-3 mr-1" /> Automated</span>
        ) : (
          <span className="text-[#0A2947]/50 text-xs font-bold">Manual</span>
        ),
      },
      {
        accessorKey: "isActive",
        header: () => <span className="text-xs font-bold text-[#0A2947]/60">Status</span>,
        cell: ({ row }) => {
          const isActive = row.getValue("isActive");
          return <span className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${isActive ? "bg-[#718355] text-[#FFFAF3]" : "bg-[#0A2947]/10 text-[#0A2947]/60"}`}>{isActive ? "Aktif" : "Non-Aktif"}</span>;
        },
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-xs font-bold text-[#0A2947]/60">Aksi</div>,
        cell: ({ row }) => {
          const metode = row.original;
          const isDefault = metode.kategori === "tunai" && metode.namaPembayaran.toLowerCase() === "tunai";
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#FFFAF3] border-[#0A2947]/10">
                  <Link href={`/dashboard/pengaturan/metodePembayaran/${metode._id || (metode as any).id}`}>
                    <DropdownMenuItem className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">Edit</DropdownMenuItem>
                  </Link>
                  {!isDefault && (
                    <>
                      <DropdownMenuSeparator className="bg-[#0A2947]/10" />
                      <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold" onClick={() => setDeleteTarget(metode)}>Hapus</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [akunKasList] // [BUG FIX] Pastikan kolom di-render ulang setelah akunKasList didapatkan
  );

  const tableData = Array.isArray(data) ? data : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors" onClick={() => router.push("/dashboard/pengaturan")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Laman Pengaturan
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shrink-0 shadow-sm"><Wallet className="w-6 h-6 text-[#0A2947]" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Metode Pembayaran</h1>
              <p className="text-sm font-medium text-[#0A2947]/60">Kelola saluran pembayaran yang terhubung ke Akun Kas Anda.</p>
            </div>
          </div>
          <Link href="/dashboard/pengaturan/metodePembayaran/buatMetodePembayaran" className="w-full sm:w-auto">
            <Button className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm w-full font-bold">
              <Plus className="mr-2 h-4 w-4" /> Tambah Metode
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4">
        <DataTable columns={columns} data={tableData} loading={loadingMetode || loadingAkun} emptyMessage="Belum ada data metode pembayaran." searchKey="namaPembayaran" searchPlaceholder="Cari nama pembayaran..." />
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">Hapus metode {deleteTarget?.namaPembayaran}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">Tindakan ini tidak dapat dibatalkan. Metode pembayaran ini akan dihapus secara permanen dan tidak lagi tersedia pada sistem POS.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel disabled={deleteMutation.isPending} className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold">
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}