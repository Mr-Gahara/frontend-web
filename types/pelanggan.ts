export type TipePelanggan = "umum" | "member" | "korporat";

/**
 * Bentuk respons GET /pelanggan setelah dinormalkan lib/api/client.ts
 * (kontrak/endpoint.md bagian 3.3).
 */
export interface Pelanggan {
  id: string;
  tenantID: string;
  namaPelanggan: string;
  tipePelanggan: TipePelanggan;
  nomorHp?: string | null;
  email?: string | null;
  alamat?: string | null;
  poinLoyalitas: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload POST /pelanggan: isian opsional yang kosong tidak dikirim. */
export interface BuatPelangganPayload {
  namaPelanggan: string;
  tipePelanggan: TipePelanggan;
  nomorHp?: string;
  email?: string;
  alamat?: string;
}

/**
 * Payload PUT /pelanggan/:id: hanya field yang berubah. Teks kosong berarti
 * isian dikosongkan.
 */
export type PerbaruiPelangganPayload = Partial<BuatPelangganPayload>;
