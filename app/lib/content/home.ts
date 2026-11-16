import {
  ABOUT_DEMO_DESCRIPTION,
  ABOUT_DEMO_POINTS,
  ABOUT_DEMO_STATS,
  ABOUT_DEMO_TEAM,
} from "~/components/home/about";
import { ARTICLES_DEMO, ARTICLES_DEMO_CONTENT } from "~/components/home/articles";
import { DEMO_BENTO_CATEGORIES, DEMO_BENTO_TOTAL_PRODUCTS } from "~/components/home/category-bento";
import { DEALS_DEMO_CONTENT } from "~/components/home/deals";
import { DEALS_TICKER_DEMO_ITEMS } from "~/components/home/deals-ticker";
import { FAQ_DEMO_DESCRIPTION, FAQ_DEMO_ITEMS } from "~/components/home/faq";
import { DEMO_HOME_BANNERS } from "~/components/home/hero-slider";
import { DEMO_IPHONE_LINEUP } from "~/components/home/iphone-lineup";
import { NEWSLETTER_DEMO_CONTENT } from "~/components/home/newsletter";
import {
  POPULAR_PRODUCTS_DEMO_CONTENT,
  POPULAR_PRODUCTS_DEMO_TABS,
} from "~/components/home/popular-products";
import {
  DEMO_PROMO_NEW,
  DEMO_PROMO_SALE,
  DEMO_PROMO_TRADE_IN,
} from "~/components/home/promo-tiles";
import { REVIEWS_DEMO, REVIEWS_DEMO_RATING } from "~/components/home/reviews";
import {
  SEO_BLOCK_DEMO_BUYER_LINKS,
  SEO_BLOCK_DEMO_MODELS,
  SEO_BLOCK_DEMO_PARAGRAPHS,
  SEO_BLOCK_DEMO_QUERIES,
  SEO_BLOCK_DEMO_TITLE,
} from "~/components/home/seo-block";
import { SERVICES_DEMO_CONTENT } from "~/components/home/services";
import { SHOWROOM_DEMO_DELIVERY, SHOWROOM_DEMO_DESCRIPTION } from "~/components/home/showroom";
import { USED_DEVICES_DEMO_CONTENT } from "~/components/home/used-devices";
import { DEMO_USPS } from "~/components/home/usp-strip";

import { STORE_INFO } from "./site";

/**
 * Увесь редакційний вміст головної.
 *
 * TODO(реальний магазин): замінити на читання метаоб'єктів (home_banner, usp, faq_item,
 * review, about_stat, store_info), статей блогу та колекцій, щоб головною керували з
 * адмінки. На mock.shop метаоб'єктів немає, тому поки це демо-дані з ТЗ. Цифри та відгуки
 * в них вигадані й не повинні потрапити на справжній сайт.
 */
export const HOME_CONTENT = {
  store: STORE_INFO,
  banners: DEMO_HOME_BANNERS,
  promo: { newProduct: DEMO_PROMO_NEW, saleProduct: DEMO_PROMO_SALE, tradeIn: DEMO_PROMO_TRADE_IN },
  usps: DEMO_USPS,
  bento: { categories: DEMO_BENTO_CATEGORIES, totalProducts: DEMO_BENTO_TOTAL_PRODUCTS },
  deals: { content: DEALS_DEMO_CONTENT, tickerItems: DEALS_TICKER_DEMO_ITEMS },
  popular: { content: POPULAR_PRODUCTS_DEMO_CONTENT, tabs: POPULAR_PRODUCTS_DEMO_TABS },
  used: { content: USED_DEVICES_DEMO_CONTENT },
  iphoneLineup: DEMO_IPHONE_LINEUP,
  services: SERVICES_DEMO_CONTENT,
  about: {
    description: ABOUT_DEMO_DESCRIPTION,
    points: ABOUT_DEMO_POINTS,
    team: ABOUT_DEMO_TEAM,
    stats: ABOUT_DEMO_STATS,
  },
  reviews: { rating: REVIEWS_DEMO_RATING, items: REVIEWS_DEMO },
  articles: { content: ARTICLES_DEMO_CONTENT, items: ARTICLES_DEMO },
  faq: { description: FAQ_DEMO_DESCRIPTION, items: FAQ_DEMO_ITEMS },
  showroom: { description: SHOWROOM_DEMO_DESCRIPTION, delivery: SHOWROOM_DEMO_DELIVERY },
  seo: {
    title: SEO_BLOCK_DEMO_TITLE,
    paragraphs: SEO_BLOCK_DEMO_PARAGRAPHS,
    popularModels: SEO_BLOCK_DEMO_MODELS,
    buyerLinks: SEO_BLOCK_DEMO_BUYER_LINKS,
    popularQueries: SEO_BLOCK_DEMO_QUERIES,
  },
  newsletter: NEWSLETTER_DEMO_CONTENT,
};

export type HomeContent = typeof HOME_CONTENT;
