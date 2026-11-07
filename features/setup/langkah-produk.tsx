"use client";

import { useRef, type ChangeEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SATUAN_RESEP } from "@/features/produk/schema";
import {
  DaftarTambahan,
  JudulLangkah,
  NavigasiLangkah,
  PenandaBelumTersimpan,
  PesanGalat,
  PesanIsian,
  PilihanTombol,
} from "./bagian";
import { KELAS_ISIAN, KELAS_LABEL, KELAS_TOMBOL_GARIS, KELAS_TOMBOL_TAMBAH_AKTIF } from "./gaya";
import { adaIsian, gulirKe, pesanBelumTersimpan } from "./penanda";
import { useKirim } from "./kirim";
import type { PropsDaftar } from "./langkah";
import { skemaProdukSetup, type NilaiProdukSetup } from "./schema";

const NILAI_AWAL_PRODUK: NilaiProdukSetup = {
  namaProduk: "",
  kategoriID: "",
  hargaDasar: "",
  hargaJual: "",
  pakaiStok: true,
  stok: "",
  stokMinimal: "",
  pakaiResep: false,
  resep: [],
};

/** Pilihan kategori dan bahan baku dari server. */
export interface PilihanKategori {
  id: string;
  namaKategori: string;
}
export interface PilihanBahan {
  id: string;
  namaBahan: string;
  satuan: string;
}

/**
 * Produk; setiap produk langsung tersimpan di server. Produk beresep tidak
 * ditanya stok, karena stoknya dihitung dari bahan baku; produk berstok
 * wajib stok awal dan stok minimal di atas 0 (B238).
 */
export function LangkahProduk({
  nomor,
  total,
  teksLanjut,
  butir,
  onTambah,
  onHapus,
  onLanjut,
  onKembali,
  kategori,
  bahan,
  adaResep,
}: PropsDaftar<NilaiProdukSetup> & {
  kategori: readonly PilihanKategori[];
  bahan: readonly PilihanBahan[];
  adaResep: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NilaiProdukSetup>({
    resolver: zodResolver(skemaProdukSetup),
    defaultValues: NILAI_AWAL_PRODUK,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "resep" });
  const pakaiStok = useWatch({ control, name: "pakaiStok" });
  const pakaiResep = useWatch({ control, name: "pakaiResep" });

  const pilihResep = (ya: boolean) => {
    setValue("pakaiResep", ya);
    if (ya && fields.length === 0)
      append({ bahan: "", jumlah: "", satuan: SATUAN_RESEP[0] });
  };

  const { kirim, sibuk, galat, setGalat } = useKirim(
    async (n: NilaiProdukSetup) => {
      await onTambah(n);
      reset(NILAI_AWAL_PRODUK);
    },
    "Gagal menyimpan produk.",
  );
  const hapus = useKirim(onHapus, "Gagal menghapus produk.");
  const isian = useWatch({ control });
  const tertinggal = adaIsian([
    isian.namaProduk,
    isian.kategoriID,
    isian.hargaDasar,
    isian.hargaJual,
    isian.stok,
    isian.stokMinimal,
    ...(isian.resep ?? []).flatMap((r) => [r?.bahan, r?.jumlah]),
  ]);
  const simpanProdukRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Produk"
        keterangan="Tambahkan menu yang dijual. Minimal satu produk aktif agar kasir bisa dipakai."
      />
      <DaftarTambahan
        judul="Produk ditambahkan"
        butir={butir}
        onHapus={(id) => void hapus.kirim(id)}
      />
      <form
        onSubmit={handleSubmit(kirim)}
        noValidate
        aria-labelledby="setup-produk-judul"
        className="flex flex-col gap-[18px] rounded-2xl border border-input p-5"
      >
        <h2 id="setup-produk-judul" className="text-[17px] font-bold">
          Tambah produk
        </h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="setup-produk-nama" className={KELAS_LABEL}>
            Nama produk
          </label>
          <input
            id="setup-produk-nama"
            {...register("namaProduk")}
            aria-invalid={errors.namaProduk ? true : undefined}
            className={KELAS_ISIAN}
          />
          <PesanIsian pesan={errors.namaProduk?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="setup-produk-kategori" className={KELAS_LABEL}>
            Kategori
          </label>
          <select
            id="setup-produk-kategori"
            {...register("kategoriID")}
            aria-invalid={errors.kategoriID ? true : undefined}
            className={KELAS_ISIAN}
          >
            <option value="">Pilih kategori</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.namaKategori}
              </option>
            ))}
          </select>
          <PesanIsian pesan={errors.kategoriID?.message} />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-[1_1_180px] flex-col gap-2">
            <label htmlFor="setup-produk-dasar" className={KELAS_LABEL}>
              Harga dasar
            </label>
            <input
              id="setup-produk-dasar"
              inputMode="numeric"
              {...register("hargaDasar")}
              aria-invalid={errors.hargaDasar ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.hargaDasar?.message} />
          </div>
          <div className="flex flex-[1_1_180px] flex-col gap-2">
            <label htmlFor="setup-produk-jual" className={KELAS_LABEL}>
              Harga jual
            </label>
            <input
              id="setup-produk-jual"
              inputMode="numeric"
              {...register("hargaJual")}
              aria-invalid={errors.hargaJual ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.hargaJual?.message} />
          </div>
        </div>

        {!pakaiResep && (
          <PilihanTombol
            id="setup-produk-stok"
            pertanyaan="Pakai stok?"
            opsi={[
              { nilai: "ya", label: "Ya, hitung stoknya" },
              { nilai: "tidak", label: "Tidak, stok tidak terbatas" },
            ]}
            nilai={pakaiStok ? "ya" : "tidak"}
            onUbah={(n) => setValue("pakaiStok", n === "ya")}
          />
        )}
        {pakaiStok && !pakaiResep && (
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-[1_1_180px] flex-col gap-2">
              <label htmlFor="setup-produk-stok-awal" className={KELAS_LABEL}>
                Stok awal
              </label>
              <input
                id="setup-produk-stok-awal"
                inputMode="numeric"
                {...register("stok")}
                aria-invalid={errors.stok ? true : undefined}
                className={KELAS_ISIAN}
              />
              <PesanIsian pesan={errors.stok?.message} />
            </div>
            <div className="flex flex-[1_1_180px] flex-col gap-2">
              <label htmlFor="setup-produk-stok-min" className={KELAS_LABEL}>
                Stok minimal
              </label>
              <input
                id="setup-produk-stok-min"
                inputMode="numeric"
                {...register("stokMinimal")}
                aria-describedby="setup-produk-stok-min-bantu"
                aria-invalid={errors.stokMinimal ? true : undefined}
                className={KELAS_ISIAN}
              />
              <p
                id="setup-produk-stok-min-bantu"
                className="text-[13px] text-muted-foreground"
              >
                Peringatan muncul bila stok di bawah angka ini.
              </p>
              <PesanIsian pesan={errors.stokMinimal?.message} />
            </div>
          </div>
        )}

        {adaResep && (
          <>
            <PilihanTombol
              id="setup-produk-resep"
              pertanyaan="Pakai resep?"
              opsi={[
                { nilai: "ya", label: "Ya, dibuat dari bahan baku" },
                { nilai: "tidak", label: "Tidak pakai resep" },
              ]}
              nilai={pakaiResep ? "ya" : "tidak"}
              onUbah={(n) => pilihResep(n === "ya")}
            />
            {pakaiResep && (
              <div className="flex flex-col gap-2.5">
                {fields.map((f, i) => (
                  <div key={f.id} className="flex flex-wrap items-start gap-2">
                    <div className="flex flex-[2_1_200px] flex-col gap-1">
                      <label
                        htmlFor={`setup-resep-bahan-${i}`}
                        className="sr-only"
                      >
                        Bahan baku {i + 1}
                      </label>
                      <select
                        id={`setup-resep-bahan-${i}`}
                        {...register(`resep.${i}.bahan`, {
                          onChange: (e: ChangeEvent<HTMLSelectElement>) => {
                            const satuan = bahan.find(
                              (b) => b.id === e.target.value,
                            )?.satuan;
                            if (
                              satuan &&
                              (SATUAN_RESEP as readonly string[]).includes(
                                satuan,
                              )
                            ) {
                              setValue(
                                `resep.${i}.satuan`,
                                satuan as (typeof SATUAN_RESEP)[number],
                              );
                            }
                          },
                        })}
                        className={KELAS_ISIAN}
                      >
                        <option value="">Pilih bahan baku</option>
                        {bahan.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.namaBahan} ({b.satuan})
                          </option>
                        ))}
                      </select>
                      <PesanIsian pesan={errors.resep?.[i]?.bahan?.message} />
                    </div>
                    <div className="flex flex-[1_1_100px] flex-col gap-1">
                      <label
                        htmlFor={`setup-resep-jumlah-${i}`}
                        className="sr-only"
                      >
                        Jumlah {i + 1}
                      </label>
                      <input
                        id={`setup-resep-jumlah-${i}`}
                        inputMode="decimal"
                        placeholder="Jumlah"
                        {...register(`resep.${i}.jumlah`)}
                        className={KELAS_ISIAN}
                      />
                      <PesanIsian pesan={errors.resep?.[i]?.jumlah?.message} />
                    </div>
                    <div className="flex flex-[1_1_100px] flex-col gap-1">
                      <label
                        htmlFor={`setup-resep-satuan-${i}`}
                        className="sr-only"
                      >
                        Satuan {i + 1}
                      </label>
                      <select
                        id={`setup-resep-satuan-${i}`}
                        {...register(`resep.${i}.satuan`)}
                        className={KELAS_ISIAN}
                      >
                        {SATUAN_RESEP.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="h-12 cursor-pointer rounded-xl px-3 text-sm font-semibold underline decoration-karamel decoration-2 underline-offset-[3px]"
                    >
                      Hapus bahan {i + 1}
                    </button>
                  </div>
                ))}
                <PesanIsian
                  pesan={errors.resep?.message ?? errors.resep?.root?.message}
                />
                <button
                  type="button"
                  onClick={() =>
                    append({ bahan: "", jumlah: "", satuan: SATUAN_RESEP[0] })
                  }
                  className={KELAS_TOMBOL_GARIS + " self-start"}
                >
                  Tambah bahan
                </button>
              </div>
            )}
          </>
        )}
        <button
          ref={simpanProdukRef}
          type="submit"
          disabled={sibuk}
          className={(tertinggal ? KELAS_TOMBOL_TAMBAH_AKTIF : KELAS_TOMBOL_GARIS) + " self-start"}
        >
          {sibuk ? "Menyimpan..." : "Simpan produk"}
        </button>
        {tertinggal && <PenandaBelumTersimpan teksTombol="Simpan produk" />}
      </form>
      <PesanGalat pesan={galat || hapus.galat} />
      <NavigasiLangkah
        onKembali={onKembali}
        teksLanjut={teksLanjut}
        sibuk={sibuk || hapus.sibuk}
        onLanjut={() => {
          if (tertinggal) {
            setGalat(pesanBelumTersimpan("Produk", isian.namaProduk, "Simpan produk", "disimpan"));
            gulirKe(simpanProdukRef.current);
          } else if (butir.length === 0) setGalat("Tambahkan minimal satu produk.");
          else onLanjut();
        }}
      />
    </div>
  );
}
