import { describe, expect, it } from "vitest";
import {
  PESAN_TANPA_MASTER,
  susunPayloadTerima,
} from "@/features/transfer-stok/payload";
import type { TransferItem } from "@/types/transferStok";

const item = (id: string | null, qtyKirim: number): TransferItem => ({
  bahanBaku: id ? { id, namaBahan: "Bahan " + id, satuan: "gram" } : null,
  qtyKirim,
  qtyTerima: 0,
  selisih: -qtyKirim,
  catatanItem: null,
});

describe("susunPayloadTerima", () => {
  it("membawa seluruh item surat jalan dengan bahanBakuID dan qtyKirim dari server", () => {
    const hasil = susunPayloadTerima(
      [item("a", 200), item("b", 50)],
      [
        { qtyTerima: 200, catatanItem: "" },
        { qtyTerima: 40, catatanItem: "  2 pcs pecah " },
      ],
    );
    expect(hasil).toEqual({
      ok: true,
      payload: {
        items: [
          { bahanBakuID: "a", qtyKirim: 200, qtyTerima: 200, catatanItem: null },
          { bahanBakuID: "b", qtyKirim: 50, qtyTerima: 40, catatanItem: "2 pcs pecah" },
        ],
      },
    });
  });

  it("tidak mengirim status maupun tanggal terima, keduanya diisi atau diabaikan server", () => {
    const hasil = susunPayloadTerima([item("a", 10)], [{ qtyTerima: 10, catatanItem: "" }]);
    expect(hasil.ok && Object.keys(hasil.payload)).toEqual(["items"]);
  });

  it("menahan penerimaan bila ada item tanpa master bahan baku", () => {
    const hasil = susunPayloadTerima(
      [item("a", 10), item(null, 5)],
      [
        { qtyTerima: 10, catatanItem: "" },
        { qtyTerima: 5, catatanItem: "" },
      ],
    );
    expect(hasil).toEqual({ ok: false, pesan: PESAN_TANPA_MASTER });
  });

  it("memakai itemId dari surat jalan bila ada, tanpa bahanBakuID (backend 465b438)", () => {
    const hasil = susunPayloadTerima([{ ...item("a", 10), id: "i1" }], [{ qtyTerima: 8, catatanItem: "2 sobek" }]);
    expect(hasil).toEqual({
      ok: true,
      payload: { items: [{ itemId: "i1", qtyKirim: 10, qtyTerima: 8, catatanItem: "2 sobek" }] },
    });
  });

  it("barang tanpa master bahan baku tetap dapat dikonfirmasi lewat itemId", () => {
    const hasil = susunPayloadTerima([{ ...item(null, 5), id: "i2" }], [{ qtyTerima: 5, catatanItem: "" }]);
    expect(hasil).toEqual({
      ok: true,
      payload: { items: [{ itemId: "i2", qtyKirim: 5, qtyTerima: 5, catatanItem: null }] },
    });
  });

  it("mengirim jumlah 0 apa adanya: barang tidak sampai (backend 465b438)", () => {
    const hasil = susunPayloadTerima([item("a", 10)], [{ qtyTerima: 0, catatanItem: "hilang" }]);
    expect(hasil).toEqual({
      ok: true,
      payload: { items: [{ bahanBakuID: "a", qtyKirim: 10, qtyTerima: 0, catatanItem: "hilang" }] },
    });
  });
});