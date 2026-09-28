import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { InputWaktu } from "@/components/input-waktu";
import type { NilaiWaktu } from "@/lib/waktu";

function Pembungkus({ awal }: { awal: NilaiWaktu }) {
  const [nilai, setNilai] = useState(awal);
  return <InputWaktu label="Jam Transaksi" value={nilai} onChange={setNilai} />;
}

const isianJam = () => screen.getByRole("textbox", { name: "Jam Transaksi (jam)" });
const isianMenit = () => screen.getByRole("textbox", { name: "Jam Transaksi (menit)" });

describe("InputWaktu", () => {
  it("memberi nama aksesibel pada grup dan kedua isiannya, dengan papan angka di ponsel", () => {
    render(<Pembungkus awal={{ jam: "14", menit: "05" }} />);
    expect(screen.getByRole("group", { name: "Jam Transaksi" })).toBeInTheDocument();
    expect(isianJam()).toHaveValue("14");
    expect(isianMenit()).toHaveValue("05");
    expect(isianJam()).toHaveAttribute("inputmode", "numeric");
  });

  it("menolak ketikan yang melebihi batas dan mempertahankan nilai sah terakhir (K-TW4a)", async () => {
    const user = userEvent.setup();
    render(<Pembungkus awal={{ jam: "", menit: "" }} />);
    await user.type(isianJam(), "99");
    expect(isianJam()).toHaveValue("9");
    await user.type(isianMenit(), "60");
    expect(isianMenit()).toHaveValue("6");
  });

  it("membuang huruf dan tanda", async () => {
    const user = userEvent.setup();
    render(<Pembungkus awal={{ jam: "", menit: "" }} />);
    await user.type(isianJam(), "a1b");
    expect(isianJam()).toHaveValue("1");
  });

  it("memberi nol di depan saat fokus lepas", async () => {
    const user = userEvent.setup();
    render(<Pembungkus awal={{ jam: "", menit: "" }} />);
    await user.type(isianJam(), "7");
    await user.tab();
    expect(isianJam()).toHaveValue("07");
  });

  it("membiarkan isian yang dikosongkan tetap kosong setelah fokus lepas (K-TW5a)", async () => {
    const user = userEvent.setup();
    render(<Pembungkus awal={{ jam: "14", menit: "05" }} />);
    await user.clear(isianJam());
    await user.tab();
    expect(isianJam()).toHaveValue("");
  });
});