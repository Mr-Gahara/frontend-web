"use client";

import Link from "next/link";
import { AlertTriangle, Bell, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useJamBerjalan } from "@/hooks/use-jam-berjalan";
import { IZIN } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { cn } from "@/lib/utils";
import { ringkasLangganan } from "@/features/langganan/data";
import { useLanggananToko, useRiwayatLanggananToko } from "@/features/langganan/hooks";
import { pengingatLangganan } from "@/features/langganan/pengingat";

const URL_LANGGANAN = "/dashboard/outlet/pengaturan/langganan";

/**
 * Lonceng topbar sebagai pusat pemberitahuan (desain C, pemilik proyek
 * 12 November 2026). Sumber pertamanya pengingat masa langganan: hampir
 * habis (karamel, mulai tujuh hari sebelum berakhir) dan masa tenggang
 * (rose). Datanya menuntut read-langganan, sehingga pengguna tanpa izin itu
 * hanya melihat panel kosong. Titik di lonceng tampil selama ada
 * pemberitahuan; panel muncul beranimasi di bawah lonceng, dan di HP
 * selebar layar dikurangi tepi.
 */
export function LoncengPemberitahuan() {
  const { permissions } = useSession();
  const bacaLangganan = permissions.includes(IZIN.langganan);
  const kini = useJamBerjalan(60_000);
  const langganan = useLanggananToko(bacaLangganan);
  const awal = langganan.data ? pengingatLangganan(langganan.data, kini) : null;
  // Riwayat hanya dimuat saat ada pengingat hampir habis, untuk bilah masa berlaku.
  const riwayat = useRiwayatLanggananToko(awal?.jenis === "hampir-habis");
  const mulai =
    langganan.data && riwayat.data
      ? ringkasLangganan(langganan.data, riwayat.data.pages.flatMap((h) => h.data), kini).mulai
      : null;
  const pengingat = langganan.data ? pengingatLangganan(langganan.data, kini, mulai) : null;
  const tenggang = pengingat?.jenis === "tenggang";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={pengingat ? "Pemberitahuan, 1 baru" : "Pemberitahuan"}
          className="relative flex items-center justify-center p-2.5 bg-navy text-white rounded-lg border-none shadow-sm cursor-pointer hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2"
        >
          <Bell size={20} aria-hidden="true" />
          {pengingat && (
            <span
              aria-hidden="true"
              data-testid="titik-pemberitahuan"
              className={cn(
                "absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-gading animate-in zoom-in-50 duration-300",
                tenggang ? "bg-rose-600" : "bg-karamel",
              )}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        aria-label="Pemberitahuan"
        className="w-[calc(100vw-2rem)] max-w-85 gap-3 rounded-2xl border border-navy/10 bg-permukaan p-4 text-navy shadow-[0_12px_32px_rgba(10,41,71,0.18)] ring-0 duration-200 data-open:zoom-in-90"
      >
        <p className="text-sm font-bold">Pemberitahuan</p>
        {pengingat ? (
          <div className={cn("flex flex-col gap-2.5 rounded-xl p-3.5", tenggang ? "bg-rose-50" : "bg-krem")}>
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "flex h-8 w-8 flex-none items-center justify-center rounded-full",
                  tenggang ? "bg-rose-100 text-rose-800" : "bg-karamel/30 text-[#7A5226]",
                )}
              >
                {tenggang ? (
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Clock className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div>
                <p className="text-sm font-bold">{pengingat.judul}</p>
                <p className="mt-0.5 text-[13px] text-navy/80">{pengingat.isi}</p>
              </div>
            </div>
            {pengingat.persen !== null && (
              <div className="h-1.5 rounded-full bg-navy/10" aria-hidden="true">
                <div
                  className={cn("h-1.5 rounded-full", tenggang ? "bg-rose-600" : "bg-karamel")}
                  style={{ width: `${pengingat.persen}%` }}
                />
              </div>
            )}
            {bacaLangganan && (
              <Link
                href={URL_LANGGANAN}
                className="self-start inline-flex h-9 items-center rounded-lg bg-navy px-3.5 text-[13px] font-semibold text-gading hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel"
              >
                Lihat langganan
              </Link>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-navy/70">Belum ada pemberitahuan.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
