"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { decodeJWT } from "@/lib/decodeToken";
import { PenjualanRequest, ItemPenjualanRequest } from "@/types/penjualan";
import { GetProdukResponse } from "@/types/produk";
import { useDebounce } from "@/hooks/use-debounce";
import { formatRupiah } from "@/lib/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Plus,
  Trash2,
  CalendarIcon,
  Clock3,
  Tag,
  Receipt,
  Users,
  ShoppingCart,
  Calculator,
} from "lucide-react";
import { Calendar } from "@/components/calendar";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

interface ItemState extends ItemPenjualanRequest {
  jumlahStr: string;
  diskonItemIDs: string[]; // State array ID Diskon Item
}

const emptyItem = (): ItemState => ({
  produkID: "",
  jumlah: 1,
  jumlahStr: "1",
  diskonItemIDs: [],
});

export default function BuatPenjualanPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // EKSTRAKSI ID PENGGUNA (KASIR)
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("penggunaToken")
      : null;
  const payloadToken = token ? decodeJWT(token) : null;
  const currentUserId = payloadToken?._id || payloadToken?.id || "";

  // FORM STATE
  const [pelangganID, setPelangganID] = useState("");
  const [jenisPenjualan, setJenisPenjualan] = useState<
    "dine-in" | "takeaway" | "booking"
  >("dine-in");
  const [tanggalInput, setTanggalInput] = useState<Date>(new Date());
  const now = new Date();
  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState(
    String(now.getMinutes()).padStart(2, "0"),
  );
  const [keterangan, setKeterangan] = useState("");
  const [items, setItems] = useState<ItemState[]>([emptyItem()]);
  const [diskonGlobalIDs, setDiskonGlobalIDs] = useState<string[]>([]); // State Diskon Global
  const [formError, setFormError] = useState("");

  const simpanDraft = true;

  // ALERT DIALOG STATE
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<PenjualanRequest | null>(
    null,
  );

  // COMBOBOX & POPOVER STATE
  const [openPelanggan, setOpenPelanggan] = useState(false);
  const [pelangganSearch, setPelangganSearch] = useState("");
  const [openProduk, setOpenProduk] = useState<number | null>(null);
  const [openDiskonItem, setOpenDiskonItem] = useState<number | null>(null);
  const [openDiskonGlobal, setOpenDiskonGlobal] = useState(false);

  // --- QUERY FETCHING ---
  const { data: pelangganList = [] } = useQuery({
    queryKey: queryKeys.pelanggan,
    queryFn: async () => {
      const res = await apiClient.get<any>("/pelanggan", undefined, "pengguna");
      const fetched = res.data?.data || res.data || [];
      return Array.isArray(fetched) ? fetched : [];
    },
  });

  const { data: produkList = [] } = useQuery({
    queryKey: queryKeys.produk,
    queryFn: async () => {
      const res = await apiClient.get<GetProdukResponse>(
        "/produk",
        undefined,
        "pengguna",
      );
      return res.data;
    },
  });

  // Fetch Diskon (Semua)
  const { data: diskonList = [] } = useQuery({
    queryKey: ["diskon-aktif"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/diskon", undefined, "pengguna");
      return (res.data?.data || res.data || []) as any[];
    },
  });

  // Fetch Pajak (Semua)
  const { data: pajakList = [] } = useQuery({
    queryKey: ["pajak-aktif"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/pajak", undefined, "pengguna");
      return (res.data?.data || res.data || []) as any[];
    },
  });

  // --- FILTERING AKTIF SAJA ---
  const activeDiskonItem = useMemo(
    () =>
      diskonList.filter((d) => d.status === "Aktif" && d.cakupan === "Item"),
    [diskonList],
  );
  const activeDiskonGlobal = useMemo(
    () =>
      diskonList.filter((d) => d.status === "Aktif" && d.cakupan === "Global"),
    [diskonList],
  );
  const activePajakGlobal = useMemo(
    () =>
      pajakList
        .filter((p) => p.statusPajak === true && p.tipePajak === false)
        .sort((a, b) => (a.prioritas || 0) - (b.prioritas || 0)),
    [pajakList],
  );

  // DEBOUNCE SEARCH PELANGGAN
  const debouncedPelangganSearch = useDebounce(pelangganSearch, 300);
  const filteredPelanggan = useMemo(() => {
    if (!debouncedPelangganSearch) return pelangganList;
    const q = debouncedPelangganSearch.toLowerCase();
    return pelangganList.filter((p: any) =>
      p.namaPelanggan.toLowerCase().includes(q),
    );
  }, [pelangganList, debouncedPelangganSearch]);

  // --- HELPER LOGIKA "BISA DIGABUNG" ---
  const toggleDiskonSelection = (
    currentIds: string[],
    newId: string,
    availableList: any[],
  ) => {
    const target = availableList.find((d) => (d._id || d.id) === newId);
    if (!target) return currentIds;

    // Toggle (Unselect)
    if (currentIds.includes(newId))
      return currentIds.filter((id) => id !== newId);

    // Jika diskon baru BUKAN tipe yang bisa digabung, reset seluruhnya ke dia saja
    if (!target.bisaDigabung) return [newId];

    // Cek apakah diskon yang *sudah terpilih* ada yang tidak bisa digabung
    const currentSelected = availableList.filter((d) =>
      currentIds.includes(d._id || d.id),
    );
    const hasNonGabung = currentSelected.some((d) => !d.bisaDigabung);
    if (hasNonGabung) return [newId]; // Paksa ganti

    return [...currentIds, newId];
  };

  // --- ITEM HANDLERS ---
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handlePilihProduk = useCallback((index: number, produkID: string) => {
    setItems((prev) => {
      const exist = prev.findIndex(
        (item, i) => i !== index && item.produkID === produkID,
      );
      if (exist !== -1) {
        return prev
          .map((item, i) => {
            if (i !== exist) return item;
            const newJumlah = item.jumlah + prev[index].jumlah;
            return { ...item, jumlah: newJumlah, jumlahStr: String(newJumlah) };
          })
          .filter((_, i) => i !== index);
      }
      return prev.map((item, i) =>
        i === index ? { ...item, produkID } : item,
      );
    });
    setOpenProduk(null);
  }, []);

  const handleJumlahChange = (index: number, raw: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, jumlahStr: raw } : item)),
    );
  };

  const handleJumlahBlur = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const parsed = parseInt(item.jumlahStr, 10);
        const jumlah = isNaN(parsed) || parsed < 1 ? 1 : parsed;
        return { ...item, jumlah, jumlahStr: String(jumlah) };
      }),
    );
  };

  const toggleItemDiskon = (index: number, diskonId: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          diskonItemIDs: toggleDiskonSelection(
            item.diskonItemIDs,
            diskonId,
            activeDiskonItem,
          ),
        };
      }),
    );
  };

  const getProdukNama = (produkID: string) =>
    produkList.find((p) => p._id === produkID)?.namaProduk ?? "";

  // ==========================================
  //  ENGINE SIMULASI KALKULASI FRONTEND
  // ==========================================
  const calc = useMemo(() => {
    let grandTotalItem = 0;

    // 1. Hitung Item & Diskon Item
    const itemsCalc = items.map((item) => {
      const produk = produkList.find(
        (p) => (p._id || (p as any).id) === item.produkID,
      );
      const subTotal = (item.jumlah || 1) * (produk?.hargaJual || 0);
      let running = subTotal;
      let totalDiskonItem = 0;

      const selectedDiskon = activeDiskonItem.filter((d) =>
        item.diskonItemIDs.includes(d._id || d.id),
      );
      for (const d of selectedDiskon) {
        let potong =
          d.tipe === "persen"
            ? Math.ceil((running * d.nilai) / 100)
            : d.nilai || 0;
        if (potong > running) potong = running;
        totalDiskonItem += potong;
        running -= potong;
      }

      grandTotalItem += running;
      return { subTotal, totalDiskonItem, totalHarga: running };
    });

    // 2. Hitung Diskon Global
    let runningGlobal = grandTotalItem;
    let totalDiskonGlobal = 0;

    const selectedDiskonGlobal = activeDiskonGlobal.filter((d) =>
      diskonGlobalIDs.includes(d._id || d.id),
    );

    for (const d of selectedDiskonGlobal) {
      let potong =
        d.tipe === "persen"
          ? Math.ceil((runningGlobal * d.nilai) / 100)
          : d.nilai || 0;
      if (potong > runningGlobal) potong = runningGlobal;
      totalDiskonGlobal += potong;
      runningGlobal -= potong;
    }

    // 3. Hitung Pajak Transaksi Global
    const dasarSetelahDiskon = runningGlobal;
    let runningTotalPajak = dasarSetelahDiskon;
    let totalPajak = 0;
    const rincianPajak = [];

    for (const p of activePajakGlobal) {
      let nilaiPajak = 0;
      if (p.modelPerhitungan === 1) {
        nilaiPajak =
          (runningTotalPajak / (1 + p.tarifPajak / 100)) * (p.tarifPajak / 100);
      } else if (p.modelPerhitungan === 2) {
        nilaiPajak = dasarSetelahDiskon * (p.tarifPajak / 100);
        runningTotalPajak += nilaiPajak;
      } else if (p.modelPerhitungan === 3) {
        nilaiPajak = runningTotalPajak * (p.tarifPajak / 100);
        runningTotalPajak += nilaiPajak;
      }

      totalPajak += Math.round(nilaiPajak);
      rincianPajak.push({
        namaPajak: p.namaPajak,
        nominal: Math.round(nilaiPajak),
        tipe: p.modelPerhitungan === 1 ? "Inc" : "Exc",
      });
    }

    return {
      itemsCalc,
      grandTotalItem,
      totalDiskonGlobal,
      rincianPajak,
      totalPajak,
      grandTotal: Math.round(runningTotalPajak),
    };
  }, [
    items,
    produkList,
    activeDiskonItem,
    activeDiskonGlobal,
    diskonGlobalIDs,
    activePajakGlobal,
  ]);

  // --- SUBMIT LOGIC ---
  const createMutation = useMutation({
    mutationFn: async (payload: PenjualanRequest) => {
      return await apiClient.post("/penjualan", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Penjualan berhasil dibuat (Draft).",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.penjualan });
      router.push("/dashboard/penjualan");
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses", {
        description: err.message || "Gagal membuat penjualan.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!currentUserId) return setFormError("Sesi kasir tidak terdeteksi.");
    if (!pelangganID)
      return setFormError("Silakan pilih pelanggan terlebih dahulu.");
    if (items.some((item) => !item.produkID))
      return setFormError("Semua baris item harus memiliki produk.");

    const tanggalTransaksi = new Date(tanggalInput);
    tanggalTransaksi.setHours(Number(hour), Number(minute), 0);

    const payload: PenjualanRequest = {
      penggunaID: currentUserId,
      pelangganID,
      jenisTransaksi: "INVOICE",
      jenisPenjualan,
      tanggalTransaksi: tanggalTransaksi.toISOString(),
      itemPenjualan: items.map(({ produkID, jumlah, diskonItemIDs }) => ({
        produkID,
        jumlah,
        diskonItemIDs: diskonItemIDs.length > 0 ? diskonItemIDs : undefined,
      })),
      diskonGlobalIDs: diskonGlobalIDs.length > 0 ? diskonGlobalIDs : undefined,
      keterangan: keterangan || undefined,
      simpanDraft,
    };

    setPendingPayload(payload);
    setShowConfirm(true);
  };

  const executeCreate = async () => {
    if (!pendingPayload) return;
    await createMutation.mutateAsync(pendingPayload);
    setShowConfirm(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/penjualan")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Penjualan
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Buat Penjualan</h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Isi detail transaksi untuk membuat struk/invoice penjualan baru.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* ================= KOLOM KIRI (UTAMA) ================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* INFO TRANSAKSI */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-[#0A2947] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#D4A373]" />
              Informasi Transaksi
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Jenis Penjualan</label>
              <Select
                value={jenisPenjualan}
                onValueChange={(val) => setJenisPenjualan(val as any)}
              >
                <SelectTrigger className="w-full h-12 cursor-pointer font-bold bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  <SelectItem value="dine-in" className="cursor-pointer py-3 font-bold hover:bg-[#0A2947]/5">Dine-in</SelectItem>
                  <SelectItem value="takeaway" className="cursor-pointer py-3 font-bold hover:bg-[#0A2947]/5">Takeaway</SelectItem>
                  <SelectItem value="booking" className="cursor-pointer py-3 font-bold hover:bg-[#0A2947]/5">Booking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Tanggal Transaksi</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 justify-start text-left font-bold cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#D4A373]" />
                      {format(tanggalInput, "dd MMMM yyyy", { locale: localeID })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-[#0A2947]/10 bg-[#FFFAF3]" align="start">
                    <Calendar
                      mode="single"
                      selected={tanggalInput}
                      onSelect={(date) => { if (date) setTanggalInput(date); }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Jam Transaksi</label>
                <div className="flex h-12 w-full items-center gap-2 rounded-md border border-[#0A2947]/20 bg-[#FFFAF3] px-3 focus-within:ring-1 focus-within:ring-[#0A2947]">
                  <Clock3 className="h-4 w-4 text-[#D4A373]" />
                  <input
                    type="text"
                    maxLength={2}
                    className="w-10 bg-transparent text-center font-bold text-[#0A2947] outline-none"
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    onBlur={() => setHour((p) => p.padStart(2, "0"))}
                  />
                  <span className="font-bold text-[#0A2947]">:</span>
                  <input
                    type="text"
                    maxLength={2}
                    className="w-10 bg-transparent text-center font-bold text-[#0A2947] outline-none"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    onBlur={() => setMinute((p) => p.padStart(2, "0"))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ITEM PENJUALAN */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0A2947] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#D4A373]" />
                Item Penjualan
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="cursor-pointer border-[#0A2947]/20 bg-[#FFFAF3] text-[#0A2947] font-bold hover:bg-[#0A2947]/5 shadow-sm"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Item
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item, index) => {
                const selectedProduk = produkList.find((p) => p._id === item.produkID);
                const itemCalc = calc.itemsCalc[index];

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-[#0A2947]/10 p-5 space-y-4 bg-[#FFFAF3] shadow-inner"
                  >
                    <div className="flex items-center justify-between border-b border-[#0A2947]/5 pb-3">
                      <span className="text-xs font-bold text-[#0A2947]/50 uppercase tracking-widest">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#0A2947]">Produk</label>
                      <Popover
                        open={openProduk === index}
                        onOpenChange={(open) => setOpenProduk(open ? index : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-bold cursor-pointer bg-white border-[#0A2947]/20 text-[#0A2947]"
                          >
                            <span className={item.produkID ? "" : "text-[#0A2947]/40 font-medium"}>
                              {item.produkID ? getProdukNama(item.produkID) : "Pilih produk..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-[#0A2947]/10" align="start">
                          <Command className="bg-[#FFFAF3]">
                            <CommandInput placeholder="Cari produk..." className="text-[#0A2947]" />
                            <CommandList>
                              <CommandEmpty className="py-6 text-center text-sm font-medium text-[#0A2947]/60">Produk tidak ditemukan.</CommandEmpty>
                              <CommandGroup>
                                {produkList.map((p) => (
                                  <CommandItem
                                    key={p._id}
                                    onSelect={() => handlePilihProduk(index, p._id)}
                                    className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-medium"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 text-[#718355]",
                                        item.produkID === p._id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="flex-1">{p.namaProduk}</span>
                                    <span className="ml-2 text-xs font-bold text-[#0A2947]/50">
                                      {formatRupiah(p.hargaJual)}
                                    </span>
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
                        <label className="text-sm font-bold text-[#0A2947]">Jumlah</label>
                        <Input
                          type="number"
                          min={1}
                          value={item.jumlahStr}
                          onChange={(e) => handleJumlahChange(index, e.target.value)}
                          onBlur={() => handleJumlahBlur(index)}
                          className="bg-white border-[#0A2947]/20 text-[#0A2947] font-bold no-spinner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[#0A2947]">Harga Satuan</label>
                        <div className="flex h-10 items-center rounded-md border border-[#0A2947]/10 bg-[#0A2947]/5 px-3 text-sm font-bold text-[#0A2947]/70 font-mono">
                          {selectedProduk ? formatRupiah(selectedProduk.hargaJual) : "-"}
                        </div>
                      </div>
                    </div>

                    {/* Diskon Item */}
                    {selectedProduk && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold flex items-center gap-1.5 text-[#0A2947]">
                            <Tag className="h-3.5 w-3.5 text-[#D4A373]" /> Diskon Produk
                          </label>
                          <Popover
                            open={openDiskonItem === index}
                            onOpenChange={(o) => setOpenDiskonItem(o ? index : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs cursor-pointer font-bold border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5"
                              >
                                Pilih Diskon
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-64 p-0 border-[#0A2947]/10">
                              <Command className="bg-[#FFFAF3]">
                                <CommandInput placeholder="Cari diskon item..." className="text-[#0A2947]" />
                                <CommandList>
                                  <CommandEmpty className="py-4 text-center text-xs font-medium text-[#0A2947]/60">Belum ada diskon aktif.</CommandEmpty>
                                  <CommandGroup>
                                    {activeDiskonItem.map((d, idx) => {
                                      const targetId = d._id || d.id;
                                      const isSelected = item.diskonItemIDs.includes(targetId);
                                      const safeKey = targetId || `item-diskon-${idx}`;

                                      return (
                                        <CommandItem
                                          key={safeKey}
                                          onSelect={() => toggleItemDiskon(index, targetId)}
                                          className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-medium"
                                        >
                                          <div className="flex flex-1 items-center gap-2">
                                            {/* Checkbox Custom untuk CommandItem */}
                                            <div
                                              className={cn(
                                                "flex h-4 w-4 items-center justify-center rounded-sm border",
                                                isSelected ? "bg-[#0A2947] border-[#0A2947]" : "border-[#0A2947]/30"
                                              )}
                                            >
                                              {isSelected && <Check className="h-3 w-3 text-[#FFFAF3]" />}
                                            </div>
                                            <span>{d.namaDiskon}</span>
                                          </div>
                                          <Badge className="text-[10px] bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373] border-none font-bold">
                                            {d.tipe === "persen" ? `${d.nilai}%` : "Rp"}
                                          </Badge>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {item.diskonItemIDs.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {item.diskonItemIDs.map((id, idx) => {
                              const d = activeDiskonItem.find((x) => (x._id || x.id) === id);
                              if (!d) return null;
                              return (
                                <Badge
                                  key={d._id || d.id || `badge-item-${idx}`}
                                  className="bg-[#D4A373] text-[#0A2947] border-none hover:bg-[#D4A373] text-[10px] font-bold shadow-sm"
                                >
                                  {d.namaDiskon} ({d.tipe === "persen" ? `${d.nilai}%` : formatRupiah(d.nilai)})
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedProduk && (
                      <div className="flex flex-col items-end gap-1 pt-3 border-t border-[#0A2947]/5 mt-2">
                        {itemCalc.totalDiskonItem > 0 && (
                          <span className="text-xs text-rose-500 line-through font-mono">
                            {formatRupiah(itemCalc.subTotal)}
                          </span>
                        )}
                        <span className="text-sm font-bold text-[#0A2947] font-mono">
                          {formatRupiah(itemCalc.totalHarga)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= KOLOM KANAN (SIDEBAR) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
          
          {/* PELANGGAN */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#0A2947] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D4A373]" /> Pelanggan
            </h2>
            <div className="space-y-2">
              <Popover open={openPelanggan} onOpenChange={setOpenPelanggan}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPelanggan}
                    className="w-full justify-between font-bold cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]"
                  >
                    <span className={pelangganID ? "" : "text-[#0A2947]/50 font-medium"}>
                      {pelangganID
                        ? (pelangganList.find((p: any) => (p._id || p.id) === pelangganID)
                            ?.namaPelanggan ?? "Pelanggan tidak ditemukan")
                        : "Pilih pelanggan..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-[#0A2947]/10" align="start">
                  <Command shouldFilter={false} className="bg-[#FFFAF3]">
                    <CommandInput
                      placeholder="Cari pelanggan..."
                      value={pelangganSearch}
                      onValueChange={setPelangganSearch}
                      className="text-[#0A2947]"
                    />
                    <CommandList>
                      <CommandEmpty className="py-4 text-center text-xs font-medium text-[#0A2947]/60">Pelanggan tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {filteredPelanggan.map((p: any) => {
                          const idPelanggan = p._id || p.id;
                          return (
                            <CommandItem
                              key={idPelanggan}
                              onSelect={() => {
                                setPelangganID(idPelanggan);
                                setOpenPelanggan(false);
                                setPelangganSearch("");
                              }}
                              className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-medium"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-[#718355]",
                                  pelangganID === idPelanggan ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span>{p.namaPelanggan}</span>
                              <span className="ml-auto text-xs font-bold text-[#0A2947]/50 capitalize">
                                {p.tipePelanggan}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* DISKON GLOBAL & KETERANGAN */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0A2947] flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#D4A373]" /> Diskon Global
                </h2>
                <Popover open={openDiskonGlobal} onOpenChange={setOpenDiskonGlobal}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs cursor-pointer font-bold border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5"
                    >
                      Pilih Diskon
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-0 border-[#0A2947]/10">
                    <Command className="bg-[#FFFAF3]">
                      <CommandInput placeholder="Cari diskon transaksi..." className="text-[#0A2947]" />
                      <CommandList>
                        <CommandEmpty className="py-4 text-center text-xs font-medium text-[#0A2947]/60">Belum ada diskon aktif.</CommandEmpty>
                        <CommandGroup>
                          {activeDiskonGlobal.map((d, index) => {
                            const targetId = d._id || d.id; 
                            const isSelected = diskonGlobalIDs.includes(targetId);
                            const safeKey = targetId || `global-diskon-${index}`;
                            return (
                              <CommandItem
                                key={safeKey}
                                onSelect={() =>
                                  setDiskonGlobalIDs((prev) =>
                                    toggleDiskonSelection(prev, targetId, activeDiskonGlobal)
                                  )
                                }
                                className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-medium"
                              >
                                <div className="flex flex-1 items-center gap-2">
                                  {/* Checkbox Custom */}
                                  <div
                                    className={cn(
                                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                                      isSelected ? "bg-[#0A2947] border-[#0A2947]" : "border-[#0A2947]/30"
                                    )}
                                  >
                                    {isSelected && <Check className="h-3 w-3 text-[#FFFAF3]" />}
                                  </div>
                                  <span>{d.namaDiskon}</span>
                                </div>
                                <Badge className="text-[10px] bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373] border-none font-bold">
                                  {d.tipe === "persen" ? `${d.nilai}%` : "Rp"}
                                </Badge>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {diskonGlobalIDs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {diskonGlobalIDs.map((id, idx) => {
                    const d = activeDiskonGlobal.find((x) => (x._id || x.id) === id);
                    if (!d) return null;
                    return (
                      <Badge
                        key={d._id || d.id || `badge-global-${idx}`}
                        className="bg-[#D4A373] text-[#0A2947] border-none hover:bg-[#D4A373] text-[11px] px-2.5 py-1 font-bold shadow-sm"
                      >
                        {d.namaDiskon} ({d.tipe === "persen" ? `${d.nilai}%` : formatRupiah(d.nilai)})
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-[#0A2947]/10 pt-4">
              <label className="text-sm font-bold text-[#0A2947]">Keterangan <span className="font-medium text-[#0A2947]/50">(Opsional)</span></label>
              <Input
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan transaksi..."
                className="text-sm bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              />
            </div>
          </div>

          {/* RINGKASAN TAGIHAN */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#0A2947] text-[#FFFAF3] p-6 shadow-md space-y-4">
            <h2 className="text-sm font-bold border-b border-[#FFFAF3]/20 pb-3 flex items-center gap-2 uppercase tracking-widest text-[#D4A373]">
              <Calculator className="w-4 h-4" /> Ringkasan
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[#FFFAF3]/80 font-medium">
                <span>Subtotal Produk</span>
                <span className="font-mono text-[#FFFAF3]">{formatRupiah(calc.grandTotalItem)}</span>
              </div>

              {calc.totalDiskonGlobal > 0 && (
                <div className="flex justify-between text-rose-300 font-bold">
                  <span>Total Diskon</span>
                  <span className="font-mono">-{formatRupiah(calc.totalDiskonGlobal)}</span>
                </div>
              )}

              {calc.rincianPajak.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {calc.rincianPajak.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[#FFFAF3]/60 text-xs font-medium">
                      <span>Pajak: {p.namaPajak}</span>
                      <span className="font-mono">
                        {p.tipe === "Inc" ? "(Inc) " : ""}{formatRupiah(p.nominal)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[#FFFAF3]/80 font-bold border-t border-[#FFFAF3]/20 border-dashed pt-2 mt-2">
                    <span>Total Pajak</span>
                    <span className="font-mono">{formatRupiah(calc.totalPajak)}</span>
                  </div>
                </div>
              )}

              <div className="border-t border-[#FFFAF3]/20 pt-4 mt-2 flex justify-between items-end">
                <span className="text-sm font-bold text-[#FFFAF3]">Total Estimasi</span>
                <span className="text-2xl font-black text-[#718355] leading-none font-mono">
                  {formatRupiah(calc.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= AKSI & SUBMIT ================= */}
        <div className="lg:col-span-12 flex flex-col gap-3">
          {formError && (
            <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{formError}</p>
          )}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-4 shadow-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/penjualan")}
              disabled={createMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold px-8 shadow-sm"
            >
              {createMutation.isPending ? "Memproses..." : "Buat Penjualan"}
            </Button>
          </div>
        </div>
      </form>

      {/* DIALOG KONFIRMASI */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">Buat Transaksi Penjualan?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Apakah Anda yakin detail transaksi sudah benar? Data akan disimpan sebagai transaksi baru yang belum dibayar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createMutation.isPending} className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCreate}
              disabled={createMutation.isPending}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold"
            >
              {createMutation.isPending ? "Memproses..." : "Ya, Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}