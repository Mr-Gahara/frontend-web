"use client";

import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BATAS_JAM,
  BATAS_MENIT,
  rapikanBagian,
  terimaKetikan,
  type NilaiWaktu,
} from "@/lib/waktu";

interface PropsInputWaktu {
  /** Nama aksesibel grup; isiannya bernama "<label> (jam)" dan "<label> (menit)". */
  label: string;
  value: NilaiWaktu;
  onChange: (waktu: NilaiWaktu) => void;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

const KELAS_ISIAN =
  "w-10 bg-transparent text-center font-bold text-[#0A2947] outline-none placeholder:text-[#0A2947]/30 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Input jam dan menit standar seluruh frontend (keputusan K-TW1). Aturan
 * ketikan dan isian kosong ada di lib/waktu.ts (K-TW4a dan K-TW5a); halaman
 * pemakai menolak waktu yang belum lengkap saat simpan lewat waktuLengkap.
 */
export function InputWaktu({ label, value, onChange, id, disabled, invalid, className }: PropsInputWaktu) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex h-12 w-full items-center gap-2 rounded-md border border-[#0A2947]/20 bg-[#FFFAF3] px-3 focus-within:ring-1 focus-within:ring-[#0A2947]",
        invalid && "border-rose-500",
        className,
      )}
    >
      <Clock3 aria-hidden="true" className="h-4 w-4 text-[#D4A373]" />
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        placeholder="--"
        aria-label={`${label} (jam)`}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={KELAS_ISIAN}
        value={value.jam}
        onChange={(e) => onChange({ ...value, jam: terimaKetikan(value.jam, e.target.value, BATAS_JAM) })}
        onBlur={() => onChange({ ...value, jam: rapikanBagian(value.jam) })}
      />
      <span aria-hidden="true" className="font-bold text-[#0A2947]">
        :
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        placeholder="--"
        aria-label={`${label} (menit)`}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={KELAS_ISIAN}
        value={value.menit}
        onChange={(e) => onChange({ ...value, menit: terimaKetikan(value.menit, e.target.value, BATAS_MENIT) })}
        onBlur={() => onChange({ ...value, menit: rapikanBagian(value.menit) })}
      />
    </div>
  );
}