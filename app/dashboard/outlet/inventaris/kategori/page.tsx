"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/auth/useSession";
import { pesanError } from "@/lib/api/error";
import { pesanErrorKategori } from "@/features/kategori/pesan";
import {
  useDaftarKategori,
  useHapusKategori,
  useSimpanKategori,
} from "@/features/kategori/hooks";
import { skemaKategori, type NilaiFormKategori } from "@/features/kategori/schema";
import { useDaftarProduk } from "@/features/produk/hooks";
import { bolehBacaProduk } from "@/features/produk/izin";
import type { Kategori } from "@/types/kategori";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, MoreHorizontal, Plus, Tag } from "lucide-react";

const nilaiKosong: NilaiFormKategori = {
  namaKategori: "",
  kodeKategori: "",
  keterangan: "",
};

export default function KategoriPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Kategori | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Kategori | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NilaiFormKategori>({
    resolver: zodResolver(skemaKategori),
    defaultValues: nilaiKosong,
  });

  const { data = [], isLoading: loading, error } = useDaftarKategori();
  const saveKategoriMutation = useSimpanKategori();
  const deleteMutation = useHapusKategori();

  // Hitungan pemakaian kategori oleh produk, untuk mencegah hapus kategori
  // yang masih dipakai. Backend tidak memeriksanya (kategoriService.delete),
  // sehingga penghapusan meninggalkan produk tanpa kategori. Hitungan hanya
  // diandalkan bila daftar produk boleh dibaca dan sudah termuat; selain itu
  // dialog hapus menampilkan peringatan.
  const { permissions } = useSession();
  const bolehHitungPemakaian = bolehBacaProduk(permissions);
  const { data: produkList = [], isSuccess: produkTermuat } = useDaftarProduk({
    enabled: bolehHitungPemakaian,
  });
  const pemakaianKategori = useMemo(() => {
    const hitung = new Map<string, number>();
    for (const produk of produkList) {
      hitung.set(produk.kategoriID, (hitung.get(produk.kategoriID) ?? 0) + 1);
    }
    return hitung;
  }, [produkList]);
  const pemakaianDiketahui = bolehHitungPemakaian && produkTermuat;
  const jumlahPemakaian = deleteTarget
    ? (pemakaianKategori.get(deleteTarget.id) ?? 0)
    : 0;
  const kategoriDipakai = pemakaianDiketahui && jumlahPemakaian > 0;
  const pesanHapus = kategoriDipakai
    ? "Kategori ini masih dipakai " + jumlahPemakaian + " produk. Pindahkan produk tersebut ke kategori lain sebelum menghapus."
    : pemakaianDiketahui
      ? "Tindakan ini tidak dapat dibatalkan."
      : "Tindakan ini tidak dapat dibatalkan. Produk yang masih memakai kategori ini akan kehilangan kategorinya dan perlu dipilihkan kategori baru saat diedit.";

  useEffect(() => {
    if (error) {
      toast.error("Gagal", {
        description: pesanError(error, "Gagal memuat data kategori."),
      });
    }
  }, [error]);

  // Form diisi ulang setiap kali dialog dibuka: dari kategori yang diedit,
  // atau nilai kosong untuk kategori baru.
  useEffect(() => {
    if (!showDialog) return;
    reset(
      editTarget
        ? {
            namaKategori: editTarget.namaKategori,
            kodeKategori: editTarget.kodeKategori,
            keterangan: editTarget.keterangan ?? "",
          }
        : nilaiKosong,
    );
  }, [showDialog, editTarget, reset]);

  const simpan = async (nilai: NilaiFormKategori) => {
    setFormError("");
    try {
      await saveKategoriMutation.mutateAsync({ id: editTarget?.id, data: nilai });
      toast.success("Berhasil", {
        description: editTarget
          ? "Kategori berhasil diperbarui."
          : "Kategori berhasil ditambahkan.",
      });
      setShowDialog(false);
    } catch (err) {
      setFormError(
        pesanErrorKategori(err, "Gagal menyimpan data.", {
          nilai,
          daftar: data,
          idDiedit: editTarget?.id,
        }),
      );
    }
  };

  // Dialog hapus bertahan selama mutation berjalan dan hanya tertutup bila
  // berhasil (keputusan Fase 0); saat gagal, dialog tetap terbuka.
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Berhasil", { description: "Kategori berhasil dihapus." });
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Gagal", {
        description: pesanError(err, "Gagal menghapus kategori."),
      });
    }
  };

  const columns = useMemo<ColumnDef<Kategori>[]>(
    () => [
      {
        accessorKey: "namaKategori",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-navy/60 hover:bg-transparent hover:text-navy cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Kategori <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-navy">
            {row.original.namaKategori}
          </span>
        ),
      },
      {
        accessorKey: "kodeKategori",
        header: () => (
          <span className="text-xs font-bold text-navy/60">Kode</span>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-navy/70">
            {row.original.kodeKategori}
          </span>
        ),
      },
      {
        accessorKey: "keterangan",
        header: () => (
          <span className="text-xs font-bold text-navy/60">
            Keterangan
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-navy/70">
            {row.original.keterangan || "-"}
          </span>
        ),
      },
      {
        id: "aksi",
        header: () => (
          <div className="text-right text-xs font-bold text-navy/60">
            Aksi
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gading border-navy/10"
              >
                <DropdownMenuItem
                  className="cursor-pointer text-navy hover:bg-navy/5 font-bold"
                  onClick={() => {
                    setEditTarget(row.original);
                    setFormError("");
                    setShowDialog(true);
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-navy/10" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shadow-sm">
            <Tag className="w-6 h-6 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Kelola Kategori
            </h1>
            <p className="text-sm font-medium text-navy/60">
              Kelola seluruh data kategori produk.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormError("");
            setShowDialog(true);
          }}
          className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="w-full">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="Belum ada kategori."
          searchKey="namaKategori"
          searchPlaceholder="Cari nama kategori..."
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-gading border-navy/10">
          <DialogHeader>
            <DialogTitle className="text-navy">
              {editTarget ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription className="text-navy/60 font-medium">
              {editTarget
                ? "Perbarui data kategori yang sudah ada."
                : "Isi form berikut untuk menambahkan kategori baru."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(simpan)} className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="namaKategori" className="text-sm font-bold text-navy">
                Nama Kategori
              </label>
              <Input
                id="namaKategori"
                {...register("namaKategori")}
                placeholder="Masukkan nama kategori"
                aria-invalid={Boolean(errors.namaKategori)}
                className="bg-white border-navy/20"
              />
              {errors.namaKategori && (
                <p className="text-sm font-bold text-red-600">{errors.namaKategori.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="kodeKategori" className="text-sm font-bold text-navy">
                Kode Kategori
              </label>
              <Input
                id="kodeKategori"
                {...register("kodeKategori")}
                placeholder="Masukkan kode kategori"
                aria-invalid={Boolean(errors.kodeKategori)}
                className="bg-white border-navy/20"
              />
              {errors.kodeKategori && (
                <p className="text-sm font-bold text-red-600">{errors.kodeKategori.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="keteranganKategori" className="text-sm font-bold text-navy">
                Keterangan
              </label>
              <Input
                id="keteranganKategori"
                {...register("keterangan")}
                placeholder="Keterangan tambahan (opsional)"
                className="bg-white border-navy/20"
              />
            </div>
            {formError && (
              <p className="text-sm font-bold text-red-600">{formError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={saveKategoriMutation.isPending}
                className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saveKategoriMutation.isPending}
                className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm font-bold"
              >
                {saveKategoriMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">
              Hapus kategori {deleteTarget?.namaKategori}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              {pesanHapus}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending || kategoriDipakai}
              className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
