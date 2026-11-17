import { MapPin, Menu, Phone, Scale, Send, User, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import type { MegaMenuCategory } from "~/components/layout/mega-menu";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Wordmark } from "~/components/ui/wordmark";
import { useCompare } from "~/hooks/use-compare";
import { BUYER_LINKS, STORE_INFO, storeAddress, type StoreInfo } from "~/lib/content/site";

type MobileNavProps = {
  categories: readonly MegaMenuCategory[];
  store?: StoreInfo;
  /** Покупець увійшов у кабінет: пункт меню веде в «Мій кабінет», а не на вхід. */
  signedIn?: boolean;
};

/**
 * Бургер-меню на мобільному: каталог, порівняння й кабінет (у шапці вони є лише на
 * десктопі, а в нижній панелі для них немає місця), сторінки для покупців, контакти.
 */
export function MobileNav({ categories, store = STORE_INFO, signedIn = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { count: compareCount } = useCompare();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Відкрити меню" className="-ms-2">
          <Menu aria-hidden="true" strokeWidth={2} className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" data-slot="mobile-nav">
        <SheetHeader>
          <SheetTitle asChild>
            <div>
              <span className="sr-only">Меню</span>
              <Wordmark />
            </div>
          </SheetTitle>
          <SheetDescription>Техніка Apple у Вінниці та по Україні</SheetDescription>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-4">
          <nav aria-label="Каталог">
            <p className="px-3 pb-1 text-caption font-semibold text-muted-foreground">Каталог</p>
            <ItemGroup asChild className="gap-0">
              <ul>
                {categories.map((category) => (
                  <li key={category.to}>
                    <Item asChild size="sm">
                      <Link viewTransition to={category.to} onClick={close}>
                        <ItemContent>
                          <ItemTitle>{category.title}</ItemTitle>
                        </ItemContent>
                      </Link>
                    </Item>
                  </li>
                ))}
              </ul>
            </ItemGroup>
          </nav>
          <Separator />
          <nav aria-label="Порівняння і кабінет">
            <ItemGroup asChild className="gap-0">
              <ul>
                <li>
                  <Item asChild size="sm">
                    <Link viewTransition to="/compare" onClick={close}>
                      <ItemMedia>
                        <Scale aria-hidden="true" strokeWidth={2} />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>Порівняння</ItemTitle>
                      </ItemContent>
                      {compareCount > 0 ? (
                        <ItemActions>
                          <Badge variant="count">
                            <span className="sr-only">Товарів у порівнянні: </span>
                            {compareCount}
                          </Badge>
                        </ItemActions>
                      ) : null}
                    </Link>
                  </Item>
                </li>
                <li>
                  <Item asChild size="sm">
                    <Link viewTransition to="/account" onClick={close}>
                      <ItemMedia>
                        {signedIn ? (
                          <UserRoundCheck aria-hidden="true" strokeWidth={2} />
                        ) : (
                          <User aria-hidden="true" strokeWidth={2} />
                        )}
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{signedIn ? "Мій кабінет" : "Увійти до кабінету"}</ItemTitle>
                      </ItemContent>
                    </Link>
                  </Item>
                </li>
              </ul>
            </ItemGroup>
          </nav>
          <Separator />
          <nav aria-label="Покупцям">
            <p className="px-3 pb-1 text-caption font-semibold text-muted-foreground">Покупцям</p>
            <ItemGroup asChild className="gap-0">
              <ul>
                {BUYER_LINKS.map((link) => (
                  <li key={link.to}>
                    <Item asChild size="sm">
                      <Link viewTransition to={link.to} onClick={close}>
                        {link.title}
                      </Link>
                    </Item>
                  </li>
                ))}
              </ul>
            </ItemGroup>
          </nav>
          <Separator />
          <ItemGroup asChild className="gap-0">
            <ul>
              <li>
                <Item asChild size="sm">
                  <a href={store.phoneHref}>
                    <ItemMedia>
                      <Phone aria-hidden="true" strokeWidth={2} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{store.phone}</ItemTitle>
                    </ItemContent>
                  </a>
                </Item>
              </li>
              <li>
                <Item asChild size="sm">
                  <a href={store.telegramUrl} rel="noopener noreferrer" target="_blank">
                    <ItemMedia>
                      <Send aria-hidden="true" strokeWidth={2} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Написати в Telegram</ItemTitle>
                    </ItemContent>
                    <span className="sr-only"> (відкриється в новій вкладці)</span>
                  </a>
                </Item>
              </li>
              <li>
                <Item asChild size="sm">
                  <Link viewTransition to="/pages/contacts" onClick={close}>
                    <ItemMedia>
                      <MapPin aria-hidden="true" strokeWidth={2} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{storeAddress(store)}</ItemTitle>
                      <ItemDescription>{store.hours}</ItemDescription>
                    </ItemContent>
                  </Link>
                </Item>
              </li>
            </ul>
          </ItemGroup>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
