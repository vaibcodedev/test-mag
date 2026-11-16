import type { ComponentProps, ReactNode } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { cn } from "~/lib/utils";

export type ProductGridEmptyProps = Omit<ComponentProps<"div">, "title"> & {
  /** Іконка lucide зі strokeWidth 1.75. */
  icon: ReactNode;
  /** Чому товарів немає. */
  title: string;
  /** Що зробити далі. */
  description: ReactNode;
  /** Рівень заголовка: залежить від заголовків сторінки навколо сітки. */
  headingLevel?: "h2" | "h3";
  /** Дії, які виводять із порожнього стану: кнопка чи посилання. */
  children?: ReactNode;
};

/** Місце сітки, коли показати нічого: пояснення й наступний крок. */
export function ProductGridEmpty({
  icon,
  title,
  description,
  headingLevel = "h2",
  children,
  className,
  ...props
}: ProductGridEmptyProps) {
  return (
    // size="sm": заголовок на крок менший за h1 сторінки; поля лишаються як у панелі сторінки.
    <Empty size="sm" className={cn("md:p-10", className)} {...props} data-slot="product-grid-empty">
      <EmptyHeader>
        <EmptyMedia>{icon}</EmptyMedia>
        <EmptyTitle as={headingLevel}>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
}
