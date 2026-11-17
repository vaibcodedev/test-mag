import { CircleAlert, CircleCheck, RotateCcw, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button, type ButtonProps } from "~/components/ui/button";
import { useReorder } from "~/hooks/use-reorder";
import type { ReorderMessage } from "~/lib/account/reorder";

export type ReorderButtonViewProps = Omit<ButtonProps, "children" | "loading" | "asChild"> & {
  /** Номер замовлення для зчитувача екрана: «#1005». */
  orderName: string;
  /** Триває додавання: кнопка показує спінер і не приймає повторних натискань. */
  pending?: boolean;
  /** Короткий підпис «Повторити» — для картки в списку. */
  compact?: boolean;
};

/** Кнопка «Повторити замовлення» без логіки: стан приходить пропами (історії, тести). */
export function ReorderButtonView({
  orderName,
  pending = false,
  compact = false,
  ...props
}: ReorderButtonViewProps) {
  return (
    <Button
      data-slot="reorder-button"
      loading={pending}
      aria-label={
        pending
          ? `Додаємо товари замовлення ${orderName} в кошик`
          : `Повторити замовлення ${orderName}`
      }
      {...props}
    >
      <RotateCcw aria-hidden="true" strokeWidth={2} />
      {compact ? "Повторити" : "Повторити замовлення"}
    </Button>
  );
}

export type ReorderButtonProps = Omit<ReorderButtonViewProps, "pending" | "onClick"> & {
  orderId: string;
};

/**
 * «Повторити замовлення»: кладе в поточний кошик усе, що з цього замовлення ще продається,
 * і відкриває кошик. Про пропущені позиції каже тост (логіка — у ~/hooks/use-reorder).
 */
export function ReorderButton({ orderId, ...props }: ReorderButtonProps) {
  const { reorder, pending } = useReorder();

  return <ReorderButtonView pending={pending} onClick={() => void reorder(orderId)} {...props} />;
}

const NOTICE = {
  success: { variant: "success", icon: CircleCheck },
  warning: { variant: "warning", icon: TriangleAlert },
  error: { variant: "danger", icon: CircleAlert },
} as const;

export type ReorderNoticeProps = Omit<ComponentProps<typeof Alert>, "variant" | "children"> & {
  message: ReorderMessage;
};

/** Підсумок повторення в потоці сторінки: лишається перед очима, коли тост уже зник. */
export function ReorderNotice({ message, ...props }: ReorderNoticeProps) {
  const { variant, icon: Icon } = NOTICE[message.tone];

  return (
    <Alert data-slot="reorder-notice" variant={variant} {...props}>
      <Icon aria-hidden="true" strokeWidth={2} />
      <AlertTitle>{message.title}</AlertTitle>
      {message.description ? <AlertDescription>{message.description}</AlertDescription> : null}
    </Alert>
  );
}
