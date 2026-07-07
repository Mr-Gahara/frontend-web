"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  ProdukRequest,
  ProdukResponse,
  GetKategoriResponse,
} from "@/types/produk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, ChevronsUpDown, Loader2 } from "lucide-react";
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

export default function EditProdukPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const produkId = params.id as string;

  const [form, setForm] = useState<ProdukRequest>(emptyForm);
  const [hargaDasarInput, setHargaDasarInput] = useState("");
  const [hargaJualInput, setHargaJualInput] = useState("");
  const [formError, setFormError] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);

  // QUERY 1: KATEGORI
  const {
    data: kategoriList = [],
    isLoading: isLoadingKategori, // <-- 1. Ambil status loading
    error: kategoriError,
  } = useQuery({
    queryKey: queryKeys.kategori,
    queryFn: async () => {
      const res = await apiClient.get<GetKategoriResponse>(
        "/kategori",
        undefined,
        "pengguna",
      );
      return res.data;
    },
  });

  // QUERY 2: DETAIL PRODUK
  const {
    data: produkDetail,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail, // <-- Tambahkan pendeteksi aktivitas jaringan asli
    error: detailError,
  } = useQuery({
    queryKey: queryKeys.produkDetail(produkId),
    enabled: !!produkId,
    queryFn: async () => {
      const res = await apiClient.get<ProdukResponse>(
        `/produk/${produkId}`,
        undefined,
        "pengguna",
      );
      return res.data;
    },
  });

  // 2. STATE PELINDUNG INFINITE LOOP
  const [isInitialized, setIsInitialized] = useState(false);

  // EFFECT: MENGISI FORM SAAT DATA PRODUK TIBA
  useEffect(() => {
    // 3. Pastikan detail produk ada, kategori selesai loading, dan form belum pernah diinisialisasi
    if (produkDetail && !isLoadingKategori && !isInitialized) {
      let catId =
        typeof produkDetail.kategoriID === "object" &&
        produkDetail.kategoriID !== null
          ? (produkDetail.kategoriID as any)._id
          : String(produkDetail.kategoriID || "");

      if (!catId && produkDetail.kategori && kategoriList.length > 0) {
        const matchedCategory = kategoriList.find(
          (k) =>
            k.namaKategori.toLowerCase() ===
            produkDetail.kategori?.toLowerCase(),
        );
        if (matchedCategory) {
          catId = matchedCategory._id;
        }
      }

      setForm({
        namaProduk: produkDetail.namaProduk || "",
        hargaDasar: produkDetail.hargaDasar || 0,
        hargaJual: produkDetail.hargaJual || 0,
        kategoriID: catId,
        keterangan: produkDetail.keterangan || "",
        gambarProduk: produkDetail.gambarProduk || "",
      });

      setHargaDasarInput(String(produkDetail.hargaDasar || 0));
      setHargaJualInput(String(produkDetail.hargaJual || 0));

      // Kunci gemboknya agar useEffect ini tidak pernah mengeksekusi setForm lagi
      setIsInitialized(true);
    }
  }, [produkDetail, kategoriList, isLoadingKategori, isInitialized]);

  // ERROR TOASTS
  useEffect(() => {
    if (kategoriError) {
      toast.error("Gagal Memuat Kategori", {
        description:
          kategoriError instanceof Error
            ? kategoriError.message
            : "Terjadi kesalahan.",
      });
    }
    if (detailError) {
      toast.error("Gagal Memuat Produk", {
        description:
          detailError instanceof Error
            ? detailError.message
            : "Produk tidak ditemukan.",
      });
    }
  }, [kategoriError, detailError]);

  // MUTATION UPDATE PRODUK
  const updateProdukMutation = useMutation({
    mutationFn: async (payload: ProdukRequest) => {
      return await apiClient.put(
        `/produk/${produkId}`,
        payload,
        undefined,
        "pengguna",
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

      router.push("/dashboard/produk");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal memperbarui produk.");
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

    await updateProdukMutation.mutateAsync(form);
  };

  // Hanya tampilkan loading jika data belum ada (isLoading) DAN sistem benar-benar sedang mencari (isFetching)
  // Ini mencegah UI terjebak jika query tiba-tiba 'disabled' karena bug Next.js back-navigation
  const isMencariData = isLoadingDetail && isFetchingDetail;

  if (isMencariData || !produkId) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {!produkId ? "Menyesuaikan rute..." : "Memuat detail produk..."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
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
          <h1 className="text-2xl font-bold tracking-tight">Edit Produk</h1>
          <p className="text-sm text-muted-foreground">
            Perbarui informasi produk{" "}
            {produkDetail?.namaProduk ? `"${produkDetail.namaProduk}"` : "Anda"}
            .
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Produk</label>
            <Input
              value={form.namaProduk}
              onChange={(e) => setForm({ ...form, namaProduk: e.target.value })}
              placeholder="Contoh: Kopi Susu Gula Aren"
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
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
                        ?.namaKategori || "Kategori tidak ditemukan"
                    : "Pilih kategori produk..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Cari kategori..." />
                  <CommandList>
                    <CommandEmpty>Kategori tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {kategoriList.map((kat) => (
                        <CommandItem
                          key={kat._id}
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
                                : "opacity-0",
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Dasar (Rp)</label>
              <Input
                type="number"
                className="no-spinner"
                min={0}
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

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Link Gambar Produk (Opsional)
            </label>
            <Input
              value={form.gambarProduk || ""}
              onChange={(e) =>
                setForm({ ...form, gambarProduk: e.target.value })
              }
              placeholder="Masukkan URL gambar produk"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Keterangan (Opsional)</label>
            <Input
              value={form.keterangan || ""}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Tambahkan catatan singkat mengenai produk ini"
            />
          </div>

          {formError && (
            <p className="text-sm font-medium text-destructive">{formError}</p>
          )}

          <div className="mt-2 flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/produk")}
              disabled={updateProdukMutation.isPending}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={updateProdukMutation.isPending || isLoadingDetail}
              className="cursor-pointer"
            >
              {updateProdukMutation.isPending
                ? "Menyimpan Perubahan..."
                : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
