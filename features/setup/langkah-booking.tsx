"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JudulLangkah, NavigasiLangkah, PesanIsian, PilihanTombol } from "./bagian";
import { KELAS_ISIAN, KELAS_LABEL } from "./gaya";
import type { PropsLangkah } from "./langkah";
import { skemaBookingSetup, type NilaiBookingSetup } from "./schema";

/**
 * Langkah sesi booking, hanya untuk plan Advanced dan Pro (PL1a). Sesudah
 * naik plan, langkah ini yang membuka menu booking; kasir tetap berjalan
 * selama langkah ini belum selesai (PL5a).
 */
const NILAI_AWAL_BOOKING: NilaiBookingSetup = {
  namaTipeAset: "",
  namaAset: "",
  namaTarif: "",
  basisPerhitungan: "per jam",
  harga: "",
  durasiMinimum: "1",
};

export function LangkahBooking({
  nomor,
  total,
  teksLanjut,
  awal,
  onLanjut,
  onKembali,
}: PropsLangkah<NilaiBookingSetup | null>) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<NilaiBookingSetup>({
    resolver: zodResolver(skemaBookingSetup),
    defaultValues: awal ?? NILAI_AWAL_BOOKING,
  });
  const basis = useWatch({ control, name: "basisPerhitungan" });

  const isian = (
    nama: keyof NilaiBookingSetup,
    label: string,
    opsi: { inputMode?: "numeric"; className?: string } = {},
  ) => (
    <div className={"flex flex-col gap-2 " + (opsi.className ?? "")}>
      <label htmlFor={"setup-booking-" + nama} className={KELAS_LABEL}>
        {label}
      </label>
      <input
        id={"setup-booking-" + nama}
        inputMode={opsi.inputMode}
        {...register(nama)}
        aria-invalid={errors[nama] ? true : undefined}
        className={KELAS_ISIAN}
      />
      <PesanIsian pesan={errors[nama]?.message} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onLanjut)} noValidate className="flex flex-col gap-[22px]">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Sesi booking"
        catatan="fitur plan Advanced"
        keterangan="Siapkan yang bisa dipesan pelanggan per waktu, misalnya ruang meeting atau meja biliar. Kasir tetap bisa dipakai selama langkah ini belum selesai; hanya menu booking yang terkunci."
      />
      <section aria-label="Tipe aset" className="flex flex-col gap-3 rounded-2xl border border-input p-[18px]">
        <h2 className="text-base font-bold">1. Tipe aset</h2>
        {isian("namaTipeAset", "Nama tipe aset")}
      </section>
      <section aria-label="Aset" className="flex flex-col gap-3 rounded-2xl border border-input p-[18px]">
        <h2 className="text-base font-bold">2. Aset</h2>
        {isian("namaAset", "Nama aset")}
      </section>
      <section aria-label="Tarif" className="flex flex-col gap-3.5 rounded-2xl border border-input p-[18px]">
        <h2 className="text-base font-bold">3. Tarif</h2>
        {isian("namaTarif", "Nama tarif")}
        <PilihanTombol
          id="setup-booking-basis"
          pertanyaan="Basis perhitungan"
          opsi={[
            { nilai: "per jam", label: "Per jam" },
            { nilai: "per sesi", label: "Per sesi" },
          ]}
          nilai={basis}
          onUbah={(n) => setValue("basisPerhitungan", n)}
        />
        <div className="flex flex-wrap gap-3">
          {isian("harga", "Harga", { inputMode: "numeric", className: "flex-[1_1_160px]" })}
          {isian("durasiMinimum", "Durasi minimum", { inputMode: "numeric", className: "flex-[1_1_160px]" })}
        </div>
      </section>
      <NavigasiLangkah onKembali={onKembali} teksLanjut={teksLanjut} />
    </form>
  );
}