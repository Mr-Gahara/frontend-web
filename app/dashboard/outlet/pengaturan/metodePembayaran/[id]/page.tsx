"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Wallet, Info, Loader2 } from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AkunKas } from "@/types/akunKas";
import {
  MetodePembayaranRequest,
  KategoriMetode,
} from "@/types/metodePembayaran";

export default function EditMetodePembayaranPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<MetodePembayaranRequest | null>(null);

  // 1. FETCH DETAIL DATA METODE UNTUK EDIT
  const { data: metode, isLoading: loadingMetode } = useQuery({
    queryKey: [...(queryKeys.metodePembayaran || ["metode-pembayaran"]), id],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/metodepembayaran/${id}`,
        undefined,
        "pengguna"
      );
      return res.data?.data || res.data || res;
    },
  });

  // 2. FETCH MASTER AKUN KAS (UNTUK DROPDOWN OPTIONS)
  const { data: akunKasList = [], isLoading: loadingAkun } = useQuery({
    queryKey: queryKeys.akunKas,
    queryFn: async (): Promise<AkunKas[]> => {
      try {
        const res = await apiClient.get<{ data: AkunKas[] } | AkunKas[]>(
          "/akunkas",
          undefined,
          "pengguna"
        );

        let rawData: AkunKas[] = [];
        if (Array.isArray(res)) {
          rawData = res;
        } else if (res && "data" in res && Array.isArray(res.data)) {
          rawData = res.data;
        }
        return rawData.filter((a) => a.status === "aktif");
      } catch (err: any) {
        if (err?.status === 404 || String(err).includes("not found")) return [];
        throw err;
      }
    },
  });

  // PRE-FILL FORM DENGAN PERBAIKAN COMPREHENSIVE SCANNING DATA
  useEffect(() => {
    if (metode) {
      // Mengamankan pembacaan field ID Kas baik berupa string maupun nested object
      const rawAkun = metode.akunKasID || metode.akunKas;
      let kasIdString = "";
      if (rawAkun) {
        kasIdString =
          typeof rawAkun === "object"
            ? rawAkun._id || rawAkun.id
            : String(rawAkun);
      }

      setForm({
        namaPembayaran: metode.namaPembayaran || "",
        kategori: metode.kategori || "non-tunai",
        akunKasID: kasIdString || "",
        isActive: metode.isActive ?? true,
        isAutomated: metode.isAutomated ?? false,
        xenditChannelCode: metode.xenditChannelCode || null,
      });
    }
  }, [metode]);

  // LOGIKA DETEKSI PERUBAHAN DATA UNTUK INTERAKSI DISABLED TOMBOL
  const isModified = useMemo(() => {
    if (!form || !metode) return false;

    const rawAkun = metode.akunKasID || metode.akunKas;
    let originalAkunId = "";
    if (rawAkun) {
      originalAkunId =
        typeof rawAkun === "object"
          ? rawAkun._id || rawAkun.id
          : String(rawAkun);
    }

    return (
      form.namaPembayaran !== (metode.namaPembayaran || "") ||
      form.kategori !== (metode.kategori || "non-tunai") ||
      form.akunKasID !== originalAkunId ||
      form.isActive !== (metode.isActive ?? true)
    );
  }, [form, metode]);

  // MUTATION: SIMPAN PERUBAHAN
  const updateMutation = useMutation({
    mutationFn: async (data: MetodePembayaranRequest) => {
      return await apiClient.put(
        `/metodepembayaran/${id}`,
        data,
        undefined,
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Metode pembayaran telah diperbarui.",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.metodePembayaran || ["metode-pembayaran"],
      });
      router.push("/dashboard/outlet/pengaturan/metodePembayaran");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal memperbarui metode pembayaran.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form?.akunKasID) {
      setFormError("Akun Tujuan wajib dipilih.");
      return;
    }

    await updateMutation.mutateAsync(form);
  };

  // Tampilan Loading Awal Laman
  if (loadingMetode || !form) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A2947]/60" />
        <p className="text-sm font-bold text-[#0A2947]/60">
          Memuat detail metode pembayaran...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Header & Navigasi */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/pengaturan/metodePembayaran")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Laman Metode
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Edit Metode Pembayaran
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Perbarui informasi atau ubah status saluran pembayaran POS Anda.
          </p>
        </div>
      </div>

      {/* Area Form (Dark Cream Card) */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 sm:p-8">
          
          {/* Section: Informasi Dasar */}
          <div className="space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[#0A2947]">
              <Wallet className="h-4 w-4 text-[#D4A373]" />
              Informasi Dasar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Nama Pembayaran <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Misal: Transfer Bank Mandiri"
                  value={form.namaPembayaran}
                  onChange={(e) =>
                    setForm({ ...form, namaPembayaran: e.target.value })
                  }
                  required
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <Select
                  value={form.kategori}
                  onValueChange={(val) =>
                    setForm({ ...form, kategori: val as KategoriMetode })
                  }
                >
                  <SelectTrigger className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] w-full">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="tunai" className="cursor-pointer hover:bg-[#0A2947]/5 font-medium">Tunai</SelectItem>
                    <SelectItem value="non-tunai" className="cursor-pointer hover:bg-[#0A2947]/5 font-medium">Non-Tutai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-[#0A2947]/10" />

          {/* Section: Penyaluran Dana (Akun Kas) */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Penyaluran Dana (Akun Tujuan) <span className="text-red-500">*</span>
              </label>
              
              {/* [BUG FIX]: Inject key dinamis gabungan id & panjang array opsi untuk memaksa re-sync paint */}
              <Select
                key={`${form.akunKasID}-${akunKasList.length}`}
                value={form.akunKasID}
                onValueChange={(val) => setForm({ ...form, akunKasID: val })}
                disabled={isMounted ? loadingAkun : false}
              >
                <SelectTrigger className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] w-full">
                  <SelectValue
                    placeholder={
                      loadingAkun ? "Memuat Akun Kas..." : "Pilih Akun Kas"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  {akunKasList.length === 0 ? (
                    <div className="p-3 text-sm text-[#0A2947]/50 font-medium text-center">
                      Tidak ada Akun Kas aktif.
                    </div>
                  ) : (
                    akunKasList.map((akun, index) => {
                      const validId = akun._id || (akun as any).id;
                      return (
                        <SelectItem
                          key={validId || `akunkas-opt-${index}`}
                          value={validId || ""}
                          className="cursor-pointer hover:bg-[#0A2947]/5 font-medium"
                        >
                          {akun.namaAkun} ({akun.nomorAkun})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs font-medium text-[#0A2947]/60">
                Semua uang yang masuk melalui metode ini akan bermuara ke Akun
                Kas di atas.
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-[#0A2947]/10" />

          {/* Section: Integrasi & Status */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isAutomated"
                  checked={form.isAutomated}
                  disabled
                  onCheckedChange={(val) =>
                    setForm({ ...form, isAutomated: val === true })
                  }
                  className="mt-1 cursor-not-allowed border-[#0A2947]/20 data-[state=checked]:bg-[#0A2947] data-[state=checked]:border-[#0A2947] data-[state=checked]:text-[#FFFAF3]"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="isAutomated"
                    className="text-sm font-bold leading-none text-[#0A2947]/50 peer-disabled:cursor-not-allowed"
                  >
                    Integrasi Payment Gateway Otomatis (Xendit)
                  </label>
                  <p className="text-xs font-medium text-[#0A2947]/40 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Saat ini fitur integrasi Xendit untuk Web Dashboard sedang
                    dalam perbaikan.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Status Operasional</label>
              <Select
                value={form.isActive ? "true" : "false"}
                onValueChange={(val) =>
                  setForm({ ...form, isActive: val === "true" })
                }
              >
                <SelectTrigger className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] w-full">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  <SelectItem value="true" className="cursor-pointer hover:bg-[#0A2947]/5 font-medium">Aktif</SelectItem>
                  <SelectItem value="false" className="cursor-pointer hover:bg-[#0A2947]/5 font-medium">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Menampilkan pesan error validasi */}
          {formError && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm font-bold text-red-600 border border-red-500/20">
              {formError}
            </div>
          )}

          {/* Aksi Form */}
          <div className="flex justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/outlet/pengaturan/metodePembayaran")}
              disabled={updateMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </Button>
            
            {/* Tombol Simpan Otomatis Mengunci Jika Tidak Ada Modifikasi */}
            <Button
              type="submit"
              disabled={updateMutation.isPending || !isModified}
              className={`cursor-pointer font-bold shadow-sm px-6 transition-all ${
                isModified 
                  ? "bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90" 
                  : "bg-[#0A2947]/30 text-[#FFFAF3] cursor-not-allowed"
              }`}
            >
              {updateMutation.isPending ? (
                "Menyimpan Perubahan..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}