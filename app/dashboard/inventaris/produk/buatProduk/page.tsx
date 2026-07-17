"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { decodeJWT } from "@/lib/decodeToken";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Check, 
  ChevronsUpDown, 
  PackagePlus, 
  Plus, 
  Trash2, 
  ChefHat, 
  Info 
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
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

// --- TIPE DATA LOKAL ---
const SATUAN_OPTIONS = ["gram", "ml", "pcs", "kg", "liter"];

interface ResepItem {
  bahanBakuID: string;
  jumlah: number;
  satuan: string;
}

interface ProdukRequestPayload {
  namaProduk: string;
  hargaDasar: number;
  hargaJual: number;
  kategoriID: string;
  keterangan?: string;
  gambarProduk?: string;
  stok?: number;
  resep?: ResepItem[];
}

export default function BuatProdukPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProdukRequestPayload>({
    namaProduk: "",
    hargaDasar: 0,
    hargaJual: 0,
    kategoriID: "",
    keterangan: "",
    gambarProduk: "",
    stok: 0,
    resep: [],
  });
  
  const [hargaDasarInput, setHargaDasarInput] = useState("");
  const [hargaJualInput, setHargaJualInput] = useState("");
  const [stokInput, setStokInput] = useState("");
  const [formError, setFormError] = useState("");
  
  const [openCombobox, setOpenCombobox] = useState(false);

  // --- FETCH KATEGORI ---
  const { data: kategoriList = [], error: kategoriError } = useQuery({
    queryKey: queryKeys.kategori,
    queryFn: async () => {
      const res = await apiClient.get<any>("/kategori", undefined, "pengguna");
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? raw : [];
    },
  });

  // --- FETCH BAHAN BAKU ---
  const { data: bahanBakuList = [] } = useQuery({
    queryKey: ["bahan-baku"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/bahan-baku", undefined, "pengguna");
        const raw = res.data?.data || res.data || [];
        return Array.isArray(raw) ? raw : [];
      } catch (error) {
        // Fallback endpoint camelCase
        const res = await apiClient.get<any>("/bahanBaku", undefined, "pengguna");
        const raw = res.data?.data || res.data || [];
        return Array.isArray(raw) ? raw : [];
      }
    },
  });

  // ERROR TOAST KATEGORI
  useEffect(() => {
    if (kategoriError) {
      toast.error("Gagal Memuat Kategori", {
        description: kategoriError instanceof Error ? kategoriError.message : "Gagal memuat daftar kategori.",
      });
    }
  }, [kategoriError]);

  // --- HANDLER RESEP DINAMIS ---
  const addResepRow = () => {
    setForm((prev) => ({
      ...prev,
      resep: [...(prev.resep || []), { bahanBakuID: "", jumlah: 0, satuan: "gram" }],
    }));
  };

  const removeResepRow = (index: number) => {
    setForm((prev) => {
      const newResep = [...(prev.resep || [])];
      newResep.splice(index, 1);
      return { ...prev, resep: newResep };
    });
  };

  const updateResepRow = (index: number, field: keyof ResepItem, value: any) => {
    setForm((prev) => {
      const newResep = [...(prev.resep || [])];
      newResep[index] = { ...newResep[index], [field]: value };
      
      // Auto-fill satuan jika bahan baku dipilih (optional feature, if bahanBaku has default satuan)
      if (field === "bahanBakuID") {
        const selectedBahan = bahanBakuList.find((b: any) => b._id === value);
        if (selectedBahan && selectedBahan.satuan) {
          newResep[index].satuan = selectedBahan.satuan;
        }
      }

      return { ...prev, resep: newResep };
    });
  };

  // --- MUTATION CREATE PRODUK ---
  const createProdukMutation = useMutation({
    mutationFn: async (payload: ProdukRequestPayload) => {
      return await apiClient.post("/produk", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Produk baru berhasil ditambahkan." });
      queryClient.invalidateQueries({ queryKey: queryKeys.produk });
      router.push("/dashboard/inventaris/produk");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal menambahkan produk baru.");
    },
  });

  // --- HANDLER SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.kategoriID) {
      setFormError("Silakan pilih kategori produk terlebih dahulu.");
      return;
    }

    // Validasi Resep jika ada
    if (form.resep && form.resep.length > 0) {
      for (let i = 0; i < form.resep.length; i++) {
        const r = form.resep[i];
        if (!r.bahanBakuID) return setFormError(`Bahan baku pada baris ke-${i + 1} belum dipilih.`);
        if (r.jumlah <= 0) return setFormError(`Jumlah bahan pada baris ke-${i + 1} harus lebih dari 0.`);
      }
    }

    // Clean up payload
    const payload = { ...form };
    if (!payload.resep || payload.resep.length === 0) {
      delete payload.resep; // Hapus properti resep jika kosong
    } else {
      payload.stok = 0; // Backend akan override lewat `calculatePotentialStock`
    }

    await createProdukMutation.mutateAsync(payload);
  };

  const hasResep = form.resep && form.resep.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
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
            Masukkan informasi detail, harga, dan resep bahan baku (jika ada) untuk produk baru.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* GRID UTAMA: Info Produk & Harga */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* KOLOM KIRI: Info Dasar */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <PackagePlus className="h-5 w-5 text-[#D4A373]" />
              <h3 className="text-base font-bold text-[#0A2947]">Informasi Utama</h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Nama Produk <span className="text-red-500">*</span></label>
              <Input
                value={form.namaProduk}
                onChange={(e) => setForm({ ...form, namaProduk: e.target.value })}
                placeholder="Contoh: Kopi Susu Gula Aren"
                required
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              />
            </div>

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
                        ? kategoriList.find((kat: any) => kat._id === form.kategoriID)?.namaKategori
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
                        {kategoriList.map((kat: any) => (
                          <CommandItem
                            key={kat._id}
                            value={kat.namaKategori}
                            onSelect={() => {
                              setForm({ ...form, kategoriID: kat._id });
                              setOpenCombobox(false);
                            }}
                            className="cursor-pointer text-[#0A2947] aria-selected:bg-[#0A2947]/5 font-medium"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-[#718355]",
                                form.kategoriID === kat._id ? "opacity-100" : "opacity-0"
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

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Link Gambar Produk <span className="text-[#0A2947]/50 font-medium">(Opsional)</span></label>
              <Input
                value={form.gambarProduk || ""}
                onChange={(e) => setForm({ ...form, gambarProduk: e.target.value })}
                placeholder="https://example.com/gambar.jpg"
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Keterangan <span className="text-[#0A2947]/50 font-medium">(Opsional)</span></label>
              <Input
                value={form.keterangan || ""}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Catatan singkat mengenai produk ini..."
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              />
            </div>
          </div>

          {/* KOLOM KANAN: Harga & Stok */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
                <span className="h-5 w-5 rounded-full bg-[#D4A373] text-white flex items-center justify-center font-bold text-xs">$</span>
                <h3 className="text-base font-bold text-[#0A2947]">Manajemen Harga</h3>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Harga Dasar (Rp) <span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  className="no-spinner bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold"
                  min={0}
                  placeholder="0"
                  value={hargaDasarInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHargaDasarInput(value);
                    setForm({ ...form, hargaDasar: value === "" ? 0 : Number(value) });
                  }}
                  required
                />
                <p className="text-xs font-medium text-[#0A2947]/50">Modal produksi per item.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Harga Jual (Rp) <span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  className="no-spinner bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold"
                  min={0}
                  placeholder="0"
                  value={hargaJualInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHargaJualInput(value);
                    setForm({ ...form, hargaJual: value === "" ? 0 : Number(value) });
                  }}
                  required
                />
                <p className="text-xs font-medium text-[#0A2947]/50">Harga yang ditawarkan ke pelanggan.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
                <PackagePlus className="h-5 w-5 text-[#D4A373]" />
                <h3 className="text-base font-bold text-[#0A2947]">Stok Awal</h3>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  className="no-spinner bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  min={0}
                  placeholder="0"
                  value={hasResep ? "" : stokInput}
                  disabled={hasResep}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStokInput(value);
                    setForm({ ...form, stok: value === "" ? 0 : Number(value) });
                  }}
                />
                <div className="flex items-start gap-2 mt-2">
                  <Info className="w-4 h-4 text-[#0A2947]/50 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-[#0A2947]/60 leading-relaxed">
                    {hasResep 
                      ? "Input stok dinonaktifkan karena Anda menggunakan Resep. Stok akan dihitung secara otomatis oleh sistem berdasarkan persediaan bahan baku." 
                      : "Masukkan stok awal (opsional). Anda dapat membiarkannya 0 dan melakukan Stok Opname nanti."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: RESEP BAHAN BAKU */}
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#0A2947]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F2EAE1]">
            <div>
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-[#D4A373]" />
                <h3 className="text-base font-bold text-[#0A2947]">Resep & Komposisi (BOM)</h3>
              </div>
              <p className="text-xs font-medium text-[#0A2947]/60 mt-1">
                Tambahkan bahan baku jika produk ini diproduksi/diracik (Bill of Materials).
              </p>
            </div>
            <Button
              type="button"
              onClick={addResepRow}
              className="cursor-pointer bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold shadow-sm h-9"
            >
              <Plus className="w-4 h-4 mr-2" /> Tambah Bahan
            </Button>
          </div>

          <div className="p-6">
            {!form.resep || form.resep.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-[#0A2947]/10 rounded-xl bg-white/50">
                <ChefHat className="w-8 h-8 text-[#0A2947]/20 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#0A2947]/50">Tidak ada resep yang ditambahkan.</p>
                <p className="text-xs font-medium text-[#0A2947]/40 mt-1">Produk ini akan dianggap sebagai barang jadi.</p>
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

                {form.resep.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start sm:items-center p-4 sm:p-2 border sm:border-none border-[#0A2947]/10 rounded-xl sm:rounded-none bg-white sm:bg-transparent shadow-sm sm:shadow-none">
                    
                    {/* Pilih Bahan Baku */}
                    <div className="col-span-1 sm:col-span-5">
                      <label className="text-xs font-bold text-[#0A2947] mb-1.5 block sm:hidden">Bahan Baku</label>
                      <Select
                        value={item.bahanBakuID}
                        onValueChange={(val) => updateResepRow(index, "bahanBakuID", val)}
                      >
                        <SelectTrigger className="w-full bg-white border-[#0A2947]/20 text-[#0A2947] font-bold h-10">
                          <SelectValue placeholder="Pilih bahan..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                          {bahanBakuList.length === 0 ? (
                            <div className="p-2 text-sm text-center font-medium text-[#0A2947]/50">Data kosong...</div>
                          ) : (
                            bahanBakuList.map((bb: any) => (
                              <SelectItem key={bb._id} value={bb._id} className="cursor-pointer hover:bg-[#0A2947]/5 font-bold">
                                {bb.namaBahan} <span className="font-medium text-xs text-[#0A2947]/50 ml-1">({bb.satuan})</span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Jumlah */}
                    <div className="col-span-1 sm:col-span-3 flex gap-2">
                      <div className="w-full">
                        <label className="text-xs font-bold text-[#0A2947] mb-1.5 block sm:hidden">Jumlah</label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={item.jumlah === 0 ? "" : item.jumlah}
                          onChange={(e) => updateResepRow(index, "jumlah", Number(e.target.value))}
                          placeholder="0"
                          className="w-full text-center bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold h-10"
                        />
                      </div>
                    </div>

                    {/* Satuan */}
                    <div className="col-span-1 sm:col-span-3">
                      <label className="text-xs font-bold text-[#0A2947] mb-1.5 block sm:hidden">Satuan</label>
                      <Select
                        value={item.satuan}
                        onValueChange={(val) => updateResepRow(index, "satuan", val)}
                      >
                        <SelectTrigger className="w-full bg-white border-[#0A2947]/20 text-[#0A2947] font-bold h-10">
                          <SelectValue placeholder="Satuan" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                          {SATUAN_OPTIONS.map((sat) => (
                            <SelectItem key={sat} value={sat} className="cursor-pointer hover:bg-[#0A2947]/5 font-bold">
                              {sat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Aksi Hapus */}
                    <div className="col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeResepRow(index)}
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

        {/* Pesan Error Global */}
        {formError && (
          <div className="rounded-xl bg-red-500/10 p-4 text-sm font-bold text-red-600 border border-red-500/20 shadow-sm text-center">
            {formError}
          </div>
        )}

        {/* Aksi Tombol */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#0A2947]/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/inventaris/produk")}
            disabled={createProdukMutation.isPending}
            className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-12 w-full sm:w-auto px-8"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={createProdukMutation.isPending}
            className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold h-12 w-full sm:w-auto px-8"
          >
            {createProdukMutation.isPending ? "Menyimpan Data..." : "Simpan Produk Baru"}
          </Button>
        </div>
      </form>
    </div>
  );
}