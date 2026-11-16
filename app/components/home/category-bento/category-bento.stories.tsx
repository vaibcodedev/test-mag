import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryBento } from "./category-bento";
import { DEMO_BENTO_CATEGORIES, DEMO_BENTO_TOTAL_PRODUCTS } from "./category-bento.demo";

const meta = {
  title: "Home/CategoryBento",
  component: CategoryBento,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { categories: DEMO_BENTO_CATEGORIES, totalProducts: DEMO_BENTO_TOTAL_PRODUCTS },
} satisfies Meta<typeof CategoryBento>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Сім категорій: два повні ряди по чотири клітинки. */
export const Default: Story = {};

/** Шість категорій: остання плитка розтягується на вільну клітинку. */
export const SixCategories: Story = {
  args: { categories: DEMO_BENTO_CATEGORIES.slice(0, 6), totalProducts: 231 },
};

export const WithoutPrices: Story = {
  args: {
    categories: DEMO_BENTO_CATEGORIES.map((category) => ({ ...category, priceFrom: null })),
  },
};
