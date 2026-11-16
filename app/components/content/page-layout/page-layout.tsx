import type { ReactNode } from "react";

import { ContactCard } from "~/components/content/contact-card";
import { Breadcrumbs, type BreadcrumbItem } from "~/components/layout/breadcrumbs";
import { Container } from "~/components/layout/container";
import { Card, CardContent } from "~/components/ui/card";
import type { StoreInfo } from "~/lib/content/site";
import { cn } from "~/lib/utils";

export type PageLayoutProps = {
  /** Від головної до поточної сторінки. */
  breadcrumbs: readonly BreadcrumbItem[];
  /** Єдиний h1 сторінки. */
  title: string;
  /** Короткий вступ під заголовком. */
  lead?: string | null;
  /** Дані магазину для картки контактів у бічній колонці. */
  store: StoreInfo;
  /** false — без посилання «Шоурум і контакти» в картці (на самій сторінці контактів). */
  showroomLink?: boolean;
  /** Навігація між сусідніми сторінками: над текстом на телефоні, у бічній колонці на десктопі. */
  nav?: ReactNode;
  /** Блок на всю ширину під текстом: наприклад, шоурум із картою. */
  after?: ReactNode;
  /** Текст сторінки. */
  children: ReactNode;
  className?: string;
};

/** Каркас контентної сторінки: крихти, h1, колонка тексту й бічна колонка з контактами. */
export function PageLayout({
  breadcrumbs,
  title,
  lead,
  store,
  showroomLink = true,
  nav,
  after,
  children,
  className,
}: PageLayoutProps) {
  return (
    <Container data-slot="page-layout" className={cn("flex flex-col gap-6", className)}>
      <header className="flex flex-col gap-3">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-h2 wrap-anywhere text-ink">{title}</h1>
        {lead ? <p className="max-w-3xl text-body text-ink-2">{lead}</p> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-8">
        {nav ? <div className="min-w-0 lg:col-start-2 lg:row-start-1">{nav}</div> : null}

        <Card
          asChild
          padding="none"
          className={cn("p-6 md:p-10 lg:col-start-1 lg:row-start-1", nav ? "lg:row-span-2" : null)}
        >
          <article>
            <CardContent className="max-w-3xl">{children}</CardContent>
          </article>
        </Card>

        <aside className={cn("min-w-0 lg:col-start-2", nav ? "lg:row-start-2" : "lg:row-start-1")}>
          <ContactCard store={store} {...(showroomLink ? {} : { showroomLink: null })} />
        </aside>
      </div>

      {after}
    </Container>
  );
}
