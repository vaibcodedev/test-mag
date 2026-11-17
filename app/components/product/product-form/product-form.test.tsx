import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductForm, type ProductFormFields, type ProductFormProps } from "./product-form";

const FIELDS: ProductFormFields = {
  merchandiseId: { name: "merchandiseId", value: "gid://shopify/ProductVariant/1" },
  quantity: { name: "quantity", value: "1" },
  submit: { name: "add-to-cart", type: "submit" },
};

function renderForm(props: Partial<ProductFormProps> = {}) {
  return render(
    <ProductForm
      id="product-form"
      method="post"
      action="/api/cart"
      fields={FIELDS}
      state="available"
      {...props}
    />,
  );
}

describe("ProductForm", () => {
  it("без JavaScript надсилає варіант і кількість звичайним POST на кошик", () => {
    const { container } = renderForm();
    const form = container.querySelector("form");
    const button = screen.getByRole("button", { name: "Купити" });

    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/cart");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("name", "add-to-cart");
    expect(Object.fromEntries(new FormData(form as HTMLFormElement))).toEqual({
      merchandiseId: "gid://shopify/ProductVariant/1",
      quantity: "1",
    });
  });

  it("під час додавання кнопка показує завантаження", () => {
    renderForm({ pending: true });

    expect(screen.getByRole("button", { name: /Купити/ })).toHaveAttribute("aria-busy", "true");
  });

  it("без наявності замість кнопки — «Немає в наявності» та посилання на Telegram", () => {
    renderForm({ state: "sold-out" });

    expect(screen.queryByRole("button", { name: "Купити" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Немає в наявності");
    expect(screen.getByRole("link", { name: /Запитати в Telegram/ })).toHaveAttribute(
      "href",
      "https://t.me/ionov_store",
    );
  });

  it("поки варіант не вибрано, кнопка вимкнена й каже, що зробити", () => {
    renderForm({ state: "unselected" });

    expect(screen.getByRole("button", { name: "Оберіть варіант" })).toBeDisabled();
  });

  it("показує помилки кошика", () => {
    renderForm({ errors: ["Можна додати не більше 2 штук."] });

    expect(screen.getByRole("alert")).toHaveTextContent("Можна додати не більше 2 штук.");
  });
});
