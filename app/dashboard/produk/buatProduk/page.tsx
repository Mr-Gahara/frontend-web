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
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
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
      router.push("/dashboard/produk");
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
          className="w-fit cursor-pointer px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => router.push("/dashboard/produk")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Produk
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Tambah Produk</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan informasi detail untuk membuat produk baru di sistem Anda.
          </p>
        </div>
      </div>

      {/* Form Utama */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nama Produk */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Produk</label>
            <Input
              value={form.namaProduk}
              onChange={(e) =>
                setForm({ ...form, namaProduk: e.target.value })
              }
              placeholder="Contoh: Kopi Susu Gula Aren"
              required
            />
          </div>

          {/* Kategori (Combobox / Searchable Dropdown) */}
          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">Kategori</label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between font-normal cursor-pointer"
                >
                  {form.kategoriID
                    ? kategoriList.find((kat) => kat._id === form.kategoriID)
                        ?.namaKategori
                    : "Pilih kategori produk..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kategori..." />
                  <CommandList>
                    <CommandEmpty>Kategori tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {kategoriList.map((kat) => (
                        <CommandItem
                          key={kat._id}
                          // Command cmdk menggunakan value ini untuk filtering (harus unik dan mewakili text)
                          value={kat.namaKategori}
                          onSelect={() => {
                            setForm({ ...form, kategoriID: kat._id });
                            setOpenCombobox(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
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

          {/* Grid Harga Dasar & Harga Jual */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Dasar (Rp)</label>
              <Input
                type="number"
                className="no-spinner"
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Jual (Rp)</label>
              <Input
                type="number"
                className="no-spinner"
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
            </div>
          </div>

          {/* URL Gambar Produk */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Link Gambar Produk (Opsional)</label>
            <Input
              value={form.gambarProduk || ""}
              onChange={(e) =>
                setForm({ ...form, gambarProduk: e.target.value })
              }
              placeholder="https://example.com/gambar.jpg"
            />
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Keterangan (Opsional)</label>
            <Input
              value={form.keterangan || ""}
              onChange={(e) =>
                setForm({ ...form, keterangan: e.target.value })
              }
              placeholder="Tambahkan catatan singkat mengenai produk ini"
            />
          </div>

          {/* Pesan Error */}
          {formError && (
            <p className="text-sm font-medium text-destructive">{formError}</p>
          )}

          {/* Aksi Tombol */}
          <div className="mt-2 flex justify-between gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/produk")}
              disabled={createProdukMutation.isPending}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createProdukMutation.isPending}
              className="cursor-pointer"
            >
              {createProdukMutation.isPending ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}