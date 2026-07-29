"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";

import {
  Pajak,
  PajakRequest,
  GetPajakResponse,
  PajakResponse,
  GetPajakByProdukResponse,
  ProdukPajakRequest,
} from "@/types/pajak";

import { GetProdukResponse } from "@/types/produk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ArrowUpDown, MoreHorizontal, Plus, ArrowLeft } from "lucide-react"; // Import ArrowLeft

type TabType = "pajak" | "relasi";

const MODEL_LABEL: Record<number, string> = {
  1: "Inklusif",
  2: "Add-on (Eksklusif)",
  3: "Compound",
};

const emptyForm: PajakRequest = {
  namaPajak: "",
  tarifPajak: 0,
  tipePajak: true,
  modelPerhitungan: 2,
  prioritas: 1,
  statusPajak: true,
};

export default function PajakPage() {
  const router = useRouter(); // Inisialisasi router
  const [tab, setTab] = useState<TabType>("pajak");
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Pajak | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pajak | null>(null);
  const [form, setForm] = useState<PajakRequest>(emptyForm);
  const [tarifPajakInput, setTarifPajakInput] = useState("");
  const [prioritasInput, setPrioritasInput] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedProduk, setSelectedProduk] = useState("");
  const [selectedPajakRelasi, setSelectedPajakRelasi] = useState("");

  const queryClient = useQueryClient();

  // QUERY PAJAK
  const {
    data: pajakData = [],
    isLoading: pajakLoading,
    error: pajakError,
  } = useQuery({
    queryKey: queryKeys.pajak,
    queryFn: async () => {
      const res = await apiClient.get<GetPajakResponse>("/pajak", undefined, "pengguna");
      return res.data;
    },
  });

  // QUERY PRODUK
  const { data: produkList = [], error: produkError } = useQuery({
    queryKey: queryKeys.produk,
    queryFn: async () => {
      const res = await apiClient.get<GetProdukResponse>("/produk", undefined, "pengguna");
      return res.data;
    },
  });

  // QUERY RELASI
  const {
    data: relasiList = [],
    isLoading: relasiLoading,
    error: relasiError,
  } = useQuery({
    queryKey: queryKeys.produkPajak(selectedProduk),
    enabled: !!selectedProduk,
    queryFn: async () => {
      const res = await apiClient.get<GetPajakByProdukResponse>(`/produkpajak/${selectedProduk}`, undefined, "pengguna");
      return res.data;
    },
  });

  // ERROR TOASTS
  useEffect(() => {
    if (pajakError) toast.error("Gagal", { description: pajakError instanceof Error ? pajakError.message : "Gagal memuat data pajak." });
  }, [pajakError]);

  useEffect(() => {
    if (relasiError) toast.error("Gagal", { description: relasiError instanceof Error ? relasiError.message : "Gagal memuat relasi pajak." });
  }, [relasiError]);

  useEffect(() => {
    if (produkError) toast.error("Gagal", { description: produkError instanceof Error ? produkError.message : "Gagal memuat data produk." });
  }, [produkError]);

  // MUTATIONS (SAVE, DELETE, ASSIGN, UNASSIGN)
  const savePajakMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: PajakRequest }) => {
      if (id) return await apiClient.put<PajakResponse>(`/pajak/${id}`, data, undefined, "pengguna");
      return await apiClient.post<PajakResponse>("/pajak", data, undefined, "pengguna");
    },
    onSuccess: (_, variables) => {
      toast.success("Berhasil", { description: variables.id ? "Pajak berhasil diperbarui." : "Pajak berhasil ditambahkan." });
      queryClient.invalidateQueries({ queryKey: queryKeys.pajak });
      setShowDialog(false);
    },
    onError: (err: any) => setFormError(err.message || "Gagal menyimpan data."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/pajak/${id}`, undefined, "pengguna"),
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pajak berhasil dihapus." });
      queryClient.invalidateQueries({ queryKey: queryKeys.pajak });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message || "Gagal menghapus pajak." }),
  });

  const assignMutation = useMutation({
    mutationFn: async (payload: ProdukPajakRequest) => await apiClient.post("/produkpajak", payload, undefined, "pengguna"),
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pajak berhasil ditambahkan ke produk." });
      queryClient.invalidateQueries({ queryKey: queryKeys.produkPajak(selectedProduk) });
      setSelectedPajakRelasi("");
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message || "Gagal assign pajak." }),
  });

  const unassignMutation = useMutation({
    mutationFn: async (relasiID: string) => await apiClient.delete(`/produkpajak/${relasiID}`, undefined, "pengguna"),
    onSuccess: () => {
      toast.success("Berhasil", { description: "Relasi pajak berhasil dilepas." });
      queryClient.invalidateQueries({ queryKey: queryKeys.produkPajak(selectedProduk) });
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message || "Gagal menghapus relasi." }),
  });

  // HANDLERS
  const openCreate = () => {
    setEditTarget(null); setForm(emptyForm); setTarifPajakInput(""); setPrioritasInput(""); setFormError(""); setShowDialog(true);
  };

  const openEdit = (item: Pajak) => {
    setEditTarget(item);
    setForm({ namaPajak: item.namaPajak, tarifPajak: item.tarifPajak, tipePajak: item.tipePajak, modelPerhitungan: item.modelPerhitungan, prioritas: item.prioritas, statusPajak: item.statusPajak });
    setTarifPajakInput(String(item.tarifPajak)); setPrioritasInput(String(item.prioritas)); setFormError(""); setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    await savePajakMutation.mutateAsync({ id: editTarget?._id, data: form });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
  };

  const handleAssign = async () => {
    if (!selectedProduk || !selectedPajakRelasi) return;
    await assignMutation.mutateAsync({ produkID: selectedProduk, pajakID: selectedPajakRelasi });
  };

  // DERIVED
  const pajakPerProduk = pajakData.filter((p) => p.tipePajak === true);
  const assignedPajakIDs = relasiList.map((r) => r.pajak._id);
  const availablePajakToAssign = pajakPerProduk.filter((p) => !assignedPajakIDs.includes(p._id));

  // TABLE COLUMNS DENGAN WARNA TETRADIC
  const columns: ColumnDef<Pajak>[] = [
    {
      accessorKey: "namaPajak",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947]"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Pajak
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-bold text-[#0A2947]">{row.original.namaPajak}</span>,
    },
    {
      accessorKey: "tarifPajak",
      header: () => <span className="text-xs font-bold text-[#0A2947]/60">Tarif</span>,
      cell: ({ row }) => <span className="font-semibold text-[#0A2947]">{row.original.tarifPajak}%</span>,
    },
    {
      accessorKey: "modelPerhitungan",
      header: () => <span className="text-xs font-bold text-[#0A2947]/60">Model</span>,
      cell: ({ row }) => <span className="font-medium text-[#0A2947]/80">{MODEL_LABEL[row.original.modelPerhitungan]}</span>,
    },
    {
      accessorKey: "prioritas",
      header: () => <span className="text-xs font-bold text-[#0A2947]/60">Prioritas</span>,
      cell: ({ row }) => <span className="font-medium text-[#0A2947]/80">{row.original.prioritas}</span>,
    },
    {
      accessorKey: "statusPajak",
      header: () => <span className="text-xs font-bold text-[#0A2947]/60">Status</span>,
      cell: ({ row }) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${row.original.statusPajak ? "bg-[#718355] text-[#FFFAF3]" : "bg-[#0A2947]/10 text-[#0A2947]/60"}`}>
          {row.original.statusPajak ? "Aktif" : "Non-Aktif"}
        </span>
      ),
    },
    {
      id: "aksi",
      header: () => <div className="text-right text-xs font-bold text-[#0A2947]/60">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#FFFAF3] border-[#0A2947]/10">
              <DropdownMenuItem className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5" onClick={() => openEdit(row.original)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#0A2947]/10" />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10" onClick={() => setDeleteTarget(row.original)}>
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      
      {/* HEADER DENGAN TOMBOL BACK */}
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold"
          onClick={() => router.push("/dashboard/outlet/pengaturan")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Laman Pengaturan
        </Button>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Pengaturan Pajak
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Kelola pajak dan relasi produk.
            </p>
          </div>

          {tab === "pajak" && (
            <Button onClick={openCreate} className="cursor-pointer font-bold bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pajak
            </Button>
          )}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)} className="flex w-full flex-col">
        <TabsList className="mb-6 flex h-auto w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger
            value="pajak"
            className="cursor-pointer rounded-none border-0 border-b-2 border-transparent bg-transparent px-5 py-2 text-sm font-semibold text-[#0A2947]/50 hover:text-[#0A2947] data-[state=active]:border-b-[#0A2947] data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-[#0A2947] data-[state=active]:shadow-none"
          >
            Daftar Pajak
          </TabsTrigger>
          <TabsTrigger
            value="relasi"
            className="cursor-pointer rounded-none border-0 border-b-2 border-transparent bg-transparent px-5 py-2 text-sm font-semibold text-[#0A2947]/50 hover:text-[#0A2947] data-[state=active]:border-b-[#0A2947] data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-[#0A2947] data-[state=active]:shadow-none"
          >
            Pajak per Produk
          </TabsTrigger>
        </TabsList>

        {/* TAB PAJAK (DIBUNGKUS CARD CREAM GELAP) */}
        <TabsContent value="pajak">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4">
            <DataTable
              columns={columns}
              data={pajakData}
              loading={pajakLoading}
              emptyMessage="Belum ada pajak."
              searchKey="namaPajak"
              searchPlaceholder="Cari nama pajak..."
            />
          </div>
        </TabsContent>

        {/* TAB RELASI (DIBUNGKUS CARD CREAM GELAP) */}
        <TabsContent value="relasi">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Pilih Produk</label>
              <Select value={selectedProduk} onValueChange={(value) => { setSelectedProduk(value); setSelectedPajakRelasi(""); }}>
                <SelectTrigger className="border-[#0A2947]/20 bg-[#FFFAF3] text-[#0A2947]">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  {produkList.map((produk) => (
                    <SelectItem key={produk._id} value={produk._id} className="cursor-pointer hover:bg-[#0A2947]/5">
                      {produk.namaProduk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduk && (
              <div className="space-y-2 pt-2">
                <label className="text-sm font-bold text-[#0A2947]">Assign Pajak</label>
                <div className="flex gap-3">
                  <Select value={selectedPajakRelasi} onValueChange={setSelectedPajakRelasi}>
                    <SelectTrigger className="border-[#0A2947]/20 bg-[#FFFAF3] text-[#0A2947] flex-1">
                      <SelectValue placeholder="Pilih pajak" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                      {availablePajakToAssign.map((pajak) => (
                        <SelectItem key={pajak._id} value={pajak._id} className="cursor-pointer hover:bg-[#0A2947]/5">
                          {pajak.namaPajak} ({pajak.tarifPajak}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssign}
                    disabled={assignMutation.isPending || !selectedPajakRelasi}
                    className="cursor-pointer bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 shadow-sm font-bold shrink-0"
                  >
                    {assignMutation.isPending ? "Menyimpan..." : "Assign"}
                  </Button>
                </div>
              </div>
            )}

            {/* TABEL RELASI DI DALAM CARD CREAM TERANG */}
            {selectedProduk && (
              <div className="rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] overflow-hidden mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#0A2947]/10 hover:bg-transparent">
                      <TableHead className="font-bold text-[#0A2947]/60">Nama Pajak</TableHead>
                      <TableHead className="font-bold text-[#0A2947]/60">Tarif</TableHead>
                      <TableHead className="font-bold text-[#0A2947]/60">Model</TableHead>
                      <TableHead className="font-bold text-[#0A2947]/60">Status</TableHead>
                      <TableHead className="text-right font-bold text-[#0A2947]/60">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relasiLoading ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="text-center text-[#0A2947]/60 font-medium py-6">Memuat...</TableCell>
                      </TableRow>
                    ) : relasiList.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="text-center text-[#0A2947]/60 font-medium py-6">Belum ada relasi pajak untuk produk ini.</TableCell>
                      </TableRow>
                    ) : (
                      relasiList.map((r) => (
                        <TableRow key={r._id} className="border-b border-[#0A2947]/5 hover:bg-[#0A2947]/5 transition-colors">
                          <TableCell className="font-bold text-[#0A2947]">{r.pajak.namaPajak}</TableCell>
                          <TableCell className="font-semibold text-[#0A2947]">{r.pajak.tarifPajak}%</TableCell>
                          <TableCell className="font-medium text-[#0A2947]/80">{MODEL_LABEL[r.pajak.modelPerhitungan]}</TableCell>
                          <TableCell>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${r.pajak.statusPajak ? "bg-[#718355] text-[#FFFAF3]" : "bg-[#0A2947]/10 text-[#0A2947]/60"}`}>
                              {r.pajak.statusPajak ? "Aktif" : "Non-Aktif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => unassignMutation.mutate(r._id)} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-500/10 font-bold">
                              Lepas
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* FORM DIALOG */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg bg-[#FFFAF3] border-[#0A2947]/10">
          <DialogHeader>
            <DialogTitle className="text-[#0A2947]">{editTarget ? "Edit Pajak" : "Tambah Pajak"}</DialogTitle>
            <DialogDescription className="text-[#0A2947]/60 font-medium">Kelola data pajak sistem.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Nama Pajak</label>
              <Input className="bg-white border-[#0A2947]/20 text-[#0A2947]" value={form.namaPajak} onChange={(e) => setForm({ ...form, namaPajak: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Tarif (%)</label>
                <Input type="number" className="no-spinner bg-white border-[#0A2947]/20 text-[#0A2947]" min={0} max={100} value={tarifPajakInput} onChange={(e) => {
                  const value = e.target.value;
                  setTarifPajakInput(value);
                  setForm({ ...form, tarifPajak: value === "" ? 0 : Number(value) });
                }} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">Prioritas</label>
                <Input type="number" className="no-spinner bg-white border-[#0A2947]/20 text-[#0A2947]" min={1} value={prioritasInput} onChange={(e) => {
                  const value = e.target.value;
                  setPrioritasInput(value);
                  setForm({ ...form, prioritas: value === "" ? 1 : Number(value) });
                }} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Tipe Pajak</label>
              <Select value={form.tipePajak ? "true" : "false"} onValueChange={(value) => setForm({ ...form, tipePajak: value === "true" })}>
                <SelectTrigger className="bg-white border-[#0A2947]/20 text-[#0A2947]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  <SelectItem value="true" className="cursor-pointer hover:bg-[#0A2947]/5">Per Produk</SelectItem>
                  <SelectItem value="false" className="cursor-pointer hover:bg-[#0A2947]/5">Per Transaksi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Model Perhitungan</label>
              <Select value={String(form.modelPerhitungan)} onValueChange={(value) => setForm({ ...form, modelPerhitungan: Number(value) as 1 | 2 | 3 })}>
                <SelectTrigger className="bg-white border-[#0A2947]/20 text-[#0A2947]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  <SelectItem value="1" className="cursor-pointer hover:bg-[#0A2947]/5">Inklusif</SelectItem>
                  <SelectItem value="2" className="cursor-pointer hover:bg-[#0A2947]/5">Add-on</SelectItem>
                  <SelectItem value="3" className="cursor-pointer hover:bg-[#0A2947]/5">Compound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">Status</label>
              <Select value={form.statusPajak ? "true" : "false"} onValueChange={(value) => setForm({ ...form, statusPajak: value === "true" })}>
                <SelectTrigger className="bg-white border-[#0A2947]/20 text-[#0A2947]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                  <SelectItem value="true" className="cursor-pointer hover:bg-[#0A2947]/5">Aktif</SelectItem>
                  <SelectItem value="false" className="cursor-pointer hover:bg-[#0A2947]/5">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && <p className="text-sm font-bold text-red-600">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={savePajakMutation.isPending} className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">
                Batal
              </Button>
              <Button type="submit" disabled={savePajakMutation.isPending} className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold">
                {savePajakMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">Hapus pajak {deleteTarget?.namaPajak}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold">
              {deleteMutation.isPending ? "Menghapus..." : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}