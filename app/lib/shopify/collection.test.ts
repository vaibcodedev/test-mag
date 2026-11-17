import { parseCollectionParams, serializeCollectionParams } from "@shopify/hydrogen";
import { describe, expect, it } from "vitest";

import {
  activeFilterChips,
  activeValueCount,
  collectionSeo,
  DEFAULT_SORT_VALUE,
  filterLabel,
  filterParamEntries,
  isIndexable,
  isSwatchFilter,
  pageHref,
  parsePageArgs,
  priceCeiling,
  priceStep,
  productCountLabel,
  SORT_OPTIONS,
  sortSelectValue,
  swatchColor,
  dropSingleValueFilters,
  onlyAvailableOption,
  toStorefrontSort,
  truncateText,
  withPriceFilter,
  type CollectionFilter,
} from "./collection";

const input = (filter: object) => JSON.stringify(filter);
const spaces = (value: string) => value.replace(/\s/g, " ");

const MEMORY: CollectionFilter = {
  id: "filter.v.option.memory",
  label: "Пам'ять",
  type: "LIST",
  presentation: "TEXT",
  values: [
    {
      id: "m-128",
      label: "128 ГБ",
      count: 4,
      input: input({ variantOption: { name: "Пам'ять", value: "128 ГБ" } }),
    },
    {
      id: "m-256",
      label: "256 ГБ",
      count: 7,
      input: input({ variantOption: { name: "Пам'ять", value: "256 ГБ" } }),
    },
  ],
};

const PRICE: CollectionFilter = {
  id: "filter.v.price",
  label: "Ціна",
  type: "PRICE_RANGE",
  values: [{ id: "price", label: "Ціна", count: 9, input: input({ price: { min: 0, max: 649 } }) }],
};

const AVAILABILITY: CollectionFilter = {
  id: "filter.v.availability",
  label: "Наявність",
  type: "BOOLEAN",
  values: [
    { id: "a-1", label: "В наявності", count: 8, input: input({ available: true }) },
    { id: "a-0", label: "Немає в наявності", count: 1, input: input({ available: false }) },
  ],
};

describe("адреса ⇄ фільтри", () => {
  it("FilterValue.input стає назвою і значенням поля форми", () => {
    expect(
      filterParamEntries(input({ variantOption: { name: "Колір", value: "Чорний" } })),
    ).toEqual([{ name: `filter.v.option.${encodeURIComponent("Колір")}`, value: "Чорний" }]);
    expect(filterParamEntries(input({ available: true }))).toEqual([
      { name: "filter.v.availability", value: "1" },
    ]);
    expect(
      filterParamEntries(
        input({
          productMetafield: { namespace: "custom", key: "condition_grade", value: "Відмінний" },
        }),
      ),
    ).toEqual([{ name: "filter.p.m.custom.condition_grade", value: "Відмінний" }]);
  });

  it("ціна з обома межами дає два параметри", () => {
    expect(filterParamEntries(input({ price: { min: 100, max: 400 } }))).toEqual([
      { name: "filter.v.price.gte", value: "100" },
      { name: "filter.v.price.lte", value: "400" },
    ]);
  });

  it("зіпсований input не ламає форму", () => {
    expect(filterParamEntries("{не json")).toEqual([]);
    expect(filterParamEntries("null")).toEqual([]);
  });

  it("поля форми читаються назад у ті самі фільтри", () => {
    const params = new URLSearchParams();
    for (const value of MEMORY.values) {
      for (const entry of filterParamEntries(value.input)) params.append(entry.name, entry.value);
    }
    params.set("filter.v.price.gte", "100");
    params.set("filter.v.price.lte", "400.5");

    const { filters } = parseCollectionParams(new URLSearchParams(params.toString()));

    expect(filters).toEqual(
      expect.arrayContaining([
        { price: { min: 100, max: 400.5 } },
        { variantOption: { name: "Пам'ять", value: "128 ГБ" } },
        { variantOption: { name: "Пам'ять", value: "256 ГБ" } },
      ]),
    );
    expect(filters).toHaveLength(3);
    // І навпаки: фільтри → адреса → ті самі фільтри.
    const roundTrip = parseCollectionParams(
      serializeCollectionParams({ filters, sortKey: undefined, reverse: false }),
    );
    expect(roundTrip.filters).toEqual(filters);
  });

  it("рахує ввімкнені значення групи", () => {
    const active = [
      { variantOption: { name: "Пам'ять", value: "256 ГБ" } },
      { price: { min: 100 } },
    ];

    expect(activeValueCount(MEMORY, active)).toBe(1);
    expect(activeValueCount(PRICE, active)).toBe(1);
    expect(activeValueCount(AVAILABILITY, active)).toBe(0);
  });
});

describe("сортування", () => {
  it("має чотири варіанти: популярні, дешевші, дорожчі, новинки", () => {
    expect(SORT_OPTIONS.map((option) => option.label)).toEqual([
      "Спочатку популярні",
      "Спочатку дешевші",
      "Спочатку дорожчі",
      "Спочатку новинки",
    ]);
    expect(SORT_OPTIONS.map((option) => option.value)).toEqual([
      DEFAULT_SORT_VALUE,
      "price-ascending",
      "price-descending",
      "created-descending",
    ]);
  });

  it.each([
    ["", "COLLECTION_DEFAULT", false],
    [`sort_by=${DEFAULT_SORT_VALUE}`, "COLLECTION_DEFAULT", false],
    ["sort_by=price-ascending", "PRICE", false],
    ["sort_by=price-descending", "PRICE", true],
    ["sort_by=created-descending", "CREATED", true],
    ["sort_by=best-selling", "BEST_SELLING", false],
    ["sort_by=щось-невідоме", "COLLECTION_DEFAULT", false],
  ])("«%s» → sortKey %s, reverse %s", (search, sortKey, reverse) => {
    const browse = parseCollectionParams(new URLSearchParams(search));

    expect(toStorefrontSort(browse)).toEqual({ sortKey, reverse });
  });

  it("значення <select> збігається з варіантом; популярні — за замовчуванням", () => {
    expect(sortSelectValue({ sortKey: undefined, reverse: false })).toBe(DEFAULT_SORT_VALUE);
    expect(sortSelectValue({ sortKey: "BEST_SELLING", reverse: false })).toBe(DEFAULT_SORT_VALUE);
    expect(sortSelectValue({ sortKey: "PRICE", reverse: true })).toBe("price-descending");
    expect(sortSelectValue({ sortKey: "CREATED", reverse: true })).toBe("created-descending");
  });

  it("сортування за замовчуванням не потрапляє в адресу", () => {
    const browse = parseCollectionParams(new URLSearchParams(`sort_by=${DEFAULT_SORT_VALUE}`));

    expect(serializeCollectionParams({ ...browse, filters: [] }).toString()).toBe("");
  });
});

describe("пагінація", () => {
  it("без курсора — перша сторінка", () => {
    expect(parsePageArgs(new URLSearchParams(""), 24)).toEqual({ first: 24 });
  });

  it("?after= веде вперед, ?before= назад", () => {
    expect(parsePageArgs(new URLSearchParams("after=abc"), 24)).toEqual({
      first: 24,
      after: "abc",
    });
    expect(parsePageArgs(new URLSearchParams("before=xyz"), 24)).toEqual({
      last: 24,
      before: "xyz",
    });
    expect(parsePageArgs(new URLSearchParams("after=abc&before=xyz"), 24)).toEqual({
      first: 24,
      after: "abc",
    });
  });

  it("адреса сусідньої сторінки зберігає фільтри й сортування та замінює курсор", () => {
    const search = "?filter.v.price.gte=100&sort_by=price-ascending&after=old";

    expect(pageHref("/collections/iphone", search, { after: "next" })).toBe(
      "/collections/iphone?filter.v.price.gte=100&sort_by=price-ascending&after=next",
    );
    expect(pageHref("/collections/iphone", search, { before: "prev" })).toBe(
      "/collections/iphone?filter.v.price.gte=100&sort_by=price-ascending&before=prev",
    );
  });
});

describe("індексація", () => {
  it("індексується лише чиста адреса колекції", () => {
    expect(isIndexable(new URLSearchParams(""))).toBe(true);
    expect(isIndexable(new URLSearchParams("utm_source=telegram"))).toBe(true);
    expect(isIndexable(new URLSearchParams("filter.v.price.gte=100"))).toBe(false);
    expect(isIndexable(new URLSearchParams("sort_by=price-ascending"))).toBe(false);
    expect(isIndexable(new URLSearchParams("after=abc"))).toBe(false);
    expect(isIndexable(new URLSearchParams("before=abc"))).toBe(false);
  });
});

describe("ціна", () => {
  it("крок повзунка росте разом із цінами", () => {
    expect(priceStep(80)).toBe(1);
    expect(priceStep(649)).toBe(10);
    expect(priceStep(12000)).toBe(100);
    expect(priceStep(120000)).toBe(500);
  });

  it("верхня межа береться з фільтра PRICE_RANGE і округлюється до кроку", () => {
    expect(priceCeiling([PRICE], 0)).toBe(650);
    expect(priceCeiling([MEMORY], 119999)).toBe(120000);
    // Покупець звузив ціну: фільтр віддає межу вибірки, шкала лишається шкалою колекції.
    expect(priceCeiling([PRICE], 93000)).toBe(93000);
    expect(priceCeiling([], 0)).toBe(0);
    expect(priceCeiling([], Number.NaN)).toBe(0);
  });

  it("додає фільтр ціни, якщо магазин його не повернув", () => {
    const filters = withPriceFilter([MEMORY], 650);

    expect(filters.map((filter) => filter.type)).toEqual(["PRICE_RANGE", "LIST"]);
    expect(filters[0]?.label).toBe("Ціна");
    expect(withPriceFilter([PRICE, MEMORY], 650)).toEqual([PRICE, MEMORY]);
    expect(withPriceFilter([], 0)).toEqual([]);
  });
});

describe("кольори", () => {
  it("бере колір зі swatch, із #hex або з назви", () => {
    expect(swatchColor({ label: "Deep Ocean", swatch: { color: "#123456" } })).toBe("#123456");
    expect(swatchColor({ label: "#FFAA00" })).toBe("#ffaa00");
    expect(swatchColor({ label: "Синій титан" })).toBe(swatchColor({ label: "Blue" }));
    expect(swatchColor({ label: "256 ГБ" })).toBeNull();
  });

  it("показує зразками лише групи, де всі значення схожі на колір", () => {
    const colors: CollectionFilter = {
      id: "color",
      label: "Колір",
      type: "LIST",
      presentation: "TEXT",
      values: [
        { id: "c1", label: "Чорний", count: 1, input: "{}" },
        { id: "c2", label: "Срібний", count: 1, input: "{}" },
      ],
    };

    expect(isSwatchFilter(colors)).toBe(true);
    expect(isSwatchFilter(MEMORY)).toBe(false);
    expect(isSwatchFilter({ ...MEMORY, presentation: "SWATCH" })).toBe(true);
    expect(isSwatchFilter(PRICE)).toBe(false);
  });
});

describe("підписи", () => {
  it("відмінює «товар»", () => {
    expect(productCountLabel(1)).toBe("1 товар");
    expect(productCountLabel(3)).toBe("3 товари");
    expect(productCountLabel(9)).toBe("9 товарів");
    expect(productCountLabel(21)).toBe("21 товар");
  });

  it("підписує чип назвою групи і значенням", () => {
    const available = [PRICE, MEMORY, AVAILABILITY];

    expect(
      filterLabel({ variantOption: { name: "Пам'ять", value: "256 ГБ" } }, available, "UAH"),
    ).toBe("Пам'ять: 256 ГБ");
    expect(filterLabel({ available: true }, available, "UAH")).toBe("В наявності");
    expect(spaces(filterLabel({ price: { min: 30000, max: 70000 } }, available, "UAH"))).toBe(
      "Ціна: 30 000 ₴ – 70 000 ₴",
    );
    expect(spaces(filterLabel({ price: { min: 30000 } }, available, "UAH"))).toBe(
      "Ціна: від 30 000 ₴",
    );
    expect(spaces(filterLabel({ price: { max: 70000 } }, available, "UAH"))).toBe(
      "Ціна: до 70 000 ₴",
    );
  });

  it("підписує фільтр, якого магазин уже не пропонує", () => {
    expect(filterLabel({ variantOption: { name: "Колір", value: "Чорний" } }, [], "UAH")).toBe(
      "Колір: Чорний",
    );
    expect(filterLabel({ available: false }, [], "UAH")).toBe("Немає в наявності");
    expect(filterLabel({ tag: "sale" }, [], "UAH")).toBe("sale");
  });

  it("чип прибирає лише свій фільтр, «скинути все» лишає сортування", () => {
    const state = parseCollectionParams(
      new URLSearchParams(
        "filter.v.price.gte=100&filter.v.availability=1&sort_by=price-ascending&after=abc",
      ),
    );

    const { chips, clearHref } = activeFilterChips(state, [AVAILABILITY], "UAH", "/collections/x");

    expect(chips.map((chip) => spaces(chip.label))).toEqual(["Ціна: від 100 ₴", "В наявності"]);
    expect(chips[0]?.href).toBe("/collections/x?filter.v.availability=1&sort_by=price-ascending");
    expect(chips[1]?.href).toBe("/collections/x?filter.v.price.gte=100&sort_by=price-ascending");
    expect(clearHref).toBe("/collections/x?sort_by=price-ascending");
  });

  it("без сортування «скинути все» веде на чисту адресу", () => {
    const state = parseCollectionParams(new URLSearchParams("filter.v.price.lte=400"));

    const { chips, clearHref } = activeFilterChips(state, [], "UAH", "/collections/x");

    expect(chips[0]?.href).toBe("/collections/x");
    expect(clearHref).toBe("/collections/x");
  });
});

describe("SEO", () => {
  it("title до 60 символів", () => {
    expect(collectionSeo({ title: "iPhone" }, "Ionov Store").title).toBe(
      "iPhone — купити у Вінниці | Ionov Store",
    );

    const long = collectionSeo(
      { title: "Захисне скло, чохли та зарядні пристрої для iPhone 17 Pro" },
      "Ionov Store",
    ).title;
    expect(long.length).toBeLessThanOrEqual(60);
  });

  it("description бере SEO-поле, далі опис, далі запасний текст", () => {
    expect(
      collectionSeo(
        { title: "Mac", description: "Опис", seo: { description: "SEO-опис" } },
        "Ionov Store",
      ).description,
    ).toBe("SEO-опис");
    expect(collectionSeo({ title: "Mac", description: "Опис" }, "Ionov Store").description).toBe(
      "Опис",
    );

    const fallback = collectionSeo({ title: "Mac", description: "" }, "Ionov Store").description;
    expect(fallback).toContain("Mac у магазині Ionov Store");
    expect(fallback.length).toBeLessThanOrEqual(155);
  });

  it("обрізає по межі слова", () => {
    expect(truncateText("один два три чотири", 12)).toBe("один два…");
    expect(truncateText("  коротко  ", 20)).toBe("коротко");
  });
});

describe("dropSingleValueFilters", () => {
  const list = (id: string, labels: string[]): CollectionFilter => ({
    id,
    label: id,
    type: "LIST",
    values: labels.map((label) => ({
      id: `${id}.${label}`,
      label,
      count: 1,
      input: JSON.stringify({ productType: label }),
    })),
  });
  const price: CollectionFilter = { id: "price", label: "Ціна", type: "PRICE_RANGE", values: [] };

  it("прибирає список з одним значенням, а ціну й справжній вибір лишає", () => {
    const filters = [price, list("type", ["Смартфони"]), list("memory", ["128 ГБ", "256 ГБ"])];

    expect(dropSingleValueFilters(filters, []).map((filter) => filter.id)).toEqual([
      "price",
      "memory",
    ]);
  });

  it("лишає групу з одним значенням, якщо воно ввімкнене: його має бути видно, щоб зняти", () => {
    const filters = [list("type", ["Смартфони"])];

    expect(dropSingleValueFilters(filters, [{ productType: "Смартфони" }])).toHaveLength(1);
  });
});

describe("onlyAvailableOption", () => {
  const availability: CollectionFilter = {
    id: "filter.v.availability",
    label: "Доступність",
    type: "LIST",
    values: [
      { id: "in", label: "Є в наявності", count: 5, input: JSON.stringify({ available: true }) },
      {
        id: "out",
        label: "Немає в наявності",
        count: 1,
        input: JSON.stringify({ available: false }),
      },
    ],
  };

  it("лишає тільки «Є в наявності»: «немає» в Shopify означає «розпродано хоч один варіант»", () => {
    const [filter] = onlyAvailableOption([availability], []);

    expect(filter?.values.map((value) => value.label)).toEqual(["Є в наявності"]);
  });

  it("увімкнене з адреси «Немає в наявності» лишається, щоб його можна було зняти", () => {
    const [filter] = onlyAvailableOption([availability], [{ available: false }]);

    expect(filter?.values).toHaveLength(2);
  });

  it("група з одним прапорцем доступності не зникає як «список з одним значенням»", () => {
    const filters = onlyAvailableOption([availability], []);

    expect(dropSingleValueFilters(filters, [])).toHaveLength(1);
  });

  it("інших фільтрів не чіпає", () => {
    const memory: CollectionFilter = {
      id: "memory",
      label: "Пам'ять",
      type: "LIST",
      values: [{ id: "256", label: "256 ГБ", count: 2, input: JSON.stringify({ tag: "256" }) }],
    };

    expect(onlyAvailableOption([memory], [])[0]).toBe(memory);
  });
});
