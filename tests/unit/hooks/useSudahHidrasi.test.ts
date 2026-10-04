import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useSudahHidrasi } from "@/hooks/use-sudah-hidrasi";

function Penanda() {
  return createElement("span", null, useSudahHidrasi() ? "klien" : "server");
}

describe("useSudahHidrasi", () => {
  it("bernilai true setelah terpasang di browser", () => {
    const { result } = renderHook(() => useSudahHidrasi());
    expect(result.current).toBe(true);
  });

  it("bernilai false saat render server", () => {
    expect(renderToString(createElement(Penanda))).toContain("server");
  });
});