import { MapPin, Phone, Send } from "lucide-react";
import { Link } from "react-router";

import { Container } from "~/components/layout/container";
import { SERVICE_LINKS, SHOWROOM_LINK, STORE_INFO, type StoreInfo } from "~/lib/content/site";

const LINK =
  "inline-flex min-h-11 items-center gap-1.5 rounded-sm text-small text-on-ink-muted transition-colors duration-150 hover:text-surface focus-ring-on-ink";

/** Верхня ink-смуга: шоурум, сервісні сторінки, Telegram і телефон. */
export function TopBar({ store = STORE_INFO }: { store?: StoreInfo }) {
  return (
    <div data-slot="top-bar" className="bg-ink text-surface">
      {/* py-1: кільцю фокуса посилань потрібне місце зверху й знизу. */}
      <Container className="flex items-center justify-between gap-6 py-1">
        <nav aria-label="Сервіс і шоурум" className="min-w-0">
          <ul className="flex items-center gap-x-6">
            <li>
              <Link
                viewTransition
                to={SHOWROOM_LINK.to}
                className={`${LINK} font-semibold text-surface`}
              >
                <MapPin aria-hidden="true" strokeWidth={2} className="size-4 text-lime" />
                {SHOWROOM_LINK.title}
              </Link>
            </li>
            {SERVICE_LINKS.map((link) => (
              <li key={link.to} className="hidden lg:block">
                <Link viewTransition to={link.to} className={LINK}>
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="flex shrink-0 items-center gap-x-6">
          <li className="hidden sm:block">
            <a href={store.telegramUrl} className={LINK} rel="noopener noreferrer" target="_blank">
              <Send aria-hidden="true" strokeWidth={2} className="size-4" />
              Telegram
              <span className="sr-only"> (відкриється в новій вкладці)</span>
            </a>
          </li>
          <li>
            <a href={store.phoneHref} className={`${LINK} font-semibold text-surface`}>
              <Phone aria-hidden="true" strokeWidth={2} className="size-4 text-lime" />
              {store.phone}
            </a>
          </li>
        </ul>
      </Container>
    </div>
  );
}
