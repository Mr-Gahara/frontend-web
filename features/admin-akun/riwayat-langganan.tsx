"use client";

import { Button } from "@/components/ui/button";
import { pesanError } from "@/lib/api/error";
import { formatTanggal } from "@/lib/format";
import { useRiwayatLangganan } from "./hooks";
import { LABEL_AKSI, pelakuRiwayat, teksPerubahanMasa } from "./langganan";

/**
 * Riwayat langganan satu akun, terbaru lebih dulu (keputusan PA11a). Backend
 * memberi kursor tanpa jumlah total, sehingga yang tersedia hanya tombol
 * muat berikutnya, bukan nomor halaman.
 */
export function DaftarRiwayatLangganan({ akunId }: { akunId: string }) {
  const riwayat = useRiwayatLangganan(akunId);
  const catatan = riwayat.data?.pages.flatMap((halaman) => halaman.data) ?? [];

  return (
    <section aria-labelledby="judul-riwayat" className="space-y-3">
      <h2 id="judul-riwayat" className="text-lg font-semibold">
        Riwayat Langganan
      </h2>

      {riwayat.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {pesanError(riwayat.error, "Gagal memuat riwayat langganan.")}
          </p>
          <Button type="button" variant="outline" onClick={() => riwayat.refetch()} disabled={riwayat.isFetching}>
            Coba Lagi
          </Button>
        </div>
      ) : riwayat.isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat riwayat...</p>
      ) : catatan.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada riwayat langganan.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {catatan.map((c) => {
            const perubahan = teksPerubahanMasa(c);
            return (
              <li key={c.id} className="space-y-1 p-4 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {LABEL_AKSI[c.aksi]}
                    {c.durasiBulan ? ` ${c.durasiBulan} bulan` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTanggal(c.createdAt)} oleh {pelakuRiwayat(c)}
                  </p>
                </div>
                {perubahan && <p className="text-muted-foreground">{perubahan}</p>}
                {c.alasan && <p className="text-muted-foreground">{c.alasan}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {riwayat.hasNextPage && (
        <Button
          type="button"
          variant="outline"
          onClick={() => riwayat.fetchNextPage()}
          disabled={riwayat.isFetchingNextPage}
        >
          {riwayat.isFetchingNextPage ? "Memuat..." : "Muat Berikutnya"}
        </Button>
      )}
    </section>
  );
}