import type { Diskon } from "@/types/diskon";
import { syaratPemakaian } from "./tampilan";

/**
 * Syarat pemakaian sebuah diskon di bawah namanya, pada pilihan diskon buat
 * penjualan dan buat reservasi (keputusan PD4a). Tidak merender apa pun
 * untuk diskon tanpa syarat.
 */
export function SyaratDiskon({ diskon }: { diskon: Diskon }) {
  const syarat = syaratPemakaian(diskon);
  if (syarat.length === 0) return null;
  return (
    <span className="text-[10px] font-medium text-[#0A2947]/60">{syarat.join(", ")}</span>
  );
}