import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NativeSelect, NativeSelectOption } from "./native-select";

function renderSorting(props: Parameters<typeof NativeSelect>[0] = {}) {
  return render(
    <NativeSelect aria-label="Сортування" defaultValue="popular" {...props}>
      <NativeSelectOption value="popular">Спочатку популярні</NativeSelectOption>
      <NativeSelectOption value="price-asc">Спочатку дешевші</NativeSelectOption>
    </NativeSelect>,
  );
}

describe("NativeSelect", () => {
  it("змінює значення і викликає onChange", async () => {
    const onChange = vi.fn();
    renderSorting({ onChange });
    const select = screen.getByRole("combobox", { name: "Сортування" });

    expect(select).toHaveValue("popular");

    await userEvent.selectOptions(select, "price-asc");

    expect(select).toHaveValue("price-asc");
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("має вигляд поля: висота 46, радіус md, місце під стрілку", () => {
    renderSorting();

    expect(screen.getByRole("combobox")).toHaveClass("h-11.5", "rounded-md", "appearance-none");
  });

  it("className потрапляє на обгортку, а name і disabled — на select", () => {
    const { container } = renderSorting({ className: "max-w-xs", name: "sort", disabled: true });
    const select = screen.getByRole("combobox");

    expect(container.firstElementChild).toHaveClass("max-w-xs");
    expect(select).not.toHaveClass("max-w-xs");
    expect(select).toHaveAttribute("name", "sort");
    expect(select).toBeDisabled();
  });
});
