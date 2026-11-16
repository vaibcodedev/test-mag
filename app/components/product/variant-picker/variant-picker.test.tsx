import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { VariantPicker, type VariantPickerOption } from "./variant-picker";
import { DEMO_VARIANT_OPTIONS } from "./variant-picker.fixtures";

function renderPicker(options: VariantPickerOption[] = DEMO_VARIANT_OPTIONS) {
  return render(
    <MemoryRouter>
      <VariantPicker options={options} />
    </MemoryRouter>,
  );
}

function withSelect(onSelect: () => void): VariantPickerOption[] {
  return DEMO_VARIANT_OPTIONS.map((option) => ({
    ...option,
    values: option.values.map((value) => ({ ...value, onSelect })),
  }));
}

describe("VariantPicker", () => {
  it("позначає вибране значення через aria-current і показує його в підписі", () => {
    renderPicker();

    expect(screen.getByRole("link", { name: "256 ГБ" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Срібний" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("group", { name: "Пам'ять: 256 ГБ" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Колір: Синій титан" })).toBeInTheDocument();
  });

  it("кожне наявне значення — посилання на адресу варіанта", () => {
    renderPicker();

    expect(screen.getByRole("link", { name: "Срібний" }).getAttribute("href")).toContain(
      "/products/iphone-17-pro?",
    );
  });

  it("розпроданий варіант лишається посиланням із поясненням", () => {
    renderPicker();
    const soldOut = screen.getByRole("link", { name: "512 ГБ, немає в наявності" });

    expect(soldOut).toHaveAttribute("data-available", "false");
    expect(soldOut.className).toContain("line-through");
    expect(
      screen.getByRole("link", { name: "Космічний помаранчевий, немає в наявності" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Немає в наявності: 512 ГБ\./)).toBeInTheDocument();
  });

  it("неіснуюча комбінація — вимкнена кнопка з поясненням", () => {
    renderPicker();
    const missing = screen.getByRole("button", { name: "1 ТБ: такої комбінації немає" });

    expect(missing).toBeDisabled();
    expect(missing).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("link", { name: /1 ТБ/ })).toBeNull();
    expect(
      screen.getByText(/Немає такої комбінації з вибраними опціями: 1 ТБ\./),
    ).toBeInTheDocument();
  });

  it("звичайний клік викликає onSelect", async () => {
    const onSelect = vi.fn();
    renderPicker(withSelect(onSelect));

    await userEvent.click(screen.getByRole("link", { name: "Срібний" }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("Ctrl-клік лишається браузеру й вибір не змінює", () => {
    const onSelect = vi.fn();
    renderPicker(withSelect(onSelect));

    fireEvent.click(screen.getByRole("link", { name: "Срібний" }), { ctrlKey: true });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("кружечок кольору отримує колір із даних товару", () => {
    renderPicker();
    const dot = screen.getByRole("link", { name: "Срібний" }).querySelector("span");

    expect(dot?.style.getPropertyValue("--swatch")).toBe("#e3e4e5");
  });

  it("не показується, коли вибирати нічого", () => {
    const { container } = renderPicker([
      {
        name: "Колір",
        values: [
          {
            name: "Графіт",
            selected: true,
            exists: true,
            available: true,
            to: "/products/one-smartwatch",
          },
        ],
      },
    ]);

    expect(container).toBeEmptyDOMElement();
  });
});
