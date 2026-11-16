/**
 * Наповнює магазин Shopify даними, яких чекає сайт: визначення метаполів і метаоб'єктів,
 * записи метаоб'єктів, колекції каталогу, ціни й метаполя товарів, сервісні сторінки, блог.
 *
 * Запуск (Node 22.18+ або 24, типи TypeScript знімає сам Node):
 *   node scripts/seed.ts
 *
 * Потрібні змінні SHOPIFY_ADMIN_DOMAIN і SHOPIFY_ADMIN_API_TOKEN (беруться з `.env`, якщо він є).
 * Скрипт працює лише через Admin API і його можна запускати повторно: усе шукається за
 * handle або ключем, наявне оновлюється, а те, що вже збігається, пропускається.
 * Нічого не видаляється. Токен ніде не друкується.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  ARTICLE_AUTHOR,
  ARTICLES,
  BLOG,
  COLLECTIONS,
  METAFIELD_NAMESPACE,
  METAOBJECT_DEFINITIONS,
  METAOBJECT_ENTRIES,
  PAGES,
  PRODUCT_METAFIELD_DEFINITIONS,
  PRODUCTS,
  type FieldValue,
  type ProductSeed,
  type Validation,
} from "./seed-data.ts";

const API_VERSION = "2026-10";
const ONLINE_STORE_PUBLICATION = "Online Store";
const COLLECTION_SOURCE_TITLE = "Товари каталогу";
const METAFIELDS_PER_REQUEST = 25;
const THROTTLE_RETRIES = 5;
const THROTTLE_DELAY_MS = 2000;

/* ------------------------------------------------------------------ */
/* Admin API                                                           */
/* ------------------------------------------------------------------ */

const envFile = join(import.meta.dirname, "..", ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const ADMIN_DOMAIN = process.env.SHOPIFY_ADMIN_DOMAIN?.trim();
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN?.trim();

class SeedError extends Error {}

type GraphQLError = { message: string; extensions?: { code?: string } };
type UserError = { field?: string[] | null; message: string; code?: string | null };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function admin<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(`https://${ADMIN_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN ?? "" },
      body: JSON.stringify({ query, variables }),
    });

    if (response.status === 401 || response.status === 403) {
      throw new SeedError(
        `Admin API відповів ${response.status}: перевірте SHOPIFY_ADMIN_API_TOKEN і права токена.`,
      );
    }
    if (!response.ok && response.status !== 429) {
      throw new SeedError(`Admin API відповів ${response.status} ${response.statusText}.`);
    }

    const json = (await response.json()) as { data?: T; errors?: GraphQLError[] };
    const throttled =
      response.status === 429 ||
      json.errors?.some((error) => error.extensions?.code === "THROTTLED");
    if (throttled && attempt < THROTTLE_RETRIES) {
      await sleep(THROTTLE_DELAY_MS);
      continue;
    }
    if (json.errors?.length) {
      throw new SeedError(json.errors.map((error) => error.message).join("; "));
    }
    if (!json.data) throw new SeedError("Admin API повернув порожню відповідь.");
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

function report(step: string, counts: Tally, extra = ""): void {
  const line = `створено ${counts.created}, оновлено ${counts.updated}, без змін ${counts.skipped}`;
  console.log(`${step}: ${line}${extra ? ` (${extra})` : ""}`);
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

/* ------------------------------------------------------------------ */
/* 0. Що вже є в магазині                                              */
/* ------------------------------------------------------------------ */

type StoreProduct = {
  id: string;
  handle: string;
  tags: string[];
  featuredMedia: { id: string; image?: { url: string } | null } | null;
  variants: {
    nodes: {
      id: string;
      price: string;
      compareAtPrice: string | null;
      selectedOptions: { name: string; value: string }[];
    }[];
  };
  metafields: { nodes: { key: string; value: string }[] };
};

type Store = { publicationId: string; products: Map<string, StoreProduct> };

async function loadStore(): Promise<Store> {
  const data = await admin<{
    shop: { name: string; currencyCode: string };
    publications: { nodes: { id: string; name: string }[] };
    products: { nodes: StoreProduct[]; pageInfo: { hasNextPage: boolean } };
  }>(
    `query SeedStore($namespace: String!) {
      shop { name currencyCode }
      publications(first: 20) { nodes { id name } }
      products(first: 100) {
        pageInfo { hasNextPage }
        nodes {
          id
          handle
          tags
          featuredMedia { id ... on MediaImage { image { url } } }
          variants(first: 50) {
            nodes { id price compareAtPrice selectedOptions { name value } }
          }
          metafields(first: 20, namespace: $namespace) { nodes { key value } }
        }
      }
    }`,
    { namespace: METAFIELD_NAMESPACE },
  );

  const publication = data.publications.nodes.find(
    (item) => item.name === ONLINE_STORE_PUBLICATION,
  );
  if (!publication) {
    throw new SeedError(`У магазині немає каналу продажу «${ONLINE_STORE_PUBLICATION}».`);
  }

  console.log(
    `Магазин «${data.shop.name}», валюта ${data.shop.currencyCode}, товарів: ${data.products.nodes.length}${data.products.pageInfo.hasNextPage ? "+" : ""}`,
  );
  if (data.shop.currencyCode !== "UAH") {
    console.warn(
      `Увага: валюта магазину ${data.shop.currencyCode}, а ціни в seed-data.ts розраховані на гривні.`,
    );
  }

  return {
    publicationId: publication.id,
    products: new Map(data.products.nodes.map((product) => [product.handle, product])),
  };
}

function requireProduct(store: Store, handle: string): StoreProduct {
  const product = store.products.get(handle);
  if (!product) {
    throw new SeedError(
      `У магазині немає товару «${handle}». Виправте handle у scripts/seed-data.ts.`,
    );
  }
  return product;
}

/* ------------------------------------------------------------------ */
/* 1. Визначення метаполів товару                                      */
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

  report("1. Визначення метаполів товару", counts);
}

/* ------------------------------------------------------------------ */
/* 2. Метаоб'єкти: визначення та записи                                */
/* ------------------------------------------------------------------ */

async function seedMetaobjectDefinitions(): Promise<void> {
  const counts = tally();

  for (const definition of METAOBJECT_DEFINITIONS) {
    const data = await admin<{
      metaobjectDefinitionByType: {
        id: string;
        name: string;
        displayNameKey: string | null;
        access: { storefront: string };
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
          fieldDefinitions { key name required type { name } validations { name value } }
        }
      }`,
      { type: definition.type },
    );
    const current = data.metaobjectDefinitionByType;
    const fieldInput = (field: (typeof definition.fields)[number]) => ({
      key: field.key,
      name: field.name,
      required: field.required ?? false,
      validations: field.validations ?? [],
    });

    if (!current) {
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

  report("2. Визначення метаоб'єктів", counts);
}

function resolveFieldValue(store: Store, value: FieldValue): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  if ("product" in value) return requireProduct(store, value.product).id;
  return requireProduct(store, value.productImage).featuredMedia?.id ?? null;
}

async function seedMetaobjectEntries(store: Store): Promise<void> {
  const counts = tally();
  const types = [...new Set(METAOBJECT_ENTRIES.map((entry) => entry.type))];
  const existing = new Map<string, Map<string, string | null>>();

  for (const type of types) {
    const data = await admin<{
      metaobjects: {
        nodes: { handle: string; fields: { key: string; value: string | null }[] }[];
      };
    }>(
      `query SeedMetaobjects($type: String!) {
        metaobjects(type: $type, first: 250) { nodes { handle fields { key value } } }
      }`,
      { type },
    );
    for (const node of data.metaobjects.nodes) {
      existing.set(
        `${type}/${node.handle}`,
        new Map(node.fields.map((field) => [field.key, field.value])),
      );
    }
  }

  for (const entry of METAOBJECT_ENTRIES) {
    const fields = Object.entries(entry.fields)
      .map(([key, value]) => ({ key, value: resolveFieldValue(store, value) }))
      .filter((field): field is { key: string; value: string } => field.value !== null);
    const current = existing.get(`${entry.type}/${entry.handle}`);

    if (current && fields.every((field) => sameValue(current.get(field.key), field.value))) {
      counts.skipped += 1;
      continue;
    }

    const result = await admin<{ metaobjectUpsert: { userErrors: UserError[] } }>(
      `mutation SeedMetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) { ${USER_ERRORS} }
      }`,
      { handle: { type: entry.type, handle: entry.handle }, metaobject: { fields } },
    );
    assertNoUserErrors(`Запис ${entry.type}/${entry.handle}`, result.metaobjectUpsert.userErrors);
    if (current) counts.updated += 1;
    else counts.created += 1;
  }

  const perType = types
    .map((type) => `${type}: ${METAOBJECT_ENTRIES.filter((entry) => entry.type === type).length}`)
    .join(", ");
  report("2. Записи метаоб'єктів", counts, perType);
}

/* ------------------------------------------------------------------ */
/* 3. Товари: ціни, метаполя, теги                                     */
/* ------------------------------------------------------------------ */

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

const samePrice = (current: string | null, wanted: number | undefined): boolean =>
  current == null ? wanted == null : wanted != null && Number(current) === wanted;

async function seedProducts(store: Store): Promise<void> {
  const counts = tally();
  let priced = 0;
  let tagged = 0;
  const metafields: MetafieldInput[] = [];

  for (const seed of PRODUCTS) {
    const product = requireProduct(store, seed.handle);
    let changed = false;

    const variants = product.variants.nodes
      .map((variant) => {
        const values = variant.selectedOptions.map((option) => option.value);
        const price =
          seed.prices.find((item) => item.option && values.includes(item.option)) ??
          seed.prices.find((item) => !item.option);
        if (!price) {
          throw new SeedError(`Для варіанта товару «${seed.handle}» немає ціни в seed-data.ts.`);
        }
        return { variant, price };
      })
      .filter(
        ({ variant, price }) =>
          !samePrice(variant.price, price.price) ||
          !samePrice(variant.compareAtPrice, price.compareAtPrice),
      )
      .map(({ variant, price }) => ({
        id: variant.id,
        price: price.price.toFixed(2),
        compareAtPrice: price.compareAtPrice?.toFixed(2) ?? null,
      }));

    if (variants.length > 0) {
      const result = await admin<{ productVariantsBulkUpdate: { userErrors: UserError[] } }>(
        `mutation SeedVariantPrices($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) { ${USER_ERRORS} }
        }`,
        { productId: product.id, variants },
      );
      assertNoUserErrors(`Ціни товару ${seed.handle}`, result.productVariantsBulkUpdate.userErrors);
      priced += variants.length;
      changed = true;
    }

    const currentMetafields = new Map(
      product.metafields.nodes.map((field) => [field.key, field.value]),
    );
    for (const field of productMetafields(seed)) {
      if (sameValue(currentMetafields.get(field.key), field.value)) continue;
      metafields.push({ ownerId: product.id, namespace: METAFIELD_NAMESPACE, ...field });
      changed = true;
    }

    const newTags = (seed.tags ?? []).filter((tag) => !product.tags.includes(tag));
    if (newTags.length > 0) {
      const result = await admin<{ tagsAdd: { userErrors: UserError[] } }>(
        `mutation SeedTags($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) { ${USER_ERRORS} }
        }`,
        { id: product.id, tags: newTags },
      );
      assertNoUserErrors(`Теги товару ${seed.handle}`, result.tagsAdd.userErrors);
      tagged += newTags.length;
      changed = true;
    }

    if (changed) counts.updated += 1;
    else counts.skipped += 1;
  }

  await setMetafields("Метаполя товарів", metafields);
  report(
    "3. Товари",
    counts,
    `змінено цін варіантів: ${priced}, значень метаполів: ${metafields.length}, тегів: ${tagged}`,
  );
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

/* ------------------------------------------------------------------ */
/* 4. Колекції                                                         */
/* ------------------------------------------------------------------ */

async function publish(store: Store, id: string, action: string): Promise<void> {
  const result = await admin<{ publishablePublish: { userErrors: UserError[] } }>(
    `mutation SeedPublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { ${USER_ERRORS} }
    }`,
    { id, input: [{ publicationId: store.publicationId }] },
  );
  assertNoUserErrors(action, result.publishablePublish.userErrors);
}

async function seedCollections(store: Store): Promise<void> {
  const counts = tally();
  let published = 0;

  for (const seed of COLLECTIONS) {
    const action = `Колекція ${seed.handle}`;
    const productIds = seed.products.map((handle) => requireProduct(store, handle).id);
    const imageUrl = requireProduct(store, seed.imageFrom).featuredMedia?.image?.url;
    const image = imageUrl ? { src: imageUrl, altText: seed.title } : undefined;
    const descriptionHtml = `<p>${seed.description}</p>`;

    const data = await admin<{
      collectionByIdentifier: {
        id: string;
        title: string;
        descriptionHtml: string;
        image: { url: string } | null;
        publishedOnPublication: boolean;
        sources: {
          __typename: string;
          id: string;
          inclusion?: { selections: { nodes: { product: { id: string } }[] } };
        }[];
      } | null;
    }>(
      `query SeedCollection($handle: String!, $publicationId: ID!) {
        collectionByIdentifier(identifier: { handle: $handle }) {
          id
          title
          descriptionHtml
          image { url }
          publishedOnPublication(publicationId: $publicationId)
          sources {
            __typename
            id
            ... on CollectionConditionsSource {
              inclusion { selections(first: 250) { nodes { product { id } } } }
            }
          }
        }
      }`,
      { handle: seed.handle, publicationId: store.publicationId },
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
            sortOrder: "MANUAL",
            image,
            sources: [
              {
                source: {
                  title: COLLECTION_SOURCE_TITLE,
                  inclusion: { selections: productIds.map((productId) => ({ productId })) },
                },
              },
            ],
          },
        },
      );
      assertNoUserErrors(action, result.collectionCreate.userErrors);
      const id = result.collectionCreate.collection?.id;
      if (!id) throw new SeedError(`${action} — Shopify не повернув id нової колекції.`);
      await publish(store, id, action);
      published += 1;
      counts.created += 1;
      continue;
    }

    // Товари лише додаються: те, що власник додав у колекцію вручну, лишається.
    const source = current.sources.find((item) => item.__typename === "CollectionConditionsSource");
    const selected = new Set(
      current.sources.flatMap((item) =>
        (item.inclusion?.selections.nodes ?? []).map((selection) => selection.product.id),
      ),
    );
    const missing = productIds
      .filter((id) => !selected.has(id))
      .map((productId) => ({ productId }));

    const update: Record<string, unknown> = {};
    if (current.title !== seed.title) update.title = seed.title;
    if (!sameHtml(current.descriptionHtml, descriptionHtml)) {
      update.descriptionHtml = descriptionHtml;
    }
    if (!current.image && image) update.image = image;
    if (missing.length > 0 && source) {
      update.sourcesToUpdate = [
        { condition: { id: source.id, inclusion: { selectionsToAdd: missing } } },
      ];
    } else if (missing.length > 0) {
      update.sourcesToCreate = [
        { source: { title: COLLECTION_SOURCE_TITLE, inclusion: { selections: missing } } },
      ];
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
    if (!current.publishedOnPublication) {
      await publish(store, current.id, action);
      published += 1;
    }

    if (changed || !current.publishedOnPublication) counts.updated += 1;
    else counts.skipped += 1;
  }

  report("4. Колекції", counts, `опубліковано в «${ONLINE_STORE_PUBLICATION}»: ${published}`);
}

/* ------------------------------------------------------------------ */
/* 5. Сторінки, блог і статті                                          */
/* ------------------------------------------------------------------ */

const SEO_DESCRIPTION = { namespace: "global", key: "description_tag" };

function seoDescription(ownerId: string, value: string): MetafieldInput {
  return { ownerId, ...SEO_DESCRIPTION, type: "single_line_text_field", value };
}

async function seedPages(): Promise<void> {
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
      descriptions.push(seoDescription(id, seed.description));
      counts.created += 1;
      continue;
    }

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
  report("5. Сторінки", counts);
}

async function seedBlog(store: Store): Promise<void> {
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
  report("5. Блог", blogCounts);

  const productImages = [...store.products.values()]
    .map((product) => product.featuredMedia?.image?.url)
    .filter((url): url is string => Boolean(url));
  const existing = new Map(
    data.articles.nodes
      .filter((article) => article.blog.id === blogId)
      .map((article) => [article.handle, article]),
  );

  for (const seed of ARTICLES) {
    const action = `Стаття ${seed.handle}`;
    const current = existing.get(seed.handle);
    const imageUrl = seed.imageFile
      ? productImages.find((url) => url.includes(seed.imageFile as string))
      : undefined;
    const image = imageUrl ? { url: imageUrl, altText: seed.title } : undefined;
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

  report("5. Статті", counts);
}

/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  if (!ADMIN_DOMAIN || !ADMIN_TOKEN) {
    throw new SeedError(
      "Не задано SHOPIFY_ADMIN_DOMAIN або SHOPIFY_ADMIN_API_TOKEN. Додайте їх у .env і запустіть скрипт знову.",
    );
  }

  const store = await loadStore();
  await seedMetafieldDefinitions();
  await seedMetaobjectDefinitions();
  await seedMetaobjectEntries(store);
  await seedProducts(store);
  await seedCollections(store);
  await seedPages();
  await seedBlog(store);
  console.log("Готово.");
}

main().catch((error: unknown) => {
  // Друкується лише текст помилки: у ньому немає ні токена, ні заголовків запиту.
  console.error(`Помилка: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
