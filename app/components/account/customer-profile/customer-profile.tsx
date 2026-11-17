import { User } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

import { customerFullName, customerGreeting, customerInitials } from "./customer-identity";

export type CustomerProfileProps = Omit<ComponentProps<"header">, "children"> & {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  /** Дії профілю: вихід з кабінету. */
  actions?: ReactNode;
};

/**
 * Шапка кабінету: аватар з ініціалами, привітання (це h1 сторінки), ім'я з поштою
 * та вихід. Стоїть на тлі сторінки там само, де заголовок в інших станах кабінету.
 */
export function CustomerProfile({
  firstName,
  lastName,
  email,
  actions,
  className,
  ...props
}: CustomerProfileProps) {
  const name = customerFullName(firstName, lastName);
  const letters = customerInitials(firstName, lastName, email);

  return (
    <header
      data-slot="customer-profile"
      className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-4", className)}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Avatar size="lg" aria-hidden="true">
          <AvatarFallback>{letters || <User strokeWidth={2} className="size-6" />}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h2 wrap-anywhere text-ink">{customerGreeting(firstName)}</h1>
          {name || email ? (
            <p className="text-body wrap-anywhere text-ink-2">
              {name ? (
                <span data-slot="customer-name" className="block sm:inline">
                  {name}
                </span>
              ) : null}
              {name && email ? (
                <span aria-hidden="true" className="max-sm:hidden">
                  {" · "}
                </span>
              ) : null}
              {name && email ? <span className="sr-only">, </span> : null}
              {email ? (
                <span data-slot="customer-email" className="block sm:inline">
                  {email}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}
