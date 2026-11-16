import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

describe("Empty", () => {
  it("за замовчуванням біла панель xl з вирівнюванням ліворуч", () => {
    render(
      <Empty data-testid="empty">
        <EmptyHeader>
          <EmptyMedia data-testid="media" />
          <EmptyTitle>У кошику поки порожньо</EmptyTitle>
          <EmptyDescription>Додайте товар із каталогу.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <a href="/collections/all">Перейти в каталог</a>
        </EmptyContent>
      </Empty>,
    );
    const empty = screen.getByTestId("empty");

    expect(empty).toHaveClass("rounded-xl", "bg-surface", "items-start");
    expect(empty).toHaveAttribute("data-centered", "false");
    expect(screen.getByRole("heading", { level: 2, name: "У кошику поки порожньо" })).toHaveClass(
      "text-h2",
    );
    expect(screen.getByRole("link", { name: "Перейти в каталог" })).toBeInTheDocument();
  });

  it("centered вирівнює вміст по центру", () => {
    render(<Empty centered data-testid="empty" />);

    expect(screen.getByTestId("empty")).toHaveClass("items-center", "text-center");
    expect(screen.getByTestId("empty")).toHaveAttribute("data-centered", "true");
  });

  it("рівень заголовка задає as", () => {
    render(<EmptyTitle as="h1">Нічого не знайшли</EmptyTitle>);

    expect(
      screen.getByRole("heading", { level: 1, name: "Нічого не знайшли" }),
    ).toBeInTheDocument();
  });

  it("asChild переносить стилі заголовка на власний елемент", () => {
    render(
      <EmptyTitle asChild>
        <h3 id="wishlist-empty">В обраному порожньо</h3>
      </EmptyTitle>,
    );
    const heading = screen.getByRole("heading", { level: 3 });

    expect(heading).toHaveAttribute("id", "wishlist-empty");
    expect(heading).toHaveAttribute("data-slot", "empty-title");
  });

  it("EmptyMedia має вигляд плитки 52px і прихована від читачів екрана", () => {
    render(<EmptyMedia data-testid="media" />);

    expect(screen.getByTestId("media")).toHaveClass("size-13", "rounded-md", "bg-page", "text-ink");
    expect(screen.getByTestId("media")).toHaveAttribute("aria-hidden", "true");
  });
});
