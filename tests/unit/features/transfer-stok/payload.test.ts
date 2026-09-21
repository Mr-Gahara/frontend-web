import { describe, expect, it } from "vitest";
import {
  PESAN_JUMLAH_NOL,
  PESAN_TANPA_MASTER,
  SERVER_TERIMA_JUMLAH_NOL,
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

  it("menahan jumlah diterima 0 selama server menghitungnya sebagai diterima penuh", () => {
    expect(SERVER_TERIMA_JUMLAH_NOL).toBe(false);
    const hasil = susunPayloadTerima([item("a", 10)], [{ qtyTerima: 0, catatanItem: "hilang" }]);
    expect(hasil).toEqual({ ok: false, pesan: PESAN_JUMLAH_NOL });
  });

  it("mengirim jumlah 0 apa adanya setelah server diperbaiki", () => {
    const hasil = susunPayloadTerima([item("a", 10)], [{ qtyTerima: 0, catatanItem: "hilang" }], true);
    expect(hasil).toEqual({
      ok: true,
      payload: { items: [{ bahanBakuID: "a", qtyKirim: 10, qtyTerima: 0, catatanItem: "hilang" }] },
    });
  });
});