"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2, ChevronDown } from "lucide-react";
import { PemilihBulan } from "@/components/unduh/pemilih-bulan";
import { TombolUnduhLaporan } from "@/components/unduh/tombol-unduh-laporan";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { isForbidden, pesanError } from "@/lib/api/error";
import { formatAngka } from "@/lib/format";
import { PILIHAN_FORMAT_DAFTAR, geserBulan, keBulan } from "@/lib/unduh";
import { cn } from "@/lib/utils";
import type { RekapAbsensiStaf } from "@/types/absensi";
import { absensiApi } from "./api";
import { useRekapAbsensi } from "./hooks";
import {
  kelompokRincian,
  teksIzinCuti,
  teksJamKerja,
  teksKehadiran,
  teksPulangAwal,
  teksTepatWaktu,
  teksTerlambat,
  totalRekap,
} from "./rekap";

/** Tabel tujuh kolom hanya bila isi selebar 52rem (sekitar 888 px di layar 1280); di bawahnya daftar berincian. */
const KELAS_TABEL = "hidden @[52rem]:block";
const KELAS_DAFTAR = "@[52rem]:hidden";

/**
 * Laman Rekap Absensi ruang outlet (desain D kanvas "Rekap Absensi"; pemilik
 * proyek, 23 November 2026): kartu ringkasan, tabel ringkas tujuh kolom
 * dengan baris TOTAL di desktop, dan di tablet serta HP daftar per staf yang
 * barisnya dibuka untuk rincian lengkap. Data GET /absensi/rekap?bulan=
 * (B358); "Tidak hadir" dihitung per shift (P86), bukan status alpha harian
 * yang masih ditunda (DB3a). Unduhan CSV atau Excel memuat seluruh kolom.
 */
export function HalamanRekapAbsensi() {
  const hariIni = useTanggalHariIni();
  const [bulanTampil, setBulanTampil] = useState(() => geserBulan(hariIni, 0));
  const bulan = keBulan(bulanTampil);
  const rekap = useRekapAbsensi(bulan, "outlet");
  const total = useMemo(() => (rekap.data ? totalRekap(rekap.data) : null), [rekap.data]);
  const staf = rekap.data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-lg border border-navy/10 bg-gading p-2 shadow-sm">
            <CalendarCheck2 className="h-6 w-6 text-karamel" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-judul font-bold tracking-tight text-navy">Rekap Absensi</h1>
            <p className="text-isi font-medium text-navy/60">Kehadiran setiap staf dalam satu bulan, dihitung per shift.</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <PemilihBulan bulan={bulanTampil} onUbah={setBulanTampil} hariIni={hariIni} label="Bulan rekap" className="w-full sm:w-56" />
          <TombolUnduhLaporan
            label="Unduh"
            pilihan={PILIHAN_FORMAT_DAFTAR}
            disabled={!rekap.lokasiId}
            unduh={(format) => absensiApi.unduhRekap(bulan, rekap.lokasiId!, format)}
            className="h-[42px] w-full sm:w-auto"
          />
        </div>
      </div>

      {rekap.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-2xl bg-navy/5" />
          <Skeleton className="h-64 w-full rounded-2xl bg-navy/5" />
        </div>
      ) : rekap.isError ? (
        <p role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-isi font-medium text-red-600">
          {isForbidden(rekap.error)
            ? "Anda tidak memiliki izin melihat rekap absensi."
            : pesanError(rekap.error, "Gagal memuat rekap absensi.")}
        </p>
      ) : (
        <div className="@container flex flex-col gap-6">
          {total && <KartuRingkasan total={total} jumlahStaf={rekap.data?.ringkasan.totalStaf ?? staf.length} />}
          {staf.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-navy/20 bg-krem p-12 text-center">
              <p className="text-besar font-bold text-navy">Belum ada data bulan ini</p>
              <p className="mx-auto max-w-md text-isi font-medium text-navy/60">
                Staf tampil di sini bila punya jadwal kerja, absen, atau izin cuti pada bulan yang dipilih.
              </p>
            </div>
          ) : (
            <>
              <div className={KELAS_TABEL}>
                <TabelRekap staf={staf} total={total!} />
              </div>
              <div className={KELAS_DAFTAR}>
                <DaftarRekap staf={staf} total={total!} />
              </div>
            </>
          )}
          <p className="text-kecil font-medium text-navy/70">
            Tidak hadir: shift terjadwal sebelum hari ini tanpa absen dan tanpa izin yang disetujui. Hari ini belum
            dihitung.
          </p>
        </div>
      )}
    </div>
  );
}

function KartuRingkasan({ total, jumlahStaf }: { total: RekapAbsensiStaf; jumlahStaf: number }) {
  const kartu = [
    { label: "Staf", nilai: formatAngka(jumlahStaf), ket: "punya jadwal atau absen", merah: false },
    { label: "Shift hadir", nilai: formatAngka(total.hariHadir), ket: `dari ${formatAngka(total.shiftDijadwalkan)} shift terjadwal`, merah: false },
    { label: "Jam kerja", nilai: formatAngka(total.jamKerja), ket: "jam, seluruh staf", merah: false },
    { label: "Tidak hadir", nilai: formatAngka(total.shiftTidakHadir), ket: "shift tanpa absen dan izin", merah: true },
  ];
  return (
    <section aria-label="Ringkasan rekap" className="grid grid-cols-2 gap-2 sm:gap-3 @[52rem]:grid-cols-4">
      {kartu.map((k) => (
        <div key={k.label} className="min-w-0 rounded-2xl border border-navy/10 bg-krem p-3 sm:p-4">
          <p className="text-kecil font-semibold text-navy/70">{k.label}</p>
          <p className={cn("text-judul font-black tracking-tight sm:text-tampilan", k.merah ? "text-rose-redup" : "text-navy")}>
            {k.nilai}
          </p>
          <p className="text-mikro font-medium text-navy/70 sm:text-kecil">{k.ket}</p>
        </div>
      ))}
    </section>
  );
}

const lencanaTidakHadir = (n: number) =>
  n > 0 ? "bg-rose-redup/10 text-rose-redup" : "bg-sage/15 text-sage-tua";

function TabelRekap({ staf, total }: { staf: RekapAbsensiStaf[]; total: RekapAbsensiStaf }) {
  return (
    <Table className="table-fixed">
      <colgroup>
        <col className="w-[19%]" />
        <col className="w-[16%]" />
        <col className="w-[20%]" />
        <col className="w-[11%]" />
        <col className="w-[11%]" />
        <col className="w-[12%]" />
        <col className="w-[11%]" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableHead>Staf</TableHead>
          <TableHead>Kehadiran</TableHead>
          <TableHead>Ketepatan</TableHead>
          <TableHead>Pulang awal</TableHead>
          <TableHead className="text-right">Jam kerja</TableHead>
          <TableHead>Izin &amp; cuti</TableHead>
          <TableHead className="text-right">Tidak hadir</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staf.map((s) => (
          <BarisTabel key={s.penggunaID} s={s} />
        ))}
      </TableBody>
      <TableFooter>
        <BarisTabel s={total} total />
      </TableFooter>
    </Table>
  );
}

function BarisTabel({ s, total = false }: { s: RekapAbsensiStaf; total?: boolean }) {
  return (
    <TableRow className={cn(total && "font-bold [--warna-baris:var(--krem)]")}>
      <TableCell className="truncate font-bold">{s.nama}</TableCell>
      <TableCell className="whitespace-normal">
        <span className="font-bold">{s.hariHadir}</span>
        <span className="font-medium text-navy/70"> dari {s.shiftDijadwalkan} shift</span>
      </TableCell>
      <TableCell className="whitespace-normal">
        <p className="font-semibold">{teksTepatWaktu(s)}</p>
        <p className="text-kecil font-medium text-navy/70">{teksTerlambat(s)}</p>
      </TableCell>
      <TableCell className="whitespace-normal">{teksPulangAwal(s)}</TableCell>
      <TableCell className="text-right font-semibold">{teksJamKerja(s)}</TableCell>
      <TableCell className="whitespace-normal">{total ? `${s.hariSakit + s.hariIzin + s.hariCuti} hari` : teksIzinCuti(s)}</TableCell>
      <TableCell className="text-right">
        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-kecil font-bold", lencanaTidakHadir(s.shiftTidakHadir))}>
          {s.shiftTidakHadir} shift
        </span>
      </TableCell>
    </TableRow>
  );
}

function DaftarRekap({ staf, total }: { staf: RekapAbsensiStaf[]; total: RekapAbsensiStaf }) {
  const [terbuka, setTerbuka] = useState<string | null>(null);
  return (
    <ul aria-label="Rekap per staf" className="flex flex-col gap-2">
      {[...staf, total].map((s) => (
        <BarisDaftar
          key={s.penggunaID}
          s={s}
          total={s === total}
          terbuka={terbuka === s.penggunaID}
          onAlih={() => setTerbuka(terbuka === s.penggunaID ? null : s.penggunaID)}
        />
      ))}
    </ul>
  );
}

function BarisDaftar({ s, total, terbuka, onAlih }: { s: RekapAbsensiStaf; total: boolean; terbuka: boolean; onAlih: () => void }) {
  const idRincian = `rincian-rekap-${s.penggunaID}`;
  return (
    <li className={cn("overflow-hidden rounded-2xl border border-navy/10 shadow-sm", total ? "bg-krem" : "bg-permukaan")}>
      <button
        type="button"
        onClick={onAlih}
        aria-expanded={terbuka}
        aria-controls={idRincian}
        className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-3 py-3 text-left sm:px-4"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-isi font-bold text-navy">{s.nama}</span>
          <span className="mt-0.5 block text-kecil font-medium text-navy/70">
            {teksKehadiran(s)} hadir · {teksJamKerja(s)}
          </span>
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-kecil font-bold", lencanaTidakHadir(s.shiftTidakHadir))}>
          {s.shiftTidakHadir} tidak hadir
        </span>
        <ChevronDown className={cn("h-[18px] w-[18px] shrink-0 text-navy transition-transform", terbuka && "rotate-180")} aria-hidden="true" />
      </button>
      {terbuka && (
        <div id={idRincian} className="flex flex-col gap-3 border-t border-navy/10 px-3 pt-3 pb-4 sm:px-4">
          {kelompokRincian(s).map((g) => (
            <div key={g.judul}>
              <p className="mb-1.5 text-mikro font-bold text-navy/70">{g.judul}</p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {g.isi.map((x) => (
                  <div key={x.label} className="flex min-w-0 justify-between gap-1.5 text-isi">
                    <dt className="min-w-0 font-medium text-navy/75">{x.label}</dt>
                    <dd className="shrink-0 font-bold text-navy">{x.nilai}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
