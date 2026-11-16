import type { ProductCardData, ProductCardImage } from "~/components/product/product-card";
import type { Money } from "~/lib/format";

/** Демо-ціна в гривні. */
export function uah(amount: number): Money {
  return { amount: String(amount), currencyCode: "UAH" };
}

type DemoCard = { label: string; product: Omit<ProductCardData, "image"> };

/** Усі стани картки товару. Фото підставляються з магазину в loader маршруту. */
export const DEMO_CARDS: DemoCard[] = [
  {
    label: "Звичайна",
    product: {
      handle: "iphone-17-pro-256-blue",
      title: "iPhone 17 Pro 256 ГБ, синій титан",
      price: uah(64999),
      availableForSale: true,
      badge: "Хіт",
      rating: { value: 4.9, count: 128 },
      delivery: "доставимо завтра",
      colors: [
        { name: "Синій титан", hex: "#3c4a5e" },
        { name: "Срібний", hex: "#e3e4e5" },
        { name: "Космічний помаранчевий", hex: "#f77e2d" },
      ],
    },
  },
  {
    label: "Знижка",
    product: {
      handle: "macbook-air-13-m4-256-midnight",
      title: "MacBook Air 13 M4 16/256 ГБ, темна ніч",
      price: uah(49999),
      compareAtPrice: uah(54499),
      availableForSale: true,
      rating: { value: 4.8, count: 64 },
      installmentMonths: 24,
      delivery: "доставимо завтра",
    },
  },
  {
    label: "Новинка",
    product: {
      handle: "ipad-air-11-m3-128-blue",
      title: "iPad Air 11 M3 128 ГБ Wi-Fi, синій",
      price: uah(28999),
      availableForSale: true,
      badge: "Новинка",
      rating: { value: 5, count: 12 },
      delivery: "доставимо 18 листопада",
    },
  },
  {
    label: "Вживаний",
    product: {
      handle: "used-iphone-15-pro-128-natural",
      title: "iPhone 15 Pro 128 ГБ, натуральний титан",
      price: uah(31999),
      availableForSale: true,
      rating: { value: 4.7, count: 9 },
      delivery: "доставимо завтра",
      used: { grade: "Відмінний", batteryHealth: 91 },
    },
  },
  {
    label: "Немає в наявності",
    product: {
      handle: "airpods-max-usb-c-midnight",
      title: "AirPods Max USB-C, темна ніч",
      price: uah(26499),
      compareAtPrice: uah(27999),
      availableForSale: false,
      rating: { value: 4.6, count: 41 },
    },
  },
];

export function withImage(
  product: DemoCard["product"],
  image: ProductCardImage | undefined,
): ProductCardData {
  return { ...product, image: image ?? null };
}
