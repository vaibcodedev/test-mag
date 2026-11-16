import type { ComponentProps } from "react";

import { calendarDate, formatDate } from "~/lib/format";

export type PublishedDateProps = Omit<ComponentProps<"time">, "dateTime" | "children"> & {
  /** Дата в ISO 8601. */
  value: string;
};

/** Дата у форматі «18 листопада 2026 р.» в елементі <time>. Некоректна дата не рендериться. */
export function PublishedDate({ value, ...props }: PublishedDateProps) {
  const published = calendarDate(value);
  if (!published) return null;

  return (
    <time dateTime={published.dateTime} {...props}>
      {formatDate(published.date)}
    </time>
  );
}
