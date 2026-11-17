import { describe, expect, it } from "vitest";

import { discountValueLabel, orderTotalRows } from "./order-totals";

const uah = (amount: number) => ({ amount: `${amount}.0`, currencyCode: "UAH" });
/** Intl ставить між розрядами нерозривний пробіл: для порівняння зводимо його до звичайного. */
const plain = (value: string) => value.replace(/\s/g, " ");
const rowsOf = (...args: Parameters<typeof orderTotalRows>) =>
  orderTotalRows(...args).map((row) => ({ ...row, value: plain(row.value) }));

describe("orderTotalRows", () => {
  it("звичайне замовлення: товари, доставка, разом", () => {
    expect(
      rowsOf({
        subtotal: uah(64999),
        totalShipping: uah(150),
        totalTax: uah(0),
        totalPrice: uah(65149),
      }),
    ).toEqual([
      { key: "subtotal", label: "Товари", value: "64 999 ₴", note: undefined },
      { key: "shipping", label: "Доставка", value: "150 ₴" },
      { key: "total", label: "Разом", value: "65 149 ₴", tone: "total" },
    ]);
  });

  it("не показує нульових рядків: без доставки, податків і повернень лишається товари й разом", () => {
    const rows = rowsOf(
      { subtotal: uah(2399), totalShipping: uah(0), totalTax: uah(0), totalPrice: uah(2399) },
      { totalRefunded: uah(0), shippingLine: null, discountApplications: { nodes: [] } },
    );

    expect(rows.map((row) => row.key)).toEqual(["subtotal", "total"]);
  });

  it("нульова доставка там, де доставка була, — «Безкоштовно»", () => {
    const rows = rowsOf(
      { subtotal: uah(64999), totalShipping: uah(0), totalPrice: uah(64999) },
      { shippingLine: { title: "Нова пошта" } },
    );

    expect(rows.find((row) => row.key === "shipping")).toEqual({
      key: "shipping",
      label: "Доставка",
      value: "Безкоштовно",
    });
  });

  it("знижки: промокод сумою, автоматична відсотком, знижка на доставку окремо", () => {
    const rows = rowsOf(
      { subtotal: uah(58499), totalShipping: uah(0), totalPrice: uah(58499) },
      {
        shippingLine: { title: "Кур'єр" },
        discountApplications: {
          nodes: [
            {
              targetType: "LINE_ITEM",
              code: "WELCOME",
              value: { __typename: "MoneyV2", amount: "500.0", currencyCode: "UAH" },
            },
            {
              targetType: "LINE_ITEM",
              title: "Чорна п'ятниця",
              value: { __typename: "PricingPercentageValue", percentage: 10 },
            },
            {
              targetType: "SHIPPING_LINE",
              title: null,
              value: { __typename: "PricingPercentageValue", percentage: 100 },
            },
            // Знижка без значення нічого не каже покупцеві.
            { targetType: "LINE_ITEM", code: "EMPTY", value: null },
          ],
        },
      },
    );

    expect(rows).toEqual([
      { key: "subtotal", label: "Товари", value: "58 499 ₴", note: "Знижки вже враховано" },
      { key: "discount-0", label: "Знижка «WELCOME»", value: "−500 ₴", tone: "discount" },
      { key: "discount-1", label: "Знижка «Чорна п'ятниця»", value: "−10%", tone: "discount" },
      { key: "discount-2", label: "Знижка на доставку", value: "−100%", tone: "discount" },
      { key: "shipping", label: "Доставка", value: "Безкоштовно" },
      { key: "total", label: "Разом", value: "58 499 ₴", tone: "total" },
    ]);
  });

  it("податки й повернення показує, коли вони більші за нуль", () => {
    const rows = rowsOf(
      { subtotal: uah(1000), totalShipping: uah(100), totalTax: uah(200), totalPrice: uah(1300) },
      { totalRefunded: uah(300) },
    );

    expect(rows.slice(2)).toEqual([
      { key: "tax", label: "Податки", value: "200 ₴" },
      { key: "total", label: "Разом", value: "1 300 ₴", tone: "total" },
      { key: "refunded", label: "Повернено", value: "−300 ₴", tone: "refund" },
    ]);
  });

  it("без суми товарів і без другорядних даних лишається підсумок", () => {
    expect(rowsOf({ totalPrice: uah(500) }, null)).toEqual([
      { key: "total", label: "Разом", value: "500 ₴", tone: "total" },
    ]);
  });
});

describe("discountValueLabel", () => {
  it("дробовий відсоток не обростає нулями, нульова знижка не показується", () => {
    expect(discountValueLabel({ __typename: "PricingPercentageValue", percentage: 7.5 })).toBe(
      "−7.5%",
    );
    expect(discountValueLabel({ __typename: "PricingPercentageValue", percentage: 0 })).toBeNull();
    expect(
      discountValueLabel({ __typename: "MoneyV2", amount: "0.0", currencyCode: "UAH" }),
    ).toBeNull();
    expect(discountValueLabel({ __typename: "SomethingNew" })).toBeNull();
  });
});
