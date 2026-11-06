"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { angkaDariTeks, teksRibuan } from "./nominal";

/** Body POST /sesikasir/:id/tutup (validateHitunganKasir). */
export interface PayloadTutupKasir {
  nominal: number;
  catatan?: string;
}

interface PropsDialogTutupKasir {
  namaMesin: string;
  laci: string;
  buka: boolean;
  onBukaChange: (buka: boolean) => void;
  menutup: boolean;
  /**
   * Pesan dari halaman, misalnya saat backend menjawab catatan wajib karena
   * hitungan berbeda dengan catatan sistem. Angka sistem tidak pernah
   * ditampilkan (hitung buta, sesiKasirService baris 79 sampai 103).
   */
  pesan: string | null;
  onTutup: (payload: PayloadTutupKasir) => void;
}

/** Dialog tutup kasir dari web (Revisi 1 Rincian, Revisi 2 nomor 4). */
export function DialogTutupKasir(props: PropsDialogTutupKasir) {
  return (
    <Dialog open={props.buka} onOpenChange={props.onBukaChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-navy/10 bg-gading text-navy sm:max-w-[520px] sm:rounded-[20px]">
        {props.buka && <IsiDialogTutupKasir {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function IsiDialogTutupKasir({ namaMesin, laci, onBukaChange, menutup, pesan, onTutup }: PropsDialogTutupKasir) {
  const [nominal, setNominal] = useState<number | null>(null);
  const [catatan, setCatatan] = useState("");
  const refCatatan = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (pesan) refCatatan.current?.focus();
  }, [pesan]);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-[22px] font-bold text-navy">Tutup kasir {namaMesin}?</DialogTitle>
        <DialogDescription className="text-[15px] text-navy/70">
          Hitung dulu uang di laci {laci}, lalu isi jumlahnya. Mesin kasir ini tidak bisa dipakai berjualan sampai
          kasirnya dibuka lagi.
        </DialogDescription>
      </DialogHeader>

      <form
        className="flex flex-col gap-[18px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (nominal === null) return;
          const teks = catatan.trim();
          onTutup(teks ? { nominal, catatan: teks } : { nominal });
        }}
      >
        <label className="flex flex-col gap-1.5 text-[15px] font-bold">
          Uang yang dihitung di laci
          <span className="flex h-12 items-center gap-2 rounded-[10px] border border-navy/20 bg-white px-3.5 focus-within:border-2 focus-within:border-navy">
            <span className="font-semibold text-navy/70">Rp</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              value={teksRibuan(nominal)}
              onChange={(e) => setNominal(angkaDariTeks(e.target.value))}
              className="min-w-0 flex-1 bg-transparent text-lg font-bold text-navy outline-none"
            />
          </span>
        </label>

        {pesan && (
          <div role="alert" className="rounded-[10px] bg-karamel/25 px-3.5 py-3 text-[15px] text-navy">
            {pesan}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-[15px] font-bold">
          <span>
            Catatan{" "}
            <span className="font-normal text-navy/70">(wajib bila uang tidak sama dengan catatan sistem)</span>
          </span>
          <Textarea
            ref={refCatatan}
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: ditutup dari web karena kasir lupa menutup"
            className={cn(
              "resize-y bg-white text-[15px] font-normal text-navy",
              pesan ? "border-2 border-navy" : "border-navy/20",
            )}
          />
        </label>

        <p className="rounded-[10px] bg-krem px-3.5 py-3 text-sm text-navy/70">
          Selisih dengan catatan sistem baru tampil setelah kasir ditutup, agar hitungan tidak terpengaruh.
        </p>

        <DialogFooter className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onBukaChange(false)}
            className="h-12 border-navy/20 text-base font-bold text-navy"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={nominal === null || menutup}
            className="h-12 bg-navy text-base font-bold text-gading hover:bg-navy/90"
          >
            {menutup ? "Menutup..." : "Tutup kasir"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}