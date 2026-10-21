import { describe, expect, it } from "vitest";
import { ROLE_TEMPLATES } from "../../../lib/roleTemplates";

const izinTemplate = (id: string): string[] => {
  const template = ROLE_TEMPLATES.find((t) => t.id === id);
  if (!template) throw new Error(`template ${id} tidak ada`);
  return template.permissions;
};

const STOCK_OPNAME = [
  "create-stock-opname",
  "read-stock-opname",
  "submit-stock-opname",
  "review-stock-opname",
];
const ADJUSTMENT_RUANG = ["read-stock-adjustment-outlet", "read-stock-adjustment-gudang"];
const ABSENSI = ["read-absensi", "create-absensi", "update-absensi"];
const TAMBAHAN = [...STOCK_OPNAME, ...ADJUSTMENT_RUANG, ...ABSENSI];

describe("ROLE_TEMPLATES: stock opname, stock adjustment per ruang, dan absensi", () => {
  it.each(["guest", "staff", "kasir"])("%s tidak memegang izin tambahan", (id) => {
    expect(izinTemplate(id).filter((nama) => TAMBAHAN.includes(nama))).toEqual([]);
  });

  it("supervisor membuat, membaca, dan menghitung opname tanpa meninjau, serta hanya memantau absensi", () => {
    const izin = izinTemplate("supervisor");
    expect(izin).toEqual(
      expect.arrayContaining([
        "create-stock-opname",
        "read-stock-opname",
        "submit-stock-opname",
        ...ADJUSTMENT_RUANG,
        "read-absensi",
      ]),
    );
    expect(izin).not.toContain("review-stock-opname");
    expect(izin).not.toContain("create-absensi");
    expect(izin).not.toContain("update-absensi");
  });

  it.each(["manajer", "general-manajer"])(
    "%s memegang seluruh izin stock opname, adjustment per ruang, dan absensi",
    (id) => {
      expect(izinTemplate(id)).toEqual(expect.arrayContaining(TAMBAHAN));
    },
  );

  it.each(ROLE_TEMPLATES)("$id tidak memuat izin kembar", ({ permissions }) => {
    expect(new Set(permissions).size).toBe(permissions.length);
  });
});