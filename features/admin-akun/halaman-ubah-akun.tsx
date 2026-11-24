"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pesanError } from "@/lib/api/error";
import type { AkunAdmin } from "@/types/adminAkun";
import { useAkun, usePerbaruiAkun } from "./hooks";
import { akunTidakAda, KELAS_TINGGI_TOMBOL, KELAS_TOMBOL_UTAMA, urlDetailAkun, URL_DAFTAR_AKUN } from "./tampilan";
import {
  aksiKelolaAkun,
  nilaiAwalUbahAkun,
  payloadPerbaruiAkun,
  skemaUbahAkun,
  type NilaiUbahAkun,
} from "./ubah";

const KELAS_LABEL = "text-isi font-medium";
const KELAS_GALAT = "text-kecil font-medium text-destructive";
const KELAS_KETERANGAN = "text-kecil text-muted-foreground";

function FormUbahAkun({ akun }: { akun: AkunAdmin }) {
  const router = useRouter();
  const [galat, setGalat] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiUbahAkun>({
    resolver: zodResolver(skemaUbahAkun),
    defaultValues: nilaiAwalUbahAkun(akun),
  });
  const perbarui = usePerbaruiAkun({
    onSuccess: () => {
      toast.success("Akun diperbarui", { description: akun.email });
      router.push(urlDetailAkun(akun.id));
    },
    onError: (err) => setGalat(pesanError(err, "Gagal memperbarui akun.")),
  });
  const memuat = perbarui.isPending;

  const kirim = (nilai: NilaiUbahAkun) => {
    setGalat("");
    const payload = payloadPerbaruiAkun(nilai, akun);
    if (Object.keys(payload).length === 0) {
      setGalat("Tidak ada perubahan untuk disimpan.");
      return;
    }
    perbarui.mutate({ id: akun.id, payload });
  };

  return (
    <form onSubmit={handleSubmit(kirim)} noValidate className="flex flex-col gap-6">
      <section aria-label="Data masuk" className="flex flex-col gap-5 rounded-2xl border border-navy/10 bg-permukaan p-4 sm:p-6">
      <div className="space-y-2">
        <label htmlFor="email" className={KELAS_LABEL}>
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="off"
          aria-invalid={errors.email ? true : undefined}
          disabled={memuat}
          {...register("email")}
        />
        {errors.email && <p className={KELAS_GALAT}>{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className={KELAS_LABEL}>
          Username
        </label>
        <Input
          id="username"
          autoComplete="off"
          placeholder="Opsional"
          aria-invalid={errors.username ? true : undefined}
          disabled={memuat}
          {...register("username")}
        />
        {errors.username && <p className={KELAS_GALAT}>{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className={KELAS_LABEL}>
          Password baru
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Kosongkan bila tidak diganti"
          aria-invalid={errors.password ? true : undefined}
          disabled={memuat}
          {...register("password")}
        />
        <p className={KELAS_KETERANGAN}>
          Mengganti password memutus sesi akun ini. Sampaikan password baru kepada klien.
        </p>
        {errors.password && <p className={KELAS_GALAT}>{errors.password.message}</p>}
      </div>

      </section>

      {galat && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-isi font-medium text-destructive">
          {galat}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {/* Tautan terkunci selama menyimpan: `disabled` tidak berlaku pada <a>. */}
        <Button
          asChild
          variant="outline"
          className={`w-full sm:w-auto ${KELAS_TINGGI_TOMBOL} sm:px-6 aria-disabled:pointer-events-none aria-disabled:opacity-50`}
        >
          <Link href={urlDetailAkun(akun.id)} aria-disabled={memuat} tabIndex={memuat ? -1 : undefined}>
            Batal
          </Link>
        </Button>
        <Button
          type="submit"
          className={`w-full sm:w-auto sm:px-6 ${KELAS_TINGGI_TOMBOL} ${KELAS_TOMBOL_UTAMA}`}
          disabled={memuat}
        >
          {memuat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}

/**
 * Halaman ubah akun klien (keputusan PA12a dan PA13a). Akun dibaca dari
 * GET /akun/admin/users/:id (B176), dan form dipasang setelah datanya ada,
 * dengan key id dan updatedAt (keputusan rancangan butir 8).
 */
export function HalamanUbahAkun() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const detail = useAkun(id);
  const akun = detail.data;

  let isi: ReactNode;
  if (detail.isError && akunTidakAda(detail.error)) {
    isi = (
      <p role="alert" className="rounded-2xl border border-navy/10 bg-permukaan p-4 text-isi font-medium sm:p-6">
        Akun tidak ditemukan. Akun ini mungkin sudah dihapus.
      </p>
    );
  } else if (detail.isError) {
    isi = (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 sm:p-6">
        <p className="text-isi font-medium text-destructive">
          {pesanError(detail.error, "Gagal memuat data akun.")}
        </p>
        <Button type="button" variant="outline" onClick={() => detail.refetch()} disabled={detail.isFetching}>
          Coba Lagi
        </Button>
      </div>
    );
  } else if (!akun) {
    isi = <p className="text-isi text-muted-foreground">Memuat data akun...</p>;
  } else if (!aksiKelolaAkun(akun).ubah) {
    isi = (
      <p role="alert" className="rounded-2xl border border-navy/10 bg-permukaan p-4 text-isi font-medium sm:p-6">
        Akun admin tidak dapat diubah dari panel ini.
      </p>
    );
  } else {
    isi = <FormUbahAkun key={`${akun.id}-${akun.updatedAt}`} akun={akun} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:px-4 sm:py-8">
      <div className="flex flex-col gap-4">
        <Link
          href={id ? urlDetailAkun(id) : URL_DAFTAR_AKUN}
          className="inline-flex w-fit items-center text-isi font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Detail Akun
        </Link>
        <h1 className="text-judul font-bold tracking-tight">Ubah Akun</h1>
      </div>
      {isi}
    </div>
  );
}