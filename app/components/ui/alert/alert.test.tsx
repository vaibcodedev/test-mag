import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("за замовчуванням це info з role=status", () => {
    render(
      <Alert>
        <AlertTitle>Самовивіз сьогодні до 20:00</AlertTitle>
        <AlertDescription>Товар уже в шоурумі.</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("status");

    expect(alert).toHaveAttribute("data-variant", "info");
    expect(alert).toHaveClass("bg-page");
    expect(alert).toHaveTextContent("Самовивіз сьогодні до 20:00");
    expect(alert).toHaveTextContent("Товар уже в шоурумі.");
  });

  it("помилка має role=alert, межу danger і текст ink", () => {
    render(
      <Alert variant="danger">
        <AlertTitle>Не вдалося додати товар у кошик</AlertTitle>
      </Alert>,
    );
    const alert = screen.getByRole("alert");

    expect(alert).toHaveClass("border-danger", "text-ink");
    expect(alert).not.toHaveClass("text-danger");
  });

  it("role можна перевизначити", () => {
    render(
      <Alert variant="warning" role="alert">
        <AlertTitle>Залишився 1 товар</AlertTitle>
      </Alert>,
    );

    expect(screen.getByRole("alert")).toHaveAttribute("data-variant", "warning");
  });
});
