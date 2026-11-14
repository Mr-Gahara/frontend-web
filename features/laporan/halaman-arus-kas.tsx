"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { pesanError } from "@/lib/api/error";
import { IZIN } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { laporanApi } from "./api";
import {
  JUDUL_KELOMPOK,
  LABEL_KELOMPOK,
  LENCANA_ARAH,
  PILIHAN_UNDUHAN,
  arahBersih,
  barisPeriode,
  filterAwalArusKas,
  parameterArusKas,
  rincianArusKas,
  tanggalPendek,
  type FilterArusKas,
  type FormatUnduhan,
  type KelompokArusKas,
  type PanelRincian,
} from "./arus-kas";
import { useArusKas } from "./hooks";

const SEMUA = "semua";
const KELAS_LABEL = "text-xs font-bold text-navy/70";
const KELAS_PEMICU = "h-10 bg-permukaan border-navy/20 text-navy";

/** Angka bertanda: "+Rp 1.000", "−Rp 1.000", atau "Rp 0". */
function rupiahBertanda(n: number): string {
  if (n > 0) return `+${formatRupiah(n)}`;
  if (n < 0) return `−${formatRupiah(-n)}`;
  return formatRupiah(0);
}

function warnaBersih(n: number): string {
  return n > 0 ? "text-[#4F5E3A]" : n < 0 ? "text-rose-700" : "text-navy";
}

function KartuSaldo({
  judul,
  nilai,
  lencana,
  catatan,
  kelasLencana,
}: {
  judul: string;
  nilai: string;
  lencana: string;
  catatan: string;
  kelasLencana: string;
}) {
  return (
    <div className="bg-navy text-gading rounded-2xl sm:rounded-3xl border-t-4 border-karamel p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm min-w-0 sm:min-h-34">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-krem/85 truncate min-w-0">{judul}</p>
        <span className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-karamel/20 text-karamel shrink-0">
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-black tracking-tight truncate">{nilai}</p>
      <p className="flex items-center gap-2 text-xs">
        <span className={cn("px-2 py-0.5 rounded-full font-bold", kelasLencana)}>{lencana}</span>
        <span className="font-medium text-krem/75">{catatan}</span>
      </p>
    </div>
  );
}

function Panel({ panel }: { panel: PanelRincian }) {
  const warnaBatang = panel.judul === "Uang masuk" ? "bg-sage" : "bg-navy";
  return (
    <section
      aria-label={panel.judul}
      className="bg-krem border border-navy/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-navy flex flex-col gap-4 min-w-0"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-bold">{panel.judul}</h3>
        <span className="text-lg sm:text-xl font-black tracking-tight">{formatRupiah(panel.total)}</span>
      </div>
      <ul className="flex flex-col gap-3.5">
        {panel.baris.map((b) => (
          <li key={`${b.label}-${b.pembatalan}`} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-semibold min-w-0">
                {/* Boleh dua baris: di HP 390 px label dan badge Pembatalan tidak muat satu baris. */}
                <span className="leading-snug">{b.label}</span>
                {b.pembatalan && (
                  <span className="shrink-0 px-2 py-px rounded-full bg-karamel/25 text-[#7A5226] text-[11px] font-bold">
                    Pembatalan
                  </span>
                )}
              </span>
              <span className="font-bold shrink-0">{formatRupiah(b.nilai)}</span>
            </div>
            <div className="h-2 rounded-full bg-navy/[0.08]" aria-hidden="true">
              <div
                className={cn("h-2 rounded-full", b.pembatalan ? "bg-karamel" : warnaBatang)}
                style={{ width: `${b.nilai > 0 ? Math.max(1.5, b.persen) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Laporan arus kas (B291, desain D pemilik proyek 12 November 2026): pita
 * filter, tiga kartu saldo navy, panel Uang masuk dan Uang keluar per
 * kategori, dan daftar per periode bergaya desain C satu kolom. Unduhan
 * memakai menu PDF, Excel, dan CSV dari backend dengan filter yang sama.
 */
export function HalamanArusKas() {
  const [filter, setFilter] = useState<FilterArusKas>(() => filterAwalArusKas());
  const [mengunduh, setMengunduh] = useState<FormatUnduhan | null>(null);
  const { permissions } = useSession();
  // Daftar akun kas menuntut read-akunkas; tanpa itu laporan tetap seluruh akun.
  const bolehPilihAkun = permissions.includes(IZIN.akunKas);
  const akunKas = useDaftarAkunKas({ enabled: bolehPilihAkun });
  const params = useMemo(() => parameterArusKas(filter), [filter]);
  const laporan = useArusKas(params);

  const tampilan = useMemo(() => {
    if (!laporan.data) return null;
    const { ringkasan, baris } = laporan.data;
    return {
      ringkasan,
      panel: rincianArusKas(ringkasan, Boolean(filter.akunKasID)),
      periode: barisPeriode(baris, filter),
    };
  }, [laporan.data, filter]);

  const unduh = async (format: FormatUnduhan) => {
    setMengunduh(format);
    try {
      const { berkas, nama } = await laporanApi.unduhArusKas(parameterArusKas(filter, format));
      const url = URL.createObjectURL(berkas);
      const a = document.createElement("a");
      a.href = url;
      a.download = nama;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(pesanError(e, "Laporan gagal diunduh."));
    } finally {
      setMengunduh(null);
    }
  };

  const ringkasan = tampilan?.ringkasan;
  const arah = arahBersih(ringkasan?.arusKasBersih ?? 0);
  const kelasLencanaArah =
    arah === "naik" ? "bg-sage/35 text-[#e3ecd3]" : arah === "turun" ? "bg-rose-500/30 text-rose-100" : "bg-gading/10 text-gading";

  return (
    <div className="flex flex-col gap-5 w-full text-navy">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-wide">Laporan Arus Kas</h2>
          <p className="text-sm font-medium text-navy/70 mt-1">Uang masuk dan keluar dari buku mutasi akun kas.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              disabled={mengunduh !== null}
              className="h-10 bg-navy text-gading hover:bg-navy/90 font-bold cursor-pointer"
            >
              {mengunduh ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="w-4 h-4" aria-hidden="true" />
              )}
              Unduh laporan
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gading border-navy/10">
            {PILIHAN_UNDUHAN.map(({ format, label }) => (
              <DropdownMenuItem
                key={format}
                className="cursor-pointer font-bold text-navy/80"
                onClick={() => unduh(format)}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl bg-navy/5 border border-navy/5">
        {bolehPilihAkun && (
          <div className="flex flex-col gap-1 flex-[1_1_180px] sm:max-w-56">
            <label htmlFor="arus-kas-akun" className={KELAS_LABEL}>
              Akun kas
            </label>
            <Select
              value={filter.akunKasID || SEMUA}
              onValueChange={(v) => setFilter({ ...filter, akunKasID: v === SEMUA ? "" : v })}
            >
              <SelectTrigger id="arus-kas-akun" className={cn(KELAS_PEMICU, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEMUA}>Semua akun</SelectItem>
                {(akunKas.data ?? []).map((akun) => (
                  <SelectItem key={akun.id} value={akun.id}>
                    {akun.namaAkun}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className={KELAS_LABEL}>Dari</span>
          <PilihTanggal
            label="Dari"
            value={filter.dari}
            onChange={(dari) => setFilter({ ...filter, dari })}
            tanggalNonaktif={{ after: filter.sampai }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className={KELAS_LABEL}>Sampai</span>
          <PilihTanggal
            label="Sampai"
            value={filter.sampai}
            onChange={(sampai) => setFilter({ ...filter, sampai })}
            tanggalNonaktif={{ before: filter.dari }}
          />
        </div>
        <div
          role="group"
          aria-label="Kelompokkan per"
          className="flex bg-[#675a41]/20 rounded-lg p-1 border border-navy/10 shadow-inner gap-0.5"
        >
          {(Object.keys(LABEL_KELOMPOK) as KelompokArusKas[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter.kelompok === k}
              onClick={() => setFilter({ ...filter, kelompok: k })}
              className={cn(
                "h-8 px-3.5 text-sm font-bold rounded-md transition-colors cursor-pointer",
                filter.kelompok === k ? "bg-sage text-gading shadow-sm" : "text-navy/70 hover:text-navy",
              )}
            >
              {LABEL_KELOMPOK[k]}
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => setFilter(filterAwalArusKas())}>
          Reset Filter
        </Button>
      </div>

      {laporan.isError ? (
        <div role="alert" className="flex flex-col items-center justify-center py-10 gap-3 text-navy/70 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500/60" aria-hidden="true" />
          <p className="font-bold">{pesanError(laporan.error, "Gagal memuat laporan arus kas.")}</p>
        </div>
      ) : !tampilan || !ringkasan ? (
        <div className="flex flex-col gap-4" aria-label="Memuat laporan arus kas">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-34 rounded-3xl bg-navy/10" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-3xl bg-navy/5" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <KartuSaldo
              judul="Saldo awal periode"
              nilai={formatRupiah(ringkasan.saldoAwalPeriode)}
              lencana={tanggalPendek(ringkasan.startDate)}
              catatan="awal hari"
              kelasLencana="bg-gading/10 text-gading"
            />
            <KartuSaldo
              judul="Arus kas bersih"
              nilai={rupiahBertanda(ringkasan.arusKasBersih)}
              lencana={LENCANA_ARAH[arah].label}
              catatan={LENCANA_ARAH[arah].catatan}
              kelasLencana={kelasLencanaArah}
            />
            <KartuSaldo
              judul="Saldo akhir periode"
              nilai={formatRupiah(ringkasan.saldoAkhirPeriode)}
              lencana={tanggalPendek(ringkasan.endDate)}
              catatan="akhir hari"
              kelasLencana="bg-gading/10 text-gading"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {tampilan.panel.map((p) => (
              <Panel key={p.judul} panel={p} />
            ))}
          </div>
          {!filter.akunKasID && (
            <p className="-mt-1 text-xs font-medium text-navy/70">
              Transfer antar akun tidak dihitung untuk Semua akun, karena hanya memindah uang. Pilih satu akun kas
              untuk melihatnya.
            </p>
          )}

          <section aria-labelledby="arus-kas-periode" className="flex flex-col gap-2">
            <h3 id="arus-kas-periode" className="text-base font-bold">
              {JUDUL_KELOMPOK[filter.kelompok]}
            </h3>
            <ul className="flex flex-col gap-2">
              {tampilan.periode.map((b) => (
                <li
                  key={b.kunci}
                  className="border border-navy/[0.12] rounded-2xl px-4 py-3 flex flex-col gap-1"
                >
                  <div className="flex justify-between gap-3 text-sm font-bold">
                    <span>{b.label}</span>
                    <span className={warnaBersih(b.bersih)}>{rupiahBertanda(b.bersih)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[13px] text-navy/75">
                    <span>Masuk {formatRupiah(b.masuk)}</span>
                    <span>Keluar {formatRupiah(b.keluar)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
