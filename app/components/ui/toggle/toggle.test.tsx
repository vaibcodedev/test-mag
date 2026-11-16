import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Toggle } from "./toggle";

describe("Toggle", () => {
  it("перемикає aria-pressed і повідомляє новий стан", async () => {
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>256 ГБ</Toggle>);
    const toggle = screen.getByRole("button", { name: "256 ГБ" });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("data-state", "off");

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("pill: пігулка 44px, увімкнена — blue", () => {
    render(<Toggle defaultPressed>256 ГБ</Toggle>);
    const toggle = screen.getByRole("button");

    expect(toggle).toHaveAttribute("data-variant", "pill");
    expect(toggle).toHaveClass(
      "h-11",
      "rounded-pill",
      "data-[state=on]:bg-blue",
      "data-[state=on]:text-surface",
    );
  });

  it("icon: кругла кнопка 44px, увімкнена іконка стає blue", () => {
    render(<Toggle variant="icon" aria-label="Додати в обране: iPhone 17 Pro" />);

    expect(screen.getByRole("button", { name: "Додати в обране: iPhone 17 Pro" })).toHaveClass(
      "size-11",
      "rounded-pill",
      "bg-surface",
      "data-[state=on]:text-blue",
    );
  });

  it("swatch: рендерить крапку кольору з кільцем blue, на ink — lime", () => {
    const { rerender } = render(
      <Toggle variant="swatch" swatch="#3c4a5e" aria-label="Синій титан" />,
    );
    const dot = () => document.querySelector<HTMLElement>('[data-slot="toggle-swatch"]');

    expect(screen.getByRole("button", { name: "Синій титан" })).toHaveClass("size-11");
    expect(dot()?.style.getPropertyValue("--swatch")).toBe("#3c4a5e");
    expect(dot()).toHaveClass("size-7", "group-data-[state=on]/toggle:outline-blue");

    rerender(<Toggle variant="swatch" swatch="#3c4a5e" onDark aria-label="Синій титан" />);

    expect(dot()).toHaveClass("group-data-[state=on]/toggle:outline-lime");
  });

  it("disabled не перемикається", async () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle disabled onPressedChange={onPressedChange}>
        1 ТБ
      </Toggle>,
    );

    await userEvent.click(screen.getByRole("button", { name: "1 ТБ" }));

    expect(onPressedChange).not.toHaveBeenCalled();
  });
});
