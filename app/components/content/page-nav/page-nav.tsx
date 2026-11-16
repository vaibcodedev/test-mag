import type { ComponentProps } from "react";
import { Link } from "react-router";

import { Card } from "~/components/ui/card";
import { Item, ItemContent, ItemGroup, ItemTitle } from "~/components/ui/item";
import { cn } from "~/lib/utils";

export type PageNavLink = { title: string; to: string };

export type PageNavProps = Omit<ComponentProps<"nav">, "children"> & {
  links: readonly PageNavLink[];
  /** Шлях поточної сторінки: «/pages/warranty». */
  current?: string;
  /** Назва навігації для скринрідерів. */
  label?: string;
};

/**
 * Навігація між сусідніми сервісними сторінками: картка з рядками-посиланнями.
 * На телефоні рядки стоять в один ряд із горизонтальною прокруткою, на широкому екрані —
 * стовпчиком у бічній колонці. Поточна сторінка — рядок на page-тлі з aria-current.
 */
export function PageNav({
  links,
  current,
  label = "Сервісні сторінки",
  className,
  ...props
}: PageNavProps) {
  if (links.length === 0) return null;

  return (
    <Card asChild padding="none" className={cn("p-1", className)}>
      <nav aria-label={label} data-slot="page-nav" {...props}>
        <ItemGroup
          asChild
          className="flex-row gap-1 overflow-x-auto p-1 lg:flex-col lg:overflow-visible"
        >
          <ul role="list">
            {links.map((link) => {
              const active = link.to === current;

              return (
                <li key={link.to} className="shrink-0">
                  <Item
                    asChild
                    size="sm"
                    variant={active ? "muted" : "default"}
                    className="whitespace-nowrap"
                  >
                    <Link to={link.to} prefetch="intent" aria-current={active ? "page" : undefined}>
                      <ItemContent>
                        <ItemTitle>{link.title}</ItemTitle>
                      </ItemContent>
                    </Link>
                  </Item>
                </li>
              );
            })}
          </ul>
        </ItemGroup>
      </nav>
    </Card>
  );
}
