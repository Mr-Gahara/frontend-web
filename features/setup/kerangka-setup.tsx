import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { LangkahDaftar } from "@/features/auth/langkah-daftar";
import { TandaTachyon } from "@/features/auth/tanda-tachyon";
import { namaPlan } from "@/features/langganan/data";
import type { KunciPlan } from "@/types/langganan";
import type { KunciLangkah, LangkahSetup } from "./langkah";

/**
 * Kerangka wizard setup (desain F, gaya E daftar): panel krem berisi merek,
 * toko, daftar langkah per plan, dan penanda langkah pendaftaran; form di
 * kanan. Tanda centang mengikuti status server, bukan posisi langkah.
 */
export function KerangkaSetup({
  plan,
  langkah,
  indeksAktif,
  selesaiLangkah,
  namaToko,
  children,
}: {
  plan: KunciPlan;
  langkah: readonly LangkahSetup[];
  indeksAktif: number;
  selesaiLangkah: Record<KunciLangkah, boolean>;
  namaToko: string;
  children: ReactNode;
}) {
  const selesai = indeksAktif >= langkah.length;
  return (
    <div className="flex min-h-screen flex-wrap gap-5 bg-permukaan p-4 text-navy sm:p-5">
      <aside className="flex min-w-0 flex-[1_1_400px] flex-col gap-8 rounded-[28px] bg-krem p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TandaTachyon ukuran={34} />
            <span className="text-subjudul font-bold">Tachyon POS</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-kecil font-semibold uppercase tracking-[0.14em] text-navy/70">
            {selesai ? "Setup selesai" : "Siapkan toko"}
          </p>
          <p className="text-judul font-bold">{namaToko || "Toko baru"}</p>
          <p className="text-isi text-muted-foreground">Plan {namaPlan(plan)}</p>
        </div>
        <ol aria-label="Langkah setup toko" className="flex flex-col gap-0.5">
          {langkah.map((l, i) => {
            const lewat = selesaiLangkah[l.kunci];
            const kini = i === indeksAktif;
            return (
              <li
                key={l.kunci}
                aria-current={kini ? "step" : undefined}
                className={
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-besar " +
                  (kini ? "bg-permukaan font-semibold" : lewat ? "" : "text-muted-foreground")
                }
              >
                <span
                  className={
                    "flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-isi font-semibold " +
                    (lewat ? "bg-navy text-gading" : kini ? "border-2 border-navy" : "border-2 border-input")
                  }
                >
                  {lewat ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                </span>
                {l.judul}
                {lewat && <span className="sr-only"> (selesai)</span>}
              </li>
            );
          })}
        </ol>
        <div className="mt-auto">
          <LangkahDaftar aktif={selesai ? 4 : 3} tegak />
        </div>
      </aside>

      <main className="flex min-w-0 flex-[1_1_560px] items-center justify-center px-2 py-10">
        <div className="flex w-full max-w-[560px] flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}