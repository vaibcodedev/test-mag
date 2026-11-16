import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Slot } from "radix-ui";
import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

import { buttonVariants, type ButtonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Сторінки"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}
      {...props}
    />
  );
}

export function PaginationItem(props: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

export type PaginationLinkProps = ComponentProps<"a"> & {
  /** Поточна сторінка: синя, з aria-current="page". */
  isActive?: boolean;
  /** Номер сторінки: дає підпис «Сторінка N» і, якщо children немає, сам номер. */
  page?: number;
  /** Сторінки немає (перша чи остання): рендериться неактивний <span> без href. */
  disabled?: boolean;
  /** Для React Router: `<PaginationLink asChild page={2}><Link to="?page=2" /></PaginationLink>`. */
  asChild?: boolean;
  size?: ButtonVariants["size"];
};

/** Підставляє вміст у переданий елемент (Link), лишаючи його власний вміст, якщо він є. */
function withContent(child: ReactNode, content: ReactNode) {
  if (!isValidElement(child)) return null;

  const element = child as ReactElement<{ children?: ReactNode }>;
  return cloneElement(element, undefined, element.props.children ?? content);
}

export function PaginationLink({
  className,
  isActive = false,
  page,
  disabled = false,
  asChild = false,
  size = "icon",
  children,
  ...props
}: PaginationLinkProps) {
  const content = children ?? page;
  const label = page == null ? undefined : `Сторінка ${page}`;
  const classes = cn(
    buttonVariants({ variant: isActive ? "primary" : "surface", size }),
    "text-small tabular-nums",
    className,
  );

  if (disabled) {
    const { href: _href, rel: _rel, target: _target, ...rest } = props;
    const child = asChild && isValidElement(children) ? children : null;
    const inner = child
      ? (child as ReactElement<{ children?: ReactNode }>).props.children
      : children;

    return (
      <span
        data-slot="pagination-link"
        data-disabled="true"
        role="link"
        aria-disabled="true"
        aria-label={label}
        {...(rest as ComponentProps<"span">)}
        className={cn(classes, "pointer-events-none opacity-45")}
      >
        {inner ?? page}
      </span>
    );
  }

  const shared = {
    "data-slot": "pagination-link",
    "data-active": isActive ? "true" : undefined,
    "aria-current": isActive ? ("page" as const) : undefined,
    "aria-label": label,
    className: classes,
  };

  if (asChild) {
    return (
      <Slot.Root {...shared} {...props}>
        {withContent(children, page)}
      </Slot.Root>
    );
  }

  return (
    <a {...shared} {...props}>
      {content}
    </a>
  );
}

type PaginationStepProps = Omit<PaginationLinkProps, "page" | "isActive"> & {
  /** Видимий текст від sm і вище; на телефоні лишається стрілка з aria-label. */
  text?: string;
};

const STEP_CLASS = "h-11 w-auto min-w-11 gap-1.5 px-3 sm:px-4";

function stepContent(asChild: boolean, children: ReactNode, inner: ReactNode) {
  return asChild && isValidElement(children) ? cloneElement(children, undefined, inner) : inner;
}

export function PaginationPrevious({
  className,
  text = "Попередня",
  asChild = false,
  children,
  ...props
}: PaginationStepProps) {
  const inner = (
    <>
      <ChevronLeft aria-hidden="true" strokeWidth={2} />
      <span className="hidden sm:block">{text}</span>
    </>
  );

  return (
    <PaginationLink
      aria-label="Попередня сторінка"
      rel="prev"
      asChild={asChild}
      className={cn(STEP_CLASS, className)}
      {...props}
    >
      {stepContent(asChild, children, inner)}
    </PaginationLink>
  );
}

export function PaginationNext({
  className,
  text = "Наступна",
  asChild = false,
  children,
  ...props
}: PaginationStepProps) {
  const inner = (
    <>
      <span className="hidden sm:block">{text}</span>
      <ChevronRight aria-hidden="true" strokeWidth={2} />
    </>
  );

  return (
    <PaginationLink
      aria-label="Наступна сторінка"
      rel="next"
      asChild={asChild}
      className={cn(STEP_CLASS, className)}
      {...props}
    >
      {stepContent(asChild, children, inner)}
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      className={cn("flex size-11 items-center justify-center text-ink-2", className)}
      {...props}
    >
      <MoreHorizontal aria-hidden="true" strokeWidth={2} className="size-5" />
      <span className="sr-only">Більше сторінок</span>
    </span>
  );
}
