"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { StatusPengajuan } from "@/types/pengajuanStok";
import type { LingkupLokasi } from "@/features/inventaris/cakupan";
import { useSession } from "@/lib/auth/useSession";
import { useDaftarPengajuanStok } from "./hooks";
import { saringPengajuan } from "./filter";
import { tabTerlihat, type TabPengajuan } from "./izin";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  PlusCircle,
  PackageSearch,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  ArrowRight,
  Eye,
  Inbox
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (status: StatusPengajuan, label: string) => {
  switch (status) {
    case "DRAFT":
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-bold">{label}</Badge>;
    case "SUBMITTED":
    case "PENDING":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold"><Clock className="w-3 h-3 mr-1" /> {label}</Badge>;
    case "APPROVED":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> {label}</Badge>;
    case "COMPLETED":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold">{label}</Badge>;
    case "REJECTED":
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none font-bold"><XCircle className="w-3 h-3 mr-1" /> {label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

interface TeksRuang {
  judul: string;
  deskripsi: string;
  urlDaftar: string;
  urlBuat: string | null;
  tab: readonly TabPengajuan[];
  tabBawaan: TabPengajuan;
  labelTab: Partial<Record<TabPengajuan, string>>;
  labelStatus: Partial<Record<StatusPengajuan, string>>;
  placeholderCari: string;
  kolomInfo: string;
  kolomLokasi: string;
  kolomItem: string;
  kosong: string;
}

const TEKS: Record<"outlet" | "gudang", TeksRuang> = {
  outlet: {
    judul: "Pengajuan Stok Barang",
    deskripsi: "Kelola permintaan suplai bahan baku dan barang jadi ke Gudang Pusat.",
    urlDaftar: "/dashboard/outlet/inventaris/pengajuanStok",
    urlBuat: "/dashboard/outlet/inventaris/pengajuanStok/buatPengajuan",
    tab: ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"],
    tabBawaan: "ALL",
    labelTab: { ALL: "Semua Status", SUBMITTED: "MENUNGGU" },
    labelStatus: { DRAFT: "Draft", SUBMITTED: "Menunggu", PENDING: "Menunggu", APPROVED: "Disetujui", COMPLETED: "Selesai", REJECTED: "Ditolak" },
    placeholderCari: "Cari No. Pengajuan...",
    kolomInfo: "Informasi Pengajuan",
    kolomLokasi: "Gudang Asal",
    kolomItem: "Item",
    kosong: "Tidak ada data pengajuan stok yang ditemukan.",
  },
  gudang: {
    judul: "Inbox Permintaan Stok",
    deskripsi: "Tinjau dan proses permintaan pasokan barang dari berbagai Outlet.",
    urlDaftar: "/dashboard/gudang/pengajuanStok",
    urlBuat: null,
    tab: ["SUBMITTED", "APPROVED", "COMPLETED", "REJECTED", "ALL"],
    tabBawaan: "SUBMITTED",
    labelTab: { ALL: "Semua", SUBMITTED: "PERLU TINJAUAN" },
    labelStatus: { SUBMITTED: "Perlu Tinjauan", PENDING: "Perlu Tinjauan", APPROVED: "Siap Dikirim", COMPLETED: "Selesai", REJECTED: "Ditolak" },
    placeholderCari: "Cari No. Pengajuan / Outlet...",
    kolomInfo: "Nomor & Tanggal",
    kolomLokasi: "Outlet Peminta",
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

export default function HalamanDaftarPengajuanStok({
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
  const [activeTab, setActiveTab] = useState<TabPengajuan>(teks.tabBawaan);

  // --- Queries ---
  // Lingkup null berarti cakupan lokasi belum siap: belum ada permintaan.
  const {
    data: daftarPengajuan = [],
    isLoading: memuatDaftar,
    isError,
  } = useDaftarPengajuanStok(
    lingkup
      ? { status: activeTab !== "ALL" ? activeTab : undefined, locationID: lingkup.locationID }
      : null,
  );
  const isLoading = memuatLingkup || memuatDaftar;

  // Penyaringan per ruang (tipe lokasi, draf, pencarian): features/pengajuan-stok/filter.ts
  const filteredData = saringPengajuan(daftarPengajuan, ruang, debouncedSearch);

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947] flex items-center gap-2">
            {ruang === "gudang" && <Inbox className="w-6 h-6 text-[#D4A373]" />}
            {teks.judul}
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            {teks.deskripsi}
          </p>
        </div>
        {urlBuat && (
          <Button
            onClick={() => router.push(urlBuat)}
            className="bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Buat Pengajuan Baru
          </Button>
        )}
      </div>

      {penghalang}

      {/* FILTER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#0A2947]/10 pb-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {tabTampil.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 font-bold transition-all text-xs ${
                activeTab === tab
                  ? "bg-[#0A2947] text-white hover:bg-[#0A2947]/90"
                  : "text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-[#0A2947]/5"
              }`}
            >
              {teks.labelTab[tab] ?? tab}
            </Button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:items-end">
        {pemilihLokasi}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder={teks.placeholderCari}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947]"
          />
        </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F2EAE1] text-xs uppercase font-bold text-[#0A2947]/70">
              <tr>
                <th className="px-6 py-4">{teks.kolomInfo}</th>
                <th className="px-6 py-4">{teks.kolomLokasi}</th>
                <th className="px-6 py-4 text-center">{teks.kolomItem}</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40 bg-[#0A2947]/10 mb-2" /><Skeleton className="h-4 w-24 bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 mx-auto bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 mx-auto bg-[#0A2947]/10 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto bg-[#0A2947]/10" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-rose-600 font-medium">
                    Gagal memuat pengajuan stok. Periksa koneksi, lalu muat ulang halaman.
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#0A2947]/50 font-medium">
                    <PackageSearch className="w-12 h-12 mx-auto mb-3 text-[#0A2947]/20" />
                    {teks.kosong}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FFFAF3] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold font-mono text-[#0A2947]">
                          {item.nomorPengajuan}
                        </span>
                        <span className="text-xs font-medium text-[#0A2947]/50 mt-1">
                          {formatTanggal(item.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ruang === "outlet" ? (
                        <div className="flex items-center gap-2 font-medium text-[#0A2947]/80">
                          {item.dariLokasi?.nama || "Gudang Pusat"}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0A2947]">
                            {item.keLokasi?.nama || "Outlet Tidak Dikenal"}
                          </span>
                          <span className="text-xs font-medium text-[#0A2947]/50 capitalize mt-1">
                            Pembuat: {item.dimintaOleh?.nama || "-"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-[#0A2947] bg-[#0A2947]/5 px-3 py-1 rounded-lg">
                        {item.items?.length || 0} Macam
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(item.status, teks.labelStatus[item.status] ?? item.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={ruang === "gudang" && item.status === "SUBMITTED" ? "default" : "outline"}
                        size="sm"
                        onClick={() => router.push(`${teks.urlDaftar}/${item.id}`)}
                        className={ruang === "gudang" && item.status === "SUBMITTED" ? "bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold shadow-sm cursor-pointer" : "cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm"}
                      >
                        {ruang === "gudang" ? (
                          <><Eye className="w-4 h-4 mr-2" /> Tinjau</>
                        ) : item.status === "DRAFT" ? (
                          <><FileEdit className="w-4 h-4 mr-2 text-[#D4A373]" /> Lanjutkan Draft</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Detail</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}