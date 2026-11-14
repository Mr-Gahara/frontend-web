import { describe, expect, it } from "vitest";
import { denganAlfa, WARNA } from "@/lib/warna";

describe("denganAlfa", () => {
  it("akhiran heksadesimal menjadi persen color-mix", () => {
    expect(denganAlfa(WARNA.navy, "66")).toBe("color-mix(in srgb, var(--navy) 40%, transparent)");
    expect(denganAlfa(WARNA.navy, "99")).toBe("color-mix(in srgb, var(--navy) 60%, transparent)");
    expect(denganAlfa(WARNA.navy, "15")).toBe("color-mix(in srgb, var(--navy) 8.24%, transparent)");
  });
});
