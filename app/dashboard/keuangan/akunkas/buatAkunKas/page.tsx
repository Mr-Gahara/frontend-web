"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Landmark, Wallet } from "lucide-react";

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

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatRupiahInput(value: string): string {
  const angka = value.replace(/\D/g, "");
  if (!angka) return "";
  return new Intl.NumberFormat("id-ID").format(Number(angka));
}

function parseRupiah(value: string): number {
  return Number(value.replace(/\D/g, "")) || 0;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">

      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit px-0 text-muted-foreground hover:bg-transparent"
          onClick={() => router.push("/dashboard/keuangan/akunkas")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Akun Kas
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            <TipeIcon className="w-6 h-6 text-foreground" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Tambah Akun Kas</h1>
            <p className="text-sm text-muted-foreground">
              Daftarkan rekening bank atau kas fisik baru ke sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Informasi Dasar */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold">Informasi Akun</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tipe Akun <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.tipeAkun}
              onValueChange={(val) =>
                setForm({ ...form, tipeAkun: val as AkunKasTipe })
              }
            >
              <SelectTrigger className="bg-background w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kas Fisik">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    Kas Fisik
                  </div>
                </SelectItem>
                <SelectItem value="Rekening Bank">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-muted-foreground" />
                    Rekening Bank
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
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
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
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
                className="bg-background"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Keterangan (Opsional)</label>
            <Input
              placeholder="Catatan tambahan untuk akun ini..."
              value={form.keterangan ?? ""}
              onChange={(e) =>
                setForm({ ...form, keterangan: e.target.value })
              }
              className="bg-background"
            />
          </div>
        </div>

        {/* Saldo & Status */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold">Saldo & Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Saldo Awal{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (opsional, default 0)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
                  className="bg-background pl-9"
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo awal saat akun ini pertama kali didaftarkan.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Operasional</label>
              <Select
                value={form.status}
                onValueChange={(val) =>
                  setForm({ ...form, status: val as AkunKasStatus })
                }
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Error */}
        {formError && (
          <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-600 border border-red-500/20">
            {formError}
          </div>
        )}

        {/* Aksi */}
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <Link href="/dashboard/keuangan/akunkas">
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
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
  );
}