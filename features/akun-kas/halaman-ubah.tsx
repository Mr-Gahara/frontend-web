"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { pesanError } from "@/lib/api/error";
import { cn } from "@/lib/utils";
import type { AkunKas } from "@/types/akunKas";
import { DialogStatusAkun } from "./dialog-status-akun";
import { useDaftarAkunKas, useUbahAkunKas } from "./hooks";
import {
  URL_DAFTAR_AKUN_KAS,
  adaPerubahanAkunKas,
  isianAwalUbah,
  payloadUbahAkunKas,
  skemaUbahAkunKas,
  type IsianUbahAkunKas,
} from "./ubah";
import { formatRupiah } from "@/lib/format";

const KELAS_ISIAN =
  "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947]";

function Keadaan({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#0A2947]/20 bg-[#F2EAE1] p-12 text-center">
      <p className="text-base font-bold text-[#0A2947] mb-1">{judul}</p>
      <p className="text-sm font-medium text-[#0A2947]/60 max-w-md mx-auto">{isi}</p>
    </div>
  );
}

/**
 * Halaman ubah akun kas (keputusan UA1a). Akun diambil dari daftar yang sudah
 * dimuat halaman keuangan, sehingga tidak ada permintaan detail tersendiri.
 * Rute ini hanya dipasang bagi pemegang read-akunkas dan update-akunkas
 * (gerbang rute, keputusan GR5a).
 */
export function HalamanUbahAkunKas() {
  const { id } = useParams<{ id: string }>();
  const { data: daftar, isLoading, isError } = useDaftarAkunKas();
  const akun = daftar?.find((a) => a.id === id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <Link
        href={URL_DAFTAR_AKUN_KAS}
        className="inline-flex w-fit items-center text-sm font-semibold text-[#0A2947]/60 hover:text-[#0A2947]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar Akun Kas
      </Link>
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl bg-[#0A2947]/10" />
      ) : isError ? (
        <Keadaan
          judul="Gagal memuat akun kas"
          isi="Periksa koneksi lalu muat ulang halaman."
        />
      ) : !akun ? (
        <Keadaan
          judul="Akun kas tidak ditemukan"
          isi="Akun ini tidak ada di toko Anda. Kembali ke daftar untuk memilih akun lain."
        />
      ) : (
        <FormUbah key={akun.id} akun={akun} />
      )}
    </div>
  );
}

function FormUbah({ akun }: { akun: AkunKas }) {
  const router = useRouter();
  const [tujuanStatus, setTujuanStatus] = useState<AkunKas["status"] | null>(null);
  const awal = isianAwalUbah(akun);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IsianUbahAkunKas>({
    resolver: zodResolver(skemaUbahAkunKas),
    defaultValues: awal,
  });

  // Simpan hanya menyala bila ada selisih terhadap akun yang dimuat
  // (keputusan UA4a): PUT tanpa perubahan ditolak backend dengan 400.
  const nilai = useWatch({ control });
  const berubah = adaPerubahanAkunKas(akun, {
    tipeAkun: nilai.tipeAkun ?? awal.tipeAkun,
    namaAkun: nilai.namaAkun ?? awal.namaAkun,
    nomorAkun: nilai.nomorAkun ?? awal.nomorAkun,
    keterangan: nilai.keterangan ?? awal.keterangan,
  });

  const ubah = useUbahAkunKas({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Perubahan akun kas telah disimpan." });
      router.push(URL_DAFTAR_AKUN_KAS);
    },
    onError: (err) => {
      toast.error("Gagal Menyimpan", {
        description: pesanError(err, "Gagal menyimpan perubahan akun kas."),
      });
    },
  });
  const memuat = ubah.isPending;

  const kirim = (isian: IsianUbahAkunKas) => {
    const payload = payloadUbahAkunKas(akun, isian);
    if (Object.keys(payload).length === 0) return;
    ubah.mutate({ id: akun.id, payload });
  };

  const aktif = akun.status === "aktif";

  return (
    <>
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Ubah Akun Kas</h1>
        <p className="text-sm font-medium text-[#0A2947]/60">{akun.namaAkun}</p>
      </div>

      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm">
        <form
          noValidate
          onSubmit={handleSubmit(kirim)}
          className="flex flex-col gap-6 p-5 sm:p-8"
        >
          <div className="space-y-2">
            <label htmlFor="tipe-akun" className="text-sm font-bold text-[#0A2947]">
              Tipe Akun
            </label>
            <Controller
              name="tipeAkun"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={memuat}>
                  <SelectTrigger
                    id="tipe-akun"
                    className={cn(KELAS_ISIAN, "w-full font-bold", errors.tipeAkun && "border-rose-500")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem value="Kas Fisik">Kas Fisik</SelectItem>
                    <SelectItem value="Rekening Bank">Rekening Bank</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipeAkun && (
              <span className="text-xs font-bold text-rose-500">{errors.tipeAkun.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="nama-akun" className="text-sm font-bold text-[#0A2947]">
                Nama Akun
              </label>
              <Input
                id="nama-akun"
                {...register("namaAkun")}
                disabled={memuat}
                className={cn(KELAS_ISIAN, errors.namaAkun && "border-rose-500")}
              />
              {errors.namaAkun && (
                <span className="text-xs font-bold text-rose-500">{errors.namaAkun.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="nomor-akun" className="text-sm font-bold text-[#0A2947]">
                Nomor Akun
              </label>
              <Input
                id="nomor-akun"
                {...register("nomorAkun")}
                disabled={memuat}
                className={cn(KELAS_ISIAN, errors.nomorAkun && "border-rose-500")}
              />
              {errors.nomorAkun && (
                <span className="text-xs font-bold text-rose-500">{errors.nomorAkun.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="keterangan-akun" className="text-sm font-bold text-[#0A2947]">
              Keterangan{" "}
              <span className="text-[#0A2947]/50 font-medium">(Opsional)</span>
            </label>
            <Input
              id="keterangan-akun"
              {...register("keterangan")}
              disabled={memuat}
              className={cn(KELAS_ISIAN, errors.keterangan && "border-rose-500")}
            />
            {errors.keterangan && (
              <span className="text-xs font-bold text-rose-500">{errors.keterangan.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-[#0A2947]">Saldo Saat Ini</p>
            <p className="font-mono text-lg font-bold text-[#0A2947]">
              {formatRupiah(akun.saldo ?? 0)}
            </p>
            <p className="text-xs font-medium text-[#0A2947]/50">
              Saldo tidak dapat diubah di sini; saldo hanya berubah lewat transaksi.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(URL_DAFTAR_AKUN_KAS)}
              disabled={memuat}
              className="w-full sm:w-auto border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold px-6"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={memuat || !berubah}
              className="w-full sm:w-auto bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold px-6 shadow-sm"
            >
              {memuat ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-base font-bold text-[#0A2947]">
            Status: {aktif ? "Aktif" : "Non-aktif"}
          </h2>
          <p className="text-sm font-medium text-[#0A2947]/60">
            {aktif
              ? "Akun hanya dapat dinonaktifkan bila saldonya 0 dan tidak dipakai metode pembayaran."
              : "Akun non-aktif dapat diaktifkan kembali selama akun aktif belum mencapai 10."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setTujuanStatus(aktif ? "non-aktif" : "aktif")}
          disabled={memuat}
          className="w-full sm:w-auto border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
        >
          {aktif ? "Nonaktifkan Akun" : "Aktifkan Kembali"}
        </Button>
      </section>

      {tujuanStatus && (
        <DialogStatusAkun
          akun={akun}
          tujuan={tujuanStatus}
          onTutup={() => setTujuanStatus(null)}
          onBerhasil={() => router.push(URL_DAFTAR_AKUN_KAS)}
        />
      )}
    </>
  );
}