import type { ComponentProps, ReactNode } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";

export type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  icon: ReactNode;
  title: string;
  description: string;
  /** Дія, яка виводить із порожнього стану. */
  action?: ReactNode;
  /** Рівень заголовка: h1 на порожній сторінці (типово), h2 чи h3 усередині секції. */
  headingLevel?: "h1" | "h2" | "h3";
};

/**
 * Порожній стан: що тут буде і що зробити далі.
 * Тонка обгортка над shadcn Empty; у новому коді збирайте Empty з його частин напряму.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = "h1",
  ...props
}: EmptyStateProps) {
  return (
    <Empty data-slot="empty-state" {...props}>
      <EmptyHeader>
        <EmptyMedia>{icon}</EmptyMedia>
        <EmptyTitle as={headingLevel}>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
