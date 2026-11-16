import type { Meta, StoryObj } from "@storybook/react-vite";
import { DEMO_PRODUCTS } from "~/components/home/home.fixtures";

import { RelatedProducts } from "./related-products";

const meta = {
  title: "Product/RelatedProducts",
  component: RelatedProducts,
  parameters: { surface: "page" },
  args: { products: DEMO_PRODUCTS.slice(0, 4), onAddToCart: () => {} },
} satisfies Meta<typeof RelatedProducts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Adding: Story = { args: { addingHandle: DEMO_PRODUCTS[0]?.handle } };
