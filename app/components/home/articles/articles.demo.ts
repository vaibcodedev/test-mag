import type { ArticleCardData, ArticlesContent } from "./articles";

/**
 * TODO(реальний магазин): заголовок і підписи читати з метаоб'єкта `home_articles`;
 * самі статті — три останні з блогу `blog` (Storefront API: blog.articles).
 */
export const ARTICLES_DEMO_CONTENT: ArticlesContent = {
  title: "Поради з блогу",
  description: "Пишемо про те, що самі пояснюємо покупцям у шоурумі.",
  link: { title: "Усі статті", to: "/blogs/blog" },
  readMore: "Читати",
};

const CDN =
  "https://cdn.shopify.com/mock-shop-production-media/_image_studio/ea62fe2c-4ccf-4787-9cf0-dbfa4a4f2747";

function image(file: string) {
  return { url: `${CDN}/${file}.png`, altText: "", width: 928, height: 1152 };
}

export const ARTICLES_DEMO: ArticleCardData[] = [
  {
    handle: "yakyi-iphone-kupyty-u-2026",
    title: "Який iPhone купити у 2026 році",
    excerpt:
      "Порівнюємо шість актуальних моделей: кому вистачить базової, а кому справді потрібна Pro-камера.",
    image: image("2c9dfe14599dfdf016b15700528a30f9822ad13cb9e2095ad6000685fa06a18a"),
    publishedAt: "2026-11-10T09:00:00+02:00",
  },
  {
    handle: "yak-pereviryty-vzhyvanyi-iphone",
    title: "Як перевірити вживаний iPhone перед покупкою",
    excerpt:
      "IMEI, стан акумулятора, сліди ремонту й прив'язка до iCloud: короткий список, з яким не купите кота в мішку.",
    image: image("67830b8beefa80ecc47c1664cad1f86de52c5c5461ba5e0a5754cdcf726ad900"),
    publishedAt: "2026-10-28T09:00:00+02:00",
  },
  {
    handle: "macbook-dlia-navchannia",
    title: "MacBook для навчання: Air чи Pro",
    excerpt:
      "Скільки пам'яті брати студенту, чи потрібен 15-дюймовий екран і на чому можна зекономити без шкоди.",
    image: image("c49583e8723152603f72ad28dcca1d4ec9f5d89305abeec15cb609593f3e6d1e"),
    publishedAt: "2026-10-14T09:00:00+03:00",
  },
];
