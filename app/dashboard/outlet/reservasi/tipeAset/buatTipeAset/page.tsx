"use client";

import { useRouter } from "next/navigation";
import { useSimpanTipeAset } from "@/features/tipe-aset/hooks";
import { payloadBuatTipeAset } from "@/features/tipe-aset/payload";
import { skemaBuatTipeAset, type NilaiFormTipeAset } from "@/features/tipe-aset/schema";
import { pesanError } from "@/lib/api/error";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Form & Validation ---
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Pastikan komponen ini ada sesuai tree Anda
import {
  ArrowLeft,
  Layers,
  FileText,
} from "lucide-react";


export default function BuatTipeAsetPage() {
  const router = useRouter();

  // --- REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiFormTipeAset>({
    resolver: zodResolver(skemaBuatTipeAset),
    defaultValues: {
      namaTipeAset: "",
      deskripsi: "",
    },
  });

  // --- MUTATION CREATE TIPE ASET ---
  const createMutation = useSimpanTipeAset();

  // --- HANDLER SUBMIT ---
  const onSubmit = (data: NilaiFormTipeAset) => {
    createMutation.mutate(
      { data: payloadBuatTipeAset(data) },
      {
        onSuccess: () => {
          toast.success("Berhasil", {
            description: "Kategori Aset baru berhasil ditambahkan.",
          });
          router.push("/dashboard/outlet/reservasi/tipeAset");
        },
        onError: (galat) => {
          toast.error("Gagal Menyimpan", {
            description: pesanError(galat, "Gagal menambahkan Kategori Aset baru."),
          });
        },
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* HEADER & TOMBOL KEMBALI */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/reservasi/tipeAset")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Kategori Aset
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Tambah Kategori Aset Baru
          </h1>
          <p className="text-sm font-medium text-navy/60">
            Buat kategori atau tipe baru untuk mengelompokkan aset/fasilitas yang Anda sewakan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* CARD FORM UTAMA */}
        <div className="rounded-2xl border border-navy/10 bg-krem p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-navy/10 pb-3">
            <Layers className="h-5 w-5 text-karamel" />
            <h3 className="text-base font-bold text-navy">
              Detail Informasi Kategori Aset
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-navy">
              Nama Kategori Aset <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register("namaTipeAset")}
              placeholder="Contoh: Meja Billiard VIP, Lapangan Futsal, dsb."
              className={cn(
                "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy",
                errors.namaTipeAset && "border-rose-500 focus-visible:ring-rose-500"
              )}
            />
            <div className="min-h-4">
              {errors.namaTipeAset ? (
                <span className="text-xs font-bold text-rose-500">
                  {errors.namaTipeAset.message}
                </span>
              ) : (
                <p className="text-[10px] font-medium text-navy/50">
                  Nama ini akan muncul pada menu pembuatan aset dan penyewaan.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-navy flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-navy/50" />
              Deskripsi <span className="text-navy/50 font-medium">(Opsional)</span>
            </label>
            <Textarea
              {...register("deskripsi")}
              placeholder="Catatan atau keterangan mengenai tipe aset ini..."
              rows={4}
              className="bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy resize-none"
            />
            <p className="text-[10px] font-medium text-navy/50">
              Gunakan untuk menyimpan spesifikasi khusus kategori ini agar staf mengetahui perbedaannya.
            </p>
          </div>
        </div>

        {/* AKSI TOMBOL */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-navy/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/outlet/reservasi/tipeAset")}
            disabled={createMutation.isPending}
            className="w-full sm:w-auto cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold h-12 px-8"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full sm:w-auto cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm font-bold h-12 px-8"
          >
            {createMutation.isPending ? "Menyimpan Data..." : "Simpan Kategori Aset"}
          </Button>
        </div>
      </form>
    </div>
  );
}