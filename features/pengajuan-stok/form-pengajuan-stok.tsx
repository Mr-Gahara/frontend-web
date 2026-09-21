"use client";

import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { pesanError } from "@/lib/api/error";
import type { PengajuanStok } from "@/types/pengajuanStok";
import { useDaftarLokasi } from "@/features/inventaris/hooks";
import { useDaftarBahanBaku } from "@/features/bahan-baku/hooks";
import { useBuatPengajuan, usePerbaruiPengajuan } from "./hooks";
import { BARIS_KOSONG, nilaiAwalPengajuan, susunPayloadPengajuan } from "./payload";
import { skemaPengajuan, type NilaiFormPengajuan } from "./schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/calendar";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  MapPin,
  Package,
  CalendarClock,
  CalendarIcon,
} from "lucide-react";

const URL_DAFTAR = "/dashboard/outlet/inventaris/pengajuanStok";

const TEKS = {
  buat: {
    kembali: "Kembali ke Daftar Pengajuan",
    deskripsi: "Pilih barang yang dibutuhkan dan simpan sebagai DRAFT sebelum diajukan ke Gudang.",
    simpan: "Simpan sebagai Draft",
    gagal: "Gagal Menyimpan",
  },
  edit: {
    kembali: "Batal Revisi",
    deskripsi: "Perbarui item kebutuhan atau rute logistik sebelum dokumen ini diajukan.",
    simpan: "Simpan Perubahan",
    gagal: "Gagal Memperbarui",
  },
} as const;

function pesanPertama(errors: FieldErrors<NilaiFormPengajuan>): string {
  return (
    errors.keLocationID?.message ??
    errors.dariLocationID?.message ??
    errors.items?.message ??
    errors.items?.root?.message ??
    "Periksa kembali isian form."
  );
}

interface Props {
  /** Dokumen DRAFT yang direvisi; kosong berarti membuat pengajuan baru. */
  pengajuan?: PengajuanStok;
}

/**
 * Form bersama buat dan revisi pengajuan stok. Nilai awal dibaca sekali dari
 * defaultValues, sehingga halaman edit memasang form setelah detail termuat
 * (keputusan rancangan butir 8). Pilihan outlet mengisi keLocationID dan
 * pilihan gudang mengisi dariLocationID (arah.ts). Cakupan outlet yang boleh
 * dipilih masih seluruh outlet; keputusannya ditahan sebagai utang.
 */
export function FormPengajuanStok({ pengajuan }: Props) {
  const router = useRouter();
  const teks = pengajuan ? TEKS.edit : TEKS.buat;

  const { data: lokasiList = [], isLoading: memuatLokasi } = useDaftarLokasi();
  const outletList = lokasiList.filter((l) => l.tipe === "Outlet");
  const gudangList = lokasiList.filter((l) => l.tipe === "Gudang");
  const { data: bahanBakuList = [], isLoading: memuatBahan } = useDaftarBahanBaku();

  const { control, register, handleSubmit, setValue } = useForm<NilaiFormPengajuan>({
    resolver: zodResolver(skemaPengajuan),
    defaultValues: nilaiAwalPengajuan(pengajuan),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });
  const keLocationID = useWatch({ control, name: "keLocationID" });
  const dariLocationID = useWatch({ control, name: "dariLocationID" });

  const buatMutation = useBuatPengajuan({
    onSuccess: () => {
      toast.success("Draft Pengajuan Disimpan", {
        description: "Pengajuan berhasil dibuat dan siap untuk ditinjau sebelum dikirim.",
      });
      router.push(URL_DAFTAR);
    },
    onError: (err) =>
      toast.error(TEKS.buat.gagal, { description: pesanError(err, "Gagal menyimpan pengajuan.") }),
  });
  const perbaruiMutation = usePerbaruiPengajuan(pengajuan?.id ?? "", {
    onSuccess: () => {
      toast.success("Perubahan Disimpan", { description: "Draft pengajuan berhasil diperbarui." });
      router.push(`${URL_DAFTAR}/${pengajuan?.id}`);
    },
    onError: (err) =>
      toast.error(TEKS.edit.gagal, { description: pesanError(err, "Gagal memperbarui pengajuan.") }),
  });
  const menyimpan = buatMutation.isPending || perbaruiMutation.isPending;

  const simpan = handleSubmit(
    (nilai) => {
      const payload = susunPayloadPengajuan(nilai);
      if (pengajuan) perbaruiMutation.mutate(payload);
      else buatMutation.mutate(payload);
    },
    (errors) => toast.error(teks.gagal, { description: pesanPertama(errors) }),
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {teks.kembali}
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            {pengajuan
              ? `Revisi Draft Pengajuan: ${pengajuan.nomorPengajuan}`
              : "Buat Draft Pengajuan Stok"}
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">{teks.deskripsi}</p>
        </div>
      </div>

      {/* SECTION 1: RUTE LOGISTIK */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
          <MapPin className="h-5 w-5 text-[#D4A373]" />
          <h2 className="font-bold text-[#0A2947]">Rute Logistik</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label htmlFor="pengajuan-outlet" className="text-sm font-bold text-[#0A2947]">
              Outlet Peminta <span className="text-rose-500">*</span>
            </label>
            <Controller
              control={control}
              name="keLocationID"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={memuatLokasi}>
                  <SelectTrigger
                    id="pengajuan-outlet"
                    className="w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus:ring-[#0A2947]"
                  >
                    <SelectValue placeholder="Pilih Outlet Anda..." />
                  </SelectTrigger>
                  <SelectContent>
                    {outletList.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id} className="font-medium cursor-pointer">
                        {loc.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pengajuan-gudang" className="text-sm font-bold text-[#0A2947]">
              Gudang Asal Barang <span className="text-rose-500">*</span>
            </label>
            <Controller
              control={control}
              name="dariLocationID"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={memuatLokasi}>
                  <SelectTrigger
                    id="pengajuan-gudang"
                    className="w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus:ring-[#0A2947]"
                  >
                    <SelectValue placeholder="Pilih Gudang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {gudangList.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id} className="font-medium cursor-pointer">
                        {loc.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: DAFTAR BARANG YANG DIMINTA */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#0A2947]/10 pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">Daftar Kebutuhan Barang</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...BARIS_KOSONG })}
            className="border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm h-8 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" /> Tambah Baris
          </Button>
        </div>

        <div className="space-y-3 pt-2">
          {fields.map((baris, index) => (
            <div
              key={baris.id}
              className="flex flex-col sm:flex-row items-start sm:items-end gap-3 bg-white p-3 rounded-xl border border-[#0A2947]/10"
            >
              <div className="w-full sm:flex-1 space-y-1.5">
                <label htmlFor={`pengajuan-bahan-${index}`} className="text-xs font-bold text-[#0A2947]/70">
                  Pilih Barang <span className="text-rose-500">*</span>
                </label>
                <Controller
                  control={control}
                  name={`items.${index}.bahanBakuID`}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(nilai) => {
                        field.onChange(nilai);
                        const bahan = bahanBakuList.find((b) => b.id === nilai);
                        setValue(`items.${index}.satuan`, bahan?.satuan ?? "");
                      }}
                      disabled={memuatBahan}
                    >
                      <SelectTrigger
                        id={`pengajuan-bahan-${index}`}
                        className="w-full bg-transparent border-[#0A2947]/20 focus:ring-[#0A2947]"
                      >
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        {bahanBakuList.map((bahan) => (
                          <SelectItem key={bahan.id} value={bahan.id} className="cursor-pointer">
                            {bahan.namaBahan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="w-full sm:w-32 space-y-1.5">
                <label htmlFor={`pengajuan-jumlah-${index}`} className="text-xs font-bold text-[#0A2947]/70">
                  Jumlah <span className="text-rose-500">*</span>
                </label>
                <Input
                  id={`pengajuan-jumlah-${index}`}
                  type="number"
                  placeholder="0"
                  {...register(`items.${index}.jumlah`)}
                  className="bg-transparent border-[#0A2947]/20 focus-visible:ring-[#0A2947] font-mono font-bold no-spinner"
                />
              </div>

              <div className="w-full sm:w-32 space-y-1.5">
                <label htmlFor={`pengajuan-satuan-${index}`} className="text-xs font-bold text-[#0A2947]/70">
                  Satuan
                </label>
                <Input
                  id={`pengajuan-satuan-${index}`}
                  type="text"
                  readOnly
                  value={items?.[index]?.satuan || "-"}
                  className="bg-[#0A2947]/5 border-transparent font-medium text-[#0A2947]/50 cursor-not-allowed"
                  tabIndex={-1}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Hapus baris"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="w-10 h-10 text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: INFORMASI TAMBAHAN */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
          <CalendarClock className="h-5 w-5 text-[#D4A373]" />
          <h2 className="font-bold text-[#0A2947]">Informasi Pengiriman</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label htmlFor="pengajuan-tanggal" className="text-sm font-bold text-[#0A2947]">
              Tanggal Kebutuhan (Opsional)
            </label>
            <Controller
              control={control}
              name="tanggalKebutuhan"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="pengajuan-tanggal"
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left font-bold cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]",
                        !field.value && "text-[#0A2947]/50",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#D4A373]" />
                      {field.value
                        ? format(field.value, "dd MMMM yyyy", { locale: localeID })
                        : "Pilih tanggal..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-[#0A2947]/10 bg-[#FFFAF3]" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) field.onChange(date);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-[10px] text-[#0A2947]/50 font-medium">
              Batas waktu maksimal barang harus tiba di Outlet.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="pengajuan-catatan" className="text-sm font-bold text-[#0A2947]">
              Catatan / Pesan ke Gudang
            </label>
            <Textarea
              id="pengajuan-catatan"
              placeholder="Misal: Tolong kirimkan batch produksi terbaru..."
              {...register("catatan")}
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947] font-medium resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-end gap-3 pt-2">
        {!pengajuan && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="font-bold text-[#0A2947]/60 hover:text-[#0A2947] cursor-pointer"
          >
            Batal
          </Button>
        )}
        <Button
          type="button"
          onClick={simpan}
          disabled={menyimpan || (!pengajuan && (!keLocationID || !dariLocationID))}
          className="bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4 mr-2" />
          {menyimpan ? "Menyimpan..." : teks.simpan}
        </Button>
      </div>
    </div>
  );
}