"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@/hooks/use-debounce";
import { pesanError } from "@/lib/api/error";
import {
  useDaftarInventory,
  useLokasiBertipe,
  useOpnameInventory,
  useTambahInventory,
  useUbahStokMinimum,
} from "@/features/inventaris/hooks";
import { useDaftarBahanBaku } from "@/features/bahan-baku/hooks";
import MenuAksiStok from "@/features/inventaris/menu-aksi-stok";
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
import { DataTable } from "@/components/ui/data-table";
import {
  Search,
  AlertTriangle,
  Loader2,
  Warehouse,
  Plus,
  PackagePlus,
  Save
} from "lucide-react";

/** Pilihan baris per halaman (DataTable opt-in, keputusan TB11a). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

export default function GudangInventoryPage() {

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
  const { lokasiId: gudangId, isLoading: isLoadingLokasi } = useLokasiBertipe("Gudang");

  // 2. Fetch Inventory Gudang
  const {
    data: inventoryData = [],
    isLoading: isLoadingInventory,
    isError: gagalMemuatStok,
  } = useDaftarInventory(
    gudangId ? { locationID: gudangId, search: debouncedSearch || undefined } : null,
  );

  // 3. Fetch Master Bahan Baku (Untuk Dropdown Tambah Barang)
  const { data: masterBahanBaku = [], isLoading: isLoadingMaster } = useDaftarBahanBaku();

  // --- Derived Data (Client-side filtering) ---
  const filteredInventory = useMemo(() => {
    if (filterTab === "CRITICAL") return inventoryData.filter((inv) => inv.isStokKritis);
    return inventoryData;
  }, [inventoryData, filterTab]);

  // FILTER CERDAS: Hanya tampilkan master data yang BELUM ada di Gudang
  const availableBahanBaku = useMemo(() => {
    return masterBahanBaku.filter((bb) => {
      const masterId = bb.id;
      // Cek apakah ID Master ini sudah ada di tabel inventory Gudang
      const isExist = inventoryData.some((inv) => inv.item?.id === masterId);
      return !isExist;
    });
  }, [masterBahanBaku, inventoryData]);

  // --- Mutations ---
  const addItemMutation = useTambahInventory({
    onSuccess: () => {
      toast.success("Barang Berhasil Ditambahkan", {
        description: "Stok baru telah terdaftar di Gudang Pusat.",
      });
      setAddItemModal(false);
      setNewItem({ bahanBakuID: "", stok: "", stokMinimum: "" });
    },
    onError: (err) => {
      toast.error("Gagal Menambahkan Barang", {
        description: pesanError(err, "Gagal menambahkan barang ke gudang."),
      });
    },
  });

  const tambahBarang = () => {
    if (!gudangId) {
      toast.error("Gagal Menambahkan Barang", {
        description: "ID Gudang tidak ditemukan.",
      });
      return;
    }
    addItemMutation.mutate({
      bahanBakuID: newItem.bahanBakuID,
      locationID: gudangId,
      stok: Number(newItem.stok) || 0,
      stokMinimum: Number(newItem.stokMinimum) || 0,
    });
  };

  const updateMinStockMutation = useUbahStokMinimum({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Batas minimum stok diperbarui." });
      setMinStockModal({ isOpen: false, data: null, inputValue: "" });
    },
    onError: (err) => {
      toast.error("Gagal", {
        description: pesanError(err, "Gagal mengupdate stok minimum."),
      });
    },
  });

  const submitOpnameMutation = useOpnameInventory({
    onSuccess: () => {
      toast.success("Opname Berhasil", { description: "Stok fisik telah disesuaikan." });
      setOpnameModal({ isOpen: false, data: null, fisikAktual: "", catatan: "" });
    },
    onError: (err) => {
      toast.error("Gagal", {
        description: pesanError(err, "Gagal menyesuaikan stok fisik."),
      });
    },
  });

  // Aksi baris di menu titik tiga (TB7a, TB16a). Kolom tipe yang selalu
  // "Bahan Baku" dan potongan ID barang dibuang (TB17a).
  const kolom = useMemo<ColumnDef<Inventory>[]>(
    () => [
      {
        id: "nama",
        header: "Nama Barang",
        cell: ({ row }) => (
          <span className="font-bold text-navy">{row.original.item?.nama || "Item Tidak Dikenal"}</span>
        ),
      },
      {
        id: "stok",
        header: "Stok Saat Ini",
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <span
              className={cn(
                "text-base font-mono font-bold px-2 py-0.5 rounded-md",
                row.original.isStokKritis ? "bg-rose-50 text-rose-600" : "bg-navy/5 text-navy",
              )}
            >
              {row.original.stok}{" "}
              <span className="text-xs font-sans font-bold opacity-70">{row.original.item?.satuan || ""}</span>
            </span>
            {row.original.isStokKritis && (
              <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-700 border-none shadow-sm px-1.5 py-0">
                Stok Kritis
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "minimum",
        header: "Batas Minimum",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-navy/70">{row.original.stokMinimum}</span>
        ),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <MenuAksiStok
            onUbahMinimum={() =>
              setMinStockModal({ isOpen: true, data: row.original, inputValue: row.original.stokMinimum })
            }
            onSesuaikanStok={() =>
              setOpnameModal({ isOpen: true, data: row.original, fisikAktual: row.original.stok, catatan: "" })
            }
          />
        ),
      },
    ],
    [],
  );

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
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-emerald-700" />
            Barang Gudang & Inventaris Pusat
          </h1>
          <p className="text-sm font-medium text-navy/60">
            Pantau dan kelola ketersediaan stok fisik khusus di area Gudang secara real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
            <Input
              placeholder="Cari barang di gudang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gading border-navy/20 text-navy focus-visible:ring-emerald-700 w-full"
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
      <div className="flex items-center gap-2 border-b border-navy/10 pb-4">
        <Button
          variant="ghost"
          onClick={() => setFilterTab("ALL")}
          className={cn(
            "rounded-full px-6 font-bold transition-all cursor-pointer",
            filterTab === "ALL"
              ? "bg-emerald-700 text-white hover:bg-emerald-800"
              : "text-navy/60 hover:text-navy hover:bg-emerald-50",
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

      {/* TABEL: DataTable, kartu per baris (TB1a sampai TB7a); galat daftar stok (TB18a) */}
      {gagalMemuatStok ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat stok gudang. Periksa koneksi, lalu muat ulang halaman.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredInventory}
          loading={isLoadingInventory}
          emptyMessage={'Gudang masih kosong. Klik tombol "Masukkan Master Data" di atas untuk mendaftarkan barang.'}
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}

      {/* MODAL BARU: TAMBAH MASTER DATA KE GUDANG */}
      <Dialog open={addItemModal} onOpenChange={(open) => !open && setAddItemModal(false)}>
        <DialogContent className="bg-gading border-navy/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy font-bold flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-700" />
              Tarik Master Data ke Gudang
            </DialogTitle>
            <DialogDescription className="text-navy/60 font-medium pt-1">
              Pilih Master Bahan Baku yang ingin didaftarkan ke rak fisik Gudang ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-navy">Pilih Barang Master <span className="text-rose-500">*</span></label>
              <Select 
                value={newItem.bahanBakuID} 
                onValueChange={(val) => setNewItem((prev) => ({ ...prev, bahanBakuID: val }))}
                disabled={isLoadingMaster}
              >
                <SelectTrigger className="w-full bg-white border-navy/20 text-navy font-bold focus:ring-emerald-700">
                  <SelectValue placeholder={isLoadingMaster ? "Memuat master data..." : "Pilih bahan baku..."} />
                </SelectTrigger>
                <SelectContent className="bg-white border-navy/10">
                  {availableBahanBaku.length === 0 ? (
                    <div className="p-3 text-sm font-medium text-rose-500 text-center">
                      Semua master data sudah ada di gudang.
                    </div>
                  ) : (
                    availableBahanBaku.map((bb) => (
                      <SelectItem key={bb.id} value={bb.id} className="font-bold cursor-pointer hover:bg-emerald-50">
                        {bb.namaBahan} <span className="text-xs text-navy/50 font-normal">({bb.satuan})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Stok Awal</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.stok}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, stok: e.target.value }))}
                  className="bg-white border-navy/20 font-mono font-bold text-navy focus-visible:ring-emerald-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Batas Minimum</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.stokMinimum}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, stokMinimum: e.target.value }))}
                  className="bg-white border-navy/20 font-mono font-bold text-navy focus-visible:ring-emerald-700"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddItemModal(false)} className="font-bold text-navy/60 cursor-pointer">
              Batal
            </Button>
            <Button
              onClick={() => tambahBarang()}
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
        <DialogContent className="bg-gading border-navy/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy font-bold">Atur Batas Minimum Stok Gudang</DialogTitle>
            <DialogDescription className="text-navy/60 font-medium pt-1">
              Sistem akan memberikan peringatan jika stok {minStockModal.data?.item?.nama} menyentuh batas ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-bold text-navy">Stok Minimum ({minStockModal.data?.item?.satuan || "pcs"})</label>
            <Input
              type="number"
              value={minStockModal.inputValue}
              onChange={(e) => setMinStockModal((prev) => ({ ...prev, inputValue: e.target.value ? Number(e.target.value) : "" }))}
              className="bg-white border-navy/20 text-navy font-mono font-bold focus-visible:ring-emerald-700 no-spinner"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMinStockModal((prev) => ({ ...prev, isOpen: false }))} className="font-bold text-navy/60 cursor-pointer">Batal</Button>
            <Button onClick={() => minStockModal.data && updateMinStockMutation.mutate({ id: minStockModal.data.id, stokMinimum: Number(minStockModal.inputValue) })} disabled={updateMinStockMutation.isPending} className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold cursor-pointer">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: QUICK OPNAME */}
      <Dialog open={opnameModal.isOpen} onOpenChange={(open) => !open && setOpnameModal((prev) => ({ ...prev, isOpen: false }))}>
        <DialogContent className="bg-gading border-navy/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy font-bold">Penyesuaian Fisik Gudang</DialogTitle>
            <DialogDescription className="text-navy/60 font-medium pt-1">
              Koreksi stok aktual untuk {opnameModal.data?.item?.nama}. Selisih otomatis masuk ke Jurnal Stok.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="bg-navy/5 p-3 rounded-lg border border-navy/10 flex justify-between items-center">
              <span className="text-sm font-bold text-navy/70">Tercatat di Sistem:</span>
              <span className="font-mono font-bold text-navy text-lg">{opnameModal.data?.stok} <span className="text-sm font-sans">{opnameModal.data?.item?.satuan}</span></span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-navy">Stok Fisik Sebenarnya <span className="text-rose-500">*</span></label>
              <Input
                type="number"
                value={opnameModal.fisikAktual}
                onChange={(e) => setOpnameModal((prev) => ({ ...prev, fisikAktual: e.target.value ? Number(e.target.value) : "" }))}
                className="bg-white border-navy/20 text-navy font-mono font-bold focus-visible:ring-emerald-700"
                placeholder="Masukkan hitungan riil..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-navy">Alasan Penyesuaian <span className="text-rose-500">*</span></label>
              <Input
                value={opnameModal.catatan}
                onChange={(e) => setOpnameModal((prev) => ({ ...prev, catatan: e.target.value }))}
                className="bg-white border-navy/20 text-navy focus-visible:ring-emerald-700 font-medium"
                placeholder="Contoh: Barang tumpah..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpnameModal((prev) => ({ ...prev, isOpen: false }))} className="font-bold text-navy/60 cursor-pointer">Batal</Button>
            <Button onClick={() => opnameModal.data && submitOpnameMutation.mutate({ id: opnameModal.data.id, fisikAktual: Number(opnameModal.fisikAktual), catatan: opnameModal.catatan })} disabled={submitOpnameMutation.isPending || opnameModal.fisikAktual === "" || opnameModal.catatan.trim() === ""} className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold cursor-pointer">
              Eksekusi Koreksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}