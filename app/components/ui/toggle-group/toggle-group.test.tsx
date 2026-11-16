import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const MEMORY = ["128 ГБ", "256 ГБ", "512 ГБ"];

describe("ToggleGroup", () => {
  it("single: вибирає один варіант і знімає попередній", async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        type="single"
        defaultValue="128 ГБ"
        aria-label="Пам'ять"
        onValueChange={onValueChange}
      >
        {MEMORY.map((option) => (
          <ToggleGroupItem key={option} value={option}>
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>,
    );
    const first = screen.getByRole("radio", { name: "128 ГБ" });
    const second = screen.getByRole("radio", { name: "256 ГБ" });

    expect(screen.getByRole("radiogroup", { name: "Пам'ять" })).toBeInTheDocument();
    expect(first).toHaveAttribute("aria-checked", "true");

    await userEvent.click(second);

    expect(second).toHaveAttribute("aria-checked", "true");
    expect(second).toHaveAttribute("data-state", "on");
    expect(first).toHaveAttribute("aria-checked", "false");
    expect(onValueChange).toHaveBeenLastCalledWith("256 ГБ");
  });

  it("single: стрілки переносять фокус між варіантами", async () => {
    render(
      <ToggleGroup type="single" defaultValue="128 ГБ" aria-label="Пам'ять">
        {MEMORY.map((option) => (
          <ToggleGroupItem key={option} value={option}>
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>,
    );

    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "128 ГБ" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "256 ГБ" })).toHaveFocus();
  });

  it("multiple: варіанти вмикаються незалежно", async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="multiple" aria-label="Фільтри" onValueChange={onValueChange}>
        <ToggleGroupItem value="stock">У наявності</ToggleGroupItem>
        <ToggleGroupItem value="sale">Зі знижкою</ToggleGroupItem>
      </ToggleGroup>,
    );
    const stock = screen.getByRole("button", { name: "У наявності" });
    const sale = screen.getByRole("button", { name: "Зі знижкою" });

    await userEvent.click(stock);
    await userEvent.click(sale);

    expect(stock).toHaveAttribute("aria-pressed", "true");
    expect(sale).toHaveAttribute("aria-pressed", "true");
    expect(onValueChange).toHaveBeenLastCalledWith(["stock", "sale"]);

    await userEvent.click(stock);

    expect(stock).toHaveAttribute("aria-pressed", "false");
    expect(onValueChange).toHaveBeenLastCalledWith(["sale"]);
  });

  it("елементи успадковують варіант і onDark від групи", () => {
    render(
      <ToggleGroup type="single" variant="swatch" onDark aria-label="Колір">
        <ToggleGroupItem value="silver" swatch="#e3e4e5" aria-label="Срібний" />
      </ToggleGroup>,
    );
    const item = screen.getByRole("radio", { name: "Срібний" });

    expect(item).toHaveAttribute("data-variant", "swatch");
    expect(item).toHaveClass("size-11", "focus-ring-on-ink");
    expect(item.querySelector('[data-slot="toggle-swatch"]')).toHaveClass(
      "group-data-[state=on]/toggle:outline-lime",
    );
  });

  it("вимкнений варіант не вибирається", async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="single" aria-label="Пам'ять" onValueChange={onValueChange}>
        <ToggleGroupItem value="1tb" disabled>
          1 ТБ
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    await userEvent.click(screen.getByRole("radio", { name: "1 ТБ" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
