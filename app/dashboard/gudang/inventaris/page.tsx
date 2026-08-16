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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  AlertTriangle,
  Edit2,
  Scale,
  Package,
  Loader2,
  Warehouse,
  Plus,
  PackagePlus,
  Save
} from "lucide-react";

export default function GudangInventoryPage() {
  const queryClient = useQueryClient();

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
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

  // STATE BARU: Modal Tambah Barang ke Gudang
  const [addItemModal, setAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    bahanBakuID: "",
    stok: "",
    stokMinimum: "",
  });

  // --- DEPENDENT QUERIES ---

  // 1. Ambil ID Gudang terlebih dahulu
  const { data: gudangId, isLoading: isLoadingLokasi } = useQuery({
    queryKey: ["lokasi", "gudang-only"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/location", undefined, "pengguna");
        const raw = res.data?.data || res.data || [];
        const locations = Array.isArray(raw) ? raw : [];
        const gudang = locations.find((loc: any) => loc.tipe === "Gudang");
        const finalId = gudang?._id || gudang?.id;
        return finalId ? finalId : null;
      } catch (err) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch Inventory Gudang
  const { data: inventoryData = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: [...queryKeys.inventory(gudangId || "gudang"), debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string> = { locationID: gudangId };
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await apiClient.get<any>("/inventory", params, "pengguna");
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? (raw as Inventory[]) : [];
    },
    enabled: !!gudangId,
  });

  // 3. Fetch Master Bahan Baku (Untuk Dropdown Tambah Barang)
  const { data: masterBahanBaku = [], isLoading: isLoadingMaster } = useQuery({
    queryKey: queryKeys.bahanBaku,
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/bahan-baku", undefined, "pengguna");
        return res.data?.data || res.data || [];
      } catch (err) {
        const res = await apiClient.get<any>("/bahanBaku", undefined, "pengguna");
        return res.data?.data || res.data || [];
      }
    },
    // Query ini hanya aktif jika modal tambah barang dibuka agar hemat bandwidth
    enabled: addItemModal, 
  });

  // --- Derived Data (Client-side filtering) ---
  const filteredInventory = useMemo(() => {
    if (filterTab === "CRITICAL") return inventoryData.filter((inv) => inv.isStokKritis);
    return inventoryData;
  }, [inventoryData, filterTab]);

  // FILTER CERDAS: Hanya tampilkan master data yang BELUM ada di Gudang
  const availableBahanBaku = useMemo(() => {
    return masterBahanBaku.filter((bb: any) => {
      const masterId = bb._id || bb.id;
      // Cek apakah ID Master ini sudah ada di tabel inventory Gudang
      const isExist = inventoryData.some((inv) => inv.item?.id === masterId);
      return !isExist;
    });
  }, [masterBahanBaku, inventoryData]);

  // --- Mutations ---
  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!gudangId) throw new Error("ID Gudang tidak ditemukan.");
      const payload = {
        bahanBakuID: newItem.bahanBakuID,
        locationID: gudangId,
        stok: Number(newItem.stok) || 0,
        stokMinimum: Number(newItem.stokMinimum) || 0,
      };
      return await apiClient.post("/inventory", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Barang Berhasil Ditambahkan", {
        description: "Stok baru telah terdaftar di Gudang Pusat.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory(gudangId || "gudang") });
      setAddItemModal(false);
      setNewItem({ bahanBakuID: "", stok: "", stokMinimum: "" });
    },
    onError: (err: any) => {
      toast.error("Gagal Menambahkan Barang", { description: err.message });
    }
  });

  const updateMinStockMutation = useMutation({
    mutationFn: async (payload: { id: string; stokMinimum: number }) => {
      return await apiClient.patch(
        `/inventory/${payload.id}/minimum-stok`,
        { stokMinimum: payload.stokMinimum },
        undefined,
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Batas minimum stok diperbarui." });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory(gudangId || "gudang") });
      setMinStockModal({ isOpen: false, data: null, inputValue: "" });
    }
  });

  const submitOpnameMutation = useMutation({
    mutationFn: async (payload: { id: string; fisikAktual: number; catatan: string }) => {
      return await apiClient.post(
        `/inventory/${payload.id}/opname`,
        { fisikAktual: payload.fisikAktual, catatan: payload.catatan },
        undefined,
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Opname Berhasil", { description: "Stok fisik telah disesuaikan." });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory(gudangId || "gudang") });
      setOpnameModal({ isOpen: false, data: null, fisikAktual: "", catatan: "" });
    }
  });

  // --- Render Loading Global ---
  if (isLoadingLokasi) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          <span className="text-sm font-medium text-slate-500">
            Memverifikasi Otoritas Gudang...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947] flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-emerald-700" />
            Barang Gudang & Inventaris Pusat
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Pantau dan kelola ketersediaan stok fisik khusus di area Gudang secara real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
            <Input
              placeholder="Cari barang di gudang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-emerald-700 w-full"
            />
          </div>
          <Button
            onClick={() => setAddItemModal(true)}
            className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" /> Masukkan Master Data
          </Button>
        </div>
      </div>

      {/* QUICK TABS */}
      <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-4">
        <Button
          variant="ghost"
          onClick={() => setFilterTab("ALL")}
          className={cn(
            "rounded-full px-6 font-bold transition-all cursor-pointer",
            filterTab === "ALL"
              ? "bg-emerald-700 text-white hover:bg-emerald-800"
              : "text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-emerald-50",
          )}
        >
          Semua Stok Gudang
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFilterTab("CRITICAL")}
          className={cn(
            "rounded-full px-6 font-bold transition-all flex items-center gap-2 cursor-pointer",
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
            <thead className="bg-[#F2EAE1] text-xs uppercase font-bold text-[#0A2947]/70 border-b border-[#0A2947]/10">
              <tr>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Kategori / Tipe</th>
                <th className="px-6 py-4 text-center">Stok Saat Ini</th>
                <th className="px-6 py-4 text-center">Batas Minimum</th>
                <th className="px-6 py-4 text-right">Aksi Penyesuaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {isLoadingInventory ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48 bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20 mx-auto bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20 mx-auto bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-28 ml-auto bg-[#0A2947]/10" /></td>
                  </tr>
                ))
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#0A2947]/50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-[#0A2947]/5 p-4 rounded-full">
                        <Package className="w-10 h-10 text-[#0A2947]/30" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-[#0A2947]">Gudang Masih Kosong</h3>
                        <p className="text-sm font-medium">Klik tombol "Masukkan Master Data" di atas untuk mendaftarkan barang.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FFFAF3] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0A2947]">
                          {inv.item?.nama || "Item Tidak Dikenal"}
                        </span>
                        <span className="text-xs font-medium text-[#0A2947]/50 mt-0.5">
                          ID: {inv.item?.id?.substring(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-[#0A2947]/5 text-[#0A2947]/70 border-none font-bold">
                        Bahan Baku
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "text-base font-mono font-bold px-2 py-0.5 rounded-md",
                          inv.isStokKritis ? "bg-rose-50 text-rose-600" : "bg-[#0A2947]/5 text-[#0A2947]"
                        )}>
                          {inv.stok} <span className="text-xs font-sans font-bold opacity-70">{inv.item?.satuan || ""}</span>
                        </span>
                        {inv.isStokKritis && (
                          <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-700 border-none shadow-sm px-1.5 py-0">
                            Stok Kritis
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
                          className="w-7 h-7 text-[#0A2947]/40 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          onClick={() =>
                            setMinStockModal({ isOpen: true, data: inv, inputValue: inv.stokMinimum })
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
                          setOpnameModal({ isOpen: true, data: inv, fisikAktual: inv.stok, catatan: "" })
                        }
                        className="cursor-pointer border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-bold shadow-sm"
                      >
                        <Scale className="w-4 h-4 mr-2 text-emerald-600" /> Quick Opname
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BARU: TAMBAH MASTER DATA KE GUDANG */}
      <Dialog open={addItemModal} onOpenChange={(open) => !open && setAddItemModal(false)}>
        <DialogContent className="bg-[#FFFAF3] border-[#0A2947]/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A2947] font-bold flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-700" />
              Tarik Master Data ke Gudang
            </DialogTitle>
            <DialogDescription className="text-[#0A2947]/60 font-medium pt-1">
              Pilih Master Bahan Baku yang ingin didaftarkan ke rak fisik Gudang ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Pilih Barang Master <span className="text-rose-500">*</span></label>
              <Select 
                value={newItem.bahanBakuID} 
                onValueChange={(val) => setNewItem((prev) => ({ ...prev, bahanBakuID: val }))}
                disabled={isLoadingMaster}
              >
                <SelectTrigger className="w-full bg-white border-[#0A2947]/20 text-[#0A2947] font-bold focus:ring-emerald-700">
                  <SelectValue placeholder={isLoadingMaster ? "Memuat master data..." : "Pilih bahan baku..."} />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#0A2947]/10">
                  {availableBahanBaku.length === 0 ? (
                    <div className="p-3 text-sm font-medium text-rose-500 text-center">
                      Semua master data sudah ada di gudang.
                    </div>
                  ) : (
                    availableBahanBaku.map((bb: any) => (
                      <SelectItem key={bb._id || bb.id} value={bb._id || bb.id} className="font-bold cursor-pointer hover:bg-emerald-50">
                        {bb.namaBahan} <span className="text-xs text-[#0A2947]/50 font-normal">({bb.satuan})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Stok Awal</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.stok}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, stok: e.target.value }))}
                  className="bg-white border-[#0A2947]/20 font-mono font-bold text-[#0A2947] focus-visible:ring-emerald-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Batas Minimum</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.stokMinimum}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, stokMinimum: e.target.value }))}
                  className="bg-white border-[#0A2947]/20 font-mono font-bold text-[#0A2947] focus-visible:ring-emerald-700"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddItemModal(false)} className="font-bold text-[#0A2947]/60 cursor-pointer">
              Batal
            </Button>
            <Button
              onClick={() => addItemMutation.mutate()}
              disabled={addItemMutation.isPending || !newItem.bahanBakuID}
              className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold cursor-pointer shadow-sm"
            >
              {addItemMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan ke Gudang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT MINIMUM STOK */}
      <Dialog open={minStockModal.isOpen} onOpenChange={(open) => !open && setMinStockModal((prev) => ({ ...prev, isOpen: false }))}>
        <DialogContent className="bg-[#FFFAF3] border-[#0A2947]/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A2947] font-bold">Atur Batas Minimum Stok Gudang</DialogTitle>
            <DialogDescription className="text-[#0A2947]/60 font-medium pt-1">
              Sistem akan memberikan peringatan jika stok {minStockModal.data?.item?.nama} menyentuh batas ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">Stok Minimum ({minStockModal.data?.item?.satuan || "pcs"})</label>
            <Input
              type="number"
              value={minStockModal.inputValue}
              onChange={(e) => setMinStockModal((prev) => ({ ...prev, inputValue: e.target.value ? Number(e.target.value) : "" }))}
              className="bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold focus-visible:ring-emerald-700 no-spinner"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMinStockModal((prev) => ({ ...prev, isOpen: false }))} className="font-bold text-[#0A2947]/60 cursor-pointer">Batal</Button>
            <Button onClick={() => minStockModal.data && updateMinStockMutation.mutate({ id: minStockModal.data.id, stokMinimum: Number(minStockModal.inputValue) })} disabled={updateMinStockMutation.isPending} className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold cursor-pointer">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: QUICK OPNAME */}
      <Dialog open={opnameModal.isOpen} onOpenChange={(open) => !open && setOpnameModal((prev) => ({ ...prev, isOpen: false }))}>
        <DialogContent className="bg-[#FFFAF3] border-[#0A2947]/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A2947] font-bold">Penyesuaian Fisik Gudang</DialogTitle>
            <DialogDescription className="text-[#0A2947]/60 font-medium pt-1">
              Koreksi stok aktual untuk {opnameModal.data?.item?.nama}. Selisih otomatis masuk ke Jurnal Stok.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="bg-[#0A2947]/5 p-3 rounded-lg border border-[#0A2947]/10 flex justify-between items-center">
              <span className="text-sm font-bold text-[#0A2947]/70">Tercatat di Sistem:</span>
              <span className="font-mono font-bold text-[#0A2947] text-lg">{opnameModal.data?.stok} <span className="text-sm font-sans">{opnameModal.data?.item?.satuan}</span></span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Stok Fisik Sebenarnya <span className="text-rose-500">*</span></label>
              <Input
                type="number"
                value={opnameModal.fisikAktual}
                onChange={(e) => setOpnameModal((prev) => ({ ...prev, fisikAktual: e.target.value ? Number(e.target.value) : "" }))}
                className="bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold focus-visible:ring-emerald-700"
                placeholder="Masukkan hitungan riil..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Alasan Penyesuaian <span className="text-rose-500">*</span></label>
              <Input
                value={opnameModal.catatan}
                onChange={(e) => setOpnameModal((prev) => ({ ...prev, catatan: e.target.value }))}
                className="bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-emerald-700 font-medium"
                placeholder="Contoh: Barang tumpah..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpnameModal((prev) => ({ ...prev, isOpen: false }))} className="font-bold text-[#0A2947]/60 cursor-pointer">Batal</Button>
            <Button onClick={() => opnameModal.data && submitOpnameMutation.mutate({ id: opnameModal.data.id, fisikAktual: Number(opnameModal.fisikAktual), catatan: opnameModal.catatan })} disabled={submitOpnameMutation.isPending || opnameModal.fisikAktual === "" || opnameModal.catatan.trim() === ""} className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold cursor-pointer">
              Eksekusi Koreksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}