/**
 * Warna token untuk tempat yang memerlukan nilai warna di JavaScript
 * (atribut style, recharts), merujuk variabel di app/globals.css
 * (keputusan rancangan butir 25; CV21a). Kelas Tailwind tetap memakai
 * bg-navy, text-sage, dan seterusnya.
 */
export const WARNA = {
  navy: "var(--navy)",
  navyTerang: "var(--navy-terang)",
  gading: "var(--gading)",
  krem: "var(--krem)",
  karamel: "var(--karamel)",
  sage: "var(--sage)",
  sageTerang: "var(--sage-terang)",
  roseTerang: "var(--rose-terang)",
  roseLama: "var(--rose-lama)",
} as const;

/**
 * Warna dengan alfa, setara dengan akhiran heksadesimal dua digit yang
 * dulu disambung ke kode warna (`${navy}66` = alfa 0x66 = 40%).
 */
export function denganAlfa(warna: string, alfaHeksa: string): string {
  const persen = Math.round((parseInt(alfaHeksa, 16) / 255) * 10000) / 100;
  return `color-mix(in srgb, ${warna} ${persen}%, transparent)`;
}
