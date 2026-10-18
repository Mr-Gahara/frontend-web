"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Receipt, Save } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PilihTanggal } from "@/components/pilih-tanggal";
import { Button } from "@/components/ui/button";
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
import { useDaftarKategoriBeban } from "@/features/kategori-beban/hooks";
import { useLevelPenggunaAktif } from "@/features/role/hooks";
import { pesanError } from "@/lib/api/error";
import { bolehBukaHalaman } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import { cn } from "@/lib/utils";
import { dariTanggalLokal, keTanggalLokal } from "@/lib/waktu";
import type { AkunKas } from "@/types/akunKas";
import type { KategoriBeban } from "@/types/bebanOperasional";
import { useBuatBeban } from "./hooks";
import { URL_PENGELUARAN, isianAwalCatat, payloadBuatBeban, pesanSaldoKurang } from "./payload";
import { buatSkemaCatatBeban, type IsianCatatBeban } from "./schema";

const URL_KATEGORI_BEBAN = "/dashboard/outlet/pengaturan/kategoriBeban";
const KELAS_ISIAN =
  "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy";
const KELAS_LABEL = "text-sm font-bold text-navy";
const KELAS_GALAT = "text-xs font-bold text-rose-500";

function Keadaan({ judul, isi, aksi }: { judul: string; isi: string; aksi?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy/20 bg-krem p-12 text-center">
      <p className="text-base font-bold text-navy mb-1">{judul}</p>
      <p className="text-sm font-medium text-navy/60 max-w-md mx-auto">{isi}</p>
      {aksi && <div className="mt-4 flex justify-center">{aksi}</div>}
    </div>
  );
}

/**
 * Catat beban (keputusan BO3a). Gerbang rute sudah menuntut izin catat
 * beban, baca kategori beban, dan baca akun kas. Owner, dikenali dari level
 * role 100, memilih tanggal beban; peran lain mencatat dengan tanggal hari
 * ini (BO5a, P23 backend). Pilihan akun hanya akun kas aktif, dan jumlah di
 * atas saldonya ditahan sebelum dikirim.
 */
export function HalamanCatatBeban() {
  const [hariIni] = useState(() => keTanggalLokal(new Date()));
  const owner = useLevelPenggunaAktif() === 100;
  const { permissions } = useSession();
  const akunKas = useDaftarAkunKas();
  const kategori = useDaftarKategoriBeban();
  const akunAktif = akunKasAktif(akunKas.data ?? []);

  let isi: ReactNode;
  if (akunKas.isLoading || kategori.isLoading) {
    isi = <Skeleton className="h-96 w-full rounded-2xl bg-navy/10" />;
  } else if (akunKas.isError || kategori.isError) {
    isi = (
      <Keadaan
        judul="Gagal memuat data form"
        isi={pesanError(akunKas.error ?? kategori.error, "Periksa koneksi lalu muat ulang halaman.")}
      />
    );
  } else if ((kategori.data ?? []).length === 0) {
    isi = (
      <Keadaan
        judul="Belum ada kategori beban"
        isi="Beban wajib berkategori. Tambahkan kategori lebih dulu di Pengaturan."
        aksi={
          bolehBukaHalaman(URL_KATEGORI_BEBAN, permissions) ? (
            <Button asChild className="bg-navy text-gading hover:bg-navy/90 font-bold">
              <Link href={URL_KATEGORI_BEBAN}>Kelola Kategori Beban</Link>
            </Button>
          ) : undefined
        }
      />
    );
  } else if (akunAktif.length === 0) {
    isi = (
      <Keadaan
        judul="Belum ada akun kas aktif"
        isi="Beban dibayar dari akun kas aktif. Aktifkan atau tambahkan akun kas lebih dulu."
      />
    );
  } else {
    isi = (
      <FormCatatBeban
        akunAktif={akunAktif}
        kategori={kategori.data ?? []}
        owner={owner}
        hariIni={hariIni}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-4">
        <Link
          href={URL_PENGELUARAN}
          className="inline-flex w-fit items-center text-sm font-semibold text-navy/60 hover:text-navy"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Pengeluaran
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <Receipt className="w-6 h-6 text-karamel" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-navy">Catat Beban</h1>
            <p className="text-sm font-medium text-navy/60">
              Pengeluaran toko di luar pembelian stok. Saldo akun kas langsung berkurang.
            </p>
          </div>
        </div>
      </div>
      {isi}
    </div>
  );
}

function FormCatatBeban({
  akunAktif,
  kategori,
  owner,
  hariIni,
}: {
  akunAktif: AkunKas[];
  kategori: KategoriBeban[];
  owner: boolean;
  hariIni: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<IsianCatatBeban>({
    resolver: zodResolver(buatSkemaCatatBeban(hariIni)),
    defaultValues: isianAwalCatat(hariIni),
  });
  const akunKasID = useWatch({ control, name: "akunKasID" });
  const akun = akunAktif.find((a) => a.id === akunKasID);

  const buat = useBuatBeban({
    onSuccess: () => {
      toast.success("Beban dicatat", { description: "Saldo akun kas telah dikurangi." });
      router.push(URL_PENGELUARAN);
    },
    onError: (err) => {
      toast.error("Gagal Mencatat Beban", {
        description: pesanError(err, "Gagal mencatat beban."),
      });
    },
  });
  const memuat = buat.isPending;

  const kirim = (isian: IsianCatatBeban) => {
    const kurang = pesanSaldoKurang(isian.jumlah, akun);
    if (kurang) {
      setError("jumlah", { message: kurang });
      return;
    }
    buat.mutate(payloadBuatBeban(isian, owner, hariIni));
  };

  return (
    <div className="rounded-2xl border border-navy/10 bg-krem shadow-sm">
      <form noValidate onSubmit={handleSubmit(kirim)} className="flex flex-col gap-6 p-5 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="akun-kas-beban" className={KELAS_LABEL}>
              Akun Kas
            </label>
            <Controller
              name="akunKasID"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={memuat}>
                  <SelectTrigger
                    id="akun-kas-beban"
                    className={cn(KELAS_ISIAN, "w-full", errors.akunKasID && "border-rose-500")}
                  >
                    <SelectValue placeholder="Pilih akun kas" />
                  </SelectTrigger>
                  <SelectContent className="bg-gading border-navy/10 text-navy">
                    {akunAktif.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.namaAkun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {akun && (
              <p className="text-xs font-medium text-navy/60">Saldo tersedia {formatRupiah(akun.saldo)}</p>
            )}
            {errors.akunKasID && <span className={KELAS_GALAT}>{errors.akunKasID.message}</span>}
          </div>

          <div className="space-y-2">
            <label htmlFor="kategori-beban" className={KELAS_LABEL}>
              Kategori
            </label>
            <Controller
              name="kategoriBebanID"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={memuat}>
                  <SelectTrigger
                    id="kategori-beban"
                    className={cn(KELAS_ISIAN, "w-full", errors.kategoriBebanID && "border-rose-500")}
                  >
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-gading border-navy/10 text-navy">
                    {kategori.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.namaKategori}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.kategoriBebanID && (
              <span className={KELAS_GALAT}>{errors.kategoriBebanID.message}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="jumlah-beban" className={KELAS_LABEL}>
              Jumlah (Rp)
            </label>
            <Input
              id="jumlah-beban"
              inputMode="numeric"
              {...register("jumlah")}
              readOnly={memuat}
              className={cn(KELAS_ISIAN, "font-mono", errors.jumlah && "border-rose-500")}
            />
            {errors.jumlah && <span className={KELAS_GALAT}>{errors.jumlah.message}</span>}
          </div>

          <div className="space-y-2">
            <span className={KELAS_LABEL}>Tanggal Beban</span>
            {owner ? (
              <Controller
                name="tanggal"
                control={control}
                render={({ field }) => (
                  <PilihTanggal
                    label="Tanggal Beban"
                    value={dariTanggalLokal(field.value)}
                    onChange={(tanggal) => field.onChange(keTanggalLokal(tanggal))}
                    tanggalNonaktif={{ after: new Date() }}
                    disabled={memuat}
                    invalid={!!errors.tanggal}
                  />
                )}
              />
            ) : (
              <p className="rounded-md border border-navy/20 bg-gading px-3 py-2 text-sm font-medium text-navy">
                Hari ini, {formatTanggalPendek((dariTanggalLokal(hariIni) as Date).toISOString())}
              </p>
            )}
            {owner ? (
              errors.tanggal && <span className={KELAS_GALAT}>{errors.tanggal.message}</span>
            ) : (
              <p className="text-xs font-medium text-navy/60">
                Hanya Owner yang dapat mencatat beban bertanggal lampau.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="keterangan-beban" className={KELAS_LABEL}>
            Keterangan
          </label>
          <Input
            id="keterangan-beban"
            {...register("keterangan")}
            readOnly={memuat}
            placeholder="Misal: Bayar listrik Oktober"
            className={cn(KELAS_ISIAN, errors.keterangan && "border-rose-500")}
          />
          {errors.keterangan && <span className={KELAS_GALAT}>{errors.keterangan.message}</span>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-navy/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(URL_PENGELUARAN)}
            disabled={memuat}
            className="w-full sm:w-auto cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold px-6"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={memuat}
            className="w-full sm:w-auto cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold px-6 shadow-sm"
          >
            {memuat ? (
              "Menyimpan..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Beban
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}