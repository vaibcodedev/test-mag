import { ArrowRight, MapPin, Phone, Send } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { storeAddress, type StoreInfo } from "~/lib/content/site";

export type ContactCardProps = Omit<ComponentProps<"section">, "title" | "children"> & {
  /** Метаоб'єкт `store_info`. */
  store: StoreInfo;
  title?: string;
  description?: string;
  /** Посилання на сторінку шоуруму; на самій сторінці контактів його ховаємо. */
  showroomLink?: { title: string; to: string } | null;
};

/** Картка з контактами магазину: телефон, Telegram і адреса шоуруму. */
export function ContactCard({
  store,
  title = "Лишилися питання?",
  description = "Напишіть або зателефонуйте — відповімо в години роботи шоуруму.",
  showroomLink = { title: "Шоурум і контакти", to: "/pages/contacts" },
  className,
  ...props
}: ContactCardProps) {
  const titleId = useId();

  return (
    <Card asChild className={className}>
      <section aria-labelledby={titleId} data-slot="contact-card" {...props}>
        <CardHeader>
          <CardTitle asChild size="h3">
            <h2 id={titleId}>{title}</h2>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        {/* Рядки-посилання мають поля під hover, тож список зсунуто на ці поля вліво. */}
        <ItemGroup asChild className="-mx-3 w-auto gap-1">
          <ul role="list">
            <li>
              <Item asChild size="sm">
                <a href={store.phoneHref}>
                  <ItemMedia variant="icon">
                    <Phone aria-hidden="true" strokeWidth={2} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemDescription>Телефон</ItemDescription>
                    <ItemTitle>{store.phone}</ItemTitle>
                  </ItemContent>
                </a>
              </Item>
            </li>
            <li>
              <Item asChild size="sm">
                <a href={store.telegramUrl} target="_blank" rel="noopener noreferrer">
                  <ItemMedia variant="icon">
                    <Send aria-hidden="true" strokeWidth={2} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemDescription>Telegram</ItemDescription>
                    <ItemTitle>{store.telegramHandle}</ItemTitle>
                  </ItemContent>
                  <span className="sr-only"> (відкриється в новій вкладці)</span>
                </a>
              </Item>
            </li>
            <li>
              <Item size="sm">
                <ItemMedia variant="icon">
                  <MapPin aria-hidden="true" strokeWidth={2} />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription>Шоурум, {store.hours}</ItemDescription>
                  <ItemTitle>{storeAddress(store)}</ItemTitle>
                </ItemContent>
              </Item>
            </li>
          </ul>
        </ItemGroup>

        {showroomLink ? (
          <Button asChild variant="link" className="min-h-11 self-start">
            <Link to={showroomLink.to} prefetch="intent">
              {showroomLink.title}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </Button>
        ) : null}
      </section>
    </Card>
  );
}
