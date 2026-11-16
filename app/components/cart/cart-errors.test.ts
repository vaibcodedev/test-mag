import { describe, expect, it } from "vitest";

import {
  bannerErrorMessages,
  CART_ERROR_FALLBACK,
  cartErrorMessage,
  LINE_ERROR_FALLBACK,
  lineErrorMessage,
  NETWORK_ERROR,
  type CartErrorsLike,
} from "./cart-errors";

const NO_ERRORS: CartErrorsLike = {
  cart: { userErrors: [], warnings: [] },
  lines: new Map(),
  network: [],
};

describe("cartErrorMessage", () => {
  it("дає український текст за кодом помилки", () => {
    expect(
      cartErrorMessage({ code: "MERCHANDISE_NOT_ENOUGH_STOCK", message: "Not enough stock" }),
    ).toBe("Стільки одиниць немає в наявності. Зменште кількість.");
  });

  it("для невідомого коду не показує англійський текст сервера", () => {
    expect(cartErrorMessage({ code: "SOMETHING_NEW", message: "Something failed" })).toBe(
      CART_ERROR_FALLBACK,
    );
    expect(cartErrorMessage({ code: null, message: "Oops" })).toBe(CART_ERROR_FALLBACK);
  });
});

describe("lineErrorMessage", () => {
  it("повертає null, коли помилок немає", () => {
    expect(lineErrorMessage(undefined)).toBeNull();
    expect(lineErrorMessage({ userErrors: [], warnings: [] })).toBeNull();
  });

  it("бере першу помилку рядка, а без коду — пораду, що робити", () => {
    expect(
      lineErrorMessage({ userErrors: [{ code: "INVALID", message: "Invalid" }], warnings: [] }),
    ).toBe(LINE_ERROR_FALLBACK);
    expect(
      lineErrorMessage({
        userErrors: [],
        warnings: [{ code: "MERCHANDISE_OUT_OF_STOCK", message: "Out of stock" }],
      }),
    ).toBe("Товар закінчився. Приберіть його з кошика, щоб оформити замовлення.");
  });
});

describe("bannerErrorMessages", () => {
  it("порожній, коли помилок немає", () => {
    expect(bannerErrorMessages(NO_ERRORS, new Set())).toEqual([]);
  });

  it("збирає помилки мережі та всього кошика без повторів", () => {
    const messages = bannerErrorMessages(
      {
        ...NO_ERRORS,
        network: [{ message: "Failed to fetch" }, { message: "Timeout", status: 504 }],
        cart: { userErrors: [{ code: "CART_TOO_LARGE", message: "Too large" }], warnings: [] },
      },
      new Set(),
    );

    expect(messages).toEqual([
      NETWORK_ERROR,
      "У кошику забагато товарів. Приберіть частину й спробуйте ще раз.",
    ]);
  });

  it("помилку рядка показує лише тоді, коли самого рядка в кошику вже немає", () => {
    const errors: CartErrorsLike = {
      ...NO_ERRORS,
      lines: new Map([
        ["line-1", { userErrors: [{ code: "INVALID", message: "Invalid" }], warnings: [] }],
      ]),
    };

    expect(bannerErrorMessages(errors, new Set(["line-1"]))).toEqual([]);
    expect(bannerErrorMessages(errors, new Set(["line-2"]))).toHaveLength(1);
  });
});
