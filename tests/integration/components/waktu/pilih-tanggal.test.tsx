import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { PilihTanggal } from "@/components/pilih-tanggal";

beforeAll(() => {
  // Popover Radix mengukur elemen lewat ResizeObserver, yang tidak ada di jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function Pembungkus({ awal, onUbah }: { awal: Date; onUbah?: (t: Date) => void }) {
  const [nilai, setNilai] = useState<Date>(awal);
  return (
    <PilihTanggal
      label="Tanggal Transaksi"
      value={nilai}
      onChange={(t) => {
        setNilai(t);
        onUbah?.(t);
      }}
    />
  );
}

const tombol = () => screen.getByRole("button", { name: /^Tanggal Transaksi, / });

describe("PilihTanggal", () => {
  it("menampilkan tanggal terpilih berformat Indonesia pada tombol bernama label", () => {
    render(<Pembungkus awal={new Date(2026, 8, 28)} />);
    expect(tombol()).toHaveTextContent("28 September 2026");
  });

  it("memilih tanggal dari kalender kostum, memperbarui tombol, dan menutup popover", async () => {
    const user = userEvent.setup();
    const onUbah = vi.fn();
    render(<Pembungkus awal={new Date(2026, 8, 28)} onUbah={onUbah} />);
    await user.click(tombol());
    const kalender = await screen.findByRole("grid");
    await user.click(within(kalender).getByText("15"));
    expect(onUbah).toHaveBeenCalledTimes(1);
    const dipilih: Date = onUbah.mock.calls[0][0];
    expect([dipilih.getFullYear(), dipilih.getMonth(), dipilih.getDate()]).toEqual([2026, 8, 15]);
    expect(tombol()).toHaveTextContent("15 September 2026");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("berpindah ke bulan berikutnya lalu memilih tanggal di bulan itu", async () => {
    const user = userEvent.setup();
    const onUbah = vi.fn();
    render(<Pembungkus awal={new Date(2026, 8, 28)} onUbah={onUbah} />);
    await user.click(tombol());
    await user.click(await screen.findByRole("button", { name: /next month/i }));
    await user.click(within(screen.getByRole("grid")).getByText("1"));
    const dipilih: Date = onUbah.mock.calls[0][0];
    expect([dipilih.getFullYear(), dipilih.getMonth(), dipilih.getDate()]).toEqual([2026, 9, 1]);
  });
});