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

/** Стан беремо з батьківського AccordionContent: вкладений акордеон чи шухляда не заважають. */
const COLLAPSE =
  "grid grid-rows-[1fr] transition-[grid-template-rows,visibility] duration-300 ease-in-out [[data-state=closed]>&]:invisible [[data-state=closed]>&]:grid-rows-[0fr]";

/**
 * Вміст секції; className іде на внутрішній блок із полями.
 * Із `forceMount` вміст лишається в DOM і в закритому стані (текст бачать пошукові роботи
 * та пошук на сторінці, поля форми лишаються у формі). Radix такий блок сам не ховає й
 * не анімує, тому висоту веде сітка: рядок 0fr ↔ 1fr плавно згортає й розгортає вміст,
 * а `invisible` у закритому стані прибирає його з фокуса й від читачів екрана.
 * Сітка стоїть на вкладеному блоці, а не на самому Content: Radix на час вимірювання
 * висоти вимикає переходи свого елемента, і вміст розкривався б миттєво.
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
        "text-body text-ink-2",
        !forceMount &&
          "overflow-hidden data-open:animate-accordion-down data-closed:animate-accordion-up",
      )}
      {...props}
    >
      {forceMount ? (
        <div data-slot="accordion-collapse" className={COLLAPSE}>
          {/* Рамка згортання обрізає вміст. relative: приховані поля прапорців Radix стоять
              абсолютно, і без цього виходили б за рамку й розтягували область прокрутки.
              Поля з від'ємним відступом лишають місце
              кільцям фокуса й бігункам повзунка, що виступають за край. */}
          <div className="relative -m-1 min-h-0 overflow-hidden p-1">
            <div className={cn("pb-4", className)}>{children}</div>
          </div>
        </div>
      ) : (
        <div className={cn("pb-4", className)}>{children}</div>
      )}
    </AccordionPrimitive.Content>
  );
}
