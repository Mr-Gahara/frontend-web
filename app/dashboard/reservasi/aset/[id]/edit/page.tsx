"use client";
import { useRouter, useParams } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { AsetPayload } from "@/types/aset";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TipeAset } from "@/types/tipeAset";
import { queryKeys } from "@/lib/queryKeys";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle2,
  Wrench,
  Layers,
  Edit3,
  Loader2,
  AlertTriangle,
  Info,
  PlayCircle,
} from "lucide-react";

const asetSchema = z.object({
  namaAset: z.string().min(1, "Nama aset wajib diisi"),
  tipeAsetID: z.string().min(1, "Kategori / Tipe aset wajib dipilih"),
  status: z.enum(["tersedia", "perbaikan", "digunakan"]).default("tersedia"),
});
type AsetFormInput = z.input<typeof asetSchema>;

export default function EditAsetPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const rawId = params?.id as string;
  const asetId = rawId === "undefined" || !rawId ? null : rawId;

  // --- 1. FETCH DATA ASET ---
  const {
    data: asetData,
    isLoading: isLoadingAset,
    isError: isErrorAset,
  } = useQuery({
    queryKey: [...queryKeys.aset, asetId],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/aset/${asetId}`, undefined, "pengguna");
      return res.data;
    },
    enabled: !!asetId,
  });

  // --- 2. FETCH TIPE ASET ---
  const { data: tipeAsetList = [], isLoading: isLoadingTipeAset } = useQuery<TipeAset[]>({
    queryKey: queryKeys.tipeAset,
    queryFn: async () => {
      const res = await apiClient.get<{ data: any[] }>("/tipeAset", undefined, "pengguna");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // --- 3. REACT HOOK FORM — mount setelah data siap via early return di bawah ---
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AsetFormInput>({
    resolver: zodResolver(asetSchema),
    defaultValues: {
      namaAset: asetData?.namaAset || "",
      tipeAsetID: asetData?.dataAset?.id || "",
      status: (asetData?.status as AsetFormInput["status"]) || "tersedia",
    },
  });

  // --- 4. MUTATION UPDATE ---
  const updateMutation = useMutation<any, Error, AsetPayload>({
    mutationFn: async (payload: AsetPayload) => {
      return await apiClient.put(`/aset/${asetId}`, payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil Diperbarui", {
        description: "Perubahan data aset telah tersimpan di sistem.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.aset });
      router.push("/dashboard/reservasi/aset");
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui", {
        description: err.message || "Terjadi kesalahan saat menyimpan aset.",
      });
    },
  });

  const onSubmit = (data: AsetFormInput) => {
    if (!asetId) return;
    const payload: AsetPayload = {
      namaAset: data.namaAset.trim(),
      tipeAsetID: data.tipeAsetID,
      status: data.status as "tersedia" | "perbaikan",
    };
    updateMutation.mutate(payload);
  };

  // --- EARLY RETURNS ---
  if (!asetId) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-[#0A2947]">ID Aset Tidak Valid</h2>
        <p className="text-sm font-medium text-[#0A2947]/80">
          Sistem mendeteksi bahwa ID pada URL ini rusak. Silakan kembali ke halaman sebelumnya.
        </p>
        <Button onClick={() => router.push("/dashboard/reservasi/aset")} className="mt-4 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Aset
        </Button>
      </div>
    );
  }

  if (isLoadingAset || isLoadingTipeAset) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#0A2947]/60" />
        <p className="text-sm font-bold text-[#0A2947]/80">Memuat data aset...</p>
      </div>
    );
  }

  if (isErrorAset) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-[#0A2947]">Data Tidak Ditemukan</h2>
        <p className="text-sm font-medium text-[#0A2947]/80">
          Gagal mengambil data aset. Data mungkin sudah dihapus atau server sedang bermasalah.
        </p>
        <Button onClick={() => router.push("/dashboard/reservasi/aset")} className="mt-4 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-4">
        <Button type="button" variant="ghost" size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/reservasi/aset")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Aset
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Edit Aset</h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Perbarui nama, kategori tarif, atau ubah status operasional dari fasilitas Anda.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <Edit3 className="h-5 w-5 text-[#D4A373]" />
            <h3 className="text-base font-bold text-[#0A2947]">Informasi Detail Aset</h3>
          </div>

          {/* NAMA ASET */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Nama Aset / Nomor Meja <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register("namaAset")}
              placeholder="Contoh: Meja Billiard 01, VIP Room A..."
              className={cn(
                "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947] h-11",
                errors.namaAset && "border-rose-500 focus-visible:ring-rose-500",
              )}
            />
            <div className="min-h-4">
              {errors.namaAset ? (
                <span className="text-xs font-bold text-rose-500">{errors.namaAset.message}</span>
              ) : (
                <p className="text-[10px] font-medium text-[#0A2947]/50">
                  Identitas unik aset ini agar mudah dikenali oleh kasir dan pelanggan.
                </p>
              )}
            </div>
          </div>

          {/* TIPE ASET */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0A2947]/60" />
              Tipe / Kategori Aset <span className="text-rose-500">*</span>
            </label>
            <Controller
              name="tipeAsetID"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={cn(
                    "w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-11 focus:ring-1 focus:ring-[#0A2947]",
                    errors.tipeAsetID && "border-rose-500 focus:ring-rose-500",
                  )}>
                    <SelectValue placeholder="Pilih kategori tipe aset" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    {tipeAsetList.length === 0 ? (
                      <div className="p-3 text-sm text-center font-medium text-[#0A2947]/60">
                        Belum ada tipe aset. <br /> Buat tipe aset terlebih dahulu.
                      </div>
                    ) : (
                      tipeAsetList.map((tipe: TipeAset) => (
                        <SelectItem key={tipe.id} value={tipe.id} className="cursor-pointer hover:bg-[#0A2947]/5 font-bold">
                          {tipe.namaTipeAset}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <div className="min-h-4">
              {errors.tipeAsetID ? (
                <span className="text-xs font-bold text-rose-500">{errors.tipeAsetID.message}</span>
              ) : (
                <p className="text-[10px] font-medium text-[#0A2947]/50">
                  Tipe aset menentukan harga/tarif sewa yang akan diberlakukan pada aset ini.
                </p>
              )}
            </div>
          </div>

          {/* STATUS */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">Status Operasional</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-11 focus:ring-1 focus:ring-[#0A2947]">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="tersedia" className="cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-700 font-bold">
                      <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Tersedia (Siap Disewa)</div>
                    </SelectItem>
                    <SelectItem value="perbaikan" className="cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-amber-700 font-bold">
                      <div className="flex items-center"><Wrench className="w-4 h-4 mr-2" /> Dalam Perbaikan</div>
                    </SelectItem>
                    {field.value === "digunakan" && (
                      <SelectItem value="digunakan" disabled className="cursor-not-allowed text-blue-700 font-bold">
                        <div className="flex items-center"><PlayCircle className="w-4 h-4 mr-2" /> Sedang Digunakan (Sewa Aktif)</div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {asetData?.status === "digunakan" ? (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-3">
                <p className="text-xs font-bold text-blue-800 flex items-center">
                  <Info className="w-4 h-4 mr-1.5" /> Perhatian
                </p>
                <p className="text-xs text-blue-700/80 font-medium mt-1 leading-relaxed">
                  Aset ini saat ini berstatus <b>"digunakan"</b> di sistem penyewaan aktif. Jika Anda memaksanya menjadi "tersedia", hal ini dapat menyebabkan konflik sesi.
                </p>
              </div>
            ) : (
              <p className="text-[10px] font-medium text-[#0A2947]/50 pt-1">
                Catatan: Status "Digunakan" akan diatur secara otomatis oleh sistem saat transaksi berjalan.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#0A2947]/10 mt-2">
          <Button type="button" variant="outline"
            onClick={() => router.push("/dashboard/reservasi/aset")}
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-12 px-8"
          >
            Batal
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}
            className="w-full sm:w-auto cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold h-12 px-8"
          >
            {updateMutation.isPending ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}