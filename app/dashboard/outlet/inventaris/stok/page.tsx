"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@/hooks/use-debounce";
import { pesanError } from "@/lib/api/error";
import {
  useCakupanLokasiOutlet,
  useDaftarInventory,
  useOpnameInventory,
  useUbahStokMinimum,
} from "@/features/inventaris/hooks";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";
import MenuAksiStok from "@/features/inventaris/menu-aksi-stok";
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
import { DataTable } from "@/components/ui/data-table";
import {
  Search,
  MapPin,
  AlertTriangle,
  Loader2,
} from "lucide-react";

/** Pilihan baris per halaman (DataTable opt-in, keputusan TB11a). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

export default function StokInventoryPage() {

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
  // Cakupan lokasi: pemegang izin lintas outlet memilih "Semua Lokasi" atau satu
  // outlet; pengguna lain selalu lokasi aktif (outlet tenant), tanpa pemilih.
  const cakupan = useCakupanLokasiOutlet();
  const isLoadingLokasi = cakupan.status === "memuat";
  const lokasiOutlet = cakupan.status === "lintas" ? cakupan.lokasiOutlet : [];
  const filterLokasi =
    cakupan.status === "lintas"
      ? { locationID: selectedLocation !== "all" ? selectedLocation : undefined }
      : cakupan.status === "terkunci" && cakupan.lokasiId
        ? { locationID: cakupan.lokasiId }
        : null;

  // Fetch Inventory List (null berarti belum siap: tidak ada permintaan)
  const {
    data: inventoryData = [],
    isLoading: isLoadingInventory,
    isError: gagalMemuatStok,
  } = useDaftarInventory(
    filterLokasi ? { ...filterLokasi, search: debouncedSearch || undefined } : null,
  );

  const filteredInventory = useMemo(() => {
    let result = inventoryData;

    // 1. Pastikan hanya data Outlet yang boleh masuk ke tabel ini
    result = result.filter((inv) => inv.lokasi?.tipe === "Outlet");

    // 2. Filter Tab Kritis
    if (filterTab === "CRITICAL") {
      result = result.filter((inv) => inv.isStokKritis);
    }

    return result;
  }, [inventoryData, filterTab]);

  // --- Mutations ---
  const updateMinStockMutation = useUbahStokMinimum({
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Batas minimum stok diperbarui.",
      });
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
      toast.success("Opname Berhasil", {
        description: "Stok fisik telah disesuaikan.",
      });
      setOpnameModal({
        isOpen: false,
        data: null,
        fisikAktual: "",
        catatan: "",
      });
    },
    onError: (err) => {
      toast.error("Gagal", {
        description: pesanError(err, "Gagal menyesuaikan stok fisik."),
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

  // Aksi baris di menu titik tiga (TB7a, TB16a).
  const kolom = useMemo<ColumnDef<Inventory>[]>(
    () => [
      {
        id: "nama",
        header: "Nama Barang",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-navy">
              {row.original.item?.nama || "Item Tidak Dikenal"}
            </span>
            <span className="text-xs font-medium text-navy/50">
              {row.original.item?.tipeItem === "BAHAN_BAKU" ? "Bahan Baku" : "Barang Inventory"}
            </span>
          </div>
        ),
      },
      {
        id: "lokasi",
        header: "Lokasi",
        cell: ({ row }) => (
          <span className="font-medium text-navy/80">{row.original.lokasi?.nama || "-"}</span>
        ),
      },
      {
        id: "stok",
        header: "Stok Saat Ini",
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <span
              className={cn(
                "text-base font-mono font-bold",
                row.original.isStokKritis ? "text-rose-600" : "text-navy",
              )}
            >
              {row.original.stok}{" "}
              <span className="text-xs font-sans">{row.original.item?.satuan || "pcs"}</span>
            </span>
            {row.original.isStokKritis && (
              <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-600 border-rose-200">
                Kritis
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

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Stok & Inventory
          </h1>
          <p className="text-sm font-medium text-navy/60">
            Pantau dan kelola ketersediaan stok fisik secara real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-navy/40" />
            <Input
              placeholder="Cari nama barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gading border-navy/20 text-navy focus-visible:ring-navy"
            />
          </div>

          {cakupan.status === "lintas" && (
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full sm:w-48 bg-gading border-navy/20 text-navy font-semibold focus:ring-navy">
              <MapPin className="w-4 h-4 mr-2 text-karamel" />
              <SelectValue placeholder="Pilih Lokasi" />
            </SelectTrigger>
            <SelectContent className="bg-white border-navy/10 text-navy">
              <SelectItem value="all" className="font-bold cursor-pointer">
                Semua Lokasi
              </SelectItem>
              {lokasiOutlet.map((lok) => {
                const locationId = lok.id;
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
          )}
        </div>
      </div>

      {cakupan.status === "gagal" && (
        <PesanLokasi
          judul="Gagal Memuat Lokasi Outlet"
          isi="Lokasi kerja Anda tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman."
        />
      )}
      {cakupan.status === "terkunci" && !cakupan.lokasiId && (
        <PesanLokasi
          judul="Identitas Outlet Tidak Ditemukan"
          isi="Lokasi kerja Anda saat ini belum dikonfigurasi, sehingga stok tidak dapat ditampilkan. Harap periksa pengaturan profil lokasi Anda."
        />
      )}

      {/* QUICK TABS */}
      <div className="flex items-center gap-2 border-b border-navy/10 pb-4">
        <Button
          variant="ghost"
          onClick={() => setFilterTab("ALL")}
          className={cn(
            "rounded-full px-6 font-bold transition-all",
            filterTab === "ALL"
              ? "bg-navy text-white hover:bg-navy/90"
              : "text-navy/60 hover:text-navy hover:bg-navy/5",
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

      {/* TABEL: DataTable, kartu per baris (TB1a sampai TB7a); galat daftar stok (TB18a) */}
      {gagalMemuatStok ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat stok. Periksa koneksi, lalu muat ulang halaman.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredInventory}
          loading={isLoadingLokasi || isLoadingInventory}
          emptyMessage="Tidak ada data stok yang ditemukan."
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}

      {/* MODAL: EDIT MINIMUM STOK */}
      <Dialog
        open={minStockModal.isOpen}
        onOpenChange={(open) =>
          !open && setMinStockModal((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <DialogContent className="bg-gading border-navy/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy font-bold">
              Atur Batas Minimum Stok
            </DialogTitle>
            <DialogDescription className="text-navy/60 font-medium">
              Sistem akan memberikan peringatan jika stok{" "}
              {minStockModal.data?.item?.nama} menyentuh atau berada di bawah
              batas ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-bold text-navy">
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
              className="bg-white border-navy/20 text-navy font-mono font-bold focus-visible:ring-navy no-spinner"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setMinStockModal((prev) => ({ ...prev, isOpen: false }))
              }
              className="font-bold text-navy/60"
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateMinStock}
              disabled={updateMinStockMutation.isPending}
              className="bg-navy text-white hover:bg-navy/90 font-bold"
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
        <DialogContent className="bg-gading border-navy/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy font-bold">
              Penyesuaian Fisik (Quick Opname)
            </DialogTitle>
            <DialogDescription className="text-navy/60 font-medium">
              Koreksi stok aktual untuk {opnameModal.data?.item?.nama}. Selisih
              akan otomatis dicatat pada Jurnal Stok.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="bg-navy/5 p-3 rounded-lg border border-navy/10 flex justify-between items-center">
              <span className="text-sm font-bold text-navy/70">
                Stok Tercatat di Sistem:
              </span>
              <span className="font-mono font-bold text-navy text-lg">
                {opnameModal.data?.stok}{" "}
                <span className="text-sm font-sans">
                  {opnameModal.data?.item?.satuan}
                </span>
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-navy">
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
                className="bg-white border-navy/20 text-navy font-mono font-bold focus-visible:ring-navy no-spinner"
                placeholder="Masukkan hitungan fisik riil..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-navy">
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
                className="bg-white border-navy/20 text-navy focus-visible:ring-navy"
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
              className="font-bold text-navy/60"
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
              className="bg-karamel text-navy hover:bg-karamel/90 font-bold"
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
