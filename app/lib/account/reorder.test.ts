import { describe, expect, it } from "vitest";

import {
  buildReorderPlan,
  reorderFailure,
  reorderOutcome,
  reorderVariantIds,
  skippedSummary,
  type ReorderOrderLine,
  type ReorderVariant,
} from "./reorder";

function variant(id: number, overrides: Partial<ReorderVariant> = {}): ReorderVariant {
  return {
    id: `gid://shopify/ProductVariant/${id}`,
    availableForSale: true,
    title: "256 ГБ / синій",
    price: { amount: "64999.0", currencyCode: "UAH" },
    image: null,
    selectedOptions: [{ name: "Пам'ять", value: "256 ГБ" }],
    product: { title: `Товар ${id}`, handle: `product-${id}` },
    ...overrides,
  };
}

function line(
  title: string,
  variantId: number | null,
  quantity = 1,
  variantTitle?: string,
): ReorderOrderLine {
  return {
    title,
    quantity,
    variantTitle,
    variantId: variantId === null ? null : `gid://shopify/ProductVariant/${variantId}`,
  };
}

describe("reorderVariantIds", () => {
  it("збирає варіанти без повторів і без позицій, у яких варіанта немає", () => {
    expect(
      reorderVariantIds([line("A", 1), line("B", 2), line("A ще раз", 1), line("Послуга", null)]),
    ).toEqual(["gid://shopify/ProductVariant/1", "gid://shopify/ProductVariant/2"]);
  });
});

describe("buildReorderPlan", () => {
  it("переносить позиції в рядки кошика з тими самими кількостями", () => {
    const plan = buildReorderPlan(
      [line("iPhone", 1), line("Чохол", 2, 3)],
      [variant(1), variant(2)],
    );

    expect(plan.skipped).toEqual([]);
    expect(plan.lines.map(({ merchandiseId, quantity }) => ({ merchandiseId, quantity }))).toEqual([
      { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 },
      { merchandiseId: "gid://shopify/ProductVariant/2", quantity: 3 },
    ]);
    expect(plan.lines[0]?.preview).toEqual({
      id: "gid://shopify/ProductVariant/1",
      price: { amount: "64999.0", currencyCode: "UAH" },
      title: "256 ГБ / синій",
      image: null,
      selectedOptions: [{ name: "Пам'ять", value: "256 ГБ" }],
      product: { title: "Товар 1", handle: "product-1" },
    });
  });

  it("зливає позиції з тим самим варіантом в один рядок", () => {
    const plan = buildReorderPlan([line("Кабель", 5, 2), line("Кабель", 5, 1)], [variant(5)]);

    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0]?.quantity).toBe(3);
  });

  it("пропускає розпродані, зняті з продажу й позиції без варіанта — кожну зі своєю причиною", () => {
    const plan = buildReorderPlan(
      [
        line("iPhone", 1),
        line("Годинник", 2, 1, "46 мм"),
        line("Навушники", 3, 1, "Default Title"),
        line("Налаштування пристрою", null),
        line("Повернений товар", 1, 0),
      ],
      // Варіанта 3 вітрина не знає: на його місці null.
      [variant(1), variant(2, { availableForSale: false }), null],
    );

    expect(plan.lines.map((item) => item.merchandiseId)).toEqual([
      "gid://shopify/ProductVariant/1",
    ]);
    expect(plan.skipped).toEqual([
      { title: "Годинник (46 мм)", reason: "sold-out" },
      { title: "Навушники", reason: "gone" },
      { title: "Налаштування пристрою", reason: "gone" },
    ]);
  });
});

describe("skippedSummary", () => {
  it("називає позиції за причинами й узгоджує число", () => {
    expect(
      skippedSummary([
        { title: "A", reason: "sold-out" },
        { title: "B", reason: "gone" },
        { title: "C", reason: "gone" },
      ]),
    ).toBe("Закінчився: «A». Більше не продаються: «B», «C».");
  });

  it("довгий перелік обрізає до трьох назв", () => {
    const skipped = ["A", "B", "C", "D", "E"].map((title) => ({
      title,
      reason: "sold-out" as const,
    }));

    expect(skippedSummary(skipped)).toBe("Закінчились: «A», «B», «C» та ще 2.");
  });

  it("без пропущених позицій повертає порожній рядок", () => {
    expect(skippedSummary([])).toBe("");
  });
});

describe("reorderOutcome", () => {
  const full = buildReorderPlan([line("iPhone", 1)], [variant(1)]);
  const partial = buildReorderPlan(
    [line("iPhone", 1), line("Годинник", 2)],
    [variant(1), variant(2, { availableForSale: false })],
  );
  const nothing = buildReorderPlan(
    [line("Годинник", 2), line("Чохол", 3)],
    [variant(2, { availableForSale: false }), null],
  );

  it("усе додано: відкриває кошик", () => {
    expect(reorderOutcome(full, "added")).toEqual({
      openCart: true,
      message: { tone: "success", title: "Товари додано в кошик" },
    });
  });

  it("додано частину: відкриває кошик і називає пропущене", () => {
    expect(reorderOutcome(partial, "added")).toEqual({
      openCart: true,
      message: {
        tone: "warning",
        title: "Додано не все",
        description: "Закінчився: «Годинник». Решта вже в кошику.",
      },
    });
  });

  it("нічого додати не можна: кошик не відкриває й пояснює чому", () => {
    const outcome = reorderOutcome(nothing, "added");

    expect(outcome.openCart).toBe(false);
    expect(outcome.message).toEqual({
      tone: "error",
      title: "Нічого не додано",
      description:
        "Жодного товару з цього замовлення зараз не купити. Закінчився: «Годинник». Більше не продається: «Чохол».",
    });
  });

  it("замовлення без позицій теж не відкриває кошик", () => {
    const outcome = reorderOutcome({ lines: [], skipped: [] }, "added");

    expect(outcome.openCart).toBe(false);
    expect(outcome.message.description).toBe(
      "У цьому замовленні немає товарів, які можна додати в кошик.",
    );
  });

  it("попередження кошика про кількість: відкриває кошик і просить перевірити", () => {
    const outcome = reorderOutcome(partial, "limited");

    expect(outcome.openCart).toBe(true);
    expect(outcome.message.tone).toBe("warning");
    expect(outcome.message.description).toBe(
      "Частини товарів немає в потрібній кількості — перевірте кошик. Закінчився: «Годинник».",
    );
  });

  it.each(["rejected", "not-ready", "network", "signed-out"] as const)(
    "збій «%s»: кошик не відкриває, повідомлення українською",
    (result) => {
      const outcome = reorderOutcome(full, result);

      expect(outcome).toEqual(reorderFailure(result));
      expect(outcome.openCart).toBe(false);
      expect(outcome.message.tone).toBe("error");
      expect(outcome.message.title).toMatch(/[а-яіїєґ]/i);
    },
  );
});
