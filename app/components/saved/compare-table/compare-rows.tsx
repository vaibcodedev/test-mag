import type { ReactNode } from "react";

import { StockStatus } from "~/components/product/stock-status";
import { USED_WARRANTY_MONTHS } from "~/components/product/used-grade";
import { Price } from "~/components/ui/price";
import { formatPrice, plural } from "~/lib/format";
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

/**
 * Рядки таблиці порівняння. Рядок, для якого в жодного товару немає даних
 * (стан і акумулятор у нової техніки, порожні метаполя), у таблицю не потрапляє.
 */
export function buildCompareRows(products: readonly SavedProduct[]): CompareRow[] {
  const rows: CompareRow[] = [
    row(
      "price",
      "Ціна",
      products.map((product) => ({
        key: `${formatPrice(product.price)}|${product.compareAtPrice?.amount ?? ""}`,
        content: (
          <Price
            price={product.price}
            compareAt={product.availableForSale ? product.compareAtPrice : null}
          />
        ),
      })),
    ),
    row(
      "availability",
      "Наявність",
      products.map((product) => ({
        key: String(product.availableForSale),
        content: <StockStatus available={product.availableForSale} delivery={product.delivery} />,
      })),
    ),
  ];

  // Опції товарів («Пам'ять», «Колір») у порядку першої появи.
  const optionNames = [
    ...new Set(products.flatMap((product) => product.options.map((option) => option.name))),
  ];
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
        "specs",
        "Характеристики",
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
        "battery",
        "Акумулятор",
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

  if (products.some((product) => product.vendor)) {
    rows.push(
      row(
        "vendor",
        "Виробник",
        products.map((product) => text(product.vendor)),
      ),
    );
  }
  if (products.some((product) => product.productType)) {
    rows.push(
      row(
        "type",
        "Тип",
        products.map((product) => text(product.productType)),
      ),
    );
  }

  return rows;
}
