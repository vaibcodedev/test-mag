import type { ComponentProps } from "react";

import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

/** Стан завантаження: повторює розміри справжньої картки, щоб верстка не стрибала. */
export function ProductCardSkeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <Card
      padding="sm"
      role="status"
      aria-label="Завантаження товару"
      className={cn("h-full", className)}
      {...props}
      data-slot="product-card-skeleton"
    >
      <AspectRatio ratio={1}>
        <Skeleton className="size-full rounded-md" />
      </AspectRatio>
      <CardContent className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-11.5 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}
