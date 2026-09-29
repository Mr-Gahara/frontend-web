"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/useSession";
import { pesanError } from "@/lib/api/error";
import { useDaftarLokasi, usePerbaruiLokasi } from "@/features/inventaris/hooks";
import IsianLokasi from "@/features/inventaris/isian-lokasi";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";
import {
  nilaiAwalLokasi,
  payloadPerbaruiLokasi,
  skemaLokasi,
  type NilaiFormLokasi,
} from "@/features/inventaris/schema-lokasi";
import type { Lokasi } from "@/types/location";

interface FormProfilGudangProps {
  gudang: Lokasi;
  bolehUbah: boolean;
}

/**
 * Form profil satu gudang. Nilai awal dibaca dari data tersimpan lewat
 * defaultValues (keputusan rancangan butir 8); halaman memasangnya ulang
 * lewat key berisi id dan updatedAt, sehingga setelah simpan berhasil form
 * menampilkan nilai tersimpan dan tombol simpan kembali nonaktif.
 */
function FormProfilGudang({ gudang, bolehUbah }: FormProfilGudangProps) {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NilaiFormLokasi>({
    resolver: zodResolver(skemaLokasi),
    defaultValues: nilaiAwalLokasi(gudang),
  });

  const perbarui = usePerbaruiLokasi({
    onSuccess: () => {
      toast.success("Profil Gudang Disimpan", {
        description: "Perubahan profil gudang sudah tersimpan.",
      });
    },
    onError: (err) => {
      toast.error("Gagal Menyimpan Profil Gudang", {
        description: pesanError(err, "Periksa kembali data Anda."),
      });
    },
  });

  const kirim = (nilai: NilaiFormLokasi) => {
    perbarui.mutate({ id: gudang.id, payload: payloadPerbaruiLokasi(nilai) });
  };

  return (
    <form onSubmit={handleSubmit(kirim)} className="space-y-5">
      <IsianLokasi
        register={register}
        setValue={setValue}
        errors={errors}
        idAwalan="pengaturan-gudang"
        bacaSaja={!bolehUbah}
      />

      {bolehUbah ? (
        <div className="pt-4">
          <button
            type="submit"
            disabled={perbarui.isPending || !isDirty}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            {perbarui.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Simpan Perubahan
          </button>
        </div>
      ) : (
        <p className="text-xs font-medium text-muted-foreground">
          Anda hanya dapat melihat profil gudang. Mengubahnya membutuhkan izin mengubah lokasi.
        </p>
      )}
    </form>
  );
}

/**
 * Pengaturan gudang: profil lokasi Gudang tenant (keputusan GD2a), dengan
 * isian yang sama dengan setup gudang (IsianLokasi). Pemegang
 * update-location dapat mengubahnya lewat PUT /location/:id; pengguna lain
 * hanya membacanya. Gudang yang ditampilkan adalah lokasi Gudang pertama
 * dari GET /location, yaitu gudang terbaru; pada MVP tenant punya satu
 * gudang. Gate halamannya read-location (IZIN_HALAMAN).
 */
export default function PengaturanGudangPage() {
  const { permissions } = useSession();
  const bolehUbah = permissions.includes("update-location");
  const lokasi = useDaftarLokasi();
  const gudang = lokasi.data?.find((l) => l.tipe === "Gudang") ?? null;

  let isi: React.ReactNode;
  if (lokasi.isError) {
    isi = (
      <div>
        <PesanLokasi
          judul="Gagal Memuat Profil Gudang"
          isi="Data lokasi tidak dapat dimuat. Periksa koneksi Anda, lalu coba lagi."
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => lokasi.refetch()} disabled={lokasi.isFetching}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  } else if (lokasi.isLoading) {
    isi = (
      <p className="animate-pulse text-center text-sm font-medium text-slate-500">
        Memuat profil gudang...
      </p>
    );
  } else if (!gudang) {
    isi = (
      <PesanLokasi
        judul="Gudang Belum Didaftarkan"
        isi="Tenant ini belum memiliki Gudang. Daftarkan Gudang lewat setup gudang lebih dulu."
      />
    );
  } else {
    isi = (
      <FormProfilGudang
        key={`${gudang.id}-${gudang.updatedAt}`}
        gudang={gudang}
        bolehUbah={bolehUbah}
      />
    );
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Profil Gudang</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {bolehUbah
              ? "Perbarui nama, alamat, koordinat, dan radius absen gudang Anda."
              : "Nama, alamat, koordinat, dan radius absen gudang Anda."}
          </p>
        </div>

        {isi}
      </div>
    </div>
  );
}
