/**
 * Перевіряє магазин так, як його бачить сайт, — через Storefront API каналу Headless.
 *
 * Запуск: npm run seed:verify
 * Потрібні PUBLIC_STORE_DOMAIN і PUBLIC_STOREFRONT_API_TOKEN (або PRIVATE_STOREFRONT_API_TOKEN)
 * з `.env`. Скрипт нічого не змінює; токени не друкує. Код виходу 1, якщо чогось бракує.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { colorValues, productsInCollection, variantKey } from "./seed-catalog.ts";
import {
  COLLECTIONS,
  METAOBJECT_DEFINITIONS,
  PAGES,
  PRODUCT_COUNT,
  PRODUCTS,
  BLOG,
  ARTICLES,
  CATALOG_COLLECTIONS,
} from "./seed-data.ts";
import { IMAGE_MANIFEST } from "./seed-images.ts";
import { productMediaPlan, SHOWCASE_HANDLE, variantMediaAlt } from "./seed-media.ts";

const API_VERSION = "2026-10";
const PAGE_SIZE = 250;
/** Скільки товарів показує одна сторінка колекції на сайті. */
const COLLECTION_PAGE = 24;

/** По одному товару з кожної категорії та вживаний: їхні опції й фото варіантів звіряються. */
const SAMPLES = [
  "iphone-17-pro",
  "macbook-air-13-m4",
  "ipad-air-11-m3",
  "apple-watch-series-11",
  "airpods-max",
  "usb-c-charge-cable-60w",
  "used-iphone-15-pro-256",
];

const METAFIELD_KEYS = [
  "badge",
  "installment_months",
  "short_specs",
  "color_swatches",
  "condition_grade",
  "battery_health",
];

const envFile = join(import.meta.dirname, "..", ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const DOMAIN = process.env.PUBLIC_STORE_DOMAIN?.trim();
const PUBLIC_TOKEN = process.env.PUBLIC_STOREFRONT_API_TOKEN?.trim();
const PRIVATE_TOKEN = process.env.PRIVATE_STOREFRONT_API_TOKEN?.trim();

const problems: string[] = [];
const check = (ok: boolean, message: string): void => {
  if (!ok) problems.push(message);
};

async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PUBLIC_TOKEN
        ? { "X-Shopify-Storefront-Access-Token": PUBLIC_TOKEN }
        : { "Shopify-Storefront-Private-Token": PRIVATE_TOKEN ?? "" }),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Storefront API відповів ${response.status}.`);
  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((error) => error.message).join("; "));
  if (!json.data) throw new Error("Storefront API повернув порожню відповідь.");
  return json.data;
}

type Connection = {
  nodes: { handle: string }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

async function allProductHandles(collection?: string): Promise<string[] | null> {
  const handles: string[] = [];
  let after: string | null = null;
  for (;;) {
    const page: Connection | null = collection
      ? ((
          await storefront<{ collection: { products: Connection } | null }>(
            `query VerifyCollectionProducts($handle: String!, $first: Int!, $after: String) {
              collection(handle: $handle) {
                products(first: $first, after: $after) { nodes { handle } pageInfo { hasNextPage endCursor } }
              }
            }`,
            { handle: collection, first: PAGE_SIZE, after },
          )
        ).collection?.products ?? null)
      : (
          await storefront<{ products: Connection }>(
            `query VerifyProducts($first: Int!, $after: String) {
              products(first: $first, after: $after) { nodes { handle } pageInfo { hasNextPage endCursor } }
            }`,
            { first: PAGE_SIZE, after },
          )
        ).products;
    if (!page) return null;
    handles.push(...page.nodes.map((node) => node.handle));
    if (!page.pageInfo.hasNextPage) return handles;
    after = page.pageInfo.endCursor;
  }
}

type SampleProduct = {
  title: string;
  availableForSale: boolean;
  options: {
    name: string;
    optionValues: { name: string; swatch: { color: string | null } | null }[];
  }[];
  variants: {
    nodes: {
      title: string;
      sku: string | null;
      availableForSale: boolean;
      price: { amount: string; currencyCode: string };
      compareAtPrice: { amount: string } | null;
      selectedOptions: { value: string }[];
      image: { altText: string | null } | null;
    }[];
  };
  media: { nodes: { mediaContentType: string; alt: string | null }[] };
  metafields: ({ key: string; value: string } | null)[];
};

async function verifyProduct(handle: string, verbose: boolean): Promise<void> {
  const seed = PRODUCTS.find((item) => item.handle === handle);
  if (!seed) throw new Error(`У каталозі немає товару ${handle}`);
  const data = await storefront<{ product: SampleProduct | null }>(
    `query VerifyProduct($handle: String!, $identifiers: [HasMetafieldsIdentifier!]!) {
      product(handle: $handle) {
        title
        availableForSale
        options { name optionValues { name swatch { color } } }
        variants(first: 100) {
          nodes {
            title sku availableForSale
            price { amount currencyCode }
            compareAtPrice { amount }
            selectedOptions { value }
            image { altText }
          }
        }
        media(first: 20) { nodes { mediaContentType alt } }
        metafields(identifiers: $identifiers) { key value }
      }
    }`,
    { handle, identifiers: METAFIELD_KEYS.map((key) => ({ namespace: "custom", key })) },
  );
  const product = data.product;
  if (!product) {
    problems.push(`Товар ${handle} не видно через Storefront API.`);
    return;
  }

  const options = product.options.map(
    (item) => `${item.name}: ${item.optionValues.map((v) => v.name).join(", ")}`,
  );
  const wanted = seed.options.map((item) => `${item.name}: ${item.values.join(", ")}`);
  check(
    options.join(" | ") === wanted.join(" | "),
    `${handle}: опції «${options.join(" | ")}», а мають бути «${wanted.join(" | ")}».`,
  );
  check(
    product.variants.nodes.length === seed.variants.length,
    `${handle}: варіантів ${product.variants.nodes.length}, а має бути ${seed.variants.length}.`,
  );

  const plan = productMediaPlan(seed, IMAGE_MANIFEST);
  const byKey = new Map(
    product.variants.nodes.map((item) => [
      variantKey(item.selectedOptions.map((o) => o.value)),
      item,
    ]),
  );
  let variantImages = 0;
  for (const variant of seed.variants) {
    const key = variantKey(variant.options);
    const other = byKey.get(key);
    if (!other) {
      problems.push(`${handle}: немає варіанта «${key}».`);
      continue;
    }
    check(
      Number(other.price.amount) === variant.price,
      `${handle} «${key}»: ціна ${other.price.amount}, а має бути ${variant.price}.`,
    );
    check(other.sku === variant.sku, `${handle} «${key}»: артикул ${other.sku}.`);
    check(
      other.availableForSale === variant.stock > 0,
      `${handle} «${key}»: наявність ${other.availableForSale}.`,
    );
    const alt = variantMediaAlt(plan, variant.options);
    if (alt) {
      if (other.image?.altText === alt) variantImages += 1;
      else
        problems.push(
          `${handle} «${key}»: фото варіанта «${other.image?.altText}», а має бути «${alt}».`,
        );
    }
  }

  const types = product.media.nodes.map((item) => item.mediaContentType);
  check(
    types.length >= Math.min(plan.length, 20),
    `${handle}: медіа ${types.length}, а в плані ${plan.length}.`,
  );
  check(
    product.media.nodes[0]?.alt === plan[0]?.alt,
    `${handle}: перше фото «${product.media.nodes[0]?.alt}».`,
  );

  const metafields = product.metafields.filter((item) => item !== null);
  console.log(
    `  ${handle}: «${product.title}», опцій ${product.options.length} (${options.join(" | ")}), варіантів ${product.variants.nodes.length}, з фото кольору ${variantImages}, медіа ${types.length}, у наявності: ${product.availableForSale}`,
  );
  if (!verbose) return;
  for (const variant of product.variants.nodes) {
    console.log(
      `    ${variant.title} — ${variant.sku} — ${variant.price.amount} ${variant.price.currencyCode}${variant.compareAtPrice ? ` (було ${variant.compareAtPrice.amount})` : ""} — ${variant.availableForSale ? "є" : "немає в наявності"}`,
    );
  }
  for (const key of METAFIELD_KEYS) {
    console.log(`    custom.${key}: ${metafields.find((item) => item.key === key)?.value ?? "—"}`);
  }
}

async function main(): Promise<void> {
  if (!DOMAIN || (!PUBLIC_TOKEN && !PRIVATE_TOKEN)) {
    throw new Error("Не задано PUBLIC_STORE_DOMAIN або токен Storefront API у .env.");
  }

  const shop = await storefront<{
    shop: { name: string; paymentSettings: { currencyCode: string } };
  }>(`query VerifyShop { shop { name paymentSettings { currencyCode } } }`);
  console.log(`Магазин «${shop.shop.name}», валюта ${shop.shop.paymentSettings.currencyCode}`);

  const handles = (await allProductHandles()) ?? [];
  const seedHandles = new Set(PRODUCTS.map((item) => item.handle));
  const foreign = handles.filter((handle) => !seedHandles.has(handle));
  console.log(
    `Товарів: ${handles.length} (з каталогу ${handles.length - foreign.length}, інших ${foreign.length})`,
  );
  check(
    handles.length - foreign.length === PRODUCT_COUNT,
    `Товарів каталогу видно ${handles.length - foreign.length}, а має бути ${PRODUCT_COUNT}.`,
  );
  check(foreign.length === 0, `На сайті видно сторонні товари: ${foreign.join(", ")}.`);

  console.log("Колекції:");
  for (const collection of COLLECTIONS) {
    const found = await allProductHandles(collection.handle);
    const expected = productsInCollection(collection).length;
    if (!found) {
      problems.push(`Колекцію ${collection.handle} не видно через Storefront API.`);
      continue;
    }
    const pages =
      found.length > COLLECTION_PAGE
        ? `, сторінок по ${COLLECTION_PAGE}: ${Math.ceil(found.length / COLLECTION_PAGE)}`
        : "";
    console.log(`  ${collection.handle} («${collection.title}»): ${found.length}${pages}`);
    check(
      found.length === expected,
      `Колекція ${collection.handle}: товарів ${found.length}, а за правилом ${expected}.`,
    );
  }

  const filters = await storefront<{
    collection: {
      image: { url: string } | null;
      products: {
        filters: {
          id: string;
          label: string;
          type: string;
          values: { label: string; count: number }[];
        }[];
      };
    } | null;
  }>(
    `query VerifyFilters {
      collection(handle: "iphone") {
        image { url }
        products(first: 1) { filters { id label type values { label count } } }
      }
    }`,
  );
  console.log("Фільтри колекції iphone:");
  for (const filter of filters.collection?.products.filters ?? []) {
    console.log(
      `  ${filter.id} «${filter.label}» (${filter.type}): ${filter.values.map((v) => `${v.label} ${v.count}`).join(", ")}`,
    );
  }
  check(Boolean(filters.collection?.image), "Колекція iphone без фото.");

  console.log("Товари (опції, варіанти, фото кольорів):");
  for (const [index, handle] of SAMPLES.entries()) {
    await verifyProduct(handle, index === 0 || handle.startsWith("used-"));
  }

  const showcase = await storefront<{
    product: { media: { nodes: { mediaContentType: string }[] } } | null;
  }>(
    `query VerifyShowcase($handle: String!) {
      product(handle: $handle) { media(first: 20) { nodes { mediaContentType } } }
    }`,
    { handle: SHOWCASE_HANDLE },
  );
  const types = showcase.product?.media.nodes.map((item) => item.mediaContentType) ?? [];
  console.log(`Галерея ${SHOWCASE_HANDLE}: ${types.join(", ")}`);
  check(types.filter((type) => type === "IMAGE").length >= 6, "У товару-вітрини менше шести фото.");
  check(types.includes("EXTERNAL_VIDEO"), "У товару-вітрини немає відео з YouTube.");
  check(types.includes("VIDEO"), "У товару-вітрини немає власного відео.");

  console.log("Метаоб'єкти:");
  for (const definition of METAOBJECT_DEFINITIONS) {
    const data = await storefront<{ metaobjects: { nodes: { handle: string }[] } }>(
      `query VerifyMetaobjects($type: String!) { metaobjects(type: $type, first: 250) { nodes { handle } } }`,
      { type: definition.type },
    );
    console.log(`  ${definition.type}: ${data.metaobjects.nodes.length}`);
    // Відгуки можуть бути вимкнені прапорцем --no-demo-reviews.
    if (definition.type !== "review") {
      check(data.metaobjects.nodes.length > 0, `Метаоб'єктів ${definition.type} не видно.`);
    }
  }

  const banners = await storefront<{
    metaobjects: {
      nodes: {
        handle: string;
        fields: {
          key: string;
          value: string | null;
          reference: {
            handle?: string;
            priceRange?: { minVariantPrice: { amount: string } };
          } | null;
        }[];
      }[];
    };
  }>(
    `query VerifyBanners {
      metaobjects(type: "home_banner", first: 10) {
        nodes { handle fields { key value reference { ... on Product { handle priceRange { minVariantPrice { amount } } } } } }
      }
    }`,
  );
  for (const banner of banners.metaobjects.nodes) {
    const product = banner.fields.find((field) => field.key === "product")?.reference;
    const price = banner.fields.find((field) => field.key === "price")?.value;
    const amount = price ? Number((JSON.parse(price) as { amount: string }).amount) : null;
    console.log(`  банер ${banner.handle} → ${product?.handle ?? "—"}, ціна ${amount}`);
    check(Boolean(product?.handle), `Банер ${banner.handle} не бачить свого товару.`);
    check(
      amount === Number(product?.priceRange?.minVariantPrice.amount),
      `Банер ${banner.handle}: ціна не збігається з ціною товару.`,
    );
  }

  const content = await storefront<{
    pages: { nodes: { handle: string; title: string }[] };
    blog: {
      articles: { nodes: { handle: string; title: string; image: { url: string } | null }[] };
    } | null;
    main: { items: { title: string }[] } | null;
    footer: { items: { title: string }[] } | null;
  }>(
    `query VerifyContent($blog: String!) {
      pages(first: 50) { nodes { handle title } }
      blog(handle: $blog) { articles(first: 20) { nodes { handle title image { url } } } }
      main: menu(handle: "main-menu") { items { title } }
      footer: menu(handle: "footer") { items { title } }
    }`,
    { blog: BLOG.handle },
  );
  const pages = content.pages.nodes.filter((page) =>
    PAGES.some((item) => item.handle === page.handle),
  );
  console.log(`Сторінки (${pages.length}): ${pages.map((page) => page.handle).join(", ")}`);
  check(
    pages.length === PAGES.length,
    `Сервісних сторінок видно ${pages.length}, а має бути ${PAGES.length}.`,
  );
  const articles = content.blog?.articles.nodes ?? [];
  console.log(
    `Статті блогу (${articles.length}): ${articles.map((article) => article.handle).join(", ")}`,
  );
  check(
    articles.length >= ARTICLES.length,
    `Статей видно ${articles.length}, а має бути ${ARTICLES.length}.`,
  );
  check(
    articles.every((article) => article.image),
    "Є статті без фото.",
  );
  console.log(`Головне меню: ${content.main?.items.map((item) => item.title).join(", ")}`);
  console.log(`Меню футера: ${content.footer?.items.map((item) => item.title).join(", ")}`);
  check(
    content.main?.items.length === CATALOG_COLLECTIONS.length,
    "Головне меню не збігається з колекціями каталогу.",
  );
  check(
    content.footer?.items.length === PAGES.length,
    "Меню футера не збігається із сервісними сторінками.",
  );

  const colored = PRODUCTS.filter((item) => colorValues(item).length > 0).length;
  console.log(
    `У каталозі: товарів з опцією «Колір» ${colored}, з одним варіантом ${PRODUCTS.filter((item) => item.variants.length === 1).length}`,
  );

  if (problems.length > 0) {
    console.error(`\nПроблем: ${problems.length}`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
  } else {
    console.log("\nУсе, що потрібно сайту, на місці.");
  }
}

main().catch((error: unknown) => {
  console.error(`Помилка: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
