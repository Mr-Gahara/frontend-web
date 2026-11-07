"use client";

import { ChefHat, Plus, Trash2 } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BahanBakuCombobox } from "@/features/bahan-baku/bahan-baku-combobox";
import { cn } from "@/lib/utils";
import type { BahanBaku } from "@/types/bahanBaku";
import { keAngka, satuanResepUntukBahan, type NilaiFormProduk, type SatuanResep } from "./schema";

/**
 * Bagian resep dan komposisi (BOM) form produk: daftar bahan, jumlah, dan
 * satuan lewat useFieldArray milik form. Dipindah apa adanya dari
 * form-produk.tsx; form dan state tetap di FormProduk.
 */
export function BagianResepProduk({
  teks,
  fields,
  append,
  remove,
  control,
  register,
  setValue,
  errors,
  bahanBakuList,
  isLoadingBahanBaku,
  resepTerisi,
}: {
  teks: { deskripsiResep: string; resepKosong: string };
  fields: FieldArrayWithId<NilaiFormProduk, "resep", "id">[];
  append: UseFieldArrayAppend<NilaiFormProduk, "resep">;
  remove: UseFieldArrayRemove;
  control: Control<NilaiFormProduk>;
  register: UseFormRegister<NilaiFormProduk>;
  setValue: UseFormSetValue<NilaiFormProduk>;
  errors: FieldErrors<NilaiFormProduk>;
  bahanBakuList: BahanBaku[];
  isLoadingBahanBaku: boolean;
  resepTerisi: NilaiFormProduk["resep"] | undefined;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-gading shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-navy/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-krem">
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-karamel" />
            <h3 className="text-base font-bold text-navy">
              Resep & Komposisi (BOM)
            </h3>
          </div>
          <p className="text-xs font-medium text-navy/60 mt-1">
            {teks.deskripsiResep}
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            append({ bahanBakuID: "", jumlah: 0, satuan: "gram" })
          }
          className="cursor-pointer bg-karamel text-navy hover:bg-karamel/90 font-bold shadow-sm h-9"
        >
          <Plus className="w-4 h-4 mr-2" /> Tambah Bahan
        </Button>
      </div>

      <div className="p-6">
        {fields.length === 0 ? (
          <div className="text-center py-8 px-4 border-2 border-dashed border-navy/10 rounded-xl bg-white/50">
            <ChefHat className="w-8 h-8 text-navy/20 mx-auto mb-2" />
            <p className="text-sm font-bold text-navy/50">
              Tidak ada resep yang ditambahkan.
            </p>
            <p className="text-xs font-medium text-navy/40 mt-1">
              {teks.resepKosong}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Tabel (Desktop) */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-2 text-xs font-bold text-navy/60 uppercase tracking-wider">
              <div className="col-span-5">Pilih Bahan Baku</div>
              <div className="col-span-3 text-center">Jumlah</div>
              <div className="col-span-3 text-center">Satuan</div>
              <div className="col-span-1 text-center">Aksi</div>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start p-4 sm:p-2 border sm:border-none border-navy/10 rounded-xl sm:rounded-none bg-white sm:bg-transparent shadow-sm sm:shadow-none"
              >
                {/* Pilih Bahan Baku */}
                <div className="col-span-1 sm:col-span-5">
                  <label className="text-xs font-bold text-navy mb-1.5 block sm:hidden">
                    Bahan Baku
                  </label>
                  <Controller
                    name={`resep.${index}.bahanBakuID`}
                    control={control}
                    render={({ field: selectField }) => (
                      <BahanBakuCombobox
                        value={selectField.value ?? field.bahanBakuID ?? ""}
                        onChange={selectField.onChange}
                        onSatuanChange={(satuan) =>
                          setValue(
                            `resep.${index}.satuan`,
                            satuan as SatuanResep,
                          )
                        }
                        bahanBakuList={bahanBakuList}
                        isLoading={isLoadingBahanBaku}
                        hasError={!!errors.resep?.[index]?.bahanBakuID}
                      />
                    )}
                  />
                  {errors.resep?.[index]?.bahanBakuID && (
                    <span className="text-[10px] font-bold text-rose-500 mt-1 block">
                      {errors.resep[index]?.bahanBakuID?.message}
                    </span>
                  )}
                </div>

                {/* Jumlah */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="text-xs font-bold text-navy mb-1.5 block sm:hidden">
                    Jumlah
                  </label>
                  <Input
                    type="number"
                    {...register(`resep.${index}.jumlah`, { setValueAs: keAngka })}
                    className={cn(
                      "w-full text-center bg-white border-navy/20 text-navy font-mono font-bold h-10 focus-visible:ring-1 focus-visible:ring-navy [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      errors.resep?.[index]?.jumlah && "border-rose-500",
                    )}
                    placeholder="0"
                    step="any"
                  />
                  {errors.resep?.[index]?.jumlah && (
                    <span className="text-[10px] font-bold text-rose-500 mt-1 block text-center sm:text-left">
                      {errors.resep[index]?.jumlah?.message}
                    </span>
                  )}
                </div>

                {/* Satuan */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="text-xs font-bold text-navy mb-1.5 block sm:hidden">
                    Satuan
                  </label>
                  <Controller
                    name={`resep.${index}.satuan`}
                    control={control}
                    render={({ field: selectField }) => (
                      <Select
                        onValueChange={selectField.onChange}
                        value={selectField.value}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full bg-white border-navy/20 text-navy font-bold h-10 focus:ring-1 focus:ring-navy",
                            errors.resep?.[index]?.satuan &&
                              "border-rose-500",
                          )}
                        >
                          <SelectValue placeholder="Satuan" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-navy/10 text-navy">
                          {satuanResepUntukBahan(
                            bahanBakuList.find((b) => b.id === resepTerisi?.[index]?.bahanBakuID),
                          ).map((sat) => (
                            <SelectItem
                              key={sat}
                              value={sat}
                              className="cursor-pointer hover:bg-navy/5 font-bold"
                            >
                              {sat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.resep?.[index]?.satuan && (
                    <span className="text-[10px] font-bold text-rose-500 mt-1 block">
                      {errors.resep[index]?.satuan?.message}
                    </span>
                  )}
                </div>

                {/* Aksi Hapus */}
                <div className="col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => remove(index)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-10 w-10 p-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
