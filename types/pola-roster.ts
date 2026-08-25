import { MasterShiftItem } from "./jadwal";

export interface DetailSiklusItem {
  hariKe: number;
  isLibur: boolean;
  shiftID?: string; // Tanda "?" memastikan ini bisa undefined jika libur
  shift?: MasterShiftItem; 
}

export interface PolaRosterItem {
  id: string;
  _id?: string;
  namaPola: string;
  siklusHari: number;
  status?: "Aktif" | "Non-Aktif";
  detailSiklus: DetailSiklusItem[];
}

export interface PolaRosterRequest {
  namaPola: string;
  siklusHari: number;
  detailSiklus: DetailSiklusItem[];
}