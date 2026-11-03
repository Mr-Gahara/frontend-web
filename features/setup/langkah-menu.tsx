"use client";

import { useState, type ChangeEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skemaKategori } from "@/features/kategori/schema";
import { SATUAN_RESEP } from "@/features/produk/schema";
import { SATUAN_BAHAN_OPTIONS } from "@/types/bahanBaku";
import { DaftarTambahan, JudulLangkah, NavigasiLangkah, PesanIsian, PilihanTombol } from "./bagian";
import { KELAS_ISIAN, KELAS_LABEL, KELAS_TOMBOL_GARIS } from "./gaya";
import type { PropsLangkah } from "./langkah";
import {
  skemaBahanSetup,
  skemaProdukSetup,
  type BahanSetup,
  type KategoriSetup,
  type NilaiBahanSetup,
  type NilaiProdukSetup,
  type ProdukSetup,
} from "./schema";

type NilaiKategori = { namaKategori: string; kodeKategori: string; keterangan: string };

const NILAI_AWAL_KATEGORI: NilaiKategori = { namaKategori: "", kodeKategori: "", keterangan: "" };

export function LangkahKategori({
  nomor,
  total,
  teksLanjut,
  awal,
  onLanjut,
  onKembali,
}: PropsLangkah<KategoriSetup[]>) {
  const [daftar, setDaftar] = useState(awal);
  const [galat, setGalat] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NilaiKategori>({ resolver: zodResolver(skemaKategori), defaultValues: NILAI_AWAL_KATEGORI });

  const tambah = (n: NilaiKategori) => {
    setDaftar((d) => [...d, { id: crypto.randomUUID(), namaKategori: n.namaKategori, kodeKategori: n.kodeKategori }]);
    reset(NILAI_AWAL_KATEGORI);
    setGalat("");
  };

  return (
    <div className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Kategori produk"
        keterangan="Kategori mengelompokkan menu di layar kasir. Tambahkan minimal satu."
      />
      <form onSubmit={handleSubmit(tambah)} noValidate className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-[2_1_220px] flex-col gap-2">
            <label htmlFor="setup-kategori-nama" className={KELAS_LABEL}>
              Nama kategori
            </label>
            <input
              id="setup-kategori-nama"
              placeholder="Contoh: Minuman dingin"
              {...register("namaKategori")}
              aria-invalid={errors.namaKategori ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.namaKategori?.message} />
          </div>
          <div className="flex flex-[1_1_140px] flex-col gap-2">
            <label htmlFor="setup-kategori-kode" className={KELAS_LABEL}>
              Kode kategori
            </label>
            <input
              id="setup-kategori-kode"
              placeholder="Contoh: MND"
              {...register("kodeKategori")}
              aria-invalid={errors.kodeKategori ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.kodeKategori?.message} />
          </div>
        </div>
        <button type="submit" className={KELAS_TOMBOL_GARIS + " self-start"}>
          Tambah kategori
        </button>
      </form>
      <DaftarTambahan
        judul="Kategori ditambahkan"
        butir={daftar.map((k) => ({ id: k.id, label: k.namaKategori, keterangan: "Kode " + k.kodeKategori }))}
        onHapus={(idHapus) => setDaftar((d) => d.filter((k) => k.id !== idHapus))}
      />
      {galat && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {galat}
        </p>
      )}
      <NavigasiLangkah
        onKembali={onKembali}
        teksLanjut={teksLanjut}
        onLanjut={() => (daftar.length === 0 ? setGalat("Tambahkan minimal satu kategori.") : onLanjut(daftar))}
      />
    </div>
  );
}

const NILAI_AWAL_BAHAN: NilaiBahanSetup = { namaBahan: "", satuan: SATUAN_BAHAN_OPTIONS[0], stok: "", stokMinimum: "" };

export function LangkahBahanBaku({
  nomor,
  total,
  teksLanjut,
  awal,
  onLanjut,
  onKembali,
}: PropsLangkah<{ adaResep: boolean; bahan: BahanSetup[] }>) {
  const [adaResep, setAdaResep] = useState(awal.adaResep);
  const [daftar, setDaftar] = useState(awal.bahan);
  const [galat, setGalat] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NilaiBahanSetup>({ resolver: zodResolver(skemaBahanSetup), defaultValues: NILAI_AWAL_BAHAN });

  const tambah = (n: NilaiBahanSetup) => {
    setDaftar((d) => [...d, { id: crypto.randomUUID(), namaBahan: n.namaBahan, satuan: n.satuan }]);
    reset(NILAI_AWAL_BAHAN);
    setGalat("");
  };

  const lanjut = () => {
    if (adaResep && daftar.length === 0) {
      setGalat("Tambahkan minimal satu bahan baku, atau pilih tidak ada resep.");
      return;
    }
    onLanjut({ adaResep, bahan: adaResep ? daftar : [] });
  };

  return (
    <div className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Bahan baku"
        keterangan="Bahan baku dipakai menu yang dibuat dari resep, misalnya biji kopi dan susu. Stoknya berkurang setiap menu itu terjual."
      />
      <PilihanTombol
        id="setup-bahan-tanya"
        pertanyaan="Ada menu yang dibuat dari resep?"
        opsi={[
          { nilai: "ya", label: "Ya, ada yang pakai resep" },
          { nilai: "tidak", label: "Tidak, lewati langkah ini" },
        ]}
        nilai={adaResep ? "ya" : "tidak"}
        onUbah={(n) => {
          setAdaResep(n === "ya");
          setGalat("");
        }}
      />
      {adaResep ? (
        <>
          <form onSubmit={handleSubmit(tambah)} noValidate className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-[2_1_220px] flex-col gap-2">
                <label htmlFor="setup-bahan-nama" className={KELAS_LABEL}>
                  Nama bahan
                </label>
                <input
                  id="setup-bahan-nama"
                  {...register("namaBahan")}
                  aria-invalid={errors.namaBahan ? true : undefined}
                  className={KELAS_ISIAN}
                />
                <PesanIsian pesan={errors.namaBahan?.message} />
              </div>
              <div className="flex flex-[1_1_120px] flex-col gap-2">
                <label htmlFor="setup-bahan-satuan" className={KELAS_LABEL}>
                  Satuan
                </label>
                <select id="setup-bahan-satuan" {...register("satuan")} className={KELAS_ISIAN}>
                  {SATUAN_BAHAN_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <PesanIsian pesan={errors.satuan?.message} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-[1_1_160px] flex-col gap-2">
                <label htmlFor="setup-bahan-stok" className={KELAS_LABEL}>
                  Stok awal
                </label>
                <input
                  id="setup-bahan-stok"
                  inputMode="decimal"
                  {...register("stok")}
                  aria-invalid={errors.stok ? true : undefined}
                  className={KELAS_ISIAN}
                />
                <PesanIsian pesan={errors.stok?.message} />
              </div>
              <div className="flex flex-[1_1_160px] flex-col gap-2">
                <label htmlFor="setup-bahan-minimum" className={KELAS_LABEL}>
                  Batas stok minimum
                </label>
                <input
                  id="setup-bahan-minimum"
                  inputMode="decimal"
                  {...register("stokMinimum")}
                  aria-invalid={errors.stokMinimum ? true : undefined}
                  className={KELAS_ISIAN}
                />
                <PesanIsian pesan={errors.stokMinimum?.message} />
              </div>
            </div>
            <button type="submit" className={KELAS_TOMBOL_GARIS + " self-start"}>
              Tambah bahan baku
            </button>
          </form>
          <DaftarTambahan
            judul="Bahan baku ditambahkan"
            butir={daftar.map((b) => ({ id: b.id, label: b.namaBahan, keterangan: "Satuan " + b.satuan }))}
            onHapus={(idHapus) => setDaftar((d) => d.filter((b) => b.id !== idHapus))}
          />
        </>
      ) : (
        <p role="status" className="rounded-xl border border-input bg-gading px-4 py-3.5 text-sm leading-normal">
          Langkah ini dilewati. Di langkah produk, pertanyaan resep tidak ditampilkan. Bahan baku tetap bisa
          ditambahkan nanti dari menu Inventaris.
        </p>
      )}
      {galat && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {galat}
        </p>
      )}
      <NavigasiLangkah onKembali={onKembali} teksLanjut={teksLanjut} onLanjut={lanjut} />
    </div>
  );
}

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

function ringkasProduk(n: NilaiProdukSetup, kategori: KategoriSetup[]): ProdukSetup {
  const namaKategori = kategori.find((k) => k.id === n.kategoriID)?.namaKategori ?? "";
  const harga = "Rp " + Number(n.hargaJual).toLocaleString("id-ID");
  const stok = n.pakaiStok ? "stok " + n.stok : "stok tidak terbatas";
  const resep = n.pakaiResep ? "pakai resep" : "tanpa resep";
  return { id: crypto.randomUUID(), nama: n.namaProduk, ringkasan: [namaKategori, harga, resep, stok].join(", ") };
}

export function LangkahProduk({
  nomor,
  total,
  teksLanjut,
  awal,
  onLanjut,
  onKembali,
  kategori,
  bahan,
  adaResep,
}: PropsLangkah<ProdukSetup[]> & { kategori: KategoriSetup[]; bahan: BahanSetup[]; adaResep: boolean }) {
  const [daftar, setDaftar] = useState(awal);
  const [galat, setGalat] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NilaiProdukSetup>({ resolver: zodResolver(skemaProdukSetup), defaultValues: NILAI_AWAL_PRODUK });
  const { fields, append, remove } = useFieldArray({ control, name: "resep" });
  const pakaiStok = useWatch({ control, name: "pakaiStok" });
  const pakaiResep = useWatch({ control, name: "pakaiResep" });

  const pilihResep = (ya: boolean) => {
    setValue("pakaiResep", ya);
    if (ya && fields.length === 0) append({ bahan: "", jumlah: "", satuan: SATUAN_RESEP[0] });
  };

  const simpan = (n: NilaiProdukSetup) => {
    setDaftar((d) => [...d, ringkasProduk(n, kategori)]);
    reset(NILAI_AWAL_PRODUK);
    setGalat("");
  };

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
        butir={daftar.map((p) => ({ id: p.id, label: p.nama, keterangan: p.ringkasan }))}
        onHapus={(idHapus) => setDaftar((d) => d.filter((p) => p.id !== idHapus))}
      />
      <form
        onSubmit={handleSubmit(simpan)}
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
        {pakaiStok && (
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
              <p id="setup-produk-stok-min-bantu" className="text-[13px] text-muted-foreground">
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
                      <label htmlFor={`setup-resep-bahan-${i}`} className="sr-only">
                        Bahan baku {i + 1}
                      </label>
                      <select
                        id={`setup-resep-bahan-${i}`}
                        {...register(`resep.${i}.bahan`, {
                          onChange: (e: ChangeEvent<HTMLSelectElement>) => {
                            const satuan = bahan.find((b) => b.id === e.target.value)?.satuan;
                            if (satuan && (SATUAN_RESEP as readonly string[]).includes(satuan)) {
                              setValue(`resep.${i}.satuan`, satuan as (typeof SATUAN_RESEP)[number]);
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
                      <label htmlFor={`setup-resep-jumlah-${i}`} className="sr-only">
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
                      <label htmlFor={`setup-resep-satuan-${i}`} className="sr-only">
                        Satuan {i + 1}
                      </label>
                      <select id={`setup-resep-satuan-${i}`} {...register(`resep.${i}.satuan`)} className={KELAS_ISIAN}>
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
                <PesanIsian pesan={errors.resep?.message ?? errors.resep?.root?.message} />
                <button
                  type="button"
                  onClick={() => append({ bahan: "", jumlah: "", satuan: SATUAN_RESEP[0] })}
                  className={KELAS_TOMBOL_GARIS + " self-start"}
                >
                  Tambah bahan
                </button>
              </div>
            )}
          </>
        )}
        <button type="submit" className={KELAS_TOMBOL_GARIS + " self-start"}>
          Simpan produk
        </button>
      </form>
      {galat && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {galat}
        </p>
      )}
      <NavigasiLangkah
        onKembali={onKembali}
        teksLanjut={teksLanjut}
        onLanjut={() => (daftar.length === 0 ? setGalat("Tambahkan minimal satu produk.") : onLanjut(daftar))}
      />
    </div>
  );
}