import type { NilaiFormBooking } from "./schema";
import type { SesiBookingBatchPayload } from "@/types/sesiBooking";

/**
 * Payload POST /sesibooking jalur batch, berbentuk sama dengan halaman lama:
 * diskon global dan diskon item hanya dikirim bila ada yang dipilih.
 */
export function susunPayloadBooking(nilai: NilaiFormBooking, diskonGlobal: string[]): SesiBookingBatchPayload {
  return {
    dataPelanggan: nilai.dataPelanggan,
    diskonGlobal: diskonGlobal.length > 0 ? diskonGlobal : undefined,
    items: nilai.items.map((item) => ({
      dataAset: item.dataAset,
      waktuMulai: new Date(item.waktuMulai).toISOString(),
      waktuSelesai: new Date(item.waktuSelesai).toISOString(),
      diskonItem: item.diskonItem.length > 0 ? item.diskonItem : undefined,
    })),
  };
}