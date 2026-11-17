import type { ReactNode } from "react";

import { StockStatus } from "~/components/product/stock-status";
import { USED_WARRANTY_MONTHS } from "~/components/product/used-grade";
import type { CompareCategory } from "~/lib/compare/spec-schema";
import { plural } from "~/lib/format";
import type { SavedProduct } from "~/lib/saved-lists";

/** TODO(реальний магазин): строк гарантії на нову техніку брати з налаштувань магазину. */
export const NEW_WARRANTY_MONTHS = 12;

export type CompareCell = {
  /** Значення для порівняння: рядок відрізняється, якщо ключі в клітинках різні. */
  key: string;
  content: ReactNode;
};

export type CompareRow = {
  id: string;
  label: string;
  cells: CompareCell[];
  differs: boolean;
};

/** Група рядків із заголовком: «Екран», «Камера», «Корпус». */
export type CompareSection = {
  id: string;
  title: string;
  rows: CompareRow[];
};

const COLOR_OPTION_NAME = /colou?r|кол[іь]р|цвет/i;

const EMPTY_CELL: CompareCell = {
  key: "",
  content: (
    <span className="text-muted-foreground">
      <span aria-hidden="true">—</span>
      <span className="sr-only">немає даних</span>
    </span>
  ),
};

function text(value: string | null | undefined): CompareCell {
  return value ? { key: value, content: value } : EMPTY_CELL;
}

function months(count: number) {
  return `${count} ${plural(count, { one: "місяць", few: "місяці", many: "місяців" })}`;
}

function row(id: string, label: string, cells: CompareCell[]): CompareRow {
  return { id, label, cells, differs: new Set(cells.map((cell) => cell.key)).size > 1 };
}

/** «Загальне»: наявність, кольори, стан вживаної техніки, гарантія. */
function generalRows(products: readonly SavedProduct[]): CompareRow[] {
  const rows: CompareRow[] = [
    row(
      "availability",
      "Наявність",
      products.map((product) => ({
        key: String(product.availableForSale),
        content: <StockStatus available={product.availableForSale} delivery={product.delivery} />,
      })),
    ),
  ];

  const colors = products.map(
    (product) => product.options.find((option) => COLOR_OPTION_NAME.test(option.name))?.values,
  );
  if (colors.some((values) => values && values.length > 0)) {
    rows.push(
      row(
        "colors",
        "Кольори",
        colors.map((values) => text(values?.join(", "))),
      ),
    );
  }

  if (products.some((product) => product.used)) {
    rows.push(
      row(
        "condition",
        "Стан",
        products.map((product) => text(product.used ? product.used.grade : "Новий")),
      ),
    );
  }

  if (products.some((product) => typeof product.used?.batteryHealth === "number")) {
    rows.push(
      row(
        "battery-health",
        "Стан акумулятора",
        products.map((product) => {
          const health = product.used?.batteryHealth;
          return text(typeof health === "number" ? `${Math.round(health)}%` : null);
        }),
      ),
    );
  }

  rows.push(
    row(
      "warranty",
      "Гарантія",
      products.map((product) =>
        text(months(product.used ? USED_WARRANTY_MONTHS : NEW_WARRANTY_MONTHS)),
      ),
    ),
  );

  return rows;
}

/**
 * Запасні рядки для товарів без метаполя custom.specs: опції товару («Пам'ять»,
 * «Конфігурація») і короткі характеристики з custom.short_specs.
 */
function fallbackRows(products: readonly SavedProduct[]): CompareRow[] {
  const rows: CompareRow[] = [];

  const optionNames = [
    ...new Set(products.flatMap((product) => product.options.map((option) => option.name))),
  ].filter((name) => !COLOR_OPTION_NAME.test(name));
  for (const name of optionNames) {
    rows.push(
      row(
        `option-${name}`,
        name,
        products.map((product) =>
          text(product.options.find((option) => option.name === name)?.values.join(", ")),
        ),
      ),
    );
  }

  if (products.some((product) => product.shortSpecs.length > 0)) {
    rows.push(
      row(
        "short-specs",
        "Головне",
        products.map((product) =>
          product.shortSpecs.length > 0
            ? {
                key: product.shortSpecs.join("|"),
                content: (
                  <ul role="list" className="flex flex-col gap-1">
                    {product.shortSpecs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                ),
              }
            : EMPTY_CELL,
        ),
      ),
    );
  }

  return rows;
}

/**
 * Рядки таблиці порівняння для товарів однієї категорії, згруповані за схемою категорії.
 * Рядок, для якого в жодного товару немає даних, у таблицю не потрапляє; порожня група теж.
 */
export function buildCompareSections(
  products: readonly SavedProduct[],
  category: CompareCategory,
): CompareSection[] {
  const sections: CompareSection[] = [
    { id: "general", title: "Загальне", rows: generalRows(products) },
  ];

  for (const group of category.groups) {
    const rows = group.rows
      .filter((spec) => products.some((product) => product.specs[spec.key]))
      .map((spec) =>
        row(
          `spec-${spec.key}`,
          spec.label,
          products.map((product) => text(product.specs[spec.key])),
        ),
      );
    if (rows.length > 0) sections.push({ id: `group-${group.title}`, title: group.title, rows });
  }

  // Характеристик у магазині ще немає: показуємо те, що є в самому товарі.
  if (sections.length === 1) {
    const rows = fallbackRows(products);
    if (rows.length > 0) sections.push({ id: "fallback", title: "Характеристики", rows });
  }

  return sections;
}
