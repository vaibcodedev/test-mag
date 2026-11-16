import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from "./progress";

const indicator = () => document.querySelector<HTMLElement>('[data-slot="progress-indicator"]');

describe("Progress", () => {
  it("передає значення читачам екрана", () => {
    render(<Progress value={64} aria-label="До безкоштовної доставки" />);
    const bar = screen.getByRole("progressbar", { name: "До безкоштовної доставки" });

    expect(bar).toHaveAttribute("aria-valuenow", "64");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("зсуває заповнення відповідно до значення", () => {
    render(<Progress value={64} aria-label="Поступ" />);

    expect(indicator()).toHaveStyle({ transform: "translateX(-36%)" });
  });

  it("рахує відсоток від max", () => {
    render(<Progress value={2} max={4} aria-label="Товарів у порівнянні" />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "4");
    expect(indicator()).toHaveStyle({ transform: "translateX(-50%)" });
  });

  it("без value стан невизначений: aria-valuenow немає", () => {
    render(<Progress aria-label="Завантаження" />);

    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    expect(indicator()).toHaveStyle({ transform: "translateX(-100%)" });
  });

  it("на ink доріжка біла 20%, заповнення lime", () => {
    render(<Progress value={40} tone="on-dark" aria-label="Поступ" />);

    expect(screen.getByRole("progressbar")).toHaveClass("bg-on-ink-20");
    expect(indicator()).toHaveClass("bg-lime");
  });
});
