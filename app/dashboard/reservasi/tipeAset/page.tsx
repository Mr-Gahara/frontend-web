"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { TipeAset } from "@/types/tipeAset";
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
  AlertTriangle,
  ServerCrash,
  Layers,
  Tags,
} from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";

export default function TipeAsetPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTipeAset, setSelectedTipeAset] = useState<TipeAset | null>(
    null,
  );

  // --- FETCH DATA TIPE ASET ---
  const {
    data: tipeAsetList = [],
    isLoading,
    isError,
  } = useQuery<TipeAset[]>({
    queryKey: queryKeys.tipeAset,
    queryFn: async () => {
      const res = await apiClient.get<{ data: TipeAset[] }>(
        "/tipeAset",
        undefined,
        "pengguna",
      );
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // --- MUTATION DELETE ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/tipAset/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Dihapus", {
        description: "Data Tipe Aset berhasil dihapus.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tipeAset });
      setIsDeleteModalOpen(false);
      setSelectedTipeAset(null);
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message }),
  });

  // --- HANDLERS ---
  const handleDeleteClick = (tipeAset: TipeAset) => {
    setSelectedTipeAset(tipeAset);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedTipeAset) {
      // Prioritaskan id dari mapper, fallback ke _id
      const idToDetele = selectedTipeAset.id || selectedTipeAset._id;
      if (idToDetele) {
        await deleteMutation.mutateAsync(idToDetele);
      }
    }
  };

  const filteredList = tipeAsetList.filter((item) =>
    item.namaTipeAset.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#F2EAE1] border border-[#0A2947]/10 rounded-xl shrink-0 shadow-sm">
            <Layers className="w-7 h-7 text-[#D4A373]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Tipe Aset & Kategori
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Kelompokkan aset Anda berdasarkan tipe untuk mempermudah
              pengaturan tarif.
            </p>
          </div>
        </div>

        <Button
          onClick={() =>
            router.push("/dashboard/reservasi/tipeAset/buatTipeAset")
          }
          className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm h-11 px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2 text-[#D4A373]" /> Tambah Tipe Aset
        </Button>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#F2EAE1] p-4 rounded-2xl border border-[#0A2947]/10 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder="Cari nama tipe aset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/40 font-medium h-11"
          />
        </div>
        <div className="text-sm font-bold text-[#0A2947]/60 bg-white/50 px-4 py-2 rounded-lg border border-[#0A2947]/10 w-full sm:w-auto text-center">
          Total: {filteredList.length} Tipe
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F2EAE1] text-[#0A2947]/60 border-b border-[#0A2947]/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 font-bold">Nama Tipe Aset</th>
                <th className="px-6 py-4 font-bold">Deskripsi</th>
                <th className="px-6 py-4 font-bold text-center">
                  Relasi Tarif
                </th>
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
                    Gagal memuat data tipe aset.
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-[#0A2947]/5 flex items-center justify-center">
                        <Layers className="w-6 h-6 text-[#0A2947]/30" />
                      </div>
                      <p className="text-sm font-bold text-[#0A2947]/50 mt-2">
                        {searchQuery
                          ? "Tidak ada tipe aset yang cocok dengan pencarian."
                          : "Belum ada master data tipe aset."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id || item._id}
                    className="hover:bg-[#0A2947]/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#0A2947]">
                        {item.namaTipeAset}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0A2947]/70 line-clamp-2 max-w-xs">
                        {item.deskripsi || (
                          <span className="italic opacity-50">
                            Tidak ada deskripsi
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant="outline"
                        className="bg-[#0A2947]/5 text-[#0A2947] border-none shadow-sm px-2.5 py-1 font-bold"
                      >
                        <Tags className="w-3 h-3 mr-1.5" />
                        {item.dataTarif?.length || 0} Tarif Terhubung
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/reservasi/tipeAset/${item.id || item._id}/edit`,
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
              <AlertTriangle className="w-5 h-5" /> Hapus Tipe Aset?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Tipe <b>{selectedTipeAset?.namaTipeAset}</b> akan dihapus secara
              permanen. Sistem secara otomatis akan melepas (<i>unassign</i>)
              tipe ini dari daftar Tarif yang terhubung. Apakah Anda yakin?
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
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Tipe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
