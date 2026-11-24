"use client";

import { Button } from "@/components/ui/button";
import { pesanError } from "@/lib/api/error";
import { formatTanggal } from "@/lib/format";
import { useRiwayatLangganan } from "./hooks";
import { LABEL_AKSI, pelakuRiwayat, teksPerubahanMasa, teksPerubahanPlan } from "./langganan";

/**
 * Riwayat langganan satu akun, terbaru lebih dulu (keputusan PA11a). Backend
 * memberi kursor, sehingga halaman berikutnya dimuat lewat tombol, dan
 * jumlah seluruh catatan dari total (B155). Tampilan garis waktu desain A di
 * dalam kartu desain B (pemilik proyek, 24 November 2026).
 */
export function DaftarRiwayatLangganan({ akunId }: { akunId: string }) {
  const riwayat = useRiwayatLangganan(akunId);
  const catatan = riwayat.data?.pages.flatMap((halaman) => halaman.data) ?? [];
  const total = riwayat.data?.pages[0]?.total ?? 0;

  return (
    <section
      aria-labelledby="judul-riwayat"
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-navy/10 bg-permukaan p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="judul-riwayat" className="text-subjudul font-bold">
          Riwayat Langganan
        </h2>
        {catatan.length > 0 && !riwayat.isError && (
          <p className="text-isi text-muted-foreground">
            Menampilkan {catatan.length} dari {total} catatan
          </p>
        )}
      </div>

      {riwayat.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-isi font-medium text-destructive">
            {pesanError(riwayat.error, "Gagal memuat riwayat langganan.")}
          </p>
          <Button type="button" variant="outline" onClick={() => riwayat.refetch()} disabled={riwayat.isFetching}>
            Coba Lagi
          </Button>
        </div>
      ) : riwayat.isLoading ? (
        <p className="text-isi text-muted-foreground">Memuat riwayat...</p>
      ) : catatan.length === 0 ? (
        <p className="text-isi text-muted-foreground">Belum ada riwayat langganan.</p>
      ) : (
        <ol className="flex flex-col">
          {catatan.map((c) => {
            const perubahan = teksPerubahanMasa(c);
            const plan = teksPerubahanPlan(c);
            return (
              <li key={c.id} className="flex gap-3 sm:gap-4">
                <div aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center">
                  <span className="mt-[5px] size-2.5 shrink-0 rounded-full bg-karamel" />
                  <span className="w-0.5 flex-1 bg-krem" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4 sm:pb-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-isi font-bold">
                      {LABEL_AKSI[c.aksi]}
                      {c.durasiBulan ? ` ${c.durasiBulan} bulan` : ""}
                    </p>
                    <p className="text-kecil [overflow-wrap:anywhere] text-muted-foreground">
                      {formatTanggal(c.createdAt)} oleh {pelakuRiwayat(c)}
                    </p>
                  </div>
                  {plan && <p className="text-isi [overflow-wrap:anywhere] text-cokelat">{plan}</p>}
                  {perubahan && <p className="text-isi [overflow-wrap:anywhere] text-cokelat">{perubahan}</p>}
                  {c.alasan && <p className="text-isi [overflow-wrap:anywhere] text-cokelat">{c.alasan}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {riwayat.hasNextPage && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => riwayat.fetchNextPage()}
          disabled={riwayat.isFetchingNextPage}
        >
          {riwayat.isFetchingNextPage ? "Memuat..." : "Muat Berikutnya"}
        </Button>
      )}
    </section>
  );
}
