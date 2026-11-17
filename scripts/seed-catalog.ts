/**
 * Каталог для scripts/seed.ts: сто товарів, які скрипт створює в магазині, і правила колекцій.
 *
 * Товари не виписано вручну: кожна лінійка — це таблиця «модель × опції», з якої функції
 * нижче збирають варіанти, ціни, описи й теги. Файл не залежить ні від застосунку, ні від
 * мережі, тож його перевіряють тести (scripts/seed-catalog.test.ts).
 *
 * Фото й відео товарів описані окремо: scripts/seed-images.ts і scripts/seed-media.ts.
 */

/* ------------------------------------------------------------------ */
/* Типи                                                                */
/* ------------------------------------------------------------------ */

export type Badge = "Новинка" | "Хіт" | "Топ";
export type ConditionGrade = "Як новий" | "Відмінний" | "Хороший";
export type CategoryKey = "iphone" | "mac" | "ipad" | "watch" | "airpods" | "accessories";

export type OptionSeed = { name: string; values: string[] };

export type VariantSeed = {
  /** Значення опцій у порядку опцій товару. */
  options: string[];
  /** Артикул: handle товару та номер варіанта. */
  sku: string;
  price: number;
  compareAtPrice?: number;
  /** Залишок на складі; 0 — «немає в наявності». */
  stock: number;
};

export type ProductSeed = {
  handle: string;
  title: string;
  category: CategoryKey;
  vendor: string;
  productType: string;
  tags: string[];
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
  options: OptionSeed[];
  variants: VariantSeed[];
  badge?: Badge;
  installmentMonths?: number;
  shortSpecs?: string[];
  /** Hex-кольори в порядку значень опції «Колір». */
  colorSwatches?: string[];
  used?: { grade: ConditionGrade; batteryHealth: number };
};

/* ------------------------------------------------------------------ */
/* Категорії, опції, теги                                              */
/* ------------------------------------------------------------------ */

export const CATEGORIES: Record<CategoryKey, { productType: string }> = {
  iphone: { productType: "Смартфони" },
  mac: { productType: "Ноутбуки та комп'ютери" },
  ipad: { productType: "Планшети" },
  watch: { productType: "Смарт-годинники" },
  airpods: { productType: "Навушники" },
  accessories: { productType: "Аксесуари" },
};

export const COLOR_OPTION = "Колір";
export const STORAGE_OPTION = "Пам'ять";
export const CONFIG_OPTION = "Конфігурація";
export const CONNECTIVITY_OPTION = "Зв'язок";
export const SIZE_OPTION = "Розмір";
export const LENGTH_OPTION = "Довжина";

/** Єдина опція товару без варіантів — так її називає сам Shopify. */
export const DEFAULT_OPTION: OptionSeed = { name: "Title", values: ["Default Title"] };

export const TAG_USED = "used";
export const TAG_STUDENTS = "students";
export const TAG_HIT = "hit";
export const TAG_NEW = "new";

/** Власні товари магазину без бренду виробника: скло, чохли. */
const HOUSE_BRAND = "Ionov Store";

const WARRANTY_NEW = "Гарантія 12 місяців.";
const WARRANTY_USED = "Гарантія 6 місяців.";
const DEFAULT_STOCK = 5;

/* ------------------------------------------------------------------ */
/* Збирання товару                                                     */
/* ------------------------------------------------------------------ */

type ValueInput = {
  name: string;
  /** Доплата до базової ціни за це значення. */
  add?: number;
  /** Колір кружечка — лише для опції «Колір». */
  hex?: string;
};

type OptionInput = { name: string; values: ValueInput[] };

type Extras = {
  vendor?: string;
  /** Стара ціна найдешевшого варіанта: товар потрапляє в «Знижки». */
  was?: number;
  /** Знижка діє лише на варіанти з цим значенням опції. */
  wasOnly?: string;
  /** Варіанти без залишку: списки значень опцій; `"all"` — товару немає зовсім. */
  soldOut?: string[][] | "all";
  students?: boolean;
  badge?: Badge;
  installmentMonths?: number;
  used?: { grade: ConditionGrade; batteryHealth: number };
};

type ProductInput = Extras & {
  handle: string;
  title: string;
  category: CategoryKey;
  /** Два-три речення опису. Перше йде також у SEO-опис. */
  text: string[];
  /** Короткий список характеристик в описі; перші три стають метаполем short_specs. */
  specs: string[];
  options?: OptionInput[];
  /** Ціна найдешевшого варіанта, грн. */
  price: number;
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** «64 999» — розряди через пробіл. */
export function formatAmount(amount: number): string {
  return String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Усі поєднання значень опцій; перша опція змінюється найповільніше. */
export function combinations<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>(
    (rows, list) => rows.flatMap((row) => list.map((item) => [...row, item])),
    [[]],
  );
}

/** Ключ варіанта: значення опцій через « / », як у заголовку варіанта в Shopify. */
export function variantKey(options: readonly string[]): string {
  return options.join(" / ");
}

export function buildDescriptionHtml(text: string[], specs: string[], warranty: string): string {
  const items = specs.map((spec) => `<li>${escapeHtml(spec)}</li>`).join("");
  return [`<p>${escapeHtml(text.join(" "))}</p>`, `<ul>${items}</ul>`, `<p>${warranty}</p>`].join(
    "\n",
  );
}

/** Скільки платежів пропонувати, якщо таблиця не каже іншого: дорожче — довше. */
function defaultInstallments(price: number): number | undefined {
  if (price >= 40000) return 24;
  if (price >= 15000) return 12;
  if (price >= 8000) return 10;
  if (price >= 3000) return 6;
  return undefined;
}

export function buildProduct(input: ProductInput): ProductSeed {
  const optionInputs = input.options ?? [];
  const options: OptionSeed[] =
    optionInputs.length > 0
      ? optionInputs.map((item) => ({ name: item.name, values: item.values.map((v) => v.name) }))
      : [DEFAULT_OPTION];

  const soldOutAll = input.soldOut === "all";
  const soldOut = Array.isArray(input.soldOut) ? input.soldOut : [];
  const valueRows: ValueInput[][] =
    optionInputs.length > 0
      ? combinations(optionInputs.map((item) => item.values))
      : [[{ name: DEFAULT_OPTION.values[0] ?? "" }]];

  const variants: VariantSeed[] = valueRows.map((row, index) => {
    const names = row.map((item) => item.name);
    const add = row.reduce((sum, item) => sum + (item.add ?? 0), 0);
    const discounted = input.was !== undefined && (!input.wasOnly || names.includes(input.wasOnly));
    // Позначка soldOut може називати не всі опції: [«Помаранчевий»] знімає всі такі варіанти.
    const out = soldOutAll || soldOut.some((item) => item.every((v) => names.includes(v)));
    return {
      options: names,
      sku: `${input.handle}-${String(index + 1).padStart(2, "0")}`.toUpperCase(),
      price: input.price + add,
      ...(discounted ? { compareAtPrice: (input.was ?? 0) + add } : {}),
      stock: out ? 0 : DEFAULT_STOCK,
    };
  });

  const colors = optionInputs.find((item) => item.name === COLOR_OPTION)?.values ?? [];
  const tags: string[] = [input.category];
  if (input.used) tags.push(TAG_USED);
  if (input.students) tags.push(TAG_STUDENTS);
  if (input.badge === "Новинка") tags.push(TAG_NEW);
  if (input.badge === "Хіт" || input.badge === "Топ") tags.push(TAG_HIT);

  return {
    handle: input.handle,
    title: input.title,
    category: input.category,
    vendor: input.vendor ?? "Apple",
    productType: CATEGORIES[input.category].productType,
    tags,
    descriptionHtml: buildDescriptionHtml(
      input.text,
      input.specs,
      input.used ? WARRANTY_USED : WARRANTY_NEW,
    ),
    seoTitle: `${input.title} — купити у Вінниці | Ionov Store`,
    seoDescription: `${input.text[0] ?? ""} Від ${formatAmount(input.price)} ₴ у шоурумі Ionov Store у Вінниці.`,
    options,
    variants,
    badge: input.badge,
    installmentMonths: input.installmentMonths ?? defaultInstallments(input.price),
    shortSpecs: input.specs.slice(0, 3),
    colorSwatches: colors.length > 0 ? colors.map((item) => item.hex ?? "") : undefined,
    used: input.used,
  };
}

/* ------------------------------------------------------------------ */
/* Значення опцій                                                      */
/* ------------------------------------------------------------------ */

const value = (name: string, add = 0): ValueInput => ({ name, add });
const option = (name: string, ...values: ValueInput[]): OptionInput => ({ name, values });

/** Палітра: назва кольору українською та hex для кружечка. */
const C = {
  orange: { name: "Космічний помаранчевий", hex: "#f77e2d" },
  deepBlue: { name: "Темно-синій", hex: "#32374a" },
  silver: { name: "Сріблястий", hex: "#e3e4e5" },
  black: { name: "Чорний", hex: "#1f2020" },
  white: { name: "Білий", hex: "#f5f5f0" },
  spaceBlack: { name: "Космічний чорний", hex: "#2e2c2e" },
  spaceGray: { name: "Космічний сірий", hex: "#6e6e73" },
  skyBlue: { name: "Небесно-блакитний", hex: "#c9d6e4" },
  lightGold: { name: "Світло-золотий", hex: "#eadfc8" },
  cloudWhite: { name: "Хмарно-білий", hex: "#f4f4f2" },
  midnight: { name: "Темна ніч", hex: "#2e3642" },
  starlight: { name: "Сяйво зірок", hex: "#f0e5d3" },
  blue: { name: "Синій", hex: "#a7c1d9" },
  purple: { name: "Фіолетовий", hex: "#dcd3e6" },
  lavender: { name: "Лавандовий", hex: "#dcd3e6" },
  sage: { name: "Шавлієвий", hex: "#b9c4ae" },
  mistBlue: { name: "Туманно-блакитний", hex: "#a9bfd9" },
  ultramarine: { name: "Ультрамарин", hex: "#8b9ee0" },
  teal: { name: "Бірюзовий", hex: "#b0d4d2" },
  pink: { name: "Рожевий", hex: "#f2c6cf" },
  green: { name: "Зелений", hex: "#cad4c5" },
  yellow: { name: "Жовтий", hex: "#f3e08c" },
  desert: { name: "Пустельний титан", hex: "#bfa48f" },
  natural: { name: "Натуральний титан", hex: "#c2bcb2" },
  whiteTitanium: { name: "Білий титан", hex: "#f2f1ed" },
  blackTitanium: { name: "Чорний титан", hex: "#3a3a3c" },
  roseGold: { name: "Рожеве золото", hex: "#e6c7c2" },
  gold: { name: "Золотий", hex: "#e3c9a5" },
  slate: { name: "Сланцевий", hex: "#4c4a48" },
  jetBlack: { name: "Глянцевий чорний", hex: "#0b0b0c" },
  brightOrange: { name: "Помаранчевий", hex: "#f08a3c" },
} as const;

type Color = (typeof C)[keyof typeof C];

const colors = (...items: Color[]): OptionInput => option(COLOR_OPTION, ...items);

const GB128 = "128 ГБ";
const GB256 = "256 ГБ";
const GB512 = "512 ГБ";
const TB1 = "1 ТБ";

/** Доплата за перехід на наступний обсяг пам'яті. */
const STORAGE_STEP: Record<string, number> = { [GB256]: 5000, [GB512]: 10000, [TB1]: 10000 };

/** Опція «Пам'ять»: перший обсяг без доплати, кожен наступний дорожчий за попередній. */
function storage(...labels: string[]): OptionInput {
  let add = 0;
  return option(
    STORAGE_OPTION,
    ...labels.map((label, index) => {
      if (index > 0) add += STORAGE_STEP[label] ?? 0;
      return value(label, add);
    }),
  );
}

const CONNECTIVITY = option(CONNECTIVITY_OPTION, value("Wi-Fi"), value("Wi-Fi + Cellular", 7000));

/* ------------------------------------------------------------------ */
/* iPhone                                                              */
/* ------------------------------------------------------------------ */

type IphoneRow = [
  slug: string,
  name: string,
  chip: string,
  screen: string,
  camera: string,
  lead: string,
  storages: string[],
  palette: Color[],
  price: number,
  extras?: Extras,
];

const IPHONES: IphoneRow[] = [
  [
    "iphone-17-pro-max",
    "iPhone 17 Pro Max",
    "A19 Pro",
    "6,9″ OLED, 120 Гц",
    "Три камери по 48 Мп",
    "Найбільший iPhone з екраном 6,9″ і найдовшим часом роботи в лінійці.",
    [GB256, GB512, TB1],
    [C.orange, C.deepBlue, C.silver],
    72999,
    { badge: "Новинка", soldOut: [[TB1, C.orange.name]] },
  ],
  [
    "iphone-17-pro",
    "iPhone 17 Pro",
    "A19 Pro",
    "6,3″ OLED, 120 Гц",
    "Три камери по 48 Мп",
    "Три камери по 48 Мп і найбільший акумулятор серед iPhone Pro з екраном 6,3″.",
    [GB256, GB512, TB1],
    [C.orange, C.deepBlue, C.silver],
    64999,
    { badge: "Новинка" },
  ],
  [
    "iphone-air",
    "iPhone Air",
    "A19 Pro",
    "6,5″ OLED, 120 Гц",
    "Камера 48 Мп",
    "Найтонший iPhone: 5,6 мм завтовшки з екраном 6,5″.",
    [GB256, GB512],
    [C.skyBlue, C.lightGold, C.cloudWhite, C.spaceBlack],
    54999,
    { badge: "Новинка", soldOut: [[GB512, C.lightGold.name]] },
  ],
  [
    "iphone-17",
    "iPhone 17",
    "A19",
    "6,3″ OLED, 120 Гц",
    "Подвійна камера 48 Мп",
    "Базовий iPhone з екраном 6,3″ на 120 Гц і пам'яттю від 256 ГБ.",
    [GB256, GB512],
    [C.lavender, C.sage, C.mistBlue, C.white, C.black],
    44999,
    { badge: "Новинка" },
  ],
  [
    "iphone-16-pro-max",
    "iPhone 16 Pro Max",
    "A18 Pro",
    "6,9″ OLED, 120 Гц",
    "Три камери, основна 48 Мп",
    "Торішній флагман з екраном 6,9″ у титановому корпусі за нижчою ціною.",
    [GB256, GB512],
    [C.desert, C.natural, C.blackTitanium],
    62999,
    { was: 66999 },
  ],
  [
    "iphone-16-pro",
    "iPhone 16 Pro",
    "A18 Pro",
    "6,3″ OLED, 120 Гц",
    "Три камери, основна 48 Мп",
    "Компактний Pro у титановому корпусі з екраном 6,3″.",
    [GB128, GB256],
    [C.desert, C.natural, C.whiteTitanium, C.blackTitanium],
    52999,
    { was: 55999 },
  ],
  [
    "iphone-16-plus",
    "iPhone 16 Plus",
    "A18",
    "6,7″ OLED",
    "Подвійна камера 48 Мп",
    "Великий екран 6,7″ і акумулятор на два дні без переплати за Pro.",
    [GB128, GB256],
    [C.ultramarine, C.teal, C.pink],
    42999,
  ],
  [
    "iphone-16",
    "iPhone 16",
    "A18",
    "6,1″ OLED",
    "Подвійна камера 48 Мп",
    "Торішня базова модель: екран 6,1″, чип A18 і кнопка керування камерою.",
    [GB128, GB256],
    [C.ultramarine, C.teal, C.pink, C.white, C.black],
    36999,
    { was: 39999, badge: "Хіт" },
  ],
  [
    "iphone-16e",
    "iPhone 16e",
    "A18",
    "6,1″ OLED",
    "Камера 48 Мп",
    "Найдоступніший новий iPhone з чипом A18 та екраном 6,1″.",
    [GB128, GB256],
    [C.white, C.black],
    29999,
  ],
  [
    "iphone-15-plus",
    "iPhone 15 Plus",
    "A16 Bionic",
    "6,7″ OLED",
    "Подвійна камера 48 Мп",
    "iPhone 15 з великим екраном 6,7″ та USB-C.",
    [GB128, GB256],
    [C.blue, C.pink, C.black],
    35999,
  ],
  [
    "iphone-15",
    "iPhone 15",
    "A16 Bionic",
    "6,1″ OLED",
    "Подвійна камера 48 Мп",
    "Перший базовий iPhone з USB-C і камерою 48 Мп — досі вдалий вибір.",
    [GB128, GB256],
    [C.blue, C.pink, C.green, C.black],
    31999,
    { was: 33999 },
  ],
  [
    "iphone-14",
    "iPhone 14",
    "A15 Bionic",
    "6,1″ OLED",
    "Подвійна камера 12 Мп",
    "Останні нові iPhone 14 зі складу: екран 6,1″ і роз'єм Lightning.",
    [GB128],
    [C.blue, C.midnight, C.starlight],
    26999,
    { soldOut: "all" },
  ],
];

function iphone(row: IphoneRow): ProductSeed {
  const [handle, title, chip, screen, camera, lead, storages, palette, price, extras] = row;
  const port = title === "iPhone 14" ? "Lightning" : "USB-C";
  return buildProduct({
    ...extras,
    handle,
    title,
    category: "iphone",
    text: [lead, `Чип ${chip}, пам'ять від ${storages[0]}, зарядка через ${port}.`],
    specs: [`Чип ${chip}`, `Екран ${screen}`, camera, port],
    options: [storage(...storages), colors(...palette)],
    price,
  });
}

/* ------------------------------------------------------------------ */
/* Mac                                                                 */
/* ------------------------------------------------------------------ */

type MacRow = [
  slug: string,
  name: string,
  lead: string,
  specs: string[],
  /** Конфігурації «оперативна пам'ять / накопичувач» і доплата за кожну. */
  configs: [label: string, add: number][],
  palette: Color[],
  price: number,
  extras?: Extras,
];

const MACS: MacRow[] = [
  [
    "macbook-air-13-m4",
    "MacBook Air 13″ M4",
    "Легкий ноутбук на цілий день без зарядки: екран 13,6″ і чип M4.",
    ["Чип M4", "Екран 13,6″", "До 18 годин роботи", "Без вентилятора, працює безшумно"],
    [
      ["16 / 256 ГБ", 0],
      ["16 / 512 ГБ", 10000],
      ["24 / 512 ГБ", 20000],
    ],
    [C.skyBlue, C.midnight, C.starlight, C.silver],
    49999,
    { badge: "Хіт", students: true },
  ],
  [
    "macbook-air-15-m4",
    "MacBook Air 15″ M4",
    "MacBook Air з більшим екраном 15,3″ для таблиць, монтажу й кількох вікон поруч.",
    ["Чип M4", "Екран 15,3″", "До 18 годин роботи", "Шість динаміків"],
    [
      ["16 / 256 ГБ", 0],
      ["16 / 512 ГБ", 10000],
      ["24 / 512 ГБ", 20000],
    ],
    [C.skyBlue, C.midnight, C.starlight, C.silver],
    59999,
    { students: true },
  ],
  [
    "macbook-air-13-m3",
    "MacBook Air 13″ M3",
    "Попереднє покоління MacBook Air за нижчою ціною: чип M3 та екран 13,6″.",
    ["Чип M3", "Екран 13,6″", "До 18 годин роботи"],
    [
      ["16 / 256 ГБ", 0],
      ["16 / 512 ГБ", 9000],
    ],
    [C.midnight, C.starlight, C.spaceGray],
    42999,
    { was: 46999 },
  ],
  [
    "macbook-pro-14-m5",
    "MacBook Pro 14″ M5",
    "Ноутбук для монтажу, програмування та графіки: чип M5 та екран 14,2″ на 120 Гц.",
    ["Чип M5", "Екран 14,2″, 120 Гц", "До 24 годин роботи", "HDMI, слот SD, три порти Thunderbolt"],
    [
      ["16 / 512 ГБ", 0],
      ["16 ГБ / 1 ТБ", 10000],
      ["24 ГБ / 1 ТБ", 20000],
    ],
    [C.spaceBlack, C.silver],
    79999,
    { badge: "Новинка", students: true },
  ],
  [
    "macbook-pro-14-m4-pro",
    "MacBook Pro 14″ M4 Pro",
    "MacBook Pro 14″ з чипом M4 Pro для важких проєктів у дорозі.",
    ["Чип M4 Pro", "Екран 14,2″, 120 Гц", "Три порти Thunderbolt 5", "HDMI та слот SD"],
    [
      ["24 / 512 ГБ", 0],
      ["24 ГБ / 1 ТБ", 12000],
    ],
    [C.spaceBlack, C.silver],
    99999,
  ],
  [
    "macbook-pro-16-m4-pro",
    "MacBook Pro 16″ M4 Pro",
    "Найбільший екран серед MacBook: 16,2″ і чип M4 Pro.",
    ["Чип M4 Pro", "Екран 16,2″, 120 Гц", "До 24 годин роботи", "Три порти Thunderbolt 5"],
    [
      ["24 / 512 ГБ", 0],
      ["48 / 512 ГБ", 20000],
    ],
    [C.spaceBlack, C.silver],
    124999,
  ],
  [
    "macbook-pro-16-m4-max",
    "MacBook Pro 16″ M4 Max",
    "Найпотужніший MacBook для 3D, кольорокорекції та машинного навчання.",
    ["Чип M4 Max", "Екран 16,2″, 120 Гц", "Три порти Thunderbolt 5", "HDMI та слот SD"],
    [
      ["36 ГБ / 1 ТБ", 0],
      ["48 ГБ / 1 ТБ", 25000],
    ],
    [C.spaceBlack, C.silver],
    174999,
    { soldOut: [["48 ГБ / 1 ТБ", C.silver.name]] },
  ],
  [
    "imac-24-m4",
    "iMac 24″ M4",
    "Моноблок з екраном 4,5K: комп'ютер, монітор, камера й динаміки в одному корпусі.",
    ["Чип M4", "Екран 24″ 4,5K", "Камера 12 Мп", "Клавіатура й миша в комплекті"],
    [
      ["16 / 256 ГБ", 0],
      ["16 / 512 ГБ", 10000],
      ["24 / 512 ГБ", 20000],
    ],
    [C.blue, C.green, C.pink, C.silver],
    64999,
  ],
  [
    "mac-mini-m4",
    "Mac mini M4",
    "Компактний комп'ютер розміром із долоню: під'єднайте власний монітор, клавіатуру й мишу.",
    ["Чип M4", "Корпус 12,7 × 12,7 см", "Порти USB-C, HDMI, Ethernet"],
    [
      ["16 / 256 ГБ", 0],
      ["16 / 512 ГБ", 9000],
      ["24 / 512 ГБ", 18000],
    ],
    [],
    27999,
    { badge: "Топ" },
  ],
  [
    "mac-mini-m4-pro",
    "Mac mini M4 Pro",
    "Mac mini з чипом M4 Pro і портами Thunderbolt 5 для студії чи монтажу.",
    ["Чип M4 Pro", "Три порти Thunderbolt 5", "HDMI та Ethernet"],
    [
      ["24 / 512 ГБ", 0],
      ["48 ГБ / 1 ТБ", 30000],
    ],
    [],
    64999,
  ],
  [
    "mac-studio-m4-max",
    "Mac Studio M4 Max",
    "Настільний комп'ютер для студійної роботи зі звуком, відео та 3D.",
    ["Чип M4 Max", "Порти Thunderbolt 5", "Слот SD і 10 Gb Ethernet"],
    [
      ["36 / 512 ГБ", 0],
      ["64 ГБ / 1 ТБ", 40000],
    ],
    [],
    99999,
  ],
];

function mac(row: MacRow): ProductSeed {
  const [handle, title, lead, specs, configs, palette, price, extras] = row;
  const first = configs[0]?.[0] ?? "";
  return buildProduct({
    ...extras,
    handle,
    title,
    category: "mac",
    text: [lead, `Базова конфігурація — ${first} (оперативна пам'ять / накопичувач).`],
    specs,
    options: [
      option(CONFIG_OPTION, ...configs.map(([label, add]) => value(label, add))),
      ...(palette.length > 0 ? [colors(...palette)] : []),
    ],
    price,
  });
}

/* ------------------------------------------------------------------ */
/* iPad                                                                */
/* ------------------------------------------------------------------ */

type IpadRow = [
  slug: string,
  name: string,
  chip: string,
  screen: string,
  lead: string,
  extraSpec: string,
  storages: string[],
  palette: Color[],
  price: number,
  extras?: Extras,
];

const IPADS: IpadRow[] = [
  [
    "ipad-pro-11-m5",
    "iPad Pro 11″ M5",
    "M5",
    "11″ OLED, 120 Гц",
    "Найпотужніший iPad з OLED-екраном 11″.",
    "Face ID",
    [GB256, GB512],
    [C.spaceBlack, C.silver],
    49999,
    { badge: "Новинка" },
  ],
  [
    "ipad-pro-13-m5",
    "iPad Pro 13″ M5",
    "M5",
    "13″ OLED, 120 Гц",
    "Великий OLED-екран 13″ для малювання, монтажу та роботи з клавіатурою.",
    "Face ID",
    [GB256, GB512],
    [C.spaceBlack, C.silver],
    64999,
    { badge: "Новинка", soldOut: [[GB512, "Wi-Fi + Cellular", C.silver.name]] },
  ],
  [
    "ipad-pro-11-m4",
    "iPad Pro 11″ M4",
    "M4",
    "11″ OLED, 120 Гц",
    "Попереднє покоління iPad Pro з тим самим OLED-екраном за нижчою ціною.",
    "Face ID",
    [GB256, GB512],
    [C.spaceBlack, C.silver],
    43999,
    { was: 47999 },
  ],
  [
    "ipad-pro-13-m4",
    "iPad Pro 13″ M4",
    "M4",
    "13″ OLED, 120 Гц",
    "iPad Pro 13″ попереднього покоління: тонкий корпус і OLED-екран.",
    "Face ID",
    [GB256, GB512],
    [C.spaceBlack, C.silver],
    57999,
    { was: 61999 },
  ],
  [
    "ipad-air-11-m3",
    "iPad Air 11″ M3",
    "M3",
    "11″",
    "Планшет із чипом M3 для конспектів, малювання та фільмів.",
    "Touch ID у кнопці",
    [GB128, GB256],
    [C.blue, C.purple, C.starlight, C.spaceGray],
    28999,
    { badge: "Топ", students: true },
  ],
  [
    "ipad-air-13-m3",
    "iPad Air 13″ M3",
    "M3",
    "13″",
    "iPad Air з великим екраном 13″: зручно читати, малювати й працювати у двох вікнах.",
    "Touch ID у кнопці",
    [GB128, GB256],
    [C.blue, C.purple, C.starlight, C.spaceGray],
    38999,
    { students: true },
  ],
  [
    "ipad-air-11-m2",
    "iPad Air 11″ M2",
    "M2",
    "11″",
    "iPad Air попереднього покоління з чипом M2 за нижчою ціною.",
    "Touch ID у кнопці",
    [GB128, GB256],
    [C.blue, C.purple, C.spaceGray],
    24999,
    { was: 26999 },
  ],
  [
    "ipad-mini-a17-pro",
    "iPad mini A17 Pro",
    "A17 Pro",
    "8,3″",
    "Маленький iPad з екраном 8,3″, який зручно тримати однією рукою.",
    "Touch ID у кнопці",
    [GB128, GB256],
    [C.blue, C.purple, C.starlight, C.spaceGray],
    23999,
    { students: true },
  ],
  [
    "ipad-11-a16",
    "iPad 11″ A16",
    "A16",
    "11″",
    "Базовий iPad для навчання, фільмів і відеодзвінків.",
    "Touch ID у кнопці",
    [GB128, GB256],
    [C.silver, C.blue, C.pink, C.yellow],
    16999,
    { badge: "Хіт", students: true },
  ],
  [
    "ipad-10",
    "iPad 10,9″ (10-го покоління)",
    "A14 Bionic",
    "10,9″",
    "Найдоступніший новий iPad зі складу: екран 10,9″ і USB-C.",
    "Touch ID у кнопці",
    ["64 ГБ", GB256],
    [C.silver, C.blue, C.pink],
    13999,
  ],
];

function ipad(row: IpadRow): ProductSeed {
  const [handle, title, chip, screen, lead, extraSpec, storages, palette, price, extras] = row;
  return buildProduct({
    ...extras,
    handle,
    title,
    category: "ipad",
    text: [lead, `Чип ${chip}, пам'ять від ${storages[0]}, є версія з мобільним зв'язком.`],
    specs: [`Чип ${chip}`, `Екран ${screen}`, extraSpec, "USB-C"],
    options: [storage(...storages), CONNECTIVITY, colors(...palette)],
    price,
  });
}

/* ------------------------------------------------------------------ */
/* Apple Watch                                                         */
/* ------------------------------------------------------------------ */

type WatchRow = [
  slug: string,
  name: string,
  lead: string,
  specs: string[],
  sizes: string[],
  palette: Color[],
  price: number,
  extras?: Extras,
];

const WATCHES: WatchRow[] = [
  [
    "apple-watch-series-11",
    "Apple Watch Series 11",
    "Годинник на щодень: стежить за сном, пульсом і тренуваннями.",
    ["Корпус з алюмінію", "До 24 годин роботи", "Захист від води 50 м", "Екран завжди ввімкнений"],
    ["42 мм", "46 мм"],
    [C.jetBlack, C.roseGold, C.silver, C.spaceGray],
    19999,
    { badge: "Новинка", soldOut: [["46 мм", C.roseGold.name]] },
  ],
  [
    "apple-watch-series-11-titanium",
    "Apple Watch Series 11, титан",
    "Series 11 у полірованому титановому корпусі із сапфіровим склом.",
    ["Корпус із титану", "Сапфірове скло", "До 24 годин роботи", "Мобільний зв'язок (eSIM)"],
    ["42 мм", "46 мм"],
    [C.natural, C.gold, C.slate],
    34999,
    { badge: "Топ" },
  ],
  [
    "apple-watch-se-3",
    "Apple Watch SE 3",
    "Доступний Apple Watch з екраном, що не гасне, і всіма основними функціями для спорту.",
    ["Корпус з алюмінію", "Екран завжди ввімкнений", "Захист від води 50 м"],
    ["40 мм", "44 мм"],
    [C.midnight, C.starlight],
    12499,
    { badge: "Новинка" },
  ],
  [
    "apple-watch-ultra-3",
    "Apple Watch Ultra 3",
    "Найміцніший Apple Watch у титановому корпусі для походів, дайвінгу й довгих тренувань.",
    ["Корпус 49 мм із титану", "До 42 годин роботи", "Захист від води 100 м", "Двочастотний GPS"],
    ["49 мм"],
    [C.natural, C.blackTitanium],
    39999,
    { badge: "Новинка" },
  ],
  [
    "apple-watch-series-10",
    "Apple Watch Series 10",
    "Попереднє покоління з тонким корпусом і великим екраном за нижчою ціною.",
    ["Корпус з алюмінію", "До 18 годин роботи", "Захист від води 50 м"],
    ["42 мм", "46 мм"],
    [C.jetBlack, C.roseGold, C.silver],
    16999,
    { was: 18999 },
  ],
  [
    "apple-watch-ultra-2",
    "Apple Watch Ultra 2",
    "Попереднє покоління Ultra: той самий титановий корпус 49 мм.",
    ["Корпус 49 мм із титану", "До 36 годин роботи", "Захист від води 100 м"],
    ["49 мм"],
    [C.natural, C.blackTitanium],
    33999,
    { was: 36999 },
  ],
  [
    "apple-watch-se-2",
    "Apple Watch SE 2",
    "Найдешевший новий Apple Watch: сповіщення, тренування та оплата з руки.",
    ["Корпус з алюмінію", "До 18 годин роботи", "Захист від води 50 м"],
    ["40 мм", "44 мм"],
    [C.midnight, C.starlight, C.silver],
    9999,
  ],
];

function watch(row: WatchRow): ProductSeed {
  const [handle, title, lead, specs, sizes, palette, price, extras] = row;
  const sizeText = sizes.length > 1 ? `Є два розміри корпусу: ${sizes.join(" і ")}.` : "";
  return buildProduct({
    ...extras,
    handle,
    title,
    category: "watch",
    text: [lead, sizeText, "Ремінець у комплекті."].filter(Boolean),
    specs,
    options: [
      ...(sizes.length > 1
        ? [option(SIZE_OPTION, ...sizes.map((size, index) => value(size, index * 1500)))]
        : []),
      colors(...palette),
    ],
    price,
  });
}

/* ------------------------------------------------------------------ */
/* Прості товари: AirPods та аксесуари                                 */
/* ------------------------------------------------------------------ */

type SimpleRow = [
  slug: string,
  title: string,
  text: string[],
  specs: string[],
  price: number,
  options?: OptionInput[],
  extras?: Extras,
];

const AIRPODS: SimpleRow[] = [
  [
    "airpods-4",
    "AirPods 4",
    [
      "Легкі навушники без силіконових насадок.",
      "До 5 годин музики, футляр заряджається через USB-C.",
    ],
    ["Чип H2", "До 5 годин роботи", "Футляр із USB-C"],
    6499,
    [],
    { badge: "Хіт" },
  ],
  [
    "airpods-4-anc",
    "AirPods 4 з активним шумозаглушенням",
    [
      "AirPods 4 з шумозаглушенням і режимом прозорості.",
      "Футляр заряджається без дроту й має динамік для пошуку.",
    ],
    ["Активне шумозаглушення", "Чип H2", "Бездротова зарядка футляра"],
    8999,
  ],
  [
    "airpods-pro-3",
    "AirPods Pro 3",
    [
      "Навушники з активним шумозаглушенням і датчиком пульсу.",
      "До 8 годин музики на одному заряді.",
    ],
    ["Активне шумозаглушення", "Датчик пульсу", "Захист IP57", "До 8 годин роботи"],
    11999,
    [],
    { badge: "Новинка", installmentMonths: 10 },
  ],
  [
    "airpods-pro-2",
    "AirPods Pro 2",
    [
      "Попереднє покоління AirPods Pro за нижчою ціною.",
      "Шумозаглушення, режим прозорості та футляр із USB-C.",
    ],
    ["Активне шумозаглушення", "Чип H2", "До 6 годин роботи"],
    8999,
    [],
    { was: 9999 },
  ],
  [
    "airpods-max",
    "AirPods Max",
    [
      "Повнорозмірні навушники з активним шумозаглушенням і просторовим звуком.",
      "До 20 годин роботи, зарядка через USB-C.",
    ],
    ["Активне шумозаглушення", "До 20 годин роботи", "USB-C"],
    26999,
    [colors(C.midnight, C.starlight, C.blue, C.purple, C.brightOrange)],
    { badge: "Топ", soldOut: [[C.brightOrange.name]] },
  ],
];

const caseColors = colors(C.black, C.brightOrange, C.blue);
const length = option(LENGTH_OPTION, value("1 м"), value("2 м", 500));

function siliconeCase(slug: string, model: string, price: number, extras?: Extras): SimpleRow {
  return [
    `silicone-case-magsafe-${slug}`,
    `Силіконовий чохол MagSafe для ${model}`,
    [
      "Оригінальний силіконовий чохол Apple з магнітами MagSafe.",
      "М'яка підкладка всередині захищає корпус від подряпин.",
    ],
    [`Для ${model}`, "Підтримує зарядку MagSafe"],
    price,
    [caseColors],
    extras,
  ];
}

function clearCase(slug: string, model: string): SimpleRow {
  return [
    `clear-case-magsafe-${slug}`,
    `Прозорий чохол MagSafe для ${model}`,
    [
      "Оригінальний прозорий чохол Apple з магнітами MagSafe.",
      "Показує колір телефона й не жовтіє з часом.",
    ],
    [`Для ${model}`, "Підтримує зарядку MagSafe"],
    2499,
  ];
}

function glass(slug: string, model: string, price = 599): SimpleRow {
  return [
    `screen-glass-${slug}`,
    `Захисне скло для ${model}`,
    [
      "Загартоване скло на весь екран з олеофобним покриттям.",
      "Наклеїмо в шоурумі під час покупки.",
    ],
    [`Для ${model}`, "Олеофобне покриття"],
    price,
    [],
    { vendor: HOUSE_BRAND },
  ];
}

function charger(
  slug: string,
  watts: number,
  ports: string,
  price: number,
  extras?: Extras,
): SimpleRow {
  return [
    slug,
    `Зарядний пристрій ${ports} ${watts} Вт`,
    ["Оригінальний блок живлення Apple.", "Кабель у комплект не входить."],
    [`Потужність ${watts} Вт`, ports],
    price,
    [],
    extras,
  ];
}

const ACCESSORIES: SimpleRow[] = [
  siliconeCase("iphone-17-pro-max", "iPhone 17 Pro Max", 2699),
  siliconeCase("iphone-17-pro", "iPhone 17 Pro", 2499, { badge: "Новинка" }),
  siliconeCase("iphone-17", "iPhone 17", 2499, { soldOut: [[C.blue.name]] }),
  siliconeCase("iphone-16-pro", "iPhone 16 Pro", 1999),
  siliconeCase("iphone-16", "iPhone 16", 1999),
  clearCase("iphone-17-pro", "iPhone 17 Pro"),
  clearCase("iphone-17", "iPhone 17"),
  glass("iphone-17", "iPhone 17 / 17 Pro"),
  glass("iphone-17-pro-max", "iPhone 17 Pro Max"),
  glass("iphone-16", "iPhone 16 / 16 Pro"),
  glass("ipad-11", "iPad 11″", 899),
  charger("usb-c-power-adapter-20w", 20, "USB-C", 999, { badge: "Хіт" }),
  charger("usb-c-power-adapter-30w", 30, "USB-C", 1799),
  charger("dual-usb-c-power-adapter-35w", 35, "на два порти USB-C", 2799, { soldOut: "all" }),
  charger("usb-c-power-adapter-70w", 70, "USB-C", 2999),
  [
    "magsafe-charger",
    "Бездротова зарядка MagSafe",
    [
      "Магнітна зарядка Apple для iPhone та AirPods із бездротовим футляром.",
      "Блок живлення купується окремо.",
    ],
    ["До 25 Вт з блоком від 30 Вт", "Роз'єм USB-C"],
    2199,
    [length],
  ],
  [
    "apple-watch-magnetic-charger",
    "Зарядка для Apple Watch з USB-C",
    [
      "Магнітний кабель швидкої зарядки для Apple Watch.",
      "Довжина 1 м, блок живлення купується окремо.",
    ],
    ["Швидка зарядка", "Роз'єм USB-C", "Довжина 1 м"],
    1499,
  ],
  [
    "usb-c-charge-cable-60w",
    "Кабель USB-C 60 Вт",
    [
      "Оригінальний плетений кабель Apple з роз'ємами USB-C з обох боків.",
      "Підходить для iPhone 15 і новіших, iPad та MacBook.",
    ],
    ["Потужність до 60 Вт", "Плетена оболонка"],
    799,
    [length],
    { was: 899, wasOnly: "1 м", badge: "Хіт" },
  ],
  [
    "usb-c-charge-cable-240w",
    "Кабель USB-C 240 Вт, 2 м",
    ["Плетений кабель Apple для швидкої зарядки MacBook.", "Передає до 240 Вт."],
    ["Потужність до 240 Вт", "Довжина 2 м"],
    1499,
  ],
  [
    "usb-c-to-lightning-cable",
    "Кабель USB-C – Lightning",
    [
      "Оригінальний кабель Apple для iPhone 14 і старіших та AirPods із Lightning.",
      "Підтримує швидку зарядку з блоком від 20 Вт.",
    ],
    ["Роз'єми USB-C та Lightning", "Швидка зарядка"],
    899,
    [length],
  ],
  [
    "usb-c-to-magsafe-3-cable",
    "Кабель USB-C – MagSafe 3, 2 м",
    [
      "Магнітний кабель зарядки для MacBook Air і MacBook Pro з MagSafe 3.",
      "Плетена оболонка в колір ноутбука.",
    ],
    ["Для MacBook з MagSafe 3", "Довжина 2 м"],
    2299,
    [colors(C.silver, C.midnight, C.spaceBlack)],
  ],
  [
    "apple-pencil-pro",
    "Apple Pencil Pro",
    [
      "Стилус для малювання й нотаток: розпізнає стискання та обертання.",
      "Працює з iPad Pro M4 і новішими, iPad Air M2 і новішими та iPad mini A17 Pro.",
    ],
    ["Магнітне кріплення й зарядка", "Пошук через «Локатор»"],
    5999,
    [],
    { badge: "Топ" },
  ],
  [
    "apple-pencil-usb-c",
    "Apple Pencil (USB-C)",
    [
      "Доступний стилус для нотаток і ескізів.",
      "Заряджається кабелем USB-C, кріпиться до iPad магнітом.",
    ],
    ["Зарядка через USB-C", "Для iPad з USB-C"],
    3799,
  ],
  [
    "magic-keyboard-ipad-air-11",
    "Magic Keyboard для iPad Air 11″",
    [
      "Клавіатура-чохол Apple з трекпадом і рядом функціональних клавіш.",
      "Кріпиться магнітами та має українську розкладку.",
    ],
    ["Для iPad Air 11″ (M2, M3)", "Трекпад", "Порт USB-C для зарядки"],
    13999,
    [colors(C.white, C.black)],
  ],
  [
    "magic-keyboard-ipad-pro-11",
    "Magic Keyboard для iPad Pro 11″",
    [
      "Клавіатура-чохол з алюмінієвою панеллю та скляним трекпадом.",
      "Для iPad Pro 11″ з чипами M4 та M5.",
    ],
    ["Для iPad Pro 11″ (M4, M5)", "Скляний трекпад", "Порт USB-C для зарядки"],
    15999,
    [colors(C.white, C.black)],
  ],
  [
    "smart-folio-ipad-air-11",
    "Чохол Smart Folio для iPad Air 11″",
    [
      "Тонкий магнітний чохол Apple, що захищає iPad з обох боків.",
      "Складається в підставку для читання й набору тексту.",
    ],
    ["Для iPad Air 11″ (M2, M3)", "Магнітне кріплення"],
    3999,
    [colors(C.spaceGray, C.blue, C.purple)],
  ],
  [
    "magic-keyboard-touch-id",
    "Magic Keyboard з Touch ID",
    [
      "Бездротова клавіатура Apple для Mac зі сканером відбитка.",
      "Українська розкладка, заряджається через USB-C.",
    ],
    ["Touch ID", "Зарядка через USB-C", "Для Mac з чипами Apple"],
    6999,
    [colors(C.white, C.black)],
  ],
  [
    "magic-mouse",
    "Magic Mouse",
    ["Бездротова миша Apple з сенсорною поверхнею для жестів.", "Заряджається через USB-C."],
    ["Жести Multi-Touch", "Зарядка через USB-C"],
    3999,
    [colors(C.white, C.black)],
  ],
  [
    "magic-trackpad",
    "Magic Trackpad",
    ["Великий бездротовий трекпад Apple з підтримкою сили натиску.", "Заряджається через USB-C."],
    ["Жести Multi-Touch", "Зарядка через USB-C"],
    6499,
    [colors(C.white, C.black)],
  ],
  [
    "studio-display",
    "Apple Studio Display",
    [
      "Монітор 27″ з роздільністю 5K, камерою та шістьма динаміками.",
      "Під'єднується до Mac одним кабелем Thunderbolt і заряджає ноутбук.",
    ],
    ["Екран 27″ 5K", "Камера 12 Мп", "Thunderbolt 3 і три порти USB-C"],
    79999,
  ],
  [
    "airtag",
    "AirTag",
    [
      "Мітка для ключів, рюкзака чи валізи: шукайте їх у застосунку «Локатор».",
      "Батарейки вистачає приблизно на рік.",
    ],
    ["Пошук через «Локатор»", "Змінна батарейка CR2032", "Захист IP67"],
    1499,
    [],
    { badge: "Хіт" },
  ],
  [
    "airtag-4-pack",
    "AirTag, набір із 4 штук",
    [
      "Чотири мітки AirTag за ціною, нижчою, ніж поодинці.",
      "Для ключів, сумок, валіз і велосипеда.",
    ],
    ["4 мітки в наборі", "Пошук через «Локатор»", "Захист IP67"],
    4999,
  ],
  [
    "homepod-mini",
    "HomePod mini",
    [
      "Компактна розумна колонка для музики та керування розумним домом.",
      "Дві колонки поруч працюють як стереопара.",
    ],
    ["Звук на 360°", "Працює з Apple Music та AirPlay"],
    4999,
    [colors(C.midnight, C.white, C.blue)],
  ],
  [
    "homepod-2",
    "HomePod (2-го покоління)",
    [
      "Велика колонка Apple з глибоким басом і просторовим звуком.",
      "Працює як домашній центр для розумного дому.",
    ],
    ["Просторовий звук", "Датчик температури й вологості"],
    15999,
    [colors(C.midnight, C.white)],
  ],
  [
    "apple-tv-4k",
    "Apple TV 4K",
    [
      "Приставка для фільмів, серіалів і застосунків на телевізорі у 4K HDR.",
      "Пульт Siri Remote заряджається через USB-C.",
    ],
    ["4K Dolby Vision", "Пульт Siri Remote"],
    7499,
    [option(STORAGE_OPTION, value("64 ГБ, Wi-Fi"), value("128 ГБ, Wi-Fi + Ethernet", 1000))],
  ],
  [
    "usb-c-to-headphone-jack-adapter",
    "Перехідник USB-C – 3,5 мм",
    [
      "Перехідник Apple для дротових навушників.",
      "Підходить для iPhone 15 і новіших, iPad та Mac.",
    ],
    ["Роз'єми USB-C та 3,5 мм"],
    599,
  ],
  [
    "usb-c-digital-av-multiport-adapter",
    "Перехідник USB-C Digital AV Multiport",
    [
      "Під'єднує Mac або iPad до телевізора чи проєктора через HDMI.",
      "Має також порти USB-A та USB-C для зарядки.",
    ],
    ["HDMI 4K", "USB-A та USB-C"],
    3999,
  ],
  [
    "usb-c-to-sd-card-reader",
    "Зчитувач карток SD з USB-C",
    ["Переносить фото й відео з картки SD на Mac, iPad або iPhone.", "Підтримує картки UHS-II."],
    ["Картки SD UHS-II", "Роз'єм USB-C"],
    2499,
  ],
  [
    "apple-watch-sport-band",
    "Ремінець Sport Band для Apple Watch",
    [
      "Оригінальний ремінець Apple з м'якого фторкаучуку.",
      "Підходить для корпусів 42, 44, 45, 46 та 49 мм.",
    ],
    ["Фторкаучук", "Розміри S/M та M/L"],
    2499,
    [option(SIZE_OPTION, value("S/M"), value("M/L")), colors(C.black, C.starlight, C.blue)],
    { soldOut: [["S/M", C.blue.name]] },
  ],
  [
    "apple-watch-sport-loop",
    "Ремінець Sport Loop для Apple Watch",
    [
      "Легкий плетений ремінець із нейлону на липучці.",
      "Підходить для корпусів 42, 44, 45, 46 та 49 мм.",
    ],
    ["Нейлон", "Застібка-липучка"],
    2499,
    [colors(C.midnight, C.blue, C.pink)],
  ],
  [
    "apple-watch-milanese-loop",
    "Браслет Milanese Loop для Apple Watch",
    [
      "Сітчастий браслет із нержавіючої сталі з магнітною застібкою.",
      "Підходить для корпусів 42, 44, 45 та 46 мм.",
    ],
    ["Нержавіюча сталь", "Магнітна застібка"],
    4999,
    [colors(C.silver, C.slate)],
    { soldOut: "all" },
  ],
  [
    "airpods-pro-silicone-case",
    "Силіконовий чохол для AirPods Pro",
    [
      "М'який чохол із карабіном захищає футляр навушників від подряпин.",
      "Не заважає бездротовій зарядці.",
    ],
    ["Для AirPods Pro 2 та Pro 3", "Карабін у комплекті"],
    499,
    [colors(C.black, C.white, C.blue)],
    { vendor: HOUSE_BRAND },
  ],
  [
    "macbook-sleeve-13",
    "Чохол-папка для MacBook 13″",
    [
      "Папка з м'якою підкладкою для MacBook Air 13″ та MacBook Pro 14″.",
      "Має кишеню для зарядки й кабелів.",
    ],
    ["Для ноутбуків 13–14″", "Кишеня для аксесуарів"],
    1299,
    [colors(C.black, C.spaceGray)],
    { vendor: HOUSE_BRAND },
  ],
];

function simple(category: CategoryKey) {
  return (row: SimpleRow): ProductSeed => {
    const [handle, title, text, specs, price, options, extras] = row;
    return buildProduct({ ...extras, handle, title, category, text, specs, options, price });
  };
}

/* ------------------------------------------------------------------ */
/* Вживана техніка                                                     */
/* ------------------------------------------------------------------ */

type UsedRow = [
  slug: string,
  title: string,
  category: CategoryKey,
  look: string,
  specs: string[],
  price: number,
  grade: ConditionGrade,
  batteryHealth: number,
  extras?: Extras,
];

const USED: UsedRow[] = [
  [
    "iphone-15-pro-max-256",
    "iPhone 15 Pro Max 256 ГБ",
    "iphone",
    "у титановому корпусі, колір «натуральний титан»",
    ["Чип A17 Pro", "Екран 6,7″ OLED, 120 Гц", "Пам'ять 256 ГБ", "USB-C"],
    39999,
    "Як новий",
    97,
  ],
  [
    "iphone-15-pro-256",
    "iPhone 15 Pro 256 ГБ",
    "iphone",
    "у титановому корпусі, колір «синій титан»",
    ["Чип A17 Pro", "Екран 6,1″ OLED, 120 Гц", "Пам'ять 256 ГБ", "USB-C"],
    33999,
    "Як новий",
    96,
  ],
  [
    "iphone-15-128",
    "iPhone 15 128 ГБ",
    "iphone",
    "рожевого кольору",
    ["Чип A16 Bionic", "Екран 6,1″ OLED", "Пам'ять 128 ГБ", "USB-C"],
    24999,
    "Відмінний",
    93,
  ],
  [
    "iphone-14-pro-max-256",
    "iPhone 14 Pro Max 256 ГБ",
    "iphone",
    "темно-фіолетового кольору",
    ["Чип A16 Bionic", "Екран 6,7″ OLED, 120 Гц", "Пам'ять 256 ГБ", "Lightning"],
    29999,
    "Відмінний",
    90,
  ],
  [
    "iphone-14-pro-128",
    "iPhone 14 Pro 128 ГБ",
    "iphone",
    "кольору «космічний чорний»",
    ["Чип A16 Bionic", "Екран 6,1″ OLED, 120 Гц", "Пам'ять 128 ГБ", "Lightning"],
    24999,
    "Хороший",
    86,
  ],
  [
    "iphone-14-128",
    "iPhone 14 128 ГБ",
    "iphone",
    "чорного кольору з дрібними потертостями на рамці",
    ["Чип A15 Bionic", "Екран 6,1″ OLED", "Пам'ять 128 ГБ", "Lightning"],
    19999,
    "Відмінний",
    89,
    { was: 21999 },
  ],
  [
    "iphone-13-pro-128",
    "iPhone 13 Pro 128 ГБ",
    "iphone",
    "кольору «небесно-блакитний»",
    ["Чип A15 Bionic", "Екран 6,1″ OLED, 120 Гц", "Пам'ять 128 ГБ", "Lightning"],
    19999,
    "Хороший",
    85,
  ],
  [
    "iphone-13-128",
    "iPhone 13 128 ГБ",
    "iphone",
    "зеленого кольору",
    ["Чип A15 Bionic", "Екран 6,1″ OLED", "Пам'ять 128 ГБ", "Lightning"],
    15999,
    "Відмінний",
    88,
  ],
  [
    "iphone-13-mini-128",
    "iPhone 13 mini 128 ГБ",
    "iphone",
    "кольору «сяйво зірок»",
    ["Чип A15 Bionic", "Екран 5,4″ OLED", "Пам'ять 128 ГБ", "Lightning"],
    13999,
    "Хороший",
    84,
  ],
  [
    "macbook-air-13-m2",
    "MacBook Air 13″ M2 8/256 ГБ",
    "mac",
    "кольору «темна ніч» зі слідами користування на кришці",
    ["Чип M2", "8 ГБ оперативної пам'яті", "Накопичувач 256 ГБ", "Екран 13,6″"],
    27999,
    "Хороший",
    87,
    { students: true },
  ],
  [
    "ipad-air-5-64",
    "iPad Air 5 64 ГБ Wi-Fi",
    "ipad",
    "синього кольору",
    ["Чип M1", "Екран 10,9″", "Пам'ять 64 ГБ", "USB-C"],
    14999,
    "Відмінний",
    91,
  ],
  [
    "apple-watch-series-9-45",
    "Apple Watch Series 9 45 мм",
    "watch",
    "в алюмінієвому корпусі кольору «темна ніч»",
    ["Корпус 45 мм з алюмінію", "Екран завжди ввімкнений", "Захист від води 50 м"],
    8999,
    "Відмінний",
    91,
  ],
];

function used(row: UsedRow): ProductSeed {
  const [slug, name, category, look, specs, price, grade, batteryHealth, extras] = row;
  return buildProduct({
    installmentMonths: 12,
    ...extras,
    handle: `used-${slug}`,
    title: `${name}, вживаний`,
    category,
    text: [
      `Вживаний ${name} ${look}.`,
      "Перевірений у нашому сервісі: усі функції працюють, слідів ремонту немає.",
    ],
    specs,
    price,
    used: { grade, batteryHealth },
  });
}

/* ------------------------------------------------------------------ */
/* Каталог                                                             */
/* ------------------------------------------------------------------ */

/** Скільки товарів має бути в каталозі — рівно стільки, скільки просив власник. */
export const PRODUCT_COUNT = 100;

/**
 * Асортимент невеликого магазину техніки Apple наприкінці 2026 року. Ціни в гривнях.
 * Порядок тут — порядок створення в магазині, а отже й порядок показу в колекціях.
 */
export const PRODUCTS: ProductSeed[] = [
  ...IPHONES.map(iphone),
  ...MACS.map(mac),
  ...IPADS.map(ipad),
  ...WATCHES.map(watch),
  ...AIRPODS.map(simple("airpods")),
  ...ACCESSORIES.map(simple("accessories")),
  ...USED.map(used),
];

export function findProduct(handle: string): ProductSeed {
  const found = PRODUCTS.find((item) => item.handle === handle);
  if (!found) throw new Error(`У каталозі seed-catalog.ts немає товару «${handle}»`);
  return found;
}

export function minPrice(seed: ProductSeed): number {
  return Math.min(...seed.variants.map((variant) => variant.price));
}

/** Значення опції «Колір» товару; порожній список — опції немає. */
export function colorValues(seed: ProductSeed): string[] {
  return seed.options.find((item) => item.name === COLOR_OPTION)?.values ?? [];
}

/* ------------------------------------------------------------------ */
/* Зразки Shopify                                                      */
/* ------------------------------------------------------------------ */

/**
 * Демо-товари, які Shopify кладе в новий магазин. Скрипт видаляє лише ті, що збігаються
 * і за handle, і за ознаками зразка (див. isSampleProduct), тож товари власника не зачепить.
 */
export const SAMPLE_PRODUCT_HANDLES = [
  "gift-card",
  "selling-plans-ski-wax",
  "the-3p-fulfilled-snowboard",
  "the-archived-snowboard",
  "the-collection-snowboard-hydrogen",
  "the-collection-snowboard-liquid",
  "the-collection-snowboard-oxygen",
  "the-compare-at-price-snowboard",
  "the-complete-snowboard",
  "the-draft-snowboard",
  "the-hidden-snowboard",
  "the-inventory-not-tracked-snowboard",
  "the-minimal-snowboard",
  "the-multi-location-snowboard",
  "the-multi-managed-snowboard",
  "the-out-of-stock-snowboard",
  "the-videographer-snowboard",
];

/** Демо-колекції Shopify. `frontpage` лишається: її використовує тема інтернет-магазину. */
export const SAMPLE_COLLECTION_HANDLES = ["automated-collection", "hydrogen"];

const SAMPLE_TITLE = /snowboard|^gift card$|ski wax/i;

/** Чи це зразок Shopify: handle зі списку, назва зі сніжного набору і це не товар каталогу. */
export function isSampleProduct(item: { handle: string; title: string }): boolean {
  return (
    SAMPLE_PRODUCT_HANDLES.includes(item.handle) &&
    SAMPLE_TITLE.test(item.title) &&
    !PRODUCTS.some((seed) => seed.handle === item.handle)
  );
}

/* ------------------------------------------------------------------ */
/* Колекції                                                            */
/* ------------------------------------------------------------------ */

/** Правило автоматичної колекції. */
export type CollectionRule =
  | { kind: "productType"; value: string }
  | { kind: "tag"; value: string }
  /** Хоч один варіант має стару ціну. */
  | { kind: "onSale" };

export type CollectionSeed = {
  handle: string;
  title: string;
  description: string;
  rule: CollectionRule;
  /** Товар, чиє головне фото стає фото колекції. */
  imageFrom: string;
};

const byType = (category: CategoryKey): CollectionRule => ({
  kind: "productType",
  value: CATEGORIES[category].productType,
});
const byTag = (tag: string): CollectionRule => ({ kind: "tag", value: tag });

type CollectionContent = Omit<CollectionSeed, "handle" | "title">;

/** Дев'ять колекцій каталогу; назви приходять із CATALOG_LINKS застосунку (seed-data.ts). */
export const CATALOG_COLLECTION_CONTENT: Record<string, CollectionContent> = {
  iphone: {
    description: "Нові та вживані iPhone з гарантією й перевіркою за IMEI.",
    rule: byType("iphone"),
    imageFrom: "iphone-17-pro",
  },
  mac: {
    description: "MacBook, iMac і Mac mini для навчання й роботи.",
    rule: byType("mac"),
    imageFrom: "macbook-air-13-m4",
  },
  ipad: {
    description: "Планшети для нотаток, малювання та фільмів.",
    rule: byType("ipad"),
    imageFrom: "ipad-air-11-m3",
  },
  watch: {
    description: "Apple Watch для спорту й на щодень.",
    rule: byType("watch"),
    imageFrom: "apple-watch-series-11",
  },
  airpods: {
    description: "Бездротові навушники AirPods.",
    rule: byType("airpods"),
    imageFrom: "airpods-pro-3",
  },
  accessories: {
    description: "Зарядні пристрої, кабелі, чохли та інші аксесуари.",
    rule: byType("accessories"),
    imageFrom: "magsafe-charger",
  },
  used: {
    description: "Вживана техніка з оцінкою стану, ємністю акумулятора та гарантією 6 місяців.",
    rule: byTag(TAG_USED),
    imageFrom: "used-iphone-15-pro-256",
  },
  students: {
    description: "Техніка для навчання: конспекти, презентації, відеодзвінки.",
    rule: byTag(TAG_STUDENTS),
    imageFrom: "macbook-air-15-m4",
  },
  deals: {
    description: "Товари зі знижкою цього тижня.",
    rule: { kind: "onSale" },
    imageFrom: "iphone-16",
  },
};

/** Добірки для вкладок «Популярні товари» на головній. */
export const EXTRA_COLLECTIONS: CollectionSeed[] = [
  {
    handle: "hits",
    title: "Хіти",
    description: "Те, що у нас купують найчастіше.",
    rule: byTag(TAG_HIT),
    imageFrom: "airpods-4",
  },
  {
    handle: "new",
    title: "Новинки",
    description: "Найновіші моделі Apple, які вже є в шоурумі.",
    rule: byTag(TAG_NEW),
    imageFrom: "iphone-17-pro-max",
  },
];

/** Чи потрапляє товар у колекцію за її правилом — так само, як вирішить Shopify. */
export function matchesRule(seed: ProductSeed, rule: CollectionRule): boolean {
  if (rule.kind === "productType") return seed.productType === rule.value;
  if (rule.kind === "tag") return seed.tags.includes(rule.value);
  return seed.variants.some((variant) => variant.compareAtPrice !== undefined);
}

export function productsInCollection(
  collection: Pick<CollectionSeed, "rule">,
  products: ProductSeed[] = PRODUCTS,
): ProductSeed[] {
  return products.filter((item) => matchesRule(item, collection.rule));
}

/* ------------------------------------------------------------------ */
/* Перевірка даних                                                     */
/* ------------------------------------------------------------------ */

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function duplicates(values: string[]): string[] {
  return [...new Set(values.filter((item, index) => values.indexOf(item) !== index))];
}

/**
 * Помилки в даних каталогу; порожній список — усе гаразд. Скрипт викликає перевірку до
 * першого запиту в магазин, щоб не лишити його наполовину заповненим.
 */
export function validateCatalog(products: ProductSeed[], collections: CollectionSeed[]): string[] {
  const errors: string[] = [];

  for (const handle of duplicates(products.map((item) => item.handle))) {
    errors.push(`Handle товару «${handle}» повторюється.`);
  }
  for (const handle of duplicates(collections.map((item) => item.handle))) {
    errors.push(`Handle колекції «${handle}» повторюється.`);
  }

  for (const item of products) {
    const name = `Товар «${item.handle}»`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.handle)) errors.push(`${name}: хибний handle.`);
    if (item.variants.length === 0) errors.push(`${name}: немає варіантів.`);

    const expected = item.options.reduce((count, current) => count * current.values.length, 1);
    if (item.variants.length !== expected) {
      errors.push(`${name}: варіантів ${item.variants.length}, а поєднань опцій ${expected}.`);
    }
    for (const current of item.options) {
      for (const repeated of duplicates(current.values)) {
        errors.push(`${name}: значення «${repeated}» опції «${current.name}» повторюється.`);
      }
    }
    for (const key of duplicates(item.variants.map((variant) => variantKey(variant.options)))) {
      errors.push(`${name}: варіант «${key}» повторюється.`);
    }

    for (const variant of item.variants) {
      const key = variantKey(variant.options);
      const known =
        variant.options.length === item.options.length &&
        variant.options.every((current, index) => item.options[index]?.values.includes(current));
      if (!known) errors.push(`${name}: варіант «${key}» не відповідає опціям.`);
      if (!variant.sku) errors.push(`${name}: варіант «${key}» без артикула.`);
      if (!Number.isFinite(variant.price) || variant.price <= 0) {
        errors.push(`${name}: варіант «${key}» без ціни.`);
      }
      if (variant.compareAtPrice !== undefined && variant.compareAtPrice <= variant.price) {
        errors.push(`${name}: стара ціна варіанта «${key}» не більша за нову.`);
      }
      if (!Number.isInteger(variant.stock) || variant.stock < 0) {
        errors.push(`${name}: хибний залишок варіанта «${key}».`);
      }
    }

    const swatches = item.colorSwatches ?? [];
    const colorCount = colorValues(item).length;
    if (colorCount !== swatches.length) {
      errors.push(`${name}: кольорів у опції ${colorCount}, а кружечків ${swatches.length}.`);
    }
    for (const swatch of swatches) {
      if (!HEX_COLOR.test(swatch)) errors.push(`${name}: «${swatch}» — не hex-колір.`);
    }
    if (item.used && !item.tags.includes(TAG_USED)) errors.push(`${name}: немає тегу used.`);
  }

  for (const collection of collections) {
    if (productsInCollection(collection, products).length === 0) {
      errors.push(`Колекція «${collection.handle}» порожня.`);
    }
    if (!products.some((item) => item.handle === collection.imageFrom)) {
      errors.push(`Колекція «${collection.handle}»: немає товару «${collection.imageFrom}».`);
    }
  }

  return errors;
}
