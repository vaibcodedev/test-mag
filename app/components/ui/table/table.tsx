import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

const SCROLL_REGION_TAB_INDEX = 0;

export type TableProps = ComponentProps<"table"> & {
  /** Перша колонка лишається на місці під час горизонтальної прокрутки (таблиця порівняння). */
  stickyFirstColumn?: boolean;
  /**
   * Назва області прокрутки. Коли задана, обгортка стає регіоном із фокусом,
   * і широку таблицю можна прокрутити з клавіатури.
   */
  scrollLabel?: string;
  /** Класи обгортки з горизонтальною прокруткою. */
  containerClassName?: string;
};

/** Таблиця в обгортці з горизонтальною прокруткою: сторінка не розширюється на телефоні. */
export function Table({
  className,
  stickyFirstColumn = false,
  scrollLabel,
  containerClassName,
  ...props
}: TableProps) {
  const region = scrollLabel
    ? { role: "region", "aria-label": scrollLabel, tabIndex: SCROLL_REGION_TAB_INDEX }
    : {};

  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto rounded-sm focus-ring", containerClassName)}
      {...region}
    >
      <table
        data-slot="table"
        data-sticky-first={stickyFirstColumn ? "true" : undefined}
        className={cn(
          "w-full caption-bottom border-collapse text-small text-ink",
          stickyFirstColumn &&
            "[&_tr>*:first-child]:sticky [&_tr>*:first-child]:inset-s-0 [&_tr>*:first-child]:z-10 [&_tr>*:first-child]:bg-surface",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={className} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-b-0", className)}
      {...props}
    />
  );
}

export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t border-line font-semibold [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr data-slot="table-row" className={cn("border-b border-line", className)} {...props} />;
}

/** Комірка заголовка. Для заголовка рядка передайте scope="row". */
export function TableHead({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope={scope}
      className={cn(
        "h-11 px-4 py-3 text-start align-middle text-caption font-semibold text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td data-slot="table-cell" className={cn("px-4 py-3 align-middle", className)} {...props} />
  );
}

export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-start text-small text-muted-foreground", className)}
      {...props}
    />
  );
}
