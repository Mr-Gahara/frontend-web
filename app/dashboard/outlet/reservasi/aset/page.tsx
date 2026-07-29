"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { Aset, StatusAset } from "@/types/aset";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Box,
  AlertTriangle,
  ServerCrash,
  CheckCircle2,
  Wrench,
  PlayCircle,
} from "lucide-react";

export default function AsetPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAset, setSelectedAset] = useState<Aset | null>(null);

  // --- FETCH DATA ASET ---
  const {
    data: asetList = [],
    isLoading,
    isError,
  } = useQuery<Aset[]>({
    queryKey: ["aset"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/aset", undefined, "pengguna");

      // Validasi ekstra: Cegah caching dari response yang gagal/kosong
      if (!res) return [];

      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? raw : [];
    },
    // KOREKSI UTAMA:
    // Memaksa query untuk mengabaikan cache lama dan selalu mengambil data
    // terbaru dari server setiap kali Anda menavigasi ke halaman ini.
    refetchOnMount: "always",
    // Opsional namun disarankan: Refetch saat Anda kembali membuka tab browser
    refetchOnWindowFocus: true,
  });

  // --- MUTATION DELETE ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/aset/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Dihapus", { description: "Data aset berhasil dihapus." });
      queryClient.invalidateQueries({ queryKey: ["aset"] });
      setIsDeleteModalOpen(false);
      setSelectedAset(null);
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message }),
  });

  // --- HANDLERS ---
  const handleDeleteClick = (aset: Aset) => {
    setSelectedAset(aset);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedAset) {
      await deleteMutation.mutateAsync(selectedAset.id);
    }
  };

  // --- RENDER HELPERS ---
  const renderStatusBadge = (status: StatusAset) => {
    switch (status) {
      case "tersedia":
        return (
          <Badge className="bg-[#718355] text-[#FFFAF3] font-bold border-none shadow-sm px-2.5 py-1">
            <CheckCircle2 className="w-3 h-3 mr-1.5" /> Tersedia
          </Badge>
        );
      case "digunakan":
        return (
          <Badge className="bg-[#0A2947] text-[#FFFAF3]/91 font-bold border-none shadow-sm px-2.5 py-1">
            <PlayCircle className="w-3 h-3 mr-1.5" /> Digunakan (Booking)
          </Badge>
        );
      case "perbaikan":
        return (
          <Badge className="bg-[#af8861] text-[#FFFAF3] font-bold border-none shadow-sm px-2.5 py-1">
            <Wrench className="w-3 h-3 mr-1.5" /> Perbaikan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-2.5 py-1">
            {status}
          </Badge>
        );
    }
  };

  const safeAsetList = Array.isArray(asetList) ? asetList : [];

  const filteredList = safeAsetList.filter((item) =>
    item?.namaAset?.toLowerCase().includes((searchQuery || "").toLowerCase()),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#F2EAE1] border border-[#0A2947]/10 rounded-xl shrink-0 shadow-sm">
            <Box className="w-7 h-7 text-[#D4A373]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Manajemen Aset
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Kelola meja, lapangan, ruangan, atau fasilitas yang dapat disewa.
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push("/dashboard/outlet/reservasi/aset/buatAset")}
          className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm h-11 px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2 text-[#D4A373]" /> Tambah Aset Baru
        </Button>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#F2EAE1] p-4 rounded-2xl border border-[#0A2947]/10 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder="Cari nama aset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/40 font-medium h-11"
          />
        </div>
        <div className="text-sm font-bold text-[#0A2947]/60 bg-white/50 px-4 py-2 rounded-lg border border-[#0A2947]/10 w-full sm:w-auto text-center">
          Total: {filteredList.length} Aset
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F2EAE1] text-[#0A2947]/60 border-b border-[#0A2947]/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 font-bold">Nama Aset</th>
                <th className="px-6 py-4 font-bold">Kategori / Tipe</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2947] border-t-transparent"></div>
                      <p className="text-sm font-bold text-[#0A2947]/60">
                        Memuat data...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-rose-500 font-bold"
                  >
                    <ServerCrash className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    Gagal memuat data aset.
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-[#0A2947]/5 flex items-center justify-center">
                        <Box className="w-6 h-6 text-[#0A2947]/30" />
                      </div>
                      <p className="text-sm font-bold text-[#0A2947]/50 mt-2">
                        {searchQuery
                          ? "Tidak ada aset yang cocok dengan pencarian."
                          : "Belum ada master data aset."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#0A2947]/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#0A2947]">
                        {item.namaAset}
                      </p>
                      <p className="text-xs font-medium text-[#0A2947]/50 mt-0.5 font-mono">
                        ID: {item.id.substring(0, 8)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#0A2947]/80 bg-[#0A2947]/5 px-2.5 py-1 rounded-md text-xs">
                        {item.dataAset?.namaTipeAset || "Tipe Tidak Diketahui"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          // Mengarahkan ke rute Edit yang benar
                          onClick={() =>
                            router.push(
                              `/dashboard/outlet/reservasi/aset/${item.id}/edit`,
                            )
                          }
                          className="h-8 px-3 cursor-pointer text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-[#0A2947]/10 font-bold"
                        >
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
                          className="h-8 px-2 cursor-pointer text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Hapus Data Aset?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Aset <b>{selectedAset?.namaAset}</b> akan dihapus secara permanen.
              Pastikan aset ini tidak sedang terhubung dengan riwayat transaksi
              yang penting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 text-[#FFFAF3] hover:bg-rose-700 font-bold cursor-pointer border-none shadow-sm"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Aset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
