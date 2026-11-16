import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./item";

describe("Item", () => {
  it("asChild робить рядок посиланням і зберігає стилі", () => {
    render(
      <Item asChild variant="outline">
        <a href="/pages/delivery">
          <ItemContent>
            <ItemTitle>Доставка</ItemTitle>
            <ItemDescription>Новою поштою за 1–2 дні</ItemDescription>
          </ItemContent>
        </a>
      </Item>,
    );
    const link = screen.getByRole("link", { name: /Доставка/ });

    expect(link).toHaveAttribute("data-slot", "item");
    expect(link).toHaveAttribute("data-variant", "outline");
    expect(link).toHaveClass("border-line", "rounded-md");
  });

  it("ItemTitle з asChild стає заголовком потрібного рівня", () => {
    render(
      <ItemTitle asChild>
        <h3>Гарантія 12 місяців</h3>
      </ItemTitle>,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Гарантія 12 місяців" })).toHaveClass(
      "text-card-title",
    );
  });
});

describe("ItemMedia", () => {
  it("icon md light: плитка 44px на page", () => {
    render(<ItemMedia variant="icon" data-testid="media" />);

    expect(screen.getByTestId("media")).toHaveClass(
      "inline-flex",
      "size-11",
      "rounded-md",
      "bg-page",
      "text-ink",
      "[&>svg]:size-5",
    );
  });

  it("icon lg dark: плитка 52px на ink", () => {
    render(<ItemMedia variant="icon" size="lg" tone="dark" data-testid="media" />);

    expect(screen.getByTestId("media")).toHaveClass(
      "size-13",
      "bg-on-ink-10",
      "text-surface",
      "[&>svg]:size-6",
    );
  });

  it("image: мініатюра фото на bg-photo", () => {
    render(
      <ItemMedia variant="image" data-testid="media">
        <img src="/iphone.png" alt="" />
      </ItemMedia>,
    );

    expect(screen.getByTestId("media")).toHaveClass("size-14", "rounded-md", "bg-photo");
  });

  it("default не отримує розмірів і тла плитки", () => {
    render(<ItemMedia data-testid="media" />);

    expect(screen.getByTestId("media")).not.toHaveClass("size-11", "bg-page");
  });
});
