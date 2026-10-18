"use client";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useDaftarTarif, useHapusTarif } from "@/features/tarif/hooks";
import { pesanError } from "@/lib/api/error";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import MenuEditHapus from "@/components/menu-edit-hapus";
import type { Tarif } from "@/types/tarif";
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
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

// Warna sisa untuk dialog hapus; tabel dan baris filter memakai token (TB23a).
const COLORS = {
  navy: "#0A2947",
  cream: "#FFFAF3",
  rose: "#F43F5E",
};

const HARI_MAP = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** Pilihan baris per halaman (DataTable opt-in, keputusan TB11a). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

function formatHariAktif(hariArray?: number[]) {
  if (!hariArray || hariArray.length === 0 || hariArray.length === 7) return "Setiap Hari";
  return hariArray.map((h) => HARI_MAP[h]).join(", ");
}

export default function DaftarTarifPage() {
  const router = useRouter();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTarifId, setSelectedTarifId] = useState<string | null>(null);

  // --- FETCH DATA ---
  const { data: tarifList = [], isLoading, isError } = useDaftarTarif();

  // --- MUTATION HAPUS ---
  const deleteMutation = useHapusTarif();

  // Hapus dibuka dari menu titik tiga di kolom aksi.

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedTarifId) return;
    deleteMutation.mutate(selectedTarifId, {
      onSuccess: () => {
        toast.success("Tarif Berhasil Dihapus");
        setDeleteModalOpen(false);
        setSelectedTarifId(null);
      },
      onError: (galat) => {
        toast.error("Gagal Menghapus", {
          description: pesanError(galat, "Terjadi kesalahan saat menghapus data tarif."),
        });
        // Dialog bertahan saat gagal agar hapus dapat diulang (keputusan Fase 0).
      },
    });
  };

  // --- FILTERING --- (dimemo agar DataTable tidak kembali ke halaman 1)
  const filteredList = useMemo(
    () =>
      tarifList.filter((item) =>
        item.namaTarif.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [tarifList, searchQuery],
  );

  // Enam kolom tetap; warna dari token, bukan objek hex lokal (TB23a).
  // Aksi baris di menu titik tiga bergaya K-D (TB7a, TB21a).
  const kolom = useMemo<ColumnDef<Tarif>[]>(
    () => [
      {
        id: "nama",
        header: "Nama & Status Tarif",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1.5">
            <p className="font-bold text-[15px] tracking-tight text-navy">{row.original.namaTarif}</p>
            <div className="flex items-center gap-2">
              {row.original.isActive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sage/20 text-sage">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-500">
                  <XCircle className="w-3 h-3" /> Nonaktif
                </span>
              )}
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-karamel/20 text-navy/80">
                Prioritas: {row.original.prioritas}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "harga",
        header: () => <div className="text-right">Harga Sewa</div>,
        cell: ({ row }) => (
          <div className="text-right font-bold text-[15px] text-navy">{formatRupiah(row.original.harga)}</div>
        ),
      },
      {
        id: "basis",
        header: "Basis / Durasi Min.",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-lg w-fit bg-navy/5 text-navy">
              <Clock className="w-3.5 h-3.5 text-karamel" />
              {row.original.basisPerhitungan}
            </span>
            {row.original.durasiMinimum && (
              <span className="text-[11px] font-medium ml-1 text-navy/70">
                Min. {row.original.durasiMinimum}{" "}
                {row.original.basisPerhitungan === "per jam" ? "Jam" : "Sesi"}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "jadwal",
        header: "Jadwal Berlaku",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-navy/80">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatHariAktif(row.original.hariAktif)}
            </span>
            <span className="text-[11px] font-medium ml-5 text-navy/60">
              {row.original.jamMulai && row.original.jamSelesai
                ? `${row.original.jamMulai} - ${row.original.jamSelesai}`
                : "24 Jam Penuh"}
            </span>
          </div>
        ),
      },
      {
        id: "tipe",
        header: "Kategori Aset",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 max-w-45">
            {row.original.dataAset && row.original.dataAset.length > 0 ? (
              row.original.dataAset.map((aset, i) => (
                <span
                  key={aset.id || i}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-navy/20 text-navy/80"
                >
                  {aset.namaTipeAset}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-medium italic text-navy/50">Semua Aset</span>
            )}
          </div>
        ),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <MenuEditHapus
            onEdit={() => router.push(`/dashboard/outlet/reservasi/tarif/${row.original.id}/edit`)}
            onHapus={() => {
              setSelectedTarifId(row.original.id);
              setDeleteModalOpen(true);
            }}
          />
        ),
      },
    ],
    [router],
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* FILTER & TOMBOL TAMBAH: baris tanpa panel, warna dari token (TB22a, TB23a) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-navy/10 pb-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50" />
          <Input
            placeholder="Cari nama tarif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-permukaan border-navy/20 text-navy font-medium"
          />
        </div>
        <Button
          onClick={() => router.push("/dashboard/outlet/reservasi/tarif/buatTarif")}
          className="w-full sm:w-auto font-bold h-11 px-6 shadow-sm bg-navy text-gading hover:bg-navy/90"
        >
          <Plus className="w-4 h-4 mr-2 text-karamel" /> Tambah Tarif
        </Button>
      </div>

      {/* TABEL DATA: DataTable (TB1a sampai TB7a); galat menggantikan tabel (TB15a) */}
      {isError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat data tarif. Pastikan server terhubung.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredList}
          loading={isLoading}
          emptyMessage={searchQuery ? "Tidak ada tarif yang cocok." : "Belum ada data tarif yang dibuat."}
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent
          className="border-none shadow-xl"
          style={{ background: COLORS.cream }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className="flex items-center gap-2"
              style={{ color: COLORS.rose }}
            >
              <AlertTriangle className="w-5 h-5" /> Hapus Tarif?
            </AlertDialogTitle>
            <AlertDialogDescription
              className="font-medium"
              style={{ color: `${COLORS.navy}80` }}
            >
              Tarif yang dihapus tidak dapat dikembalikan dan aset yang
              menggunakan tarif default ini mungkin perlu disetel ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="font-bold border-none transition-colors hover:bg-black/5"
              style={{ color: COLORS.navy }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="font-bold shadow-sm cursor-pointer border-none transition-transform hover:scale-105"
              style={{ background: COLORS.rose, color: COLORS.cream }}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Tarif"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
