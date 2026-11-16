import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { CATALOG_LINKS } from "~/lib/content/site";

import { SearchEmpty } from "./search-empty";

function renderEmpty(term?: string) {
  return render(
    <MemoryRouter>
      <SearchEmpty term={term} categories={CATALOG_LINKS} />
    </MemoryRouter>,
  );
}

describe("SearchEmpty", () => {
  it("нічого не знайшли: називає запит, радить, що змінити, і дає Telegram", () => {
    renderEmpty("zzzz");

    expect(
      screen.getByRole("heading", { level: 2, name: "За запитом «zzzz» нічого не знайшли" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/спробуйте коротший запит/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "напишіть нам у Telegram" })).toHaveAttribute(
      "href",
      "https://t.me/sad_vinnytsia",
    );
  });

  it("показує популярні категорії з CATALOG_LINKS посиланнями від 44px", () => {
    renderEmpty("zzzz");
    const nav = screen.getByRole("navigation", { name: "Популярні категорії" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(CATALOG_LINKS.length);
    expect(links[0]).toHaveAttribute("href", "/collections/iphone");
    for (const link of links) expect(link).toHaveClass("min-h-11");
  });

  it("без запиту запрошує почати пошук", () => {
    renderEmpty();

    expect(screen.getByRole("heading", { level: 2, name: "Що шукаємо?" })).toBeInTheDocument();
    expect(screen.queryByText(/нічого не знайшли/)).not.toBeInTheDocument();
  });
});
