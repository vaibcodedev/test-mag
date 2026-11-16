import { describe, expect, it } from "vitest";

import { DEMO_PREDICTIVE_EMPTY, DEMO_PREDICTIVE_RESULT } from "~/components/search/search.fixtures";

import { buildPredictiveOptions, searchPageUrl } from "./predictive-options";

const build = (typedTerm = "iphone") =>
  buildPredictiveOptions(DEMO_PREDICTIVE_RESULT.items, {
    idPrefix: "p",
    resultTerm: "iphone",
    typedTerm,
  });

describe("buildPredictiveOptions", () => {
  it("групує підказки: запити, товари, категорії", () => {
    const { groups } = build();

    expect(groups.map((group) => [group.key, group.heading, group.options.length])).toEqual([
      ["queries", "Часто шукають", 1],
      ["products", "Товари", 2],
      ["collections", "Категорії", 1],
    ]);
  });

  it("товар несе фото й ціну першого доступного варіанта", () => {
    const product = build().groups[1]?.options[0];

    expect(product).toMatchObject({
      id: "p-product-0",
      kind: "product",
      title: "iPhone 17 Pro 256 ГБ, синій титан",
      price: { amount: "64999.0", currencyCode: "UAH" },
    });
    expect(product?.image?.url).toContain("cdn.shopify.com");
  });

  it("адреси зберігають trackingParameters і запит", () => {
    const { groups } = build();
    const [queries, products, collections] = groups;

    expect(queries?.options[0]?.href).toBe("/search?q=iphone+17+pro");
    const productUrl = new URL(products?.options[0]?.href ?? "", "https://sad.example");
    expect(productUrl.pathname).toBe("/products/iphone-17-pro-256-blue");
    expect(productUrl.searchParams.get("_pos")).toBe("1");
    expect(productUrl.searchParams.get("q")).toBe("iphone");
    expect(collections?.options[0]?.href).toContain("/collections/iphone");
  });

  it("рядок усіх результатів іде останнім і бере те, що зараз у полі", () => {
    const { flat, all } = build("  iphone 17 ");

    expect(all).toMatchObject({
      id: "p-all",
      kind: "all",
      title: "Усі результати за запитом «iphone 17»",
      href: "/search?q=iphone+17",
    });
    expect(flat).toHaveLength(5);
    expect(flat.at(-1)).toBe(all);
    expect(flat.map((option) => option.kind)).toEqual([
      "query",
      "product",
      "product",
      "collection",
      "all",
    ]);
  });

  it("порожня відповідь: груп немає; порожнє поле: немає й рядка усіх результатів", () => {
    const empty = buildPredictiveOptions(DEMO_PREDICTIVE_EMPTY.items, {
      idPrefix: "p",
      resultTerm: "zzzz",
      typedTerm: "zzzz",
    });
    expect(empty.groups).toEqual([]);
    expect(empty.flat).toHaveLength(1);

    const blank = buildPredictiveOptions(DEMO_PREDICTIVE_EMPTY.items, {
      idPrefix: "p",
      resultTerm: "",
      typedTerm: "   ",
    });
    expect(blank.all).toBeNull();
    expect(blank.flat).toEqual([]);
  });
});

describe("searchPageUrl", () => {
  it("кодує запит у параметр q", () => {
    expect(searchPageUrl("чохол iphone")).toBe("/search?q=%D1%87%D0%BE%D1%85%D0%BE%D0%BB+iphone");
  });
});
