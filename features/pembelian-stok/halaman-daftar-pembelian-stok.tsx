"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihDaftar, PilihanPeriode } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { useDaftarBahanBaku } from "@/features/bahan-baku/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { IZIN } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import type { PembelianStok } from "@/types/pembelianStok";
import { useDaftarPembelianStok } from "./hooks";
import { aksiPembelianStok, type RuangPembelian } from "./izin";
import {
  PANJANG_CARI_SUPPLIER,
  filterAwalDaftarPembelian,
  jumlahFilterPembelian,
  pilFilterPembelian,
  type FilterPanelPembelian,
  paramDaftarPembelian,
  type FilterPembelian,
} from "./payload";
import { urlCatatPembelian, urlDetailPembelian } from "./ruang";
import { namaAkunPembelian, ringkasBarang } from "./tampilan";

const PILIHAN_UKURAN = [10, 20, 50] as const;

interface Props {
  ruang: RuangPembelian;
  /**
   * Lokasi penerima yang pembeliannya ditampilkan; null selama lokasi belum
   * diketahui. GET /pembelianstok menyaring satu locationID (B103).
   */
  lokasiID: string | null;
  /** Teks di bawah judul halaman. */
  deskripsi: ReactNode;
  /** Bila diisi, tampil menggantikan tabel dan seluruh filter dinonaktifkan. */
  penghalang?: ReactNode;
  /** True selama data yang menentukan lokasi (misalnya lokasi aktif) dimuat. */
  memuatLingkup?: boolean;
  /** Pemilih lokasi di bilah filter (pemegang izin lintas outlet di ruang outlet). */
  pemilihLokasi?: ReactNode;
}

export default function HalamanDaftarPembelianStok({
  ruang,
  lokasiID,
  deskripsi,
  penghalang,
  memuatLingkup = false,
  pemilihLokasi,
}: Props) {
  const { permissions } = useSession();
  // Filter akun kas dan bahan memuat daftar yang menuntut izin bacanya
  // sendiri, sehingga komponennya hanya dipasang bagi pemegang izin itu,
  // seperti filter akun di halaman pengeluaran.
  const bolehAkun = permissions.includes(IZIN.akunKas);
  const bolehBahan = permissions.includes(IZIN.bahan);
  const aksi = aksiPembelianStok(permissions, ruang);

  const [filter, setFilter] = useState<FilterPembelian>(() => filterAwalDaftarPembelian());
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  const kriteria = useMemo(() => ({ ...filter, supplier: cariTertunda }), [filter, cariTertunda]);

  // Mengganti lokasi atau filter kembali ke halaman 1, disesuaikan saat render
  // seperti jurnal stok, agar halaman lama tidak sempat diminta untuk kriteria baru.
  const kunciKriteria = JSON.stringify([lokasiID, kriteria]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  const params = useMemo(
    () => (lokasiID ? paramDaftarPembelian(kriteria, lokasiID, halaman, ukuran) : null),
    [lokasiID, kriteria, halaman, ukuran],
  );
  const { data, isLoading, isFetching, isError } = useDaftarPembelianStok(params);
  const daftar = useMemo(() => data?.data ?? [], [data]);

  // Panel filter (FL1a): akun, bahan, dan periode; supplier kotak cari di bilah.
  const hariIni = useTanggalHariIni();
  const akun = useDaftarAkunKas({ enabled: bolehAkun });
  const bahan = useDaftarBahanBaku(bolehBahan);
  const bawaanPanel = useMemo<FilterPanelPembelian>(() => {
    const awal = filterAwalDaftarPembelian(hariIni);
    return { akunKasID: "", bahanBakuID: "", lokasiID: "", dari: awal.dari, sampai: awal.sampai };
  }, [hariIni]);
  const isianPanel: FilterPanelPembelian = {
    akunKasID: filter.akunKasID,
    bahanBakuID: filter.bahanBakuID,
    lokasiID: "",
    dari: filter.dari,
    sampai: filter.sampai,
  };
  const terapkanPanel = (baru: FilterPanelPembelian) =>
    setFilter((f) => ({ ...f, akunKasID: baru.akunKasID, bahanBakuID: baru.bahanBakuID, dari: baru.dari, sampai: baru.sampai }));
  const panel = usePanelFilter({ terapan: isianPanel, bawaan: bawaanPanel, onTerapkan: terapkanPanel });
  const namaFilter = {
    akun: (id: string) => akun.data?.find((a) => a.id === id)?.namaAkun,
    bahan: (id: string) => bahan.data?.find((b) => b.id === id)?.namaBahan,
    lokasi: () => undefined,
  };

  const memuat = isLoading || memuatLingkup;
  const nonaktif = Boolean(penghalang);

  // Kolom ringkas (TB6a): nomor akun, lokasi, pencatat, dan rincian barang ada di detail.
  const kolom = useMemo<ColumnDef<PembelianStok>[]>(
    () => [
      {
        id: "pembelian",
        header: "Pembelian",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={urlDetailPembelian(ruang, row.original.id)}
              className="font-bold text-navy hover:underline"
            >
              {row.original.supplier}
            </Link>
            <span className="text-kecil font-medium text-navy/60">
              {formatTanggalPendek(row.original.tanggal)} ·{" "}
              <span className="font-mono break-all">{row.original.nomorFaktur || "-"}</span>
            </span>
          </div>
        ),
      },
      {
        id: "barang",
        header: "Barang",
        cell: ({ row }) => {
          const ringkas = ringkasBarang(row.original.items);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-navy">{ringkas.utama}</span>
              {ringkas.lainnya && (
                <span className="text-kecil font-medium text-navy/60">{ringkas.lainnya}</span>
              )}
            </div>
          );
        },
      },
      {
        id: "akun",
        header: "Dibayar dari",
        cell: ({ row }) => (
          <span className="font-medium text-navy">{namaAkunPembelian(row.original)}</span>
        ),
      },
      {
        id: "total",
        header: () => <div className="text-right">Total</div>,
        meta: { label: "Total" },
        cell: ({ row }) => (
          <div className="text-right font-bold text-navy whitespace-nowrap">
            {formatRupiah(row.original.totalBiaya)}
          </div>
        ),
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-navy/50 hover:text-navy hover:bg-navy/10 cursor-pointer"
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">Aksi pembelian {row.original.supplier}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-gading border-navy/10 rounded-xl shadow-lg">
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
                >
                  <Link href={urlDetailPembelian(ruang, row.original.id)}>Lihat detail</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [ruang],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <ShoppingCart className="w-6 h-6 text-karamel" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-judul font-bold tracking-tight text-navy">Pembelian Stok</h1>
            <p className="text-isi font-medium text-navy/60">{deskripsi}</p>
          </div>
        </div>
        {aksi.buat && (
          <Button
            asChild
            size="aksi"
            className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto"
          >
            <Link href={urlCatatPembelian(ruang)}>
              <Plus className="h-4 w-4" /> Catat Pembelian
            </Link>
          </Button>
        )}
      </div>

      {pemilihLokasi}
      <BilahFilter
        cari={{
          id: "cari-supplier-pembelian",
          label: "Cari supplier",
          placeholder: "Cari nama supplier...",
          value: cari,
          onChange: (v) => setCari(v.slice(0, PANJANG_CARI_SUPPLIER)),
        }}
        nonaktif={nonaktif}
        jumlahAktif={jumlahFilterPembelian(isianPanel, bawaanPanel)}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={pilFilterPembelian(isianPanel, bawaanPanel, namaFilter, hariIni, terapkanPanel)}
        onAturUlangSemua={() => terapkanPanel(bawaanPanel)}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahFilterPembelian(panel.draf, bawaanPanel)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        {bolehAkun && (
          <KelompokFilter judul="Akun kas" htmlFor="filter-akun-pembelian">
            <PilihDaftar
              id="filter-akun-pembelian"
              nilai={panel.draf.akunKasID}
              onUbah={(akunKasID) => panel.setDraf({ ...panel.draf, akunKasID })}
              labelSemua="Semua akun kas"
              opsi={(akun.data ?? []).map((a) => ({ id: a.id, nama: a.namaAkun }))}
            />
          </KelompokFilter>
        )}
        {bolehBahan && (
          <KelompokFilter judul="Bahan baku" htmlFor="filter-bahan-pembelian">
            <PilihDaftar
              id="filter-bahan-pembelian"
              nilai={panel.draf.bahanBakuID}
              onUbah={(bahanBakuID) => panel.setDraf({ ...panel.draf, bahanBakuID })}
              labelSemua="Semua bahan"
              opsi={(bahan.data ?? []).map((b) => ({ id: b.id, nama: b.namaBahan }))}
            />
          </KelompokFilter>
        )}
        <KelompokFilter judul="Periode">
          <PilihanPeriode
            idAwalan="filter-pembelian"
            hariIni={hariIni}
            labelDari="Pembelian dari"
            labelSampai="Pembelian sampai"
            batasiUrutan
            rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
            onUbah={({ dari, sampai }) => panel.setDraf({ ...panel.draf, dari, sampai })}
          />
        </KelompokFilter>
      </PanelFilter>

      {penghalang ??
        (isError ? (
          <p
            role="alert"
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-isi font-bold text-rose-600"
          >
            Gagal memuat pembelian stok. Coba muat ulang halaman.
          </p>
        ) : (
          <DataTable
            columns={kolom}
            data={daftar}
            loading={memuat}
            emptyMessage="Belum ada pembelian pada filter ini."
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

