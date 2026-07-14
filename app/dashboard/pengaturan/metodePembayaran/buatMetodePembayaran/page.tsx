"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Wallet, Info } from "lucide-react";

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
  KategoriMetode,
  MetodePembayaranRequest,
} from "@/types/metodePembayaran";

export default function BuatMetodePembayaranPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<MetodePembayaranRequest>({
    namaPembayaran: "",
    kategori: "non-tunai",
    akunKasID: "",
    isActive: true,
    isAutomated: false,
    xenditChannelCode: null,
  });

  const { data: akunKasList = [], isLoading: loadingAkun } = useQuery({
    queryKey: queryKeys.akunKas,
    queryFn: async (): Promise<AkunKas[]> => {
      try {
        const res = await apiClient.get<{ data: AkunKas[] } | AkunKas[]>("/akunkas", undefined, "pengguna");
        let rawData: AkunKas[] = [];
        if (Array.isArray(res)) rawData = res;
        else if (res && "data" in res && Array.isArray(res.data)) rawData = res.data;
        return rawData.filter((a) => a.status === "aktif");
      } catch (err: any) {
        if (err?.status === 404 || String(err).includes("not found")) return [];
        throw err;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MetodePembayaranRequest) => await apiClient.post("/metodepembayaran", data, undefined, "pengguna"),
    onSuccess: () => {
      toast.success("Berhasil", { description: "Metode pembayaran baru telah ditambahkan." });
      queryClient.invalidateQueries({ queryKey: queryKeys.metodePembayaran });
      router.push("/dashboard/pengaturan/metodePembayaran");
    },
    onError: (err: any) => setFormError(err.message || "Gagal menyimpan metode pembayaran."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.akunKasID) return setFormError("Akun Tujuan wajib dipilih.");
    await createMutation.mutateAsync(form);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      
      {/* Header & Navigasi dengan Tombol Back Teks */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/pengaturan/metodePembayaran")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Laman Metode
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Tambah Metode Pembayaran</h1>
          <p className="text-sm font-medium text-[#0A2947]/60">Buat saluran pembayaran baru untuk sistem kasir POS Anda.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 sm:p-8">
          
          <div className="space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[#0A2947]">
              <Wallet className="h-4 w-4 text-[#D4A373]" /> Informasi Dasar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Nama Pembayaran <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Misal: Transfer Bank Mandiri"
                  value={form.namaPembayaran}
                  onChange={(e) => setForm({ ...form, namaPembayaran: e.target.value })}
                  required
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Kategori <span className="text-red-500">*</span></label>
                <Select value={form.kategori} onValueChange={(val) => setForm({ ...form, kategori: val as KategoriMetode })}>
                  <SelectTrigger className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] w-full">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="tunai" className="cursor-pointer hover:bg-[#0A2947]/5 font-medium">Tunai</SelectItem>
                    <SelectItem value="non-tunai" className="cursor-pointer hover:bg-[#0A2947]/5 font-medium">Non-Tunai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-[#0A2947]/10" />

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Penyaluran Dana (Akun Tujuan) <span className="text-red-500">*</span></label>
              <Select value={form.akunKasID} onValueChange={(val) => setForm({ ...form, akunKasID: val })} disabled={isMounted ? loadingAkun : false}>
                <SelectTrigger className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] w-full">
                  <SelectValue placeholder={loadingAkun ? "Memuat Akun Kas..." : "Pilih Akun Kas"} />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  {akunKasList.length === 0 ? (
                    <div className="p-3 text-sm text-[#0A2947]/50 font-medium text-center">Tidak ada Akun Kas aktif.</div>
                  ) : (
                    akunKasList.map((akun, index) => {
                      const validId = akun._id || (akun as any).id;
                      return (
                        <SelectItem key={validId || `akunkas-opt-${index}`} value={validId || ""} className="cursor-pointer hover:bg-[#0A2947]/5 font-medium">
                          {akun.namaAkun} ({akun.nomorAkun})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs font-medium text-[#0A2947]/60">Semua uang yang masuk melalui metode ini akan bermuara ke Akun Kas di atas.</p>
            </div>
          </div>

          <div className="h-px w-full bg-[#0A2947]/10" />

          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isAutomated"
                  checked={form.isAutomated}
                  disabled
                  onCheckedChange={(val) => setForm({ ...form, isAutomated: val === true })}
                  className="mt-1 cursor-not-allowed border-[#0A2947]/20 data-[state=checked]:bg-[#0A2947] data-[state=checked]:border-[#0A2947] data-[state=checked]:text-[#FFFAF3]"
                />
                <div className="space-y-1">
                  <label htmlFor="isAutomated" className="text-sm font-bold leading-none text-[#0A2947]/50 peer-disabled:cursor-not-allowed">Integrasi Payment Gateway Otomatis (Xendit)</label>
                  <p className="text-xs font-medium text-[#0A2947]/40 flex items-center gap-1"><Info className="h-3 w-3" /> Saat ini fitur integrasi Xendit untuk Web Dashboard sedang dalam perbaikan.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Status Operasional</label>
              <Select value={form.isActive ? "true" : "false"} onValueChange={(val) => setForm({ ...form, isActive: val === "true" })}>
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

          {formError && <div className="rounded-md bg-red-500/10 p-3 text-sm font-bold text-red-600 border border-red-500/20">{formError}</div>}

          <div className="flex justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-2">
            <Link href="/dashboard/pengaturan/metodePembayaran">
              <Button type="button" variant="outline" disabled={createMutation.isPending} className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">Batal</Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending} className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold px-6">
              {createMutation.isPending ? "Menyimpan..." : <><Save className="mr-2 h-4 w-4" /> Simpan Metode</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}