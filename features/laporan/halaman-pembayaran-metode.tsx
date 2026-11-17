"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, CreditCard } from "lucide-react";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { formatRupiah } from "@/lib/format";
import { usePembayaranPerMetode } from "./hooks";
import {
  LABEL_PILIHAN_PERIODE,
  busurCincin,
  formatPersen,
  rentangMetode,
  susunMetode,
  teksRentang,
  type BarisMetode,
  type PilihanPeriodeMetode,
} from "./pembayaran-metode";

const PILIHAN: PilihanPeriodeMetode[] = ["hari", "minggu", "bulan", "tanggal"];
const JARI = 70;
const KELILING = 2 * Math.PI * JARI;
const KELAS_LABEL = "text-kecil font-bold text-navy/70";

function Warna({ warna }: { warna: string }) {
  return <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: warna }} />;
}

const KOLOM: ColumnDef<BarisMetode>[] = [
  {
    accessorKey: "nama",
    header: "Metode",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2 font-bold">
        <Warna warna={row.original.warna} />
        {row.original.nama}
      </span>
    ),
  },
  { accessorKey: "jumlahPembayaran", header: "Pembayaran" },
  {
    accessorKey: "jumlah",
    header: "Diterima",
    cell: ({ row }) => <span className="font-bold">{formatRupiah(row.original.jumlah)}</span>,
  },
  {
    accessorKey: "persen",
    header: "Porsi",
    cell: ({ row }) => formatPersen(row.original.persen),
  },
];

/**
 * Laman Pembayaran per Metode (desain B, OM2a; pemilik proyek, 17 November
 * 2026): uang diterima per metode pembayaran dari ringkasan laba rugi (B329),
 * termasuk pajak; bukan pembagian omzet.
 */
export function HalamanPembayaranMetode() {
  const hariIni = useTanggalHariIni();
  const [pilihan, setPilihan] = useState<PilihanPeriodeMetode>("bulan");
  const [dari, setDari] = useState<Date | undefined>(undefined);
  const [sampai, setSampai] = useState<Date | undefined>(undefined);

  // Pilih tanggal diisi awal dari awal bulan sampai hari ini.
  const dariTampil = useMemo(() => dari ?? new Date(hariIni.getFullYear(), hariIni.getMonth(), 1), [dari, hariIni]);
  const sampaiTampil = sampai ?? hariIni;
  const { rentang, galat } = useMemo(
    () => rentangMetode(pilihan, hariIni, dariTampil, sampaiTampil),
    [pilihan, hariIni, dariTampil, sampaiTampil],
  );
  const { data, isLoading, isError } = usePembayaranPerMetode(rentang);
  const ringkas = useMemo(() => susunMetode(data ?? []), [data]);
  const busur = useMemo(() => busurCincin(ringkas.baris, KELILING), [ringkas.baris]);
  const teksPorsi = ringkas.baris.map((b) => `${b.nama} ${formatPersen(b.persen)}`).join(", ");

  return (
    <div className="sm:p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      <section
        aria-labelledby="judul-pembayaran-metode"
        className="bg-krem border border-navy/10 rounded-2xl p-4 sm:p-6 text-navy shadow-sm flex flex-col w-full gap-6 overflow-hidden"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-karamel rounded-lg shadow-sm shrink-0">
              <CreditCard className="w-5 h-5 text-gading" aria-hidden="true" />
            </div>
            <div>
              <h2 id="judul-pembayaran-metode" className="text-subjudul font-bold tracking-wide text-navy">
                Pembayaran per Metode
              </h2>
              <p className="text-kecil text-navy/70 font-medium">{rentang ? teksRentang(rentang) : "Rentang belum sah"}</p>
            </div>
          </div>
          <div
            role="group"
            aria-label="Periode"
            className="grid grid-cols-2 sm:flex w-full md:w-auto bg-cokelat-zaitun/20 rounded-lg p-1 border border-navy/10 shadow-inner gap-0.5"
          >
            {PILIHAN.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={pilihan === p}
                onClick={() => setPilihan(p)}
                className={`px-3 sm:px-4 py-1.5 text-kecil sm:text-isi font-bold rounded-md transition-colors cursor-pointer ${
                  pilihan === p ? "bg-sage text-gading shadow-sm" : "text-navy/60 hover:text-navy"
                }`}
              >
                {LABEL_PILIHAN_PERIODE[p]}
              </button>
            ))}
          </div>
        </div>

        {pilihan === "tanggal" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1">
              <span className={KELAS_LABEL}>Dari</span>
              <PilihTanggal label="Dari" value={dariTampil} onChange={setDari} tanggalNonaktif={{ after: sampaiTampil }} />
            </div>
            <div className="flex flex-col gap-1">
              <span className={KELAS_LABEL}>Sampai</span>
              <PilihTanggal label="Sampai" value={sampaiTampil} onChange={setSampai} tanggalNonaktif={{ before: dariTampil }} />
            </div>
          </div>
        )}

        {galat ? (
          <p role="alert" className="text-isi font-bold text-rose-lama">
            {galat}
          </p>
        ) : isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-48 bg-navy/10 rounded-md" />
            <Skeleton className="h-56 w-full bg-navy/5 rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-navy/60">
            <AlertTriangle className="w-10 h-10 text-rose-500/50" aria-hidden="true" />
            <p className="font-bold">Gagal memuat data laporan.</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-judul sm:text-tampilan font-black tracking-tight text-navy">{formatRupiah(ringkas.total)}</p>
              <p className="text-kecil text-navy/60 font-medium mt-1">
                diterima dari {ringkas.jumlahPembayaran} pembayaran
              </p>
            </div>
            {ringkas.baris.length === 0 ? (
              <p className="text-isi font-medium text-navy/70">Belum ada pembayaran pada periode ini.</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                <svg
                  width="220"
                  height="220"
                  viewBox="0 0 220 220"
                  role="img"
                  aria-label={`Porsi: ${teksPorsi}`}
                  className="shrink-0"
                >
                  <circle cx="110" cy="110" r={JARI} fill="none" stroke="color-mix(in srgb, var(--navy) 8%, transparent)" strokeWidth="28" />
                  {busur.map((b) => (
                    <circle
                      key={b.kunci}
                      cx="110"
                      cy="110"
                      r={JARI}
                      fill="none"
                      stroke={b.warna}
                      strokeWidth="28"
                      strokeDasharray={`${b.panjang} ${KELILING}`}
                      strokeDashoffset={b.geser}
                      transform="rotate(-90 110 110)"
                    />
                  ))}
                  <text x="110" y="106" textAnchor="middle" className="fill-navy/70 text-kecil">
                    {ringkas.baris.length} metode
                  </text>
                  <text x="110" y="126" textAnchor="middle" className="fill-navy text-besar font-extrabold">
                    {ringkas.jumlahPembayaran} bayar
                  </text>
                </svg>
                <ul className="flex-1 w-full flex flex-col gap-4">
                  {ringkas.baris.map((b) => (
                    <li key={b.kunci} className="flex items-center gap-3">
                      <Warna warna={b.warna} />
                      <span className="flex-1 min-w-0 truncate text-besar font-bold">{b.nama}</span>
                      <span className="text-isi text-navy/70">{formatPersen(b.persen)}</span>
                      <span className="w-32 text-right text-besar font-extrabold">{formatRupiah(b.jumlah)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {!galat && !isLoading && !isError && ringkas.baris.length > 0 && (
        <section aria-labelledby="judul-rincian-metode" className="flex flex-col gap-3">
          <h3 id="judul-rincian-metode" className="text-subjudul font-bold text-navy">
            Rincian metode
          </h3>
          <DataTable columns={KOLOM} data={ringkas.baris} rincian />
          <p className="text-kecil text-navy/70 leading-relaxed">
            Uang yang diterima per metode, termasuk pajak; bukan pembagian omzet, karena satu penjualan dapat dibayar
            dengan beberapa metode. Pembayaran yang dibatalkan dan yang belum lunas tidak dihitung.
          </p>
        </section>
      )}
    </div>
  );
}
