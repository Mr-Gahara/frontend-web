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

  // Fetch daftar Akun Kas untuk dropdown
  const { data: akunKasList = [], isLoading: loadingAkun } = useQuery({
    queryKey: queryKeys.akunKas,
    // 1. Kunci return type secara eksplisit
    queryFn: async (): Promise<AkunKas[]> => {
      try {
        // 2. Gunakan Union Type agar TypeScript mengakomodasi format { data: [...] }
        const res = await apiClient.get<{ data: AkunKas[] } | AkunKas[]>(
          "/akunkas",
          undefined,
          "pengguna",
        );

        // 3. Ekstraksi data yang aman (Type Guarding)
        let rawData: AkunKas[] = [];
        if (Array.isArray(res)) {
          rawData = res;
        } else if (res && "data" in res && Array.isArray(res.data)) {
          rawData = res.data;
        }

        // 4. Lakukan filter pada data yang sudah pasti berupa array
        return rawData.filter((a) => a.status === "aktif");
      } catch (err: any) {
        if (err?.status === 404 || String(err).includes("not found")) return [];
        throw err;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MetodePembayaranRequest) => {
      return await apiClient.post(
        "/metodepembayaran",
        data,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Metode pembayaran baru telah ditambahkan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.metodePembayaran });
      router.push("/dashboard/pengaturan/metodePembayaran");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal menyimpan metode pembayaran.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.akunKasID) {
      setFormError("Akun Tujuan wajib dipilih.");
      return;
    }

    await createMutation.mutateAsync(form);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      {/* Header & Navigasi */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pengaturan/metodePembayaran">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Tambah Metode Pembayaran
            </h1>
            <p className="text-sm text-muted-foreground">
              Buat saluran pembayaran baru untuk sistem kasir POS Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Area Form */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 p-6 sm:p-8"
        >
          {/* Section: Informasi Dasar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              Informasi Dasar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nama Pembayaran <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Misal: Transfer Bank Mandiri"
                  value={form.namaPembayaran}
                  onChange={(e) =>
                    setForm({ ...form, namaPembayaran: e.target.value })
                  }
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <Select
                  value={form.kategori}
                  onValueChange={(val) =>
                    setForm({ ...form, kategori: val as KategoriMetode })
                  }
                >
                  <SelectTrigger className="bg-background w-full">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="non-tunai">Non-Tunai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-border" />

          {/* Section: Penyaluran Dana (Akun Kas) */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Penyaluran Dana (Akun Tujuan){" "}
                <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.akunKasID}
                onValueChange={(val) => setForm({ ...form, akunKasID: val })}
                disabled={isMounted ? loadingAkun : false}
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue
                    placeholder={
                      loadingAkun ? "Memuat Akun Kas..." : "Pilih Akun Kas"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {akunKasList.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Tidak ada Akun Kas aktif.
                    </div>
                  ) : (
                    akunKasList.map((akun, index) => {
                      const validId = akun._id || (akun as any).id;

                      return (
                        <SelectItem
                          // Gunakan validId. Jika benar-benar kosong, biarkan string kosong agar tidak lolos validasi form frontend
                          key={validId || `akunkas-opt-${index}`}
                          value={validId || ""} 
                        >
                          {akun.namaAkun} ({akun.nomorAkun})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Semua uang yang masuk melalui metode ini akan bermuara ke Akun
                Kas di atas.
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-border" />

          {/* Section: Integrasi & Status */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isAutomated"
                  checked={form.isAutomated}
                  disabled // Dikunci berdasarkan arahan MVP Anda
                  onCheckedChange={(val) =>
                    setForm({ ...form, isAutomated: val === true })
                  }
                  className="mt-1"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="isAutomated"
                    className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Integrasi Payment Gateway Otomatis (Xendit)
                  </label>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Saat ini fitur integrasi Xendit untuk Web Dashboard sedang
                    dalam perbaikan.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Operasional</label>
              <Select
                value={form.isActive ? "true" : "false"}
                onValueChange={(val) =>
                  setForm({ ...form, isActive: val === "true" })
                }
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Menampilkan pesan error validasi */}
          {formError && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-600 border border-red-500/20">
              {formError}
            </div>
          )}

          {/* Aksi Form */}
          <div className="flex justify-between gap-3 pt-4 border-t border-border">
            <Link href="/dashboard/pengaturan/metodePembayaran">
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
                  Simpan Metode
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
