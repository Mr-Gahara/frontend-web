import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Tujuh token ukuran huruf (keputusan rancangan butir 34) didaftarkan agar
 * tailwind-merge tidak menganggapnya warna teks: tanpa ini `text-isi` di
 * varian Button terbuang begitu halaman memberi `text-gading`, dan tombol
 * tampil 16 px (pemilik proyek, 19 November 2026).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["tampilan", "judul", "subjudul", "besar", "isi", "kecil", "mikro"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
