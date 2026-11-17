import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { DealsTicker, type DealsTickerItem } from "~/components/home/deals-ticker";
import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import { ProductCard, type ProductCardData } from "~/components/product/product-card";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Countdown } from "~/components/ui/countdown";

/** У секції показуємо рівно чотири картки. */
const VISIBLE_PRODUCTS = 4;

export type DealsContent = {
  title: string;
  description?: string;
  /** Підпис над відліком: «До кінця акції». */
  countdownLabel: string;
  /** Що показати, коли акція закінчилась: «Акцію завершено». */
  finishedText: string;
  link: { title: string; to: string };
};

export type DealsProps = Omit<SectionProps, "id" | "children" | "content"> & {
  id?: string;
  content: DealsContent;
  /** Товари зі знижкою; секція бере перші чотири. */
  products: ProductCardData[];
  /** Кінець акції в ISO 8601. */
  endsAt: string;
  /** Час сервера з loader: з ним цифри відліку є вже в HTML. */
  now?: string | number | null;
  tickerItems: DealsTickerItem[];
  onAddToCart?: (product: ProductCardData) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

/** «Знижки тижня»: ink-панель із рухомим рядком, відліком і чотирма картками. */
export function Deals({
  id = "deals",
  content,
  products,
  endsAt,
  now,
  tickerItems,
  onAddToCart,
  addingHandle,
  ...props
}: DealsProps) {
  return (
    <Section id={id} {...props}>
      <Card size="panel" tone="ink" padding="none" className="overflow-hidden">
        <DealsTicker items={tickerItems} className="border-b border-on-ink-10" />

        <CardContent className="p-6 md:p-10">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              sectionId={id}
              title={content.title}
              description={content.description}
              onDark
              className="mb-0"
            />
            <Countdown
              endsAt={endsAt}
              now={now}
              label={content.countdownLabel}
              finishedText={content.finishedText}
              tone="ink"
              className="shrink-0"
            />
          </div>

          <ul
            role="list"
            className="-mx-6 flex snap-x scroll-px-6 scrollbar-on-ink gap-3 overflow-x-auto px-6 py-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4"
          >
            {products.slice(0, VISIBLE_PRODUCTS).map((product) => (
              <li key={product.handle} className="w-64 min-w-0 shrink-0 snap-start md:w-auto">
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
                  adding={addingHandle === product.handle}
                />
              </li>
            ))}
          </ul>

          <Button asChild variant="on-dark" className="mt-6">
            <Link viewTransition to={content.link.to} prefetch="intent">
              {content.link.title}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </Section>
  );
}
