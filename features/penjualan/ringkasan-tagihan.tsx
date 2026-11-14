import { Calculator } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { HasilSimulasi } from "./simulasi";

/** Ringkasan tagihan simulasi di layar buat penjualan; dipindah apa adanya dari halaman-buat-penjualan.tsx. */
export function RingkasanTagihan({ calc }: { calc: HasilSimulasi }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-navy text-gading p-6 shadow-md space-y-4">
      <h2 className="text-subjudul font-bold border-b border-gading/20 pb-3 flex items-center gap-2 uppercase tracking-widest text-karamel">
        <Calculator className="w-4 h-4" /> Ringkasan
      </h2>
      <div className="space-y-3 text-isi">
        <div className="flex justify-between text-gading/80 font-medium">
          <span>Subtotal Produk</span>
          <span className="font-mono text-gading">
            {formatRupiah(calc.grandTotalItem)}
          </span>
        </div>

        {calc.totalDiskonGlobal > 0 && (
          <div className="flex justify-between text-rose-300 font-bold">
            <span>Total Diskon</span>
            <span className="font-mono">
              -{formatRupiah(calc.totalDiskonGlobal)}
            </span>
          </div>
        )}

        {calc.rincianPajak.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {calc.rincianPajak.map((p, idx) => (
              <div
                key={idx}
                className="flex justify-between text-gading/60 text-kecil font-medium"
              >
                <span>Pajak: {p.namaPajak}</span>
                <span className="font-mono">
                  {p.tipe === "Inc" ? "(Inc) " : ""}
                  {formatRupiah(p.nominal)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-gading/80 font-bold border-t border-gading/20 border-dashed pt-2 mt-2">
              <span>Total Pajak</span>
              <span className="font-mono">
                {formatRupiah(calc.totalPajak)}
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-gading/20 pt-4 mt-2 flex justify-between items-end">
          <span className="text-isi font-bold text-gading">
            Total Estimasi
          </span>
          <span className="text-judul font-black text-sage leading-none font-mono">
            {formatRupiah(calc.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
