import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StickyBuyBar, type StickyBuyBarProps } from "./sticky-buy-bar";
import { isStickyBarVisible } from "./use-sticky-buy-bar";

const PROPS: StickyBuyBarProps = {
  visible: true,
  title: "iPhone 17 Pro 256 ГБ, синій титан",
  price: { amount: "64999", currencyCode: "UAH" },
  formId: "product-form",
  submit: { name: "add-to-cart", type: "submit" },
};

describe("isStickyBarVisible", () => {
  const above = { isIntersecting: false, bottom: -120 };
  const below = { isIntersecting: false, bottom: 1400 };
  const onScreen = { isIntersecting: true, bottom: 480 };
  const endFarBelow = { isIntersecting: false, top: 3200 };

  it("схована, доки спостерігач нічого не повідомив", () => {
    expect(isStickyBarVisible(null, null)).toBe(false);
  });

  it("схована, поки головну кнопку видно", () => {
    expect(isStickyBarVisible(onScreen, endFarBelow)).toBe(false);
  });

  it("схована, поки до кнопки ще не докрутили", () => {
    expect(isStickyBarVisible(below, endFarBelow)).toBe(false);
  });

  it("показана, коли кнопка прокрутилась угору за екран", () => {
    expect(isStickyBarVisible(above, endFarBelow)).toBe(true);
    expect(isStickyBarVisible(above, null)).toBe(true);
  });

  it("ховається в кінці сторінки товару, щоб не накривати підвал", () => {
    expect(isStickyBarVisible(above, { isIntersecting: true, top: 700 })).toBe(false);
    expect(isStickyBarVisible(above, { isIntersecting: false, top: -300 })).toBe(false);
  });
});

describe("StickyBuyBar", () => {
  it("кнопка надсилає форму товару за її id", () => {
    render(<StickyBuyBar {...PROPS} />);
    const button = screen.getByRole("button", { name: "Купити" });

    expect(button).toHaveAttribute("form", "product-form");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("name", "add-to-cart");
    expect(screen.getByText(PROPS.title)).toBeInTheDocument();
  });

  it("схована панель недоступна з клавіатури та читачам екрана", () => {
    const { container } = render(<StickyBuyBar {...PROPS} visible={false} />);
    const bar = container.querySelector("[data-slot='sticky-buy-bar']");

    expect(bar).toHaveAttribute("inert");
    expect(bar).toHaveAttribute("data-visible", "false");
  });

  it("показана панель не має inert", () => {
    const { container } = render(<StickyBuyBar {...PROPS} />);

    expect(container.querySelector("[data-slot='sticky-buy-bar']")).not.toHaveAttribute("inert");
  });

  it("під час додавання кнопка показує завантаження", () => {
    render(<StickyBuyBar {...PROPS} pending />);

    expect(screen.getByRole("button", { name: /Купити/ })).toHaveAttribute("aria-busy", "true");
  });
});
