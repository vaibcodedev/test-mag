import { gql } from "@shopify/hydrogen";

/**
 * Запис метаоб'єкта з усіма полями. `reference` потрібен банерам: фото (file_reference)
 * і товар (product_reference), з якого беруться посилання, фото та ціна.
 */
const HOME_METAOBJECT_FRAGMENT = gql(`
  fragment HomeMetaobject on Metaobject {
    handle
    fields {
      key
      value
      type
      reference {
        __typename
        ... on MediaImage {
          image {
            url
            altText
            width
            height
          }
        }
        ... on Product {
          handle
          productType
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`);

/**
 * Редакційний вміст головної одним запитом: усі типи метаоб'єктів, які створює scripts/seed.ts.
 * На mock.shop, де цих типів немає, кожен список приходить порожнім — без помилки.
 */
export const HOME_METAOBJECTS_QUERY = gql(
  `
    query HomeMetaobjects($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      banners: metaobjects(type: "home_banner", first: 8) {
        nodes {
          ...HomeMetaobject
        }
      }
      usps: metaobjects(type: "usp", first: 8) {
        nodes {
          ...HomeMetaobject
        }
      }
      faq: metaobjects(type: "faq_item", first: 20) {
        nodes {
          ...HomeMetaobject
        }
      }
      reviews: metaobjects(type: "review", first: 10) {
        nodes {
          ...HomeMetaobject
        }
      }
      aboutStats: metaobjects(type: "about_stat", first: 8) {
        nodes {
          ...HomeMetaobject
        }
      }
      storeInfo: metaobjects(type: "store_info", first: 1) {
        nodes {
          ...HomeMetaobject
        }
      }
    }
  `,
  [HOME_METAOBJECT_FRAGMENT],
);

/**
 * Колекція каталогу для плитки: назва, фото, найдешевший товар (для «від N ₴») і товари
 * для підрахунку. Поля з кількістю товарів у Collection в Storefront API немає, тому
 * рахуються завантажені id — не більше HOME_COLLECTION_COUNT_LIMIT на колекцію.
 */
const HOME_COLLECTION_FRAGMENT = gql(`
  fragment HomeCollection on Collection {
    handle
    title
    image {
      url
      altText
      width
      height
    }
    cheapest: products(first: 1, sortKey: PRICE) {
      nodes {
        featuredImage {
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
    counted: products(first: 50) {
      nodes {
        id
      }
    }
  }
`);

/** Скільки товарів колекції рахує плитка: значення `first` у полі `counted` вище. */
export const HOME_COLLECTION_COUNT_LIMIT = 50;

/** Дев'ять колекцій каталогу; псевдонім збігається з handle. */
export const HOME_COLLECTIONS_QUERY = gql(
  `
    query HomeCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      iphone: collection(handle: "iphone") {
        ...HomeCollection
      }
      mac: collection(handle: "mac") {
        ...HomeCollection
      }
      ipad: collection(handle: "ipad") {
        ...HomeCollection
      }
      watch: collection(handle: "watch") {
        ...HomeCollection
      }
      airpods: collection(handle: "airpods") {
        ...HomeCollection
      }
      accessories: collection(handle: "accessories") {
        ...HomeCollection
      }
      used: collection(handle: "used") {
        ...HomeCollection
      }
      students: collection(handle: "students") {
        ...HomeCollection
      }
      deals: collection(handle: "deals") {
        ...HomeCollection
      }
    }
  `,
  [HOME_COLLECTION_FRAGMENT],
);
