import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "./breadcrumbs";

const ITEMS = [
  { title: "Головна", to: "/" },
  { title: "iPhone", to: "/collections/iphone" },
  { title: "iPhone 17 Pro", to: "/products/iphone-17-pro" },
];

describe("Breadcrumbs", () => {
  it("робить посиланнями всі крихти, крім поточної сторінки", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={ITEMS} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Хлібні крихти" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Головна" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "iPhone" })).toHaveAttribute(
      "href",
      "/collections/iphone",
    );
    expect(screen.queryByRole("link", { name: "iPhone 17 Pro" })).toBeNull();
    expect(screen.getByText("iPhone 17 Pro")).toHaveAttribute("aria-current", "page");
  });

  it("нічого не показує без крихт", () => {
    const { container } = render(
      <MemoryRouter>
        <Breadcrumbs items={[]} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
