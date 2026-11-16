import type { ComponentProps, ReactNode } from "react";

import { cn } from "~/lib/utils";

type StyleguideSectionProps = Omit<ComponentProps<"section">, "title"> & {
  id: string;
  title: string;
  description?: ReactNode;
};

/** Розділ вітрини: заголовок, пояснення, вміст. */
export function StyleguideSection({
  id,
  title,
  description,
  className,
  children,
  ...props
}: StyleguideSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("flex min-w-0 scroll-mt-24 flex-col gap-6", className)}
      {...props}
    >
      <header className="flex max-w-3xl flex-col gap-2">
        <h2 id={`${id}-title`} className="text-h2 text-ink">
          {title}
        </h2>
        {description ? <p className="text-body text-ink-2">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

type SpecimenProps = ComponentProps<"div"> & {
  /** Назва групи прикладів. */
  label: string;
  /** Тло, на якому компонент живе на сайті. */
  tone?: "surface" | "page" | "ink";
};

const SPECIMEN_TONE = {
  surface: "bg-surface text-ink",
  page: "border border-line bg-page text-ink",
  ink: "bg-ink text-surface",
} as const;

/** Плитка з прикладами одного компонента. */
export function Specimen({
  label,
  tone = "surface",
  className,
  children,
  ...props
}: SpecimenProps) {
  return (
    <div
      data-slot="specimen"
      className={cn("flex min-w-0 flex-col gap-4 rounded-xl p-6", SPECIMEN_TONE[tone], className)}
      {...props}
    >
      <h3
        className={cn(
          "text-small font-semibold",
          tone === "ink" ? "text-on-ink-muted" : "text-muted-foreground",
        )}
      >
        {label}
      </h3>
      {children}
    </div>
  );
}

/** Рядок прикладів з перенесенням. */
export function SpecimenRow({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)} {...props} />;
}
