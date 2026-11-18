import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { Spinner } from "~/components/ui/spinner";

/**
 * Тости стоять над закріпленими смугами: нижньою навігацією (до lg) і панеллю «Купити»,
 * коли та показана. Висоти смуг — змінна --bottom-fixed-space з app.css (на десктопі 0),
 * тож тут немає власних чисел, крім штатних відступів Sonner (24px і 16px на телефоні).
 * Sonner перемикає offset → mobileOffset на 600px, а нижня панель живе до 1024px,
 * тому змінна врахована в обох.
 */
export const TOAST_OFFSET = { bottom: "calc(24px + var(--bottom-fixed-space, 0px))" } as const;
export const TOAST_MOBILE_OFFSET = {
  bottom: "calc(16px + var(--bottom-fixed-space, 0px))",
} as const;

/** Тости на ink: «Додано в кошик». Викликаються через toast() із пакета sonner. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      offset={TOAST_OFFSET}
      mobileOffset={TOAST_MOBILE_OFFSET}
      containerAriaLabel="Сповіщення"
      icons={{
        success: <CircleCheck strokeWidth={2} className="size-5 text-lime" />,
        info: <Info strokeWidth={2} className="size-5" />,
        warning: <TriangleAlert strokeWidth={2} className="size-5 text-lime" />,
        error: <CircleAlert strokeWidth={2} className="size-5" />,
        loading: <Spinner />,
      }}
      style={
        {
          "--normal-bg": "var(--ink)",
          "--normal-text": "var(--surface)",
          "--normal-border": "var(--ink)",
          "--border-radius": "var(--r-md)",
          fontFamily: "var(--font-sans-family)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!shadow-none !text-small !font-semibold !gap-3",
          description: "!text-on-ink-muted !font-medium",
          actionButton: "!bg-lime !text-on-accent !rounded-md !font-semibold !h-11 !px-4",
        },
      }}
      {...props}
    />
  );
}
