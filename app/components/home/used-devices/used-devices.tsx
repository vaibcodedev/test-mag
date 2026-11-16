import {
  ArrowRight,
  BatteryMedium,
  ClipboardCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import { ProductCard, type ProductCardData } from "~/components/product/product-card";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";

/** У секції показуємо рівно три картки. */
const VISIBLE_PRODUCTS = 3;

export type UsedDevicesIcon = "grade" | "battery" | "warranty";

const ICONS: Record<UsedDevicesIcon, LucideIcon> = {
  grade: ClipboardCheck,
  battery: BatteryMedium,
  warranty: ShieldCheck,
};

export type UsedDevicesPoint = {
  icon: UsedDevicesIcon;
  title: string;
  text: string;
};

export type UsedDevicesContent = {
  title: string;
  description: string;
  /** Оцінка стану, акумулятор, гарантія. */
  points: UsedDevicesPoint[];
  link: { title: string; to: string };
};

export type UsedDevicesProps = Omit<SectionProps, "id" | "children" | "content"> & {
  id?: string;
  content: UsedDevicesContent;
  /** Вживані пристрої; секція бере перші три. */
  products: ProductCardData[];
  onAddToCart?: (product: ProductCardData) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

/** Вживана техніка: ink-панель з умовами та три картки пристроїв. */
export function UsedDevices({
  id = "used-devices",
  content,
  products,
  onAddToCart,
  addingHandle,
  ...props
}: UsedDevicesProps) {
  return (
    <Section id={id} {...props}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card size="panel" tone="ink" className="gap-0">
          <SectionHeader
            sectionId={id}
            title={content.title}
            description={content.description}
            onDark
            className="mb-6"
          />

          <ItemGroup asChild className="mb-8 gap-4">
            <ul>
              {content.points.map((point) => {
                const Icon = ICONS[point.icon];

                return (
                  <li key={point.title}>
                    <Item variant="on-dark" size="none" className="flex-nowrap">
                      <ItemMedia variant="icon" tone="dark">
                        <Icon strokeWidth={2} />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle asChild>
                          <h3>{point.title}</h3>
                        </ItemTitle>
                        <ItemDescription>{point.text}</ItemDescription>
                      </ItemContent>
                    </Item>
                  </li>
                );
              })}
            </ul>
          </ItemGroup>

          <Button asChild variant="lime" className="mt-auto w-full sm:w-fit">
            <Link to={content.link.to} prefetch="intent">
              {content.link.title}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </Button>
        </Card>

        <ul
          role="list"
          className="-mx-gutter flex min-w-0 snap-x scroll-px-gutter gap-3 overflow-x-auto px-gutter py-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:p-0"
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
      </div>
    </Section>
  );
}
