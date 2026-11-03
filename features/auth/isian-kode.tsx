"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { formatSisa } from "./hitung-mundur";

/**
 * Enam kotak kode verifikasi. Mengetik satu angka maju ke kotak berikutnya,
 * Backspace di kotak kosong mundur, dan menempel kode mengisi kotak
 * berurutan mulai dari kotak yang dipilih.
 */
export function IsianKode({
  nilai,
  onUbah,
  label = "Kode verifikasi",
  invalid = false,
}: {
  nilai: string[];
  onUbah: (kotak: string[]) => void;
  label?: string;
  invalid?: boolean;
}) {
  const kotak = useRef<(HTMLInputElement | null)[]>([]);
  const fokus = (i: number) => kotak.current[Math.max(0, Math.min(5, i))]?.focus();

  const ubah = (i: number, teks: string) => {
    const angka = teks.replace(/\D/g, "").slice(-1);
    const baru = [...nilai];
    baru[i] = angka;
    onUbah(baru);
    if (angka && i < 5) fokus(i + 1);
  };

  const tekan = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace" || nilai[i] !== "" || i === 0) return;
    e.preventDefault();
    const baru = [...nilai];
    baru[i - 1] = "";
    onUbah(baru);
    fokus(i - 1);
  };

  const tempel = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const angka = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!angka) return;
    e.preventDefault();
    const baru = [...nilai];
    for (let j = 0; j < angka.length && i + j < 6; j++) baru[i + j] = angka[j];
    onUbah(baru);
    fokus(i + angka.length);
  };

  return (
    <fieldset className="m-0 flex flex-col border-0 p-0">
      <legend className="mb-2.5 p-0 text-sm font-semibold">{label}</legend>
      <div className="flex gap-2">
        {nilai.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              kotak.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1} dari 6`}
            aria-invalid={invalid ? true : undefined}
            value={d}
            onChange={(e) => ubah(i, e.target.value)}
            onKeyDown={(e) => tekan(i, e)}
            onPaste={(e) => tempel(i, e)}
            className="h-[60px] w-full min-w-0 rounded-xl border border-input bg-permukaan text-center text-[26px] font-semibold text-navy focus-visible:border-2 focus-visible:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2"
          />
        ))}
      </div>
    </fieldset>
  );
}

/** "Belum menerima kode?" dengan tombol kirim ulang yang menunggu hitung mundur. */
export function KirimUlangKode({ sisa, onKirim }: { sisa: number; onKirim: () => void }) {
  return (
    <p className="text-[15px] text-muted-foreground">
      Belum menerima kode?{" "}
      <button
        type="button"
        disabled={sisa > 0}
        onClick={onKirim}
        className="h-11 cursor-pointer px-1 font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
      >
        {sisa > 0 ? `Kirim ulang dalam ${formatSisa(sisa)}` : "Kirim ulang kode"}
      </button>
    </p>
  );
}