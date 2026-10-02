"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, MapPin, Save, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth/useSession";
import { pesanError } from "@/lib/api/error";
import { useLokasiAktif, usePerbaruiLokasi } from "@/features/inventaris/hooks";
import IsianLokasi, { TEKS_ISIAN_LOKASI } from "@/features/inventaris/isian-lokasi";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";
import {
  nilaiAwalLokasi,
  payloadPerbaruiLokasi,
  skemaLokasi,
  type NilaiFormLokasi,
} from "@/features/inventaris/schema-lokasi";
import type { Lokasi } from "@/types/location";
import type { Tenant } from "@/types/tenant";
import { usePerbaruiTenant, useTenant } from "./hooks";
import { nilaiAwalTenant, payloadPerbaruiTenant } from "./payload";
import { skemaTenant, type NilaiFormTenant } from "./schema";

/** Isian teks satu baris profil toko, selain nama toko dan catatan kaki struk. */
const ISIAN_TOKO: { nama: keyof NilaiFormTenant; label: string; contoh: string }[] = [
  { nama: "alamat", label: "Alamat", contoh: "Contoh: Jl. Khatulistiwa No. 123" },
  { nama: "kota", label: "Kota", contoh: "Contoh: Pontianak" },
  { nama: "kodePos", label: "Kode Pos", contoh: "Contoh: 78111" },
  { nama: "nomorTelepon", label: "Nomor Telepon", contoh: "Contoh: 0812 3456 7890" },
  { nama: "emailBisnis", label: "Email Bisnis", contoh: "Contoh: toko@contoh.id" },
  { nama: "idNPWP", label: "NPWP", contoh: "Contoh: 01.234.567.8-901.000" },
];

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-rose-600">{pesan}</p>;
}

function Memuat({ teks }: { teks: string }) {
  return (
    <p className="animate-pulse text-center text-sm font-medium text-slate-500">{teks}</p>
  );
}

function TombolSimpan({ teks, memproses, nonaktif }: { teks: string; memproses: boolean; nonaktif: boolean }) {
  return (
    <div className="pt-2">
      <Button type="submit" disabled={nonaktif} className="w-full gap-2">
        {memproses ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {teks}
      </Button>
    </div>
  );
}

/**
 * Form profil toko. Nilai awal dibaca dari data tersimpan lewat
 * defaultValues (keputusan rancangan butir 8); halaman memasangnya ulang
 * lewat key berisi id dan updatedAt, sehingga setelah simpan berhasil form
 * menampilkan nilai tersimpan dan tombol simpan kembali nonaktif. Hanya
 * field yang berubah yang dikirim (butir 15).
 */
function FormProfilToko({ tenant, bolehUbah }: { tenant: Tenant; bolehUbah: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NilaiFormTenant>({
    resolver: zodResolver(skemaTenant),
    defaultValues: nilaiAwalTenant(tenant),
  });

  const perbarui = usePerbaruiTenant({
    onSuccess: () => {
      toast.success("Profil Toko Disimpan", {
        description: "Perubahan profil toko sudah tersimpan.",
      });
    },
    onError: (err) => {
      toast.error("Gagal Menyimpan Profil Toko", {
        description: pesanError(err, "Periksa kembali data Anda."),
      });
    },
  });

  const kirim = (nilai: NilaiFormTenant) => {
    const payload = payloadPerbaruiTenant(nilai, tenant);
    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan untuk disimpan");
      return;
    }
    perbarui.mutate({ id: tenant.id, payload });
  };

  return (
    <form onSubmit={handleSubmit(kirim)} noValidate className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="profil-toko-namaToko" className="text-sm font-medium text-foreground">
          Nama Toko
        </label>
        <Input
          id="profil-toko-namaToko"
          {...register("namaToko")}
          placeholder="Contoh: Kopi Khatulistiwa"
          readOnly={!bolehUbah}
        />
        <PesanIsian pesan={errors.namaToko?.message} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {ISIAN_TOKO.map((isian) => (
          <div key={isian.nama} className="space-y-2">
            <label
              htmlFor={`profil-toko-${isian.nama}`}
              className="text-sm font-medium text-foreground"
            >
              {isian.label}
            </label>
            <Input
              id={`profil-toko-${isian.nama}`}
              {...register(isian.nama)}
              placeholder={isian.contoh}
              readOnly={!bolehUbah}
            />
            <PesanIsian pesan={errors[isian.nama]?.message} />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="profil-toko-footerStruk" className="text-sm font-medium text-foreground">
          Catatan Kaki Struk
        </label>
        <Textarea
          id="profil-toko-footerStruk"
          {...register("footerStruk")}
          rows={3}
          placeholder="Contoh: Terima kasih atas kunjungan Anda."
          readOnly={!bolehUbah}
        />
        <PesanIsian pesan={errors.footerStruk?.message} />
      </div>

      {bolehUbah ? (
        <TombolSimpan
          teks="Simpan Profil Toko"
          memproses={perbarui.isPending}
          nonaktif={perbarui.isPending || !isDirty}
        />
      ) : (
        <p className="text-xs font-medium text-muted-foreground">
          Anda hanya dapat melihat profil toko. Mengubahnya membutuhkan izin mengubah toko.
        </p>
      )}
    </form>
  );
}

/**
 * Form lokasi Outlet tenant, dengan isian yang sama dengan pengaturan
 * gudang (IsianLokasi, keputusan PO12a dan GD2a).
 */
function FormLokasiOutlet({ outlet, bolehUbah }: { outlet: Lokasi; bolehUbah: boolean }) {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NilaiFormLokasi>({
    resolver: zodResolver(skemaLokasi),
    defaultValues: nilaiAwalLokasi(outlet),
  });

  const perbarui = usePerbaruiLokasi({
    onSuccess: () => {
      toast.success("Lokasi Outlet Disimpan", {
        description: "Perubahan lokasi outlet sudah tersimpan.",
      });
    },
    onError: (err) => {
      toast.error("Gagal Menyimpan Lokasi Outlet", {
        description: pesanError(err, "Periksa kembali data Anda."),
      });
    },
  });

  const kirim = (nilai: NilaiFormLokasi) => {
    perbarui.mutate({ id: outlet.id, payload: payloadPerbaruiLokasi(nilai) });
  };

  return (
    <form onSubmit={handleSubmit(kirim)} className="space-y-5">
      <IsianLokasi
        register={register}
        setValue={setValue}
        errors={errors}
        idAwalan="profil-outlet"
        bacaSaja={!bolehUbah}
        teks={TEKS_ISIAN_LOKASI.outlet}
      />
      {bolehUbah ? (
        <TombolSimpan
          teks="Simpan Lokasi Outlet"
          memproses={perbarui.isPending}
          nonaktif={perbarui.isPending || !isDirty}
        />
      ) : (
        <p className="text-xs font-medium text-muted-foreground">
          Anda hanya dapat melihat lokasi outlet. Mengubahnya membutuhkan izin mengubah lokasi.
        </p>
      )}
    </form>
  );
}

function Kartu({
  ikon,
  judul,
  keterangan,
  children,
}: {
  ikon: React.ReactNode;
  judul: string;
  keterangan: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          {ikon}
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{judul}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{keterangan}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * Profil Toko (keputusan PO12a sampai PO14a): dua kartu dengan simpan
 * masing-masing. Profil tenant dibaca setiap pengguna lewat GET /tenant/:id
 * dan diubah pemegang update-tenant; lokasi Outlet dimuat bagi pemegang
 * read-location dan diubah pemegang update-location. Halaman tanpa entri
 * IZIN_HALAMAN. persenPajak, tipePajak, logoUrl, dan isSetupComplete tidak
 * ditampilkan (PO13a).
 */
export function HalamanProfilToko() {
  const { permissions } = useSession();
  const bolehUbahToko = permissions.includes("update-tenant");
  const bacaLokasi = permissions.includes("read-location");
  const bolehUbahLokasi = permissions.includes("update-location");

  const tenant = useTenant();
  const outlet = useLokasiAktif({ aktif: bacaLokasi });

  let isiToko: React.ReactNode;
  if (tenant.isError) {
    isiToko = (
      <div>
        <PesanLokasi
          judul="Gagal Memuat Profil Toko"
          isi="Data toko tidak dapat dimuat. Periksa koneksi Anda, lalu coba lagi."
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => tenant.refetch()} disabled={tenant.isFetching}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  } else if (!tenant.data) {
    isiToko = <Memuat teks="Memuat profil toko..." />;
  } else {
    isiToko = (
      <FormProfilToko
        key={`${tenant.data.id}-${tenant.data.updatedAt}`}
        tenant={tenant.data}
        bolehUbah={bolehUbahToko}
      />
    );
  }

  let isiLokasi: React.ReactNode;
  if (!bacaLokasi) {
    isiLokasi = (
      <p className="text-sm font-medium text-muted-foreground">
        Anda tidak memiliki izin melihat lokasi outlet.
      </p>
    );
  } else if (outlet.isError) {
    isiLokasi = (
      <div>
        <PesanLokasi
          judul="Gagal Memuat Lokasi Outlet"
          isi="Data lokasi tidak dapat dimuat. Periksa koneksi Anda, lalu coba lagi."
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => outlet.refetch()} disabled={outlet.isFetching}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  } else if (outlet.isLoading) {
    isiLokasi = <Memuat teks="Memuat lokasi outlet..." />;
  } else if (!outlet.lokasi) {
    isiLokasi = (
      <PesanLokasi
        judul="Outlet Belum Didaftarkan"
        isi="Tenant ini belum memiliki Outlet. Daftarkan Outlet lewat aplikasi Tachyon POS lebih dulu."
      />
    );
  } else {
    isiLokasi = (
      <FormLokasiOutlet
        key={`${outlet.lokasi.id}-${outlet.lokasi.updatedAt}`}
        outlet={outlet.lokasi}
        bolehUbah={bolehUbahLokasi}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profil Toko</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi dasar toko dan lokasi outlet Anda.
        </p>
      </div>
      <Kartu
        ikon={<Store className="h-5 w-5" />}
        judul="Informasi Toko"
        keterangan="Nama, alamat, kontak, NPWP, dan catatan kaki struk."
      >
        {isiToko}
      </Kartu>
      <Kartu
        ikon={<MapPin className="h-5 w-5" />}
        judul="Lokasi Outlet"
        keterangan="Nama, alamat, koordinat, dan radius absen outlet."
      >
        {isiLokasi}
      </Kartu>
    </div>
  );
}