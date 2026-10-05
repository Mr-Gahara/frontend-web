"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ChevronDown, Landmark, Pencil, Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { akunKasAktif, akunKasNonAktif } from "@/features/akun-kas/filter";
import { DialogStatusAkun } from "@/features/akun-kas/dialog-status-akun";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { aksiAkunKas } from "@/features/akun-kas/izin";
import { urlUbahAkunKas } from "@/features/akun-kas/ubah";
import { aksiTransfer } from "@/features/jurnal-transfer/izin";
import { URL_PINDAH_DANA } from "@/features/jurnal-transfer/payload";
import { useSession } from "@/lib/auth/useSession";
import type { AkunKas } from "@/types/akunKas";
import { formatRupiah } from "@/lib/format";

function AkunKasCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-5 sm:p-6 flex flex-col justify-between min-h-45 shadow-sm">
      <div>
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-12 w-12 rounded-lg bg-[#0A2947]/10" />
          <Skeleton className="h-5 w-20 rounded-full bg-[#0A2947]/10" />
        </div>
        <Skeleton className="h-5 w-40 mb-2 bg-[#0A2947]/10" />
        <Skeleton className="h-4 w-28 bg-[#0A2947]/10" />
      </div>
      <div>
        <div className="h-px w-full bg-[#0A2947]/10 my-4" />
        <Skeleton className="h-3 w-24 mb-2 bg-[#0A2947]/10" />
        <Skeleton className="h-8 w-36 bg-[#0A2947]/10" />
      </div>
    </div>
  );
}

export default function AkunKasPage() {
  const { data: akunKasList = [], isLoading, isError } = useDaftarAkunKas();
  // Kartu hanya untuk akun aktif; akun non-aktif di bagian lipat di bawahnya
  // (keputusan AK1a), karena akun kas tidak dapat dihapus dan terus bertambah.
  const [bukaNonAktif, setBukaNonAktif] = useState(false);
  const akunAktif = akunKasAktif(akunKasList);
  const akunNonAktif = akunKasNonAktif(akunKasList);
  // Ubah dan aktifkan kembali hanya bagi pemegang update-akunkas (keputusan
  // UA1a dan UA2a); pengguna lain melihat daftar tanpa tombol aksi.
  const { permissions } = useSession();
  const aksi = aksiAkunKas(permissions);
  const [akunDiaktifkan, setAkunDiaktifkan] = useState<AkunKas | null>(null);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A2947]">
            Daftar Akun Kas & Bank
          </h2>
          <p className="text-sm font-medium text-[#0A2947]/60 mt-1">
            Kelola rekening dan kas fisik yang terhubung ke sistem POS.
          </p>
        </div>

        {/* 
          PENGUBAHAN UTAMA: 
          Menggunakan `grid grid-cols-2` di mobile agar membagi persis 50:50.
          Di layar sm (tablet/desktop), kembali ke `flex` agar ukurannya menyesuaikan konten (auto).
        */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {aksiTransfer(permissions).buat || aksiTransfer(permissions).baca ? (
            <Link href={URL_PINDAH_DANA} className="block w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full border-[#0A2947]/20 text-[#0A2947] px-2 sm:px-4 cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 mr-1.5 shrink-0" />
                <span className="truncate text-xs min-[375px]:text-sm">
                  Pindah Dana
                </span>
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              disabled
              title="Anda tidak memiliki izin Pindah Dana"
              className="w-full sm:w-auto border-[#0A2947]/20 text-[#0A2947] px-2 sm:px-4"
            >
              <ArrowLeftRight className="w-4 h-4 mr-1.5 shrink-0" />
              <span className="truncate text-xs min-[375px]:text-sm">
                Pindah Dana
              </span>
            </Button>
          )}

          {/* Menambahkan class `block w-full` pada Link agar mengisi penuh sel Grid-nya */}
          <Link
            href="/dashboard/outlet/keuangan/akunkas/buatAkunKas"
            className="block w-full sm:w-auto"
          >
            <Button className="w-full bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 border-none font-bold shadow-sm cursor-pointer px-2 sm:px-4">
              <Plus className="w-4 h-4 mr-1.5 shrink-0" />
              <span className="truncate text-xs min-[375px]:text-sm">
                Tambah Akun
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid kartu akun kas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
        {isLoading ? (
          <>
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
            <AkunKasCardSkeleton />
          </>
        ) : isError ? (
          <div className="col-span-full rounded-2xl border border-dashed border-rose-300 bg-[#F2EAE1] p-12 sm:p-16 text-center">
            <p className="text-base font-bold text-rose-600 mb-1">
              Gagal memuat daftar akun kas
            </p>
            <p className="text-sm font-medium text-[#0A2947]/60 max-w-md mx-auto">
              Periksa koneksi lalu muat ulang halaman.
            </p>
          </div>
        ) : akunKasList.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[#0A2947]/20 bg-[#F2EAE1] p-12 sm:p-16 text-center shadow-sm">
            <Wallet className="w-10 h-10 text-[#D4A373] mx-auto mb-4" />
            <p className="text-base font-bold text-[#0A2947] mb-1">
              Belum ada Akun Kas
            </p>
            <p className="text-sm font-medium text-[#0A2947]/60 mb-6 max-w-md mx-auto">
              Tambahkan rekening bank atau kas fisik pertama Anda untuk mulai
              mencatat arus keuangan.
            </p>
          </div>
        ) : akunAktif.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[#0A2947]/20 bg-[#F2EAE1] p-12 sm:p-16 text-center shadow-sm">
            <Wallet className="w-10 h-10 text-[#D4A373] mx-auto mb-4" />
            <p className="text-base font-bold text-[#0A2947] mb-1">
              Belum ada akun kas aktif
            </p>
            <p className="text-sm font-medium text-[#0A2947]/60 max-w-md mx-auto">
              Seluruh akun kas berstatus non-aktif. Tambahkan akun baru untuk
              mulai mencatat arus keuangan.
            </p>
          </div>
        ) : (
          akunAktif.map((akun) => {
            const Icon = akun.tipeAkun === "Rekening Bank" ? Landmark : Wallet;

            return (
              <div
                key={akun.id}
                className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-5 sm:p-6 flex flex-col justify-between min-h-45 shadow-sm hover:border-[#0A2947]/30 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[#FFFAF3] rounded-lg shadow-sm">
                      <Icon className="w-6 h-6 text-[#D4A373]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-[#718355] text-[#FFFAF3] hover:bg-[#718355]/90 border-none shadow-sm"
                      >
                        {akun.tipeAkun}
                      </Badge>
                      {aksi.ubah && (
                        <Link
                          href={urlUbahAkunKas(akun.id)}
                          aria-label={`Ubah ${akun.namaAkun}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#0A2947]/20 bg-[#FFFAF3] px-2 py-1 text-xs font-bold text-[#0A2947] hover:bg-[#0A2947]/5"
                        >
                          <Pencil className="w-3 h-3" />
                          Ubah
                        </Link>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#0A2947]">
                    {akun.namaAkun}
                  </h3>
                  <p className="text-sm font-medium text-[#0A2947]/70 mt-1">
                    {akun.nomorAkun || "-"}
                  </p>
                  {akun.keterangan && (
                    <p className="text-xs font-medium text-[#0A2947]/50 mt-1.5 line-clamp-2">
                      {akun.keterangan}
                    </p>
                  )}
                </div>
                <div>
                  <div className="h-px w-full bg-[#0A2947]/10 my-4" />
                  <p className="text-[11px] font-bold text-[#D4A373] mb-1 tracking-wider uppercase">
                    Saldo Saat Ini
                  </p>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2947]">
                    {formatRupiah(akun.saldo ?? 0)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {akunNonAktif.length > 0 && (
        <section className="w-full">
          <button
            type="button"
            onClick={() => setBukaNonAktif((buka) => !buka)}
            aria-expanded={bukaNonAktif}
            aria-controls="daftar-akun-non-aktif"
            className="flex w-full items-center justify-between rounded-xl border border-[#0A2947]/10 bg-[#F2EAE1] px-4 py-3 text-sm font-bold text-[#0A2947] cursor-pointer hover:border-[#0A2947]/30 transition-colors"
          >
            <span>Akun non-aktif ({akunNonAktif.length})</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${bukaNonAktif ? "rotate-180" : ""}`}
            />
          </button>
          {bukaNonAktif && (
            <ul
              id="daftar-akun-non-aktif"
              className="mt-2 divide-y divide-[#0A2947]/10 rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3]"
            >
              {akunNonAktif.map((akun) => (
                <li
                  key={akun.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#0A2947]/80 truncate">{akun.namaAkun}</p>
                    <p className="text-xs font-medium text-[#0A2947]/50">
                      {akun.tipeAkun}, {akun.nomorAkun || "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-mono font-bold text-[#0A2947]/70">
                      {formatRupiah(akun.saldo ?? 0)}
                    </p>
                    {aksi.ubah && (
                      <>
                        <Link
                          href={urlUbahAkunKas(akun.id)}
                          aria-label={`Ubah ${akun.namaAkun}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#0A2947]/20 bg-[#F2EAE1] px-2 py-1 text-xs font-bold text-[#0A2947] hover:bg-[#0A2947]/5"
                        >
                          <Pencil className="w-3 h-3" />
                          Ubah
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-label={`Aktifkan kembali ${akun.namaAkun}`}
                          onClick={() => setAkunDiaktifkan(akun)}
                          className="border-[#0A2947]/20 text-[#0A2947] text-xs font-bold"
                        >
                          Aktifkan kembali
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {akunDiaktifkan && (
        <DialogStatusAkun
          akun={akunDiaktifkan}
          tujuan="aktif"
          onTutup={() => setAkunDiaktifkan(null)}
        />
      )}
    </div>
  );
}