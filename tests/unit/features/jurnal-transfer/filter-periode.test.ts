import { describe, expect, it } from "vitest";
import { FILTER_AWAL_TRANSFER, filterServerTransfer } from "@/features/jurnal-transfer/payload";

describe("filter periode riwayat transfer (NZ3a)", () => {
  it("periode dikirim sebagai tanggal lokal YYYY-MM-DD, hanya bila diisi", () => {
    expect(
      filterServerTransfer({
        akunKasID: "",
        status: "",
        dari: new Date(2026, 9, 1),
        sampai: new Date(2026, 9, 7, 23, 30),
      }),
    ).toEqual({ dari: "2026-10-01", sampai: "2026-10-07" });
    expect(filterServerTransfer({ akunKasID: "", status: "", dari: new Date(2026, 0, 5) })).toEqual({
      dari: "2026-01-05",
    });
    expect(filterServerTransfer(FILTER_AWAL_TRANSFER)).toEqual({});
  });
});