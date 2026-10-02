"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Activity,
  Loader2,
  Lock,
  Phone,
  Save,
  Shield,
  Store,
  Terminal,
  Trash2,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  nilaiAwalProfil,
  payloadPerbaruiProfil,
  saringNomorHp,
  skemaProfil,
  type NilaiFormProfil,
} from "./schema-profil";

const KELAS_LABEL_BACA = "text-xs font-medium text-muted-foreground flex items-center gap-1.5";
const KELAS_LABEL = "text-xs font-medium text-foreground flex items-center gap-1.5";
const KELAS_KOTAK_BACA =
  "w-full rounded-md border border-input bg-muted/50 p-2.5 flex items-center justify-between text-sm select-none";
const KELAS_ISIAN_BACA =
  "flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed select-none";
const KELAS_ISIAN =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";
const KELAS_PIN =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors font-mono tracking-widest";

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-destructive">{pesan}</p>;
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

/**
 * Kartu profil beserta form-nya. Nilai awal dibaca dari data tersimpan
 * lewat defaultValues (keputusan rancangan butir 8); halaman memasangnya
 * ulang lewat kunciFormProfil, sehingga setelah simpan berhasil form
 * menampilkan nilai tersimpan dan tombol simpan kembali nonaktif. Hanya
 * field yang berubah yang dikirim (butir 15).
 */
function KartuProfil({
  pengguna,
  peran,
  namaToko,
}: {
  pengguna: PenggunaDetail;
  peran: string;
  namaToko: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NilaiFormProfil>({
    resolver: zodResolver(skemaProfil),
    defaultValues: nilaiAwalProfil(pengguna),
  });

  const perbarui = usePerbaruiProfil({
    onSuccess: (_data, vars) => {
      if (vars.payload.pinBaru !== undefined) {
        // Backend memutus sesi setiap PIN berubah (keputusan PF7a): sesi
        // pengguna diakhiri di sini, token akun dipertahankan, dan pengguna
        // cukup login PIN ulang.
        titipPesanLogin({
          judul: "PIN Berhasil Diubah",
          deskripsi: "Silakan login kembali dengan PIN baru Anda.",
        });
        tandaiKeluar();
        router.replace("/login/pengguna");
        return;
      }
      toast.success("Berhasil", {
        description: "Profil Anda berhasil diperbarui.",
      });
    },
    onError: (err) => {
      toast.error("Gagal", {
        description: pesanError(err, "Gagal memperbarui profil."),
      });
    },
  });

  const kirim = (nilai: NilaiFormProfil) => {
    const payload = payloadPerbaruiProfil(nilai, pengguna);
    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan untuk disimpan");
      return;
    }
    perbarui.mutate({ id: pengguna.id, payload });
  };

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-border pb-6">
        <Avatar className="h-20 w-20 border border-border">
          <AvatarFallback className="text-xl font-semibold bg-secondary text-foreground">
            {inisialNama(pengguna.nama)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            {pengguna.nama || "Nama Pengguna"}
          </h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Sesi Aktif: {peran} @ {namaToko}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(kirim)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className={KELAS_LABEL_BACA}>
              <Activity className="h-3.5 w-3.5" /> Status Pengguna
            </p>
            <div className={KELAS_KOTAK_BACA}>
              <span className="text-foreground capitalize">{pengguna.status}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  pengguna.status === "aktif"
                    ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                Locked
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className={KELAS_LABEL_BACA}>
              <Terminal className="h-3.5 w-3.5" /> Otorisasi Platform
            </p>
            <div className={KELAS_KOTAK_BACA}>
              <div className="flex gap-1">
                {pengguna.aksesType.map((type) => (
                  <span
                    key={type}
                    className="text-[10px] font-mono uppercase bg-background border border-border text-foreground px-1.5 py-0.5 rounded"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-muted border-border text-muted-foreground">
                Read Only
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="tokoProfil" className={KELAS_LABEL_BACA}>
              <Store className="h-3.5 w-3.5" /> Nama Toko / Tenant
            </label>
            <Input
              id="tokoProfil"
              type="text"
              value={namaToko}
              disabled
              readOnly
              className={KELAS_ISIAN_BACA}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="peranProfil" className={KELAS_LABEL_BACA}>
              <Shield className="h-3.5 w-3.5" /> Hak Akses / Role
            </label>
            <Input
              id="peranProfil"
              type="text"
              value={peran}
              disabled
              readOnly
              className={KELAS_ISIAN_BACA}
            />
          </div>
        </div>

        <hr className="border-border my-2" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="nama" className={KELAS_LABEL}>
              <User className="h-3.5 w-3.5" /> Nama Lengkap
            </label>
            <Input
              id="nama"
              {...register("nama")}
              readOnly={perbarui.isPending}
              placeholder="Masukkan nama lengkap"
              aria-invalid={errors.nama ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.nama?.message} />
          </div>

          <div className="space-y-2">
            <label htmlFor="nomorHp" className={KELAS_LABEL}>
              <Phone className="h-3.5 w-3.5" /> Nomor WhatsApp / HP
            </label>
            <Input
              id="nomorHp"
              type="text"
              inputMode="tel"
              {...saring(register("nomorHp"), saringNomorHp)}
              readOnly={perbarui.isPending}
              placeholder="Contoh: 08123456789"
              aria-invalid={errors.nomorHp ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.nomorHp?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-muted/20 p-4 rounded-lg border border-border">
          <div className="space-y-2">
            <label htmlFor="pinLama" className={KELAS_LABEL}>
              <Lock className="h-3.5 w-3.5" /> PIN Lama
            </label>
            <Input
              id="pinLama"
              type="password"
              inputMode="numeric"
              {...saring(register("pinLama"), hanyaAngka)}
              placeholder="Masukkan PIN saat ini"
              className={KELAS_PIN}
              maxLength={6}
              disabled={perbarui.isPending}
              aria-invalid={errors.pinLama ? true : undefined}
            />
            <PesanIsian pesan={errors.pinLama?.message} />
          </div>
          <div className="space-y-2">
            <label htmlFor="pinBaru" className={KELAS_LABEL}>
              <Lock className="h-3.5 w-3.5 text-primary" /> PIN Baru
            </label>
            <Input
              id="pinBaru"
              type="password"
              inputMode="numeric"
              {...saring(register("pinBaru"), hanyaAngka)}
              placeholder="Masukkan PIN baru"
              className={KELAS_PIN}
              maxLength={6}
              disabled={perbarui.isPending}
              aria-invalid={errors.pinBaru ? true : undefined}
            />
            <PesanIsian pesan={errors.pinBaru?.message} />
          </div>
          <p className="text-[11px] text-muted-foreground sm:col-span-2">
            *Kosongkan kedua kolom di atas jika Anda tidak berniat mengubah
            PIN.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={perbarui.isPending || !isDirty}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 cursor-pointer gap-2"
          >
            {perbarui.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Zona bahaya. Tombol hapus akun tampil nonaktif (keputusan PF2a): backend
 * belum punya jalur hapus akun sendiri, dan kebutuhannya (hanya Owner,
 * dengan autentikasi ulang) dicatat untuk tim backend.
 */
function ZonaBahaya() {
  return (
    <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-destructive">Zona Bahaya</h2>
        <p className="text-xs text-muted-foreground">
          Tindakan di bawah ini bersifat permanen dan memutus akses Anda dari
          tenant.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-destructive/20 pt-4 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Hapus Akun Ini</p>
          <p className="text-xs text-muted-foreground max-w-md">
            Menghapus data kepegawaian Anda dari database tenant saat ini.
            Sesi login akan segera dihentikan secara paksa.
          </p>
          <p id="keteranganHapusAkun" className="text-xs font-medium text-muted-foreground max-w-md">
            Fitur ini belum tersedia.
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-describedby="keteranganHapusAkun"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 h-10 py-2 px-4 shrink-0 cursor-pointer gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Hapus Akun
        </button>
      </div>
    </div>
  );
}

export function HalamanProfil() {
  const { pengguna: sesi } = useSession();
  const profil = usePenggunaSaya();
  // Nama toko dibaca dari GET /tenant/:id, bukan dari tenantName token, yang
  // menjadi "Toko Tidak Diketahui" setelah pin-refresh (keputusan PO15a).
  const tenant = useTenant();
  const namaToko = tenant.data?.namaToko ?? (tenant.isError ? "Toko" : "");
  const peran = sesi?.role || "Staf";

  if (profil.isPending) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profil Pengguna
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola informasi identitas akun Anda di dalam sistem outlet.
        </p>
      </div>

      {profil.isError ? (
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 space-y-3 text-center">
          <p className="text-sm font-medium text-destructive">
            {pesanError(profil.error, "Gagal memuat profil.")}
          </p>
          <button
            type="button"
            onClick={() => profil.refetch()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <KartuProfil
          key={kunciFormProfil(profil.data)}
          pengguna={profil.data}
          peran={peran}
          namaToko={namaToko}
        />
      )}

      <ZonaBahaya />
    </div>
  );
}