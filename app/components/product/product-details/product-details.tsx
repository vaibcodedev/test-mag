import { ArrowRight, Check, CreditCard, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { Container } from "~/components/layout/container";
import { USED_WARRANTY_MONTHS } from "~/components/product/used-grade";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "~/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia } from "~/components/ui/item";
import { cn } from "~/lib/utils";

const NEW_WARRANTY_MONTHS = 12;

/** Оформлення HTML-опису з адмінки: теги приходять без класів. */
const RICH_TEXT =
  "flex flex-col gap-4 text-body text-ink-2 [&_a]:text-blue [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-h3 [&_h2]:text-ink [&_h3]:text-card-title [&_h3]:text-ink [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:ms-5 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-1 [&_strong]:font-semibold [&_strong]:text-ink [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border-b [&_td]:py-2 [&_td]:pe-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1";

type Summary = { icon: LucideIcon; title: string; text: string; link: string; to: string };

export type ProductDetailsProps = Omit<ComponentProps<"div">, "children"> & {
  /** HTML-опис товару з Shopify (descriptionHtml). */
  descriptionHtml?: string | null;
  /** Звичайний текст опису: запасний варіант, коли HTML порожній. */
  description?: string | null;
  /** custom.short_specs: «Дисплей: 6,3″ OLED» або просто «Face ID». */
  specs?: readonly string[];
  /** Вживаний пристрій: гарантія 6 місяців. */
  used?: boolean;
};

/** «Дисплей: 6,3″ OLED» → назва й значення; рядок без двокрапки лишається цілим. */
function splitSpec(spec: string): { label: string | null; value: string } {
  const index = spec.indexOf(": ");
  if (index <= 0) return { label: null, value: spec };
  return { label: spec.slice(0, index), value: spec.slice(index + 2) };
}

/** Під колонками товару: опис, характеристики та умови доставки, оплати й гарантії. */
export function ProductDetails({
  descriptionHtml,
  description,
  specs = [],
  used = false,
  className,
  ...props
}: ProductDetailsProps) {
  const warrantyMonths = used ? USED_WARRANTY_MONTHS : NEW_WARRANTY_MONTHS;
  const hasDescription = Boolean(descriptionHtml || description);

  const summaries: Summary[] = [
    {
      icon: Truck,
      title: "Доставка",
      text: "Новою поштою по Україні — завтра. Кур'єром по Вінниці або самовивіз із шоуруму на Соборній, 64.",
      link: "Умови доставки",
      to: "/pages/delivery",
    },
    {
      icon: CreditCard,
      title: "Оплата частинами",
      text: "До 25 платежів від monobank і до 24 від ПриватБанку без переплат. Або карткою чи готівкою в шоурумі.",
      link: "Як оплатити частинами",
      to: "/pages/installments",
    },
    {
      icon: ShieldCheck,
      title: `Гарантія ${warrantyMonths} місяців`,
      text: used
        ? "Перевіряємо кожен вживаний пристрій перед продажем. Якщо щось не так — полагодимо або замінимо."
        : "Офіційна гарантія й наша підтримка: звертайтесь напряму до нас, без біганини по сервісах. 14 днів на повернення.",
      link: "Умови гарантії",
      to: "/pages/warranty",
    },
  ];

  return (
    <Container
      data-slot="product-details"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {hasDescription || specs.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {hasDescription ? (
            <Card asChild padding="lg" className={cn(specs.length === 0 && "lg:col-span-2")}>
              <section aria-labelledby="product-description-title">
                <CardTitle asChild size="h2-panel">
                  <h2 id="product-description-title">Опис</h2>
                </CardTitle>
                <CardContent className="max-w-3xl">
                  {descriptionHtml ? (
                    <div
                      className={RICH_TEXT}
                      dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                  ) : (
                    <p className="text-body text-ink-2">{description}</p>
                  )}
                </CardContent>
              </section>
            </Card>
          ) : null}

          {specs.length > 0 ? (
            <Card asChild padding="lg" className={cn(!hasDescription && "lg:col-span-2")}>
              <section aria-labelledby="product-specs-title">
                <CardTitle asChild size="h2-panel">
                  <h2 id="product-specs-title">Характеристики</h2>
                </CardTitle>
                <CardContent>
                  <ItemGroup asChild className="gap-0 divide-y divide-line">
                    <ul role="list">
                      {specs.map((spec) => {
                        const { label, value } = splitSpec(spec);
                        return (
                          <li key={spec}>
                            <Item size="none" className="flex-nowrap items-baseline gap-3 py-3">
                              {label ? (
                                <ItemDescription className="w-2/5 shrink-0">
                                  {label}
                                </ItemDescription>
                              ) : (
                                <ItemMedia className="self-center">
                                  <Check aria-hidden="true" strokeWidth={2} />
                                </ItemMedia>
                              )}
                              <ItemContent>{value}</ItemContent>
                            </Item>
                          </li>
                        );
                      })}
                    </ul>
                  </ItemGroup>
                </CardContent>
              </section>
            </Card>
          ) : null}
        </div>
      ) : null}

      <section aria-labelledby="product-terms-title">
        <h2 id="product-terms-title" className="sr-only">
          Доставка, оплата й гарантія
        </h2>
        <ul role="list" className="grid gap-4 md:grid-cols-3">
          {summaries.map(({ icon: Icon, title, text, link, to }) => (
            <Card key={to} asChild>
              <li>
                <ItemMedia variant="icon" aria-hidden="true">
                  <Icon strokeWidth={2} />
                </ItemMedia>
                <CardContent className="flex flex-col gap-2">
                  <CardTitle asChild>
                    <h3>{title}</h3>
                  </CardTitle>
                  <CardDescription>{text}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="link" size="sm" className="min-h-11">
                    <Link viewTransition to={to} prefetch="intent">
                      {link}
                      <ArrowRight
                        aria-hidden="true"
                        strokeWidth={2}
                        className="transition-transform group-hover/button:translate-x-1"
                      />
                    </Link>
                  </Button>
                </CardFooter>
              </li>
            </Card>
          ))}
        </ul>
      </section>
    </Container>
  );
}
