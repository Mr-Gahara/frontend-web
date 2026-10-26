"use client";

import { useEffect, type ReactNode } from "react";
import { useHariIni } from "@/hooks/use-hari-ini";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Info, Lock, MapPin, Package, Plus, Save, ShoppingCart, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PilihTanggal } from "@/components/pilih-tanggal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { akunKasAktif } from "@/features/akun-kas/filter";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { useDaftarBahanBaku } from "@/features/bahan-baku/hooks";
import { useLokasiBertipe } from "@/features/inventaris/hooks";
import { useLevelPenggunaAktif } from "@/features/role/hooks";
import { pesanError } from "@/lib/api/error";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import { cn } from "@/lib/utils";
import { dariTanggalLokal, keTanggalLokal } from "@/lib/waktu";
import type { AkunKas } from "@/types/akunKas";
import type { BahanBaku } from "@/types/bahanBaku";
import type { Lokasi, TipeLokasi } from "@/types/location";
import { useBuatPembelianStok } from "./hooks";
import type { RuangPembelian } from "./izin";
import { barisBarangKosong, isianAwalCatat, payloadBuatPembelian, subtotalBaris, totalIsian } from "./payload";
import { URL_PEMBELIAN, urlDetailPembelian } from "./ruang";
import { buatSkemaCatatPembelian, type IsianCatatPembelian } from "./schema";

const KELAS_ISIAN =
  "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy";
const KELAS_LABEL = "text-sm font-bold text-navy";
const KELAS_LABEL_BARIS = "text-xs font-bold text-navy/70";
const KELAS_GALAT = "text-xs font-bold text-rose-500";

const TIPE_RUANG: Record<RuangPembelian, TipeLokasi> = { outlet: "Outlet", gudang: "Gudang" };

function Keadaan({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy/20 bg-krem p-12 text-center">
      <p className="text-base font-bold text-navy mb-1">{judul}</p>
      <p className="text-sm font-medium text-navy/60 max-w-md mx-auto">{isi}</p>
    </div>
  );
}

interface Props {
  ruang: RuangPembelian;
}

/**
 * Catat pembelian stok (pemilik proyek, 25 Oktober 2026). Gerbang rute
 * menuntut izin catat pembelian, baca bahan, baca akun kas, dan baca lokasi.
 * Lokasi penerima mengikuti ruang: lokasi Outlet atau Gudang pertama milik
 * tenant (MVP satu outlet dan satu gudang). Owner, dikenali dari level role
 * 100, memilih tanggal pembelian; peran lain mencatat dengan hari ini, sama
 * dengan aturan beban dan jurnal transfer. Pilihan akun hanya akun kas
 * aktif. Form dipasang setelah lokasi, akun kas, dan bahan termuat
 * (keputusan rancangan butir 8).
 */
export default function HalamanCatatPembelianStok({ ruang }: Props) {
  const hariIni = useHariIni();
  const owner = useLevelPenggunaAktif() === 100;
  const lokasi = useLokasiBertipe(TIPE_RUANG[ruang]);
  const akunKas = useDaftarAkunKas();
  const bahan = useDaftarBahanBaku();
  const akunAktif = akunKasAktif(akunKas.data ?? []);
  const urlDaftar = URL_PEMBELIAN[ruang];

  let isi: ReactNode;
  if (lokasi.isLoading || akunKas.isLoading || bahan.isLoading) {
    isi = <Skeleton className="h-96 w-full rounded-2xl bg-navy/10" />;
  } else if (lokasi.isError || akunKas.isError || bahan.isError) {
    isi = (
      <Keadaan
        judul="Gagal memuat data form"
        isi={pesanError(
          lokasi.error ?? akunKas.error ?? bahan.error,
          "Periksa koneksi lalu muat ulang halaman.",
        )}
      />
    );
  } else if (!lokasi.lokasi) {
    isi = (
      <Keadaan
        judul={`Lokasi ${TIPE_RUANG[ruang]} belum didaftarkan`}
        isi="Pembelian menambah stok di lokasi ruang ini. Daftarkan lokasinya lebih dulu."
      />
    );
  } else if (akunAktif.length === 0) {
    isi = (
      <Keadaan
        judul="Belum ada akun kas aktif"
        isi="Pembelian dibayar dari akun kas aktif. Aktifkan atau tambahkan akun kas lebih dulu."
      />
    );
  } else if ((bahan.data ?? []).length === 0) {
    isi = (
      <Keadaan
        judul="Belum ada bahan baku"
        isi="Pembelian mencatat bahan baku dari master. Tambahkan bahan baku lebih dulu."
      />
    );
  } else {
    isi = (
      <FormCatatPembelian
        ruang={ruang}
        lokasi={lokasi.lokasi}
        akunAktif={akunAktif}
        bahanList={bahan.data ?? []}
        owner={owner}
        hariIni={hariIni}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-4">
        <Link
          href={urlDaftar}
          className="inline-flex w-fit items-center text-sm font-semibold text-navy/60 hover:text-navy"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Pembelian Stok
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <ShoppingCart className="w-6 h-6 text-karamel" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-navy">Catat Pembelian</h1>
            <p className="text-sm font-medium text-navy/60">
              Barang yang dicatat langsung menambah stok {lokasi.lokasi?.nama ?? "lokasi ruang ini"}.
            </p>
          </div>
        </div>
      </div>
      {isi}
    </div>
  );
}

function FormCatatPembelian({
  ruang,
  lokasi,
  akunAktif,
  bahanList,
  owner,
  hariIni,
}: {
  ruang: RuangPembelian;
  lokasi: Lokasi;
  akunAktif: AkunKas[];
  bahanList: BahanBaku[];
  owner: boolean;
  hariIni: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<IsianCatatPembelian>({
    resolver: zodResolver(buatSkemaCatatPembelian(hariIni)),
    defaultValues: isianAwalCatat(hariIni),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" }) ?? [];
  const akunKasID = useWatch({ control, name: "akunKasID" });
  // Tanggal yang belum diubah Owner ikut berganti saat hari berganti, agar
  // tetap sama dengan hari ini dan tidak terkirim sebagai tanggal lampau
  // (payloadBuatPembelian tidak mengirim tanggal hari ini).
  const tanggalDipilih = Boolean(dirtyFields.tanggal);
  useEffect(() => {
    if (!tanggalDipilih) setValue("tanggal", hariIni);
  }, [hariIni, tanggalDipilih, setValue]);
  const akun = akunAktif.find((a) => a.id === akunKasID);

  const buat = useBuatPembelianStok({
    onSuccess: (hasil) => {
      toast.success("Pembelian dicatat", { description: `Stok ${lokasi.nama} bertambah.` });
      router.push(urlDetailPembelian(ruang, hasil.id));
    },
    onError: (err) => {
      toast.error("Gagal Mencatat Pembelian", {
        description: pesanError(err, "Gagal mencatat pembelian."),
      });
    },
  });
  const memuat = buat.isPending;

  const kirim = (isian: IsianCatatPembelian) => {
    buat.mutate(payloadBuatPembelian(isian, lokasi.id, owner, hariIni));
  };

  const galatBarang = errors.items?.message ?? errors.items?.root?.message;

  return (
    <div className="rounded-2xl border border-navy/10 bg-krem shadow-sm">
      <form noValidate onSubmit={handleSubmit(kirim)} className="flex flex-col gap-6 p-5 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="supplier-pembelian" className={KELAS_LABEL}>
              Supplier
            </label>
            <Input
              id="supplier-pembelian"
              {...register("supplier")}
              readOnly={memuat}
              placeholder="Misal: CV Manis"
              className={cn(KELAS_ISIAN, errors.supplier && "border-rose-500")}
            />
            {errors.supplier && <span className={KELAS_GALAT}>{errors.supplier.message}</span>}
          </div>

          <div className="space-y-2">
            <label htmlFor="faktur-pembelian" className={KELAS_LABEL}>
              Nomor Faktur <span className="font-medium text-navy/60">(opsional)</span>
            </label>
            <Input
              id="faktur-pembelian"
              {...register("nomorFaktur")}
              readOnly={memuat}
              placeholder="Kosongkan untuk nomor otomatis"
              className={cn(KELAS_ISIAN, "font-mono")}
            />
            <p className="text-xs font-medium text-navy/60">
              Nomor dari nota supplier. Tidak boleh sama dengan pembelian lain.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="akun-kas-pembelian" className={KELAS_LABEL}>
              Dibayar dari akun kas
            </label>
            <Controller
              name="akunKasID"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={memuat}>
                  <SelectTrigger
                    id="akun-kas-pembelian"
                    className={cn(KELAS_ISIAN, "w-full", errors.akunKasID && "border-rose-500")}
                  >
                    <SelectValue placeholder="Pilih akun kas" />
                  </SelectTrigger>
                  <SelectContent className="bg-gading border-navy/10 text-navy">
                    {akunAktif.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.namaAkun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {akun && (
              <p className="text-xs font-medium text-navy/60">Saldo tercatat {formatRupiah(akun.saldo)}</p>
            )}
            {errors.akunKasID && <span className={KELAS_GALAT}>{errors.akunKasID.message}</span>}
          </div>

          <div className="space-y-2">
            <span className={KELAS_LABEL}>Tanggal Pembelian</span>
            {owner ? (
              <Controller
                name="tanggal"
                control={control}
                render={({ field }) => (
                  <PilihTanggal
                    label="Tanggal pembelian"
                    value={dariTanggalLokal(field.value)}
                    onChange={(tanggal) => field.onChange(keTanggalLokal(tanggal))}
                    tanggalNonaktif={{ after: new Date() }}
                    disabled={memuat}
                    invalid={!!errors.tanggal}
                  />
                )}
              />
            ) : (
              <p className="rounded-md border border-navy/20 bg-gading px-3 py-2 text-sm font-medium text-navy">
                Hari ini, {formatTanggalPendek((dariTanggalLokal(hariIni) as Date).toISOString())}
              </p>
            )}
            {owner ? (
              errors.tanggal && <span className={KELAS_GALAT}>{errors.tanggal.message}</span>
            ) : (
              <p className="text-xs font-medium text-navy/60">
                Hanya Owner yang dapat mencatat pembelian bertanggal lampau.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <span className={KELAS_LABEL}>Lokasi Penerima</span>
            <p className="flex items-center gap-2 rounded-md border border-navy/20 bg-gading px-3 py-2 text-sm font-bold text-navy">
              <MapPin className="h-4 w-4 text-karamel" aria-hidden="true" />
              {lokasi.nama}
            </p>
            <p className="text-xs font-medium text-navy/60">Mengikuti ruang tempat pembelian dicatat.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="keterangan-pembelian" className={KELAS_LABEL}>
              Keterangan
            </label>
            <Input
              id="keterangan-pembelian"
              {...register("keterangan")}
              readOnly={memuat}
              placeholder="Misal: Belanja mingguan bahan minuman"
              className={cn(KELAS_ISIAN, errors.keterangan && "border-rose-500")}
            />
            {errors.keterangan && <span className={KELAS_GALAT}>{errors.keterangan.message}</span>}
          </div>
        </div>

        <Alert className="border-karamel/50 bg-karamel/15 text-navy">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-bold">Saldo akun kas belum terpotong</AlertTitle>
          <AlertDescription className="text-navy/80">
            Pembelian ini menambah stok {lokasi.nama}, tetapi belum mengurangi saldo akun kas yang dipilih dan
            belum masuk buku mutasi kas.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-karamel" />
              <h2 className="font-bold text-navy">Barang yang Dibeli</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(barisBarangKosong())}
              disabled={memuat}
              className="border-navy/20 text-navy hover:bg-navy/5 font-bold shadow-sm h-8 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> Tambah Barang
            </Button>
          </div>
          <p className="text-xs font-medium text-navy/60">Jumlah dalam satuan bahan di master, minimal 1.</p>

          <div className="space-y-3">
            {fields.map((baris, index) => {
              const isianBaris = items[index] ?? barisBarangKosong();
              const satuan = bahanList.find((b) => b.id === isianBaris.bahanBakuID)?.satuan;
              const subtotal = subtotalBaris(isianBaris);
              const galat = errors.items?.[index];
              const nomor = index + 1;
              return (
                <div
                  key={baris.id}
                  className="flex flex-col sm:flex-row items-start gap-3 bg-white p-3 rounded-xl border border-navy/10"
                >
                  <div className="w-full sm:flex-1 space-y-1.5">
                    <label htmlFor={`pembelian-bahan-${index}`} className={KELAS_LABEL_BARIS}>
                      Bahan baku<span className="sr-only"> baris {nomor}</span>
                    </label>
                    <Controller
                      control={control}
                      name={`items.${index}.bahanBakuID`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={memuat}>
                          <SelectTrigger
                            id={`pembelian-bahan-${index}`}
                            className={cn(
                              "w-full bg-transparent border-navy/20 focus:ring-navy",
                              galat?.bahanBakuID && "border-rose-500",
                            )}
                          >
                            <SelectValue placeholder="Pilih bahan" />
                          </SelectTrigger>
                          <SelectContent>
                            {bahanList.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="cursor-pointer">
                                {b.namaBahan}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {galat?.bahanBakuID && <span className={KELAS_GALAT}>{galat.bahanBakuID.message}</span>}
                  </div>

                  <div className="w-full sm:w-36 space-y-1.5">
                    <label htmlFor={`pembelian-jumlah-${index}`} className={KELAS_LABEL_BARIS}>
                      Jumlah{satuan ? ` (${satuan})` : ""}
                      <span className="sr-only"> baris {nomor}</span>
                    </label>
                    <Input
                      id={`pembelian-jumlah-${index}`}
                      inputMode="decimal"
                      placeholder="0"
                      {...register(`items.${index}.jumlah`)}
                      readOnly={memuat}
                      className={cn(
                        "bg-transparent border-navy/20 focus-visible:ring-navy font-mono font-bold",
                        galat?.jumlah && "border-rose-500",
                      )}
                    />
                    {galat?.jumlah && <span className={KELAS_GALAT}>{galat.jumlah.message}</span>}
                  </div>

                  <div className="w-full sm:w-40 space-y-1.5">
                    <label htmlFor={`pembelian-harga-${index}`} className={KELAS_LABEL_BARIS}>
                      Harga per satuan (Rp)<span className="sr-only"> baris {nomor}</span>
                    </label>
                    <Input
                      id={`pembelian-harga-${index}`}
                      inputMode="numeric"
                      placeholder="0"
                      {...register(`items.${index}.hargaBeli`)}
                      readOnly={memuat}
                      className={cn(
                        "bg-transparent border-navy/20 focus-visible:ring-navy font-mono font-bold",
                        galat?.hargaBeli && "border-rose-500",
                      )}
                    />
                    {galat?.hargaBeli && <span className={KELAS_GALAT}>{galat.hargaBeli.message}</span>}
                  </div>

                  <div className="w-full sm:w-36 space-y-1.5">
                    <span className={KELAS_LABEL_BARIS}>Subtotal</span>
                    <p className="flex h-10 items-center font-mono font-bold text-navy">
                      {subtotal === null ? "-" : formatRupiah(subtotal)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus barang baris ${nomor}`}
                    onClick={() => remove(index)}
                    disabled={fields.length === 1 || memuat}
                    className="w-10 h-10 text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer shrink-0 sm:mt-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          {galatBarang && <span className={KELAS_GALAT}>{galatBarang}</span>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-navy px-5 py-4 text-gading shadow-md">
          <div className="flex flex-col">
            <span className="text-sm font-bold">Total pembelian</span>
            <span className="text-xs font-medium text-gading/80">{items.length} barang</span>
          </div>
          <span className="text-2xl font-black tracking-tight">{formatRupiah(totalIsian(items))}</span>
        </div>

        <p className="flex items-start gap-2 text-xs font-medium text-navy/60">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Setelah dicatat, barang, lokasi penerima, dan akun kas tidak dapat diubah. Bila ada yang keliru, hapus
          pembelian lalu catat ulang.
        </p>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-navy/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(URL_PEMBELIAN[ruang])}
            disabled={memuat}
            className="w-full sm:w-auto cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold px-6"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={memuat}
            className="w-full sm:w-auto cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold px-6 shadow-sm"
          >
            {memuat ? (
              "Menyimpan..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Pembelian
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}