import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { Spinner } from "~/components/ui/spinner";

/** Тости на ink: «Додано в кошик». Викликаються через toast() із пакета sonner. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
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
          actionButton: "!bg-lime !text-ink !rounded-md !font-semibold !h-11 !px-4",
        },
      }}
      {...props}
    />
  );
}
