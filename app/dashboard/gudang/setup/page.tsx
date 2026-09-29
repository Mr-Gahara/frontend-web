"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MapPin, Building2, Save, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { pesanError } from "@/lib/api/error";
import { useBuatLokasi } from "@/features/inventaris/hooks";
import {
  NILAI_AWAL_LOKASI,
  payloadBuatLokasi,
  skemaLokasi,
  type NilaiFormLokasi,
} from "@/features/inventaris/schema-lokasi";

/** Pesan galat satu isian dari skema. */
function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-rose-600">{pesan}</p>;
}

/**
 * Setup gudang pertama tenant. Layout gudang hanya membuka halaman ini bagi
 * pemegang create-location di tenant yang belum punya lokasi Gudang
 * (keputusan GD4a). Form memakai React Hook Form dan Zod dengan tampilan
 * lama (keputusan GD3a): label terhubung ke isiannya, koordinat kosong di
 * awal dan diisi lewat Deteksi Otomatis atau manual, serta atribut required,
 * min, dan max dipertahankan. useBuatLokasi menunggu daftar lokasi dimuat
 * ulang sebelum halaman berpindah, agar layout tidak mengalihkan kembali ke
 * setup.
 */
export default function GudangSetupPage() {
  const router = useRouter();
  const [isLocating, setIsLocating] = useState(false);
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

  // --- FUNGSI AMBIL LOKASI DARI BROWSER ---
  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue("latitude", position.coords.latitude.toString(), { shouldValidate: true });
          setValue("longitude", position.coords.longitude.toString(), { shouldValidate: true });
          toast.success("Lokasi Ditemukan", {
            description: "Koordinat gudang berhasil diperbarui dari browser Anda.",
          });
          setIsLocating(false);
        },
        () => {
          toast.error("Akses Lokasi Ditolak", {
            description: "Silakan masukkan koordinat secara manual.",
          });
          setIsLocating(false);
        },
      );
    } else {
      toast.error("Tidak Didukung", { description: "Browser Anda tidak mendukung fitur lokasi." });
      setIsLocating(false);
    }
  };

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
          <div className="space-y-2">
            <label htmlFor="setup-gudang-nama" className="text-sm font-medium text-foreground">Nama Gudang / Warehouse</label>
            <Input
              id="setup-gudang-nama"
              {...register("nama")}
              placeholder="Contoh: Gudang Utama A"
              required
              className="bg-background"
            />
            <PesanIsian pesan={errors.nama?.message} />
          </div>

          <div className="space-y-2">
            <label htmlFor="setup-gudang-alamat" className="text-sm font-medium text-foreground">Alamat Lengkap</label>
            <Input
              id="setup-gudang-alamat"
              {...register("alamat")}
              placeholder="Contoh: Jl. Khatulistiwa No. 123"
              required
              className="bg-background"
            />
            <PesanIsian pesan={errors.alamat?.message} />
          </div>

          <hr className="my-4 border-border" />

          {/* SECTION GEOLOKASI */}
          <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" /> Koordinat Lokasi
              </span>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                Deteksi Otomatis
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="setup-gudang-latitude" className="text-[10px] text-muted-foreground uppercase tracking-wider">Latitude</label>
                <Input
                  id="setup-gudang-latitude"
                  {...register("latitude")}
                  inputMode="decimal"
                  placeholder="-0.0227"
                  required
                  className="font-mono text-xs bg-background"
                />
                <PesanIsian pesan={errors.latitude?.message} />
              </div>
              <div className="space-y-1">
                <label htmlFor="setup-gudang-longitude" className="text-[10px] text-muted-foreground uppercase tracking-wider">Longitude</label>
                <Input
                  id="setup-gudang-longitude"
                  {...register("longitude")}
                  inputMode="decimal"
                  placeholder="109.3425"
                  required
                  className="font-mono text-xs bg-background"
                />
                <PesanIsian pesan={errors.longitude?.message} />
              </div>
            </div>

            {/* Radius wajib 10 sampai 50 meter, sesuai validator backend */}
            <div className="space-y-1 pt-2">
              <label htmlFor="setup-gudang-radius" className="text-[10px] text-muted-foreground uppercase tracking-wider">Radius Toleransi Absen (Meter)</label>
              <Input
                id="setup-gudang-radius"
                type="number"
                {...register("radiusAbsen")}
                placeholder="Contoh: 20"
                min={10}
                max={50}
                required
                className="bg-background no-spinner"
              />
              <p className="text-[10px] text-amber-600/80 mt-1 font-medium">
                *Batas minimum radius adalah 10 meter dan maksimum 50 meter.
              </p>
              <PesanIsian pesan={errors.radiusAbsen?.message} />
            </div>
          </div>

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
