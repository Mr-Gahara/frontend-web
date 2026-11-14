"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { Matcher } from "react-day-picker";
import { Calendar } from "@/components/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PropsPilihTanggal {
  /** Label yang dilihat pengguna; nama aksesibel tombol menjadi "<label>, <tanggal>". */
  label: string;
  value: Date | undefined;
  onChange: (tanggal: Date) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Tanggal yang tidak boleh dipilih, diteruskan ke disabled milik kalender. */
  tanggalNonaktif?: Matcher | Matcher[];
  invalid?: boolean;
  className?: string;
  /**
   * Bila diisi, kalender menampilkan tombol "Kosongkan" di bawahnya selama
   * tanggal terisi. Untuk isian opsional seperti filter daftar.
   */
  onKosongkan?: () => void;
}

/**
 * Pemilih tanggal standar seluruh frontend (keputusan K-TW1): tombol pemicu
 * berformat "dd MMMM yyyy" dan kalender kostum components/calendar.tsx di
 * dalam popover. Popover tertutup setelah tanggal dipilih.
 */
export function PilihTanggal({
  label,
  value,
  onChange,
  id,
  placeholder = "Pilih tanggal",
  disabled,
  tanggalNonaktif,
  invalid,
  className,
  onKosongkan,
}: PropsPilihTanggal) {
  const [buka, setBuka] = useState(false);
  const teks = value ? format(value, "dd MMMM yyyy", { locale: localeID }) : placeholder;
  return (
    <Popover open={buka} onOpenChange={setBuka}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={`${label}, ${teks}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "w-full h-12 justify-start text-left font-bold cursor-pointer bg-gading border-navy/20 text-navy",
            invalid && "border-rose-500",
            className,
          )}
        >
          <CalendarIcon aria-hidden="true" className="mr-2 h-4 w-4 text-karamel" />
          {teks}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-navy/10 bg-gading" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          disabled={tanggalNonaktif}
          onSelect={(tanggal) => {
            if (!tanggal) return;
            onChange(tanggal);
            setBuka(false);
          }}
        />
        {onKosongkan && value && (
          <div className="border-t border-navy/10 p-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onKosongkan();
                setBuka(false);
              }}
              className="w-full cursor-pointer font-bold text-navy hover:bg-navy/5"
            >
              Kosongkan
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}