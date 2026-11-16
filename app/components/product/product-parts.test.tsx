import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ColorSwatches, type ColorSwatch } from "~/components/product/color-swatches";
import { CompareButton } from "~/components/product/compare-button";
import { InstallmentChip } from "~/components/product/installment-chip";
import { UsedGrade } from "~/components/product/used-grade";
import { WishlistButton } from "~/components/product/wishlist-button";

const COLORS: ColorSwatch[] = [
  { name: "Синій титан", hex: "#3c4a5e" },
  { name: "Срібний", hex: "#e3e4e5" },
];

describe("ColorSwatches", () => {
  it("з onChange це радіогрупа: вибраний колір позначений, клік повідомляє назву", async () => {
    const onChange = vi.fn();
    render(<ColorSwatches colors={COLORS} value="Синій титан" onChange={onChange} />);

    expect(screen.getByRole("radiogroup", { name: "Колір" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Синій титан" })).toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: "Срібний" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("Срібний");
  });

  it("повторний клік по вибраному кольору вибір не знімає", async () => {
    const onChange = vi.fn();
    render(<ColorSwatches colors={COLORS} value="Синій титан" onChange={onChange} />);
    const selected = screen.getByRole("radio", { name: "Синій титан" });

    await userEvent.click(selected);

    expect(onChange).not.toHaveBeenCalled();
    expect(selected).toBeChecked();
  });

  it("крапка бере колір із даних товару, на ink — свій варіант", () => {
    render(<ColorSwatches colors={COLORS} value="Срібний" onChange={() => {}} onDark />);
    const dot = screen.getByRole("radio", { name: "Срібний" }).querySelector("span");

    expect(dot?.style.getPropertyValue("--swatch")).toBe("#e3e4e5");
    expect(screen.getByRole("radio", { name: "Срібний" })).toHaveAttribute(
      "data-variant",
      "swatch",
    );
  });

  it("без onChange — підписаний перелік кольорів без кнопок", () => {
    render(<ColorSwatches colors={COLORS} />);

    expect(screen.getByRole("img", { name: "Колір: Синій титан, Срібний" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("без кольорів нічого не рендерить", () => {
    const { container } = render(<ColorSwatches colors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("WishlistButton і CompareButton", () => {
  it("це перемикачі: стан у aria-pressed, підпис каже, що станеться", () => {
    render(
      <>
        <WishlistButton productTitle="iPhone 17 Pro" active />
        <CompareButton productTitle="iPhone 17 Pro" />
      </>,
    );
    const wishlist = screen.getByRole("button", { name: "Прибрати з обраного: iPhone 17 Pro" });
    const compare = screen.getByRole("button", { name: "Додати до порівняння: iPhone 17 Pro" });

    expect(wishlist).toHaveAttribute("aria-pressed", "true");
    expect(wishlist).toHaveAttribute("data-state", "on");
    expect(wishlist).toHaveAttribute("data-variant", "icon");
    expect(compare).toHaveAttribute("aria-pressed", "false");
    expect(compare).toHaveAttribute("data-state", "off");
  });

  it("стан веде той, хто використовує кнопку: клік лише повідомляє", async () => {
    const onClick = vi.fn();
    render(<WishlistButton productTitle="iPhone 17 Pro" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Додати в обране: iPhone 17 Pro" });

    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});

describe("InstallmentChip і UsedGrade", () => {
  it("чипи — Badge з варіантом під тло", () => {
    render(
      <>
        <InstallmentChip price={{ amount: "119999", currencyCode: "UAH" }} tone="on-dark" />
        <UsedGrade batteryHealth={91.4} />
      </>,
    );

    expect(screen.getByText(/× 25 міс\./).closest("[data-slot=installment-chip]")).toHaveAttribute(
      "data-variant",
      "chip-on-dark",
    );
    expect(screen.getByText("Акумулятор 91%")).toHaveAttribute("data-variant", "chip");
    expect(screen.getByText("Гарантія 6 міс.")).toHaveAttribute("data-slot", "badge");
  });
});
