import { User } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { Link } from "react-router";

import { customerFullName, customerInitials } from "~/components/account/customer-profile";
import { LogoutForm } from "~/components/account/logout-form";
import { MarketingForm } from "~/components/account/marketing-form";
import { ProfileForm } from "~/components/account/profile-form";
import { Container } from "~/components/layout/container";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "~/components/ui/sonner";
import type { MarketingStatus, MarketingTarget, ProfileActionResult } from "~/lib/account/profile";

export type ProfileData = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  marketing: MarketingStatus;
};

/** Що зараз зберігається: форма профілю або перемикач розсилки. */
export type ProfilePending =
  { intent: "profile" } | { intent: "marketing"; target: MarketingTarget } | null;

export type ProfileViewProps = {
  profile: ProfileData;
  /** Відповідь action на останнє надсилання. */
  result?: ProfileActionResult | null;
  pending?: ProfilePending;
};

/** Та сама сітка «вміст + бічна колонка», що й у кабінеті. */
const LAYOUT = "grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-8";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const titleId = useId();

  return (
    <Card asChild className="p-4 sm:p-6">
      <section aria-labelledby={titleId}>
        <CardHeader>
          <CardTitle asChild size="h3">
            <h2 id={titleId}>{title}</h2>
          </CardTitle>
          {description ? (
            <CardDescription className="wrap-anywhere">{description}</CardDescription>
          ) : null}
        </CardHeader>
        {children}
      </section>
    </Card>
  );
}

/** Тост про вдале збереження: поруч із формою лишається статус, тост видно з будь-якого місця. */
function useSavedToast(result: ProfileActionResult | null | undefined) {
  useEffect(() => {
    if (!result?.ok) return;
    if (result.intent === "profile") toast.success("Профіль збережено");
    else if (result.target === "subscribe") toast.success("Ви підписалися на розсилку");
    else toast.success("Розсилку вимкнено");
  }, [result]);
}

/**
 * Сторінка профілю: особисті дані (ім'я та прізвище) і підписка на листи.
 * Аватар і підпис угорі беруться з тих самих даних, що й привітання в кабінеті,
 * тож після збереження імені оновлюються разом із ним.
 */
export function ProfileView({ profile, result = null, pending = null }: ProfileViewProps) {
  useSavedToast(result);

  const name = customerFullName(profile.firstName, profile.lastName);
  const letters = customerInitials(profile.firstName, profile.lastName, profile.email);

  return (
    <Container data-slot="profile-view" className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link viewTransition to="/account">
                Кабінет
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Профіль</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex min-w-0 items-center gap-4">
        <Avatar size="lg" aria-hidden="true">
          <AvatarFallback>{letters || <User strokeWidth={2} className="size-6" />}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h2 text-ink">Профіль</h1>
          {name || profile.email ? (
            <p className="text-body wrap-anywhere text-ink-2">
              {name ? (
                <span data-slot="customer-name" className="block sm:inline">
                  {name}
                </span>
              ) : null}
              {name && profile.email ? (
                <>
                  <span aria-hidden="true" className="max-sm:hidden">
                    {" · "}
                  </span>
                  <span className="sr-only">, </span>
                </>
              ) : null}
              {profile.email ? (
                <span data-slot="customer-email" className="block sm:inline">
                  {profile.email}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </header>

      <div className={LAYOUT}>
        <Panel
          title="Особисті дані"
          description="Ім'я побачить кур'єр і наш менеджер, коли зв'яжеться щодо замовлення."
        >
          <ProfileForm
            firstName={profile.firstName ?? ""}
            lastName={profile.lastName ?? ""}
            result={result?.intent === "profile" ? result : null}
            pending={pending?.intent === "profile"}
          />
        </Panel>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Розсилка">
            <MarketingForm
              status={profile.marketing}
              email={profile.email}
              result={result?.intent === "marketing" ? result : null}
              pendingTarget={pending?.intent === "marketing" ? pending.target : null}
            />
          </Panel>

          <Panel
            title="Вхід"
            description={
              profile.email
                ? `Ви входите за одноразовим кодом, який ми надсилаємо на ${profile.email}. Пароля немає.`
                : "Ви входите за одноразовим кодом з пошти. Пароля немає."
            }
          >
            <LogoutForm />
          </Panel>
        </div>
      </div>
    </Container>
  );
}
