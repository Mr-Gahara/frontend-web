/**
 * Pemanggilan API tenant (profil toko).
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { PerbaruiTenantPayload, Tenant } from "@/types/tenant";

export const tenantApi = {
  detail: (id: string) => apiData.get<Tenant>(EP.tenant.detail(id)),
  perbarui: (id: string, payload: PerbaruiTenantPayload) =>
    apiData.put<Tenant>(EP.tenant.detail(id), payload),
};