"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { ArrowLeft, Edit, MoreHorizontal, Plus, Tags, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import { cn } from "@/lib/utils";
import type { KategoriBeban } from "@/types/bebanOperasional";
import {
  useBuatKategoriBeban,
  useDaftarKategoriBeban,
  useHapusKategoriBeban,
  useUbahKategoriBeban,
} from "./hooks";
import { aksiKategoriBeban } from "./izin";
import { skemaKategoriBeban, type IsianKategoriBeban } from "./schema";

const URL_PENGATURAN = "/dashboard/outlet/pengaturan";
const KELAS_ISIAN =
  "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy";

/** Penolakan backend di dalam dialog, apa adanya. */
function PesanGalat({ pesan }: { pesan: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
    >
      {pesan}
    </p>
  );
}

/**
 * Kelola kategori beban di Pengaturan outlet (keputusan BO4a): tambah, ganti
 * nama, dan hapus kategori yang belum dipakai. Nama unik per toko, dan
 * kategori yang pernah dipakai beban, termasuk beban yang sudah dibatalkan,
 * tidak dapat dihapus (409); kedua penolakan backend ditampilkan apa adanya
 * di dalam dialog. Tombol dan menu mengikuti izin endpoint-nya (keputusan
 * rancangan butir 14).
 */
export function HalamanKategoriBeban() {
  const router = useRouter();
  const { permissions } = useSession();
  const aksi = aksiKategoriBeban(permissions);
  const daftar = useDaftarKategoriBeban();
  const data = useMemo(() => daftar.data ?? [], [daftar.data]);
  const [form, setForm] = useState<{ kategori: KategoriBeban | null } | null>(null);
  const [dihapus, setDihapus] = useState<KategoriBeban | null>(null);

  const kolom = useMemo<ColumnDef<KategoriBeban>[]>(
    () => [
      {
        accessorKey: "namaKategori",
        header: "Nama Kategori",
        cell: ({ row }) => <span className="font-bold text-navy">{row.original.namaKategori}</span>,
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) =>
          aksi.ubah || aksi.hapus ? (
            <MenuKategori
              kategori={row.original}
              bolehUbah={aksi.ubah}
              bolehHapus={aksi.hapus}
              onUbah={() => setForm({ kategori: row.original })}
              onHapus={() => setDihapus(row.original)}
            />
          ) : null,
      },
    ],
    [aksi.ubah, aksi.hapus],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
          onClick={() => router.push(URL_PENGATURAN)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Laman Pengaturan
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
              <Tags className="w-6 h-6 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-navy">Kategori Beban</h1>
              <p className="text-sm font-medium text-navy/60">
                Kelompokkan pengeluaran operasional toko. Kategori yang pernah dipakai tidak dapat dihapus.
              </p>
            </div>
          </div>
          {aksi.buat && (
            <Button
              type="button"
              onClick={() => setForm({ kategori: null })}
              className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto font-bold"
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
            </Button>
          )}
        </div>
      </div>

      {daftar.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center"
        >
          <p className="text-sm font-medium text-red-600">
            {pesanError(daftar.error, "Gagal memuat kategori beban.")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void daftar.refetch()}
            disabled={daftar.isFetching}
          >
            Coba Lagi
          </Button>
        </div>
      ) : (
        <DataTable
          columns={kolom}
          data={data}
          loading={daftar.isPending}
          emptyMessage="Belum ada kategori beban."
          searchKey="namaKategori"
          searchPlaceholder="Cari nama kategori..."
        />
      )}

      {form && <DialogFormKategori kategori={form.kategori} onTutup={() => setForm(null)} />}
      {dihapus && <DialogHapusKategori kategori={dihapus} onTutup={() => setDihapus(null)} />}
    </div>
  );
}

function MenuKategori({
  kategori,
  bolehUbah,
  bolehHapus,
  onUbah,
  onHapus,
}: {
  kategori: KategoriBeban;
  bolehUbah: boolean;
  bolehHapus: boolean;
  onUbah: () => void;
  onHapus: () => void;
}) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Aksi ${kategori.namaKategori}`}
            className="h-8 w-8 text-navy/50 hover:text-navy hover:bg-navy/10 cursor-pointer"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 bg-gading border-navy/10 rounded-xl shadow-lg">
          {bolehUbah && (
            <DropdownMenuItem
              onSelect={onUbah}
              className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
            >
              <Edit className="mr-2 h-4 w-4" /> Ganti nama
            </DropdownMenuItem>
          )}
          {bolehUbah && bolehHapus && <DropdownMenuSeparator className="bg-navy/5" />}
          {bolehHapus && (
            <DropdownMenuItem
              onSelect={onHapus}
              className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 rounded-lg m-1"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Tambah (kategori null) atau ganti nama. Dipasang setiap kali dibuka,
 * sehingga nilai awal selalu dari data terbaru (keputusan rancangan butir 8),
 * dan hanya tertutup saat berhasil (keputusan Fase 0). Simpan ganti nama mati
 * selama nama belum berubah.
 */
function DialogFormKategori({
  kategori,
  onTutup,
}: {
  kategori: KategoriBeban | null;
  onTutup: () => void;
}) {
  const [galat, setGalat] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IsianKategoriBeban>({
    resolver: zodResolver(skemaKategoriBeban),
    defaultValues: { namaKategori: kategori?.namaKategori ?? "" },
  });
  const nama = useWatch({ control, name: "namaKategori" });
  const tidakBerubah = kategori !== null && nama.trim() === kategori.namaKategori;

  const opsi = {
    onSuccess: () => {
      toast.success(kategori ? "Nama kategori diganti" : "Kategori ditambahkan");
      onTutup();
    },
    onError: (err: unknown) => setGalat(pesanError(err, "Gagal menyimpan kategori beban.")),
  };
  const buat = useBuatKategoriBeban(opsi);
  const ubah = useUbahKategoriBeban(opsi);
  const memuat = buat.isPending || ubah.isPending;

  const kirim = (isian: IsianKategoriBeban) => {
    setGalat("");
    const payload = { namaKategori: isian.namaKategori };
    if (kategori) ubah.mutate({ id: kategori.id, payload });
    else buat.mutate(payload);
  };

  return (
    <Dialog
      open
      onOpenChange={(buka) => {
        if (!buka && !memuat) onTutup();
      }}
    >
      <DialogContent className="bg-gading border-navy/10">
        <form noValidate onSubmit={handleSubmit(kirim)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-navy">
              {kategori ? "Ganti Nama Kategori" : "Tambah Kategori Beban"}
            </DialogTitle>
            <DialogDescription className="text-navy/70 font-medium">
              {kategori
                ? "Nama baru langsung tampil di beban yang memakai kategori ini."
                : "Kategori mengelompokkan pengeluaran, misalnya Listrik, Sewa, atau Gaji."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor="nama-kategori-beban" className="text-sm font-bold text-navy">
              Nama Kategori
            </label>
            <Input
              id="nama-kategori-beban"
              {...register("namaKategori")}
              readOnly={memuat}
              className={cn(KELAS_ISIAN, errors.namaKategori && "border-rose-500")}
            />
            {errors.namaKategori && (
              <span className="text-xs font-bold text-rose-500">{errors.namaKategori.message}</span>
            )}
          </div>
          {galat && <PesanGalat pesan={galat} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onTutup} disabled={memuat}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={memuat || tidakBerubah}
              className="bg-navy text-gading hover:bg-navy/90 font-bold"
            >
              {memuat ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Konfirmasi hapus. Backend menolak 409 kategori yang dipakai beban, dengan
 * pesan yang menyebut jumlah bebannya; dialog bertahan dan menampilkannya.
 */
function DialogHapusKategori({
  kategori,
  onTutup,
}: {
  kategori: KategoriBeban;
  onTutup: () => void;
}) {
  const [galat, setGalat] = useState("");
  const hapus = useHapusKategoriBeban({
    onSuccess: () => {
      toast.success("Kategori dihapus");
      onTutup();
    },
    onError: (err) => setGalat(pesanError(err, "Gagal menghapus kategori beban.")),
  });

  return (
    <AlertDialog
      open
      onOpenChange={(buka) => {
        if (!buka && !hapus.isPending) onTutup();
      }}
    >
      <AlertDialogContent className="bg-gading border-navy/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-navy">Hapus kategori {kategori.namaKategori}?</AlertDialogTitle>
          <AlertDialogDescription className="text-navy/70 font-medium">
            Kategori yang pernah dipakai beban, termasuk beban yang sudah dibatalkan, tidak dapat dihapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {galat && <PesanGalat pesan={galat} />}
        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel
            disabled={hapus.isPending}
            className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={hapus.isPending}
            onClick={(e) => {
              e.preventDefault();
              setGalat("");
              hapus.mutate(kategori.id);
            }}
            className="cursor-pointer font-bold bg-red-600 hover:bg-red-700 text-white"
          >
            {hapus.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}