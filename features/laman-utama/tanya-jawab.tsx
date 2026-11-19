"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { TANYA_JAWAB } from "./konten";

/**
 * Akordeon tanya jawab (desain E di G, LU4a): satu jawaban terbuka pada satu
 * waktu, pertama terbuka saat dimuat. Tinggi jawaban bergerak lewat
 * grid-template-rows dan ikon + berputar menjadi − saat terbuka.
 */
export function TanyaJawab() {
  const [terbuka, setTerbuka] = useState(0);
  const dasar = useId();

  return (
    <div className="flex flex-col">
      {TANYA_JAWAB.map((q, i) => {
        const buka = terbuka === i;
        const idJawab = `${dasar}-jawab-${i}`;
        return (
          <div key={q.tanya} className="border-t-2 border-navy">
            <h3>
              <button
                type="button"
                aria-expanded={buka}
                aria-controls={idJawab}
                onClick={() => setTerbuka(buka ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-besar font-bold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy md:py-5 md:text-subjudul"
              >
                {q.tanya}
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 motion-reduce:transition-none",
                    buka ? "bg-navy text-gading" : "bg-krem text-navy",
                  )}
                >
                  <span className="relative size-3.5">
                    <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current" />
                    <span
                      className={cn(
                        "absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-current transition-transform duration-300 motion-reduce:transition-none",
                        buka && "rotate-90",
                      )}
                    />
                  </span>
                </span>
              </button>
            </h3>
            <div
              id={idJawab}
              role="region"
              aria-label={q.tanya}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none",
                buka ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden" inert={!buka}>
                <p className="max-w-[36em] pb-5 text-besar leading-relaxed text-navy/75 md:pb-6">{q.jawab}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
