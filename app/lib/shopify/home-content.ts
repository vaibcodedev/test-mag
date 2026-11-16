import { Cache, type StorefrontApi } from "@shopify/hydrogen";

import type { AboutStat } from "~/components/home/about";
import type { ArticleCardData } from "~/components/home/articles";
import { DEMO_BENTO_CATEGORIES, type BentoCategory } from "~/components/home/category-bento";
import type { FaqItem } from "~/components/home/faq";
import type { HomeBanner, HomeBannerColor } from "~/components/home/hero-slider";
import type { Review, ReviewsRating } from "~/components/home/reviews";
import type { Usp } from "~/components/home/usp-strip";
import type { ProductCardImage } from "~/components/product/product-card";
import {
  HOME_COLLECTION_COUNT_LIMIT,
  HOME_COLLECTIONS_QUERY,
  HOME_METAOBJECTS_QUERY,
} from "~/graphql/queries/home-content.query";
import { FALLBACK_BLOG } from "~/lib/content/articles";
import { HOME_CONTENT, type HomeContent } from "~/lib/content/home";
import { CATALOG_LINKS, STORE_INFO, type NavLink, type StoreInfo } from "~/lib/content/site";
import type { Money } from "~/lib/format";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import { loadBlog } from "./content";
import { requireData } from "./errors";
import { isHexColor, parseListMetafield } from "./product";

type Client = StorefrontGraphqlClient;

export type HomeMetaobjectsData = StorefrontApi.ResultOf<typeof HOME_METAOBJECTS_QUERY>;
export type HomeCollectionsData = StorefrontApi.ResultOf<typeof HOME_COLLECTIONS_QUERY>;

/** Запис метаоб'єкта у відповіді Storefront API: handle і список полів. */
export type HomeMetaobject = HomeMetaobjectsData["faq"]["nodes"][number];
type HomeMetaobjectField = HomeMetaobject["fields"][number];
type HomeCollection = NonNullable<HomeCollectionsData["iphone"]>;

/** Скільки статей показує секція головної. */
const HOME_ARTICLES = 3;
/**
 * Плитки каталогу беруться з магазину, коли в ньому є щонайменше стільки колекцій каталогу.
 * Інакше випадковий збіг handle (на mock.shop є своя `accessories`) дав би сітку з однієї плитки.
 */
const MIN_BENTO_CATEGORIES = 4;

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_CODE = /^[A-Z]{3}$/;
const TELEGRAM_NAME = /^[a-z0-9_]{3,}$/i;
const TELEGRAM_PREFIX = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\//i;
const MIN_PHONE_DIGITS = 9;

/* ------------------------------------------------------------------ */
/* Читання полів метаоб'єкта                                           */
/* ------------------------------------------------------------------ */

type Fields = Map<string, HomeMetaobjectField>;

function fieldsOf(entry: HomeMetaobject | null | undefined): Fields {
  const fields: Fields = new Map();
  if (!Array.isArray(entry?.fields)) return fields;
  for (const field of entry.fields) {
    if (field && typeof field.key === "string") fields.set(field.key, field);
  }
  return fields;
}

/** Текст поля без пробілів по краях; порожнє поле — `null`. */
function text(fields: Fields, key: string): string | null {
  const value = fields.get(key)?.value;
  if (typeof value !== "string") return null;
  return value.trim() || null;
}

/** Число; десяткову кому («4,9») теж приймаємо. */
function number(fields: Fields, key: string): number | null {
  const value = text(fields, key);
  if (value === null) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function integer(fields: Fields, key: string): number | null {
  const value = number(fields, key);
  return value !== null && Number.isInteger(value) ? value : null;
}

function boolean(fields: Fields, key: string): boolean | null {
  const value = text(fields, key);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function list(fields: Fields, key: string): string[] {
  return parseListMetafield(text(fields, key));
}

/** Поле типу money: «{"amount":"64999.0","currency_code":"UAH"}». */
function money(fields: Fields, key: string): Money | null {
  const value = text(fields, key);
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const { amount, currency_code: currencyCode } = parsed as Record<string, unknown>;
    const numeric = typeof amount === "number" ? amount : Number.parseFloat(String(amount));
    if (!Number.isFinite(numeric) || numeric < 0) return null;
    if (typeof currencyCode !== "string" || !CURRENCY_CODE.test(currencyCode)) return null;
    return { amount: String(amount), currencyCode: currencyCode as Money["currencyCode"] };
  } catch {
    return null;
  }
}

function toImage(image: ProductCardImage | null | undefined): ProductCardImage | null {
  return image && typeof image.url === "string" && image.url ? image : null;
}

/**
 * Посилання з адмінки: шлях на сайті («/collections/iphone») або адреса https.
 * Усе інше (зокрема `javascript:`) відкидається, бо значення потрапляє в href.
 */
function link(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return /^https:\/\/\S+$/i.test(value) ? value : null;
}

/** Записи з полем `order` ідуть за ним; без нього — після решти, у порядку з магазину. */
function sortByOrder<T extends { order: number | null }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        (a.item.order ?? Number.POSITIVE_INFINITY) - (b.item.order ?? Number.POSITIVE_INFINITY) ||
        a.index - b.index,
    )
    .map(({ item }) => item);
}

function entriesOf(entries: readonly HomeMetaobject[] | null | undefined): HomeMetaobject[] {
  return Array.isArray(entries) ? entries.filter(Boolean) : [];
}

/* ------------------------------------------------------------------ */
/* Метаоб'єкти → дані секцій                                           */
/* ------------------------------------------------------------------ */

/** `faq_item`: записи без питання або відповіді пропускаються. */
export function mapFaqItems(entries: readonly HomeMetaobject[] | null | undefined): FaqItem[] {
  const items = entriesOf(entries).flatMap((entry) => {
    const fields = fieldsOf(entry);
    const question = text(fields, "question");
    const answer = text(fields, "answer");
    return question && answer ? [{ question, answer, order: integer(fields, "order") }] : [];
  });
  return sortByOrder(items).map(({ question, answer }) => ({ question, answer }));
}

/** `review`: потрібні ім'я й текст; найновіші відгуки першими. */
export function mapReviews(entries: readonly HomeMetaobject[] | null | undefined): Review[] {
  const reviews = entriesOf(entries).flatMap((entry) => {
    const fields = fieldsOf(entry);
    const name = text(fields, "name");
    const body = text(fields, "text");
    if (!name || !body) return [];
    const date = text(fields, "date");
    return [
      {
        name,
        text: body,
        date: date && ISO_DATE.test(date) ? date : "",
        source: text(fields, "source") ?? "",
      },
    ];
  });
  // ISO-дати порівнюються як рядки; відгуки без дати опиняються в кінці.
  return reviews
    .map((review, index) => ({ review, index }))
    .sort((a, b) => b.review.date.localeCompare(a.review.date) || a.index - b.index)
    .map(({ review }) => review);
}

/** `usp`: потрібен заголовок. Невідому назву іконки секція замінює запасною. */
export function mapUsps(entries: readonly HomeMetaobject[] | null | undefined): Usp[] {
  const usps = entriesOf(entries).flatMap((entry) => {
    const fields = fieldsOf(entry);
    const title = text(fields, "title");
    if (!title) return [];
    return [
      {
        icon: text(fields, "icon") ?? "",
        title,
        caption: text(fields, "caption") ?? "",
        order: integer(fields, "order"),
      },
    ];
  });
  return sortByOrder(usps).map(({ icon, title, caption }) => ({ icon, title, caption }));
}

/** `about_stat`: потрібні число й підпис. */
export function mapAboutStats(entries: readonly HomeMetaobject[] | null | undefined): AboutStat[] {
  const stats = entriesOf(entries).flatMap((entry) => {
    const fields = fieldsOf(entry);
    const value = text(fields, "value");
    const label = text(fields, "label");
    return value && label ? [{ value, label, order: integer(fields, "order") }] : [];
  });
  return sortByOrder(stats).map(({ value, label }) => ({ value, label }));
}

function bannerColors(fields: Fields): HomeBannerColor[] {
  const names = list(fields, "color_names");
  return list(fields, "color_swatches").flatMap((hex, index) =>
    isHexColor(hex) ? [{ name: names[index] ?? hex, hex }] : [],
  );
}

/**
 * `home_banner`. Потрібні заголовок і посилання: власне (`link`) або сторінка товару з поля
 * `product`. Ціна й фото теж беруться з товару, якщо свої поля порожні.
 */
export function mapHomeBanners(
  entries: readonly HomeMetaobject[] | null | undefined,
): HomeBanner[] {
  const banners = entriesOf(entries).flatMap((entry) => {
    const fields = fieldsOf(entry);
    const title = text(fields, "title");

    const productReference = fields.get("product")?.reference;
    const product = productReference?.__typename === "Product" ? productReference : null;
    const imageReference = fields.get("image")?.reference;
    const ownImage = imageReference?.__typename === "MediaImage" ? imageReference.image : null;

    const href =
      link(text(fields, "link")) ?? (product?.handle ? `/products/${product.handle}` : null);
    if (!title || !href) return [];

    const colors = bannerColors(fields);
    const specs = list(fields, "specs");
    const banner: HomeBanner = {
      id: typeof entry.handle === "string" && entry.handle ? entry.handle : href,
      label: text(fields, "label"),
      title,
      accent: text(fields, "accent"),
      subtitle: text(fields, "subtitle"),
      specs: specs.length > 0 ? specs : undefined,
      colors: colors.length > 0 ? colors : undefined,
      price: money(fields, "price") ?? product?.priceRange?.minVariantPrice ?? null,
      priceFrom: boolean(fields, "price_from") ?? undefined,
      installmentMonths: integer(fields, "installment_months"),
      image: toImage(ownImage) ?? toImage(product?.featuredImage),
      href,
      compareHref: link(text(fields, "compare_link")),
      delivery: text(fields, "delivery"),
    };
    return [{ banner, order: integer(fields, "order") }];
  });
  return sortByOrder(banners).map(({ banner }) => banner);
}

function phoneHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < MIN_PHONE_DIGITS) return null;
  // Український номер без коду країни: «068 129 99 00».
  if (digits.length === 10 && digits.startsWith("0")) return `tel:+38${digits}`;
  return `tel:+${digits}`;
}

function telegramName(value: string | null): string | null {
  const name = value?.replace(TELEGRAM_PREFIX, "").replace(/^@/, "") ?? "";
  return TELEGRAM_NAME.test(name) ? name : null;
}

/**
 * `store_info` → дані магазину. `null`, якщо запису немає. Поле, якого в записі немає або
 * яке заповнене з помилкою, береться із `fallback`; пов'язані поля (широта з довготою,
 * години відкриття із закриттям) замінюються лише парою.
 */
export function mapStoreInfo(
  entries: readonly HomeMetaobject[] | null | undefined,
  fallback: StoreInfo = STORE_INFO,
): StoreInfo | null {
  const entry = entriesOf(entries)[0];
  if (!entry) return null;
  const fields = fieldsOf(entry);
  if (fields.size === 0) return null;

  const latitude = number(fields, "latitude");
  const longitude = number(fields, "longitude");
  const validPlace =
    latitude !== null &&
    longitude !== null &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

  const opens = text(fields, "opens");
  const closes = text(fields, "closes");
  const validHours = opens !== null && closes !== null && TIME.test(opens) && TIME.test(closes);

  const phone = text(fields, "phone");
  const phoneLink = phone ? phoneHref(phone) : null;
  const telegram = telegramName(text(fields, "telegram"));

  return {
    name: text(fields, "name") ?? fallback.name,
    postalCode: text(fields, "postal_code") ?? fallback.postalCode,
    city: text(fields, "city") ?? fallback.city,
    street: text(fields, "street") ?? fallback.street,
    latitude: validPlace ? latitude : fallback.latitude,
    longitude: validPlace ? longitude : fallback.longitude,
    hours: text(fields, "hours") ?? fallback.hours,
    opens: validHours ? opens : fallback.opens,
    closes: validHours ? closes : fallback.closes,
    phone: phone && phoneLink ? phone : fallback.phone,
    phoneHref: phoneLink ?? fallback.phoneHref,
    telegramHandle: telegram ? `@${telegram}` : fallback.telegramHandle,
    telegramUrl: telegram ? `https://t.me/${telegram}` : fallback.telegramUrl,
    legalName: text(fields, "legal_name") ?? fallback.legalName,
    taxId: text(fields, "tax_id") ?? fallback.taxId,
  };
}

/** Оцінка в Google з полів `store_info`. `null`, якщо бракує оцінки, кількості або посилання. */
export function mapReviewsRating(
  entries: readonly HomeMetaobject[] | null | undefined,
): ReviewsRating | null {
  const fields = fieldsOf(entriesOf(entries)[0]);
  const value = number(fields, "google_rating");
  const count = integer(fields, "google_reviews_count");
  const url = link(text(fields, "google_reviews_url"));
  if (value === null || value <= 0 || value > 5) return null;
  if (count === null || count < 0 || !url?.startsWith("https://")) return null;
  return { value, count, url };
}

/* ------------------------------------------------------------------ */
/* Колекції → плитки каталогу                                          */
/* ------------------------------------------------------------------ */

function handleOf(navLink: NavLink): string {
  return navLink.to.split("/").pop() ?? "";
}

function collectionOf(
  data: HomeCollectionsData | null | undefined,
  handle: string,
): HomeCollection | null {
  if (!data || !Object.hasOwn(data, handle)) return null;
  return data[handle as keyof HomeCollectionsData] ?? null;
}

function countedIds(collection: HomeCollection): string[] {
  return (collection.counted?.nodes ?? []).map((node) => node.id);
}

/** Плитки з тих самих колекцій і в тому самому порядку, що й у демо-сітці. */
const BENTO_LINKS: NavLink[] = DEMO_BENTO_CATEGORIES.map(({ title, to }) => ({ title, to }));

/**
 * Колекції магазину → плитки каталогу в порядку `links`. Колекції, якої немає або яка
 * порожня, плитка не дістається. Кількість товарів рахується за завантаженими id, тож
 * вона не перевищує HOME_COLLECTION_COUNT_LIMIT.
 */
export function mapBentoCategories(
  data: HomeCollectionsData | null | undefined,
  links: readonly NavLink[] = BENTO_LINKS,
): BentoCategory[] {
  return links.flatMap((navLink) => {
    const collection = collectionOf(data, handleOf(navLink));
    if (!collection) return [];
    const productCount = Math.min(countedIds(collection).length, HOME_COLLECTION_COUNT_LIMIT);
    if (productCount === 0) return [];

    const cheapest = collection.cheapest?.nodes?.[0];
    return [
      {
        title: collection.title?.trim() || navLink.title,
        to: navLink.to,
        image: toImage(collection.image) ?? toImage(cheapest?.featuredImage),
        productCount,
        priceFrom: cheapest?.priceRange?.minVariantPrice ?? null,
      },
    ];
  });
}

/** Скільки різних товарів у колекціях каталогу: товар із кількох колекцій рахується раз. */
export function countCatalogProducts(
  data: HomeCollectionsData | null | undefined,
  links: readonly NavLink[] = CATALOG_LINKS,
): number {
  const ids = new Set<string>();
  for (const navLink of links) {
    const collection = collectionOf(data, handleOf(navLink));
    if (collection) for (const id of countedIds(collection)) ids.add(id);
  }
  return ids.size;
}

/* ------------------------------------------------------------------ */
/* Збирання вмісту головної                                            */
/* ------------------------------------------------------------------ */

export type HomeContentSources = {
  metaobjects?: Partial<HomeMetaobjectsData> | null;
  collections?: HomeCollectionsData | null;
  articles?: readonly ArticleCardData[] | null;
};

const orBase = <T>(items: T[], base: T[]): T[] => (items.length > 0 ? items : base);

/**
 * Відповіді магазину → вміст головної тієї ж форми, що й `HOME_CONTENT`.
 * Кожна секція вирішує сама: є записи в магазині — показує їх, немає — лишає вміст із `base`.
 */
export function buildHomeContent(
  { metaobjects, collections, articles }: HomeContentSources,
  base: HomeContent = HOME_CONTENT,
): HomeContent {
  const storeEntries = metaobjects?.storeInfo?.nodes;
  const categories = mapBentoCategories(collections);
  const storeArticles = (articles ?? []).slice(0, HOME_ARTICLES);

  return {
    ...base,
    store: mapStoreInfo(storeEntries, base.store) ?? base.store,
    banners: orBase(mapHomeBanners(metaobjects?.banners?.nodes), base.banners),
    usps: orBase(mapUsps(metaobjects?.usps?.nodes), base.usps),
    bento:
      categories.length >= MIN_BENTO_CATEGORIES
        ? { categories, totalProducts: countCatalogProducts(collections) }
        : base.bento,
    about: {
      ...base.about,
      stats: orBase(mapAboutStats(metaobjects?.aboutStats?.nodes), base.about.stats),
    },
    reviews: {
      rating: mapReviewsRating(storeEntries) ?? base.reviews.rating,
      items: orBase(mapReviews(metaobjects?.reviews?.nodes), base.reviews.items),
    },
    articles: {
      ...base.articles,
      items: storeArticles.length > 0 ? storeArticles : base.articles.items,
    },
    faq: { ...base.faq, items: orBase(mapFaqItems(metaobjects?.faq?.nodes), base.faq.items) },
  };
}

/**
 * Вміст головної з магазину: метаоб'єкти, колекції каталогу та статті блогу.
 * На mock.shop і в магазині без визначень метаоб'єктів повертає `HOME_CONTENT` як є.
 *
 * Запасний вміст секції — це демо-дані, тому він доречний лише тоді, коли магазин відповів
 * і записів у ньому справді немає. Запит без даних (помилка Storefront API) → 502, збій мережі
 * теж не перехоплюється: показати вигадані відгуки чи банери замість справжніх гірше, ніж помилку.
 * Часткова відповідь (не прочитався один тип метаоб'єктів) лише пишеться в журнал.
 */
export async function loadHomeContent(storefrontClient: Client): Promise<HomeContent> {
  const [metaobjects, collections, blog] = await Promise.all([
    storefrontClient.graphql(HOME_METAOBJECTS_QUERY, { cache: Cache.long() }),
    storefrontClient.graphql(HOME_COLLECTIONS_QUERY, { cache: Cache.long() }),
    loadBlog(storefrontClient, FALLBACK_BLOG.handle, new URLSearchParams()),
  ]);

  return buildHomeContent({
    metaobjects: requireData("HomeMetaobjects", metaobjects),
    collections: requireData("HomeCollections", collections),
    articles: blog?.source === "shopify" ? blog.articles : null,
  });
}
