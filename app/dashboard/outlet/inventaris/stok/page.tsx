"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Inventory } from "@/types/inventory";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  AlertTriangle,
  Edit2,
  Scale,
  Package,
  Loader2,
} from "lucide-react";

export default function StokInventoryPage() {
  const queryClient = useQueryClient();

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [filterTab, setFilterTab] = useState<"ALL" | "CRITICAL">("ALL");

  // --- Modal States ---
  const [minStockModal, setMinStockModal] = useState<{
    isOpen: boolean;
    data: Inventory | null;
    inputValue: number | "";
  }>({ isOpen: false, data: null, inputValue: "" });

  const [opnameModal, setOpnameModal] = useState<{
    isOpen: boolean;
    data: Inventory | null;
    fisikAktual: number | "";
    catatan: string;
  }>({ isOpen: false, data: null, fisikAktual: "", catatan: "" });

  // --- Queries ---
  // Fetch Lokasi (Khusus Outlet)
  const { data: lokasiList = [], isLoading: isLoadingLokasi } = useQuery({
    queryKey: ["lokasi", "outlet-only"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(
          "/location",
          undefined,
          "pengguna",
        );
        const raw = res.data?.data || res.data || [];
        const allLocations = Array.isArray(raw) ? raw : [];
        return allLocations.filter((loc: any) => loc.tipe === "Outlet");
      } catch (err) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Inventory List
  const { data: inventoryData = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: [...queryKeys.inventory(), debouncedSearch, selectedLocation],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedLocation && selectedLocation !== "all") {
        params.locationID = selectedLocation;
      }

      const res = await apiClient.get<any>("/inventory", params, "pengguna");
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? (raw as Inventory[]) : [];
    },
  });

  // --- SAFE GUARDS (Anti-Ghost Cache) ---
  // Memastikan bahwa data yang dilempar oleh React Query Cache benar-benar sebuah Array
  const safeLokasiList = Array.isArray(lokasiList) ? lokasiList : [];
  
  const filteredInventory = useMemo(() => {
    // Tembok Pertahanan: Pastikan inventoryData selalu Array sebelum di-filter
    let result = Array.isArray(inventoryData) ? inventoryData : [];
    
    // 1. Pastikan hanya data Outlet yang boleh masuk ke tabel ini
    result = result.filter((inv) => inv.lokasi?.tipe === "Outlet");

    // 2. Filter Tab Kritis
    if (filterTab === "CRITICAL") {
      result = result.filter((inv) => inv.isStokKritis);
    }

    return result;
  }, [inventoryData, filterTab]);

  // --- Mutations ---
  const updateMinStockMutation = useMutation({
    mutationFn: async (payload: { id: string; stokMinimum: number }) => {
      return await apiClient.patch(
        `/inventory/${payload.id}/minimum-stok`,
        { stokMinimum: payload.stokMinimum },
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Batas minimum stok diperbarui.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory() });
      setMinStockModal({ isOpen: false, data: null, inputValue: "" });
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal mengupdate stok minimum.",
      });
    },
  });

  const submitOpnameMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      fisikAktual: number;
      catatan: string;
    }) => {
      return await apiClient.post(
        `/inventory/${payload.id}/opname`,
        { fisikAktual: payload.fisikAktual, catatan: payload.catatan },
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Opname Berhasil", {
        description: "Stok fisik telah disesuaikan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory() });
      setOpnameModal({
        isOpen: false,
        data: null,
        fisikAktual: "",
        catatan: "",
      });
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menyesuaikan stok fisik.",
      });
    },
  });

  // --- Handlers ---
  const handleUpdateMinStock = () => {
    if (!minStockModal.data || minStockModal.inputValue === "") return;
    updateMinStockMutation.mutate({
      id: minStockModal.data.id,
      stokMinimum: Number(minStockModal.inputValue),
    });
  };

  const handleSubmitOpname = () => {
    if (!opnameModal.data || opnameModal.fisikAktual === "") return;
    submitOpnameMutation.mutate({
      id: opnameModal.data.id,
      fisikAktual: Number(opnameModal.fisikAktual),
      catatan: opnameModal.catatan,
    });
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Stok & Inventory
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Pantau dan kelola ketersediaan stok fisik secara real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#0A2947]/40" />
            <Input
              placeholder="Cari nama barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947]"
            />
          </div>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full sm:w-48 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-semibold focus:ring-[#0A2947]">
              <MapPin className="w-4 h-4 mr-2 text-[#D4A373]" />
              <SelectValue placeholder="Pilih Lokasi" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
              <SelectItem value="all" className="font-bold cursor-pointer">
                Semua Lokasi
              </SelectItem>
              {safeLokasiList.map((lok: any) => {
                const locationId = lok._id || lok.id;
                return (
                  <SelectItem
                    key={locationId}
                    value={locationId}
                    className="cursor-pointer font-medium"
                  >
                    {lok.nama}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* QUICK TABS */}
      <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-4">
        <Button
          variant="ghost"
          onClick={() => setFilterTab("ALL")}
          className={cn(
            "rounded-full px-6 font-bold transition-all",
            filterTab === "ALL"
              ? "bg-[#0A2947] text-white hover:bg-[#0A2947]/90"
              : "text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-[#0A2947]/5",
          )}
        >
          Semua Stok
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFilterTab("CRITICAL")}
          className={cn(
            "rounded-full px-6 font-bold transition-all flex items-center gap-2",
            filterTab === "CRITICAL"
              ? "bg-rose-500 text-white hover:bg-rose-600"
              : "text-rose-500/70 hover:text-rose-600 hover:bg-rose-50",
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Stok Kritis
        </Button>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F2EAE1] text-xs uppercase font-bold text-[#0A2947]/70">
              <tr>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Lokasi</th>
                <th className="px-6 py-4 text-center">Stok Saat Ini</th>
                <th className="px-6 py-4 text-center">Batas Minimum</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {isLoadingInventory ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-48 bg-[#0A2947]/10" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-32 bg-[#0A2947]/10" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-20 mx-auto bg-[#0A2947]/10" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-20 mx-auto bg-[#0A2947]/10" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-8 w-28 ml-auto bg-[#0A2947]/10" />
                    </td>
                  </tr>
                ))
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[#0A2947]/50 font-medium"
                  >
                    <Package className="w-12 h-12 mx-auto mb-3 text-[#0A2947]/20" />
                    Tidak ada data stok yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#FFFAF3] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0A2947]">
                          {inv.item?.nama || "Item Tidak Dikenal"}
                        </span>
                        <span className="text-xs font-medium text-[#0A2947]/50">
                          {inv.item?.tipeItem === "BAHAN_BAKU"
                            ? "Bahan Baku"
                            : "Barang Inventory"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#0A2947]/80">
                      {inv.lokasi?.nama || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            "text-base font-mono font-bold",
                            inv.isStokKritis
                              ? "text-rose-600"
                              : "text-[#0A2947]",
                          )}
                        >
                          {inv.stok}{" "}
                          <span className="text-xs font-sans">
                            {inv.item?.satuan || "pcs"}
                          </span>
                        </span>
                        {inv.isStokKritis && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-rose-50 text-rose-600 border-rose-200"
                          >
                            Kritis
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center group">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono font-bold text-[#0A2947]/70">
                          {inv.stokMinimum}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-[#0A2947]/40 hover:text-[#D4A373] hover:bg-[#D4A373]/10 cursor-pointer"
                          onClick={() =>
                            setMinStockModal({
                              isOpen: true,
                              data: inv,
                              inputValue: inv.stokMinimum,
                            })
                          }
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setOpnameModal({
                            isOpen: true,
                            data: inv,
                            fisikAktual: inv.stok,
                            catatan: "",
                          })
                        }
                        className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm"
                      >
                        <Scale className="w-4 h-4 mr-2 text-[#D4A373]" />
                        Sesuaikan Stok
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT MINIMUM STOK */}
      <Dialog
        open={minStockModal.isOpen}
        onOpenChange={(open) =>
          !open && setMinStockModal((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <DialogContent className="bg-[#FFFAF3] border-[#0A2947]/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A2947] font-bold">
              Atur Batas Minimum Stok
            </DialogTitle>
            <DialogDescription className="text-[#0A2947]/60 font-medium">
              Sistem akan memberikan peringatan jika stok{" "}
              {minStockModal.data?.item?.nama} menyentuh atau berada di bawah
              batas ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Stok Minimum ({minStockModal.data?.item?.satuan || "pcs"})
            </label>
            <Input
              type="number"
              value={minStockModal.inputValue}
              onChange={(e) =>
                setMinStockModal((prev) => ({
                  ...prev,
                  inputValue: e.target.value ? Number(e.target.value) : "",
                }))
              }
              className="bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold focus-visible:ring-[#0A2947] no-spinner"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setMinStockModal((prev) => ({ ...prev, isOpen: false }))
              }
              className="font-bold text-[#0A2947]/60"
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateMinStock}
              disabled={updateMinStockMutation.isPending}
              className="bg-[#0A2947] text-white hover:bg-[#0A2947]/90 font-bold"
            >
              {updateMinStockMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: QUICK OPNAME */}
      <Dialog
        open={opnameModal.isOpen}
        onOpenChange={(open) =>
          !open && setOpnameModal((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <DialogContent className="bg-[#FFFAF3] border-[#0A2947]/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A2947] font-bold">
              Penyesuaian Fisik (Quick Opname)
            </DialogTitle>
            <DialogDescription className="text-[#0A2947]/60 font-medium">
              Koreksi stok aktual untuk {opnameModal.data?.item?.nama}. Selisih
              akan otomatis dicatat pada Jurnal Stok.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="bg-[#0A2947]/5 p-3 rounded-lg border border-[#0A2947]/10 flex justify-between items-center">
              <span className="text-sm font-bold text-[#0A2947]/70">
                Stok Tercatat di Sistem:
              </span>
              <span className="font-mono font-bold text-[#0A2947] text-lg">
                {opnameModal.data?.stok}{" "}
                <span className="text-sm font-sans">
                  {opnameModal.data?.item?.satuan}
                </span>
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Stok Fisik Sebenarnya <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                value={opnameModal.fisikAktual}
                onChange={(e) =>
                  setOpnameModal((prev) => ({
                    ...prev,
                    fisikAktual: e.target.value ? Number(e.target.value) : "",
                  }))
                }
                className="bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold focus-visible:ring-[#0A2947] no-spinner"
                placeholder="Masukkan hitungan fisik riil..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Alasan / Catatan Penyesuaian{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Input
                value={opnameModal.catatan}
                onChange={(e) =>
                  setOpnameModal((prev) => ({
                    ...prev,
                    catatan: e.target.value,
                  }))
                }
                className="bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947]"
                placeholder="Contoh: Barang tumpah, kemasan rusak..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setOpnameModal((prev) => ({ ...prev, isOpen: false }))
              }
              className="font-bold text-[#0A2947]/60"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitOpname}
              disabled={
                submitOpnameMutation.isPending ||
                opnameModal.fisikAktual === "" ||
                opnameModal.catatan.trim() === ""
              }
              className="bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold"
            >
              {submitOpnameMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eksekusi Koreksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
