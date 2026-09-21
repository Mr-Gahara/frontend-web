import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { JurnalStok } from "@/types/jurnalStok";

export interface FilterJurnalStok {
  locationID?: string;
}

export const jurnalStokApi = {
  daftar: (filter: FilterJurnalStok) =>
    apiData.get<JurnalStok[]>(
      EP.jurnalStok,
      filter.locationID ? { locationID: filter.locationID } : {},
    ),
};
