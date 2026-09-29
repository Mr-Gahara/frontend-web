"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Save, Loader2 } from "lucide-react";
import { pesanError } from "@/lib/api/error";
import { useBuatLokasi } from "@/features/inventaris/hooks";
import IsianLokasi from "@/features/inventaris/isian-lokasi";
import {
  NILAI_AWAL_LOKASI,
  payloadBuatLokasi,
  skemaLokasi,
  type NilaiFormLokasi,
} from "@/features/inventaris/schema-lokasi";

/**
 * Setup gudang pertama tenant. Layout gudang hanya membuka halaman ini bagi
 * pemegang create-location di tenant yang belum punya lokasi Gudang
 * (keputusan GD4a). Form memakai React Hook Form dan Zod dengan tampilan
 * lama (keputusan GD3a): label terhubung ke isiannya, koordinat kosong di
 * awal dan diisi lewat Deteksi Otomatis atau manual, serta atribut required,
 * min, dan max dipertahankan. useBuatLokasi menunggu daftar lokasi dimuat
 * ulang sebelum halaman berpindah, agar layout tidak mengalihkan kembali ke
 * setup. Isiannya dipakai bersama halaman pengaturan gudang lewat
 * IsianLokasi (keputusan GD2a).
 */
export default function GudangSetupPage() {
  const router = useRouter();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiFormLokasi>({
    resolver: zodResolver(skemaLokasi),
    defaultValues: NILAI_AWAL_LOKASI,
  });

  const createGudangMutation = useBuatLokasi({
    onSuccess: () => {
      toast.success("Gudang Berhasil Dibuat", {
        description: "Sistem WMS Anda kini siap digunakan.",
      });
      router.replace("/dashboard/gudang");
    },
    onError: (err) => {
      toast.error("Gagal Membuat Gudang", {
        description: pesanError(err, "Periksa kembali data Anda."),
      });
    },
  });

  const kirim = (nilai: NilaiFormLokasi) => {
    createGudangMutation.mutate(payloadBuatLokasi(nilai, "Gudang"));
  };

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">

        {/* HEADER FORM */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inisiasi Gudang Pusat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Anda belum memiliki Gudang di sistem. Silakan tentukan lokasi operasional WMS Anda untuk memulai.
          </p>
        </div>

        {/* BODY FORM */}
        <form onSubmit={handleSubmit(kirim)} className="space-y-5">
          <IsianLokasi register={register} setValue={setValue} errors={errors} idAwalan="setup-gudang" />

          {/* ACTION BUTTON */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={createGudangMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              {createGudangMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Simpan & Buka Ruang Gudang
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
