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
import { useDaftarAkun, usePerbaruiAkun } from "./hooks";
import { urlDetailAkun, URL_DAFTAR_AKUN } from "./tampilan";
import {
  aksiKelolaAkun,
  nilaiAwalUbahAkun,
  payloadPerbaruiAkun,
  skemaUbahAkun,
  type NilaiUbahAkun,
} from "./ubah";

const KELAS_LABEL = "text-sm font-medium";
const KELAS_GALAT = "text-xs font-medium text-destructive";
const KELAS_KETERANGAN = "text-xs text-muted-foreground";

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
    <form onSubmit={handleSubmit(kirim)} noValidate className="space-y-5">
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

      {galat && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {galat}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Link href={urlDetailAkun(akun.id)}>
          <Button type="button" variant="outline" disabled={memuat}>
            Batal
          </Button>
        </Link>
        <Button type="submit" disabled={memuat}>
          {memuat ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}

/**
 * Halaman ubah akun klien (keputusan PA12a dan PA13a). Akun dibaca dari
 * cache daftar, dan form dipasang setelah datanya ada, dengan key id dan
 * updatedAt (keputusan rancangan butir 8).
 */
export function HalamanUbahAkun() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const daftar = useDaftarAkun();
  const akun = daftar.data?.find((a) => a.id === id);

  let isi: ReactNode;
  if (daftar.isError) {
    isi = (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-6">
        <p className="text-sm font-medium text-destructive">
          {pesanError(daftar.error, "Gagal memuat data akun.")}
        </p>
        <Button type="button" variant="outline" onClick={() => daftar.refetch()} disabled={daftar.isFetching}>
          Coba Lagi
        </Button>
      </div>
    );
  } else if (!daftar.data) {
    isi = <p className="text-sm text-muted-foreground">Memuat data akun...</p>;
  } else if (!akun) {
    isi = (
      <p role="alert" className="rounded-lg border border-border p-6 text-sm font-medium">
        Akun tidak ditemukan. Akun ini mungkin sudah dihapus.
      </p>
    );
  } else if (!aksiKelolaAkun(akun).ubah) {
    isi = (
      <p role="alert" className="rounded-lg border border-border p-6 text-sm font-medium">
        Akun admin tidak dapat diubah dari panel ini.
      </p>
    );
  } else {
    isi = <FormUbahAkun key={`${akun.id}-${akun.updatedAt}`} akun={akun} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href={id ? urlDetailAkun(id) : URL_DAFTAR_AKUN}
          className="inline-flex w-fit items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Detail Akun
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Ubah Akun</h1>
      </div>
      {isi}
    </div>
  );
}