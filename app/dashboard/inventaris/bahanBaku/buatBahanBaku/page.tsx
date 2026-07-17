"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BahanBakuRequest, SatuanBahan } from "@/types/bahanBaku";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, PackagePlus, Info, Save } from "lucide-react";

// Opsi satuan sesuai dengan model backend
const SATUAN_OPTIONS: SatuanBahan[] = ["kg", "gram", "liter", "ml", "pcs", "pak", "unit"];

export default function BuatBahanBakuPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<BahanBakuRequest>({
    namaBahan: "",
    satuan: "gram", // Default value
    stok: 0,
    minimalStok: 0,
  });

  const [stokInput, setStokInput] = useState("");
  const [minimalStokInput, setMinimalStokInput] = useState("");
  const [formError, setFormError] = useState("");

  // --- MUTATION CREATE ---
  const createMutation = useMutation({
    mutationFn: async (payload: BahanBakuRequest) => {
      try {
        return await apiClient.post("/bahan-baku", payload, undefined, "pengguna");
      } catch (error) {
        // Fallback jika endpoint backend menggunakan camelCase
        return await apiClient.post("/bahanBaku", payload, undefined, "pengguna");
      }
    },
    onSuccess: () => {
      toast.success("Berhasil Menambahkan", {
        description: "Bahan baku baru berhasil disimpan ke sistem.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bahanBaku });
      router.push("/dashboard/inventaris/bahanBaku");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal menyimpan bahan baku.");
    },
  });

  // --- HANDLER SUBMIT ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.namaBahan.trim()) {
      return setFormError("Nama bahan baku wajib diisi.");
    }
    if (!form.satuan) {
      return setFormError("Silakan pilih satuan bahan baku.");
    }

    createMutation.mutate(form);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/inventaris/bahanBaku")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Bahan Baku
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Tambah Bahan Baku
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Masukkan detail persediaan bahan mentah baru ke dalam sistem.
          </p>
        </div>
      </div>

      {/* FORM SECTION (Dark Cream Card) */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 sm:p-8">
          
          <div className="flex items-center gap-2 mb-2">
            <PackagePlus className="h-5 w-5 text-[#D4A373]" />
            <h3 className="text-base font-bold text-[#0A2947]">Informasi Dasar</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nama Bahan Baku */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Nama Bahan Baku <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.namaBahan}
                onChange={(e) => setForm({ ...form, namaBahan: e.target.value })}
                placeholder="Contoh: Biji Kopi Arabica, Susu Segar, dsb."
                required
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 h-12"
              />
            </div>

            {/* Satuan */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Satuan <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.satuan}
                onValueChange={(val: SatuanBahan) => setForm({ ...form, satuan: val })}
              >
                <SelectTrigger className="w-full h-12 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold">
                  <SelectValue placeholder="Pilih Satuan..." />
                </SelectTrigger>
                <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  {SATUAN_OPTIONS.map((satuan) => (
                    <SelectItem
                      key={satuan}
                      value={satuan}
                      className="cursor-pointer hover:bg-[#0A2947]/5 font-bold"
                    >
                      {satuan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="hidden sm:block"></div> {/* Spacer untuk grid */}

            {/* Stok Awal */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Stok Awal <span className="text-[#0A2947]/50 font-medium">(Opsional)</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={stokInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStokInput(val);
                    setForm({ ...form, stok: val === "" ? 0 : Number(val) });
                  }}
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-mono font-bold h-12 pr-16 no-spinner"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0A2947]/40 pointer-events-none">
                  {form.satuan}
                </div>
              </div>
            </div>

            {/* Batas Stok Minimum */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Batas Stok Minimum <span className="text-[#0A2947]/50 font-medium">(Opsional)</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={minimalStokInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMinimalStokInput(val);
                    setForm({ ...form, minimalStok: val === "" ? 0 : Number(val) });
                  }}
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-mono font-bold h-12 pr-16 no-spinner"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0A2947]/40 pointer-events-none">
                  {form.satuan}
                </div>
              </div>
            </div>
          </div>

          {/* Helper Text / Tooltip Batas Stok */}
          <div className="flex items-start gap-2 bg-[#0A2947]/5 p-4 rounded-xl border border-[#0A2947]/10 mt-2">
            <Info className="w-5 h-5 text-[#D4A373] shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-[#0A2947]/70 leading-relaxed">
              <strong className="font-bold text-[#0A2947]">Fungsi Batas Stok Minimum:</strong> Sistem akan memberikan peringatan (label <i>Stok Kritis</i>) di Daftar Bahan Baku jika stok aktual sama dengan atau kurang dari angka minimum ini. Berguna sebagai pengingat waktu belanja agar bahan tidak kehabisan.
            </p>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="rounded-xl bg-red-500/10 p-4 text-sm font-bold text-red-600 border border-red-500/20 shadow-sm">
              {formError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/inventaris/bahanBaku")}
              disabled={createMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-11 w-full sm:w-auto px-6"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm h-11 w-full sm:w-auto px-6"
            >
              {createMutation.isPending ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4 text-[#D4A373]" /> Simpan Bahan Baku
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}