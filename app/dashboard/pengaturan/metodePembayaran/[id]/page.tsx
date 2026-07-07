"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Wallet, Info, Loader2 } from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AkunKas } from "@/types/akunKas";
import { MetodePembayaran, MetodePembayaranRequest, KategoriMetode } from "@/types/metodePembayaran";

export default function EditMetodePembayaranPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  // 1. Fetch Detail Data untuk Edit
  const { data: metode, isLoading: loadingMetode } = useQuery({
    queryKey: [...queryKeys.metodePembayaran, id],
    queryFn: async () => {
      const res = await apiClient.get<MetodePembayaran>(`/metodepembayaran/${id}`, undefined, "pengguna");
      return res;
    },
  });

  // 2. Fetch Akun Kas (untuk Dropdown)
  const { data: akunKasList = [] } = useQuery({
    queryKey: queryKeys.akunKas,
    queryFn: async (): Promise<AkunKas[]> => {
      const res = await apiClient.get<{ data: AkunKas[] } | AkunKas[]>("/akunkas", undefined, "pengguna");
      return Array.isArray(res) ? res.filter(a => a.status === "aktif") : res.data.filter(a => a.status === "aktif");
    },
  });

  const [form, setForm] = useState<MetodePembayaranRequest | null>(null);

  // Pre-fill form saat data metode didapat
  useEffect(() => {
    if (metode) {
      setForm({
        namaPembayaran: metode.namaPembayaran,
        kategori: metode.kategori,
        akunKasID: metode.akunKasID?._id || "",
        isActive: metode.isActive,
        isAutomated: metode.isAutomated,
        xenditChannelCode: metode.xenditChannelCode,
      });
    }
  }, [metode]);

  const updateMutation = useMutation({
    mutationFn: async (data: MetodePembayaranRequest) => {
      return await apiClient.put(`/metodepembayaran/${id}`, data, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Metode pembayaran telah diperbarui." });
      queryClient.invalidateQueries({ queryKey: queryKeys.metodePembayaran });
      router.push("/dashboard/pengaturan/metodePembayaran");
    },
    onError: (err: any) => toast.error("Gagal update", { description: err.message }),
  });

  if (loadingMetode || !form) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <div className="flex items-center gap-4 border-b pb-6">
        <Link href="/dashboard/pengaturan/metodePembayaran">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Metode Pembayaran</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-6">
        <div className="space-y-2">
            <label className="text-sm font-medium">Nama Pembayaran *</label>
            <Input value={form.namaPembayaran} onChange={(e) => setForm({...form, namaPembayaran: e.target.value})} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Akun Tujuan *</label>
          <Select value={form.akunKasID} onValueChange={(val) => setForm({...form, akunKasID: val})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {akunKasList.map(akun => (
                <SelectItem key={akun._id} value={akun._id || (akun as any).id}>{akun.namaAkun}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </form>
    </div>
  );
}