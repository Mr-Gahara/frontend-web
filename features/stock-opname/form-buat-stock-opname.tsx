"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/useSession";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { CreateOpnameRequest } from "@/types/stockOpname";
import type { Lokasi } from "@/types/location";
import { pesanError } from "@/lib/api/error";
import { useBuatOpname } from "./hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// --- Form & Validation ---
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  User,
  FileText,
  Save,
  AlertTriangle,
  Settings,
} from "lucide-react";

// Interface untuk struktur response standard dari backend
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// --- ZOD SCHEMA ---
const opnameSchema = z.object({
  locationID: z
    .string()
    .min(1, "Lokasi tidak valid. Silakan setup lokasi terlebih dahulu."),
  picID: z
    .string()
    .min(1, "Sesi login tidak valid. Data penanggung jawab tidak ditemukan."),
  catatan: z.string().optional(),
});

type OpnameFormInput = z.input<typeof opnameSchema>;
type OpnameFormOutput = z.output<typeof opnameSchema>;

/** Outlet memakai satu lokasi tetap (lokasi aktif); gudang memilih di antara gudang terdaftar. */
export type SumberLokasi =
  | { jenis: "tetap"; lokasi: Lokasi | null; memuat: boolean }
  | { jenis: "pilih"; pilihan: Lokasi[]; memuat: boolean };

const TEKS = {
  outlet: {
    judul: "Buat Draft Opname",
    deskripsi: "Inisiasi sesi opname baru. Sistem otomatis mendeteksi Outlet/Gudang aktif Anda.",
    urlDaftar: "/dashboard/outlet/inventaris/stockOpname",
    judulKosong: "Lokasi / Gudang Belum Diatur",
    isiKosong:
      "Sistem tidak dapat menemukan data lokasi untuk outlet/gudang yang sedang Anda akses saat ini. Anda harus mengatur profil lokasi terlebih dahulu sebelum melakukan Stok Opname.",
    urlSetup: "/dashboard/outlet/pengaturan/lokasi",
    pesanLokasi: "Lokasi tidak valid. Silakan setup lokasi terlebih dahulu.",
    placeholderCatatan: "Misal: Audit rutin akhir bulan...",
    deskripsiBerhasil: "Sistem telah mengambil snapshot stok saat ini.",
    pesanGagalBuat: "Gagal membuat draft opname. Pastikan ada item di lokasi tersebut.",
  },
  gudang: {
    judul: "Buat Draft Opname Gudang",
    deskripsi: "Inisiasi sesi audit stok fisik. Pilih gudang yang akan dihitung.",
    urlDaftar: "/dashboard/gudang/stockOpname",
    judulKosong: "Gudang Belum Didaftarkan",
    isiKosong:
      "Sistem tidak dapat menemukan data Gudang di akun Anda. Anda harus membuat profil Gudang terlebih dahulu sebelum melakukan Stok Opname.",
    urlSetup: "/dashboard/gudang/pengaturan",
    pesanLokasi: "Lokasi tidak valid. Silakan pilih gudang terlebih dahulu.",
    placeholderCatatan: "Misal: Audit rutin bulanan Gudang Utama...",
    deskripsiBerhasil: "Sistem telah mengambil snapshot stok gudang saat ini.",
    pesanGagalBuat: "Gagal membuat draft opname. Pastikan ada item di gudang tersebut.",
  },
} as const;

interface Props {
  ruang: keyof typeof TEKS;
  sumberLokasi: SumberLokasi;
}

function keteranganLokasi(sumber: SumberLokasi): string {
  if (sumber.jenis === "tetap") {
    return "Sistem otomatis mendeteksi bahwa Anda sedang beroperasi di lokasi ini.";
  }
  return sumber.pilihan.length === 1
    ? "Gudang otomatis terpilih karena hanya ada 1 gudang yang terdaftar."
    : "Pilih gudang yang stok fisiknya akan Anda audit.";
}

export default function FormBuatStockOpname({ ruang, sumberLokasi }: Props) {
  useAuthGuard();
  const router = useRouter();
  const teks = TEKS[ruang];

  // State untuk label (hanya untuk keperluan visual)
  const [currentUserName, setCurrentUserName] = useState("Memuat data Anda...");

  // --- REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OpnameFormInput, unknown, OpnameFormOutput>({
    resolver: zodResolver(opnameSchema),
    defaultValues: {
      locationID: "",
      picID: "",
      catatan: "",
    },
  });

  const watchLocationID = watch("locationID");
  const watchPicID = watch("picID");

  // --- MENGAMBIL USER ID & NAMA DENGAN AMAN DARI TOKEN ---
  const { pengguna } = useSession();

  useEffect(() => {
    if (!pengguna) return;
    setValue("picID", pengguna.id);
    setCurrentUserName(pengguna.nama || "Anda (Pengguna Saat Ini)");
  }, [pengguna, setValue]);

  // --- LOKASI ---
  // Lokasi tetap (outlet) diisi otomatis; pilihan (gudang) diisi otomatis bila hanya satu.
  const isLoadingLokasi = sumberLokasi.memuat;
  const idOtomatis =
    sumberLokasi.jenis === "tetap"
      ? (sumberLokasi.lokasi?.id ?? "")
      : sumberLokasi.pilihan.length === 1
        ? sumberLokasi.pilihan[0].id
        : null;

  useEffect(() => {
    if (!isLoadingLokasi && idOtomatis !== null) setValue("locationID", idOtomatis);
  }, [idOtomatis, isLoadingLokasi, setValue]);

  const namaLokasiTetap =
    sumberLokasi.jenis === "tetap" && sumberLokasi.lokasi
      ? `${sumberLokasi.lokasi.nama} (${sumberLokasi.lokasi.tipe})`
      : "";

  // --- MUTASI CREATE DRAFT OPNAME ---
  const createMutation = useBuatOpname({
    onSuccess: (opname) => {
      toast.success("Draft Opname Berhasil Dibuat", { description: teks.deskripsiBerhasil });
      router.push(opname?.id ? `${teks.urlDaftar}/${opname.id}` : teks.urlDaftar);
    },
    onError: (err) =>
      toast.error("Gagal Memproses", { description: pesanError(err, teks.pesanGagalBuat) }),
  });

  // --- HANDLER SUBMIT DARI RHF ---
  const onSubmit = (data: OpnameFormOutput) => {
    // Validasi pencegahan ganda (walau Zod sudah handle)
    if (!data.locationID || !data.picID) return;

    const payload: CreateOpnameRequest = {
      locationID: data.locationID,
      catatan: data.catatan?.trim() || undefined,
    };

    createMutation.mutate(payload);
  };

  // Validasi: Lokasi dianggap kosong kalau fetch selesai TAPI data null ATAU tidak ada id valid
  const isLocationEmpty =
    !isLoadingLokasi &&
    (sumberLokasi.jenis === "tetap" ? !sumberLokasi.lokasi : sumberLokasi.pilihan.length === 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push(teks.urlDaftar)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Opname
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shrink-0 shadow-sm">
            <ClipboardList className="w-6 h-6 text-[#D4A373]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              {teks.judul}
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              {teks.deskripsi}
            </p>
          </div>
        </div>
      </div>

      {/* VALIDASI LOKASI BELUM SETUP */}
      {isLocationEmpty && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm flex flex-col items-center text-center gap-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <div>
            <h2 className="text-lg font-bold text-rose-700">
              {teks.judulKosong}
            </h2>
            <p className="text-sm font-medium text-rose-600/80 mt-1 max-w-md">
              {teks.isiKosong}
            </p>
          </div>
          <Button
            onClick={() => router.push(teks.urlSetup)}
            className="cursor-pointer bg-rose-600 text-white hover:bg-rose-700 font-bold shadow-sm mt-2"
          >
            <Settings className="w-4 h-4 mr-2" /> Setup Lokasi Sekarang
          </Button>
        </div>
      )}

      {/* FORM SECTION */}
      {!isLocationEmpty && (
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6 p-6 sm:p-8"
          >
            <div className="space-y-5">
              {/* Read-Only Lokasi (Auto-detect Tenant) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947] flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#D4A373]" />
                  Lokasi Audit / Gudang
                </label>
                {sumberLokasi.jenis === "tetap" ? (
                <div className="flex items-center w-full h-12 px-4 bg-[#0A2947]/5 border border-[#0A2947]/10 rounded-lg text-[#0A2947]/60 font-bold cursor-not-allowed">
                    {isLoadingLokasi ? "Memeriksa lokasi aktif..." : namaLokasiTetap}
                  </div>
                ) : (
                  <Select
                    value={watchLocationID}
                    onValueChange={(nilai) => setValue("locationID", nilai, { shouldValidate: true })}
                    disabled={isLoadingLokasi || createMutation.isPending}
                  >
                    <SelectTrigger
                      aria-label="Lokasi Audit / Gudang"
                      className="w-full h-12 bg-white border-[#0A2947]/20 text-[#0A2947] font-bold cursor-pointer"
                    >
                      <SelectValue placeholder={isLoadingLokasi ? "Memuat gudang..." : "Pilih Gudang..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                      {sumberLokasi.pilihan.map((lokasi) => (
                        <SelectItem key={lokasi.id} value={lokasi.id} className="cursor-pointer font-bold">
                          {lokasi.nama || "Gudang Tanpa Nama"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="min-h-4">
                  {errors.locationID ? (
                    <span className="text-xs font-bold text-rose-500">
                      {teks.pesanLokasi}
                    </span>
                  ) : (
                    <p className="text-xs font-medium text-[#0A2947]/50 mt-1">
                      {keteranganLokasi(sumberLokasi)}
                    </p>
                  )}
                </div>
              </div>

              {/* Read-Only PIC */}
              <div className="space-y-2 pt-2 border-t border-[#0A2947]/10 mt-2">
                <label className="text-sm font-bold text-[#0A2947] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#D4A373]" />
                  Penanggung Jawab (PIC)
                </label>
                <div className="flex items-center w-full h-12 px-4 bg-[#0A2947]/5 border border-[#0A2947]/10 rounded-lg text-[#0A2947]/60 font-bold cursor-not-allowed">
                  {currentUserName}
                </div>
                <div className="min-h-4">
                  {errors.picID ? (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.picID.message}
                    </span>
                  ) : (
                    <p className="text-xs font-medium text-[#0A2947]/50 mt-1">
                      Sistem otomatis mencatat Anda sebagai PIC sesi opname
                      ini.
                    </p>
                  )}
                </div>
              </div>

              {/* Input Catatan */}
              <div className="space-y-2 pt-2 border-t border-[#0A2947]/10 mt-2">
                <label className="text-sm font-bold text-[#0A2947] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#D4A373]" />
                  Catatan Opname{" "}
                  <span className="text-[#0A2947]/50 font-medium">
                    (Opsional)
                  </span>
                </label>
                <Input
                  {...register("catatan")}
                  placeholder={teks.placeholderCatatan}
                  className="bg-[#FFFAF3] h-12 border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-medium focus-visible:ring-1 focus-visible:ring-[#0A2947]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(teks.urlDaftar)}
                disabled={createMutation.isPending}
                className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-11 px-6"
              >
                Batal
              </Button>
              <Button
                type="submit"
                // Tombol di-disable kalau locationID/picID kosong (belum termuat dari API/Token) atau sedang submit
                disabled={
                  createMutation.isPending ||
                  !watchLocationID ||
                  !watchPicID ||
                  isLoadingLokasi
                }
                className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold h-11 px-6 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  "Memproses Draft..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4 text-[#D4A373]" />
                    Buat Draft & Mulai Opname
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}