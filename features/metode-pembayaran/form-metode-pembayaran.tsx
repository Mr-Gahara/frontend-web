"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AkunKas } from "@/types/akunKas";
import type { MetodePembayaran } from "@/types/metodePembayaran";
import { payloadUbahMetode } from "./payload";
import { buatSkemaMetodePembayaran, type NilaiMetodePembayaran } from "./schema";
import { BATAS_METODE_AKTIF, pilihanAkun } from "./tampilan";

export const URL_DAFTAR_METODE = "/dashboard/outlet/pengaturan/metodePembayaran";

const kelasIsian = "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]";
const kelasIsiPilihan = "bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]";
const kelasPilihan = "cursor-pointer hover:bg-[#0A2947]/5 font-medium";
const kelasLabel = "text-sm font-bold text-[#0A2947]";
const kelasGalat = "text-xs font-bold text-red-600";

/** Tombol kembali dan judul halaman buat dan ubah, sama dengan halaman lama. */
export function KepalaFormMetode({ judul, keterangan }: { judul: string; keterangan: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
        onClick={() => router.push(URL_DAFTAR_METODE)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Laman Metode
      </Button>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">{judul}</h1>
        <p className="text-sm font-medium text-[#0A2947]/60">{keterangan}</p>
      </div>
    </div>
  );
}

/** Keadaan memuat halaman buat dan ubah. */
export function MemuatMetode({ teks }: { teks: string }) {
  return (
    <div className="flex h-[40vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#0A2947]/60" />
      <p className="text-sm font-bold text-[#0A2947]/60">{teks}</p>
    </div>
  );
}

/**
 * Pesan pengganti isi saat data gagal dimuat atau tidak ditemukan, bukan
 * loader tanpa akhir seperti halaman ubah lama maupun daftar kosong.
 */
export function PesanMetode({
  judul,
  pesan,
  onCobaLagi,
  kembali = true,
}: {
  judul: string;
  pesan: string;
  onCobaLagi?: () => void;
  kembali?: boolean;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
      <p className="text-base font-bold text-red-700">{judul}</p>
      <p className="text-sm font-medium text-red-700/80">{pesan}</p>
      <div className="flex gap-2">
        {onCobaLagi && (
          <Button type="button" variant="outline" onClick={onCobaLagi} className="cursor-pointer font-bold">
            Coba Lagi
          </Button>
        )}
        {kembali && (
          <Link href={URL_DAFTAR_METODE}>
            <Button type="button" variant="outline" className="cursor-pointer font-bold">
              Kembali ke Daftar
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

type PropsForm = {
  nilaiAwal: NilaiMetodePembayaran;
  /** Data server saat mengubah; tanpa ini form dalam mode buat. */
  asal?: MetodePembayaran;
  akunKas: AkunKas[];
  /** false bila toko sudah punya 10 metode aktif dan metode ini belum aktif (PO3a). */
  bolehAktif: boolean;
  sedangMenyimpan: boolean;
  galat: string;
  onSimpan: (nilai: NilaiMetodePembayaran) => void;
};

/**
 * Form buat dan ubah metode pembayaran. Dipasang setelah datanya termuat,
 * dengan nilai awal lewat defaultValues (keputusan rancangan butir 8).
 * Pilihan akun: akun aktif, ditambah akun metode ini bila sudah nonaktif
 * sebagai pilihan nonaktif (sejalan PL1a). Di mode ubah, simpan nonaktif
 * selama payload perubahannya kosong.
 */
export function FormMetodePembayaran({
  nilaiAwal,
  asal,
  akunKas,
  bolehAktif,
  sedangMenyimpan,
  galat,
  onSimpan,
}: PropsForm) {
  const pilihan = useMemo(() => pilihanAkun(akunKas, asal?.akunKas?.id), [akunKas, asal]);
  const skema = useMemo(
    () =>
      buatSkemaMetodePembayaran(
        pilihan.filter((p) => p.aktif).map((p) => p.id),
        asal ? { akunKasID: asal.akunKas?.id ?? "", isActive: asal.isActive } : undefined,
      ),
    [pilihan, asal],
  );
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NilaiMetodePembayaran>({ resolver: zodResolver(skema), defaultValues: nilaiAwal });
  const nilai = useWatch({ control }) as NilaiMetodePembayaran;
  const adaPerubahan = !asal || Object.keys(payloadUbahMetode(nilai, asal)).length > 0;

  const kirim = handleSubmit((n) => {
    if (n.isActive && !bolehAktif) {
      setError("isActive", {
        message: `Toko sudah punya ${BATAS_METODE_AKTIF} metode aktif. Nonaktifkan metode lain terlebih dahulu.`,
      });
      return;
    }
    onSimpan(n);
  });

  return (
    <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm">
      <form onSubmit={kirim} noValidate className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-[#0A2947]">
            <Wallet className="h-4 w-4 text-[#D4A373]" /> Informasi Dasar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="metode-nama" className={kelasLabel}>
                Nama Pembayaran <span className="text-red-500">*</span>
              </label>
              <Input
                id="metode-nama"
                placeholder="Misal: Transfer Bank Mandiri"
                {...register("namaPembayaran")}
                className={`${kelasIsian} placeholder:text-[#0A2947]/30`}
              />
              {errors.namaPembayaran && <p className={kelasGalat}>{errors.namaPembayaran.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="metode-kategori" className={kelasLabel}>
                Kategori <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="kategori"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="metode-kategori" className={`${kelasIsian} w-full`}>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent className={kelasIsiPilihan}>
                      <SelectItem value="tunai" className={kelasPilihan}>Tunai</SelectItem>
                      <SelectItem value="non-tunai" className={kelasPilihan}>Non-Tunai</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-[#0A2947]/10" />

        <div className="space-y-2">
          <label htmlFor="metode-akun" className={kelasLabel}>
            Penyaluran Dana (Akun Tujuan) <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="akunKasID"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="metode-akun" className={`${kelasIsian} w-full`}>
                  <SelectValue placeholder="Pilih Akun Kas" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={kelasIsiPilihan}>
                  {pilihan.length === 0 ? (
                    <div className="p-3 text-sm text-[#0A2947]/50 font-medium text-center">Tidak ada Akun Kas aktif.</div>
                  ) : (
                    pilihan.map((p) => (
                      <SelectItem key={p.id} value={p.id} disabled={!p.aktif} className={kelasPilihan}>
                        {p.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.akunKasID && <p className={kelasGalat}>{errors.akunKasID.message}</p>}
          <p className="text-xs font-medium text-[#0A2947]/60">
            Semua uang yang masuk melalui metode ini akan bermuara ke Akun Kas di atas.
          </p>
        </div>

        <div className="h-px w-full bg-[#0A2947]/10" />

        <div className="space-y-2">
          <label htmlFor="metode-status" className={kelasLabel}>Status Operasional</label>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Select value={field.value ? "true" : "false"} onValueChange={(v) => field.onChange(v === "true")}>
                <SelectTrigger id="metode-status" className={`${kelasIsian} w-full`}>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent className={kelasIsiPilihan}>
                  <SelectItem value="true" disabled={!bolehAktif} className={kelasPilihan}>Aktif</SelectItem>
                  <SelectItem value="false" className={kelasPilihan}>Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {!bolehAktif && (
            <p className="text-xs font-medium text-[#0A2947]/60">
              Toko sudah punya {BATAS_METODE_AKTIF} metode aktif, sehingga metode ini hanya dapat disimpan nonaktif.
            </p>
          )}
          {errors.isActive && <p className={kelasGalat}>{errors.isActive.message}</p>}
        </div>

        {galat && (
          <div className="rounded-md bg-red-500/10 p-3 text-sm font-bold text-red-600 border border-red-500/20">{galat}</div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-2">
          <Link href={URL_DAFTAR_METODE}>
            <Button
              type="button"
              variant="outline"
              disabled={sedangMenyimpan}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={sedangMenyimpan || !adaPerubahan}
            className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold px-6 disabled:cursor-not-allowed"
          >
            {sedangMenyimpan ? (
              "Menyimpan..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {asal ? "Simpan Perubahan" : "Simpan Metode"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}