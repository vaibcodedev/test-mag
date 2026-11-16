import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { ProductDetails, type ProductDetailsProps } from "./product-details";

function renderDetails(props: ProductDetailsProps = {}) {
  return render(
    <MemoryRouter>
      <ProductDetails {...props} />
    </MemoryRouter>,
  );
}

describe("ProductDetails", () => {
  it("показує HTML-опис товару", () => {
    renderDetails({ descriptionHtml: "<p>Смартфон з <strong>дисплеєм 6,3″</strong>.</p>" });

    const section = screen.getByRole("region", { name: "Опис" });
    expect(within(section).getByText("дисплеєм 6,3″").tagName).toBe("STRONG");
  });

  it("розбиває характеристики на назву й значення", () => {
    renderDetails({ specs: ["Дисплей: 6,3″ OLED", "Face ID"] });

    const section = screen.getByRole("region", { name: "Характеристики" });
    expect(within(section).getByText("Дисплей")).toBeInTheDocument();
    expect(within(section).getByText("6,3″ OLED")).toBeInTheDocument();
    expect(within(section).getByText("Face ID")).toBeInTheDocument();
  });

  it("без опису й характеристик лишає тільки умови магазину", () => {
    renderDetails();

    expect(screen.queryByRole("region", { name: "Опис" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Характеристики" })).toBeNull();
    expect(screen.getByRole("link", { name: "Умови доставки" })).toHaveAttribute(
      "href",
      "/pages/delivery",
    );
    expect(screen.getByRole("link", { name: "Як оплатити частинами" })).toHaveAttribute(
      "href",
      "/pages/installments",
    );
    expect(screen.getByRole("link", { name: "Умови гарантії" })).toHaveAttribute(
      "href",
      "/pages/warranty",
    );
  });

  it("для вживаних гарантія 6 місяців", () => {
    renderDetails({ used: true });

    expect(screen.getByRole("heading", { name: "Гарантія 6 місяців" })).toBeInTheDocument();
  });
});
