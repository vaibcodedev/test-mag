import { describe, expect, it } from "vitest";

import {
  discountPercent,
  formatDecimal,
  formatPrice,
  installmentPayment,
  isOnSale,
  plural,
  savings,
  type Money,
} from "./index";

const uah = (amount: string): Money => ({ amount, currencyCode: "UAH" });
/** Intl ставить між розрядами нерозривний пробіл. */
const normalize = (value: string) => value.replace(/\s/g, " ");

describe("formatPrice", () => {
  it("форматує гривню як «119 999 ₴» без копійок", () => {
    expect(normalize(formatPrice(uah("119999.0")))).toBe("119 999 ₴");
  });

  it("залишає копійки, якщо вони є", () => {
    expect(normalize(formatPrice(uah("4799.5")))).toBe("4 799,50 ₴");
  });
});

describe("знижка", () => {
  it("визначає знижку лише коли стара ціна вища", () => {
    expect(isOnSale(uah("49999"), uah("54499"))).toBe(true);
    expect(isOnSale(uah("49999"), uah("49999"))).toBe(false);
    expect(isOnSale(uah("49999"), null)).toBe(false);
  });

  it("не порівнює ціни в різних валютах", () => {
    expect(isOnSale(uah("100"), { amount: "200", currencyCode: "USD" })).toBe(false);
  });

  it("рахує економію та відсоток", () => {
    expect(savings(uah("49999"), uah("54499"))).toEqual(uah("4500"));
    expect(discountPercent(uah("49999"), uah("54499"))).toBe(8);
    expect(savings(uah("49999"), null)).toBeNull();
    expect(discountPercent(uah("49999"), uah("40000"))).toBeNull();
  });
});

describe("installmentPayment", () => {
  it("округлює платіж угору до гривні", () => {
    expect(installmentPayment(uah("119999"), 25)).toEqual(uah("4800"));
  });

  it("повертає null для некоректної кількості платежів", () => {
    expect(installmentPayment(uah("119999"), 0)).toBeNull();
    expect(installmentPayment(uah("119999"), 2.5)).toBeNull();
  });
});

describe("plural", () => {
  const forms = { one: "відгук", few: "відгуки", many: "відгуків" };

  it.each([
    [1, "відгук"],
    [3, "відгуки"],
    [5, "відгуків"],
    [11, "відгуків"],
    [21, "відгук"],
    [128, "відгуків"],
  ])("%i → %s", (count, expected) => {
    expect(plural(count, forms)).toBe(expected);
  });
});

describe("formatDecimal", () => {
  it("ставить кому як десятковий роздільник", () => {
    expect(formatDecimal(4.9)).toBe("4,9");
    expect(formatDecimal(5)).toBe("5,0");
  });
});
