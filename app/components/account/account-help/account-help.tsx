import { Phone, Send } from "lucide-react";
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
import { BUYER_LINKS, COMPANY_LINKS, type NavLink, type StoreInfo } from "~/lib/content/site";

const SERVICE_PATHS = [
  "/pages/warranty",
  "/pages/returns",
  "/pages/delivery",
  "/pages/trade-in",
  "/pages/contacts",
];

/** Сервісні сторінки, які потрібні після покупки; назви — ті самі, що у футері. */
export const ACCOUNT_SERVICE_LINKS: NavLink[] = SERVICE_PATHS.flatMap(
  (path) => [...BUYER_LINKS, ...COMPANY_LINKS].find((link) => link.to === path) ?? [],
);

export type AccountHelpProps = Omit<ComponentProps<"section">, "children"> & {
  store: StoreInfo;
  links?: readonly NavLink[];
};

/** Допомога покупцеві: сервісні сторінки пігулками та швидкий зв'язок з магазином. */
export function AccountHelp({
  store,
  links = ACCOUNT_SERVICE_LINKS,
  className,
  ...props
}: AccountHelpProps) {
  const titleId = useId();

  return (
    <Card asChild className={className}>
      <section aria-labelledby={titleId} data-slot="account-help" {...props}>
        <CardHeader>
          <CardTitle asChild size="h3">
            <h2 id={titleId}>Допомога</h2>
          </CardTitle>
          <CardDescription>Питання щодо замовлення? Відповімо {store.hours}.</CardDescription>
        </CardHeader>

        {/* Рядки-посилання мають поля під hover, тож список зсунуто на ці поля вліво. */}
        <ItemGroup asChild className="-mx-3 w-auto gap-1">
          <ul role="list">
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
          </ul>
        </ItemGroup>

        <nav aria-label="Сервіс і умови">
          <ul role="list" className="flex flex-wrap gap-2">
            {links.map((link) => (
              <li key={link.to}>
                <Button asChild variant="secondary" size="sm" className="rounded-pill">
                  <Link viewTransition to={link.to} prefetch="intent">
                    {link.title}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </Card>
  );
}
