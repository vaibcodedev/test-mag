import type { ComponentProps } from "react";

import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

const ROWS = 5;

export type CompareTableSkeletonProps = Omit<ComponentProps<"div">, "children"> & {
  /** Скільки товарів завантажується. */
  columns: number;
};

/** Заглушка таблиці порівняння на час завантаження товарів. */
export function CompareTableSkeleton({ columns, className, ...props }: CompareTableSkeletonProps) {
  return (
    <Card
      padding="sm"
      role="status"
      aria-label="Завантаження порівняння"
      data-slot="compare-table-skeleton"
      className={cn("w-fit max-w-full flex-row gap-4 overflow-hidden", className)}
      {...props}
    >
      {Array.from({ length: Math.max(columns, 1) }, (_, column) => (
        <div key={column} className="flex w-40 shrink-0 flex-col gap-3 md:w-56">
          <Skeleton className="aspect-square rounded-md" />
          <Skeleton className="h-5 w-11/12" />
          {Array.from({ length: ROWS }, (_, row) => (
            <Skeleton key={row} className="h-5 w-2/3" />
          ))}
          <Skeleton className="h-11.5 rounded-md" />
        </div>
      ))}
    </Card>
  );
}
