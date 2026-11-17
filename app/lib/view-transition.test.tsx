import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTransitionSource, viewTransitionName, viewTransitionStyle } from "./view-transition";

function Card({ href, label }: { href: string; label: string }) {
  const transition = useTransitionSource<HTMLDivElement>(href);
  return (
    <div data-testid={label} {...transition}>
      <button type="button">{label}</button>
    </div>
  );
}

describe("viewTransitionName", () => {
  it("складає назву з типу й handle і лишає в ній тільки символи CSS-ідентифікатора", () => {
    expect(viewTransitionName("product", "iphone-17-pro")).toBe("product-iphone-17-pro");
    expect(viewTransitionName("collection", "знижки 2026")).toBe("collection-_______2026");
    expect(viewTransitionStyle("article", "mac")).toEqual({ "--vt-name": "article-mac" });
  });
});

describe("useTransitionSource", () => {
  it("клік позначає картку джерелом переходу й знімає позначку з попередньої", () => {
    render(
      <>
        <Card href="/products/a" label="перша" />
        <Card href="/products/a" label="друга" />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "перша" }));
    expect(screen.getByTestId("перша")).toHaveAttribute("data-vt-source");
    expect(screen.getByTestId("друга")).not.toHaveAttribute("data-vt-source");

    // Той самий товар у другій секції: джерелом стає саме та картка, по якій клацнули.
    fireEvent.click(screen.getByRole("button", { name: "друга" }));
    expect(screen.getByTestId("перша")).not.toHaveAttribute("data-vt-source");
    expect(screen.getByTestId("друга")).toHaveAttribute("data-vt-source");
  });

  it("після «Назад» першу картку з тією самою адресою позначає знову", () => {
    const first = render(<Card href="/products/b" label="список" />);
    fireEvent.click(screen.getByRole("button", { name: "список" }));
    first.unmount();

    // Нова розмітка списку: дві картки того самого товару, позначку отримує лише перша.
    render(
      <>
        <Card href="/products/b" label="після повернення" />
        <Card href="/products/b" label="дубль" />
        <Card href="/products/c" label="інший товар" />
      </>,
    );

    expect(screen.getByTestId("після повернення")).toHaveAttribute("data-vt-source");
    expect(screen.getByTestId("дубль")).not.toHaveAttribute("data-vt-source");
    expect(screen.getByTestId("інший товар")).not.toHaveAttribute("data-vt-source");
  });
});
