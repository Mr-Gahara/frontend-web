import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  apiClient: { post: vi.fn(async () => ({ data: { id: "1" } })) },
}));

import { apiClient } from "@/lib/apiClient";
import { apiData } from "@/lib/api/client";

describe("apiData.post", () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear();
  });

  it("meneruskan header tambahan ke apiClient.post", async () => {
    await apiData.post("/penjualan", { a: 1 }, undefined, {
      headers: { "x-idempotency-key": "k1" },
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      "/penjualan",
      { a: 1 },
      { headers: { "x-idempotency-key": "k1" } },
      "pengguna",
    );
  });

  it("tanpa opsi tetap memanggil apiClient.post seperti sebelumnya", async () => {
    await apiData.post("/penjualan", { a: 1 });
    expect(apiClient.post).toHaveBeenCalledWith("/penjualan", { a: 1 }, undefined, "pengguna");
  });
});