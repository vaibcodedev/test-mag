import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export type FiltersSheetProps = {
  /** Форма фільтрів: та сама, що в лівій колонці на великих екранах. */
  children: ReactNode;
  /** Скільки фільтрів увімкнено: число на кнопці. */
  activeCount: number;
  /** Готовий підпис кнопки внизу: «Показати 12 товарів». */
  applyLabel: string;
  /** Адреса без фільтрів; без неї «Скинути все» не показується. */
  clearHref?: string | null;
  /** Результати оновлюються: кнопка внизу показує спінер. */
  pending?: boolean;
  className?: string;
};

/**
 * Фільтри на мобільному: кнопка «Фільтри» відкриває шухляду.
 * Фільтри застосовуються одразу, тож кнопка внизу лише закриває шухляду й каже, скільки товарів знайдено.
 */
export function FiltersSheet({
  children,
  activeCount,
  applyLabel,
  clearHref,
  pending = false,
  className,
}: FiltersSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="surface" className={className}>
          <SlidersHorizontal aria-hidden="true" strokeWidth={2} />
          Фільтри
          {activeCount > 0 ? (
            <Badge variant="count">
              <span className="sr-only">увімкнено: </span>
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" data-slot="filters-sheet">
        <SheetHeader>
          <SheetTitle>Фільтри</SheetTitle>
          <SheetDescription>Список товарів оновлюється одразу після вибору.</SheetDescription>
        </SheetHeader>
        <SheetBody className="py-2">{children}</SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button size="lg" loading={pending}>
              {applyLabel}
            </Button>
          </SheetClose>
          {clearHref && activeCount > 0 ? (
            <Button asChild variant="ghost">
              <Link to={clearHref} preventScrollReset>
                Скинути все
              </Link>
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
