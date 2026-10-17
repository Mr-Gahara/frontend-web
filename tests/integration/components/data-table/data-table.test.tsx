import { beforeAll, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

beforeAll(() => {
  // Select Radix memakai ResizeObserver, pointer capture, dan scrollIntoView, yang tidak ada di jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

type Baris = { nama: string };
const kolom: ColumnDef<Baris>[] = [{ accessorKey: "nama", header: "Nama" }];
const data: Baris[] = Array.from({ length: 45 }, (_, i) => ({ nama: `Baris ${i + 1}` }));

/** Baris tubuh tabel: rowgroup kedua, setelah kepala kolom. */
const barisTubuh = () => within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row");
const pemilih = () => screen.queryByRole("combobox", { name: "Jumlah baris per halaman" });

describe("DataTable, paginasi klien", () => {
  it("tanpa pilihanUkuranKlien: tetap 10 baris tanpa pemilih ukuran", () => {
    render(<DataTable columns={kolom} data={data} />);
    expect(pemilih()).not.toBeInTheDocument();
    expect(barisTubuh()).toHaveLength(10);
    expect(screen.getByText("45 total data")).toBeInTheDocument();
    expect(screen.getByText("Halaman 1 dari 5")).toBeInTheDocument();
  });

  it("dengan pilihanUkuranKlien: ukuran awal dari nilai pertama, lalu memilih 20 menampilkan 20 baris", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={kolom} data={data} pilihanUkuranKlien={[10, 20, 50]} />);
    expect(pemilih()).toHaveTextContent("10");
    expect(barisTubuh()).toHaveLength(10);

    await user.click(pemilih()!);
    await user.click(await screen.findByRole("option", { name: "20" }));

    expect(pemilih()).toHaveTextContent("20");
    expect(barisTubuh()).toHaveLength(20);
    expect(screen.getByText("45 total data")).toBeInTheDocument();
    expect(screen.getByText("Halaman 1 dari 3")).toBeInTheDocument();
  });

  it("mengganti ukuran dari halaman 2 kembali ke halaman 1", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={kolom} data={data} pilihanUkuranKlien={[10, 20, 50]} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Halaman 2 dari 5")).toBeInTheDocument();
    expect(barisTubuh()[0]).toHaveTextContent("Baris 11");

    await user.click(pemilih()!);
    await user.click(await screen.findByRole("option", { name: "50" }));

    expect(screen.getByText("Halaman 1 dari 1")).toBeInTheDocument();
    expect(barisTubuh()).toHaveLength(45);
    expect(barisTubuh()[0]).toHaveTextContent("Baris 1");
  });
});
