import type { ComponentProps, ReactNode } from "react";

import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

import { fieldVariants, type FieldVariants } from "./field.variants";

/** Група пов'язаних полів із підписом-легендою: адреса доставки, спосіб оплати. */
export function FieldSet({ className, ...props }: ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex min-w-0 flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      {...props}
    />
  );
}

export function FieldLegend({
  className,
  variant = "legend",
  ...props
}: ComponentProps<"legend"> & {
  /** legend — заголовок групи (body), label — як підпис поля (small). */
  variant?: "legend" | "label";
}) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-2 text-ink",
        variant === "label" ? "text-small font-semibold" : "text-body font-semibold",
        className,
      )}
      {...props}
    />
  );
}

/** Стовпчик полів з однаковим кроком. Задає контейнер для Field orientation="responsive". */
export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full min-w-0 flex-col gap-5 data-[slot=checkbox-group]:gap-1 *:data-[slot=field-group]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

export type FieldProps = ComponentProps<"div"> & FieldVariants;

/** Одне поле. Стан помилки: `data-invalid="true"` (його дає `fieldProps`). */
export function Field({ className, orientation = "vertical", ...props }: FieldProps) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

/** Підпис і підказка поруч із прапорцем чи перемикачем у горизонтальному полі. */
export function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("group/field-content flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    />
  );
}

export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label group-data-[disabled=true]/field:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

/** Підпис без зв'язку з полем: назва групи перемикачів усередині Field. */
export function FieldTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-small font-semibold text-ink group-data-[disabled=true]/field:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

/** Підказка під полем: формат, приклад, навіщо ми це питаємо. */
export function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-start text-small text-muted-foreground [&>a]:text-blue [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}

export function FieldSeparator({
  children,
  className,
  ...props
}: ComponentProps<"div"> & { children?: ReactNode }) {
  return (
    <div
      data-slot="field-separator"
      data-content={Boolean(children)}
      className={cn("relative flex h-5 items-center text-small", className)}
      {...props}
    >
      <Separator className="absolute inset-x-0 top-1/2" />
      {children ? (
        <span
          data-slot="field-separator-content"
          className="relative mx-auto block w-fit bg-surface px-3 text-muted-foreground"
        >
          {children}
        </span>
      ) : null}
    </div>
  );
}

export type FieldErrorProps = ComponentProps<"div"> & {
  /** Помилки з бібліотеки форм або з action маршруту; однакові повідомлення зливаються. */
  errors?: ReadonlyArray<{ message?: string } | undefined>;
};

/**
 * Текст помилки: що не так і як це виправити. Без children та errors нічого не рендерить.
 * Має role="alert", тож нова помилка зачитується одразу.
 */
export function FieldError({ className, children, errors, ...props }: FieldErrorProps) {
  const messages = [
    ...new Set((errors ?? []).flatMap((error) => (error?.message ? [error.message] : []))),
  ];
  const content =
    children ??
    (messages.length > 1 ? (
      <ul className="flex list-disc flex-col gap-1 ps-4">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    ) : (
      messages[0]
    ));

  if (content == null || content === false || content === "") return null;

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-small text-danger", className)}
      {...props}
    >
      {content}
    </div>
  );
}
