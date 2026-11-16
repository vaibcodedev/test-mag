import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEMO_CART_TOTALS } from "~/components/cart/cart.fixtures";

import { CartSummary } from "./cart-summary";

/** Посилання всередині тіньового дерева кнопки Shop Pay. */
function shopPayLink(container: HTMLElement) {
  const host = container.querySelector("hydrogen-shop-pay-button");
  return host?.shadowRoot?.querySelector("a") ?? null;
}

const text = (element: HTMLElement) => (element.textContent ?? "").replace(/\s/g, " ");

describe("CartSummary", () => {
  it("показує суму із сервера, примітку про доставку й посилання на оформлення", () => {
    const { container } = render(<CartSummary {...DEMO_CART_TOTALS} />);

    expect(text(container)).toContain("Сума82 997 ₴");
    expect(text(container)).toContain("Доставку розрахуємо під час оформлення замовлення.");
    expect(screen.getByRole("link", { name: "Оформити замовлення" })).toHaveAttribute(
      "href",
      DEMO_CART_TOTALS.checkoutUrl,
    );
  });

  it("коли на кошик діє знижка, додає рядок із сумою до сплати", () => {
    const { container } = render(
      <CartSummary
        subtotal={{ amount: "82997", currencyCode: "UAH" }}
        total={{ amount: "78997", currencyCode: "UAH" }}
      />,
    );

    expect(text(container)).toContain("Сума82 997 ₴");
    expect(text(container)).toContain("Зі знижкою78 997 ₴");
  });

  it("без знижки другого рядка немає", () => {
    const { container } = render(<CartSummary {...DEMO_CART_TOTALS} />);

    expect(text(container)).not.toContain("Зі знижкою");
  });

  it("у стані pending показує попередню суму тьмяною, а не спінер", () => {
    const { container } = render(<CartSummary {...DEMO_CART_TOTALS} pending />);

    expect(container.querySelector("dl")).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("dd")).toHaveClass("opacity-50");
    expect(text(container)).toContain("82 997 ₴");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("без checkoutUrl кнопки оформлення немає, друга дія лишається", () => {
    render(
      <CartSummary
        subtotal={DEMO_CART_TOTALS.subtotal}
        secondaryAction={<button type="button">Продовжити покупки</button>}
      />,
    );

    expect(screen.queryByRole("link", { name: "Оформити замовлення" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Продовжити покупки" })).toBeInTheDocument();
  });

  it("Shop Pay стоїть під «Оформити замовлення» й оформлює поточний кошик", () => {
    const { container } = render(
      <CartSummary
        {...DEMO_CART_TOTALS}
        shopPay
        secondaryAction={<button type="button">Продовжити покупки</button>}
      />,
    );
    const checkout = screen.getByRole("link", { name: "Оформити замовлення" });
    const host = container.querySelector("hydrogen-shop-pay-button");
    const link = shopPayLink(container);

    expect(host).not.toBeNull();
    expect(link).toHaveAttribute("href", expect.stringMatching(/^\/checkout(\?|$)/));
    expect(link).toHaveAttribute("aria-label", "Оформити через Shop Pay");
    expect(link).not.toHaveAttribute("aria-disabled", "true");
    // Порядок: оформлення → Shop Pay → друга дія.
    const following = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(checkout.compareDocumentPosition(host as Element) & following).toBeTruthy();
    expect(
      (host as Element).compareDocumentPosition(
        screen.getByRole("button", { name: "Продовжити покупки" }),
      ) & following,
    ).toBeTruthy();
  });

  it("поки кошик змінюється, Shop Pay неактивний і нікуди не веде", () => {
    const { container } = render(<CartSummary {...DEMO_CART_TOTALS} shopPay pending />);
    const link = shopPayLink(container);

    expect(link).not.toBeNull();
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");
  });

  it("без shopPay або без checkoutUrl кнопки Shop Pay немає", () => {
    const { container, rerender } = render(<CartSummary {...DEMO_CART_TOTALS} />);
    expect(container.querySelector("hydrogen-shop-pay-button")).toBeNull();

    rerender(<CartSummary subtotal={DEMO_CART_TOTALS.subtotal} shopPay />);
    expect(container.querySelector("hydrogen-shop-pay-button")).toBeNull();
  });
});
