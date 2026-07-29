"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { BahanBaku } from "@/types/bahanBaku";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  CheckCircle2,
  Package,
} from "lucide-react";

export default function DaftarBahanBakuPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBahanId, setSelectedBahanId] = useState<string | null>(null);

  // --- FETCH DATA ---
  const {
    data: bahanBakuList = [],
    isLoading,
    isError,
  } = useQuery<any[]>({ // Menggunakan any[] sementara agar fleksibel membaca id / _id
    queryKey: queryKeys.bahanBaku,
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(
          "/bahan-baku",
          undefined,
          "pengguna"
        );
        return res.data?.data || res.data || [];
      } catch (error) {
        const res = await apiClient.get<any>(
          "/bahanBaku",
          undefined,
          "pengguna"
        );
        return res.data?.data || res.data || [];
      }
    },
  });

  // --- MUTATION HAPUS ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        return await apiClient.delete(
          `/bahan-baku/${id}`,
          undefined,
          "pengguna"
        );
      } catch (error) {
        return await apiClient.delete(
          `/bahanBaku/${id}`,
          undefined,
          "pengguna"
        );
      }
    },
    onSuccess: () => {
      toast.success("Berhasil Dihapus", {
        description: "Data bahan baku telah dihapus dari sistem.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bahanBaku });
      setDeleteModalOpen(false);
      setSelectedBahanId(null);
    },
    onError: (error: any) => {
      toast.error("Gagal Menghapus", {
        description: error.message || "Terjadi kesalahan saat menghapus data.",
      });
      setDeleteModalOpen(false);
      setSelectedBahanId(null);
    },
  });

  // --- HANDLER HAPUS ---
  const handleDeleteClick = (id: string) => {
    setSelectedBahanId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBahanId) {
      deleteMutation.mutate(selectedBahanId);
    }
  };

  // --- FILTERING ---
  const filteredList = bahanBakuList.filter((item) =>
    (item.namaBahan || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#F2EAE1] border border-[#0A2947]/10 rounded-xl shrink-0 shadow-sm">
            <Package className="w-7 h-7 text-[#D4A373]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Bahan Baku
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Kelola stok persediaan bahan mentah untuk keperluan produksi atau
              resep.
            </p>
          </div>
        </div>

        <Button
          onClick={() =>
            router.push("/dashboard/outlet/inventaris/bahanBaku/buatBahanBaku")
          }
          className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm h-11 px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2 text-[#D4A373]" /> Tambah Bahan Baru
        </Button>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#F2EAE1] p-4 rounded-2xl border border-[#0A2947]/10 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder="Cari nama bahan baku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/40 font-medium h-11"
          />
        </div>
        <div className="text-sm font-bold text-[#0A2947]/60 bg-white/50 px-4 py-2 rounded-lg border border-[#0A2947]/10 w-full sm:w-auto text-center">
          Total: {filteredList.length} Bahan Baku
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F2EAE1] text-[#0A2947]/60 border-b border-[#0A2947]/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 font-bold">Nama Bahan Baku</th>
                <th className="px-6 py-4 font-bold text-center">
                  Stok Saat Ini
                </th>
                <th className="px-6 py-4 font-bold text-center">
                  Minimal Stok
                </th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
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
                    colSpan={5}
                    className="px-6 py-12 text-center text-rose-500 font-bold"
                  >
                    Gagal memuat data bahan baku. Silakan muat ulang halaman.
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Box className="w-12 h-12 text-[#0A2947]/20" />
                      <p className="text-sm font-bold text-[#0A2947]/50">
                        {searchQuery
                          ? "Tidak ada bahan baku yang cocok dengan pencarian."
                          : "Belum ada data bahan baku."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  // FIX: Defensively extract the ID whether it's mapped as `id` or raw `_id`
                  const currentId = item.id || item._id;
                  const isKritis = item.stok <= item.minimalStok;

                  return (
                    <tr
                      key={currentId}
                      className="hover:bg-[#0A2947]/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#0A2947]">
                          {item.namaBahan}
                        </p>
                        <p className="text-xs font-medium text-[#0A2947]/50 mt-0.5">
                          ID: {currentId?.substring(0, 8)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-[#0A2947] bg-[#0A2947]/5 px-2 py-1 rounded-md">
                          {item.stok} {item.satuan}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center text-[#0A2947]/60 font-mono font-bold">
                        {item.minimalStok} {item.satuan}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {isKritis ? (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none shadow-sm px-2.5 py-1">
                            <AlertTriangle className="w-3 h-3 mr-1.5" /> Stok
                            Kritis
                          </Badge>
                        ) : (
                          <Badge className="bg-[#718355] text-[#FFFAF3] font-bold border-none shadow-sm px-2.5 py-1">
                            <CheckCircle2 className="w-3 h-3 mr-1.5" /> Aman
                          </Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/outlet/inventaris/bahanBaku/${currentId}/edit`,
                              )
                            }
                            className="h-8 px-3 text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-[#0A2947]/10 font-bold"
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(currentId)}
                            className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Hapus Bahan Baku?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Data bahan baku yang dihapus tidak dapat dikembalikan. Pastikan
              bahan baku ini tidak sedang digunakan pada resep produk manapun.
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
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}