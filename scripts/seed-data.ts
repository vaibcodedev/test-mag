/**
 * Дані для scripts/seed.ts: що саме створити в магазині Shopify.
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
import { CATALOG_LINKS, STORE_INFO } from "../app/lib/content/site.ts";

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

/**
 * Значення поля запису. Рядки йдуть як є; `{ product }` та `{ productImage }` скрипт
 * замінює на gid товару та gid його головного фото в магазині.
 */
export type FieldValue = string | { product: string } | { productImage: string } | null | undefined;

export type MetaobjectEntrySeed = {
  type: string;
  handle: string;
  fields: Record<string, FieldValue>;
};

const list = (values: readonly string[] | undefined): string | null =>
  values?.length ? JSON.stringify(values) : null;
const money = (amount: number): string =>
  JSON.stringify({ amount: amount.toFixed(2), currency_code: "UAH" });

/*
  Банери повторюють DEMO_HOME_BANNERS із app/components/home/hero-slider/hero-slider.demo.ts.
  Той файл імпортувати не можна (він тягне `~/components/...`), тому тексти продубльовано.
  Фото й посилання беруться з товару магазину, а не з демо-адрес, яких у магазині немає.
*/
type BannerSeed = {
  handle: string;
  label: string;
  title: string;
  accent: string;
  subtitle: string;
  specs: string[];
  colors?: { name: string; hex: string }[];
  price: number;
  priceFrom?: boolean;
  installmentMonths: number;
  product: string;
  compareLink: string;
};

const BANNERS: BannerSeed[] = [
  {
    handle: "iphone-17-pro",
    label: "Новинка осені",
    title: "iPhone 17 Pro",
    accent: "Pro",
    subtitle: "Три камери по 48 Мп і найбільший акумулятор серед iPhone Pro. Уже в шоурумі.",
    specs: ["A19 Pro", "Екран 6,3″ 120 Гц", "Від 256 ГБ"],
    colors: [
      { name: "Космічний помаранчевий", hex: "#f77e2d" },
      { name: "Темно-синій", hex: "#32374a" },
      { name: "Сріблястий", hex: "#e3e4e5" },
    ],
    price: 64999,
    installmentMonths: 25,
    product: "one-smartphone",
    compareLink: "/collections/iphone",
  },
  {
    handle: "macbook-air-m4",
    label: "Для навчання й роботи",
    title: "MacBook Air M4",
    accent: "Air",
    subtitle: "Легкий ноутбук на цілий день без зарядки. Допоможемо перенести дані зі старого.",
    specs: ["Чип M4", "16 ГБ пам'яті", "До 18 годин роботи"],
    colors: [
      { name: "Небесно-блакитний", hex: "#c9d6e4" },
      { name: "Темна ніч", hex: "#2e3642" },
      { name: "Сяйво зірок", hex: "#f0e5d3" },
      { name: "Сріблястий", hex: "#e3e4e5" },
    ],
    price: 49999,
    installmentMonths: 25,
    product: "one-tablet",
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
    colors: [
      { name: "Синій", hex: "#c5d5e4" },
      { name: "Фіолетовий", hex: "#dcd3e6" },
      { name: "Сяйво зірок", hex: "#f0e5d3" },
      { name: "Космічний сірий", hex: "#6e6e73" },
    ],
    price: 28999,
    installmentMonths: 25,
    product: "ultra-slim-brushed-aluminum-tablet-pack-bc284fdc9561f986",
    compareLink: "/collections/ipad",
  },
  {
    handle: "airpods-pro-3",
    label: "Хіт продажів",
    title: "AirPods Pro 3",
    accent: "Pro 3",
    subtitle: "Сильніше шумозаглушення, датчик пульсу й до 8 годин музики на одному заряді.",
    specs: ["Шумозаглушення", "Датчик пульсу", "Захист IP57"],
    price: 11999,
    priceFrom: false,
    installmentMonths: 10,
    product: "wireless-earbuds",
    compareLink: "/collections/airpods",
  },
];

const order = (index: number): string => String(index + 1);
const numbered = (prefix: string, index: number): string =>
  `${prefix}-${String(index + 1).padStart(2, "0")}`;

export const METAOBJECT_ENTRIES: MetaobjectEntrySeed[] = [
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
      google_rating: String(REVIEWS_DEMO_RATING.value),
      google_reviews_count: String(REVIEWS_DEMO_RATING.count),
      google_reviews_url: REVIEWS_DEMO_RATING.url,
    },
  },
  ...FAQ_DEMO_ITEMS.map((item, index) => ({
    type: "faq_item",
    handle: numbered("faq", index),
    fields: { question: item.question, answer: item.answer, order: order(index) },
  })),
  ...REVIEWS_DEMO.map((review, index) => ({
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
  ...BANNERS.map((banner, index) => ({
    type: "home_banner",
    handle: banner.handle,
    fields: {
      label: banner.label,
      title: banner.title,
      accent: banner.accent,
      subtitle: banner.subtitle,
      specs: list(banner.specs),
      color_names: list(banner.colors?.map((color) => color.name)),
      color_swatches: list(banner.colors?.map((color) => color.hex)),
      price: money(banner.price),
      price_from: String(banner.priceFrom ?? true),
      installment_months: String(banner.installmentMonths),
      product: { product: banner.product },
      image: { productImage: banner.product },
      compare_link: banner.compareLink,
      delivery: "Доставимо завтра",
      order: order(index),
    },
  })),
];

/* ------------------------------------------------------------------ */
/* Товари                                                              */
/* ------------------------------------------------------------------ */

export type VariantPriceSeed = {
  /** Значення опції варіанта («256 GB»). Без нього — ціна для решти варіантів. */
  option?: string;
  price: number;
  compareAtPrice?: number;
};

export type ProductSeed = {
  handle: string;
  prices: VariantPriceSeed[];
  badge?: "Новинка" | "Хіт" | "Топ";
  installmentMonths?: number;
  shortSpecs?: string[];
  colorSwatches?: string[];
  used?: { grade: "Як новий" | "Відмінний" | "Хороший"; batteryHealth: number };
  tags?: string[];
};

const GRAPHITE = "#41444b";
const SILVER = "#c7c9cc";

const HANDLES = {
  phone: "one-smartphone",
  ceramicPhone: "ceramic-back-smartphone-pack-69168c2125a35833",
  tablet: "one-tablet",
  slimTablet: "ultra-slim-brushed-aluminum-tablet-pack-bc284fdc9561f986",
  watch: "one-smartwatch",
  sapphireWatch: "sapphire-display-smartwatch-pack-90fda91248edab53",
  earbuds: "wireless-earbuds",
  quietEarbuds: "noise-cancelling-wireless-earbuds-pack-18894925e5516bf2",
  speaker: "portable-bluetooth-speaker",
  powerBank: "usb-c-power-bank",
  wallCharger: "usb-c-wall-charger",
  chargingPad: "wireless-charging-pad",
  cable: "usb-c-cable",
  phoneCase: "one-phone-case",
  screenProtector: "one-screen-protector",
  phoneStand: "adjustable-phone-stand",
} as const;

/**
 * Каталог пробного магазину — 16 англомовних товарів із mock.shop. Назви лишаються як є;
 * ціни в гривнях, знижки, бейджі та метаполя потрібні, щоб на сайті було що показати.
 * Ціни товарів із банерів збігаються з цінами в банерах.
 */
export const PRODUCTS: ProductSeed[] = [
  {
    handle: HANDLES.phone,
    prices: [{ option: "256 GB", price: 72999 }, { price: 64999 }],
    badge: "Новинка",
    shortSpecs: ["128 або 256 ГБ", "Бездротова зарядка Qi", "USB-C"],
    colorSwatches: [GRAPHITE],
  },
  {
    handle: HANDLES.ceramicPhone,
    prices: [{ price: 31999 }],
    installmentMonths: 12,
    shortSpecs: ["Керамічна задня панель"],
    used: { grade: "Як новий", batteryHealth: 96 },
    tags: ["used"],
  },
  {
    handle: HANDLES.tablet,
    prices: [{ option: "256 GB", price: 57999 }, { price: 49999 }],
    installmentMonths: 24,
    shortSpecs: ["128 або 256 ГБ", "USB-C"],
    colorSwatches: [GRAPHITE],
  },
  {
    handle: HANDLES.slimTablet,
    prices: [{ price: 28999 }],
    badge: "Топ",
    installmentMonths: 24,
    shortSpecs: ["Тонкий корпус", "Шліфований алюміній"],
  },
  {
    handle: HANDLES.watch,
    prices: [{ price: 12999 }],
    installmentMonths: 10,
    shortSpecs: ["Працює з One Smartphone", "Зарядка USB-C"],
    colorSwatches: [GRAPHITE],
    used: { grade: "Відмінний", batteryHealth: 89 },
    tags: ["used"],
  },
  {
    handle: HANDLES.sapphireWatch,
    prices: [{ price: 21999, compareAtPrice: 23999 }],
    installmentMonths: 10,
    shortSpecs: ["Сапфірове скло"],
  },
  {
    handle: HANDLES.earbuds,
    prices: [{ price: 11999, compareAtPrice: 12999 }],
    badge: "Хіт",
    installmentMonths: 10,
    shortSpecs: ["Бездротова зарядка Qi", "USB-C"],
    colorSwatches: [GRAPHITE],
  },
  {
    handle: HANDLES.quietEarbuds,
    prices: [{ price: 8999 }],
    badge: "Новинка",
    installmentMonths: 6,
    shortSpecs: ["Активне шумозаглушення"],
  },
  {
    handle: HANDLES.speaker,
    prices: [{ price: 2899, compareAtPrice: 3499 }],
    badge: "Хіт",
    colorSwatches: [GRAPHITE],
  },
  {
    handle: HANDLES.powerBank,
    prices: [{ price: 1599, compareAtPrice: 1999 }],
    shortSpecs: ["USB-C"],
    colorSwatches: [GRAPHITE],
  },
  { handle: HANDLES.wallCharger, prices: [{ price: 1199 }], colorSwatches: [GRAPHITE] },
  { handle: HANDLES.chargingPad, prices: [{ price: 1299 }], colorSwatches: [GRAPHITE] },
  {
    handle: HANDLES.cable,
    prices: [{ option: "2 m", price: 799 }, { price: 599 }],
    colorSwatches: [GRAPHITE],
  },
  { handle: HANDLES.phoneCase, prices: [{ price: 999 }], colorSwatches: [GRAPHITE] },
  { handle: HANDLES.screenProtector, prices: [{ price: 699 }] },
  { handle: HANDLES.phoneStand, prices: [{ price: 899 }], colorSwatches: [SILVER] },
];

/* ------------------------------------------------------------------ */
/* Колекції                                                            */
/* ------------------------------------------------------------------ */

export type CollectionSeed = {
  handle: string;
  title: string;
  description: string;
  /** Handle товарів у порядку показу. */
  products: string[];
  /** Товар, чиє головне фото стає фото колекції. */
  imageFrom: string;
};

const DEALS = PRODUCTS.filter((product) => product.prices.some((price) => price.compareAtPrice));
const USED = PRODUCTS.filter((product) => product.used);

/*
  У каталозі mock.shop немає комп'ютера, тому в колекції `mac` поки стоїть планшет One Tablet
  (він же на банері MacBook у демо-вмісті). Додасте ноутбуки — замініть список.
*/
const COLLECTION_CONTENT: Record<string, Omit<CollectionSeed, "handle" | "title">> = {
  iphone: {
    description: "Нові та вживані смартфони з гарантією й перевіркою за IMEI.",
    products: [HANDLES.phone, HANDLES.ceramicPhone],
    imageFrom: HANDLES.phone,
  },
  mac: {
    description: "Комп'ютери для навчання й роботи.",
    products: [HANDLES.tablet],
    imageFrom: HANDLES.tablet,
  },
  ipad: {
    description: "Планшети для нотаток, малювання та фільмів.",
    products: [HANDLES.slimTablet, HANDLES.tablet],
    imageFrom: HANDLES.slimTablet,
  },
  watch: {
    description: "Смарт-годинники для спорту й на щодень.",
    products: [HANDLES.sapphireWatch, HANDLES.watch],
    imageFrom: HANDLES.watch,
  },
  airpods: {
    description: "Бездротові навушники.",
    products: [HANDLES.earbuds, HANDLES.quietEarbuds],
    imageFrom: HANDLES.earbuds,
  },
  accessories: {
    description: "Зарядні пристрої, кабелі, чохли та інші аксесуари.",
    products: [
      HANDLES.speaker,
      HANDLES.powerBank,
      HANDLES.wallCharger,
      HANDLES.chargingPad,
      HANDLES.cable,
      HANDLES.phoneCase,
      HANDLES.screenProtector,
      HANDLES.phoneStand,
    ],
    imageFrom: HANDLES.wallCharger,
  },
  used: {
    description: "Вживана техніка з оцінкою стану, ємністю акумулятора та гарантією 6 місяців.",
    products: USED.map((product) => product.handle),
    imageFrom: HANDLES.ceramicPhone,
  },
  students: {
    description: "Техніка для навчання: конспекти, презентації, відеодзвінки.",
    products: [HANDLES.tablet, HANDLES.slimTablet],
    imageFrom: HANDLES.slimTablet,
  },
  deals: {
    description: "Товари зі знижкою цього тижня.",
    products: DEALS.map((product) => product.handle),
    imageFrom: HANDLES.sapphireWatch,
  },
};

/** Колекції каталогу: handle й назви — з CATALOG_LINKS, щоб навігація й магазин збігалися. */
export const COLLECTIONS: CollectionSeed[] = CATALOG_LINKS.map((link) => {
  const handle = link.to.split("/").pop() ?? "";
  const content = COLLECTION_CONTENT[handle];
  if (!content) throw new Error(`Для колекції «${handle}» немає даних у seed-data.ts`);
  return { handle, title: link.title, ...content };
});

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
  /** Назва файлу фото без розширення: за нею скрипт шукає це фото серед товарів магазину. */
  imageFile: string | null;
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
    imageFile: article.image?.url.split("/").pop()?.split(".")[0] ?? null,
  };
});
