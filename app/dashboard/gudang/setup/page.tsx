"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import { MapPin, Building2, Save, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function GudangSetupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State Formulir
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  
  // UX PERBAIKAN: Default kosong agar mudah diisi, bukan angka statis.
  const [radiusAbsen, setRadiusAbsen] = useState<string>("");
  
  // State Koordinat (Default: Titik Tengah Pontianak sebagai cadangan)
  const [latitude, setLatitude] = useState<string>("-0.0227");
  const [longitude, setLongitude] = useState<string>("109.3425");
  const [isLocating, setIsLocating] = useState(false);

  // --- FUNGSI AMBIL LOKASI DARI BROWSER ---
  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          toast.success("Lokasi Ditemukan", {
            description: "Koordinat gudang berhasil diperbarui dari browser Anda.",
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error Geolocation: ", error);
          toast.error("Akses Lokasi Ditolak", {
            description: "Silakan masukkan koordinat secara manual atau gunakan nilai default.",
          });
          setIsLocating(false);
        }
      );
    } else {
      toast.error("Tidak Didukung", { description: "Browser Anda tidak mendukung fitur lokasi." });
      setIsLocating(false);
    }
  };

  // --- MUTASI POST DATA ---
  const createGudangMutation = useMutation({
    mutationFn: async (payload: any) => {
      // PERBAIKAN: Menggunakan endpoint /location sesuai nama file route backend Anda
      return await apiClient.post("/location", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Gudang Berhasil Dibuat", {
        description: "Sistem WMS Anda kini siap digunakan.",
      });
      // INVALIDASI CACHE LOKASI
      queryClient.invalidateQueries({ queryKey: queryKeys.lokasi });
      
      // Tendang ke halaman utama gudang
      router.replace("/dashboard/gudang");
    },
    onError: (err: any) => {
      toast.error("Gagal Membuat Gudang", {
        description: err.message || "Periksa kembali data Anda.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !alamat || !latitude || !longitude || !radiusAbsen) {
      toast.error("Formulir Tidak Lengkap", { description: "Semua field wajib diisi." });
      return;
    }

    // PERBAIKAN: Validasi Batas Radius sesuai locationValidator.js (10 - 50)
    const radiusNumber = Number(radiusAbsen);
    if (radiusNumber < 10 || radiusNumber > 50) {
      toast.error("Radius Tidak Valid", { description: "Radius absensi harus berada di antara 10 hingga 50 meter." });
      return;
    }

    // PERBAIKAN PAYLOAD: Format datar (flat) sesuai ekspektasi Validator Express backend
    const payload = {
      nama,
      tipe: "Gudang",
      alamat,
      radiusAbsen: radiusNumber,
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    createGudangMutation.mutate(payload);
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nama Gudang / Warehouse</label>
            <Input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Gudang Utama A"
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Alamat Lengkap</label>
            <Input
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Contoh: Jl. Khatulistiwa No. 123"
              required
              className="bg-background"
            />
          </div>

          <hr className="my-4 border-border" />

          {/* SECTION GEOLOKASI */}
          <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" /> Koordinat Lokasi
              </label>
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
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Latitude</span>
                <Input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  className="font-mono text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Longitude</span>
                <Input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  className="font-mono text-xs bg-background"
                />
              </div>
            </div>

            {/* PERBAIKAN UI: Input Radius Absen */}
            <div className="space-y-1 pt-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Radius Toleransi Absen (Meter)</span>
              <Input
                type="number"
                value={radiusAbsen}
                onChange={(e) => setRadiusAbsen(e.target.value)}
                placeholder="Contoh: 20"
                min={10}
                max={50}
                required
                className="bg-background no-spinner"
              />
              <p className="text-[10px] text-amber-600/80 mt-1 font-medium">
                *Batas minimum radius adalah 10 meter dan maksimum 50 meter.
              </p>
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