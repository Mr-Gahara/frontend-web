"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { otomatisDimatikan, penyimpananLokal, sudahDilihat } from "@/lib/panduan";
import { useSession } from "@/lib/auth/useSession";
import { cn } from "@/lib/utils";
import { usePemberitahuan } from "./hooks";
import { namaLonceng, teksLencana, tingkatTertinggi, type TingkatPemberitahuan } from "./jenis";
import { KartuPemberitahuan } from "./kartu-pemberitahuan";

/** Beranda ruang outlet: satu-satunya halaman yang membuka panel sendiri (LN13a). */
export const URL_DASHBOARD_OUTLET = "/dashboard/outlet";

const WARNA_LENCANA: Record<TingkatPemberitahuan, string> = {
  penting: "bg-rose-600 text-white",
  tindakan: "bg-karamel text-navy",
  info: "bg-gading text-navy",
};

/**
 * Panel terbuka sendiri (LN3a, LN13a) hanya di beranda dashboard outlet,
 * selama pemicu stok LN1a berlaku, dan tidak bertumpuk dengan tur panduan
 * dashboard yang belum pernah tampil (tur itu tampil sendiri lebih dulu).
 * Dimatikan saklar e2e, seperti tur (keputusan rancangan butir 32).
 */
export function bolehBukaSendiri(m: { pathname: string; adaPemicuStok: boolean; penggunaId: string | null }): boolean {
  if (m.pathname !== URL_DASHBOARD_OUTLET || !m.adaPemicuStok || !m.penggunaId) return false;
  const simpan = penyimpananLokal();
  return !otomatisDimatikan(simpan) && sudahDilihat(simpan, "dashboard." + m.penggunaId);
}

/**
 * Lonceng topbar sebagai pusat pemberitahuan toko (modul/pemberitahuan.md).
 * Lencana angka (9+) berwarna tingkat tertinggi; panel berisi kartu per
 * tingkat yang bergulir maksimal 70% tinggi layar (LN12a). Membuka panel
 * menyegarkan seluruh sumber (LN6a). Di HP panel selebar layar dikurangi tepi.
 */
export function LoncengPemberitahuan() {
  const pathname = usePathname();
  const { pengguna } = useSession();
  const { daftar, segarkan } = usePemberitahuan();
  const [buka, setBuka] = useState(false);
  const jumlah = daftar.length;
  const tingkat = tingkatTertinggi(daftar);
  const adaPemicuStok = daftar.some((p) => p.id === "stok-produk");

  // Sekali per kunjungan beranda: pindah halaman lalu kembali membukanya lagi.
  const sudahDibukaSendiri = useRef(false);
  useEffect(() => {
    if (pathname !== URL_DASHBOARD_OUTLET) {
      sudahDibukaSendiri.current = false;
      return;
    }
    if (sudahDibukaSendiri.current) return;
    if (!bolehBukaSendiri({ pathname, adaPemicuStok, penggunaId: pengguna?.id ?? null })) return;
    // Ditunda sebentar seperti tur (usePanduan), agar halaman selesai dipasang.
    const t = window.setTimeout(() => {
      sudahDibukaSendiri.current = true;
      setBuka(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [pathname, adaPemicuStok, pengguna?.id]);

  const ubahBuka = (b: boolean) => {
    setBuka(b);
    if (b) segarkan();
  };

  return (
    <Popover open={buka} onOpenChange={ubahBuka}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={namaLonceng(jumlah)}
          className="relative flex items-center justify-center p-2.5 bg-navy text-white rounded-lg border-none shadow-sm cursor-pointer hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2"
        >
          <Bell size={20} aria-hidden="true" />
          {tingkat && (
            <span
              aria-hidden="true"
              data-testid="lencana-pemberitahuan"
              data-tingkat={tingkat}
              className={cn(
                "absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-gading px-1 text-mikro leading-none animate-in zoom-in-50 duration-300",
                WARNA_LENCANA[tingkat],
              )}
            >
              {teksLencana(jumlah)}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        aria-label="Pemberitahuan"
        className="w-[calc(100vw-2rem)] max-w-85 gap-3 rounded-2xl border border-navy/10 bg-permukaan p-4 text-navy shadow-[0_12px_32px_rgba(10,41,71,0.18)] ring-0 duration-200 data-open:zoom-in-90"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-isi font-bold">Pemberitahuan</p>
          {jumlah > 0 && <span className="text-kecil font-semibold text-navy/70">{jumlah}</span>}
        </div>
        {jumlah > 0 ? (
          <div className="-mr-2 flex max-h-[70vh] flex-col gap-2.5 overflow-y-auto pr-2">
            {daftar.map((p) => (
              <KartuPemberitahuan key={p.id} pemberitahuan={p} onBukaTautan={() => setBuka(false)} />
            ))}
          </div>
        ) : (
          <p className="text-kecil text-navy/70">Belum ada pemberitahuan.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
