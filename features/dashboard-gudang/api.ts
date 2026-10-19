import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { RingkasanDashboardGudang } from "@/types/dashboardGudang";

export const dashboardGudangApi = {
  ringkasan: () => apiData.get<RingkasanDashboardGudang>(EP.dashboardGudang),
};