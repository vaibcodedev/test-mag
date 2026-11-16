import { Fragment, type ComponentProps } from "react";
import { Link } from "react-router";

import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbListItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { cn } from "~/lib/utils";

export type BreadcrumbItem = {
  title: string;
  /** Шлях на сайті. Остання крихта — поточна сторінка, посиланням не стає. */
  to: string;
};

export type BreadcrumbsProps = Omit<ComponentProps<"nav">, "children"> & {
  /** Від головної до поточної сторінки. */
  items: readonly BreadcrumbItem[];
};

/** Хлібні крихти: шлях від головної до поточної сторінки. */
export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const lastIndex = items.length - 1;

  return (
    <Breadcrumb
      aria-label="Хлібні крихти"
      data-slot="breadcrumbs"
      className={cn("min-w-0", className)}
      {...props}
    >
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={item.to}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbListItem>
              {index === lastIndex ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.to} prefetch="intent">
                    {item.title}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbListItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
