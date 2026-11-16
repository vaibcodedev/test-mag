import { Cache } from "@shopify/hydrogen";

import type { ProductCardData } from "~/components/product/product-card";
import { HOME_PRODUCTS_QUERY } from "~/graphql/queries/home.query";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import { requireData } from "./errors";
import { toProductCard } from "./product-card";

const PRODUCT_LIMIT = 16;
const DEALS_COUNT = 4;
const POPULAR_COUNT = 10;
const USED_COUNT = 3;

/** Часовий пояс магазину. Стара назва — для середовищ зі старою базою часових поясів. */
const STORE_TIME_ZONES = ["Europe/Kyiv", "Europe/Kiev"] as const;

function storeTimeFormat(): Intl.DateTimeFormat {
  for (const timeZone of STORE_TIME_ZONES) {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      });
    } catch {
      // Наступна назва поясу.
    }
  }
  throw new RangeError("Часовий пояс Europe/Kyiv недоступний у цьому середовищі.");
}

/** Київський час моменту `time`, записаний так, ніби це UTC: зручно рахувати дні й зсув. */
function kyivWallClock(format: Intl.DateTimeFormat, time: number): number {
  const parts: Record<string, number> = {};
  for (const part of format.formatToParts(new Date(time))) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return Date.UTC(
    parts.year ?? 0,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
}

/** Момент UTC, коли в Києві на годиннику `wallClock` (київський час у записі UTC). */
function kyivToUtc(format: Intl.DateTimeFormat, wallClock: number): number {
  let time = wallClock;
  // Зсув залежить від самого моменту (літній чи зимовий час), тому уточнюємо двічі.
  for (let step = 0; step < 2; step += 1) {
    const offset = kyivWallClock(format, time) - time;
    time = wallClock - offset;
  }
  return time;
}

/**
 * Кінець акції: найближча неділя, 23:59:59 за київським часом (Europe/Kyiv).
 * Зсув від UTC береться з Intl для самої дати, тож улітку це 20:59:59 UTC, узимку — 21:59:59 UTC,
 * і тиждень із переведенням годинників рахується правильно.
 */
export function endOfKyivWeek(now: Date): string {
  const format = storeTimeFormat();
  const local = new Date(kyivWallClock(format, now.getTime()));
  const daysToSunday = (7 - local.getUTCDay()) % 7;

  const endOfSunday = (extraDays: number) =>
    kyivToUtc(
      format,
      Date.UTC(
        local.getUTCFullYear(),
        local.getUTCMonth(),
        local.getUTCDate() + daysToSunday + extraDays,
        23,
        59,
        59,
      ),
    );

  const end = endOfSunday(0);
  // Остання секунда неділі вже минула — акція триває до наступної неділі.
  return new Date(end > now.getTime() ? end : endOfSunday(7)).toISOString();
}

export type HomeProducts = {
  /** «Знижки тижня»: товари колекції `deals`. Порожній список — секцію не показуємо. */
  deals: ProductCardData[];
  popular: ProductCardData[];
  /** «Вживана техніка»: товари колекції `used`. Порожній список — секцію не показуємо. */
  used: ProductCardData[];
  /** Серверний час і кінець акції для відліку без розбіжності під час гідратації. */
  now: string;
  dealsEndAt: string;
};

/**
 * Товари для секцій головної — лише справжні товари магазину.
 *  - «Знижки тижня» — колекція `deals`;
 *  - «Вживана техніка» — колекція `used`;
 *  - «Популярне» — перші товари магазину, крім вживаних.
 * Якщо колекції немає або вона порожня, список порожній і маршрут секцію не показує.
 * TODO(реальний магазин): «Популярне» брати з колекції `hits`.
 */
export async function loadHomeProducts(
  storefrontClient: StorefrontGraphqlClient,
  now: Date = new Date(),
): Promise<HomeProducts> {
  const data = requireData(
    "HomeProducts",
    await storefrontClient.graphql(HOME_PRODUCTS_QUERY, {
      variables: { first: PRODUCT_LIMIT, deals: DEALS_COUNT, used: USED_COUNT },
      cache: Cache.short(),
    }),
  );

  // Часткова відповідь (помилка в одній із колекцій) уже в журналі: секція просто не показується.
  const products = (data.products?.nodes ?? []).map(toProductCard);
  const deals = (data.deals?.products?.nodes ?? []).map(toProductCard);
  const used = (data.used?.products?.nodes ?? []).map(toProductCard);

  return {
    deals: deals.slice(0, DEALS_COUNT),
    popular: products.filter((product) => !product.used).slice(0, POPULAR_COUNT),
    used: used.slice(0, USED_COUNT),
    now: now.toISOString(),
    dealsEndAt: endOfKyivWeek(now),
  };
}
