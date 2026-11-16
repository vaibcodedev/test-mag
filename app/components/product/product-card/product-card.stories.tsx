import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductCard } from "./product-card";
import { ProductCardSkeleton } from "./product-card-skeleton";
import type { ProductCardData } from "./product-card.types";

/** Демо-фото з mock.shop; у магазині сюди приходить featuredImage товару. */
const DEMO_IMAGE = {
  url: "https://cdn.shopify.com/mock-shop-production-media/_image_studio/ea62fe2c-4ccf-4787-9cf0-dbfa4a4f2747/2c9dfe14599dfdf016b15700528a30f9822ad13cb9e2095ad6000685fa06a18a.png",
  altText: "",
  width: 928,
  height: 1152,
};

const BASE: ProductCardData = {
  handle: "iphone-17-pro-256-blue",
  title: "iPhone 17 Pro 256 ГБ, синій титан",
  image: DEMO_IMAGE,
  price: { amount: "64999", currencyCode: "UAH" },
  availableForSale: true,
  rating: { value: 4.9, count: 128 },
  delivery: "доставимо завтра",
};

const meta = {
  title: "Product/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  // Без wishlisted / compared картка сама зберігає обране й порівняння в localStorage.
  args: { product: BASE, adding: false },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    product: {
      ...BASE,
      badge: "Хіт",
      colors: [
        { name: "Синій титан", hex: "#3c4a5e" },
        { name: "Срібний", hex: "#e3e4e5" },
      ],
    },
  },
};

export const Sale: Story = {
  args: {
    product: {
      ...BASE,
      title: "MacBook Air 13 M4 16/256 ГБ, темна ніч",
      price: { amount: "49999", currencyCode: "UAH" },
      compareAtPrice: { amount: "54499", currencyCode: "UAH" },
      installmentMonths: 24,
    },
  },
};

export const New: Story = {
  args: { product: { ...BASE, title: "iPad Air 11 M3 128 ГБ Wi-Fi, синій", badge: "Новинка" } },
};

export const Used: Story = {
  args: {
    product: {
      ...BASE,
      title: "iPhone 15 Pro 128 ГБ, натуральний титан",
      price: { amount: "31999", currencyCode: "UAH" },
      used: { grade: "Відмінний", batteryHealth: 91 },
    },
  },
};

export const SoldOut: Story = {
  args: {
    product: { ...BASE, title: "AirPods Max USB-C, темна ніч", availableForSale: false },
  },
};

export const Adding: Story = { args: { adding: true } };

/** Стан обраного й порівняння задано ззовні: картка не чіпає сховище. */
export const Controlled: Story = { args: { wishlisted: true, compared: true } };

export const Loading: Story = { render: () => <ProductCardSkeleton /> };
