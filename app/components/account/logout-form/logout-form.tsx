import { LogOut } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "~/components/ui/button";

export type LogoutFormProps = Omit<ComponentProps<"form">, "method" | "action" | "children">;

/** Вихід з кабінету. Звичайна <form>: після виходу потрібне повне перезавантаження сторінки. */
export function LogoutForm(props: LogoutFormProps) {
  return (
    <form method="post" action="/account/logout" data-slot="logout-form" {...props}>
      <Button type="submit" variant="secondary">
        <LogOut aria-hidden="true" strokeWidth={2} />
        Вийти з кабінету
      </Button>
    </form>
  );
}
