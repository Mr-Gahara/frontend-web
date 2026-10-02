"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pesanError } from "@/lib/api/error";
import { formatTanggal, formatTanggalPendek } from "@/lib/format";
import type { AkunAdmin } from "@/types/adminAkun";
import { DialogHapusAkun } from "./dialog-hapus-akun";
import { DialogLangganan, type JenisAksi } from "./dialog-langganan";
import { useDaftarAkun } from "./hooks";
import { aksiLangganan } from "./langganan";
import { DaftarRiwayatLangganan } from "./riwayat-langganan";
import {
  LABEL_ROLE,
  URL_DAFTAR_AKUN,
  teksMasaAkses,
  teksStatus,
  teksToko,
  urlUbahAkun,
} from "./tampilan";
import { aksiKelolaAkun } from "./ubah";

function Butir({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

function RingkasanAkun({ akun }: { akun: AkunAdmin }) {
  return (
    <dl className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
      <Butir label="Email">{akun.email}</Butir>
      <Butir label="Username">{akun.username ?? "Tanpa username"}</Butir>
      <Butir label="Peran">{LABEL_ROLE[akun.role]}</Butir>
      <Butir label="Toko">{teksToko(akun)}</Butir>
      <Butir label="Status">{teksStatus(akun)}</Butir>
      <Butir label="Masa akses">{teksMasaAkses(akun)}</Butir>
      <Butir label="Dibekukan pada">
        {akun.langganan.dibekukanPada ? formatTanggal(akun.langganan.dibekukanPada) : "-"}
      </Butir>
      <Butir label="Masa tenggang">
        {akun.langganan.masaTenggangHari === null ? "-" : `${akun.langganan.masaTenggangHari} hari`}
      </Butir>
      <Butir label="Dibuat">{formatTanggalPendek(akun.createdAt)}</Butir>
    </dl>
  );
}

/**
 * Detail akun (keputusan PA10b). Backend tidak punya endpoint detail satu
 * akun, sehingga akun dibaca dari cache daftar; id yang tidak ada di daftar
 * menampilkan pesan, bukan loader tanpa akhir.
 */
export function HalamanDetailAkun() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const daftar = useDaftarAkun();
  const [jenis, setJenis] = useState<JenisAksi | null>(null);
  const [menghapus, setMenghapus] = useState(false);
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
  } else {
    const aksi = aksiLangganan(akun);
    const kelola = aksiKelolaAkun(akun);
    isi = (
      <>
        <RingkasanAkun akun={akun} />
        {akun.role === "admin" ? (
          <p className="text-sm text-muted-foreground">
            Akun admin tidak berlangganan dan tidak dapat dibekukan.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {aksi.perpanjang && (
                <Button type="button" onClick={() => setJenis("perpanjang")}>
                  Perpanjang Langganan
                </Button>
              )}
              {aksi.aktifkan && (
                <Button type="button" variant="outline" onClick={() => setJenis("aktifkan")}>
                  Aktifkan Akun
                </Button>
              )}
              {aksi.bekukan && (
                <Button type="button" variant="outline" onClick={() => setJenis("bekukan")}>
                  Bekukan Akun
                </Button>
              )}
              {kelola.ubah && (
                <Link href={urlUbahAkun(akun.id)}>
                  <Button type="button" variant="outline">
                    Ubah Akun
                  </Button>
                </Link>
              )}
              {kelola.hapusTampil && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setMenghapus(true)}
                  disabled={!kelola.hapusAktif}
                >
                  Hapus Akun
                </Button>
              )}
            </div>
            {kelola.hapusTampil && !kelola.hapusAktif && (
              <p className="text-xs text-muted-foreground">
                Akun aktif tidak dapat dihapus. Bekukan akun lebih dulu.
              </p>
            )}
            <DaftarRiwayatLangganan akunId={akun.id} />
            <DialogLangganan akun={akun} jenis={jenis} onTutup={() => setJenis(null)} />
            <DialogHapusAkun akun={akun} buka={menghapus} onTutup={() => setMenghapus(false)} />
          </>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href={URL_DAFTAR_AKUN}
          className="inline-flex w-fit items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Akun
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Detail Akun</h1>
      </div>
      {isi}
    </div>
  );
}