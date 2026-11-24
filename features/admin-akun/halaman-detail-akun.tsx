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
import { useAkun } from "./hooks";
import { aksiLangganan, akibatPerpanjang } from "./langganan";
import { LencanaStatus } from "./lencana-status";
import { DaftarRiwayatLangganan } from "./riwayat-langganan";
import {
  akunTidakAda,
  inisialAkun,
  KELAS_TINGGI_TOMBOL,
  KELAS_TOMBOL_UTAMA,
  LABEL_ROLE,
  URL_DAFTAR_AKUN,
  teksMasaAkses,
  teksPlan,
  teksToko,
  urlUbahAkun,
} from "./tampilan";
import { aksiKelolaAkun } from "./ubah";

const KELAS_KARTU = "flex min-w-0 flex-col gap-4 rounded-2xl border border-navy/10 bg-permukaan p-4 sm:p-6";
const KELAS_TOMBOL_SEKUNDER = `${KELAS_TINGGI_TOMBOL} w-full min-w-0 border-navy/20`;

function Butir({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-krem py-2.5 sm:gap-4">
      <dt className="w-28 shrink-0 text-isi text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-isi font-semibold [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** Kartu profil desain B: avatar, email, username, lencana status, lalu rincian berbaris. */
function ProfilAkun({ akun }: { akun: AkunAdmin }) {
  return (
    <section aria-label="Profil akun" className={KELAS_KARTU}>
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy text-besar font-bold text-gading sm:size-14 sm:text-subjudul"
        >
          {inisialAkun(akun)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <p className="text-besar font-bold [overflow-wrap:anywhere]">{akun.email}</p>
          <p className="text-isi [overflow-wrap:anywhere] text-muted-foreground">
            {akun.username ?? "Tanpa username"}
          </p>
          <LencanaStatus akun={akun} className="mt-1" />
        </div>
      </div>
      <dl className="flex flex-col border-t border-krem">
        <Butir label="Peran">{LABEL_ROLE[akun.role]}</Butir>
        <Butir label="Toko">{teksToko(akun)}</Butir>
        <Butir label="Plan">{teksPlan(akun)}</Butir>
        <Butir label="Masa akses">{teksMasaAkses(akun)}</Butir>
        <Butir label="Dibekukan pada">
          {akun.langganan.dibekukanPada ? formatTanggal(akun.langganan.dibekukanPada) : "-"}
        </Butir>
        <Butir label="Masa tenggang">
          {akun.langganan.masaTenggangHari === null ? "-" : `${akun.langganan.masaTenggangHari} hari`}
        </Butir>
        <Butir label="Dibuat">{formatTanggalPendek(akun.createdAt)}</Butir>
      </dl>
    </section>
  );
}

/**
 * Kartu Kelola Akun desain B: aksi utama selebar kartu, aksi lain dua
 * kolom. Akun admin tidak berlangganan dan baca-saja (PA7a, PA13a).
 */
function KelolaAkun({
  akun,
  onAksi,
  onHapus,
}: {
  akun: AkunAdmin;
  onAksi: (jenis: JenisAksi) => void;
  onHapus: () => void;
}) {
  if (akun.role === "admin") {
    return (
      <section aria-labelledby="judul-kelola" className={KELAS_KARTU}>
        <h2 id="judul-kelola" className="text-subjudul font-bold">
          Kelola Akun
        </h2>
        <p className="text-isi text-muted-foreground">Akun admin tidak berlangganan dan tidak dapat dibekukan.</p>
      </section>
    );
  }
  const aksi = aksiLangganan(akun);
  const kelola = aksiKelolaAkun(akun);
  const kedaluwarsa = akun.status === "non-aktif" && akun.langganan.alasanNonAktif === "kedaluwarsa";
  return (
    <section aria-labelledby="judul-kelola" className={KELAS_KARTU}>
      <h2 id="judul-kelola" className="text-subjudul font-bold">
        Kelola Akun
      </h2>
      {kedaluwarsa && <p className="-mt-2 text-kecil text-karamel-tua">{akibatPerpanjang(akun)}</p>}
      <div className="grid grid-cols-2 gap-2">
        {aksi.perpanjang && (
          <Button
            type="button"
            className={`col-span-2 ${KELAS_TINGGI_TOMBOL} ${KELAS_TOMBOL_UTAMA}`}
            onClick={() => onAksi("perpanjang")}
          >
            Perpanjang Langganan
          </Button>
        )}
        {aksi.ubahPlan && (
          <Button type="button" variant="outline" className={KELAS_TOMBOL_SEKUNDER} onClick={() => onAksi("ubahPlan")}>
            Ubah Plan
          </Button>
        )}
        {aksi.aktifkan && (
          <Button type="button" variant="outline" className={KELAS_TOMBOL_SEKUNDER} onClick={() => onAksi("aktifkan")}>
            Aktifkan Akun
          </Button>
        )}
        {aksi.bekukan && (
          <Button type="button" variant="outline" className={KELAS_TOMBOL_SEKUNDER} onClick={() => onAksi("bekukan")}>
            Bekukan Akun
          </Button>
        )}
        {kelola.ubah && (
          <Button asChild variant="outline" className={KELAS_TOMBOL_SEKUNDER}>
            <Link href={urlUbahAkun(akun.id)}>Ubah Akun</Link>
          </Button>
        )}
        {kelola.hapusTampil && (
          <Button
            type="button"
            variant="outline"
            className={`${KELAS_TOMBOL_SEKUNDER} border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive`}
            onClick={onHapus}
            disabled={!kelola.hapusAktif}
          >
            Hapus Akun
          </Button>
        )}
      </div>
      {kelola.hapusTampil && !kelola.hapusAktif && (
        <p className="text-kecil text-muted-foreground">Akun aktif tidak dapat dihapus. Bekukan akun lebih dulu.</p>
      )}
    </section>
  );
}

/**
 * Detail akun (keputusan PA10b), dibaca dari GET /akun/admin/users/:id
 * (B176); akun yang tidak ada menampilkan pesan, bukan loader tanpa akhir.
 * Desain B (pemilik proyek, 24 November 2026): profil dan Kelola Akun di
 * kolom kiri, riwayat langganan gaya A di kanan; bertumpuk di bawah 1024 px.
 */
export function HalamanDetailAkun() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const detail = useAkun(id);
  const [jenis, setJenis] = useState<JenisAksi | null>(null);
  const [menghapus, setMenghapus] = useState(false);
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
  } else {
    isi = (
      <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <ProfilAkun akun={akun} />
          <KelolaAkun akun={akun} onAksi={setJenis} onHapus={() => setMenghapus(true)} />
        </div>
        {akun.role === "client" && (
          <>
            <DaftarRiwayatLangganan akunId={akun.id} />
            <DialogLangganan akun={akun} jenis={jenis} onTutup={() => setJenis(null)} />
            <DialogHapusAkun akun={akun} buka={menghapus} onTutup={() => setMenghapus(false)} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      <div className="flex flex-col gap-4">
        <Link
          href={URL_DAFTAR_AKUN}
          className="inline-flex w-fit items-center text-isi font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Akun
        </Link>
        <h1 className="text-judul font-bold tracking-tight">Detail Akun</h1>
      </div>
      {isi}
    </div>
  );
}
