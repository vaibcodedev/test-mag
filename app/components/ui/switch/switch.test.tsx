import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "./switch";

describe("Switch", () => {
  it("перемикається натисканням і повідомляє новий стан", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Лише в наявності" onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole("switch", { name: "Лише в наявності" });

    expect(control).toHaveAttribute("aria-checked", "false");

    await userEvent.click(control);

    expect(control).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(control);

    expect(control).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("перемикається пробілом із клавіатури", async () => {
    render(<Switch aria-label="Зі знижкою" />);
    const control = screen.getByRole("switch");

    await userEvent.tab();
    await userEvent.keyboard(" ");

    expect(control).toHaveFocus();
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("disabled не реагує на натискання", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Зі знижкою" disabled onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole("switch"));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("за замовчуванням має розмір md: доріжка 44×24", () => {
    render(<Switch aria-label="Зі знижкою" />);

    expect(screen.getByRole("switch")).toHaveClass("h-6", "w-11");
    expect(screen.getByRole("switch")).toHaveAttribute("data-size", "md");
  });
});
