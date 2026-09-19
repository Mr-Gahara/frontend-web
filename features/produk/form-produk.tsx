"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { pesanError } from "@/lib/api/error";
import { BahanBakuCombobox } from "@/app/dashboard/outlet/inventaris/components/bahanBakuCombobox";
import { useDaftarBahanBaku } from "@/features/bahan-baku/hooks";
import { useDaftarKategori } from "@/features/kategori/hooks";
import { useSimpanProduk } from "./hooks";
import { susunPayloadProduk } from "./payload";
import {
  keAngka,
  skemaProduk,
  SATUAN_RESEP,
  type NilaiFormProduk,
  type SatuanResep,
} from "./schema";
import type { Produk } from "@/types/produk";

// --- Form & Validation ---
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  PackagePlus,
  Plus,
  Trash2,
  ChefHat,
  Info,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModeFormProduk = "buat" | "edit";

const URL_DAFTAR_PRODUK = "/dashboard/outlet/inventaris/produk";

/** Teks yang berbeda antara mode buat dan edit; isinya mengikuti teks halaman sebelumnya. */
const TEKS = {
  buat: {
    judul: "Tambah Produk",
    deskripsi:
      "Masukkan informasi detail, harga, dan resep bahan baku (jika ada) untuk produk baru.",
    judulStok: "Stok Awal",
    petunjukStok:
      "Masukkan stok awal. Anda dapat membiarkannya 0 dan melakukan Stok Opname nanti.",
    petunjukStokResep:
      "Input stok dinonaktifkan karena Anda menggunakan Resep. Stok dihitung otomatis dari bahan baku.",
    deskripsiResep:
      "Tambahkan bahan baku jika produk ini diproduksi/diracik (Bill of Materials).",
    resepKosong: "Produk ini akan dianggap sebagai barang jadi.",
    tombolSimpan: "Simpan Produk Baru",
    tombolMenyimpan: "Menyimpan Data...",
    berhasil: "Produk baru berhasil ditambahkan.",
    gagal: "Gagal menambahkan produk baru.",
  },
  edit: {
    judul: "Edit Produk",
    deskripsi: "Perbarui informasi produk.",
    judulStok: "Stok Sistem",
    petunjukStok:
      "Edit stok produk. Disarankan merubah stok melalui jurnal Penyesuaian / Stok Opname agar riwayat tercatat.",
    petunjukStokResep:
      "Input stok dinonaktifkan karena produk menggunakan resep. Stok terhitung otomatis dari bahan baku.",
    deskripsiResep: "Ubah resep jika ada penyesuaian penggunaan komposisi.",
    resepKosong: "Produk ini saat ini berstatus sebagai barang jadi.",
    tombolSimpan: "Simpan Perubahan",
    tombolMenyimpan: "Menyimpan Perubahan...",
    berhasil: "Perubahan produk berhasil disimpan.",
    gagal: "Gagal memperbarui produk.",
  },
} as const;

function nilaiAwalDari(produk?: Produk): NilaiFormProduk {
  if (!produk) {
    return {
      namaProduk: "",
      kategoriID: "",
      gambarProduk: "",
      keterangan: "",
      hargaDasar: 0,
      hargaJual: 0,
      stok: 0,
      isUnlimitedStok: false,
      resep: [],
    };
  }
  return {
    namaProduk: produk.namaProduk,
    kategoriID: produk.kategoriID,
    gambarProduk: produk.gambarProduk ?? "",
    keterangan: produk.keterangan ?? "",
    hargaDasar: produk.hargaDasar,
    hargaJual: produk.hargaJual,
    stok: produk.stok,
    isUnlimitedStok: produk.isUnlimitedStok ?? false,
    resep: produk.resep.map((r) => ({
      bahanBakuID: r.bahanBakuID,
      jumlah: r.jumlah,
      satuan: r.satuan,
    })),
  };
}

interface PropsFormProduk {
  mode: ModeFormProduk;
  /** Produk yang diubah; wajib pada mode edit. */
  produk?: Produk;
}

/**
 * Form produk untuk mode buat dan edit.
 *
 * Pada mode edit, komponen ini dipasang setelah detail produk termuat, sehingga
 * nilai awal cukup diberikan lewat defaultValues tanpa effect pengisi ulang.
 */
export function FormProduk({ mode, produk }: PropsFormProduk) {
  const router = useRouter();
  const teks = TEKS[mode];
  const resepAwalAda = (produk?.resep.length ?? 0) > 0;

  const [openCombobox, setOpenCombobox] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<NilaiFormProduk>({
    resolver: zodResolver(skemaProduk),
    defaultValues: nilaiAwalDari(produk),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "resep",
  });

  const isUnlimitedStok = useWatch({ control, name: "isUnlimitedStok" });
  const hasResep = fields.length > 0;
  // Resep lama dihapus seluruhnya: backend akan menjadikan stok 0 (lihat
  // susunPayloadProduk), sehingga pengguna perlu diberi tahu.
  const resepAkanDihapus = resepAwalAda && !hasResep;

  // Efek samping: Manajemen Paksa Stok
  useEffect(() => {
    if (hasResep || isUnlimitedStok) {
      setValue("stok", 0);
    }
    if (hasResep && isUnlimitedStok) {
      setValue("isUnlimitedStok", false);
    }
  }, [hasResep, isUnlimitedStok, setValue]);

  const {
    data: kategoriList = [],
    isSuccess: kategoriTermuat,
    error: kategoriError,
  } = useDaftarKategori();
  const {
    data: bahanBakuList = [],
    isLoading: isLoadingBahanBaku,
    error: bahanBakuError,
  } = useDaftarBahanBaku();
  const simpanMutation = useSimpanProduk();

  useEffect(() => {
    if (kategoriError) {
      toast.error("Gagal Memuat Kategori", {
        description: pesanError(kategoriError, "Gagal memuat daftar kategori."),
      });
    }
  }, [kategoriError]);

  useEffect(() => {
    if (bahanBakuError) {
      toast.error("Gagal Memuat Bahan Baku", {
        description: pesanError(bahanBakuError, "Gagal memuat daftar bahan baku."),
      });
    }
  }, [bahanBakuError]);

  const onSubmit = async (nilai: NilaiFormProduk) => {
    // Validator backend hanya memeriksa format kategoriID, sehingga id kategori
    // yang sudah dihapus tetap diterima dan produk tetap tanpa kategori.
    if (kategoriTermuat && !kategoriList.some((k) => k.id === nilai.kategoriID)) {
      setError("kategoriID", {
        message: "Kategori produk ini sudah dihapus. Pilih kategori baru.",
      });
      return;
    }

    try {
      await simpanMutation.mutateAsync({
        id: produk?.id,
        data: susunPayloadProduk(nilai, { resepAwalAda }),
      });
      toast.success("Berhasil", { description: teks.berhasil });
      router.push(URL_DAFTAR_PRODUK);
    } catch (err) {
      toast.error("Gagal Menyimpan", {
        description: pesanError(err, teks.gagal),
      });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Tombol Kembali & Header */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/inventaris/produk")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Produk
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            {teks.judul}
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            {produk ? (
              <>Perbarui informasi produk &quot;{produk.namaProduk}&quot;.</>
            ) : (
              teks.deskripsi
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* GRID UTAMA: Info Produk & Harga */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KOLOM KIRI: Info Dasar */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <PackagePlus className="h-5 w-5 text-[#D4A373]" />
              <h3 className="text-base font-bold text-[#0A2947]">
                Informasi Utama
              </h3>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-bold text-[#0A2947]"
                htmlFor="namaProduk"
              >
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <Input
                id="namaProduk"
                {...register("namaProduk")}
                placeholder="Contoh: Kopi Susu Gula Aren"
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947]"
              />
              <div className="min-h-4">
                {errors.namaProduk && (
                  <span className="text-xs font-bold text-rose-500">
                    {errors.namaProduk.message}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-bold text-[#0A2947]">
                Kategori <span className="text-red-500">*</span>
              </label>
              <Controller
                name="kategoriID"
                control={control}
                render={({ field }) => (
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 focus:ring-1 focus:ring-[#0A2947]"
                      >
                        <span
                          className={
                            field.value
                              ? "font-bold"
                              : "font-normal text-[#0A2947]/50"
                          }
                        >
                          {field.value
                            ? kategoriList.find(
                                (kat) => kat.id === field.value,
                              )?.namaKategori ||
                              (kategoriTermuat
                                ? "Kategori tidak ditemukan"
                                : "Memuat kategori...")
                            : "Pilih kategori produk..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0 border-[#0A2947]/10"
                      align="start"
                    >
                      <Command className="bg-[#FFFAF3]">
                        <CommandInput
                          placeholder="Cari kategori..."
                          className="text-[#0A2947]"
                        />
                        <CommandList>
                          <CommandEmpty className="py-6 text-center text-sm text-[#0A2947]/60 font-medium">
                            Kategori tidak ditemukan.
                          </CommandEmpty>
                          <CommandGroup>
                            {kategoriList.map((kat) => {
                              const katId = kat.id;
                              return (
                                <CommandItem
                                  key={katId}
                                  value={kat.namaKategori}
                                  onSelect={() => {
                                    field.onChange(katId);
                                    setOpenCombobox(false);
                                  }}
                                  className="cursor-pointer text-[#0A2947] aria-selected:bg-[#0A2947]/5 font-medium"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 text-[#718355]",
                                      field.value === katId
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {kat.namaKategori}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              <div className="min-h-4">
                {errors.kategoriID && (
                  <span className="text-xs font-bold text-rose-500">
                    {errors.kategoriID.message}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-bold text-[#0A2947]"
                htmlFor="gambarProduk"
              >
                Link Gambar Produk{" "}
                <span className="text-[#0A2947]/50 font-medium">
                  (Opsional)
                </span>
              </label>
              <Input
                id="gambarProduk"
                {...register("gambarProduk")}
                placeholder="https://example.com/gambar.jpg"
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947]"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-bold text-[#0A2947]"
                htmlFor="keteranganProduk"
              >
                Keterangan{" "}
                <span className="text-[#0A2947]/50 font-medium">
                  (Opsional)
                </span>
              </label>
              <Input
                id="keteranganProduk"
                {...register("keterangan")}
                placeholder="Catatan singkat mengenai produk ini..."
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947]"
              />
            </div>
          </div>

          {/* KOLOM KANAN: Harga & Stok */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
                <span className="h-5 w-5 rounded-full bg-[#D4A373] text-white flex items-center justify-center font-bold text-xs">
                  $
                </span>
                <h3 className="text-base font-bold text-[#0A2947]">
                  Manajemen Harga
                </h3>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-bold text-[#0A2947]"
                  htmlFor="hargaDasar"
                >
                  Harga Dasar (Rp) <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="hargaDasar"
                  control={control}
                  render={({ field }) => {
                    const numericValue = Number(field.value) || 0;
                    const displayValue =
                      numericValue === 0
                        ? ""
                        : new Intl.NumberFormat("id-ID").format(numericValue);
                    return (
                      <Input
                        id="hargaDasar"
                        placeholder="0"
                        value={displayValue}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          field.onChange(raw ? Number(raw) : 0);
                        }}
                        className={cn(
                          "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold focus-visible:ring-1 focus-visible:ring-[#0A2947]",
                          errors.hargaDasar && "border-rose-500",
                        )}
                        inputMode="numeric"
                      />
                    );
                  }}
                />
                <div className="min-h-4 flex flex-col justify-start">
                  {errors.hargaDasar ? (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.hargaDasar.message}
                    </span>
                  ) : (
                    <p className="text-xs font-medium text-[#0A2947]/50">
                      Modal produksi per item.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-bold text-[#0A2947]"
                  htmlFor="hargaJual"
                >
                  Harga Jual (Rp) <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="hargaJual"
                  control={control}
                  render={({ field }) => {
                    const numericValue = Number(field.value) || 0;
                    const displayValue =
                      numericValue === 0
                        ? ""
                        : new Intl.NumberFormat("id-ID").format(numericValue);
                    return (
                      <Input
                        id="hargaJual"
                        placeholder="0"
                        value={displayValue}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          field.onChange(raw ? Number(raw) : 0);
                        }}
                        className={cn(
                          "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold focus-visible:ring-1 focus-visible:ring-[#0A2947]",
                          errors.hargaJual && "border-rose-500",
                        )}
                        inputMode="numeric"
                      />
                    );
                  }}
                />
                <div className="min-h-4 flex flex-col justify-start">
                  {errors.hargaJual ? (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.hargaJual.message}
                    </span>
                  ) : (
                    <p className="text-xs font-medium text-[#0A2947]/50">
                      Harga yang ditawarkan ke pelanggan.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#0A2947]/10 pb-3">
                <div className="flex items-center gap-2">
                  <PackagePlus className="h-5 w-5 text-[#D4A373]" />
                  <h3 id="judulStok" className="text-base font-bold text-[#0A2947]">
                    {teks.judulStok}
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-3 bg-[#FFFAF3] p-3 rounded-xl border border-[#0A2947]/10">
                  <Controller
                    name="isUnlimitedStok"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        key={`unlimited-${hasResep}`}
                        id="unlimited"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={hasResep}
                        className="data-[state=checked]:bg-[#718355] data-[state=checked]:text-white border-[#0A2947]/30"
                      />
                    )}
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="unlimited"
                      className="text-sm font-bold text-[#0A2947] cursor-pointer"
                    >
                      Produk Tanpa Stok (Unlimited)
                    </label>
                    <p className="text-[10px] font-medium text-[#0A2947]/50">
                      Aktifkan jika produk ini berupa layanan (jasa) atau stok
                      tidak terbatas.
                    </p>
                  </div>
                </div>

                <Input
                  id="stok"
                  aria-labelledby="judulStok"
                  type="number"
                  {...register("stok", { setValueAs: keAngka })}
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold focus-visible:ring-1 focus-visible:ring-[#0A2947] disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                  disabled={hasResep || isUnlimitedStok}
                />
                <div className="flex items-start gap-2 mt-2">
                  <Info className="w-4 h-4 text-[#0A2947]/50 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 min-h-4">
                    {errors.stok ? (
                      <span className="text-xs font-bold text-rose-500">
                        {errors.stok.message}
                      </span>
                    ) : (
                      <p className="text-xs font-medium text-[#0A2947]/60 leading-relaxed">
                        {hasResep
                          ? teks.petunjukStokResep
                          : isUnlimitedStok
                            ? "Stok dinonaktifkan karena produk ini berstatus Unlimited (Tanpa batas)."
                            : resepAkanDihapus
                              ? "Stok akan menjadi 0 setelah resep dihapus. Atur stok kembali setelah menyimpan."
                              : teks.petunjukStok}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: RESEP BAHAN BAKU (USE FIELD ARRAY) */}
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#0A2947]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F2EAE1]">
            <div>
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-[#D4A373]" />
                <h3 className="text-base font-bold text-[#0A2947]">
                  Resep & Komposisi (BOM)
                </h3>
              </div>
              <p className="text-xs font-medium text-[#0A2947]/60 mt-1">
                {teks.deskripsiResep}
              </p>
            </div>
            <Button
              type="button"
              onClick={() =>
                append({ bahanBakuID: "", jumlah: 0, satuan: "gram" })
              }
              className="cursor-pointer bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold shadow-sm h-9"
            >
              <Plus className="w-4 h-4 mr-2" /> Tambah Bahan
            </Button>
          </div>

          <div className="p-6">
            {fields.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-[#0A2947]/10 rounded-xl bg-white/50">
                <ChefHat className="w-8 h-8 text-[#0A2947]/20 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#0A2947]/50">
                  Tidak ada resep yang ditambahkan.
                </p>
                <p className="text-xs font-medium text-[#0A2947]/40 mt-1">
                  {teks.resepKosong}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header Tabel (Desktop) */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-2 text-xs font-bold text-[#0A2947]/60 uppercase tracking-wider">
                  <div className="col-span-5">Pilih Bahan Baku</div>
                  <div className="col-span-3 text-center">Jumlah</div>
                  <div className="col-span-3 text-center">Satuan</div>
                  <div className="col-span-1 text-center">Aksi</div>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start p-4 sm:p-2 border sm:border-none border-[#0A2947]/10 rounded-xl sm:rounded-none bg-white sm:bg-transparent shadow-sm sm:shadow-none"
                  >
                    {/* Pilih Bahan Baku */}
                    <div className="col-span-1 sm:col-span-5">
                      <label className="text-xs font-bold text-[#0A2947] mb-1.5 block sm:hidden">
                        Bahan Baku
                      </label>
                      <Controller
                        name={`resep.${index}.bahanBakuID`}
                        control={control}
                        render={({ field: selectField }) => (
                          <BahanBakuCombobox
                            value={selectField.value ?? field.bahanBakuID ?? ""}
                            onChange={selectField.onChange}
                            onSatuanChange={(satuan) =>
                              setValue(
                                `resep.${index}.satuan`,
                                satuan as SatuanResep,
                              )
                            }
                            bahanBakuList={bahanBakuList}
                            isLoading={isLoadingBahanBaku}
                            hasError={!!errors.resep?.[index]?.bahanBakuID}
                          />
                        )}
                      />
                      {errors.resep?.[index]?.bahanBakuID && (
                        <span className="text-[10px] font-bold text-rose-500 mt-1 block">
                          {errors.resep[index]?.bahanBakuID?.message}
                        </span>
                      )}
                    </div>

                    {/* Jumlah */}
                    <div className="col-span-1 sm:col-span-3">
                      <label className="text-xs font-bold text-[#0A2947] mb-1.5 block sm:hidden">
                        Jumlah
                      </label>
                      <Input
                        type="number"
                        {...register(`resep.${index}.jumlah`, { setValueAs: keAngka })}
                        className={cn(
                          "w-full text-center bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold h-10 focus-visible:ring-1 focus-visible:ring-[#0A2947] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                          errors.resep?.[index]?.jumlah && "border-rose-500",
                        )}
                        placeholder="0"
                        step="any"
                      />
                      {errors.resep?.[index]?.jumlah && (
                        <span className="text-[10px] font-bold text-rose-500 mt-1 block text-center sm:text-left">
                          {errors.resep[index]?.jumlah?.message}
                        </span>
                      )}
                    </div>

                    {/* Satuan */}
                    <div className="col-span-1 sm:col-span-3">
                      <label className="text-xs font-bold text-[#0A2947] mb-1.5 block sm:hidden">
                        Satuan
                      </label>
                      <Controller
                        name={`resep.${index}.satuan`}
                        control={control}
                        render={({ field: selectField }) => (
                          <Select
                            onValueChange={selectField.onChange}
                            value={selectField.value}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-full bg-white border-[#0A2947]/20 text-[#0A2947] font-bold h-10 focus:ring-1 focus:ring-[#0A2947]",
                                errors.resep?.[index]?.satuan &&
                                  "border-rose-500",
                              )}
                            >
                              <SelectValue placeholder="Satuan" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                              {SATUAN_RESEP.map((sat) => (
                                <SelectItem
                                  key={sat}
                                  value={sat}
                                  className="cursor-pointer hover:bg-[#0A2947]/5 font-bold"
                                >
                                  {sat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.resep?.[index]?.satuan && (
                        <span className="text-[10px] font-bold text-rose-500 mt-1 block">
                          {errors.resep[index]?.satuan?.message}
                        </span>
                      )}
                    </div>

                    {/* Aksi Hapus */}
                    <div className="col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => remove(index)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-10 w-10 p-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aksi Tombol */}
        {/* FIX 2: flex-col-reverse untuk responsivitas Mobile */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/outlet/inventaris/produk")}
            disabled={simpanMutation.isPending}
            className="w-full sm:w-auto cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-12 px-8"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={simpanMutation.isPending}
            className="w-full sm:w-auto cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold h-12 px-8"
          >
            {simpanMutation.isPending ? teks.tombolMenyimpan : teks.tombolSimpan}
          </Button>
        </div>
      </form>
    </div>
  );
}
