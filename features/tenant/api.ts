/**
 * Pemanggilan API tenant (profil toko).
 */

import { apiClient } from "@/lib/apiClient";
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { ambilData } from "@/lib/api/normalize";
import type { PerbaruiTenantPayload, Tenant } from "@/types/tenant";
import { jalurLogo } from "./logo";

export const tenantApi = {
  detail: (id: string) => apiData.get<Tenant>(EP.tenant.detail(id)),
  perbarui: (id: string, payload: PerbaruiTenantPayload) =>
    apiData.put<Tenant>(EP.tenant.detail(id), payload),

  /** Multipart, satu berkas di field logo (B203); respons memuat tenant dengan logoUrl baru. */
  unggahLogo: async (id: string, berkas: File) => {
    const data = new FormData();
    data.append("logo", berkas);
    return ambilData<Tenant>(await apiClient.unggah(EP.tenant.logo(id), data, "pengguna"));
  },
  hapusLogo: (id: string) => apiData.delete<Tenant>(EP.tenant.logo(id)),

  /** Berkas logo diambil dengan token, bukan lewat <img src> (B204). */
  logo: async (logoUrl: string) =>
    (await apiClient.unduh(jalurLogo(logoUrl), {}, "logo.webp", "pengguna")).berkas,
};
