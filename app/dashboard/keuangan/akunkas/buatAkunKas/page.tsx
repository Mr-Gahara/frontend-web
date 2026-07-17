"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Landmark, Wallet, Banknote } from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { AkunKasRequest, AkunKasTipe, AkunKasStatus } from "@/types/akunKas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper
function parseRupiah(value: string): number {
  return Number(value.replace(/\D/g, "")) || 0;
}

// Page
export default function BuatAkunKasPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formError, setFormError] = useState("");
  const [saldoDisplay, setSaldoDisplay] = useState("");
  const [form, setForm] = useState<AkunKasRequest>({
    namaAkun: "",
    nomorAkun: "",
    tipeAkun: "Kas Fisik",
    saldo: undefined,
    status: "aktif",
    keterangan: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: AkunKasRequest) => {
      return await apiClient.post("/akunkas", data, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Akun Kas baru telah ditambahkan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.akunKas });
      router.push("/dashboard/keuangan/akunkas");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal menyimpan akun kas.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.namaAkun.trim()) {
      setFormError("Nama Akun wajib diisi.");
      return;
    }
    if (!form.nomorAkun.trim()) {
      setFormError("Nomor Akun wajib diisi.");
      return;
    }

    const payload: AkunKasRequest = {
      ...form,
      saldo: saldoDisplay ? parseRupiah(saldoDisplay) : undefined,
      keterangan: form.keterangan?.trim() || undefined,
    };

    createMutation.mutate(payload);
  };

  const tipeIcon = form.tipeAkun === "Rekening Bank" ? Landmark : Wallet;
  const TipeIcon = tipeIcon;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Header & Tombol Back */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/keuangan/akunkas")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Akun Kas
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shrink-0 shadow-sm">
            <TipeIcon className="w-6 h-6 text-[#D4A373]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Tambah Akun Kas
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Daftarkan rekening bank atau kas fisik baru ke sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Form (Dibungkus Dark Cream) */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 sm:p-8">
          
          {/* Informasi Akun */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0A2947] flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <Banknote className="h-4 w-4 text-[#D4A373]" /> Informasi Akun
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Tipe Akun <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.tipeAkun}
                onValueChange={(val) =>
                  setForm({ ...form, tipeAkun: val as AkunKasTipe })
                }
              >
                <SelectTrigger className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] w-full font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  <SelectItem value="Kas Fisik" className="cursor-pointer font-bold hover:bg-[#0A2947]/5">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#D4A373]" />
                      Kas Fisik
                    </div>
                  </SelectItem>
                  <SelectItem value="Rekening Bank" className="cursor-pointer font-bold hover:bg-[#0A2947]/5">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-[#D4A373]" />
                      Rekening Bank
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Nama Akun <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={
                    form.tipeAkun === "Rekening Bank"
                      ? "Misal: Rekening BCA Utama"
                      : "Misal: Kas Laci Kasir"
                  }
                  value={form.namaAkun}
                  onChange={(e) => setForm({ ...form, namaAkun: e.target.value })}
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Nomor Akun <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={
                    form.tipeAkun === "Rekening Bank"
                      ? "Misal: 1234567890"
                      : "Misal: KAS-001"
                  }
                  value={form.nomorAkun}
                  onChange={(e) =>
                    setForm({ ...form, nomorAkun: e.target.value })
                  }
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Keterangan <span className="text-[#0A2947]/50 font-medium">(Opsional)</span></label>
              <Input
                placeholder="Catatan tambahan untuk akun ini..."
                value={form.keterangan ?? ""}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              />
            </div>
          </div>

          <div className="h-px w-full bg-[#0A2947]/10 my-2" />

          {/* Saldo & Status */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#0A2947]/50">Saldo & Status Operasional</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Saldo Awal{" "}
                  <span className="text-[#0A2947]/50 text-xs font-medium">
                    (Opsional, Default 0)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#0A2947]/50">
                    Rp
                  </span>
                  <Input
                    placeholder="0"
                    value={saldoDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setSaldoDisplay(
                        raw ? new Intl.NumberFormat("id-ID").format(Number(raw)) : "",
                      );
                    }}
                    className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] pl-9 font-mono font-bold"
                    inputMode="numeric"
                  />
                </div>
                <p className="text-xs font-medium text-[#0A2947]/50">
                  Saldo awal saat akun ini pertama kali didaftarkan.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Status Operasional</label>
                <Select
                  value={form.status}
                  onValueChange={(val) =>
                    setForm({ ...form, status: val as AkunKasStatus })
                  }
                >
                  <SelectTrigger className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] w-full font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="aktif" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Aktif</SelectItem>
                    <SelectItem value="non-aktif" className="cursor-pointer font-medium hover:bg-[#0A2947]/5">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm font-bold text-red-600 border border-red-500/20 mt-2">
              {formError}
            </div>
          )}

          {/* Aksi Bawah */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-4">
            <Link href="/dashboard/keuangan/akunkas">
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending}
                className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
              >
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold px-6 shadow-sm"
            >
              {createMutation.isPending ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Akun Kas
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}