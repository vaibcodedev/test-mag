import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { HOME_CONTENT } from "~/lib/content/home";

import { CategoryBento } from "./category-bento";
import { DEMO_BENTO_CATEGORIES } from "./category-bento.demo";

function renderBento(totalProducts?: number | null) {
  return render(
    <MemoryRouter>
      <CategoryBento categories={DEMO_BENTO_CATEGORIES} totalProducts={totalProducts} />
    </MemoryRouter>,
  );
}

describe("CategoryBento", () => {
  it("показує кількість товарів, коли її порахував магазин", () => {
    renderBento(11);

    expect(screen.getByRole("link", { name: /^Увесь каталог: 11 товарів/ })).toHaveAttribute(
      "href",
      "/collections",
    );
  });

  it("без відомої кількості посилання лишається без числа", () => {
    for (const total of [null, undefined, 0]) {
      const { unmount } = renderBento(total);
      const link = screen.getByRole("link", { name: /^Увесь каталог/ });

      expect(link).toHaveTextContent(/^Увесь каталог$/);
      unmount();
    }
  });

  it("демо-вміст головної не несе вигаданої кількості товарів", () => {
    expect(HOME_CONTENT.bento.totalProducts).toBeNull();
  });
});
