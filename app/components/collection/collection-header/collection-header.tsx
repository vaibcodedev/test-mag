import type { ComponentProps } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "~/components/layout/breadcrumbs";
import { cn } from "~/lib/utils";

/** Крихта шапки каталогу: та сама форма, що в спільних Breadcrumbs. */
export type Crumb = BreadcrumbItem;

export type CollectionHeaderProps = Omit<ComponentProps<"header">, "title" | "children"> & {
  crumbs: readonly Crumb[];
  /** Єдиний h1 сторінки. */
  title: string;
  description?: string | null;
  /** Готовий підпис кількості: «96 товарів». */
  count?: string | null;
};

/** Шапка сторінки каталогу: крихти, h1, опис і кількість товарів. */
export function CollectionHeader({
  crumbs,
  title,
  description,
  count,
  className,
  ...props
}: CollectionHeaderProps) {
  return (
    <header
      data-slot="collection-header"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <Breadcrumbs items={crumbs} className="-my-2" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 data-vt-detail="text" className="w-fit text-h2 wrap-anywhere text-ink">
            {title}
          </h1>
          {count ? (
            <p data-slot="collection-count" className="text-body text-muted-foreground">
              {count}
            </p>
          ) : null}
        </div>
        {description ? <p className="max-w-3xl text-body text-ink-2">{description}</p> : null}
      </div>
    </header>
  );
}
