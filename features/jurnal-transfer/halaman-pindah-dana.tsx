"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";

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
import { Skeleton } from "@/components/ui/skeleton";
import { akunKasAktif } from "@/features/akun-kas/filter";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { PILIHAN_UKURAN_MUTASI, UKURAN_MUTASI_BAWAAN } from "@/features/akun-kas/mutasi";
import { URL_DAFTAR_AKUN_KAS } from "@/features/akun-kas/ubah";
import { pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AkunKas } from "@/types/akunKas";
import type { JurnalTransfer, StatusTransfer } from "@/types/jurnalTransfer";
import { DialogBatalTransfer } from "./dialog-batal-transfer";
import { useBuatTransfer, useDaftarTransfer } from "./hooks";
import { aksiTransfer } from "./izin";
import {
  FILTER_AWAL_TRANSFER,
  adaFilterTransfer,
  ISIAN_AWAL_PINDAH_DANA,
  LABEL_STATUS_TRANSFER,
  namaAkunTransfer,
  payloadBuatTransfer,
  pesanSaldoKurang,
  pilihanTujuan,
  type FilterTransfer,
} from "./payload";
import { skemaPindahDana, type IsianPindahDana } from "./schema";

const SEMUA = "semua";
const KELAS_ISIAN =
  "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947]";
const KELAS_LABEL = "text-sm font-bold text-[#0A2947]";
const KELAS_GALAT = "text-xs font-bold text-rose-500";
const KELAS_LABEL_FILTER = "text-xs font-bold text-[#0A2947]/70";
const KELAS_PEMICU_FILTER = "w-52 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]";

function Keadaan({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#0A2947]/20 bg-[#F2EAE1] p-12 text-center">
      <p className="text-base font-bold text-[#0A2947] mb-1">{judul}</p>
      <p className="text-sm font-medium text-[#0A2947]/60 max-w-md mx-auto">{isi}</p>
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
  const { permissions } = useSession();
  const aksi = aksiTransfer(permissions);
  const akunKas = useDaftarAkunKas();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8">
      <Link
        href={URL_DAFTAR_AKUN_KAS}
        className="inline-flex w-fit items-center text-sm font-semibold text-[#0A2947]/60 hover:text-[#0A2947]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar Akun Kas
      </Link>
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Pindah Dana</h1>
        <p className="text-sm font-medium text-[#0A2947]/60">
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
              <Skeleton className="h-72 w-full rounded-2xl bg-[#0A2947]/10" />
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
    <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm">
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
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
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
              <p className="text-xs font-medium text-[#0A2947]/60">
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
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
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

        <div className="flex justify-end pt-6 border-t border-[#0A2947]/10">
          <Button
            type="submit"
            disabled={memuat}
            className="w-full sm:w-auto bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold px-6 shadow-sm"
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

  const ubahFilter = (baru: FilterTransfer) => {
    setFilter(baru);
    setHalaman(1);
  };

  const kolom = useMemo<ColumnDef<JurnalTransfer>[]>(
    () => [
      {
        accessorKey: "tanggal",
        header: "Tanggal",
        cell: ({ row }) => (
          <span className="font-medium text-[#0A2947]">{formatTanggal(row.original.tanggal)}</span>
        ),
      },
      { id: "sumber", header: "Dari", cell: ({ row }) => namaAkunTransfer(row.original.kasSumber) },
      { id: "tujuan", header: "Ke", cell: ({ row }) => namaAkunTransfer(row.original.kasTujuan) },
      {
        id: "jumlah",
        header: () => <div className="text-right">Jumlah</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-[#0A2947]">
            {formatRupiah(row.original.jumlah)}
          </div>
        ),
      },
      {
        accessorKey: "keterangan",
        header: "Keterangan",
        cell: ({ row }) => (
          <div>
            <p>{row.original.keterangan}</p>
            {row.original.status === "VOID" && row.original.catatan && (
              <p className="text-xs text-[#0A2947]/60">Alasan batal: {row.original.catatan}</p>
            )}
          </div>
        ),
      },
      {
        id: "pencatat",
        header: "Dicatat oleh",
        cell: ({ row }) => row.original.dicatatOleh?.nama || "-",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={cn(
              "text-xs font-bold",
              row.original.status === "AKTIF" ? "text-emerald-700" : "text-red-600",
            )}
          >
            {LABEL_STATUS_TRANSFER[row.original.status]}
          </span>
        ),
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) =>
          bolehBatal && row.original.status === "AKTIF" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDibatalkan(row.original)}
            >
              Batalkan
            </Button>
          ) : null,
      },
    ],
    [bolehBatal],
  );

  return (
    <section
      aria-label="Riwayat transfer"
      className="bg-[#F2EAE1] border border-[#0A2947]/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-6 w-full overflow-hidden"
    >
      <div>
        <h2 className="text-base sm:text-lg font-bold tracking-wide text-[#0A2947]">
          Riwayat Transfer
        </h2>
        <p className="text-sm font-medium text-[#0A2947]/60 mt-1">
          Transfer antar akun kas, terbaru lebih dulu.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-akun-transfer" className={KELAS_LABEL_FILTER}>
            Akun kas
          </label>
          <Select
            value={filter.akunKasID || SEMUA}
            onValueChange={(v) => ubahFilter({ ...filter, akunKasID: v === SEMUA ? "" : v })}
          >
            <SelectTrigger id="filter-akun-transfer" className={KELAS_PEMICU_FILTER}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEMUA}>Semua akun</SelectItem>
              {akun.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.namaAkun}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-status-transfer" className={KELAS_LABEL_FILTER}>
            Status
          </label>
          <Select
            value={filter.status || SEMUA}
            onValueChange={(v) =>
              ubahFilter({ ...filter, status: v === SEMUA ? "" : (v as StatusTransfer) })
            }
          >
            <SelectTrigger id="filter-status-transfer" className={KELAS_PEMICU_FILTER}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEMUA}>Semua status</SelectItem>
              <SelectItem value="AKTIF">{LABEL_STATUS_TRANSFER.AKTIF}</SelectItem>
              <SelectItem value="VOID">{LABEL_STATUS_TRANSFER.VOID}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className={KELAS_LABEL_FILTER}>Transfer dari</span>
          <PilihTanggal
            label="Transfer dari"
            value={filter.dari}
            onChange={(dari) => ubahFilter({ ...filter, dari })}
            tanggalNonaktif={filter.sampai ? { after: filter.sampai } : undefined}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className={KELAS_LABEL_FILTER}>Transfer sampai</span>
          <PilihTanggal
            label="Transfer sampai"
            value={filter.sampai}
            onChange={(sampai) => ubahFilter({ ...filter, sampai })}
            tanggalNonaktif={filter.dari ? { before: filter.dari } : undefined}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!adaFilterTransfer(filter)}
          onClick={() => ubahFilter(FILTER_AWAL_TRANSFER)}
        >
          Reset Filter
        </Button>
      </div>

      {daftar.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center"
        >
          <p className="text-sm font-medium text-red-600">
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

      {dibatalkan && (
        <DialogBatalTransfer transfer={dibatalkan} onTutup={() => setDibatalkan(null)} />
      )}
    </section>
  );
}