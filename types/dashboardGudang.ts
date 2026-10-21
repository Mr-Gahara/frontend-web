/**
 * Respons GET /dashboard/gudang setelah dinormalkan lib/api/client.ts
 * (dashboardGudangService.getSummary).
 *
 * Web membaca `transfer`, yang filternya sama dengan tab DRAFT SJ dan halaman
 * pengiriman, serta `pengajuan`, yang sejak B101 sama dengan tab PERLU
 * TINJAUAN dan PERLU SURAT JALAN (features/dashboard-gudang/ringkasan.ts).
 * Dua bagian lain sengaja tidak dipakai:
 * - inventory.stokKritis dihitung se-tenant, termasuk lokasi outlet;
 * - jurnalTerbaru mencampur jurnal semua lokasi (kontrak/temuan.md butir 74).
 */
export interface RingkasanDashboardGudang {
  pengajuan: { menungguApproval: number; siapDibuatSuratJalan: number };
  transfer: { suratJalanPending: number; sedangDikirim: number };
  inventory: { stokKritis: number };
  jurnalTerbaru: unknown[];
}