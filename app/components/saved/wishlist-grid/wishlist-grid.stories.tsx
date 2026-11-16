import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_PRODUCTS } from "~/components/home/home.fixtures";

import { WishlistGrid } from "./wishlist-grid";

/** Сердечко на картках працює: стан обраного зберігається в localStorage браузера. */
const meta = {
  title: "Saved/WishlistGrid",
  component: WishlistGrid,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { products: DEMO_PRODUCTS.slice(0, 5), pendingCount: 0, addingHandle: null },
} satisfies Meta<typeof WishlistGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Перше завантаження: дані ще не прийшли, на місці карток заглушки. */
export const Loading: Story = { args: { products: [], pendingCount: 5 } };

/** Частина товарів уже в пам'яті, решта довантажується. */
export const PartlyLoaded: Story = {
  args: { products: DEMO_PRODUCTS.slice(0, 2), pendingCount: 2 },
};

export const Adding: Story = { args: { addingHandle: DEMO_PRODUCTS[0]?.handle } };
