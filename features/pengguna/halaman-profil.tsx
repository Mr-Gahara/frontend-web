"use client";

import { Suspense, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabUrl } from "@/hooks/use-tab-url";
import { pesanError } from "@/lib/api/error";
import { titipPesanLogin } from "@/lib/auth/pesan-login";
import { tandaiKeluar } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { useTenant } from "@/features/tenant/hooks";
import type { PenggunaDetail } from "@/types/pengguna";
import { usePenggunaSaya, usePerbaruiProfil } from "./hooks-profil";
import {
  hanyaAngka,
  inisialNama,
  kunciFormProfil,
  NILAI_AWAL_PIN,
  nilaiAwalDataDiri,
  payloadDataDiri,
  payloadGantiPin,
  saringNomorHp,
  skemaDataDiri,
  skemaPin,
  type NilaiDataDiri,
  type NilaiPin,
} from "./schema-profil";
import {
  SLUG_TAB_PROFIL,
  TAB_PROFIL,
  teksAkses,
  teksLokasiKerja,
  teksPeranToko,
  teksStatusPengguna,
  type TabProfil,
} from "./tampilan-profil";

const KELAS_KARTU = "flex flex-col gap-5 rounded-2xl border border-navy/10 bg-permukaan p-4 sm:p-6";
const KELAS_LABEL = "text-isi font-semibold";
const KELAS_TOMBOL = "h-10 w-full bg-navy px-6 font-bold text-gading hover:bg-navy-terang sm:h-11 sm:w-auto";
const KELAS_TRIGGER =
  "h-10 rounded-lg text-isi font-semibold text-cokelat data-[state=active]:bg-permukaan data-[state=active]:font-bold data-[state=active]:text-navy data-[state=active]:shadow-sm sm:h-9 after:hidden";

function PesanIsian({ id, pesan }: { id: string; pesan?: string }) {
  if (!pesan) return null;
  return (
    <p id={id} className="text-kecil font-medium text-destructive">
      {pesan}
    </p>
  );
}

/**
 * Menyaring ketikan sebelum nilainya dibaca React Hook Form, sehingga
 * karakter yang ditolak tidak pernah masuk ke nilai form.
 */
function saring(isian: UseFormRegisterReturn, bersihkan: (teks: string) => string) {
  return {
    ...isian,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      e.target.value = bersihkan(e.target.value);
      return isian.onChange(e);
    },
  };
}

function Ringkasan({ pengguna, namaToko }: { pengguna: PenggunaDetail; namaToko: string }) {
  const butir: [string, ReactNode][] = [
    ["Toko", namaToko || "-"],
    ["Lokasi kerja", teksLokasiKerja(pengguna.lokasiKerja)],
    ["Akses", teksAkses(pengguna.aksesType)],
    ["Status", teksStatusPengguna(pengguna.status)],
  ];
  return (
    <dl aria-label="Ringkasan akun" className="grid gap-x-6 gap-y-0 rounded-xl bg-krem-muda px-3 py-1 sm:grid-cols-2 sm:gap-y-4 sm:p-4">
      {butir.map(([label, nilai]) => (
        <div key={label} className="flex min-w-0 justify-between gap-3 py-2 sm:flex-col sm:justify-start sm:gap-0.5 sm:py-0">
          <dt className="w-24 shrink-0 text-isi text-cokelat sm:w-auto sm:text-kecil">{label}</dt>
          <dd className="min-w-0 text-right text-isi font-semibold [overflow-wrap:anywhere] sm:text-left">{nilai}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Tab Data Diri (PU1a): nama dan nomor HP. Nilai awal dari data tersimpan
 * lewat defaultValues (keputusan rancangan butir 8); halaman memasangnya
 * ulang lewat kunciFormProfil setelah simpan. Hanya field yang berubah yang
 * dikirim (butir 15).
 */
function FormDataDiri({ pengguna, namaToko }: { pengguna: PenggunaDetail; namaToko: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NilaiDataDiri>({
    resolver: zodResolver(skemaDataDiri),
    defaultValues: nilaiAwalDataDiri(pengguna),
  });
  const perbarui = usePerbaruiProfil({
    onSuccess: () => toast.success("Berhasil", { description: "Data diri Anda berhasil diperbarui." }),
    onError: (err) => toast.error("Gagal", { description: pesanError(err, "Gagal memperbarui data diri.") }),
  });

  const kirim = (nilai: NilaiDataDiri) => {
    const payload = payloadDataDiri(nilai, pengguna);
    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan untuk disimpan");
      return;
    }
    perbarui.mutate({ id: pengguna.id, payload });
  };

  return (
    <form onSubmit={handleSubmit(kirim)} noValidate aria-label="Data Diri" className={KELAS_KARTU}>
      <Ringkasan pengguna={pengguna} namaToko={namaToko} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="nama" className={KELAS_LABEL}>
            Nama Lengkap
          </label>
          <Input
            id="nama"
            {...register("nama")}
            readOnly={perbarui.isPending}
            placeholder="Masukkan nama lengkap"
            aria-invalid={errors.nama ? true : undefined}
            aria-describedby={errors.nama ? "galat-nama" : undefined}
          />
          <PesanIsian id="galat-nama" pesan={errors.nama?.message} />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="nomorHp" className={KELAS_LABEL}>
            Nomor WhatsApp / HP
          </label>
          <Input
            id="nomorHp"
            type="text"
            inputMode="tel"
            {...saring(register("nomorHp"), saringNomorHp)}
            readOnly={perbarui.isPending}
            placeholder="Contoh: 08123456789"
            aria-invalid={errors.nomorHp ? true : undefined}
            aria-describedby={errors.nomorHp ? "galat-nomorHp" : undefined}
          />
          <PesanIsian id="galat-nomorHp" pesan={errors.nomorHp?.message} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={perbarui.isPending || !isDirty} className={KELAS_TOMBOL}>
          {perbarui.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Data Diri
        </Button>
      </div>
    </form>
  );
}

/**
 * Tab Keamanan PIN (PU1a): form sendiri. Backend memutus sesi setiap PIN
 * berubah (keputusan PF7a): sesi pengguna diakhiri, token akun
 * dipertahankan, dan pengguna cukup login PIN ulang.
 */
function FormPin({ pengguna }: { pengguna: PenggunaDetail }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiPin>({ resolver: zodResolver(skemaPin), defaultValues: NILAI_AWAL_PIN });
  const perbarui = usePerbaruiProfil({
    onSuccess: () => {
      titipPesanLogin({
        judul: "PIN Berhasil Diubah",
        deskripsi: "Silakan login kembali dengan PIN baru Anda.",
      });
      tandaiKeluar();
      router.replace("/login/pengguna");
    },
    onError: (err) => toast.error("Gagal", { description: pesanError(err, "Gagal mengganti PIN.") }),
  });

  return (
    <form
      onSubmit={handleSubmit((nilai) => perbarui.mutate({ id: pengguna.id, payload: payloadGantiPin(nilai) }))}
      noValidate
      aria-label="Keamanan PIN"
      className={KELAS_KARTU}
    >
      <p className="rounded-xl bg-krem px-4 py-3 text-isi text-karamel-tua">
        PIN dipakai untuk masuk di web dan aplikasi. Setelah PIN diganti, Anda keluar dan masuk lagi dengan PIN
        baru.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="pinLama" className={KELAS_LABEL}>
            PIN Lama
          </label>
          <Input
            id="pinLama"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            {...saring(register("pinLama"), hanyaAngka)}
            placeholder="PIN saat ini"
            maxLength={6}
            disabled={perbarui.isPending}
            aria-invalid={errors.pinLama ? true : undefined}
            aria-describedby={errors.pinLama ? "galat-pinLama" : undefined}
          />
          <PesanIsian id="galat-pinLama" pesan={errors.pinLama?.message} />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="pinBaru" className={KELAS_LABEL}>
            PIN Baru
          </label>
          <Input
            id="pinBaru"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            {...saring(register("pinBaru"), hanyaAngka)}
            placeholder="6 digit angka"
            maxLength={6}
            disabled={perbarui.isPending}
            aria-invalid={errors.pinBaru ? true : undefined}
            aria-describedby={errors.pinBaru ? "galat-pinBaru" : undefined}
          />
          <PesanIsian id="galat-pinBaru" pesan={errors.pinBaru?.message} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={perbarui.isPending} className={KELAS_TOMBOL}>
          {perbarui.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Ganti PIN
        </Button>
      </div>
    </form>
  );
}

/**
 * Laman profil desain C (pemilik proyek, 24 November 2026; PU1a): kepala
 * berisi avatar, nama, peran, dan toko, lalu tab Data Diri dan Keamanan PIN
 * yang tersimpan di ?tab=.
 */
function IsiHalamanProfil() {
  const { pengguna: sesi } = useSession();
  const profil = usePenggunaSaya();
  // Nama toko dibaca dari GET /tenant/:id, bukan dari tenantName token, yang
  // menjadi "Toko Tidak Diketahui" setelah pin-refresh (keputusan PO15a).
  const tenant = useTenant();
  const namaToko = tenant.data?.namaToko ?? (tenant.isError ? "Toko" : "");
  const peran = sesi?.role || "Staf";
  const [tab, pilihTab] = useTabUrl<TabProfil>(SLUG_TAB_PROFIL, TAB_PROFIL, "data-diri");

  if (profil.isPending) {
    return (
      <div role="status" className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
        <span className="sr-only">Memuat profil</span>
      </div>
    );
  }

  if (profil.isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:px-4 sm:py-8">
        <h1 className="text-judul font-bold tracking-tight">Profil Pengguna</h1>
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 sm:p-6">
          <p className="text-isi font-medium text-destructive">{pesanError(profil.error, "Gagal memuat profil.")}</p>
          <Button type="button" variant="outline" onClick={() => profil.refetch()} disabled={profil.isFetching}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const pengguna = profil.data;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6 sm:px-4 sm:py-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-navy text-subjudul font-bold text-gading sm:size-16"
        >
          {inisialNama(pengguna.nama)}
        </span>
        <div className="min-w-0">
          <h1 className="text-judul font-bold tracking-tight [overflow-wrap:anywhere]">{pengguna.nama}</h1>
          <p className="text-isi text-muted-foreground [overflow-wrap:anywhere]">{teksPeranToko(peran, namaToko)}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => pilihTab(v as TabProfil)} className="flex w-full flex-col gap-5 sm:gap-6">
        <TabsList aria-label="Profil" className="grid h-auto! w-full grid-cols-2 gap-1 rounded-xl bg-krem p-1 sm:max-w-90">
          <TabsTrigger value="data-diri" className={KELAS_TRIGGER}>
            Data Diri
          </TabsTrigger>
          <TabsTrigger value="pin" className={KELAS_TRIGGER}>
            Keamanan PIN
          </TabsTrigger>
        </TabsList>
        <TabsContent value="data-diri">
          <FormDataDiri key={kunciFormProfil(pengguna)} pengguna={pengguna} namaToko={namaToko} />
        </TabsContent>
        <TabsContent value="pin">
          <FormPin pengguna={pengguna} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** useSearchParams (tab di URL) membutuhkan batas Suspense. */
export function HalamanProfil() {
  return (
    <Suspense fallback={null}>
      <IsiHalamanProfil />
    </Suspense>
  );
}
