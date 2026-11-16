import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_PRODUCTS } from "~/components/home/home.fixtures";

import { PopularProducts } from "./popular-products";
import { POPULAR_PRODUCTS_DEMO_CONTENT, POPULAR_PRODUCTS_DEMO_TABS } from "./popular-products.demo";

const meta = {
  title: "Home/PopularProducts",
  component: PopularProducts,
  parameters: { surface: "page" },
  args: {
    content: POPULAR_PRODUCTS_DEMO_CONTENT,
    products: DEMO_PRODUCTS,
    tabs: POPULAR_PRODUCTS_DEMO_TABS,
  },
} satisfies Meta<typeof PopularProducts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutTabs: Story = { args: { tabs: [] } };
