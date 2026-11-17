import { describe, expect, it } from "vitest";

import {
  DEFAULT_ORDERS_CHOICE,
  ORDERS_PAGE_SIZE,
  ordersListFiltered,
  ordersListSearch,
  parseOrdersList,
} from "./orders-list";

const NOW = new Date("2026-11-17T12:00:00Z");
const parse = (search: string) => parseOrdersList(new URLSearchParams(search), NOW);

describe("parseOrdersList", () => {
  it("без параметрів: нові замовлення зверху, за весь час, перша сторінка", () => {
    expect(parse("")).toEqual({
      choice: DEFAULT_ORDERS_CHOICE,
      variables: {
        first: ORDERS_PAGE_SIZE,
        after: null,
        sortKey: "PROCESSED_AT",
        reverse: true,
        query: null,
      },
    });
  });

  it("сортування за сумою й період перетворюються на ключ і пошук за датою", () => {
    const { choice, variables } = parse("sort=cheap&period=30d");
    expect(choice).toEqual({ sort: "cheap", period: "30d" });
    expect(variables).toMatchObject({
      sortKey: "TOTAL_PRICE",
      reverse: false,
      query: "processed_at:>=2026-10-18",
    });
  });

  it("курсор «новіші» читає сторінку з кінця", () => {
    expect(parse("before=abc&sort=old").variables).toMatchObject({
      last: ORDERS_PAGE_SIZE,
      before: "abc",
      sortKey: "PROCESSED_AT",
      reverse: false,
    });
  });

  it("невідомі значення стають типовими", () => {
    expect(parse("sort=nope&period=1900").choice).toEqual(DEFAULT_ORDERS_CHOICE);
  });
});

describe("ordersListSearch", () => {
  it("типовий вибір адресу не засмічує", () => {
    expect(ordersListSearch(DEFAULT_ORDERS_CHOICE)).toBe("");
  });

  it("зберігає сортування й період і кодує курсор", () => {
    expect(
      ordersListSearch({ sort: "expensive", period: "1y" }, { name: "after", value: "e=1" }),
    ).toBe("?sort=expensive&period=1y&after=e%3D1");
  });
});

describe("ordersListFiltered", () => {
  it("лише період звужує список; сортування — ні", () => {
    expect(ordersListFiltered({ sort: "cheap", period: "all" })).toBe(false);
    expect(ordersListFiltered({ sort: "new", period: "6m" })).toBe(true);
  });
});
