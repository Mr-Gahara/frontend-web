import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Topbar from "@/components/topbar";

vi.mock("@/components/ui/sidebar", () => ({ SidebarTrigger: () => null }));

const OPSI = { weekday: "long", day: "numeric", month: "long", year: "numeric" } as const;
const teks = (d: Date) => d.toLocaleDateString("id-ID", OPSI);

describe("Topbar (keputusan rancangan butir 28)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("tanggal berganti sendiri setelah 00.00 tanpa muat ulang", () => {
    vi.setSystemTime(new Date(2026, 9, 31, 23, 59, 30));
    render(<Topbar />);
    expect(screen.getByText(teks(new Date(2026, 9, 31)))).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(screen.getByText(teks(new Date(2026, 10, 1)))).toBeTruthy();
    expect(screen.queryByText(teks(new Date(2026, 9, 31)))).toBeNull();
  });
});
