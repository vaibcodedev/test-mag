import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/** Шлях до сторінки: «Головна › iPhone › iPhone 17 Pro». */
export function Breadcrumb(props: ComponentProps<"nav">) {
  return <nav aria-label="Навігаційний ланцюжок" data-slot="breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 text-small wrap-break-word text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
      {...props}
    />
  );
}

/** Посилання на рівень вище. Для React Router: `<BreadcrumbLink asChild><Link to="/" /></BreadcrumbLink>`. */
export function BreadcrumbLink({
  asChild = false,
  className,
  ...props
}: ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "inline-flex min-h-11 items-center rounded-sm focus-ring transition-colors duration-150 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Поточна сторінка: не посилання, позначена aria-current. */
export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("inline-flex min-h-11 items-center text-ink", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("inline-flex items-center [&>svg]:size-4", className)}
      {...props}
    >
      {children ?? <ChevronRight strokeWidth={2} />}
    </li>
  );
}

/** Згорнуті проміжні рівні. Як кнопка меню — всередині власного тригера з aria-label. */
export function BreadcrumbEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      className={cn("flex size-11 items-center justify-center [&>svg]:size-5", className)}
      {...props}
    >
      <MoreHorizontal aria-hidden="true" strokeWidth={2} />
      <span className="sr-only">Ще рівні</span>
    </span>
  );
}
