import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import { cn } from "~/lib/utils";

import { CategoryBentoTile, productCountLabel, type BentoCategory } from "./category-bento-tile";

export type CategoryBentoProps = Omit<SectionProps, "id" | "children"> & {
  /** Перша категорія (iPhone) стає ink-плиткою на дві колонки. */
  categories: readonly BentoCategory[];
  /** Кількість товарів у всьому каталозі для посилання «Увесь каталог». */
  totalProducts: number;
  id?: string;
  title?: string;
  /** Куди веде «Увесь каталог». */
  catalogTo?: string;
};

/**
 * Сітка: 2 колонки на мобільному, 4 — від lg. Велика плитка займає дві клітинки.
 * Якщо останній ряд виходить неповним, остання плитка розтягується на вільні клітинки.
 */
const LG_COLUMNS = 4;
const LAST_SPAN_LG = ["lg:col-span-1", "lg:col-span-2", "lg:col-span-3", "lg:col-span-4"];

function lastTileSpan(count: number): string {
  const regular = count - 1;
  const mobile = regular % 2 === 1 ? "col-span-2" : "col-span-1";
  const filled = (count + 1) % LG_COLUMNS;
  const free = filled === 0 ? 0 : LG_COLUMNS - filled;
  return cn(mobile, LAST_SPAN_LG[free]);
}

/** «Каталог техніки Apple»: bento-сітка категорій із лічильниками та цінами «від». */
export function CategoryBento({
  categories,
  totalProducts,
  id = "catalog",
  title = "Каталог техніки Apple",
  catalogTo = "/collections",
  ...props
}: CategoryBentoProps) {
  if (categories.length === 0) return null;

  return (
    <Section id={id} data-slot="category-bento" {...props}>
      <SectionHeader
        sectionId={id}
        title={title}
        link={{ title: `Увесь каталог: ${productCountLabel(totalProducts)}`, to: catalogTo }}
      />
      <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {categories.map((category, index) => {
          const featured = index === 0;
          const last = index === categories.length - 1;

          return (
            <li
              key={category.to}
              className={cn(
                "min-w-0",
                featured && "col-span-2",
                !featured && last && lastTileSpan(categories.length),
              )}
            >
              <CategoryBentoTile category={category} featured={featured} />
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
