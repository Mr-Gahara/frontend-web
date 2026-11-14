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

describe("DataTable, kartu HP dan tabel rincian", () => {
  type Item = { nama: string; jumlah: number };
  const kolomItem: ColumnDef<Item>[] = [
    { accessorKey: "nama", header: "Nama" },
    {
      accessorKey: "jumlah",
      header: () => <div className="text-right">Jumlah</div>,
      meta: { label: "Jumlah", lebarBungkus: 120 },
    },
    { id: "tanpaLabel", header: () => <span>Ikon</span>, cell: () => "x" },
  ];
  const items: Item[] = Array.from({ length: 15 }, (_, i) => ({ nama: `Item ${i + 1}`, jumlah: i }));

  it("label kartu HP dari header teks dan meta.label, tidak untuk header komponen tanpa meta", () => {
    render(<DataTable columns={kolomItem} data={items.slice(0, 1)} />);
    const sel = within(barisTubuh()[0]).getAllByRole("cell");
    expect(sel[0].querySelector("span.sm\\:hidden")).toHaveTextContent("Nama");
    expect(sel[1].querySelector("span.sm\\:hidden")).toHaveTextContent("Jumlah");
    expect(sel[2].querySelector("span.sm\\:hidden")).toBeNull();
  });

  it("meta.lebarBungkus memasang lebar maksimum dan kelas bungkus pada selnya saja", () => {
    render(<DataTable columns={kolomItem} data={items.slice(0, 1)} />);
    const sel = within(barisTubuh()[0]).getAllByRole("cell");
    expect(sel[1].style.getPropertyValue("--lebar-bungkus")).toBe("120px");
    expect(sel[1].className).toContain("sm:whitespace-normal");
    expect(sel[0].style.getPropertyValue("--lebar-bungkus")).toBe("");
  });

  it("rincian: seluruh baris tampil tanpa kaki tabel", () => {
    render(<DataTable columns={kolomItem} data={items} rincian />);
    expect(barisTubuh()).toHaveLength(15);
    expect(screen.queryByText("15 total data")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });
});
