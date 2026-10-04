"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { bolehBukaHalaman } from "@/lib/auth/permissions";
import { aksiPajak, URL_PAJAK } from "./izin";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pesanError } from "@/lib/api/error";
import type { Pajak } from "@/types/pajak";
import { FormPajak } from "./form-pajak";
import { useBuatPajak, useDaftarPajak, useHapusPajak, usePerbaruiPajak } from "./hooks";
import { NILAI_AWAL_PAJAK, nilaiAwalPajak, payloadBuatPajak, payloadUbahPajak } from "./payload";
import { PesanPajak } from "./pesan-pajak";
import type { NilaiPajak } from "./schema";
import { TabPajakProduk } from "./tab-pajak-produk";
import { LABEL_MODEL } from "./tampilan";

type Tab = "pajak" | "relasi";
type ModeDialog = { mode: "buat" } | { mode: "ubah"; pajak: Pajak };

const kelasKepalaKolom = "text-xs font-bold text-[#0A2947]/60";
const kelasTab =
  "cursor-pointer rounded-none border-0 border-b-2 border-transparent bg-transparent px-5 py-2 text-sm font-semibold text-[#0A2947]/50 hover:text-[#0A2947] data-[state=active]:border-b-[#0A2947] data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-[#0A2947] data-[state=active]:shadow-none";

/**
 * Halaman pengaturan pajak (submodul 2 modul Pengaturan outlet). Tampilan
 * sama dengan halaman lama; perilaku mengikuti keputusan PO6a sampai PO9a:
 * form divalidasi skemaPajak dengan prioritas berupa pilihan, ubah hanya
 * mengirim field yang berubah ditambah tipePajak, menyimpan pajak per
 * transaksi aktif diberi peringatan, dan dialog simpan maupun hapus hanya
 * tertutup saat berhasil (keputusan Fase 0). Route pajak tidak memeriksa
 * izin (kontrak/temuan.md butir 5), sehingga tidak ada tombol yang
 * disembunyikan menurut izin.
 */
export function HalamanPajak() {
  const { permissions } = useSession();

  // Tanpa izin baca, isi halaman tidak dipasang, sehingga tidak ada
  // permintaan yang pasti dijawab 403 (keputusan FC3a).
  if (!bolehBukaHalaman(URL_PAJAK, permissions)) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2 text-center text-[#0A2947]">
        <p className="font-bold">Anda tidak memiliki izin melihat pajak.</p>
        <p className="text-sm font-medium text-[#0A2947]/60">
          Hubungi pemilik toko bila Anda memerlukannya.
        </p>
      </div>
    );
  }

  return <IsiHalamanPajak />;
}

function IsiHalamanPajak() {
  const router = useRouter();
  const { permissions } = useSession();
  const aksi = aksiPajak(permissions);
  const adaAksiBaris = aksi.ubah || aksi.hapus;
  const [tab, setTab] = useState<Tab>("pajak");
  const daftar = useDaftarPajak();
  const data = useMemo(() => daftar.data ?? [], [daftar.data]);
  const [dialog, setDialog] = useState<ModeDialog | null>(null);
  const [galatForm, setGalatForm] = useState("");
  const [target, setTarget] = useState<Pajak | null>(null);
  const [galatHapus, setGalatHapus] = useState("");

  const keGalatForm = (err: unknown) => setGalatForm(pesanError(err, "Gagal menyimpan data."));
  const buat = useBuatPajak({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pajak berhasil ditambahkan." });
      setDialog(null);
    },
    onError: keGalatForm,
  });
  const perbarui = usePerbaruiPajak({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pajak berhasil diperbarui." });
      setDialog(null);
    },
    onError: keGalatForm,
  });
  const hapus = useHapusPajak({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pajak berhasil dihapus." });
      setTarget(null);
    },
    onError: (err) => setGalatHapus(pesanError(err, "Gagal menghapus pajak.")),
  });
  const sedangMenyimpan = buat.isPending || perbarui.isPending;

  const bukaDialog = (mode: ModeDialog) => {
    setGalatForm("");
    setDialog(mode);
  };

  const simpan = (n: NilaiPajak) => {
    setGalatForm("");
    if (dialog?.mode === "ubah") perbarui.mutate({ id: dialog.pajak.id, payload: payloadUbahPajak(n, dialog.pajak) });
    else buat.mutate(payloadBuatPajak(n));
  };

  const columns = useMemo<ColumnDef<Pajak>[]>(
    () => [
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
        header: () => <span className={kelasKepalaKolom}>Tarif</span>,
        cell: ({ row }) => <span className="font-semibold text-[#0A2947]">{row.original.tarifPajak}%</span>,
      },
      {
        accessorKey: "modelPerhitungan",
        header: () => <span className={kelasKepalaKolom}>Model</span>,
        cell: ({ row }) => (
          <span className="font-medium text-[#0A2947]/80">{LABEL_MODEL[row.original.modelPerhitungan]}</span>
        ),
      },
      {
        accessorKey: "prioritas",
        header: () => <span className={kelasKepalaKolom}>Prioritas</span>,
        cell: ({ row }) => <span className="font-medium text-[#0A2947]/80">{row.original.prioritas}</span>,
      },
      {
        accessorKey: "statusPajak",
        header: () => <span className={kelasKepalaKolom}>Status</span>,
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${row.original.statusPajak ? "bg-[#718355] text-[#FFFAF3]" : "bg-[#0A2947]/10 text-[#0A2947]/60"}`}
          >
            {row.original.statusPajak ? "Aktif" : "Non-Aktif"}
          </span>
        ),
      },
      {
        id: "aksi",
        header: () =>
          adaAksiBaris ? <div className="text-right text-xs font-bold text-[#0A2947]/60">Aksi</div> : null,
        cell: ({ row }) =>
          !adaAksiBaris ? null : (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Aksi ${row.original.namaPajak}`}
                  className="h-8 w-8 cursor-pointer text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FFFAF3] border-[#0A2947]/10">
                {aksi.ubah && (
                <DropdownMenuItem
                  className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5"
                  onSelect={() => {
                    setGalatForm("");
                    setDialog({ mode: "ubah", pajak: row.original });
                  }}
                >
                  Edit
                </DropdownMenuItem>
                )}
                {aksi.ubah && aksi.hapus && <DropdownMenuSeparator className="bg-[#0A2947]/10" />}
                {aksi.hapus && (
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10"
                  onSelect={() => {
                    setGalatHapus("");
                    setTarget(row.original);
                  }}
                >
                  Hapus
                </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [aksi.ubah, aksi.hapus, adaAksiBaris],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
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
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Pengaturan Pajak</h1>
            <p className="text-sm font-medium text-[#0A2947]/60">Kelola pajak dan relasi produk.</p>
          </div>

          {tab === "pajak" && aksi.buat && (
            <Button
              onClick={() => bukaDialog({ mode: "buat" })}
              className="cursor-pointer font-bold bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pajak
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex w-full flex-col">
        <TabsList className="mb-6 flex h-auto w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger value="pajak" className={kelasTab}>
            Daftar Pajak
          </TabsTrigger>
          <TabsTrigger value="relasi" className={kelasTab}>
            Pajak per Produk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pajak">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4">
            {daftar.isError ? (
              <PesanPajak
                judul="Gagal memuat pajak"
                pesan={pesanError(daftar.error, "Terjadi kesalahan saat memuat data pajak.")}
                onCobaLagi={() => void daftar.refetch()}
              />
            ) : (
              <DataTable
                columns={columns}
                data={data}
                loading={daftar.isLoading}
                emptyMessage="Belum ada pajak."
                searchKey="namaPajak"
                searchPlaceholder="Cari nama pajak..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="relasi">
          <TabPajakProduk daftarPajak={data} />
        </TabsContent>
      </Tabs>

      <Dialog
        open={dialog !== null}
        onOpenChange={(buka) => {
          if (!buka && !sedangMenyimpan) setDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-lg bg-[#FFFAF3] border-[#0A2947]/10">
          <DialogHeader>
            <DialogTitle className="text-[#0A2947]">{dialog?.mode === "ubah" ? "Edit Pajak" : "Tambah Pajak"}</DialogTitle>
            <DialogDescription className="text-[#0A2947]/60 font-medium">Kelola data pajak sistem.</DialogDescription>
          </DialogHeader>
          {dialog && (
            <FormPajak
              key={dialog.mode === "ubah" ? dialog.pajak.id : "buat"}
              nilaiAwal={dialog.mode === "ubah" ? nilaiAwalPajak(dialog.pajak) : NILAI_AWAL_PAJAK}
              asal={dialog.mode === "ubah" ? dialog.pajak : undefined}
              daftar={data}
              sedangMenyimpan={sedangMenyimpan}
              galat={galatForm}
              onSimpan={simpan}
              onBatal={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={target !== null}
        onOpenChange={(buka) => {
          if (!buka && !hapus.isPending) setTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">Hapus pajak {target?.namaPajak}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Tindakan ini tidak dapat dibatalkan. Produk yang memakai pajak ini akan dilepas darinya, dan pajak ini
              tidak lagi dikenakan pada penjualan berikutnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {galatHapus && <p className="text-sm font-bold text-red-600">{galatHapus}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={hapus.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={hapus.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (target) hapus.mutate(target.id);
              }}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold"
            >
              {hapus.isPending ? "Menghapus..." : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}