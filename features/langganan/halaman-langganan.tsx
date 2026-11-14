"use client";

import { Check, Loader2, MessageCircle, Minus } from "lucide-react";
import { useTenant } from "@/features/tenant/hooks";
import { pesanError } from "@/lib/api/error";
import type { RiwayatLanggananToko } from "@/types/langganan";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import {
  DAFTAR_PLAN,
  NOMOR_WA_ADMIN,
  formatTanggal,
  persenTerpakai,
  ringkasLangganan,
  sisaHari,
  tautanWhatsapp,
  teksRiwayat,
} from "./data";
import { useLanggananToko, useRiwayatLanggananToko } from "./hooks";

const KELAS_TOMBOL_WA =
  "inline-flex h-[54px] items-center justify-center gap-2 rounded-xl bg-navy px-6 text-base font-semibold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2";

const berlakuSampai = (r: RiwayatLanggananToko) =>
  r.berakhirSesudah ? formatTanggal(new Date(r.berakhirSesudah)) : "Tanpa batas";

/**
 * Halaman Langganan (desain F): plan aktif, perbandingan plan, dan riwayat,
 * dari GET /akun/langganan dan riwayatnya (B229). Gerbangnya read-langganan
 * lewat IZIN_HALAMAN, menggantikan pembatasan role Owner (LG2a).
 */
export function HalamanLangganan() {
  const tenant = useTenant();
  const langganan = useLanggananToko();
  const riwayat = useRiwayatLanggananToko();
  const daftarRiwayat = riwayat.data?.pages.flatMap((h) => h.data) ?? [];

  if (langganan.isPending || riwayat.isPending) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Memuat langganan...
      </p>
    );
  }
  if (langganan.isError || riwayat.isError) {
    return (
      <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        {pesanError(langganan.error ?? riwayat.error, "Langganan gagal dimuat.")}
      </p>
    );
  }

  const kini = new Date();
  const data = ringkasLangganan(langganan.data, daftarRiwayat, kini);
  const plan = DAFTAR_PLAN.find((p) => p.kunci === data.plan) ?? DAFTAR_PLAN[0];
  const tautan = tautanWhatsapp(NOMOR_WA_ADMIN, tenant.data?.namaToko ?? "", plan.nama);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 text-navy">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Langganan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plan toko, masa berlaku, dan cara naik plan.</p>
      </div>

      <section
        aria-labelledby="langganan-aktif"
        className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-navy/10 bg-permukaan p-5 sm:p-7"
      >
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="langganan-aktif" className="text-2xl font-bold">
              Plan {plan.nama}
            </h2>
            {data.percobaan && (
              <span className="rounded-full bg-sage/15 px-3 py-1 text-[13px] font-semibold text-sage">
                Masa percobaan
              </span>
            )}
          </div>
          {data.berakhir === null ? (
            <p className="text-[15px] text-muted-foreground">Masa berlaku tidak dibatasi.</p>
          ) : data.lewat ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-[15px] font-medium text-destructive">
              Masa berlaku habis {formatTanggal(data.berakhir)}.
              {data.tenggangSampai && <> Toko masih dapat dipakai sampai {formatTanggal(data.tenggangSampai)}.</>}{" "}
              Hubungi admin untuk perpanjang.
            </p>
          ) : (
            <>
              <p className="text-[15px] text-muted-foreground">
                Berakhir {formatTanggal(data.berakhir)},{" "}
                <strong className="whitespace-nowrap text-navy">{sisaHari(data.berakhir, kini)} hari lagi</strong>.
              </p>
              {data.mulai && (
                <div
                  role="progressbar"
                  aria-label="Masa berlaku terpakai"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={persenTerpakai(data.mulai, data.berakhir, kini)}
                  className="h-2 overflow-hidden rounded-full bg-krem"
                >
                  <div
                    className="h-full rounded-full bg-navy"
                    style={{ width: `${persenTerpakai(data.mulai, data.berakhir, kini)}%` }}
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Perpanjang sebelum masa berlaku habis agar toko tetap bisa dipakai.
              </p>
            </>
          )}
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:max-w-[300px]">
          {tautan ? (
            <a href={tautan} target="_blank" rel="noopener noreferrer" className={KELAS_TOMBOL_WA}>
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Hubungi admin
            </a>
          ) : (
            <p className="rounded-xl bg-krem px-4 py-3 text-center text-sm font-semibold">
              Hubungi admin Tachyon untuk naik plan atau perpanjang.
            </p>
          )}
          <p className="text-center text-[13px] text-muted-foreground">
            Naik plan dan perpanjangan diproses admin lewat invoice.
          </p>
        </div>
      </section>

      <section aria-labelledby="langganan-banding" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="langganan-banding" className="text-xl font-bold">
            Bandingkan plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Durasi 1, 3, 6, 12, atau 24 bulan. Harga mengikuti penawaran admin.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAFTAR_PLAN.map((p) => {
            const aktif = p.kunci === data.plan;
            return (
              <article
                key={p.kunci}
                aria-label={`Plan ${p.nama}`}
                className={
                  "flex flex-col gap-3.5 rounded-2xl bg-permukaan p-5 sm:p-6 " +
                  (aktif ? "border-2 border-navy" : "border-2 border-navy/10")
                }
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl font-bold">{p.nama}</h3>
                  {aktif && <span className="text-[13px] font-semibold text-sage">Plan Anda</span>}
                </div>
                <ul className="flex flex-col gap-2.5 text-sm">
                  {p.fitur.map((f) => (
                    <li key={f.teks} className={"flex gap-2 " + (f.ada ? "" : "text-muted-foreground")}>
                      {f.ada ? (
                        <Check role="img" aria-label="Termasuk" className="mt-0.5 h-4 w-4 flex-none text-sage" />
                      ) : (
                        <Minus role="img" aria-label="Tidak termasuk" className="mt-0.5 h-4 w-4 flex-none" />
                      )}
                      <span>{f.teks}</span>
                    </li>
                  ))}
                </ul>
                {p.catatan && <p className="mt-auto text-[13px] text-muted-foreground">{p.catatan}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="langganan-riwayat" className="flex flex-col gap-3">
        <h2 id="langganan-riwayat" className="text-xl font-bold">
          Riwayat
        </h2>
        {/* Tabel rincian berkartu baris; di HP kartu berlabel (CV22a). */}
        <DataTable
          rincian
          data={daftarRiwayat}
          emptyMessage="Belum ada riwayat."
          columns={[
            { id: "tanggal", header: "Tanggal", cell: ({ row }) => formatTanggal(new Date(row.original.createdAt)) },
            { id: "perubahan", header: "Perubahan", cell: ({ row }) => teksRiwayat(row.original) },
            { id: "berlaku", header: "Berlaku sampai", cell: ({ row }) => berlakuSampai(row.original) },
          ] satisfies ColumnDef<RiwayatLanggananToko>[]}
        />
        {riwayat.hasNextPage && (
          <button
            type="button"
            onClick={() => riwayat.fetchNextPage()}
            disabled={riwayat.isFetchingNextPage}
            className="self-start rounded-lg border border-navy/15 px-4 py-2 text-sm font-semibold hover:bg-krem disabled:opacity-60"
          >
            {riwayat.isFetchingNextPage ? "Memuat..." : "Muat riwayat lainnya"}
          </button>
        )}
      </section>
    </div>
  );
}