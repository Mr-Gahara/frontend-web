"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { LaporanPeriodeKasir } from "@/types/sesiKasir";
import { StrukLaporan } from "./struk-laporan";

const ID_UKURAN_KERTAS = "ukuran-kertas-struk";
const PX_PER_MM = 96 / 25.4;

/**
 * Tinggi kertas setinggi struk (dibulatkan ke atas per milimeter), agar
 * printer termal tidak menggulung kertas kosong dan struk tidak terbelah.
 * Diukur dengan menampilkan area cetak sesaat di luar layar selebar 80 mm.
 */
function setelUkuranKertas() {
  const area = document.querySelector<HTMLElement>("[data-area-cetak]");
  if (!area) return;
  const gayaLama = area.getAttribute("style");
  area.setAttribute("style", "display:block;position:absolute;left:-10000px;top:0;width:80mm");
  const tinggiMm = Math.ceil(area.getBoundingClientRect().height / PX_PER_MM);
  if (gayaLama === null) area.removeAttribute("style");
  else area.setAttribute("style", gayaLama);
  let gaya = document.getElementById(ID_UKURAN_KERTAS);
  if (!gaya) {
    gaya = document.createElement("style");
    gaya.id = ID_UKURAN_KERTAS;
    document.head.appendChild(gaya);
  }
  gaya.textContent = `@page { size: 80mm ${tinggiMm}mm; margin: 0; }`;
}

/**
 * Salinan struk untuk cetak dari browser (PW11): dipasang langsung di body
 * agar aturan cetak di app/globals.css dapat menyembunyikan seluruh aplikasi
 * selain area ini. Di layar tidak tampil. Tinggi kertas disetel pada
 * beforeprint, sehingga berlaku juga bila cetak dimulai dari menu browser.
 * Laporan hanya ada sesudah data dimuat di klien, sehingga document selalu
 * tersedia saat komponen ini dirender; pemeriksaannya hanya pengaman render
 * server.
 */
export function AreaCetakStruk({ laporan }: { laporan: LaporanPeriodeKasir }) {
  useEffect(() => {
    window.addEventListener("beforeprint", setelUkuranKertas);
    return () => {
      window.removeEventListener("beforeprint", setelUkuranKertas);
      document.getElementById(ID_UKURAN_KERTAS)?.remove();
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div data-area-cetak="" className="hidden">
      <StrukLaporan laporan={laporan} cetak />
    </div>,
    document.body,
  );
}
