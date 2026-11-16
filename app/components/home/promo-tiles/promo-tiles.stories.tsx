import type { Meta, StoryObj } from "@storybook/react-vite";

import { PromoTiles } from "./promo-tiles";
import { DEMO_PROMO_NEW, DEMO_PROMO_SALE, DEMO_PROMO_TRADE_IN } from "./promo-tiles.demo";

const meta = {
  title: "Home/PromoTiles",
  component: PromoTiles,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    newProduct: DEMO_PROMO_NEW,
    saleProduct: DEMO_PROMO_SALE,
    tradeIn: DEMO_PROMO_TRADE_IN,
  },
} satisfies Meta<typeof PromoTiles>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Вузька колонка праворуч від hero: три плитки стовпчиком. */
export const Column: Story = {
  decorators: [
    (Story) => (
      <div className="h-160 max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Широка клітинка (планшет, плитки під hero): три колонки. */
export const Row: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};
