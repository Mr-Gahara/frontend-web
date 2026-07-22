"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

// --- Form & Validation ---
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Loader2,
  Edit3,
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

// --- TIPE DATA LOKAL ---
const SATUAN_OPTIONS = ["gram", "ml", "pcs", "kg", "liter"] as const;

// --- ZOD SCHEMA ---
const resepSchema = z.object({
  bahanBakuID: z.string().min(1, "Bahan baku harus dipilih"),
  jumlah: z.coerce.number().min(0.01, "Jumlah harus lebih dari 0"),
  satuan: z.enum(SATUAN_OPTIONS, { message: "Satuan tidak valid" }),
});

const produkSchema = z.object({
  namaProduk: z.string().min(1, "Nama produk wajib diisi"),
  kategoriID: z.string().min(1, "Kategori wajib dipilih"),
  gambarProduk: z.string().optional().default(""),
  keterangan: z.string().optional().default(""),
  hargaDasar: z.coerce.number().min(0, "Harga dasar tidak boleh negatif"),
  hargaJual: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
  stok: z.coerce.number().min(0, "Stok tidak boleh negatif").default(0),
  resep: z.array(resepSchema).default([]),
});

type ProdukFormInput = z.input<typeof produkSchema>;
type ProdukFormOutput = z.output<typeof produkSchema>;

export default function EditProdukPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const produkId = params.id as string;
  const [openCombobox, setOpenCombobox] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- REACT HOOK FORM ---
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProdukFormInput, any, ProdukFormOutput>({
    resolver: zodResolver(produkSchema),
    defaultValues: {
      namaProduk: "",
      kategoriID: "",
      gambarProduk: "",
      keterangan: "",
      hargaDasar: 0,
      hargaJual: 0,
      stok: 0,
      resep: [],
    },
  });

  // --- DYNAMIC FIELDS UNTUK RESEP (useFieldArray) ---
  const { fields, append, remove } = useFieldArray({
    control,
    name: "resep",
  });

  // Mengawasi seluruh resep untuk logika disable input Stok
  const watchedResep = useWatch({ control, name: "resep" }) || [];
  const hasResep = watchedResep.length > 0;

  // Efek samping: Jika resep ada, paksa stok menjadi 0 di form
  useEffect(() => {
    if (hasResep && isInitialized) {
      setValue("stok", 0);
    }
  }, [hasResep, setValue, isInitialized]);

  // --- FETCH KATEGORI ---
  const {
    data: kategoriList = [],
    isLoading: isLoadingKategori,
    error: kategoriError,
  } = useQuery({
    queryKey: queryKeys.kategori,
    queryFn: async () => {
      const res = await apiClient.get<any>("/kategori", undefined, "pengguna");
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // --- FETCH BAHAN BAKU ---
  const { data: bahanBakuList = [] } = useQuery({
    queryKey: queryKeys.bahanBaku,
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(
          "/bahan-baku",
          undefined,
          "pengguna"
        );
        const raw = res.data?.data || res.data || [];
        return Array.isArray(raw) ? raw : [];
      } catch (error) {
        const res = await apiClient.get<any>(
          "/bahanBaku",
          undefined,
          "pengguna"
        );
        const raw = res.data?.data || res.data || [];
        return Array.isArray(raw) ? raw : [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // --- FETCH DETAIL PRODUK ---
  const {
    data: produkDetail,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail,
    error: detailError,
  } = useQuery({
    queryKey: queryKeys.produkDetail(produkId),
    enabled: !!produkId,
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/produk/${produkId}`,
        undefined,
        "pengguna"
      );
      return res.data?.data || res.data;
    },
  });

  // --- EFFECT: PREFILL FORM ---
  useEffect(() => {
    if (produkDetail && !isLoadingKategori && !isInitialized) {
      // 1. Resolve Category ID
      let catId =
        typeof produkDetail.kategoriID === "object" &&
        produkDetail.kategoriID !== null
          ? (produkDetail.kategoriID as any)._id
          : String(produkDetail.kategoriID || "");

      // Fallback text matching (if legacy data)
      if (!catId && produkDetail.kategori && kategoriList.length > 0) {
        const matchedCategory = kategoriList.find(
          (k: any) =>
            k.namaKategori.toLowerCase() ===
            produkDetail.kategori?.toLowerCase()
        );
        if (matchedCategory) catId = matchedCategory._id;
      }

      // 2. Resolve Resep
      let parsedResep: any[] = [];
      if (produkDetail.resep && Array.isArray(produkDetail.resep)) {
        parsedResep = produkDetail.resep.map((r: any) => {
          let extractedId = "";
          if (typeof r.bahanBakuID === "object" && r.bahanBakuID !== null) {
            extractedId = String(r.bahanBakuID._id || r.bahanBakuID.id || "");
          } else {
            extractedId = String(r.bahanBakuID || "");
          }
          return {
            bahanBakuID: extractedId,
            jumlah: Number(r.jumlah || 0),
            satuan: String(r.satuan || "gram"),
          };
        });
      }

      // 3. Update RHF State
      reset({
        namaProduk: produkDetail.namaProduk || "",
        kategoriID: catId,
        gambarProduk: produkDetail.gambarProduk || "",
        keterangan: produkDetail.keterangan || "",
        hargaDasar: produkDetail.hargaDasar || 0,
        hargaJual: produkDetail.hargaJual || 0,
        stok: produkDetail.stok || 0,
        resep: parsedResep,
      });

      setIsInitialized(true);
    }
  }, [produkDetail, kategoriList, isLoadingKategori, isInitialized, reset]);

  // ERROR TOASTS
  useEffect(() => {
    if (kategoriError)
      toast.error("Gagal", { description: "Gagal memuat daftar kategori." });
    if (detailError)
      toast.error("Gagal", { description: "Produk tidak ditemukan." });
  }, [kategoriError, detailError]);

  // --- MUTATION UPDATE PRODUK ---
  const updateProdukMutation = useMutation<any, Error, ProdukFormOutput>({
    mutationFn: async (payload: ProdukFormOutput) => {
      return await apiClient.put(
        `/produk/${produkId}`,
        payload,
        undefined,
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Perubahan produk berhasil disimpan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.produk });
      queryClient.invalidateQueries({
        queryKey: queryKeys.produkDetail(produkId),
      });
      router.push("/dashboard/inventaris/produk");
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan", {
        description: err.message || "Gagal memperbarui produk.",
      });
    },
  });

  // --- HANDLER SUBMIT ---
  const onSubmit = (data: ProdukFormOutput) => {
    const payload = { ...data };

    if (!payload.resep || payload.resep.length === 0) {
      payload.resep = []; // Kirim array kosong agar backend menghapus resep
    } else {
      payload.stok = 0; // Biarkan backend override lewat resep
    }

    updateProdukMutation.mutate(payload);
  };

  // --- LOADING STATES ---
  const isMencariData = isLoadingDetail && isFetchingDetail;

  if (isMencariData || !produkId) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A2947]/60" />
        <p className="text-sm font-bold text-[#0A2947]/60">
          {!produkId ? "Menyesuaikan rute..." : "Memuat detail produk..."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Tombol Kembali & Header */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/inventaris/produk")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Produk
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Edit Produk
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Perbarui informasi produk{" "}
            {produkDetail?.namaProduk ? `"${produkDetail.namaProduk}"` : ""}.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* GRID UTAMA: Info Produk & Harga */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KOLOM KIRI: Info Dasar */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <Edit3 className="h-5 w-5 text-[#D4A373]" />
              <h3 className="text-base font-bold text-[#0A2947]">
                Informasi Utama
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <Input
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
                                (kat: any) => kat._id === field.value
                              )?.namaKategori || "Kategori tidak ditemukan"
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
                            {kategoriList.map((kat: any) => (
                              <CommandItem
                                key={kat._id}
                                value={kat.namaKategori}
                                onSelect={() => {
                                  field.onChange(kat._id);
                                  setOpenCombobox(false);
                                }}
                                className="cursor-pointer text-[#0A2947] aria-selected:bg-[#0A2947]/5 font-medium"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-[#718355]",
                                    field.value === kat._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {kat.namaKategori}
                              </CommandItem>
                            ))}
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
              <label className="text-sm font-bold text-[#0A2947]">
                Link Gambar Produk{" "}
                <span className="text-[#0A2947]/50 font-medium">
                  (Opsional)
                </span>
              </label>
              <Input
                {...register("gambarProduk")}
                placeholder="https://example.com/gambar.jpg"
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Keterangan{" "}
                <span className="text-[#0A2947]/50 font-medium">
                  (Opsional)
                </span>
              </label>
              <Input
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
                <label className="text-sm font-bold text-[#0A2947]">
                  Harga Dasar (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  {...register("hargaDasar")}
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold focus-visible:ring-1 focus-visible:ring-[#0A2947] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <div className="min-h-4 flex flex-col justify-start">
                  {errors.hargaDasar ? (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.hargaDasar.message}
                    </span>
                  ) : (
                    <p className="text-xs font-medium text-[#0A2947]/50">
                      Modal belanja/produksi per item.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Harga Jual (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  {...register("hargaJual")}
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold focus-visible:ring-1 focus-visible:ring-[#0A2947] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
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
              <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
                <PackagePlus className="h-5 w-5 text-[#D4A373]" />
                <h3 className="text-base font-bold text-[#0A2947]">
                  Stok Sistem
                </h3>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  {...register("stok")}
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold focus-visible:ring-1 focus-visible:ring-[#0A2947] disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                  disabled={hasResep}
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
                          ? "Input stok dinonaktifkan karena produk menggunakan resep. Stok terhitung otomatis dari bahan baku."
                          : "Edit stok produk. Disarankan merubah stok melalui jurnal Penyesuaian / Stok Opname agar riwayat tercatat."}
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
                Ubah resep jika ada penyesuaian penggunaan komposisi.
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
                  Produk ini saat ini berstatus sebagai barang jadi.
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
                          <Select
                            onValueChange={(val) => {
                              selectField.onChange(val);
                              const selectedBahan = bahanBakuList.find(
                                (b: any) => b._id === val
                              );
                              if (selectedBahan && selectedBahan.satuan) {
                                setValue(
                                  `resep.${index}.satuan`,
                                  selectedBahan.satuan
                                );
                              }
                            }}
                            value={selectField.value}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-full bg-white border-[#0A2947]/20 text-[#0A2947] font-bold h-10 focus:ring-1 focus:ring-[#0A2947]",
                                errors.resep?.[index]?.bahanBakuID &&
                                  "border-rose-500"
                              )}
                            >
                              <SelectValue placeholder="Pilih bahan..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                              {bahanBakuList.length === 0 ? (
                                <div className="p-2 text-sm text-center font-medium text-[#0A2947]/50">
                                  Data kosong...
                                </div>
                              ) : (
                                bahanBakuList.map((bb: any) => (
                                  <SelectItem
                                    key={bb._id}
                                    value={bb._id}
                                    className="cursor-pointer hover:bg-[#0A2947]/5 font-bold"
                                  >
                                    {bb.namaBahan}{" "}
                                    <span className="font-medium text-xs text-[#0A2947]/50 ml-1">
                                      ({bb.satuan})
                                    </span>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
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
                        {...register(`resep.${index}.jumlah`)}
                        className={cn(
                          "w-full text-center bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold h-10 focus-visible:ring-1 focus-visible:ring-[#0A2947] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                          errors.resep?.[index]?.jumlah && "border-rose-500"
                        )}
                        placeholder="0"
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
                                  "border-rose-500"
                              )}
                            >
                              <SelectValue placeholder="Satuan" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                              {SATUAN_OPTIONS.map((sat) => (
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
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#0A2947]/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/inventaris/produk")}
            disabled={updateProdukMutation.isPending || isLoadingDetail}
            className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-12 w-full sm:w-auto px-8"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={updateProdukMutation.isPending || isLoadingDetail}
            className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold h-12 w-full sm:w-auto px-8"
          >
            {updateProdukMutation.isPending
              ? "Menyimpan Perubahan..."
              : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}