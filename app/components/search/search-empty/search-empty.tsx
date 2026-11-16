import { SearchX, Search } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { STORE_INFO } from "~/lib/content/site";
import { cn } from "~/lib/utils";

export type SearchEmptyProps = Omit<ComponentProps<"div">, "children"> & {
  /** Запит, за яким нічого не знайшли. Без нього блок запрошує почати пошук. */
  term?: string;
  /** Популярні категорії: CATALOG_LINKS. */
  categories: ReadonlyArray<{ title: string; to: string }>;
};

/** Порожній стан пошуку: що сталося, як виправити запит і куди піти натомість. */
export function SearchEmpty({ term, categories, className, ...props }: SearchEmptyProps) {
  const notFound = Boolean(term);

  return (
    // size="sm": заголовок на крок менший за h1 сторінки; поля лишаються як у панелі сторінки.
    <Empty
      size="sm"
      className={cn("gap-6 p-8 md:p-12", className)}
      {...props}
      data-slot="search-empty"
    >
      <EmptyHeader>
        <EmptyMedia>
          {notFound ? <SearchX strokeWidth={2} /> : <Search strokeWidth={2} />}
        </EmptyMedia>
        <EmptyTitle>
          {notFound ? `За запитом «${term}» нічого не знайшли` : "Що шукаємо?"}
        </EmptyTitle>
        <EmptyDescription>
          {notFound ? (
            <>
              Перевірте назву або спробуйте коротший запит, наприклад «iPhone» замість повної назви
              моделі. Не виходить —{" "}
              <a
                href={STORE_INFO.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm font-semibold focus-ring"
              >
                напишіть нам у Telegram
              </a>
              , підкажемо за п&apos;ять хвилин.
            </>
          ) : (
            "Введіть назву моделі, наприклад «iPhone 17» або «AirPods», і ми покажемо товари ще під час набору."
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <nav aria-label="Популярні категорії" className="flex flex-col gap-3">
          <p className="text-small font-semibold text-ink">Популярні категорії</p>
          <ul role="list" className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.to}>
                <Button asChild variant="secondary" size="sm" className="min-h-11">
                  <Link to={category.to} prefetch="intent">
                    {category.title}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </EmptyContent>
    </Empty>
  );
}
