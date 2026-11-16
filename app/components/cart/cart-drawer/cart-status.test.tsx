import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartStatus } from "./cart-status";

/** Керований стан кошика замість стору Hydrogen. */
const cart = vi.hoisted(() => ({ pending: false, lineCount: 2, networkErrors: [] as unknown[] }));

vi.mock("~/components/cart/cart-summary", () => ({
  useCartTotals: () => ({ pending: cart.pending }),
}));
vi.mock("~/lib/cart", () => ({
  useCart: (selector: (state: unknown) => unknown) =>
    selector({
      errors: { network: cart.networkErrors },
      data: { lines: { nodes: Array.from({ length: cart.lineCount }, (_, id) => ({ id })) } },
    }),
}));

const status = () => screen.getByRole("status");

beforeEach(() => {
  cart.pending = false;
  cart.lineCount = 2;
  cart.networkErrors = [];
});

describe("CartStatus", () => {
  it("до першої зміни мовчить", () => {
    render(<CartStatus />);

    expect(status()).toBeEmptyDOMElement();
    expect(status()).toHaveAttribute("aria-live", "polite");
  });

  it("зміна кількості: «Оновлюємо кошик», потім «Кошик оновлено»", () => {
    const { rerender } = render(<CartStatus />);

    cart.pending = true;
    rerender(<CartStatus />);
    expect(status()).toHaveTextContent("Оновлюємо кошик");

    cart.pending = false;
    rerender(<CartStatus />);
    expect(status()).toHaveTextContent("Кошик оновлено");
  });

  it("рядок зник (кількість 0, «мінус» чи «Прибрати»): «Товар прибрано з кошика»", () => {
    const { rerender } = render(<CartStatus />);

    cart.pending = true;
    cart.lineCount = 1;
    rerender(<CartStatus />);
    cart.pending = false;
    rerender(<CartStatus />);

    expect(status()).toHaveTextContent("Товар прибрано з кошика");

    // Наступна звичайна зміна знову каже «Кошик оновлено».
    cart.pending = true;
    rerender(<CartStatus />);
    cart.pending = false;
    rerender(<CartStatus />);

    expect(status()).toHaveTextContent("Кошик оновлено");
  });

  it("якщо сервер повернув рядок, про видалення не повідомляє", () => {
    const { rerender } = render(<CartStatus />);

    cart.pending = true;
    cart.lineCount = 1;
    rerender(<CartStatus />);
    cart.pending = false;
    cart.lineCount = 2;
    rerender(<CartStatus />);

    expect(status()).not.toHaveTextContent("Товар прибрано з кошика");
  });
});
