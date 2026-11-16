import { render, screen, within } from "@testing-library/react";
import { BadgeCheck, ShieldCheck, Truck } from "lucide-react";
import { describe, expect, it } from "vitest";

import { resolveUspIcon, USP_FALLBACK_ICON } from "./usp-icon";
import { UspStrip } from "./usp-strip";
import { DEMO_USPS } from "./usp-strip.demo";

describe("resolveUspIcon", () => {
  it("знаходить іконку за назвою lucide в будь-якому записі", () => {
    expect(resolveUspIcon("truck")).toBe(Truck);
    expect(resolveUspIcon("shield-check")).toBe(ShieldCheck);
    expect(resolveUspIcon("ShieldCheck")).toBe(ShieldCheck);
    expect(resolveUspIcon(" shield_check ")).toBe(ShieldCheck);
  });

  it("для невідомої або порожньої назви повертає запасну іконку", () => {
    expect(USP_FALLBACK_ICON).toBe(BadgeCheck);
    expect(resolveUspIcon("rocket")).toBe(USP_FALLBACK_ICON);
    expect(resolveUspIcon("")).toBe(USP_FALLBACK_ICON);
    expect(resolveUspIcon(null)).toBe(USP_FALLBACK_ICON);
    // Назви властивостей Object.prototype не повинні ламати пошук.
    expect(resolveUspIcon("constructor")).toBe(USP_FALLBACK_ICON);
    expect(resolveUspIcon("toString")).toBe(USP_FALLBACK_ICON);
  });
});

describe("UspStrip", () => {
  it("показує всі переваги з іконкою, заголовком і підписом", () => {
    render(<UspStrip usps={DEMO_USPS} />);
    const section = screen.getByRole("region", { name: "Чому купують у «Саді»" });
    const items = within(section).getAllByRole("listitem");

    expect(items).toHaveLength(5);
    for (const [index, usp] of DEMO_USPS.entries()) {
      const item = items[index] as HTMLElement;
      expect(within(item).getByRole("heading", { level: 3, name: usp.title })).toBeInTheDocument();
      expect(within(item).getByText(usp.caption)).toBeInTheDocument();
      expect(item.querySelector("svg")).not.toBeNull();
    }
  });

  it("з невідомою назвою іконки рендерить запасну, а не падає", () => {
    const { container: fallback } = render(<USP_FALLBACK_ICON />);
    const fallbackPaths = fallback.querySelector("svg")?.innerHTML;

    render(<UspStrip usps={[{ icon: "rocket", title: "Тест", caption: "Підпис" }]} />);
    const item = screen.getByRole("listitem");

    expect(fallbackPaths).toBeTruthy();
    expect(item.querySelector("svg")?.innerHTML).toBe(fallbackPaths);
  });

  it("без переваг нічого не рендерить", () => {
    const { container } = render(<UspStrip usps={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
