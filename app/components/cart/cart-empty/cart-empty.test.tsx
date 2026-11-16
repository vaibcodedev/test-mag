import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { CartEmpty } from "./cart-empty";

describe("CartEmpty", () => {
  it("пояснює, що кошик порожній, і веде до каталогу", () => {
    render(
      <MemoryRouter>
        <CartEmpty />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "У кошику поки порожньо" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти до каталогу" })).toHaveAttribute(
      "href",
      "/collections",
    );
  });

  it("у бічній панелі заголовок третього рівня, а клік по посиланню закриває панель", async () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <CartEmpty headingLevel="h3" onNavigate={onNavigate} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("link", { name: "Перейти до каталогу" }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
