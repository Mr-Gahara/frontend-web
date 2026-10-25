"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { PengajuanStok } from "@/types/pengajuanStok";
import type { LingkupLokasi } from "@/features/inventaris/cakupan";
import { useSession } from "@/lib/auth/useSession";
import { useDaftarPengajuanStok } from "./hooks";
import { cocokTab, saringPengajuan, statusServerTab, type FilterArah } from "./filter";
import { arahLokasi } from "./arah";
import { tabTerlihat, type TabPengajuan } from "./izin";
import { tahapPengajuan, type TahapPengajuan } from "./tahap";
import { LABEL_ARAH_PENGAJUAN, SLUG_TAB_PENGAJUAN, labelTabPengajuan, labelTahapPengajuan } from "./tampilan";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  MoreHorizontal,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useTabUrl } from "@/hooks/use-tab-url";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (tahap: TahapPengajuan, label: string) => {
  switch (tahap) {
    case "DRAFT":
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-bold">{label}</Badge>;
    case "SUBMITTED":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold"><Clock className="w-3 h-3 mr-1" /> {label}</Badge>;
    case "PERLU_SURAT_JALAN":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> {label}</Badge>;
    case "SURAT_JALAN_DIBUAT":
      return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none font-bold">{label}</Badge>;
    case "COMPLETED":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold">{label}</Badge>;
    case "REJECTED":
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none font-bold"><XCircle className="w-3 h-3 mr-1" /> {label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

/** Pilihan baris per halaman (DataTable opt-in, pemilik proyek 17 Oktober 2026). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

interface TeksRuang {
  judul: string;
  deskripsi: string;
  urlDaftar: string;
  urlBuat: string | null;
  tab: readonly TabPengajuan[];
  tabBawaan: TabPengajuan;
  placeholderCari: string;
  kolomInfo: string;
  kolomLokasi: string;
  kolomItem: string;
  kosong: string;
}

const TEKS: Record<"outlet" | "gudang", TeksRuang> = {
  outlet: {
    judul: "Pengajuan Stok Barang",
    deskripsi: "Kelola permintaan stok dari gudang dan pengembalian stok ke gudang.",
    urlDaftar: "/dashboard/outlet/inventaris/pengajuanStok",
    urlBuat: "/dashboard/outlet/inventaris/pengajuanStok/buatPengajuan",
    tab: ["ALL", "DRAFT", "SUBMITTED", "DISETUJUI", "REJECTED", "COMPLETED"],
    tabBawaan: "ALL",
    placeholderCari: "Cari No. Pengajuan...",
    kolomInfo: "Informasi Pengajuan",
    kolomLokasi: "Rute",
    kolomItem: "Item",
    kosong: "Tidak ada data pengajuan stok yang ditemukan.",
  },
  gudang: {
    judul: "Inbox Permintaan Stok",
    deskripsi: "Tinjau permintaan stok dari outlet dan pengembalian stok ke gudang.",
    urlDaftar: "/dashboard/gudang/pengajuanStok",
    urlBuat: null,
    tab: ["SUBMITTED", "PERLU_SURAT_JALAN", "COMPLETED", "REJECTED", "ALL"],
    tabBawaan: "SUBMITTED",
    placeholderCari: "Cari No. Pengajuan / Outlet...",
    kolomInfo: "Nomor & Tanggal",
    kolomLokasi: "Rute",
    kolomItem: "Jumlah Item",
    kosong: "Belum ada permintaan stok di kategori ini.",
  },
};

interface Props {
  ruang: keyof typeof TEKS;
  /** null selama cakupan lokasi belum siap: belum ada permintaan. */
  lingkup: LingkupLokasi | null;
  memuatLingkup?: boolean;
  /** Pemilih lokasi di samping pencarian (owner di ruang outlet). */
  pemilihLokasi?: ReactNode;
  /** Pesan pengganti bila lokasi gagal dimuat atau belum dikonfigurasi. */
  penghalang?: ReactNode;
}

function IsiDaftarPengajuanStok({
  ruang,
  lingkup,
  memuatLingkup = false,
  pemilihLokasi,
  penghalang,
}: Props) {
  const router = useRouter();
  const teks = TEKS[ruang];
  const urlBuat = teks.urlBuat;
  const { permissions } = useSession();
  // Tab status yang selalu kosong bagi pengguna ini disembunyikan (izin.ts).
  const tabTampil = tabTerlihat(teks.tab, permissions ?? []);
  
  // --- States ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterArah, setFilterArah] = useState<FilterArah>("SEMUA");
  // Tab dari ?tab= (lib/tab-url.ts); tab yang disembunyikan izin tidak dapat dibuka lewat URL.
  const [activeTab, setActiveTab] = useTabUrl(SLUG_TAB_PENGAJUAN[ruang], tabTampil, teks.tabBawaan);

  // --- Queries ---
  // Lingkup null berarti cakupan lokasi belum siap: belum ada permintaan.
  const {
    data: daftarPengajuan = [],
    isLoading: memuatDaftar,
    isError,
  } = useDaftarPengajuanStok(
    lingkup
      ? { status: statusServerTab(activeTab), locationID: lingkup.locationID }
      : null,
  );
  const isLoading = memuatLingkup || memuatDaftar;

  // Penyaringan per ruang (tipe lokasi, draf, pencarian) dan per tab (tab gabungan
  // meminta tanpa status): features/pengajuan-stok/filter.ts
  const filteredData = saringPengajuan(daftarPengajuan, ruang, debouncedSearch, filterArah).filter((p) =>
    cocokTab(p, activeTab, ruang),
  );

  // Aksi baris di menu titik tiga (TB7a, P-A): langsung membuka halaman detail.
  const kolom = useMemo<ColumnDef<PengajuanStok>[]>(
    () => [
      {
        id: "info",
        header: teks.kolomInfo,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold font-mono text-navy">{row.original.nomorPengajuan}</span>
            <span className="text-xs font-medium text-navy/50 mt-1">
              {formatTanggal(row.original.createdAt)}
            </span>
          </div>
        ),
      },
      {
        id: "arah",
        header: "Arah",
        cell: ({ row }) => {
          const arah = arahLokasi(row.original.dariLokasi, row.original.keLokasi);
          if (!arah) return <span className="text-navy/50">-</span>;
          return (
            <Badge
              className={
                arah === "OUTLET_KE_GUDANG"
                  ? "bg-karamel/20 hover:bg-karamel/20 text-navy border border-karamel font-bold"
                  : "bg-navy/10 hover:bg-navy/10 text-navy border border-transparent font-bold"
              }
            >
              {LABEL_ARAH_PENGAJUAN[arah]}
            </Badge>
          );
        },
      },
      {
        id: "lokasi",
        header: teks.kolomLokasi,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-navy/80">
              {row.original.dariLokasi?.nama || "-"} ke {row.original.keLokasi?.nama || "-"}
            </span>
            {ruang === "gudang" && (
              <span className="text-xs font-medium text-navy/50 capitalize mt-1">
                Pembuat: {row.original.dimintaOleh?.nama || "-"}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "item",
        header: teks.kolomItem,
        cell: ({ row }) => (
          <span className="font-bold text-navy bg-navy/5 px-3 py-1 rounded-lg">
            {row.original.items?.length || 0} Macam
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          return getStatusBadge(tahapPengajuan(row.original), labelTahapPengajuan(ruang, row.original));
        },
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const label =
            ruang === "gudang"
              ? "Tinjau"
              : row.original.status === "DRAFT"
                ? "Lanjutkan draft"
                : "Lihat detail";
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
                    <span className="sr-only">Buka menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gading border-navy/10">
                  <DropdownMenuItem
                    className="cursor-pointer font-bold text-navy/80"
                    onClick={() => router.push(`${teks.urlDaftar}/${row.original.id}`)}
                  >
                    {label}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [ruang, teks, router],
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            {ruang === "gudang" && <Inbox className="w-6 h-6 text-karamel" />}
            {teks.judul}
          </h1>
          <p className="text-sm font-medium text-navy/60">
            {teks.deskripsi}
          </p>
        </div>
        {urlBuat && (
          <Button
            onClick={() => router.push(urlBuat)}
            className="bg-karamel text-navy hover:bg-karamel/90 font-bold shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Buat Pengajuan Baru
          </Button>
        )}
      </div>

      {penghalang}

      {/* FILTER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 pb-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {tabTampil.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              aria-pressed={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 font-bold transition-all text-xs ${
                activeTab === tab
                  ? "bg-navy text-white hover:bg-navy/90"
                  : "text-navy/60 hover:text-navy hover:bg-navy/5"
              }`}
            >
              {labelTabPengajuan(ruang, tab)}
            </Button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:items-end">
        {pemilihLokasi}
        <Select value={filterArah} onValueChange={(v) => setFilterArah(v as FilterArah)}>
          <SelectTrigger aria-label="Filter arah" className="w-full sm:w-44 bg-white border-navy/20 text-navy focus:ring-navy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua arah</SelectItem>
            <SelectItem value="GUDANG_KE_OUTLET">{LABEL_ARAH_PENGAJUAN.GUDANG_KE_OUTLET}</SelectItem>
            <SelectItem value="OUTLET_KE_GUDANG">{LABEL_ARAH_PENGAJUAN.OUTLET_KE_GUDANG}</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            placeholder={teks.placeholderCari}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-navy/20 text-navy focus-visible:ring-navy"
          />
        </div>
        </div>
      </div>

      {/* TABEL: DataTable, kartu per baris (TB1a sampai TB7a) */}
      {isError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat pengajuan stok. Periksa koneksi, lalu muat ulang halaman.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredData}
          loading={isLoading}
          emptyMessage={teks.kosong}
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}
    </div>
  );
}

/** useSearchParams membutuhkan batas Suspense agar halaman tetap dapat dirender statis. */
export default function HalamanDaftarPengajuanStok(props: Props) {
  return (
    <Suspense fallback={null}>
      <IsiDaftarPengajuanStok {...props} />
    </Suspense>
  );
}
