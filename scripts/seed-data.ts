/**
 * Дані для scripts/seed.ts: що саме створити в магазині Shopify.
 * Товари й правила колекцій лежать у scripts/seed-catalog.ts, фото — у scripts/seed-images.ts.
 *
 * Тексти беруться з демо-вмісту застосунку (`*.demo.ts`, `app/lib/content/*`), щоб магазин
 * і запасний вміст сайту казали одне й те саме. Імпортуються лише файли без залежностей
 * від React та псевдоніма `~/`: Node запускає цей файл напряму, без збирача.
 */
import { ABOUT_DEMO_STATS } from "../app/components/home/about/about.demo.ts";
import { ARTICLES_DEMO } from "../app/components/home/articles/articles.demo.ts";
import { FAQ_DEMO_ITEMS } from "../app/components/home/faq/faq.demo.ts";
import { REVIEWS_DEMO, REVIEWS_DEMO_RATING } from "../app/components/home/reviews/reviews.demo.ts";
import { DEMO_USPS } from "../app/components/home/usp-strip/usp-strip.demo.ts";
import { FALLBACK_BLOG, getFallbackArticleBody } from "../app/lib/content/articles.ts";
import { getFallbackPage, SERVICE_PAGES, type ContentSection } from "../app/lib/content/pages.ts";
import { SPECS_METAFIELD } from "../app/lib/compare/spec-schema.ts";
import { CATALOG_LINKS, STORE_INFO } from "../app/lib/content/site.ts";
import {
  CATALOG_COLLECTION_CONTENT,
  colorValues,
  EXTRA_COLLECTIONS,
  findProduct,
  minPrice,
  type CollectionSeed,
} from "./seed-catalog.ts";

export { PRODUCTS, PRODUCT_COUNT } from "./seed-catalog.ts";

/* ------------------------------------------------------------------ */
/* Метаполя товару                                                     */
/* ------------------------------------------------------------------ */

export type Validation = { name: string; value: string };

export type MetafieldDefinitionSeed = {
  key: string;
  name: string;
  description: string;
  type: string;
  validations?: Validation[];
};

export const METAFIELD_NAMESPACE = "custom";

const choices = (...values: string[]): Validation[] => [
  { name: "choices", value: JSON.stringify(values) },
];

export const PRODUCT_METAFIELD_DEFINITIONS: MetafieldDefinitionSeed[] = [
  {
    key: "badge",
    name: "Бейдж",
    description: "Позначка на картці товару: Новинка, Хіт або Топ.",
    type: "single_line_text_field",
    validations: choices("Новинка", "Хіт", "Топ"),
  },
  {
    key: "installment_months",
    name: "Кількість платежів",
    description: "На скільки платежів ділиться ціна. Якщо порожньо, сайт показує 25.",
    type: "number_integer",
    validations: [
      { name: "min", value: "1" },
      { name: "max", value: "36" },
    ],
  },
  {
    key: "short_specs",
    name: "Короткі характеристики",
    description: "Два-чотири рядки для картки та сторінки товару: «Чип A19 Pro», «Екран 6,3″».",
    type: "list.single_line_text_field",
  },
  {
    key: "color_swatches",
    name: "Кольори",
    description: "Кольори кружечків у тому ж порядку, що й значення опції «Колір».",
    type: "list.color",
  },
  {
    key: "condition_grade",
    name: "Стан вживаного пристрою",
    description: "Лише для вживаної техніки: Як новий, Відмінний або Хороший.",
    type: "single_line_text_field",
    validations: choices("Як новий", "Відмінний", "Хороший"),
  },
  {
    key: "battery_health",
    name: "Ємність акумулятора, %",
    description: "Лише для вживаної техніки: максимальна ємність акумулятора у відсотках.",
    type: "number_integer",
    validations: [
      { name: "min", value: "0" },
      { name: "max", value: "100" },
    ],
  },
  {
    key: SPECS_METAFIELD.key,
    name: "Характеристики",
    description:
      "Технічні характеристики для порівняння: JSON «ключ рядка → значення». Ключі задає схема сайту.",
    type: "json",
  },
];

/* ------------------------------------------------------------------ */
/* Метаоб'єкти                                                         */
/* ------------------------------------------------------------------ */

export type MetaobjectFieldSeed = {
  key: string;
  name: string;
  type: string;
  required?: boolean;
  validations?: Validation[];
};

export type MetaobjectDefinitionSeed = {
  type: string;
  name: string;
  displayNameKey: string;
  fields: MetaobjectFieldSeed[];
};

const text = (key: string, name: string, required = false): MetaobjectFieldSeed => ({
  key,
  name,
  type: "single_line_text_field",
  required,
});
const longText = (key: string, name: string, required = false): MetaobjectFieldSeed => ({
  key,
  name,
  type: "multi_line_text_field",
  required,
});
const ORDER_FIELD: MetaobjectFieldSeed = {
  key: "order",
  name: "Порядок",
  type: "number_integer",
};

export const METAOBJECT_DEFINITIONS: MetaobjectDefinitionSeed[] = [
  {
    type: "faq_item",
    name: "Питання й відповідь",
    displayNameKey: "question",
    fields: [text("question", "Питання", true), longText("answer", "Відповідь", true), ORDER_FIELD],
  },
  {
    type: "store_info",
    name: "Дані магазину",
    displayNameKey: "name",
    fields: [
      text("name", "Назва", true),
      text("postal_code", "Поштовий індекс"),
      text("city", "Місто"),
      text("street", "Вулиця й будинок"),
      { key: "latitude", name: "Широта", type: "number_decimal" },
      { key: "longitude", name: "Довгота", type: "number_decimal" },
      text("hours", "Години роботи текстом"),
      text("opens", "Відчиняється (ГГ:ХХ)"),
      text("closes", "Зачиняється (ГГ:ХХ)"),
      text("phone", "Телефон"),
      text("telegram", "Telegram (@назва)"),
      text("legal_name", "Юридична назва"),
      text("tax_id", "РНОКПП"),
      { key: "google_rating", name: "Оцінка в Google", type: "number_decimal" },
      { key: "google_reviews_count", name: "Кількість відгуків у Google", type: "number_integer" },
      { key: "google_reviews_url", name: "Сторінка відгуків у Google", type: "url" },
    ],
  },
  {
    type: "review",
    name: "Відгук",
    displayNameKey: "name",
    fields: [
      text("name", "Ім'я", true),
      longText("text", "Текст", true),
      { key: "date", name: "Дата", type: "date" },
      text("source", "Джерело"),
    ],
  },
  {
    type: "home_banner",
    name: "Банер головної",
    displayNameKey: "title",
    fields: [
      text("label", "Лейбл над заголовком"),
      text("title", "Заголовок", true),
      text("accent", "Слово-акцент із заголовка"),
      longText("subtitle", "Підзаголовок"),
      { key: "specs", name: "Чипи характеристик", type: "list.single_line_text_field" },
      { key: "color_names", name: "Назви кольорів", type: "list.single_line_text_field" },
      { key: "color_swatches", name: "Кольори", type: "list.color" },
      { key: "price", name: "Ціна (порожньо — ціна товару)", type: "money" },
      { key: "price_from", name: "Показувати «від» перед ціною", type: "boolean" },
      { key: "installment_months", name: "Кількість платежів", type: "number_integer" },
      { key: "product", name: "Товар", type: "product_reference" },
      {
        key: "image",
        name: "Фото (порожньо — фото товару)",
        type: "file_reference",
        validations: [{ name: "file_type_options", value: JSON.stringify(["Image"]) }],
      },
      text("link", "Посилання кнопки «Купити» (порожньо — сторінка товару)"),
      text("compare_link", "Посилання кнопки «Порівняти»"),
      text("delivery", "Плашка про доставку"),
      ORDER_FIELD,
    ],
  },
  {
    type: "usp",
    name: "Перевага магазину",
    displayNameKey: "title",
    fields: [
      text("icon", "Іконка lucide", true),
      text("title", "Заголовок", true),
      text("caption", "Підпис"),
      ORDER_FIELD,
    ],
  },
  {
    type: "about_stat",
    name: "Цифра про магазин",
    displayNameKey: "label",
    fields: [text("value", "Число", true), text("label", "Підпис", true), ORDER_FIELD],
  },
];

/** Значення поля запису. Рядки йдуть як є; `{ product }` скрипт замінює на gid товару. */
export type FieldValue = string | { product: string } | null | undefined;

export type MetaobjectEntrySeed = {
  type: string;
  handle: string;
  fields: Record<string, FieldValue>;
};

const list = (values: readonly string[] | undefined): string | null =>
  values?.length ? JSON.stringify(values) : null;
/** Поле типу money приймає лише валюту магазину, тому вона приходить параметром. */
const money = (amount: number, currency: string): string =>
  JSON.stringify({ amount: amount.toFixed(2), currency_code: currency });

/*
  Банери повторюють DEMO_HOME_BANNERS із app/components/home/hero-slider/hero-slider.demo.ts.
  Той файл імпортувати не можна (він тягне `~/components/...`), тому тексти продубльовано.
  Ціна, кольори, фото й посилання беруться з товару каталогу, тож банер і картка товару
  завжди показують одне й те саме.
*/
type BannerSeed = {
  handle: string;
  label: string;
  title: string;
  accent: string;
  subtitle: string;
  specs: string[];
  priceFrom?: boolean;
  installmentMonths: number;
  /** Handle товару із seed-catalog.ts. */
  product: string;
  compareLink: string;
};

export const BANNERS: BannerSeed[] = [
  {
    handle: "iphone-17-pro",
    label: "Новинка осені",
    title: "iPhone 17 Pro",
    accent: "Pro",
    subtitle: "Три камери по 48 Мп і найбільший акумулятор серед iPhone Pro. Уже в шоурумі.",
    specs: ["A19 Pro", "Екран 6,3″ 120 Гц", "Від 256 ГБ"],
    installmentMonths: 25,
    product: "iphone-17-pro",
    compareLink: "/collections/iphone",
  },
  {
    handle: "macbook-air-m4",
    label: "Для навчання й роботи",
    title: "MacBook Air M4",
    accent: "Air",
    subtitle: "Легкий ноутбук на цілий день без зарядки. Допоможемо перенести дані зі старого.",
    specs: ["Чип M4", "16 ГБ пам'яті", "До 18 годин роботи"],
    installmentMonths: 25,
    product: "macbook-air-13-m4",
    compareLink: "/collections/mac",
  },
  {
    handle: "ipad-air",
    label: "Для нотаток і малювання",
    title: "iPad Air",
    accent: "Air",
    subtitle:
      "Планшет із чипом M3 для конспектів, малювання та фільмів. Працює з Apple Pencil Pro.",
    specs: ["Чип M3", "11″ або 13″", "Apple Pencil Pro"],
    installmentMonths: 25,
    product: "ipad-air-11-m3",
    compareLink: "/collections/ipad",
  },
  {
    handle: "airpods-pro-3",
    label: "Хіт продажів",
    title: "AirPods Pro 3",
    accent: "Pro 3",
    subtitle: "Сильніше шумозаглушення, датчик пульсу й до 8 годин музики на одному заряді.",
    specs: ["Шумозаглушення", "Датчик пульсу", "Захист IP57"],
    priceFrom: false,
    installmentMonths: 10,
    product: "airpods-pro-3",
    compareLink: "/collections/airpods",
  },
];

const order = (index: number): string => String(index + 1);
const numbered = (prefix: string, index: number): string =>
  `${prefix}-${String(index + 1).padStart(2, "0")}`;

export type MetaobjectEntryOptions = {
  /** Валюта магазину — для полів типу money. */
  currency: string;
  /**
   * Чи створювати демо-відгуки та оцінку Google. Це вигадані дані для показу секції:
   * перед запуском магазину їх треба замінити справжніми.
   */
  demoReviews: boolean;
};

export function metaobjectEntries(options: MetaobjectEntryOptions): MetaobjectEntrySeed[] {
  const rating = options.demoReviews
    ? {
        google_rating: String(REVIEWS_DEMO_RATING.value),
        google_reviews_count: String(REVIEWS_DEMO_RATING.count),
        google_reviews_url: REVIEWS_DEMO_RATING.url,
      }
    : {};
  const reviews = options.demoReviews ? REVIEWS_DEMO : [];

  return [
    {
      type: "store_info",
      handle: "main",
      fields: {
        name: STORE_INFO.name,
        postal_code: STORE_INFO.postalCode,
        city: STORE_INFO.city,
        street: STORE_INFO.street,
        latitude: String(STORE_INFO.latitude),
        longitude: String(STORE_INFO.longitude),
        hours: STORE_INFO.hours,
        opens: STORE_INFO.opens,
        closes: STORE_INFO.closes,
        phone: STORE_INFO.phone,
        telegram: STORE_INFO.telegramHandle,
        legal_name: STORE_INFO.legalName,
        tax_id: STORE_INFO.taxId,
        ...rating,
      },
    },
    ...FAQ_DEMO_ITEMS.map((item, index) => ({
      type: "faq_item",
      handle: numbered("faq", index),
      fields: { question: item.question, answer: item.answer, order: order(index) },
    })),
    ...reviews.map((review, index) => ({
      type: "review",
      handle: numbered("review", index),
      fields: { name: review.name, text: review.text, date: review.date, source: review.source },
    })),
    ...DEMO_USPS.map((usp, index) => ({
      type: "usp",
      handle: numbered("usp", index),
      fields: { icon: usp.icon, title: usp.title, caption: usp.caption, order: order(index) },
    })),
    ...ABOUT_DEMO_STATS.map((stat, index) => ({
      type: "about_stat",
      handle: numbered("about-stat", index),
      fields: { value: stat.value, label: stat.label, order: order(index) },
    })),
    ...BANNERS.map((banner, index) => {
      const product = findProduct(banner.product);
      return {
        type: "home_banner",
        handle: banner.handle,
        fields: {
          label: banner.label,
          title: banner.title,
          accent: banner.accent,
          subtitle: banner.subtitle,
          specs: list(banner.specs),
          color_names: list(colorValues(product)),
          color_swatches: list(product.colorSwatches),
          price: money(minPrice(product), options.currency),
          price_from: String(banner.priceFrom ?? true),
          installment_months: String(banner.installmentMonths),
          product: { product: banner.product },
          compare_link: banner.compareLink,
          delivery: "Доставимо завтра",
          order: order(index),
        },
      };
    }),
  ];
}

/* ------------------------------------------------------------------ */
/* Колекції                                                            */
/* ------------------------------------------------------------------ */

/** Колекції каталогу: handle й назви — з CATALOG_LINKS, щоб навігація й магазин збігалися. */
export const CATALOG_COLLECTIONS: CollectionSeed[] = CATALOG_LINKS.map((link) => {
  const handle = link.to.split("/").pop() ?? "";
  const content = CATALOG_COLLECTION_CONTENT[handle];
  if (!content) throw new Error(`Для колекції «${handle}» немає даних у seed-catalog.ts`);
  return { handle, title: link.title, ...content };
});

/** Усі колекції, які створює скрипт: дев'ять каталогу та дві добірки головної. */
export const COLLECTIONS: CollectionSeed[] = [...CATALOG_COLLECTIONS, ...EXTRA_COLLECTIONS];

/* ------------------------------------------------------------------ */
/* Сторінки та блог                                                    */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Структуровані секції запасного вмісту → HTML для Shopify. */
export function sectionsToHtml(sections: ContentSection[], intro?: string): string {
  const parts: string[] = [];
  if (intro) parts.push(`<p>${escapeHtml(intro)}</p>`);

  for (const section of sections) {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    for (const block of section.blocks) {
      if (block.type === "paragraph") {
        parts.push(`<p>${escapeHtml(block.text)}</p>`);
        continue;
      }
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      parts.push(`<${tag}>${items}</${tag}>`);
    }
  }

  return parts.join("\n");
}

export type PageSeed = { handle: string; title: string; description: string; body: string };

export const PAGES: PageSeed[] = SERVICE_PAGES.map((link) => {
  const page = getFallbackPage(link.handle);
  if (!page) throw new Error(`Немає запасного вмісту для сторінки «${link.handle}»`);
  return {
    handle: page.handle,
    title: page.title,
    description: page.description,
    body: sectionsToHtml(page.sections, page.description),
  };
});

export const BLOG = { handle: FALLBACK_BLOG.handle, title: FALLBACK_BLOG.title };

/** Підпис автора статей. */
export const ARTICLE_AUTHOR = STORE_INFO.name;

export type ArticleSeed = {
  handle: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: string;
  /** Адреса фото: Shopify копіює файл до себе. */
  imageUrl: string | null;
};

export const ARTICLES: ArticleSeed[] = ARTICLES_DEMO.map((article) => {
  const sections = getFallbackArticleBody(article.handle);
  if (!sections) throw new Error(`Немає тексту для статті «${article.handle}»`);
  return {
    handle: article.handle,
    title: article.title,
    summary: article.excerpt,
    body: sectionsToHtml(sections),
    publishedAt: article.publishedAt,
    imageUrl: article.image?.url ?? null,
  };
});
