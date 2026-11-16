import { Clock, MapPin, Phone, Send } from "lucide-react";
import { Link } from "react-router";

import { Container } from "~/components/layout/container";
import { Badge } from "~/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { Wordmark } from "~/components/ui/wordmark";
import {
  BUYER_LINKS,
  CATALOG_LINKS,
  COMPANY_LINKS,
  PAYMENT_METHODS,
  STORE_INFO,
  storeAddress,
  type NavLink,
  type StoreInfo,
} from "~/lib/content/site";

const LINK =
  "inline-flex min-h-11 items-center gap-2 rounded-sm text-small text-on-ink-muted transition-colors duration-150 hover:text-surface focus-ring-on-ink";

function FooterColumn({ id, title, links }: { id: string; title: string; links: NavLink[] }) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="mb-2 text-small font-semibold text-surface">
        {title}
      </h2>
      <ul>
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className={LINK}>
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Футер на ink: посилання, контакти, способи оплати, юридична інформація, вордмарк. */
export function Footer({ store = STORE_INFO }: { store?: StoreInfo }) {
  const year = new Date().getFullYear();

  return (
    <footer
      data-slot="footer"
      className="mt-section overflow-hidden bg-ink pb-16 text-surface lg:pb-0"
    >
      <Container className="flex flex-col gap-12 pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn id="footer-catalog" title="Каталог" links={CATALOG_LINKS} />
          <FooterColumn id="footer-buyers" title="Покупцям" links={BUYER_LINKS} />
          <FooterColumn id="footer-company" title="Магазин" links={COMPANY_LINKS} />
          <div>
            <h2 className="mb-2 text-small font-semibold text-surface">Контакти</h2>
            <ItemGroup asChild className="-ms-3 w-auto gap-0">
              <ul>
                <li>
                  <Item asChild variant="on-dark" size="sm">
                    <a href={store.phoneHref}>
                      <ItemMedia>
                        <Phone aria-hidden="true" strokeWidth={2} className="text-lime" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{store.phone}</ItemTitle>
                      </ItemContent>
                    </a>
                  </Item>
                </li>
                <li>
                  <Item asChild variant="on-dark" size="sm">
                    <a href={store.telegramUrl} rel="noopener noreferrer" target="_blank">
                      <ItemMedia>
                        <Send aria-hidden="true" strokeWidth={2} className="text-lime" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription>
                          {store.telegramHandle}
                          <span className="sr-only"> у Telegram (відкриється в новій вкладці)</span>
                        </ItemDescription>
                      </ItemContent>
                    </a>
                  </Item>
                </li>
                <li>
                  <Item variant="on-dark" size="sm">
                    <ItemMedia>
                      <MapPin aria-hidden="true" strokeWidth={2} className="text-lime" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemDescription>{storeAddress(store)}</ItemDescription>
                    </ItemContent>
                  </Item>
                </li>
                <li>
                  <Item variant="on-dark" size="sm">
                    <ItemMedia>
                      <Clock aria-hidden="true" strokeWidth={2} className="text-lime" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemDescription>{store.hours}</ItemDescription>
                    </ItemContent>
                  </Item>
                </li>
              </ul>
            </ItemGroup>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-on-ink-12 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="sr-only">Способи оплати</h2>
            <ul className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <li key={method} className="flex">
                  <Badge variant="chip-on-dark">{method}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-caption text-on-ink-muted">
            © {year} {store.legalName}, РНОКПП {store.taxId}. {storeAddress(store)}.
          </p>
        </div>
      </Container>

      <Container className="pt-8">
        <Wordmark tone="lime" size="giant" mark="dot" className="-mb-[0.14em] block" />
      </Container>
    </footer>
  );
}
