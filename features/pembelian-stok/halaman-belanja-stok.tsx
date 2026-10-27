"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";

import { PilihTanggal } from "@/components/pilih-tanggal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { useDaftarLokasi } from "@/features/inventaris/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { pesanError } from "@/lib/api/error";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PembelianStok } from "@/types/pembelianStok";
import { useDaftarPembelianStok, useRingkasanBelanjaStok } from "./hooks";
import {
  PANJANG_CARI_SUPPLIER,
  filterAwalDaftarPembelian,
  filterServerPembelian,
  paramDaftarPembelian,
  type FilterPembelian,
} from "./payload";
import {
  LOKASI_TIDAK_DIKENAL,
  bagianRingkasan,
  petakanRingkasan,
  ruangLokasi,
  teksAriaBagian,
  teksPeriode,
  type BarisRingkasan,
} from "./ringkasan";
import { urlDetailPembelian } from "./ruang";
import { lokasiPembelian, namaAkunPembelian, ringkasBarang } from "./tampilan";

const SEMUA = "SEMUA";
const PILIHAN_UKURAN = [10, 20, 50] as const;
const KELAS_LABEL_FILTER = "text-xs font-bold text-navy/70";
const KELAS_PEMICU_FILTER =
  "h-10 w-full sm:w-48 bg-white border-navy/20 text-navy font-bold focus:ring-navy shadow-sm";
const WARNA_BAGIAN = ["bg-navy", "bg-karamel", "bg-sage", "bg-navy/40", "bg-karamel/50"] as const;
const LATAR_LOKASI: Record<string, string> = { Outlet: "bg-karamel/30", Gudang: "bg-navy/10" };

function Kartu({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section
      aria-label={judul}
      className="flex flex-col gap-3 rounded-2xl border border-navy/10 bg-krem p-5 shadow-sm"
    >
      <p className="text-sm font-medium text-navy/70">{judul}</p>
      {children}
    </section>
  );
}

/** Kartu porsi: bilah bertumpuk dan rincian nominal per bagian. */
function KartuBagian({ judul, baris }: { judul: string; baris: readonly BarisRingkasan[] }) {
  const bagian = bagianRingkasan(baris);
  return (
    <Kartu judul={judul}>
      {bagian.length === 0 ? (
        <p className="text-sm font-medium text-navy/60">Belum ada pembelian.</p>
      ) : (
        <>
          <div
            role="img"
            aria-label={teksAriaBagian(bagian)}
            className="flex h-2.5 overflow-hidden rounded-full bg-navy/10"
          >
            {bagian.map((b, i) => (
              <div
                key={b.kunci}
                className={WARNA_BAGIAN[i % WARNA_BAGIAN.length]}
                style={{ width: `${b.persen}%` }}
              />
            ))}
          </div>
          <ul className="flex flex-col gap-2">
            {bagian.map((b, i) => (
              <li key={b.kunci} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-navy">
                  <span
                    aria-hidden="true"
                    className={cn("h-2.5 w-2.5 shrink-0 rounded-[3px]", WARNA_BAGIAN[i % WARNA_BAGIAN.length])}
                  />
                  <span className="truncate">{b.nama}</span>
                </span>
                <span className="whitespace-nowrap font-bold tabular-nums text-navy">{formatRupiah(b.total)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Kartu>
  );
}

function PeringkatSupplier({ baris }: { baris: readonly BarisRingkasan[] }) {
  const terbesar = baris[0]?.total ?? 0;
  return (
    <section
      aria-label="Supplier dengan belanja terbesar"
      className="flex flex-col gap-3 rounded-2xl border border-navy/10 bg-krem p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-navy">Supplier dengan belanja terbesar</h3>
        <p className="text-xs font-medium text-navy/60">Dalam periode terpilih</p>
      </div>
      {baris.length === 0 ? (
        <p className="text-sm font-medium text-navy/60">Belum ada pembelian.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {baris.map((s) => (
            <li key={s.kunci} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="min-w-0 flex-[1_1_180px] text-sm font-semibold text-navy">
                {s.nama} <span className="font-medium text-navy/60">· {s.jumlah} pembelian</span>
              </p>
              <div aria-hidden="true" className="h-2 flex-[3_1_200px] overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-full rounded-full bg-navy"
                  style={{ width: `${terbesar > 0 ? (s.total / terbesar) * 100 : 0}%` }}
                />
              </div>
              <p className="flex-[0_0_120px] text-right text-sm font-bold tabular-nums text-navy">
                {formatRupiah(s.total)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * Kartu ringkasan untuk filter yang sama dengan daftar, dari
 * GET /pembelianstok/ringkasan (useRingkasanBelanjaStok, B117). Angkanya
 * dijumlahkan backend untuk seluruh periode, sehingga selalu lengkap.
 */
function RingkasanBelanjaStok({ filter, periode }: { filter: Record<string, string>; periode: string }) {
  const ringkasan = useRingkasanBelanjaStok(filter);
  const hasil = useMemo(() => (ringkasan.data ? petakanRingkasan(ringkasan.data) : null), [ringkasan.data]);

  if (ringkasan.isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-6 text-center"
      >
        <p className="text-sm font-bold text-rose-600">
          {pesanError(ringkasan.error, "Gagal memuat ringkasan belanja stok.")}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => ringkasan.refetch()}
          disabled={ringkasan.isFetching}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }
  if (!hasil) {
    return <p className="text-sm font-medium text-navy/60">Menghitung ringkasan...</p>;
  }

  return (
    <section aria-label="Ringkasan belanja stok" aria-busy={ringkasan.isFetching} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Kartu judul="Total belanja stok">
          <p className="text-2xl font-black tracking-tight tabular-nums text-navy">{formatRupiah(hasil.total)}</p>
          <p className="text-xs font-medium text-navy/60">
            {hasil.jumlahPembelian} pembelian, {periode}
          </p>
        </Kartu>
        <KartuBagian judul="Per lokasi penerima" baris={hasil.perLokasi} />
        <KartuBagian judul="Per akun kas" baris={hasil.perAkun} />
      </div>
      <PeringkatSupplier baris={hasil.supplier} />
    </section>
  );
}

/**
 * Belanja Stok di Keuangan: pembelian stok seluruh outlet dan gudang dalam
 * satu pandangan (keputusan pemilik proyek, 25 Oktober 2026). Ringkasan
 * (GET /pembelianstok/ringkasan) dan daftar (GET /pembelianstok) memakai
 * filter yang sama, tanpa locationID kecuali satu lokasi dipilih. Lokasi
 * tiap baris dibaca dari locationID ter-populate (B112). Baris dibuka di
 * detail ruang asalnya; ubah dan hapus hanya di sana.
 */
export function HalamanBelanjaStok() {
  const lokasi = useDaftarLokasi();
  const akun = useDaftarAkunKas();
  const [filter, setFilter] = useState<FilterPembelian>(() => filterAwalDaftarPembelian());
  const [lokasiID, setLokasiID] = useState("");
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  const kriteria = useMemo(() => ({ ...filter, supplier: cariTertunda }), [filter, cariTertunda]);

  // Mengganti lokasi atau filter kembali ke halaman 1, disesuaikan saat render
  // seperti daftar per ruang, agar halaman lama tidak sempat diminta.
  const kunciKriteria = JSON.stringify([lokasiID, kriteria]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  const filterServer = useMemo(() => filterServerPembelian(kriteria, lokasiID || null), [kriteria, lokasiID]);
  const params = useMemo(
    () => paramDaftarPembelian(kriteria, lokasiID || null, halaman, ukuran),
    [kriteria, lokasiID, halaman, ukuran],
  );
  const daftar = useDaftarPembelianStok(params);
  const baris = useMemo(() => daftar.data?.data ?? [], [daftar.data]);

  const resetFilter = () => {
    setFilter(filterAwalDaftarPembelian());
    setLokasiID("");
    setCari("");
  };

  const kolom = useMemo<ColumnDef<PembelianStok>[]>(
    () => [
      {
        id: "pembelian",
        header: "Pembelian",
        cell: ({ row }) => {
          const ringkas = ringkasBarang(row.original.items);
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-bold text-navy">{row.original.supplier}</span>
              <span className="text-xs font-medium text-navy/60">
                {formatTanggalPendek(row.original.tanggal)} · {ringkas.utama}
                {ringkas.lainnya ? `, ${ringkas.lainnya}` : ""}
              </span>
            </div>
          );
        },
      },
      {
        id: "lokasi",
        header: "Lokasi",
        meta: { label: "Lokasi" },
        cell: ({ row }) => {
          const l = lokasiPembelian(row.original);
          return (
            <span
              className={cn(
                "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold text-navy",
                (l && LATAR_LOKASI[String(l.tipe)]) || "bg-navy/5",
              )}
            >
              {l?.nama || LOKASI_TIDAK_DIKENAL}
            </span>
          );
        },
      },
      {
        id: "akun",
        header: "Dibayar dari",
        meta: { label: "Dibayar dari" },
        cell: ({ row }) => <span className="font-medium text-navy">{namaAkunPembelian(row.original)}</span>,
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
        header: () => <span className="sr-only">Buka</span>,
        cell: ({ row }) => {
          const ruang = ruangLokasi(lokasiPembelian(row.original));
          if (!ruang) return null;
          return (
            <div className="flex justify-end">
              <Link
                href={urlDetailPembelian(ruang, row.original.id)}
                aria-label={`Buka pembelian ${row.original.supplier} di ruang ${ruang}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/60 hover:bg-navy/5 hover:text-navy"
              >
                <ArrowUpRight className="h-[18px] w-[18px]" />
              </Link>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-wide text-navy">Belanja Stok</h2>
          <p className="text-sm font-medium text-navy/60 mt-1">
            Pembelian stok seluruh outlet dan gudang dalam satu pandangan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-navy/10 pb-4 sm:flex sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1">
            <span className={KELAS_LABEL_FILTER}>Pembelian dari</span>
            <PilihTanggal
              label="Pembelian dari"
              value={filter.dari}
              onChange={(dari) => setFilter((f) => ({ ...f, dari }))}
              tanggalNonaktif={filter.sampai ? { after: filter.sampai } : undefined}
              className="h-10 w-full sm:w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className={KELAS_LABEL_FILTER}>Pembelian sampai</span>
            <PilihTanggal
              label="Pembelian sampai"
              value={filter.sampai}
              onChange={(sampai) => setFilter((f) => ({ ...f, sampai }))}
              tanggalNonaktif={filter.dari ? { before: filter.dari } : undefined}
              className="h-10 w-full sm:w-44"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <label htmlFor="filter-lokasi-belanja" className={KELAS_LABEL_FILTER}>
              Lokasi penerima
            </label>
            <Select value={lokasiID || SEMUA} onValueChange={(v) => setLokasiID(v === SEMUA ? "" : v)}>
              <SelectTrigger id="filter-lokasi-belanja" className={KELAS_PEMICU_FILTER}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gading border-navy/10 text-navy">
                <SelectItem value={SEMUA} className="font-bold">
                  Semua lokasi
                </SelectItem>
                {(lokasi.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <label htmlFor="filter-akun-belanja" className={KELAS_LABEL_FILTER}>
              Akun kas
            </label>
            <Select
              value={filter.akunKasID || SEMUA}
              onValueChange={(v) => setFilter((f) => ({ ...f, akunKasID: v === SEMUA ? "" : v }))}
            >
              <SelectTrigger id="filter-akun-belanja" className={KELAS_PEMICU_FILTER}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gading border-navy/10 text-navy">
                <SelectItem value={SEMUA} className="font-bold">
                  Semua akun kas
                </SelectItem>
                {(akun.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.namaAkun}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <label htmlFor="cari-supplier-belanja" className={KELAS_LABEL_FILTER}>
              Cari supplier
            </label>
            <Input
              id="cari-supplier-belanja"
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              maxLength={PANJANG_CARI_SUPPLIER}
              placeholder="Nama supplier"
              className="h-10 w-full sm:w-56 bg-white border-navy/20 text-navy"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={resetFilter}
            className="col-span-2 h-10 justify-self-end font-bold text-amber-800 hover:bg-navy/5 hover:text-amber-900 sm:col-span-1"
          >
            Reset Filter
          </Button>
        </div>

        <RingkasanBelanjaStok
          filter={filterServer}
          periode={teksPeriode(filter.dari, filter.sampai)}
        />

        <p className="text-sm font-medium leading-relaxed text-navy/60">
          Pembelian stok dicatat sebagai persediaan, bukan beban, sehingga tidak masuk ringkasan laba rugi. Saldo
          akun kas belum terpotong oleh pembelian ini.
        </p>

        <section aria-label="Seluruh pembelian" className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-navy">Seluruh pembelian</h3>
          {daftar.isError ? (
            <p
              role="alert"
              className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
            >
              Gagal memuat pembelian stok. Coba muat ulang halaman.
            </p>
          ) : (
            <DataTable
              columns={kolom}
              data={baris}
              loading={daftar.isLoading}
              emptyMessage="Belum ada pembelian pada filter ini."
              paginasiServer={{
                halaman,
                jumlahHalaman: daftar.data?.pagination?.totalPages ?? 1,
                total: daftar.data?.pagination?.total ?? 0,
                ukuran,
                pilihanUkuran: PILIHAN_UKURAN,
                sibuk: daftar.isFetching,
                onGantiHalaman: setHalaman,
                onGantiUkuran: (berikut) => {
                  setUkuran(berikut);
                  setHalaman(1);
                },
              }}
            />
          )}
          <p className="text-sm font-medium text-navy/60">Ubah dan hapus dilakukan di ruang asal pembelian.</p>
        </section>
      </div>
    </div>
  );
}