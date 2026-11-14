import type { Diskon } from "@/types/diskon";

/**
 * Pilihan diskon yang mengikuti aturan "bisa digabung": memilih yang sudah
 * terpilih melepasnya; diskon yang tidak bisa digabung menggantikan seluruh
 * pilihan; dan bila pilihan sekarang memuat diskon yang tidak bisa
 * digabung, diskon baru menggantikannya. Dipakai diskon global dan diskon
 * per item buat penjualan (dipisah dari halaman 14 November 2026).
 */
export function toggleDiskonSelection(
  currentIds: string[],
  newId: string,
  availableList: Diskon[],
): string[] {
  const target = availableList.find((d) => (d.id) === newId);
  if (!target) return currentIds;

  // Toggle (Unselect)
  if (currentIds.includes(newId))
    return currentIds.filter((id) => id !== newId);

  // Jika diskon baru BUKAN tipe yang bisa digabung, reset seluruhnya ke dia saja
  if (!target.bisaDigabung) return [newId];

  // Cek apakah diskon yang *sudah terpilih* ada yang tidak bisa digabung
  const currentSelected = availableList.filter((d) =>
    currentIds.includes(d.id),
  );
  const hasNonGabung = currentSelected.some((d) => !d.bisaDigabung);
  if (hasNonGabung) return [newId]; // Paksa ganti

  return [...currentIds, newId];
};
