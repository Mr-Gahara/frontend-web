"use client";

import { TeksDuaBaris } from "@/components/ui/teks-dua-baris";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihanPeriode, PilihanPil, PilihanSegmen } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useDebounce } from "@/hooks/use-debounce";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { dariTanggalLokal, keTanggalLokal } from "@/lib/waktu";

import { Suspense, useState, useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { pesanError } from "@/lib/api/error";
import { DialogUnduhBulan } from "@/components/unduh/dialog-unduh-bulan";
import { EP } from "@/lib/api/endpoints";
import { labelFilterEkspor, paramEkspor, unduhDaftar } from "@/lib/unduh";
import { useDaftarPenjualan, useHapusPenjualan, useVoidPenjualan } from "./hooks";
import {
  PILIHAN_UKURAN_HALAMAN,
  filterServerPenjualan,
  paramLingkupPenjualan,
  paramUrutanPenjualan,
  UKURAN_HALAMAN_BAWAAN,
  type LingkupPenjualan,
  type UkuranHalaman,
} from "./filter";
import { aksiPenjualan } from "./izin";
import { DialogVoidPenjualan } from "./dialog-void-penjualan";
import { TAMPILAN_STATUS_PENJUALAN, URUTAN_STATUS_PENJUALAN } from "./tampilan";
import {
  FILTER_KOSONG,
  PARAM_STATUS_URL,
  filterDariUrl,
  OPSI_METODE_PENJUALAN,
  OPSI_TIPE_TRANSAKSI,
  jumlahFilterAktif,
  pilFilterPenjualan,
  type FilterPanelPenjualan,
} from "./filter-panel";
import { useSession } from "@/lib/auth/useSession";
import { Penjualan, StatusPenjualan } from "@/types/penjualan";
import { ColumnDef, type SortingState } from "@tanstack/react-table";
import { KepalaUrut } from "@/components/ui/kepala-urut";
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
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Plus,
  ReceiptText,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

const formatTanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// --- BADGE STATUS (satu status sejak backend 465b438) ---
const badgeStatus = (status: StatusPenjualan) => {
  const tampilan = TAMPILAN_STATUS_PENJUALAN[status];
  return (
    <Badge className={`${tampilan?.kelas ?? "bg-muted"} px-2.5 py-0.5 font-bold shadow-sm`}>
      {tampilan?.label ?? status}
    </Badge>
  );
};


interface PropsHalamanDaftarPenjualan {
  /** Lingkup outlet dari halaman; null berarti sesi atau lokasi belum siap. */
  lingkup: LingkupPenjualan | null;
  /** Pengganti tabel bila lokasi gagal dimuat atau belum dikonfigurasi. */
  penghalang?: ReactNode;
  /** Pemilih outlet bagi pemegang izin lintas outlet. */
  pemilihLokasi?: ReactNode;
}

function IsiDaftarPenjualan({
  lingkup,
  penghalang,
  pemilihLokasi,
}: PropsHalamanDaftarPenjualan) {
  const router = useRouter();
  const { permissions } = useSession();

  const hariIni = useTanggalHariIni();
  // Filter awal dari ?status= (LN9a, LN18a). Tautan lonceng ke halaman yang
  // sedang terbuka mengganti filter, disesuaikan saat render seperti lingkup.
  const statusUrl = useSearchParams().get(PARAM_STATUS_URL);
  const [appliedFilters, setAppliedFilters] = useState<FilterPanelPenjualan>(() => filterDariUrl(statusUrl));
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [statusUrlTerakhir, setStatusUrlTerakhir] = useState(statusUrl);
  if (statusUrlTerakhir !== statusUrl) {
    setStatusUrlTerakhir(statusUrl);
    setAppliedFilters(filterDariUrl(statusUrl));
    setHalaman(1);
  }
  const [ukuranHalaman, setUkuranHalaman] = useState<UkuranHalaman>(UKURAN_HALAMAN_BAWAAN);
  // Urutan per kolom diterapkan server (keputusan PB14a, backend yoga).
  const [urutan, setUrutan] = useState<SortingState>([]);
  // Mengganti outlet kembali ke halaman 1, seperti mengganti jumlah baris dan
  // urutan; filter dan urutan dipertahankan (keputusan LP1a). Disesuaikan saat
  // render, bukan lewat effect, agar halaman lama tidak sempat diminta untuk
  // lingkup baru.
  const kunciLingkup = lingkup?.jenis === "lokasi" ? lingkup.locationID : (lingkup?.jenis ?? "");
  const [lingkupTerakhir, setLingkupTerakhir] = useState(kunciLingkup);
  if (lingkupTerakhir !== kunciLingkup) {
    setLingkupTerakhir(kunciLingkup);
    setHalaman(1);
  }
  // Pencarian nomor referensi berlaku sendiri setelah jeda, di luar panel
  // (FL1a), dan kembali ke halaman 1 seperti filter lain.
  const [cariTerakhir, setCariTerakhir] = useState(cariTertunda);
  if (cariTerakhir !== cariTertunda) {
    setCariTerakhir(cariTertunda);
    setHalaman(1);
  }

  const [deleteTarget, setDeleteTarget] = useState<Penjualan | null>(null);
  const [voidTarget, setVoidTarget] = useState<Penjualan | null>(null);

  const daftar = useDaftarPenjualan(
    { ...appliedFilters, noReferensi: cariTertunda.trim() },
    halaman,
    ukuranHalaman,
    lingkup !== null && !penghalang,
    urutan,
    paramLingkupPenjualan(lingkup),
  );
  // Lingkup outlet disaring server lewat locationID (keputusan RG4a), sehingga
  // baris, jumlah halaman, dan total data sama-sama berasal dari lingkup itu.
  const penjualanList = useMemo(
    () => (lingkup ? (daftar.data?.data ?? []) : []),
    [daftar.data, lingkup],
  );

  // Dialog hapus dan void hanya tertutup saat berhasil; saat gagal tetap
  // terbuka beserta pesannya (keputusan Fase 0).
  const deleteMutation = useHapusPenjualan({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Penjualan berhasil dihapus." });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error("Gagal Menghapus", {
        description: pesanError(err, "Gagal menghapus penjualan."),
      });
    },
  });

  const handleDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  };

  const updateStatusMutation = useVoidPenjualan({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Penjualan berhasil di-void." });
      setVoidTarget(null);
    },
    onError: (err) => {
      toast.error("Gagal Memproses", {
        description: pesanError(err, "Gagal melakukan void penjualan."),
      });
    },
  });

  const terapkanFilter = (nilai: FilterPanelPenjualan) => {
    setAppliedFilters(nilai);
    setHalaman(1);
  };
  const panel = usePanelFilter({ terapan: appliedFilters, bawaan: FILTER_KOSONG, onTerapkan: terapkanFilter });
  const pilAktif = pilFilterPenjualan(appliedFilters, hariIni, terapkanFilter);

  const columns = useMemo<ColumnDef<Penjualan>[]>(
    () => [
      {
        accessorKey: "noReferensi",
        meta: { label: "No. Referensi" },
        header: ({ column }) => <KepalaUrut column={column} judul="No. Referensi" />,
        cell: ({ row }) => (
          <span className="font-bold font-mono text-navy text-kecil sm:text-isi">
            {row.original.noReferensi}
          </span>
        ),
      },
      {
        accessorKey: "tanggalTransaksi",
        meta: { label: "Tanggal", sembunyiHp: true },
        header: ({ column }) => <KepalaUrut column={column} judul="Tanggal" className="hidden sm:inline-flex" />,
        cell: ({ row }) => (
          <span className="text-kecil sm:text-isi font-medium text-navy/70">
            {formatTanggal(row.original.tanggalTransaksi)}
          </span>
        ),
      },
      {
        accessorKey: "dataPelanggan",
        meta: { label: "Pelanggan", lebarBungkus: 180, sembunyiHp: true },
        header: () => (
          <span className="text-kecil font-bold text-navy/60 hidden md:inline">
            Pelanggan
          </span>
        ),
        cell: ({ row }) => (
          <TeksDuaBaris
            teks={row.original.dataPelanggan?.namaPelanggan ?? "-"}
            className="max-md:tabel:hidden text-isi font-medium text-navy/80 capitalize"
          />
        ),
      },
      {
        accessorKey: "totalTagihan",
        meta: { label: "Total" },
        header: ({ column }) => <KepalaUrut column={column} judul="Total" />,
        cell: ({ row }) => (
          <span className="font-bold text-navy text-kecil sm:text-isi font-mono">
            {formatRupiah(row.original.totalTagihan)}
          </span>
        ),
      },
      {
        accessorKey: "statusPenjualan",
        meta: { label: "Status" },
        header: () => (
          <span className="text-kecil font-bold text-navy/60">
            Status
          </span>
        ),
        cell: ({ row }) => badgeStatus(row.original.statusPenjualan),
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-kecil font-bold text-navy/60">Aksi</div>,
        cell: ({ row }) => {
          const aksi = aksiPenjualan(row.original, permissions);
          const targetId = row.original.id;

          return (
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
                <DropdownMenuContent align="end" className="w-48 bg-gading border-navy/10">
                  <DropdownMenuItem
                    className="cursor-pointer font-bold text-navy hover:bg-navy/5"
                    onClick={() =>
                      router.push(`/dashboard/outlet/penjualan/${targetId}`)
                    }
                  >
                    Lihat Detail
                  </DropdownMenuItem>

                  {aksi.bayar && (
                    <>
                      <DropdownMenuSeparator className="bg-navy/10" />
                      <DropdownMenuItem
                        className="cursor-pointer text-sage focus:text-sage focus:bg-sage/10 font-bold"
                        onClick={() =>
                          router.push(
                            `/dashboard/outlet/penjualan/${targetId}/pembayaran`,
                          )
                        }
                      >
                        Terima Pembayaran
                      </DropdownMenuItem>
                    </>
                  )}
                  {aksi.void && (
                    <>
                      <DropdownMenuSeparator className="bg-navy/10" />
                      <DropdownMenuItem
                        className="cursor-pointer text-karamel focus:text-karamel focus:bg-karamel/10 font-bold"
                        onClick={() => setVoidTarget(row.original)}
                      >
                        Void Penjualan
                      </DropdownMenuItem>
                    </>
                  )}
                  {aksi.hapus && (
                    <>
                      <DropdownMenuSeparator className="bg-navy/10" />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
                        onClick={() => setDeleteTarget(row.original)}
                      >
                        Hapus Permanen
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router, permissions],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shadow-sm hidden sm:block">
            <ReceiptText className="w-6 h-6 text-navy" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <h1 className="text-judul font-bold tracking-tight text-navy truncate">
              Data Penjualan
            </h1>
            <p className="text-kecil sm:text-isi font-medium text-navy/60 hidden sm:block">
              Kelola invoice penjualan dan pantau status pembayaran.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          {/* Ekspor per bulan dengan filter yang sama (B349, P85; pemilik proyek, 23 November 2026). */}
          {lingkup !== null && !penghalang && (
            <DialogUnduhBulan
              namaData="daftar penjualan"
              filterAktif={labelFilterEkspor(pilAktif, { label: "Nomor referensi", nilai: cariTertunda })}
              unduh={({ format, bulan }) =>
                unduhDaftar(
                  EP.penjualan.list,
                  {
                    ...paramEkspor(
                      {
                        ...filterServerPenjualan({ ...appliedFilters, noReferensi: cariTertunda.trim() }),
                        ...paramUrutanPenjualan(urutan),
                        ...paramLingkupPenjualan(lingkup),
                      },
                      ["startDate", "endDate"],
                    ),
                    format,
                    bulan: bulan!,
                  },
                  `penjualan_${bulan}.${format}`,
                )
              }
            />
          )}
          <Button
            onClick={() => router.push("/dashboard/outlet/penjualan/buatPenjualan")}
            size="aksi"
            className="w-full cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Buat Penjualan
          </Button>
        </div>
      </div>

      {pemilihLokasi}
      <BilahFilter
        cari={{
          id: "cari-penjualan",
          label: "Cari nomor referensi",
          placeholder: "Cari nomor referensi...",
          value: cari,
          onChange: setCari,
        }}
        jumlahAktif={jumlahFilterAktif(appliedFilters)}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={pilAktif}
        onAturUlangSemua={() => terapkanFilter(FILTER_KOSONG)}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahFilterAktif(panel.draf)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        <KelompokFilter judul="Status">
          <PilihanPil
            label="Status"
            nilai={panel.draf.statusPenjualan}
            opsi={URUTAN_STATUS_PENJUALAN.map((s) => ({ nilai: s, label: TAMPILAN_STATUS_PENJUALAN[s].label }))}
            onUbah={(statusPenjualan) => panel.setDraf({ ...panel.draf, statusPenjualan })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Tipe transaksi">
          <PilihanSegmen
            label="Tipe transaksi"
            nilai={panel.draf.jenisTransaksi}
            opsi={OPSI_TIPE_TRANSAKSI}
            onUbah={(jenisTransaksi) => panel.setDraf({ ...panel.draf, jenisTransaksi })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Metode penjualan">
          <PilihanSegmen
            label="Metode penjualan"
            nilai={panel.draf.jenisPenjualan}
            opsi={OPSI_METODE_PENJUALAN}
            onUbah={(jenisPenjualan) => panel.setDraf({ ...panel.draf, jenisPenjualan })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Periode">
          <PilihanPeriode
            idAwalan="filter-penjualan"
            hariIni={hariIni}
            rentang={{ dari: dariTanggalLokal(panel.draf.startDate), sampai: dariTanggalLokal(panel.draf.endDate) }}
            onUbah={({ dari, sampai }) =>
              panel.setDraf({
                ...panel.draf,
                startDate: dari ? keTanggalLokal(dari) : "",
                endDate: sampai ? keTanggalLokal(sampai) : "",
              })
            }
          />
        </KelompokFilter>
      </PanelFilter>

      {/* Tabel */}
      <div className="w-full">
        {penghalang ? (
          penghalang
        ) : daftar.isError ? (
          <p role="alert" className="py-10 text-center text-isi font-medium text-red-700">
            {pesanError(daftar.error, "Gagal memuat data penjualan.")}
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={penjualanList}
              loading={lingkup === null || daftar.isLoading}
              emptyMessage="Belum ada data penjualan."
              paginasiServer={{
                halaman,
                jumlahHalaman: daftar.data?.pagination?.totalPages ?? 1,
                total: daftar.data?.pagination?.total ?? 0,
                ukuran: ukuranHalaman,
                pilihanUkuran: PILIHAN_UKURAN_HALAMAN,
                sibuk: daftar.isFetching,
                onGantiHalaman: setHalaman,
                onGantiUkuran: (ukuran) => {
                  setUkuranHalaman(ukuran as UkuranHalaman);
                  setHalaman(1);
                },
              }}
              urutanServer={{
                urutan,
                onGantiUrutan: (berikut) => {
                  setUrutan(berikut);
                  setHalaman(1);
                },
              }}
            />
          </>
        )}
      </div>

      {/* DIALOG VOID */}
      <DialogVoidPenjualan
        noReferensi={voidTarget?.noReferensi}
        terbuka={!!voidTarget}
        memproses={updateStatusMutation.isPending}
        onTutup={() => setVoidTarget(null)}
        onKonfirmasi={(alasan) => {
          if (voidTarget) updateStatusMutation.mutate({ id: voidTarget.id, alasan });
        }}
      />

      {/* DIALOG HAPUS */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-gading border-navy/10 max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">
              Hapus penjualan {deleteTarget?.noReferensi}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Tindakan ini akan menghapus data penjualan secara permanen.
              Penjualan hanya dapat dihapus jika masih berstatus Draft. Apakah
              Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="cursor-pointer w-full sm:w-auto border-navy/20 text-navy hover:bg-navy/5 font-bold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold w-full sm:w-auto"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** useSearchParams (?status=, LN9a) membutuhkan batas Suspense agar halaman tetap dapat dirender statis. */
export default function HalamanDaftarPenjualan(props: PropsHalamanDaftarPenjualan) {
  return (
    <Suspense fallback={null}>
      <IsiDaftarPenjualan {...props} />
    </Suspense>
  );
}
