import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Money } from "~/lib/format";

import { Price } from "./price";

const uah = (amount: string): Money => ({ amount, currencyCode: "UAH" });
const text = (element: HTMLElement) => (element.textContent ?? "").replace(/\s/g, " ");

describe("Price", () => {
  it("показує звичайну ціну кольором ink", () => {
    const { container } = render(<Price price={uah("64999")} />);

    expect(text(container)).toBe("Ціна: 64 999 ₴");
    expect(container.querySelector(".text-sale")).toBeNull();
  });

  it("показує знижку: нову ціну, стару закреслену та економію", () => {
    const { container } = render(<Price price={uah("49999")} compareAt={uah("54499")} />);

    expect(text(container)).toContain("Ціна зі знижкою: 49 999 ₴");
    expect(text(container.querySelector("s") as HTMLElement)).toBe("Стара ціна: 54 499 ₴");
    expect(text(screen.getByText(/Економія/))).toBe("Економія 4 500 ₴");
  });

  it("не показує знижку, якщо стара ціна не вища", () => {
    const { container } = render(<Price price={uah("49999")} compareAt={uah("49999")} />);

    expect(container.querySelector("s")).toBeNull();
    expect(screen.queryByText(/Економія/)).toBeNull();
  });

  it("ховає економію за showSavings={false} і додає «від»", () => {
    const { container } = render(
      <Price price={uah("49999")} compareAt={uah("54499")} showSavings={false} from />,
    );

    expect(screen.queryByText(/Економія/)).toBeNull();
    expect(text(container)).toContain("від 49 999 ₴");
  });
});
