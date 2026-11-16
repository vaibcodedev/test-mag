import {
  ArrowRight,
  ArrowUpRight,
  Gift,
  ShieldCheck,
  Smartphone,
  SmartphoneNfc,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { formatPrice, plural, type Money } from "~/lib/format";

export type ServiceIcon = "data-transfer" | "protection" | "warranty" | "gift";

const ICONS: Record<ServiceIcon, LucideIcon> = {
  "data-transfer": SmartphoneNfc,
  protection: Smartphone,
  warranty: ShieldCheck,
  gift: Gift,
};

type ServiceLink = { title: string; to: string };

export type ServiceCard = {
  icon: ServiceIcon;
  title: string;
  text: string;
  to: string;
};

export type ServicesContent = {
  title: string;
  description?: string;
  tradeIn: {
    title: string;
    /** Найбільша знижка за старий пристрій: «до 24 500 ₴». */
    maxDiscount: Money;
    /** Підпис під сумою: «знижки на новий пристрій». */
    discountCaption: string;
    text: string;
    link: ServiceLink;
  };
  installments: {
    /** Кількість платежів — велика цифра банера. */
    payments: number;
    title: string;
    text: string;
    /** Назви банків текстом: «monobank», «ПриватБанк». */
    banks: string[];
    banksLabel: string;
    link: ServiceLink;
  };
  cards: ServiceCard[];
};

export type ServicesProps = Omit<SectionProps, "id" | "children" | "content"> & {
  id?: string;
  content: ServicesContent;
};

/** «Trade-in, розстрочка і сервіс»: два банери й чотири сервісні картки. */
export function Services({ id = "services", content, ...props }: ServicesProps) {
  const { tradeIn, installments, cards } = content;

  return (
    <Section id={id} {...props}>
      <SectionHeader sectionId={id} title={content.title} description={content.description} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card size="panel" tone="blue" className="items-start gap-6">
          <CardHeader className="gap-3">
            <CardTitle asChild>
              <h3 className="text-h2-panel">{tradeIn.title}</h3>
            </CardTitle>
            <CardDescription className="max-w-xl text-body">{tradeIn.text}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="flex flex-col gap-1">
              <span className="text-h2 tabular-nums">до {formatPrice(tradeIn.maxDiscount)}</span>
              <span className="text-body">{tradeIn.discountCaption}</span>
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ink">
              <Link to={tradeIn.link.to} prefetch="intent">
                {tradeIn.link.title}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card size="panel" className="items-start gap-6">
          <CardHeader className="gap-6">
            <CardTitle asChild>
              <h3 className="flex flex-col gap-1">
                <span className="text-display text-blue tabular-nums">{installments.payments}</span>
                <span className="text-h2-panel">
                  {plural(installments.payments, {
                    one: "платіж",
                    few: "платежі",
                    many: "платежів",
                  })}{" "}
                  {installments.title}
                </span>
              </h3>
            </CardTitle>
            <CardDescription className="max-w-xl text-body">{installments.text}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul role="list" aria-label={installments.banksLabel} className="flex flex-wrap gap-2">
              {installments.banks.map((bank) => (
                <li key={bank}>
                  <Badge variant="chip" className="font-semibold">
                    {bank}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild variant="primary">
              <Link to={installments.link.to} prefetch="intent">
                {installments.link.title}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <ul role="list" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = ICONS[card.icon];

          return (
            <li key={card.title} className="min-w-0">
              <Card asChild interactive className="h-full">
                <article>
                  <Item size="none">
                    <ItemHeader className="items-start">
                      <ItemMedia variant="icon" size="lg">
                        <Icon strokeWidth={2} />
                      </ItemMedia>
                      <ArrowUpRight
                        aria-hidden="true"
                        strokeWidth={2}
                        className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-blue"
                      />
                    </ItemHeader>
                    <ItemContent className="gap-2">
                      <ItemTitle asChild>
                        <h3 className="text-h3 wrap-break-word">
                          <Link
                            to={card.to}
                            prefetch="intent"
                            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:shadow-focus"
                          >
                            {card.title}
                          </Link>
                        </h3>
                      </ItemTitle>
                      <ItemDescription>{card.text}</ItemDescription>
                    </ItemContent>
                  </Item>
                </article>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
