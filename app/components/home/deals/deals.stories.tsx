import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEALS_TICKER_DEMO_ITEMS } from "~/components/home/deals-ticker";
import { DEMO_PRODUCTS } from "~/components/home/home.fixtures";

import { Deals } from "./deals";
import { DEALS_DEMO_CONTENT } from "./deals.demo";

const DAY = 24 * 60 * 60 * 1000;

/** Лише товари зі знижкою. */
const SALE_PRODUCTS = DEMO_PRODUCTS.filter((product) => product.compareAtPrice);

const meta = {
  title: "Home/Deals",
  component: Deals,
  parameters: { surface: "page" },
  args: {
    content: DEALS_DEMO_CONTENT,
    products: [...SALE_PRODUCTS, ...DEMO_PRODUCTS].slice(0, 4),
    // Від моменту відкриття Storybook, щоб відлік завжди був живий.
    endsAt: new Date(Date.now() + 3 * DAY).toISOString(),
    tickerItems: DEALS_TICKER_DEMO_ITEMS,
  },
} satisfies Meta<typeof Deals>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Finished: Story = { args: { endsAt: "2026-01-01T00:00:00+02:00" } };
