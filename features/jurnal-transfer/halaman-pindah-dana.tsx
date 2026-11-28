"use client";

import { TeksDuaBaris } from "@/components/ui/teks-dua-baris";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowLeftRight, MoreHorizontal } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { akunKasAktif } from "@/features/akun-kas/filter";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { PILIHAN_UKURAN_MUTASI, UKURAN_MUTASI_BAWAAN } from "@/features/akun-kas/mutasi";
import { URL_DAFTAR_AKUN_KAS } from "@/features/akun-kas/ubah";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihDaftar, PilihanPeriode, PilihanSegmen } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AkunKas } from "@/types/akunKas";
import type { JurnalTransfer } from "@/types/jurnalTransfer";
import { DialogBatalTransfer } from "./dialog-batal-transfer";
import { DialogRincianTransfer } from "./dialog-rincian-transfer";
import { useBuatTransfer, useDaftarTransfer } from "./hooks";
import { aksiTransfer, bolehBatalTransfer } from "./izin";
import {
  FILTER_AWAL_TRANSFER,
  ISIAN_AWAL_PINDAH_DANA,
  LABEL_DARI_BUKA_KASIR,
  LABEL_STATUS_TRANSFER,
  PARAM_TRANSFER,
  jumlahFilterTransfer,
  namaAkunTransfer,
  pilFilterTransfer,
  payloadBuatTransfer,
  pesanSaldoKurang,
  pilihanTujuan,
  type FilterTransfer,
} from "./payload";
import { skemaPindahDana, type IsianPindahDana } from "./schema";

const KELAS_ISIAN =
  "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy";
const KELAS_LABEL = "text-isi font-bold text-navy";
const KELAS_GALAT = "text-kecil font-bold text-rose-500";

function Keadaan({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy/20 bg-krem p-12 text-center">
      <p className="text-besar font-bold text-navy mb-1">{judul}</p>
      <p className="text-isi font-medium text-navy/60 max-w-md mx-auto">{isi}</p>
    </div>
  );
}

/**
 * Pindah Dana antar akun kas (keputusan DN1a sampai DN3a): form di atas dan
 * riwayat transfer di bawahnya. Entri IZIN_HALAMAN-nya kosong; tiap bagian
 * mengikuti izin endpoint-nya: form bagi create-jurnal-transfer, riwayat bagi
 * read-jurnal-transfer, dan Batalkan bagi update-jurnal-transfer.
 */
export function HalamanPindahDana() {
  return (
    <Suspense fallback={null}>
      <IsiPindahDana />
    </Suspense>
  );
}

/** useSearchParams (?transfer=) membutuhkan batas Suspense agar halaman tetap dapat dirender statis. */
function IsiPindahDana() {
  const { permissions } = useSession();
  const aksi = aksiTransfer(permissions);
  const akunKas = useDaftarAkunKas();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:px-4 sm:py-8">
      <Link
        href={URL_DAFTAR_AKUN_KAS}
        className="inline-flex w-fit items-center text-isi font-semibold text-navy/60 hover:text-navy"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar Akun Kas
      </Link>
      <div className="space-y-0.5">
        <h1 className="text-judul font-bold tracking-tight text-navy">Pindah Dana</h1>
        <p className="text-isi font-medium text-navy/60">
          Pindahkan saldo antar akun kas toko. Transfer tidak dapat diubah; koreksinya dibatalkan
          lalu dicatat ulang.
        </p>
      </div>

      {!aksi.buat && !aksi.baca ? (
        <Keadaan
          judul="Tidak ada izin Pindah Dana"
          isi="Hubungi pemilik toko bila Anda perlu memindah dana antar akun kas."
        />
      ) : (
        <>
          {aksi.buat &&
            (akunKas.isLoading ? (
              <Skeleton className="h-72 w-full rounded-2xl bg-navy/10" />
            ) : akunKas.isError ? (
              <Keadaan
                judul="Gagal memuat akun kas"
                isi={pesanError(akunKas.error, "Periksa koneksi lalu muat ulang halaman.")}
              />
            ) : akunKasAktif(akunKas.data ?? []).length < 2 ? (
              <Keadaan
                judul="Butuh dua akun kas aktif"
                isi="Pindah Dana memerlukan sedikitnya dua akun kas aktif: satu sumber dan satu tujuan."
              />
            ) : (
              <FormPindahDana akunAktif={akunKasAktif(akunKas.data ?? [])} />
            ))}
          {aksi.baca && <RiwayatTransfer akun={akunKas.data ?? []} bolehBatal={aksi.batal} />}
        </>
      )}
    </div>
  );
}

function FormPindahDana({ akunAktif }: { akunAktif: AkunKas[] }) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<IsianPindahDana>({
    resolver: zodResolver(skemaPindahDana),
    defaultValues: ISIAN_AWAL_PINDAH_DANA,
  });
  const kasSumberID = useWatch({ control, name: "kasSumberID" });
  const sumber = akunAktif.find((akun) => akun.id === kasSumberID);

  const buat = useBuatTransfer({
    onSuccess: () => {
      toast.success("Dana dipindahkan", {
        description: "Saldo kedua akun kas telah diperbarui.",
      });
      reset(ISIAN_AWAL_PINDAH_DANA);
    },
    onError: (err) => {
      toast.error("Gagal Memindah Dana", {
        description: pesanError(err, "Gagal memindah dana."),
      });
    },
  });
  const memuat = buat.isPending;

  const kirim = (isian: IsianPindahDana) => {
    const kurang = pesanSaldoKurang(isian.jumlah, sumber);
    if (kurang) {
      setError("jumlah", { message: kurang });
      return;
    }
    buat.mutate(payloadBuatTransfer(isian));
  };

  return (
    <div className="rounded-2xl border border-navy/10 bg-krem shadow-sm">
      <form noValidate onSubmit={handleSubmit(kirim)} className="flex flex-col gap-6 p-5 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="kas-sumber" className={KELAS_LABEL}>
              Akun Sumber
            </label>
            <Controller
              name="kasSumberID"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (getValues("kasTujuanID") === v) setValue("kasTujuanID", "");
                  }}
                  disabled={memuat}
                >
                  <SelectTrigger
                    id="kas-sumber"
                    className={cn(KELAS_ISIAN, "w-full", errors.kasSumberID && "border-rose-500")}
                  >
                    <SelectValue placeholder="Pilih akun sumber" />
                  </SelectTrigger>
                  <SelectContent className="bg-gading border-navy/10 text-navy">
                    {akunAktif.map((akun) => (
                      <SelectItem key={akun.id} value={akun.id}>
                        {akun.namaAkun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {sumber && (
              <p className="text-kecil font-medium text-navy/60">
                Saldo tersedia {formatRupiah(sumber.saldo)}
              </p>
            )}
            {errors.kasSumberID && (
              <span className={KELAS_GALAT}>{errors.kasSumberID.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="kas-tujuan" className={KELAS_LABEL}>
              Akun Tujuan
            </label>
            <Controller
              name="kasTujuanID"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={memuat}>
                  <SelectTrigger
                    id="kas-tujuan"
                    className={cn(KELAS_ISIAN, "w-full", errors.kasTujuanID && "border-rose-500")}
                  >
                    <SelectValue placeholder="Pilih akun tujuan" />
                  </SelectTrigger>
                  <SelectContent className="bg-gading border-navy/10 text-navy">
                    {pilihanTujuan(akunAktif, kasSumberID).map((akun) => (
                      <SelectItem key={akun.id} value={akun.id}>
                        {akun.namaAkun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.kasTujuanID && (
              <span className={KELAS_GALAT}>{errors.kasTujuanID.message}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="jumlah-transfer" className={KELAS_LABEL}>
              Jumlah (Rp)
            </label>
            <Input
              id="jumlah-transfer"
              inputMode="numeric"
              {...register("jumlah")}
              readOnly={memuat}
              className={cn(KELAS_ISIAN, "font-mono", errors.jumlah && "border-rose-500")}
            />
            {errors.jumlah && <span className={KELAS_GALAT}>{errors.jumlah.message}</span>}
          </div>
          <div className="space-y-2">
            <label htmlFor="keterangan-transfer" className={KELAS_LABEL}>
              Keterangan
            </label>
            <Input
              id="keterangan-transfer"
              {...register("keterangan")}
              readOnly={memuat}
              className={cn(KELAS_ISIAN, errors.keterangan && "border-rose-500")}
            />
            {errors.keterangan && (
              <span className={KELAS_GALAT}>{errors.keterangan.message}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-navy/10">
          <Button
            type="submit"
            disabled={memuat}
            className="w-full sm:w-auto bg-navy text-gading hover:bg-navy/90 font-bold px-6 shadow-sm"
          >
            {memuat ? (
              "Memindahkan..."
            ) : (
              <>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Pindahkan Dana
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function RiwayatTransfer({ akun, bolehBatal }: { akun: AkunKas[]; bolehBatal: boolean }) {
  const [filter, setFilter] = useState<FilterTransfer>(FILTER_AWAL_TRANSFER);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(UKURAN_MUTASI_BAWAAN);
  const [dibatalkan, setDibatalkan] = useState<JurnalTransfer | null>(null);
  const daftar = useDaftarTransfer(filter, halaman, ukuran);
  const router = useRouter();
  const pathname = usePathname();
  const dirinci = useSearchParams().get(PARAM_TRANSFER);

  const ubahFilter = (baru: FilterTransfer) => {
    setFilter(baru);
    setHalaman(1);
  };
  const hariIni = useTanggalHariIni();
  const panel = usePanelFilter({ terapan: filter, bawaan: FILTER_AWAL_TRANSFER, onTerapkan: ubahFilter });

  const kolom = useMemo<ColumnDef<JurnalTransfer>[]>(
    () => [
      {
        accessorKey: "tanggal",
        header: "Tanggal",
        // Pencatat menjadi baris kedua tanggal, bukan kolom sendiri, agar tabel
        // muat di laptop 1280 px (pemilik proyek, 14 November 2026).
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-navy">{formatTanggal(row.original.tanggal)}</span>
            <span className="text-kecil text-navy/60">oleh {row.original.dicatatOleh?.nama || "-"}</span>
          </div>
        ),
      },
      {
        id: "sumber",
        header: "Dari",
        meta: { lebarBungkus: 160 },
        cell: ({ row }) => <TeksDuaBaris teks={namaAkunTransfer(row.original.kasSumber)} />,
      },
      {
        id: "tujuan",
        header: "Ke",
        meta: { lebarBungkus: 160 },
        cell: ({ row }) => <TeksDuaBaris teks={namaAkunTransfer(row.original.kasTujuan)} />,
      },
      {
        id: "jumlah",
        meta: { label: "Jumlah" },
        header: () => <div className="text-right">Jumlah</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-navy">
            {formatRupiah(row.original.jumlah)}
          </div>
        ),
      },
      {
        accessorKey: "keterangan",
        header: "Keterangan",
        meta: { lebarBungkus: 180 },
        cell: ({ row }) => (
          <div>
            <TeksDuaBaris teks={row.original.keterangan} />
            {row.original.status === "VOID" && row.original.catatan && (
              <TeksDuaBaris teks={`Alasan batal: ${row.original.catatan}`} className="text-kecil text-navy/60" />
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span
              className={cn(
                "text-kecil font-bold",
                row.original.status === "AKTIF" ? "text-emerald-700" : "text-red-600",
              )}
            >
              {LABEL_STATUS_TRANSFER[row.original.status]}
            </span>
            {/* Asal buka kasir (PW15): alasan transfer Aktif ini tanpa Batalkan. */}
            {row.original.asal === "buka-kasir" && (
              <span className="text-kecil font-medium text-navy/60">{LABEL_DARI_BUKA_KASIR}</span>
            )}
          </div>
        ),
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        // Aksi baris di menu titik tiga seperti tabel lain (TB, CV17a).
        cell: ({ row }) =>
          bolehBatalTransfer(row.original, bolehBatal) ? (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Aksi transfer"
                    className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-gading border-navy/10">
                  <DropdownMenuItem
                    onClick={() => setDibatalkan(row.original)}
                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
                  >
                    Batalkan transfer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null,
      },
    ],
    [bolehBatal],
  );

  return (
    <section
      aria-label="Riwayat transfer"
      className="flex flex-col gap-6 w-full"
    >
      <div>
        <h2 className="text-subjudul font-bold tracking-wide text-navy">
          Riwayat Transfer
        </h2>
        <p className="text-isi font-medium text-navy/60 mt-1">
          Transfer antar akun kas, terbaru lebih dulu.
        </p>
      </div>

      <BilahFilter
        jumlahAktif={jumlahFilterTransfer(filter)}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={pilFilterTransfer(filter, akun, hariIni, ubahFilter)}
        onAturUlangSemua={() => ubahFilter(FILTER_AWAL_TRANSFER)}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahFilterTransfer(panel.draf)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        <KelompokFilter judul="Akun kas" htmlFor="filter-akun-transfer">
          <PilihDaftar
            id="filter-akun-transfer"
            nilai={panel.draf.akunKasID}
            onUbah={(akunKasID) => panel.setDraf({ ...panel.draf, akunKasID })}
            labelSemua="Semua akun"
            opsi={akun.map((a) => ({ id: a.id, nama: a.namaAkun }))}
          />
        </KelompokFilter>
        <KelompokFilter judul="Status">
          <PilihanSegmen
            label="Status"
            nilai={panel.draf.status || undefined}
            opsi={(["AKTIF", "VOID"] as const).map((v) => ({ nilai: v, label: LABEL_STATUS_TRANSFER[v] }))}
            onUbah={(status) => panel.setDraf({ ...panel.draf, status: status ?? "" })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Periode">
          <PilihanPeriode
            idAwalan="filter-transfer"
            hariIni={hariIni}
            labelDari="Transfer dari"
            labelSampai="Transfer sampai"
            batasiUrutan
            rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
            onUbah={({ dari, sampai }) => panel.setDraf({ ...panel.draf, dari, sampai })}
          />
        </KelompokFilter>
      </PanelFilter>

      {daftar.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center"
        >
          <p className="text-isi font-medium text-red-600">
            {pesanError(daftar.error, "Gagal memuat riwayat transfer.")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => daftar.refetch()}
            disabled={daftar.isFetching}
          >
            Coba Lagi
          </Button>
        </div>
      ) : (
        <DataTable
          columns={kolom}
          data={daftar.data?.data ?? []}
          loading={daftar.isLoading}
          emptyMessage="Belum ada transfer pada filter ini."
          paginasiServer={{
            halaman,
            jumlahHalaman: daftar.data?.pagination?.totalPages ?? 1,
            total: daftar.data?.pagination?.total ?? 0,
            ukuran,
            pilihanUkuran: PILIHAN_UKURAN_MUTASI,
            sibuk: daftar.isFetching,
            onGantiHalaman: setHalaman,
            onGantiUkuran: (baru) => {
              setUkuran(baru);
              setHalaman(1);
            },
          }}
        />
      )}

      <DialogRincianTransfer
        id={dirinci}
        onTutup={() => router.replace(pathname, { scroll: false })}
      />
      {dibatalkan && (
        <DialogBatalTransfer transfer={dibatalkan} onTutup={() => setDibatalkan(null)} />
      )}
    </section>
  );
}