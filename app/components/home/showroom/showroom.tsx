import { Bike, Clock, MapPin, Navigation, Phone, Send, Truck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ShowroomMap } from "~/components/home/showroom-map";
import { Section, SectionHeader } from "~/components/layout/section";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "~/components/ui/item";
import { directionsUrl, storeAddress, type StoreInfo } from "~/lib/content/site";

export type ShowroomDeliveryIcon = "truck" | "bike" | "send";

export type ShowroomDeliveryRow = {
  /** Назва іконки lucide з обмеженого набору. */
  icon: ShowroomDeliveryIcon;
  title: string;
  text: string;
};

export type ShowroomProps = {
  title?: string;
  description?: string;
  /** Метаоб'єкт `store_info`. */
  store: StoreInfo;
  /** Три способи отримати замовлення. */
  delivery: ShowroomDeliveryRow[];
};

const SECTION_ID = "showroom";

const DELIVERY_ICONS: Record<ShowroomDeliveryIcon, LucideIcon> = {
  truck: Truck,
  bike: Bike,
  send: Send,
};

function Contact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <li>
      <Item variant="on-dark" size="none" className="flex-nowrap gap-3">
        <ItemMedia variant="icon" tone="lime">
          <Icon strokeWidth={2} />
        </ItemMedia>
        <ItemContent className="gap-0">
          <ItemDescription className="text-caption">{label}</ItemDescription>
          <ItemTitle className="text-body">{children}</ItemTitle>
        </ItemContent>
      </Item>
    </li>
  );
}

/** Шоурум: контакти, маршрут, способи доставки та схема центру міста на ink-панелі. */
export function Showroom({
  title = "Шоурум у Вінниці",
  description,
  store,
  delivery,
}: ShowroomProps) {
  return (
    <Section id={SECTION_ID}>
      <Card size="panel" tone="ink" className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          <SectionHeader
            sectionId={SECTION_ID}
            title={title}
            description={description}
            onDark
            className="mb-0"
          />

          <ItemGroup asChild className="gap-4">
            <ul>
              <Contact icon={MapPin} label="Адреса">
                {storeAddress(store)}
              </Contact>
              <Contact icon={Clock} label="Години роботи">
                {store.hours}
              </Contact>
              <Contact icon={Phone} label="Телефон">
                <a
                  href={store.phoneHref}
                  className="inline-flex min-h-11 items-center rounded-sm underline-offset-4 focus-ring-on-ink hover:underline"
                >
                  {store.phone}
                </a>
              </Contact>
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

          {delivery.length > 0 ? (
            <div>
              <h3 className="sr-only">Як отримати замовлення</h3>
              <ItemGroup asChild className="gap-0">
                <ul>
                  {delivery.map((row) => {
                    const Icon = DELIVERY_ICONS[row.icon];

                    return (
                      <li key={row.title} className="group/row">
                        <ItemSeparator className="bg-on-ink-12" />
                        <Item
                          variant="on-dark"
                          size="none"
                          className="flex-nowrap gap-3 py-4 group-last/row:pb-0"
                        >
                          <ItemMedia>
                            <Icon aria-hidden="true" strokeWidth={2} />
                          </ItemMedia>
                          <ItemContent>
                            <ItemDescription>
                              <span className="font-semibold text-surface">{row.title}.</span>{" "}
                              {row.text}
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      </li>
                    );
                  })}
                </ul>
              </ItemGroup>
            </div>
          ) : null}
        </div>

        <ShowroomMap store={store} className="min-w-0" />
      </Card>
    </Section>
  );
}
