import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJamBerjalan } from "@/hooks/use-jam-berjalan";

describe("useJamBerjalan", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("diperbarui setiap selang, termasuk melewati tengah malam", () => {
    vi.setSystemTime(new Date(2026, 9, 25, 23, 59, 40));
    const { result } = renderHook(() => useJamBerjalan(30_000));
    expect(result.current).toEqual(new Date(2026, 9, 25, 23, 59, 40));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current).toEqual(new Date(2026, 9, 26, 0, 0, 10));
  });

  it("diperbarui saat tab kembali terlihat", () => {
    vi.setSystemTime(new Date(2026, 9, 25, 22, 0));
    const { result } = renderHook(() => useJamBerjalan(30_000));
    vi.setSystemTime(new Date(2026, 9, 26, 6, 0));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toEqual(new Date(2026, 9, 26, 6, 0));
  });

  it("melepas timer saat dilepas", () => {
    const { unmount } = renderHook(() => useJamBerjalan(30_000));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});