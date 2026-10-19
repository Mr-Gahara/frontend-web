/**
 * Respons GET /dashboard/gudang setelah dinormalkan lib/api/client.ts
 * (dashboardGudangService.getSummary).
 *
 * Web hanya membaca `transfer`, yang filternya sama dengan tab DRAFT SJ dan
 * halaman pengiriman. Tiga bagian lain sengaja tidak dipakai:
 * - pengajuan.siapDibuatSuratJalan ikut menghitung pengajuan yang sudah punya
 *   surat jalan; kartu pengajuan dihitung dari daftar
 *   (features/dashboard-gudang/ringkasan.ts);
 * - inventory.stokKritis dihitung se-tenant, termasuk lokasi outlet;
 * - jurnalTerbaru mencampur jurnal semua lokasi (kontrak/temuan.md butir 74).
 */
export interface RingkasanDashboardGudang {
  pengajuan: { menungguApproval: number; siapDibuatSuratJalan: number };
  transfer: { suratJalanPending: number; sedangDikirim: number };
  inventory: { stokKritis: number };
  jurnalTerbaru: unknown[];
}