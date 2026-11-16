import { Clock, MapPin, Navigation, Phone, Send, type LucideIcon } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { ShowroomMap } from "~/components/home/showroom-map";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { directionsUrl, storeAddress, type StoreInfo } from "~/lib/content/site";
import { cn } from "~/lib/utils";

export type ShowroomBlockProps = Omit<ComponentProps<"section">, "title" | "children"> & {
  /** Метаоб'єкт `store_info`. */
  store: StoreInfo;
  title?: string;
};

function ContactParts({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <ItemMedia variant="icon" tone="dark">
        <Icon aria-hidden="true" strokeWidth={2} className="text-lime" />
      </ItemMedia>
      <ItemContent>
        <ItemDescription>{label}</ItemDescription>
        <ItemTitle>{children}</ItemTitle>
      </ItemContent>
    </>
  );
}

/** Шоурум на сторінці контактів: адреса, години, телефон, Telegram, маршрут і схема центру міста. */
export function ShowroomBlock({
  store,
  title = "Як нас знайти",
  className,
  ...props
}: ShowroomBlockProps) {
  const titleId = useId();

  return (
    <Card
      asChild
      tone="ink"
      padding="none"
      className={cn("grid gap-8 p-6 md:p-10 lg:grid-cols-2 lg:gap-10", className)}
    >
      <section aria-labelledby={titleId} data-slot="showroom-block" {...props}>
        <div className="flex min-w-0 flex-col gap-8">
          <CardTitle asChild className="text-h2-panel">
            <h2 id={titleId}>{title}</h2>
          </CardTitle>

          {/* Рядки-посилання мають поля під hover, тож список зсунуто на ці поля вліво. */}
          <ItemGroup asChild className="-mx-3 w-auto gap-1">
            <ul role="list">
              <li>
                <Item variant="on-dark" size="sm">
                  <ContactParts icon={MapPin} label="Адреса">
                    {storeAddress(store)}
                  </ContactParts>
                </Item>
              </li>
              <li>
                <Item variant="on-dark" size="sm">
                  <ContactParts icon={Clock} label="Години роботи">
                    {store.hours}
                  </ContactParts>
                </Item>
              </li>
              <li>
                <Item asChild variant="on-dark" size="sm">
                  <a href={store.phoneHref}>
                    <ContactParts icon={Phone} label="Телефон">
                      {store.phone}
                    </ContactParts>
                  </a>
                </Item>
              </li>
              <li>
                <Item asChild variant="on-dark" size="sm">
                  <a href={store.telegramUrl} target="_blank" rel="noopener noreferrer">
                    <ContactParts icon={Send} label="Telegram">
                      {store.telegramHandle}
                    </ContactParts>
                    <span className="sr-only"> (відкриється в новій вкладці)</span>
                  </a>
                </Item>
              </li>
            </ul>
          </ItemGroup>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild variant="lime" size="lg">
              <a href={directionsUrl(store)} target="_blank" rel="noopener noreferrer">
                <Navigation aria-hidden="true" strokeWidth={2} />
                Прокласти маршрут
                <span className="sr-only"> у Google Maps (відкриється в новій вкладці)</span>
              </a>
            </Button>
            <Button asChild variant="on-dark" size="lg">
              <a href={store.telegramUrl} target="_blank" rel="noopener noreferrer">
                <Send aria-hidden="true" strokeWidth={2} />
                Написати в Telegram
                <span className="sr-only"> (відкриється в новій вкладці)</span>
              </a>
            </Button>
          </div>

          <CardDescription>
            {store.legalName}, РНОКПП {store.taxId}
          </CardDescription>
        </div>

        <ShowroomMap store={store} className="min-w-0" />
      </section>
    </Card>
  );
}
