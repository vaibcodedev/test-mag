import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import type { ActiveFilterChip } from "~/lib/shopify/collection";
import { cn } from "~/lib/utils";

export type ActiveFiltersProps = Omit<ComponentProps<"div">, "children"> & {
  /** Увімкнені фільтри; посилання кожного чипа прибирає лише його. */
  chips: readonly ActiveFilterChip[];
  /** Адреса колекції без фільтрів. */
  clearHref: string;
};

/** Увімкнені фільтри чипами. Це звичайні посилання, тож працюють і без JavaScript. */
export function ActiveFilters({ chips, clearHref, className, ...props }: ActiveFiltersProps) {
  if (chips.length === 0) return null;

  return (
    <div
      data-slot="active-filters"
      role="group"
      aria-label="Увімкнені фільтри"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      <ul role="list" className="contents">
        {chips.map((chip) => (
          <li key={chip.key} className="min-w-0">
            <Button asChild variant="surface" size="sm" className="max-w-full font-medium">
              <Link
                to={chip.href}
                preventScrollReset
                aria-label={`Прибрати фільтр «${chip.label}»`}
              >
                <span className="truncate">{chip.label}</span>
                <X aria-hidden="true" strokeWidth={2} className="size-4 text-muted-foreground" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      <Button asChild variant="link" size="sm" className="min-h-11 px-2">
        <Link to={clearHref} preventScrollReset>
          Скинути все
        </Link>
      </Button>
    </div>
  );
}
