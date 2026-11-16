import { ChevronDown } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/**
 * Акордеон: фільтри каталогу і «Часті запитання» на головній. У FAQ відповіді змонтовані
 * примусово (`<AccordionContent forceMount>`), щоб лежати в серверному HTML.
 */
export function Accordion({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-line last:border-b-0", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger flex min-h-14 flex-1 cursor-pointer items-center justify-between gap-4 rounded-sm py-3 text-start text-body font-semibold text-ink focus-ring transition-colors duration-150 hover:text-blue disabled:pointer-events-none disabled:opacity-45",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className="size-5 shrink-0 text-ink-2 transition-transform group-aria-expanded/accordion-trigger:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * Вміст секції; className іде на внутрішній блок із полями.
 * Із `forceMount` вміст лишається в DOM і в закритому стані (текст бачать пошукові роботи
 * та пошук на сторінці). Radix такий блок сам не ховає, тому закритий корінь отримує
 * `data-closed:hidden`; анімації згортання в цьому режимі немає.
 */
export function AccordionContent({
  className,
  children,
  forceMount,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      data-force-mount={forceMount ? "true" : undefined}
      forceMount={forceMount}
      className={cn(
        "overflow-hidden text-body text-ink-2 data-open:animate-accordion-down",
        forceMount ? "data-closed:hidden" : "data-closed:animate-accordion-up",
      )}
      {...props}
    >
      <div className={cn("pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
