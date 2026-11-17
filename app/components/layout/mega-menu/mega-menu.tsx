import { ArrowRight, LayoutGrid } from "lucide-react";
import { Link } from "react-router";

import { Item, ItemContent, ItemMedia, ItemTitle } from "~/components/ui/item";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";
import { ShopImage } from "~/components/ui/shop-image";
import { BUYER_LINKS, type NavLink } from "~/lib/content/site";

export type MegaMenuCategory = NavLink & {
  image?: { url: string; width?: number | null; height?: number | null } | null;
};

const THUMB_SIZE = 96;

/** Кнопка «Каталог» з мега-меню: категорії з мініфото та посилання для покупців. */
export function MegaMenu({ categories }: { categories: readonly MegaMenuCategory[] }) {
  return (
    <NavigationMenu data-slot="mega-menu" className="flex-none">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-blue text-surface focus-ring-offset hover:bg-blue-hover data-open:bg-blue-hover [&_svg]:text-surface">
            <LayoutGrid aria-hidden="true" strokeWidth={2} />
            Каталог
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-6">
            <div className="grid w-[min(56rem,calc(100vw-3rem))] grid-cols-[2fr_1fr] gap-8">
              <div>
                <p className="mb-3 text-caption font-semibold text-muted-foreground">Категорії</p>
                <ul className="grid grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <li key={category.to}>
                      {/* NavigationMenuLink дає роль і закриття меню, Item — вигляд плитки. */}
                      <NavigationMenuLink asChild className="rounded-md p-2 pe-3">
                        <Item asChild variant="muted" size="sm">
                          <Link viewTransition to={category.to} prefetch="intent">
                            <ItemMedia variant="image" size="sm" fit="cover">
                              {category.image ? (
                                <ShopImage
                                  src={category.image.url}
                                  alt=""
                                  width={THUMB_SIZE}
                                  height={THUMB_SIZE}
                                  widths={[THUMB_SIZE, THUMB_SIZE * 2]}
                                  sizes="48px"
                                />
                              ) : null}
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>{category.title}</ItemTitle>
                            </ItemContent>
                          </Link>
                        </Item>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col">
                <p className="mb-3 text-caption font-semibold text-muted-foreground">Покупцям</p>
                <ul className="flex flex-col">
                  {BUYER_LINKS.map((link) => (
                    <li key={link.to}>
                      <NavigationMenuLink asChild>
                        <Link viewTransition to={link.to}>
                          {link.title}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
                <NavigationMenuLink asChild className="mt-auto font-semibold text-blue">
                  <Link viewTransition to="/collections" prefetch="intent">
                    Увесь каталог
                    <ArrowRight aria-hidden="true" strokeWidth={2} className="text-blue" />
                  </Link>
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
