"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useTabUrl } from "@/hooks/use-tab-url";
import { SLUG_TAB_STOK, TAB_STOK } from "@/features/inventaris/tab-stok";
import { KotakCari } from "@/components/filter/bilah-filter";
import { useRouter } from "next/navigation";
import { useHalamanProduk, useHapusProduk, useInvalidasiProduk } from "@/features/produk/hooks";
import { PESAN_PRODUK_SUDAH_TERHAPUS, produkSudahTerhapus } from "@/features/produk/hapus";
import { PILIHAN_UKURAN_PRODUK, paramHalamanProduk } from "@/features/produk/filter";
import { PANJANG_CARI_SERVER } from "@/features/inventaris/cakupan";
import { useDebounce } from "@/hooks/use-debounce";
import { pesanError } from "@/lib/api/error";
import type { Produk } from "@/types/produk";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRupiah } from "@/lib/format";
import { AlertTriangle, MoreHorizontal, Plus, Package, Infinity } from "lucide-react";

function IsiProdukPage() {
  // 1. PROTEKSI HALAMAN

  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<Produk | null>(null);
  const [tabStok, setTabStok] = useTabUrl(SLUG_TAB_STOK, TAB_STOK, "ALL");
  const tabKritis = tabStok === "CRITICAL";
  const setTabKritis = (kritis: boolean) => setTabStok(kritis ? "CRITICAL" : "ALL");
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN_PRODUK[0]);

  // Mengganti tab atau pencarian kembali ke halaman 1, disesuaikan saat
  // render agar halaman lama tidak sempat diminta.
  const kunciKriteria = JSON.stringify([tabKritis, cariTertunda]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  // =========================
  // QUERY PRODUK
  // =========================
  // Pencarian nama dan tab stok kritis disaring server bersama paginasinya
  // (P79, B340; keputusan rancangan butir 27, PV1a). Urutan mengikuti
  // backend (nama); mengurutkan di klien hanya mengurutkan satu halaman.
  const {
    data,
    isLoading: produkLoading,
    isFetching: produkMemuat,
    error: produkError,
  } = useHalamanProduk(paramHalamanProduk(cariTertunda, tabKritis, halaman, ukuran));
  const produkList = data?.data ?? [];

  // =========================
  // ERROR TOAST
  // =========================
  useEffect(() => {
    if (produkError) {
      toast.error("Gagal", {
        description: pesanError(produkError, "Gagal memuat data produk."),
      });
    }
  }, [produkError]);

  // =========================
  // MUTATION DELETE
  // =========================
  const deleteMutation = useHapusProduk();
  const invalidasiProduk = useInvalidasiProduk();

  // Dialog hapus bertahan selama mutation berjalan dan hanya tertutup bila
  // berhasil (keputusan Fase 0); saat gagal, dialog tetap terbuka, kecuali
  // produk yang sudah dihapus di tempat lain (404): dialog ditutup dan daftar
  // dimuat ulang di sini (HP1a, khusus halaman produk; hook bersama dengan
  // wizard setup tidak diubah).
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Berhasil", {
        description: "Produk berhasil dihapus.",
      });
      setDeleteTarget(null);
    } catch (err) {
      if (produkSudahTerhapus(err)) {
        toast.info(PESAN_PRODUK_SUDAH_TERHAPUS);
        setDeleteTarget(null);
        void invalidasiProduk();
        return;
      }
      toast.error("Gagal", {
        description: pesanError(err, "Gagal menghapus produk."),
      });
    }
  };

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = useMemo<ColumnDef<Produk>[]>(
    () => [
      {
        accessorKey: "namaProduk",
        meta: { label: "Nama Produk" },
        header: () => <span className="text-kecil font-bold text-navy/60">Nama Produk</span>,
        cell: ({ row }) => (
          <span className="font-bold text-navy">{row.original.namaProduk}</span>
        ),
      },
      {
        accessorKey: "kategori",
        meta: { label: "Kategori" },
        header: () => (
          <span className="text-kecil font-bold text-navy/60">
            Kategori
          </span>
        ),
        cell: ({ row }) => {
          const namaKategori = row.original.kategori || "Tanpa kategori";
          return <span className="font-medium text-navy/80 capitalize">{namaKategori}</span>;
        },
      },
      {
        accessorKey: "hargaDasar",
        meta: { label: "Harga Dasar" },
        header: () => (
          <span className="text-kecil font-bold text-navy/60">
            Harga Dasar
          </span>
        ),
        cell: ({ row }) => <span className="font-medium text-navy/70 font-mono">{formatRupiah(row.original.hargaDasar)}</span>,
      },
      {
        accessorKey: "hargaJual",
        meta: { label: "Harga Jual" },
        header: () => (
          <span className="text-kecil font-bold text-navy/60">
            Harga Jual
          </span>
        ),
        cell: ({ row }) => <span className="font-bold text-sage font-mono">{formatRupiah(row.original.hargaJual)}</span>,
      },
      {
        accessorKey: "stok",
        meta: { label: "Stok" },
        header: () => (
          <span className="text-kecil font-bold text-navy/60">
            Stok
          </span>
        ),
        cell: ({ row }) => {
          const stok = row.original.stok;
          const isUnlimited = row.original.isUnlimitedStok;
          const isHabis = stok <= 0;

          // --- LOGIKA BARU UNTUK UNLIMITED STOK ---
          if (isUnlimited) {
            return (
              <span className="inline-flex items-center gap-1 rounded-md bg-karamel/10 px-2 py-0.5 text-kecil font-bold text-karamel shadow-sm border border-karamel/20">
                <Infinity className="w-3.5 h-3.5" /> Unlimited
              </span>
            );
          }

          // Stok kritis dari backend (B237): stok di bawah atau sama dengan
          // stok minimal, hanya untuk produk berstok langsung.
          const kritis = row.original.isStokKritis === true;
          return (
            <div className="flex flex-col items-start gap-1">
              <span
                className={`rounded-md px-2 py-0.5 text-kecil font-bold shadow-sm ${
                  isHabis || kritis
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-navy/5 text-navy border border-navy/10"
                }`}
              >
                {stok} item
              </span>
              {kritis && (
                <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 text-mikro font-semibold text-rose-600">
                  Kritis
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-kecil font-bold text-navy/60">Aksi</div>,
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
              <DropdownMenuContent align="end" className="bg-gading border-navy/10 min-w-37.5">
                <DropdownMenuItem
                  className="cursor-pointer text-navy hover:bg-navy/5 font-bold"
                  onClick={() =>
                    router.push(`/dashboard/outlet/inventaris/produk/${row.original.id}/edit`)
                  }
                >
                  Edit Produk
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-navy/10" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  Hapus Produk
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [router] 
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <Package className="w-6 h-6 text-karamel" /> 
          </div>
          <div>
            <h1 className="text-judul font-bold tracking-tight text-navy">Data Produk</h1>
            <p className="text-isi font-medium text-navy/60">
              Kelola daftar produk, harga, dan stok toko Anda.
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/dashboard/outlet/inventaris/produk/buatProduk")}
          size="aksi"
          className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Tab cepat, sama dengan halaman Stok Saat Ini (B237) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-navy/10 pb-4">
        <Button
          variant="ghost"
          onClick={() => setTabKritis(false)}
          className={`rounded-full px-6 font-bold transition-all ${
            !tabKritis ? "bg-navy text-white hover:bg-navy/90" : "text-navy/60 hover:text-navy hover:bg-navy/5"
          }`}
        >
          Semua Produk
        </Button>
        <Button
          variant="ghost"
          onClick={() => setTabKritis(true)}
          className={`rounded-full px-6 font-bold transition-all flex items-center gap-2 ${
            tabKritis ? "bg-rose-500 text-white hover:bg-rose-600" : "text-rose-500/70 hover:text-rose-600 hover:bg-rose-50"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Stok Kritis
        </Button>
      </div>

      <KotakCari
        id="cari-produk"
        label="Cari nama produk"
        placeholder="Cari nama produk..."
        value={cari}
        onChange={setCari}
        maxLength={PANJANG_CARI_SERVER}
      />

      {/* Tabel Wrapper (Card Cream Gelap) */}
      <div className="flex flex-col gap-4 w-full">
        <DataTable
          columns={columns}
          data={produkList}
          loading={produkLoading}
          emptyMessage={tabKritis ? "Tidak ada produk dengan stok kritis." : "Belum ada produk. Silakan tambah produk baru."}
          paginasiServer={{
            halaman,
            jumlahHalaman: data?.pagination?.totalPages ?? 1,
            total: data?.pagination?.total ?? 0,
            ukuran,
            pilihanUkuran: PILIHAN_UKURAN_PRODUK,
            sibuk: produkMemuat,
            onGantiHalaman: setHalaman,
            onGantiUkuran: (berikut) => {
              setUkuran(berikut);
              setHalaman(1);
            },
          }}
        />
      </div>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">
              Hapus produk {deleteTarget?.namaProduk}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Tindakan ini akan menghapus produk secara permanen dari sistem. 
              Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel 
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
              disabled={deleteMutation.isPending}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** useSearchParams (?tab=, LN16a) membutuhkan batas Suspense agar halaman tetap dapat dirender statis. */
export default function ProdukPage() {
  return (
    <Suspense fallback={null}>
      <IsiProdukPage />
    </Suspense>
  );
}
