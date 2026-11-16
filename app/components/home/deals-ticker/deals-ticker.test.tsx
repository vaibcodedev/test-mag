import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { DealsTicker, type DealsTickerItem } from "./deals-ticker";

const ITEMS: DealsTickerItem[] = [
  { title: "MacBook Air 13 M4", discount: "−8%", to: "/products/macbook-air" },
  { title: "AirPods Pro 3", discount: "−8%", to: "/products/airpods-pro-3" },
  { title: "iPad Air 11 M3", discount: "−6%", to: "/products/ipad-air" },
];

function renderTicker(items: DealsTickerItem[] = ITEMS) {
  return render(
    <MemoryRouter>
      <DealsTicker items={items} />
    </MemoryRouter>,
  );
}

describe("DealsTicker", () => {
  it("показує скринрідеру один список із посиланнями на товари зі знижкою", () => {
    renderTicker();
    const list = screen.getByRole("list", { name: "Знижки тижня одним рядком" });
    const links = within(list).getAllByRole("link");

    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(links).toHaveLength(ITEMS.length);
    expect(links[0]).toHaveAttribute("href", "/products/macbook-air");
    expect(links[0]).toHaveTextContent("MacBook Air 13 M4, знижка−8%");
  });

  it("повтори для безшовної петлі приховані від скринрідера та клавіатури", () => {
    const { container } = renderTicker();
    const lists = [...container.querySelectorAll("ul")];
    const duplicates = lists.filter((list) => list.getAttribute("aria-hidden") === "true");

    // Дві однакові половини, тож копій завжди парна кількість і лише одна з них справжня.
    expect(lists.length % 2).toBe(0);
    expect(duplicates).toHaveLength(lists.length - 1);
    for (const duplicate of duplicates) {
      for (const link of duplicate.querySelectorAll("a")) {
        expect(link).toHaveAttribute("tabindex", "-1");
      }
    }
    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
  });

  it("зупиняється під курсором і з фокусом усередині, а без руху стає прокручуваним рядком", () => {
    const { container } = renderTicker();
    const root = container.querySelector('[data-slot="deals-ticker"]');
    const track = root?.firstElementChild;

    expect(root?.className).toContain("motion-reduce:overflow-x-auto");
    expect(track?.className).toContain("animate-ticker");
    expect(track?.className).toContain("group-hover/ticker:[animation-play-state:paused]");
    expect(track?.className).toContain("group-focus-within/ticker:[animation-play-state:paused]");
    expect(track?.className).toContain("motion-reduce:animate-none");
  });

  it("без позицій нічого не рендерить", () => {
    const { container } = renderTicker([]);

    expect(container).toBeEmptyDOMElement();
  });
});
