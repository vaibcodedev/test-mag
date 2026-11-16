import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShopPay } from "./shop-pay";

describe("ShopPay", () => {
  it("обгортка дає видимий фокус і ціль натискання 44px довкола кнопки з shadow DOM", () => {
    const { container } = render(
      <ShopPay
        variants={[{ id: "gid://shopify/ProductVariant/1", quantity: 1 }]}
        label="Купити через Shop Pay"
      />,
    );
    const wrapper = container.querySelector('[data-slot="shop-pay"]');
    const button = wrapper?.querySelector("hydrogen-shop-pay-button");

    // :focus-within бачить фокус усередині shadow DOM; посилання розтягується на min-h-11.
    expect(wrapper).toHaveClass(
      "focus-within:shadow-focus-offset",
      "[&>hydrogen-shop-pay-button]:flex",
      "[&>hydrogen-shop-pay-button]:min-h-11",
    );
    expect(button).toHaveAttribute("accessibility-label", "Купити через Shop Pay");
    expect(button).toHaveAttribute("width", "100%");
  });

  it("з варіантом веде на пермалінк кошика, без варіантів — на /checkout", () => {
    const withVariant = render(
      <ShopPay
        variants={[{ id: "gid://shopify/ProductVariant/42", quantity: 1 }]}
        label="Shop Pay"
      />,
    );
    const link = withVariant.container
      .querySelector("hydrogen-shop-pay-button")
      ?.shadowRoot?.querySelector("a");
    expect(link?.getAttribute("href")).toMatch(/^\/cart\/42:1\?/);
    withVariant.unmount();

    const cart = render(<ShopPay label="Shop Pay" />);
    const cartLink = cart.container
      .querySelector("hydrogen-shop-pay-button")
      ?.shadowRoot?.querySelector("a");
    expect(cartLink?.getAttribute("href")).toMatch(/^\/checkout\?/);
  });
});
