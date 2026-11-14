import { Fragment } from "react";
import { Check } from "lucide-react";

const LANGKAH = ["Daftar akun", "Verifikasi email", "Siapkan toko"] as const;

/**
 * Penanda langkah pendaftaran (desain E daftar). Dipakai halaman daftar dan,
 * nanti, wizard setup toko, supaya urutannya sama di kedua tempat
 * (modul/setup-akun.md). Langkah sebelum langkah aktif ditandai selesai;
 * aktif 4 menandai ketiganya selesai (halaman setup selesai). Di layar
 * sempit tersusun vertikal tanpa garis penghubung, mulai sm mendatar; tegak
 * menyusunnya vertikal di semua lebar, untuk panel sempit seperti wizard
 * setup.
 */
export function LangkahDaftar({ aktif, tegak = false }: { aktif: 1 | 2 | 3 | 4; tegak?: boolean }) {
  return (
    <ol
      aria-label="Langkah pendaftaran"
      className={
        tegak
          ? "flex flex-col items-start gap-3"
          : "flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      }
    >
      {LANGKAH.map((nama, i) => {
        const nomor = i + 1;
        const selesai = nomor < aktif;
        const kini = nomor === aktif;
        return (
          <Fragment key={nama}>
            {i > 0 && !tegak && <li aria-hidden="true" className="hidden h-0.5 w-8 bg-input sm:block" />}
            <li
              aria-current={kini ? "step" : undefined}
              className={
                "flex items-center gap-2.5 text-besar " +
                (kini ? "font-semibold text-navy" : selesai ? "text-navy" : "text-muted-foreground")
              }
            >
              <span
                className={
                  "flex h-[30px] w-[30px] items-center justify-center rounded-full text-isi font-semibold " +
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