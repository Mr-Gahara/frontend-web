"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { ProdukRequest, GetKategoriResponse } from "@/types/produk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, ChevronsUpDown, PackagePlus } from "lucide-react";
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
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

const emptyForm: ProdukRequest = {
  namaProduk: "",
  hargaDasar: 0,
  hargaJual: 0,
  kategoriID: "",
  keterangan: "",
  gambarProduk: "",
};

export default function BuatProdukPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProdukRequest>(emptyForm);
  const [hargaDasarInput, setHargaDasarInput] = useState("");
  const [hargaJualInput, setHargaJualInput] = useState("");
  const [formError, setFormError] = useState("");
  
  // State khusus untuk Combobox Kategori
  const [openCombobox, setOpenCombobox] = useState(false);

  // QUERY KATEGORI (UNTUK COMBOBOX)
  const { data: kategoriList = [], error: kategoriError } = useQuery({
    queryKey: queryKeys.kategori,
    queryFn: async () => {
      const res = await apiClient.get<GetKategoriResponse>(
        "/kategori",
        undefined,
        "pengguna"
      );
      return res.data;
    },
  });

  // ERROR TOAST KATEGORI
  useEffect(() => {
    if (kategoriError) {
      toast.error("Gagal", {
        description:
          kategoriError instanceof Error
            ? kategoriError.message
            : "Gagal memuat daftar kategori.",
      });
    }
  }, [kategoriError]);

  // MUTATION CREATE PRODUK
  const createProdukMutation = useMutation({
    mutationFn: async (payload: ProdukRequest) => {
      return await apiClient.post("/produk", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Produk baru berhasil ditambahkan.",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.produk,
      });
      // [BUG FIX]: Mengarahkan ke rute inventaris yang benar
      router.push("/dashboard/inventaris/produk");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal menambahkan produk baru.");
    },
  });

  // HANDLER SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.kategoriID) {
      setFormError("Silakan pilih kategori produk terlebih dahulu.");
      return;
    }

    await createProdukMutation.mutateAsync(form);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Tombol Kembali & Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/inventaris/produk")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Produk
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Tambah Produk</h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Masukkan informasi detail untuk membuat entri produk baru di sistem inventaris.
          </p>
        </div>
      </div>

      {/* Form Utama (Dibungkus Dark Cream) */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 sm:p-8">
          
          <div className="flex items-center gap-2 mb-2">
            <PackagePlus className="h-5 w-5 text-[#D4A373]" /> {/* Ikon Mustard */}
            <h3 className="text-base font-bold text-[#0A2947]">Informasi Produk</h3>
          </div>

          {/* Nama Produk */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">Nama Produk <span className="text-red-500">*</span></label>
            <Input
              value={form.namaProduk}
              onChange={(e) =>
                setForm({ ...form, namaProduk: e.target.value })
              }
              placeholder="Contoh: Kopi Susu Gula Aren"
              required
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
            />
          </div>

          {/* Kategori (Combobox / Searchable Dropdown) */}
          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-bold text-[#0A2947]">Kategori <span className="text-red-500">*</span></label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5"
                >
                  <span className={form.kategoriID ? "font-bold" : "font-normal text-[#0A2947]/50"}>
                    {form.kategoriID
                      ? kategoriList.find((kat) => kat._id === form.kategoriID)
                          ?.namaKategori
                      : "Pilih kategori produk..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-[#0A2947]/10" align="start">
                <Command className="bg-[#FFFAF3]">
                  <CommandInput placeholder="Cari kategori..." className="text-[#0A2947]" />
                  <CommandList>
                    <CommandEmpty className="py-6 text-center text-sm text-[#0A2947]/60 font-medium">Kategori tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {kategoriList.map((kat) => (
                        <CommandItem
                          key={kat._id}
                          // Command cmdk menggunakan value ini untuk filtering
                          value={kat.namaKategori}
                          onSelect={() => {
                            setForm({ ...form, kategoriID: kat._id });
                            setOpenCombobox(false);
                          }}
                          className="cursor-pointer text-[#0A2947] aria-selected:bg-[#0A2947]/5 font-medium"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-[#718355]", // Ceklis warna Sage Green
                              form.kategoriID === kat._id
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
          </div>

          <div className="h-px w-full bg-[#0A2947]/10 my-2" />

          {/* Grid Harga Dasar & Harga Jual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Harga Dasar (Rp) <span className="text-red-500">*</span></label>
              <Input
                type="number"
                className="no-spinner bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
                min={0}
                placeholder="0"
                value={hargaDasarInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setHargaDasarInput(value);
                  setForm({
                    ...form,
                    hargaDasar: value === "" ? 0 : Number(value),
                  });
                }}
                required
              />
              <p className="text-xs font-medium text-[#0A2947]/50">Modal modal belanja/produksi per item.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Harga Jual (Rp) <span className="text-red-500">*</span></label>
              <Input
                type="number"
                className="no-spinner bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
                min={0}
                placeholder="0"
                value={hargaJualInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setHargaJualInput(value);
                  setForm({
                    ...form,
                    hargaJual: value === "" ? 0 : Number(value),
                  });
                }}
                required
              />
              <p className="text-xs font-medium text-[#0A2947]/50">Harga yang ditawarkan ke pelanggan.</p>
            </div>
          </div>

          <div className="h-px w-full bg-[#0A2947]/10 my-2" />

          {/* URL Gambar Produk */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">Link Gambar Produk <span className="text-[#0A2947]/50 font-medium">(Opsional)</span></label>
            <Input
              value={form.gambarProduk || ""}
              onChange={(e) =>
                setForm({ ...form, gambarProduk: e.target.value })
              }
              placeholder="https://example.com/gambar.jpg"
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
            />
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">Keterangan <span className="text-[#0A2947]/50 font-medium">(Opsional)</span></label>
            <Input
              value={form.keterangan || ""}
              onChange={(e) =>
                setForm({ ...form, keterangan: e.target.value })
              }
              placeholder="Tambahkan catatan singkat mengenai produk ini"
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
            />
          </div>

          {/* Pesan Error */}
          {formError && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm font-bold text-red-600 border border-red-500/20">
              {formError}
            </div>
          )}

          {/* Aksi Tombol */}
          <div className="mt-4 flex justify-end gap-3 border-t border-[#0A2947]/10 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/inventaris/produk")}
              disabled={createProdukMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createProdukMutation.isPending}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold px-6"
            >
              {createProdukMutation.isPending ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}