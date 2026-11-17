"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { useDaftarPelanggan } from "@/features/pelanggan/hooks";
import { pesanError } from "@/lib/api/error";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import { cn } from "@/lib/utils";
import { keTanggalLokal } from "@/lib/waktu";
import type { Membership, PaketMembership, UbahMembershipPayload } from "@/types/membership";
import { useBuatMembership, usePenjualanPelanggan, useUbahMembership } from "./hooks";
import {
  paketTerpilih,
  pelangganTerpilih,
  penjualanTersedia,
  tanggalBerakhir,
  tanggalWIB,
} from "./tampilan";

const KELAS_LABEL = "text-kecil font-bold text-navy";
const KELAS_OPSI = "flex cursor-pointer rounded-xl border bg-white p-3 text-isi text-navy transition-colors";
const opsiAktif = (pilih: boolean) =>
  cn(KELAS_OPSI, pilih ? "border-2 border-navy" : "border-navy/20 hover:border-navy/40");

const FORMAT_AKHIR = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

/** Lencana status penjualan: PAID dan FINAL hijau, lainnya karamel. */
function LencanaPenjualan({ status }: { status: string }) {
  const lunas = status === "PAID" || status === "FINAL";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-mikro",
        lunas ? "bg-sage-pucat text-sage-tua" : "bg-karamel/30 text-karamel-tua",
      )}
    >
      {status}
    </span>
  );
}

/**
 * Dialog Daftarkan Member (membership null) atau Ubah Membership (desain B,
 * MB1a dan MB2a). Di HP dialog menjadi lembar layar penuh. Ubah hanya
 * mengganti paket dan tanggal mulai, karena backend mengunci pelanggan dan
 * penjualan; masa berlaku dihitung ulang backend. Dipasang setiap kali
 * dibuka, sehingga nilai awal selalu dari data terbaru (keputusan rancangan
 * butir 8).
 */
export function DialogMember({
  membership,
  daftarMember,
  daftarPaket,
  onTutup,
}: {
  membership: Membership | null;
  daftarMember: readonly Membership[];
  daftarPaket: readonly PaketMembership[];
  onTutup: () => void;
}) {
  const hariIni = useTanggalHariIni();
  const ubah = membership !== null;
  const [pelangganID, setPelangganID] = useState(membership?.pelanggan?.id ?? "");
  const [paketID, setPaketID] = useState(membership?.paketMembership?.id ?? "");
  const [penjualanID, setPenjualanID] = useState(membership?.penjualan?.id ?? "");
  const [mulai, setMulai] = useState<Date | undefined>(membership ? tanggalWIB(membership.tanggalMulai) : undefined);
  const [bukaPelanggan, setBukaPelanggan] = useState(false);
  const [galat, setGalat] = useState("");
  const [dicoba, setDicoba] = useState(false);

  const pelanggan = useDaftarPelanggan();
  const pilihanPelanggan = useMemo(() => pelangganTerpilih(pelanggan.data ?? []), [pelanggan.data]);
  const pilihanPaket = useMemo(
    () => paketTerpilih(daftarPaket, membership?.paketMembership?.id),
    [daftarPaket, membership],
  );
  const penjualan = usePenjualanPelanggan(ubah ? null : pelangganID || null);
  const pilihanPenjualan = useMemo(
    () => penjualanTersedia(penjualan.data?.pages.flatMap((h) => h.data) ?? [], daftarMember),
    [penjualan.data, daftarMember],
  );

  const tanggalMulai = mulai ?? hariIni;
  const paket = daftarPaket.find((p) => p.id === paketID);
  const akhir = paket ? FORMAT_AKHIR.format(tanggalBerakhir(tanggalMulai, paket.durasiHari)) : "-";
  const namaPelanggan = ubah
    ? membership.pelanggan?.namaPelanggan ?? "-"
    : pilihanPelanggan.find((p) => p.id === pelangganID)?.namaPelanggan;

  const opsi = {
    onSuccess: () => {
      toast.success(ubah ? "Membership diperbarui" : "Member didaftarkan");
      onTutup();
    },
    onError: (err: unknown) => setGalat(pesanError(err, "Gagal menyimpan membership.")),
  };
  const buat = useBuatMembership(opsi);
  const simpan = useUbahMembership(opsi);
  const memuat = buat.isPending || simpan.isPending;

  const kurang = {
    pelanggan: !pelangganID,
    paket: !paketID,
    penjualan: !penjualanID,
  };
  const payloadUbah: UbahMembershipPayload = {};
  if (ubah) {
    if (paketID !== membership.paketMembership?.id) payloadUbah.paketMembershipID = paketID;
    if (keTanggalLokal(tanggalMulai) !== keTanggalLokal(tanggalWIB(membership.tanggalMulai))) {
      payloadUbah.tanggalMulai = keTanggalLokal(tanggalMulai);
    }
  }
  const tidakBerubah = ubah && Object.keys(payloadUbah).length === 0;

  const kirim = () => {
    setDicoba(true);
    setGalat("");
    if (kurang.pelanggan || kurang.paket || kurang.penjualan) return;
    if (ubah) simpan.mutate({ id: membership.id, payload: payloadUbah });
    else
      buat.mutate({
        pelangganID,
        paketMembershipID: paketID,
        penjualanID,
        tanggalMulai: keTanggalLokal(tanggalMulai),
      });
  };

  return (
    <Dialog
      open
      onOpenChange={(buka) => {
        if (!buka && !memuat) onTutup();
      }}
    >
      <DialogContent className="bg-gading border-navy/10 sm:max-w-xl max-h-[90dvh] overflow-y-auto max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:max-w-none max-sm:h-dvh max-sm:max-h-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none">
        <DialogHeader>
          <DialogTitle className="text-navy text-subjudul font-bold">
            {ubah ? "Ubah Membership" : "Daftarkan Member"}
          </DialogTitle>
          <DialogDescription className="text-navy/70 font-medium">
            {ubah
              ? "Pelanggan dan penjualan tidak dapat diganti. Masa berlaku dihitung ulang dari tanggal mulai dan durasi paket."
              : "Pilih pelanggan, paket, dan penjualan paket yang sudah dibuat di kasir."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <span className={KELAS_LABEL} id="label-pelanggan-member">
            Pelanggan *
          </span>
          {ubah ? (
            <p className="rounded-xl border border-navy/15 bg-navy/5 px-4 py-3 text-isi font-bold text-navy">
              {namaPelanggan}
            </p>
          ) : (
            <Popover open={bukaPelanggan} onOpenChange={setBukaPelanggan}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-labelledby="label-pelanggan-member"
                  disabled={pelanggan.isPending}
                  className={cn(
                    "w-full min-w-0 justify-between h-11 bg-white border-navy/20 text-navy font-bold",
                    dicoba && kurang.pelanggan && "border-rose-500",
                  )}
                >
                  <span className="min-w-0 truncate">
                    {namaPelanggan ?? (pelanggan.isPending ? "Memuat..." : "Cari pelanggan...")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-navy/10" align="start">
                <Command className="bg-gading">
                  <CommandInput placeholder="Cari nama pelanggan..." className="text-navy" />
                  <CommandList>
                    <CommandEmpty className="py-6 text-center text-isi text-navy/60 font-medium">
                      Pelanggan tidak ditemukan.
                    </CommandEmpty>
                    <CommandGroup>
                      {pilihanPelanggan.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.namaPelanggan} ${p.nomorHp ?? ""} ${p.id}`}
                          onSelect={() => {
                            setPelangganID(p.id);
                            setPenjualanID("");
                            setBukaPelanggan(false);
                          }}
                          className="cursor-pointer text-navy aria-selected:bg-navy/5 font-bold"
                        >
                          <Check className={cn("mr-2 h-4 w-4 text-sage", pelangganID === p.id ? "opacity-100" : "opacity-0")} />
                          {p.namaPelanggan}
                          {p.nomorHp ? <span className="ml-2 text-kecil font-medium text-navy/60">{p.nomorHp}</span> : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          {dicoba && kurang.pelanggan && <span className="text-kecil font-bold text-rose-500">Pilih pelanggan.</span>}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2">
            <span className={KELAS_LABEL}>Paket *</span>
          </legend>
          {pilihanPaket.length === 0 ? (
            <p className="text-isi text-navy/70">Belum ada paket aktif. Buat paket di tab Paket.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pilihanPaket.map((p) => (
                <label key={p.id} className={opsiAktif(paketID === p.id)}>
                  <input
                    type="radio"
                    name="paket-member"
                    value={p.id}
                    checked={paketID === p.id}
                    onChange={() => setPaketID(p.id)}
                    className="sr-only"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-bold">{p.namaPaket}</span>
                    <span className="text-kecil text-navy/70">
                      {formatRupiah(p.harga)} · {p.durasiHari} hari
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {dicoba && kurang.paket && <span className="text-kecil font-bold text-rose-500">Pilih paket.</span>}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2">
            <span className={KELAS_LABEL}>
              Penjualan paket{namaPelanggan && !ubah ? ` milik ${namaPelanggan}` : ""} *
            </span>
          </legend>
          {ubah ? (
            <p className="rounded-xl border border-navy/15 bg-navy/5 px-4 py-3 font-mono text-kecil text-navy">
              {membership.penjualan?.noReferensi ?? "-"}
            </p>
          ) : !pelangganID ? (
            <p className="text-isi text-navy/70">Pilih pelanggan untuk melihat penjualannya.</p>
          ) : penjualan.isPending ? (
            <p className="text-isi text-navy/70">Memuat penjualan...</p>
          ) : penjualan.isError ? (
            <p role="alert" className="text-isi font-bold text-rose-500">
              {pesanError(penjualan.error, "Gagal memuat penjualan pelanggan.")}
            </p>
          ) : pilihanPenjualan.length === 0 && !penjualan.hasNextPage ? (
            <p className="text-isi text-navy/70">Pelanggan ini belum punya penjualan yang dapat dipakai.</p>
          ) : (
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
              {pilihanPenjualan.map((pj) => (
                <label key={pj.id} className={cn(opsiAktif(penjualanID === pj.id), "flex-wrap items-center gap-x-3 gap-y-1")}>
                  <input
                    type="radio"
                    name="penjualan-member"
                    value={pj.id}
                    checked={penjualanID === pj.id}
                    onChange={() => setPenjualanID(pj.id)}
                    className="sr-only"
                  />
                  <span className="min-w-0 flex-1 break-all font-mono text-kecil">{pj.noReferensi}</span>
                  <span className="text-kecil text-navy/70">{formatTanggalPendek(pj.tanggalTransaksi)}</span>
                  <span className="font-bold">{formatRupiah(pj.totalTagihan)}</span>
                  <LencanaPenjualan status={pj.statusPenjualan} />
                </label>
              ))}
              {penjualan.hasNextPage && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void penjualan.fetchNextPage()}
                  disabled={penjualan.isFetchingNextPage}
                  className="self-start"
                >
                  {penjualan.isFetchingNextPage ? "Memuat..." : "Muat lebih banyak"}
                </Button>
              )}
              <span className="text-kecil text-navy/60">
                Penjualan VOID dan yang sudah dipakai membership lain tidak ditampilkan.
              </span>
            </div>
          )}
          {dicoba && kurang.penjualan && !ubah && (
            <span className="text-kecil font-bold text-rose-500">Pilih penjualan paket.</span>
          )}
        </fieldset>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <span className={KELAS_LABEL}>Tanggal mulai</span>
            <PilihTanggal label="Tanggal mulai" value={tanggalMulai} onChange={setMulai} />
          </div>
          <p className="flex-1 rounded-xl bg-krem px-4 py-3 text-isi text-navy">
            Berlaku sampai <strong>{akhir}</strong>
          </p>
        </div>

        {galat && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-isi font-medium text-destructive">
            {galat}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onTutup} disabled={memuat}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={kirim}
            disabled={memuat || tidakBerubah}
            className="bg-navy text-gading hover:bg-navy/90 font-bold"
          >
            {memuat ? "Menyimpan..." : ubah ? "Simpan Perubahan" : "Daftarkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
