"use client";

import { useEffect, useState } from "react";
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

import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";

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
      const res = await apiClient.get<GetPajakResponse>(
        "/pajak",
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

  // QUERY RELASI
  const {
    data: relasiList = [],
    isLoading: relasiLoading,
    error: relasiError,
  } = useQuery({
    queryKey: queryKeys.produkPajak(selectedProduk),

    enabled: !!selectedProduk,

    queryFn: async () => {
      const res = await apiClient.get<GetPajakByProdukResponse>(
        `/produkpajak/${selectedProduk}`,
        undefined,
        "pengguna",
      );

      return res.data;
    },
  });

  // ERROR TOAST
  useEffect(() => {
    if (pajakError) {
      toast.error("Gagal", {
        description:
          pajakError instanceof Error
            ? pajakError.message
            : "Gagal memuat data pajak.",
      });
    }
  }, [pajakError]);

  useEffect(() => {
    if (relasiError) {
      toast.error("Gagal", {
        description:
          relasiError instanceof Error
            ? relasiError.message
            : "Gagal memuat relasi pajak.",
      });
    }
  }, [relasiError]);

  useEffect(() => {
    if (produkError) {
      toast.error("Gagal", {
        description:
          produkError instanceof Error
            ? produkError.message
            : "Gagal memuat data produk.",
      });
    }
  }, [produkError]);

  // MUTATION SAVE
  const savePajakMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: PajakRequest }) => {
      if (id) {
        return await apiClient.put<PajakResponse>(
          `/pajak/${id}`,
          data,
          undefined,
          "pengguna",
        );
      }

      return await apiClient.post<PajakResponse>(
        "/pajak",
        data,
        undefined,
        "pengguna",
      );
    },

    onSuccess: (_, variables) => {
      toast.success("Berhasil", {
        description: variables.id
          ? "Pajak berhasil diperbarui."
          : "Pajak berhasil ditambahkan.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pajak,
      });

      setShowDialog(false);
    },

    onError: (err: any) => {
      setFormError(err.message || "Gagal menyimpan data.");
    },
  });

  // MUTATION DELETE
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/pajak/${id}`, undefined, "pengguna");
    },

    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Pajak berhasil dihapus.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pajak,
      });

      setDeleteTarget(null);
    },

    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus pajak.",
      });
    },
  });

  // MUTATION ASSIGN
  const assignMutation = useMutation({
    mutationFn: async (payload: ProdukPajakRequest) => {
      return await apiClient.post(
        "/produkpajak",
        payload,
        undefined,
        "pengguna",
      );
    },

    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Pajak berhasil ditambahkan ke produk.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.produkPajak(selectedProduk),
      });

      setSelectedPajakRelasi("");
    },

    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal assign pajak.",
      });
    },
  });

  // MUTATION UNASSIGN
  const unassignMutation = useMutation({
    mutationFn: async (relasiID: string) => {
      return await apiClient.delete(
        `/produkpajak/${relasiID}`,
        undefined,
        "pengguna",
      );
    },

    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Relasi pajak berhasil dilepas.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.produkPajak(selectedProduk),
      });
    },

    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus relasi.",
      });
    },
  });

  // OPEN CREATE
  const openCreate = () => {
    setEditTarget(null);

    setForm(emptyForm);

    setTarifPajakInput("");

    setPrioritasInput("");

    setFormError("");

    setShowDialog(true);
  };

  // OPEN EDIT
  const openEdit = (item: Pajak) => {
    setEditTarget(item);

    setForm({
      namaPajak: item.namaPajak,
      tarifPajak: item.tarifPajak,
      tipePajak: item.tipePajak,
      modelPerhitungan: item.modelPerhitungan,
      prioritas: item.prioritas,
      statusPajak: item.statusPajak,
    });

    setTarifPajakInput(String(item.tarifPajak));

    setPrioritasInput(String(item.prioritas));

    setFormError("");

    setShowDialog(true);
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError("");

    await savePajakMutation.mutateAsync({
      id: editTarget?._id,
      data: form,
    });
  };

  // DELETE
  const handleDelete = async () => {
    if (!deleteTarget) return;

    await deleteMutation.mutateAsync(deleteTarget._id);
  };

  // ASSIGN
  const handleAssign = async () => {
    if (!selectedProduk || !selectedPajakRelasi) return;

    await assignMutation.mutateAsync({
      produkID: selectedProduk,
      pajakID: selectedPajakRelasi,
    });
  };

  // DERIVED
  const pajakPerProduk = pajakData.filter((p) => p.tipePajak === true);

  const assignedPajakIDs = relasiList.map((r) => r.pajak._id);

  const availablePajakToAssign = pajakPerProduk.filter(
    (p) => !assignedPajakIDs.includes(p._id),
  );

  // TABLE
  const columns: ColumnDef<Pajak>[] = [
    {
      accessorKey: "namaPajak",

      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Pajak
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
    },

    {
      accessorKey: "tarifPajak",

      header: () => (
        <span className="text-xs font-semibold text-muted-foreground">
          Tarif
        </span>
      ),

      cell: ({ row }) => <span>{row.original.tarifPajak}%</span>,
    },

    {
      accessorKey: "modelPerhitungan",

      header: () => (
        <span className="text-xs font-semibold text-muted-foreground">
          Model
        </span>
      ),

      cell: ({ row }) => (
        <span>{MODEL_LABEL[row.original.modelPerhitungan]}</span>
      ),
    },

    {
      accessorKey: "prioritas",

      header: () => (
        <span className="text-xs font-semibold text-muted-foreground">
          Prioritas
        </span>
      ),
    },

    {
      accessorKey: "statusPajak",

      header: () => (
        <span className="text-xs font-semibold text-muted-foreground">
          Status
        </span>
      ),

      cell: ({ row }) => (
        <span
          className={
            row.original.statusPajak
              ? "text-green-600"
              : "text-muted-foreground"
          }
        >
          {row.original.statusPajak ? "Aktif" : "Non-Aktif"}
        </span>
      ),
    },

    {
      id: "aksi",

      header: () => <div className="text-right text-xs">Aksi</div>,

      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => openEdit(row.original)}
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-500"
                onClick={() => setDeleteTarget(row.original)}
              >
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Pengaturan Pajak
          </h1>

          <p className="text-sm text-muted-foreground">
            Kelola pajak dan relasi produk.
          </p>
        </div>

        {tab === "pajak" && (
          <Button onClick={openCreate} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pajak
          </Button>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabType)}
        className="flex w-full flex-col"
      >
        {/* Meniru: display: flex, gap: 0, borderBottom: 2px solid #e5e7eb, marginBottom: 1.5rem */}
        <TabsList className="mb-6 flex h-auto w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger
            value="pajak"
            className="cursor-pointer rounded-none border-0 border-b-2 border-transparent bg-transparent px-5 py-2 text-sm font-normal text-muted-foreground hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Daftar Pajak
          </TabsTrigger>

          <TabsTrigger
            value="relasi"
            className="cursor-pointer rounded-none border-0 border-b-2 border-transparent bg-transparent px-5 py-2 text-sm font-normal text-muted-foreground hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Pajak per Produk
          </TabsTrigger>
        </TabsList>

        {/* TAB PAJAK */}
        <TabsContent value="pajak">
          <DataTable
            columns={columns}
            data={pajakData}
            loading={pajakLoading}
            emptyMessage="Belum ada pajak."
            searchKey="namaPajak"
            searchPlaceholder="Cari pajak..."
          />
        </TabsContent>

        {/* TAB RELASI */}
        <TabsContent value="relasi" className="space-y-6">
          <div className="rounded-xl border p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Produk</label>

              <Select
                value={selectedProduk}
                onValueChange={(value) => {
                  setSelectedProduk(value);
                  setSelectedPajakRelasi("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>

                <SelectContent>
                  {produkList.map((produk) => (
                    <SelectItem key={produk._id} value={produk._id}>
                      {produk.namaProduk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduk && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Assign Pajak</label>

                <div className="flex gap-2">
                  <Select
                    value={selectedPajakRelasi}
                    onValueChange={setSelectedPajakRelasi}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pajak" />
                    </SelectTrigger>

                    <SelectContent>
                      {availablePajakToAssign.map((pajak) => (
                        <SelectItem key={pajak._id} value={pajak._id}>
                          {pajak.namaPajak} ({pajak.tarifPajak}
                          %)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAssign}
                    disabled={assignMutation.isPending || !selectedPajakRelasi}
                    className="cursor-pointer"
                  >
                    {assignMutation.isPending ? "Menyimpan..." : "Assign"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {selectedProduk && (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Pajak</TableHead>

                    <TableHead>Tarif</TableHead>

                    <TableHead>Model</TableHead>

                    <TableHead>Status</TableHead>

                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {relasiLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Memuat...
                      </TableCell>
                    </TableRow>
                  ) : relasiList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Belum ada relasi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    relasiList.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">
                          {r.pajak.namaPajak}
                        </TableCell>

                        <TableCell>{r.pajak.tarifPajak}%</TableCell>

                        <TableCell>
                          {MODEL_LABEL[r.pajak.modelPerhitungan]}
                        </TableCell>

                        <TableCell>
                          {r.pajak.statusPajak ? "Aktif" : "Non-Aktif"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => unassignMutation.mutate(r._id)}
                            className="cursor-pointer"
                          >
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
        </TabsContent>
      </Tabs>

      {/* FORM DIALOG */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Pajak" : "Tambah Pajak"}
            </DialogTitle>

            <DialogDescription>Kelola data pajak sistem.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Pajak</label>

              <Input
                value={form.namaPajak}
                onChange={(e) =>
                  setForm({
                    ...form,
                    namaPajak: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tarif (%)</label>

                <Input
                  type="number"
                  className="no-spinner"
                  min={0}
                  max={100}
                  value={tarifPajakInput}
                  onChange={(e) => {
                    const value = e.target.value;

                    setTarifPajakInput(value);

                    setForm({
                      ...form,
                      tarifPajak: value === "" ? 0 : Number(value),
                    });
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prioritas</label>

                <Input
                  type="number"
                  className="no-spinner"
                  min={1}
                  value={prioritasInput}
                  onChange={(e) => {
                    const value = e.target.value;

                    setPrioritasInput(value);

                    setForm({
                      ...form,
                      prioritas: value === "" ? 1 : Number(value),
                    });
                  }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Pajak</label>

              <Select
                value={form.tipePajak ? "true" : "false"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    tipePajak: value === "true",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="true">Per Produk</SelectItem>

                  <SelectItem value="false">Per Transaksi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model Perhitungan</label>

              <Select
                value={String(form.modelPerhitungan)}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    modelPerhitungan: Number(value) as 1 | 2 | 3,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="1">Inklusif</SelectItem>

                  <SelectItem value="2">Add-on</SelectItem>

                  <SelectItem value="3">Compound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>

              <Select
                value={form.statusPajak ? "true" : "false"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    statusPajak: value === "true",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>

                  <SelectItem value="false">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={savePajakMutation.isPending}
                className="cursor-pointer"
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={savePajakMutation.isPending}
                className="cursor-pointer"
              >
                {savePajakMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus pajak {deleteTarget?.namaPajak}?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="cursor-pointer"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
