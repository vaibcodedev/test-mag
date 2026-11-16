import { parseCollectionParams, type ProductFilter } from "@shopify/hydrogen";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DEMO_FILTERS, DEMO_PRICE_CEILING } from "~/components/collection/collection.fixtures";

import { Filters, type FiltersProps } from "./filters";

// Повзунок Radix міряє себе через ResizeObserver, якого немає в jsdom.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

/** Рендерить форму й повертає рядок пошуку кожної її відправки — те, що потрапило б в адресу. */
function renderFilters(props: Partial<FiltersProps> = {}) {
  const submitted: string[] = [];
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget)) {
      // Порожні поля ціни Hydrogen відкидає під час розбору; тут робимо те саме для наочності.
      if (typeof value === "string" && value !== "") params.append(name, value);
    }
    submitted.push(params.toString());
  };

  const view = render(
    <Filters
      filters={DEMO_FILTERS}
      activeFilters={[]}
      action="/collections/iphone"
      currencyCode="UAH"
      priceCeiling={DEMO_PRICE_CEILING}
      onSubmit={onSubmit}
      {...props}
    />,
  );

  return { ...view, submitted, form: view.container.querySelector("form") as HTMLFormElement };
}

const filtersOf = (search: string) => parseCollectionParams(new URLSearchParams(search)).filters;

describe("Filters", () => {
  it("це GET-форма на адресу колекції: працює без JavaScript", () => {
    const { form } = renderFilters();

    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/collections/iphone");
  });

  it("малює групу на кожен фільтр із даних", () => {
    renderFilters();

    for (const filter of DEMO_FILTERS) {
      expect(screen.getByRole("button", { name: filter.label })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    }
  });

  it("вигляд групи залежить від типу: ціна — повзунок і два поля, список — прапорці", () => {
    renderFilters();

    expect(screen.getByRole("slider", { name: "Ціна від" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Ціна до" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Мінімальна ціна, UAH" })).toHaveAttribute(
      "name",
      "filter.v.price.gte",
    );
    expect(screen.getByRole("spinbutton", { name: "Максимальна ціна, UAH" })).toHaveAttribute(
      "name",
      "filter.v.price.lte",
    );

    const memory = screen.getByRole("group", { name: "Пам'ять" });
    expect(within(memory).getAllByRole("checkbox")).toHaveLength(4);
    expect(within(memory).getByRole("checkbox", { name: /256 ГБ/ })).toHaveAttribute(
      "value",
      "256 ГБ",
    );
  });

  it("кольори показує зразками з назвою", () => {
    const { container } = renderFilters();
    const colors = screen.getByRole("group", { name: "Колір" });

    expect(within(colors).getAllByRole("checkbox")).toHaveLength(4);
    expect(container.querySelectorAll("[data-slot=filter-swatch]")).toHaveLength(4);
    expect(within(colors).getByText("Синій титан")).toBeInTheDocument();
  });

  it("назви полів беруться з FilterValue.input", () => {
    renderFilters();

    expect(screen.getByRole("checkbox", { name: /^В наявності/ })).toHaveAttribute(
      "name",
      "filter.v.availability",
    );
    expect(screen.getByRole("checkbox", { name: /Відмінний/ })).toHaveAttribute(
      "name",
      "filter.p.m.custom.condition_grade",
    );
  });

  it("клік по прапорцю одразу відправляє форму з потрібним параметром", async () => {
    const { submitted } = renderFilters();

    await userEvent.click(screen.getByRole("checkbox", { name: /256 ГБ/ }));

    expect(submitted).toHaveLength(1);
    expect(filtersOf(submitted[0] ?? "")).toEqual([
      { variantOption: { name: "Пам'ять", value: "256 ГБ" } },
    ]);
  });

  it("увімкнені фільтри позначені й лишаються в адресі разом із новим", async () => {
    const activeFilters: ProductFilter[] = [
      { price: { min: 30000, max: 70000 } },
      { variantOption: { name: "Колір", value: "Чорний" } },
    ];
    const { submitted } = renderFilters({ activeFilters });

    expect(screen.getByRole("checkbox", { name: /Чорний/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Срібний/ })).not.toBeChecked();
    expect(screen.getByRole("spinbutton", { name: "Мінімальна ціна, UAH" })).toHaveValue(30000);
    expect(screen.getByRole("spinbutton", { name: "Максимальна ціна, UAH" })).toHaveValue(70000);
    expect(screen.getByRole("button", { name: /Колір/ })).toHaveTextContent("вибрано: 1");

    await userEvent.click(screen.getByRole("checkbox", { name: /Відмінний/ }));

    expect(filtersOf(submitted[0] ?? "")).toEqual(
      expect.arrayContaining([
        { price: { min: 30000, max: 70000 } },
        { variantOption: { name: "Колір", value: "Чорний" } },
        {
          productMetafield: { namespace: "custom", key: "condition_grade", value: "Відмінний" },
        },
      ]),
    );
  });

  it("«в наявності» й «немає в наявності» не вмикаються разом", async () => {
    const { submitted } = renderFilters({ activeFilters: [{ available: false }] });

    await userEvent.click(screen.getByRole("checkbox", { name: /^В наявності/ }));

    // У відправленій формі лишилося одне значення: попереднє знято.
    expect(submitted).toEqual(["filter.v.availability=1"]);
    expect(filtersOf(submitted[0] ?? "")).toEqual([{ available: true }]);
  });

  it("ціна відправляється після паузи у введенні, одним запитом на обидва поля", () => {
    vi.useFakeTimers();
    try {
      const { submitted } = renderFilters();

      fireEvent.change(screen.getByRole("spinbutton", { name: "Мінімальна ціна, UAH" }), {
        target: { value: "20000" },
      });
      fireEvent.change(screen.getByRole("spinbutton", { name: "Максимальна ціна, UAH" }), {
        target: { value: "50000.5" },
      });
      expect(submitted).toHaveLength(0);

      vi.advanceTimersByTime(400);

      expect(submitted).toEqual(["filter.v.price.gte=20000&filter.v.price.lte=50000.5"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("зберігає сортування прихованим полем", async () => {
    const { submitted } = renderFilters({ sortValue: "price-ascending" });

    await userEvent.click(screen.getByRole("checkbox", { name: /128 ГБ/ }));

    expect(new URLSearchParams(submitted[0]).get("sort_by")).toBe("price-ascending");
  });

  it("поля згорнутої групи лишаються у формі", async () => {
    const { submitted } = renderFilters({
      activeFilters: [{ variantOption: { name: "Пам'ять", value: "512 ГБ" } }],
    });

    await userEvent.click(screen.getByRole("button", { name: /Пам'ять/ }));
    expect(screen.getByRole("button", { name: /Пам'ять/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await userEvent.click(screen.getByRole("checkbox", { name: /Срібний/ }));

    expect(filtersOf(submitted[0] ?? "")).toEqual(
      expect.arrayContaining([
        { variantOption: { name: "Пам'ять", value: "512 ГБ" } },
        { variantOption: { name: "Колір", value: "Срібний" } },
      ]),
    );
  });

  it("без фільтрів нічого не рендерить", () => {
    const { container } = renderFilters({ filters: [] });

    expect(container).toBeEmptyDOMElement();
  });
});
