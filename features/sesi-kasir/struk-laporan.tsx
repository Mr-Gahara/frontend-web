import type { LaporanPeriodeKasir } from "@/types/sesiKasir";
import { angkaStruk, waktuStruk } from "./laporan";

function Baris({ label, nilai, tebal }: { label: string; nilai: string; tebal?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${tebal ? "font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd className="text-right">{nilai}</dd>
    </div>
  );
}

function Garis() {
  return <hr aria-hidden="true" className="my-1 w-full border-0 border-t-[1.5px] border-dashed border-navy/45" />;
}

/** Section 2 dan 7: kasir, waktu, modal, penerimaan per metode, dan kedua total. */
function BagianTransaksi({ laporan }: { laporan: LaporanPeriodeKasir }) {
  return (
    <>
      <Baris label="Kasir" nilai={laporan.kasir.length > 0 ? laporan.kasir.join(", ") : "-"} />
      <Baris label="Buka" nilai={waktuStruk(laporan.dibukaPada)} />
      <Baris label="Tutup" nilai={waktuStruk(laporan.ditutupPada)} />
      <Baris label="Modal awal" nilai={angkaStruk(laporan.modalAwal)} />
      {laporan.penerimaanPerMetode.map((m) => (
        <Baris key={m.namaMetodePembayaran} label={m.namaMetodePembayaran} nilai={angkaStruk(m.jumlah)} />
      ))}
      <Baris label="Total penerimaan kasir" nilai={angkaStruk(laporan.totalPenerimaanKasir)} tebal />
      {/* Keputusan 11: tampil walau nilainya 0. */}
      <Baris label="Total penerimaan invoice" nilai={angkaStruk(laporan.totalPenerimaanInvoice)} />
    </>
  );
}

/**
 * Struk laporan tutup kasir dengan sembilan section dan pemisah garis
 * putus-putus sesuai Susunan struk (referensi/rencana-struk-tutup-kasir.md):
 * dua garis antara section 6 dan 7. Angka dibaca apa adanya dari laporan
 * yang dipotret backend saat periode ditutup. Huruf Geist Mono ditulis
 * langsung lewat variabelnya, karena kelas font-mono jatuh ke tumpukan bawaan
 * Tailwind (ui-monospace sampai Courier New), bukan Geist Mono.
 */
export function StrukLaporan({ laporan }: { laporan: LaporanPeriodeKasir }) {
  const alamat = laporan.outlet?.alamat ?? laporan.toko.alamat;
  return (
    <article
      aria-label="Struk laporan tutup kasir"
      className="flex w-full max-w-[400px] flex-col gap-2.5 rounded-[4px] bg-permukaan px-6 py-7 font-[family-name:var(--font-geist-mono)] text-isi leading-relaxed text-navy shadow-[0_1px_2px_color-mix(in_srgb,var(--navy)_8%,transparent),0_8px_24px_color-mix(in_srgb,var(--navy)_8%,transparent)]"
    >
      {/* 1. Toko dan outlet, tanpa judul (keputusan 6: tanpa telepon). */}
      <div className="flex flex-col gap-0.5 text-center">
        {laporan.toko.namaToko && <strong className="text-besar">{laporan.toko.namaToko}</strong>}
        {laporan.outlet?.nama && <span>{laporan.outlet.nama}</span>}
        {alamat && <span>{alamat}</span>}
      </div>
      <Garis />

      {/* 2. Transaksi penjualan. */}
      <section aria-label="Transaksi penjualan">
        <h2 className="text-isi font-bold leading-relaxed">
          LAPORAN TUTUP KASIR
          <br />
          TRANSAKSI PENJUALAN
        </h2>
        <dl className="mt-1.5 flex flex-col gap-0.5">
          <BagianTransaksi laporan={laporan} />
        </dl>
      </section>
      <Garis />

      {/* 3. Total penerimaan. */}
      <dl>
        <Baris label="Total penerimaan" nilai={angkaStruk(laporan.totalPenerimaan)} tebal />
      </dl>
      <Garis />

      {/* 4. Saldo akhir. */}
      <dl>
        <Baris label="Saldo akhir" nilai={angkaStruk(laporan.saldoAkhir)} tebal />
      </dl>
      <Garis />

      {/* 5. Transaksi selesai dan belum terbayar. */}
      <dl className="flex flex-col gap-0.5">
        <Baris label="Transaksi selesai" nilai={angkaStruk(laporan.transaksiSelesai)} />
        <Baris label="Belum terbayar" nilai={angkaStruk(laporan.transaksiBelumTerbayar)} />
      </dl>
      <Garis />

      {/* 6. Laci. */}
      <dl className="flex flex-col gap-0.5">
        <Baris label="Total sistem" nilai={angkaStruk(laporan.totalSistem)} />
        <Baris label="Tunai aktual" nilai={angkaStruk(laporan.tunaiAktual)} />
        <Baris label="Selisih" nilai={angkaStruk(laporan.selisih)} tebal />
      </dl>
      <div aria-hidden="true" data-garis-ganda="" className="flex flex-col gap-1">
        <Garis />
        <Garis />
      </div>

      {/* 7. Penjualan menu: isi section 2, lalu judul Produk Terjual. */}
      <section aria-label="Penjualan menu">
        <h2 className="text-isi font-bold leading-relaxed">
          LAPORAN TUTUP KASIR
          <br />
          PENJUALAN MENU
        </h2>
        <dl className="mt-1.5 flex flex-col gap-0.5">
          <BagianTransaksi laporan={laporan} />
        </dl>
        <h3 className="mt-1.5 text-isi font-bold leading-relaxed">PRODUK TERJUAL</h3>
      </section>
      <Garis />

      {/* 8. Produk terjual. */}
      <dl aria-label="Produk terjual" className="flex flex-col gap-0.5">
        {laporan.produkTerjual.map((p) => (
          <Baris key={p.produkID} label={p.namaProduk} nilai={angkaStruk(p.jumlah)} />
        ))}
      </dl>
      <Garis />

      {/* 9. Total produk terjual. */}
      <dl>
        <Baris label="Total produk terjual" nilai={angkaStruk(laporan.totalProdukTerjual)} tebal />
      </dl>
    </article>
  );
}
