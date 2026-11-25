import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import type { Pemberitahuan } from "@/features/notifikasi/jenis";

// Delapan pemberitahuan contoh: satu penting, tiga perlu tindakan, empat info.
const DAFTAR: Pemberitahuan[] = [
  ...["p1"].map((id) => ({ id, tingkat: "penting" as const })),
  ...["t1", "t2", "t3"].map((id) => ({ id, tingkat: "tindakan" as const })),
  ...["i1", "i2", "i3", "i4"].map((id) => ({ id, tingkat: "info" as const })),
].map((p) => ({ ...p, judul: `Judul ${p.id}`, isi: `Isi ${p.id}`, tautan: [] }));

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/outlet/pelanggan" }));
vi.mock("@/lib/auth/useSession", () => ({ useSession: () => ({ pengguna: { id: "u1" } }) }));
vi.mock("@/features/notifikasi/hooks", () => ({ usePemberitahuan: () => ({ daftar: DAFTAR, segarkan: vi.fn() }) }));

const { LoncengPemberitahuan } = await import("@/features/notifikasi/lonceng-pemberitahuan");

describe("Integration - LoncengPemberitahuan (LN19a)", () => {
  it("lima kartu teratas, Lihat semua membentangkan sisanya, dan panel yang dibuka ulang kembali ringkas", async () => {
    const user = userEvent.setup();
    render(<LoncengPemberitahuan />);
    const lonceng = screen.getByRole("button", { name: "Pemberitahuan, 8 baru" });

    await user.click(lonceng);
    let panel = screen.getByRole("dialog", { name: "Pemberitahuan" });
    expect(within(panel).getAllByRole("article").map((a) => a.getAttribute("data-pemberitahuan"))).toEqual([
      "p1", "t1", "t2", "t3", "i1",
    ]);

    await user.click(within(panel).getByRole("button", { name: "Lihat semua (3 lainnya)" }));
    expect(within(panel).getAllByRole("article")).toHaveLength(8);
    expect(within(panel).queryByRole("button", { name: /^Lihat semua/ })).toBeNull();

    await user.keyboard("{Escape}");
    await user.click(lonceng);
    panel = screen.getByRole("dialog", { name: "Pemberitahuan" });
    expect(within(panel).getAllByRole("article")).toHaveLength(5);
  });
});
