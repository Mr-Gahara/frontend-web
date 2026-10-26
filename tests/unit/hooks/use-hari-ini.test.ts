import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHariIni, useTanggalHariIni } from "@/hooks/use-hari-ini";
import { msSampaiTengahMalam } from "@/lib/waktu";

const SEHARI = 24 * 60 * 60 * 1000;

describe("msSampaiTengahMalam", () => {
  it("menghitung sisa waktu sampai 00.00 lokal berikutnya, ditambah jeda kecil", () => {
    expect(msSampaiTengahMalam(new Date(2026, 9, 25, 23, 59, 30))).toBe(30_000 + 50);
    expect(msSampaiTengahMalam(new Date(2026, 9, 26, 0, 0, 0))).toBe(SEHARI + 50);
  });

  it("melewati akhir bulan dan akhir tahun", () => {
    expect(msSampaiTengahMalam(new Date(2026, 9, 31, 23, 0))).toBe(60 * 60 * 1000 + 50);
    expect(msSampaiTengahMalam(new Date(2026, 11, 31, 23, 59))).toBe(60_000 + 50);
  });
});

describe("useHariIni", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("berganti tepat setelah 00.00 tanpa muat ulang", () => {
    vi.setSystemTime(new Date(2026, 9, 25, 23, 59, 30));
    const { result } = renderHook(() => useHariIni());
    expect(result.current).toBe("2026-10-25");
    act(() => {
      vi.advanceTimersByTime(29_000);
    });
    expect(result.current).toBe("2026-10-25");
    act(() => {
      vi.advanceTimersByTime(1_100);
    });
    expect(result.current).toBe("2026-10-26");
  });

  it("terus berganti di hari-hari berikutnya", () => {
    vi.setSystemTime(new Date(2026, 9, 25, 23, 59, 59));
    const { result } = renderHook(() => useHariIni());
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current).toBe("2026-10-26");
    act(() => {
      vi.advanceTimersByTime(SEHARI);
    });
    expect(result.current).toBe("2026-10-27");
  });

  it("diperbarui saat tab kembali terlihat, bila timer tertunda perangkat tidur", () => {
    vi.setSystemTime(new Date(2026, 9, 25, 22, 0));
    const { result } = renderHook(() => useHariIni());
    vi.setSystemTime(new Date(2026, 9, 26, 6, 0));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toBe("2026-10-26");
  });

  it("melepas timer saat dilepas", () => {
    vi.setSystemTime(new Date(2026, 9, 25, 12, 0));
    const { unmount } = renderHook(() => useHariIni());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("useTanggalHariIni: Date pukul 00.00 yang sama sepanjang hari, lalu berganti setelah tengah malam", () => {
    vi.setSystemTime(new Date(2026, 9, 25, 23, 59, 0));
    const { result } = renderHook(() => useTanggalHariIni());
    const awal = result.current;
    expect(awal).toEqual(new Date(2026, 9, 25));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current, "objek yang sama selama hari belum berganti").toBe(awal);
    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(result.current).toEqual(new Date(2026, 9, 26));
  });
});