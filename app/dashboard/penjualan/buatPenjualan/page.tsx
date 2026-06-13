// "use client";

// import { useState, useEffect, useCallback, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthGuard } from "@/app/hooks/useAuthGuard";
// import { apiClient } from "@/lib/apiClient";
// import { queryKeys } from "@/lib/queryKeys";
// import {
//   PenjualanRequest,
//   ItemPenjualanRequest,
//   GetPelangganResponse,
// } from "@/types/penjualan";
// import { GetProdukResponse } from "@/types/produk";
// import { useDebounce } from "@/hooks/use-debounce";
// import { formatRupiah } from "@/lib/format";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// import { cn } from "@/lib/utils";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   ArrowLeft,
//   Check,
//   ChevronsUpDown,
//   Plus,
//   Trash2,
//   CalendarIcon,
//   Clock3,
// } from "lucide-react";
// import { Calendar } from "@/components/ui/calendar";
// import { format } from "date-fns";
// import { id } from "date-fns/locale";

// // CATATAN: DISKON (DITUNDA)
// // Implementasi diskon item dan diskon global belum diimplementasi.
// // Saat siap, yang perlu dilakukan:
// //
// // 1. Fetch list diskon: GET /diskon (sudah ada di queryKeys.diskon)
// //    Cast response ke GetDiskonResponse dari types/penjualan.ts
// //
// // 2. Pisahkan diskon berdasarkan cakupan:
// //    - diskonItem   = diskonList.filter(d => d.cakupan === "Item"   && d.status === "Aktif")
// //    - diskonGlobal = diskonList.filter(d => d.cakupan === "Global" && d.status === "Aktif")
// //
// // 3. Di setiap baris item penjualan, tambahkan multi-select diskonItemIDs
// //    Field di ItemPenjualanRequest: diskonItemIDs?: string[]
// //
// // 4. Di section bawah form (sebelum submit), tambahkan multi-select diskonGlobalIDs
// //    Field di PenjualanRequest: diskonGlobalIDs?: string[]
// //
// // 5. Untuk multi-select, pertimbangkan pakai Command + Checkbox pattern
// //    (bukan Popover single-select seperti combobox biasa)

// // Item state internal — jumlahStr dipakai untuk controlled input string
// // agar tidak ada bug concatenation saat user mengetik
// interface ItemState extends ItemPenjualanRequest {
//   jumlahStr: string;
// }

// const emptyItem = (): ItemState => ({
//   produkID: "",
//   jumlah: 1,
//   jumlahStr: "1",
// });

// // Bangun datetime-local string dari Date (format: YYYY-MM-DDThh:mm)
// const toDatetimeLocal = (date: Date): string => {
//   const pad = (n: number) => String(n).padStart(2, "0");
//   return (
//     `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
//     `T${pad(date.getHours())}:${pad(date.getMinutes())}`
//   );
// };

// export default function BuatPenjualanPage() {
//   useAuthGuard();

//   const router = useRouter();
//   const queryClient = useQueryClient();

//   // FORM STATE
//   const [pelangganID, setPelangganID] = useState("");
//   const [jenisPenjualan, setJenisPenjualan] = useState<
//     "dine-in" | "takeaway" | "booking"
//   >("dine-in");

//   // Tanggal dan jam dipisah
//   const [tanggalInput, setTanggalInput] = useState<Date>(new Date());
//   const now = new Date();

//   const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));

//   const [minute, setMinute] = useState(
//     String(now.getMinutes()).padStart(2, "0"),
//   );

//   const [simpanDraft, setSimpanDraft] = useState(false);
//   const [keterangan, setKeterangan] = useState("");
//   const [items, setItems] = useState<ItemState[]>([emptyItem()]);
//   const [formError, setFormError] = useState("");

//   // Combobox state
//   const [openPelanggan, setOpenPelanggan] = useState(false);
//   const [pelangganSearch, setPelangganSearch] = useState("");
//   const [openProduk, setOpenProduk] = useState<number | null>(null);

//   // QUERY PELANGGAN
//   const { data: pelangganList = [], error: pelangganError } = useQuery({
//     queryKey: queryKeys.pelanggan,
//     queryFn: async () => {
//       const res = await apiClient.get<GetPelangganResponse>(
//         "/pelanggan",
//         undefined,
//         "pengguna",
//       );
//       return res.data;
//     },
//   });

//   // QUERY PRODUK
//   const { data: produkList = [], error: produkError } = useQuery({
//     queryKey: queryKeys.produk,
//     queryFn: async () => {
//       const res = await apiClient.get<GetProdukResponse>(
//         "/produk",
//         undefined,
//         "pengguna",
//       );
//       return res.data;
//     },
//   });

//   // ERROR TOASTS
//   useEffect(() => {
//     if (pelangganError) {
//       toast.error("Gagal", {
//         description:
//           pelangganError instanceof Error
//             ? pelangganError.message
//             : "Gagal memuat daftar pelanggan.",
//       });
//     }
//     if (produkError) {
//       toast.error("Gagal", {
//         description:
//           produkError instanceof Error
//             ? produkError.message
//             : "Gagal memuat daftar produk.",
//       });
//     }
//   }, [pelangganError, produkError]);

//   // DEBOUNCE SEARCH PELANGGAN
//   const debouncedPelangganSearch = useDebounce(pelangganSearch, 300);

//   const filteredPelanggan = useMemo(() => {
//     if (!debouncedPelangganSearch) return pelangganList;
//     const q = debouncedPelangganSearch.toLowerCase();
//     return pelangganList.filter((p) =>
//       p.namaPelanggan.toLowerCase().includes(q),
//     );
//   }, [pelangganList, debouncedPelangganSearch]);

//   // HELPERS ITEM
//   const addItem = () => {
//     setItems((prev) => [...prev, emptyItem()]);
//   };

//   const removeItem = (index: number) => {
//     setItems((prev) => prev.filter((_, i) => i !== index));
//   };

//   // Saat user pilih produk di combobox:
//   // - Jika produk sudah ada di item lain → hapus item ini, tambah jumlah item existing
//   // - Jika belum ada → set produkID di item ini
//   const handlePilihProduk = useCallback((index: number, produkID: string) => {
//     setItems((prev) => {
//       const existingIndex = prev.findIndex(
//         (item, i) => i !== index && item.produkID === produkID,
//       );

//       if (existingIndex !== -1) {
//         // Produk sudah ada di item lain — merge jumlah, hapus item ini
//         return prev
//           .map((item, i) => {
//             if (i !== existingIndex) return item;
//             const newJumlah = item.jumlah + prev[index].jumlah;
//             return {
//               ...item,
//               jumlah: newJumlah,
//               jumlahStr: String(newJumlah),
//             };
//           })
//           .filter((_, i) => i !== index);
//       }

//       // Produk belum ada — set di item ini
//       return prev.map((item, i) =>
//         i === index ? { ...item, produkID } : item,
//       );
//     });
//     setOpenProduk(null);
//   }, []);

//   // Update jumlah via string — parse saat blur
//   const handleJumlahChange = (index: number, raw: string) => {
//     setItems((prev) =>
//       prev.map((item, i) => (i === index ? { ...item, jumlahStr: raw } : item)),
//     );
//   };

//   const handleJumlahBlur = (index: number) => {
//     setItems((prev) =>
//       prev.map((item, i) => {
//         if (i !== index) return item;
//         const parsed = parseInt(item.jumlahStr, 10);
//         const jumlah = isNaN(parsed) || parsed < 1 ? 1 : parsed;
//         return { ...item, jumlah, jumlahStr: String(jumlah) };
//       }),
//     );
//   };

//   const getProdukNama = (produkID: string) => {
//     return produkList.find((p) => p._id === produkID)?.namaProduk ?? "";
//   };

//   const getSubtotal = (item: ItemState) => {
//     const produk = produkList.find((p) => p._id === item.produkID);
//     if (!produk) return 0;
//     return produk.hargaJual * item.jumlah;
//   };

//   const totalEstimasi = useMemo(
//     () => items.reduce((acc, item) => acc + getSubtotal(item), 0),
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [items, produkList],
//   );

//   // MUTATION CREATE
//   const createMutation = useMutation({
//     mutationFn: async (payload: PenjualanRequest) => {
//       return await apiClient.post("/penjualan", payload, undefined, "pengguna");
//     },
//     onSuccess: () => {
//       toast.success("Berhasil", {
//         description: simpanDraft
//           ? "Penjualan berhasil disimpan sebagai draft."
//           : "Penjualan berhasil dibuat.",
//       });
//       queryClient.invalidateQueries({ queryKey: queryKeys.penjualan });
//       router.push("/dashboard/penjualan");
//     },
//     onError: (err: any) => {
//       setFormError(err.message || "Gagal membuat penjualan.");
//     },
//   });

//   // SUBMIT
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setFormError("");

//     if (!pelangganID) {
//       setFormError("Silakan pilih pelanggan terlebih dahulu.");
//       return;
//     }

//     if (!tanggalInput) {
//       setFormError("Tanggal transaksi wajib diisi.");
//       return;
//     }

//     const invalidItem = items.find((item) => !item.produkID);
//     if (invalidItem) {
//       setFormError("Semua item harus memiliki produk yang dipilih.");
//       return;
//     }

//     const invalidJumlah = items.find((item) => item.jumlah < 1);
//     if (invalidJumlah) {
//       setFormError("Jumlah item minimal 1.");
//       return;
//     }

//     const tanggalTransaksi = new Date(tanggalInput);

//     tanggalTransaksi.setHours(Number(hour));
//     tanggalTransaksi.setMinutes(Number(minute));
//     tanggalTransaksi.setSeconds(0);

//     const tanggalISO = tanggalTransaksi.toISOString();

//     const payload: PenjualanRequest = {
//       pelangganID,
//       jenisTransaksi: "INVOICE",
//       jenisPenjualan,
//       tanggalTransaksi: tanggalISO,
//       itemPenjualan: items.map(({ produkID, jumlah }) => ({
//         produkID,
//         jumlah,
//       })),
//       keterangan: keterangan || undefined,
//       simpanDraft,
//     };

//     await createMutation.mutateAsync(payload);
//   };

//   // RENDER
//   return (
//     <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
//       {/* Header */}
//       <div className="flex flex-col gap-4">
//         <Button
//           variant="ghost"
//           size="sm"
//           className="w-fit cursor-pointer px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
//           onClick={() => router.push("/dashboard/penjualan")}
//         >
//           <ArrowLeft className="mr-2 h-4 w-4" />
//           Kembali ke Daftar Penjualan
//         </Button>
//         <div className="space-y-1">
//           <h1 className="text-2xl font-bold tracking-tight">Buat Penjualan</h1>
//           <p className="text-sm text-muted-foreground">
//             Isi detail transaksi untuk membuat invoice penjualan baru.
//           </p>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-5">
//         {/* SECTION 1: INFO TRANSAKSI */}
//         <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
//           <h2 className="text-sm font-semibold">Informasi Transaksi</h2>

//           {/* Jenis Penjualan */}
//           <div className="space-y-2">
//             <label className="text-sm font-medium">Jenis Penjualan</label>
//             <Select
//               value={jenisPenjualan}
//               onValueChange={(val) =>
//                 setJenisPenjualan(val as "dine-in" | "takeaway" | "booking")
//               }
//             >
//               <SelectTrigger className="w-full h-12 cursor-pointer font-semibold">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem
//                   value="dine-in"
//                   className="cursor-pointer py-3 font-medium"
//                 >
//                   Dine-in
//                 </SelectItem>
//                 <SelectItem
//                   value="takeaway"
//                   className="cursor-pointer py-3 font-medium"
//                 >
//                   Takeaway
//                 </SelectItem>
//                 <SelectItem
//                   value="booking"
//                   className="cursor-pointer py-3 font-medium"
//                 >
//                   Booking
//                 </SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Tanggal & Jam — dua field terpisah */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Tanggal Transaksi</label>

//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     className="w-full h-12 justify-start text-left font-medium"
//                   >
//                     <CalendarIcon className="mr-2 h-4 w-4" />

//                     {format(tanggalInput, "dd MMMM yyyy", { locale: id })}
//                   </Button>
//                 </PopoverTrigger>

//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     selected={tanggalInput}
//                     onSelect={(date) => {
//                       if (date) setTanggalInput(date);
//                     }}
//                     captionLayout="dropdown"
//                     startMonth={new Date(2010, 0)}
//                     endMonth={new Date(new Date().getFullYear() + 1, 11)}
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Jam Transaksi</label>

//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     className="w-full h-12 justify-start font-medium cursor-pointer"
//                   >
//                     <Clock3 className="mr-2 h-4 w-4" />
//                     {hour}:{minute}
//                   </Button>
//                 </PopoverTrigger>

//                 <PopoverContent className="w-55" align="start">
//                   <div className="grid grid-cols-2 gap-2">
//                     <Select value={hour} onValueChange={setHour}>
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {Array.from({ length: 24 }, (_, i) => {
//                           const val = String(i).padStart(2, "0");

//                           return (
//                             <SelectItem key={val} value={val}>
//                               {val}
//                             </SelectItem>
//                           );
//                         })}
//                       </SelectContent>
//                     </Select>

//                     <Select value={minute} onValueChange={setMinute}>
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {Array.from({ length: 60 }, (_, i) => {
//                           const val = String(i).padStart(2, "0");

//                           return (
//                             <SelectItem key={val} value={val}>
//                               {val}
//                             </SelectItem>
//                           );
//                         })}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </div>
//         </div>

//         {/* SECTION 2: PELANGGAN      */}
//         <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
//           <h2 className="text-sm font-semibold">Pelanggan</h2>
//           <div className="space-y-2 flex flex-col">
//             <label className="text-sm font-medium">Pilih Pelanggan</label>
//             <Popover open={openPelanggan} onOpenChange={setOpenPelanggan}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   role="combobox"
//                   aria-expanded={openPelanggan}
//                   className="w-full justify-between font-normal cursor-pointer"
//                 >
//                   {pelangganID
//                     ? (pelangganList.find((p) => p._id === pelangganID)
//                         ?.namaPelanggan ?? "Pelanggan tidak ditemukan")
//                     : "Pilih pelanggan..."}
//                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent
//                 className="w-[--radix-popover-trigger-width] p-0"
//                 align="start"
//               >
//                 <Command shouldFilter={false}>
//                   <CommandInput
//                     placeholder="Cari pelanggan..."
//                     value={pelangganSearch}
//                     onValueChange={setPelangganSearch}
//                   />
//                   <CommandList>
//                     <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
//                     <CommandGroup>
//                       {filteredPelanggan.map((p) => (
//                         <CommandItem
//                           key={p._id}
//                           value={p._id}
//                           onSelect={() => {
//                             setPelangganID(p._id);
//                             setOpenPelanggan(false);
//                             setPelangganSearch("");
//                           }}
//                           className="cursor-pointer"
//                         >
//                           <Check
//                             className={cn(
//                               "mr-2 h-4 w-4",
//                               pelangganID === p._id
//                                 ? "opacity-100"
//                                 : "opacity-0",
//                             )}
//                           />
//                           <span>{p.namaPelanggan}</span>
//                           <span className="ml-auto text-xs text-muted-foreground capitalize">
//                             {p.tipePelanggan}
//                           </span>
//                         </CommandItem>
//                       ))}
//                     </CommandGroup>
//                   </CommandList>
//                 </Command>
//               </PopoverContent>
//             </Popover>
//           </div>
//         </div>

//         {/* SECTION 3: ITEM PENJUALAN */}
//         <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
//           <div className="flex items-center justify-between">
//             <h2 className="text-sm font-semibold">Item Penjualan</h2>
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={addItem}
//               className="cursor-pointer"
//             >
//               <Plus className="mr-1 h-3 w-3" />
//               Tambah Item
//             </Button>
//           </div>

//           <div className="flex flex-col gap-4">
//             {items.map((item, index) => {
//               const selectedProduk = produkList.find(
//                 (p) => p._id === item.produkID,
//               );

//               return (
//                 <div
//                   key={index}
//                   className="rounded-lg border p-4 space-y-3 bg-muted/30"
//                 >
//                   <div className="flex items-center justify-between">
//                     <span className="text-xs font-medium text-muted-foreground">
//                       Item #{index + 1}
//                     </span>
//                     {items.length > 1 && (
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="icon"
//                         className="h-7 w-7 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
//                         onClick={() => removeItem(index)}
//                       >
//                         <Trash2 className="h-3.5 w-3.5" />
//                       </Button>
//                     )}
//                   </div>

//                   {/* Pilih Produk */}
//                   <div className="space-y-1.5 flex flex-col">
//                     <label className="text-xs font-medium">Produk</label>
//                     <Popover
//                       open={openProduk === index}
//                       onOpenChange={(open) =>
//                         setOpenProduk(open ? index : null)
//                       }
//                     >
//                       <PopoverTrigger asChild>
//                         <Button
//                           variant="outline"
//                           role="combobox"
//                           className="w-full justify-between font-normal cursor-pointer bg-background"
//                         >
//                           {item.produkID
//                             ? getProdukNama(item.produkID)
//                             : "Pilih produk..."}
//                           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent
//                         className="w-[--radix-popover-trigger-width] p-0"
//                         align="start"
//                       >
//                         <Command>
//                           <CommandInput placeholder="Cari produk..." />
//                           <CommandList>
//                             <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
//                             <CommandGroup>
//                               {produkList.map((p) => {
//                                 const sudahDipilih =
//                                   item.produkID !== p._id &&
//                                   items.some(
//                                     (it, i) =>
//                                       i !== index && it.produkID === p._id,
//                                   );
//                                 return (
//                                   <CommandItem
//                                     key={p._id}
//                                     value={p.namaProduk}
//                                     onSelect={() =>
//                                       handlePilihProduk(index, p._id)
//                                     }
//                                     className="cursor-pointer"
//                                   >
//                                     <Check
//                                       className={cn(
//                                         "mr-2 h-4 w-4",
//                                         item.produkID === p._id
//                                           ? "opacity-100"
//                                           : "opacity-0",
//                                       )}
//                                     />
//                                     <span className="flex-1">
//                                       {p.namaProduk}
//                                     </span>
//                                     {sudahDipilih && (
//                                       <span className="ml-2 text-xs text-muted-foreground">
//                                         +jumlah
//                                       </span>
//                                     )}
//                                     <span className="ml-2 text-xs text-muted-foreground">
//                                       {formatRupiah(p.hargaJual)}
//                                     </span>
//                                   </CommandItem>
//                                 );
//                               })}
//                             </CommandGroup>
//                           </CommandList>
//                         </Command>
//                       </PopoverContent>
//                     </Popover>
//                   </div>

//                   {/* Jumlah & Harga Satuan */}
//                   <div className="grid grid-cols-2 gap-3">
//                     <div className="space-y-1.5">
//                       <label className="text-xs font-medium">Jumlah</label>
//                       <Input
//                         type="number"
//                         className="no-spinner bg-background"
//                         min={1}
//                         value={item.jumlahStr}
//                         onChange={(e) =>
//                           handleJumlahChange(index, e.target.value)
//                         }
//                         onBlur={() => handleJumlahBlur(index)}
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <label className="text-xs font-medium">
//                         Harga Satuan
//                       </label>
//                       <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
//                         {selectedProduk
//                           ? formatRupiah(selectedProduk.hargaJual)
//                           : "-"}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Subtotal per item */}
//                   {selectedProduk && (
//                     <div className="flex justify-end">
//                       <span className="text-xs text-muted-foreground">
//                         Subtotal:{" "}
//                         <span className="font-medium text-foreground">
//                           {formatRupiah(getSubtotal(item))}
//                         </span>
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* SECTION 4: KETERANGAN     */}
//         <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
//           <h2 className="text-sm font-semibold">Informasi Tambahan</h2>
//           <div className="space-y-2">
//             <label className="text-sm font-medium">Keterangan (Opsional)</label>
//             <Input
//               value={keterangan}
//               onChange={(e) => setKeterangan(e.target.value)}
//               placeholder="Catatan tambahan untuk transaksi ini"
//             />
//           </div>
//         </div>

//         {/* SECTION 5: RINGKASAN      */}
//         <div className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
//           <h2 className="text-sm font-semibold">Ringkasan</h2>
//           <div className="space-y-2 text-sm">
//             {items.map((item, index) => {
//               const produk = produkList.find((p) => p._id === item.produkID);
//               if (!produk) return null;
//               return (
//                 <div
//                   key={index}
//                   className="flex justify-between text-muted-foreground"
//                 >
//                   <span>
//                     {produk.namaProduk} × {item.jumlah}
//                   </span>
//                   <span>{formatRupiah(getSubtotal(item))}</span>
//                 </div>
//               );
//             })}
//             <div className="border-t pt-2 flex justify-between font-medium">
//               <span>Estimasi Total</span>
//               <span>{formatRupiah(totalEstimasi)}</span>
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Total final termasuk pajak dan diskon akan dihitung oleh sistem
//               setelah penjualan disimpan.
//             </p>
//           </div>
//         </div>

//         {/* Error */}
//         {formError && (
//           <p className="text-sm font-medium text-destructive">{formError}</p>
//         )}

//         {/* Aksi */}
//         <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
//           <label className="flex items-center gap-2 cursor-pointer select-none">
//             <input
//               type="checkbox"
//               checked={simpanDraft}
//               onChange={(e) => setSimpanDraft(e.target.checked)}
//               className="h-4 w-4 rounded border-gray-300 cursor-pointer"
//             />
//             <span className="text-sm font-medium">Simpan sebagai Draft</span>
//           </label>
//           <div className="flex gap-3">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => router.push("/dashboard/penjualan")}
//               disabled={createMutation.isPending}
//               className="cursor-pointer"
//             >
//               Batal
//             </Button>
//             <Button
//               type="submit"
//               disabled={createMutation.isPending}
//               className="cursor-pointer"
//             >
//               {createMutation.isPending
//                 ? "Menyimpan..."
//                 : simpanDraft
//                   ? "Simpan Draft"
//                   : "Buat Penjualan"}
//             </Button>
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
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
import { decodeJWT } from "@/lib/decodeToken";

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
import { id } from "date-fns/locale";

// Item state internal
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

  const token = typeof window !== "undefined" ? sessionStorage.getItem("penggunaToken") : null;
  const payloadToken = token ? decodeJWT(token) : null;
  const currentUserId = payloadToken?._id || payloadToken?.id || "";

  // FORM STATE
  const [pelangganID, setPelangganID] = useState("");
  const [jenisPenjualan, setJenisPenjualan] = useState<
    "dine-in" | "takeaway" | "booking"
  >("dine-in");

  // Tanggal dan jam dipisah
  const [tanggalInput, setTanggalInput] = useState<Date>(new Date());
  const now = new Date();

  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState(
    String(now.getMinutes()).padStart(2, "0"),
  );

  const [simpanDraft, setSimpanDraft] = useState(false);
  const [keterangan, setKeterangan] = useState("");
  const [items, setItems] = useState<ItemState[]>([emptyItem()]);
  const [formError, setFormError] = useState("");

  // Combobox state
  const [openPelanggan, setOpenPelanggan] = useState(false);
  const [pelangganSearch, setPelangganSearch] = useState("");
  const [openProduk, setOpenProduk] = useState<number | null>(null);

  // QUERY PELANGGAN
  const { data: pelangganList = [], error: pelangganError } = useQuery({
    queryKey: queryKeys.pelanggan,
    queryFn: async () => {
      const res = await apiClient.get<GetPelangganResponse>(
        "/pelanggan",
        undefined,
        "pengguna",
      );
      return res.data;
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
      toast.error("Gagal", {
        description:
          pelangganError instanceof Error
            ? pelangganError.message
            : "Gagal memuat daftar pelanggan.",
      });
    }
    if (produkError) {
      toast.error("Gagal", {
        description:
          produkError instanceof Error
            ? produkError.message
            : "Gagal memuat daftar produk.",
      });
    }
  }, [pelangganError, produkError]);

  // DEBOUNCE SEARCH PELANGGAN
  const debouncedPelangganSearch = useDebounce(pelangganSearch, 300);

  const filteredPelanggan = useMemo(() => {
    if (!debouncedPelangganSearch) return pelangganList;
    const q = debouncedPelangganSearch.toLowerCase();
    return pelangganList.filter((p) =>
      p.namaPelanggan.toLowerCase().includes(q),
    );
  }, [pelangganList, debouncedPelangganSearch]);

  // HELPERS ITEM
  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

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
            return {
              ...item,
              jumlah: newJumlah,
              jumlahStr: String(newJumlah),
            };
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

  const getProdukNama = (produkID: string) => {
    return produkList.find((p) => p._id === produkID)?.namaProduk ?? "";
  };

  const getSubtotal = (item: ItemState) => {
    const produk = produkList.find((p) => p._id === item.produkID);
    if (!produk) return 0;
    return produk.hargaJual * item.jumlah;
  };

  const totalEstimasi = useMemo(
    () => items.reduce((acc, item) => acc + getSubtotal(item), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setFormError(err.message || "Gagal membuat penjualan.");
    },
  });

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!pelangganID) {
      setFormError("Silakan pilih pelanggan terlebih dahulu.");
      return;
    }

    if (!tanggalInput) {
      setFormError("Tanggal transaksi wajib diisi.");
      return;
    }

    const invalidItem = items.find((item) => !item.produkID);
    if (invalidItem) {
      setFormError("Semua item harus memiliki produk yang dipilih.");
      return;
    }

    const invalidJumlah = items.find((item) => item.jumlah < 1);
    if (invalidJumlah) {
      setFormError("Jumlah item minimal 1.");
      return;
    }

    const tanggalTransaksi = new Date(tanggalInput);

    tanggalTransaksi.setHours(Number(hour));
    tanggalTransaksi.setMinutes(Number(minute));
    tanggalTransaksi.setSeconds(0);

    const tanggalISO = tanggalTransaksi.toISOString();

    const payload: PenjualanRequest = {
      penggunaID: currentUserId,
      pelangganID,
      jenisTransaksi: "INVOICE",
      jenisPenjualan,
      tanggalTransaksi: tanggalISO,
      itemPenjualan: items.map(({ produkID, jumlah }) => ({
        produkID,
        jumlah,
      })),
      keterangan: keterangan || undefined,
      simpanDraft,
    };

    await createMutation.mutateAsync(payload);
  };

  // RENDER
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
            Isi detail transaksi untuk membuat invoice penjualan baru.
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
          {/* SECTION 1: INFO TRANSAKSI */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold">Informasi Transaksi</h2>

            {/* Jenis Penjualan */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Penjualan</label>
              <Select
                value={jenisPenjualan}
                onValueChange={(val) =>
                  setJenisPenjualan(val as "dine-in" | "takeaway" | "booking")
                }
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

            {/* Tanggal & Jam */}
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
                      {format(tanggalInput, "dd MMMM yyyy", { locale: id })}
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
                <div className="flex h-12 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring">
                  <Clock3 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className="w-10 bg-transparent text-center font-medium outline-none placeholder:text-muted-foreground"
                    placeholder="00"
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
                    className="w-10 bg-transparent text-center font-medium outline-none placeholder:text-muted-foreground"
                    placeholder="00"
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

          {/* SECTION 2: ITEM PENJUALAN */}
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
                <Plus className="mr-1 h-3 w-3" />
                Tambah Item
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
                          className="h-7 w-7 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Pilih Produk */}
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

                    {/* Jumlah & Harga Satuan */}
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

                    {/* Subtotal per item */}
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
          {/* SECTION 3: PELANGGAN */}
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
                          (p) => (p._id || (p as any).id) === pelangganID,
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
                        {filteredPelanggan.map((p, index) => (
                          <CommandItem
                            key={
                              p._id ||
                              (p as any).id ||
                              `pelanggan-combo-${index}`
                            }
                            value={p._id || (p as any).id || `value-${index}`}
                            onSelect={() => {
                              setPelangganID(p._id || (p as any).id);
                              setOpenPelanggan(false);
                              setPelangganSearch("");
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                pelangganID === (p._id || (p as any).id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span>{p.namaPelanggan}</span>
                            <span className="ml-auto text-xs text-muted-foreground capitalize">
                              {p.tipePelanggan}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* SECTION 4: RINGKASAN */}
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
                Total final termasuk pajak dan diskon akan dihitung oleh sistem
                setelah penjualan disimpan.
              </p>
            </div>
          </div>

          {/* SECTION 5: KETERANGAN */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold">Informasi Tambahan</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Keterangan (Opsional)
              </label>
              <Input
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan tambahan untuk transaksi ini"
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

          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={simpanDraft}
                onChange={(e) => setSimpanDraft(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-sm font-medium">Simpan sebagai Draft</span>
            </label>
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
                {createMutation.isPending
                  ? "Menyimpan..."
                  : simpanDraft
                    ? "Simpan Draft"
                    : "Buat Penjualan"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
