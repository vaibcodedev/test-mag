import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card, CardDescription, CardTitle } from "./card";

describe("Card", () => {
  it("за замовчуванням біла картка з радіусом lg, без межі й тіні", () => {
    render(<Card data-testid="card">Вміст</Card>);
    const card = screen.getByTestId("card");

    expect(card).toHaveClass("bg-surface", "rounded-lg", "p-6");
    expect(card.className).not.toMatch(/border|shadow/);
    expect(card).not.toHaveClass("lift");
  });

  it("interactive додає hover-підйом і group для фото", () => {
    render(
      <Card interactive data-testid="card">
        Вміст
      </Card>,
    );

    expect(screen.getByTestId("card")).toHaveClass("lift", "group");
  });

  it("тон ink робить текст білим, а опис — приглушеним для темного тла", () => {
    render(
      <Card tone="ink" data-testid="card">
        <CardDescription>Здайте старий iPhone</CardDescription>
      </Card>,
    );

    expect(screen.getByTestId("card")).toHaveClass("bg-ink", "text-surface");
    expect(screen.getByTestId("card")).toHaveAttribute("data-tone", "ink");
    expect(screen.getByText("Здайте старий iPhone")).toHaveClass(
      "group-data-[tone=ink]/card:text-on-ink-muted",
    );
  });

  it("padding none прибирає поля", () => {
    render(
      <Card padding="none" data-testid="card">
        Вміст
      </Card>,
    );

    expect(screen.getByTestId("card")).not.toHaveClass("p-6");
  });

  it("asChild робить коренем article, а CardTitle — заголовком", () => {
    render(
      <Card asChild>
        <article>
          <CardTitle asChild>
            <h3>iPhone 17 Pro</h3>
          </CardTitle>
        </article>
      </Card>,
    );

    expect(screen.getByRole("article")).toHaveAttribute("data-slot", "card");
    expect(screen.getByRole("heading", { level: 3, name: "iPhone 17 Pro" })).toHaveClass(
      "text-card-title",
    );
  });
});
