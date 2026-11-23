"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { DialogUnduhBulan } from "@/components/unduh/dialog-unduh-bulan";
import { EP } from "@/lib/api/endpoints";
import { labelFilterEkspor, paramEkspor, unduhDaftar } from "@/lib/unduh";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { useDaftarLokasi } from "@/features/inventaris/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "@/lib/auth/useSession";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihDaftar, PilihanPeriode } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { pesanError } from "@/lib/api/error";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PembelianStok } from "@/types/pembelianStok";
import { useDaftarPembelianStok, useRingkasanBelanjaStok } from "./hooks";
import { ruangCatatBelanja } from "./ruang";
import { TombolCatatBelanja } from "./tombol-catat-belanja";
import {
  PANJANG_CARI_SUPPLIER,
  filterAwalDaftarPembelian,
  jumlahFilterPembelian,
  pilFilterPembelian,
  type FilterPanelPembelian,
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
import { lokasiPembelian, namaAkunPembelian, ringkasBarang, saldoTerpotong } from "./tampilan";

const PILIHAN_UKURAN = [10, 20, 50] as const;
const WARNA_BAGIAN = ["bg-navy", "bg-karamel", "bg-sage", "bg-navy/40", "bg-karamel/50"] as const;
const LATAR_LOKASI: Record<string, string> = { Outlet: "bg-karamel/30", Gudang: "bg-navy/10" };

function Kartu({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section
      aria-label={judul}
      className="flex flex-col gap-3 rounded-2xl border border-navy/10 bg-krem p-5 shadow-sm"
    >
      <p className="text-isi font-medium text-navy/70">{judul}</p>
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
        <p className="text-isi font-medium text-navy/60">Belum ada pembelian.</p>
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
              <li key={b.kunci} className="flex items-center justify-between gap-2 text-isi">
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
        <h3 className="text-besar font-bold text-navy">Supplier dengan belanja terbesar</h3>
        <p className="text-kecil font-medium text-navy/60">Dalam periode terpilih</p>
      </div>
      {baris.length === 0 ? (
        <p className="text-isi font-medium text-navy/60">Belum ada pembelian.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {baris.map((s) => (
            <li key={s.kunci} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="min-w-0 flex-[1_1_180px] text-isi font-semibold text-navy">
                {s.nama} <span className="font-medium text-navy/60">· {s.jumlah} pembelian</span>
              </p>
              <div aria-hidden="true" className="h-2 flex-[3_1_200px] overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-full rounded-full bg-navy"
                  style={{ width: `${terbesar > 0 ? (s.total / terbesar) * 100 : 0}%` }}
                />
              </div>
              <p className="flex-[0_0_120px] text-right text-isi font-bold tabular-nums text-navy">
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
        <p className="text-isi font-bold text-rose-600">
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
    return <p className="text-isi font-medium text-navy/60">Menghitung ringkasan...</p>;
  }

  return (
    <section aria-label="Ringkasan belanja stok" aria-busy={ringkasan.isFetching} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Kartu judul="Total belanja stok">
          <p className="text-judul font-black tracking-tight tabular-nums text-navy">{formatRupiah(hasil.total)}</p>
          <p className="text-kecil font-medium text-navy/60">
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
  const { permissions, plan } = useSession();
  const ruangCatat = ruangCatatBelanja({
    permissions,
    plan,
    adaGudang: (lokasi.data ?? []).some((l) => l.tipe === "Gudang"),
  });
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

  // Panel filter (FL1a): lokasi, akun, dan periode; supplier kotak cari di bilah.
  const hariIni = useTanggalHariIni();
  const bawaanPanel = useMemo<FilterPanelPembelian>(() => {
    const awal = filterAwalDaftarPembelian(hariIni);
    return { akunKasID: "", bahanBakuID: "", lokasiID: "", dari: awal.dari, sampai: awal.sampai };
  }, [hariIni]);
  const isianPanel: FilterPanelPembelian = {
    akunKasID: filter.akunKasID,
    bahanBakuID: "",
    lokasiID,
    dari: filter.dari,
    sampai: filter.sampai,
  };
  const terapkanPanel = (baru: FilterPanelPembelian) => {
    setFilter((f) => ({ ...f, akunKasID: baru.akunKasID, dari: baru.dari, sampai: baru.sampai }));
    setLokasiID(baru.lokasiID);
  };
  const panel = usePanelFilter({ terapan: isianPanel, bawaan: bawaanPanel, onTerapkan: terapkanPanel });
  const namaFilter = {
    akun: (id: string) => akun.data?.find((a) => a.id === id)?.namaAkun,
    bahan: () => undefined,
    lokasi: (id: string) => lokasi.data?.find((l) => l.id === id)?.nama,
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
              <span className="text-kecil font-medium text-navy/60">
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
                "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-kecil font-bold text-navy",
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
        // Pembelian sebelum P64 (B281) tidak memotong saldo; ditandai per baris.
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-navy">{namaAkunPembelian(row.original)}</span>
            {!saldoTerpotong(row.original) && (
              <span className="text-kecil font-medium text-navy/60">Saldo tidak terpotong</span>
            )}
          </div>
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:px-4 sm:py-8">
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-subjudul font-bold tracking-wide text-navy">Belanja Stok</h2>
            <p className="text-isi font-medium text-navy/60 mt-1">
              Pembelian stok seluruh outlet dan gudang dalam satu pandangan.
            </p>
          </div>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            {/* Ekspor per bulan, satu baris per item bahan (B352, P85). */}
            <DialogUnduhBulan
              namaData="belanja stok"
              filterAktif={labelFilterEkspor(pilFilterPembelian(isianPanel, bawaanPanel, namaFilter, hariIni, terapkanPanel), {
                label: "Supplier",
                nilai: cariTertunda,
              })}
              unduh={({ format, bulan }) =>
                unduhDaftar(
                  EP.pembelianStok.list,
                  { ...paramEkspor(filterServer), format, bulan: bulan! },
                  `belanja-stok_${bulan}.${format}`,
                )
              }
            />
            <TombolCatatBelanja ruang={ruangCatat} />
          </div>
        </div>

        <BilahFilter
          cari={{
            id: "cari-supplier-belanja",
            label: "Cari supplier",
            placeholder: "Cari nama supplier...",
            value: cari,
            onChange: (v) => setCari(v.slice(0, PANJANG_CARI_SUPPLIER)),
          }}
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
          <KelompokFilter judul="Lokasi penerima" htmlFor="filter-lokasi-belanja">
            <PilihDaftar
              id="filter-lokasi-belanja"
              nilai={panel.draf.lokasiID}
              onUbah={(lokasiID) => panel.setDraf({ ...panel.draf, lokasiID })}
              labelSemua="Semua lokasi"
              opsi={(lokasi.data ?? []).map((l) => ({ id: l.id, nama: l.nama }))}
            />
          </KelompokFilter>
          <KelompokFilter judul="Akun kas" htmlFor="filter-akun-belanja">
            <PilihDaftar
              id="filter-akun-belanja"
              nilai={panel.draf.akunKasID}
              onUbah={(akunKasID) => panel.setDraf({ ...panel.draf, akunKasID })}
              labelSemua="Semua akun kas"
              opsi={(akun.data ?? []).map((a) => ({ id: a.id, nama: a.namaAkun }))}
            />
          </KelompokFilter>
          <KelompokFilter judul="Periode">
            <PilihanPeriode
              idAwalan="filter-belanja"
              hariIni={hariIni}
              labelDari="Pembelian dari"
              labelSampai="Pembelian sampai"
              batasiUrutan
              rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
              onUbah={({ dari, sampai }) => panel.setDraf({ ...panel.draf, dari, sampai })}
            />
          </KelompokFilter>
        </PanelFilter>

        <RingkasanBelanjaStok
          filter={filterServer}
          periode={teksPeriode(filter.dari, filter.sampai)}
        />

        <p className="text-isi font-medium leading-relaxed text-navy/60">
          Pembelian stok dicatat sebagai persediaan, bukan beban, sehingga tidak masuk ringkasan laba rugi.
        </p>

        <section aria-label="Seluruh pembelian" className="flex flex-col gap-3">
          <h3 className="text-besar font-bold text-navy">Seluruh pembelian</h3>
          {daftar.isError ? (
            <p
              role="alert"
              className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-isi font-bold text-rose-600"
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
          <p className="text-isi font-medium text-navy/60">Ubah dan hapus dilakukan di ruang asal pembelian.</p>
        </section>
      </div>
    </div>
  );
}