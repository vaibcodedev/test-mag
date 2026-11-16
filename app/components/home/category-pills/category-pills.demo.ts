import { demoImage } from "~/components/home/home.fixtures";

import type { CategoryPill } from "./category-pills";

// TODO(реальний магазин): це не метаоб'єкт, а колекції магазину (iphone, mac, ipad, watch,
// airpods, accessories, used, deals): назва, handle і фото колекції зі Storefront API.
export const DEMO_CATEGORY_PILLS: CategoryPill[] = [
  { title: "iPhone", to: "/collections/iphone", image: demoImage(0) },
  { title: "Mac", to: "/collections/mac", image: demoImage(1) },
  { title: "iPad", to: "/collections/ipad", image: demoImage(4) },
  { title: "Watch", to: "/collections/watch", image: demoImage(2) },
  { title: "AirPods", to: "/collections/airpods", image: demoImage(3) },
  { title: "Аксесуари", to: "/collections/accessories", image: demoImage(1) },
  { title: "Вживані", to: "/collections/used", image: demoImage(0) },
  { title: "Знижки", to: "/collections/deals", image: null },
];
