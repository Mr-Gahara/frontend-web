"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PerangkatKasir } from "@/types/sesiKasir";
import { teksPerangkat, type PilihanLaci, type PilihanPerangkat } from "./tampilan";

export type ModeDialogMesin =
  | { jenis: "tambah" }
  | { jenis: "ubah"; mesin: PerangkatKasir; kasirBuka: boolean; namaAlat: string | null };

/** Body POST /sesikasir/perangkat (validatePerangkatKasir): ketiganya wajib. */
export interface PayloadMesinKasir {
  installationId: string;
  akunKasID: string;
  namaPerangkat: string;
}

interface PropsDialogMesinKasir {
  buka: boolean;
  onBukaChange: (buka: boolean) => void;
  mode: ModeDialogMesin;
  perangkat: PilihanPerangkat[];
  laci: PilihanLaci[];
  sekarang: Date;
  menyimpan: boolean;
  hrefBuatAkunKas: string;
  onSimpan: (payload: PayloadMesinKasir) => void;
}

/** Dialog tambah dan ubah mesin kasir (Revisi 1 Tambah, Revisi 2 Ubah dan keadaan kosong). */
export function DialogMesinKasir(props: PropsDialogMesinKasir) {
  return (
    <Dialog open={props.buka} onOpenChange={props.onBukaChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-navy/10 bg-gading text-navy sm:max-w-[520px] sm:rounded-[20px]">
        {props.buka && <IsiDialogMesinKasir {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function IsiDialogMesinKasir({
  onBukaChange,
  mode,
  perangkat,
  laci,
  sekarang,
  menyimpan,
  hrefBuatAkunKas,
  onSimpan,
}: PropsDialogMesinKasir) {
  const ubah = mode.jenis === "ubah" ? mode : null;
  const perangkatBisa = perangkat.filter((p) => !p.sudahMesin);
  const laciBebas = laci.filter((l) => !l.dipakaiOleh);

  const [installationId, setInstallationId] = useState(
    ubah?.mesin.installationId ?? perangkatBisa[0]?.installationId ?? "",
  );
  const [nama, setNama] = useState(ubah?.mesin.namaPerangkat ?? "");
  const [akunKasID, setAkunKasID] = useState(ubah?.mesin.akunKasID ?? laciBebas[0]?.id ?? "");

  const laciTerkunci = Boolean(ubah?.kasirBuka);
  const valid = installationId !== "" && akunKasID !== "" && nama.trim() !== "";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-[22px] font-bold text-navy">
          {ubah ? "Ubah mesin kasir" : "Tambah mesin kasir"}
        </DialogTitle>
        <DialogDescription className="text-[15px] text-navy/70">
          {ubah
            ? (ubah.namaAlat ?? ubah.mesin.namaPerangkat)
            : "Pilih HP atau tablet yang dipakai berjualan, lalu tentukan laci uangnya."}
        </DialogDescription>
      </DialogHeader>

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSimpan({ installationId, akunKasID, namaPerangkat: nama.trim() });
        }}
      >
        {!ubah && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[15px] font-bold">Perangkat</legend>
            {perangkat.length === 0 ? (
              <div className="rounded-xl border border-dashed border-navy/25 px-4 py-3.5 text-[15px] text-navy/70">
                Belum ada perangkat yang bisa dipilih. Minta karyawan login sekali lewat aplikasi di HP atau tablet
                itu, lalu setujui perangkatnya di Karyawan dan Staff.
              </div>
            ) : (
              <>
                <span className="mb-1 text-sm text-navy/70">
                  Perangkat yang sudah disetujui dan pernah dipakai login di toko ini.
                </span>
                {perangkat.map((p) => {
                  const dipilih = p.installationId === installationId;
                  return (
                    <label
                      key={p.installationId}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-3",
                        p.sudahMesin
                          ? "border border-navy/10 bg-navy/[0.04] text-navy/70"
                          : dipilih
                            ? "cursor-pointer border-2 border-navy bg-white"
                            : "cursor-pointer border border-navy/20 bg-white",
                      )}
                    >
                      <input
                        type="radio"
                        name="perangkat"
                        value={p.installationId}
                        checked={dipilih}
                        disabled={Boolean(p.sudahMesin)}
                        onChange={() => setInstallationId(p.installationId)}
                        className="size-5 shrink-0 accent-navy"
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="break-words font-bold">{p.nama}</span>
                        <span className="text-sm text-navy/70">{teksPerangkat(p, sekarang)}</span>
                      </span>
                    </label>
                  );
                })}
                <span className="text-sm text-navy/70">
                  Perangkat yang belum muncul: minta karyawan login sekali di perangkat itu, lalu setujui di
                  Karyawan dan Staff.
                </span>
              </>
            )}
          </fieldset>
        )}

        <label className="flex flex-col gap-1.5 text-[15px] font-bold">
          Nama mesin kasir
          <Input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Kasir Depan"
            className="h-12 border-navy/20 bg-white text-base font-normal text-navy"
          />
          <span className="text-sm font-normal text-navy/70">
            Contoh: letaknya di toko, seperti Kasir Depan atau Kasir Bar.
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-bold">Laci uang</span>
          {laci.length === 0 || (!ubah && laciBebas.length === 0) ? (
            <div className="rounded-xl border border-dashed border-navy/25 px-4 py-3.5 text-[15px] text-navy/70">
              Semua laci Kas Fisik sudah dipakai mesin lain.{" "}
              <Link href={hrefBuatAkunKas} className="font-semibold text-navy underline underline-offset-4">
                Buat akun Kas Fisik baru
              </Link>{" "}
              di Akun Kas &amp; Bank.
            </div>
          ) : (
            <>
              <Select value={akunKasID} onValueChange={setAkunKasID} disabled={laciTerkunci}>
                <SelectTrigger
                  aria-label="Laci uang"
                  className="h-12 w-full border-navy/20 bg-white text-base text-navy data-[size=default]:h-12"
                >
                  <SelectValue placeholder="Pilih laci" />
                </SelectTrigger>
                <SelectContent className="border-navy/10 bg-gading text-navy">
                  {laci.map((l) => (
                    <SelectItem key={l.id} value={l.id} disabled={Boolean(l.dipakaiOleh)} className="cursor-pointer">
                      {l.dipakaiOleh ? `${l.label}, dipakai ${l.dipakaiOleh}` : l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-navy/70">
                {laciTerkunci
                  ? "Laci tidak bisa diganti selama kasir di mesin ini masih buka."
                  : "Satu laci hanya untuk satu mesin kasir. Uang tunai dari mesin ini masuk ke laci yang dipilih."}
              </span>
            </>
          )}
        </div>

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
            disabled={!valid || menyimpan}
            className="h-12 bg-navy text-base font-bold text-gading hover:bg-navy/90"
          >
            {menyimpan ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}