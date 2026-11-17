import { SearchX } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";

import { Container } from "~/components/layout/container";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { CATALOG_LINKS, type NavLink } from "~/lib/content/site";

export type NotFoundProps = {
  /** Категорії під повідомленням; типово — увесь каталог. */
  categories?: readonly NavLink[];
};

/** Сторінка 404: що сталося, куди піти далі та популярні категорії. */
export function NotFound({ categories = CATALOG_LINKS }: NotFoundProps) {
  const categoriesTitleId = useId();

  return (
    <Container className="flex flex-col gap-6">
      <Empty data-slot="not-found">
        <EmptyHeader>
          <EmptyMedia>
            <SearchX strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle as="h1">Сторінку не знайдено</EmptyTitle>
          <EmptyDescription>
            Можливо, посилання застаріло або в адресі є помилка. Товар міг закінчитися — перевірте
            каталог або почніть із головної.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link viewTransition to="/" prefetch="intent">
              На головну
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link viewTransition to="/collections" prefetch="intent">
              Перейти до каталогу
            </Link>
          </Button>
        </EmptyContent>
      </Empty>

      {categories.length > 0 ? (
        <nav aria-labelledby={categoriesTitleId} className="flex flex-col gap-4">
          <h2 id={categoriesTitleId} className="text-h3 text-ink">
            Популярні категорії
          </h2>
          <ul role="list" className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.to}>
                <Button asChild variant="surface">
                  <Link viewTransition to={category.to} prefetch="intent">
                    {category.title}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </Container>
  );
}
