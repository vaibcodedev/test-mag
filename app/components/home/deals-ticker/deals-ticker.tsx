import { Leaf } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { Item } from "~/components/ui/item";
import { cn } from "~/lib/utils";

export type DealsTickerItem = {
  /** Назва товару: «MacBook Air 13 M4». */
  title: string;
  /** Готовий підпис знижки: «−8%». */
  discount: string;
  to: string;
};

export type DealsTickerProps = Omit<ComponentProps<"div">, "children"> & {
  items: DealsTickerItem[];
  /** Назва списку для скринрідера. */
  label?: string;
};

/** Скільки позицій має бути в половині рядка, щоб на широкому екрані не було порожнечі. */
const MIN_ITEMS_PER_HALF = 8;
/** Анімація зсуває рядок на −50%, тому він складається з двох однакових половин. */
const HALVES = [0, 1] as const;

/**
 * Рухомий рядок знижок на ink. Рух — лише CSS: зупиняється під курсором і коли фокус
 * усередині, а за prefers-reduced-motion рядок стоїть і прокручується вручну.
 * Скринрідер і клавіатура бачать один список; повтори для безшовної петлі приховані.
 */
export function DealsTicker({
  items,
  label = "Знижки тижня одним рядком",
  className,
  ...props
}: DealsTickerProps) {
  if (items.length === 0) return null;

  const copies = Array.from(
    { length: Math.max(1, Math.ceil(MIN_ITEMS_PER_HALF / items.length)) },
    (_, index) => index,
  );

  return (
    <div
      data-slot="deals-ticker"
      className={cn(
        "group/ticker overflow-hidden py-1 motion-reduce:scrollbar-on-ink motion-reduce:overflow-x-auto",
        className,
      )}
      {...props}
    >
      <div className="flex w-max animate-ticker group-focus-within/ticker:[animation-play-state:paused] group-hover/ticker:[animation-play-state:paused] motion-reduce:animate-none">
        {HALVES.map((half) =>
          copies.map((copy) => {
            const duplicate = half > 0 || copy > 0;

            return (
              <ul
                key={`${half}-${copy}`}
                role="list"
                aria-label={duplicate ? undefined : label}
                aria-hidden={duplicate ? "true" : undefined}
                data-duplicate={duplicate ? "true" : undefined}
                className={cn("flex shrink-0 items-center", duplicate && "motion-reduce:hidden")}
              >
                {items.map((item) => (
                  <li key={`${item.to}-${item.title}`} className="flex shrink-0 items-center">
                    <Item
                      asChild
                      variant="on-dark"
                      size="sm"
                      className="w-auto flex-nowrap gap-2 px-4 whitespace-nowrap"
                    >
                      <Link
                        to={item.to}
                        prefetch={duplicate ? "none" : "intent"}
                        tabIndex={duplicate ? -1 : undefined}
                      >
                        {item.title}
                        <span className="sr-only">, знижка</span>
                        <span className="font-semibold text-lime tabular-nums">
                          {item.discount}
                        </span>
                      </Link>
                    </Item>
                    <Leaf
                      aria-hidden="true"
                      strokeWidth={2}
                      className="size-4 shrink-0 text-on-ink-muted"
                    />
                  </li>
                ))}
              </ul>
            );
          }),
        )}
      </div>
    </div>
  );
}
