"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Landmark, Wallet, Banknote } from "lucide-react";

// Form & Validation
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { pesanError } from "@/lib/api/error";
import { useBuatAkunKas } from "@/features/akun-kas/hooks";
import { skemaAkunKas, type KeluaranAkunKas, type MasukanAkunKas } from "@/features/akun-kas/schema";
import { AkunKasRequest } from "@/types/akunKas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Page
export default function BuatAkunKasPage() {
  const router = useRouter();

  // --- REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MasukanAkunKas, unknown, KeluaranAkunKas>({
    resolver: zodResolver(skemaAkunKas),
    defaultValues: {
      tipeAkun: "Kas Fisik",
      namaAkun: "",
      nomorAkun: "",
      keterangan: "",
      saldo: 0,
      status: "aktif",
    },
  });

  // Pantau tipe akun untuk mengubah ikon secara dinamis
  const watchedTipeAkun = useWatch({ control, name: "tipeAkun" });
  const TipeIcon = watchedTipeAkun === "Rekening Bank" ? Landmark : Wallet;

  // --- MUTATION ---
  const createMutation = useBuatAkunKas({
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Akun Kas baru telah ditambahkan.",
      });
      router.push("/dashboard/outlet/keuangan/akunkas");
    },
    onError: (err) => {
      toast.error("Gagal Menyimpan", {
        description: pesanError(err, "Gagal menyimpan akun kas."),
      });
    },
  });

  // --- HANDLER SUBMIT ---
  const onSubmit = (data: KeluaranAkunKas) => {
    const payload: AkunKasRequest = {
      ...data,
      // Hapus keterangan jika hanya string kosong
      keterangan: data.keterangan?.trim() || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    // Padding luar diubah menjadi px-4 py-6 untuk seluler
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      {/* Header & Tombol Back */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/keuangan/akunkas")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Akun Kas
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <TipeIcon className="w-6 h-6 text-karamel" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Tambah Akun Kas
            </h1>
            <p className="text-sm font-medium text-navy/60">
              Daftarkan rekening bank atau kas fisik baru ke sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Form (Dibungkus Dark Cream) */}
      <div className="rounded-2xl border border-navy/10 bg-krem shadow-sm">
        <form
          onSubmit={handleSubmit(onSubmit)}
          // Padding dalam disesuaikan menjadi p-5 untuk seluler
          className="flex flex-col gap-6 p-5 sm:p-8"
        >
          {/* Informasi Akun */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-navy/10 pb-3">
              <Banknote className="h-4 w-4 text-karamel" /> Informasi Akun
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-bold text-navy">
                Tipe Akun <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tipeAkun"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={cn(
                        "bg-gading border-navy/20 text-navy w-full font-bold focus:ring-1 focus:ring-navy",
                        errors.tipeAkun && "border-rose-500",
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gading border-navy/10 text-navy">
                      <SelectItem
                        value="Kas Fisik"
                        className="cursor-pointer font-bold hover:bg-navy/5"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-karamel" />
                          Kas Fisik
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="Rekening Bank"
                        className="cursor-pointer font-bold hover:bg-navy/5"
                      >
                        <div className="flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-karamel" />
                          Rekening Bank
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <div className="min-h-4">
                {errors.tipeAkun && (
                  <span className="text-xs font-bold text-rose-500">
                    {errors.tipeAkun.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">
                  Nama Akun <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("namaAkun")}
                  placeholder={
                    watchedTipeAkun === "Rekening Bank"
                      ? "Misal: Rekening BCA Utama"
                      : "Misal: Kas Laci Kasir"
                  }
                  className={cn(
                    "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy",
                    errors.namaAkun && "border-rose-500",
                  )}
                />
                <div className="min-h-4">
                  {errors.namaAkun && (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.namaAkun.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">
                  Nomor Akun <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("nomorAkun")}
                  placeholder={
                    watchedTipeAkun === "Rekening Bank"
                      ? "Misal: 1234567890"
                      : "Misal: KAS-001"
                  }
                  className={cn(
                    "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy",
                    errors.nomorAkun && "border-rose-500",
                  )}
                />
                <div className="min-h-4">
                  {errors.nomorAkun && (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.nomorAkun.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-navy">
                Keterangan{" "}
                <span className="text-navy/50 font-medium">
                  (Opsional)
                </span>
              </label>
              <Input
                {...register("keterangan")}
                placeholder="Catatan tambahan untuk akun ini..."
                className="bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy"
              />
            </div>
          </div>

          <div className="h-px w-full bg-navy/10 my-2" />

          {/* Saldo & Status */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-navy/50">
              Saldo & Status Operasional
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">
                  Saldo Awal{" "}
                  <span className="text-navy/50 text-xs font-medium">
                    (Opsional, Default 0)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-navy/50">
                    Rp
                  </span>
                  <Controller
                    name="saldo"
                    control={control}
                    render={({ field }) => {
                      // 1. Konversi field.value menjadi Number murni agar TypeScript tidak protes
                      const numericValue = Number(field.value) || 0;

                      // 2. Tampilkan format Rupiah. Jika 0, set string kosong agar placeholder "0" bekerja optimal
                      const displayValue =
                        numericValue === 0
                          ? ""
                          : new Intl.NumberFormat("id-ID").format(numericValue);

                      return (
                        <Input
                          placeholder="0"
                          value={displayValue}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            // Simpan sebagai angka murni kembali ke dalam RHF
                            field.onChange(raw ? Number(raw) : 0);
                          }}
                          className={cn(
                            "bg-gading border-navy/20 text-navy pl-9 font-mono font-bold focus-visible:ring-1 focus-visible:ring-navy",
                            errors.saldo && "border-rose-500",
                          )}
                          inputMode="numeric"
                        />
                      );
                    }}
                  />
                </div>
                <div className="min-h-4 flex flex-col justify-start">
                  {errors.saldo ? (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.saldo.message}
                    </span>
                  ) : (
                    <p className="text-xs font-medium text-navy/50">
                      Saldo awal saat akun ini pertama kali didaftarkan.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">
                  Status Operasional
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-gading border-navy/20 text-navy w-full font-bold focus:ring-1 focus:ring-navy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gading border-navy/10 text-navy">
                        <SelectItem
                          value="aktif"
                          className="cursor-pointer font-medium hover:bg-navy/5"
                        >
                          Aktif
                        </SelectItem>
                        <SelectItem
                          value="non-aktif"
                          className="cursor-pointer font-medium hover:bg-navy/5"
                        >
                          Non-Aktif
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Aksi Bawah */}
          {/* Mengubah layout tombol agar responsif: ditumpuk di HP (Batal di bawah), sejajar di Desktop */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-navy/10 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/outlet/keuangan/akunkas")}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold px-6"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full sm:w-auto cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold px-6 shadow-sm"
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
