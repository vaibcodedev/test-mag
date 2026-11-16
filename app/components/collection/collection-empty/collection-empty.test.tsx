import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { CollectionEmpty } from "./collection-empty";

function renderEmpty(filtered: boolean) {
  return render(
    <MemoryRouter>
      <CollectionEmpty filtered={filtered} resetHref="/collections/iphone" />
    </MemoryRouter>,
  );
}

describe("CollectionEmpty", () => {
  it("коли товари сховали фільтри, пропонує їх скинути", () => {
    renderEmpty(true);

    expect(
      screen.getByRole("heading", { level: 2, name: "За цими фільтрами нічого не знайшлося" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Скинути фільтри" })).toHaveAttribute(
      "href",
      "/collections/iphone",
    );
  });

  it("порожня колекція веде до каталогу", () => {
    renderEmpty(false);

    expect(
      screen.getByRole("heading", { level: 2, name: "Тут поки немає товарів" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти до каталогу" })).toHaveAttribute(
      "href",
      "/collections",
    );
  });
});
