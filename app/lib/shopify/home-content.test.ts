import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HOME_COLLECTIONS_QUERY,
  HOME_METAOBJECTS_QUERY,
} from "~/graphql/queries/home-content.query";
import { HOME_CONTENT } from "~/lib/content/home";
import { STORE_INFO } from "~/lib/content/site";

import {
  buildHomeContent,
  countCatalogProducts,
  loadHomeContent,
  mapAboutStats,
  mapBentoCategories,
  mapFaqItems,
  mapHomeBanners,
  mapReviews,
  mapReviewsRating,
  mapStoreInfo,
  mapUsps,
  type HomeCollectionsData,
  type HomeMetaobject,
  type HomeMetaobjectsData,
} from "./home-content";

/* Фікстури повторюють відповідь Storefront API: handle і fields { key value type reference }. */

type FieldFixture = { value: string | null; type?: string; reference?: unknown };

function entry(
  handle: string,
  fields: Record<string, string | null | FieldFixture>,
): HomeMetaobject {
  return {
    handle,
    fields: Object.entries(fields).map(([key, field]) => {
      const fixture: FieldFixture =
        field !== null && typeof field === "object" ? field : { value: field };
      return {
        key,
        value: fixture.value,
        type: fixture.type ?? "single_line_text_field",
        reference: fixture.reference ?? null,
      };
    }),
  } as HomeMetaobject;
}

/** Відповідь, якої Storefront API не мав би віддати: для перевірки стійкості. */
function broken(value: unknown): HomeMetaobject {
  return value as HomeMetaobject;
}

const IMAGE = { url: "https://cdn.shopify.com/phone.png", altText: null, width: 928, height: 1152 };

const PRODUCT_REFERENCE = {
  __typename: "Product",
  handle: "one-smartphone",
  featuredImage: IMAGE,
  priceRange: { minVariantPrice: { amount: "64999.0", currencyCode: "UAH" } },
};

const MEDIA_REFERENCE = {
  __typename: "MediaImage",
  image: { url: "https://cdn.shopify.com/banner.png", altText: "Банер", width: 1600, height: 900 },
};

describe("mapFaqItems", () => {
  it("читає питання й відповіді та впорядковує за полем order", () => {
    const items = mapFaqItems([
      entry("faq-02", {
        question: "Чи можна купити частинами?",
        answer: { value: "Так.\nДо 25 платежів.", type: "multi_line_text_field" },
        order: { value: "2", type: "number_integer" },
      }),
      entry("faq-01", {
        question: " Як швидко доставляєте? ",
        answer: "Завтра.",
        order: { value: "1", type: "number_integer" },
      }),
    ]);

    expect(items).toEqual([
      { question: "Як швидко доставляєте?", answer: "Завтра." },
      { question: "Чи можна купити частинами?", answer: "Так.\nДо 25 платежів." },
    ]);
  });

  it("ставить записи без order після впорядкованих, зберігаючи порядок магазину", () => {
    const items = mapFaqItems([
      entry("a", { question: "Без порядку 1", answer: "—" }),
      entry("b", { question: "Другий", answer: "—", order: "2" }),
      entry("c", { question: "Без порядку 2", answer: "—", order: "не число" }),
      entry("d", { question: "Перший", answer: "—", order: "1" }),
    ]);

    expect(items.map((item) => item.question)).toEqual([
      "Перший",
      "Другий",
      "Без порядку 1",
      "Без порядку 2",
    ]);
  });

  it("пропускає записи без питання або відповіді", () => {
    const items = mapFaqItems([
      entry("no-answer", { question: "Питання без відповіді", answer: null }),
      entry("blank", { question: "   ", answer: "Відповідь без питання" }),
      entry("no-fields", {}),
      entry("ok", { question: "Ціле питання", answer: "Ціла відповідь" }),
    ]);

    expect(items).toEqual([{ question: "Ціле питання", answer: "Ціла відповідь" }]);
  });

  it("не падає на зіпсованій відповіді", () => {
    expect(mapFaqItems(null)).toEqual([]);
    expect(mapFaqItems(undefined)).toEqual([]);
    expect(
      mapFaqItems([
        broken(null),
        broken({ handle: "x" }),
        broken({ handle: "y", fields: "рядок замість списку" }),
        broken({ handle: "z", fields: [null, { key: 5, value: "a" }, { key: "question" }] }),
      ]),
    ).toEqual([]);
  });
});

describe("mapReviews", () => {
  it("читає відгуки й показує найновіші першими", () => {
    const reviews = mapReviews([
      entry("review-02", {
        name: "Максим Гнатюк",
        text: "Здав старий MacBook у trade-in.",
        date: { value: "2026-09-14", type: "date" },
        source: "Google",
      }),
      entry("review-01", {
        name: "Ірина Коваль",
        text: "Замовила iPhone увечері.",
        date: { value: "2026-10-28", type: "date" },
        source: "Google",
      }),
    ]);

    expect(reviews).toEqual([
      {
        name: "Ірина Коваль",
        text: "Замовила iPhone увечері.",
        date: "2026-10-28",
        source: "Google",
      },
      {
        name: "Максим Гнатюк",
        text: "Здав старий MacBook у trade-in.",
        date: "2026-09-14",
        source: "Google",
      },
    ]);
  });

  it("лишає відгук із зіпсованою датою чи без джерела, але без дати й у кінці", () => {
    const reviews = mapReviews([
      entry("bad-date", { name: "Олена", text: "Усе добре.", date: "28.10.2026" }),
      entry("dated", { name: "Петро", text: "Швидко.", date: "2026-01-05", source: "Google" }),
    ]);

    expect(reviews).toEqual([
      { name: "Петро", text: "Швидко.", date: "2026-01-05", source: "Google" },
      { name: "Олена", text: "Усе добре.", date: "", source: "" },
    ]);
  });

  it("пропускає відгуки без імені або тексту", () => {
    expect(
      mapReviews([
        entry("no-text", { name: "Анонім", text: "" }),
        entry("no-name", { name: null, text: "Текст без автора" }),
      ]),
    ).toEqual([]);
  });
});

describe("mapUsps", () => {
  it("читає іконку, заголовок і підпис за порядком", () => {
    const usps = mapUsps([
      entry("usp-02", {
        icon: "shield-check",
        title: "Гарантія 12 місяців",
        caption: "Без біганини",
        order: "2",
      }),
      entry("usp-01", {
        icon: "truck",
        title: "Доставка завтра",
        caption: "Новою поштою",
        order: "1",
      }),
    ]);

    expect(usps).toEqual([
      { icon: "truck", title: "Доставка завтра", caption: "Новою поштою" },
      { icon: "shield-check", title: "Гарантія 12 місяців", caption: "Без біганини" },
    ]);
  });

  it("лишає перевагу без іконки й підпису, але не без заголовка", () => {
    const usps = mapUsps([
      entry("no-title", { icon: "truck", title: null, caption: "Підпис без заголовка" }),
      entry("bare", { title: "0% частинами" }),
    ]);

    expect(usps).toEqual([{ icon: "", title: "0% частинами", caption: "" }]);
  });
});

describe("mapAboutStats", () => {
  it("читає число й підпис за порядком і пропускає неповні записи", () => {
    const stats = mapAboutStats([
      entry("stat-02", { value: "14 000+", label: "покупців по всій Україні", order: "2" }),
      entry("stat-broken", { value: "4,9", label: null, order: "3" }),
      entry("stat-01", { value: "9 років", label: "працюємо у Вінниці", order: "1" }),
    ]);

    expect(stats).toEqual([
      { value: "9 років", label: "працюємо у Вінниці" },
      { value: "14 000+", label: "покупців по всій Україні" },
    ]);
  });
});

describe("mapHomeBanners", () => {
  const full = entry("iphone-17-pro", {
    label: "Новинка осені",
    title: "iPhone 17 Pro",
    accent: "Pro",
    subtitle: { value: "Три камери по 48 Мп.", type: "multi_line_text_field" },
    specs: { value: '["A19 Pro","Екран 6,3″ 120 Гц"]', type: "list.single_line_text_field" },
    color_names: {
      value: '["Космічний помаранчевий","Сріблястий"]',
      type: "list.single_line_text_field",
    },
    color_swatches: { value: '["#f77e2d","#e3e4e5"]', type: "list.color" },
    price: { value: '{"amount":"59999.0","currency_code":"UAH"}', type: "money" },
    price_from: { value: "false", type: "boolean" },
    installment_months: { value: "10", type: "number_integer" },
    product: {
      value: "gid://shopify/Product/1",
      type: "product_reference",
      reference: PRODUCT_REFERENCE,
    },
    image: {
      value: "gid://shopify/MediaImage/1",
      type: "file_reference",
      reference: MEDIA_REFERENCE,
    },
    link: "/collections/iphone",
    compare_link: "/collections/iphone?sort=price",
    delivery: "Доставимо завтра",
    order: { value: "1", type: "number_integer" },
  });

  it("читає всі поля банера; власні ціна, фото й посилання важливіші за товар", () => {
    expect(mapHomeBanners([full])).toEqual([
      {
        id: "iphone-17-pro",
        label: "Новинка осені",
        title: "iPhone 17 Pro",
        accent: "Pro",
        subtitle: "Три камери по 48 Мп.",
        specs: ["A19 Pro", "Екран 6,3″ 120 Гц"],
        colors: [
          { name: "Космічний помаранчевий", hex: "#f77e2d" },
          { name: "Сріблястий", hex: "#e3e4e5" },
        ],
        price: { amount: "59999.0", currencyCode: "UAH" },
        priceFrom: false,
        installmentMonths: 10,
        image: MEDIA_REFERENCE.image,
        href: "/collections/iphone",
        compareHref: "/collections/iphone?sort=price",
        delivery: "Доставимо завтра",
      },
    ]);
  });

  it("бере посилання, ціну й фото з товару, якщо власні поля порожні", () => {
    const [banner] = mapHomeBanners([
      entry("airpods", {
        title: "AirPods Pro 3",
        product: {
          value: "gid://shopify/Product/1",
          type: "product_reference",
          reference: PRODUCT_REFERENCE,
        },
        image: { value: null, type: "file_reference" },
        price: { value: null, type: "money" },
      }),
    ]);

    expect(banner).toMatchObject({
      id: "airpods",
      title: "AirPods Pro 3",
      href: "/products/one-smartphone",
      price: { amount: "64999.0", currencyCode: "UAH" },
      image: IMAGE,
      compareHref: null,
      installmentMonths: null,
    });
    expect(banner?.priceFrom).toBeUndefined();
    expect(banner?.specs).toBeUndefined();
    expect(banner?.colors).toBeUndefined();
  });

  it("впорядковує банери за полем order", () => {
    const banners = mapHomeBanners([
      entry("third", { title: "Третій", link: "/c", order: "3" }),
      entry("first", { title: "Перший", link: "/a", order: "1" }),
      entry("second", { title: "Другий", link: "/b", order: "2" }),
    ]);

    expect(banners.map((banner) => banner.id)).toEqual(["first", "second", "third"]);
  });

  it("пропускає банер без заголовка або без жодного посилання", () => {
    const banners = mapHomeBanners([
      entry("no-title", { title: null, link: "/collections/iphone" }),
      entry("no-link", { title: "Банер без посилання" }),
      // Посилання на товар, знятий із каналу продажу: Storefront API віддає reference: null.
      entry("unpublished", {
        title: "Товар приховано",
        product: { value: "gid://shopify/Product/9", type: "product_reference", reference: null },
      }),
    ]);

    expect(banners).toEqual([]);
  });

  it("відкидає небезпечні посилання, зіпсовані ціну, кольори й числа", () => {
    const [banner] = mapHomeBanners([
      entry("garbled", {
        title: "Банер",
        link: "javascript:alert(1)",
        compare_link: "//evil.example/x",
        product: {
          value: "gid://shopify/Product/1",
          type: "product_reference",
          reference: { ...PRODUCT_REFERENCE, featuredImage: null },
        },
        // Посилання не того типу: у полі фото опинився не файл із зображенням.
        image: {
          value: "gid://shopify/Video/1",
          type: "file_reference",
          reference: { __typename: "Video" },
        },
        price: { value: '{"amount":"дорого","currency_code":"UAH"}', type: "money" },
        price_from: "так",
        installment_months: "двадцять п'ять",
        specs: "не JSON",
        color_names: '["Червоний","Синій","Зелений"]',
        color_swatches: '["red","#32374a","url(x)"]',
      }),
    ]);

    expect(banner).toMatchObject({
      href: "/products/one-smartphone",
      compareHref: null,
      // Власна ціна нечитабельна — лишається ціна товару.
      price: { amount: "64999.0", currencyCode: "UAH" },
      image: null,
      installmentMonths: null,
      specs: ["не JSON"],
      colors: [{ name: "Синій", hex: "#32374a" }],
    });
    expect(banner?.priceFrom).toBeUndefined();
  });

  it("приймає повну адресу https і називає колір його hex, якщо назви немає", () => {
    const [banner] = mapHomeBanners([
      entry("external", {
        title: "Банер",
        link: "https://example.com/promo",
        color_swatches: '["#000000"]',
      }),
    ]);

    expect(banner?.href).toBe("https://example.com/promo");
    expect(banner?.colors).toEqual([{ name: "#000000", hex: "#000000" }]);
    expect(banner?.price).toBeNull();
  });
});

describe("mapStoreInfo", () => {
  const stored = entry("main", {
    name: "Сад",
    postal_code: "21050",
    city: "Вінниця",
    street: "вул. Соборна, 64",
    latitude: { value: "49.2331", type: "number_decimal" },
    longitude: { value: "28.4682", type: "number_decimal" },
    hours: "щодня 10:00–20:00",
    opens: "10:00",
    closes: "20:00",
    phone: "068 129 99 00",
    telegram: "@sad_vinnytsia",
    legal_name: "ФОП Садовий Олег Вікторович",
    tax_id: "3214509876",
    google_rating: { value: "4.9", type: "number_decimal" },
    google_reviews_count: { value: "412", type: "number_integer" },
    google_reviews_url: {
      value: "https://www.google.com/maps/search/?api=1&query=49.2331,28.4682",
      type: "url",
    },
  });

  it("запис із тими самими значеннями, що й у сіді, дає STORE_INFO", () => {
    expect(mapStoreInfo([stored])).toEqual(STORE_INFO);
  });

  it("читає інші значення й сам будує посилання на телефон і Telegram", () => {
    const store = mapStoreInfo([
      entry("main", {
        name: "Сад Київ",
        postal_code: "01001",
        city: "Київ",
        street: "вул. Хрещатик, 1",
        latitude: "50.4501",
        longitude: "30.5234",
        hours: "пн–сб 9:00–21:00",
        opens: "9:00",
        closes: "21:00",
        phone: "+380 44 123 45 67",
        telegram: "https://t.me/sad_kyiv",
        legal_name: "ТОВ «Сад»",
        tax_id: "12345678",
      }),
    ]);

    expect(store).toEqual({
      name: "Сад Київ",
      postalCode: "01001",
      city: "Київ",
      street: "вул. Хрещатик, 1",
      latitude: 50.4501,
      longitude: 30.5234,
      hours: "пн–сб 9:00–21:00",
      opens: "9:00",
      closes: "21:00",
      phone: "+380 44 123 45 67",
      phoneHref: "tel:+380441234567",
      telegramHandle: "@sad_kyiv",
      telegramUrl: "https://t.me/sad_kyiv",
      legalName: "ТОВ «Сад»",
      taxId: "12345678",
    });
  });

  it("повертає null, якщо запису немає або він без полів", () => {
    expect(mapStoreInfo([])).toBeNull();
    expect(mapStoreInfo(null)).toBeNull();
    expect(mapStoreInfo([entry("main", {})])).toBeNull();
    expect(mapStoreInfo([broken({ handle: "main" })])).toBeNull();
  });

  it("порожні й зіпсовані поля бере із запасних даних, пов'язані поля — парами", () => {
    const store = mapStoreInfo([
      entry("main", {
        name: "Сад на Соборній",
        city: null,
        latitude: "49.2331",
        longitude: "схід",
        opens: "10:00",
        closes: "пізно",
        phone: "12-34",
        telegram: "це не назва!",
      }),
    ]);

    expect(store).toEqual({ ...STORE_INFO, name: "Сад на Соборній" });
  });

  it("відкидає координати поза межами глобуса", () => {
    const store = mapStoreInfo([
      entry("main", { name: "Сад", latitude: "149.2", longitude: "28.4" }),
    ]);

    expect(store?.latitude).toBe(STORE_INFO.latitude);
    expect(store?.longitude).toBe(STORE_INFO.longitude);
  });
});

describe("mapReviewsRating", () => {
  const rating = (fields: Record<string, string | null>) =>
    mapReviewsRating([entry("main", fields)]);
  const url = "https://www.google.com/maps/place/sad";

  it("читає оцінку, кількість відгуків і посилання", () => {
    expect(
      rating({ google_rating: "4.9", google_reviews_count: "412", google_reviews_url: url }),
    ).toEqual({ value: 4.9, count: 412, url });
  });

  it("приймає оцінку з десятковою комою", () => {
    expect(
      rating({ google_rating: "4,8", google_reviews_count: "10", google_reviews_url: url })?.value,
    ).toBe(4.8);
  });

  it("повертає null, якщо чогось бракує або значення неможливе", () => {
    expect(mapReviewsRating([])).toBeNull();
    expect(rating({ google_rating: "4.9", google_reviews_count: "412" })).toBeNull();
    expect(
      rating({ google_rating: "7", google_reviews_count: "412", google_reviews_url: url }),
    ).toBeNull();
    expect(
      rating({ google_rating: "4.9", google_reviews_count: "багато", google_reviews_url: url }),
    ).toBeNull();
    expect(
      rating({ google_rating: "4.9", google_reviews_count: "412", google_reviews_url: "/reviews" }),
    ).toBeNull();
  });
});

/* Колекції: відповідь HOME_COLLECTIONS_QUERY, псевдонім збігається з handle. */

function collection(
  handle: string,
  title: string,
  productIds: string[],
  cheapest: string | null,
  image: typeof IMAGE | null = null,
) {
  return {
    handle,
    title,
    image,
    cheapest: {
      nodes: cheapest
        ? [
            {
              featuredImage: { ...IMAGE, url: `https://cdn.shopify.com/${handle}-cheapest.png` },
              priceRange: { minVariantPrice: { amount: cheapest, currencyCode: "UAH" } },
            },
          ]
        : [],
    },
    counted: { nodes: productIds.map((id) => ({ id: `gid://shopify/Product/${id}` })) },
  };
}

function collections(overrides: Record<string, unknown> = {}): HomeCollectionsData {
  return {
    iphone: collection("iphone", "iPhone", ["1", "2"], "31999.0", IMAGE),
    mac: collection("mac", "Mac", ["3"], "49999.0"),
    ipad: collection("ipad", "iPad", ["3", "4"], "28999.0"),
    watch: collection("watch", "Watch", ["5", "6"], "12999.0"),
    airpods: collection("airpods", "AirPods", ["7", "8"], "8999.0"),
    accessories: collection("accessories", "Аксесуари", ["9", "10", "11"], "599.0"),
    used: collection("used", "Вживані", ["2", "5"], "12999.0"),
    students: collection("students", "Для навчання", ["3", "4"], "28999.0"),
    deals: collection("deals", "Знижки", ["6", "7", "9"], "1599.0"),
    ...overrides,
  } as HomeCollectionsData;
}

describe("mapBentoCategories", () => {
  it("будує плитки в порядку демо-сітки: назва, посилання, кількість і ціна «від»", () => {
    const categories = mapBentoCategories(collections());

    expect(categories.map((category) => category.to)).toEqual([
      "/collections/iphone",
      "/collections/mac",
      "/collections/ipad",
      "/collections/watch",
      "/collections/airpods",
      "/collections/accessories",
      "/collections/used",
    ]);
    expect(categories[0]).toEqual({
      title: "iPhone",
      to: "/collections/iphone",
      image: IMAGE,
      productCount: 2,
      priceFrom: { amount: "31999.0", currencyCode: "UAH" },
    });
  });

  it("без фото колекції бере фото найдешевшого товару", () => {
    const mac = mapBentoCategories(collections())[1];

    expect(mac?.image?.url).toBe("https://cdn.shopify.com/mac-cheapest.png");
  });

  it("пропускає колекції, яких немає або які порожні", () => {
    const categories = mapBentoCategories(
      collections({ mac: null, watch: collection("watch", "Watch", [], null) }),
    );

    expect(categories.map((category) => category.title)).toEqual([
      "iPhone",
      "iPad",
      "AirPods",
      "Аксесуари",
      "Вживані",
    ]);
  });

  it("бере назву з навігації, якщо в колекції вона порожня, і приймає власний перелік", () => {
    const categories = mapBentoCategories(
      collections({ deals: collection("deals", " ", ["1"], "999.0") }),
      [
        { title: "Знижки", to: "/collections/deals" },
        { title: "Немає такої", to: "/collections/toString" },
      ],
    );

    expect(categories).toHaveLength(1);
    expect(categories[0]).toMatchObject({ title: "Знижки", productCount: 1 });
  });

  it("не падає без даних і на зіпсованій колекції", () => {
    expect(mapBentoCategories(null)).toEqual([]);
    expect(mapBentoCategories(undefined)).toEqual([]);
    expect(
      mapBentoCategories(collections({ iphone: { handle: "iphone", title: "iPhone" } })).map(
        (category) => category.title,
      ),
    ).not.toContain("iPhone");

    const [noPrice] = mapBentoCategories(
      collections({
        iphone: {
          handle: "iphone",
          title: "iPhone",
          image: null,
          counted: { nodes: [{ id: "1" }] },
        },
      }),
    );
    expect(noPrice).toEqual({
      title: "iPhone",
      to: "/collections/iphone",
      image: null,
      productCount: 1,
      priceFrom: null,
    });
  });
});

describe("countCatalogProducts", () => {
  it("рахує товар із кількох колекцій один раз", () => {
    expect(countCatalogProducts(collections())).toBe(11);
  });

  it("повертає 0 без даних", () => {
    expect(countCatalogProducts(null)).toBe(0);
  });
});

describe("buildHomeContent", () => {
  const metaobjects: HomeMetaobjectsData = {
    banners: {
      nodes: [entry("promo", { title: "Банер із магазину", link: "/collections/deals" })],
    },
    usps: { nodes: [entry("usp-01", { icon: "truck", title: "Перевага з магазину" })] },
    faq: { nodes: [entry("faq-01", { question: "Питання з магазину", answer: "Відповідь" })] },
    reviews: { nodes: [entry("review-01", { name: "Покупець", text: "Відгук із магазину" })] },
    aboutStats: { nodes: [entry("stat-01", { value: "10 років", label: "із магазину" })] },
    storeInfo: {
      nodes: [
        entry("main", {
          name: "Сад із магазину",
          google_rating: "4.7",
          google_reviews_count: "50",
          google_reviews_url: "https://www.google.com/maps/place/sad",
        }),
      ],
    },
  };
  const article = {
    handle: "z-mahazynu",
    title: "Стаття з магазину",
    excerpt: "Уривок",
    image: null,
    publishedAt: "2026-11-10T07:00:00Z",
  };

  it("без даних магазину повертає запасний вміст", () => {
    expect(buildHomeContent({})).toEqual(HOME_CONTENT);
    expect(buildHomeContent({ metaobjects: null, collections: null, articles: null })).toEqual(
      HOME_CONTENT,
    );
  });

  it("порожні відповіді (mock.shop) теж лишають запасний вміст", () => {
    const empty: HomeMetaobjectsData = {
      banners: { nodes: [] },
      usps: { nodes: [] },
      faq: { nodes: [] },
      reviews: { nodes: [] },
      aboutStats: { nodes: [] },
      storeInfo: { nodes: [] },
    };

    expect(buildHomeContent({ metaobjects: empty, articles: [] })).toEqual(HOME_CONTENT);
  });

  it("замінює вміст секцій записами з магазину", () => {
    const content = buildHomeContent({
      metaobjects,
      collections: collections(),
      articles: [article, article, article, article],
    });

    expect(content.banners.map((banner) => banner.title)).toEqual(["Банер із магазину"]);
    expect(content.usps.map((usp) => usp.title)).toEqual(["Перевага з магазину"]);
    expect(content.faq.items).toEqual([{ question: "Питання з магазину", answer: "Відповідь" }]);
    expect(content.reviews.items.map((review) => review.name)).toEqual(["Покупець"]);
    expect(content.reviews.rating).toEqual({
      value: 4.7,
      count: 50,
      url: "https://www.google.com/maps/place/sad",
    });
    expect(content.about.stats).toEqual([{ value: "10 років", label: "із магазину" }]);
    expect(content.store.name).toBe("Сад із магазину");
    expect(content.bento.categories).toHaveLength(7);
    expect(content.bento.totalProducts).toBe(11);
    expect(content.articles.items).toHaveLength(3);
    expect(content.articles.items[0]?.title).toBe("Стаття з магазину");
  });

  it("не чіпає те, чим магазин не керує", () => {
    const content = buildHomeContent({ metaobjects, collections: collections() });

    expect(content.faq.description).toBe(HOME_CONTENT.faq.description);
    expect(content.about.points).toBe(HOME_CONTENT.about.points);
    expect(content.about.team).toBe(HOME_CONTENT.about.team);
    expect(content.articles.content).toBe(HOME_CONTENT.articles.content);
    expect(content.promo).toBe(HOME_CONTENT.promo);
    expect(content.seo).toBe(HOME_CONTENT.seo);
    expect(content.store.phone).toBe(HOME_CONTENT.store.phone);
  });

  it("секція з самими зіпсованими записами лишається на запасному вмісті, решта — з магазину", () => {
    const content = buildHomeContent({
      metaobjects: {
        ...metaobjects,
        faq: { nodes: [entry("faq-01", { question: "Питання без відповіді" })] },
      },
    });

    expect(content.faq.items).toBe(HOME_CONTENT.faq.items);
    expect(content.usps.map((usp) => usp.title)).toEqual(["Перевага з магазину"]);
  });

  it("приймає часткову відповідь, у якій частини типів немає", () => {
    const content = buildHomeContent({ metaobjects: { faq: metaobjects.faq } });

    expect(content.faq.items).toEqual([{ question: "Питання з магазину", answer: "Відповідь" }]);
    expect(content.banners).toBe(HOME_CONTENT.banners);
    expect(content.store).toBe(HOME_CONTENT.store);
  });

  it("лишає демо-сітку каталогу, якщо в магазині замало колекцій каталогу", () => {
    const sparse = {
      iphone: null,
      mac: null,
      ipad: null,
      watch: null,
      airpods: null,
      accessories: collection("accessories", "Accessories", ["1", "2"], "25.0"),
      used: null,
      students: null,
      deals: null,
    } as HomeCollectionsData;

    expect(buildHomeContent({ collections: sparse }).bento).toBe(HOME_CONTENT.bento);
  });
});

describe("loadHomeContent", () => {
  type Client = Parameters<typeof loadHomeContent>[0];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Клієнт, який відповідає на запит залежно від документа. */
  function clientWith(respond: (query: unknown) => unknown) {
    const graphql = vi.fn(async (query: unknown) => respond(query));
    return { client: { graphql } as unknown as Client, graphql };
  }

  it("читає метаоб'єкти, колекції та блог і збирає вміст", async () => {
    const { client, graphql } = clientWith((query) => {
      if (query === HOME_METAOBJECTS_QUERY) {
        return {
          data: {
            banners: { nodes: [] },
            usps: { nodes: [] },
            faq: {
              nodes: [entry("faq-01", { question: "Питання з магазину", answer: "Відповідь" })],
            },
            reviews: { nodes: [] },
            aboutStats: { nodes: [] },
            storeInfo: { nodes: [] },
          },
        };
      }
      if (query === HOME_COLLECTIONS_QUERY) return { data: collections() };
      return {
        data: {
          blog: {
            id: "gid://shopify/Blog/1",
            handle: "blog",
            title: "Блог",
            seo: { title: null, description: null },
            articles: {
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              nodes: [
                {
                  id: "gid://shopify/Article/1",
                  handle: "z-mahazynu",
                  title: "Стаття з магазину",
                  excerpt: "Уривок",
                  publishedAt: "2026-11-10T07:00:00Z",
                  image: null,
                },
              ],
            },
          },
        },
      };
    });

    const content = await loadHomeContent(client);

    expect(graphql).toHaveBeenCalledTimes(3);
    expect(content.faq.items).toEqual([{ question: "Питання з магазину", answer: "Відповідь" }]);
    expect(content.bento.totalProducts).toBe(11);
    expect(content.articles.items.map((item) => item.handle)).toEqual(["z-mahazynu"]);
    expect(content.banners).toBe(HOME_CONTENT.banners);
  });

  it("на магазині без метаоб'єктів, колекцій і блогу повертає запасний вміст", async () => {
    const { client } = clientWith((query) => {
      if (query === HOME_METAOBJECTS_QUERY) {
        return {
          data: {
            banners: { nodes: [] },
            usps: { nodes: [] },
            faq: { nodes: [] },
            reviews: { nodes: [] },
            aboutStats: { nodes: [] },
            storeInfo: { nodes: [] },
          },
        };
      }
      if (query === HOME_COLLECTIONS_QUERY) {
        return {
          data: collections({ iphone: null, mac: null, ipad: null, watch: null, airpods: null }),
        };
      }
      return { data: { blog: null } };
    });

    expect(await loadHomeContent(client)).toEqual(HOME_CONTENT);
  });

  const EMPTY_METAOBJECTS = {
    banners: { nodes: [] },
    usps: { nodes: [] },
    faq: { nodes: [] },
    reviews: { nodes: [] },
    aboutStats: { nodes: [] },
    storeInfo: { nodes: [] },
  };
  const thrownBy = (promise: Promise<unknown>) => promise.catch((thrown: unknown) => thrown);

  it("кешує метаоб'єкти, колекції та блог надовго", async () => {
    const { client, graphql } = clientWith((query) => {
      if (query === HOME_METAOBJECTS_QUERY) return { data: EMPTY_METAOBJECTS };
      if (query === HOME_COLLECTIONS_QUERY) return { data: collections() };
      return { data: { blog: null } };
    });

    await loadHomeContent(client);

    for (const call of graphql.mock.calls as unknown as [unknown, { cache?: unknown }][]) {
      expect(call[1]?.cache).toMatchObject({ mode: "public", maxAge: 3600 });
    }
  });

  it("відповідь лише з errors і без data — 502, а не демо-вміст", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith((query) => {
      if (query === HOME_METAOBJECTS_QUERY) {
        return { data: null, errors: [{ message: "Throttled. Request ID: secret-123" }] };
      }
      if (query === HOME_COLLECTIONS_QUERY) return { data: collections() };
      return { data: { blog: null } };
    });

    const error = await thrownBy(loadHomeContent(client));

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(502);
    expect(await (error as Response).text()).not.toContain("secret-123");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("secret-123"));
  });

  it("помилка блогу — теж 502: демо-статті не підміняють справжні під час збою", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith((query) => {
      if (query === HOME_METAOBJECTS_QUERY) return { data: EMPTY_METAOBJECTS };
      if (query === HOME_COLLECTIONS_QUERY) return { data: collections() };
      return { data: { blog: null }, errors: [{ message: "Access denied" }] };
    });

    expect(((await thrownBy(loadHomeContent(client))) as Response).status).toBe(502);
  });

  it("збій мережі не перехоплюється", async () => {
    const { client } = clientWith((query) => {
      if (query === HOME_METAOBJECTS_QUERY) throw new Error("Storefront API недоступний");
      if (query === HOME_COLLECTIONS_QUERY) return { data: collections() };
      return { data: { blog: null } };
    });

    await expect(loadHomeContent(client)).rejects.toThrow("Storefront API недоступний");
  });

  it("часткова відповідь: секція з помилкою лишається на запасному вмісті, решта — з магазину", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith((query) => {
      if (query === HOME_METAOBJECTS_QUERY) {
        return {
          data: {
            ...EMPTY_METAOBJECTS,
            banners: null,
            faq: {
              nodes: [entry("faq-01", { question: "Питання з магазину", answer: "Відповідь" })],
            },
          },
          errors: [{ message: "Access denied for metaobjects", path: ["banners"] }],
        };
      }
      if (query === HOME_COLLECTIONS_QUERY) return { data: collections() };
      return { data: { blog: null } };
    });

    const content = await loadHomeContent(client);

    expect(content.banners).toBe(HOME_CONTENT.banners);
    expect(content.faq.items).toEqual([{ question: "Питання з магазину", answer: "Відповідь" }]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("banners"));
  });
});
