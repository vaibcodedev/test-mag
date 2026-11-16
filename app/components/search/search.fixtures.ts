import type { PredictiveSearchData } from "@shopify/hydrogen";

/**
 * Демо-відповідь predictive search для історій Storybook і тестів.
 * На сайті її повертає /api/predictive-search.
 */

const CDN =
  "https://cdn.shopify.com/mock-shop-production-media/_image_studio/ea62fe2c-4ccf-4787-9cf0-dbfa4a4f2747";

function image(file: string) {
  return { url: `${CDN}/${file}.png`, altText: null, width: 928, height: 1152 };
}

export const DEMO_PREDICTIVE_RESULT: PredictiveSearchData = {
  term: "iphone",
  total: 5,
  items: {
    articles: [],
    pages: [],
    queries: [
      {
        __typename: "SearchQuerySuggestion",
        text: "iphone 17 pro",
        styledText: "<mark>iphone</mark> 17 pro",
        trackingParameters: null,
      },
    ],
    products: [
      {
        __typename: "Product",
        id: "gid://shopify/Product/1",
        title: "iPhone 17 Pro 256 ГБ, синій титан",
        handle: "iphone-17-pro-256-blue",
        trackingParameters: "_pos=1&_psq=iphone&_ss=e&_v=1.0",
        selectedOrFirstAvailableVariant: {
          id: "gid://shopify/ProductVariant/1",
          image: image("2c9dfe14599dfdf016b15700528a30f9822ad13cb9e2095ad6000685fa06a18a"),
          price: { amount: "64999.0", currencyCode: "UAH" },
        },
      },
      {
        __typename: "Product",
        id: "gid://shopify/Product/2",
        title: "iPhone 17 128 ГБ, чорний",
        handle: "iphone-17-128-black",
        trackingParameters: null,
        selectedOrFirstAvailableVariant: {
          id: "gid://shopify/ProductVariant/2",
          image: image("c49583e8723152603f72ad28dcca1d4ec9f5d89305abeec15cb609593f3e6d1e"),
          price: { amount: "44999.0", currencyCode: "UAH" },
        },
      },
    ],
    collections: [
      {
        __typename: "Collection",
        id: "gid://shopify/Collection/1",
        title: "iPhone",
        handle: "iphone",
        image: null,
        trackingParameters: null,
      },
    ],
  },
};

export const DEMO_PREDICTIVE_EMPTY: PredictiveSearchData = {
  term: "zzzz",
  total: 0,
  items: { articles: [], pages: [], queries: [], products: [], collections: [] },
};
