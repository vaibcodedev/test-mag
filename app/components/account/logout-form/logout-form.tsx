import { LogOut } from "lucide-react";
import type { ComponentProps } from "react";

import { Button, type ButtonProps } from "~/components/ui/button";

export type LogoutFormProps = Omit<ComponentProps<"form">, "method" | "action" | "children"> & {
  /** `surface` — на тлі сторінки (шапка кабінету), `secondary` — на білій панелі. */
  variant?: Extract<ButtonProps["variant"], "surface" | "secondary">;
  size?: ButtonProps["size"];
};

/** Вихід з кабінету. Звичайна <form>: після виходу потрібне повне перезавантаження сторінки. */
export function LogoutForm({ variant = "secondary", size, ...props }: LogoutFormProps) {
  return (
    <form method="post" action="/account/logout" data-slot="logout-form" {...props}>
      <Button type="submit" variant={variant} size={size}>
        <LogOut aria-hidden="true" strokeWidth={2} />
        Вийти з кабінету
      </Button>
    </form>
  );
}
