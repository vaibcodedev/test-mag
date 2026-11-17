import { parseCollectionParams, type ProductFilter } from "@shopify/hydrogen";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DEMO_FILTERS, DEMO_PRICE_CEILING } from "~/components/collection/collection.fixtures";

import type { CollectionFilter } from "~/lib/shopify/collection";

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

  return {
    ...view,
    submitted,
    onSubmit,
    form: view.container.querySelector("form") as HTMLFormElement,
  };
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

  it("прапорець — shadcn Checkbox із підписом: клік по підпису вмикає його", async () => {
    renderFilters();
    const checkbox = screen.getByRole("checkbox", { name: /256 ГБ/ });

    expect(checkbox).toHaveAttribute("data-slot", "checkbox");
    expect(checkbox).toHaveAccessibleName(/^256 ГБ.*товар/);
    expect(checkbox).not.toBeChecked();

    await userEvent.click(screen.getByText("256 ГБ"));

    expect(checkbox).toBeChecked();
  });

  it("кольори показує перемикачами зі зразком і назвою", () => {
    const { container } = renderFilters();
    const colors = screen.getByRole("group", { name: "Колір" });

    expect(within(colors).getAllByRole("button")).toHaveLength(4);
    expect(container.querySelectorAll("[data-slot=filter-swatch]")).toHaveLength(4);
    expect(within(colors).getByText("Синій титан")).toBeInTheDocument();
    expect(within(colors).getByRole("button", { name: /Синій титан/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(colors.querySelectorAll("[data-slot=toggle-swatch]")).toHaveLength(4);
  });

  it("перемикач кольору відправляє той самий параметр, що й прапорець, і знімається повторним кліком", async () => {
    const { submitted, form } = renderFilters();
    const silver = screen.getByRole("button", { name: /Срібний/ });

    await userEvent.click(silver);

    expect(silver).toHaveAttribute("aria-pressed", "true");
    expect(filtersOf(submitted[0] ?? "")).toEqual([
      { variantOption: { name: "Колір", value: "Срібний" } },
    ]);
    const hidden = [...form.querySelectorAll<HTMLInputElement>('input[type="hidden"]')];
    expect(hidden.map((input) => input.value)).toEqual(["Срібний"]);

    await userEvent.click(silver);

    expect(silver).toHaveAttribute("aria-pressed", "false");
    expect(submitted[1]).toBe("");
  });

  it("назви полів беруться з FilterValue.input", () => {
    renderFilters();

    // Назву й значення несе поле форми, яке Radix Checkbox тримає поруч із кнопкою-прапорцем.
    const fieldOf = (name: RegExp) =>
      screen
        .getByRole("checkbox", { name })
        .parentElement?.querySelector<HTMLInputElement>('input[type="checkbox"]');

    expect(fieldOf(/^В наявності/)).toHaveAttribute("name", "filter.v.availability");
    expect(fieldOf(/^В наявності/)).toHaveAttribute("value", "1");
    expect(fieldOf(/Відмінний/)).toHaveAttribute("name", "filter.p.m.custom.condition_grade");
    expect(fieldOf(/Відмінний/)).toHaveAttribute("value", "Відмінний");
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

    expect(screen.getByRole("button", { name: /Чорний/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Срібний/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
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

    await userEvent.click(screen.getByRole("button", { name: /Срібний/ }));

    expect(filtersOf(submitted[0] ?? "")).toEqual(
      expect.arrayContaining([
        { variantOption: { name: "Пам'ять", value: "512 ГБ" } },
        { variantOption: { name: "Колір", value: "Срібний" } },
      ]),
    );
  });

  it("зміна адреси (чип, «назад») оновлює прапорець на місці й форму не відправляє", () => {
    const { submitted, onSubmit, rerender } = renderFilters({
      activeFilters: [{ variantOption: { name: "Пам'ять", value: "256 ГБ" } }],
    });
    expect(screen.getByRole("checkbox", { name: /256 ГБ/ })).toBeChecked();

    rerender(
      <Filters
        filters={DEMO_FILTERS}
        activeFilters={[]}
        action="/collections/iphone"
        currencyCode="UAH"
        priceCeiling={DEMO_PRICE_CEILING}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /256 ГБ/ })).not.toBeChecked();
    expect(submitted).toHaveLength(0);
  });

  it("довгий список показує перші шість значень і ввімкнені, решту — за кнопкою", async () => {
    const colors: CollectionFilter = {
      id: "filter.v.option.колір",
      label: "Колір",
      type: "LIST",
      values: Array.from({ length: 12 }, (_, index) => ({
        id: `color-${index}`,
        label: `Колір ${index + 1}`,
        count: 1,
        input: JSON.stringify({ variantOption: { name: "Колір", value: `Колір ${index + 1}` } }),
      })),
    };
    const active = [{ variantOption: { name: "Колір", value: "Колір 11" } }];
    renderFilters({ filters: [colors], activeFilters: active });

    const group = screen.getByRole("group", { name: /Колір/ });
    // Шість перших і одне ввімкнене з кінця списку: вибране не ховається.
    expect(within(group).getAllByRole("checkbox")).toHaveLength(7);
    expect(within(group).getByRole("checkbox", { name: /Колір 11,/ })).toBeChecked();

    const more = within(group).getByRole("button", { name: "Показати ще 5" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(more);

    expect(within(group).getAllByRole("checkbox")).toHaveLength(12);
    const less = within(group).getByRole("button", { name: "Згорнути" });
    expect(less).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(less);
    expect(within(group).getAllByRole("checkbox")).toHaveLength(7);
  });

  it("короткий список кнопки «Показати ще» не має", () => {
    renderFilters();

    expect(screen.queryByRole("button", { name: /Показати ще/ })).toBeNull();
  });

  it("без фільтрів нічого не рендерить", () => {
    const { container } = renderFilters({ filters: [] });

    expect(container).toBeEmptyDOMElement();
  });
});
