import { User } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

export type CustomerProfileProps = Omit<ComponentProps<"section">, "children"> & {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  /** Дії під профілем: вихід з кабінету. */
  actions?: ReactNode;
};

/** «ОК» для «Олена Коваль»; без імені — порожній рядок. */
function initials(...names: (string | null | undefined)[]): string {
  return names
    .map((name) => Array.from(name?.trim() ?? "")[0] ?? "")
    .join("")
    .toLocaleUpperCase("uk-UA");
}

/** Профіль покупця: аватар з ініціалами, ім'я, пошта та вихід. */
export function CustomerProfile({
  firstName,
  lastName,
  email,
  actions,
  className,
  ...props
}: CustomerProfileProps) {
  const titleId = useId();
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const letters = initials(firstName, lastName);

  return (
    <Card asChild className={className}>
      <section aria-labelledby={titleId} data-slot="customer-profile" {...props}>
        <Avatar size="lg" tone="page" aria-hidden="true">
          <AvatarFallback>{letters || <User strokeWidth={2} className="size-6" />}</AvatarFallback>
        </Avatar>
        <CardHeader>
          <CardTitle asChild size="h3" className="wrap-anywhere">
            <h2 id={titleId}>{name || "Ваш профіль"}</h2>
          </CardTitle>
          {email ? <CardDescription className="wrap-anywhere">{email}</CardDescription> : null}
        </CardHeader>
        {actions ? <CardFooter>{actions}</CardFooter> : null}
      </section>
    </Card>
  );
}
