"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  bolehTampilSendiri,
  kotakSama,
  kotakSorotan,
  penyimpananLokal,
  tandaiDilihat,
  type Kotak,
  type TitikPanduan,
} from "@/lib/panduan";

/**
 * Lama menunggu elemen sebuah titik muncul sebelum titik itu dilewati.
 * Hanya jaring pengaman: pemakai sebaiknya menyaring titik yang elemennya
 * memang tidak dipasang (misalnya menu di luar izin) sebelum memberikannya.
 */
const BATAS_TUNGGU_MS = 800;

/**
 * Buka dan tutup tur untuk satu layar. Tampil sendiri bila belum pernah
 * dilihat di perangkat ini (lib/panduan.ts); mulai() membukanya lagi dari
 * tombol Lihat panduan. Selesai, Lewati panduan, tombol tutup, dan Escape
 * sama-sama mencatat tur sudah dilihat.
 */
export function usePanduan(kunci: string | null, otomatis = true) {
  const [buka, setBuka] = useState(false);
  useEffect(() => {
    if (!kunci || !otomatis || !bolehTampilSendiri(penyimpananLokal(), kunci)) return;
    // Ditunda sebentar agar elemen layar selesai dipasang sebelum disorot.
    const t = window.setTimeout(() => setBuka(true), 400);
    return () => window.clearTimeout(t);
  }, [kunci, otomatis]);
  const mulai = useCallback(() => setBuka(true), []);
  const tutup = useCallback(() => {
    if (kunci) tandaiDilihat(penyimpananLokal(), kunci);
    setBuka(false);
  }, [kunci]);
  return { buka, mulai, tutup };
}

function cariElemen(target: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-panduan="${target}"]`);
}

const KELAS_TOMBOL_KECIL =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel";

/**
 * Tur sorotan gaya B (kanvas "Panduan Wizard Setup", pemilik proyek,
 * 7 November 2026): layar diredupkan navy 35%, elemen disorot cincin navy,
 * dan balon putih berisi "Panduan x dari y". Balon memakai Popover Radix
 * agar tetap dapat diklik dan difokus di atas dialog modal seperti sidebar
 * HP; lapisan sorotan hanya hiasan dan tidak menahan klik.
 */
interface PropsTur {
  /** Daftar titik; tetapkan sebagai konstanta modul atau useMemo agar stabil. */
  titik: readonly TitikPanduan[];
  buka: boolean;
  onTutup: () => void;
  /** Dipanggil setiap titik menjadi aktif, misalnya untuk membuka sidebar HP. */
  onPindah?: (titik: TitikPanduan, indeks: number) => void;
}

export function TurSorotan(props: PropsTur) {
  // Dipasang ulang setiap dibuka, sehingga tur selalu mulai dari titik pertama.
  return props.buka && props.titik.length > 0 ? <IsiTur {...props} /> : null;
}

function IsiTur({ titik, onTutup, onPindah }: PropsTur) {
  const [indeks, setIndeks] = useState(0);
  // Arah langkah terakhir, agar titik yang dilewati mengikuti arah pengguna.
  const [mundur, setMundur] = useState(false);
  const [kotak, setKotak] = useState<Kotak | null>(null);
  const kotakRef = useRef<Kotak | null>(null);
  // Penangan disimpan di ref agar fungsi baru dari induk tidak memulai ulang
  // pelacakan posisi di bawah.
  const tutupRef = useRef(onTutup);
  const pindahRef = useRef(onPindah);
  useEffect(() => {
    tutupRef.current = onTutup;
    pindahRef.current = onPindah;
  });
  const aktif = titik[indeks];

  useEffect(() => {
    if (aktif) pindahRef.current?.(aktif, indeks);
  }, [aktif, indeks]);

  // Mengikuti posisi elemen setiap frame, karena halaman dapat bergulir,
  // berubah ukuran, atau beranimasi (sidebar HP) selama tur terbuka.
  useEffect(() => {
    if (!aktif) return;
    let frame = 0;
    let digulir = false;
    const mulai = performance.now();
    const ikuti = () => {
      const el = cariElemen(aktif.target);
      if (el && !digulir) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        digulir = true;
      }
      const baru = el ? kotakSorotan(el.getBoundingClientRect()) : null;
      if (!kotakSama(baru, kotakRef.current)) {
        kotakRef.current = baru;
        setKotak(baru);
      }
      if (!el && performance.now() - mulai > BATAS_TUNGGU_MS) {
        // Elemen titik ini tidak ada di layar: lewati searah langkah pengguna.
        if (mundur && indeks > 0) setIndeks(indeks - 1);
        else if (indeks < titik.length - 1) {
          setMundur(false);
          setIndeks(indeks + 1);
        } else tutupRef.current();
        return;
      }
      frame = window.requestAnimationFrame(ikuti);
    };
    frame = window.requestAnimationFrame(ikuti);
    return () => window.cancelAnimationFrame(frame);
  }, [aktif, indeks, mundur, titik.length]);

  if (!aktif || !kotak) return null;
  const terakhir = indeks === titik.length - 1;
  const idJudul = `panduan-judul-${indeks}`;
  const idIsi = `panduan-isi-${indeks}`;

  return (
    <Popover open modal={false}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[60] rounded-[14px] shadow-[0_0_0_3px_var(--navy),0_0_0_9999px_rgba(10,41,71,0.35)] transition-[top,left,width,height] duration-200"
        style={{ top: kotak.top, left: kotak.left, width: kotak.width, height: kotak.height }}
      />
      <PopoverAnchor asChild>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed"
          style={{ top: kotak.top, left: kotak.left, width: kotak.width, height: kotak.height }}
        />
      </PopoverAnchor>
      <PopoverContent
        side={aktif.sisi ?? "bottom"}
        align="start"
        sideOffset={12}
        updatePositionStrategy="always"
        collisionPadding={16}
        aria-labelledby={idJudul}
        aria-describedby={idIsi}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={onTutup}
        className="z-[70] w-[min(320px,calc(100vw-32px))] gap-2.5 rounded-[18px] border border-input bg-permukaan px-[18px] py-4 text-navy shadow-[0_12px_32px_rgba(10,41,71,0.18)] ring-0"
      >
        <PopoverPrimitive.Arrow width={18} height={9} className="fill-permukaan" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Panduan {indeks + 1} dari {titik.length}
          </span>
          <button
            type="button"
            aria-label="Tutup panduan"
            onClick={onTutup}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-krem focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p id={idJudul} className="text-[17px] font-bold leading-snug">
          {aktif.judul}
        </p>
        <p id={idIsi} className="text-sm leading-normal text-muted-foreground">
          {aktif.isi}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onTutup}
            className="cursor-pointer rounded-sm text-[13px] font-semibold underline decoration-karamel underline-offset-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel"
          >
            Lewati panduan
          </button>
          <div className="flex gap-2">
            {indeks > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMundur(true);
                  setIndeks(indeks - 1);
                }}
                className={KELAS_TOMBOL_KECIL + " border border-input bg-permukaan text-navy hover:bg-krem/60"}
              >
                Kembali
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (terakhir) return onTutup();
                setMundur(false);
                setIndeks(indeks + 1);
              }}
              className={KELAS_TOMBOL_KECIL + " bg-navy text-gading hover:bg-navy/90"}
            >
              {terakhir ? "Selesai" : "Lanjut"}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
