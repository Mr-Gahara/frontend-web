"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { StockAdjustment } from "@/types/stockOpname";
import type { ColumnDef } from "@tanstack/react-table";
import type { LingkupLokasi } from "@/features/inventaris/cakupan";
import { useDebounce } from "@/hooks/use-debounce";
import { useHalamanStockAdjustment } from "./hooks";
import { PANJANG_CARI_ADJUSTMENT, paramHalamanAdjustment } from "./filter";
import { formatTanggalAdjustment } from "./tampilan";
import { TautanSumber } from "./tautan-sumber";
import { URL_DAFTAR_ADJUSTMENT, type RuangAdjustment } from "./ruang";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, Eye, Search } from "lucide-react";

const PILIHAN_UKURAN = [10, 20, 50] as const;

const TEKS: Record<RuangAdjustment, { judul: string; deskripsi: string }> = {
  outlet: {
    judul: "Jurnal Penyesuaian Stok",
    deskripsi: "Audit trail historis eksekusi perubahan saldo inventaris.",
  },
  gudang: {
    judul: "Jurnal Penyesuaian Stok Gudang",
    deskripsi: "Audit trail historis eksekusi perubahan saldo inventaris gudang.",
  },
};

interface Props {
  ruang: RuangAdjustment;
  /**
   * Lokasi atau tipe lokasi yang ditampilkan; keduanya dikirim ke server
   * (B109). Null selama lingkup belum siap.
   */
  lingkup: LingkupLokasi | null;
  /** True selama data yang menentukan lingkup (misalnya lokasi aktif) dimuat. */
  memuatLingkup?: boolean;
  /** Pengganti tabel bila lingkup tidak dapat ditentukan. */
  penghalang?: ReactNode;
  /** Pemilih lokasi di atas tabel (pemegang izin lintas outlet di ruang outlet). */
  pemilihLokasi?: ReactNode;
}

export default function HalamanDaftarStockAdjustment({
  ruang,
  lingkup,
  memuatLingkup = false,
  penghalang,
  pemilihLokasi,
}: Props) {
  const router = useRouter();
  const teks = TEKS[ruang];
  const urlDaftar = URL_DAFTAR_ADJUSTMENT[ruang];
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  // Mengganti lingkup atau pencarian kembali ke halaman 1, disesuaikan saat
  // render seperti Belanja Stok, agar halaman lama tidak sempat diminta.
  const kunciKriteria = JSON.stringify([lingkup, cariTertunda]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  // Lokasi, tipe lokasi, dan pencarian disaring server, sehingga halaman dan
  // total tetap benar (B105, B108, B109; keputusan rancangan butir 27). Stok
  // outlet dan gudang tidak dicampur (keputusan pemilik proyek, 22 September
  // 2026). Urutan mengikuti backend, terbaru dulu: mengurutkan di klien hanya
  // mengurutkan satu halaman.
  const params = lingkup ? paramHalamanAdjustment(lingkup, cariTertunda, halaman, ukuran) : null;
  const { data, isLoading, isError, isFetching } = useHalamanStockAdjustment(params);
  const adjustmentList = useMemo(() => data?.data ?? [], [data]);

  // --- COLUMNS DEFINITION ---
  const columns = useMemo<ColumnDef<StockAdjustment>[]>(
    () => [
      {
        accessorKey: "nomorAdjustment",
        header: () => <div className="text-xs font-bold text-navy/60">No. Jurnal</div>,
        cell: ({ row }) => (
          <span className="font-bold font-mono text-navy text-sm">
            {row.original.nomorAdjustment}
          </span>
        ),
      },
      {
        accessorKey: "tanggal",
        header: () => <div className="text-xs font-bold text-navy/60">Tanggal Eksekusi</div>,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-navy/70">
            {formatTanggalAdjustment(row.original.tanggal)}
          </span>
        ),
      },
      {
        id: "sumber",
        header: () => (
          <div className="text-xs font-bold text-navy/60">Sumber</div>
        ),
        cell: ({ row }) => (
          <TautanSumber
            adjustment={row.original}
            className="text-sm font-bold text-navy"
          />
        ),
      },
      {
        id: "aksi",
        header: () => (
          <div className="text-right text-xs font-bold text-navy/60">Aksi</div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer bg-gading border-navy/20 text-navy hover:bg-navy/5 font-bold shadow-sm h-8 px-3"
              onClick={() => router.push(`${urlDaftar}/${row.original.id}`)}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Lihat Audit Trail
            </Button>
          </div>
        ),
      },
    ],
    [router, urlDaftar],
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gading border border-navy/10 rounded-lg shadow-sm hidden sm:block">
          <Scale className="w-6 h-6 text-navy" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            {teks.judul}
          </h1>
          <p className="text-sm font-medium text-navy/60">
            {teks.deskripsi}
          </p>
        </div>
      </div>

      {pemilihLokasi}

      {/* DATA TABLE SECTION */}
      {penghalang ?? (
        <div className="flex w-full flex-col gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
            <Input
              type="search"
              aria-label="Cari nomor jurnal"
              placeholder="Cari nomor jurnal..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              maxLength={PANJANG_CARI_ADJUSTMENT}
              className="h-10 pl-9 bg-white border-navy/20 text-navy"
            />
          </div>
          <DataTable
            columns={columns}
            data={adjustmentList}
            loading={isLoading || memuatLingkup}
            emptyMessage={
              isError
                ? "Gagal memuat jurnal penyesuaian stok. Coba muat ulang halaman."
                : "Belum ada riwayat penyesuaian stok."
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
      )}
    </div>
  );
}
