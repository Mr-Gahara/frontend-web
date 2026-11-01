import { Fragment } from "react";
import { Check } from "lucide-react";

const LANGKAH = ["Daftar akun", "Verifikasi email", "Siapkan toko"] as const;

/**
 * Penanda langkah pendaftaran (desain E daftar). Dipakai halaman daftar dan,
 * nanti, wizard setup toko, supaya urutannya sama di kedua tempat
 * (modul/setup-akun.md). Langkah sebelum langkah aktif ditandai selesai.
 */
export function LangkahDaftar({ aktif }: { aktif: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Langkah pendaftaran" className="flex flex-wrap items-center gap-3">
      {LANGKAH.map((nama, i) => {
        const nomor = i + 1;
        const selesai = nomor < aktif;
        const kini = nomor === aktif;
        return (
          <Fragment key={nama}>
            {i > 0 && <li aria-hidden="true" className="h-0.5 w-8 bg-input" />}
            <li
              aria-current={kini ? "step" : undefined}
              className={
                "flex items-center gap-2.5 text-[15px] " +
                (kini ? "font-semibold text-navy" : selesai ? "text-navy" : "text-muted-foreground")
              }
            >
              <span
                className={
                  "flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm font-semibold " +
                  (kini || selesai ? "bg-navy text-gading" : "border-2 border-input")
                }
              >
                {selesai ? <Check className="h-4 w-4" aria-hidden="true" /> : nomor}
              </span>
              {nama}
              {selesai && <span className="sr-only"> (selesai)</span>}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}