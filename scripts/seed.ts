/**
 * Наповнює магазин Shopify даними, яких чекає сайт: сто товарів каталогу з варіантами,
 * цінами, залишками, метаполями, фото й відео; колекції; визначення й записи метаоб'єктів;
 * сервісні сторінки; блог; головне меню й меню футера.
 *
 * Запуск (Node 22.18+ або 24, типи TypeScript знімає сам Node):
 *   npm run seed                          — усе
 *   npm run seed -- --skip-media          — без фото й відео товарів
 *   npm run seed -- --media               — лише товари та їхні фото
 *   npm run seed -- --keep-samples        — не видаляти демо-товари Shopify (сноуборди)
 *   npm run seed -- --no-demo-reviews     — без вигаданих відгуків та оцінки Google
 *   npm run seed -- --strip-test-images   — прибрати фото «лише для тесту» (див. seed-images.ts)
 *
 * Доступ до Admin API (змінні беруться з `.env`, якщо він є): SHOPIFY_ADMIN_DOMAIN і або
 * готовий токен SHOPIFY_ADMIN_API_TOKEN, або SHOPIFY_ADMIN_CLIENT_ID з
 * SHOPIFY_ADMIN_CLIENT_SECRET застосунку з Dev Dashboard — тоді скрипт сам отримує токен
 * на один запуск і тримає його лише в пам'яті.
 *
 * Скрипт можна запускати повторно: усе шукається за handle або ключем, наявне оновлюється,
 * а те, що вже збігається, пропускається — другий запуск поспіль нічого не змінює.
 * Видаляються лише демо-товари й демо-колекції Shopify. Токен і секрет ніде не друкуються.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  isSampleProduct,
  SAMPLE_COLLECTION_HANDLES,
  validateCatalog,
  variantKey,
  type CollectionRule,
  type ProductSeed,
} from "./seed-catalog.ts";
import {
  ARTICLE_AUTHOR,
  ARTICLES,
  BLOG,
  CATALOG_COLLECTIONS,
  COLLECTIONS,
  METAFIELD_NAMESPACE,
  METAOBJECT_DEFINITIONS,
  metaobjectEntries,
  PAGES,
  PRODUCT_METAFIELD_DEFINITIONS,
  PRODUCTS,
  type FieldValue,
  type Validation,
} from "./seed-data.ts";
import { IMAGE_MANIFEST } from "./seed-images.ts";
import {
  mediaToStrip,
  productMediaPlan,
  validateMedia,
  variantMediaAlt,
  type MediaItem,
} from "./seed-media.ts";

const API_VERSION = "2026-10";
const COLLECTION_SOURCE_TITLE = "Правило каталогу";
const METAFIELDS_PER_REQUEST = 25;
const MAX_ATTEMPTS = 8;
/** Нижче цього запасу балів Admin API скрипт пригальмовує сам, не чекаючи THROTTLED. */
const COST_RESERVE = 400;
const PROGRESS_EVERY = 10;
const MEDIA_POLL_MS = 5000;
const MEDIA_WAIT_MS = 6 * 60 * 1000;
const NODES_PER_REQUEST = 6;

/* ------------------------------------------------------------------ */
/* Параметри запуску                                                   */
/* ------------------------------------------------------------------ */

const FLAGS = {
  "--keep-samples": "не видаляти демо-товари Shopify",
  "--no-demo-reviews": "без вигаданих відгуків та оцінки Google",
  "--skip-media": "без фото й відео товарів",
  "--media": "лише товари та їхні фото",
  "--strip-test-images": "прибрати фото «лише для тесту»",
} as const;

const args = new Set(process.argv.slice(2));
const flag = (name: keyof typeof FLAGS): boolean => args.has(name);

const envFile = join(import.meta.dirname, "..", ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const ADMIN_DOMAIN = process.env.SHOPIFY_ADMIN_DOMAIN?.trim();

class SeedError extends Error {}

type GraphQLError = { message: string; extensions?: { code?: string } };
type UserError = { field?: string[] | null; message: string; code?: string | null };
type ThrottleStatus = { currentlyAvailable: number; restoreRate: number };
type Cost = { requestedQueryCost?: number; throttleStatus?: ThrottleStatus };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* Доступ до Admin API                                                 */
/* ------------------------------------------------------------------ */

let adminToken = "";

/** Готовий токен із .env або обмін client_id + client_secret на токен (діє добу). */
async function resolveToken(): Promise<string> {
  const ready = process.env.SHOPIFY_ADMIN_API_TOKEN?.trim();
  if (ready) return ready;

  const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new SeedError(
      "Немає доступу до Admin API. Додайте в .env або SHOPIFY_ADMIN_API_TOKEN, або пару SHOPIFY_ADMIN_CLIENT_ID і SHOPIFY_ADMIN_CLIENT_SECRET.",
    );
  }

  const response = await fetch(`https://${ADMIN_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const body = await response.text();
  let json: { access_token?: string; error?: string; error_description?: string } = {};
  try {
    json = JSON.parse(body) as typeof json;
  } catch {
    // Відповідь не JSON (сторінка помилки): нижче спрацює загальне повідомлення.
  }
  if (response.ok && json.access_token) return json.access_token;

  // Текст відповіді не друкується цілком: лише код помилки, який не містить секретів.
  const reason = json.error ? ` (${json.error})` : "";
  if (json.error === "invalid_client" || response.status === 401) {
    throw new SeedError(
      `Shopify не прийняв SHOPIFY_ADMIN_CLIENT_ID або SHOPIFY_ADMIN_CLIENT_SECRET${reason}. Скопіюйте їх ще раз зі сторінки застосунку в Dev Dashboard.`,
    );
  }
  if (response.status === 403 || response.status === 404 || json.error === "shop_not_permitted") {
    throw new SeedError(
      `Застосунок не має доступу до магазину ${ADMIN_DOMAIN}${reason}: перевірте SHOPIFY_ADMIN_DOMAIN і чи встановлено застосунок у цьому магазині.`,
    );
  }
  throw new SeedError(
    `Не вдалося отримати токен Admin API: відповідь ${response.status}${reason}.`,
  );
}

async function admin<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(`https://${ADMIN_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
        body: JSON.stringify({ query, variables }),
      });
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) {
        throw new SeedError(`Немає зв'язку з Admin API: ${String(error)}`);
      }
      await sleep(1000 * attempt);
      continue;
    }

    if (response.status === 401) {
      throw new SeedError(
        "Admin API відповів 401: токен недійсний або прострочений. Перевірте SHOPIFY_ADMIN_API_TOKEN або пару SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET.",
      );
    }
    if (response.status === 403) {
      throw new SeedError(
        "Admin API відповів 403: застосунку бракує прав. Потрібні write_products, write_inventory, write_publications, write_content, write_online_store_pages, write_online_store_navigation, write_metaobjects, write_metaobject_definitions, write_files, read_locations.",
      );
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (!response.ok && !retryable) {
      throw new SeedError(`Admin API відповів ${response.status} ${response.statusText}.`);
    }

    let json: { data?: T; errors?: GraphQLError[]; extensions?: { cost?: Cost } } = {};
    try {
      json = (await response.json()) as typeof json;
    } catch {
      // Порожня або обірвана відповідь: повторюємо запит.
    }
    const cost = json.extensions?.cost;
    const status = cost?.throttleStatus;
    const throttled = json.errors?.some((error) => error.extensions?.code === "THROTTLED");

    if (retryable || throttled || (!json.data && !json.errors)) {
      if (attempt >= MAX_ATTEMPTS) {
        throw new SeedError(
          `Admin API не відповів після ${MAX_ATTEMPTS} спроб (${response.status}).`,
        );
      }
      // Чекаємо, доки відновиться стільки балів, скільки коштує запит.
      const missing = (cost?.requestedQueryCost ?? 500) - (status?.currentlyAvailable ?? 0);
      const seconds = status ? Math.max(missing, 0) / status.restoreRate + 1 : 2 * attempt;
      await sleep(seconds * 1000);
      continue;
    }

    const denied = json.errors?.find((error) => error.extensions?.code === "ACCESS_DENIED");
    if (denied) {
      throw new SeedError(`Застосунку бракує прав для цього запиту: ${denied.message}`);
    }
    if (json.errors?.length) {
      throw new SeedError(json.errors.map((error) => error.message).join("; "));
    }
    if (!json.data) throw new SeedError("Admin API повернув порожню відповідь.");

    if (status && status.currentlyAvailable < COST_RESERVE) {
      await sleep(((COST_RESERVE - status.currentlyAvailable) / status.restoreRate) * 1000);
    }
    return json.data;
  }
}

/** Зупиняє скрипт, якщо мутація повернула userErrors. */
function assertNoUserErrors(action: string, errors: UserError[] | null | undefined): void {
  if (!errors?.length) return;
  const details = errors
    .map((error) => `${error.field?.join(".") ?? "—"}: ${error.message}`)
    .join("; ");
  throw new SeedError(`${action} — ${details}`);
}

/* ------------------------------------------------------------------ */
/* Підсумок                                                            */
/* ------------------------------------------------------------------ */

type Tally = { created: number; updated: number; skipped: number };

const tally = (): Tally => ({ created: 0, updated: 0, skipped: 0 });

/** Скільки всього змін зроблено за запуск: нуль на другому запуску поспіль. */
let totalChanges = 0;
const warnings: string[] = [];

function report(step: string, counts: Tally, extra = ""): void {
  totalChanges += counts.created + counts.updated;
  const line = `створено ${counts.created}, оновлено ${counts.updated}, без змін ${counts.skipped}`;
  console.log(`${step}: ${line}${extra ? ` (${extra})` : ""}`);
}

function progress(step: string, done: number, total: number): void {
  if (done % PROGRESS_EVERY === 0 || done === total) console.log(`  ${step}: ${done}/${total}`);
}

const USER_ERRORS = "userErrors { field message }";

/* ------------------------------------------------------------------ */
/* Порівняння значень                                                  */
/* ------------------------------------------------------------------ */

function sameValidations(current: Validation[], wanted: Validation[] = []): boolean {
  const normalize = (items: Validation[]) =>
    items
      .map((item) => `${item.name}=${item.value}`)
      .sort()
      .join("|");
  return normalize(current) === normalize(wanted);
}

/** Чи збігається значення поля: Shopify може інакше відформатувати JSON і числа. */
function sameValue(current: string | null | undefined, wanted: string): boolean {
  if (current == null) return false;
  if (current === wanted) return true;
  try {
    return (
      JSON.stringify(sortKeys(JSON.parse(current))) === JSON.stringify(sortKeys(JSON.parse(wanted)))
    );
  } catch {
    return false;
  }
}

/** Shopify переформатовує HTML (переноси між тегами), тому пробіли між тегами не порівнюються. */
function sameHtml(current: string | null | undefined, wanted: string): boolean {
  const normalize = (html: string) => html.replace(/>\s+</g, "><").trim();
  return normalize(current ?? "") === normalize(wanted);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [
          key,
          typeof item === "string" && item !== "" && !Number.isNaN(Number(item))
            ? Number(item)
            : sortKeys(item),
        ]),
    );
  }
  return value;
}

const samePrice = (current: string | null, wanted: number | undefined): boolean =>
  current == null ? wanted == null : wanted != null && Number(current) === wanted;

const sameList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((item, index) => item === b[index]);

/* ------------------------------------------------------------------ */
/* 0. Магазин: канали продажу, склад                                   */
/* ------------------------------------------------------------------ */

type Store = {
  currency: string;
  /** Канал Headless: через його токени сайт читає магазин. */
  headlessId: string;
  /** Канал «Інтернет-магазин». */
  onlineId: string;
  locationId: string;
  productIds: Map<string, string>;
  collectionIds: Map<string, string>;
  pageIds: Map<string, string>;
};

async function loadStore(): Promise<Store> {
  const data = await admin<{
    shop: { name: string; currencyCode: string };
    publications: {
      nodes: { id: string; name: string; app: { handle: string | null; title: string } | null }[];
    };
    locations: {
      nodes: { id: string; name: string; fulfillsOnlineOrders: boolean; shipsInventory: boolean }[];
    };
  }>(
    `query SeedStore {
      shop { name currencyCode }
      publications(first: 50) { nodes { id name app { handle title } } }
      locations(first: 50) { nodes { id name fulfillsOnlineOrders shipsInventory } }
    }`,
  );

  // Канал упізнаємо за застосунком, а не за назвою: назву власник може змінити.
  const publications = data.publications.nodes;
  const headless =
    publications.find((item) => item.app?.handle === "headless-storefronts") ??
    publications.find((item) => item.app?.title === "Headless") ??
    publications.find((item) => item.name.includes("Headless"));
  const online =
    publications.find((item) => item.app?.handle === "online_store") ??
    publications.find((item) => item.name === "Online Store");
  if (!headless) {
    throw new SeedError(
      "У магазині немає каналу продажу Headless. Встановіть застосунок Headless і створіть у ньому вітрину: сайт читає магазин через її токени.",
    );
  }
  if (!online) throw new SeedError("У магазині немає каналу продажу «Online Store».");

  const locations = data.locations.nodes.filter((item) => item.fulfillsOnlineOrders);
  const location = locations.find((item) => item.shipsInventory) ?? locations[0];
  if (!location) throw new SeedError("У магазині немає складу, який виконує онлайн-замовлення.");

  console.log(
    `Магазин «${data.shop.name}», валюта ${data.shop.currencyCode}. Канали: «${online.name}» і «${headless.name}». Склад: «${location.name}».`,
  );
  if (data.shop.currencyCode !== "UAH") {
    warnings.push(
      `Валюта магазину ${data.shop.currencyCode}, а ціни каталогу розраховані на гривні: суми записано як є, без перерахунку. Змініть валюту магазину на UAH і запустіть скрипт ще раз — він оновить ціни в банерах.`,
    );
  }

  return {
    currency: data.shop.currencyCode,
    headlessId: headless.id,
    onlineId: online.id,
    locationId: location.id,
    productIds: new Map(),
    collectionIds: new Map(),
    pageIds: new Map(),
  };
}

/** Публікує ресурс у каналах, де його ще немає. Повертає, чи довелося публікувати. */
async function publish(
  store: Store,
  id: string,
  published: { headless: boolean; online: boolean },
  action: string,
): Promise<boolean> {
  const input = [
    ...(published.headless ? [] : [{ publicationId: store.headlessId }]),
    ...(published.online ? [] : [{ publicationId: store.onlineId }]),
  ];
  if (input.length === 0) return false;
  const result = await admin<{ publishablePublish: { userErrors: UserError[] } }>(
    `mutation SeedPublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { ${USER_ERRORS} }
    }`,
    { id, input },
  );
  assertNoUserErrors(action, result.publishablePublish.userErrors);
  return true;
}

/* ------------------------------------------------------------------ */
/* 1. Демо-дані Shopify                                                */
/* ------------------------------------------------------------------ */

async function removeSamples(): Promise<void> {
  const data = await admin<{
    products: { nodes: { id: string; handle: string; title: string; vendor: string }[] };
    collections: { nodes: { id: string; handle: string; title: string }[] };
  }>(
    `query SeedSamples {
      products(first: 250) { nodes { id handle title vendor } }
      collections(first: 250) { nodes { id handle title } }
    }`,
  );
  const products = data.products.nodes.filter(isSampleProduct);
  const seedHandles = new Set(COLLECTIONS.map((item) => item.handle));
  const collections = data.collections.nodes.filter(
    (item) => SAMPLE_COLLECTION_HANDLES.includes(item.handle) && !seedHandles.has(item.handle),
  );

  for (const product of products) {
    console.log(`  видаляю демо-товар «${product.title}» (${product.handle}, ${product.vendor})`);
    const result = await admin<{ productDelete: { userErrors: UserError[] } }>(
      `mutation SeedProductDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) { ${USER_ERRORS} }
      }`,
      { input: { id: product.id } },
    );
    assertNoUserErrors(`Видалення ${product.handle}`, result.productDelete.userErrors);
  }
  for (const collection of collections) {
    console.log(`  видаляю демо-колекцію «${collection.title}» (${collection.handle})`);
    const result = await admin<{ collectionDelete: { userErrors: UserError[] } }>(
      `mutation SeedCollectionDelete($input: CollectionDeleteInput!) {
        collectionDelete(input: $input) { ${USER_ERRORS} }
      }`,
      { input: { id: collection.id } },
    );
    assertNoUserErrors(`Видалення ${collection.handle}`, result.collectionDelete.userErrors);
  }

  totalChanges += products.length + collections.length;
  console.log(
    `1. Демо-дані Shopify: видалено товарів ${products.length}, колекцій ${collections.length}`,
  );
}

/* ------------------------------------------------------------------ */
/* 2. Визначення метаполів товару                                      */
/* ------------------------------------------------------------------ */

async function seedMetafieldDefinitions(): Promise<void> {
  const counts = tally();
  const data = await admin<{
    metafieldDefinitions: {
      nodes: {
        key: string;
        name: string;
        description: string | null;
        type: { name: string };
        validations: Validation[];
        access: { storefront: string | null };
      }[];
    };
  }>(
    `query SeedMetafieldDefinitions($namespace: String!) {
      metafieldDefinitions(first: 100, ownerType: PRODUCT, namespace: $namespace) {
        nodes { key name description type { name } validations { name value } access { storefront } }
      }
    }`,
    { namespace: METAFIELD_NAMESPACE },
  );
  const existing = new Map(data.metafieldDefinitions.nodes.map((item) => [item.key, item]));

  for (const definition of PRODUCT_METAFIELD_DEFINITIONS) {
    const current = existing.get(definition.key);
    const input = {
      namespace: METAFIELD_NAMESPACE,
      key: definition.key,
      ownerType: "PRODUCT",
      name: definition.name,
      description: definition.description,
      validations: definition.validations ?? [],
      access: { storefront: "PUBLIC_READ" },
    };

    if (!current) {
      const result = await admin<{ metafieldDefinitionCreate: { userErrors: UserError[] } }>(
        `mutation SeedMetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) { ${USER_ERRORS} }
        }`,
        { definition: { ...input, type: definition.type, pin: true } },
      );
      assertNoUserErrors(
        `Метаполе ${METAFIELD_NAMESPACE}.${definition.key}`,
        result.metafieldDefinitionCreate.userErrors,
      );
      counts.created += 1;
      continue;
    }

    if (current.type.name !== definition.type) {
      throw new SeedError(
        `Метаполе ${METAFIELD_NAMESPACE}.${definition.key} уже має тип ${current.type.name}, а потрібен ${definition.type}. Тип змінити не можна: видаліть визначення в адмінці й запустіть скрипт знову.`,
      );
    }

    const unchanged =
      current.name === definition.name &&
      (current.description ?? "") === definition.description &&
      current.access.storefront === "PUBLIC_READ" &&
      sameValidations(current.validations, definition.validations);
    if (unchanged) {
      counts.skipped += 1;
      continue;
    }

    const result = await admin<{ metafieldDefinitionUpdate: { userErrors: UserError[] } }>(
      `mutation SeedMetafieldDefinitionUpdate($definition: MetafieldDefinitionUpdateInput!) {
        metafieldDefinitionUpdate(definition: $definition) { ${USER_ERRORS} }
      }`,
      { definition: input },
    );
    assertNoUserErrors(
      `Метаполе ${METAFIELD_NAMESPACE}.${definition.key}`,
      result.metafieldDefinitionUpdate.userErrors,
    );
    counts.updated += 1;
  }

  report("2. Визначення метаполів товару", counts);
}

/* ------------------------------------------------------------------ */
/* 3. Товари                                                           */
/* ------------------------------------------------------------------ */

type StoreMedia = {
  id: string;
  alt: string | null;
  mediaContentType: string;
  status: string;
  mediaErrors?: { message: string; details: string | null }[];
};

type StoreVariant = {
  id: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  inventoryPolicy: string;
  inventoryItem: { tracked: boolean };
  selectedOptions: { name: string; value: string }[];
  media: { nodes: { id: string; alt: string | null }[] };
};

type StoreProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: string;
  seo: { title: string | null; description: string | null };
  options: { name: string; values: string[] }[];
  variants: { nodes: StoreVariant[] };
  media: { nodes: StoreMedia[] };
  metafields: { nodes: { key: string; value: string }[] };
  onHeadless: boolean;
  onOnline: boolean;
};

const PRODUCT_FIELDS = `
  id title descriptionHtml vendor productType tags status
  seo { title description }
  options { name values }
  variants(first: 100) {
    nodes {
      id sku price compareAtPrice inventoryPolicy
      inventoryItem { tracked }
      selectedOptions { name value }
      media(first: 1) { nodes { id alt } }
    }
  }
  media(first: 30) { nodes { id alt mediaContentType status } }
`;

type MetafieldInput = {
  ownerId: string;
  namespace: string;
  key: string;
  type: string;
  value: string;
};

function productMetafields(seed: ProductSeed): { key: string; type: string; value: string }[] {
  const fields: { key: string; type: string; value: string }[] = [];
  if (seed.badge) fields.push({ key: "badge", type: "single_line_text_field", value: seed.badge });
  if (seed.installmentMonths) {
    fields.push({
      key: "installment_months",
      type: "number_integer",
      value: String(seed.installmentMonths),
    });
  }
  if (seed.shortSpecs?.length) {
    fields.push({
      key: "short_specs",
      type: "list.single_line_text_field",
      value: JSON.stringify(seed.shortSpecs),
    });
  }
  if (seed.colorSwatches?.length) {
    fields.push({
      key: "color_swatches",
      type: "list.color",
      value: JSON.stringify(seed.colorSwatches),
    });
  }
  if (seed.used) {
    fields.push({
      key: "condition_grade",
      type: "single_line_text_field",
      value: seed.used.grade,
    });
    fields.push({
      key: "battery_health",
      type: "number_integer",
      value: String(seed.used.batteryHealth),
    });
  }
  return fields;
}

const storeVariantKey = (variant: StoreVariant): string =>
  variantKey(variant.selectedOptions.map((item) => item.value));

/** Чи відрізняються дані товару в магазині від каталогу (без фото й залишків). */
function productDataChanged(current: StoreProduct, seed: ProductSeed): boolean {
  if (
    current.title !== seed.title ||
    !sameHtml(current.descriptionHtml, seed.descriptionHtml) ||
    current.vendor !== seed.vendor ||
    current.productType !== seed.productType ||
    current.status !== "ACTIVE" ||
    (current.seo.title ?? "") !== seed.seoTitle ||
    (current.seo.description ?? "") !== seed.seoDescription ||
    // Теги, які власник додав сам, лишаються: перевіряємо лише, що наші на місці.
    !seed.tags.every((tag) => current.tags.includes(tag))
  ) {
    return true;
  }

  const sameOptions =
    current.options.length === seed.options.length &&
    seed.options.every((option, index) => {
      const other = current.options[index];
      return other?.name === option.name && sameList(other.values, option.values);
    });
  if (!sameOptions || current.variants.nodes.length !== seed.variants.length) return true;

  const variants = new Map(current.variants.nodes.map((item) => [storeVariantKey(item), item]));
  return seed.variants.some((variant) => {
    const other = variants.get(variantKey(variant.options));
    return (
      !other ||
      other.sku !== variant.sku ||
      !samePrice(other.price, variant.price) ||
      !samePrice(other.compareAtPrice, variant.compareAtPrice) ||
      other.inventoryPolicy !== "DENY" ||
      !other.inventoryItem.tracked
    );
  });
}

/** Медіа, які можна лишити: файл із помилкою обробки вважаємо відсутнім і завантажуємо знову. */
const usable = (media: StoreMedia[]): StoreMedia[] =>
  media.filter((item) => item.status !== "FAILED");

function mediaChanged(current: StoreProduct, plan: MediaItem[]): boolean {
  return !sameList(
    current.media.nodes.map((item) => `${item.status === "FAILED" ? "!" : ""}${item.alt ?? ""}`),
    plan.map((item) => item.alt),
  );
}

/** Варіанти, чиє фото не збігається з фото їхнього кольору. */
function variantsToRelink(
  product: Pick<StoreProduct, "variants" | "media">,
  plan: MediaItem[],
): { id: string; mediaId: string }[] {
  const ready = new Map(
    product.media.nodes
      .filter((item) => item.status === "READY" && item.mediaContentType === "IMAGE")
      .map((item) => [item.alt, item.id]),
  );
  return product.variants.nodes.flatMap((variant) => {
    const alt = variantMediaAlt(
      plan,
      variant.selectedOptions.map((item) => item.value),
    );
    const mediaId = alt ? ready.get(alt) : undefined;
    return mediaId && variant.media.nodes[0]?.id !== mediaId ? [{ id: variant.id, mediaId }] : [];
  });
}

/** Адреса зображення → id файлу в магазині: одне фото для кількох товарів не завантажується двічі. */
const uploadedFiles = new Map<string, string>();

function rememberFiles(media: StoreMedia[], plan: MediaItem[]): void {
  const byAlt = new Map(usable(media).map((item) => [item.alt, item.id]));
  for (const item of plan) {
    const id = byAlt.get(item.alt);
    if (id && item.type === "IMAGE") uploadedFiles.set(item.url, id);
  }
}

/** Завантажує відеофайл у сховище Shopify і повертає адресу, яку приймає поле originalSource. */
async function stageVideo(url: string): Promise<string> {
  const download = await fetch(url);
  if (!download.ok) throw new SeedError(`Не вдалося завантажити відео ${url}: ${download.status}.`);
  const bytes = await download.arrayBuffer();
  const filename = url.split("/").pop() ?? "video.mp4";

  const data = await admin<{
    stagedUploadsCreate: {
      stagedTargets:
        | { url: string; resourceUrl: string; parameters: { name: string; value: string }[] }[]
        | null;
      userErrors: UserError[];
    };
  }>(
    `mutation SeedStagedUpload($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        ${USER_ERRORS}
      }
    }`,
    {
      input: [
        {
          resource: "VIDEO",
          filename,
          mimeType: "video/mp4",
          httpMethod: "POST",
          fileSize: String(bytes.byteLength),
        },
      ],
    },
  );
  assertNoUserErrors("Підготовка завантаження відео", data.stagedUploadsCreate.userErrors);
  const target = data.stagedUploadsCreate.stagedTargets?.[0];
  if (!target) throw new SeedError("Shopify не повернув адресу для завантаження відео.");

  const form = new FormData();
  for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
  form.append("file", new Blob([bytes], { type: "video/mp4" }), filename);
  const upload = await fetch(target.url, { method: "POST", body: form });
  if (!upload.ok) throw new SeedError(`Сховище Shopify не прийняло відео: ${upload.status}.`);
  return target.resourceUrl;
}

async function fileInput(item: MediaItem, current: StoreMedia[]): Promise<Record<string, string>> {
  const existing = current.find((media) => media.alt === item.alt);
  if (existing) return { id: existing.id };
  const shared = item.type === "IMAGE" ? uploadedFiles.get(item.url) : undefined;
  if (shared) return { id: shared };
  const originalSource = item.type === "VIDEO" ? await stageVideo(item.url) : item.url;
  return { originalSource, alt: item.alt, contentType: item.type };
}

async function fetchProduct(store: Store, handle: string): Promise<StoreProduct | null> {
  const data = await admin<{ productByIdentifier: StoreProduct | null }>(
    `query SeedProduct($handle: String!, $namespace: String!, $headless: ID!, $online: ID!) {
      productByIdentifier(identifier: { handle: $handle }) {
        ${PRODUCT_FIELDS}
        metafields(first: 20, namespace: $namespace) { nodes { key value } }
        onHeadless: publishedOnPublication(publicationId: $headless)
        onOnline: publishedOnPublication(publicationId: $online)
      }
    }`,
    {
      handle,
      namespace: METAFIELD_NAMESPACE,
      headless: store.headlessId,
      online: store.onlineId,
    },
  );
  return data.productByIdentifier;
}

type PendingMedia = { seed: ProductSeed; id: string; plan: MediaItem[] };

async function seedProducts(store: Store): Promise<void> {
  const counts = tally();
  const withMedia = !flag("--skip-media");
  const strip = flag("--strip-test-images");
  const metafields: MetafieldInput[] = [];
  const pending: PendingMedia[] = [];
  let published = 0;
  let stripped = 0;
  let done = 0;

  for (const seed of PRODUCTS) {
    const action = `Товар ${seed.handle}`;
    let current = await fetchProduct(store, seed.handle);
    const plan = productMediaPlan(seed, IMAGE_MANIFEST, { stripTestImages: strip });

    if (current && strip) {
      const remove = mediaToStrip(seed, IMAGE_MANIFEST, current.media.nodes);
      if (remove.length > 0) {
        const result = await admin<{ fileDelete: { userErrors: UserError[] } }>(
          `mutation SeedFileDelete($fileIds: [ID!]!) {
            fileDelete(fileIds: $fileIds) { ${USER_ERRORS} }
          }`,
          { fileIds: remove.map((item) => item.id) },
        );
        assertNoUserErrors(`${action}: прибирання фото`, result.fileDelete.userErrors);
        stripped += remove.length;
        const removed = new Set(remove.map((item) => item.id));
        current.media.nodes = current.media.nodes.filter((item) => !removed.has(item.id));
      }
    }
    if (current) rememberFiles(current.media.nodes, plan);

    const dataChanged = !current || productDataChanged(current, seed);
    const filesChanged = withMedia && (!current || mediaChanged(current, plan));
    const isNew = !current;
    let changed = false;

    if (dataChanged || filesChanged) {
      const existing = new Map(
        (current?.variants.nodes ?? []).map((item) => [storeVariantKey(item), item]),
      );
      const kept = usable(current?.media.nodes ?? []);
      const files: Record<string, string>[] = [];
      if (filesChanged) for (const item of plan) files.push(await fileInput(item, kept));

      const input = {
        handle: seed.handle,
        title: seed.title,
        descriptionHtml: seed.descriptionHtml,
        vendor: seed.vendor,
        productType: seed.productType,
        tags: [...new Set([...seed.tags, ...(current?.tags ?? [])])],
        status: "ACTIVE",
        seo: { title: seed.seoTitle, description: seed.seoDescription },
        productOptions: seed.options.map((option, index) => ({
          name: option.name,
          position: index + 1,
          values: option.values.map((name) => ({ name })),
        })),
        variants: seed.variants.map((variant) => {
          const known = existing.get(variantKey(variant.options));
          return {
            ...(known ? { id: known.id } : {}),
            optionValues: seed.options.map((option, index) => ({
              optionName: option.name,
              name: variant.options[index],
            })),
            sku: variant.sku,
            price: variant.price.toFixed(2),
            compareAtPrice: variant.compareAtPrice?.toFixed(2) ?? null,
            inventoryPolicy: "DENY",
            inventoryItem: { tracked: true },
            // Залишки задаються лише новим варіантам: далі їх веде сам магазин.
            ...(known
              ? {}
              : {
                  inventoryQuantities: [
                    { locationId: store.locationId, name: "available", quantity: variant.stock },
                  ],
                }),
          };
        }),
        ...(filesChanged ? { files } : {}),
      };

      const result = await admin<{
        productSet: { product: StoreProduct | null; userErrors: UserError[] };
      }>(
        `mutation SeedProductSet($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
          productSet(input: $input, identifier: $identifier, synchronous: true) {
            product { ${PRODUCT_FIELDS} }
            ${USER_ERRORS}
          }
        }`,
        { input, identifier: current ? { id: current.id } : null },
      );
      assertNoUserErrors(action, result.productSet.userErrors);
      const saved = result.productSet.product;
      if (!saved) throw new SeedError(`${action} — Shopify не повернув товар.`);
      changed = true;
      current = {
        ...saved,
        metafields: current?.metafields ?? { nodes: [] },
        onHeadless: current?.onHeadless ?? false,
        onOnline: current?.onOnline ?? false,
      };
    }
    if (!current) throw new SeedError(`${action} — товар не створено.`);
    store.productIds.set(seed.handle, current.id);

    const wasPublished = await publish(
      store,
      current.id,
      { headless: current.onHeadless, online: current.onOnline },
      action,
    );
    if (wasPublished) published += 1;

    const currentMetafields = new Map(
      current.metafields.nodes.map((field) => [field.key, field.value]),
    );
    let fieldsChanged = false;
    for (const field of productMetafields(seed)) {
      if (sameValue(currentMetafields.get(field.key), field.value)) continue;
      metafields.push({ ownerId: current.id, namespace: METAFIELD_NAMESPACE, ...field });
      fieldsChanged = true;
    }

    if (withMedia) {
      rememberFiles(current.media.nodes, plan);
      const settled = current.media.nodes.every((item) => item.status === "READY");
      if (!settled || variantsToRelink(current, plan).length > 0) {
        pending.push({ seed, id: current.id, plan });
      }
    }

    if (isNew) counts.created += 1;
    else if (changed || wasPublished || fieldsChanged) counts.updated += 1;
    else counts.skipped += 1;
    done += 1;
    progress("Товари", done, PRODUCTS.length);
  }

  await setMetafields("Метаполя товарів", metafields);
  report(
    "3. Товари",
    counts,
    `опубліковано ${published}, значень метаполів записано ${metafields.length}${strip ? `, прибрано фото «лише для тесту»: ${stripped}` : ""}`,
  );
  totalChanges += stripped;

  if (withMedia) await settleMedia(pending);
}

async function setMetafields(action: string, metafields: MetafieldInput[]): Promise<void> {
  for (let start = 0; start < metafields.length; start += METAFIELDS_PER_REQUEST) {
    const result = await admin<{ metafieldsSet: { userErrors: UserError[] } }>(
      `mutation SeedMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) { ${USER_ERRORS} }
      }`,
      { metafields: metafields.slice(start, start + METAFIELDS_PER_REQUEST) },
    );
    assertNoUserErrors(action, result.metafieldsSet.userErrors);
  }
}

type MediaState = Pick<StoreProduct, "id" | "variants" | "media">;

async function fetchMediaStates(ids: string[]): Promise<MediaState[]> {
  const states: MediaState[] = [];
  for (let start = 0; start < ids.length; start += NODES_PER_REQUEST) {
    const data = await admin<{ nodes: (MediaState | null)[] }>(
      `query SeedMediaStates($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            variants(first: 100) { nodes { id selectedOptions { name value } media(first: 1) { nodes { id alt } } } }
            media(first: 30) { nodes { id alt mediaContentType status mediaErrors { message details } } }
          }
        }
      }`,
      { ids: ids.slice(start, start + NODES_PER_REQUEST) },
    );
    states.push(...data.nodes.filter((item): item is MediaState => Boolean(item?.id)));
  }
  return states;
}

/**
 * Чекає, доки Shopify обробить нові файли, і прив'язує фото кольорів до варіантів:
 * до варіанта можна прив'язати лише готове зображення.
 */
async function settleMedia(pending: PendingMedia[]): Promise<void> {
  if (pending.length === 0) {
    console.log("3. Фото товарів: усе на місці");
    return;
  }
  console.log(`  Фото: чекаю на обробку файлів у ${pending.length} товарах…`);
  const byId = new Map(pending.map((item) => [item.id, item]));
  const deadline = Date.now() + MEDIA_WAIT_MS;
  let waiting = [...byId.keys()];
  const settled: MediaState[] = [];

  while (waiting.length > 0) {
    const states = await fetchMediaStates(waiting);
    const busy = states.filter((state) =>
      state.media.nodes.some((item) => item.status !== "READY" && item.status !== "FAILED"),
    );
    settled.push(...states.filter((state) => !busy.includes(state)));
    waiting = busy.map((state) => state.id);
    if (waiting.length === 0) break;
    if (Date.now() > deadline) {
      warnings.push(
        `Shopify ще обробляє файли в ${waiting.length} товарах. Запустіть скрипт ще раз за кілька хвилин: він доприв'язує фото до варіантів.`,
      );
      break;
    }
    console.log(`  Фото: ще обробляються ${waiting.length} товарів`);
    await sleep(MEDIA_POLL_MS);
  }

  let linked = 0;
  let failed = 0;
  for (const state of settled) {
    const item = byId.get(state.id);
    if (!item) continue;
    for (const media of state.media.nodes.filter((node) => node.status === "FAILED")) {
      failed += 1;
      const reason = media.mediaErrors?.map((error) => error.details ?? error.message).join("; ");
      warnings.push(`Товар ${item.seed.handle}: Shopify не прийняв «${media.alt}» — ${reason}`);
    }
    const variants = variantsToRelink(state, item.plan);
    if (variants.length === 0) continue;
    const result = await admin<{ productVariantsBulkUpdate: { userErrors: UserError[] } }>(
      `mutation SeedVariantMedia($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) { ${USER_ERRORS} }
      }`,
      { productId: state.id, variants },
    );
    assertNoUserErrors(
      `Фото варіантів ${item.seed.handle}`,
      result.productVariantsBulkUpdate.userErrors,
    );
    linked += variants.length;
  }

  totalChanges += linked;
  console.log(
    `3. Фото товарів: варіантам прив'язано фото кольору ${linked}, файлів із помилкою ${failed}`,
  );
}

/* ------------------------------------------------------------------ */
/* 4. Колекції                                                         */
/* ------------------------------------------------------------------ */

type StoreCondition = {
  __typename: string;
  tagRelation?: string;
  tagValues?: string[];
  typeRelation?: string;
  typeValues?: string[];
  priceRelation?: string;
};

function conditionInput(rule: CollectionRule): Record<string, unknown> {
  if (rule.kind === "productType") {
    return { productType: { relation: "EQUALS", values: [rule.value], matchType: "ANY" } };
  }
  if (rule.kind === "tag") {
    return { productTag: { relation: "TAGGED_WITH", values: [rule.value], matchType: "ANY" } };
  }
  return { variantCompareAtPrice: { relation: "IS_SET" } };
}

function conditionMatches(condition: StoreCondition, rule: CollectionRule): boolean {
  if (rule.kind === "productType") {
    return (
      condition.typeRelation === "EQUALS" && sameList(condition.typeValues ?? [], [rule.value])
    );
  }
  if (rule.kind === "tag") {
    return (
      condition.tagRelation === "TAGGED_WITH" && sameList(condition.tagValues ?? [], [rule.value])
    );
  }
  return condition.priceRelation === "IS_SET";
}

async function seedCollections(store: Store): Promise<void> {
  const counts = tally();
  let published = 0;
  const strip = flag("--strip-test-images");

  for (const seed of COLLECTIONS) {
    const action = `Колекція ${seed.handle}`;
    const descriptionHtml = `<p>${seed.description}</p>`;
    const source = {
      title: COLLECTION_SOURCE_TITLE,
      inclusion: { matchType: "ALL", conditions: [conditionInput(seed.rule)] },
    };
    // Фото колекції — головне фото її товару; упізнаємо його за підписом.
    const cover = PRODUCTS.filter((item) => item.handle === seed.imageFrom)
      .flatMap((item) => productMediaPlan(item, IMAGE_MANIFEST, { stripTestImages: strip }))
      .find((item) => item.type === "IMAGE");
    const image = cover ? { src: cover.url, altText: cover.alt } : undefined;

    const data = await admin<{
      collectionByIdentifier: {
        id: string;
        title: string;
        descriptionHtml: string;
        sortOrder: string;
        image: { altText: string | null } | null;
        onHeadless: boolean;
        onOnline: boolean;
        sources: {
          __typename: string;
          id: string;
          inclusion?: {
            conditions: StoreCondition[];
            selections: { nodes: { product: { id: string } }[] };
          };
        }[];
      } | null;
    }>(
      `query SeedCollection($handle: String!, $headless: ID!, $online: ID!) {
        collectionByIdentifier(identifier: { handle: $handle }) {
          id
          title
          descriptionHtml
          sortOrder
          image { altText }
          onHeadless: publishedOnPublication(publicationId: $headless)
          onOnline: publishedOnPublication(publicationId: $online)
          sources {
            __typename
            id
            ... on CollectionConditionsSource {
              inclusion {
                conditions {
                  __typename
                  ... on CollectionSourceInclusionConditionProductTag { tagRelation: relation tagValues: values }
                  ... on CollectionSourceInclusionConditionProductType { typeRelation: relation typeValues: values }
                  ... on CollectionSourceInclusionConditionVariantCompareAtPrice { priceRelation: relation }
                }
                selections(first: 1) { nodes { product { id } } }
              }
            }
          }
        }
      }`,
      { handle: seed.handle, headless: store.headlessId, online: store.onlineId },
    );
    const current = data.collectionByIdentifier;

    if (!current) {
      const result = await admin<{
        collectionCreate: { collection: { id: string } | null; userErrors: UserError[] };
      }>(
        `mutation SeedCollectionCreate($collection: CollectionCreateInput!) {
          collectionCreate(collection: $collection) { collection { id } ${USER_ERRORS} }
        }`,
        {
          collection: {
            handle: seed.handle,
            title: seed.title,
            descriptionHtml,
            sortOrder: "CREATED",
            image,
            sources: [{ source }],
          },
        },
      );
      assertNoUserErrors(action, result.collectionCreate.userErrors);
      const id = result.collectionCreate.collection?.id;
      if (!id) throw new SeedError(`${action} — Shopify не повернув id нової колекції.`);
      await publish(store, id, { headless: false, online: false }, action);
      store.collectionIds.set(seed.handle, id);
      published += 1;
      counts.created += 1;
      continue;
    }
    store.collectionIds.set(seed.handle, current.id);

    const [only] = current.sources;
    const conditions = only?.inclusion?.conditions ?? [];
    const [condition] = conditions;
    const sameRule =
      current.sources.length === 1 &&
      conditions.length === 1 &&
      condition !== undefined &&
      conditionMatches(condition, seed.rule) &&
      only?.inclusion?.selections.nodes.length === 0;

    const update: Record<string, unknown> = {};
    if (current.title !== seed.title) update.title = seed.title;
    if (!sameHtml(current.descriptionHtml, descriptionHtml)) {
      update.descriptionHtml = descriptionHtml;
    }
    if (current.sortOrder !== "CREATED") update.sortOrder = "CREATED";
    if (image && current.image?.altText !== image.altText) update.image = image;
    if (!sameRule) {
      update.sourcesToDelete = current.sources.map((item) => item.id);
      update.sourcesToCreate = [{ source }];
    }

    const changed = Object.keys(update).length > 0;
    if (changed) {
      const result = await admin<{ collectionUpdate: { userErrors: UserError[] } }>(
        `mutation SeedCollectionUpdate($collection: CollectionUpdateInput!) {
          collectionUpdate(collection: $collection) { ${USER_ERRORS} }
        }`,
        { collection: { id: current.id, ...update } },
      );
      assertNoUserErrors(action, result.collectionUpdate.userErrors);
    }
    const wasPublished = await publish(
      store,
      current.id,
      { headless: current.onHeadless, online: current.onOnline },
      action,
    );
    if (wasPublished) published += 1;

    if (changed || wasPublished) counts.updated += 1;
    else counts.skipped += 1;
  }

  report("4. Колекції", counts, `опубліковано ${published}`);
}

/* ------------------------------------------------------------------ */
/* 5. Метаоб'єкти: визначення та записи                                */
/* ------------------------------------------------------------------ */

/** Типи, у яких увімкнено чернетки: їхні записи сайт бачить лише зі статусом ACTIVE. */
const publishableTypes = new Set<string>();

async function seedMetaobjectDefinitions(): Promise<void> {
  const counts = tally();

  for (const definition of METAOBJECT_DEFINITIONS) {
    const data = await admin<{
      metaobjectDefinitionByType: {
        id: string;
        name: string;
        displayNameKey: string | null;
        access: { storefront: string };
        capabilities: { publishable: { enabled: boolean } };
        fieldDefinitions: {
          key: string;
          name: string;
          required: boolean;
          type: { name: string };
          validations: Validation[];
        }[];
      } | null;
    }>(
      `query SeedMetaobjectDefinition($type: String!) {
        metaobjectDefinitionByType(type: $type) {
          id
          name
          displayNameKey
          access { storefront }
          capabilities { publishable { enabled } }
          fieldDefinitions { key name required type { name } validations { name value } }
        }
      }`,
      { type: definition.type },
    );
    const current = data.metaobjectDefinitionByType;
    if (current?.capabilities.publishable.enabled) publishableTypes.add(definition.type);
    const fieldInput = (field: (typeof definition.fields)[number]) => ({
      key: field.key,
      name: field.name,
      required: field.required ?? false,
      validations: field.validations ?? [],
    });

    if (!current) {
      // Без можливості publishable записи не мають чернеток: сайт бачить кожен одразу.
      const result = await admin<{ metaobjectDefinitionCreate: { userErrors: UserError[] } }>(
        `mutation SeedMetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
          metaobjectDefinitionCreate(definition: $definition) { ${USER_ERRORS} }
        }`,
        {
          definition: {
            type: definition.type,
            name: definition.name,
            displayNameKey: definition.displayNameKey,
            access: { storefront: "PUBLIC_READ" },
            fieldDefinitions: definition.fields.map((field) => ({
              ...fieldInput(field),
              type: field.type,
            })),
          },
        },
      );
      assertNoUserErrors(
        `Метаоб'єкт ${definition.type}`,
        result.metaobjectDefinitionCreate.userErrors,
      );
      counts.created += 1;
      continue;
    }

    const currentFields = new Map(current.fieldDefinitions.map((field) => [field.key, field]));
    const operations: Record<string, unknown>[] = [];
    for (const field of definition.fields) {
      const currentField = currentFields.get(field.key);
      if (!currentField) {
        operations.push({ create: { ...fieldInput(field), type: field.type } });
        continue;
      }
      if (currentField.type.name !== field.type) {
        throw new SeedError(
          `Поле ${definition.type}.${field.key} уже має тип ${currentField.type.name}, а потрібен ${field.type}. Тип змінити не можна: виправте поле в адмінці.`,
        );
      }
      const unchanged =
        currentField.name === field.name &&
        currentField.required === (field.required ?? false) &&
        sameValidations(currentField.validations, field.validations);
      if (!unchanged) operations.push({ update: fieldInput(field) });
    }

    const unchanged =
      operations.length === 0 &&
      current.name === definition.name &&
      current.displayNameKey === definition.displayNameKey &&
      current.access.storefront === "PUBLIC_READ";
    if (unchanged) {
      counts.skipped += 1;
      continue;
    }

    const result = await admin<{ metaobjectDefinitionUpdate: { userErrors: UserError[] } }>(
      `mutation SeedMetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
        metaobjectDefinitionUpdate(id: $id, definition: $definition) { ${USER_ERRORS} }
      }`,
      {
        id: current.id,
        definition: {
          name: definition.name,
          displayNameKey: definition.displayNameKey,
          access: { storefront: "PUBLIC_READ" },
          fieldDefinitions: operations,
        },
      },
    );
    assertNoUserErrors(
      `Метаоб'єкт ${definition.type}`,
      result.metaobjectDefinitionUpdate.userErrors,
    );
    counts.updated += 1;
  }

  report("5. Визначення метаоб'єктів", counts);
}

function resolveFieldValue(store: Store, value: FieldValue): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  const id = store.productIds.get(value.product);
  if (!id) throw new SeedError(`У магазині немає товару «${value.product}» для банера.`);
  return id;
}

async function seedMetaobjectEntries(store: Store): Promise<void> {
  const counts = tally();
  const entries = metaobjectEntries({
    currency: store.currency,
    demoReviews: !flag("--no-demo-reviews"),
  });
  const types = [...new Set(entries.map((entry) => entry.type))];
  const existing = new Map<string, { fields: Map<string, string | null>; status?: string }>();

  for (const type of types) {
    const data = await admin<{
      metaobjects: {
        nodes: {
          handle: string;
          fields: { key: string; value: string | null }[];
          capabilities: { publishable: { status: string } | null };
        }[];
      };
    }>(
      `query SeedMetaobjects($type: String!) {
        metaobjects(type: $type, first: 250) {
          nodes { handle fields { key value } capabilities { publishable { status } } }
        }
      }`,
      { type },
    );
    for (const node of data.metaobjects.nodes) {
      existing.set(`${type}/${node.handle}`, {
        fields: new Map(node.fields.map((field) => [field.key, field.value])),
        status: node.capabilities.publishable?.status,
      });
    }
  }

  for (const entry of entries) {
    const fields = Object.entries(entry.fields)
      .map(([key, value]) => ({ key, value: resolveFieldValue(store, value) }))
      .filter((field): field is { key: string; value: string } => field.value !== null);
    const current = existing.get(`${entry.type}/${entry.handle}`);
    const mustActivate = publishableTypes.has(entry.type) && current?.status !== "ACTIVE";

    if (
      current &&
      !mustActivate &&
      fields.every((field) => sameValue(current.fields.get(field.key), field.value))
    ) {
      counts.skipped += 1;
      continue;
    }

    const result = await admin<{ metaobjectUpsert: { userErrors: UserError[] } }>(
      `mutation SeedMetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) { ${USER_ERRORS} }
      }`,
      {
        handle: { type: entry.type, handle: entry.handle },
        metaobject: {
          fields,
          ...(publishableTypes.has(entry.type)
            ? { capabilities: { publishable: { status: "ACTIVE" } } }
            : {}),
        },
      },
    );
    assertNoUserErrors(`Запис ${entry.type}/${entry.handle}`, result.metaobjectUpsert.userErrors);
    if (current) counts.updated += 1;
    else counts.created += 1;
  }

  const perType = types
    .map((type) => `${type}: ${entries.filter((entry) => entry.type === type).length}`)
    .join(", ");
  report("5. Записи метаоб'єктів", counts, perType);
}

/* ------------------------------------------------------------------ */
/* 6. Сторінки, блог і статті                                          */
/* ------------------------------------------------------------------ */

const SEO_DESCRIPTION = { namespace: "global", key: "description_tag" };

function seoDescription(ownerId: string, value: string): MetafieldInput {
  return { ownerId, ...SEO_DESCRIPTION, type: "single_line_text_field", value };
}

async function seedPages(store: Store): Promise<void> {
  const counts = tally();
  const data = await admin<{
    pages: {
      nodes: {
        id: string;
        handle: string;
        title: string;
        body: string;
        isPublished: boolean;
        seoDescription: { value: string } | null;
      }[];
    };
  }>(
    `query SeedPages {
      pages(first: 250) {
        nodes {
          id
          handle
          title
          body
          isPublished
          seoDescription: metafield(namespace: "global", key: "description_tag") { value }
        }
      }
    }`,
  );
  const existing = new Map(data.pages.nodes.map((page) => [page.handle, page]));
  const descriptions: MetafieldInput[] = [];

  for (const seed of PAGES) {
    const action = `Сторінка ${seed.handle}`;
    const current = existing.get(seed.handle);
    const page = { title: seed.title, body: seed.body, isPublished: true };

    if (!current) {
      const result = await admin<{
        pageCreate: { page: { id: string } | null; userErrors: UserError[] };
      }>(
        `mutation SeedPageCreate($page: PageCreateInput!) {
          pageCreate(page: $page) { page { id } ${USER_ERRORS} }
        }`,
        { page: { handle: seed.handle, ...page } },
      );
      assertNoUserErrors(action, result.pageCreate.userErrors);
      const id = result.pageCreate.page?.id;
      if (!id) throw new SeedError(`${action} — Shopify не повернув id нової сторінки.`);
      store.pageIds.set(seed.handle, id);
      descriptions.push(seoDescription(id, seed.description));
      counts.created += 1;
      continue;
    }
    store.pageIds.set(seed.handle, current.id);

    const sameDescription = current.seoDescription?.value === seed.description;
    if (!sameDescription) descriptions.push(seoDescription(current.id, seed.description));

    const unchanged =
      current.title === seed.title && sameHtml(current.body, seed.body) && current.isPublished;
    if (!unchanged) {
      const result = await admin<{ pageUpdate: { userErrors: UserError[] } }>(
        `mutation SeedPageUpdate($id: ID!, $page: PageUpdateInput!) {
          pageUpdate(id: $id, page: $page) { ${USER_ERRORS} }
        }`,
        { id: current.id, page },
      );
      assertNoUserErrors(action, result.pageUpdate.userErrors);
    }

    if (unchanged && sameDescription) counts.skipped += 1;
    else counts.updated += 1;
  }

  await setMetafields("SEO-описи сторінок", descriptions);
  report("6. Сторінки", counts);
}

async function seedBlog(): Promise<void> {
  const blogCounts = tally();
  const counts = tally();

  const data = await admin<{
    blogs: { nodes: { id: string; handle: string; title: string }[] };
    articles: {
      nodes: {
        id: string;
        handle: string;
        title: string;
        body: string;
        summary: string | null;
        isPublished: boolean;
        image: { url: string } | null;
        blog: { id: string };
      }[];
    };
  }>(
    `query SeedBlog {
      blogs(first: 50) { nodes { id handle title } }
      articles(first: 250) {
        nodes { id handle title body summary isPublished image { url } blog { id } }
      }
    }`,
  );

  let blogId = data.blogs.nodes.find((blog) => blog.handle === BLOG.handle)?.id;
  if (blogId) {
    blogCounts.skipped += 1;
  } else {
    const result = await admin<{
      blogCreate: { blog: { id: string } | null; userErrors: UserError[] };
    }>(
      `mutation SeedBlogCreate($blog: BlogCreateInput!) {
        blogCreate(blog: $blog) { blog { id } ${USER_ERRORS} }
      }`,
      { blog: { handle: BLOG.handle, title: BLOG.title } },
    );
    assertNoUserErrors(`Блог ${BLOG.handle}`, result.blogCreate.userErrors);
    blogId = result.blogCreate.blog?.id;
    if (!blogId) throw new SeedError("Shopify не повернув id нового блогу.");
    blogCounts.created += 1;
  }
  report("6. Блог", blogCounts);

  const existing = new Map(
    data.articles.nodes
      .filter((article) => article.blog.id === blogId)
      .map((article) => [article.handle, article]),
  );

  for (const seed of ARTICLES) {
    const action = `Стаття ${seed.handle}`;
    const current = existing.get(seed.handle);
    const image = seed.imageUrl ? { url: seed.imageUrl, altText: seed.title } : undefined;
    const article = {
      title: seed.title,
      body: seed.body,
      summary: seed.summary,
      isPublished: true,
      author: { name: ARTICLE_AUTHOR },
    };

    if (!current) {
      const result = await admin<{ articleCreate: { userErrors: UserError[] } }>(
        `mutation SeedArticleCreate($article: ArticleCreateInput!) {
          articleCreate(article: $article) { ${USER_ERRORS} }
        }`,
        {
          article: {
            ...article,
            blogId,
            handle: seed.handle,
            publishDate: new Date(seed.publishedAt).toISOString(),
            image,
          },
        },
      );
      assertNoUserErrors(action, result.articleCreate.userErrors);
      counts.created += 1;
      continue;
    }

    const unchanged =
      current.title === seed.title &&
      sameHtml(current.body, seed.body) &&
      sameHtml(current.summary, seed.summary) &&
      current.isPublished &&
      (Boolean(current.image) || !image);
    if (unchanged) {
      counts.skipped += 1;
      continue;
    }

    const result = await admin<{ articleUpdate: { userErrors: UserError[] } }>(
      `mutation SeedArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
        articleUpdate(id: $id, article: $article) { ${USER_ERRORS} }
      }`,
      { id: current.id, article: current.image ? article : { ...article, image } },
    );
    assertNoUserErrors(action, result.articleUpdate.userErrors);
    counts.updated += 1;
  }

  report("6. Статті", counts);
}

/* ------------------------------------------------------------------ */
/* 7. Меню                                                             */
/* ------------------------------------------------------------------ */

type MenuItemSeed = { title: string; type: "COLLECTION" | "PAGE"; resourceId: string };

async function seedMenus(store: Store): Promise<void> {
  const counts = tally();
  const required = (ids: Map<string, string>, handle: string, kind: string): string => {
    const id = ids.get(handle);
    if (!id) throw new SeedError(`Для меню немає ${kind} «${handle}» у магазині.`);
    return id;
  };
  const menus: { handle: string; title: string; items: MenuItemSeed[] }[] = [
    {
      handle: "main-menu",
      title: "Main menu",
      items: CATALOG_COLLECTIONS.map((item) => ({
        title: item.title,
        type: "COLLECTION",
        resourceId: required(store.collectionIds, item.handle, "колекції"),
      })),
    },
    {
      handle: "footer",
      title: "Footer menu",
      items: PAGES.map((item) => ({
        title: item.title,
        type: "PAGE",
        resourceId: required(store.pageIds, item.handle, "сторінки"),
      })),
    },
  ];

  const data = await admin<{
    menus: {
      nodes: {
        id: string;
        handle: string;
        title: string;
        items: { title: string; type: string; resourceId: string | null }[];
      }[];
    };
  }>(
    `query SeedMenus {
      menus(first: 50) { nodes { id handle title items { title type resourceId } } }
    }`,
  );

  for (const menu of menus) {
    const current = data.menus.nodes.find((item) => item.handle === menu.handle);
    if (!current) {
      const result = await admin<{ menuCreate: { userErrors: UserError[] } }>(
        `mutation SeedMenuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
          menuCreate(title: $title, handle: $handle, items: $items) { ${USER_ERRORS} }
        }`,
        menu,
      );
      assertNoUserErrors(`Меню ${menu.handle}`, result.menuCreate.userErrors);
      counts.created += 1;
      continue;
    }

    const key = (item: { title: string; type: string; resourceId: string | null }) =>
      `${item.type}|${item.resourceId}|${item.title}`;
    if (sameList(current.items.map(key), menu.items.map(key))) {
      counts.skipped += 1;
      continue;
    }
    const result = await admin<{ menuUpdate: { userErrors: UserError[] } }>(
      `mutation SeedMenuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
        menuUpdate(id: $id, title: $title, items: $items) { ${USER_ERRORS} }
      }`,
      { id: current.id, title: current.title, items: menu.items },
    );
    assertNoUserErrors(`Меню ${menu.handle}`, result.menuUpdate.userErrors);
    counts.updated += 1;
  }

  report("7. Меню", counts, "головне — колекції каталогу, футер — сервісні сторінки");
}

/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const unknown = [...args].filter((item) => !(item in FLAGS));
  if (unknown.length > 0) {
    const known = Object.entries(FLAGS)
      .map(([name, text]) => `  ${name} — ${text}`)
      .join("\n");
    throw new SeedError(`Невідомий параметр: ${unknown.join(", ")}. Доступні:\n${known}`);
  }
  if (!ADMIN_DOMAIN) {
    throw new SeedError("Не задано SHOPIFY_ADMIN_DOMAIN. Додайте його в .env і запустіть знову.");
  }

  // Дані перевіряються до першого запиту, щоб не лишити магазин наполовину заповненим.
  const errors = [
    ...validateCatalog(PRODUCTS, COLLECTIONS),
    ...validateMedia(PRODUCTS, IMAGE_MANIFEST),
  ];
  if (errors.length > 0) throw new SeedError(`Помилки в даних каталогу:\n${errors.join("\n")}`);

  adminToken = await resolveToken();
  const store = await loadStore();

  if (flag("--media")) {
    await seedProducts(store);
  } else {
    if (!flag("--keep-samples")) await removeSamples();
    await seedMetafieldDefinitions();
    await seedProducts(store);
    await seedCollections(store);
    await seedMetaobjectDefinitions();
    await seedMetaobjectEntries(store);
    await seedPages(store);
    await seedBlog();
    await seedMenus(store);
  }

  for (const warning of warnings) console.warn(`Увага: ${warning}`);
  console.log(totalChanges === 0 ? "Готово. Змін немає." : `Готово. Змін: ${totalChanges}.`);
}

main().catch((error: unknown) => {
  // Друкується лише текст помилки: у ньому немає ні токена, ні заголовків запиту.
  console.error(`Помилка: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
