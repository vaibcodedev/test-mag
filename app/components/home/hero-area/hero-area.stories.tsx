import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_CATEGORY_PILLS } from "~/components/home/category-pills";
import { DEMO_HOME_BANNERS } from "~/components/home/hero-slider";
import {
  DEMO_PROMO_NEW,
  DEMO_PROMO_SALE,
  DEMO_PROMO_TRADE_IN,
} from "~/components/home/promo-tiles";

import { HeroArea } from "./hero-area";

const meta = {
  title: "Home/HeroArea",
  component: HeroArea,
  parameters: { surface: "page", layout: "fullscreen" },
  args: {
    title: "Інтернет-магазин техніки Apple у Вінниці та по Україні",
    banners: DEMO_HOME_BANNERS,
    promo: {
      newProduct: DEMO_PROMO_NEW,
      saleProduct: DEMO_PROMO_SALE,
      tradeIn: DEMO_PROMO_TRADE_IN,
    },
    categories: DEMO_CATEGORY_PILLS,
  },
} satisfies Meta<typeof HeroArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
