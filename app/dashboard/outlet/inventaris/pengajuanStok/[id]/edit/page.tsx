"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { PengajuanStok } from "@/types/pengajuanStok";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  MapPin,
  Package,
  CalendarClock,
  CalendarIcon,
  AlertTriangle,
} from "lucide-react";

type RequestItem = {
  id_lokal: string;
  bahanBakuID: string;
  jumlah: string;
  satuan: string;
};

export default function EditPengajuanStokPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);

  // --- Form State ---
  const [dariLocationID, setDariLocationID] = useState<string>("");
  const [keLocationID, setKeLocationID] = useState<string>("");
  const [catatan, setCatatan] = useState<string>("");
  const [tanggalKebutuhan, setTanggalKebutuhan] = useState<Date | undefined>(
    undefined,
  );
  const [items, setItems] = useState<RequestItem[]>([]);

  // --- Queries ---
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: queryKeys.pengajuanStokDetail(id),
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/pengajuanStok/${id}`,
        undefined,
        "pengguna",
      );
      return (res.data?.data || res.data) as PengajuanStok;
    },
  });

  const { data: lokasiList = [], isLoading: isLoadingLokasi } = useQuery({
    queryKey: queryKeys.lokasi,
    queryFn: async () => {
      const res = await apiClient.get<any>("/location", undefined, "pengguna");
      return (res.data?.data || res.data || []) as any[];
    },
  });

  const { data: bahanBakuList = [], isLoading: isLoadingBahan } = useQuery({
    queryKey: queryKeys.bahanBaku,
    queryFn: async () => {
      const res = await apiClient.get<any>("/bahanBaku", undefined, "pengguna");
      return (res.data?.data || res.data || []) as any[];
    },
  });

  const outletList = lokasiList.filter((l) => l.tipe === "Outlet");
  const gudangList = lokasiList.filter((l) => l.tipe === "Gudang");

  // --- Initialize Form Data ---
  useEffect(() => {
    if (detail) {
      if (detail.dariLokasi?.id) setDariLocationID(detail.dariLokasi.id);
      if (detail.keLokasi?.id) setKeLocationID(detail.keLokasi.id);
      if (detail.catatan) setCatatan(detail.catatan);
      if (detail.tanggalKebutuhan)
        setTanggalKebutuhan(new Date(detail.tanggalKebutuhan));

      if (detail.items && detail.items.length > 0) {
        setItems(
          detail.items.map((item) => ({
            id_lokal: crypto.randomUUID(),
            bahanBakuID: item.bahanBaku?.id || "",
            jumlah: String(item.jumlah),
            satuan: item.satuan || "",
          })),
        );
      }
    }
  }, [detail]);

  // --- Mutations ---
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!dariLocationID || !keLocationID)
        throw new Error("Lokasi asal dan tujuan wajib diisi.");
      const validItems = items.filter(
        (i) => i.bahanBakuID && i.jumlah && Number(i.jumlah) > 0,
      );
      if (validItems.length === 0)
        throw new Error("Minimal harus ada 1 barang dengan jumlah valid.");

      const payload = {
        dariLocationID,
        keLocationID,
        catatan,
        tanggalKebutuhan: tanggalKebutuhan
          ? tanggalKebutuhan.toISOString()
          : undefined,
        items: validItems.map((item) => ({
          bahanBakuID: item.bahanBakuID,
          jumlah: Number(item.jumlah),
          satuan: item.satuan || "pcs",
        })),
      };

      return await apiClient.put<any>(
        `/pengajuanStok/${id}`,
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Perubahan Disimpan", {
        description: "Draft pengajuan berhasil diperbarui.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStok() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pengajuanStokDetail(id),
      });
      router.push(`/dashboard/outlet/inventaris/pengajuanStok/${id}`);
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui", { description: err.message });
    },
  });

  // --- Handlers ---
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id_lokal: crypto.randomUUID(),
        bahanBakuID: "",
        jumlah: "",
        satuan: "",
      },
    ]);
  };

  const handleRemoveItem = (id_lokal: string) => {
    setItems((prev) => prev.filter((i) => i.id_lokal !== id_lokal));
  };

  const handleItemChange = (
    id_lokal: string,
    field: keyof RequestItem,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id_lokal === id_lokal) {
          const updatedItem = { ...item, [field]: value };
          if (field === "bahanBakuID") {
            const selectedBahan = bahanBakuList.find(
              (b) => (b._id || b.id) === value,
            );
            if (selectedBahan) updatedItem.satuan = selectedBahan.satuan || "";
          }
          return updatedItem;
        }
        return item;
      }),
    );
  };

  if (isLoadingDetail || isLoadingLokasi || isLoadingBahan) {
    return (
      <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64 bg-[#0A2947]/10" />
        <Skeleton className="h-100 w-full bg-[#0A2947]/10 rounded-2xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500/50" />
        <h2 className="text-xl font-bold text-[#0A2947]">
          Data tidak ditemukan
        </h2>
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    );
  }

  // Tembok Filter Keamanan
  if (detail.status !== "DRAFT") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500/80" />
        <h2 className="text-xl font-bold text-[#0A2947]">Akses Ditolak</h2>
        <p className="text-sm font-medium text-[#0A2947]/60">
          Dokumen ini sudah berstatus {detail.status} dan tidak dapat direvisi
          lagi.
        </p>
        <Button
          variant="default"
          className="bg-[#0A2947]"
          onClick={() =>
            router.push(`/dashboard/outlet/inventaris/pengajuanStok/${id}`)
          }
        >
          Lihat Detail Saja
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Batal Revisi
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Revisi Draft Pengajuan: {detail.nomorPengajuan}
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Perbarui item kebutuhan atau rute logistik sebelum dokumen ini
            diajukan.
          </p>
        </div>
      </div>

      {/* SECTION 1: RUTE LOGISTIK */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
          <MapPin className="h-5 w-5 text-[#D4A373]" />
          <h2 className="font-bold text-[#0A2947]">Rute Logistik</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Diminta Dari (Outlet Anda){" "}
              <span className="text-rose-500">*</span>
            </label>
            <Select value={dariLocationID} onValueChange={setDariLocationID}>
              <SelectTrigger className="w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus:ring-[#0A2947]">
                <SelectValue placeholder="Pilih Outlet Anda..." />
              </SelectTrigger>
              <SelectContent>
                {outletList.map((loc) => (
                  <SelectItem
                    key={loc._id || loc.id}
                    value={loc._id || loc.id}
                    className="font-medium cursor-pointer"
                  >
                    {loc.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Tujuan Permintaan (Gudang Pusat){" "}
              <span className="text-rose-500">*</span>
            </label>
            <Select value={keLocationID} onValueChange={setKeLocationID}>
              <SelectTrigger className="w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus:ring-[#0A2947]">
                <SelectValue placeholder="Pilih Gudang..." />
              </SelectTrigger>
              <SelectContent>
                {gudangList.map((loc) => (
                  <SelectItem
                    key={loc._id || loc.id}
                    value={loc._id || loc.id}
                    className="font-medium cursor-pointer"
                  >
                    {loc.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* SECTION 2: DAFTAR BARANG YANG DIMINTA */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#0A2947]/10 pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">
              Daftar Kebutuhan Barang
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm h-8 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" /> Tambah Baris
          </Button>
        </div>

        <div className="space-y-3 pt-2">
          {items.map((item) => (
            <div
              key={item.id_lokal}
              className="flex flex-col sm:flex-row items-start sm:items-end gap-3 bg-white p-3 rounded-xl border border-[#0A2947]/10"
            >
              <div className="w-full sm:flex-1 space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]/70">
                  Pilih Barang <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={item.bahanBakuID}
                  onValueChange={(val) =>
                    handleItemChange(item.id_lokal, "bahanBakuID", val)
                  }
                >
                  <SelectTrigger className="w-full bg-transparent border-[#0A2947]/20 focus:ring-[#0A2947]">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bahanBakuList.map((bahan) => (
                      <SelectItem
                        key={bahan._id || bahan.id}
                        value={bahan._id || bahan.id}
                        className="cursor-pointer"
                      >
                        {bahan.namaBahan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-32 space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]/70">
                  Jumlah <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={item.jumlah}
                  onChange={(e) =>
                    handleItemChange(item.id_lokal, "jumlah", e.target.value)
                  }
                  className="bg-transparent border-[#0A2947]/20 focus-visible:ring-[#0A2947] font-mono font-bold no-spinner"
                />
              </div>

              <div className="w-full sm:w-32 space-y-1.5">
                <label className="text-xs font-bold text-[#0A2947]/70">
                  Satuan
                </label>
                <Input
                  type="text"
                  readOnly
                  value={item.satuan || "-"}
                  className="bg-[#0A2947]/5 border-transparent font-medium text-[#0A2947]/50 cursor-not-allowed"
                  tabIndex={-1}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(item.id_lokal)}
                disabled={items.length === 1}
                className="w-10 h-10 text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: INFORMASI TAMBAHAN */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
          <CalendarClock className="h-5 w-5 text-[#D4A373]" />
          <h2 className="font-bold text-[#0A2947]">Informasi Pengiriman</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Tanggal Kebutuhan (Opsional)
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full h-10 justify-start text-left font-bold cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]",
                    !tanggalKebutuhan && "text-[#0A2947]/50",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#D4A373]" />
                  {tanggalKebutuhan
                    ? format(tanggalKebutuhan, "dd MMMM yyyy", {
                        locale: localeID,
                      })
                    : "Pilih tanggal..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 border-[#0A2947]/10 bg-[#FFFAF3]"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={tanggalKebutuhan}
                  onSelect={(date) => {
                    if (date) setTanggalKebutuhan(date);
                  }}
                />
              </PopoverContent>
            </Popover>
            <p className="text-[10px] text-[#0A2947]/50 font-medium">
              Batas waktu maksimal barang harus tiba di Outlet.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Catatan / Pesan ke Gudang
            </label>
            <Textarea
              placeholder="Misal: Tolong kirimkan batch produksi terbaru..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947] font-medium resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}
