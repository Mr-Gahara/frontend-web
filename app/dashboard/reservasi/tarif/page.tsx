"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tags,
  AlertTriangle,
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { Tarif } from "@/types/tarif";

// --- COLORS (Design Tokens) ---
const COLORS = {
  navy: "#0A2947",
  cream: "#FFFAF3",
  darkCream: "#F2EAE1",
  gold: "#D4A373",
  sage: "#718355",
  rose: "#F43F5E",
};

const HARI_MAP = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function DaftarTarifPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTarifId, setSelectedTarifId] = useState<string | null>(null);

  // --- FETCH DATA ---
  const {
    data: tarifList = [],
    isLoading,
    isError,
  } = useQuery<Tarif[]>({
    queryKey: queryKeys.tarif,
    queryFn: async () => {
      const res = await apiClient.get<{ data: Tarif[] }>(
        "/tarif",
        undefined,
        "pengguna",
      );
      return res.data || [];
    },
  });

  // --- MUTATION HAPUS ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/tarif/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Tarif Berhasil Dihapus");
      queryClient.invalidateQueries({ queryKey: queryKeys.tarif });
      setDeleteModalOpen(false);
      setSelectedTarifId(null);
    },
    onError: (error: any) => {
      toast.error("Gagal Menghapus", {
        description:
          error.message || "Terjadi kesalahan saat menghapus data tarif.",
      });
      setDeleteModalOpen(false);
      setSelectedTarifId(null);
    },
  });

  // FIX: gunakan fallback _id || id, konsisten dengan tombol Edit.
  // Sebelumnya hanya menerima `id: string` dari item._id saja,
  // sehingga jika API mengembalikan field `id` (bukan `_id`),
  // selectedTarifId menjadi undefined dan confirmDelete() gagal jalan.
  const handleDeleteClick = (id: string | undefined) => {
    if (!id) {
      toast.error("Gagal Menghapus", {
        description: "ID tarif tidak ditemukan pada data ini.",
      });
      return;
    }
    setSelectedTarifId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTarifId) {
      deleteMutation.mutate(selectedTarifId);
    }
  };

  // --- FILTERING ---
  const filteredList = tarifList.filter((item) =>
    item.namaTarif.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Helper Format Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // Helper Format Hari Aktif
  const formatHariAktif = (hariArray?: number[]) => {
    if (!hariArray || hariArray.length === 0 || hariArray.length === 7)
      return "Setiap Hari";
    return hariArray.map((h) => HARI_MAP[h]).join(", ");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER SECTION (Sub-header) */}
      <div
        className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-2xl p-4 sm:p-5 border shadow-sm"
        style={{
          background: COLORS.darkCream,
          borderColor: `${COLORS.navy}15`,
        }}
      >
        <div className="relative w-full sm:max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: `${COLORS.navy}80` }}
          />
          <Input
            placeholder="Cari nama tarif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-medium h-11 border-none shadow-sm focus-visible:ring-1"
            style={{
              background: COLORS.cream,
              color: COLORS.navy,
              boxShadow: "0 1px 2px rgba(10,41,71,0.05)",
            }}
          />
        </div>
        <Button
          onClick={() => router.push("/dashboard/reservasi/tarif/buatTarif")}
          className="w-full sm:w-auto font-bold h-11 px-6 shadow-sm hover:-translate-y-0.5 transition-transform"
          style={{ background: COLORS.navy, color: COLORS.cream }}
        >
          <Plus className="w-4 h-4 mr-2" style={{ color: COLORS.gold }} />{" "}
          Tambah Tarif
        </Button>
      </div>

      {/* DATA TABLE SECTION */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden flex flex-col"
        style={{ background: COLORS.cream, borderColor: `${COLORS.navy}15` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead
              className="uppercase tracking-wider text-[11px]"
              style={{
                background: COLORS.darkCream,
                color: `${COLORS.navy}99`,
              }}
            >
              <tr>
                <th className="px-6 py-4 font-bold">Nama & Status Tarif</th>
                <th className="px-6 py-4 font-bold text-right">Harga Sewa</th>
                <th className="px-6 py-4 font-bold">Basis / Durasi Min.</th>
                <th className="px-6 py-4 font-bold">Jadwal Berlaku</th>
                <th className="px-6 py-4 font-bold">Kategori Aset</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: `${COLORS.navy}10` }}
            >
              {isLoading ? (
                <tr key="loading">
                  {/* FIX: colSpan disesuaikan dari 5 -> 6 (jumlah kolom aktual di <thead>) */}
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div
                        className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                        style={{
                          borderColor: COLORS.navy,
                          borderTopColor: "transparent",
                        }}
                      ></div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: `${COLORS.navy}80` }}
                      >
                        Memuat data tarif...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr key="error">
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center font-bold"
                    style={{ color: COLORS.rose }}
                  >
                    Gagal memuat data tarif. Pastikan server terhubung.
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr key="empty">
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: `${COLORS.navy}05` }}
                      >
                        <Tags
                          className="w-6 h-6"
                          style={{ color: `${COLORS.navy}40` }}
                        />
                      </div>
                      <p
                        className="text-sm font-bold mt-2"
                        style={{ color: `${COLORS.navy}60` }}
                      >
                        {searchQuery
                          ? "Tidak ada tarif yang cocok."
                          : "Belum ada data tarif yang dibuat."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => (
                  <tr
                    key={item._id || item.id || index}
                    className="transition-colors hover:bg-[#F2EAE1]"
                  >
                    {/* NAMA TARIF & STATUS */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <p
                          className="font-bold text-[15px] tracking-tight"
                          style={{ color: COLORS.navy }}
                        >
                          {item.namaTarif}
                        </p>
                        <div className="flex items-center gap-2">
                          {item.isActive ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
                              style={{
                                background: `${COLORS.sage}20`,
                                color: COLORS.sage,
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Aktif
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
                              style={{
                                background: `${COLORS.rose}15`,
                                color: COLORS.rose,
                              }}
                            >
                              <XCircle className="w-3 h-3" /> Nonaktif
                            </span>
                          )}
                          <span
                            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                            style={{
                              background: `${COLORS.gold}20`,
                              color: "#A67C00",
                            }}
                          >
                            Prioritas: {item.prioritas}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* HARGA */}
                    <td className="px-6 py-4 text-right">
                      <span
                        className="font-bold text-[15px]"
                        style={{ color: COLORS.navy }}
                      >
                        {formatRupiah(item.harga)}
                      </span>
                    </td>

                    {/* BASIS PERHITUNGAN */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-lg w-fit"
                          style={{
                            background: `${COLORS.navy}08`,
                            color: COLORS.navy,
                          }}
                        >
                          <Clock
                            className="w-3.5 h-3.5"
                            style={{ color: COLORS.gold }}
                          />
                          {item.basisPerhitungan}
                        </span>
                        {item.durasiMinimum && (
                          <span
                            className="text-[11px] font-medium ml-1"
                            style={{ color: `${COLORS.navy}70` }}
                          >
                            Min. {item.durasiMinimum}{" "}
                            {item.basisPerhitungan === "per jam"
                              ? "Jam"
                              : "Sesi"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* JADWAL BERLAKU */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: `${COLORS.navy}80` }}
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatHariAktif(item.hariAktif)}
                        </span>
                        <span
                          className="text-[11px] font-medium ml-5"
                          style={{ color: `${COLORS.navy}60` }}
                        >
                          {item.jamMulai && item.jamSelesai
                            ? `${item.jamMulai} - ${item.jamSelesai}`
                            : "24 Jam Penuh"}
                        </span>
                      </div>
                    </td>

                    {/* TIPE ASET TERKAIT */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-45">
                        {item.tipeAsetID && item.tipeAsetID.length > 0 ? (
                          item.tipeAsetID.map((aset, i) => (
                            <span
                              key={aset._id || i}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                              style={{
                                borderColor: `${COLORS.navy}20`,
                                color: `${COLORS.navy}80`,
                              }}
                            >
                              {aset.namaTipeAset}
                            </span>
                          ))
                        ) : (
                          <span
                            className="text-[11px] font-medium italic"
                            style={{ color: `${COLORS.navy}50` }}
                          >
                            Semua Aset
                          </span>
                        )}
                      </div>
                    </td>

                    {/* AKSI */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/reservasi/tarif/${item._id || item.id}/edit`,
                            )
                          }
                          className="h-8 px-3 transition-colors hover:bg-[#F2EAE1] hover:text-[#0A2947]"
                          style={{ color: `${COLORS.navy}80` }}
                        >
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          // FIX: sebelumnya item._id saja, sekarang fallback item._id || item.id
                          onClick={() => handleDeleteClick(item._id || item.id)}
                          className="h-8 px-2 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          style={{ color: COLORS.rose }}
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
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent
          className="border-none shadow-xl"
          style={{ background: COLORS.cream }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className="flex items-center gap-2"
              style={{ color: COLORS.rose }}
            >
              <AlertTriangle className="w-5 h-5" /> Hapus Tarif?
            </AlertDialogTitle>
            <AlertDialogDescription
              className="font-medium"
              style={{ color: `${COLORS.navy}80` }}
            >
              Tarif yang dihapus tidak dapat dikembalikan dan aset yang
              menggunakan tarif default ini mungkin perlu disetel ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="font-bold border-none transition-colors hover:bg-black/5"
              style={{ color: COLORS.navy }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="font-bold shadow-sm cursor-pointer border-none transition-transform hover:scale-105"
              style={{ background: COLORS.rose, color: COLORS.cream }}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Tarif"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
