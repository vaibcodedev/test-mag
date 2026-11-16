import { LayoutGrid } from "lucide-react";
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
import { cn } from "~/lib/utils";

import { CollectionCard, type CollectionCardData } from "./collection-card";

/** Перший рядок сітки на великому екрані: ці фото вантажаться без lazy. */
const PRIORITY_COUNT = 3;

export type CollectionListProps = Omit<ComponentProps<"ul">, "children"> & {
  collections: readonly CollectionCardData[];
};

/** Сітка колекцій: 1 колонка на телефоні, 2 з sm, 3 з lg. */
export function CollectionList({ collections, className, ...props }: CollectionListProps) {
  if (collections.length === 0) {
    return (
      <Empty size="sm" data-slot="collection-list-empty" className="md:p-10">
        <EmptyHeader>
          <EmptyMedia>
            <LayoutGrid strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Каталог зараз оновлюється</EmptyTitle>
          <EmptyDescription>
            Категорії з&apos;являться за кілька хвилин. А поки подивіться добірки на головній або
            скористайтеся пошуком.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/">На головну</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <ul
      role="list"
      data-slot="collection-list"
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    >
      {collections.map((collection, index) => (
        <li key={collection.handle} className="min-w-0">
          <CollectionCard collection={collection} priority={index < PRIORITY_COUNT} />
        </li>
      ))}
    </ul>
  );
}
