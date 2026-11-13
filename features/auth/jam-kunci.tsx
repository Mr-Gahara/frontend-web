"use client";

import { useSyncExternalStore } from "react";

/** Berdetak tiap detik; snapshot jam hanya berganti saat menit berganti. */
function langgananDetak(beritahu: () => void) {
  const t = setInterval(beritahu, 1000);
  return () => clearInterval(t);
}
const menitSekarang = () => Math.floor(Date.now() / 60_000);
const menitServer = () => null;

/** Menit berjalan; null di server dan sebelum klien terpasang. */
export function useMenitBerjalan(): Date | null {
  const menit = useSyncExternalStore<number | null>(langgananDetak, menitSekarang, menitServer);
  return menit === null ? null : new Date(menit * 60_000);
}

export const jamMenit = (kini: Date) => kini.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

/**
 * Jam layar kunci login pengguna dan reset PIN Owner. Server merender tanpa
 * jam (snapshot null) supaya tidak ada selisih hidrasi; jam muncul setelah
 * klien terpasang.
 */
export function JamKunci() {
  const kini = useMenitBerjalan();
  if (kini === null) return <div className="min-h-[clamp(6.5rem,15vw,10.5rem)]" aria-hidden="true" />;
  return (
    <div className="flex min-h-[clamp(6.5rem,15vw,10.5rem)] flex-col gap-2">
      <time
        dateTime={kini.toISOString()}
        className="text-[clamp(4.5rem,12vw,8rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums"
      >
        {jamMenit(kini)}
      </time>
      <p className="text-xl text-gading/75">
        {kini.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
