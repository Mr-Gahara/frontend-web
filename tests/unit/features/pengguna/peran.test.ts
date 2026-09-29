import { describe, expect, it } from "vitest";
import { namaPeran } from "@/features/pengguna/peran";
import type { Role } from "@/types/role";

describe("namaPeran (keputusan AB6 dan JD14a)", () => {
  it("memakai role teks, lalu roleID hasil populate, lalu daftar role, lalu tanda hubung", () => {
    // Data uji hanya memuat field yang dibaca namaPeran.
    const roleList = [{ id: "r2", namaRole: "Kasir" }] as unknown as Role[];
    const objek = { id: "r1", namaRole: "Barista" } as unknown as Role;
    expect(namaPeran({ role: "Owner", roleID: "r2" }, roleList)).toBe("Owner");
    expect(namaPeran({ roleID: objek }, roleList)).toBe("Barista");
    expect(namaPeran({ roleID: "r2" }, roleList)).toBe("Kasir");
    expect(namaPeran({ roleID: "r9" }, roleList)).toBe("-");
  });
});