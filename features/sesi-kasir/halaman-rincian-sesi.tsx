"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { isNotFound, pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import { DialogTutupKasir } from "./dialog-tutup-kasir";
import { URL_MESIN_KASIR, useDialogTutupKasir } from "./halaman-mesin-kasir";
import { useDaftarMesinKasir, useDetailSesi } from "./hooks";
import { bolehKelolaMesinKasir } from "./izin";
import { RincianSesi } from "./rincian-sesi";
import { labelLaci, namaMesin } from "./tampilan";

/** Rincian satu sesi buka-tutup kasir (GET /sesikasir/:id, read-sesi-kasir). */
export function HalamanRincianSesi({ id }: { id: string }) {
  const { permissions } = useSession();
  const bolehKelola = bolehKelolaMesinKasir(permissions);
  const detail = useDetailSesi(id);
  const mesin = useDaftarMesinKasir(bolehKelola);
  const akunKas = useDaftarAkunKas({ enabled: bolehKelola });
  const dialogTutup = useDialogTutupKasir();

  if (detail.isLoading) {
    return <Skeleton aria-label="Memuat rincian sesi kasir" className="h-96 w-full rounded-[22px] bg-navy/10" />;
  }

  const sesi = detail.data;
  if (!sesi) {
    // Tidak ditemukan dibedakan dari gagal memuat, seperti detail penjualan.
    return (
      <div className="flex w-full flex-col items-center gap-4 px-4 py-16 text-center">
        <p role="alert" className="text-sm font-bold text-navy/70">
          {!detail.error || isNotFound(detail.error)
            ? "Sesi kasir tidak ditemukan."
            : pesanError(detail.error, "Gagal memuat rincian sesi kasir.")}
        </p>
        <Button asChild variant="outline">
          <Link href={URL_MESIN_KASIR}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Mesin Kasir
          </Link>
        </Button>
      </div>
    );
  }

  const daftarMesin = bolehKelola ? mesin.data : undefined;
  const nama = namaMesin(sesi.installationId, daftarMesin);
  // Laci milik sesi itu sendiri, bukan laci mesin sekarang yang mungkin sudah diubah.
  const laci = labelLaci(sesi, akunKas.data);

  return (
    <>
      <RincianSesi
        sesi={sesi}
        namaMesin={nama}
        laci={laci}
        hrefKembali={URL_MESIN_KASIR}
        bolehTutup={bolehKelola}
        onTutup={() => dialogTutup.buka(sesi)}
      />
      {bolehKelola && (
        <DialogTutupKasir
          namaMesin={nama}
          laci={sesi.akunKas?.namaAkun ?? "-"}
          buka={dialogTutup.sesi !== null}
          onBukaChange={(b) => !b && dialogTutup.batal()}
          menutup={dialogTutup.menutup}
          pesan={dialogTutup.pesan}
          onTutup={dialogTutup.kirim}
        />
      )}
    </>
  );
}
