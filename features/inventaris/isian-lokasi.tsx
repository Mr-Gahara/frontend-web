"use client";

import { useState } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { NilaiFormLokasi } from "./schema-lokasi";

/** Pesan galat satu isian dari skema. */
function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-rose-600">{pesan}</p>;
}

/** Teks isian yang berbeda per tipe lokasi. */
export interface TeksIsianLokasi {
  labelNama: string;
  contohNama: string;
  pesanKoordinat: string;
}

export const TEKS_ISIAN_LOKASI: Record<"gudang" | "outlet", TeksIsianLokasi> = {
  gudang: {
    labelNama: "Nama Gudang / Warehouse",
    contohNama: "Contoh: Gudang Utama A",
    pesanKoordinat: "Koordinat gudang berhasil diperbarui dari browser Anda.",
  },
  outlet: {
    labelNama: "Nama Outlet",
    contohNama: "Contoh: Outlet Pusat",
    pesanKoordinat: "Koordinat outlet berhasil diperbarui dari browser Anda.",
  },
};

interface Props {
  register: UseFormRegister<NilaiFormLokasi>;
  setValue: UseFormSetValue<NilaiFormLokasi>;
  errors: FieldErrors<NilaiFormLokasi>;
  /** Awalan id isian, agar setiap label terhubung ke isiannya dan id unik per halaman. */
  idAwalan: string;
  /** Bagi pengguna tanpa update-location: isian hanya dibaca, tanpa Deteksi Otomatis. */
  bacaSaja?: boolean;
  /** Teks per tipe lokasi; bawaan gudang, profil toko memakai outlet (PO12a). */
  teks?: TeksIsianLokasi;
}

/**
 * Isian form lokasi gudang: nama, alamat, koordinat dengan Deteksi
 * Otomatis, dan radius absen. Dipindah utuh dari halaman setup gudang,
 * sehingga setup dan pengaturan gudang memakai form yang sama (keputusan
 * GD2a dan GD3a). Dirender sebagai fragment, agar jarak antarbagian tetap
 * diatur form pembungkusnya.
 */
export default function IsianLokasi({
  register,
  setValue,
  errors,
  idAwalan,
  bacaSaja = false,
  teks = TEKS_ISIAN_LOKASI.gudang,
}: Props) {
  const [isLocating, setIsLocating] = useState(false);
  const id = (nama: string) => `${idAwalan}-${nama}`;

  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const opsi = { shouldValidate: true, shouldDirty: true };
          setValue("latitude", position.coords.latitude.toString(), opsi);
          setValue("longitude", position.coords.longitude.toString(), opsi);
          toast.success("Lokasi Ditemukan", {
            description: teks.pesanKoordinat,
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

  return (
    <>
      <div className="space-y-2">
        <label htmlFor={id("nama")} className="text-sm font-medium text-foreground">{teks.labelNama}</label>
        <Input
          id={id("nama")}
          {...register("nama")}
          placeholder={teks.contohNama}
          required
          readOnly={bacaSaja}
          className="bg-background"
        />
        <PesanIsian pesan={errors.nama?.message} />
      </div>

      <div className="space-y-2">
        <label htmlFor={id("alamat")} className="text-sm font-medium text-foreground">Alamat Lengkap</label>
        <Input
          id={id("alamat")}
          {...register("alamat")}
          placeholder="Contoh: Jl. Khatulistiwa No. 123"
          required
          readOnly={bacaSaja}
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
          {!bacaSaja && (
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
              Deteksi Otomatis
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor={id("latitude")} className="text-[10px] text-muted-foreground uppercase tracking-wider">Latitude</label>
            <Input
              id={id("latitude")}
              {...register("latitude")}
              inputMode="decimal"
              placeholder="-0.0227"
              required
              readOnly={bacaSaja}
              className="font-mono text-xs bg-background"
            />
            <PesanIsian pesan={errors.latitude?.message} />
          </div>
          <div className="space-y-1">
            <label htmlFor={id("longitude")} className="text-[10px] text-muted-foreground uppercase tracking-wider">Longitude</label>
            <Input
              id={id("longitude")}
              {...register("longitude")}
              inputMode="decimal"
              placeholder="109.3425"
              required
              readOnly={bacaSaja}
              className="font-mono text-xs bg-background"
            />
            <PesanIsian pesan={errors.longitude?.message} />
          </div>
        </div>

        {/* Radius wajib 10 sampai 50 meter, sesuai validator backend */}
        <div className="space-y-1 pt-2">
          <label htmlFor={id("radius")} className="text-[10px] text-muted-foreground uppercase tracking-wider">Radius Toleransi Absen (Meter)</label>
          <Input
            id={id("radius")}
            type="number"
            {...register("radiusAbsen")}
            placeholder="Contoh: 20"
            min={10}
            max={50}
            required
            readOnly={bacaSaja}
            className="bg-background no-spinner"
          />
          <p className="text-[10px] text-amber-600/80 mt-1 font-medium">
            *Batas minimum radius adalah 10 meter dan maksimum 50 meter.
          </p>
          <PesanIsian pesan={errors.radiusAbsen?.message} />
        </div>
      </div>
    </>
  );
}