import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { ProductInfo, type ProductInfoProps } from "./product-info";
import { ProductTrust } from "./product-trust";

const BASE: ProductInfoProps = {
  title: "iPhone 17 Pro 256 ГБ, синій титан",
  price: { amount: "64999", currencyCode: "UAH" },
  available: true,
  delivery: "доставимо завтра",
};

const text = (element: HTMLElement) => (element.textContent ?? "").replace(/\s/g, " ");

describe("ProductInfo", () => {
  it("показує h1, ціну, розстрочку на 25 місяців і наявність", () => {
    const { container } = render(<ProductInfo {...BASE} />);

    expect(screen.getByRole("heading", { level: 1, name: BASE.title })).toBeInTheDocument();
    expect(text(container)).toContain("64 999 ₴");
    expect(text(container)).toContain("2 600 ₴ × 25 міс.");
    expect(text(container)).toContain("В наявності, доставимо завтра");
  });

  it("зі знижкою показує бейдж, стару ціну та економію", () => {
    const { container } = render(
      <ProductInfo
        {...BASE}
        price={{ amount: "49999", currencyCode: "UAH" }}
        compareAt={{ amount: "54499", currencyCode: "UAH" }}
        installmentMonths={24}
      />,
    );

    expect(text(container)).toContain("Знижка −8%");
    expect(text(container)).toContain("Стара ціна: 54 499 ₴");
    expect(text(container)).toContain("Економія 4 500 ₴");
    expect(text(container)).toContain("× 24 міс.");
  });

  it("не показує рейтинг без справжніх відгуків", () => {
    render(<ProductInfo {...BASE} />);

    expect(screen.queryByRole("img", { name: /Оцінка/ })).toBeNull();
  });

  it("показує рейтинг, бейдж і перші чотири характеристики", () => {
    render(
      <ProductInfo
        {...BASE}
        badge="Хіт"
        rating={{ value: 4.9, count: 128 }}
        shortSpecs={["6,3″ OLED", "A19 Pro", "48 Мп", "USB-C", "Face ID"]}
      />,
    );

    expect(screen.getByRole("img", { name: /Оцінка 4,9 з 5/ })).toBeInTheDocument();
    expect(screen.getByText("Хіт")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Головні характеристики" }).children).toHaveLength(4);
    expect(screen.queryByText("Face ID")).toBeNull();
  });

  it("для вживаного пристрою показує стан, акумулятор і гарантію 6 місяців", () => {
    const { container } = render(
      <ProductInfo {...BASE} used={{ grade: "Відмінний", batteryHealth: 91 }} />,
    );

    expect(text(container)).toContain("Стан: Відмінний");
    expect(text(container)).toContain("Акумулятор 91%");
    expect(text(container)).toContain("Гарантія 6 міс.");
  });

  it("без наявності ховає розстрочку та знижку", () => {
    const { container } = render(
      <ProductInfo
        {...BASE}
        available={false}
        compareAt={{ amount: "70000", currencyCode: "UAH" }}
      />,
    );

    expect(text(container)).toContain("Немає в наявності");
    expect(text(container)).not.toContain("міс.");
    expect(text(container)).not.toContain("Знижка");
  });
});

describe("ProductTrust", () => {
  it("гарантія 12 місяців для нових і 6 для вживаних", () => {
    const { rerender } = render(
      <MemoryRouter>
        <ProductTrust />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Гарантія 12 місяців" })).toHaveAttribute(
      "href",
      "/pages/warranty",
    );

    rerender(
      <MemoryRouter>
        <ProductTrust used />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Гарантія 6 місяців" })).toBeInTheDocument();
  });
});
