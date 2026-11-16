import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";

import { Container } from "~/components/layout/container";
import { cn } from "~/lib/utils";

export type SectionProps = Omit<ComponentProps<"section">, "title"> & {
  /** id секції; від нього ж будується id заголовка для aria-labelledby. */
  id: string;
  /** false — секція сама керує шириною (наприклад, банер на всю ширину). */
  contained?: boolean;
};

/** Секція сторінки. Відступ 80px між секціями задає батьківський flex-контейнер. */
export function Section({ id, contained = true, className, children, ...props }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-slot="section"
      className={cn("scroll-mt-24", className)}
      {...props}
    >
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}

export type SectionHeaderProps = Omit<ComponentProps<"div">, "title"> & {
  /** id секції, якій належить заголовок. */
  sectionId: string;
  title: ReactNode;
  description?: ReactNode;
  /** Посилання праворуч: «Увесь каталог». */
  link?: { title: string; to: string };
  onDark?: boolean;
};

export function SectionHeader({
  sectionId,
  title,
  description,
  link,
  onDark = false,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn("mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4", className)}
      {...props}
    >
      <div className="flex max-w-3xl flex-col gap-3">
        <h2
          id={`${sectionId}-title`}
          className={cn("text-h2", onDark ? "text-surface" : "text-ink")}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("text-body", onDark ? "text-on-ink-muted" : "text-ink-2")}>
            {description}
          </p>
        ) : null}
      </div>
      {link ? (
        <Link
          to={link.to}
          prefetch="intent"
          className={cn(
            "group/link inline-flex min-h-11 items-center gap-2 rounded-sm text-body font-semibold",
            onDark ? "text-lime focus-ring-on-ink" : "text-blue focus-ring",
          )}
        >
          {link.title}
          <ArrowRight
            aria-hidden="true"
            strokeWidth={2}
            className="size-5 transition-transform group-hover/link:translate-x-1"
          />
        </Link>
      ) : null}
    </div>
  );
}
