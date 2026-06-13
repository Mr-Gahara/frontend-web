"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { decodeJWT } from "@/lib/decodeToken";
import {
  PenjualanRequest,
  ItemPenjualanRequest,
  GetPelangganResponse,
} from "@/types/penjualan";
import { GetProdukResponse } from "@/types/produk";
import { useDebounce } from "@/hooks/use-debounce";
import { formatRupiah } from "@/lib/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

interface ItemState extends ItemPenjualanRequest {
  jumlahStr: string;
}

const emptyItem = (): ItemState => ({
  produkID: "",
  jumlah: 1,
  jumlahStr: "1",
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

  const simpanDraft = true; // Force selalu true
  const [keterangan, setKeterangan] = useState("");
  const [items, setItems] = useState<ItemState[]>([emptyItem()]);
  const [formError, setFormError] = useState("");

  // ALERT DIALOG STATE
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<PenjualanRequest | null>(
    null,
  );

  // COMBOBOX STATE
  const [openPelanggan, setOpenPelanggan] = useState(false);
  const [pelangganSearch, setPelangganSearch] = useState("");
  const [openProduk, setOpenProduk] = useState<number | null>(null);

  // QUERY PELANGGAN
  const { data: pelangganList = [], error: pelangganError } = useQuery({
    queryKey: queryKeys.pelanggan,
    queryFn: async () => {
      const res = await apiClient.get<any>("/pelanggan", undefined, "pengguna");
      const fetchedData = res.data?.data || res.data || [];
      return Array.isArray(fetchedData) ? fetchedData : [];
    },
  });

  // QUERY PRODUK
  const { data: produkList = [], error: produkError } = useQuery({
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

  // ERROR TOASTS
  useEffect(() => {
    if (pelangganError) {
      toast.error("Gagal", { description: "Gagal memuat daftar pelanggan." });
    }
    if (produkError) {
      toast.error("Gagal", { description: "Gagal memuat daftar produk." });
    }
  }, [pelangganError, produkError]);

  // DEBOUNCE SEARCH PELANGGAN
  const debouncedPelangganSearch = useDebounce(pelangganSearch, 300);
  const filteredPelanggan = useMemo(() => {
    if (!debouncedPelangganSearch) return pelangganList;
    const q = debouncedPelangganSearch.toLowerCase();
    return pelangganList.filter((p: any) =>
      p.namaPelanggan.toLowerCase().includes(q),
    );
  }, [pelangganList, debouncedPelangganSearch]);

  // HELPERS ITEM
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handlePilihProduk = useCallback((index: number, produkID: string) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item, i) => i !== index && item.produkID === produkID,
      );
      if (existingIndex !== -1) {
        return prev
          .map((item, i) => {
            if (i !== existingIndex) return item;
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

  const getProdukNama = (produkID: string) =>
    produkList.find((p) => p._id === produkID)?.namaProduk ?? "";
  const getSubtotal = (item: ItemState) => {
    const produk = produkList.find((p) => p._id === item.produkID);
    return produk ? produk.hargaJual * item.jumlah : 0;
  };
  const totalEstimasi = useMemo(
    () => items.reduce((acc, item) => acc + getSubtotal(item), 0),
    [items, produkList],
  );

  // MUTATION CREATE
  const createMutation = useMutation({
    mutationFn: async (payload: PenjualanRequest) => {
      return await apiClient.post("/penjualan", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: simpanDraft
          ? "Penjualan berhasil disimpan sebagai draft."
          : "Penjualan berhasil dibuat.",
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

  // SUBMIT FORM (Hanya validasi dan set state Pop-up)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!currentUserId) {
      setFormError(
        "Sesi kasir tidak terdeteksi. Silakan muat ulang atau login kembali.",
      );
      return;
    }
    if (!pelangganID) {
      setFormError("Silakan pilih pelanggan terlebih dahulu.");
      return;
    }
    if (!tanggalInput) {
      setFormError("Tanggal transaksi wajib diisi.");
      return;
    }
    if (items.some((item) => !item.produkID)) {
      setFormError("Semua baris item harus memiliki produk yang dipilih.");
      return;
    }
    if (items.some((item) => item.jumlah < 1)) {
      setFormError("Jumlah item minimal 1.");
      return;
    }

    const tanggalTransaksi = new Date(tanggalInput);
    tanggalTransaksi.setHours(Number(hour), Number(minute), 0);

    const payload: PenjualanRequest = {
      penggunaID: currentUserId,
      pelangganID,
      jenisTransaksi: "INVOICE",
      jenisPenjualan,
      tanggalTransaksi: tanggalTransaksi.toISOString(),
      itemPenjualan: items.map(({ produkID, jumlah }) => ({
        produkID,
        jumlah,
      })),
      keterangan: keterangan || undefined,
      simpanDraft,
    };

    setPendingPayload(payload);
    setShowConfirm(true); // Memunculkan Pop-up
  };

  // EKSEKUSI API SETELAH KONFIRMASI POP-UP
  const executeCreate = async () => {
    if (!pendingPayload) return;
    await createMutation.mutateAsync(pendingPayload);
    setShowConfirm(false);
    setPendingPayload(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => router.push("/dashboard/penjualan")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Penjualan
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Buat Penjualan</h1>
          <p className="text-sm text-muted-foreground">
            Isi detail transaksi untuk membuat struk/invoice penjualan baru.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* ======================= */}
        {/* KOLOM KIRI (UTAMA)      */}
        {/* ======================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* INFO TRANSAKSI */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold">Informasi Transaksi</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Penjualan</label>
              <Select
                value={jenisPenjualan}
                onValueChange={(val) => setJenisPenjualan(val as any)}
              >
                <SelectTrigger className="w-full h-12 cursor-pointer font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="dine-in"
                    className="cursor-pointer py-3 font-medium"
                  >
                    Dine-in
                  </SelectItem>
                  <SelectItem
                    value="takeaway"
                    className="cursor-pointer py-3 font-medium"
                  >
                    Takeaway
                  </SelectItem>
                  <SelectItem
                    value="booking"
                    className="cursor-pointer py-3 font-medium"
                  >
                    Booking
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Transaksi</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 justify-start text-left font-medium cursor-pointer"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(tanggalInput, "dd MMMM yyyy", {
                        locale: localeID,
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tanggalInput}
                      onSelect={(date) => {
                        if (date) setTanggalInput(date);
                      }}
                      captionLayout="dropdown"
                      startMonth={new Date(2010, 0)}
                      endMonth={new Date(new Date().getFullYear() + 1, 11)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jam Transaksi</label>
                <div className="flex h-12 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring">
                  <Clock3 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className="w-10 bg-transparent text-center font-medium outline-none"
                    value={hour}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        if (Number(val) <= 23) setHour(val);
                        else if (val.length === 2) setHour("23");
                      }
                    }}
                    onBlur={() =>
                      setHour((prev) => (prev ? prev.padStart(2, "0") : "00"))
                    }
                  />
                  <span className="font-medium text-muted-foreground">:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className="w-10 bg-transparent text-center font-medium outline-none"
                    value={minute}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        if (Number(val) <= 59) setMinute(val);
                        else if (val.length === 2) setMinute("59");
                      }
                    }}
                    onBlur={() =>
                      setMinute((prev) => (prev ? prev.padStart(2, "0") : "00"))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ITEM PENJUALAN */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Item Penjualan</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="cursor-pointer"
              >
                <Plus className="mr-1 h-3 w-3" /> Tambah Item
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item, index) => {
                const selectedProduk = produkList.find(
                  (p) => p._id === item.produkID,
                );
                return (
                  <div
                    key={index}
                    className="rounded-lg border p-4 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-red-500 hover:bg-red-50"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-medium">Produk</label>
                      <Popover
                        open={openProduk === index}
                        onOpenChange={(open) =>
                          setOpenProduk(open ? index : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal cursor-pointer bg-background"
                          >
                            {item.produkID
                              ? getProdukNama(item.produkID)
                              : "Pilih produk..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[--radix-popover-trigger-width] p-0"
                          align="start"
                        >
                          <Command>
                            <CommandInput placeholder="Cari produk..." />
                            <CommandList>
                              <CommandEmpty>
                                Produk tidak ditemukan.
                              </CommandEmpty>
                              <CommandGroup>
                                {produkList.map((p) => {
                                  const sudahDipilih =
                                    item.produkID !== p._id &&
                                    items.some(
                                      (it, i) =>
                                        i !== index && it.produkID === p._id,
                                    );
                                  return (
                                    <CommandItem
                                      key={p._id}
                                      value={p.namaProduk}
                                      onSelect={() =>
                                        handlePilihProduk(index, p._id)
                                      }
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          item.produkID === p._id
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <span className="flex-1">
                                        {p.namaProduk}
                                      </span>
                                      {sudahDipilih && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          +jumlah
                                        </span>
                                      )}
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {formatRupiah(p.hargaJual)}
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Jumlah</label>
                        <Input
                          type="number"
                          className="no-spinner bg-background"
                          min={1}
                          value={item.jumlahStr}
                          onChange={(e) =>
                            handleJumlahChange(index, e.target.value)
                          }
                          onBlur={() => handleJumlahBlur(index)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">
                          Harga Satuan
                        </label>
                        <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                          {selectedProduk
                            ? formatRupiah(selectedProduk.hargaJual)
                            : "-"}
                        </div>
                      </div>
                    </div>

                    {selectedProduk && (
                      <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground">
                          Subtotal:{" "}
                          <span className="font-medium text-foreground">
                            {formatRupiah(getSubtotal(item))}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================= */}
        {/* KOLOM KANAN (SIDEBAR)   */}
        {/* ======================= */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
          {/* PELANGGAN */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold">Pelanggan</h2>
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Pilih Pelanggan</label>
              <Popover open={openPelanggan} onOpenChange={setOpenPelanggan}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPelanggan}
                    className="w-full justify-between font-normal cursor-pointer"
                  >
                    {pelangganID
                      ? (pelangganList.find(
                          (p: any) => (p._id || p.id) === pelangganID,
                        )?.namaPelanggan ?? "Pelanggan tidak ditemukan")
                      : "Pilih pelanggan..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Cari pelanggan..."
                      value={pelangganSearch}
                      onValueChange={setPelangganSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {filteredPelanggan.map((p: any, index: number) => {
                          const idPelanggan = p._id || p.id;
                          return (
                            <CommandItem
                              key={idPelanggan || `pelanggan-combo-${index}`}
                              value={idPelanggan || `value-${index}`}
                              onSelect={() => {
                                setPelangganID(idPelanggan);
                                setOpenPelanggan(false);
                                setPelangganSearch("");
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  pelangganID === idPelanggan
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span>{p.namaPelanggan}</span>
                              <span className="ml-auto text-xs text-muted-foreground capitalize">
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

          {/* RINGKASAN */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold">Ringkasan</h2>
            <div className="space-y-2 text-sm">
              {items.map((item, index) => {
                const produk = produkList.find((p) => p._id === item.produkID);
                if (!produk) return null;
                return (
                  <div
                    key={index}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>
                      {produk.namaProduk} × {item.jumlah}
                    </span>
                    <span>{formatRupiah(getSubtotal(item))}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Estimasi Total</span>
                <span>{formatRupiah(totalEstimasi)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Total final termasuk pajak dan diskon akan dihitung oleh sistem.
              </p>
            </div>
          </div>

          {/* KETERANGAN */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold">Informasi Tambahan</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Keterangan (Opsional)
              </label>
              <Input
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan tambahan"
              />
            </div>
          </div>
        </div>

        {/* ======================= */}
        {/* AKSI & ERROR MESSAGE    */}
        {/* ======================= */}
        <div className="lg:col-span-12 flex flex-col gap-3">
          {formError && (
            <p className="text-sm font-medium text-destructive">{formError}</p>
          )}
          <div className="flex items-center justify-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/penjualan")}
                disabled={createMutation.isPending}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="cursor-pointer"
              >
                {createMutation.isPending ? "Memproses..." : "Buat Penjualan"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* DIALOG KONFIRMASI (Tampil Setelah Validasi Form Berhasil) */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buat Transaksi Penjualan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin detail transaksi sudah benar? Data akan disimpan
              sebagai transaksi baru yang belum dibayar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={createMutation.isPending}
              className="cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCreate}
              disabled={createMutation.isPending}
              className="cursor-pointer"
            >
              {createMutation.isPending ? "Memproses..." : "Ya, Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
