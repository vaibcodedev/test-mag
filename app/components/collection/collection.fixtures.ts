import { demoImage } from "~/components/home/home.fixtures";
import type { CollectionFilter } from "~/lib/shopify/collection";

/**
 * Демо-дані каталогу для історій Storybook і тестів.
 * Форма повторює відповідь Storefront API: `input` — JSON-рядок ProductFilter,
 * як його віддає `collection.products.filters`.
 */

function listValue(
  id: string,
  label: string,
  count: number,
  input: object,
  color?: string,
): CollectionFilter["values"][number] {
  return {
    id,
    label,
    count,
    input: JSON.stringify(input),
    swatch: color ? { color, image: null } : null,
  };
}

const memory = (label: string, count: number) =>
  listValue(`filter.v.option.memory.${label}`, label, count, {
    variantOption: { name: "Пам'ять", value: label },
  });

const color = (label: string, count: number, hex?: string) =>
  listValue(
    `filter.v.option.color.${label}`,
    label,
    count,
    { variantOption: { name: "Колір", value: label } },
    hex,
  );

const condition = (label: string, count: number) =>
  listValue(`filter.p.m.custom.condition_grade.${label}`, label, count, {
    productMetafield: { namespace: "custom", key: "condition_grade", value: label },
  });

export const DEMO_PRICE_CEILING = 120000;

export const DEMO_FILTERS: CollectionFilter[] = [
  {
    id: "filter.v.price",
    label: "Ціна",
    type: "PRICE_RANGE",
    presentation: null,
    values: [
      {
        id: "filter.v.price",
        label: "Ціна",
        count: 96,
        input: JSON.stringify({ price: { min: 0, max: DEMO_PRICE_CEILING } }),
      },
    ],
  },
  {
    id: "filter.v.availability",
    label: "Наявність",
    type: "LIST",
    presentation: "TEXT",
    values: [
      listValue("filter.v.availability.1", "В наявності", 88, { available: true }),
      listValue("filter.v.availability.0", "Немає в наявності", 8, { available: false }),
    ],
  },
  {
    id: "filter.v.option.memory",
    label: "Пам'ять",
    type: "LIST",
    presentation: "TEXT",
    values: [memory("128 ГБ", 24), memory("256 ГБ", 38), memory("512 ГБ", 22), memory("1 ТБ", 0)],
  },
  {
    id: "filter.v.option.color",
    label: "Колір",
    type: "LIST",
    presentation: "SWATCH",
    values: [
      color("Чорний", 31, "#1d1d1f"),
      color("Срібний", 18, "#e3e4e5"),
      color("Синій титан", 27, "#3c4a5e"),
      // Без swatch із магазину: колір підбирається за назвою.
      color("Рожевий", 9),
    ],
  },
  {
    id: "filter.p.m.custom.condition_grade",
    label: "Стан",
    type: "LIST",
    presentation: "TEXT",
    values: [condition("Як новий", 6), condition("Відмінний", 11), condition("Хороший", 4)],
  },
];

export const DEMO_COLLECTIONS = [
  { handle: "iphone", title: "iPhone", description: "Нові iPhone з гарантією 12 місяців." },
  { handle: "mac", title: "Mac", description: "MacBook Air, MacBook Pro, iMac і Mac mini." },
  { handle: "ipad", title: "iPad", description: "iPad для навчання, роботи й малювання." },
  { handle: "watch", title: "Watch", description: "Apple Watch і ремінці до них." },
  { handle: "airpods", title: "AirPods", description: "" },
  { handle: "used", title: "Вживані", description: "Перевірені пристрої з гарантією 6 місяців." },
].map((collection, index) => ({ ...collection, image: demoImage(index) }));
