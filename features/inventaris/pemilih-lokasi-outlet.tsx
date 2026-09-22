"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lokasi } from "@/types/location";
import { SEMUA_OUTLET } from "./cakupan";

interface Props {
  lokasiOutlet: Lokasi[];
  nilai: string;
  onUbah: (nilai: string) => void;
}

/** Pemilih lokasi bagi pemegang izin lintas outlet: seluruh outlet atau satu outlet. */
export default function PemilihLokasiOutlet({ lokasiOutlet, nilai, onUbah }: Props) {
  return (
    <div className="space-y-1.5 w-full sm:w-64">
      <label htmlFor="pemilih-lokasi-outlet" className="text-xs font-bold text-[#0A2947]">
        Filter Lokasi
      </label>
      <Select value={nilai} onValueChange={onUbah}>
        <SelectTrigger
          id="pemilih-lokasi-outlet"
          className="cursor-pointer w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold"
        >
          <SelectValue placeholder="Semua Outlet" />
        </SelectTrigger>
        <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
          <SelectItem value={SEMUA_OUTLET} className="cursor-pointer font-bold">
            Semua Outlet
          </SelectItem>
          {lokasiOutlet.map((lokasi) => (
            <SelectItem key={lokasi.id} value={lokasi.id} className="cursor-pointer font-bold">
              {lokasi.nama}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}