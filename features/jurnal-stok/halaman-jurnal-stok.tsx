"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { PANJANG_CARI_SERVER } from "@/features/inventaris/cakupan";
import type { JurnalStok } from "@/types/jurnalStok";
import { useHalamanJurnalStok } from "./hooks";
import {
  LABEL_ARAH_JURNAL,
  jumlahFilterJurnal,
  opsiAlasanJurnal,
  periodeAwalJurnal,
  paramHalamanJurnal,
  pilFilterJurnal,
  type FilterPanelJurnal,
} from "./filter";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { DialogUnduhBulan } from "@/components/unduh/dialog-unduh-bulan";
import { EP } from "@/lib/api/endpoints";
import { labelFilterEkspor, paramEkspor, unduhDaftar } from "@/lib/unduh";
import { KelompokFilter, PanelFilter, PilihanPeriode, PilihanPil, PilihanSegmen } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { formatWaktuJurnal, teksJumlahJurnal } from "./tampilan";
import { DialogRincianJurnal } from "./dialog-rincian-jurnal";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, MapPin, MoreHorizontal } from "lucide-react";

const TEKS = {
  outlet: {
    labelTransfer: "Suplai / Transfer",
    kolomAlasan: "Alasan / Konteks",
    kolomJumlah: "Pergerakan Angka",
    kosongJudul: "Buku Jurnal Kosong",
    kosongIsi: "Belum ada riwayat pergerakan barang di outlet ini.",
  },
  gudang: {
    labelTransfer: "Transfer Distribusi",
    kolomAlasan: "Alasan Jurnal",
    kolomJumlah: "Pergerakan Fisik",
    kosongJudul: "Tidak Ada Catatan Ditemukan",
    kosongIsi: "Belum ada pergerakan stok yang sesuai dengan filter Anda.",
  },
} as const;

const WARNA_ALASAN: Record<string, string> = {
  "Transfer Gudang": "bg-blue-50 text-blue-700 border-blue-200",
  "Stok Opname": "bg-amber-50 text-amber-700 border-amber-200",
  "Rusak/Hilang": "bg-rose-50 text-rose-700 border-rose-200",
  // Penjualan karamel dan Pembelian sage (pemilik proyek, 12 November 2026);
  // teks navy, karena karamel di atas latar muda kurang kontras.
  Penjualan: "bg-karamel/15 text-navy border-karamel/40",
  Pembelian: "bg-sage/15 text-navy border-sage/40",
};
const WARNA_ALASAN_LAIN = "bg-slate-50 text-slate-700 border-slate-200";

/** Pilihan baris per halaman (pemilik proyek 17 Oktober 2026); yang pertama menjadi ukuran awal. */
const PILIHAN_UKURAN = [10, 20, 50] as const;


interface Props {
  ruang: keyof typeof TEKS;
  /**
   * Lokasi yang jurnalnya ditampilkan; null selama lokasi belum diketahui.
   * GET /jurnalstok hanya menyaring satu locationID (B102).
   */
  lokasiID: string | null;
  /** Teks di bawah judul halaman. */
  deskripsi: ReactNode;
  /** Bila diisi, tampil menggantikan tabel dan seluruh filter dinonaktifkan. */
  penghalang?: ReactNode;
  /** True selama data yang menentukan lingkup (misalnya lokasi aktif) dimuat. */
  memuatLingkup?: boolean;
  /** Pemilih lokasi di bilah filter (owner di ruang outlet). */
  pemilihLokasi?: ReactNode;
}

export default function HalamanJurnalStok({
  ruang,
  lokasiID,
  deskripsi,
  penghalang,
  memuatLingkup = false,
  pemilihLokasi,
}: Props) {
  const teks = TEKS[ruang];
  const hariIni = useTanggalHariIni();
  // Periode bawaan bulan ini mengikuti hari ini dan tidak dihitung (FL11a).
  const bawaan = useMemo<FilterPanelJurnal>(() => ({ arah: "ALL", alasan: "ALL", ...periodeAwalJurnal(hariIni) }), [hariIni]);
  const [filter, setFilter] = useState<FilterPanelJurnal>(() => ({ arah: "ALL", alasan: "ALL", ...periodeAwalJurnal() }));
  const { arah, alasan } = filter;
  const periode = { dari: filter.dari, sampai: filter.sampai };
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  // Mengganti lokasi atau pencarian (yang ditunda) kembali ke halaman 1,
  // disesuaikan saat render, bukan lewat effect, agar halaman lama tidak
  // sempat diminta untuk kriteria baru.
  const kunciKriteria = JSON.stringify([lokasiID, cariTertunda]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  const { data, isLoading, isFetching, isError } = useHalamanJurnalStok(
    lokasiID
      ? { lokasiID, arah, alasan, dari: periode.dari, sampai: periode.sampai, cari: cariTertunda }
      : null,
    halaman,
    ukuran,
  );
  const daftar = useMemo(() => data?.data ?? [], [data]);

  /** Setiap perubahan filter kembali ke halaman 1. */
  const terapkanFilter = (baru: FilterPanelJurnal) => {
    setFilter(baru);
    setHalaman(1);
  };
  const panel = usePanelFilter({ terapan: filter, bawaan, onTerapkan: terapkanFilter });

  const memuat = isLoading || memuatLingkup;
  const nonaktif = Boolean(penghalang);
  const [dirinci, setDirinci] = useState<JurnalStok | null>(null);

  // Kolom ringkas (TB6a, J-A): pencatat dan keterangan utuh ada di dialog rincian.
  const kolom = useMemo<ColumnDef<JurnalStok>[]>(
    () => [
      {
        id: "barang",
        header: "Barang",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "font-bold",
                row.original.bahanBakuID ? "text-navy" : "text-rose-500 line-through",
              )}
            >
              {row.original.bahanBakuID?.namaBahan || "Master Data Terhapus"}
            </span>
            <span className="flex items-center gap-1 text-kecil font-medium text-navy/60">
              <MapPin className="h-3 w-3 text-karamel" aria-hidden="true" />
              {row.original.locationID?.nama || "Lokasi Tidak Diketahui"}
            </span>
          </div>
        ),
      },
      {
        id: "waktu",
        header: "Waktu",
        cell: ({ row }) => {
          const waktu = formatWaktuJurnal(row.original.tanggal);
          return (
            <div>
              <p className="font-medium text-navy">{waktu.tanggal}</p>
              <p className="text-kecil text-navy/60">Pukul {waktu.jam}</p>
            </div>
          );
        },
      },
      {
        id: "alasan",
        header: teks.kolomAlasan,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-mikro uppercase font-bold tracking-wider border",
              WARNA_ALASAN[row.original.alasan] ?? WARNA_ALASAN_LAIN,
            )}
          >
            {row.original.alasan}
          </Badge>
        ),
      },
      {
        id: "jumlah",
        header: () => <div className="text-right">{teks.kolomJumlah}</div>,
        meta: { label: teks.kolomJumlah },
        cell: ({ row }) => (
          <div
            className={cn(
              "text-right font-mono font-bold",
              row.original.tipeKoreksi === "Masuk" ? "text-emerald-700" : "text-red-800",
            )}
          >
            {teksJumlahJurnal(row.original)}
          </div>
        ),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
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
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gading border-navy/10">
                <DropdownMenuItem
                  className="cursor-pointer font-bold text-navy/80"
                  onClick={() => setDirinci(row.original)}
                >
                  Lihat detail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [teks],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-judul font-bold tracking-tight text-navy flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-karamel" />
            Buku Jurnal Stok
          </h1>
          <p className="text-isi font-medium text-navy/60">{deskripsi}</p>
        </div>
        {/* Ekspor jurnal stok satu bulan dengan filter yang sama (B355, P85). */}
        {lokasiID && (
          <DialogUnduhBulan
            namaData="jurnal stok"
            filterAktif={labelFilterEkspor(pilFilterJurnal(filter, bawaan, teks.labelTransfer, hariIni, terapkanFilter), {
              label: "Nama bahan",
              nilai: cariTertunda,
            })}
            unduh={({ format, bulan }) =>
              unduhDaftar(
                EP.jurnalStok,
                {
                  ...paramEkspor(
                    paramHalamanJurnal({ lokasiID, arah, alasan, dari: periode.dari, sampai: periode.sampai, cari: cariTertunda }, 1, 1),
                  ),
                  format,
                  bulan: bulan!,
                },
                `jurnal-stok_${bulan}.${format}`,
              )
            }
          />
        )}
      </div>

      {pemilihLokasi}
      <BilahFilter
        cari={{
          id: `cari-jurnal-${ruang}`,
          label: "Cari bahan",
          placeholder: "Cari nama bahan...",
          value: cari,
          onChange: (v) => setCari(v.slice(0, PANJANG_CARI_SERVER)),
        }}
        nonaktif={nonaktif}
        jumlahAktif={jumlahFilterJurnal(filter, bawaan)}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={pilFilterJurnal(filter, bawaan, teks.labelTransfer, hariIni, terapkanFilter)}
        onAturUlangSemua={() => terapkanFilter(bawaan)}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahFilterJurnal(panel.draf, bawaan)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        <KelompokFilter judul="Arah">
          <PilihanSegmen
            label="Arah"
            nilai={panel.draf.arah === "ALL" ? undefined : panel.draf.arah}
            opsi={(["Masuk", "Keluar"] as const).map((v) => ({ nilai: v, label: LABEL_ARAH_JURNAL[v] }))}
            onUbah={(arah) => panel.setDraf({ ...panel.draf, arah: arah ?? "ALL" })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Alasan">
          <PilihanPil
            label="Alasan"
            nilai={panel.draf.alasan === "ALL" ? undefined : panel.draf.alasan}
            opsi={opsiAlasanJurnal(teks.labelTransfer)}
            onUbah={(alasan) => panel.setDraf({ ...panel.draf, alasan: alasan ?? "ALL" })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Periode">
          <PilihanPeriode
            idAwalan={`filter-jurnal-${ruang}`}
            hariIni={hariIni}
            batasiUrutan
            wajib
            rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
            onUbah={({ dari, sampai }) =>
              panel.setDraf({ ...panel.draf, dari: dari ?? panel.draf.dari, sampai: sampai ?? panel.draf.sampai })
            }
          />
        </KelompokFilter>
      </PanelFilter>

      <DialogRincianJurnal jurnal={dirinci} onTutup={() => setDirinci(null)} />

      {penghalang ??
        (isError ? (
          <p
            role="alert"
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-isi font-bold text-rose-600"
          >
            Gagal memuat jurnal stok. Coba muat ulang halaman.
          </p>
        ) : (
          <DataTable
            columns={kolom}
            data={daftar}
            loading={memuat}
            emptyMessage={`${teks.kosongJudul}. ${teks.kosongIsi}`}
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
        ))}
    </div>
  );
}
