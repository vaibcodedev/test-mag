import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { beforeAll, describe, expect, it } from "vitest";

import { DEFAULT_SORT_VALUE } from "~/lib/shopify/collection";

import { SortSelect, type SortSelectProps } from "./sort-select";

// Radix Select спирається на API вказівника та прокрутки, яких немає в jsdom.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

function renderSort(props: Partial<SortSelectProps> = {}) {
  const submitted: string[] = [];
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = Array.from(new FormData(event.currentTarget), ([name, value]) => [
      name,
      String(value),
    ]);
    submitted.push(new URLSearchParams(entries).toString());
  };

  const view = render(
    <SortSelect
      value={DEFAULT_SORT_VALUE}
      action="/collections/iphone"
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { ...view, submitted };
}

describe("SortSelect", () => {
  it("це GET-форма з shadcn Select і чотирма варіантами", async () => {
    const { container } = renderSort();
    const form = container.querySelector("form");
    const trigger = screen.getByRole("combobox", { name: "Сортування" });

    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/collections/iphone");
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(container.querySelector('input[name="sort_by"]')).toHaveValue(DEFAULT_SORT_VALUE);

    await userEvent.click(trigger);

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Спочатку популярні",
      "Спочатку дешевші",
      "Спочатку дорожчі",
      "Спочатку новинки",
    ]);
  });

  it("вибір одразу відправляє форму й не губить увімкнені фільтри", async () => {
    const { submitted } = renderSort({
      hiddenParams: [
        ["filter.v.price.gte", "100"],
        ["filter.v.availability", "1"],
      ],
    });

    await userEvent.click(screen.getByRole("combobox", { name: "Сортування" }));
    await userEvent.click(screen.getByRole("option", { name: "Спочатку дешевші" }));

    expect(submitted).toEqual([
      "filter.v.price.gte=100&filter.v.availability=1&sort_by=price-ascending",
    ]);
  });

  it("показує поточне сортування з адреси", () => {
    renderSort({ value: "created-descending" });

    expect(screen.getByRole("combobox", { name: "Сортування" })).toHaveTextContent(
      "Спочатку новинки",
    );
  });
});
