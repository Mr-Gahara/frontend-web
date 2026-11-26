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
    expect(sel[0].querySelector("span.tabel\\:hidden")).toHaveTextContent("Nama");
    expect(sel[1].querySelector("span.tabel\\:hidden")).toHaveTextContent("Jumlah");
    expect(sel[2].querySelector("span.tabel\\:hidden")).toBeNull();
  });

  it("meta.lebarBungkus memasang lebar maksimum dan kelas bungkus pada selnya saja", () => {
    render(<DataTable columns={kolomItem} data={items.slice(0, 1)} />);
    const sel = within(barisTubuh()[0]).getAllByRole("cell");
    expect(sel[1].style.getPropertyValue("--lebar-bungkus")).toBe("120px");
    expect(sel[1].className).toContain("tabel:whitespace-normal");
    expect(sel[0].style.getPropertyValue("--lebar-bungkus")).toBe("");
  });

  it("rincian: seluruh baris tampil tanpa kaki tabel", () => {
    render(<DataTable columns={kolomItem} data={items} rincian />);
    expect(barisTubuh()).toHaveLength(15);
    expect(screen.queryByText("15 total data")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });
});

describe("DataTable, teks kaki dan tombol halaman", () => {
  const sebelumnya = () => screen.getByRole("button", { name: "Previous" });
  const berikutnya = () => screen.getByRole("button", { name: "Next" });

  it("klien: Previous mati di halaman pertama, Next mati di halaman terakhir, dan keduanya berpindah satu halaman", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={kolom} data={data} />);
    expect(sebelumnya()).toBeDisabled();
    expect(berikutnya()).toBeEnabled();

    for (let i = 0; i < 4; i++) await user.click(berikutnya());
    expect(screen.getByText("Halaman 5 dari 5")).toBeInTheDocument();
    expect(barisTubuh()).toHaveLength(5);
    expect(barisTubuh()[0]).toHaveTextContent("Baris 41");
    expect(berikutnya()).toBeDisabled();
    expect(sebelumnya()).toBeEnabled();

    await user.click(sebelumnya());
    expect(screen.getByText("Halaman 4 dari 5")).toBeInTheDocument();
    expect(barisTubuh()[0]).toHaveTextContent("Baris 31");
  });

  it("tanpa data: 0 total data, Halaman 1 dari 1, kedua tombol mati, dan pesan kosong dari pemakai", () => {
    render(<DataTable columns={kolom} data={[]} emptyMessage="Belum ada pajak." />);
    expect(screen.getByText("0 total data")).toBeInTheDocument();
    expect(screen.getByText("Halaman 1 dari 1")).toBeInTheDocument();
    expect(screen.getByText("Belum ada pajak.")).toBeInTheDocument();
    expect(sebelumnya()).toBeDisabled();
    expect(berikutnya()).toBeDisabled();
  });

  it("memuat: teks Memuat data... menggantikan baris dan pesan kosong", () => {
    render(<DataTable columns={kolom} data={[]} loading emptyMessage="Belum ada pajak." />);
    expect(screen.getByText("Memuat data...")).toBeInTheDocument();
    expect(screen.queryByText("Belum ada pajak.")).not.toBeInTheDocument();
  });

  it("pencarian: total data dan jumlah halaman mengikuti baris yang tersaring", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={kolom} data={data} searchKey="nama" searchPlaceholder="Cari nama..." />);
    await user.type(screen.getByRole("searchbox", { name: "Cari nama" }), "Baris 1");
    // Baris 1, 10 sampai 19: sebelas baris.
    expect(screen.getByText("11 total data")).toBeInTheDocument();
    expect(screen.getByText("Halaman 1 dari 2")).toBeInTheDocument();
  });

  it("server: angka kaki dari pemakai, baris tidak dipotong, dan tombol meminta halaman sebelah", async () => {
    const user = userEvent.setup();
    const diminta: number[] = [];
    render(
      <DataTable
        columns={kolom}
        data={data.slice(0, 20)}
        paginasiServer={{ halaman: 2, jumlahHalaman: 3, total: 45, ukuran: 20, onGantiHalaman: (h) => diminta.push(h) }}
      />,
    );
    expect(screen.getByText("45 total data")).toBeInTheDocument();
    expect(screen.getByText("Halaman 2 dari 3")).toBeInTheDocument();
    expect(barisTubuh()).toHaveLength(20);

    await user.click(sebelumnya());
    await user.click(berikutnya());
    expect(diminta).toEqual([1, 3]);
  });

  it("server: kedua tombol mati selama sibuk, dan jumlah halaman 0 tampil sebagai 1", () => {
    const { rerender } = render(
      <DataTable
        columns={kolom}
        data={data.slice(0, 10)}
        paginasiServer={{ halaman: 2, jumlahHalaman: 3, total: 45, ukuran: 10, sibuk: true, onGantiHalaman: () => {} }}
      />,
    );
    expect(sebelumnya()).toBeDisabled();
    expect(berikutnya()).toBeDisabled();

    rerender(
      <DataTable
        columns={kolom}
        data={[]}
        paginasiServer={{ halaman: 1, jumlahHalaman: 0, total: 0, ukuran: 10, onGantiHalaman: () => {} }}
      />,
    );
    expect(screen.getByText("Halaman 1 dari 1")).toBeInTheDocument();
    expect(sebelumnya()).toBeDisabled();
    expect(berikutnya()).toBeDisabled();
  });
});
