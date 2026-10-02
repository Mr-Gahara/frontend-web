"use client";

import { useState } from "react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { InputWaktu } from "@/components/input-waktu";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { useSession } from "@/lib/auth/useSession";
import {
  dariTanggalLokal,
  gabungTeksWaktu,
  keTanggalLokal,
  pisahTeksWaktu,
  type NilaiWaktu,
} from "@/lib/waktu";
import { useDaftarProduk } from "@/features/produk/hooks";
import { bolehBacaProduk } from "@/features/produk/izin";
import type { Diskon } from "@/types/diskon";
import type { NilaiFormDiskon } from "./schema";
import { ringkasAturan } from "./tampilan";

const KELAS_LABEL = "text-sm font-bold text-[#041E3F]";
const KELAS_KETERANGAN = "text-xs font-medium text-[#041E3F]/60";
const KELAS_INPUT =
  "bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4";
const KELAS_HAPUS = "text-xs font-semibold text-[#041E3F]/60 underline hover:text-[#041E3F] cursor-pointer";

/** Urutan tampil Senin sampai Minggu; nilainya mengikuti backend (0 Minggu). */
const HARI = [
  { nilai: 1, label: "Sen" },
  { nilai: 2, label: "Sel" },
  { nilai: 3, label: "Rab" },
  { nilai: 4, label: "Kam" },
  { nilai: 5, label: "Jum" },
  { nilai: 6, label: "Sab" },
  { nilai: 0, label: "Min" },
];

/** Jam yang kedua bagiannya kosong disimpan sebagai teks kosong. */
const keTeksJam = (waktu: NilaiWaktu) =>
  waktu.jam === "" && waktu.menit === "" ? "" : gabungTeksWaktu(waktu);

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-red-600">{pesan}</p>;
}

/**
 * Daftar produk bercentang untuk diskon Item (keputusan PD7a). Kosong
 * berarti diskon berlaku untuk seluruh produk. Tanpa izin baca produk,
 * pilihan yang sudah tersimpan dibiarkan apa adanya.
 */
function PilihanProduk({
  terpilih,
  onUbah,
}: {
  terpilih: string[];
  onUbah: (ids: string[]) => void;
}) {
  const { permissions } = useSession();
  const boleh = bolehBacaProduk(permissions);
  const produk = useDaftarProduk({ enabled: boleh });
  const [cari, setCari] = useState("");

  if (!boleh) {
    return (
      <p className={KELAS_KETERANGAN}>
        Memilih produk membutuhkan izin melihat produk. {terpilih.length} produk terpilih tidak
        berubah.
      </p>
    );
  }
  if (produk.isError) {
    return <p className="text-xs font-medium text-red-600">Gagal memuat daftar produk.</p>;
  }

  const kata = cari.trim().toLowerCase();
  const daftar = (produk.data ?? []).filter((p) => p.namaProduk.toLowerCase().includes(kata));

  return (
    <div className="space-y-2">
      <Input
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="Cari produk..."
        aria-label="Cari produk"
        className={KELAS_INPUT}
      />
      <div className="max-h-44 overflow-y-auto rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] p-3 space-y-2">
        {produk.isLoading && <p className={KELAS_KETERANGAN}>Memuat produk...</p>}
        {!produk.isLoading && daftar.length === 0 && (
          <p className={KELAS_KETERANGAN}>Tidak ada produk yang cocok.</p>
        )}
        {daftar.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <Checkbox
              id={`diskon-produk-${p.id}`}
              checked={terpilih.includes(p.id)}
              onCheckedChange={(centang) =>
                onUbah(
                  centang === true ? [...terpilih, p.id] : terpilih.filter((id) => id !== p.id),
                )
              }
            />
            <label
              htmlFor={`diskon-produk-${p.id}`}
              className="text-sm font-medium text-[#041E3F] cursor-pointer"
            >
              {p.namaProduk}
            </label>
          </div>
        ))}
      </div>
      <p className={KELAS_KETERANGAN}>
        {terpilih.length === 0
          ? "Tanpa pilihan, diskon berlaku untuk seluruh produk."
          : `${terpilih.length} produk terpilih.`}
      </p>
    </div>
  );
}

interface Props {
  register: UseFormRegister<NilaiFormDiskon>;
  control: Control<NilaiFormDiskon>;
  errors: FieldErrors<NilaiFormDiskon>;
  /** Diskon yang sedang diubah; null saat menambah. */
  diskon: Diskon | null;
}

/**
 * Bagian Aturan tambahan form diskon (keputusan PD3a dan PD9a): dapat
 * dibuka dan ditutup, terbuka sendiri bila diskon sudah punya aturan atau
 * ada isian aturan yang ditolak. Khusus member tidak ditawarkan (PD8a);
 * diskon yang sudah ditandai hanya diberi keterangan.
 */
export function IsianAturanDiskon({ register, control, errors, diskon }: Props) {
  const cakupan = useWatch({ control, name: "cakupan" });
  const tipe = useWatch({ control, name: "tipe" });
  const [dibuka, setDibuka] = useState(() => (diskon ? ringkasAturan(diskon).length > 0 : false));
  const adaGalat = Boolean(
    errors.tanggalBerakhir ||
      errors.jamSelesai ||
      errors.minimalBelanja ||
      errors.kuota ||
      errors.kuotaPerPelanggan ||
      errors.produkIDs,
  );
  const terbuka = dibuka || adaGalat;

  return (
    <Collapsible open={terbuka} onOpenChange={setDibuka}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] px-4 py-3 text-sm font-bold text-[#041E3F] cursor-pointer"
        >
          Aturan tambahan
          <ChevronDown className={`h-4 w-4 transition-transform ${terbuka ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 flex flex-col gap-5">
        <div className="space-y-2">
          <span className={KELAS_LABEL}>Masa Berlaku</span>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="tanggalMulai"
              render={({ field }) => (
                <div className="space-y-1">
                  <PilihTanggal
                    label="Tanggal Mulai"
                    value={dariTanggalLokal(field.value)}
                    onChange={(tanggal) => field.onChange(keTanggalLokal(tanggal))}
                    placeholder="Tanpa tanggal mulai"
                  />
                  {field.value !== "" && (
                    <button type="button" className={KELAS_HAPUS} onClick={() => field.onChange("")}>
                      Kosongkan tanggal mulai
                    </button>
                  )}
                </div>
              )}
            />
            <Controller
              control={control}
              name="tanggalBerakhir"
              render={({ field }) => (
                <div className="space-y-1">
                  <PilihTanggal
                    label="Tanggal Berakhir"
                    value={dariTanggalLokal(field.value)}
                    onChange={(tanggal) => field.onChange(keTanggalLokal(tanggal))}
                    placeholder="Tanpa tanggal berakhir"
                    invalid={Boolean(errors.tanggalBerakhir)}
                  />
                  {field.value !== "" && (
                    <button type="button" className={KELAS_HAPUS} onClick={() => field.onChange("")}>
                      Kosongkan tanggal berakhir
                    </button>
                  )}
                </div>
              )}
            />
          </div>
          <p className={KELAS_KETERANGAN}>
            Berlaku sejak awal tanggal mulai sampai akhir tanggal berakhir. Kosongkan untuk tanpa
            batas.
          </p>
          <PesanIsian pesan={errors.tanggalBerakhir?.message} />
        </div>

        <div className="space-y-2">
          <span className={KELAS_LABEL}>Jam Berlaku</span>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="jamMulai"
              render={({ field }) => (
                <InputWaktu
                  label="Jam Mulai"
                  value={pisahTeksWaktu(field.value)}
                  onChange={(waktu) => field.onChange(keTeksJam(waktu))}
                  invalid={Boolean(errors.jamSelesai)}
                />
              )}
            />
            <Controller
              control={control}
              name="jamSelesai"
              render={({ field }) => (
                <InputWaktu
                  label="Jam Selesai"
                  value={pisahTeksWaktu(field.value)}
                  onChange={(waktu) => field.onChange(keTeksJam(waktu))}
                  invalid={Boolean(errors.jamSelesai)}
                />
              )}
            />
          </div>
          <p className={KELAS_KETERANGAN}>
            Jam dibaca dalam WIB dan boleh melewati tengah malam. Kosongkan keduanya untuk
            sepanjang hari.
          </p>
          <PesanIsian pesan={errors.jamSelesai?.message} />
        </div>

        <div className="space-y-2">
          <span className={KELAS_LABEL}>Hari Berlaku</span>
          <Controller
            control={control}
            name="hariAktif"
            render={({ field }) => (
              <div className="flex flex-wrap gap-4">
                {HARI.map((hari) => (
                  <div key={hari.nilai} className="flex items-center gap-2">
                    <Checkbox
                      id={`diskon-hari-${hari.nilai}`}
                      checked={field.value.includes(hari.nilai)}
                      onCheckedChange={(centang) =>
                        field.onChange(
                          centang === true
                            ? [...field.value, hari.nilai]
                            : field.value.filter((h) => h !== hari.nilai),
                        )
                      }
                    />
                    <label
                      htmlFor={`diskon-hari-${hari.nilai}`}
                      className="text-sm font-medium text-[#041E3F] cursor-pointer"
                    >
                      {hari.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
          />
          <p className={KELAS_KETERANGAN}>Tanpa pilihan, diskon berlaku setiap hari.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="diskon-minimal" className={KELAS_LABEL}>Minimal Belanja (Rp)</label>
          <Input
            id="diskon-minimal"
            {...register("minimalBelanja")}
            inputMode="numeric"
            placeholder="Tanpa minimal"
            className={KELAS_INPUT}
          />
          <PesanIsian pesan={errors.minimalBelanja?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="diskon-kuota" className={KELAS_LABEL}>Kuota Pemakaian</label>
            <Input
              id="diskon-kuota"
              {...register("kuota")}
              inputMode="numeric"
              placeholder="Tanpa batas"
              className={KELAS_INPUT}
            />
            <PesanIsian pesan={errors.kuota?.message} />
          </div>
          <div className="space-y-2">
            <label htmlFor="diskon-kuota-pelanggan" className={KELAS_LABEL}>Kuota per Pelanggan</label>
            <Input
              id="diskon-kuota-pelanggan"
              {...register("kuotaPerPelanggan")}
              inputMode="numeric"
              placeholder="Tanpa batas"
              className={KELAS_INPUT}
            />
            <PesanIsian pesan={errors.kuotaPerPelanggan?.message} />
          </div>
        </div>
        {diskon && diskon.kuota !== null && (
          <p className={KELAS_KETERANGAN}>
            Sudah terpakai {diskon.terpakai} kali; kuota tidak boleh di bawah angka itu.
          </p>
        )}

        {cakupan === "Item" && (
          <div className="space-y-2">
            <span className={KELAS_LABEL}>Produk Tertentu</span>
            <Controller
              control={control}
              name="produkIDs"
              render={({ field }) => (
                <PilihanProduk terpilih={field.value} onUbah={field.onChange} />
              )}
            />
            <PesanIsian pesan={errors.produkIDs?.message} />
          </div>
        )}

        {cakupan === "Item" && tipe === "nominal" && (
          <Controller
            control={control}
            name="hitungPerBarang"
            render={({ field }) => (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="diskon-per-barang"
                  checked={field.value}
                  onCheckedChange={(centang) => field.onChange(centang === true)}
                />
                <label
                  htmlFor="diskon-per-barang"
                  className="text-sm font-medium text-[#041E3F] cursor-pointer"
                >
                  Hitung per barang
                  <span className={`block ${KELAS_KETERANGAN}`}>
                    Potongan dikalikan jumlah barang, bukan sekali per baris.
                  </span>
                </label>
              </div>
            )}
          />
        )}

        {diskon?.khususMember && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-800">
            Diskon ini ditandai khusus member. Tanda itu tidak dapat diubah dari sini, dan diskon
            hanya dapat dipakai pelanggan dengan membership aktif.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}