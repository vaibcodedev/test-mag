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
  it("кожна опція — радіогрупа, вибране значення позначене й показане в підписі", () => {
    renderPicker();

    expect(screen.getByRole("radiogroup", { name: "Колір" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "256 ГБ" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "256 ГБ" })).toHaveAttribute("data-state", "on");
    expect(screen.getByRole("radio", { name: "Срібний" })).not.toBeChecked();
    expect(screen.getByRole("group", { name: "Пам'ять: 256 ГБ" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Колір: Синій титан" })).toBeInTheDocument();
  });

  it("кожне наявне значення — посилання на адресу варіанта", () => {
    renderPicker();
    const silver = screen.getByRole("radio", { name: "Срібний" });

    expect(silver.tagName).toBe("A");
    expect(silver.getAttribute("href")).toContain("/products/iphone-17-pro?");
    // Посилання не отримує type="button" від перемикача й лишається досяжним клавішею Tab.
    expect(silver).not.toHaveAttribute("type");
    expect(silver).not.toHaveAttribute("tabindex", "-1");
  });

  it("розпроданий варіант лишається посиланням із поясненням", () => {
    renderPicker();
    const soldOut = screen.getByRole("radio", { name: "512 ГБ, немає в наявності" });

    expect(soldOut.tagName).toBe("A");
    expect(soldOut).toHaveAttribute("data-available", "false");
    expect(soldOut.className).toContain("line-through");
    expect(
      screen.getByRole("radio", { name: "Космічний помаранчевий, немає в наявності" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Немає в наявності: 512 ГБ\./)).toBeInTheDocument();
  });

  it("неіснуюча комбінація — вимкнена кнопка з поясненням", () => {
    renderPicker();
    const missing = screen.getByRole("radio", { name: "1 ТБ: такої комбінації немає" });

    expect(missing.tagName).toBe("BUTTON");
    expect(missing).toBeDisabled();
    expect(missing).not.toBeChecked();
    expect(missing).not.toHaveAttribute("href");
    expect(
      screen.getByText(/Немає такої комбінації з вибраними опціями: 1 ТБ\./),
    ).toBeInTheDocument();
  });

  it("звичайний клік викликає onSelect", async () => {
    const onSelect = vi.fn();
    renderPicker(withSelect(onSelect));

    await userEvent.click(screen.getByRole("radio", { name: "Срібний" }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("пробіл вибирає значення, як у радіогрупі", async () => {
    const onSelect = vi.fn();
    renderPicker(withSelect(onSelect));

    screen.getByRole("radio", { name: "Срібний" }).focus();
    await userEvent.keyboard(" ");

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("повторний клік по вибраному значенню не знімає вибір", async () => {
    renderPicker(withSelect(() => {}));
    const selected = screen.getByRole("radio", { name: "256 ГБ" });

    await userEvent.click(selected);

    expect(selected).toBeChecked();
  });

  it("Ctrl-клік лишається браузеру й вибір не змінює", () => {
    const onSelect = vi.fn();
    renderPicker(withSelect(onSelect));

    fireEvent.click(screen.getByRole("radio", { name: "Срібний" }), { ctrlKey: true });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("кружечок кольору отримує колір із даних товару", () => {
    renderPicker();
    const dot = screen.getByRole("radio", { name: "Срібний" }).querySelector("span");

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
