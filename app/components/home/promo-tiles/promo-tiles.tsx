import { ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";
import { Link, NavLink } from "react-router";

import type { ProductCardImage } from "~/components/product/product-card";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ItemMedia } from "~/components/ui/item";
import { Price } from "~/components/ui/price";
import { ShopImage } from "~/components/ui/shop-image";
import { discountPercent, formatPrice, type Money } from "~/lib/format";
import { cn } from "~/lib/utils";
import { TransitionSource } from "~/lib/view-transition";

/** Плитка з товаром: новинка або товар зі знижкою. */
export type PromoProductTile = {
  /** Назва товару: «Apple Watch Series 11». */
  title: string;
  /** Короткий підпис під назвою. */
  caption?: string | null;
  /** Посилання на товар. */
  to: string;
  image: ProductCardImage | null;
  price: Money;
  /** Стара ціна. У плитці зі знижкою з неї рахується бейдж «−N%». */
  compareAtPrice?: Money | null;
};

/** Синя плитка Trade-in. */
export type PromoTradeInTile = {
  title: string;
  caption?: string | null;
  /** Найбільша сума, яку дають за старий пристрій: «до 24 500 ₴». */
  maxAmount: Money;
  to: string;
};

export type PromoTilesProps = Omit<ComponentProps<"div">, "children"> & {
  newProduct: PromoProductTile;
  saleProduct: PromoProductTile;
  tradeIn: PromoTradeInTile;
};

const IMAGE_FALLBACK_SIZE = 480;
const IMAGE_SIZES = "(min-width: 64rem) 10vw, 30vw";
/** Плитка заповнює клітинку сітки; у вузькій клітинці вона не нижча за 160px. */
const TILE = "h-full min-h-40";
/** Посилання розтягується на всю плитку, тому кільце фокуса малюється на псевдоелементі. */
const TILE_LINK = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg";

function ProductTile({ tile, kind }: { tile: PromoProductTile; kind: "new" | "sale" }) {
  const percent = kind === "sale" ? discountPercent(tile.price, tile.compareAtPrice) : null;

  return (
    <Card
      asChild
      interactive
      padding="sm"
      className={cn(TILE, "flex-row gap-4 @2xl:flex-col-reverse")}
    >
      <TransitionSource href={tile.to}>
        <article data-slot="promo-tile" data-kind={kind}>
          <CardContent className="flex flex-1 flex-col items-start gap-2">
            {kind === "new" ? <Badge variant="new">Новинка</Badge> : null}
            {percent ? (
              <Badge variant="sale">
                <span className="sr-only">Знижка </span>−{percent}%
              </Badge>
            ) : null}
            <CardTitle asChild>
              <h3>
                <NavLink
                  viewTransition
                  to={tile.to}
                  prefetch="intent"
                  className={cn(TILE_LINK, "focus-visible:after:shadow-focus")}
                >
                  {tile.title}
                </NavLink>
              </h3>
            </CardTitle>
            {tile.caption ? (
              <CardDescription className="text-caption">{tile.caption}</CardDescription>
            ) : null}
            <Price
              price={tile.price}
              compareAt={kind === "sale" ? tile.compareAtPrice : null}
              className="mt-auto pt-1"
            />
          </CardContent>
          {tile.image ? (
            // Рамка без сталих пропорцій: у рядку вона на всю висоту плитки, у стовпчику — 128px.
            <div
              data-vt-target
              className="relative w-28 shrink-0 overflow-hidden rounded-md bg-photo @2xl:h-32 @2xl:w-full"
            >
              <ShopImage
                src={tile.image.url}
                alt={tile.image.altText ?? ""}
                width={tile.image.width ?? IMAGE_FALLBACK_SIZE}
                height={tile.image.height ?? IMAGE_FALLBACK_SIZE}
                sizes={IMAGE_SIZES}
                className="absolute inset-0 size-full lift-photo object-cover"
              />
            </div>
          ) : null}
        </article>
      </TransitionSource>
    </Card>
  );
}

function TradeInTile({ tile }: { tile: PromoTradeInTile }) {
  return (
    <Card asChild tone="blue" interactive padding="sm" className={TILE}>
      <article data-slot="promo-tile" data-kind="trade-in">
        <CardHeader>
          <CardTitle asChild>
            <h3 className="text-h3">
              <Link
                viewTransition
                to={tile.to}
                prefetch="intent"
                className={cn(TILE_LINK, "focus-visible:after:shadow-focus-offset")}
              >
                {tile.title}
              </Link>
            </h3>
          </CardTitle>
          {tile.caption ? <CardDescription>{tile.caption}</CardDescription> : null}
          <CardAction>
            <ItemMedia
              asChild
              variant="icon"
              shape="round"
              className="bg-surface text-blue transition-transform group-focus-within:-rotate-45 group-hover:-rotate-45"
            >
              <span aria-hidden="true">
                <ArrowUpRight strokeWidth={2} />
              </span>
            </ItemMedia>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <p className="text-h3 tabular-nums">до {formatPrice(tile.maxAmount)}</p>
        </CardFooter>
      </article>
    </Card>
  );
}

/**
 * Три плитки поруч із hero: новинка, товар зі знижкою, Trade-in.
 * Без власної обгортки: заповнює клітинку сітки. У вузькій клітинці плитки йдуть
 * стовпчиком однакової висоти, у широкій (планшет) — у три колонки.
 */
export function PromoTiles({
  newProduct,
  saleProduct,
  tradeIn,
  className,
  ...props
}: PromoTilesProps) {
  return (
    <div data-slot="promo-tiles" className={cn("@container h-full min-w-0", className)} {...props}>
      <ul aria-label="Пропозиції тижня" className="grid h-full auto-rows-fr gap-4 @2xl:grid-cols-3">
        <li className="min-w-0">
          <ProductTile tile={newProduct} kind="new" />
        </li>
        <li className="min-w-0">
          <ProductTile tile={saleProduct} kind="sale" />
        </li>
        <li className="min-w-0">
          <TradeInTile tile={tradeIn} />
        </li>
      </ul>
    </div>
  );
}
