import { useEffect, useRef, useState, type ComponentProps } from "react";

import { lineErrorMessage } from "~/components/cart/cart-errors";
import { ItemGroup } from "~/components/ui/item";
import { useCart, useCartForm } from "~/lib/cart";
import { cn } from "~/lib/utils";

import { CartLine, type CartLineProps } from "./cart-line";

export type CartLinesProps = Omit<ComponentProps<"ul">, "children"> &
  Pick<CartLineProps, "emptyCartFocusId" | "headingLevel">;

type Line = CartLineProps["line"];
/** Рядок, якого в кошику вже немає, і місце, де він стояв. */
export type LeavingLine = { line: Line; index: number };

/** Скільки прибраний рядок згортається на екрані (як duration-300 у CartLine). */
export const LEAVING_MS = 300;

/** Рядки, які були в попередньому списку й зникли з нового, разом зі своїми місцями. */
export function removedLines(previous: readonly Line[], current: readonly Line[]): LeavingLine[] {
  const ids = new Set(current.map((line) => line.id));
  return previous.map((line, index) => ({ line, index })).filter(({ line }) => !ids.has(line.id));
}

/** Поточні рядки кошика плюс прибрані на своїх колишніх місцях. */
export function withLeaving(current: readonly Line[], leaving: readonly LeavingLine[]): Line[] {
  const ids = new Set(current.map((line) => line.id));
  const merged = [...current];
  for (const { line, index } of [...leaving].sort((a, b) => a.index - b.index)) {
    // Товар повернули в кошик, поки рядок згортався: показуємо справжній рядок.
    if (ids.has(line.id)) continue;
    merged.splice(Math.min(index, merged.length), 0, line);
  }
  return merged;
}

/**
 * Список рядків кошика зі стору Hydrogen: спільний для бічної панелі та сторінки /cart.
 * Кошик прибирає рядок одразу (оптимістично). Щоб товар не зникав ривком, прибраний рядок
 * ще LEAVING_MS лишається в списку з позначкою data-leaving і плавно згортається.
 */
export function CartLines({ emptyCartFocusId, headingLevel, className, ...props }: CartLinesProps) {
  const form = useCartForm();
  const lines = useCart((state) => state.data.lines.nodes);
  const pendingLines = useCart((state) => state.pending.lines);
  const lineErrors = useCart((state) => state.errors.lines);

  // Порівнюємо списки під час рендеру: прибраний рядок має лишитися в тому самому оновленні
  // DOM, у якому зник із кошика, інакше він розмонтується й згортатися буде нічому.
  const [previous, setPrevious] = useState(lines);
  const [leaving, setLeaving] = useState<readonly LeavingLine[]>([]);
  if (previous !== lines) {
    const removed = removedLines(previous, lines);
    setPrevious(lines);
    if (removed.length > 0) setLeaving((current) => [...current, ...removed]);
  }

  // Кожен прибраний рядок зникає остаточно через LEAVING_MS після появи в списку.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    for (const { line } of leaving) {
      if (timers.current.has(line.id)) continue;
      timers.current.set(
        line.id,
        setTimeout(() => {
          timers.current.delete(line.id);
          setLeaving((current) => current.filter((item) => item.line.id !== line.id));
        }, LEAVING_MS),
      );
    }
  }, [leaving]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
    };
  }, []);

  const currentIds = new Set(lines.map((line) => line.id));

  return (
    <ItemGroup asChild className={cn("gap-0 divide-y divide-line", className)}>
      <ul role="list" data-slot="cart-lines" {...props}>
        {withLeaving(lines, leaving).map((line) => {
          const gone = !currentIds.has(line.id);

          return (
            <CartLine
              key={line.id}
              line={line}
              form={form}
              pending={pendingLines.has(line.id)}
              error={gone ? null : lineErrorMessage(lineErrors.get(line.id))}
              emptyCartFocusId={emptyCartFocusId}
              headingLevel={headingLevel}
              // Прибраний рядок уже не частина кошика: недоступний ні для фокуса,
              // ні для читача екрана, і тести його рядком кошика не вважають.
              {...(gone
                ? {
                    "data-leaving": "",
                    "data-testid": "cart-line-leaving",
                    "aria-hidden": true,
                    inert: true,
                  }
                : {})}
            />
          );
        })}
      </ul>
    </ItemGroup>
  );
}
