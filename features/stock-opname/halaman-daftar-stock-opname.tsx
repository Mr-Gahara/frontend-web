"use client";

import { useState, useMemo, type ReactNode } from "react";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihanPeriode, PilihanPil } from "@/components/filter/panel-filter";
import { DialogUnduhBulan } from "@/components/unduh/dialog-unduh-bulan";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { EP } from "@/lib/api/endpoints";
import { labelFilterEkspor, paramEkspor, unduhDaftar } from "@/lib/unduh";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useRouter } from "next/navigation";
import { StockOpname, StatusOpname } from "@/types/stockOpname";
import type { LingkupLokasi } from "@/features/inventaris/cakupan";
import { useDebounce } from "@/hooks/use-debounce";
import { useHalamanStockOpname } from "./hooks";
import {
  OPSI_STATUS_OPNAME,
  PANJANG_CARI_OPNAME,
  paramHalamanOpname,
  pilFilterOpname,
  pilPeriodeDaftar,
  type PeriodeDaftar,
} from "./filter";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Plus,
  Eye,
} from "lucide-react";

const PILIHAN_UKURAN = [10, 20, 50] as const;

// --- HELPERS ---
const formatTanggal = (iso: string) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const badgeStatusOpname = (status: StatusOpname) => {
  const map: Record<StatusOpname, string> = {
    DRAFT: "bg-karamel text-navy border-none shadow-sm", // Mustard
    SUBMITTED: "bg-blue-100 text-blue-700 border-none shadow-sm", // Soft Blue
    APPROVED: "bg-sage text-gading border-none shadow-sm", // Sage Green
    REJECTED: "bg-rose-100 text-rose-700 border-none shadow-sm", // Light Red
    CANCELLED: "bg-navy/10 text-navy/60 border-none shadow-sm", // Navy Muted
  };

  const labels: Record<StatusOpname, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Menunggu Review",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  };

  const className = map[status] || "bg-navy/5 text-navy/60";
  return (
    <Badge className={`${className} px-2.5 py-0.5 font-bold`}>
      {labels[status] || status}
    </Badge>
  );
};

const TEKS = {
  outlet: {
    judul: "Stok Opname",
    deskripsi: "Kelola perhitungan fisik stok dan sinkronisasi saldo inventaris.",
    tombolBuat: "Buat Opname Baru",
    urlDaftar: "/dashboard/outlet/inventaris/stockOpname",
  },
  gudang: {
    judul: "Stok Opname Gudang",
    deskripsi: "Kelola dan pantau dokumen perhitungan fisik stok untuk Gudang Pusat.",
    tombolBuat: "Buat Opname Gudang",
    urlDaftar: "/dashboard/gudang/stockOpname",
  },
} as const;

interface Props {
  ruang: keyof typeof TEKS;
  /** null selama cakupan lokasi belum diketahui. */
  lingkup: LingkupLokasi | null;
  /** True selama data yang menentukan lingkup masih dimuat. */
  memuatLingkup?: boolean;
  /** Pemilih lokasi, ditampilkan di samping filter status (owner di ruang outlet). */
  pemilihLokasi?: ReactNode;
  /** Pesan yang ditampilkan di atas filter bila daftar tidak dapat dimuat. */
  penghalang?: ReactNode;
}

export default function HalamanDaftarStockOpname({
  ruang,
  lingkup,
  memuatLingkup = false,
  pemilihLokasi,
  penghalang,
}: Props) {
  const router = useRouter();
  const teks = TEKS[ruang];

  // --- STATE FILTER ---
  const [statusFilter, setStatusFilter] = useState<StatusOpname | "ALL">("ALL");
  // Periode dibuat (B356; pemilik proyek, 23 November 2026): kosong berarti seluruhnya.
  const [periode, setPeriode] = useState<PeriodeDaftar>({});
  const hariIni = useTanggalHariIni();
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  // Mengganti lingkup, status, atau pencarian kembali ke halaman 1, disesuaikan
  // saat render seperti Belanja Stok, agar halaman lama tidak sempat diminta.
  const kunciKriteria = JSON.stringify([lingkup, statusFilter, cariTertunda, periode]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  // --- QUERY FETCH DATA ---
  // Lokasi atau tipe lokasi, status, dan pencarian disaring server, sehingga
  // halaman dan total tetap benar (B106, B108, B109; keputusan rancangan butir 27).
  // Urutan mengikuti backend, terbaru dulu: mengurutkan di klien hanya
  // mengurutkan satu halaman.
  const params = lingkup ? paramHalamanOpname(lingkup, statusFilter, cariTertunda, halaman, ukuran, periode) : null;
  const { data, isLoading: memuatOpname, isError, isFetching } = useHalamanStockOpname(params);
  const opnameList = useMemo(() => data?.data ?? [], [data]);
  const isLoading = memuatOpname || memuatLingkup;

  type FilterPanelOpname = { status: StatusOpname | "ALL" } & PeriodeDaftar;
  const terapkanPanel = (f: FilterPanelOpname) => {
    setStatusFilter(f.status);
    setPeriode({ dari: f.dari, sampai: f.sampai });
  };
  const panel = usePanelFilter<FilterPanelOpname>({
    terapan: { status: statusFilter, ...periode },
    bawaan: { status: "ALL" },
    onTerapkan: terapkanPanel,
  });
  const jumlahAktif = (f: FilterPanelOpname) => (f.status === "ALL" ? 0 : 1) + (f.dari || f.sampai ? 1 : 0);
  const pilAktif = [
    ...pilFilterOpname(statusFilter, setStatusFilter),
    ...pilPeriodeDaftar(periode, hariIni, () => setPeriode({})),
  ];

  // --- COLUMNS DEFINITION ---
  const columns = useMemo<ColumnDef<StockOpname>[]>(
    () => [
      {
        accessorKey: "nomorOpname",
        meta: { label: "No. Opname" },
        header: () => <span className="text-kecil font-bold text-navy/60">No. Opname</span>,
        cell: ({ row }) => (
          <span className="font-bold font-mono text-navy text-kecil sm:text-isi">
            {row.original.nomorOpname}
          </span>
        ),
      },
      {
        accessorKey: "tanggal",
        meta: { label: "Tanggal Dibuat", sembunyiHp: true },
        header: () => (
          <span className="text-kecil font-bold text-navy/60 hidden sm:inline">Tanggal Dibuat</span>
        ),
        cell: ({ row }) => (
          <span className="text-kecil sm:text-isi font-medium text-navy/70">
            {formatTanggal(row.original.tanggal || row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "lokasi",
        meta: { label: "Lokasi", sembunyiHp: true },
        header: () => (
          <span className="text-kecil font-bold text-navy/60 hidden md:inline">
            Lokasi
          </span>
        ),
        cell: ({ row }) => (
          <span className="max-md:tabel:hidden text-kecil sm:text-isi font-medium text-navy/80">
            {row.original.lokasi?.nama || "Lokasi Tidak Diketahui"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        meta: { label: "Status" },
        header: () => (
          <span className="text-kecil font-bold text-navy/60">Status</span>
        ),
        cell: ({ row }) => badgeStatusOpname(row.original.status),
      },
      {
        id: "aksi",
        header: () => (
          <div className="text-right text-kecil font-bold text-navy/60">
            Aksi
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer bg-gading border-navy/20 text-navy hover:bg-navy/5 font-bold shadow-sm h-8 px-3"
              onClick={() => router.push(`${teks.urlDaftar}/${row.original.id}`)}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Detail
            </Button>
          </div>
        ),
      },
    ],
    [router, teks.urlDaftar],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shadow-sm hidden sm:block">
            <ClipboardCheck className="w-6 h-6 text-navy" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-judul font-bold tracking-tight text-navy truncate">
              {teks.judul}
            </h1>
            <p className="text-kecil sm:text-isi font-medium text-navy/60 hidden sm:block">
              {teks.deskripsi}
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          {/* Ekspor satu baris per bahan beserta selisihnya, per bulan (B357, P85). */}
          {lingkup && (
            <DialogUnduhBulan
              namaData="stock opname"
              filterAktif={labelFilterEkspor(pilAktif, { label: "No. opname", nilai: cariTertunda })}
              unduh={({ format, bulan }) =>
                unduhDaftar(
                  EP.stockOpname.list,
                  { ...paramEkspor(paramHalamanOpname(lingkup, statusFilter, cariTertunda, 1, 1)), format, bulan: bulan! },
                  `stock-opname_${bulan}.${format}`,
                )
              }
            />
          )}
          <Button
            onClick={() =>
              router.push(`${teks.urlDaftar}/buatStockOpname`)
            }
            size="aksi"
            className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{teks.tombolBuat}</span>
          </Button>
        </div>
      </div>

      {penghalang}

      {pemilihLokasi}
      <BilahFilter
        cari={{
          id: `cari-opname-${ruang}`,
          label: "Cari No. Opname",
          placeholder: "Cari no. opname...",
          value: cari,
          onChange: (v) => setCari(v.slice(0, PANJANG_CARI_OPNAME)),
        }}
        jumlahAktif={jumlahAktif({ status: statusFilter, ...periode })}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={pilAktif}
        onAturUlangSemua={() => terapkanPanel({ status: "ALL" })}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahAktif(panel.draf)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        <KelompokFilter judul="Status">
          <PilihanPil
            label="Status"
            nilai={panel.draf.status === "ALL" ? undefined : panel.draf.status}
            opsi={OPSI_STATUS_OPNAME}
            onUbah={(status) => panel.setDraf({ ...panel.draf, status: status ?? "ALL" })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Periode">
          <PilihanPeriode
            idAwalan={`filter-opname-${ruang}`}
            hariIni={hariIni}
            labelDari="Dibuat dari"
            labelSampai="Dibuat sampai"
            batasiUrutan
            rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
            onUbah={({ dari, sampai }) => panel.setDraf({ ...panel.draf, dari, sampai })}
          />
        </KelompokFilter>
      </PanelFilter>

      {/* DATA TABLE SECTION */}
      <div className="w-full">
        <DataTable
          columns={columns}
          data={opnameList}
          loading={isLoading}
          emptyMessage={
            isError
              ? "Gagal memuat stok opname. Coba muat ulang halaman."
              : "Belum ada data stok opname."
          }
          paginasiServer={{
            halaman,
            jumlahHalaman: data?.pagination?.totalPages ?? 1,
            total: data?.pagination?.total ?? 0,
            ukuran,
            pilihanUkuran: PILIHAN_UKURAN,
            sibuk: isFetching,
            onGantiHalaman: setHalaman,
            onGantiUkuran: (berikut) => {
              setUkuran(berikut);
              setHalaman(1);
            },
          }}
        />
      </div>
    </div>
  );
}
